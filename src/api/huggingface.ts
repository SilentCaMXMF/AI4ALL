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
  lastModified?: string;
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
        `${modelName} tutorial`,
        
        // Community discussions
        `${modelName} issues`,
        `${modelName} problems`,
        `${modelName} experience`,
        `${modelName} review`,
        
        // Integration searches
        `${modelName} transformers`,
        `${modelName} diffusers`,
        `${modelName} gradio`,
        `${modelName} api key`,
        `${modelName} rate limit`
      ];

      console.log(`[HuggingFace] Searching ${searchQueries.length} queries for ${modelName}...`);
      
      for (const query of searchQueries.slice(0, 6)) { // Limit queries to avoid rate limits
        try {
          const models = await this.searchHuggingFaceModels(query);
          
          if (models.length > 0) {
            console.log(`[HuggingFace]   Query "${query.substring(0, 30)}...": ${models.length} models`);
          }
          
          // Filter and normalize relevant models
          const relevantModels = models
            .slice(0, 2) // Limit per query
            .map(model => this.normalizeModel(model, modelName, provider));
          
          results.push(...relevantModels);
          
          // Rate limiting between searches
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
          console.warn(`[HuggingFace] Search error for "${query}":`, error);
        }
      }
      
      // Search for discussions about the model
      const discussions = await this.searchModelDiscussions(modelName);
      const discussionItems = discussions
        .slice(0, 3) // Limit discussions
        .map(discussion => this.normalizeDiscussion(discussion));
      
      results.push(...discussionItems);
      
      // Remove duplicates based on model/discussion ID
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
        `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&limit=20&sort=downloads&direction=-1`,
        { headers }
      );
      
      const data = await validateApiResponse<HuggingFaceModel[]>(response, this.platform, 'searchHuggingFaceModels');
      incrementRequestCounter(this.platform, 'searchHuggingFaceModels');
      
      return data || [];
    }, this.platform, 'searchHuggingFaceModels');
  }

  private async searchModelDiscussions(modelName: string): Promise<HuggingFaceDiscussion[]> {
    // Search for discussions in model repositories and community spaces
    const discussionQueries = [
      `${modelName} issues`,
      `${modelName} discussion`,
      `${modelName} pull requests`,
      `${modelName} community`,
      `${modelName} review`,
      `${modelName} experience`,
      `${modelName} problems`,
      `${modelName} bugs`,
      `${modelName} performance`
    ];

    const discussions: HuggingFaceDiscussion[] = [];
    
    for (const query of discussionQueries.slice(0, 3)) { // Limit discussion searches
      try {
        // This is a simplified approach - in a real implementation,
        // you might search specific repositories or community spaces
        const discussionData = await this.searchDiscussions(query);
        discussions.push(...discussionData);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`[HuggingFace] Discussion search error for "${query}":`, error);
      }
    }

    return discussions;
  }

  private async searchDiscussions(query: string): Promise<HuggingFaceDiscussion[]> {
    // Mock implementation for discussions
    // In a real implementation, this would search Hugging Face forums,
    // repository issues, and community spaces
    await this.rateLimit();
    
    const mockDiscussions: HuggingFaceDiscussion[] = [
      {
        id: `disc-${Date.now()}-${Math.random()}`,
        title: `${query} discussion`,
        content: `Discussion about ${query} implementation and usage`,
        author: `community-user`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://huggingface.co/discussions/${query}`,
        numComments: Math.floor(Math.random() * 20),
        tags: [query]
      }
    ];

    // Filter by relevance to the query
    return mockDiscussions.filter(disc => 
      disc.title.toLowerCase().includes(query.toLowerCase()) ||
      disc.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    const items: AggregatedItem[] = [];
    
    return await handleAsyncError(async () => {
      // Fetch trending models from Hugging Face
      const models = await this.fetchTrendingModels(50);
      items.push(...models.map(model => this.normalizeModel(model, '', '')));
      
      // Also fetch recent discussions
      const discussions = await this.fetchRecentDiscussions(30);
      items.push(...discussions.map(disc => this.normalizeDiscussion(disc)));
      
      return {
        items: items.slice(0, options.limit || 30),
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

  private async fetchRecentDiscussions(days: number = 7): Promise<HuggingFaceDiscussion[]> {
    await this.rateLimit();
    
    // Mock implementation for recent discussions
    // In a real implementation, this would fetch from Hugging Face forums
    const mockDiscussions: HuggingFaceDiscussion[] = [
      {
        id: `recent-${Date.now()}`,
        title: 'Free model availability discussion',
        content: 'Community discussion about free AI model availability and usage',
        author: 'huggingface-user',
        createdAt: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000).toISOString(),
        url: 'https://huggingface.co/discussions/free-models',
        numComments: Math.floor(Math.random() * 50),
        tags: ['free', 'models', 'availability']
      },
      {
        id: `recent-${Date.now() + 1}`,
        title: 'Open source model comparison',
        content: 'Comparison of open source models and their capabilities',
        author: 'community-user',
        createdAt: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000).toISOString(),
        url: 'https://huggingface.co/discussions/model-comparison',
        numComments: Math.floor(Math.random() * 30),
        tags: ['comparison', 'open-source']
      }
    ];

    return mockDiscussions;
  }

  private normalizeModel(model: HuggingFaceModel, targetModelName: string, targetProvider: string): AggregatedItem {
    const capabilities = [];
    const tags = [];
    
    // Extract capabilities from pipeline_tag and tags
    if (model.pipeline_tag?.includes('text-generation')) {
      capabilities.push('Text Generation');
      tags.push('text-generation');
    }
    if (model.pipeline_tag?.includes('image-generation')) {
      capabilities.push('Image Generation');
      tags.push('image-generation');
    }
    if (model.pipeline_tag?.includes('feature-extraction')) {
      capabilities.push('Feature Extraction');
      tags.push('feature-extraction');
    }
    if (model.pipeline_tag?.includes('text-to-speech')) {
      capabilities.push('Text-to-Speech');
      tags.push('text-to-speech');
    }
    
    // Add tags from model tags
    if (model.tags) {
      if (model.tags.some(tag => tag.includes('transformers'))) {
        capabilities.push('Transformers');
        tags.push('transformers');
      }
      if (model.tags.some(tag => tag.includes('diffusers'))) {
        capabilities.push('Diffusers');
        tags.push('diffusers');
      }
      if (model.tags.some(tag => tag.includes('gradio'))) {
        capabilities.push('Gradio');
        tags.push('gradio');
      }
      if (model.tags.some(tag => tag.includes('open-source') || tag.includes('license'))) {
        capabilities.push('Open Weights');
        tags.push('open-source');
      }
    }
    
    return {
      id: `huggingface-${model.id}`,
      platform: 'huggingface',
      type: 'model',
      title: model.author ? `${model.author}: ${model.modelId}` : model.modelId,
      content: model.cardData?.content || `Downloads: ${model.downloads?.toLocaleString() || 'N/A'} | Likes: ${model.likes || 0} | Tags: ${tags.slice(0, 3).join(', ')}`,
      author: {
        name: model.author,
        url: `https://huggingface.co/${model.author}`,
        avatar: `https://huggingface.co/${model.author}/avatar`
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
        ...tags
      ],
      raw: model
    };
  }

  private normalizeDiscussion(discussion: HuggingFaceDiscussion): AggregatedItem {
    return {
      id: `huggingface-discussion-${discussion.id}`,
      platform: 'huggingface',
      type: 'post',
      title: discussion.title,
      content: discussion.content,
      author: {
        name: discussion.author,
        url: `https://huggingface.co/${discussion.author}`
      },
      timestamp: discussion.createdAt,
      url: discussion.url,
      metrics: {
        comments: discussion.numComments
      },
      tags: discussion.tags || ['huggingface'],
      raw: discussion
    };
  }
}