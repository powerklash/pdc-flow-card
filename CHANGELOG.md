# Changelog

## v0.33.0
### Novità
- **Temperatura della casa** (`casa_temperatura`, sensore): temperatura piccola dentro la casa, sopra il consumo. Toccandola si apre l'entità. Colore con `colori: casa`. Disponibile anche nell'editor, nel gruppo Casa.

*English* — New: house temperature (`casa_temperatura`), small, inside the house above the consumption; tap to open the entity; colour with `colori: casa`; also in the visual editor (Casa group).

## v0.32.0
### Novità
- **UPS degli inverter** (`ups_batteria`, sensore in %): piccola icona "UPS" con barra di carica dentro il pannello fotovoltaico, a sinistra. Verde al 100%; sotto il 100% diventa rossa, lampeggia e mostra la percentuale. Toccandola si apre l'entità. Nome con `nomi: ups`, colore da carico con `colori: ups`.
- **Opzione `animazioni_sempre: true`**: flussi, ventole e pompe si muovono anche quando il telefono o il PC ha attivo "riduci animazioni". Senza l'opzione, con quell'impostazione la card resta ferma. Disponibile anche nell'editor, sotto il titolo.
### Modifiche
- Il valore dei kW prodotti è ora a destra dentro il pannello; con il nome del fotovoltaico nascosto è centrato in altezza.
### Correzioni
- Due animazioni avevano lo stesso nome: la scintilla della rete lampeggiava in modo sbagliato.

*English* — New: inverter UPS (`ups_batteria`) inside the PV panel, green at 100%, blinking red with the percentage below; `animazioni_sempre: true` keeps animations running with "reduce motion" turned on. Changed: PV value on the right inside the panel. Fixed: duplicate animation name.

## v0.31.0
- **Cancello** sotto la casa (`cancello_stato`, `cancello_luce`): aperto arancione / chiuso grigio, lampada accesa o spenta.
- **Tettoia e ingresso** sotto il cancello (`tettoia_prese`, `ingresso_prese`): il pulsante accende e spegne direttamente la presa.

*English* — Gate below the house with open/closed state and light; canopy and entrance socket buttons that toggle the switch directly.

## v0.30.0
- **Allarme** (`allarme`): scudo nel tetto della casa con l'icona dello stato; verde inserito, grigio disinserito, arancione in attesa, rosso lampeggiante scattato.

*English* — Alarm shield in the house roof, coloured by state.

## v0.29.0
- **Locale caldaia**: temperatura e umidità (`locale_temperatura`, `locale_umidita`) tra pompa di calore e bollitore.

*English* — Boiler room temperature and humidity.

## v0.28.0
- Allineamenti: bordi sinistro e destro comuni alle tre sezioni, bollitore allineato alla pompa di calore, pillole delle utenze allineate al bollitore; temperatura esterna piccola accanto al tetto della casa.

*English* — Alignment pass across the three sections; small outdoor temperature next to the house roof.

## v0.27.0
- Goccia iniziale prima del contatore; contatore centrato sulla pompa sentina; ricircolo spostato nella sezione impianto.

*English* — Water source drop, meter centred over the sump pump, recirculation moved to the heating section.

## v0.26.0
- Contatore unico con portata, consumo di oggi, totale (`acqua_totale`) e valvola; opzione `acqua_separata`.

*English* — Merged water meter with flow, today, total and valve; `acqua_separata` option.

## v0.25.0
- Ora di alba e tramonto ai lati dei pannelli (opzione `alba_tramonto`).

*English* — Sunrise and sunset times next to the panels.

## v0.24.0
- Pompa sentina (`sentina_potenza`, `sentina_energia`, `sentina_stato`); fotovoltaico compatto quando non produce, con luna di notte o nuvola col meteo (`fv_compatto`, `fv_previsione`, `meteo`).

*English* — Sump pump; compact PV with moon or weather cloud when not producing.
