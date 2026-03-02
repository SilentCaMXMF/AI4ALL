# Free AI Models Aggregator

A curated directory of **free AI models** aggregated from [models.dev](https://models.dev). Discover free LLMs, their providers, capabilities, and pricing (all free!) in one searchable, filterable, and comparable dashboard.

**🎉 Status: Production Ready - February 11, 2026**

## 🌐 Live Site

**🔗 https://freeai4all.duckdns.org**

Your Free AI Models dashboard is publicly accessible with HTTPS encryption and optimized for search engines!

---

## 🎯 What's New - v2.6.0 (Feb 26, 2026)

### 🔧 Code Quality Improvements
- **TypeScript Strict Mode** - Full type safety across codebase
- **Refactored APIs** - Better error handling with custom error classes
- **Code Deduplication** - Extracted common helpers (getHeaders, makeApiRequest)
- **Performance Optimized** - DataStore caching, reduced redundant calls
- **Input Validation** - Token validation, safer constructors
- **Removed Dead Code** - Cleaned up unused Discord/X integrations

### 🔒 Security Updates
- **NPM Dependencies** - Upgraded Astro 4.15 → 5.17.2 (patches 7 vulnerabilities)
- **GitHub Actions** - Restricted permissions, added manual deploy approval
- **Security Headers** - Added CSP, X-Frame-Options, X-Content-Type-Options
- **Server Config** - Production host binding secured
- **Dotenv** - Fixed environment variable loading

### ✨ Interactive Features
- **⭐ Favorites System** - Save models with one click (persisted in localStorage)
- **🔍 Advanced Filtering** - Real-time search + capability filters + token limit sliders
- **⚖️ Model Comparison** - Compare up to 3 models side-by-side with detailed specs
- **📄 Model Detail Modal** - Full specifications with copy-to-clipboard buttons
- **📋 Quick Copy** - Copy model ID or provider name instantly

### 🎨 UI/UX Improvements
- **Responsive Provider Filters** - Interactive chips with live counts
- **Sticky Comparison Bar** - Access comparison controls while scrolling
- **Favorites Section** - Quick access to saved models
- **No Results State** - Clear feedback when filters match nothing
- **Smooth Animations** - Hover effects and transitions throughout

### 🚀 SEO & Performance
- **100/100 SEO Score** - Complete meta tags, structured data, OG images
- **Social Media Ready** - 1200x630px OG image for rich previews
- **Open Graph** - Full Facebook/LinkedIn/Discord preview support
- **Twitter Cards** - Large image cards for Twitter/X
- **JSON-LD Schema** - WebSite and Organization structured data
- **Preconnect Hints** - Faster external resource loading

---

## 🎯 Previous Updates

### ✅ 2-Phase Scraping Implementation (Feb 10, 2026)
- **Phase 1 - Discovery**: Fetches only 0-cost models from models.dev (input = 0 AND output = 0)
- **Phase 2 - Verification**: Validates each model against social media mentions (GitHub, Stack Overflow)
- **Verification Status**: Each model shows CONFIRMED/QUESTIONED/UNKNOWN status
- **Trust Score**: 0-100% confidence based on social media validation
- **Issue Detection**: Automatically reports common problems (rate limits, availability issues)

### ✅ Public HTTPS Access (Feb 8, 2026)

### ✅ Enhanced Social Verification (Feb 12, 2026)
- **6-Platform Verification**: GitHub, Reddit, Stack Overflow, Hugging Face, Hacker News, X
- **Comprehensive Rate Limiting**: Platform-specific rate limit management
- **Advanced Sentiment Analysis**: Multi-platform feedback analysis with trust scoring
- **Issue Detection System**: 12 common issue keywords with automated reporting
- **Verification History**: Trend analysis and model insights
- **Enhanced UI**: Verification score badges, common issues display, timeline components
- **Complete Test Suite**: Unit tests, integration tests, and CI/CD pipeline
- **Production Ready**: Automated hourly updates with comprehensive testing
- Domain: freeai4all.duckdns.org
- SSL certificate from Let's Encrypt
- Auto-renewal enabled

---

## ✨ Interactive Features

### ⭐ Favorites & Bookmarks
Save your preferred models for quick access:
- Click the **🤍 heart icon** on any model card
- Favorites are saved to browser storage
- "My Favorites" section appears automatically
- Works across page refreshes

### 🔍 Advanced Filtering
Find exactly what you need with powerful filters:

| Filter Type | Description |
|-------------|-------------|
| **Search** | Real-time search by name, provider, or capability |
| **Context Limit** | Slider to filter by minimum context tokens (0-500K) |
| **Output Limit** | Slider to filter by minimum output tokens (0-200K) |
| **Capabilities** | Multi-select: Tool Calling, Reasoning, Vision, Audio, Open Weights |
| **Provider** | Click provider chips to filter by source |

**Clear Filters** button appears when any filter is active.

### ⚖️ Model Comparison
Compare specifications side-by-side:
1. Click **⚖️ compare button** on up to 3 models
2. Sticky comparison bar appears at top
3. Click **"Compare Selected"** to open comparison modal
4. View detailed comparison table with all specs
5. Remove models individually or clear all

### 📄 Model Details
View complete model information:
- Click **ℹ️ Details** button on any card
- See full specifications in modal
- Copy model ID with one click
- View modalities, capabilities, limits
- Direct link to models.dev

### 📋 Copy-to-Clipboard
Quick access to model information:
- **📋 ID** button - copies the model ID
- **🏢 Provider** button - copies provider name
- Visual feedback shows "✓ Copied!"
- Also available in detail modal

---

## Overview

This project implements a **2-phase scraping system** to discover and verify free AI models:

### 🔄 How It Works

**Phase 1 - Discovery**
1. Fetch all models from models.dev API
2. Filter for only 0-cost models (input = 0 AND output = 0)
3. Extract model metadata (provider, capabilities, context limits)
4. Store in aggregated database

**Phase 2 - Social Verification**
1. For each free model, search social platforms:
   - **GitHub**: Issues, discussions, repositories mentioning the model
   - **Stack Overflow**: Technical questions and answers about the model
   - **Reddit**: Community feedback and experiences
2. Analyze sentiment (positive/negative/neutral mentions)
3. Calculate verification score (0-100%)
4. Flag common issues (rate limits, availability problems)

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         🌐 INTERNET                                      │
│                             │                                            │
│              DuckDNS (freeai4all.duckdns.org)                           │
│                             │                                            │
│                    ┌────────┴────────┐                                   │
│                    │    🔀 ROUTER     │                                   │
│                    │  Port 80 → 443  │                                   │
│                    └────────┬────────┘                                   │
│                             │                                            │
│                  ┌──────────▼──────────┐                                 │
│                  │  🏠 RASPBERRY PI 3+ │                                 │
│                  │    192.168.1.67     │                                 │
│                  │                     │                                 │
│    ┌─────────────┼─────────┬───────────┼─────────────┐                  │
│    │             │         │           │             │                  │
│  🌐 Nginx      📊 Data   🔄 DuckDNS  📝 Astro      🤖 Models         │
│  (80/443)      API       Client      Static Site   Directory          │
│    │           (8001)    (5min)      (dist/)       (Features)         │
│    │             │         │           │             │                  │
│    │  ┌──────────┴─────────┴───────────┴─────────────┤                  │
│    │  │                                              │                  │
│    │  │  ✨ Interactive Features                      │                  │
│    │  │  ⭐ Favorites (localStorage)                  │                  │
│    │  │  🔍 Advanced Filters                         │                  │
│    │  │  ⚖️ Model Comparison                         │                  │
│    │  │  📄 Detail Modals                            │                  │
│    │  │  📋 Copy-to-Clipboard                        │                  │
│    │  │                                              │                  │
│    └───┴──────────────────────────────────────────────┘                  │
│                                                                          │
│    ┌─────────────────────────────────────────────────────┐              │
│    │         2-PHASE SCRAPING SYSTEM                     │              │
│    │                                                     │              │
│    │  PHASE 1: Discovery                                 │              │
│    │  ┌─────────────────────────────────────────────┐   │              │
│    │  │ models.dev API → Filter 0-cost models      │   │              │
│    │  │ → Store in aggregated-data.json            │   │              │
│    │  └─────────────────────────────────────────────┘   │              │
│    │                        ↓                           │              │
│    │  PHASE 2: Verification                           │              │
│    │  ┌─────────────────────────────────────────────┐   │              │
│    │  │ GitHub API → Stack Overflow API → Analysis │   │              │
│    │  │ → Calculate Trust Score (0-100%)           │   │              │
│    │  │ → Flag Common Issues                       │   │              │
│    │  └─────────────────────────────────────────────┘   │              │
│    └─────────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/SilentCaMXMF/AI4ALL.git
cd AI4ALL
```

2. Install dependencies:
```bash
npm install
```

3. Run the 2-phase scraper:
```bash
npm run scrape
```

4. Build the Astro site:
```bash
npm run build
```

5. Serve locally:
```bash
npm run preview
# Or copy dist/ to your web server
```

### Viewing the Dashboard

Visit the live site at https://freeai4all.duckdns.org or open `dist/index.html` locally after building.

---

## Using the Dashboard

### Basic Navigation

1. **Browse Models** - Scroll through providers or use provider chips to filter
2. **Search** - Type in the search box to find models by name
3. **Filter** - Use sliders and capability toggles to narrow results
4. **Save Favorites** - Click 🤍 to save models for later
5. **Compare** - Click ⚖️ on 2-3 models, then "Compare Selected"
6. **View Details** - Click ℹ️ to see full specifications
7. **Copy IDs** - Click 📋 or 🏢 to copy model info

### Keyboard Shortcuts

- `Esc` - Close any open modal
- `Ctrl/Cmd + F` - Focus search box

### Mobile Usage

All features work on mobile:
- Swipe to scroll through models
- Touch-friendly buttons and sliders
- Responsive comparison table (scrolls horizontally)
- Modals adjust to screen size

---

## 2-Phase Scraping Implementation

### Phase 1: Model Discovery

The scraper fetches all models from models.dev and filters for truly free ones:

```typescript
// Filter for 0-cost models only
const freeModels = allModels.filter(model => {
  const inputCost = model.cost?.input ?? model.inputCost ?? 0;
  const outputCost = model.cost?.output ?? model.outputCost ?? 0;
  return inputCost === 0 && outputCost === 0;
});
```

**What qualifies as "free":**
- `cost.input === 0` AND `cost.output === 0`
- No API key required for access
- Currently finding **12 verified free models**

### Phase 2: Social Media Verification

Each free model is validated against social platforms:

**Search Targets:**
- **GitHub**: Issues, discussions, repository mentions
- **Stack Overflow**: Technical Q&A about the model
- **Reddit**: Community feedback and experiences

**Verification Algorithm:**
1. Search each platform for model name + keywords
2. Analyze sentiment (positive/negative/neutral)
3. Calculate verification score:
   - 70%+ positive → CONFIRMED (working)
   - 40-69% positive → LIKELY WORKING
   - <40% positive → QUESTIONED (reported issues)
4. Flag common problems:
   - Rate limit issues
   - Availability problems
   - API key requirements
   - Deprecation notices

**Output Example:**
```json
{
  "id": "modelsdev-zenmux-deepseek-r1",
  "title": "ZenMCU: DeepSeek-R1 (Free)",
  "feedbackSummary": {
    "total": 5,
    "positive": 4,
    "negative": 1,
    "neutral": 0,
    "verificationScore": 80,
    "verificationLevel": "Likely working",
    "availabilityStatus": "confirmed",
    "commonIssues": ["rate limit"]
  }
}
```

### Scraper Commands

```bash
# Full 2-phase scraping
npm run scrape

# Phase 1 only (fetch models)
npm run scrape:modelsdev

# Phase 2 only (verify existing models)
npm run scrape:verify

# Run with GitHub token for better verification
GITHUB_TOKEN=ghp_xxx npm run scrape
```

---

## SEO & Social Media

### SEO Score: 100/100 🎯

**Implemented:**
- ✅ Title & Meta Description
- ✅ Open Graph tags (9 total)
- ✅ Twitter Cards (7 tags)
- ✅ Canonical URL
- ✅ Structured Data (JSON-LD)
- ✅ Sitemap.xml
- ✅ Robots.txt
- ✅ OG Image (1200x630px)
- ✅ Mobile Responsive
- ✅ Performance optimized

**Social Sharing Preview:**
When you share https://freeai4all.duckdns.org on social media:
- **Title**: Free AI Models Directory | 0-Cost AI Models
- **Description**: Discover 450+ free AI models with zero input/output costs
- **Image**: Professional gradient card with stats
- **Site Name**: FreeAI4All

**Test your SEO:**
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

---

## Data Source

### models.dev API

The dashboard aggregates data from [models.dev](https://models.dev/api.json), a comprehensive database of AI models.

**Currently Verified Free Models:**
| Provider | Free Models | Status |
|----------|-------------|---------|
| OpenRouter | 77 | Verified |
| ZenMCU | 12 | Verified |
| Nvidia | 70 | Pending |
| GitHub Models | 55 | Pending |

**Update Frequency:**
- **Hourly**: Automated via GitHub Actions with 2-phase verification
- **Manual**: Run `npm run scrape` locally
- **Social Media**: Verification updates with each scrape

---

## Repository Organization

This repository is organized for clarity and maintainability:

| Directory | Purpose | Status |
|-----------|---------|--------|
| **Root** | Core config files (package.json, configs) | ✅ Active |
| **src/** | Source code (Astro components, APIs, scraper) | ✅ Active |
| **public/** | Static assets (favicon, OG images) | ✅ Active |
| **data/** | Scraped model data | ✅ Active |
| **docs/** | Documentation and guides | 📚 Reference |
| **tools/** | Build utilities and scripts | 🛠️ Utilities |
| **archive/** | Old/outdated files (kept for reference) | 📦 Archive |
| **scripts/** | Setup and deployment scripts | 🚀 DevOps |

**Note:** `AGENTS.md` and `ROADMAP.md` remain in the root for quick access.

## Project Structure

```
AI4ALL/
├── 📄 Core Files (Root)
│   ├── README.md              # This file
│   ├── AGENTS.md              # Development guidelines
│   ├── ROADMAP.md             # Project roadmap
│   ├── package.json           # Dependencies
│   ├── astro.config.mjs       # Astro configuration
│   ├── tsconfig.json          # TypeScript config
│   ├── .env.example           # Environment template
│   ├── .gitignore             # Git ignore rules
│   ├── robots.txt             # SEO robots
│   └── sitemap.xml            # SEO sitemap
│
├── 📁 .github/workflows/      # CI/CD automation
│   └── scrape-and-deploy.yml  # Hourly scraper
│
├── 📁 archive/                # Old/outdated files (reference)
│   ├── dashboard.html         # Legacy dashboard
│   ├── index.html             # Old static site
│   ├── next.config.mjs        # Next.js config (migrated)
│   ├── *.ts, *.js             # Old scripts
│   └── ...
│
├── 📁 data/                   # Scraped data
│   └── aggregated-data.json   # Free AI models
│
├── 📁 dist/                   # Build output (gitignored)
│   └── (generated by npm run build)
│
├── 📁 docs/                   # Documentation
│   ├── API-SETUP-GUIDE.md
│   ├── PUBLIC-ACCESS-GUIDE.md
│   ├── MODELSDEV-INTEGRATION.md
│   ├── IMPLEMENTATION-SUMMARY.md
│   ├── SEO-IMPLEMENTATION-SUMMARY.md
│   ├── SECURITY-AUDIT.md
│   └── ...
│
├── 📁 public/                 # Static assets
│   ├── favicon.svg
│   ├── og-image.png           # Social preview
│   └── og-image.svg
│
├── 📁 scripts/                # Setup scripts
│   └── (deployment helpers)
│
├── 📁 src/                    # Source code
│   ├── api/                   # API clients
│   │   ├── modelsdev.ts
│   │   ├── github.ts
│   │   └── stackoverflow.ts
│   ├── components/            # Astro components
│   │   └── ModelCard.astro
│   ├── data/                  # Data layer
│   │   ├── models.ts
│   │   └── store.ts
│   ├── layouts/               # Page layouts
│   │   └── Layout.astro
│   ├── pages/                 # Routes
│   │   └── index.astro
│   ├── scraper/               # Scraper service
│   │   ├── index.ts
│   │   └── cli.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   └── utils/                 # Utilities
│       └── favorites.ts
│
├── 📁 tasks/                  # Task files
│
└── 📁 tools/                  # Build utilities
    ├── convert-og-image.js
    ├── generate-og-image.js
    └── og-image-generator.html
```

---

## Usage

### Running the 2-Phase Scraper

```bash
# Full 2-phase scraping with verification
npm run scrape

# Scrape only (Phase 1)
npm run scrape:modelsdev

# Verify only (Phase 2)
npm run scrape:verify
```

**With API Keys (Better Verification):**
```bash
# GitHub token enables issue/discussion search
GITHUB_TOKEN=ghp_xxx npm run scrape

# Reddit credentials enable community feedback
REDDIT_CLIENT_ID=xxx REDDIT_CLIENT_SECRET=xxx npm run scrape
```

### Automated Updates

The GitHub Actions workflow runs hourly:
1. **Phase 1**: Fetches models from models.dev, filters 0-cost models
2. **Phase 2**: Verifies each model against social media
3. **Commit**: Updates aggregated-data.json with verification scores
4. **Deploy**: Nginx serves the updated data

### Manual Trigger

You can manually trigger the scrape workflow:
1. Go to Actions → Scrape Free AI Models with Feedback
2. Click "Run workflow"

### Dashboard Features

- **⭐ Favorites**: Save models with heart icon, access in "My Favorites" section
- **🔍 Search**: Real-time filtering by name, provider, capability
- **⚖️ Compare**: Select 2-3 models and view side-by-side comparison
- **📄 Details**: Click ℹ️ for full model specifications
- **📋 Copy**: One-click copy for model ID and provider
- **🎚️ Sliders**: Filter by context/output token limits
- **🏷️ Capabilities**: Multi-select filters for features
- **🏢 Providers**: Click chips to filter by source
- **Clear Filters**: Reset all filters with one button

---

## Configuration

### Environment Variables

**Optional (for better verification):**

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub API token for issue search | No |
| `REDDIT_CLIENT_ID` | Reddit API client ID | No |
| `REDDIT_CLIENT_SECRET` | Reddit API client secret | No |
| `STACKOVERFLOW_KEY` | Stack Overflow API key | No |

**Recommended Setup:**
```bash
# Create .env file
GITHUB_TOKEN=ghp_your_token_here
REDDIT_CLIENT_ID=your_reddit_id
REDDIT_CLIENT_SECRET=your_reddit_secret
```

### Nginx Configuration

Your nginx is configured to:
- Serve static files from project root (`/home/pedroocalado/ai4all/AI4ALL/dist`)
- Proxy `/data/` requests to data directory
- Handle HTTPS with SSL certificate
- Redirect HTTP to HTTPS
- Gzip compression enabled

---

## Deployment

### Current Setup (Raspberry Pi)

Your site is already deployed and publicly accessible:
- **Domain**: freeai4all.duckdns.org
- **Server**: Nginx on Raspberry Pi 3+
- **SSL**: Let's Encrypt certificate
- **DNS**: DuckDNS (updates every 5 minutes)

### Build & Deploy

```bash
# Build the site (generates static files in dist/)
npm run build

# Nginx automatically serves from dist/ directory
# (No manual copy needed - nginx root points to dist/)

# Reload nginx if needed
sudo systemctl reload nginx

# Or preview locally
npm run preview
```

### Services Status

```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status ai4all-data-server

# View logs
sudo tail -f /var/log/nginx/access.log

# Check scraper logs
cat ~/ai4all/AI4ALL/.scraper.log
```

---

## Development

**Available Scripts:**
- `npm run dev` - Start Astro development server
- `npm run build` - Build static site to dist/
- `npm run preview` - Preview built site locally
- `npm run scrape` - Full 2-phase scraping with verification
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

**Build & Test:**
```bash
# Clean build
rm -rf dist/
npm run build

# Verify build output
ls -la dist/

# Test locally
npm run preview
```

---

## Cost

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Hosting (Raspberry Pi) | $0 | Uses existing hardware |
| Domain (DuckDNS) | $0 | Free dynamic DNS |
| SSL Certificate | $0 | Let's Encrypt free tier |
| GitHub Actions | $0 | Free tier (hourly runs) |
| Power (Pi 24/7) | ~$5 | Estimated |
| **Total** | **~$5** | ✅ Very cost-effective |

---

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

All interactive features work on mobile browsers with touch-optimized controls.

---

## Documentation

- **`README.md`** - This file (features guide, deployment, usage)
- **`PUBLIC-ACCESS-GUIDE.md`** - Guide for public hosting setup
- **`ROADMAP.md`** - Original project roadmap
- **`AGENTS.md`** - Development guidelines for AI agents

---

## Troubleshooting

### Dashboard Features Not Working?

**Favorites not persisting:**
- Check browser's localStorage is enabled
- Try incognito/private mode to test
- Check browser console for JavaScript errors

**Filters not working:**
- Clear browser cache and refresh
- Check JavaScript is enabled
- Try different browser

**Comparison not opening:**
- Select at least 2 models to compare
- Check for JavaScript errors in console

### Scraper Issues

**No verified models found:**
```bash
# Run scraper with verbose output
npm run scrape

# Check if models.dev is accessible
curl -s https://models.dev/api.json | head -20

# Verify GitHub token (if set)
echo $GITHUB_TOKEN
```

### Site not accessible?

1. Check nginx status:
   ```bash
   sudo systemctl status nginx
   ```

2. Verify port forwarding on router (ports 80 and 443)

3. Check DuckDNS is updating:
   ```bash
   cat ~/duckdns/duck.log
   ```

### Data not loading?

1. Check data file exists:
   ```bash
   ls -la data/aggregated-data.json
   ```

2. Test data endpoint:
   ```bash
   curl -s http://localhost/data/aggregated-data.json | head -3
   ```

3. Run scraper manually:
   ```bash
   npm run scrape
   ```

### Verification Issues

**Low trust scores:**
- This is normal for new models
- Scores improve as more social mentions accumulate
- Check the `commonIssues` array for reported problems

**No social mentions:**
- Model may be too new
- Try running with GITHUB_TOKEN for better coverage
- Check search keywords in `src/scraper/index.ts`

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement new features or improvements
4. Run tests: `npm run typecheck && npm run lint`
5. Build and verify: `npm run build`
6. Submit a pull request

**Feature Ideas:**
- Model usage examples/snippets
- Export favorites to JSON/CSV
- Dark/light theme toggle
- Model rating/reviews
- API endpoint for third-party access

---

## License

MIT License - see LICENSE file for details

---

## Support

For issues and questions:
- 📖 Check this README for feature documentation
- 📖 Check `PUBLIC-ACCESS-GUIDE.md` for hosting help
- 🐛 Open an issue on GitHub
- 💬 Share feedback on the live site

---

## Acknowledgments

- **Data**: [models.dev](https://models.dev) API
- **Framework**: [Astro](https://astro.build) for static site generation
- **Icons**: Emoji icons for universal compatibility
- **Hosting**: Built with ❤️ on Raspberry Pi 3+
- **Security**: SSL by Let's Encrypt
- **DNS**: DuckDNS

---

**Last Updated:** February 23, 2026  
**Version:** 2.6.0  
**Status:** 🎉 Production Ready - TypeScript Refactoring Complete

**Share the link**: https://freeai4all.duckdns.org
