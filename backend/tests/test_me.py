
"""Test authorization guard and GET /auth/me using a temporary SQLite DB."""

from hashlib import sha256
import time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import plot_api.auth as auth
from plot_api.main import app
from plot_api.models import Base, UserSession


@pytest.fixture
def client_and_db(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine)
    monkeypatch.setattr(auth, "SessionLocal", test_sessions)

    with TestClient(app) as client:
        yield client, test_sessions
    engine.dispose()


def create_logged_in_user(client):
    data = {"email": "test@example.com", "password": "StrongPassword123!"}
    assert client.post("/auth/register", json=data).status_code == 201
    response = client.post("/auth/login", json=data)
    assert response.status_code == 200
    return response.json()["access_token"]


def test_me_returns_current_user(client_and_db):
    client, _ = client_and_db
    token = create_logged_in_user(client)
    result = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert result.status_code == 200
    assert result.json() == {"id": 1, "email": "test@example.com"}
    assert set(result.json().keys()) == {"id", "email"}


def test_me_rejects_missing_token(client_and_db):
    client, _ = client_and_db
    result = client.get("/auth/me")
    assert result.status_code == 401
    assert result.headers["www-authenticate"] == "Bearer"


def test_me_rejects_wrong_token(client_and_db):
    client, _ = client_and_db
    create_logged_in_user(client)
    result = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert result.status_code == 401


def test_me_rejects_expired_token(client_and_db):
    client, sessions = client_and_db
    token = create_logged_in_user(client)
    with sessions() as db:
        session = db.get(UserSession, sha256(token.encode()).hexdigest())
        session.expires_at = int(time.time()) - 1
        db.commit()
    result = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert result.status_code == 401


def test_me_rejects_wrong_scheme(client_and_db):
    client, _ = client_and_db
    result = client.get("/auth/me", headers={"Authorization": "Basic secret"})
    assert result.status_code == 401


def test_health_is_still_public(client_and_db):
    client, _ = client_and_db
    result = client.get("/health")
    assert result.status_code == 200
