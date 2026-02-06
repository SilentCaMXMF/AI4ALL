import { BasePlatformAPI, AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import { readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';

interface ModelsDevModel {
  id: string;
  name: string;
  provider: string;
  providerId: string;
  modelId: string;
  family?: string;
  inputCost?: number;
  outputCost?: number;
  reasoningCost?: number;
  cacheReadCost?: number;
  cacheWriteCost?: number;
  contextLimit?: number;
  inputLimit?: number;
  outputLimit?: number;
  toolCall?: boolean;
  reasoning?: boolean;
  releaseDate?: string;
  lastUpdated?: string;
  description?: string;
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
        items: [],
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

      const allModels: ModelsDevModel[] = await response.json();
      this.state.fetchCount++;
      
      console.log(`[ModelsDev] Total models in database: ${allModels.length}`);
      
      // Filter for opencode/zen related models
      const relevantModels = this.filterRelevantModels(allModels);
      console.log(`[ModelsDev] Found ${relevantModels.length} opencode/zen related models`);
      
      // Detect price changes
      const priceChanges = this.detectPriceChanges(relevantModels);
      
      if (priceChanges.length > 0) {
        console.log(`[ModelsDev] 🚨 Detected ${priceChanges.length} price changes!`);
        priceChanges.forEach(change => {
          const percentStr = change.changePercent ? ` (${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(1)}%)` : '';
          console.log(`  ${change.modelId}: ${change.field} $${change.oldValue} → $${change.newValue}${percentStr}`);
        });
        
        // Add price changes to history
        this.state.priceHistory.push(...priceChanges);
        
        // Keep only last 1000 price changes
        if (this.state.priceHistory.length > 1000) {
          this.state.priceHistory = this.state.priceHistory.slice(-1000);
        }
      }
      
      // Update cache
      this.state.modelsCache = relevantModels;
      this.state.lastFetchTime = now.toISOString();
      await this.saveState();
      
      // Convert to AggregatedItems
      const items: AggregatedItem[] = relevantModels.map(model => this.normalizeModel(model));
      
      // Add price change alerts as separate items
      const priceAlertItems = priceChanges.map(change => this.normalizePriceChange(change));
      
      console.log(`[ModelsDev] Returning ${items.length} models + ${priceAlertItems.length} price alerts`);
      
      return {
        items: [...items, ...priceAlertItems].slice(0, options.limit || 100),
        hasMore: false
      };
    } catch (error) {
      throw this.handleError(error, 'fetchItems');
    }
  }

  private filterRelevantModels(models: ModelsDevModel[]): ModelsDevModel[] {
    return models.filter(model => {
      const searchString = `${model.provider} ${model.providerId} ${model.name} ${model.modelId}`.toLowerCase();
      return this.searchTerms.some(term => searchString.includes(term.toLowerCase()));
    });
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

  private normalizeModel(model: ModelsDevModel): AggregatedItem {
    const costInfo = [];
    if (model.inputCost !== undefined) costInfo.push(`Input: $${model.inputCost}/1M tokens`);
    if (model.outputCost !== undefined) costInfo.push(`Output: $${model.outputCost}/1M tokens`);
    if (model.reasoningCost !== undefined) costInfo.push(`Reasoning: $${model.reasoningCost}/1M tokens`);
    
    const capabilities = [];
    if (model.toolCall) capabilities.push('Tool Calling');
    if (model.reasoning) capabilities.push('Reasoning');
    
    return {
      id: `modelsdev-${model.id || `${model.providerId}-${model.modelId}`}`,
      platform: 'modelsdev',
      type: 'model',
      title: `${model.provider}: ${model.name || model.modelId}`,
      content: `Pricing: ${costInfo.join(' | ')}${capabilities.length > 0 ? ` | Capabilities: ${capabilities.join(', ')}` : ''}${model.contextLimit ? ` | Context: ${model.contextLimit.toLocaleString()} tokens` : ''}`,
      author: {
        name: model.provider,
        url: `https://models.dev/?search=${encodeURIComponent(model.providerId)}`
      },
      timestamp: model.lastUpdated || new Date().toISOString(),
      url: `https://models.dev/?search=${encodeURIComponent(model.providerId)}&model=${encodeURIComponent(model.modelId)}`,
      metrics: {
        stars: model.inputCost,
        forks: model.outputCost,
        watchers: model.contextLimit
      },
      tags: [
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
