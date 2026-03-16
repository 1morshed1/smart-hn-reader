from datetime import datetime
from pydantic import BaseModel, Field


class SummaryResponse(BaseModel):
    story_id: int
    key_points: list[str]
    sentiment: str
    summary: str
    comment_count_at_generation: int
    generated_at: datetime = Field(default_factory=datetime.utcnow)
