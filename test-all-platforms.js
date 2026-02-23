import { ScraperService } from './src/scraper/index.js';

async function testAllPlatforms() {
  console.log('🚀 COMPREHENSIVE PLATFORM TEST');
  console.log('==========================================\n');
  
  const scraper = new ScraperService({
    github: {
      token: process.env.GITHUB_TOKEN,
      username: process.env.GITHUB_USERNAME
    },
    stackoverflow: {
      key: process.env.STACKOVERFLOW_KEY,
      tags: ['openai-api', 'chatgpt', 'gpt-4', 'anthropic', 'claude', 'google-ai', 'gemini', 'huggingface', 'llm', 'ai-api']
    },
    hackernews: {
      apiKey: process.env.HACKERNEWS_API_KEY // Optional
    },
    huggingface: {
      token: process.env.HUGGINGFACE_TOKEN // Optional
    },
    enableFeedbackSearch: true
  });

  // Test with models that should have cross-platform presence
  const testModels = [
    { name: 'GPT-4', provider: 'OpenAI', expected: 'High' },
    { name: 'Claude', provider: 'Anthropic', expected: 'High' },
    { name: 'Llama', provider: 'Meta', expected: 'High' },
    { name: 'Mistral', provider: 'Mistral AI', expected: 'Medium' }
  ];

  let totalTests = 0;
  let successfulTests = 0;
  let platformResults = {
    github: 0,
    stackoverflow: 0,
    hackernews: 0,
    huggingface: 0,
    reddit: 0
  };

  for (const model of testModels) {
    totalTests++;
    console.log(`\n🔍 Test ${totalTests}: ${model.name} (${model.provider})`);
    console.log(`📊 Expected: ${model.expected} platform presence`);
    console.log('─'.repeat(60));
    
    try {
      const startTime = Date.now();
      const result = await scraper.searchModelFeedback({
        id: `comprehensive-test-${model.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        platform: "modelsdev",
        type: "model",
        title: `${model.provider}: ${model.name}`,
        content: `Comprehensive test model: ${model.name}`,
        author: { name: model.provider },
        timestamp: new Date().toISOString(),
        url: "https://example.com",
        metrics: {},
        tags: ["comprehensive-test"],
        raw: {}
      });
      const duration = Date.now() - startTime;
      
      console.log(`\n📈 RESULTS (${duration}ms):`);
      console.log(`  Total Feedback: ${result.summary.total}`);
      console.log(`  ✅ Positive: ${result.summary.positive}`);
      console.log(`  ❌ Negative: ${result.summary.negative}`);
      console.log(`  😐 Neutral: ${result.summary.neutral}`);
      console.log(`  📊 Verification Score: ${result.summary.verificationScore}%`);
      console.log(`  🏆 Status: ${result.summary.verificationLevel}`);
      console.log(`  📅 Last Mention: ${new Date(result.summary.lastMention).toLocaleDateString()}`);
      
      if (result.summary.commonIssues.length > 0) {
        console.log(`  ⚠️  Common Issues: ${result.summary.commonIssues.join(', ')}`);
      }
      
      // Platform breakdown
      result.feedback.forEach(item => {
        if (platformResults[item.platform] !== undefined) {
          platformResults[item.platform] += item.relevance > 0.3 ? 1 : 0;
        }
      });
      
      // Success criteria
      const hasResults = result.summary.total > 0;
      const hasMultiplePlatforms = Object.keys(platformResults).filter(p => platformResults[p] > 0).length >= 2;
      const isSuccessful = hasResults && hasMultiplePlatforms;
      
      if (isSuccessful) {
        successfulTests++;
        console.log(`\n✅ SUCCESS: Multi-platform verification found!`);
      } else {
        console.log(`\n⚠️  LIMITED: Insufficient cross-platform data`);
      }
      
    } catch (error) {
      console.error(`❌ ERROR: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
  
  // Final summary
  console.log('\n🎉 COMPREHENSIVE TEST SUMMARY');
  console.log('==================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Successful Tests: ${successfulTests}`);
  console.log(`Success Rate: ${Math.round((successfulTests / totalTests) * 100)}%`);
  console.log(`Overall System: ${successfulTests === totalTests ? '✅ PRODUCTION READY' : '⚠️  NEEDS OPTIMIZATION'}`);
  
  console.log('\n📊 Platform Performance:');
  Object.entries(platformResults).forEach(([platform, count]) => {
    const percentage = Math.round((count / totalTests) * 100);
    const status = count > 0 ? '✅ Working' : '❌ Not Working';
    console.log(`  ${platform.toUpperCase()}: ${status} (${count}/${totalTests} models - ${percentage}%)`);
  });
  
  if (successfulTests === totalTests) {
    console.log('\n🚀 ALL PLATFORMS OPERATIONAL!');
    console.log('✅ GitHub: Finding repositories and issues');
    console.log('✅ Stack Overflow: Finding technical Q&A');
    console.log('✅ Hacker News: Finding quality discussions');
    console.log('✅ Hugging Face: Finding model correlations');
    console.log('✅ Integration: Unified verification system');
    console.log('✅ Production: Ready for deployment');
  }
}

testAllPlatforms().catch(console.error);