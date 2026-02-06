import { readFile } from 'fs/promises';

// Load environment variables manually
async function loadEnv() {
  try {
    const envContent = await readFile('.env', 'utf-8');
    const lines = envContent.split('\n');
    const env: Record<string, string> = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    return env;
  } catch {
    return {};
  }
}

const env = await loadEnv();

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     GitHub API Time Distribution & Rate Limit Analyzer         ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Calculate time distribution
const PERIODS_PER_DAY = 48; // 24 hours / 30 minutes = 48 periods
const RATE_LIMIT_PER_HOUR = 5000;
const CONSERVATIVE_PERCENTAGE = 0.20; // Use only 20% of hourly limit per period

console.log('📊 TIME DISTRIBUTION');
console.log('═'.repeat(70));
console.log(`Total periods per day: ${PERIODS_PER_DAY} (30-minute intervals)`);
console.log(`24 hours ÷ 30 minutes = ${24 * 2} periods\n`);

console.log('⏰ PERIOD BREAKDOWN:');
for (let i = 0; i < 24; i++) {
  const period1 = i * 2;
  const period2 = i * 2 + 1;
  const hour = i.toString().padStart(2, '0');
  console.log(`  Hour ${hour}:00 - Periods ${period1.toString().padStart(2)} & ${period2.toString().padStart(2)} (${hour}:00-${hour}:30 & ${hour}:30-${(i+1).toString().padStart(2)}:00)`);
}

console.log('\n📈 RATE LIMIT DISTRIBUTION');
console.log('═'.repeat(70));
console.log(`GitHub Rate Limit: ${RATE_LIMIT_PER_HOUR.toLocaleString()} requests/hour`);
console.log(`Conservative Usage: ${(CONSERVATIVE_PERCENTAGE * 100)}% of hourly limit per period`);
console.log(`Requests per Period: ${Math.floor(RATE_LIMIT_PER_HOUR * CONSERVATIVE_PERCENTAGE).toLocaleString()}`);
console.log(`Requests per Day: ${(Math.floor(RATE_LIMIT_PER_HOUR * CONSERVATIVE_PERCENTAGE) * PERIODS_PER_DAY).toLocaleString()}`);
console.log(`Buffer Remaining: ${(RATE_LIMIT_PER_HOUR - Math.floor(RATE_LIMIT_PER_HOUR * CONSERVATIVE_PERCENTAGE)).toLocaleString()} req/hour for emergencies\n`);

console.log('🎯 SEARCH STRATEGY');
console.log('═'.repeat(70));
const searchQueries = [
  'free AI models',
  'open source LLM',
  'free API providers',
  'opencode',
  'zen AI'
];

console.log('Rotating search queries each period:');
searchQueries.forEach((query, i) => {
  console.log(`  Periods ${i}, ${i + searchQueries.length}, ${i + searchQueries.length * 2}, ...: "${query}"`);
});

console.log('\n🔍 FRESH CONTENT STRATEGY');
console.log('═'.repeat(70));
console.log('Time Window: Last 2 hours (to catch delayed items)');
console.log('Search Criteria:');
console.log('  • Repositories: pushed:>YYYY-MM-DD + query');
console.log('  • Issues: created:>YYYY-MM-DDTHH:MM:SSZ + query');
console.log('  • Discussions: created:>YYYY-MM-DDTHH:MM:SSZ + label:discussion + query');
console.log('  • User/Org repos: Every 6 periods (every 3 hours)\n');

console.log('📅 EXAMPLE SCRAPE SCHEDULE');
console.log('═'.repeat(70));
const now = new Date();
const currentPeriod = Math.floor(now.getHours() * 2 + now.getMinutes() / 30);
const currentQueryIndex = currentPeriod % searchQueries.length;

console.log(`Current Time: ${now.toLocaleTimeString()}`);
console.log(`Current Period: ${currentPeriod}/48`);
console.log(`Current Search: "${searchQueries[currentQueryIndex]}"`);
console.log(`Time Window: Last 2 hours\n`);

console.log('Sample 24-Hour Schedule:');
for (let hour = 0; hour < 24; hour++) {
  for (let half = 0; half < 2; half++) {
    const period = hour * 2 + half;
    const queryIdx = period % searchQueries.length;
    const timeStr = `${hour.toString().padStart(2, '0')}:${half === 0 ? '00' : '30'}`;
    const mark = period === currentPeriod ? ' << CURRENT' : '';
    console.log(`  ${timeStr} - Period ${period.toString().padStart(2)}: "${searchQueries[queryIdx]}"${mark}`);
  }
}

console.log('\n💡 OPTIMIZATION BENEFITS');
console.log('═'.repeat(70));
console.log('✅ Only fetches fresh content (last 2 hours)');
console.log('✅ Distributes searches evenly across the day');
console.log('✅ Stays well within rate limits (20% usage per period)');
console.log('✅ Rotates search queries to cover more topics');
console.log('✅ Tracks state to avoid duplicates');
console.log('✅ Periodic user/org repo checks every 3 hours');
console.log('✅ Emergency buffer for manual searches\n');

// If we have credentials, show current stats
if (env.GITHUB_TOKEN) {
  console.log('🔐 CREDENTIALS DETECTED');
  console.log('═'.repeat(70));
  console.log('Token: ' + env.GITHUB_TOKEN.substring(0, 10) + '...');
  console.log('Username: ' + (env.GITHUB_USERNAME || 'Not configured'));
  console.log('\nTo test the new implementation:');
  console.log('  npm run scrape:github\n');
}

console.log('═══════════════════════════════════════════════════════════════════════\n');
