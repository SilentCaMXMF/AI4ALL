# AI4ALL Development Guidelines

## Build, Lint, and Test Commands

```bash
# Development
npm run dev                    # Start Astro development server
npm run build                  # Build for production
npm run preview                # Preview production build

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

# TypeScript
npx tsc --noEmit               # Type-check only
```

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022 with strict mode enabled
- Module: ESNext with bundler resolution
- JSX: preserve (Astro)
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
- `src/pages/` - Astro pages
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

## Testing Guidelines

Test files are located in the `test/` directory. Run test scripts directly with Node.js:

```bash
# Run test scripts
node test/test-github-api.js
node test/test-all-platforms.js
```

## Platform-Specific Guidelines

### GitHub API
- Use GitHub REST API v3
- Respect rate limits (5000 req/hour)
- Handle rate limiting with exponential backoff
- Cache search results to avoid duplicate requests

### Reddit API
- Use OAuth2 for authentication
- Respect rate limits (60 req/minute)
- Handle rate limiting with exponential backoff
- Cache search results to avoid duplicate requests

### Stack Overflow API
- Use Stack Exchange API v2.3
- Respect rate limits (300 req/day without key)
- Handle rate limiting with exponential backoff
- Cache search results to avoid duplicate requests

### Discord API
- Use Discord Bot token authentication
- Respect rate limits (1000 req/minute)
- Handle rate limiting with exponential backoff
- Cache search results to avoid duplicate requests

### X (Twitter) API
- Use Bearer token authentication
- Respect rate limits (varies by endpoint)
- Handle rate limiting with exponential backoff
- Cache search results to avoid duplicate requests

### Models.dev API
- Use API key authentication
- Respect rate limits (60 req/hour)
- Handle rate limiting with exponential backoff
- Cache search results to avoid duplicate requests

## Security Guidelines

### API Keys and Secrets
- Never commit API keys to repository
- Use GitHub Secrets for production environment variables
- Use `.env.local` for development environment variables
- Rotate API keys regularly

### Data Handling
- Never log sensitive data
- Use HTTPS for all API calls
- Validate and sanitize all external data
- Use rate limiting to prevent abuse

## Performance Guidelines

### Scraping Performance
- Implement rate limiting for all API calls
- Use caching to avoid duplicate requests
- Batch API requests when possible
- Use pagination for large result sets

### Memory Management
- Use streaming for large data sets
- Clean up temporary files
- Monitor memory usage during scraping
- Implement proper error recovery

## Documentation Guidelines

### Code Documentation
- Document complex business logic
- Document API integrations and rate limits
- Document data transformation processes
- Use JSDoc for public APIs

### Project Documentation
- Keep README.md updated with current setup
- Document API integration requirements
- Document deployment and maintenance procedures
- Include troubleshooting guides
