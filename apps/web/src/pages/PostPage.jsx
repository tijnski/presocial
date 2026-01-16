import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { preSocialService } from '../services/preSocialService';
import PostCard from '../components/PostCard';
import { ArrowLeft, MessageSquare, ArrowBigUp, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Build a nested comment tree from flat comments
 * Lemmy returns comments with path like "0.123.456.789" where each number is a comment ID
 */
function buildCommentTree(flatComments) {
  if (!flatComments || flatComments.length === 0) return [];

  // Create a map for quick lookup
  const commentMap = new Map();
  flatComments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  const rootComments = [];

  // Build the tree based on parentId
  flatComments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id);

    if (comment.parentId && commentMap.has(comment.parentId)) {
      // Has a parent in our list - add as reply
      const parent = commentMap.get(comment.parentId);
      parent.replies.push(commentWithReplies);
    } else if (comment.depth === 1 || !comment.parentId) {
      // Root level comment
      rootComments.push(commentWithReplies);
    } else {
      // Parent not in our list (could be deeper nesting) - treat as root
      rootComments.push(commentWithReplies);
    }
  });

  // Sort by score (highest first)
  const sortByScore = (a, b) => b.score - a.score;
  rootComments.sort(sortByScore);

  // Recursively sort replies
  const sortReplies = (comments) => {
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort(sortByScore);
        sortReplies(comment.replies);
      }
    });
  };
  sortReplies(rootComments);

  return rootComments;
}

function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Build comment tree from flat comments
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

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
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
          <MessageSquare className="w-5 h-5 text-presearch" />
          <h2 className="font-semibold text-white">
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {commentTree.length > 0 ? (
          <div className="space-y-1">
            {commentTree.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No comments yet</p>
            <p className="text-gray-500 text-xs mt-1">Be the first to discuss this on Lemmy</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Comment({ comment, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const maxDepth = 6;
  const formattedDate = formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true });
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Color coding for depth levels
  const depthColors = [
    'border-presearch/50',
    'border-blue-500/50',
    'border-green-500/50',
    'border-yellow-500/50',
    'border-purple-500/50',
    'border-pink-500/50',
  ];

  return (
    <div className={`${depth > 0 ? 'ml-3 pl-3 border-l-2 ' + depthColors[depth % depthColors.length] : ''}`}>
      <div className="py-2 group">
        {/* Comment header */}
        <div className="flex items-center gap-2 text-xs mb-1.5">
          {/* Author */}
          <span className="font-semibold text-presearch hover:underline cursor-pointer">
            {comment.author}
          </span>

          {/* Score */}
          <span className={`flex items-center gap-0.5 ${
            comment.score > 0 ? 'text-orange-400' :
            comment.score < 0 ? 'text-blue-400' : 'text-gray-500'
          }`}>
            <ArrowBigUp className="w-3 h-3" />
            {comment.score}
          </span>

          {/* Time */}
          <span className="text-gray-500">{formattedDate}</span>

          {/* Collapse button */}
          {hasReplies && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              {collapsed ? (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span className="text-xs">{comment.replies.length} replies</span>
                </>
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Comment content */}
        {!collapsed && (
          <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
            {comment.content}
          </div>
        )}
      </div>

      {/* Nested replies */}
      {!collapsed && hasReplies && depth < maxDepth && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <Comment key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Show continuation message if max depth reached */}
      {!collapsed && hasReplies && depth >= maxDepth && (
        <a
          href={`https://lemmy.world/comment/${comment.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block ml-3 pl-3 py-2 text-xs text-presearch hover:underline border-l-2 border-gray-600"
        >
          Continue this thread on Lemmy →
        </a>
      )}
    </div>
  );
}

export default PostPage;
