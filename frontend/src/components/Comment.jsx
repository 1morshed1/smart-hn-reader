import { useState } from 'react'
import { timeAgo } from '../utils/time'
import CommentThread from './CommentThread'

export default function Comment({ comment, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false)

  if (!comment || comment.deleted || comment.dead) return null

  const hasChildren = comment.comments && comment.comments.length > 0

  return (
    <div className="comment">
      <div className="comment-header">
        <button
          className="comment-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand comment' : 'Collapse comment'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '+' : '−'}
        </button>
        <span className="comment-author">{comment.by || '[deleted]'}</span>
        {comment.time && (
          <span className="comment-time">{timeAgo(comment.time)} ago</span>
        )}
      </div>

      {!collapsed && (
        <div className="comment-body">
          {comment.text && (
            <div
              className="comment-text"
              dangerouslySetInnerHTML={{ __html: comment.text }}
            />
          )}
          {hasChildren && (
            <div className="comment-children">
              <CommentThread comments={comment.comments} depth={depth + 1} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
