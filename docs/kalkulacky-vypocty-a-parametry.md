# Kalkulačky: parametry a výpočty k ověření

Interní dokument (složka `docs/` se na web nenasazuje). Účel: ověřit všechny hodnoty a vzorce, podle kterých počítají kalkulačky a dotazník, a nastavit je správně.
Stav k verzi výpočtu `2026-11-27`. Všechny částky ve výsledcích jsou **s DPH**, ceny investic jsou níže uvedené **bez DPH** (DPH přičítá výpočet).

**Stav původu hodnoty:**
- **OVĚŘENO** – z primárního dokumentu (Závazné pokyny NZÚ)
- **PŘEVZATO** – z jiného webu (srovnávač, ceník, e-shop), neověřeno nabídkou
- **ODHAD** – vymyšleno bez zdroje
- **PRAVIDLO** – rozhodnutí o fungování modelu

Sloupec **Nová hodnota** je prázdný, vyplňte ho tam, kde se má hodnota změnit.

---

## A. Parametry

### A1. Elektřina a fotovoltaika

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 1 | Cena elektřiny | Cena ze sítě (proměnná část s DPH): za ni se počítá provoz tepelného čerpadla a náklady „elektřina dnes“. Ocenění kWh z FVE je samostatné, viz řádek 1a | 6,0 Kč/kWh | PŘEVZATO (srovnávače, rozsah 5,6–6,6) | | `FVE_CENA_EL` |
| 1a | Ocenění 1 kWh z vlastní FVE | Hodnota ušetřené kWh (nákupní cena minus ušlý výkup přebytku, s DPH). Používá se pro úsporu z FVE v hlavní kalkulačce, kalkulačce FVE i dotazníku JOM; při ruční změně ceny elektřiny se úměrně upraví | 4,80 Kč/kWh | ODHAD (majitel, 27. 11. 2026) | | `FVE_OCENENI_KWH` |
| 2 | Výroba FVE | Roční výroba z 1 kWp při orientaci na jih | 1 000 kWh/kWp | ODHAD | | `FVE_VYROBA_NA_KWP` |
| 3 | Vlastní spotřeba s JOM | Podíl výroby, který spotřebuje dům, když je zavedeno JOM (bez baterie); stejná hodnota v dotazníku JOM | 60 % | ODHAD (majitel, 27. 11. 2026) | | `FVE_VLASTNI_PODIL` |
| 4 | Vlastní spotřeba bez JOM | Podíl výroby spotřebovaný jen ve společných prostorách (bez baterie); stejná hodnota v dotazníku JOM | 25 % | ODHAD (majitel, 27. 11. 2026) | | `FVE_VLASTNI_BEZ_JOM` |
| 5 | Přírůstek s baterií | O kolik procentních bodů baterie zvýší podíl vlastní spotřeby | +15 p. b. | ODHAD | | `BATERIE_PODIL` |
| 6 | Cena FVE | Cena instalace za 1 kWp, bez baterie, bez DPH | 25 500 Kč/kWp | ODHAD | | `FVE_CENA_KWP` |
| 7 | Cena baterie | Cena na jeden byt (0,5 kWh × 20 000 Kč/kWh), bez DPH | 10 000 Kč/byt | PŘEVZATO | | `BATERIE_NA_BYT` |
| 8 | Spotřeba na byt | Roční spotřeba elektřiny na byt, když uživatel nezadá spotřebu domu | 2 200 kWh/byt | ODHAD | | `SPOTREBA_NA_BYT` |
| 9 | Orientace: jih | Koeficient výroby podle orientace střechy | 1,00 | ODHAD | | `ORIENT.J` |
| 10 | Orientace: jihovýchod, jihozápad | totéž (ve výběru sloučeno do volby JV / JZ) | 0,93 | ODHAD | | `ORIENT.JV`, `JZ` |
| 11 | Orientace: východ, západ | totéž (ve výběru sloučeno do volby V / Z) | 0,77 | ODHAD | | `ORIENT.V`, `Z` |
| 12 | Orientace: sever | totéž | 0,58 | ODHAD | | `ORIENT.S` |
| 12a | Orientace: plochá střecha | totéž; průměr jižního uspořádání panelů (cca 0,91) a východo-západního (cca 0,83) | 0,87 | ODHAD (podle PVGIS, JRC, 4 města) | PVGIS 5.3, sklon 10°, ztráty 14 %; poměr k jihu 35° | `ORIENT.P` |

