// The Wildcard (BB23), adapted.
//
// Nobody enters this one. Three names are drawn, they compete, and the winner
// is offered safety at a price — sometimes their own punishment, sometimes the
// whole house's. The offer is the twist; the competition only decides who gets
// asked.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { BB_THEMES } from '../js/bb/themes.js';
import { runWildcard, wildcardSafe, WILDCARD_DRAW } from '../js/bb/wildcard.js';
import { rpBuildBBWildcard } from '../js/vp-bb-wildcard.js';
import { punishmentFor } from '../js/bb/punishments.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-wildcard' }];
}

// `runWildcard` defaults its rng to `stableRng`, NOT to Math.random, so
// `withSeededRandom` cannot steer it — an earlier version of this file wrapped
// every call and got the identical draw sixty times over while looking like it
// was sampling. The rng is passed in explicitly here for exactly that reason.
const lcg = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const args = (over = {}) => ({
  week: { num: 3 }, house: [...gs.activePlayers],
  hoh: gs.activePlayers[0], nominees: gs.activePlayers.slice(1, 3), ...over,
});

/** A seeded run whose offer went the way we need to test. */
function ran(want = null, seeds = 80) {
  for (let seed = 1; seed <= seeds; seed++) {
    house();
    const act = runWildcard(args({ rng: lcg(seed * 7919 + 13) }));
    if (!act) continue;
    if (want === null) return act;
    if (want === 'house' && act.accepted && act.houseWide) return act;
    if (want === 'solo' && act.accepted && !act.houseWide) return act;
    if (want === 'refused' && !act.accepted) return act;
  }
  return null;
}

