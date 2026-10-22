import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
const found = await page.evaluate(async () => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const scr = await import('./js/vp-td-ep/screens.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro', 'Cameron', 'Zoey'];
  const want = { safe: null, gamble: null, played: null }, seen = {};
  for (let run = 0; run < 14 && Object.values(want).some(v => !v); run++) {
    const per = run % 2 ? 1 : 2;
    core.setPlayers(N.map((n, i) => ({ ...(roster.players.find(p => p.name === n) || roster.players[i]), tribe: i % 2 ? 'Bass' : 'Gophers', isReturnee: i < 6 })));
    core.setSeasonConfig({ ...core.seasonConfig, name: 'Hud' + run, setting: 'hosted-camp', teams: 2, mergeAt: 8, coaches: 'auto', coachesPerTribe: per });
    ss.initGameState(); window.gs = core.gs;
    for (let e = 0; e < 5 && !core.gs.isMerged; e++) {
      try { epm.simulateEpisode(); } catch { break; }
      const ep = core.gs.episodeHistory.at(-1);
      const d = (ep.coachCardCalls || []).find(c => c.tribe === ep.tribalTribe);
      if (!d) continue;
      const kind = d.why === 'safe' ? 'safe' : d.held ? 'gamble' : 'played';
      seen[kind] = (seen[kind] || 0) + 1;
      if (want[kind]) continue;
      const lines = scr.tdEpisodeLines(ep).filter(l => l.screen === 'tribal');
      const coachNames = (core.gs.coaches || []).map(c => c.name);
      const i = lines.findIndex(l => /Save Card, now is the time/.test(l.text));
      const before = lines.slice(Math.max(0, i - 4), i + 1).map(l => `${l.k === 'conf' ? '[conf] ' : ''}${l.by}: ${l.text}`);
      want[kind] = { per, decision: d, lines: before };
    }
  }
  return { want, seen };
});
for (const [k, v] of Object.entries(found.want)) { console.log(`\n== ${k.toUpperCase()} ${v ? `(${v.per} coach${v.per > 1 ? 'es' : ''} a team) ${JSON.stringify({ coach: v.decision.coach, aimed: v.decision.aimed, refusers: v.decision.refusers })}` : '(not found)'}`); (v?.lines || []).forEach(l => console.log('  ' + l)); }
console.log('\nseen:', JSON.stringify(found.seen), '| errors', errs.length ? errs.slice(0, 3) : 'none'); await b.close();
