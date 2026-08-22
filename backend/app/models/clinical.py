from datetime import datetime, timezone, date
import enum
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, Boolean, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class UrgencyLevel(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class ReminderStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"


class SymptomForm(Base):
    """Pre-visit patient intake symptom questionnaire."""
    __tablename__ = "symptom_forms"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    raw_symptoms = Column(Text, nullable=False)
    duration_days = Column(Integer, default=1, nullable=False)
    severity_scale = Column(Integer, default=5, nullable=False)  # 1-10
    additional_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    appointment = relationship("Appointment", back_populates="symptom_form")
    patient = relationship("User", back_populates="symptom_forms")


class VisitSummary(Base):
    """Clinical documentation & AI summaries (Pre-visit & Post-visit)."""
    __tablename__ = "visit_summaries"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    
    # Pre-visit AI Analysis
    ai_urgency_level = Column(Enum(UrgencyLevel), default=UrgencyLevel.LOW, nullable=True)
    ai_chief_complaint = Column(Text, nullable=True)
    ai_suggested_questions = Column(JSON, nullable=True)  # List of 3 strings
    
    # Doctor clinical notes & Post-visit AI patient-friendly summary
    raw_clinical_notes = Column(Text, nullable=True)
    ai_patient_summary = Column(Text, nullable=True)
    ai_medication_schedule = Column(Text, nullable=True)
    ai_followup_steps = Column(Text, nullable=True)
    is_ai_generated = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    appointment = relationship("Appointment", back_populates="visit_summary")


class Prescription(Base):
    """Prescription issued by doctor with medications, advice, and follow-up."""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    diagnosis = Column(Text, nullable=False)
    # medications JSON list: [{name, dosage, frequency, duration_days, instructions}]
    medications = Column(JSON, default=list, nullable=False)
    advice = Column(Text, nullable=True)
    followup_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    appointment = relationship("Appointment", back_populates="prescription")
    doctor = relationship("Doctor", back_populates="prescriptions")
    patient = relationship("User", back_populates="prescriptions")
    reminders = relationship("MedicationReminder", back_populates="prescription", cascade="all, delete-orphan")


class MedicationReminder(Base):
    """Scheduled medication reminder tracking for background jobs."""
    __tablename__ = "medication_reminders"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)  # e.g., "Twice daily after food"
    reminder_time = Column(String(50), nullable=False)  # e.g., "08:00, 20:00"
    status = Column(Enum(ReminderStatus), default=ReminderStatus.ACTIVE, nullable=False)
    next_run_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    prescription = relationship("Prescription", back_populates="reminders")
