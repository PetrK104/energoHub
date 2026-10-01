(function () {
  var steps = Array.from(document.querySelectorAll('.process-step'));
  if (!steps.length) return;

  function activate(index) {
    steps.forEach(function (s, i) {
      s.classList.toggle('is-active', i === index);
    });
  }

  var dots = steps.map(function (s) { return s.querySelector('.process-step__dot'); });
  var w = window.innerWidth;

  if (w <= 760) {
    // ≤760px: step má display:flex, dot je skrytý — pozorujeme step přímo
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = steps.indexOf(entry.target);
        if (idx !== -1) activate(idx);
      });
    }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });

    steps.forEach(function (step) { observer.observe(step); });
    activate(0);

  } else if (w <= 1100) {
    // 761–1100px: grid 3-sloupcový, dot viditelný — pozorujeme dot
    var observer2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = dots.indexOf(entry.target);
        if (idx !== -1) activate(idx);
      });
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

    dots.forEach(function (dot) { if (dot) observer2.observe(dot); });
    activate(0);

  } else {
    // Desktop: krok nejblíže středu viewportu
    var active = -1;

    function onScroll() {
      var center = window.innerHeight / 2;
      var closest = 0;
      var minDist = Infinity;
      dots.forEach(function (dot, i) {
        if (!dot) return;
        var rect = dot.getBoundingClientRect();
        var dist = Math.abs(rect.top + rect.height / 2 - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      if (closest !== active) { active = closest; activate(closest); }
    }

    var section = document.querySelector('.process');
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      } else {
        window.removeEventListener('scroll', onScroll);
      }
    }, { threshold: 0 });

    if (section) io.observe(section);
    activate(0);
  }
})();
