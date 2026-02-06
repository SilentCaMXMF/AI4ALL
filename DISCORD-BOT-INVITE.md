# Discord Bot Invitation Guide

## Quick Steps to Invite Your Bot

### Step 1: Get Your Bot's OAuth2 URL

1. Go to **Discord Developer Portal**: https://discord.com/developers/applications
2. Click on your application **"AI4ALL"** (or the name you gave it)
3. In the left sidebar, click **"OAuth2"** → **"URL Generator"**

### Step 2: Configure OAuth2 Scopes

In the URL Generator, select:

**SCOPES:**
- ☑️ **bot** (required)

**BOT PERMISSIONS:**
- ☑️ **Read Messages/View Channels**
- ☑️ **Send Messages** (optional, for testing)
- ☑️ **Read Message History**

### Step 3: Copy the Generated URL

At the bottom of the page, you'll see a URL like:
```
https://discord.com/api/oauth2/authorize?client_id=1469293688768299185&permissions=67584&scope=bot
```

**Copy this URL** - it's your bot invitation link.

### Step 4: Invite the Bot to Your Server

1. **Open the URL** in your browser
2. You'll see a page asking to authorize the bot
3. **Select your server** from the dropdown:
   - Choose the server that has channel ID: `1419220713738473503`
   - You need "Manage Server" permission on that server
4. Click **"Authorize"**
5. Complete the CAPTCHA if prompted
6. You should see "Authorized" confirmation

### Step 5: Verify Bot Joined

1. Go to your Discord server
2. Look for your bot in the member list (right sidebar)
3. The bot should appear as "AI4ALL" (offline or online)

### Step 6: Enable Required Intents (IMPORTANT!)

Your bot needs special permissions to read message content:

1. Back in Developer Portal, click **"Bot"** in left sidebar
2. Scroll down to **"Privileged Gateway Intents"**
3. Enable these:
   - ☑️ **MESSAGE CONTENT INTENT** (REQUIRED - allows reading messages)
   - ☑️ **SERVER MEMBERS INTENT** (optional)
   - ☑️ **PRESENCE INTENT** (optional)
4. Click **"Save Changes"** at the bottom

⚠️ **Without MESSAGE CONTENT INTENT, the bot cannot read channel messages!**

---

## Alternative: Direct URL Method

If you want to skip the URL Generator, use this direct URL (replace YOUR_CLIENT_ID):

```
https://discord.com/api/oauth2/authorize?client_id=1469293688768299185&permissions=67584&scope=bot%20applications.commands
```

**Your Client ID**: `1469293688768299185` (from your .env file)

**Permissions Number**: `67584` (includes Read Messages, Send Messages, Read History)

Just click this link:
👉 https://discord.com/api/oauth2/authorize?client_id=1469293688768299185&permissions=67584&scope=bot

---

## Troubleshooting

### "I don't see my server in the dropdown"
- You need "Manage Server" permission on that server
- Only servers you manage will appear
- Contact the server admin if you don't have permissions

### "Bot joined but shows 'Access Denied' in tests"
1. Make sure you enabled **MESSAGE CONTENT INTENT** in Bot settings
2. The bot needs to be invited with proper permissions
3. Try re-inviting with the URL above

### "Bot appears offline"
- The bot only comes online when your scraper runs
- It's not a 24/7 bot - it connects via API to fetch messages
- This is normal behavior for this type of integration

### "Still can't access the channel"
1. Check that the bot has permissions for that specific channel
2. Some channels have restricted permissions
3. You may need to give the bot a role with channel access

---

## Permission Breakdown

Your bot needs these permissions:

| Permission | Why It's Needed |
|------------|----------------|
| **Read Messages** | To fetch message content from channels |
| **View Channels** | To see which channels exist |
| **Read Message History** | To get past messages (not just real-time) |

**It does NOT need:**
- Send Messages (unless you want to test)
- Administrator (too broad, security risk)
- Manage Messages (not needed for reading)

---

## Verification Steps

After inviting the bot, run the test:

```bash
npx ts-node test-credentials.ts
```

You should see:
```
✅ Bot token valid!
   Bot Name: AI4ALL
   Bot ID: 1469293688768299185

✅ Successfully connected!
   Channel: #your-channel-name
   Recent messages: X
```

If you see "⚠️ No access to this channel", the bot wasn't invited properly or lacks permissions.

---

## One-Click Invite

Here's your pre-configured invite link:

**👉 [Click here to invite AI4ALL bot to your server](https://discord.com/api/oauth2/authorize?client_id=1469293688768299185&permissions=67584&scope=bot)**

Just:
1. Click the link ☝️
2. Select your server
3. Click "Authorize"
4. Enable MESSAGE CONTENT INTENT in Developer Portal
5. Done! ✅

---

## Next Steps After Invitation

1. ✅ Invite bot to server (using link above)
2. ✅ Enable MESSAGE CONTENT INTENT in Bot settings
3. ✅ Run test: `npx ts-node test-credentials.ts`
4. ✅ Verify channel access
5. ✅ Start scraping Discord messages!

---

## Support

If you're still having issues:
- Check Discord permissions in your server settings
- Verify the channel ID in your .env is correct
- Make sure the bot has "Read Messages" for that specific channel
- Try kicking and re-inviting the bot

**Channel ID in your .env**: `1419220713738473503`
