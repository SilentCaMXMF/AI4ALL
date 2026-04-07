import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform, ContentType } from '../types/index.js';
import { join } from 'path';
import { 
  logPlatformError,
  loadStateFile,
  saveStateFile
} from '../utils/error-handler.js';
import { ModelsDevService } from '../services/models-dev-service.js';
import type { PriceChange, ModelsDevState, ModelsDevModel } from '../services/models-dev-service.js';

// Re-export types from service for backward compatibility
export type { PriceChange, ModelsDevState, ModelsDevModel } from '../services/models-dev-service.js';

export class ModelsDevAPI extends BasePlatformAPI {
  readonly platform: Platform = 'modelsdev';
  readonly rateLimitPerHour = 60; // Conservative - API is generous but let's be nice
  
  private stateFile: string;
  private state: ModelsDevState;

  constructor() {
    super();
    this.stateFile = join(process.cwd(), 'data', 'modelsdev-state.json');
    this.state = {
      lastFetchTime: new Date(0).toISOString(),
      modelsCache: [],
      priceHistory: [],
      fetchCount: 0
    };
    this.loadState().catch(error => {
      logPlatformError(error, this.platform, 'constructor');
    });
  }

  async fetchItems(options?: FetchOptions): Promise<FetchResult> {
    try {
      console.log(`[${this.platform}] Starting fetch for free models...`);
      
      const service = new ModelsDevService();
      const items = await service.fetchItems({ freeOnly: true, ...options });
      
      this.state.modelsCache = items.map(item => item.raw as ModelsDevModel);
      this.state.lastFetchTime = new Date().toISOString();
      this.state.fetchCount++;
      await this.saveState();

      const result: FetchResult = {
        items,
        hasMore: false
      };
      
      console.log(`[${this.platform}] ✓ Fetched ${result.items.length} free models`);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[${this.platform}] Error in fetchItems:`, errorMessage);
      
      return {
        items: [],
        hasMore: false
      };
    }
  }

  private normalizePriceChange(change: PriceChange): AggregatedItem | null {
    const percentStr = change.changePercent 
      ? ` (${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(1)}%)` 
      : '';
    
    // Find the model from cache to get full details
    const model = this.state.modelsCache.find(m => m.id === change.modelId);
    if (!model) return null;
    
    const providerName = model.providerName || model.provider || 'Unknown';
    const providerId = model.providerId || model.provider || '';
    
    const provider = {
      name: providerName,
      url: `https://models.dev/?search=${encodeURIComponent(providerId)}`
    };
    
    const inputCost = change.newPrice?.input ?? 0;
    const outputCost = change.newPrice?.output ?? 0;
    const oldInput = change.oldPrice?.input ?? 0;
    const oldOutput = change.oldPrice?.output ?? 0;
    
    return {
      id: `price-change-${change.modelId}-${Date.now()}`,
      platform: 'modelsdev' as Platform,
      type: 'model' as ContentType,
      title: `${providerName}: ${model.name} - Price Change${percentStr}`,
      content: `Price change for ${model.name}\nOld: Input: $${oldInput}/1M, Output: $${oldOutput}/1M\nNew: Input: $${inputCost}/1M, Output: $${outputCost}/1M${percentStr}\nFamily: ${model.family || 'N/A'}\nProvider: ${providerName}`,
      author: provider,
      timestamp: change.timestamp,
      url: `https://models.dev/model/${model.id}`,
      metrics: {
        stars: 0,
        forks: 0,
        watchers: 0,
        comments: 0,
        upvotes: 0,
        downvotes: 0
      },
      tags: [
        'price-change',
        providerName.toLowerCase(),
        ...(model.family ? [model.family] : [])
      ],
      raw: { ...change, model }
    };
  }

  getPriceHistory(modelId?: string, limit: number = 50): PriceChange[] {
    let history = this.state.priceHistory;
    
    if (modelId) {
      history = history.filter(h => h.modelId === modelId);
    }
    
    return history.slice(-limit);
  }

  getCurrentModels(): ModelsDevModel[] {
    return this.state.modelsCache;
  }

  getStats(): { 
    totalModels: number; 
    lastFetch: string; 
    fetchCount: number;
    priceChanges24h: number;
  } {
    const changes24h = this.state.priceHistory.filter(h => {
      const changeTime = new Date(h.timestamp);
      const hoursAgo = (Date.now() - changeTime.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 24;
    }).length;
    
    return {
      totalModels: this.state.modelsCache.length,
      lastFetch: this.state.lastFetchTime,
      fetchCount: this.state.fetchCount,
      priceChanges24h: changes24h
    };
  }

  private async loadState(): Promise<void> {
    const defaultState: ModelsDevState = {
      lastFetchTime: new Date(0).toISOString(),
      modelsCache: [],
      priceHistory: [],
      fetchCount: 0
    };
    
    this.state = await loadStateFile(this.stateFile, defaultState, this.platform);
  }

  private async saveState(): Promise<void> {
    await saveStateFile(this.stateFile, this.state, this.platform);
  }
}
