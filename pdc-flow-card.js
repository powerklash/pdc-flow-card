/*
 * PdC Flow Card – custom card per Home Assistant
 * Schema animato della pompa di calore (valvola 3 vie, bollitore, accumulo,
 * circolatore, pavimento) e dell'acqua sanitaria (rete, stop, contatore,
 * puffer, autoclave, ricircolo dal bollitore, rubinetto).
 *
 * Installazione: da HACS (repository personalizzato, tipo Dashboard), oppure
 *   copiare in /config/www/pdc-flow-card.js e aggiungere la risorsa
 *   /local/pdc-flow-card.js?v=N   (tipo: Modulo JavaScript)
 *
 * Si configura dall'editor visuale oppure in YAML:
 *   type: custom:pdc-flow-card
 *   entities:            # ogni componente compare solo se la sua entità è impostata
 *     (energia) fv_potenza, inverter_1_potenza, inverter_2_potenza, batteria_livello, batteria_potenza (+ = in scarica),
 *     rete_potenza (+ = prelievo), rete_stato (on = rete collegata), casa_potenza
 *   utenze:              # facoltativo: utenze elettriche che escono dalla casa
 *     - entity: sensor.lavatrice_potenza
 *       nome: Lavatrice
 *       icona: mdi:washing-machine
 *       colore: teal              # facoltativo
 *       nascondi_a_zero: true     # facoltativo: la riga sparisce quando è spenta
 *       soglia: 5                 # facoltativo: accesa sopra questo valore (unità del sensore)
 *     temperatura_esterna, pdc_potenza (anche lista), riscaldamento, raffrescamento,
 *     acs_potenza | acs_attiva, pdc_mandata, pdc_ritorno, acs_temperatura,
 *     accumulo_temperatura, accumulo_ingresso, circolatore, pavimento_mandata,
 *     pavimento_ritorno, acqua_valvola | acqua_stop, acqua_portata, acqua_totale | acqua_oggi,
 *     ricircolo, autoclave_velocita, autoclave_pressione, autoclave_portata, autoclave_stato
 *   nomi:                # facoltativo, chiavi in PDC_NOMI; '' = nessuna scritta
 *     bollitore: Boiler ACS
 *     rete: ''
 *   (acs_setpoint / accumulo_setpoint: climate, water_heater o sensore; numero piccolo nel serbatoio)
 *   colori:              # facoltativo: colore di icone e disegni (anche da fermi), chiavi in PDC_COLORI
 *     bollitore: red     # nome tema (red, blue…), #hex o [r, g, b]
 *   acqua_portata_unita: L/h   # facoltativo
 *   puffer: true               # facoltativo: puffer visibile anche senza autoclave
 *   temperature:               # facoltativo, per ogni temperatura (chiavi in PDC_TEMPS)
 *     bollitore: { colora: true, min: 35, max: 60 }   # nome, valore e icona da celeste (min) a rosso (max)
 *   (autoclave_comando: select Abilita/Disabilita o switch; toccando l'autoclave si apre il suo comando)
 *   demo: true                 # facoltativo: dati di esempio finché non si imposta un'entità
 *   batteria_inverti / rete_inverti: true   # facoltativo: segno opposto della potenza
 *   batteria_colora: true      # facoltativo: batteria da rosso (scarica) a verde (carica); batteria_min / batteria_max in %
 *   soglia_energia: 0          # facoltativo: kW sopra cui rete e batteria si animano (0 = qualsiasi valore)
 */

const PDC_VERSION = '0.21.0';

// Nomi predefiniti dei componenti (sezione "nomi:")
const PDC_NOMI = {
  sezione_energia: 'Energia',
  fotovoltaico: 'Fotovoltaico',
  inverter_1: 'Inverter 1',
  inverter_2: 'Inverter 2',
  batteria: 'Batteria',
  rete_elettrica: 'Rete',
  casa: 'Casa',
  sezione_impianto: 'Impianto',
  sezione_acqua: 'Acqua sanitaria',
  esterno: 'esterno',
  pompa_di_calore: 'Pompa di calore',
  mandata: 'mandata',
  ritorno: 'ritorno',
  valvola_3_vie: '3 vie',
  ingresso_accumulo: 'ingresso',
  accumulo: 'Accumulo',
  circolatore: 'Circolatore',
  pavimento: 'Pavimento',
  bollitore: 'Bollitore',
  rete: 'Rete',
  stop: 'Stop',
  contatore: 'Contatore',
  puffer: 'Puffer',
  autoclave: 'Autoclave',
  ricircolo: 'Ricircolo',
  rubinetto: 'Acqua',
  setpoint: 'setpoint',
};

// Componenti a cui si può dare un colore (sezione "colori:")
const PDC_COLORI = [
  'fotovoltaico', 'inverter', 'batteria', 'rete_elettrica', 'casa',
  'esterno', 'pompa_di_calore', 'valvola_3_vie', 'mandata', 'ritorno', 'bollitore', 'accumulo',
  'ingresso_accumulo', 'circolatore', 'pavimento', 'rete', 'acqua_fredda', 'stop', 'contatore', 'puffer',
  'autoclave', 'ricircolo', 'rubinetto',
];

// Sezione energia (sopra l'impianto)
const PDC_ENERGY_KEYS = ['fv_potenza', 'inverter_1_potenza', 'inverter_2_potenza', 'batteria_livello', 'batteria_potenza', 'rete_potenza', 'rete_stato', 'casa_potenza'];

const PDC_ENTITY_KEYS = [
  ...PDC_ENERGY_KEYS,
  'temperatura_esterna', 'pdc_potenza', 'riscaldamento', 'raffrescamento', 'acs_potenza', 'acs_attiva',
  'pdc_mandata', 'pdc_ritorno', 'acs_temperatura', 'accumulo_temperatura', 'accumulo_ingresso',
  'circolatore', 'pavimento_mandata', 'pavimento_ritorno', 'acqua_valvola', 'acqua_portata',
  'acqua_totale', 'acqua_oggi', 'ricircolo', 'autoclave_velocita', 'autoclave_pressione',
  'autoclave_portata', 'autoclave_stato', 'autoclave_comando', 'acs_setpoint', 'accumulo_setpoint',
];
const PDC_MAIN_KEYS = PDC_ENTITY_KEYS.filter((k) => !PDC_ENERGY_KEYS.includes(k));

// Ordine delle chiavi nello YAML scritto dall'editor: energia, pompa di calore e impianto, acqua sanitaria
const PDC_ENTITY_ORDER = [
  'fv_potenza', 'inverter_1_potenza', 'inverter_2_potenza', 'batteria_livello', 'batteria_potenza',
  'rete_potenza', 'rete_stato', 'casa_potenza',
  'temperatura_esterna', 'pdc_potenza', 'riscaldamento', 'raffrescamento', 'acs_potenza', 'acs_attiva',
  'pdc_mandata', 'pdc_ritorno', 'acs_temperatura', 'acs_setpoint', 'accumulo_temperatura', 'accumulo_setpoint',
  'accumulo_ingresso', 'circolatore', 'pavimento_mandata', 'pavimento_ritorno',
  'acqua_valvola', 'acqua_stop', 'acqua_portata', 'acqua_totale', 'acqua_oggi',
  'autoclave_velocita', 'autoclave_pressione', 'autoclave_portata', 'autoclave_stato', 'autoclave_comando', 'ricircolo',
];
const PDC_CONFIG_ORDER = [
  'type', 'title', 'demo', 'entities', 'utenze',
  'soglia_energia', 'batteria_inverti', 'rete_inverti', 'batteria_colora', 'batteria_min', 'batteria_max',
  'soglia_pdc', 'soglia_acs', 'temperature',
  'acqua_portata_unita', 'puffer',
  'nomi', 'colori',
];
function pdcOrderConfig(cfg) {
  const out = {};
  for (const k of PDC_CONFIG_ORDER) if (cfg[k] !== undefined) out[k] = cfg[k];
  for (const k of Object.keys(cfg)) if (!(k in out)) out[k] = cfg[k];
  return out;
}

// Esempio con dati finti ("demo: true" senza entità): anteprima nella scelta delle card
const PDC_DEMO = {
  fv_potenza: ['sensor', 3.2, 'kW'],
  inverter_1_potenza: ['sensor', 1.3, 'kW'],
  inverter_2_potenza: ['sensor', 1.9, 'kW'],
  batteria_livello: ['sensor', 78, '%'],
  batteria_potenza: ['sensor', -0.6, 'kW'],
  rete_potenza: ['sensor', 0.02, 'kW'],
  casa_potenza: ['sensor', 2.62, 'kW'],
  rete_stato: ['binary_sensor', 'on'],
  u_pdc: ['sensor', 1.8, 'kW'],
  u_autoclave: ['sensor', 450, 'W'],
  u_lavatrice: ['sensor', 0.12, 'kW'],
  temperatura_esterna: ['sensor', 6.5, '°C'],
  pdc_potenza: ['sensor', 1.8, 'kW'],
  riscaldamento: ['binary_sensor', 'on'],
  raffrescamento: ['binary_sensor', 'off'],
  acs_potenza: ['sensor', 0, 'kW'],
  pdc_mandata: ['sensor', 36.5, '°C'],
  pdc_ritorno: ['sensor', 31.2, '°C'],
  acs_temperatura: ['sensor', 49.5, '°C'],
  acs_setpoint: ['sensor', 52, '°C'],
  accumulo_temperatura: ['sensor', 34, '°C'],
  accumulo_ingresso: ['sensor', 35.8, '°C'],
  accumulo_setpoint: ['sensor', 35, '°C'],
  circolatore: ['binary_sensor', 'on'],
  pavimento_mandata: ['sensor', 33.5, '°C'],
  pavimento_ritorno: ['sensor', 29, '°C'],
  acqua_valvola: ['switch', 'on'],
  acqua_portata: ['sensor', 8.4, 'L/min'],
  acqua_oggi: ['sensor', 186, 'L'],
  ricircolo: ['switch', 'on'],
  autoclave_velocita: ['sensor', 3780, 'rpm'],
  autoclave_pressione: ['sensor', 2.9, 'bar'],
  autoclave_portata: ['sensor', 7.9, 'L/min'],
  autoclave_stato: ['sensor', 'In funzione'],
};
const PDC_DEMO_ENT = {};
const PDC_DEMO_STATES = {};
for (const [k, [dom, state, unit]] of Object.entries(PDC_DEMO)) {
  const id = `${dom}.pdc_esempio_${k}`;
  if (!k.startsWith('u_')) PDC_DEMO_ENT[k] = id;
  PDC_DEMO_STATES[id] = { entity_id: id, state: String(state), attributes: unit ? { unit_of_measurement: unit } : {} };
}
const PDC_DEMO_UTENZE = [
  { entity: 'sensor.pdc_esempio_u_pdc', nome: 'Pompa di calore', icona: 'mdi:heat-pump' },
  { entity: 'sensor.pdc_esempio_u_autoclave', nome: 'Autoclave', icona: 'mdi:water-pump' },
  { entity: 'sensor.pdc_esempio_u_lavatrice', nome: 'Lavatrice', icona: 'mdi:washing-machine' },
];

// Utenze elettriche: colori predefiniti, a rotazione
const PDC_U_COLORS = ['#d0cc5b', '#964cb5', '#b54c9d', '#5bd0cc', '#e57373', '#81c784', '#64b5f6', '#ffb74d'];
// Icona di riserva (mdi:flash) se l'icona di Home Assistant non si può caricare
const PDC_ICON_FALLBACK = 'M7,2V13H10V22L17,10H13L17,2H7Z';
const PDC_ICON_CACHE = new Map();

// Legge il disegno di un'icona mdi da <ha-icon> di Home Assistant (null se non disponibile)
function pdcLoadIcon(icon) {
  if (!icon) return Promise.resolve(null);
  if (PDC_ICON_CACHE.has(icon)) return PDC_ICON_CACHE.get(icon);
  const p = new Promise((resolve) => {
    const start = () => {
      const el = document.createElement('ha-icon');
      el.style.cssText = 'position:absolute;left:-9999px;top:0;width:24px;height:24px;visibility:hidden;pointer-events:none';
      el.icon = icon;
      document.body.appendChild(el);
      let n = 0;
      const tick = () => {
        const svgIcon = el.shadowRoot && el.shadowRoot.querySelector('ha-svg-icon');
        const path = el._path || (svgIcon && svgIcon.path);
        if (path || ++n > 40) {
          el.remove();
          resolve(path || null);
        } else setTimeout(tick, 75);
      };
      tick();
    };
    if (customElements.get('ha-icon')) start();
    else {
      const t = setTimeout(() => resolve(null), 3000);
      customElements.whenDefined('ha-icon').then(() => {
        clearTimeout(t);
        start();
      });
    }
  });
  PDC_ICON_CACHE.set(icon, p);
  return p;
}

// Utenze dalla configurazione (accetta anche le chiavi di power-flow-card-plus)
function pdcUtenze(config) {
  const list = Array.isArray(config.utenze) ? config.utenze : [];
  return list
    .filter((u) => u && typeof u === 'object' && u.entity)
    .map((u) => ({
      entity: String(u.entity),
      nome: u.nome !== undefined ? u.nome : u.name,
      icona: u.icona || u.icon,
      colore: u.colore !== undefined ? u.colore : u.color,
      nascondi: u.nascondi_a_zero !== undefined ? !!u.nascondi_a_zero : u.display_zero === false,
      soglia: u.soglia !== undefined ? u.soglia : u.display_zero_tolerance,
      unita: u.unita || u.unit_of_measurement,
    }));
}

const PDC_COL = {
  heat: '#ff7043',
  acs: '#ff5252',
  cool: '#42a5f5',
  cold: '#4fc3f7',
  open: '#66bb6a',
  closed: '#ef5350',
  solar: '#ff9800',
  batt: '#f06292',
  gridIn: '#488fc2',
  gridOut: '#a280db',
  home: '#4db6ac',
  island: '#ffa726',
};

// Colori del tema di Home Assistant (con il valore predefinito come riserva)
const PDC_THEME = {
  primary: '#03a9f4', accent: '#ff9800', red: '#f44336', pink: '#e91e63', purple: '#926bc7',
  'deep-purple': '#6e41ab', indigo: '#3f51b5', blue: '#2196f3', 'light-blue': '#03a9f4',
  cyan: '#00bcd4', teal: '#009688', green: '#4caf50', 'light-green': '#8bc34a', lime: '#cddc39',
  yellow: '#ffeb3b', amber: '#ffc107', orange: '#ff9800', 'deep-orange': '#ff6f22',
  brown: '#795548', 'light-grey': '#bdbdbd', grey: '#9e9e9e', 'dark-grey': '#606060',
  'blue-grey': '#607d8b', black: '#000000', white: '#ffffff', disabled: '#bdbdbd',
};

