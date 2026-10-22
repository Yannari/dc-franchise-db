// SCRATCH (not committed): play a twist's episode in the browser, step through every screen,
// collect page errors, screenshot the stepped screens. node zz-twistplay.mjs <twist[@ep]> [setting] [extra json]
import { chromium } from 'playwright';
import fs from 'fs';
const [spec = 'open-vote@4', setting = 'hosted-camp', extraJson = '{}'] = process.argv.slice(2);
const [twist, epS] = spec.split('@'); const at = +epS || 4;
const extra = JSON.parse(extraJson);
fs.mkdirSync('shots/twists', { recursive: true });
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', e => { errs.push('pageerror: ' + String(e).slice(0, 300)); console.log('  !! ' + String(e).slice(0, 200)); });
page.on('console', m => { if (m.type() === 'error' && !/favicon|404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(3000);
const made = await page.evaluate(async ({ setting, twist, at, extra }) => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Playtest', setting, teams: 2, mergeAt: 10, romance: 'enabled', popularityEnabled: true, twistSchedule: [{ episode: at, type: twist }], ...extra });
  ss.initGameState();
  for (let i = 0; i < at; i++) { window.gs = core.gs; epm.simulateEpisode(); }
  const ep = core.gs.episodeHistory.find(e => e.num === at);
  return { ok: !!ep, twists: (ep?.twists || []).map(t => t.type).join(',') };
}, { setting, twist, at, extra });
console.log('season', JSON.stringify(made));
await page.evaluate(n => window.openVisualPlayer(n), at); await page.waitForTimeout(1500);
const screens = await page.evaluate(() => (window.vpScreens || []).map(s => s.id));
console.log('screens', screens.join(' '));
let shots = 0;
for (let si = 0; si < screens.length; si++) {
  await page.evaluate(i => { window.vpCurrentScreen = i; window.renderVPScreen(); }, si); await page.waitForTimeout(700);
  const uid = await page.evaluate(() => document.querySelector('.tdx')?.dataset.uid || null);
  if (!uid) continue;
  const isMap = await page.evaluate(() => !!document.querySelector('.tdm-root'));
  let n = 0;
  for (; n < (isMap ? 40 : 400); n++) {
    const before = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx || '', uid);
    await page.evaluate(u => window.tdxNext(u), uid); await page.waitForTimeout(isMap ? 120 : 70);
    if (n === 6 || n === 20) { await page.locator('.tdx').first().screenshot({ path: `shots/twists/${twist}-${screens[si]}-${n}.png` }).catch(() => {}); shots++; }
    const after = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx || '', uid);
    const done = await page.evaluate(() => /Next screen|End of episode/i.test(document.querySelector('.tdx-dlg')?.innerText || '') || !!document.querySelector('.tdx-end.on'));
    if (!isMap && before === after && n > 3) break;
    if (done) break;
  }
  console.log(`  ${screens[si]}: ${n} steps`);
}
if (process.env.DUMP) { const t = await page.evaluate(id => { const S = (window.vpScreens || []).find(s => s.id === id); return S ? (S.tdSteps || S._td?.steps || null) : null; }, process.env.DUMP); }
console.log('errors', errs.length ? '\n' + [...new Set(errs)].slice(0, 12).join('\n') : 'none');
await b.close();
