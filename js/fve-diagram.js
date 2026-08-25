(function () {
  const diagram = document.getElementById('fveDiagram');
  if (!diagram) return;

  const buttons = diagram.querySelectorAll('.fve-toggle-btn');

  function setComponent(component, active) {
    buttons.forEach(btn => {
      if (btn.dataset.component === component) {
        btn.classList.toggle('is-active', active);
      }
    });
    diagram.querySelectorAll('[data-ctoggle="' + component + '"]').forEach(el => {
      el.classList.toggle('is-active', active);
    });
    diagram.querySelectorAll('[data-node="' + component + '"]').forEach(el => {
      el.classList.toggle('is-active', active);
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var component = btn.dataset.component;
      var isActive = !btn.classList.contains('is-active');
      setComponent(component, isActive);
    });
  });
})();
