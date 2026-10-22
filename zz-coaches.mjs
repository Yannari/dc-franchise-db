import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200))); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 160)); });
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
const r = await page.evaluate(async mode => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro', 'Chris'].slice(0, 16);
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers', isReturnee: i < 4 })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Coach', setting: 'hosted-camp', teams: 2, mergeAt: 8, coaches: mode, coachesPerTribe: 1 });
  ss.initGameState(); window.gs = core.gs; epm.simulateEpisode();
  const ep = core.gs.episodeHistory[0];
  return { coaches: (core.gs.coaches || []).map(c => `${c.name}→${c.tribe}`), active: core.gs.activePlayers.length, isCoaches: ep.isCoaches, arrivals: (ep.coachArrivals || []).length,
    coachKeys: Object.keys(ep).filter(k => /coach/i.test(k)).map(k => `${k}:${Array.isArray(ep[k]) ? ep[k].length : typeof ep[k]}`) };
}, 'auto');
console.log(JSON.stringify(r, null, 1));
const screens = await page.evaluate(() => { window.openVisualPlayer(1); return new Promise(res => setTimeout(() => res((window.vpScreens || []).map(s => s.id).join(' ')), 1500)); });
console.log('screens:', screens);
console.log('errors', errs.length ? [...new Set(errs)].slice(0, 6) : 'none'); await b.close();
