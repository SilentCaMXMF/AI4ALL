// Test GitHub search directly
import { ScraperService } from './src/scraper/index.js';

async function testGitHubOnly() {
  console.log('🐙 GitHub-Only Test');
  console.log('====================\n');
  
  const scraper = new ScraperService({
    github: {
      token: process.env.GITHUB_TOKEN,
      username: process.env.GITHUB_USERNAME
    },
    enableFeedbackSearch: true
  });

  // Test with GPT-4 which should have lots of GitHub content
  console.log('🔍 Testing GitHub search for: GPT-4 (OpenAI)');
  
  try {
    const result = await scraper.searchModelFeedback({
      id: "github-test-gpt4",
      platform: "modelsdev", 
      type: "model",
      title: "OpenAI: GPT-4",
      content: "Test model for GitHub search",
      author: { name: "OpenAI" },
      timestamp: new Date().toISOString(),
      url: "https://example.com",
      metrics: {},
      tags: ["github-test"],
      raw: {}
    });
    
    console.log(`\n📊 Results:`);
    console.log(`Total feedback: ${result.feedback.length}`);
    console.log(`Positive: ${result.summary.positive}`);
    console.log(`Negative: ${result.summary.negative}`);
    console.log(`Score: ${result.summary.verificationScore}%`);
    console.log(`Status: ${result.summary.verificationLevel}`);
    
    if (result.feedback.length > 0) {
      console.log(`\n📝 GitHub Results Found:`);
      result.feedback
        .filter(item => item.platform === 'github')
        .slice(0, 3)
        .forEach((item, index) => {
          console.log(`\n${index + 1}. ${item.title}`);
          console.log(`   Type: ${item.type}`);
          console.log(`   Relevance: ${item.relevance.toFixed(2)}`);
          console.log(`   URL: ${item.url}`);
        });
    } else {
      console.log('\n❌ No GitHub results found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGitHubOnly().catch(console.error);