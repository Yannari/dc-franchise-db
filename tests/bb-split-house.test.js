// The Split House.
//
// BB24's shape: two Heads of Household are crowned in one competition over the
// whole house, they divide it between them by schoolyard pick, and the two
// halves then play complete, separate weeks — nominations, veto, campaign,
// vote — without seeing each other. One houseguest leaves from each side on
// the same night.
//
// The spec's requirement for this slice is not the ceremony, it is the
// ISOLATION: "must truly isolate knowledge stores and event pools". That is
// what most of this file tests, because it is the part that can silently fail.
// The engine gets no `isolate` flag; isolation falls out of running the week
// twice over two disjoint houses, so the way to prove it is to check that
// nobody from the other side ever appears in a side's week.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { BB_TWIST_CONTRACTS, resolveWeekTwistState } from '../js/bb/twist-contract.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Wayne', 'Priya'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'challenge-beast'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' }, extra);
  seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-split-house' }];
}

const play = (seed = 2026) => withSeededRandom(seed, () => simulateBBEpisode());
const sideActs = (ep, side) => (ep.acts || []).filter(a => a.side === side);

/** Every houseguest named anywhere inside an act. */
function namesIn(act) {
  const out = new Set();
  const eat = list => (list || []).forEach(n => n && out.add(n));
  eat(act.players); eat(act.nominees); eat(act.participants); eat(act.results?.map(r => r.name));
  if (act.winner) out.add(act.winner);
  if (act.hoh) out.add(act.hoh);
  for (const b of [...(act.socialBeats || []), ...(act.beats || []),
    ...(act.competition?.beats || [])]) eat(b?.players);
  return out;
}

describe('Split House', () => {
  beforeEach(() => house());

  it('is registered, and asks for two Heads of Household and a second cycle', () => {
    expect(BB_TWIST_CONTRACTS['bb-split-house']).toBeTruthy();
    const resolved = resolveWeekTwistState(['bb-split-house']);
    expect(resolved.rules.hohCount).toBe(2);
    expect(resolved.rules.secondCycle).toBe(true);
  });

  it('crowns two, and divides the whole house between them', () => {
    const ep = play();
    const split = ep.splitHouse;
    expect(split, 'the house never split').toBeTruthy();

    const [a, b] = split.hohs;
    const sideA = split.sides[a];
    const sideB = split.sides[b];
    expect(sideA).toContain(a);
    expect(sideB).toContain(b);
    // Disjoint, and between them the whole house.
    expect(sideA.filter(n => sideB.includes(n)), 'somebody was on both sides').toEqual([]);
    expect([...sideA, ...sideB].sort()).toEqual([...ep.houseAtStart].sort());
    // Both sides need an HOH, two nominees and somebody left to vote.
    expect(sideA.length).toBeGreaterThanOrEqual(4);
    expect(sideB.length).toBeGreaterThanOrEqual(4);
  });

  it('each side plays a complete week of its own', () => {
    const ep = play();
    const [a, b] = ep.splitHouse.hohs;
    for (const side of [a, b]) {
      const types = sideActs(ep, side).map(x => x.type);
      for (const needed of ['hoh', 'nominations', 'veto', 'veto-ceremony', 'eviction']) {
        expect(types, `${side}'s side never held a ${needed}`).toContain(needed);
      }
    }
  });

  it('ISOLATION: nobody from the other side appears in a side’s week', () => {
    // The heart of the slice. Every act belongs to one side, and every name
    // inside it — competitors, nominees, beat players, the people in a house
    // event — has to live on that side. A single crossing means the event pool
    // or a knowledge store reached through the wall.
    for (const seed of [2026, 77, 4242]) {
      house();
      const ep = play(seed);
      const [a, b] = ep.splitHouse.hohs;
      const sides = { [a]: new Set(ep.splitHouse.sides[a]), [b]: new Set(ep.splitHouse.sides[b]) };
      for (const side of [a, b]) {
        const theirs = sides[side];
        for (const act of sideActs(ep, side)) {
          const crossed = [...namesIn(act)].filter(n => !theirs.has(n));
          expect(crossed, `seed ${seed}: ${act.type} on ${side}'s side reached ${crossed.join(', ')}`)
            .toEqual([]);
        }
      }
    }
  });

  it('ISOLATION: the ballots never cross either', () => {
    const ep = play();
    const [a, b] = ep.splitHouse.hohs;
    const sides = { 1: new Set(ep.splitHouse.sides[a]), 2: new Set(ep.splitHouse.sides[b]) };
    for (const ballot of ep.votingLog || []) {
      const side = sides[ballot.segment];
      expect(side, `a ballot with no side: ${ballot.voter}`).toBeTruthy();
      expect(side.has(ballot.voter), `${ballot.voter} voted on the wrong side`).toBe(true);
      expect(side.has(ballot.voted), `${ballot.voter} voted for somebody behind the wall`).toBe(true);
    }
  });

  it('evicts one from each side, and the roster survives it', () => {
    const ep = play();
    const [a, b] = ep.splitHouse.hohs;
    const evictedA = ep.splitHouse.evicted[a];
    const evictedB = ep.splitHouse.evicted[b];
    expect(evictedA, 'no eviction on the first side').toBeTruthy();
    expect(evictedB, 'no eviction on the second side').toBeTruthy();
    expect(evictedA).not.toBe(evictedB);
    expect(ep.splitHouse.sides[a]).toContain(evictedA);
    expect(ep.splitHouse.sides[b]).toContain(evictedB);
    expect([ep.eliminated, ep.alsoEliminated].sort()).toEqual([evictedA, evictedB].sort());

    // The week engine closes by setting the roster to ITS house minus the
    // evictee. Run twice over halves, that left fourteen houseguests as six.
    expect(gs.activePlayers.length, 'the roster lost people nobody evicted')
      .toBe(NAMES.length - 2);
    for (const gone of [evictedA, evictedB]) {
      expect(gs.activePlayers, `${gone} was evicted and is still in the house`).not.toContain(gone);
    }
  });

  it('the schoolyard pick is a real choice, made by the two who won', () => {
    const ep = play();
    const { picks, hohs } = ep.splitHouse;
    expect(picks.length, 'nobody was picked').toBe(NAMES.length - 2);
    // They alternate, and only the two Heads of Household pick.
    for (const pick of picks) expect(hohs).toContain(pick.by);
    for (let i = 1; i < picks.length; i++) {
      expect(picks[i].by, 'the same person picked twice in a row').not.toBe(picks[i - 1].by);
    }
  });

  it('stands down when the house is too small to be halved', () => {
    house();
    gs.activePlayers = NAMES.slice(0, 9);
    gs.eliminated = NAMES.slice(9);
    const ep = play(31);
    expect(ep.splitHouse, 'split a house that could not be split').toBeFalsy();
    expect(ep.hoh, 'the week produced no HOH at all').toBeTruthy();
  });
});

