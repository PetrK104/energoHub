import { createSearch } from './search.js';

// ── Konfigurace ──────────────────────────────────────────────────────────────
const EXAMPLES = [
  'Jak ověřit cenu nabídky',
  'Bezpečnost FVE',
  'Dotace pro SVJ',
  'Kdy se JOM vyplatí',
  'Baterie záloha',
];

const STOPWORDS = new Set([
  'jak','co','se','si','na','je','a','pro','do','od','to',
  'kdy','který','kde','proč','může','mám',
]);

// ── Stav ─────────────────────────────────────────────────────────────────────
const searcher = createSearch();
let overlay = null;
let inputEl = null;
let bodyEl  = null;
let liveEl  = null;
let lastOpener = null;
let openedByPointer = false;
let currentTokens = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
const IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
function pageUrl(url) {
  return (IS_LOCAL && url !== '/') ? url + '.html' : url;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
}

/** Zvýrazní tokeny v řetězci str (ignoruje diakritiku, case-insensitive). */
function highlight(str, tokens) {
  if (!str || !tokens.length) return esc(str || '');
  const ns = norm(str);
  const ranges = [];

  for (const t of tokens) {
    const patterns = new Set([norm(t)]);
    if (t.length > 6) patterns.add(norm(t).slice(0, -2));

    for (const pat of patterns) {
      if (!pat) continue;
      let i = 0;
      while (i < ns.length) {
        const p = ns.indexOf(pat, i);
        if (p === -1) break;
        ranges.push([p, p + pat.length - 1]);
        i = p + 1;
      }
    }
  }

  if (!ranges.length) return esc(str);

  // seřadit + sloučit překrývající se rozsahy
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0].slice()];
  for (let i = 1; i < ranges.length; i++) {
    const [s, e] = ranges[i];
    const prev = merged[merged.length - 1];
    if (s <= prev[1] + 1) prev[1] = Math.max(prev[1], e);
    else merged.push([s, e]);
  }

  let out = '', last = 0;
  for (const [s, e] of merged) {
    out += esc(str.slice(last, s));
    out += `<mark>${esc(str.slice(s, e + 1))}</mark>`;
    last = e + 1;
  }
  return out + esc(str.slice(last));
}

