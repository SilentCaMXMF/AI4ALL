import { ScraperService } from './src/scraper/index.js';

async function testRealAIModels() {
  console.log('🧪 Testing Enhanced Integration with Real AI Models');
  console.log('==================================================\n');
  
  const scraper = new ScraperService({
    github: {
      token: process.env.GITHUB_TOKEN,
      username: process.env.GITHUB_USERNAME
    },
    stackoverflow: {
      key: process.env.STACKOVERFLOW_KEY,
      tags: [
        'openai-api', 'chatgpt', 'gpt-4', 'anthropic', 'claude',
        'google-ai', 'gemini', 'huggingface', 'llm', 'ai-api'
      ]
    },
    enableFeedbackSearch: true
  });

  // Test with well-known real AI models
  const testModels = [
    { name: 'GPT-4', provider: 'OpenAI' },
    { name: 'Claude', provider: 'Anthropic' },
    { name: 'Gemini', provider: 'Google' },
    { name: 'Llama', provider: 'Meta' },
    { name: 'Mistral', provider: 'Mistral AI' },
    { name: 'GPT-3.5', provider: 'OpenAI' }
  ];

  for (const model of testModels) {
    console.log(`\n🔍 Testing: ${model.name} (${model.provider})`);
    console.log('─'.repeat(50));
    
    try {
      const result = await scraper.searchModelFeedback({
        id: `test-${model.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        platform: "modelsdev",
        type: "model",
        title: `${model.provider}: ${model.name}`,
        content: `Real AI model for testing: ${model.name}`,
        author: { name: model.provider },
        timestamp: new Date().toISOString(),
        url: "https://example.com",
        metrics: {},
        tags: ["test", "real-model"],
        raw: { testModel: true, modelName: model.name, provider: model.provider }
      });
      
      console.log(`\n📊 Results Summary:`);
      console.log(`  Total feedback: ${result.summary.total}`);
      console.log(`  ✅ Positive: ${result.summary.positive}`);
      console.log(`  ❌ Negative: ${result.summary.negative}`);
      console.log(`  😐 Neutral: ${result.summary.neutral}`);
      console.log(`  📈 Verification Score: ${result.summary.verificationScore}%`);
      console.log(`  🏆 Status: ${result.summary.verificationLevel}`);
      console.log(`  📅 Last Mention: ${new Date(result.summary.lastMention).toLocaleDateString()}`);
      
      if (result.summary.commonIssues.length > 0) {
        console.log(`  ⚠️  Common Issues: ${result.summary.commonIssues.join(', ')}`);
      }
      
      // Show breakdown by platform
      const platformBreakdown = {};
      result.feedback.forEach(item => {
        if (!platformBreakdown[item.platform]) {
          platformBreakdown[item.platform] = 0;
        }
        platformBreakdown[item.platform]++;
      });
      
      console.log(`\n📱 Platform Breakdown:`);
      Object.entries(platformBreakdown).forEach(([platform, count]) => {
        console.log(`  ${platform}: ${count} items`);
      });
      
      // Show top results
      if (result.feedback.length > 0) {
        console.log(`\n📝 Top ${Math.min(3, result.feedback.length)} Results:`);
        result.feedback
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 3)
          .forEach((item, index) => {
            console.log(`\n  ${index + 1}. ${item.title}`);
            console.log(`     Platform: ${item.platform} | Type: ${item.type}`);
            console.log(`     Sentiment: ${item.sentiment} | Relevance: ${item.relevance.toFixed(2)}`);
            console.log(`     URL: ${item.url}`);
            
            // Show first 100 chars of content
            if (item.content) {
              console.log(`     Content: ${item.content.substring(0, 100)}...`);
            }
          });
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${model.name}:`, error.message);
    }
    
    console.log('\n' + '='.repeat(60));
  }
  
  console.log('\n🎉 Testing Complete!');
  console.log('\n💡 Key Insights:');
  console.log('  • GitHub search should find repositories and issues');
  console.log('  • Stack Overflow should find technical questions');
  console.log('  • Relevance scoring should filter meaningful content');
  console.log('  • Sentiment analysis should detect issues vs success');
}

testRealAIModels().catch(console.error);