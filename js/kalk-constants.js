var KALK = {
  JOM_NA_BYT:        2000,
  FVE_VYROBA_NA_KWP: 1000,
  FVE_VLASTNI_PODIL: 0.65,   // vlastní spotřeba FVE s JOM (bez baterie)
  FVE_VLASTNI_BEZ_JOM: 0.20, // vlastní spotřeba FVE bez JOM, jen společné prostory (bez baterie)
  // Cena elektřiny nahrazené FVE (Kč/kWh, proměnná část vč. DPH).
  // JEDINÉ místo, kde se cena mění: používají ji kalkulačky i texty s atributem data-kalk-cena.
  FVE_CENA_EL:       6.0,
  // Koeficient výnosu podle orientace střechy (jedna tabulka pro všechny nástroje)
  ORIENT: { J: 1.00, JZ: 0.93, JV: 0.93, V: 0.77, Z: 0.77, S: 0.58 },
  // Baterie: zvýšení podílu vlastní spotřeby (procentní body) a orientační cena na byt (0,5 kWh × 20 000 Kč/kWh), neověřeno
  BATERIE_PODIL:     0.15,
  BATERIE_NA_BYT:    10000,   // bez DPH
  FVE_ORIENT_H:      1.0,
  FVE_ORIENT_L:      0.75,
  // Orientační výkon FVE: asi 1,67 kWp na byt (40/24). Meze 20–60 kWp platí pro celý dům celkem, ne na byt.
  // Zatím se ve výpočtu nepoužívají (výkon se dopočítává ze spotřeby v mezích NZÚ).
  FVE_MIN_VYKON:     20,   // kWp celého domu
  FVE_MAX_VYKON:     60,   // kWp celého domu
  FVE_VYKON_NA_BYT:  40 / 24,
  SPOTREBA_NA_BYT:   2200,   // kWh na byt a rok, když uživatel nezadá spotřebu domu (údaj majitele webu)
  // Rozpětí odhadu úspory (± podíl od středu). ROZPETI_NEVIM se použije, když uživatel
  // u většiny upřesňujících údajů odpoví „nevím“. Do doby, než bude určen přesný klíč výpočtu.
  ROZPETI:           0.15,
  ROZPETI_NEVIM:     0.25,

  // Investice (orientační). Ceny investic jsou v konstantách BEZ DPH, výpočet přičítá DPH_SNIZENA (12 %):
  // stavebně-montážní práce na bytovém domě (FVE, baterie, TČ, výměna oken). Elektřina a regulované platby mají 21 %.
  FVE_CENA_KWP:      25500,   // Kč/kWp bez baterie, bez DPH

  // NZÚ bezúročný úvěr pro SVJ a BD, FVE (ověřeno, viz docs/zdroj-pravdy-nzu.md)
  NZU: {
    ZAKLAD:          350000,  // Kč za základní systém 5 kWp
    ZAKLAD_KWP:      5,
    ZA_KWP:          40000,   // Kč za každý další kWp
    BATERIE_KWH:     15000,   // Kč/kWh baterie
    MAX_KWP_NA_BYT:  3,
    MIN_KWP:         5,
    MIN_BYTY:        2,
    MIN_UVER:        100000,
    LIMIT_KRATSI:    1500000, // do této výše splatnost max. 10 let, nad ní 15 let
    SPLATNOST_KRATSI: 10,
    SPLATNOST_DELSI:  15
  },

  // NZÚ bezúročný úvěr pro SVJ a BD, tepelné čerpadlo vzduch-voda
  // (ověřeno: Závazné pokyny NZÚ BD, verze 1.1, červen 2026, podoblast C.1: 150 000 Kč na připojený byt;
  // minimální úvěr 100 000 Kč, doba kompenzace úroků 10 let do 1,5 mil. a 15 let nad)
  NZU_TC: {
    UVER_NA_BYT:     150000
  },

  // Teplo (orientační odhady, nejsou ověřené). Dnešní náklady na teplo zadává uživatel, nepočítají se.
  // kWh tepla (vytápění + TUV) na byt a rok: zateplený dům 8 000 (asi 29 GJ), nezateplený 12 000 (údaj majitele webu)
  TEPLO_KWH_ZATEPLENY:     8000,
  TEPLO_KWH_NEZATEPLENY:   12000,
  TEPLO_KWH_NA_BYT:        8000,   // výchozí hodnota (zateplený dům)
  TC_COP:                  3.0,    // konzervativní hodnota

  // Okna a dveře (orientační odhady, neověřené). Úspora = podíl z nákladů na teplo podle stavu oken,
  // rozpětí vychází z veřejných zdrojů (výměna starých oken 15–25 %, výjimečně do 30 %).
  OKNA_USPORA: {
    stara:    { lo: 0.15, hi: 0.25 },  // stará okna, před rokem 1990
    castecne: { lo: 0.08, hi: 0.12 },  // částečně vyměněná, 1990–2010
    nova:     { lo: 0.00, hi: 0.05 }   // nová okna, po roce 2010
  },
  OKNA_PLOCHA_NA_BYT: 8,                         // m² oken a dveří na byt
  OKNA_CENA_M2:       { lo: 8000, hi: 12000 },   // Kč/m² výměny včetně montáže, bez DPH
  // NZÚ, podoblast A: podpora výplní otvorů až 12 000 Kč/m² (ověřeno, pokyny NZÚ BD verze 1.1, červen 2026),
  // u dílčích opatření celkem max. 250 000 Kč na byt, podmínka Uw ≤ 0,90 W/m²K
  OKNA_NZU_KC_M2:     12000,
  NZU_DILCI_NA_BYT:   250000,

  // Ceny elektřiny a regulovaných plateb jsou s DPH 21 %
  DPH:               1.21,
  // Snížená sazba 12 % na stavebně-montážní práce na bytovém domě (montáž, úprava rozvaděče a hlavního jističe)
  DPH_SNIZENA:       1.12,
  // Záložní odhad regulovaných plateb na byt (s DPH), když chybí js/kalk-ceny.js
  REGULOVANE_NA_BYT: 8000
};

