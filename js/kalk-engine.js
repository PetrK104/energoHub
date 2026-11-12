/* Společné jádro výpočtu hlavní kalkulačky. Všechny konstanty jsou v js/kalk-constants.js
   a ceny v js/kalk-ceny.js. Částky jsou včetně DPH. */
var KALK_ENGINE = (function () {

  // Regulované platby domu za rok (s DPH): jistič, distribuce, systémové služby, POZE, provoz měření.
  // Výchozí předpoklad: ČEZ Distribuce, sazba D02d, jistič 1×25 A (ceník 2026, js/kalk-ceny.js).
  function regulovane(byty, spotrebaKwh) {
    var c = (typeof KALK_CENY !== 'undefined') ? KALK_CENY : null;
    var t = c && c.distribuce && c.distribuce.cez && c.distribuce.cez.D02d;
    if (!t || t.jistic['1x25'] == null) return byty * KALK.REGULOVANE_NA_BYT;
    var mwhNaByt = spotrebaKwh / byty / 1000;
    var pevne = (t.jistic['1x25'] + c.provoz_nesitove_infrastruktury) * 12;
    var promenne = (t.vt + c.systemove_sluzby) * mwhNaByt;
    var poze = Math.min(c.poze_jistic * 25 * 12, c.poze_spotreba * mwhNaByt);
    return byty * (pevne + promenne + poze) * KALK.DPH;
  }

  function compute(inp) {
    var N = KALK.NZU;
    var byty = inp.byty, spotreba = inp.spotreba;
    var orient = inp.orient || 1.0, cena = inp.cenaEl || KALK.FVE_CENA_EL;
    var sel = inp.selected;

    // JOM
    var uspora_jom    = byty * KALK.JOM_NA_BYT;
    var naklady_bez   = regulovane(byty, spotreba);
    var naklady_s_jom = naklady_bez - uspora_jom;
    var jom_investice = KALK.jomInvestice(byty);
    var jom_navratnost = jom_investice.mid / uspora_jom;

    // FVE: výkon dopočítaný ze spotřeby, v mezích NZÚ (min. 5 kWp, max. 3 kWp na byt)
    var bonusBat   = inp.baterie ? KALK.BATERIE_PODIL : 0;
    var podilS     = KALK.FVE_VLASTNI_PODIL + bonusBat;
    var podilBez   = KALK.FVE_VLASTNI_BEZ_JOM + bonusBat;
    var vykonIdeal = spotreba * podilS / (KALK.FVE_VYROBA_NA_KWP * orient);
    var vykonMax   = byty * N.MAX_KWP_NA_BYT;
    var vykon      = Math.round(Math.max(N.MIN_KWP, Math.min(vykonIdeal, vykonMax)));
    var fveOmezeni = vykonIdeal > vykonMax ? 'max' : (vykonIdeal < N.MIN_KWP ? 'min' : '');
    // Existující systém (zadaný výkon) přebije dopočtený výkon
    if (inp.vykonFix > 0) { vykon = inp.vykonFix; fveOmezeni = ''; }
    var vyroba     = vykon * KALK.FVE_VYROBA_NA_KWP * orient;
    var vlastni_s_jom   = Math.min(vyroba, spotreba * podilS);
    var vlastni_bez_jom = Math.min(vyroba, spotreba * podilBez);
    var uspora_fve      = vlastni_s_jom * cena;
    var investice_fve_sam = vykon * KALK.FVE_CENA_KWP * KALK.DPH_SNIZENA;
    var jomInv          = KALK.jomInvestice(byty);
    var investice_baterie = inp.baterie ? byty * KALK.BATERIE_NA_BYT * KALK.DPH_SNIZENA : 0;
    var investice_fve_bez_jom = investice_fve_sam + investice_baterie;
    var investice_fve   = investice_fve_bez_jom + jomInv.mid;
    var uspora_celkem   = uspora_fve + uspora_jom;
    var uspora_bez_jom  = vlastni_bez_jom * cena;
    var navratnost_fve  = investice_fve / uspora_celkem;

    // Bezúročný úvěr NZÚ: menší z investice a vzorce, jen jistina
    var uverVzorec = N.ZAKLAD + N.ZA_KWP * Math.max(0, vykon - N.ZAKLAD_KWP);
    var uver       = Math.max(N.MIN_UVER, Math.min(investice_fve_sam, uverVzorec));
    var splatnostLet = uver <= N.LIMIT_KRATSI ? N.SPLATNOST_KRATSI : N.SPLATNOST_DELSI;
    var splatka_mes  = uver / (splatnostLet * 12);
    var pokryti      = Math.round(uspora_jom / (splatka_mes * 12) * 100);

    // Teplo: dnešní náklady zadává uživatel (bez nich se úspora ani návratnost nepočítá).
    // TČ se vždy počítá za cenu elektřiny ze sítě, přínos FVE je započten jen v kroku FVE.
    var teplo_na_byt   = inp.domZateplen === false ? KALK.TEPLO_KWH_NEZATEPLENY : KALK.TEPLO_KWH_ZATEPLENY;
    var teplo_kwh      = byty * teplo_na_byt;
    var tc_el_kwh      = teplo_kwh / KALK.TC_COP;
    var naklady_dnes   = inp.tcNakladyRucne > 0 ? inp.tcNakladyRucne : 0;
    var tcZnamo        = naklady_dnes > 0;
    var naklady_tc     = tc_el_kwh * cena;
    var uspora_tc      = tcZnamo ? naklady_dnes - naklady_tc : 0;
    var tc_investice   = KALK.tcInvestice(byty);

    // Bezúročný úvěr NZÚ na TČ: menší z investice a limitu na byt, jen jistina
    var tc_uver        = Math.max(N.MIN_UVER, Math.min(tc_investice.mid, KALK.NZU_TC.UVER_NA_BYT * byty));
    var tc_splatnost   = tc_uver <= N.LIMIT_KRATSI ? N.SPLATNOST_KRATSI : N.SPLATNOST_DELSI;
    var tc_splatka_mes = tc_uver / (tc_splatnost * 12);

    // Okna a dveře: základ je dnešní náklad na teplo (po TČ, je-li vybrané)
    var zakladZat      = tcZnamo ? (sel.tc ? naklady_tc : naklady_dnes) : 0;
    var stav           = KALK.OKNA_USPORA[inp.zatStav] || KALK.OKNA_USPORA.stara;
    var uspora_zat_lo  = zakladZat * stav.lo;
    var uspora_zat_hi  = zakladZat * stav.hi;
    var uspora_zatepleni = (uspora_zat_lo + uspora_zat_hi) / 2;
    var naklady_po_zat   = zakladZat - uspora_zatepleni;
    var plocha_byt     = inp.zatPlocha > 0 ? inp.zatPlocha : KALK.OKNA_PLOCHA_NA_BYT;
    var zat_investice  = {
      lo: byty * plocha_byt * KALK.OKNA_CENA_M2.lo * KALK.DPH_SNIZENA,
      hi: byty * plocha_byt * KALK.OKNA_CENA_M2.hi * KALK.DPH_SNIZENA
    };
    zat_investice.mid  = (zat_investice.lo + zat_investice.hi) / 2;
    var zat_uver       = Math.max(N.MIN_UVER, Math.min(zat_investice.mid, KALK.OKNA_NZU_KC_M2 * plocha_byt * byty, KALK.NZU_DILCI_NA_BYT * byty));
    var zat_splatnost  = zat_uver <= N.LIMIT_KRATSI ? N.SPLATNOST_KRATSI : N.SPLATNOST_DELSI;
    var zat_splatka_mes = zat_uver / (zat_splatnost * 12);

    // Souhrn plánu: investice, úspora, návratnost a financování po vybraných krocích
    var RPk = inp.rozpeti || KALK.ROZPETI;
    function band(c) { var a = c * (1 - RPk), b = c * (1 + RPk); return { lo: Math.min(a, b), hi: Math.max(a, b) }; }
    var rows = [];
    if (sel.jom) rows.push({ key: 'jom', name: 'JOM', odhad: false, inv: { lo: jom_investice.lo, hi: jom_investice.hi }, us: band(uspora_jom) });
    if (sel.fve) {
      var fveInv = band(investice_fve_sam), withJom = !sel.jom;
      rows.push({
        key: 'fve', name: withJom ? 'FVE a JOM' : 'FVE', odhad: false,
        inv: { lo: fveInv.lo + (withJom ? jom_investice.lo : 0), hi: fveInv.hi + (withJom ? jom_investice.hi : 0) },
        us: band(uspora_fve + (withJom ? uspora_jom : 0))
      });
    }
    if (sel.tc) rows.push({ key: 'tc', name: 'Teplo a TUV', odhad: true, inv: { lo: tc_investice.lo, hi: tc_investice.hi },
      us: tcZnamo ? band(uspora_tc) : null });
    if (sel.zatepleni) rows.push({ key: 'zat', name: 'Okna a dveře', odhad: true, inv: { lo: zat_investice.lo, hi: zat_investice.hi },
      us: tcZnamo ? { lo: uspora_zat_lo, hi: uspora_zat_hi } : null });
    var pInv = { lo: 0, hi: 0 }, pUs = { lo: 0, hi: 0 }, vseZname = true;
    rows.forEach(function (rw) {
      pInv.lo += rw.inv.lo; pInv.hi += rw.inv.hi;
      if (rw.us) { pUs.lo += rw.us.lo; pUs.hi += rw.us.hi; } else { vseZname = false; }
      rw.nav = (rw.us && rw.us.hi > 0) ? { lo: rw.inv.lo / rw.us.hi, hi: rw.us.lo > 0 ? rw.inv.hi / rw.us.lo : Infinity } : null;
    });
    var pNav = (vseZname && pUs.hi > 0 && rows.length) ? { lo: pInv.lo / pUs.hi, hi: pUs.lo > 0 ? pInv.hi / pUs.lo : Infinity } : null;

    // Úvěr NZÚ: součet úvěrů na FVE, TČ a okna, nejvýše 250 000 Kč na byt u dílčích opatření
    var uverSoucet = (sel.fve ? uver : 0) + (sel.tc ? tc_uver : 0) + (sel.zatepleni ? zat_uver : 0);
    var uverStrop  = KALK.NZU_DILCI_NA_BYT * byty;
    var pUver      = Math.min(uverSoucet, uverStrop);
    var pSplatnost = pUver <= N.LIMIT_KRATSI ? N.SPLATNOST_KRATSI : N.SPLATNOST_DELSI;
    var plan = {
      rows: rows, inv: pInv, us: pUs, vseZname: vseZname, nav: pNav,
      naBytMes: { lo: pUs.lo / 12 / byty, hi: pUs.hi / 12 / byty },
      uver: pUver, uverOmezen: uverSoucet > uverStrop, splatnost: pSplatnost,
      splatka_mes: pUver > 0 ? pUver / (pSplatnost * 12) : 0
    };

    var celkova_uspora =
      (sel.jom       ? uspora_jom       : 0) +
      (sel.fve       ? uspora_fve       : 0) +
      (sel.tc        ? uspora_tc        : 0) +
      (sel.zatepleni ? uspora_zatepleni : 0);

    return {
      uspora_jom: uspora_jom, naklady_bez: naklady_bez, naklady_s_jom: naklady_s_jom,
      jom_investice: jom_investice, jom_navratnost: jom_navratnost,
      vykon: vykon, vyroba: vyroba, fveOmezeni: fveOmezeni, vykonIdeal: vykonIdeal, vykonMax: vykonMax,
      vlastni_bez_jom: vlastni_bez_jom, vlastni_s_jom: vlastni_s_jom,
      investice_baterie: investice_baterie, investice_fve_bez_jom: investice_fve_bez_jom,
      uspora_fve: uspora_fve, uspora_celkem: uspora_celkem, uspora_bez_jom: uspora_bez_jom, investice_fve: investice_fve, navratnost_fve: navratnost_fve,
      uver: uver, uverVzorec: uverVzorec, splatnostLet: splatnostLet, splatka_mes: splatka_mes,
      splatka: splatka_mes * 12, pokryti: pokryti,
      tcZnamo: tcZnamo, teplo_na_byt: teplo_na_byt, naklady_dnes: naklady_dnes, naklady_tc: naklady_tc, tc_el_kwh: tc_el_kwh, uspora_tc: uspora_tc,
      tc_investice: tc_investice, tc_uver: tc_uver, tc_splatnost: tc_splatnost, tc_splatka_mes: tc_splatka_mes,
      zakladZat: zakladZat, uspora_zatepleni: uspora_zatepleni, naklady_po_zat: naklady_po_zat,
      uspora_zat_lo: uspora_zat_lo, uspora_zat_hi: uspora_zat_hi, zat_investice: zat_investice,
      zat_uver: zat_uver, zat_splatnost: zat_splatnost, zat_splatka_mes: zat_splatka_mes, plocha_byt: plocha_byt,
      celkova_uspora: celkova_uspora, plan: plan
    };
  }

  return { compute: compute, regulovane: regulovane };
})();
