import requests
import json
import time

def verify_live():
    vercel_url = "https://healthcare-appointment-manager-eta.vercel.app"
    render_url = "https://healthsync-backend-r4k0.onrender.com"

    print("=== 1. Checking Render Backend Live Status ===")
    r_backend = requests.get(f"{render_url}/health", timeout=10)
    print(f"Render Backend Health: {r_backend.status_code} -> {r_backend.text}")
    assert r_backend.status_code == 200

    print("\n=== 2. Checking Vercel Frontend HTML & Bundle ===")
    r_frontend = requests.get(vercel_url, timeout=10)
    print(f"Vercel Frontend: {r_frontend.status_code}")
    assert r_frontend.status_code == 200

    print("\n=== 3. Testing API Communication via Vercel Domain ===")
    r_api = requests.get(f"{vercel_url}/api/v1/doctors", timeout=15)
    print(f"Vercel /api/v1/doctors status: {r_api.status_code}")
    if r_api.status_code == 200 and "application/json" in r_api.headers.get("content-type", ""):
        docs = r_api.json()
        print(f" SUCCESS! Retrieved {len(docs)} doctors through Vercel domain proxy rewrite!")
        for doc in docs[:3]:
            print(f"   - Dr. {doc.get('full_name', 'Doctor')} ({doc.get('specialization')})")
    else:
        print(f" Response header content-type: {r_api.headers.get('content-type')}")
        print(f" Preview: {r_api.text[:200]}")

    print("\n=== 4. Testing Live Authentication over Vercel ===")
    r_login = requests.post(
        f"{vercel_url}/api/v1/auth/login",
        json={"email": "patient@healthsync.care", "password": "PatientPassword123!"},
        headers={"Content-Type": "application/json"},
        timeout=15
    )
    print(f"Vercel /api/v1/auth/login status: {r_login.status_code}")
    if r_login.status_code == 200:
        login_data = r_login.json()
        print(f" SUCCESS! Logged in as Patient ({login_data.get('email')}), user_id: {login_data.get('user_id')}")
        print(f" JWT Token generated: {login_data.get('access_token')[:25]}...")
    else:
        print(f" Login response: {r_login.text[:200]}")

if __name__ == "__main__":
    verify_live()
