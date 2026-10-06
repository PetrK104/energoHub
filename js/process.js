(function () {
  var steps = Array.from(document.querySelectorAll('.process-step'));
  if (!steps.length) return;

  var dots   = steps.map(function (s) { return s.querySelector('.process-step__dot'); });
  var active = -1;
  var rafId  = null;

  function activate(index) {
    steps.forEach(function (s, i) {
      s.classList.toggle('is-active', i === index);
    });
  }

  function calc() {
    rafId = null;
    var mid = window.innerHeight / 2;
    var w   = window.innerWidth;

    // Na mobilu (≤760px) sledujeme celý step, jinak dot
    var targets = w <= 760
      ? steps
      : dots.map(function (d, i) { return d || steps[i]; });

    // Poslední prvek jehož horní hrana je na nebo nad středem — spolehlivé pro oba směry
    var newActive = 0;
    targets.forEach(function (el, i) {
      if (!el) return;
      if (el.getBoundingClientRect().top <= mid) newActive = i;
    });

    if (newActive !== active) { active = newActive; activate(newActive); }
  }

  function onScroll() {
    if (!rafId) rafId = requestAnimationFrame(calc);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  activate(0);
  setTimeout(calc, 120);
})();
