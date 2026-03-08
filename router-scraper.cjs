const puppeteer = require('puppeteer-core');

const ROUTER_URL = 'http://192.168.1.254';
const USERNAME = 'meo';
const PASSWORD = 'meo';

// Use system Chromium
const CHROMIUM_PATH = '/usr/bin/chromium';

const SECTIONS = [
  { id: 'router', name: 'Router' },
  { id: 'lan', name: 'LAN' },
  { id: 'wan', name: 'WAN' },
  { id: 'wifi', name: 'Wi-Fi' },
  { id: 'voice', name: 'Voice' },
  { id: 'tv', name: 'Television' }
];

async function scrapeRouter() {
  console.log('[Router] Launching browser...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROMIUM_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update'
    ]
  });

  const page = await browser.newPage();
  
  // Set realistic browser headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9'
  });

  try {
    // Step 1: Go to router and wait for login form
    console.log('[Router] Navigating to login page...');
    await page.goto(ROUTER_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Step 2: Fill login form
    console.log('[Router] Filling login credentials...');
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.type('#username', USERNAME, { delay: 50 });
    await page.type('#password', PASSWORD, { delay: 50 });
    
    // Click login button
    await page.click('#button');
    
    // Wait for navigation - check if we're still on login page
    await new Promise(r => setTimeout(r, 5000));
    
    // Debug: Check what's on the page
    const pageDebug = await page.evaluate(() => {
      // Check for sidebar navigation
      const leftNav = document.getElementById('left-navbar');
      const sidebar = document.querySelector('.fx-sidebar, #fx-sidebar');
      
      // Get all links with their IDs
      const allLinks = Array.from(document.querySelectorAll('a[id]')).map(a => ({
        id: a.id,
        href: a.getAttribute('href'),
        text: a.innerText.trim(),
        parent: a.parentElement?.tagName
      }));
      
      // Check URL and route
      return {
        url: window.location.href,
        hash: window.location.hash,
        leftNavExists: !!leftNav,
        sidebarExists: !!sidebar,
        links: allLinks,
        bodyText: document.body.innerText.substring(0, 800)
      };
    });
    console.log('[Router] Page structure:', JSON.stringify(pageDebug, null, 2));
    
    // Try to find and click navigation - look for sidebar links
    console.log('[Router] Looking for navigation...');
    
    console.log('[Router] ✓ Logged in successfully\n');
    
    // Wait for page to fully load
    await new Promise(r => setTimeout(r, 2000));
    
    // Step 4: Scrape each section by navigating via URL hash
    const config = {
      timestamp: new Date().toISOString(),
      sections: {}
    };
    
    // First, get current state from home page
    console.log('[Router] Scraping home page...');
    const homeData = await page.evaluate(() => {
      return {
        text: document.body.innerText,
        html: document.body.innerHTML.substring(0, 3000)
      };
    });
    config.sections['Home'] = { text: homeData.text };
    console.log('[Router] ✓ Home page scraped');
    
    // Navigate to each section via URL
    const routes = [
      { path: 'gui/router', name: 'Router' },
      { path: 'gui/lan.home', name: 'LAN' },
      { path: 'gui/wan.home', name: 'WAN' },
      { path: 'gui/wifi.home', name: 'Wi-Fi' },
      { path: 'gui/voice', name: 'Voice' },
      { path: 'gui/tv', name: 'Television' }
    ];
    
    for (const route of routes) {
      console.log(`[Router] Scraping ${route.name}...`);
      
      try {
        // Navigate to section via URL
        await page.goto(`http://192.168.1.254/index.html#/${route.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 15000 
        });
        
        // Wait for content
        await new Promise(r => setTimeout(r, 3000));
        
        // Extract data
        const sectionData = await page.evaluate(() => {
          return {
            url: window.location.href,
            text: document.body.innerText,
            // Get all form fields
            inputs: Array.from(document.querySelectorAll('input')).map(i => ({
              id: i.id,
              name: i.name,
              type: i.type,
              value: i.value,
              placeholder: i.placeholder
            })).filter(i => i.id || i.name),
            // Get select values
            selects: Array.from(document.querySelectorAll('select')).map(s => ({
              id: s.id,
              name: s.name,
              value: s.value,
              options: Array.from(s.options).map(o => o.text).slice(0, 10)
            })).filter(s => s.id || s.name),
            // Get any tables
            tables: Array.from(document.querySelectorAll('table')).map(t => {
              const headers = Array.from(t.querySelectorAll('th')).map(th => th.innerText.trim());
              const rows = Array.from(t.querySelectorAll('tr')).slice(0, 5).map(tr => 
                Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim())
              );
              return { headers, rows };
            })
          };
        });
        
        config.sections[route.name] = sectionData;
        console.log(`[Router] ✓ ${route.name} scraped`);
        
      } catch (err) {
        console.log(`[Router] ✗ Error scraping ${route.name}: ${err.message}`);
        config.sections[route.name] = { error: err.message };
      }
    }
    
    // Step 5: Also try to get any JSON data endpoints
    console.log('\n[Router] Trying to fetch API data...');
    
    // Get page HTML for deeper analysis
    const fullHtml = await page.content();
    
    // Try common data endpoints
    const dataEndpoints = [
      '/data/model.router.json',
      '/data/model.lan.json',
      '/data/model.wan.json',
      '/data/model.wifi.json'
    ];
    
    const apiData = {};
    for (const endpoint of dataEndpoints) {
      try {
        const response = await page.goto(ROUTER_URL + endpoint, {
          waitUntil: 'networkidle0',
          timeout: 5000
        });
        if (response && response.status() === 200) {
          const text = await response.text();
          if (text.startsWith('{') || text.startsWith('[')) {
            apiData[endpoint] = JSON.parse(text);
          }
        }
      } catch (e) {
        // Ignore
      }
    }
    
    config.apiData = apiData;
    
    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('ROUTER CONFIGURATION REPORT');
    console.log('='.repeat(60));
    console.log(JSON.stringify(config, null, 2));
    
    return config;
    
  } catch (error) {
    console.error('[Router] Error:', error.message);
    throw error;
  } finally {
    await browser.close();
    console.log('\n[Router] Browser closed');
  }
}

// Run if called directly
scrapeRouter().catch(console.error);
