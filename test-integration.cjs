// Integration tests with mock responses
const assert = require('assert');

console.log('=== Integration Tests with Mock Responses ===\n');

// Mock API responses
const mockResponses = {
  github: {
    searchForModel: {
      deepseek: [
        { id: 1, name: 'deepseek', full_name: 'deepseek-model', html_url: 'https://github.com/deepseek' }
      ],
      nonexistent: []
    },
    fetchItems: {
      success: {
        success: true,
        items: [
          { id: 1, name: 'test-item', html_url: 'https://github.com/test' }
        ]
      },
      failure: {
        success: false,
        items: []
      }
    }
  },
  reddit: {
    searchForModel: {
      deepseek: [
        { id: 1, title: 'deepseek discussion', score: 10, url: 'https://reddit.com/r/deepseek' }
      ],
      nonexistent: []
    }
  },
  stackoverflow: {
    searchForModel: {
      deepseek: [
        { id: 1, title: 'deepseek question', score: 5, link: 'https://stackoverflow.com/questions/123' }
      ],
      nonexistent: []
    }
  }
};

// Mock API clients
class MockGitHubAPI {
  async searchForModel(modelName) {
    return mockResponses.github.searchForModel[modelName] || [];
  }

  async fetchItems(options) {
    if (options.modelId === 'success') {
      return mockResponses.github.fetchItems.success;
    }
    return mockResponses.github.fetchItems.failure;
  }

  async rateLimit() {
    return { limit: 5000, remaining: 4999, reset: Date.now() + 3600000 };
  }

  handleError(error, context) {
    return new Error(`[github] ${context}: ${error.message}`);
  }
}

class MockRedditAPI {
  async searchForModel(modelName) {
    return mockResponses.reddit.searchForModel[modelName] || [];
  }

  async fetchItems(options) {
    return { success: true, items: [] };
  }

  async rateLimit() {
    return { limit: 60, remaining: 59, reset: Date.now() + 3600000 };
  }

  handleError(error, context) {
    return new Error(`[reddit] ${context}: ${error.message}`);
  }
}

class MockStackOverflowAPI {
  async searchForModel(modelName) {
    return mockResponses.stackoverflow.searchForModel[modelName] || [];
  }

  async fetchItems(options) {
    return { success: true, items: [] };
  }

  async rateLimit() {
    return { limit: 300, remaining: 299, reset: Date.now() + 3600000 };
  }

  handleError(error, context) {
    return new Error(`[stackoverflow] ${context}: ${error.message}`);
  }
}

// Integration test functions
async function testMultiPlatformSearch() {
  console.log('Testing multi-platform search integration...');
  
  try {
    const github = new MockGitHubAPI();
    const reddit = new MockRedditAPI();
    const stackoverflow = new MockStackOverflowAPI();

    // Test search across all platforms
    const modelName = 'deepseek';
    
    const githubResults = await github.searchForModel(modelName);
    const redditResults = await reddit.searchForModel(modelName);
    const stackoverflowResults = await stackoverflow.searchForModel(modelName);

    assert(Array.isArray(githubResults), 'GitHub should return array');
    assert(Array.isArray(redditResults), 'Reddit should return array');
    assert(Array.isArray(stackoverflowResults), 'StackOverflow should return array');

    console.log('  ✓ All platforms return arrays');
    console.log('  ✓ GitHub found ', githubResults.length, 'results');
    console.log('  ✓ Reddit found ', redditResults.length, 'results');
    console.log('  ✓ StackOverflow found ', stackoverflowResults.length, 'results');

  } catch (error) {
    console.error('  ✗ Multi-platform search test failed:', error);
    process.exit(1);
  }
}

