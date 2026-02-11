# Task 05: Enhance GitHub API Integration for Comprehensive Search

## Description
**Enhance the existing GitHub integration** (src/api/github.ts) and improve the `searchGitHubForModel()` method (src/scraper/index.ts:265-307) which currently returns empty results. Make it a comprehensive verification system that actually searches GitHub for model mentions and analyzes their content.

## Files to Create/Modify

### 1. Enhanced GitHub API Client (`src/api/platforms/GitHubAPI.ts`)
```typescript
interface GitHubSearchOptions {
  query: string;
  sort?: 'stars' | 'forks' | 'updated' | 'created';
  order?: 'asc' | 'desc';
  perPage?: number;
  page?: number;
}

interface GitHubIssueSearchOptions {
  query: string;
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  sort?: 'comments' | 'reactions' | 'created' | 'updated';
  order?: 'asc' | 'desc';
}

interface GitHubDiscussionOptions {
  repository: string;
  category?: string;
  order?: 'latest' | 'top' | 'newest';
}

class GitHubAPI implements BasePlatformAPI {
  private client: Octokit;
  private rateLimiter: RateLimiter;
  private cache: ApiResponseCache;
  
  constructor(token?: string);
  
  // Search for repositories mentioning models
  async searchRepositories(options: GitHubSearchOptions): Promise<GitHubSearchResult>;
  
  // Search issues and discussions about models
  async searchIssues(options: GitHubIssueSearchOptions): Promise<GitHubIssueResult>;
  
  // Get detailed repository information
  async getRepository(owner: string, repo: string): Promise<GitHubRepository>;
  
  // Search discussions in repositories
  async searchDiscussions(options: GitHubDiscussionOptions): Promise<GitHubDiscussionResult>;
  
  // Get README content for model mentions
  async getREADME(owner: string, repo: string): Promise<string>;
  
  // Search code for model usage examples
  async searchCode(query: string, language?: string): Promise<GitHubCodeResult>;
  
  // Get commit history for repository activity
  async getCommits(owner: string, repo: string, options?: CommitOptions): Promise<GitHubCommit[]>;
}
```

### 2. Model-Specific Search Queries (`src/data/github-search-queries.ts`)
```typescript
interface ModelSearchQuery {
  baseQuery: string;
  keywords: string[];
  filters: string[];
  weight: number;        // Importance for verification
}

const MODEL_QUERIES: Record<string, ModelSearchQuery> = {
  freeModelPricing: {
    baseQuery: 'free API pricing',
    keywords: ['free tier', 'no cost', 'open source', 'free credits'],
    filters: ['good:first_issues:>100', 'stars:>10'],
    weight: 10
  },
  
  rateLimitIssues: {
    baseQuery: 'rate limit issues',
    keywords: ['rate limit', 'throttling', 'API limits', 'quota exceeded'],
    filters: ['state:open', 'comments:>1'],
    weight: 8
  },
  
  availabilityStatus: {
    baseQuery: 'availability status',
    keywords: ['down', 'unavailable', 'deprecated', 'discontinued'],
    filters: ['state:all', 'updated:>2024-01-01'],
    weight: 9
  },
  
  usageExamples: {
    baseQuery: 'usage examples',
    keywords: ['example', 'tutorial', 'getting started', 'demo'],
    filters: ['language:javascript,python', 'stars:>5'],
    weight: 5
  }
};
```

