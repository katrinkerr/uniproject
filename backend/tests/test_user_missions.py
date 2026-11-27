"""RMG-59: API tests using a temporary SQLite database."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

import plot_api.auth as auth
import plot_api.user_missions as user_missions
from plot_api.main import app
from plot_api.models import Base, UserMission


@pytest.fixture
def api(tmp_path, monkeypatch):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine)
    monkeypatch.setattr(auth, "SessionLocal", test_sessions)
    monkeypatch.setattr(user_missions, "SessionLocal", test_sessions)

    with TestClient(app) as client:
        yield client, test_sessions
    engine.dispose()


def login(client, email="mission-owner@example.com"):
    credentials = {"email": email, "password": "StrongPassword123!"}
    assert client.post("/auth/register", json=credentials).status_code == 201
    response = client.post("/auth/login", json=credentials)
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_start_persists_mission_and_timestamp(api):
    client, sessions = api
    headers = login(client)
    result = client.post(
        "/users/me/missions", json={"mission_id": 2}, headers=headers
    )
    assert result.status_code == 201
    data = result.json()
    assert data["mission"]["id"] == 2
    assert data["status"] == "in_progress"
    assert data["earned_xp"] == 0
    assert data["started_at"].endswith("Z")
    assert data["completed_at"] is None

    with sessions() as db:
        saved = db.get(UserMission, data["id"])
        assert saved is not None
        assert saved.user_id == 1
        assert saved.mission_id == 2
        assert saved.status == "in_progress"


def test_duplicate_start_returns_409_and_does_not_duplicate(api):
    client, sessions = api
    headers = login(client)
    assert client.post(
        "/users/me/missions", json={"mission_id": 2}, headers=headers
    ).status_code == 201
    result = client.post(
        "/users/me/missions", json={"mission_id": 2}, headers=headers
    )
    assert result.status_code == 409
    with sessions() as db:
        assert len(db.scalars(select(UserMission)).all()) == 1


def test_cannot_start_different_mission_while_one_in_progress(api):
    client, _ = api
    headers = login(client)
    client.post("/users/me/missions", json={"mission_id": 2}, headers=headers)
    result = client.post(
        "/users/me/missions", json={"mission_id": 3}, headers=headers
    )
    assert result.status_code == 409


def test_complete_awards_xp_once_and_sets_end_date(api):
    client, sessions = api
    headers = login(client)
    attempt = client.post(
        "/users/me/missions", json={"mission_id": 2}, headers=headers
    ).json()
    result = client.post(
        f"/users/me/missions/{attempt['id']}/complete", headers=headers
    )
    assert result.status_code == 200
    completed = result.json()["user_mission"]
    assert completed["status"] == "completed"
    assert completed["completed_at"].endswith("Z")
    assert completed["earned_xp"] == 30
    assert result.json()["stats"]["total_xp"] == 30
    assert result.json()["stats"]["completed_missions"] == 1
    assert result.json()["stats"]["active_missions"] == 0
    assert result.json()["stats"]["streak_days"] == 1

    with sessions() as db:
        row = db.get(UserMission, attempt["id"])
        assert row.status == "completed"
        assert row.completed_at is not None
        assert row.earned_xp == 30


def test_repeat_completion_returns_409_and_xp_does_not_change(api):
    client, sessions = api
    headers = login(client)
    attempt = client.post(
        "/users/me/missions", json={"mission_id": 2}, headers=headers
    ).json()
    path = f"/users/me/missions/{attempt['id']}/complete"
    assert client.post(path, headers=headers).status_code == 200
    assert client.post(path, headers=headers).status_code == 409
    with sessions() as db:
        rows = db.scalars(select(UserMission)).all()
        assert len(rows) == 1
        assert sum(row.earned_xp for row in rows) == 30


def test_mission_belongs_to_current_user(api):
    client, _ = api
    owner = login(client, "owner@example.com")
    other = login(client, "other@example.com")
    attempt = client.post(
        "/users/me/missions", json={"mission_id": 1}, headers=owner
    ).json()
    attempt_id = attempt["id"]
    assert client.post(
        f"/users/me/missions/{attempt_id}/complete", headers=other
    ).status_code == 404
    assert client.get("/users/me/missions", headers=other).json() == {"items": []}
    assert client.get("/users/me/missions", headers=owner).json()["items"][0][
        "id"
    ] == attempt_id


def test_list_survives_another_test_client(api):
    client, _ = api
    headers = login(client)
    attempt = client.post(
        "/users/me/missions", json={"mission_id": 1}, headers=headers
    ).json()
    with TestClient(app) as restarted_client:
        result = restarted_client.get("/users/me/missions", headers=headers)
    assert result.status_code == 200
    assert result.json()["items"][0]["id"] == attempt["id"]


def test_list_status_filter(api):
    client, _ = api
    headers = login(client)
    attempt = client.post(
        "/users/me/missions", json={"mission_id": 2}, headers=headers
    ).json()
    client.post(f"/users/me/missions/{attempt['id']}/complete", headers=headers)
    assert client.get(
        "/users/me/missions?status=in_progress", headers=headers
    ).json() == {"items": []}
    completed = client.get(
        "/users/me/missions?status=completed", headers=headers
    ).json()["items"]
    assert len(completed) == 1
    assert completed[0]["status"] == "completed"


def test_can_start_another_attempt_after_completion(api):
    client, _ = api
    headers = login(client)
    first = client.post(
        "/users/me/missions", json={"mission_id": 2}, headers=headers
    ).json()
    assert client.post(
        f"/users/me/missions/{first['id']}/complete", headers=headers
    ).status_code == 200
    second = client.post(
        "/users/me/missions", json={"mission_id": 2}, headers=headers
    )
    assert second.status_code == 201
    assert second.json()["id"] != first["id"]


def test_reject_unknown_mission_and_bad_input(api):
    client, _ = api
    headers = login(client)
    assert client.post(
        "/users/me/missions", json={"mission_id": 999}, headers=headers
    ).status_code == 404
    assert client.post(
        "/users/me/missions", json={"mission_id": 0}, headers=headers
    ).status_code == 422
    assert client.get(
        "/users/me/missions?status=active", headers=headers
    ).status_code == 422


def test_no_authorization_returns_401(api):
    client, _ = api
    assert client.get("/users/me/missions").status_code == 401
    assert client.post(
        "/users/me/missions", json={"mission_id": 1}
    ).status_code == 401
    assert client.post("/users/me/missions/1/complete").status_code == 401


def test_owner_not_found_returns_404(api):
    client, _ = api
    headers = login(client)
    result = client.post("/users/me/missions/999/complete", headers=headers)
    assert result.status_code == 404


def test_database_index_prevents_two_unfinished_attempts(api):
    """Protect against a second request even when bypassing the API check."""
    client, sessions = api
    headers = login(client)
    first = client.post(
        "/users/me/missions", json={"mission_id": 2}, headers=headers
    ).json()
    with sessions() as db:
        db.add(
            UserMission(
                user_id=1,
                mission_id=3,
                status="in_progress",
                started_at=1,
                completed_at=None,
                earned_xp=0,
            )
        )
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
        rows = db.scalars(select(UserMission)).all()
        assert [r.id for r in rows] == [first["id"]]
