import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage();
page.on('dialog', d => d.accept());
const logs = []; page.on('console', m => { if (/card|coach/i.test(m.text())) logs.push(m.text().slice(0, 160)); });
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
console.log(await page.evaluate(async () => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers', isReturnee: i < 4 })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Probe', setting: 'hosted-camp', teams: 2, mergeAt: 8, coaches: 'auto', coachesPerTribe: 2 });
  ss.initGameState(); window.gs = core.gs;
  const out = [];
  for (let e = 0; e < 4; e++) { epm.simulateEpisode(); const ep = core.gs.episodeHistory.at(-1);
    out.push(`EP${ep.num} tribal=${JSON.stringify(ep.tribalTribe)} cards=${JSON.stringify(core.gs.coachCards || {})} calls=${(ep.coachCardCalls || []).length} commits=${(ep.coachCardCommits || []).length} notPlayed=${(ep.coachCardNotPlayed || []).length} coaches=${(core.gs.coaches || []).map(c => c.name + '/' + c.tribe).join(',')} elim=${ep.eliminated}`); }
  return out.join('\n');
}));
console.log(logs.slice(0, 5)); await b.close();
