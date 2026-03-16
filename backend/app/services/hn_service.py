import asyncio
from typing import Any

import httpx

HN_BASE = "https://hacker-news.firebaseio.com/v0"
FEED_URLS = {
    "top": f"{HN_BASE}/topstories.json",
    "new": f"{HN_BASE}/newstories.json",
    "best": f"{HN_BASE}/beststories.json",
}

MAX_COMMENTS = 150
MAX_DEPTH = 4


async def get_feed(
    client: httpx.AsyncClient, feed: str, page: int, limit: int
) -> list[dict]:
    url = FEED_URLS.get(feed, FEED_URLS["top"])
    resp = await client.get(url)
    resp.raise_for_status()
    ids: list[int] = resp.json()
    page_ids = ids[(page - 1) * limit : page * limit]
    items = await asyncio.gather(*[_fetch_item(client, i) for i in page_ids])
    return [item for item in items if item and item.get("type") == "story"]


async def get_story(client: httpx.AsyncClient, story_id: int) -> dict | None:
    item = await _fetch_item(client, story_id)
    if not item:
        return None
    counter = {"count": 0}
    item["comments"] = await _fetch_comments(
        client, item.get("kids", []), depth=0, counter=counter
    )
    return item


async def _fetch_item(client: httpx.AsyncClient, item_id: int) -> dict | None:
    try:
        resp = await client.get(f"{HN_BASE}/item/{item_id}.json")
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


async def _fetch_comments(
    client: httpx.AsyncClient,
    kid_ids: list[int],
    depth: int,
    counter: dict,
) -> list[dict]:
    if depth >= MAX_DEPTH or not kid_ids or counter["count"] >= MAX_COMMENTS:
        return []

    to_fetch = kid_ids[: MAX_COMMENTS - counter["count"]]
    items: list[Any] = await asyncio.gather(
        *[_fetch_item(client, kid) for kid in to_fetch]
    )

    comments = []
    for item in items:
        if not item or item.get("deleted") or item.get("dead"):
            continue
        if counter["count"] >= MAX_COMMENTS:
            break
        counter["count"] += 1
        item["comments"] = await _fetch_comments(
            client, item.get("kids", []), depth + 1, counter
        )
        comments.append(item)

    return comments
