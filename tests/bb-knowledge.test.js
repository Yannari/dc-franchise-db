// What the house knows, and how it finds out.
//
// The simulator has had a real knowledge model for a long time — facts with a
// truth value, per-person beliefs with a confidence and a source, second-order
// knowledge, propagation between people who actually talk. Total Drama uses all
// of it. Big Brother reached one function in it, and only because the shared
// scheme generators call it on the way past.
//
// The wiring is not a copy, because the two shows differ on the one thing that
// matters most here: Survivor and Total Drama read the votes out loud, so every
// ballot is public. In this house the vote is secret and the only person who
// observes a ballot is the person who cast it. Everything below follows from
// that line.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import {
  recordBBVotes, recordBBFalseClaim, knowsVote, believedVoters, bbContacts,
  tickBBKnowledge, reconcileBBJury,
} from '../js/bb/knowledge.js';
import { assignBlame, chiefMourner, lastCompletedWeek } from '../js/bb/fallout.js';
import { factId, learn, believes, isAccurate } from '../js/knowledge.js';
import { withSeededRandom } from './helpers/rng.js';
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
  gs.namedAlliances = []; gs.intentions = {}; gs.knowledge = {}; gs.jury = [];
}

function stageWeek({ evicted, hoh, against, kept, num = 1 }) {
  const week = {
    num, evicted, hoh, vetoWinner: null, finalNominees: [evicted, 'Caleb'],
    ballots: [
      ...against.map(voter => ({ voter, evict: evicted })),
      ...kept.map(voter => ({ voter, evict: 'Caleb' })),
    ],
  };
  gs.bb.weeks.push(week);
  recordBBVotes(week);
  return week;
}

// ── how the season-playing assertions in this file are measured ───────
//
// Every one of these used to play a season on raw Math.random, which made a
// statistical claim into a coin flip. Measured over ten seeds the nominee/safe
// ratio sits at 1.65 against a 1.4 floor but reaches down to 1.46, so an
// unlucky afternoon failed a rule nobody had broken — and the file became the
// suite's most reliable flake.
//
// Seeding alone is not enough, and this is the part worth remembering: a
// seeded season is only reproducible while the number of rng() calls before it
// stays the same. Retuning the luck on four competitions shifts the whole
// stream, so every "fixed" seed silently becomes a different season. That is
// drift, not regression, and it is why these pool MANY seasons and assert on
// the pooled figure rather than pinning one lucky week.
const SEASON_SEEDS = [20260803, 11, 202, 4242, 77, 1301, 909, 31,
  55, 808, 1234, 606, 7777, 42, 999, 313];

/**
 * Play one season on a fixed seed and hand back every episode.
 *
 * The house is reset INSIDE the seeded scope so the cast draw is pinned too,
 * and gs is left standing afterwards for the assertions that read it.
 */
function playSeason(seed, weeks = 8) {
  return withSeededRandom(seed, () => {
    house();
    const eps = [];
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < weeks) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      eps.push(ep);
    }
    return eps;
  });
}

const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

describe('the vote is secret', () => {
  beforeEach(house);

  it('tells only the voter how they voted', () => {
    stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase', 'Ripper'], kept: ['Scary'] });
    // The one line that separates this format from a Tribal Council.
    expect(knowsVote('Chase', 'Chase', 'Zee')).toBe(true);
    expect(knowsVote('Scary', 'Chase', 'Zee')).toBe(false);
    expect(knowsVote('Emmah', 'Ripper', 'Zee')).toBe(false);
  });

  it('makes who won power public without anybody saying anything', () => {
    stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase'], kept: ['Scary'] });
    // A ceremony everybody watched is not a secret.
    for (const name of ['Chase', 'Scary', 'Emmah']) {
      expect(believes(name, factId('power', 'Bowie'))).toBeTruthy();
    }
  });

  it('lets a vote travel when somebody passes it on', () => {
    const week = stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase'], kept: ['Scary'] });
    expect(knowsVote('Emmah', 'Chase', 'Zee')).toBe(false);
    // Fixed rng: 'told' is a persuasion roll inside learn(), so an unseeded one
    // makes this test about whether Emmah happened to believe Chase.
    learn('Emmah', factId('vote', 'Chase', 'Zee'),
      { source: 'Chase', sourceType: 'told', confidence: 0.85, from: 'Chase', ep: week.num, rng: () => 0 });
    expect(knowsVote('Emmah', 'Chase', 'Zee')).toBe(true);
    expect(believedVoters('Emmah', 'Zee')).toContain('Chase');
  });
});

