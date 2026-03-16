export async function fetchSummary(storyId) {
  const res = await fetch(`/api/summaries/${storyId}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch summary (${res.status})`)
  return res.json()
}

export async function generateSummary(storyId) {
  const res = await fetch(`/api/summaries/${storyId}`, { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to generate summary (${res.status})`)
  return res.json()
}
