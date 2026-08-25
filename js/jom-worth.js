(function () {
  var toggle = document.getElementById('jomToggle');
  if (!toggle) return;

  toggle.addEventListener('click', function (e) {
    var btn = e.target.closest('.jom-worth__toggle-btn');
    if (!btn) return;
    var mode = btn.dataset.target;

    toggle.querySelectorAll('.jom-worth__toggle-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.target === mode);
    });

    var card = toggle.closest('.jom-worth__card');

    card.querySelectorAll('[data-koupe]').forEach(function (el) {
      el.textContent = el.dataset[mode] || el.dataset.koupe;
    });

    card.querySelectorAll('[data-mode-show]').forEach(function (el) {
      el.hidden = el.dataset.modeShow !== mode;
    });
  });
})();
