// SCRATCH: does moving on stop the voice that is playing? (the user: "when I pass a dialogue the sound continues")
import { chromium } from 'playwright';
import fs from 'fs';
const save = fs.readFileSync('assets/audio/td/vo-test/season-vo-test.json', 'utf8');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500); await page.mouse.click(5, 5);
await page.evaluate(async s => {
  const cast = await import('./js/cast-ui.js'); cast._applySeasonSave(JSON.parse(s));
  // every buffer source the voice starts, and whether it is still sounding
  window.__live = new Set(); const st = AudioBufferSourceNode.prototype.start, sp = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.duration > 0.6 && this.buffer.duration < 20 && !this.loop) { window.__live.add(this); this.addEventListener('ended', () => window.__live.delete(this)); } return st.apply(this, a); };
  AudioBufferSourceNode.prototype.stop = function (...a) { window.__live.delete(this); return sp.apply(this, a); };
  window.__clips = []; window.__tdClip = id => window.__clips.push(id);
}, save);
await page.waitForTimeout(1200);
await page.evaluate(() => window.openVisualPlayer(2)); await page.waitForTimeout(1500);
const uid = await page.evaluate(() => document.querySelector('.tdx')?.dataset.uid);
const step = async how => { await page.evaluate(([u, h]) => h === 'back' ? window.tdxBack(u) : h === 'all' ? window.tdxAll(u) : window.tdxNext(u), [uid, how]); await page.waitForTimeout(150); };
// walk until a clip plays, then try each way of moving on
const playing = async () => { for (let k = 0; k < 40; k++) { const n = await page.evaluate(() => window.__clips.length); await step('next'); await page.waitForTimeout(900); if ((await page.evaluate(() => window.__clips.length)) > n) return true; } return false; };
for (const how of ['next', 'back', 'all']) {
  if (!(await playing())) { console.log('no clip found'); break; }
  const before = await page.evaluate(() => window.__live.size);
  await step(how); await page.waitForTimeout(300);
  console.log(`${how.padEnd(5)}: voices sounding before ${before}, after ${await page.evaluate(() => window.__live.size)}`);
}
await b.close();
