"""Read the authenticated user's profile and progress (RMG-60)."""

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from plot_api.auth import get_current_user
from plot_api.models import SessionLocal, User, UserMission
from plot_api.user_missions import (
    ProgressStats,
    UserMissionResponse,
    _mission_response,
    _progress_stats,
)

router = APIRouter(prefix="/users", tags=["Users"])


class ProfileResponse(BaseModel):
    id: int
    email: EmailStr
    display_name: str | None
    nickname: str | None
    avatar_id: str | None
    stats: ProgressStats
    recent_completed_missions: list[UserMissionResponse]


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProfileResponse:
    """Show only the signed-in user's profile and latest 5 completions."""
    with SessionLocal() as db:
        recent = db.scalars(
            select(UserMission)
            .where(
                UserMission.user_id == current_user.id,
                UserMission.status == "completed",
            )
            .order_by(UserMission.completed_at.desc(), UserMission.id.desc())
            .limit(5)
        ).all()

        return ProfileResponse(
            id=current_user.id,
            email=current_user.email,
            display_name=current_user.display_name,
            nickname=current_user.nickname,
            avatar_id=current_user.avatar_id,
            stats=_progress_stats(db, current_user.id),
            recent_completed_missions=[_mission_response(row) for row in recent],
        )
