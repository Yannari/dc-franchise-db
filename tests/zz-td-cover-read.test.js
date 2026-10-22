// @vitest-environment jsdom
// SCRATCH: print the vote scenes and the night of every episode with a cover plan that worked. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';
import { tdTribalScreen, tdStepTranscript } from '../js/vp-td-ep/steps.js';
const SEEDS = (process.env.SEEDS || '777,99,123,4242').split(',').map(Number);
function castFor(seed, roster) {
  const pool = roster.filter(r => r.stats && r.archetype);
  let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
  const names = [...pool].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p.name]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(x => x[1]);
  return names.map((n, i) => ({ ...roster.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
}
it('cover read', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const out = [];
  for (const seed of SEEDS) {
    seededRun(() => runOneSeason({ romance: 'enabled' }, 16, castFor(seed, roster)), seed);
    for (const ep of core.gs.episodeHistory) {
      const cv = (ep.coverPlans || []).find(p => p.worked);
      if (!cv) continue;
      out.push(`\n===== S${seed} EP ${ep.num} out=${ep.eliminated} :: ${JSON.stringify(cv)}`);
      for (const camp of Object.keys(ep.campEvents || {})) for (const e of campFeed(ep, camp, 'post')) if (e.storyType === 'vote')
        out.push(`-- ${e.kind}\n` + (e.lines || []).map(l => '   ' + (l.by ? l.by + (l.kind === 'conf' ? ' [conf]' : '') + ': ' : '(') + l.text + (l.by ? '' : ')')).join('\n'));
      const scr = tdTribalScreen(ep, {});
      if (scr) out.push(...tdStepTranscript(scr).filter((l, i, a) => i > a.findIndex(x => /read the votes/.test(x)) - 1));
    }
  }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/cover-read.txt', out.join('\n'));
}, 900000);
