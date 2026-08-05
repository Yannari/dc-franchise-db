// A week that runs the engine twice is still one episode.
//
// Both of the two-cycle twists — the double eviction and the Split House —
// call simulateBBWeek a second time, and every one of these came from that:
//
//   1. gs.episode was bumped at BOTH exits, so the counter went 4 -> 6 and
//      every episode after a double was misnumbered for the rest of the season
//   2. the Split House crowned two Heads of Household over the whole house and
//      never drew a board, so the one night that turns on two people EARNING
//      two crowns showed neither of them winning anything
//   3. the schoolyard pick listed names with no reasoning, which is a list
//      rather than the most legible strategic moment in the format
//   4. the two evictees were labelled "Evictee Interview" and "Second Evictee",
//      which reads as one chair used twice — they leave from two houses that
//      never saw each other, on the same night
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn', 'Ennui', 'Sky'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
    'villain', 'loyal-soldier', 'floater'][i % 8],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists;
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.namedAlliances = []; gs.jury = [];
  gs.episode = 0;
}

afterAll(() => {
  seasonConfig.twistSchedule = [];
  seasonConfig.bbSafetyMode = 'off';
  delete seasonConfig.format;
});

/** Play `n` episodes and hand back the last one. */
function play(seed, twists, n = 1) {
  house(twists);
  return withSeededRandom(seed, () => {
    let ep = null;
    for (let i = 0; i < n; i++) ep = simulateBBEpisode();
    return ep;
  });
}

describe('one night, one episode number', () => {
  it('advances by one across a double eviction', () => {
    const ep = play(31, [{ id: 't1', episode: 2, type: 'bb-double-eviction' }], 2);
    expect(ep.alsoEliminated, 'the double did not run').toBeTruthy();
    expect(gs.episode, 'the counter jumped a number on a double eviction').toBe(2);
  });

  it('advances by one across a Split House', () => {
    const ep = play(7, [{ id: 't1', episode: 2, type: 'bb-split-house' }], 2);
    expect(ep.alsoEliminated, 'the split did not run').toBeTruthy();
    expect(gs.episode).toBe(2);
  });

  it('still advances normally on an ordinary week', () => {
    play(9, [], 3);
    expect(gs.episode).toBe(3);
  });
});

describe('the Split House shows its two crowns being won', () => {
  let ep = null;
  beforeEach(() => { ep = play(7, [{ id: 't1', episode: 1, type: 'bb-split-house' }]); });

  it('carries the crowning competition on the act so a board can draw it', () => {
    const act = (ep.acts || []).find(a => a.type === 'split-house');
    expect(act, 'no split-house act').toBeTruthy();
    expect(act.crowning, 'nothing crowned anybody').toBeTruthy();
    // Aliased for the generic competition board, which finds an act by type
    // and reads `.competition`.
    expect(act.competition, 'the board has nothing to draw').toBe(act.crowning);
    expect(act.hohs).toHaveLength(2);
  });

  it('registers a competition screen before the division', () => {
    const screens = buildVPScreens(ep) || [];
    const crown = screens.findIndex(s => s.label === 'Two Crowns');
    const split = screens.findIndex(s => s.label === 'The House Splits');
    expect(crown, 'the crowning was never drawn').toBeGreaterThan(-1);
    expect(split).toBeGreaterThan(-1);
    expect(crown, 'the house was divided before anybody saw it earned').toBeLessThan(split);
  });
});

describe('the schoolyard pick explains itself', () => {
  let ep = null;
  beforeEach(() => { ep = play(7, [{ id: 't1', episode: 1, type: 'bb-split-house' }]); });

  it('gives every pick a reason', () => {
    const act = (ep.acts || []).find(a => a.type === 'split-house');
    expect(act.picks.length).toBeGreaterThan(0);
    for (const pk of act.picks) {
      expect(typeof pk.why, `${pk.by} taking ${pk.picked} has no reason`).toBe('string');
      expect(pk.why.length).toBeGreaterThan(12);
    }
  });

  it('puts the reasoning in both transcripts', () => {
    const act = (ep.acts || []).find(a => a.type === 'split-house');
    const why = act.picks[0].why;
    // The in-app backlog is the one built from the EPISODE, which is where a
    // split-house act lives — neither half-week carries it, so summariseWeek's
    // own split branch never sees a real one.
    expect(generateBBSummaryText(ep)).toContain(why);
  });
});

describe('two evictees who never met', () => {
  it('names each interview by the side it came from', () => {
    const ep = play(7, [{ id: 't1', episode: 1, type: 'bb-split-house' }]);
    const screens = buildVPScreens(ep) || [];
    const labels = screens.map(s => s.label).filter(l => /Evictee/.test(l));
    expect(labels.length, 'the two evictees had no interviews').toBeGreaterThan(1);
    // "Evictee Interview" then "Second Evictee" reads as one chair used twice.
    expect(labels.some(l => /side$/.test(l)), `labels were: ${labels.join(' | ')}`).toBe(true);
    expect(labels).not.toContain('Second Evictee');
  });

  it('leaves a real double eviction reading first and second', () => {
    // There the second genuinely does follow the first, in the same house.
    const ep = play(31, [{ id: 't1', episode: 1, type: 'bb-double-eviction' }]);
    if (!ep.alsoEliminated) return;
    const labels = (buildVPScreens(ep) || []).map(s => s.label).filter(l => /Evictee/.test(l));
    expect(labels.every(l => !/side$/.test(l)), `labels were: ${labels.join(' | ')}`).toBe(true);
  });
});

describe('the night runs in the order it happened', () => {
  let ep = null;
  beforeEach(() => { ep = play(7, [{ id: 't1', episode: 1, type: 'bb-split-house' }]); });

  it('opens with ONE stretch of house life and the whole house in it', () => {
    const openers = (ep.acts || []).filter(a => a.type === 'house' && a.phase === 'pre-hoh');
    expect(openers, 'each side played its own opening stretch behind a wall that did not exist yet')
      .toHaveLength(1);
    // Played before anybody was divided, so it belongs to neither side.
    expect(openers[0].sharedOpener).toBe(true);
    expect(openers[0].segment).toBe(0);
  });

  it('puts that stretch before the crowning and the crowning before the wall', () => {
    const labels = (buildVPScreens(ep) || []).map(s2 => s2.label);
    const life = labels.indexOf('House Life');
    const crown = labels.indexOf('Two Crowns');
    const wall = labels.indexOf('The House Splits');
    expect(life).toBeGreaterThan(-1);
    expect(life, 'the house was crowned before it was ever seen together').toBeLessThan(crown);
    expect(crown, 'the wall went up before anybody saw the crowns won').toBeLessThan(wall);
  });

  it('gives each side exactly one stretch before its nomination ceremony', () => {
    // Two was the bug: the opening stretch ran per side AND the post-crowning
    // one did, so every ceremony arrived behind two House Life screens.
    for (const seg of [1, 2]) {
      const acts = (ep.acts || []).filter(a => (a.segment || 0) === seg);
      const noms = acts.findIndex(a => a.type === 'nominations');
      expect(noms, `side ${seg} never nominated`).toBeGreaterThan(-1);
      const before = acts.slice(0, noms).filter(a => a.type === 'house');
      expect(before.length, `side ${seg} had ${before.length} stretches before nominations`).toBe(1);
    }
  });
});
