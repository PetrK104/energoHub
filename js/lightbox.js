// Rozkliknutí obrázku na mobilu (šířka do 760 px): obrázek se otevře přes celou obrazovku a nepřesahuje její okraje.
// Dá se přibližovat dvěma prsty, posouvat jedním prstem (po přiblížení) a dvojklepem přiblížit / vrátit.
// Zavře se klepnutím mimo obrázek, tlačítkem nebo klávesou Esc.
// Použití: na <img> přidat třídu js-lightbox. Na počítači se nic nemění.
(function () {
  var images = document.querySelectorAll('.js-lightbox');
  if (!images.length) return;

  var MOBILE = window.matchMedia('(max-width: 760px)');
  var MAX_SCALE = 6, DOUBLE_TAP_SCALE = 2.5, DOUBLE_TAP_MS = 300, MOVE_PX = 8;
  var lastFocus = null;

  var overlay = document.createElement('div');
  overlay.id = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.tabIndex = -1;
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Zvětšený obrázek');
  overlay.innerHTML =
    '<button type="button" class="lightbox__close" aria-label="Zavřít"><span class="ms-icon" aria-hidden="true">close</span></button>' +
    '<div class="lightbox__stage"><img class="lightbox__img" alt="" draggable="false"></div>';
  document.body.appendChild(overlay);

  var stage = overlay.querySelector('.lightbox__stage');
  var lbImg = overlay.querySelector('.lightbox__img');
  var closeBtn = overlay.querySelector('.lightbox__close');

  // Přiblížení (s) a posun (x, y) obrázku od středu plochy
  var view = { s: 1, x: 0, y: 0 };

  // Přiblížení mění skutečnou velikost obrázku (ne jen jeho zvětšení transformací), aby byl při přiblížení stále ostrý.
  // base = velikost obrázku vevnitř obrazovky při přiblížení 1×
  var base = { w: 0, h: 0 };

  function measure() {
    var sw = lbImg.style.width, sh = lbImg.style.height, mw = lbImg.style.maxWidth, mh = lbImg.style.maxHeight;
    lbImg.style.width = lbImg.style.height = lbImg.style.maxWidth = lbImg.style.maxHeight = '';
    base.w = lbImg.offsetWidth; base.h = lbImg.offsetHeight;
    lbImg.style.width = sw; lbImg.style.height = sh; lbImg.style.maxWidth = mw; lbImg.style.maxHeight = mh;
  }
  lbImg.addEventListener('load', function () { reset(); measure(); });

  function clampView() {
    var w = base.w * view.s, h = base.h * view.s;
    var mx = Math.max(0, (w - stage.clientWidth) / 2), my = Math.max(0, (h - stage.clientHeight) / 2);
    view.x = Math.max(-mx, Math.min(mx, view.x));
    view.y = Math.max(-my, Math.min(my, view.y));
  }

  function apply() {
    if (!base.w) measure();
    clampView();
    if (view.s > 1.001) {
      lbImg.style.maxWidth = lbImg.style.maxHeight = 'none';
      lbImg.style.width = base.w * view.s + 'px';
      lbImg.style.height = base.h * view.s + 'px';
    } else {
      lbImg.style.width = lbImg.style.height = lbImg.style.maxWidth = lbImg.style.maxHeight = '';
    }
    lbImg.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px)';
  }

  function reset() {
    view.s = 1; view.x = 0; view.y = 0;
    lbImg.style.width = lbImg.style.height = lbImg.style.maxWidth = lbImg.style.maxHeight = '';
    lbImg.style.transform = '';
  }

  function open(img) {
    lastFocus = document.activeElement;
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || '';
    reset();
    overlay.classList.add('is-open');
    if (lbImg.complete) measure();
    document.body.style.overflow = 'hidden';
    overlay.focus({ preventScroll: true });
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    reset();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Bod vůči středu plochy (posun a přiblížení se počítají od středu)
  function rel(px, py) {
    var r = stage.getBoundingClientRect();
    return { x: px - (r.left + r.width / 2), y: py - (r.top + r.height / 2) };
  }

  // ── Gesta ──
  var pointers = {};              // aktivní doteky (id → souřadnice)
  var gesture = null;             // začátek aktuálního gesta
  var moved = false;              // během doteku se hýbalo → nejde o klepnutí
  var lastTap = { t: 0, x: 0, y: 0 };

  function ids() { return Object.keys(pointers); }

  function startGesture() {
    var k = ids();
    if (k.length >= 2) {
      var a = pointers[k[0]], b = pointers[k[1]];
      gesture = {
        pinch: true,
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        s: view.s, x: view.x, y: view.y,
        mid: rel((a.x + b.x) / 2, (a.y + b.y) / 2)
      };
    } else if (k.length === 1) {
      var p = pointers[k[0]];
      gesture = { pinch: false, px: p.x, py: p.y, x: view.x, y: view.y };
    } else {
      gesture = null;
    }
  }

  stage.addEventListener('pointerdown', function (e) {
    if (!pointers[e.pointerId] && !ids().length) moved = false;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    startGesture();
  });

  stage.addEventListener('pointermove', function (e) {
    if (!pointers[e.pointerId] || !gesture) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var k = ids();
    if (gesture.pinch && k.length >= 2) {
      var a = pointers[k[0]], b = pointers[k[1]];
      var s = Math.max(1, Math.min(MAX_SCALE, gesture.s * (Math.hypot(a.x - b.x, a.y - b.y) / gesture.dist)));
      var mid = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
      // Bod pod prsty zůstává na místě; posun středu mezi prsty obrázek posouvá
      view.s = s;
      view.x = mid.x - (gesture.mid.x - gesture.x) * (s / gesture.s);
      view.y = mid.y - (gesture.mid.y - gesture.y) * (s / gesture.s);
      moved = true;
      apply();
    } else if (!gesture.pinch && k.length === 1) {
      var dx = e.clientX - gesture.px, dy = e.clientY - gesture.py;
      if (Math.abs(dx) > MOVE_PX || Math.abs(dy) > MOVE_PX) moved = true;
      if (view.s > 1) {
        view.x = gesture.x + dx;
        view.y = gesture.y + dy;
        apply();
      }
    }
  });

  function endPointer(e) {
    if (!pointers[e.pointerId]) return;
    var wasTap = !moved && ids().length === 1 && e.type === 'pointerup';
    delete pointers[e.pointerId];
    startGesture();
    if (!wasTap) return;
    // Dvojklepnutí na obrázek: přiblížit / vrátit
    var now = Date.now();
    var onImage = e.target === lbImg;
    if (onImage && now - lastTap.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) {
      var p = rel(e.clientX, e.clientY);
      var s = view.s > 1 ? 1 : DOUBLE_TAP_SCALE;
      view.x = p.x - (p.x - view.x) * (s / view.s);
      view.y = p.y - (p.y - view.y) * (s / view.s);
      view.s = s;
      apply();
      lastTap.t = 0;
    } else {
      lastTap = { t: now, x: e.clientX, y: e.clientY };
    }
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);

  // Přibližuje se jen obrázek, ne celá stránka pod ním: prohlížeči zakážeme vlastní přiblížení a posun stránky
  // (touchmove u Androidu a iOS, gesture* u Safari, ctrl + kolečko u touchpadu).
  overlay.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (name) {
    overlay.addEventListener(name, function (e) { e.preventDefault(); });
  });
  overlay.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (!e.ctrlKey) return;
    var s = Math.max(1, Math.min(MAX_SCALE, view.s * Math.exp(-e.deltaY * 0.01)));
    var p = rel(e.clientX, e.clientY);
    view.x = p.x - (p.x - view.x) * (s / view.s);
    view.y = p.y - (p.y - view.y) * (s / view.s);
    view.s = s;
    apply();
  }, { passive: false });

  // Klepnutí mimo obrázek zavře; klepnutí na obrázek a konec posunu nebo přibližování ne
  stage.addEventListener('click', function (e) {
    if (e.target !== lbImg && !moved) close();
  });

  // Drobná ikona v rohu obrázku ukazuje, že na něj lze klepnout (jen na mobilu, viz CSS)
  images.forEach(function (img) {
    var box = img.parentElement;
    if (box && !box.querySelector('.lightbox-hint')) {
      var hint = document.createElement('span');
      hint.className = 'lightbox-hint';
      hint.setAttribute('aria-hidden', 'true');
      hint.innerHTML = '<span class="ms-icon">expand_content</span>';
      box.appendChild(hint);
    }
    img.addEventListener('click', function () {
      if (MOBILE.matches) open(img);
    });
  });

  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });
})();
