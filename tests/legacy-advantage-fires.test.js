// ══════════════════════════════════════════════════════════════════════
// legacy-advantage-fires.test.js — the advantage that never went off
// ══════════════════════════════════════════════════════════════════════
//
// Reported: a player holding both an idol and a legacy advantage "never uses
// it". The idol was a red herring — idols play fine. The legacy never fires
// AT ALL, and measuring it says so plainly: eight seasons, eight legacy
// advantages found, ZERO activations.
//
// The cause is two rules written against each other. The legacy auto-activates
// when the player count reaches `activatesAt`, which defaults to [5]. And the
// last-chance tribal — `activePlayers.length <= advExpire + 1`, which with the
// default advExpire of 4 is exactly F5 — destroys every advantage "that can't
// be used at tribal", a list that had `legacy` on it. So the season deleted
// the advantage on the one night it was written to go off, every time.
//
// A legacy is not an advantage that cannot be used at tribal. It is the one
// advantage that can ONLY be used at tribal.
//
// This also covers the skipped number: a double elimination or a multi-tribal
// night steps the count over 5, and an exact-equality trigger silently misses.
import { afterEach, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';
import { checkIdolPlays } from '../js/advantages.js';
import { seedGs, seedPlayers } from './helpers/setup.js';
import { runHeadlessSeason } from './helpers/coach-season.js';
import { seededRandom } from './helpers/rng.js';

const FIVE = ['A', 'B', 'C', 'D', 'E'];

function table(active, { activatesAt = [5], holder = 'A' } = {}) {
  seedGs({ activePlayers: [...active], advantages: [], episode: 9, tribes: [{ name: 'Merge', members: [...active] }], isMerged: true });
  seedPlayers(...active.map(name => ({ name })));
  core.gs.activePlayers = [...active];
  core.gs.advantages = [{ holder, type: 'legacy', foundEp: 2, activatesAt }];
  Object.assign(globalThis, { gs: core.gs, players: core.players, seasonConfig: core.seasonConfig });
}

/** One tribal: `ep`, the votes on the table, and whether this is the last-chance night. */
function tribal(active, { forced = false } = {}) {
  const ep = { num: 9, idolPlays: [], idolMisplays: [], idolFinds: [], _forceAdvantages: forced };
  const votes = { A: 3, B: 1 };
  checkIdolPlays([...active], votes, ep, []);
  return { ep, votes };
}

afterEach(() => { core.gs.advantages = []; });

describe('the legacy advantage', () => {
  it('fires on its own number', () => {
    table(FIVE);
    const { ep, votes } = tribal(FIVE);
    expect(ep.legacyActivated).toBe('A');
    expect(ep.idolPlays.some(p => p.type === 'legacy' && p.player === 'A')).toBe(true);
    expect(votes.A, 'the votes against the holder are cancelled').toBeUndefined();
    expect(core.gs.advantages.some(a => a.type === 'legacy'), 'and it is spent').toBe(false);
  });

  it('fires on the last-chance tribal even when the season stepped over its number', () => {
    // a double elimination took the count from 6 to 4: F5 never happened
    const four = ['A', 'B', 'C', 'D'];
    table(four, { activatesAt: [5] });
    const { ep } = tribal(four, { forced: true });
    expect(ep.legacyActivated, 'the number was skipped, so it fires at the last chance').toBe('A');
  });

  it('does not fire early', () => {
    const eight = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    table(eight, { activatesAt: [5] });
    const { ep } = tribal(eight);
    expect(ep.legacyActivated).toBeUndefined();
    expect(core.gs.advantages.some(a => a.type === 'legacy'), 'still in the pocket').toBe(true);
  });

  it('expires when its number is already behind the count', () => {
    // an F3 legacy in a season whose advantages die at F4: it can never fire
    table(FIVE, { activatesAt: [3] });
    const { ep } = tribal(FIVE, { forced: true });
    expect(ep.legacyActivated).toBeUndefined();
  });
});

// The unit tests above call checkIdolPlays directly, so they pass whether or
// not episode.js still destroys the advantage a moment earlier — the deletion
// is in the tribal, not in the play. Only a whole season sees both rules meet,
// which is why the bug lived: every test of the legacy tested the half that
// worked.
describe('a whole season with a legacy advantage in it', () => {
  it('actually sets one off', async () => {
    let fired = 0, found = 0;
    for (const seed of [1, 2]) {
      const real = Math.random;
      Math.random = seededRandom(seed);
      let season;
      try {
        season = await runHeadlessSeason({
          twist: null, castSize: 16, mergeAt: 10,
          config: { advantages: { idol: { enabled: true }, legacy: { enabled: true, sources: ['camp'], chance: 1 } },
            legacyActivatesAt: [5] },
        });
      } finally { Math.random = real; }
      for (const e of season.episodes) {
        found += ((e.ep || {}).idolFinds || []).filter(f => f.type === 'legacy').length;
        if ((e.ep || {}).legacyActivated) fired++;
      }
    }
    expect(found, 'no legacy advantage was even found').toBeGreaterThan(0);
    // before the fix: eight seasons, eight found, zero fired
    expect(fired, 'a legacy advantage was found and never went off').toBe(found);
  }, 180000);
});
