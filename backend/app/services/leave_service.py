from datetime import datetime, date, time, timezone
import logging
import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.doctor import Doctor, DoctorLeave
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User
from app.services.email_service import email_service
from app.services.calendar_service import calendar_service

logger = logging.getLogger(__name__)


class LeaveService:

    @staticmethod
    def apply_doctor_leave(
        db: Session,
        doctor_id: int,
        leave_date: date,
        reason: str = "Medical/Personal Leave"
    ) -> Dict[str, Any]:
        """
        Apply leave for a doctor and automatically cancel & notify all affected patients.
        Provides affected patients with a priority rebooking token.
        """
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found.")

        # Check if leave already marked
        existing_leave = db.query(DoctorLeave).filter(
            DoctorLeave.doctor_id == doctor_id,
            DoctorLeave.leave_date == leave_date
        ).first()
        if existing_leave:
            raise HTTPException(status_code=400, detail="Leave is already recorded for this doctor on this date.")

        # Create leave record
        new_leave = DoctorLeave(
            doctor_id=doctor_id,
            leave_date=leave_date,
            reason=reason
        )
        db.add(new_leave)

        # Find all active booked appointments on this date
        day_start = datetime.combine(leave_date, time.min)
        day_end = datetime.combine(leave_date, time.max)

        affected_appointments = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.slot_start >= day_start,
            Appointment.slot_start <= day_end,
            Appointment.is_active == True,
            Appointment.status == AppointmentStatus.BOOKED
        ).all()

        cancelled_count = 0
        doctor_name = doctor.user.full_name if doctor.user else "Doctor"

        for appt in affected_appointments:
            rebook_token = f"rebook_{uuid.uuid4().hex}"
            appt.status = AppointmentStatus.CANCELLED
            appt.is_active = False
            appt.cancel_reason = f"Doctor on Leave: {reason}"
            appt.rebooking_token = rebook_token
            cancelled_count += 1

            # Delete Google Calendar event if present
            if appt.google_event_id:
                calendar_service.delete_event(db, appt.patient_id, appt.google_event_id)

            # Send automated priority rebooking email to patient
            patient = db.query(User).filter(User.id == appt.patient_id).first()
            if patient:
                slot_str = appt.slot_start.strftime("%A, %b %d, %Y at %I:%M %p")
                email_service.send_doctor_leave_rebooking_notice(
                    db=db,
                    patient_email=patient.email,
                    patient_name=patient.full_name,
                    doctor_name=doctor_name,
                    original_time=slot_str,
                    rebooking_token=rebook_token
                )

        db.commit()

        return {
            "leave_id": new_leave.id,
            "doctor_id": doctor_id,
            "leave_date": leave_date,
            "reason": reason,
            "affected_appointments_count": cancelled_count,
            "message": f"Leave recorded successfully. {cancelled_count} conflicting appointments were automatically cancelled and patients notified for rebooking."
        }


leave_service = LeaveService()
