import Comment from './Comment'

export default function CommentThread({ comments = [], depth = 0 }) {
  if (!comments || comments.length === 0) return null

  return (
    <div className={depth === 0 ? 'comment-thread-root' : ''}>
      {comments.map((comment) => (
        <Comment key={comment.id} comment={comment} depth={depth} />
      ))}
    </div>
  )
}
