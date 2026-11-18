// Doplní do hlavičky všech HTML stránek značky pro náhled při sdílení odkazu (Open Graph a Twitter Card).
// Titulek a popis se berou z <title> a <meta name="description"> dané stránky, obrázek je společný (assets/images/og-image.png).
// Spouští se při buildu (netlify.toml) po build-icons.mjs. Adresa webu se bere z proměnných Netlify:
// produkce = URL (hlavní doména), ostatní nasazení (větve, náhledy) = DEPLOY_PRIME_URL / DEPLOY_URL.
// Mimo Netlify (bez adresy) se nic nemění. Skript lze spouštět opakovaně, vlastní blok mezi značkami nahradí.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const env = process.env;
const base = ((env.CONTEXT === 'production' ? env.URL : (env.DEPLOY_PRIME_URL || env.DEPLOY_URL || env.URL)) || '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(base)) {
  console.log('[build-og] Adresa webu není k dispozici (běh mimo Netlify), značky se nepřidávají.');
  process.exit(0);
}

const IMAGE = base + '/assets/images/og-image.png';
const IMAGE_ALT = 'Energohub.info – srozumitelně k úsporám ve vašem domě';
const START = '<!-- og:start -->', END = '<!-- og:end -->';
const esc = (s) => s.replace(/&(?!(?:[a-z]+|#\d+);)/gi, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const SKIP = new Set(['404.html']);

let done = 0;
for (const file of readdirSync(ROOT).filter((f) => f.endsWith('.html') && !SKIP.has(f))) {
  const p = join(ROOT, file);
  let html = readFileSync(p, 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!title) { console.log('[build-og] přeskočeno (bez <title>): ' + file); continue; }

  const url = base + (file === 'index.html' ? '/' : '/' + file);
  const t = esc(title.trim()), d = desc ? esc(desc.trim()) : '';
  const lines = [
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Energohub.info">',
    '<meta property="og:locale" content="cs_CZ">',
    '<meta property="og:title" content="' + t + '">',
    d && '<meta property="og:description" content="' + d + '">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:image" content="' + IMAGE + '">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="' + IMAGE_ALT + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + t + '">',
    d && '<meta name="twitter:description" content="' + d + '">',
    '<meta name="twitter:image" content="' + IMAGE + '">'
  ].filter(Boolean);
  const block = START + '\n' + lines.join('\n') + '\n' + END;

  const re = new RegExp(START + '[\\s\\S]*?' + END);
  const next = re.test(html) ? html.replace(re, block) : html.replace('</head>', block + '\n</head>');
  if (next !== html) { writeFileSync(p, next); done++; }
}
console.log('[build-og] Doplněny značky pro sdílení na ' + done + ' stránkách (' + base + ').');
