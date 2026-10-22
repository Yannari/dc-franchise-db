import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage();
page.on('dialog', d => d.accept()); const warns = []; page.on('console', m => { if (/fell back|journey|Error/i.test(m.text())) warns.push(m.text().slice(0, 300)); });
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
console.log(await page.evaluate(async () => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js'), jm = await import('./js/vp-td-ep/journey.js'), vs = await import('./js/vp-screens.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  for (let run = 0; run < 20; run++) {
    core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
    core.setSeasonConfig({ ...core.seasonConfig, name: 'D' + run, setting: 'hosted-camp', teams: 2, mergeAt: 10, journey: true });
    ss.initGameState(); window.gs = core.gs;
    for (let e = 0; e < 4; e++) { epm.simulateEpisode(); const ep = core.gs.episodeHistory.at(-1);
      if (!(ep.journey?.results || []).some(r => r.dealMade)) continue;
      let err = null, n = 0; try { n = jm.journeyDay({ ep, host: 'Chris', venue: 'hosted-camp', neutral: null }).length; } catch (x) { err = String(x.stack || x).slice(0, 400); }
      const blocks = (() => { try { return vs.preTwistBlocks(ep).map(b => b.type); } catch (x) { return 'blocks error ' + x; } })();
      return JSON.stringify({ ep: ep.num, steps: n, err, blocks, twists: (ep.twists || []).map(t => t.type) });
    }
  }
  return 'no deal found';
}));
console.log(warns.slice(0, 3)); await b.close();
