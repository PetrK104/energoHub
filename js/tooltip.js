(function () {
  var tips = document.querySelectorAll('.jom-edc__tip');
  if (!tips.length) return;
  var margin = 16;
  var navbarClearance = 96;

  function place(tip) {
    var pop = tip.querySelector('.jom-edc__tip-popup');
    if (!pop) return;
    pop.style.left = '0';
    var t = tip.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var left = Math.max(margin, Math.min(t.left, vw - margin - pop.offsetWidth));
    pop.style.left = (left - t.left) + 'px';
    pop.classList.toggle('is-below', t.top - pop.offsetHeight - 8 < navbarClearance);
  }

  tips.forEach(function (tip) {
    tip.addEventListener('mouseenter', function () { place(tip); });
    tip.addEventListener('focusin', function () { place(tip); });
    tip.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') tip.blur();
    });
  });
})();
