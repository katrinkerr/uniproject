"""RMG-59: start, complete, and list authenticated user's mission attempts."""

import time
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from plot_api.auth import get_current_user
from plot_api.missions import MISSIONS, MissionResponse
from plot_api.models import SessionLocal, User, UserMission

router = APIRouter(prefix="/users/me/missions", tags=["User Missions"])
MissionStatus = Literal["in_progress", "completed"]
MISSION_BY_ID = {mission.id: mission for mission in MISSIONS}
LOCAL_TZ = ZoneInfo("Europe/Kyiv")


class StartMissionRequest(BaseModel):
    mission_id: int = Field(gt=0)


class UserMissionResponse(BaseModel):
    id: int
    mission: MissionResponse
    status: MissionStatus
    started_at: str
    completed_at: str | None
    earned_xp: int


class MissionListResponse(BaseModel):
    items: list[UserMissionResponse]


class ProgressStats(BaseModel):
    total_xp: int
    level: int
    xp_in_level: int
    xp_to_next_level: int
    completed_missions: int
    active_missions: int
    streak_days: int


class CompleteMissionResponse(BaseModel):
    user_mission: UserMissionResponse
    stats: ProgressStats


def _iso_utc(timestamp: int | None) -> str | None:
    if timestamp is None:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat().replace(
        "+00:00", "Z"
    )


def _mission_response(attempt: UserMission) -> UserMissionResponse:
    return UserMissionResponse(
        id=attempt.id,
        mission=MISSION_BY_ID[attempt.mission_id],
        status=attempt.status,
        started_at=_iso_utc(attempt.started_at),
        completed_at=_iso_utc(attempt.completed_at),
        earned_xp=attempt.earned_xp,
    )


def _progress_stats(db, user_id: int) -> ProgressStats:
    attempts = db.scalars(
        select(UserMission).where(UserMission.user_id == user_id)
    ).all()
    total_xp = sum(attempt.earned_xp for attempt in attempts)
    finished = [attempt for attempt in attempts if attempt.status == "completed"]
    dates = {
        datetime.fromtimestamp(attempt.completed_at, tz=LOCAL_TZ).date()
        for attempt in finished
        if attempt.completed_at is not None
    }

    # A day is counted once, even when several missions were completed.
    day = datetime.now(LOCAL_TZ).date()
    if day not in dates:
        day -= timedelta(days=1)
    streak = 0
    while day in dates:
        streak += 1
        day -= timedelta(days=1)

    return ProgressStats(
        total_xp=total_xp,
        level=1 + total_xp // 500,
        xp_in_level=total_xp % 500,
        xp_to_next_level=500 - total_xp % 500,
        completed_missions=len(finished),
        active_missions=sum(
            attempt.status == "in_progress" for attempt in attempts
        ),
        streak_days=streak,
    )


@router.post("", response_model=UserMissionResponse, status_code=201)
def start_mission(
    data: StartMissionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserMissionResponse:
    """Persist a mission attempt; one unfinished attempt per user."""
    if data.mission_id not in MISSION_BY_ID:
        raise HTTPException(status_code=404, detail="Mission not found")

    with SessionLocal() as db:
        existing = db.scalar(
            select(UserMission.id).where(
                UserMission.user_id == current_user.id,
                UserMission.status == "in_progress",
            )
        )
        if existing is not None:
            raise HTTPException(status_code=409, detail="An in-progress mission already exists")

        attempt = UserMission(
            user_id=current_user.id,
            mission_id=data.mission_id,
            status="in_progress",
            started_at=int(time.time()),
            completed_at=None,
            earned_xp=0,
        )
        db.add(attempt)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            # A concurrent request may have started another mission.
            existing = db.scalar(
                select(UserMission.id).where(
                    UserMission.user_id == current_user.id,
                    UserMission.status == "in_progress",
                )
            )
            if existing is not None:
                raise HTTPException(
                    status_code=409, detail="An in-progress mission already exists"
                ) from exc
            raise
        db.refresh(attempt)
        return _mission_response(attempt)


@router.post("/{attempt_id}/complete", response_model=CompleteMissionResponse)
def complete_mission(
    attempt_id: Annotated[int, Path(gt=0)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> CompleteMissionResponse:
    """Complete an owned attempt exactly once and grant its catalog XP."""
    with SessionLocal() as db:
        attempt = db.scalar(
            select(UserMission).where(
                UserMission.id == attempt_id,
                UserMission.user_id == current_user.id,
            )
        )
        if attempt is None:
            # Do not reveal whether another user owns the attempt.
            raise HTTPException(status_code=404, detail="Mission attempt not found")
        if attempt.status != "in_progress":
            raise HTTPException(status_code=409, detail="Mission already completed")

        xp = MISSION_BY_ID[attempt.mission_id].xp
        completed_at = max(int(time.time()), attempt.started_at)
        result = db.execute(
            update(UserMission)
            .where(
                UserMission.id == attempt_id,
                UserMission.user_id == current_user.id,
                UserMission.status == "in_progress",
            )
            .values(status="completed", completed_at=completed_at, earned_xp=xp)
        )
        if result.rowcount != 1:
            db.rollback()
            raise HTTPException(status_code=409, detail="Mission already completed")

        db.commit()  # One atomic change of status, end date and awarded XP.
        db.refresh(attempt)
        return CompleteMissionResponse(
            user_mission=_mission_response(attempt),
            stats=_progress_stats(db, current_user.id),
        )


@router.get("", response_model=MissionListResponse)
def list_my_missions(
    current_user: Annotated[User, Depends(get_current_user)],
    status: MissionStatus | None = None,
) -> MissionListResponse:
    """List the current user's persisted attempts after a page reload."""
    with SessionLocal() as db:
        query = select(UserMission).where(UserMission.user_id == current_user.id)
        if status is not None:
            query = query.where(UserMission.status == status)
        attempts = db.scalars(
            query.order_by(UserMission.started_at.desc(), UserMission.id.desc())
        ).all()
        return MissionListResponse(items=[_mission_response(a) for a in attempts])
