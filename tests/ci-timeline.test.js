// The Season Timeline for the Circle (Plan 3b Task 2): what each ratings night
// is, drawn by where it sits in the season or booked by the author by slot.
import { describe, expect, it, afterEach } from 'vitest';
import { buildSchedule } from '../js/ci/schedule.js';
import { bookSeason, positionOf, NIGHT_DRAWS } from '../js/ci/timeline.js';
import { FORMATS } from '../js/ci/formats.js';
import { TWIST_CATALOG } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

const skeleton = () => buildSchedule({ total: 13, starters: 8, finalists: 5 });
const added = [];
afterEach(() => { for (const k of added.splice(0)) delete FORMATS[k]; });

describe('what each ratings night is', () => {
  it('gives every blocking night a registered format, the same way for the same seed', () => {
    const a = bookSeason(skeleton(), streamFor(4, 'timeline'), { total: 13, finalists: 5 });
    const b = bookSeason(skeleton(), streamFor(4, 'timeline'), { total: 13, finalists: 5 });
    const nights = a.filter(d => d.block);
    expect(nights.length).toBeGreaterThan(0);
    for (const d of nights) expect(Object.keys(FORMATS)).toContain(d.night.format);
    expect(a.map(d => d.night?.format)).toEqual(b.map(d => d.night?.format));
  });

  it('knows where a night sits: first, early, middle, late, last', () => {
    const nights = skeleton().filter(d => d.block);
    expect(positionOf(0, nights.length)).toBe('first');
    expect(positionOf(nights.length - 1, nights.length)).toBe('last');
    expect(new Set(nights.map((d, i) => positionOf(i, nights.length)))).toEqual(new Set(['first', 'early', 'middle', 'late', 'last']));
    for (const p of Object.keys(NIGHT_DRAWS)) expect(['first', 'early', 'middle', 'late', 'last']).toContain(p);
  });

  it('plays what the author booked, by slot', () => {
    const s = bookSeason(skeleton(), streamFor(1, 'timeline'), { total: 13, finalists: 5, bookings: { rating3: 'ci-sole-influencer' } });
    expect(s.find(d => d.slot === 'rating3').night).toMatchObject({ format: 'sole', booked: true });
  });

  it('falls back to standard when a booking cannot run, and records it', () => {
    FORMATS.never = { removes: 1, can: () => false, run: FORMATS.standard.run }; added.push('never');
    TWIST_CATALOG.push({ id: 'ci-test-never', format: 'the-circle', category: 'blocking', ciFormat: 'never', ciSlots: ['middle'] });
    try {
      const s = bookSeason(skeleton(), streamFor(1, 'timeline'), { total: 13, finalists: 5, bookings: { rating3: 'ci-test-never' } });
      expect(s.find(d => d.slot === 'rating3').night).toMatchObject({ format: 'standard', fellBack: 'never' });
    } finally { TWIST_CATALOG.splice(TWIST_CATALOG.findIndex(t => t.id === 'ci-test-never'), 1); }
  });

  it('a night that removes two gives a later blocking day back, so the finalists are exact', () => {
    FORMATS.twice = { removes: 2, can: () => true, run: FORMATS.standard.run }; added.push('twice');
    TWIST_CATALOG.push({ id: 'ci-test-twice', format: 'the-circle', category: 'blocking', ciFormat: 'twice', ciSlots: ['middle'] });
    try {
      const s = bookSeason(skeleton(), streamFor(1, 'timeline'), { total: 13, finalists: 5, bookings: { rating3: 'ci-test-twice' } });
      const removes = s.filter(d => d.block).reduce((n, d) => n + FORMATS[d.night.format].removes, 0);
      expect(removes).toBe(13 - 5);
    } finally { TWIST_CATALOG.splice(TWIST_CATALOG.findIndex(t => t.id === 'ci-test-twice'), 1); }
  });
});

describe('the catalog', () => {
  it('every Circle blocking entry names a registered format and real positions', () => {
    const mine = TWIST_CATALOG.filter(t => t.format === 'the-circle' && t.category === 'blocking');
    expect(mine.length).toBeGreaterThan(1);
    for (const t of mine) {
      expect(Object.keys(FORMATS), t.id).toContain(t.ciFormat);
      for (const p of t.ciSlots) expect(['first', 'early', 'middle', 'late', 'last'], t.id).toContain(p);
      expect(t.desc.length, t.id).toBeGreaterThan(200);
    }
  });
});

describe('a booked season plays', () => {
  it('a sole influencer blocks alone, and the season still ends with its finalists', () => {
    const cast = makePlayers(13, 5); setPlayers(cast);
    const names = cast.map(p => p.name);
    const { state, result } = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, 5), seed: 5,
      options: { bookings: { rating2: 'ci-sole-influencer' } } });
    const night = state.schedule.find(d => d.slot === 'rating2');
    // the night's ratings end its day; its blocking opens the next
    const block = state.scenes.find(s => s.kind === 'blocking' && s.day === night.day + 1);
    expect(block.data.by).toHaveLength(1);
    expect(block.data.format).toBe('sole');
    expect(result.placements).toHaveLength(5);
  });
});
