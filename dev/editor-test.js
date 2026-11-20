// mostra l'albero dei campi dell'editor visuale e prova toForm/fromForm (ha-form finto)
const { chromium } = require('playwright');
const path = require('path');
const FILE = path.join(__dirname, '..', 'pdc-flow-card.js');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.setContent(`<script>customElements.define('ha-card', class extends HTMLElement {}); customElements.define('ha-form', class extends HTMLElement {});</script>`);
  await p.addScriptTag({ path: FILE });
  const r = await p.evaluate(() => {
    const ed = document.createElement('pdc-flow-card-editor');
    document.body.appendChild(ed);
    ed.setConfig({ type: 'custom:pdc-flow-card', entities: {}, utenze: [{ entity: 'sensor.a' }] });
    ed.hass = { states: {} };
    const sch = ed.querySelector('ha-form').schema;
    const names = []; const tree = [];
    const walk = (list, depth) => list.forEach((x) => { if (x.type === 'expandable') { tree.push('  '.repeat(depth) + '▸ ' + x.title); walk(x.schema, depth + 1); } else { names.push(x.name); tree.push('  '.repeat(depth) + '· ' + x.name); } });
    walk(sch, 0);
    const E = customElements.get('pdc-flow-card-editor');
    const cfg = { type: 'custom:pdc-flow-card', animazioni_sempre: true, entities: { acqua_valvola: 'switch.v', temperatura_esterna: 'sensor.t', fv_potenza: 'sensor.fv' }, acqua_portata_unita: 'L/h', colori: { casa: 'red' } };
    const out = E.fromForm({ ...E.toForm(cfg) }, cfg);
    return { n: names.length, dup: names.filter((x, i) => names.indexOf(x) !== i), tree, order: Object.keys(out).join(', ') };
  });
  console.log(r.tree.join('\n'));
  console.log('\ncampi:', r.n, r.dup.length ? 'DUPLICATI: ' + r.dup.join(', ') : '(nessun duplicato)');
  console.log('ordine config dopo il giro editor:', r.order);
  console.log(errs.length ? 'ERRORI:\n' + errs.join('\n') : 'nessun errore');
  await b.close();
})();
