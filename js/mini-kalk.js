(function () {

  // Stejné jádro výpočtu jako hlavní kalkulačka (JOM + FVE); spotřeba i orientace jsou odhadnuté, proto rozpětí ±25 %
  function calcMini(byty) {
    var e = KALK_ENGINE.compute({
      byty: byty,
      spotreba: byty * KALK.SPOTREBA_NA_BYT,
      orient: KALK.ORIENT.J,
      cenaEl: KALK.FVE_CENA_EL,
      rozpeti: KALK.rozpeti(2),
      selected: { jom: true, fve: true }
    });
    var r = KALK.rozpeti(2);
    return { rocniL: e.uspora_celkem * (1 - r), rocniH: e.uspora_celkem * (1 + r) };
  }

  function roundTo(val, step, dir) {
    return dir === 'up'
      ? Math.ceil(val / step) * step
      : Math.floor(val / step) * step;
  }

  function fmtNum(n) {
    return n.toLocaleString('cs-CZ').replace(/ /g, ' ');
  }

  function fmtRange(lo, hi) {
    return fmtNum(lo) + '\u00a0– ' + fmtNum(hi) + '\u00a0Kč';
  }

  function updateSliderFill(range) {
    var pct = (range.value - range.min) / (range.max - range.min) * 100;
    range.style.background =
      'linear-gradient(to right, var(--lime) ' + pct + '%, rgba(255,255,255,.12) ' + pct + '%)';
  }

  function update() {
    var byty = parseInt(slider.value, 10);
    var r    = calcMini(byty);

    var rocniL = roundTo(r.rocniL, 1000, 'down');
    var rocniH = roundTo(r.rocniH, 1000, 'up');
    var mesL   = roundTo(r.rocniL / 12, 100, 'down');
    var mesH   = roundTo(r.rocniH / 12, 100, 'up');
    var bytL   = roundTo(r.rocniL / byty / 12, 10, 'down');
    var bytH   = roundTo(r.rocniH / byty / 12, 10, 'up');

    elRocni.textContent   = fmtRange(rocniL, rocniH);
    elMesicni.textContent = fmtRange(mesL, mesH);
    elByt.textContent     = fmtRange(bytL, bytH);

    var toMain = document.getElementById('miniToMain');
    KALK.nastavOdkaz(toMain, { byty: byty, reseni: ['jom', 'fve'] });

    slider.setAttribute('aria-valuetext', byty + ' bytů');
    updateSliderFill(slider);
  }

  var slider   = document.getElementById('miniKalkByty');
  var numInput = document.getElementById('miniKalkNum');
  var elRocni  = document.getElementById('mkRocni');
  var elMesicni = document.getElementById('mkMesicni');
  var elByt    = document.getElementById('mkByt');

  if (!slider || !numInput || !elRocni) return;

  slider.addEventListener('input', function () {
    numInput.value = slider.value;
    update();
  });

  numInput.addEventListener('input', function () {
    var val = parseInt(numInput.value, 10);
    if (isNaN(val)) return;
    val = Math.min(Math.max(val, KALK.BYTY_MIN), KALK.BYTY_MINI_MAX);
    slider.value = val;
    update();
  });

  numInput.addEventListener('change', function () {
    var val = parseInt(numInput.value, 10) || 6;
    val = Math.min(Math.max(val, KALK.BYTY_MIN), KALK.BYTY_MINI_MAX);
    numInput.value = val;
    slider.value   = val;
    update();
  });

  update();

})();
