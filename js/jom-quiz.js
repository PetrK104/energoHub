(function () {
  var form = document.getElementById('quizForm');
  if (!form) return;

  var NDASH = ' – ';
  var lastEstimate = null;

  function calcScore() {
    var score = 0;

    var apts = parseInt(document.getElementById('quizApts').value, 10) || 0;
    if (apts >= 50) score += 3;
    else if (apts >= 31) score += 2;
    else if (apts >= 15) score += 1;

    var fve = document.querySelector('input[name="quizFve"]:checked');
    if (fve) {
      if (fve.value === 'have') score += 3;
      else if (fve.value === 'plan') score += 2;
    }

    var contracts = document.querySelector('input[name="quizContracts"]:checked');
    if (contracts && contracts.value === 'individual') score += 2;

    // Roční spotřeba domu (kWh) → měsíční průměr: nad 3 000 kWh/měs. +2, 1 000–3 000 kWh/měs. +1
    var annualKwh = parseFloat(document.getElementById('quizAnnual').value) || 0;
    var monthlyKwh = annualKwh / 12;
    if (monthlyKwh > 3000) score += 2;
    else if (monthlyKwh >= 1000) score += 1;

    var battery = document.querySelector('input[name="quizBattery"]:checked');
    if (battery && (battery.value === 'have' || battery.value === 'plan')) score += 1;

    return score;
  }

  // ── Odhad úspory ─────────────────────────────────────────
  function fmt(n) { return Math.round(n).toLocaleString('cs-CZ'); }
  function roundTo(n, step) { return Math.round(n / step) * step; }
  function range(lo, hi, step) { return fmt(roundTo(lo, step)) + NDASH + fmt(roundTo(hi, step)); }
  function yearStep(n) { return n < 20000 ? 500 : 1000; }
  function monthStep(n) { return n < 1000 ? 50 : 100; }

  function calcEstimate() {
    var apts = parseInt(document.getElementById('quizApts').value, 10) || 0;
    if (apts < 1 || typeof KALK === 'undefined' || apts < KALK.BYTY_MIN) return null;

    var zone = EH.val('quizDistributor');
    var breaker = EH.checked('quizBreaker');
    var fve = EH.checked('quizFve');

    var annual = parseFloat(document.getElementById('quizAnnual').value) || 0;
    var kwp = parseFloat(document.getElementById('quizKwp').value) || 0;
    var orient = KALK.ORIENT[EH.val('quizOrient')] || 0;
    var CONS_NOTE = 'spotřeba odhadnutá z počtu bytů';

    var estimated = [];
    if (!zone) estimated.push('distribuční území ČEZ');
    if (!breaker || breaker === 'unknown') estimated.push('jistič 1×25 A');
    if (!annual) estimated.push(CONS_NOTE);

    var r = KALK.rozpeti(estimated.length);
    // Máme FVE: JOM zvýší využití vlastní výroby (z ~20 % na ~65 %). Stejné jádro výpočtu jako hlavní kalkulačka.
    var fveBonus = 0;
    if (fve === 'have') {
      var e = KALK_ENGINE.compute({
        byty: apts,
        spotreba: annual || apts * KALK.SPOTREBA_NA_BYT,
        orient: orient || KALK.ORIENT.J,
        cenaEl: KALK.FVE_CENA_EL,
        vykonFix: kwp || 0,
        selected: { jom: true, fve: true }
      });
      fveBonus = (e.vlastni_s_jom - e.vlastni_bez_jom) * KALK.FVE_CENA_EL;
    }
    var center = apts * KALK.JOM_NA_BYT + fveBonus;
    var loY = center * (1 - r), hiY = center * (1 + r);
    var est = {
      apartments: apts,
      spread: r,
      year_lo: roundTo(loY, yearStep(loY)),
      year_hi: roundTo(hiY, yearStep(hiY)),
      month_lo: roundTo(loY / 12, monthStep(loY / 12)),
      month_hi: roundTo(hiY / 12, monthStep(hiY / 12)),
      per_apartment_month_lo: roundTo(KALK.JOM_NA_BYT * (1 - r) / 12, 10),
      per_apartment_month_hi: roundTo(KALK.JOM_NA_BYT * (1 + r) / 12, 10),
      estimated: estimated
    };

    // Pevné regulované platby bytů před JOM (ověřené ceny, sazba D02d, bez DPH)
    var ceny = (typeof KALK_CENY !== 'undefined') ? KALK_CENY : null;
    var zoneKey = zone || 'cez';
    var breakerKey = breaker === '3x20' ? '3x20' : '1x25';
    var tbl = ceny && ceny.distribuce[zoneKey] && ceny.distribuce[zoneKey].D02d;
    var fee = tbl ? tbl.jistic[breakerKey] : null;
    if (fee != null && ceny.provoz_nesitove_infrastruktury != null) {
      var yearFixed = (fee + ceny.provoz_nesitove_infrastruktury) * 12 * apts;
      est.fixed_year = roundTo(yearFixed, yearStep(yearFixed));
      est.fixed_zone = ceny.distribuce[zoneKey].nazev;
    }

    est.fve_mode = (fve === 'plan' || fve === 'have') ? fve : null;
    if (fve === 'have') {
      est.fve_part_year_lo = roundTo(fveBonus * (1 - r), 1000);
      est.fve_part_year_hi = roundTo(fveBonus * (1 + r), 1000);
      if (!kwp) est.estimated.push('výkon FVE odhadnutý z velikosti domu');
      if (!orient) est.estimated.push('orientace střechy na jih');
      if (!annual && est.estimated.indexOf(CONS_NOTE) === -1) est.estimated.push(CONS_NOTE);
    }

    return est;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (!el) return null;
    el.textContent = text;
    return el;
  }

  function renderEstimate(level) {
    var box = document.getElementById('quizEstimate');
    if (!box) return;
    lastEstimate = calcEstimate();
    if (!lastEstimate) { box.hidden = true; return; }
    var e = lastEstimate;

    box.classList.remove('jom-quiz__estimate--high', 'jom-quiz__estimate--mid', 'jom-quiz__estimate--low');
    box.classList.add('jom-quiz__estimate--' + level);

    var year = e.year_lo === e.year_hi ? fmt(e.year_lo) : fmt(e.year_lo) + NDASH + fmt(e.year_hi);
    var month = fmt(e.month_lo) + NDASH + fmt(e.month_hi);
    setText('quizEstYear', year);
    setText('quizEstMonth', month);
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'JOM vám může ušetřit přibližně od ' + fmt(e.year_lo) + ' do ' + fmt(e.year_hi) +
      ' korun ročně, tedy od ' + fmt(e.month_lo) + ' do ' + fmt(e.month_hi) + ' korun měsíčně.');

    var fveEl = document.getElementById('quizEstFve');
    if (fveEl) {
      if (e.fve_mode) {
        fveEl.textContent = e.fve_mode === 'have'
          ? 'Z toho lepší využití vaší FVE přibližně ' + fmt(e.fve_part_year_lo) + NDASH + fmt(e.fve_part_year_hi) + ' Kč ročně.'
          : 'S fotovoltaikou se úspora ještě zvýší.';
        fveEl.hidden = false;
      } else {
        fveEl.hidden = true;
      }
    }

    var note = 'Orientační odhad pro ' + e.apartments + ' bytů, rozpětí ±' + Math.round(e.spread * 100) + ' %.';
    if (e.estimated.length) note += ' Část údajů je odhadnutá.';
    setText('quizEstNote', note);

    var toMain = document.getElementById('quizToMain');
    if (toMain) {
      var fveMode = EH.checked('quizFve');
      KALK.nastavOdkaz(toMain, {
        byty: e.apartments,
        spotreba: parseFloat(document.getElementById('quizAnnual').value) || 0,
        orientace: EH.val('quizOrient'),
        reseni: (fveMode === 'have' || fveMode === 'plan') ? ['jom', 'fve'] : ['jom']
      });
    }

    box.hidden = false;
  }

  function showResult(score) {
    var banner = document.getElementById('quizResultBanner');
    if (!banner) return;

    var badgeEl = banner.querySelector('.jom-quiz__result-badge');
    var textEl  = banner.querySelector('.jom-quiz__result-text');
    var level;

    banner.classList.remove('jom-quiz__result-banner--high', 'jom-quiz__result-banner--mid', 'jom-quiz__result-banner--low');

    if (score >= 7) {
      level = 'high';
      banner.classList.add('jom-quiz__result-banner--high');
      if (badgeEl) { badgeEl.textContent = 'JOM se vám pravděpodobně velmi vyplatí'; badgeEl.className = 'jom-quiz__result-badge jom-quiz__result-badge--high'; }
    } else if (score >= 4) {
      level = 'mid';
      banner.classList.add('jom-quiz__result-banner--mid');
      if (badgeEl) { badgeEl.textContent = 'JOM má pro váš dům smysl'; badgeEl.className = 'jom-quiz__result-badge jom-quiz__result-badge--mid'; }
    } else {
      level = 'low';
      banner.classList.add('jom-quiz__result-banner--low');
      if (badgeEl) { badgeEl.textContent = 'JOM zatím nemusí být ideální'; badgeEl.className = 'jom-quiz__result-badge jom-quiz__result-badge--low'; }
    }

    banner.classList.add('is-visible');
    renderEstimate(level);
  }

  function syncFveExtra() {
    var box = document.getElementById('quizFveExtra');
    if (!box) return;
    var fve = EH.checked('quizFve');
    box.hidden = !(fve === 'plan' || fve === 'have');
  }

  var submitted = false;  // po odeslání poptávky se do kroků nedá vracet
  function showStep(n) {
    if (submitted) return;
    if (n === 2) syncFveExtra();
    for (var i = 1; i <= 3; i++) {
      var panel = document.getElementById('quizPanel' + i);
      if (panel) panel.hidden = (i !== n);
    }

    document.querySelectorAll('.jom-quiz__step-item').forEach(function (el) {
      var s = parseInt(el.dataset.step, 10);
      el.classList.remove('is-active', 'is-done');
      if (s === n) el.classList.add('is-active');
      else if (s < n) el.classList.add('is-done');
      if (s === n) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
  }

  // Kroky nahoře jsou navigace (myš, dotyk, Enter a mezerník), stejně jako v hlavní kalkulačce
  document.querySelectorAll('.jom-quiz__step-item').forEach(function (el) {
    var lab = el.querySelector('.jom-quiz__step-label');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Přejít na krok ' + el.dataset.step + ': ' + (lab ? lab.textContent.trim() : ''));
    function go() {
      var n = parseInt(el.dataset.step, 10);
      if (n === 3) showResult(calcScore());
      showStep(n);
    }
    el.addEventListener('click', go);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  document.querySelectorAll('.jom-quiz__btn-next').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = parseInt(btn.dataset.next, 10);
      if (next === 3) showResult(calcScore());
      showStep(next);
    });
  });

  document.querySelectorAll('.jom-quiz__btn-back').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showStep(parseInt(btn.dataset.back, 10));
    });
  });

  // ── Uložení do Supabase: čitelná struktura (schema 2) a věta summary ──
  function numOrNull(id) { var v = parseFloat(document.getElementById(id).value); return v > 0 ? v : null; }
  function buildAnswers(score) {
    var est = calcEstimate(), E = KALK_ENGINE;
    var estimate = null;
    if (est) {
      estimate = {
        saving_year_czk: { lo: est.year_lo, hi: est.year_hi },
        saving_month_czk: { lo: est.month_lo, hi: est.month_hi },
        saving_apt_month_czk: { lo: est.per_apartment_month_lo, hi: est.per_apartment_month_hi },
        spread: est.spread,
        fixed_fees_year_czk: est.fixed_year != null ? est.fixed_year : null,
        fixed_fees_zone: est.fixed_zone || null,
        fve_mode: est.fve_mode,
        fve_part_year_czk: est.fve_part_year_lo != null ? { lo: est.fve_part_year_lo, hi: est.fve_part_year_hi } : null,
        estimated_items: est.estimated
      };
    }
    return {
      schema: 2,
      inputs: {
        apartments: parseInt(EH.val('quizApts'), 10) || null,
        house_type: EH.val('quizType') || null,
        distributor: EH.val('quizDistributor') || null,
        fve: EH.checked('quizFve'),
        contracts: EH.checked('quizContracts'),
        battery: EH.checked('quizBattery'),
        breaker: EH.checked('quizBreaker'),
        annual_consumption_kwh: numOrNull('quizAnnual'),
        fve_kwp: numOrNull('quizKwp'),
        fve_orientation: EH.val('quizOrient') || null
      },
      score: score,
      score_max: 11,
      estimate: estimate,
      assumptions: (window.KALK && KALK.predpoklady) ? KALK.predpoklady() : null
    };
  }
  // Přehledné shrnutí na více řádků (sloupec shrnuti): odpovědi z dotazníku a vyhodnocení
  var TYPE = { svj: 'SVJ', druzstvo: 'bytové družstvo', obecni: 'obecní dům', jine: 'jiný' };
  var FVE_STAV = { have: 'mají', plan: 'plánují', none: 'nemají' };
  var LEVEL = { high: 'vysoká', mid: 'střední', low: 'nízká' };
  function buildSummary(a, level) {
    var DIST = { cez: 'ČEZ Distribuce', egd: 'EG.D (E.ON)', pre: 'PREdistribuce' };
    var CONTR = { individual: 'každý byt má vlastní smlouvu', common: 'společná smlouva už existuje', unknown: 'nevědí' };
    var BAT = { have: 'mají', plan: 'plánují', none: 'nemají' };
    var BREAKER = { '1x25': '1×25 A', '3x20': '3×20 A', unknown: 'různé / nevědí' };
    var ORIENT = { J: 'jih', JV: 'jihovýchod', JZ: 'jihozápad', V: 'východ', Z: 'západ', S: 'sever' };
    var cz = function (n) { return n.toLocaleString('cs-CZ'); };
    var i = a.inputs, L = [];
    L.push('Dům: ' + (i.apartments || '?') + ' bytů' + (TYPE[i.house_type] ? ', ' + TYPE[i.house_type] : '') +
      (DIST[i.distributor] ? ', distributor ' + DIST[i.distributor] : ', distributor neuveden') +
      (i.annual_consumption_kwh ? ', roční spotřeba ' + cz(Math.round(i.annual_consumption_kwh / 1000)) + ' MWh' : ', spotřeba nezadána') + '.');
    var fve = 'FVE: ' + (FVE_STAV[i.fve] || 'neuvedeno');
    if (i.fve_kwp) fve += ', ' + cz(i.fve_kwp) + ' kWp';
    if (ORIENT[i.fve_orientation]) fve += ', orientace ' + ORIENT[i.fve_orientation];
    L.push(fve + '.');
    L.push('Baterie: ' + (BAT[i.battery] || 'neuvedeno') + '. Smlouvy: ' + (CONTR[i.contracts] || 'neuvedeno') +
      '. Hlavní jistič: ' + (BREAKER[i.breaker] || 'neuvedeno') + '.');
    L.push('Vyhodnocení: ' + LEVEL[level] + ' vhodnost JOM (skóre ' + a.score + ' z ' + a.score_max + ').');
    if (a.estimate) {
      var e = a.estimate, E = KALK_ENGINE;
      L.push('Odhad úspory: ' + E.fmtKc(e.saving_year_czk.lo, e.saving_year_czk.hi) + ' ročně (' + cz(e.saving_apt_month_czk.lo) + ' – ' +
        cz(e.saving_apt_month_czk.hi) + ' Kč na byt měsíčně), rozpětí ±' + Math.round(e.spread * 100) + ' %.');
    } else L.push('Odhad úspory nebylo možné spočítat (chybí počet bytů nebo spotřeba).');
    L.push('Částky včetně DPH, verze výpočtu ' + ((window.KALK && KALK.VERZE) || '?') + '.');
    return L.join('\n');
  }

  // Hodnoty pro samostatné sloupce tabulky poptavky_jom
  function buildColumns(a, level) {
    var i = a.inputs, e = a.estimate;
    return {
      pocet_bytu: i.apartments,
      typ_domu: TYPE[i.house_type] || null,
      stav_fve: FVE_STAV[i.fve] || null,
      rocni_spotreba_kwh: i.annual_consumption_kwh,
      skore: a.score,
      vyhodnoceni: LEVEL[level],
      uspora_rocne_od_kc: e ? e.saving_year_czk.lo : null,
      uspora_rocne_do_kc: e ? e.saving_year_czk.hi : null,
      verze_vypoctu: (window.KALK && KALK.VERZE) || null
    };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var ui = EH.formUi(form);
    var hp = form.querySelector('input[name="website"]');
    var consentEl = document.getElementById('quizConsentText');
    var score = calcScore();
    var level = score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low';
    var answers = buildAnswers(score);
    var summary = buildSummary(answers, level);
    ui.start();
    EH.submitForm('jom_quiz', {
      name: EH.val('quizName'),
      email: EH.val('quizEmail'),
      phone: EH.val('quizPhone'),
      organization: EH.val('quizOrg'),
      vstupy: answers.inputs,
      vysledek: { schema: 2, score: answers.score, score_max: answers.score_max, estimate: answers.estimate, assumptions: answers.assumptions },
      sloupce: buildColumns(answers, level),
      summary: summary,
      consent: document.getElementById('quizConsent').checked,
      consent_text: consentEl ? consentEl.textContent.trim() : ''
    }, hp && hp.value).then(function () {
      submitted = true;
      ui.done();
      document.getElementById('quizPanel3').hidden = true;
      document.getElementById('quizThankyou').hidden = false;
      var qs = document.querySelector('.jom-quiz__stepper'); if (qs) qs.style.display = 'none';
      var qt = document.querySelector('.jom-quiz__thankyou-title'); if (qt) { qt.setAttribute('tabindex', '-1'); qt.focus(); }
    }).catch(function (err) {
      ui.fail(err.message);
    });
  });
})();
