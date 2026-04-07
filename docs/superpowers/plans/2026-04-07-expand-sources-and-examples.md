# Expand Model Sources & Usage Examples Plan

> **For agentic workers:** Use subagent-driven-development to implement this plan task-by-task.

**Goal:** Add more model sources (OpenRouter, Groq, Cohere) and generate usage examples for each model.

**Architecture:**
- New API clients for each source following existing BasePlatformAPI pattern
- Usage examples generated from model metadata (npm package, API endpoint)
- Examples stored in model data and displayed in UI

**Tech Stack:** Node.js fetch API, existing codebase patterns

---

## Task 1: Create OpenRouter API Client

**Files:**
- Create: `src/api/openrouter.ts`
- Modify: `src/api/index.ts` (export new client)
- Modify: `src/scraper/enhanced-scraper.ts` (add to platforms)

**API Endpoint:** `https://openrouter.ai/api/v1/models`

- [ ] **Step 1: Create OpenRouter API client**

```typescript
// src/api/openrouter.ts
import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  supported_parameters?: string[];
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

export class OpenRouterAPI extends BasePlatformAPI {
  readonly platform: Platform = 'openrouter';
  readonly rateLimitPerHour = 60;

  private apiKey?: string;

  constructor(config?: { apiKey?: string }) {
    super();
    this.apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY;
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json() as OpenRouterResponse;
      
      const items: AggregatedItem[] = data.data
        .filter(model => {
          const price = model.pricing?.prompt || '0';
          return parseFloat(price) === 0;
        })
        .map(model => this.normalizeModel(model));

      return { items, hasMore: false };
    } catch (error) {
      console.error(`[OpenRouter] Error:`, error);
      return { items: [], hasMore: false };
    }
  }

  private normalizeModel(model: OpenRouterModel): AggregatedItem {
    return {
      id: `openrouter-${model.id}`,
      platform: 'openrouter',
      type: 'model',
      title: model.name,
      content: model.description || '',
      author: { name: 'OpenRouter' },
      timestamp: new Date().toISOString(),
      url: `https://openrouter.ai/models/${model.id}`,
      metrics: {
        views: model.context_length
      },
      tags: model.supported_parameters || [],
      raw: model
    };
  }
}
```

- [ ] **Step 2: Export from api/index.ts**

```typescript
// Add to src/api/index.ts
export { OpenRouterAPI } from './openrouter.js';
```

- [ ] **Step 3: Update scraper config**

Modify enhanced-scraper to accept OpenRouter in platform configs

- [ ] **Step 4: Run typecheck and commit**

```bash
npm run typecheck
git add -A
git commit -m "feat: add OpenRouter API client"
```

---

## Task 2: Create Groq API Client

**Files:**
- Create: `src/api/groq.ts`
- Modify: `src/api/index.ts`

**API Endpoint:** `https://api.groq.com/openai/v1/models`

- [ ] **Step 1: Create Groq API client**

```typescript
// src/api/groq.ts
import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';

interface GroqModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  context_window: number;
}

export class GroqAPI extends BasePlatformAPI {
  readonly platform: Platform = 'groq';
  readonly rateLimitPerHour = 30;

  private apiKey?: string;

  constructor(config?: { apiKey?: string }) {
    super();
    this.apiKey = config?.apiKey || process.env.GROQ_API_KEY;
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      
      const freeModels = data.data.filter((m: GroqModel) => 
        m.id.includes('free') || m.id.includes('llama-3.3-70b')
      );

      const items: AggregatedItem[] = freeModels.map((model: GroqModel) => ({
        id: `groq-${model.id}`,
        platform: 'groq' as Platform,
        type: 'model' as const,
        title: model.id,
        content: `Context window: ${model.context_window} tokens`,
        author: { name: 'Groq' },
        timestamp: new Date(model.created * 1000).toISOString(),
        url: `https://console.groq.com/models/${model.id}`,
        metrics: { views: model.context_window },
        tags: ['free', 'fast'],
        raw: model
      }));

      return { items, hasMore: false };
    } catch (error) {
      console.error(`[Groq] Error:`, error);
      return { items: [], hasMore: false };
    }
  }
}
```

- [ ] **Step 2: Export from api/index.ts**

- [ ] **Step 3: Run typecheck and commit**

---

## Task 3: Create Cohere API Client

**Files:**
- Create: `src/api/cohere.ts`
- Modify: `src/api/index.ts`

**API Endpoint:** `https://api.cohere.ai/v1/models`

- [ ] **Step 1: Create Cohere API client**

