# Task 07: Implement Hacker News Search via Algolia API

## Description
**Create new Hacker News integration** to enhance the existing verification system. This will add Hacker News as a new platform (not currently in Phase 1/2) to search for high-quality technical discussions about free AI models from Phase 1.

## Files to Create/Modify

### 1. Hacker News API Client (`src/api/hackernews.ts`)
```typescript
import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';

export class HackerNewsAPI extends BasePlatformAPI {
  readonly platform: Platform = 'hackernews';
  readonly rateLimitPerHour = 1000; // Algolia API limit
  
  constructor(config?: { apiKey?: string });
  
  // Search for model discussions
  async searchForModel(modelName: string, provider: string): Promise<AggregatedItem[]>;
  
  // Get popular AI/ML stories
  async getPopularStories(limit?: number): Promise<AggregatedItem[]>;
  
  // Search comments containing model mentions
  async searchComments(query: string): Promise<AggregatedItem[]>;
  
  // Get story details with comments
  async getStoryWithComments(storyId: number): Promise<AggregatedItem[]>;
  
  // Base implementation
  async fetchItems(options?: FetchOptions): Promise<FetchResult>;
}
```

### 2. Hacker News Service (`src/services/hackernews-service.ts`)
```typescript
export class HackerNewsService {
  private api: HackerNewsAPI;
  
  constructor(api: HackerNewsAPI);
  
  // Search for model mentions with enhanced queries
  async searchModelMentions(modelName: string, provider: string): Promise<ModelMention[]>;
  
  // Analyze discussion quality
  async analyzeDiscussionQuality(storyId: number): Promise<DiscussionQuality>;
  
  // Extract technical insights
  async extractTechnicalInsights(comments: AggregatedItem[]): Promise<TechnicalInsight[]>;
  
  // Verify model availability from discussions
  async verifyModelAvailability(modelName: string): Promise<AvailabilityReport>;
}
```

### 3. Update Scraper Service (`src/scraper/index.ts`)
**Extend existing `searchModelFeedback()` method:**

```typescript
// Add to existing searchModelFeedback() method around line 241
// Search Hacker News
try {
  console.log(`[Scraper]   → Searching Hacker News...`);
  const hnFeedback = await this.searchHackerNewsForModel(modelName, provider);
  feedback.push(...hnFeedback);
} catch (error) {
  console.warn(`[Scraper]   ⚠ Hacker News search failed:`, error);
}
```

**Add new method:**
```typescript
private async searchHackerNewsForModel(modelName: string, provider: string): Promise<ModelFeedback[]> {
  if (!this.hackernewsAPI) return [];
  
  const feedback: ModelFeedback[] = [];
  
  try {
    // Search for discussions
    const results = await this.hackernewsAPI.searchForModel(modelName, provider);
    
    for (const item of results.slice(0, 3)) { // Limit to 3 results
      const feedbackItem: ModelFeedback = {
        id: `hn-${item.id}`,
        platform: 'hackernews',
        type: item.type,
        title: item.title,
        content: item.content?.substring(0, 500) || '',
        author: item.author,
        timestamp: item.timestamp,
        url: item.url,
        metrics: item.metrics,
        tags: [...item.tags, 'hackernews-feedback'],
        relevance: this.calculateRelevance(item.title + ' ' + item.content, modelName, provider),
        sentiment: this.analyzeSentiment(item.title + ' ' + item.content)
      };
      
      if (feedbackItem.relevance > 0.5) {
        feedback.push(feedbackItem);
      }
    }
    
    console.log(`[Scraper]   ✓ Found ${feedback.length} relevant Hacker News discussions`);
  } catch (error) {
    console.warn(`[Scraper]   ⚠ Hacker News search error:`, error);
  }
  
  return feedback;
}
```

### 4. Update Types (`src/types/index.ts`)
**Add Hacker News to Platform type:**
```typescript
export type Platform = 'github' | 'reddit' | 'stackoverflow' | 'discord' | 'x' | 'modelsdev' | 'hackernews';
```

## Implementation Plan

### Step 1: Basic Hacker News API
- Create HackerNewsAPI class extending BasePlatformAPI
- Implement Algolia search API integration
- Add rate limiting (1000/hour limit)
- Create search methods for models and general AI topics

### Step 2: Search Enhancement
- Implement model-specific search queries
- Add comment search functionality
- Create story and comment fetching
- Add relevance filtering

### Step 3: Quality Analysis
- Create HackerNewsService for advanced processing
- Implement discussion quality scoring
- Add technical insight extraction
- Create availability verification logic

### Step 4: Integration
- Integrate with existing ScraperService
- Add to searchModelFeedback() method
- Update feedback analysis to include Hacker News
- Add to existing sentiment analysis

### Step 5: Testing & Optimization
- Test with real Hacker News API
- Optimize search queries for AI/ML topics
- Test integration with existing feedback system
- Add error handling and rate limiting

