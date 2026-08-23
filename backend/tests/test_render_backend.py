import requests

backend_url = "https://healthsync-backend-r4k0.onrender.com"

print("=== 1. Testing Render Backend Root & Health ===")
try:
    r_root = requests.get(f"{backend_url}/", timeout=15)
    print(f"Root / -> Status: {r_root.status_code}, Body: {r_root.text}")
except Exception as e:
    print(f"Root error: {e}")

try:
    r_health = requests.get(f"{backend_url}/health", timeout=15)
    print(f"Health /health -> Status: {r_health.status_code}, Body: {r_health.text}")
except Exception as e:
    print(f"Health error: {e}")

try:
    r_docs = requests.get(f"{backend_url}/docs", timeout=15)
    print(f"Swagger /docs -> Status: {r_docs.status_code}")
except Exception as e:
    print(f"Docs error: {e}")

print("\n=== 2. Testing Render Backend Doctors API ===")
try:
    r_docs_api = requests.get(f"{backend_url}/api/v1/doctors", timeout=15)
    print(f"Doctors API -> Status: {r_docs_api.status_code}, Body: {r_docs_api.text[:300]}")
except Exception as e:
    print(f"Doctors API error: {e}")

print("\n=== 3. Testing Render Backend Auth Login ===")
try:
    r_login = requests.post(
        f"{backend_url}/api/v1/auth/login",
        json={"email": "patient@healthsync.care", "password": "PatientPassword123!"},
        headers={"Content-Type": "application/json"},
        timeout=15
    )
    print(f"Login API -> Status: {r_login.status_code}, Body: {r_login.text[:300]}")
except Exception as e:
    print(f"Login API error: {e}")
