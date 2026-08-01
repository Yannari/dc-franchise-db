import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { DEALS_EVENTS } from '../js/bb-events/deals.js';
import { POWER_EVENTS } from '../js/bb-events/power.js';
import { seedGame } from './helpers/setup.js';

const CAST=['A','B','C','D','E','F'].map((name,i)=>({
  name, gender:i%2?'f':'m', archetype:i===0?'mastermind':'floater',
}));
const event=(pool,id)=>pool.find(e=>e.id===id);
const ctx=(act,phase,extra={})=>({
  act,phase,hoh:'A',nominees:['B','C'],vetoWinner:'D',week:{num:1,hoh:'A',vetoWinner:'D'},...extra,
});

describe('Big Brother event chronology',()=>{
  beforeEach(()=>seedGame(CAST,{episode:0,eliminated:[],namedAlliances:[],popularity:{}}));

  it('offers safety only after HOH and before nominations',()=>{
    const e=event(DEALS_EVENTS,'deals-safety');
    expect(e.weight(gs.activePlayers,ctx('house','post-hoh',{nominees:[]}))).toBeGreaterThan(0);
    expect(e.weight(gs.activePlayers,ctx('house','post-noms'))).toBe(0);
    expect(e.weight(gs.activePlayers,ctx('campaign','campaign'))).toBe(0);
  });

  it('closes the HOH-room queue once nominations are known',()=>{
    const e=event(POWER_EVENTS,'power-hoh-room-queue');
    expect(e.weight(gs.activePlayers,ctx('house','post-hoh',{nominees:[]}))).toBeGreaterThan(0);
    expect(e.weight(gs.activePlayers,ctx('house','post-noms'))).toBe(0);
    expect(e.weight(gs.activePlayers,ctx('campaign','campaign'))).toBe(0);
  });

  it('ends veto-draw lobbying before the veto competition begins',()=>{
    const e=event(POWER_EVENTS,'power-veto-draw-lobby');
    expect(e.weight(gs.activePlayers,ctx('house','post-noms'))).toBeGreaterThan(0);
    expect(e.weight(gs.activePlayers,ctx('veto','veto'))).toBe(0);
    expect(e.weight(gs.activePlayers,ctx('house','post-veto'))).toBe(0);
  });

  it('allows a veto promise after the win but before the ceremony',()=>{
    const e=event(POWER_EVENTS,'power-veto-promise');
    expect(e.weight(gs.activePlayers,ctx('house','post-veto'))).toBeGreaterThan(0);
    expect(e.weight(gs.activePlayers,ctx('veto-ceremony','veto-ceremony'))).toBe(0);
    expect(e.weight(gs.activePlayers,ctx('campaign','campaign'))).toBe(0);
  });

  it('does not campaign for a vote during the eviction act',()=>{
    expect(event(DEALS_EVENTS,'deals-vote-pitch').weight(gs.activePlayers,ctx('eviction','eviction'))).toBe(0);
  });
});
