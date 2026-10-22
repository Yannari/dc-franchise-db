import { it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { challengeCast } from './helpers/ch-cast.js';
it('airtime by kind', () => {
  const by = {};
  for (const seed of [5, 9, 21]) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    airSeason(r.state);
    for (const row of challengeRows(r)) for (const a of row.ch.aired || []) {
      const k = a.kind; const o = (by[k] ||= { n: 0, lines: 0, who: 0, big: 0 });
      o.n++; o.lines += (a.lines || []).length; o.who += a.who.length; if (a.who.length >= 3) o.big++;
    }
  }
  const rows = Object.entries(by).sort((a, b) => b[1].n - a[1].n);
  console.log('AIR ' + rows.map(([k, o]) => `${k}:${o.n} L${(o.lines / o.n).toFixed(1)} W${(o.who / o.n).toFixed(1)} big${o.big}`).join('\nAIR '));
});
