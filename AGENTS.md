# AI4ALL Development Guidelines

This file provides guidelines and commands for AI coding agents working on the AI4ALL project.

## Build, Lint, and Test Commands

### Core Development (Astro)
```bash
npm run dev              # Start Astro development server
npm run build            # Build static site to dist/
npm run preview          # Preview built site locally
```

### 2-Phase Scraper Commands
```bash
npm run scrape           # Run full 2-phase scraper with verification
```

### Code Quality
```bash
npm run lint            # Run ESLint
npm run typecheck       # Type-check without emitting
npx tsc --noEmit       # Type-check only
```

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022 with strict mode enabled
- Module: ESNext with bundler resolution
- Always use explicit types for function parameters and return values
- Astro uses .astro files for components with TypeScript support

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
- Log errors with `[platform]` prefix for filtering

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

### 2-Phase Scraping Architecture

**Phase 1 - Model Discovery:**
- Fetch models from models.dev API
- Filter for 0-cost models (input = 0 AND output = 0)
- Store in aggregated database

**Phase 2 - Social Verification:**
- Search GitHub, Stack Overflow for model mentions
- Analyze sentiment (positive/negative/neutral)
- Calculate verification score (0-100%)
- Flag common issues (rate limits, availability)

**Data Types:**
```typescript
export type Platform = 'github' | 'reddit' | 'stackoverflow' | 'discord' | 'x' | 'modelsdev';
export type ContentType = 'repository' | 'issue' | 'post' | 'comment' | 'question' | 'answer' | 'model';

interface FeedbackSummary {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  verificationScore: number;      // 0-100%
  verificationLevel: string;       // 'confirmed', 'questioned', 'unknown'
  availabilityStatus: 'confirmed' | 'questioned' | 'unknown';
  commonIssues: string[];
}
```

### File Organization
- `src/api/` - Platform API implementations
- `src/components/` - Astro UI components (.astro files)
- `src/data/` - Data layer (models.ts for loading/filtering)
- `src/layouts/` - Astro layout templates
- `src/pages/` - Astro pages (index.astro is homepage)
- `src/scraper/` - 2-phase scraper orchestration
- `src/services/` - Core service modules
- `src/types/` - TypeScript interfaces and types
- `src/utils/` - Utility functions
- `data/` - Aggregated data files
- `dist/` - Astro build output (static HTML/CSS/JS)

### Console Logging
- Use structured logs with prefixes: `[Scraper]`, `[GitHub]`, etc.
- Prefix success with `✓`, errors with `✗`
- Log operation start/end with platform name
- Use `console.warn` for non-critical issues, `console.error` for failures

### General Rules
- No comments unless explaining complex business logic
- Keep functions small and focused (< 50 lines when possible)
- Use early returns to reduce nesting
- Destructure objects for cleaner parameter handling

## Raspberry Pi Hardware Constraints

**Device:** Raspberry Pi 3B+  
**RAM:** ~906MB total (900MB usable, ~100MB reserved for GPU)  
**CPU:** ARM Cortex-A53 quad-core @ 1.4GHz  
**Swap:** 512MB configured

### Current System Resources (Verified)

```
               total        used        free      shared  buff/cache   available
Mem:           906Mi       676Mi        32Mi       680Ki       252Mi       229Mi
Swap:          511Mi        95Mi       416Mi
```

**Active Services Memory Usage:**
- Nginx (4 workers): ~28 MB
- Python data server: ~9 MB
- Total for serving: ~37 MB

### Why These Constraints Matter

The Raspberry Pi 3B+ has limited resources compared to modern development machines. Understanding these constraints is critical when choosing frameworks, libraries, and build tools.

### What CAN Run on This Device

#### Web Frameworks (Tested & Working)
- **Astro** - Static site generator (current choice)
  - Build time: ~15-20 seconds
  - Memory usage during build: ~300-400MB
  - Generates static HTML (no runtime Node.js needed)
  
- **Hugo** - Go-based static site generator
  - Extremely fast builds
  - Low memory footprint (~100-200MB)
  - Single binary, no runtime dependencies
  
- **Eleventy (11ty)** - JavaScript-based SSG
  - Moderate memory usage
  - Good for simple sites
  
- **Plain HTML/CSS/JS** - Minimal overhead

#### Web Servers
- **Nginx** - Lightweight reverse proxy (current choice)
  - Very low memory footprint (~50MB)
  - Excellent for static file serving
  
- **Lighttpd** - Ultra-lightweight alternative
  - Even lower memory than Nginx
  - Suitable for minimal setups

- **Caddy** - Automatic HTTPS
  - Simple configuration
  - Slightly higher memory than Nginx

#### What CANNOT Run on This Device