// Rozsah počtu bytů: stejný ve všech nástrojích (mini kalkulačka má kratší posuvník)
KALK.BYTY_MIN = 4;   // minimální počet bytů ve všech kalkulačkách a dotaznících (pravidlo NZÚ je 2 byty, viz NZU.MIN_BYTY)
KALK.BYTY_MAX = 300;
KALK.BYTY_MINI_MAX = 120;

// Odkaz do hlavní kalkulačky s předvyplněnými údaji (parametry v adrese): byty, spotreba, orientace, reseni (jom,fve,tc,okna)
KALK.odkazKalkulacka = function (o) {
  o = o || {};
  var q = [];
  var byty = Math.round(o.byty);
  if (byty >= KALK.BYTY_MIN) q.push('byty=' + Math.min(byty, KALK.BYTY_MAX));
  if (o.spotreba > 0) q.push('spotreba=' + Math.round(o.spotreba));
  if (o.orientace && KALK.ORIENT[o.orientace]) q.push('orientace=' + o.orientace);
  if (o.reseni && o.reseni.length) q.push('reseni=' + o.reseni.join(','));
  return 'kalkulacka.html' + (q.length ? '?' + q.join('&') : '');
};
// Nastaví odkaz do hlavní kalkulačky; parametry se při kliknutí uloží i do sessionStorage, aby předvyplnění
// fungovalo i tam, kde přesměrování na „hezkou“ adresu zahodí query string
KALK.nastavOdkaz = function (a, o) {
  if (!a) return;
  var href = KALK.odkazKalkulacka(o);
  a.href = href;
  var i = href.indexOf('?');
  if (i >= 0) a.setAttribute('data-kalk-prefill', href.slice(i + 1)); else a.removeAttribute('data-kalk-prefill');
};
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('a[data-kalk-prefill]') : null;
  if (!a) return;
  try { sessionStorage.setItem('eh_prefill', a.getAttribute('data-kalk-prefill')); } catch (err) {}
});
// Načtení a ověření parametrů z adresy (hlavní kalkulačka)
KALK.nactiParametry = function (search) {
  var sp;
  try { sp = new URLSearchParams(search || ''); } catch (e) { return null; }
  var r = { byty: 0, spotreba: 0, orientace: '', reseni: [] };
  var b = parseInt(sp.get('byty'), 10);
  if (b >= KALK.BYTY_MIN) r.byty = Math.min(b, KALK.BYTY_MAX);
  var sa = parseInt(sp.get('spotreba'), 10);
  if (sa >= 1000 && sa <= 2000000) r.spotreba = sa;
  var o = sp.get('orientace');
  if (o && KALK.ORIENT[o]) r.orientace = o;
  var map = { jom: 'jom', fve: 'fve', tc: 'tc', teplo: 'tc', okna: 'zatepleni', zatepleni: 'zatepleni' };
  (sp.get('reseni') || '').split(',').forEach(function (k) {
    if (map[k] && r.reseni.indexOf(map[k]) === -1) r.reseni.push(map[k]);
  });
  return (r.byty || r.spotreba || r.orientace || r.reseni.length) ? r : null;
};

// Jedno pravidlo rozpětí pro všechny nástroje: ±15 %, při dvou a více neznámých vstupech (spotřeba, orientace…) ±25 %
KALK.rozpeti = function (pocetNeznamych) {
  return pocetNeznamych >= 2 ? KALK.ROZPETI_NEVIM : KALK.ROZPETI;
};

