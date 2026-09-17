// ══════════════════════════════════════════════════════════════════════
// tests/dr-legacy.test.js — the power ledger and the legacy choice
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { powerMind, timesSpared, recordUse, initLedger } from '../js/dr/power.js';
import { holderMind, timesSaved } from '../js/dr/saves.js';
import { chooseElimination } from '../js/dr/legacy.js';
import { playDragSeason } from '../js/dr/season.js';
import { LEGACY_BEATS, legacyLine } from '../js/dr/data/legacy-beats.js';
import { sceneSections } from '../js/vp-dr/screens.js';

// A real All Stars season, for the scenes that only exist inside one.
function allStarsSeason(seed) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  const cast = Array.from({ length: 10 }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ['villain', 'hero', 'floater', 'wildcard'][i % 4], age: 25 + i,
    stats: Object.fromEntries(STATS.map((k, j) => [k, ((i + j * 3) % 10) + 1])),
  }));
  return playDragSeason({
    cast, seed, config: { drAllStars: true },
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: () => {},
  });
}

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const q = (name, archetype, over = {}) => ({
  name, archetype,
  stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), ...over },
});

describe('the power ledger', () => {
  it('counts who has been spared, whoever spared her', () => {
    const l = initLedger();
    recordUse(l, { ep: 2, holder: 'A', picks: [{ saved: 'B' }] });
    recordUse(l, { ep: 4, holder: 'C', picks: [{ saved: 'B' }] });
    expect(timesSpared(l, 'B')).toBe(2);
    expect(timesSpared(l, 'A')).toBe(0);
  });

  it('is the same ledger the save writes — one account, not two', () => {
    const l = initLedger();
    recordUse(l, { ep: 2, holder: 'A', picks: [{ saved: 'B' }] });
    expect(timesSaved(l, 'B')).toBe(timesSpared(l, 'B'));
  });
});

