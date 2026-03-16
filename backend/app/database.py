from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings


class Database:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


db_state = Database()


async def connect_db() -> None:
    db_state.client = AsyncIOMotorClient(settings.mongo_url)
    db_state.db = db_state.client[settings.mongo_db]
    await _ensure_indexes()


async def close_db() -> None:
    if db_state.client:
        db_state.client.close()


async def _ensure_indexes() -> None:
    bookmarks = db_state.db["bookmarks"]
    await bookmarks.create_index("story_id", unique=True)
    await bookmarks.create_index([("title", "text")])

    summaries = db_state.db["summaries"]
    await summaries.create_index("story_id", unique=True)


def get_db() -> AsyncIOMotorDatabase:
    return db_state.db
