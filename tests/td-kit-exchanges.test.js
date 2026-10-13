// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import * as core from '../js/core.js';
import { factsFor } from '../js/td/script/facts.js';
import { kitBitScene, kitOf } from '../js/td/story/kits.js';
import { kitExchange, kitDigEntry } from '../js/td/story/kit-exchanges.js';

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const previous = { players: core.players, gs: core.gs, roster: globalThis.FRANCHISE_ROSTER };
afterEach(() => { core.setPlayers(previous.players); core.setGs(previous.gs); globalThis.FRANCHISE_ROSTER = previous.roster; });
function setup() {
  core.setPlayers(roster); globalThis.FRANCHISE_ROSTER = roster;
  core.setGs({ activePlayers: roster.map(p => p.name), tdStory: {}, bonds: {}, episodeHistory: [] });
}
it('writes different, connected responses to Aubrey for Gwen and Millie', () => {
  setup();
  const opening = kitOf('Aubrey').bit[1];
  const dry = kitExchange('Aubrey', 'Gwen', opening);
  const curious = kitExchange('Aubrey', 'Millie', opening);
  expect(dry.turns.map(t => t.say).join(' ')).toContain('clock');
  expect(curious.turns.map(t => t.say).join(' ')).toContain('objectively');
  expect(dry.turns).not.toEqual(curious.turns);
});
it('does not infer chart knowledge or attach a bundled scene to an edited kit', () => {
  setup();
  expect(kitExchange('Aubrey', 'Gwen', 'I like cake decorating.')).toBeNull();
  expect(kitExchange('Aubrey', 'Gwen', kitOf('Aubrey').bit[0])).toBeNull();
  globalThis.FRANCHISE_ROSTER = roster.map(p => p.name === 'Aubrey' ? { ...p, kit: { ...p.kit, thing: 'cake decorating' } } : p);
  expect(kitExchange('Aubrey', 'Gwen', kitOf('Aubrey').bit[1])).toBeNull();
});
it('allows an active third participant and reports consequences for that participation', () => {
  setup();
  core.gs.tdStory.kitUsed = { Aubrey: ['bit:0'] };
  const who = { a: 'Aubrey', b: 'Gwen', c: 'Julia' };
  const facts = { ...factsFor({ who, data: {} }, { ep: 2, phase: 'pre' }), venue: 'hosted-camp' };
  const w = kitBitScene(who.a, who.b, facts, { ep: 2, phase: 'pre', camp: 'A', n: 0, third: who.c });
  expect(w).toBeTruthy();
  expect(w.who).toEqual(who);
  expect(w.lines.some(l => l.by === 'Julia' && l.kind === 'say')).toBe(true);
  expect(w.fx.some(([a, b, delta]) => a === 'Aubrey' && b === 'Julia' && delta !== 0)).toBe(true);
  expect(w.text).not.toMatch(/\{[^}]+\}/);
  expect(JSON.parse(JSON.stringify(w)).lines).toEqual(w.lines);
});
it('keeps dig scenes about the target kit and refuses unrelated or edited kits', () => {
  setup();
  const entry = kitDigEntry('drama.dig', { a: 'Gwen', b: 'Julia', c: 'Millie' });
  expect(entry.turns.some(t => t.by === 'c' && t.say)).toBe(true);
  expect(entry.turns.map(t => t.say).join(' ')).toMatch(/camera|audience/);
  expect(kitDigEntry('drama.fight', { a: 'Gwen', b: 'Julia' })).toBeNull();
  expect(kitDigEntry('drama.dig', { a: 'Gwen', b: 'Owen' })).toBeNull();
});

import { writeStory } from '../js/td/story/write.js';
import { STORY_POOLS } from '../js/td/story/lines/index.js';
import { runOneSeason, seededRun } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';
import { tdCampScreen, tdStepTranscript } from '../js/vp-td-ep/steps.js';
import { _textCampPre } from '../js/text-backlog.js';
import { commit } from '../js/td/story/commit.js';

