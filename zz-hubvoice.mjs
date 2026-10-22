// SCRATCH: the Run tab's Voice / Revoice button, the bucket faked
import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
let voiced = [], renderForce = null, confirmText = null;
await page.route(/./, async r => {
  const u = r.request().url();
  if (/\/api\/voice\/list/.test(u)) return r.fulfill({ json: { ok: true, ids: voiced } });
  if (/\/api\/voice\/render/.test(u)) { renderForce = JSON.parse(r.request().postData()).force; return r.fulfill({ json: { ok: true, done: [], failed: [], chars: 0 } }); }
  return r.continue();
});
page.on('dialog', d => { if (d.type() === 'confirm') confirmText = d.message().slice(0, 90); d.dismiss(); });
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
await page.evaluate(async () => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Hub', setting: 'hosted-camp', teams: 2, mergeAt: 10 });
  ss.initGameState(); window.gs = core.gs; epm.simulateEpisode();
});
const label = async () => { await page.evaluate(() => window.renderSeasonHub()); await page.waitForTimeout(600); return page.evaluate(() => document.getElementById('hub-voice')?.textContent || '(no button)'); };
console.log('row:', await page.evaluate(() => { window.renderSeasonHub(); return [...document.querySelectorAll('.hub-secondary-actions button')].map(x => x.textContent.trim()).join(' | '); }));
console.log('not voiced yet ->', await label());
voiced = ['L00000001'];
await page.evaluate(async () => { const m = await import('./js/vp-td-ep/sound.js'); m.voicedLines(1, true); });
console.log('voiced        ->', await label());
await page.evaluate(() => window.voiceLatestEpisode(1)); await page.waitForTimeout(800);
console.log('render sent after saying no:', renderForce === null ? 'nothing (good)' : renderForce);
console.log('confirm asked :', confirmText);
console.log('errors', errs.length ? errs : 'none'); await b.close();
