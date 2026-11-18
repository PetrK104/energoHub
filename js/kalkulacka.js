(function () {

  var state = {
    byty: 0, spotreba: 0,
    fveOrientace: 1.0,
    fveOrientaceKlic: 'J',
    orientTouched: false,
    fveCenaEl: KALK.FVE_CENA_EL,
    tcNakladyRucne: 0,
    zatStav: 'stara',
    zatPlocha: 0,
    period: 'rok',
    selected: { jom: false, fve: false, tc: false, zatepleni: false }
  };

  // Číselná pole jsou textová: čtou se tolerantně (mezery, nezlomitelné mezery, Kč, kWh, m², čárka i tečka)
  function parseNum(str) {
    var t = String(str == null ? '' : str).replace(/[\s\u00a0]/g, '').replace(/kč|kwh|m²|m2/gi, '').replace(',', '.');
    if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(t)) return NaN;
    return parseFloat(t);
  }
  var cenaInit = document.getElementById('fveCenaEl');
  if (cenaInit) cenaInit.value = String(KALK.FVE_CENA_EL).replace('.', ',');
  var results = {};

  var STEP_META = {
    basic:     { panelId: 'kalkPanel0', label: 'Základní údaje' },
    jom:       { panelId: 'kalkPanel1', label: 'JOM' },
    fve:       { panelId: 'kalkPanel2', label: 'FVE' },
    tc:        { panelId: 'kalkPanel3', label: 'Teplo a TUV' },
    zatepleni: { panelId: 'kalkPanel4', label: 'Okna a dveře' },
    summary:   { panelId: 'kalkPanel5', label: 'Souhrn' }
  };

  // ── Helpers ──────────────────────────────────────────────
  function fmt(n) { return Math.round(n).toLocaleString('cs-CZ') + ' Kč'; }
  function fmtKwh(n) { return Math.round(n).toLocaleString('cs-CZ') + ' kWh'; }
  function fmtRoky(n) { return n.toFixed(1) + ' let'; }
  function setText(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function setHeight(id, pct) {
    var el = document.getElementById(id);
    if (el) el.style.height = Math.min(100, Math.max(2, pct)) + '%';
  }

  // ── Sekvence kroků ───────────────────────────────────────
  function buildSequence() {
    var seq = ['basic'];
    if (state.selected.jom)       seq.push('jom');
    if (state.selected.fve)       seq.push('fve');
    if (state.selected.tc)        seq.push('tc');
    if (state.selected.zatepleni) seq.push('zatepleni');
    seq.push('summary');
    return seq;
  }

  // ── Stepper ───────────────────────────────────────────────
  function buildStepper() {
    var seq = buildSequence();
    var stepper = document.getElementById('kalkStepper');
    stepper.innerHTML = '';
    seq.forEach(function (key, i) {
      var item = document.createElement('div');
      item.className = 'kalk-step-item';
      item.setAttribute('data-step-key', key);
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', 'Přejít na krok ' + (i + 1) + ': ' + STEP_META[key].label);
      item.innerHTML =
        '<div class="kalk-step-dot">' + (i + 1) + '</div>' +
        '<span class="kalk-step-label">' + STEP_META[key].label + '</span>';
      stepper.appendChild(item);
      if (i < seq.length - 1) {
        var line = document.createElement('div');
        line.className = 'kalk-step-line';
        stepper.appendChild(line);
      }
    });
    updateBadges();
  }

  function updateStepper(currentKey) {
    var seq = buildSequence();
    var currentIdx = seq.indexOf(currentKey);
    document.querySelectorAll('#kalkStepper .kalk-step-item').forEach(function (item, i) {
      item.classList.toggle('is-active', i === currentIdx);
      item.classList.toggle('is-done', i < currentIdx);
      if (i === currentIdx) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
    });
  }

  function updateBadges() {
    var seq = buildSequence();
    var solutionKeys = ['jom', 'fve', 'tc', 'zatepleni'];
    var selectedSeq = seq.filter(function (k) { return solutionKeys.indexOf(k) >= 0; });
    selectedSeq.forEach(function (key, i) {
      var badge = document.querySelector('#' + STEP_META[key].panelId + ' .kalk-step-badge');
      if (badge) badge.textContent = 'Krok ' + (i + 1) + ' z ' + selectedSeq.length;
    });
  }

  // ── Detail inputs ─────────────────────────────────────────
  // Volby orientace střechy se plní z jedné tabulky v konstantách
  (function () {
    var sel = document.getElementById('fveOrientace');
    if (!sel) return;
    var labels = { J: 'Jih – nejlepší výnos', JV: 'Jihovýchod', JZ: 'Jihozápad', V: 'Východ', Z: 'Západ', S: 'Sever' };
    ['J', 'JV', 'JZ', 'V', 'Z', 'S'].forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = labels[k];
      sel.appendChild(o);
    });
    sel.value = 'J';
    sel.addEventListener('change', function () { state.orientTouched = true; });
  })();

  function readDetailInputs() {
    var orient  = document.getElementById('fveOrientace');
    var cenaEl  = document.getElementById('fveCenaEl');
    var tcRuc   = document.getElementById('tcNakladyInput');
    var zatStav = document.getElementById('zatStav');
    var tcDum   = document.getElementById('tcDum');

    if (orient)  { state.fveOrientace = KALK.ORIENT[orient.value] || 1.0; state.fveOrientaceKlic = KALK.ORIENT[orient.value] ? orient.value : 'J'; }
    if (cenaEl)  state.fveCenaEl      = (window.EH && EH.numIn ? EH.numIn(cenaEl) : parseNum(cenaEl.value)) || KALK.FVE_CENA_EL;
    if (tcRuc) state.tcNakladyRucne = Math.round(parseNum(tcRuc.value)) || 0;
    if (zatStav) state.zatStav        = zatStav.value || 'stara';
    if (tcDum)   state.domZateplen    = tcDum.value !== 'ne';
    var zatPl = document.getElementById('zatPlochaInput');
    if (zatPl) state.zatPlocha        = (window.EH && EH.numIn ? EH.numIn(zatPl) : parseNum(zatPl.value)) || 0;
  }

  // ── Zápis částek: rozpětí ±KALK.ROZPETI, od 1 mil. Kč v milionech ──
  var RP = KALK.ROZPETI;
  var NB = '\u00a0';
  function nf(n) { return n.toLocaleString('cs-CZ'); }
  function stepOf(n) { return n >= 100000 ? 1000 : n >= 10000 ? 500 : n >= 1000 ? 100 : 10; }
  function rnd(n, s) { return Math.round(n / s) * s; }
  function mil(n) { return (n / 1e6).toFixed(1).replace('.', ','); }
  // bare = bez jednotky Kč (jednotku doplní volající, např. „Kč/rok“)
  function fmtR(n, bare) {
    if (!isFinite(n)) return '—';
    var lo = Math.min(n * (1 - RP), n * (1 + RP)), hi = Math.max(n * (1 - RP), n * (1 + RP));
    if (Math.abs(hi) >= 1e6) return mil(lo) + NB + '–' + NB + mil(hi) + NB + 'mil.' + (bare ? '' : NB + 'Kč');
    var st = stepOf(Math.abs(hi));
    return nf(rnd(lo, st)) + NB + '–' + NB + nf(rnd(hi, st)) + (bare ? '' : NB + 'Kč');
  }
  // Rozpětí v tisících Kč, od 1 mil. Kč v milionech (jednotka se vrací zvlášť)
  function fmtThousandsRange(lo, hi) {
    if (hi >= 1e6) return { text: mil(lo) + NB + '–' + NB + mil(hi), unit: 'mil. Kč' };
    var d = hi < 20000 ? 1 : 0;
    var k = function (v) { return (v / 1000).toFixed(d).replace('.', ','); };
    return { text: k(lo) + NB + '–' + NB + k(hi), unit: 'tis. Kč' };
  }
  // Pevné rozpětí (např. investice podle počtu bytů)
  function fmtLoHi(lo, hi, bare) {
    if (hi >= 1e6) return mil(lo) + NB + '–' + NB + mil(hi) + (bare ? '' : NB + 'mil.' + NB + 'Kč');
    var st = stepOf(hi);
    return nf(rnd(lo, st)) + NB + '–' + NB + nf(rnd(hi, st)) + (bare ? '' : NB + 'Kč');
  }
  function fmtRound(n) {
    if (!isFinite(n)) return '—';
    if (Math.abs(n) >= 1e6) return mil(n) + NB + 'mil.' + NB + 'Kč';
    return nf(rnd(n, stepOf(Math.abs(n)))) + NB + 'Kč';
  }
  // Rozpětí návratnosti v letech: nad 100 let se píše „100+“, nekonečno nebo velmi dlouhá doba „více než 100“
  function navRange(lo, hi) {
    var f = function (v) { return v.toFixed(1).replace('.', ','); };
    if (!isFinite(lo) || lo > 100) return 'více než' + NB + '100';
    return f(lo) + NB + '–' + NB + ((!isFinite(hi) || hi > 100) ? '100+' : f(hi));
  }
  // Věta pod čárovým grafem: rozpětí návratnosti (stejný vzorec jako v souhrnu) a co pásy znamenají
  function lineNote(lo, hi) {
    return '<strong>Investice se vrátí za ' + navRange(lo, hi) + ' roku.</strong> ' +
      'Pásy ukazují rozpětí odhadu úspory a investice. Návratnost začíná, kde se pásy překryjí. Počítá se s konstantní úsporou, bez změn cen energií.';
  }
  // Rozpětí Kč s možnými zápornými hodnotami (tisíce, od 1 mil. v milionech)
  function rangeSigned(lo, hi) {
    if (lo >= 0) return fmtThousandsRange(lo, hi);
    if (hi <= 0) { var x = fmtThousandsRange(-hi, -lo); return { text: x.text.replace(/\d[\d,]*/g, '−$&').replace(NB + '–' + NB, NB + 'až' + NB), unit: x.unit }; }
    var y = fmtThousandsRange(-lo, hi); return { text: y.text.replace(/^\d[\d,]*/, '−$&'), unit: y.unit };
  }
  function fmtRokyR(n) {
    if (!isFinite(n)) return '—';
    var f = function (v) { return v.toFixed(1).replace('.', ','); };
    return f(n * (1 - RP)) + NB + '–' + NB + f(n * (1 + RP)) + NB + 'let';
  }
  function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }

  // ── Calculations ─────────────────────────────────────────
  var lastInp = null;
  function calculate() {
    // Jedno pravidlo rozpětí: neznámé vstupy = odhadnutá spotřeba a nezměněná orientace střechy
    RP = KALK.rozpeti((state.spotrebaOdhad ? 1 : 0) + (state.orientTouched ? 0 : 1));
    state.rozpeti = RP;
    lastInp = {
      rozpeti: RP,
      byty: state.byty,
      spotreba: state.spotreba,
      orient: state.fveOrientace,
      cenaEl: state.fveCenaEl,
      tcNakladyRucne: state.tcNakladyRucne,
      zatStav: state.zatStav,
      domZateplen: state.domZateplen !== false,
      zatPlocha: state.zatPlocha,
      selected: state.selected
    };
    results = KALK_ENGINE.compute(lastInp);
  }

  // ── Panel renderers ───────────────────────────────────────
  function renderPanel1() {
    var r = results;
    var inv = r.jom_investice;
    // Čísla bez jednotky; jednotka je pod číslem (tis. Kč / mil. Kč), stejný princip jako ve FVE kalkulačce
    var us = fmtThousandsRange(r.uspora_jom * (1 - RP), r.uspora_jom * (1 + RP));
    var iv = fmtThousandsRange(inv.lo, inv.hi);
    setText('jomUspora', us.text);
    setText('jomInvestice', iv.text);
    setText('jomNaByt', fmtR(r.uspora_jom / state.byty / 12, true));
    var upUnit = document.querySelector('#jomUspora + .kalk-result-unit');
    if (upUnit) upUnit.textContent = us.unit;
    var invUnit = document.querySelector('#jomInvestice + .kalk-result-unit');
    if (invUnit) invUnit.textContent = iv.unit;
    // Návratnost: rozpětí investice proti rozpětí úspory (stejný vzorec jako v souhrnu)
    var loY = inv.lo / (r.uspora_jom * (1 + RP)), hiY = inv.hi / (r.uspora_jom * (1 - RP));
    setText('jomNavratnost', navRange(loY, hiY));
    // Graf s rozpětím: stejné hranice úspory, investice i návratnosti jako v číslech nad grafem
    lineData.jomLine = { uLo: r.uspora_jom * (1 - RP), uHi: r.uspora_jom * (1 + RP), invLo: inv.lo, invHi: inv.hi, navLo: loY, navHi: hiY };
    drawLine('jomLine');
    var note = document.getElementById('jomHbNote');
    if (note) note.innerHTML = lineNote(loY, hiY);
  }

  // „Hezký“ krok osy Y (1, 2, 2,5, 5 × 10^n)
  function niceStep(raw) {
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function tickKc(n) {
    if (n === 0) return '0';
    if (n >= 1e6) return (n / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: 2 }) + NB + 'mil.';
    return (n / 1000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + NB + 'tis.';
  }
  function svgEl(tag, cls, attrs) {
    var s = '<' + tag + (cls ? ' class="' + cls + '"' : '');
    for (var k in attrs) s += ' ' + k + '="' + attrs[k] + '"';
    return s + '/>';
  }

  // Čárový graf s rozpětím: pás nasbíraných úspor, pás investice a vyznačená oblast návratnosti.
  // Hodnoty jsou v kompaktní legendě nad grafem (HTML), takže je čáry nikdy nepřekryjí.
  function drawBand(box, d) {
    var W = box.clientWidth || 560, narrow = W < 480, H = narrow ? 220 : 250;
    var m = { l: narrow ? 56 : 64, r: 8, t: 12, b: 40 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var hasPb = d.uLo > 0 && isFinite(d.navHi);
    // Horizont: nejmenší „hezké“ číslo s rezervou za horní hranicí návratnosti (nejvýš 50 let)
    var YEARS = 50, cand = [5, 10, 15, 20, 25, 30, 40, 50];
    for (var ci = 0; ci < cand.length; ci++) { if (hasPb && cand[ci] >= d.navHi * 1.15) { YEARS = cand[ci]; break; } }
    var top = Math.max(d.invHi, d.uHi * YEARS);
    // Osa Y: ze 3–6 dílků vybere ten, který nechá nad nejvyšší hodnotou nejmíň prázdného místa
    var step = 0, yMax = Infinity;
    for (var nt = 3; nt <= 6; nt++) {
      var st = niceStep(top / nt), ym = Math.ceil(top / st - 1e-9) * st;
      if (ym / st > 5.001) continue; // víc než 5 dílků je na nízký graf moc husté
      // při stejné výšce osy dává přednost počtu dílků blíž ke 4
      if (ym < yMax - 1e-6 || (Math.abs(ym - yMax) < 1e-6 && Math.abs(ym / st - 4) < Math.abs(yMax / step - 4))) { yMax = ym; step = st; }
    }
    var X = function (yr) { return m.l + Math.min(yr, YEARS) / YEARS * iw; };
    var Y = function (v) { return m.t + ih - Math.max(0, v) / yMax * ih; };
    var f = function (n) { return n.toFixed(1); };
    var xEnd = W - m.r, out = '';

    for (var v = 0; v <= yMax + 1e-6; v += step) {
      out += svgEl('line', 'kalk-lc-grid', { x1: m.l, x2: xEnd, y1: f(Y(v)), y2: f(Y(v)) });
      out += '<text class="kalk-lc-tick" x="' + (m.l - 8) + '" y="' + f(Y(v) + 4) + '" text-anchor="end">' + tickKc(v) + '</text>';
    }
    var tickStep = YEARS <= 5 ? 1 : (YEARS <= 10 ? 2 : (YEARS <= 25 ? 5 : 10));
    if (narrow && YEARS / tickStep > 5) tickStep *= 2;
    for (var ty = 0; ty <= YEARS; ty += tickStep) {
      if (ty !== YEARS && X(YEARS) - X(ty) < 48) continue; // nesmí se dotýkat popisku „N let“
      out += '<text class="kalk-lc-tick" x="' + f(X(ty)) + '" y="' + (H - 12) + '" text-anchor="' + (ty === 0 ? 'start' : ty === YEARS ? 'end' : 'middle') + '">' + (ty === YEARS ? ty + NB + 'let' : ty) + '</text>';
    }

    // oblast návratnosti: svislý pruh přes celou výšku grafu
    var nav = hasPb ? navRange(d.navLo, d.navHi) : 'více než' + NB + '100';
    if (hasPb) {
      var x0 = X(d.navLo), x1 = X(d.navHi);
      out += svgEl('rect', 'kalk-lc-pbzone', { x: f(x0), y: m.t, width: f(Math.max(1, x1 - x0)), height: f(ih) });
    }
    // pás investice
    out += svgEl('rect', 'kalk-lc-invband', { x: m.l, y: f(Y(d.invHi)), width: iw, height: f(Math.max(1, Y(d.invLo) - Y(d.invHi))) });
    out += svgEl('line', 'kalk-lc-inv', { x1: m.l, x2: xEnd, y1: f(Y(d.invHi)), y2: f(Y(d.invHi)) });
    out += svgEl('line', 'kalk-lc-inv', { x1: m.l, x2: xEnd, y1: f(Y(d.invLo)), y2: f(Y(d.invLo)) });
    // pás úspor: od nuly lineárně, horní a dolní hranice rozpětí
    if (d.uHi > 0) {
      var pts = [[0, 0], [YEARS, d.uHi * YEARS], [YEARS, Math.max(0, d.uLo) * YEARS]];
      out += '<polygon class="kalk-lc-saveband" points="' + pts.map(function (p) { return f(X(p[0])) + ',' + f(Y(p[1])); }).join(' ') + '"/>';
      out += svgEl('line', 'kalk-lc-save', { x1: X(0), y1: Y(0), x2: f(X(YEARS)), y2: f(Y(d.uHi * YEARS)) });
      out += svgEl('line', 'kalk-lc-save', { x1: X(0), y1: Y(0), x2: f(X(YEARS)), y2: f(Y(Math.max(0, d.uLo) * YEARS)) });
    }

    // body návratnosti; neviditelný větší kruh je cíl pro najetí myší, dotyk i klávesnici
    var pbPts = [];
    if (hasPb) {
      pbPts.push({ x: X(d.navLo), y: Y(d.invLo), title: 'Nejrychlejší návratnost', note: 'nižší investice, optimistická úspora', yrs: d.navLo, inv: d.invLo, u: d.uHi });
      if (d.navHi <= YEARS) pbPts.push({ x: X(d.navHi), y: Y(d.invHi), title: 'Nejpomalejší návratnost', note: 'vyšší investice, pesimistická úspora', yrs: d.navHi, inv: d.invHi, u: d.uLo });
    }
    // jedna hodnota ve stejném zaokrouhlení jako rozpětí ve výsledcích kroku (hi = horní mez rozpětí)
    var kOne = function (v, hi) {
      if (hi >= 1e6) return mil(v) + NB + 'mil.' + NB + 'Kč';
      return (v / 1000).toFixed(hi < 20000 ? 1 : 0).replace('.', ',') + NB + 'tis.' + NB + 'Kč';
    };
    pbPts.forEach(function (p, i) {
      out += svgEl('circle', 'kalk-lc-dot', { cx: f(p.x), cy: f(p.y), r: 5 });
      out += '<circle class="kalk-lc-hit" data-i="' + i + '" cx="' + f(p.x) + '" cy="' + f(p.y) + '" r="16" tabindex="0" role="button" aria-label="' + p.title + ': ' + p.yrs.toFixed(1).replace('.', ',') + ' roku"/>';
    });

    var usp = fmtThousandsRange(d.uLo * YEARS, d.uHi * YEARS), inv = fmtThousandsRange(d.invLo, d.invHi);
    box.setAttribute('aria-label', 'Graf: investice ' + inv.text + ' ' + inv.unit + ', úspory za ' + YEARS + ' let ' + usp.text + ' ' + usp.unit + ', návratnost ' + nav + ' roku');
    box._lcW = box.clientWidth;
    var legend =
      '<li class="kalk-lc-key kalk-lc-key--save">Úspory za ' + YEARS + NB + 'let <strong>' + usp.text + NB + usp.unit + '</strong></li>' +
      '<li class="kalk-lc-key kalk-lc-key--inv">Investice <strong>' + inv.text + NB + inv.unit + '</strong></li>' +
      (hasPb ? '<li class="kalk-lc-key kalk-lc-key--pb">Návratnost <strong>' + nav + NB + 'roku</strong></li>' : '');
    box.innerHTML = '<ul class="kalk-lc-legend" aria-hidden="true">' + legend + '</ul><svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + out + '</svg>' +
      '<div class="kalk-lc-tip" hidden></div>';

    // tabulka po najetí na bod návratnosti
    var tip = box.querySelector('.kalk-lc-tip'), active = null;
    var showTip = function (i) {
      var p = pbPts[i];
      active = i;
      tip.innerHTML = '<p class="kalk-lc-tip__title">' + p.title + '</p><p class="kalk-lc-tip__note">' + p.note + '</p>' +
        '<table><tr><th>Návratnost od začátku</th><td>' + p.yrs.toFixed(1).replace('.', ',') + NB + 'roku</td></tr>' +
        '<tr><th>Investice</th><td>' + kOne(p.inv, d.invHi) + '</td></tr>' +
        '<tr><th>Úspora za rok</th><td>' + kOne(p.u, d.uHi) + '</td></tr></table>';
      tip.hidden = false;
      var tw2 = tip.offsetWidth, th2 = tip.offsetHeight;
      var left = Math.min(Math.max(p.x - tw2 / 2, 0), W - tw2);
      var svgTop = box.querySelector('svg').getBoundingClientRect().top - box.getBoundingClientRect().top;
      var topY = p.y - th2 - 14;
      if (topY + svgTop < 0) topY = p.y + 14;
      tip.style.left = left + 'px';
      tip.style.top = (topY + svgTop) + 'px';
    };
    var hideTip = function () { tip.hidden = true; active = null; };
    box.querySelectorAll('.kalk-lc-hit').forEach(function (c) {
      var i = +c.getAttribute('data-i');
      c.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') showTip(i); });
      c.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hideTip(); });
      c.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') showTip(i); });
      c.addEventListener('click', function () { showTip(i); });
      c.addEventListener('focus', function () { showTip(i); });
      c.addEventListener('blur', hideTip);
      c.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideTip(); });
    });
  }

  // Dotyk mimo bod návratnosti zavře otevřenou tabulku (jeden posluchač pro všechny grafy)
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('.kalk-lc-hit')) return;
    document.querySelectorAll('.kalk-lc-tip').forEach(function (t) { t.hidden = true; });
  });

  // Čárový graf: nasbírané úspory v čase proti investici (SVG, barvy webu)
  var lineData = {};
  function drawLine(boxId) {
    var box = document.getElementById(boxId), d = lineData[boxId];
    if (box && d) drawBand(box, d);
  }
  window.addEventListener('resize', function () {
    [['jomLine', 'kalkPanel1'], ['fveLine', 'kalkPanel2'], ['tcLine', 'kalkPanel3']].forEach(function (x) {
      var panel = document.getElementById(x[1]);
      var b = document.getElementById(x[0]);
      // jen při změně šířky (mobilní prohlížeč posílá resize i při schování adresního řádku)
      if (panel && !panel.hidden && b && b.clientWidth !== b._lcW) drawLine(x[0]);
    });
  });

  function renderPanel2() {
    var r = results;
    var total = r.uspora_celkem;
    var us = fmtThousandsRange(total * (1 - RP), total * (1 + RP));
    var iv = fmtThousandsRange(r.investice_fve * (1 - RP), r.investice_fve * (1 + RP));
    setText('fveUspora', us.text);
    setText('fveInvestice', iv.text);
    setText('fveVykon', r.vykon + '');
    var u1 = document.querySelector('#fveUspora + .kalk-result-unit'); if (u1) u1.textContent = us.unit;
    var u2 = document.querySelector('#fveInvestice + .kalk-result-unit'); if (u2) u2.textContent = iv.unit;
    // Návratnost = investice ÷ ukázaná celková úspora (rozpětí úspory)
    var fveNavLo = r.investice_fve * (1 - RP) / (total * (1 + RP)), fveNavHi = r.investice_fve * (1 + RP) / (total * (1 - RP));
    setText('fveNavratnost', navRange(fveNavLo, fveNavHi));

    // Graf 1: měsíční úspora proti splátce úvěru
    var uMes = total / 12, sMes = r.splatka_mes, zb = uMes - sMes;
    var mx = Math.max(uMes, sMes);
    [['fveCfUsp', uMes], ['fveCfSpl', sMes], ['fveCfZb', Math.max(zb, 0)]].forEach(function (x) {
      var el = document.getElementById(x[0]);
      if (el) el.style.width = Math.max(2, x[1] / mx * 100) + '%';
      setText(x[0] + 'Val', fmtRound(x[1]));
    });
    var cf = document.getElementById('fveCfNote');
    if (cf) {
      cf.innerHTML = '<strong>Úvěr NZÚ ' + fmtRound(r.uver) + ' na ' + r.splatnostLet + ' let, měsíční splátka ' + fmtRound(sMes) + '.</strong> ' +
        (zb >= 0 ? 'Úspora ji pokryje a zbývá asi ' + fmtRound(zb) + ' měsíčně.' : 'Úspora splátku nepokryje, chybí asi ' + fmtRound(-zb) + ' měsíčně.') +
        ' Úvěr se počítá z ceny FVE bez JOM.' +
        ' NZÚ je program Nová zelená úsporám.';
    }

    // Graf 2: kumulativní úspory proti investici
    lineData.fveLine = { uLo: total * (1 - RP), uHi: total * (1 + RP), invLo: r.investice_fve * (1 - RP), invHi: r.investice_fve * (1 + RP), navLo: fveNavLo, navHi: fveNavHi };
    drawLine('fveLine');
    var ln = document.getElementById('fveLineNote');
    if (ln) ln.innerHTML = lineNote(fveNavLo, fveNavHi);


    var note = document.getElementById('fveLimitNote');
    if (note) {
      var txt = '';
      if (r.fveOmezeni === 'max') {
        txt = 'Podle spotřeby by byl vhodný výkon asi ' + Math.round(r.vykonIdeal) + ' kWp, NZÚ ale umožňuje nejvýše ' + KALK.NZU.MAX_KWP_NA_BYT + ' kWp na byt, tedy ' + Math.round(r.vykonMax) + ' kWp.';
      } else if (r.fveOmezeni === 'min') {
        txt = 'Podle spotřeby by stačil menší systém, NZÚ vyžaduje nejméně ' + KALK.NZU.MIN_KWP + ' kWp.';
      }
      note.textContent = txt;
      note.hidden = !txt;
    }
  }

  // Záporná úspora čerpadla: popisek „Roční navýšení nákladů“, číslo kladné a šedé (bez dvojího mínus a limetky)
  function tcUsporaLabel(neg) {
    var big = document.getElementById('tcUspora');
    var lab = big && big.closest('.kalk-result-box') && big.closest('.kalk-result-box').querySelector('.kalk-result-label');
    if (lab) lab.textContent = neg ? 'Roční navýšení nákladů' : 'Orientační roční úspora';
    if (big) big.classList.toggle('is-negative', !!neg);
  }

  function renderPanel3() {
    var r = results;
    var f1 = function (v) { return v.toFixed(1).replace('.', ','); };
    var inv = r.tc_investice;
    var iv = fmtThousandsRange(inv.lo, inv.hi);
    setText('tcInvestice', iv.text);
    var u2 = document.querySelector('#tcInvestice + .kalk-result-unit'); if (u2) u2.textContent = iv.unit;

    // Spotřeba elektřiny TČ: odhad s širším rozpětím
    var mwh = r.tc_el_kwh / 1000, rn = KALK.ROZPETI_NEVIM;
    setText('tcSpotreba', nf(Math.round(mwh * (1 - rn))) + NB + '–' + NB + nf(Math.round(mwh * (1 + rn))));

    // Výsledky se ukážou při jakémkoli zadaném nákladu. Když je provoz TČ dražší než dnešní teplo, úspora je záporná.
    var zadano = r.tcZnamo, u = r.uspora_tc;
    var plus = zadano && u > 0 && inv.mid / u <= 100;
    var prompt = document.getElementById('tcPrompt');
    show(document.getElementById('tcCostBlock'), zadano);
    show(document.getElementById('tcLineBlock'), plus);
    var uEl = document.querySelector('#tcUspora + .kalk-result-unit');
    if (zadano) {
      var neg = u < 0, au = Math.abs(u);
      var us = fmtThousandsRange(au * (1 - RP), au * (1 + RP));
      setText('tcUspora', us.text);
      if (uEl) uEl.textContent = us.unit;
      tcUsporaLabel(neg);
      setText('tcNavratnost', plus ? navRange(inv.lo / (u * (1 + RP)), inv.hi / (u * (1 - RP))) : '—');
      var mx = Math.max(r.naklady_dnes, r.naklady_tc);
      [['tcCfDnes', r.naklady_dnes], ['tcCfTc', r.naklady_tc]].forEach(function (x) {
        var el = document.getElementById(x[0]);
        if (el) el.style.width = Math.max(2, x[1] / mx * 100) + '%';
        setText(x[0] + 'Val', fmtRound(x[1]));
      });
      setText('tcCfNote', 'Provoz tepelného čerpadla je počítaný za cenu elektřiny ze sítě ' + String(state.fveCenaEl).replace('.', ',') + ' Kč/kWh.');
      if (plus) {
        var tcLo = inv.lo / (u * (1 + RP)), tcHi = inv.hi / (u * (1 - RP));
        lineData.tcLine = { uLo: u * (1 - RP), uHi: u * (1 + RP), invLo: inv.lo, invHi: inv.hi, navLo: tcLo, navHi: tcHi };
        drawLine('tcLine');
        var ln = document.getElementById('tcLineNote');
        if (ln) ln.innerHTML = lineNote(tcLo, tcHi);
        show(prompt, false);
      } else {
        setText('tcPrompt', u < 0
          ? 'Při těchto nákladech by provoz tepelného čerpadla vyšel dráž než dnešní teplo asi o ' + fmtRound(-u) + ' ročně, investice se z úspory nevrátí. Úspora by vznikla při vyšších dnešních nákladech nebo levnější elektřině.'
          : 'Úspora je tak malá, že by se investice nevrátila ani za 100 let. Úspora by byla výraznější při vyšších dnešních nákladech nebo levnější elektřině.');
        show(prompt, true);
      }
    } else {
      setText('tcUspora', '—');
      tcUsporaLabel(false);
      setText('tcNavratnost', '—');
      if (uEl) uEl.textContent = 'tis. Kč';
      setText('tcPrompt', 'Zadejte roční náklady na teplo a TUV, které dnes platíte, a spočítáme úsporu a návratnost.');
      show(prompt, true);
    }

    var ta = document.getElementById('tcAssumeNote');
    if (ta) ta.innerHTML = '<strong>Odhad:</strong> spotřeba tepla ' + nf(r.teplo_na_byt) + ' kWh na byt a rok, účinnost čerpadla (<a href="slovnik.html#term-cop">COP</a>) ' +
      String(KALK.TC_COP).replace('.', ',') + ' (z 1 kWh elektřiny asi ' + String(KALK.TC_COP).replace('.', ',') + ' kWh tepla), investice ' + nf(Math.round(inv.naBytLo / 1000)) + '–' + nf(Math.round(inv.naBytHi / 1000)) +
      ' tis. Kč na byt včetně DPH 12 %. Přesná čísla určí nabídky dodavatelů.';
    var un = document.getElementById('tcUverNote');
    if (un) un.innerHTML = 'Bezúročný úvěr z programu Nová zelená úsporám (<a href="slovnik.html#term-nzu">NZÚ</a>) vychází asi na ' + fmtRound(r.tc_uver) + ' na ' + r.tc_splatnost + ' let, tedy splátka asi ' +
      fmtRound(r.tc_splatka_mes) + ' měsíčně. Limit je ' + nf(KALK.NZU_TC.UVER_NA_BYT) + ' Kč na byt pro tepelné čerpadlo vzduch-voda.';
    var sn = document.getElementById('tcSpotrebaNote');
    if (sn) sn.textContent = 'Tepelné čerpadlo spotřebuje asi ' + nf(Math.round(mwh)) + ' MWh elektřiny ročně, dům dnes asi ' + nf(Math.round(state.spotreba / 1000)) +
      ' MWh. Může být potřeba vyšší příkon přípojky, ověřte to u distributora. Elektřina z FVE může provoz ještě snížit, to je započteno v kroku FVE.';
  }

  // Záporná úspora oken (stejné chování jako u čerpadla): popisek „Roční navýšení nákladů“, číslo šedé
  function zatUsporaLabel(neg) {
    var big = document.getElementById('zatUspora');
    var lab = big && big.closest('.kalk-result-box') && big.closest('.kalk-result-box').querySelector('.kalk-result-label');
    if (lab) lab.textContent = neg ? 'Roční navýšení nákladů' : 'Orientační roční úspora';
    if (big) big.classList.toggle('is-negative', !!neg);
  }

  function renderPanel4() {
    var r = results;
    var f1 = function (v) { return v.toFixed(1).replace('.', ','); };
    var inv = r.zat_investice;
    var iv = fmtThousandsRange(inv.lo, inv.hi);
    setText('zatInvestice', iv.text);
    var u2 = document.querySelector('#zatInvestice + .kalk-result-unit'); if (u2) u2.textContent = iv.unit;

    var znamo = r.tcZnamo && r.uspora_zat_hi > 0;
    show(document.getElementById('zatPrompt'), !r.tcZnamo);
    show(document.getElementById('zatCostBlock'), znamo);
    var uEl = document.querySelector('#zatUspora + .kalk-result-unit');
    if (znamo) {
      zatUsporaLabel(false);
      var us = fmtThousandsRange(r.uspora_zat_lo, r.uspora_zat_hi);
      setText('zatUspora', us.text);
      if (uEl) uEl.textContent = us.unit;
      var st = KALK.OKNA_USPORA[state.zatStav] || KALK.OKNA_USPORA.stara;
      setText('zatSnizeni', Math.round(st.lo * 100) + NB + '–' + NB + Math.round(st.hi * 100));
      setText('zatNavratnost', navRange(inv.lo / r.uspora_zat_hi, r.uspora_zat_lo > 0 ? inv.hi / r.uspora_zat_lo : Infinity));

      // S vybraným čerpadlem jsou tři pruhy: dnešní náklady, po čerpadle, po výměně oken
      var withTc = !!state.selected.tc;
      var lo = r.zakladZat - r.uspora_zatepleni;
      var hi = Math.max(r.zakladZat, withTc ? r.naklady_dnes : 0);
      [['zatCf0', r.naklady_dnes], ['zatCfDnes', r.zakladZat], ['zatCfPo', lo]].forEach(function (x) {
        var el = document.getElementById(x[0]);
        if (el) el.style.width = Math.max(2, x[1] / hi * 100) + '%';
        setText(x[0] + 'Val', fmtRound(x[1]));
      });
      show(document.getElementById('zatCfRow0'), withTc);
      show(document.getElementById('zatCfNote'), withTc);
      setText('zatCfDnesLabel', withTc ? 'Po tepelném čerpadle' : 'Dnes');
    } else {
      // Záporná úspora: stejně jako u čerpadla „Roční navýšení nákladů“, kladné šedé číslo
      var negZ = r.tcZnamo && r.uspora_zat_hi < 0;
      if (negZ) {
        var az = fmtThousandsRange(Math.abs(r.uspora_zat_hi), Math.abs(r.uspora_zat_lo));
        setText('zatUspora', az.text);
        if (uEl) uEl.textContent = az.unit;
      } else {
        setText('zatUspora', '—');
        if (uEl) uEl.textContent = 'tis. Kč';
      }
      zatUsporaLabel(negZ);
      setText('zatSnizeni', '—');
      setText('zatNavratnost', '—');
      if (r.tcZnamo) {
        setText('zatPrompt', 'Při zadaných nákladech by výměna oken úsporu nepřinesla. Zkuste upravit náklady nebo stav oken.');
        show(document.getElementById('zatPrompt'), true);
      } else {
        setText('zatPrompt', 'Zadejte roční náklady na teplo a TUV, které dnes platíte, a spočítáme úsporu a návratnost.');
      }
    }

    var un = document.getElementById('zatUverNote');
    if (un) un.innerHTML = 'Bezúročný úvěr z programu Nová zelená úsporám (<a href="slovnik.html#term-nzu">NZÚ</a>) vychází asi na ' + fmtRound(r.zat_uver) + ' na ' + r.zat_splatnost + ' let, tedy splátka asi ' +
      fmtRound(r.zat_splatka_mes) + ' měsíčně. NZÚ podporuje výměnu oken až do ' + nf(KALK.OKNA_NZU_KC_M2) + ' Kč/m² a nová okna musí mít součinitel prostupu tepla (<a href="slovnik.html#term-uw">Uw</a>) nejvýše 0,90 W/m²K; čím nižší číslo, tím lépe okno izoluje.';
    var an = document.getElementById('zatAssumeNote');
    var stOkna = KALK.OKNA_USPORA[state.zatStav] || KALK.OKNA_USPORA.stara;
    if (an) an.innerHTML = '<strong>Odhad:</strong> plocha oken a dveří ' + nf(r.plocha_byt) + ' m² na byt, cena ' + nf(Math.round(KALK.OKNA_CENA_M2.lo * KALK.DPH_SNIZENA / 10) * 10) + '–' + nf(Math.round(KALK.OKNA_CENA_M2.hi * KALK.DPH_SNIZENA / 10) * 10) +
      ' Kč/m² včetně montáže a DPH 12 %, úspora ' + Math.round(stOkna.lo * 100) + '–' + Math.round(stOkna.hi * 100) + ' % nákladů na teplo. Přesná čísla určí nabídky.';
  }

  function renderPanel5() {
    var r = results, pl = r.plan, byKey = {};
    pl.rows.forEach(function (rw) { byKey[rw.key] = rw; });
    var f1 = function (v) { return v.toFixed(1).replace('.', ','); };
    function kc(lo, hi) { var x = rangeSigned(lo, hi); return x.text + NB + x.unit; }
    function navText(n) { return n ? navRange(n.lo, n.hi) + NB + 'let' : '—'; }

    // Čtyři hlavní čísla
    var us = rangeSigned(pl.us.lo, pl.us.hi), iv = fmtThousandsRange(pl.inv.lo, pl.inv.hi);
    setText('sumUspora', pl.rows.length ? us.text : '—');
    var heroMinus = pl.rows.length && pl.us.lo < 0;
    ['sumUspora', 'sumByt'].forEach(function (hid) { var he = document.getElementById(hid); if (he) he.classList.toggle('is-negative', !!heroMinus); });
    setText('sumInvest', iv.text);
    var uu = document.querySelector('#sumUspora + .kalk-result-unit'); if (uu) uu.textContent = us.unit;
    var iu = document.querySelector('#sumInvest + .kalk-result-unit'); if (iu) iu.textContent = iv.unit;
    var btLo = pl.naBytMes.lo, btHi = pl.naBytMes.hi;
    var bt;
    if (Math.max(Math.abs(btLo), Math.abs(btHi)) < 1000) {
      var kcv = function (v) { return (v < 0 ? '−' : '') + nf(Math.abs(rnd(v, 10))); };
      bt = { text: kcv(btLo) + NB + '–' + NB + kcv(btHi), unit: 'Kč' };
    } else {
      bt = rangeSigned(rnd(btLo, 100), rnd(btHi, 100));
    }
    setText('sumByt', pl.rows.length ? bt.text : '—');
    var bu = document.querySelector('#sumByt + .kalk-result-unit'); if (bu) bu.textContent = bt.unit;
    setText('sumNavratnost', pl.nav ? navRange(pl.nav.lo, pl.nav.hi) : '—');
    var pr = document.getElementById('sumPrompt');
    if (pr) {
      pr.textContent = pl.vseZname ? '' : 'Do úspory a návratnosti se nepočítá teplo a okna. Zadejte roční náklady na teplo a TUV v kroku Teplo a TUV nebo Okna a dveře.';
      show(pr, !pl.vseZname);
    }

    renderWaterfall(r, pl);

    // Rozpis po krocích
    var ids = { jom: 'Jom', fve: 'Fve', tc: 'Tc', zat: 'Zat' };
    Object.keys(ids).forEach(function (k) {
      var rw = byKey[k], id = ids[k];
      show(document.getElementById('sumRow' + id), !!rw);
      if (!rw) return;
      // Krok v minusu se vykreslí šedě
      var minus = !!(rw.us && rw.us.hi <= 0);
      var row = document.getElementById('sumRow' + id);
      if (row) row.classList.toggle('is-negative', minus);
      setText('sumInv' + id, kc(rw.inv.lo, rw.inv.hi));
      setText('sumUs' + id, rw.us ? kc(rw.us.lo, rw.us.hi) : '—');
      setText('sumNav' + id, navText(rw.nav));
    });
    var rowFve = byKey.fve && document.querySelector('#sumRowFve td');
    if (rowFve) rowFve.textContent = byKey.fve.name;
    setText('sumInvTotal', kc(pl.inv.lo, pl.inv.hi));
    setText('sumUsTotal', pl.rows.length ? kc(pl.us.lo, pl.us.hi) : '—');
    setText('sumNavTotal', navText(pl.nav));

    // Financování: úvěr NZÚ proti měsíční úspoře
    var fin = document.getElementById('sumFinBlock');
    show(fin, pl.uver > 0);
    var finBars = fin && fin.querySelector('.kalk-hbars');
    show(finBars, pl.vseZname);
    if (pl.uver > 0) {
      var uMes = (pl.us.lo + pl.us.hi) / 2 / 12, sMes = pl.splatka_mes, zb = uMes - sMes, mx = Math.max(uMes, sMes, 1);
      [['sumCfUsp', uMes], ['sumCfSpl', sMes], ['sumCfZb', Math.max(zb, 0)]].forEach(function (x) {
        var el = document.getElementById(x[0]);
        if (el) el.style.width = Math.max(2, x[1] / mx * 100) + '%';
        setText(x[0] + 'Val', fmtRound(x[1]));
      });
      // Měsíční rozdíl v minusu: šedý pruh a záporná hodnota
      var zbMinus = zb < 0, zbFill = document.getElementById('sumCfZb'), zbRow = zbFill && zbFill.closest('.kalk-hbar-row');
      if (zbFill) { zbFill.classList.toggle('kalk-hbar-fill--lime', !zbMinus); zbFill.classList.toggle('kalk-hbar-fill--dim', zbMinus); }
      if (zbRow) zbRow.classList.toggle('is-negative', zbMinus);
      if (zbMinus) setText('sumCfZbVal', '−' + fmtRound(-zb));
      var note = document.getElementById('sumCfNote');
      if (note) {
        note.innerHTML = '<strong>Úvěr NZÚ ' + fmtRound(pl.uver) + ' na ' + pl.splatnost + ' let, splátka ' + fmtRound(sMes) + ' měsíčně, tedy asi ' +
          fmtRound(sMes / state.byty) + ' na byt.</strong> ' +
          (!pl.vseZname ? '' : zb >= 0 ? 'Úspora splátku pokryje a zbývá asi ' + fmtRound(zb) + ' měsíčně. ' : 'Úspora splátku nepokryje, chybí asi ' + fmtRound(-zb) + ' měsíčně. ') +
          (pl.uverOmezen ? 'Úvěr je omezen stropem ' + nf(KALK.NZU_DILCI_NA_BYT) + ' Kč na byt pro dílčí opatření, zbytek investice je třeba financovat jinak. ' : '') +
          'JOM se z úvěru neplatí.' +
          ' NZÚ je program Nová zelená úsporám.';
      }
    }
  }

  // ── Souhrn: vodopád ročních nákladů domu ──────────────────
  // Elektřina dnes = spotřeba × cena elektřiny + stálé měsíční platby za jistič a provoz měření v bytech
  // (sazba D02d, jistič 1×25 A, s DPH). Teplo = náklady, které uživatel zadal. Každý krok ubírá svou
  // střední úsporu z nákladů, které zbyly po předchozím kroku (stejná čísla jako v rozpisu).
  function stalePlatby(byty) {
    var c = (typeof KALK_CENY !== 'undefined') ? KALK_CENY : null;
    var t = c && c.distribuce && c.distribuce.cez && c.distribuce.cez.D02d;
    if (!t || t.jistic['1x25'] == null) return 0;
    return byty * (t.jistic['1x25'] + c.provoz_nesitove_infrastruktury) * 12 * KALK.DPH;
  }
  function renderWaterfall(r, pl) {
    var box = document.getElementById('sumWf'), note = document.getElementById('sumWfNote');
    var block = document.getElementById('sumWfBlock');
    show(block, pl.rows.length > 0);
    if (!box || !pl.rows.length) return;
    var elektrina = state.spotreba * (state.fveCenaEl || KALK.FVE_CENA_EL) + stalePlatby(state.byty);
    var teplo = r.tcZnamo ? r.naklady_dnes : 0;
    var start = elektrina + teplo;
    var NAMES = { jom: 'JOM', fve: null, tc: 'Tepelné čerpadlo', zat: 'Okna a dveře' };
    var steps = [], chybiTeplo = false, cur = start, peak = start;
    pl.rows.forEach(function (rw) {
      if (!rw.us) { chybiTeplo = true; return; }
      var s = (rw.us.lo + rw.us.hi) / 2, prev = cur;
      cur = prev - s;
      if (cur > peak) peak = cur;
      steps.push({ name: NAMES[rw.key] || rw.name, prev: prev, next: cur, s: s });
    });
    var mx = Math.max(peak, 1);
    function pct(v) { return Math.max(0, v) / mx * 100; }
    function row(label, from, to, cls, val) {
      var lo = Math.min(from, to), w = Math.max(0.6, pct(Math.max(from, to)) - pct(lo));
      return '<div class="kalk-hbar-row"><span class="kalk-hbar-label">' + label + '</span>' +
        '<div class="kalk-hbar-track"><div class="kalk-hbar-fill ' + cls + '" style="margin-left:' + pct(lo).toFixed(2) + '%;width:' + w.toFixed(2) + '%"></div></div>' +
        '<span class="kalk-hbar-val">' + val + '</span></div>';
    }
    var html = row(teplo ? 'Dnes (elektřina a teplo)' : 'Dnes (elektřina)', 0, start, 'kalk-hbar-fill--dim', fmtRound(start));
    steps.forEach(function (st) {
      var up = st.s < 0;
      html += row((up ? '+ ' : '− ') + st.name, st.prev, st.next, up ? 'kalk-hbar-fill--dim' : 'kalk-hbar-fill--lime',
        (up ? '+' : '−') + fmtRound(Math.abs(st.s)));
    });
    html += row('Po vybraných krocích', 0, cur, 'kalk-hbar-fill--mid', fmtRound(cur));
    box.innerHTML = html;
    var pctUspora = start > 0 ? Math.round((start - cur) / start * 100) : 0;
    box.setAttribute('aria-label', 'Graf: roční náklady domu na energie dnes ' + fmtRound(start) + ', po vybraných krocích ' + fmtRound(cur) + ', o ' + pctUspora + ' % méně');
    if (note) {
      note.innerHTML = '<strong>Po vybraných krocích zaplatí dům za energie asi ' + fmtRound(cur) + ' ročně místo ' + fmtRound(start) +
        ', tedy o ' + pctUspora + NB + '% méně.</strong> Každý krok se počítá z nákladů, které zbyly po předchozím kroku. ' +
        'Elektřina je odhad ze spotřeby domu, ceny elektřiny a stálých měsíčních plateb za jističe v bytech' +
        (teplo ? ', teplo jsou náklady, které jste zadali' : '') + '. Graf ukazuje střední odhad, bez změn cen energií.' +
        (chybiTeplo ? ' Teplo a okna v grafu nejsou, chybí roční náklady na teplo a TUV.' : '');
    }
  }

  // ── Navigation ────────────────────────────────────────────
  function renderStep(key, animate) {
    var renderers = {
      jom: renderPanel1, fve: renderPanel2, tc: renderPanel3,
      zatepleni: renderPanel4, summary: function () { renderPanel5(); }
    };
    if (renderers[key]) renderers[key]();
  }

  // Změna v „Upřesnit výpočet“ se ihned promítne do výsledků aktuálního kroku
  function recalcCurrent() {
    var active = document.querySelector('#kalkStepper .kalk-step-item.is-active');
    var key = active && active.getAttribute('data-step-key');
    if (!key || key === 'basic') return;
    readDetailInputs();
    calculate();
    renderStep(key, false);
    announce(document.querySelector('.kalk-panel:not([hidden])'));
  }
  // Pole se stejným významem ve dvou krocích se drží shodná
