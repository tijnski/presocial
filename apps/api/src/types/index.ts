// PreSocial Type Definitions

export interface SocialPost {
  id: number;
  title: string;
  url: string;
  body?: string;
  score: number;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  community: string;
  communityId: number;
  communityIcon?: string;
  author: string;
  timestamp: string;
  thumbnail?: string;
  excerpt?: string;
  nsfw: boolean;
}

export interface SocialComment {
  id: number;
  content: string;
  score: number;
  author: string;
  timestamp: string;
  parentId?: number;
  replies?: SocialComment[];
  depth: number;
}

export interface SocialCommunity {
  id: number;
  name: string;
  title: string;
  description?: string;
  icon?: string;
  banner?: string;
  subscribers: number;
  posts: number;
  url: string;
  nsfw: boolean;
}

export interface SearchResponse {
  query: string;
  posts: SocialPost[];
  communities: SocialCommunity[];
  meta: {
    totalResults: number;
    cached: boolean;
    cacheAge?: number;
    processingTime: number;
  };
}

export interface PostResponse {
  post: SocialPost;
  comments: SocialComment[];
  community: SocialCommunity;
}

export interface TrendingResponse {
  trending: SocialPost[];
  updatedAt: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface LemmyConfig {
  instanceUrl: string;
  botUsername?: string;
  botPassword?: string;
  timeout: number;
  maxRetries: number;
}

export interface SearchOptions {
  limit?: number;
  page?: number;
  sort?: 'TopAll' | 'TopYear' | 'TopMonth' | 'TopWeek' | 'TopDay' | 'Hot' | 'New';
  communityId?: number;
  communityName?: string;
}

export interface ApiError {
  code: number;
  message: string;
  details?: unknown;
}
