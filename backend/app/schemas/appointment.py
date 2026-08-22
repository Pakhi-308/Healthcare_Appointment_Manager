from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.appointment import AppointmentStatus, SlotHoldStatus
from app.schemas.user import UserOut
from app.schemas.doctor import DoctorOut
from app.schemas.clinical import SymptomFormOut, VisitSummaryOut, PrescriptionOut


class SlotHoldRequest(BaseModel):
    doctor_id: int
    slot_start: datetime
    slot_end: datetime


class SlotHoldResponse(BaseModel):
    hold_token: str
    doctor_id: int
    slot_start: datetime
    slot_end: datetime
    expires_at: datetime
    status: SlotHoldStatus


class AppointmentCreate(BaseModel):
    doctor_id: int
    slot_start: datetime
    slot_end: datetime
    hold_token: Optional[str] = None
    raw_symptoms: str
    duration_days: int = 1
    severity_scale: int = 5
    additional_notes: Optional[str] = None


class AppointmentReschedule(BaseModel):
    new_slot_start: datetime
    new_slot_end: datetime


class AppointmentCancel(BaseModel):
    cancel_reason: Optional[str] = "Patient requested cancellation"


class AppointmentOut(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    slot_start: datetime
    slot_end: datetime
    status: AppointmentStatus
    is_active: bool
    cancel_reason: Optional[str] = None
    google_event_id: Optional[str] = None
    google_meet_link: Optional[str] = None
    rebooking_token: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    doctor: Optional[DoctorOut] = None
    patient: Optional[UserOut] = None
    symptom_form: Optional[SymptomFormOut] = None
    visit_summary: Optional[VisitSummaryOut] = None
    prescription: Optional[PrescriptionOut] = None

    model_config = ConfigDict(from_attributes=True)
