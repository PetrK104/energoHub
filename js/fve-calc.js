(function () {
  var PRICE      = (window.KALK && KALK.FVE_CENA_EL) || 6.0;    // Kč/kWh, zdroj: js/kalk-constants.js
  var RANGE      = (window.KALK && KALK.ROZPETI) || 0.15;       // upřesní se v recalculate() podle neznámých vstupů

  // Podíly vlastní spotřeby jen pro krátké poznámky pod přepínači; výpočet dělá společné jádro (js/kalk-engine.js)
  var SELF_NO_BATTERY = (window.KALK && KALK.FVE_VLASTNI_PODIL) || 0.60;   // s JOM, bez baterie
  var SELF_NO_JOM     = (window.KALK && KALK.FVE_VLASTNI_BEZ_JOM) || 0.25; // bez JOM, bez baterie
  var BATTERY_BOOST   = (window.KALK && KALK.BATERIE_PODIL) || 0.15;       // baterie přidává procentní body

  var CONSUMPTION_PER_APT = (window.KALK && KALK.SPOTREBA_NA_BYT) || 2200;  // kWh/byt/rok, když uživatel nezadá roční spotřebu domu
  var orientTouched = false;
  var aptsTouched = false;   // výsledky se ukážou až po vyplnění počtu bytů, spotřeby a orientace střechy
  var noConsump = document.getElementById('calcConsumptionUnknown');
  var stepCalc = document.getElementById('stepCalc');

  var sliderApts = document.getElementById('calcApts');
  var numApts    = document.getElementById('calcAptsNum');
  var numConsump = document.getElementById('calcAdvance');   // měsíční záloha na elektřinu v typickém bytě (Kč)

  var elPayback      = document.getElementById('resPayback');
  var elSavingsYear  = document.getElementById('resSavingsYear');
  var elSavingsMth   = document.getElementById('resSavingsMth');
  var barJom         = document.getElementById('barJom');
  var barJomV        = document.getElementById('barJomVal');
  var barNoJom       = document.getElementById('barNoJom');
  var barNoJomV      = document.getElementById('barNoJomVal');
  var elBatteryNote  = document.getElementById('calcBatteryNote');
  var elJomNote      = document.getElementById('calcJomNote');
  var elChartNote    = document.getElementById('calcChartNote');

  if (!sliderApts || !elPayback) return;

  // Částky v tisících Kč; od 1 000 tis. výš se zobrazí v milionech (např. 1,7 – 2,3 mil. Kč)
  function fmtThousands(minK, maxK) {
    if (maxK >= 1000) {
      var m = function (v) { return (v / 1000).toFixed(1).replace('.', ','); };
      return { text: m(minK) + ' – ' + m(maxK), unit: 'mil. Kč' };
    }
    return { text: minK + ' – ' + maxK, unit: 'tis. Kč' };
  }

  function setUnit(valueEl, unit, suffix) {
    var box = valueEl && valueEl.closest('.fve-calc__result');
    var u = box && box.querySelector('.fve-calc__result-unit');
    if (u) u.textContent = unit + suffix;
  }

  function radio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  // Dokud chybí povinné vstupy: pomlčky místo čísel, grafy jen připravené (vyprázdněné)
  function showEmpty() {
    window.EH_FVE_LAST = null;
    elPayback.textContent = '–';
    elSavingsYear.textContent = '–';  setUnit(elSavingsYear, 'tis. Kč', ' / rok');
    elSavingsMth.textContent = '–';
    var ec = document.getElementById('resCostTotal');
    if (ec) { ec.textContent = '–'; setUnit(ec, 'tis. Kč', ' instalace'); }
    barJomV.textContent = '–'; barNoJomV.textContent = '–';
    barJom.style.height = '0%'; barNoJom.style.height = '0%';
    var eb = document.getElementById('bdBar'), el = document.getElementById('bdList');
    if (eb) eb.innerHTML = '';
    if (el) el.innerHTML = ['Společné prostory', 'Byty (FVE + JOM)', 'Baterie'].map(function (n) {
      return '<li class="fve-calc__bd-item is-off"><span class="fve-calc__bd-name"><i class="fve-calc__bd-dot"></i>' + n + '</span><span class="fve-calc__bd-val">–</span></li>';
    }).join('');
    var rn = document.getElementById('calcRangeNote'); if (rn) rn.textContent = '';
    var jomOn = radio('calcJom') !== 'no', batOn = radio('calcBattery') === 'yes';
    if (elJomNote) elJomNote.textContent = jomOn
      ? 'Dům sdílí vyrobenou elektřinu mezi byty (využití ~' + Math.round(SELF_NO_BATTERY * 100) + ' %).'
      : 'Výrobu využijí hlavně společné prostory (~' + Math.round(SELF_NO_JOM * 100) + ' %). Úvěr NZÚ takovou FVE nepodporuje.';
    if (elBatteryNote) elBatteryNote.textContent = batOn
      ? 'Baterie uloží přebytky na večer, využití výroby roste o ~' + Math.round(BATTERY_BOOST * 100) + ' p. b.'
      : 'Přebytky odchází do distribuční sítě.';
    if (elChartNote) elChartNote.textContent = '';
  }

  function recalculate() {
    var advance    = (noConsump && noConsump.checked) ? 0 : ((window.EH && EH.numIn ? EH.numIn(numConsump) : parseFloat(numConsump.value)) || 0);
    var orientVal  = radio('calcOrient');            // null = nevybráno, 'N' = nevím
    var ready = aptsTouched && (advance > 0 || (noConsump && noConsump.checked)) && !!orientVal;
    if (stepCalc) stepCalc.classList.toggle('is-empty', !ready);
    if (!ready) { showEmpty(); return; }
    var apts       = parseInt(sliderApts.value, 10) || 12;
    var annualInput = advance > 0 ? KALK.spotrebaZeZalohy(apts, advance) : 0;   // kWh/rok z měsíční zálohy
    var orient     = orientVal === 'N' ? 'J' : orientVal;
    var hasBattery = radio('calcBattery') === 'yes';
    var hasJom     = radio('calcJom') !== 'no';

    var oFactor   = KALK.ORIENT[orient] || 1;

    // Celková roční spotřeba budovy
    var totalAnnual = annualInput || apts * CONSUMPTION_PER_APT;

    // Jedno pravidlo rozpětí: neznámé vstupy = nevyplněná spotřeba a nezměněná orientace
    RANGE = KALK.rozpeti([annualInput ? 'zaloha' : 'spotreba', orientTouched ? '' : 'orientace']);

    // Podíl vlastní spotřeby podle varianty (JOM × baterie), jen pro poznámky pod přepínači
    function selfRatio(jom, battery) {
      var base = jom ? SELF_NO_BATTERY : SELF_NO_JOM;
      return base + (battery ? BATTERY_BOOST : 0);
    }

    // Stejné jádro výpočtu jako hlavní kalkulačka (velikost FVE podle spotřeby a pravidel NZÚ, úspora z FVE i z poplatků JOM)
    function eng(battery) {
      return KALK_ENGINE.compute({
        byty: apts, spotreba: totalAnnual, orient: oFactor, cenaEl: PRICE,
        baterie: battery, rozpeti: RANGE, selected: { jom: true, fve: true }
      });
    }
    var eSel = eng(hasBattery), eNoBat = eng(false);

    var cost       = hasJom ? eSel.investice_fve : eSel.investice_fve_bez_jom;
    var savingsSel = hasJom ? eSel.uspora_celkem : eSel.uspora_bez_jom;
    var payback    = cost / savingsSel;
    var mthPerApt  = savingsSel / 12 / apts;

    // Rozsahy (stejný vzorec jako v hlavní kalkulačce: investice v rozpětí proti úspoře v rozpětí)
    // FVE (a baterie) v rozpětí ±RANGE, JOM v rozpětí cen z ceníku (KALK.jomInvestice)
    var jomR    = hasJom ? KALK.jomInvestice(apts) : { lo: 0, hi: 0 };
    var fveCost = eSel.investice_fve_bez_jom;
    var costLo  = fveCost * (1 - RANGE) + jomR.lo;
    var costHi  = fveCost * (1 + RANGE) + jomR.hi;
    // Úspora z JOM vychází z průměru (distributora ani jistič se tu neptáme), proto má širší rozpětí než zbytek (jako v hlavní kalkulačce)
    var RANGE_JOM = KALK.rozpeti(['distributor', 'pripojeni']);
    function band(val, jomPart) {
      var rest = val - jomPart;
      return { lo: rest * (1 - RANGE) + jomPart * (1 - RANGE_JOM), hi: rest * (1 + RANGE) + jomPart * (1 + RANGE_JOM) };
    }
    var jomUs   = hasJom ? eSel.uspora_jom : 0;
    var bSel    = band(savingsSel, jomUs);
    // Návratnost: investice a úspora rostou spolu s velikostí FVE (spotřeba se v poměru zkrátí),
    // proto se do jejího rozpětí nepočítá nejistota spotřeby, jen cena, orientace a podíl JOM
    var payC    = (costLo + costHi) / 2 / savingsSel;
    var rPay    = Math.sqrt(Math.pow(KALK.NEJISTOTA.zaklad, 2) + Math.pow(KALK.rozpeti([orientTouched ? '' : 'orientace', hasJom ? 'distributor' : '', hasJom ? 'pripojeni' : '']), 2));
    var payMin  = Math.max(1, payC * (1 - rPay));
    var payMax  = payC * (1 + rPay);
    var savYMin = Math.round(bSel.lo / 1000);
    var savYMax = Math.round(bSel.hi / 1000);
    var savMMin = Math.round(bSel.lo / 12 / apts);
    var savMMax = Math.round(bSel.hi / 12 / apts);

    var costMin = Math.round(costLo / 1000);
    var costMax = Math.round(costHi / 1000);

    // Čitelné vstupy a výsledky pro uložení spolu s poptávkou (fve-form.js), stejný styl jako hlavní kalkulačka
    var E = KALK_ENGINE;
    window.EH_FVE_LAST = {
      inputs: {
        apartments: apts,
        annual_consumption_kwh: annualInput || null,
        monthly_advance_czk: advance || null,
        consumption_estimated: !annualInput,
        selected: ['fve'],
        orientation: orient,
        orientation_touched: orientTouched,
        battery: hasBattery,
        jom: hasJom,
        spread: RANGE
      },
      result: {
        fve: {
          fve_kwp: eSel.vykon,
          limited_by: eSel.fveOmezeni || null,
          battery: hasBattery,
          includes_jom: hasJom,
          investment_czk: { lo: E.kc(costLo), hi: E.kc(costHi) },
          saving_year_czk: { lo: E.kc(bSel.lo), hi: E.kc(bSel.hi) },
          saving_apt_month_czk: { lo: E.kc(bSel.lo / 12 / apts), hi: E.kc(bSel.hi / 12 / apts) },
          payback_years: { lo: E.let(payMin), hi: E.let(payMax) }
        },
        comparison: {
          saving_with_jom_czk: E.kc(eSel.uspora_celkem),
          saving_without_jom_czk: E.kc(eSel.uspora_bez_jom)
        }
      }
    };

    var comma = function (v) { return v.toFixed(1).replace('.', ','); };
    elPayback.textContent     = comma(payMin) + ' – ' + comma(payMax);
    var savY = fmtThousands(savYMin, savYMax);
    elSavingsYear.textContent = savY.text;
    setUnit(elSavingsYear, savY.unit, ' / rok');
    elSavingsMth.textContent  = savMMin.toLocaleString('cs-CZ') + ' – ' + savMMax.toLocaleString('cs-CZ');  // od 1 000 s mezerou

    var toMain = document.getElementById('calcToMain');
    KALK.nastavOdkaz(toMain, { byty: apts, spotreba: annualInput, orientace: orientTouched ? orient : '', reseni: hasJom ? ['fve', 'jom'] : ['fve'] });

    var elRange = document.getElementById('calcRangeNote');
    if (elRange) {
      var odhad = [];
      if (!annualInput) odhad.push('spotřebu domu'); else odhad.push('spotřebu z výše zálohy');
      if (!orientTouched) odhad.push('orientaci střechy');
      var base = 'Rozpětí ±' + Math.round(RANGE * 100) + ' %, protože ' + odhad.join(' a ') + ' odhadujeme.';
      var jomTxt = hasJom && RANGE_JOM > RANGE + 0.001
        ? base + ' Úspora z JOM má ±' + Math.round(RANGE_JOM * 100) + ' %, protože neznáme distributora ani jistič.'
        : base;
      elRange.textContent = jomTxt + ' Od úspory je odečten provoz FVE (servis, revize, připojení), asi ' + Math.round(eSel.provoz_fve / 1000) + ' tis. Kč ročně' + (hasJom ? ', rozúčtování JOM je už v úspoře z JOM.' : '.');
    }

    var elCostTotal = document.getElementById('resCostTotal');
    if (elCostTotal) {
      var costF = fmtThousands(costMin, costMax);
      elCostTotal.textContent = costF.text;
      setUnit(elCostTotal, costF.unit, ' instalace');
    }

    // Sloupcový graf — vždy stejné srovnání S JOM × Bez JOM (stejný systém, baterie dle výběru);
    // vybraná varianta je zvýrazněná, druhá ztlumená
    var savJom   = eSel.uspora_celkem;     // s JOM včetně úspory z poplatků JOM
    var savNoJom = eSel.uspora_bez_jom;    // stejný systém bez JOM
    var maxSav   = Math.max(savJom, savNoJom);
    barJom.style.height  = Math.max(3, Math.round(savJom   / maxSav * 100)) + '%';
    barNoJom.style.height= Math.max(3, Math.round(savNoJom / maxSav * 100)) + '%';
    barJom.style.opacity   = hasJom ? '1' : '.4';
    barNoJom.style.opacity = hasJom ? '.4' : '1';

    // Rozpis úspory: společné prostory (vždy), byty díky JOM, baterie
    // Společné prostory: odhad spotřeby na byt × podíl pokrytý FVE × ocenění kWh; zbytek úspory z FVE patří bytům (díky JOM)
    var spolecne = Math.min(apts * KALK.SPOLECNE_KWH_NA_BYT * KALK.SPOLECNE_PODIL * KALK.FVE_OCENENI_KWH * (PRICE / KALK.FVE_CENA_EL), eNoBat.uspora_fve);
    var elBar = document.getElementById('bdBar'), elList = document.getElementById('bdList');
    if (elBar && elList) {
      var parts = [
        { cls: 'common',  name: 'Společné prostory', off: '',             val: spolecne },
        { cls: 'flats',   name: 'Byty (FVE + JOM)',     off: 'bez JOM',      val: hasJom ? (eNoBat.uspora_fve - spolecne) + eNoBat.uspora_jom : 0, jom: hasJom ? eNoBat.uspora_jom : 0 },
        { cls: 'battery', name: 'Baterie',           off: 'bez baterie',  val: hasBattery ? (hasJom ? eSel.uspora_fve - eNoBat.uspora_fve : eSel.uspora_bez_jom - eNoBat.uspora_bez_jom) : 0 }
      ];
      var sum = parts.reduce(function (a, x) { return a + x.val; }, 0) || 1;
      elBar.innerHTML = parts.filter(function (x) { return x.val > 0; }).map(function (x) {
        return '<span class="fve-calc__bd-seg fve-calc__bd-seg--' + x.cls + '" style="width:' + (x.val / sum * 100).toFixed(1) + '%"></span>';
      }).join('');
      elList.innerHTML = parts.map(function (x) {
        var on = x.val > 0;
        var bp = band(x.val, x.jom || 0);
        var f = on ? fmtThousands(Math.round(bp.lo / 1000), Math.round(bp.hi / 1000)) : null;
        return '<li class="fve-calc__bd-item' + (on ? '' : ' is-off') + '"><span class="fve-calc__bd-name"><i class="fve-calc__bd-dot fve-calc__bd-dot--' + x.cls + '"></i>' + x.name + '</span>' +
          '<span class="fve-calc__bd-val">' + (on ? f.text + ' ' + f.unit : x.off) + '</span></li>';
      }).join('');
    }

    var bjB = band(savJom, eSel.uspora_jom), bnB = band(savNoJom, 0);
    var bj = fmtThousands(Math.round(bjB.lo / 1000), Math.round(bjB.hi / 1000));
    var bn = fmtThousands(Math.round(bnB.lo / 1000), Math.round(bnB.hi / 1000));
    barJomV.textContent   = bj.text + ' ' + bj.unit;
    barNoJomV.textContent = bn.text + ' ' + bn.unit;
    if (elChartNote) {
      elChartNote.textContent = 'Stejný systém ' + (hasBattery ? 's baterií' : 'bez baterie') +
        '. S JOM využijí vyrobenou elektřinu všechny byty, bez JOM hlavně společné prostory.';
    }

    // Poznámky pod přepínači (krátké)
    function pct(x) { return Math.round(x * 100); }
    if (elJomNote) {
      elJomNote.textContent = hasJom
        ? 'Dům sdílí vyrobenou elektřinu mezi byty (využití ~' + pct(selfRatio(true, false)) + ' %).'
        : 'Výrobu využijí hlavně společné prostory (~' + pct(selfRatio(false, false)) + ' %). Úvěr NZÚ takovou FVE nepodporuje.';
    }
    if (elBatteryNote) {
      elBatteryNote.textContent = hasBattery
        ? 'Baterie uloží přebytky na večer, využití výroby roste o ~' + pct(BATTERY_BOOST) + ' p. b.'
        : 'Přebytky odchází do distribuční sítě.';
    }
  }

  sliderApts.addEventListener('input', function () {
    aptsTouched = true;
    numApts.value = sliderApts.value;
    recalculate();
  });

  numApts.addEventListener('input', function () {
    if (numApts.value === '') { aptsTouched = false; recalculate(); return; }   // vymazané pole = zase bez výsledků
    aptsTouched = true;
    var v = Math.min(KALK.BYTY_MAX, Math.max(KALK.BYTY_MIN, parseInt(numApts.value, 10) || KALK.BYTY_MIN));
    sliderApts.value = v;
    recalculate();
  });

  numApts.addEventListener('change', function () { if (aptsTouched) numApts.value = sliderApts.value; });

  numConsump.addEventListener('input', recalculate);
  if (noConsump) noConsump.addEventListener('change', function () {
    numConsump.disabled = noConsump.checked;
    if (noConsump.checked) numConsump.value = '';
    recalculate();
  });

  document.querySelectorAll('input[name="calcOrient"]').forEach(function (el) {
    el.addEventListener('change', function () { orientTouched = el.value !== 'N'; recalculate(); });
  });
  document.querySelectorAll('input[name="calcJom"]').forEach(function (el) {
    el.addEventListener('change', recalculate);
  });
  document.querySelectorAll('input[name="calcBattery"]').forEach(function (el) {
    el.addEventListener('change', recalculate);
  });

  recalculate();
})();
