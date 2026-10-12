// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import * as core from '../js/core.js';
import { STORY_POOLS } from '../js/td/story/lines/index.js';
import social from '../js/td/story/lines/n-social-exchanges.js';
import { writeStory } from '../js/td/story/write.js';
import { factsFor } from '../js/td/script/facts.js';
import { kitRomanceEntry } from '../js/td/story/kit-exchanges.js';
import { kitRomanceScene, kitCallbackScene } from '../js/td/story/kits.js';
import { runOneSeason, seededRun } from './helpers/season-harness.js';
import { airTdEpisode } from '../js/td/story/director.js';
import { campFeed } from '../js/td/story/feed.js';
import { tdCampScreen, tdStepTranscript } from '../js/vp-td-ep/steps.js';
import { _textCampPre, _textCampPost } from '../js/text-backlog.js';
const roster=JSON.parse(fs.readFileSync('franchise_roster.json','utf8')).players;
const saved={players:core.players,gs:core.gs,roster:globalThis.FRANCHISE_ROSTER};
afterEach(()=>{core.setPlayers(saved.players);core.setGs(saved.gs);globalThis.FRANCHISE_ROSTER=saved.roster;});
function setup(){core.setPlayers(roster);globalThis.FRANCHISE_ROSTER=roster;core.setGs({activePlayers:roster.map(p=>p.name),episodeHistory:[],tdStory:{},bonds:{}});}
it('renders every new social scene at every venue with only its actual participants',()=>{
 setup();const who={a:'Julia',b:'Gwen',c:'Millie',d:'Aubrey'};
 for(const venue of ['hosted-camp','survival-island','film-lot','carnival','world-tour'])for(const [key,entries]of Object.entries(social))for(const entry of entries){
  core.gs.tdStory={};const split=key.lastIndexOf('.');const facts={...factsFor({who,data:{}},{ep:4,phase:'post'}),venue,third:true,merged:true};
  const w=writeStory(key.slice(0,split),key.slice(split+1),who,{},facts,{ep:4,phase:'post',camp:'Test',n:0,entryIds:[entry.id],unique:false});
  expect(w,venue+'/'+entry.id).toBeTruthy();expect(w.lineId).toBe(entry.id);expect(w.text).not.toMatch(/\{[^}]+\}/);
  for(const line of w.lines.filter(l=>l.by))expect(Object.values(who)).toContain(line.by);
  expect(JSON.parse(JSON.stringify(w)).lines).toEqual(w.lines);
 }
});
it('requires real group participants rather than dropping half of the conversation',()=>{
 setup();const who={a:'Julia',b:'Gwen'};const facts={...factsFor({who,data:{}},{ep:4,phase:'post'}),venue:'hosted-camp'};
 const groups=Object.values(social).flat().filter(e=>e.turns.some(t=>t.by==='d'));
 for(const entry of groups){const key=Object.keys(STORY_POOLS).find(k=>STORY_POOLS[k].some(e=>e.id===entry.id));const split=key.lastIndexOf('.');expect(writeStory(key.slice(0,split),key.slice(split+1),who,{},facts,{ep:4,phase:'post',camp:'A',entryIds:[entry.id],unique:false})).toBeNull();}
});
it('uses only unchanged kit topics for romance, and writes each authored exchange once',()=>{
 setup();for(const name of ['Aubrey','Millie','Lake','Bruno']){
  core.gs.tdStory={};const who={a:name,b:'Gwen'};const facts={...factsFor({who,data:{}},{ep:4,phase:'pre'}),venue:'hosted-camp'};
  expect(kitRomanceEntry('romance.flirt','any',who),name).toBeTruthy();
  const w=kitRomanceScene('romance.flirt','any',who,{},facts,{ep:4,phase:'pre',camp:'A',n:0});expect(w,name).toBeTruthy();expect(w.text).not.toMatch(/\{[^}]+\}/);
  expect(kitRomanceScene('romance.flirt','any',who,{},facts,{ep:4,phase:'pre',camp:'A',n:1})).toBeNull();
  globalThis.FRANCHISE_ROSTER=roster.map(p=>p.name===name?{...p,kit:{thing:'astronomy',bit:['I study stars.'],tease:['Really?'],reply:['Yes.']}}:p);
  expect(kitRomanceEntry('romance.flirt','any',who)).toBeNull();globalThis.FRANCHISE_ROSTER=roster;
 }
 expect(kitRomanceEntry('romance.jealous','any',{a:'Aubrey',b:'Gwen'})).toBeNull();
});
it('answers callback predictions as predictions instead of inventing earlier counts',()=>{
 setup();for(let n=0;n<6;n++){
 core.gs.tdStory={kitUsed:{Aubrey:['bit:0',...Array.from({length:n},(_,i)=>'call:'+i)]}};
 const who={a:'Julia',b:'Gwen',c:'Aubrey'};const facts={...factsFor({who,data:{}},{ep:4,phase:'pre'}),venue:'hosted-camp'};
 const w=kitCallbackScene(who.a,who.b,who.c,facts,{ep:4,phase:'pre',camp:'A',n});expect(w,n.toString()).toBeTruthy();expect(w.text).not.toMatch(/Before breakfast|double figures|Only four times|Three times|Twice\./);
 }
});
it('airs the additions in real seasons without inventing off-camp speakers',()=>{
 const names=['Aubrey','Julia','Millie','Lake','Dunia','Gabby','Bruno','Gwen','Miriam','James','Oliwia','Ren','Ara','Bowie','Yul','Natalia'];const cast=names.map((name,i)=>({...roster.find(p=>p.name===name),tribe:i%2?'Bass':'Gophers'}));let aired=0,romance=0,groups=0,groupRomance=0;
 for(const seed of [81,2027,1729,2026,99,123]){setup();expect(seededRun(()=>runOneSeason({setting:'hosted-camp',romance:'enabled'},16,cast),seed).phase).toBe('complete');
 for(const ep of core.gs.episodeHistory)for(const camp of Object.keys(ep.campStory||{}))for(const phase of ['pre','post'])for(const scene of campFeed(ep,camp,phase).filter(s=>s.lineId?.startsWith('nrx.')||s.lineId?.startsWith('kit-romance:'))){aired++;if(scene.kind.includes('romance'))romance++;
 const speakers=new Set(scene.lines.filter(l=>l.kind==='say').map(l=>l.by));
 if(scene.kind.includes('romance')&&speakers.size>=3){groupRomance++;expect(scene.effects?.length).toBeGreaterThanOrEqual(2);}
 const screen=tdCampScreen(ep,camp,phase,ep.campAccess?.groups?.[camp]?.members||[],{setting:'hosted-camp'});
 const vp=tdStepTranscript(screen).map(l=>typeof l==='string'?l:JSON.stringify(l)).join(' ');const backlog=[];
 (phase==='pre'?_textCampPre:_textCampPost)(ep,l=>backlog.push(l),()=>{});
 for(const line of scene.lines.filter(l=>l.kind==='say')){expect(vp).toContain(line.text);expect(backlog.join(' ')).toContain(line.text);}
 if(new Set(scene.lines.filter(l=>l.kind==='say').map(l=>l.by)).size>=3)groups++;for(const line of scene.lines.filter(l=>l.by))expect(scene.players).toContain(line.by);expect(JSON.parse(JSON.stringify(scene)).lines).toEqual(scene.lines);}
 }
 expect(aired).toBeGreaterThan(0);expect(romance).toBeGreaterThan(0);expect(groups).toBeGreaterThan(0);
},60000);

