// SCRATCH: background lines (tdEpisodeLines) vs the viewer's own (recordEpisodeLines), episode by episode
import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
const EPS = +process.argv[2] || 4;
await page.evaluate(async EPS => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'BG', setting: 'hosted-camp', teams: 2, mergeAt: 10, romance: 'enabled' });
  ss.initGameState(); window.gs = core.gs; for (let i = 0; i < EPS; i++) epm.simulateEpisode();
}, EPS);
for (let ep = 1; ep <= EPS; ep++) {
  const r = await page.evaluate(async ep => {
    const scr = await import('./js/vp-td-ep/screens.js'), snd = await import('./js/vp-td-ep/sound.js');
    const rec = window.gs.episodeHistory.find(e => +e.num === ep);
    const t = performance.now(); const bg = scr.tdEpisodeLines(rec); const ms = Math.round(performance.now() - t);
    const vw = await snd.recordEpisodeLines(ep);
    const a = new Set(bg.map(l => l.id)), v = new Set(vw.map(l => l.id));
    const onlyBg = bg.filter(l => !v.has(l.id)), onlyVw = vw.filter(l => !a.has(l.id));
    return { ep, bg: bg.length, viewer: vw.length, ms, onlyBg: onlyBg.slice(0, 2).map(l => `${l.screen} ${l.by}: ${l.text.slice(0, 50)}`), onlyBgN: onlyBg.length, onlyVw: onlyVw.slice(0, 2).map(l => `${l.screen} ${l.by}: ${l.text.slice(0, 50)}`), onlyVwN: onlyVw.length };
  }, ep);
  console.log(`EP ${r.ep}: background ${r.bg} lines in ${r.ms} ms, viewer ${r.viewer} | only background ${r.onlyBgN}, only viewer ${r.onlyVwN}`, r.onlyBgN || r.onlyVwN ? JSON.stringify({ bg: r.onlyBg, viewer: r.onlyVw }) : '');
}
// an episode open on screen is left alone
const disturb = await page.evaluate(async () => {
  window.openVisualPlayer(2); await new Promise(r => setTimeout(r, 1200));
  window.vpCurrentScreen = 2; window.renderVPScreen(); await new Promise(r => setTimeout(r, 500));
  const uid = document.querySelector('.tdx')?.dataset.uid; for (let k = 0; k < 4; k++) window.tdxNext(uid);
  const before = { screens: window.vpScreens.length, cur: window.vpCurrentScreen, idx: window._tdx[uid]?.idx };
  const scr = await import('./js/vp-td-ep/screens.js'); scr.tdEpisodeLines(window.gs.episodeHistory.find(e => e.num === 2));
  const after = { screens: window.vpScreens.length, cur: window.vpCurrentScreen, idx: window._tdx[uid]?.idx };
  return { before, after, same: JSON.stringify(before) === JSON.stringify(after) };
});
console.log('open episode undisturbed:', JSON.stringify(disturb));
console.log('errors', errs.length ? errs : 'none'); await b.close();
