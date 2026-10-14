// A whole season of The Challenge as it airs, written to a file to READ
// (manual §16.1: the single most productive tool on a show).
//   CH_SEED=n npm run ch:transcript   → transcripts/ch-season-<seed>.txt
import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeCast } from './helpers/ch-cast.js';

const SPOT = { villa: 'The villa', kitchen: 'Kitchen', gym: 'Gym', 'hot-tub': 'Hot tub', bedroom: 'Bedroom', beach: 'Beach',
  pool: 'Pool deck', confessional: 'Confessional', arena: 'The Arena', final: 'The final', party: 'Night out',
  private: 'Somewhere quiet', public: 'The villa', challenge: 'The daily', deliberation: 'Deliberation' };

it('writes a season to read', () => {
  const seed = Number(process.env.CH_SEED) || 1;
  const { cast, names, background } = challengeCast(24, seed);
  setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed });
  airSeason(r.state);
  const out = [];
  const missing = {};
  for (const e of [...r.episodes, r.state.finalEp]) {
    out.push(`\n==================== EPISODE ${e.ep}${e.final ? ' — THE FINAL' : ` — ${e.division === 'm' ? "men's" : "women's"} week` } ====================`);
    let day = null, n = 0;
    for (const a of e.aired || []) {
      if (a.day !== day) { day = a.day; out.push(`\n— Day ${day} —`); }
      if (a.kind === 'ceremony') {
        out.push(`\n-- ${++n}. THE VOTE [Deliberation]`);
        for (const c of a.ceremony) out.push(c.script ? c.script.text : `   (${c.kind}: ${c.voter} -> ${c.target}, ${c.why} — no lines yet)`);
        continue;
      }
      out.push(`\n-- ${++n}. ${a.kind} [${SPOT[a.scene.spot] || a.scene.spot || '?'}] (${a.scene.who.slice(0, 4).join(', ')})`);
      if (a.script) out.push(a.script.text);
      else { out.push('   (no lines yet)'); missing[a.kind] = (missing[a.kind] || 0) + 1; }
    }
  }
  out.push(`\nCHAMPIONS: ${r.champions.join(' & ')}`);
  out.push(`\nNo lines yet: ${Object.entries(missing).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  mkdirSync('transcripts', { recursive: true });
  writeFileSync(`transcripts/ch-season-${seed}.txt`, out.join('\n'));
});
