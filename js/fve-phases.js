(function () {
  const phases = document.querySelectorAll('#fvePhases .fve-phase');

  function activate(index) {
    phases.forEach(function (p, i) {
      p.classList.toggle('is-active', i === index);
    });
  }

  phases.forEach(function (phase, i) {
    // klik na zabalenou kartu ji rozbalí
    phase.addEventListener('click', function () {
      if (!phase.classList.contains('is-active')) activate(i);
    });

    // šipky v těle karty
    phase.querySelectorAll('.fve-phase__btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (btn.classList.contains('fve-phase__btn--next')) {
          activate(i + 1);
        } else {
          activate(i - 1);
        }
      });
    });
  });
})();
