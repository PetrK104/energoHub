(function () {
  // Hero calculator form — prevent page reload
  var calc = document.getElementById("heroCalc");
  if (calc) {
    calc.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  function set(el, prop, val) {
    el.style.setProperty(prop, val, "important");
  }

  function positionControls() {
    var frame = document.getElementById("hero3dFrame");
    if (!frame) return;
    try {
      var doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc || !doc.head) return;

      var ctrl = doc.querySelector(".controls");
      if (!ctrl) return;

      // Shared position injection via <style> for non-inline properties
      var styleEl = doc.getElementById("_ctrl-pos");
      if (!styleEl) {
        styleEl = doc.createElement("style");
        styleEl.id = "_ctrl-pos";
        doc.head.appendChild(styleEl);
      }

      if (window.innerWidth <= 447) {
        // Velmi malé obrazovky — dvouřádkový box, posunout na dolní hranu scény
        ctrl.removeAttribute("style");
        doc.querySelectorAll(".seg").forEach(function (seg) { seg.removeAttribute("style"); });
        styleEl.textContent =
          ".controls{" +
            "left:69%!important;" +
            "transform:translateX(-50%)!important;" +
            "bottom:2%!important;" +
            "right:auto!important;" +
          "}" +
          ".seg{width:100%!important;justify-content:center!important;}";
      } else if (window.innerWidth <= 889) {
        // Mobile stacked layout — clear any inline styles, use <style> tag
        ctrl.removeAttribute("style");
        doc.querySelectorAll(".seg").forEach(function (seg) { seg.removeAttribute("style"); });
        styleEl.textContent =
          ".controls{" +
            "left:69%!important;" +
            "transform:translateX(-50%)!important;" +
            "bottom:10%!important;" +
            "right:auto!important;" +
          "}" +
          ".seg{width:100%!important;justify-content:center!important;}";

      } else {
        // Desktop: align controls bottom with calc-card bottom
        ctrl.removeAttribute("style");
        doc.querySelectorAll(".seg").forEach(function (seg) { seg.removeAttribute("style"); });
        var calcCard = document.querySelector(".calc-card");
        if (!calcCard) { styleEl.textContent = ""; return; }
        var calcBottom = calcCard.getBoundingClientRect().bottom;
        var iframeH = frame.getBoundingClientRect().height;
        var bottomPx = Math.max(8, iframeH - calcBottom);
        styleEl.textContent =
          ".controls{" +
            "left:70%!important;" +
            "transform:translateX(-50%)!important;" +
            "bottom:" + bottomPx + "px!important;" +
            "right:auto!important;" +
          "}";
      }
    } catch (e) {}
  }

  var toggleBtns = [];

  function showTransitionOverlay() {
    toggleBtns.forEach(function (btn) {
      btn.removeEventListener('mousedown', showTransitionOverlay);
      btn.removeEventListener('touchstart', showTransitionOverlay);
    });
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var ov = document.createElement('div');
    ov.id = 'heroModeOverlay';
    ov.className = 'hero-mode-overlay';
    hero.appendChild(ov);
    setTimeout(function () {
      ov.classList.add('is-fading');
      setTimeout(function () { ov.remove(); }, 850);
    }, 1400);
  }

  function watchToggle() {
    try {
      var doc = frame.contentDocument || frame.contentWindow.document;
      if (!doc) return;
      var btns = doc.querySelectorAll('.icon-btn');
      if (!btns.length) return;
      toggleBtns = Array.from(btns);
      toggleBtns.forEach(function (btn) {
        btn.addEventListener('mousedown', showTransitionOverlay);
        btn.addEventListener('touchstart', showTransitionOverlay, { passive: true });
      });
    } catch (e) {}
  }

  function onFrameLoad() {
    positionControls();
    setTimeout(positionControls, 200);
    setTimeout(positionControls, 700);
    setTimeout(positionControls, 1500);
    setTimeout(watchToggle, 700);
    setTimeout(watchToggle, 1500);
    waitForFirstFrame(hidePoster);
  }

  function hidePoster() {
    var poster = document.getElementById('hero3dPoster');
    if (!poster || poster.classList.contains('is-loaded')) return;
    poster.classList.add('is-loaded');
    setTimeout(function () { poster.remove(); }, 600);
  }

  // Iframe "load" přijde hned po stažení JS, ale scéna se vykreslí až po
  // načtení HDR a kompilaci shaderů. Poster proto držíme, dokud scéna nemá
  // environment a neproběhnou dva snímky (první snímek = kompilace shaderů).
  function waitForFirstFrame(done) {
    var started = Date.now();
    (function poll() {
      var win;
      try { win = frame.contentWindow; } catch (e) {}
      var scene = win && win.__scene;
      if (scene && scene.environment) {
        // Pojistka: na skryté kartě rAF neběží — poster stejně skryjeme
        setTimeout(done, 1500);
        win.requestAnimationFrame(function () {
          win.requestAnimationFrame(function () { setTimeout(done, 50); });
        });
        return;
      }
      if (Date.now() - started > 10000) { done(); return; }
      setTimeout(poll, 100);
    })();
  }

  var frame = document.getElementById("hero3dFrame");
  if (frame) {
    frame.addEventListener("load", onFrameLoad);
    // Iframe už není lazy a může se načíst dřív, než se spustí tento defer skript
    try {
      var fdoc = frame.contentDocument;
      if (fdoc && fdoc.readyState === "complete" && fdoc.URL !== "about:blank") onFrameLoad();
    } catch (e) {}
  }
  window.addEventListener("resize", positionControls);
  window.addEventListener("scroll", positionControls, { passive: true });
})();
