import { describe, it, expect } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs, seasonConfig } from '../js/core.js';
import { simulateWheelOfMisfortune } from '../js/chal/wheel-of-misfortune.js';
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
  gs._tiedDestiniesActive = null;
}

describe('Wheel of Misfortune', () => {
  it('runs a post-merge PAIR challenge — winning pair BOTH immune, both top the scoreboard', () => {
    seed(); seasonConfig.romance = 'enabled';
    const ep = { num: 24 };
    simulateWheelOfMisfortune(ep);
    const d = ep.wheelOfMisfortune;
    expect(d).toBeTruthy();
    expect(ep.challengeType).toBe('wheel-of-misfortune');
    expect(ep.tribalPlayers.length).toBe(CAST.length);
    // both partners of the winning pair are immune
    expect(d.immunePair.length).toBe(2);
    expect(ep.immunityWinner).toBe(d.immunePair[0]);
    d.immunePair.forEach(n => expect(ep.extraImmune).toContain(n));
    // scores finite; the two winners are the joint top scorers
    Object.values(ep.chalMemberScores).forEach(v => expect(Number.isFinite(v)).toBe(true));
    const sorted = Object.entries(ep.chalMemberScores).sort((a, b) => b[1] - a[1]);
    expect(d.immunePair).toContain(sorted[0][0]);
    expect(d.immunePair).toContain(sorted[1][0]);
    // winner pair is ranked #1 in results
    expect(d.results[0].won).toBe(true);
    expect(d.results[0].members.slice().sort()).toEqual(d.immunePair.slice().sort());
    // three dense phases
    expect(d.phase1.beats.length).toBeGreaterThan(5);
    expect(d.phase2.beats.length).toBeGreaterThan(3);
    expect(d.phase3.beats.length).toBeGreaterThan(3);
  });

  it('every phase beat carries a board snapshot covering all pairs', () => {
    seed();
    const ep = { num: 24 }; simulateWheelOfMisfortune(ep);
    const d = ep.wheelOfMisfortune;
    const nPairs = d.roster.length;
    d.phase1.beats.forEach(b => { expect(Array.isArray(b.board)).toBe(true); expect(b.board.length).toBe(nPairs); });
    d.phase2.beats.forEach(b => { expect(b.board.length).toBe(nPairs); });
    d.phase3.beats.forEach(b => { expect(b.board.length).toBe(nPairs); });
  });

  it('handles an odd cast by sitting one spectator out (no immunity)', () => {
    const odd = CAST.slice(0, 7);
    seed(odd);
    const ep = { num: 24 }; simulateWheelOfMisfortune(ep);
    const d = ep.wheelOfMisfortune;
    expect(d.spectator).toBeTruthy();
    expect(ep.chalMemberScores[d.spectator]).toBe(0);
    expect(d.immunePair).not.toContain(d.spectator);
    // spectator still appears in placements
    expect(ep.chalPlacements).toContain(d.spectator);
  });

  it('respects Tied Destinies pairs when the twist is live', () => {
    seed();
    gs._tiedDestiniesActive = [
      { a: 'Isabel', b: 'Anastasia' },
      { a: 'Logan', b: 'Amelie' },
      { a: 'Jade', b: 'Hannah' },
      { a: 'Marissa', b: 'Zaid' },
    ];
    const ep = { num: 24 }; simulateWheelOfMisfortune(ep);
    const d = ep.wheelOfMisfortune;
    const pairKeys = d.roster.map(r => [r.rider, r.grounder].sort().join('|')).sort();
    expect(pairKeys).toEqual([
      ['Isabel', 'Anastasia'].sort().join('|'),
      ['Logan', 'Amelie'].sort().join('|'),
      ['Jade', 'Hannah'].sort().join('|'),
      ['Marissa', 'Zaid'].sort().join('|'),
    ].sort());
    gs._tiedDestiniesActive = null;
  });

  it('the game-throw can fire — a player tips the win to a showmance/close ally', () => {
    let sawThrow = false;
    for (let i = 0; i < 60 && !sawThrow; i++) {
      seed();
      // strong cross-pair bond + boldness bait: Logan (loyal, bold) adores a rival
      addBond('Logan', 'Anastasia', 9);
      gs.showmances = [{ players: ['Logan', 'Anastasia'], phase: 'together', broken: false }];
      const ep = { num: 24 }; simulateWheelOfMisfortune(ep);
      if (ep.wheelOfMisfortune.phase3.beats.some(b => b.type === 'gameThrow')) sawThrow = true;
      if ((ep.campEvents.merge.post || []).some(e => e.type === 'wheelGameThrow')) sawThrow = true;
    }
    expect(sawThrow).toBe(true);
  });

  it('social beats across phases have gameplay consequences (camp/immunity events injected)', () => {
    seed();
    const ep = { num: 24 }; simulateWheelOfMisfortune(ep);
    // the win itself injects a camp event
    expect((ep.campEvents.merge.post || []).some(e => e.type === 'wheelWin')).toBe(true);
  });
});
