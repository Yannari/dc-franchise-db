// Recalculate the saved baseline without replaying seasons.
import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
const root=process.env.TD_PACING_OUT||'docs/superpowers/audits/2026-10-12-td-pacing';
const venues=['hosted-camp','survival-island','film-lot','carnival','world-tour'];
const read=(venue,file)=>{const data=fs.readFileSync(path.join(root,venue,file));return JSON.parse(file.endsWith('.gz')?gunzipSync(data):data);};
const comparisons=[];
for(const venue of venues){const traced=read(venue,'manifest.json'),plain=read(venue,'plain-fingerprints.json');
 for(const r of traced.runs){const p=plain.find(p=>p.id===r.id);const same=JSON.stringify(r.fingerprint)===JSON.stringify(p?.fingerprint);comparisons.push({run:r.id,same});if(!same)throw new Error('Observation changed output for '+r.id);}}
const days=venues.flatMap(v=>read(v,'days.json.gz')),candidates=venues.flatMap(v=>read(v,'candidates.json.gz'));
const dist=values=>{const a=[...values].sort((x,y)=>x-y);return {n:a.length,min:a[0],median:a[Math.floor(a.length*.5)],p90:a[Math.floor(a.length*.9)],max:a.at(-1),mean:a.reduce((s,x)=>s+x,0)/a.length};};
const summary={runs:comparisons.length,unchanged:comparisons.filter(x=>x.same).length,days:days.length,sceneCount:dist(days.map(d=>d.scenes)),spokenLines:dist(days.map(d=>d.spoken)),confessionalLines:dist(days.map(d=>d.confessionals)),above22:days.filter(d=>d.scenes>22).length,heavyRun:dist(days.map(d=>d.maxHeavyRun)),freshPairs:days.reduce((n,d)=>n+d.freshPairs,0),pairScenes:days.reduce((n,d)=>n+d.pairScenes,0),systems:{},romance:{},candidateReasons:{},selector:{}};
for(const v of venues){try{const sv=read(v,'summary.json');for(const [k,n] of Object.entries(sv.selector||{}))summary.selector[k]=(summary.selector[k]||0)+n;}catch{}}
for(const d of days)for(const [k,n] of Object.entries(d.systems))summary.systems[k]=(summary.systems[k]||0)+n;
for(const r of candidates){summary.candidateReasons[r.finalReason]=(summary.candidateReasons[r.finalReason]||0)+1;if(r.romance)summary.romance[r.finalReason]=(summary.romance[r.finalReason]||0)+1;}
fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(root,'observation-check.json'),JSON.stringify(comparisons,null,2));
console.log(JSON.stringify(summary,null,2));

const countBy=(a,f)=>a.reduce((o,x)=>(o[f(x)]=(o[f(x)]||0)+1,o),{});
const rolling=venues.flatMap(v=>read(v,'rolling-shares.json.gz'));
const opportunities=venues.flatMap(v=>read(v,'opportunities.json.gz'));
const peak=(field,filter=()=>true)=>rolling.filter(filter).flatMap(r=>Object.entries(r[field]).map(([name,share])=>({run:r.run,episodes:r.episodes,speakers:Object.keys(r.people).length,name,share}))).sort((a,b)=>b.share-a.share)[0];
const derived={
 postDay1:{fresh:days.filter(d=>d.ep>1).reduce((s,d)=>s+d.freshPairs,0),pairs:days.filter(d=>d.ep>1).reduce((s,d)=>s+d.pairScenes,0)},
 peaks:{person:peak('people'),pair:peak('pairs'),earlyPerson:peak('people',r=>r.episodes.at(-1)<=7),earlyPair:peak('pairs',r=>r.episodes.at(-1)<=7)},
 opportunities:countBy(opportunities,r=>r.family+':'+r.status),
 rawRomanceEnabled:countBy(candidates.filter(r=>r.rawRomance&&r.run.includes('_enabled_')),r=>r.finalReason),
 romanceDisabledAired:countBy(candidates.filter(r=>r.romance&&r.aired&&r.run.includes('_disabled_')),r=>r.kind),
 constructedCuts:countBy(candidates.filter(r=>r.proposed&&!r.aired),r=>r.system),
 byVenue:Object.fromEntries(venues.map(v=>[v,{scenes:dist(days.filter(d=>d.run.startsWith(v+'_')).map(d=>d.scenes)),spoken:dist(days.filter(d=>d.run.startsWith(v+'_')).map(d=>d.spoken))}]))
};
if(candidates.filter(r=>r.aired).length!==days.reduce((s,d)=>s+d.scenes,0))throw new Error('Aired candidate/day totals disagree');
fs.writeFileSync(path.join(root,'derived.json'),JSON.stringify(derived,null,2));
