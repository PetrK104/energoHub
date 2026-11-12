(function () {
  var PRICE      = (window.KALK && KALK.FVE_CENA_EL) || 6.0;    // Kč/kWh, zdroj: js/kalk-constants.js
  var RANGE      = (window.KALK && KALK.ROZPETI) || 0.15;       // upřesní se v recalculate() podle neznámých vstupů
  var CHART_H    = 300;    // px

  // Podíly vlastní spotřeby jen pro krátké poznámky pod přepínači; výpočet dělá společné jádro (js/kalk-engine.js)
  var SELF_NO_BATTERY = (window.KALK && KALK.FVE_VLASTNI_PODIL) || 0.65;   // s JOM, bez baterie
  var SELF_NO_JOM     = (window.KALK && KALK.FVE_VLASTNI_BEZ_JOM) || 0.20; // bez JOM, bez baterie
  var BATTERY_BOOST   = (window.KALK && KALK.BATERIE_PODIL) || 0.15;       // baterie přidává procentní body

  var CONSUMPTION_PER_APT = (window.KALK && KALK.SPOTREBA_NA_BYT) || 2200;  // kWh/byt/rok, když uživatel nezadá roční spotřebu domu
  var orientTouched = false;

  var sliderApts = document.getElementById('calcApts');
  var numApts    = document.getElementById('calcAptsNum');
  var numConsump = document.getElementById('calcConsumption');

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

  function recalculate() {
    var apts       = parseInt(sliderApts.value, 10) || 12;
    var annualInput = parseFloat(numConsump.value) || 0;
    var orient     = radio('calcOrient') || 'J';
    var hasBattery = radio('calcBattery') === 'yes';
    var hasJom     = radio('calcJom') !== 'no';

    var oFactor   = KALK.ORIENT[orient] || 1;

    // Celková roční spotřeba budovy
    var totalAnnual = annualInput || apts * CONSUMPTION_PER_APT;

    // Jedno pravidlo rozpětí: neznámé vstupy = nevyplněná spotřeba a nezměněná orientace
    RANGE = KALK.rozpeti((annualInput ? 0 : 1) + (orientTouched ? 0 : 1));

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
    var payMin  = Math.max(1, costLo / (savingsSel * (1 + RANGE)));
    var payMax  = costHi / (savingsSel * (1 - RANGE));
    var savYMin = Math.round(savingsSel / 1000 * (1 - RANGE));
    var savYMax = Math.round(savingsSel / 1000 * (1 + RANGE));
    var savMMin = Math.round(mthPerApt * (1 - RANGE));
    var savMMax = Math.round(mthPerApt * (1 + RANGE));

    var costMin = Math.round(costLo / 1000);
    var costMax = Math.round(costHi / 1000);

    // Číselné výsledky pro uložení spolu s poptávkou (fve-form.js)
    window.EH_FVE_LAST = {
      apartments: apts,
      annual_consumption_kwh: annualInput || null,
      consumption_estimated: !annualInput,
      orientation: orient,
      orientation_touched: orientTouched,
      battery: hasBattery,
      jom: hasJom,
      spread: RANGE,
      fve_kwp: eSel.vykon,
      investment_czk: { lo: Math.round(costLo), hi: Math.round(costHi) },
      saving_year_czk: { lo: Math.round(savingsSel * (1 - RANGE)), hi: Math.round(savingsSel * (1 + RANGE)) },
      saving_apt_month_czk: { lo: Math.round(mthPerApt * (1 - RANGE)), hi: Math.round(mthPerApt * (1 + RANGE)) },
      payback_years: { lo: Math.round(payMin * 10) / 10, hi: isFinite(payMax) ? Math.round(payMax * 10) / 10 : null },
      saving_with_jom_czk: Math.round(eSel.uspora_celkem),
      saving_without_jom_czk: Math.round(eSel.uspora_bez_jom)
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
      elRange.textContent = RANGE > (KALK.ROZPETI + 0.001)
        ? 'Rozpětí ±' + Math.round(RANGE * 100) + ' %, protože spotřebu domu a orientaci střechy odhadujeme.'
        : 'Rozpětí ±' + Math.round(RANGE * 100) + ' %.';
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
    barJom.style.height   = Math.max(6, Math.round(savJom   / maxSav * CHART_H)) + 'px';
    barNoJom.style.height = Math.max(6, Math.round(savNoJom / maxSav * CHART_H)) + 'px';
    barJom.style.opacity   = hasJom ? '1' : '.4';
    barNoJom.style.opacity = hasJom ? '.4' : '1';

    // Rozpis úspory: společné prostory (vždy), byty díky JOM, baterie
    var elBar = document.getElementById('bdBar'), elList = document.getElementById('bdList');
    if (elBar && elList) {
      var parts = [
        { cls: 'common',  name: 'Společné prostory', off: '',             val: eNoBat.uspora_bez_jom },
        { cls: 'flats',   name: 'Byty díky JOM',     off: 'bez JOM',      val: hasJom ? (eNoBat.uspora_fve - eNoBat.uspora_bez_jom) + eNoBat.uspora_jom : 0 },
        { cls: 'battery', name: 'Baterie',           off: 'bez baterie',  val: hasBattery ? (hasJom ? eSel.uspora_fve - eNoBat.uspora_fve : eSel.uspora_bez_jom - eNoBat.uspora_bez_jom) : 0 }
      ];
      var sum = parts.reduce(function (a, x) { return a + x.val; }, 0) || 1;
      elBar.innerHTML = parts.filter(function (x) { return x.val > 0; }).map(function (x) {
        return '<span class="fve-calc__bd-seg fve-calc__bd-seg--' + x.cls + '" style="width:' + (x.val / sum * 100).toFixed(1) + '%"></span>';
      }).join('');
      elList.innerHTML = parts.map(function (x) {
        var on = x.val > 0;
        var f = on ? fmtThousands(Math.round(x.val / 1000 * (1 - RANGE)), Math.round(x.val / 1000 * (1 + RANGE))) : null;
        return '<li class="fve-calc__bd-item' + (on ? '' : ' is-off') + '"><span class="fve-calc__bd-name"><i class="fve-calc__bd-dot fve-calc__bd-dot--' + x.cls + '"></i>' + x.name + '</span>' +
          '<span class="fve-calc__bd-val">' + (on ? f.text + ' ' + f.unit : x.off) + '</span></li>';
      }).join('');
    }

    var bj = fmtThousands(Math.round(savJom / 1000 * (1 - RANGE)), Math.round(savJom / 1000 * (1 + RANGE)));
    var bn = fmtThousands(Math.round(savNoJom / 1000 * (1 - RANGE)), Math.round(savNoJom / 1000 * (1 + RANGE)));
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
    numApts.value = sliderApts.value;
    recalculate();
  });

  numApts.addEventListener('input', function () {
    var v = Math.min(KALK.BYTY_MAX, Math.max(KALK.BYTY_MIN, parseInt(numApts.value, 10) || KALK.BYTY_MIN));
    sliderApts.value = v;
    recalculate();
  });

  numApts.addEventListener('change', function () { numApts.value = sliderApts.value; });

  numConsump.addEventListener('input', recalculate);

  document.querySelectorAll('input[name="calcOrient"]').forEach(function (el) {
    el.addEventListener('change', function () { orientTouched = true; recalculate(); });
  });
  document.querySelectorAll('input[name="calcJom"]').forEach(function (el) {
    el.addEventListener('change', recalculate);
  });
  document.querySelectorAll('input[name="calcBattery"]').forEach(function (el) {
    el.addEventListener('change', recalculate);
  });

  recalculate();
})();
