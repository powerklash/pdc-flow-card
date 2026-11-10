# PdC Flow Card

Card per la dashboard di Home Assistant che disegna in modo animato l'energia, una pompa di calore e l'acqua sanitaria di casa:

- **Energia:** pannelli fotovoltaici con uno o due inverter, batteria di accumulo, rete elettrica e casa, con la direzione dei flussi (più potenza, pallini più veloci); dalla casa escono le utenze elettriche che scegli tu.
- **Impianto:** temperatura esterna, pompa di calore, valvola a 3 vie, bollitore, accumulo, circolatore e pavimento, con mandata, ritorno e setpoint.
- **Acqua sanitaria:** rete, stop, contatore (L/min e litri di oggi), puffer, autoclave, ricircolo dal bollitore e rubinetto.

![Esempio della card](images/esempio.png)

Ogni componente compare solo se la sua entità è impostata; una sezione senza entità sparisce. Toccando un componente si apre la finestra di Home Assistant della sua entità: da lì si chiude lo stop, si accende il ricircolo o si blocca l'autoclave.

## Installazione con HACS

1. In HACS apri il menu **⋮** in alto a destra e scegli **Repository personalizzati**.
2. Incolla l'indirizzo di questo repository, scegli il tipo **Dashboard** e premi **Aggiungi**.
3. Cerca **PdC Flow Card** in HACS e premi **Scarica**.
4. Ricarica la pagina del browser (Ctrl+F5).

HACS aggiunge da solo la risorsa della dashboard.

## Installazione manuale

1. Copia `pdc-flow-card.js` in `/config/www/`.
2. In **Impostazioni → Plance → ⋮ → Risorse** aggiungi `/local/pdc-flow-card.js?v=1`, tipo **Modulo JavaScript**.
3. A ogni aggiornamento del file aumenta il numero dopo `?v=`.

## Configurazione

Aggiungi la card **PdC Flow Card** dall'editor visuale: c'è un gruppo per ogni componente, con le sue entità, il nome e il colore.

Esempio in YAML:

```yaml
type: custom:pdc-flow-card
entities:
  fv_potenza: sensor.fotovoltaico_potenza
  inverter_1_potenza: sensor.inverter_1_potenza
  inverter_2_potenza: sensor.inverter_2_potenza
  batteria_livello: sensor.batteria_livello
  batteria_potenza: sensor.batteria_potenza
  rete_potenza: sensor.rete_potenza
  casa_potenza: sensor.casa_consumo
  rete_stato: binary_sensor.rete_collegata
  temperatura_esterna: sensor.temperatura_esterna
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
  acqua_valvola: switch.valvola_acqua
  acqua_portata: sensor.portata_acqua
  acqua_totale: sensor.contatore_acqua
  ricircolo: switch.ricircolo
  autoclave_velocita: sensor.autoclave_giri
  autoclave_pressione: sensor.autoclave_pressione
  autoclave_comando: select.autoclave_blocco
```

### Entità

| Chiave | Cosa serve |
|---|---|
| `fv_potenza` | potenza prodotta dal fotovoltaico (se manca, è la somma degli inverter) |
| `inverter_1_potenza`, `inverter_2_potenza` | potenza dei due inverter, disegnati sotto i pannelli |
| `batteria_livello`, `batteria_potenza` | carica della batteria (%) e potenza (positiva = in scarica) |
| `rete_potenza` | potenza della rete (positiva = prelievo, negativa = immissione) |
| `casa_potenza` | consumo della casa |
| `rete_stato` | stato della rete (on = collegata): se la rete si stacca, sotto la rete compare "staccata" |
| `temperatura_esterna` | temperatura esterna |
| `pdc_potenza` | potenza della pompa di calore (anche una lista di sensori, che vengono sommati) |
| `riscaldamento`, `raffrescamento` | modalità attiva della pompa di calore |
| `acs_potenza` oppure `acs_attiva` | potenza del ciclo acqua calda, oppure un'entità on/off |
| `pdc_mandata`, `pdc_ritorno` | temperature di mandata e ritorno |
| `acs_temperatura`, `acs_setpoint` | temperatura e setpoint del bollitore |
| `accumulo_temperatura`, `accumulo_ingresso`, `accumulo_setpoint` | temperatura, ingresso e setpoint dell'accumulo |
| `circolatore` | circolatore del pavimento |
| `pavimento_mandata`, `pavimento_ritorno` | temperature del pavimento |
| `acqua_valvola` | valvola dell'acqua (on = aperta) |
| `acqua_portata` | portata istantanea |
| `acqua_totale` oppure `acqua_oggi` | contatore totale (i litri di oggi vengono calcolati dalle statistiche) oppure litri del giorno |
| `ricircolo` | pompa di ricircolo |
| `autoclave_velocita`, `autoclave_pressione`, `autoclave_portata`, `autoclave_stato` | dati dell'autoclave |
| `autoclave_comando` | select (Abilita/Disabilita) o switch per bloccare l'autoclave |

I setpoint accettano un climate o un water_heater (attributo `temperature`) oppure un sensore.

### Utenze elettriche

Dalla casa escono, in colonna, le utenze che aggiungi. Nell'editor visuale c'è il gruppo **Aggiungi utenza elettrica**; in YAML:

```yaml
utenze:
  - entity: sensor.pompa_di_calore_potenza
    nome: Pompa di calore
    icona: mdi:heat-pump
  - entity: sensor.lavatrice_potenza
    nome: Lavatrice
    icona: mdi:washing-machine
    colore: teal
    nascondi_a_zero: true   # la riga sparisce quando è spenta
  - entity: sensor.forno_temperatura
    nome: Forno
    icona: mdi:stove
    soglia: 65              # accesa sopra 65 (unità del sensore)
```

- Una potenza (W o kW) è accesa sopra 10 W; un altro numero sopra 0; uno stato quando non è "off" o "standby". `soglia` cambia il limite.
- Senza `nome` si usa il nome dell'entità; senza `icona` quella dell'entità.
- Si possono incollare anche le voci `individual` di power-flow-card-plus: `name`, `icon`, `color`, `display_zero: false` e `display_zero_tolerance` vengono riconosciute.

### Opzioni

| Opzione | Effetto |
|---|---|
| `title` | titolo della card |
| `nomi` | nomi dei componenti; `''` toglie la scritta |
| `colori` | colore di icone e disegni: nome del tema (`red`, `blue`…), `#hex` o `[r, g, b]` |
| `temperature` | per ogni temperatura `colora: true` e `min` / `max`: scala da celeste a rosso |
| `acqua_portata_unita` | unità della portata se il sensore la dichiara male (`L/h`, `L/min`, `m³/h`…) |
| `soglia_pdc`, `soglia_acs` | potenza in kW sopra cui la pompa o il ciclo acqua calda sono considerati accesi (predefinito 0,1) |
| `puffer` | `true` mostra il puffer anche senza autoclave |
| `batteria_inverti`, `rete_inverti` | `true` se il sensore usa il segno opposto |
| `soglia_energia` | potenza in kW sopra cui i flussi elettrici si animano (predefinito 0,1) |
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
acqua_portata_unita: L/h
```

## Verifica della versione

Nella console del browser (F12) compare `PDC-FLOW-CARD v<versione>`.
