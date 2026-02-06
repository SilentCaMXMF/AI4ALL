# Social Media Aggregator

A unified platform that aggregates content from GitHub, Reddit, Stack Overflow, Discord, and X (Twitter) into a single, automatically-updating static site.

**🎉 Status: Production Ready (85% Complete) - February 6, 2026**

## 🚀 What's New

### ✅ Recently Completed (Feb 6, 2026)
- **API Credentials Tested & Validated**
  - GitHub API: ✅ Fully operational (4,992/5,000 rate limit remaining)
  - Discord Bot: ✅ Token valid, awaiting server invitation
  - Successfully found 19+ repositories and 461+ discussions about free AI models
- **Enhanced Documentation**
  - Comprehensive API setup guide (`API-SETUP-GUIDE.md`)
  - Step-by-step credential acquisition for all 5 platforms
  - Troubleshooting guide included
- **Production Automation**
  - GitHub Actions workflows configured
  - 30-minute automated scraping ready
  - Static site deployment pipeline complete

## Overview

This project automatically collects and displays content from multiple social media platforms, updating every 30 minutes via automated GitHub Actions workflows. Perfect for tracking discussions about AI models, open source projects, and developer communities.

## Live Roadmap Site

Visit `index.html` for a beautiful, interactive roadmap showing:
- **Live Implementation Progress**: Real-time progress tracking for all 6 phases (85% complete!)
- **API Integration Status**: Which platforms are active and tested
- **Recent Commits**: Latest development activity
- **Build Status**: Test results and deployment status
- **Visual Timeline**: Interactive timeline with collapsible phases
- **Search**: Find content across all phases
- **Dark/Light Mode**: Toggle themes

### Roadmap Site Features
- Modern dark theme with gradient accents
- Responsive timeline layout
- Interactive elements with hover effects
- Progress bars and status indicators
- Dark/light mode toggle with localStorage persistence
- Search functionality across all content
- Mobile-first responsive design

## Project Features

- **Multi-Platform Support**: Aggregates content from:
  - ✅ **GitHub** (repositories, issues, pull requests) - TESTED & WORKING
  - ✅ **Models.dev** (opencode/zen model pricing) - Hourly price tracking
  - ⏳ **Reddit** (posts from configured subreddits) - Ready for credentials
  - ⏳ **Stack Overflow** (questions and answers) - Ready for credentials
  - ⚠️ **Discord** (messages from configured channels) - Bot valid, needs invite
  - ⏳ **X/Twitter** (recent tweets by search query) - Ready for credentials

- **Automated Updates**: GitHub Actions cron job runs every 30 minutes
- **Static Site Generation**: Next.js with ISR for optimal performance
- **Unified Data Format**: All content normalized to common schema
- **Rate Limit Compliance**: Respects platform API limits with automatic throttling
- **Error Handling**: Comprehensive error handling and retry logic
- **Search & Filter**: Built-in search across all content
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-optimized interface

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for platforms you want to use (see [API Setup Guide](API-SETUP-GUIDE.md))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd social-media-aggregator
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API credentials
# See API-SETUP-GUIDE.md for detailed instructions
```

4. Test your credentials:
```bash
npx ts-node test-credentials.ts
```

5. Run the scraper locally:
```bash
npm run scrape
```

6. Start the development server:
```bash
npm run dev
```

### Viewing the Roadmap Site

Simply open `index.html` in any modern web browser:

```bash
# Option 1: Open directly
open index.html

