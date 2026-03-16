# Backend Plan — Smart HN Reader

**Stack:** Python · FastAPI · MongoDB (Motor) · Ollama (local LLM)

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py                  # App entry, CORS, lifespan hooks
│   ├── config.py                # pydantic-settings — typed env vars
│   ├── database.py              # Motor async client singleton
│   ├── routers/
│   │   ├── stories.py           # HN feed + story detail
│   │   ├── bookmarks.py         # Save / list / delete bookmarks
│   │   └── summaries.py         # Trigger + fetch AI summaries
│   ├── services/
│   │   ├── hn_service.py        # httpx async HN API calls
│   │   ├── bookmark_service.py  # MongoDB CRUD
│   │   └── ollama_service.py    # Prompt builder + LLM caller
│   └── models/
│       ├── bookmark.py          # Pydantic request/response models
│       └── summary.py
├── requirements.txt
├── Dockerfile
└── .env
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/stories?feed=top\|new\|best&page=1&limit=30` | Paginated story list |
| `GET` | `/api/stories/{id}` | Single story + full comment tree |
| `GET` | `/api/bookmarks?search=query` | List bookmarks, optional text search |
| `POST` | `/api/bookmarks` | Save a story as a bookmark |
| `DELETE` | `/api/bookmarks/{story_id}` | Remove a bookmark |
| `GET` | `/api/summaries/{story_id}` | Return cached summary if it exists |
| `POST` | `/api/summaries/{story_id}` | Generate (or return cached) AI summary |

---

## MongoDB Collections

### `bookmarks`

```json
{
  "_id": "ObjectId",
  "story_id": 12345,
  "title": "Show HN: I built a thing",
  "url": "https://example.com",
  "points": 342,
  "author": "pg",
  "comment_count": 187,
  "bookmarked_at": "2024-01-01T00:00:00Z"
}
```

- Unique index on `story_id`
- Text index on `title` for `/api/bookmarks?search=...`

### `summaries`

```json
{
  "_id": "ObjectId",
  "story_id": 12345,
  "key_points": ["point 1", "point 2", "point 3"],
  "sentiment": "mixed",
  "summary": "The discussion centres on...",
  "comment_count_at_generation": 187,
  "generated_at": "2024-01-01T00:00:00Z"
}
```

- Unique index on `story_id`
- Once stored, always returned from cache — no auto-regeneration

---

## HN API Integration

The HN Firebase API returns IDs in bulk (up to 500) and requires individual item fetches.

### Feed strategy

1. Fetch the ID list for `top | new | best`
2. Slice the page window: `ids[page*limit : (page+1)*limit]`
3. Fire all item requests concurrently with `asyncio.gather()`
4. Use a shared `httpx.AsyncClient` session (don't open a new connection per request)

### Comment tree strategy

HN nests comments via a `kids` array recursively. To avoid blowing out memory and LLM token limits:

- Fetch up to **depth 4** only
- Cap at **150 comments** total per story
- Use `asyncio.gather()` at each level so the whole tree fetches in ~4 round trips instead of hundreds

---

## Ollama Integration

### Prompt design

Flatten the comment tree to plain text (`Author: comment text\n`), truncate at ~6,000 characters, then call Ollama.

```
System:
You are an expert discussion analyst. Be objective and concise.
Respond ONLY with valid JSON — no markdown fences, no preamble.

User:
Analyse this Hacker News discussion for the story: "{title}"

Comments:
{flattened_comments}

Return this exact JSON shape:
{
  "key_points": ["...", "...", "...", "...", "..."],
  "sentiment": "positive" | "negative" | "mixed" | "neutral",
  "summary": "2–3 sentence overview of the discussion."
}
```

### Calling Ollama

- `POST http://ollama:11434/api/generate` with `stream: false`
- Set a **90-second timeout** in httpx
- On timeout → return `503` with `{ "error": "LLM timeout", "retryable": true }`
- On bad JSON → return `503` with `{ "error": "LLM returned unparseable response" }`
- Never silently swallow errors — the frontend needs a signal to show a retry button

### Caching

Before calling Ollama, always check `summaries` collection for an existing record. If found, return immediately. This means:

- The first request per story is slow (Ollama latency)
- Every subsequent request is instant (MongoDB read)
- To force a refresh: `DELETE /api/summaries/{story_id}` then `POST` again (can be added later)

---

## Key Libraries

| Library | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `motor` | Async MongoDB driver (native asyncio, no thread pool) |
| `httpx` | Async HTTP client for HN API + Ollama |
| `pydantic-settings` | Typed config from `.env` |
| `uvicorn` | ASGI server |

---

## Environment Variables (`.env`)

```env
MONGO_URL=mongodb://mongo:27017
MONGO_DB=hn_reader
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3
BACKEND_PORT=8000
```

---

## Docker

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Key Design Decisions & Tradeoffs

- **Motor over PyMongo** — async-first, pairs naturally with FastAPI's event loop
- **Comment depth cap at 4 / 150 comments** — prevents memory explosion on huge threads; the majority of HN value is in top-level replies anyway
- **Summaries cached indefinitely** — avoids hammering Ollama; a force-refresh endpoint can be added later
- **No auth** — single-user per spec; CORS is open for local dev
- **asyncio.gather() for concurrent item fetches** — makes the feed feel fast despite HN's per-item API design
- **90s Ollama timeout with explicit error shape** — lets the frontend show a meaningful retry state instead of a blank spinner
