import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import {
  handleAsyncError,
  validateApiResponse,
  incrementRequestCounter
} from '../utils/error-handler.js';

interface GroqModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  context_window: number;
}

interface GroqResponse {
  data: GroqModel[];
}

export class GroqAPI extends BasePlatformAPI {
  readonly platform: Platform = 'groq';
  readonly rateLimitPerHour = 30;

  constructor(private apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.GROQ_API_KEY;
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    return await handleAsyncError(async () => {
      const models = await this.fetchModels();
      
      // Filter for known free models
      const freeModels = models.filter(model => this.isFreeModel(model));
      
      const items = freeModels.map(model => this.normalizeModel(model));
      
      console.log(`[Groq] ✓ Found ${items.length} free models`);
      
      return {
        items: items.slice(0, options.limit || 20),
        hasMore: false
      };
    }, this.platform, 'fetchItems');
  }

  private async fetchModels(): Promise<GroqModel[]> {
    await this.rateLimit();
    
    return await handleAsyncError(async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(
        'https://api.groq.com/openai/v1/models',
        { headers }
      );
      
      const data = await validateApiResponse<GroqResponse>(response, this.platform, 'fetchModels');
      incrementRequestCounter(this.platform, 'fetchModels');
      
      return data.data || [];
    }, this.platform, 'fetchModels');
  }

  private isFreeModel(model: GroqModel): boolean {
    // Filter for known free models like llama-3.3-70b or models with 'free' in id
    return model.id.includes('free') || model.id.includes('llama-3.3-70b');
  }

  private normalizeModel(model: GroqModel): AggregatedItem {
    return {
      id: `groq-${model.id}`,
      platform: 'groq',
      type: 'model',
      title: model.id,
      content: `Context window: ${model.context_window} tokens`,
      author: {
        name: model.owned_by || 'groq'
      },
      timestamp: new Date(model.created * 1000).toISOString(),
      url: `https://console.groq.com/models/${model.id}`,
      metrics: {
        views: model.context_window
      },
      tags: ['free', 'fast'],
      raw: model
    };
  }
}