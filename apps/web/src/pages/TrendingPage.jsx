import { useState, useEffect } from 'react';
import { preSocialService } from '../services/preSocialService';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import { TrendingUp } from 'lucide-react';

function TrendingPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await preSocialService.getTrending(25);
      setPosts(data.trending || []);
    } catch (err) {
      setError('Failed to load trending posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Trending</h1>
            <p className="text-sm text-gray-400">Hot discussions across all communities</p>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-card p-4 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button onClick={loadTrending} className="btn-primary px-4 py-2 text-sm">
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
          {posts.map((post, index) => (
            <div key={post.id} className="relative">
              {/* Rank badge */}
              <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs font-bold text-white z-10 shadow-lg">
                {index + 1}
              </div>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrendingPage;
