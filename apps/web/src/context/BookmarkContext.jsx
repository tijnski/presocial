import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getToken } from '../services/authService';

const API_URL = import.meta.env.PROD
  ? 'https://presocial.presuite.eu/api/social'
  : '/api/social';

const BookmarkContext = createContext(null);

export function BookmarkProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [bookmarks, setBookmarks] = useState({});
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user's bookmarks when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserBookmarks();
    } else {
      setBookmarks({});
      setSavedPosts([]);
    }
  }, [isAuthenticated, user]);

  const loadUserBookmarks = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookmarks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const bookmarkMap = {};
        (data.bookmarks || []).forEach(post => {
          bookmarkMap[post.id] = true;
        });
        setBookmarks(bookmarkMap);
        setSavedPosts(data.bookmarks || []);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = useCallback(async (post) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please sign in to save posts' };
    }

    const token = getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const postId = post.id;
    const isCurrentlySaved = bookmarks[postId];

    // Optimistic update
    const previousBookmarks = { ...bookmarks };
    const previousSavedPosts = [...savedPosts];

    if (isCurrentlySaved) {
      const newBookmarks = { ...bookmarks };
      delete newBookmarks[postId];
      setBookmarks(newBookmarks);
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      setBookmarks(prev => ({ ...prev, [postId]: true }));
      setSavedPosts(prev => [{
        ...post,
        savedAt: new Date().toISOString()
      }, ...prev]);
    }

    try {
      const response = await fetch(`${API_URL}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId,
          post: isCurrentlySaved ? undefined : {
            id: post.id,
            title: post.title,
            url: post.url,
            score: post.score,
            commentCount: post.commentCount,
            community: post.community,
            author: post.author,
            timestamp: post.timestamp,
            thumbnail: post.thumbnail,
            excerpt: post.excerpt,
          }
        })
      });

      if (!response.ok) {
        // Revert on error
        setBookmarks(previousBookmarks);
        setSavedPosts(previousSavedPosts);
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to save post' };
      }

      return { success: true, saved: !isCurrentlySaved };
    } catch (error) {
      // Revert on error
      setBookmarks(previousBookmarks);
      setSavedPosts(previousSavedPosts);
      return { success: false, error: 'Network error' };
    }
  }, [isAuthenticated, bookmarks, savedPosts]);

  const isBookmarked = useCallback((postId) => {
    return !!bookmarks[postId];
  }, [bookmarks]);

  const value = {
    bookmarks,
    savedPosts,
    toggleBookmark,
    isBookmarked,
    loading,
    refreshBookmarks: loadUserBookmarks
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmark() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmark must be used within a BookmarkProvider');
  }
  return context;
}

export default BookmarkContext;
