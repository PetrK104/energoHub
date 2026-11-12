/* Omezení znaků v polích kalkulaček a dotazníků.
   Atribut data-input: "int" = celé číslo, "dec" = desetinné číslo (tečka nebo čárka),
   "tel" = telefon (číslice, mezery a úvodní +). Ostatní znaky se nepřijmou ani při vložení ze schránky. */
(function () {
  var ALLOW = {
    int: /[0-9\s ]/,
    dec: /[0-9\s .,]/,
    tel: /[0-9\s+]/
  };

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
    if (cleaned !== el.value) {
      var pos = el.selectionStart;
      var removed = el.value.length - cleaned.length;
      el.value = cleaned;
      try { el.setSelectionRange(Math.max(0, pos - removed), Math.max(0, pos - removed)); } catch (err) {}
    }
  });
})();
