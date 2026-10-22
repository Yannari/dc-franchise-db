// SCRATCH: the Voice button end to end, with the director, the render and the bucket faked (no money, no writes)
import { chromium } from 'playwright';
import fs from 'fs';
const save = fs.readFileSync('assets/audio/td/vo-test/season-vo-test.json', 'utf8');
const sample = fs.readFileSync(fs.readdirSync('assets/audio/td/vo-test').filter(f => f.endsWith('.mp3')).map(f => 'assets/audio/td/vo-test/' + f)[0]);
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const bucket = new Set(); let dirCalls = 0, dirLines = 0, renderCalls = 0, sample1 = null, renderBody = null;
await page.route(/./, async r => {
  const q = r.request(), u = q.url(), pd = q.postData() || '';
  if (q.method() === 'POST' && pd.includes('"voice-direction"')) { dirCalls++; const j = JSON.parse(pd); dirLines += j.lines.length; sample1 ??= j.lines.find(l => l.prev); return r.fulfill({ json: { ok: true, directions: j.lines.map(l => ({ i: l.i, d: l.kind === 'conf' ? 'speak candidly' : 'speak smugly' })) } }); }
  if (/\/api\/voice\/render$/.test(u)) { renderCalls++; const j = JSON.parse(pd); renderBody ??= { auth: q.headers()['authorization'], season: j.season, episode: j.episode, line: j.lines[0] }; j.lines.forEach(l => bucket.add(l.id)); return r.fulfill({ json: { ok: true, done: j.lines.map(l => l.id), failed: [], chars: j.lines.reduce((a, l) => a + l.text.length + 16, 0) } }); }
  if (/\/api\/voice\/list/.test(u)) return r.fulfill({ json: { ok: true, ids: [...bucket] } });
  if (/\/audio\/voice\//.test(u)) return r.fulfill({ body: sample, headers: { 'Content-Type': 'audio/mpeg', 'Access-Control-Allow-Origin': '*' } });
  return r.continue();
});
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500); await page.mouse.click(5, 5);
await page.evaluate(async s => { localStorage.setItem('studio_api_token', 'TEST'); const c = await import('./js/cast-ui.js'); c._applySeasonSave(JSON.parse(s)); }, save);
page.on('dialog', d => d.accept());
await page.waitForTimeout(1200);
await page.evaluate(() => window.openVisualPlayer(2)); await page.waitForTimeout(1500);
console.log('Voice button shown:', await page.evaluate(() => !!document.querySelector('button[onclick="tdVoiceEpisode()"]')));
const t = Date.now();
await page.evaluate(() => window.tdVoiceEpisode(2));
console.log('panel:', (await page.textContent('#td-voicing')).replace(/\s+/g, ' ').slice(0, 200));
console.log(`director: ${dirCalls} calls, ${dirLines} lines | render: ${renderCalls} calls, ${bucket.size} lines | ${Math.round((Date.now() - t) / 1000)}s`);
console.log('a director line:', JSON.stringify(sample1));
console.log('a render request:', JSON.stringify(renderBody));
// the episode now plays from the bucket
await page.evaluate(() => { window.__clips = []; window.__tdClip = id => window.__clips.push(id); });
await page.evaluate(() => window.openVisualPlayer(2)); await page.waitForTimeout(1200);
const uid = await page.evaluate(() => document.querySelector('.tdx')?.dataset.uid);
for (let k = 0; k < 30 && !(await page.evaluate(() => window.__clips.length)); k++) { await page.evaluate(u => window.tdxNext(u), uid); await page.waitForTimeout(700); }
console.log('played from the bucket:', await page.evaluate(() => window.__clips.slice(0, 3)));
console.log('again: second press pays for nothing ->');
await page.evaluate(() => window.tdVoiceEpisode(2));
console.log('  panel:', (await page.textContent('#td-voicing')).replace(/\s+/g, ' ').slice(0, 120), '| render calls total', renderCalls);
console.log('errors', errs.length ? errs : 'none');
await b.close();
