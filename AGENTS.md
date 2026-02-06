# AI4ALL Development Guidelines

## Build, Lint, and Test Commands

```bash
# Development
npm run dev                    # Start Next.js development server
npm run build                  # Build for production
npm run start                  # Start production server

# Scraper Commands
npm run scrape                 # Run full scraper
npm run scrape:github          # Scrape GitHub only
npm run scrape:reddit          # Scrape Reddit only
npm run scrape:stackoverflow   # Scrape Stack Overflow only

# Scheduling
npm run schedule               # Run GitHub distribution scheduler

# Code Quality
npm run lint                   # Run ESLint on .ts/.tsx files
npm run typecheck              # Type-check without emitting
npm run test                   # Run all tests
npm run test -- src/file.test.ts  # Run single test file (vitest)
npm run test -- --run          # Run tests once (no watch mode)

# TypeScript
npx tsc --noEmit               # Type-check only
```

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022 with strict mode enabled
- Module: ESNext with bundler resolution
- JSX: preserve (Next.js App Router)
- Always use explicit types for function parameters and return values

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
- **Interfaces**: PascalCase with descriptive names (`ScraperConfig`, `FetchResult`)
- **Types**: Same as interfaces (`Platform`, `ContentType`)
- **Classes**: PascalCase (`ScraperService`, `DataStore`)
- **Variables/functions**: camelCase (`scrapeAll`, `fetchItems`)
- **Constants**: SCREAMING_SNAKE_CASE for config values
- **Files**: kebab-case for utilities, PascalCase for components/classes

### Error Handling
- Never use `any` for error types; use `unknown` and type guards
- Wrap async operations in try/catch blocks
- Create typed error objects with platform context
- Log errors with `[platform] prefix for filtering

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

### Platform Architecture
- Each platform API extends `BasePlatformAPI`
- Implement `fetchItems(options?: FetchOptions): Promise<FetchResult>`
- Respect rate limits: minimum 1 second between requests
- Use unified `AggregatedItem` format for all platforms

### Data Types
```typescript
export type Platform = 'github' | 'reddit' | 'stackoverflow' | 'discord' | 'x' | 'modelsdev';
export type ContentType = 'repository' | 'issue' | 'post' | 'comment' | 'question' | 'answer' | 'model';
```

### File Organization
- `src/api/` - Platform API implementations
- `src/scraper/` - Scraper orchestration
- `src/types/` - TypeScript interfaces and types
- `src/data/` - Data storage and persistence
- `src/app/` - Next.js App Router pages
- `public/` - Static assets

### Console Logging
- Use structured logs with prefixes: `[Scraper]`, `[GitHub]`, etc.
- Prefix success with `✓`, errors with `✗`
- Log operation start/end with platform name

### General Rules
- No comments unless explaining complex business logic
- Keep functions small and focused (< 50 lines when possible)
- Use early returns to reduce nesting
- Destructure objects for cleaner parameter handling
- Use `console.warn` for non-critical issues, `console.error` for failures

## Planning and Task Management

This project uses the **opencode-planning-toolkit** plugin for structured task management. Add to `opencode.json`:
```json
{"plugins": ["@howaboua/opencode-planning-toolkit@latest"]}
```

### Available Tools
- **`create_spec`** - Create a reusable specification (repo-level or feature-specific)
- **`create_plan`** - Create an actionable work plan with implementation steps (min 5)
- **`append_spec`** - Link an existing spec to a plan
- **`read_plan`** - Read a plan with all linked spec content expanded inline
- **`mark_plan_done`** - Mark a plan as complete (status: active → done)

### File Organization
```
docs/
├── specs/     # Reusable specifications (*.md)
└── plans/     # Work plans (*.md)
```

### Workflow
1. Create Specs for reusable standards/patterns (`create_spec`)
2. Create Plans with step-by-step implementation (`create_plan`)
3. Link Specs to Plans (`append_spec`)
4. Read full context before work (`read_plan`)
5. Mark complete when done (`mark_plan_done`)
