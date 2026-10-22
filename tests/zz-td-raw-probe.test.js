// @vitest-environment jsdom
// SCRATCH: every engine moment that airs in its own short words, by kind, and whether a long pool exists. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';
import { hasStoryPool } from '../js/td/story/write.js';
const SEEDS = (process.env.SEEDS || '4242,777,31337').split(',').map(Number);
function castFor(seed, roster) {
  const pool = roster.filter(r => r.stats && r.archetype);
  let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
  const names = [...pool].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p.name]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(x => x[1]);
  return names.map((n, i) => ({ ...roster.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
}
it('raw probe', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const c = {}, ex = {};
  for (const seed of SEEDS) {
    seededRun(() => runOneSeason({ romance: 'enabled', setting: seed === 777 ? 'survival-island' : undefined }, 16, castFor(seed, roster)), seed);
    for (const ep of core.gs.episodeHistory) for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) for (const e of campFeed(ep, camp, ph)) {
      if (e.story && e.kind && !/^\?/.test(e.kind) && e.kind.startsWith('long.')) continue;
      if (e.story && e.storyType && e.storyType !== 'cut' && !e.ref && e.kind) continue;
      const kind = e.scene?.kind || e.type || '?';
      const spoken = (e.lines || []).filter(l => l.kind !== 'beat').length;
      if (spoken > 5) continue;
      const k = `${kind}${hasStoryPool('long.' + kind) ? '' : '  [NO LONG]'}`;
      c[k] = (c[k] || 0) + 1;
      ex[k] ||= (e.lines || []).map(l => (l.by ? l.by + ': ' : '(') + l.text).join(' / ').slice(0, 160);
    }
  }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/raw-probe.txt', Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${String(n).padStart(4)}  ${k}  ::  ${ex[k]}`).join('\n'));
}, 900000);
