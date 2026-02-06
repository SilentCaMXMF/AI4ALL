#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Simple scraper that fetches from APIs that don't require auth or have minimal requirements

async function fetchModelsDev() {
  console.log('[Scraper] Fetching from Models.dev...');
  
  try {
    const response = await fetch('https://models.dev/api.json', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SocialMediaAggregator/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Models.dev API error: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Handle both array and object responses
    const models = Array.isArray(responseData) ? responseData : 
                   (responseData.models || responseData.data || []);
    
    if (!Array.isArray(models)) {
      console.log('[Scraper] Models.dev response:', JSON.stringify(responseData).substring(0, 200));
      throw new Error('Unexpected response format from Models.dev');
    }
    
    // Filter for opencode/zen related models
    const relevantModels = models.filter((model) => {
      const searchString = `${model.provider || ''} ${model.providerId || ''} ${model.name || ''} ${model.modelId || ''}`.toLowerCase();
      return ['opencode', 'zen'].some(term => searchString.includes(term));
    });

    console.log(`[Scraper] Found ${relevantModels.length} models from Models.dev`);

    return relevantModels.map((model) => {
      const costInfo = [];
      if (model.inputCost !== undefined) costInfo.push(`Input: $${model.inputCost}/1M tokens`);
      if (model.outputCost !== undefined) costInfo.push(`Output: $${model.outputCost}/1M tokens`);
      
      const capabilities = [];
      if (model.toolCall) capabilities.push('Tool Calling');
      if (model.reasoning) capabilities.push('Reasoning');

      return {
        id: `modelsdev-${model.id || `${model.providerId}-${model.modelId}`}`,
        platform: 'modelsdev',
        type: 'model',
        title: `${model.provider}: ${model.name || model.modelId}`,
        content: `Pricing: ${costInfo.join(' | ')}${capabilities.length > 0 ? ` | Capabilities: ${capabilities.join(', ')}` : ''}${model.contextLimit ? ` | Context: ${model.contextLimit.toLocaleString()} tokens` : ''}`,
        author: {
          name: model.provider,
          url: `https://models.dev/?search=${encodeURIComponent(model.providerId)}`
        },
        timestamp: model.lastUpdated || new Date().toISOString(),
        url: `https://models.dev/?search=${encodeURIComponent(model.providerId)}&model=${encodeURIComponent(model.modelId)}`,
        metrics: {
          inputCost: model.inputCost,
          outputCost: model.outputCost,
          contextLimit: model.contextLimit
        },
        tags: [model.providerId, ...(model.family ? [model.family] : []), ...capabilities]
      };
    });
  } catch (error) {
    console.error('[Scraper] Error fetching from Models.dev:', error);
    return [];
  }
}

async function fetchStackOverflow() {
  console.log('[Scraper] Fetching from Stack Overflow...');
  
  try {
    const tags = ['javascript', 'typescript', 'react', 'node.js'];
    const allItems = [];
    
    for (const tag of tags.slice(0, 2)) {
      const response = await fetch(
        `https://api.stackexchange.com/2.3/questions?order=desc&sort=creation&tagged=${tag}&site=stackoverflow&pagesize=10`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SocialMediaAggregator/1.0'
          }
        }
      );

      if (!response.ok) {
        console.warn(`[Scraper] Stack Overflow API error for tag ${tag}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.items) {
        const items = data.items.map((q) => ({
          id: `stackoverflow-${q.question_id}`,
          platform: 'stackoverflow',
          type: 'question',
          title: q.title,
          content: '',
          author: {
            name: q.owner.display_name || 'Anonymous',
            url: q.owner.link,
            avatar: q.owner.profile_image
          },
          timestamp: new Date(q.creation_date * 1000).toISOString(),
          url: q.link,
          metrics: {
            score: q.score,
            views: q.view_count,
            answers: q.answer_count
          },
          tags: q.tags
        }));
        
        allItems.push(...items);
      }
    }

    console.log(`[Scraper] Found ${allItems.length} questions from Stack Overflow`);
    return allItems;
  } catch (error) {
    console.error('[Scraper] Error fetching from Stack Overflow:', error);
    return [];
  }
}

async function fetchGitHub() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log('[Scraper] No GitHub token found, skipping...');
    return [];
  }
  
  console.log('[Scraper] Fetching from GitHub...');
  
  try {
    const searchQueries = ['free AI models', 'open source LLM', 'opencode'];
    const allItems = [];
    
    for (const query of searchQueries.slice(0, 2)) {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=10`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'SocialMediaAggregator'
          }
        }
      );

      if (!response.ok) {
        console.warn(`[Scraper] GitHub API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.items) {
        const items = data.items.map((repo) => ({
          id: `github-repo-${repo.id}`,
          platform: 'github',
          type: 'repository',
          title: repo.name,
          content: repo.description || '',
          author: {
            name: repo.owner.login,
            url: repo.owner.html_url,
            avatar: repo.owner.avatar_url
          },
          timestamp: repo.updated_at,
          url: repo.html_url,
          metrics: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count
          },
          tags: repo.language ? [repo.language] : []
        }));
        
        allItems.push(...items);
      }
    }

    console.log(`[Scraper] Found ${allItems.length} repositories from GitHub`);
    return allItems;
  } catch (error) {
    console.error('[Scraper] Error fetching from GitHub:', error);
    return [];
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Social Media Aggregator - Data Scraper v1.0       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();

  try {
    // Ensure data directory exists
    await mkdir('data', { recursive: true });
    
    // Fetch from all sources
    const results = await Promise.all([
      fetchModelsDev(),
      fetchStackOverflow(),
      fetchGitHub()
    ]);
    
    const allItems = results.flat();
    
    // Save aggregated data
    const data = {
      lastUpdated: new Date().toISOString(),
      itemCount: allItems.length,
      items: allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    };
    
    await writeFile(
      join('data', 'aggregated-data.json'),
      JSON.stringify(data, null, 2)
    );
    
    console.log();
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                    SCRAPE SUMMARY                      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    
    const platformStats = {};
    for (const item of allItems) {
      platformStats[item.platform] = (platformStats[item.platform] || 0) + 1;
    }
    
    for (const [platform, count] of Object.entries(platformStats)) {
      console.log(`║ ✅ ${platform.padEnd(15)} ${count.toString().padStart(3)} items          ║`);
    }
    
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total: ${allItems.length.toString().padStart(3)} items${' '.repeat(33)}║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log();
    console.log('[Main] ✅ Data saved to data/aggregated-data.json');
    
  } catch (error) {
    console.error('[Main] ❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