| Framework/Tool | Reason |
|---------------|--------|
| **Next.js** | Requires 4GB+ RAM for builds, heavy Node.js runtime |
| **React SSR** | High memory consumption |
| **Vue SSR** | Memory-intensive server rendering |
| **Express.js (heavy)** | Can work but avoid complex middleware stacks |
| **MongoDB** | Requires significant RAM for decent performance |
| **PostgreSQL** | Better on devices with 2GB+ RAM |
| **Docker (multiple containers)** | Each container adds overhead |
| **GitLab** | Requires 2GB+ minimum |

### Build Memory Optimization

When running builds on the Pi:

```bash
# Limit Node.js memory for Astro builds
NODE_OPTIONS=--max_old_space_size=512 npm run build

# Alternative: Use swap file for occasional spikes
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Guidelines for Adding Dependencies

1. **Before adding any npm package:**
   - Check if it's lightweight (< 100KB minified)
   - Verify it doesn't pull heavy transitive dependencies
   - Test memory usage: `npm pkg set scripts.memcheck="node --max-old-space-size=256 -e 'require(\"./src/pages/index.astro\")'"`

2. **Avoid these patterns:**
   - Large UI component libraries (Material UI, Ant Design)
   - Heavy data processing libraries
   - Multiple similar packages (pick one)

3. **Prefer:**
   - Vanilla CSS or lightweight solutions (Tailwind is OK since it's compiled away)
   - Static generation over server-side rendering
   - Client-side JS compiled/minified by Astro

### Current Stack Validation

The current Astro setup has been validated to work on this device:
- Build completes in ~15-20 seconds
- Memory stays under 500MB during build
- Static output served by Nginx uses ~28MB
- Python data server uses ~9MB
- Total system memory usage: ~700MB with headroom for OS

### Future Considerations

If you need to add features that require heavier frameworks:
1. Consider if static export is possible
2. Offload heavy processing to CI/CD (GitHub Actions)
3. Pre-generate data during build rather than runtime
4. Consider upgrading to Raspberry Pi 4 (4GB+) for more flexibility

## Raspberry Pi Deployment

**Live URL:** https://freeai4all.duckdns.org

**Infrastructure:**
- Raspberry Pi 3B+ with Nginx reverse proxy (900MB RAM available)
- DuckDNS for dynamic DNS (updates every 5 minutes)
- Let's Encrypt SSL certificates
- GitHub Actions for hourly data updates

**Commands:**
```bash
# Check services
sudo systemctl status nginx
sudo systemctl status ai4all-data-server

# View logs
sudo tail -f /var/log/nginx/access.log

# Update data
cd ~/ai4all/AI4ALL && npm run scrape
```

## Testing Guidelines

### Test Structure
- Place tests in `*.test.ts` or `*.spec.ts` files
- Use Vitest framework
- Mock external APIs (GitHub, Stack Overflow, etc.)
- Test both phases of scraping independently

### Test Examples
```typescript
// Test Phase 1 - Model Discovery
test('filters 0-cost models correctly', () => {
  const models = [/* test data */];
  const freeModels = filterZeroCostModels(models);
  expect(freeModels).toHaveLength(12);
});

// Test Phase 2 - Verification
test('calculates verification score', () => {
  const feedback = [{ sentiment: 'positive' }, { sentiment: 'negative' }];
  const score = calculateVerificationScore(feedback);
  expect(score).toBe(50);
});
```

## Documentation Standards

- Update README.md with major feature changes
- Document breaking changes in commit messages
- Include code examples in complex logic comments
- Keep AGENTS.md updated with new commands

## Version Control

- Use conventional commits: `<emoji> <type>: <description>`
- Commit types: feat, fix, docs, style, refactor, perf, test, chore
- Push to `main` branch after successful tests
- Link issues in commit messages with `#123`

## Platform API Requirements

Each platform API must implement:
```typescript
interface BasePlatformAPI {
  fetchItems(options?: FetchOptions): Promise<FetchResult>;
  rateLimit(): Promise<void>;
  handleError(error: unknown, context: string): Error;
}
```

### Platform-Specific Features
- **modelsdev.ts**: Filter for 0-cost models, track price changes
- **github.ts**: Search issues, discussions, repositories
- **stackoverflow.ts**: Search questions with AI/tags
- **reddit.ts**: Fetch subreddit posts and comments
- **discord.ts**: Fetch channel messages
- **x.ts**: Search tweets with rate limiting

## Known Issues

- None currently - migration to Astro completed successfully
- Build is fast (13s) and memory-efficient on Raspberry Pi 3B+

## Additional Resources

- **README.md**: Complete project overview and deployment guide
- **PUBLIC-ACCESS-GUIDE.md**: Raspberry Pi hosting setup
- **ROADMAP.md**: Original project roadmap
