import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import type { AggregatedItem } from '../types/index.js';

// Re-export interfaces for backward compatibility
export interface ProviderConfig {
  id: string;
  env_var: string;
  npm_package?: string;
  api_endpoint?: string;
  name: string;
  docs?: string;
  models: Record<string, ModelsDevModel>;
}

export interface ModelsDevModel {
  id: string;
  name: string;
  family?: string;
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  toolCall?: boolean;
  structured_output?: boolean;
  structuredOutput?: boolean;
  temperature?: boolean;
  knowledge?: string;
  release_date?: string;
  last_updated?: string;
  lastUpdated?: string;
  modalities?: {
    input: string[];
    output: string[];
  };
  open_weights?: boolean;
  openWeights?: boolean;
  cost?: {
    input: number | null;
    output: number | null;
    cache_read?: number | null;
  };
  inputCost?: number | undefined | null;
  outputCost?: number | undefined | null;
  limit?: {
    context: number;
    output: number;
  };
  contextLimit?: number;
  outputLimit?: number;
  provider?: string;
  providerId?: string;
  modelId?: string;
  providerName?: string;
  modelUrl?: string;
  providerUrl?: string;
  npm?: string;
  api?: string;
  description?: string;
}

export interface ModelData {
  lastUpdated: string;
  summary: {
    totalProviders: number;
    totalModels: number;
    opencodeZenModels: number;
    freeModels: number;
    providerCount: number;
  };
  providers: string[];
  modelsByProvider: Record<string, ModelsDevModel[]>;
  models: ModelsDevModel[];
}

export interface FetchOptions {
  limit?: number;
  filterType?: 'simple' | 'advanced' | 'all';
  searchTerms?: string[];
  freeOnly?: boolean;
}

export interface FetchResult {
  items: any[];
  hasMore: boolean;
}

/**
 * Unified Models.dev Service
 * Consolidates all Models.dev API operations with single source of truth
 */
export class ModelsDevService {
  private readonly apiEndpoint = 'https://models.dev/api.json';
  private readonly defaultHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'AI4ALL-ModelScraper/1.0'
  };
  private lastFetchTime: number = 0;
  private readonly minInterval: number = 1000; // 1 second between requests

  constructor(private options: { dataDir?: string } = {}) {
    this.options.dataDir = options.dataDir || join(process.cwd(), 'data');
  }

