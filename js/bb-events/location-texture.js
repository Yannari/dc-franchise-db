// One consequence-bearing slice of house life for every supported camera.
import { pronouns } from '../players.js';
import { archetype, band, beatsInvolving, bond, closestTo, furthestFrom, pStats, targetOf } from './_read.js';

function variant(lines, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 2166136261;
  for (const ch of key) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return lines[hash % lines.length];
}
const others = (house, ...skip) => house.filter(n => n && !skip.includes(n));
const quiet = pool => [...pool].sort((a,b) => beatsInvolving(a)-beatsInvolving(b));
const first = pool => quiet(pool)[0] || null;
const out = (text, players, badgeText, badgeClass) => ({ text, players:players.filter(Boolean), badgeText, badgeClass });
function fit(ctx, base=3) {
  if (['nominations','veto-ceremony','eviction'].includes(ctx?.act)) return band(base*.2);
  return band(ctx?.act==='campaign' ? base*.65 : base);
}

const kitchenLesson = {
  id:'texture-kitchen-lesson', category:'house-life', location:'kitchen',
  weight:(h,c)=>h.length>=4?fit(c,3.2):0,
  fire(h,c,api) {
    const cook=first(h.filter(n=>pStats(n).social>=5||pStats(n).temperament>=6))||first(h);
    const learner=first(others(h,cook));
    const text=variant([
      `${learner} admits there is no plan behind the cutting board—${learner} genuinely does not know how to dice an onion. ${cook} demonstrates once, then hands the knife back.`,
      `${cook} is halfway through making dinner when ${learner} asks to help. The first attempt is terrible. The second is edible. By the third, both are laughing too hard to care.`,
      `${learner} burns one side of dinner in the kitchen and tries to hide it under the good half. ${cook} notices, says nothing and helps rearrange the plate.`,
      `${cook} teaches ${learner} one recipe from home. For twenty minutes they talk about measurements, not votes, and neither rushes to leave when the food is done.`,
    ],c,cook,learner);
    api.addBond(cook,learner,1.1); api.remember(learner,cook,'kindness',1,{about:'helped with dinner'});
    return out(text,[cook,learner],'DINNER DUTY','green');
  },
};

const backyardGame = {
  id:'texture-backyard-game', category:'house-life', location:'backyard',
  weight:(h,c)=>h.length>=6?fit(c,2.9):0,
  fire(h,c,api) {
    const [a,b,d]=quiet(h).slice(0,3);
    const text=variant([
      `${a} invents a backyard game with a laundry basket, two pool floats and rules that change whenever ${a} starts losing. ${b} objects. ${d} keeps score anyway.`,
      `${a}, ${b} and ${d} turn a quiet afternoon in the backyard into a tournament nobody remembers agreeing to. The prize is the last clean towel.`,
      `${b} claims ${a}'s shot did not count. ${d} asks both of them to explain the rule and discovers they have been playing different games for half an hour.`,
      `${d} wins the backyard game, celebrates far too seriously and gives an acceptance speech from a patio chair while ${a} and ${b} throw cushions.`,
    ],c,a,b,d);
    api.addBond(a,b,.5); api.addBond(b,d,.5); api.addBond(a,d,.4); api.popDelta(d,1);
    return out(text,[a,b,d],'BACKYARD LEAGUE','green');
  },
};

const bedroomSnoring = {
  id:'texture-bedroom-snoring', category:'house-life', location:'bedroom',
  weight:(h,c)=>h.length>=4?fit(c,2.7):0,
  fire(h,c,api) {
    const sleeper=first(h), exhausted=furthestFrom(sleeper,others(h,sleeper))||first(others(h,sleeper));
    const text=variant([
      `${exhausted} waits until morning to tell ${sleeper} that the entire bedroom was awake. ${sleeper} laughs. ${exhausted} has not slept enough to find that charming.`,
      `${sleeper}'s snoring stops every time somebody says ${sleeper}'s name and starts again when the bedroom settles. By three in the morning, ${exhausted} is taking it personally.`,
      `${exhausted} builds a wall of pillows between the beds. ${sleeper} wakes up, studies the construction and asks whether this counts as a nomination.`,
      `${exhausted} moves to the bedroom floor halfway through the night. In the morning, ${sleeper} offers an apology and earplugs. Only one is accepted.`,
    ],c,sleeper,exhausted);
    api.addBond(exhausted,sleeper,-.7); api.remember(exhausted,sleeper,'irritation',1,{about:'kept the bedroom awake'});
    return out(text,[sleeper,exhausted],'NO SLEEP','grey');
  },
};

