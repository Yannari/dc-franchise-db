import followupPools from '../js/td/story/lines/n-followups.js';
import fs from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { core, runOneSeason, seededRun } from './helpers/season-harness.js';
import { recordFollowups, followupScene } from '../js/td/story/followups.js';
import { airTdEpisode } from '../js/td/story/director.js';
import { writeStory } from '../js/td/story/write.js';
import { factsFor } from '../js/td/script/facts.js';
import { getBond } from '../js/bonds.js';
import { campFeed } from '../js/td/story/feed.js';
import { tdCampScreen, tdStepTranscript } from '../js/vp-td-ep/steps.js';
import { _textCampPre } from '../js/text-backlog.js';
const saved = { gs: core.gs, players: core.players };
afterEach(() => { core.setGs(saved.gs); core.setPlayers(saved.players); });
const cast = ['Gwen','Leshawna','Heather','Owen'];
function setup() { core.setPlayers(cast.map(name => ({ name, archetype: name === 'Heather' ? 'villain' : 'hero', stats: {} }))); core.setGs({ episode: 3, activePlayers: cast, bonds: {}, namedAlliances: [], showmances: [], episodeHistory: [], tdStory: {} }); }
function source(kind = 'friend.defend') { return { story: true, kind: 'long.' + kind, scene: { kind, who: { a: cast[0], b: cast[1], c: cast[2] } }, lines: [{ kind: 'say', by: cast[0], text: 'You do not get to talk to her like that.' }, {kind:'say',by:cast[1],text:'I can answer for myself.'}, {kind:'say',by:cast[2],text:'Then answer.'}] }; }
const record = (scene = source()) => recordFollowups({ num: 2 }, 'Bass', { pre: [], post: [scene] });
function due(members = cast, num = 3) { return followupScene({num}, 'Bass', members, 'pre', () => 0, writeStory, who => ({...factsFor({who,data:{}},{ep:num,phase:'pre'}),venue:'hosted-camp'})); }
it('follows an aired defense privately with the original defender and target', () => {
 setup(); record(); const item = due().item;
 expect(item.players).toEqual(['Leshawna','Gwen']);
 expect(item.text).toContain('You do not get to talk to her like that.');
 expect(item.scene.data.sourceEp).toBe(2); expect(item.fx.length).toBeGreaterThan(0);
 expect(due()).toBeNull();
});
it('requires the actual clash witness and skips absent participants', () => {
 setup(); record(source('drama.fight'));
 expect(due(['Gwen','Leshawna','Owen'])).toBeNull();
 expect(due().item.players).toEqual(['Gwen','Leshawna','Heather']);
});
it('does not manufacture a witness from a confessional or off-camera event', () => {
 setup(); const scene = source('drama.fight'); scene.lines[2].kind = 'conf'; record(scene);
 expect(due()).toBeNull();
});
it('waits until a later episode, expires old incidents, and survives save/load', () => {
 setup(); record(); expect(due(cast,2)).toBeNull();
 core.setGs(JSON.parse(JSON.stringify(core.gs))); expect(due()).toBeTruthy();
 setup(); record(); expect(due(cast,6)).toBeNull();
});
it('airs through the director with bond consequences and identical VP/backlog speech', () => {
 setup(); record(); const before = getBond('Gwen','Leshawna');
 const ep = {num:3,bondChanges:[],tribesAtStart:[{name:'Bass',members:cast}],campEvents:{Bass:{pre:[],post:[]}}};
 airTdEpisode(ep); const scene = campFeed(ep,'Bass','pre').find(s => s.kind === 'follow.defense');
 expect(scene).toBeTruthy(); expect(getBond('Gwen','Leshawna')).toBeGreaterThan(before);
 const vp = JSON.stringify(tdStepTranscript(tdCampScreen(ep,'Bass','pre',cast,{setting:'hosted-camp'})));
 const backlog = []; _textCampPre(ep,l => backlog.push(l),()=>{});
 for (const line of scene.lines.filter(l => l.kind === 'say')) { expect(vp).toContain(line.text); expect(backlog.join(' ')).toContain(line.text); }
 const state = JSON.stringify(core.gs); airTdEpisode(ep); expect(JSON.stringify(core.gs)).toBe(state);
});

