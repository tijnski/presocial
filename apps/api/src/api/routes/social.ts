// PreSocial API Routes
// Community search and interaction endpoints

import { Hono } from 'hono';
import { z } from 'zod';
import { lemmyService } from '../../services/lemmy';
import {
  cacheGet,
  cacheSet,
  generateSearchKey,
  CACHE_TTL,
} from '../../services/cache';
import type { SearchResponse, PostResponse, TrendingResponse } from '../../types';

const social = new Hono();

// Validation schemas
const searchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  page: z.coerce.number().min(1).max(100).optional().default(1),
  sort: z.enum(['TopAll', 'TopYear', 'TopMonth', 'TopWeek', 'TopDay', 'Hot', 'New']).optional().default('TopAll'),
  community: z.string().optional(),
});

const postIdSchema = z.object({
  id: z.coerce.number().positive(),
});

const voteSchema = z.object({
  postId: z.number().positive(),
  vote: z.enum(['up', 'down', 'none']),
});

// In-memory vote storage (per user session)
// In production, this would be stored in a database
const userVotes = new Map<string, Map<number, 'up' | 'down'>>();

function getUserVotes(userId: string): Map<number, 'up' | 'down'> {
  if (!userVotes.has(userId)) {
    userVotes.set(userId, new Map());
  }
  return userVotes.get(userId)!;
}

