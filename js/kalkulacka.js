(function () {

  var state = {
    byty: 0, spotreba: 0, strecha: 'medium',
    fveOrientace: 1.0,
    fveCenaEl: 5.0,
    tcNakladyRucne: 0,
    tcTypKoef: 1.0,
    zatFaktor: 0.40,
    period: 'rok',
    selected: { jom: false, fve: false, tc: false, zatepleni: false }
  };
  var results = {};

  var STEP_META = {
    basic:     { panelId: 'kalkPanel0', label: 'Základní údaje' },
    jom:       { panelId: 'kalkPanel1', label: 'JOM' },
    fve:       { panelId: 'kalkPanel2', label: 'FVE' },
    tc:        { panelId: 'kalkPanel3', label: 'TČ' },
    zatepleni: { panelId: 'kalkPanel4', label: 'Zateplení' },
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
  function readDetailInputs() {
    var orient  = document.getElementById('fveOrientace');
    var cenaEl  = document.getElementById('fveCenaEl');
    var tcTyp   = document.getElementById('tcTyp');
    var tcRuc   = document.getElementById('tcNakladyInput');
    var zatStav = document.getElementById('zatStav');

    if (orient)  state.fveOrientace   = parseFloat(orient.value)  || 1.0;
    if (cenaEl)  state.fveCenaEl      = parseFloat(cenaEl.value)  || 5.0;
    if (tcTyp)   state.tcTypKoef      = parseFloat(tcTyp.value)   || 1.0;
    if (tcRuc && tcRuc.value) state.tcNakladyRucne = parseInt(tcRuc.value, 10) || 0;
    if (zatStav) state.zatFaktor      = parseFloat(zatStav.value) || 0.40;
  }

  // ── Calculations ─────────────────────────────────────────
  function calculate() {
    var byty     = state.byty;
    var spotreba = state.spotreba;
    var strecha  = state.strecha;

    // JOM
    var uspora_jom    = byty * 2000;
    var naklady_bez   = byty * 8000;
    var naklady_s_jom = naklady_bez - uspora_jom;

    // FVE
    var vykonMap = { small: 20, medium: 40, large: 60 };
    var vykon    = vykonMap[strecha];
    var vyroba   = vykon * 950 * state.fveOrientace;
    var vlastni_bez_jom = Math.min(vyroba * 0.45, spotreba * 0.40);
    var vlastni_s_jom   = Math.min(vyroba * 0.65, spotreba * 0.65);
    var uspora_fve      = vlastni_s_jom * state.fveCenaEl;
    var investice_fve   = vykon * 50000;
    var navratnost_fve  = investice_fve / uspora_fve;
    var splatka         = investice_fve * 0.065;
    var pokryti         = Math.round(uspora_jom / splatka * 100);

    var podil_vlastni = Math.min(vlastni_s_jom / spotreba, 1);
    var cena_fve_mix  = parseFloat(((1 - podil_vlastni) * state.fveCenaEl).toFixed(2));

    // TČ
    var naklady_plynem    = state.tcNakladyRucne > 0
      ? state.tcNakladyRucne * state.tcTypKoef
      : byty * 30000 * state.tcTypKoef;
    var spotreba_tepla_tc = (byty * 15000) / 3.5;
    var naklady_tc_bez    = spotreba_tepla_tc * state.fveCenaEl;
    var naklady_tc_s      = spotreba_tepla_tc * cena_fve_mix;
    var uspora_tc         = naklady_plynem - naklady_tc_s;
    var uspora_fve_na_tc  = naklady_tc_bez - naklady_tc_s;

    // Zateplení
    var uspora_zatepleni = naklady_tc_s * state.zatFaktor;
    var naklady_po_zat   = naklady_tc_s * (1 - state.zatFaktor);

    // Celkem — pouze vybraná řešení
    var celkova_uspora =
      (state.selected.jom       ? uspora_jom       : 0) +
      (state.selected.fve       ? uspora_fve       : 0) +
      (state.selected.tc        ? uspora_tc        : 0) +
      (state.selected.zatepleni ? uspora_zatepleni : 0);

    results = {
      uspora_jom, naklady_bez, naklady_s_jom,
      vykon, vyroba, vlastni_bez_jom, vlastni_s_jom,
      uspora_fve, investice_fve, navratnost_fve, splatka, pokryti,
      cena_fve_mix, uspora_fve_na_tc,
      naklady_plynem, naklady_tc_bez, naklady_tc_s, uspora_tc,
      uspora_zatepleni, naklady_po_zat,
      celkova_uspora
    };
  }

  // ── Panel renderers ───────────────────────────────────────
  function renderPanel1() {
    var r = results;
    setText('jomUspora',    fmt(r.uspora_jom));
    setText('jomNaByt',     fmt(r.uspora_jom / state.byty));
    setText('jomValBefore', fmt(r.naklady_bez));
    setText('jomValAfter',  fmt(r.naklady_s_jom));
    setHeight('jomBarAfter', (r.naklady_s_jom / r.naklady_bez) * 100);
  }

  function renderPanel2() {
    var r = results;
    setText('fveUspora',     fmt(r.uspora_fve));
    setText('fveVykon',      r.vykon + ' kWp');
    setText('fveNavratnost', fmtRoky(r.navratnost_fve));
    setText('fveValBase',    fmtKwh(r.vlastni_bez_jom));
    setText('fveValJom',     fmtKwh(r.vlastni_s_jom));
    setText('fveInvestice',  fmt(r.investice_fve));
    setText('fveJomLink',    fmt(r.uspora_jom));
    setText('fvePokryti',    r.pokryti + '');
    var max = r.vlastni_s_jom;
    setHeight('fveColBase', (r.vlastni_bez_jom / max) * 100);
    setHeight('fveColJom',  100);
    setText('fveCascadeJom', fmt(r.uspora_jom));
    setText('fveCascadePct', r.pokryti + '');
  }

  function renderPanel3() {
    var r = results;
    setText('tcUspora',    fmt(r.uspora_tc));
    setText('tcNaklady',   fmt(r.naklady_tc_s));
    setText('tcValPlyn',   fmt(r.naklady_plynem));
    setText('tcValBezFve', fmt(r.naklady_tc_bez));
    setText('tcValSFve',   fmt(r.naklady_tc_s));
    var max = r.naklady_plynem;
    setHeight('tcBarBezFve', (r.naklady_tc_bez / max) * 100);
    setHeight('tcBarSFve',   (r.naklady_tc_s   / max) * 100);
    setText('tcCascadeCena',   r.cena_fve_mix.toLocaleString('cs-CZ'));
    setText('tcCascadeUspora', fmt(r.uspora_fve_na_tc));
  }

  function renderPanel4() {
    var r = results;
    setText('zatUspora',    fmt(r.uspora_zatepleni));
    setText('zatNaklady',   fmt(r.naklady_po_zat));
    setText('zatValBefore', fmt(r.naklady_tc_s));
    setText('zatValAfter',  fmt(r.naklady_po_zat));
    setHeight('zatBarAfter', (r.naklady_po_zat / r.naklady_tc_s) * 100);
    setText('zatCascadeTc',     fmt(r.naklady_tc_s));
    setText('zatCascadeUspora', fmt(r.uspora_zatepleni));
  }

  function renderPanel5(animate) {
    var r = results;
    var mes = state.period === 'mes';
    var sufLabel = mes ? 'Kč/měs' : 'Kč/rok';
    function pn(n) { return Math.round(mes ? n / 12 : n).toLocaleString('cs-CZ'); }
    function pf(n) { return Math.round(mes ? n / 12 : n).toLocaleString('cs-CZ') + ' Kč'; }

    // Zobrazit/skrýt sloupce a řádky dle výběru
    var colIds = { jom: 'sumColJom', fve: 'sumColFve', tc: 'sumColTc', zatepleni: 'sumColZat' };
    var rowIds = { jom: 'sumRowJom', fve: 'sumRowFve', tc: 'sumRowTc', zatepleni: 'sumRowZat' };
    ['jom','fve','tc','zatepleni'].forEach(function (key) {
      var show = state.selected[key];
      var col = document.getElementById(colIds[key]);
      var row = document.getElementById(rowIds[key]);
      if (col) col.style.display = show ? '' : 'none';
      if (row) row.style.display = show ? '' : 'none';
    });

    // Čísla a suffixy
    setText('sumNumJom', pn(r.uspora_jom));
    setText('sumNumFve', pn(r.uspora_fve));
    setText('sumNumTc',  pn(r.uspora_tc));
    setText('sumNumZat', pn(r.uspora_zatepleni));
    ['sumSufJom','sumSufFve','sumSufTc','sumSufZat'].forEach(function (id) { setText(id, sufLabel); });

    // Cascade anotace
    setText('sumCasJomPct', r.pokryti + '');
    setText('sumCasFve',    pf(r.uspora_fve_na_tc));
    setText('sumCasTc',     pf(r.uspora_tc));

    // Tabulka
    var tblSuf = ' ' + sufLabel;
    setText('sumTblJom',   pf(r.uspora_jom)     + tblSuf);
    setText('sumTblFve',   pf(r.uspora_fve)      + tblSuf);
    setText('sumTblTc',    pf(r.uspora_tc)        + tblSuf);
    setText('sumTblZat',   pf(r.uspora_zatepleni) + tblSuf);
    setText('sumTblTotal', pf(r.celkova_uspora)   + tblSuf);

    // Výšky sloupců — maxVal pouze z vybraných
    var allKeys = ['jom', 'fve', 'tc', 'zatepleni'];
    var allVals = [r.uspora_jom, r.uspora_fve, r.uspora_tc, r.uspora_zatepleni];
    var barIds  = ['sumBarJom', 'sumBarFve', 'sumBarTc', 'sumBarZat'];
    var selectedVals = allVals.filter(function (v, i) { return state.selected[allKeys[i]]; });
    var maxVal = selectedVals.length ? Math.max.apply(null, selectedVals) : 1;
    var heights = allVals.map(function (v) { return Math.round(Math.sqrt(v / maxVal) * 100) + '%'; });

    if (animate) {
      barIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.style.transition = 'none'; el.style.height = '0%'; }
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          barIds.forEach(function (id, i) {
            var el = document.getElementById(id);
            if (el) {
              el.style.transition = 'height 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
              el.style.height = heights[i];
            }
          });
        });
      });
    } else {
      barIds.forEach(function (id, i) {
        var el = document.getElementById(id);
        if (el) el.style.height = heights[i];
      });
    }
  }

  // ── Navigation ────────────────────────────────────────────
  function showStep(key) {
    readDetailInputs();
    calculate();

    document.querySelectorAll('.kalk-panel').forEach(function (p) { p.hidden = true; });

    var meta = STEP_META[key];
    var panel = document.getElementById(meta.panelId);
    if (panel) panel.hidden = false;

    var renderers = {
      jom: renderPanel1, fve: renderPanel2, tc: renderPanel3,
      zatepleni: renderPanel4, summary: function () { renderPanel5(true); }
    };
    if (renderers[key]) renderers[key]();

    updateStepper(key);

    var wizard = document.getElementById('kalkulacka');
    if (wizard) wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  }

  // ── Init ──────────────────────────────────────────────────
  document.getElementById('kalkStepper').style.display = 'none';
  document.querySelectorAll('.kalk-panel').forEach(function (p) { p.hidden = true; });
  var selectPanel = document.getElementById('kalkPanelSelect');
  if (selectPanel) selectPanel.hidden = false;

  // Výběrové karty
  document.querySelectorAll('.kalk-select-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var key = card.dataset.key;
      var cb  = card.querySelector('input[type=checkbox]');
      cb.checked = !cb.checked;
      state.selected[key] = cb.checked;
      card.classList.toggle('is-selected', cb.checked);
      var anySelected = ['jom','fve','tc','zatepleni'].some(function (k) { return state.selected[k]; });
      var nextBtn = document.getElementById('kalkSelectNext');
      if (nextBtn) nextBtn.disabled = !anySelected;
    });
  });

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

  // Start (Spočítat úspory) → první vybraný krok
  var startBtn = document.getElementById('kalkStart');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      var bytyEl    = document.getElementById('kalkByty');
      var spotEl    = document.getElementById('kalkSpotreba');
      var strechaEl = document.querySelector('input[name="kalkStrecha"]:checked');

      var byty     = parseInt(bytyEl && bytyEl.value, 10);
      var spotreba = parseInt(spotEl && spotEl.value, 10);
      var strecha  = strechaEl ? strechaEl.value : 'medium';

      if (!byty || byty < 2)           { bytyEl && bytyEl.focus(); return; }
      if (!spotreba || spotreba < 1000) { spotEl && spotEl.focus(); return; }

      state.byty     = byty;
      state.spotreba = spotreba;
      state.strecha  = strecha;

      calculate();
      goNext('basic');
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

  // Rok / měsíc toggle
  var toggleRok = document.getElementById('sumToggleRok');
  var toggleMes = document.getElementById('sumToggleMes');
  if (toggleRok && toggleMes) {
    toggleRok.addEventListener('click', function () {
      state.period = 'rok';
      toggleRok.classList.add('is-active');
      toggleMes.classList.remove('is-active');
      renderPanel5(false);
    });
    toggleMes.addEventListener('click', function () {
      state.period = 'mes';
      toggleMes.classList.add('is-active');
      toggleRok.classList.remove('is-active');
      renderPanel5(false);
    });
  }

  // Form submit
  var form = document.getElementById('kalkForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      document.getElementById('kalkPanel5').hidden = true;
      document.getElementById('kalkThankyou').hidden = false;
      var stepper = document.getElementById('kalkStepper');
      if (stepper) stepper.style.display = 'none';
    });
  }

})();
