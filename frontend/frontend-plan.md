# Frontend Plan — Smart HN Reader

**Stack:** React 18 · Vite · React Router v6 · TanStack Query v5

---

## Folder Structure

```
frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx                    # Router + QueryClientProvider
│   ├── api/
│   │   ├── stories.js             # fetch wrappers for /api/stories
│   │   ├── bookmarks.js           # fetch wrappers for /api/bookmarks
│   │   └── summaries.js           # fetch wrappers for /api/summaries
│   ├── hooks/
│   │   ├── useInfiniteStories.js  # useInfiniteQuery — feed with infinite scroll
│   │   ├── useStory.js            # useQuery — single story + comments
│   │   ├── useBookmarks.js        # useQuery + useMutation (add / remove)
│   │   └── useSummary.js          # useMutation — POST to trigger AI summary
│   ├── components/
│   │   ├── Navbar.jsx             # Feed / Bookmarks nav links
│   │   ├── StoryCard.jsx          # Shared card: title, points, author, time, count
│   │   ├── FeedTabs.jsx           # top / new / best switcher
│   │   ├── CommentThread.jsx      # Recursive comment tree renderer
│   │   ├── Comment.jsx            # Single comment (author, text, collapse)
│   │   ├── SummaryPanel.jsx       # AI summary card with loading/error/result states
│   │   ├── BookmarkButton.jsx     # Toggle button with optimistic update
│   │   └── SearchBar.jsx          # Debounced input for bookmark search
│   └── pages/
│       ├── FeedPage.jsx           # / — story feed with infinite scroll
│       ├── StoryPage.jsx          # /story/:id — detail + comments + summary
│       └── BookmarksPage.jsx      # /bookmarks — saved stories + search
├── index.html
├── vite.config.js                 # /api proxy → backend:8000
└── Dockerfile                     # nginx serving the Vite build
```

---

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | `FeedPage` | Paginated story feed, tab switcher, infinite scroll |
| `/story/:id` | `StoryPage` | Story header, AI summary panel, comment tree |
| `/bookmarks` | `BookmarksPage` | Saved stories list with search input |

---

## State Management Strategy

All server state lives in **TanStack Query** — no Redux, no Zustand, no prop drilling.

- `useInfiniteQuery` drives the infinite scroll feed
- `useMutation` handles bookmark add/remove with **optimistic updates** (UI flips instantly, rolls back on error)
- `useMutation` also drives summary generation — the button triggers it and the result is stored in the query cache
- Local UI state (active tab, search text) stays in plain `useState`

This keeps the mental model flat: one place for server data, component state for everything else.

---

## Pages

### FeedPage (`/`)

- Renders `FeedTabs` (top / new / best) — changing tab resets the query key, which refetches from page 1
- Renders a list of `StoryCard` components
- A sentinel `<div>` at the bottom of the list is observed by `IntersectionObserver`; when it enters the viewport, `fetchNextPage()` is called
- Shows a spinner row while `isFetchingNextPage` is true
- Clicking a card navigates to `/story/:id`

### StoryPage (`/story/:id`)

- Fetches the story + comment tree via `useStory(id)`
- Renders a `BookmarkButton` (optimistic toggle)
- Renders `SummaryPanel` — see UX detail below
- Renders `CommentThread` (recursive)

### BookmarksPage (`/bookmarks`)

- Fetches bookmarks via `useBookmarks(search)`
- `SearchBar` debounces input by 300ms before updating the query key
- Renders the same `StoryCard` component used in the feed, with a remove bookmark button

---

## Component Details

### `StoryCard`

Shared between `FeedPage` and `BookmarksPage`. Displays: title (link), points, author, time ago, comment count badge. Accepts a `variant` prop (`"feed"` | `"bookmark"`) — the bookmark variant adds a remove button.

### `CommentThread` + `Comment`

`CommentThread` renders a list of `Comment` components. Each `Comment` renders its text and then calls `<CommentThread comments={comment.kids} depth={depth+1} />` recursively. Indent level is `depth * 16px`. Add a collapse toggle on each comment to hide its children — useful for long threads.

### `SummaryPanel`

This is the most important UX component. Ollama on CPU can take 30–90 seconds. States to handle:

| State | What to show |
|-------|-------------|
| Idle (no summary yet) | "Summarise Discussion" button |
| Loading | Animated cycling message (see below) |
| Success | Summary card: paragraph + key points + sentiment badge |
| Error / Timeout | Error message + "Try Again" button |

**Loading message cycle** — rotate every 3 seconds while waiting:

1. `"Reading comments..."`
2. `"Finding key points..."`
3. `"Writing summary..."`

This removes the anxiety of staring at a blank spinner for 60+ seconds.

**Sentiment badge colours:**
- Positive → green
- Negative → red
- Mixed → amber
- Neutral → grey

### `BookmarkButton`

Uses `useMutation` with `onMutate` / `onError` / `onSettled` for optimistic updates:

1. `onMutate` — immediately toggle the bookmarked state in the query cache
2. `onError` — roll back to the previous cache snapshot
3. `onSettled` — invalidate the bookmarks query to sync with the server

---

## Infinite Scroll Implementation

```js
// useInfiniteStories.js
const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
  useInfiniteQuery({
    queryKey: ['stories', feed],
    queryFn: ({ pageParam = 1 }) => fetchStories({ feed, page: pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length + 1 : undefined,
  });

// In FeedPage.jsx — attach IntersectionObserver to a sentinel div
const sentinelRef = useRef(null);
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  });
  if (sentinelRef.current) observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

~20 lines, no extra library dependency.

---

## Vite Config

```js
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': 'http://backend:8000',
    },
  },
};
```

- Zero CORS issues in dev and Docker
- No hardcoded backend URL in any component
- In production, nginx handles the same proxy rule

---

## Docker

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

`nginx.conf` proxies `/api/*` to `http://backend:8000` so the single-origin rule holds in the Docker environment too.

---

## Key Design Decisions & Tradeoffs

- **TanStack Query over Redux** — far less boilerplate for a read-heavy app; cache invalidation is automatic
- **Vite proxy** — avoids CORS configuration entirely; the frontend never knows the backend's address
- **Optimistic updates on bookmarks** — the toggle feels instant; the network request happens in the background
- **IntersectionObserver for infinite scroll** — no third-party dependency, well-supported in all modern browsers
- **300ms debounce on bookmark search** — avoids a backend call on every keystroke
- **Collapse toggle on comments** — HN threads can have 200+ comments; collapsing threads makes the page usable
- **Rotating loading messages in SummaryPanel** — Ollama is slow on CPU; messaging reduces perceived wait time significantly
- **`variant` prop on StoryCard** — one component serves both feed and bookmarks, keeping rendering logic DRY