const washroomHaircut = {
  id:'texture-washroom-haircut', category:'house-life', location:'washroom',
  weight:(h,c)=>h.length>=4?fit(c,2.5):0,
  fire(h,c,api) {
    const stylist=first(h.filter(n=>pStats(n).mental>=5||pStats(n).social>=6))||first(h);
    const client=first(others(h,stylist));
    const works=pStats(stylist).mental+pStats(stylist).social>=11;
    const text=variant(works?[
      `${client} sits on a washroom stool with a towel around ${pronouns(client).posAdj} shoulders. ${stylist} makes the first careful cut and somehow seems to know exactly what to do.`,
      `${stylist} trims ${client}'s hair in the washroom while half the house offers useless instructions from the doorway. Against all available evidence, it turns out well.`,
      `${client} asks for “just a little off.” ${stylist} repeats the request, works slowly and earns a relieved grin when the washroom mirror is uncovered.`,
      `${stylist} turns ${client} toward the washroom mirror. ${client} checks both sides, smiles and immediately starts recommending ${stylist} to everybody else.`,
    ]:[
      `${stylist} says, “I can fix that,” in the washroom. Ten minutes later, ${client} is wearing a hat indoors and ${stylist} has stopped making promises.`,
      `${client} asks for a trim. The first cut is too short, the second is an attempt to match it, and the washroom goes silent before either says a word.`,
      `${stylist} turns ${client} toward the washroom mirror. ${client} stares at the result, asks for one minute alone and closes the door.`,
      `${client} notices the uneven side before ${stylist} can move the washroom mirror. “It grows back” is not the reassurance ${stylist} thinks it is.`,
    ],c,stylist,client,works);
    api.addBond(stylist,client,works?1:-1.2); api.remember(client,stylist,works?'kindness':'embarrassment',works?1:2,{about:'house haircut'}); api.popDelta(stylist,works?1:-1);
    return out(text,[stylist,client],works?'FRESH CUT':'HAT SEASON',works?'green':'red');
  },
};

const livingRoomTrial = {
  id:'texture-living-room-trial', category:'house-life', location:'living-room',
  weight:(h,c)=>h.length>=6?fit(c,2.9):0,
  fire(h,c,api) {
    const host=first(h.filter(n=>['wildcard','chaos-agent','social-butterfly'].includes(archetype(n))))||first(h);
    const accused=first(others(h,host)), witness=first(others(h,host,accused));
    const funny=pStats(accused).temperament>=5&&bond(accused,host)>-2;
    const text=variant(funny?[
      `${host} turns the living room into a courtroom and charges ${accused} with stealing blankets. ${witness} gives wildly unreliable testimony. ${accused} objects to everything and wins the room.`,
      `${accused} is put on trial in the living room for leaving one mug in three places. ${host} presents photographs. ${accused} demands a jury of people who also do dishes.`,
      `${host} calls the living-room court to order. ${accused} pleads guilty to talking game before breakfast but argues there were “extreme strategic circumstances.”`,
      `${witness} bangs a wooden spoon like a gavel while ${host} reads the charges. ${accused} delivers such a dramatic defense that the house acquits ${pronouns(accused).obj}.`,
    ]:[
      `${host} turns a running joke into a living-room trial about ${accused}. Everyone laughs until ${accused} asks why the same joke is always about ${pronouns(accused).obj}.`,
      `${accused} sits through three fake charges in the living room, then gets up during the fourth. ${host} calls after ${pronouns(accused).obj}, but nobody continues the game.`,
      `${host} expects ${accused} to play along with the living-room trial. ${accused} asks whether humiliating somebody counts as boredom relief.`,
      `${witness} reads a joke accusation about ${accused}. ${accused} does not smile, and ${host} realizes too late that the bit needed a willing defendant.`,
    ],c,host,accused,witness,funny);
    api.addBond(host,accused,funny?.8:-1.2); api.addBond(host,witness,.4); api.popDelta(host,funny?1:-1);
    if(!funny) api.remember(accused,host,'humiliation',2,{about:'living-room joke'});
    return out(text,[host,accused,witness],funny?'HOUSE COURT':'BIT GOES BAD',funny?'green':'red');
  },
};

