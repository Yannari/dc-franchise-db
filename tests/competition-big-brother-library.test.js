// The Big Brother competition library.
//
// Codex owns the dispatcher, the generic fallbacks and validation in
// js/bb/comps.js; this covers the production library in js/bb-comps/ and the
// things only a played season reveals — whether every competition is reachable,
// and whether the fallback is still narrating weeks it should not be.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition, validateBBCompetitionLibrary } from '../js/bb/comps.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { BB_COMPETITIONS, competitionsFor } from '../js/bb-comps/index.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';

// Stats are spread deliberately. With a flat cast every competition becomes
// pure noise, and a test comparing a puzzle to a crapshoot would compare two
// identical coin flips — which is exactly how this file first passed nothing.
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = (seed) => Object.fromEntries(
  STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender], i) =>
  ({ name, archetype, gender, sexuality: 'straight', stats: spread(i + 1) }));
const HOUSE = CAST.map(p => p.name);

const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
}

const run = (comp, type = 'hoh', extra = {}) => runBBCompetition({
  type, participants: HOUSE.slice(0, 8), house: HOUSE, library: BB_COMPETITIONS,
  forcedId: comp.id, rng: seededRng(), week: { num: 2, houseAtStart: HOUSE }, ...extra,
});

describe('Big Brother competition library', () => {
  beforeEach(reset);

  it('satisfies the dispatcher contract', () => {
    expect(() => validateBBCompetitionLibrary(BB_COMPETITIONS)).not.toThrow();
    expect(BB_COMPETITIONS.length).toBeGreaterThanOrEqual(8);
    // Every slot the week can ask for must have something written for it.
    for (const type of ['hoh', 'veto']) {
      expect(competitionsFor(type).length, `nothing written for ${type}`).toBeGreaterThan(2);
    }
  });

  it('returns a valid, renderable result for every competition', () => {
    for (const comp of BB_COMPETITIONS) {
      const type = comp.types.includes('hoh') ? 'hoh' : comp.types[0];
      const result = run(comp, type);
      expect(result.winner).toBe(result.placements[0]);
      expect(new Set(result.placements).size).toBe(result.placements.length);
      expect(result.placements).toHaveLength(8);
      for (const name of result.placements) expect(Number.isFinite(result.scores[name])).toBe(true);
      expect(result.beats.length, `${comp.id} narrated nothing`).toBeGreaterThan(1);
      for (const b of result.beats) {
        expect(b.text).toBeTruthy();
        expect(Array.isArray(b.players)).toBe(true);
        expect(b.badgeText).toBeTruthy();
        expect(b.badgeClass).toBeTruthy();
      }
      expect(result.debug.source).toBe('custom');
    }
  });

  it('narrates more than a single line, which is the point of the library', () => {
    const perComp = BB_COMPETITIONS.map(c => run(c, c.types.includes('hoh') ? 'hoh' : c.types[0]).beats.length);
    const average = perComp.reduce((a, b) => a + b, 0) / perComp.length;
    expect(average).toBeGreaterThan(3);
  });

  // Caught only by reading a played week: a big house makes a competition
  // narrate the same category of thing many times over, and a plain random pick
  // printed one line five times in a row.
  it('does not repeat the same sentence inside one competition', () => {
    for (const comp of BB_COMPETITIONS) {
      for (const seed of [2, 6, 14]) {
        const result = runBBCompetition({
          type: comp.types.includes('hoh') ? 'hoh' : comp.types[0],
          participants: HOUSE, house: HOUSE, library: BB_COMPETITIONS,
          forcedId: comp.id, rng: seededRng(seed), week: { num: 4, houseAtStart: HOUSE },
        });
        const texts = result.beats.map(b => b.text);
        expect(new Set(texts).size, `${comp.id} repeated a line`).toBe(texts.length);
      }
    }
  });

  it('replays identically for the same seed', () => {
    const once = run(BB_COMPETITIONS[0]);
    reset();
    const twice = run(BB_COMPETITIONS[0]);
    expect(twice.placements).toEqual(once.placements);
    expect(twice.beats.map(b => b.text)).toEqual(once.beats.map(b => b.text));
  });

  // A crapshoot has to actually be a crapshoot, or the house can plan around it.
  it('keeps the luck competition close to unplannable', () => {
    const luck = BB_COMPETITIONS.find(c => c.category === 'luck');
    const skill = BB_COMPETITIONS.find(c => c.category === 'puzzle');
    const winnersOver = (comp, seeds) => new Set(seeds.map(s => runBBCompetition({
      type: 'hoh', participants: HOUSE.slice(0, 8), house: HOUSE, library: BB_COMPETITIONS,
      forcedId: comp.id, rng: seededRng(s), week: { num: 2 },
    }).winner)).size;
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    // Across the same seeds, chance should crown a wider field than a puzzle.
    expect(winnersOver(luck, seeds)).toBeGreaterThan(winnersOver(skill, seeds));
  });

  it('lets houseguests throw the Head of Household, but not the veto', () => {
    // Throwing an HOH is signature Big Brother; throwing a veto you are playing
    // to save yourself is not a thing the engine should invent.
    const anyThrew = res => Object.values(res.debug.scoreBreakdown || {}).some(b => b.threw);
    const hohSeeds = [1, 3, 5, 7, 9, 11, 13, 15].map(s => runBBCompetition({
      type: 'hoh', participants: HOUSE.slice(0, 8), house: HOUSE, library: BB_COMPETITIONS,
      forcedId: 'bb-endurance-wall', rng: seededRng(s), week: { num: 3 },
    }));
    expect(hohSeeds.some(anyThrew)).toBe(true);
    const veto = run(BB_COMPETITIONS.find(c => c.types.includes('veto')), 'veto');
    expect(anyThrew(veto)).toBe(false);
  });

  // The bug class that has bitten this project repeatedly: written, wired,
  // and still never actually reached.
  it('uses every competition across real seasons, and rarely falls back', () => {
    const used = new Set();
    let custom = 0, generic = 0;
    for (const seed of [11, 23, 37, 44, 58, 63, 71, 88]) {
      reset();
      // Two of the eight seasons run the Block Buster, because the arena has
      // games of its own now and a sweep that never opens the arena reports
      // seven live competitions as dead code. The HEADLESS engine takes the
      // mode as an option — seasonConfig is the played path's knob.
      const arenaSeason = seed === 44 || seed === 88;
      const { weeks } = simulateBBSeason({
        rng: seededRng(seed), finaleSize: 3,
        houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS,
        ...(arenaSeason ? { safetyMode: 'triple', safetyStopsAt: 5 } : {}),
      });
      for (const act of weeks.flatMap(w => w.acts || [])) {
        const comp = act.competition;
        if (!comp) continue;
        used.add(comp.id);
        if (comp.debug?.source === 'custom') custom++; else generic++;
      }
    }
    const never = BB_COMPETITIONS.map(c => c.id).filter(id => !used.has(id));
    expect(never, `never picked in a real season: ${never.join(', ')}`).toEqual([]);
    // The written library should carry the season; the fallback is a safety net.
    expect(custom / (custom + generic)).toBeGreaterThan(0.8);
  }, 240000);

  it('varies what kind of competition the house plays week to week', () => {
    reset();
    const { weeks } = simulateBBSeason({
      rng: seededRng(19), finaleSize: 3,
      houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS,
    });
    const cats = weeks.flatMap(w => (w.acts || []).map(a => a.competition?.category).filter(Boolean));
    const repeats = cats.filter((c, i) => i > 0 && c === cats[i - 1]).length;
    expect(new Set(cats).size).toBeGreaterThan(3);
    expect(repeats / cats.length).toBeLessThan(0.2);
  });
});
