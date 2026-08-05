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
