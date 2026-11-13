/* Společné odesílání formulářů do Supabase přes Netlify funkci submit-form.
   Použití: EH.submitForm('contact' | 'savings' | 'fve' | 'jom_quiz', data, honeypot).then(...).catch(...) */
(function () {
  var GENERIC_ERROR = 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, případně nám napište na info@energohub.cz.';

  window.EH = window.EH || {};

  window.EH.submitForm = function (formName, data, honeypot) {
    data.page_url = location.href;
    return fetch('/.netlify/functions/submit-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form: formName, data: data, website: honeypot || '' })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (res.ok && body.ok) return body;
        var err = new Error(res.status === 400 && body.error ? body.error : GENERIC_ERROR);
        throw err;
      });
    }, function () {
      throw new Error(GENERIC_ERROR);
    });
  };

  // Po odeslání poptávky: nové čisté načtení stránky (bez uložených hodnot), případně na kalkulačku/dotazník
  window.EH.restart = function (anchor) {
    try { sessionStorage.removeItem('eh_prefill'); } catch (e) {}
    location.assign(location.pathname + '?nova=1' + (anchor ? '#' + anchor : ''));
  };
  if (/[?&]nova=1/.test(location.search)) {
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-restart]') : null;
    if (b) window.EH.restart(b.getAttribute('data-restart'));
  });

  // Pomocník: zobrazí/skryje chybu ve formuláři a zamkne tlačítko po dobu odesílání
  window.EH.formUi = function (form) {
    var btn = form.querySelector('button[type="submit"]');
    var err = form.querySelector('.form-error');
    return {
      start: function () {
        if (err) err.hidden = true;
        if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
      },
      fail: function (message) {
        if (err) { err.textContent = message; err.hidden = false; }
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
      },
      done: function () {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
      }
    };
  };

  window.EH.val = function (id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  window.EH.checked = function (name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  };
})();
