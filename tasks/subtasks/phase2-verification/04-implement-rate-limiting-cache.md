# Task 04: Implement Rate Limiting and Caching Infrastructure

## Description
Create a robust rate limiting and caching system to handle API rate limits across multiple platforms, ensure efficient data usage, and prevent API abuse.

## Files to Create/Modify

### 1. Rate Limiting Manager (`src/utils/rate-limiting.ts`)
```typescript
interface RateLimitConfig {
  requests: number;        // Max requests per window
  windowMs: number;       // Time window in milliseconds
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface PlatformRateLimit {
  platform: Platform;
  limit: RateLimitConfig;
  current: number;
  remaining: number;
  resetTime: Date;
  lastRequest: Date;
}

class RateLimitManager {
  private limiters: Map<Platform, RateLimiter>;
  private currentLimits: Map<Platform, PlatformRateLimit>;
  
  constructor();
  
  // Wait for available rate limit slot
  async waitForSlot(platform: Platform): Promise<void>;
  
  // Record API request
  recordRequest(platform: Platform, success: boolean): void;
  
  // Get current limit status
  getLimitStatus(platform: Platform): PlatformRateLimit | null;
  
  // Check if request is allowed
  canMakeRequest(platform: Platform): boolean;
  
  // Get time until next available slot
  getTimeToNextSlot(platform: Platform): number;
  
  // Reset rate limit manually
  resetLimit(platform: Platform): void;
}
```

### 2. Cache Manager (`src/utils/cache.ts`)
```typescript
interface CacheOptions {
  ttl?: number;           // Time to live in milliseconds
  maxSize?: number;       // Maximum cache size
  strategy?: 'lru' | 'fifo' | 'lfu'; // Eviction strategy
}

interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>>;
  private options: CacheOptions;
  
  constructor(options?: CacheOptions);
  
  // Get value from cache
  async get(key: string): Promise<T | null>;
  
  // Set value in cache
  async set(key: string, value: T, ttl?: number): Promise<void>;
  
  // Check if key exists and is not expired
  async has(key: string): Promise<boolean>;
  
  // Delete entry from cache
  async delete(key: string): Promise<boolean>;
  
  // Clear entire cache
  async clear(): Promise<void>;
  
  // Get cache statistics
  getStats(): CacheStats;
  
  // Clean expired entries
  cleanup(): void;
}

interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  memoryUsage: number;
}
```

### 3. Multi-Layer Cache (`src/services/CacheService.ts`)
```typescript
interface CacheLayer {
  name: string;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

class MultiLayerCache {
  private layers: CacheLayer[];
  
  constructor(layers: CacheLayer[]);
  
  // Get value, checking layers in order
  async get<T>(key: string): Promise<T | null>;
  
  // Set value in all appropriate layers
  async set<T>(key: string, value: T, layer?: string): Promise<void>;
  
  // Promote value to faster cache
  async promote<T>(key: string): Promise<void>;
  
  // Invalidate across all layers
  async invalidate(key: string): Promise<void>;
}
```

### 4. API Response Cache (`src/cache/ApiResponseCache.ts`)
```typescript
interface CachedResponse<T> {
  data: T;
  headers: Record<string, string>;
  statusCode: number;
  cachedAt: Date;
  expiresAt: Date;
  etag?: string;
}

class ApiResponseCache {
  private memoryCache: CacheManager<CachedResponse<any>>;
  private diskCache: CacheManager<CachedResponse<any>>;
  
  constructor();
  
  // Cache API response with smart TTL
  async cacheResponse<T>(
    platform: Platform,
    endpoint: string,
    response: T,
    headers?: Record<string, string>
  ): Promise<void>;
  
  // Get cached response if fresh
  async getCachedResponse<T>(
    platform: Platform,
    endpoint: string
  ): Promise<CachedResponse<T> | null>;
  
  // Invalidate cache for platform
  async invalidatePlatform(platform: Platform): Promise<void>;
  
  // Get cache key for request
  private getCacheKey(platform: Platform, endpoint: string, params?: any): string;
  
  // Determine TTL based on content type
  private determineTTL(data: any, platform: Platform): number;
}
```

### 5. Request Queue Manager (`src/utils/request-queue.ts`)
```typescript
interface QueuedRequest {
  id: string;
  platform: Platform;
  execute: () => Promise<any>;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor: Date;
}

class RequestQueueManager {
  private queues: Map<Platform, QueuedRequest[]>;
  private processing: Map<Platform, boolean>;
  
  constructor();
  
  // Add request to queue
  async enqueue<T>(
    platform: Platform,
    request: () => Promise<T>,
    priority?: number
  ): Promise<T>;
  
  // Process next request in queue
  async processNext(platform: Platform): Promise<void>;
  
  // Get queue status
  getQueueStatus(platform: Platform): QueueStatus;
  
  // Clear queue for platform
  clearQueue(platform: Platform): void;
  
  // Retry failed requests
  retryFailedRequests(platform: Platform): Promise<void>;
}

interface QueueStatus {
  length: number;
  processing: boolean;
  nextIn: number;
  avgWaitTime: number;
}
```

## Implementation Plan

### Step 1: Basic Rate Limiting
- Create RateLimitManager class
- Implement platform-specific rate limits
- Add wait mechanism for slot availability
- Test with different rate limit scenarios

### Step 2: Memory Cache Implementation
- Create CacheManager class
- Implement LRU eviction strategy
- Add TTL support and cleanup
- Add cache statistics

