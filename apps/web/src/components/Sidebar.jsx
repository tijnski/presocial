import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Users, Bookmark, Settings, ChevronRight } from 'lucide-react';
import { preSocialService } from '../services/preSocialService';

function Sidebar() {
  const location = useLocation();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const data = await preSocialService.getCommunities(8);
      setCommunities(data.communities || []);
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="space-y-4">
      {/* Main navigation */}
      <nav className="glass-card p-2">
        <SidebarLink to="/" icon={<Home className="w-5 h-5" />} label="Home" active={isActive('/')} />
        <SidebarLink to="/trending" icon={<TrendingUp className="w-5 h-5" />} label="Trending" active={isActive('/trending')} />
        <SidebarLink to="/communities" icon={<Users className="w-5 h-5" />} label="Communities" active={isActive('/communities')} />
        <SidebarLink to="/saved" icon={<Bookmark className="w-5 h-5" />} label="Saved" active={isActive('/saved')} />
      </nav>

      {/* Communities */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Communities</h3>
          <Link to="/communities" className="text-xs text-presearch hover:text-presearch-hover transition-colors">
            See all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full skeleton" />
                <div className="flex-1">
                  <div className="h-3 w-24 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {communities.map((community) => (
              <CommunityLink key={community.id} community={community} />
            ))}
          </div>
        )}
      </div>

      {/* Footer links */}
      <div className="px-2 text-xs text-gray-500 space-y-1">
        <p>Powered by <a href="https://join-lemmy.org" target="_blank" rel="noopener noreferrer" className="text-presearch hover:underline">Lemmy</a></p>
        <p>Part of <a href="https://presuite.eu" className="text-presearch hover:underline">PreSuite</a></p>
      </div>
    </div>
  );
}

function SidebarLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        active
          ? 'bg-presearch/20 text-presearch'
          : 'text-gray-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

function CommunityLink({ community }) {
  return (
    <a
      href={community.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
    >
      {community.icon ? (
        <img src={community.icon} alt="" className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-social/50 to-presearch/50 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{community.name[0].toUpperCase()}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
          c/{community.name}
        </p>
        <p className="text-xs text-gray-500">{formatNumber(community.subscribers)} members</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default Sidebar;
