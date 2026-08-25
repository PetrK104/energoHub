(function () {
  var tabs = document.querySelectorAll('.fve-price__tab');
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.tab;
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      document.querySelectorAll('.fve-price__tab-panel').forEach(function (p) {
        p.classList.toggle('is-active', p.dataset.panel === target);
      });
      tab.classList.add('is-active');
    });
  });
})();
