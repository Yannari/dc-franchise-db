// ══════════════════════════════════════════════════════════════════════
// tr-twists-are-opt-in.test.js — the castle springs nothing unasked
// ══════════════════════════════════════════════════════════════════════
//
// Reported twice, and the second time as a question rather than a bug: "why is
// a Traitor murdered?" By then the screen was narrating it correctly — the
// pact told to name one of its own, every line saying so — and the honest
// answer was that it had simply come up in a weighted draw. Measured over 60
// seasons at cast 20: `name-your-own` fired on 2.4% of nights and turned up in
// about one season in six.
//
// The instruction that followed is the rule this file guards: "forbid them
// from randomly activating unless I checked them to do it."
//
// SO THE RANDOM POOL IS OPT-IN AND EMPTY BY DEFAULT. Every murder shape is
// still schedulable — they were already in TWIST_CATALOG as `category:'murder'`
// entries, and pinning one to a night from the timeline runs it whatever this
// setting says. What changed is that an unticked shape can no longer come up
// on its own.
//
// TWO ARMS, AND THE SECOND IS THE ONE THAT MATTERS. "Nothing fires" is easy to
// pass by breaking the mechanism outright, so ticking a shape must bring it
// back — otherwise this file would be green over an engine that had simply
// lost the ability to run a twist at all.
import { describe, it, expect } from 'vitest';
import { gs, setPlayers, TWIST_CATALOG } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 20);
const SEEDS = Array.from({ length: 24 }, (_, i) => i + 1);

/** Every conclave a season held, as variant ids. */
function variantsOf(opts) {
  const out = [];
  for (const seed of SEEDS) {
    setPlayers(CAST.map(p => ({ ...p })));
    playTraitorsSeason({ cast: CAST.map(p => p.name), traitorCount: 3, seed, ...opts });
    for (const e of gs.episodeHistory || []) {
      const c = e.tr && e.tr.conclave;
      if (c) out.push(c.variant);
    }
  }
  return out;
}

describe('with nothing ticked', () => {
  const seen = variantsOf({});

  it('played enough nights to be able to see a twist', () => {
    expect(seen.length, 'no conclaves at all — the arms below prove nothing')
      .toBeGreaterThan(150);
  });

  it('runs standard murders and nothing else', () => {
    const odd = [...new Set(seen)].filter(v => v !== 'standard');
    expect(odd, 'a murder twist came up on its own with nothing ticked').toEqual([]);
  });
});

describe('with a shape ticked', () => {
  it('brings that shape back, and only that one', () => {
    // WITHOUT THIS THE FILE IS WORTHLESS. "Nothing fired" passes just as well
    // on an engine that can no longer run a twist at all, which is the vacuous
    // shape this repo keeps shipping.
    const seen = variantsOf({ randomMurderTwists: ['plain-sight'] });
    const odd = [...new Set(seen)].filter(v => v !== 'standard');
    expect(odd, 'ticking a shape did not bring it back — the pool is broken '
      + 'rather than empty').toContain('plain-sight');
    expect(odd, 'a shape nobody ticked came up anyway').toEqual(['plain-sight']);
  });

  it('and every shape in the catalogue can be turned back on', () => {
    // Each one, rather than one of them: a filter that matched a single id
    // would pass the arm above and quietly bar the other five.
    const shapes = TWIST_CATALOG
      .filter(c => c.category === 'murder' && c.variant && c.variant !== 'recruit')
      .map(c => c.variant);
    expect(shapes.length, 'no murder shapes in the catalogue').toBeGreaterThan(4);
    const seen = new Set(variantsOf({ randomMurderTwists: shapes }));
    // Not every shape can reach every season — a Double needs a full early
    // castle and `name-your-own` needs three living Traitors — so this asserts
    // the pool is OPEN rather than that all six fired in 24 seasons.
    const fired = shapes.filter(v => seen.has(v));
    expect(fired.length, `only ${fired.length} of ${shapes.length} shapes could fire `
      + 'with all of them ticked').toBeGreaterThan(2);
  });
});

describe('a pinned night runs whatever it was pinned to', () => {
  it('even with nothing ticked for the random pool', () => {
    // The setting is about SURPRISE, not about access. A shape the author put
    // on a night has been asked for by definition, and barring it there would
    // make the timeline lie about what it was going to play.
    let ran = 0, checked = 0;
    for (const seed of SEEDS.slice(0, 12)) {
      setPlayers(CAST.map(p => ({ ...p })));
      playTraitorsSeason({ cast: CAST.map(p => p.name), traitorCount: 3, seed,
        murderSchedule: { 3: 'plain-sight' } });
      const row = (gs.episodeHistory || []).find(e => Number(e.num) === 3);
      const c = row && row.tr && row.tr.conclave;
      if (!c) continue;
      checked++;
      if (c.variant === 'plain-sight') ran++;
    }
    expect(checked, 'no season reached a third night').toBeGreaterThan(6);
    // `pickVariant` falls back to a standard night when the room cannot
    // support the pinned shape, so this is a floor rather than an equality.
    expect(ran, 'a pinned shape did not run on the night it was pinned to')
      .toBeGreaterThan(checked / 2);
  });
});
