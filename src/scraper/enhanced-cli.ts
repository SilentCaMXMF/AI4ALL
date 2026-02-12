#!/usr/bin/env node

import { EnhancedScraperService } from './enhanced-scraper.js';
import type { EnhancedScraperConfig } from './enhanced-scraper.js';
import { createHeader, createSummary, createTimestampedLog } from '../utils/console-utils.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env file manually
try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key] = value;
      }
    }
  }
  console.log('[Config] ✓ Environment variables loaded from .env');
} catch (error) {
  console.log('[Config] ⚠️ Could not load .env file');
}

async function loadConfig(): Promise<EnhancedScraperConfig> {
  const config: EnhancedScraperConfig = {
    enableFeedbackSearch: true,
    useIncrementalUpdates: true,
    enableHistoryTracking: true
  };

  // Load GitHub credentials
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

  // Load Reddit credentials
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

  // Stack Overflow
  config.stackoverflow = {
    key: process.env.STACKOVERFLOW_KEY,
    tags: ['ai', 'machine-learning', 'llm', 'openai', 'gpt', 'api', 'chatgpt', 'anthropic', 'claude']
  };
  console.log('[Config] Stack Overflow API enabled for feedback search (AI-focused tags)');

  return config;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'incremental';
  const fullScrape = mode === 'full' || args.includes('--full');
  const analytics = args.includes('--analytics') || args.includes('-a');
  const maintenance = args.includes('--maintenance') || args.includes('-m');

  createHeader('Free AI Models Aggregator - Enhanced Scraper', '2.5');
  console.log('║     With Multi-Platform Verification & History       ║');
  console.log();

  if (maintenance) {
    createTimestampedLog('Info', 'Running in maintenance mode', 'info');
  } else if (analytics) {
    createTimestampedLog('Info', 'Showing analytics dashboard', 'info');
  } else {
    createTimestampedLog('Info', `Scrape Mode: ${fullScrape ? 'Full' : 'Incremental'}`, 'info');
  }

  console.log('Features:');
  console.log('  ✓ Enhanced data pipeline with history tracking');
  console.log('  ✓ Incremental updates to avoid full re-scraping');
  console.log('  ✓ Multi-platform sentiment analysis');
  console.log('  ✓ API key management with rotation');
  console.log('  ✓ Trend analysis and model insights');
  console.log();

  try {
    const config = await loadConfig();
    const scraper = new EnhancedScraperService(config);
    
    // Initialize the enhanced scraper
    console.log('[Main] Initializing enhanced scraper...');
    await scraper.initialize();
    console.log('[Main] ✓ Initialization complete');
    console.log();

    if (maintenance) {
      console.log('[Main] Performing maintenance tasks...');
      await scraper.performMaintenance();
      console.log('[Main] ✓ Maintenance complete');
      
    } else if (analytics) {
      console.log('[Main] Generating analytics report...');
      const analytics = await scraper.getAnalytics();
      
      console.log();
      createHeader('Analytics Dashboard', '2.5');
      console.log();
      
      // Model Statistics
      console.log('📊 Model Statistics:');
      console.log(`  Total Models: ${analytics.modelStatistics.totalModels}`);
      console.log(`  Verified Models: ${analytics.modelStatistics.verifiedModels}`);
      console.log(`  Highly Verified: ${analytics.modelStatistics.highlyVerifiedModels}`);
      console.log();
      
      // Availability Breakdown
      console.log('🔍 Availability Status:');
      Object.entries(analytics.modelStatistics.availabilityBreakdown).forEach(([status, count]) => {
        const percentage = analytics.modelStatistics.totalModels > 0 
          ? ((count / analytics.modelStatistics.totalModels) * 100).toFixed(1)
          : '0.0';
        console.log(`  ${status}: ${count} (${percentage}%)`);
      });
      console.log();
      
      // Platform Coverage
      console.log('🌐 Platform Coverage:');
      Object.entries(analytics.modelStatistics.platformCoverage).forEach(([platform, count]) => {
        console.log(`  ${platform}: ${count} models`);
      });
      console.log();
      
      // Trending Models
      if (analytics.trendingModels.length > 0) {
        console.log('📈 Trending Models (Improving):');
        analytics.trendingModels.forEach((model, index) => {
          console.log(`  ${index + 1}. ${model.modelTitle}`);
          console.log(`     Score: ${model.summary.reliabilityScore}% | ${model.overallTrend.scoreChange > 0 ? '+' : ''}${model.overallTrend.scoreChange}`);
          console.log(`     ${model.summary.recommendation}`);
        });
        console.log();
      }
      
      // Platform Report
      console.log('📋 Platform Activity (Last 7 Days):');
      analytics.platformReport.forEach(platform => {
        console.log(`  ${platform.platform}:`);
        console.log(`    Active Models: ${platform.activeModels}/${platform.totalModels}`);
        console.log(`    Avg Score: ${platform.averageVerificationScore}%`);
        console.log(`    Trend: ${platform.trend.trend} (${platform.trend.scoreChange > 0 ? '+' : ''}${platform.trend.scoreChange})`);
        if (platform.commonIssues.length > 0) {
          console.log(`    Common Issues: ${platform.commonIssues.join(', ')}`);
        }
      });
      
    } else {
      console.log(`[Main] Starting ${fullScrape ? 'full' : 'incremental'} scrape with verification...`);
      console.log();

      const startTime = Date.now();
      const metrics = await scraper.scrapeWithVerification(fullScrape);
      const duration = (Date.now() - startTime) / 1000;

      console.log();
      createHeader('Scraping Results', '2.5');
      console.log();

      // Display metrics
      console.log('📊 Scraping Metrics:');
      console.log(`  Duration: ${duration.toFixed(1)} seconds`);
      console.log(`  Models Processed: ${metrics.totalModelsProcessed}`);
      console.log(`  New Models Found: ${metrics.newModelsFound}`);
      console.log(`  Verification Updates: ${metrics.verificationUpdates}`);
      console.log(`  Active Platforms: ${metrics.platformsActive.join(', ')}`);
      console.log();

      if (metrics.errors.length > 0) {
        console.log('⚠️ Errors Encountered:');
        metrics.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
        console.log();
      }

      // Show detailed analytics
      console.log('[Main] Generating post-scrape analytics...');
      const postAnalytics = await scraper.getAnalytics();
      
      console.log('📈 Verification Status:');
      Object.entries(postAnalytics.modelStatistics.availabilityBreakdown).forEach(([status, count]) => {
        const percentage = postAnalytics.modelStatistics.totalModels > 0 
          ? ((count / postAnalytics.modelStatistics.totalModels) * 100).toFixed(1)
          : '0.0';
        console.log(`  ${status}: ${count} models (${percentage}%)`);
      });
      console.log();

      if (postAnalytics.trendingModels.length > 0) {
        console.log('🔥 Top Improving Models:');
        postAnalytics.trendingModels.slice(0, 3).forEach((model, index) => {
          console.log(`  ${index + 1}. ${model.modelTitle} (${model.summary.reliabilityScore}% reliability)`);
        });
        console.log();
      }

      console.log(`[Main] ✅ Enhanced scraping complete - Data saved to verification database`);
      console.log();
      console.log('[Info] Next steps:');
      console.log('  - Run with --analytics to view detailed insights');
      console.log('  - Check data/verification-database.json for enhanced data');
      console.log('  - Run with --maintenance to cleanup old data');
    }

  } catch (error) {
    createTimestampedLog('Main', `Fatal error: ${error}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Show usage help
function showHelp() {
  console.log('Usage:');
  console.log('  npm run scrape                    # Run incremental scrape (default)');
  console.log('  npm run scrape full               # Run full scrape');
  console.log('  npm run scrape --analytics        # Show analytics dashboard');
  console.log('  npm run scrape --maintenance      # Run maintenance tasks');
  console.log('  npm run scrape --help            # Show this help');
  console.log();
  console.log('Environment Variables:');
  console.log('  GITHUB_TOKEN                 # GitHub API token');
  console.log('  REDDIT_CLIENT_ID             # Reddit client ID');
  console.log('  REDDIT_CLIENT_SECRET         # Reddit client secret');
  console.log('  REDDIT_USERNAME              # Reddit username');
  console.log('  REDDIT_PASSWORD              # Reddit password');
  console.log('  STACKOVERFLOW_KEY            # Stack Overflow API key');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
  } else {
    void main();
  }
}

export { main, loadConfig };