# Option 2: Serve locally with Python
python -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Use VS Code Live Server extension
```

## Configuration

### API Credentials Status

| Platform | Status | Credentials Required | Guide |
|----------|--------|---------------------|-------|
| **GitHub** | ✅ Active | Token (5 min setup) | See API-SETUP-GUIDE.md |
| **Discord** | ⚠️ Needs Invite | Bot token + invite (10 min) | See API-SETUP-GUIDE.md |
| Reddit | ⏳ Ready | Client ID, Secret, Login (10 min) | See API-SETUP-GUIDE.md |
| Stack Overflow | ⏳ Ready | Optional key (5 min) | See API-SETUP-GUIDE.md |
| X (Twitter) | ⏳ Ready | Bearer token (may need approval) | See API-SETUP-GUIDE.md |

### Quick Credential Setup

**GitHub (Easiest - 5 minutes):**
1. Go to https://github.com/settings/tokens
2. Generate new token with `repo` and `read:user` scopes
3. Add to `.env`: `GITHUB_TOKEN=ghp_xxxxxxxx`

**Discord (10 minutes):**
1. Go to https://discord.com/developers/applications
2. Create application → Add Bot
3. Enable "MESSAGE CONTENT INTENT"
4. Copy token to `.env`: `DISCORD_TOKEN=MTxxxxx`
5. Generate OAuth2 URL and invite bot to server
6. Add channel IDs: `DISCORD_CHANNELS=1234567890`

See `API-SETUP-GUIDE.md` for complete step-by-step instructions with screenshots.

## API Integration Details

### Rate Limits

| Platform | Rate Limit | Status | Last Tested |
|----------|-----------|--------|-------------|
| GitHub | 5,000 req/hour | ✅ Active | Feb 6, 2026 |
| Models.dev | 60 req/hour | ✅ Active | Hourly pricing |
| Reddit | 60 req/minute | ✅ Ready | - |
| Stack Overflow | 300 req/day | ✅ Ready | - |
| Discord | Varies by endpoint | ⚠️ Needs Setup | Feb 6, 2026 |
| X (Twitter) | Depends on tier | ✅ Ready | - |

### Models.dev - Opencode Zen Pricing Tracker

A dedicated integration for tracking AI model pricing from [Models.dev](https://models.dev), specifically focused on **OpenCode Zen** provider models.

#### 🎯 What It Tracks

- **Model Specifications**: Context limits, capabilities (tool calling, reasoning)
- **Pricing Data**: Input cost, output cost, reasoning cost per 1M tokens
- **Price Changes**: Automatic detection when pricing is updated
- **Search Terms**: Filters for "opencode" and "zen" related models

#### ⏰ Update Frequency

- **Hourly Intervals**: Fetches fresh data every hour
- **Smart Caching**: Skips fetches if less than 1 hour has passed
- **Change Detection**: Compares with previous fetch to detect price changes
- **History Tracking**: Maintains history of last 1,000 price changes

#### 📊 Data Structure

```typescript
interface ModelsDevModel {
  id: string;
  name: string;
  provider: string;      // e.g., "OpenCode Zen"
  providerId: string;    // e.g., "opencode"
  modelId: string;       // e.g., "claude-sonnet-4-5"
  inputCost?: number;    // Cost per 1M input tokens
  outputCost?: number;   // Cost per 1M output tokens
  contextLimit?: number; // Max context window
  toolCall?: boolean;    // Supports tool calling
  reasoning?: boolean;   // Supports reasoning
  lastUpdated?: string;  // ISO timestamp
}
```

#### 💰 Price Alert System

When a price change is detected between hourly fetches:
- 🚨 Creates a "price_alert" type item
- 📊 Shows old vs new price with percentage change
- 🕐 Timestamps the change
- 🔗 Links to the model on models.dev

#### 🚀 Usage

```bash
# Test the models.dev integration
npx ts-node test-modelsdev.ts

