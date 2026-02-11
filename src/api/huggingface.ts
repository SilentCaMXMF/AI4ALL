import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import { 
  handleAsyncError, 
  createPlatformError, 
  logPlatformError,
  validateApiResponse,
  incrementRequestCounter
} from '../utils/error-handler.js';

interface HuggingFaceModel {
  id: string;
  modelId: string;
  author: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag: string;
  createdAt: string;
  modelId?: string;
  tags: string[];
  siblings?: any[];
  cardData?: {
    content: string;
  };
}

interface HuggingFaceDiscussion {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  url: string;
  numComments: number;
  tags?: string[];
}

export class HuggingFaceAPI extends BasePlatformAPI {
  readonly platform: Platform = 'huggingface';
  readonly rateLimitPerHour = 1000;
  
  private token?: string;
  
  constructor(config: { token?: string } = {}) {
    super();
    this.token = config.token;
  }

  async searchForModel(modelName: string, provider: string): Promise<AggregatedItem[]> {
    return await handleAsyncError(async () => {
      const results: AggregatedItem[] = [];
      
      // Enhanced search queries for Hugging Face
      const searchQueries = [
        // Direct model searches
        `"${modelName}"`,
        `${modelName} ${provider}`,
        
        // Model family searches
        `${modelName} family`,
        `${modelName} series`,
        
        // Capability searches
        `${modelName} inference`,
        `${modelName} API`,
        `${modelName} deployment`,
        
        // Open source searches
        `open source ${modelName}`,
        `${modelName} weights`,
        
        // Provider searches
        `${provider} ${modelName} model`,
        `${provider} models`,
        
        // General searches
        `free ${modelName}`,
        `${modelName} demo`,
        `${modelName} tutorial`
      ];

      console.log(`[HuggingFace] Searching ${searchQueries.length} queries for ${modelName}...`);
      
      for (const query of searchQueries.slice(0, 8)) { // Limit queries
        try {
          const models = await this.searchHuggingFaceModels(query);
          
          if (models.length > 0) {
            console.log(`[HuggingFace]   Query "${query.substring(0, 30)}...": ${models.length} models`);
          }
          
          // Filter and normalize relevant models
          const relevantModels = models
            .slice(0, 3) // Limit per query
            .filter(model => {
              // Basic relevance check
              const name = model.modelId.toLowerCase();
              const description = (model.cardData?.content || '').toLowerCase();
              const author = model.author.toLowerCase();
              const searchTerm = query.toLowerCase();
              
              // Name, description, or author must mention search terms
              return name.includes(searchTerm) || 
                     description.includes(searchTerm) || 
                     author.includes(searchTerm);
            })
            .map(model => this.normalizeModel(model));
          
          results.push(...relevantModels);
          
          // Rate limiting between searches
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`[HuggingFace] Search error for "${query}":`, error);
        }
      }
      
      // Remove duplicates based on model ID
      const uniqueResults = results.filter((item, index, array) => 
        array.findIndex(i => i.id === item.id) === index
      );
      
      console.log(`[HuggingFace] ✓ Found ${uniqueResults.length} unique results for ${modelName}`);
      return uniqueResults;
    }, this.platform, 'searchForModel', []);
  }

  private async searchHuggingFaceModels(query: string): Promise<HuggingFaceModel[]> {
    await this.rateLimit();
    
    const headers: Record<string, string> = {
      'User-Agent': 'FreeAI4ALL-Scraper/1.0'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return await handleAsyncError(async () => {
      const response = await fetch(
        `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&limit=10&sort=downloads&direction=-1`,
        { headers }
      );
      
      const data = await validateApiResponse<HuggingFaceModel[]>(response, this.platform, 'searchHuggingFaceModels');
      incrementRequestCounter(this.platform, 'searchHuggingFaceModels');
      
      return data || [];
    }, this.platform, 'searchHuggingFaceModels');
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    const items: AggregatedItem[] = [];
    
    return await handleAsyncError(async () => {
      // Fetch trending models from Hugging Face
      const models = await this.fetchTrendingModels(50);
      items.push(...models.map(model => this.normalizeModel(model)));
      
      return {
        items: items.slice(0, options.limit || 20),
        hasMore: false
      };
    }, this.platform, 'fetchItems');
  }

  private async fetchTrendingModels(limit: number = 30): Promise<HuggingFaceModel[]> {
    await this.rateLimit();
    
    const headers: Record<string, string> = {
      'User-Agent': 'FreeAI4ALL-Scraper/1.0'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return await handleAsyncError(async () => {
      const response = await fetch(
        `https://huggingface.co/api/models?sort=downloads&direction=-1&limit=${limit}`,
        { headers }
      );
      
      const data = await validateApiResponse<HuggingFaceModel[]>(response, this.platform, 'fetchTrendingModels');
      incrementRequestCounter(this.platform, 'fetchTrendingModels');
      
      return data || [];
    }, this.platform, 'fetchTrendingModels');
  }

  private normalizeModel(model: HuggingFaceModel): AggregatedItem {
    const capabilities = [];
    const tags = [];
    
    // Extract capabilities from tags and pipeline_tag
    if (model.pipeline_tag?.includes('text-generation')) {
      capabilities.push('Text Generation');
      tags.push('text-generation');
    }
    if (model.pipeline_tag?.includes('image-generation')) {
      capabilities.push('Image Generation');
      tags.push('image-generation');
    }
    if (model.tags?.includes('transformers')) {
      capabilities.push('Transformers');
      tags.push('transformers');
    }
    
    // Add open weights indicator
    if (model.tags?.some(tag => tag.includes('open-source') || tag.includes('license'))) {
      capabilities.push('Open Weights');
    }
    
    return {
      id: `huggingface-${model.id}`,
      platform: 'huggingface',
      type: 'model',
      title: `${model.author}: ${model.modelId}`,
      content: model.cardData?.content || `Downloads: ${model.downloads?.toLocaleString() || 'N/A'} | Likes: ${model.likes || 0}`,
      author: {
        name: model.author,
        url: `https://huggingface.co/${model.author}`
      },
      timestamp: model.createdAt || new Date().toISOString(),
      url: `https://huggingface.co/${model.author}/${model.modelId}`,
      metrics: {
        stars: model.likes || 0,
        forks: model.downloads || 0,
        downloads: model.downloads || 0
      },
      tags: [
        'huggingface',
        model.pipeline_tag || 'unknown',
        ...tags,
        ...capabilities
      ],
      raw: model
    };
  }
}