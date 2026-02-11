# Free AI Models Aggregator

A curated directory of **free AI models** aggregated from [models.dev](https://models.dev). Discover free LLMs, their providers, capabilities, and pricing (all free!) in one searchable dashboard.

**🎉 Status: Production Ready - February 10, 2026**

## 🌐 Live Site

**🔗 https://freeai4all.duckdns.org**

Your Free AI Models dashboard is publicly accessible with HTTPS encryption!

## 🎯 What's New

### ✅ 2-Phase Scraping Implementation (Feb 10, 2026)
- **Phase 1 - Discovery**: Fetches only 0-cost models from models.dev (input = 0 AND output = 0)
- **Phase 2 - Verification**: Validates each model against social media mentions (GitHub, Stack Overflow)
- **Verification Status**: Each model shows CONFIRMED/QUESTIONED/UNKNOWN status
- **Trust Score**: 0-100% confidence based on social media validation
- **Issue Detection**: Automatically reports common problems (rate limits, availability issues)

### ✅ Recently Completed (Feb 8, 2026)
- **Public HTTPS Access**
  - Domain: freeai4all.duckdns.org
  - SSL certificate from Let's Encrypt
  - Auto-renewal enabled
- **Simplified Focus**
  - Now only aggregates FREE AI models from models.dev
  - Removed all other platforms (GitHub, Reddit, Stack Overflow, Discord, X)
  - Clean, focused interface
- **Local Hosting on Raspberry Pi**
  - Running on Raspberry Pi 3+
  - Nginx reverse proxy with SSL
  - DuckDNS for dynamic DNS
  - Auto-updates hourly via GitHub Actions

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

### ✅ Key Features

- **12 Verified Free Models**: Only 0-cost models with social media validation
- **Trust Scoring**: Each model shows verification confidence (0-100%)
- **Issue Detection**: Automatic reporting of reported problems
- **Provider Filtering**: Browse by verified provider (OpenRouter, ZenMCU, etc.)
- **Capability Tags**: Filter by features (Reasoning, Tool Calling, Open Weights)
- **Hourly Updates**: Automated verification refresh via GitHub Actions
- **Mobile-Friendly**: Responsive design works on all devices
- **HTTPS Secured**: SSL certificate with auto-renewal

## Project Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    🌐 INTERNET                                │
│                        │                                   │
│              DuckDNS (freeai4all.duckdns.org)               │
│                        │                                   │
│                 ┌─────────┴─────────┐                         │
│                 │    🔀 ROUTER        │                         │
│                 │   Port 80 → 443  │                         │
│                 └─────┬───────┘                         │
│                       │                                   │
│              ┌──────▼───────┐                            │
│              │    🏠 RASPBERRY PI 3+                      │
│              │   192.168.1.67                              │
│              │                                               │
│    ┌─────────┴──────────┬───────────────┐                  │
│    │                    │               │                  │
│  🌐 Nginx (80/443)    │   📊 Data API (8001) │   🔄 DuckDNS Client │
│    │                    │               │                  │
│    │  Static Files       │    JSON Data    │   DNS Updates     │
│    │  SSL Termination    │    /data/*      │   /data/duckdns/  │
│    └─────────────────────┴─────────────────────┘              │
│                                                               │
│    ┌─────────────────────────────────────────────────────┐  │
│    │              2-PHASE SCRAPING SYSTEM                │  │
│    │                                                      │  │
│    │  PHASE 1: Discovery                                 │  │
│    │  ┌─────────────────────────────────────────────┐   │  │
│    │  │ models.dev API → Filter 0-cost models      │   │  │
│    │  │ → Store in aggregated-data.json            │   │  │
│    │  └─────────────────────────────────────────────┘   │  │
│    │                        ↓                           │  │
│    │  PHASE 2: Verification                           │  │
│    │  ┌─────────────────────────────────────────────┐   │  │
│    │  │ GitHub API → Stack Overflow API → Analysis │   │  │
│    │  │ → Calculate Trust Score (0-100%)           │   │  │
│    │  │ → Flag Common Issues                       │   │  │
│    │  └─────────────────────────────────────────────┘   │  │
│    └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

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

## Project Structure

```
├── .github/workflows/
│   └── scrape-and-deploy.yml  # Hourly 2-phase scraper workflow
├── data/
│   └── aggregated-data.json   # Free AI models with verification data
├── dist/                     # Astro build output (static site)
├── src/
│   ├── api/                  # Platform API implementations
│   │   ├── modelsdev.ts      # Free models API client
│   │   ├── github.ts         # GitHub API for verification
│   │   └── stackoverflow.ts  # Stack Overflow API for verification
│   ├── components/           # Astro components
│   │   └── ModelCard.astro   # Model display component
│   ├── data/                 # Data layer
│   │   ├── models.ts         # Model loading and filtering
│   │   └── store.ts          # Data persistence
│   ├── layouts/              # Astro layouts
│   │   └── Layout.astro      # Base page layout
│   ├── pages/                # Astro pages
│   │   └── index.astro       # Homepage with model directory
│   ├── scraper/              # 2-phase scraper service
│   │   ├── index.ts
│   │   └── cli.ts
│   └── types/
│       └── index.ts          # TypeScript definitions
├── astro.config.mjs          # Astro configuration
├── package.json
├── PUBLIC-ACCESS-GUIDE.md    # Public hosting guide
└── README.md                 # This file
```

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

- **Search**: Find models by name, provider, or capability
- **Provider Filter**: Click provider chips to filter
- **Verification Status**: CONFIRMED/QUESTIONED/UNKNOWN badges
- **Trust Score**: 0-100% confidence indicator
- **Issue Tags**: Reported problems (rate limit, unavailable, etc.)
- **Real-time**: Data auto-refreshes hourly

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
- Serve static files from project root
- Proxy `/data/` requests to data directory
- Handle HTTPS with SSL certificate
- Redirect HTTP to HTTPS

## Deployment

### Current Setup (Raspberry Pi)

Your site is already deployed and publicly accessible:
- **Domain**: freeai4all.duckdns.org
- **Server**: Nginx on Raspberry Pi 3+
- **SSL**: Let's Encrypt certificate
- **DNS**: DuckDNS (updates every 5 minutes)

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

### Development

**Available Scripts:**
- `npm run dev` - Start Astro development server
- `npm run build` - Build static site to dist/
- `npm run preview` - Preview built site locally
- `npm run scrape` - Full 2-phase scraping with verification
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

**Build & Deploy:**
```bash
# Build the site (generates static files in dist/)
npm run build

# Copy to web server (example for nginx)
sudo cp -r dist/* /var/www/html/

# Or preview locally
npm run preview
```

## Cost

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Hosting (Raspberry Pi) | $0 | Uses existing hardware |
| Domain (DuckDNS) | $0 | Free dynamic DNS |
| SSL Certificate | $0 | Let's Encrypt free tier |
| GitHub Actions | $0 | Free tier (hourly runs) |
| Power (Pi 24/7) | ~$5 | Estimated |
| **Total** | **~$5** | ✅ Very cost-effective |

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Documentation

- **`README.md`** - This file (2-phase scraping guide)
- **`PUBLIC-ACCESS-GUIDE.md`** - Guide for public hosting setup
- **`ROADMAP.md`** - Original project roadmap

## Troubleshooting

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement 2-phase scraping improvements
4. Add new verification sources (Hacker News, etc.)
5. Run tests: `npm test`
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- 📖 Check this README for 2-phase scraping details
- 📖 Check `PUBLIC-ACCESS-GUIDE.md` for hosting help
- 🐛 Open an issue on GitHub

## Acknowledgments

- **Data**: [models.dev](https://models.dev) API
- **Verification**: GitHub & Stack Overflow APIs
- **Hosting**: Built with ❤️ on Raspberry Pi 3+
- **Security**: SSL by Let's Encrypt
- **DNS**: DuckDNS

---

**Last Updated:** February 10, 2026  
**Version:** 2.1.0  
**Status:** 🎉 Production Ready - 2-Phase Scraping Active
