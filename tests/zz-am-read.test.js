// @vitest-environment jsdom
// SCRATCH: print the Aftermath show of a played season. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
it('aftermath read', () => {
  const out = [];
  const R = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  globalThis.FRANCHISE_ROSTER = R;
  for (const [seed, setting] of [[4242, 'hosted-camp'], [777, 'survival-island']]) {
    const roster = R.filter(r => r.stats && r.archetype); let q = seed >>> 0; const rr = () => ((q = (1664525 * q + 1013904223) >>> 0) / 0x100000000); const cast = [...roster].sort((a, b) => a.name.localeCompare(b.name)).map(p => [rr(), p]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(([, p], i) => ({ ...p, tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled', setting, aftermath: 'enabled' }, 16, cast), seed);
    for (const ep of core.gs.episodeHistory) {
      if (!window.generateAftermathShow) {}
      const a = ep.aftermath; if (!a) continue;
      out.push(`\n===== ${setting} EP ${ep.num} aftermath #${a.number} show=${!!a.show} hosts=${(a.show?.hosts||[]).map(h=>h.name+'/'+h.gender).join(',')}`);
      for (const b of a.show?.blocks || []) {
        out.push(`--- [${b.set}]${b.title ? ' ' + b.title.kicker + ': ' + b.title.name : ''}${b.shot ? ' shot=' + JSON.stringify(b.shot) : ''} seats=${Object.keys(b.seats).join(',')}`);
        for (const l of b.lines) out.push(l.beat ? `   (${l.beat})${l.act ? ' [' + l.act + ']' : ''}` : `${l.by}: ${l.text}`);
      }
    }
  }
  fs.mkdirSync('C:/Users/yanna/AppData/Local/Temp/tdtx', { recursive: true });
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/am-read.txt', out.join('\n'));
}, 600000);
