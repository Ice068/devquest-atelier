from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.config import get_settings
from app.core.limiter import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.core.storage import UserRepository, get_repository
from app.dependencies import get_current_token_payload
from app.models.schemas import (
    AuthResponse,
    LoginRequest,
    MessageResponse,
    SignupRequest,
    UserProfile,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _to_profile(user: dict[str, Any]) -> UserProfile:
    return UserProfile(
        id=user["id"],
        username=user["username"],
        exp=int(user.get("exp", 0)),
        completed_quests=list(user.get("completed_quests", [])),
        solo_history=dict(user.get("solo_history", {})),
        streak_days=int(user.get("streak_days", 1)),
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def signup(
    request: Request,
    payload: SignupRequest,
    repo: UserRepository = Depends(get_repository),
) -> AuthResponse:
    existing = repo.get_user_by_username(payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken",
        )
    pw_hash = hash_password(payload.password)
    user = repo.create_user(payload.username, pw_hash)
    token, _, _ = create_access_token(subject=user["id"], username=user["username"])
    settings = get_settings()
    return AuthResponse(
        access_token=token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=_to_profile(user),
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    payload: LoginRequest,
    repo: UserRepository = Depends(get_repository),
) -> AuthResponse:
    user = repo.get_user_by_username(payload.username.strip())
    # Always verify against a dummy hash if user missing to reduce timing side-channels
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token, _, _ = create_access_token(subject=user["id"], username=user["username"])
    settings = get_settings()
    return AuthResponse(
        access_token=token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=_to_profile(user),
    )


@router.post("/logout", response_model=MessageResponse)
@limiter.limit("20/minute")
def logout(
    request: Request,
    token_payload: dict[str, Any] = Depends(get_current_token_payload),
    repo: UserRepository = Depends(get_repository),
) -> MessageResponse:
    jti = str(token_payload["jti"])
    exp = int(token_payload["exp"])
    repo.revoke_token(jti=jti, expires_at=exp)
    return MessageResponse(message="Logged out and token revoked")
