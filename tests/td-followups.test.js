import { STORY_POOLS } from '../js/td/story/lines/index.js';
import followupPools from '../js/td/story/lines/n-followups.js';
import fs from 'node:fs';
import { afterEach, expect, it } from 'vitest';
import { core, runOneSeason, seededRun } from './helpers/season-harness.js';
import { recordFollowups, followupScene } from '../js/td/story/followups.js';
import { airTdEpisode } from '../js/td/story/director.js';
import { writeStory } from '../js/td/story/write.js';
import { factsFor } from '../js/td/script/facts.js';
import { getBond, addBond } from '../js/bonds.js';
import { campFeed } from '../js/td/story/feed.js';
import { tdCampScreen, tdStepTranscript } from '../js/vp-td-ep/steps.js';
import { _textCampPre } from '../js/text-backlog.js';
import { commit } from '../js/td/story/commit.js';
const saved = { gs: core.gs, players: core.players };
afterEach(() => { core.setGs(saved.gs); core.setPlayers(saved.players); });
const cast = ['Gwen','Leshawna','Heather','Owen'];
function setup() { core.setPlayers(cast.map(name => ({ name, archetype: name === 'Heather' ? 'villain' : 'hero', stats: {} }))); core.setGs({ episode: 3, activePlayers: cast, bonds: {}, namedAlliances: [], showmances: [], episodeHistory: [], tdStory: {} }); }
function source(kind = 'friend.defend') { return { story: true, kind: 'long.' + kind, scene: { kind, who: { a: cast[0], b: cast[1], c: cast[2] } }, lines: [{ kind: 'say', by: cast[0], text: 'You do not get to talk to her like that.' }, {kind:'say',by:cast[1],text:'I can answer for myself.'}, {kind:'say',by:cast[2],text:'Then answer.'}] }; }
const record = (scene = source()) => recordFollowups({ num: 2 }, 'Bass', { pre: [], post: [scene] });
// (the director accepts what it airs: a scene built here is accepted the same way, commit.js)
function due(members = cast, num = 3) { const s = followupScene({num}, 'Bass', members, 'pre', () => 0, writeStory, who => ({...factsFor({who,data:{}},{ep:num,phase:'pre'}),venue:'hosted-camp'})); if (s) commit(s.item); return s; }
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
it.each(['friend.defend','romance.honeymoon'])('airs %s through the director with bond consequences and identical VP/backlog speech', kind => {
 setup();
 if (kind.startsWith('romance.')) {core.players.forEach(p => {p.sexuality='bi';}); core.gs.showmances=[{players:['Gwen','Leshawna'],phase:'honeymoon'}];}
 record(source(kind)); const before = getBond('Gwen','Leshawna');
 const ep = {num:3,bondChanges:[],tribesAtStart:[{name:'Bass',members:cast}],campEvents:{Bass:{pre:[],post:[]}}};
 airTdEpisode(ep); const scene = campFeed(ep,'Bass','pre').find(s => s.kind === (kind.startsWith('romance.') ? 'follow.romance' : 'follow.defense'));
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
  expect(new Set(w.lines.filter(l=>l.kind==='say').map(l=>l.by)).size).toBe(/clash|rivalry/.test(key)?3:2);
 }
});
it('reaches defense, clash, and romance follow-ups in played seasons with valid source speech', () => {
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
 expect(kinds.has('follow.defense')).toBe(true); expect(kinds.has('follow.clash')).toBe(true); expect(kinds.has('follow.romance')).toBe(true);
 expect([...kinds].every(k => ['follow.defense','follow.clash','follow.rivalry','follow.romance'].includes(k))).toBe(true);
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
 if (scene) commit(scene.item);
 expect(scene).toBeTruthy();
});

