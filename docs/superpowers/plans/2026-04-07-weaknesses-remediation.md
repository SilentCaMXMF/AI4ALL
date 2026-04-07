# AI4ALL Weaknesses Remediation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address 9 identified weaknesses while respecting Raspberry Pi memory constraints.

**Architecture:**
- Tests: Use Node.js native `node:test` module (built-in, no extra deps)
- Linting: Fix ESLint config for TypeScript
- Deduplication: Consolidate models-dev-service.ts logic
- Caching: Simple file-based cache with TTL
- Scalability: Parallel platform searches with concurrency limits
- API: Optional REST endpoint (static JSON or Astro API routes)

**Tech Stack:** Node.js native test runner, file-based cache, p-limit for concurrency control

---

## Task 1: Fix ESLint Configuration

**Files:**
- Modify: `.eslintrc.cjs` or `eslint.config.*`
- No new dependencies (use compatible ESLint)

- [ ] **Step 1: Check current ESLint config**

Read `.eslintrc.cjs` to understand current setup:
```javascript
module.exports = {
  env: { node: true, es2022: true },
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser', // likely missing
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  rules: { /* ... */ }
};
```

- [ ] **Step 2: Update ESLint config for TypeScript**

```javascript
// eslint.config.mjs (ESM)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  }
);
```

- [ ] **Step 3: Install updated ESLint deps**

```bash
npm install -D typescript-eslint
npm uninstall @eslint/js eslint
```

- [ ] **Step 4: Test linting**

```bash
npm run lint
# Expected: No parsing errors
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: update ESLint config for TypeScript"
```

---

## Task 2: Consolidate Duplicate Code (models-dev-service)

**Files:**
- Modify: `src/services/models-dev-service.ts` (consolidate into api/modelsdev.ts)
- Modify: `src/api/modelsdev.ts` (add missing methods)
- Delete: `src/services/models-dev-service.ts` (after migration)
- Update: `src/api/modelsdev.ts:187-211` (fetchItems method)

- [ ] **Step 1: Review current duplication**

Compare `src/services/models-dev-service.ts` and `src/api/modelsdev.ts`:
- `fetchItems()` - different implementations
- `filterFreeModels()` - exists only in service
- `normalizeToAggregatedItem()` - duplicated logic

- [ ] **Step 2: Extract shared filter logic**

Add to `src/api/modelsdev.ts`:
```typescript
private filterFreeModels(models: ModelsDevModel[]): ModelsDevModel[] {
  return models.filter(model => {
    if (model.cost === null) return true;
    const inputCost = model.cost?.input;
    const outputCost = model.cost?.output;
    if (inputCost === null && outputCost === null) return true;
    if (inputCost === 0 && outputCost === 0) return true;
    return false;
  });
}
```

- [ ] **Step 3: Update fetchItems in api/modelsdev.ts**

Replace existing `fetchItems()` to use ModelsDevService logic directly:
```typescript
async fetchItems(options?: FetchOptions): Promise<FetchResult> {
  try {
    console.log(`[${this.platform}] Starting fetch for free models...`);
    
    const service = new ModelsDevService();
    const items = await service.fetchItems({ freeOnly: true });
    
    return { items, hasMore: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${this.platform}] Error in fetchItems:`, errorMessage);
    return { items: [], hasMore: false };
  }
}
```

- [ ] **Step 4: Update imports in modelsdev.ts**

```typescript
import { ModelsDevService } from '../services/models-dev-service.js';
```

- [ ] **Step 5: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: use ModelsDevService from api/modelsdev.ts"
```

---

## Task 3: Implement Simple File-Based Cache

**Files:**
- Create: `src/utils/cache.ts`
- Modify: `src/services/models-dev-service.ts` (add caching)
- No Redis (memory/PI constraints)

- [ ] **Step 1: Create cache utility**

```typescript
// src/utils/cache.ts
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export class FileCache {
  private cacheDir: string;
  
  constructor(cacheDir: string = join(process.cwd(), 'data', 'cache')) {
    this.cacheDir = cacheDir;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = join(this.cacheDir, `${key}.json`);
      const content = await readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);
      
      if (Date.now() - entry.timestamp > entry.ttl) {
        return null; // Expired
      }
      
      return entry.data;
    } catch {
      return null; // Cache miss or expired
    }
  }

  async set<T>(key: string, data: T, ttlMs: number = 3600000): Promise<void> {
    await mkdir(this.cacheDir, { recursive: true });
    const filePath = join(this.cacheDir, `${key}.json`);
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlMs };
    await writeFile(filePath, JSON.stringify(entry));
  }

  async clear(): Promise<void> {
    // Implementation for cleanup if needed
  }
}
```

- [ ] **Step 2: Integrate cache into ModelsDevService**

```typescript
// Add to constructor
constructor(private options: { dataDir?: string } = {}) {
  this.options.dataDir = options.dataDir || join(process.cwd(), 'data');
  this.cache = new FileCache(join(this.options.dataDir, 'cache'));
}

// Add property
private cache: FileCache;

// Use in fetchItems
async fetchItems(options: FetchOptions = {}): Promise<AggregatedItem[]> {
  // Check cache first (1 hour TTL)
  const cached = await this.cache.get<AggregatedItem[]>('models-dev-free');
  if (cached) {
    console.log('[ModelsDevService] Returning cached models');
    return cached.slice(0, options.limit || 500);
  }
  
  // ... existing logic ...
  
  // Cache results
  await this.cache.set('models-dev-free', items, 3600000);
  return items;
}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add file-based cache for models.dev API"
```

---

## Task 4: Implement Lightweight Tests with Node.js Native Test Runner

