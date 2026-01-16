import { useState, useEffect } from 'react';
import { preSocialService } from '../services/preSocialService';
import { Users, Search, ExternalLink } from 'lucide-react';

function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async (query = '') => {
    setLoading(true);
    setError(null);

    try {
      const data = await preSocialService.getCommunities(50, query);
      setCommunities(data.communities || []);
    } catch (err) {
      setError('Failed to load communities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCommunities(searchQuery);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-social to-presearch flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Communities</h1>
            <p className="text-sm text-gray-400">Discover communities on Lemmy</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-card p-4 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button onClick={() => loadCommunities()} className="btn-primary px-4 py-2 text-sm">
            Try Again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 skeleton rounded" />
                  <div className="h-3 w-16 skeleton rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Communities grid */}
      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {communities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityCard({ community }) {
  return (
    <a
      href={community.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card glass-card-hover p-4 block group"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {community.icon ? (
          <img
            src={community.icon}
            alt=""
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-social/50 to-presearch/50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">
              {community.name[0].toUpperCase()}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white group-hover:text-presearch transition-colors truncate">
              c/{community.name}
            </h3>
            <ExternalLink className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          {community.title && community.title !== community.name && (
            <p className="text-sm text-gray-400 truncate">{community.title}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{formatNumber(community.subscribers)} members</span>
            <span>{formatNumber(community.posts)} posts</span>
          </div>
        </div>
      </div>

      {community.description && (
        <p className="text-sm text-gray-400 mt-3 line-clamp-2">
          {community.description}
        </p>
      )}
    </a>
  );
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toString() || '0';
}

export default CommunitiesPage;
