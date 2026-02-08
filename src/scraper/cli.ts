#!/usr/bin/env node

import { ScraperService } from './index.js';

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Free AI Models Aggregator - Data Scraper v1.0     ║');
  console.log('║     Source: models.dev (Free Models Only)             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log();

  try {
    const scraper = new ScraperService();

    console.log('[Main] Starting scrape for FREE AI models...');
    console.log('[Main] Data source: https://models.dev/api.json');
    console.log();

    const startTime = Date.now();
    const results = await scraper.scrapeAll({ limit: 500 });
    const duration = (Date.now() - startTime) / 1000;

    console.log();
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                    SCRAPE SUMMARY                      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    
    let totalItems = 0;
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      const itemCount = result.items.length.toString().padStart(3);
      console.log(`║ ${status} ${result.platform.padEnd(15)} ${itemCount} free models      ║`);
      totalItems += result.items.length;
      
      if (result.error) {
        console.log(`║    Error: ${result.error.slice(0, 35).padEnd(35)} ║`);
      }
    }
    
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║ Total: ${totalItems.toString().padStart(3)} free models in ${duration.toFixed(1)}s${' '.repeat(12)}║`);
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log();

    // Show stats
    const store = scraper.getStore();
    const stats = store.getStats();
    console.log('[Main] Data store stats:');
    console.log(`  Total free models: ${stats.total}`);

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
  void main();
}

export { main };
