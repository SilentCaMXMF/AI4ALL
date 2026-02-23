# Task 01: Design Verification Architecture and Database Schema

## Description
Design the enhanced architecture that extends the existing Phase 1 + basic Phase 2 system. Phase 1 already provides free models from models.dev, and a basic feedback system exists. This enhancement will make the verification comprehensive and multi-platform.

**Key Integration Points:**
- Extend existing `ModelFeedback` interface (src/types/index.ts:97-114)
- Enhance existing `feedbackSummary` calculation (src/scraper/index.ts:438-511)
- Improve existing `searchModelFeedback()` method (src/scraper/index.ts:196-263)
- Extend existing sentiment analysis (src/scraper/index.ts:396-436)

## Files to Create/Modify

### 1. Database Schema (`src/types/verification.ts`)
```typescript
// Verification result types
interface VerificationResult {
  modelId: string;
  sources: PlatformSources;
  overall: OverallScore;
  lastUpdated: Date;
}

interface PlatformSources {
  github?: GitHubSource;
  reddit?: RedditSource;
  hackernews?: HackerNewsSource;
  stackoverflow?: StackOverflowSource;
  huggingface?: HuggingFaceSource;
  discord?: DiscordSource;
}

interface OverallScore {
  score: number;              // 0-100
  status: 'verified' | 'likely' | 'questioned' | 'unknown';
  lastUpdated: Date;
  commonIssues: string[];
}
```

### 2. Verification Service Interface (`src/services/VerificationService.ts`)
```typescript
interface VerificationService {
  verifyModel(modelId: string, modelData: AggregatedItem): Promise<VerificationResult>;
  verifyAllModels(models: AggregatedItem[]): Promise<VerificationResult[]>;
  getVerificationHistory(modelId: string): Promise<VerificationResult[]>;
  updateVerificationScore(modelId: string): Promise<void>;
}
```

### 3. Platform API Interfaces (`src/api/platforms/`)
- `BasePlatformAPI.ts` - Common interface for all platforms
- `GitHubAPI.ts` - GitHub search integration
- `RedditAPI.ts` - Reddit subreddit monitoring
- `HackerNewsAPI.ts` - Algolia search integration
- `StackOverflowAPI.ts` - Stack Exchange API
- `HuggingFaceAPI.ts` - Hugging Face Hub API

### 4. Sentiment Analysis (`src/services/SentimentAnalysis.ts`)
```typescript
interface SentimentAnalyzer {
  analyzeSentiment(text: string): SentimentScore;
  extractKeywords(text: string): string[];
  categorizeContent(text: string, keywords: string[]): ContentCategory;
}
```

### 5. Trust Score Calculator (`src/services/TrustScoreCalculator.ts`)
```typescript
interface TrustScoreCalculator {
  calculateScore(sources: PlatformSources): number;
  determineStatus(score: number, sources: PlatformSources): VerificationStatus;
  extractCommonIssues(sources: PlatformSources): string[];
}
```

## Database Schema Design

### Verification Results Collection
```typescript
interface VerificationDocument {
  _id: ObjectId;
  modelId: string;
  modelData: AggregatedItem;
  sources: PlatformSources;
  overall: OverallScore;
  createdAt: Date;
  updatedAt: Date;
}
```

### Platform-Specific Collections
```typescript
interface PlatformMention {
  _id: ObjectId;
  modelId: string;
  platform: Platform;
  mentionId: string;           // GitHub issue ID, Reddit post ID, etc.
  url: string;
  title: string;
  content: string;
  author: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  scrapedAt: Date;
  metadata: Record<string, any>; // Platform-specific data
}
```

## Architecture Components

### 1. Verification Orchestrator
```typescript
class VerificationOrchestrator {
  constructor(
    private apis: Map<Platform, BasePlatformAPI>,
    private sentimentAnalyzer: SentimentAnalyzer,
    private scoreCalculator: TrustScoreCalculator,
    private storage: VerificationStorage
  ) {}
  
  async verifyModel(modelId: string): Promise<VerificationResult>
  async batchVerify(modelIds: string[]): Promise<VerificationResult[]>
}
```

### 2. Rate Limiting Manager
```typescript
class RateLimitManager {
  private limiters: Map<Platform, RateLimiter>;
  
  async waitForSlot(platform: Platform): Promise<void>
  getRemainingCalls(platform: Platform): number
  resetLimit(platform: Platform): void
}
```

### 3. Cache Manager
```typescript
class VerificationCache {
  async get(modelId: string): Promise<VerificationResult | null>
  async set(modelId: string, result: VerificationResult, ttl: number): Promise<void>
  async invalidate(modelId: string): Promise<void>
}
```

## Implementation Plan

### Step 1: Create Type Definitions
- Define all TypeScript interfaces for verification data
- Create platform-specific source interfaces
- Define sentiment analysis types

### Step 2: Design Database Schema
- Create MongoDB collection schemas
- Define indexes for efficient queries
- Plan data migration strategy

### Step 3: Implement Service Interfaces
- Create base platform API interface
- Define verification service contract
- Design sentiment analysis interface

### Step 4: Architecture Documentation
- Create component diagram
- Document data flow
- Define error handling strategy

## Acceptance Criteria

✅ **Complete TypeScript definitions** for all verification types
✅ **Database schema** designed with proper indexing
✅ **Service interfaces** defined with clear contracts
✅ **Architecture diagram** showing component interactions
✅ **Error handling strategy** documented
✅ **Performance considerations** addressed (caching, rate limiting)

## Files to Create
- `src/types/verification.ts`
- `src/services/VerificationService.ts`
- `src/api/platforms/BasePlatformAPI.ts`
- `src/services/SentimentAnalysis.ts`
- `src/services/TrustScoreCalculator.ts`
- `docs/architecture/verification-system.md`

## Dependencies
- None (this is the foundational task)

## Time Estimate
2-3 days for design, interface definitions, and documentation

## Notes
This architecture must support:
- Async processing of multiple platforms
- Graceful degradation when platforms are unavailable
- Efficient caching to avoid API rate limits
- Modular design for easy platform additions
- Clear separation of concerns for testing