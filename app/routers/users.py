from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.limiter import limiter
from app.core.storage import UserRepository, get_repository
from app.dependencies import get_current_user
from app.models.schemas import (
    QUEST_ID_PATTERN,
    ExpUpdateRequest,
    LeaderboardEntry,
    QuestCompleteRequest,
    QuestCompleteResponse,
    UserProfile,
)

router = APIRouter(tags=["Users & Progress"])


def _to_profile(user: dict[str, Any]) -> UserProfile:
    return UserProfile(
        id=user["id"],
        username=user["username"],
        exp=int(user.get("exp", 0)),
        completed_quests=list(user.get("completed_quests", [])),
        solo_history=dict(user.get("solo_history", {})),
        streak_days=int(user.get("streak_days", 1)),
    )


@router.get("/users/me", response_model=UserProfile)
def read_me(current_user: dict[str, Any] = Depends(get_current_user)) -> UserProfile:
    return _to_profile(current_user)


@router.patch("/users/me/exp", response_model=UserProfile)
@limiter.limit("30/minute")
def add_my_exp(
    request: Request,
    payload: ExpUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    repo: UserRepository = Depends(get_repository),
) -> UserProfile:
    # User ID comes strictly from verified JWT (prevents IDOR)
    updated = repo.add_exp(current_user["id"], payload.amount)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _to_profile(updated)


@router.post("/users/me/quests/{quest_id}/complete", response_model=QuestCompleteResponse)
@limiter.limit("30/minute")
def complete_quest(
    request: Request,
    quest_id: str,
    payload: QuestCompleteRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    repo: UserRepository = Depends(get_repository),
) -> QuestCompleteResponse:
    if not QUEST_ID_PATTERN.match(quest_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid quest identifier",
        )
    updated, newly_completed = repo.complete_quest(
        user_id=current_user["id"],
        quest_id=quest_id,
        exp_reward=payload.exp_reward,
        solo_level=payload.solo_level,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return QuestCompleteResponse(
        newly_completed=newly_completed,
        awarded_exp=payload.exp_reward if newly_completed else 0,
        user=_to_profile(updated),
    )


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
@limiter.limit("60/minute")
def get_leaderboard(
    request: Request,
    repo: UserRepository = Depends(get_repository),
) -> list[LeaderboardEntry]:
    rows = repo.get_leaderboard(limit=10)
    return [LeaderboardEntry(**row) for row in rows]
