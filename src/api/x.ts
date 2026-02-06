import { BasePlatformAPI, AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';

interface XTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    bookmark_count: number;
    impression_count: number;
  };
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
    urls?: Array<{ expanded_url: string }>;
  };
}

interface XUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

export class XAPI extends BasePlatformAPI {
  readonly platform: Platform = 'x';
  readonly rateLimitPerHour = 100; // Varies by endpoint and tier
  
  private bearerToken: string;
  private searchQueries: string[];

  constructor(config: { 
    bearerToken: string;
    searchQueries?: string[];
  }) {
    super();
    this.bearerToken = config.bearerToken;
    this.searchQueries = config.searchQueries || ['javascript', 'typescript', 'webdev'];
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    const items: AggregatedItem[] = [];
    
    try {
      // Search for recent tweets
      for (const query of this.searchQueries.slice(0, 2)) {
        const tweets = await this.searchRecentTweets(query);
        
        // Fetch author information for tweets
        const authorIds = [...new Set(tweets.map(t => t.author_id))];
        const users = await this.fetchUsers(authorIds);
        const userMap = new Map(users.map(u => [u.id, u]));
        
        items.push(...tweets.map(tweet => this.normalizeTweet(tweet, userMap)));
      }

      return {
        items: items.slice(0, options.limit || 15),
        hasMore: false
      };
    } catch (error) {
      throw this.handleError(error, 'fetchItems');
    }
  }

  private async searchRecentTweets(query: string): Promise<XTweet[]> {
    await this.rateLimit();

    const params = new URLSearchParams({
      query: query,
      max_results: '10',
      'tweet.fields': 'created_at,public_metrics,entities,author_id',
      sort_order: 'recency'
    });

    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'User-Agent': 'SocialMediaAggregator/1.0'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        console.warn('[X API] Access forbidden. Check your API tier and permissions.');
        return [];
      }
      throw new Error(`X API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { data?: XTweet[] };
    return data.data || [];
  }

  private async fetchUsers(userIds: string[]): Promise<XUser[]> {
    if (userIds.length === 0) return [];
    
    await this.rateLimit();

    const params = new URLSearchParams({
      ids: userIds.join(','),
      'user.fields': 'username,name,profile_image_url'
    });

    const response = await fetch(
      `https://api.twitter.com/2/users?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'User-Agent': 'SocialMediaAggregator/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`X API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { data?: XUser[] };
    return data.data || [];
  }

  private normalizeTweet(tweet: XTweet, userMap: Map<string, XUser>): AggregatedItem {
    const author = userMap.get(tweet.author_id);
    const hashtags = tweet.entities?.hashtags?.map(h => h.tag) || [];
    
    return {
      id: `x-${tweet.id}`,
      platform: 'x',
      type: 'post',
      title: tweet.text.slice(0, 50) + (tweet.text.length > 50 ? '...' : ''),
      content: tweet.text,
      author: {
        name: author?.name || 'Unknown',
        url: author ? `https://twitter.com/${author.username}` : undefined,
        avatar: author?.profile_image_url
      },
      timestamp: tweet.created_at,
      url: `https://twitter.com/i/web/status/${tweet.id}`,
      metrics: {
        shares: tweet.public_metrics?.retweet_count,
        likes: tweet.public_metrics?.like_count,
        replies: tweet.public_metrics?.reply_count,
        views: tweet.public_metrics?.impression_count
      },
      tags: hashtags,
      raw: tweet
    };
  }
}