// ── the week as it is watched and read ────────────────────────────────
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';

describe('Split House, on the surfaces', () => {
  beforeEach(() => house());

  it('gets a screen, and no half draws an empty competition board', () => {
    const ep = play();
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
    const screens = buildVPScreens(ep);
    const ids = screens.map(s => s.id);
    expect(ids, 'no split screen').toContain('bb-split');
    expect(new Set(ids).size, `duplicate screen ids: ${ids.join(', ')}`).toBe(ids.length);
    // Both Heads of Household were crowned before the split, so neither half
    // has a competition of its own to draw.
    expect(ids.filter(x => x.startsWith('bb-hoh')), 'a pre-crowned HOH drew a board').toEqual([]);
    const html = screens.find(s => s.id === 'bb-split').html;
    for (const name of ep.splitHouse.hohs) expect(html).toContain(name);
    // The second half reuses the second-cycle machinery, but a split is not a
    // double eviction and must not be announced as one.
    expect(ids, 'the split was announced as a double eviction').not.toContain('bb-double');
    expect(ids, 'the other side is never introduced').toContain('bb-otherside');
  });

  it('reaches both transcript writers, sides and all', () => {
    const ep = play();
    const [a, b] = ep.splitHouse.hohs;
    for (const [label, text] of [
      ['generateSummaryText', generateSummaryText(ep)],
      ['summariseWeek', summariseWeek({ ...ep, acts: ep.acts })],
    ]) {
      expect(text, `${label}: never says the house split`).toMatch(/SPLIT/i);
      for (const name of [a, b]) {
        expect(text, `${label}: ${name} missing`).toContain(name);
      }
      // Both evictions are in the written week, not just the first.
      expect(text, `${label}: the second eviction is missing`)
        .toContain(ep.splitHouse.evicted[b]);
    }
  });
});
