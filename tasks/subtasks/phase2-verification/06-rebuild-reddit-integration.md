# Task 06: Rebuild Reddit API Integration with Subreddits

## Description
**Enhance the existing Reddit integration** (src/api/reddit.ts) and improve the `searchRedditForModel()` method (src/scraper/index.ts:315-330) which currently has basic implementation. Extend it to focus on AI/ML subreddits where developers discuss free AI models, their limitations, and real-world usage experiences.

## Files to Create/Modify

### 1. Reddit API Client (`src/api/platforms/RedditAPI.ts`)
```typescript
interface RedditSearchOptions {
  query: string;
  subreddit?: string | string[];
  sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  limit?: number;
}

interface RedditSubmission {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  created: Date;
  score: number;
  upvoteRatio: number;
  numComments: number;
  url: string;
  selftext: string;
  flair?: string;
}

interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created: Date;
  replies: RedditComment[];
  awards: number;
}

class RedditAPI implements BasePlatformAPI {
  private client: Snoowrap;
  private rateLimiter: RateLimiter;
  private cache: ApiResponseCache;
  
  constructor(credentials: RedditCredentials);
  
  // Search submissions across specific subreddits
  async searchSubmissions(options: RedditSearchOptions): Promise<RedditSubmission[]>;
  
  // Get comments for a submission
  async getComments(submissionId: string): Promise<RedditComment[]>;
  
  // Search comments containing model mentions
  async searchComments(query: string, subreddit?: string): Promise<RedditComment[]>;
  
  // Get hot posts from AI subreddits
  async getHotPosts(subreddit: string, limit?: number): Promise<RedditSubmission[]>;
  
  // Get subreddit information
  async getSubredditInfo(subreddit: string): Promise<SubredditInfo>;
  
  // Monitor new posts in real-time
  async streamNewPosts(subreddit: string): Promise<AsyncIterable<RedditSubmission>>;
}
```

### 2. AI/ML Subreddit Configuration (`src/data/reddit-subreddits.ts`)
```typescript
interface SubredditConfig {
  name: string;
  priority: 'high' | 'medium' | 'low';
  keywords: string[];
  excludeKeywords: string[];
  minScore: number;
  minComments: number;
}

const AI_SUBREDDITS: SubredditConfig[] = [
  {
    name: 'LocalLLaMA',
    priority: 'high',
    keywords: ['free', 'local', 'api', 'hosting', 'self-hosted'],
    excludeKeywords: ['nsfw', 'political'],
    minScore: 10,
    minComments: 3
  },
  {
    name: 'MachineLearning',
    priority: 'high',
    keywords: ['free api', 'open source', 'model', 'inference'],
    excludeKeywords: ['career', 'education'],
    minScore: 50,
    minComments: 10
  },
  {
    name: 'OpenAI',
    priority: 'medium',
    keywords: ['free tier', 'api limits', 'pricing', 'alternatives'],
    excludeKeywords: ['meme', 'off-topic'],
    minScore: 20,
    minComments: 5
  },
  {
    name: 'StableDiffusion',
    priority: 'medium',
    keywords: ['free generation', 'api', 'hosting', 'limits'],
    excludeKeywords: ['art', 'artwork'],
    minScore: 15,
    minComments: 3
  },
  {
    name: 'ArtificialIntelligence',
    priority: 'medium',
    keywords: ['free ai', 'no cost', 'open source model'],
    excludeKeywords: ['ethics', 'safety'],
    minScore: 100,
    minComments: 20
  },
  {
    name: 'learnmachinelearning',
    priority: 'low',
    keywords: ['free resources', 'tutorials', 'examples'],
    excludeKeywords: ['homework', 'assignment'],
    minScore: 5,
    minComments: 2
  }
];
```

### 3. Reddit Data Normalizer (`src/normalizers/reddit-normalizer.ts`)
```typescript
class RedditNormalizer {
  // Normalize submission data for verification
  normalizeSubmission(submission: RedditSubmission): NormalizedSubmission;
  
  // Normalize comment data
  normalizeComment(comment: RedditComment): NormalizedComment;
  
  // Extract model mentions from Reddit content
  extractModelMentions(content: string, modelNames: string[]): ModelMention[];
  
  // Calculate sentiment from score and awards
  calculateSentiment(item: RedditSubmission | RedditComment): SentimentScore;
  
  // Filter high-quality content
  filterHighQuality(items: RedditSubmission[]): RedditSubmission[];
  
  // Detect discussions about pricing/availability
  detectPricingDiscussion(content: string): PricingDiscussion | null;
}

interface NormalizedSubmission {
  id: string;
  title: string;
  content: string;
  author: string;
  subreddit: string;
  createdAt: Date;
  score: number;
  upvoteRatio: number;
  commentCount: number;
  awards: number;
  modelMentions: ModelMention[];
  sentiment: SentimentScore;
  quality: QualityScore;
}

interface NormalizedComment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  score: number;
  depth: number;
  awards: number;
  modelMentions: ModelMention[];
  sentiment: SentimentScore;
  replies: NormalizedComment[];
}
```

