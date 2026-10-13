import { expect, it } from 'vitest';
import { sceneMeasure, rhythm, rollingShares } from '../tools/td-pacing/metrics.js';
it('counts spoken turns separately from confessionals and does not count witnesses as central pairs',()=>{
 const s=sceneMeasure({kind:'long.drama.fight',scene:{who:{a:'A',b:'B',c:'C'}},lines:[{kind:'say',by:'A',text:'One.'},{kind:'say',by:'B',text:'Two.'},{kind:'say',by:'C',text:'Stop.'},{kind:'conf',by:'A',text:'No.'}]});
 expect(s.spoken).toBe(3); expect(s.confessionals).toBe(1); expect(s.pair).toBe('A|B'); expect(s.otherSpeakers).toEqual(['C']); expect(s.people.A).toBe(2);
});
it('does not invent a central pair from a listener or confessionals',()=>{
 expect(sceneMeasure({scene:{who:{a:'A',b:'B'}},lines:[{kind:'say',by:'A',text:'Hi'},{kind:'conf',by:'B',text:'Hmm'}]}).pair).toBeNull();
});
it('measures consecutive heavy runs without bridging neutral scenes',()=>{
 expect(rhythm(['H','H','N','H','L','L'])).toEqual({maxHeavyRun:2,transitions:1,comparable:3});
});
it('calculates rolling shares over episodes, without counting a shared scene twice',()=>{
 const scenes=[1,2,3,4].map(ep=>({ep,people:{A:2,B:1},pair:'A|B'}));
 const r=rollingShares(scenes); expect(r).toHaveLength(2); expect(r[0].episodes).toEqual([1,2,3]); expect(r[0].people.A).toBeCloseTo(2/3); expect(r[0].pairs['A|B']).toBe(1);
});
