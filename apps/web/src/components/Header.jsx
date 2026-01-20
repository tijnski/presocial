import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  MessageCircle,
  TrendingUp,
  Users,
  Home,
  LogIn,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Moon,
  Sun,
  ExternalLink,
  Share2,
  Twitter,
  Send,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Settings panel colors (matching PreSuite)
const colors = {
  bg: { panel: "#212224", elevated: "#2E2E2E" },
  text: { primary: "#FFFFFF", secondary: "#E5E7EB", muted: "#9CA3AF", link: "#C9C9C9" },
  border: { default: "#E5E7EB", subtle: "rgba(255, 255, 255, 0.12)" },
  toggle: { active: "#2D8EFF", inactive: "#6B7280" },
  primary: "#8B5CF6",
};

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative w-12 h-6 rounded-full transition-colors duration-150 cursor-pointer flex-shrink-0"
      style={{ backgroundColor: enabled ? colors.toggle.active : colors.toggle.inactive }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-150"
        style={{ left: enabled ? "28px" : "4px", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)" }}
      />
    </button>
  );
}

function SettingItem({ title, description, children }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{title}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function ExternalLinkItem({ title, description, href }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-4 hover:opacity-70 transition-opacity">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{title}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>{description}</p>}
      </div>
      <ExternalLink className="w-5 h-5 flex-shrink-0" style={{ color: colors.text.secondary }} />
    </a>
  );
}

function SectionHeader({ title }) {
  return <h3 className="text-base font-semibold mt-6 mb-4 first:mt-0" style={{ color: colors.text.primary }}>{title}</h3>;
}

function ThemeToggle({ value, onChange }) {
  return (
    <div className="flex">
      <button
        onClick={() => onChange("light")}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-l-full text-sm transition-all"
        style={{
          border: `1px solid ${colors.border.default}`,
          borderRight: "none",
          backgroundColor: value === "light" ? colors.border.default : "transparent",
          color: value === "light" ? colors.bg.elevated : colors.text.primary,
        }}
      >
        <Sun className="w-3.5 h-3.5" /> Light
      </button>
      <button
        onClick={() => onChange("dark")}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-r-full text-sm transition-all"
        style={{
          border: `1px solid ${colors.border.default}`,
          backgroundColor: value === "dark" ? colors.border.default : "transparent",
          color: value === "dark" ? colors.bg.elevated : colors.text.primary,
        }}
      >
        <Moon className="w-3.5 h-3.5" /> Dark
      </button>
    </div>
  );
}

function SocialIcon({ icon: Icon, href, label }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" title={label} style={{ border: `1px solid ${colors.border.subtle}` }}>
      <Icon className="w-5 h-5" style={{ color: colors.text.secondary }} />
    </a>
  );
}

