// SCRATCH: does the imported season replay the same lines (same ids)?
import { chromium } from 'playwright';
import fs from 'fs';
const want = JSON.parse(fs.readFileSync('assets/audio/td/vo-test/script.json', 'utf8')).lines.map(l => l.id);
const save = fs.readFileSync('assets/audio/td/vo-test/season-vo-test.json', 'utf8');
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
page.on('dialog', d => d.accept());
await page.evaluate(async s => { const cast = await import('./js/cast-ui.js'); cast._applySeasonSave(JSON.parse(s)); window.__lines = []; window.__tdLine = (by, text, id) => window.__lines.push(id); }, save);
await page.waitForTimeout(1500);
await page.evaluate(() => window.openVisualPlayer(2)); await page.waitForTimeout(1500);
const screens = await page.evaluate(() => (window.vpScreens || []).length);
for (let si = 0; si < screens; si++) {
  await page.evaluate(i => { window.vpCurrentScreen = i; window.renderVPScreen(); }, si); await page.waitForTimeout(500);
  const uid = await page.evaluate(() => document.querySelector('.tdx')?.dataset.uid || null); if (!uid) continue;
  const isMap = await page.evaluate(() => !!document.querySelector('.tdm-root'));
  for (let n = 0; n < (isMap ? 60 : 400); n++) { const a = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx, uid); await page.evaluate(u => window.tdxNext(u), uid); await page.waitForTimeout(isMap ? 90 : 40); const z = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx, uid); if (!isMap && a === z && n > 3) break; }
}
const got = new Set(await page.evaluate(() => window.__lines));
console.log('replayed', got.size, 'lines; script lines found', want.filter(i => got.has(i)).length, '/', want.length, '; missing', want.filter(i => !got.has(i)));
await b.close();