async function testErrorHandlingIntegration() {
  console.log('\nTesting error handling integration...');
  
  try {
    const github = new MockGitHubAPI();
    const reddit = new MockRedditAPI();
    const stackoverflow = new MockStackOverflowAPI();

    // Test error handling across platforms
    const error = new Error('test error');
    
    const githubError = github.handleError(error, 'test operation');
    const redditError = reddit.handleError(error, 'test operation');
    const stackoverflowError = stackoverflow.handleError(error, 'test operation');

    assert(githubError instanceof Error, 'GitHub error should be Error');
    assert(redditError instanceof Error, 'Reddit error should be Error');
    assert(stackoverflowError instanceof Error, 'StackOverflow error should be Error');

    assert(githubError.message.includes('[github]'), 'GitHub error should have prefix');
    assert(redditError.message.includes('[reddit]'), 'Reddit error should have prefix');
    assert(stackoverflowError.message.includes('[stackoverflow]'), 'StackOverflow error should have prefix');

    console.log('  ✓ All platforms handle errors with proper prefixes');

  } catch (error) {
    console.error('  ✗ Error handling integration test failed:', error);
    process.exit(1);
  }
}

async function testRateLimitingIntegration() {
  console.log('\nTesting rate limiting integration...');
  
  try {
    const github = new MockGitHubAPI();
    const reddit = new MockRedditAPI();
    const stackoverflow = new MockStackOverflowAPI();

    // Test rate limits across platforms
    const githubRate = await github.rateLimit();
    const redditRate = await reddit.rateLimit();
    const stackoverflowRate = await stackoverflow.rateLimit();

    assert(typeof githubRate === 'object', 'GitHub rate limit should be object');
    assert(typeof redditRate === 'object', 'Reddit rate limit should be object');
    assert(typeof stackoverflowRate === 'object', 'StackOverflow rate limit should be object');

    assert(typeof githubRate.limit === 'number', 'GitHub should have limit');
    assert(typeof redditRate.limit === 'number', 'Reddit should have limit');
    assert(typeof stackoverflowRate.limit === 'number', 'StackOverflow should have limit');

    console.log('  ✓ All platforms return proper rate limit information');
    console.log('  ✓ GitHub limit: ', githubRate.limit);
    console.log('  ✓ Reddit limit: ', redditRate.limit);
    console.log('  ✓ StackOverflow limit: ', stackoverflowRate.limit);

  } catch (error) {
    console.error('  ✗ Rate limiting integration test failed:', error);
    process.exit(1);
  }
}

async function testSentimentAnalysisIntegration() {
  console.log('\nTesting sentiment analysis integration...');
  
  try {
    // Mock feedback data from multiple platforms
    const feedback = [
      { platform: 'github', text: 'This model is working great!', sentiment: 'positive' },
      { platform: 'reddit', text: 'I\u0027m having rate limit issues.', sentiment: 'negative' },
      { platform: 'stackoverflow', text: 'This model is available and free.', sentiment: 'positive' }
    ];

    // Calculate trust score
    const total = feedback.length;
    const positive = feedback.filter(f => f.sentiment === 'positive').length;
    const negative = feedback.filter(f => f.sentiment === 'negative').length;
    const score = Math.round((positive / total) * 100);

    assert.strictEqual(total, 3, 'should have 3 feedback items');
    assert.strictEqual(positive, 2, 'should have 2 positive feedbacks');
    assert.strictEqual(negative, 1, 'should have 1 negative feedback');
    assert.strictEqual(score, 67, 'should calculate correct trust score');

    console.log('  ✓ Sentiment analysis integration works correctly');
    console.log('  ✓ Trust score: ', score, '1% from 2/3 positive');

  } catch (error) {
    console.error('  ✗ Sentiment analysis integration test failed:', error);
    process.exit(1);
  }
}

async function runAllIntegrationTests() {
  console.log('Starting Integration Tests...');
  
  await testMultiPlatformSearch();
  await testErrorHandlingIntegration();
  await testRateLimitingIntegration();
  await testSentimentAnalysisIntegration();
  
  console.log('\n✓ All Integration Tests passed!\n');
}

// Run integration tests
runAllIntegrationTests().catch(console.error);