### A2. Jednotné odběrné místo (JOM)

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 13 | Úspora JOM, náhradní hodnota | Plošná roční úspora na byt. Používá se jen tehdy, když nejsou ověřené ceny pro bilanci z A8 a B9 (hlavní kalkulačka a dotazník JOM ji běžně nepoužívají) | 2 000 Kč/byt/rok | ODHAD | | `JOM_NA_BYT` |
| 14 | Gateway | Datová brána, za celý dům, bez DPH | 15 000 Kč | PŘEVZATO | | `investice.gateway` |
| 15 | Projekt | Projekt JOM, za celý dům, bez DPH | 35 000 Kč | PŘEVZATO | | `investice.projekt` |
| 16 | Hlavní jistič | Hlavní jistič JOM, za celý dům, bez DPH | 8 000 až 16 000 Kč | PŘEVZATO | | `investice.hlavni_jistic` |
| 17 | Montáž na byt | Montáž na jednu bytovou jednotku, bez DPH | 2 500 až 4 000 Kč | PŘEVZATO | | `investice.montaz_na_byt` |
| 18 | Elektroměr jednofázový | Podružný elektroměr M-Bus na byt, bez DPH (cena z e-shopu) | 1 450 Kč | PŘEVZATO | | `investice.elektromer_1f` |
| 19 | Elektroměr třífázový | Podružný elektroměr M-Bus na byt, bez DPH (cena z e-shopu) | 4 300 Kč | PŘEVZATO | | `investice.elektromer_3f` |

### A3. Teplo a tepelné čerpadlo (TČ)

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 20 | Teplo, zateplený dům | Roční spotřeba tepla (vytápění + TUV) na byt | 8 000 kWh/byt | PŘEVZATO | | `TEPLO_KWH_ZATEPLENY` |
| 21 | Teplo, nezateplený dům | totéž | 12 000 kWh/byt | PŘEVZATO | | `TEPLO_KWH_NEZATEPLENY` |
| 22 | COP čerpadla | Kolik kWh tepla vyrobí 1 kWh elektřiny | 3,0 | PŘEVZATO | | `TC_COP` |
| 23 | Investice TČ, 10 bytů | Cena na klíč za byt, bez DPH | 95 000 až 110 000 Kč/byt | PŘEVZATO | | `TC_INVESTICE` |
| 24 | Investice TČ, 20 bytů | totéž | 85 000 až 95 000 Kč/byt | PŘEVZATO | | `TC_INVESTICE` |
| 25 | Investice TČ, 40 bytů | totéž | 70 000 až 85 000 Kč/byt | PŘEVZATO | | `TC_INVESTICE` |
| 26 | Investice TČ, 80 bytů | totéž | 55 000 až 65 000 Kč/byt | PŘEVZATO | | `TC_INVESTICE` |

### A4. Okna a dveře

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 27 | Úspora, stará okna | Podíl z nákladů na teplo, okna před rokem 1990 | 15 až 25 % | PŘEVZATO | | `OKNA_USPORA.stara` |
| 28 | Úspora, částečně vyměněná | Okna z let 1990 až 2010 | 8 až 12 % | ODHAD | | `OKNA_USPORA.castecne` |
| 29 | Úspora, nová okna | Okna po roce 2010 | 0 až 5 % | ODHAD | | `OKNA_USPORA.nova` |
| 30 | Plocha oken a dveří | Výchozí plocha na byt | 8 m²/byt | ODHAD | | `OKNA_PLOCHA_NA_BYT` |
| 31 | Cena výměny | Výměna včetně montáže, bez DPH | 8 000 až 12 000 Kč/m² | PŘEVZATO | | `OKNA_CENA_M2` |

