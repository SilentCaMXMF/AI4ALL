import { ScraperService } from './src/scraper/index.js';

async function quickPlatformTest() {
  console.log('⚡ QUICK PLATFORM TEST');
  console.log('=========================\n');
  
  const scraper = new ScraperService({
    github: {
      token: process.env.GITHUB_TOKEN,
      username: process.env.GITHUB_USERNAME
    },
    stackoverflow: {
      key: process.env.STACKOVERFLOW_KEY,
      tags: ['openai-api', 'gpt-4', 'claude']
    },
    hackernews: {
      apiKey: process.env.HACKERNEWS_API_KEY
    },
    huggingface: {
      token: process.env.HUGGINGFACE_TOKEN
    },
    enableFeedbackSearch: true
  });

  // Test just GPT-4 to see if platforms work
  console.log('🔍 Testing GPT-4 (OpenAI) across platforms...');
  
  try {
    const result = await scraper.searchModelFeedback({
      id: "quick-test-gpt4",
      platform: "modelsdev",
      type: "model",
      title: "OpenAI: GPT-4",
      content: "Quick test for GPT-4 across all platforms",
      author: { name: "OpenAI" },
      timestamp: new Date().toISOString(),
      url: "https://example.com",
      metrics: {},
      tags: ["quick-test"],
      raw: {}
    });
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total Feedback: ${result.summary.total}`);
    console.log(`Verification Score: ${result.summary.verificationScore}%`);
    console.log(`Status: ${result.summary.verificationLevel}`);
    
    // Count results by platform
    const platformCounts = {};
    result.feedback.forEach(item => {
      platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
    });
    
    console.log(`\n📱 PLATFORMS FOUND:`);
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`  ${platform.toUpperCase()}: ${count} items`);
    });
    
    // Success criteria
    const hasMultiplePlatforms = Object.keys(platformCounts).length >= 2;
    
    if (hasMultiplePlatforms && result.summary.total > 0) {
      console.log('\n🎉 SUCCESS: Multi-platform verification working!');
      console.log('✅ Enhanced integration ready for production');
    } else {
      console.log('\n⚠️  LIMITED: Need more platform data');
      console.log('💡 Check API credentials and search logic');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

quickPlatformTest().catch(console.error);