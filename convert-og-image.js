#!/usr/bin/env node
/**
 * Convert SVG OG Image to PNG
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertSVGtoPNG() {
  console.log('🎨 Converting OG image SVG to PNG...');
  
  try {
    const inputPath = join(__dirname, 'public', 'og-image.svg');
    const outputPath = join(__dirname, 'public', 'og-image.png');
    
    await sharp(inputPath)
      .resize(1200, 630, { fit: 'contain' })
      .png()
      .toFile(outputPath);
    
    console.log(`✓ OG image created: ${outputPath}`);
    console.log('  Size: 1200x630px');
    
  } catch (error) {
    console.error('✗ Failed to convert OG image:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  convertSVGtoPNG();
}

export { convertSVGtoPNG };