from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from app.models.clinical import UrgencyLevel, ReminderStatus


class SymptomFormCreate(BaseModel):
    raw_symptoms: str
    duration_days: int = 1
    severity_scale: int = 5
    additional_notes: Optional[str] = None


class SymptomFormOut(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    raw_symptoms: str
    duration_days: int
    severity_scale: int
    additional_notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PreVisitSummaryOut(BaseModel):
    ai_urgency_level: Optional[UrgencyLevel] = None
    ai_chief_complaint: Optional[str] = None
    ai_suggested_questions: Optional[List[str]] = None


class PostVisitClinicalNotesIn(BaseModel):
    raw_clinical_notes: str
    diagnosis: str
    medications: List[dict] = []
    advice: Optional[str] = None
    followup_date: Optional[date] = None


class VisitSummaryOut(BaseModel):
    id: int
    appointment_id: int
    doctor_id: int
    raw_clinical_notes: Optional[str] = None
    ai_urgency_level: Optional[UrgencyLevel] = None
    ai_chief_complaint: Optional[str] = None
    ai_suggested_questions: Optional[List[str]] = None
    ai_patient_summary: Optional[str] = None
    ai_medication_schedule: Optional[str] = None
    ai_followup_steps: Optional[str] = None
    is_ai_generated: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration_days: Optional[int] = None
    instructions: Optional[str] = None


class PrescriptionCreate(BaseModel):
    appointment_id: int
    diagnosis: str
    medications: List[MedicationItem]
    advice: Optional[str] = None
    followup_date: Optional[date] = None


class PrescriptionOut(BaseModel):
    id: int
    appointment_id: int
    doctor_id: int
    patient_id: int
    diagnosis: str
    medications: List[Any]
    advice: Optional[str] = None
    followup_date: Optional[date] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MedicationReminderOut(BaseModel):
    id: int
    prescription_id: int
    patient_id: int
    medicine_name: str
    dosage: str
    frequency: str
    reminder_time: str
    status: ReminderStatus
    next_run_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
