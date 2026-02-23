import { ScraperService } from './src/scraper/index.js';

async function testGitHubSearch() {
  console.log('🧪 Testing GitHub Search Integration');
  
  const scraper = new ScraperService({
    github: {
      token: process.env.GITHUB_TOKEN,
      username: process.env.GITHUB_USERNAME
    },
    enableFeedbackSearch: true
  });

  // Test with a well-known AI model name
  const testModelName = "GPT";
  const testProvider = "OpenAI";
  
  console.log(`\n🔍 Testing GitHub search for: "${testModelName}" from "${testProvider}"`);
  
  try {
    const result = await scraper.searchModelFeedback({
      id: "test",
      platform: "modelsdev",
      type: "model",
      title: `${testProvider}: ${testModelName}`,
      content: "Test model for GitHub search",
      author: { name: testProvider },
      timestamp: new Date().toISOString(),
      url: "https://example.com",
      metrics: {},
      tags: ["test"],
      raw: {}
    });
    
    console.log(`\n✅ Results:`);
    console.log(`- Total feedback items: ${result.feedback.length}`);
    console.log(`- Positive: ${result.summary.positive}`);
    console.log(`- Negative: ${result.summary.negative}`);
    console.log(`- Verification Level: ${result.summary.verificationLevel}`);
    console.log(`- Verification Score: ${result.summary.verificationScore}%`);
    
    if (result.feedback.length > 0) {
      console.log(`\n📝 Sample feedback items:`);
      result.feedback.slice(0, 3).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   Platform: ${item.platform}`);
        console.log(`   Type: ${item.type}`);
        console.log(`   Relevance: ${item.relevance.toFixed(2)}`);
        console.log(`   Sentiment: ${item.sentiment}`);
        console.log(`   URL: ${item.url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing GitHub search:', error);
  }
}

testGitHubSearch().catch(console.error);