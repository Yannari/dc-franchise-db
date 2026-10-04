// Reactions that only exist because an earlier scene left unfinished business.
import { gs } from '../core.js';
import { band, beatsInvolving, spotlightOrder, bond, memoriesOf, memoryWeek, pStats, remembers } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

/** Least-seen first, weighted toward whoever this week is about. */
const quiet = pool => spotlightOrder(pool);
/**
 * Unfinished business, while it is still unfinished.
 *
 * There was no recency check here, so the first matching memory won regardless
 * of when it was made — and "why are you still awake talking about it" could
 * arrive five weeks after the argument it refers to. These events all describe
 * the immediate aftermath of something, so they need the something to be
 * recent. Two weeks: the week it happened and the week after.
 */
const RECENT_WEEKS = 2;
const pairFromMemory=(house,types,done,ctx)=>{
  const now=ctx?.week?.num??(gs.episode||0)+1;
  for(const a of quiet(house)) for(const m of memoriesOf(a)) {
    const b=m?.subject;
    if(!b||!house.includes(b)||b===a) continue;
    if(!types.includes(m.type)||remembers(a,b,done)) continue;
    const when=memoryWeek(m);
    if(when&&now-when>RECENT_WEEKS) continue;
    return {a,b,m};
  }
  return null;
};
const result=(scene,players,badgeText,badgeClass)=>({scene,players:players.filter(Boolean),badgeText,badgeClass});
const fit=(ctx,n)=>band(['nominations','veto-ceremony','eviction'].includes(ctx?.act)?n*.25:n);

const isolationCheckIn={
  id:'followup-isolation-check-in',category:'social',location:'kitchen',
  weight(h,c){return pairFromMemory(h,['abandonment','cold-war'],'isolation-addressed',c)?fit(c,4):0;},
  fire(h,c,api){
    const {a:isolated,b:avoider}=pairFromMemory(h,['abandonment','cold-war'],'isolation-addressed',c);
    const honest=bond(isolated,avoider)>=0&&pStats(avoider).loyalty>=5;
    const scene=makeScene('followup.isolation',{a:isolated,b:avoider},{ending:honest?'honest':'guarded'},[],'kitchen');
    api.addBond(isolated,avoider,honest?1.2:-.8); api.remember(isolated,avoider,'isolation-addressed',1,{repaired:honest});
    if(!honest) api.setTarget(isolated,avoider,'would not own leaving me alone');
    return result(scene,[isolated,avoider],honest?'FINALLY TALKING':'STILL ON THE OUTSIDE',honest?'green':'red');
  },
};

const overheardConfrontation={
  id:'followup-overheard-confrontation',category:'social',location:'living-room',
  weight(h,c){return pairFromMemory(h,['overheard-plot'],'plot-confronted',c)?fit(c,4.3):0;},
  fire(h,c,api){
    const {a:target,b:speaker}=pairFromMemory(h,['overheard-plot'],'plot-confronted',c);
    const admits=pStats(speaker).boldness>=6&&pStats(speaker).temperament>=4;
    const scene=makeScene('followup.overheard',{a:target,b:speaker},{ending:admits?'admits':'denies'},[],'living-room');
    api.addBond(target,speaker,admits?-1:-1.5); api.suspicion(target,speaker,admits?.5:1.4); api.remember(target,speaker,'plot-confronted',2,{admitted:admits});
    api.setTarget(target,speaker,admits?'admitted coming for me':'lied when I confronted them');
    return result(scene,[target,speaker],admits?'SAYS IT OUT LOUD':'DENIAL FALLS APART','red');
  },
};

const lieDamageControl={
  id:'followup-lie-damage-control',category:'deals',location:'pantry',
  weight(h,c){return pairFromMemory(h,['deceit','endgame-deal-discovered','overcommitted'],'damage-control-seen',c)?fit(c,3.8):0;},
  fire(h,c,api){
    const {a:finder,b:liar}=pairFromMemory(h,['deceit','endgame-deal-discovered','overcommitted'],'damage-control-seen',c);
    const works=pStats(liar).social+pStats(liar).strategic>pStats(finder).intuition+7;
    const scene=makeScene('followup.damage',{a:finder,b:liar},{ending:works?'owns':'digs'},[],'pantry');
    api.addBond(finder,liar,works?.6:-1); api.suspicion(finder,liar,works?-.3:1.2); api.remember(finder,liar,'damage-control-seen',1,{worked:works});
    return result(scene,[finder,liar],works?'OWNS PART OF IT':'DIGS DEEPER',works?'blue':'red');
  },
};

const fightAftershock={
  id:'followup-fight-aftershock',category:'social',location:'bedroom',
  weight(h,c){return pairFromMemory(h,['humiliation'],'fight-aftershock',c)?fit(c,3.5):0;},
  fire(h,c,api){
    const {a:hurt,b:other}=pairFromMemory(h,['humiliation'],'fight-aftershock',c);
    const ally=quiet(h.filter(n=>n!==hurt&&n!==other)).sort((x,y)=>bond(hurt,y)-bond(hurt,x))[0];
    const scene=makeScene('followup.aftershock',{a:hurt,b:ally||null},{ending:'scene',target:other},[],'bedroom');
    api.addBond(hurt,ally,1); api.suspicion(ally,other,.7); api.remember(hurt,other,'fight-aftershock',1,{support:ally}); api.remember(hurt,ally,'emotional-support',1,{after:'public fight'});
    return result(scene,[hurt,ally,other],'AFTER THE FIGHT','blue');
  },
};

export const STORY_FOLLOWUP_EVENTS=[isolationCheckIn,overheardConfrontation,lieDamageControl,fightAftershock];
export default STORY_FOLLOWUP_EVENTS;
