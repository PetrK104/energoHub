(function () {
  var items = document.querySelectorAll('#fveDemand .fve-demand-item');

  function activate(index) {
    items.forEach(function (item, i) {
      item.classList.toggle('is-open', i === index);
    });
  }

  items.forEach(function (item, i) {
    item.querySelector('.fve-demand-item__collapsed').addEventListener('click', function () {
      if (!item.classList.contains('is-open')) activate(i);
    });

    item.querySelectorAll('.fve-demand-item__btn--next').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        activate(i + 1);
      });
    });

    item.querySelectorAll('.fve-demand-item__btn--prev').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        activate(i - 1);
      });
    });
  });
})();
