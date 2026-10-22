import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const alerts = []; page.on('dialog', d => { alerts.push(d.message().split('\n')[0].slice(0, 110)); d.accept(); });
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
for (const mode of ['manual', 'auto']) {
  const r = await page.evaluate(async mode => {
    const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
    const roster = await (await fetch('franchise_roster.json')).json();
    const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
    core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers', isCoach: false })));
    core.setSeasonConfig({ ...core.seasonConfig, name: 'W' + mode, setting: 'hosted-camp', teams: 2, mergeAt: 10, coaches: mode, coachesPerTribe: 1 });
    ss.initGameState(); window.gs = core.gs; epm.simulateEpisode();
    await new Promise(r => setTimeout(r, 200));
    const { premiereSteps } = await import('./js/vp-td-ep/premiere.js');
    const ep = core.gs.episodeHistory[0];
    const steps = premiereSteps('hosted-camp', { host: 'Chris', season: core.seasonConfig, teams: ['Bass', 'Gophers'], cast: 16, back: 0, coaches: ep.coachArrivals || [] });
    return { coaches: (core.gs.coaches || []).length, chrisAnnounces: JSON.stringify(steps).includes('every team gets') };
  }, mode);
  console.log(mode.padEnd(6), JSON.stringify(r));
}
console.log('alerts:', alerts); console.log('errors', errs.length ? errs : 'none'); await b.close();
