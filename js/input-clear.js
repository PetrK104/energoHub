/* Křížek pro vymazání v textových polích (text, e-mail, telefon, číslo).
   Vzhled tlačítka = stejný jako ve vyhledávání (.search-clear). Zobrazí se, jakmile je pole vyplněné.
   Výjimky: data-no-clear, kompaktní čísla u posuvníků, pole s vlastním křížkem. */
(function () {
  var SEL = 'input:not([type]),input[type=text],input[type=email],input[type=tel],input[type=number],input[type=url]';
  var SKIP = '.form-hp input,[tabindex="-1"],[aria-hidden="true"],.mini-kalk__num,.fve-calc__number,[data-no-clear],.kalk-input-wrap input,.search-input,.slovnik__search';
  var items = [];

  function eligible(i) {
    if (i.dataset.clearInit || i.readOnly || i.disabled) return false;
    if (i.matches(SKIP)) return false;
    var p = i.parentElement;
    if (!p) return false;
    if (p.querySelector(':scope > .search-clear, :scope > .kalk-input-clear')) return false;
    return true;
  }

  function init(i) {
    if (!eligible(i)) return;
    i.dataset.clearInit = '1';
    var p = i.parentElement;
    if (getComputedStyle(p).position === 'static') p.classList.add('has-input-clear');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'search-clear input-clear';
    btn.hidden = true;
    btn.setAttribute('aria-label', 'Vymazat pole');
    btn.innerHTML = '<span class="ms-icon" aria-hidden="true">close</span>';
    p.appendChild(btn);
    i.classList.add('has-clear');

    function place() {
      var r = i.getBoundingClientRect(), pr = p.getBoundingClientRect();
      if (!r.width) return;
      var bR = parseFloat(getComputedStyle(p).borderRightWidth) || 0;
      btn.style.right = (pr.right - bR - r.right + 12) + 'px';
      btn.style.top = (r.top - pr.top - p.clientTop + r.height / 2) + 'px';
    }
    function sync() {
      var show = i.value !== '' && i.offsetParent !== null;
      btn.hidden = !show;
      if (show) place();
    }
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    btn.addEventListener('click', function () {
      i.value = '';
      i.dispatchEvent(new Event('input', { bubbles: true }));
      i.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
      i.focus();
    });
    ['input', 'change', 'focus', 'blur'].forEach(function (ev) { i.addEventListener(ev, sync); });
    if (i.form) i.form.addEventListener('reset', function () { setTimeout(sync, 0); });
    if (window.ResizeObserver) new ResizeObserver(sync).observe(i);
    items.push(sync);
    sync();
  }

  function scan(root) {
    (root.querySelectorAll ? root.querySelectorAll(SEL) : []).forEach(init);
    if (root.matches && root.matches(SEL)) init(root);
  }

  function start() {
    scan(document);
    window.addEventListener('resize', function () { items.forEach(function (f) { f(); }); });
    // hodnoty nastavené skriptem (předvyplnění, formátování) nevyvolají událost – občas zkontrolujeme
    setInterval(function () { if (!document.hidden) items.forEach(function (f) { f(); }); }, 500);
    if (window.MutationObserver) {
      var queued = false;
      new MutationObserver(function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; scan(document); });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
