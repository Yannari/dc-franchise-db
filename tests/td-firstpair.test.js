// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { STORY_POOLS } from '../js/td/story/lines/index.js';
import { voiced, VOICE_TAGS } from '../js/td/story/voice.js';
import { FAMILY } from '../js/td/story/voice-family.js';
import * as core from '../js/core.js';
const families = ['sharp', 'dry', 'loud', 'soft', 'odd'];
const original = core.players;
afterEach(() => core.setPlayers(original));
for (const kind of ['clicked', 'clashed']) describe('day-one ' + kind, () => {
  it('has twelve complete situations with two confessionals and voiced dialogue', () => {
    const pool = STORY_POOLS['story.firstpair.' + kind];
    expect(pool.length).toBeGreaterThanOrEqual(12);
    for (const e of pool) {
      expect(e.turns.length, e.id).toBeGreaterThanOrEqual(10);
      expect(e.turns.length, e.id).toBeLessThanOrEqual(14);
      expect(e.turns.filter(t => t.conf).map(t => t.by).sort(), e.id).toEqual(['a','b']);
      for (const t of e.turns) {
        if (t.say || t.conf) for (const family of families) expect(t.v?.[family], e.id + ':' + family).toBeTruthy();
        for (const key of Object.keys(t.v || {})) expect([...VOICE_TAGS, ...families]).toContain(key);
        for (const line of [t.say,t.conf,t.beat,...Object.values(t.v || {})].filter(Boolean))
          for (const m of line.matchAll(/{([^}]+)}/g)) expect(/^(a|b)(.(sub|obj|pos|posAdj|ref|Sub|Obj|PosAdj|thing))?$|^(here|bed)$/.test(m[1]), e.id + ': ' + m[1]).toBe(true);
      }
    }
  });
});
it('uses the strongest tag family, while exact tags win and rejected variants fall through', () => {
  core.setPlayers([{name:'FamilyProbe',archetype:'hero',voiceTags:['earnest','quiet'],stats:{}}]);
  const t = {say:'Neutral',v:{soft:'Open',dry:'Quiet',earnest:'Exact'}};
  expect(voiced(t,'FamilyProbe')).toBe('Exact');
  expect(voiced({...t,v:{soft:'Open',dry:'Quiet'}},'FamilyProbe')).toBe('Open');
  expect(voiced(t,'FamilyProbe',false,x=>x!=='Exact')).toBe('Open');
});
it('keeps loud-family variants hushed and hard voices out of age variants', () => {
  core.setPlayers([{name:'HushProbe',archetype:'hothead',voiceTags:['competitive'],age:11,stats:{}}]);
  expect(voiced({say:'Neutral',v:{loud:'Shouting',kid:'Child'}},'HushProbe',true)).toBe('Neutral');
});

import * as kits from '../js/td/story/kits.js';
import { factsFor } from '../js/td/script/facts.js';
import { writeStory } from '../js/td/story/write.js';
import { runOneSeason, seededRun } from './helpers/season-harness.js';
import fs from 'node:fs';
const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const pairFacts = (a,b,extra={}) => ({...factsFor({who:{a,b},data:{}},{ep:1,phase:'pre'}),venue:'hosted-camp',...extra});
it('exposes kit presence without introducing kit scene writers into the facts dependency', () => {
 core.setPlayers(roster); core.setGs({activePlayers:roster.map(p=>p.name)});
 expect(pairFacts('Gwen','Owen')).toMatchObject({kitA:true,kitB:false});
});
it('opens a first-day kit scene in the character own material and spends it only on success', () => {
 core.setPlayers(roster); core.setGs({activePlayers:roster.map(p=>p.name),tdStory:{}});
 expect(kits.kitFirstPairScene).toBeTypeOf('function');
 const w = kits.kitFirstPairScene('Gwen','Owen','clicked',pairFacts('Gwen','Owen'),{ep:1,phase:'pre',camp:'A',n:0});
 expect(w).toBeTruthy();
 expect(w.lines.some(l=>l.by==='Gwen' && kits.kitOf('Gwen').bit.includes(l.text))).toBe(true);
 expect(core.gs.tdStory.kitUsed.Gwen.some(x=>x.startsWith('bit:'))).toBe(true);
 expect(w.lines.filter(l=>l.kind==='conf').map(l=>l.by).sort()).toEqual(['Gwen','Owen']);
});
for (const kind of ['clicked','clashed']) it('has six distinct '+kind+' group situations with voiced participation from every seat', () => {
 const entries=STORY_POOLS['story.firstgroup.'+kind];
 expect(entries.length).toBeGreaterThanOrEqual(6);
 core.setPlayers(roster);
 for(const entry of entries) {
  for(const role of ['a','b','c','d']) expect(entry.turns.some(t=>t.by===role && t.say),entry.id+role).toBe(true);
  for(const t of entry.turns) if(t.say||t.conf) for(const f of families) expect(t.v[f],entry.id+f).toBeTruthy();
  expect(entry.turns.length).toBeGreaterThanOrEqual(10);
  expect(entry.turns.length).toBeLessThanOrEqual(14);
 }
});

