#!/usr/bin/env node

import { ScraperService } from './index.js';
import type { ScraperConfig } from './index.js';

async function loadConfig(): Promise<ScraperConfig> {
  const config: ScraperConfig = {
    enableFeedbackSearch: true
  };

  // Load GitHub credentials for feedback search
  if (process.env.GITHUB_TOKEN) {
    config.github = {
      token: process.env.GITHUB_TOKEN,
      username: process.env.GITHUB_USERNAME,
      orgs: process.env.GITHUB_ORGS?.split(',') || []
    };
    console.log('[Config] GitHub API enabled for feedback search');
  } else {
    console.log('[Config] ⚠️ GITHUB_TOKEN not set - GitHub feedback search disabled');
  }

  // Load Reddit credentials for feedback search
  if (process.env.REDDIT_CLIENT_ID) {
    config.reddit = {
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
      username: process.env.REDDIT_USERNAME || '',
      password: process.env.REDDIT_PASSWORD || '',
      subreddits: ['LocalLLaMA', 'MachineLearning', 'artificial', 'OpenAI']
    };
    console.log('[Config] Reddit API enabled for feedback search');
  } else {
    console.log('[Config] ⚠️ Reddit credentials not set - Reddit feedback search disabled');
  }

  // Stack Overflow (no credentials needed for basic search)
  config.stackoverflow = {
    key: process.env.STACKOVERFLOW_KEY,
    tags: ['artificial-intelligence', 'machine-learning', 'api']
  };
  console.log('[Config] Stack Overflow API enabled for feedback search');

  return config;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Free AI Models Aggregator - Data Scraper v2.0     ║');
  console.log('║     With Cross-Platform Feedback Validation           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();
  console.log('[Info] Scrape Strategy:');
  console.log('  1. Fetch free models from models.dev');
  console.log('  2. Search GitHub for issues/discussions about each model');
  console.log('  3. Search Reddit for community feedback');
  console.log('  4. Search Stack Overflow for technical discussions');
  console.log('  5. Aggregate feedback to confirm free availability');
  console.log();

  try {
    const config = await loadConfig();
    const scraper = new ScraperService(config);

    console.log('[Main] Starting comprehensive scrape...');
    console.log();

    const startTime = Date.now();
    const results = await scraper.scrapeAll({ limit: 100 }); // Limit to 100 models to avoid rate limits
    const duration = (Date.now() - startTime) / 1000;

    console.log();
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                    SCRAPE SUMMARY                      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    
    let totalItems = 0;
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      const itemCount = result.items.length.toString().padStart(3);
      console.log(`║ ${status} ${result.platform.padEnd(15)} ${itemCount} items              ║`);
      totalItems += result.items.length;
      
      if (result.error) {
        console.log(`║    Error: ${result.error.slice(0, 35).padEnd(35)} ║`);
      }
    }
    
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total: ${totalItems.toString().padStart(3)} models processed in ${duration.toFixed(1)}s${' '.repeat(8)}║`);
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
    console.log();
    console.log('[Info] Next steps:');
    console.log('  - Review data/aggregated-data.json');
    console.log('  - Check model feedback summaries');
    console.log('  - Verify availability status indicators');

  } catch (error) {
    console.error('[Main] ❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}

export { main, loadConfig };
