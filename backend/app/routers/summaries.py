from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.models.summary import SummaryResponse
from app.services import hn_service, gemini_service
from app.services.gemini_service import GeminiError
from app.routers.stories import get_hn_client

router = APIRouter(prefix="/api/summaries", tags=["summaries"])


@router.get("/{story_id}", response_model=SummaryResponse)
async def get_summary(
    story_id: int,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> SummaryResponse:
    doc = await db["summaries"].find_one({"story_id": story_id})
    if not doc:
        raise HTTPException(status_code=404, detail="No cached summary for this story")
    return _to_response(doc)


@router.post("/{story_id}", response_model=SummaryResponse)
async def generate_summary(
    story_id: int,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> SummaryResponse:
    # Return cached if available
    doc = await db["summaries"].find_one({"story_id": story_id})
    if doc:
        return _to_response(doc)

    # Fetch story + comments
    try:
        story = await hn_service.get_story(get_hn_client(), story_id)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"HN API error: {exc}")

    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    comments = story.get("comments", [])
    comment_count = story.get("descendants", len(comments))

    # Generate via Gemini
    try:
        result = await gemini_service.generate_summary(
            story_id=story_id,
            title=story.get("title", ""),
            comments=comments,
            comment_count=comment_count,
        )
    except GeminiError as exc:
        raise HTTPException(
            status_code=503,
            detail={"error": str(exc), "retryable": exc.retryable},
        )

    result["generated_at"] = datetime.utcnow()
    await db["summaries"].insert_one(result)

    return _to_response(result)


def _to_response(doc: dict) -> SummaryResponse:
    return SummaryResponse(
        story_id=doc["story_id"],
        key_points=doc["key_points"],
        sentiment=doc["sentiment"],
        summary=doc["summary"],
        comment_count_at_generation=doc["comment_count_at_generation"],
        generated_at=doc["generated_at"],
    )