it('keeps auxiliary contractions fluent in the rewritten exchanges',()=>{
 expect(fs.readFileSync('js/td/script/lines/isle-group.js','utf8')).not.toMatch(/\b(?:I|we|you|they)'ve to\b|\b(?:can|could|would|should) we've\b/i);
 for(const entries of Object.values(STORY_POOLS))for(const e of entries.filter(e=>/^(nrx|nbw)\./.test(e.id)))for(const t of e.turns)for(const text of [t.say,t.conf,...Object.values(t.v||{})].filter(Boolean))expect(text,e.id).not.toMatch(/\b(?:I|we|you|they)'ve to\b|\b(?:can|could|would|should) we've\b/i);
});

it('allows a same-camp friend to join established-couple downtime with relationship effects',()=>{
 setup();core.setGs({episode:3,activePlayers:['Gwen','Trent','Owen'],bonds:{},namedAlliances:[],showmances:[{players:['Gwen','Trent'],phase:'honeymoon'}],episodeHistory:[],tdStory:{}});
 const ep={num:3,tribesAtStart:[{name:'Bass',members:['Gwen','Trent','Owen']}],campEvents:{Bass:{pre:[],post:[{type:'showmanceHoneymoon',players:['Gwen','Trent'],text:'Gwen and Trent sit together.',scene:{kind:'romance.honeymoon',who:{a:'Gwen',b:'Trent'},data:{}}}]}}};
 airTdEpisode(ep);const scene=campFeed(ep,'Bass','post').find(s=>s.lineId==='nrx.honey1');
 expect(scene).toBeTruthy();expect(new Set(scene.lines.filter(l=>l.kind==='say').map(l=>l.by)).size).toBe(3);expect(scene.effects?.length).toBeGreaterThanOrEqual(2);for(const line of scene.lines.filter(l=>l.by))expect(scene.players).toContain(line.by);
});
