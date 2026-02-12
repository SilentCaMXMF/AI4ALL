import { strict as assert } from 'assert';
import { GitHubAPI } from './src/api/github.js';

console.log('=== Testing GitHub API Client ===\n');

const github = new GitHubAPI();

async function testSearchForModel() {
  console.log('Testing searchForModel...');
  
  try {
    // Test with valid model name
    const result1 = await github.searchForModel('deepseek');
    assert(Array.isArray(result1), 'searchForModel should return array');
    console.log('  ✓ Returns array for valid model');

    // Test with non-existent model
    const result2 = await github.searchForModel('nonexistent-model-12345');
    assert(Array.isArray(result2), 'searchForModel should return array');
    assert.strictEqual(result2.length, 0, 'should return empty array for non-existent model');
    console.log('  ✓ Returns empty array for non-existent model');

    // Test with empty model name
    try {
      await github.searchForModel('');
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
    
    const result = await github.fetchItems(options);
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
    const result = await github.rateLimit();
    assert(typeof result === 'object', 'should return object');
    assert(typeof result.limit === 'number', 'should have limit property');
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
    const error1 = github.handleError(new Error('test error'), 'test context');
    assert(error1 instanceof Error, 'should return Error object');
    assert(error1.message.includes('[github]'), 'should include platform prefix');
    console.log('  ✓ Handles Error objects correctly');

    const error2 = github.handleError('string error', 'test context');
    assert(error2 instanceof Error, 'should handle non-Error objects');
    console.log('  ✓ Handles non-Error objects gracefully');

  } catch (error) {
    console.error('  ✗ handleError test failed:', error);
    process.exit(1);
  }
}

async function runAllTests() {
  console.log('Starting GitHub API Client Tests...');
  
  await testSearchForModel();
  await testFetchItems();
  await testRateLimit();
  await testHandleError();
  
  console.log('\n✓ All GitHub API Client tests passed!\n');
}

// Run tests
runAllTests().catch(console.error);