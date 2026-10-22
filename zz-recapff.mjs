// SCRATCH (not committed): screenshot the "Previously on" cards. node zz-recapshot.mjs [setting] [ep]
import { firefox as chromium } from 'playwright';
import fs from 'fs';
const [setting = 'survival-island', epS = '4'] = process.argv.slice(2); const at = +epS;
fs.mkdirSync('shots/recap-ff', { recursive: true });
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(3000);
await page.evaluate(async ({ setting, at }) => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Playtest', setting, teams: 2, mergeAt: 10, twistSchedule: [] });
  ss.initGameState();
  for (let i = 0; i < at; i++) { window.gs = core.gs; epm.simulateEpisode(); }
}, { setting, at });
await page.evaluate(n => window.openVisualPlayer(n), at); await page.waitForTimeout(1500);
const uid = await page.evaluate(() => document.querySelector('.tdx')?.dataset.uid || null);
let last = '';
for (let i = 0; i < 40 && uid; i++) {
  await page.evaluate(u => window.tdxNext(u), uid); await page.waitForTimeout(1300);
  const sig = await page.evaluate(() => { const b = document.querySelector('.tdx-board'); return b ? b.className : document.querySelector('.tdx-tb') ? 'tb:' + (document.querySelector('.tdx-loc .place')?.innerText || '') : ''; });
  if (sig && sig !== last) { last = sig; await page.locator('.tdx').first().screenshot({ path: `shots/recap-ff/${setting}-${i}-${sig.replace(/[^a-z0-9]+/gi, '_').slice(0, 30)}.png` }); console.log(i, sig); }
  if (await page.evaluate(() => !document.querySelector('.tdx-board') && !document.querySelector('.tdx-tb')) && i > 8) break;
}
console.log('errors', errs.length ? errs.join('\n') : 'none');
await b.close();
