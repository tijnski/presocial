/**
 * PreSocial API Service
 * Client for the PreSocial backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/social';

class PreSocialService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make API request with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`[PreSocial] API error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Search for posts
   */
  async search(query, options = {}) {
    const params = new URLSearchParams({
      q: query,
      limit: options.limit || 20,
      ...(options.sort && { sort: options.sort }),
      ...(options.community && { community: options.community }),
    });

    return this.request(`/search?${params}`);
  }

  /**
   * Get trending posts
   */
  async getTrending(limit = 10) {
    return this.request(`/trending?limit=${limit}`);
  }

  /**
   * Get communities list
   */
  async getCommunities(limit = 20, query = '') {
    const params = new URLSearchParams({ limit });
    if (query) params.append('q', query);
    return this.request(`/communities?${params}`);
  }

  /**
   * Get single post with comments
   */
  async getPost(postId) {
    return this.request(`/post/${postId}`);
  }

  /**
   * Health check
   */
  async getHealth() {
    return this.request('/health');
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    const token = localStorage.getItem('presuite_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.request(`/user/${userId}`, { headers });
  }

  /**
   * Update own profile
   */
  async updateProfile(data) {
    const token = localStorage.getItem('presuite_token');
    if (!token) {
      throw new Error('Authentication required');
    }
    return this.request('/user/profile', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const preSocialService = new PreSocialService();

// Also export class for custom instances
export { PreSocialService };
