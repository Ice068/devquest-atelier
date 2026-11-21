from __future__ import annotations

from fastapi import APIRouter, Request

from app.core.ai_mentor import analyze_with_solo_ai
from app.core.limiter import limiter
from app.models.schemas import SoloAnalyzeRequest, SoloAnalyzeResponse

router = APIRouter(prefix="/ai", tags=["AI SOLO Mentor"])


@router.post("/solo-analyze", response_model=SoloAnalyzeResponse)
@limiter.limit("20/minute")
async def solo_analyze(
    request: Request,
    payload: SoloAnalyzeRequest,
) -> SoloAnalyzeResponse:
    """Analyze student HTML code and return adaptive SOLO Taxonomy coaching."""
    result = await analyze_with_solo_ai(
        code=payload.code,
        quest_title=payload.quest_title,
        quest_goal=payload.quest_goal,
        required_tags=payload.required_tags,
        user_question=payload.user_question,
    )
    return SoloAnalyzeResponse(**result)
