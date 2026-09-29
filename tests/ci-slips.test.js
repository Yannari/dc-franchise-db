import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { rngFor, streamFor } from '../js/dr/rng.js';
import { newState, addScene, bump, rel } from '../js/ci/state.js';
import { belief } from '../js/ci/beliefs.js';
import { initMind } from '../js/ci/mind.js';
import { makeClaim, learn } from '../js/ci/claims.js';
import { slipRisk, noticeChance, rollSlips, probe, hasTheory } from '../js/ci/slips.js';
import { revealTo, isRevealed } from '../js/ci/reveal.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

function room({ catfishGender = 'f', realGender = 'm', strategic = 5, intuition = 5 } = {}) {
  const s = newState(1);
  const stats = (o = {}) => ({ strategic: 5, mental: 5, intuition: 5, temperament: 5, loyalty: 5, ...o });
  s.people.Cat = { name: 'Cat', gender: realGender, archetype: 'floater', stats: stats({ strategic }) };
  s.people.Obs = { name: 'Obs', gender: 'f', archetype: 'floater', stats: stats({ intuition }) };
  s.people.Hon = { name: 'Hon', gender: 'm', archetype: 'floater', stats: stats() };
  s.profiles['@cat'] = { handle: '@cat', players: ['Cat'], mode: 'catfish', gap: 2, tells: ['golf'],
    shown: { gender: catfishGender, age: 23 } };
  s.profiles['@obs'] = { handle: '@obs', players: ['Obs'], mode: 'honest', gap: 0, tells: [], shown: { gender: 'f', age: 30 } };
  s.profiles['@hon'] = { handle: '@hon', players: ['Hon'], mode: 'honest', gap: 0, tells: [], shown: { gender: 'm', age: 30 } };
  s.active = ['@cat', '@obs', '@hon'];
  for (const h of s.active) initMind(s, h);
  return s;
}

describe('slips', () => {
  it('never happen to an honest profile, and happen more at a party', () => {
    const s = room();
    expect(slipRisk(s, '@hon')).toBe(0);
    expect(slipRisk(s, '@cat', { party: true })).toBeGreaterThan(slipRisk(s, '@cat'));
  });

  it('are rarer for a skilled liar and noticed more by an intuitive listener', () => {
    expect(slipRisk(room({ strategic: 10 }), '@cat')).toBeLessThan(slipRisk(room({ strategic: 1 }), '@cat'));
    expect(noticeChance(room({ intuition: 10 }), '@obs', '@cat')).toBeGreaterThan(noticeChance(room({ intuition: 1 }), '@obs', '@cat'));
  });

  it('lower the noticer\'s belief and are written onto the scene', () => {
    let hits = 0;
    for (let i = 0; i < 60; i++) {
      const s = room({ intuition: 10, strategic: 1 });
      const sc = addScene(s, 'chat', ['@cat', '@obs']);
      const out = rollSlips(s, rngFor(i * 7919 + 13), '@cat', ['@obs'], { specific: 1, party: true }, sc);
      if (out.some(x => x.noticedBy.includes('@obs'))) {
        hits++;
        expect(belief(s, '@obs', '@cat').real).toBeLessThan(0.85);
        expect(sc.data.slips.length).toBeGreaterThan(0);
      }
    }
    expect(hits).toBeGreaterThan(0);
  });
});

describe('probes', () => {
  it('an honest player always passes', () => {
    const s = room();
    const sc = addScene(s, 'chat', ['@obs', '@hon']);
    expect(probe(s, streamFor(1, 'p'), '@obs', '@hon', sc)).toBe('pass');
  });

  it('a clumsy catfish is caught out more than a strategic one, who dodges instead', () => {
    const tally = strategic => {
      let failed = 0;
      for (let i = 0; i < 300; i++) {
        const s = room({ strategic });
        const r = probe(s, streamFor(i, 'probe'), '@obs', '@cat', addScene(s, 'chat', ['@obs', '@cat']));
        if (r === 'fail') failed++;
      }
      return failed;
    };
    expect(tally(1)).toBeGreaterThan(tally(10));
  });

  it('two failed probes are enough for a theory', () => {
    const s = room({ strategic: 1 });
    const always = () => 0;   // every draw lands in the fail band
    expect(probe(s, always, '@obs', '@cat', addScene(s, 'chat', ['@obs', '@cat']))).toBe('fail');
    probe(s, always, '@obs', '@cat', addScene(s, 'chat', ['@obs', '@cat']));
    expect(hasTheory(s, '@obs', '@cat')).toBe(true);
  });
});

describe('reveals', () => {
  it('a protective catfish keeps most of the warmth', () => {
    const s = room();
    bump('@obs', '@cat', 'affection', 6);
    bump('@obs', '@cat', 'trust', 6);
    revealTo(s, '@obs', '@cat', addScene(s, 'visit', ['@cat', '@obs']));
    expect(isRevealed(s, '@obs', '@cat')).toBe(true);
    expect(belief(s, '@obs', '@cat').real).toBe(0);
    expect(rel('Obs', 'Cat', 'affection')).toBe(6);
    expect(rel('Obs', 'Cat', 'strategicRespect')).toBeGreaterThan(0);
    expect(rel('Obs', 'Cat', 'resentment')).toBe(0);
  });

  it('a catfish who lied about others turns warmth into resentment, and a false flirt stings', () => {
    const s = room();
    bump('@obs', '@cat', 'trust', 6);
    bump('@obs', '@cat', 'attraction', 7);
    const lie = makeClaim(s, { kind: 'distrusts', holder: '@hon', about: '@obs', truth: false, by: '@cat' });
    learn(s, '@obs', lie, '@cat', addScene(s, 'chat', ['@cat', '@obs']));
    revealTo(s, '@obs', '@cat', addScene(s, 'goodbye', ['@cat'], {}, ['@obs', '@hon']));
    expect(rel('Obs', 'Cat', 'resentment')).toBeGreaterThan(3);
    expect(rel('Obs', 'Cat', 'attraction')).toBeLessThan(2);
  });

  it('happens once per pair', () => {
    const s = room();
    const sc = addScene(s, 'goodbye', ['@cat'], {}, ['@obs']);
    expect(revealTo(s, '@obs', '@cat', sc)).toBe(true);
    expect(revealTo(s, '@obs', '@cat', sc)).toBe(false);
  });
});
