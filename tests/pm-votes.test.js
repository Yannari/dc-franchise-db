import { describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { setRelationshipDimension } from '../js/relationships.js';
import { streamFor } from '../js/dr/rng.js';
import { createLedger } from '../js/pm/ledger.js';
import { syncLadder, setStep } from '../js/pm/ladder.js';
import { publicVote, finalVote, splitOrSteal } from '../js/pm/public-vote.js';
import { villaDumping } from '../js/pm/villa-vote.js';

function state() {
  const names = ['F1', 'M1', 'F2', 'M2', 'F3', 'M3', 'F4', 'M4'];
  const mk = n => ({ name: n, gender: n[0] === 'F' ? 'f' : 'm', sexuality: 'straight', archetype: 'floater',
    intent: 'love', stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5,
      boldness: 5, intuition: 5, temperament: 5 } });
  setPlayers(names.map(mk));
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {} });
  const s = { day: 10, villa: names, casa: [], split: false, profiles: Object.fromEntries(names.map(n => [n, mk(n)])),
    ledger: createLedger(), shows: {}, believes: {},
    couples: [['F1', 'M1'], ['F2', 'M2'], ['F3', 'M3'], ['F4', 'M4']] };
  syncLadder(s);
  return s;
}

describe('the public vote', () => {
  it('shares sum to one and the bottom is the lowest', () => {
    const s = state();
    Object.assign(s.ledger.approval, { F1: 50, M1: 50, F2: 20, M2: 20, F3: -20, M3: -30, F4: 0, M4: 0 });
    const v = publicVote(s, { rng: streamFor(1, 'pv'), bottom: 2 });
    expect(v.shares.reduce((a, b) => a + b.share, 0)).toBeCloseTo(1, 6);
    expect(v.bottom[0]).toEqual(['F3', 'M3']);
  });

  it('a carried couple (star + hated) beats a lukewarm pair most of the time', () => {
    const s = state();
    Object.assign(s.ledger.approval, { F1: 70, M1: -50, F2: 10, M2: 10, F3: 10, M3: 10, F4: 10, M4: 10 });
    let safe = 0;
    for (let i = 0; i < 50; i++) {
      const v = publicVote(s, { rng: streamFor(i * 7919 + 13, 'pv'), bottom: 1 });
      if (!v.bottom[0].includes('F1')) safe++;
    }
    expect(safe).toBeGreaterThanOrEqual(45);
  });

  it('the final ranks every couple once and split-or-steal answers', () => {
    const s = state();
    const f = finalVote(s, { rng: streamFor(2, 'fv') });
    expect(f.map(x => x.placement)).toEqual([1, 2, 3, 4]);
    const e = splitOrSteal(s, f[0].couple, { rng: streamFor(3, 'env') });
    expect(['split', 'steal']).toContain(e.choice);
    expect(f[0].couple).toContain(e.holder);
  });
});

describe('villa dumpings', () => {
  const bottom = [['F3', 'M3'], ['F4', 'M4']];
  it('cross-gender dumps one of each gender from the bottom', () => {
    const r = villaDumping(state(), { format: 'cross-gender', bottom, rng: streamFor(1, 'vd') });
    expect(r.dumped).toHaveLength(2);
    expect(r.dumped.map(n => n[0]).sort()).toEqual(['F', 'M']);
    expect(r.dumped.every(n => bottom.flat().includes(n))).toBe(true);
    expect(r.ballots.every(b => b.channel === 'villa' && !bottom.flat().includes(b.voter))).toBe(true);
  });
  it('safe-pick-couple dumps a whole bottom couple', () => {
    const r = villaDumping(state(), { format: 'safe-pick-couple', bottom, rng: streamFor(2, 'vd') });
    expect(bottom.some(c => c.every(n => r.dumped.includes(n)))).toBe(true);
    expect(r.dumped).toHaveLength(2);
  });
  it('one-stays dumps one of the lowest couple; public dumps it whole', () => {
    expect(villaDumping(state(), { format: 'one-stays', bottom, rng: streamFor(3, 'vd') }).dumped)
      .toHaveLength(1);
    expect(villaDumping(state(), { format: 'public', bottom, rng: streamFor(4, 'vd') }).dumped)
      .toEqual(['F3', 'M3']);
  });
  it('the villa protects a real couple: an official pair draws fewer votes', () => {
    const open = state();
    for (const v of ['F1', 'F2', 'M1', 'M2']) { setRelationshipDimension(v, 'F3', 'affection', 1); setRelationshipDimension(v, 'F4', 'affection', 1); }
    const before = villaDumping(open, { format: 'safe-pick-couple', bottom, rng: streamFor(9, 'vd') });
    const strong = state();
    for (const v of ['F1', 'F2', 'M1', 'M2']) { setRelationshipDimension(v, 'F3', 'affection', 1); setRelationshipDimension(v, 'F4', 'affection', 1); }
    setStep(strong, 'F3', 'M3', 'official'); setStep(strong, 'M3', 'F3', 'official');
    const after = villaDumping(strong, { format: 'safe-pick-couple', bottom, rng: streamFor(9, 'vd') });
    const votesFor = (r, n) => r.ballots.filter(b => b.target === n).length;
    expect(votesFor(after, 'F3')).toBeLessThan(votesFor(before, 'F3'));
  });
});
