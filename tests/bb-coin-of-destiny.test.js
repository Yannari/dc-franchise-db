// The Coin of Destiny (BB23).
//
// Anybody may buy in, and buying in is PUBLIC. They play a game of skill, and
// the winner is taken away to call a coin toss where nobody can see. Call it
// right and the week's nominations come off the Head of Household; call it
// wrong and they have paid, played and lost in front of everybody.
//
// It is the Coup d'Etat with the name taken off, and that is the whole point:
// a Coup leaves a dethroned HOH with somebody to hate, and this leaves them
// with a list of everybody who paid, one of whom did it.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { COIN_EVENTS } from '../js/bb-events/coin-of-destiny.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { runCoinOfDestiny, COIN_PRICE } from '../js/bb/coin-of-destiny.js';
import { balance, credit } from '../js/bb/bb-bucks.js';
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
  seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-coin-of-destiny' }];
}

const actOf = ep => (ep.acts || []).find(a => a.type === 'coin-of-destiny') || null;
const beats = ep => (ep.acts || []).flatMap(a => a.socialBeats || [])
  .filter(b => String(b.eventId || '').startsWith('coin-'));

function play(want = null) {
  for (let seed = 1; seed <= 30; seed++) {
    house();
    const ep = withSeededRandom(seed * 41 + 3, () => simulateBBEpisode());
    const act = actOf(ep);
    if (!act) continue;
    if (want === null || act.calledRight === want) return { ep, act };
  }
  return null;
}

