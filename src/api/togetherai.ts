import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import {
  handleAsyncError,
  validateApiResponse,
  incrementRequestCounter
} from '../utils/error-handler.js';

interface TogetherModel {
  id: string;
  display_name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    input: number;
    output: number;
  };
  architecture?: string;
  max_tokens?: number;
}

interface TogetherResponse {
  data: TogetherModel[];
}

export class TogetherAIAPI extends BasePlatformAPI {
  readonly platform: Platform = 'togetherai';
  readonly rateLimitPerHour = 60;

  constructor(private apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.TOGETHER_API_KEY;
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    return await handleAsyncError(async () => {
      const models = await this.fetchModels();
      
      // Filter for free or near-free models (pricing === 0 or null)
      const freeModels = models.filter(model => this.isFreeOrLowCost(model));
      
      const items = freeModels.map(model => this.normalizeModel(model));
      
      console.log(`[Together AI] ✓ Found ${items.length} free/affordable models`);
      
      return {
        items: items.slice(0, options.limit || 20),
        hasMore: false
      };
    }, this.platform, 'fetchItems');
  }

  private async fetchModels(): Promise<TogetherModel[]> {
    await this.rateLimit();
    
    const headers: Record<string, string> = {
      'User-Agent': 'FreeAI4ALL-Scraper/1.0',
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return await handleAsyncError(async () => {
      const response = await fetch(
        'https://api.together.xyz/v1/models',
        { headers }
      );
      
      const data = await validateApiResponse<TogetherResponse>(response, this.platform, 'fetchModels');
      incrementRequestCounter(this.platform, 'fetchModels');
      
      return data.data || [];
    }, this.platform, 'fetchModels');
  }

  private isFreeOrLowCost(model: TogetherModel): boolean {
    // Free if pricing is null, undefined, or both input and output are 0
    if (!model.pricing) {
      return true;
    }
    
    const inputPrice = model.pricing.input || 0;
    const outputPrice = model.pricing.output || 0;
    
    // Consider models with very low pricing (less than $0.10/1M tokens) as "free tier eligible"
    return inputPrice === 0 && outputPrice === 0;
  }

  private normalizeModel(model: TogetherModel): AggregatedItem {
    return {
      id: `togetherai-${model.id}`,
      platform: 'togetherai',
      type: 'model',
      title: model.display_name || model.id,
      content: model.description || `Context length: ${model.context_length?.toLocaleString() || 'N/A'} tokens`,
      author: {
        name: model.id.split('/')[0] || 'together',
        url: `https://together.ai/models/${model.id}`
      },
      timestamp: new Date().toISOString(),
      url: `https://together.ai/models/${model.id}`,
      metrics: {
        downloads: model.context_length
      },
      tags: ['togetherai', 'model', 'inference'],
      raw: model
    };
  }
}