### A5. Nová zelená úsporám (NZÚ), bezúročný úvěr pro SVJ a BD

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 32 | Základ úvěru na FVE | Úvěr za základní systém 5 kWp | 350 000 Kč | OVĚŘENO | | `NZU.ZAKLAD` |
| 33 | Přírůstek za kWp | Úvěr za každý další kWp nad 5 | 40 000 Kč/kWp | OVĚŘENO | | `NZU.ZA_KWP` |
| 34 | Max. výkon FVE | Nejvýše na jeden byt | 3 kWp/byt | OVĚŘENO | | `NZU.MAX_KWP_NA_BYT` |
| 35 | Min. výkon FVE | Nejméně celkem | 5 kWp | OVĚŘENO | | `NZU.MIN_KWP` |
| 36 | Minimální úvěr | Nejnižší poskytnutý úvěr | 100 000 Kč | OVĚŘENO | | `NZU.MIN_UVER` |
| 37 | Hranice splatnosti | Do této výše splatnost 10 let, nad ní 15 let | 1 500 000 Kč | OVĚŘENO | | `NZU.LIMIT_KRATSI` |
| 38 | Úvěr na TČ | Limit na jeden byt | 150 000 Kč/byt | OVĚŘENO | | `NZU_TC.UVER_NA_BYT` |
| 39 | Úvěr na okna | Limit na m² | 12 000 Kč/m² | OVĚŘENO | | `OKNA_NZU_KC_M2` |
| 40 | Strop dílčích opatření | Souhrnný limit úvěru na byt (FVE, TČ, okna dohromady) | 250 000 Kč/byt | OVĚŘENO | | `NZU_DILCI_NA_BYT` |

### A6. Regulované ceny elektřiny (platnost od 1. 1. 2026, sazba D02d, bez DPH)