import { beforeAll } from 'vitest';
import { writeFirstImpression, castFirstImpression } from '../js/td/story/first-impressions.js';
import { addBond } from '../js/bonds.js';
const resetCast = names => {
 const cast = names.map(n=>roster.find(p=>p.name===n));
 core.setPlayers(cast); core.setGs({activePlayers:names,tdStory:{},bonds:{},episodeHistory:[]});
 core.setSeasonConfig({...core.seasonConfig,romance:'disabled'});
 return cast;
};
it('chooses a fitting role orientation instead of making a hero give the villain speech',()=>{
 resetCast(['Ashley','Heather']);
 const result=writeFirstImpression({a:'Ashley',b:'Heather'},['Ashley','Heather'],'clashed',
   {ep:1,camp:'Test',phase:'post',venue:'hosted-camp',data:{bed:'bunk'},n:3});
 expect(result).toBeTruthy();
 if(result.w.lineId==='fp2.boss'||result.w.lineId==='fp2.suspicious'||result.w.lineId==='fp2.fake-nice')
   expect(result.who.a).toBe('Heather');
});
it('supports pair anchors, growing groups and whole-group selection using only word randomness',()=>{
 const names=['Heather','Noah','Owen','Gwen','Bridgette','Duncan'];
 resetCast(names);
 const modes=new Set();
 for(let n=0;n<60;n++){
   const cast=castFirstImpression({a:'Heather',b:'Noah'},names,'clashed',{ep:1,camp:'A',n});
   modes.add(cast.mode);
   expect(new Set(cast.names).size).toBe(cast.names.length);
   if(cast.mode==='anchor-group') expect(cast.names).toEqual(expect.arrayContaining(['Heather','Noah']));
 }
 expect([...modes].sort()).toEqual(['anchor-group','pair','whole-group']);
});
it('never spends more than one kit per team and never repeats a first-impression line',()=>{
 const names=['Gwen','Owen','Heather','Noah'];
 resetCast(names);
 const lines=[];
 for(const [n,kind] of ['clicked','clashed'].entries()){
   const result=writeFirstImpression({a:'Gwen',b:'Owen'},names,kind,{ep:1,camp:'A',phase:kind==='clicked'?'pre':'post',venue:'hosted-camp',data:{bed:'bunk'},n});
   expect(result).toBeTruthy();
   lines.push(...result.w.lines.map(l=>l.text));
 }
 expect(core.gs.tdStory.firstImpressionKitTeams).toEqual(['A']);
 expect(new Set(lines).size).toBe(lines.length);
});

