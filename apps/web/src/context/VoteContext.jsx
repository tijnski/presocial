import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getToken } from '../services/authService';

const API_URL = import.meta.env.PROD
  ? 'https://presocial.presuite.eu/api/social'
  : '/api/social';

const VoteContext = createContext(null);

export function VoteProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [votes, setVotes] = useState({});
  const [scoreAdjustments, setScoreAdjustments] = useState({});
  const [loading, setLoading] = useState(false);

  // Load user's votes when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserVotes();
    } else {
      setVotes({});
      setScoreAdjustments({});
    }
  }, [isAuthenticated, user]);

  const loadUserVotes = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/votes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVotes(data.votes || {});
      }
    } catch (error) {
      console.error('Failed to load votes:', error);
    }
  };

  const vote = useCallback(async (postId, voteType) => {
    if (!isAuthenticated) {
      return { success: false, error: 'Please sign in to vote' };
    }

    const token = getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const currentVote = votes[postId];

    // If clicking the same vote, remove it
    const newVote = currentVote === voteType ? 'none' : voteType;

    // Optimistic update
    const previousVotes = { ...votes };
    const previousAdjustments = { ...scoreAdjustments };

    if (newVote === 'none') {
      const newVotesState = { ...votes };
      delete newVotesState[postId];
      setVotes(newVotesState);
    } else {
      setVotes(prev => ({ ...prev, [postId]: newVote }));
    }

    // Calculate score adjustment for UI
    let adjustment = 0;
    if (newVote === 'none') {
      if (currentVote === 'up') adjustment = -1;
      else if (currentVote === 'down') adjustment = 1;
    } else if (newVote === 'up') {
      if (currentVote === 'down') adjustment = 2;
      else if (!currentVote) adjustment = 1;
    } else if (newVote === 'down') {
      if (currentVote === 'up') adjustment = -2;
      else if (!currentVote) adjustment = -1;
    }

    setScoreAdjustments(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + adjustment
    }));

    try {
      const response = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postId, vote: newVote })
      });

      if (!response.ok) {
        // Revert on error
        setVotes(previousVotes);
        setScoreAdjustments(previousAdjustments);
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to vote' };
      }

      return { success: true };
    } catch (error) {
      // Revert on error
      setVotes(previousVotes);
      setScoreAdjustments(previousAdjustments);
      return { success: false, error: 'Network error' };
    }
  }, [isAuthenticated, votes, scoreAdjustments]);

  const getVote = useCallback((postId) => {
    return votes[postId] || null;
  }, [votes]);

  const getAdjustedScore = useCallback((postId, originalScore) => {
    return originalScore + (scoreAdjustments[postId] || 0);
  }, [scoreAdjustments]);

  const value = {
    votes,
    vote,
    getVote,
    getAdjustedScore,
    loading
  };

  return (
    <VoteContext.Provider value={value}>
      {children}
    </VoteContext.Provider>
  );
}

export function useVote() {
  const context = useContext(VoteContext);
  if (!context) {
    throw new Error('useVote must be used within a VoteProvider');
  }
  return context;
}

export default VoteContext;
