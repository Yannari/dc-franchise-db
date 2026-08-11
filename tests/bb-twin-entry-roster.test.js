// The twin twist ends with both of them in the house. That is the win
// condition — survive N weeks without being caught — and the missions are
// bonus, not the goal.
//
// She got a player record, a stats record and a place on gs.activePlayers, and
// then the end-of-week roster write rebuilt the house from `house`, a snapshot
// taken before the week started, and deleted her. Every week after her arrival
// she was in the cast and not in the house: never in a competition field,
// never on a ballot, never a target, and a grey frame on the memory wall that
// made her look evicted.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { installTwinTwist, twinState } from '../js/bb/twin-twist.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';
import { readFileSync } from 'node:fs';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];

let twin = null;
let weeks = [];

beforeAll(() => {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f',
    sexuality: 'straight', archetype: ARCH[i] })),
    { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
    pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
  seasonConfig.twistSchedule = [];
  gs.bb = gs.bb || { weeks: [], stats: {} };
  withSeededRandom(7, () => {
    // Two weeks to survive, and a quota she is not required to hit — the point
    // is exactly that missions are not the win condition.
    installTwinTwist([...gs.activePlayers], { weeks: 2, quota: 0, rng: Math.random, pick: 'Scary' });
    for (let i = 0; i < 5; i++) simulateBBEpisode();
  });
  twin = twinState()?.other || null;
  weeks = gs.bb.weeks;
}, 900000);

const after = () => weeks.filter(w => w.num >= (twinState()?.enteredWeek || 99));

describe('both twins in the house means both twins in the house', () => {
  it('gets in at all', () => {
    expect(twin, 'the twist never resolved').toBeTruthy();
    expect(twinState().entered, 'she never entered').toBe(true);
  });

  it('stays on the roster after the week that let her in', () => {
    // The bug: checkTwinEntry pushed her on, and the eviction write took her
    // straight back off, every week, forever.
    expect(gs.activePlayers).toContain(twin);
    for (const w of after().slice(1)) {
      expect(w.houseAtStart, `week ${w.num} started without her`).toContain(twin);
    }
  });

  it('is not counted as evicted', () => {
    // What the grey frame on the memory wall was actually reading.
    expect(gs.eliminated || []).not.toContain(twin);
  });

  it('plays the week she walks into, not the one after', () => {
    const entry = after()[0];
    expect(entry, 'no entry week').toBeTruthy();
    expect(entry.houseAtStart).toContain(twin);
  });

  it('has presence: she votes, or is on the block, every week she is there', () => {
    for (const w of after()) {
      const onBlock = [...(w.initialNominees || []), ...(w.finalNominees || [])].includes(twin);
      const voted = (w.ballots || w.votingLog || []).some(b => b.voter === twin);
      // A nominee does not vote, so one or the other — but never neither,
      // which is what "0 presence" looked like.
      expect(onBlock || voted, `week ${w.num}: she neither voted nor stood`).toBe(true);
    }
  });

  it('keeps her own stat line rather than borrowing her twin\'s', () => {
    const her = (players || []).find(p => p.name === twin);
    const front = (players || []).find(p => p.name === twinState().front);
    expect(her, 'she has no cast entry').toBeTruthy();
    expect(her.stats).not.toEqual(front.stats);
  });

  it('has a competition record to accumulate into', () => {
    expect(gs.bb.stats[twin]).toBeTruthy();
  });
});

describe('a late arrival of any kind keeps its seat', () => {
  it('reads the roster difference rather than naming the mechanic', async () => {
    // Written generically on purpose: the twin is simply the one that got
    // caught, and a rival or a returnee added mid-week had the same hole.
    const src = (await import('node:fs')).readFileSync('js/bb/week.js', 'utf8');
    expect(src).toMatch(/const walkedIn = \(gs\.activePlayers \|\| \[\]\)\.filter\(name => !house\.includes\(name\)\)/);
    expect(src).not.toMatch(/gs\.activePlayers = house\.filter\(name => name !== evicted/);
  });
});


// ══════════════════════════════════════════════════════════════════════
// "One voted for another because one had a final two with the other person
// on the block that seemed stronger — but it's actually not, they're twins."
//
// Everything the entry set was about what the HOUSE felt. Nothing said what
// the two of them were to EACH OTHER: no bond, no alliance, no deal. So the
// strategy layer saw two people who had never met, and a promise made in a
// bedroom outranked being her sister — correctly, by every number it had.
// ══════════════════════════════════════════════════════════════════════
describe('the twins are bound to each other, not just to the house', () => {
  const pair = () => [twinState().front, twinState().other];

  it('ends up close, without anybody having to arrange it', () => {
    const [a, b] = pair();
    expect(getBond(a, b)).toBeGreaterThan(5);
  });

  it('is a real alliance, so the blocs and the board can see it', () => {
    const [a, b] = pair();
    const al = (gs.namedAlliances || []).find(x =>
      (x.members || []).includes(a) && (x.members || []).includes(b) && x.twins);
    expect(al, 'no alliance was created for the twins').toBeTruthy();
    // Alliances dissolve on low bonds and betrayals. Being her sister is not
    // a thing that decays.
    expect(al.permanence).toBe('permanent');
  });

  it('is a locked final two, which is the tier the vote logic weighs', () => {
    // The exact complaint: a final two with somebody else outranked the twin,
    // because the twin was not recorded at that tier — or at any tier.
    const [a, b] = pair();
    const deal = (gs.sideDeals || []).find(d =>
      (d.players || []).includes(a) && (d.players || []).includes(b)
      && (d.tier === 'final-two' || d.type === 'final-two'));
    expect(deal, 'the twins had no endgame deal at all').toBeTruthy();
    expect(deal.active).not.toBe(false);
    expect(deal.broken).toBeFalsy();
  });

  it('does not create a second one on a later week', () => {
    const [a, b] = pair();
    const all = (gs.namedAlliances || []).filter(x =>
      (x.members || []).includes(a) && (x.members || []).includes(b) && x.twins);
    expect(all).toHaveLength(1);
  });

  it('never had one of them write the other name down', () => {
    const [a, b] = pair();
    const crossed = gs.bb.weeks.flatMap(w => (w.ballots || w.votingLog || []))
      .filter(v => [a, b].includes(v.voter)
        && [a, b].includes(v.voted ?? v.evict)
        && v.voter !== (v.voted ?? v.evict));
    expect(crossed).toHaveLength(0);
  });
});

describe('a pre-game alliance reaches the game without being re-saved', () => {
  it('is applied before a week plays, not only when the form is touched', () => {
    // It was called from the Relationships form and nowhere else, so one made
    // before that hook existed sat in local storage forever, and the first
    // sign was somebody voting as though their own group did not exist.
    const src = readFileSync('js/run-ui.js', 'utf8');
    const fn = src.slice(src.indexOf('export function simulateNext()'),
      src.indexOf('export function simulateNext()') + 1400);
    expect(fn).toMatch(/window\.applyPreAlliances\?\.\(\)/);
  });
});
