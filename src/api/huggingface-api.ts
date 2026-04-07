import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import {
  handleAsyncError,
  validateApiResponse,
  incrementRequestCounter
} from '../utils/error-handler.js';

interface HFInferenceModel {
  id: string;
  modelId: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag: string;
  createdAt: string;
  lastModified?: string;
  private?: boolean;
  gated?: boolean;
}

export class HuggingFaceInferenceAPI extends BasePlatformAPI {
  readonly platform: Platform = 'huggingface';
  readonly rateLimitPerHour = 1000;
  
  private token?: string;

  constructor(config: { token?: string } = {}) {
    super();
    this.token = config.token || process.env.HUGGING_FACE_TOKEN;
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    return await handleAsyncError(async () => {
      const models = await this.fetchTopModels();
      
      // Filter for models that have free inference API available
      const freeModels = models.filter(model => this.isFreeTierEligible(model));
      
      const items = freeModels.map(model => this.normalizeModel(model));
      
      console.log(`[HuggingFace Inference] ✓ Found ${items.length} free tier eligible models`);
      
      return {
        items: items.slice(0, options.limit || 30),
        hasMore: false
      };
    }, this.platform, 'fetchItems');
  }

  private async fetchTopModels(): Promise<HFInferenceModel[]> {
    await this.rateLimit();
    
    const headers: Record<string, string> = {
      'User-Agent': 'FreeAI4ALL-Scraper/1.0'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return await handleAsyncError(async () => {
      // Fetch top models sorted by downloads
      const response = await fetch(
        'https://huggingface.co/api/models?sort=downloads&direction=-1&limit=100',
        { headers }
      );
      
      const data = await validateApiResponse<HFInferenceModel[]>(response, this.platform, 'fetchTopModels');
      incrementRequestCounter(this.platform, 'fetchTopModels');
      
      return data || [];
    }, this.platform, 'fetchTopModels');
  }

  private isFreeTierEligible(model: HFInferenceModel): boolean {
    // Filter out gated/private models as they may not have free tier
    if (model.gated || model.private) {
      return false;
    }
    
    // Focus on popular model types that typically have free inference
    const freeTierPipelines = [
      'text-generation',
      'text-to-image',
      'automatic-speech-recognition',
      'text-to-speech',
      'translation',
      'feature-extraction',
      'sentence-similarity'
    ];
    
    return freeTierPipelines.includes(model.pipeline_tag) || model.downloads > 10000;
  }

  private normalizeModel(model: HFInferenceModel): AggregatedItem {
    return {
      id: `huggingface-inference-${model.id}`,
      platform: 'huggingface',
      type: 'model',
      title: model.author ? `${model.author}/${model.modelId}` : model.modelId,
      content: `Pipeline: ${model.pipeline_tag} | Downloads: ${model.downloads?.toLocaleString() || 'N/A'} | Likes: ${model.likes || 0}`,
      author: {
        name: model.author,
        url: `https://huggingface.co/${model.author}`
      },
      timestamp: model.lastModified || model.createdAt || new Date().toISOString(),
      url: `https://huggingface.co/${model.author}/${model.modelId}`,
      metrics: {
        stars: model.likes || 0,
        downloads: model.downloads || 0
      },
      tags: ['huggingface', 'inference-api', model.pipeline_tag || 'unknown'],
      raw: model
    };
  }
}