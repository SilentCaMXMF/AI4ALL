# API Key Setup and Platform Configuration Guide

This guide explains how to set up API keys and configure the multi-platform scraping system for enhanced verification.

## Overview

The enhanced scraping system supports multiple platforms for social media verification:

| Platform | Purpose | Required | Rate Limit |
|----------|---------|----------|------------|
| GitHub | Issues, discussions, repositories | Optional | 5000/hr |
| Reddit | Community feedback | Optional | 60/hr |
| Stack Overflow | Technical Q&A | Optional | 300/hr |
| Hugging Face | Model discussions | Optional | 1000/hr |
| Hacker News | Community discussions | Optional | 1000/hr |
| X (Twitter) | Real-time mentions | Optional | 450/15min |

## Environment Variables

### Required for Basic Operation
```bash
# No required environment variables for basic scraping
```

### Optional for Enhanced Verification

#### GitHub API
```bash
GITHUB_TOKEN=ghp_xxx_your_github_token_here
GITHUB_USERNAME=your_github_username
```

#### Reddit API
```bash
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

#### Stack Overflow API
```bash
STACKOVERFLOW_KEY=your_stackoverflow_api_key
```

#### Hugging Face API
```bash
HUGGINGFACE_TOKEN=your_huggingface_token
```

#### Hacker News API
```bash
# No API key required for Hacker News
```

#### X (Twitter) API
```bash
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
```

## Platform Configuration

The scraper can be configured to enable/disable specific platforms via environment variables:

### Platform Enable/Disable
```bash
# Enable specific platforms
ENABLE_GITHUB=true
ENABLE_REDDIT=true
ENABLE_STACKOVERFLOW=true
ENABLE_HUGGINGFACE=true
ENABLE_HACKERNEWS=true
ENABLE_X=true

# Disable specific platforms
ENABLE_GITHUB=false
ENABLE_REDDIT=false
ENABLE_STACKOVERFLOW=false
ENABLE_HUGGINGFACE=false
ENABLE_HACKERNEWS=false
ENABLE_X=false
```

### Default Configuration
By default, all platforms are enabled except X (Twitter) due to stricter rate limits:

```bash
ENABLE_GITHUB=true
ENABLE_REDDIT=true
ENABLE_STACKOVERFLOW=true
ENABLE_HUGGINGFACE=true
ENABLE_HACKERNEWS=true
ENABLE_X=false
```

## Rate Limiting Strategy

Each platform has different rate limits. The system automatically manages rate limiting:

### Platform Rate Limits
- **GitHub**: 5000 requests per hour
- **Reddit**: 60 requests per hour  
- **Stack Overflow**: 300 requests per hour
- **Hugging Face**: 1000 requests per hour
- **Hacker News**: 1000 requests per hour
- **X (Twitter)**: 450 requests per 15 minutes

### Rate Limit Management
- The system tracks remaining requests for each platform
- Automatic backoff when rate limits are reached
- Retry after specified time periods
- Platform-specific rate limit handling

## API Key Management

### GitHub API Setup
1. **Generate Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Click "Generate new token"
   - Select scopes: `public_repo`, `read:org`, `read:user`
   - Copy the generated token

2. **Set Environment Variable**:
   ```bash
   export GITHUB_TOKEN=ghp_xxx_your_token_here
   ```

### Reddit API Setup
1. **Create Reddit App**:
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create app" or "Create another app"
   - Select "script" application type
   - Fill in required details
   - Copy client ID and client secret

2. **Set Environment Variables**:
   ```bash
   export REDDIT_CLIENT_ID=your_client_id
   export REDDIT_CLIENT_SECRET=your_client_secret
   export REDDIT_USERNAME=your_username
   export REDDIT_PASSWORD=your_password
   ```

### Stack Overflow API Setup
1. **Register Application**:
   - Go to https://stackapps.com/apps/oauth/register
   - Fill in application details
   - Copy the API key

2. **Set Environment Variable**:
   ```bash
   export STACKOVERFLOW_KEY=your_api_key
   ```

### Hugging Face API Setup
1. **Generate Access Token**:
   - Go to https://huggingface.co/settings/tokens
   - Click "New token"
   - Copy the generated token

2. **Set Environment Variable**:
   ```bash
   export HUGGINGFACE_TOKEN=your_token
   ```

### X (Twitter) API Setup
1. **Create Twitter Developer Account**:
   - Apply for developer access at https://developer.twitter.com
   - Create a new app
   - Copy API key, API secret, and bearer token

2. **Set Environment Variables**:
   ```bash
   export TWITTER_BEARER_TOKEN=your_bearer_token
   export TWITTER_API_KEY=your_api_key
   export TWITTER_API_SECRET=your_api_secret
   ```

## Configuration Examples

### Basic Setup (Minimal)
```bash
# Only GitHub for better verification
export GITHUB_TOKEN=ghp_xxx_your_token_here
export GITHUB_USERNAME=your_username
```

### Full Setup (All Platforms)
```bash
# GitHub
export GITHUB_TOKEN=ghp_xxx_your_token_here
export GITHUB_USERNAME=your_username

# Reddit
export REDDIT_CLIENT_ID=your_reddit_client_id
export REDDIT_CLIENT_SECRET=your_reddit_client_secret
export REDDIT_USERNAME=your_reddit_username
export REDDIT_PASSWORD=your_reddit_password

# Stack Overflow
export STACKOVERFLOW_KEY=your_stackoverflow_api_key

# Hugging Face
export HUGGINGFACE_TOKEN=your_huggingface_token