[['tcNakladyInput', 'zatNakladyInput'], ['fveCenaEl', 'tcCenaEl']].forEach(function (pair) {
  var a = document.getElementById(pair[0]), b = document.getElementById(pair[1]);
  if (!a || !b) return;
  a.addEventListener('input', function () { b.value = a.value; });
  b.addEventListener('input', function () { a.value = b.value; });
});
// Křížek pro vymazání pole: ukáže se jen při zaostření a vyplněné hodnotě
document.querySelectorAll('.kalk-input-wrap').forEach(function (wrap) {
  var input = wrap.querySelector('input'), btn = wrap.querySelector('.kalk-input-clear');
  if (!input || !btn) return;
  function sync() { btn.classList.toggle('has-value', input.value !== ''); }
  input.addEventListener('input', sync);
  input.addEventListener('focus', sync);
  btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
  btn.addEventListener('click', function () {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    sync();
    input.focus();
  });
});
// Po opuštění pole se číslo přeformátuje (700 000, 6,5); spárované pole se přepíše stejnou hodnotou
(function () {
  var cfg = { tcNakladyInput: 'int', zatNakladyInput: 'int', kalkSpotreba: 'int', fveCenaEl: 'dec', tcCenaEl: 'dec', zatPlochaInput: 'dec' };
  var partner = { tcNakladyInput: 'zatNakladyInput', zatNakladyInput: 'tcNakladyInput', fveCenaEl: 'tcCenaEl', tcCenaEl: 'fveCenaEl' };
  Object.keys(cfg).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', function () {
      var n = parseNum(el.value);
      if (!isFinite(n) || el.value.trim() === '') return;
      el.value = cfg[id] === 'int' ? nf(Math.round(n)) : String(Math.round(n * 100) / 100).replace('.', ',');
      var pe = partner[id] && document.getElementById(partner[id]);
      if (pe) pe.value = el.value;
    });
  });
})();
['fveOrientace', 'fveCenaEl', 'tcCenaEl', 'tcNakladyInput', 'zatNakladyInput', 'zatStav', 'tcDum', 'zatPlochaInput'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.addEventListener('input', recalcCurrent); el.addEventListener('change', recalcCurrent); }
  });

  function showStep(key) {
    readDetailInputs();
    calculate();

    document.querySelectorAll('.kalk-panel').forEach(function (p) { p.hidden = true; });

    var meta = STEP_META[key];
    var panel = document.getElementById(meta.panelId);
    if (panel) panel.hidden = false;

    renderStep(key, true);

    updateStepper(key);

    var wizard = document.getElementById('kalkulacka');
    if (wizard) wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    focusHeading(panel);
    announce(panel);
  }

  // Po změně kroku se zaostření přesune na nadpis nového kroku (klávesnice a čtečka nezačínají od začátku stránky)
  function focusHeading(panel) {
    var hd = panel && panel.querySelector('h2');
    if (!hd) return;
    hd.setAttribute('tabindex', '-1');
    hd.focus({ preventScroll: true });
  }

  // Čtečka: po přepočtu se (se zpožděním) přečtou čtyři hlavní čísla aktuálního kroku
  var announceTimer = null;
  function announce(panel) {
    var live = document.getElementById('kalkLive');
    if (!live || !panel) return;
    clearTimeout(announceTimer);
    announceTimer = setTimeout(function () {
      var parts = [];
      panel.querySelectorAll('.kalk-result-box').forEach(function (box) {
        var label = box.querySelector('.kalk-result-label'), big = box.querySelector('.kalk-result-big'), unit = box.querySelector('.kalk-result-unit');
        if (!label || !big) return;
        parts.push((label.textContent.trim() + ': ' + big.textContent.replace(/\s+/g, ' ').trim() + (unit ? ' ' + unit.textContent.trim() : '')).replace(/\.+$/, ''));
      });
      live.textContent = '';
      live.textContent = parts.join('. ');
    }, 600);
  }

  function goNext(currentKey) {
    var seq = buildSequence();
    var idx = seq.indexOf(currentKey);
    if (idx >= 0 && idx < seq.length - 1) showStep(seq[idx + 1]);
  }

  function goBack(currentKey) {
    var seq = buildSequence();
    var idx = seq.indexOf(currentKey);
    if (idx > 0) showStep(seq[idx - 1]);
  }

  function showSelectScreen() {
    document.getElementById('kalkStepper').style.display = 'none';
    document.querySelectorAll('.kalk-panel').forEach(function (p) { p.hidden = true; });
    var sel = document.getElementById('kalkPanelSelect');
    if (sel) sel.hidden = false;
    var st = document.getElementById('co-chcete-resit');
    if (st) { st.setAttribute('tabindex', '-1'); st.focus({ preventScroll: true }); }
  }

  // ── Init ──────────────────────────────────────────────────
  document.getElementById('kalkStepper').style.display = 'none';
  document.querySelectorAll('.kalk-panel').forEach(function (p) { p.hidden = true; });
  var selectPanel = document.getElementById('kalkPanelSelect');
  if (selectPanel) selectPanel.hidden = false;

  // Výběrové karty: stav drží nativní zaškrtávací pole (funguje myší, dotykem i klávesnicí)
  document.querySelectorAll('.kalk-select-card').forEach(function (card) {
    var cb = card.querySelector('input[type=checkbox]');
    cb.addEventListener('change', function () {
      state.selected[card.dataset.key] = cb.checked;
      card.classList.toggle('is-selected', cb.checked);
      var anySelected = ['jom','fve','tc','zatepleni'].some(function (k) { return state.selected[k]; });
      var nextBtn = document.getElementById('kalkSelectNext');
      if (nextBtn) nextBtn.disabled = !anySelected;
    });
  });

  // Předvyplnění z odkazu (mini kalkulačka, JOM dotazník, FVE průvodce): počet bytů, spotřeba, orientace a vybraná opatření
  (function () {
    var qs = location.search;
    if (!qs) { try { qs = sessionStorage.getItem('eh_prefill') || ''; } catch (err) {} }
    try { sessionStorage.removeItem('eh_prefill'); } catch (err) {}
    var p = KALK.nactiParametry(qs);
    if (!p) return;
    var bytyEl = document.getElementById('kalkByty'), spotEl = document.getElementById('kalkSpotreba'), sel = document.getElementById('fveOrientace');
    if (p.byty && bytyEl) bytyEl.value = p.byty;
    if (p.spotreba && spotEl) spotEl.value = nf(p.spotreba);
    if (p.orientace && sel) { sel.value = p.orientace; state.orientTouched = true; }
    p.reseni.forEach(function (key) {
      var card = document.querySelector('.kalk-select-card[data-key="' + key + '"]');
      var cb = card && card.querySelector('input[type=checkbox]');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    var note = document.getElementById('kalkPrefillNote');
    if (note && (p.byty || p.spotreba)) note.hidden = false;
  })();

  // Pokračovat ze selection → základní údaje
  var selectNext = document.getElementById('kalkSelectNext');
  if (selectNext) {
    selectNext.addEventListener('click', function () {
      buildStepper();
      document.getElementById('kalkStepper').style.display = '';
      if (selectPanel) selectPanel.hidden = true;
      showStep('basic');
    });
  }

  // Zpět na selection z kalkPanel0
  var backToSelect = document.getElementById('kalkBackToSelect');
  if (backToSelect) {
    backToSelect.addEventListener('click', showSelectScreen);
  }

  // Chybová hláška u pole (aria-invalid + popis pro čtečku), mizí při opravě hodnoty
  function setFieldError(inputId, errId, msg) {
    var input = document.getElementById(inputId), err = document.getElementById(errId);
    if (!input || !err) return;
    if (msg) {
      err.textContent = msg; err.hidden = false;
      input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', errId);
    } else {
      err.textContent = ''; err.hidden = true;
      input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby');
    }
  }
  ['kalkByty', 'kalkSpotreba'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function () { setFieldError(id, id + 'Err', ''); });
  });

  // Ověří a uloží základní údaje; při chybě ukáže hlášku a zaostří chybné pole
  function applyBasic() {
    var bytyEl    = document.getElementById('kalkByty');
    var spotEl    = document.getElementById('kalkSpotreba');

    var byty     = parseInt(bytyEl && bytyEl.value, 10);
    var spotreba = Math.round(parseNum(spotEl && spotEl.value));

    setFieldError('kalkByty', 'kalkBytyErr', '');
    setFieldError('kalkSpotreba', 'kalkSpotrebaErr', '');
    if (!byty || byty < KALK.BYTY_MIN || byty > KALK.BYTY_MAX) {
      setFieldError('kalkByty', 'kalkBytyErr', byty > KALK.BYTY_MAX
        ? 'Kalkulačka počítá domy do ' + KALK.BYTY_MAX + ' bytů.'
        : 'Zadejte počet bytů, nejméně ' + KALK.BYTY_MIN + '.');
      bytyEl && bytyEl.focus(); return false;
    }
    // Spotřeba je nepovinná: bez zadání se odhadne z počtu bytů
    if (spotEl && spotEl.value && (!spotreba || spotreba < 1000 || spotreba > 2000000)) {
      setFieldError('kalkSpotreba', 'kalkSpotrebaErr', 'Zadejte roční spotřebu od 1 000 do 2 000 000 kWh, případně pole nechte prázdné.');
      spotEl.focus(); return false;
    }

    state.byty     = byty;
    state.spotrebaOdhad = !spotreba;
    state.spotreba = spotreba || byty * KALK.SPOTREBA_NA_BYT;

    calculate();
    return true;
  }

  // Start (Spočítat úspory) → první vybraný krok
  var startBtn = document.getElementById('kalkStart');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      if (applyBasic()) goNext('basic');
    });
  }

  // Kliknutí na krok v horní liště → přejde na daný krok
  var stepperEl = document.getElementById('kalkStepper');
  var submitted = false;  // po odeslání poptávky se do kroků nedá vracet
  function goToStepFromStepper(item) {
    if (submitted) return;
    var key = item && item.getAttribute('data-step-key');
    if (!key) return;
    var active = stepperEl.querySelector('.kalk-step-item.is-active');
    var current = active && active.getAttribute('data-step-key');
    if (key === current) return;
    if (current === 'basic' && !applyBasic()) return;
    showStep(key);
  }
  if (stepperEl) {
    stepperEl.addEventListener('click', function (e) {
      goToStepFromStepper(e.target.closest('.kalk-step-item'));
    });
    stepperEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var item = e.target.closest('.kalk-step-item');
      if (!item) return;
      e.preventDefault();
      goToStepFromStepper(item);
    });
  }

  // Next/Back buttony na panelech se step-key
  document.querySelectorAll('.kalk-panel[data-step-key] .kalk-btn-next').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = btn.closest('[data-step-key]');
      if (panel) goNext(panel.dataset.stepKey);
    });
  });

  document.querySelectorAll('.kalk-panel[data-step-key] .kalk-btn-back').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = btn.closest('[data-step-key]');
      if (panel) goBack(panel.dataset.stepKey);
    });
  });

  // Tlačítko „Stáhnout výsledky (PDF)“ na děkovné stránce (knihovna se načte až po kliknutí)
  function initPdfButton(ulozeno, kontakt) {
    var btn = document.getElementById('kalkPdfBtn'), err = document.getElementById('kalkPdfError');
    if (!btn || typeof KALK_PDF === 'undefined') return;
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = 'Připravuji PDF…';
      if (err) err.hidden = true;
      KALK_PDF.stahnout(ulozeno, kontakt).catch(function () {
        if (err) err.hidden = false;
      }).then(function () {
        btn.disabled = false; btn.textContent = label;
      });
    });
  }

  // Form submit
  var form = document.getElementById('kalkForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ui = EH.formUi(form);
      var hp = form.querySelector('input[name="website"]');
      var consentEl = document.getElementById('kalkConsentText');
      var ulozeno = KALK_ENGINE.exportUlozeni(lastInp, results, {
        spotrebaOdhad: !!state.spotrebaOdhad,
        orientKlic: state.fveOrientaceKlic,
        orientTouched: !!state.orientTouched
      });
      var kontaktPdf = { name: EH.val('kalkJmeno'), email: EH.val('kalkEmail'), phone: EH.val('kalkTel') };
      ui.start();
      EH.submitForm('savings', {
        name: EH.val('kalkJmeno'),
        email: EH.val('kalkEmail'),
        phone: EH.val('kalkTel'),
        consent: document.getElementById('kalkConsent').checked,
        consent_text: consentEl ? consentEl.textContent.trim() : '',
        vstupy: ulozeno.inputs,
        vysledek: ulozeno.result,
        sloupce: ulozeno.sloupce,
        summary: ulozeno.summary
      }, hp && hp.value).then(function () {
        submitted = true;
        initPdfButton(ulozeno, kontaktPdf);
        ui.done();
        document.getElementById('kalkPanel5').hidden = true;
        document.getElementById('kalkThankyou').hidden = false;
        var ty = document.querySelector('#kalkThankyou .kalk-thankyou__title'); if (ty) { ty.setAttribute('tabindex', '-1'); ty.focus(); }
        var stepper = document.getElementById('kalkStepper');
        if (stepper) stepper.style.display = 'none';
      }).catch(function (err) {
        ui.fail(err.message);
      });
    });
  }

})();
