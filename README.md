# PdC Flow Card

Card per la dashboard di Home Assistant che disegna in modo animato una pompa di calore e l'acqua sanitaria di casa:

- **Impianto:** temperatura esterna, pompa di calore, valvola a 3 vie, bollitore, accumulo, circolatore e pavimento, con mandata, ritorno e setpoint.
- **Acqua sanitaria:** rete, stop, contatore (L/min e litri di oggi), puffer, autoclave, ricircolo dal bollitore e rubinetto.

Ogni componente compare solo se la sua entità è impostata. Toccando un componente si apre la finestra di Home Assistant della sua entità: da lì si chiude lo stop, si accende il ricircolo o si blocca l'autoclave.

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
