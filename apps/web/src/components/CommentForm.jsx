import { useState } from 'react';
import { Send, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../services/authService';

const API_URL = import.meta.env.PROD
  ? 'https://presocial.presuite.eu/api/social'
  : '/api/social';

function CommentForm({ postId, parentId = null, onCommentPosted, onCancel, placeholder = "Write a comment..." }) {
  const { isAuthenticated, user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    const token = getToken();
    if (!token) {
      setError('Please sign in to comment');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          postId,
          content: content.trim(),
          parentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to post comment');
      }

      // Clear form and notify parent
      setContent('');
      if (onCommentPosted) {
        onCommentPosted(data.comment);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <div className="bg-dark-700/50 rounded-lg p-4 text-center">
        <p className="text-gray-400 text-sm mb-3">Sign in to join the discussion</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-social to-presearch text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          disabled={submitting}
          rows={parentId ? 2 : 3}
          className="w-full px-4 py-3 bg-dark-700/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-presearch/50 focus:ring-1 focus:ring-presearch/50 resize-none disabled:opacity-50"
        />
        {user && (
          <div className="absolute bottom-3 left-4 text-xs text-gray-500">
            Posting as <span className="text-presearch">{user.name || user.email}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Comments are posted to Lemmy via PreSocial
        </p>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-social to-presearch text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post Comment
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CommentForm;
