import requests
import re

url = "https://healthcare-appointment-manager-eta.vercel.app/"

print("=== 1. Checking Frontend HTML ===")
try:
    r = requests.get(url, timeout=10)
    print(f"Status Code: {r.status_code}")
    print(f"Headers: {dict(r.headers)}")
    assert r.status_code == 200, "Failed to load HTML"
    print("Frontend HTML loaded successfully.")
    
    # Check assets
    js_files = re.findall(r'src="(/assets/[^"]+\.js)"', r.text)
    css_files = re.findall(r'href="(/assets/[^"]+\.css)"', r.text)
    print(f"JS Bundles: {js_files}")
    print(f"CSS Bundles: {css_files}")

    for css in css_files:
        css_res = requests.get(url.rstrip('/') + css)
        print(f"CSS {css} -> Status: {css_res.status_code}, Size: {len(css_res.text)} bytes")

    for js in js_files:
        js_res = requests.get(url.rstrip('/') + js)
        print(f"JS {js} -> Status: {js_res.status_code}, Size: {len(js_res.text)} bytes")
        
        # Check what baseURL is configured in the bundle
        if "baseURL:" in js_res.text or "/api/v1" in js_res.text:
            print(" -> Found '/api/v1' in bundle")
            
except Exception as e:
    print(f"Error checking frontend: {e}")

print("\n=== 2. Checking /api/v1 calls against Vercel domain ===")
try:
    # Test if /api/v1/doctors or /api/v1/auth is proxied by Vercel or if backend is separate
    api_test = requests.get(url.rstrip('/') + "/api/v1/doctors", timeout=10)
    print(f"/api/v1/doctors on Vercel domain -> Status: {api_test.status_code}")
    print(f"Content preview: {api_test.text[:200]}")
except Exception as e:
    print(f"API test error: {e}")
