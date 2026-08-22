from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentCancel,
    AppointmentReschedule,
)
from app.services.booking_service import booking_service
from app.services.email_service import email_service
from app.services.calendar_service import calendar_service

router = APIRouter()


@router.post("/", response_model=AppointmentOut)
def book_appointment(
    req: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Book a new appointment with concurrency-safe slot locking & AI pre-visit analysis."""
    appointment = booking_service.book_appointment_atomic(
        db=db,
        patient_id=current_user.id,
        doctor_id=req.doctor_id,
        slot_start=req.slot_start,
        slot_end=req.slot_end,
        raw_symptoms=req.raw_symptoms,
        duration_days=req.duration_days,
        severity_scale=req.severity_scale,
        additional_notes=req.additional_notes,
        hold_token=req.hold_token,
    )
    return appointment


@router.get("/my", response_model=List[AppointmentOut])
def get_my_appointments(
    status_filter: Optional[AppointmentStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve appointments for the authenticated user (Patient, Doctor, or Admin)."""
    query = db.query(Appointment)

    if current_user.role == UserRole.PATIENT:
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            return []
        query = query.filter(Appointment.doctor_id == doctor.id)
    elif current_user.role == UserRole.ADMIN:
        # Admin can view all appointments
        pass

    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appointments = query.order_by(desc(Appointment.slot_start)).all()
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment_details(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full appointment details including symptoms, AI triage, and prescription."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Check permission
    is_patient = appointment.patient_id == current_user.id
    is_doctor = appointment.doctor.user_id == current_user.id if appointment.doctor else False
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_patient or is_doctor or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view this appointment.")

    return appointment


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    req: AppointmentCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel an appointment and trigger calendar sync & email cancellation notices."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Appointment is already cancelled.")

    is_patient = appointment.patient_id == current_user.id
    is_doctor = appointment.doctor.user_id == current_user.id if appointment.doctor else False
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_patient or is_doctor or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this appointment.")

    appointment.status = AppointmentStatus.CANCELLED
    appointment.is_active = False
    appointment.cancel_reason = req.cancel_reason or "Cancelled by user"
    
    # Delete Google Calendar event
    if appointment.google_event_id:
        calendar_service.delete_event(db, appointment.patient_id, appointment.google_event_id)

    db.commit()
    db.refresh(appointment)

    # Send cancellation notifications
    slot_str = appointment.slot_start.strftime("%A, %b %d, %Y at %I:%M %p")
    if appointment.patient:
        email_service.send_appointment_cancellation(
            db=db,
            recipient_email=appointment.patient.email,
            recipient_name=appointment.patient.full_name,
            slot_time=slot_str,
            reason=appointment.cancel_reason
        )
    if appointment.doctor and appointment.doctor.user:
        email_service.send_appointment_cancellation(
            db=db,
            recipient_email=appointment.doctor.user.email,
            recipient_name=appointment.doctor.user.full_name,
            slot_time=slot_str,
            reason=appointment.cancel_reason
        )

    return appointment


@router.post("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule_appointment(
    appointment_id: int,
    req: AppointmentReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reschedule an existing appointment to a new slot."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    is_patient = appointment.patient_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_patient or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to reschedule this appointment.")

    new_start = req.new_slot_start
    new_end = req.new_slot_end
    if new_start.tzinfo:
        new_start = new_start.astimezone(timezone.utc).replace(tzinfo=None)
    if new_end.tzinfo:
        new_end = new_end.astimezone(timezone.utc).replace(tzinfo=None)

    # Check conflict
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.slot_start == new_start,
        Appointment.is_active == True,
        Appointment.id != appointment.id,
        Appointment.status == AppointmentStatus.BOOKED
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail="Requested slot is already booked.")

    appointment.slot_start = new_start
    appointment.slot_end = new_end
    appointment.status = AppointmentStatus.BOOKED
    appointment.is_active = True
    appointment.rebooking_token = None
    db.commit()
    db.refresh(appointment)

    # Notify patient and doctor
    slot_str = new_start.strftime("%A, %b %d, %Y at %I:%M %p")
    if appointment.patient and appointment.doctor and appointment.doctor.user:
        email_service.send_booking_confirmation(
            db=db,
            patient_email=appointment.patient.email,
            patient_name=appointment.patient.full_name,
            doctor_name=appointment.doctor.user.full_name,
            specialization=appointment.doctor.specialization,
            slot_time=slot_str,
            google_meet_link=appointment.google_meet_link
        )

    return appointment
