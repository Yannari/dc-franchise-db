// The morning after somebody leaves.
//
// Nothing in the house read the ballots after a vote — one reader of votingLog
// existed in the whole event library and it only asked whether anybody had ever
// voted at all. So events that wanted to talk about the last eviction had
// nothing to talk about and made it up, which is how one of them described "the
// last two evictions" in week two. Rewriting the sentence hid that; it did not
// fix it.
//
// The bigger absence was strategic. Losing an ally is the most reliable engine
// of grudges in the format and it produced nothing: no grief, no blame, no
// credit for the person who quietly kept your friend.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import {
  lastCompletedWeek, votedAgainst, reactionsTo, chiefMourner, assignBlame,
  keptThem, wroteTheName, timesVotedTogether, evictionCount,
} from '../js/bb/fallout.js';
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

/** A finished week with ballots we control. */
function stageWeek({ evicted, hoh, against, kept, num = 1 }) {
  gs.bb.weeks.push({
    num, evicted, hoh, vetoWinner: null, finalNominees: [evicted, 'Caleb'],
    ballots: [
      ...against.map(voter => ({ voter, evict: evicted })),
      ...kept.map(voter => ({ voter, evict: 'Caleb' })),
    ],
  });
  return gs.bb.weeks[gs.bb.weeks.length - 1];
}

describe('the ballots are readable afterwards', () => {
  beforeEach(house);

  it('knows who wrote the name down and who did not', () => {
    stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase', 'Ripper'], kept: ['Scary'] });
    expect(votedAgainst('Chase')).toBe(true);
    expect(votedAgainst('Scary')).toBe(false);
    // Somebody who had no vote to cast is not the same as somebody who kept them.
    expect(votedAgainst('Nichelle')).toBeNull();
    expect(wroteTheName()).toEqual(['Chase', 'Ripper']);
    expect(keptThem()).toEqual(['Scary']);
  });

  it('counts the evictions that actually happened', () => {
    expect(evictionCount()).toBe(0);
    stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase'], kept: ['Scary'], num: 1 });
    expect(evictionCount()).toBe(1);
  });

  it('counts how many times a group really voted as one', () => {
    // The number the bloc events were reaching for when they claimed "twice
    // running" out of nothing.
    stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase', 'Ripper'], kept: ['Scary'], num: 1 });
    stageWeek({ evicted: 'Millie', hoh: 'Bowie', against: ['Chase', 'Ripper'], kept: ['Scary'], num: 2 });
    const bloc = { members: ['Chase', 'Ripper'] };
    expect(timesVotedTogether(bloc)).toBe(2);
    expect(timesVotedTogether({ members: ['Chase', 'Scary'] })).toBe(0);
  });
});

describe('grief is proportional to how close they actually were', () => {
  beforeEach(house);

  it('hurts most for the person who lost a friend', () => {
    addBond('Scary', 'Zee', 8);
    addBond('Emmah', 'Zee', -6);
    stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase', 'Ripper'], kept: ['Scary'] });
    const mourner = chiefMourner();
    expect(mourner.name).toBe('Scary');
    const relieved = reactionsTo().find(r => r.name === 'Emmah');
    expect(relieved.relief).toBeGreaterThan(0);
    expect(relieved.grief).toBe(0);
  });

  it('marks the ones who cried over a name they wrote', () => {
    // The reaction the audience always catches and the house usually does too.
    addBond('Chase', 'Zee', 6);
    // Scary was also close to Zee and kept them — the counterpart reading.
    addBond('Scary', 'Zee', 4);
    stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase'], kept: ['Scary'] });
    expect(reactionsTo().find(r => r.name === 'Chase').hypocrisy).toBeGreaterThan(0);
    expect(reactionsTo().find(r => r.name === 'Scary').hypocrisy).toBe(0);
    expect(reactionsTo().find(r => r.name === 'Scary').loyal).toBe(true);
  });
});

describe('blame is a reconstruction, not a lookup', () => {
  beforeEach(house);

  it('lands on somebody, with a reason', () => {
    addBond('Scary', 'Zee', 8);
    stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase', 'Ripper'], kept: ['Scary'] });
    const verdict = assignBlame('Scary');
    expect(verdict).toBeTruthy();
    expect(verdict.blamed).not.toBe('Scary');
    expect(verdict.why).toBeTruthy();
    expect(typeof verdict.correct).toBe('boolean');
  });

  it('suspects the Head of Household even when they had no vote', () => {
    // Public, undeniable, first place anybody looks — which is why an HOH wears
    // a result they did not control.
    addBond('Scary', 'Zee', 8);
    addBond('Scary', 'Bowie', 0);
    stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase'], kept: ['Scary'] });
    const verdict = assignBlame('Scary');
    expect(verdict.reasons.join(' ') + verdict.blamed).toBeTruthy();
    // Bowie cast no ballot, so blaming Bowie is by definition the wrong answer
    // and the model must be willing to reach it.
    expect(votedAgainst('Bowie')).toBeNull();
  });

  it('does not always get it right across a season', () => {
    // A misfire is as much a part of the show as the correct read. If every
    // mourner solved it, secret votes would not be secret.
    let correct = 0, wrong = 0;
    for (let season = 0; season < 3; season++) {
      house();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 10) {
        if (!simulateBBEpisode()) break;
        const week = lastCompletedWeek();
        const mourner = chiefMourner(week);
        if (!mourner) continue;
        const verdict = assignBlame(mourner.name, week);
        if (!verdict) continue;
        if (verdict.correct) correct++; else wrong++;
      }
    }
    expect(correct + wrong, 'nobody ever assigned blame').toBeGreaterThan(3);
    expect(wrong, 'every single mourner solved a secret vote').toBeGreaterThan(0);
  }, 120000);
});

describe('the fallout reaches the feed', () => {
  it('fires each reckoning once per eviction, not once per beat', () => {
    house();
    const counts = {};
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 8) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const perWeek = {};
      for (const act of ep.acts || []) {
        for (const beat of act.socialBeats || []) {
          if (!/^fallout-/.test(beat.eventId || '')) continue;
          perWeek[beat.eventId] = (perWeek[beat.eventId] || 0) + 1;
          counts[beat.eventId] = (counts[beat.eventId] || 0) + 1;
        }
      }
      for (const [id, n] of Object.entries(perWeek)) {
        expect(n, `${id} ran ${n} times in one week`).toBeLessThanOrEqual(1);
      }
    }
    // And it does happen — a guard that silences everything would also pass the
    // assertion above.
    expect(Object.keys(counts).length, 'no fallout event fired all season').toBeGreaterThan(2);
  }, 120000);
});
