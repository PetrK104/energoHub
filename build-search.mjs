import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import * as cheerio from 'cheerio';

const ROOT = new URL('.', import.meta.url).pathname;

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function categoryFromFile(filename) {
  if (filename === 'index.html') return 'Hlavní stránka';
  if (filename.startsWith('jom-') || filename === 'pruvodce-jom.html') return 'JOM';
  if (filename.startsWith('fve-') || filename === 'pruvodce-fve.html') return 'FVE';
  if (filename.startsWith('bezpecnost-')) return 'Bezpečnost FVE';
  if (filename === 'bezpecnost.html') return 'Bezpečnost';
  if (filename === 'dotace.html') return 'Dotace';
  if (filename === 'kalkulacka.html') return 'Nástroje';
  if (filename === 'forum.html') return 'Fórum';
  if (filename === 'kontakty.html') return 'Kontakty';
  if (filename === 'slovnik.html') return 'Slovník';
  return '';
}

function toUrl(filename) {
  if (filename === 'index.html') return '/';
  return '/' + filename.replace(/\.html$/, '');
}

const files = readdirSync(ROOT)
  .filter(f => f.endsWith('.html'))
  .map(f => join(ROOT, f));

const index = [];
let htmlModifiedCount = 0;
let warnings = 0;

// Containers that are navigation/UI — headings inside are skipped
const SKIP = 'header, .guide-qa, .site-search, footer, .navbar-mobile, #searchOverlay, [role="dialog"]';

// IDs that belong to UI elements, not content wrappers
const UI_IDS = new Set([
  'navMobile', 'fvePhases', 'searchCtaBody', 'searchListbox',
  'searchOverlay', 'searchInput', 'searchOpen', 'navBurger',
  'footerNewsletter', 'searchCtaInput',
]);

for (const filepath of files) {
  const filename = basename(filepath);
  let html = readFileSync(filepath, 'utf8');
  const $ = cheerio.load(html, { decodeEntities: false });

  const robots = $('meta[name="robots"]').attr('content') || '';
  if (robots.toLowerCase().includes('noindex')) {
    console.log(`  skip (noindex): ${filename}`);
    continue;
  }

  const rawTitle = $('title').text().trim();
  const pageTitle = rawTitle.replace(/\s*[—–-]\s*Energohub\.info\s*$/, '').trim();
  const keywords  = $('meta[name="keywords"]').attr('content') || '';
  const description = $('meta[name="description"]').attr('content') || '';
  const metaCat   = $('meta[name="category"]').attr('content') || '';
  const category  = metaCat || categoryFromFile(filename);
  const pageUrl   = toUrl(filename);

  if (!pageTitle)    { console.warn(`  ⚠ no <title>: ${filename}`); warnings++; }
  if (!description)  { console.warn(`  ⚠ no description: ${filename}`); warnings++; }

  // Collect existing IDs to avoid slug collisions
  const existingIds = new Set();
  $('[id]').each((_, el) => existingIds.add($(el).attr('id')));

  let sectionsAdded = 0;
  let htmlModified  = false;

  $('h2').each((_, el) => {
    const $el = $(el);

    // Skip headings inside navigation/UI containers
    if ($el.closest(SKIP).length) return;

    const headingText = $el.text().trim();
    if (!headingText || headingText.length < 3) return;

    // Skip nav-style headings
    if (/^(zjistěte více|co vás zajímá podrobněji)/i.test(headingText)) return;

    let anchorId = $el.attr('id');

    if (!anchorId) {
      const $parent = $el.parent();
      const parentId = $parent.attr('id');

      // Use parent's id only when it's a single-H2 content wrapper
      if (parentId && !UI_IDS.has(parentId) && $parent.find('> h2').length === 1) {
        anchorId = parentId;
      } else {
        // Generate slug and add id directly to the H2 element
        let slug = slugify(headingText);
        let n = 2;
        const base = slug;
        while (existingIds.has(slug)) slug = `${base}-${n++}`;
        existingIds.add(slug);
        anchorId = slug;

        // Targeted string replacement — avoids full Cheerio re-serialization
        const oldHtml = $.html($el);
        $el.attr('id', anchorId);
        const newHtml = $.html($el);

        if (oldHtml !== newHtml) {
          const updated = html.replace(oldHtml, newHtml);
          if (updated !== html) {
            html = updated;
            htmlModified = true;
          } else {
            console.warn(`  ⚠ could not inject id for "${headingText}" in ${filename}`);
          }
        }
      }
    }

    // Per-section keywords override page-level keywords when present
    const sectionKeys = $el.attr('data-search-keys') || $el.parent().attr('data-search-keys') || '';
    const effectiveKeywords = sectionKeys || keywords;

    const text = headingText.toLowerCase();

    index.push({
      title:    headingText,
      page:     pageTitle,
      url:      `${pageUrl}#${anchorId}`,
      text,
      keywords: effectiveKeywords,
      category,
    });
    sectionsAdded++;
  });

  // Pages with no indexable H2s get a page-level entry
  if (sectionsAdded === 0) {
    const text = [pageTitle, description].filter(Boolean).join(' ').toLowerCase();
    index.push({ title: pageTitle, page: '', url: pageUrl, text, keywords, category });
  }

  if (htmlModified) {
    writeFileSync(filepath, html, 'utf8');
    htmlModifiedCount++;
    console.log(`  + IDs added: ${filename}`);
  }
}

writeFileSync(join(ROOT, 'search.json'), JSON.stringify(index, null, 2), 'utf8');
console.log(`\nIndexed ${index.length} sections → search.json`);
if (htmlModifiedCount > 0) console.log(`Modified ${htmlModifiedCount} HTML files`);
if (warnings > 0) console.warn(`${warnings} warnings`);