function pdcCustomColor(v) {
  if (v === undefined || v === null || v === '') return null;
  if (Array.isArray(v) && v.length >= 3) return `rgb(${v[0]}, ${v[1]}, ${v[2]})`;
  const s = String(v).trim();
  if (['none', 'state', 'default', 'auto'].includes(s)) return null;
  if (PDC_THEME[s]) return `var(--${s}-color, ${PDC_THEME[s]})`;
  return s;
}

// Temperature con scala colori propria (sezione "temperature:")
const PDC_TEMPS = ['esterno', 'mandata', 'ritorno', 'ingresso_accumulo', 'bollitore', 'accumulo', 'pavimento'];
const PDC_TEMP_RANGE = { esterno: [-5, 35] }; // le altre: 10–55 °C

// Colore in base alla temperatura: celeste (min) → viola → rosa → rosso (max)
// Colore della batteria in base alla carica: rosso (min) → arancio → giallo → verde brillante (max)
function pdcSocColor(soc, min = 0, max = 100) {
  if (soc === null || soc === undefined || isNaN(soc)) return null;
  const span = max > min ? max - min : 100;
  const k = Math.min(1, Math.max(0, (soc - min) / span));
  return `hsl(${Math.round(k * 125)}, 90%, ${Math.round(56 - k * 8)}%)`;
}

function pdcTempColor(t, min = 10, max = 55) {
  if (t === null || t === undefined || isNaN(t)) return null;
  const span = max > min ? max - min : 45;
  const k = Math.min(1, Math.max(0, (t - min) / span));
  const hue = Math.round(207 + k * 153) % 360;
  return `hsl(${hue}, 85%, 62%)`;
}

// I tubi passano sotto i componenti: se un componente sparisce, la linea resta continua
const PDC_FLOWS = {
  // impianto
  s1: 'M108 78 H200',
  coil: 'M200 78 H372 A5 5 0 0 1 372 88 H290 A5 5 0 0 0 290 98 H372 A5 5 0 0 1 372 108 H258',
  r2a: 'M258 108 H236',
  r2b: 'M236 108 H206 A6 6 0 0 0 194 108 H108',
  s3: 'M200 78 V196',
  r3: 'M236 196 V108',
  fs: 'M156 214 H82',
  floor: 'M82 214 H32 A8 8 0 0 0 32 230 H68 A8 8 0 0 1 68 246 H32 A8 8 0 0 0 32 262 H82',
  fr: 'M82 262 H156',
  // acqua
  wa: 'M44 470 H181',
  wb: 'M181 470 H331',
  wout: 'M331 470 H366',
  whot: 'M331 230 V426',
};

// Sezione energia: altezza minima e posizione delle utenze
const PDC_EH = 300;
// Utenze: cerchio con icona e valore dentro, nome a destra
const PDC_U = { icon: 318, r: 19, text: 345, row: 46, bus: 180 };
// Posizioni (centri) di rete, fotovoltaico/batteria e casa: con le utenze a destra, oppure su tutta la larghezza
const PDC_E_LAYOUT = { utenze: { gx: 50, sx: 150, hx: 250 }, pieno: { gx: 56, sx: 210, hx: 362 } };
// Linee dell'energia: ogni punto è collegato direttamente agli altri
const PDC_E_FLOWS = ['e_fv', 'e_inv1a', 'e_inv1b', 'e_inv2a', 'e_inv2b', 'e_sg', 'e_sh', 'e_sb', 'e_gh', 'e_gb', 'e_bh'];
const pdcFlowE = (id) => `<g class="flow thin" id="f-${id}"><path class="pipe" d=""/><path class="dots" d=""/></g>`;
function pdcEnergyPaths({ gx, sx, hx }) {
  const bx = sx;
  return {
    e_fv: `M${sx} 74 V134`,
    e_inv1a: `M${sx - 30} 74 V88`,
    e_inv2a: `M${sx + 30} 74 V88`,
    e_inv1b: `M${sx - 30} 122 C${sx - 30} 130 ${sx - 12} 134 ${sx} 134`,
    e_inv2b: `M${sx + 30} 122 C${sx + 30} 130 ${sx + 12} 134 ${sx} 134`,
    e_sg: `M${sx - 6} 134 C${sx - 6} 162 ${gx + 56} 168 ${gx + 24} 168`,
    e_sh: `M${sx + 6} 134 C${sx + 6} 162 ${hx - 58} 168 ${hx - 26} 168`,
    e_sb: `M${sx} 134 V212`,
    e_gh: `M${gx + 24} 180 H${hx - 26}`,
    e_gb: `M${gx + 24} 192 C${gx + 64} 192 ${bx - 47} 250 ${bx - 25} 250`,
    e_bh: `M${bx + 25} 250 C${bx + 47} 250 ${hx - 66} 192 ${hx - 26} 192`,
  };
}

const pdcFlow = (id) =>
  `<g class="flow" id="f-${id}"><path class="pipe" d="${PDC_FLOWS[id]}"/><path class="dots" d="${PDC_FLOWS[id]}"/></g>`;

const PDC_BLADE = 'M63 90 C57 81 60 69 70 66 C75 76 72 85 63 90 Z';
const PDC_IMP = 'M236 470 C233 466 234 461 238 459.5 C240.5 463.5 239.5 467.5 236 470 Z';

const PDC_SVG_ENERGY = `
<svg id="sv-e" x="0" y="0" width="420" height="${PDC_EH}" viewBox="0 0 420 ${PDC_EH}">
  <defs>
    <clipPath id="cp-batt"><rect x="-25" y="212" width="50" height="76" rx="7"/></clipPath>
  </defs>
  <text x="18" y="24" class="sec" id="n-sezione_energia">ENERGIA</text>

  ${PDC_E_FLOWS.map(pdcFlowE).join('')}
  <g id="g-uflows"></g>
  <circle id="jn-s" class="jn" cx="0" cy="134" r="3"/>

  <!-- Fotovoltaico: pannello con il valore dentro, e sole -->
  <g id="g-fv" class="clickable" data-key="fv_potenza|inverter_1_potenza|inverter_2_potenza">
    <circle class="sunc" cx="70" cy="24" r="7"/>
    <path class="rays" d="M70 11 V14 M70 34 V37 M57 24 H60 M80 24 H83 M60.8 14.8 L62.9 16.9 M77.1 31.1 L79.2 33.2 M60.8 33.2 L62.9 31.1 M77.1 16.9 L79.2 14.8"/>
    <path class="panel" d="M-52 74 L-40 32 H52 L40 74 Z"/>
    <path class="pgrid" d="M-21.3 74 L-9.3 32 M9.3 74 L21.3 32 M-46 53 H46"/>
    <text x="0" y="58" class="val c halo" id="t-fv">—</text>
    <text x="-60" y="58" class="lbl e" id="n-fotovoltaico">Fotovoltaico</text>
  </g>

  <!-- Inverter: valore dentro -->
  <g id="g-inv1" class="clickable" data-key="inverter_1_potenza">
    <rect class="box" x="-26" y="88" width="52" height="34" rx="8"/>
    <path class="isym" d="M-18 94 H-10 M-18 97.5 H-10 M-5 95.75 H4 M1 93.25 L4 95.75 L1 98.25 M9 96.5 q2 -3.5 4 0 t4 0"/>
    <text x="0" y="116" class="tv c" id="t-inv1">—</text>
    <text x="-32" y="109" class="lbl e" id="n-inverter_1">Inverter 1</text>
  </g>
  <g id="g-inv2" class="clickable" data-key="inverter_2_potenza">
    <rect class="box" x="-26" y="88" width="52" height="34" rx="8"/>
    <path class="isym" d="M-18 94 H-10 M-18 97.5 H-10 M-5 95.75 H4 M1 93.25 L4 95.75 L1 98.25 M9 96.5 q2 -3.5 4 0 t4 0"/>
    <text x="0" y="116" class="tv c" id="t-inv2">—</text>
    <text x="32" y="109" class="lbl" id="n-inverter_2">Inverter 2</text>
  </g>

  <!-- Rete: traliccio senza riquadro; cavi e scintilla animati solo quando la casa preleva -->
  <g id="g-grid" class="clickable" data-key="rete_potenza|rete_stato">
    <rect class="hit" x="-44" y="-36" width="70" height="70"/>
    <path class="gwire" d="M-44 -12 Q-32 -6 -20 -18 M-44 -2 Q-30 3 -16 -8"/>
    <path class="tower" d="M0 -30 L-18 30 M0 -30 L18 30 M-20 -22 H20 M-16 -12 H16 M-6 -10 L9.6 2 M6 -10 L-9.6 2 M-22 30 H22"/>
    <path class="ins" d="M-20 -22 v4 M20 -22 v4 M-16 -12 v4 M16 -12 v4"/>
    <path class="gspark" d="M27 -38 L22 -30 H26 L24 -23 L30 -32 H26 Z"/>
    <text x="0" y="20" class="tv c halo" id="t-grid">—</text>
    <text x="0" y="46" class="lbl c" id="n-rete_elettrica">Rete</text>
    <text x="0" y="58" class="lbl c xs" id="t-grid-dir"></text>
  </g>

  <!-- Casa: senza riquadro, valore dentro -->
  <g id="g-casa" class="clickable" data-key="casa_potenza">
    <rect class="hit" x="-32" y="-34" width="64" height="64"/>
    <path class="roof" d="M-30 -6 L0 -32 L30 -6 Z"/>
    <path class="ico2" d="M17 -17.3 V-28 H22 V-12.9 M-24 -6 V28 H24 V-6"/>
    <text x="0" y="17" class="val c" id="t-casa">—</text>
    <text x="0" y="46" class="lbl c" id="n-casa">Casa</text>
  </g>

  <!-- Batteria (sotto): carica e potenza dentro -->
  <g id="g-batt" class="clickable" data-key="batteria_livello|batteria_potenza">
    <!-- batteria domestica a lastra: niente simboli, una striscia luminosa sul lato -->
    <rect class="tank" x="-25" y="212" width="50" height="76" rx="7"/>
    <rect id="fill-batt" class="fill" clip-path="url(#cp-batt)" x="-25" y="288" width="50" height="0"/>
    <rect class="bbevel" x="-21" y="216" width="42" height="68" rx="4.5"/>
    <rect class="tank-o" x="-25" y="212" width="50" height="76" rx="7"/>
    <rect class="bled" id="b-led" x="17.5" y="224" width="2.6" height="52" rx="1.3"/>
    <text x="-2" y="252" class="mval c halo" id="t-soc"></text>
    <text x="-2" y="268" class="tv c xs halo" id="t-batt">—</text>
    <text x="-33" y="266" class="lbl e" id="n-batteria">Batteria</text>
    <text x="-33" y="279" class="lbl e xs" id="t-batt-dir"></text>
  </g>

  <g id="g-utenze"></g>

  <line class="div" id="div-e" x1="18" y1="${PDC_EH - 1}" x2="406" y2="${PDC_EH - 1}"/>
</svg>`;