it('renders every variant at every venue with its exact remembered line', () => {
 setup(); for (const venue of ['hosted-camp','survival-island','film-lot','carnival','world-tour']) for (const [key, entries] of Object.entries(followupPools)) for (const entry of entries) {
  core.gs.tdStory = {}; const who = {a:'Gwen',b:'Leshawna',c:'Heather'};
  const split = key.lastIndexOf('.'); const w = writeStory(key.slice(0,split),key.slice(split+1),who,{remark:'You can answer without insulting me.'},{...factsFor({who,data:{}},{ep:3,phase:'pre'}),third:true,venue},{ep:3,phase:'pre',camp:'Bass',entryIds:[entry.id],unique:false});
  expect(w,entry.id+venue).toBeTruthy(); expect(w.text).toContain('You can answer without insulting me.'); expect(w.text).not.toMatch(/\{[^}]+\}/);
  expect(new Set(w.lines.filter(l=>l.kind==='say').map(l=>l.by)).size).toBe(key.includes('clash')?3:2);
 }
});
it('reaches both follow-up families in played seasons with valid source speech', () => {
 const roster = JSON.parse(fs.readFileSync('franchise_roster.json','utf8')).players;
 const names = ['Gwen','Leshawna','Heather','Duncan','Courtney','Owen','Lindsay','Trent','Julia','Millie','Aubrey','Lake','Gabby','Bowie','Yul','Bruno'];
 const cast = names.map((name,i)=>({...roster.find(p=>p.name===name),tribe:i%2?'Bass':'Gophers'}));
 const kinds = new Set();
 for (const seed of [1729,2026,81]) {
  expect(seededRun(()=>runOneSeason({setting:'hosted-camp',romance:'enabled'},16,cast),seed).phase).toBe('complete');
  for (const ep of core.gs.episodeHistory) for (const [camp, blocks] of Object.entries(ep.campStory||{})) for (const scene of [...blocks.pre,...blocks.post].filter(s=>/^follow\./.test(s.kind||''))) {
   kinds.add(scene.kind); expect(scene.effects.length).toBeGreaterThan(0);
   const [sourceEp,sourceCamp,sourcePhase,sourceIndex] = JSON.parse(scene.scene.data.sourceId);
   const original = campFeed(core.gs.episodeHistory.find(e=>e.num===sourceEp),sourceCamp,sourcePhase)[sourceIndex];
   expect(original.lines.some(l=>l.kind==='say' && l.text===scene.scene.data.remark)).toBe(true);
   expect(sourceEp).toBeLessThan(ep.num); const members = (ep.tribesAtStart||[]).find(t=>t.name===camp)?.members || ep.activePlayers;
   if (members) for (const name of scene.players) expect(members).toContain(name);
  }
 }
 expect(kinds).toEqual(new Set(['follow.defense','follow.clash']));
},60000);
it('can follow a quiet defense heard directly by its target', () => {
 setup(); const scene = source(); scene.lines = scene.lines.slice(0,2); record(scene); expect(due()).toBeTruthy();
});
it('resolves aired references and respects coach visibility', () => {
 setup(); const scene = source('drama.fight');
 recordFollowups({num:2,campEvents:{Bass:{pre:[],post:[scene]}}},'Bass',{pre:[],post:[{ref:0}]}); expect(due()).toBeTruthy();
 setup(); const hidden = source('drama.fight'); hidden.lines[0].text = 'My vote is already decided.';
 recordFollowups({num:2,coachData:{Bass:{coaches:['Gwen']}}},'Bass',{pre:[],post:[hidden]}); expect(due()).toBeNull();
});
it('does not consume or record current follow-ups when rebuilding an older episode', () => {
 setup(); record(); core.gs.episode = 5; const before = JSON.stringify(core.gs.tdStory.followups);
 airTdEpisode({num:3,tribesAtStart:[{name:'Bass',members:cast}],campEvents:{Bass:{pre:[],post:[]}}});
 expect(JSON.stringify(core.gs.tdStory.followups)).toBe(before);
});
it('allows an actual day-one argument to be recalled on day two', () => {
 setup(); recordFollowups({num:1},'Bass',{pre:[],post:[source('drama.fight')]});
 const scene = followupScene({num:2},'Bass',cast,'pre',()=>0,(p,o,w,d,f,c)=>writeStory(p,o,w,d,f,{...c,entryIds:['nfu.cm4']}),who=>({...factsFor({who,data:{}},{ep:2,phase:'pre'}),venue:'hosted-camp'}));
 expect(scene).toBeTruthy();
});
