import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import {
  handleAsyncError,
  validateApiResponse,
  incrementRequestCounter
} from '../utils/error-handler.js';

interface ReplicateModel {
  name: string;
  owner?: string;
  description?: string;
  visibility?: 'public' | 'private';
  github_url?: string;
  paper_url?: string;
  latest_version?: {
    created_at: string;
    cog_version?: string;
  };
}

interface ReplicateResponse {
  models: ReplicateModel[];
  next?: string;
}

export class ReplicateAPI extends BasePlatformAPI {
  readonly platform: Platform = 'replicate';
  readonly rateLimitPerHour = 60;

  constructor(private apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.REPLICATE_API_KEY;
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    return await handleAsyncError(async () => {
      const models = await this.fetchModels();
      
      const items = models.map(model => this.normalizeModel(model));
      
      console.log(`[Replicate] ✓ Found ${items.length} models`);
      
      return {
        items: items.slice(0, options.limit || 20),
        hasMore: false
      };
    }, this.platform, 'fetchItems');
  }

  private async fetchModels(): Promise<ReplicateModel[]> {
    await this.rateLimit();
    
    const headers: Record<string, string> = {
      'User-Agent': 'FreeAI4ALL-Scraper/1.0',
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return await handleAsyncError(async () => {
      // Replicate uses HuggingFace gateway for their API
      const response = await fetch(
        'https://gateway.hf.ai/api/v1/models?sort=popular&limit=50',
        { headers }
      );
      
      const data = await validateApiResponse<ReplicateResponse>(response, this.platform, 'fetchModels');
      incrementRequestCounter(this.platform, 'fetchModels');
      
      return data.models || [];
    }, this.platform, 'fetchModels');
  }

  private normalizeModel(model: ReplicateModel): AggregatedItem {
    const owner = model.owner || 'unknown';
    const name = model.name;
    
    return {
      id: `replicate-${owner}/${name}`,
      platform: 'replicate',
      type: 'model',
      title: `${owner}/${name}`,
      content: model.description || `Deployed on Replicate`,
      author: {
        name: owner,
        url: `https://replicate.com/${owner}`
      },
      timestamp: model.latest_version?.created_at || new Date().toISOString(),
      url: `https://replicate.com/${owner}/${name}`,
      metrics: {},
      tags: ['replicate', 'model', 'inference'],
      raw: model
    };
  }
}