const PDC_SVG = `
<svg class="root" viewBox="0 0 420 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schema energia, pompa di calore e acqua sanitaria">
${PDC_SVG_ENERGY}
<svg id="sv-m" x="0" y="0" width="420" height="540" viewBox="0 0 420 540">
  <defs>
    <clipPath id="cp-boiler"><rect x="258" y="50" width="146" height="180" rx="24"/></clipPath>
    <clipPath id="cp-accu"><rect x="156" y="196" width="88" height="80" rx="18"/></clipPath>
    <clipPath id="cp-puffer"><rect x="164" y="404" width="34" height="88" rx="14"/></clipPath>
  </defs>

  <!-- ===== SEZIONE IMPIANTO ===== -->
  <text x="18" y="24" class="sec" id="n-sezione_impianto">IMPIANTO</text>
  <g id="g-ext" class="clickable" data-key="temperatura_esterna" transform="translate(140 -3)">
    <path class="ico" d="M21.5 22.5 V11.5 a2.5 2.5 0 0 1 5 0 V22.5 a4.5 4.5 0 1 1 -5 0 Z"/>
    <circle class="ico-fill" cx="24" cy="26.5" r="2"/>
    <text x="34" y="27" class="val"><tspan id="t-ext">—</tspan><tspan class="lbl" dx="5" id="n-esterno">esterno</tspan></text>
  </g>
  <text x="210" y="96" class="lbl c" id="t-empty">Scegli le entità dall'editor della card</text>

  <line class="div" id="div-a" x1="18" y1="316" x2="406" y2="316"/>

  <!-- Bollitore -->
  <g id="g-boiler" class="clickable" data-key="acs_temperatura">
    <rect class="tank" x="258" y="50" width="146" height="180" rx="24"/>
    <rect id="fill-boiler" class="fill" clip-path="url(#cp-boiler)" x="258" y="230" width="146" height="0"/>
    <rect class="tank-o" x="258" y="50" width="146" height="180" rx="24"/>
    <text x="331" y="172" class="big c" id="t-boiler">—</text>
    <text x="331" y="189" class="lbl c sm" id="n-bollitore">Bollitore</text>
  </g>
  <g id="g-boil-sp" class="clickable" data-key="acs_setpoint">
    <text x="331" y="205" class="lbl c xs"><tspan id="n-setpoint">setpoint</tspan><tspan dx="4" id="t-boil-sp">—</tspan></text>
  </g>

  <!-- Accumulo -->
  <g id="g-accu" class="clickable" data-key="accumulo_temperatura">
    <rect class="tank" x="156" y="196" width="88" height="80" rx="18"/>
    <rect id="fill-accu" class="fill" clip-path="url(#cp-accu)" x="156" y="276" width="88" height="0"/>
    <rect class="tank-o" x="156" y="196" width="88" height="80" rx="18"/>
    <text x="200" y="241" class="big c" id="t-accu">—</text>
    <text x="200" y="258" class="lbl c sm" id="n-accumulo">Accumulo</text>
  </g>
  <g id="g-accu-sp" class="clickable" data-key="accumulo_setpoint">
    <text x="200" y="271" class="lbl c xs"><tspan id="n-setpoint2">setpoint</tspan><tspan dx="4" id="t-accu-sp">—</tspan></text>
  </g>

  <!-- Pavimento -->
  <g id="g-floor" class="clickable" data-key="pavimento_mandata|pavimento_ritorno|circolatore">
    <rect class="tank" x="18" y="196" width="64" height="80" rx="10"/>
    <rect class="tank-o" x="18" y="196" width="64" height="80" rx="10"/>
  </g>
  <text x="50" y="189" class="lbl c" id="n-pavimento">Pavimento</text>
  <g id="g-ftemps" class="clickable" data-key="pavimento_mandata|pavimento_ritorno">
    <text x="50" y="292" class="c"><tspan id="t-fm" class="tv">—</tspan><tspan class="lbl"> / </tspan><tspan id="t-fr" class="tv">—</tspan></text>
    <text x="50" y="305" class="lbl c xs" id="n-pav_mr">mandata / ritorno</text>
  </g>

  <!-- Tubi impianto -->
  ${pdcFlow('s1')}
  ${pdcFlow('coil')}
  ${pdcFlow('r2a')}
  ${pdcFlow('r2b')}
  ${pdcFlow('s3')}
  ${pdcFlow('r3')}
  ${pdcFlow('fs')}
  ${pdcFlow('floor')}
  ${pdcFlow('fr')}
  <circle id="jn" class="jn" cx="236" cy="108" r="3.2"/>

  <!-- Pompa di calore -->
  <g id="g-pdc" class="clickable" data-key="pdc_potenza">
    <rect class="box" x="18" y="36" width="90" height="124" rx="12"/>
    <circle class="ring" cx="63" cy="90" r="28"/>
    <g class="fan">
      <path class="blade" d="${PDC_BLADE}"/>
      <path class="blade" d="${PDC_BLADE}" transform="rotate(120 63 90)"/>
      <path class="blade" d="${PDC_BLADE}" transform="rotate(240 63 90)"/>
    </g>
    <circle class="hub" cx="63" cy="90" r="4"/>
    <!-- icona della funzione attiva: riscaldamento, raffrescamento, acqua sanitaria -->
    <path class="pmi" id="pm-heat" transform="translate(98 64)" d="M0.6 -7 C1.2 -4 4.4 -2.4 4.4 1.8 A4.4 4.6 0 0 1 -4.4 1.8 C-4.4 -1 -2.6 -2.2 -2.1 -4.4 C-1.3 -2.7 -0.6 -2.2 0 -2 C0.7 -3.8 0.4 -5.4 0.6 -7 Z"/>
    <path class="pms" id="pm-cool" transform="translate(98 64)" d="M0 -7 V7 M-6.1 -3.5 L6.1 3.5 M-6.1 3.5 L6.1 -3.5 M-2 -6 L0 -4 L2 -6 M-2 6 L0 4 L2 6 M-6.2 -1.2 L-3.5 -2 L-4.2 -4.6 M6.2 1.2 L3.5 2 L4.2 4.6 M-6.2 1.2 L-3.5 2 L-4.2 4.6 M6.2 -1.2 L3.5 -2 L4.2 -4.6"/>
    <path class="pmi" id="pm-acs" transform="translate(98 64)" d="M0 -7 C2.6 -3.4 4.6 -0.8 4.6 2.2 A4.6 4.6 0 0 1 -4.6 2.2 C-4.6 -0.8 -2.6 -3.4 0 -7 Z"/>
    <line class="leg" x1="30" y1="161" x2="30" y2="167"/>
    <line class="leg" x1="96" y1="161" x2="96" y2="167"/>
    <text x="63" y="51" class="lbl c sm" id="n-pompa_di_calore">Pompa di calore</text>
    <text x="63" y="138" class="val c" id="t-pdc-pow">—</text>
    <text x="63" y="152" class="lbl c xs" id="t-pdc-mode">—</text>
  </g>

  <!-- Valvola 3 vie -->
  <g id="g-v3v" class="clickable" data-key="acs_potenza|acs_attiva">
    <path id="v-in" class="vt" d="M189 72 V84 L200 78 Z"/>
    <path id="v-acs" class="vt" d="M211 72 V84 L200 78 Z"/>
    <path id="v-imp" class="vt" d="M194 89 H206 L200 78 Z"/>
  </g>
  <text x="187" y="99" class="lbl e xs" id="n-valvola_3_vie">3 vie</text>

  <!-- Circolatore pavimento -->
  <g id="g-pump" class="pump clickable" data-key="circolatore">
    <circle class="pring" cx="121" cy="214" r="11"/>
    <path class="ptri" d="M126 208 L114 214 L126 220 Z"/>
  </g>
  <text x="121" y="240" class="lbl c xs" id="n-circolatore">Circolatore</text>

  <!-- Temperature sulle linee -->
  <text x="148" y="70" class="c" id="g-mand-lbl"><tspan class="lbl" id="n-mandata">mandata </tspan><tspan id="t-mand" class="tv">—</tspan></text>
  <text x="151" y="124" class="c" id="g-rit-lbl"><tspan class="lbl" id="n-ritorno">ritorno </tspan><tspan id="t-rit" class="tv">—</tspan></text>
  <g id="g-accu-in" class="clickable" data-key="accumulo_ingresso">
    <text x="193" y="150" class="lbl e xs" id="n-ingresso_accumulo">ingresso</text>
    <text x="193" y="163" class="e"><tspan id="t-accu-in" class="tv">—</tspan></text>
  </g>

  <!-- ===== SEZIONE ACQUA SANITARIA ===== -->
  <text x="18" y="340" class="sec" id="n-sezione_acqua">ACQUA SANITARIA</text>
  ${pdcFlow('whot')}

  <!-- Contenuto dell'acqua spostato 44 più in alto (stesse coordinate di prima) -->
  <svg id="sv-w" x="0" y="-44" width="420" height="540" viewBox="0 0 420 540">
  ${pdcFlow('wa')}
  ${pdcFlow('wb')}
  ${pdcFlow('wout')}
  <circle id="jn-w" class="jn" cx="331" cy="470" r="3.2"/>

  <!-- Ricircolo: pompa sulla linea che scende dal bollitore -->
  <g id="g-rpump" class="pump clickable" data-key="ricircolo">
    <circle class="pring" cx="331" cy="400" r="11"/>
    <path class="ptri" d="M325 395 L331 406 L337 395 Z"/>
  </g>
  <text x="348" y="404" class="lbl xs" id="n-ricircolo">Ricircolo</text>

  <!-- Rete -->
  <g id="g-rete">
    <rect class="box" x="16" y="456" width="28" height="28" rx="8"/>
    <path class="drop" d="M30 461 C33.5 465.5 36 468.5 36 472 A6 6 0 0 1 24 472 C24 468.5 26.5 465.5 30 461 Z"/>
  </g>
  <text x="30" y="506" class="lbl c" id="n-rete">Rete</text>

  <!-- Stop acqua -->
  <g id="g-stop" class="clickable" data-key="acqua_valvola|acqua_stop">
    <path class="valve" d="M54 463 L74 477 V463 L54 477 Z"/>
    <path class="stem" d="M64 470 V458 M59 458 H69"/>
    <text x="64" y="506" class="lbl c" id="n-stop">Stop</text>
    <text x="64" y="519" class="tv c xs" id="t-stop">—</text>
  </g>

  <!-- Contatore -->
  <g id="g-meter" class="clickable" data-key="acqua_portata|acqua_totale|acqua_oggi">
    <circle class="box" cx="118" cy="470" r="22"/>
    <circle class="mring" cx="118" cy="470" r="18"/>
    <text x="118" y="474" class="mval c" id="t-lpm">—</text>
    <text x="118" y="484" class="lbl c xs">L/min</text>
    <text x="118" y="506" class="lbl c" id="n-contatore">Contatore</text>
    <text x="118" y="519" class="lbl c xs" id="t-oggi"></text>
  </g>

  <!-- Puffer -->
  <g id="g-puffer">
    <rect class="tank" x="164" y="404" width="34" height="88" rx="14"/>
    <rect id="fill-puffer" class="fill" clip-path="url(#cp-puffer)" x="164" y="426" width="34" height="66"/>
    <rect class="tank-o" x="164" y="404" width="34" height="88" rx="14"/>
    <text x="181" y="506" class="lbl c" id="n-puffer">Puffer</text>
  </g>

  <!-- Autoclave -->
  <g id="g-auto" class="clickable" data-key="autoclave_comando|autoclave_velocita|autoclave_portata|autoclave_pressione|autoclave_stato">
    <rect class="box" x="218" y="452" width="36" height="36" rx="9"/>
    <g class="imp">
      <path class="blade" d="${PDC_IMP}"/>
      <path class="blade" d="${PDC_IMP}" transform="rotate(90 236 470)"/>
      <path class="blade" d="${PDC_IMP}" transform="rotate(180 236 470)"/>
      <path class="blade" d="${PDC_IMP}" transform="rotate(270 236 470)"/>
    </g>
    <circle class="hub" cx="236" cy="470" r="2.5"/>
    <text x="236" y="506" class="lbl c" id="n-autoclave">Autoclave</text>
    <text x="236" y="519" class="tv c xs" id="t-ac-rpm">—</text>
    <text x="236" y="532" class="lbl c xs" id="t-ac-bar"></text>
  </g>

  <!-- Rubinetto: unica uscita, calda o fredda non si può sapere -->
  <g id="g-tap">
    <rect class="box" x="366" y="450" width="40" height="40" rx="10"/>
    <path class="ico2" d="M375 464 V474 M375 467 H389 A5 5 0 0 1 394 472 V474 M375 471 H388 A2 2 0 0 1 390 473 V474 M383 467 V462 M380 462 H386"/>
    <path class="drip" d="M392 478 C393.5 480 394 481 394 482 A2 2 0 0 1 390 482 C390 481 390.5 480 392 478 Z"/>
  </g>
  <text x="386" y="506" class="lbl c" id="n-rubinetto">Acqua</text>
  </svg>
</svg>
</svg>`;

const PDC_CSS = `
  :host {
    --pdc-bg: var(--ha-card-background, var(--card-background-color, #1c1c1c));
    --pdc-idle: var(--disabled-text-color, #6f7378);
  }
  ha-card { padding: 12px 10px 8px; overflow: hidden; }
  .wrap { width: 100%; }
  svg.root { display: block; width: 100%; height: auto; font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, sans-serif)); }
  .clickable { cursor: pointer; }
  .hidden { display: none; }

  .val  { fill: var(--primary-text-color); font-size: 13px; font-weight: 600; }
  .big  { fill: var(--primary-text-color); font-size: 19px; font-weight: 600; }
  .mval { fill: var(--primary-text-color); font-size: 15px; font-weight: 600; }
  .lbl  { fill: var(--secondary-text-color); font-size: 10.5px; font-weight: 400; }
  .sm   { font-size: 10px; }
  .xs   { font-size: 9.5px; }
  .sec  { fill: var(--secondary-text-color); font-size: 10px; font-weight: 600; letter-spacing: 1.4px; }
  .tv   { font-size: 11px; font-weight: 600; fill: var(--primary-text-color); }
  .c { text-anchor: middle; }
  .e { text-anchor: end; }

  .box    { fill: var(--pdc-bg); stroke: var(--c, var(--pdc-idle)); stroke-width: 2; transition: stroke .5s; }
  .ring   { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.4; opacity: .55; }
  .blade  { fill: var(--c, var(--pdc-idle)); fill-opacity: .28; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.4; stroke-linejoin: round; }
  .hub    { fill: var(--c, var(--pdc-idle)); }
  .leg    { stroke: var(--c, var(--pdc-idle)); stroke-width: 2.5; stroke-linecap: round; }
  .fan    { transform-box: view-box; transform-origin: 63px 90px; }
  .run .fan { animation: pdc-spin 1s linear infinite; }
  .imp      { transform-box: view-box; transform-origin: 236px 470px; }
  .run .imp { animation: pdc-spin var(--spin, .6s) linear infinite; }
  #fill-puffer { fill: var(--c, var(--pdc-idle)); fill-opacity: .18; }

  .tank   { fill: var(--pdc-bg); }
  .tank-o { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 2; transition: stroke .5s; }
  .fill   { fill: var(--pdc-idle); fill-opacity: .22; }

  .vt      { fill: var(--pdc-bg); stroke: var(--c, var(--pdc-idle)); stroke-width: 1.6; stroke-linejoin: round; }
  .vt.open { fill: var(--c, var(--pdc-idle)); }

  .pring { fill: var(--pdc-bg); stroke: var(--c, var(--pdc-idle)); stroke-width: 2; }
  .ptri  { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.5; stroke-linejoin: round; }
  .run .ptri  { fill: var(--c); }
  .run .pring { animation: pdc-pulse 1.6s ease-in-out infinite; }

  .ico      { fill: none; stroke: var(--c, var(--secondary-text-color)); stroke-width: 1.4; }
  .ico-fill { fill: var(--c, var(--secondary-text-color)); }
  .ico2     { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  .drop     { fill: var(--c, var(--pdc-idle)); fill-opacity: .35; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.5; }
  .drip     { fill: var(--c, var(--pdc-idle)); opacity: 0; transition: opacity .4s; }
  .run .drip { opacity: 1; }
  .valve    { fill: var(--c, var(--pdc-idle)); fill-opacity: 1; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.5; stroke-linejoin: round; }
  .stem     { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.6; stroke-linecap: round; }
  .mring    { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1; stroke-dasharray: 2 3; opacity: .6; }
  .div      { stroke: var(--divider-color, rgba(127,127,127,.25)); stroke-width: 1; }
  .jn       { fill: var(--c, var(--pdc-idle)); }
  .panel    { fill: var(--c, var(--pdc-idle)); fill-opacity: .18; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.6; stroke-linejoin: round; }
  .bolt     { fill: var(--c, var(--pdc-idle)); fill-opacity: .3; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.5; stroke-linejoin: round; }
  .bterm    { fill: var(--c, var(--pdc-idle)); }
  #fill-batt { fill-opacity: .4; }
  .ubox { fill: var(--pdc-bg); stroke: var(--c, var(--pdc-idle)); stroke-width: 2; transition: stroke .5s; }
  .pgrid { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.2; opacity: .8; }
  .sunc  { fill: var(--c, var(--pdc-idle)); fill-opacity: .35; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.5; transition: fill-opacity .5s; }
  .rays  { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.8; stroke-linecap: round; opacity: .35;
           transform-box: fill-box; transform-origin: center; transition: opacity .5s; }
  .thin .pipe { stroke-width: 1.4; }
  .thin .dots { stroke-width: 4.5; }
  .halo { paint-order: stroke; stroke: var(--pdc-bg); stroke-width: 3px; stroke-linejoin: round; }
  .hit  { fill: transparent; stroke: none; }
  .gwire { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.3; stroke-linecap: round; stroke-dasharray: 3 4; opacity: .5; }
  .run .gwire { opacity: 1; animation: pdc-wire .7s linear infinite; }
  .gspark { fill: var(--c, var(--pdc-idle)); opacity: 0; }
  .run .gspark { animation: pdc-blink 1.1s ease-in-out infinite; }
  @keyframes pdc-wire  { to { stroke-dashoffset: -7; } }
  @keyframes pdc-blink { 0%, 100% { opacity: .15; } 50% { opacity: 1; } }
  .run .rays { opacity: 1; animation: pdc-spin 14s linear infinite; }
  .run .sunc { fill-opacity: .8; }
  .isym  { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
  .tower { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  .ins   { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 2.6; stroke-linecap: round; }
  .roof  { fill: var(--c, var(--pdc-idle)); fill-opacity: .28; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.6; stroke-linejoin: round; }
  .win   { fill: var(--c, var(--pdc-idle)); fill-opacity: 0; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.2; transition: fill-opacity .5s; }
  .run .win { fill-opacity: .7; }
  .pmi  { fill: var(--c, var(--pdc-idle)); }
  .pms  { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
  .pmi.dim, .pms.dim { opacity: .4; }
  .bled { fill: var(--c, var(--pdc-idle)); opacity: .35; transition: opacity .5s; }
  .bled.on { opacity: 1; }
  .bbevel { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 1; opacity: .25; }
  .flow.thin { transition: opacity .4s; }
  .flow.thin:not(.on) { opacity: 0; }
  .uico { fill: var(--c, var(--pdc-idle)); }

  .flow .pipe { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 2.2; stroke-linejoin: round; opacity: .3; transition: opacity .5s, stroke .5s; }
  .flow.on .pipe { opacity: .9; }
  .flow .dots { fill: none; stroke: var(--c, var(--pdc-idle)); stroke-width: 6; stroke-linecap: round; stroke-dasharray: 0.1 52; opacity: 0; transition: opacity .4s; }
  .flow.on .dots { opacity: 1; animation: pdc-flow var(--dur, 1.6s) linear infinite; }
  .flow.rev .dots { animation-direction: reverse; }

  @keyframes pdc-flow  { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -52.1; } }
  @keyframes pdc-spin  { to { transform: rotate(360deg); } }
  @keyframes pdc-pulse { 0%, 100% { stroke-width: 2; } 50% { stroke-width: 4; } }

  @media (prefers-reduced-motion: reduce) {
    .flow.on .dots, .run .fan, .run .imp, .run .pring, .run .rays, .run .gwire, .run .gspark { animation: none; }
  }
`;

