import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { preSocialService } from '../services/preSocialService';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import { Search, Filter } from 'lucide-react';

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    setError(null);

    try {
      const data = await preSocialService.search(searchQuery, { limit: 25 });
      setPosts(data.posts || []);
      setCommunities(data.communities || []);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!query) {
    return (
      <div className="glass-card p-8 text-center">
        <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Search Discussions</h2>
        <p className="text-gray-400">Enter a search term to find community discussions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search header */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-presearch" />
          <div>
            <p className="text-sm text-gray-400">Search results for</p>
            <h1 className="text-lg font-bold text-white">"{query}"</h1>
          </div>
        </div>
      </div>

      {/* Related communities */}
      {!loading && communities.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Related Communities</h3>
          <div className="flex flex-wrap gap-2">
            {communities.slice(0, 5).map((community) => (
              <a
                key={community.id}
                href={community.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                {community.icon ? (
                  <img src={community.icon} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-social/30 flex items-center justify-center">
                    <span className="text-xs font-bold">{community.name[0]}</span>
                  </div>
                )}
                <span className="text-sm text-gray-300">c/{community.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="glass-card p-4 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button onClick={() => performSearch(query)} className="btn-primary px-4 py-2 text-sm">
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

      {/* Results */}
      {!loading && !error && (
        <>
          {posts.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 px-1">
                Found {posts.length} discussion{posts.length !== 1 ? 's' : ''}
              </p>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-gray-400">No discussions found for "{query}"</p>
              <p className="text-sm text-gray-500 mt-2">Try different keywords or browse communities</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchPage;
