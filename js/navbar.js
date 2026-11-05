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

/* Rozbalovací menu na desktopu: hover (myš) + klik/klepnutí/Enter (dotyk, klávesnice) */
(function () {
  var items = document.querySelectorAll('.nav-dropdown');
  if (!items.length) return;
  var canHover = window.matchMedia('(hover: hover)');

  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.nav-dropdown__trigger').setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeAll(except) {
    items.forEach(function (it) { if (it !== except) setOpen(it, false); });
  }

  items.forEach(function (item) {
    var trigger = item.querySelector('.nav-dropdown__trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      // Myš s hoverem: menu už otevřel hover, klik ho nezavírá. Dotyk a klávesnice (detail 0) přepínají.
      if (canHover.matches && e.detail > 0) return;
      var open = !item.classList.contains('is-open');
      closeAll(item);
      setOpen(item, open);
    });

    item.addEventListener('mouseenter', function () {
      if (canHover.matches) trigger.setAttribute('aria-expanded', 'true');
    });
    item.addEventListener('mouseleave', function () {
      if (canHover.matches && !item.classList.contains('is-open')) trigger.setAttribute('aria-expanded', 'false');
    });
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) setOpen(item, false);
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-dropdown')) closeAll();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openItem = document.querySelector('.nav-dropdown.is-open');
    if (!openItem) return;
    setOpen(openItem, false);
    openItem.querySelector('.nav-dropdown__trigger').focus();
  });
})();
