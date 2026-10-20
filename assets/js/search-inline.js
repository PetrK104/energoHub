import { createSearch } from './search.js';

const IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
function pageUrl(url) {
  if (!IS_LOCAL) return url;
  const hi = url.indexOf('#');
  if (hi === -1) return url === '/' ? 'index.html' : url + '.html';
  const path = url.slice(0, hi), hash = url.slice(hi);
  return (path === '/' ? 'index.html' : path + '.html') + hash;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
}

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

const STOPWORDS = new Set([
  'jak','co','se','si','na','je','a','pro','do','od','to',
  'kdy','který','kde','proč','může','mám',
]);

function tokenize(q) {
  return q.toLowerCase().trim().split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

document.addEventListener('DOMContentLoaded', () => {
  const inputEl  = document.getElementById('searchCtaInput');
  const clearBtn = document.getElementById('searchCtaClear');
  const bodyEl   = document.getElementById('searchCtaBody');
  const liveEl   = document.getElementById('searchCtaLive');
  if (!inputEl) return;

  const searcher = createSearch();
  let currentTokens = [];

  function renderResults(hits) {
    const q = inputEl.value.trim();
    if (!q) { hide(); return; }

    bodyEl.hidden = false;

    if (!hits || !hits.length) {
      bodyEl.innerHTML = `<div class="search-empty-panel">
        <p class="search-empty-text">Pro „${esc(q)}" nebylo nic nalezeno.</p>
        <ul class="search-empty-tips">
          <li>Zkuste kratší nebo jiné slovo</li>
          <li>Zkontrolujte pravopis</li>
          <li>Zkuste jen část slova — např. „baterie" místo „baterií"</li>
        </ul>
      </div>`;
      liveEl.textContent = 'Žádné výsledky.';
      return;
    }

    const groups = [];
    const groupMap = new Map();
    for (const h of hits) {
      const key = h.item.page || ('__' + h.item.url);
      if (!groupMap.has(key)) {
        const g = { pageTitle: h.item.page, category: h.item.category, hits: [] };
        groups.push(g);
        groupMap.set(key, g);
      }
      groupMap.get(key).hits.push(h);
    }
    let idx = 0;
    bodyEl.innerHTML = groups.map(group => {
      const header = group.pageTitle
        ? `<div class="search-group__header">
             <span class="search-group__page">${esc(group.pageTitle)}</span>
             <span class="search-result__cat">${esc(group.category)}</span>
           </div>`
        : '';
      const items = group.hits.map(h => {
        const it = h.item;
        const i = idx++;
        const cls = group.pageTitle ? 'search-result search-result--grouped' : 'search-result';
        return `<a class="${cls}" href="${esc(pageUrl(it.url))}" id="scr-${i}">
          <div class="search-result__title">${highlight(it.title, currentTokens)}</div>
          ${!group.pageTitle ? `<span class="search-result__cat">${esc(it.category)}</span>` : ''}
        </a>`;
      }).join('');
      return header + items;
    }).join('');

    const n = hits.length;
    liveEl.textContent = n === 1 ? '1 výsledek' : `${n} výsledků`;

    bodyEl.querySelectorAll('.search-result').forEach((el, i, arr) => {
      el.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          (arr[i + 1] ?? arr[0]).focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          i === 0 ? inputEl.focus() : arr[i - 1].focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          inputEl.focus();
        }
      });
    });
  }

  function hide() {
    bodyEl.hidden = true;
    liveEl.textContent = '';
  }

  inputEl.addEventListener('input', () => {
    currentTokens = tokenize(inputEl.value);
    clearBtn.hidden = !inputEl.value;
    if (!inputEl.value.trim()) { hide(); return; }
    searcher.search(inputEl.value, renderResults);
  });

  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    clearBtn.hidden = true;
    currentTokens = [];
    hide();
    inputEl.focus();
  });

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const first = bodyEl.querySelector('.search-result');
      if (first) first.focus();
    }
  });
});
