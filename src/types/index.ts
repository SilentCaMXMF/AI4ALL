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

export type Platform = 'github' | 'reddit' | 'stackoverflow' | 'x' | 'modelsdev' | 'hackernews' | 'huggingface';
export type GenericPlatform = Platform | 'datastore' | 'scraper' | 'history' | 'updater' | 'apikey';

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
  downloads?: number;        // For Hugging Face
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

  abstract fetchItems(): Promise<FetchResult>;
  
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
    // Create basic error without importing to avoid circular dependencies
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const platformError = new Error(`[${this.platform}] ${context}: ${errorMessage}`);
    platformError.name = 'PlatformError';
    console.error(`✗ [${this.platform}] ${context}: ${errorMessage}`);
    return platformError;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Feedback item from any platform about a model
export interface ModelFeedback {
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
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevance: number; // 0-1 score of how relevant to the model
}

// Extended model data with cross-platform feedback
export interface ModelWithFeedback extends AggregatedItem {
  feedback: ModelFeedback[];
  feedbackSummary: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    lastMention: string;
    availabilityStatus: 'confirmed' | 'questioned' | 'unknown';
    commonIssues: string[];
    verificationLevel: string;
    verificationScore: number;
  };
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
  x?: {
    bearerToken: string;
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessTokenSecret?: string;
    searchQueries?: string[];
  };
  huggingface?: {
    token: string;
  };
  hackernews?: {
    enabled?: boolean;
  };
}

// Enhanced verification data with history tracking
export interface VerificationDatabase {
  models: EnhancedModelData[];
  verificationHistory: VerificationHistoryEntry[];
  lastUpdated: string;
  version: string;
}

export interface EnhancedModelData extends ModelWithFeedback {
  // Enhanced metadata
  firstSeen: string;
  lastVerified: string;
  verificationCount: number;
  
  // Platform-specific verification details
  platformBreakdown: Partial<Record<'github' | 'reddit' | 'stackoverflow' | 'x' | 'modelsdev' | 'hackernews' | 'huggingface', PlatformVerificationDetails>>;
  
  // Trend analysis
  verificationTrend: {
    last7Days: number[];
    last30Days: number[];
    overall: 'improving' | 'stable' | 'declining' | 'unknown';
  };
  
  // Availability tracking
  availabilityHistory: AvailabilityEntry[];
  currentAvailability: 'confirmed' | 'questioned' | 'unknown' | 'deprecated';
}

export interface PlatformVerificationDetails {
  mentionCount: number;
  lastMention: string;
  averageSentiment: number; // 0-100
  commonIssues: string[];
  lastChecked: string;
}

export interface VerificationHistoryEntry {
  id: string;
  modelId: string;
  timestamp: string;
  platform: Platform;
  type: 'verification_run' | 'sentiment_change' | 'issue_detected' | 'availability_change';
  data: {
    previousScore?: number;
    newScore?: number;
    issues?: string[];
    availability?: 'confirmed' | 'questioned' | 'unknown' | 'deprecated';
    sentimentChange?: 'positive' | 'negative' | 'neutral';
    mentionCount?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface AvailabilityEntry {
  timestamp: string;
  status: 'confirmed' | 'questioned' | 'unknown' | 'deprecated';
  reportedBy: Platform[];
  issues: string[];
  sourceUrl?: string;
}

// Incremental update tracking
export interface UpdateState {
  lastFullScrape: string;
  lastIncrementalUpdate: string;
  platformStates: Record<Platform, {
    lastCursor?: string;
    lastUpdate: string;
    itemCount: number;
    errorCount: number;
  }>;
  totalModelsProcessed: number;
  updatesToday: number;
}

// API key management
export interface APIKeyConfig {
  keys: Record<Platform, {
    key: string;
    lastUsed: string;
    usageCount: number;
    rateLimitRemaining: number;
    expiresAt?: string;
    isActive: boolean;
  }>;
  rotationSchedule: Record<Platform, {
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
    lastRotation: string;
    nextRotation?: string;
  }>;
}

// Data pipeline configuration
export interface PipelineConfig {
  incrementalUpdates: {
    enabled: boolean;
    intervalMinutes: number;
    batchSize: number;
    maxAgeHours: number;
  };
  fullScraping: {
    enabled: boolean;
    schedule: string; // cron expression
    retentionDays: number;
  };
  verification: {
    minimumMentions: number;
    confidenceThreshold: number;
    platforms: Platform[];
    deepAnalysisEnabled: boolean;
  };
}

// Trend analysis types
export interface TrendAnalysis {
  platform: string;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  scoreChange: number;
  timeframe: string;
  confidence: number;
}

export interface ModelTrendReport {
  modelId: string;
  modelTitle: string;
  overallTrend: TrendAnalysis;
  platformTrends: Record<Platform, TrendAnalysis>;
  summary: {
    totalMentions: number;
    sentimentShift: 'positive' | 'negative' | 'neutral';
    reliabilityScore: number;
    recommendation: string;
  };
  generatedAt: string;
}
