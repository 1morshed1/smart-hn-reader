from typing import Annotated, Literal

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services import hn_service

router = APIRouter(prefix="/api/stories", tags=["stories"])

_client: httpx.AsyncClient | None = None


def get_hn_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=30.0)
    return _client


@router.get("")
async def list_stories(
    feed: Annotated[Literal["top", "new", "best"], Query()] = "top",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=50)] = 30,
) -> list[dict]:
    try:
        return await hn_service.get_feed(get_hn_client(), feed, page, limit)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"HN API error: {exc}")


@router.get("/{story_id}")
async def get_story(story_id: int) -> dict:
    story = await hn_service.get_story(get_hn_client(), story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story
