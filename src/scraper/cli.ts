#!/usr/bin/env node

import { ScraperService, ScraperConfig } from './index.js';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface ConfigFile {
  github?: {
    token: string;
    username?: string;
    orgs?: string[];
  };
  reddit?: {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    subreddits?: string[];
  };
  stackoverflow?: {
    key?: string;
    tags?: string[];
  };
  discord?: {
    token: string;
    channels?: string[];
  };
  x?: {
    bearerToken: string;
  };
}

async function loadConfig(): Promise<ScraperConfig> {
  const config: ScraperConfig = {};

  // Load from environment variables
  if (process.env.GITHUB_TOKEN) {
    config.github = {
      token: process.env.GITHUB_TOKEN,
      username: process.env.GITHUB_USERNAME,
      orgs: process.env.GITHUB_ORGS?.split(',') || []
    };
  }

  if (process.env.REDDIT_CLIENT_ID) {
    config.reddit = {
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
      username: process.env.REDDIT_USERNAME || '',
      password: process.env.REDDIT_PASSWORD || '',
      subreddits: process.env.REDDIT_SUBREDDITS?.split(',') || ['programming', 'webdev']
    };
  }

  config.stackoverflow = {
    key: process.env.STACKOVERFLOW_KEY,
    tags: process.env.STACKOVERFLOW_TAGS?.split(',') || ['javascript', 'typescript', 'react']
  };

  if (process.env.DISCORD_TOKEN) {
    config.discord = {
      token: process.env.DISCORD_TOKEN,
      channels: process.env.DISCORD_CHANNELS?.split(',') || []
    };
  }

  if (process.env.X_BEARER_TOKEN) {
    config.x = {
      bearerToken: process.env.X_BEARER_TOKEN,
      searchQueries: process.env.X_SEARCH_QUERIES?.split(',') || ['javascript', 'webdev']
    };
  }

  // Override platforms if specified
  if (process.env.PLATFORMS && process.env.PLATFORMS !== 'all') {
    config.platforms = process.env.PLATFORMS.split(',').map(p => p.trim());
  }

  return config;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Social Media Aggregator - Data Scraper v1.0       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();

  try {
    const config = await loadConfig();
    const scraper = new ScraperService(config);

    console.log('[Main] Available platforms:', scraper.getAvailablePlatforms().join(', ') || 'None configured');
    console.log();

    if (scraper.getAvailablePlatforms().length === 0) {
      console.error('[Main] ❌ No platforms configured. Please set environment variables.');
      console.log();
      console.log('Required environment variables:');
      console.log('  GITHUB_TOKEN - GitHub Personal Access Token');
      console.log('  REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD');
      console.log('  DISCORD_TOKEN - Discord Bot Token');
      console.log('  X_BEARER_TOKEN - X (Twitter) Bearer Token');
      process.exit(1);
    }

    // Parse command line arguments
    const args = process.argv.slice(2);
    let platforms: string[] | undefined;
    
    const platformsIndex = args.indexOf('--platforms');
    if (platformsIndex !== -1 && args[platformsIndex + 1]) {
      platforms = args[platformsIndex + 1].split(',').map(p => p.trim());
    }

    console.log('[Main] Starting scrape...');
    console.log();

    const startTime = Date.now();
    const results = await scraper.scrapeAll({ limit: 50 });
    const duration = (Date.now() - startTime) / 1000;

    console.log();
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                    SCRAPE SUMMARY                      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    
    let totalItems = 0;
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      const itemCount = result.items.length.toString().padStart(3);
      console.log(`║ ${status} ${result.platform.padEnd(15)} ${itemCount} items          ║`);
      totalItems += result.items.length;
      
      if (result.error) {
        console.log(`║    Error: ${result.error.slice(0, 35).padEnd(35)} ║`);
      }
    }
    
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total: ${totalItems.toString().padStart(3)} items in ${duration.toFixed(1)}s${' '.repeat(18)}║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log();

    // Show stats
    const store = scraper.getStore();
    const stats = store.getStats();
    console.log('[Main] Data store stats:');
    console.log(`  Total items: ${stats.total}`);
    Object.entries(stats.byPlatform).forEach(([platform, count]) => {
      console.log(`  ${platform}: ${count}`);
    });

    // Save data
    await store.persist();
    console.log();
    console.log('[Main] ✅ Data saved successfully');

  } catch (error) {
    console.error('[Main] ❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, loadConfig };