### 3. GitHub Data Normalizer (`src/normalizers/github-normalizer.ts`)
```typescript
class GitHubNormalizer {
  // Normalize repository data for verification
  normalizeRepository(repo: GitHubRepository): NormalizedRepository;
  
  // Normalize issue/discussion content
  normalizeIssue(issue: GitHubIssue): NormalizedIssue;
  
  // Extract model mentions from content
  extractModelMentions(content: string, modelNames: string[]): ModelMention[];
  
  // Analyze sentiment from reactions and comments
  analyzeSentiment(issue: GitHubIssue): SentimentScore;
  
  // Extract technical details from discussions
  extractTechnicalDetails(content: string): TechnicalDetails;
}

interface NormalizedRepository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  lastUpdated: Date;
  topics: string[];
  language: string;
  license?: string;
  modelMentions: ModelMention[];
}

interface NormalizedIssue {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  state: 'open' | 'closed';
  comments: number;
  reactions: GitHubReactions;
  labels: string[];
  modelMentions: ModelMention[];
  sentiment: SentimentScore;
}
```

### 4. GitHub Verification Service (`src/services/GitHubVerificationService.ts`)
```typescript
class GitHubVerificationService {
  private api: GitHubAPI;
  private normalizer: GitHubNormalizer;
  private sentimentAnalyzer: SentimentAnalyzer;
  
  constructor(api: GitHubAPI);
  
  // Comprehensive model verification
  async verifyModel(modelId: string, modelData: AggregatedItem): Promise<GitHubSource>;
  
  // Search for model mentions across GitHub
  async searchModelMentions(modelName: string, provider: string): Promise<ModelMention[]>;
  
  // Analyze repository discussions about model
  async analyzeRepositoryDiscussions(repoUrl: string): Promise<DiscussionAnalysis>;
  
  // Check for known issues or limitations
  async checkKnownIssues(modelName: string): Promise<KnownIssue[]>;
  
  // Get community sentiment from reactions/comments
  async getCommunitySentiment(modelName: string): Promise<SentimentSummary>;
  
  // Verify model availability through usage examples
  async verifyAvailability(modelName: string): Promise<AvailabilityStatus>;
}
```

## Implementation Plan

### Step 1: Enhance GitHub API Client
- Extend existing GitHub API with comprehensive search
- Add issue and discussion search capabilities
- Implement code search for usage examples
- Add README content fetching

### Step 2: Create Model-Specific Search
- Define search queries for different verification aspects
- Create keyword extraction for model mentions
- Implement intelligent query building
- Add result ranking and filtering

### Step 3: Data Normalization
- Create GitHubNormalizer class
- Implement sentiment analysis from reactions
- Extract technical details from discussions
- Normalize repository and issue data

### Step 4: Verification Service
- Create GitHubVerificationService class
- Implement comprehensive model verification
- Add community sentiment analysis
- Create availability status checking

### Step 5: Integration with Existing System
- Integrate with sentiment analysis service
- Connect to trust score calculator
- Add rate limiting and caching
- Update existing scraper to use enhanced service

## Search Strategies

### Model Discovery Queries
```typescript
// Base queries for different model types
const SEARCH_QUERIES = {
  openRouter: 'OpenRouter free API',
  anthropic: 'Claude API free tier',
  openai: 'GPT API free usage',
  google: 'Gemini API free',
  huggingface: 'Hugging Face inference free',
  localModels: 'local LLM hosting free'
};
```

### Issue and Discussion Monitoring
```typescript
// Search for common issues
const ISSUE_PATTERNS = [
  '{modelName} rate limit',
  '{modelName} API down',
  '{modelName} free tier discontinued',
  '{modelName} pricing change',
  '{modelName} availability issues'
];
```

### Code Examples and Tutorials
```typescript
// Find working examples
const CODE_SEARCH_QUERIES = [
  '{modelName} API example',
  '{modelName} integration tutorial',
  '{modelName} getting started',
  'using {modelName} in production'
];
```

## Data Extraction

### Sentiment Analysis from GitHub
```typescript
interface GitHubReactions {
  thumbsUp: number;
  thumbsDown: number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}

// Calculate sentiment from reactions
function calculateReactionSentiment(reactions: GitHubReactions): number {
  const positive = reactions.thumbsUp + reactions.hooray + reactions.heart + reactions.rocket;
  const negative = reactions.thumbsDown + reactions.confused;
  const total = positive + negative;
  
  return total > 0 ? (positive - negative) / total : 0;
}
```

