import { useParams, Link } from 'react-router-dom'
import { useStory } from '../hooks/useStory'
import { getDomain } from '../utils/time'
import BookmarkButton from '../components/BookmarkButton'
import SummaryPanel from '../components/SummaryPanel'
import CommentThread from '../components/CommentThread'

export default function StoryPage() {
  const { id } = useParams()
  const { data: story, isLoading, isError, error } = useStory(Number(id))

  if (isLoading) {
    return (
      <div className="full-page-loader">
        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <main className="page-container">
        <div className="error-box">
          {error?.message || 'Failed to load story.'}
        </div>
      </main>
    )
  }

  if (!story) return null

  const domain = getDomain(story.url)
  const comments = story.comments ?? []

  return (
    <main className="page-container page-enter">
      <Link to="/" className="story-back">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Feed
      </Link>

      <header className="story-header">
        {domain && (
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="story-header-domain"
          >
            {domain}
          </a>
        )}

        <h1 className="story-header-title">
          {story.url ? (
            <a href={story.url} target="_blank" rel="noopener noreferrer">
              {story.title}
            </a>
          ) : (
            story.title
          )}
        </h1>

        <div className="story-header-meta">
          <div className="story-header-meta-left">
            <span className="meta-score">
              <span className="meta-score-icon" aria-hidden="true" />
              {story.score || 0}
            </span>
            <span className="meta-item">
              by <span>{story.by}</span>
            </span>
            <span className="meta-item">
              <span>{story.descendants ?? 0}</span>&nbsp;comments
            </span>
          </div>
          <BookmarkButton story={story} />
        </div>
      </header>

      {story.text && (
        <div
          className="story-text"
          dangerouslySetInnerHTML={{ __html: story.text }}
        />
      )}

      {comments.length > 0 && (
        <SummaryPanel storyId={story.id} commentCount={story.descendants} />
      )}

      <section className="comments-section">
        <div className="comments-header">
          Discussion
          <span className="comments-header-count">{comments.length}</span>
        </div>
        {comments.length > 0 ? (
          <CommentThread comments={comments} depth={0} />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">◌</div>
            <p className="empty-state-text">No comments yet.</p>
          </div>
        )}
      </section>
    </main>
  )
}
