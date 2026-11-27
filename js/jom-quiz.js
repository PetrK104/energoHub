// Dotazník JOM (sekce #dotaznik): čistá roční bilance (jističe + stálé platby dodavatele − rozúčtování), hlavní jistič
// podle počtu bytů a způsobu vaření a hodnocení finančního přínosu. Výpočet je v KALK_ENGINE.jomBilance.
// Je to samostatná sekce, na dotazník nahoře (jom-quiz.js) ani na zbytek webu nemá vliv.
(function () {
  var root = document.getElementById('dotaznik');
  var form = document.getElementById('quizForm');
  if (!root || !form || typeof KALK === 'undefined' || typeof KALK_ENGINE === 'undefined' || typeof EH === 'undefined') return;

  var NDASH = ' – ';
  var submitted = false;
  var last = null;   // poslední výsledek (pro uložení)

  function $(id) { return document.getElementById(id); }
  function fmt(n) { return Math.round(n).toLocaleString('cs-CZ'); }
  function roundTo(n, step) { return Math.round(n / step) * step; }
  function yearStep(n) { return Math.abs(n) < 20000 ? 500 : 1000; }
  function monthStep(n) { return Math.abs(n) < 1000 ? 50 : 100; }

  // ── Výpočet a hodnocení ──
  function readInputs() {
    return {
      byty: parseInt($('quizApts').value, 10) || 0,
      zona: $('quizDistributor').value,
      vareni: $('quizCooking').value,
      fve: EH.checked('quizFve') || 'none'
    };
  }

  function calc() {
    var o = readInputs();
    var b = KALK_ENGINE.jomBilance(o);
    if (!b) return null;
    var r = KALK.rozpeti(b.neznamych);
    var c = b.celkem, lo = c * (1 - r), hi = c * (1 + r);
    return {
      inputs: o, b: b, spread: r, center: c,
      year_lo: roundTo(lo, yearStep(lo)), year_hi: roundTo(hi, yearStep(hi)),
      month_lo: roundTo(lo / 12, monthStep(lo / 12)), month_hi: roundTo(hi / 12, monthStep(hi / 12)),
      apt_lo: roundTo(lo / 12 / o.byty, 10), apt_hi: roundTo(hi / 12 / o.byty, 10),
      fve_lo: b.fve ? roundTo(b.fve * (1 - r), 1000) : 0, fve_hi: b.fve ? roundTo(b.fve * (1 + r), 1000) : 0,
      money: c >= 50000 ? 'high' : c < 25000 ? 'low' : 'mid'
    };
  }

  // Verdikt „Vyplatí se JOM?“ podle čisté úspory (nad 50 000 Kč vysoká, pod 25 000 Kč nízká, bez úspory se nevyplatí)
  var VERDICT = {
    high: { title: 'Ano, úspora je velmi zajímavá', icon: 'check_circle', text: '' },
    mid: { title: 'Ano, úspora je přijatelná', icon: 'info', text: '' },
    low: { title: 'Sporné, úspora je nízká', icon: 'info', text: 'Při takové částce může investice a organizace převážit přínos.' },
    none: { title: 'Ne, úsporu to nepřinese', icon: 'info', text: 'Při zadaných parametrech by JOM podle tohoto odhadu úsporu nepřineslo.' }
  };

  // ── Zobrazení ──
  function setVerdict(level) {
    var v = VERDICT[level];
    var el = $('quizVerdict');
    el.className = 'jomb-verdict jomb-verdict--' + level;
    $('quizVerdictIcon').textContent = v.icon;
    $('quizVerdictTitle').textContent = v.title;
    var t = $('quizVerdictText');
    t.textContent = v.text;
    t.hidden = !v.text;
  }

  function kc(n) { return fmt(n) + ' Kč'; }

  function render() {
    last = calc();
    var box = $('quizEstimate');
    if (!last) { box.hidden = true; return; }
    var e = last, b = e.b, o = e.inputs;


    // Přínos je kladný? Jinak ukážeme poctivě nulu a verdikt „Ne“
    var positive = e.year_hi > 0;
    setVerdict(positive ? e.money : 'none');
    $('quizEstYear').textContent = positive ? fmt(Math.max(0, e.year_lo)) + NDASH + fmt(e.year_hi) : '0';
    $('quizEstMonth').textContent = positive ? fmt(Math.max(0, e.month_lo)) + NDASH + fmt(e.month_hi) : '0';
    // Na mobilu se měsíční částka ukáže v tisících Kč (8,6 – 11,6 tis. Kč), aby se vešla na jeden řádek
    function tis(n) { return (Math.round(n / 100) / 10).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }); }
    $('quizEstMonthShort').textContent = positive ? tis(Math.max(0, e.month_lo)) + NDASH + tis(e.month_hi) : '0';
    $('quizEstApt').textContent = positive ? fmt(Math.max(0, e.apt_lo)) + NDASH + fmt(e.apt_hi) : '0';

    var fveEl = $('quizEstFve');
    if (o.fve === 'have') {
      fveEl.textContent = 'Z toho lepší využití vaší FVE přibližně ' + fmt(e.fve_lo) + NDASH + fmt(e.fve_hi) + ' Kč ročně.';
      fveEl.hidden = false;
    } else if (o.fve === 'plan') {
      fveEl.textContent = 'S fotovoltaikou se úspora ještě zvýší.';
      fveEl.hidden = false;
    } else fveEl.hidden = true;

    function line(label, value, cls) { return '<div class="jomb-line' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><span>' + value + '</span></div>'; }
    var html = '<div class="jomb-col"><p class="jomb-col__head">Dnes</p>' +
      line('Jističe bytů a provoz měření', kc(b.jistice_dnes)) +
      line('Stálé platby dodavatelům (každý byt)', kc(b.dodavatel_dnes)) +
      line('Společný elektroměr domu (jistič 3×16 A, stálá platba)', kc(b.spolecne_dnes)) +
      line('Celkem dnes', kc(b.dnes), 'jomb-line--sum') + '</div>' +
      '<div class="jomb-col"><p class="jomb-col__head">Po JOM</p>' +
      line('Hlavní jistič a provoz měření', kc(b.jistic_po)) +
      line('Stálá platba dodavateli (jedna)', kc(b.dodavatel_po)) +
      line('Rozúčtování podružných měřidel', kc(b.rozuctovani)) +
      line('Celkem po JOM', kc(b.po), 'jomb-line--sum') + '</div>' +
      '<div class="jomb-net">' + line('Čistá úspora bez FVE', kc(b.cista), 'jomb-line--sum jomb-line--main') +
      (o.fve === 'have' ? line('Přínos FVE (lepší využití výroby)', '+ ' + kc(b.fve)) : '') + '</div>';
    $('quizBalance').innerHTML = html;

    var aTxt = b.hlavni_a_lo === b.hlavni_a_hi ? '3×' + b.hlavni_a_lo + ' A' : '3×' + b.hlavni_a_lo + ' až 3×' + b.hlavni_a_hi + ' A';
    var note = 'Orientační odhad pro ' + o.byty + ' bytů, částky včetně DPH, rozpětí ±' + Math.round(e.spread * 100) + ' %. ' +
      'Hlavní jistič JOM ' + aTxt + ' je odhad podle počtu bytů a způsobu vaření, skutečný určí projektant. ' +
      'Počítáme se stálou platbou dodavateli ' + KALK_CENY.dodavatel_stala_platba + ' Kč za odběrné místo a rozúčtováním ' + KALK_CENY.rozuctovani_dum + ' Kč za dům + ' + KALK_CENY.rozuctovani_na_byt + ' Kč za byt měsíčně (bez DPH, odhad). Společný elektroměr domu po zavedení JOM zaniká.';
    $('quizEstNote').textContent = note;
    box.hidden = false;
  }

  // ── Kroky a kontrola ──
  function fieldError(id, errId, bad, msg) {
    var el = $(id), err = $(errId);
    if (err) { err.textContent = bad ? msg : ''; err.hidden = !bad; }
    if (bad) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', errId); }
    else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  }

  function showStep(n) {
    if (submitted) return;
    for (var i = 1; i <= 2; i++) { var p = $('quizPanel' + i); if (p) p.hidden = (i !== n); }
    root.querySelectorAll('.jom-quiz__step-item').forEach(function (el) {
      var s = parseInt(el.dataset.step, 10);
      el.classList.remove('is-active', 'is-done');
      if (s === n) el.classList.add('is-active'); else if (s < n) el.classList.add('is-done');
      if (s === n) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
  }

  function checkInputs() {
    var apts = $('quizApts'), dist = $('quizDistributor'), cook = $('quizCooking');
    var v = parseInt(apts.value, 10);
    var badApts = !v || v < KALK.BYTY_MIN || v > KALK.BYTY_MAX;
    fieldError('quizApts', 'quizAptsErr', badApts, 'Zadejte počet bytů od ' + KALK.BYTY_MIN + ' do ' + KALK.BYTY_MAX + '.');
    fieldError('quizDistributor', 'quizDistributorErr', !dist.value, 'Vyberte distributora.');
    fieldError('quizCooking', 'quizCookingErr', !cook.value, 'Vyberte jistič v bytech.');
    var first = badApts ? apts : !dist.value ? dist : !cook.value ? cook : null;
    if (first) { showStep(1); first.focus(); }
    return !first;
  }

  [['quizApts', 'quizAptsErr', 'input'], ['quizDistributor', 'quizDistributorErr', 'change'], ['quizCooking', 'quizCookingErr', 'change']].forEach(function (f) {
    $(f[0]).addEventListener(f[2], function () { var err = $(f[1]); if (err) err.hidden = true; $(f[0]).removeAttribute('aria-invalid'); });
  });

  function go(n) {
    if (n === 2) { if (!checkInputs()) return; render(); }
    showStep(n);
  }
  root.querySelectorAll('.jom-quiz__step-item').forEach(function (el) {
    var lab = el.querySelector('.jom-quiz__step-label');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Přejít na krok ' + el.dataset.step + ': ' + (lab ? lab.textContent.trim() : ''));
    el.addEventListener('click', function () { go(parseInt(el.dataset.step, 10)); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(parseInt(el.dataset.step, 10)); } });
  });
  root.querySelectorAll('.jom-quiz__btn-next').forEach(function (btn) {
    btn.addEventListener('click', function () { go(parseInt(btn.dataset.next, 10)); });
  });

  // ── Odeslání poptávky ──
  var FVE_STAV = { have: 'mají', plan: 'plánují', none: 'nemají' };
  var DIST = { cez: 'ČEZ Distribuce', egd: 'EG.D (E.ON)', pre: 'PREdistribuce' };
  var COOK = { plyn: '1×25 A (vaření na plynu)', el: '3×20 A až 3×25 A (el. vaření)' };
  var CONTR = { individual: 'každý byt má vlastní smlouvu', common: 'společná smlouva už existuje', unknown: 'nevědí' };
  var LEVEL = { high: 'vysoká', mid: 'střední', low: 'nízká' };

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!checkInputs()) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!last) render();
    var e = last;
    if (!e) return;
    var b = e.b, o = e.inputs;
    var ui = EH.formUi(form);
    var hp = form.querySelector('input[name="website"]');
    var consentEl = $('quizConsentText');

    var inputs = { distributor: $('quizDistributor').value, breaker_type: $('quizCooking').value, fve: o.fve, contracts: EH.checked('quizContracts') };
    var positive = e.year_hi > 0;
    // V tabulce jsou vstupy i výsledky ve sloupcích; do JSON jde jen rozpis bilance a použité předpoklady (pro pozdější ověření)
    var detail = {
      schema: 'v3',
      balance_czk: { jistice_dnes: Math.round(b.jistice_dnes), dodavatel_dnes: Math.round(b.dodavatel_dnes), spolecne_dnes: Math.round(b.spolecne_dnes), jistic_po: Math.round(b.jistic_po),
        dodavatel_po: Math.round(b.dodavatel_po), rozuctovani: Math.round(b.rozuctovani), fve: Math.round(b.fve) },
      assumptions: (KALK.predpoklady ? KALK.predpoklady() : null)
    };
    var L = [];
    L.push('Dům: ' + o.byty + ' bytů, distributor ' + DIST[inputs.distributor] + ', jistič v bytech ' + COOK[inputs.breaker_type] + '.');
    L.push('FVE: ' + FVE_STAV[o.fve] + '. Smlouvy na elektřinu: ' + (CONTR[inputs.contracts] || 'neuvedeno') + '.');
    L.push('Verdikt: ' + (positive ? { high: 'velmi zajímavá úspora', mid: 'přijatelná úspora', low: 'sporná úspora' }[e.money] : 'úspora se nepředpokládá') + '.');
    L.push('Čistá roční úspora: ' + KALK_ENGINE.fmtKc(e.year_lo, e.year_hi) + ' (dnes ' + fmt(b.dnes) + ' Kč, po JOM ' + fmt(b.po) + ' Kč' + (o.fve === 'have' ? ', FVE přínos ' + fmt(b.fve) + ' Kč' : '') + '), rozpětí ±' + Math.round(e.spread * 100) + ' %.');
    L.push('Hlavní jistič JOM v odhadu: 3×' + b.hlavni_a_lo + ' A. Částky včetně DPH, verze výpočtu ' + KALK.VERZE + '.');

    ui.start();
    EH.submitForm('jom_quiz', {
      name: EH.val('quizName'),
      email: EH.val('quizEmail'),
      phone: EH.val('quizPhone'),
      organization: EH.val('quizOrg'),
      vysledek: detail,
      sloupce: {
        pocet_bytu: o.byty,
        distributor: DIST[inputs.distributor],
        jistic_v_bytech: COOK[inputs.breaker_type],
        stav_fve: FVE_STAV[o.fve],
        stav_smluv: CONTR[inputs.contracts] || null,
        hlavni_jistic_a: b.hlavni_a_lo,
        vyhodnoceni: positive ? LEVEL[e.money] : null,
        uspora_rocne_od_kc: e.year_lo,
        uspora_rocne_do_kc: e.year_hi,
        uspora_mesicne_od_kc: e.month_lo,
        uspora_mesicne_do_kc: e.month_hi,
        uspora_na_byt_mesicne_od_kc: e.apt_lo,
        uspora_na_byt_mesicne_do_kc: e.apt_hi,
        naklady_dnes_kc: Math.round(b.dnes),
        naklady_po_jom_kc: Math.round(b.po),
        cista_uspora_kc: Math.round(b.cista),
        prinos_fve_kc: Math.round(b.fve),
        rozpeti_procent: Math.round(e.spread * 100),
        verze_vypoctu: KALK.VERZE
      },
      summary: L.join('\n'),
      consent: $('quizConsent').checked,
      consent_text: consentEl ? consentEl.textContent.trim() : ''
    }, hp && hp.value).then(function () {
      submitted = true;
      ui.done();
      $('quizPanel2').hidden = true;
      $('quizThankyou').hidden = false;
      var st = root.querySelector('.jom-quiz__stepper'); if (st) st.style.display = 'none';
      var t = root.querySelector('.jom-quiz__thankyou-title'); if (t) { t.setAttribute('tabindex', '-1'); t.focus(); }
    }).catch(function (err) { ui.fail(err.message); });
  });
})();
