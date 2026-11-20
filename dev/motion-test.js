// controlla le animazioni con e senza "riduci animazioni" (prefers-reduced-motion)
const { chromium } = require('playwright');
const path = require('path');
const D = __dirname;
(async () => {
  const b = await chromium.launch();
  for (const rm of ['no-preference', 'reduce']) for (const sempre of [false, true]) {
    const p = await b.newPage({ reducedMotion: rm });
    await p.goto('file://' + path.join(D, 'test-page.html'));
    const r = await p.evaluate(async (sempre) => {
      const card = document.createElement('pdc-flow-card');
      card.setConfig({ type: 'custom:pdc-flow-card', demo: true, entities: {}, ...(sempre ? { animazioni_sempre: true } : {}) });
      document.getElementById('box').appendChild(card);
      card.hass = { states: {}, locale: { language: 'it' } };
      await new Promise((r) => setTimeout(r, 500));
      const sr = card.shadowRoot;
      const d = sr.querySelector('.flow.on .dots'); const fan = sr.querySelector('.run .fan, .run .imp, .run .rays');
      return { dots: d && getComputedStyle(d).animationName, other: fan && getComputedStyle(fan).animationName };
    }, sempre);
    console.log(rm, 'animazioni_sempre=' + sempre, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
