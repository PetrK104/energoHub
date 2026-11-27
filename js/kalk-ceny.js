/* Ceny pro kalkulačky a dotazníky. Všechny ceny jsou v Kč bez DPH.
   JEDINÉ místo, kde se ceny mění. Hodnota null = cena zatím není ověřená:
   výstup, který by ji potřeboval, se nezobrazí (nic se nedomýšlí). */
var KALK_CENY = {
  platnost: 'od 1. 1. 2026',
  zdroj: 'Regulované ceny dle cenových výměrů ERÚ č. 13/2025 a 14/2025 (převzato z ceníku Yello Watt 2026, distribuční sazby domácností).',

  // Měsíční plat za rezervovaný příkon (Kč/měsíc) podle jističe před elektroměrem
  // a cena distribuce (Kč/MWh). Klíče jističe: '1x25' = do 1×25 A (do 3×10 A), '3x16', '3x20', '3x25'.
  distribuce: {
    cez: {
      nazev: 'ČEZ Distribuce',
      D02d: { jistic: { '1x25': 102, '3x16': 164, '3x20': 205, '3x25': 256, '3x40': 409 }, vt: 2078.58, hlavni: { a63: 644, kc_na_a: 10.23 } },
      D25d: { jistic: { '1x25': 107, '3x16': 172, '3x20': 215, '3x25': 269 }, vt: 2252.45, nt: 116.50 }
    },
    egd: {
      nazev: 'EG.D',
      D02d: { jistic: { '1x25': 100, '3x16': 160, '3x20': 200, '3x25': 250, '3x40': 400 }, vt: 2295.34, hlavni: { a63: 629, kc_na_a: 9.99 } },
      D25d: { jistic: { '1x25': 98, '3x16': 157, '3x20': 196, '3x25': 245 }, vt: 2243.88, nt: 224.30 }
    },
    pre: {
      nazev: 'PRE',
      D02d: { jistic: { '1x25': 87, '3x16': 139, '3x20': 173, '3x25': 217, '3x40': 347 }, vt: 1516.53, hlavni: { a63: 551, kc_na_a: 8.74 } },
      D25d: { jistic: { '1x25': 80, '3x16': 128, '3x20': 160, '3x25': 200 }, vt: 1656.49, nt: 175.20 }
    }
  },

  // Hlavní jistič JOM (celý dům), sazba D02d: hlavni.a63 = měsíční plat za jistič 3×63 A, nad 63 A se platí kc_na_a za 1 A (Kč/měsíc, bez DPH).
  // PŘEVZATO z neověřeného textu, K OVĚŘENÍ v rozhodnutí ERÚ (včetně toho, zda se hlavní jistič JOM platí v sazbě D02d).
  // Hodnota ČEZ 3×63 A = 644 Kč souhlasí s výstupy kalkulaček Enerooo (644 Kč) a Helioware (780 Kč s DPH).

  // Odhady pro dotazník JOM (Kč za měsíc, bez DPH). NEOVĚŘENO, jen odhad zadaný majitelem webu (listopad 2026):
  // stálá měsíční platba dodavateli elektřiny za odběrné místo (nejlevnější tarify 100 Kč, běžně 120 až 145 Kč),
  // rozúčtování podružných měřidel: pevná část za dům + část za byt (u 12 bytů vychází 70 Kč na byt).
  // Společné odběrné místo domu (jistič 3×16 A, sazba D02d) po zavedení JOM zaniká, počítá se jen v „Dnes“.
  // Jistič 3×40 A (D02d) je z neověřeného textu.
  dodavatel_stala_platba: 120,
  rozuctovani_dum:        300,
  rozuctovani_na_byt:      45,
  spolecne_om_jistic:    '3x16',

  // Platby společné pro všechny sazby
  provoz_nesitove_infrastruktury: 12.87, // Kč / odběrné místo / měsíc
  poze_jistic:                     8.32, // Kč / A / fáze / měsíc (platí se nižší z této a ceny podle spotřeby)
  poze_spotreba:                 495.00, // Kč / MWh
  systemove_sluzby:              164.24, // Kč / MWh
  dan_z_elektriny:                28.30, // Kč / MWh

  // Investice do JOM (údaje majitele webu, listopad 2026, jednorázové ceny BEZ DPH; elektroměry jen orientačně).
  // DPH se přičítá ve výpočtu (KALK.jomInvestice): 12 % práce, 21 % zboží a projekt. Bez připojovacího poplatku distributora (630 Kč/A).
  // Celý dům: gateway, projekt, hlavní jistič. Na byt: montáž a podružný elektroměr (jednofázový až třífázový).
  investice: {
    elektromer_1f: 1450, // M-Bus podružný, jednofázový (maloobchodní cena z e-shopu, jen orientačně)
    elektromer_3f: 4300, // M-Bus podružný, třífázový (maloobchodní cena z e-shopu, jen orientačně)
    gateway:       15000,                      // datová brána, celý dům
    montaz_na_byt: { lo: 2500, hi: 4000 },     // montáž na bytovou jednotku
    projekt:       35000,                      // projekt, celý dům
    hlavni_jistic: { lo: 8000, hi: 16000 }     // hlavní jistič JOM, celý dům
  },

  // Distribuční sazba hlavního jističe JOM za celý dům: sazba C02d, Kč za měsíc (údaj majitele webu).
  // Zatím se nepoužívá ve výpočtu úspory, úspora JOM vychází z KALK.JOM_NA_BYT.
  hlavni_jistic_sazba_c02d: { lo: 1800, hi: 2400 }
};
