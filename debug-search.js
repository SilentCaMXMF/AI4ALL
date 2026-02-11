import { ScraperService } from './src/scraper/index.js';

async function debugSearch() {
  console.log('🐛 Debug Search Results');
  
  const scraper = new ScraperService({
    github: {
      token: process.env.GITHUB_TOKEN,
      username: process.env.GITHUB_USERNAME
    },
    stackoverflow: {
      key: process.env.STACKOVERFLOW_KEY,
      tags: ['openai-api', 'chatgpt', 'gpt-4', 'anthropic', 'claude']
    },
    enableFeedbackSearch: true
  });

  // Test just one model to debug
  console.log('\n🔍 Testing GPT-4 (OpenAI)...');
  
  try {
    const result = await scraper.searchModelFeedback({
      id: "debug-gpt4",
      platform: "modelsdev",
      type: "model",
      title: "OpenAI: GPT-4",
      content: "Debug test for GPT-4",
      author: { name: "OpenAI" },
      timestamp: new Date().toISOString(),
      url: "https://example.com",
      metrics: {},
      tags: ["debug"],
      raw: {}
    });
    
    console.log(`\n✅ Raw Results:`);
    console.log(`Total feedback items: ${result.feedback.length}`);
    
    if (result.feedback.length > 0) {
      result.feedback.forEach((item, index) => {
        console.log(`\n${index + 1}. Platform: ${item.platform}`);
        console.log(`   Title: ${item.title}`);
        console.log(`   Relevance: ${item.relevance}`);
        console.log(`   Sentiment: ${item.sentiment}`);
        console.log(`   Content: ${item.content?.substring(0, 100)}...`);
      });
    } else {
      console.log('No feedback found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSearch().catch(console.error);