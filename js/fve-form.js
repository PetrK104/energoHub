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

  var done = false;  // po odeslání poptávky se do kroků nedá vracet
  function showStep(step) {
    if (done) return;
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

  // Přehledné shrnutí na více řádků (sloupec shrnuti v Supabase): co uživatel spočítal a jak chce postupovat
  function fveSummary(last, financing, horizon) {
    var FIN = { koupe: 'vlastní koupě', pronajem: 'pronájem (PPA)', nevim: 'zatím neví' };
    var HOR = { '6m': 'do 6 měsíců', '12m': '6–12 měsíců', '2r': '1–2 roky', zjistuju: 'zatím zjišťuje' };
    var ORIENT = { J: 'jih', JV: 'jihovýchod', JZ: 'jihozápad', V: 'východ', Z: 'západ', S: 'sever' };
    var L = [];
    if (last) {
      var i = last.inputs, f = last.result.fve, c = last.result.comparison, E = KALK_ENGINE;
      var cz = function (n) { return n.toLocaleString('cs-CZ'); };
      L.push('Vstupy: ' + i.apartments + ' bytů, roční spotřeba ' +
        (i.annual_consumption_kwh ? cz(Math.round(i.annual_consumption_kwh / 1000)) + ' MWh (zadáno)' : 'odhadnutá') +
        (ORIENT[i.orientation] ? ', orientace střechy ' + ORIENT[i.orientation] + (i.orientation_touched ? '' : ' (nezměněno)') : '') + '.');
      L.push('Varianta: FVE ' + cz(f.fve_kwp) + ' kWp' + (f.limited_by === 'max' ? ' (horní mez výkonu)' : f.limited_by === 'min' ? ' (spodní mez výkonu)' : '') +
        ', ' + (f.includes_jom ? 's JOM' : 'bez JOM') + ', ' + (f.battery ? 's baterií' : 'bez baterie') + '.');
      L.push('Investice ' + E.fmtKc(f.investment_czk.lo, f.investment_czk.hi) + ', úspora ' + E.fmtKc(f.saving_year_czk.lo, f.saving_year_czk.hi) +
        ' ročně (' + cz(f.saving_apt_month_czk.lo) + ' – ' + cz(f.saving_apt_month_czk.hi) + ' Kč na byt měsíčně), návratnost ' +
        E.fmtLet(f.payback_years.lo, f.payback_years.hi) + '.');
      if (c && c.saving_with_jom_czk != null && c.saving_without_jom_czk != null) {
        L.push('Srovnání: úspora s JOM ' + cz(c.saving_with_jom_czk) + ' Kč ročně, bez JOM ' + cz(c.saving_without_jom_czk) + ' Kč ročně.');
      }
      L.push('Rozpětí výpočtu ±' + Math.round((i.spread || 0) * 100) + ' %, částky včetně DPH, verze výpočtu ' + ((window.KALK && KALK.VERZE) || '?') + '.');
    } else L.push('Výpočet nebyl k dispozici.');
    if (FIN[financing]) L.push('Financování: ' + FIN[financing] + '.');
    if (HOR[horizon]) L.push('Realizace: ' + HOR[horizon] + '.');
    return L.join('\n');
  }

  // Hodnoty pro samostatné sloupce tabulky poptavky_fve
  function fveColumns(last) {
    if (!last) return {};
    var i = last.inputs, f = last.result.fve;
    return {
      pocet_bytu: i.apartments,
      rocni_spotreba_kwh: i.annual_consumption_kwh,
      vykon_kwp: f.fve_kwp,
      investice_od_kc: f.investment_czk.lo, investice_do_kc: f.investment_czk.hi,
      uspora_rocne_od_kc: f.saving_year_czk.lo, uspora_rocne_do_kc: f.saving_year_czk.hi,
      navratnost_od_roky: f.payback_years.lo, navratnost_do_roky: f.payback_years.hi,
      verze_vypoctu: (window.KALK && KALK.VERZE) || null
    };
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
        vstupy: inputsOut,
        vysledek: { schema: 2, vypocet: last ? last.result : null, zobrazeno: calcInputs.displayed },
        sloupce: fveColumns(last),
        summary: summary,
        consent: form.elements['gdpr'].checked,
        consent_text: consentEl ? consentEl.textContent.trim() : ''
      }, hp && hp.value).then(function () {
        done = true;
        ui.done();
        form.hidden = true;
        thanks.hidden = false;
        var fs = document.getElementById('fveStepper'); if (fs) fs.style.display = 'none';
        var tt = thanks.querySelector('.fve-form__thanks-title'); if (tt) { tt.setAttribute('tabindex', '-1'); tt.focus(); }
      }).catch(function (err) {
        ui.fail(err.message);
      });
    });
  }
})();