### 4. Reddit Verification Service (`src/services/RedditVerificationService.ts`)
```typescript
class RedditVerificationService {
  private api: RedditAPI;
  private normalizer: RedditNormalizer;
  private sentimentAnalyzer: SentimentAnalyzer;
  private subredditConfigs: SubredditConfig[];
  
  constructor(api: RedditAPI);
  
  // Comprehensive model verification from Reddit
  async verifyModel(modelId: string, modelData: AggregatedItem): Promise<RedditSource>;
  
  // Search model discussions across relevant subreddits
  async searchModelDiscussions(modelName: string, provider: string): Promise<ModelDiscussion[]>;
  
  // Analyze sentiment patterns in comments
  async analyzeCommentSentiment(modelName: string): Promise<SentimentAnalysis>;
  
  // Extract common issues and complaints
  async extractCommonIssues(modelName: string): Promise<CommonIssue[]>;
  
  // Monitor trending discussions about free models
  async getTrendingDiscussions(timeframe: 'day' | 'week' | 'month'): Promise<TrendingDiscussion[]>;
  
  // Verify model availability through user reports
  async verifyAvailabilityReports(modelName: string): Promise<AvailabilityReport[]>;
}
```

## Implementation Plan

### Step 1: Reddit API Client Setup
- Set up OAuth2 authentication with Reddit
- Implement rate limiting (60 requests/minute)
- Create search methods for submissions and comments
- Add subreddit monitoring capabilities

### Step 2: Subreddit Configuration
- Define AI/ML subreddit list with priorities
- Create keyword filtering and quality thresholds
- Implement subreddit-specific search strategies
- Add content quality scoring

### Step 3: Data Normalization
- Create RedditNormalizer class
- Implement sentiment analysis from scores/awards
- Extract model mentions from discussions
- Filter for high-quality technical content

### Step 4: Verification Service
- Create RedditVerificationService class
- Implement comprehensive model verification
- Add sentiment pattern analysis
- Create common issue extraction

### Step 5: Integration and Monitoring
- Integrate with verification system
- Add Reddit-specific trust scoring
- Monitor API usage and rate limits
- Create Reddit metrics dashboard

## Search Strategies

### Model-Specific Search Queries
```typescript
const MODEL_SEARCH_PATTERNS = {
  pricing: [
    '{modelName} free tier',
    '{modelName} pricing',
    '{modelName} free API',
    '{modelName} no cost'
  ],
  availability: [
    '{modelName} down',
    '{modelName} not working',
    '{modelName} rate limited',
    '{modelName} unavailable'
  ],
  alternatives: [
    '{modelName} alternatives free',
    'free alternatives to {modelName}',
    '{modelName} vs free options'
  ],
  usage: [
    'using {modelName} for free',
    '{modelName} tutorial',
    '{modelName} getting started'
  ]
};
```

### Subreddit-Specific Strategies
```typescript
const SUBREDDIT_STRATEGIES = {
  'LocalLLaMA': {
    focus: ['self-hosting', 'local models', 'free alternatives'],
    timeFilter: 'week',
    minScore: 10
  },
  'MachineLearning': {
    focus: ['research', 'APIs', 'inference'],
    timeFilter: 'month',
    minScore: 50
  },
  'OpenAI': {
    focus: ['GPT', 'API limits', 'pricing'],
    timeFilter: 'week',
    minScore: 20
  }
};
```

## Quality Filtering

### Content Quality Metrics
```typescript
interface QualityScore {
  overall: number;           // 0-100
  engagement: number;        // Based on score/comments
  recency: number;           // Newer posts score higher
  relevance: number;         // Keyword matching
  credibility: number;       // Author history, awards
}

function calculateQualityScore(
  submission: RedditSubmission,
  keywords: string[]
): QualityScore {
  // Score based on engagement
  const engagementScore = Math.min(submission.score / 100, 1) * 40;
  
  // Score based on recency (last 30 days)
  const daysOld = (Date.now() - submission.created.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - daysOld / 30) * 20;
  
  // Score based on keyword relevance
  const relevanceScore = calculateRelevance(submission.title + submission.selftext, keywords) * 30;
  
  // Score based on credibility
  const credibilityScore = Math.min(submission.awards * 5, 10);
  
  return {
    overall: engagementScore + recencyScore + relevanceScore + credibilityScore,
    engagement: engagementScore,
    recency: recencyScore,
    relevance: relevanceScore,
    credibility: credibilityScore
  };
}
```

