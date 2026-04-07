import { ModelsDevAPI } from '../api/modelsdev.js';
import { GitHubAPI } from '../api/github.js';
import { RedditAPI } from '../api/reddit.js';
import { StackOverflowAPI } from '../api/stackoverflow.js';
import { HackerNewsAPI } from '../api/hackernews.js';
import { HuggingFaceAPI } from '../api/huggingface.js';
import { OpenRouterAPI } from '../api/openrouter.js';
import { BasePlatformAPI } from '../types/index.js';
import pLimit from 'p-limit';
import { 
  VerificationDataManager, 
  IncrementalUpdater, 
  APIKeyManager, 
  VerificationHistoryTracker 
} from '../data/index.js';
import type { 
  AggregatedItem, 
  ModelWithFeedback, 
  ModelFeedback, 
  PlatformConfig,
  PipelineConfig,
  Platform,
  FetchResult
} from '../types/index.js';
import { 
  handleAsyncError, 
  logPlatformError 
} from '../utils/error-handler.js';

export interface EnhancedScraperConfig extends PlatformConfig {
  platforms?: string[];
  enableFeedbackSearch?: boolean;
  useIncrementalUpdates?: boolean;
  enableHistoryTracking?: boolean;
}

export interface VerificationResult {
  modelId: string;
  modelName: string;
  provider: string;
  feedback: ModelFeedback[];
  summary: {
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

export type ScraperService = EnhancedScraperService;
export type ScraperConfig = EnhancedScraperConfig;
export interface ScraperResult {
  platform: string;
  items: AggregatedItem[];
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface AnalyticsData {
  modelStatistics: {
    totalModels: number;
    verifiedModels: number;
    highlyVerifiedModels: number;
    availabilityBreakdown: Record<string, number>;
    platformCoverage: Record<string, number>;
  };
  trendingModels: Array<{
    modelId: string;
    modelTitle: string;
    summary: {
      reliabilityScore: number;
      recommendation: string;
    };
    overallTrend: {
      scoreChange: number;
    };
  }>;
  platformReport: Array<{
    platform: string;
    activeModels: number;
    totalModels: number;
    averageVerificationScore: number;
    trend: {
      trend: string;
      scoreChange: number;
    };
    commonIssues: string[];
  }>;
  apiUsage: Record<string, unknown>;
  lastUpdated: string;
}

export interface EnhancedScraperMetrics {
  totalModelsProcessed: number;
  newModelsFound: number;
  verificationUpdates: number;
  errors: string[];
  duration: number;
  platformsActive: string[];
}

export class EnhancedScraperService {
  private config: EnhancedScraperConfig;
  private dataManager: VerificationDataManager;
  private incrementalUpdater: IncrementalUpdater;
  private apiKeyManager: APIKeyManager;
  private historyTracker: VerificationHistoryTracker;
  private modelsDevAPI: ModelsDevAPI;
  private platformAPIs: Map<string, BasePlatformAPI>;

  constructor(config: EnhancedScraperConfig = {}) {
    this.config = {
      enableFeedbackSearch: true,
      useIncrementalUpdates: true,
      enableHistoryTracking: true,
      ...config
    };

    // Initialize data pipeline components
    this.dataManager = new VerificationDataManager();
    this.incrementalUpdater = new IncrementalUpdater(this.dataManager);
    this.apiKeyManager = new APIKeyManager();
    this.historyTracker = new VerificationHistoryTracker(this.dataManager);
    this.modelsDevAPI = new ModelsDevAPI();
    this.platformAPIs = new Map();
  }

  async initialize(): Promise<void> {
    return await handleAsyncError(async () => {
      console.log('[EnhancedScraper] Initializing enhanced scraper service...');
      
      // Initialize API key manager
      await this.apiKeyManager.initialize();
      
      // Initialize platforms with their configurations
      const platformConfigs = this.getPlatformConfigs();
      await this.incrementalUpdater.initializePlatforms(platformConfigs);
      
      // Initialize platform APIs directly
      await this.initializePlatformAPIs(platformConfigs);
      
      console.log('[EnhancedScraper] ✓ Initialization complete');
    }, 'scraper', 'initialize');
  }

  private async initializePlatformAPIs(platformConfigs: any): Promise<void> {
    if (platformConfigs.github) {
      this.platformAPIs.set('github', new GitHubAPI(platformConfigs.github));
    }
    
    if (platformConfigs.reddit) {
      this.platformAPIs.set('reddit', new RedditAPI(platformConfigs.reddit));
    }
    
    if (platformConfigs.stackoverflow) {
      this.platformAPIs.set('stackoverflow', new StackOverflowAPI(platformConfigs.stackoverflow));
    }
    
    this.platformAPIs.set('hackernews', new HackerNewsAPI());
    
    if (platformConfigs.huggingface) {
      this.platformAPIs.set('huggingface', new HuggingFaceAPI(platformConfigs.huggingface));
    }
    
    if (platformConfigs.openrouter) {
      this.platformAPIs.set('openrouter', new OpenRouterAPI(platformConfigs.openrouter.apiKey));
    }
    
    console.log(`[EnhancedScraper] ✓ Initialized ${this.platformAPIs.size} platform APIs`);
  }

  private getPlatformConfigs(): any {
    return {
      github: this.apiKeyManager.getPlatformConfig('github'),
      reddit: this.apiKeyManager.getPlatformConfig('reddit'),
      stackoverflow: this.apiKeyManager.getPlatformConfig('stackoverflow'),
      hackernews: this.apiKeyManager.getPlatformConfig('hackernews'),
      huggingface: this.apiKeyManager.getPlatformConfig('huggingface'),
      openrouter: this.apiKeyManager.getPlatformConfig('openrouter')
    };
  }

  // Main scraping method with enhanced capabilities
  async scrapeWithVerification(fullScrape: boolean = false): Promise<EnhancedScraperMetrics> {
    const startTime = Date.now();
    const metrics: EnhancedScraperMetrics = {
      totalModelsProcessed: 0,
      newModelsFound: 0,
      verificationUpdates: 0,
      errors: [],
      duration: 0,
      platformsActive: []
    };

    return await handleAsyncError(async () => {
      console.log(`[EnhancedScraper] Starting ${fullScrape ? 'full' : 'incremental'} scrape with verification...`);

      if (fullScrape || !this.config.useIncrementalUpdates) {
        // Perform full scrape
        const fullMetrics = await this.performFullScrape();
        Object.assign(metrics, fullMetrics);
      } else {
        // Perform incremental update
        const incrementalResults = await this.incrementalUpdater.performIncrementalUpdate();
        metrics.totalModelsProcessed = incrementalResults.modelsUpdated;
        metrics.verificationUpdates = incrementalResults.newFeedbackFound;
        metrics.errors.push(...incrementalResults.errors);
      }

      // Update platform status
      metrics.platformsActive = Array.from(this.platformAPIs.keys());

      // Calculate duration
      metrics.duration = Date.now() - startTime;

      console.log(`[EnhancedScraper] ✓ Scrape complete in ${(metrics.duration / 1000).toFixed(1)}s`);
      console.log(`[EnhancedScraper] Processed: ${metrics.totalModelsProcessed}, Updates: ${metrics.verificationUpdates}`);

      return metrics;
    }, 'scraper', 'scrapeWithVerification');
  }

  private async performFullScrape(): Promise<Partial<EnhancedScraperMetrics>> {
    const metrics = {
      totalModelsProcessed: 0,
      newModelsFound: 0,
      verificationUpdates: 0,
      errors: [] as string[]
    };

    // Phase 1: Fetch models from models.dev
    console.log('[EnhancedScraper] Phase 1: Fetching free models from models.dev...');
    const modelsResult = await this.modelsDevAPI.fetchItems();
    const models = modelsResult.items;
    metrics.totalModelsProcessed = models.length;

    // Phase 2: Verification from multiple platforms
    if (this.config.enableFeedbackSearch) {
      console.log('[EnhancedScraper] Phase 2: Verifying models across platforms...');
      
      const limit = pLimit(3);
      
      const verificationPromises = models.map((model, index) => 
        limit(async () => {
          try {
            const feedbackResult = await this.verifyModel(model);
            
            if (feedbackResult.feedback.length > 0) {
              metrics.verificationUpdates++;
            }

            // Record verification event
            if (this.config.enableHistoryTracking) {
              await this.historyTracker.recordVerificationEvent(
                model.id,
                'modelsdev',
                'verification_run',
                {
                  newScore: feedbackResult.summary.verificationScore,
                  mentionCount: feedbackResult.feedback.length
                },
                { fullScrape: true }
              );
            }

            // Progress indicator
            if ((index + 1) % 10 === 0 || index === models.length - 1) {
              console.log(`[EnhancedScraper] Verified ${index + 1}/${models.length} models...`);
            }

          } catch (error) {
            const errorMsg = `Failed to verify model ${model.id}: ${error instanceof Error ? error.message : 'Unknown'}`;
            metrics.errors.push(errorMsg);
            logPlatformError('scraper', error, `verifyModel-${model.id}`);
          }
        })
      );

      await Promise.all(verificationPromises);
    }

    // Save updated database
    const db = await this.dataManager.loadDatabase();
    await this.dataManager.saveDatabase(db);

    return metrics;
  }

  private async verifyModel(model: AggregatedItem): Promise<VerificationResult> {
    const feedback: ModelFeedback[] = [];
    const modelName = this.extractModelName(model.title);
    const provider = this.extractProvider(model.title);

    // Search each platform for model mentions
    for (const [platformName, platformAPI] of this.platformAPIs) {
      try {
        if ('searchForModel' in platformAPI && typeof platformAPI.searchForModel === 'function') {
          const platformFeedback = await (platformAPI as any).searchForModel(modelName, provider);
          
          // Add sentiment analysis
          const analyzedFeedback = platformFeedback.map((item: any) => ({
            ...item,
            sentiment: this.analyzeSentiment(item.title + ' ' + (item.content || '')),
            relevance: this.calculateRelevance(item, modelName, provider)
          })).filter((item: any) => item.relevance > 0.3);

          feedback.push(...analyzedFeedback);
          
          if (analyzedFeedback.length > 0) {
            console.log(`[EnhancedScraper]   Found ${analyzedFeedback.length} relevant mentions on ${platformName}`);
          }
        }
      } catch (error) {
        console.warn(`[EnhancedScraper] Platform ${platformName} search failed:`, error);
      }
    }

    // Calculate verification summary
    const summary = this.calculateVerificationSummary(feedback);

    return {
      modelId: model.id,
      modelName,
      provider,
      feedback,
      summary
    };
  }

  private extractModelName(title: string): string {
    const match = title.match(/:\s*([^:(]+)/);
    return match ? match[1].trim() : title;
  }

  private extractProvider(title: string): string {
    const match = title.match(/^([^:]+):/);
    return match ? match[1].trim() : 'unknown';
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    const positivePhrases = [
      'working', 'works', 'available', 'free access', 'free tier', 'no cost',
      'successfully', 'great', 'excellent', 'perfect', 'stable', 'reliable',
      'api key', 'api working', 'no issues', 'recommend', 'love using'
    ];
    
    const negativePhrases = [
      'not working', 'broken', 'down', 'unavailable', 'paid only', 'requires payment',
      'error', 'failed', 'issue', 'problem', 'not free', 'expensive',
      'rate limit', 'quota exceeded', 'access denied', 'deprecated', 'discontinued'
    ];
    
    let positive = 0;
    let negative = 0;
    
    for (const phrase of positivePhrases) {
      if (lowerText.includes(phrase)) positive++;
    }
    
    for (const phrase of negativePhrases) {
      if (lowerText.includes(phrase)) negative++;
    }
    
    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  private calculateRelevance(item: any, modelName: string, provider: string): number {
    const text = (item.title + ' ' + (item.content || '')).toLowerCase();
    const modelLower = modelName.toLowerCase();
    const providerLower = provider.toLowerCase();
    
    let score = 0;
    
    // Exact model name match
    if (text.includes(modelLower)) {
      score += 0.5;
    }
    
    // Provider match
    if (text.includes(providerLower)) {
      score += 0.2;
    }
    
    // AI/ML related keywords
    const aiKeywords = ['api', 'model', 'llm', 'ai', 'machine learning', 'inference'];
    for (const keyword of aiKeywords) {
      if (text.includes(keyword)) {
        score += 0.1;
      }
    }
    
    // Free/pricing related
    const freeKeywords = ['free', 'cost', 'price', 'tier', 'limit'];
    for (const keyword of freeKeywords) {
      if (text.includes(keyword)) {
        score += 0.1;
      }
    }
    
    return Math.min(1, score);
  }

  private calculateVerificationSummary(feedback: ModelFeedback[]) {
    const total = feedback.length;
    const positive = feedback.filter(f => f.sentiment === 'positive').length;
    const negative = feedback.filter(f => f.sentiment === 'negative').length;
    const neutral = feedback.filter(f => f.sentiment === 'neutral').length;
    
    let verificationLevel = 'No verification data';
    let availabilityStatus: 'confirmed' | 'questioned' | 'unknown' = 'unknown';
    
    if (total === 0) {
      verificationLevel = 'No social media mentions found';
    } else if (total < 3) {
      verificationLevel = 'Limited verification data';
      availabilityStatus = 'questioned';
    } else {
      const positiveRatio = positive / total;
      const negativeRatio = negative / total;
      
      if (positiveRatio >= 0.7 && negativeRatio <= 0.2) {
        verificationLevel = 'Strongly verified as working';
        availabilityStatus = 'confirmed';
      } else if (positiveRatio >= 0.5 && negativeRatio <= 0.3) {
        verificationLevel = 'Likely working';
        availabilityStatus = 'confirmed';
      } else if (negativeRatio > positiveRatio) {
        verificationLevel = 'Reported issues detected';
        availabilityStatus = 'questioned';
      } else {
        verificationLevel = 'Mixed verification results';
        availabilityStatus = 'questioned';
      }
    }

    // Extract common issues
    const commonIssues: string[] = [];
    const issueKeywords = [
      'rate limit', 'quota', 'unavailable', 'error', 'failed',
      'deprecated', 'paid only', 'requires payment', 'access denied'
    ];
    
    for (const item of feedback) {
      const content = (item.content + ' ' + item.title).toLowerCase();
      for (const keyword of issueKeywords) {
        if (content.includes(keyword) && !commonIssues.includes(keyword)) {
          commonIssues.push(keyword);
        }
      }
    }

    return {
      total,
      positive,
      negative,
      neutral,
      lastMention: feedback.length > 0 
        ? new Date(Math.max(...feedback.map(f => new Date(f.timestamp).getTime()))).toISOString()
        : new Date().toISOString(),
      availabilityStatus,
      commonIssues,
      verificationLevel,
      verificationScore: total > 0 ? Math.round((positive / total) * 100) : 0
    };
  }

  // Get analytics and insights
  async getAnalytics(): Promise<AnalyticsData> {
    return await handleAsyncError(async () => {
      const db = await this.dataManager.loadDatabase();
      const stats = await this.dataManager.getModelStatistics();
      
      // Get trending models
      const trending = await this.historyTracker.getTrendingModels('improving', 5);
      
      // Get platform report
      const platformReport = await this.historyTracker.generatePlatformReport();
      
      return {
        modelStatistics: stats,
        trendingModels: trending,
        platformReport,
        apiUsage: this.apiKeyManager.getUsageStats(),
        lastUpdated: db.lastUpdated
      };
    }, 'scraper', 'getAnalytics');
  }

  // Cleanup maintenance
  async performMaintenance(): Promise<void> {
    return await handleAsyncError(async () => {
      console.log('[EnhancedScraper] Performing maintenance tasks...');
      
      // Cleanup old history
      await this.historyTracker.cleanupHistory();
      
      // Cleanup old data
      await this.dataManager.cleanupOldData();
      
      // Validate API keys
      await this.apiKeyManager.validateAllKeys();
      
      console.log('[EnhancedScraper] ✓ Maintenance complete');
    }, 'scraper', 'performMaintenance');
  }
}