# Smart HN Reader — Demo Video Script

**Estimated runtime: ~4 minutes**

---

## [INTRO — 0:00–0:20]

> "Hey, I built Smart HN Reader — a personal Hacker News client that adds AI-powered discussion summaries and bookmarking. I'll walk through the app first, then explain the key technical decisions behind it."

---

## [WALKTHROUGH — 0:20–2:00]

**Feed page**
> "This is the main feed. It pulls from the official HN Firebase API — you can switch between Top, New, and Best stories using the tabs up here. Scrolling down triggers infinite scroll automatically; no button to hit, it just loads the next page."

**Story card + navigating in**
> "Each card shows the title, source domain, score, and comment count — same information density as HN itself. Clicking a story opens the detail view."

**Story page — AI summary**
> "This is where the AI summary lives. When you hit 'Summarize Discussion', it sends the comment thread to Google Gemini and returns a structured summary. You can see the loading state — it cycles through messages like 'Reading comments…' and 'Finding key points…' because Gemini can take a few seconds and a blank spinner feels like nothing is happening."

> "Once it comes back, you get a short overview, key points, and a sentiment badge — green for positive, red for negative, amber for mixed. The summary is cached, so the next time anyone opens this story it's instant."

**Comments**
> "Below the summary is the full comment tree. Threads on HN can get very long so each comment is collapsible. You can fold away a whole sub-thread with one click."

**Bookmarking**
> "The bookmark button up here is optimistic — it toggles immediately in the UI without waiting for the server response. If the backend call fails it rolls back. Makes the interaction feel instant."

**Bookmarks page**
> "The bookmarks page lists everything you've saved. There's a search bar here — it does a text search against story titles with a 300ms debounce so it's not firing on every keystroke. You can remove a bookmark directly from here too."

---

## [TECHNICAL DECISIONS — 2:00–3:45]

**Gemini over a local LLM**
> "Originally I used Ollama with llama3.2 running locally. I switched to Google Gemini for two reasons: summary quality is significantly better, and the latency dropped from 30–90 seconds on CPU to a few seconds. The tradeoff is you need an API key and internet access — a local model would work fully offline. For a personal tool I think that's the right call."

**`responseMimeType: application/json`**
> "One thing I was careful about with Gemini: I pass `responseMimeType: application/json` in the request. This tells the model to return valid JSON directly rather than wrapping it in markdown fences or prose. It means I never have to strip backticks or parse around text — the response is always clean JSON I can use immediately."

**Concurrent HN fetches**
> "The HN API has no batch endpoint — you fetch each item individually. To get a 30-story feed you'd normally make 30 sequential requests. Instead I use `asyncio.gather()` to fire all 30 requests in parallel. That brings feed load time from potentially 15+ seconds down to roughly the latency of one request."

**Comment tree depth cap**
> "HN threads can be thousands of nodes. I cap the comment tree at depth 4 and a maximum of 150 comments. Most substantive discussion is near the top anyway, and this keeps both the API response size and the Gemini prompt manageable."

**Summary caching**
> "Summaries are stored in MongoDB indefinitely. Gemini calls aren't free and the comment threads on an HN post don't meaningfully change after a few hours, so there's no reason to regenerate. A cache hit returns the stored summary instantly — no Gemini call at all."

**nginx reverse proxy**
> "The frontend container runs nginx which serves the static React build and proxies `/api/*` to the backend container. This means one port exposed to the outside — port 80 — and the frontend never has to know the backend's address. It also eliminates CORS entirely since both the static assets and the API come from the same origin."

**TanStack Query**
> "I used TanStack Query for all server state — the feed, story detail, bookmarks, and summaries. It handles caching, background refetching, and loading/error states out of the box. Combined with the optimistic bookmark mutation pattern — `onMutate`, `onError`, `onSettled` — I get instant UI feedback with automatic rollback for free."

---

## [CLOSE — 3:45–4:00]

> "That's Smart HN Reader. Backend is FastAPI with Motor for async MongoDB access, frontend is React with Vite, and the whole thing runs with a single `docker-compose up`. Thanks for watching."

---

## Recording Tips

- Have the app running locally (`docker-compose up`) before you start
- Pre-load a story that already has a cached summary so you can show both the loading state (open a fresh one first) and the instant cached response
- Keep the browser zoom at ~110% so text is readable in the recording
