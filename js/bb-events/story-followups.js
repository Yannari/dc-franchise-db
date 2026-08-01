// Reactions that only exist because an earlier scene left unfinished business.
import { pronouns } from '../players.js';
import { band, beatsInvolving, bond, memoriesOf, pStats, remembers } from './_read.js';

function variant(lines, ctx, ...salt) {
  const key=`${ctx?.week?.num||0}|${ctx?.beat||0}|${ctx?.act||''}|${salt.join('|')}`;
  let h=2166136261; for(const ch of key) h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
  return lines[h%lines.length];
}
const quiet=pool=>[...pool].sort((a,b)=>beatsInvolving(a)-beatsInvolving(b));
const pairFromMemory=(house,types,done)=>{
  for(const a of quiet(house)) for(const m of memoriesOf(a)) {
    const b=m?.subject;
    if(b&&house.includes(b)&&b!==a&&types.includes(m.type)&&!remembers(a,b,done)) return {a,b,m};
  }
  return null;
};
const result=(text,players,badgeText,badgeClass)=>({text,players:players.filter(Boolean),badgeText,badgeClass});
const fit=(ctx,n)=>band(['nominations','veto-ceremony','eviction'].includes(ctx?.act)?n*.25:n);

const isolationCheckIn={
  id:'followup-isolation-check-in',category:'social',location:'kitchen',
  weight(h,c){return pairFromMemory(h,['abandonment','cold-war'],'isolation-addressed')?fit(c,4):0;},
  fire(h,c,api){
    const {a:isolated,b:avoider}=pairFromMemory(h,['abandonment','cold-war'],'isolation-addressed');
    const honest=bond(isolated,avoider)>=0&&pStats(avoider).loyalty>=5;
    const text=variant(honest?[
      `${avoider} finds ${isolated} alone at the kitchen table and admits to keeping a distance. ${isolated} asks whether that was personal or strategic. ${avoider} answers without hiding behind the house.`,
      `${isolated} asks ${avoider} why every conversation stopped after nominations. In the kitchen, with nobody else there, ${avoider} finally gives a real answer.`,
      `${avoider} brings ${isolated} coffee and says, “I handled this badly.” ${isolated} does not let the apology erase the week, but does let ${avoider} sit down.`,
      `${isolated} tells ${avoider} that being ignored felt worse than being nominated. ${avoider} listens, apologizes and stays at the kitchen table after the hard part is over.`,
    ]:[
      `${isolated} corners ${avoider} in the kitchen and asks why ${avoider} disappeared after nominations. ${avoider} says everybody needed space. ${isolated} asks why only one person was expected to take it.`,
      `${avoider} tries to explain the distance as “just the week.” ${isolated} asks when the week started requiring unanswered questions.`,
      `${isolated} asks for the truth at the kitchen table. ${avoider} gives a careful game answer, and ${isolated} realizes the avoidance never ended.`,
      `${avoider} sits down to clear the air, then spends five minutes explaining why none of this was really ${pronouns(avoider).posAdj} choice. ${isolated} gets up first.`,
    ],c,isolated,avoider,honest);
    api.addBond(isolated,avoider,honest?1.2:-.8); api.remember(isolated,avoider,'isolation-addressed',1,{repaired:honest});
    if(!honest) api.setTarget(isolated,avoider,'would not own leaving me alone');
    return result(text,[isolated,avoider],honest?'FINALLY TALKING':'STILL ON THE OUTSIDE',honest?'green':'red');
  },
};

const overheardConfrontation={
  id:'followup-overheard-confrontation',category:'social',location:'living-room',
  weight(h,c){return pairFromMemory(h,['overheard-plot'],'plot-confronted')?fit(c,4.3):0;},
  fire(h,c,api){
    const {a:target,b:speaker}=pairFromMemory(h,['overheard-plot'],'plot-confronted');
    const admits=pStats(speaker).boldness>=6&&pStats(speaker).temperament>=4;
    const text=variant(admits?[
      `${target} waits until the living room is full, then asks ${speaker} what was being planned in the storage room. ${speaker} does not deny saying the name.`,
      `${target} tells ${speaker} exactly what carried through the storage-room door. In the living room, ${speaker} admits the conversation happened and refuses to apologize for considering the move.`,
      `${speaker} gets one chance to explain what ${target} overheard. ${speaker} says the plan was real, the timing was not, and everybody in the living room hears both parts.`,
      `${target} asks whether ${speaker} wants to say it privately or publicly. ${speaker} looks around the living room and says, “Publicly is fine.”`,
    ]:[
      `${target} repeats the words heard outside the storage room. ${speaker} denies saying them, then changes one detail nobody had mentioned. The living room catches it.`,
      `${speaker} calls the overheard plan a misunderstanding. ${target} asks ${speaker} to explain which word was misunderstood.`,
      `${target} confronts ${speaker} in the living room. ${speaker} blames the acoustics, then the listener, then a conversation that supposedly meant something else.`,
      `${speaker} says ${target} heard only half the conversation. ${target} asks for the missing half. ${speaker} cannot produce it with the whole room waiting.`,
    ],c,target,speaker,admits);
    api.addBond(target,speaker,admits?-1:-1.5); api.suspicion(target,speaker,admits?.5:1.4); api.remember(target,speaker,'plot-confronted',2,{admitted:admits});
    api.setTarget(target,speaker,admits?'admitted coming for me':'lied when I confronted them');
    return result(text,[target,speaker],admits?'SAYS IT OUT LOUD':'DENIAL FALLS APART','red');
  },
};

