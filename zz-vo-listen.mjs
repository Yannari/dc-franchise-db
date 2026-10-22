// SCRATCH: with a clip in vo-test/, does the viewer actually play it (audio unlocked, imported season)?
import { chromium } from 'playwright';
import fs from 'fs';
const save = fs.readFileSync('assets/audio/td/vo-test/season-vo-test.json', 'utf8');
const want = process.argv[2];
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
await page.mouse.click(5, 5); await page.waitForTimeout(500);   // the click that unlocks sound
await page.evaluate(async s => { const cast = await import('./js/cast-ui.js'); cast._applySeasonSave(JSON.parse(s)); window.__clips = []; window.__tdClip = id => window.__clips.push(id); }, save);
await page.waitForTimeout(1200);
const audioState = await page.evaluate(async () => { const { audio } = await import('./js/audio.js'); return { out: !!audio.output(), muted: audio._muted, unlocked: audio._unlocked }; });
console.log('audio', JSON.stringify(audioState));
await page.evaluate(() => window.openVisualPlayer(2)); await page.waitForTimeout(1500);
const screens = await page.evaluate(() => (window.vpScreens || []).length);
outer: for (let si = 0; si < screens; si++) {
  await page.evaluate(i => { window.vpCurrentScreen = i; window.renderVPScreen(); }, si); await page.waitForTimeout(500);
  const uid = await page.evaluate(() => document.querySelector('.tdx')?.dataset.uid || null); if (!uid) continue;
  const isMap = await page.evaluate(() => !!document.querySelector('.tdm-root'));
  for (let n = 0; n < (isMap ? 60 : 400); n++) {
    const a = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx, uid); await page.evaluate(u => window.tdxNext(u), uid); await page.waitForTimeout(isMap ? 120 : 80);
    if ((await page.evaluate(() => window.__clips.length))) break outer;
    const z = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx, uid); if (!isMap && a === z && n > 3) break;
  }
}
await page.waitForTimeout(800);
console.log('clips played', JSON.stringify(await page.evaluate(() => window.__clips)), 'expected', want, 'errors', errs.length ? errs : 'none');
await b.close();
