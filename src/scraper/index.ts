import { ModelsDevAPI } from '../api/modelsdev.js';
import { GitHubAPI } from '../api/github.js';
import { RedditAPI } from '../api/reddit.js';
import { StackOverflowAPI } from '../api/stackoverflow.js';
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
  };
}

export class ScraperService {
  private config: ScraperConfig;
  private store: DataStore;
  private modelsDevAPI: ModelsDevAPI;
  private githubAPI?: GitHubAPI;
  private redditAPI?: RedditAPI;
  private stackoverflowAPI?: StackOverflowAPI;

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
  }

  async scrapeAll(options: FetchOptions = {}): Promise<ScraperResult[]> {
    console.log('[Scraper] Starting comprehensive scrape...');
    console.log('[Scraper] Phase 1: Fetching free models from models.dev');

    const results: ScraperResult[] = [];
    let models: AggregatedItem[] = [];

    // Phase 1: Get free models from models.dev
    try {
      const modelsResult = await this.modelsDevAPI.fetchItems({ limit: 500 });
      models = modelsResult.items;
      
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
          commonIssues: []
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
          commonIssues: []
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
    const modelName = model.title.split(':')[1]?.trim() || model.title;
    const provider = model.author.name;
    
    console.log(`[Scraper] Searching feedback for: ${modelName} (${provider})`);

    // Search terms for this model
    const searchTerms = [
      `${modelName} free`,
      `${modelName} pricing`,
      `${provider} ${modelName}`,
      `${modelName} API`
    ];

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
    const queries = [
      `"${modelName}" free API`,
      `"${modelName}" pricing`,
      `"${provider}" "${modelName}"`
    ];

    for (const query of queries) {
      try {
        // Search for issues and discussions
        const searchResults = await this.searchGitHub(query);
        
        for (const item of searchResults.slice(0, 5)) { // Limit to 5 per query
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
          
          if (feedbackItem.relevance > 0.5) {
            feedback.push(feedbackItem);
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`[Scraper]   GitHub search error for "${query}":`, error);
      }
    }

    return feedback;
  }

  private async searchGitHub(query: string): Promise<AggregatedItem[]> {
    // This would use the GitHub API to search
    // For now, return empty array as we'd need to implement search
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
      const searchQuery = `${modelName} ${provider}`;
      // This would use StackOverflow API to search
      // Implementation depends on StackOverflowAPI capabilities
    } catch (error) {
      console.warn(`[Scraper]   Stack Overflow search error:`, error);
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
    
    const positiveWords = ['free', 'working', 'great', 'awesome', 'good', 'available', 'accessible', 'working', 'stable'];
    const negativeWords = ['not free', 'paid', 'expensive', 'broken', 'down', 'error', 'issue', 'problem', 'unavailable'];
    
    let positive = 0;
    let negative = 0;
    
    for (const word of positiveWords) {
      if (lowerText.includes(word)) positive++;
    }
    
    for (const word of negativeWords) {
      if (lowerText.includes(word)) negative++;
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
    
    // Determine availability status
    let availabilityStatus: 'confirmed' | 'questioned' | 'unknown' = 'unknown';
    if (total > 0) {
      if (positive > negative * 2) {
        availabilityStatus = 'confirmed';
      } else if (negative > positive) {
        availabilityStatus = 'questioned';
      }
    }
    
    // Extract common issues
    const commonIssues: string[] = [];
    const issueKeywords = ['rate limit', 'unavailable', 'error', 'not working', 'deprecated'];
    for (const item of feedback) {
      for (const keyword of issueKeywords) {
        if (item.content.toLowerCase().includes(keyword) && !commonIssues.includes(keyword)) {
          commonIssues.push(keyword);
        }
      }
    }
    
    return {
      total,
      positive,
      negative,
      neutral,
      lastMention,
      availabilityStatus,
      commonIssues
    };
  }

  getStore(): DataStore {
    return this.store;
  }
}
