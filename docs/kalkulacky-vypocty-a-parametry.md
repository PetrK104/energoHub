# Kalkulačky: parametry a výpočty k ověření

Interní dokument (složka `docs/` se na web nenasazuje). Účel: ověřit všechny hodnoty a vzorce, podle kterých počítají kalkulačky a dotazník, a nastavit je správně.
Stav k verzi výpočtu `2026-11-12`. Všechny částky ve výsledcích jsou **s DPH**, ceny investic jsou níže uvedené **bez DPH** (DPH přičítá výpočet).

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
| 1 | Cena elektřiny | Proměnná část s DPH, kterou FVE nahradí, a za kterou se počítá provoz tepelného čerpadla | 6,0 Kč/kWh | PŘEVZATO (srovnávače, rozsah 5,6–6,6) | | `FVE_CENA_EL` |
| 2 | Výroba FVE | Roční výroba z 1 kWp při orientaci na jih | 1 000 kWh/kWp | ODHAD | | `FVE_VYROBA_NA_KWP` |
| 3 | Vlastní spotřeba s JOM | Podíl výroby, který spotřebuje dům, když je zavedeno JOM (bez baterie) | 65 % | ODHAD | | `FVE_VLASTNI_PODIL` |
| 4 | Vlastní spotřeba bez JOM | Podíl výroby spotřebovaný jen ve společných prostorách (bez baterie) | 20 % | ODHAD | | `FVE_VLASTNI_BEZ_JOM` |
| 5 | Přírůstek s baterií | O kolik procentních bodů baterie zvýší podíl vlastní spotřeby | +15 p. b. | ODHAD | | `BATERIE_PODIL` |
| 6 | Cena FVE | Cena instalace za 1 kWp, bez baterie, bez DPH | 25 500 Kč/kWp | ODHAD | | `FVE_CENA_KWP` |
| 7 | Cena baterie | Cena na jeden byt (0,5 kWh × 20 000 Kč/kWh), bez DPH | 10 000 Kč/byt | PŘEVZATO | | `BATERIE_NA_BYT` |
| 8 | Spotřeba na byt | Roční spotřeba elektřiny na byt, když uživatel nezadá spotřebu domu | 2 200 kWh/byt | ODHAD | | `SPOTREBA_NA_BYT` |
| 9 | Orientace: jih | Koeficient výroby podle orientace střechy | 1,00 | ODHAD | | `ORIENT.J` |
| 10 | Orientace: jihovýchod, jihozápad | totéž | 0,93 | ODHAD | | `ORIENT.JV`, `JZ` |
| 11 | Orientace: východ, západ | totéž | 0,77 | ODHAD | | `ORIENT.V`, `Z` |
| 12 | Orientace: sever | totéž | 0,58 | ODHAD | | `ORIENT.S` |

### A2. Jednotné odběrné místo (JOM)

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 13 | Úspora JOM | Roční úspora na jeden byt (plošná, nepočítá se z poplatků) | 2 000 Kč/byt/rok | ODHAD | | `JOM_NA_BYT` |
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

