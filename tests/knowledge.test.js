// Tests for the personal knowledge & information-flow core (js/knowledge.js).
import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs } from '../js/core.js';
import * as K from '../js/knowledge.js';

// rng that always returns a tiny value → forces acceptance branches
const LOW = () => 0.01;

function seed(players, extra = {}) {
  return seedGame(players, { episode: 1, knowledge: {}, playerStates: {}, ...extra });
}

const SHARP = { stats: { mental: 10, intuition: 10 } };
const DULL = { stats: { mental: 1, intuition: 1 } };

beforeEach(() => { seed([{ name: 'A', ...SHARP }, { name: 'B' }, { name: 'C' }]); });

describe('knowledge: record + learn + query', () => {
  it('records a ground-truth fact and forms a belief', () => {
    const f = K.recordFact({ type: 'target', subject: 'C', truth: true, ep: 1 });
    expect(f.id).toBe('target:C');
    const b = K.learn('A', 'target:C', { sourceType: 'observed', ep: 1, rng: LOW });
    expect(b).toBeTruthy();
    const belief = K.believes('A', 'target:C', 1);
    expect(belief.valence).toBe('accurate');
    expect(belief.effectiveConfidence).toBeGreaterThan(0.7);
    expect(K.knowsAbout('A', 'target', 'C', 1)).toBeTruthy();
    expect(K.whoKnows('target:C', 1).map(x => x.knower)).toEqual(['A']);
    // someone with no belief knows nothing
    expect(K.believes('B', 'target:C', 1)).toBeNull();
  });

  it('keeps the strongest evidence when learning twice', () => {
    K.recordFact({ type: 'idol', subject: 'B', truth: true, ep: 1 });
    K.learn('A', 'idol:B', { sourceType: 'rumor', confidence: 0.4, ep: 1, rng: LOW });
    K.learn('A', 'idol:B', { sourceType: 'observed', confidence: 0.95, ep: 1, rng: LOW });
    expect(K.believes('A', 'idol:B', 1).effectiveConfidence).toBeGreaterThan(0.8);
  });
});

describe('knowledge: confidence decays and facts go stale', () => {
  it('effective confidence drops with age', () => {
    K.recordFact({ type: 'alliance', subject: 'al1', payload: ['A', 'B'], truth: true, ep: 1 });
    K.learn('A', 'alliance:al1', { sourceType: 'observed', ep: 1, rng: LOW });
    const fresh = K.believes('A', 'alliance:al1', 1).effectiveConfidence;
    const aged = K.believes('A', 'alliance:al1', 5).effectiveConfidence;
    expect(aged).toBeLessThan(fresh);
  });

  it('a per-episode fact (target) reads as stale once its window passes', () => {
    K.recordFact({ type: 'target', subject: 'C', truth: true, ep: 1 });
    K.learn('A', 'target:C', { sourceType: 'observed', ep: 1, rng: LOW });
    expect(K.believes('A', 'target:C', 1).valence).toBe('accurate');
    const later = K.believes('A', 'target:C', 4);
    expect(later.valence).toBe('stale');
    expect(later.effectiveConfidence).toBeLessThan(0.3);
  });
});

describe('knowledge: belief accuracy — lies fool the gullible, not the sharp', () => {
  it('sharp readers detect a planted lie far more often than dull ones', () => {
    let sharpDetect = 0, sharpBelieve = 0, dullDetect = 0, dullBelieve = 0;
    for (let i = 0; i < 400; i++) {
      seed([{ name: 'Sharp', ...SHARP }, { name: 'Dull', ...DULL }]);
      K.recordFact({ type: 'target', subject: 'X', truth: false, ep: 1 }); // planted misdirection
      const bs = K.learn('Sharp', 'target:X', { sourceType: 'told', confidence: 0.7, ep: 1 });
      const bd = K.learn('Dull', 'target:X', { sourceType: 'told', confidence: 0.7, ep: 1 });
      if (bs) (bs.valence === 'false' ? sharpDetect++ : sharpBelieve++);
      if (bd) (bd.valence === 'false' ? dullDetect++ : dullBelieve++);
    }
    // sharp: mostly see through it; dull: mostly swallow it
    expect(sharpDetect / (sharpDetect + sharpBelieve)).toBeGreaterThan(0.5);
    expect(dullBelieve / (dullDetect + dullBelieve)).toBeGreaterThan(0.7);
    expect(sharpDetect / (sharpDetect + sharpBelieve))
      .toBeGreaterThan(dullDetect / (dullDetect + dullBelieve));
  });

  it('sharp readers reject low-credibility rumors more than dull ones', () => {
    let sharpAccept = 0, dullAccept = 0, n = 500;
    for (let i = 0; i < n; i++) {
      seed([{ name: 'Sharp', ...SHARP }, { name: 'Dull', ...DULL }]);
      K.recordFact({ type: 'idol', subject: 'Z', truth: true, ep: 1 });
      if (K.learn('Sharp', 'idol:Z', { sourceType: 'rumor', confidence: 0.3, ep: 1 })) sharpAccept++;
      if (K.learn('Dull', 'idol:Z', { sourceType: 'rumor', confidence: 0.3, ep: 1 })) dullAccept++;
    }
    expect(dullAccept).toBeGreaterThan(sharpAccept);
  });
});

