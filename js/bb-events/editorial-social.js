// Big Brother house-life scenes: ordinary rooms becoming strategic territory.
// Each event has four written cuts and leaves state behind for later decisions.
import { bond, closestTo, couldRomance, pStats, targetOf } from './_read.js';
import { pronouns } from '../players.js';

const pick = (list, rng) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
const actor = (house, rng) => pick(house, rng);
const other = (house, name, rng) => pick(house.filter(n => n !== name), rng);
const trio = (house, rng) => {
  const a = actor(house, rng); const b = other(house, a, rng); const c = other(house, a, rng);
  return [a, b, c === b ? house.find(n => n !== a && n !== b) : c];
};
const result = (text, players, badgeText, badgeClass = 'blue') => ({ text, players:players.filter(Boolean), badgeText, badgeClass });
const fit = (ctx, base = 2) => ['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act) ? base * .3 : base;

const bedroomPolitics = {
  id:'editorial-bedroom-politics', category:'social',
  weight:(h, c) => h.length >= 5 ? fit(c, 2.2) : 0,
  fire(h, c, api, rng) {
    const [a,b,d] = trio(h, rng);
    const text = pick([
      `${b} leaves ${pronouns(b).posAdj} clothes folded on an empty bed to claim it. ${a} dumps them onto the floor and opens ${pronouns(a).posAdj} suitcase. “I was saving that bed,” ${b} says. “You weren't sleeping in it,” ${a} answers, and keeps unpacking while ${d} watches from across the room.`,
      `${a} wants everyone to switch beds so the rooms are “more balanced.” ${b} asks why ${a} gets to decide that. ${d} says nothing, but pushes ${pronouns(d).posAdj} suitcase farther under the bed when ${a} looks over.`,
      `${b} wakes up and finds ${a}'s charger plugged into the outlet beside the bed. Neither will unplug it. Ten minutes later, they are arguing about every little thing that has happened all week.`,
      `After lights-out, ${a} accuses ${b} of taking the extra pillows. ${b} tells ${a} to check under ${pronouns(a).posAdj} own bed. ${d} tries not to laugh and fails.`,
    ], rng);
    api.addBond(a,b,-.8); api.suspicion(d,a,1); api.remember(b,a,'territorial',1,{ room:'bedroom' });
    return result(text,[a,b,d],'BEDROOM WAR','red');
  },
};

const interruptedWhisper = {
  id:'editorial-interrupted-whisper', category:'social',
  weight:(h,c) => h.length >= 6 ? fit(c, 2.6) : 0,
  fire(h,c,api,rng) {
    const [a,b,d] = trio(h,rng);
    const text = pick([
      `${a} and ${b} stop talking as soon as ${d} walks into the storage room. “What?” ${d} asks. Both of them say “nothing” at the same time.`,
      `${d} walks into the kitchen and catches ${a} whispering to ${b} behind the refrigerator door. ${a} immediately starts talking about what to make for dinner.`,
      `${a} whispers ${b}'s name, not realizing ${d} is lying on the couch in the next room. ${d} stays completely still and listens.`,
      `${d} opens the bathroom door just as ${a} says, “We can't tell ${d}.” ${a} freezes. ${b} looks down at the floor.`,
    ],rng);
    api.addBond(a,b,.5); api.suspicion(d,a,2.2); api.suspicion(d,b,1.6); api.remember(d,a,'caught-whispering',2,{ with:b });
    return result(text,[a,b,d],'CAUGHT TALKING','purple');
  },
};

const kitchenAfterDark = {
  id:'editorial-kitchen-after-dark', category:'social',
  weight:(h,c) => h.length >= 4 ? fit(c, 2.5) : 0,
  fire(h,c,api,rng) {
    const [a,b,d] = trio(h,rng);
    const text = pick([
      `${a} burns a quesadilla at two in the morning. ${b} eats it anyway, and ${d} laughs so loudly that production tells ${pronouns(d).obj} to keep it down.`,
      `${a} and ${b} make a late-night meal out of whatever is left in the fridge. ${d} sits at the counter talking to them until all three lose track of the time.`,
      `While ${a} washes dishes, ${b} admits ${pronouns(b).sub} lied about something early in the game. ${a} stops scrubbing for a second, then quietly asks what really happened.`,
      `${d} starts doing an impression of ${a} in the kitchen. ${a} walks in halfway through it, stares for a moment, then joins in and makes everyone laugh harder.`,
    ],rng);
    api.addBond(a,b,1.1); api.addBond(a,d,.5); api.addBond(b,d,.5);
    return result(text,[a,b,d],'2 A.M. CREW','green');
  },
};

const secretSpill = {
  id:'editorial-secret-spill', category:'social',
  weight:(h,c) => h.length >= 5 ? fit(c, 2.1) : 0,
  fire(h,c,api,rng) {
    const [a,b,d] = trio(h,rng);
    const text = pick([
      `${a} starts to say, “When ${b} told me—” and cuts ${pronouns(a).ref} off. ${b} looks straight at ${d}. That conversation was supposed to stay private.`,
      `${a} repeats something ${b} said in private because it makes a funny story. ${b} does not laugh after noticing ${d} listening from the couch.`,
      `${a} mentions “our final three” with ${d} still in the room. Nobody speaks for a second. ${a} tries to change the subject, but it is too late.`,
      `${b} asks how ${a} found out about the plan. ${a} says ${d} told ${pronouns(a).obj}. ${d} immediately denies it, and all three start talking over one another.`,
    ],rng);
    api.addBond(a,b,-1.2); api.suspicion(d,a,2); api.remember(b,a,'leaked-information',3,{ witness:d });
    return result(text,[a,b,d],'SECRET SPILLED','red');
  },
};

const hohOrbit = {
  id:'editorial-hoh-orbit', category:'social',
  weight:(h,c) => c?.hoh && h.includes(c.hoh) && h.length >= 5 ? fit(c, 2.8) : 0,
  fire(h,c,api,rng) {
    // Two DIFFERENT visitors. `other` only excludes the name it is given, so
    // drawing twice against the same house drew the same person about one time
    // in eight — and three of the four lines below need two people to work at
    // all: "Dawn waiting with coffee, and before the door shuts Dawn appears
    // at the top of the stairs" is not a scene. The beat also cast them twice,
    // so the card showed the same face side by side.
    const hoh=c.hoh, a=other(h,hoh,rng);
    const b=pick(h.filter(n=>n!==hoh && n!==a),rng);
    if(!a||!b) return null;
    const text=pick([
      `${a} comes up to the HOH room for the fourth time that day. This time the excuse is a missing water bottle. ${hoh} lets ${pronouns(a).obj} in, then asks what ${a} really wants.`,
      `${a} stretches out on the HOH bed and settles in for a long talk. ${b} passes the open door twice, waiting for a turn alone with ${hoh}.`,
      `${hoh} opens the HOH door and finds ${a} waiting with coffee. Before ${hoh} can close it, ${b} appears at the top of the stairs asking to talk too.`,
      `${a} spends most of the afternoon in the HOH room with ${hoh}. Downstairs, ${b} points out that ${a} has barely spoken to anyone else all day.`,
    ],rng);
    api.addBond(a,hoh,.8); api.suspicion(b,a,1.8); api.remember(b,a,'hoh-orbit',2,{ hoh });
    return result(text,[hoh,a,b],'HOH TRAFFIC','gold');
  },
};

const apologyTour = {
  id:'editorial-apology-tour', category:'social',
  weight:(h,c) => h.length >= 4 ? fit(c, 1.9) : 0,
  fire(h,c,api,rng) {
    const a=actor(h,rng); const b=[...h].filter(n=>n!==a).sort((x,y)=>bond(a,x)-bond(a,y))[0];
    const textRoll=rng();
    const lands=pStats(a).social + rng()*6 >= 8;
    const text=pick(lands ? [
      `${a} tells ${b}, “I was wrong about what happened. I shouldn't have snapped at you.” The apology is awkward, but ${b} can tell it is real.`,
      `${a} brings ${b} a cup of coffee and names exactly what went wrong without making an excuse. ${b} does not forgive everything at once, but the conversation ends better than it began.`,
      `${a} asks ${b} for five uninterrupted minutes, then uses all five to apologize without defending what happened. ${b} is still hurt, but agrees they can start over.`,
      `${a} admits to ${b} that the argument became personal and that ${pronouns(a).sub} took it too far. ${b} accepts the apology, then explains what will have to change.`,
    ] : [
      `${a} pulls ${b} aside and apologizes, but keeps explaining why the fight was not really ${pronouns(a).posAdj} fault. ${b} listens without saying much.`,
      `${a} tells ${b} the argument was only game. “It didn't feel like game,” ${b} says. ${a} goes quiet and lets ${pronouns(b).obj} finish.`,
      `${a} begins with “I'm sorry you took it that way.” ${b} stops the apology there and asks ${a} to come back when ${pronouns(a).sub} can name what ${pronouns(a).sub} actually did.`,
      `${a} apologizes to ${b}, then immediately asks whether they are good for the vote. ${b} realizes the conversation was damage control and ends it.`,
    ],()=>textRoll);
    api.addBond(a,b,lands?1.2:-.4); api.remember(b,a,lands?'made-amends':'bad-apology',lands?1:2,{});
    return result(text,[a,b],lands?'APOLOGY LANDS':'NOT BUYING IT',lands?'green':'red');
  },
};

const poolsideSpark = {
  id:'editorial-poolside-spark', category:'social',
  weight:(h,c) => h.length >= 5 && h.some(a=>h.some(b=>a!==b&&couldRomance(a,b))) ? fit(c, 1.8) : 0,
  fire(h,c,api,rng) {
    const pairs=[]; for(const a of h) for(const b of h) if(a<b&&couldRomance(a,b)) pairs.push([a,b]);
    const [a,b]=pick(pairs,rng);
    const text=pick([
      `${a} and ${b} volunteer to clean the pool, but spend most of the time sitting at the edge with their feet in the water and talking.`,
      `${a} takes ${b}'s sunglasses and refuses to give ${pronouns(b).obj} the glasses back. ${b} follows ${a} around the yard, laughing, while everyone else starts exchanging looks.`,
      `${a} offers to put sunscreen on ${b}'s shoulders. The conversation beside the pair trails off as the rest of the yard notices.`,
      `${b} makes ${a} laugh so hard that ${a} snorts. ${a} covers ${pronouns(a).posAdj} face and tells ${b} never to repeat it. ${b} promises between laughs.`,
    ],rng);
    // This is chemistry, not yet a relationship. Turning one flirtatious
    // afternoon into a showmance made later "define it" scenes nonsensical.
    api.addBond(a,b,1.1); api.remember(a,b,'romantic-spark',1,{}); api.remember(b,a,'romantic-spark',1,{});
    return result(text,[a,b],'CHEMISTRY','pink');
  },
};

const voteFlipRoom = {
  id:'editorial-vote-flip-room', category:'social',
  weight:(h,c) => c?.act==='campaign' && (c.nominees||[]).length===2 && h.length>=6 ? 3.4 : 0,
  fire(h,c,api,rng) {
    const noms=c.nominees, [a,b,d]=trio(h.filter(n=>!noms.includes(n)),rng), target=pick(noms,rng);
    const text=pick([
      `${a} insists the votes are there to evict ${target}. ${b} asks for names. When ${a} names ${d}, ${d} cuts in: “I never said that.”`,
      `${a}, ${b} and ${d} count the votes again. Each of them thinks a different person is the swing, and nobody wants to be the first one to commit.`,
      `${b} shuts the bedroom door. “If we're flipping this, I need both of you with me.” ${d} asks who else knows before giving an answer.`,
      `${a} tells ${b} and ${d} that evicting ${target} is better for all three of them. ${b} agrees. ${d} asks ${b} why ${pronouns(b).sub} answered so quickly.`,
    ],rng);
    api.addBond(a,b,.5); api.suspicion(d,a,1.2); api.setTarget(a,target,'late vote flip'); api.remember(b,a,'vote-flip-pitch',2,{ target });
    return result(text,[a,b,d,target],'VOTES IN MOTION','purple');
  },
};

const houseRoast = {
  id:'editorial-house-roast', category:'social',
  weight:(h,c) => h.length>=5 ? fit(c,2) : 0,
  fire(h,c,api,rng) {
    const [a,b,d]=trio(h,rng); const lands=pStats(a).social+rng()*6>=8;
    const text=pick(lands ? [
      `${a} does an impression of the way ${b} walks into a strategy talk. ${d} nearly falls off the couch laughing, and even ${b} has to admit it is accurate.`,
      `${a} reenacts ${b}'s veto speech with a dish towel over ${pronouns(a).posAdj} shoulders. Everyone laughs, including ${b}, who jumps in to correct the parts ${a} gets wrong.`,
      `${a} gives everyone at dinner a harmless superlative and saves the funniest one for ${b}. ${b} laughs hardest and demands a second award.`,
      `${a} imitates the face ${b} makes whenever somebody proposes a bad plan. ${b} tries to deny it, makes the exact face again and loses the room.`,
    ] : [
      `${a} starts handing out fake awards at dinner. ${b} wins “Most Likely to Turn Any Conversation Into a Meeting” and forces a smile.`,
      `${a} makes a joke about ${b} that gets a huge reaction from the room. ${b} goes quiet, and ${d} is the first person to realize the joke went too far.`,
      `${a} keeps adding details to a story about ${b} after ${b} asks ${pronouns(a).obj} to stop. The room's laughter fades before ${a} notices.`,
      `${a} turns one of ${b}'s insecurities into the punchline of a house joke. ${d} changes the subject, but ${b} has already left the table.`,
    ],rng);
    api.addBond(a,b,lands?.5:-1.1); api.addBond(a,d,.4); api.remember(b,a,lands?'shared-joke':'humiliated',lands?1:2,{});
    return result(text,[a,b,d],lands?'HOUSE IN TEARS':'JOKE CUTS DEEP',lands?'green':'red');
  },
};

const storageRoomBreakdown = {
  id:'editorial-storage-room-breakdown', category:'social',
  weight:(h,c) => h.length>=4 ? fit(c,1.7) : 0,
  fire(h,c,api,rng) {
    const a=actor(h,rng), b=closestTo(a,h.filter(n=>n!==a))||other(h,a,rng);
    const text=pick([
      `${a} goes into the storage room for batteries and starts crying beside the paper towels. ${b} walks in, hesitates, then closes the door and sits beside ${pronouns(a).obj}.`,
      `${a} admits the house is getting to ${pronouns(a).obj}. ${b} hands ${pronouns(a).obj} a towel, sits on the floor and listens without bringing up the game.`,
      `${b} finds ${a} standing in front of the open freezer. “I just miss home,” ${a} says. ${b} stays until ${a} is ready to go back outside.`,
      `${a} tells ${b}, “I'm scared I'm going home this week.” ${b} sits beside ${pronouns(a).obj} on a box of cereal and lets ${pronouns(a).obj} talk it out.`,
    ],rng);
    api.addBond(a,b,1.5); api.remember(a,b,'emotional-support',3,{}); api.popDelta(b,.5);
    return result(text,[a,b],'A REAL MOMENT','green');
  },
};

const meetingCrash = {
  id:'editorial-meeting-crash', category:'social',
  weight:(h,c) => h.length>=7 ? fit(c,2.2) : 0,
  fire(h,c,api,rng) {
    const [a,b,d]=trio(h,rng);
    const text=pick([
      `${a} opens the bedroom door without knocking. ${b} and ${d} immediately stop talking and move farther apart on the beds.`,
      `${a} walks into the bedroom. ${b} says, “Perfect timing,” a little too quickly, while ${d} suddenly starts folding clothes.`,
      `${a} sits down beside ${b} and ${d} and waits to see whether they will continue their conversation. They spend the next several minutes talking about the weather instead.`,
      `${b} and ${d} are using the chessboard to count votes. When ${a} comes outside, ${b} sweeps the pieces back into the box. ${a} notices.`,
    ],rng);
    api.addBond(b,d,.4); api.suspicion(a,b,2); api.suspicion(a,d,2); api.remember(a,b,'closed-door-meeting',2,{ with:d });
    return result(text,[a,b,d],'MEETING CRASHED','purple');
  },
};

const silentStandoff = {
  id:'editorial-silent-standoff', category:'social',
  weight:(h,c) => h.length>=4 && !c?.week?._coldWarScene
    && h.some(a=>h.some(b=>a!==b&&bond(a,b)<=-2)) ? fit(c,1.8) : 0,
  fire(h,c,api,rng) {
    if(c?.week) c.week._coldWarScene='editorial-silent-standoff';
    const hostile=h.filter(a=>h.some(b=>a!==b&&bond(a,b)<=-2));
    const a=pick(hostile,rng), b=[...h].filter(n=>n!==a).sort((x,y)=>bond(a,x)-bond(a,y))[0];
    const text=pick([
      `${a} pours coffee for everyone at the table except ${b}. ${b} gets up, takes the pot from ${a}'s hand and pours ${pronouns(b).ref} a cup without saying a word.`,
      `${a} and ${b} wipe down opposite ends of the kitchen counter in silence. When they meet in the middle, neither one moves out of the way.`,
      `${b} asks if anyone wants to use the pool. ${a} answers someone else instead of looking at ${pronouns(b).obj}. Everyone at the table notices.`,
      `${a} changes seats when ${b} sits beside ${pronouns(a).obj}. ${b} moves one chair closer. “Is there a problem?” ${b} asks. ${a} says no.`,
    ],rng);
    api.addBond(a,b,-.7); api.remember(a,b,'cold-war',2,{}); if(!targetOf(a)) api.setTarget(a,b,'personal standoff');
    return result(text,[a,b],'COLD WAR','red');
  },
};

export const EDITORIAL_SOCIAL_EVENTS=[bedroomPolitics,interruptedWhisper,kitchenAfterDark,secretSpill,hohOrbit,apologyTour,poolsideSpark,voteFlipRoom,houseRoast,storageRoomBreakdown,meetingCrash,silentStandoff];
export default EDITORIAL_SOCIAL_EVENTS;
