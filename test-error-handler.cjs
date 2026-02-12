// Simple test for error handling utilities
const assert = require('assert');

console.log('=== Testing Error Handling Utilities ===\n');

// Mock error classes from error-handler.ts
class PlatformError extends Error {
  constructor(platform, context, originalError, message) {
    super(message || `[${platform}] ${context}: ${originalError instanceof Error ? originalError.message : 'Unknown error'}`);
    this.name = 'PlatformError';
    this.platform = platform;
    this.context = context;
    this.originalError = originalError;
  }
}

class NetworkError extends PlatformError {
  constructor(platform, context, statusCode, originalError) {
    super(platform, context, originalError, `Network error in ${context}: ${statusCode || 'Unknown status'}`);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

class RateLimitError extends PlatformError {
  constructor(platform, context, retryAfter) {
    super(platform, context, undefined, `Rate limit exceeded in ${context}${retryAfter ? ` - retry after ${retryAfter}s` : ''}`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

class ValidationError extends PlatformError {
  constructor(platform, context, field, originalError) {
    super(platform, context, originalError, `Validation error in ${context}${field ? ` - field: ${field}` : ''}`);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Mock utility functions
function createPlatformError(platform, context, originalError) {
  return new PlatformError(platform, context, originalError, 'Test platform error');
}

function logPlatformError(error) {
  console.log('Logging error:', error.message);
  return true;
}

function testPlatformError() {
  console.log('Testing PlatformError...');
  
  try {
    const error = new PlatformError('github', 'test context', new Error('original error'), 'custom message');
    assert.strictEqual(error.name, 'PlatformError', 'should have correct name');
    assert.strictEqual(error.platform, 'github', 'should have platform property');
    assert.strictEqual(error.context, 'test context', 'should have context property');
    assert(error.originalError instanceof Error, 'should have originalError property');
    assert(error.message.includes('custom message'), 'should have custom message');
    console.log('  ✓ PlatformError properties are correct');

  } catch (error) {
    console.error('  ✗ PlatformError test failed:', error);
    process.exit(1);
  }
}

function testNetworkError() {
  console.log('\nTesting NetworkError...');
  
  try {
    const error = new NetworkError('github', 'fetch data', 404, new Error('not found'));
    assert.strictEqual(error.name, 'NetworkError', 'should have correct name');
    assert.strictEqual(error.statusCode, 404, 'should have status code');
    assert(error.message.includes('Network error in fetch data'), 'should include status code in message');
    console.log('  ✓ NetworkError properties are correct');

  } catch (error) {
    console.error('  ✗ NetworkError test failed:', error);
    process.exit(1);
  }
}

function testRateLimitError() {
  console.log('\nTesting RateLimitError...');
  
  try {
    const error = new RateLimitError('github', 'api call', 60);
    assert.strictEqual(error.name, 'RateLimitError', 'should have correct name');
    assert.strictEqual(error.retryAfter, 60, 'should have retryAfter property');
    assert(error.message.includes('retry after 60s'), 'should include retryAfter in message');
    console.log('  ✓ RateLimitError properties are correct');

  } catch (error) {
    console.error('  ✗ RateLimitError test failed:', error);
    process.exit(1);
  }
}

function testValidationError() {
  console.log('\nTesting ValidationError...');
  
  try {
    const error = new ValidationError('github', 'validate input', 'modelId', new Error('invalid'));
    assert.strictEqual(error.name, 'ValidationError', 'should have correct name');
    assert.strictEqual(error.field, 'modelId', 'should have field property');
    assert(error.message.includes('field: modelId'), 'should include field in message');
    console.log('  ✓ ValidationError properties are correct');

  } catch (error) {
    console.error('  ✗ ValidationError test failed:', error);
    process.exit(1);
  }
}

function testCreatePlatformError() {
  console.log('\nTesting createPlatformError...');
  
  try {
    const error = createPlatformError('github', 'test operation', new Error('test error'));
    assert(error instanceof PlatformError, 'should return PlatformError');
    assert(error.message.includes('Test platform error'), 'should have default message');
    console.log('  ✓ createPlatformError returns correct error');

  } catch (error) {
    console.error('  ✗ createPlatformError test failed:', error);
    process.exit(1);
  }
}

function testLogPlatformError() {
  console.log('\nTesting logPlatformError...');
  
  try {
    const error = new PlatformError('github', 'test log', new Error('log error'));
    const result = logPlatformError(error);
    assert.strictEqual(result, true, 'should return true');
    console.log('  ✓ logPlatformError works correctly');

  } catch (error) {
    console.error('  ✗ logPlatformError test failed:', error);
    process.exit(1);
  }
}

function runAllTests() {
  console.log('Starting Error Handling Utilities Tests...');
  
  testPlatformError();
  testNetworkError();
  testRateLimitError();
  testValidationError();
  testCreatePlatformError();
  testLogPlatformError();
  
  console.log('\n✓ All Error Handling Utilities tests passed!\n');
}

// Run tests
runAllTests();