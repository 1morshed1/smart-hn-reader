import { useState } from 'react'
import { useBookmarks } from '../hooks/useBookmarks'
import SearchBar from '../components/SearchBar'
import StoryCard from '../components/StoryCard'

export default function BookmarksPage() {
  const [search, setSearch] = useState('')
  const { data: bookmarks, isLoading, isError, error } = useBookmarks(search)

  return (
    <main className="page-container page-enter">
      <div className="bookmarks-header">
        <p className="bookmarks-title">Saved Stories</p>
        <SearchBar onSearch={setSearch} placeholder="Search bookmarks..." />
      </div>

      {isError && (
        <div className="error-box">
          Failed to load bookmarks: {error?.message}
        </div>
      )}

      {isLoading ? (
        <div className="loading-row">
          <div className="loading-dots">
            <div className="loading-dot" />
            <div className="loading-dot" />
            <div className="loading-dot" />
          </div>
        </div>
      ) : bookmarks && bookmarks.length > 0 ? (
        <div className="story-list">
          {bookmarks.map((bookmark) => (
            <StoryCard
              key={bookmark.story_id}
              story={bookmark}
              variant="bookmark"
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">◌</div>
          <p className="empty-state-text">
            {search ? 'No bookmarks match your search.' : 'No bookmarks yet. Save a story from the feed.'}
          </p>
        </div>
      )}
    </main>
  )
}