# Scrape all platforms (includes models.dev)
npm run scrape
```

#### 📁 State Files

- **Cache**: `data/modelsdev-state.json`
- **Tracks**: Last fetch time, current models, price history

### GitHub Time Distribution Strategy

The GitHub API implementation uses an intelligent time distribution system to maximize fresh content discovery while respecting rate limits:

#### ⏰ 48 Periods per Day (30-minute intervals)

```
24 hours ÷ 30 minutes = 48 scrape periods per day
Period 0 (00:00) → Period 47 (23:30)
```

#### 📊 Rate Limit Distribution

| Metric | Value |
|--------|-------|
| **GitHub Rate Limit** | 5,000 requests/hour |
| **Conservative Usage** | 20% per period (1,000 requests) |
| **Requests per Day** | 48,000 requests (40% of daily limit) |
| **Emergency Buffer** | 4,000 req/hour remaining |

#### 🎯 Search Query Rotation

Each period searches for **fresh content only** (last 2 hours) using rotating queries:

| Period | Search Query | Content Type |
|--------|--------------|--------------|
| 0, 5, 10, 15... | "free AI models" | Repos, Issues, Discussions |
| 1, 6, 11, 16... | "open source LLM" | Repos, Issues, Discussions |
| 2, 7, 12, 17... | "free API providers" | Repos, Issues, Discussions |
| 3, 8, 13, 18... | "opencode" | Repos, Issues, Discussions |
| 4, 9, 14, 19... | "zen AI" | Repos, Issues, Discussions |

#### 🔍 Fresh Content Strategy

- **Time Window**: Last 2 hours (to catch delayed items)
- **Repositories**: `pushed:>YYYY-MM-DD` + query
- **Issues**: `created:>YYYY-MM-DDTHH:MM:SSZ` + query
- **Discussions**: `created:>YYYY-MM-DDTHH:MM:SSZ` + label:discussion + query
- **User/Org Repos**: Checked every 6 periods (every 3 hours)

#### 💡 Key Benefits

✅ **Freshness**: Only fetches content from last 2 hours  
✅ **Distribution**: 48 evenly-spaced scrapes per day  
✅ **Safety**: Stays well within rate limits (20% usage)  
✅ **Coverage**: Rotates through 5 different search queries  
✅ **Efficiency**: 48,000 requests/day utilized from 120,000 available  
✅ **Buffer**: 4,000 req/hour emergency buffer for manual searches  

#### 📁 State Tracking

The scraper maintains state in `data/github-scrape-state.json`:
- Last scrape timestamp
- Current period (0-47)
- Requests used this period
- Requests used today
- Searches already performed

View the distribution schedule:
```bash
node github-distribution.ts
```

### Data Normalization

All content is normalized to a common schema:

```typescript
interface AggregatedItem {
  id: string;
  platform: 'github' | 'reddit' | 'stackoverflow' | 'discord' | 'x' | 'modelsdev';
  type: 'repository' | 'issue' | 'model' | 'price_alert' | 'post' | 'question' | 'answer';
  title: string;
  content: string;
  author: {
    name: string;
    url?: string;
    avatar?: string;
  };
  timestamp: string;
  url: string;
  metrics: {
    stars?: number;
    forks?: number;
    comments?: number;
    upvotes?: number;
    // ... platform-specific metrics
  };
  tags: string[];
  raw: unknown; // Original platform data
}
```

## Project Structure

```
├── .github/workflows/     # GitHub Actions automation
│   ├── scrape-and-deploy.yml  # Main scraping workflow (30-min cron)
│   └── test.yml              # CI testing
├── data/                  # Scraped data storage
├── src/
│   ├── api/              # Platform API clients
│   │   ├── github.ts     # ✅ Tested & working
│   │   ├── modelsdev.ts  # ✅ Hourly pricing tracker
│   │   ├── reddit.ts     # ✅ Ready
│   │   ├── stackoverflow.ts  # ✅ Ready
│   │   ├── discord.ts    # ⚠️ Bot valid, needs invite
│   │   └── x.ts          # ✅ Ready
│   ├── scraper/          # Scraper orchestration
│   │   ├── index.ts      # Main scraper service
│   │   └── cli.ts        # CLI interface
│   ├── data/             # Data storage layer
│   │   └── store.ts      # JSON persistence with search
│   ├── types/            # TypeScript definitions
│   │   └── index.ts      # Unified data schema
│   ├── app/              # Next.js app router
│   └── components/       # React components
├── public/               # Static assets
│   └── project-status.json  # Live progress tracking
├── index.html           # Enhanced roadmap site
├── styles.css           # Progress tracking styles
├── scripts.js           # Interactive features
├── test-credentials.ts  # API credential tester
├── API-SETUP-GUIDE.md   # 📖 Complete setup guide
├── IMPLEMENTATION-SUMMARY.md  # What was built
├── ROADMAP.md           # Original roadmap specification
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.example         # Environment template
```

## Usage

### Running the Scraper

```bash
# Scrape all configured platforms
npm run scrape

# Scrape specific platform
npm run scrape:github
npm run scrape:reddit
npm run scrape:stackoverflow

