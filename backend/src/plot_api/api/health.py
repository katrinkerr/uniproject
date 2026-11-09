from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


@router.get("/health", response_model=HealthResponse, summary="Check API availability")
async def health_check() -> HealthResponse:
    """Check that the API process is running (not DB readiness)."""
    return HealthResponse()