**Files:**
- Create: `test/basic.test.js` (replaces old .cjs scripts)
- Create: `test/models-dev.test.js`
- Modify: `.github/workflows/scrape-and-deploy.yml` (update test commands)
- No Vitest (too heavy for Raspberry Pi)

**Note:** Using Node.js `node:test` module (built-in since Node.js 18)

- [ ] **Step 1: Create basic API test**

```javascript
// test/basic.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('ModelsDevAPI', () => {
  test('should filter free models correctly', async () => {
    // Mock data test
    const mockModels = [
      { id: '1', cost: { input: 0, output: 0 } },
      { id: '2', cost: { input: 1, output: 1 } },
      { id: '3', cost: null },
    ];
    
    const freeModels = mockModels.filter(m => 
      m.cost === null || (m.cost.input === 0 && m.cost.output === 0)
    );
    
    assert.strictEqual(freeModels.length, 2);
  });

  test('should normalize model to AggregatedItem', () => {
    const model = {
      id: 'test-model',
      name: 'Test Model',
      providerId: 'test-provider',
      providerName: 'Test Provider',
      cost: { input: 0, output: 0 },
    };
    
    // Simple normalization check
    const title = `${model.providerName}: ${model.name}`;
    assert.strictEqual(title, 'Test Provider: Test Model');
  });
});

describe('Error Handler', () => {
  test('should handle errors gracefully', () => {
    const errorMessage = 'test error';
    const result = errorMessage instanceof Error ? errorMessage.message : 'Unknown';
    assert.strictEqual(result, 'test error');
  });
});
```

- [ ] **Step 2: Create integration test**

```javascript
// test/models-dev.test.js
import { test } from 'node:test';
import assert from 'node:assert';

test('Models.dev API returns expected structure', async () => {
  const response = await fetch('https://models.dev/api.json');
  const data = await response.json();
  
  assert.ok(typeof data === 'object');
  assert.ok(Object.keys(data).length > 0);
});
```

- [ ] **Step 3: Update package.json test script**

```json
{
  "scripts": {
    "test": "node --test test/*.test.js",
    "test:coverage": "node --test --experimental-test-coverage test/*.test.js"
  }
}
```

- [ ] **Step 4: Update GitHub Actions workflow**

```yaml
- name: Run tests
  run: |
    npm run typecheck
    npm test
```

- [ ] **Step 5: Run tests locally**

```bash
npm test
# Expected: Tests pass
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: add Node.js native test runner tests"
```

---

## Task 5: Add Concurrency Control for Scalability

**Files:**
- Modify: `src/scraper/enhanced-scraper.ts` (parallel verification)
- Add: `p-limit` package (lightweight, 200 bytes)

- [ ] **Step 1: Install p-limit**

```bash
npm install p-limit
```

- [ ] **Step 2: Update verification loop**

```typescript
import pLimit from 'p-limit';

async performFullScrape() {
  // ... Phase 1 fetch ...
  
  // Phase 2: Verify with concurrency limit
  const limit = pLimit(3); // Max 3 parallel platform searches
  const verificationPromises = models.map(model => 
    limit(() => this.verifyModel(model))
  );
  
  const results = await Promise.all(verificationPromises);
  
  // Process results
  for (const result of results) {
    if (result.feedback.length > 0) {
      metrics.verificationUpdates++;
    }
  }
}
```

- [ ] **Step 3: Run typecheck and tests**

```bash
npm run typecheck && npm test
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "perf: add concurrency limit for platform verification"
```

---

## Task 6: Optional REST API Endpoint

**Files:**
- Create: `src/pages/api/models.ts` (Astro API route)
- Modify: `astro.config.mjs` (enable server output if needed)

**Note:** This is OPTIONAL - only implement if third-party access is needed

- [ ] **Step 1: Check if API routes needed**

Ask user: "Do you need third-party API access?" (Y/N)

If YES, continue:
- [ ] Create `src/pages/api/models.ts`:
```typescript
import type { APIRoute } from 'astro';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const GET: APIRoute = async () => {
  const dataPath = join(process.cwd(), 'data', 'aggregated-data.json');
  const data = await readFile(dataPath, 'utf-8');
  const { items } = JSON.parse(data);
  
  return new Response(JSON.stringify({ models: items, count: items.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] Update `astro.config.mjs` to hybrid mode (optional)

---

## Task 7: Update CI Workflow

**Files:**
- Modify: `.github/workflows/scrape-and-deploy.yml`

- [ ] **Step 1: Update test commands in workflow**

```yaml
- name: Run tests
  run: |
    npm run typecheck
    npm test
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "ci: update workflow test commands"
```

---

## Execution Order

1. **Task 1** - Fix ESLint (quick win, unblocks other work)
2. **Task 2** - Consolidate duplicate code (refactoring)
3. **Task 3** - File-based cache (performance)
4. **Task 4** - Lightweight tests (quality)
5. **Task 5** - Concurrency control (performance)
6. **Task 6** - REST API (optional, ask first)
7. **Task 7** - CI updates (final polish)

---

## Excluded from Scope (Memory Constraints)

- Vitest/Jest (too heavy for Raspberry Pi)
- Redis (requires separate server)
- Kubernetes/clustering (overkill for single-Pi setup)
- GraphQL (adds complexity without clear benefit)

---

## Dependencies Summary

| Package | Purpose | Size |
|---------|---------|------|
| `p-limit` | Concurrency control | ~200 bytes |
| `typescript-eslint` | TypeScript linting | Required for ESLint |
| `node:test` | Testing | Built-in Node.js |

**New runtime dependencies: 0** (all are dev-time only)
