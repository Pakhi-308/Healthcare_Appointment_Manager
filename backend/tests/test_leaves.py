import pytest
from datetime import datetime, date, timedelta, time
from app.models.user import User, UserRole
from app.models.doctor import Doctor, DoctorLeave
from app.models.appointment import Appointment, AppointmentStatus
from app.models.notification import Notification, NotificationType
from app.core.security import get_password_hash
from app.services.leave_service import leave_service


def test_doctor_leave_automatic_cancellation_and_rebooking(db_session):
    """
    Test that marking a doctor on leave automatically cancels existing bookings,
    issues a priority rebooking token, and queues notifications.
    """
    # 1. Create Doctor
    doc_user = User(
        email="dr.leave@healthsync.care",
        password_hash=get_password_hash("DocPass123!"),
        full_name="Dr. Leave Subject",
        role=UserRole.DOCTOR
    )
    db_session.add(doc_user)
    db_session.flush()

    doctor = Doctor(
        user_id=doc_user.id,
        specialization="Dermatology",
        consultation_fee=90.0,
        slot_duration_minutes=30,
        working_hours_start=time(9, 0),
        working_hours_end=time(17, 0),
        working_days="Mon,Tue,Wed,Thu,Fri",
        room_number="Room 204"
    )
    db_session.add(doctor)

    # 2. Create Patient
    patient = User(
        email="patient.affected@example.com",
        password_hash=get_password_hash("Pass123!"),
        full_name="Affected Patient",
        role=UserRole.PATIENT
    )
    db_session.add(patient)
    db_session.flush()

    leave_date = date(2026, 9, 15)
    slot_time = datetime(2026, 9, 15, 11, 0, 0)
    slot_end = slot_time + timedelta(minutes=30)

    # 3. Create active appointment on that date
    appt = Appointment(
        doctor_id=doctor.id,
        patient_id=patient.id,
        slot_start=slot_time,
        slot_end=slot_end,
        status=AppointmentStatus.BOOKED,
        is_active=True
    )
    db_session.add(appt)
    db_session.commit()

    # 4. Mark doctor on leave
    res = leave_service.apply_doctor_leave(
        db=db_session,
        doctor_id=doctor.id,
        leave_date=leave_date,
        reason="Attending Medical Conference"
    )
    assert res["affected_appointments_count"] == 1

    # 5. Verify appointment state
    db_session.refresh(appt)
    assert appt.status == AppointmentStatus.CANCELLED
    assert appt.is_active is False
    assert "Doctor on Leave" in appt.cancel_reason
    assert appt.rebooking_token is not None
    assert appt.rebooking_token.startswith("rebook_")

    # 6. Verify notification was logged
    notif = db_session.query(Notification).filter(
        Notification.recipient_email == "patient.affected@example.com",
        Notification.notification_type == NotificationType.DOCTOR_LEAVE_REBOOK
    ).first()
    assert notif is not None
    assert "Doctor Reschedule Notice" in notif.subject
