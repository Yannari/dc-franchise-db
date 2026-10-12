import {afterEach,expect,it} from 'vitest';
import {core} from './helpers/season-harness.js';
import {airTdEpisode} from '../js/td/story/director.js';
import {recordThreads,threadDue} from '../js/td/story/threads.js';
const saved={gs:core.gs,players:core.players};
afterEach(()=>{core.setGs(saved.gs);core.setPlayers(saved.players);});
function setup(){core.setPlayers(['Gwen','Trent','Heather','Owen'].map(name=>({name,stats:{},archetype:'hero'})));core.setGs({episode:1,bonds:{'Gwen||Trent':5},tdStory:{},episodeHistory:[]});}
const vote=()=>({num:1,eliminated:'Heather',votingLog:[{voter:'Gwen',voted:'Trent'},{voter:'Trent',voted:'Heather'},{voter:'Owen',voted:'Heather'}]});
const exposure=(kind='caught.face',target='Trent')=>({story:true,type:'betrayalReckoning',players:['Gwen',target],badgeText:'Caught Flipping',badgeClass:'red',scene:{kind,who:{a:'Gwen',b:target},data:{wrote:'Trent'}},lines:[{kind:'say',by:'Gwen',text:'I wrote your name.'},{kind:'say',by:target,text:'You voted for me.'},{kind:'say',by:'Gwen',text:'I did.'},{kind:'say',by:target,text:'Now I know.'}]});
function reveal(scene=exposure(),aired=true){recordThreads({num:2,campEvents:{Bass:{pre:[scene],post:[]}},campStory:{Bass:{pre:aired?[scene]:[],post:[]}}});}
it('does not turn a single secret vote into certain knowledge',()=>{setup();recordThreads(vote());expect(core.gs.tdStory.threads).toHaveLength(1);expect(threadDue({num:2},['Gwen','Trent'])).toBeNull();});
it('makes a grievance available after the victim hears a recorded exposure',()=>{setup();recordThreads(vote());reveal();expect(threadDue({num:3},['Gwen','Trent'])?.t.kind).toBe('grievance');});
it('does not learn from an off-camera exposure',()=>{setup();recordThreads(vote());reveal(exposure(),false);expect(threadDue({num:3},['Gwen','Trent'])).toBeNull();});
it('does not learn a secret flip from viewer-only confessionals',()=>{setup();recordThreads(vote());var scene=exposure('fallout.flip');scene.lines[0].kind='conf';reveal(scene);expect(threadDue({num:3},['Gwen','Trent'])).toBeNull();});
it('does not give the victim knowledge from another camper confronting the voter',()=>{setup();recordThreads(vote());reveal(exposure('caught.face','Owen'));expect(threadDue({num:3},['Gwen','Trent'])).toBeNull();});
it('requires both participants to speak in the exposure',()=>{setup();recordThreads(vote());var scene=exposure();scene.lines.filter(l=>l.by==='Trent').forEach(l=>l.kind='conf');reveal(scene);expect(threadDue({num:3},['Gwen','Trent'])).toBeNull();});
it('does not trust legacy count-based knowledge after loading an older save',()=>{setup();core.gs.tdStory.threads=[{kind:'grievance',a:'Trent',b:'Gwen',ep:1,last:1,stage:0,known:true}];expect(threadDue({num:2},['Gwen','Trent'])).toBeNull();});
it('preserves actual disclosure knowledge through serialization',()=>{setup();recordThreads(vote());reveal();core.setGs(JSON.parse(JSON.stringify(core.gs)));expect(threadDue({num:3},['Gwen','Trent'])?.t.kind).toBe('grievance');});

it('does not learn disclosures while rebuilding a historical episode',()=>{setup();recordThreads(vote());core.gs.episode=5;core.gs.episodeHistory=[vote()];core.gs.activePlayers=['Gwen','Trent','Heather','Owen'];core.gs.namedAlliances=[];core.gs.showmances=[];var before=JSON.stringify(core.gs.tdStory.threads);airTdEpisode({num:2,tribesAtStart:[{name:'Bass',members:core.gs.activePlayers}],campEvents:{Bass:{pre:[exposure()],post:[]}}});expect(JSON.stringify(core.gs.tdStory.threads)).toBe(before);});

it('does not use a disclosure before the episode that aired it has finished',()=>{setup();recordThreads(vote());reveal();expect(threadDue({num:2},['Gwen','Trent'])).toBeNull();});

it('can learn a later exposed vote even when an earlier vote by the same person stayed secret',()=>{setup();recordThreads(vote());recordThreads({...vote(),num:2});var scene=exposure();recordThreads({num:3,campStory:{Bass:{pre:[scene],post:[]}}});var due=threadDue({num:4},['Gwen','Trent']);expect(due?.t.ep).toBe(2);});

it('does not consume a known grievance while rebuilding a historical episode',()=>{setup();recordThreads(vote());reveal();core.gs.episode=5;core.gs.episodeHistory=[vote()];core.gs.activePlayers=['Gwen','Trent','Heather','Owen'];core.gs.namedAlliances=[];core.gs.showmances=[];var before=JSON.stringify(core.gs.tdStory.threads);airTdEpisode({num:3,tribesAtStart:[{name:'Bass',members:core.gs.activePlayers}],campEvents:{Bass:{pre:[],post:[]}}});expect(JSON.stringify(core.gs.tdStory.threads)).toBe(before);});

it('airs a disclosed grievance on the live episode and consumes its chapter once',()=>{setup();recordThreads(vote());reveal();core.gs.episode=3;core.gs.episodeHistory=[vote()];core.gs.activePlayers=['Gwen','Trent','Heather','Owen'];core.gs.namedAlliances=[];core.gs.showmances=[];var ep={num:3,bondChanges:[],tribesAtStart:[{name:'Bass',members:core.gs.activePlayers}],campEvents:{Bass:{pre:[],post:[]}}};airTdEpisode(ep);expect(ep.campStory.Bass.pre.some(s=>s.kind==='thr.grievance.1')).toBe(true);expect(core.gs.tdStory.threads[0].stage).toBe(1);var before=JSON.stringify(core.gs.tdStory.threads);airTdEpisode(ep);expect(JSON.stringify(core.gs.tdStory.threads)).toBe(before);});
