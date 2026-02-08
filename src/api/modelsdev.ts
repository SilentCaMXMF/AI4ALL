import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import { readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';

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
  readonly apiEndpoint = 'https://models.dev/api.json';
  
  private stateFile: string;
  private state: ModelsDevState;
  private searchTerms: string[];

  constructor(config: { searchTerms?: string[] } = {}) {
    super();
    this.stateFile = join(process.cwd(), 'data', 'modelsdev-state.json');
    this.searchTerms = config.searchTerms || ['opencode', 'zen'];
    
    this.state = {
      lastFetchTime: new Date(0).toISOString(),
      modelsCache: [],
      priceHistory: [],
      fetchCount: 0
    };
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
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
      };
    }
    
    console.log(`[ModelsDev] Fetching fresh data... (last fetch: ${hoursSinceLastFetch.toFixed(1)}h ago)`);
    
    try {
      await this.rateLimit();
      
      // Fetch the full API
      const response = await fetch(this.apiEndpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SocialMediaAggregator/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Models.dev API error: ${response.status} ${response.statusText}`);
      }

      // Parse response as object with provider keys
      const providersData = await response.json() as Record<string, ProviderConfig>;
      this.state.fetchCount++;
      
      // Flatten all models from all providers
      let allModels: Array<ModelsDevModel & { providerId: string; providerName: string }> = [];
      let totalModelsCount = 0;
      
      for (const [providerId, provider] of Object.entries(providersData)) {
        if (provider.models) {
          const providerModels = Object.entries(provider.models).map(([modelId, model]) => ({
            ...model,
            id: model.id || modelId,
            providerId: providerId,
            providerName: provider.name || providerId
          }));
          allModels = allModels.concat(providerModels);
          totalModelsCount += Object.keys(provider.models).length;
        }
      }
      
      console.log(`[ModelsDev] Total providers: ${Object.keys(providersData).length}`);
      console.log(`[ModelsDev] Total models in database: ${totalModelsCount}`);
      
      // Filter for FREE models only (cost.input === 0 && cost.output === 0)
      const freeModels = this.filterFreeModels(allModels);
      console.log(`[ModelsDev] Found ${freeModels.length} FREE models`);
      
      // Group by provider for summary
      const providerCounts = this.groupByProvider(freeModels);
      console.log(`[ModelsDev] Free models by provider:`, providerCounts);
      
      // Update cache
      this.state.modelsCache = freeModels;
      this.state.lastFetchTime = now.toISOString();
      await this.saveState();
      
      // Convert to AggregatedItems
      const items: AggregatedItem[] = freeModels.map(model => this.normalizeModel(model));
      
      console.log(`[ModelsDev] Returning ${items.length} free models`);
      
      return {
        items: items.slice(0, options.limit || 500),
        hasMore: false
      };
    } catch (error) {
      throw this.handleError(error, 'fetchItems');
    }
  }

  private filterFreeModels(models: ModelsDevModel[]): ModelsDevModel[] {
    return models.filter(model => {
      // A model is FREE when cost.input === 0 OR null/undefined AND cost.output === 0 OR null/undefined
      const inputCost = model.cost?.input ?? model.inputCost;
      const outputCost = model.cost?.output ?? model.outputCost;
      
      const isFree = (inputCost === 0 || inputCost === null || inputCost === undefined) &&
                     (outputCost === 0 || outputCost === null || outputCost === undefined);
      
      return isFree;
    });
  }

  private groupByProvider(models: ModelsDevModel[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const model of models) {
      const provider = model.provider || model.providerId || 'Unknown';
      counts[provider] = (counts[provider] || 0) + 1;
    }
    return counts;
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
          modelId: newModel.modelId,
          providerId: newModel.providerId,
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
          modelId: newModel.modelId,
          providerId: newModel.providerId,
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

  private normalizeModel(model: ModelsDevModel & { providerId: string; providerName: string }): AggregatedItem {
    const capabilities = [];
    if (model.tool_call) capabilities.push('Tool Calling');
    if (model.reasoning) capabilities.push('Reasoning');
    if (model.open_weights) capabilities.push('Open Weights');
    if (model.modalities?.input?.includes('image')) capabilities.push('Vision');
    if (model.modalities?.input?.includes('audio')) capabilities.push('Audio');
    
    const contextLimit = model.limit?.context ?? 0;
    const outputLimit = model.limit?.output ?? 0;
    
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
      title: `${model.providerName}: ${model.name || model.id}`,
      content: contentParts.join(' | '),
      author: {
        name: model.providerName,
        url: `https://models.dev/?search=${encodeURIComponent(model.providerId)}`
      },
      timestamp: model.last_updated || model.release_date || new Date().toISOString(),
      url: `https://models.dev/?search=${encodeURIComponent(model.providerId)}&model=${encodeURIComponent(model.id)}`,
      metrics: {
        stars: contextLimit,
        forks: outputLimit,
        watchers: capabilities.length
      },
      tags: [
        'free',
        model.providerId,
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
    try {
      await access(this.stateFile);
      const content = await readFile(this.stateFile, 'utf-8');
      this.state = JSON.parse(content);
    } catch {
      // File doesn't exist, use default state
      this.state = {
        lastFetchTime: new Date(0).toISOString(),
        modelsCache: [],
        priceHistory: [],
        fetchCount: 0
      };
    }
  }

  private async saveState(): Promise<void> {
    try {
      await writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.warn('[ModelsDev] Could not save state:', error);
    }
  }
}