describe('powerMind', () => {
  it('is what holderMind was — the save keeps its name', () => {
    const p = q('A', 'villain', { strategic: 9, loyalty: 2 });
    expect(powerMind(p)).toEqual(holderMind(p));
  });

  it('never zeroes a pull: even a hero wants to win', () => {
    const m = powerMind(q('H', 'hero', { social: 9, loyalty: 9 }));
    expect(m.strategy).toBeGreaterThan(0);
    expect(m.strategy + m.merit + m.fair).toBeCloseTo(1, 6);
  });

  it('leans a villain toward strategy and a hero toward fair', () => {
    const v = powerMind(q('V', 'villain', { strategic: 8, loyalty: 3 }));
    const h = powerMind(q('H', 'hero', { strategic: 8, loyalty: 3 }));
    expect(v.strategy).toBeGreaterThan(h.strategy);
    expect(h.fair).toBeGreaterThan(v.fair);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The choice itself
// ══════════════════════════════════════════════════════════════════════
const seeded = (s) => { let x = s + 1; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; };

function setup(over = {}) {
  const players = {
    Villain: q('Villain', 'villain', { strategic: 9, loyalty: 2, boldness: 8 }),
    Hero: q('Hero', 'hero', { social: 9, loyalty: 9 }),
    Threat: q('Threat', 'challenge-beast', { physical: 9 }),
    Weak: q('Weak', 'floater'),
    Friend: q('Friend', 'social-butterfly'),
  };
  return {
    players, bond: () => 0, ledger: initLedger(), pleas: {}, rng: () => 0.5,
    state: {
      record: {
        Threat: ['WIN', 'WIN', 'HIGH'], Weak: ['LOW', 'BTM2', 'SAFE'], Friend: ['SAFE', 'SAFE', 'LOW'],
      },
      allStars: { pasts: { Threat: { rank: 2, of: 12, wins: 3, real: false } } },
    },
    ...over,
  };
}

describe('the legacy choice', () => {
  it('always names somebody from the bottom, never one of the two who sang', () => {
    const r = chooseElimination({
      ...setup(), winner: 'Villain', pool: ['Threat', 'Weak', 'Friend'],
      panelOrder: ['Friend', 'Weak', 'Threat'],
    });
    expect(['Threat', 'Weak', 'Friend']).toContain(r.target);
    expect(r.target).not.toBe('Villain');
    expect(typeof r.reason).toBe('string');
    expect(r.reason.length).toBeGreaterThan(0);
  });

  it('is deterministic for the same night', () => {
    const args = { ...setup(), winner: 'Villain', pool: ['Threat', 'Weak'], panelOrder: ['Threat', 'Weak'] };
    expect(chooseElimination(args)).toEqual(chooseElimination(args));
  });

  it('sends the threat home more often for a villain than for a hero', () => {
    const count = (who) => {
      let n = 0;
      for (let s = 0; s < 60; s++) {
        const r = chooseElimination({
          ...setup(), winner: who, pool: ['Threat', 'Weak'],
          panelOrder: ['Threat', 'Weak'], rng: seeded(s),
        });
        if (r.target === 'Threat') n++;
      }
      return n;
    };
    expect(count('Villain')).toBeGreaterThan(count('Hero'));
  });

  it('takes the queen the panel ranked last more often for a hero', () => {
    let panelLast = 0;
    for (let s = 0; s < 60; s++) {
      const r = chooseElimination({
        ...setup(), winner: 'Hero', pool: ['Threat', 'Weak'],
        panelOrder: ['Threat', 'Weak'], rng: seeded(s + 7),
      });
      if (r.target === 'Weak') panelLast++;
    }
    expect(panelLast).toBeGreaterThan(30);
  });

  it('remembers who sent her home last time they were in a room together', () => {
    const run = (l) => {
      let n = 0;
      for (let s = 0; s < 60; s++) {
        const r = chooseElimination({
          ...setup(), ledger: l, winner: 'Villain', pool: ['Weak', 'Friend'],
          panelOrder: ['Friend', 'Weak'], rng: seeded(s + 3),
        });
        if (r.target === 'Weak') n++;
      }
      return n;
    };
    const withGrudge = initLedger();
    withGrudge.grudges.push({ by: 'Weak', against: 'Villain' });
    expect(run(withGrudge)).toBeGreaterThan(run(initLedger()));
  });

  it('spares a queen who worked her in Untucked', () => {
    const args = {
      ...setup(), winner: 'Villain', pool: ['Weak', 'Friend'], panelOrder: ['Friend', 'Weak'],
    };
    const noPlea = chooseElimination(args).target;
    const pleaded = chooseElimination({ ...args, pleas: { Villain: { [noPlea]: 6 } } }).target;
    expect(pleaded).not.toBe(noPlea);
  });
});

// ══════════════════════════════════════════════════════════════════════
// The ceremony
// ══════════════════════════════════════════════════════════════════════
describe('the ceremony', () => {
  it('has a line for every reason the decision can return', () => {
    for (const why of ['threat', 'panel', 'grudge']) {
      expect(LEGACY_BEATS.deliberate[why]?.length).toBeGreaterThan(0);
    }
    expect(LEGACY_BEATS.lastWords.length).toBeGreaterThan(0);
  });

  it('fills the names in', () => {
    const line = legacyLine(LEGACY_BEATS.reveal, { h: 'Ripper', x: 'Brightly' }, () => 0);
    expect(line).toContain('Brightly');
    expect(line).not.toContain('{');
  });

  it('files its scenes in their own section, after their marker', () => {
    const res = allStarsSeason(404);
    const row = res.rows.filter(r => r.dr && !r.dr.finale)
      .find(r => (r.dr.scenes || []).some(s => s.kind === 'legacy:reveal'));
    expect(row).toBeTruthy();
    const list = row.dr.scenes;
    const iMarker = list.findIndex(s => s.step === 'legacy-choice');
    const iReveal = list.findIndex(s => s.kind === 'legacy:reveal');
    expect(iMarker).toBeGreaterThanOrEqual(0);
    expect(iReveal).toBeGreaterThan(iMarker);
    // `sceneSections` takes the ROW and returns a Map of section id -> scenes.
    const sections = sceneSections(row);
    const own = sections.get('dr-legacy') || [];
    expect(own.some(x => x.kind === 'legacy:reveal')).toBe(true);
    // The whole ceremony lands there, not just the marker.
    expect(own.length).toBeGreaterThan(3);
    // And nothing from the ceremony leaked into the song's section.
    const song = sections.get('dr-lipsync') || [];
    expect(song.some(x => String(x.kind || '').startsWith('legacy:'))).toBe(false);
  });

  it('gives the queen who never performed her own goodbye', () => {
    const res = allStarsSeason(77);
    const rows = res.rows.filter(r => r.dr?.lipsync?.legacy && r.dr.lipsync.eliminated);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      const words = (r.dr.scenes || []).filter(s => s.kind === 'legacy:last-words');
      expect(words).toHaveLength(1);
      expect(words[0].data.players).toContain(r.dr.lipsync.eliminated);
      expect(words[0].text.length).toBeGreaterThan(10);
    }
  });
});
