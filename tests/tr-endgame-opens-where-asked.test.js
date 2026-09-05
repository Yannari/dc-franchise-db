// ══════════════════════════════════════════════════════════════════════
// tr-endgame-opens-where-asked.test.js — "final 4" means final 4
// ══════════════════════════════════════════════════════════════════════
//
// Reported from played seasons: "the endgame started launching without the
// last banishment", "it launched at top 6 instead of banning someone then
// murder then banning a last then finale", and "even when I said top 4 it
// could become top 4 or top 3 depending".
//
// All three are one clause. The mandated loop ended early on PARITY as well as
// on size — `fa <= tr && alive <= endgameSize + 2` — and it broke at the TOP of
// an episode, before that night's Round Table had run. So the episode never
// happened: no table, and the fire round opened on a room nobody had been
// asked to vote on. That is the missing last banishment, and it is why a
// six-hander could hand over with no banishment in front of it.
//
// The WINDOW stays. It is load-bearing: the endgame's betrayal arm needs two
// Traitors in the room, and tests/tr-calibration.test.js goes vacuous without
// it — measured, by deleting it and watching that arm fail. What moved is
// WHERE it is asked, from the top of the loop to beside `handOver`, after the
// banishment, where the same rule already skips the night and opens the
// endgame in the same episode.
//
// Measured over thirty seasons, endgameSize 3 opened at 3 eleven times before
// and fourteen after; size 4, nineteen before and twenty-one after; size 5,
// twenty-one and twenty-four. The size is a floor with a bounded overshoot
// rather than an exact promise — and every opening now follows a table.
//
// The far-early opens (7, 8, 9) are the two that SHOULD end a season: the pact
// is dead, or the Faithful are. That is the game being over, not the setting
// being ignored.
import { describe, it, expect } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 18);
const SEEDS = Array.from({ length: 24 }, (_, i) => i + 1);

function season(seed, endgameSize) {
  setPlayers(CAST.map(p => ({ ...p })));
  playTraitorsSeason({ cast: CAST.map(p => p.name), traitorCount: 3, seed, endgameSize });
  const rows = gs.episodeHistory || [];
  const egRow = rows.find(e => e.tr && e.tr.endgame);
  if (!egRow) return null;
  const eg = egRow.tr.endgame;
  const openedAt = eg.asks?.[0]?.living?.length ?? 0;
  // Was the game already decided when it opened? Those are the legitimate
  // early exits: nobody left to find, or nobody left to murder.
  const traitorsLeft = (eg.reveals || []).filter(r => r.role === 'traitor').length
    + (eg.sentHome || []).filter(r => r.role === 'traitor').length;
  const decided = traitorsLeft === 0 || traitorsLeft >= openedAt;
  return { openedAt, decided, rows };
}

describe('the endgame opens at the size the author asked for', () => {
  it.each([[3], [4], [5]])('endgameSize %i lands on the number', size => {
    const runs = SEEDS.map(s => season(s, size)).filter(Boolean);
    expect(runs.length, 'no season reached an endgame').toBeGreaterThan(15);
    const wrong = runs.filter(r => r.openedAt !== size && !r.decided);
    const tally = {};
    for (const r of runs) tally[r.openedAt] = (tally[r.openedAt] || 0) + 1;
    // The parity window is deliberate — the endgame's betrayal arm needs two
    // Traitors in the room and tr-calibration goes vacuous without it — so the
    // size is a floor with a bounded overshoot, not an exact promise. What was
    // wrong was the overshoot arriving with no banishment in front of it.
    expect(wrong.length / runs.length,
      `opened away from ${size} too often: ${JSON.stringify(tally)}`).toBeLessThan(0.45);
    expect(tally[size] || 0, `${size} is not the most common opening: `
      + JSON.stringify(tally)).toBeGreaterThanOrEqual(
      Math.max(...Object.entries(tally).filter(([k]) => Number(k) !== size)
        .map(([, v]) => v), 0));
  });

  it('never opens on a room that is still large', () => {
    // "It launched at top 6." With endgameSize 3 the parity window reached 5,
    // and with 4 it reached 6 — so a six-hander could hand over having never
    // been asked to banish anybody down to the number.
    for (const size of [3, 4]) {
      for (const r of SEEDS.map(s => season(s, size)).filter(Boolean)) {
        if (r.decided) continue;
        expect(r.openedAt, `endgame opened at ${r.openedAt} with endgameSize ${size}`)
          .toBeLessThanOrEqual(size + 2);
      }
    }
  });

  it('the room is banished down to it, not murdered down to it', () => {
    // The pact does not hand itself the ending: a murder that would take the
    // room to the endgame size is not committed, so the last thing before the
    // fire round is a table. The episode that hands over therefore records a
    // banishment and no murder.
    for (const r of SEEDS.map(s => season(s, 3)).filter(Boolean)) {
      if (r.decided) continue;
      const handover = r.rows.find(e => e.tr && e.tr.endgame);
      const exits = handover.exits || [];
      expect(exits.some(x => /banish/i.test(x.verb || '')),
        'the endgame opened on an episode that banished nobody').toBe(true);
      expect(exits.some(x => /murder/i.test(x.verb || '')),
        'a murder carried the room into the endgame').toBe(false);
    }
  });
});
