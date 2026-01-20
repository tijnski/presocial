import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, ThumbsUp, Bookmark, Edit2, Save, X, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { preSocialService } from '../services/preSocialService';

function ProfilePage() {
  const { userId } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

  // Determine if viewing own profile
  const isOwnProfile = isAuthenticated && user?.id === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await preSocialService.getUserProfile(userId);
        setProfile(data);
        setEditBio(data.bio || '');
      } catch (err) {
        console.error('[Profile] Failed to fetch profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      const updated = await preSocialService.updateProfile({ bio: editBio });
      setProfile(prev => ({
        ...prev,
        bio: updated.profile.bio,
        updatedAt: updated.profile.updatedAt,
      }));
      setIsEditing(false);
    } catch (err) {
      console.error('[Profile] Failed to update bio:', err);
      alert('Failed to save bio. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditBio(profile?.bio || '');
    setIsEditing(false);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get display name - use auth user's name if own profile, otherwise show "User"
  const displayName = isOwnProfile ? user?.name : 'User';
  const displayEmail = isOwnProfile ? user?.email : null;

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 animate-pulse">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-dark-700" />
            <div className="flex-1">
              <div className="h-8 w-48 bg-dark-700 rounded mb-2" />
              <div className="h-4 w-32 bg-dark-700 rounded" />
            </div>
          </div>
          <div className="h-20 bg-dark-700 rounded mb-6" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-dark-700 rounded" />
            <div className="h-16 bg-dark-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Profile not found</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-8">
        {/* Header: Avatar + Name */}
        <div className="flex items-start gap-6 mb-8">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-social to-presearch flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(displayName)
            )}
          </div>

          {/* Name + Email */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{displayName}</h1>
            {displayEmail && (
              <p className="text-gray-400 truncate">{displayEmail}</p>
            )}
            {isOwnProfile && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-social/20 text-social">
                Your Profile
              </span>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Bio</h2>
            {isOwnProfile && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-sm text-social hover:text-social/80 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                maxLength={500}
                rows={4}
                className="glass-input w-full resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{editBio.length}/500</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBio}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-social text-white hover:bg-social/90 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-300 whitespace-pre-wrap">
              {profile?.bio || (
                <span className="text-gray-500 italic">
                  {isOwnProfile ? 'Add a bio to tell others about yourself' : 'No bio yet'}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ThumbsUp className="w-5 h-5 text-social" />
              <span className="text-2xl font-bold text-white">{profile?.stats?.votesCount || 0}</span>
            </div>
            <p className="text-sm text-gray-400">Votes Cast</p>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Bookmark className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-white">{profile?.stats?.bookmarksCount || 0}</span>
            </div>
            <p className="text-sm text-gray-400">Saved Posts</p>
          </div>
        </div>

        {/* Sign in prompt for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 mb-4">Sign in to create your own profile</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-social to-presearch text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
