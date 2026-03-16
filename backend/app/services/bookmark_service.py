from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.models.bookmark import BookmarkCreate, BookmarkResponse


async def create_bookmark(
    db: AsyncIOMotorDatabase, data: BookmarkCreate
) -> BookmarkResponse:
    doc = data.model_dump()
    doc["bookmarked_at"] = datetime.utcnow()
    try:
        await db["bookmarks"].insert_one(doc)
    except DuplicateKeyError:
        # Already bookmarked — return existing
        existing = await db["bookmarks"].find_one({"story_id": data.story_id})
        return _to_response(existing)
    return _to_response(doc)


async def list_bookmarks(
    db: AsyncIOMotorDatabase, search: str | None = None
) -> list[BookmarkResponse]:
    query: dict = {}
    if search:
        query = {"$text": {"$search": search}}
    cursor = db["bookmarks"].find(query).sort("bookmarked_at", -1)
    docs = await cursor.to_list(length=1000)
    return [_to_response(doc) for doc in docs]


async def delete_bookmark(db: AsyncIOMotorDatabase, story_id: int) -> bool:
    result = await db["bookmarks"].delete_one({"story_id": story_id})
    return result.deleted_count > 0


def _to_response(doc: dict) -> BookmarkResponse:
    return BookmarkResponse(
        story_id=doc["story_id"],
        title=doc["title"],
        url=doc.get("url"),
        points=doc.get("points", 0),
        author=doc["author"],
        comment_count=doc.get("comment_count", 0),
        bookmarked_at=doc["bookmarked_at"],
    )
