import json

import httpx

from app.config import settings

GEMINI_TIMEOUT = 30.0
MAX_COMMENT_CHARS = 6000
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def _flatten_comments(comments: list[dict], depth: int = 0) -> str:
    lines = []
    for c in comments:
        text = c.get("text") or ""
        author = c.get("by") or "unknown"
        indent = "  " * depth
        lines.append(f"{indent}{author}: {text}")
        if c.get("comments"):
            lines.append(_flatten_comments(c["comments"], depth + 1))
    return "\n".join(lines)


async def generate_summary(
    story_id: int,
    title: str,
    comments: list[dict],
    comment_count: int,
) -> dict:
    flat = _flatten_comments(comments)[:MAX_COMMENT_CHARS]

    system = "You are an expert discussion analyst. Be objective and concise."
    prompt = (
        f'Analyse this Hacker News discussion for the story: "{title}"\n\n'
        f"Comments:\n{flat}\n\n"
        "Return this exact JSON shape:\n"
        '{\n'
        '  "key_points": ["...", "...", "...", "...", "..."],\n'
        '  "sentiment": "positive" | "negative" | "mixed" | "neutral",\n'
        '  "summary": "2-3 sentence overview of the discussion."\n'
        '}'
    )

    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }

    url = f"{GEMINI_BASE}/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"

    try:
        async with httpx.AsyncClient(timeout=GEMINI_TIMEOUT) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
    except httpx.TimeoutException:
        raise GeminiError("LLM timeout", retryable=True)
    except httpx.HTTPStatusError as exc:
        raise GeminiError(f"Gemini API error: {exc.response.status_code}", retryable=True)
    except Exception as exc:
        raise GeminiError(f"Gemini request failed: {exc}", retryable=True)

    try:
        raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        raise GeminiError("LLM returned unparseable response", retryable=False)

    return {
        "story_id": story_id,
        "key_points": parsed.get("key_points", []),
        "sentiment": parsed.get("sentiment", "neutral"),
        "summary": parsed.get("summary", ""),
        "comment_count_at_generation": comment_count,
    }


class GeminiError(Exception):
    def __init__(self, message: str, retryable: bool) -> None:
        super().__init__(message)
        self.retryable = retryable
