from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.models.appointment import Appointment, AppointmentStatus
from app.models.clinical import (
    VisitSummary,
    Prescription,
    MedicationReminder,
    ReminderStatus,
)
from app.schemas.clinical import (
    PostVisitClinicalNotesIn,
    VisitSummaryOut,
    PrescriptionOut,
    MedicationReminderOut,
)
from app.services.groq_service import groq_service

router = APIRouter()


@router.post("/{appointment_id}/notes", response_model=VisitSummaryOut)
def submit_clinical_notes_and_prescription(
    appointment_id: int,
    req: PostVisitClinicalNotesIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN])),
):
    """
    Doctor submits post-visit notes & prescription.
    Groq LLaMA 3.3 converts notes into patient-friendly instructions & medication reminders are scheduled.
    """
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Generate patient-friendly summary via Groq LLaMA 3.3 70B
    ai_summary_res = groq_service.generate_patient_summary(req.raw_clinical_notes)

    # 1. Update or create VisitSummary
    visit_summary = db.query(VisitSummary).filter(VisitSummary.appointment_id == appointment_id).first()
    if not visit_summary:
        visit_summary = VisitSummary(
            appointment_id=appointment.id,
            doctor_id=appointment.doctor_id,
        )
        db.add(visit_summary)

    visit_summary.raw_clinical_notes = req.raw_clinical_notes
    visit_summary.ai_patient_summary = ai_summary_res.get("ai_patient_summary")
    visit_summary.ai_medication_schedule = ai_summary_res.get("ai_medication_schedule")
    visit_summary.ai_followup_steps = ai_summary_res.get("ai_followup_steps")
    visit_summary.is_ai_generated = ai_summary_res.get("is_ai_generated", False)

    # 2. Create or update Prescription
    prescription = db.query(Prescription).filter(Prescription.appointment_id == appointment_id).first()
    if not prescription:
        prescription = Prescription(
            appointment_id=appointment.id,
            doctor_id=appointment.doctor_id,
            patient_id=appointment.patient_id,
            diagnosis=req.diagnosis,
            medications=req.medications,
            advice=req.advice,
            followup_date=req.followup_date,
        )
        db.add(prescription)
        db.flush()
    else:
        prescription.diagnosis = req.diagnosis
        prescription.medications = req.medications
        prescription.advice = req.advice
        prescription.followup_date = req.followup_date
        db.flush()

    # 3. Schedule Medication Reminders for each medication
    # Clear old reminders for this prescription if re-submitting
    db.query(MedicationReminder).filter(MedicationReminder.prescription_id == prescription.id).delete()

    now_utc = datetime.now(timezone.utc)
    for med in req.medications:
        med_name = med.get("name", "Prescribed Medicine")
        dosage = med.get("dosage", "1 dose")
        freq = med.get("frequency", "Once daily")
        
        # Schedule first reminder run 4 hours from now
        first_run = now_utc + timedelta(hours=4)
        
        reminder = MedicationReminder(
            prescription_id=prescription.id,
            patient_id=appointment.patient_id,
            medicine_name=med_name,
            dosage=dosage,
            frequency=freq,
            reminder_time="09:00, 21:00",
            status=ReminderStatus.ACTIVE,
            next_run_at=first_run,
        )
        db.add(reminder)

    # 4. Mark appointment as completed
    appointment.status = AppointmentStatus.COMPLETED
    db.commit()
    db.refresh(visit_summary)

    return visit_summary


@router.get("/prescriptions/my", response_model=List[PrescriptionOut])
def get_my_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve prescriptions for the authenticated patient or doctor."""
    query = db.query(Prescription)
    if current_user.role == UserRole.PATIENT:
        query = query.filter(Prescription.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Prescription.doctor_id == doctor.id)
        else:
            return []
    
    return query.order_by(desc(Prescription.created_at)).all()


@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionOut)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve specific prescription by ID."""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found.")
    
    if current_user.role == UserRole.PATIENT and prescription.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this prescription.")

    return prescription


@router.get("/reminders/my", response_model=List[MedicationReminderOut])
def get_my_medication_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve active medication reminders for the current patient."""
    reminders = db.query(MedicationReminder).filter(
        MedicationReminder.patient_id == current_user.id
    ).order_by(desc(MedicationReminder.created_at)).all()
    return reminders
