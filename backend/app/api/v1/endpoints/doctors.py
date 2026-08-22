from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.doctor import Doctor, DoctorLeave
from app.schemas.doctor import DoctorOut, DoctorSlotsResponse, DoctorLeaveOut
from app.schemas.appointment import SlotHoldRequest, SlotHoldResponse
from app.services.booking_service import booking_service

router = APIRouter()


@router.get("/", response_model=List[DoctorOut])
def get_doctors(
    specialization: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all available doctors with optional filtering by specialization and name search."""
    query = db.query(Doctor).join(User, Doctor.user_id == User.id)
    
    if specialization and specialization.strip():
        query = query.filter(Doctor.specialization.ilike(f"%{specialization.strip()}%"))
        
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                Doctor.specialization.ilike(search_term),
                Doctor.bio.ilike(search_term)
            )
        )

    doctors = query.all()
    return doctors


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Get detailed doctor profile."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return doctor


@router.get("/{doctor_id}/slots", response_model=DoctorSlotsResponse)
def get_doctor_slots(
    doctor_id: int,
    target_date: date = Query(..., description="Date for slot availability query (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Retrieve available time slots for a doctor on a given date."""
    user_id = current_user.id if current_user else None
    slot_data = booking_service.get_available_slots(db, doctor_id, target_date, current_user_id=user_id)
    return slot_data


@router.post("/{doctor_id}/holds", response_model=SlotHoldResponse)
def hold_slot(
    doctor_id: int,
    req: SlotHoldRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Temporarily reserve a slot for 10 minutes while patient completes symptom intake."""
    slot_hold = booking_service.create_slot_hold(
        db=db,
        patient_id=current_user.id,
        doctor_id=doctor_id,
        slot_start=req.slot_start,
        slot_end=req.slot_end,
    )
    return {
        "hold_token": slot_hold.hold_token,
        "doctor_id": slot_hold.doctor_id,
        "slot_start": slot_hold.slot_start,
        "slot_end": slot_hold.slot_end,
        "expires_at": slot_hold.expires_at,
        "status": slot_hold.status,
    }


@router.get("/{doctor_id}/leaves", response_model=List[DoctorLeaveOut])
def get_doctor_leaves(doctor_id: int, db: Session = Depends(get_db)):
    """Retrieve recorded leaves for a doctor."""
    leaves = db.query(DoctorLeave).filter(DoctorLeave.doctor_id == doctor_id).all()
    return leaves
