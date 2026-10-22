// SCRATCH (not committed): the Studio's camp kit panel, TD vs BB. node zz-kitstudio.mjs
import { chromium } from 'playwright';
import fs from 'fs';
fs.mkdirSync('shots/kit', { recursive: true });
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(3000);
for (const fmt of ['total-drama', 'big-brother']) {
  await page.evaluate(f => { window.seasonConfig = { ...window.seasonConfig, format: f }; }, fmt);
  await page.evaluate(() => { document.querySelector('[data-tab="cast"], #tab-btn-cast, button[onclick*="cast"]')?.click(); });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('[data-mode="create"]')?.click()); await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector('#st-new')?.click()); await page.waitForTimeout(800);
  const has = await page.evaluate(() => !!document.querySelector('.st-kit'));
  console.log(fmt, 'kit panel:', has);
  if (has) {
    await page.evaluate(() => { const d = document.querySelector('.st-kit'); d.open = true; d.scrollIntoView(); });
    await page.locator('[data-kit="thing"]').fill('baking');
    await page.locator('[data-kit-bit="0"][data-part="bit"]').fill('I made muffins for everyone.');
    await page.waitForTimeout(300);
    console.log('count:', await page.evaluate(() => document.querySelector('#st-kit-count')?.textContent));
    await page.locator('.st-kit').screenshot({ path: 'shots/kit/panel.png' }).catch(() => {});
  }
}
console.log('errors', errs.length ? errs.join('\n') : 'none');
await b.close();