Zdroj: cenové výměry ERÚ č. 13/2025 a 14/2025, **převzato z ceníku dodavatele** (Yello Watt). Ovlivňují graf ročních nákladů v hlavní kalkulačce, výpočet úspory v dotazníku JOM (viz A8 a B9).

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 41 | ČEZ, jistič 1×25 A | Měsíční plat za jistič | 102 Kč/měs. | PŘEVZATO | | `distribuce.cez.D02d.jistic` |
| 42 | ČEZ, jistič 3×20 A | totéž | 205 Kč/měs. | PŘEVZATO | | totéž |
| 43 | ČEZ, distribuce | Cena distribuce ve vysokém tarifu | 2 078,58 Kč/MWh | PŘEVZATO | | `distribuce.cez.D02d.vt` |
| 44 | EG.D, jistič 1×25 A | Měsíční plat za jistič | 100 Kč/měs. | PŘEVZATO | | `distribuce.egd.D02d.jistic` |
| 45 | EG.D, jistič 3×20 A | totéž | 200 Kč/měs. | PŘEVZATO | | totéž |
| 46 | PRE, jistič 1×25 A | Měsíční plat za jistič | 87 Kč/měs. | PŘEVZATO | | `distribuce.pre.D02d.jistic` |
| 47 | PRE, jistič 3×20 A | totéž | 173 Kč/měs. | PŘEVZATO | | totéž |
| 48 | Provoz nesíťové infrastruktury | Měsíční platba za odběrné místo | 12,87 Kč/měs. | PŘEVZATO | | `provoz_nesitove_infrastruktury` |
| 49 | POZE podle jističe | Platba za ampér a fázi (platí se nižší z #49 a #50). **Od 1. 1. 2026 nejspíš nulová** (viz D7) | 8,32 Kč/A/fáze/měs. | PŘEVZATO, ZASTARALÉ | | `poze_jistic` |
| 50 | POZE podle spotřeby | Platba za spotřebu. **Od 1. 1. 2026 nulová** podle ERÚ (viz D7) | 495 Kč/MWh | PŘEVZATO, ZASTARALÉ | | `poze_spotreba` |
| 51 | Systémové služby | Platba za spotřebu | 164,24 Kč/MWh | PŘEVZATO | | `systemove_sluzby` |

### A7. Pravidla modelu

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 52 | DPH 21 % | Elektřina, regulované platby, gateway, projekt, elektroměry | 1,21 | PRAVIDLO | | `DPH` |
| 53 | DPH 12 % | Stavebně-montážní práce: FVE, baterie, TČ, okna, montáž JOM, hlavní jistič | 1,12 | PRAVIDLO | | `DPH_SNIZENA` |
| 54 | Rozpětí | Základ ±10 %, neznámé vstupy se přičítají v kvadratuře (spotřeba 15 %, orientace 10 %, distributor 10 %, jistič 8 %) | 10 % + | PRAVIDLO | | `KALK.NEJISTOTA`, `KALK.rozpeti()` |
| 55 | Rozpětí při neznámých údajích | Použije se při dvou a více neznámých vstupech | 25 % | PRAVIDLO | | `ROZPETI_NEVIM` |
| 56 | Počet bytů | Povolený rozsah ve všech nástrojích (mini kalkulačka nejvýše 120) | 4 až 300 | PRAVIDLO | | `BYTY_MIN`, `BYTY_MAX` |

### A8. Dotazník JOM (od 26. 11. 2026, sekce `#dotaznik`)

Ceny jističů a stálé platby jsou bez DPH, DPH přičítá výpočet ([52]). Řádky označené **NEOVĚŘENO** pocházejí z textů bez primárního zdroje.

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 57 | Stálá platba dodavateli | Měsíčně za odběrné místo (dnes platí každý byt i společný elektroměr, po JOM jedna), bez DPH | 120 Kč/měs. | ODHAD (majitel, 27. 11. 2026; nejlevnější tarify 100 Kč, běžně 120 až 145 Kč; Enerooo 115 Kč) | | `dodavatel_stala_platba` |
| 58 | Rozúčtování podružných měřidel | Po JOM měsíčně, bez DPH: pevná část za dům + část za byt (u 12 bytů vychází 70 Kč na byt, u 36 bytů asi 53 Kč; Helioware asi 20 Kč, Enerooo 89 Kč včetně vlastní služby) | 300 Kč/dům + 45 Kč/byt | ODHAD (majitel, 27. 11. 2026) | | `rozuctovani_dum`, `rozuctovani_na_byt` |
| 58a | Společné odběrné místo domu | Dnes platí každý dům jeden společný elektroměr, po zavedení JOM zaniká. Počítá se jen v „Dnes“: jistič 3×16 A (D02d zvoleného distributora: ČEZ 164, EG.D 160, PRE 139 Kč bez DPH, tabulka A6) + provoz nesíťové infrastruktury + stálá platba dodavateli [57]. Konzervativní minimum, větší domy s výtahem mívají 3×20 až 3×25 A | 3×16 A | ODHAD (majitel, 27. 11. 2026), ceny jističe z tabulky A6 | | `spolecne_om_jistic` |
| 59 | ČEZ, jistič 3×40 A | Měsíční plat za jistič (D02d) | 409 Kč/měs. | PŘEVZATO, NEOVĚŘENO | | `distribuce.cez.D02d.jistic['3x40']` |
| 60 | EG.D, jistič 3×40 A | totéž | 400 Kč/měs. | PŘEVZATO, NEOVĚŘENO | | totéž |
| 61 | PRE, jistič 3×40 A | totéž | 347 Kč/měs. | PŘEVZATO, NEOVĚŘENO | | totéž |
| 62 | ČEZ, hlavní jistič 3×63 A | Měsíční plat (D02d) | 644 Kč/měs. | PŘEVZATO (souhlasí s výstupy Enerooo 644 Kč a Helioware 780 Kč s DPH), NEOVĚŘENO | | `distribuce.cez.D02d.hlavni.a63` |
| 63 | EG.D, hlavní jistič 3×63 A | totéž | 629 Kč/měs. | PŘEVZATO, NEOVĚŘENO | | totéž |
| 64 | PRE, hlavní jistič 3×63 A | totéž | 551 Kč/měs. | PŘEVZATO, NEOVĚŘENO | | totéž |
| 65 | Hlavní jistič nad 63 A | Platba za 1 A nad 63 A (ČEZ / EG.D / PRE); hodnoty nad 63 A jsou dopočítané (ampéry × sazba), ne z rozhodnutí ERÚ | 10,23 / 9,99 / 8,74 Kč/A/měs. | PŘEVZATO, NEOVĚŘENO | | `distribuce.*.D02d.hlavni.kc_na_a` |
| 66 | Velikost hlavního jističe | Podle počtu bytů a způsobu vaření (byty 1×25 A na plyn / 3×20 A až 3×25 A elektřina): do 15 bytů 3×40 A / 63 A, 16 až 30 bytů 63 A / 100 A, 31 až 50 bytů 80 A / 125 A, nad 50 bytů 125 A / 160 A (z „100 až 125 A“ a „160 A a více“ vzat horní konec) | tabulka | ODHAD (majitel) | | `hlavniJisticB` v `js/kalk-engine.js` |
| 67 | Vlastní spotřeba bez JOM (dotazník) | Stejná hodnota jako řádek 4 | 25 % | ODHAD (majitel) | | `JOM_B.vlastni_bez_jom` = `FVE_VLASTNI_BEZ_JOM` |
| 68 | Vlastní spotřeba s JOM (dotazník) | Stejná hodnota jako řádek 3 | 60 % | ODHAD (majitel) | | `JOM_B.vlastni_s_jom` = `FVE_VLASTNI_PODIL` |
| 69 | Ocenění ušetřené kWh (dotazník) | Stejná hodnota jako řádek 1a | 4,80 Kč/kWh | ODHAD (majitel) | | `JOM_B.kc_kwh` = `FVE_OCENENI_KWH` |
| 70 | Výkon FVE bez zadání (B) | Odhad, když uživatel kWp nezná (strop dán střechou) | 1 kWp/byt | ODHAD (majitel) | | `JOM_B.kwp_na_byt` |
| 71 | Hranice verdiktu | Čistá roční úspora: nad 50 000 Kč „velmi zajímavá“, pod 25 000 Kč „sporné“, bez úspory „ne“ | 50 000 / 25 000 Kč | PRAVIDLO | | `js/jom-quiz.js` |

---

## B. Výpočty

Čísla v hranatých závorkách odkazují na řádky tabulky parametrů.

### B1. Společná pravidla
- **Spotřeba domu** = zadaná, jinak počet bytů × [8].
- **Rozpětí:** výsledek = střed × (1 − r) až střed × (1 + r), kde r = [54], při dvou a více neznámých vstupech r = [55]. Neznámé vstupy: nevyplněná spotřeba, nezměněná orientace střechy. V dotazníku JOM navíc nevybraný distributor a jistič.
- **Návratnost:** od = nejnižší investice ÷ nejvyšší úspora, do = nejvyšší investice ÷ nejnižší úspora.
- **DPH:** ceny investic (bez DPH) × [53]; gateway, projekt a elektroměry × [52].

### B2. JOM
- **Úspora za rok** = čistá roční bilance JOM z B9 (distribuční území a připojení bytů z „Upřesnit výpočet“, když je uživatel nezná, průměr přes všechna území a oba způsoby vaření); bez ověřených cen záložně počet bytů × [13]. Rozpětí úspory JOM: ±15 %, když jsou známy distributor i připojení, jinak ±25 %.
- **Investice od** = ([14] + [15]) × [52] + [16 dolní] × [53] + byty × ([17 dolní] × [53] + [18] × [52])
- **Investice do** = ([14] + [15]) × [52] + [16 horní] × [53] + byty × ([17 horní] × [53] + [19] × [52])
- **Návratnost** = investice ÷ úspora

### B3. FVE
1. **Podíl s JOM** = [3] (s baterií + [5]); **podíl bez JOM** = [4] (s baterií + [5])
2. **Ideální výkon** = spotřeba × podíl s JOM ÷ ([2] × koeficient orientace [9–12])
3. **Výkon** = ideální výkon omezený na rozmezí [35] až [34] × počet bytů, zaokrouhlený na celé kWp. Zadaný výkon existující FVE (dotazník JOM) výpočet přebíjí.
4. **Výroba** = výkon × [2] × koeficient orientace
5. **Využitá výroba** = menší z hodnot: výroba, spotřeba × podíl s JOM
6. **Úspora FVE** = využitá výroba × [1]
7. **Úspora kroku FVE** = úspora FVE + úspora JOM (JOM se do FVE počítá, pokud není vybrán zvlášť)
8. **Investice FVE samotná** = výkon × [6] × [53] (s baterií + počet bytů × [7] × [53])
9. **Investice kroku FVE** = investice FVE samotná v rozpětí ±r + investice JOM (od–do), pokud JOM není vybrán zvlášť
10. **Úvěr NZÚ** = větší z hodnot: [36], menší z hodnot: (investice FVE samotná; [32] + [33] × (výkon − 5)). Splatnost 10 let, pokud úvěr ≤ [37], jinak 15 let. Splátka za měsíc = úvěr ÷ (splatnost × 12). Úvěr se počítá z ceny FVE bez JOM.

### B4. Tepelné čerpadlo
1. **Teplo** = počet bytů × [20] (zateplený) nebo [21] (nezateplený)
2. **Elektřina pro čerpadlo** = teplo ÷ [22]
3. **Provoz čerpadla** = elektřina pro čerpadlo × [1]
4. **Úspora** = dnešní roční náklady na teplo (zadá uživatel) − provoz čerpadla, rozpětí ±r. Bez zadaných nákladů se úspora ani návratnost celého plánu nezobrazí.
5. **Investice** = počet bytů × cena na byt z [23–26] × [53]. Mezi 10 a 80 byty lineární interpolace, pod 10 a nad 80 bytů se drží krajní hodnota.
6. **Úvěr NZÚ** = větší z hodnot: [36], menší z hodnot: (investice (střed); [38] × počet bytů). Splatnost jako u FVE.

### B5. Okna a dveře
1. **Základ** = dnešní náklady na teplo zadané uživatelem. Při vybraném tepelném čerpadle náklady po čerpadle (= provoz čerpadla).
2. **Úspora** = základ × podíl podle stavu oken [27–29] (od–do, bez ±r)
3. **Investice** = počet bytů × plocha na byt ([30] nebo zadaná) × [31] × [53]
4. **Úvěr NZÚ** = větší z hodnot: [36], menší z hodnot: (investice (střed); [39] × plocha na byt × byty; [40] × byty). Splatnost jako u FVE.

### B6. Souhrn plánu (hlavní kalkulačka)
- **Investice a úspora celkem** = součet vybraných kroků (dolní s dolními, horní s horními)
- **Návratnost celkem** = celková investice ÷ celková úspora, jen když je úspora známa u všech kroků (u tepla a oken jen při zadaných nákladech na teplo)
- **Úspora na byt a měsíc** = celková úspora ÷ počet bytů ÷ 12
- **Úvěr NZÚ celkem** = součet úvěrů na FVE, TČ a okna, nejvýše [40] × počet bytů. JOM se z úvěru neplatí.
- **Graf ročních nákladů „dnes“** = spotřeba × [1] + počet bytů × ([41] + [48]) × 12 × [52] + zadané náklady na teplo. Vždy ČEZ, sazba D02d, jistič 1×25 A.

### B7. Mini kalkulačka (úvodní stránka)
JOM + FVE, spotřeba = počet bytů × [8], orientace jih, rozpětí vždy [55]. Postup jako B2 a B3.

### B8. FVE průvodce
Stejný postup jako B3 s přepínači baterie a JOM. Investice = FVE v rozpětí ±r + investice JOM (od–do), pokud je JOM zapnuté.

### B9. JOM dotazník (`js/jom-quiz.js`, `KALK_ENGINE.jomBilance`)

**Vstupy:** počet bytů (4 až 300), distribuční území (ČEZ / EG.D / PRE), typický jistič v bytech (1×25 A plyn / 3×20 A až 3×25 A elektřina), FVE (nemáme / plánujeme / již máme, nepovinné), stav smluv (nepovinné, do výpočtu nevstupuje). Nic se nepředvyplňuje a není volba „Nevím“.

**Roční bilance (s DPH):**
- Jističe bytů dnes = byty × (plat za jistič [41–47: 1×25 A nebo 3×20 A zvolené oblasti] + [48]) × 12 × [52]
- Stálé platby dodavatelům dnes = byty × [57] × 12 × [52]
- Společný elektroměr domu dnes = (plat za jistič 3×16 A zvolené oblasti + [48] + [57]) × 12 × [52]
- Hlavní jistič po JOM: velikost podle [66]; cena = 3×40 A [59–61], 3×63 A [62–64], nad 63 A ampéry × [65]; (cena + [48]) × 12 × [52]
- Jedna stálá platba dodavateli po JOM = [57] × 12 × [52]
- Rozúčtování = (300 + byty × 45) × 12 × [52]  ([58])
- **Čistá úspora** = (jističe dnes + dodavatelé dnes + společný elektroměr) − (hlavní jistič po JOM + dodavatel po JOM + rozúčtování)
- **Přínos FVE** (jen „již máme“) = byty × [70] × [2] × ([68] − [67]) × [69]; celkem = čistá úspora + přínos FVE
- **Rozpětí:** [54]; neznámé vstupy je jen „FVE již máme“ (výkon se odhaduje), takže při jednom neznámém je rozpětí vždy ±15 % ([55] by nastalo až při dvou).
- Na byt měsíčně = čistá úspora (bez FVE) ÷ byty ÷ 12 ± rozpětí.
- **Verdikt** podle celku: [71].

**Ukládání:** tabulka `poptavky_jom` (struktura v Supabase), čitelné sloupce místo JSON `vstupy`; `vysledek` obsahuje jen rozpis bilance a použité předpoklady (schema v3).

---

## C. Kontrolní příklad: 24 bytů, 80 MWh, jih, JOM + FVE

| Krok | Výpočet | Výsledek |
|---|---|---|
| Úspora JOM | bilance z B9 pro ČEZ a 3×20 A (viz C2) | 85 231 Kč/rok |
| Ideální výkon FVE | 80 000 × 0,60 ÷ (1 000 × 1,00) | 48 kWp (povolený rozsah 5 až 72) |
| Využitá výroba | menší z 48 000 a 80 000 × 0,60 | 48 000 kWh |
| Úspora FVE | 48 000 × 4,80 | 230 400 Kč/rok |
| Úspora celkem | 85 231 + 230 400 = 315 631, ±15 % | **268 až 363 tis. Kč/rok** |
| Investice FVE samotná | 48 × 25 500 × 1,12 | 1 370 880 Kč |
| Investice JOM | podle B2 | 178 768 až 310 812 Kč |
| Investice celkem | FVE ±15 % + JOM | **1,3 až 1,9 mil. Kč** |
| Návratnost | | **3,7 až 7,0 let** |
| Úvěr NZÚ | menší z 1 370 880 a 350 000 + 40 000 × 43 | 1 370 880 Kč na 10 let, splátka **11 424 Kč/měs.** |

(Příklad předpokládá zadané distribuční území ČEZ a připojení bytů 3×20 A, jinak se JOM počítá průměrem a s rozpětím ±25 %.)

### C2. Kontrolní příklad dotazníku JOM: 24 bytů, ČEZ, 3×20 A (elektřina), bez FVE

| Krok | Výpočet | Výsledek |
|---|---|---|
| Jističe bytů dnes | 24 × (205 + 12,87) × 12 × 1,21 | 75 923 Kč |
| Stálé platby dodavatelům dnes | 24 × 120 × 12 × 1,21 | 41 818 Kč |
| Společný elektroměr domu dnes | (164 + 12,87 + 120) × 12 × 1,21 | 4 311 Kč |
| Celkem dnes | | 122 051 Kč |
| Hlavní jistič po JOM | 24 bytů, elektřina → 3×100 A; (100 × 10,23 + 12,87) × 12 × 1,21 | 15 041 Kč |
| Stálá platba dodavateli (jedna) | 120 × 12 × 1,21 | 1 742 Kč |
| Rozúčtování | (300 + 24 × 45) × 12 × 1,21 | 20 038 Kč |
| Celkem po JOM | | 36 821 Kč |
| **Čistá úspora** | 122 051 − 36 821 | **85 231 Kč/rok**, ±15 % = **72 až 98 tis. Kč** (6 000 až 8 200 Kč měsíčně, 250 až 340 Kč na byt) |

Stejný dům s jističi 1×25 A (plyn): hlavní jistič 3×63 A, čistá úspora 54 840 Kč, rozpětí 47 až 63 tis. Kč. S FVE „již máme“ (elektřina): přínos FVE 24 × 1 000 × (0,60 − 0,25) × 4,80 = 40 320 Kč.

---

## D. Na co si dát při ověření pozor
1. **Cena oken [31]** je 8 000 až 12 000 Kč/m², jediná dohledaná zakázka SVJ vycházela na asi 3 600 Kč/m². Rozpor je velký.
2. **Úspora JOM** se od 27. 11. 2026 počítá v hlavní kalkulačce, mini kalkulačce i dotazníku stejně z bilance poplatků (B9); plošná [13] zůstává jen jako záložní hodnota.
3. **Hlavní kalkulačka počítá vždy s ČEZ, D02d a jističem 1×25 A** (jen graf nákladů), i pro uživatele jiného distributora.
4. **Rozpětí v dotazníku JOM** se zvětší na ±25 % i kvůli nevybranému distributorovi a jističi, které odhad vůbec neovlivňují.
5. **Pevné platby uložené z dotazníku jsou bez DPH**, zbytek výpočtů je s DPH.
6. **Při každé změně cen nebo vzorců zvýšit `KALK.VERZE`** v `js/kalk-constants.js`, aby šlo u uložené poptávky poznat, z čeho byla spočítaná.
7. **POZE [49, 50] jsou hodnoty z roku 2025.** Tisková zpráva ERÚ z 29. 12. 2025 (https://eru.gov.cz/sites/default/files/obsah/prilohy/20251229tzzmenovycenovyvymer.docx) uvádí, že od 1. 1. 2026 neplatí odběratelé žádné příspěvky na POZE (financuje je stát; u domácností šlo o 495 Kč/MWh bez DPH). Zbývá ověřit v cenovém výměru č. 15/2025 (věstník 19/2025), že zaniká i platba podle jističe [49], a zkontrolovat pozdější změnu, cenový výměr č. 1/2026 z 30. 4. 2026 (věstník 2/2026). Dopad v kódu: jen údaj „náklady domu bez JOM“ v `regulovane()`, úspora JOM ani investice se nemění. Při ověření nastavit obě hodnoty na 0 a zvýšit `KALK.VERZE`.
8. **Srovnání úspory JOM na byt a rok [13]** (jen k ověření, nic z toho není převzaté do kódu):

   | Zdroj | Úspora na byt a rok | Poznámka |
   |---|---|---|
   | Náš kód (údaj majitele) | 2 000 Kč | plošná hodnota |
   | Helioware, vzorové domy z jejich článku | asi 2 600 Kč (32 bytů, 1fázové), asi 4 800 Kč (20 bytů, 3fázové) | údaje dodavatele, neověřeno |
   | TZB-info / estav.cz, dům s 21 byty | asi 3 000 Kč včetně DPH | skutečný případ, zahrnuje i zrušení stálých plateb dodavatele |
   | Vložený text od majitele | 3 500 Kč (1fázové), 7 000 Kč (3fázové) | původ neznámý; horní hodnota je nad vlastním výpočtem níže |
   | Výpočet z ověřených cen distribuce 2026 (jistič a provoz, včetně DPH) | 1fázové 1×25 A asi 1 450 až 1 670 Kč, 3fázové 3×20 A asi 2 700 až 3 160 Kč | bez stálého platu dodavatele a bez nákladů nového odběrného místa; ceny jističů ještě ověřit |

   Rozdíl mezi 1fázovým a 3fázovým připojením je skutečný (zhruba dvojnásobný). Návrh na později: počítat úsporu JOM z pevných plateb podle distribučního území a připojení, až budou ověřené ceny jističů a stálý plat dodavatele.
9. **Hlavní kalkulačka má v kroku JOM pole „Distribuční území“ a „Připojení bytů“** (Upřesnit výpočet). Zatím se jen ukládají k poptávce a do výpočtu nevstupují.

10. **K ověření u dotazníku JOM (A8):** hlavní jistič 3×63 A a nad 63 A včetně toho, zda se v JOM platí v sazbě D02d (u C02d by byly platby vyšší; konstanta `hlavni_jistic_sazba_c02d` 1 800 až 2 400 Kč zůstává v kódu nepoužitá), cena 3×40 A, velikost hlavního jističe podle počtu bytů a vaření [66], stálá platba dodavateli [57], rozúčtování [58] a model FVE [67 až 70].
11. **Rozpětí v dotazníku JOM** je vždy ±15 %, protože jediný možný neznámý vstup je výkon FVE u odpovědi „již máme“. Hodnota 25 % z tabulky v databázi je povolená, ale v dotazníku nenastane.
12. **Model FVE je od 27. 11. 2026 v hlavní kalkulačce, kalkulačce FVE i dotazníku JOM stejný** (vlastní spotřeba 60 % s JOM a 25 % bez JOM, ocenění kWh 4,80 Kč). Výkon FVE se liší záměrně: hlavní kalkulačka ho dopočítává, dotazník u existující FVE odhaduje 1 kWp na byt.
