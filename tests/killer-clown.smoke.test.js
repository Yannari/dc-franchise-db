import { describe, it, expect } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs, players, seasonConfig } from '../js/core.js';
import { simulateKillerClown } from '../js/chal/killer-clown.js';
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

describe('Night of the Killer Clown', () => {
  it('runs as a post-merge individual challenge with an immunity winner ranked #1', () => {
    seed(); seasonConfig.romance = 'enabled';
    const ep = { num: 8 };
    simulateKillerClown(ep);
    const d = ep.killerClown;
    expect(d).toBeTruthy();
    expect(ep.immunityWinner).toBe(d.immunityWinner);
    expect(ep.challengeType).toBe('killer-clown');
    expect(ep.tribalPlayers.length).toBe(CAST.length);
    // every player has a loadout + a final placement
    expect(d.loadout.length).toBe(CAST.length);
    expect(d.results.length).toBe(CAST.length);
    // first result is the winner and the fastest home
    expect(d.results[0].name).toBe(d.immunityWinner);
    expect(d.results[0].returnTime).toBe(Math.min(...d.results.map(r => r.returnTime)));
    // scores numeric, and the winner is the top scorer (drives challenge-tab ranking)
    Object.values(ep.chalMemberScores).forEach(v => expect(Number.isFinite(v)).toBe(true));
    const top = Object.entries(ep.chalMemberScores).sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe(d.immunityWinner);
    // hunt produced a long, dense slate of beats
    expect(d.beats.length).toBeGreaterThan(40);
  });

  it('runs the dart economy — barter / give / steal all reachable, loadout splits guns and darts', () => {
    let sawBarter = false, sawGive = false, sawSteal = false;
    for (let i = 0; i < 30 && !(sawBarter && sawGive && sawSteal); i++) {
      seed();
      addBond('Anastasia', 'Marissa', -4); // give the villain a low-bond dart target to steal from
      const ep = { num: 8 }; simulateKillerClown(ep);
      const types = new Set(ep.killerClown.beats.map(b => b.type));
      if (types.has('barter')) sawBarter = true;
      if (types.has('give')) sawGive = true;
      if (types.has('steal')) sawSteal = true;
      // loadout must contain both guns and darts
      const items = ep.killerClown.loadout.map(l => l.item);
      expect(items.includes('gun')).toBe(true);
      expect(items.includes('dart')).toBe(true);
    }
    expect(sawBarter).toBe(true);
    expect(sawGive).toBe(true);
    expect(sawSteal).toBe(true);
  });

  it('the clown grabs and gets stunned — grabs apply a heavy penalty + a camp event', () => {
    let sawGrab = false, sawStun = false, grabPenaltyOk = true;
    for (let i = 0; i < 30 && !(sawGrab && sawStun); i++) {
      seed();
      const ep = { num: 8 }; simulateKillerClown(ep);
      const d = ep.killerClown;
      if (d.beats.some(b => b.type === 'grab')) {
        sawGrab = true;
        // a grabbed player finishes far behind the winner
        const grabbed = d.results.filter(r => r.grabbed);
        if (grabbed.length) grabPenaltyOk = grabbed.every(r => r.returnTime > d.results[0].returnTime + 25);
        // camp event injected
        const camp = ep.campEvents.merge.post;
        expect(camp.some(e => e.type === 'clownGrab')).toBe(true);
      }
      if (d.beats.some(b => b.type === 'stun')) sawStun = true;
    }
    expect(sawGrab).toBe(true);
    expect(sawStun).toBe(true);
    expect(grabPenaltyOk).toBe(true);
  });

  it('is dense and varied — many event types + real showmance sparks', () => {
    const seenTypes = new Set(); let maxBeats = 0, sawSpark = false, sparkCreated = 0;
    for (let i = 0; i < 40; i++) {
      seed(); seasonConfig.romance = 'enabled';
      addBond('Logan', 'Jade', 6); addBond('Zaid', 'Ivy', 6); addBond('Benji', 'Hannah', 6); addBond('Amelie', 'Marissa', -4);
      const ep = { num: 8 }; simulateKillerClown(ep);
      ep.killerClown.beats.forEach(b => seenTypes.add(b.type));
      maxBeats = Math.max(maxBeats, ep.killerClown.beats.length);
      if (ep.killerClown.beats.some(b => b.type === 'spark')) sawSpark = true;
      sparkCreated += (gs.romanticSparks?.length || 0);
    }
    ['grab', 'help', 'rivalry', 'respect', 'encourage', 'stun', 'sabotage', 'route'].forEach(t => expect(seenTypes.has(t)).toBe(true));
    expect(maxBeats).toBeGreaterThan(45);
    expect(sawSpark).toBe(true);
    expect(sparkCreated).toBeGreaterThan(0);
  });

  it('hunt narration rarely repeats a template', () => {
    const strip = (t) => CAST.map(c => c.name).reduce((s, n) => s.split(n).join('~'), t);
    let dup = 0;
    for (let i = 0; i < 40; i++) {
      seed(); seasonConfig.romance = 'enabled';
      const ep = { num: 8 }; simulateKillerClown(ep);
      const seen = new Set();
      ep.killerClown.beats.map(b => strip(b.text)).forEach(k => { if (seen.has(k)) dup++; seen.add(k); });
    }
    expect(dup).toBeLessThan(50); // ~0.8/run over a long ~55-beat challenge
  });
});
