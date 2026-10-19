// Click through every step of some Ridonculous Race episodes in a real browser, the way a viewer does
// (each step fresh), and print every page error. Also counts what moved: steps with a crowd on screen,
// close-ups, reactions.
//   (serve the repo: python -m http.server 8765)   node tools/rr-vp-walk.mjs [seed] [teams] [eps]
import { chromium } from 'playwright';

const [seed = '8', teams = '12', epList = '1,2,5'] = process.argv.slice(2);
const base = process.env.RR_URL || 'http://127.0.0.1:8765/rr.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e.stack || e)));
page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
for (const n of epList.split(',').map(Number)) {
  await page.goto(`${base}?seed=${seed}&teams=${teams}&ep=${n}&step=0`);
  await page.waitForFunction(() => window.__rr?.ep, null, { timeout: 60000 });
  const r = await page.evaluate(async () => {
    const R = window.__rr, out = { steps: R.flat.length, crowd: 0, close: 0, two: 0, follow: 0, react: 0, maxCrowd: 0 };
    for (let k = 0; k < R.flat.length; k++) {
      R.step(k, true);
      const n = document.querySelectorAll('#rr-stage [data-crowd]').length;
      if (n) out.crowd++;
      out.maxCrowd = Math.max(out.maxCrowd, n);
      const sh = document.getElementById('rr-cam').dataset.shot;
      if (sh && out[sh] != null) out[sh]++;
      const f = R.flat[k]; if (R.ep.screens[f.si].steps[f.idx].react) out.react++;
      if (k % 25 === 0) await new Promise(r => setTimeout(r, 30));
    }
    return out;
  });
  console.log(`ep ${n}:`, JSON.stringify(r));
}
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].slice(0, 20).join('\n') : 'no errors');
await browser.close();
