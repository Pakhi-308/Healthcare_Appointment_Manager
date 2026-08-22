import requests
import json
import sys
from datetime import datetime, timedelta

def test_live_app():
    print("=== 1. Testing Frontend App ===")
    try:
        r = requests.get("http://127.0.0.1:5173", timeout=5)
        print(f"Frontend Status Code: {r.status_code}")
        assert r.status_code == 200, "Frontend did not return 200"
        assert "<div id=\"root\">" in r.text or "Vite" in r.text, "Frontend HTML structure verified"
        print(" [PASS] Frontend is running and serving HTML correctly at http://127.0.0.1:5173")
    except Exception as e:
        print(f" [FAIL] Frontend connection failed: {e}")
        return False

    print("\n=== 2. Testing Backend Health & Swagger Docs ===")
    try:
        r = requests.get("http://127.0.0.1:8000/docs", timeout=5)
        print(f"Backend /docs Status Code: {r.status_code}")
        assert r.status_code == 200, "Backend /docs did not return 200"
        print(" [PASS] Backend Swagger Docs is accessible at http://127.0.0.1:8000/docs")
    except Exception as e:
        print(f" [FAIL] Backend connection failed: {e}")
        return False

    print("\n=== 3. Testing Authentication (Admin, Doctor, Patient) ===")
    accounts = [
        ("Admin", "admin@healthsync.care", "AdminPassword123!"),
        ("Doctor Mitchell", "dr.sarah.mitchell@healthsync.care", "DoctorPassword123!"),
        ("Patient", "patient@healthsync.care", "PatientPassword123!")
    ]

    tokens = {}
    for role, email, password in accounts:
        try:
            r = requests.post(
                "http://127.0.0.1:8000/api/v1/auth/login",
                json={"email": email, "password": password},
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            assert r.status_code == 200, f"Login failed for {email}: {r.text}"
            data = r.json()
            tokens[role] = data["access_token"]
            print(f" [PASS] Logged in as {role} ({email}) -> user_id: {data['user_id']}")
        except Exception as e:
            print(f" [FAIL] Login error for {role}: {e}")
            return False

    print("\n=== 4. Testing Core Platform Features ===")
    # 4.1 Admin Analytics
    try:
        r = requests.get(
            "http://127.0.0.1:8000/api/v1/admin/analytics",
            headers={"Authorization": f"Bearer {tokens['Admin']}"},
            timeout=5
        )
        assert r.status_code == 200, f"Admin analytics failed: {r.text}"
        stats = r.json()
        print(f" [PASS] Admin Analytics retrieved successfully:")
        print(f"        - Total Patients: {stats.get('total_patients')}")
        print(f"        - Total Doctors: {stats.get('total_doctors')}")
        print(f"        - Active Bookings: {stats.get('active_bookings')}")
        print(f"        - Total Revenue: ${stats.get('total_revenue')}")
    except Exception as e:
        print(f" [FAIL] Admin analytics error: {e}")
        return False

    # 4.2 Doctor Directory & Slot Generation
    try:
        r = requests.get("http://127.0.0.1:8000/api/v1/doctors", timeout=5)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) > 0
        doctor_id = docs[0]["id"]
        doc_name = docs[0]["user"]["full_name"]
        print(f" [PASS] Doctors API returned {len(docs)} doctors. Testing Doctor #{doctor_id} ({doc_name})")

        # Get available slots for tomorrow with Auth Token
        target_date = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        r_slots = requests.get(
            f"http://127.0.0.1:8000/api/v1/doctors/{doctor_id}/slots?target_date={target_date}",
            headers={"Authorization": f"Bearer {tokens['Patient']}"},
            timeout=5
        )
        assert r_slots.status_code == 200, f"Slot fetch failed: {r_slots.text}"
        slot_data = r_slots.json()
        slots = slot_data.get("slots", [])
        print(f" [PASS] Retrieved {len(slots)} available slots for Doctor on {target_date}")
    except Exception as e:
        print(f" [FAIL] Doctor slots error: {e}")
        return False

    # 4.3 Patient Appointments
    try:
        r = requests.get(
            "http://127.0.0.1:8000/api/v1/appointments/my",
            headers={"Authorization": f"Bearer {tokens['Patient']}"},
            timeout=5
        )
        assert r.status_code == 200
        appts = r.json()
        print(f" [PASS] Patient has {len(appts)} existing appointment(s).")
    except Exception as e:
        print(f" [FAIL] Patient appointments error: {e}")
        return False

    print("\n=======================================================")
    print(" ALL FRONTEND, BACKEND & API TESTS PASSED SUCCESSFULLY!")
    print("=======================================================")
    return True

if __name__ == "__main__":
    success = test_live_app()
    sys.exit(0 if success else 1)
