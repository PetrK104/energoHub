/* Pole vyplněná prohlížečem (autofill) mají mít stejné pozadí jako při ručním psaní.
   CSS (css/style.css) překryje barvu prohlížeče stínem v barvě pole. Tady se ta barva dopočítá z pozadí pole a jeho
   rodičů (pole mají průhledné pozadí, takže výsledná barva závisí na tom, v jaké kartě leží). */
(function () {
  function parse(c) {
    var m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return [0, 0, 0, 0];
    var p = m[1].split(/[ ,\/]+/).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  function effectiveBg(el) {
    var layers = [], e = el;
    while (e && e.nodeType === 1) { layers.push(parse(getComputedStyle(e).backgroundColor)); e = e.parentElement; }
    var base = parse(getComputedStyle(document.body).backgroundColor);
    var r = base[3] ? base[0] : 5, g = base[3] ? base[1] : 5, b = base[3] ? base[2] : 6;
    for (var i = layers.length - 1; i >= 0; i--) {
      var L = layers[i];
      r = L[0] * L[3] + r * (1 - L[3]); g = L[1] * L[3] + g * (1 - L[3]); b = L[2] * L[3] + b * (1 - L[3]);
    }
    return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
  }
  // CSS spustí animaci eh-autofill ve chvíli, kdy prohlížeč pole vyplní
  document.addEventListener('animationstart', function (ev) {
    if (ev.animationName !== 'eh-autofill' || !ev.target || !ev.target.style) return;
    try { ev.target.style.setProperty('--af-bg', effectiveBg(ev.target)); } catch (e) {}
  }, true);
})();