### Step 3: Multi-Layer Cache
- Create memory + disk cache layers
- Implement cache promotion/demotion
- Add intelligent cache warming
- Create cache invalidation strategies

### Step 4: API Response Caching
- Create ApiResponseCache class
- Implement smart TTL based on content
- Add ETag support for conditional requests
- Create platform-specific cache keys

### Step 5: Request Queue System
- Create RequestQueueManager class
- Implement priority queue processing
- Add retry logic with exponential backoff
- Create queue monitoring and statistics

## Platform-Specific Rate Limits

### GitHub API
```typescript
const GITHUB_RATE_LIMITS: RateLimitConfig = {
  requests: 5000,        // Authenticated requests
  windowMs: 3600000,     // 1 hour
};

// Unauthenticated: 60/hour
// Search API: 30/minute (separate limit)
```

### Reddit API
```typescript
const REDDIT_RATE_LIMITS: RateLimitConfig = {
  requests: 60,          // Per minute
  windowMs: 60000,       // 1 minute
};
```

### Stack Exchange API
```typescript
const STACKEXCHANGE_RATE_LIMITS: RateLimitConfig = {
  requests: 10000,       // Per day
  windowMs: 86400000,    // 24 hours
};
```

### Hacker News API
```typescript
const HACKERNEWS_RATE_LIMITS: RateLimitConfig = {
  requests: 1000,        // Per day
  windowMs: 86400000,    // 24 hours
};
```

## Cache Strategy by Content Type

### Static Data (Long TTL: 24-72 hours)
- Model information and metadata
- Provider details
- Platform capabilities

### Dynamic Data (Medium TTL: 1-6 hours)
- Search results
- User discussions
- Issue statuses

### Real-time Data (Short TTL: 5-30 minutes)
- Rate limit status
- API availability
- Service health

## Performance Optimization

### Memory Management
```typescript
// Cache size limits per platform
const PLATFORM_CACHE_SIZES = {
  github: 1000,          // Number of entries
  reddit: 500,
  stackoverflow: 300,
  hackernews: 200,
  huggingface: 100,
};

// Memory usage monitoring
class MemoryMonitor {
  checkMemoryUsage(): MemoryStats;
  cleanupIfNecessary(): void;
  suggestEviction(): string[];
}
```

### Request Optimization
```typescript
// Batch similar requests
class RequestBatcher {
  batchGitHubSearch(queries: string[]): Promise<GitHubSearchResult[]>;
  batchRedditPosts(subreddits: string[]): Promise<RedditPost[]>;
}

// Parallel processing with limits
class ParallelProcessor {
  async processInParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number
  ): Promise<R[]>;
}
```

## Monitoring and Analytics

### Rate Limit Monitoring
```typescript
interface RateLimitMetrics {
  platform: Platform;
  requestsMade: number;
  requestsLimit: number;
  resetTime: Date;
  avgWaitTime: number;
  rejectionRate: number;
}

class RateLimitMonitor {
  getMetrics(platform: Platform): RateLimitMetrics;
  getAllMetrics(): RateLimitMetrics[];
  exportMetrics(): string; // JSON/CSV export
}
```

### Cache Analytics
```typescript
interface CacheAnalytics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  memoryUsage: number;
  topKeys: Array<{ key: string; accesses: number }>;
  sizeByPlatform: Record<Platform, number>;
}

class CacheAnalytics {
  generateReport(): CacheAnalytics;
  getOptimizationSuggestions(): string[];
  exportData(): string;
}
```

## Error Handling and Recovery

### Rate Limit Exceeded
```typescript
class RateLimitHandler {
  async handleRateLimit(platform: Platform, resetTime: Date): Promise<void> {
    // Log the incident
    // Wait until reset time
    // Retry failed requests
    // Notify monitoring system
  }
}
```

### Cache Failures
```typescript
class CacheFailureHandler {
  async handleCacheFailure(error: Error): Promise<void> {
    // Fallback to direct API calls
    // Implement degraded mode
    // Log the failure
    // Attempt cache recovery
  }
}
```

## Testing Strategy

### Unit Tests
- Test rate limiting logic
- Test cache operations
- Test queue management
- Test error scenarios

### Integration Tests
- Test real API rate limits
- Test cache persistence
- Test concurrent requests
- Test failure recovery

### Performance Tests
- Load testing with high request volumes
- Memory usage under stress
- Cache efficiency measurements
- Rate limit adherence

## Acceptance Criteria

✅ **Rate limiting** working for all platforms
✅ **Intelligent caching** with appropriate TTLs
✅ **Request queuing** with priority handling
✅ **Memory management** within limits
✅ **Monitoring and metrics** for performance
✅ **Error recovery** for failures
✅ **Performance tests** passing all scenarios

## Files to Create
- `src/utils/rate-limiting.ts`
- `src/utils/cache.ts`
- `src/services/CacheService.ts`
- `src/cache/ApiResponseCache.ts`
- `src/utils/request-queue.ts`
- `tests/cache/rate-limiting.test.ts`
- `tests/cache/cache-manager.test.ts`

## Dependencies
- Task 01: Architecture and interfaces
- Task 03: API key management (for authenticated requests)

## Time Estimate
3-4 days for implementation and testing

## Notes
This infrastructure is critical for API efficiency and cost management. Proper rate limiting prevents API bans, while caching reduces unnecessary requests and improves response times. Monitor the system closely in production to fine-tune limits and cache strategies.