// Testovací skript — spusť: node test-search.mjs
import { readFileSync } from 'fs';
import Fuse from './node_modules/fuse.js/dist/fuse.min.mjs';

const STOPWORDS = new Set([
  'jak','co','se','si','na','je','a','pro','do','od','to',
  'kdy','který','kde','proč','může','mám',
]);

const WEIGHTED_KEYS = [
  { name: 'title',       weight: 3 },
  { name: 'keywords',    weight: 2 },
  { name: 'headings',    weight: 2 },
  { name: 'description', weight: 1 },
];

const SHARED = { ignoreDiacritics: true, ignoreLocation: true, includeMatches: true };

const data = JSON.parse(readFileSync('./search.json', 'utf8'));

const strictFuse = new Fuse(data, {
  ...SHARED,
  keys: ['text'],
  threshold: 0.35,
  useExtendedSearch: true,
});

const fuzzyFuse = new Fuse(data, {
  ...SHARED,
  keys: WEIGHTED_KEYS,
  threshold: 0.4,
});

function tokenize(q) {
  return q.toLowerCase().trim().split(/\s+/).filter(w => w.length > 1 && !STOPWORDS.has(w));
}

function stem(w) {
  return w.length > 6 ? w.slice(0, -2) : w;
}

function search(query) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];

  const strictQ = { $and: tokens.map(t => ({ text: `'${stem(t)}` })) };
  let hits = strictFuse.search(strictQ);
  const pass = hits.length ? 'strict' : 'fuzzy';

  if (!hits.length) {
    const seen = new Map();
    for (const t of tokens) {
      for (const r of fuzzyFuse.search(t)) {
        const prev = seen.get(r.item.url);
        if (!prev || (r.score ?? 1) < (prev.score ?? 1)) seen.set(r.item.url, r);
      }
    }
    hits = [...seen.values()].sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
  }

  return { pass, results: hits.slice(0, 8) };
}

// ── Testovací dotazy ────────────────────────────────────────────────────────
const QUERIES = [
  'jak ověřit cenu nabídky',
  'bezpečnost',
  'bezpecnost',
  'kolik stojí fve',
  'dotace svj',
  'objdenávka',   // překlep "objednávka"
  'baterie záloha',
];

for (const q of QUERIES) {
  const { pass, results } = search(q);
  const top3 = results.slice(0, 3).map(r => r.item.url);
  const pad  = top3.length ? top3.join('  ') : '(nic)';
  console.log(`"${q}"  [${pass}]`);
  console.log(`  → ${pad}`);
}
