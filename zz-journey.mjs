import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
const out = await page.evaluate(async () => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  const want = { deal: null, compete: null, gamble: null };
  for (let run = 0; run < 12 && Object.values(want).some(v => !v); run++) {
    core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
    core.setSeasonConfig({ ...core.seasonConfig, name: 'J' + run, setting: 'hosted-camp', teams: 2, mergeAt: 10, journey: true,
      advantages: { ...(core.seasonConfig.advantages || {}), extraVote: { enabled: true, count: 3, sources: ['journey'] }, voteSteal: { enabled: true, count: 3, sources: ['journey'] } } });
    ss.initGameState(); window.gs = core.gs;
    for (let e = 0; e < 11; e++) {
      try { epm.simulateEpisode(); } catch (x) { break; }
      const ep = core.gs.episodeHistory.at(-1), J = ep.journey;
      if (!J) continue;
      const kind = J.travelers.length === 1 ? 'gamble' : (J.results || []).some(r => r.dealMade) ? 'deal' : 'compete';
      if (want[kind]) continue;
      // build the episode's screens, and read the twist screen the stepped viewer plays
      const before = new Map(Object.entries(window._tdx || {}));
      const prev = window.vpScreens; window.buildVPScreens(ep); window.vpScreens = prev;
      const R = Object.entries(window._tdx || {}).find(([k, R]) => before.get(k) !== R && R.scr && R.scr.steps.some(s => /journey/i.test(JSON.stringify(s))));
      const steps = R ? R[1].scr.steps : [];
      want[kind] = { ep: ep.num, travelers: J.travelers, results: J.results, drama: (J.nominationDrama || []).length, screen: R ? R[1].scr.id : '(none)',
        script: steps.filter(s => ['scene', 'title', 'say', 'conf', 'beat'].includes(s.k)).map(s => s.k === 'scene' ? `--- ${s.place} (${s.time})` : s.k === 'title' ? `[${s.kicker}: ${s.name}]` : s.k === 'beat' ? `  (${s.text})` : `  ${s.k === 'conf' ? '[conf] ' : ''}${s.by}: ${s.text}`) };
    }
  }
  return want;
});
for (const [k, v] of Object.entries(out)) { console.log(`\n======== ${k.toUpperCase()} ${v ? `EP ${v.ep} on screen "${v.screen}": ${JSON.stringify(v.results)} drama=${v.drama}` : '(not found)'}`); (v?.script || []).forEach(l => console.log(l)); }
console.log('\nerrors', errs.length ? errs.slice(0, 4) : 'none'); await b.close();