describe('a belief can be wrong', () => {
  beforeEach(house);

  it('records a lie as false and marks the believer as mistaken', () => {
    // The point of a truth value: the simulation does not quietly agree with
    // the liar, so the house can find out later.
    recordBBFalseClaim('Bowie', 'Julia', { week: 3, believers: ['Chase'] });
    const id = factId('lie', 'Bowie', 'Julia');
    // The fact itself is on the record as untrue, which is what lets anybody
    // discover it later rather than the simulation siding with the liar.
    const dupe = believes('Chase', id);
    if (dupe) expect(dupe.factTruth).toBe(false);
    expect(believes('Bowie', id).factTruth).toBe(false);
  });
});

describe('information decides who gets blamed', () => {
  beforeEach(house);

  it('names the right person when somebody told them', () => {
    addBond('Scary', 'Zee', 8);
    const week = stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase', 'Ripper'], kept: ['Scary'] });
    // sourceType 'told' is a persuasion roll, not a transfer — a fixed rng so
    // the test is about the blame model rather than about whether Scary
    // happened to believe Ripper this time.
    learn('Scary', factId('vote', 'Chase', 'Zee'),
      { source: 'Ripper', sourceType: 'told', confidence: 0.9, from: 'Ripper', ep: week.num, rng: () => 0 });
    expect(knowsVote('Scary', 'Chase', 'Zee')).toBe(true);
    const verdict = assignBlame('Scary', week);
    expect(verdict.blamed).toBe('Chase');
    expect(verdict.correct).toBe(true);
    expect(verdict.reasons.join(' ')).toMatch(/told them/);
  });

  it('does not let a perceptive houseguest see through a wall', () => {
    // There used to be a term that added the true answer scaled by intuition.
    // Measured, a mourner who had been told nothing still identified the right
    // person 71% of the time; without it, one in three. Perception gets you
    // told things faster. It does not show you a ballot.
    addBond('Scary', 'Zee', 8);
    const week = stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Millie'], kept: ['Scary'] });
    const verdict = assignBlame('Scary', week);
    expect(verdict).toBeTruthy();
    // Millie is the only person who actually voted, and nobody has said so, so
    // there is no honest way for Scary to land on Millie.
    expect(verdict.blamed).not.toBe('Millie');
  });
});

describe('the house talks, and the jury talks more', () => {
  it('moves information around over a season', () => {
    playSeason(SEASON_SEEDS[0], 10);
    const hops = (gs.bb.weeks || [])
      .reduce((sum, week) => sum + (week?.knowledgeEvents || []).length, 0);
    expect(hops, 'nothing ever travelled').toBeGreaterThan(0);
    // And somebody other than the voter ends up knowing a vote. Checked across
    // the whole season rather than the final week: the last week's ballots get
    // exactly one chance to travel before the season ends.
    const secondHand = (gs.bb.weeks || []).some(week =>
      (gs.activePlayers || []).some(knower =>
        (week.ballots || []).some(b => b.voter !== knower
          && knowsVote(knower, b.voter, week.evicted))));
    expect(secondHand, 'every vote stayed with the person who cast it').toBe(true);
  }, 120000);

  it('only routes information to people worth telling', () => {
    house();
    addBond('Bowie', 'Chase', 7);
    addBond('Bowie', 'Millie', -6);
    const contacts = bbContacts('Bowie');
    expect(contacts.allies).toContain('Chase');
    expect(contacts.others).not.toContain('Millie');
  });

  it('lets a juror find out who wrote their name down', () => {
    house();
    gs.activePlayers = ['Bowie', 'Chase'];
    const week = stageWeek({ evicted: 'Zee', hoh: 'Bowie', against: ['Chase', 'Ripper'], kept: ['Scary'], num: 4 });
    gs.jury = ['Zee', 'Ripper', 'Scary'];
    // Zee did not know, because nobody in the house ever told them.
    expect(knowsVote('Zee', 'Chase', 'Zee')).toBe(false);
    learn('Zee', factId('vote', 'Chase', 'Zee'),
      { source: 'Ripper', sourceType: 'told', confidence: 0.9, from: 'Ripper', ep: 5 });
    const before = getBond('Zee', 'Chase');
    const learned = reconcileBBJury(gs.jury, { week: 5 });
    expect(learned.some(l => l.juror === 'Zee' && l.voter === 'Chase')).toBe(true);
    // Finding out in the jury house has nowhere to go except the final vote.
    expect(getBond('Zee', 'Chase')).toBeLessThan(before);
  });
});

