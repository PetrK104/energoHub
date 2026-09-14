(function () {
  var cx = 160, cy = 160, R = 140, r = 86, GAP = 1.8;

  function pt(angleDeg, radius) {
    var rad = (angleDeg - 90) * Math.PI / 180;
    return [
      (cx + radius * Math.cos(rad)).toFixed(3),
      (cy + radius * Math.sin(rad)).toFixed(3)
    ];
  }

  function arcPath(startDeg, endDeg) {
    var s = startDeg + GAP / 2;
    var e = endDeg   - GAP / 2;
    var large = (e - s) > 180 ? 1 : 0;
    var o1 = pt(s, R), o2 = pt(e, R);
    var i1 = pt(s, r), i2 = pt(e, r);
    return [
      'M', o1[0], o1[1],
      'A', R, R, 0, large, 1, o2[0], o2[1],
      'L', i2[0], i2[1],
      'A', r, r, 0, large, 0, i1[0], i1[1],
      'Z'
    ].join(' ');
  }

  window.renderFveCosts = function (segments) {
    var svg    = document.querySelector('.fve-costs__svg');
    var center = document.querySelector('.fve-costs__chart-center');
    var elName = document.querySelector('.fve-costs__center-name');
    var elAmt  = document.querySelector('.fve-costs__center-amount');
    var elPct  = document.querySelector('.fve-costs__center-pct');

    if (!svg || !center) return;

    while (svg.firstChild) svg.removeChild(svg.firstChild);
    center.classList.remove('is-active');

    var angle = 0;
    segments.forEach(function (seg) {
      var sweep = (seg.pct / 100) * 360;
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', arcPath(angle, angle + sweep));
      path.setAttribute('fill', seg.color);
      path.style.transformOrigin = cx + 'px ' + cy + 'px';
      path.style.transition = 'transform 0.22s ease, filter 0.22s ease';
      path.style.cursor = 'pointer';
      angle += sweep;

      path.addEventListener('mouseenter', function () {
        path.style.transform = 'scale(1.06)';
        path.style.filter = 'brightness(1.3)';
        elPct.textContent  = seg.pct + ' %';
        elName.textContent = seg.name;
        elAmt.textContent  = seg.amount;
        center.classList.add('is-active');
      });

      path.addEventListener('mouseleave', function () {
        path.style.transform = '';
        path.style.filter = '';
        center.classList.remove('is-active');
      });

      svg.appendChild(path);
    });
  };
})();
