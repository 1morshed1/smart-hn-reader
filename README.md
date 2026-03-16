# Smart HN Reader

A Hacker News client with AI-powered discussion summaries. Browse top/new/best feeds, bookmark stories, and get instant AI summaries of comment threads.

---

## Setup

**Requirements:** Docker, Docker Compose, a [Google Gemini API key](https://aistudio.google.com/app/apikey)

```bash
# 1. Clone the repo
git clone <repo-url>
cd smart-hn-reader

# 2. Set your Gemini API key
cp backend/.env.example backend/.env
# Edit backend/.env and set GEMINI_API_KEY=your_actual_key

# 3. Start everything
docker-compose up --build
```

Open [http://localhost](http://localhost) in your browser.

> The first build takes a few minutes (Python deps + Node build). Subsequent starts are fast.

---

## Architecture

```
Browser → nginx (port 80)
            ├── /api/* → FastAPI backend (port 8000)
            └── /*     → React SPA (static)

FastAPI → MongoDB (storage: bookmarks, cached summaries)
        → HN Firebase API (story/comment data)
        → Google Gemini API (discussion summaries)
```

**Backend:** Python 3.12 · FastAPI · Motor (async MongoDB) · httpx · pydantic-settings

**Frontend:** React 18 · Vite · React Router v6 · TanStack Query v5

**Database:** MongoDB — stores bookmarks and cached AI summaries

**AI:** Google Gemini (`gemini-2.0-flash`) via REST

### Key Design Decisions

- **Concurrent HN fetches** — `asyncio.gather()` fetches story items in parallel; the HN API has no batch endpoint so this is essential for acceptable feed load times.
- **Comment tree depth 4, max 150 comments** — Prevents runaway memory on deeply nested threads while capturing the most valuable top-level discussion.
- **Summary caching** — Summaries are stored in MongoDB indefinitely. Gemini calls are expensive and slow; caching means repeat visits are instant.
- **Gemini `responseMimeType: application/json`** — Forces the model to return clean JSON directly, eliminating any need to strip markdown fences or parse prose responses.
- **nginx reverse proxy** — The frontend container serves static assets and proxies `/api` to the backend. No CORS issues, single exposed port, and the frontend never hardcodes a backend host.
- **TanStack Query for server state** — Handles caching, background refetching, and loading/error states without a global store. Optimistic updates on bookmark toggle make the UI feel instant.
- **No authentication** — Single-user per spec. CORS is open for local dev.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stories?feed=top\|new\|best&page=1&limit=30` | Paginated feed |
| GET | `/api/stories/{id}` | Story + comment tree |
| GET | `/api/bookmarks?search=query` | List bookmarks (optional search) |
| POST | `/api/bookmarks` | Save a bookmark |
| DELETE | `/api/bookmarks/{story_id}` | Remove a bookmark |
| GET | `/api/summaries/{story_id}` | Get cached summary |
| POST | `/api/summaries/{story_id}` | Generate summary (or return cached) |
| GET | `/health` | Backend health check |

Interactive docs available at [http://localhost/api/docs](http://localhost/api/docs) when running.

---

## Tradeoffs

- **Gemini over local LLM** — Switched from Ollama/llama3.2 to Gemini for dramatically better summary quality and speed. Tradeoff: requires an API key and internet access; a local LLM would work fully offline.
- **No summary invalidation** — Cached summaries never expire. This is intentional (HN comment threads don't change much after a few hours) but means you can't refresh a stale summary without directly deleting the DB record.
- **Comment depth cap** — Depth 4 / 150 comments misses deeply nested replies but keeps responses fast and prompts manageable. Most substantive discussion happens near the top.
- **Single-user, no auth** — Bookmarks are global; anyone with access to the running instance shares the same bookmark list. Acceptable for personal use, not for multi-user deployment.

---

## What I'd Add With More Time

- **Force-refresh summaries** — A `DELETE /api/summaries/{story_id}` endpoint or a "Re-summarize" button in the UI
- **Reading list / read status** — Mark stories as read; filter feed to unread only
- **Notifications / polling** — Auto-refresh feed in background, badge new stories
- **Summary streaming** — Stream Gemini output token-by-token for a faster perceived response
- **Better search** — Full-text search across bookmarks currently uses MongoDB text index on title only; extending to summary content would be more useful
- **CORS lockdown + env-based config** — Restrict origins and externalize more config for a production-ready setup
