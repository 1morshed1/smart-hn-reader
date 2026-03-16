import { useBookmarks, useAddBookmark, useRemoveBookmark } from '../hooks/useBookmarks'

export default function BookmarkButton({ story }) {
  const { data: bookmarks } = useBookmarks('')
  const addMutation = useAddBookmark()
  const removeMutation = useRemoveBookmark()

  const isBookmarked = Array.isArray(bookmarks)
    ? bookmarks.some((b) => b.story_id === story.id)
    : false

  const isPending = addMutation.isPending || removeMutation.isPending

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (isPending) return

    if (isBookmarked) {
      removeMutation.mutate(story.id)
    } else {
      addMutation.mutate({
        story_id: story.id,
        title: story.title,
        url: story.url || null,
        points: story.score || 0,
        author: story.by,
        comment_count: story.descendants || 0,
      })
    }
  }

  return (
    <button
      className={`bookmark-btn${isBookmarked ? ' bookmarked' : ''}`}
      onClick={handleClick}
      disabled={isPending}
      title={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={isBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
