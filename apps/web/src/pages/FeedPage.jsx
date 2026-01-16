import { useState, useEffect } from 'react';
import { preSocialService } from '../services/preSocialService';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import { TrendingUp, Clock, Flame } from 'lucide-react';

function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('Hot');

  useEffect(() => {
    loadPosts();
  }, [sortBy]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      // For now, load trending as the main feed
      const data = await preSocialService.getTrending(20);
      setPosts(data.trending || []);
    } catch (err) {
      setError('Failed to load posts. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sort options */}
      <div className="glass-card p-2 flex items-center gap-1">
        <SortButton
          active={sortBy === 'Hot'}
          onClick={() => setSortBy('Hot')}
          icon={<Flame className="w-4 h-4" />}
          label="Hot"
        />
        <SortButton
          active={sortBy === 'New'}
          onClick={() => setSortBy('New')}
          icon={<Clock className="w-4 h-4" />}
          label="New"
        />
        <SortButton
          active={sortBy === 'Top'}
          onClick={() => setSortBy('Top')}
          icon={<TrendingUp className="w-4 h-4" />}
          label="Top"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-card p-4 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={loadPosts}
            className="btn-primary px-4 py-2 text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Posts */}
      {!loading && !error && (
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-gray-400">No posts found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-presearch/20 text-presearch'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default FeedPage;
