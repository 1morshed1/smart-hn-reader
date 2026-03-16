from datetime import datetime
from pydantic import BaseModel, Field


class BookmarkCreate(BaseModel):
    story_id: int
    title: str
    url: str | None = None
    points: int = 0
    author: str
    comment_count: int = 0


class BookmarkResponse(BaseModel):
    story_id: int
    title: str
    url: str | None = None
    points: int
    author: str
    comment_count: int
    bookmarked_at: datetime = Field(default_factory=datetime.utcnow)
