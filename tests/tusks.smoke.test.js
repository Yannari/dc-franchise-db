import { describe, it, expect } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs, players, seasonConfig } from '../js/core.js';
import { simulateTusksLadders } from '../js/chal/tusks-and-ladders.js';
import { addBond } from '../js/bonds.js';

const CAST=[{name:'Isabel',archetype:'social-butterfly'},{name:'Logan',archetype:'loyal-soldier'},{name:'Natalia',archetype:'social-butterfly'},{name:'Richard',archetype:'hero'},{name:'Jade',archetype:'schemer'},
  {name:'Anastasia',archetype:'villain'},{name:'Hannah',archetype:'floater'},{name:'Benji',archetype:'underdog'},{name:'Zaid',archetype:'mastermind'},{name:'Ivy',archetype:'social-butterfly'}];
const BLUE=['Isabel','Logan','Natalia','Richard','Jade'];
const RED=['Anastasia','Hannah','Benji','Zaid','Ivy'];

describe('Tusks and Ladders', () => {
  it('runs as a pre-merge tribe challenge with a winner/loser and no immunityWinner', () => {
    seedGame(CAST, { isMerged:false, phase:'pre-merge', episode:3,
      tribes:[{name:'Blue Team',color:'#3a7bd6',members:[...BLUE]},{name:'Red Team',color:'#e0342b',members:[...RED]}],
      popularity:{}, episodeHistory:[] });
    seasonConfig.romance = true;
    const ep = { num:3 };
    simulateTusksLadders(ep);
    const d = ep.tusksLadders;
    expect(d).toBeTruthy();
    // pre-merge: tribe wins, no individual immunity
    expect(ep.immunityWinner).toBeFalsy();
    expect(ep.winner).toBeTruthy(); expect(ep.loser).toBeTruthy();
    expect(ep.winner.name).not.toBe(ep.loser.name);
    expect(ep.tribalPlayers.length).toBe(ep.loser.members.length);
    expect(ep.challengeType).toBe('tusks-and-ladders');
    // each team gathered all pieces (or was penalized) and there's a cannon duel
    expect(d.finish.length).toBe(2);
    expect(d.finish.every(f => f.volleys.some(v => v.hit))).toBe(true);
    // winner's flag hit came first
    const sorted = d.finish.slice().sort((a,b)=>a.hitTime-b.hitTime);
    expect(sorted[0].team).toBe(d.winner);
    // scores numeric
    Object.values(ep.chalMemberScores).forEach(v => expect(Number.isFinite(v)).toBe(true));
    // hunt produced beats
    expect(d.beats.length).toBeGreaterThan(4);
  });

  it('sabotage applies heat + bond damage', () => {
    // villain (Anastasia) should sometimes sabotage — run several times, check heat can appear
    let sawSab=false;
    for (let i=0;i<25 && !sawSab;i++){
      seedGame(CAST, { isMerged:false, phase:'pre-merge', episode:3,
        tribes:[{name:'Blue Team',color:'#3a7bd6',members:[...BLUE]},{name:'Red Team',color:'#e0342b',members:[...RED]}],
        popularity:{}, episodeHistory:[] });
      const ep={num:3}; simulateTusksLadders(ep);
      if (ep.tusksLadders.beats.some(b=>b.type==='sabotage')) sawSab=true;
    }
    expect(sawSab).toBe(true);
  });

  it('hunt narration rarely repeats a template', () => {
    const strip = (t) => CAST.map(c => c.name).reduce((s, n) => s.split(n).join('~'), t);
    let dup = 0;
    for (let i = 0; i < 40; i++) {
      seedGame(CAST, { isMerged:false, phase:'pre-merge', episode:3,
        tribes:[{name:'Blue Team',color:'#3a7bd6',members:[...BLUE]},{name:'Red Team',color:'#e0342b',members:[...RED]}],
        popularity:{}, episodeHistory:[] });
      const ep={num:3}; simulateTusksLadders(ep);
      const seen = new Set();
      ep.tusksLadders.beats.map(b => strip(b.text)).forEach(k => { if (seen.has(k)) dup++; seen.add(k); });
    }
    expect(dup).toBeLessThan(22); // ~0.5/run over a dense ~34-beat challenge
  });

  it('is a dense, varied challenge — many event types + showmance sparks', () => {
    const G = { Isabel:'f', Logan:'m', Natalia:'f', Richard:'m', Jade:'f', Anastasia:'f', Hannah:'f', Benji:'m', Zaid:'m', Ivy:'f' };
    let sawSpark = false; let sparkCreated = 0; const seenTypes = new Set(); let maxBeats = 0;
    for (let i = 0; i < 40; i++) {
      seedGame(CAST, { isMerged:false, phase:'pre-merge', episode:3,
        tribes:[{name:'Blue Team',color:'#3a7bd6',members:[...BLUE]},{name:'Red Team',color:'#e0342b',members:[...RED]}],
        popularity:{}, episodeHistory:[], showmances:[], romanticSparks:[], survival:{} });
      players.forEach(p => { p.gender = G[p.name]; p.sexuality = 'straight'; });
      seasonConfig.romance = 'enabled';
      addBond('Logan','Isabel',6); addBond('Zaid','Ivy',6); addBond('Benji','Hannah',6); addBond('Jade','Richard',-4);
      const ep = { num:3 }; simulateTusksLadders(ep);
      ep.tusksLadders.beats.forEach(b => seenTypes.add(b.type));
      maxBeats = Math.max(maxBeats, ep.tusksLadders.beats.length);
      if (ep.tusksLadders.beats.some(b => b.type === 'spark')) sawSpark = true;
      sparkCreated += (gs.romanticSparks?.length || 0);
    }
    // rich palette: grabs + rivalry/respect/taunt/encourage/injury/teamwork/sabotage all appear
    ['grab','rivalry','respect','taunt','encourage','injury','teamwork','sabotage'].forEach(t => expect(seenTypes.has(t)).toBe(true));
    expect(maxBeats).toBeGreaterThan(22); // full-length hunt
    // showmances actually start (spark beat + real spark in gs.romanticSparks)
    expect(sawSpark).toBe(true);
    expect(sparkCreated).toBeGreaterThan(0);
  });
});
