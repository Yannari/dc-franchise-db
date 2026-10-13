// @vitest-environment jsdom
// Deliberate measurement tool: npm run audit:td-pacing (paired traced and plain runs).
import { it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { core, runOneSeason } from '../../tests/helpers/season-harness.js';
import { campFeed } from '../../js/td/story/feed.js';
import { sceneMeasure, rhythm, rollingShares } from './metrics.js';
const OUT=import.meta.env.MODE==='baseline-smoke'?path.join(os.tmpdir(),'td-pacing-smoke'):path.join(process.env.TD_PACING_OUT||'docs/superpowers/audits/2026-10-12-td-pacing',process.env.TD_PACING_VENUE||'unbatched');
const clone=x=>JSON.parse(JSON.stringify(x));
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const names=['Gwen','Leshawna','Heather','Duncan','Courtney','Owen','Lindsay','Trent','Julia','Millie','Aubrey','Lake','Gabby','Bowie','Yul','Bruno'];
const venues=['hosted-camp','survival-island','film-lot','carnival','world-tour'];
const seeds=(process.env.TD_PACING_SMOKE||import.meta.env.MODE==='baseline-smoke')?[1729]:[1729,2026];
const key=it=>it.ref!=null?'ref:'+it.ref:'scene:'+JSON.stringify([it.kind,it.lineId,it.scene?.who?.a||it.players?.[0],it.scene?.who?.b||it.players?.[1]]);
const raw=(ep,camp,phase)=>Array.isArray(ep.campEvents[camp])?(phase==='pre'?ep.campEvents[camp]:[]):ep.campEvents[camp]?.[phase]||[];
const books=b=>Object.fromEntries(['followups','turns','witness'].map(k=>[k,clone(b?.[k]||[])]));
const dist=values=>{const a=[...values].sort((x,y)=>x-y);return {n:a.length,min:a[0]||0,median:a[Math.floor(a.length*.5)]||0,p90:a[Math.floor(a.length*.9)]||0,max:a.at(-1)||0,mean:a.reduce((s,x)=>s+x,0)/Math.max(1,a.length)};};

it('captures a reproducible director baseline without changing production code',()=>{
 const progress=(s)=>fs.appendFileSync(path.join(os.tmpdir(),'td-pacing-'+import.meta.env.MODE+'-progress.log'),s+'\n');progress('starting');
 vi.setSystemTime(new Date('2026-10-12T12:00:00Z'));
 if(import.meta.env.MODE!=='baseline-smoke'&&!process.env.TD_PACING_VENUE)throw new Error('Use npm run audit:td-pacing for bounded-memory venue batches.');
 const initialConfig=clone(core.seasonConfig);
 const roster=JSON.parse(fs.readFileSync('franchise_roster.json','utf8')).players;
 const baseCast=names.map((name,i)=>({...clone(roster.find(p=>p.name===name)),tribe:i%2?'Bass':'Gophers'}));
 const coaches=['Alejandro','Izzy'].map((name,i)=>({...clone(roster.find(p=>p.name===name)),tribe:i?'Bass':'Gophers',isCoach:true}));
 const baseConfig={...initialConfig,format:'total-drama',tdEdit:'full',teams:2,mergeAt:10,finaleSize:3,finaleFormat:'traditional',jurySize:7,aftermath:'disabled',popularityEnabled:false,twistSchedule:[],coaches:'disabled',rescueIsland:'disabled'};
 const plain=import.meta.env.MODE==='baseline-plain';
 const report={revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fixedDate:'2026-10-12T12:00:00Z',seeds,baseConfig,cast:baseCast,coaches,runs:[]};
 const allSelector={};const allDays=[],allCandidates=[],allWindows=[],allPending=[],allOpportunities=[],transcripts=[],episodeTexts=[];
 for(const setting of ((process.env.TD_PACING_SMOKE||import.meta.env.MODE==='baseline-smoke')?venues.slice(0,1):venues.filter(v=>v===process.env.TD_PACING_VENUE)))for(const romance of ((process.env.TD_PACING_SMOKE||import.meta.env.MODE==='baseline-smoke')?['enabled']:['enabled','disabled']))for(const withCoaches of ((process.env.TD_PACING_SMOKE||import.meta.env.MODE==='baseline-smoke')?[false]:[false,true]))for(const seed of seeds){
  const id=[setting,romance,withCoaches?'coaches':'no-coaches',seed].join('_');
  progress(id+' before reset');
  localStorage.clear(); sessionStorage.clear(); window.gsCheckpoints={}; window._tvState={};
  core.setSeasonConfig(clone(baseConfig));
  const candidates=new Map(),pending=[],opportunities=[],sceneRows=[],runDays=[],runTranscripts=[];
  const address=(ep,camp,phase,k)=>JSON.stringify([ep.num,camp,phase,k]);
  const offer=(ep,camp,phase,item,extra={})=>{const k=address(ep,camp,phase,key(item));
   const ev=item.story?item:raw(ep,camp,phase)[item.ref]||item;
   if(!candidates.has(k))candidates.set(k,{run:id,ep:ep.num,camp,phase,key:key(item),...sceneMeasure(ev),proposed:false,mainDecision:null});
   if(extra.proposed){const m=sceneMeasure(ev);Object.assign(candidates.get(k),m,{proposedMeasure:m});}
   Object.assign(candidates.get(k),extra); return candidates.get(k);};
  globalThis.__tdPacing=plain?undefined:(stage,d)=>{
   if(stage==='start'||stage==='end'){pending.push({run:id,ep:d.ep.num,stage,books:books(d.books)});return;}
   if(stage==='eligible'){opportunities.push({run:id,ep:d.ep.num,camp:d.camp,phase:d.phase,family:d.family,kind:d.kind,pair:[d.who.a,d.who.b].sort().join('|'),setupId:d.setupId,sourceEp:d.sourceEp});return;}
   if(stage==='replacement'){offer(d.ep,d.camp,d.phase,d.old,{replaced:true});offer(d.ep,d.camp,d.phase,d.item,{proposed:true,insertion:'replacement'});return;}
   if(stage==='late'){for(const it of d.items)offer(d.ep,d.camp,d.phase,it,{proposed:true,insertion:'late'});return;}
   if(stage==='offer'){for(const x of d.items)offer(d.ep,d.camp,d.phase,x.item,{proposed:true,insertionLine:d.line});return;}
   if(stage==='rank'){
    for(const f of d.filed){const row=offer(d.ep,d.camp,d.phase,{ref:f.i});
     row.mainDecision=d.chosen.includes(f)?'selected':!d.ranked.includes(f)?'day-one-filter':!d.order.includes(f)?'coach-session-reservation':d.reasons.get(f)||'main-cap';
     row.rank=d.ranked.indexOf(f); row.mainType=f.line.type;}
    for(const [i,ev] of d.events.entries())if(ev&&/romance|showmance/i.test((ev.scene?.kind||'')+' '+ev.type)){
     const row=offer(d.ep,d.camp,d.phase,{ref:i});row.rawRomance=true;row.engineAiredFlag=ev.aired??null;
     if(!row.mainDecision)row.mainDecision='not-in-main-pool';}
    return;
   }
   if(stage==='camp'){
    const view={...d.ep,campStory:{[d.camp]:d.out}},day={run:id,ep:d.ep.num,camp:d.camp,merged:!!(d.ep.isMerge||core.gs.isMerged),members:d.members,scenes:0,spoken:0,confessionals:0,systems:{},freshPairs:0,pairScenes:0,sequence:[],blocks:0,phaseScenes:{}};
    const text=[];
    for(const phase of ['pre','post']){text.push('### '+phase);
     const feed=campFeed(view,d.camp,phase);
     day.phaseScenes[phase]=feed.length;
     // Resolve copied storyline refs through the same feed function; keys use original plan refs.
     for(const [i,it] of d.out[phase].entries()){
      const one=campFeed({...view,campStory:{[d.camp]:{[phase]:[it]}}},d.camp,phase)[0];
      const row=offer(d.ep,d.camp,phase,it,{finalPlan:true});
      if(!one){row.finalReason='coach-visibility-filter';continue;}
      row.aired=true;row.finalReason='aired';Object.assign(row,sceneMeasure(one));
     }
     for(const [i,s] of feed.entries()){const m={...sceneMeasure(s),ep:d.ep.num,camp:d.camp,phase};sceneRows.push(m);
      day.scenes++;day.spoken+=m.spoken;day.confessionals+=m.confessionals;day.systems[m.system]=(day.systems[m.system]||0)+1;day.sequence.push(m.tone);
      const prev=feed[i-1];const pm=prev&&sceneMeasure(prev);
      if(i===0||(!s.chained&&!(pm&&m.spot&&m.spot===pm.spot&&m.window===pm.window&&m.pair&&m.pair===pm.pair)))day.blocks++;
      text.push('\n'+(i+1)+'. '+m.kind+' ['+m.system+'; '+m.tone+'; '+(m.window||phase)+']');
      for(const l of s.lines||[])text.push(l.kind==='beat'?'('+l.text+')':(l.by||'?')+(l.kind==='conf'?' [confessional]':'')+': '+l.text);
     }
    }
    Object.assign(day,rhythm(day.sequence));runDays.push(day);runTranscripts.push({run:id,ep:d.ep.num,camp:d.camp,text:text.join('\n')});
   }
  };
  let state=seed>>>0,calls=0;const originalRandom=Math.random; Math.random=()=>{calls++;state=(1664525*state+1013904223)>>>0;return state/4294967296;};
  const config={setting,romance,coaches:withCoaches?'manual':'disabled',name:'Pacing baseline'};
  progress(id+' before simulation');
  let result;try{result=runOneSeason(config,16,clone(withCoaches?[...baseCast,...coaches]:baseCast));}finally{Math.random=originalRandom;}
  progress(id+' after simulation '+JSON.stringify(result));
  expect(result.phase,id).toBe('complete');
  const fingerprint={history:hash(core.gs.episodeHistory),bonds:hash(core.gs.bonds),story:hash(core.gs.tdStory),randomCalls:calls,winner:result.winner};
  progress(id+' after fingerprint '+JSON.stringify({calls,memory:process.memoryUsage().heapUsed}));
  if(!plain){
   const seen=new Set();for(const s of sceneRows){const day=runDays.find(d=>d.ep===s.ep&&d.camp===s.camp);if(s.pair){day.pairScenes++;if(!seen.has(s.pair)){day.freshPairs++;seen.add(s.pair);}}}
   for(const r of candidates.values())if(!r.finalReason)r.finalReason=r.replaced?'replaced':r.proposed?'offered-then-cut':r.mainDecision==='selected'?'selected-not-rendered':r.mainDecision||'not-selected';
   for(const o of opportunities){const duplicates=opportunities.filter(q=>q.ep===o.ep&&q.camp===o.camp&&q.phase===o.phase&&q.kind===o.kind&&q.pair===o.pair).length;const rows=[...candidates.values()].filter(r=>r.ep===o.ep&&r.camp===o.camp&&r.phase===o.phase&&r.kind===o.kind&&r.pair===o.pair);o.status=duplicates>1?'ambiguous-multiple-attempts':rows.some(r=>r.aired)?'aired':rows.some(r=>r.proposed)?'offered-then-cut':'writer-no-scene';}allOpportunities.push(...opportunities);
   episodeTexts.push(...core.gs.episodeHistory.map(ep=>({run:id,ep:ep.num,text:ep.summaryText||''})));
   // the director's own reason for every proposal (stage 3 onward; director.js selectScenes, ep.tdDirectorLog)
   for(const h of core.gs.episodeHistory)for(const day of Object.values(h.tdDirectorLog||{}))for(const r of [...(day.pre||[]),...(day.post||[])]){const [head,src,tier]=String(r).split('|');const k=src+'|'+tier+'|'+head;allSelector[k]=(allSelector[k]||0)+1;}
   allDays.push(...runDays);allCandidates.push(...candidates.values());allWindows.push(...rollingShares(sceneRows).map(w=>({run:id,...w})));allPending.push(...pending);transcripts.push(...runTranscripts);
  }
  report.runs.push({id,config,seed,withCoaches,result,fingerprint});
  console.log(id+' complete: '+runDays.length+' camp-days');
  vi.clearAllMocks();globalThis.gc?.();progress(id+' after collection '+process.memoryUsage().heapUsed);
 }
 delete globalThis.__tdPacing; vi.useRealTimers();
 fs.mkdirSync(OUT,{recursive:true});
 if(plain){fs.writeFileSync(path.join(OUT,'plain-fingerprints.json'),JSON.stringify(report.runs.map(({id,fingerprint})=>({id,fingerprint})),null,2));return;}
 const summary={runs:report.runs.length,days:allDays.length,sceneCount:dist(allDays.map(d=>d.scenes)),spokenLines:dist(allDays.map(d=>d.spoken)),confessionalLines:dist(allDays.map(d=>d.confessionals)),above22:allDays.filter(d=>d.scenes>22).length,
  heavyRun:dist(allDays.map(d=>d.maxHeavyRun)),freshPairs:allDays.reduce((n,d)=>n+d.freshPairs,0),pairScenes:allDays.reduce((n,d)=>n+d.pairScenes,0),systems:{},romance:{},candidateReasons:{},selector:allSelector};
 for(const d of allDays)for(const [k,n] of Object.entries(d.systems))summary.systems[k]=(summary.systems[k]||0)+n;
 for(const r of allCandidates){summary.candidateReasons[r.finalReason]=(summary.candidateReasons[r.finalReason]||0)+1;if(r.romance)summary.romance[r.finalReason]=(summary.romance[r.finalReason]||0)+1;}
 for(const [file,data] of Object.entries({'manifest.json':report,'summary.json':summary,'days.json':allDays,'candidates.json':allCandidates,'rolling-shares.json':allWindows,'pending.json':allPending,'opportunities.json':allOpportunities})){const content=JSON.stringify(data,null,2);fs.writeFileSync(path.join(OUT,file.endsWith('summary.json')||file.endsWith('manifest.json')?file:file+'.gz'),file.endsWith('summary.json')||file.endsWith('manifest.json')?content:gzipSync(content));}
 // Every camp scene and confessional in the selected days, without excerpting.
 const picks=[['longest',allDays.reduce((a,b)=>a.spoken+a.confessionals>b.spoken+b.confessionals?a:b)],['heaviest',allDays.reduce((a,b)=>a.maxHeavyRun>b.maxHeavyRun?a:b)],['quietest',allDays.filter(d=>d.ep>1&&d.members.length>=5).reduce((a,b)=>a.spoken<b.spoken?a:b)]];
 for(const [label,d] of picks){const t=transcripts.find(t=>t.run===d.run&&t.ep===d.ep&&t.camp===d.camp);fs.writeFileSync(path.join(OUT,label+'.md'),'# '+label+': '+d.run+' / episode '+d.ep+' / '+d.camp+'\n\n'+JSON.stringify(d)+'\n\n'+t.text+'\n');const full=episodeTexts.find(e=>e.run===d.run&&e.ep===d.ep);fs.writeFileSync(path.join(OUT,label+'-episode.txt'),full.text);}
 fs.writeFileSync(path.join(OUT,'transcripts.json.gz'),gzipSync(JSON.stringify(transcripts)));
 console.log(JSON.stringify(summary));
},600000);
