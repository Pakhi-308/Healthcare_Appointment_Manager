from datetime import time, date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from app.schemas.user import UserOut


class DoctorBase(BaseModel):
    specialization: str
    bio: Optional[str] = None
    consultation_fee: float = 50.0
    slot_duration_minutes: int = 30
    working_hours_start: time = time(9, 0)
    working_hours_end: time = time(17, 0)
    working_days: str = "Mon,Tue,Wed,Thu,Fri"
    room_number: Optional[str] = None
    experience_years: int = 5


class DoctorCreate(DoctorBase):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None


class DoctorUpdate(BaseModel):
    specialization: Optional[str] = None
    bio: Optional[str] = None
    consultation_fee: Optional[float] = None
    slot_duration_minutes: Optional[int] = None
    working_hours_start: Optional[time] = None
    working_hours_end: Optional[time] = None
    working_days: Optional[str] = None
    room_number: Optional[str] = None
    experience_years: Optional[int] = None
    rating: Optional[float] = None


class DoctorOut(DoctorBase):
    id: int
    user_id: int
    rating: float
    created_at: datetime
    updated_at: datetime
    user: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)


class DoctorLeaveCreate(BaseModel):
    leave_date: date
    reason: Optional[str] = None


class DoctorLeaveOut(BaseModel):
    id: int
    doctor_id: int
    leave_date: date
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TimeSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    is_available: bool
    is_held: bool = False
    hold_expires_in_seconds: Optional[int] = None


class DoctorSlotsResponse(BaseModel):
    doctor_id: int
    doctor_name: str
    specialization: str
    date: date
    is_on_leave: bool = False
    slots: List[TimeSlot]
