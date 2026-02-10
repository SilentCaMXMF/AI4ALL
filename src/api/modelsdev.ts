import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import { join } from 'path';
import { 
  handleAsyncError, 
  createPlatformError, 
  logPlatformError,
  loadStateFile,
  saveStateFile,
  validateApiResponse,
  incrementRequestCounter
} from '../utils/error-handler.js';
import { ModelsDevService } from '../services/models-dev-service.js';

interface ProviderConfig {
  id: string;
  env_var: string;
  npm_package?: string;
  api_endpoint?: string;
  name: string;
  docs?: string;
  models: Record<string, ModelsDevModel>;
}

interface ModelsDevModel {
  id: string;
  name: string;
  family?: string;
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  structured_output?: boolean;
  temperature?: boolean;
  knowledge?: string;
  release_date?: string;
  last_updated?: string;
  modalities?: {
    input: string[];
    output: string[];
  };
  open_weights?: boolean;
  cost?: {
    input: number | null;
    output: number | null;
    cache_read?: number | null;
  };
  limit?: {
    context: number;
    output: number;
  };
}

interface PriceChange {
  modelId: string;
  providerId: string;
  field: string;
  oldValue: number | undefined;
  newValue: number | undefined;
  changePercent?: number;
  timestamp: string;
}

interface ModelsDevState {
  lastFetchTime: string;
  modelsCache: ModelsDevModel[];
  priceHistory: PriceChange[];
  fetchCount: number;
}

export class ModelsDevAPI extends BasePlatformAPI {
  readonly platform: Platform = 'modelsdev';
  readonly rateLimitPerHour = 60; // Conservative - API is generous but let's be nice
  
  private stateFile: string;
  private state: ModelsDevState;
  private searchTerms: string[];
  private modelsService: ModelsDevService;

