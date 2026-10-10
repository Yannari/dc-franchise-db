// Day-one casting and writing. Uses only the word RNG; simulation outcomes do not move.
import { gs, seasonConfig } from '../../core.js';
import { getBond } from '../../bonds.js';
import { romanticCompat } from '../../players.js';
import { factsFor } from '../script/facts.js';
import { salt } from '../script/write.js';
import { stableRng } from '../../script/rng.js';
import { voiceOf } from './voice.js';
import { STORY_POOLS } from './lines/index.js';
import { writeStory } from './write.js';
import { hasKit, kitFirstPairScene } from './kits.js';

const stranger = (a,b,ctx) => !ctx.history || ctx.history(a,b).facts.hist === 'none';
const pairs = names => names.flatMap((a,i)=>names.slice(i+1).map(b=>[a,b]));
const score = names => {const bonds=pairs(names);return bonds.reduce((sum,[a,b])=>sum+getBond(a,b),0)/bonds.length;};
const ranked = (names,kind) => names.sort((a,b)=>(kind==='clicked' ? -1 : 1)*(score(a)-score(b)));
const shuffled = (list,rng) => list.map(value=>({value,r:rng()})).sort((a,b)=>a.r-b.r).map(x=>x.value);

/** Keep the bond anchor, add teammates, or choose a whole group by average internal bonds. */
export function castFirstImpression(anchor, members, kind, ctx) {
 const rng=stableRng('td-first-cast',salt(),ctx.ep,ctx.camp,kind,ctx.n || 0);
 const roll=rng();
 if(members.length<3 || roll<0.4) return {names:[anchor.a,anchor.b],mode:'pair'};
 const size=members.length>=4 && rng()<0.4 ? 4 : 3;
 const rest=shuffled(members.filter(n=>n!==anchor.a && n!==anchor.b),rng);
 if(roll<0.7) {
   const names=[anchor.a,anchor.b];
   while(names.length<size) {
     const options=ranked(rest.filter(n=>!names.includes(n)&&names.every(a=>stranger(a,n,ctx))).map(n=>[...names,n]),kind);
     if(!options.length)break;
     names.push(options[Math.floor(rng()*Math.min(3,options.length))].at(-1));
   }
   return {names,mode:names.length>=3?'anchor-group':'pair'};
 }
 const groups=[];
 const visit=(start,chosen)=>{
   if(chosen.length===size){groups.push(chosen);return;}
   for(let i=start;i<members.length;i++) if(chosen.every(a=>stranger(a,members[i],ctx)))visit(i+1,[...chosen,members[i]]);
 };
 visit(0,[]);
 if(!groups.length)return {names:[anchor.a,anchor.b],mode:'pair'};
 ranked(groups,kind);
 return {names:groups[Math.floor(rng()*Math.min(5,groups.length))],mode:'whole-group'};
}

const fits=(entry,who,facts)=>Object.entries(entry.when||{}).every(([key,want])=>{
 if(key==='voice'||key==='voiceB') return [].concat(want).some(tag=>voiceOf(who[key==='voice'?'a':'b']).includes(tag));
 return Array.isArray(want)?want.includes(facts[key]):facts[key]===want;
});
const factsOf=(who,kind,ctx)=>({
 ...factsFor({who,data:{}},ctx),pair:!!who.b,third:!!who.c,fourth:!!who.d,outcome:kind,venue:ctx.venue,
 canFlirt:seasonConfig.romance === 'enabled' && romanticCompat(who.a,who.b),
 ...ctx.facts,
});

/** Returns authored words and the exact people who take part, or null if every fitting scene aired. */
export function writeFirstImpression(anchor,members,kind,ctx) {
 const cast=castFirstImpression(anchor,members,kind,ctx);
 const orientations=[];
 const leads=cast.mode==='anchor-group'?[anchor.a,anchor.b]:cast.names;
 for(let i=0;i<leads.length;i++)for(let j=0;j<leads.length;j++)if(i!==j) {
   const rest=cast.names.filter(name=>name!==leads[i]&&name!==leads[j]);
   const who={a:leads[i],b:leads[j],...(rest[0]?{c:rest[0]}:{}),...(rest[1]?{d:rest[1]}:{})};
   orientations.push({who,facts:factsOf(who,kind,ctx)});
 }
 const kitTeams=((gs.tdStory ||= {}).firstImpressionKitTeams ||= []);
 if(!kitTeams.includes(ctx.camp)) {
   // a kit scene is about two people: whoever else the cast drew stays out of it (a seat with nothing of
   // its own to say is the bug the user found, 2026-10-10)
   for(const x of orientations.filter(x=>hasKit(x.who.a))) {
     const who={a:x.who.a,b:x.who.b};
     const w=kitFirstPairScene(who.a,who.b,kind,factsOf(who,kind,ctx),{...ctx,who,firstImpressions:true});
     if(w){kitTeams.push(ctx.camp);return {w,who,mode:'pair',kit:true};}
   }
 }
 const group=cast.names.length>=3;
 const pool=group?'story.firstgroup':'story.firstpair';
 const rng=stableRng('td-first-situation',salt(),ctx.ep,ctx.camp,kind,ctx.n||0);
 const candidates=orientations.flatMap(({who,facts})=>(STORY_POOLS[pool+'.'+kind]||[])
   .filter(e=>!e.kit&&fits(e,who,facts)).map(e=>({e,who,facts,rank:Object.keys(e.when||{}).length,r:rng()})))
   .sort((a,b)=>b.rank-a.rank||a.r-b.r);
 for(const {e,who,facts} of candidates){
   const w=writeStory(pool,kind,who,ctx.data||{},facts,{...ctx,firstImpressions:true,entryIds:[e.id]});
   if(w)return {w,who,mode:cast.mode,kit:false};
 }
 // Exhausted groups may still have a fresh pair situation. Nobody is left sitting silently.
 if(group) {
   const who={a:anchor.a,b:anchor.b};
   return writeFirstPairFallback(who,kind,ctx);
 }
 return null;
}
function writeFirstPairFallback(who,kind,ctx) {
 for(const parts of [who,{a:who.b,b:who.a}]) {
   const facts=factsOf(parts,kind,ctx);
   const ids=(STORY_POOLS['story.firstpair.'+kind]||[]).filter(e=>!e.kit).map(e=>e.id);
   const w=writeStory('story.firstpair',kind,parts,ctx.data||{},facts,{...ctx,firstImpressions:true,entryIds:ids});
   if(w)return {w,who:parts,mode:'pair',kit:false};
 }
 return null;
}
