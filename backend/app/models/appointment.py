from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class AppointmentStatus(str, enum.Enum):
    BOOKED = "booked"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"


class SlotHoldStatus(str, enum.Enum):
    HELD = "held"
    CONVERTED = "converted"
    EXPIRED = "expired"
    RELEASED = "released"


class SlotHold(Base):
    """Temporary slot reservation while patient completes symptom intake."""
    __tablename__ = "slot_holds"
    __table_args__ = (
        Index("ix_slot_holds_lookup", "doctor_id", "slot_start", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    slot_start = Column(DateTime, nullable=False, index=True)
    slot_end = Column(DateTime, nullable=False)
    hold_token = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    status = Column(Enum(SlotHoldStatus), default=SlotHoldStatus.HELD, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Appointment(Base):
    """Confirmed appointment record."""
    __tablename__ = "appointments"
    __table_args__ = (
        UniqueConstraint("doctor_id", "slot_start", name="uq_doctor_slot"),
        Index("ix_appointments_doctor_slot", "doctor_id", "slot_start"),
        Index("ix_appointments_active_slot", "doctor_id", "slot_start", "is_active"),
    )

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    slot_start = Column(DateTime, nullable=False, index=True)
    slot_end = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.BOOKED, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    cancel_reason = Column(String(255), nullable=True)
    google_event_id = Column(String(255), nullable=True)
    google_meet_link = Column(String(255), nullable=True)
    rebooking_token = Column(String(64), nullable=True, index=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    doctor = relationship("Doctor", back_populates="appointments", foreign_keys=[doctor_id])
    patient = relationship("User", back_populates="patient_appointments", foreign_keys=[patient_id])
    symptom_form = relationship("SymptomForm", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    visit_summary = relationship("VisitSummary", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    prescription = relationship("Prescription", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
