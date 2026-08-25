(function () {
  var panel   = document.getElementById('jomPanel');
  var imgWrap = document.getElementById('jomImgWrap');
  if (!panel || !imgWrap) return;

  var imgClip = document.getElementById('jomImgClip');
  var imgTop  = document.getElementById('jomImgTop');
  var handle  = document.getElementById('jomHandle');

  function setPosition(clientX) {
    var rect = imgWrap.getBoundingClientRect();
    var pct  = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    var px   = pct * rect.width;

    imgClip.style.width = px + 'px';
    imgTop.style.width  = rect.width + 'px';
    handle.style.left   = px + 'px';

    // Aktivní stav textových sloupců
    if (pct < 0.5) {
      panel.classList.add('is-before');
      panel.classList.remove('is-after');
    } else {
      panel.classList.add('is-after');
      panel.classList.remove('is-before');
    }
  }

  function init() {
    var rect = imgWrap.getBoundingClientRect();
    imgTop.style.width  = rect.width + 'px';
    imgClip.style.width = '0px';
    handle.style.left   = '0px';
    panel.classList.add('is-before');
    panel.classList.remove('is-after');
  }

  imgWrap.addEventListener('mousemove', function (e) {
    setPosition(e.clientX);
  });

  imgWrap.addEventListener('touchmove', function (e) {
    e.preventDefault();
    setPosition(e.touches[0].clientX);
  }, { passive: false });

  imgWrap.addEventListener('touchstart', function (e) {
    setPosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('resize', init);

  var baseImg = imgWrap.querySelector('.jom-panel__img-base');
  if (baseImg && baseImg.complete) {
    init();
  } else if (baseImg) {
    baseImg.addEventListener('load', init);
  } else {
    init();
  }
})();
