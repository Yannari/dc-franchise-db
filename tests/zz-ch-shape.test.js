// Scratch: print the shape of one played + aired Challenge episode (what the stepped viewer can read).
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeCast } from './helpers/ch-cast.js';

const brief = (v, d = 0) => {
  if (v == null || typeof v !== 'object') return typeof v === 'string' ? JSON.stringify(v.slice(0, 60)) : String(v);
  if (d > 2) return Array.isArray(v) ? `[${v.length}]` : '{…}';
  if (Array.isArray(v)) return `[${v.length}] ` + (v.length ? brief(v[0], d + 1) : '');
  return '{ ' + Object.entries(v).slice(0, 30).map(([k, x]) => `${k}: ${brief(x, d + 1)}`).join(', ') + ' }';
};

it('dumps an episode shape', () => {
  const { cast, names, background } = challengeCast(24, 5);
  setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed: 5 });
  airSeason(r.state);
  const e = r.episodes[3];
  const out = [];
  for (const k of Object.keys(e)) out.push(`ep.${k}: ${brief(e[k])}`);
  out.push('', 'AIRED KINDS: ' + e.aired.map(a => a.kind).join(' '));
  for (const kind of ['daily', 'ceremony', 'callout', 'arena', 'return', 'meeting', 'fight', 'party']) {
    const a = e.aired.find(x => x.kind === kind);
    if (a) out.push('', `aired ${kind}: ${brief(a)}`, `  scene.data: ${brief(a.scene?.data)}`);
  }
  out.push('', 'arena[0]: ' + JSON.stringify(e.arena[0]).slice(0, 1500));
  out.push('', 'votes[0]: ' + JSON.stringify(e.votes[0]).slice(0, 1500));
  out.push('', 'daily: ' + JSON.stringify(e.daily).slice(0, 1200));
  out.push('', 'final: ' + brief(r.state.finalEp), 'final kinds: ' + r.state.finalEp.aired.map(a => a.kind).join(' '));
  out.push('', 'final rec: ' + JSON.stringify(r.final).slice(0, 2000));
  writeFileSync('transcripts/ch-shape.txt', out.join('\n'));
});
