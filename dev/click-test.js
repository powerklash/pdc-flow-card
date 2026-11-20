// controlla che i pulsanti delle prese chiamino homeassistant.toggle
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'test-page.html'));
  const r = await p.evaluate(async () => {
    const calls = []; const S_ = (s) => ({ state: s, attributes: {} });
    const card = document.createElement('pdc-flow-card');
    card.setConfig({ type: 'custom:pdc-flow-card', entities: { casa_potenza: 'sensor.h', tettoia_prese: 'switch.t1', ingresso_prese: 'switch.t2' } });
    document.getElementById('box').appendChild(card);
    card.hass = { states: { 'sensor.h': { state: '1', attributes: { unit_of_measurement: 'kW' } }, 'switch.t1': S_('on'), 'switch.t2': S_('off') }, locale: { language: 'it' }, callService: (d, s, data) => calls.push([d, s, data.entity_id]) };
    let more = null; card.addEventListener('hass-more-info', (e) => (more = e.detail.entityId));
    await new Promise((r) => setTimeout(r, 300));
    const sr = card.shadowRoot;
    sr.querySelector('[data-toggle="ingresso_prese"] circle').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    sr.querySelector('[data-toggle="tettoia_prese"] circle').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    return { calls, more, t1: sr.getElementById('tt1-t').textContent, t2: sr.getElementById('tt2-t').textContent };
  });
  console.log(JSON.stringify(r)); await b.close();
})();
