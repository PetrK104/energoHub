var KALK = {
  JOM_NA_BYT:        2000,
  FVE_VYROBA_NA_KWP: 1000,
  FVE_VLASTNI_PODIL: 0.65,   // vlastní spotřeba FVE s JOM (bez baterie)
  FVE_VLASTNI_BEZ_JOM: 0.20, // vlastní spotřeba FVE bez JOM, jen společné prostory (bez baterie)
  // Cena elektřiny nahrazené FVE (Kč/kWh, proměnná část vč. DPH).
  // JEDINÉ místo, kde se cena mění: používají ji kalkulačky i texty s atributem data-kalk-cena.
  FVE_CENA_EL:       6.0,
  FVE_ORIENT_H:      1.0,
  FVE_ORIENT_L:      0.75,
  FVE_MIN_VYKON:     20,
  FVE_MAX_VYKON:     60,
  FVE_VYKON_NA_BYT:  40 / 24,
  SPOTREBA_NA_BYT:   3333
};

// Texty s cenou: <b data-kalk-cena="1">6,0</b> se po načtení přepíše na aktuální KALK.FVE_CENA_EL
// (počet desetinných míst určuje hodnota atributu). Pevný text v HTML slouží jako záloha bez JS.
(function () {
  function fill() {
    var els = document.querySelectorAll('[data-kalk-cena]');
    for (var i = 0; i < els.length; i++) {
      var d = parseInt(els[i].getAttribute('data-kalk-cena'), 10);
      els[i].textContent = KALK.FVE_CENA_EL.toFixed(isNaN(d) ? 1 : d).replace('.', ',');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
  else fill();
})();
