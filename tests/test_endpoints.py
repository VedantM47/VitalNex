"""
Public endpoint tests (no sign-in, no database). Auth-protected behaviour is in
test_auth.py; database behaviour against the real project is in test_live_supabase.py.
"""

from fastapi.testclient import TestClient

from apps.api.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "VITALNEX"
    assert "disclaimer" in data


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_trust_passport_not_available():
    response = client.get("/api/v1/trust-passport/asm-12345")
    assert response.status_code == 503


def test_video_token_not_in_mvp():
    res = client.get("/api/v1/appointments/apt-demo-001/video-token")
    assert res.status_code == 503
    assert "Not in MVP" in res.json()["detail"]


def test_voice_routes_not_in_mvp():
    res = client.post("/api/v1/voice/transcribe", json={"audio_base64": "", "language": "en"})
    assert res.status_code == 503
    assert "Not in MVP" in res.json()["detail"]


def test_no_external_ai_integrations_remain():
    """Jev/TypeSafe and Gemini were removed (D-16, hard rule 6)."""
    import importlib.util
    import pathlib

    assert importlib.util.find_spec("apps.api.services.jev_service") is None
    src = pathlib.Path("apps/api/services/assistant_service.py").read_text(encoding="utf-8")
    assert "GEMINI" not in src and "httpx" not in src


def test_no_in_memory_stores_remain():
    """P1: user data lives in Supabase only; no module-level dict stores in the API."""
    import pathlib
    import re

    for path in pathlib.Path("apps/api").rglob("*.py"):
        src = path.read_text(encoding="utf-8")
        assert not re.search(r"_\w*store\w*\s*:\s*Dict", src), f"in-memory store in {path}"
        assert "demo-user" not in src, f"hardcoded demo user in {path}"
