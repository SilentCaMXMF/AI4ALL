import fetch from 'node-fetch';
import { config } from 'dotenv';
import { createHeader } from './src/utils/console-utils.js';

// Load environment variables
config();

const TODAY = '2026-02-06';

createHeader('Testing API Credentials - AI Models Search');
console.log(`Date: ${TODAY}\n`);

// Test GitHub API
async function testGitHub() {
  console.log('Testing GitHub API...\n');
  
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  
  if (!token) {
    console.log('❌ GITHUB_TOKEN not found in .env');
    return;
  }
  
  try {
    // Test 1: Verify token works by getting user info
    console.log('1. Verifying GitHub token...');
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SocialMediaAggregator-Test'
      }
    });
    
    if (!userResponse.ok) {
      console.log(`❌ Token validation failed: ${userResponse.status}`);
      return;
    }
    
    const userData = await userResponse.json();
    console.log(`✅ Token valid! Authenticated as: ${userData.login}`);
    console.log(`   Rate limit remaining: ${userResponse.headers.get('x-ratelimit-remaining')}/5000\n`);
    
    // Test 2: Search for free AI models repositories
    console.log('2. Searching for "free ai models" repositories...');
    const searchResponse = await fetch(
      'https://api.github.com/search/repositories?q=free+ai+models+providers&sort=updated&order=desc&per_page=10',
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SocialMediaAggregator-Test'
        }
      }
    );
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`✅ Found ${searchData.total_count} repositories\n`);
      
      console.log('   Top 5 Recent Repositories:');
      searchData.items.slice(0, 5).forEach((repo, index) => {
        console.log(`   ${index + 1}. ${repo.full_name}`);
        console.log(`      ⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count} | Updated: ${new Date(repo.updated_at).toLocaleDateString()}`);
        console.log(`      ${repo.description ? repo.description.substring(0, 80) + '...' : 'No description'}`);
        console.log(`      URL: ${repo.html_url}\n`);
      });
    }
    
    // Test 3: Search for issues/discussions about free AI providers
    console.log('3. Searching for recent issues about free AI providers...');
    const issuesResponse = await fetch(
      'https://api.github.com/search/issues?q=free+AI+models+providers+opencode+created:>2025-12-01&sort=created&order=desc&per_page=5',
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SocialMediaAggregator-Test'
        }
      }
    );
    
    if (issuesResponse.ok) {
      const issuesData = await issuesResponse.json();
      if (issuesData.total_count > 0) {
        console.log(`✅ Found ${issuesData.total_count} recent issues/discussions\n`);
        issuesData.items.slice(0, 3).forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue.title}`);
          console.log(`      Type: ${issue.pull_request ? 'Pull Request' : 'Issue'} | State: ${issue.state}`);
          console.log(`      Repo: ${issue.repository_url.split('/').slice(-2).join('/')}`);
          console.log(`      Created: ${new Date(issue.created_at).toLocaleDateString()}`);
          console.log(`      URL: ${issue.html_url}\n`);
        });
      } else {
        console.log('ℹ️ No recent issues found about this topic\n');
      }
    }
    
    // Test 4: Search for user's own repos (if username configured)
    if (username) {
      console.log(`4. Fetching repositories for user: ${username}...`);
      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SocialMediaAggregator-Test'
        }
      });
      
      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        console.log(`✅ Found ${repos.length} repositories\n`);
        repos.forEach((repo, index) => {
          console.log(`   ${index + 1}. ${repo.name} - ${repo.description || 'No description'}`);
          console.log(`      ⭐ ${repo.stargazers_count} | Language: ${repo.language || 'N/A'} | Updated: ${new Date(repo.updated_at).toLocaleDateString()}`);
        });
        console.log();
      }
    }
    
    console.log('✅ GitHub API tests completed successfully!\n');
    
  } catch (error) {
    console.error('❌ GitHub API Error:', error.message);
  }
}

// Test Discord API
async function testDiscord() {
  console.log('Testing Discord API...\n');
  
  const token = process.env.DISCORD_TOKEN;
  const channels = process.env.DISCORD_CHANNELS?.split(',').filter(Boolean) || [];
  
  if (!token) {
    console.log('❌ DISCORD_TOKEN not found in .env');
    return;
  }
  
  if (channels.length === 0) {
    console.log('❌ No DISCORD_CHANNELS configured');
    return;
  }
  
  try {
    // Test 1: Get bot info
    console.log('1. Verifying Discord bot token...');
    const botResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SocialMediaAggregator-Test/1.0'
      }
    });
    
    if (!botResponse.ok) {
      console.log(`❌ Bot token validation failed: ${botResponse.status}`);
      if (botResponse.status === 401) {
        console.log('   The token appears to be invalid or expired.');
      }
      return;
    }
    
    const botData = await botResponse.json();
    console.log(`✅ Bot token valid!`);
    console.log(`   Bot Name: ${botData.username}`);
    console.log(`   Bot ID: ${botData.id}\n`);
    
    // Test 2: Try to fetch messages from configured channels
    console.log(`2. Attempting to fetch messages from ${channels.length} channel(s)...\n`);
    
    for (const channelId of channels) {
      console.log(`   Channel ${channelId}:`);
      
      const channelResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SocialMediaAggregator-Test/1.0'
        }
      });
      
      if (!channelResponse.ok) {
        if (channelResponse.status === 403) {
          console.log(`   ⚠️  No access to this channel (403 Forbidden)`);
          console.log(`      The bot needs to be added to the server with proper permissions.\n`);
        } else if (channelResponse.status === 404) {
          console.log(`   ⚠️  Channel not found (404)\n`);
        } else {
          console.log(`   ❌ Error: ${channelResponse.status}\n`);
        }
        continue;
      }
      
      const channelData = await channelResponse.json();
      console.log(`   ✅ Access granted!`);
      console.log(`      Name: ${channelData.name}`);
      console.log(`      Type: ${channelData.type === 0 ? 'Text Channel' : 'Other'}`);
      
      // Try to get recent messages
      const messagesResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=5`, {
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SocialMediaAggregator-Test/1.0'
        }
      });
      
      if (messagesResponse.ok) {
        const messages = await messagesResponse.json();
        console.log(`      Recent messages: ${messages.length}`);
        
        // Look for AI-related messages
        const aiMessages = messages.filter(m => 
          m.content.toLowerCase().includes('ai') ||
          m.content.toLowerCase().includes('model') ||
          m.content.toLowerCase().includes('free')
        );
        
        if (aiMessages.length > 0) {
          console.log(`      🎯 Found ${aiMessages.length} message(s) about AI/models:`);
          aiMessages.forEach((msg, idx) => {
            console.log(`         ${idx + 1}. ${msg.author.username}: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}"`);
          });
        }
        console.log();
      } else {
        console.log(`      ⚠️  Could not fetch messages: ${messagesResponse.status}\n`);
      }
    }
    
    console.log('✅ Discord API tests completed!\n');
    
  } catch (error) {
    console.error('❌ Discord API Error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('Starting API credential tests...\n');
  
  await testGitHub();
  console.log('─'.repeat(60) + '\n');
  await testDiscord();
  
  createHeader('Test Summary');
  console.log('Check the output above for:');
  console.log('✓ API connection status');
  console.log('✓ Found repositories about free AI models');
  console.log('✓ Discord channel access status');
  console.log('✓ Rate limit information');
}

main().catch(console.error);
