import { it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { gs } from '../js/core.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';
const STAT_KEYS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k,i)=>[k,1+((s*7+i*3)%10)]));
const CAST = Array.from({length:12},(_,i)=>({name:'P'+i,archetype:['mastermind','hero','floater','villain','schemer','goat'][i%6],gender:i%2?'f':'m',sexuality:'straight',stats:spread(i+1)}));
const seededRng = (seed=5)=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
it('diamond smoke', () => {
  const out=[]; let used=0, hijacks=0, weeks=0;
  for (let seed=1; seed<=30; seed++) {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb={outgoingHoh:null,weeks:[],stats:{},house:null};
    const week = simulateBBWeek({ rng: seededRng(seed*7+1), houseEvents: HOUSE_EVENTS,
      competitions: BB_COMPETITIONS, twists:['bb-diamond-veto'] });
    weeks++;
    expect(week.twistState.rules.replacementAuthority).toBe('veto-holder');
    const cer = week.acts.find(a=>a.type==='veto-ceremony');
    expect(cer.diamond).toBe(true);
    expect(cer.chairAuthority).toBe(week.vetoWinner);
    if (cer.used && cer.replacement) {
      used++;
      expect(cer.replacement).not.toBe(week.hoh);
      expect(cer.replacement).not.toBe(week.vetoWinner);
      expect(new Set(week.finalNominees).size).toBe(week.finalNominees.length);
      if (week.vetoWinner !== week.hoh && (cer.socialBeats||[]).some(b=>b.eventId==='diamond-veto-hijack')) hijacks++;
    }
  }
  out.push(`30 diamond weeks: veto used ${used}, hijack beats ${hijacks}`);
  writeFileSync('smoke-dv.txt', out.join('\n'));
});
