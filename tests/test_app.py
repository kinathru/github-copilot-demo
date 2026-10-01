from uuid import uuid4

from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_signup_rejects_non_school_email():
    response = client.post(
        "/activities/Chess Club/signup?email=student@gmail.com"
    )

    assert response.status_code == 400
    assert "mergington.edu" in response.json()["detail"]


def test_signup_accepts_school_email():
    email = f"student-{uuid4().hex[:8]}@mergington.edu"
    response = client.post(f"/activities/Chess Club/signup?email={email}")

    assert response.status_code == 200
    assert "Signed up" in response.json()["message"]