class PdcFlowCard extends HTMLElement {
  setConfig(config) {
    if (!config || typeof config !== 'object') throw new Error('pdc-flow-card: configurazione non valida');
    this._config = { soglia_pdc: 0.1, soglia_acs: 0.1, soglia_energia: 0, ...config, entities: { ...(config.entities || {}) } };
    // Esempio: solo finché non c'è nessuna entità impostata
    this._demo = config.demo === true && !PDC_ENTITY_KEYS.some((k) => this._config.entities[k]) && !pdcUtenze(config).length;
    if (this._demo) {
      this._config.entities = { ...PDC_DEMO_ENT };
      this._config.utenze = PDC_DEMO_UTENZE;
    }
    // "gateway_stato_rete" (v0.14.0) = "rete_stato"
    if (this._config.entities.gateway_stato_rete && !this._config.entities.rete_stato) {
      this._config.entities.rete_stato = this._config.entities.gateway_stato_rete;
    }
    this._utenze = pdcUtenze(this._config);
    this._built = false;
    if (this._rawHass) this.hass = this._rawHass;
  }

  set hass(hass) {
    this._rawHass = hass;
    this._hass = this._demo ? { ...hass, states: PDC_DEMO_STATES } : hass;
    this._render();
  }

  getCardSize() {
    return Math.max(3, Math.round((this._vbH || 540) / 60));
  }

  static getStubConfig() {
    return { demo: true, entities: {} };
  }

  static getConfigElement() {
    return document.createElement('pdc-flow-card-editor');
  }

  // ---------- rendering ----------
  _render() {
    if (!this._config || !this._hass) return;
    if (!this._built) this._build();
    this._update();
  }

