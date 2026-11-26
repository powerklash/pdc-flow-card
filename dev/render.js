const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
// uso: node render.js [scenario]   (immagini in dev/out/)
const D = __dirname;
fs.mkdirSync(path.join(D, 'out'), { recursive: true });
const S_ = (state, unit, extra) => ({ state: String(state), attributes: { ...(unit ? { unit_of_measurement: unit } : {}), ...(extra || {}) } });
const ent = {
  fv_potenza: 'sensor.fv', inverter_1_potenza: 'sensor.inv1', inverter_2_potenza: 'sensor.inv2', fv_previsione: 'sensor.fc', meteo: 'weather.casa',
  batteria_livello: 'sensor.soc', batteria_potenza: 'sensor.bat',
  rete_potenza: 'sensor.grid', casa_potenza: 'sensor.home', rete_stato: 'binary_sensor.gws',
  temperatura_esterna: 'sensor.ext', pdc_potenza: ['sensor.p_risc', 'sensor.p_tank', 'sensor.p_raffr'], acs_potenza: 'sensor.p_tank', pdc_mandata: 'sensor.mand', pdc_ritorno: 'sensor.rit',
  acs_temperatura: 'sensor.acs', acs_setpoint: 'climate.sp', riscaldamento: 'binary_sensor.risc', raffrescamento: 'binary_sensor.raffr', accumulo_temperatura: 'sensor.accu', accumulo_ingresso: 'sensor.ain', circolatore: 'binary_sensor.circ',
  acqua_valvola: 'switch.valve', acqua_portata: 'sensor.portata', acqua_oggi: 'sensor.oggi', locale_temperatura: 'sensor.loc_t', allarme: 'alarm_control_panel.al', casa_temperatura: 'sensor.casa_t', acs_livello: 'sensor.acs_l', puffer_livello: 'sensor.puf_l', ups_batteria: 'sensor.ups', cancello_stato: 'binary_sensor.gate', cancello_luce: 'switch.gate_light', tettoia_prese: 'switch.t1', ingresso_prese: 'switch.t2', locale_umidita: 'sensor.loc_h', acqua_totale: 'sensor.tot', autoclave_velocita: 'sensor.ac_rpm', autoclave_pressione: 'sensor.ac_bar', autoclave_portata: 'sensor.ac_lpm', autoclave_stato: 'sensor.ac_st', ricircolo: 'switch.ric',
  sentina_potenza: 'sensor.sent_w', sentina_energia: 'sensor.sent_kwh', sentina_stato: 'switch.sent',
};
const SUNA = { next_rising: '2026-11-12T06:18:06+00:00', next_setting: '2026-11-12T16:03:43+00:00' };
const nomi = { rete: '', stop: 'Acqua', puffer: '800L' };
const base = (o = {}) => ({ 'sensor.ups': S_(100, '%'), 'binary_sensor.gws': S_('on'), 'sensor.ext': S_(9.4, '°C'), 'sensor.p_risc': S_(0, 'kW'), 'sensor.p_tank': S_(0, 'kW'), 'sensor.p_raffr': S_(0, 'kW'),
  'sensor.mand': S_(35, '°C'), 'sensor.rit': S_(31, '°C'), 'sensor.acs': S_(52, '°C'), 'climate.sp': S_('heat', null, { temperature: 54 }), 'binary_sensor.risc': S_('on'), 'binary_sensor.raffr': S_('off'),
  'sensor.accu': S_(32, '°C'), 'sensor.ain': S_(34, '°C'), 'binary_sensor.circ': S_('on'), 'switch.valve': S_('on'), 'sensor.portata': S_(0, 'L/min'),
  'sensor.ac_rpm': S_(0, 'rpm'), 'sensor.ac_bar': S_(3.1, 'bar'), 'sensor.ac_lpm': S_(0, 'L/min'), 'sensor.ac_st': S_('Standby'), 'switch.ric': S_('off'), 'sensor.oggi': S_(227, 'L'), 'sensor.loc_t': S_(20.5, '°C'), 'sensor.casa_t': S_(21.5, '°C'), 'sensor.acs_l': S_(70, '%'), 'sensor.puf_l': S_(35, '%'), 'alarm_control_panel.al': S_('disarmed'), 'binary_sensor.gate': S_('off'), 'switch.gate_light': S_('on'), 'switch.t1': S_('on'), 'switch.t2': S_('off'), 'sensor.loc_h': S_(53, '%'), 'sensor.tot': S_(178.956, 'm³'),
  'sensor.sent_w': S_(0, 'W'), 'sensor.sent_kwh': S_(0.117, 'kWh'), 'switch.sent': S_('on'),
  'sun.sun': S_('below_horizon', null, SUNA), 'sensor.fc': S_(0, 'W'), 'weather.casa': S_('cloudy'), ...o });
