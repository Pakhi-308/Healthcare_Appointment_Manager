import requests

render_url = "https://healthsync-backend-r4k0.onrender.com"

# 1. Login
r_login = requests.post(f"{render_url}/api/v1/auth/login", json={"email": "patient@healthsync.care", "password": "PatientPassword123!"})
token = r_login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 2. Test booking with trailing slash
payload = {
    "doctor_id": 1,
    "slot_start": "2026-08-25T11:00:00",
    "slot_end": "2026-08-25T11:30:00",
    "raw_symptoms": "Test symptoms",
    "duration_days": 2,
    "severity_scale": 5
}

r1 = requests.post(f"{render_url}/api/v1/appointments/", json=payload, headers=headers)
print("Render /api/v1/appointments/ ->", r1.status_code, r1.text[:200])

r2 = requests.post(f"{render_url}/api/v1/appointments", json=payload, headers=headers)
print("Render /api/v1/appointments ->", r2.status_code, r2.text[:200])
