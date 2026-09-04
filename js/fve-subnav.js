(function () {
  var nav = document.querySelector('.fve-subnav');
  if (!nav) return;

  var inner = nav.querySelector('.fve-subnav__inner');
  var links = Array.from(nav.querySelectorAll('.fve-subnav__link'));
  var sections = links.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);

  function setActive(id) {
    links.forEach(function (a) {
      var active = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', active);
      if (active) a.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-80px 0px -55% 0px', threshold: 0 });

  sections.forEach(function (s) { observer.observe(s); });

  // Scroll arrows
  var btnL = nav.querySelector('.fve-subnav__arrow--left');
  var btnR = nav.querySelector('.fve-subnav__arrow--right');
  if (!btnL || !btnR || !inner) return;

  function updateArrows() {
    var sl = inner.scrollLeft;
    var maxScroll = inner.scrollWidth - inner.clientWidth;
    btnL.classList.toggle('is-visible', sl > 4);
    btnR.classList.toggle('is-visible', sl < maxScroll - 4);
  }

  inner.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  var scrollAmount = 240;
  btnL.addEventListener('click', function () {
    inner.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
  btnR.addEventListener('click', function () {
    inner.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
})();
