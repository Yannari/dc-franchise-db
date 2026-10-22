// every scene of every screen: an evening clock over a day picture (or the reverse)
import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200))); page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
for (const setting of ['survival-island', 'hosted-camp']) {
  console.log(setting, await page.evaluate(async setting => {
    const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
    const roster = await (await fetch('franchise_roster.json')).json();
    const mins = t => { const m = /^(\d+):(\d+) (AM|PM)$/.exec(t || ''); return m ? ((+m[1] % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + +m[2] : null; };
    const tally = { scenes: 0, clocked: 0, eveningDay: 0, latest: '', bad: [] };
    for (let run = 0; run < 3; run++) {
      core.setPlayers(roster.players.slice(run * 16, run * 16 + 16).map((p, i) => ({ ...p, tribe: i % 2 ? 'Bass' : 'Gophers' })));
      core.setSeasonConfig({ ...core.seasonConfig, name: 'DN' + setting + run, setting, teams: 2, mergeAt: 9 });
      ss.initGameState(); window.gs = core.gs;
      for (let e = 0; e < 6; e++) {
        try { epm.simulateEpisode(); } catch { break; }
        const ep = core.gs.episodeHistory.at(-1);
        const before = new Map(Object.entries(window._tdx || {}));
        const prev = window.vpScreens; try { window.buildVPScreens(ep); } finally { window.vpScreens = prev; }
        for (const [k, R] of Object.entries(window._tdx || {})) {
          if (before.get(k) === R) continue;
          const scrs = R.isMap ? (R.map?.convs || []).map(c => c.screen) : [R.scr];
          for (const scr of scrs) for (const s of (scr?.steps || [])) {
            if (s.k !== 'scene') continue;
            if (s.tod === 'night' && !/night/.test(s.plate || '')) { tally.nightNoPlate = (tally.nightNoPlate || 0) + 1; (tally.np ||= new Set()).add(String(s.plate).replace(/-day$/, '')); }
            tally.scenes++;
            const m = mins(s.time); if (m == null) continue;
            tally.clocked++;
            if (m > (mins(tally.latest) ?? -1)) tally.latest = s.time;
            if (m >= 18 * 60 + 30 && !/night/.test(s.plate || '')) { tally.eveningDay++; if (tally.bad.length < 4) tally.bad.push(`EP${ep.num} ${scr.id} ${s.time} tod=${s.tod} ${s.plate}`); }
          }
        }
      }
    }
    tally.np = [...(tally.np || [])].slice(0, 12); return JSON.stringify(tally);
  }, setting));
}
console.log('errors', errs.length ? errs : 'none'); await b.close();