## Search Strategies for Hacker News

### Model-Specific Queries
```typescript
const HN_SEARCH_QUERIES = {
  availability: [
    `"${modelName}" available`,
    `"${modelName}" working`,
    `${provider} "${modelName}" free`,
    `"${modelName}" API access`
  ],
  issues: [
    `"${modelName}" down`,
    `"${modelName}" not working`,
    `"${modelName}" rate limits`,
    `${provider} issues`
  ],
  alternatives: [
    `free alternatives to "${modelName}"`,
    `"${modelName}" vs free options`,
    `open source "${modelName}"`
  ]
};
```

### Quality Indicators
```typescript
interface DiscussionQuality {
  score: number;           // HN story score
  commentCount: number;    // Number of comments
  commentQuality: number;   // Technical depth of comments
  recency: number;         // How recent the discussion
  relevance: number;        // Model mention relevance
}

function calculateDiscussionQuality(story: any, comments: any[]): DiscussionQuality {
  return {
    score: story.score || 0,
    commentCount: story.commentCount || 0,
    commentQuality: analyzeCommentTechnicalDepth(comments),
    recency: calculateRecencyScore(story.time),
    relevance: calculateModelRelevance(story.title, story.text, modelName)
  };
}
```

### Technical Insight Extraction
```typescript
interface TechnicalInsight {
  type: 'pricing' | 'availability' | 'performance' | 'comparison' | 'limitation';
  content: string;
  confidence: number;
  source: string;
}

function extractTechnicalInsights(comments: any[]): TechnicalInsight[] {
  const insights: TechnicalInsight[] = [];
  
  for (const comment of comments) {
    const text = comment.text || '';
    
    // Look for pricing discussions
    if (text.includes('free') && (text.includes('API') || text.includes('access'))) {
      insights.push({
        type: 'pricing',
        content: text,
        confidence: 0.8,
        source: `comment-${comment.id}`
      });
    }
    
    // Look for availability issues
    if (text.includes('down') || text.includes('unavailable') || text.includes('not working')) {
      insights.push({
        type: 'availability',
        content: text,
        confidence: 0.7,
        source: `comment-${comment.id}`
      });
    }
    
    // Look for performance discussions
    if (text.includes('fast') || text.includes('slow') || text.includes('latency')) {
      insights.push({
        type: 'performance',
        content: text,
        confidence: 0.6,
        source: `comment-${comment.id}`
      });
    }
  }
  
  return insights;
}
```

## Integration with Existing System

### Feedback Summary Enhancement
**Update existing `analyzeFeedback()` method to include Hacker News:**

```typescript
// Add to existing feedback analysis in analyzeFeedback()
// Weight Hacker News discussions highly for technical accuracy
let weightedScore = 0;
let totalWeight = 0;

if (githubCount > 0) {
  weightedScore += (githubPositive / githubCount) * 30; // GitHub weight
  totalWeight += 30;
}

if (redditCount > 0) {
  weightedScore += (redditPositive / redditCount) * 25; // Reddit weight  
  totalWeight += 25;
}

if (hackernewsCount > 0) {
  weightedScore += (hnPositive / hnCount) * 20; // Hacker News weight
  totalWeight += 20;
}

// ... continue with existing logic
```

### Type Updates
**Update existing interfaces:**

```typescript
// Add to ModelFeedback interface platform type
export interface ModelFeedback {
  // ... existing fields
  platform: Platform; // Now includes 'hackernews'
}

// Update PlatformConfig in types
export interface PlatformConfig {
  // ... existing platforms
  hackernews?: {
    apiKey?: string; // Algolia API key (optional, public API available)
    searchQueries?: string[];
  };
}
```

## Acceptance Criteria

✅ **Hacker News API client** working with Algolia search
✅ **Integration with existing** `searchModelFeedback()` method
✅ **Model-specific search** finding relevant discussions
✅ **Quality filtering** for technical discussions
✅ **Enhanced feedback analysis** including HN in trust scoring
✅ **Rate limiting** respecting Algolia API limits
✅ **Testing integration** with existing Phase 1 + basic Phase 2

## Files to Create
- `src/api/hackernews.ts`
- `src/services/hackernews-service.ts`
- `tests/hackernews/hackernews-api.test.ts`
- `tests/hackernews/hackernews-integration.test.ts`

## Files to Modify
- `src/scraper/index.ts` - Add HN to searchModelFeedback()
- `src/types/index.ts` - Add 'hackernews' to Platform type

## Dependencies
- Task 01: Architecture enhancement
- Existing Phase 1: Models.dev integration
- Existing Phase 2: Feedback system foundation

## Time Estimate
3-4 days for implementation and integration testing

## Notes
Hacker News provides high-quality technical discussions but lower volume than Reddit. Focus on extracting technical insights rather than sentiment. The discussions here are often from experienced developers and can provide valuable verification of model availability and limitations.