import { useState, useRef, useEffect } from 'react'
import { useInfiniteStories } from '../hooks/useInfiniteStories'
import FeedTabs from '../components/FeedTabs'
import StoryCard from '../components/StoryCard'

export default function FeedPage() {
  const [feed, setFeed] = useState('top')
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, isLoading, isError, error } =
    useInfiniteStories(feed)

  const sentinelRef = useRef(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const stories = data?.pages.flatMap((page) => page.items) ?? []

  return (
    <main className="page-container page-enter">
      <FeedTabs active={feed} onChange={setFeed} />

      {isError && (
        <div className="error-box">
          Failed to load stories: {error?.message}
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
      ) : (
        <>
          <div className="story-list">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} variant="feed" />
            ))}
          </div>

          <div ref={sentinelRef} className="feed-sentinel" />

          {isFetchingNextPage && (
            <div className="loading-row">
              <div className="loading-dots">
                <div className="loading-dot" />
                <div className="loading-dot" />
                <div className="loading-dot" />
              </div>
            </div>
          )}

          {!hasNextPage && stories.length > 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0 0',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-3)',
                letterSpacing: '0.1em',
              }}
            >
              — end of feed —
            </div>
          )}
        </>
      )}
    </main>
  )
}
