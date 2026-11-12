# Zdroj pravdy: ekonomika FVE a JOM

Interní dokumentace. Čísla na webu se musí shodovat s touto tabulkou. Při změně se upraví nejdřív tento soubor, pak stránky a kalkulačky. Stav: říjen 2026. Cena elektřiny je ověřena orientačně podle srovnávačů (viz níže), ne podle oficiální statistiky ERÚ.

## Společné předpoklady
| Předpoklad | Hodnota | Kde se používá |
|---|---|---|
| Cena nahrazované elektřiny | **6,0 Kč/kWh** (ověřený rozsah 5,6–6,6) | **jediné místo: `js/kalk-constants.js` → `FVE_CENA_EL`**. Čerpají z něj kalkulačky (`fve-calc.js`, `kalkulacka.js`, `mini-kalk.js`) i texty s `data-kalk-cena` |
| Výnos FVE | **1 000 kWh/kWp/rok** | `kalk-constants.js`, `fve-calc.js`, `fve-naklady.html`, `pruvodce-fve.html` |
| Cena instalace bez baterie | **~25 000 Kč/kWp** (23–28 tis. podle velikosti) | `fve-calc.js`, rozpis v `fve-costs.js` |
| Vlastní spotřeba s JOM | **65–75 %** bez baterie, **80–90 %** s baterií (kalkulačka: 65 % a +15 p. b.; `KALK.FVE_VLASTNI_PODIL`) | `jom-kdy-ma-smysl.html`, `pruvodce-jom.html`, `fve-calc.js` |
| Vlastní spotřeba bez JOM (jen společné prostory) | **20 %** (rozsah 15–25 %) | `js/kalk-constants.js` (`FVE_VLASTNI_BEZ_JOM`); čerpá z něj `fve-calc.js` i `kalkulacka.js`; text v `kalkulacka.html`, `jom-kdy-ma-smysl.html`, `pruvodce-jom.html` |
| Náklad JOM v kalkulačce FVE | podle počtu bytů, viz „Investice do JOM“ níže, jen u varianty S JOM | `fve-calc.js`, `KALK.jomInvestice()` |
| Interní cena sdílení v JOM | 3,50 Kč/kWh | `jom-sdileni-a-uspory.html`, `pruvodce-jom.html` |

## Ověření ceny elektřiny (říjen 2026)
FVE ušetří jen **proměnnou** část faktury (silová elektřina + distribuce za kWh + regulované platby + DPH). Stálé měsíční platby (jistič, stálý plat, OTE) neušetří.

- TZB-info (ceníky platné od 1. 1. 2026, sazba D02d, vč. DPH, proměnná část): E.ON 6,55, PRE 5,57, ČEZ 6,61 Kč/kWh. Systémové služby 0,20 Kč/kWh, daň z elektřiny 0,03 Kč/kWh, poplatek na OZE od 2026 nulový. Zdroj: https://www.tzb-info.cz/ceny-paliv-a-energii/14-ceny-elektriny
- kalkulator.cz: průměrná domácnost (D02d, 3,5 MWh/rok, 3×25 A) vychází na ~8,3–8,4 Kč/kWh. Jde o průměr **včetně stálých plateb**, proto se liší od 5,6–6,6. Silová složka sama 3,66 Kč/kWh vč. DPH. Zdroj: https://www.kalkulator.cz/aktualni-cena-elektriny-u-cez-za-1-kwh
- Odtud pravděpodobně pochází dřívějších 8 Kč. Pro úsporu z FVE je správná hodnota 5,6–6,6 Kč, ne 8 Kč.
- Pro společné prostory SVJ lze sazbu D použít (příloha 4a vyhl. 541/2005 Sb., viz portalsvj.cz), cena je tedy podobná jako u domácností. Skutečná cena závisí na smlouvě SVJ.
- Zdroje jsou komerční srovnávače, ne ERÚ. Data na stránkách se místy rozcházejí.

**Závěr:** zvoleno 6,0 Kč/kWh, střed ověřeného rozsahu 5,6–6,6. Při změně ceny je potřeba přepočítat odvozené rozsahy níže (návratnost).

## Odvozené hodnoty (musí odpovídat modelu)
- **Návratnost JOM + FVE: 5–7 let.** Vzorec: cena instalace / (výroba × vlastní spotřeba × cena). Pro 40 kWp, 1 mil. Kč, 6,0 Kč: 65 % → 6,4 let, 85 % → 4,9 let. Při 5,6–6,6 Kč vychází 4,5–6,9 let.
- **Úspora na byt: 9–13 tis. Kč/rok** (JOM + FVE). 12 bytů → 108–156 tis. Kč. Případovka: 825 Kč/měs × 12 = 9,9 tis. Kč/byt.
- **Úspora celého domu JOM + FVE: 150–250 tis. Kč** platí pro dům s 15–25 byty (9–13 tis. Kč/byt).
- **Případovka Korunní 47:** 237,6 tis. Kč/rok ÷ 43 000 kWh = 5,5 Kč/kWh, návratnost 6,1 roku (1,45 mil. Kč). Je to skutečný příklad, nepřepočítává se.
- Orientační výroba FVE 40 kWp: ~40 000 kWh/rok.

