const { chromium } = require('playwright');
const path = require('path');
// rigenera images/esempio.png (immagine del README) dalla demo della card
const D = __dirname;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 452, height: 1100 }, deviceScaleFactor: 2, timezoneId: 'Europe/Rome' });
  await p.goto('file://' + path.join(D, 'test-page.html'));
  await p.evaluate(() => {
    const card = document.createElement('pdc-flow-card');
    card.setConfig({ type: 'custom:pdc-flow-card', demo: true, entities: {} });
    document.getElementById('box').appendChild(card);
    card.hass = { states: {}, locale: { language: 'it', number_format: 'language' } };
  });
  await p.waitForTimeout(900);
  await (await p.$('pdc-flow-card')).screenshot({ path: path.join(D, '..', 'images', 'esempio.png') });
  await b.close();
})();
