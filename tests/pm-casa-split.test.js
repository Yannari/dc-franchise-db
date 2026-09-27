// Casa Amor splits the villa in two: nothing face to face between islanders
// in different villas (audit 2026-09-27: asks, "I love you"s, Hideaway nights,
// blow-ups with the villa piling in, comfort after a breakdown and a love
// triangle's "Me or Mia?" all played across the two villas).
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

// Scenes ABOUT somebody elsewhere are fine: the two who talk are players 0 and 1.
const ABOUT_THE_OTHER_VILLA = new Set(['casa-return', 'casa-react', 'casa-host', 'casa-row', 'photos', 'photo-text',
  'photo-row', 'casa-miss', 'debrief']);

describe('Casa Amor', () => {
  it('nobody talks to somebody in the other villa', () => {
    const bad = [];
    for (const size of [22, 26]) for (let seed = 1; seed <= 4; seed++) {
      const cast = makeIslanders(size, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
      for (const r of rows.filter(x => x.moment === 'casa-nights')) {
        const casa = new Set(r.pm.casaRoom || []);
        expect(casa.size, `${size}/${seed} ep${r.num}`).toBeGreaterThan(0);
        for (const e of r.pm.events) {
          if (ABOUT_THE_OTHER_VILLA.has(e.kind) || e.phase === 'firepit' || e.phase === 'debrief') continue;
          const [a, b] = e.players.filter(n => names.includes(n));
          if (a && b && casa.has(a) !== casa.has(b)) bad.push(`${size}/${seed} ep${r.num} ${e.kind} [${e.players}]`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
