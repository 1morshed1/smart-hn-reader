export async function fetchBookmarks(search = '') {
  const url = search
    ? `/api/bookmarks?search=${encodeURIComponent(search)}`
    : '/api/bookmarks'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch bookmarks (${res.status})`)
  return res.json()
}

export async function createBookmark(data) {
  const res = await fetch('/api/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to save bookmark (${res.status})`)
  return res.json()
}

export async function deleteBookmark(storyId) {
  const res = await fetch(`/api/bookmarks/${storyId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to remove bookmark (${res.status})`)
}
