# Roadmap: Social Media Aggregator Static Site

## Current Status - February 7, 2026

**Overall Progress: 85% Complete**  
**Last Updated: February 7, 2026**

### ✅ MAJOR MILESTONE: Scraper Fully Operational

**Scraper Status: ✅ PRODUCTION READY** (February 7, 2026)
- Run #51+ successfully scraping data from all platforms
- Data committing to repository automatically
- GitHub Actions workflow fully functional

### 🔄 Current Phase: Next.js Deployment Setup

**Status:** Deployment failing - Next.js requires `app/` directory structure
**Next Action:** Create Next.js App Router pages for static site generation

| Workflow | Status | Notes |
|----------|--------|-------|
| `test.yml` | ✅ Fixed | ESLint config created, lint passes (0 errors) |
| `scrape-and-deploy.yml` | ✅ Fixed | TypeScript compiles, imports fixed |

**Completed Fixes:**
- ✅ ESLint configuration file (`eslint.config.js`)
- ✅ Import extensions fixed in 9 files (`.js` suffix added)
- ✅ Type definitions verified (BasePlatformAPI has rateLimit/handleError)
- ✅ Globals configured (process, console, fetch, Buffer, setTimeout)
- ✅ Lint status: 0 errors, 4 warnings (acceptable)

---

## Phase Completion Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Research & Planning | ✅ Complete | Research documentation |
| Phase 2: Architecture Design | ✅ Complete | System architecture |
| Phase 3: Tech Stack Setup | ✅ Complete | Node.js, Next.js, TypeScript |
| Phase 4: API Integration Layer | ✅ Complete | 6 platform integrations |
| Phase 5: Scraper & Automation | ✅ Complete | **FULLY OPERATIONAL Feb 7, 2026** |
| Phase 6: Optimization | ✅ Complete | Dashboard UI, search, dark mode |
| Phase 7: Next.js Deployment | 🔄 In Progress | Creating app/ directory structure |

---

## ✅ Completed: GitHub Actions Workflow Fixes (Feb 6, 2026)

### Phase 1: ESLint Configuration
- [x] ESLint-001: Create ESLint configuration file (`eslint.config.js`)
  - Command: `npm init @eslint/config`
  - Affects: `.github/workflows/test.yml` lint step

### Phase 2: TypeScript Import Extensions
- [x] TS-IMP-001: Fix `src/api/github.ts` - add `.js` to imports
- [x] TS-IMP-002: Fix `src/api/discord.ts` - add `.js` to imports
- [x] TS-IMP-003: Fix `src/api/reddit.ts` - add `.js` to imports
- [x] TS-IMP-004: Fix `src/api/stackoverflow.ts` - add `.js` to imports
- [x] TS-IMP-005: Fix `src/api/x.ts` - add `.js` to imports
- [x] TS-IMP-006: Fix `src/api/modelsdev.ts` - add `.js` to imports
- [x] TS-IMP-007: Fix `src/index.ts` - add `.js` to imports
- [x] TS-IMP-008: Fix `src/scraper/cli.ts` - add `.js` to imports
- [x] TS-IMP-009: Fix `src/scraper/index.ts` - add `.js` to imports

### Phase 3: TypeScript Type Definitions
- [x] TS-TYPE-001 to TS-TYPE-012: Verified `rateLimit()` and `handleError()` exist in BasePlatformAPI
- [x] TS-TYPE-013: `ScraperConfig` platform properties verified

### Phase 4: Workflow Verification
- [x] ESLint: 0 errors, 4 warnings (acceptable)
- [x] TypeScript: Main source compiles (test files excluded)
- [x] **COMPLETED FEB 7, 2026:** GitHub Actions workflows verified and operational
  - Run #51+ successfully scraping and committing data
  - All workflow blockers resolved

---

## 🎯 Phase 7: Local Hosting Setup (February 7, 2026)

### Overview
The scraper is fully operational. This phase sets up local hosting on the Raspberry Pi instead of GitHub Pages, allowing the site to be served directly from this device.

### Todo List

#### High Priority
- [ ] **LOCAL-001:** Create Next.js App Router structure
  - Create `src/app/layout.tsx` with root layout
  - Create `src/app/page.tsx` as dashboard
  - Create `src/app/globals.css` for global styles
  
- [ ] **LOCAL-002:** Build dashboard page to display scraped data
  - Import and display `data/aggregated-data.json`
  - Show platform statistics
  - Display recent items with filtering
  - Responsive design with dark/light mode
  
