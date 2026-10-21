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

  function onFrameLoad() {
    positionControls();
    setTimeout(positionControls, 200);
    setTimeout(positionControls, 700);
    setTimeout(positionControls, 1500);
    waitForReady(hidePoster);
  }

  function hidePoster() {
    var poster = document.getElementById('hero3dPoster');
    if (!poster || poster.classList.contains('is-loaded')) return;
    poster.classList.add('is-loaded');
    setTimeout(function () { poster.remove(); }, 600);
  }

  // Scéna sama pošle "hero3d:ready" po zkompilování shaderů a zahřátí snímků
  // a teprve poté se v iframu plynule zobrazí. Poster držíme do tohoto signálu.
  // Záloha: čtení window.__heroReady (kdyby zpráva přišla dřív než listener)
  // a časový limit 10 s, aby poster nezůstal viset.
  function waitForReady(done) {
    var started = Date.now();
    (function poll() {
      var win;
      try { win = frame.contentWindow; } catch (e) {}
      if ((win && win.__heroReady) || Date.now() - started > 10000) { done(); return; }
      setTimeout(poll, 150);
    })();
  }

  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "hero3d:ready" && frame && e.source === frame.contentWindow) {
      hidePoster();
    }
  });

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