// ── the invariant the whole layer rests on ────────────────────────────
//
// Nobody watches anybody else vote. Houseguests go into the Diary Room one at a
// time, alone, and that is the single fact everything else here is built on: it
// is why blame is a reconstruction, why being told is worth 74 points of
// accuracy, and why an eviction can be a blindside at all.
//
// It is also easy to break in prose without noticing. One event described a
// witness "writing the evictee's name down at the same table" as somebody else,
// which quietly asserts that the vote is public and makes the rest of this
// meaningless. These are the two checks that would have caught it.
describe('nobody sees anybody else vote', () => {
  it('never gives a non-voter first-hand knowledge of a ballot', () => {
    // An invariant, so every season has to satisfy it — pooling seasons here
    // buys coverage rather than statistical stability.
    const offenders = [];
    for (const seed of SEASON_SEEDS.slice(0, 6)) {
      playSeason(seed);
      for (const fact of Object.values(gs.knowledge || {})) {
        if (fact.type !== 'vote') continue;
        for (const [knower, belief] of Object.entries(fact.beliefs || {})) {
          // The voter observed their own ballot. Anybody else holding an
          // 'observed' belief about it saw something they could not have seen.
          if (knower !== fact.subject && belief.sourceType === 'observed') {
            offenders.push(`seed ${seed}: ${knower} claims to have watched ${fact.subject} vote`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  }, 300000);

  it('does not let any beat describe watching somebody vote', () => {
    const lines = [];
    for (const seed of SEASON_SEEDS.slice(0, 6)) {
      for (const ep of playSeason(seed)) {
        for (const act of ep.acts || []) {
          for (const beat of act.socialBeats || []) lines.push(String(beat.text || ''));
        }
      }
    }
    expect(lines.length).toBeGreaterThan(50);
    // Voting happens alone. Any beat placing two people at it is describing a
    // different show.
    //
    // `watched .{0,30}(vote|write)` used to do this job and was too loose: it
    // read "has watched Nichelle PROMISE this vote three times" as somebody
    // standing over a ballot, which is the opposite of what that beat says —
    // counting how often a promise gets repeated is exactly the inference the
    // secret ballot forces on people. The verb has to be the one being
    // watched, so only an adverb may sit between the name and it.
    const witnessed = lines.filter(line =>
      /(same table|watched\s+\S+\s+(?:\w+ly\s+)?(?:vote|voting|write)\b|saw\s+\S+\s+(?:\w+ly\s+)?(?:vote|write)\b.{0,20}name|next to .{0,20} as .{0,20} voted)/i.test(line));
    expect(witnessed, `beats describing a public vote: ${witnessed.join(' | ')}`).toEqual([]);
  }, 300000);
});

// ── whose week is it ──────────────────────────────────────────────────
//
// Every event file casts by asking who has been seen least, which spreads the
// spotlight evenly across fourteen people and flattens the one hierarchy this
// format guarantees: an episode belongs to the person with the power and the
// people who might go home. Measured before this, a nominee carried 1.5x the
// beats of somebody safe. An episode of the real show is not 1.5x.
describe('the week belongs to the people in it', () => {
  it('gives the block and the power more of the episode than the safe', () => {
    // Pooled across eight seasons. Measured on one random season the nominee
    // ratio sits at 1.65 but ranges down to 1.46 against a 1.4 floor, so a
    // single sample failed this on luck rather than on anything changing.
    const beats = { hoh: [], nominee: [], safe: [] };
    for (const seed of SEASON_SEEDS.slice(0, 8)) {
      for (const ep of playSeason(seed)) {
        const noms = new Set([...(ep.initialNominees || []), ...(ep.finalNominees || [])]);
        const counts = {};
        for (const act of ep.acts || []) {
          for (const b of act.socialBeats || []) {
            for (const n of new Set(b.players || [])) counts[n] = (counts[n] || 0) + 1;
          }
        }
        for (const name of ep.houseAtStart || []) {
          const c = counts[name] || 0;
          if (name === ep.hoh) beats.hoh.push(c);
          else if (noms.has(name)) beats.nominee.push(c);
          else if (name !== ep.vetoWinner) beats.safe.push(c);
        }
      }
    }
    const safe = mean(beats.safe);
    expect(safe, 'nobody safe was in anything').toBeGreaterThan(0);
    expect(mean(beats.hoh) / safe, 'the Head of Household is background').toBeGreaterThan(1.6);
    expect(mean(beats.nominee) / safe, 'the block is background').toBeGreaterThan(1.4);
    // And not so far that a safe houseguest disappears — they still live here.
    expect(safe).toBeGreaterThan(6);
  }, 400000);
});

// ── a couple is a storyline ────────────────────────────────────────────
//
// Of 123 events in this library, two mentioned a showmance before this: one
// line in the social file and the kiss trap. So a couple could form, be
// noticed, be targeted and be separated by an eviction without ever having a
// scene of its own — and measured, a safe houseguest in a showmance carried
// 0.95x the beats of a safe houseguest in nothing. Being in the most televised
// relationship in the format made you marginally less visible.
//
// No weighting could fix that. Casting order only chooses between people an
// event is already willing to use, and none was willing.
describe('a showmance gets screen time', () => {
  it('gives the couple scenes of their own', () => {
    house();
    const fired = {};
    let coupleWeeks = 0, guard = 0;
    while (!houseIsAtFinale() && guard++ < 12) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      if ((gs.showmances || []).some(sh => sh.phase !== 'broken-up')) coupleWeeks++;
      for (const act of ep.acts || []) {
        for (const b of act.socialBeats || []) {
          if (/^showmance-/.test(b.eventId || '')) fired[b.eventId] = (fired[b.eventId] || 0) + 1;
        }
      }
    }
    // Romance is on and the cast is compatible, so a season should produce at
    // least one couple; if it does, that couple must have had its own week.
    if (coupleWeeks > 0) {
      const total = Object.values(fired).reduce((a, b) => a + b, 0);
      expect(total, 'a couple existed and never had a scene').toBeGreaterThan(0);
      // More than one KIND of scene — hiding it, the blind spot, the fight, the
      // choice between their game and their person.
      expect(Object.keys(fired).length, `only ever: ${Object.keys(fired).join(', ')}`)
        .toBeGreaterThan(1);
    }
  }, 180000);

  it('does not let the couple outrank the block', () => {
    // The correction has a ceiling: a showmance is a storyline, not the week.
    // The people who might go home are still the week.
    //
    // Pooled across three seeded seasons rather than pinned to one.
    //
    // A single seed was the first fix for this being the suite's most reliable
    // flake, and it traded one fragility for a quieter one: the margin is real
    // but narrow, so ANY change that shifts the random stream — a competition
    // that rolls a different number of times, say — re-rolls this assertion
    // from scratch and can land it on the wrong side while the property itself
    // is untouched. Measured across ten seeds the property holds on nine, and
    // the pooled means are not close (about 46 against 39). Pooling three
    // seasons keeps the dice pinned AND tests the claim actually being made,
    // which is about the edit in general and not about one week in one season.
    // Widened from three seasons to eight, for the reason the paragraph above
    // predicted: retuning the noise on four competitions shifted the random
    // stream, the three-season pool landed 46.1 against 47.0, and the property
    // itself had not moved at all. Three seasons is a small enough sample that
    // one season's worth of couple drama can invert it. Eight is not.
    //
    // Eight WAS not enough either, and widening again would have been the
    // wrong lesson. Measured per-season over sixteen seeds, six of them
    // invert — and every single inversion is a season that produced one to
    // four couple readings, where the couple "mean" is one person's week.
    // The property is not marginal: pooled over sixteen seasons it is 41.6
    // against 37.3 across 433 and 124 readings. The estimator was the
    // problem, so this pools sixteen and refuses to answer at all until the
    // couple sample is big enough to mean something.
    const beats = { nominee: [], couple: [] };
    for (const seed of SEASON_SEEDS) {
    house();
    withSeededRandom(seed, () => {
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 10) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const noms = new Set([...(ep.initialNominees || []), ...(ep.finalNominees || [])]);
      const counts = {};
      for (const act of ep.acts || []) {
        for (const b of act.socialBeats || []) {
          for (const n of new Set(b.players || [])) counts[n] = (counts[n] || 0) + 1;
        }
      }
      const inCouple = new Set((gs.showmances || [])
        .filter(sh => (sh.sparkEp || 0) <= ep.num && (!sh.breakupEp || sh.breakupEp >= ep.num))
        .flatMap(sh => sh.players || []));
      for (const name of ep.houseAtStart || []) {
        const c = counts[name] || 0;
        if (noms.has(name)) beats.nominee.push(c);
        // A SAFE couple. Somebody who is in a showmance and also Head of
        // Household carries the power role's weight with them, and counting
        // them here measures the power, not the couple — which is how this
        // assertion failed the first time it ran.
        else if (inCouple.has(name) && name !== ep.hoh && name !== ep.vetoWinner) {
          beats.couple.push(c);
        }
      }
    }
    });
    }
    // Sixteen seasons should produce plenty of both. If they did not, the
    // romance pipeline has stopped making couples and THAT is the failure —
    // silently skipping the assertion would hide it.
    expect(beats.nominee.length, 'no nominee readings across sixteen seasons')
      .toBeGreaterThan(200);
    expect(beats.couple.length, 'barely any couples formed across sixteen seasons')
      .toBeGreaterThan(60);
    expect(mean(beats.nominee),
      `a safe couple is out-screening the block (${mean(beats.nominee).toFixed(1)} vs ${mean(beats.couple).toFixed(1)} over ${beats.nominee.length}/${beats.couple.length} readings)`)
      .toBeGreaterThan(mean(beats.couple) * 1.04);
  }, 900000);
});
