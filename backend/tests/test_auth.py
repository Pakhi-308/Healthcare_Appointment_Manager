import pytest
from app.models.user import User, UserRole


def test_patient_registration_and_login(client):
    # 1. Register Patient
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "test.patient@example.com",
        "password": "Password123!",
        "full_name": "Test Patient",
        "phone": "+1 234 567 8900"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["role"] == "patient"
    assert reg_data["email"] == "test.patient@example.com"

    # 2. Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "test.patient@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]
    assert token is not None

    # 3. Access Protected /me route
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "test.patient@example.com"


def test_invalid_login(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401
