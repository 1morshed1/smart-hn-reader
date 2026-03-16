export async function fetchStories({ feed = 'top', page = 1, limit = 30 } = {}) {
  const res = await fetch(`/api/stories?feed=${feed}&page=${page}&limit=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch stories (${res.status})`)
  const items = await res.json()
  return {
    items,
    hasMore: items.length === limit,
    nextPage: page + 1,
  }
}

export async function fetchStory(id) {
  const res = await fetch(`/api/stories/${id}`)
  if (!res.ok) throw new Error(`Story not found (${res.status})`)
  return res.json()
}