Zdroj: cenové výměry ERÚ č. 13/2025 a 14/2025, **převzato z ceníku dodavatele** (Yello Watt). Ovlivňují jen graf ročních nákladů v hlavní kalkulačce a pevné platby uložené z dotazníku JOM, ne hlavní výsledek úspory.

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
| 49 | POZE podle jističe | Platba za ampér a fázi (platí se nižší z #49 a #50) | 8,32 Kč/A/fáze/měs. | PŘEVZATO | | `poze_jistic` |
| 50 | POZE podle spotřeby | Platba za spotřebu | 495 Kč/MWh | PŘEVZATO | | `poze_spotreba` |
| 51 | Systémové služby | Platba za spotřebu | 164,24 Kč/MWh | PŘEVZATO | | `systemove_sluzby` |

### A7. Pravidla modelu

| # | Parametr | Co to je | Aktuální hodnota | Stav | Nová hodnota | Klíč v kódu |
|---|---|---|---|---|---|---|
| 52 | DPH 21 % | Elektřina, regulované platby, gateway, projekt, elektroměry | 1,21 | PRAVIDLO | | `DPH` |
| 53 | DPH 12 % | Stavebně-montážní práce: FVE, baterie, TČ, okna, montáž JOM, hlavní jistič | 1,12 | PRAVIDLO | | `DPH_SNIZENA` |
| 54 | Rozpětí | Výsledky jsou střed ±15 % | 15 % | PRAVIDLO | | `ROZPETI` |
| 55 | Rozpětí při neznámých údajích | Použije se při dvou a více neznámých vstupech | 25 % | PRAVIDLO | | `ROZPETI_NEVIM` |
| 56 | Počet bytů | Povolený rozsah ve všech nástrojích (mini kalkulačka nejvýše 120) | 4 až 300 | PRAVIDLO | | `BYTY_MIN`, `BYTY_MAX` |

---

## B. Výpočty

Čísla v hranatých závorkách odkazují na řádky tabulky parametrů.

### B1. Společná pravidla
- **Spotřeba domu** = zadaná, jinak počet bytů × [8].
- **Rozpětí:** výsledek = střed × (1 − r) až střed × (1 + r), kde r = [54], při dvou a více neznámých vstupech r = [55]. Neznámé vstupy: nevyplněná spotřeba, nezměněná orientace střechy. V dotazníku JOM navíc nevybraný distributor a jistič.
- **Návratnost:** od = nejnižší investice ÷ nejvyšší úspora, do = nejvyšší investice ÷ nejnižší úspora.
- **DPH:** ceny investic (bez DPH) × [53]; gateway, projekt a elektroměry × [52].

### B2. JOM
- **Úspora za rok** = počet bytů × [13]
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

### B9. JOM dotazník

**Odhad úspory:** střed = počet bytů × [13] + (jen když už mají FVE) (využitá výroba s JOM − využitá výroba bez JOM) × [1]. Rozpětí podle B1.

**Skóre vhodnosti JOM (0 až 11), pravidlo modelu:**

| Odpověď | Body |
|---|---|
| Počet bytů: 15 až 30 / 31 až 49 / 50 a více | 1 / 2 / 3 |
| FVE: plánují / už mají | 2 / 3 |
| Smlouvy: každý byt má vlastní | 2 |
| Měsíční spotřeba domu: 1 000 až 3 000 kWh / nad 3 000 kWh | 1 / 2 |
| Baterie: plánují nebo mají | 1 |

Vyhodnocení: **7 a více** = vysoká vhodnost, **4 až 6** = střední, **0 až 3** = nízká.

**Ukládané pevné platby** (neukazují se uživateli) = ([plat za jistič 1×25 A nebo 3×20 A zvolené oblasti] + [48]) × 12 × počet bytů, **bez DPH**.

---

## C. Kontrolní příklad: 24 bytů, 80 MWh, jih, JOM + FVE

| Krok | Výpočet | Výsledek |
|---|---|---|
| Úspora JOM | 24 × 2 000 | 48 000 Kč/rok |
| Ideální výkon FVE | 80 000 × 0,65 ÷ (1 000 × 1,00) | 52 kWp (povolený rozsah 5 až 72) |
| Využitá výroba | menší z 52 000 a 80 000 × 0,65 | 52 000 kWh |
| Úspora FVE | 52 000 × 6,0 | 312 000 Kč/rok |
| Úspora celkem | 48 000 + 312 000 = 360 000, ±15 % | **306 až 414 tis. Kč/rok** |
| Investice FVE samotná | 52 × 25 500 × 1,12 | 1 485 120 Kč |
| Investice JOM | podle B2 | 178 768 až 310 812 Kč |
| Investice celkem | FVE ±15 % + JOM | **1,4 až 2,0 mil. Kč** |
| Návratnost | | **3,5 až 6,6 let** |
| Úvěr NZÚ | menší z 1 485 120 a 350 000 + 40 000 × 47 | 1 485 120 Kč na 10 let, splátka **12 376 Kč/měs.** |

---

## D. Na co si dát při ověření pozor
1. **Cena oken [31]** je 8 000 až 12 000 Kč/m², jediná dohledaná zakázka SVJ vycházela na asi 3 600 Kč/m². Rozpor je velký.
2. **Úspora JOM [13]** je plošná, ne vypočtená z poplatků, a určuje celý krok JOM i odhad v dotazníku.
3. **Hlavní kalkulačka počítá vždy s ČEZ, D02d a jističem 1×25 A** (jen graf nákladů), i pro uživatele jiného distributora.
4. **Rozpětí v dotazníku JOM** se zvětší na ±25 % i kvůli nevybranému distributorovi a jističi, které odhad vůbec neovlivňují.
5. **Pevné platby uložené z dotazníku jsou bez DPH**, zbytek výpočtů je s DPH.
6. **Při každé změně cen nebo vzorců zvýšit `KALK.VERZE`** v `js/kalk-constants.js`, aby šlo u uložené poptávky poznat, z čeho byla spočítaná.
