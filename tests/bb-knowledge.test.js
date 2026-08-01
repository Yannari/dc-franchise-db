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
    house();
    let guard = 0, hops = 0;
    while (!houseIsAtFinale() && guard++ < 10) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const week = (gs.bb.weeks || [])[gs.bb.weeks.length - 1];
      hops += (week?.knowledgeEvents || []).length;
    }
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
    house();
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 8) {
      if (!simulateBBEpisode()) break;
    }
    const offenders = [];
    for (const fact of Object.values(gs.knowledge || {})) {
      if (fact.type !== 'vote') continue;
      for (const [knower, belief] of Object.entries(fact.beliefs || {})) {
        // The voter observed their own ballot. Anybody else holding an
        // 'observed' belief about it saw something they could not have seen.
        if (knower !== fact.subject && belief.sourceType === 'observed') {
          offenders.push(`${knower} claims to have watched ${fact.subject} vote`);
        }
      }
    }
    expect(offenders).toEqual([]);
  }, 120000);

  it('does not let any beat describe watching somebody vote', () => {
    house();
    const lines = [];
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 8) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      for (const act of ep.acts || []) {
        for (const beat of act.socialBeats || []) lines.push(String(beat.text || ''));
      }
    }
    expect(lines.length).toBeGreaterThan(50);
    // Voting happens alone. Any beat placing two people at it is describing a
    // different show.
    const witnessed = lines.filter(line =>
      /(same table|watched .{0,30} (vote|write)|saw .{0,30} (vote|write) .{0,20}name|next to .{0,20} as .{0,20} voted)/i.test(line));
    expect(witnessed, `beats describing a public vote: ${witnessed.join(' | ')}`).toEqual([]);
  }, 120000);
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
    house();
    const beats = { hoh: [], nominee: [], safe: [] };
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 8) {
      const ep = simulateBBEpisode();
      if (!ep) break;
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
    const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    const safe = mean(beats.safe);
    expect(safe, 'nobody safe was in anything').toBeGreaterThan(0);
    expect(mean(beats.hoh) / safe, 'the Head of Household is background').toBeGreaterThan(1.6);
    expect(mean(beats.nominee) / safe, 'the block is background').toBeGreaterThan(1.4);
    // And not so far that a safe houseguest disappears — they still live here.
    expect(safe).toBeGreaterThan(6);
  }, 150000);
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
    house();
    const beats = { nominee: [], couple: [] };
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
        else if (inCouple.has(name)) beats.couple.push(c);
      }
    }
    const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    if (beats.couple.length && beats.nominee.length) {
      expect(mean(beats.nominee), 'a safe couple is out-screening the block')
        .toBeGreaterThan(mean(beats.couple));
    }
  }, 150000);
});
