(function () {
  var searchInput = document.getElementById('slovnikSearch');
  var sections    = document.querySelectorAll('.slovnik__section');
  var letterBtns  = document.querySelectorAll('.slovnik__letter-btn');
  var clearBtn    = document.getElementById('slovnikClear');

  // Smooth scroll to letter section
  letterBtns.forEach(function (btn) {
    if (btn.classList.contains('is-disabled')) return;
    btn.addEventListener('click', function () {
      var letter  = btn.dataset.letter;
      var section = document.getElementById('letter-' + letter);
      if (!section) return;

      letterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Real-time search
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var query = searchInput.value.trim().toLowerCase();

      sections.forEach(function (section) {
        var terms   = section.querySelectorAll('.slovnik__term');
        var visible = 0;

        terms.forEach(function (term) {
          var name  = (term.dataset.term || '').toLowerCase();
          var match = !query || name.indexOf(query) !== -1;
          term.hidden = !match;
          if (match) visible++;
        });

        section.hidden = (visible === 0);
      });

      // Při hledání schovat písmena a přiblížit výsledky k poli
      var alphabet = document.getElementById('slovnikAlphabet');
      if (alphabet) alphabet.hidden = !!query;
      var hero = document.querySelector('.slovnik-hero');
      if (hero) hero.classList.toggle('is-searching', !!query);
      if (clearBtn) clearBtn.hidden = !searchInput.value;
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.focus();
      });
    }
  }

  // Highlight active letter on scroll
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking || searchInput.value.trim()) return;
    ticking = true;
    requestAnimationFrame(function () {
      var scrollY = window.scrollY + 120;
      var active  = null;

      sections.forEach(function (section) {
        if (section.hidden) return;
        if (section.offsetTop <= scrollY) active = section.dataset.letterSection;
      });

      letterBtns.forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.letter === active);
      });

      ticking = false;
    });
  });
})();