### Spam and Low-Quality Filtering
```typescript
function filterLowQuality(submissions: RedditSubmission[]): RedditSubmission[] {
  return submissions.filter(submission => {
    // Remove posts with low scores
    if (submission.score < 5) return false;
    
    // Remove posts with very few comments
    if (submission.numComments < 2) return false;
    
    // Remove posts with low upvote ratio (controversial)
    if (submission.upvoteRatio < 0.5) return false;
    
    // Remove posts that are too old
    const daysOld = (Date.now() - submission.created.getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld > 90) return false;
    
    // Remove posts with suspicious titles
    const suspiciousPatterns = ['free crypto', 'click here', 'buy now'];
    const title = submission.title.toLowerCase();
    if (suspiciousPatterns.some(pattern => title.includes(pattern))) return false;
    
    return true;
  });
}
```

## Sentiment Analysis for Reddit

### Reddit-Specific Sentiment Indicators
```typescript
interface RedditSentimentFactors {
  score: number;             // Upvotes - downvotes
  upvoteRatio: number;       // Positive engagement ratio
  awards: number;            // Reddit awards (strong positive signal)
  commentSentiment: number;  // Sentiment of comments
  controversyLevel: number;  // How controversial the post is
}

function calculateRedditSentiment(
  submission: RedditSubmission,
  comments: RedditComment[]
): SentimentScore {
  // Base sentiment from score
  let sentimentScore = Math.min(submission.score / 100, 1) * 0.4;
  
  // Boost from upvote ratio
  sentimentScore += (submission.upvoteRatio - 0.5) * 0.3;
  
  // Boost from awards
  sentimentScore += Math.min(submission.awards / 10, 0.2);
  
  // Comment sentiment analysis
  const commentSentiment = analyzeCommentSentiments(comments);
  sentimentScore += commentSentiment * 0.1;
  
  return {
    score: Math.max(-1, Math.min(1, sentimentScore * 2 - 1)),
    confidence: 0.8,
    label: sentimentScore > 0.6 ? 'positive' : sentimentScore < 0.4 ? 'negative' : 'neutral',
    keywords: extractKeywords(submission.title + submission.selftext)
  };
}
```

## Monitoring and Analytics

### Reddit Metrics Tracking
```typescript
interface RedditMetrics {
  submissionsAnalyzed: number;
  commentsProcessed: number;
  subredditsMonitored: number;
  averageSentiment: number;
  trendingTopics: string[];
  rateLimitHits: number;
  apiCallsMade: number;
}

class RedditMetricsCollector {
  trackSubmission(submission: RedditSubmission, sentiment: SentimentScore): void;
  trackComments(comments: RedditComment[]): void;
  trackRateLimit(): void;
  getMetrics(): RedditMetrics;
}
```

## Error Handling

### Reddit API Specific Errors
```typescript
class RedditAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'RedditAPIError';
  }
}

class RedditRateLimitError extends RedditAPIError {
  constructor(resetTime: Date) {
    super('Reddit rate limit exceeded', 429, 'api');
    this.name = 'RedditRateLimitError';
  }
}
```

## Testing Strategy

### Unit Tests
- Test Reddit API client methods
- Test data normalization and quality filtering
- Test sentiment analysis specific to Reddit
- Test subreddit configuration logic

### Integration Tests
- Test real Reddit API authentication
- Test search functionality across subreddits
- Test rate limiting behavior
- Test content filtering effectiveness

### Mock Data Tests
- Test with various Reddit post/comment structures
- Test edge cases (deleted posts, private subreddits)
- Verify model mention extraction

## Acceptance Criteria

✅ **Reddit API client** with OAuth2 authentication
✅ **AI/ML subreddit monitoring** with quality filtering
✅ **Model discussion extraction** from relevant communities
✅ **Sentiment analysis** using Reddit-specific metrics
✅ **Quality filtering** removing spam and low-quality content
✅ **Rate limiting** respecting Reddit's 60/minute limit
✅ **Comprehensive testing** covering all scenarios

## Files to Create
- `src/api/platforms/RedditAPI.ts`
- `src/data/reddit-subreddits.ts`
- `src/normalizers/reddit-normalizer.ts`
- `src/services/RedditVerificationService.ts`
- `tests/reddit/reddit-api.test.ts`
- `tests/reddit/reddit-verification.test.ts`

## Dependencies
- Task 01: Architecture and interfaces
- Task 02: Sentiment analysis service
- Task 03: API key management
- Task 04: Rate limiting and caching

## Time Estimate
3-4 days for implementation and testing

## Notes
Reddit provides high-volume community feedback but requires careful quality filtering to extract valuable technical insights. Focus on subreddits where developers actually discuss AI tools rather than general AI discussions. Watch for astroturfing and paid promotions that could skew sentiment analysis.