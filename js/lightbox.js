(function () {
  var overlay = document.createElement('div');
  overlay.id = 'lightbox';
  overlay.innerHTML = '<img id="lightbox-img" alt="">';
  document.body.appendChild(overlay);

  var lbImg = overlay.querySelector('#lightbox-img');

  function isMobile() {
    return window.innerWidth <= 760;
  }

  function open(src) {
    lbImg.src = src;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.js-lightbox').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!isMobile()) return;
      e.preventDefault();
      open(el.src);
    });
  });

  overlay.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
