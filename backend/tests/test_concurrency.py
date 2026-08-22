import pytest
import concurrent.futures
from datetime import datetime, timedelta, timezone, time
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.core.security import get_password_hash
from app.services.booking_service import booking_service


def test_concurrent_booking_double_booking_prevention(db_session):
    """
    Simulate simultaneous booking attempts for the same doctor and time slot.
    Proves that exactly 1 booking succeeds and all concurrent duplicates are rejected with 409 Conflict.
    """
    # 1. Create a doctor
    doc_user = User(
        email="concurrent.doc@healthsync.care",
        password_hash=get_password_hash("DocPass123!"),
        full_name="Dr. Concurrency Specialist",
        role=UserRole.DOCTOR
    )
    db_session.add(doc_user)
    db_session.flush()

    doctor = Doctor(
        user_id=doc_user.id,
        specialization="General Medicine",
        consultation_fee=100.0,
        slot_duration_minutes=30,
        working_hours_start=time(9, 0),
        working_hours_end=time(17, 0),
        working_days="Mon,Tue,Wed,Thu,Fri",
        room_number="Room 101"
    )
    db_session.add(doctor)

    # 2. Create 5 distinct patient accounts
    patients = []
    for i in range(5):
        p = User(
            email=f"patient_{i}@test.com",
            password_hash=get_password_hash("Pass123!"),
            full_name=f"Patient {i}",
            role=UserRole.PATIENT
        )
        db_session.add(p)
        patients.append(p)

    db_session.commit()
    for p in patients:
        db_session.refresh(p)
    db_session.refresh(doctor)

    slot_time = datetime(2026, 9, 1, 10, 0, 0)
    slot_end = slot_time + timedelta(minutes=30)

    # 3. Simulate simultaneous booking attempts using thread pool
    results = []

    def attempt_booking(patient_id):
        from tests.conftest import TestingSessionLocal
        local_db = TestingSessionLocal()
        try:
            appt = booking_service.book_appointment_atomic(
                db=local_db,
                patient_id=patient_id,
                doctor_id=doctor.id,
                slot_start=slot_time,
                slot_end=slot_end,
                raw_symptoms="Severe headache and fever",
                duration_days=2,
                severity_scale=7,
            )
            return {"status": "success", "appointment_id": appt.id}
        except Exception as exc:
            return {"status": "failed", "error": str(exc)}
        finally:
            local_db.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(attempt_booking, p.id) for p in patients]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())

    successes = [r for r in results if r["status"] == "success"]
    failures = [r for r in results if r["status"] == "failed"]

    # Exactly 1 attempt must succeed, and all other 4 attempts must fail
    assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}"
    assert len(failures) == 4, f"Expected 4 failures due to concurrency lock, got {len(failures)}"
