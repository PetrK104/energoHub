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
      if (!this.checkValidity()) {
        this.reportValidity();
        return;
      }
      var fields = this.querySelector('.kontakt-form__fields');
      var success = this.querySelector('.kontakt-form__success');
      var ui = EH.formUi(this);
      var hp = this.querySelector('input[name="website"]');
      ui.start();
      EH.submitForm('contact', {
        name: EH.val('kontakt-name'),
        email: EH.val('kontakt-email'),
        message: EH.val('kontakt-message')
      }, hp && hp.value).then(function () {
        ui.done();
        if (fields) fields.hidden = true;
        if (success) success.hidden = false;
      }).catch(function (err) {
        ui.fail(err.message);
      });
    });
  }
})();
