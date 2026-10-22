// @vitest-environment jsdom
// SCRATCH: print the stepped elimination of played seasons. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdTribalScreen, tdStepTranscript } from '../js/vp-td-ep/steps.js';
it('tribal read', () => {
  const out = [];
  for (const [seed, setting] of [[4242, 'hosted-camp'], [777, 'survival-island']]) {
    const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.filter(r => r.stats && r.archetype); let q = seed >>> 0; const rr = () => ((q = (1664525 * q + 1013904223) >>> 0) / 0x100000000); const cast = [...roster].sort((a, b) => a.name.localeCompare(b.name)).map(p => [rr(), p]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(([, p], i) => ({ ...p, tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled', setting }, 16, cast), seed);
    for (const ep of core.gs.episodeHistory) {
      const scr = tdTribalScreen(ep, { setting });
      if (!scr) continue;
      out.push(`\n===== ${setting} EP ${ep.num} out=${ep.eliminated} blowup=${!!ep.tribalBlowup} crashout=${!!ep.tribalStory?.crashout}`);
      out.push(...tdStepTranscript(scr));
    }
  }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/tribal-read.txt', out.join('\n'));
}, 600000);