const en = (fv, i1, i2, bat, grid, home, soc) => ({ 'sensor.fv': S_(fv, 'kW'), 'sensor.inv1': S_(i1, 'kW'), 'sensor.inv2': S_(i2, 'kW'), 'sensor.bat': S_(bat, 'kW'), 'sensor.grid': S_(grid, 'kW'), 'sensor.home': S_(home, 'kW'), 'sensor.soc': S_(soc, '%') });
const utenze = [
  { entity: 'sensor.u1', nome: 'Riscaldamento', icona: 'mdi:radiator' },
  { entity: 'sensor.u2', nome: 'Acqua sanitaria', icona: 'mdi:water-boiler' },
  { entity: 'sensor.u3', nome: 'Autoclave', icona: 'mdi:water-pump' },
  { entity: 'sensor.u4', nome: 'Pompa sentina', icona: 'mdi:pump' },
];
const ust = (a, b, c2, d) => ({ 'sensor.u1': S_(a, 'kW'), 'sensor.u2': S_(b, 'kW'), 'sensor.u3': S_(c2, 'kW'), 'sensor.u4': S_(d, 'W') });
const utenzeH = utenze.map((u) => ({ ...u, nascondi_a_zero: true }));
const NOMI_U = { sezione_energia: '', fotovoltaico: '', inverter_1: 'Slave', inverter_2: 'Main', batteria: '', rete_elettrica: '', casa: '', sezione_impianto: '', sezione_acqua: '', esterno: '', accumulo: 'Acqua Pavimento', bollitore: 'Acqua Sanitaria', rete: 'Acqua', stop: '', puffer: '800L', rubinetto: 'Casa' };
const TEMP_U = { esterno: { colora: true }, mandata: { colora: true }, ritorno: { colora: true }, ingresso_accumulo: { colora: true }, bollitore: { colora: true }, accumulo: { colora: true } };
const scen = {
  notte_u: { cfg: { entities: ent, acs_litri: 300, puffer_litri: 800, utenze: utenzeH, batteria_colora: true, acqua_portata_unita: 'L/h', temperature: TEMP_U, nomi: NOMI_U },
    st: { ...base({ 'sensor.portata': S_(0, 'L/h'), 'sensor.acs_l': S_(30, '%'), 'sensor.puf_l': S_(85, '%') }), ...en(-0.01, 0, 0, -0.01, 0.65, 0.64, 18.5), ...ust(0, 0, 0, 0) } },
  giorno_u: { cfg: { entities: ent, acs_litri: 300, puffer_litri: 800, utenze: utenzeH, batteria_colora: true, acqua_portata_unita: 'L/h', temperature: TEMP_U, nomi: NOMI_U },
    st: { ...base({ 'sun.sun': S_('above_horizon', null, SUNA), 'sensor.fc': S_(2400, 'W'), 'sensor.p_risc': S_(2.8, 'kW'), 'sensor.ups': S_(87, '%'), 'sensor.portata': S_(372, 'L/h'), 'alarm_control_panel.al': S_('armed_away'), 'binary_sensor.gate': S_('on'), 'switch.gate_light': S_('off'), 'switch.t1': S_('off'), 'switch.t2': S_('on') }), ...en(2.2, 0.9, 1.3, -0.4, 0.95, 2.75, 45), ...ust(2.8, 0, 0, 0) } },
  utente: { cfg: { entities: ent, utenze, batteria_colora: true, acqua_portata_unita: 'L/h', temperature: { esterno: { colora: true }, mandata: { colora: true }, ritorno: { colora: true }, ingresso_accumulo: { colora: true }, bollitore: { colora: true }, accumulo: { colora: true } },
    nomi: { sezione_energia: '', fotovoltaico: '', inverter_1: 'Slave', inverter_2: 'Main', batteria: '', rete_elettrica: '', casa: '', sezione_impianto: '', sezione_acqua: '', esterno: '', accumulo: 'Acqua Pavimento', bollitore: 'Acqua Sanitaria', rete: 'Acqua', stop: '', puffer: '800L', rubinetto: 'Casa' } },
    st: { ...base({ 'sensor.portata': S_(0, 'L/h'), 'sensor.acs_l': S_(30, '%'), 'sensor.puf_l': S_(85, '%') }), ...en(-0.01, 0, 0, -0.01, 0.65, 0.64, 18.5), ...ust(0, 0, 0, 0) } },
  contatore: { cfg: { entities: ent, nomi: { rete: 'Acqua', stop: '', puffer: '800L', rubinetto: 'Casa' }, batteria_colora: true }, st: { ...base({ 'sensor.portata': S_(372, 'L/h') }), ...en(0, 0, 0, 0.01, 0.6, 0.6, 18) } },
  chiusa: { cfg: { entities: ent, nomi: { rete: 'Acqua', stop: '', puffer: '800L', rubinetto: 'Casa' }, acqua_portata_unita: 'L/h' }, st: { ...base({ 'switch.valve': S_('off'), 'sensor.ac_rpm': S_(3786, 'rpm'), 'sensor.ac_lpm': S_(7.8, 'L/min'), 'sensor.ac_st': S_('In funzione') }), ...en(0, 0, 0, 0.01, 0.6, 0.6, 18) } },
  separata: { cfg: { entities: ent, nomi: { rete: '', stop: 'Acqua', puffer: '800L' }, acqua_separata: true }, st: { ...base({ 'sensor.portata': S_(6.2, 'L/min') }), ...en(0, 0, 0, 0.01, 0.6, 0.6, 18) } },
  notte: { cfg: { entities: ent, nomi, batteria_colora: true }, st: { ...base({ 'sensor.p_risc': S_(1.8, 'kW') }), ...en(-0.008, 0, 0, 0.01, 1.9, 1.92, 19) } },
  pioggia: { cfg: { entities: ent, nomi, batteria_colora: true }, st: { ...base({ 'sun.sun': S_('above_horizon', null, SUNA), 'sensor.fc': S_(1250, 'W'), 'weather.casa': S_('rainy'), 'sensor.sent_w': S_(380, 'W') }), ...en(0, 0, 0, 0.6, 0.2, 0.8, 45) } },
  sole: { cfg: { entities: ent, nomi, batteria_colora: true }, st: { ...base({ 'alarm_control_panel.al': S_('triggered'), 'sun.sun': S_('above_horizon', null, SUNA), 'sensor.fc': S_(2400, 'W'), 'weather.casa': S_('sunny'), 'sensor.ac_rpm': S_(3786, 'rpm'), 'sensor.ac_lpm': S_(7.8, 'L/min'), 'sensor.ac_st': S_('In funzione'), 'switch.sent': S_('off') }), ...en(2.2, 0.9, 1.3, -0.5, -0.3, 1.4, 70) } },
  notte_utenze: { cfg: { entities: ent, nomi, utenze, batteria_colora: true }, st: { ...base({ 'sensor.p_risc': S_(1.8, 'kW'), 'alarm_control_panel.al': S_('armed_night') }), ...en(0, 0, 0, 0.9, 1.0, 1.92, 30), ...ust(1.8, 0, 0, 0) } },
  sole_utenze: { cfg: { entities: ent, nomi, utenze, batteria_colora: true }, st: { ...base({ 'sun.sun': S_('above_horizon', null, SUNA), 'sensor.fc': S_(2400, 'W') }), ...en(2.2, 0.9, 1.3, -0.5, -0.3, 1.4, 70), ...ust(1.2, 0, 0.4, 0) } },
};
(async () => {
  const b = await chromium.launch();
  const only = process.argv[2];
  for (const [name, sc] of Object.entries(scen)) {
    if (only && only !== name) continue;
    const p = await b.newPage({ viewport: { width: 452, height: 1200 }, deviceScaleFactor: 2, timezoneId: 'Europe/Rome' });
    const logs = []; p.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
    await p.goto('file://' + path.join(D, 'test-page.html'));
    await p.evaluate(({ cfg, st }) => {
      const card = document.createElement('pdc-flow-card');
      card.setConfig({ type: 'custom:pdc-flow-card', ...cfg });
      document.getElementById('box').appendChild(card);
      card.hass = { states: st, locale: { language: 'it', number_format: 'language' } };
      window._card = card;
    }, sc);
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const sr = window._card.shadowRoot; const t = (id) => sr.getElementById(id).textContent;
      const vis = (id) => !sr.getElementById(id).classList.contains('hidden');
      const f = (id) => { const g = sr.getElementById('f-' + id); if (!g || g.classList.contains('hidden')) return '-'; return g.classList.contains('on') ? getComputedStyle(g.querySelector('.dots')).animationDuration + (g.classList.contains('rev') ? '↩' : '') : 'off'; };
      return { vb: sr.querySelector('svg.root').getAttribute('viewBox'), eh: sr.getElementById('sv-e').getAttribute('height'),
        fv: t('t-fv'), sun: vis('fv-sun'), times: vis('fv-times') ? t('t-alba') + '|' + t('t-tramonto') : 'no', moon: vis('fv-moon'), cloud: vis('fv-cloud'), rain: vis('fv-rain'), inv1: vis('g-inv1'),
        meter: t('t-lpm') + '|' + t('t-oggi') + '|' + t('t-mtot') + '|' + t('t-mvalve') + ' rete=' + vis('g-rete') + ' stop=' + vis('g-stop') + ' valve=' + vis('m-valve'), grid: (() => { const r = sr.getElementById('g-grid').querySelector('.tower').getBBox(); const tr = sr.getElementById('g-grid').getAttribute('transform'); return tr + ' base ' + r.x + '..' + (r.x + r.width); })(), exth: !sr.getElementById('g-ext-h').classList.contains('hidden'), ext: (sr.getElementById('g-ext').parentNode.id) + ' ' + sr.getElementById('g-ext').getAttribute('transform'), gate: t('t-gate') + ' eh=' + sr.getElementById('sv-e').getAttribute('height'), al: (() => { const g = sr.getElementById('g-alarm'); return (g.classList.contains('hidden') ? 'hidden ' : '') + (g.style.getPropertyValue('--c') || 'nocol') + ' d=' + sr.getElementById('alarm-ico').getAttribute('d').slice(0, 18); })(), loc: t('n-locale') + '|' + t('t-loc-t') + '|' + t('t-loc-h') + ' vis=' + !sr.getElementById('g-locale').classList.contains('hidden'), sent: t('t-sent') + ' / ' + t('t-sent-kwh'), ws: f('ws'), w: ['wa', 'wb', 'wout'].map((x) => x + ':' + f(x)).join(' '),
        e: ['e_sh', 'e_gh', 'e_gb', 'e_bh', 'e_sb'].map((x) => x + ':' + f(x)).join(' ') };
    });
    console.log('==', name, JSON.stringify(r));
    if (logs.length) console.log(logs.join('\n'));
    await (await p.$('pdc-flow-card')).screenshot({ path: path.join(D, 'out', `${name}.png`) });
    await p.close();
  }
  await b.close();
})();
