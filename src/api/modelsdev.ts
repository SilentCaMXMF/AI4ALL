import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform, ContentType } from '../types/index.js';
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
import { sleep } from '../types/index.js';

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
  provider?: string;
  providerName?: string;
  providerId?: string;
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
  modelName?: string;
  providerId?: string;
  provider?: string;
  field?: string;
  oldPrice?: { input: number; output: number };
  newPrice?: { input: number; output: number };
  oldValue?: number | undefined;
  newValue?: number | undefined;
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

  private detectPriceChanges(newModels: ModelsDevModel[]): PriceChange[] {
    const changes: PriceChange[] = [];
    const previousModels = new Map(this.state.modelsCache.map(m => [m.id, m]));
    
    for (const newModel of newModels) {
      const previousModel = previousModels.get(newModel.id);
      if (previousModel) {
        const inputCost = newModel.cost?.input ?? 0;
        const outputCost = newModel.cost?.output ?? 0;
        const prevInputCost = previousModel.cost?.input ?? 0;
        const prevOutputCost = previousModel.cost?.output ?? 0;
        
        if (inputCost !== prevInputCost || outputCost !== prevOutputCost) {
          changes.push({
            modelId: newModel.id,
            modelName: newModel.name,
            oldPrice: { input: prevInputCost, output: prevOutputCost },
            newPrice: { input: inputCost, output: outputCost },
            changePercent: inputCost !== prevInputCost ? 
              ((inputCost - prevInputCost) / Math.max(prevInputCost, 0.0001)) * 100 : 0,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    this.state.priceHistory.push(...changes);
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

  async fetchItems(options?: FetchOptions): Promise<FetchResult> {
    try {
      console.log(`[${this.platform}] Starting fetch for free models...`);
      
      // Use the ModelsDevService to fetch models
      const service = new ModelsDevService();
      const items = await service.fetchItems({ freeOnly: true });
      
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