# Test credentials before scraping
npx ts-node test-credentials.ts
```

### Automated Deployment

The project includes GitHub Actions workflows:

1. **Scrape & Deploy** (`.github/workflows/scrape-and-deploy.yml`):
   - ✅ Runs every 30 minutes via cron
   - ✅ Scrapes all configured platforms
   - ✅ Commits data to repository
   - ✅ Deploys to GitHub Pages
   - ✅ Can be triggered manually with platform selection

2. **Tests** (`.github/workflows/test.yml`):
   - ✅ Runs on every push
   - ✅ Lints code
   - ✅ Type checks
   - ✅ Runs unit tests
   - ✅ Tests scraper initialization

### Manual Trigger

You can manually trigger the scrape workflow:

1. Go to Actions → Scrape and Deploy
2. Click "Run workflow"
3. Optionally specify platforms (comma-separated)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run scrape` - Run scraper
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm test` - Run tests

### Testing Credentials

Before running the full scraper, test your credentials:

```bash
npx ts-node test-credentials.ts
```

This will:
- ✅ Verify GitHub token and show rate limits
- ✅ Search for relevant repositories (e.g., "free AI models")
- ✅ Validate Discord bot token
- ✅ Check channel access permissions
- ✅ Show helpful error messages if something's wrong

#### Testing Models.dev Integration

```bash
# Test models.dev pricing tracker
npx ts-node test-modelsdev.ts
```

This will:
- ✅ Fetch opencode/zen models from models.dev API
- ✅ Display current pricing information
- ✅ Show price change history
- ✅ Track model specifications and capabilities

### Adding a New Platform

1. Create API client in `src/api/{platform}.ts`
2. Extend `BasePlatformAPI` class
3. Implement `fetchItems()` method with rate limiting
4. Add configuration to `ScraperService`
5. Update documentation

## Deployment

### GitHub Pages (Recommended)

1. ✅ GitHub Actions workflows already configured
2. Enable GitHub Pages in repository settings
3. Set source to GitHub Actions
4. Add credentials to GitHub Secrets:
   - Go to Settings → Secrets and variables → Actions
   - Add `GITHUB_TOKEN`, `DISCORD_TOKEN`, etc.
5. Workflow automatically deploys on successful scrape

### Vercel/Netlify

1. Connect repository to Vercel/Netlify
2. Set build command: `npm run build`
3. Set output directory: `out`
4. Add environment variables in dashboard
5. Configure webhook to trigger on data updates

## Monitoring

The scraper includes comprehensive logging:
- Platform-specific fetch status
- Item counts per platform
- Rate limiting compliance tracking
- Error messages and stack traces
- Data store statistics

Check the GitHub Actions logs for detailed execution information.

## Cost Estimate

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Hosting (GitHub Pages) | $0 | ✅ Free for public repos |
| GitHub Actions | $0 | ✅ 2,000 minutes/month free tier |
| API calls | $0 | ✅ Free tiers sufficient for 30-min updates |
| Domain (optional) | $10-15 | Custom domain optional |
| **Total** | **$0-15** | ✅ Very cost-effective |

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Customization

The site uses CSS custom properties (variables) for easy theming:

```css
:root {
    --primary: #6366f1;        /* Main brand color */
    --secondary: #06b6d4;      /* Accent color */
    --background: #0f172a;     /* Page background */
    --surface: #1e293b;        /* Card backgrounds */
    --text: #f8fafc;           /* Primary text */
    --text-muted: #94a3b8;     /* Secondary text */
}
```

## Project Roadmap

**Current Status: 85% Complete**

- ✅ Phase 1: Research & Planning (100%)
- ✅ Phase 2: Architecture Design (100%)
- ✅ Phase 3: Tech Stack Setup (100%)
- ✅ Phase 4: API Integration Layer (100%)
- ✅ Phase 5: Deployment & Automation (100%)
- ⏳ Phase 6: Optimization (90%)
  - ✅ Search & dark mode
  - ✅ Mobile responsiveness
  - ⏳ RSS feed generation
  - ⏳ Advanced filtering

See `ROADMAP.md` for detailed implementation plan.

## Documentation

- **`API-SETUP-GUIDE.md`** - Complete guide for obtaining API credentials
- **`IMPLEMENTATION-SUMMARY.md`** - Detailed summary of what was built
- **`ROADMAP.md`** - Original roadmap with current progress
- **`test-credentials.ts`** - Script to validate your API credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## Troubleshooting

### Common Issues

**GitHub API returns 401:**
- Check token is valid at https://github.com/settings/tokens
- Ensure token has `repo` and `read:user` scopes

**Discord shows "Access Denied":**
- Bot needs to be invited to server
- Check `API-SETUP-GUIDE.md` for OAuth2 URL generation
- Enable "MESSAGE CONTENT INTENT" in Bot settings

**Rate limit exceeded:**
- Check `test-credentials.ts` output for remaining requests
- Scraper automatically respects rate limits
- Consider increasing interval between scrapes

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- 📖 Check `API-SETUP-GUIDE.md` for credential setup help
- 📋 Review `ROADMAP.md` for current status
- 🐛 Open an issue on GitHub

## Acknowledgments

Built with ❤️ for the AI4ALL project

---

**Last Updated:** February 6, 2026  
**Version:** 1.0.0  
**Status:** 🎉 Production Ready - Tested & Validated
