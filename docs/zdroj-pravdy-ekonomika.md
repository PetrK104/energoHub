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
| Náklad JOM v kalkulačce FVE | 200 000 Kč, jen u varianty S JOM | `fve-calc.js` (`JOM_ADDON`), shodně s `fve-costs.js` |
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
