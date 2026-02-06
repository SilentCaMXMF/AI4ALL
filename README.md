# Social Media Aggregator

A unified platform that aggregates content from GitHub, Reddit, Stack Overflow, Discord, and X (Twitter) into a single, automatically-updating static site.

## Overview

This project automatically collects and displays content from multiple social media platforms, updating every 30 minutes via automated GitHub Actions workflows.

## Live Roadmap Site

Visit `index.html` for a beautiful, interactive roadmap showing:
- **Live Implementation Progress**: Real-time progress tracking for all 6 phases
- **API Integration Status**: Which platforms are active and implemented
- **Recent Commits**: Latest development activity
- **Build Status**: Test results and deployment status
- **Visual Timeline**: Interactive timeline with collapsible phases

### Roadmap Site Features
- Modern dark theme with gradient accents
- Responsive timeline layout
- Interactive elements with hover effects
- Progress bars and status indicators
- Dark/light mode toggle
- Search functionality across all content
- Mobile-first responsive design

## Project Features

- **Multi-Platform Support**: Aggregates content from:
  - GitHub (repositories, issues, pull requests)
  - Reddit (posts from configured subreddits)
  - Stack Overflow (questions and answers)
  - Discord (messages from configured channels)
  - X/Twitter (recent tweets by search query)

- **Automated Updates**: GitHub Actions cron job runs every 30 minutes
- **Static Site Generation**: Next.js with ISR for optimal performance
- **Unified Data Format**: All content normalized to common schema
- **Rate Limit Compliance**: Respects platform API limits with automatic throttling
- **Error Handling**: Comprehensive error handling and retry logic
- **Search & Filter**: Built-in search across all content
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-optimized interface

## Project Structure

```
├── .github/workflows/     # GitHub Actions automation
│   ├── scrape-and-deploy.yml  # Main scraping workflow
│   └── test.yml              # CI testing
├── data/                  # Scraped data storage
├── src/
│   ├── api/              # Platform API clients
│   │   ├── github.ts
│   │   ├── reddit.ts
│   │   ├── stackoverflow.ts
│   │   ├── discord.ts
│   │   └── x.ts
│   ├── scraper/          # Scraper orchestration
│   │   ├── index.ts
│   │   └── cli.ts
│   ├── data/             # Data storage layer
│   │   └── store.ts
│   ├── types/            # TypeScript definitions
│   │   └── index.ts
│   ├── app/              # Next.js app router
│   └── components/       # React components
├── public/               # Static assets
│   └── project-status.json  # Live progress tracking
├── index.html           # Static roadmap site
├── styles.css           # Enhanced styles with progress tracking
├── scripts.js           # Interactive features
├── ROADMAP.md           # Original roadmap specification
├── package.json
├── tsconfig.json
└── next.config.js
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for platforms you want to use

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
```

4. Run the scraper locally:
```bash
npm run scrape
```

5. Start the development server:
```bash
npm run dev
```

## Configuration

### Required API Credentials

#### GitHub
- Get token: https://github.com/settings/tokens
- Required scopes: `repo`, `read:user`
- Env var: `GITHUB_TOKEN`

#### Reddit
- Create app: https://www.reddit.com/prefs/apps
- Required: Client ID, Client Secret, Username, Password
- Env vars: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`

#### Stack Overflow
- Optional: Get key at https://stackapps.com/apps/oauth/register
- Higher rate limits with key
- Env var: `STACKOVERFLOW_KEY`

#### Discord
- Create bot: https://discord.com/developers/applications
- Required: Bot token and channel IDs
- Env vars: `DISCORD_TOKEN`, `DISCORD_CHANNELS`

#### X (Twitter)
- Apply for access: https://developer.twitter.com/en/portal/dashboard
- Required: Bearer Token
- Env var: `X_BEARER_TOKEN`

### Environment Variables

See `.env.example` for all available configuration options.

## Usage

### Running the Scraper

```bash
# Scrape all configured platforms
npm run scrape

# Scrape specific platform
npm run scrape:github
npm run scrape:reddit
npm run scrape:stackoverflow
```

### Automated Deployment

The project includes GitHub Actions workflows:

1. **Scrape & Deploy** (`.github/workflows/scrape-and-deploy.yml`):
   - Runs every 30 minutes
   - Scrapes all configured platforms
   - Commits data to repository
   - Deploys to GitHub Pages

2. **Tests** (`.github/workflows/test.yml`):
   - Runs on every push
   - Lints code
   - Type checks
   - Runs unit tests

### Manual Trigger

You can manually trigger the scrape workflow:

1. Go to Actions → Scrape and Deploy
2. Click "Run workflow"
3. Optionally specify platforms (comma-separated)

## API Integration Details

### Rate Limits

| Platform | Rate Limit | Implemented |
|----------|-----------|-------------|
| GitHub | 5,000 req/hour | ✅ Yes |
| Reddit | 60 req/minute | ✅ Yes |
| Stack Overflow | 300 req/day | ✅ Yes |
| Discord | Varies by endpoint | ✅ Yes |
| X (Twitter) | Depends on tier | ✅ Yes |

### Data Normalization

All content is normalized to a common schema:

```typescript
interface AggregatedItem {
  id: string;
  platform: 'github' | 'reddit' | 'stackoverflow' | 'discord' | 'x';
  type: string;
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

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run scrape` - Run scraper
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm test` - Run tests

### Viewing the Roadmap Site Locally

Simply open `index.html` in any modern web browser:

```bash
# Option 1: Open directly
open index.html

# Option 2: Serve locally with Python
python -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Use VS Code Live Server extension
```

### Adding a New Platform

1. Create API client in `src/api/{platform}.ts`
2. Extend `BasePlatformAPI` class
3. Implement `fetchItems()` method
4. Add configuration to `ScraperService`
5. Update documentation

## Deployment

### GitHub Pages

1. Enable GitHub Pages in repository settings
2. Set source to GitHub Actions
3. Workflow automatically deploys on successful scrape

### Vercel/Netlify

1. Connect repository to Vercel/Netlify
2. Set build command: `npm run build`
3. Set output directory: `out`
4. Add environment variables in dashboard

## Monitoring

The scraper includes comprehensive logging:
- Platform-specific fetch status
- Item counts per platform
- Error messages and stack traces
- Rate limiting compliance
- Data store statistics

## Cost Estimate

| Component | Monthly Cost |
|-----------|-------------|
| Hosting (Vercel/Netlify) | $0 (free tier) |
| GitHub Actions | $0 (within free tier) |
| API calls | $0-50 (depends on usage) |
| Domain (optional) | $10-15 |
| **Total** | **$0-65** |

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation in `docs/` directory
- Review troubleshooting guide

## Roadmap

See `ROADMAP.md` for detailed implementation plan and progress tracking.

---

Built with ❤️ for the AI4ALL project
