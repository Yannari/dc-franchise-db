import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.route(/\/api\/voice\/list/, r => r.fulfill({ json: { ok: true, ids: r.request().url().includes('episode=2') ? ['L00000001'] : [] } }));
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
await page.evaluate(async () => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Sel', setting: 'hosted-camp', teams: 2, mergeAt: 10 });
  ss.initGameState(); window.gs = core.gs; for (let i = 0; i < 3; i++) epm.simulateEpisode();
});
for (const ep of [3, 1, 2]) {
  await page.evaluate(ep => window.viewEpisode(ep), ep); await page.waitForTimeout(700);
  console.log(`selected EP ${ep} -> button:`, await page.evaluate(() => { const x = document.getElementById('hub-voice'); return `${x?.textContent} (voices episode ${x?.dataset.ep})`; }));
}
console.log('errors', errs.length ? errs : 'none'); await b.close();
