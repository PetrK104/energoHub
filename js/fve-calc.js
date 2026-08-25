(function () {
  var PRICE      = 5.5;    // Kč/kWh
  var YIELD      = 1050;   // kWh/kWp/rok
  var COST_KWP   = 35000;  // Kč/kWp
  var RANGE      = 0.15;   // ±15 %
  var CHART_H    = 300;    // px

  // Podíl vlastní spotřeby (self-consumption ratio)
  // Bez baterie: model počítá s 50 % pokrytím roční spotřeby přes JOM.
  // S baterií: baterie zvyšuje self-consumption o 15 pp — konzervativní střed rozsahu
  // 15–20 pp zjištěného pro bytové budovy s denním cyklem (Fraunhofer ISE 2022).
  var SELF_NO_BATTERY = 0.50;
  var SELF_BATTERY    = 0.65;

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

    var oFactor   = ORIENT[orient] || 1;
    var iFactor   = INSUL[insul]   || 1;
    var selfRatio = hasBattery ? SELF_BATTERY : SELF_NO_BATTERY;

    // Celková roční spotřeba budovy
    var totalAnnual = apts * consump * 12 * iFactor;

    // Bez JOM — jen společné prostory (nemění se s baterií)
    var commonAnnual = apts * 600;
    var savingsNoJom = commonAnnual * PRICE;

    // S JOM — podíl pokrytý FVE závisí na přepínači baterie
    var sizeJom     = totalAnnual * selfRatio / (YIELD * oFactor);
    var batteryCost = hasBattery ? apts * BATTERY_COST_PER_APT : 0;
    var systemCost  = sizeJom * COST_KWP + batteryCost;
    var savingsJom  = totalAnnual * selfRatio * PRICE;
    var payback     = systemCost / savingsJom;
    var mthPerApt   = savingsJom / 12 / apts;

    // Rozsahy ±15 %
    var payMin  = Math.max(1, +(payback   * (1 - RANGE)).toFixed(1));
    var payMax  = +(payback   * (1 + RANGE)).toFixed(1);
    var savYMin = Math.round(savingsJom / 1000 * (1 - RANGE));
    var savYMax = Math.round(savingsJom / 1000 * (1 + RANGE));
    var savMMin = Math.round(mthPerApt * (1 - RANGE));
    var savMMax = Math.round(mthPerApt * (1 + RANGE));

    elPayback.textContent     = payMin + ' – ' + payMax;
    elSavingsYear.textContent = savYMin + ' – ' + savYMax;
    elSavingsMth.textContent  = savMMin + ' – ' + savMMax;

    // Sloupcový graf — pravý sloupec závisí na stavu přepínače
    var refSavings, refMin, refMax;
    if (hasBattery) {
      // Referenční hodnota: stejný systém bez baterie (50 % pokrytí)
      refSavings = totalAnnual * SELF_NO_BATTERY * PRICE;
      barJom.querySelector('.fve-calc__bar-name').textContent   = 'S baterií + JOM';
      barNoJom.querySelector('.fve-calc__bar-name').textContent = 'Bez baterie';
    } else {
      // Referenční hodnota: jen společné prostory bez JOM
      refSavings = savingsNoJom;
      barJom.querySelector('.fve-calc__bar-name').textContent   = 'S JOM';
      barNoJom.querySelector('.fve-calc__bar-name').textContent = 'Bez JOM';
    }

    var refPct = Math.min(Math.round((refSavings / savingsJom) * 100), 100);
    barJom.style.height   = CHART_H + 'px';
    barNoJom.style.height = Math.max(6, Math.round((refPct / 100) * CHART_H)) + 'px';

    refMin = Math.round(refSavings / 1000 * (1 - RANGE));
    refMax = Math.round(refSavings / 1000 * (1 + RANGE));
    barJomV.textContent   = savYMin + ' – ' + savYMax + ' tis. Kč';
    barNoJomV.textContent = refMin + ' – ' + refMax + ' tis. Kč';

    // Poznámka pod přepínačem
    if (elBatteryNote) {
      elBatteryNote.textContent = hasBattery
        ? 'S baterií: orientační vlastní spotřeba ~65 % roční výroby (odhad pro bytové domy; závisí na kapacitě úložiště a křivce spotřeby). Cena zahrnuje odhadovaný náklad baterie ' + (BATTERY_COST_PER_APT / 1000).toFixed(0) + ' 000 Kč/byt.'
        : 'Bez baterie: orientační vlastní spotřeba ~50 % roční výroby. Přebytky odchází do distribuční sítě.';
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
  document.querySelectorAll('input[name="calcBattery"]').forEach(function (el) {
    el.addEventListener('change', recalculate);
  });

  recalculate();
})();
