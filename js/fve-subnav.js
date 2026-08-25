(function () {
  var nav = document.querySelector('.fve-subnav');
  if (!nav) return;

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
})();
