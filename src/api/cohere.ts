import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import {
  handleAsyncError,
  validateApiResponse,
  incrementRequestCounter
} from '../utils/error-handler.js';

interface CohereModel {
  id: string;
  name: string;
  status: string;
  max_tokens: number;
  pricing?: {
    input: string;
    output: string;
    cached_input?: string;
    cached_output?: string;
  };
}

interface CohereModelsResponse {
  models: CohereModel[];
}

export class CohereAPI extends BasePlatformAPI {
  readonly platform: Platform = 'cohere';
  readonly rateLimitPerHour = 60;

  constructor(private apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.COHERE_API_KEY;
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    return await handleAsyncError(async () => {
      const models = await this.fetchModels();
      
      // Filter for free or low-cost models
      const freeModels = models.filter(model => this.isFreeModel(model));
      
      const items = freeModels.map(model => this.normalizeModel(model));
      
      console.log(`[Cohere] ✓ Found ${items.length} free/available models`);
      
      return {
        items: items.slice(0, options.limit || 20),
        hasMore: false
      };
    }, this.platform, 'fetchItems');
  }

  private async fetchModels(): Promise<CohereModel[]> {
    await this.rateLimit();
    
    return await handleAsyncError(async () => {
      const headers: Record<string, string> = {
        'User-Agent': 'FreeAI4ALL-Scraper/1.0',
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(
        'https://api.cohere.ai/v1/models',
        { headers }
      );
      
      const data = await validateApiResponse<CohereModelsResponse>(response, this.platform, 'fetchModels');
      incrementRequestCounter(this.platform, 'fetchModels');
      
      return data.models || [];
    }, this.platform, 'fetchModels');
  }

  private isFreeModel(model: CohereModel): boolean {
    // Check if model is available
    if (model.status !== 'available') {
      return false;
    }
    
    // Check pricing - if pricing exists and both are 0, it's free
    if (model.pricing) {
      const inputPrice = parseFloat(model.pricing.input || '0');
      const outputPrice = parseFloat(model.pricing.output || '0');
      return inputPrice === 0 && outputPrice === 0;
    }
    
    // Models without pricing info but available are considered free
    return true;
  }

  private normalizeModel(model: CohereModel): AggregatedItem {
    return {
      id: `cohere-${model.id}`,
      platform: 'cohere',
      type: 'model',
      title: model.name,
      content: `Max tokens: ${model.max_tokens}`,
      author: {
        name: 'Cohere'
      },
      timestamp: new Date().toISOString(),
      url: `https://dashboard.cohere.com/models/${model.id}`,
      metrics: {
        downloads: model.max_tokens
      },
      tags: ['cohere', 'model'],
      raw: model
    };
  }
}