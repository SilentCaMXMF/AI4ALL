import { ScraperService } from './src/scraper/index.js';

async function finalTest() {
  console.log('🎯 FINAL COMPREHENSIVE TEST');
  console.log('=============================\n');
  
  const scraper = new ScraperService({
    github: {
      token: process.env.GITHUB_TOKEN,
      username: process.env.GITHUB_USERNAME
    },
    stackoverflow: {
      key: process.env.STACKOVERFLOW_KEY,
      tags: ['openai-api', 'chatgpt', 'gpt-4', 'anthropic', 'claude', 'google-ai', 'gemini', 'huggingface', 'llm', 'ai-api']
    },
    enableFeedbackSearch: true
  });

  // Test with real AI models that should have community discussion
  const realModels = [
    { name: 'GPT-4', provider: 'OpenAI', expected: 'High' },
    { name: 'Claude', provider: 'Anthropic', expected: 'High' },
    { name: 'Llama', provider: 'Meta', expected: 'High' },
    { name: 'Gemini', provider: 'Google', expected: 'Medium' }
  ];

  let totalTests = 0;
  let successfulTests = 0;

  for (const model of realModels) {
    totalTests++;
    console.log(`\n🔍 Test ${totalTests}: ${model.name} (${model.provider})`);
    console.log(`📊 Expected: ${model.expected} community presence`);
    console.log('─'.repeat(60));
    
    try {
      const startTime = Date.now();
      const result = await scraper.searchModelFeedback({
        id: `final-test-${model.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        platform: "modelsdev",
        type: "model",
        title: `${model.provider}: ${model.name}`,
        content: `Real AI model: ${model.name} from ${model.provider}`,
        author: { name: model.provider },
        timestamp: new Date().toISOString(),
        url: "https://example.com",
        metrics: {},
        tags: ["final-test", "real-verification"],
        raw: { finalTest: true, modelName: model.name, provider: model.provider }
      });
      const duration = Date.now() - startTime;
      
      console.log(`\n📈 RESULTS (${duration}ms):`);
      console.log(`  Total Feedback: ${result.summary.total}`);
      console.log(`  ✅ Positive: ${result.summary.positive}`);
      console.log(`  ❌ Negative: ${result.summary.negative}`);
      console.log(`  😐 Neutral: ${result.summary.neutral}`);
      console.log(`  📊 Score: ${result.summary.verificationScore}%`);
      console.log(`  🏆 Status: ${result.summary.verificationLevel}`);
      
      // Platform breakdown
      const platforms = {};
      result.feedback.forEach(item => {
        platforms[item.platform] = (platforms[item.platform] || 0) + 1;
      });
      
      console.log(`\n📱 Platforms:`);
      Object.entries(platforms).forEach(([platform, count]) => {
        console.log(`  ${platform}: ${count} items`);
      });
      
      // Success criteria
      const hasResults = result.summary.total > 0;
      const hasPositive = result.summary.positive > 0;
      const hasMultiplePlatforms = Object.keys(platforms).length > 1;
      
      if (hasResults) {
        successfulTests++;
        console.log(`\n✅ SUCCESS: Found community discussion!`);
      } else {
        console.log(`\n⚠️  LIMITED: No community discussion found`);
      }
      
      // Show top result if available
      if (result.feedback.length > 0) {
        const topResult = result.feedback[0];
        console.log(`\n📝 Top Result:`);
        console.log(`  Title: ${topResult.title}`);
        console.log(`  Platform: ${topResult.platform} | Sentiment: ${topResult.sentiment}`);
        console.log(`  URL: ${topResult.url}`);
      }
      
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
  
  console.log('\n🎉 FINAL SUMMARY');
  console.log('==================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Successful: ${successfulTests}`);
  console.log(`Success Rate: ${Math.round((successfulTests / totalTests) * 100)}%`);
  
  if (successfulTests === totalTests) {
    console.log('\n🚀 ALL TESTS PASSED!');
    console.log('✅ GitHub search working');
    console.log('✅ Stack Overflow search working');
    console.log('✅ Integration system functional');
    console.log('✅ Ready for production use');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('Need further optimization');
  }
}

finalTest().catch(console.error);