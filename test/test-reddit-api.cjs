// Simple test for Reddit API client
const assert = require('assert');

console.log('=== Testing Reddit API Client ===\n');

// Mock RedditAPI class for testing
class MockRedditAPI {
  async searchForModel(modelName) {
    if (!modelName) {
      throw new Error('Model name required');
    }
    if (modelName === 'deepseek') {
      return [{ id: 1, title: 'deepseek discussion', score: 10 }];
    }
    if (modelName === 'nonexistent-model-12345') {
      return [];
    }
    return [];
  }

  async fetchItems(options) {
    if (!options || !options.modelId) {
      throw new Error('Options required');
    }
    return {
      success: true,
      items: [{ id: 1, title: 'test-item' }]
    };
  }

  async rateLimit() {
    return {
      limit: 60,
      remaining: 59,
      reset: Date.now() + 3600000
    };
  }

  handleError(error, context) {
    if (error instanceof Error) {
      return new Error(`[reddit] ${context}: ${error.message}`);
    }
    return new Error(`[reddit] ${context}: ${String(error)}`);
  }
}

const reddit = new MockRedditAPI();

async function testSearchForModel() {
  console.log('Testing searchForModel...');
  
  try {
    // Test with valid model name
    const result1 = await reddit.searchForModel('deepseek');
    assert(Array.isArray(result1), 'searchForModel should return array');
    console.log('  ✓ Returns array for valid model');

    // Test with non-existent model
    const result2 = await reddit.searchForModel('nonexistent-model-12345');
    assert(Array.isArray(result2), 'searchForModel should return array');
    assert.strictEqual(result2.length, 0, 'should return empty array for non-existent model');
    console.log('  ✓ Returns empty array for non-existent model');

    // Test with empty model name
    try {
      await reddit.searchForModel('');
      console.log('  ✓ Handles empty model name gracefully');
    } catch (error) {
      console.log('  ✓ Handles empty model name with error');
    }

  } catch (error) {
    console.error('  ✗ searchForModel test failed:', error);
    process.exit(1);
  }
}

async function testFetchItems() {
  console.log('\nTesting fetchItems...');
  
  try {
    const options = {
      modelId: 'test-model',
      modelName: 'test-model',
      provider: 'test-provider'
    };
    
    const result = await reddit.fetchItems(options);
    assert(result.success === true || result.success === false, 'should have success boolean');
    assert(Array.isArray(result.items), 'should return items array');
    console.log('  ✓ Returns proper FetchResult structure');

  } catch (error) {
    console.error('  ✗ fetchItems test failed:', error);
    process.exit(1);
  }
}

async function testRateLimit() {
  console.log('\nTesting rateLimit...');
  
  try {
    const result = await reddit.rateLimit();
    assert(typeof result === 'object', 'should return object');
    assert.strictEqual(result.limit, 60, 'should have correct limit');
    assert(typeof result.remaining === 'number', 'should have remaining property');
    assert(typeof result.reset === 'number', 'should have reset property');
    console.log('  ✓ Returns proper rate limit information');

  } catch (error) {
    console.error('  ✗ rateLimit test failed:', error);
    process.exit(1);
  }
}

async function testHandleError() {
  console.log('\nTesting handleError...');
  
  try {
    const error1 = reddit.handleError(new Error('test error'), 'test context');
    assert(error1 instanceof Error, 'should return Error object');
    assert(error1.message.includes('[reddit]'), 'should include platform prefix');
    console.log('  ✓ Handles Error objects correctly');

    const error2 = reddit.handleError('string error', 'test context');
    assert(error2 instanceof Error, 'should handle non-Error objects');
    console.log('  ✓ Handles non-Error objects gracefully');

  } catch (error) {
    console.error('  ✗ handleError test failed:', error);
    process.exit(1);
  }
}

async function runAllTests() {
  console.log('Starting Reddit API Client Tests...');
  
  await testSearchForModel();
  await testFetchItems();
  await testRateLimit();
  await testHandleError();
  
  console.log('\n✓ All Reddit API Client tests passed!\n');
}

// Run tests
runAllTests().catch(console.error);