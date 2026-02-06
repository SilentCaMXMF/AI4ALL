// GitHub API Time Distribution & Rate Limit Visualizer

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

console.log('⏰ PERIOD BREAKDOWN (Every 30 Minutes):');
console.log('─'.repeat(70));

// Show periods in a grid format
let periodGrid = '';
for (let i = 0; i < 24; i++) {
  const period1 = i * 2;
  const period2 = i * 2 + 1;
  const hour = i.toString().padStart(2, '0');
  const nextHour = ((i + 1) % 24).toString().padStart(2, '0');
  
  periodGrid += `  ${hour}:00-${hour}:30 (P${period1.toString().padStart(2)}) | ${hour}:30-${nextHour}:00 (P${period2.toString().padStart(2)})\n`;
  
  if ((i + 1) % 6 === 0) {
    console.log(periodGrid);
    periodGrid = '';
  }
}
if (periodGrid) console.log(periodGrid);

console.log('📈 RATE LIMIT DISTRIBUTION');
console.log('═'.repeat(70));
const requestsPerPeriod = Math.floor(RATE_LIMIT_PER_HOUR * CONSERVATIVE_PERCENTAGE);
const requestsPerDay = requestsPerPeriod * PERIODS_PER_DAY;
const bufferPerHour = RATE_LIMIT_PER_HOUR - requestsPerPeriod;

console.log(`GitHub Rate Limit:        ${RATE_LIMIT_PER_HOUR.toLocaleString()} requests/hour`);
console.log(`Conservative Usage:       ${(CONSERVATIVE_PERCENTAGE * 100)}% per period`);
console.log(`Requests per Period:      ${requestsPerPeriod.toLocaleString()} requests`);
console.log(`Requests per Day:         ${requestsPerDay.toLocaleString()} requests`);
console.log(`Emergency Buffer:         ${bufferPerHour.toLocaleString()} req/hour (${((bufferPerHour/RATE_LIMIT_PER_HOUR)*100).toFixed(0)}%)`);
console.log(`Efficiency:               ${((requestsPerDay / (RATE_LIMIT_PER_HOUR * 24)) * 100).toFixed(1)}% of daily limit utilized\n`);

console.log('🎯 SEARCH ROTATION STRATEGY');
console.log('═'.repeat(70));
const searchQueries = [
  'free AI models',
  'open source LLM',
  'free API providers',
  'opencode',
  'zen AI'
];

console.log(`Search Queries (${searchQueries.length} total):`);
searchQueries.forEach((query, i) => {
  console.log(`  ${i + 1}. "${query}"`);
});

console.log('\nRotation Pattern (each query repeats every 5 periods):');
for (let period = 0; period < 15; period++) {
  const queryIndex = period % searchQueries.length;
  const hour = Math.floor(period / 2).toString().padStart(2, '0');
  const minute = (period % 2 === 0 ? '00' : '30');
  console.log(`  Period ${period.toString().padStart(2)} (${hour}:${minute}): "${searchQueries[queryIndex]}"`);
}
console.log('  ... (repeats throughout the day)\n');

console.log('🔍 FRESH CONTENT STRATEGY');
console.log('═'.repeat(70));
console.log('✓ Time Window: Last 2 hours (to catch delayed items)');
console.log('✓ Repository Search: pushed:>YYYY-MM-DD + query');
console.log('✓ Issue Search: created:>YYYY-MM-DDTHH:MM:SSZ + query');
console.log('✓ Discussion Search: created:>YYYY-MM-DDTHH:MM:SSZ + label:discussion + query');
console.log('✓ User/Org Repos: Checked every 6 periods (every 3 hours)\n');

console.log('📅 CURRENT SCRAPE SCHEDULE');
console.log('═'.repeat(70));
const now = new Date();
const currentPeriod = Math.floor(now.getHours() * 2 + now.getMinutes() / 30);
const currentQueryIndex = currentPeriod % searchQueries.length;
const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));

console.log(`Current Time:       ${now.toLocaleTimeString()}`);
console.log(`Current Date:       ${now.toLocaleDateString()}`);
console.log(`Current Period:     ${currentPeriod}/48`);
console.log(`Current Search:     "${searchQueries[currentQueryIndex]}"`);
console.log(`Scrape Window:      ${twoHoursAgo.toLocaleTimeString()} - ${now.toLocaleTimeString()}`);
console.log(`Requests Budget:    ${requestsPerPeriod} API calls available\n`);

console.log('📊 SAMPLE 24-HOUR SCHEDULE');
console.log('═'.repeat(70));
console.log('Time      | Period | Search Focus              | User/Org Check');
console.log('─'.repeat(70));

for (let hour = 0; hour < 24; hour++) {
  for (let half = 0; half < 2; half++) {
    const period = hour * 2 + half;
    const queryIdx = period % searchQueries.length;
    const timeStr = `${hour.toString().padStart(2, '0')}:${half === 0 ? '00' : '30'}`;
    const isCurrent = period === currentPeriod ? ' << NOW' : '';
    const isUserOrgCheck = period % 6 === 0 ? '✓ YES' : '-';
    const searchQuery = searchQueries[queryIdx];
    
    if (hour >= now.getHours() - 2 && hour <= now.getHours() + 2) {
      // Show surrounding hours
      console.log(`${timeStr}   | ${period.toString().padStart(2)}     | ${searchQuery.padEnd(25)} | ${isUserOrgCheck}${isCurrent}`);
    } else if (hour === 0 && half === 0) {
      console.log('...       | ...    | ...                       | ...');
    } else if (hour === 23 && half === 1) {
      console.log('...       | ...    | ...                       | ...');
    }
  }
}

console.log('\n💡 KEY BENEFITS');
console.log('═'.repeat(70));
console.log('✅ FRESHNESS: Only fetches content from last 2 hours');
console.log('✅ DISTRIBUTION: 48 evenly-spaced scrapes per day');
console.log('✅ SAFETY: Uses only 20% of rate limit per period (1,000 req)');
console.log('✅ COVERAGE: Rotates through 5 different search queries');
console.log('✅ EFFICIENCY: 48,000 requests/day utilized from 120,000 available');
console.log('✅ BUFFER: 4,000 req/hour emergency buffer remains');
console.log('✅ DEDUPLICATION: Tracks state to avoid duplicate fetches');
console.log('✅ SCALABILITY: Can add more search queries without hitting limits\n');

console.log('📁 STATE TRACKING');
console.log('═'.repeat(70));
console.log('File: data/github-scrape-state.json');
console.log('Tracks:');
console.log('  • Last scrape timestamp');
console.log('  • Current period (0-47)');
console.log('  • Requests used this period');
console.log('  • Requests used today');
console.log('  • Searches already performed\n');

console.log('🚀 USAGE');
console.log('═'.repeat(70));
console.log('Run scraper (respects time distribution automatically):');
console.log('  npm run scrape:github');
console.log('\nOr test with custom period simulation:');
console.log('  npx ts-node src/scraper/cli.ts --platform github\n');

console.log('═══════════════════════════════════════════════════════════════════════\n');
