from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_.-]{3,32}$")
QUEST_ID_PATTERN = re.compile(r"^(lesson-(?:[1-9]|1[0-2])|boss-[12])$")

SoloLevelName = Literal[
    "Pre-structural",
    "Uni-structural",
    "Multi-structural",
    "Relational",
    "Extended Abstract",
]


class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        cleaned = value.strip()
        if not USERNAME_PATTERN.match(cleaned):
            raise ValueError(
                "Username must be 3-32 characters using letters, numbers, _, ., or -"
            )
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(ch.isalpha() for ch in value) or not any(ch.isdigit() for ch in value):
            raise ValueError("Password must include at least one letter and one number")
        return value


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=1, max_length=128)


class UserProfile(BaseModel):
    id: str
    username: str
    exp: int
    completed_quests: list[str] = Field(default_factory=list)
    solo_history: dict[str, str] = Field(default_factory=dict)
    streak_days: int = 1


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"  # noqa: S105
    expires_in: int
    user: UserProfile


class ExpUpdateRequest(BaseModel):
    amount: int = Field(..., ge=1, le=1000)


class QuestCompleteRequest(BaseModel):
    exp_reward: int = Field(default=100, ge=20, le=500)
    solo_level: SoloLevelName = "Relational"


class QuestCompleteResponse(BaseModel):
    newly_completed: bool
    awarded_exp: int
    user: UserProfile


class LeaderboardEntry(BaseModel):
    username: str
    exp: int
    completed_count: int = 0


class SoloAnalyzeRequest(BaseModel):
    code: str = Field(..., max_length=12000)
    quest_title: str = Field(default="HTML Practice", max_length=150)
    quest_goal: str = Field(default="สร้างโครงสร้าง HTML ที่ถูกต้อง", max_length=400)
    required_tags: list[str] = Field(default_factory=list, max_length=20)
    user_question: str | None = Field(default=None, max_length=400)


class SoloAnalyzeResponse(BaseModel):
    solo_level: SoloLevelName
    solo_label_th: str
    solo_rank: int
    structure_score: int
    tag_count: int
    nesting_depth: int
    semantic_count: int
    matched_requirements: int
    total_requirements: int
    unclosed_tags: list[str]
    suggestions: list[str]
    socratic_question: str
    mentor_message: str
    engine: str


class MessageResponse(BaseModel):
    message: str