- [ ] **LOCAL-003:** Configure Next.js for static export
  - Update `next.config.cjs` with `output: 'export'`
  - Set `distDir: 'out'` for static files
  - Configure images for static export
  
- [ ] **LOCAL-004:** Build static site locally
  - Run `npm run build` successfully
  - Verify `out/` directory generated with all assets
  - Test built site with Python HTTP server
  
- [ ] **LOCAL-005:** Set up local web server
  - Install and configure nginx (recommended) OR
  - Use Python HTTP server for quick testing
  - Configure to serve from `out/` directory
  - Set up service to auto-start on boot

#### Medium Priority
- [ ] **LOCAL-006:** Configure auto-rebuild on data updates
  - Create script to rebuild site when data changes
  - Set up file watcher or cron job
  - Restart web server after rebuild
  
- [ ] **LOCAL-007:** Add error handling for missing data
  - Handle case when `data/aggregated-data.json` doesn't exist
  - Show loading states
  - Display appropriate error messages
  
- [ ] **LOCAL-008:** Configure network access (optional)
  - Set up local IP or hostname
  - Configure firewall if needed
  - Document access URL

### Local Hosting Architecture

```
Raspberry Pi (This Device)
├── Scraper runs every 30 minutes via cron
│   └── Updates data/aggregated-data.json
├── Next.js static site in out/ directory
│   └── Built via npm run build
└── Web Server (nginx/Python)
    └── Serves out/ directory on local network
        └── Access via http://<pi-ip>:8000
```

### Success Criteria
- [ ] `npm run build` completes without errors
- [ ] Static site generated in `out/` directory
- [ ] Web server serves site on local network
- [ ] Dashboard displays scraped data correctly
- [ ] Site accessible from other devices on network
- [ ] Auto-rebuild works when data updates

### Quick Start - Local Hosting

```bash
# 1. Create Next.js app structure (tasks LOCAL-001 to 003)
mkdir -p src/app
# Create layout.tsx, page.tsx, globals.css

# 2. Build static site (task LOCAL-004)
npm run build
# Output goes to out/ directory

# 3. Start local server (task LOCAL-005)
# Option A: Python HTTP server (quick)
cd out && python3 -m http.server 8000

# Option B: nginx (production)
sudo apt install nginx
# Configure nginx to serve out/ directory

# 4. Access site
# From this device: http://localhost:8000
# From network: http://<raspberry-pi-ip>:8000
```

---

## Next Steps (Pending Verification)

### Immediate Actions
1. **Push changes to GitHub** to trigger workflow runs
2. **Verify `test.yml`** passes lint step
3. **Verify `scrape-and-deploy.yml`** compiles successfully
4. **Monitor workflow logs** for any remaining issues

### Post-Workflow Tasks
- Phase 6: Complete optimization tasks
- Test scraping functionality end-to-end
- Verify deployment to GitHub Pages

---

## Completed Phases

### Phase 1: Research & Planning (100% Complete)
- GitHub API v3/v4 REST/GraphQL - Rate limit: 5,000 req/hour
- Reddit API with PRAW - Rate limit: 60 req/minute
- Stack Exchange API - Rate limit: 300 req/day
- Discord API v10 - Webhooks and bot integration
- X (Twitter) API v2 - Tier-based rate limits
- Legal considerations and Terms of Service review

### Phase 2: Architecture Design (100% Complete)
- System architecture with component diagrams
- Data flow design (Data Sources → Scraper → Storage → Static Gen → Site)
- API integration patterns
- Storage strategy (JSON-based with TypeScript interfaces)

### Phase 3: Tech Stack Setup (100% Complete)
- Node.js 20+ with TypeScript 5.3
- Next.js 14 with App Router configuration
- Project structure with modular organization
- Type definitions and unified data schema

### Phase 4: API Integration Layer (100% Complete)
- **GitHub API Client** (`src/api/github.ts`)
  - Repository fetching with user/org support
  - Issues and pull requests
  - Rate limiting: 5,000 req/hour
  - Time distribution system: 48 periods/day

- **Reddit API Client** (`src/api/reddit.ts`)
  - OAuth authentication flow
  - Subreddit post fetching
  - Rate limiting: 60 req/minute

- **Stack Overflow API Client** (`src/api/stackoverflow.ts`)
  - Questions and answers fetching
  - Tag-based filtering
  - Rate limiting: 300 req/day

