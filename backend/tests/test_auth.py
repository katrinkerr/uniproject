"""Tests for POST /auth/register; never touches backend/plot.db."""

import pytest
from fastapi.testclient import TestClient
from pwdlib import PasswordHash
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

import plot_api.auth as auth
from plot_api.main import app
from plot_api.models import Base, User


@pytest.fixture
def api(tmp_path, monkeypatch):
    # Every test gets its own temporary SQLite database.
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine)

    # Replace only the database used by the registration endpoint.
    monkeypatch.setattr(auth, "SessionLocal", TestSession)

    with TestClient(app) as client:
        yield client, TestSession

    engine.dispose()


def test_successful_registration(api):
    client, TestSession = api
    password = "MyPassword123!"

    response = client.post(
        "/auth/register",
        json={"email": "TEST@example.com", "password": password},
    )

    assert response.status_code == 201
    assert set(response.json()) == {"id", "email"}
    assert isinstance(response.json()["id"], int)
    assert response.json()["email"] == "test@example.com"

    with TestSession() as db:
        user = db.scalar(select(User).where(User.email == "test@example.com"))
        assert user is not None
        assert user.password_hash != password
        assert user.password_hash.startswith("$argon2id$")
        assert PasswordHash.recommended().verify(password, user.password_hash)


def test_duplicate_email_is_rejected_case_insensitively(api):
    client, TestSession = api
    client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "Password123!"},
    )
    response = client.post(
        "/auth/register",
        json={"email": "USER@EXAMPLE.COM", "password": "Password123!"},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Email already registered"}
    with TestSession() as db:
        assert db.scalar(select(func.count()).select_from(User)) == 1


def test_invalid_email_is_rejected(api):
    client, _ = api
    response = client.post(
        "/auth/register",
        json={"email": "not-an-email", "password": "Password123!"},
    )
    assert response.status_code == 422


@pytest.mark.parametrize("password", ["1234567", " " * 8, "a" * 129])
def test_invalid_password_is_rejected(api, password):
    client, TestSession = api
    response = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": password},
    )
    assert response.status_code == 422
    with TestSession() as db:
        assert db.scalar(select(func.count()).select_from(User)) == 0


def test_validation_error_does_not_echo_password(api):
    client, _ = api
    password = "Secret!"  # Too short, so FastAPI responds with HTTP 422.
    response = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": password},
    )
    assert response.status_code == 422
    assert password not in response.text


def test_two_different_users_can_register(api):
    client, _ = api
    first = client.post(
        "/auth/register",
        json={"email": "first@example.com", "password": "Password123!"},
    )
    second = client.post(
        "/auth/register",
        json={"email": "second@example.com", "password": "Password123!"},
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] != second.json()["id"]
