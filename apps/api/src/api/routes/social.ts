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
