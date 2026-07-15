import { describe, it, expect } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs, players, seasonConfig } from '../js/core.js';
import { simulateSayCheese } from '../js/chal/say-cheese.js';
import { addBond } from '../js/bonds.js';

const CAST = [
  { name: 'Isabel', archetype: 'social-butterfly', gender: 'f' }, { name: 'Logan', archetype: 'loyal-soldier', gender: 'm' },
  { name: 'Marissa', archetype: 'social-butterfly', gender: 'f' }, { name: 'Zaid', archetype: 'mastermind', gender: 'm' },
  { name: 'Jade', archetype: 'schemer', gender: 'f' }, { name: 'Anastasia', archetype: 'villain', gender: 'f' },
  { name: 'Hannah', archetype: 'floater', gender: 'f' }, { name: 'Amelie', archetype: 'perceptive-player', gender: 'f' },
];

function seed(cast = CAST) {
  seedGame(cast, { isMerged: true, phase: 'post-merge', mergeName: 'merge', episode: 24,
    popularity: {}, episodeHistory: [], showmances: [], romanticSparks: [], survival: {}, tribes: [] });
}

describe('Say Cheese', () => {
  it('runs a post-merge individual challenge with a winner ranked #1', () => {
    seed(); seasonConfig.romance = 'enabled';
    const ep = { num: 24 };
    simulateSayCheese(ep);
    const d = ep.sayCheese;
    expect(d).toBeTruthy();
    expect(ep.immunityWinner).toBe(d.immunityWinner);
    expect(ep.challengeType).toBe('say-cheese');
    expect(ep.tribalPlayers.length).toBe(CAST.length);
    expect(d.results.length).toBe(CAST.length);
    // winner is first in results and the top scorer
    expect(d.results[0].name).toBe(d.immunityWinner);
    Object.values(ep.chalMemberScores).forEach(v => expect(Number.isFinite(v)).toBe(true));
    const top = Object.entries(ep.chalMemberScores).sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe(d.immunityWinner);
    // the winner landed a perfect selfie (or closest-to-fearless fallback)
    expect(d.results[0].best).toBe('perfect');
    // dense, multi-beat drop
    expect(d.beats.length).toBeGreaterThan(20);
  });

  it('forces the Disadvantage Vote target to the TOP', () => {
    for (let i = 0; i < 8; i++) {
      seed();
      gs._disadvantage = { target: 'Jade', factor: 0.65 };
      const ep = { num: 24 }; simulateSayCheese(ep);
      const jade = ep.sayCheese.roster.find(r => r.name === 'Jade');
      expect(jade.height).toBe(2);       // top
      expect(jade.disadvantaged).toBe(true);
      gs._disadvantage = null;
    }
  });

  it('produces the three selfie failure types + perfect', () => {
    const seen = new Set();
    for (let i = 0; i < 30; i++) {
      seed();
      const ep = { num: 24 }; simulateSayCheese(ep);
      ep.sayCheese.beats.forEach(b => { if (b.selfie) seen.add(b.selfie); });
      ep.sayCheese.results.forEach(r => seen.add(r.best));
    }
    ['perfect', 'fear', 'blurry'].forEach(k => expect(seen.has(k)).toBe(true));
  });

  it('sabotage fires with real stakes — ruins selfies, can break phones + DQ, injects camp events', () => {
    let sawSabo = false, sawWarn = false, sawDQ = false, sawCamp = false;
    for (let i = 0; i < 40 && !(sawSabo && sawWarn && sawDQ && sawCamp); i++) {
      seed();
      addBond('Anastasia', 'Logan', -5); addBond('Jade', 'Logan', -5); // villains with low-bond targets
      const ep = { num: 24 }; simulateSayCheese(ep);
      const d = ep.sayCheese;
      if (d.beats.some(b => b.type === 'sabo')) sawSabo = true;
      if (d.warnings >= 1) sawWarn = true;
      if (d.results.some(r => r.dq)) sawDQ = true;
      if ((ep.campEvents.merge.post || []).some(e => e.type === 'sayCheeseSabotage')) sawCamp = true;
    }
    expect(sawSabo).toBe(true);
    expect(sawWarn).toBe(true);
    expect(sawCamp).toBe(true);
    // DQ is rarer but should surface across many runs
    expect(sawDQ).toBe(true);
  });

  it('the live sidebar board tracks every jumper each beat', () => {
    seed();
    const ep = { num: 24 }; simulateSayCheese(ep);
    ep.sayCheese.beats.forEach(b => {
      expect(Array.isArray(b.board)).toBe(true);
      expect(b.board.length).toBe(CAST.length);
      b.board.forEach(x => { expect(x.fearPct).toBeGreaterThanOrEqual(8); expect(x.fearPct).toBeLessThanOrEqual(94); });
    });
  });

  it('drop narration rarely repeats a template', () => {
    const strip = (t) => CAST.map(c => c.name).reduce((s, n) => s.split(n).join('~'), t);
    let dup = 0;
    for (let i = 0; i < 40; i++) {
      seed(); seasonConfig.romance = 'enabled';
      const ep = { num: 24 }; simulateSayCheese(ep);
      const seen = new Set();
      ep.sayCheese.beats.map(b => strip(b.text)).forEach(k => { if (seen.has(k)) dup++; seen.add(k); });
    }
    expect(dup).toBeLessThan(360); // ~7/run of repeated jump/fail flavor across a long tower race
  });
});