# X (Twitter)
export TWITTER_BEARER_TOKEN=your_twitter_bearer_token
export TWITTER_API_KEY=your_twitter_api_key
export TWITTER_API_SECRET=your_twitter_api_secret
```

### Selective Platform Setup
```bash
# Only Reddit and Stack Overflow
export REDDIT_CLIENT_ID=your_reddit_client_id
export REDDIT_CLIENT_SECRET=your_reddit_client_secret
export REDDIT_USERNAME=your_reddit_username
export REDDIT_PASSWORD=your_reddit_password

export STACKOVERFLOW_KEY=your_stackoverflow_api_key

# Disable other platforms
export ENABLE_GITHUB=false
export ENABLE_HUGGINGFACE=false
export ENABLE_HACKERNEWS=false
export ENABLE_X=false
```

## Testing API Configuration

### Test GitHub API
```bash
# Test GitHub API connectivity
curl -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/user
```

### Test Reddit API
```bash
# Test Reddit API connectivity
curl -X POST -d 'grant_type=password&username=$REDDIT_USERNAME&password=$REDDIT_PASSWORD' \
     -H "Authorization: Basic $(echo -n '$REDDIT_CLIENT_ID:$REDDIT_CLIENT_SECRET' | base64)" \
     https://www.reddit.com/api/v1/access_token
```

### Test Stack Overflow API
```bash
# Test Stack Overflow API connectivity
curl -H "Accept: application/json" \
     -H "Authorization: Bearer $STACKOVERFLOW_KEY" \
     https://api.stackexchange.com/2.3/info?site=stackoverflow
```

## Troubleshooting

### Common Issues

#### GitHub API Issues
- **Error**: "Bad credentials"
  - Solution: Check token permissions and validity
- **Error**: "API rate limit exceeded"
  - Solution: Wait for rate limit reset or use higher-tier token

#### Reddit API Issues
- **Error**: "Invalid client_id or client_secret"
  - Solution: Verify Reddit app credentials
- **Error**: "Rate limit exceeded"
  - Solution: Check Reddit API rate limits (60/hr)

#### Stack Overflow API Issues
- **Error**: "Invalid API key"
  - Solution: Verify Stack Overflow API key
- **Error**: "Quota exceeded"
  - Solution: Check Stack Overflow API quota (300/hr)

#### General Issues
- **Error**: "Environment variable not set"
  - Solution: Check environment variable names and values
- **Error**: "Network timeout"
  - Solution: Check network connectivity and API availability

### Debug Mode
Enable debug mode to see detailed API requests and responses:

```bash
export DEBUG=true
npm run scrape
```

### Logging
All API requests and responses are logged to `.scraper.log`:

```bash
# View scraper logs
tail -f .scraper.log
```

## Security Best Practices

### API Key Security
- Never commit API keys to version control
- Use environment variables for API keys
- Rotate API keys regularly
- Use different keys for different environments

### Rate Limit Protection
- Monitor API usage to avoid rate limits
- Implement exponential backoff for retries
- Use platform-specific rate limit headers
- Consider API key tiers for higher limits

### Data Privacy
- Do not store sensitive user data
- Use HTTPS for all API communications
- Implement proper error handling
- Log only necessary information

## Performance Considerations

### Memory Usage
- The scraper is optimized for Raspberry Pi (1GB RAM)
- Uses streaming for large API responses
- Implements efficient data structures
- Limits concurrent API requests

### Execution Time
- Hourly cron job for regular updates
- Incremental updates to reduce processing time
- Parallel processing for independent platforms
- Caching for repeated API calls

### Network Usage
- Efficient API request batching
- Compression for large responses
- Connection pooling
- Timeout handling

## Platform-Specific Notes

### GitHub
- Best for technical discussions and issues
- High rate limit (5000/hr)
- Requires authentication for issue search
- Good for bug reports and feature requests

### Reddit
- Best for community feedback and experiences
- Low rate limit (60/hr)
- Requires OAuth2 authentication
- Good for general sentiment analysis

### Stack Overflow
- Best for technical questions and answers
- Medium rate limit (300/hr)
- Requires API key for higher limits
- Good for technical accuracy

### Hugging Face
- Best for model-specific discussions
- High rate limit (1000/hr)
- Requires token for authentication
- Good for model comparisons

### Hacker News
- Best for community discussions
- High rate limit (1000/hr)
- No authentication required
- Good for trending topics

### X (Twitter)
- Best for real-time mentions
- Strict rate limit (450/15min)
- Requires authentication
- Good for breaking news and trends

## Next Steps

1. **Set up API keys** for desired platforms
2. **Configure environment variables** in your system
3. **Test API connectivity** with the provided commands
4. **Run the scraper** to verify everything works
5. **Monitor logs** for any issues
6. **Adjust configuration** as needed

## Support

For issues and questions:
- Check this documentation first
- Review the `.scraper.log` file for errors
- Test API connectivity with the provided commands
- Verify environment variable values
- Check platform-specific rate limits

## Changelog

### v2.0.0 - Enhanced Verification
- Added support for 6 verification platforms
- Implemented comprehensive rate limiting
- Added detailed error handling
- Improved performance for Raspberry Pi

### v1.0.0 - Basic Scraping
- Initial implementation with GitHub and Reddit
- Basic sentiment analysis
- Simple rate limiting
- Minimal configuration

---

**Last Updated**: February 12, 2026  
**Version**: 2.0.0  
**Status**: Production Ready - Multi-Platform Verification