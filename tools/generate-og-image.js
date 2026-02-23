#!/usr/bin/env node
/**
 * OG Image Generator
 * Generates og-image.png from HTML template using Puppeteer
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateOGImage() {
  console.log('🎨 Generating OG image...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport to OG image dimensions
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1
    });
    
    // Load the HTML file
    const htmlPath = join(__dirname, 'og-image-generator.html');
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0'
    });
    
    // Wait for fonts to load
    await page.waitForTimeout(1000);
    
    // Take screenshot
    const outputPath = join(__dirname, 'public', 'og-image.png');
    await page.screenshot({
      path: outputPath,
      type: 'png',
      fullPage: false
    });
    
    console.log(`✓ OG image generated: ${outputPath}`);
    console.log('  Size: 1200x630px');
    
  } catch (error) {
    console.error('✗ Failed to generate OG image:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateOGImage();
}

export { generateOGImage };