import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';
import { 
  handleAsyncError, 
  createPlatformError, 
  logPlatformError,
  validateApiResponse,
  incrementRequestCounter
} from '../utils/error-handler.js';

interface HackerNewsStory {
  id: string;
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
  descendants: number; // Number of comments
}

interface HackerNewsSearchResult {
  hits: Array<{
    objectID: string;
    title: string;
    url: string;
    points: number;
    author: string;
    created_at_i: number;
    comment_text?: string;
    story_text?: string;
    _tags: string[];
  }>;
}

export class HackerNewsAPI extends BasePlatformAPI {
  readonly platform: Platform = 'hackernews';
  readonly rateLimitPerHour = 1000;
  
  constructor(config: { apiKey?: string } = {}) {
    super();
  }

  async searchForModel(modelName: string, provider: string): Promise<AggregatedItem[]> {
    return await handleAsyncError(async () => {
      const results: AggregatedItem[] = [];
      
      // Enhanced search queries for Hacker News
      const searchQueries = [
        // Direct model searches
        `"${modelName}"`,
        `${modelName} ${provider}`,
        
        // API and pricing searches
        `"${modelName}" API`,
        `"${modelName}" free API`,
        `"${modelName}" pricing`,
        `${provider} ${modelName} API`,
        
        // General AI searches
        `free AI models`,
        `LLM API free`,
        `${provider} API free`,
        
        // Open source searches
        `open source AI`,
        `${modelName} open source`
      ];

      console.log(`[HackerNews] Searching ${searchQueries.length} queries for ${modelName}...`);
      
      for (const query of searchQueries.slice(0, 6)) { // Limit queries
        try {
          const stories = await this.searchHackerNews(query);
          
          if (stories.length > 0) {
            console.log(`[HackerNews]   Query "${query.substring(0, 30)}...": ${stories.length} results`);
          }
          
          // Filter and normalize relevant stories
          const relevantStories = stories
            .slice(0, 2) // Limit per query
            .map(story => this.normalizeStory(story));
          
          results.push(...relevantStories);
          
          // Rate limiting between searches
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`[HackerNews] Search error for "${query}":`, error);
        }
      }
      
      // Remove duplicates based on story ID
      const uniqueResults = results.filter((item, index, array) => 
        array.findIndex(i => i.id === item.id) === index
      );
      
      console.log(`[HackerNews] ✓ Found ${uniqueResults.length} unique results for ${modelName}`);
      return uniqueResults;
    }, this.platform, 'searchForModel');
  }

  private async searchHackerNews(query: string): Promise<HackerNewsStory[]> {
    await this.rateLimit();
    
    return await handleAsyncError(async () => {
      // Use Algolia Hacker News Search API
      const response = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`,
        {
          headers: {
            'User-Agent': 'FreeAI4ALL-Scraper/1.0'
          }
        }
      );
      
      const data = await validateApiResponse<HackerNewsSearchResult>(response, this.platform, 'searchHackerNews');
      incrementRequestCounter(this.platform, 'searchHackerNews');
      
      return data.hits.map(hit => ({
        id: hit.objectID,
        title: hit.title,
        url: hit.url,
        score: hit.points,
        by: hit.author,
        time: hit.created_at_i,
        descendants: 0 // Comments count not available in search
      }));
    }, this.platform, 'searchHackerNews');
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    const items: AggregatedItem[] = [];
    
    return await handleAsyncError(async () => {
      // Fetch top stories from Hacker News
      const stories = await this.fetchTopStories(50);
      items.push(...stories.map(story => this.normalizeStory(story)));
      
      return {
        items: items.slice(0, options.limit || 20),
        hasMore: false
      };
    }, this.platform, 'fetchItems');
  }

  private async fetchTopStories(limit: number = 30): Promise<HackerNewsStory[]> {
    await this.rateLimit();
    
    return await handleAsyncError(async () => {
      const response = await fetch(
        `https://hacker-news.firebaseio.com/v0/topstories.json?limit=${limit}`,
        {
          headers: {
            'User-Agent': 'FreeAI4ALL-Scraper/1.0'
          }
        }
      );
      
      const storyIds = await validateApiResponse<number[]>(response, this.platform, 'fetchTopStories');
      
      // Fetch details for each story
      const stories: HackerNewsStory[] = [];
      for (const id of storyIds) {
        try {
          const storyResponse = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
            {
              headers: {
                'User-Agent': 'FreeAI4ALL-Scraper/1.0'
              }
            }
          );
          
          const story = await validateApiResponse<HackerNewsStory>(storyResponse, this.platform, 'fetchStoryDetails');
          if (story) {
            stories.push(story);
          }
        } catch (error) {
          console.warn(`[HackerNews] Error fetching story ${id}:`, error);
        }
        
        // Rate limiting between story fetches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return stories;
    }, this.platform, 'fetchTopStories');
  }

  private normalizeStory(story: HackerNewsStory): AggregatedItem {
    return {
      id: `hackernews-${story.id}`,
      platform: 'hackernews',
      type: 'post',
      title: story.title,
      content: '', // Hacker News doesn't have content in search results
      author: {
        name: story.by,
        url: `https://news.ycombinator.com/user?id=${story.by}`
      },
      timestamp: new Date(story.time * 1000).toISOString(),
      url: story.url,
      metrics: {
        upvotes: story.score,
        comments: story.descendants
      },
      tags: ['hackernews'],
      raw: story
    };
  }
}