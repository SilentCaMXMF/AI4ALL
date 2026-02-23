#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';
import { createHeader, createSummary, createTimestampedLog } from './src/utils/console-utils.js';
import { ModelsDevService } from './src/services/models-dev-service.js';

// Load environment variables
config();

// Simple scraper that fetches from APIs that don't require auth or have minimal requirements

async function fetchModelsDev() {
  console.log('[Scraper] Fetching from Models.dev...');
  
  try {
    const service = new ModelsDevService();
    const items = await service.fetchItems({
      filterType: 'simple',
      searchTerms: ['opencode', 'zen'],
      freeOnly: false // Include all models for simple scraper
    });

    console.log(`[Scraper] Found ${items.length} models from Models.dev`);
    return items;
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
  createHeader('Social Media Aggregator - Data Scraper', '1.0');

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
    
    const platformStats = {};
    for (const item of allItems) {
      platformStats[item.platform] = (platformStats[item.platform] || 0) + 1;
    }
    
    const summaryItems = Object.entries(platformStats).map(([platform, count]) => ({
      platform,
      count,
      status: 'success'
    }));
    
    createSummary(summaryItems, 'Total');
    createTimestampedLog('Main', 'Data saved to data/aggregated-data.json', 'success');
    
  } catch (error) {
    createTimestampedLog('Main', `Fatal error: ${error}`, 'error');
    process.exit(1);
  }
}

main();
