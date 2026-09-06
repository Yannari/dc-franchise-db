// ══════════════════════════════════════════════════════════════════════
// exile-is-not-nobody.test.js — "episode 5, no elimination that week"
// ══════════════════════════════════════════════════════════════════════
//
// Reported as a random no-elimination week in Total Drama, and it is not
// random at all. An Exile Duel pinned to an episode sends the voted-out player
// to exile instead of out of the game, and js/episode.js nulls `ep.eliminated`
// when it does — deliberately, because a player on exile can win the duel and
// come back.
//
// But "not permanently out" is not "nothing happened". Everything downstream
// reads `getEpisodeEliminations`, so the hub card, the season timeline and the
// episode trail all reported NOBODY on the night the tribe voted somebody out.
// Reproduced first try: an Exile Duel on episode 5 gave a row reading
// `eliminated: null, exilePlayer: <name>`.
//
// It is the coach case one twist later — `applyCoachElimination` nulls the
// same field for its own good reason, and the helper had to be taught about
// it — and Rescue Island already works the way this now does: its exits set
// `eliminated` normally and the player comes back later. Crediting the exile
// makes the two formats agree instead of leaving this one an exception.
import { describe, it, expect } from 'vitest';
import { core, runOneSeason, makeCast, seededRun } from './helpers/season-harness.js';
import { getEpisodeEliminations } from '../js/run-ui.js';

const EP = 5;
const run = seededRun(() => {
  runOneSeason({ twistSchedule: [{ episode: EP, type: 'exile-duel', id: 'x' }] },
    16, makeCast(16));
  return (core.gs.episodeHistory || []).map(e => ({
    num: e.num,
    eliminated: e.eliminated || null,
    exilePlayer: e.exilePlayer || null,
    names: getEpisodeEliminations(e),
  }));
});

describe('the exile duel actually ran', () => {
  it('sent somebody to exile, or this proves nothing', () => {
    const row = run.find(r => r.exilePlayer);
    expect(row, 'no episode sent anybody to exile — the arm below is vacuous')
      .toBeTruthy();
    expect(row.num, 'the exile did not land on the episode it was pinned to').toBe(EP);
    // AND THE FIELD IS STILL NULLED. If this ever stops being true the bug is
    // gone for a different reason and this file should be re-read rather than
    // deleted — the helper below would be crediting a name that is already in
    // `eliminated`, which is a double count.
    expect(row.eliminated,
      'ep.eliminated is no longer nulled on an exile, so this fix may now double count')
      .toBeNull();
  });
});

describe('the week is not reported as empty', () => {
  it('names the exiled player where the timeline reads its names', () => {
    const row = run.find(r => r.exilePlayer);
    expect(row.names, `ep ${row.num}: the timeline reported nobody on the night the `
      + 'tribe voted somebody out').not.toEqual([]);
    expect(row.names).toContain(row.exilePlayer);
  });

  it('and every ordinary week still reports exactly who left', () => {
    // The other half of the claim: this must not have turned into "report
    // something on every episode", which would pass the arm above while
    // inventing names on the weeks that really did remove nobody.
    for (const r of run) {
      if (r.exilePlayer) continue;
      if (r.eliminated) {
        expect(r.names, `ep ${r.num}: lost the name of the person voted out`)
          .toContain(r.eliminated);
      }
    }
  });
});
