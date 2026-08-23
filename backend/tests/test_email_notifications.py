import pytest
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token
from app.services.email_service import email_service


def test_test_email_dispatch(client, db_session):
    # Register/create user
    user = User(
        email="emailtest.patient@example.com",
        password_hash=get_password_hash("Password123!"),
        full_name="Email Test Patient",
        role=UserRole.PATIENT
    )
    db_session.add(user)
    db_session.commit()
    token = create_access_token(user.id, user.role.value, user.email, user.full_name)

    headers = {"Authorization": f"Bearer {token}"}
    payload = {"recipient_email": "test.patient@example.com"}
    response = client.post("/api/v1/notifications/test-email", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert "status" in data
    assert data["mail_from"] is not None


def test_get_my_notifications(client, db_session):
    # Create patient
    user = User(
        email="notif.patient@example.com",
        password_hash=get_password_hash("Password123!"),
        full_name="Notif Patient",
        role=UserRole.PATIENT
    )
    db_session.add(user)
    db_session.commit()
    token = create_access_token(user.id, user.role.value, user.email, user.full_name)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a notification for the patient
    email_service.send_booking_confirmation(
        db=db_session,
        patient_email="notif.patient@example.com",
        patient_name="Notif Patient",
        doctor_name="Dr. Sarah Mitchell",
        specialization="Cardiology",
        slot_time="Tomorrow at 10:00 AM",
        google_meet_link="https://meet.google.com/xyz-test"
    )

    # 2. Fetch my notifications
    response = client.get("/api/v1/notifications/my", headers=headers)
    assert response.status_code == 200
    notifs = response.json()
    assert len(notifs) >= 1
    assert notifs[0]["recipient_email"] == "notif.patient@example.com"
    assert "Appointment Confirmed" in notifs[0]["subject"]
    assert "wrapper" in notifs[0]["body"]


def test_admin_database_stats(client, db_session):
    # Create admin
    admin = User(
        email="dbadmin@healthsync.care",
        password_hash=get_password_hash("AdminPassword123!"),
        full_name="DB Administrator",
        role=UserRole.ADMIN
    )
    db_session.add(admin)
    db_session.commit()
    token = create_access_token(admin.id, admin.role.value, admin.email, admin.full_name)

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/admin/database/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "engine_type" in data
    assert "tables" in data
    assert len(data["tables"]) >= 10
    assert data["status"] == "connected_healthy"
