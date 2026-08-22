from datetime import datetime, timedelta, date, time, timezone
import logging
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from app.models.doctor import Doctor, DoctorLeave
from app.models.appointment import Appointment, AppointmentStatus, SlotHold, SlotHoldStatus
from app.models.clinical import SymptomForm, VisitSummary, UrgencyLevel
from app.models.user import User
from app.services.groq_service import groq_service
from app.services.email_service import email_service
from app.services.calendar_service import calendar_service

logger = logging.getLogger(__name__)

HOLD_DURATION_MINUTES = 10


class BookingService:

    @staticmethod
    def get_available_slots(
        db: Session,
        doctor_id: int,
        target_date: date,
        current_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Compute available, held, and booked slots for a doctor on a specific date."""
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        # 1. Check if doctor is on leave
        leave = db.query(DoctorLeave).filter(
            DoctorLeave.doctor_id == doctor_id,
            DoctorLeave.leave_date == target_date
        ).first()
        if leave:
            return {
                "doctor_id": doctor_id,
                "doctor_name": doctor.user.full_name if doctor.user else "Doctor",
                "specialization": doctor.specialization,
                "date": target_date,
                "is_on_leave": True,
                "slots": []
            }

        # 2. Check day of week
        weekday_abbr = target_date.strftime("%a")  # e.g., "Mon", "Tue"
        working_days = [d.strip() for d in doctor.working_days.split(",")]
        if weekday_abbr not in working_days:
            return {
                "doctor_id": doctor_id,
                "doctor_name": doctor.user.full_name if doctor.user else "Doctor",
                "specialization": doctor.specialization,
                "date": target_date,
                "is_on_leave": False,
                "slots": []
            }

        # 3. Generate all theoretical slots for working hours
        slot_duration = timedelta(minutes=doctor.slot_duration_minutes)
        start_datetime = datetime.combine(target_date, doctor.working_hours_start)
        end_datetime = datetime.combine(target_date, doctor.working_hours_end)

        # 4. Fetch booked appointments for this date
        day_start = datetime.combine(target_date, time.min)
        day_end = datetime.combine(target_date, time.max)

        booked_appointments = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.slot_start >= day_start,
            Appointment.slot_start <= day_end,
            Appointment.is_active == True,
            Appointment.status.in_([AppointmentStatus.BOOKED])
        ).all()
        booked_times = {appt.slot_start for appt in booked_appointments}

        # 5. Fetch active slot holds
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        active_holds = db.query(SlotHold).filter(
            SlotHold.doctor_id == doctor_id,
            SlotHold.slot_start >= day_start,
            SlotHold.slot_start <= day_end,
            SlotHold.status == SlotHoldStatus.HELD,
            SlotHold.expires_at > now_utc
        ).all()
        
        held_slots_map = {hold.slot_start: hold for hold in active_holds}

        slots = []
        curr = start_datetime
        while curr + slot_duration <= end_datetime:
            slot_end = curr + slot_duration
            is_booked = curr in booked_times
            hold_record = held_slots_map.get(curr)
            is_held = hold_record is not None
            
            # If currently held by someone else, not available to general public
            # If held by the current user, consider it available for them to complete
            available = not is_booked and (
                not is_held or (current_user_id and hold_record.patient_id == current_user_id)
            )

            hold_expires_in = None
            if is_held:
                remaining = (hold_record.expires_at - now_utc).total_seconds()
                hold_expires_in = max(0, int(remaining))

            slots.append({
                "start_time": curr,
                "end_time": slot_end,
                "is_available": available,
                "is_held": is_held,
                "hold_expires_in_seconds": hold_expires_in
            })
            curr += slot_duration

        return {
            "doctor_id": doctor_id,
            "doctor_name": doctor.user.full_name if doctor.user else "Doctor",
            "specialization": doctor.specialization,
            "date": target_date,
            "is_on_leave": False,
            "slots": slots
        }

    @staticmethod
    def create_slot_hold(
        db: Session,
        patient_id: int,
        doctor_id: int,
        slot_start: datetime,
        slot_end: datetime
    ) -> SlotHold:
        """Create temporary reservation hold on slot while completing symptoms."""
        # Convert naive / aware datetimes safely
        if slot_start.tzinfo:
            slot_start = slot_start.astimezone(timezone.utc).replace(tzinfo=None)
        if slot_end.tzinfo:
            slot_end = slot_end.astimezone(timezone.utc).replace(tzinfo=None)

        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Ensure doctor is not on leave
        leave = db.query(DoctorLeave).filter(
            DoctorLeave.doctor_id == doctor_id,
            DoctorLeave.leave_date == slot_start.date()
        ).first()
        if leave:
            raise HTTPException(status_code=400, detail="Doctor is on leave on this date.")

        # Check existing active booking
        existing_booking = db.query(Appointment).filter(
            Appointment.doctor_id == doctor_id,
            Appointment.slot_start == slot_start,
            Appointment.is_active == True,
            Appointment.status == AppointmentStatus.BOOKED
        ).first()
        if existing_booking:
            raise HTTPException(status_code=409, detail="This slot is already booked.")

        # Check active hold by another patient
        existing_hold = db.query(SlotHold).filter(
            SlotHold.doctor_id == doctor_id,
            SlotHold.slot_start == slot_start,
            SlotHold.status == SlotHoldStatus.HELD,
            SlotHold.expires_at > now_utc,
            SlotHold.patient_id != patient_id
        ).first()
        if existing_hold:
            remaining = int((existing_hold.expires_at - now_utc).total_seconds())
            raise HTTPException(
                status_code=409,
                detail=f"This slot is currently held by another patient. Try again in {remaining} seconds."
            )

        # Release any old holds for this patient on this doctor/slot
        db.query(SlotHold).filter(
            SlotHold.doctor_id == doctor_id,
            SlotHold.patient_id == patient_id,
            SlotHold.status == SlotHoldStatus.HELD
        ).update({"status": SlotHoldStatus.RELEASED})

        hold_token = f"hold_{uuid.uuid4().hex}"
        expires_at = now_utc + timedelta(minutes=HOLD_DURATION_MINUTES)

        slot_hold = SlotHold(
            doctor_id=doctor_id,
            patient_id=patient_id,
            slot_start=slot_start,
            slot_end=slot_end,
            hold_token=hold_token,
            expires_at=expires_at,
            status=SlotHoldStatus.HELD
        )
        db.add(slot_hold)
        db.commit()
        db.refresh(slot_hold)
        return slot_hold

    @staticmethod
    def book_appointment_atomic(
        db: Session,
        patient_id: int,
        doctor_id: int,
        slot_start: datetime,
        slot_end: datetime,
        raw_symptoms: str,
        duration_days: int = 1,
        severity_scale: int = 5,
        additional_notes: Optional[str] = None,
        hold_token: Optional[str] = None
    ) -> Appointment:
        """
        Concurrency-safe appointment booking with DB-level row lock / transaction check.
        Ensures strict double-booking prevention.
        """
        if slot_start.tzinfo:
            slot_start = slot_start.astimezone(timezone.utc).replace(tzinfo=None)
        if slot_end.tzinfo:
            slot_end = slot_end.astimezone(timezone.utc).replace(tzinfo=None)

        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)

        # 1. Verify Doctor exists
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found.")

        # 2. Check Doctor leave
        leave = db.query(DoctorLeave).filter(
            DoctorLeave.doctor_id == doctor_id,
            DoctorLeave.leave_date == slot_start.date()
        ).first()
        if leave:
            raise HTTPException(status_code=400, detail="Doctor is on leave on this date.")

        # 3. Check hold token if provided
        if hold_token:
            hold = db.query(SlotHold).filter(
                SlotHold.hold_token == hold_token,
                SlotHold.status == SlotHoldStatus.HELD,
                SlotHold.expires_at > now_utc
            ).first()
            if hold:
                hold.status = SlotHoldStatus.CONVERTED

        # 4. Pessimistic concurrency check on slot (with row lock if supported)
        try:
            # Query for active booking on the exact doctor and slot
            query = db.query(Appointment).filter(
                Appointment.doctor_id == doctor_id,
                Appointment.slot_start == slot_start,
                Appointment.is_active == True,
                Appointment.status == AppointmentStatus.BOOKED
            )
            # Apply FOR UPDATE row lock when using MySQL/PostgreSQL
            if not db.bind.name.startswith("sqlite"):
                query = query.with_for_update()

            conflict = query.first()
            if conflict:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This slot was just booked by another patient. Please choose another time."
                )

            # 5. Insert Appointment
            appointment = Appointment(
                doctor_id=doctor_id,
                patient_id=patient_id,
                slot_start=slot_start,
                slot_end=slot_end,
                status=AppointmentStatus.BOOKED,
                is_active=True,
            )
            db.add(appointment)
            db.flush()  # Obtain appointment.id

            # 6. Insert Symptom Form
            symptom_form = SymptomForm(
                appointment_id=appointment.id,
                patient_id=patient_id,
                raw_symptoms=raw_symptoms,
                duration_days=duration_days,
                severity_scale=severity_scale,
                additional_notes=additional_notes
            )
            db.add(symptom_form)

            # 7. AI Pre-visit Triage using Groq LLaMA 3.3 70B (with graceful fallback)
            ai_analysis = groq_service.analyze_symptoms(raw_symptoms)
            urgency_enum = UrgencyLevel(ai_analysis.get("ai_urgency_level", "Medium"))
            
            visit_summary = VisitSummary(
                appointment_id=appointment.id,
                doctor_id=doctor_id,
                ai_urgency_level=urgency_enum,
                ai_chief_complaint=ai_analysis.get("ai_chief_complaint"),
                ai_suggested_questions=ai_analysis.get("ai_suggested_questions"),
                is_ai_generated=ai_analysis.get("is_ai_generated", False)
            )
            db.add(visit_summary)

            # Commit the transaction atomically
            db.commit()
            db.refresh(appointment)
        except HTTPException:
            raise
        except Exception as exc:
            db.rollback()
            logger.error(f"Error booking appointment: {exc}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slot booking conflict: {str(exc)}"
            )

        # 8. Post-booking integrations: Google Calendar & Email notifications (async-safe)
        patient_user = db.query(User).filter(User.id == patient_id).first()
        doctor_user = doctor.user

        slot_str = slot_start.strftime("%A, %b %d, %Y at %I:%M %p")
        
        # Calendar Event
        cal_res = calendar_service.create_event(
            db=db,
            user_id=patient_id,
            summary=f"HealthSync Consultation: Dr. {doctor_user.full_name if doctor_user else 'Doctor'}",
            description=f"Consultation with Dr. {doctor_user.full_name if doctor_user else 'Doctor'}.\nSpecialization: {doctor.specialization}\nSymptoms: {raw_symptoms}",
            start_time=slot_start,
            end_time=slot_end,
            attendee_emails=[patient_user.email if patient_user else "", doctor_user.email if doctor_user else ""]
        )
        appointment.google_event_id = cal_res.get("event_id")
        appointment.google_meet_link = cal_res.get("meet_link")
        db.commit()

        # Email to Patient
        if patient_user:
            email_service.send_booking_confirmation(
                db=db,
                patient_email=patient_user.email,
                patient_name=patient_user.full_name,
                doctor_name=doctor_user.full_name if doctor_user else "Doctor",
                specialization=doctor.specialization,
                slot_time=slot_str,
                google_meet_link=appointment.google_meet_link
            )

        # Email to Doctor
        if doctor_user:
            email_service.send_doctor_booking_notification(
                db=db,
                doctor_email=doctor_user.email,
                doctor_name=doctor_user.full_name,
                patient_name=patient_user.full_name if patient_user else "Patient",
                slot_time=slot_str,
                urgency_level=urgency_enum.value,
                chief_complaint=ai_analysis.get("ai_chief_complaint", "General consultation")
            )

        return appointment


booking_service = BookingService()
