# PdC Flow Card

[🇮🇹 Italiano](#italiano) · [🇬🇧 English](#english)

![Esempio della card / Card example](images/esempio.png)

---

## Italiano

Card per la dashboard di Home Assistant che disegna in modo animato l'energia di casa, una pompa di calore (PdC) e l'acqua sanitaria.

- **Energia:** pannelli fotovoltaici con uno o due inverter, batteria di accumulo, rete elettrica e casa.
  - Ogni punto è collegato direttamente agli altri, per esempio batteria → casa.
  - Le linee compaiono solo quando ci passa energia. Più potenza passa, più i pallini corrono: pochi watt sono lentissimi.
  - Nomi e valori sono dentro le icone.
  - Il traliccio si anima quando la casa preleva dalla rete.
  - Dalla casa escono le utenze elettriche che scegli tu. Se nessuna è accesa, il disegno usa tutta la larghezza.
  - In alto a sinistra c'è la temperatura esterna.
  - Ai lati dei pannelli ci sono l'ora dell'alba (a sinistra) e del tramonto (a destra), presi dal sole di Home Assistant.
  - Quando il fotovoltaico non produce, il pannello diventa più piccolo, gli inverter spariscono e al posto del sole compare la luna (di notte) o una nuvola (di giorno, con il brutto tempo).
- **Impianto:**
  - pompa di calore con potenza, modalità e un'icona della funzione attiva (riscaldamento, raffrescamento, acqua sanitaria);
  - valvola a 3 vie, bollitore, accumulo, circolatore e pavimento, con mandata, ritorno e setpoint.
- **Acqua sanitaria:**
  - la linea parte da un piccolo cerchio con la goccia, poi contatore (L/min, litri di oggi, totale e valvola aperta/chiusa, tutto dentro il contatore), puffer, autoclave e rubinetto, centrati sulla stessa linea; la pompa del ricircolo è sotto il bollitore;
  - il contatore riempie il puffer; dal puffer al rubinetto l'acqua scorre quando l'autoclave è in funzione;
  - sotto, in una seconda riga, la pompa sentina collegata al puffer, con stato ed energia consumata.

Ogni componente compare solo se la sua entità è impostata; una sezione senza entità sparisce.

Toccando un componente si apre la finestra di Home Assistant della sua entità: da lì si chiude lo stop, si accende il ricircolo o si blocca l'autoclave.

### Installazione con HACS

1. In HACS apri il menu **⋮** in alto a destra e scegli **Repository personalizzati**.
2. Incolla l'indirizzo di questo repository, scegli il tipo **Dashboard** e premi **Aggiungi**.
3. Cerca **PdC Flow Card** e premi **Scarica**.
4. Ricarica la pagina del browser (Ctrl+F5).

HACS aggiunge da solo la risorsa della dashboard.

### Installazione manuale

1. Copia `pdc-flow-card.js` in `/config/www/`.
2. In **Impostazioni → Plance → ⋮ → Risorse** aggiungi `/local/pdc-flow-card.js?v=1`, tipo **Modulo JavaScript**.
3. A ogni aggiornamento del file aumenta il numero dopo `?v=`.

### Configurazione

Aggiungi la card **PdC Flow Card** dall'editor visuale.
- L'editor è diviso in tre parti, come la card: **Energia**, **Pompa di calore e impianto** e **Acqua sanitaria**.
- In ogni parte c'è un gruppo per componente, con le sue entità, il nome e il colore.
- Lo YAML viene scritto nello stesso ordine.

Esempio in YAML:

```yaml
type: custom:pdc-flow-card
entities:
  # Energia
  temperatura_esterna: sensor.temperatura_esterna
  fv_potenza: sensor.fotovoltaico_potenza
  inverter_1_potenza: sensor.inverter_1_potenza
  inverter_2_potenza: sensor.inverter_2_potenza
  fv_previsione: sensor.power_production_now   # previsione (per esempio Forecast.Solar)
  meteo: weather.casa
  batteria_livello: sensor.batteria_livello
  batteria_potenza: sensor.batteria_potenza
  rete_potenza: sensor.rete_potenza
  rete_stato: binary_sensor.rete_collegata
  casa_potenza: sensor.casa_consumo
  # Pompa di calore e impianto
  pdc_potenza: sensor.pdc_potenza
  riscaldamento: binary_sensor.pdc_riscaldamento
  raffrescamento: binary_sensor.pdc_raffrescamento
  acs_potenza: sensor.pdc_potenza_acs
  pdc_mandata: sensor.pdc_mandata
  pdc_ritorno: sensor.pdc_ritorno
  acs_temperatura: sensor.bollitore_temperatura
  acs_setpoint: climate.bollitore_setpoint
  accumulo_temperatura: sensor.accumulo_temperatura
  circolatore: binary_sensor.circolatore_pavimento
  # Acqua sanitaria
  acqua_valvola: switch.valvola_acqua
  acqua_portata: sensor.portata_acqua
  acqua_totale: sensor.contatore_acqua
  autoclave_velocita: sensor.autoclave_giri
  autoclave_pressione: sensor.autoclave_pressione
  autoclave_comando: select.autoclave_blocco
  ricircolo: switch.ricircolo
  sentina_potenza: sensor.pompa_sentina_potenza
  sentina_energia: sensor.pompa_sentina_energia
  sentina_stato: switch.pompa_sentina
```

#### Entità

| Chiave | Cosa serve |
|---|---|
| `fv_potenza` | potenza prodotta dal fotovoltaico (se manca, è la somma degli inverter; i valori negativi contano come 0) |
| `inverter_1_potenza`, `inverter_2_potenza` | potenza dei due inverter, disegnati sotto i pannelli |
| `sole` | sole: ora di alba e tramonto, e scelta tra luna e nuvola quando il fotovoltaico non produce (vuoto = `sun.sun`) |
| `fv_previsione` | potenza prevista adesso (per esempio Forecast.Solar): con 0 W previsti compare la luna |
| `meteo` | entità meteo: con pioggia o neve compaiono gocce o fiocchi sotto la nuvola |
| `batteria_livello`, `batteria_potenza` | carica della batteria (%) e potenza (positiva = in scarica) |
| `rete_potenza` | potenza della rete (positiva = prelievo, negativa = immissione) |
| `rete_stato` | stato della rete (on = collegata); se la rete si stacca compare "staccata" |
| `casa_potenza` | consumo della casa (se manca, viene calcolato) |
| `temperatura_esterna` | temperatura esterna, in alto a sinistra della parte energia (senza la parte energia, nel titolo dell'impianto) |
| `pdc_potenza` | potenza della pompa di calore (anche una lista di sensori, che vengono sommati) |
| `riscaldamento`, `raffrescamento` | modalità attiva della pompa di calore |
| `acs_potenza` oppure `acs_attiva` | potenza del ciclo acqua calda, oppure un'entità on/off |
| `pdc_mandata`, `pdc_ritorno` | temperature di mandata e ritorno |
| `acs_temperatura`, `acs_setpoint` | temperatura e setpoint del bollitore |
| `accumulo_temperatura`, `accumulo_ingresso`, `accumulo_setpoint` | temperatura, ingresso e setpoint dell'accumulo |
| `circolatore` | circolatore del pavimento |
| `pavimento_mandata`, `pavimento_ritorno` | temperature del pavimento |
| `acqua_valvola` | valvola dell'acqua (on = aperta); con il contatore, lo stato compare dentro il contatore |
| `acqua_portata` | portata istantanea |
| `acqua_totale` oppure `acqua_oggi` | contatore totale (mostrato dentro il contatore; i litri di oggi vengono calcolati dalle statistiche) oppure litri del giorno |
| `autoclave_velocita`, `autoclave_pressione`, `autoclave_portata`, `autoclave_stato` | dati dell'autoclave |
| `autoclave_comando` | select (Abilita/Disabilita) o switch per bloccare l'autoclave |
| `ricircolo` | pompa di ricircolo |
| `sentina_potenza` | potenza della pompa sentina: è accesa quando assorbe corrente |
| `sentina_energia` | energia consumata dalla pompa sentina (senza la potenza, la pompa risulta accesa quando questo valore è appena salito) |
| `sentina_stato` | alimentazione della pompa sentina (off = "spenta", in rosso) |

I setpoint accettano un climate o un water_heater (attributo `temperature`) oppure un sensore.

#### Utenze elettriche

Dalla casa escono, in colonna, le utenze che aggiungi. Ogni utenza è una "pillola" con icona, nome e valore.

Nell'editor visuale c'è il gruppo **Aggiungi utenza elettrica**. In YAML:

```yaml
utenze:
  - entity: sensor.pompa_di_calore_potenza
    nome: Pompa di calore
    icona: mdi:heat-pump
  - entity: sensor.lavatrice_potenza
    nome: Lavatrice
    icona: mdi:washing-machine
    colore: teal
    nascondi_a_zero: true   # sparisce quando è spenta
  - entity: sensor.forno_temperatura
    nome: Forno
    icona: mdi:stove
    soglia: 65              # accesa sopra 65 (unità del sensore)
```

- Quando un'utenza è accesa:
  - una potenza (W o kW): appena è sopra 0;
  - un altro numero: sopra 0;
  - uno stato: quando non è "off" o "standby".
  - `soglia` cambia il limite.
- Senza `nome` si usa il nome dell'entità; senza `icona` si usa quella dell'entità.
- Si possono incollare anche le voci `individual` di power-flow-card-plus. Vengono riconosciute `name`, `icon`, `color`, `display_zero: false` e `display_zero_tolerance`.

#### Opzioni

| Opzione | Effetto |
|---|---|
| `title` | titolo della card |
| `nomi` | nomi dei componenti; `''` toglie la scritta |
| `colori` | colore di icone e disegni: nome del tema (`red`, `blue`…), `#hex` o `[r, g, b]` |
| `temperature` | per ogni temperatura `colora: true` e `min` / `max`: scala da celeste a rosso |
| `soglia_energia` | potenza in kW sopra cui rete e batteria si animano (predefinito 0: qualsiasi valore) |
| `fv_compatto` | `false` lascia il fotovoltaico grande anche quando non produce (predefinito: si rimpicciolisce) |
| `alba_tramonto` | `false` nasconde l'ora di alba e tramonto ai lati dei pannelli (le scritte si cambiano con `nomi: alba` e `nomi: tramonto`) |
| `batteria_inverti`, `rete_inverti` | `true` se il sensore usa il segno opposto |
| `batteria_colora` | `true` colora la batteria secondo la carica: rossa quando è scarica, verde brillante quando è carica |
| `batteria_min`, `batteria_max` | percentuale a cui la batteria è rossa e a cui è verde (predefinito 0 e 100) |
| `soglia_pdc`, `soglia_acs` | potenza in kW sopra cui la pompa o il ciclo acqua calda sono considerati accesi (predefinito 0,1) |
| `acqua_portata_unita` | unità della portata se il sensore la dichiara male (`L/h`, `L/min`, `m³/h`…) |
| `puffer` | `true` mostra il puffer anche senza autoclave |
| `acqua_separata` | `true` mostra rete e stop come icone a sé, prima del contatore (predefinito: dentro il contatore) |
| `demo` | `true` mostra dati di esempio finché non è impostata nessuna entità; è l'anteprima che compare nella scelta delle card |

Esempio:

```yaml
nomi:
  bollitore: Boiler ACS
  rete: ''
colori:
  bollitore: red
temperature:
  bollitore: { colora: true, min: 35, max: 60 }
batteria_colora: true
acqua_portata_unita: L/h
```

#### Verifica della versione

Nella console del browser (F12) compare `PDC-FLOW-CARD v<versione>`.

---

## English

A Home Assistant dashboard card that draws an animated view of the home's energy, a heat pump (PdC, *pompa di calore*) and the domestic water system.

> The configuration keys are in Italian (for example `batteria_potenza` = battery power). The tables below translate them.

- **Energy:** solar panels with one or two inverters, home battery, grid and house.
  - Every point is linked directly to the others, for example battery → house.
  - Lines appear only while energy flows through them. The more power flows, the faster the dots move: a few watts are very slow.
  - Names and values are inside the icons.
  - The pylon is animated while the house draws power from the grid.
  - Electrical loads you choose branch out of the house. When none is on, the drawing uses the full width.
  - The outdoor temperature is in the top-left corner.
  - Next to the panels are the sunrise time (left) and sunset time (right), taken from Home Assistant's sun entity.
  - When the solar panels produce nothing, the panel gets smaller, the inverters are hidden and the sun is replaced by the moon (at night) or a cloud (in the daytime, with bad weather).
- **Heating system:**
  - heat pump with power, mode and an icon of the active function (heating, cooling, hot water);
  - 3-way valve, hot water tank, buffer tank, circulator and underfloor heating, with flow, return and setpoints.
- **Domestic water:**
  - the line starts from a small circle with a water drop, then water meter (L/min, today's litres, total and shut-off valve open/closed, all inside the meter), break tank, booster pump and tap, centred on the same line; the recirculation pump sits below the hot water tank;
  - the meter fills the break tank; water flows from the tank to the tap only while the booster pump is running;
  - below, on a second row, the sump pump connected to the break tank, with its status and energy used.

Each component is shown only when its entity is set; a section with no entities disappears.

Tapping a component opens Home Assistant's dialog for its entity: from there you can close the valve, start the recirculation pump or lock the booster pump.

### Install with HACS

1. In HACS open the **⋮** menu (top right) and choose **Custom repositories**.
2. Paste this repository's URL, choose the **Dashboard** type and press **Add**.
3. Search for **PdC Flow Card** and press **Download**.
4. Reload the browser page (Ctrl+F5).

HACS adds the dashboard resource for you.

### Manual install

1. Copy `pdc-flow-card.js` to `/config/www/`.
2. In **Settings → Dashboards → ⋮ → Resources** add `/local/pdc-flow-card.js?v=1` as a **JavaScript module**.
3. Each time you replace the file, increase the number after `?v=`.

### Configuration

Add the **PdC Flow Card** from the visual editor.
- The editor is split into three parts, like the card: **Energia** (energy), **Pompa di calore e impianto** (heat pump and heating system) and **Acqua sanitaria** (domestic water).
- Each part has one group per component, with its entities, name and colour.
- The YAML is written in the same order.

See the YAML example in the Italian section above: the keys are the same.

#### Entities

| Key | Meaning |
|---|---|
| `fv_potenza` | solar power (if missing, the sum of the inverters; negative values count as 0) |
| `inverter_1_potenza`, `inverter_2_potenza` | power of the two inverters, drawn below the panels |
| `sole` | sun entity: sunrise and sunset times, and the choice between moon and cloud when the panels produce nothing (empty = `sun.sun`) |
| `fv_previsione` | forecast power right now (for example Forecast.Solar): with 0 W expected the moon is shown |
| `meteo` | weather entity: rain or snow adds drops or flakes below the cloud |
| `batteria_livello`, `batteria_potenza` | battery charge (%) and power (positive = discharging) |
| `rete_potenza` | grid power (positive = import, negative = export) |
| `rete_stato` | grid status (on = connected); "staccata" (disconnected) is shown when the grid is down |
| `casa_potenza` | house consumption (calculated if missing) |
| `temperatura_esterna` | outdoor temperature, top-left of the energy section (without the energy section, in the heating system title) |
| `pdc_potenza` | heat pump power (also a list of sensors, which are added up) |
| `riscaldamento`, `raffrescamento` | heating / cooling mode active |
| `acs_potenza` or `acs_attiva` | hot-water cycle power, or an on/off entity |
| `pdc_mandata`, `pdc_ritorno` | flow and return temperatures |
| `acs_temperatura`, `acs_setpoint` | hot water tank temperature and setpoint |
| `accumulo_temperatura`, `accumulo_ingresso`, `accumulo_setpoint` | buffer tank temperature, inlet and setpoint |
| `circolatore` | underfloor circulator |
| `pavimento_mandata`, `pavimento_ritorno` | underfloor flow and return temperatures |
| `acqua_valvola` | water valve (on = open); with a meter, its state is shown inside the meter |
| `acqua_portata` | instant water flow |
| `acqua_totale` or `acqua_oggi` | total meter (shown inside the meter; today's litres come from statistics) or litres of the day |
| `autoclave_velocita`, `autoclave_pressione`, `autoclave_portata`, `autoclave_stato` | booster pump speed, pressure, flow and status |
| `autoclave_comando` | select (Abilita/Disabilita = enable/disable) or switch to lock the booster pump |
| `ricircolo` | recirculation pump |
| `sentina_potenza` | sump pump power: the pump is "on" while it draws current |
| `sentina_energia` | sump pump energy (without the power sensor, the pump counts as on right after this value rises) |
| `sentina_stato` | sump pump supply (off = "spenta", switched off, in red) |

Setpoints accept a climate or water_heater entity (`temperature` attribute) or a sensor.

#### Electrical loads (`utenze`)

Loads branch out of the house in a column. Each load is a "pill" with icon, name and value.

In the visual editor use **Aggiungi utenza elettrica** (add electrical load). Keys of each load:

| Key | Meaning |
|---|---|
| `entity` | the entity (power in W/kW, or any other sensor: state, percentage…) |
| `nome` | name (default: the entity's name) |
| `icona` | icon, e.g. `mdi:washing-machine` (default: the entity's icon) |
| `colore` | colour |
| `nascondi_a_zero` | `true` hides the load while it is off |
| `soglia` | "on" above this value, in the sensor's unit |

- When a load counts as "on":
  - power: as soon as it is above 0;
  - other numbers: above 0;
  - states: when not "off" or "standby".
- You can also paste the `individual` entries of power-flow-card-plus. The keys `name`, `icon`, `color`, `display_zero: false` and `display_zero_tolerance` are recognised.

#### Options

| Option | Effect |
|---|---|
| `title` | card title |
| `nomi` | component names; `''` removes the label |
| `colori` | icon and drawing colours: theme colour name (`red`, `blue`…), `#hex` or `[r, g, b]` |
| `temperature` | per temperature `colora: true` and `min` / `max`: light blue to red scale |
| `soglia_energia` | kW above which grid and battery are animated (default 0: any value) |
| `fv_compatto` | `false` keeps the solar panel full size when it produces nothing (default: it shrinks) |
| `alba_tramonto` | `false` hides the sunrise and sunset times next to the panels (labels can be changed with `nomi: alba` and `nomi: tramonto`) |
| `batteria_inverti`, `rete_inverti` | `true` if the sensor uses the opposite sign |
| `batteria_colora` | `true` colours the battery by charge: red when empty, bright green when full |
| `batteria_min`, `batteria_max` | charge (%) at which the battery is red and green (default 0 and 100) |
| `soglia_pdc`, `soglia_acs` | kW above which the heat pump or the hot-water cycle count as running (default 0.1) |
| `acqua_portata_unita` | flow unit when the sensor declares a wrong one (`L/h`, `L/min`, `m³/h`…) |
| `puffer` | `true` shows the break tank even without a booster pump |
| `acqua_separata` | `true` shows mains and shut-off valve as separate icons before the meter (default: inside the meter) |
| `demo` | `true` shows sample data until an entity is set; it is the preview in the card picker |

#### Check the version

The browser console (F12) shows `PDC-FLOW-CARD v<version>`.
