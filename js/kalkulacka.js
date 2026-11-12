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
    if (cenaEl)  state.fveCenaEl      = parseNum(cenaEl.value) || KALK.FVE_CENA_EL;
    if (tcRuc) state.tcNakladyRucne = Math.round(parseNum(tcRuc.value)) || 0;
    if (zatStav) state.zatStav        = zatStav.value || 'stara';
    if (tcDum)   state.domZateplen    = tcDum.value !== 'ne';
    var zatPl = document.getElementById('zatPlochaInput');
    if (zatPl) state.zatPlocha        = parseNum(zatPl.value) || 0;
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
  // Věta pod čárovým grafem: rozpětí návratnosti (stejný vzorec jako v souhrnu) a střední odhad, který graf ukazuje
  function lineNote(lo, hi, mid) {
    return '<strong>Investice se vrátí za ' + navRange(lo, hi) + ' roku.</strong> Graf ukazuje střední odhad, ' +
      mid.toFixed(1).replace('.', ',') + ' roku. Počítá se s konstantní úsporou, bez změn cen energií.';
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
  function calculate() {
    // Jedno pravidlo rozpětí: neznámé vstupy = odhadnutá spotřeba a nezměněná orientace střechy
    RP = KALK.rozpeti((state.spotrebaOdhad ? 1 : 0) + (state.orientTouched ? 0 : 1));
    state.rozpeti = RP;
    results = KALK_ENGINE.compute({
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
    });
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
    lineData.jomLine = { u: r.uspora_jom, inv: inv.mid };
    drawLine('jomLine');
    var note = document.getElementById('jomHbNote');
    if (note) note.innerHTML = lineNote(loY, hiY, inv.mid / r.uspora_jom);
  }

  // Čárový graf: nasbírané úspory v čase proti investici (SVG, barvy webu)
  var lineData = {};
  function shortKc(n) {
    return n >= 1e6 ? mil(n) + NB + 'mil.' : Math.round(n / 1000) + NB + 'tis.';
  }
  function drawLine(boxId) {
    var box = document.getElementById(boxId), d = lineData[boxId];
    if (!box || !d) return;
    var W = box.clientWidth || 560, H = 276;
    var m = { l: 62, r: 12, t: 10, b: 40 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var u = d.u, inv = d.inv;
    // Horizont grafu podle návratnosti: nejmenší „hezké“ číslo, které dá za bodem návratnosti rezervu
    var pbYears = u > 0 ? inv / u : Infinity;
    var YEARS = 50, cand = [5, 10, 15, 20, 25, 30, 40, 50];
    for (var ci = 0; ci < cand.length; ci++) { if (cand[ci] >= pbYears * 1.25) { YEARS = cand[ci]; break; } }
    var tickStep = YEARS <= 5 ? 1 : (YEARS <= 10 ? 2 : (YEARS <= 25 ? 5 : 10));
    var yMax = Math.max(inv, u * YEARS) * 1.08;
    var X = function (yr) { return m.l + yr / YEARS * iw; };
    var Y = function (v) { return m.t + ih - v / yMax * ih; };
    var out = '';

    // vodorovné čáry a popisky osy Y
    for (var i = 0; i <= 4; i++) {
      var v = yMax / 1.08 * i / 4, y = Y(v);
      out += '<line class="kalk-lc-grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '"/>';
      out += '<text class="kalk-lc-tick" x="' + (m.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + (i === 0 ? '0' : shortKc(v)) + '</text>';
    }
    // osa X (roky)
    var ticks = [];
    for (var ty = 0; ty <= YEARS; ty += tickStep) ticks.push(ty);
    if (ticks[ticks.length - 1] !== YEARS) ticks.push(YEARS);
    ticks.forEach(function (yr) {
      out += '<text class="kalk-lc-tick" x="' + X(yr) + '" y="' + (H - 12) + '" text-anchor="' + (yr === 0 ? 'start' : yr === YEARS ? 'end' : 'middle') + '">' + (yr === YEARS ? yr + NB + 'let' : yr) + '</text>';
    });
    // investice (vodorovná přerušovaná čára)
    out += '<line class="kalk-lc-inv" x1="' + X(0) + '" x2="' + X(YEARS) + '" y1="' + Y(inv) + '" y2="' + Y(inv) + '"/>';
    out += '<text class="kalk-lc-label" x="' + (X(0) + 8) + '" y="' + (Y(inv) - 8) + '" text-anchor="start">Investice ' + shortKc(inv) + ' Kč</text>';
    // úspory (rostoucí čára)
    out += '<line class="kalk-lc-save" x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(YEARS) + '" y2="' + Y(u * YEARS) + '"/>';
    out += '<text class="kalk-lc-label kalk-lc-label--lime" x="' + X(YEARS) + '" y="' + (Y(u * YEARS) - 12) + '" text-anchor="end">Úspory za ' + YEARS + ' let ' + shortKc(u * YEARS) + ' Kč</text>';
    // bod návratnosti
    var pb = inv / u;
    if (pb <= YEARS) {
      out += '<line class="kalk-lc-drop" x1="' + X(pb) + '" x2="' + X(pb) + '" y1="' + Y(inv) + '" y2="' + Y(0) + '"/>';
      out += '<circle class="kalk-lc-dot" cx="' + X(pb) + '" cy="' + Y(inv) + '" r="5"/>';
      var ta = pb > YEARS * 0.6 ? 'end' : 'start', tx = X(pb) + (ta === 'end' ? -10 : 10);
      out += '<text class="kalk-lc-label" x="' + tx + '" y="' + (Y(0) - 8) + '" text-anchor="' + ta + '">Návratnost ' + pb.toFixed(1).replace('.', ',') + NB + 'roku</text>';
    }
    box.setAttribute('aria-label', 'Graf: investice ' + shortKc(inv) + ' Kč, úspory za ' + YEARS + ' let ' + shortKc(u * YEARS) + ' Kč' +
      (pbYears <= YEARS ? ', investice se vrátí asi za ' + pbYears.toFixed(1).replace('.', ',') + ' roku' : ', investice se v tomto období nevrátí'));
    box.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + out + '</svg>';
  }
  window.addEventListener('resize', function () {
    [['jomLine', 'kalkPanel1'], ['fveLine', 'kalkPanel2'], ['tcLine', 'kalkPanel3']].forEach(function (x) {
      var panel = document.getElementById(x[1]);
      if (panel && !panel.hidden) drawLine(x[0]);
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
        ' NZÚ je program Nová zelená úsporám (<a href="slovnik.html#term-nzu">slovník</a>).';
    }

    // Graf 2: kumulativní úspory proti investici
    lineData.fveLine = { u: total, inv: r.investice_fve };
    drawLine('fveLine');
    var ln = document.getElementById('fveLineNote');
    if (ln) ln.innerHTML = lineNote(fveNavLo, fveNavHi, r.investice_fve / total);


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
        lineData.tcLine = { u: u, inv: inv.mid };
        drawLine('tcLine');
        var ln = document.getElementById('tcLineNote');
        if (ln) ln.innerHTML = lineNote(inv.lo / (u * (1 + RP)), inv.hi / (u * (1 - RP)), inv.mid / u);
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

    // Pruhy a rozpis po krocích
    var ids = { jom: 'Jom', fve: 'Fve', tc: 'Tc', zat: 'Zat' };
    var maxHi = 1;
    pl.rows.forEach(function (rw) { if (rw.us && rw.us.hi > maxHi) maxHi = rw.us.hi; });
    Object.keys(ids).forEach(function (k) {
      var rw = byKey[k], id = ids[k];
      show(document.getElementById('sumHb' + id), !!rw);
      show(document.getElementById('sumRow' + id), !!rw);
      if (!rw) return;
      var fill = document.getElementById('sumFill' + id);
      if (fill) fill.style.width = (rw.us ? Math.max(2, rw.us.hi / maxHi * 100) : 0) + '%';
      // Krok v minusu se vykreslí šedě
      var minus = !!(rw.us && rw.us.hi <= 0);
      if (fill) { fill.classList.toggle('kalk-hbar-fill--lime', !minus); fill.classList.toggle('kalk-hbar-fill--dim', minus); }
      ['sumHb', 'sumRow'].forEach(function (pre) { var el = document.getElementById(pre + id); if (el) el.classList.toggle('is-negative', minus); });
      setText('sumVal' + id, rw.us ? kc(rw.us.lo, rw.us.hi) : '—');
      setText('sumInv' + id, kc(rw.inv.lo, rw.inv.hi));
      setText('sumUs' + id, rw.us ? kc(rw.us.lo, rw.us.hi) : '—');
      setText('sumNav' + id, navText(rw.nav));
    });
    var nameFve = byKey.fve && document.querySelector('#sumHbFve .kalk-hbar-label');
    if (nameFve) nameFve.textContent = byKey.fve.name;
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
          ' NZÚ je program Nová zelená úsporám (<a href="slovnik.html#term-nzu">slovník</a>).';
      }
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
  function goToStepFromStepper(item) {
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

  // Form submit
  var form = document.getElementById('kalkForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ui = EH.formUi(form);
      var hp = form.querySelector('input[name="website"]');
      var consentEl = document.getElementById('kalkConsentText');
      ui.start();
      EH.submitForm('savings', {
        name: EH.val('kalkJmeno'),
        email: EH.val('kalkEmail'),
        phone: EH.val('kalkTel'),
        consent: document.getElementById('kalkConsent').checked,
        consent_text: consentEl ? consentEl.textContent.trim() : '',
        inputs: Object.assign(JSON.parse(JSON.stringify(state)), { assumptions: KALK.predpoklady() }),
        result: JSON.parse(JSON.stringify(results))
      }, hp && hp.value).then(function () {
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
