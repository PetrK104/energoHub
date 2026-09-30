import Fuse from '/assets/vendor/fuse.min.mjs';

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

const SHARED_OPTS = { ignoreDiacritics: true, ignoreLocation: true, includeMatches: true };

function tokenize(query) {
  return query.toLowerCase().trim()
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

// Naivní česká kmenová přípona — ořeže 2 znaky u slov >5 znaků
// nabídky → nabíd, hodnocení → hodnoce
function stem(word) {
  return word.length > 5 ? word.slice(0, -2) : word;
}

export function createSearch() {
  let _data = null;
  let _strictFuse = null;
  let _fuzzyFuse  = null;
  let _loader     = null;
  let _timer      = null;

  function _init(data) {
    _data = data;
    _strictFuse = new Fuse(data, {
      ...SHARED_OPTS,
      keys: ['text'],
      threshold: 0.35,
      useExtendedSearch: true,
    });
    _fuzzyFuse = new Fuse(data, {
      ...SHARED_OPTS,
      keys: WEIGHTED_KEYS,
      threshold: 0.4,
    });
  }

  async function _load() {
    if (_loader) return _loader;
    _loader = fetch('/search.json').then(r => r.json()).then(_init);
    return _loader;
  }

  function _run(query) {
    const tokens = tokenize(query);
    if (!tokens.length || !_strictFuse) return [];

    // Pass 1 — strict: každé slovo jako 'apostrof-include na poli text, delší slova jsou ořezána
    const strictQ = { $and: tokens.map(t => ({ text: `'${stem(t)}` })) };
    let hits = _strictFuse.search(strictQ);

    // Pass 2 — fuzzy fallback pro překlepy: každý token zvlášť (OR), nejlepší skóre vyhraje
    if (!hits.length) {
      const seen = new Map();
      for (const t of tokens) {
        for (const r of _fuzzyFuse.search(t)) {
          const prev = seen.get(r.item.url);
          if (!prev || (r.score ?? 1) < (prev.score ?? 1)) seen.set(r.item.url, r);
        }
      }
      hits = [...seen.values()].sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
    }

    return hits.slice(0, 8);
  }

  return {
    /** Předehřátí indexu (volej při otevření overlaye) */
    async open() {
      await _load();
    },

    /** Debounced search — výsledky přijdou do callbacku */
    search(query, callback) {
      clearTimeout(_timer);
      _timer = setTimeout(async () => {
        if (!_data) await _load();
        callback(_run(query));
      }, 120);
    },

    /** Synchronní výsledek — funguje jen po await open() */
    searchSync(query) {
      return _data ? _run(query) : [];
    },
  };
}
