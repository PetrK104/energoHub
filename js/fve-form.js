(function () {
  var stepCalc  = document.getElementById('stepCalc');
  var stepForm  = document.getElementById('stepForm');
  var btnToForm = document.getElementById('btnToForm');
  var btnBack   = document.getElementById('btnBack');
  var form      = document.getElementById('fveForm');
  var thanks    = document.getElementById('formThanks');
  var flowSteps = document.querySelectorAll('.fve-calc__flow-step');

  if (!stepCalc || !stepForm) return;

  function showStep(step) {
    if (step === 1) {
      stepCalc.hidden = false;
      stepForm.hidden = true;
      if (flowSteps[0]) flowSteps[0].classList.add('fve-calc__flow-step--active');
      if (flowSteps[2]) flowSteps[2].classList.remove('fve-calc__flow-step--active');
    } else {
      fillSummary();
      stepCalc.hidden = true;
      stepForm.hidden = false;
      if (flowSteps[0]) flowSteps[0].classList.remove('fve-calc__flow-step--active');
      if (flowSteps[2]) flowSteps[2].classList.add('fve-calc__flow-step--active');
      document.querySelector('.fve-calc').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function fillSummary() {
    var list    = document.getElementById('formSummaryList');
    if (!list) return;
    var apts    = document.getElementById('calcAptsNum');
    var consump = document.getElementById('calcConsumption');
    var orient  = document.querySelector('input[name="calcOrient"]:checked');
    var insul   = document.querySelector('input[name="calcInsul"]:checked');
    var battery = document.querySelector('input[name="calcBattery"]:checked');
    var insulLabel = { weak: 'Slabé', mid: 'Střední', good: 'Dobré' };
    var battLabel  = { no: 'Bez baterie', yes: 'S baterií' };
    list.innerHTML = [
      '<li>' + (apts ? apts.value : '—') + ' bytů</li>',
      '<li>Orientace: ' + (orient ? orient.value : '—') + '</li>',
      '<li>' + (consump ? consump.value : '—') + ' kWh / měs. / byt</li>',
      '<li>Zateplení: ' + (insul ? insulLabel[insul.value] : '—') + '</li>',
      '<li>' + (battery ? battLabel[battery.value] : '—') + '</li>',
    ].join('');
  }

  if (btnToForm) btnToForm.addEventListener('click', function () { showStep(2); });
  if (btnBack)   btnBack.addEventListener('click',   function () { showStep(1); });

  if (form && thanks) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.hidden = true;
      thanks.hidden = false;
    });
  }
})();