it('renders every authored partner/group branch and consumes only aired openings', () => {
  for (const a of ['Aubrey','Julia','Millie','Lake','Dunia','Gabby','Bruno','Gwen']) {
    for (const [b, third] of [['Gwen',null],['Millie',null],['Gabby',null],['Gwen','Julia']]) {
      if (a === b || a === third) continue;
      setup();
      const who = { a, b, ...(third ? { c: third } : {}) };
      const facts = { ...factsFor({ who, data: {} }, { ep: 2, phase: 'pre' }), venue: 'hosted-camp' };
      const w = kitBitScene(a,b,facts,{ ep:2, phase:'pre', camp:'Test', n:0, third });
      expect(w, a + '/' + b + '/' + third).toBeTruthy();
      expect(w.lineId, a).toContain('exchange:');
      expect(w.lines.filter(l => l.kind === 'say').length).toBeGreaterThanOrEqual(5);
      expect(w.text).not.toMatch(/\{[^}]+\}/);
      commit(w);
      expect(core.gs.tdStory.kitUsed[a].filter(x => x.startsWith('bit:'))).toHaveLength(1);
      const next = kitBitScene(a,b,facts,{ep:2,phase:'pre',camp:'Test',n:1});
      expect(next?.lineId).not.toBe(w.lineId);
    }
  }
});
it('keeps a custom kit opening, tease and comeback aligned after one opening was used elsewhere', () => {
  setup();
  const custom = { name:'Custom', archetype:'floater', stats:{}, kit:{thing:'painting',bit:['Opening zero','Opening one'],tease:['Tease zero','Tease one'],reply:['Reply zero','Reply one'],conf:['A thought.']} };
  globalThis.FRANCHISE_ROSTER = [...roster,custom]; core.setPlayers([...roster,custom]);
  core.gs.activePlayers.push('Custom'); core.gs.tdStory.kitUsed = { Custom:['bit:0'] };
  const who={a:'Custom',b:'Gwen'};
  const w=kitBitScene(who.a,who.b,{...factsFor({who,data:{}},{ep:2,phase:'pre'}),venue:'hosted-camp'},{ep:2,phase:'pre',camp:'A',n:0});
  expect(w.text).toContain('Opening one');expect(w.text).toContain('Tease one');expect(w.text).toContain('Reply one');
  expect(w.text).not.toContain('Tease zero');
});
it('renders every new fight outcome with the intended cast and no unresolved slots', () => {
  setup(); const who={a:'Julia',b:'Gwen',c:'Millie'};
  const facts={...factsFor({who,data:{}},{ep:2,phase:'pre'}),venue:'hosted-camp',third:true};
  for(const [pool,entries] of Object.entries(STORY_POOLS)) for(const entry of entries.filter(e=>e.id.startsWith('ndx.'))) {
    const ending=pool.split('.').at(-1);
    const w=writeStory('long.drama.fight',ending,who,{},facts,{ep:2,phase:'pre',camp:'A',n:0,entryIds:[entry.id],unique:false});
    expect(w,entry.id).toBeTruthy();expect(w.lineId).toBe(entry.id);expect(w.text).not.toMatch(/\{[^}]+\}/);
  }
});
it('airs richer scenes in real seasons, retains effects, and carries their speech into VP and text', () => {
  setup();
  const names=['Aubrey','Julia','Millie','Lake','Dunia','Gabby','Bruno','Gwen','Miriam','James','Oliwia','Ren','Ara','Bowie','Yul','Natalia'];
  const cast=names.map((name,i)=>({...roster.find(p=>p.name===name),tribe:i%2?'Bass':'Gophers'}));
  let count=0,groups=0;
  for(const seed of [1729,2026]) {
    const result=seededRun(()=>runOneSeason({setting:'hosted-camp'},16,cast),seed);
    expect(result.phase).toBe('complete');
    for(const ep of core.gs.episodeHistory) for(const camp of Object.keys(ep.campStory||{})) {
      const scenes=campFeed(ep,camp,'pre').filter(e=>e.lineId?.includes('exchange:'));
      if(!scenes.length)continue;
      const scr=tdCampScreen(ep,camp,'pre',ep.campAccess?.groups?.[camp]?.members||[],{setting:'hosted-camp'});
      const vp=tdStepTranscript(scr).map(l=>typeof l==='string'?l:JSON.stringify(l)).join(' ');
      const text=[];_textCampPre(ep,l=>text.push(l),()=>{});
      for(const scene of scenes) {
        count++;if(scene.players.length===3)groups++;
        expect(scene.effects?.length).toBe(scene.players.length===3?3:1);
        for(const line of scene.lines.filter(l=>l.kind==='say')) {
          expect(vp).toContain(line.text);expect(text.join(' ')).toContain(line.text);
        }
        expect(JSON.parse(JSON.stringify(scene)).lines).toEqual(scene.lines);
      }
    }
  }
  expect(count).toBeGreaterThan(3);expect(groups).toBeGreaterThan(0);
},60000);
