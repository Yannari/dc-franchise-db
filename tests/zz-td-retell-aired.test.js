// @vitest-environment jsdom
// SCRATCH: the retelling confessionals that actually air, most first. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';
const SEEDS = (process.env.SEEDS || '4242,777,31337').split(',').map(Number);
function castFor(seed, roster) {
  const pool = roster.filter(r => r.stats && r.archetype);
  let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
  const names = [...pool].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p.name]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(x => x[1]);
  return names.map((n, i) => ({ ...roster.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
}
const VERB = "(said|says|told|tells|just|looked|came|caught|did|made|gave|turned|asked|showed|lied|walked|called|tried|stuck|picked|went|pulled|stood|took|kept|got|left|won|lost|wrote|is|was|has|had|didn't|doesn't|isn't|wasn't)";
it('retell aired', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const by = {};
  for (const seed of SEEDS) {
    seededRun(() => runOneSeason({ romance: 'enabled' }, 16, castFor(seed, roster)), seed);
    const names = core.players.map(p => p.name).sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    void names; void VERB;
    // no first person at all: narration, not somebody talking about themselves
    const re = { test: x => !/\b(I|I'm|I've|I'd|I'll|me|my|mine|myself|we|we're|us|our)\b/i.test(x) };
    for (const ep of core.gs.episodeHistory) for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) for (const e of campFeed(ep, camp, ph)) {
      for (const l of e.lines || []) if (l.kind === 'conf' && re.test(l.text || '')) {
        const k = e.lineId || (e.kind || e.type || '?');
        (by[k] ||= { n: 0, text: l.text, kind: e.kind || e.scene?.kind || e.type }).n++;
      }
    }
  }
  const rows = Object.entries(by).sort((a, b) => b[1].n - a[1].n);
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/retell-aired.txt', `entries ${rows.length}, airings ${rows.reduce((s, [, v]) => s + v.n, 0)}\n` + rows.map(([k, v]) => `${String(v.n).padStart(3)} ${k} [${v.kind}] :: ${v.text.slice(0, 170)}`).join('\n'));
}, 900000);
