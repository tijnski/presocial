// PreSocial Persistent Storage Service
// File-based storage for user votes and bookmarks
// Can be migrated to Redis/PostgreSQL in production

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Storage configuration
const STORAGE_DIR = process.env.STORAGE_DIR || join(process.cwd(), 'data');
const VOTES_FILE = join(STORAGE_DIR, 'votes.json');
const BOOKMARKS_FILE = join(STORAGE_DIR, 'bookmarks.json');

// Auto-save interval (5 seconds)
const AUTO_SAVE_INTERVAL = 5000;

// Track if data has been modified since last save
let votesDirty = false;
let bookmarksDirty = false;

// In-memory data structures
let userVotes: Map<string, Map<number, 'up' | 'down'>> = new Map();
let userBookmarks: Map<string, Map<number, SavedPost>> = new Map();

export interface SavedPost {
  id: number;
  title: string;
  url: string;
  score: number;
  commentCount: number;
  community: string;
  author: string;
  timestamp: string;
  thumbnail?: string;
  excerpt?: string;
  savedAt: string;
}

/**
 * Ensure storage directory exists
 */
function ensureStorageDir(): void {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true });
    console.log(`[Storage] Created storage directory: ${STORAGE_DIR}`);
  }
}

/**
 * Load votes from file
 */
function loadVotes(): void {
  try {
    if (existsSync(VOTES_FILE)) {
      const data = JSON.parse(readFileSync(VOTES_FILE, 'utf-8'));
      userVotes = new Map();

      for (const [userId, votes] of Object.entries(data)) {
        const userVoteMap = new Map<number, 'up' | 'down'>();
        for (const [postId, vote] of Object.entries(votes as Record<string, 'up' | 'down'>)) {
          userVoteMap.set(parseInt(postId), vote);
        }
        userVotes.set(userId, userVoteMap);
      }

      console.log(`[Storage] Loaded votes for ${userVotes.size} users`);
    }
  } catch (error) {
    console.error('[Storage] Failed to load votes:', error);
    userVotes = new Map();
  }
}

/**
 * Load bookmarks from file
 */
function loadBookmarks(): void {
  try {
    if (existsSync(BOOKMARKS_FILE)) {
      const data = JSON.parse(readFileSync(BOOKMARKS_FILE, 'utf-8'));
      userBookmarks = new Map();

      for (const [userId, bookmarks] of Object.entries(data)) {
        const userBookmarkMap = new Map<number, SavedPost>();
        for (const [postId, post] of Object.entries(bookmarks as Record<string, SavedPost>)) {
          userBookmarkMap.set(parseInt(postId), post);
        }
        userBookmarks.set(userId, userBookmarkMap);
      }

      console.log(`[Storage] Loaded bookmarks for ${userBookmarks.size} users`);
    }
  } catch (error) {
    console.error('[Storage] Failed to load bookmarks:', error);
    userBookmarks = new Map();
  }
}

/**
 * Save votes to file
 */
function saveVotes(): void {
  if (!votesDirty) return;

  try {
    ensureStorageDir();

    const data: Record<string, Record<number, 'up' | 'down'>> = {};
    userVotes.forEach((votes, userId) => {
      data[userId] = {};
      votes.forEach((vote, postId) => {
        data[userId][postId] = vote;
      });
    });

    writeFileSync(VOTES_FILE, JSON.stringify(data, null, 2));
    votesDirty = false;
    console.debug('[Storage] Saved votes to disk');
  } catch (error) {
    console.error('[Storage] Failed to save votes:', error);
  }
}

/**
 * Save bookmarks to file
 */