// ── Sestavení HTML overlaye ───────────────────────────────────────────────────
function buildOverlay() {
  const el = document.createElement('div');
  el.id = 'searchOverlay';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Vyhledávání');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="search-dialog" id="searchDialog">
      <div class="search-input-wrap">
        <span class="search-icon-wrap" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" stroke-width="1.8"/>
            <line x1="11.5" y1="11.5" x2="16" y2="16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </span>
        <input class="search-input" id="searchInput"
          type="search" autocomplete="off" autocorrect="off"
          autocapitalize="off" spellcheck="false"
          placeholder="Hledat na webu…"
          aria-label="Hledat na webu"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="searchListbox"
          aria-activedescendant=""
          aria-expanded="false"
        >
        <button class="search-clear" id="searchClear" aria-label="Smazat" hidden type="button">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <span aria-live="polite" aria-atomic="true" class="search-live" id="searchLive"></span>
      <div class="search-body" id="searchListbox"
           role="listbox" aria-label="Výsledky vyhledávání">
        ${hintHTML()}
      </div>
    </div>`;

  document.body.appendChild(el);
  return el;
}

// ── Renderování výsledků ──────────────────────────────────────────────────────
function renderResults(hits) {
  const q = inputEl.value.trim();

  if (!q) {
    showHint();
    return;
  }

  if (!hits || !hits.length) {
    bodyEl.innerHTML = `
      <div class="search-empty-panel">
        <p class="search-empty-text">Pro „${esc(q)}" nebylo nic nalezeno.</p>
        <ul class="search-empty-tips">
          <li>Zkuste kratší nebo jiné slovo</li>
          <li>Zkontrolujte pravopis</li>
          <li>Zkuste jen část slova — např. „baterie" místo „baterií"</li>
        </ul>
        <a class="search-empty-link" href="index.html#pruvodce">Přejít na přehled témat →</a>
      </div>`;
    liveEl.textContent = 'Žádné výsledky.';
    inputEl.setAttribute('aria-expanded', 'false');
    inputEl.setAttribute('aria-activedescendant', '');
    return;
  }

  const tokens = currentTokens;
  const html = hits.map((h, i) => {
    const it = h.item;
    return `<a class="search-result" role="option" id="sr-${i}"
               href="${esc(pageUrl(it.url))}" aria-selected="false">
      <div class="search-result__title">${highlight(it.title, tokens)}</div>
      ${it.description
        ? `<div class="search-result__desc">${highlight(it.description, tokens)}</div>`
        : ''}
      <span class="search-result__cat">${esc(it.category)}</span>
    </a>`;
  }).join('');

  bodyEl.innerHTML = html;
  inputEl.setAttribute('aria-expanded', 'true');
  inputEl.setAttribute('aria-activedescendant', '');

  const n = hits.length;
  liveEl.textContent = n === 1 ? '1 výsledek' : `${n} výsledků`;

  // klávesnice na výsledcích
  bodyEl.querySelectorAll('.search-result').forEach((el, i, arr) => {
    el.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = arr[i + 1] ?? arr[0];
        setActive(next, i + 1 < arr.length ? i + 1 : 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (i === 0) { inputEl.focus(); setActive(null, -1); }
        else setActive(arr[i - 1], i - 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        inputEl.focus();
        setActive(null, -1);
      }
    });
    el.addEventListener('focus', () => setActive(el, i));
  });
}

function hintHTML() {
  const items = EXAMPLES.map(e =>
    `<button class="search-hint-item" type="button">${esc(e)}</button>`
  ).join('');
  return `<div class="search-hint-panel">
    <p class="search-hint-title">Často hledané</p>
    <div class="search-hint-list">${items}</div>
  </div>`;
}

function showHint() {
  bodyEl.innerHTML = hintHTML();
  liveEl.textContent = '';
  inputEl.setAttribute('aria-expanded', 'false');
  inputEl.setAttribute('aria-activedescendant', '');
}

function setActive(el, idx) {
  bodyEl.querySelectorAll('.search-result').forEach(r =>
    r.setAttribute('aria-selected', 'false'));
  if (el) {
    el.setAttribute('aria-selected', 'true');
    el.scrollIntoView({ block: 'nearest' });
    inputEl.setAttribute('aria-activedescendant', `sr-${idx}`);
  } else {
    inputEl.setAttribute('aria-activedescendant', '');
  }
}

// ── Tokenizace pro zvýraznění ─────────────────────────────────────────────────
function tokenize(q) {
  return q.toLowerCase().trim().split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

// ── Otevřít / zavřít ──────────────────────────────────────────────────────────
function open(openerEl) {
  lastOpener = openerEl ?? document.getElementById('searchOpen') ?? null;

  if (!overlay) {
    overlay = buildOverlay();
    inputEl = overlay.querySelector('#searchInput');
    bodyEl  = overlay.querySelector('#searchListbox');
    liveEl  = overlay.querySelector('#searchLive');
    const clearBtn = overlay.querySelector('#searchClear');

    inputEl.addEventListener('input', () => {
      currentTokens = tokenize(inputEl.value);
      searcher.search(inputEl.value, renderResults);
      clearBtn.hidden = !inputEl.value;
    });

    clearBtn.addEventListener('click', () => {
      inputEl.value = '';
      clearBtn.hidden = true;
      currentTokens = [];
      showHint();
      inputEl.focus();
    });

    inputEl.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const first = bodyEl.querySelector('.search-result');
        if (first) { first.focus(); setActive(first, 0); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    });

    // klik na hint položku → vyplní input
    bodyEl.addEventListener('click', e => {
      const item = e.target.closest('.search-hint-item');
      if (item) {
        inputEl.value = item.textContent.trim();
        inputEl.dispatchEvent(new Event('input'));
        inputEl.focus();
      }
    });

    // klik mimo dialog → zavřít
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close();
    });

    // klik na link prázdného stavu → zavřít overlay a přejít
    bodyEl.addEventListener('click', e => {
      const link = e.target.closest('.search-empty-link');
      if (link) close();
    });

    // focus trap
    overlay.addEventListener('keydown', trapFocus);

    // předehřátí indexu
    searcher.open();
  }

  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => inputEl.focus());
}

function close() {
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (openedByPointer) {
    lastOpener?.blur();
  } else {
    lastOpener?.focus();
  }
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(
    overlay.querySelectorAll('input, button, a[href], [tabindex="0"]')
  ).filter(el => !el.disabled && el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}

// ── Globální klávesové zkratky ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Ctrl+K / Cmd+K
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openedByPointer = false;
    open();
    return;
  }
  // / — jen mimo editovatelná pole
  if (e.key === '/') {
    const t = document.activeElement;
    const tag = t?.tagName?.toLowerCase() ?? '';
    const editable = tag === 'input' || tag === 'textarea' || tag === 'select'
                     || t?.isContentEditable;
    if (!editable && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      openedByPointer = false;
      open();
    }
  }
});

// ── Init po DOMContentLoaded ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#searchOpen').forEach(btn => {
    btn.addEventListener('pointerdown', () => { openedByPointer = true; });
    btn.addEventListener('click', () => open(btn));
  });
});
