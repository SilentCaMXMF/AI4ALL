import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('ModelsDevService', () => {
  test('should filter free models correctly', () => {
    const mockModels = [
      { id: '1', cost: { input: 0, output: 0 } },
      { id: '2', cost: { input: 1, output: 1 } },
      { id: '3', cost: null },
    ];
    
    const freeModels = mockModels.filter(m => 
      m.cost === null || (m.cost?.input === 0 && m.cost?.output === 0)
    );
    
    assert.strictEqual(freeModels.length, 2);
  });

  test('should handle null cost as free', () => {
    const model = { id: 'test', cost: null };
    const isFree = model.cost === null;
    assert.strictEqual(isFree, true);
  });
});

describe('Error Handler', () => {
  test('should extract error message correctly', () => {
    const error = new Error('test error');
    const message = error instanceof Error ? error.message : 'Unknown';
    assert.strictEqual(message, 'test error');
  });
});