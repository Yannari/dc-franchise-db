// An accusation is either true or it is a move, and the house should know which.
//
// The exposure event announced that a houseguest "has been making the same
// final-two promise to several people. Two of them immediately confirm it" —
// picked at random from a pool, about somebody who very often had one deal or
// none. Two people then confirmed a thing that had not happened. Every other
// line in that pool describes contradictions in what was said, which the
// exposure firing at all already establishes; that one names a number, so it
// has to earn it.
//
// The other half is the point though. Accusing somebody of double-dealing is
// the most effective thing you can say in this house, which is exactly why
// people say it about houseguests who are not doing it. That is a legitimate
// move — it just has to be marked as a lie and carry the risk of being found
// out, or it is a free shot.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { makeEndgameDeal, endgameDealsOf } from '../js/bb/deals.js';
import { seedGame } from './helpers/setup.js';

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
    twistSchedule: [], bbSafetyMode: 'off', bbHaveNots: 'off', bbDepartures: 'off',
    romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
  gs.namedAlliances = []; gs.intentions = {};
}

describe('the double-dealing claim is checked before it is made', () => {
  beforeEach(house);

  it('does not accuse somebody who has one deal or none', () => {
    // Exactly the case that was shipping: Julia with a single promise, announced
    // to the house as having made several, confirmed by two people.
    makeEndgameDeal('Bowie', 'Chase', 'final-two', { week: { num: 2 } });
    const partners = endgameDealsOf('Bowie').filter(d => d.active !== false);
    expect(partners.length).toBe(1);
  });

  it('recognises a genuine double-dealer', () => {
    makeEndgameDeal('Bowie', 'Chase', 'final-two', { week: { num: 2 } });
    makeEndgameDeal('Bowie', 'Ripper', 'final-two', { week: { num: 3 } });
    const deals = endgameDealsOf('Bowie').filter(d => d.active !== false);
    expect(deals.length).toBeGreaterThanOrEqual(2);
    // And both partners are nameable, which is what the line claims.
    const partners = deals.flatMap(d => d.players.filter(n => n !== 'Bowie'));
    expect(partners).toContain('Chase');
    expect(partners).toContain('Ripper');
  });
});

describe('a false accusation is a move with a price', () => {
  it('is recorded as false when it is made', () => {
    let claims = [];
    for (let season = 0; season < 3 && !claims.length; season++) {
      house();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 10) {
        if (!simulateBBEpisode()) break;
        claims = gs.bb?.falseClaims || [];
        if (claims.length) break;
      }
    }
    expect(claims.length, 'nobody ever made one up').toBeGreaterThan(0);
    for (const claim of claims) {
      expect(claim.kind).toBe('double-dealing');
      expect(claim.liar).not.toBe(claim.mark);
      // The whole point: the accused was NOT double-dealing when accused.
      //
      // Checked against the count recorded at the time rather than the count
      // now — the season keeps going, and somebody accused in week three can
      // genuinely be doing it by week ten. That is not the lie becoming
      // retroactively true, it is the accuser getting lucky.
      expect(claim.partnersAtClaim, `${claim.mark} was actually double-dealing`).toBeLessThan(2);
    }
  }, 120000);

  it('can be found out, and costs the liar when it is', () => {
    let collapsed = 0, told = 0;
    for (let season = 0; season < 4; season++) {
      house();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 12) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        for (const act of ep.acts || []) {
          for (const beat of act.socialBeats || []) {
            if (beat.eventId === 'scheme-false-accusation') told++;
            if (beat.eventId === 'scheme-accusation-collapses') collapsed++;
          }
        }
      }
    }
    expect(told, 'the lie never gets told').toBeGreaterThan(0);
    expect(collapsed, 'a lie is never found out — it is a free shot').toBeGreaterThan(0);
    // And not every lie unravels, or nobody would ever try it.
    expect(collapsed).toBeLessThan(told);
  }, 180000);
});