describe('knowledge: propagation (rumors, leaks, second-order)', () => {
  function seedNetwork() {
    const roster = ['A', 'B', 'C', 'D', 'E', 'F'].map(name => ({ name, stats: { social: 8, boldness: 7, mental: 5, intuition: 5 } }));
    seed(roster, { namedAlliances: [{ id: 'al', members: ['A', 'B', 'C', 'D', 'E', 'F'] }] });
  }

  it('a fact spreads from one knower to several over a few episodes', () => {
    seedNetwork();
    K.recordFact({ type: 'betrayal', subject: 'B', object: 'C', truth: true, ep: 1 });
    K.learn('A', 'betrayal:B:C', { sourceType: 'observed', ep: 1, rng: LOW });
    for (let ep = 1; ep <= 4; ep++) K.tick(ep, { maxPerFact: 6 });
    const knowers = K.whoKnows('betrayal:B:C').map(x => x.knower);
    expect(knowers.length).toBeGreaterThan(1);
    expect(knowers).toContain('A');
  });

  it('records second-order knowledge when a fact is passed along', () => {
    seedNetwork();
    K.recordFact({ type: 'throw', subject: 'E', object: '2', truth: true, ep: 1 });
    K.learn('A', 'throw:E:2', { sourceType: 'observed', ep: 1, rng: LOW });
    let found = false;
    for (let ep = 1; ep <= 6 && !found; ep++) {
      K.tick(ep, { maxPerFact: 6 });
      const others = K.whoKnows('throw:E:2').filter(x => x.knower !== 'A');
      if (others.some(o => o.knowsOthersKnow.length > 0)) found = true;
    }
    expect(found).toBe(true);
  });

  it('propagated beliefs arrive as told/rumor, not observed', () => {
    seedNetwork();
    K.recordFact({ type: 'idol', subject: 'F', truth: true, ep: 1 });
    K.learn('A', 'idol:F', { sourceType: 'observed', ep: 1, rng: LOW });
    for (let ep = 1; ep <= 5; ep++) K.tick(ep, { maxPerFact: 6 });
    const secondhand = K.whoKnows('idol:F').filter(x => x.knower !== 'A');
    expect(secondhand.length).toBeGreaterThan(0);
    secondhand.forEach(x => expect(['told', 'rumor']).toContain(x.sourceType));
  });
});

describe('knowledge: accuracy metric over a full run', () => {
  it('a high mental+intuition cohort ends more accurate about a planted lie than a dull cohort', () => {
    let sharpAcc = 0, sharpN = 0, dullAcc = 0, dullN = 0;
    for (let run = 0; run < 60; run++) {
      const sharp = ['S1', 'S2', 'S3'].map(name => ({ name, stats: { mental: 10, intuition: 9, social: 6, boldness: 6 } }));
      const dull = ['D1', 'D2', 'D3'].map(name => ({ name, stats: { mental: 2, intuition: 2, social: 6, boldness: 6 } }));
      const liar = { name: 'L', stats: { social: 9, boldness: 8, mental: 6, intuition: 6 } };
      seed([...sharp, ...dull, liar], { namedAlliances: [{ id: 'al', members: ['S1', 'S2', 'S3', 'D1', 'D2', 'D3', 'L'] }] });
      // liar plants a false target and pushes it out
      K.recordFact({ type: 'target', subject: 'S1', truth: false, ep: 1 });
      K.learn('L', 'target:S1', { sourceType: 'observed', ep: 1, rng: LOW });
      for (let ep = 1; ep <= 3; ep++) K.tick(ep, { maxPerFact: 8 });
      for (const p of sharp) { const a = K.isAccurate(p.name, 'target:S1', 3); if (a !== null) { sharpN++; if (a) sharpAcc++; } }
      for (const p of dull) { const a = K.isAccurate(p.name, 'target:S1', 3); if (a !== null) { dullN++; if (a) dullAcc++; } }
    }
    const sharpRate = sharpN ? sharpAcc / sharpN : 0;
    const dullRate = dullN ? dullAcc / dullN : 0;
    expect(sharpRate).toBeGreaterThan(dullRate);
  });
});
