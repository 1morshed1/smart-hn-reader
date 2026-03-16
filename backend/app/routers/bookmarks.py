from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.models.bookmark import BookmarkCreate, BookmarkResponse
from app.services import bookmark_service

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


@router.get("", response_model=list[BookmarkResponse])
async def list_bookmarks(
    search: Annotated[str | None, Query()] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[BookmarkResponse]:
    return await bookmark_service.list_bookmarks(db, search)


@router.post("", response_model=BookmarkResponse, status_code=201)
async def create_bookmark(
    data: BookmarkCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> BookmarkResponse:
    return await bookmark_service.create_bookmark(db, data)


@router.delete("/{story_id}", status_code=204)
async def delete_bookmark(
    story_id: int,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> None:
    deleted = await bookmark_service.delete_bookmark(db, story_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Bookmark not found")