const pantryNameDrop = {
  id:'texture-pantry-name-drop', category:'deals', location:'pantry',
  weight:(h,c)=>h.length>=6?fit(c,3.1):0,
  fire(h,c,api) {
    const speaker=first(h), listener=closestTo(speaker,others(h,speaker))||first(others(h,speaker));
    const target=furthestFrom(speaker,others(h,speaker,listener))||first(others(h,speaker,listener));
    const text=variant([
      `${speaker} and ${listener} are whispering in the storage room when ${target}'s name carries through the door. ${target} keeps walking, then doubles back to listen.`,
      `${target} enters the storage room just after ${speaker} says, “We have to do it before they do.” ${listener} reaches for a box as though that explains the conversation.`,
      `${speaker} lowers ${pronouns(speaker).posAdj} voice in the storage room, but not before ${target} hears “next week.” ${target} leaves before either person sees ${pronouns(target).obj}.`,
      `${listener} asks whether ${target} is really the plan. A container falls outside the storage-room door. When ${speaker} opens it, the hallway is empty.`,
    ],c,speaker,listener,target);
    api.addBond(speaker,listener,.5); api.suspicion(target,speaker,1.8); api.remember(target,speaker,'overheard-plot',2,{with:listener});
    return out(text,[speaker,listener,target],'NAME OVERHEARD','purple');
  },
};

const diaryRoomRant = {
  id:'texture-diary-room-rant', category:'social', location:'diary-room',
  weight:(h,c)=>h.length>=4?fit(c,2.7):0,
  fire(h,c,api) {
    const speaker=first(h.filter(n=>pStats(n).temperament<=5||targetOf(n)))||first(h);
    const enemy=targetOf(speaker)||furthestFrom(speaker,others(h,speaker));
    const text=variant([
      `${speaker} enters the Diary Room planning to discuss the week calmly. ${enemy}'s name comes up, and the calm version lasts eleven seconds.`,
      `“I am not mad,” ${speaker} tells the Diary Room, then produces an extremely organized list of reasons to be mad at ${enemy}.`,
      `${speaker} rehearses what to say to ${enemy}, stops, starts again and admits the polite version is never leaving the Diary Room.`,
      `${speaker} tells the Diary Room that living with ${enemy} is harder than targeting ${enemy}. Then ${speaker} decides those may now be the same problem.`,
    ],c,speaker,enemy);
    api.setTarget(speaker,enemy,'could not let it go in the Diary Room'); api.suspicion(speaker,enemy,.8); api.remember(speaker,enemy,'resolve',2,{said:'in the Diary Room'});
    return out(text,[speaker],'DIARY ROOM RANT','red');
  },
};

const hohLetter = {
  id:'texture-hoh-letter', category:'social', location:'hoh-room',
  weight:(h,c)=>c?.hoh&&h.includes(c.hoh)&&h.length>=4?fit(c,2.6):0,
  fire(h,c,api) {
    const hoh=c.hoh, guest=closestTo(hoh,others(h,hoh))||first(others(h,hoh));
    const text=variant([
      `${hoh} reads the letter from home alone in the HOH room, then calls ${guest} upstairs and reads one paragraph again. ${guest} understands why that was the paragraph.`,
      `${guest} finds ${hoh} sitting on the HOH-room floor with the letter open. ${hoh} laughs at the worried look, wipes ${pronouns(hoh).posAdj} face and makes room.`,
      `${hoh} lets ${guest} hold the family photo from the HOH basket. They spend a while talking about people who do not know this week's vote count.`,
      `${hoh} starts reading the HOH letter aloud, gets halfway through and hands it to ${guest}. ${guest} finishes the sentence without making a production of it.`,
    ],c,hoh,guest);
    api.addBond(hoh,guest,1.3); api.remember(hoh,guest,'emotional-support',2,{about:'shared the HOH letter'});
    return out(text,[hoh,guest],'LETTER FROM HOME','green');
  },
};

export const LOCATION_TEXTURE_EVENTS=[kitchenLesson,backyardGame,bedroomSnoring,washroomHaircut,livingRoomTrial,pantryNameDrop,diaryRoomRant,hohLetter];
export default LOCATION_TEXTURE_EVENTS;
