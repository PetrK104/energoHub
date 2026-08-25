(function () {
  var form = document.getElementById('quizForm');
  if (!form) return;

  function calcScore() {
    var score = 0;

    var apts = parseInt(document.getElementById('quizApts').value, 10) || 0;
    if (apts >= 50) score += 3;
    else if (apts >= 31) score += 2;
    else if (apts >= 15) score += 1;

    var fve = document.querySelector('input[name="quizFve"]:checked');
    if (fve) {
      if (fve.value === 'have') score += 3;
      else if (fve.value === 'plan') score += 2;
    }

    var contracts = document.querySelector('input[name="quizContracts"]:checked');
    if (contracts && contracts.value === 'individual') score += 2;

    var consumption = document.querySelector('input[name="quizConsumption"]:checked');
    if (consumption) {
      if (consumption.value === 'high') score += 2;
      else if (consumption.value === 'mid') score += 1;
    }

    var battery = document.querySelector('input[name="quizBattery"]:checked');
    if (battery && (battery.value === 'have' || battery.value === 'plan')) score += 1;

    return score;
  }

  function showResult(score) {
    var banner = document.getElementById('quizResultBanner');
    if (!banner) return;

    var badgeEl = banner.querySelector('.jom-quiz__result-badge');
    var textEl  = banner.querySelector('.jom-quiz__result-text');

    banner.classList.remove('jom-quiz__result-banner--high', 'jom-quiz__result-banner--mid', 'jom-quiz__result-banner--low');

    if (score >= 7) {
      banner.classList.add('jom-quiz__result-banner--high');
      if (badgeEl) { badgeEl.textContent = 'JOM se vám pravděpodobně velmi vyplatí'; badgeEl.className = 'jom-quiz__result-badge jom-quiz__result-badge--high'; }
      if (textEl)  textEl.textContent = 'Na základě vašich odpovědí JOM výrazně sníží náklady na energie a urychlí návratnost fotovoltaiky.';
    } else if (score >= 4) {
      banner.classList.add('jom-quiz__result-banner--mid');
      if (badgeEl) { badgeEl.textContent = 'JOM má pro váš dům smysl'; badgeEl.className = 'jom-quiz__result-badge jom-quiz__result-badge--mid'; }
      if (textEl)  textEl.textContent = 'JOM přinese úspory a zjednodušení správy. Přesný přínos závisí na dalších parametrech vašeho domu.';
    } else {
      banner.classList.add('jom-quiz__result-banner--low');
      if (badgeEl) { badgeEl.textContent = 'JOM zatím nemusí být ideální'; badgeEl.className = 'jom-quiz__result-badge jom-quiz__result-badge--low'; }
      if (textEl)  textEl.textContent = 'Váš dům nesplňuje optimální podmínky pro JOM. Rádi vám poradíme, jaký postup je pro vás nejvýhodnější.';
    }

    banner.classList.add('is-visible');
  }

  function showStep(n) {
    for (var i = 1; i <= 3; i++) {
      var panel = document.getElementById('quizPanel' + i);
      if (panel) panel.hidden = (i !== n);
    }

    document.querySelectorAll('.jom-quiz__step-item').forEach(function (el) {
      var s = parseInt(el.dataset.step, 10);
      el.classList.remove('is-active', 'is-done');
      if (s === n) el.classList.add('is-active');
      else if (s < n) el.classList.add('is-done');
    });
  }

  document.querySelectorAll('.jom-quiz__btn-next').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = parseInt(btn.dataset.next, 10);
      if (next === 3) showResult(calcScore());
      showStep(next);
    });
  });

  document.querySelectorAll('.jom-quiz__btn-back').forEach(function (btn) {
    btn.addEventListener('click', function () {
      showStep(parseInt(btn.dataset.back, 10));
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('quizPanel3').hidden = true;
    document.getElementById('quizThankyou').hidden = false;
  });
})();
