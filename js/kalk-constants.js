var KALK = {
  JOM_NA_BYT:        2000,
  FVE_VYROBA_NA_KWP: 1000,
  FVE_VLASTNI_PODIL: 0.60,   // podíl VYROBENÉ elektřiny využitý v domě s JOM (bez baterie); stejná hodnota v hlavní kalkulačce, kalkulačce FVE i dotazníku JOM
  FVE_VLASTNI_BEZ_JOM: 0.25, // podíl vyrobené elektřiny využitý bez JOM, jen společné prostory (bez baterie)
  // Cena elektřiny nahrazené FVE (Kč/kWh, proměnná část vč. DPH).
  // JEDINÉ místo, kde se cena mění: používají ji kalkulačky i texty s atributem data-kalk-cena.
  FVE_CENA_EL:       6.0,
  // Ocenění 1 kWh z vlastní FVE (Kč, vč. DPH): rozdíl nákupní ceny a ušlého výkupu přebytku. Používá se pro úsporu z FVE
  // v hlavní kalkulačce, kalkulačce FVE i v dotazníku JOM (cena ze sítě FVE_CENA_EL zůstává pro tepelné čerpadlo a náklady dnes).
  FVE_OCENENI_KWH:   4.8,
  // Přetoky (výroba, kterou dům nespotřebuje) se prodávají do sítě za výkupní cenu (Kč/kWh). ODHAD, K OVĚŘENÍ
  // (obecně se uvádí 1 až 1,5 Kč/kWh, 0,80 je opatrnější hodnota).
  FVE_VYKUP_KWH:     0.80,
  // Horní mez výkonu FVE: asi 1,5 kWp na byt podle plochy střechy (ODHAD, K OVĚŘENÍ) a 99 kWp, aby systém nespadl
  // nad hranici 100 kW (výrobna nad 100 kW potřebuje licenci ERÚ a stavební povolení).
  FVE_STRECHA_KWP_NA_BYT: 1.5,
  FVE_MAX_KWP:       99,
  // Provoz FVE (servis, revize, konektivita): 0,5 % investice do FVE ročně, nejméně 3 000 Kč (ODHAD, K OVĚŘENÍ).
  // Rozúčtování JOM se neodečítá zvlášť, je už v úspoře z JOM (KALK_CENY.rozuctovani_dum a rozuctovani_na_byt).
  FVE_PROVOZ_PODIL:  0.005,
  FVE_PROVOZ_MIN:    3000,
  // Společné prostory: roční spotřeba na byt a podíl, který pokryje FVE přímo (ODHAD, K OVĚŘENÍ); jen pro rozpis úspory
  SPOLECNE_KWH_NA_BYT: 300,
  SPOLECNE_PODIL:    0.5,
  // Koeficient výnosu podle orientace střechy (jedna tabulka pro všechny nástroje)
  // Klíče JZ a Z zůstávají kvůli starým odkazům a uloženým poptávkám, ve výběru se nabízejí sloučené (JV = JV / JZ, V = V / Z).
  // P = plochá střecha: průměr jižního uspořádání panelů (asi 0,91) a východo-západního (asi 0,83) podle PVGIS (JRC).
  ORIENT: { J: 1.00, JZ: 0.93, JV: 0.93, V: 0.77, Z: 0.77, S: 0.58, P: 0.87 },
  // Volby ve formulářích (pořadí a popisky) a názvy do textů, PDF a shrnutí poptávek
  ORIENT_VOLBY: [['J', 'Jih'], ['JV', 'Jihovýchod / jihozápad'], ['V', 'Východ / západ'], ['S', 'Sever'], ['P', 'Plochá střecha']],
  ORIENT_NAZVY: { J: 'jih', JV: 'jihovýchod nebo jihozápad', JZ: 'jihozápad', V: 'východ nebo západ', Z: 'západ', S: 'sever', P: 'plochá střecha' },
  // Baterie: zvýšení podílu vlastní spotřeby (procentní body) a orientační cena na byt (0,5 kWh × 20 000 Kč/kWh), neověřeno
  BATERIE_PODIL:     0.18,
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
  // Jen nápověda v poli „Roční náklady na teplo a TUV dnes“ (placeholder), do výpočtu nevstupuje. ODHAD, neověřeno.
  TEPLO_NAKLADY_NAPOVEDA_NA_BYT: 29000,   // Kč/byt/rok (včetně DPH)
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

// Dotazník JOM verze B: model FVE (odhad zadaný majitelem webu, neověřeno).
// Využití výroby bez JOM 25 %, s JOM 60 %, ušetřená kWh 4,80 Kč včetně DPH, přetok 0,80 Kč; bez znalosti výkonu 1 kWp na byt.
KALK.JOM_B = { vlastni_bez_jom: KALK.FVE_VLASTNI_BEZ_JOM, vlastni_s_jom: KALK.FVE_VLASTNI_PODIL, kc_kwh: KALK.FVE_OCENENI_KWH, vykup_kwh: KALK.FVE_VYKUP_KWH, kwp_na_byt: 1 };

// Stará volba (JZ, Z) se ve výběru zobrazí jako sloučená (JV, V)
KALK.orientVolba = function (k) { return k === 'JZ' ? 'JV' : k === 'Z' ? 'V' : k; };
// Věta do shrnutí a poptávek: "orientace střechy jih" / "plochá střecha"; prázdná, pokud klíč neznáme
KALK.orientVeta = function (k) {
  var n = KALK.ORIENT_NAZVY[k];
  return n ? (k === 'P' ? n : 'orientace střechy ' + n) : '';
};

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

// Nejistoty jednotlivých vstupů (± podíl). Základ = ceny nabídek a nepřesnost modelu, když uživatel zná všechno.
// Každý neznámý (odhadnutý) vstup přidá svou nejistotu; skládají se v kvadratuře, protože na sobě nezávisí
// a málokdy jsou všechny odhady špatně současně (odmocnina ze součtu čtverců, ne prostý součet).
KALK.NEJISTOTA = { zaklad: 0.10, spotreba: 0.15, zaloha: 0.10, orientace: 0.10, distributor: 0.10, pripojeni: 0.08 };

// Roční spotřeba domu z měsíční zálohy na elektřinu v typickém bytě (Kč vč. DPH).
// Záloha obsahuje stálé platby (jistič, provoz nesíťové infrastruktury, stálá platba dodavateli); ty se odečtou
// (průměr distributorů a jističů 1×25 A a 3×20 A z KALK_CENY, vč. DPH 21 %) a zbytek se vydělí cenou 1 kWh.
// ODHAD: předpokládá, že záloha odpovídá skutečným nákladům; spodní mez 800 kWh na byt a rok.
KALK.stalePlatbyBytuMesic = function () {
  var C = window.KALK_CENY;
  if (!C || !C.distribuce) return 0;
  var js = Object.keys(C.distribuce).map(function (d) { return C.distribuce[d].D02d.jistic; });
  function prumer(k) { return js.reduce(function (a, j) { return a + j[k]; }, 0) / js.length; }
  var jistic = (prumer('1x25') + prumer('3x20')) / 2;
  return Math.round((jistic + C.provoz_nesitove_infrastruktury + (C.dodavatel_stala_platba || 0)) * 1.21);   // zaokrouhleno na celé Kč (≈ 336)
};
KALK.spotrebaZeZalohy = function (byty, zaloha) {
  var rocniKc = Math.max(0, zaloha * 12 - KALK.stalePlatbyBytuMesic() * 12);
  var naByt = Math.max(800, rocniKc / KALK.FVE_CENA_EL);
  return Math.round(byty * naByt);
};

// Rozpětí podle neznámých vstupů: KALK.rozpeti(['spotreba', 'orientace']) → např. 0,21.
// Číslo (počet neznámých) zůstává jen pro dotazník JOM: 0–1 neznámé ±15 %, 2 a více ±25 %.
KALK.rozpeti = function (neznamy) {
  if (typeof neznamy === 'number') return neznamy >= 2 ? KALK.ROZPETI_NEVIM : KALK.ROZPETI;
  var N = KALK.NEJISTOTA, q = N.zaklad * N.zaklad;
  (neznamy || []).forEach(function (k) { if (k && N[k]) q += N[k] * N[k]; });
  return Math.round(Math.sqrt(q) * 100) / 100;
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
KALK.VERZE = '2026-11-27e';
KALK.predpoklady = function () {
  var ceny = (typeof KALK_CENY !== 'undefined') ? KALK_CENY : null;
  return {
    verze: KALK.VERZE,
    ceniky_platnost: ceny ? ceny.platnost : null,
    jom_na_byt: KALK.JOM_NA_BYT,
    spotreba_na_byt: KALK.SPOTREBA_NA_BYT,
    cena_el: KALK.FVE_CENA_EL,
    oceneni_kwh: KALK.FVE_OCENENI_KWH,
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

// Nápověda (placeholder) v polích podle počtu bytů: orientační částka, nevstupuje do výpočtu.
// bytyIds: pole id vstupů s počtem bytů, cile: id polí s nápovědou, perByt: hodnota na byt, krok: zaokrouhlení, vychozi: text bez platného počtu bytů
KALK.vazNapovedu = function (bytyIds, cile, perByt, krok, vychozi) {
  function upd(e) {
    // Při změně se bere hodnota pole, které ji vyvolalo (posuvník a číslo se synchronizují později)
    var src = e && e.target && e.target.id ? e.target : document.getElementById(bytyIds[bytyIds.length - 1]);
    var byty = src ? parseInt(src.value, 10) : 0;
    var ok = byty >= KALK.BYTY_MIN && byty <= KALK.BYTY_MAX;
    var n = ok ? Math.round(byty * perByt / krok) * krok : vychozi;
    var txt = 'např. ' + n.toLocaleString('cs-CZ').replace(/\s/g, ' ');
    cile.forEach(function (id) { var el = document.getElementById(id); if (el) el.setAttribute('placeholder', txt); });
  }
  bytyIds.forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener('input', upd); });
  upd();
};