## Otevřené body
- Obrázek `assets/images/vizualizace_sdileni_1.webp` může stále ukazovat 8 Kč. Je třeba překreslit na 6,00 Kč.
- Ověřit cenu elektřiny pro SVJ u skutečného vyúčtování nebo dodavatele.

## Jak změnit cenu
Stačí upravit `FVE_CENA_EL` v `js/kalk-constants.js`. Kalkulačky a texty s `data-kalk-cena` se přepočítají samy (index, JOM stránky). Ručně pak zbývá přepsat odvozené rozsahy (návratnost „5–7 let" ve `fve-naklady.html`, `pruvodce-fve.html`, `jom-kdy-ma-smysl.html`, `pruvodce-jom.html`) a obrázek sdílení.

## Vlastní spotřeba: podklady a podmínky
Podklady dodal majitel webu (odpověď z externí konzultace; konkrétní studie a realizace v ní citované nejsou ověřené, proto se na webu necitují).
- Jen společné prostory: 15–25 %. Základní spotřeba je 5–10 % spotřeby domu (2–6 MWh/rok) proti výrobě 10–20 MWh, přetoky 70–85 %.
- JOM bez baterie 65–75 %, sdílení přes EDC 50–65 % (15minutové intervaly a alokační klíče).
- Baterie přidává 15–25 p. b. (v kalkulačce konzervativních 15).
- Závisí na poměru výkonu FVE a spotřeby (optimum 0,5–1 kWp na byt), počtu bytů (u 30+ bytů je podíl o 10–15 p. b. vyšší než u malých domů), centrální přípravě TUV (až +20–30 p. b.) a způsobu vytápění.

## Ceny pro dotazník JOM (js/kalk-ceny.js)

- Všechny ceny jsou v jednom souboru `js/kalk-ceny.js` (Kč bez DPH). Změna ceny = přepsání hodnoty v tomto souboru, kód se nemění.
- **DPH v kalkulačkách:** ceny investic (JOM, FVE 25 500 Kč/kWp, baterie, TČ, okna) jsou uložené bez DPH a výpočet přičítá: **12 %** (`KALK.DPH_SNIZENA`) na stavebně-montážní práce na bytovém domě (FVE, baterie, TČ, výměna oken, montáž a hlavní jistič JOM), **21 %** (`KALK.DPH`) na zboží a služby (gateway, projekt, elektroměry) a na elektřinu a regulované platby. Částky NZÚ se nepřepočítávají. Že jsou FVE, baterie, TČ a okna uloženy bez DPH, potvrdil majitel webu (listopad 2026).
- **Ověřeno** (ceník Yello Watt 2026, regulované platby dle cenových výměrů ERÚ č. 13/2025 a 14/2025): měsíční plat za jistič D02d a D25d pro ČEZ, EG.D a PRE, cena distribuce VT/NT, POZE, systémové služby, provoz nesíťové infrastruktury, daň z elektřiny. Platí od 1. 1. 2026, od ledna 2027 je potřeba je aktualizovat.
- **Neověřeno (`null`)**: gateway, montáž, projekt, hlavní jistič JOM. Dokud je `null`, dotazník neukazuje investici ani návratnost. Maloobchodní ceny elektroměrů M-Bus (1 450 Kč / 4 300 Kč) jsou jen orientační z e-shopu.
- Rozpětí odhadu úspory: `KALK.ROZPETI` = 0,15 (±15 %), `KALK.ROZPETI_NEVIM` = 0,25, použije se při 2 a více chybějících upřesňujících údajích (distribuční území, jistič, spotřeba). Střed odhadu = počet bytů × `KALK.JOM_NA_BYT`.
- Dotazník JOM: při volbě FVE (máme / plánujeme) se zobrazí tři nepovinná pole: roční spotřeba domu (kWh), výkon FVE (kWp), orientace střechy. Ovlivňují jen větu o FVE. Bez nich se použije odhad (spotřeba `SPOTREBA_NA_BYT` × počet bytů, výkon z velikosti domu, orientace 0,90) a v poznámce pod výsledkem je uvedeno, co bylo odhadnuto.
- Dotazník JOM, výsledek: velká čísla jsou vždy roční a měsíční úspora z JOM. Když dům FVE už má, přičte se k nim lepší využití vlastní výroby (z ~20 % na ~65 %) a řádek pod nimi ukazuje, kolik z celku to je. Když FVE plánuje, ukáže se jen věta „S fotovoltaikou se úspora ještě zvýší.“ bez čísla (investice zatím není ověřená).
- Výchozí roční spotřeba domu, když ji uživatel nezadá, je všude `KALK.SPOTREBA_NA_BYT` (2 200 kWh na byt (údaj majitele, listopad 2026)): dotazník JOM, hlavní kalkulačka na hlavní stránce i kalkulačka FVE v průvodci. Mění se v `js/kalk-constants.js`.

## Hlavní kalkulačka (kalkulacka.html) – jádro výpočtu `js/kalk-engine.js`
- Výpočet je v `KALK_ENGINE.compute()`, konstanty v `js/kalk-constants.js`, ceny v `js/kalk-ceny.js`. Částky jsou včetně DPH 21 % (`KALK.DPH`).
- **Výkon FVE** se dopočítá: spotřeba × 0,65 ÷ (1 000 × orientace), v mezích NZÚ: min. 5 kWp, max. 3 kWp na byt (`KALK.NZU`). Dříve pevné 20 / 40 / 60 kWp podle velikosti střechy (otázka zrušena).
- **Cena FVE** 25 500 Kč/kWp (`KALK.FVE_CENA_KWP`) + investice do JOM podle počtu bytů (`KALK.jomInvestice()`), obě orientační.
- **Úvěr NZÚ** = menší z investice do FVE a vzorce 350 000 + 40 000 × (kWp − 5); minimum 100 000 Kč; splatnost 10 let do 1,5 mil. Kč, nad to 15 let; 0 %, splátka = jistina. Dříve „investice × 0,065“.
- **Teplo:** zateplení se počítá z nákladů na vytápění (nebo z nákladů po TČ, když je TČ vybrané), takže se úspory nepřekrývají. Cena elektřiny „s FVE“ pro TČ se používá jen při vybrané FVE. Konstanty plynu, tepla a COP jsou orientační (`NAKLADY_VYTAPENI_NA_BYT`, `TEPLO_KWH_NA_BYT`, `TC_COP`).
- **Regulované platby domu** (graf JOM) se počítají z ověřeného ceníku 2026 (ČEZ, D02d, 1×25 A) včetně DPH, ne z pevných 8 000 Kč na byt.
- Všechny částky se zobrazují jako rozpětí ±`KALK.ROZPETI` (15 %), od 1 mil. Kč v milionech. Roční spotřeba domu je nepovinná (výchozí `SPOTREBA_NA_BYT`).

## Investice do JOM (`KALK.jomInvestice(byty)` v `js/kalk-constants.js`)
- Investice do JOM se skládá z cen v `js/kalk-ceny.js` (údaje majitele webu, listopad 2026, **bez DPH**): gateway 15 000 Kč, projekt 35 000 Kč, hlavní jistič 8 000–16 000 Kč (za dům), montáž 2 500–4 000 Kč na byt a podružný elektroměr 1 450 Kč (1f) až 4 300 Kč (3f) na byt (e-shop, orientačně). Výpočet přičítá DPH: 12 % montáž a jistič (stavebně-montážní práce na bytovém domě), 21 % gateway, projekt a elektroměry. Nezahrnuje připojovací poplatek distributora za navýšení rezervovaného příkonu (630 Kč za 1 A u třífázového jističe).
- Implementace: `KALK.jomInvestice(byty)` sečte položky s DPH (dolní mez s 1f elektroměry, horní s 3f). Příklady: 24 bytů 179–311 tis. Kč (7,4–13,0 tis. Kč na byt), cena na byt s velikostí domu klesá. Sazba hlavního jističe C02d 1 800–2 400 Kč/měsíc za dům (bez DPH) je v kalk-ceny.js, ve výpočtu úspory se zatím nepoužívá.
- Použití: krok JOM hlavní kalkulačky (investice a návratnost), investice FVE (střed rozpětí) a kalkulačka FVE v průvodci (střed rozpětí).
- Krok JOM nově nezobrazuje graf „distribuční náklady“. Úspora z JOM zůstává `KALK.JOM_NA_BYT` × počet bytů (model, čeká na přesný klíč).

## Krok Teplo a TUV (hlavní kalkulačka)

- Úspora = dnešní roční náklady na teplo a TUV (zadává uživatel, nepočítají se) − provoz TČ za cenu elektřiny ze sítě. Bez zadaných nákladů se úspora a návratnost nezobrazí. Přínos FVE se do TČ nezapočítává (je jen v kroku FVE).
- Investice do TČ (`KALK.TC_INVESTICE`, Kč na byt, interpolace podle počtu bytů): 10 bytů 95–110 tis., 20 bytů 85–95 tis., 40 bytů 70–85 tis., 80 bytů 55–65 tis. Údaj majitele webu, neověřeno.
- Spotřeba tepla: 8 000 kWh na byt a rok pro zateplený dům (výchozí), 12 000 kWh pro nezateplený (volba „Zateplení domu“ v kroku Teplo a TUV), COP 3,0 (konzervativní hodnota). Hodnoty jsou odhady majitele, spotřeba TČ se ukazuje s rozpětím ±25 %.
- Úvěr NZÚ na TČ vzduch-voda: 150 000 Kč na připojený byt (ověřeno: Závazné pokyny NZÚ BD, verze 1.1, červen 2026, podoblast C.1), min. úvěr 100 000 Kč, kompenzace úroků 10 let do 1,5 mil. Kč, nad to 15 let. Úvěr = menší z investice a limitu na byt. Dílčí opatření mají strop 250 000 Kč na byt, komplexní 750 000 Kč na byt.

## Krok Okna a dveře (hlavní kalkulačka)

- Úspora = rozpětí podílu z nákladů na teplo podle stavu oken (`KALK.OKNA_USPORA`): stará 15–25 %, částečně vyměněná 8–12 %, nová 0–5 %. Stará okna se opírají o veřejné zdroje (výměna 15–25 %, výjimečně do 30 %), zbylé dva stavy jsou odhad. Základem jsou dnešní náklady zadané uživatelem, při vybraném TČ náklady po TČ.
- Investice = počet bytů × plocha oken a dveří na byt (výchozí 8 m², odhad) × cena 8 000–12 000 Kč/m² včetně montáže (odhad, neověřeno). Jediná dohledaná zakázka SVJ vycházela na cca 3 600 Kč/m².
- Ověřeno (pokyny NZÚ BD, verze 1.1, červen 2026, podoblast A): podpora výplní otvorů až 12 000 Kč/m², dílčí opatření celkem max. 250 000 Kč na byt, podmínka Uw ≤ 0,90 W/m²K. Úvěr = menší z investice, limitu na m² a limitu na byt.

## Souhrn plánu (hlavní kalkulačka)

- Plán = součet vybraných kroků (`plan` v `KALK_ENGINE.compute`): investice, roční úspora, návratnost, úspora na byt a měsíc, úvěr NZÚ. Každý krok má rozpětí, celkové rozpětí je součet dolních a horních hodnot. Krok FVE bez JOM se v souhrnu počítá včetně JOM, aby odpovídal kroku FVE.
- Úspora z tepla a oken se počítá jen při zadaných nákladech na teplo. Jinak se návratnost plánu nezobrazí.
- Úvěr NZÚ = součet úvěrů na FVE, TČ a okna, nejvýše 250 000 Kč na byt (dílčí opatření). JOM se z úvěru neplatí. Splatnost 10 let do 1,5 mil. Kč, jinak 15 let.

## Jednotné jádro výpočtu pro všechny nástroje

- **Hlavní kalkulačka, mini kalkulačka na úvodní straně, FVE kalkulačka v průvodci i JOM dotazník** počítají přes `KALK_ENGINE.compute` (`js/kalk-engine.js`): velikost FVE podle spotřeby a pravidel NZÚ, úspora z FVE i z poplatků JOM, investice, baterie (`inp.baterie`), existující systém (`inp.vykonFix`) a rozpětí (`inp.rozpeti`).
- **Orientace střechy:** jedna tabulka `KALK.ORIENT` (J 1,00, JV/JZ 0,93, V/Z 0,77, S 0,58). Hlavní kalkulačka, FVE průvodce i JOM dotazník nabízejí stejných šest voleb.
- **Rozpětí:** `KALK.rozpeti(n)`: ±15 %, při dvou a více neznámých vstupech (nevyplněná spotřeba, nezměněná orientace, u dotazníku i distribuční území a jistič) ±25 %. Mini kalkulačka má vždy dva neznámé vstupy, tedy ±25 %.
- **Návratnost:** nejnižší investice ÷ nejvyšší úspora až nejvyšší investice ÷ nejnižší úspora, ve všech nástrojích stejně.
- **Baterie:** `KALK.BATERIE_PODIL` 0,15 (zvýšení podílu vlastní spotřeby) a `KALK.BATERIE_NA_BYT` 10 000 Kč (0,5 kWh × 20 000 Kč/kWh), neověřeno.
- **Kontrolní dům:** 24 bytů, 80 MWh, jih → JOM a FVE (52 kWp) roční úspora 306–414 tis. Kč, investice s DPH 1,4–2,0 mil. Kč, návratnost 3,5–6,6 let v hlavní kalkulačce i ve FVE průvodci; bez zadané spotřeby (24 × 2 200 kWh, ±25 %) úspora 189–315 tis. Kč v hlavní i v mini kalkulačce.
