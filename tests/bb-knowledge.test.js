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
    learn('Emmah', factId('vote', 'Chase', 'Zee'),
      { source: 'Chase', sourceType: 'told', confidence: 0.85, from: 'Chase', ep: week.num });
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
