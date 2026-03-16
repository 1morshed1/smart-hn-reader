import { useState, useEffect } from 'react'
import { useSummary } from '../hooks/useSummary'

const LOADING_MESSAGES = [
  'Reading comments...',
  'Finding key points...',
  'Writing summary...',
]

const SENTIMENT_CLASSES = {
  positive: 'sentiment-positive',
  negative: 'sentiment-negative',
  mixed:    'sentiment-mixed',
  neutral:  'sentiment-neutral',
}

function SentimentBadge({ sentiment }) {
  const cls = SENTIMENT_CLASSES[sentiment?.toLowerCase()] || 'sentiment-neutral'
  return (
    <span className={`sentiment-badge ${cls}`}>
      <span className="sentiment-badge-dot" />
      {sentiment || 'neutral'}
    </span>
  )
}

function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="summary-loading">
      <div className="summary-loading-bar">
        <div className="summary-loading-bar-fill" />
      </div>
      <span className="summary-loading-msg">{LOADING_MESSAGES[msgIndex]}</span>
    </div>
  )
}

export default function SummaryPanel({ storyId, commentCount }) {
  const { query, mutation } = useSummary(storyId)
  const summary = query.data

  const isLoading = mutation.isPending
  const error = mutation.error

  return (
    <div className="summary-panel">
      <div className="summary-panel-header">
        <div className="summary-panel-label">
          <span className="summary-panel-label-dot" />
          AI Summary
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="summary-error">
          <span className="summary-error-msg">
            {error.message || 'Something went wrong. Please try again.'}
          </span>
          <button className="retry-btn" onClick={() => mutation.mutate()}>
            Try Again
          </button>
        </div>
      ) : summary ? (
        <div className="summary-content">
          <p className="summary-text">{summary.summary}</p>

          {summary.key_points && summary.key_points.length > 0 && (
            <>
              <p className="summary-section-label">Key Points</p>
              <ul className="summary-keypoints">
                {summary.key_points.map((point, i) => (
                  <li key={i} className="summary-keypoint">
                    {point}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="summary-footer">
            <SentimentBadge sentiment={summary.sentiment} />
            <span className="summary-gen-info">
              based on {summary.comment_count_at_generation} comments
            </span>
          </div>
        </div>
      ) : (
        <div className="summary-idle">
          <p className="summary-idle-description">
            Generate an AI-powered summary of the discussion, including key points
            and community sentiment.
          </p>
          <button className="summarise-btn" onClick={() => mutation.mutate()}>
            Summarise Discussion
          </button>
        </div>
      )}
    </div>
  )
}
