(function () {
  // Reveal hlavní sekce při scrollu
  var main = document.querySelector('.kontakt-main');
  if (main) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) main.classList.add('is-visible');
    }, { threshold: 0.08 }).observe(main);
  }

  // Formulář — success stav
  var form = document.getElementById('kontaktForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = this.querySelector('.kontakt-form__fields');
      var success = this.querySelector('.kontakt-form__success');
      if (fields) fields.hidden = true;
      if (success) success.hidden = false;
    });
  }
})();
