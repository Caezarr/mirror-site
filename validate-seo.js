#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { XMLParser } = require('fast-xml-parser');

let exitCode = 0;

function error(message) {
  console.error(`❌ ${message}`);
  exitCode = 1;
}

function success(message) {
  console.log(`✅ ${message}`);
}

function validateJsonLd(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  
  if (scripts.length === 0) {
    if (filePath.endsWith('404.html')) {
      success(`${filePath}: No JSON-LD (expected for 404 page)`);
      return;
    }
    error(`${filePath}: No JSON-LD found`);
    return;
  }
  
  const jsonLdBlocks = [];
  
  scripts.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent);
      jsonLdBlocks.push(data);
      
      if (!data['@context']) {
        error(`${filePath} block ${index + 1}: Missing @context`);
      }
      
      if (!data['@type'] && !data['@graph']) {
        error(`${filePath} block ${index + 1}: Missing @type or @graph`);
      }
      
      checkForEmptyFields(data, filePath, index + 1);
      
      if (data['@graph']) {
        data['@graph'].forEach((item, graphIndex) => {
          if (!item['@type']) {
            error(`${filePath} block ${index + 1} graph item ${graphIndex + 1}: Missing @type`);
          }
        });
      }
      
    } catch (e) {
      error(`${filePath} block ${index + 1}: Invalid JSON: ${e.message}`);
    }
  });
  
  const types = [];
  jsonLdBlocks.forEach((block, index) => {
    if (block['@graph']) {
      block['@graph'].forEach(item => {
        if (item['@type']) types.push(item['@type']);
      });
    } else if (block['@type']) {
      types.push(block['@type']);
    }
  });
  
  const typeCounts = {};
  types.forEach(type => {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > 1) {
      error(`${filePath}: Duplicate @type "${type}" found ${count} times`);
    }
  }
  
  success(`${filePath}: Valid JSON-LD (${scripts.length} block(s), ${types.length} type(s))`);
}

function checkForEmptyFields(obj, filePath, blockIndex, path = '') {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (key.startsWith('@')) continue;
    
    if (value === '' || value === null || value === undefined) {
      error(`${filePath} block ${blockIndex}: Empty field at ${currentPath}`);
    } else if (typeof value === 'string' && 
               (value.toLowerCase().includes('placeholder') || 
                value.toLowerCase().includes('todo') ||
                value.toLowerCase().includes('example'))) {
      error(`${filePath} block ${blockIndex}: Placeholder value at ${currentPath}: "${value}"`);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      checkForEmptyFields(value, filePath, blockIndex, currentPath);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          checkForEmptyFields(item, filePath, blockIndex, `${currentPath}[${index}]`);
        }
      });
    }
  }
}

function validateSitemap() {
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  
  if (!fs.existsSync(sitemapPath)) {
    error('sitemap.xml not found');
    return;
  }
  
  const xml = fs.readFileSync(sitemapPath, 'utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: true
  });
  
  const result = parser.parse(xml);
  
  if (!result.urlset || !result.urlset.url) {
    error('sitemap.xml: Invalid structure');
    return;
  }
  
  const urls = Array.isArray(result.urlset.url) ? result.urlset.url : [result.urlset.url];
  const now = new Date();
  
  urls.forEach(url => {
    if (!url.lastmod) {
      error(`sitemap.xml: Missing lastmod for ${url.loc}`);
      return;
    }
    
    const lastmod = url.lastmod.toString();
    
    if (lastmod === '1970-01-01' || lastmod === '2000-01-01') {
      error(`sitemap.xml: Placeholder date for ${url.loc}: ${lastmod}`);
    }
    
    const date = new Date(lastmod);
    if (isNaN(date.getTime())) {
      error(`sitemap.xml: Invalid date format for ${url.loc}: ${lastmod}`);
    } else if (date > now) {
      error(`sitemap.xml: Future date for ${url.loc}: ${lastmod}`);
    } else {
      success(`sitemap.xml: Valid lastmod for ${url.loc} (${lastmod})`);
    }
  });
}

function validate404() {
  const html404 = fs.readFileSync(path.join(__dirname, '404.html'), 'utf-8');
  const dom = new JSDOM(html404);
  const document = dom.window.document;
  
  const robotsMeta = document.querySelector('meta[name="robots"]');
  
  if (!robotsMeta) {
    error('404.html: Missing robots meta tag');
    return;
  }
  
  const content = robotsMeta.getAttribute('content');
  if (!content || !content.includes('noindex')) {
    error('404.html: robots meta tag does not include "noindex"');
  } else {
    success('404.html: Has noindex robots meta tag');
  }
}

console.log('\n🔍 Validating SEO elements...\n');

const htmlFiles = [
  'index.html',
  'privacy/index.html',
  'support/index.html',
  '404.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    validateJsonLd(filePath);
  } else {
    error(`${file}: File not found`);
  }
});

console.log('');
validateSitemap();

console.log('');
validate404();

console.log('');

if (exitCode === 0) {
  console.log('✅ All SEO validation checks passed!\n');
} else {
  console.log('❌ SEO validation failed. Please fix the issues above.\n');
}

process.exit(exitCode);
