import { ModelsDevAPI } from '../api/modelsdev.js';
import type { AggregatedItem, FetchOptions } from '../types/index.js';
import { DataStore } from '../data/store.js';

export interface ScraperConfig {
  platforms?: string[];
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
  private modelsDevAPI: ModelsDevAPI;

  constructor(config: ScraperConfig = {}) {
    this.config = config;
    this.store = new DataStore();
    this.modelsDevAPI = new ModelsDevAPI();
  }

  async scrapeAll(options: FetchOptions = {}): Promise<ScraperResult[]> {
    console.log('[Scraper] Starting scrape for FREE AI models from models.dev...');

    const results: ScraperResult[] = [];

    try {
      console.log('[Scraper] Fetching free models from models.dev...');
      const result = await this.modelsDevAPI.fetchItems(options);
      
      // Save items to store
      for (const item of result.items) {
        await this.store.save(item);
      }

      results.push({
        platform: 'modelsdev',
        items: result.items,
        success: true,
        timestamp: new Date().toISOString()
      });

      console.log(`[Scraper] ✓ Fetched ${result.items.length} free models from models.dev`);
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
    }

    console.log(`[Scraper] Completed scrape. Total free models: ${results.reduce((sum, r) => sum + r.items.length, 0)}`);
    return results;
  }

  getStore(): DataStore {
    return this.store;
  }
}
