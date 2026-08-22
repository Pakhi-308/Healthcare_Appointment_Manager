from datetime import date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.dependencies import require_role
from app.models.user import User, UserRole
from app.models.doctor import Doctor, DoctorLeave
from app.models.appointment import Appointment, AppointmentStatus
from app.models.notification import Notification, NotificationStatus
from app.models.clinical import VisitSummary
from app.schemas.doctor import (
    DoctorCreate,
    DoctorUpdate,
    DoctorOut,
    DoctorLeaveCreate,
)
from app.services.leave_service import leave_service

router = APIRouter()


@router.post("/doctors", response_model=DoctorOut)
def create_doctor_profile(
    req: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """Admin provisions a new doctor profile and user credentials."""
    existing_user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists.",
        )

    # 1. Create User
    new_user = User(
        email=req.email.lower().strip(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        phone=req.phone,
        role=UserRole.DOCTOR,
    )
    db.add(new_user)
    db.flush()

    # 2. Create Doctor Profile
    new_doctor = Doctor(
        user_id=new_user.id,
        specialization=req.specialization,
        bio=req.bio,
        consultation_fee=req.consultation_fee,
        slot_duration_minutes=req.slot_duration_minutes,
        working_hours_start=req.working_hours_start,
        working_hours_end=req.working_hours_end,
        working_days=req.working_days,
        room_number=req.room_number,
        experience_years=req.experience_years,
    )
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)

    return new_doctor


@router.put("/doctors/{doctor_id}", response_model=DoctorOut)
def update_doctor_profile(
    doctor_id: int,
    req: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR])),
):
    """Update doctor profile details."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    # Doctor can only update their own profile unless admin
    if current_user.role == UserRole.DOCTOR and doctor.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only edit your own doctor profile.")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/doctors/{doctor_id}")
def delete_doctor_profile(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """Admin deactivates/deletes a doctor profile."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    user = doctor.user
    db.delete(doctor)
    if user:
        db.delete(user)
    db.commit()
    return {"message": f"Doctor #{doctor_id} and associated user account removed successfully."}


@router.post("/doctors/{doctor_id}/leaves")
def mark_doctor_leave(
    doctor_id: int,
    req: DoctorLeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DOCTOR])),
):
    """
    Mark doctor on leave. Automatically cancels conflicting appointments,
    deletes calendar events, and sends rebooking links to affected patients.
    """
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    if current_user.role == UserRole.DOCTOR and doctor.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only set leaves for yourself.")

    result = leave_service.apply_doctor_leave(
        db=db,
        doctor_id=doctor_id,
        leave_date=req.leave_date,
        reason=req.reason or "Doctor Leave",
    )
    return result


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """Aggregate high-level platform health & booking analytics."""
    total_patients = db.query(User).filter(User.role == UserRole.PATIENT).count()
    total_doctors = db.query(Doctor).count()
    total_appointments = db.query(Appointment).count()
    booked_appointments = db.query(Appointment).filter(Appointment.status == AppointmentStatus.BOOKED).count()
    completed_appointments = db.query(Appointment).filter(Appointment.status == AppointmentStatus.COMPLETED).count()
    cancelled_appointments = db.query(Appointment).filter(Appointment.status == AppointmentStatus.CANCELLED).count()

    total_revenue = db.query(func.sum(Doctor.consultation_fee))\
        .join(Appointment, Appointment.doctor_id == Doctor.id)\
        .filter(Appointment.status.in_([AppointmentStatus.COMPLETED, AppointmentStatus.BOOKED]))\
        .scalar() or 0.0

    notifications_sent = db.query(Notification).filter(Notification.status == NotificationStatus.SENT).count()
    notifications_failed = db.query(Notification).filter(Notification.status == NotificationStatus.FAILED).count()
    ai_summaries_generated = db.query(VisitSummary).filter(VisitSummary.is_ai_generated == True).count()

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "active_bookings": booked_appointments,
        "completed_visits": completed_appointments,
        "cancelled_appointments": cancelled_appointments,
        "cancellation_rate": round((cancelled_appointments / total_appointments * 100), 1) if total_appointments > 0 else 0.0,
        "total_revenue": round(float(total_revenue), 2),
        "notifications_sent": notifications_sent,
        "notifications_failed": notifications_failed,
        "ai_summaries_generated": ai_summaries_generated,
    }