// In-memory bookmark storage (per user)
// Stores full post data for saved posts
interface SavedPost {
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

const userBookmarks = new Map<string, Map<number, SavedPost>>();

function getUserBookmarks(userId: string): Map<number, SavedPost> {
  if (!userBookmarks.has(userId)) {
    userBookmarks.set(userId, new Map());
  }
  return userBookmarks.get(userId)!;
}

const bookmarkSchema = z.object({
  postId: z.number().positive(),
  post: z.object({
    id: z.number(),
    title: z.string(),
    url: z.string(),
    score: z.number(),
    commentCount: z.number(),
    community: z.string(),
    author: z.string(),
    timestamp: z.string(),
    thumbnail: z.string().optional(),
    excerpt: z.string().optional(),
  }).optional(),
});

/**
 * GET /api/social/search
 * Search for community discussions relevant to the query
 */
social.get('/search', async (c) => {
  const startTime = Date.now();

  try {
    // Parse and validate query params
    const query = c.req.query();
    const params = searchQuerySchema.safeParse(query);

    if (!params.success) {
      return c.json({
        error: 'Invalid query parameters',
        details: params.error.issues,
      }, 400);
    }

    const { q, limit, page, sort, community } = params.data;

    // Check cache first
    const cacheKey = generateSearchKey(q, { limit, page, sort, community });
    const cached = await cacheGet<SearchResponse>(cacheKey);

    if (cached) {
      return c.json({
        ...cached,
        meta: {
          ...cached.meta,
          cached: true,
          cacheAge: Math.floor((Date.now() - (cached.meta.processingTime || 0)) / 1000),
        },
      });
    }

    // Fetch from Lemmy
    const [posts, communities] = await Promise.all([
      lemmyService.searchPosts(q, {
        limit,
        page,
        sort,
        communityName: community,
      }),
      community ? [] : lemmyService.listCommunities(q, 5),
    ]);

    // Filter NSFW content by default
    const safePosts = posts.filter((post) => !post.nsfw);
    const safeCommunities = communities.filter((comm) => !comm.nsfw);

    const response: SearchResponse = {
      query: q,
      posts: safePosts,
      communities: safeCommunities,
      meta: {
        totalResults: safePosts.length,
        cached: false,
        processingTime: Date.now() - startTime,
      },
    };

    // Cache the response
    await cacheSet(cacheKey, response, CACHE_TTL.SEARCH);

    return c.json(response);
  } catch (error) {
    console.error('[Social API] Search error:', error);
    return c.json({
      error: 'Failed to search community discussions',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/social/post/:id
 * Get a single post with its comments
 */
social.get('/post/:id', async (c) => {
  try {
    const params = postIdSchema.safeParse({ id: c.req.param('id') });

    if (!params.success) {
      return c.json({ error: 'Invalid post ID' }, 400);
    }

    const { id } = params.data;

    // Check cache
    const cacheKey = `post:${id}`;
    const cached = await cacheGet<PostResponse>(cacheKey);

    if (cached) {
      return c.json(cached);
    }

    // Fetch post and comments
    const [post, comments] = await Promise.all([
      lemmyService.getPost(id),
      lemmyService.getComments(id, 30),
    ]);

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    // Get community info
    const communities = await lemmyService.listCommunities(post.community, 1);
    const community = communities[0] || {
      id: post.communityId,
      name: post.community,
      title: post.community,
      subscribers: 0,
      posts: 0,
      url: '',
      nsfw: false,
    };

    const response: PostResponse = {
      post,
      comments,
      community,
    };

    // Cache the response
    await cacheSet(cacheKey, response, CACHE_TTL.POST);

    return c.json(response);
  } catch (error) {
    console.error('[Social API] Get post error:', error);
    return c.json({ error: 'Failed to get post' }, 500);
  }
});

/**
 * GET /api/social/communities
 * List relevant communities
 */
social.get('/communities', async (c) => {
  try {
    const query = c.req.query('q');
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);

    // Check cache for full community list
    const cacheKey = query ? `communities:${query}` : 'communities:all';
    const cached = await cacheGet<{ communities: any[] }>(cacheKey);

    if (cached) {
      return c.json(cached);
    }

    const communities = await lemmyService.listCommunities(query, limit);
    const safeCommunities = communities.filter((c) => !c.nsfw);

    const response = { communities: safeCommunities };

    // Cache longer for community lists
    await cacheSet(cacheKey, response, CACHE_TTL.COMMUNITIES);

    return c.json(response);
  } catch (error) {
    console.error('[Social API] List communities error:', error);
    return c.json({ error: 'Failed to list communities' }, 500);
  }
});

/**
 * GET /api/social/trending
 * Get trending discussions
 */
social.get('/trending', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 20);

    // Check cache
    const cacheKey = `trending:${limit}`;
    const cached = await cacheGet<TrendingResponse>(cacheKey);

    if (cached) {
      return c.json(cached);
    }

    const trending = await lemmyService.getTrending(limit);
    const safeTrending = trending.filter((post) => !post.nsfw);

    const response: TrendingResponse = {
      trending: safeTrending,
      updatedAt: new Date().toISOString(),
    };

    // Cache trending for 30 minutes
    await cacheSet(cacheKey, response, CACHE_TTL.TRENDING);

    return c.json(response);
  } catch (error) {
    console.error('[Social API] Trending error:', error);
    return c.json({ error: 'Failed to get trending discussions' }, 500);
  }
});

/**
 * POST /api/social/vote
 * Vote on a post (requires authentication)
 */
social.post('/vote', async (c) => {
  try {
    // Get user ID from authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Extract user ID from JWT (simplified - in production verify the token)
    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || payload.user_id;
      if (!userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }
    } catch {
      return c.json({ error: 'Invalid token format' }, 401);
    }

    const body = await c.req.json();
    const params = voteSchema.safeParse(body);

    if (!params.success) {
      return c.json({
        error: 'Invalid vote data',
        details: params.error.issues,
      }, 400);
    }

    const { postId, vote } = params.data;
    const votes = getUserVotes(userId);
    const previousVote = votes.get(postId);

    // Calculate score change
    let scoreChange = 0;
    if (vote === 'none') {
      // Removing vote
      if (previousVote === 'up') scoreChange = -1;
      else if (previousVote === 'down') scoreChange = 1;
      votes.delete(postId);
    } else if (vote === 'up') {
      if (previousVote === 'down') scoreChange = 2;
      else if (!previousVote) scoreChange = 1;
      votes.set(postId, 'up');
    } else if (vote === 'down') {
      if (previousVote === 'up') scoreChange = -2;
      else if (!previousVote) scoreChange = -1;
      votes.set(postId, 'down');
    }

    return c.json({
      success: true,
      postId,
      vote: vote === 'none' ? null : vote,
      previousVote: previousVote || null,
      scoreChange,
    });
  } catch (error) {
    console.error('[Social API] Vote error:', error);
    return c.json({ error: 'Failed to record vote' }, 500);
  }
});

/**
 * GET /api/social/votes
 * Get user's votes (requires authentication)
 */
social.get('/votes', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || payload.user_id;
      if (!userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }
    } catch {
      return c.json({ error: 'Invalid token format' }, 401);
    }

    const votes = getUserVotes(userId);
    const voteMap: Record<number, 'up' | 'down'> = {};
    votes.forEach((vote, postId) => {
      voteMap[postId] = vote;
    });

    return c.json({ votes: voteMap });
  } catch (error) {
    console.error('[Social API] Get votes error:', error);
    return c.json({ error: 'Failed to get votes' }, 500);
  }
});

/**
 * POST /api/social/bookmark
 * Save/unsave a post (requires authentication)
 */