const lieDamageControl={
  id:'followup-lie-damage-control',category:'deals',location:'pantry',
  weight(h,c){return pairFromMemory(h,['deceit','endgame-deal-discovered','overcommitted'],'damage-control-seen')?fit(c,3.8):0;},
  fire(h,c,api){
    const {a:finder,b:liar}=pairFromMemory(h,['deceit','endgame-deal-discovered','overcommitted'],'damage-control-seen');
    const works=pStats(liar).social+pStats(liar).strategic>pStats(finder).intuition+7;
    const text=variant(works?[
      `${liar} catches ${finder} in the storage room and admits the story looked bad because it was bad. The honesty arrives late, but it is the first useful thing ${liar} has said.`,
      `${liar} does not ask ${finder} to forget the lie. In the storage room, ${liar} explains what the lie was protecting and offers one name ${finder} can verify.`,
      `${finder} expects another denial. Instead, ${liar} owns the part that was false and answers the question underneath it.`,
      `${liar} brings no new story into the storage room—only an apology and enough detail for ${finder} to check it later. ${finder} agrees to listen, not forgive.`,
    ]:[
      `${liar} pulls ${finder} into the storage room to “clear things up” and tells a cleaner version of the same lie. ${finder} recognizes it before the second sentence ends.`,
      `${liar} explains that everybody makes overlapping promises. ${finder} asks why only ${liar}'s promises require this many explanations.`,
      `${finder} lets ${liar} finish the damage-control pitch, then repeats the one question ${liar} avoided. The answer changes again.`,
      `${liar} arrives in the storage room with dates, names and a careful timeline. ${finder} points out that none of it explains the original lie.`,
    ],c,finder,liar,works);
    api.addBond(finder,liar,works?.6:-1); api.suspicion(finder,liar,works?-.3:1.2); api.remember(finder,liar,'damage-control-seen',1,{worked:works});
    return result(text,[finder,liar],works?'OWNS PART OF IT':'DIGS DEEPER',works?'blue':'red');
  },
};

const fightAftershock={
  id:'followup-fight-aftershock',category:'social',location:'bedroom',
  weight(h,c){return pairFromMemory(h,['humiliation'],'fight-aftershock')?fit(c,3.5):0;},
  fire(h,c,api){
    const {a:hurt,b:other}=pairFromMemory(h,['humiliation'],'fight-aftershock');
    const ally=quiet(h.filter(n=>n!==hurt&&n!==other)).sort((x,y)=>bond(hurt,y)-bond(hurt,x))[0];
    const text=variant([
      `${hurt} is still replaying the fight in the bedroom when ${ally} comes in. ${ally} does not ask for the whole story—only which part hurt most.`,
      `${ally} finds ${hurt} putting clothes away much too aggressively. They go through what happened, including the part ${hurt} wishes ${pronouns(hurt).sub} had not said.`,
      `${hurt} says the argument is over. ${ally} asks why ${hurt} is still awake talking about it in the bedroom.`,
      `${ally} tells ${hurt} who defended ${pronouns(hurt).obj} after the fight and who laughed once ${hurt} left. That information changes the rest of the night.`,
    ],c,hurt,other,ally);
    api.addBond(hurt,ally,1); api.suspicion(ally,other,.7); api.remember(hurt,other,'fight-aftershock',1,{support:ally}); api.remember(hurt,ally,'emotional-support',1,{after:'public fight'});
    return result(text,[hurt,ally,other],'AFTER THE FIGHT','blue');
  },
};

export const STORY_FOLLOWUP_EVENTS=[isolationCheckIn,overheardConfrontation,lieDamageControl,fightAftershock];
export default STORY_FOLLOWUP_EVENTS;
