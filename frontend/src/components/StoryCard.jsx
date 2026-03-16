import { Link } from 'react-router-dom'
import { timeAgo, getDomain } from '../utils/time'
import BookmarkButton from './BookmarkButton'
import { useRemoveBookmark } from '../hooks/useBookmarks'

export default function StoryCard({ story, variant = 'feed' }) {
  const removeMutation = useRemoveBookmark()
  const domain = getDomain(story.url)

  // For bookmark variant, story shape comes from BookmarkResponse
  // story_id vs id, points vs score, author vs by, comment_count vs descendants
  const id            = story.id ?? story.story_id
  const title         = story.title
  const url           = story.url
  const score         = story.score ?? story.points ?? 0
  const author        = story.by ?? story.author
  const descendants   = story.descendants ?? story.comment_count ?? 0
  const time          = story.time

  // Build a normalized story object for BookmarkButton
  const normalizedStory = {
    id,
    title,
    url,
    score,
    by: author,
    descendants,
    time,
  }

  return (
    <article className="story-card">
      <div className="story-card-watermark" aria-hidden="true">
        {score}
      </div>

      <div className="story-card-body">
        {domain && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="story-card-domain"
            onClick={(e) => e.stopPropagation()}
          >
            {domain}
          </a>
        )}

        <Link to={`/story/${id}`} className="story-card-title">
          {title}
        </Link>

        <div className="story-card-meta">
          <span className="meta-score">
            <span className="meta-score-icon" aria-hidden="true" />
            {score}
          </span>

          <span className="meta-item">
            by <span>{author}</span>
          </span>

          {time && (
            <span className="meta-item">
              <span>{timeAgo(time)}</span> ago
            </span>
          )}

          <Link to={`/story/${id}`} className="meta-comments">
            <span>{descendants}</span>&nbsp;comments
          </Link>
        </div>
      </div>

      <div className="story-card-actions">
        {variant === 'feed' ? (
          <BookmarkButton story={normalizedStory} />
        ) : (
          <button
            className="remove-bookmark-btn"
            onClick={() => removeMutation.mutate(id)}
            disabled={removeMutation.isPending}
          >
            Remove
          </button>
        )}
      </div>
    </article>
  )
}
