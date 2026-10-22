// measure: a "we won" challenge scene for a team that lost (should be 0); the new "still lost" scene for a winner (0)
import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200))); page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
console.log(await page.evaluate(async () => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const pool = roster.players.slice(0, 60);
  const WON = new Set(['ncm.s3', 'ncm.b3', 'nc3.b1', 'nc3.b2', 'nc3.t2']), LOST = new Set(['nc3.b4']);
  const tally = { chmScenes: 0, wonAired: 0, wonForLoser: 0, lostAired: 0, lostForWinner: 0 }, bad = [];
  for (let run = 0; run < 16; run++) {
    const N = pool.slice((run * 7) % 40, (run * 7) % 40 + 16);
    core.setPlayers(N.map((p, i) => ({ ...p, tribe: i % 2 ? 'Bass' : 'Gophers' })));
    core.setSeasonConfig({ ...core.seasonConfig, name: 'TW' + run, setting: 'hosted-camp', teams: 2, mergeAt: 8 });
    ss.initGameState(); window.gs = core.gs;
    for (let e = 0; e < 6 && !core.gs.isMerged; e++) {
      try { epm.simulateEpisode(); } catch { break; }
      const ep = core.gs.episodeHistory.at(-1);
      for (const [camp, phases] of Object.entries(ep.campStory || {})) {
        for (const ph of ['pre', 'post']) for (const ev of (Array.isArray(phases?.[ph]) ? phases[ph] : [])) {
          if (!ev?.story || !String(ev.kind || '').startsWith('chm.')) continue;
          tally.chmScenes++;
          const lost = ep.tribalTribe === camp || ep.loser?.name === camp;
          if (WON.has(ev.lineId)) { tally.wonAired++; if (lost) { tally.wonForLoser++; bad.push(`EP${ep.num} ${camp} ${ev.lineId}`); } }
          if (LOST.has(ev.lineId)) { tally.lostAired++; if (!lost) tally.lostForWinner++; }
        }
      }
    }
  }
  return JSON.stringify({ ...tally, bad: bad.slice(0, 5) });
}));
console.log('errors', errs.length ? errs : 'none'); await b.close();
