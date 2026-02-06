import { GitHubAPI } from '../api/github.js';
import { RedditAPI } from '../api/reddit.js';
import { StackOverflowAPI } from '../api/stackoverflow.js';
import { DiscordAPI } from '../api/discord.js';
import { XAPI } from '../api/x.js';
import { ModelsDevAPI } from '../api/modelsdev.js';
import type { AggregatedItem, PlatformConfig, FetchOptions } from '../types/index';
import { DataStore } from '../data/store';
import type { AggregatedItem, PlatformConfig, FetchOptions } from '../types/index.js';

export interface ScraperConfig extends PlatformConfig {
  platforms?: string[]; // Which platforms to scrape (defaults to all configured)
}

export interface ScraperResult {
  platform: string;
  items: AggregatedItem[];
  success: boolean;
  error?: string;
  timestamp: string;
}

export class ScraperService {
  private config: ScraperConfig;
  private store: DataStore;
  private apis: Map<string, GitHubAPI | RedditAPI | StackOverflowAPI | DiscordAPI | XAPI | ModelsDevAPI>;

  constructor(config: ScraperConfig) {
    this.config = config;
    this.store = new DataStore();
    this.apis = new Map();
    this.initializeAPIs();
  }

  private initializeAPIs(): void {
    // Initialize GitHub API if configured
    if (this.config.github?.token) {
      this.apis.set('github', new GitHubAPI(this.config.github));
    }

    // Initialize Reddit API if configured
    if (this.config.reddit?.clientId && this.config.reddit?.clientSecret) {
      this.apis.set('reddit', new RedditAPI(this.config.reddit));
    }

    // Initialize Stack Overflow API
    this.apis.set('stackoverflow', new StackOverflowAPI(this.config.stackoverflow || {}));

    // Initialize Discord API if configured
    if (this.config.discord?.token) {
      this.apis.set('discord', new DiscordAPI(this.config.discord));
    }

    // Initialize X API if configured
    if (this.config.x?.bearerToken) {
      this.apis.set('x', new XAPI(this.config.x));
    }

    // Initialize Models.dev API (no credentials needed - public API)
    this.apis.set('modelsdev', new ModelsDevAPI({
      searchTerms: ['opencode', 'zen']
    }));
  }

  async scrapeAll(options: FetchOptions = {}): Promise<ScraperResult[]> {
    const platforms = this.config.platforms || Array.from(this.apis.keys());
    const results: ScraperResult[] = [];

    console.log(`[Scraper] Starting scrape for platforms: ${platforms.join(', ')}`);

    for (const platform of platforms) {
      const api = this.apis.get(platform);
      if (!api) {
        console.warn(`[Scraper] No API configured for platform: ${platform}`);
        continue;
      }

      try {
        console.log(`[Scraper] Fetching from ${platform}...`);
        const result = await api.fetchItems(options);
        
        // Save items to store
        for (const item of result.items) {
          await this.store.save(item);
        }

        results.push({
          platform,
          items: result.items,
          success: true,
          timestamp: new Date().toISOString()
        });

        console.log(`[Scraper] ✓ Fetched ${result.items.length} items from ${platform}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Scraper] ✗ Error fetching from ${platform}:`, errorMessage);
        
        results.push({
          platform,
          items: [],
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`[Scraper] Completed scrape. Total items: ${results.reduce((sum, r) => sum + r.items.length, 0)}`);
    return results;
  }

  async scrapePlatform(platform: string, options: FetchOptions = {}): Promise<ScraperResult> {
    const api = this.apis.get(platform);
    if (!api) {
      throw new Error(`No API configured for platform: ${platform}`);
    }

    try {
      console.log(`[Scraper] Fetching from ${platform}...`);
      const result = await api.fetchItems(options);
      
      for (const item of result.items) {
        await this.store.save(item);
      }

      return {
        platform,
        items: result.items,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Scraper] Error fetching from ${platform}:`, errorMessage);
      
      return {
        platform,
        items: [],
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }

  getAvailablePlatforms(): string[] {
    return Array.from(this.apis.keys());
  }

  getStore(): DataStore {
    return this.store;
  }
}