/**
    * Main fetch method supporting multiple filtering patterns
    */
  async fetchItems(options: FetchOptions = {}): Promise<AggregatedItem[]> {
    const {
      filterType = 'simple',
      searchTerms = ['opencode', 'zen'],
      freeOnly = true,
      limit = 500
    } = options;

    console.log('[ModelsDevService] Fetching models...');
    
    try {
      const providersData = await this.fetchRawData();
      
      // Validate response data
      if (!providersData || typeof providersData !== 'object') {
        throw new Error('Invalid response data from Models.dev API');
      }
      
      const allModels = this.extractModels(providersData);
      
      console.log(`[ModelsDevService] Total providers: ${Object.keys(providersData).length}`);
      console.log(`[ModelsDevService] Total models: ${allModels.length}`);

      let filteredModels = allModels;

      // Apply filtering based on type
      if (filterType === 'simple') {
        filteredModels = this.applySimpleFilter(allModels, searchTerms);
      } else if (filterType === 'advanced') {
        filteredModels = this.applyAdvancedFilter(allModels, searchTerms);
      }

      // Apply free filter if requested
      if (freeOnly) {
        filteredModels = this.filterFreeModels(filteredModels);
        console.log(`[ModelsDevService] Found ${filteredModels.length} FREE models`);
      }

      // Convert to AggregatedItem format
      const items = filteredModels.map(model => this.normalizeToAggregatedItem(model));
      
      console.log(`[ModelsDevService] Returning ${items.length} models`);
      
      return items.slice(0, limit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ModelsDevService] Error fetching models: ${errorMessage}`);
      
      // Return empty array on error to maintain compatibility
      return [];
    }
  }

/**
    * Apply rate limiting
    */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastFetch = now - this.lastFetchTime;
    
    if (timeSinceLastFetch < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastFetch;
      console.log(`[ModelsDevService] Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastFetchTime = Date.now();
  }

  /**
    * Fetch raw data from Models.dev API
    */
  private async fetchRawData(): Promise<Record<string, ProviderConfig>> {
    await this.rateLimit();
    
    const response = await fetch(this.apiEndpoint, {
      headers: this.defaultHeaders
    });

    if (!response.ok) {
      throw new Error(`Models.dev API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Extract and flatten all models from provider data
   */
  private extractModels(providersData: Record<string, ProviderConfig>): Array<ModelsDevModel & { providerId: string; providerName: string }> {
    const allModels: Array<ModelsDevModel & { providerId: string; providerName: string }> = [];

    for (const [providerId, provider] of Object.entries(providersData)) {
      if (provider.models) {
        for (const [modelId, model] of Object.entries(provider.models)) {
          allModels.push({
            ...model,
            id: model.id || modelId,
            providerId,
            providerName: provider.name || providerId,
            modelId,
            providerUrl: provider.docs || '',
            npm: provider.npm_package,
            api: provider.api_endpoint
          });
        }
      }
    }

    return allModels;
  }

  /**
   * Simple filtering (used by scrape-data.js)
   */
  private applySimpleFilter(models: Array<ModelsDevModel & { providerId: string; providerName: string }>, searchTerms: string[]): typeof models {
    return models.filter((model) => {
      const searchString = `${model.provider || ''} ${model.providerId || ''} ${model.name || ''} ${model.modelId || ''}`.toLowerCase();
      return searchTerms.some(term => searchString.includes(term));
    });
  }

  /**
   * Advanced filtering (used by scrape-opencode-zen.js)
   */
  private applyAdvancedFilter(models: Array<ModelsDevModel & { providerId: string; providerName: string }>, searchTerms: string[]): typeof models {
    return models.filter(model => {
      const searchString = `${model.providerName || ''} ${model.providerId || ''} ${model.modelId || ''} ${model.name || ''}`.toLowerCase();
      return searchTerms.some(term => searchString.includes(term));
    });
  }

  /**
   * Filter for free models only
   */
  private filterFreeModels(models: Array<ModelsDevModel & { providerId: string; providerName: string }>): typeof models {
    return models.filter(model => {
      const inputCost = model.cost?.input !== undefined ? model.cost.input : model.inputCost;
      const outputCost = model.cost?.output !== undefined ? model.cost.output : model.outputCost;
      
      return (inputCost === 0 || inputCost === undefined || inputCost === null) &&
             (outputCost === 0 || outputCost === undefined || outputCost === null);
    });
  }

  /**
   * Normalize model to AggregatedItem format
   */
  private normalizeToAggregatedItem(model: ModelsDevModel & { providerId: string; providerName: string }): AggregatedItem {
    // Cost analysis
    const costInfo = [];
    const inputCost = model.cost?.input !== undefined ? model.cost.input : model.inputCost;
    const outputCost = model.cost?.output !== undefined ? model.cost.output : model.outputCost;
    
    if (inputCost !== undefined && inputCost !== null && inputCost > 0) {
      costInfo.push(`Input: $${inputCost}/1M tokens`);
    }
    if (outputCost !== undefined && outputCost !== null && outputCost > 0) {
      costInfo.push(`Output: $${outputCost}/1M tokens`);
    }

    // Capabilities analysis
    const capabilities = [];
    if (model.tool_call || model.toolCall) capabilities.push('Tool Calling');
    if (model.reasoning) capabilities.push('Reasoning');
    if (model.structured_output || model.structuredOutput) capabilities.push('Structured Output');
    if (model.open_weights || model.openWeights) capabilities.push('Open Weights');
    if (model.modalities?.input?.includes('image')) capabilities.push('Vision');
    if (model.modalities?.input?.includes('audio')) capabilities.push('Audio');

    // Context limits
    const contextLimit = model.limit?.context ?? model.contextLimit ?? 0;
    const outputLimit = model.limit?.output ?? model.outputLimit ?? 0;

    // Build content
    const contentParts = [
      costInfo.length > 0 ? costInfo.join(' | ') : '💰 FREE MODEL',
      contextLimit > 0 ? `Context: ${contextLimit.toLocaleString()} tokens` : null,
      outputLimit > 0 ? `Output: ${outputLimit.toLocaleString()} tokens` : null,
      capabilities.length > 0 ? `Capabilities: ${capabilities.join(', ')}` : null,
      model.family ? `Family: ${model.family}` : null
    ].filter(Boolean);

    const isFree = (inputCost === 0 || inputCost === undefined || inputCost === null) &&
                   (outputCost === 0 || outputCost === undefined || outputCost === null);

    return {
      id: `modelsdev-${model.id || `${model.providerId}-${model.modelId}`}`,
      platform: 'modelsdev',
      type: 'model',
      title: `${model.providerName}: ${model.name || model.modelId}`,
      content: contentParts.join(' | '),
      author: {
        name: model.providerName,
        url: `https://models.dev/?search=${encodeURIComponent(model.providerId)}`
      },
      timestamp: model.lastUpdated || model.last_updated || model.release_date || new Date().toISOString(),
      url: `https://models.dev/?search=${encodeURIComponent(model.providerId)}&model=${encodeURIComponent(model.modelId || '')}`,
      metrics: {
        inputCost,
        outputCost,
        contextLimit,
        outputLimit,
        isFree,
        capabilities: capabilities.length
      },
      tags: [
        model.providerId,
        ...(model.family ? [model.family] : []),
        ...capabilities,
        ...(isFree ? ['free'] : [])
      ],
      raw: model
    };
  }

/**
    * Create structured model data (for scrape-opencode-zen.js compatibility)
    */
  async createModelData(searchTerms: string[] = ['opencode', 'zen']): Promise<ModelData> {
    console.log('[ModelsDevService] Creating structured model data...');
    
    try {
      const providersData = await this.fetchRawData();
      
      // Validate response data
      if (!providersData || typeof providersData !== 'object') {
        throw new Error('Invalid response data from Models.dev API');
      }
      
      const allModels = this.extractModels(providersData);
      
      // Filter for search terms
      const filteredModels = this.applyAdvancedFilter(allModels, searchTerms);
      
      // Filter for free models
      const freeModels = this.filterFreeModels(filteredModels);
      
      // Group by provider
      const byProvider: Record<string, ModelsDevModel[]> = {};
      for (const model of freeModels) {
        const provider = model.providerName || model.providerId || 'Unknown';
        if (!byProvider[provider]) {
          byProvider[provider] = [];
        }
        byProvider[provider].push(model);
      }
      
      console.log(`[ModelsDevService] Found ${freeModels.length} FREE models from ${Object.keys(byProvider).length} providers`);
      
      // Create structured data
      const modelData: ModelData = {
        lastUpdated: new Date().toISOString(),
        summary: {
          totalProviders: Object.keys(providersData).length,
          totalModels: allModels.length,
          opencodeZenModels: filteredModels.length,
          freeModels: freeModels.length,
          providerCount: Object.keys(byProvider).length
        },
        providers: Object.keys(byProvider),
        modelsByProvider: byProvider,
        models: freeModels.map(model => ({
          id: model.id,
          name: model.name || model.modelId || 'Unknown',
          provider: model.providerName || model.providerId || 'Unknown',
          providerId: model.providerId,
          modelId: model.modelId,
          family: model.family,
          description: model.description || '',
          inputCost: model.cost?.input !== undefined ? model.cost.input : model.inputCost,
          outputCost: model.cost?.output !== undefined ? model.cost.output : model.outputCost,
          contextLimit: model.limit?.context || model.contextLimit,
          outputLimit: model.limit?.output || model.outputLimit,
          toolCall: model.tool_call || model.toolCall || false,
          reasoning: model.reasoning || false,
          structuredOutput: model.structured_output || model.structuredOutput || false,
          attachments: model.attachment || false,
          modalities: model.modalities || { input: ['text'], output: ['text'] },
          openWeights: model.open_weights || model.openWeights || false,
          knowledge: model.knowledge,
          releaseDate: model.release_date,
          lastUpdated: model.last_updated,
          url: `https://models.dev/?search=${encodeURIComponent(model.providerId || '')}&model=${encodeURIComponent(model.modelId || '')}`,
          providerUrl: model.providerUrl,
          npm: model.npm,
          api: model.api,
          isFree: true
        }))
      };
      
      // Sort models by provider and name
      modelData.models.sort((a, b) => {
        if (a.provider !== b.provider) {
          const providerA = a.provider || '';
          const providerB = b.provider || '';
          return providerA.localeCompare(providerB);
        }
        return a.name.localeCompare(b.name);
      });
      
      return modelData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ModelsDevService] Error creating model data: ${errorMessage}`);
      
      // Return empty structure on error to maintain compatibility
      return {
        lastUpdated: new Date().toISOString(),
        summary: {
          totalProviders: 0,
          totalModels: 0,
          opencodeZenModels: 0,
          freeModels: 0,
          providerCount: 0
        },
        providers: [],
        modelsByProvider: {},
        models: []
      };
    }
  }

  /**
   * Save model data to file
   */
  async saveModelData(filename: string, modelData: ModelData): Promise<void> {
    await mkdir(this.options.dataDir!, { recursive: true });
    const filePath = join(this.options.dataDir!, filename);
    await writeFile(filePath, JSON.stringify(modelData, null, 2));
    console.log(`[ModelsDevService] ✅ Saved to ${filePath}`);
  }

  /**
   * Get provider statistics
   */
  getProviderStats(models: ModelsDevModel[]): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const model of models) {
      const provider = (model as any).providerName || (model as any).providerId || 'Unknown';
      stats[provider] = (stats[provider] || 0) + 1;
    }
    return stats;
  }

  /**
   * Log provider summary
   */
  logProviderSummary(models: ModelsDevModel[], maxExamples: number = 3): void {
    const byProvider = this.getProviderStats(models);
    
    console.log('\n[ModelsDevService] Models by Provider:');
    for (const [provider, count] of Object.entries(byProvider)) {
      console.log(`  ${provider}: ${count} models`);
      
      // Show examples if we have the detailed model data
      const providerModels = models.filter(m => 
        ((m as any).providerName || (m as any).providerId) === provider
      ).slice(0, maxExamples);
      
      providerModels.forEach(m => {
        const inputCost = m.cost?.input !== undefined ? m.cost.input : (m as any).inputCost;
        const cost = inputCost === 0 || inputCost === undefined ? 'FREE' : `$${inputCost}/1M`;
        console.log(`    - ${m.name} (${cost})`);
      });
    }
  }
}