describe('the Coin of Destiny', () => {
  beforeEach(house);

  it('is registered as a purchase channel that can take the ceremony', () => {
    expect(BB_TWIST_CONTRACTS['bb-coin-of-destiny']).toBeTruthy();
    expect(TWIST_CATALOG.some(t => t.id === 'bb-coin-of-destiny')).toBe(true);
    expect(resolveWeekTwistState(['bb-coin-of-destiny']).rules.ceremonyAuthority)
      .toBe('coin-holder');
    // The first twist to use the purchase channel.
    expect(BB_TWIST_CONTRACTS['bb-coin-of-destiny'].acquisition.channel).toBe('purchase');
  });

  it('rewrites the block when the call lands', () => {
    const played = play(true);
    expect(played, 'no winning call in 30 seeds').toBeTruthy();
    const { ep, act } = played;
    expect(act.nominees).toHaveLength(2);
    expect(ep.initialNominees.slice().sort()).toEqual([...act.nominees].sort());
    // A dethroned Head of Household is still safe, and the winner cannot seat
    // themselves either.
    expect(act.nominees).not.toContain(ep.hoh);
    expect(act.nominees).not.toContain(act.winner);
  });

  it('costs the buyer everything and changes nothing when it does not', () => {
    const played = play(false);
    expect(played, 'no losing call in 30 seeds').toBeTruthy();
    const { act } = played;
    expect(act.nominees).toHaveLength(0);
    expect(act.dethroned).toBeFalsy();
    // They still paid in public, which is the part that does not refund.
    expect(act.buyers).toContain(act.winner);
  });

  it('reaches both transcripts without naming who called it', () => {
    const played = play();
    expect(played, 'no coin week to check').toBeTruthy();
    const { ep, act } = played;
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1])],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: untranscribed`).toMatch(/THE COIN OF DESTINY/);
      // Who paid is public. Who called it is not — the transcript may name the
      // winner of the GAME, because the house watched that, but must never say
      // the call went their way.
      expect(text).not.toContain(`${act.winner} called it right`);
    }
  });

  it('makes the house suspect everybody who paid', () => {
    expect(COIN_EVENTS.length).toBeGreaterThanOrEqual(5);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of COIN_EVENTS) expect(ids.has(e.id), `${e.id} unreachable`).toBe(true);
    let seen = 0;
    for (let seed = 1; seed <= 25; seed++) {
      house();
      const ep = withSeededRandom(seed * 41 + 3, () => simulateBBEpisode());
      const act = actOf(ep);
      const bs = beats(ep);
      if (!act || !bs.length) continue;
      seen += bs.length;
      for (const b of bs) {
        for (const claim of [`${act.winner} called it`, `${act.winner} won the coin`,
          `${act.winner} took the nominations`]) {
          expect(b.text, `a beat named the caller: "${claim}"`).not.toContain(claim);
        }
      }
    }
    expect(seen, 'the house never reacted to the coin').toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE BUY-IN IS A PAYMENT
// ══════════════════════════════════════════════════════════════════════
//
// The Coin used to be bought with a probability: a `pull` off boldness and
// whether you were on the block, and no money changed hands. It is the
// floor's most expensive product and it was the only thing on the menu
// nobody paid for.
//
// The rules being asserted here are the room's, deliberately — the Coin is
// sold on its own night rather than out of the room, but a houseguest must
// not learn two different sets of rules about what buying in means.
describe('the Coin costs money', () => {
  // Everybody rich enough to walk in, so the only thing deciding the door is
  // whether they wanted to.
  const rich = (amount = COIN_PRICE * 3) => {
    house();
    for (const name of gs.activePlayers) credit(name, amount);
  };

  // A seeded run that actually produced buyers. Willingness is a draw, so a
  // single seed can legitimately empty the floor.
  const bought = (setup, seeds = 40) => {
    for (let seed = 1; seed <= seeds; seed++) {
      setup();
      const before = Object.fromEntries(gs.activePlayers.map(n => [n, balance(n)]));
      const act = withSeededRandom(seed * 17 + 5, () => runCoinOfDestiny({
        week: { num: 4 }, house: [...gs.activePlayers],
        hoh: gs.activePlayers[0], nominees: gs.activePlayers.slice(1, 3),
      }));
      if (act && (act.buyers || []).length) return { act, before };
    }
    return null;
  };

  it('takes the price on the way in, from everybody who walked in', () => {
    const played = bought(rich);
    expect(played, 'nobody ever bought in across 40 seeds').toBeTruthy();
    const { act, before } = played;
    expect(COIN_PRICE).toBeGreaterThan(125);   // above the Roulette: the premium product
    for (const name of act.buyers) {
      expect(balance(name), `${name} was not charged`).toBe(before[name] - COIN_PRICE);
    }
    // And nobody who stayed on the sofa paid for the privilege.
    for (const name of gs.activePlayers) {
      if (act.buyers.includes(name)) continue;
      expect(balance(name), `${name} paid without playing`).toBe(before[name]);
    }
  });

  it('does not refund the loser, or the winner who calls it wrong', () => {
    // Every buyer but one loses the game outright; that is the shape of a
    // field with a single winner. If losing refunded, the arithmetic above
    // would only hold for the winner.
    const played = bought(rich);
    const { act, before } = played;
    const losers = act.buyers.filter(n => n !== act.winner);
    expect(losers.length, 'a one-entrant field proves nothing here').toBeGreaterThan(0);
    for (const name of losers) expect(balance(name)).toBe(before[name] - COIN_PRICE);
    // The winner pays the same whether the toss lands or not.
    expect(balance(act.winner)).toBe(before[act.winner] - COIN_PRICE);
  });

  it('lets a houseguest want in and be unable to pay for it', () => {
    // Nobody can afford it. Willingness is still decided first, so the people
    // who walked up to the door are a visible thing that happened.
    let seen = null;
    for (let seed = 1; seed <= 40 && !seen; seed++) {
      house();
      const act = withSeededRandom(seed * 17 + 5, () => runCoinOfDestiny({
        week: { num: 4 }, house: [...gs.activePlayers],
        hoh: gs.activePlayers[0], nominees: gs.activePlayers.slice(1, 3),
      }));
      if (act && (act.short || []).length) seen = act;
    }
    expect(seen, 'a broke house never once approached the table').toBeTruthy();
    expect(seen.buyers).toHaveLength(0);
    expect(seen.winner).toBeNull();
    expect(seen.calledRight).toBe(false);
    for (const name of seen.short) expect(balance(name)).toBe(0);
  });

  it('sells one buy-in per houseguest per season', () => {
    rich();
    const args = () => ({
      week: { num: 4 }, house: [...gs.activePlayers],
      hoh: gs.activePlayers[0], nominees: gs.activePlayers.slice(1, 3),
    });
    const first = withSeededRandom(211, () => runCoinOfDestiny(args()));
    expect(first?.buyers?.length, 'no first sitting to repeat').toBeGreaterThan(0);
    const seats = new Set(first.buyers);
    // Run it again in the same season. Anybody who already sat down is barred,
    // win or lose — the seat is burned, not the outcome.
    for (let seed = 300; seed < 320; seed++) {
      const again = withSeededRandom(seed, () => runCoinOfDestiny(args()));
      for (const name of (again?.buyers || [])) {
        expect(seats.has(name), `${name} bought a second seat`).toBe(false);
      }
    }
  });

  it('names every buyer exactly once', () => {
    const { act } = bought(rich);
    expect(new Set(act.buyers).size).toBe(act.buyers.length);
    // And nobody is on both lists.
    for (const name of act.buyers) expect(act.short || []).not.toContain(name);
  });
});
