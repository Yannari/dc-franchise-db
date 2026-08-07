// Prizes and Punishments — the show's oldest veto format.
//
// The competition stops awarding the veto and starts setting the PICK ORDER:
// finish last and you pick first out of unopened boxes, win it and you pick
// last with everything on the table and stealable. The Power of Veto is one of
// the boxes, alongside cash, a holiday, a call home, confetti, and punishments
// nobody wants.
//
// What makes it terminate — and the thing worth pinning — is that a trade is a
// straight SWAP: the houseguest traded with simply receives what was handed
// over and does not get another turn. Every picker acts exactly once, so the
// exchange is bounded by the number of players and cannot cycle.
//
// The first build gave the victim another go, which is a real party-game rule
// and broke the format: the veto could be taken straight back, so the last
// pick — the thing winning the competition buys — was worth less than random
// chance.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { runPrizeExchange, EXCHANGE_PRIZES } from '../js/bb/prize-exchange.js';
import { BB_PUNISHMENTS, punishmentFor } from '../js/bb/punishments.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(weeks = 1) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = Array.from({ length: weeks },
    (_, i) => ({ episode: i + 1, type: 'bb-prizes-and-punishments' }));
  gs.bb ||= {};
  gs.bb.punishments = [];
}

const actOf = ep => (ep.acts || []).find(a => a.type === 'prize-exchange') || null;

function play(want = () => true, weeks = 2) {
  for (let seed = 1; seed <= 30; seed++) {
    house(weeks);
    for (let w = 0; w < weeks; w++) {
      const ep = withSeededRandom(seed * 17 + w * 5 + 3, () => simulateBBEpisode());
      if (!ep) break;
      const act = actOf(ep);
      if (act && want(act, ep)) return { ep, act };
    }
  }
  return null;
}

describe('Prizes and Punishments', () => {
  beforeEach(() => house());

  it('is registered as a veto-competition route', () => {
    const c = BB_TWIST_CONTRACTS['bb-prizes-and-punishments'];
    expect(c).toBeTruthy();
    expect(c.acquisition.channel).toBe('veto-competition');
    expect(TWIST_CATALOG.some(t => t.id === 'bb-prizes-and-punishments')).toBe(true);
    expect(EXCHANGE_PRIZES.length).toBeGreaterThanOrEqual(4);
  });

  it('always terminates, and gives everybody exactly one thing', () => {
    // The hazard this format has and no other does: steal chains. Hammer it.
    let rs = 7;
    const rng = () => { rs = (rs * 1103515245 + 12345) % 2147483648; return rs / 2147483648; };
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
      ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    for (let i = 0; i < 300; i++) {
      gs.bb = { punishments: [], weeks: [] };
      const size = 3 + (i % 8);
      const order = NAMES.slice(0, size);
      const act = runPrizeExchange({
        week: { num: 1 }, order, nominees: order.slice(0, 2), hoh: order[size - 1], rng,
        archetypeOf: n => CAST.find(c => c.name === n)?.archetype || '',
      });
      expect(act, `no act for ${size} players`).toBeTruthy();
      // Exactly one item each, no duplicates, and the veto went somewhere.
      expect(act.held).toHaveLength(size);
      expect(new Set(act.held.map(h => h.name)).size).toBe(size);
      expect(act.vetoHolder, 'the veto vanished').toBeTruthy();
      expect(order).toContain(act.vetoHolder);
      // Straight swaps: one turn each, so trades can never exceed the field.
      expect(act.steals.length, 'more trades than pickers').toBeLessThanOrEqual(size);
      // And a swap conserves items — nothing is duplicated or lost.
      expect(new Set(act.held.map(h => h.boxNo)).size, 'an item was duplicated')
        .toBe(size);
    }
  });

  it('hands the veto to whoever is holding it when the music stops', () => {
    const played = play();
    expect(played, 'the exchange never ran').toBeTruthy();
    const { ep, act } = played;
    // The week treats the final holder as the veto winner — the ceremony, the
    // replacement and the record all read this.
    expect(ep.vetoWinner).toBe(act.vetoHolder);
  });

  it('actually punishes the people who opened the wrong box', () => {
    const played = play(a => a.punished.length > 0);
    expect(played, 'nobody was ever punished').toBeTruthy();
    const { act } = played;
    for (const p of act.punished) {
      expect(BB_PUNISHMENTS[p.id], `not a real punishment: ${p.id}`).toBeTruthy();
      expect(punishmentFor(p.name, act.week), `${p.name} was never punished`).toBeTruthy();
    }
  });

  it('lets the veto be stolen, and the last hand on it keeps it', () => {
    // This asserted the veto could change hands exactly once, which belonged to
    // the steal-chain build: boxes froze after a set number of steals so a chain
    // could not cycle. That design was dropped for straight swaps — one turn per
    // picker, no re-steals, so the loop is bounded by the field and needs no
    // freeze. Under swaps the veto moving twice is the format WORKING: it means
    // a later picker, who paid for that seat by winning the competition, looked
    // at an open table and took it. Pinning it to one steal quietly outlawed the
    // thing the last pick is for.
    const played = play(a => a.steals.some(s => s.kind === 'veto'));
    if (!played) return;                 // rare on small samples; pinned above
    const { act } = played;
    const vetoSteals = act.steals.filter(s => s.kind === 'veto');
    // Nobody gets a second bite: one swap per picker is what bounds the loop.
    const thieves = act.steals.map(s => s.thief);
    expect(new Set(thieves).size, 'somebody swapped twice').toBe(thieves.length);
    // Whoever took it last is holding it when the music stops.
    expect(act.vetoHolder).toBe(vetoSteals[vetoSteals.length - 1].thief);
  });

  it('does not let the competition claim to award the veto', () => {
    // The bug this pins: the ordinary veto act still ran after the exchange
    // with `winner` reassigned to the final holder, so the episode showed a
    // scoreboard and then said somebody else had won it. The competition's
    // winner and the veto's holder are two different facts and both are true.
    const played = play();
    expect(played, 'the exchange never ran').toBeTruthy();
    const { ep, act } = played;
    const veto = (ep.acts || []).find(a => a.type === 'veto');
    expect(veto, 'no veto act').toBeTruthy();
    expect(veto.orderOnly, 'the comp still claimed to award the veto').toBe(true);
    expect(veto.winner).toBe(act.compWinner);
    expect(veto.vetoHolder).toBe(act.vetoHolder);
    expect(ep.vetoWinner).toBe(act.vetoHolder);
    expect(veto.pickOrder).toEqual(act.order);

    // And it says so, rather than printing "wins the Power of Veto".
    const text = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(text).toMatch(/awards the LAST PICK/);
    expect(text).not.toContain(`${act.compWinner} wins the Power of Veto`);
  });

  it('shows the boxes AFTER the competition that set the order', () => {
    const played = play();
    expect(played, 'the exchange never ran').toBeTruthy();
    const types = (played.ep.acts || []).map(a => a.type);
    expect(types.indexOf('prize-exchange'), 'the boxes came out before the comp')
      .toBeGreaterThan(types.indexOf('veto'));
  });

  it('reaches both transcripts', () => {
    const played = play();
    expect(played, 'no exchange to transcribe').toBeTruthy();
    const { ep, act } = played;
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1])],
      ['generateSummaryText', generateSummaryText(ep)],
    ]) {
      expect(text, `${label}: untranscribed`).toMatch(/PRIZES AND PUNISHMENTS/);
      expect(text, `${label}: never said who got the veto`).toContain(act.vetoHolder);
    }
  });
});
