# AI4ALL Development Guidelines

This file provides guidelines for AI coding agents working on the AI4ALL project.

## Build, Lint, and Test Commands

### Core Development (Astro)
```bash
npm run dev              # Start Astro development server
npm run build           # Build static site to dist/ (memory-limited)
npm run preview         # Preview built site locally
```

### Scraper Commands
```bash
npm run scrape          # Run full 2-phase scraper with verification
npx tsx src/scraper/cli.ts [full|incremental]  # Direct scraper
```

### Code Quality
```bash
npm run lint            # Run ESLint
npm run typecheck      # Type-check without emitting
npx tsc --noEmit       # Type-check only
```

---

## TypeScript Configuration
- **Target:** ES2018
- **Strict mode:** Enabled
- **Module:** ESNext with bundler resolution
- **Always use explicit types** for function parameters and return values

---

## Code Style Guidelines

### Imports and Exports
- Use ES modules (`import`/`export`, not CommonJS)
- Use named exports for all public APIs
- Group imports: external packages first, then internal modules
- Use `.js` extension in imports for ESM compatibility

```typescript
import { GitHubAPI } from '../api/github.js';
import { AggregatedItem } from '../types/index.js';
```

### Naming Conventions
- **Interfaces/Types**: PascalCase (`ScraperConfig`, `FetchResult`, `Platform`)
- **Classes**: PascalCase (`ScraperService`, `DataStore`)
- **Variables/functions**: camelCase (`scrapeAll`, `fetchItems`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`, `API_TIMEOUT`)
- **Files**: kebab-case for utilities, PascalCase for classes

### Error Handling
- Never use `any` for error types; use `unknown` and type guards
- Wrap async operations in try/catch blocks
- Create typed error objects with platform context
- Log errors with `[platform]` prefix

```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[${this.platform}] Error in ${context}:`, errorMessage);
  return new Error(`[${this.platform}] ${context}: ${errorMessage}`);
}
```

### Async and Promises
- Always `await` async functions or properly chain promises
- Use `async/await` over raw promises
- Handle promise rejections with try/catch

---

## File Organization

```
src/
├── api/           # Platform API implementations (github.ts, reddit.ts, etc.)
├── components/    # Astro UI components (.astro files)
├── data/          # Data layer (verification-store.ts, models.ts)
├── layouts/       # Astro layout templates
├── pages/         # Astro pages (index.astro is homepage)
├── scraper/        # 2-phase scraper orchestration
├── services/      # Core service modules
├── types/         # TypeScript interfaces and types
└── utils/         # Utility functions
```

---

## Console Logging
- Use structured logs with prefixes: `[Scraper]`, `[GitHub]`, etc.
- Prefix success with `✓`, errors with `✗`
- Log operation start/end with platform name
- Use `console.warn` for non-critical, `console.error` for failures

---

## General Rules
- No comments unless explaining complex business logic
- Keep functions small and focused (< 50 lines when possible)
- Use early returns to reduce nesting
- Destructure objects for cleaner parameter handling

---

## Platform API Requirements

Each platform API must extend `BasePlatformAPI`:
```typescript
interface BasePlatformAPI {
  readonly platform: Platform;
  readonly rateLimitPerHour: number;
  fetchItems(options?: FetchOptions): Promise<FetchResult>;
  rateLimit(): Promise<void>;
  handleError(error: unknown, context: string): Error;
}
```

---

## Puppeteer Integration (for JavaScript-rendered pages)

When scraping pages that require JS (router admin, dynamic content):

```typescript
// Use puppeteer-core with system Chromium
import puppeteer from 'puppeteer-core';

const CHROMIUM_PATH = '/usr/bin/chromium';

const browser = await puppeteer.launch({
  executablePath: CHROMIUM_PATH,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--single-process']
});

// CRITICAL: Always close browser after use
await browser.close();
```

---

## Raspberry Pi Constraints

**Device:** Raspberry Pi 3B+ (906MB RAM, 1GB Swap)

### Memory Limits
- Keep Node.js under 512MB: `NODE_OPTIONS=--max_old_space_size=512`
- Puppeteer uses ~150MB - only launch when needed
- Always close browser immediately after scrape

### What Works
- Astro (static site generation)
- Nginx (reverse proxy)
- Python data server

### What Doesn't Work
- Next.js, React SSR, Vue SSR
- MongoDB, PostgreSQL
- Docker (multiple containers)

---

## Version Control
- Use conventional commits: `<emoji> <type>: <description>`
- Commit types: feat, fix, docs, style, refactor, perf, test, chore
- Push to `main` after successful tests

---

## Additional Resources
- **README.md**: Project overview
- **PUBLIC-ACCESS-GUIDE.md**: Raspberry Pi hosting setup