  constructor(config: { searchTerms?: string[] } = {}) {
    super();
    this.stateFile = join(process.cwd(), 'data', 'modelsdev-state.json');
    this.searchTerms = config.searchTerms || ['opencode', 'zen'];
    this.modelsService = new ModelsDevService();
    
    this.state = {
      lastFetchTime: new Date(0).toISOString(),
      modelsCache: [],
      priceHistory: [],
      fetchCount: 0
    };
  }

async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    return handleAsyncError(async () => {
      await this.loadState();
      
      const now = new Date();
      const lastFetch = new Date(this.state.lastFetchTime);
      const hoursSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);
      
      // Check if we should fetch (hourly intervals)
      if (hoursSinceLastFetch < 1 && this.state.modelsCache.length > 0) {
        console.log(`[ModelsDev] Skipping fetch - last update ${hoursSinceLastFetch.toFixed(1)}h ago (hourly intervals)`);
        return {
          items: this.state.modelsCache.map(model => this.normalizeModel(model)),
          hasMore: false
        } as FetchResult;
      }
      
      console.log(`[ModelsDev] Fetching fresh data... (last fetch: ${hoursSinceLastFetch.toFixed(1)}h ago)`);
      
      await this.rateLimit();
      incrementRequestCounter(this.platform, 'fetchItems');
      
      // Use the unified service to fetch items
      const items = await this.modelsService.fetchItems({
        filterType: 'advanced',
        searchTerms: this.searchTerms,
        freeOnly: true,
        limit: options.limit || 500
      });
      
      // Update cache with raw model data for price tracking
      const modelData = await this.modelsService.createModelData(this.searchTerms);
      this.state.modelsCache = modelData.models as any;
      this.state.lastFetchTime = now.toISOString();
      this.state.fetchCount++;
      await this.saveState();
      
      console.log(`[ModelsDev] Returning ${items.length} free models`);
      
      return {
        items,
        hasMore: false
      };
    }, this.platform, 'fetchItems');
  }

  

  private detectPriceChanges(newModels: ModelsDevModel[]): PriceChange[] {
    const changes: PriceChange[] = [];
    const now = new Date().toISOString();
    
    for (const newModel of newModels) {
      const oldModel = this.state.modelsCache.find(m => 
        m.id === newModel.id || (m.providerId === newModel.providerId && m.modelId === newModel.modelId)
      );
      
      if (!oldModel) continue; // New model, not a price change
      
      // Check input cost
      if (newModel.inputCost !== oldModel.inputCost) {
        const changePercent = oldModel.inputCost && newModel.inputCost
          ? ((newModel.inputCost - oldModel.inputCost) / oldModel.inputCost) * 100
          : undefined;
        
        changes.push({
          modelId: (newModel as any).modelId || 'unknown',
          providerId: (newModel as any).providerId || 'unknown',
          field: 'inputCost',
          oldValue: oldModel.inputCost,
          newValue: newModel.inputCost,
          changePercent,
          timestamp: now
        });
      }
      
      // Check output cost
      if (newModel.outputCost !== oldModel.outputCost) {
        const changePercent = oldModel.outputCost && newModel.outputCost
          ? ((newModel.outputCost - oldModel.outputCost) / oldModel.outputCost) * 100
          : undefined;
        
        changes.push({
          modelId: (newModel as any).modelId || 'unknown',
          providerId: (newModel as any).providerId || 'unknown',
          field: 'outputCost',
          oldValue: oldModel.outputCost,
          newValue: newModel.outputCost,
          changePercent,
          timestamp: now
        });
      }
    }
    
    return changes;
  }

  private normalizeModel(model: any): AggregatedItem {
    // The service already returns normalized AggregatedItem format, but we need to adjust for API format
    if (model.platform === 'modelsdev' && model.type === 'model') {
      // Already in correct format from service, just ensure ID is correct for caching
      return {
        ...model,
        id: `modelsdev-${model.raw?.id || model.id}`,
        raw: model.raw || model,
        metrics: model.metrics || {}
      };
    }
    
    // Fallback to manual normalization for cached models
    const capabilities = [];
    if (model.tool_call || model.toolCall) capabilities.push('Tool Calling');
    if (model.reasoning) capabilities.push('Reasoning');
    if (model.open_weights || model.openWeights) capabilities.push('Open Weights');
    if (model.modalities?.input?.includes('image')) capabilities.push('Vision');
    if (model.modalities?.input?.includes('audio')) capabilities.push('Audio');
    
    const contextLimit = model.limit?.context ?? model.contextLimit ?? 0;
    const outputLimit = model.limit?.output ?? model.outputLimit ?? 0;
    
    const contentParts = [
      '💰 FREE MODEL',
      contextLimit > 0 ? `Context: ${contextLimit.toLocaleString()} tokens` : null,
      outputLimit > 0 ? `Output: ${outputLimit.toLocaleString()} tokens` : null,
      capabilities.length > 0 ? `Capabilities: ${capabilities.join(', ')}` : null,
      model.family ? `Family: ${model.family}` : null
    ].filter(Boolean);
    
    return {
      id: `modelsdev-${model.id}`,
      platform: 'modelsdev',
      type: 'model',
      title: `${model.providerName || model.provider}: ${model.name || model.id}`,
      content: contentParts.join(' | '),
      author: {
        name: model.providerName || model.provider,
        url: `https://models.dev/?search=${encodeURIComponent(model.providerId || model.provider)}`
      },
      timestamp: model.last_updated || model.lastUpdated || model.release_date || new Date().toISOString(),
      url: `https://models.dev/?search=${encodeURIComponent(model.providerId || model.provider)}&model=${encodeURIComponent(model.id)}`,
      metrics: {
        stars: contextLimit,
        forks: outputLimit,
        watchers: capabilities.length
      },
      tags: [
        'free',
        model.providerId || model.provider,
        ...(model.family ? [model.family] : []),
        ...(capabilities)
      ],
      raw: model
    };
  }

  private normalizePriceChange(change: PriceChange): AggregatedItem {
    const percentStr = change.changePercent 
      ? ` (${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(1)}%)` 
      : '';
    
    return {
      id: `modelsdev-pricechange-${change.modelId}-${change.timestamp}`,
      platform: 'modelsdev',
      type: 'price_alert',
      title: `💰 Price Change: ${change.modelId}`,
      content: `${change.field} changed from $${change.oldValue} to $${change.newValue}${percentStr} per 1M tokens`,
      author: {
        name: change.providerId,
        url: `https://models.dev/?search=${encodeURIComponent(change.providerId)}`
      },
      timestamp: change.timestamp,
      url: `https://models.dev/?search=${encodeURIComponent(change.providerId)}&model=${encodeURIComponent(change.modelId)}`,
      metrics: {
        stars: change.oldValue,
        forks: change.newValue
      },
      tags: ['price-change', change.providerId, change.field],
      raw: change
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
