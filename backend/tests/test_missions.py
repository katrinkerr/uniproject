"""RMG-42: tests for GET /missions/random (existing auth tests remain unchanged)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import plot_api.auth as auth
import plot_api.missions as missions
from plot_api.main import app
from plot_api.models import Base


@pytest.fixture
def api(tmp_path, monkeypatch):
    """Create a separate SQLite database for each test."""
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine)
    monkeypatch.setattr(auth, "SessionLocal", test_sessions)

    with TestClient(app) as client:
        yield client

    engine.dispose()


def auth_headers(client: TestClient) -> dict[str, str]:
    """Register and log in a test user, then return the Bearer header."""
    credentials = {
        "email": "mission-test@example.com",
        "password": "StrongPassword123!",
    }
    assert client.post("/auth/register", json=credentials).status_code == 201
    response = client.post("/auth/login", json=credentials)
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_random_mission_returns_known_mission(api):
    response = api.get("/missions/random", headers=auth_headers(api))
    assert response.status_code == 200
    assert response.json() in [m.model_dump() for m in missions.MISSIONS]


def test_missions_require_token(api):
    assert api.get("/missions/random").status_code == 401


def test_missions_reject_invalid_token(api):
    response = api.get(
        "/missions/random",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401


def test_filter_by_category(api):
    response = api.get(
        "/missions/random?category=sport", headers=auth_headers(api)
    )
    assert response.status_code == 200
    assert response.json()["category"] == "sport"


def test_filter_by_difficulty(api):
    response = api.get(
        "/missions/random?difficulty=hard", headers=auth_headers(api)
    )
    assert response.status_code == 200
    assert response.json()["difficulty"] == "hard"


def test_filter_by_category_and_difficulty(api):
    response = api.get(
        "/missions/random?category=education&difficulty=easy",
        headers=auth_headers(api),
    )
    assert response.status_code == 200
    assert response.json()["category"] == "education"
    assert response.json()["difficulty"] == "easy"


def test_unknown_category_returns_422(api):
    response = api.get(
        "/missions/random?category=unknown", headers=auth_headers(api)
    )
    assert response.status_code == 422


def test_unknown_difficulty_returns_422(api):
    response = api.get(
        "/missions/random?difficulty=extreme", headers=auth_headers(api)
    )
    assert response.status_code == 422


def test_no_matching_missions_returns_404(api):
    response = api.get(
        "/missions/random?category=good_deeds&difficulty=hard",
        headers=auth_headers(api),
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "No matching missions available"}


def test_catalog_has_24_unique_missions():
    assert len(missions.MISSIONS) == 24
    assert len({m.id for m in missions.MISSIONS}) == 24
    assert {m.category for m in missions.MISSIONS} == {
        "sport", "good_deeds", "mental_health",
        "education", "household", "creativity",
    }


def test_random_selection_uses_filtered_list(api, monkeypatch):
    headers = auth_headers(api)
    selected = []

    def choose_last(options):
        assert options
        assert all(m.category == "creativity" for m in options)
        selected.append(options[-1])
        return options[-1]

    monkeypatch.setattr(missions.random, "choice", choose_last)
    response = api.get(
        "/missions/random?category=creativity", headers=headers
    )
    assert response.status_code == 200
    assert response.json() == selected[0].model_dump()


def test_logout_disables_access_to_missions(api):
    headers = auth_headers(api)
    assert api.get("/missions/random", headers=headers).status_code == 200
    assert api.post("/auth/logout", headers=headers).status_code == 204
    assert api.get("/missions/random", headers=headers).status_code == 401