  _build() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const t = this._config.title ? String(this._config.title).replace(/[<>&"]/g, '') : '';
    this.shadowRoot.innerHTML =
      `<style>${PDC_CSS}</style><ha-card${t ? ` header="${t}"` : ''}><div class="wrap">${PDC_SVG}</div></ha-card>`;
    this._buildUtenze();
    this._els = {};
    this.shadowRoot.querySelectorAll('[id]').forEach((el) => (this._els[el.id] = el));
    this._svg = this.shadowRoot.querySelector('svg');
    this._eH = null;
    this._svg.addEventListener('click', (ev) => this._click(ev));
    this._vbH = null;
    this._applyNames();
    this._built = true;
  }

  // Una riga per utenza: icona, nome, valore e i pallini dalla casa all'utenza
  _buildUtenze() {
    const U = PDC_U;
    const NS = 'http://www.w3.org/2000/svg';
    const rows = this.shadowRoot.getElementById('g-utenze');
    const flows = this.shadowRoot.getElementById('g-uflows');
    const mk = (tag, attrs, parent) => {
      const el = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      parent.appendChild(el);
      return el;
    };
    this._utenze.forEach((u, i) => {
      // linea dalla casa all'utenza: ognuna ha la sua, così ognuna ha la sua velocità
      const f = mk('g', { id: `f-u${i}`, class: 'flow thin' }, flows);
      mk('path', { class: 'pipe', d: '' }, f);
      mk('path', { class: 'dots', d: '' }, f);
      const g = mk('g', { id: `u${i}`, class: 'clickable', 'data-entity': u.entity }, rows);
      mk('circle', { class: 'ubox', cx: U.icon, cy: 0, r: U.r }, g);
      const k = 0.6;
      const ico = mk('path', { id: `u${i}-ico`, class: 'uico', d: PDC_ICON_FALLBACK, transform: `translate(${U.icon - 12 * k} ${-6 - 12 * k}) scale(${k})` }, g);
      const n = mk('text', { id: `u${i}-n`, class: 'lbl sm', x: U.text, y: 4 }, g);
      mk('text', { id: `u${i}-v`, class: 'tv xs c', x: U.icon, y: 13 }, g);
      const st = this._hass && this._hass.states[u.entity];
      let name = u.nome !== undefined && u.nome !== null ? String(u.nome) : (st && st.attributes.friendly_name) || u.entity;
      if (name.length > 15) name = name.slice(0, 14) + '…';
      n.textContent = name;
      const icon = u.icona || (st && st.attributes.icon);
      if (icon) pdcLoadIcon(icon).then((d) => d && ico.setAttribute('d', d));
    });
  }

  // Nomi personalizzati (sezione "nomi:")
  _applyNames() {
    const custom = this._config.nomi && typeof this._config.nomi === 'object' ? this._config.nomi : {};
    for (const k of Object.keys(custom)) {
      if (!(k in PDC_NOMI)) console.warn(`pdc-flow-card: nome "${k}" non riconosciuto. Chiavi valide: ${Object.keys(PDC_NOMI).join(', ')}`);
    }
    // Chiave assente = nome predefinito; stringa vuota = nessuna scritta
    const n = {};
    for (const k of Object.keys(PDC_NOMI)) {
      const v = custom[k];
      n[k] = v === undefined || v === null ? PDC_NOMI[k] : String(v);
    }
    for (const k of Object.keys(n)) {
      const el = this._els['n-' + k];
      if (!el) continue;
      let t = n[k];
      if (k.startsWith('sezione_')) t = t.toUpperCase();
      if (k === 'mandata' || k === 'ritorno') t = t ? t + ' ' : '';
      el.textContent = t;
    }
    if (this._els['n-pav_mr']) this._els['n-pav_mr'].textContent = [n.mandata, n.ritorno].filter(Boolean).join(' / ');
    if (this._els['n-setpoint2']) this._els['n-setpoint2'].textContent = n.setpoint;
    for (const id of ['t-boil-sp', 't-accu-sp']) if (this._els[id]) this._els[id].setAttribute('dx', n.setpoint ? '4' : '0');
  }

  _click(ev) {
    if (this._demo) return;
    const node = ev.composedPath().find((n) => n.getAttribute && (n.getAttribute('data-key') || n.getAttribute('data-entity')));
    if (!node) return;
    let id = node.getAttribute('data-entity');
    if (!id) {
      const key = node.getAttribute('data-key').split('|').find((k) => this._ids(k).length);
      id = key ? this._ids(key)[0] : null;
    }
    if (!id) return;
    const e = new Event('hass-more-info', { bubbles: true, composed: true });
    e.detail = { entityId: id };
    this.dispatchEvent(e);
  }


  // Autoclave bloccata: dal comando (select/switch) o dallo stato della pompa
  _acBlocked() {
    const c = this._config;
    const s = this._st('autoclave_comando');
    if (s) {
      const dom = s.entity_id ? s.entity_id.split('.')[0] : String(this._ids('autoclave_comando')[0]).split('.')[0];
      const st = String(s.state);
      if (dom === 'select') {
        if (st === (c.autoclave_opzione_blocca || 'Disabilita')) return true;
        if (st === (c.autoclave_opzione_sblocca || 'Abilita')) return false;
      } else if (st === 'off') return true;
      else if (st === 'on') return false;
    }
    const ps = this._st('autoclave_stato');
    return !!(ps && /disab/i.test(String(ps.state)));
  }

  // ---------- lettura stati ----------
  _ids(key) {
    const v = this._config.entities[key];
    if (!v) return [];
    return [].concat(v).filter(Boolean);
  }

  _has(key) {
    return this._ids(key).length > 0;
  }

  _st(key) {
    const id = this._ids(key)[0];
    return id ? this._hass.states[id] : undefined;
  }

  _num(key) {
    const s = this._st(key);
    if (!s) return null;
    const v = parseFloat(s.state);
    return isNaN(v) ? null : v;
  }

  // Setpoint: da un climate/water_heater (attributo temperature) o da un sensore numerico
  _setpoint(key) {
    const s = this._st(key);
    if (!s) return null;
    const id = s.entity_id || this._ids(key)[0] || '';
    const dom = id.split('.')[0];
    let v = ['climate', 'water_heater'].includes(dom) ? s.attributes.temperature : s.state;
    v = parseFloat(v);
    return isNaN(v) ? null : v;
  }

  _on(key) {
    const s = this._st(key);
    if (!s) return null;
    const st = String(s.state).toLowerCase();
    if (['unavailable', 'unknown', 'none', ''].includes(st)) return null;
    if (['on', 'open', 'opening', 'true', 'heat', 'heating', 'cool', 'cooling', 'active', 'running'].includes(st)) return true;
    const n = parseFloat(st);
    if (!isNaN(n)) return n > 0;
    return false;
  }

  _kw(key) {
    let tot = null;
    for (const id of this._ids(key)) {
      const s = this._hass.states[id];
      if (!s) continue;
      let v = parseFloat(s.state);
      if (isNaN(v)) continue;
      const u = String(s.attributes.unit_of_measurement || 'kW');
      if (u === 'W') v /= 1000;
      else if (u === 'MW') v *= 1000;
      tot = (tot || 0) + v;
    }
    return tot;
  }

  _lpm(key) {
    const s = this._st(key);
    if (!s) return null;
    let v = parseFloat(s.state);
    if (isNaN(v)) return null;
    const forced = this._config.acqua_portata_unita;
    const u = String((forced && forced !== 'auto' ? forced : null) || s.attributes.unit_of_measurement || 'L/min')
      .toLowerCase()
      .replace(/\s/g, '');
    if (u === 'l/h') v /= 60;
    else if (u === 'l/s') v *= 60;
    else if (u === 'gal/h') v = (v * 3.78541) / 60;
    else if (u === 'gal/min') v *= 3.78541;
    else if (u === 'm³/h' || u === 'm3/h') v = (v * 1000) / 60;
    else if (u === 'm³/min' || u === 'm3/min') v *= 1000;
    return Math.max(0, v);
  }

  // Formato dei numeri come nel profilo utente di HA
  _numberLocale() {
    const loc = this._hass.locale || {};
    const lang = loc.language || this._hass.language || 'it';
    switch (loc.number_format) {
      case 'comma_decimal': return ['en-US', {}];
      case 'decimal_comma': return ['de', {}];
      case 'space_comma': return ['fr', {}];
      case 'system': return [undefined, {}];
      case 'none': return ['en-US', { useGrouping: false }];
      default: return [lang, {}];
    }
  }

  // ---------- helper grafici ----------
  _flow(id, on, color, dur, rev = false) {
    const g = this._els['f-' + id];
    if (!g) return;
    g.classList.toggle('on', !!on);
    g.classList.toggle('rev', !!rev);
    if (color) g.style.setProperty('--c', color);
    else g.style.removeProperty('--c');
    // pallini distanziati il doppio: il giro dura il doppio, così la velocità resta la stessa
    const d = (Math.round(dur * 20) / 10).toFixed(1) + 's';
    if (g._dur !== d) {
      g.style.setProperty('--dur', d);
      g._dur = d;
    }
  }

  _color(id, color) {
    const el = this._els[id];
    if (!el) return;
    if (color) el.style.setProperty('--c', color);
    else el.style.removeProperty('--c');
  }

  _text(id, txt, color) {
    const el = this._els[id];
    if (!el) return;
    el.textContent = txt;
    if (color !== undefined) el.style.fill = color || '';
  }

  _fill(id, t, y0, h, color) {
    const el = this._els[id];
    if (!el) return;
    const k = t === null ? 0 : Math.min(1, Math.max(0, (t - 10) / 50));
    const fh = h * k;
    el.setAttribute('y', (y0 + h - fh).toFixed(1));
    el.setAttribute('height', fh.toFixed(1));
    el.style.fill = color || '';
  }

  _show(id, visible) {
    const el = this._els[id];
    if (el) el.classList.toggle('hidden', !visible);
  }

  _vis(ids, visible) {
    ids.forEach((id) => this._show(id, visible));
  }

  // ---------- aggiornamento ----------
  _update() {
    const c = this._config;
    const colori = c.colori && typeof c.colori === 'object' ? c.colori : {};
    const col = (k, fallback) => pdcCustomColor(colori[k]) || fallback;
    const [L, O] = this._numberLocale();
    const f1 = (v) => v.toLocaleString(L, { ...O, minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const f0 = (v) => Math.round(v).toLocaleString(L, { ...O, maximumFractionDigits: 0 });
    const fT = (v) => (v === null ? '—' : f1(v) + '°');
    const has = (k) => this._has(k);

    // ---- Quali componenti ci sono ----
    const PDC = has('pdc_potenza');
    const BOIL = has('acs_temperatura');
    const ACCU = has('accumulo_temperatura');
    const PUMP = has('circolatore');
    const FTEMPS = has('pavimento_mandata') || has('pavimento_ritorno');
    const FLOOR = PUMP || FTEMPS;
    const ACS_ENT = has('acs_potenza') || has('acs_attiva');
    const AC = has('autoclave_velocita') || has('autoclave_portata') || has('autoclave_stato') || has('autoclave_pressione');
    const PUFFER = AC || !!c.puffer;
    const METER = has('acqua_portata');
    const OGGI = has('acqua_totale') || has('acqua_oggi');
    const STOP = has('acqua_valvola') || has('acqua_stop');
    const RIC = has('ricircolo');
    const WATER = STOP || METER || OGGI || RIC || PUFFER;
    const ANY = PDC_MAIN_KEYS.some((k) => has(k));
    const INV1 = has('inverter_1_potenza');
    const INV2 = has('inverter_2_potenza');
    const FV = has('fv_potenza') || INV1 || INV2;
    const BATT = has('batteria_potenza') || has('batteria_livello');
    const GRID = has('rete_potenza');
    const HOME = has('casa_potenza');
    const EN = FV || BATT || GRID || HOME || has('rete_stato') || this._utenze.length > 0;
    const MAIN = ANY || !EN;

    // ---- Valori ----
    const tExt = this._num('temperatura_esterna');
    const pKw = this._kw('pdc_potenza');
    const acsKw = this._kw('acs_potenza');
    const tMand = this._num('pdc_mandata');
    const tRit = this._num('pdc_ritorno');
    const tAcs = this._num('acs_temperatura');
    const tAccu = this._num('accumulo_temperatura');
    const tAccuIn = this._num('accumulo_ingresso');
    const tFm = this._num('pavimento_mandata');
    const tFr = this._num('pavimento_ritorno');
    const heat = this._on('riscaldamento') === true;
    const cool = this._on('raffrescamento') === true;
    let acs = this._on('acs_attiva');
    if (acs === null) acs = acsKw !== null ? acsKw > c.soglia_acs : false;
    const running = pKw !== null ? pKw > c.soglia_pdc : acs;
    const pumpOn = this._on('circolatore') === true;
    const recOn = this._on('ricircolo') === true;
    const lpm = this._lpm('acqua_portata');

    let stopState = null; // true = chiusa
    if (has('acqua_valvola')) {
      const s = this._st('acqua_valvola');
      const st = s ? String(s.state).toLowerCase() : 'unavailable';
      if (['on', 'open', 'opening'].includes(st)) stopState = false;
      else if (['off', 'closed', 'closing'].includes(st)) stopState = true;
    } else if (has('acqua_stop')) {
      const s = this._st('acqua_stop');
      const st = s ? String(s.state).toLowerCase() : 'unavailable';
      if (['closed', 'closing', 'on'].includes(st)) stopState = true;
      else if (['open', 'opening', 'off'].includes(st)) stopState = false;
      if (stopState !== null && c.acqua_stop_invertito) stopState = !stopState;
    }
    const meterFlow = lpm !== null && lpm > 0.05 && stopState !== true;

    const acRpm = this._num('autoclave_velocita');
    const acLpm = this._num('autoclave_portata');
    const acBar = this._num('autoclave_pressione');
    let acRun = acRpm !== null ? acRpm > 0 : null;
    if (acRun === null) {
      const so = this._st('autoclave_stato');
      acRun = so ? /funzione|running|^on$/i.test(String(so.state)) : false;
    }
    const houseLpm = Math.max(meterFlow ? lpm : 0, acLpm || 0);
    const flowing = houseLpm > 0.05 || acRun;
    // Con l'autoclave: il contatore riempie il puffer; dal puffer al rubinetto solo quando l'autoclave è in funzione
    const AUTO = has('autoclave_velocita') || has('autoclave_stato') || has('autoclave_portata');
    const outFlow = AUTO ? !!acRun || (acLpm || 0) > 0.05 : flowing;
    const outLpm = AUTO ? acLpm || (acRun ? 5 : 0) : houseLpm;

    // ---- Colori (personalizzati o automatici) ----
    const COLD = col('acqua_fredda', PDC_COL.cold);
    // Scala per temperatura: intervallo da "temperature:" (min = celeste, max = rosso)
    const tcfg = c.temperature && typeof c.temperature === 'object' ? c.temperature : {};
    const tc = (key, t) => {
      const o = tcfg[key] || {};
      const d = PDC_TEMP_RANGE[key] || [10, 55];
      const mn = o.min !== undefined && o.min !== '' && !isNaN(o.min) ? Number(o.min) : d[0];
      const mx = o.max !== undefined && o.max !== '' && !isNaN(o.max) ? Number(o.max) : d[1];
      return pdcTempColor(t, mn, mx);
    };
    const colora = (key) => !!(tcfg[key] && tcfg[key].colora);
    const cExt = col('esterno', tc('esterno', tExt));
    const cMand = col('mandata', tc('mandata', tMand));
    const cRit = col('ritorno', tc('ritorno', tRit));
    const cAcs = col('bollitore', tc('bollitore', tAcs));
    const cAccu = col('accumulo', tc('accumulo', tAccu));
    const cAccuIn = col('ingresso_accumulo', tc('ingresso_accumulo', tAccuIn) || cMand);
    const floorCol = pdcCustomColor(colori.pavimento);
    const cFm = floorCol || tc('pavimento', tFm) || cAccu;
    const cFr = floorCol || tc('pavimento', tFr) || cFm;
    // Colore fisso di icone e disegni: vale sempre, anche quando il componente è fermo
    const fixed = (k) => pdcCustomColor(colori[k]);
    // Nome, valore e icona colorati con la temperatura (se l'opzione è attiva)
    const paint = (id, color) => {
      const el = this._els[id];
      if (el) el.style.fill = color || '';
    };

    // ---- Visibilità: un componente compare solo se ha la sua entità ----
    const showS1 = PDC && (BOIL || ACCU);
    this._vis(['t-empty'], !ANY && !EN);
    this._vis(['sv-e'], EN);
    this._vis(['sv-m'], MAIN);
    this._vis(['div-e'], EN && MAIN);
    this._vis(['n-sezione_impianto'], ANY);
    this._vis(['g-ext'], has('temperatura_esterna'));
    this._vis(['g-pdc', 't-pdc-pow', 't-pdc-mode', 'n-pompa_di_calore'], PDC);
    this._vis(['f-s1', 'f-r2b'], showS1);
    this._vis(['f-coil', 'f-r2a'], PDC && BOIL);
    this._vis(['f-s3', 'f-r3'], PDC && ACCU);
    this._vis(['jn'], PDC && BOIL && ACCU);
    this._vis(['g-v3v', 'n-valvola_3_vie'], ACS_ENT && PDC && BOIL && ACCU);
    this._vis(['g-mand-lbl'], showS1 && has('pdc_mandata'));
    this._vis(['g-rit-lbl'], showS1 && has('pdc_ritorno'));
    this._vis(['g-accu-in'], PDC && ACCU && has('accumulo_ingresso'));
    this._vis(['g-boiler'], BOIL);
    this._vis(['g-accu'], ACCU);
    this._vis(['g-boil-sp'], BOIL && has('acs_setpoint'));
    this._vis(['g-accu-sp'], ACCU && has('accumulo_setpoint'));
    this._vis(['g-floor', 'f-floor', 'n-pavimento'], FLOOR);
    this._vis(['g-pump', 'n-circolatore'], PUMP);
    this._vis(['f-fs', 'f-fr'], ACCU && FLOOR);
    this._vis(['g-ftemps'], FTEMPS);
    this._vis(['div-a', 'n-sezione_acqua', 'g-rete', 'n-rete', 'f-wa', 'f-wb', 'f-wout', 'g-tap', 'n-rubinetto'], WATER);
    this._vis(['g-stop'], WATER && STOP);
    this._vis(['g-meter'], WATER && (METER || OGGI));
    this._vis(['g-puffer'], WATER && PUFFER);
    this._vis(['g-auto'], WATER && AC);
    this._vis(['f-whot', 'jn-w', 'g-rpump', 'n-ricircolo'], WATER && BOIL && RIC);
    // Il "salto" del ritorno sopra la linea dell'accumulo serve solo se l'accumulo c'è
    const r2b = PDC && ACCU ? PDC_FLOWS.r2b : 'M236 108 H108';
    if (this._r2b !== r2b) {
      this._els['f-r2b'].querySelectorAll('path').forEach((p) => p.setAttribute('d', r2b));
      this._r2b = r2b;
    }
    // L'acqua sale ancora di 24 se sotto il pavimento non ci sono le temperature
    const wUp = FTEMPS ? 0 : 24;
    if (this._wUp !== wUp) {
      this._els['div-a'].setAttribute('y1', 316 - wUp);
      this._els['div-a'].setAttribute('y2', 316 - wUp);
      this._els['n-sezione_acqua'].setAttribute('y', 340 - wUp);
      this._els['sv-w'].setAttribute('y', -44 - wUp);
      this._els['f-whot'].querySelectorAll('path').forEach((pth) => pth.setAttribute('d', `M331 230 V${426 - wUp}`));
      this._wUp = wUp;
    }
    const hm = !ANY ? 190 : WATER ? 496 - wUp : FTEMPS ? 318 : 294;

    // ---- Energia ----
    // Velocità dei pallini: più potenza = più veloci (da 3,2 s a 0,3 s per tratto)
    // pochi watt = lentissimo (6 s per tratto), 1 kW ≈ 1,6 s, 5 kW ≈ 0,6 s
    const durE = (kw) => Math.min(6, Math.max(0.3, 1.6 * Math.pow(Math.max(Math.abs(kw || 0), 0.001), -0.6)));
    const sE = Number(c.soglia_energia) || 0;
    // la produzione non è mai negativa: di notte alcuni sistemi segnano pochi watt sotto zero
    const prod = (v) => (v === null ? null : Math.max(0, v));
    const pInv1 = prod(this._kw('inverter_1_potenza'));
    const pInv2 = prod(this._kw('inverter_2_potenza'));
    let pFv = prod(this._kw('fv_potenza'));
    if (pFv === null && (pInv1 !== null || pInv2 !== null)) pFv = (pInv1 || 0) + (pInv2 || 0);
    let pBat = this._kw('batteria_potenza');
    if (pBat !== null && c.batteria_inverti) pBat = -pBat;
    let pGrid = this._kw('rete_potenza');
    if (pGrid !== null && c.rete_inverti) pGrid = -pGrid;
    const soc = this._num('batteria_livello');
    const fmtP = (v) => (v === null ? '—' : Math.abs(v) < 1 ? f0(Math.abs(v) * 1000) + ' W' : f1(Math.abs(v)) + ' kW');
    // la soglia serve per rete e batteria, che oscillano; produzione e consumi si vedono da 10 W
    const fvOn = pFv !== null && pFv > 0.0005;
    const inv1On = pInv1 !== null && pInv1 > 0.0005;
    const inv2On = pInv2 !== null && pInv2 > 0.0005;
    const batDis = pBat !== null && pBat > sE;
    const batChg = pBat !== null && pBat < -sE;
    const gridIn = pGrid !== null && pGrid > sE;
    const gridOut = pGrid !== null && pGrid < -sE;
    // Casa: dal sensore, oppure dal bilancio di fotovoltaico, batteria e rete
    let pHome = this._kw('casa_potenza');
    if (pHome === null && (pFv !== null || pBat !== null || pGrid !== null)) pHome = Math.max(0, (pFv || 0) + (pBat || 0) + (pGrid || 0));
    const homeOn = pHome !== null && pHome > 0.0005;
    const gridState = this._on('rete_stato'); // true = rete collegata
    const gridDown = gridState === false;
    const cFv = col('fotovoltaico', PDC_COL.solar);
    const cInv = col('inverter', cFv);
    const num = (v, d) => (v !== undefined && v !== null && v !== '' && !isNaN(v) ? Number(v) : d);
    const cSoc = c.batteria_colora ? pdcSocColor(soc, num(c.batteria_min, 0), num(c.batteria_max, 100)) : null;
    const cBat = pdcCustomColor(colori.batteria) || cSoc || PDC_COL.batt;
    const cBatTxt = cSoc || cBat;
    const cGridIn = col('rete_elettrica', PDC_COL.gridIn);
    const cGridOut = col('rete_elettrica', PDC_COL.gridOut);
    const cHome = col('casa', PDC_COL.home);
    const HOUSE = HOME || this._utenze.length > 0;

    // Chi manda energia a chi (ogni coppia ha la sua linea, senza passare da un centro comune)
    const S = fvOn ? pFv : 0;
    const Gi = gridIn ? pGrid : 0;
    const Ge = gridOut ? -pGrid : 0;
    const Bd = batDis ? pBat : 0;
    const Bc = batChg ? -pBat : 0;
    const fSG = Math.min(S, Ge);              // fotovoltaico → rete
    const fBG = Math.max(0, Ge - fSG);        // batteria → rete
    const fSB = Math.min(S - fSG, Bc);        // fotovoltaico → batteria
    const fGB = Math.max(0, Bc - fSB);        // rete → batteria
    const fSH = Math.max(0, S - fSG - fSB);   // fotovoltaico → casa
    const fBH = Math.max(0, Bd - fBG);        // batteria → casa
    const fGH = Math.max(0, Gi - fGB);        // rete → casa

    // ---- Utenze (prima, perché decidono la disposizione) ----
    const U = PDC_U;
    const shown = [];
    const ustate = [];
    this._utenze.forEach((u, i) => {
      const st = this._hass.states[u.entity];
      const unit = String(u.unita || (st && st.attributes.unit_of_measurement) || '');
      const raw = st ? parseFloat(st.state) : NaN;
      const lim = u.soglia !== undefined && u.soglia !== null && u.soglia !== '' && !isNaN(u.soglia) ? Number(u.soglia) : null;
      let txt;
      let on;
      let kw = null;
      if (['W', 'kW', 'MW'].includes(unit) && !isNaN(raw)) {
        kw = unit === 'W' ? raw / 1000 : unit === 'MW' ? raw * 1000 : raw;
        txt = fmtP(kw);
        on = lim !== null ? raw > lim : kw > 0.0005;
      } else if (st && !isNaN(raw)) {
        txt = (Number.isInteger(raw) ? f0(raw) : f1(raw)) + (unit ? (['%', '°', '°C'].includes(unit) ? '' : ' ') + (unit === '°C' ? '°' : unit) : '');
        on = raw > (lim !== null ? lim : 0);
      } else if (st) {
        txt = typeof this._hass.formatEntityState === 'function' ? this._hass.formatEntityState(st) : String(st.state);
        const l = String(st.state).toLowerCase();
        on = !['unavailable', 'unknown', ''].includes(l) && !/(^|[._ ])(off|standby|idle|inactive|paused|none|spento|spenta)$/.test(l);
      } else {
        txt = '—';
        on = false;
      }
      // Stati tipo "Xxx.EnumType.PowerState.Off": resta solo l'ultima parte; testi lunghi accorciati
      if (/^[^\s]+\.[^\s]+$/.test(txt) && isNaN(parseFloat(txt))) txt = txt.split('.').pop();
      if (txt.length > 8) txt = txt.slice(0, 7) + '…';
      const cu = pdcCustomColor(u.colore) || PDC_U_COLORS[i % PDC_U_COLORS.length];
      const visible = !(u.nascondi && !on);
      this._show(`u${i}`, visible);
      this._show(`f-u${i}`, visible);
      this._color(`u${i}`, pdcCustomColor(u.colore) || (on ? cu : null));
      this._text(`u${i}-v`, txt, on ? cu : '');
      ustate[i] = { on, cu, kw };
      if (visible) shown.push(i);
    });
    const n = shown.length;

    // ---- Disposizione: con utenze a destra, oppure su tutta la larghezza ----
    const lay = n ? PDC_E_LAYOUT.utenze : PDC_E_LAYOUT.pieno;
    const layKey = n ? 'u' : 'p';
    if (this._layKey !== layKey) {
      const P = pdcEnergyPaths(lay);
      for (const id of PDC_E_FLOWS) this._els['f-' + id].querySelectorAll('path').forEach((pth) => pth.setAttribute('d', P[id]));
      const tr = (id, x, y) => this._els[id].setAttribute('transform', `translate(${x} ${y})`);
      tr('g-fv', lay.sx, 0);
      tr('g-inv1', lay.sx - 30, 0);
      tr('g-inv2', lay.sx + 30, 0);
      tr('g-batt', lay.sx, 0);
      tr('g-grid', lay.gx, 180);
      tr('g-casa', lay.hx, 180);
      this._els['jn-s'].setAttribute('cx', lay.sx);
      this._layKey = layKey;
    }

    this._vis(['g-fv'], FV);
    this._vis(['f-e_fv'], FV && !INV1 && !INV2);
    this._vis(['g-inv1', 'f-e_inv1a', 'f-e_inv1b'], INV1);
    this._vis(['g-inv2', 'f-e_inv2a', 'f-e_inv2b'], INV2);
    this._vis(['jn-s'], FV && (INV1 || INV2) && fvOn);
    this._vis(['g-batt'], BATT);
    this._vis(['g-grid'], GRID || has('rete_stato'));
    this._vis(['g-casa'], HOUSE);
    this._vis(['f-e_sg'], FV && GRID);
    this._vis(['f-e_sh'], FV && HOUSE);
    this._vis(['f-e_sb'], FV && BATT);
    this._vis(['f-e_gh'], GRID && HOUSE);
    this._vis(['f-e_gb'], GRID && BATT);
    this._vis(['f-e_bh'], BATT && HOUSE);

    // Fotovoltaico e inverter
    this._color('g-fv', fixed('fotovoltaico') || (fvOn ? cFv : null));
    this._els['g-fv'].classList.toggle('run', fvOn);
    this._text('t-fv', fmtP(pFv), fvOn ? cFv : '');
    this._flow('e_fv', fvOn, fvOn ? cFv : null, durE(pFv));
    this._color('g-inv1', fixed('inverter') || (inv1On ? cInv : null));
    this._text('t-inv1', fmtP(pInv1), inv1On ? cInv : '');
    this._flow('e_inv1a', inv1On, inv1On ? cFv : null, durE(pInv1));
    this._flow('e_inv1b', inv1On, inv1On ? cInv : null, durE(pInv1));
    this._color('g-inv2', fixed('inverter') || (inv2On ? cInv : null));
    this._text('t-inv2', fmtP(pInv2), inv2On ? cInv : '');
    this._flow('e_inv2a', inv2On, inv2On ? cFv : null, durE(pInv2));
    this._flow('e_inv2b', inv2On, inv2On ? cInv : null, durE(pInv2));
    this._color('jn-s', fvOn ? cFv : null);

    // Linee dirette tra i punti: colorate e animate solo quando ci passa energia, grigie da ferme
    const link = (id, kw, color, rev = false) => this._flow(id, kw > 0.0005, kw > 0.0005 ? color : null, durE(kw), rev);
    link('e_sg', fSG, cGridOut);
    link('e_sh', fSH, cFv);
    link('e_sb', fSB, cFv);
    link('e_gh', fGH, cGridIn);
    if (fBG > 0.0005) link('e_gb', fBG, cGridOut, true);
    else link('e_gb', fGB, cGridIn);
    link('e_bh', fBH, cBat);

    // Batteria
    this._color('g-batt', cBat);
    this._fill('fill-batt', soc === null ? null : 10 + (soc / 100) * 50, 212, 76, cBat);
    this._text('t-soc', soc === null ? '' : f0(soc) + '%');
    paint('n-batteria', cSoc);
    this._els['b-led'].classList.toggle('on', batChg || batDis);
    this._text('t-batt', pBat === null ? '' : fmtP(pBat), batDis || batChg || cSoc ? cBatTxt : '');
    this._text('t-batt-dir', batChg ? 'in carica' : batDis ? 'in scarica' : '');

    // Rete: animata solo quando la casa preleva
    const cGrid = gridDown ? PDC_COL.island : gridOut ? cGridOut : cGridIn;
    this._color('g-grid', gridDown ? PDC_COL.island : fixed('rete_elettrica') || (gridIn || gridOut ? cGrid : null));
    this._els['g-grid'].classList.toggle('run', gridIn && !gridDown);
    this._text('t-grid', fmtP(pGrid), gridIn || gridOut ? cGrid : '');
    this._text('t-grid-dir', gridDown ? 'staccata' : gridIn ? 'prelievo' : gridOut ? 'immissione' : '', gridDown ? PDC_COL.island : '');

    // Casa
    this._color('g-casa', fixed('casa') || (homeOn ? cHome : null));
    this._text('t-casa', fmtP(pHome), homeOn ? cHome : '');

    // Utenze: una linea per utenza dalla casa
    const y0 = Math.max(44, U.bus - ((n - 1) * U.row) / 2);
    const ys = shown.map((_, k) => Math.round(y0 + k * U.row));
    const from = lay.hx + 26;
    shown.forEach((i, k) => {
      const y = ys[k];
      const x1 = U.icon - U.r;
      this._els[`u${i}`].setAttribute('transform', `translate(0 ${y})`);
      const d = `M${from} ${U.bus} C${from + 14} ${U.bus} ${x1 - 14} ${y} ${x1} ${y}`;
      const g = this._els[`f-u${i}`];
      if (g._d !== d) {
        g.querySelectorAll('path').forEach((pth) => pth.setAttribute('d', d));
        g._d = d;
      }
      const s = ustate[i];
      this._flow(`u${i}`, s.on, s.on ? s.cu : null, s.kw !== null ? durE(s.kw) : 1.6);
    });

    // Altezze: energia (cresce con le utenze) + impianto/acqua
    const eh = n ? Math.max(PDC_EH, ys[n - 1] + 30) : PDC_EH;
    if (this._eH !== eh) {
      const sv = this._els['sv-e'];
      sv.setAttribute('height', eh);
      sv.setAttribute('viewBox', `0 0 420 ${eh}`);
      this._els['div-e'].setAttribute('y1', eh - 1);
      this._els['div-e'].setAttribute('y2', eh - 1);
      this._eH = eh;
    }
    const h = (EN ? eh : 0) + (MAIN ? hm : 0);
    if (this._vbH !== h) {
      this._svg.setAttribute('viewBox', `0 0 420 ${h}`);
      this._els['sv-m'].setAttribute('y', EN ? eh : 0);
      this._vbH = h;
    }

    // ---- Pompa di calore ----
    let mode, modeCol;
    if (!running) {
      mode = heat ? 'Risc. in pausa' : cool ? 'Raffr. in pausa' : 'Ferma';
      modeCol = null;
    } else if (acs) {
      mode = 'Acqua calda';
      modeCol = PDC_COL.acs;
    } else if (cool) {
      mode = 'Raffrescamento';
      modeCol = PDC_COL.cool;
    } else {
      mode = 'Riscaldamento';
      modeCol = PDC_COL.heat;
    }
    const pdcColor = running ? col('pompa_di_calore', modeCol) : null;
    const pdcIcon = fixed('pompa_di_calore') || pdcColor;

    const extTemp = tc('esterno', tExt);
    this._color('g-ext', fixed('esterno') || (colora('esterno') ? extTemp : null));
    this._text('t-ext', tExt === null ? '—' : f1(tExt) + ' °C', colora('esterno') ? extTemp : '');
    paint('n-esterno', colora('esterno') ? extTemp : null);

    this._color('g-pdc', pdcIcon);
    this._els['g-pdc'].classList.toggle('run', running);
    this._text('t-pdc-pow', pKw === null ? '—' : pKw < 1 ? f0(pKw * 1000) + ' W' : f1(pKw) + ' kW');
    this._text('t-pdc-mode', mode, pdcColor || '');
    const pm = running ? (acs ? 'acs' : cool ? 'cool' : 'heat') : heat ? 'heat' : cool ? 'cool' : null;
    for (const k of ['heat', 'cool', 'acs']) {
      this._show('pm-' + k, PDC && pm === k);
      this._els['pm-' + k].classList.toggle('dim', !running);
    }

    // Valvola 3 vie: con un solo ramo (solo bollitore o solo accumulo) il flusso va lì
    const toAcs = BOIL && (ACCU ? acs : true);
    const toImp = ACCU && (BOIL ? !acs : true);
    this._color('g-v3v', fixed('valvola_3_vie') || (running ? cMand || pdcColor : null));
    this._els['v-in'].classList.toggle('open', running);
    this._els['v-acs'].classList.toggle('open', toAcs);
    this._els['v-imp'].classList.toggle('open', toImp);

    this._text('t-mand', fT(tMand), cMand);
    this._text('t-rit', fT(tRit), cRit);
    this._text('t-accu-in', fT(tAccuIn), col('ingresso_accumulo', tc('ingresso_accumulo', tAccuIn)));
    paint('n-mandata', colora('mandata') ? cMand : null);
    paint('n-ritorno', colora('ritorno') ? cRit : null);
    paint('n-ingresso_accumulo', colora('ingresso_accumulo') ? col('ingresso_accumulo', tc('ingresso_accumulo', tAccuIn)) : null);

    // Bollitore e accumulo
    this._color('g-boiler', cAcs);
    const boilTxt = colora('bollitore') ? tc('bollitore', tAcs) : null;
    this._text('t-boiler', fT(tAcs), boilTxt || '');
    paint('n-bollitore', boilTxt);
    this._fill('fill-boiler', tAcs, 50, 180, cAcs);
    this._color('g-accu', cAccu);
    const accuTxt = colora('accumulo') ? tc('accumulo', tAccu) : null;
    this._text('t-accu', fT(tAccu), accuTxt || '');
    paint('n-accumulo', accuTxt);
    this._fill('fill-accu', tAccu, 196, 80, cAccu);
    const spB = this._setpoint('acs_setpoint');
    const spA = this._setpoint('accumulo_setpoint');
    this._text('t-boil-sp', spB === null ? '—' : f1(spB) + '°');
    this._text('t-accu-sp', spA === null ? '—' : f1(spA) + '°');

    // Flussi impianto
    const durP = Math.max(0.7, 2.6 - 0.35 * (pKw || 0));
    this._flow('s1', running, cMand, durP);
    this._flow('coil', running && toAcs, cMand, durP);
    this._flow('r2a', running && toAcs, cRit, durP);
    this._flow('r2b', running, cRit, durP);
    this._flow('s3', running && toImp, cAccuIn, durP);
    this._flow('r3', running && toImp, cRit, durP);
    this._color('jn', cRit);

    // Pavimento
    this._color('g-pump', fixed('circolatore') || (pumpOn ? cFm : null));
    this._els['g-pump'].classList.toggle('run', pumpOn);
    const floorOn = colora('pavimento');
    this._color('g-floor', floorCol || (pumpOn || floorOn ? cFm : null));
    const floorTxt = floorOn ? tc('pavimento', tFm) || cFm : null;
    paint('n-pavimento', floorTxt);
    paint('n-pav_mr', floorTxt);
    this._flow('fs', pumpOn, cFm, 1.8);
    this._flow('floor', pumpOn, cFm, 1.8);
    this._flow('fr', pumpOn, cFr, 1.8);
    this._text('t-fm', fT(tFm), floorCol || tc('pavimento', tFm));
    this._text('t-fr', fT(tFr), floorCol || tc('pavimento', tFr));

    // ---- Acqua sanitaria ----
    const durM = meterFlow ? Math.max(0.5, 3.2 / (1 + lpm / 5)) : 2;
    const durW = outFlow ? Math.max(0.5, 3.2 / (1 + (outLpm || 5) / 5)) : 2;

    this._color('g-rete', fixed('rete') || COLD);
    const openCol = col('stop', PDC_COL.open);
    this._color('g-stop', stopState === null ? null : stopState ? PDC_COL.closed : openCol);
    this._text('t-stop', stopState === null ? '—' : stopState ? 'chiusa' : 'aperta',
      stopState === null ? '' : stopState ? PDC_COL.closed : openCol);

    this._color('g-meter', fixed('contatore') || (meterFlow ? COLD : null));
    this._text('t-lpm', lpm === null ? '—' : f1(lpm));

    // Rete -> contatore -> puffer segue il contatore; se il contatore non c'è segue il flusso verso casa
    this._flow('wa', METER ? meterFlow : outFlow, COLD, METER ? durM : durW);
    this._flow('wb', outFlow, COLD, durW);
    this._flow('wout', outFlow, COLD, durW);
    this._color('jn-w', COLD);

    // Puffer e autoclave
    this._color('g-puffer', col('puffer', COLD));
    this._color('g-auto', fixed('autoclave') || (acRun ? COLD : null));
    this._els['g-auto'].classList.toggle('run', !!acRun);
    if (acRpm) {
      const spin = Math.max(0.25, Math.min(1.5, 2400 / acRpm)).toFixed(2) + 's';
      this._els['g-auto'].style.setProperty('--spin', spin);
    }
    const acBlocked = this._acBlocked();
    let acTxt;
    if (acBlocked) acTxt = 'bloccata';
    else if (acRpm !== null) acTxt = acRun ? f0(acRpm) + ' giri/min' : 'standby';
    else acTxt = acRun ? 'in funzione' : 'standby';
    this._text('t-ac-rpm', acTxt, acBlocked ? PDC_COL.closed : acRun ? col('autoclave', COLD) : '');
    this._text(
      't-ac-bar',
      (acBar === null ? '' : f1(acBar) + ' bar') + (acRun && acLpm ? ' · ' + f1(acLpm) + ' L/min' : '')
    );

    // Ricircolo: linea dal bollitore che si innesta sulla linea dell'acqua
    const cRic = col('ricircolo', cAcs);
    this._flow('whot', recOn, cRic, 1.8);
    this._color('g-rpump', fixed('ricircolo') || (recOn ? cRic : null));
    this._els['g-rpump'].classList.toggle('run', recOn);

    // Rubinetto
    this._color('g-tap', fixed('rubinetto') || (outFlow ? COLD : null));
    this._els['g-tap'].classList.toggle('run', outFlow);

    // Litri di oggi
    let litriOggi = null;
    const so = this._st('acqua_oggi');
    if (so && !isNaN(parseFloat(so.state))) {
      litriOggi = parseFloat(so.state) * this._toLitri(so.attributes.unit_of_measurement);
    } else if (has('acqua_totale')) {
      this._fetchOggi();
      if (this._oggi !== null && this._oggi !== undefined) {
        const st = this._st('acqua_totale');
        litriOggi = this._oggi * this._toLitri(st && st.attributes.unit_of_measurement);
      }
    }
    this._text('t-oggi', litriOggi === null ? '' : 'oggi ' + f0(litriOggi) + ' L');
  }

  _toLitri(unit) {
    const u = String(unit || 'L').toLowerCase().replace(/\s/g, '');
    if (u === 'm³' || u === 'm3') return 1000;
    if (u === 'gal') return 3.78541;
    if (u === 'ml') return 0.001;
    return 1;
  }

  // Variazione di oggi del contatore, dalle statistiche del recorder (sola lettura)
  _fetchOggi() {
    const id = this._ids('acqua_totale')[0];
    if (!id || typeof this._hass.callWS !== 'function') return;
    const now = Date.now();
    if (this._oggiTs && now - this._oggiTs < 5 * 60 * 1000) return;
    this._oggiTs = now;
    this._hass
      .callWS({
        type: 'recorder/statistic_during_period',
        statistic_id: id,
        calendar: { period: 'day' },
        types: ['change'],
      })
      .then((r) => {
        this._oggi = r && typeof r.change === 'number' ? r.change : null;
        this._update();
      })
      .catch(() => {
        this._oggi = null;
      });
  }
}

// ===================== EDITOR VISUALE =====================
// Un gruppo per componente: entità, nome e colore insieme.

const PDC_SENSOR = { entity: { domain: 'sensor' } };
const PDC_ANY = { entity: {} };

const PDC_FIELD_SELECTORS = {
  title: { text: {} },
  fv_potenza: PDC_SENSOR,
  inverter_1_potenza: PDC_SENSOR,
  inverter_2_potenza: PDC_SENSOR,
  batteria_livello: PDC_SENSOR,
  batteria_potenza: PDC_SENSOR,
  batteria_inverti: { boolean: {} },
  batteria_colora: { boolean: {} },
  batteria_min: { number: { min: 0, max: 100, step: 1, mode: 'box', unit_of_measurement: '%' } },
  batteria_max: { number: { min: 0, max: 100, step: 1, mode: 'box', unit_of_measurement: '%' } },
  rete_potenza: PDC_SENSOR,
  rete_inverti: { boolean: {} },
  casa_potenza: PDC_SENSOR,
  rete_stato: PDC_ANY,
  soglia_energia: { number: { min: 0, max: 2, step: 0.01, mode: 'box', unit_of_measurement: 'kW' } },
  temperatura_esterna: PDC_SENSOR,
  pdc_potenza: { entity: { domain: 'sensor', multiple: true } },
  riscaldamento: PDC_ANY,
  raffrescamento: PDC_ANY,
  soglia_pdc: { number: { min: 0, max: 2, step: 0.05, mode: 'box', unit_of_measurement: 'kW' } },
  acs_potenza: PDC_SENSOR,
  acs_attiva: PDC_ANY,
  soglia_acs: { number: { min: 0, max: 2, step: 0.05, mode: 'box', unit_of_measurement: 'kW' } },
  pdc_mandata: PDC_SENSOR,
  pdc_ritorno: PDC_SENSOR,
  acs_temperatura: PDC_SENSOR,
  accumulo_temperatura: PDC_SENSOR,
  accumulo_ingresso: PDC_SENSOR,
  circolatore: PDC_ANY,
  pavimento_mandata: PDC_SENSOR,
  pavimento_ritorno: PDC_SENSOR,
  acs_setpoint: { entity: { domain: ['climate', 'water_heater', 'sensor', 'number', 'input_number'] } },
  accumulo_setpoint: { entity: { domain: ['climate', 'water_heater', 'sensor', 'number', 'input_number'] } },
  acqua_valvola: PDC_ANY,
  acqua_portata: PDC_SENSOR,
  acqua_portata_unita: {
    select: {
      mode: 'dropdown',
      options: [
        { value: 'auto', label: 'Automatica (dal sensore)' },
        { value: 'L/min', label: 'L/min' },
        { value: 'L/h', label: 'L/h' },
        { value: 'm³/h', label: 'm³/h' },
        { value: 'gal/h', label: 'gal/h' },
      ],
    },
  },
  acqua_totale: PDC_SENSOR,
  acqua_oggi: PDC_SENSOR,
  puffer: { boolean: {} },
  autoclave_velocita: PDC_SENSOR,
  autoclave_pressione: PDC_SENSOR,
  autoclave_portata: PDC_SENSOR,
  autoclave_stato: PDC_SENSOR,
  autoclave_comando: { entity: { domain: ['select', 'switch', 'input_boolean'] } },
  ricircolo: PDC_ANY,
};

// [chiave, titolo, icona, campi]; "nome_x" e "colore_x" si riferiscono alle sezioni nomi/colori
const PDC_GROUPS = [
  ['fotovoltaico', 'Fotovoltaico e inverter', 'mdi:solar-power', ['fv_potenza', 'inverter_1_potenza', 'inverter_2_potenza', 'nome_fotovoltaico', 'nome_inverter_1', 'nome_inverter_2', 'colore_fotovoltaico', 'colore_inverter']],
  ['batteria', 'Batteria di accumulo', 'mdi:home-battery', ['batteria_livello', 'batteria_potenza', 'batteria_inverti', 'batteria_colora', 'batteria_min', 'batteria_max', 'nome_batteria', 'colore_batteria']],
  ['rete_elettrica', 'Rete elettrica', 'mdi:transmission-tower', ['rete_potenza', 'rete_inverti', 'rete_stato', 'nome_rete_elettrica', 'colore_rete_elettrica']],
  ['casa', 'Casa', 'mdi:home-lightning-bolt', ['casa_potenza', 'nome_casa', 'colore_casa']],
  ['esterno', 'Temperatura esterna', 'mdi:thermometer', ['temperatura_esterna', 'nome_esterno', 'colore_esterno', 'tcolora_esterno', 'tmin_esterno', 'tmax_esterno']],
  ['pompa_di_calore', 'Pompa di calore', 'mdi:heat-pump', ['pdc_potenza', 'riscaldamento', 'raffrescamento', 'soglia_pdc', 'nome_pompa_di_calore', 'colore_pompa_di_calore']],
  ['valvola_3_vie', 'Valvola 3 vie (ciclo ACS)', 'mdi:valve', ['acs_potenza', 'acs_attiva', 'soglia_acs', 'nome_valvola_3_vie', 'colore_valvola_3_vie']],
  ['mandata', 'Mandata', 'mdi:thermometer-chevron-up', ['pdc_mandata', 'nome_mandata', 'colore_mandata', 'tcolora_mandata', 'tmin_mandata', 'tmax_mandata']],
  ['ritorno', 'Ritorno', 'mdi:thermometer-chevron-down', ['pdc_ritorno', 'nome_ritorno', 'colore_ritorno', 'tcolora_ritorno', 'tmin_ritorno', 'tmax_ritorno']],
  ['bollitore', 'Bollitore', 'mdi:water-boiler', ['acs_temperatura', 'acs_setpoint', 'nome_bollitore', 'colore_bollitore', 'tcolora_bollitore', 'tmin_bollitore', 'tmax_bollitore']],
  ['accumulo', 'Accumulo', 'mdi:storage-tank', ['accumulo_temperatura', 'accumulo_setpoint', 'nome_accumulo', 'colore_accumulo', 'tcolora_accumulo', 'tmin_accumulo', 'tmax_accumulo']],
  ['ingresso_accumulo', 'Ingresso accumulo', 'mdi:import', ['accumulo_ingresso', 'nome_ingresso_accumulo', 'colore_ingresso_accumulo', 'tcolora_ingresso_accumulo', 'tmin_ingresso_accumulo', 'tmax_ingresso_accumulo']],
  ['circolatore', 'Circolatore pavimento', 'mdi:pump', ['circolatore', 'nome_circolatore', 'colore_circolatore']],
  ['pavimento', 'Pavimento', 'mdi:heating-coil', ['pavimento_mandata', 'pavimento_ritorno', 'nome_pavimento', 'colore_pavimento', 'tcolora_pavimento', 'tmin_pavimento', 'tmax_pavimento']],
  ['rete', 'Rete e linee acqua', 'mdi:water', ['nome_rete', 'colore_rete', 'colore_acqua_fredda']],
  ['stop', 'Stop acqua', 'mdi:pipe-valve', ['acqua_valvola', 'nome_stop', 'colore_stop']],
  ['contatore', 'Contatore', 'mdi:counter', ['acqua_portata', 'acqua_portata_unita', 'acqua_totale', 'acqua_oggi', 'nome_contatore', 'colore_contatore']],
  ['puffer', 'Puffer', 'mdi:storage-tank-outline', ['puffer', 'nome_puffer', 'colore_puffer']],
  ['autoclave', 'Autoclave', 'mdi:water-pump', ['autoclave_velocita', 'autoclave_pressione', 'autoclave_portata', 'autoclave_stato', 'autoclave_comando', 'nome_autoclave', 'colore_autoclave']],
  ['ricircolo', 'Ricircolo', 'mdi:reload', ['ricircolo', 'nome_ricircolo', 'colore_ricircolo']],
  ['rubinetto', 'Rubinetto', 'mdi:faucet', ['nome_rubinetto', 'colore_rubinetto']],
];

const PDC_OPT_KEYS = ['title', 'acqua_portata_unita', 'puffer', 'soglia_pdc', 'soglia_acs', 'soglia_energia', 'batteria_inverti', 'rete_inverti', 'batteria_colora', 'batteria_min', 'batteria_max'];

const PDC_TNUM = { number: { min: -30, max: 100, step: 1, mode: 'box', unit_of_measurement: '°C' } };

function pdcSelectorFor(field) {
  if (field.startsWith('tcolora_')) return { boolean: {} };
  if (field.startsWith('tmin_') || field.startsWith('tmax_')) return PDC_TNUM;
  if (field.startsWith('nome_')) return { text: {} };
  if (field.startsWith('colore_')) return { ui_color: { include_none: true } };
  return PDC_FIELD_SELECTORS[field] || { text: {} };
}

const pdcGroup = ([key, title, icon, fields]) => ({
  type: 'expandable',
  name: 'g_' + key,
  flatten: true,
  title,
  icon,
  schema: fields.map((f) => ({ name: f, selector: pdcSelectorFor(f) })),
});

// Campi di ogni utenza ("u0_entity", "u0_nome"...); dopo l'ultima c'è un gruppo vuoto per aggiungerne una
const PDC_U_FIELDS = ['entity', 'nome', 'icona', 'colore', 'nascondi', 'soglia'];
const PDC_U_SELECTORS = {
  entity: { entity: {} },
  nome: { text: {} },
  icona: { icon: {} },
  colore: { ui_color: { include_none: true } },
  nascondi: { boolean: {} },
  soglia: { number: { mode: 'box', step: 'any' } },
};

// Le tre parti della card, nello stesso ordine del disegno: [chiave, titolo, icona, campi della sezione, gruppi]
const PDC_SECTIONS = [
  ['energia', 'Energia', 'mdi:lightning-bolt', ['nome_sezione_energia', 'soglia_energia'],
    ['fotovoltaico', 'batteria', 'rete_elettrica', 'casa']],
  ['impianto', 'Pompa di calore e impianto', 'mdi:heat-pump', ['nome_sezione_impianto', 'nome_setpoint'],
    ['esterno', 'pompa_di_calore', 'valvola_3_vie', 'mandata', 'ritorno', 'bollitore', 'accumulo', 'ingresso_accumulo', 'circolatore', 'pavimento']],
  ['acqua', 'Acqua sanitaria', 'mdi:water', ['nome_sezione_acqua'],
    ['rete', 'stop', 'contatore', 'puffer', 'autoclave', 'ricircolo', 'rubinetto']],
];

function pdcEditorSchema(config) {
  const n = Array.isArray(config.utenze) ? config.utenze.length : 0;
  const byKey = Object.fromEntries(PDC_GROUPS.map((g) => [g[0], g]));
  const out = [{ name: 'title', selector: pdcSelectorFor('title') }];
  for (const [key, title, icon, fields, groups] of PDC_SECTIONS) {
    const schema = fields.map((f) => ({ name: f, selector: pdcSelectorFor(f) }));
    for (const gk of groups) schema.push(pdcGroup(byKey[gk]));
    if (key === 'energia') {
      // utenze elettriche: escono dalla casa
      for (let i = 0; i <= n; i++) {
        const add = i === n;
        schema.push({
          type: 'expandable',
          name: 'g_u' + i,
          flatten: true,
          title: add ? 'Aggiungi utenza elettrica' : 'Utenza ' + (i + 1),
          icon: add ? 'mdi:plus' : 'mdi:power-plug-outline',
          schema: (add ? ['entity'] : PDC_U_FIELDS).map((f) => ({ name: `u${i}_${f}`, selector: PDC_U_SELECTORS[f] })),
        });
      }
    }
    out.push({ type: 'expandable', name: 's_' + key, flatten: true, title, icon, schema });
  }
  return out;
}

const PDC_LABELS = {
  title: 'Titolo della card',
  fv_potenza: 'Potenza prodotta (totale)',
  inverter_1_potenza: 'Inverter 1: potenza',
  inverter_2_potenza: 'Inverter 2: potenza',
  nome_fotovoltaico: 'Nome pannelli',
  nome_inverter_1: 'Nome inverter 1',
  nome_inverter_2: 'Nome inverter 2',
  colore_inverter: 'Colore inverter',
  batteria_livello: 'Livello di carica (%)',
  batteria_potenza: 'Potenza (positiva = in scarica)',
  batteria_inverti: 'Segno invertito (positiva = in carica)',
  batteria_colora: 'Colore secondo la carica (rosso scarica → verde carica)',
  batteria_min: 'Rosso fino a',
  batteria_max: 'Verde da',
  rete_potenza: 'Potenza (positiva = prelievo dalla rete)',
  rete_inverti: 'Segno invertito (positiva = immissione)',
  rete_stato: 'Stato della rete (on = collegata)',
  soglia_energia: 'Rete e batteria animate sopra (0 = sempre)',
  casa_potenza: 'Consumo della casa',
  nome_sezione_energia: 'Nome della sezione',
  colore_rete_elettrica: 'Colore icona e linea',
  colore_fotovoltaico: 'Colore icona e linea',
  colore_batteria: 'Colore batteria e linea',
  colore_casa: 'Colore icona e linea',
  temperatura_esterna: 'Sensore temperatura',
  pdc_potenza: 'Potenza (uno o più sensori, vengono sommati)',
  riscaldamento: 'Modalità riscaldamento',
  raffrescamento: 'Modalità raffrescamento',
  soglia_pdc: 'Accesa sopra',
  acs_potenza: 'Potenza ciclo ACS (tank)',
  acs_attiva: 'Oppure: ciclo ACS attivo (on/off)',
  soglia_acs: 'Ciclo ACS sopra',
  pdc_mandata: 'Sensore temperatura',
  pdc_ritorno: 'Sensore temperatura',
  acs_temperatura: 'Sensore temperatura',
  accumulo_temperatura: 'Sensore temperatura',
  accumulo_ingresso: 'Sensore temperatura',
  circolatore: 'Stato circolatore',
  pavimento_mandata: 'Temperatura mandata',
  pavimento_ritorno: 'Temperatura ritorno',
  acqua_valvola: 'Valvola (on = aperta)',
  acqua_portata: 'Portata',
  acqua_portata_unita: 'Unità della portata',
  acqua_totale: 'Contatore totale (calcola i litri di oggi)',
  acqua_oggi: 'Oppure: litri di oggi',
  puffer: 'Mostra anche senza autoclave',
  autoclave_velocita: 'Velocità (giri/min)',
  autoclave_pressione: 'Pressione',
  autoclave_portata: 'Portata',
  autoclave_stato: 'Stato',
  autoclave_comando: "Blocco autoclave (si apre toccando l'autoclave)",
  ricircolo: 'Pompa ricircolo',
  nome_sezione_impianto: 'Nome della sezione',
  nome_sezione_acqua: 'Nome della sezione',
  nome_setpoint: 'Scritta prima del setpoint',
  acs_setpoint: 'Setpoint (numero piccolo nel serbatoio)',
  accumulo_setpoint: 'Setpoint (numero piccolo nel serbatoio)',
  colore_acqua_fredda: 'Colore delle linee acqua',
  colore_mandata: 'Colore linea',
  colore_ritorno: 'Colore linea',
  colore_ingresso_accumulo: 'Colore linea',
  colore_bollitore: 'Colore serbatoio',
  colore_accumulo: 'Colore serbatoio',
  colore_puffer: 'Colore serbatoio',
  colore_pavimento: 'Colore disegno e linee',
  colore_ricircolo: 'Colore pompa e linea',
};

class PdcFlowCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    else this._render();
  }

  connectedCallback() {
    this._load();
  }

  // ha-form viene caricato da HA solo quando serve: lo forziamo aprendo l'editor di una card standard
  async _load() {
    if (!customElements.get('ha-form') && window.loadCardHelpers) {
      try {
        const helpers = await window.loadCardHelpers();
        const card = await helpers.createCardElement({ type: 'entities', entities: [] });
        if (card && card.constructor.getConfigElement) await card.constructor.getConfigElement();
      } catch (e) {
        /* si riprova al prossimo render */
      }
    }
    this._render();
  }

  _render() {
    if (!this._config || !this._hass || !customElements.get('ha-form')) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = (sch) => {
        if (PDC_LABELS[sch.name]) return PDC_LABELS[sch.name];
        const um = /^u\d+_(\w+)$/.exec(sch.name);
        if (um) return { entity: 'Entità', nome: 'Nome', icona: 'Icona', colore: 'Colore', nascondi: 'Nascondi quando è spenta', soglia: 'Accesa sopra' }[um[1]];
        if (sch.name.startsWith('nome_')) return 'Nome';
        if (sch.name.startsWith('colore_')) return 'Colore icona';
        if (sch.name.startsWith('tcolora_')) return 'Colora nome, valore e icona con la temperatura';
        if (sch.name.startsWith('tmin_')) return 'Celeste fino a';
        if (sch.name.startsWith('tmax_')) return 'Rosso da';
        return sch.title || sch.name;
      };
      this._form.computeHelper = (sch) => {
        if (sch.name.startsWith('nome_')) return 'Lascia vuoto per non mostrare nessuna scritta';
        if (sch.name.startsWith('colore_')) return 'Vale sempre, anche da fermo. Nessuno = automatico (temperatura o stato, grigio da fermo)';
        if (sch.name.startsWith('tmin_') || sch.name.startsWith('tmax_')) {
          const d = PDC_TEMP_RANGE[sch.name.slice(5)] || [10, 55];
          return 'Predefinito: ' + (sch.name.startsWith('tmin_') ? d[0] : d[1]) + ' °C';
        }
        if (sch.name === 'colore_rete_elettrica') return 'Nessuno = blu in prelievo, viola in immissione';
        if (sch.name === 'batteria_min') return 'Predefinito: 0 %';
        if (sch.name === 'batteria_max') return 'Predefinito: 100 %';
        if (sch.name === 'batteria_colora') return 'Colora batteria, linea, percentuale e nome. Un colore fisso, se scelto, vale per il disegno';
        if (sch.name === 'rete_stato') return 'Se la rete si stacca, sotto la rete compare "staccata"';
        if (/^u\d+_soglia$/.test(sch.name)) return "Nell'unità del sensore. Vuoto = potenze sopra 10 W, altri valori sopra 0";
        if (/^u\d+_entity$/.test(sch.name)) return 'Potenza (W o kW) oppure un altro sensore: stato, percentuale…';
        if (sch.name === 'autoclave_comando') return 'Un select con le opzioni Abilita / Disabilita, oppure uno switch (off = bloccata)';
        return undefined;
      };
      this._form.addEventListener('value-changed', (ev) => {
        ev.stopPropagation();
        const cfg = PdcFlowCardEditor.fromForm(ev.detail.value, this._config);
        this._config = cfg;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = PdcFlowCardEditor.toForm(this._config);
    const nU = Array.isArray(this._config.utenze) ? this._config.utenze.length : 0;
    if (this._schemaN !== nU) {
      this._form.schema = pdcEditorSchema(this._config);
      this._schemaN = nU;
    }
  }

  // Dalla configurazione YAML ai campi piatti del form
  static toForm(config) {
    const d = {};
    const ent = config.entities || {};
    for (const k of PDC_ENTITY_KEYS) if (ent[k] !== undefined) d[k] = ent[k];
    const nomi = config.nomi || {};
    for (const k of Object.keys(PDC_NOMI)) d['nome_' + k] = nomi[k] !== undefined && nomi[k] !== null ? String(nomi[k]) : PDC_NOMI[k];
    for (const [k, v] of Object.entries(config.colori || {})) d['colore_' + k] = v;
    for (const [k, o] of Object.entries(config.temperature || {})) {
      if (!o || typeof o !== 'object') continue;
      if (o.colora !== undefined) d['tcolora_' + k] = !!o.colora;
      if (o.min !== undefined) d['tmin_' + k] = o.min;
      if (o.max !== undefined) d['tmax_' + k] = o.max;
    }
    for (const k of PDC_OPT_KEYS) if (config[k] !== undefined) d[k] = config[k];
    if (!d.acqua_portata_unita) d.acqua_portata_unita = 'auto';
    if (!d.rete_stato && ent.gateway_stato_rete) d.rete_stato = ent.gateway_stato_rete;
    (Array.isArray(config.utenze) ? config.utenze : []).forEach((u, i) => {
      if (!u || typeof u !== 'object') return;
      const v = {
        entity: u.entity,
        nome: u.nome !== undefined ? u.nome : u.name,
        icona: u.icona || u.icon,
        colore: u.colore !== undefined ? u.colore : u.color,
        nascondi: u.nascondi_a_zero !== undefined ? !!u.nascondi_a_zero : u.display_zero === false ? true : undefined,
        soglia: u.soglia !== undefined ? u.soglia : u.display_zero_tolerance,
      };
      for (const [k, x] of Object.entries(v)) if (x !== undefined && x !== null) d[`u${i}_${k}`] = x;
    });
    return d;
  }

  // Dai campi del form alla configurazione YAML (i campi vuoti vengono tolti)
  static fromForm(value, original) {
    const empty = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
    const cfg = { ...original };
    const ent = { ...(original.entities || {}) };
    for (const k of PDC_ENTITY_KEYS) {
      if (empty(value[k])) delete ent[k];
      else ent[k] = value[k];
    }
    // Ordine nello YAML: energia, pompa di calore e impianto, acqua sanitaria (poi eventuali altre chiavi)
    const ordered = {};
    for (const k of PDC_ENTITY_ORDER) if (ent[k] !== undefined) ordered[k] = ent[k];
    for (const k of Object.keys(ent)) if (!(k in ordered)) ordered[k] = ent[k];
    cfg.entities = ordered;
    if (Object.keys(ent).length) delete cfg.demo;

    const nomi = {};
    for (const k of Object.keys(PDC_NOMI)) {
      const v = value['nome_' + k];
      if (empty(v)) nomi[k] = '';
      else if (v !== PDC_NOMI[k]) nomi[k] = v;
    }
    if (Object.keys(nomi).length) cfg.nomi = nomi;
    else delete cfg.nomi;

    const colori = {};
    for (const k of PDC_COLORI) {
      const v = value['colore_' + k];
      if (!empty(v) && v !== 'none') colori[k] = v;
    }
    if (Object.keys(colori).length) cfg.colori = colori;
    else delete cfg.colori;

    const temps = {};
    for (const k of PDC_TEMPS) {
      const o = {};
      if (value['tcolora_' + k] === true) o.colora = true;
      if (!empty(value['tmin_' + k])) o.min = Number(value['tmin_' + k]);
      if (!empty(value['tmax_' + k])) o.max = Number(value['tmax_' + k]);
      if (Object.keys(o).length) temps[k] = o;
    }
    if (Object.keys(temps).length) cfg.temperature = temps;
    else delete cfg.temperature;

    for (const k of PDC_OPT_KEYS) {
      if (empty(value[k])) delete cfg[k];
      else cfg[k] = value[k];
    }
    if (cfg.acqua_portata_unita === 'auto') delete cfg.acqua_portata_unita;
    if (!cfg.puffer) delete cfg.puffer;
    if (!cfg.batteria_inverti) delete cfg.batteria_inverti;
    if (!cfg.batteria_colora) delete cfg.batteria_colora;
    if (!cfg.rete_inverti) delete cfg.rete_inverti;
    delete cfg.pulsanti;
    delete cfg.entities.gateway_stato_rete;

    // Utenze: l'ordine resta quello dell'elenco; svuotando l'entità l'utenza viene tolta
    const old = Array.isArray(original.utenze) ? original.utenze : [];
    const utenze = [];
    for (let i = 0; i <= old.length; i++) {
      const e = value[`u${i}_entity`];
      if (empty(e)) continue;
      const u = { ...(old[i] && typeof old[i] === 'object' ? old[i] : {}) };
      for (const k of ['name', 'icon', 'color', 'display_zero', 'display_zero_tolerance', 'nascondi_a_zero', 'nome', 'icona', 'colore', 'soglia']) delete u[k];
      u.entity = e;
      const nome = value[`u${i}_nome`];
      if (!empty(nome)) u.nome = nome;
      if (!empty(value[`u${i}_icona`])) u.icona = value[`u${i}_icona`];
      const colore = value[`u${i}_colore`];
      if (!empty(colore) && colore !== 'none') u.colore = colore;
      if (value[`u${i}_nascondi`] === true) u.nascondi_a_zero = true;
      if (!empty(value[`u${i}_soglia`])) u.soglia = Number(value[`u${i}_soglia`]);
      utenze.push(u);
    }
    if (utenze.length) {
      cfg.utenze = utenze;
      delete cfg.demo;
    } else delete cfg.utenze;
    return pdcOrderConfig(cfg);
  }
}

if (!customElements.get('pdc-flow-card-editor')) {
  customElements.define('pdc-flow-card-editor', PdcFlowCardEditor);
}

if (!customElements.get('pdc-flow-card')) {
  customElements.define('pdc-flow-card', PdcFlowCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'pdc-flow-card',
    name: 'PdC Flow Card',
    description: 'Schema animato pompa di calore e acqua sanitaria',
    preview: true,
  });
  console.info(`%c PDC-FLOW-CARD %c v${PDC_VERSION} `, 'background:#ff7043;color:#fff', 'background:#333;color:#fff');
}
