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

      if (window.innerWidth <= 889) {
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
  }

  var frame = document.getElementById("hero3dFrame");
  if (frame) {
    frame.addEventListener("load", onFrameLoad);
    frame.addEventListener("load", function () {
      setTimeout(function () { frame.classList.add("is-loaded"); }, 550);
    });
    // Race condition: iframe již načten z cache před připojením listeneru
    if (frame.contentDocument && frame.contentDocument.readyState === "complete") {
      setTimeout(function () { frame.classList.add("is-loaded"); }, 550);
    }
    // Fallback
    setTimeout(function () { frame.classList.add("is-loaded"); }, 3000);
  }
  window.addEventListener("resize", positionControls);
  window.addEventListener("scroll", positionControls, { passive: true });
})();