function saveBookmarks(): void {
  if (!bookmarksDirty) return;

  try {
    ensureStorageDir();

    const data: Record<string, Record<number, SavedPost>> = {};
    userBookmarks.forEach((bookmarks, userId) => {
      data[userId] = {};
      bookmarks.forEach((post, postId) => {
        data[userId][postId] = post;
      });
    });

    writeFileSync(BOOKMARKS_FILE, JSON.stringify(data, null, 2));
    bookmarksDirty = false;
    console.debug('[Storage] Saved bookmarks to disk');
  } catch (error) {
    console.error('[Storage] Failed to save bookmarks:', error);
  }
}

/**
 * Get user's votes map
 */
export function getUserVotes(userId: string): Map<number, 'up' | 'down'> {
  if (!userVotes.has(userId)) {
    userVotes.set(userId, new Map());
  }
  return userVotes.get(userId)!;
}

/**
 * Set a user's vote on a post
 */
export function setUserVote(userId: string, postId: number, vote: 'up' | 'down' | null): void {
  const votes = getUserVotes(userId);

  if (vote === null) {
    votes.delete(postId);
  } else {
    votes.set(postId, vote);
  }

  votesDirty = true;
}

/**
 * Get a user's vote on a specific post
 */
export function getUserVote(userId: string, postId: number): 'up' | 'down' | null {
  const votes = getUserVotes(userId);
  return votes.get(postId) || null;
}

/**
 * Get user's bookmarks map
 */
export function getUserBookmarks(userId: string): Map<number, SavedPost> {
  if (!userBookmarks.has(userId)) {
    userBookmarks.set(userId, new Map());
  }
  return userBookmarks.get(userId)!;
}

/**
 * Add a bookmark for a user
 */
export function addUserBookmark(userId: string, post: SavedPost): void {
  const bookmarks = getUserBookmarks(userId);
  bookmarks.set(post.id, post);
  bookmarksDirty = true;
}

/**
 * Remove a bookmark for a user
 */
export function removeUserBookmark(userId: string, postId: number): boolean {
  const bookmarks = getUserBookmarks(userId);
  const existed = bookmarks.delete(postId);
  if (existed) {
    bookmarksDirty = true;
  }
  return existed;
}

/**
 * Check if a post is bookmarked by a user
 */
export function isPostBookmarked(userId: string, postId: number): boolean {
  const bookmarks = getUserBookmarks(userId);
  return bookmarks.has(postId);
}

/**
 * Get all bookmarked posts for a user, sorted by savedAt
 */
export function getUserBookmarksList(userId: string): SavedPost[] {
  const bookmarks = getUserBookmarks(userId);
  const posts: SavedPost[] = [];
  bookmarks.forEach((post) => posts.push(post));

  // Sort by savedAt descending (newest first)
  posts.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

  return posts;
}

/**
 * Get storage statistics
 */
export function getStorageStats(): { users: number; totalVotes: number; totalBookmarks: number } {
  let totalVotes = 0;
  let totalBookmarks = 0;

  userVotes.forEach((votes) => {
    totalVotes += votes.size;
  });

  userBookmarks.forEach((bookmarks) => {
    totalBookmarks += bookmarks.size;
  });

  return {
    users: Math.max(userVotes.size, userBookmarks.size),
    totalVotes,
    totalBookmarks,
  };
}

/**
 * Initialize storage - load data from files
 */
export function initStorage(): void {
  console.log('[Storage] Initializing persistent storage...');
  ensureStorageDir();
  loadVotes();
  loadBookmarks();

  // Setup auto-save interval
  setInterval(() => {
    saveVotes();
    saveBookmarks();
  }, AUTO_SAVE_INTERVAL);

  // Save on process exit
  process.on('SIGINT', () => {
    console.log('[Storage] Saving data before exit...');
    saveVotes();
    saveBookmarks();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('[Storage] Saving data before exit...');
    saveVotes();
    saveBookmarks();
    process.exit(0);
  });

  console.log('[Storage] Persistent storage initialized');
}

/**
 * Force save all data to disk
 */
export function flushStorage(): void {
  votesDirty = true;
  bookmarksDirty = true;
  saveVotes();
  saveBookmarks();
}