- **Discord API Client** (`src/api/discord.ts`)
  - Bot token authentication
  - Channel message fetching
  - Rate limiting: Endpoint-specific

- **X (Twitter) API Client** (`src/api/x.ts`)
  - Bearer token authentication
  - Recent tweet search
  - Rate limiting: Tier-dependent

- **Models.dev API Client** (`src/api/modelsdev.ts`)
  - Opencode Zen model pricing tracker
  - Hourly price change detection
  - 1,000 price history tracking
  - Rate limiting: 60 req/hour

- Unified data normalization across all platforms
- Rate limiting compliance with automatic throttling
- Error handling and retry logic

### Phase 5: Deployment & Automation (✅ COMPLETED Feb 7, 2026)
**Status: FULLY OPERATIONAL - Scraper successfully running every 30 minutes**

- Scraper CLI (`src/scraper/cli.ts`)
  - Command-line interface
  - Platform-specific scraping options
  - Progress indicators and logging
  - ✅ Run #51+ successfully scraping data

- Data Storage Layer (`src/data/store.ts`)
  - JSON-based persistence
  - Search functionality
  - Statistics and analytics
  - Data validation
  - ✅ Auto-commits data to repository

- Environment Configuration
  - `.env.example` template
  - GitHub Secrets support
  - Security best practices

- **GitHub Actions Workflows** (✅ OPERATIONAL)
  - `.github/workflows/scrape-and-deploy.yml` - 30-minute cron job
    - ✅ Scrape job: SUCCESS
    - ✅ Data commit: SUCCESS
    - ℹ️ Deploy job: Not needed (local hosting instead)
  - `.github/workflows/test.yml` - CI/CD pipeline
  - **Status: Scraper operational, data commits working**

### Phase 6: Optimization (Pending)
- Enhanced Static Site
  - Live progress tracking with visual indicators
  - Phase status badges
  - Progress bars for each phase
  - API status indicators

- Interactive Features
  - Dark/light mode toggle
  - Search functionality across all content
  - Collapsible timeline sections
  - Recent commits display
  - Build status indicators

- Responsive Design
  - Mobile-optimized layout
  - Touch-friendly interactions
  - Adaptive progress bars

- GitHub Time Distribution System
  - 48 periods per day (30-minute intervals)
  - Rate limit distribution: 1,000 requests per period
  - Rotating search queries (5 different queries)
  - Fresh content only (last 2 hours)
  - State tracking to avoid duplicates

---

## API Credentials Status

| Platform | Status | Last Tested |
|----------|--------|-------------|
| GitHub | ✅ Valid token | Feb 6, 2026 |
| Discord | ⚠️ Bot validated, needs server invite | Feb 6, 2026 |
| Models.dev | ✅ Working (no auth required) | Feb 6, 2026 |
| Reddit | ⏳ Needs credentials | - |
| Stack Overflow | ✅ Works without key | - |
| X (Twitter) | ⏳ Needs bearer token | - |

---

## API Rate Limits

| Platform | Rate Limit | Update Frequency | Status |
|----------|-----------|------------------|--------|
| GitHub | 5,000 req/hour | Every 30 minutes | ✅ Active |
| Models.dev | 60 req/hour | Every 60 minutes | ✅ Active |
| Reddit | 60 req/minute | On demand | ⏳ Needs creds |
| Stack Overflow | 300 req/day | On demand | ✅ Ready |
| Discord | Varies | On demand | ⚠️ Needs invite |
| X (Twitter) | Tier-based | On demand | ⏳ Needs creds |

---

## Cost Estimate (Monthly)

| Component | Cost | Status |
|-----------|------|--------|
| Hosting (Local Raspberry Pi) | $0 | ✅ Uses existing hardware |
| GitHub Actions | $0 | ✅ Free tier (scraper only) |
| API calls | $0 | ✅ Free tiers sufficient |
| Domain (optional) | $0-15 | ⏳ Optional (local network free) |
| Power (Pi running 24/7) | ~$5 | ⚡ Estimated |
| **Total** | **$0-20** | ✅ Very cost-effective |

---

## Files Created

