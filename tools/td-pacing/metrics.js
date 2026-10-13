// Pure audit helpers. Labels describe scene metadata, not sentiment analysis.
export const HEAVY = /vote|tribal|pitch|scheme|betray|blame|fight|clash|explode|threat|jealous|breakup|wronged|grievance|witness|turn\.|guarded|tense|paranoi|meltdown|bottom|eliminat/;
export const LIGHT = /friend|bond|game|goof|joke|laugh|celebrat|banter|romance|showmance|kit|kindred|comedy|sunrise|meal|camp\./;
export function systemOf(s) {
 const k=s.kind||s.scene?.kind||s.type||'';
 if (/^(chm\.)?turn\./.test(k)) return 'turn';
 if (/^witness\.after/.test(k)) return 'witness-after';
 if (/^follow\./.test(k)) return 'follow-up';
 if (/^arc\.mentor/.test(k)) return 'mentor';
 if (/coach/i.test(k+' '+(s.type||'')+' '+(s.storyType||''))) return 'coach';
 if (/^story\.(morning|firstpair|chal|firstday)/.test(k)) return 'opener';
 if (/^kit\.|^kindred/.test(k)) return 'kit';
 if (/^run\./.test(k)) return 'running-gag';
 if (/^thr\./.test(k)) return 'thread';
 if (/^deep\.|^psy\./.test(k)) return 'confessional';
 if (/^cover\.|^aside\./.test(k)) return 'coverage';
 if (s.storyType==='vote'||/^(vp|vt|arc\.(warn|ally|plan|vote|spark))\./.test(k)) return 'vote';
 if (s.storyType==='arc') return 'arc';
 if (s.storyType==='challenge'||/^chm\./.test(k)) return 'challenge-chat';
 if (/^camp\.game|^story\.dayone/.test(k)) return 'camp-game';
 if (/^(morning|after|firstday|firstpair|arrival)\./.test(k)) return 'opener';
 return s.storyType==='cut'?'quick-cut':s.storyType||'engine';
}
export function sceneMeasure(s) {
 const lines=(s.lines||[]).filter(l=>l.by&&['say','conf'].includes(l.kind));
 const people={}; for(const l of lines) people[l.by]=(people[l.by]||0)+1;
 const say=lines.filter(l=>l.kind==='say'); const speakers=new Set(say.map(l=>l.by));
 const who=s.scene?.who||{}; const leads=[who.a,who.b].filter(n=>n&&speakers.has(n));
 const pair=leads.length===2&&leads[0]!==leads[1]?[...leads].sort().join('|'):null;
 const kind=s.kind||s.scene?.kind||s.type||'unknown';
 const label=kind+' '+(s.step||'')+' '+(s.storyType||'');
 return {kind,system:systemOf(s),spoken:say.length,confessionals:lines.length-say.length,people,pair,
  otherSpeakers:[...speakers].filter(n=>!leads.includes(n)),
  romance:/romance|showmance/.test(label),tone:HEAVY.test(label)?'H':LIGHT.test(label)?'L':'N',
  window:s.scene?.spot?.window||s.access?.windowId||null,spot:s.scene?.spot?.id||s.access?.locationId||null,chained:!!s.chained};
}
export function rhythm(tones) {
 let maxHeavyRun=0,run=0,transitions=0,comparable=0;
 for(let i=0;i<tones.length;i++){run=tones[i]==='H'?run+1:0;maxHeavyRun=Math.max(maxHeavyRun,run);
  if(i&&tones[i]!=='N'&&tones[i-1]!=='N'){comparable++;if(tones[i]!==tones[i-1])transitions++;}}
 return {maxHeavyRun,transitions,comparable};
}
export function rollingShares(scenes) {
 const episodes=[...new Set(scenes.map(s=>s.ep))].sort((a,b)=>a-b),out=[];
 for(let i=2;i<episodes.length;i++){const es=episodes.slice(i-2,i+1),rows=scenes.filter(s=>es.includes(s.ep));
  const people={},pairs={},appearances={};let turns=0,pairScenes=0;
  for(const s of rows){for(const [n,v] of Object.entries(s.people)){people[n]=(people[n]||0)+v;turns+=v;appearances[n]=(appearances[n]||0)+1;}
   if(s.pair){pairs[s.pair]=(pairs[s.pair]||0)+1;pairScenes++;}}
  out.push({episodes:es,scenes:rows.length,turns,pairScenes,people:Object.fromEntries(Object.entries(people).map(([n,v])=>[n,v/Math.max(1,turns)])),
   appearances:Object.fromEntries(Object.entries(appearances).map(([n,v])=>[n,v/rows.length])),pairs:Object.fromEntries(Object.entries(pairs).map(([n,v])=>[n,v/Math.max(1,pairScenes)]))});}
 return out;
}
