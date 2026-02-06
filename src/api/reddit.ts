import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    permalink: string;
    created_utc: number;
    score: number;
    num_comments: number;
    url: string;
    thumbnail?: string;
    subreddit: string;
  };
}

interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class RedditAPI extends BasePlatformAPI {
  readonly platform: Platform = 'reddit';
  readonly rateLimitPerHour = 60;
  
  private clientId: string;
  private clientSecret: string;
  private username: string;
  private password: string;
  private subreddits: string[];
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    subreddits?: string[];
  }) {
    super();
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.username = config.username;
    this.password = config.password;
    this.subreddits = config.subreddits || ['programming', 'webdev', 'javascript'];
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    const items: AggregatedItem[] = [];
    
    try {
      // Ensure we have a valid token
      await this.ensureAuthenticated();

      // Fetch posts from each subreddit
      for (const subreddit of this.subreddits.slice(0, 3)) {
        const posts = await this.fetchSubredditPosts(subreddit);
        items.push(...posts.map(post => this.normalizePost(post)));
      }

      return {
        items: items.slice(0, options.limit || 20),
        hasMore: false
      };
    } catch (error) {
      throw this.handleError(error, 'fetchItems');
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return;
    }

    await this.rateLimit();

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SocialMediaAggregator/1.0'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: this.username,
        password: this.password
      })
    });

    if (!response.ok) {
      throw new Error(`Reddit auth error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as RedditTokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min before expiry
  }

  private async fetchSubredditPosts(subreddit: string): Promise<RedditPost[]> {
    await this.rateLimit();

    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/hot?limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': 'SocialMediaAggregator/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { data?: { children?: RedditPost[] } };
    return data.data?.children || [];
  }

  private normalizePost(post: RedditPost): AggregatedItem {
    const data = post.data;
    
    return {
      id: `reddit-${data.id}`,
      platform: 'reddit',
      type: 'post',
      title: data.title,
      content: data.selftext || '',
      author: {
        name: data.author,
        url: `https://reddit.com/user/${data.author}`
      },
      timestamp: new Date(data.created_utc * 1000).toISOString(),
      url: `https://reddit.com${data.permalink}`,
      metrics: {
        upvotes: data.score,
        comments: data.num_comments
      },
      tags: [data.subreddit],
      raw: data
    };
  }
}