social.post('/bookmark', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || payload.user_id;
      if (!userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }
    } catch {
      return c.json({ error: 'Invalid token format' }, 401);
    }

    const body = await c.req.json();
    const params = bookmarkSchema.safeParse(body);

    if (!params.success) {
      return c.json({
        error: 'Invalid bookmark data',
        details: params.error.issues,
      }, 400);
    }

    const { postId, post } = params.data;
    const bookmarks = getUserBookmarks(userId);
    const isCurrentlySaved = bookmarks.has(postId);

    if (isCurrentlySaved) {
      // Remove bookmark
      bookmarks.delete(postId);
      return c.json({
        success: true,
        postId,
        saved: false,
      });
    } else {
      // Add bookmark - need post data
      if (!post) {
        return c.json({ error: 'Post data required to save' }, 400);
      }

      const savedPost: SavedPost = {
        ...post,
        savedAt: new Date().toISOString(),
      };
      bookmarks.set(postId, savedPost);

      return c.json({
        success: true,
        postId,
        saved: true,
      });
    }
  } catch (error) {
    console.error('[Social API] Bookmark error:', error);
    return c.json({ error: 'Failed to save post' }, 500);
  }
});

/**
 * GET /api/social/bookmarks
 * Get user's saved posts (requires authentication)
 */
social.get('/bookmarks', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || payload.user_id;
      if (!userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }
    } catch {
      return c.json({ error: 'Invalid token format' }, 401);
    }

    const bookmarks = getUserBookmarks(userId);
    const savedPosts: SavedPost[] = [];
    bookmarks.forEach((post) => {
      savedPosts.push(post);
    });

    // Sort by savedAt descending (newest first)
    savedPosts.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    return c.json({
      bookmarks: savedPosts,
      count: savedPosts.length,
    });
  } catch (error) {
    console.error('[Social API] Get bookmarks error:', error);
    return c.json({ error: 'Failed to get saved posts' }, 500);
  }
});

/**
 * GET /api/social/bookmark/:postId
 * Check if a post is bookmarked (requires authentication)
 */
social.get('/bookmark/:postId', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || payload.user_id;
      if (!userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }
    } catch {
      return c.json({ error: 'Invalid token format' }, 401);
    }

    const postId = parseInt(c.req.param('postId'));
    if (isNaN(postId)) {
      return c.json({ error: 'Invalid post ID' }, 400);
    }

    const bookmarks = getUserBookmarks(userId);
    const isSaved = bookmarks.has(postId);

    return c.json({ postId, saved: isSaved });
  } catch (error) {
    console.error('[Social API] Check bookmark error:', error);
    return c.json({ error: 'Failed to check bookmark status' }, 500);
  }
});

// Comment validation schema
const commentSchema = z.object({
  postId: z.number().positive(),
  content: z.string().min(1).max(10000),
  parentId: z.number().positive().optional(),
});

/**
 * POST /api/social/comment
 * Create a comment on a post (requires authentication)
 */
social.post('/comment', async (c) => {
  try {
    // Require authentication
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Extract user info from JWT
    const token = authHeader.split(' ')[1];
    let userId: string;
    let userName: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || payload.user_id;
      userName = payload.name || payload.email?.split('@')[0] || 'PreSocial User';
      if (!userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }
    } catch {
      return c.json({ error: 'Invalid token format' }, 401);
    }

    // Validate request body
    const body = await c.req.json();
    const params = commentSchema.safeParse(body);

    if (!params.success) {
      return c.json({
        error: 'Invalid comment data',
        details: params.error.issues,
      }, 400);
    }

    const { postId, content, parentId } = params.data;

    // Check if Lemmy bot is configured
    if (!lemmyService.getBotUsername()) {
      return c.json({
        error: 'Comment posting is not configured',
        message: 'Lemmy bot account not set up',
      }, 503);
    }

    // Create the comment on Lemmy
    const comment = await lemmyService.createComment(
      postId,
      content,
      parentId,
      userName
    );

    if (!comment) {
      return c.json({
        error: 'Failed to post comment',
        message: 'Could not create comment on Lemmy',
      }, 500);
    }

    return c.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('[Social API] Comment error:', error);
    return c.json({ error: 'Failed to post comment' }, 500);
  }
});

/**
 * GET /api/social/comment/status
 * Check if commenting is enabled (Lemmy bot configured)
 */
social.get('/comment/status', async (c) => {
  const botUsername = lemmyService.getBotUsername();
  const isConfigured = !!botUsername;

  return c.json({
    enabled: isConfigured,
    botAccount: isConfigured ? botUsername : null,
  });
});

/**
 * GET /api/social/health
 * Health check endpoint
 */
social.get('/health', async (c) => {
  try {
    const instanceInfo = await lemmyService.getInstanceInfo();

    return c.json({
      status: 'healthy',
      service: 'presocial',
      timestamp: new Date().toISOString(),
      lemmy: instanceInfo ? {
        connected: true,
        instance: instanceInfo.name,
        version: instanceInfo.version,
      } : {
        connected: false,
      },
    });
  } catch (error) {
    return c.json({
      status: 'degraded',
      service: 'presocial',
      timestamp: new Date().toISOString(),
      lemmy: { connected: false },
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 503);
  }
});

export default social;