describe('the Wildcard', () => {
  beforeEach(house);

  it('draws three, and never the Head of Household', () => {
    for (let seed = 1; seed <= 20; seed++) {
      house();
      const a = args({ rng: lcg(seed * 7919 + 13) });
      const act = runWildcard(a);
      expect(act, 'the hat came up empty on a full house').toBeTruthy();
      expect(act.players).toHaveLength(WILDCARD_DRAW);
      expect(act.players, 'the HOH was drawn into a safety comp').not.toContain(a.hoh);
      expect(new Set(act.players).size, 'somebody was drawn twice').toBe(act.players.length);
      expect(act.players).toContain(act.winner);
    }
  });

  it('spreads the draw across the season rather than picking favourites', () => {
    // Fresh names go into the hat ahead of repeats, so a run of the card
    // reaches most of the house instead of the same three every time.
    house();
    const a = args();
    const seen = new Set();
    for (let w = 1; w <= 4; w++) {
      const act = runWildcard({ ...a, week: { num: w }, rng: lcg(w * 4241 + 7) });
      for (const n of act.players) seen.add(n);
    }
    // Four draws of three, out of eleven eligible: a hat that ignored history
    // would repeat heavily. Fresh-first should reach nearly everybody.
    expect(seen.size, `only ${seen.size} distinct houseguests across four draws`)
      .toBeGreaterThanOrEqual(9);
  });

  it('makes the winner safe only when the offer is taken', () => {
    const taken = ran('solo');
    expect(taken, 'nobody ever accepted a solo price').toBeTruthy();
    expect(wildcardSafe(taken)).toEqual([taken.winner]);

    const refused = ran('refused');
    expect(refused, 'nobody ever refused').toBeTruthy();
    expect(wildcardSafe(refused), 'refusing still bought safety').toEqual([]);
    // And refusing costs nothing — no punishment is served by anybody.
    expect(refused.served).toEqual([]);
  });

  it('bills the whole house, and it costs the winner something real', () => {
    const act = ran('house');
    expect(act, 'the house never once picked up the bill').toBeTruthy();
    expect(act.served.length, 'a house-wide price served by nobody')
      .toBe(gs.activePlayers.length - 1);
    expect(act.served, 'the winner served their own house-wide price')
      .not.toContain(act.winner);
    // The punishment is real: it reaches the store every other twist reads.
    for (const name of act.served) {
      expect(punishmentFor(name, 3), `${name} was billed and served nothing`).toBeTruthy();
    }
    // And the goodwill goes with it — this is a debt, not a cosmetic outrage.
    for (const name of act.served.slice(0, 3)) {
      expect(getBond(name, act.winner), `${name} did not mind paying`).toBeLessThan(0);
    }
  });

  it('reaches all three writers', () => {
    let seen = 0;
    for (let seed = 1; seed <= 20 && seen < 1; seed++) {
      house();
      const ep = withSeededRandom(seed * 41 + 3, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'wildcard');
      if (!act) continue;
      seen++;
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      for (const [label, text] of [
        ['summariseWeek', summariseWeek(week)],
        ['generateSummaryText', generateSummaryText(ep)],
      ]) {
        expect(text, `${label}: untranscribed`).toMatch(/THE WILDCARD/);
        expect(text, `${label}: never named the winner`).toContain(act.winner);
      }
      // And the viewing party draws it, with the bill readable once revealed.
      const deps = { tvState: { [`bb_wc_${ep.num}`]: { idx: 99 } }, reveal: () => '',
        esc: s => String(s), avatar: () => '' };
      const html = rpBuildBBWildcard(ep, act, deps);
      expect(html, 'no screen at all').toBeTruthy();
      expect(html).toContain(act.accepted ? 'ACCEPTED' : 'REFUSED');
      expect(html).toContain(act.houseWide ? 'BILL TO: THE HOUSE' : `BILL TO: ${act.winner}`);
    }
    expect(seen, 'the Wildcard never ran across 20 seeds').toBe(1);
  });

  it('is registered, booked, and explained', () => {
    expect(BB_TWIST_CONTRACTS['bb-wildcard']).toBeTruthy();
    expect(TWIST_CATALOG.some(t => t.id === 'bb-wildcard')).toBe(true);
    const theme = BB_THEMES['high-rollers'];
    expect(theme.books).toContain('bb-wildcard');
    expect(theme.arc.some(a => a.book === 'bb-wildcard')).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// EVERY CARD THIS THEME BOOKS IS EXPLAINED TO THE VIEWER
// ══════════════════════════════════════════════════════════════════════
//
// The primer is the only place a viewer is told what any of this is, and an
// audit found three cards booked by the arc that it never mentioned — the
// wrapped boxes (which this arc books more often than anything else), the
// double eviction, and the chip standings being shown to the viewer and not to
// the room. This is the guard so that gap cannot reopen when a card is added.
describe("High Roller's explains itself", () => {
  const theme = () => BB_THEMES['high-rollers'];

  // What in the primer proves each booked card is described. A booked card with
  // no row here is a card nobody has written an explanation for.
  const EXPLAINED = {
    'bb-prizes-and-punishments': /wrapped\s+box/i,
    'bb-wildcard': /drawn/i,
    'bb-high-rollers-room': /back room/i,
    'bb-coin-of-destiny': /Coin of Destiny/i,
    'bb-double-eviction': /double eviction/i,
  };

  it('describes every card in its own arc', () => {
    const booked = [...new Set(theme().arc.filter(a => a.book).map(a => a.book))];
    const rules = theme().primer.rules.join('\n');
    for (const id of booked) {
      const probe = EXPLAINED[id];
      expect(probe, `${id} is booked by the arc and nothing here explains it`).toBeTruthy();
      expect(rules, `the primer never explains ${id}`).toMatch(probe);
    }
    // And `books` agrees with the arc, so the catalog check has the same list.
    expect([...booked].sort()).toEqual([...theme().books].sort());
  });

  it('explains the money before it explains anything bought with it', () => {
    // A viewer reads this once, in order. The payout is what every price on the
    // menu is measured against, so it cannot appear after the menu.
    const rules = theme().primer.rules;
    const payout = rules.findIndex(r => /audience pays every houseguest/i.test(r));
    const firstPurchase = rules.findIndex(r => /back room|Coin of Destiny/i.test(r));
    expect(payout).toBeGreaterThanOrEqual(0);
    expect(firstPurchase).toBeGreaterThan(payout);
  });

  it('still never says "the house" anywhere in the primer', () => {
    expect(JSON.stringify(theme().primer).toLowerCase()).not.toMatch(/\bthe house\b/);
  });
});
