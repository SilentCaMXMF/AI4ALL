// Unified data format for all platforms
export interface AggregatedItem {
  id: string;
  platform: Platform;
  type: ContentType;
  title: string;
  content: string;
  author: {
    name: string;
    url?: string;
    avatar?: string;
  };
  timestamp: string;
  url: string;
  metrics: PlatformMetrics;
  tags: string[];
  raw: unknown; // Original platform-specific data
}

export type Platform = 'github' | 'reddit' | 'stackoverflow' | 'discord' | 'x' | 'modelsdev';

export type ContentType = 
  | 'repository' 
  | 'issue' 
  | 'pull_request' 
  | 'commit'
  | 'post' 
  | 'comment'
  | 'question'
  | 'answer'
  | 'model'
  | 'price_alert'
  | 'discussion';

export interface PlatformMetrics {
  stars?: number;
  forks?: number;
  watchers?: number;
  comments?: number;
  upvotes?: number;
  downvotes?: number;
  views?: number;
  shares?: number;
  likes?: number;
  replies?: number;
}

export interface FetchOptions {
  since?: Date;
  limit?: number;
  cursor?: string;
}

export interface FetchResult {
  items: AggregatedItem[];
  nextCursor?: string;
  hasMore: boolean;
}

export abstract class BasePlatformAPI {
  abstract readonly platform: Platform;
  abstract readonly rateLimitPerHour: number;
  
  protected lastRequestTime: number = 0;
  protected requestCount: number = 0;
  protected readonly minRequestInterval: number = 1000; // 1 second between requests

  abstract fetchItems(options?: FetchOptions): Promise<FetchResult>;
  
  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await sleep(this.minRequestInterval - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  protected handleError(error: unknown, context: string): Error {
    console.error(`[${this.platform}] Error in ${context}:`, error);
    return new Error(`[${this.platform}] ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Platform-specific configuration
export interface PlatformConfig {
  github?: {
    token: string;
    username?: string;
    orgs?: string[];
  };
  reddit?: {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    subreddits?: string[];
  };
  stackoverflow?: {
    key?: string;
    tags?: string[];
  };
  discord?: {
    token: string;
    channels?: string[];
  };
  x?: {
    bearerToken: string;
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessTokenSecret?: string;
    searchQueries?: string[];
  };
}
