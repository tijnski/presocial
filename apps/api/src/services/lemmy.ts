// PreSocial Lemmy API Client
// Integrates with lemmy.world and other Lemmy instances

import { LemmyHttp } from 'lemmy-js-client';
import type {
  SocialPost,
  SocialComment,
  SocialCommunity,
  SearchOptions,
  LemmyConfig,
} from '../types';

const DEFAULT_CONFIG: LemmyConfig = {
  instanceUrl: 'https://lemmy.world',
  timeout: 10000,
  maxRetries: 2,
};

export class LemmyService {
  private client: LemmyHttp;
  private config: LemmyConfig;
  private authToken?: string;

  constructor(config: Partial<LemmyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = new LemmyHttp(this.config.instanceUrl, {
      fetchFunction: this.createFetchWithTimeout(),
    });
  }

  /**
   * Create fetch function with timeout
   */
  private createFetchWithTimeout(): typeof fetch {
    const timeout = this.config.timeout;
    return async (url: RequestInfo | URL, init?: RequestInit) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };
  }

  /**
   * Authenticate with bot account (optional)
   */
  async authenticate(): Promise<boolean> {
    if (!this.config.botUsername || !this.config.botPassword) {
      return false;
    }

    try {
      const response = await this.client.login({
        username_or_email: this.config.botUsername,
        password: this.config.botPassword,
      });

      if (response.jwt) {
        this.authToken = response.jwt;
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Lemmy] Authentication failed:', error);
      return false;
    }
  }

  /**
   * Search for posts matching query
   */
  async searchPosts(query: string, options: SearchOptions = {}): Promise<SocialPost[]> {
    try {
      const response = await this.client.search({
        q: query,
        type_: 'Posts',
        sort: options.sort || 'TopAll',
        limit: options.limit || 10,
        page: options.page || 1,
        community_id: options.communityId,
        community_name: options.communityName,
      });

      return response.posts.map((postView) => this.transformPost(postView));
    } catch (error) {
      console.error('[Lemmy] Search failed:', error);
      throw new Error('Failed to search community posts');
    }
  }

  /**
   * Get single post with details
   */
  async getPost(postId: number): Promise<SocialPost | null> {
    try {
      const response = await this.client.getPost({
        id: postId,
      });

      return this.transformPost(response.post_view);
    } catch (error) {
      console.error('[Lemmy] Get post failed:', error);
      return null;
    }
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: number, limit = 20): Promise<SocialComment[]> {
    try {
      const response = await this.client.getComments({
        post_id: postId,
        sort: 'Top',
        limit,
        max_depth: 3,
      });

      return response.comments.map((commentView) => this.transformComment(commentView));
    } catch (error) {
      console.error('[Lemmy] Get comments failed:', error);
      return [];
    }
  }

  /**
   * List communities (optionally filtered by query)
   */
  async listCommunities(query?: string, limit = 10): Promise<SocialCommunity[]> {
    try {
      if (query) {
        const response = await this.client.search({
          q: query,
          type_: 'Communities',
          sort: 'TopAll',
          limit,
        });
        return response.communities.map((cv) => this.transformCommunity(cv));
      }

      const response = await this.client.listCommunities({
        type_: 'All',
        sort: 'TopAll',
        limit,
      });

      return response.communities.map((cv) => this.transformCommunity(cv));
    } catch (error) {
      console.error('[Lemmy] List communities failed:', error);
      return [];
    }
  }

  /**
   * Get trending posts
   */
  async getTrending(limit = 10): Promise<SocialPost[]> {
    try {
      const response = await this.client.getPosts({
        sort: 'Hot',
        type_: 'All',
        limit,
      });

      return response.posts.map((postView) => this.transformPost(postView));
    } catch (error) {
      console.error('[Lemmy] Get trending failed:', error);
      return [];
    }
  }

  /**
   * Vote on a post (requires auth)
   */
  async votePost(postId: number, score: 1 | 0 | -1): Promise<boolean> {
    if (!this.authToken) {
      console.warn('[Lemmy] Cannot vote: not authenticated');
      return false;
    }

    try {
      await this.client.likePost({
        post_id: postId,
        score,
      });
      return true;
    } catch (error) {
      console.error('[Lemmy] Vote failed:', error);
      return false;
    }
  }

  /**
   * Create a comment on a post (requires auth)
   * @param postId - The post to comment on
   * @param content - The comment content
   * @param parentId - Optional parent comment ID for replies
   * @param preSuiteUser - PreSuite username for attribution
   */
  async createComment(
    postId: number,
    content: string,
    parentId?: number,
    preSuiteUser?: string
  ): Promise<SocialComment | null> {
    if (!this.authToken) {
      // Try to authenticate first
      const authenticated = await this.authenticate();
      if (!authenticated) {
        console.warn('[Lemmy] Cannot comment: not authenticated');
        return null;
      }
    }

    try {
      // Add attribution to the comment
      const attributedContent = preSuiteUser
        ? `${content}\n\n---\n*Posted via [PreSocial](https://presocial.presuite.eu) by ${preSuiteUser}*`
        : content;

      const response = await this.client.createComment({
        post_id: postId,
        content: attributedContent,
        parent_id: parentId,
      });

      return this.transformComment(response.comment_view);
    } catch (error) {
      console.error('[Lemmy] Create comment failed:', error);
      return null;
    }
  }

  /**
   * Check if the service is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  /**
   * Get the bot username
   */
  getBotUsername(): string | undefined {
    return this.config.botUsername;
  }

  /**
   * Transform Lemmy PostView to SocialPost
   */
  private transformPost(postView: any): SocialPost {
    const { post, counts, community, creator } = postView;

    return {
      id: post.id,
      title: post.name,
      url: post.ap_id || `${this.config.instanceUrl}/post/${post.id}`,
      body: post.body,
      score: counts.score,
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      commentCount: counts.comments,
      community: community.name,
      communityId: community.id,
      communityIcon: community.icon,
      author: creator.name,
      timestamp: post.published,
      thumbnail: post.thumbnail_url,
      excerpt: post.body ? post.body.slice(0, 200) : undefined,
      nsfw: post.nsfw || community.nsfw,
    };
  }

  /**
   * Transform Lemmy CommentView to SocialComment
   */
  private transformComment(commentView: any): SocialComment {
    const { comment, counts, creator } = commentView;

    // Calculate depth from path (path is like "0.1.2.3")
    const pathParts = comment.path.split('.');
    const depth = pathParts.length - 1;

    return {
      id: comment.id,
      content: comment.content,
      score: counts.score,
      author: creator.name,
      timestamp: comment.published,
      parentId: pathParts.length > 1 ? parseInt(pathParts[pathParts.length - 2]) : undefined,
      depth,
    };
  }

  /**
   * Transform Lemmy CommunityView to SocialCommunity
   */
  private transformCommunity(communityView: any): SocialCommunity {
    const { community, counts } = communityView;

    return {
      id: community.id,
      name: community.name,
      title: community.title,
      description: community.description,
      icon: community.icon,
      banner: community.banner,
      subscribers: counts.subscribers,
      posts: counts.posts,
      url: community.actor_id || `${this.config.instanceUrl}/c/${community.name}`,
      nsfw: community.nsfw,
    };
  }

  /**
   * Get instance info
   */
  async getInstanceInfo(): Promise<{ version: string; name: string } | null> {
    try {
      const site = await this.client.getSite();
      return {
        version: site.version,
        name: site.site_view.site.name,
      };
    } catch (error) {
      console.error('[Lemmy] Get instance info failed:', error);
      return null;
    }
  }
}

// Default instance
export const lemmyService = new LemmyService({
  instanceUrl: process.env.LEMMY_INSTANCE_URL || 'https://lemmy.world',
  botUsername: process.env.LEMMY_BOT_USERNAME,
  botPassword: process.env.LEMMY_BOT_PASSWORD,
});
