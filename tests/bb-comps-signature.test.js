// The six signature Big Brother competitions.
//
// The generic library is already covered by competition-big-brother-library.js;
// this file covers the thing that makes these six different, which is that they
// have STRUCTURE. A competition that scores once and sorts can only ever crown
// the best player on paper. Rounds that score independently, strikes, hazard
// waves and asymmetric offers produce winners a sort never would — and if that
// stops being true, these are just stat mixes with better names.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition, validateBBCompetitionLibrary } from '../js/bb/comps.js';
import { BB_COMPETITIONS, SIGNATURE_COMPS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

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

const primaryType = comp => (comp.types.includes('hoh') ? 'hoh' : comp.types[0]);

const run = (comp, { seed = 5, size = 8, type } = {}) => runBBCompetition({
  type: type || primaryType(comp),
  participants: HOUSE.slice(0, size), house: HOUSE, library: BB_COMPETITIONS,
  forcedId: comp.id, rng: seededRng(seed), week: { num: 4, houseAtStart: HOUSE },
});

describe('signature Big Brother competitions', () => {
  beforeEach(reset);

  it('registers all six and satisfies the dispatcher contract', () => {
    expect(SIGNATURE_COMPS).toHaveLength(6);
    expect(() => validateBBCompetitionLibrary(BB_COMPETITIONS)).not.toThrow();
    const ids = SIGNATURE_COMPS.map(c => c.id);
    expect(ids).toEqual([
      'bb-sig-otev', 'bb-sig-the-wall', 'bb-sig-pressure-cooker',
      'bb-sig-hide-and-go-veto', 'bb-sig-bb-comics', 'bb-sig-before-or-after',
    ]);
    // Registered, not merely written — the bug class this project keeps hitting.
    for (const id of ids) expect(BB_COMPETITIONS.some(c => c.id === id), `${id} unregistered`).toBe(true);
    for (const comp of SIGNATURE_COMPS) {
      expect(comp.desc.length).toBeGreaterThan(80);
      // A competition that serves one slot says what it is played for. One that
      // serves both must NOT — the desc is static and gets drawn on the screen,
      // so a hardcoded prize told an HOH night it was playing for the veto.
      const slots = comp.types.filter(t => t === 'hoh' || t === 'veto');
      if (slots.length === 1) {
        expect(comp.desc, `${comp.id} desc must name its prize`)
          .toMatch(/wins (the Power of Veto|Head of Household)\.$/);
      } else {
        expect(comp.desc, `${comp.id} serves both slots and must not name a prize`)
          .not.toMatch(/the Power of Veto|Head of Household/);
      }
      expect(typeof comp.simulate).toBe('function');
    }
  });

  it('returns a valid, renderable result for every signature competition', () => {
    for (const comp of SIGNATURE_COMPS) {
      for (const size of [6, 8, 12]) {
        const result = run(comp, { size });
        expect(result.winner, comp.id).toBe(result.placements[0]);
        expect(result.placements, comp.id).toHaveLength(size);
        expect(new Set(result.placements).size, `${comp.id} duplicated a placement`).toBe(size);
        for (const name of result.placements) {
          expect(Number.isFinite(result.scores[name]), `${comp.id} scored ${name} badly`).toBe(true);
        }
        expect(result.debug.source).toBe('custom');
        expect(result.text).toBeTruthy();
      }
    }
  });

  // The have-not contract: slop costs you in EVERY competition, structured or
  // not. scoreField enforces it for the generic library; each signature comp
  // applies its own drag and must record it on the breakdown row, because
  // that row is what the Have-Nots twist (and its test) reads.
  it('makes have-nots compete at a recorded deficit', () => {
    for (const comp of SIGNATURE_COMPS) {
      reset();
      const haveNots = [HOUSE[0], HOUSE[2]];
      const result = runBBCompetition({
        type: primaryType(comp), participants: HOUSE.slice(0, 8), house: HOUSE,
        library: BB_COMPETITIONS, forcedId: comp.id, rng: seededRng(9),
        week: { num: 4, houseAtStart: HOUSE }, haveNots,
      });
      const breakdown = result.debug.scoreBreakdown;
      expect(Object.keys(breakdown).length, comp.id).toBeGreaterThan(0);
      for (const [name, row] of Object.entries(breakdown)) {
        if (haveNots.includes(name)) {
          expect(row.haveNotPenalty, `${comp.id} did not penalise have-not ${name}`).toBeGreaterThan(0);
        } else {
          expect(row.haveNotPenalty || 0, `${comp.id} penalised non-have-not ${name}`).toBe(0);
        }
      }
    }
  });

  it('replays identically for the same seed', () => {
    for (const comp of SIGNATURE_COMPS) {
      const once = run(comp, { seed: 21 });
      reset();
      const twice = run(comp, { seed: 21 });
      expect(twice.placements, `${comp.id} is not deterministic`).toEqual(once.placements);
      expect(twice.beats.map(b => b.text)).toEqual(once.beats.map(b => b.text));
      expect(twice.scores).toEqual(once.scores);
    }
  });

  // The whole reason these exist. A single sort over a spread cast crowns the
  // same one or two houseguests every time; rounds, strikes and waves do not.
  it('produces winners a single sort never would', () => {
    const structural = ['bb-sig-otev', 'bb-sig-the-wall', 'bb-sig-before-or-after']
      .map(id => SIGNATURE_COMPS.find(c => c.id === id));
    for (const comp of structural) {
      const winners = new Set();
      for (let seed = 1; seed <= 40; seed++) {
        reset();
        winners.add(run(comp, { seed }).winner);
      }
      expect(winners.size, `${comp.id} crowned only ${[...winners].join(', ')}`).toBeGreaterThanOrEqual(5);
    }
  });

  // The same property, held loosely across the other three, so a later tuning
  // pass cannot quietly collapse one back into a sort. BB Comics is a timed
  // run and the most sort-like of the six; it sat at four distinct winners
  // until the per-cover bar was raised, which is what this guards.
  it('keeps every signature competition off a single dominant winner', () => {
    for (const comp of SIGNATURE_COMPS) {
      const counts = new Map();
      for (let seed = 1; seed <= 40; seed++) {
        reset();
        const w = run(comp, { seed }).winner;
        counts.set(w, (counts.get(w) || 0) + 1);
      }
      expect(counts.size, `${comp.id} crowned too few`).toBeGreaterThanOrEqual(4);
      const top = Math.max(...counts.values());
      expect(top / 40, `${comp.id} is one player's competition`).toBeLessThan(0.7);
    }
  });

  it('narrates the structure rather than the result', () => {
    for (const comp of SIGNATURE_COMPS) {
      for (const seed of [3, 9, 17]) {
        reset();
        const result = run(comp, { seed, size: 10 });
        expect(result.beats.length, `${comp.id} narrated too little`).toBeGreaterThanOrEqual(5);
        for (const b of result.beats) {
          expect(b.text, `${comp.id} empty beat`).toBeTruthy();
          expect(b.text).not.toMatch(/undefined|NaN|\[object/);
          expect(Array.isArray(b.players)).toBe(true);
          expect(b.badgeText).toBeTruthy();
          expect(b.badgeClass).toBeTruthy();
        }
        expect(result.text).not.toMatch(/undefined|NaN/);
        // A full comp should never print the same sentence twice.
        const texts = result.beats.map(b => b.text);
        expect(new Set(texts).size, `${comp.id} repeated a line`).toBe(texts.length);
      }
    }
  });

  it('lets the HOH signatures be thrown and never the vetoes', () => {
    const anyThrew = res => Object.values(res.debug.scoreBreakdown || {}).some(b => b.threw);
    const hohComps = SIGNATURE_COMPS.filter(c => c.types.includes('hoh'));
    for (const comp of hohComps) {
      const runs = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19].map(seed => {
        reset();
        return run(comp, { seed, type: 'hoh' });
      });
      expect(runs.some(anyThrew), `${comp.id} can never be thrown`).toBe(true);
    }
    for (const comp of SIGNATURE_COMPS.filter(c => c.types.includes('veto'))) {
      reset();
      expect(anyThrew(run(comp, { type: 'veto' })), `${comp.id} threw a veto`).toBe(false);
    }
  });

  // The season-flavoured questions read gs.bb.weeks, which may be empty, half
  // built, or full of objects rather than names.
  it('asks season questions without a season, and with a malformed one', () => {
    const quiz = SIGNATURE_COMPS.filter(c => ['bb-sig-otev', 'bb-sig-before-or-after'].includes(c.id));
    const shapes = [
      [],
      [{ num: 1 }, { num: 2, evicted: null }],
      [{ num: 1, evicted: 'C', hoh: 'A' }, { num: 2, hoh: { name: 'B' }, vetoWinner: 'D', evicted: 'E' }],
      [{ evicted: 'F' }],
    ];
    for (const comp of quiz) {
      for (const weeks of shapes) {
        reset();
        gs.bb.weeks = weeks;
        const result = run(comp, { seed: 12 });
        for (const b of result.beats) expect(b.text, comp.id).not.toMatch(/undefined|NaN|\[object/);
      }
    }
  });

  it('gives each signature competition real consequences', () => {
    for (const comp of SIGNATURE_COMPS) {
      reset();
      const result = run(comp, { seed: 8 });
      expect(gs.popularity[result.winner], `${comp.id} gave the winner nothing`).toBeGreaterThan(0);
      const memories = gs.bb.competitionMemories?.[result.winner] || [];
      expect(memories.some(m => m.competitionId === comp.id), `${comp.id} recorded no memory`).toBe(true);
    }
  });
});
