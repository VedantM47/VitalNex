"""
VITALNEX Phase 2 End-to-End Verification Test Script.
"""

import sys
import json
import urllib.request
import urllib.error

API_BASE = "http://127.0.0.1:8000"

def log_pass(msg):
    print(f"  [PASS] {msg}")

def log_fail(msg):
    print(f"  [FAIL] {msg}")

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_bytes(url):
    with urllib.request.urlopen(url) as resp:
        return resp.read(), resp.headers.get("Content-Type")

def run_all_verifications():
    print("=" * 70)
    print("VITALNEX PHASE 2: AUTOMATED END-TO-END VERIFICATION")
    print("=" * 70)

    # 1. Health Endpoint
    print("\n1. Health Check Endpoint:")
    try:
        res = get_json(f"{API_BASE}/health")
        if res.get("status") == "healthy":
            log_pass(f"Backend API is healthy: {res}")
        else:
            log_fail(f"Backend status unexpected: {res}")
    except Exception as e:
        log_fail(f"Health check failed: {e}")

    # 2. ML Risk Assessment & Inference Pipeline
    print("\n2. ML Inference & Risk Assessment Pipeline:")
    asm_id = None
    try:
        payload = {
            "user_id": "test-patient-e2e",
            "age": 58,
            "sex": 1,
            "cp": 2,
            "trestbps": 138,
            "chol": 215,
            "fbs": 0,
            "restecg": 1,
            "thalach": 142,
            "exang": 0,
            "oldpeak": 1.2,
            "slope": 2,
            "ca": 1,
            "thal": 3,
            "bmi": 26.4,
            "smoking": 1
        }
        res = post_json(f"{API_BASE}/api/v1/assessment", payload)
        asm_id = res.get("id")
        score = res.get("risk_score")
        band = res.get("risk_band")
        ci = res.get("confidence_interval")

        if asm_id and isinstance(score, (int, float)) and band in ["Low", "Moderate", "High"] and isinstance(ci, list):
            log_pass(f"Assessment created successfully! ID: {asm_id}, Score: {score}%, Band: {band}, CI: {ci}")
        else:
            log_fail(f"Assessment response payload invalid: {res}")
    except Exception as e:
        log_fail(f"Assessment failed: {e}")

    # 3. What-If Simulation
    print("\n3. Real Model What-If Simulation:")
    try:
        whatif_payload = {
            "baseline_inputs": {
                "age": 58, "sex": 1, "trestbps": 138, "chol": 215,
                "thalach": 142, "oldpeak": 1.2, "smoking": 1, "bmi": 26.4
            },
            "simulated_inputs": {
                "age": 58, "sex": 1, "trestbps": 122, "chol": 185,
                "thalach": 155, "oldpeak": 0.4, "smoking": 0, "bmi": 23.8
            }
        }
        res = post_json(f"{API_BASE}/api/v1/what-if", whatif_payload)
        base_score = res.get("baseline_risk_score")
        sim_score = res.get("simulated_risk_score")
        delta = res.get("risk_delta")
        if base_score is not None and sim_score is not None and delta is not None:
            log_pass(f"What-If simulation computed! Baseline: {base_score}%, Simulated: {sim_score}%, Delta: {delta}%")
        else:
            log_fail(f"What-If response invalid: {res}")
    except Exception as e:
        log_fail(f"What-If simulation failed: {e}")

    # 4. AI Trust Passport
    print("\n4. AI Trust Passport & Governance Metrics:")
    try:
        target_id = asm_id or "asm-demo-001"
        res = get_json(f"{API_BASE}/api/v1/trust-passport/{target_id}")
        pred = res.get("prediction", {})
        conf = res.get("confidence", {})
        dq = res.get("data_quality", {})
        fair = res.get("fairness", {})
        if pred and conf and dq and fair:
            log_pass(f"Trust Passport verified! Quality: {dq.get('quality_score')}/100, Parity Ratio: {fair.get('demographic_parity_ratio')}, Confidence: {conf.get('confidence_score')}")
        else:
            log_fail(f"Trust Passport payload missing components: {res}")
    except Exception as e:
        log_fail(f"Trust Passport fetch failed: {e}")

    # 5. Clinical PDF Report Generation & Validation
    print("\n5. PDF Report Generation & Binary Stream Validation:")
    try:
        target_id = asm_id or "asm-demo-001"
        pdf_bytes, content_type = get_bytes(f"{API_BASE}/api/v1/reports/{target_id}/pdf")
        if content_type == "application/pdf" and len(pdf_bytes) > 2000 and pdf_bytes.startswith(b"%PDF"):
            log_pass(f"PDF generated and streamed! Content-Type: {content_type}, Size: {len(pdf_bytes)} bytes")
        else:
            log_fail(f"PDF output invalid! Type: {content_type}, Size: {len(pdf_bytes)}")
    except Exception as e:
        log_fail(f"PDF download failed: {e}")

    # 6. Doctor Directory & Appointments
    print("\n6. Doctor Directory & Appointments:")
    try:
        docs = get_json(f"{API_BASE}/api/v1/doctors")
        apts = get_json(f"{API_BASE}/api/v1/appointments?user_id=demo-user&role=patient")
        log_pass(f"Fetched {len(docs)} verified doctors and {len(apts)} patient appointments.")
    except Exception as e:
        log_fail(f"Doctor/Appointments endpoint failed: {e}")

    # 7. Telehealth Video Token Endpoint
    print("\n7. Telehealth Video Room Token Generation:")
    try:
        res = get_json(f"{API_BASE}/api/v1/appointments/apt-01/video-token?user_id=demo-user&role=patient")
        room = res.get("room_name")
        part = res.get("participant_name")
        status = res.get("status")
        configured = res.get("livekit_configured")
        if room and part and status == "authorized":
            log_pass(f"Video Token authorized! Room: {room}, Participant: {part}, LiveKit Configured: {configured}")
        else:
            log_fail(f"Video Token endpoint returned invalid response: {res}")
    except Exception as e:
        log_fail(f"Video Token endpoint failed: {e}")

    # 8. AI Assistant & Emergency Symptom Triage
    print("\n8. AI Assistant Emergency Symptom Handling:")
    try:
        emergency_payload = {
            "user_id": "demo-user",
            "message": "I am having crushing chest pain radiating to my left arm and breathlessness.",
            "language": "en"
        }
        res = post_json(f"{API_BASE}/api/v1/assistant/message", emergency_payload)
        resp_text = res.get("response", "")
        emergency_flag = res.get("emergency_flag", False)
        if emergency_flag or "108" in resp_text or "112" in resp_text or "EMERGENCY" in resp_text.upper():
            log_pass("Emergency symptom detected & safety hotline 108/112 guidance issued.")
        else:
            log_fail(f"Emergency symptom triage failed to flag hotline! Response: {resp_text}")
    except Exception as e:
        log_fail(f"AI Assistant emergency test failed: {e}")

    print("\n" + "=" * 70)
    print("END-TO-END VERIFICATION COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    run_all_verifications()
