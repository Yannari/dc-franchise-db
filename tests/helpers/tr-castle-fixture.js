// ══════════════════════════════════════════════════════════════════════
// tests/helpers/tr-castle-fixture.js — the world the castle pool is
// measured in, in ONE place
// ══════════════════════════════════════════════════════════════════════
//
// Two files measure the castle pool — tr-castle-reachability.test.js (the
// guard) and tr-castle-audit.test.js (the tables) — and they must measure the
// same world or the tables stop explaining the guard's numbers.
//
// WHY THE LEDGER LOOKS LIKE THIS. The first version of this fixture gave each
// franchise relation type to exactly ONE pair: allies on (0,1), a betrayal on
// (2,3), a rivalry on (4,5), a showmance on (6,7). The comment on it said that
// was deliberate, "so the audit can tell a genuinely unreachable callback
// event from one that simply never got fixture data" — and for that question
// one pair is enough. But the scene sampler draws a SPECIFIC pair out of a
// 20-person cast about once in 190 attempts, so an event needing "these two,
// together, this window" got about one shot per twenty seasons, and seven of
// callback's eleven events measured under 30 firings in FIVE THOUSAND seasons.
// The whole-plan review read those numbers as near-unreachable content. They
// were near-unreachable MEASUREMENT: the events were fine, the world they were
// measured in had one allied pair in it.
//
// A Traitors cast in this franchise is a returnee cast — that is the entire
// premise of the callback family (js/tr/castle/callback.js's header). So the
// fixture is now what a returnee cast actually looks like: two prior seasons,
// every player carrying an ally, a rival, and a share of them carrying a
// betrayal, a showmance or a finals run. Relations are laid out on a ring by
// index rather than drawn randomly, so the fixture is identical every run and
// a firing count is reproducible.
import { setFranchiseLedger } from '../../js/franchise-meta.js';

/**
 * Install a two-season returnee ledger over `cast`.
 * Deterministic: same cast in, same ledger out, every time.
 */
export function seedFranchiseHistory(cast) {
  const n = cast.length;
  const players1 = {};
  const players2 = {};
  for (let i = 0; i < n; i++) {
    const me = cast[i];
    const next = cast[(i + 1) % n];
    const prev = cast[(i + n - 1) % n];
    const far = cast[(i + 7) % n];
    const mid = cast[(i + 5) % n];
    players1[me] = {
      allies: [next],
      rivals: [far],
      betrayed: i % 4 === 0 ? [mid] : [],
      betrayedBy: i % 4 === 1 ? [cast[(i + n - 5) % n]] : [],
      showmances: i % 6 === 0 ? [{ partner: prev, ended: 'breakup' }] : [],
      finalist: i % 5 === 0,
      winner: i === 0,
    };
    players2[me] = {
      allies: [mid],
      rivals: [prev],
      betrayed: i % 3 === 0 ? [next] : [],
      betrayedBy: i % 3 === 1 ? [prev] : [],
      showmances: i % 7 === 0 ? [{ partner: far, ended: 'together' }] : [],
      finalist: i % 4 === 0,
    };
  }
  setFranchiseLedger({
    v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {
      1: { seasonName: 'Founding Season', format: 'total-drama', players: players1 },
      2: { seasonName: 'Second Season', format: 'total-drama', players: players2 },
    } } },
  });
}

/** The empty-ledger case: a debut season, where the callback family is inert. */
export function seedEmptyHistory() {
  setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
}