### Technical Details Extraction
```typescript
interface TechnicalDetails {
  apiKeyRequired: boolean;
  rateLimits: RateLimitInfo;
  pricingModel: 'free' | 'freemium' | 'paid' | 'unknown';
  usageLimits: UsageLimits;
  requirements: string[];
  alternatives: string[];
}

function extractTechnicalDetails(content: string): TechnicalDetails {
  // Extract rate limit mentions
  // Find pricing information
  // Identify API requirements
  // Extract usage examples
}
```

## Performance Optimization

### Caching Strategy
```typescript
// Cache GitHub API responses
const GITHUB_CACHE_CONFIG = {
  repositories: { ttl: 3600000 },      // 1 hour
  issues: { ttl: 1800000 },            // 30 minutes
  discussions: { ttl: 900000 },        // 15 minutes
  code: { ttl: 7200000 }               // 2 hours
};
```

### Batch Processing
```typescript
// Batch similar searches
class GitHubSearchBatcher {
  async batchSearchQueries(queries: string[]): Promise<GitHubSearchResult[]>;
  async batchRepositoryLookups(repos: string[]): Promise<GitHubRepository[]>;
  async batchIssueFetching(issues: string[]): Promise<GitHubIssue[]>;
}
```

## Monitoring and Analytics

### GitHub API Usage Tracking
```typescript
interface GitHubMetrics {
  searchesPerformed: number;
  repositoriesAnalyzed: number;
  issuesProcessed: number;
  rateLimitHits: number;
  averageResponseTime: number;
  cacheHitRate: number;
}

class GitHubMetricsCollector {
  trackSearch(query: string, resultCount: number, responseTime: number): void;
  trackRateLimit(resetTime: Date): void;
  trackCacheHit(key: string): void;
  getMetrics(): GitHubMetrics;
}
```

## Error Handling

### GitHub API Specific Errors
```typescript
class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public rateLimitReset?: Date
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

class GitHubRateLimitError extends GitHubAPIError {
  constructor(resetTime: Date) {
    super('GitHub rate limit exceeded', 403, 'api', resetTime);
    this.name = 'GitHubRateLimitError';
  }
}
```

### Retry Strategy
```typescript
class GitHubRetryStrategy {
  async retryRequest<T>(
    request: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    // Exponential backoff
    // Rate limit aware
    // Network error handling
  }
}
```

## Testing Strategy

### Unit Tests
- Test GitHub API client methods
- Test data normalization
- Test sentiment analysis from reactions
- Test search query building

### Integration Tests
- Test real GitHub API calls
- Test rate limiting behavior
- Test cache integration
- Test error handling

### Mock Data Tests
- Test with mock GitHub responses
- Test edge cases and error scenarios
- Verify data extraction accuracy

## Acceptance Criteria

✅ **Enhanced GitHub API** with comprehensive search
✅ **Model-specific search queries** working correctly
✅ **Data normalization** extracting relevant information
✅ **Verification service** providing accurate model validation
✅ **Performance optimizations** with caching and batching
✅ **Error handling** for API failures and rate limits
✅ **Comprehensive testing** covering all scenarios

## Files to Create
- `src/api/platforms/GitHubAPI.ts`
- `src/data/github-search-queries.ts`
- `src/normalizers/github-normalizer.ts`
- `src/services/GitHubVerificationService.ts`
- `tests/github/github-api.test.ts`
- `tests/github/github-verification.test.ts`

## Dependencies
- Task 01: Architecture and interfaces
- Task 02: Sentiment analysis service
- Task 03: API key management
- Task 04: Rate limiting and caching

## Time Estimate
4-5 days for comprehensive implementation and testing

## Notes
GitHub is the most valuable platform for technical verification, so invest time in making this integration comprehensive. Focus on extracting genuine technical feedback about model availability, pricing, and usage limitations rather than general mentions.