// Investice do zřízení JOM = ceny z js/kalk-ceny.js (jsou bez DPH) převedené na ceny s DPH:
// montáž a úprava hlavního jističe 12 % (stavebně-montážní práce na bytovém domě), gateway, projekt
// a elektroměry 21 % (zboží a služba). Za dům: gateway, projekt, hlavní jistič; na každý byt: montáž
// a podružný elektroměr (1f až 3f). Ceny jsou rozpětí, proto lo/hi. Bez připojovacího poplatku distributora
// za navýšení rezervovaného příkonu (630 Kč za 1 A u třífázového jističe).
// Záloha, když chybí js/kalk-ceny.js: starší odhad 10 000–25 000 Kč na byt.
KALK.jomInvestice = function (byty) {
  var c = (typeof KALK_CENY !== 'undefined' && KALK_CENY.investice) ? KALK_CENY.investice : null;
  var lo, hi, D = KALK.DPH, S = KALK.DPH_SNIZENA;
  if (c && c.montaz_na_byt && c.hlavni_jistic) {
    lo = (c.gateway + c.projekt) * D + c.hlavni_jistic.lo * S + byty * (c.montaz_na_byt.lo * S + c.elektromer_1f * D);
    hi = (c.gateway + c.projekt) * D + c.hlavni_jistic.hi * S + byty * (c.montaz_na_byt.hi * S + c.elektromer_3f * D);
  } else {
    lo = byty * 10000; hi = byty * 25000;
  }
  return { lo: lo, hi: hi, mid: (lo + hi) / 2, naBytLo: lo / byty, naBytHi: hi / byty };
};

// Orientační investice do tepelného čerpadla pro bytový dům na klíč (technologie, montáž, kotelna), Kč na byt.
// Údaj majitele webu, 2026 (neověřeno), ceny bez DPH (výpočet přičítá 12 %), s rostoucím počtem bytů cena na byt klesá.
// Mezi body se interpoluje lineárně, mimo krajní body zůstává poslední hodnota.
KALK.TC_INVESTICE = [
  { byty: 10, lo: 95000, hi: 110000 },
  { byty: 20, lo: 85000, hi: 95000 },
  { byty: 40, lo: 70000, hi: 85000 },
  { byty: 80, lo: 55000, hi: 65000 }
];
KALK.tcInvestice = function (byty) {
  var pts = KALK.TC_INVESTICE, a = pts[0], b = pts[pts.length - 1];
  var lo, hi;
  if (byty <= a.byty) { lo = a.lo; hi = a.hi; }
  else if (byty >= b.byty) { lo = b.lo; hi = b.hi; }
  else {
    for (var i = 0; i < pts.length - 1; i++) {
      if (byty >= pts[i].byty && byty <= pts[i + 1].byty) {
        var t = (byty - pts[i].byty) / (pts[i + 1].byty - pts[i].byty);
        lo = pts[i].lo + (pts[i + 1].lo - pts[i].lo) * t;
        hi = pts[i].hi + (pts[i + 1].hi - pts[i].hi) * t;
        break;
      }
    }
  }
  var S = KALK.DPH_SNIZENA;  // ceny jsou bez DPH, výstup je s DPH 12 %
  lo *= S; hi *= S;
  return { lo: lo * byty, hi: hi * byty, mid: (lo + hi) / 2 * byty, naBytLo: lo, naBytHi: hi };
};

// Texty s cenou: <b data-kalk-cena="1">6,0</b> se po načtení přepíše na aktuální KALK.FVE_CENA_EL
// (počet desetinných míst určuje hodnota atributu). Pevný text v HTML slouží jako záloha bez JS.
(function () {
  function fill() {
    var els = document.querySelectorAll('[data-kalk-cena]');
    for (var i = 0; i < els.length; i++) {
      var d = parseInt(els[i].getAttribute('data-kalk-cena'), 10);
      els[i].textContent = KALK.FVE_CENA_EL.toFixed(isNaN(d) ? 1 : d).replace('.', ',');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
  else fill();
})();

// Verze výpočtu a snímek předpokladů. Ukládá se spolu s poptávkou (Supabase), aby šlo zpětně poznat,
// z jakých cen a konstant byl výsledek spočítaný. Při změně cen nebo vzorců zvyšte KALK.VERZE.
KALK.VERZE = '2026-11-12';
KALK.predpoklady = function () {
  var ceny = (typeof KALK_CENY !== 'undefined') ? KALK_CENY : null;
  return {
    verze: KALK.VERZE,
    ceniky_platnost: ceny ? ceny.platnost : null,
    jom_na_byt: KALK.JOM_NA_BYT,
    spotreba_na_byt: KALK.SPOTREBA_NA_BYT,
    cena_el: KALK.FVE_CENA_EL,
    fve_cena_kwp_bez_dph: KALK.FVE_CENA_KWP,
    baterie_na_byt_bez_dph: KALK.BATERIE_NA_BYT,
    vlastni_podil_s_jom: KALK.FVE_VLASTNI_PODIL,
    vlastni_podil_bez_jom: KALK.FVE_VLASTNI_BEZ_JOM,
    vyroba_na_kwp: KALK.FVE_VYROBA_NA_KWP,
    teplo_zatepleny: KALK.TEPLO_KWH_ZATEPLENY,
    teplo_nezatepleny: KALK.TEPLO_KWH_NEZATEPLENY,
    cop: KALK.TC_COP,
    dph: KALK.DPH,
    dph_snizena: KALK.DPH_SNIZENA,
    rozpeti: KALK.ROZPETI,
    rozpeti_nevim: KALK.ROZPETI_NEVIM
  };
};
