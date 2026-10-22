// @vitest-environment jsdom
// SCRATCH: print every "Previously on" of played seasons. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
it('recap read', () => {
  const out = [];
  for (const [seed, setting, tw] of [[4242, 'hosted-camp', []], [777, 'survival-island', [{ episode: 10, type: 'double-elim' }]], [99, 'carnival', [{ episode: 10, type: 'tied-destinies' }]]]) {
    const R = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
    const roster = R.filter(r => r.stats && r.archetype); let q = seed >>> 0; const rr = () => ((q = (1664525 * q + 1013904223) >>> 0) / 0x100000000); const cast = [...roster].sort((a, b) => a.name.localeCompare(b.name)).map(p => [rr(), p]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(([, p], i) => ({ ...p, tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled', setting, twistSchedule: tw }, 16, cast), seed);
    for (const ep of core.gs.episodeHistory) {
      const pv = core.gs.episodeHistory.find(h => h.num === ep.num - 1);
      out.push(`\n===== ${setting} EP ${ep.num}  (last time: out=${pv?.eliminated} first=${pv?.firstEliminated || '-'} tied=${pv?.tiedDestinies?.eliminatedPartner || '-'})`);
      for (const l of ep.tdPreviously || []) out.push(`${l.clip ? '   >> ' : ''}${l.by}: ${l.text}${l.shot?.boot ? '  [card ' + l.shot.boot + ']' : ''}`);
    }
  }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/recap-read.txt', out.join('\n'));
}, 900000);
