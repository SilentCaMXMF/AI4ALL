#!/usr/bin/env node

// Test script for Models.dev API integration
// This tests the opencode Zen model pricing tracker

import { ModelsDevAPI } from './src/api/modelsdev.js';
import { createHeader, createSectionHeader } from './src/utils/console-utils.js';

createHeader('Models.dev API Test - Opencode Zen Pricing Tracker');

async function testModelsDevAPI() {
  console.log('🚀 Initializing Models.dev API client...\n');
  
  const api = new ModelsDevAPI({
    searchTerms: ['opencode', 'zen']
  });

  try {
    console.log('📡 Fetching data from https://models.dev/api.json...');
    console.log('🔍 Searching for: opencode, zen\n');
    
    const result = await api.fetchItems({ limit: 50 });
    
    createSectionHeader('Results Summary');
    console.log(`Total items fetched: ${result.items.length}`);
    
    // Separate models and price alerts
    const models = result.items.filter(item => item.type === 'model');
    const priceAlerts = result.items.filter(item => item.type === 'price_alert');
    
    console.log(`Models found: ${models.length}`);
    console.log(`Price alerts: ${priceAlerts.length}`);
    
    // Show stats
    const stats = api.getStats();
    console.log(`\n📈 API Statistics:`);
    console.log(`  Total tracked models: ${stats.totalModels}`);
    console.log(`  Last fetch: ${new Date(stats.lastFetch).toLocaleString()}`);
    console.log(`  Total fetches: ${stats.fetchCount}`);
    console.log(`  Price changes (24h): ${stats.priceChanges24h}`);
    
    if (models.length > 0) {
      createSectionHeader('Opencode/Zen Models');
      
      models.forEach((model, index) => {
        console.log(`\n${index + 1}. ${model.title}`);
        console.log(`   ${model.content}`);
        console.log(`   🔗 ${model.url}`);
        console.log(`   🏷️  Tags: ${model.tags.join(', ')}`);
        console.log(`   🕐 Updated: ${new Date(model.timestamp).toLocaleString()}`);
      });
    }
    
    if (priceAlerts.length > 0) {
      createSectionHeader('Price Changes Detected');
      
      priceAlerts.forEach((alert, index) => {
        console.log(`\n${index + 1}. ${alert.title}`);
        console.log(`   ${alert.content}`);
        console.log(`   🕐 ${new Date(alert.timestamp).toLocaleString()}`);
      });
    }
    
    // Show price history if available
    const priceHistory = api.getPriceHistory(undefined, 10);
    if (priceHistory.length > 0) {
      createSectionHeader('Recent Price History (Last 10 changes)');
      
      priceHistory.forEach((change, index) => {
        const percentStr = change.changePercent 
          ? ` (${change.changePercent > 0 ? '+' : ''}${change.changePercent.toFixed(1)}%)` 
          : '';
        console.log(`${index + 1}. ${change.modelId}: ${change.field} $${change.oldValue} → $${change.newValue}${percentStr}`);
      });
    }
    
    createSectionHeader('Test Completed Successfully');
    console.log('\n💡 This API fetches hourly - price changes are tracked automatically');
    console.log('📝 Data is cached to avoid duplicate fetches within 1 hour');
    console.log('🚨 Price change alerts are generated when costs change between fetches\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

testModelsDevAPI();
