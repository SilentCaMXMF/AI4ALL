#!/usr/bin/env node

import { EnhancedScraperService } from './enhanced-scraper.js';
import type { EnhancedScraperConfig } from './enhanced-scraper.js';
import { createHeader, createSummary, createTimestampedLog } from '../utils/console-utils.js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env file using dotenv
const envPath = resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.log('[Config] ⚠️ Could not load .env file');
} else {
  console.log('[Config] ✓ Environment variables loaded from .env');
}

async function loadConfig(): Promise<EnhancedScraperConfig> {
  const config: EnhancedScraperConfig = {
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
    tags: ['ai', 'machine-learning', 'llm', 'openai', 'gpt', 'api', 'chatgpt', 'anthropic', 'claude']
  };
  console.log('[Config] Stack Overflow API enabled for feedback search (AI-focused tags)');

  // Hacker News (no credentials needed)
  config.hackernews = {
    enabled: process.env.ENABLE_HACKERNEWS !== 'false'
  };
  console.log('[Config] Hacker News API enabled for feedback search');

  // Hugging Face (optional token for higher rate limits)
  if (process.env.HUGGINGFACE_TOKEN) {
    config.huggingface = {
      token: process.env.HUGGINGFACE_TOKEN
    };
    console.log('[Config] Hugging Face API enabled for feedback search');
  } else {
    console.log('[Config] ⚠️ HUGGINGFACE_TOKEN not set - Hugging Face search limited');
  }

  return config;
}

async function main() {
  createHeader('Free AI Models Aggregator - Data Scraper', '2.0');
  console.log('║     With Cross-Platform Feedback Validation           ║');
  console.log();
  createTimestampedLog('Info', 'Scrape Strategy:', 'info');
  console.log('  1. Fetch free models from models.dev');
  console.log('  2. Search GitHub for issues/discussions about each model');
  console.log('  3. Search Reddit for community feedback');
  console.log('  4. Search Stack Overflow for technical discussions');
  console.log('  5. Search Hacker News for discussions');
  console.log('  6. Search Hugging Face for model pages');
  console.log('  7. Aggregate feedback to confirm free availability');
  console.log();

  try {
    const config = await loadConfig();
    const scraper = new EnhancedScraperService(config);

    console.log('[Main] Starting comprehensive scrape...');
    console.log();

    // Initialize the scraper
    await scraper.initialize();
    
    const startTime = Date.now();
    
    // Run full scrape with verification
    const result = await scraper.scrapeWithVerification(true);
    const duration = (Date.now() - startTime) / 1000;

    console.log();
    createSummary([{
      platform: 'total',
      count: result.totalModelsProcessed,
      status: 'success' as const,
      error: undefined
    }], `Total: ${result.totalModelsProcessed} models processed in ${duration.toFixed(1)}s`);

    console.log('[Main] Scrape metrics:');
    console.log(`  Models processed: ${result.totalModelsProcessed}`);
    console.log(`  Verification updates: ${result.verificationUpdates}`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Active platforms: ${result.platformsActive.join(', ')}`);
    
    if (result.errors.length > 0) {
      console.log();
      console.log('[Main] Errors encountered:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log();
    console.log('[Main] ✅ Data saved successfully');
    console.log();
    console.log('[Info] Next steps:');
    console.log('  - Review data/aggregated-data.json');
    console.log('  - Check model feedback summaries');
    console.log('  - Verify availability status indicators');

  } catch (error) {
    createTimestampedLog('Main', `Fatal error: ${error}`, 'error');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}

export { main, loadConfig };
