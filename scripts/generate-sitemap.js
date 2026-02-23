#!/usr/bin/env node

/**
 * Sitemap Generator for AI4ALL Platform
 * Generates XML sitemap with proper SEO structure
 */

import fs from 'fs';
import path from 'path';

class SitemapGenerator {
    constructor(baseUrl = 'https://freeai4all.duckdns.org') {
        this.baseUrl = baseUrl;
        this.urls = [];
    }

    addUrl(loc, lastmod = null, changefreq = 'weekly', priority = 0.5) {
        this.urls.push({
            loc: loc,
            lastmod: lastmod || new Date().toISOString().split('T')[0],
            changefreq,
            priority
        });
    }

    addStaticPages() {
        this.addUrl('/', '2024-02-10', 'weekly', 1.0);
        this.addUrl('/dashboard.html', '2024-02-10', 'daily', 0.9);
        this.addUrl('/opencode-zen-dashboard.html', '2024-02-10', 'weekly', 0.8);
    }

    generateXml() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
        xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
        
        this.urls.forEach(url => {
            xml += '    <url>\n';
            xml += `        <loc>${this.baseUrl}${url.loc}</loc>\n`;
            xml += `        <lastmod>${url.lastmod}T00:00:00Z</lastmod>\n`;
            xml += `        <changefreq>${url.changefreq}</changefreq>\n`;
            xml += `        <priority>${url.priority}</priority>\n`;
            
            // Add hreflang for all URLs
            xml += `        <xhtml:link rel="alternate" hreflang="en" href="${this.baseUrl}${url.loc}"/>\n`;
            xml += `        <xhtml:link rel="alternate" hreflang="x-default" href="${this.baseUrl}${url.loc}"/>\n`;
            
            xml += '    </url>\n';
        });
        
        xml += '</urlset>';
        return xml;
    }

    async generate() {
        console.log('🗺️  Generating AI4ALL sitemap...');
        
        // Add static pages
        this.addStaticPages();
        
        // Generate XML
        const xml = this.generateXml();
        
        // Write to file
        fs.writeFileSync('sitemap.xml', xml);
        
        console.log(`✅ Sitemap generated successfully!`);
        console.log(`📊 Total URLs: ${this.urls.length}`);
        console.log(`📍 File saved: sitemap.xml`);
        
        // Display URLs
        console.log('\n📋 URLs included:');
        this.urls.forEach((url, index) => {
            console.log(`  ${index + 1}. ${url.loc} (priority: ${url.priority})`);
        });
    }
}

// Generate sitemap if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const generator = new SitemapGenerator();
    generator.generate().catch(console.error);
}

export default SitemapGenerator;