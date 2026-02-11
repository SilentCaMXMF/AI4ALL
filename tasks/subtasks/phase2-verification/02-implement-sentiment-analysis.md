# Task 02: Implement Advanced Sentiment Analysis and Trust Scoring

## Description
Implement the sentiment analysis engine and trust scoring algorithm that will analyze content from multiple platforms to determine model verification scores.

## Files to Create/Modify

### 1. Sentiment Analysis Engine (`src/services/SentimentAnalysis.ts`)
```typescript
interface SentimentScore {
  score: number;           // -1 to 1 (negative to positive)
  confidence: number;      // 0 to 1
  label: 'positive' | 'negative' | 'neutral';
  keywords: string[];
}

interface ContentCategory {
  category: 'pricing' | 'availability' | 'performance' | 'usage' | 'comparison' | 'issue';
  subcategory?: string;
  relevance: number;       // 0 to 1
}

class SentimentAnalyzer {
  // Sentiment analysis using keyword patterns and basic NLP
  analyzeSentiment(text: string): SentimentScore;
  
  // Extract relevant keywords for AI model discussions
  extractKeywords(text: string): string[];
  
  // Categorize content type for better scoring
  categorizeContent(text: string, keywords: string[]): ContentCategory;
  
  // Check for specific model mentions
  findModelMentions(text: string, modelNames: string[]): ModelMention[];
}
```

### 2. Trust Score Calculator (`src/services/TrustScoreCalculator.ts`)
```typescript
interface PlatformWeight {
  github: 30;        // Most reliable for technical info
  reddit: 25;        // High volume, community feedback
  hackernews: 20;    // Quality discussions
  stackoverflow: 15; // Technical validation
  huggingface: 10;   // Model-specific
}

interface TrustCalculationResult {
  score: number;                    // 0-100
  status: 'verified' | 'likely' | 'questioned' | 'unknown';
  breakdown: PlatformBreakdown;
  commonIssues: string[];
  lastUpdated: Date;
}

class TrustScoreCalculator {
  calculateTrustScore(sources: PlatformSources): TrustCalculationResult;
  
  // Platform-specific scoring algorithms
  private scoreGitHub(source: GitHubSource): number;
  private scoreReddit(source: RedditSource): number;
  private scoreHackerNews(source: HackerNewsSource): number;
  private scoreStackOverflow(source: StackOverflowSource): number;
  
  // Aggregate scores with weighted average
  private aggregateScores(scores: Record<string, number>): number;
  
  // Determine verification status based on score and evidence
  determineStatus(score: number, sources: PlatformSources): VerificationStatus;
  
  // Extract common issues from negative mentions
  extractCommonIssues(sources: PlatformSources): string[];
}
```

### 3. Keyword Patterns (`src/data/sentiment-patterns.ts`)
```typescript
// Positive indicators for free models
const POSITIVE_PATTERNS = [
  'free tier', 'no cost', 'free api', 'open source',
  'working great', 'no issues', 'reliable', 'stable',
  'generous limits', 'no rate limit', 'unlimited'
];

// Negative indicators
const NEGATIVE_PATTERNS = [
  'rate limited', 'down', 'not working', 'expensive',
  'paywall', 'credit card required', 'slow', 'unreliable',
  'frequently down', 'deprecated', 'discontinued'
];

// Model-specific keywords
const MODEL_KEYWORDS = [
  'llm', 'language model', 'ai model', 'inference',
  'api', 'endpoint', 'tokens', 'context window',
  'gpt', 'claude', 'llama', 'mistral', 'gemini'
];
```

## Implementation Plan

### Step 1: Basic Sentiment Analysis
- Create keyword-based sentiment classifier
- Implement confidence scoring
- Add domain-specific patterns for AI/ML discussions
- Test on sample GitHub issues and Reddit posts

### Step 2: Content Categorization
- Implement content type detection (pricing, availability, etc.)
- Add keyword extraction for model mentions
- Create relevance scoring for mentions

### Step 3: Trust Scoring Algorithm
- Implement platform-specific scoring functions
- Create weighted aggregation system
- Add status determination logic
- Extract and categorize common issues

### Step 4: Advanced Features
- Add sentiment modifiers (intensifiers, negations)
- Implement context-aware scoring
- Add temporal weighting (recent mentions matter more)
- Create confidence intervals for scores

## Scoring Algorithm Details

### Platform Scoring Logic

#### GitHub (30% weight)
```typescript
private scoreGitHub(source: GitHubSource): number {
  if (!source) return 0;
  
  const sentimentScore = source.positive / (source.positive + source.negative + 1);
  const recencyBonus = this.getRecencyBonus(source.lastMention);
  const qualityBonus = source.repositoryStars > 100 ? 0.1 : 0;
  
  return Math.min(100, (sentimentScore * 30) + recencyBonus + qualityBonus);
}
```

#### Reddit (25% weight)
```typescript
private scoreReddit(source: RedditSource): number {
  if (!source) return 0;
  
  const sentimentScore = source.positive / (source.positive + source.negative + 1);
  const subreditBonus = this.getSubredditQuality(source.subreddits);
  const engagementBonus = Math.min(source.mentions / 100, 0.1);
  
  return Math.min(100, (sentimentScore * 25) + subreditBonus + engagementBonus);
}
```

### Status Determination
```typescript
private determineStatus(score: number, sources: PlatformSources): VerificationStatus {
  const sourceCount = Object.keys(sources).length;
  
  if (score >= 80 && sourceCount >= 3) return 'verified';
  if (score >= 60 && sourceCount >= 2) return 'likely';
  if (score >= 40 && sourceCount >= 1) return 'questioned';
  return 'unknown';
}
```

## Testing Strategy

### Unit Tests
- Test sentiment analysis with known positive/negative samples
- Verify trust score calculations with mock data
- Test edge cases (empty data, conflicting signals)

### Integration Tests
- Test real GitHub issues and Reddit posts
- Verify scoring against manually labeled data
- Test performance with large datasets

### Accuracy Validation
- Manually label 100 random mentions
- Compare against algorithm results
- Target >80% accuracy

## Acceptance Criteria

✅ **Sentiment accuracy** >80% on test dataset
✅ **Trust scoring** algorithm implemented for all platforms
✅ **Status determination** follows defined thresholds
✅ **Common issues extraction** working correctly
✅ **Performance**: <100ms per model analysis
✅ **Comprehensive tests** covering all scenarios

## Files to Create
- `src/services/SentimentAnalysis.ts`
- `src/services/TrustScoreCalculator.ts`
- `src/data/sentiment-patterns.ts`
- `tests/sentiment/analysis.test.ts`
- `tests/sentiment/trust-score.test.ts`

## Dependencies
- Task 01: Architecture and type definitions must be complete

## Time Estimate
3-4 days for implementation and testing

## Notes
The sentiment analysis must be specifically tuned for AI/ML discussions, as general sentiment analysis may not understand technical context correctly. Focus on pricing, availability, and performance indicators specific to free AI models.