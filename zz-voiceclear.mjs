// SCRATCH: stale clips cleared, the three-way choice, re-run and reset clear voices (services faked)
import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
let bucket = new Set(['Ldeadbeef', 'Ldeadbee2']), clears = [], forces = [];
await page.route(/./, async r => {
  const q = r.request(), u = q.url(), pd = q.postData() || '';
  if (q.method() === 'POST' && pd.includes('"voice-direction"')) { const j = JSON.parse(pd); return r.fulfill({ json: { ok: true, directions: j.lines.map(l => ({ i: l.i, d: 'speak smugly' })) } }); }
  if (/\/api\/voice\/voices/.test(u)) return r.fulfill({ json: { ok: true, voices: Object.fromEntries(['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro', 'Chris'].map(n => [n, 'ws__' + n])) } });
  if (/\/api\/voice\/clear/.test(u)) { const j = JSON.parse(pd); clears.push({ episode: j.episode, from: j.from, keep: j.keep ? j.keep.length : undefined }); if (j.keep) { const k = new Set(j.keep); bucket = new Set([...bucket].filter(x => k.has(x))); } else bucket.clear(); return r.fulfill({ json: { ok: true, deleted: 1 } }); }
  if (/\/api\/voice\/render$/.test(u)) { const j = JSON.parse(pd); forces.push(!!j.force); j.lines.forEach(l => bucket.add(l.id)); return r.fulfill({ json: { ok: true, done: j.lines.map(l => l.id), failed: [], chars: 1 } }); }
  if (/\/api\/voice\/list/.test(u)) return r.fulfill({ json: { ok: true, ids: [...bucket] } });
  return r.continue();
});
page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
await page.evaluate(async () => {
  localStorage.setItem('studio_api_token', 'TEST');
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Clr', setting: 'hosted-camp', teams: 2, mergeAt: 10 });
  ss.initGameState(); window.gs = core.gs; window.simulateNext(); window.simulateNext();
  window.viewEpisode(1);
});
await page.waitForTimeout(800);
const box = () => page.evaluate(() => (document.getElementById('td-voicing')?.innerText || '').replace(/\s+/g, ' '));
const waitBox = async re => { for (let k = 0; k < 120; k++) { const t = await box(); if (re.test(t)) return t; await page.waitForTimeout(250); } return '(timeout) ' + await box(); };
// a "new" episode 1 whose number holds two clips of a deleted one
await page.evaluate(() => window.renderSeasonHub()); await page.waitForTimeout(600);
console.log('button with only stale clips:', await page.evaluate(() => document.getElementById('hub-voice')?.textContent));
await page.evaluate(() => { window.voiceSelectedEpisode(1); });
console.log('choice:', await waitBox(/Cancel/));
console.log('stale clears so far:', JSON.stringify(clears));
await page.click('#td-voicing button[data-k="0"]');
console.log('-> after choosing the first option:', await waitBox(/voiced|failed/), '| force sent:', JSON.stringify(forces.slice(-1)));
await page.evaluate(() => { document.getElementById('td-voicing')?.remove(); window.renderSeasonHub(); }); await page.waitForTimeout(600);
await page.evaluate(() => { window.voiceSelectedEpisode(1); });
console.log('choice when all voiced:', await waitBox(/Cancel/));
await page.click('#td-voicing button[data-k="0"]');
console.log('-> revoice all:', (await waitBox(/voiced|failed/)).slice(0, 60), '| force sent:', JSON.stringify(forces.slice(-1)));
// a re-run of episode 1 and a reset
clears = [];
await page.evaluate(() => { window.replayEpisode(1); }); await page.waitForTimeout(3000);
console.log('re-run of EP 1 cleared:', JSON.stringify(clears.map(c => ({ ...c, keep: c.keep === undefined ? 'none given' : c.keep + ' ids kept' }))));
clears = [];
await page.evaluate(async () => { const ss = await import('./js/savestate.js'); ss.resetSeason(); }); await page.waitForTimeout(800);
console.log('reset cleared:', JSON.stringify(clears));
console.log('errors', errs.length ? errs : 'none'); await b.close();
