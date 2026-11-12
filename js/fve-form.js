(function () {
  var stepCalc  = document.getElementById('stepCalc');
  var stepForm  = document.getElementById('stepForm');
  var btnToForm = document.getElementById('btnToForm');
  var btnBack   = document.getElementById('btnBack');
  var form      = document.getElementById('fveForm');
  var thanks    = document.getElementById('formThanks');

  if (!stepCalc || !stepForm) return;

  function markStepper(step) {
    document.querySelectorAll('#fveStepper .fve-calc__step-item').forEach(function (el) {
      var n = parseInt(el.dataset.step, 10);
      el.classList.remove('is-active', 'is-done');
      if (n === step) el.classList.add('is-active');
      else if (n < step) el.classList.add('is-done');
      if (n === step) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
  }

  // Kroky nahoře jsou navigace (myš, dotyk, Enter a mezerník), stejně jako v hlavní kalkulačce
  document.querySelectorAll('#fveStepper .fve-calc__step-item').forEach(function (el) {
    var lab = el.querySelector('.fve-calc__step-label');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Přejít na krok ' + el.dataset.step + ': ' + (lab ? lab.textContent.trim() : ''));
    function go() { showStep(parseInt(el.dataset.step, 10)); }
    el.addEventListener('click', go);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  function showStep(step) {
    markStepper(step);
    if (step === 1) {
      stepCalc.hidden = false;
      stepForm.hidden = true;
    } else {
      fillSummary();
      fillResults();
      stepCalc.hidden = true;
      stepForm.hidden = false;
      document.querySelector('.fve-calc').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function fillSummary() {
    var list    = document.getElementById('formSummaryList');
    if (!list) return;
    var apts    = document.getElementById('calcAptsNum');
    var consump = document.getElementById('calcConsumption');
    var orient  = document.querySelector('input[name="calcOrient"]:checked');
    var battery = document.querySelector('input[name="calcBattery"]:checked');
    var jom     = document.querySelector('input[name="calcJom"]:checked');
    var battLabel  = { no: 'Bez baterie', yes: 'S baterií' };
    list.innerHTML = [
      '<li>' + (apts ? apts.value : '—') + ' bytů</li>',
      '<li>Orientace: ' + (orient ? orient.value : '—') + '</li>',
      (consump && consump.value ? '<li>Roční spotřeba: ' + consump.value + ' kWh</li>' : ''),
      '<li>' + (battery ? battLabel[battery.value] : '—') + '</li>',
      '<li>' + (jom && jom.value === 'no' ? 'Bez JOM' : 'S JOM') + '</li>',
    ].join('');
  }

  // Výsledky z kalkulačky: velká čísla v jednom řádku (hodnoty, jednotky i popisky se čtou přímo z kroku 1)
  var RESULT_IDS = ['resPayback', 'resSavingsYear', 'resSavingsMth', 'resCostTotal'];

  function readResults() {
    return RESULT_IDS.map(function (id) {
      var el = document.getElementById(id);
      var box = el ? el.closest('.fve-calc__result') : null;
      var text = function (sel) {
        var n = box && box.querySelector(sel);
        return n ? n.textContent.replace(/\s+/g, ' ').trim() : '';
      };
      return {
        value: el ? el.textContent.replace(/\s+/g, ' ').trim() : '',
        unit: text('.fve-calc__result-unit'),
        label: text('.fve-calc__result-label')
      };
    });
  }

  // Věta pro sloupec summary (Supabase): co uživatel spočítal a jak chce postupovat
  function fveSummary(last, financing, horizon) {
    var FIN = { koupe: 'koupě', pronajem: 'pronájem', nevim: 'zatím neví' };
    var HOR = { '6m': 'do 6 měsíců', '12m': 'do 12 měsíců', '2r': 'do 2 let', zjistuju: 'jen zjišťuje' };
    var txt = 'FVE';
    if (last) {
      var i = last.inputs, f = last.result.fve, E = KALK_ENGINE;
      txt += ': ' + i.apartments + ' bytů, ' + (i.annual_consumption_kwh ? Math.round(i.annual_consumption_kwh / 1000).toLocaleString('cs-CZ') + ' MWh' : 'spotřeba odhadnutá') +
        ', ' + f.fve_kwp + ' kWp, ' + (f.includes_jom ? 's JOM' : 'bez JOM') + ', ' + (f.battery ? 's baterií' : 'bez baterie') +
        '. Investice ' + E.fmtKc(f.investment_czk.lo, f.investment_czk.hi) + ', úspora ' + E.fmtKc(f.saving_year_czk.lo, f.saving_year_czk.hi) +
        ' ročně, návratnost ' + E.fmtLet(f.payback_years.lo, f.payback_years.hi) + '.';
    } else txt += '.';
    if (FIN[financing]) txt += ' Financování: ' + FIN[financing] + '.';
    if (HOR[horizon]) txt += ' Realizace: ' + HOR[horizon] + '.';
    return txt;
  }

  function fillResults() {
    var row = document.getElementById('formResultsRow');
    if (!row) return;
    row.innerHTML = readResults().map(function (r) {
      return '<div class="fve-form__result"><span class="fve-form__result-value">' + r.value + '</span>' +
        '<span class="fve-form__result-unit">' + r.unit + '</span>' +
        '<span class="fve-form__result-label">' + r.label + '</span></div>';
    }).join('');
  }

  if (btnToForm) btnToForm.addEventListener('click', function () { showStep(2); });
  if (btnBack)   btnBack.addEventListener('click',   function () { showStep(1); });

  if (form && thanks) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ui = EH.formUi(form);
      var hp = form.querySelector('input[name="website"]');
      var consentEl = document.getElementById('fveConsentText');
      var field = function (name) { var el = form.elements[name]; return el && el.value ? el.value.trim() : ''; };
      var last = window.EH_FVE_LAST || null;
      var assumptions = (window.KALK && KALK.predpoklady) ? KALK.predpoklady() : null;
      var inputsOut = last ? Object.assign({}, last.inputs, { assumptions: assumptions }) : { apartments: EH.val('calcAptsNum'), assumptions: assumptions };
      var calcInputs = {
        schema: 2,
        inputs: inputsOut,
        result: last ? last.result : null,
        displayed: readResults().map(function (r) { return r.label + ': ' + r.value + ' ' + r.unit.replace(/\s*(návratnost|instalace)$/, ''); })
      };
      var summary = fveSummary(last, EH.checked('financovani'), EH.checked('horizont'));
      ui.start();
      EH.submitForm('fve', {
        name: field('jmeno'),
        email: field('email'),
        phone: field('telefon'),
        role: EH.checked('role'),
        street: field('ulice'),
        city: field('mesto'),
        zip: field('psc'),
        financing: EH.checked('financovani'),
        horizon: EH.checked('horizont'),
        note: field('poznamka'),
        calc_inputs: calcInputs,
        summary: summary,
        consent: form.elements['gdpr'].checked,
        consent_text: consentEl ? consentEl.textContent.trim() : ''
      }, hp && hp.value).then(function () {
        ui.done();
        form.hidden = true;
        thanks.hidden = false;
      }).catch(function (err) {
        ui.fail(err.message);
      });
    });
  }
})();
