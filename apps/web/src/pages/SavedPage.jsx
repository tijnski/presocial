import { Link } from 'react-router-dom';
import { Bookmark, LogIn } from 'lucide-react';
import { useBookmark } from '../context/BookmarkContext';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';

function SavedPage() {
  const { savedPosts, loading } = useBookmark();
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white mb-6">Saved Posts</h1>
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-8 h-8 text-gray-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to view saved posts</h2>
        <p className="text-gray-400 mb-6">
          Save posts to read later by clicking the bookmark icon
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-social to-presearch text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <LogIn className="w-5 h-5" />
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white mb-6">Saved Posts</h1>
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Saved Posts</h1>
        {savedPosts.length > 0 && (
          <span className="text-sm text-gray-400">
            {savedPosts.length} {savedPosts.length === 1 ? 'post' : 'posts'} saved
          </span>
        )}
      </div>

      {savedPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No saved posts yet</h2>
          <p className="text-gray-400 mb-6">
            Click the bookmark icon on any post to save it for later
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
          >
            Browse Posts
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedPage;
