import { ModelsDevAPI } from '../api/modelsdev.js';
import { GitHubAPI } from '../api/github.js';
import { RedditAPI } from '../api/reddit.js';
import { StackOverflowAPI } from '../api/stackoverflow.js';
import { HackerNewsAPI } from '../api/hackernews.js';
import { HuggingFaceAPI } from '../api/huggingface.js';
import type { AggregatedItem, ModelWithFeedback, ModelFeedback, PlatformConfig, FetchOptions } from '../types/index.js';
import { DataStore } from '../data/store.js';

export interface ScraperConfig extends PlatformConfig {
  platforms?: string[];
  enableFeedbackSearch?: boolean;
}

export interface ScraperResult {
  platform: string;
  items: AggregatedItem[];
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface FeedbackSearchResult {
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

export class ScraperService {
  private config: ScraperConfig;
  private store: DataStore;
  private modelsDevAPI: ModelsDevAPI;
  private githubAPI?: GitHubAPI;
  private redditAPI?: RedditAPI;
  private stackoverflowAPI?: StackOverflowAPI;
  private hackernewsAPI?: HackerNewsAPI;
  private huggingfaceAPI?: HuggingFaceAPI;

  constructor(config: ScraperConfig = {}) {
    this.config = config;
    this.store = new DataStore();
    this.modelsDevAPI = new ModelsDevAPI();
    
    // Initialize other APIs if credentials provided
    if (config.github?.token) {
      this.githubAPI = new GitHubAPI(config.github);
    }
    if (config.reddit?.clientId) {
      this.redditAPI = new RedditAPI(config.reddit);
    }
    this.stackoverflowAPI = new StackOverflowAPI(config.stackoverflow || {});
    
    // Hacker News - no credentials needed
    if (config.hackernews?.enabled !== false) {
      this.hackernewsAPI = new HackerNewsAPI();
    }
    
    // Hugging Face - optional token
    if (config.huggingface?.token) {
      this.huggingfaceAPI = new HuggingFaceAPI({ token: config.huggingface.token });
    }
  }

  async scrapeAll(options: FetchOptions = {}): Promise<ScraperResult[]> {
    console.log('[Scraper] Starting comprehensive scrape...');
    console.log('[Scraper] Phase 1: Fetching free models from models.dev');

    const results: ScraperResult[] = [];
    let models: AggregatedItem[] = [];

    // Phase 1: Get 0-cost models from models.dev
    try {
      console.log('[Scraper] Phase 1: Fetching 0-cost models from models.dev...');
      const modelsResult = await this.modelsDevAPI.fetchItems({ limit: 500 });
      
      // Filter for only 0-cost input/output models
      models = modelsResult.items.filter(model => {
        const rawModel = model.raw as any;
        return rawModel?.cost?.input === 0 && rawModel?.cost?.output === 0;
      });
      
      console.log(`[Scraper] ✓ Found ${models.length} 0-cost models from ${modelsResult.items.length} total models`);
      
      console.log(`[Scraper] ✓ Found ${models.length} free models from models.dev`);
      
      results.push({
        platform: 'modelsdev',
        items: models,
        success: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Scraper] ✗ Error fetching from models.dev:`, errorMessage);
      
      results.push({
        platform: 'modelsdev',
        items: [],
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      return results;
    }

    // Phase 2: Search for feedback on other platforms (only if APIs are configured)
    const hasFeedbackAPIs = this.githubAPI || this.redditAPI;
    
    if (this.config.enableFeedbackSearch !== false && models.length > 0 && hasFeedbackAPIs) {
      console.log('[Scraper] Phase 2: Searching for model feedback across platforms...');
      console.log('[Scraper] Note: Processing first 50 models to avoid rate limits');
      
      const modelsToProcess = models.slice(0, 50); // Limit to first 50 models
      const modelsWithFeedback: ModelWithFeedback[] = [];
      
      // Process in parallel batches of 5
      const batchSize = 5;
      for (let i = 0; i < modelsToProcess.length; i += batchSize) {
        const batch = modelsToProcess.slice(i, i + batchSize);
        console.log(`[Scraper] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(modelsToProcess.length/batchSize)}...`);
        
        const batchResults = await Promise.all(
          batch.map(async (model) => {
            const feedback = await this.searchModelFeedback(model);
            const modelWithFeedback: ModelWithFeedback = {
              ...model,
              feedback: feedback.feedback,
              feedbackSummary: feedback.summary
            };
            return modelWithFeedback;
          })
        );
        
        modelsWithFeedback.push(...batchResults);
        
        // Rate limiting between batches
        if (i + batchSize < modelsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Save all processed models with feedback
      await this.store.saveMany(modelsWithFeedback);
      
      // Save remaining models without feedback
      const remainingModels = models.slice(50).map(model => ({
        ...model,
        feedback: [],
        feedbackSummary: {
          total: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          lastMention: new Date().toISOString(),
          availabilityStatus: 'unknown',
          commonIssues: [],
          verificationLevel: 'No verification data',
          verificationScore: 0
        }
      }));
      await this.store.saveMany(remainingModels);
      
      console.log(`[Scraper] ✓ Processed ${modelsWithFeedback.length} models with feedback`);
      
      // Add feedback stats
      const totalFeedback = modelsWithFeedback.reduce((sum, m) => sum + m.feedback.length, 0);
      console.log(`[Scraper] ✓ Total feedback items collected: ${totalFeedback}`);
    } else {
      // Save all models without feedback (empty feedback arrays)
      console.log('[Scraper] Phase 2: Skipping feedback search (no APIs configured or disabled)');
      console.log('[Scraper] Saving models without feedback...');
      
      const modelsWithEmptyFeedback = models.map(model => ({
        ...model,
        feedback: [],
        feedbackSummary: {
          total: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          lastMention: new Date().toISOString(),
          availabilityStatus: 'unknown',
          commonIssues: [],
          verificationLevel: 'No verification data',
          verificationScore: 0
        }
      }));
      await this.store.saveMany(modelsWithEmptyFeedback);
      
      console.log(`[Scraper] ✓ Saved ${models.length} models`);
    }

    console.log(`[Scraper] Completed. Total models: ${models.length}`);
    return results;
  }

  private async searchModelFeedback(model: AggregatedItem): Promise<FeedbackSearchResult> {
    const feedback: ModelFeedback[] = [];
    const rawModel = model.raw as any;
    const modelName = rawModel?.name || model.title.split(':')[1]?.trim() || model.title;
    const provider = rawModel?.providerId || rawModel?.provider || model.author.name;
    
    console.log(`[Scraper] Phase 2: Searching social media validation for: ${modelName} (${provider})`);

    // Enhanced search terms for this model using keywords from models.dev
    const searchTerms = [
      `"${modelName}" free API access`,
      `"${modelName}" working`, 
      `"${modelName}" available`,
      `${provider} "${modelName}"`,
      `"${modelName}" rate limits`,
      `"${modelName}" not working`,
      `"${modelName}" issues`
    ];

    // Add family-based searches if available
    if (rawModel?.family) {
      searchTerms.push(`"${rawModel.family}" free`, `"${rawModel.family}" API`);
    }

    // Search GitHub if available
    if (this.githubAPI) {
      try {
        console.log(`[Scraper]   → Searching GitHub...`);
        const githubFeedback = await this.searchGitHubForModel(modelName, provider);
        feedback.push(...githubFeedback);
      } catch (error) {
        console.warn(`[Scraper]   ⚠ GitHub search failed:`, error);
      }
    }

    // Search Reddit if available
    if (this.redditAPI) {
      try {
        console.log(`[Scraper]   → Searching Reddit...`);
        const redditFeedback = await this.searchRedditForModel(modelName, provider);
        feedback.push(...redditFeedback);
      } catch (error) {
        console.warn(`[Scraper]   ⚠ Reddit search failed:`, error);
      }
    }

    // Search Stack Overflow
    try {
      console.log(`[Scraper]   → Searching Stack Overflow...`);
      const soFeedback = await this.searchStackOverflowForModel(modelName, provider);
      feedback.push(...soFeedback);
    } catch (error) {
      console.warn(`[Scraper]   ⚠ Stack Overflow search failed:`, error);
    }

    // Search Hacker News
    if (this.hackernewsAPI) {
      try {
        console.log(`[Scraper]   → Searching Hacker News...`);
        const hnFeedback = await this.searchHackerNewsForModel(modelName, provider);
        feedback.push(...hnFeedback);
      } catch (error) {
        console.warn(`[Scraper]   ⚠ Hacker News search failed:`, error);
      }
    }

    // Search Hugging Face
    if (this.huggingfaceAPI) {
      try {
        console.log(`[Scraper]   → Searching Hugging Face...`);
        const hfFeedback = await this.searchHuggingFaceForModel(modelName, provider);
        feedback.push(...hfFeedback);
      } catch (error) {
        console.warn(`[Scraper]   ⚠ Hugging Face search failed:`, error);
      }
    }

    // Analyze feedback
    const summary = this.analyzeFeedback(feedback);
    
    console.log(`[Scraper]   ✓ Found ${feedback.length} feedback items (${summary.positive} positive, ${summary.negative} negative)`);

    return {
      modelId: model.id,
      modelName,
      provider,
      feedback,
      summary
    };
  }

  private async searchGitHubForModel(modelName: string, provider: string): Promise<ModelFeedback[]> {
    const feedback: ModelFeedback[] = [];

    try {
      if (!this.githubAPI) {
        return feedback;
      }

      const results = await this.githubAPI.searchForModel(modelName, provider);

      for (const item of results.slice(0, 5)) {
        const feedbackItem: ModelFeedback = {
          id: `github-${item.id}`,
          platform: 'github',
          type: item.type,
          title: item.title,
          content: item.content?.substring(0, 500) || '',
          author: item.author,
          timestamp: item.timestamp,
          url: item.url,
          metrics: item.metrics,
          tags: [...item.tags, 'github-feedback'],
          relevance: this.calculateRelevance(item.title + ' ' + item.content, modelName, provider),
          sentiment: this.analyzeSentiment(item.title + ' ' + item.content)
        };

        if (feedbackItem.relevance > 0.3) {
          feedback.push(feedbackItem);
        }
      }

      console.log(`[Scraper]   ✓ Found ${feedback.length} relevant GitHub posts`);
    } catch (error) {
      console.warn(`[Scraper]   ⚠ GitHub search error:`, error);
    }

    return feedback;
  }

  private async searchGitHub(query: string): Promise<AggregatedItem[]> {
    // Use the GitHub API's searchForModel for general search
    if (this.githubAPI) {
      return await this.githubAPI.searchForModel(query, '');
    }
    return [];
  }

  private async searchRedditForModel(modelName: string, provider: string): Promise<ModelFeedback[]> {
    const feedback: ModelFeedback[] = [];
    
    if (!this.redditAPI) return feedback;

    try {
      // Search Reddit for mentions
      const searchQuery = `${modelName} ${provider} free`;
      // This would use Reddit API to search
      // Implementation depends on RedditAPI capabilities
    } catch (error) {
      console.warn(`[Scraper]   Reddit search error:`, error);
    }

    return feedback;
  }

  private async searchStackOverflowForModel(modelName: string, provider: string): Promise<ModelFeedback[]> {
    const feedback: ModelFeedback[] = [];

    try {
      if (!this.stackoverflowAPI) {
        console.warn(`[Scraper]   ⚠️ Stack Overflow API not initialized`);
        return feedback;
      }

      console.log(`[Scraper]   → Searching Stack Overflow for "${modelName}"...`);
      
      const results = await this.stackoverflowAPI.searchForModel(modelName, provider);
      
      for (const item of results.slice(0, 5)) { // Limit to 5 results per model
        const feedbackItem: ModelFeedback = {
          id: `so-${item.id}`,
          platform: 'stackoverflow',
          type: item.type,
          title: item.title,
          content: item.content?.substring(0, 500) || '',
          author: item.author,
          timestamp: item.timestamp,
          url: item.url,
          metrics: item.metrics,
          tags: [...(item.tags || []), 'stackoverflow-feedback'],
          relevance: this.calculateRelevance(item.title + ' ' + (item.content || ''), modelName, provider),
          sentiment: this.analyzeSentiment(item.title + ' ' + (item.content || ''))
        };
        
        if (feedbackItem.relevance > 0.5) {
          feedback.push(feedbackItem);
        }
      }
      
      console.log(`[Scraper]   ✓ Found ${feedback.length} relevant Stack Overflow posts`);
    } catch (error) {
      console.warn(`[Scraper]   ⚠️ Stack Overflow search error:`, error);
    }

    return feedback;
  }

  private async searchHackerNewsForModel(modelName: string, provider: string): Promise<ModelFeedback[]> {
    const feedback: ModelFeedback[] = [];

    try {
      if (!this.hackernewsAPI) {
        return feedback;
      }

      const results = await this.hackernewsAPI.searchForModel(modelName, provider);

      for (const item of results.slice(0, 5)) {
        const feedbackItem: ModelFeedback = {
          id: `hn-${item.id}`,
          platform: 'hackernews',
          type: item.type,
          title: item.title,
          content: item.content || '',
          author: item.author,
          timestamp: item.timestamp,
          url: item.url,
          metrics: item.metrics,
          tags: [...item.tags, 'hackernews-feedback'],
          relevance: this.calculateRelevance(item.title + ' ' + (item.content || ''), modelName, provider),
          sentiment: this.analyzeSentiment(item.title + ' ' + (item.content || ''))
        };

        if (feedbackItem.relevance > 0.3) {
          feedback.push(feedbackItem);
        }
      }

      console.log(`[Scraper]   ✓ Found ${feedback.length} relevant Hacker News posts`);
    } catch (error) {
      console.warn(`[Scraper]   ⚠️ Hacker News search error:`, error);
    }

    return feedback;
  }

  private async searchHuggingFaceForModel(modelName: string, provider: string): Promise<ModelFeedback[]> {
    const feedback: ModelFeedback[] = [];

    try {
      if (!this.huggingfaceAPI) {
        return feedback;
      }

      const results = await this.huggingfaceAPI.searchForModel(modelName, provider);

      for (const item of results.slice(0, 5)) {
        const feedbackItem: ModelFeedback = {
          id: `hf-${item.id}`,
          platform: 'huggingface',
          type: item.type,
          title: item.title,
          content: item.content || '',
          author: item.author,
          timestamp: item.timestamp,
          url: item.url,
          metrics: item.metrics,
          tags: [...item.tags, 'huggingface-feedback'],
          relevance: this.calculateRelevance(item.title + ' ' + (item.content || ''), modelName, provider),
          sentiment: this.analyzeSentiment(item.title + ' ' + (item.content || ''))
        };

        if (feedbackItem.relevance > 0.3) {
          feedback.push(feedbackItem);
        }
      }

      console.log(`[Scraper]   ✓ Found ${feedback.length} relevant Hugging Face models`);
    } catch (error) {
      console.warn(`[Scraper]   ⚠️ Hugging Face search error:`, error);
    }

    return feedback;
  }

  private calculateRelevance(text: string, modelName: string, provider: string): number {
    const lowerText = text.toLowerCase();
    const lowerModel = modelName.toLowerCase();
    const lowerProvider = provider.toLowerCase();
    
    let score = 0;
    
    // Model name match
    if (lowerText.includes(lowerModel)) score += 0.5;
    
    // Provider match
    if (lowerText.includes(lowerProvider)) score += 0.3;
    
    // Keywords indicating relevance
    const keywords = ['free', 'pricing', 'cost', 'api', 'access', 'available'];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) score += 0.05;
    }
    
    return Math.min(score, 1);
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    // Enhanced positive indicators for model availability
    const positivePhrases = [
      'working', 'works', 'available', 'free access', 'free tier', 'no cost',
      'successfully', 'great', 'excellent', 'perfect', 'stable', 'reliable',
      'api key', 'api working', 'no issues', 'recommend', 'love using'
    ];
    
    // Enhanced negative indicators for model issues
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
    
    // Weight recent mentions more heavily
    const recentKeywords = ['just', 'today', 'recently', 'currently'];
    for (const keyword of recentKeywords) {
      if (lowerText.includes(keyword)) {
        if (positive > 0) positive += 0.5;
        if (negative > 0) negative += 0.5;
      }
    }
    
    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  private analyzeFeedback(feedback: ModelFeedback[]): FeedbackSearchResult['summary'] {
    const total = feedback.length;
    const positive = feedback.filter(f => f.sentiment === 'positive').length;
    const negative = feedback.filter(f => f.sentiment === 'negative').length;
    const neutral = feedback.filter(f => f.sentiment === 'neutral').length;
    
    // Get last mention date
    const timestamps = feedback.map(f => new Date(f.timestamp).getTime());
    const lastMention = timestamps.length > 0 
      ? new Date(Math.max(...timestamps)).toISOString()
      : new Date().toISOString();
    
    // Enhanced verification logic
    let availabilityStatus: 'confirmed' | 'questioned' | 'unknown' = 'unknown';
    let verificationLevel = 'No verification data';
    
    if (total === 0) {
      availabilityStatus = 'unknown';
      verificationLevel = 'No social media mentions found';
    } else if (total < 3) {
      availabilityStatus = 'questioned';
      verificationLevel = 'Limited verification data';
    } else {
      const positiveRatio = positive / total;
      const negativeRatio = negative / total;
      
      if (positiveRatio >= 0.7 && negativeRatio <= 0.2) {
        availabilityStatus = 'confirmed';
        verificationLevel = 'Strongly verified as working';
      } else if (positiveRatio >= 0.5 && negativeRatio <= 0.3) {
        availabilityStatus = 'confirmed';
        verificationLevel = 'Likely working';
      } else if (negativeRatio > positiveRatio) {
        availabilityStatus = 'questioned';
        verificationLevel = 'Reported issues detected';
      } else {
        availabilityStatus = 'questioned';
        verificationLevel = 'Mixed verification results';
      }
    }
    
    // Extract common issues with enhanced detection
    const commonIssues: string[] = [];
    const issueKeywords = [
      'rate limit', 'rate-limit', 'quota', 'unavailable', 'not available',
      'error', 'failed', 'not working', 'deprecated', 'discontinued',
      'paid only', 'requires payment', 'access denied', 'invalid api key'
    ];
    
    for (const item of feedback) {
      const content = item.content.toLowerCase();
      for (const keyword of issueKeywords) {
        if (content.includes(keyword) && !commonIssues.includes(keyword)) {
          commonIssues.push(keyword);
        }
      }
    }
    
    const summary = {
      total,
      positive,
      negative,
      neutral,
      lastMention,
      availabilityStatus,
      commonIssues,
      verificationLevel,
      verificationScore: total > 0 ? Math.round((positive / total) * 100) : 0
    };
    
    console.log(`[Scraper]   → Verification: ${verificationLevel} (${summary.verificationScore}% positive)`);
    
    return summary;
  }

  getStore(): DataStore {
    return this.store;
  }
}
