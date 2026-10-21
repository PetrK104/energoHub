(function () {

  function calcMini(byty) {
    var vykon    = Math.min(Math.max(byty * KALK.FVE_VYKON_NA_BYT, KALK.FVE_MIN_VYKON), KALK.FVE_MAX_VYKON);
    var spotreba = byty * KALK.SPOTREBA_NA_BYT;
    var jom      = byty * KALK.JOM_NA_BYT;

    var vyrobaH = vykon * KALK.FVE_VYROBA_NA_KWP * KALK.FVE_ORIENT_H;
    var vyrobaL = vykon * KALK.FVE_VYROBA_NA_KWP * KALK.FVE_ORIENT_L;

    var fveH = Math.min(vyrobaH * KALK.FVE_VLASTNI_PODIL, spotreba * KALK.FVE_VLASTNI_PODIL) * KALK.FVE_CENA_EL;
    var fveL = Math.min(vyrobaL * KALK.FVE_VLASTNI_PODIL, spotreba * KALK.FVE_VLASTNI_PODIL) * KALK.FVE_CENA_EL;

    return { rocniL: jom + fveL, rocniH: jom + fveH };
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
    return fmtNum(lo) + '–' + fmtNum(hi) + ' Kč';
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
    val = Math.min(Math.max(val, 6), 80);
    slider.value = val;
    update();
  });

  numInput.addEventListener('change', function () {
    var val = parseInt(numInput.value, 10) || 6;
    val = Math.min(Math.max(val, 6), 80);
    numInput.value = val;
    slider.value   = val;
    update();
  });

  update();

})();