it('keeps obligation phrases and subject contractions grammatical across all story voices', () => {
 for (const entries of Object.values(STORY_POOLS)) for (const entry of entries) for (const turn of entry.turns) for (const text of [turn.say,turn.conf,...Object.values(turn.v||{})].filter(Boolean)) {
  expect(text,entry.id).not.toMatch(/\b(?:I|we|you|they)[’']ve to\b|\bboth of you[’']re\b|\b(?:can|could|would|should) we[’']ve\b/i);
 }
});

it('continues a witnessed rivalry only after another relationship change', () => {
 setup(); record(source('drama.fight')); const first = due().item;
 expect(first.scene.data.chapter).toBe(1);
 for (const [a,b,delta] of first.fx) addBond(a,b,delta);
 recordFollowups({num:3},'Bass',{pre:[first],post:[]});
 core.setGs(JSON.parse(JSON.stringify(core.gs)));
 expect(due(['Gwen','Leshawna','Owen'],4)).toBeNull();
 expect(due(cast,4)).toBeNull();
 // A later improvement is independent of the already-applied callback effects.
 core.gs.bonds['Gwen||Leshawna'] = 3;
 const second = due(cast,4)?.item;
 expect(second).toBeTruthy(); expect(second.scene.data.chapter).toBe(2);
 expect(second.scene.data.sourceEp).toBe(3);
 expect(first.lines.some(l => l.kind === 'say' && l.text === second.scene.data.remark)).toBe(true);
 expect(due(cast,5)).toBeNull();
});
it('remembers a mutual aired romance, without creating a new couple', () => {
 setup(); core.players.forEach(p => { p.sexuality = 'bi'; });
 core.gs.showmances = [{players:['Gwen','Leshawna'],phase:'honeymoon'}];
 record(source('romance.honeymoon')); const before = JSON.stringify(core.gs.showmances);
 const scene = due()?.item; expect(scene?.kind).toBe('follow.romance');
 expect(scene.text).toContain('You do not get to talk to her like that.');
 expect(scene.fx.length).toBeGreaterThan(0); expect(JSON.stringify(core.gs.showmances)).toBe(before);
});
it('does not turn one-sided confessionals or incompatible pairings into romance callbacks', () => {
 setup(); core.gs.showmances = [{players:['Gwen','Leshawna'],phase:'honeymoon'}];
 record(source('romance.honeymoon')); expect(due()).toBeNull();
 setup(); core.players.forEach(p => {p.sexuality='bi';}); core.gs.showmances = [{players:['Gwen','Leshawna'],phase:'honeymoon'}];
 const s = source('romance.honeymoon'); s.lines[1].kind='conf'; record(s); expect(due()).toBeNull();
});

it('uses the direction of a later change, not a still-positive bond, for romance tension', () => {
 setup(); core.players.forEach(p => {p.sexuality='bi';});
 core.gs.bonds['Gwen||Leshawna'] = 6;
 core.gs.showmances = [{players:['Gwen','Leshawna'],phase:'honeymoon'}];
 record(source('romance.honeymoon')); const first = due().item;
 for (const [a,b,delta] of first.fx) addBond(a,b,delta);
 recordFollowups({num:3},'Bass',{pre:[first],post:[]});
 expect(due(cast,4)).toBeNull(); addBond('Gwen','Leshawna',-2);
 const second = due(cast,4).item; expect(second.step).toBe('guarded');
 expect(second.scene.data.chapter).toBe(2); expect(second.players).toEqual(['Gwen','Leshawna']);
 recordFollowups({num:4},'Bass',{pre:[second],post:[]}); addBond('Gwen','Leshawna',2);
 expect(due(cast,5)).toBeNull();
});
it('drops romance callbacks when the couple breaks up or romance is disabled', () => {
 setup(); core.players.forEach(p => {p.sexuality='bi';});
 core.gs.showmances = [{players:['Gwen','Leshawna'],phase:'honeymoon'}];
 record(source('romance.honeymoon'));
 core.gs.showmances[0].phase = 'broken-up'; expect(due()).toBeNull();
 core.gs.showmances[0].phase = 'honeymoon';
 const previous = core.seasonConfig.romance;
 try { core.seasonConfig.romance = 'disabled'; expect(due()).toBeNull(); }
 finally {core.seasonConfig.romance = previous;}
 expect(due()).toBeTruthy();
});

it('does not continue a proposed callback that never made the final edit', () => {
 setup(); record(source('drama.fight')); expect(due()).toBeTruthy();
 addBond('Gwen','Leshawna',3); expect(due(cast,4)).toBeNull();
});
