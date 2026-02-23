# API Credentials Setup Guide

This guide will walk you through obtaining API credentials for all 5 platforms.

---

## 1. GitHub API Token

**Rate Limit**: 5,000 requests/hour (authenticated)

### Steps:
1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: "Social Media Aggregator"
4. Select these scopes:
   - ☑️ `repo` (Full control of private repositories)
   - ☑️ `read:user` (Read user profile data)
5. Click **"Generate token"**
6. **COPY THE TOKEN IMMEDIATELY** - you can't see it again!

### For .env file:
```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_USERNAME=your_github_username
GITHUB_ORGS=optional_org1,optional_org2
```

---

## 2. Reddit API Credentials

**Rate Limit**: 60 requests/minute

### Steps:
1. Go to https://www.reddit.com/prefs/apps
2. Scroll down and click **"create another app..."**
3. Fill in the form:
   - **name**: "Social Media Aggregator"
   - **type**: Select **"script"**
   - **description**: "Aggregating programming content"
   - **about url**: Your GitHub repo or website URL
   - **redirect uri**: `http://localhost:8080`
4. Click **"create app"**
5. You'll see:
   - **personal use script** = Your Client ID (under the app name)
   - **secret** = Your Client Secret

### For .env file:
```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_SUBREDDITS=programming,webdev,javascript
```

**Note**: You need your actual Reddit login credentials (username/password) for script-type apps.

---

## 3. Stack Overflow API Key

**Rate Limit**: 300 requests/day (without key), 10,000/day (with key)

### Steps:
1. Go to https://stackapps.com/apps/oauth/register
2. Fill in the form:
   - **Application Name**: "Social Media Aggregator"
   - **Description**: "Aggregating programming Q&A content"
   - **OAuth Domain**: `localhost`
   - **Application Website**: Your project URL or GitHub repo
   - **Enable Client Side OAuth Flow**: No
3. Click **"Register Your Application"**
4. You'll receive a **Key** (looks like a long string of letters/numbers)

### For .env file:
```env
STACKOVERFLOW_KEY=your_key_here
STACKOVERFLOW_TAGS=javascript,typescript,react,nodejs
```

**Note**: Stack Overflow works without a key, but with strict rate limits (300/day). Get a key for production use.

---

## 4. Discord Bot Token

**Rate Limit**: Varies by endpoint (generally very generous)

### Steps:
1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Name it: "Social Media Aggregator"
4. Go to **"Bot"** tab in the left sidebar
5. Click **"Add Bot"** → **"Yes, do it!"**
6. Under **"TOKEN"** section, click **"Reset Token"**
7. **COPY THE TOKEN IMMEDIATELY** - you can't see it again!
8. Scroll down and enable these **Privileged Gateway Intents**:
   - ☑️ **MESSAGE CONTENT INTENT** (required to read message content)

### To Get Channel IDs:
1. Open Discord in browser
2. Go to the channel you want to monitor
3. Look at the URL: `discord.com/channels/GUILD_ID/CHANNEL_ID`
4. Copy the **CHANNEL_ID** (the last number)

### For .env file:
```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CHANNELS=channel_id_1,channel_id_2
```

**Important**: 
- The bot must be invited to the server with "Read Messages" permission
- The bot can only read messages from channels it has access to
- For public channels, you might need admin to add your bot

---

## 5. X (Twitter) API v2 Bearer Token

**Rate Limit**: Depends on your access tier (Basic: 500/month, Pro: much higher)

### Steps:
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Sign in with your X/Twitter account
3. Click **"Projects & Apps"** → **"+ Create Project"**
4. Fill in project details:
   - **Project name**: "Social Media Aggregator"
   - **Use case**: "Doing academic research" or "Student learning"
   - **Description**: "Aggregating tech content for learning"
5. Create an app within the project
6. Go to your app → **"Keys and Tokens"** tab
7. Under **"Authentication Tokens"** section:
   - Click **"Generate"** next to **"Bearer Token"**
8. **COPY THE BEARER TOKEN IMMEDIATELY**

### For .env file:
```env
X_BEARER_TOKEN=your_bearer_token_here
X_SEARCH_QUERIES=javascript,webdev,programming,react
```

**Note**: 
- X API v2 requires approval - you may need to wait for access
- Free tier is very limited (500 tweets/month)
- Consider starting with other platforms first

---

## Complete .env Template

Once you have all credentials, your `.env` file should look like this:

```env
# GitHub API
# Get token from: https://github.com/settings/tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=your_username
GITHUB_ORGS=optional_org1,optional_org2

# Reddit API
# Create app at: https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID=xxxxxxxxxxxxxx
REDDIT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxx
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_SUBREDDITS=programming,webdev,javascript,typescript

# Stack Overflow API
# Get key at: https://stackapps.com/apps/oauth/register
STACKOVERFLOW_KEY=xxxxxxxxxxxxxx
STACKOVERFLOW_TAGS=javascript,typescript,react,nodejs,nextjs

# Discord API
# Create bot at: https://discord.com/developers/applications
DISCORD_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx.xxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxx
DISCORD_CHANNELS=1234567890123456789,9876543210987654321

# X (Twitter) API v2
# Get credentials at: https://developer.twitter.com/en/portal/dashboard
X_BEARER_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
X_SEARCH_QUERIES=javascript,webdev,programming,ai

# Optional: Limit which platforms to scrape (comma-separated)
# Leave as 'all' or remove to scrape everything
PLATFORMS=all
```

---

## Security Best Practices

1. **Never commit `.env` file to git** - it's already in `.gitignore`
2. **Use different tokens for dev/production**
3. **Rotate tokens regularly** (every 3-6 months)
4. **Use GitHub Secrets** for API credentials in GitHub Actions:
   - Go to Settings → Secrets and variables → Actions
   - Add each credential as a secret
5. **Limit token permissions** to only what's needed
6. **Monitor API usage** to detect abuse

---

## Testing Your Credentials

After adding credentials to `.env`:

```bash
# Test all platforms
npm run scrape

# Test specific platforms
npm run scrape:github
npm run scrape:reddit
npm run scrape:stackoverflow
```

If you see errors:
- Check credentials are copied correctly (no extra spaces)
- Verify API keys are active (not expired)
- Check rate limit status
- Ensure bot has proper Discord permissions

---

## Troubleshooting

### GitHub
- **401 Unauthorized**: Token is invalid or expired
- **403 Forbidden**: Token doesn't have required scopes

### Reddit
- **401 Unauthorized**: Wrong client ID/secret or username/password
- **429 Too Many Requests**: Rate limit hit

### Stack Overflow
- Works without key, just slower
- **400 Bad Request**: Invalid key format

### Discord
- **401 Unauthorized**: Bot token is invalid
- **403 Forbidden**: Bot doesn't have permission to read channel

### X (Twitter)
- **403 Forbidden**: Account doesn't have API access yet
- **429 Too Many Requests**: Monthly tweet limit reached

---

## Getting Help

If you're stuck:
1. Check platform documentation:
   - GitHub: https://docs.github.com/en/rest
   - Reddit: https://www.reddit.com/dev/api/
   - Stack Overflow: https://api.stackexchange.com/docs
   - Discord: https://discord.com/developers/docs
   - X: https://developer.twitter.com/en/docs

2. Check your account status on each platform
3. Review error messages in the scraper output
4. Test with one platform at a time

Good luck! 🚀
