from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from plot_api.api.health import router as health_router
from plot_api.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Backend API for the PLOT mini-mission app.",
    )

    # Allow the team's local development frontend to call the backend.
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(health_router)

    @application.get("/")
    def root():
        return {
            "message": "Welcome to PLOT API"
        }

    return application


app = create_app()
