(function () {
  var PRICE      = (window.KALK && KALK.FVE_CENA_EL) || 6.0;    // Kč/kWh, zdroj: js/kalk-constants.js
  var YIELD      = 1000;   // kWh/kWp/rok
  var COST_KWP   = 25500;  // Kč/kWp (bez baterie; 27–31 tis. s LFP baterií)
  var RANGE      = 0.15;   // ±15 %
  var CHART_H    = 300;    // px

  // Podíl vlastní spotřeby (self-consumption ratio)
  // Bez baterie: model počítá s 65 % pokrytím roční spotřeby přes JOM.
  // S baterií: baterie zvyšuje self-consumption o 15 pp — konzervativní střed rozsahu
  // 15–20 pp zjištěného pro bytové budovy s denním cyklem (Fraunhofer ISE 2022).
  var SELF_NO_BATTERY = (window.KALK && KALK.FVE_VLASTNI_PODIL) || 0.65;   // s JOM, bez baterie (js/kalk-constants.js)
  var SELF_NO_JOM     = (window.KALK && KALK.FVE_VLASTNI_BEZ_JOM) || 0.20;   // bez JOM, bez baterie (js/kalk-constants.js)
  var BATTERY_BOOST   = 0.15;   // baterie přidává 15 procentních bodů
  var JOM_ADDON       = 200000; // Kč, stejná hodnota jako v js/fve-costs.js

  // Cena bateriového úložiště na bytovou jednotku
  // Orientační kapacita: 0,5 kWh/byt; instalovaný LFP systém v ČR 2024–2025: ~20 000 Kč/kWh.
  // Výsledek 10 000 Kč/byt je orientační — závisí na kapacitě a dodavateli.
  var BATTERY_COST_PER_APT = 10000;

  var ORIENT = { J: 1.00, JZ: 0.93, JV: 0.93, V: 0.77, Z: 0.77, S: 0.58 };
  var INSUL  = { weak: 1.25, mid: 1.00, good: 0.80 };

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

  function radio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function recalculate() {
    var apts       = parseInt(sliderApts.value, 10) || 12;
    var consump    = parseInt(numConsump.value, 10) || 200;
    var orient     = radio('calcOrient') || 'J';
    var insul      = radio('calcInsul')  || 'mid';
    var hasBattery = radio('calcBattery') === 'yes';
    var hasJom     = radio('calcJom') !== 'no';

    var oFactor   = ORIENT[orient] || 1;
    var iFactor   = INSUL[insul]   || 1;

    // Celková roční spotřeba budovy
    var totalAnnual = apts * consump * 12 * iFactor;

    // Podíl vlastní spotřeby podle varianty (JOM × baterie)
    function selfRatio(jom, battery) {
      var base = jom ? SELF_NO_BATTERY : SELF_NO_JOM;
      return base + (battery ? BATTERY_BOOST : 0);
    }

    // Stejný systém pro obě varianty (dimenzovaný pro dům s JOM), aby šlo srovnat, co JOM přináší
    var sizeKwp     = totalAnnual * selfRatio(true, hasBattery) / (YIELD * oFactor);
    var batteryCost = hasBattery ? apts * BATTERY_COST_PER_APT : 0;
    function systemCost(jom) { return sizeKwp * COST_KWP + batteryCost + (jom ? JOM_ADDON : 0); }
    function savings(jom, battery) { return totalAnnual * selfRatio(jom, battery) * PRICE; }

    var cost       = systemCost(hasJom);
    var savingsSel = savings(hasJom, hasBattery);
    var payback    = cost / savingsSel;
    var mthPerApt  = savingsSel / 12 / apts;

    // Rozsahy ±15 %
    var payMin  = Math.max(1, +(payback   * (1 - RANGE)).toFixed(1));
    var payMax  = +(payback   * (1 + RANGE)).toFixed(1);
    var savYMin = Math.round(savingsSel / 1000 * (1 - RANGE));
    var savYMax = Math.round(savingsSel / 1000 * (1 + RANGE));
    var savMMin = Math.round(mthPerApt * (1 - RANGE));
    var savMMax = Math.round(mthPerApt * (1 + RANGE));

    var costMin = Math.round(cost * (1 - RANGE) / 1000);
    var costMax = Math.round(cost * (1 + RANGE) / 1000);

    elPayback.textContent     = payMin + ' – ' + payMax;
    elSavingsYear.textContent = savYMin + ' – ' + savYMax;
    elSavingsMth.textContent  = savMMin + ' – ' + savMMax;

    var elCostTotal = document.getElementById('resCostTotal');
    if (elCostTotal) elCostTotal.textContent = costMin + ' – ' + costMax;

    // Sloupcový graf — vždy stejné srovnání S JOM × Bez JOM (stejný systém, baterie dle výběru);
    // vybraná varianta je zvýrazněná, druhá ztlumená
    var savJom   = savings(true,  hasBattery);
    var savNoJom = savings(false, hasBattery);
    var maxSav   = Math.max(savJom, savNoJom);
    barJom.style.height   = Math.max(6, Math.round(savJom   / maxSav * CHART_H)) + 'px';
    barNoJom.style.height = Math.max(6, Math.round(savNoJom / maxSav * CHART_H)) + 'px';
    barJom.style.opacity   = hasJom ? '1' : '.4';
    barNoJom.style.opacity = hasJom ? '.4' : '1';

    barJomV.textContent   = Math.round(savJom   / 1000 * (1 - RANGE)) + ' – ' + Math.round(savJom   / 1000 * (1 + RANGE)) + ' tis. Kč';
    barNoJomV.textContent = Math.round(savNoJom / 1000 * (1 - RANGE)) + ' – ' + Math.round(savNoJom / 1000 * (1 + RANGE)) + ' tis. Kč';
    if (elChartNote) {
      elChartNote.textContent = 'Stejný systém ' + (hasBattery ? 's baterií' : 'bez baterie') +
        '. S JOM využijí vyrobenou elektřinu všechny byty, bez JOM hlavně společné prostory.';
    }

    // Poznámky pod přepínači
    function pct(x) { return Math.round(x * 100); }
    if (elJomNote) {
      elJomNote.textContent = hasJom
        ? 'S JOM: dům sdílí vyrobenou elektřinu mezi byty, orientační vlastní spotřeba ~' + pct(selfRatio(true, false)) + ' % roční výroby. Cena zahrnuje JOM (rozvaděč, měření, ~' + (JOM_ADDON / 1000) + ' 000 Kč).'
        : 'Bez JOM: výrobu využijí hlavně společné prostory, orientační vlastní spotřeba ~' + pct(selfRatio(false, false)) + ' % roční výroby. Systém je stejný jako u varianty s JOM, většina výroby (zhruba 75–85 %) tak odtéká do sítě. Pozor: bezúročný úvěr NZÚ nepodporuje FVE jen pro společné prostory – elektřinu musí přednostně využívat byty.';
    }
    if (elBatteryNote) {
      elBatteryNote.textContent = hasBattery
        ? 'S baterií: vlastní spotřeba roste o ~' + pct(BATTERY_BOOST) + ' procentních bodů (odhad pro bytové domy; závisí na kapacitě úložiště a křivce spotřeby). Cena zahrnuje odhadovaný náklad baterie ' + (BATTERY_COST_PER_APT / 1000).toFixed(0) + ' 000 Kč/byt.'
        : 'Bez baterie: přebytky odchází do distribuční sítě.';
    }
  }

  sliderApts.addEventListener('input', function () {
    numApts.value = sliderApts.value;
    recalculate();
  });

  numApts.addEventListener('input', function () {
    var v = Math.min(60, Math.max(2, parseInt(numApts.value, 10) || 2));
    sliderApts.value = v;
    recalculate();
  });

  numConsump.addEventListener('input', recalculate);

  document.querySelectorAll('input[name="calcOrient"]').forEach(function (el) {
    el.addEventListener('change', recalculate);
  });
  document.querySelectorAll('input[name="calcInsul"]').forEach(function (el) {
    el.addEventListener('change', recalculate);
  });
  document.querySelectorAll('input[name="calcJom"]').forEach(function (el) {
    el.addEventListener('change', recalculate);
  });
  document.querySelectorAll('input[name="calcBattery"]').forEach(function (el) {
    el.addEventListener('change', recalculate);
  });

  recalculate();
})();