```typescript
// src/api/cohere.ts
import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';

interface CohereModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing?: {
    input?: number;
    output?: number;
  };
}

export class CohereAPI extends BasePlatformAPI {
  readonly platform: Platform = 'cohere';
  readonly rateLimitPerHour = 60;

  private apiKey?: string;

  constructor(config?: { apiKey?: string }) {
    super();
    this.apiKey = config?.apiKey || process.env.COHERE_API_KEY;
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    try {
      const response = await fetch('https://api.cohere.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }

      const data = await response.json();
      
      const items: AggregatedItem[] = data.models
        .filter((m: CohereModel) => !m.pricing?.input || m.pricing.input === 0)
        .map((model: CohereModel) => ({
          id: `cohere-${model.id}`,
          platform: 'cohere' as Platform,
          type: 'model' as const,
          title: model.name,
          content: model.description || `Context: ${model.context_length} tokens`,
          author: { name: 'Cohere' },
          timestamp: new Date().toISOString(),
          url: `https:// Cohere.ai/models/${model.id}`,
          metrics: { views: model.context_length },
          tags: ['free', 'cohere'],
          raw: model
        }));

      return { items, hasMore: false };
    } catch (error) {
      console.error(`[Cohere] Error:`, error);
      return { items: [], hasMore: false };
    }
  }
}
```

- [ ] **Step 2: Export from api/index.ts**

- [ ] **Step 3: Run typecheck and commit**

---

## Task 4: Generate Usage Examples for Models

**Files:**
- Create: `src/utils/examples.ts`
- Modify: `src/services/models-dev-service.ts` (add examples to models)
- Modify: `src/types/index.ts` (add example field)

**Goal:** Generate code examples for each model based on npm package/API endpoint

- [ ] **Step 1: Add example field to types**

```typescript
// src/types/index.ts - Add to AggregatedItem or create Example interface
export interface ModelExample {
  language: 'javascript' | 'python' | 'curl';
  code: string;
  description: string;
}

// Add to AggregatedItem
export interface AggregatedItem {
  // ... existing fields
  examples?: ModelExample[];
}
```

- [ ] **Step 2: Create examples utility**

```typescript
// src/utils/examples.ts

interface ModelMeta {
  id: string;
  providerId: string;
  providerName?: string;
  npm?: string;
  api?: string;
}

export function generateExamples(model: ModelMeta): ModelExample[] {
  const examples: ModelExample[] = [];
  const provider = model.providerId.toLowerCase();
  const modelName = model.id.toLowerCase();

  // cURL example (works for all)
  examples.push({
    language: 'curl',
    description: 'Basic API call',
    code: generateCurlExample(model)
  });

  // JavaScript example
  examples.push({
    language: 'javascript',
    description: 'JavaScript/TypeScript example',
    code: generateJsExample(model)
  });

  // Python example
  examples.push({
    language: 'python',
    description: 'Python example',
    code: generatePythonExample(model)
  });

  return examples;
}

function generateCurlExample(model: ModelMeta): string {
  const endpoint = model.api || `https://api.${model.providerId}.com/v1/chat`;
  return `curl https://api.example.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model.id}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;
}

function generateJsExample(model: ModelMeta): string {
  return `import { ${model.providerName || 'ChatCompletion'} } from '${model.npm || '@ai-sdk/openai'}';

const response = await fetch('${model.api || 'https://api.example.com'}', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: '${model.id}',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});`;
}

function generatePythonExample(model: ModelMeta): string {
  return `from openai import OpenAI

client = OpenAI(api_key="your-api-key")

response = client.chat.completions.create(
    model="${model.id}",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`;
}
```

- [ ] **Step 3: Integrate into models-dev-service**

Modify `normalizeToAggregatedItem` to include examples:

```typescript
// In normalizeToAggregatedItem
const examples = generateExamples({
  id: model.id,
  providerId: model.providerId,
  providerName: model.providerName,
  npm: model.npm,
  api: model.api
});

return {
  // ... existing fields
  examples
};
```

- [ ] **Step 4: Run typecheck and commit**

---

## Task 5: Display Examples in UI

**Files:**
- Modify: `src/components/ModelCard.astro`
- Modify: `src/pages/index.astro`

**Goal:** Show usage examples when user clicks on a model

- [ ] **Step 1: Update ModelCard to show example tabs**

```astro
<!-- In ModelCard.astro -->
<div class="model-examples" id={`examples-${model.id}`}>
  <div class="example-tabs">
    <button class="tab active" data-lang="curl">cURL</button>
    <button class="tab" data-lang="javascript">JS</button>
    <button class="tab" data-lang="python">Python</button>
  </div>
  <pre class="example-code"><code>{model.examples?.[0]?.code || 'No example available'}</code></pre>
  <button class="copy-btn">Copy</button>
</div>
```

- [ ] **Step 2: Add CSS for examples**

```css
.model-examples {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.example-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.example-tabs button {
  padding: 0.25rem 0.75rem;
  background: #2a2a4a;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
}

.example-tabs button.active {
  background: #4a4aff;
}
```

- [ ] **Step 3: Commit**

---

## Task 6: Update Scraper to Aggregate All Sources

**Files:**
- Modify: `src/scraper/enhanced-scraper.ts`
- Modify: `src/scraper/cli.ts`

- [ ] **Step 1: Update scraper to fetch from all sources**

```typescript
// In performFullScrape or new aggregateSources method
const sources = [
  this.modelsDevAPI,
  new OpenRouterAPI(config.openrouter),
  new GroqAPI(config.groq),
  new CohereAPI(config.cohere)
];

const allModels: AggregatedItem[] = [];
for (const source of sources) {
  const result = await source.fetchItems();
  allModels.push(...result.items);
  await this.rateLimit();
}

// Deduplicate by model ID
const uniqueModels = deduplicateById(allModels);
```

- [ ] **Step 2: Update CLI to show all sources**

- [ ] **Step 3: Run typecheck and commit**

---

## Execution Order

1. Task 1: OpenRouter API Client
2. Task 2: Groq API Client
3. Task 3: Cohere API Client
4. Task 4: Usage Examples Generator
5. Task 5: Display Examples in UI
6. Task 6: Aggregate All Sources

---

## Dependencies

| Package | Purpose |
|---------|---------|
| None | Uses built-in fetch API |
