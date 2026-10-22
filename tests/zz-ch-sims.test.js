import { it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { challengeCast } from './helpers/ch-cast.js';
it('played dailies', () => {
  const seen = {};
  for (const seed of [5, 9, 21, 33, 47, 60, 77, 91, 102, 120]) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    for (const e of r.state.episodes) {
      const d = e.daily; if (!d) continue;
      const o = (seen[d.id] ||= { n: 0, beats: 0, kinds: {}, win: [] });
      o.n++; o.beats += (d.beats || []).length;
      for (const b of d.beats || []) o.kinds[b.kind] = (o.kinds[b.kind] || 0) + 1;
      o.win.push(d.winners.length);
    }
  }
  for (const [k, o] of Object.entries(seen)) console.log('SIM', k.padEnd(14), o.n, 'avg', (o.beats / o.n).toFixed(0), 'winners', o.win.join(''), JSON.stringify(o.kinds).slice(0, 220));
});
