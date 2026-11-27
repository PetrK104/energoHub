/* PDF s výsledky hlavní kalkulačky. Vzniká přímo v prohlížeči (knihovna pdfmake, načítá se až po kliknutí),
   z týchž dat, která se ukládají do Supabase (KALK_ENGINE.exportUlozeni), takže čísla v PDF odpovídají výsledkům.
   Použití: KALK_PDF.stahnout(ulozeno, { name: 'Jan Novák', email: '…', phone: '…' }).then(...) */
var KALK_PDF = (function () {
  var BASE = 'assets/vendor/pdfmake/';
  var C = { text: '#1d1d1f', muted: '#5a5a66', line: '#d9dbe0', lime: '#A0CB42', limeBg: '#f2f7e6', dark: '#1d1d1f', white: '#ffffff' };
  var loading = null;
  // Roboto (běžné písmo i střední tučné) a RobotoBold pro velká čísla
  var FONTS = {
    Roboto: { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Regular.ttf', bolditalics: 'Roboto-Medium.ttf' },
    RobotoBold: { normal: 'Roboto-Bold.ttf', bold: 'Roboto-Bold.ttf', italics: 'Roboto-Bold.ttf', bolditalics: 'Roboto-Bold.ttf' }
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Nepodařilo se načíst ' + src)); };
      document.head.appendChild(s);
    });
  }
  function loadLib() {
    if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve();
    if (!loading) {
      loading = loadScript(BASE + 'pdfmake.min.js?v=1')
        .then(function () { return loadScript(BASE + 'vfs_fonts.js?v=2'); })
        .then(function () { return loadScript(BASE + 'Roboto-Bold.js?v=1'); })
        .catch(function (e) { loading = null; throw e; });
    }
    return loading;
  }
  function loadLogo() {
    return fetch('assets/images/Logo.svg').then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; });
  }

  // ── Formátování ──
  function cz(n, d) {
    return Number(n).toLocaleString('cs-CZ', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }
  function dash(a, b) { return a + ' – ' + b; }
  // Částka s rozpětím rozdělená na hodnotu a jednotku: { val: '306 – 414', unit: 'tis. Kč' }
  function kcParts(o) {
    if (!o || o.lo == null || o.hi == null) return null;
    if (o.lo >= 1e6) return { val: dash(cz(o.lo / 1e6, 1), cz(o.hi / 1e6, 1)), unit: 'mil. Kč' };
    return { val: dash(cz(Math.round(o.lo / 1000)), cz(Math.round(o.hi / 1000))), unit: 'tis. Kč' };
  }
  function kcText(o) { var p = kcParts(o); return p ? p.val + ' ' + p.unit : 'neurčeno'; }
  function letParts(o) {
    if (!o || o.lo == null) return null;
    return { val: o.hi == null ? cz(o.lo, 1) + ' +' : dash(cz(o.lo, 1), cz(o.hi, 1)), unit: 'let' };
  }
  function letText(o) { var p = letParts(o); return p ? p.val + ' ' + p.unit : 'neurčeno'; }
  function kcFull(v) { return cz(Math.round(v)) + ' Kč'; }

  var ORIENT = KALK.ORIENT_NAZVY;
  var STAV = { stara: 'stará okna (před rokem 1990)', castecne: 'částečně vyměněná okna (1990–2010)', nova: 'nová okna (po roce 2010)' };
  var KROK = { jom: 'JOM (jednotné odběrné místo)', fve: 'Fotovoltaika (FVE)', tc: 'Tepelné čerpadlo (teplo a TUV)', windows: 'Výměna oken a dveří' };

  // Název souboru: energohub-plan-uspor-prijmeni.pdf (příjmení = poslední slovo jména, bez diakritiky)
  function fileName(fullName, prefix) {
    var parts = String(fullName || '').trim().split(/\s+/);
    var last = parts.length ? parts[parts.length - 1] : '';
    var slug = last.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return (prefix || 'energohub-plan-uspor') + (slug ? '-' + slug : '') + '.pdf';
  }

  // ── Stavební prvky dokumentu ──
  function heading(t) { return { text: t, fontSize: 13, bold: true, margin: [0, 14, 0, 8] }; }
  function note(t) { return { text: t, fontSize: 8.5, color: C.muted, margin: [0, 6, 0, 0] }; }

  // Řada velkých čísel jako na webu: popisek, výrazné limetkové číslo s jednotkou, bez rámečku
  function tiles(items) {
    var widths = [], row = [];
    items.forEach(function (it) {
      widths.push('*');
      var value = it.text
        ? [{ text: it.text, fontSize: 24, font: 'RobotoBold', color: C.lime }]
        : it.parts
        ? [{ text: it.parts.val, fontSize: 24, font: 'RobotoBold', color: C.lime }, { text: '\u00a0' + it.parts.unit, fontSize: 11, color: C.muted }]
        : [{ text: it.fallback || 'neurčeno', fontSize: 16, bold: true, color: C.muted }];
      var stack = [
        { text: it.label, fontSize: 8.5, color: C.muted, characterSpacing: 0.6, margin: [0, 0, 0, 6] },
        { text: value }
      ];
      if (it.sub) stack.push({ text: it.sub, fontSize: 8.5, color: C.muted, margin: [0, 6, 0, 0] });
      row.push({ stack: stack });
    });
    return {
      table: { widths: widths, body: [row] },
      layout: {
        hLineWidth: function () { return 0; }, vLineWidth: function () { return 0; },
        paddingLeft: function () { return 0; }, paddingRight: function () { return 10; },
        paddingTop: function () { return 4; }, paddingBottom: function () { return 4; }
      }
    };
  }

  // Vodorovné sloupce s popiskem vlevo a hodnotou vpravo (bars: [{ label, value, color }]), délky úměrné hodnotě
  function barChart(title, bars) {
    var max = Math.max.apply(null, bars.map(function (b) { return b.value; })) || 1, W = 230;
    var out = [{ text: title, fontSize: 10, bold: true, margin: [0, 14, 0, 4] }];
    bars.forEach(function (b) {
      out.push({ columns: [
        { width: 150, text: b.label, fontSize: 9.5 },
        { width: W + 6, canvas: [{ type: 'rect', x: 0, y: 1, w: Math.max(2, W * b.value / max), h: 11, color: b.color }] },
        { width: '*', text: kcFull(b.value), fontSize: 9.5, bold: true, alignment: 'right' }
      ], margin: [0, 3, 0, 3] });
    });
    return out;
  }

  // Dvousloupcová tabulka „popisek – hodnota“
  function facts(rows) {
    return {
      table: { widths: [170, '*'], body: rows.map(function (r) { return [{ text: r[0], color: C.muted }, { text: r[1] }]; }) },
      layout: {
        hLineWidth: function (i, node) { return i === 0 || i === node.table.body.length ? 0 : 0.5; },
        hLineColor: function () { return C.line; }, vLineWidth: function () { return 0; },
        paddingLeft: function () { return 0; }, paddingRight: function () { return 8; },
        paddingTop: function () { return 4; }, paddingBottom: function () { return 4; }
      }
    };
  }

  // Společný rám všech PDF: záhlaví (logo, nadpis, datum, limetková linka), obsah a zápatí
  function frame(title, subject, body, logoSvg, dateText, verze) {
    var headRight = { width: '*', stack: [
      { text: title, fontSize: 22, bold: true, alignment: 'right' },
      { text: 'Vypracováno ' + dateText, fontSize: 9.5, color: C.muted, alignment: 'right', margin: [0, 4, 0, 0] }
    ], margin: [0, 8, 0, 0] };
    var content = [
      { columns: logoSvg ? [{ svg: logoSvg, width: 62 }, headRight] : [headRight], columnGap: 12 },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 507, y2: 0, lineWidth: 1.5, lineColor: C.lime }], margin: [0, 10, 0, 0] }
    ].concat(body);
    var A = { verze: verze };
    return {
      info: { title: 'EnergoHub – ' + title, author: 'EnergoHub', subject: subject },
      pageSize: 'A4', pageMargins: [44, 44, 44, 66],
      defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.25, color: C.text },
      content: content,
      // Zápatí ve stylu záhlaví (limetková linka, logo vlevo, text zarovnaný vpravo).
      // Poslední strana má v zápatí kontakt na EnergoHub, ostatní jen název a číslo strany.
      footer: function (page, pages) {
        var ver = 'verze výpočtu ' + (A.verze || '');
        var rule = { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 507, y2: 0, lineWidth: 1.5, lineColor: C.lime }] };
        if (page === pages) {
          var right = { width: '*', stack: [
            { text: [{ text: 'EnergoHub', bold: true }, { text: ' – nezávislý průvodce energetickými opatřeními pro bytové domy a SVJ', color: C.muted }], fontSize: 8.5, alignment: 'right' },
            { text: [{ text: 'IČO: ', color: C.muted }, '11996391', { text: '     E-mail: ', color: C.muted }, 'info@energohub.cz', { text: '     Web: ', color: C.muted }, 'www.energohub.info'], fontSize: 8.5, alignment: 'right', margin: [0, 3, 0, 0] },
            { text: 'Strana ' + page + ' z ' + pages + '  ·  ' + ver, fontSize: 7.5, color: C.muted, alignment: 'right', margin: [0, 4, 0, 0] }
          ] };
          return { margin: [44, 8, 44, 0], stack: [rule, { columns: logoSvg ? [{ svg: logoSvg, width: 34 }, right] : [right], columnGap: 12, margin: [0, 7, 0, 0] }] };
        }
        return { margin: [44, 8, 44, 0], stack: [rule, { margin: [0, 8, 0, 0], columns: [
          { text: 'EnergoHub · ' + title + ' · ' + ver, fontSize: 8, color: C.muted },
          { text: 'Strana ' + page + ' z ' + pages, fontSize: 8, color: C.muted, alignment: 'right' }
        ] }] };
      }
    };
  }

  function build(u, logoSvg, dateText, contact) {
    contact = contact || {};
    var inp = u.inputs || {}, res = u.result || {}, tot = res.total || {}, A = inp.assumptions || {};
    var sel = inp.selected || [];
    var has = function (k) { return sel.indexOf(k) > -1; };
    var content = [];

    // Váš dům
    content.push(heading('Zadané údaje'));
    var rows = [];
    if (contact.name) rows.push(['Jméno a příjmení', contact.name]);
    if (contact.email) rows.push(['E-mail', contact.email]);
    if (contact.phone) rows.push(['Telefon', contact.phone]);
    rows = rows.concat([
      ['Počet bytů', String(inp.apartments)],
      ['Roční spotřeba elektřiny', inp.consumption_estimated
        ? 'odhad z počtu bytů (' + cz(Math.round(inp.apartments * (A.spotreba_na_byt || 2200) / 1000)) + ' MWh)'
        : cz(Math.round((inp.annual_consumption_kwh || 0) / 1000)) + ' MWh (zadáno)'],
      ['Vybraná opatření', sel.map(function (k) { return KROK[k]; }).join(', ')]
    ]);
    if (has('fve')) {
      rows.push(['Orientace střechy', (ORIENT[inp.orientation] || 'jih') + (inp.orientation_touched ? '' : ' (nebylo upřesněno)')]);
      rows.push(['Cena elektřiny ze sítě', cz(inp.electricity_price_czk_kwh, 2) + ' Kč/kWh']);
    }
    if (inp.heat) {
      rows.push(['Náklady na teplo a TUV', inp.heat.annual_cost_czk ? cz(inp.heat.annual_cost_czk) + ' Kč ročně' : 'nezadány']);
      rows.push(['Zateplení domu', inp.heat.house_insulated ? 'zateplený' : 'nezateplený']);
    }
    if (inp.windows) {
      rows.push(['Okna a dveře', (STAV[inp.windows.state] || STAV.stara) + ', ' + cz(inp.windows.area_m2_per_apartment, 1) + ' m² na byt']);
    }
    content.push(facts(rows));

    // Výsledek celkem
    content.push(heading('Výsledek'));
    var known = !!tot.all_steps_known;
    var perApt = known && tot.saving_apt_month_czk
      ? dash(cz(tot.saving_apt_month_czk.lo), cz(tot.saving_apt_month_czk.hi)) + ' Kč na byt měsíčně' : null;
    content.push(tiles([
      { label: 'INVESTICE CELKEM', parts: kcParts(tot.investment_czk) },
      { label: 'ÚSPORA ROČNĚ', parts: known ? kcParts(tot.saving_year_czk) : null, sub: perApt },
      { label: 'NÁVRATNOST', parts: known ? letParts(tot.payback_years) : null }
    ]));
    if (!known) {
      content.push(note('Úsporu a návratnost celkem zatím nelze určit, protože nejsou zadané roční náklady na teplo. Po jejich doplnění v kalkulačce se výpočet upřesní.'));
    }

    // Rozpis po opatřeních
    var rozpis = [heading('Rozpis podle opatření')];
    var head = ['Opatření', 'Investice', 'Úspora ročně', 'Návratnost'].map(function (t, i) {
      return { text: t, bold: true, color: C.white, fillColor: C.dark, alignment: i ? 'right' : 'left', fontSize: 9 };
    });
    var body = [head];
    var anyEstimate = false;
    function stepRow(name, s, estimate) {
      if (!s) return;
      if (estimate) anyEstimate = true;
      body.push([
        { text: name + (estimate ? ' *' : '') },
        { text: kcText(s.investment_czk), alignment: 'right' },
        { text: s.saving_year_czk ? kcText(s.saving_year_czk) : 'neurčeno', alignment: 'right', color: s.saving_year_czk ? C.text : C.muted },
        { text: s.payback_years ? letText(s.payback_years) : 'neurčeno', alignment: 'right', color: s.payback_years ? C.text : C.muted }
      ]);
    }
    stepRow('JOM', res.jom, false);
    stepRow(res.fve && res.fve.includes_jom ? 'FVE včetně JOM' : 'FVE (' + cz(res.fve ? res.fve.fve_kwp : 0, 1) + ' kWp)', res.fve, false);
    stepRow('Tepelné čerpadlo (teplo a TUV)', res.tc, true);
    stepRow('Okna a dveře', res.windows, true);
    body.push([
      { text: 'Celkem', bold: true, fillColor: C.limeBg },
      { text: kcText(tot.investment_czk), bold: true, alignment: 'right', fillColor: C.limeBg },
      { text: known ? kcText(tot.saving_year_czk) : 'neurčeno', bold: true, alignment: 'right', fillColor: C.limeBg },
      { text: known ? letText(tot.payback_years) : 'neurčeno', bold: true, alignment: 'right', fillColor: C.limeBg }
    ]);
    rozpis.push({
      table: { headerRows: 1, widths: ['*', 105, 105, 80], body: body },
      layout: {
        hLineWidth: function () { return 0.5; }, hLineColor: function () { return C.line; }, vLineWidth: function () { return 0; },
        paddingLeft: function () { return 8; }, paddingRight: function () { return 8; },
        paddingTop: function () { return 6; }, paddingBottom: function () { return 6; }
      }
    });
    if (anyEstimate) {
      rozpis.push(note('* Odhad: u tohoto opatření zatím nemáme ověřené ceny ani úspory, berte hodnoty jako hrubou orientaci.'));
    }
    content.push({ stack: rozpis, unbreakable: true });

    // Financování
    if (tot.nzu_loan_czk) {
      var loanBlock = [
        heading('Financování úvěrem Nová zelená úsporám'),
        tiles([
          { label: 'VÝŠE ÚVĚRU', parts: { val: cz(tot.nzu_loan_czk), unit: 'Kč' } },
          { label: 'DOBA SPLÁCENÍ', parts: { val: String(tot.loan_years), unit: 'let' } },
          { label: 'MĚSÍČNÍ SPLÁTKA', parts: { val: cz(tot.loan_monthly_czk), unit: 'Kč' } }
        ])
      ];
      if (known && tot.saving_year_czk) {
        var monthly = (tot.saving_year_czk.lo + tot.saving_year_czk.hi) / 2 / 12;
        var pay = tot.loan_monthly_czk;
        var diff = monthly - pay;
        loanBlock = loanBlock.concat(barChart('Úspora a splátka za měsíc', [
          { label: 'Úspora (střed rozpětí)', value: monthly, color: C.lime },
          { label: 'Splátka úvěru', value: pay, color: '#9a9ca6' }
        ]));
        loanBlock.push(note(diff >= 0
          ? 'Po zaplacení splátky zůstává přibližně ' + kcFull(diff) + ' měsíčně.'
          : 'Splátka převyšuje úsporu přibližně o ' + kcFull(-diff) + ' měsíčně.'));
      }
      loanBlock.push(note('Úvěr počítáme pro FVE, tepelné čerpadlo a okna. Úvěr z programu Nová zelená úsporám pro bytové domy je bezúročný' +
        (tot.nzu_loan_capped ? ' a v tomto výpočtu je omezen stropem na jeden byt.' : '.')));
      content.push({ stack: loanBlock, unbreakable: true });
    }

    // Obecné poznámky (bez konkrétních dat výpočtu)
    var as = [];
    as.push('Všechny částky jsou včetně DPH.');
    as.push('Výsledky jsou uvedeny jako rozpětí, protože skutečné ceny i spotřeba se dům od domu liší.');
    if (inp.consumption_estimated) as.push('Roční spotřeba elektřiny nebyla zadána, proto je odhadnutá z počtu bytů.');
    as.push('Ceny a úspory vycházejí z hodnot platných v době vypracování.');
    if (tot.nzu_loan_czk) as.push('Podmínky programu Nová zelená úsporám se mohou měnit. Aktuální podmínky je potřeba ověřit.');
    content.push({ stack: [heading('Použité předpoklady'), { ul: as, fontSize: 9.5, color: C.text }, note('Výpočet je orientační. Nenahrazuje projekt ani cenovou nabídku dodavatele.')], unbreakable: true });

    return frame('Orientační plán úspor', 'Orientační výpočet úspor pro bytový dům', content, logoSvg, dateText, A.verze);
  }

  // Obecné poznámky na konci všech PDF (bez konkrétních dat výpočtu)
  function notesBlock(items) {
    return { stack: [heading('Použité předpoklady'), { ul: items, fontSize: 9.5, color: C.text }, note('Výpočet je orientační. Nenahrazuje projekt ani cenovou nabídku dodavatele.')], unbreakable: true };
  }

  // ── FVE průvodce ──
  // u = { inputs, result }, contact = { name, email, phone, role, street, city, zip, financing, horizon, note }
  function buildFve(u, logoSvg, dateText, contact) {
    contact = contact || {};
    var inp = u.inputs || {}, res = u.result || {}, f = res.fve, cmp = res.comparison, A = inp.assumptions || {};
    var ROLE = { predseda: 'předseda výboru', clen: 'člen výboru', spravce: 'správce', jine: 'jiné' };
    var FIN = { koupe: 'vlastní koupě', pronajem: 'pronájem (PPA)', nevim: 'zatím neví' };
    var HOR = { '6m': 'do 6 měsíců', '12m': '6–12 měsíců', '2r': '1–2 roky', zjistuju: 'zatím zjišťuje' };
    var content = [heading('Zadané údaje')];
    var rows = [];
    if (contact.name) rows.push(['Jméno a příjmení', contact.name]);
    if (contact.email) rows.push(['E-mail', contact.email]);
    if (contact.phone) rows.push(['Telefon', contact.phone]);
    if (ROLE[contact.role]) rows.push(['Role v SVJ', ROLE[contact.role]]);
    if (contact.street || contact.city) rows.push(['Adresa budovy', [contact.street, [contact.zip, contact.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')]);
    if (FIN[contact.financing]) rows.push(['Financování', FIN[contact.financing]]);
    if (HOR[contact.horizon]) rows.push(['Časový horizont', HOR[contact.horizon]]);
    if (inp.apartments) {
      rows.push(['Počet bytů', String(inp.apartments)]);
      rows.push(['Roční spotřeba elektřiny', inp.consumption_estimated
        ? 'odhad z počtu bytů (' + cz(Math.round(inp.apartments * (A.spotreba_na_byt || 2200) / 1000)) + '\u00a0MWh)'
        : cz(Math.round((inp.annual_consumption_kwh || 0) / 1000)) + '\u00a0MWh (' + (inp.monthly_advance_czk ? 'odhad ze zálohy ' + cz(inp.monthly_advance_czk) + '\u00a0Kč/měs. na byt' : 'zadáno') + ')']);
      rows.push(['Orientace střechy', (ORIENT[inp.orientation] || 'jih') + (inp.orientation_touched ? '' : ' (nebylo upřesněno)')]);
      rows.push(['Bateriové úložiště', inp.battery ? 's baterií' : 'bez baterie']);
      rows.push(['Sdílení elektřiny (JOM)', inp.jom ? 's JOM' : 'bez JOM']);
    }
    if (contact.note) rows.push(['Poznámka', contact.note]);
    content.push(facts(rows));

    if (f) {
      content.push(heading('Výsledek'));
      content.push(tiles([
        { label: 'INVESTICE', parts: kcParts(f.investment_czk) },
        { label: 'ÚSPORA ROČNĚ', parts: kcParts(f.saving_year_czk),
          sub: f.saving_apt_month_czk ? dash(cz(f.saving_apt_month_czk.lo), cz(f.saving_apt_month_czk.hi)) + '\u00a0Kč na byt měsíčně' : null },
        { label: 'NÁVRATNOST', parts: letParts(f.payback_years) }
      ]));
      var blk = [];
      if (cmp && cmp.saving_with_jom_czk != null && cmp.saving_without_jom_czk != null) {
        blk = blk.concat(barChart('Roční úspora s JOM a bez JOM (přibližně)', [
          { label: 'S jednotným odběrným místem', value: cmp.saving_with_jom_czk, color: C.lime },
          { label: 'Bez jednotného odběrného místa', value: cmp.saving_without_jom_czk, color: '#9a9ca6' }
        ]));
      }
      blk.push({ text: 'Navržená FVE má výkon ' + cz(f.fve_kwp, 1) + '\u00a0kWp' +
        (f.limited_by === 'max' ? ' (horní mez výkonu)' : f.limited_by === 'min' ? ' (spodní mez výkonu)' : '') +
        (f.includes_jom ? ' a investice zahrnuje úpravy pro jednotné odběrné místo (JOM).' : ' a investice zahrnuje jen fotovoltaiku.'), margin: [0, 12, 0, 0] });
      content.push({ stack: blk, unbreakable: true });
    } else {
      content.push(note('Výsledek výpočtu nebyl k dispozici.'));
    }
    content.push(notesBlock([
      'Všechny částky jsou včetně DPH.',
      'Výsledky jsou uvedeny jako rozpětí, protože skutečné ceny i spotřeba se dům od domu liší.',
      'Ceny a úspory vycházejí z hodnot platných v době vypracování.'
    ].concat(inp.consumption_estimated ? ['Roční spotřeba elektřiny nebyla zadána, proto je odhadnutá z počtu bytů.'] : [])));
    return frame('Orientační výpočet FVE', 'Orientační výpočet fotovoltaiky pro bytový dům', content, logoSvg, dateText, A.verze);
  }

  // ── JOM dotazník ──
  // u = { inputs (odpovědi + assumptions), result: { score, score_max, level, estimate } }, contact = { name, email, phone, organization }
  function buildJom(u, logoSvg, dateText, contact) {
    contact = contact || {};
    var i = u.inputs || {}, res = u.result || {}, est = res.estimate, A = i.assumptions || {};
    var TYPE = { svj: 'SVJ', druzstvo: 'bytové družstvo', obecni: 'obecní dům', jine: 'jiný typ domu' };
    var DIST = { cez: 'ČEZ Distribuce', egd: 'EG.D (E.ON)', pre: 'PREdistribuce' };
    var FVE = { have: 'mají', plan: 'plánují', none: 'neplánují' };
    var BAT = { have: 'mají', plan: 'plánují', none: 'nemají' };
    var CONTR = { individual: 'každý byt má vlastní smlouvu', common: 'společná smlouva už existuje', unknown: 'nevědí' };
    var BREAKER = { '1x25': '1×25 A', '3x20': '3×20 A', unknown: 'různé / nevědí' };
    var LEVEL = { high: 'vysoká', mid: 'střední', low: 'nízká' };
    var LEVEL_TXT = { high: 'JOM se pravděpodobně velmi vyplatí.', mid: 'JOM má smysl, doporučujeme ho posoudit podrobněji.', low: 'JOM zatím nemusí být ideální.' };
    var content = [heading('Zadané údaje')];
    var rows = [];
    if (contact.name) rows.push(['Jméno a příjmení', contact.name]);
    if (contact.email) rows.push(['E-mail', contact.email]);
    if (contact.phone) rows.push(['Telefon', contact.phone]);
    if (contact.organization) rows.push(['SVJ / organizace', contact.organization]);
    rows.push(['Počet bytů', i.apartments ? String(i.apartments) : 'nezadáno']);
    if (TYPE[i.house_type]) rows.push(['Typ domu', TYPE[i.house_type]]);
    rows.push(['Distribuční území', DIST[i.distributor] || 'nevědí']);
    rows.push(['Roční spotřeba elektřiny', i.annual_consumption_kwh ? cz(Math.round(i.annual_consumption_kwh / 1000)) + '\u00a0MWh' : 'nezadána']);
    var fve = FVE[i.fve] || 'neuvedeno';
    if (i.fve_kwp) fve += ', ' + cz(i.fve_kwp) + '\u00a0kWp';
    if (KALK.orientVeta(i.fve_orientation)) fve += ', ' + KALK.orientVeta(i.fve_orientation);
    rows.push(['Fotovoltaika', fve]);
    rows.push(['Bateriové úložiště', BAT[i.battery] || 'neuvedeno']);
    rows.push(['Smlouvy na elektřinu', CONTR[i.contracts] || 'neuvedeno']);
    rows.push(['Hlavní jistič v bytech', BREAKER[i.breaker] || 'neuvedeno']);
    content.push(facts(rows));

    content.push(heading('Výsledek'));
    var vcol = { high: C.lime, mid: '#E0B03A', low: '#9a9ca6' }[res.level] || C.lime;
    content.push({ columns: [
      { width: 6, canvas: [{ type: 'rect', x: 0, y: 0, w: 4, h: 26, color: vcol }] },
      { width: '*', text: LEVEL_TXT[res.level] || '', fontSize: 20, font: 'RobotoBold', margin: [0, 1, 0, 0] }
    ], columnGap: 8, margin: [0, 2, 0, 16] });
    content.push(tiles([
      { label: 'VHODNOST JOM', text: LEVEL[res.level] || 'neurčeno', sub: 'skóre ' + res.score + ' z ' + res.score_max },
      { label: 'ÚSPORA ROČNĚ', parts: est ? kcParts(est.saving_year_czk) : null },
      { label: 'NA BYT MĚSÍČNĚ', parts: est && est.saving_apt_month_czk ? { val: dash(cz(est.saving_apt_month_czk.lo), cz(est.saving_apt_month_czk.hi)), unit: 'Kč' } : null }
    ]));
    var verdict = [];
    if (est && est.fve_part_year_czk) {
      verdict.push(note('Z toho lepší využití vaší fotovoltaiky přibližně ' + kcText(est.fve_part_year_czk) + ' ročně.'));
    }
    if (!est) verdict.push(note('Odhad úspory nebylo možné spočítat, protože chybí počet bytů nebo roční spotřeba.'));
    if (verdict.length) content.push({ stack: verdict, margin: [0, 6, 0, 0], unbreakable: true });
    content.push(notesBlock([
      'Všechny částky jsou včetně DPH.',
      'Odhad úspory je uveden jako rozpětí, protože skutečné ceny i spotřeba se dům od domu liší.',
      'Údaje, které nebyly zadány, jsme nahradili odhadem.',
      'Vyhodnocení vhodnosti vychází jen z odpovědí v dotazníku.'
    ]));
    return frame('Vyhodnocení JOM', 'Vyhodnocení vhodnosti jednotného odběrného místa pro bytový dům', content, logoSvg, dateText, A.verze);
  }

  var TYPY = {
    uspora: { build: build, prefix: 'energohub-plan-uspor' },
    fve: { build: buildFve, prefix: 'energohub-fve-vypocet' },
    jom: { build: buildJom, prefix: 'energohub-jom-vyhodnoceni' }
  };

  function stahnout(ulozeno, contact, typ) {
    var t = TYPY[typ] || TYPY.uspora;
    contact = contact || {};
    return Promise.all([loadLib(), loadLogo()]).then(function (r) {
      var doc = t.build(ulozeno, r[1], new Date().toLocaleDateString('cs-CZ'), contact);
      return new Promise(function (resolve, reject) {
        try { window.pdfMake.createPdf(doc, null, FONTS).download(fileName(contact.name, t.prefix), resolve); } catch (e) { reject(e); }
      });
    });
  }

  // Připojí funkci stažení PDF k tlačítku na děkovné stránce (knihovna se načte až po kliknutí)
  function pripojTlacitko(btnId, errId, ulozeno, contact, typ) {
    var btn = document.getElementById(btnId), err = document.getElementById(errId);
    if (!btn) return;
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = 'Připravuji PDF…';
      if (err) err.hidden = true;
      stahnout(ulozeno, contact, typ).catch(function () {
        if (err) err.hidden = false;
      }).then(function () {
        btn.disabled = false; btn.textContent = label;
      });
    });
  }

  return { FONTS: FONTS, stahnout: stahnout, tlacitko: pripojTlacitko, build: build, buildFve: buildFve, buildJom: buildJom, fileName: fileName, nacist: loadLib };
})();
