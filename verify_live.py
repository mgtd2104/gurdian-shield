import requests
import json
import time

BASE_URL = "http://localhost:5001/api"

def test_chatbot_sqli():
    print("\n--- Testing Chatbot SQLi Remediation ---")
    payload = {
        "message": "Fix this",
        "scanResult": {
            "vulnerabilities": [
                {
                    "type": "SQL Injection",
                    "description": "Found payload ' OR 1=1 --"
                }
            ]
        }
    }
    
    try:
        # Now hitting /chat/message which should handle scanResult
        res = requests.post(f"{BASE_URL}/chat/message", json=payload)
        if res.status_code == 200:
            data = res.json()
            # Response structure: { success: true, response: { message: "...", remediation: [...] } }
            response_obj = data.get("response", {})
            message = response_obj.get("message", "")
            
            if "CRITICAL: SQL Injection Vulnerability Detected" in message:
                print("✅ PASS: Chatbot correctly identified SQLi and provided strict remediation.")
            else:
                print("❌ FAIL: Chatbot did not return expected SQLi remediation.")
                print("Response Message:", message)
        else:
            print(f"❌ FAIL: API returned {res.status_code}")
            print(res.text)
    except Exception as e:
        print(f"❌ FAIL: Connection error: {e}")

def test_file_scanner_eicar():
    print("\n--- Testing File Scanner (EICAR Malware) ---")
    # EICAR Test String
    eicar_content = b"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    
    files = {
        'file': ('eicar.com', eicar_content, 'application/octet-stream')
    }
    
    try:
        # Corrected endpoint: /scanner/virus
        res = requests.post(f"{BASE_URL}/scanner/virus", files=files)
        if res.status_code == 200:
            data = res.json()
            # Expecting known malware detection
            threats = data.get("threats", [])
            is_safe = data.get("isSafe")
            
            if not is_safe and any("Known Malware" in t.get("type", "") for t in threats):
                print("✅ PASS: File Scanner correctly identified EICAR as malware.")
                print(f"Threats found: {len(threats)}")
            else:
                print("❌ FAIL: File Scanner failed to identify EICAR.")
                print("Response:", json.dumps(data, indent=2))
        else:
            print(f"❌ FAIL: API returned {res.status_code}")
            print(res.text)
    except Exception as e:
        print(f"❌ FAIL: Connection error: {e}")

if __name__ == "__main__":
    print("Waiting for server restart...")
    time.sleep(2) 
    test_chatbot_sqli()
    test_file_scanner_eicar()
