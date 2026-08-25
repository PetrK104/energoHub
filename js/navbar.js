(function () {
  var burger = document.getElementById('navBurger');
  var menu   = document.getElementById('navMobile');
  if (!burger || !menu) return;

  function open() {
    burger.classList.add('is-open');
    menu.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  }
  function close() {
    burger.classList.remove('is-open');
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  }

  burger.addEventListener('click', function () {
    burger.classList.contains('is-open') ? close() : open();
  });

  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', close);
  });

  document.addEventListener('click', function (e) {
    if (!burger.contains(e.target) && !menu.contains(e.target)) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