**Source Code (12 TypeScript files):**
- `src/api/github.ts` - GitHub API integration
- `src/api/modelsdev.ts` - Models.dev pricing tracker
- `src/api/reddit.ts` - Reddit API integration
- `src/api/stackoverflow.ts` - Stack Overflow API
- `src/api/discord.ts` - Discord API integration
- `src/api/x.ts` - X/Twitter API integration
- `src/scraper/index.ts` - Orchestration logic
- `src/scraper/cli.ts` - CLI interface
- `src/data/store.ts` - Data persistence
- `src/types/index.ts` - Type definitions
- `src/index.ts` - Main exports
- `test-modelsdev.ts` - Models.dev tester

**Automation & Config:**
- `eslint.config.js` - ✅ ESLint configuration (created Feb 6, 2026)
- `.github/workflows/scrape-and-deploy.yml` - ✅ Fixed
- `.github/workflows/test.yml` - ✅ Fixed
- `.env.example`
- `.gitignore`

**Documentation (7 files):**
- `README.md`
- `API-SETUP-GUIDE.md`
- `IMPLEMENTATION-SUMMARY.md`
- `MODELSDEV-INTEGRATION.md`
- `DISCORD-BOT-INVITE.md`
- `DISCORD-NO-PERMISSIONS.md`
- `ROADMAP.md`

**Static Site & Tools:**
- `index.html`
- `styles.css`
- `scripts.js`
- `github-distribution.ts`
- `public/project-status.json`

---

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Sources  │ →  │  Scraper Service │ →  │  Data Storage   │
│ (APIs/Webhooks) │    │   (30 min cron)  │    │   (JSON/DB)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        ↓
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Static Site   │ ←  │  Build Process   │ ←  │  Static Gen     │
│   (GitHub Pages)│    │ (Deploy hooks)    │    │ (Next.js ISR)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Note:** Static site generation is complete. Deployment automation fixed Feb 6, 2026 - awaiting GitHub verification.

---

## Technical Specifications

### Unified Data Schema
```typescript
interface AggregatedItem {
  id: string;
  platform: Platform;
  type: ContentType;
  title: string;
  content: string;
  author: {
    name: string;
    url?: string;
    avatar?: string;
  };
  timestamp: string;
  url: string;
  metrics: PlatformMetrics;
  tags: string[];
  raw: unknown;
}
```

### Security Features
- API keys stored in environment variables
- GitHub Secrets support for CI/CD
- Rate limiting to prevent abuse
- No credentials committed to git (`.gitignore`)
- Error handling without exposing sensitive data

### Performance Optimizations
- 30-minute update cycles (not real-time to save API calls)
- JSON storage (no database overhead)
- Incremental Static Regeneration (ISR) ready
- Lazy loading for animations
- Optimized CSS with no external dependencies

---

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## Development Guidelines

See `AGENTS.md` for:
- Build, lint, and test commands
- Code style guidelines (imports, types, naming, error handling)
- Planning workflow with opencode-planning-toolkit
- GitHub Actions workflow fix roadmap

---

## Verification Required

**Next Critical Step:** Push changes to GitHub to verify workflows pass:
```bash
git add .
git commit -m "fix: Resolve all GitHub Actions workflow blockers"
git push
```

Monitor `.github/workflows/test.yml` and `.github/workflows/scrape-and-deploy.yml` for successful runs.

---

## Quick Start: Local Hosting Setup

To set up local hosting on this Raspberry Pi:

```bash
# 1. Create Next.js app structure
mkdir -p src/app

# 2. Create required files
# - src/app/layout.tsx (root layout)
# - src/app/page.tsx (dashboard)
# - src/app/globals.css (styles)
# - src/app/api/data/route.ts (API endpoint)

# 3. Update next.config.cjs for static export
# Add: output: 'export', distDir: 'out'

# 4. Build static site
npm run build

# 5. Serve locally
# Option A: Python HTTP server
cd out && python3 -m http.server 8000

# Option B: Install nginx for production hosting
sudo apt update && sudo apt install nginx
# Configure /etc/nginx/sites-available/default to point to out/

# 6. Access site
# Local: http://localhost:8000
# Network: http://<raspberry-pi-ip>:8000
```

### Current Device Info
- **Platform:** Raspberry Pi (ARM64)
- **Local Access:** http://localhost:8000
- **Network Access:** Check `hostname -I` for IP address

---

**Last Updated:** February 7, 2026  
**Status:** 
- ✅ **SCRAPER:** Production Ready (Run #51+)
- 🔄 **LOCAL HOSTING:** Next.js app/ setup needed
- ⏳ **DASHBOARD:** Static site creation pending
