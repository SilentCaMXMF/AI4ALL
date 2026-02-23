// Simple test for sentiment analysis
const assert = require('assert');

console.log('=== Testing Sentiment Analysis ===\n');

// Mock sentiment analysis functions
function analyzeSentiment(text) {
  const positiveKeywords = [
    'working', 'available', 'free tier', 'no cost', 'great',
    'excellent', 'amazing', 'love', 'best', 'awesome',
    'perfect', 'fantastic', 'wonderful', 'incredible', 'outstanding'
  ];

  const negativeKeywords = [
    'not working', 'rate limit', 'quota', 'unavailable', 'error',
    'failed', 'deprecated', 'paid only', 'requires payment', 'access denied',
    'invalid API key', 'not available', 'broken', 'doesn\u0027t work', 'issues'
  ];

  const positiveCount = positiveKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  ).length;

  const negativeCount = negativeKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  ).length;

  return {
    positive: positiveCount,
    negative: negativeCount,
    neutral: 1,
    sentiment: positiveCount > negativeCount ? 'positive' : 
               negativeCount > positiveCount ? 'negative' : 'neutral'
  };
}

function calculateTrustScore(feedback) {
  const total = feedback.length;
  if (total === 0) return 0;

  const positive = feedback.filter(f => f.sentiment === 'positive').length;
  const negative = feedback.filter(f => f.sentiment === 'negative').length;

  return Math.round((positive / total) * 100);
}

function classifyVerificationLevel(score) {
  if (score >= 70) return 'Strongly verified';
  if (score >= 50) return 'Likely working';
  if (score >= 30) return 'Reported issues';
  return 'Mixed results';
}

function detectCommonIssues(text) {
  const issueKeywords = [
    'rate limit', 'quota', 'unavailable', 'error', 'failed',
    'deprecated', 'paid only', 'requires payment', 'access denied',
    'invalid API key', 'not available', 'broken', 'doesn\u0027t work', 'issues'
  ];

  return issueKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  );
}

function testAnalyzeSentiment() {
  console.log('Testing analyzeSentiment...');
  
  try {
    // Test positive sentiment
    const result1 = analyzeSentiment('This model is working great and completely free!');
    assert.strictEqual(result1.sentiment, 'positive', 'should detect positive sentiment');
    assert(result1.positive > 0, 'should have positive keywords');
    console.log('  ✓ Detects positive sentiment correctly');

    // Test negative sentiment
    const result2 = analyzeSentiment('This model has rate limit issues and doesn\u0027t work.');
    assert.strictEqual(result2.sentiment, 'negative', 'should detect negative sentiment');
    assert(result2.negative > 0, 'should have negative keywords');
    console.log('  ✓ Detects negative sentiment correctly');

    // Test neutral sentiment
    const result3 = analyzeSentiment('This is a model with no strong opinions.');
    assert.strictEqual(result3.sentiment, 'neutral', 'should detect neutral sentiment');
    console.log('  ✓ Detects neutral sentiment correctly');

    // Test empty text
    const result4 = analyzeSentiment('');
    assert.strictEqual(result4.sentiment, 'neutral', 'should handle empty text');
    console.log('  ✓ Handles empty text gracefully');

  } catch (error) {
    console.error('  ✗ analyzeSentiment test failed:', error);
    process.exit(1);
  }
}

function testCalculateTrustScore() {
  console.log('\nTesting calculateTrustScore...');
  
  try {
    // Test with all positive feedback
    const feedback1 = [
      { sentiment: 'positive' }, { sentiment: 'positive' }, { sentiment: 'positive' }
    ];
    const score1 = calculateTrustScore(feedback1);
    assert.strictEqual(score1, 100, 'should return 100 for all positive');
    console.log('  ✓ Calculates 100% for all positive feedback');

    // Test with mixed feedback
    const feedback2 = [
      { sentiment: 'positive' }, { sentiment: 'negative' }, { sentiment: 'positive' }
    ];
    const score2 = calculateTrustScore(feedback2);
    assert.strictEqual(score2, 67, 'should calculate correct percentage');
    console.log('  ✓ Calculates correct percentage for mixed feedback');

    // Test with no feedback
    const score3 = calculateTrustScore([]);
    assert.strictEqual(score3, 0, 'should return 0 for no feedback');
    console.log('  ✓ Returns 0 for no feedback');

  } catch (error) {
    console.error('  ✗ calculateTrustScore test failed:', error);
    process.exit(1);
  }
}

function testClassifyVerificationLevel() {
  console.log('\nTesting classifyVerificationLevel...');
  
  try {
    // Test strongly verified
    const level1 = classifyVerificationLevel(85);
    assert.strictEqual(level1, 'Strongly verified', 'should classify as strongly verified');
    console.log('  ✓ Classifies >= 70% as strongly verified');

    // Test likely working
    const level2 = classifyVerificationLevel(55);
    assert.strictEqual(level2, 'Likely working', 'should classify as likely working');
    console.log('  ✓ Classifies >= 50% as likely working');

    // Test reported issues
    const level3 = classifyVerificationLevel(35);
    assert.strictEqual(level3, 'Reported issues', 'should classify as reported issues');
    console.log('  ✓ Classifies >= 30% as reported issues');

    // Test mixed results
    const level4 = classifyVerificationLevel(20);
    assert.strictEqual(level4, 'Mixed results', 'should classify as mixed results');
    console.log('  ✓ Classifies < 30% as mixed results');

  } catch (error) {
    console.error('  ✗ classifyVerificationLevel test failed:', error);
    process.exit(1);
  }
}

function testDetectCommonIssues() {
  console.log('\nTesting detectCommonIssues...');
  
  try {
    // Test with rate limit issue
    const issues1 = detectCommonIssues('This model has rate limit issues.');
    assert(Array.isArray(issues1), 'should return array');
    assert(issues1.includes('rate limit'), 'should detect rate limit issue');
    console.log('  ✓ Detects rate limit issues');

    // Test with multiple issues
    const issues2 = detectCommonIssues('This model is paid only and has quota issues.');
    assert(issues2.includes('paid only'), 'should detect paid only issue');
    assert(issues2.includes('quota'), 'should detect quota issue');
    console.log('  ✓ Detects multiple issues');

    // Test with no issues
    const issues3 = detectCommonIssues('This model works perfectly.');
    assert.strictEqual(issues3.length, 0, 'should return empty array for no issues');
    console.log('  ✓ Returns empty array for no issues');

  } catch (error) {
    console.error('  ✗ detectCommonIssues test failed:', error);
    process.exit(1);
  }
}

function runAllTests() {
  console.log('Starting Sentiment Analysis Tests...');
  
  testAnalyzeSentiment();
  testCalculateTrustScore();
  testClassifyVerificationLevel();
  testDetectCommonIssues();
  
  console.log('\n✓ All Sentiment Analysis tests passed!\n');
}

// Run tests
runAllTests();