/* Omezení znaků v polích kalkulaček a dotazníků.
   Atribut data-input: "int" = celé číslo, "dec" = desetinné číslo (tečka nebo čárka),
   "tel" = telefon (9 číslic, případně s předvolbou +420, mezery povolené). Ostatní znaky se nepřijmou ani při vložení ze schránky. */
(function () {
  var ALLOW = {
    int: /[0-9\s ]/,
    dec: /[0-9\s .,]/,
    tel: /[0-9\s+]/
  };


  // ── Telefon: 9 číslic, volitelně s předvolbou (+420 777 123 456). „00420…“ i „420…“ se opraví na „+420…“ ──
  var TEL_RE = /^(\+\d{3})?\d{9}$/;
  var TEL_MSG = 'Zadejte telefon o 9 číslicích, případně s předvolbou, např. +420 777 123 456.';

  function fixTel(v) {
    var t = v.replace(/^\s+/, '');
    if (/^00/.test(t)) t = '+' + t.slice(2);
    else if (t.indexOf('+') < 0 && /^42[01]\d{9}$/.test(t.replace(/\s/g, ''))) t = '+' + t;
    var max = t.charAt(0) === '+' ? 12 : 9, digits = 0, out = '';
    for (var i = 0; i < t.length; i++) {
      var ch = t.charAt(i);
      if (/\d/.test(ch)) { if (digits >= max) continue; digits++; }
      out += ch;
    }
    return out;
  }

  function checkTel(el) {
    var v = el.value.replace(/\s/g, '');
    el.setCustomValidity(v && !TEL_RE.test(v) ? TEL_MSG : '');
  }

  function kindOf(el) {
    var k = el && el.getAttribute ? el.getAttribute('data-input') : null;
    return ALLOW[k] ? k : null;
  }

  // Vrátí text jen s povolenými znaky. current = text pole bez označené části, atStart = vkládá se na začátek
  function clean(kind, text, current, atStart, isNumberField) {
    var allow = ALLOW[kind], out = '';
    var hasSep = /[.,]/.test(current), hasPlus = current.indexOf('+') > -1;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (!allow.test(ch)) continue;
      if (isNumberField && /\s/.test(ch)) continue;
      if ((ch === '.' || ch === ',') && kind === 'dec') { if (hasSep) continue; hasSep = true; }
      if (ch === '+') { if (hasPlus || !(atStart && out.length === 0)) continue; hasPlus = true; }
      out += ch;
    }
    return out;
  }

  document.addEventListener('beforeinput', function (e) {
    var el = e.target, kind = kindOf(el);
    if (!kind) return;
    if (e.inputType && /^(delete|history)/.test(e.inputType)) return;
    var data = e.data;
    if (data == null && e.dataTransfer) data = e.dataTransfer.getData('text/plain');
    if (data == null) return;

    var isNum = el.type === 'number', current = '', start = 0;
    if (!isNum) {
      var s = el.selectionStart, en = el.selectionEnd;
      current = el.value;
      if (s != null && en != null) { current = current.slice(0, s) + current.slice(en); start = s; }
    }
    var cleaned = clean(kind, data, current, start === 0, isNum);
    if (cleaned === data) return;
    e.preventDefault();
    if (cleaned) document.execCommand('insertText', false, cleaned);
  });

  // Záloha pro prohlížeče a klávesnice, které beforeinput nepošlou (automatické doplnění, diktování)
  document.addEventListener('input', function (e) {
    var el = e.target, kind = kindOf(el);
    if (!kind || el.type === 'number') return;
    var cleaned = clean(kind, el.value, '', true, false);
    if (kind === 'tel') cleaned = fixTel(cleaned);
    if (cleaned !== el.value) {
      var pos = el.selectionStart;
      var removed = el.value.length - cleaned.length;
      el.value = cleaned;
      try { el.setSelectionRange(Math.max(0, pos - removed), Math.max(0, pos - removed)); } catch (err) {}
    }
    if (kind === 'tel') checkTel(el);
  });

  // Hláška o neplatném telefonu se ukáže při odeslání formuláře (prohlížeč pole označí)
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (kindOf(el) === 'tel') { el.value = fixTel(el.value); checkTel(el); }
  });

  // ── Rozsahy hodnot (data-min, data-max) a čítač znaků (data-counter) ──
  window.EH = window.EH || {};

  function parseNum(v) {
    var n = parseFloat(String(v == null ? '' : v).replace(/[\s ]/g, '').replace(',', '.'));
    return isFinite(n) ? n : NaN;
  }
  function outOfRange(el) {
    var v = parseNum(el.value);
    if (isNaN(v)) return false;
    var mn = el.getAttribute('data-min'), mx = el.getAttribute('data-max');
    return (mn !== null && v < +mn) || (mx !== null && v > +mx);
  }
  function fmtN(n) { return Math.round(n).toLocaleString('cs-CZ'); }

  // Číslo z pole, nebo záloha (0), pokud je pole prázdné nebo mimo povolený rozsah. Kalkulačky tak s nesmyslnou hodnotou nepočítají.
  window.EH.numIn = function (el, fallback) {
    if (!el) return fallback || 0;
    var v = parseNum(el.value);
    return (isNaN(v) || outOfRange(el)) ? (fallback || 0) : v;
  };

  // Odstavec s hláškou pod polem (vznikne při prvním použití)
  function msgEl(el, kind) {
    var id = (el.id || 'pole') + '-' + kind, p = document.getElementById(id);
    if (!p) {
      var host = el.closest('label, .kalk-field, .jom-quiz__field, .fve-calc__field, .fve-form__field') || el.parentNode;
      p = document.createElement('p');
      p.id = id; p.hidden = true;
      p.className = 'form-error';
      p.setAttribute('role', 'alert');
      host.appendChild(p);
    }
    return p;
  }

  // Zkontroluje rozsah jednoho pole; show = ukázat hlášku pod polem. Vrací true, pokud je pole v pořádku.
  function validate(el, show) {
    var bad = outOfRange(el);
    var msg = bad ? (el.getAttribute('data-limit-msg') || ('Zadejte hodnotu od ' + el.getAttribute('data-min') + ' do ' + el.getAttribute('data-max') + '.')) : '';
    el.setCustomValidity(msg);
    if (show) {
      var p = msgEl(el, 'err');
      p.textContent = msg; p.hidden = !bad;
      if (bad) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', p.id); }
      else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
    }
    return !bad;
  }

  // Ověří všechna pole s rozsahem uvnitř kontejneru; vrátí první chybné pole (nebo null)
  window.EH.validateIn = function (root) {
    var first = null;
    (root || document).querySelectorAll('[data-min],[data-max]').forEach(function (el) {
      if (!validate(el, true) && !first) first = el;
    });
    return first;
  };

  function counter(el) {
    var max = el.getAttribute('maxlength');
    var p = el.nextElementSibling && el.nextElementSibling.hasAttribute('data-counter-out') ? el.nextElementSibling : null;
    if (!p) {
      p = document.createElement('p'); p.className = 'form-note'; p.setAttribute('data-counter-out', ''); p.setAttribute('aria-hidden', 'true');
      el.parentNode.insertBefore(p, el.nextSibling);
    }
    p.textContent = el.value.length + ' / ' + max;
  }

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.hasAttribute && el.hasAttribute('data-counter')) counter(el);
    if (el.hasAttribute && (el.hasAttribute('data-min') || el.hasAttribute('data-max'))) {
      var shown = document.getElementById((el.id || 'pole') + '-err');
      validate(el, !!(shown && !shown.hidden));   // při psaní jen hlídá platnost, hlášku ukáže až po dopsání (change)
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.hasAttribute && (el.hasAttribute('data-min') || el.hasAttribute('data-max'))) validate(el, true);
  });
  document.querySelectorAll('[data-counter]').forEach(counter);
})();
