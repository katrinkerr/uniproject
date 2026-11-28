"""RMG-60: profile API tests against a separate temporary SQLite DB."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

import plot_api.auth as auth
import plot_api.profile as profile
import plot_api.user_missions as user_missions
from plot_api.main import app
from plot_api.models import Base, User, UserMission


@pytest.fixture
def api(tmp_path, monkeypatch):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    test_session = sessionmaker(bind=engine)

    monkeypatch.setattr(auth, "SessionLocal", test_session)
    monkeypatch.setattr(user_missions, "SessionLocal", test_session)
    monkeypatch.setattr(profile, "SessionLocal", test_session)

    with TestClient(app) as client:
        yield client, test_session
    engine.dispose()


def sign_in(client: TestClient, email: str = "profile@example.com") -> dict:
    credentials = {"email": email, "password": "StrongPassword123!"}
    assert client.post("/auth/register", json=credentials).status_code == 201
    response = client.post("/auth/login", json=credentials)
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def finish_mission(client: TestClient, headers: dict, mission_id: int) -> int:
    started = client.post(
        "/users/me/missions", json={"mission_id": mission_id}, headers=headers
    )
    assert started.status_code == 201
    attempt_id = started.json()["id"]
    completed = client.post(
        f"/users/me/missions/{attempt_id}/complete", headers=headers
    )
    assert completed.status_code == 200
    return attempt_id


def test_profile_requires_login(api):
    client, _ = api
    assert client.get("/users/me").status_code == 401
    assert client.get(
        "/users/me", headers={"Authorization": "Bearer invalid"}
    ).status_code == 401


def test_new_user_has_empty_profile_stats(api):
    client, _ = api
    headers = sign_in(client)
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile@example.com"
    assert data["display_name"] is None
    assert data["nickname"] is None
    assert data["avatar_id"] is None
    assert data["stats"]["completed_missions"] == 0
    assert data["stats"]["total_xp"] == 0
    assert data["stats"]["level"] == 1
    assert data["stats"]["streak_days"] == 0
    assert data["recent_completed_missions"] == []
    assert "password_hash" not in data


def test_profile_reads_saved_name_and_nickname(api):
    client, sessions = api
    headers = sign_in(client)
    with sessions() as db:
        user = db.scalar(select(User).where(User.email == "profile@example.com"))
        user.display_name = "Андрій"
        user.nickname = "yuko"
        user.avatar_id = "cat_blue"
        db.commit()
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["display_name"] == "Андрій"
    assert response.json()["nickname"] == "yuko"
    assert response.json()["avatar_id"] == "cat_blue"


def test_completed_mission_updates_profile_statistics(api):
    client, _ = api
    headers = sign_in(client)
    attempt_id = finish_mission(client, headers, 2)
    assert client.post(
        "/users/me/missions", json={"mission_id": 1}, headers=headers
    ).status_code == 201

    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["completed_missions"] == 1
    assert data["stats"]["active_missions"] == 1
    assert data["stats"]["total_xp"] == 30
    assert data["stats"]["streak_days"] == 1
    assert len(data["recent_completed_missions"]) == 1
    recent = data["recent_completed_missions"][0]
    assert recent["id"] == attempt_id
    assert recent["mission"]["id"] == 2
    assert recent["status"] == "completed"
    assert recent["earned_xp"] == 30
    assert recent["completed_at"] is not None


def test_profile_shows_only_five_latest_completions(api):
    client, _ = api
    headers = sign_in(client)
    ids = [finish_mission(client, headers, mission_id) for mission_id in range(1, 7)]
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["stats"]["completed_missions"] == 6
    assert len(data["recent_completed_missions"]) == 5
    assert [row["id"] for row in data["recent_completed_missions"]] == list(
        reversed(ids[1:])
    )


def test_users_cannot_view_each_others_profiles(api):
    client, _ = api
    owner = sign_in(client, "owner@example.com")
    other = sign_in(client, "other@example.com")
    finish_mission(client, owner, 2)

    a = client.get("/users/me", headers=owner)
    b = client.get("/users/me", headers=other)
    assert a.status_code == 200
    assert b.status_code == 200
    assert a.json()["email"] == "owner@example.com"
    assert b.json()["email"] == "other@example.com"
    assert a.json()["stats"]["completed_missions"] == 1
    assert b.json()["stats"]["completed_missions"] == 0
    assert b.json()["recent_completed_missions"] == []


def test_profile_survives_new_client(api):
    client, _ = api
    headers = sign_in(client)
    finish_mission(client, headers, 2)
    with TestClient(app) as another_client:
        response = another_client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["stats"]["completed_missions"] == 1
