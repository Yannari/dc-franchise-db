import { describe, it, expect } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs, players, seasonConfig } from '../js/core.js';
import { simulateBumperCarBash } from '../js/chal/bumper-car-bash.js';
import { addBond } from '../js/bonds.js';

const CAST = [
  { name: 'Isabel', archetype: 'social-butterfly', gender: 'f' }, { name: 'Logan', archetype: 'loyal-soldier', gender: 'm' },
  { name: 'Marissa', archetype: 'social-butterfly', gender: 'f' }, { name: 'Zaid', archetype: 'mastermind', gender: 'm' },
  { name: 'Jade', archetype: 'schemer', gender: 'f' }, { name: 'Anastasia', archetype: 'villain', gender: 'f' },
  { name: 'Hannah', archetype: 'floater', gender: 'f' }, { name: 'Amelie', archetype: 'perceptive-player', gender: 'f' },
  { name: 'Benji', archetype: 'underdog', gender: 'm' }, { name: 'Ivy', archetype: 'hero', gender: 'f' },
];

function seed() {
  seedGame(CAST, { isMerged: true, phase: 'post-merge', mergeName: 'merge', episode: 8,
    popularity: {}, episodeHistory: [], showmances: [], romanticSparks: [], survival: {}, tribes: [] });
}

describe('Bumper Car Bash', () => {
  it('runs as a post-merge individual challenge with an immunity winner ranked #1', () => {
    seed(); seasonConfig.romance = 'enabled';
    const ep = { num: 8 };
    simulateBumperCarBash(ep);
    const d = ep.bumperCarBash;
    expect(d).toBeTruthy();
    expect(ep.immunityWinner).toBe(d.immunityWinner);
    expect(ep.challengeType).toBe('bumper-car-bash');
    expect(ep.tribalPlayers.length).toBe(CAST.length);
    // every driver has a final score row
    expect(d.results.length).toBe(CAST.length);
    // first result is the winner, and holds the most points
    expect(d.results[0].name).toBe(d.immunityWinner);
    expect(d.results[0].points).toBe(Math.max(...d.results.map(r => r.points)));
    // scores numeric, and the winner is the top scorer (drives challenge-tab ranking)
    Object.values(ep.chalMemberScores).forEach(v => expect(Number.isFinite(v)).toBe(true));
    const top = Object.entries(ep.chalMemberScores).sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe(d.immunityWinner);
    // long, dense point-by-point log
    expect(d.beats.length).toBeGreaterThan(25);
  });

  it('scores the three hit values and the null head-on', () => {
    const seen = new Set();
    for (let i = 0; i < 30; i++) {
      seed();
      const ep = { num: 8 }; simulateBumperCarBash(ep);
      ep.bumperCarBash.beats.forEach(b => { if (['rear', 'tbone', 'ambush', 'null'].includes(b.kind)) seen.add(b.kind); });
      // scoring beats award the right points for their kind
      ep.bumperCarBash.beats.forEach(b => {
        if (b.kind === 'rear' && b.scorer) expect(b.pts).toBe(1);
        if (b.kind === 'ambush' && b.scorer) expect(b.pts).toBe(3);
        if (b.kind === 'null') expect(b.pts).toBe(0);
      });
    }
    ['rear', 'tbone', 'ambush', 'null'].forEach(k => expect(seen.has(k)).toBe(true));
  });

  it('has the key strategic beats — car trouble, denial block, betrayal, vote scheme', () => {
    let sawTrouble = false, sawDeny = false, sawBetray = false, sawScheme = false;
    for (let i = 0; i < 40 && !(sawTrouble && sawDeny && sawBetray && sawScheme); i++) {
      seed();
      // give allies so combos/betrayals/denials can fire
      addBond('Logan', 'Hannah', 6); addBond('Jade', 'Anastasia', 6); addBond('Zaid', 'Ivy', 6);
      const ep = { num: 8 }; simulateBumperCarBash(ep);
      const types = new Set(ep.bumperCarBash.beats.map(b => b.type));
      if (types.has('trouble') || types.has('recover')) sawTrouble = true;
      if (types.has('deny')) sawDeny = true;
      if (types.has('betray')) sawBetray = true;
      if (types.has('scheme')) sawScheme = true;
    }
    expect(sawTrouble).toBe(true);
    expect(sawDeny).toBe(true);
    expect(sawBetray).toBe(true);
    expect(sawScheme).toBe(true);
    // a denial injects a camp event
    let sawDenyCamp = false;
    for (let i = 0; i < 30 && !sawDenyCamp; i++) {
      seed(); addBond('Jade', 'Anastasia', 6);
      const ep = { num: 8 }; simulateBumperCarBash(ep);
      if ((ep.campEvents.merge.post || []).some(e => e.type === 'bashDeny' || e.type === 'bashBetray')) sawDenyCamp = true;
    }
    expect(sawDenyCamp).toBe(true);
  });

  it('is dense and varied — many event types + real showmance sparks', () => {
    const seenTypes = new Set(); let maxBeats = 0, sawSpark = false, sparkCreated = 0;
    for (let i = 0; i < 40; i++) {
      seed(); seasonConfig.romance = 'enabled';
      addBond('Logan', 'Jade', 6); addBond('Zaid', 'Ivy', 6); addBond('Benji', 'Hannah', 6); addBond('Amelie', 'Marissa', -4);
      const ep = { num: 8 }; simulateBumperCarBash(ep);
      ep.bumperCarBash.beats.forEach(b => seenTypes.add(b.type));
      maxBeats = Math.max(maxBeats, ep.bumperCarBash.beats.length);
      if (ep.bumperCarBash.beats.some(b => b.type === 'spark')) sawSpark = true;
      sparkCreated += (gs.romanticSparks?.length || 0);
    }
    ['ram', 'rivalry', 'respect', 'encourage', 'spinout', 'help'].forEach(t => expect(seenTypes.has(t)).toBe(true));
    expect(maxBeats).toBeGreaterThan(40);
    expect(sawSpark).toBe(true);
    expect(sparkCreated).toBeGreaterThan(0);
  });

  it('arena narration rarely repeats a template', () => {
    const strip = (t) => CAST.map(c => c.name).reduce((s, n) => s.split(n).join('~'), t);
    let dup = 0;
    for (let i = 0; i < 40; i++) {
      seed(); seasonConfig.romance = 'enabled';
      const ep = { num: 8 }; simulateBumperCarBash(ep);
      const seen = new Set();
      ep.bumperCarBash.beats.map(b => strip(b.text)).forEach(k => { if (seen.has(k)) dup++; seen.add(k); });
    }
    expect(dup).toBeLessThan(300); // ~4/run over a long point-race (mostly ram descriptions)
  });
});
