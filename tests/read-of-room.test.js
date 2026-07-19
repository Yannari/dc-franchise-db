import { beforeEach, describe, expect, it } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { rpBuildReadOfRoom } from '../js/vp-screens.js';

describe('Read of the Room vote context', () => {
  beforeEach(() => seedGame([
    { name:'Alice', stats:{ strategic:8 } }, 'Bob', 'Carol', 'Dana', 'Eli', 'Fran', 'Gus', 'Hope',
  ], { isMerged:true }));

  it('uses portraits and keeps confirmed deals distinct from private preferences', () => {
    const ep = {
      num:7,
      intentionsSnapshot:{
        Alice:{ stage:'endgame', finalThree:['Alice','Bob'], preferredCore:['Carol'], targets:['Dana'], revenge:[], shield:null },
        Bob:{ stage:'adaptation', finalThree:['Bob'], preferredCore:['Alice'], targets:[], revenge:[], shield:null },
      },
      votePitches:[{ pitcher:'Alice', pitchTarget:'Dana' }],
      relationshipCausesPreVoteSnapshot:{},
      knowledgeSnapshot:{}, knowledgeEvents:[],
    };
    const html = rpBuildReadOfRoom(ep, ['Alice','Bob','Carol','Dana']);
    expect(html).toContain('assets/avatars/alice.png');
    expect(html).toContain('confirmed endgame deal with <strong>Bob</strong>');
    expect(html).toContain('privately wants to keep <strong>Carol</strong> close — no pact promised');
    expect(html).toContain('SHARED DEAL');
    expect(html).toContain('DRIVING');
    expect(html).toContain('BADGE DICTIONARY');
    expect(html).toContain('actively pitched a target this episode');
    expect(html).toContain('WORD SPREAD');
  });

  it('renders only the pre-vote directional relationship cause trail', () => {
    const ep = {
      num:8, intentionsSnapshot:{}, knowledgeSnapshot:{}, knowledgeEvents:[],
      relationshipCausesPreVoteSnapshot:{
        'Alice→Bob':[{ ep:8, dim:'trust', delta:-2.4, reason:'Bob excluded Alice from the plan' }],
        'Bob→Alice':[{ ep:7, dim:'resentment', delta:3, reason:'old history' }],
      },
      relationshipCausesSnapshot:{
        'Alice→Bob':[{ ep:8, dim:'fear', delta:5, reason:'post-vote betrayal spoiler' }],
      },
    };
    const html = rpBuildReadOfRoom(ep, ['Alice','Bob']);
    expect(html).toContain('TRUST ↓ 2.4');
    expect(html).toContain('Bob excluded Alice from the plan');
    expect(html).not.toContain('post-vote betrayal spoiler');
  });

  it('labels exposed targets and caps long intention lists behind disclosure', () => {
    const names = ['Alice','Bob','Carol','Dana','Eli','Fran','Gus','Hope'];
    const beliefs = Object.fromEntries(names.map(n => [n,{ confidence:.8 }]));
    const plans = Object.fromEntries(names.map((n,i) => [n,{ stage:'survival', finalThree:[n], preferredCore:[names[(i+1)%names.length]], targets:[], revenge:[] }]));
    const ep = { num:4, intentionsSnapshot:plans, relationshipCausesPreVoteSnapshot:{}, knowledgeEvents:[],
      knowledgeSnapshot:{ 'target:Alice':{ id:'target:Alice', type:'target', subject:'Alice', createdEp:4, beliefs } } };
    const html = rpBuildReadOfRoom(ep, names);
    expect(html).toContain('EXPOSED');
    expect(html).toContain('KNOWN BY 8');
    expect(html).toContain('<details class="rotr-more">');
    expect(html).toContain('Show 2 more signals');
  });
});
