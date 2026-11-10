from fastapi.testclient import TestClient

from plot_api.main import app


client = TestClient(app)


def test_health_returns_200_and_ok_status() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_is_documented_in_openapi() -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "/health" in response.json()["paths"]


def test_local_frontend_can_access_health_endpoint() -> None:
    response = client.get("/health", headers={"Origin": "http://localhost:4200"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:4200"


def test_cors_preflight_from_angular() -> None:
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:4200",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:4200"


def test_unknown_origin_does_not_get_cors_permission() -> None:
    response = client.get(
        "/health", headers={"Origin": "https://unknown.example"}
    )
    assert "access-control-allow-origin" not in response.headers