describe('twenty real-roster seasons',()=>{
 let scenes=[],perSeason=[],uses={},eligible=0,kitted=0;
 beforeAll(()=>{
  globalThis.FRANCHISE_ROSTER=roster;
  const venues=['hosted-camp','survival-island','film-lot','world-tour','carnival'];
  for(let season=0;season<20;season++){
   seededRun(()=>{
    const cast=[...roster].map(p=>({p,r:Math.random()})).sort((a,b)=>a.r-b.r).slice(0,16)
      .map(({p},i)=>({...p,tribe:i%2?'Bass':'Gophers'}));
    runOneSeason({setting:venues[season%venues.length],romance:season%2?'enabled':'disabled',name:'First impressions audit '+season},16,cast);
   },91010+season*37);
   const ep=core.gs.episodeHistory.find(e=>e.num===1);
   const aired=Object.values(ep.campStory||{}).flatMap(block=>[...(block.pre||[]),...(block.post||[])])
     .filter(item=>item.kind==='story.firstpair');
   perSeason.push(aired);
   for(const s of aired){
    scenes.push({season,...s});
    uses[s.lineId]=(uses[s.lineId]||0)+1;
    if(s.players.some(kits.hasKit)){eligible++;if(s.kit)kitted++;}
   }
  }
  if(process.env.TD_FIRSTPAIR_AUDIT)fs.writeFileSync(process.env.TD_FIRSTPAIR_AUDIT,JSON.stringify({uses,eligible,kitted,scenes},null,2));
 },300000);
 it('airs substantial variety, with no entry over one eighth of all slots',()=>{
  expect(scenes.length).toBeGreaterThanOrEqual(60);
  for(const [id,count] of Object.entries(uses))expect(count/scenes.length,id+': '+count+'/'+scenes.length).toBeLessThanOrEqual(0.125);
 });
 it('airs both group casting modes as well as pairs',()=>{
  const modes=new Set(scenes.map(s=>s.firstImpressionMode));
  expect([...modes].sort()).toEqual(['anchor-group','pair','whole-group']);
  expect(scenes.some(s=>s.players.length===4)).toBe(true);
 });
 it('has no repeated line or entry within a season',()=>{
  for(const aired of perSeason){
   const lines=aired.flatMap(s=>s.lines.map(l=>l.text));
   expect(lines.filter((l,i)=>lines.indexOf(l)!==i)).toEqual([]);
   expect(new Set(aired.map(s=>s.lineId)).size).toBe(aired.length);
  }
 });
 it('seats every speaker and gives every seated member spoken dialogue',()=>{
  for(const scene of scenes){
   for(const l of scene.lines)if(l.by)expect(scene.players,scene.lineId+': '+l.by).toContain(l.by);
   for(const p of scene.players)expect(scene.lines.some(l=>l.by===p&&l.kind==='say'),scene.lineId+': '+p).toBe(true);
  }
 });
 it('uses kit material in at least forty percent of eligible scenes',()=>{
  expect(eligible).toBeGreaterThan(0);
  expect(kitted/eligible,kitted+'/'+eligible).toBeGreaterThanOrEqual(0.4);
 });
 it('gives the new social scenes real relationship consequences',()=>{
  expect(scenes.every(s=>s.effects?.length>0)).toBe(true);
 });
 it('never has a nice archetype threaten or scheme',()=>{
  const nice=new Set(['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat']);
  const threat=/get rid of|people who help me|first ones I want gone|I'll make.*pay|I'll get.*out|use.*against|get.*voted out/i;
  for(const s of scenes)for(const l of s.lines)if(l.by&&nice.has(roster.find(p=>p.name===l.by)?.archetype))
    expect(threat.test(l.text),l.by+': '+l.text).toBe(false);
 });
});

it('does not introduce an overnight history when opening Miriam on day one',()=>{
 resetCast(['Miriam','Kitty']);
 const w=kits.kitFirstPairScene('Miriam','Kitty','clicked',pairFacts('Miriam','Kitty'),{ep:1,camp:'A',phase:'pre'});
 expect(w).toBeTruthy();
 expect(w.text).not.toMatch(/snores|awake since five|at every meal/i);
});
it('keeps a kit tease with its matching reply before a clash develops',()=>{
 resetCast(['Felipe','Noah']);
 const w=kits.kitFirstPairScene('Felipe','Noah','clashed',pairFacts('Felipe','Noah'),{ep:1,camp:'A',phase:'post'});
 expect(w).toBeTruthy();
 const k=kits.kitOf('Felipe');
 const i=k.bit.findIndex(x=>w.lines.some(l=>l.text===x));
 expect(i).toBeGreaterThanOrEqual(0);
 expect(w.lines.some(l=>l.by==='Felipe'&&l.text===k.reply[i])).toBe(true);
});
