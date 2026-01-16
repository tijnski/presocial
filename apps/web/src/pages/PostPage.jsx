import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { preSocialService } from '../services/preSocialService';
import PostCard from '../components/PostCard';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadPost(id);
    }
  }, [id]);

  const loadPost = async (postId) => {
    setLoading(true);
    setError(null);

    try {
      const data = await preSocialService.getPost(postId);
      setPost(data.post);
      setComments(data.comments || []);
    } catch (err) {
      setError('Failed to load post');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-4 h-48 skeleton" />
        <div className="glass-card p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 skeleton rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-400 mb-3">{error || 'Post not found'}</p>
        <Link to="/" className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Link>

      {/* Post */}
      <PostCard post={post} />

      {/* Comments */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-presearch" />
          <h2 className="font-semibold text-white">
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">No comments yet</p>
        )}
      </div>
    </div>
  );
}

function Comment({ comment, depth = 0 }) {
  const maxDepth = 4;
  const formattedDate = formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true });

  return (
    <div
      className={`${depth > 0 ? 'ml-4 pl-4 border-l border-white/10' : ''}`}
      style={{ marginLeft: depth > 0 ? `${Math.min(depth, maxDepth) * 16}px` : 0 }}
    >
      <div className="py-2">
        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <span className="font-medium text-gray-300">{comment.author}</span>
          <span>•</span>
          <span>{formattedDate}</span>
          <span>•</span>
          <span className={comment.score > 0 ? 'text-orange-400' : 'text-gray-400'}>
            {comment.score} points
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-200 whitespace-pre-wrap">{comment.content}</p>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <Comment key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default PostPage;
