// SCRATCH: is the Voice button there without a token, on every kind of TD screen? does it ask for the token?
import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
let asked = null; page.on('dialog', d => { if (d.type() === 'prompt') { asked = d.message().slice(0, 60); d.dismiss(); } else d.accept(); });
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
await page.evaluate(async () => {
  localStorage.removeItem('studio_api_token');
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Btn', setting: 'hosted-camp', teams: 2, mergeAt: 10 });
  ss.initGameState(); window.gs = core.gs; epm.simulateEpisode();
});
await page.evaluate(() => window.openVisualPlayer(1)); await page.waitForTimeout(1500);
const ids = await page.evaluate(() => (window.vpScreens || []).map(s => s.id));
for (let i = 0; i < ids.length; i++) {
  await page.evaluate(i => { window.vpCurrentScreen = i; window.renderVPScreen(); }, i); await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({ td: !!document.querySelector('.tdx'), map: !!document.querySelector('.tdm-root'), btn: !!document.querySelector('button[onclick="tdVoiceEpisode()"]') }));
  if (r.td) console.log(`${ids[i].padEnd(20)} ${r.map ? 'map   ' : 'screen'} button: ${r.btn}`);
}
await page.click('button[onclick="tdVoiceEpisode()"]'); await page.waitForTimeout(500);
console.log('clicked without a token -> asks:', asked);
console.log('errors', errs.length ? errs : 'none'); await b.close();
