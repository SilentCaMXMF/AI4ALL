import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import {
  handleAsyncError,
  validateApiResponse,
  incrementRequestCounter
} from '../utils/error-handler.js';

interface OpenRouterModelPricing {
  prompt: string;
  completion: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: OpenRouterModelPricing;
  context_length: number;
  pricing_type?: 'free' | 'payg' | 'fixed';
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

export class OpenRouterAPI extends BasePlatformAPI {
  readonly platform: Platform = 'openrouter';
  readonly rateLimitPerHour = 60;

  constructor(private apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY;
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    return await handleAsyncError(async () => {
      const models = await this.fetchModels();
      
      // Filter for free models only
      const freeModels = models.filter(model => this.isFreeModel(model));
      
      const items = freeModels.map(model => this.normalizeModel(model));
      
      console.log(`[OpenRouter] ✓ Found ${items.length} free models`);
      
      return {
        items: items.slice(0, options.limit || 20),
        hasMore: false
      };
    }, this.platform, 'fetchItems');
  }

  private async fetchModels(): Promise<OpenRouterModel[]> {
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
        'https://openrouter.ai/api/v1/models',
        { headers }
      );
      
      const data = await validateApiResponse<OpenRouterResponse>(response, this.platform, 'fetchModels');
      incrementRequestCounter(this.platform, 'fetchModels');
      
      return data.data || [];
    }, this.platform, 'fetchModels');
  }

  private isFreeModel(model: OpenRouterModel): boolean {
    // Check pricing_type first
    if (model.pricing_type === 'free') {
      return true;
    }
    
    // If pricing exists and both are 0, it's free
    if (model.pricing) {
      const promptPrice = parseFloat(model.pricing.prompt || '0');
      const completionPrice = parseFloat(model.pricing.completion || '0');
      return promptPrice === 0 && completionPrice === 0;
    }
    
    return false;
  }

  private normalizeModel(model: OpenRouterModel): AggregatedItem {
    return {
      id: `openrouter-${model.id}`,
      platform: 'openrouter',
      type: 'model',
      title: model.name,
      content: model.description || '',
      author: {
        name: model.id.split('/')[0] || 'unknown',
        url: `https://openrouter.ai/models/${model.id}`
      },
      timestamp: new Date().toISOString(),
      url: `https://openrouter.ai/models/${model.id}`,
      metrics: {
        downloads: model.context_length
      },
      tags: ['openrouter', 'model', 'free'],
      raw: model
    };
  }
}