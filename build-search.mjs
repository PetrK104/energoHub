import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, join, basename } from 'path';
import * as cheerio from 'cheerio';

const ROOT = new URL('.', import.meta.url).pathname;
const SKIP_DIRS = new Set(['node_modules', '.git', 'vendor', '.netlify']);

// Derive category from filename when no meta category present
function categoryFromFile(filename) {
  if (filename === 'index.html') return 'Hlavní stránka';
  if (filename.startsWith('jom-') || filename === 'pruvodce-jom.html') return 'JOM';
  if (filename.startsWith('fve-') || filename === 'pruvodce-fve.html') return 'FVE';
  if (filename === 'bezpecnost.html') return 'Bezpečnost';
  if (filename === 'kalkulacka.html') return 'Nástroje';
  if (filename === 'forum.html') return 'Fórum';
  if (filename === 'kontakty.html') return 'Kontakty';
  if (filename === 'slovnik.html') return 'Slovník';
  return '';
}

// Convert filename to public URL (Netlify pretty URLs)
function toUrl(filename) {
  if (filename === 'index.html') return '/';
  return '/' + filename.replace(/\.html$/, '');
}

// Collect .html files from root only (no recursive walk needed — flat structure)
function collectHtmlFiles() {
  return readdirSync(ROOT)
    .filter(f => f.endsWith('.html'))
    .map(f => join(ROOT, f));
}

const files = collectHtmlFiles();
const index = [];
let warnings = 0;

for (const filepath of files) {
  const filename = basename(filepath);
  const html = readFileSync(filepath, 'utf8');
  const $ = cheerio.load(html);

  // Skip noindex pages
  const robots = $('meta[name="robots"]').attr('content') || '';
  if (robots.toLowerCase().includes('noindex')) {
    console.log(`  skip (noindex): ${filename}`);
    continue;
  }

  // title — strip site name after em dash
  const rawTitle = $('title').text().trim();
  const title = rawTitle.replace(/\s*[—–-]\s*Energohub\.info\s*$/, '').trim();

  // meta fields
  const description = $('meta[name="description"]').attr('content') || '';
  const keywords    = $('meta[name="keywords"]').attr('content') || '';
  const metaCat     = $('meta[name="category"]').attr('content') || '';
  const category    = metaCat || categoryFromFile(filename);

  // headings — h2 and h3, joined with " | "
  const headingTexts = [];
  $('h2, h3').each((_, el) => {
    const t = $(el).text().trim();
    if (t) headingTexts.push(t);
  });
  const headings = headingTexts.join(' | ');

  const url = toUrl(filename);

  // Combined text field for full-text search
  const text = [title, description, keywords, headings]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Warnings
  if (!title) {
    console.warn(`  ⚠ warning: no <title> in ${filename}`);
    warnings++;
  }
  if (!description) {
    console.warn(`  ⚠ warning: no meta description in ${filename}`);
    warnings++;
  }

  index.push({ title, description, keywords, category, headings, url, text });
}

writeFileSync(join(ROOT, 'search.json'), JSON.stringify(index, null, 2), 'utf8');

console.log(`\nIndexed ${index.length} pages → search.json`);
if (warnings > 0) console.warn(`${warnings} warnings (see above)`);
