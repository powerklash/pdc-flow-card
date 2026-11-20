# PdC Flow Card – guida per lo sviluppo

Card Lovelace per Home Assistant, distribuita con HACS (`hacs.json` → `pdc-flow-card.js`).
Disegna con SVG animati tre sezioni: **ENERGIA** (fotovoltaico, inverter, UPS, batteria, rete, casa, utenze),
**IMPIANTO** (pompa di calore, valvola a 3 vie, bollitore, accumulo, pavimento, ricircolo) e
**ACQUA SANITARIA** (contatore, puffer, autoclave, rubinetto, pompa sentina).

Lingua: si parla in **italiano**. Le chiavi di configurazione sono in italiano (`entities:`, `nomi:`, `colori:`, `temperature:`, `utenze:`).
Le etichette dell'interfaccia di Home Assistant nelle istruzioni vanno date **in inglese** (l'HA dell'utente è in inglese).

## File
- `pdc-flow-card.js` — tutta la card, JavaScript puro senza build (custom element con shadow DOM, niente librerie).
- `README.md` — documentazione **in italiano e inglese** (le due metà vanno aggiornate insieme).
- `CHANGELOG.md` — una voce per ogni versione, italiano e inglese.
- `images/esempio.png` — immagine del README, generata da `dev/demo-image.js`.
- `.github/FUNDING.yml` — pulsante Sponsor.
- `dev/` — strumenti di prova con Playwright (non servono a HACS). `dev/private/` è ignorata da git.

## Struttura di `pdc-flow-card.js`
- In testa: commento con tutte le chiavi, poi `PDC_VERSION` (da aumentare a ogni release).
- Costanti: `PDC_NOMI` (nomi predefiniti, chiavi di `nomi:`), `PDC_COLORI` (chiavi di `colori:`),
  `PDC_ENERGY_KEYS` / `PDC_ENTITY_KEYS` / `PDC_ENTITY_ORDER` / `PDC_CONFIG_ORDER` (chiavi e ordine nello YAML),
  `PDC_DEMO` (stati della demo: `[dominio, stato, unità]`), `PDC_TEMPS` / `PDC_TEMP_RANGE` (colori per temperatura).
- Geometria energia: `PDC_E_FULL` / `PDC_E_COMPACT` (normale / fotovoltaico compatto), `PDC_E_LAYOUT`
  (`pieno` senza utenze, `utenze` con le pillole a destra), `PDC_U` (pillole delle utenze). Larghezza del disegno 420.
- Markup: `PDC_SVG_ENERGY` (sezione energia, `sv-e`) e `PDC_SVG` (impianto e acqua, `sv-m` / `sv-w`); stile in `PDC_CSS`.
- `class PdcFlowCard`: `setConfig`, `set hass`, `_build` (una volta), `_update` (a ogni stato: visibilità, testi, colori, flussi, layout).
  Helper: `_st`, `_num`, `_on`, `_kw`, `_text(id, txt, color)`, `_color(id, c)` (imposta `--c`), `_vis(ids, bool)`, `_flow(...)`.
  Dentro `_update`: `has(k)`, `fixed(k)` (colore fisso da `colori:`), `tc(k, v)` (colore per temperatura).
- Click: elementi con `data-key` aprono il dettaglio dell'entità (more-info); con `data-toggle` chiamano `homeassistant.toggle`.
- Icone: `pdcLoadIcon(icon)` legge il path MDI da `<ha-icon>` di HA e lo mette in cache.
- Editor visuale: `PDC_FIELD_SELECTORS`, `PDC_GROUPS` (gruppi espandibili), `PDC_SECTIONS`, `PDC_LABELS`, `PDC_OPT_KEYS`,
  `class PdcFlowCardEditor` con `toForm` / `fromForm`. Ogni nuova chiave va aggiunta a: commento in testa, liste delle chiavi,
  `PDC_DEMO`, selettore, gruppo, etichetta, README (IT + EN).
- Animazioni: rispettano `prefers-reduced-motion` salvo `animazioni_sempre: true` (attributo `anim-sempre` sull'host).

## Prove (`dev/`)
Prima volta: `cd dev && npm install && npx playwright install chromium`.
- `node dev/check.js` — sintassi + controllo che nei file pubblici non ci siano riferimenti personali
  (le parole stanno in `dev/private/parole-private.txt`). **Da lanciare prima di ogni commit.**
- `node dev/render.js [scenario]` — rende gli scenari in `dev/out/*.png` (pagina finta `dev/test-page.html`
  con `ha-icon` / `ha-card` finti). Scenari utili: `notte_u`, `giorno_u`, `utente`, `sole`.
- `node dev/demo-image.js` — rigenera `images/esempio.png`.
- `node dev/editor-test.js` — albero dei campi dell'editor e prova di `toForm` / `fromForm`.
- `node dev/motion-test.js`, `node dev/click-test.js` — animazioni con "riduci animazioni" e pulsanti delle prese.
Per mostrare un dettaglio, ritagliare e ingrandire l'area interessata delle immagini in `dev/out/`.

## Modo di lavorare (concordato con l'utente)
1. Ogni modifica: implementarla, rendere **un'immagine di esempio** (più scenari affiancati: notte/compatto, giorno con utenze, ecc.)
   e **aspettare la conferma** ("ok", "bene", "perfetto") prima di chiudere la versione.
2. Dopo la conferma: aumentare `PDC_VERSION`, aggiornare README (IT + EN), `CHANGELOG.md`, rigenerare `images/esempio.png`,
   lanciare `node dev/check.js`.
3. Dare all'utente il **testo del changelog** (IT + EN) da incollare nella descrizione della release.
4. L'utente fa commit e push con GitHub Desktop, **poi** crea la release `vX.Y.Z` con target `main` (mai prima del push:
   HACS scaricherebbe il codice vecchio) e aggiorna da HACS.
- Non modificare mai Home Assistant: al massimo letture.
- Nessun riferimento personale (nomi di entità reali, marchi degli apparecchi, indirizzi, IP) nei file pubblici.
