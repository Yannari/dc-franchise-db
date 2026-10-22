// SCRATCH: the background voicing, faked services: first voice, a half-done episode, a complete one
import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const bucket = new Set(); let refuse = 0, maxAtOnce = 0, inFlight = 0, sentForce = [];
await page.route(/./, async r => {
  const q = r.request(), u = q.url(), pd = q.postData() || '';
  if (q.method() === 'POST' && pd.includes('"voice-direction"')) { const j = JSON.parse(pd); return r.fulfill({ json: { ok: true, directions: j.lines.map(l => ({ i: l.i, d: 'speak smugly' })) } }); }
  if (/\/api\/voice\/voices/.test(u)) return r.fulfill({ json: { ok: true, voices: Object.fromEntries(['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro', 'Chris'].map(n => [n, 'ws__' + n.toLowerCase()])) } });
  if (/\/api\/voice\/render$/.test(u)) {
    inFlight++; maxAtOnce = Math.max(maxAtOnce, inFlight); await new Promise(x => setTimeout(x, 30)); inFlight--;
    const j = JSON.parse(pd); sentForce.push(!!j.force);
    // the first run: refuse a third of the lines, like the real 429s
    const done = [], failed = []; for (const l of j.lines) { if (refuse && Math.random() < .33) failed.push({ id: l.id, error: 'inworld 429' }); else { bucket.add(l.id); done.push(l.id); } }
    return r.fulfill({ json: { ok: true, done, failed, chars: done.length * 60 } });
  }
  if (/\/api\/voice\/list/.test(u)) return r.fulfill({ json: { ok: true, ids: [...bucket] } });
  return r.continue();
});
const asked = []; page.on('dialog', d => { asked.push(d.message().split('\n')[0] + ' / ' + (d.message().split('\n')[2] || '').slice(0, 60)); d.accept(); });
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
await page.evaluate(async () => {
  localStorage.setItem('studio_api_token', 'TEST');
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'BGV', setting: 'hosted-camp', teams: 2, mergeAt: 10 });
  ss.initGameState(); window.gs = core.gs; epm.simulateEpisode(); window.renderSeasonHub();
});
const run = async label => {
  const t = Date.now();
  await page.evaluate(() => window.voiceSelectedEpisode(1));
  for (let k = 0; k < 120 && !(await page.evaluate(() => /voiced|Nothing|failed/.test(document.getElementById('td-voicing')?.textContent || ''))); k++) await page.waitForTimeout(250);
  await page.evaluate(() => window.renderSeasonHub()); await page.waitForTimeout(400);
  console.log(`${label}: ${(Date.now() - t) / 1000}s | box: ${(await page.textContent('#td-voicing').catch(() => '')).replace(/\s+/g, ' ').replace('Close', '').slice(0, 110)} | button: ${await page.evaluate(() => document.getElementById('hub-voice')?.textContent)} | viewer opened: ${await page.evaluate(() => !!document.querySelector('.tdx'))}`);
  await page.evaluate(() => document.getElementById('td-voicing')?.remove());
};
refuse = 1; await run('1st voice (a third refused)');
refuse = 0; await run('2nd press (half done)    ');
await run('3rd press (all voiced)   ');
console.log('asked:', asked);
console.log('render requests at once, max:', maxAtOnce, '| force sent on the full revoice only:', JSON.stringify([...new Set(sentForce)]));
console.log('errors', errs.length ? errs : 'none'); await b.close();
