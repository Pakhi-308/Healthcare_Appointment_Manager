from datetime import datetime, timezone, time, date
from sqlalchemy import Column, Integer, String, Text, Float, Time, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialization = Column(String(100), nullable=False, index=True)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Float, default=50.0, nullable=False)
    slot_duration_minutes = Column(Integer, default=30, nullable=False)
    working_hours_start = Column(Time, default=time(9, 0), nullable=False)
    working_hours_end = Column(Time, default=time(17, 0), nullable=False)
    working_days = Column(String(100), default="Mon,Tue,Wed,Thu,Fri", nullable=False)
    room_number = Column(String(50), nullable=True)
    rating = Column(Float, default=4.9, nullable=False)
    experience_years = Column(Integer, default=5, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    leaves = relationship("DoctorLeave", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id")
    prescriptions = relationship("Prescription", back_populates="doctor")


class DoctorLeave(Base):
    __tablename__ = "doctor_leaves"
    __table_args__ = (
        UniqueConstraint("doctor_id", "leave_date", name="uq_doctor_leave_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    leave_date = Column(Date, nullable=False, index=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    doctor = relationship("Doctor", back_populates="leaves")
