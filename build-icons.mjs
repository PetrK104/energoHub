// Sestaví seznam použitých ikon Material Symbols a zapíše ho do odkazu na Google Fonts
// v hlavičce všech HTML stránek (&icon_names=...). Spouští se při buildu (netlify.toml)
// a lokálně příkazem `npm run icons`.
//
// Ikony najde takto:
//  1) v CSS vyhledá třídy, které používají font 'Material Symbols Outlined' (ms-icon, ...)
//     a obsah `content:'název'` v těchto pravidlech,
//  2) v HTML a JS vyhledá <tag class="...ikonová-třída...">název</tag>,
//  3) přidá názvy z icons-extra.txt (pro ikony, které skript nenajde, např. název ve proměnné).
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const FONT_RE = /Material\s+Symbols\s+Outlined/;

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p, exts, out); continue; }
    if (exts.some(e => name.endsWith(e))) out.push(p);
  }
  return out;
}

const htmlFiles = readdirSync(ROOT).filter(f => f.endsWith('.html')).map(f => join(ROOT, f));
const cssFiles = walk(join(ROOT, 'css'), ['.css']);
const jsFiles = [...walk(join(ROOT, 'js'), ['.js']), ...(existsSync(join(ROOT, 'assets/js')) ? walk(join(ROOT, 'assets/js'), ['.js']) : [])];

const names = new Set();
const iconClasses = new Set(['ms-icon']);

// 1) CSS: třídy s ikonovým fontem a content:'název'
for (const f of cssFiles) {
  const css = readFileSync(f, 'utf8');
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!FONT_RE.test(m[2])) continue;
    for (const c of m[1].matchAll(/\.([\w-]+)/g)) iconClasses.add(c[1]);
    const content = m[2].match(/content:\s*['"]([a-z0-9_]+)['"]/);
    if (content) names.add(content[1]);
  }
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*content:\s*['"]([a-z0-9_]+)['"][^{}]*)\}/g)) {
    // pravidla s content, která ikonový font dědí ze své třídy
    if (m[1].split(',').some(s => [...iconClasses].some(c => s.includes('.' + c)))) names.add(m[3]);
  }
}

// 2) HTML + JS: <tag class="... ikonová-třída ...">název</tag>
const classAlt = [...iconClasses].map(c => c.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
const tagRe = new RegExp(
  `class\\s*=\\s*\\\\?["'\`][^"'\`]*\\b(?:${classAlt})\\b[^"'\`]*\\\\?["'\`][^>]*>\\s*([^<]*?)\\s*<`, 'g');
const warnings = [];
for (const f of [...htmlFiles, ...jsFiles]) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(tagRe)) {
    const text = m[1];
    if (/^[a-z0-9_]+$/.test(text)) names.add(text);
    else if (text) warnings.push(`${f.replace(ROOT, '')}: nelze určit ikonu z "${text}" – přidejte ji do icons-extra.txt`);
  }
}

// 3) ruční doplnění
const extraFile = join(ROOT, 'icons-extra.txt');
if (existsSync(extraFile)) {
  for (const line of readFileSync(extraFile, 'utf8').split('\n')) {
    const n = line.replace(/#.*/, '').trim();
    if (n) names.add(n);
  }
}

const list = [...names].sort().join(',');
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800' +
  '&family=Inter:wght@400;500;600;700' +
  '&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0' +
  `&icon_names=${list}&display=swap`;

// Starý samostatný odkaz na ikony (odstraní se) a odkaz na Figtree + Inter (nahradí se jedním společným)
const iconLinkRe = /[ \t]*<link(?![^>]*Figtree)[^>]*Material\+Symbols[^>]*>\s*?\n?/g;
const fontsLinkRe = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Figtree[^"]*" rel="stylesheet">/;

let changed = 0;
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  let out = html.replace(iconLinkRe, '');
  if (!fontsLinkRe.test(out)) { warnings.push(`${f.replace(ROOT, '')}: nenalezen odkaz na Figtree/Inter`); continue; }
  out = out.replace(fontsLinkRe, `<link href="${FONTS_URL}" rel="stylesheet">`);
  if (out !== html) { writeFileSync(f, out); changed++; }
}

console.log(`Ikony: ${names.size} (${list})`);
console.log(`Aktualizováno stránek: ${changed}/${htmlFiles.length}`);
for (const w of warnings) console.warn('VAROVÁNÍ:', w);
