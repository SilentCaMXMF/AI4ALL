# Free AI Models Aggregator

A curated directory of **free AI models** aggregated from [models.dev](https://models.dev). Discover free LLMs, their providers, capabilities, and pricing (all free!) in one searchable dashboard.

**🎉 Status: Production Ready - February 8, 2026**

## 🌐 Live Site

**🔗 https://freeai4all.duckdns.org**

Your Free AI Models dashboard is publicly accessible with HTTPS encryption!

## 🎯 What's New

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

This project automatically discovers and catalogs **free AI models** from various providers. The data is fetched hourly from models.dev API and displayed in a beautiful, searchable dashboard.

### Key Features

- **452+ Free Models**: Automatically discovers free AI models (input & output cost = $0)
- **Provider Filtering**: Browse by provider (OpenRouter, Nvidia, GitHub Models, etc.)
- **Capability Tags**: Filter by features (Tool Calling, Reasoning, Vision, Audio, Open Weights)
- **Real-time Updates**: Data refreshes hourly via automated GitHub Actions
- **Mobile-Friendly**: Responsive design works on all devices
- **HTTPS Secured**: SSL certificate with auto-renewal

## 🌐 Live Site

**Access your dashboard:**
- **Public URL**: https://freeai4all.duckdns.org
- **Local**: http://localhost/dashboard.html
- **Network**: http://192.168.1.67/dashboard.html

## Project Architecture

```
Raspberry Pi 3+ (Your Device)
├── Nginx (Port 80/443)
│   ├── HTTPS with Let's Encrypt SSL
│   ├── Static file serving
│   └── Data API endpoint
├── GitHub Actions (Hourly)
│   └── Scrapes free models from models.dev
│   └── Commits to data/aggregated-data.json
└── DuckDNS Client (Every 5 min)
    └── Updates DNS with your public IP
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

3. Run the scraper to populate data:
```bash
npm run scrape
```

4. Serve locally:
```bash
python3 -m http.server 8080
# Visit http://localhost:8080/dashboard.html
```

### Viewing the Dashboard

Simply open `dashboard.html` in any modern web browser, or visit the live site:

```bash
# Local
open dashboard.html

# Or serve with Python
python3 -m http.server 8080
# Then visit http://localhost:8080/dashboard.html
```

## Data Source

### models.dev API

The dashboard aggregates data from [models.dev](https://models.dev/api.json), a comprehensive database of AI models.

**What qualifies as "free":**
- Models where `cost.input === 0` AND `cost.output === 0`
- No API key required for access
- Currently tracking **452+ free models**

**Top providers with free models:**
| Provider | Free Models |
|----------|-------------|
| OpenRouter | 77 |
| Nvidia | 70 |
| GitHub Models | 55 |
| Poe | 47 |
| Ollama Cloud | 29 |
| Firmware | 20 |

**Update Frequency:**
- **Hourly**: Automated via GitHub Actions cron job
- **Manual**: Run `npm run scrape` locally

## Project Structure

```
├── .github/workflows/
│   └── scrape-and-deploy.yml  # Hourly scraper workflow
├── data/
│   └── aggregated-data.json   # Free AI models data
├── src/
│   ├── api/
│   │   └── modelsdev.ts      # Free models API client
│   ├── scraper/
│   │   ├── index.ts          # Scraper service
│   │   └── cli.ts            # CLI interface
│   ├── data/
│   │   └── store.ts          # Data persistence
│   └── types/
│       └── index.ts          # TypeScript definitions
├── dashboard.html            # Main dashboard UI
├── favicon.ico               # Site favicon
├── scripts/
│   ├── setup-duckdns.sh      # DuckDNS setup script
│   └── setup-public-access.sh # Public access setup
├── PUBLIC-ACCESS-GUIDE.md    # Public hosting guide
└── package.json
```

## Usage

### Running the Scraper

```bash
# Scrape free AI models from models.dev
npm run scrape
```

### Automated Updates

The GitHub Actions workflow runs hourly:
- Fetches fresh data from models.dev
- Filters for free models only
- Commits to repository
- Your local nginx serves the updated data

### Manual Trigger

You can manually trigger the scrape workflow:
1. Go to Actions → Scrape Free AI Models
2. Click "Run workflow"

## Configuration

### Environment Variables

None required! The scraper uses models.dev public API (no authentication needed).

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
```

## Development

### Available Scripts

- `npm run scrape` - Fetch free AI models from models.dev
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm test` - Run tests

### Dashboard Features

- **Search**: Find models by name, provider, or capability
- **Provider Filter**: Click provider chips to filter
- **Statistics**: Total models count, provider count
- **Real-time**: Data auto-refreshes from GitHub Actions

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

- **`PUBLIC-ACCESS-GUIDE.md`** - Guide for public hosting setup
- **`ROADMAP.md`** - Original project roadmap
- **`API-SETUP-GUIDE.md`** - Legacy API setup (not needed anymore)

## Troubleshooting

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
- 📖 Check `PUBLIC-ACCESS-GUIDE.md` for hosting help
- 🐛 Open an issue on GitHub

## Acknowledgments

- Data sourced from [models.dev](https://models.dev)
- Built with ❤️ on a Raspberry Pi 3+
- SSL by Let's Encrypt
- DNS by DuckDNS

---

**Last Updated:** February 8, 2026  
**Version:** 2.0.0  
**Status:** 🎉 Production Ready - Publicly Accessible
