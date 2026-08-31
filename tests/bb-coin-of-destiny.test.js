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
import { BB_THEMES } from '../js/bb/themes.js';
import { rpBuildBBCoinOfDestiny } from '../js/vp-bb-coin.js';
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

  it('never names the holder on any surface, even as a chair authority', () => {
    // The act carries `chairAuthority` so the Diamond Veto can say who named a
    // replacement. Under the Coin that field is the one thing the house must
    // never be told, so the ceremony has to declare itself anonymous.
    let checked = 0;
    for (let seed = 1; seed <= 30; seed++) {
      house();
      const ep = withSeededRandom(seed * 41 + 3, () => simulateBBEpisode());
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      if (!week?.coinAuthority) continue;
      checked++;
      const ceremony = (ep.acts || []).find(a => a.type === 'veto-ceremony');
      if (ceremony) {
        expect(ceremony.chairAuthority).toBe(week.coinAuthority);
        expect(ceremony.anonymous, 'a coin ceremony announced its author').toBe(true);
      }
      for (const [label, text] of [
        ['summariseWeek', summariseWeek(week)],
        ['generateSummaryText', generateSummaryText(ep)],
      ]) {
        // Privacy belongs to the Coin surface. The rest of a full-week
        // transcript may independently say "asked by Scary" or similar about
        // an ordinary campaign without identifying the Coin holder.
        const start = text.indexOf('THE COIN OF DESTINY');
        const surface = start < 0 ? text : text.slice(start).split(/\n\s*\n[A-Z][A-Z —'-]+\n/)[0];
        for (const claim of [
          `by ${week.coinAuthority}`,
          `${week.coinAuthority} names`,
          `${week.coinAuthority} is named as the replacement`,
        ]) {
          expect(surface, `${label} named the holder: "${claim}"`).not.toContain(claim);
        }
      }
    }
    expect(checked, 'no coin ever took a week across 30 seeds').toBeGreaterThan(0);
  });

  it('keeps the holder and the dethroned HOH off the block all week', () => {
    let checked = 0;
    for (let seed = 1; seed <= 30; seed++) {
      house();
      const ep = withSeededRandom(seed * 41 + 3, () => simulateBBEpisode());
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      if (!week?.coinAuthority) continue;
      checked++;
      // Canon: the winner is the Head of Household for the week, and a
      // dethroned Head of Household stays safe. Neither can end up in a chair.
      expect(week.finalNominees || []).not.toContain(week.coinAuthority);
      expect(week.finalNominees || []).not.toContain(week.coinDethroned);
      // And the person the veto saved is not put straight back.
      const ceremony = (ep.acts || []).find(a => a.type === 'veto-ceremony');
      if (ceremony?.saved) expect(ceremony.replacement).not.toBe(ceremony.saved);
    }
    expect(checked, 'no coin ever took a week across 30 seeds').toBeGreaterThan(0);
  });

  it('lets a dethroned Head of Household win it back', () => {
    // Canon is explicit: the dethroned HOH stays safe and competes in the next
    // Head of Household competition. `outgoingHoh` is what bars somebody from
    // that competition, so a dethroning must clear it — otherwise the Coin
    // takes the week AND the chance to get it back, which no rule asks for.
    let checked = 0;
    let ordinary = 0;
    for (let seed = 1; seed <= 30; seed++) {
      house();
      withSeededRandom(seed * 41 + 3, () => simulateBBEpisode());
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      if (week?.coinDethroned) {
        checked++;
        expect(gs.bb.outgoingHoh, 'a dethroned HOH was still barred').toBeNull();
      } else if (week?.hoh && !week.hohSecret && !week.rewound) {
        ordinary++;
        // And the ordinary bar is untouched.
        expect(gs.bb.outgoingHoh).toBe(week.hoh);
      }
    }
    expect(checked, 'nobody was ever dethroned across 30 seeds').toBeGreaterThan(0);
    expect(ordinary, 'no ordinary week to compare against').toBeGreaterThan(0);
  });

  it('leaves a week with no coin exactly as it was', () => {
    // The ceremony this touches is hooked by the Diamond Veto, Roadkill, the
    // Block Buster, America's Nominee, the Roulette and the Veto Derby. A week
    // with no coin must not notice that the Coin exists.
    const run = () => {
      house();
      seasonConfig.twistSchedule = [];
      const ep = withSeededRandom(9091, () => simulateBBEpisode());
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      return { auth: week.coinAuthority ?? null, text: summariseWeek(week),
        noms: [...(week.finalNominees || [])] };
    };
    const a = run();
    expect(a.auth).toBeNull();
    expect(run()).toEqual(a);
  });

  it('is described to the viewer as the thing it actually does', () => {
    // Four rounds of copy fixes have gone into this theme and every one of them
    // was a surface promising a power the engine did not grant. The Coin's own
    // copy promised the NOMINATIONS and stopped there, which was the engine's
    // old behaviour and half of the rule.
    const primer = BB_THEMES['high-rollers']?.primer;
    expect(primer, 'the theme lost its primer').toBeTruthy();
    const rules = primer.rules.join(' ');
    expect(rules).toContain('Coin of Destiny');
    expect(rules, 'the primer does not say what it costs').toContain(String(COIN_PRICE));
    // The two halves of canon that the old copy left out.
    expect(rules).toMatch(/replacement/i);
    expect(rules).toMatch(/competes again|compete again/i);

    const ann = BB_TWIST_CONTRACTS['bb-coin-of-destiny'].announcement;
    expect(ann.rule).toMatch(/replacement/i);
    expect(ann.rule).toMatch(/Head of Household for the rest of the week/i);

    const cat = TWIST_CATALOG.find(t => t.id === 'bb-coin-of-destiny');
    expect(cat.desc).toContain(String(COIN_PRICE));
    expect(cat.desc).toMatch(/replacement/i);

    // And the price is not written down twice in two different places.
    for (const [label, text] of [['primer', rules], ['announcement', ann.rule],
      ['catalog', cat.desc]]) {
      for (const stale of ['250 BB Bucks', 'costs 250']) {
        expect(text, `${label} still quotes the canon price`).not.toContain(stale);
      }
    }
  });

  it('draws a floor nobody could pay for, without narrating a wrong call', () => {
    // The viewing party's outcome card says somebody "paid, played and lost",
    // which is a sentence about a seat that was sold. On an empty floor no seat
    // was sold and there was no call, so the card has to be a different one.
    const act = {
      type: 'coin-of-destiny', week: 6, secret: true, price: COIN_PRICE,
      buyers: [], short: ['Axel', 'Dave'], declined: ['Zee'], winner: null,
      calledRight: false, dethroned: null, nominees: [], hoh: 'Millie',
      beats: [{ text: 'Nobody sits down.', players: ['Axel'], badgeText: 'NOBODY COULD PAY',
        badgeClass: 'grey' }],
    };
    // Cards are click-to-reveal, so a fresh state draws every one of them
    // hidden and would prove nothing about their contents. Seed the reveal
    // index past the end so the branch under test is actually rendered.
    const ep = { num: 6 };
    const deps = { tvState: { bb_cd_6: { idx: 99 } }, reveal: () => '',
      esc: s => String(s), avatar: () => '' };
    const html = rpBuildBBCoinOfDestiny(ep, act, deps);
    expect(html, 'the empty floor renders nothing at all').toBeTruthy();
    expect(html, 'narrated a seat that was never sold').not.toContain('paid, played');
    expect(html).toContain('SHORT');
    expect(html).toContain(String(COIN_PRICE));
    // And the ordinary act still draws its own, different, card.
    const sold = { ...act, buyers: ['Axel'], short: [], winner: 'Axel' };
    const soldHtml = rpBuildBBCoinOfDestiny(ep, sold, deps);
    expect(soldHtml).toContain('paid, played');
  });

  it('names every buyer exactly once', () => {
    const { act } = bought(rich);
    expect(new Set(act.buyers).size).toBe(act.buyers.length);
    // And nobody is on both lists.
    for (const name of act.buyers) expect(act.short || []).not.toContain(name);
  });
});