function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    notifications: { emailAlerts: true, desktopNotifications: false },
    display: { compactMode: false },
    theme: "dark",
  });
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowSettings(false);
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleThemeChange = (theme) => {
    setSettings(s => ({ ...s, theme }));
    // Theme toggle logic can be added here
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-dark-800/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-social to-presearch flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                Pre<span className="text-social">Social</span>
              </span>
            </Link>

            {/* Search bar - centered */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search discussions..."
                  className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </form>

            {/* Right side: Profile */}
            <div className="flex items-center gap-2">
              {/* Desktop nav links */}
              <nav className="hidden md:flex items-center gap-1 mr-2">
                <NavLink to="/" icon={<Home className="w-5 h-5" />} label="Feed" />
                <NavLink to="/trending" icon={<TrendingUp className="w-5 h-5" />} label="Trending" />
                <NavLink to="/communities" icon={<Users className="w-5 h-5" />} label="Communities" />
              </nav>

              {/* Profile button */}
              {loading ? (
                <div className="w-9 h-9 rounded-full bg-dark-700 animate-pulse" />
              ) : isAuthenticated && user ? (
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-social to-presearch flex items-center justify-center text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {getInitials(user.name)}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-social to-presearch text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search discussions..."
                  className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-dark-800 border-t border-white/10 animate-slide-up">
            <nav className="px-4 py-3 space-y-1">
              <MobileNavLink to="/" icon={<Home className="w-5 h-5" />} label="Feed" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/trending" icon={<TrendingUp className="w-5 h-5" />} label="Trending" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink to="/communities" icon={<Users className="w-5 h-5" />} label="Communities" onClick={() => setMobileMenuOpen(false)} />

              {/* Mobile user section */}
              <div className="pt-3 mt-3 border-t border-white/10">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-social to-presearch flex items-center justify-center text-white font-semibold">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Lock className="w-5 h-5" />
                      <span className="font-medium">Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-white bg-gradient-to-r from-social to-presearch"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">Sign In</span>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Settings Slide-out Panel */}
      {showSettings && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => setShowSettings(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-[70] w-[400px] max-w-full overflow-hidden flex flex-col" style={{ backgroundColor: colors.bg.panel }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSettings(false)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <ChevronLeft className="w-5 h-5" style={{ color: colors.text.secondary }} />
                </button>
                <h2 className="text-base font-semibold" style={{ color: colors.text.primary }}>Settings</h2>
              </div>
              <button
                className="px-3 py-1.5 rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
                style={{ border: `1px solid ${colors.border.default}`, color: colors.text.secondary }}
                onClick={() => { navigator.clipboard.writeText("https://presocial.presuite.eu"); alert("Link copied!"); }}
              >
                <Share2 className="w-4 h-4 inline mr-1.5" /> Share
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {/* Account Section */}
              <SectionHeader title="Account" />
              <div className="rounded-xl p-4" style={{ backgroundColor: colors.bg.elevated }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-social to-presearch flex items-center justify-center text-white font-semibold text-lg">
                    {getInitials(user?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: colors.text.primary }}>{user?.name || "User"}</p>
                    <p className="text-sm truncate" style={{ color: colors.text.muted }}>{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>

              {/* Notifications Section */}
              <SectionHeader title="Notifications" />
              <div style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <SettingItem title="Email alerts" description="Receive updates via email">
                  <Toggle enabled={settings.notifications.emailAlerts} onChange={(v) => setSettings(s => ({ ...s, notifications: { ...s.notifications, emailAlerts: v } }))} />
                </SettingItem>
              </div>
              <div style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <SettingItem title="Desktop notifications" description="Show browser notifications">
                  <Toggle enabled={settings.notifications.desktopNotifications} onChange={(v) => setSettings(s => ({ ...s, notifications: { ...s.notifications, desktopNotifications: v } }))} />
                </SettingItem>
              </div>

              {/* Display Section */}
              <SectionHeader title="Display" />
              <div style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <SettingItem title="Compact mode" description="Show more posts in the feed">
                  <Toggle enabled={settings.display.compactMode} onChange={(v) => setSettings(s => ({ ...s, display: { ...s.display, compactMode: v } }))} />
                </SettingItem>
              </div>

              {/* Appearance Section */}
              <SectionHeader title="Appearance" />
              <div style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <SettingItem title="Theme">
                  <ThemeToggle value={settings.theme} onChange={handleThemeChange} />
                </SettingItem>
              </div>

              {/* Resources Section */}
              <SectionHeader title="Resources" />
              <div style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <ExternalLinkItem title="Help Center" description="Guides and tutorials" href="https://presearch.com/support" />
              </div>
              <div style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <ExternalLinkItem title="Community Guidelines" description="Rules and best practices" href="https://presocial.presuite.eu/guidelines" />
              </div>
              <div style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <ExternalLinkItem title="Privacy Policy" href="https://presearch.com/privacy" />
              </div>
              <div style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
                <ExternalLinkItem title="Terms of Service" href="https://presearch.com/terms" />
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${colors.border.subtle}` }}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <SocialIcon icon={Twitter} href="https://twitter.com/presearch" label="Twitter" />
                  <SocialIcon icon={MessageCircle} href="https://discord.gg/presearch" label="Discord" />
                  <SocialIcon icon={Send} href="https://t.me/presearch" label="Telegram" />
                </div>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <a href="https://presearch.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity" style={{ color: colors.text.link }}>Privacy</a>
                  <a href="https://presearch.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity" style={{ color: colors.text.link }}>Terms</a>
                  <a href="https://presearch.com/about" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70 transition-opacity" style={{ color: colors.text.link }}>About</a>
                </div>
                <p className="text-center mt-4 text-xs" style={{ color: colors.text.muted }}>PreSocial v1.0.0</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NavLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MobileNavLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default Header;
