import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';

/**
 * Unified Models.dev Service
 * Consolidates all Models.dev API operations with single source of truth
 */
export class ModelsDevService {
  #apiEndpoint = 'https://models.dev/api.json';
  #defaultHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'AI4ALL-ModelScraper/1.0'
  };
  #lastFetchTime = 0;
  #minInterval = 1000; // 1 second between requests

  constructor(options = {}) {
    this.options = options;
    this.options.dataDir = options.dataDir || join(process.cwd(), 'data');
  }

  /**
   * Main fetch method supporting multiple filtering patterns
   */
  async fetchItems(options = {}) {
    const {
      filterType = 'simple',
      searchTerms = ['opencode', 'zen'],
      freeOnly = true,
      limit = 500
    } = options;

    console.log('[ModelsDevService] Fetching models...');
    
    try {
      const providersData = await this.#fetchRawData();
      
      // Validate response data
      if (!providersData || typeof providersData !== 'object') {
        throw new Error('Invalid response data from Models.dev API');
      }
      
      const allModels = this.#extractModels(providersData);
      
      console.log(`[ModelsDevService] Total providers: ${Object.keys(providersData).length}`);
      console.log(`[ModelsDevService] Total models: ${allModels.length}`);

      let filteredModels = allModels;

      // Apply filtering based on type
      if (filterType === 'simple') {
        filteredModels = this.#applySimpleFilter(allModels, searchTerms);
      } else if (filterType === 'advanced') {
        filteredModels = this.#applyAdvancedFilter(allModels, searchTerms);
      }

      // Apply free filter if requested
      if (freeOnly) {
        filteredModels = this.#filterFreeModels(filteredModels);
        console.log(`[ModelsDevService] Found ${filteredModels.length} FREE models`);
      }

      // Convert to AggregatedItem format
      const items = filteredModels.map(model => this.#normalizeToAggregatedItem(model));
      
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
  async #rateLimit() {
    const now = Date.now();
    const timeSinceLastFetch = now - this.#lastFetchTime;
    
    if (timeSinceLastFetch < this.#minInterval) {
      const waitTime = this.#minInterval - timeSinceLastFetch;
      console.log(`[ModelsDevService] Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.#lastFetchTime = Date.now();
  }

  /**
   * Fetch raw data from Models.dev API
   */
  async #fetchRawData() {
    await this.#rateLimit();
    
    const response = await fetch(this.#apiEndpoint, {
      headers: this.#defaultHeaders
    });

    if (!response.ok) {
      throw new Error(`Models.dev API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Extract and flatten all models from provider data
   */
  #extractModels(providersData) {
    const allModels = [];

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
  #applySimpleFilter(models, searchTerms) {
    return models.filter((model) => {
      const searchString = `${model.provider || ''} ${model.providerId || ''} ${model.name || ''} ${model.modelId || ''}`.toLowerCase();
      return searchTerms.some(term => searchString.includes(term));
    });
  }

  /**
   * Advanced filtering (used by scrape-opencode-zen.js)
   */
  #applyAdvancedFilter(models, searchTerms) {
    return models.filter(model => {
      const searchString = `${model.providerName || ''} ${model.providerId || ''} ${model.modelId || ''} ${model.name || ''}`.toLowerCase();
      return searchTerms.some(term => searchString.includes(term));
    });
  }

  /**
   * Filter for free models only
   */
  #filterFreeModels(models) {
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
  #normalizeToAggregatedItem(model) {
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
}