// Big Brother house-life scenes: ordinary rooms becoming strategic territory.
// Each event has four written cuts and leaves state behind for later decisions.
import { bond, closestTo, couldRomance, pStats, targetOf } from './_read.js';

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
      `${a} moves ${b}'s laundry off the good bed. ${b} moves it back. By the third exchange, ${d} is providing live commentary from under a blanket.`,
      `${a} proposes a bedroom rotation nobody asked for. ${b} hears fairness; ${d} hears a very elaborate attempt to sleep beside the right people.`,
      `${b} wakes up to find ${a} has claimed the only outlet with a handwritten sign. The argument begins over a charger and ends with both of them naming alliances.`,
      `The lights go out, ${a} asks who keeps stealing the pillows, and ${b} answers much too quickly. ${d} laughs hard enough to guarantee this will be discussed tomorrow.`,
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
      `${a} and ${b} stop talking the instant ${d} enters the storage room. ${d} says, “Don't stop on my account,” and nobody is convincing enough to laugh.`,
      `${d} catches ${a} whispering to ${b} behind the open refrigerator door. The milk takes a long time to choose.`,
      `${a} says ${b}'s name into a microphone that is much better than either of them remembered. Across the house, ${d} looks up.`,
      `${d} opens the bathroom door on the words “but we cannot tell ${d}.” There is no graceful version of the next ten seconds.`,
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
      `At 2:17 a.m., ${a} burns the quesadillas, ${b} eats one anyway, and ${d} laughs until production tells them to keep it down. Tomorrow they will call this trust. Tonight it is melted cheese.`,
      `${a} and ${b} turn leftovers into a meal for the house. ${d} does none of the cooking and receives most of the credit, which is also a useful social skill.`,
      `${b} admits a first-week lie while ${a} is elbow-deep in dishes. ${a} keeps washing. The lack of eye contact makes honesty possible.`,
      `${d} begins an impression of ${a} at the kitchen island. ${a} walks in halfway through, watches silently, then supplies a better ending.`,
    ],rng);
    api.addBond(a,b,1.1); api.addBond(a,d,.5); api.addBond(b,d,.5); api.remember(b,a,'late-night-trust',1,{});
    return result(text,[a,b,d],'2 A.M. CREW','green');
  },
};

const secretSpill = {
  id:'editorial-secret-spill', category:'social',
  weight:(h,c) => h.length >= 5 ? fit(c, 2.1) : 0,
  fire(h,c,api,rng) {
    const [a,b,d] = trio(h,rng);
    const text = pick([
      `${a} says, “When ${b} told me—” and stops. ${b} had not told ${d}. ${d} thanks them both for clearing that up.`,
      `${a} retells a private conversation as a funny story. It is funny right until ${b} notices ${d} listening from the couch.`,
      `${a} uses the phrase “our final three” in front of the fourth person in the room. ${d} counts the people twice.`,
      `${b} asks how ${a} knew about the plan. ${a} points at ${d}; ${d} points back. The secret now has three owners and no home.`,
    ],rng);
    api.addBond(a,b,-1.2); api.suspicion(d,a,2); api.remember(b,a,'leaked-information',3,{ witness:d });
    return result(text,[a,b,d],'SECRET SPILLED','red');
  },
};

const hohOrbit = {
  id:'editorial-hoh-orbit', category:'social',
  weight:(h,c) => c?.hoh && h.includes(c.hoh) && h.length >= 5 ? fit(c, 2.8) : 0,
  fire(h,c,api,rng) {
    const hoh=c.hoh, a=other(h,hoh,rng), b=other(h,hoh,rng);
    const text=pick([
      `${a} has visited the HOH room four times today and brought a different excuse each time. On visit five, ${hoh} stops pretending not to notice.`,
      `${a} settles into the HOH bed like a cabinet minister. ${b}, waiting in the hallway, begins timing how long the meeting lasts.`,
      `${hoh} opens the HOH door and finds ${a} already outside with coffee and a pitch. ${b} is three steps behind with the same coffee and the opposite pitch.`,
      `${a} laughs at every one of ${hoh}'s stories. ${b} watches from downstairs and revises ${a}'s threat level upward for enthusiasm alone.`,
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
    const text=pick([
      `${a} asks ${b} for five minutes and uses four of them explaining why the apology should count. ${b} notices the arithmetic.`,
      `${a} arrives with coffee, a blanket and the phrase “I own that.” ${b} accepts two of the three.`,
      `${a}'s apology to ${b} is clumsy, specific and—against the house consensus—probably sincere. That makes it harder to dismiss.`,
      `${a} tells ${b} the fight was game, not personal. ${b} says the game is played by people. Neither has a prepared response to that.`,
    ],rng);
    const lands=pStats(a).social + rng()*6 >= 8; api.addBond(a,b,lands?1.2:-.4); api.remember(b,a,lands?'made-amends':'bad-apology',lands?1:2,{});
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
      `${a} and ${b} volunteer to clean the pool and spend forty minutes on one corner. The pool is not cleaner. The feeds have found their afternoon story.`,
      `${a} steals ${b}'s sunglasses. ${b} spends the next hour pretending to want them back. Three houseguests begin naming the showmance before either participant does.`,
      `${a} rubs sunscreen onto ${b}'s shoulders while a nearby conversation slowly dies. Nobody is subtle enough for this house.`,
      `${b} makes ${a} laugh hard enough to snort, then swears not to tell anyone. The promise lasts. The camera zoom does not.`,
    ],rng);
    api.addBond(a,b,1.1); api.showmance(a,b,{ source:'poolside-spark' }); api.remember(a,b,'romantic-spark',1,{});
    return result(text,[a,b],'CHEMISTRY','pink');
  },
};

const voteFlipRoom = {
  id:'editorial-vote-flip-room', category:'social',
  weight:(h,c) => c?.act==='campaign' && (c.nominees||[]).length===2 && h.length>=6 ? 3.4 : 0,
  fire(h,c,api,rng) {
    const noms=c.nominees, [a,b,d]=trio(h.filter(n=>!noms.includes(n)),rng), target=pick(noms,rng);
    const text=pick([
      `${a} says the votes are there. ${b} asks for names. ${a} names ${d}, who is sitting close enough to hear and has not agreed to anything.`,
      `${a}, ${b} and ${d} count the vote six times and get three different answers. The flip exists; whether the voters do is less clear.`,
      `${b} closes the bedroom door and says, “If we do this, we all do it.” ${d} immediately asks who “we” includes.`,
      `${a} pitches evicting ${target} as the obvious move. ${b} agrees too fast. ${d} leaves the room wondering which of them is setting the other up.`,
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
    const text=pick([
      `${a}'s impression of ${b} is so exact that ${b} laughs first and worries later. ${d} requests an encore with more diary-room pacing.`,
      `${a} turns dinner into an awards show. ${b} wins “Most Likely to Say This Isn't a Strategy Meeting During a Strategy Meeting” and does not clap.`,
      `${a} reenacts ${b}'s veto speech using a dish towel as a cape. The room collapses. ${b} smiles with only the television half of their face.`,
      `${a}'s joke about ${b} lands perfectly with everyone except ${b}. The laughter ends; the footage does not.`,
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
      `${a} goes to the storage room for batteries and stays there crying beside the paper towels. ${b} enters, backs out, then returns without pretending not to have seen.`,
      `${a} says the house is getting to them. ${b} does not offer strategy, only the last clean towel and enough silence to make the room feel private.`,
      `${b} finds ${a} staring into the freezer. “I miss normal food,” ${a} says, meaning several things at once.`,
      `${a} finally admits the block is frightening. ${b} sits on a crate of cereal and lets the cameras wait for a cleaner sentence.`,
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
      `${a} opens the HOH-room door without knocking. ${b} and ${d} are sitting six feet apart with four empty chairs between them. Somehow that looks guiltier.`,
      `${a} walks into the bedroom; ${b} says “perfect timing” with the voice people use for terrible timing. ${d} starts discussing laundry at strategic speed.`,
      `${a} joins ${b} and ${d} on the couch and refuses to leave first. The conversation about weather lasts eleven punishing minutes.`,
      `${b} hides the chess pieces when ${a} approaches, as though the board itself contains the plan. ${a} notices the empty table before the smiles.`,
    ],rng);
    api.addBond(b,d,.4); api.suspicion(a,b,2); api.suspicion(a,d,2); api.remember(a,b,'closed-door-meeting',2,{ with:d });
    return result(text,[a,b,d],'MEETING CRASHED','purple');
  },
};

const silentStandoff = {
  id:'editorial-silent-standoff', category:'social',
  weight:(h,c) => h.length>=4 ? fit(c,1.8) : 0,
  fire(h,c,api,rng) {
    const a=actor(h,rng), b=[...h].filter(n=>n!==a).sort((x,y)=>bond(a,x)-bond(a,y))[0];
    const text=pick([
      `${a} makes coffee for everyone except ${b}. ${b} makes eye contact while pouring a cup from the same pot. Nobody says the thing the whole kitchen just watched.`,
      `${a} and ${b} clean opposite ends of the counter in total silence until there is no counter left and neither is willing to leave.`,
      `${b} asks the room a question. ${a} answers the room. The room would like to be removed from the conversation.`,
      `${a} moves one seat when ${b} sits down. ${b} moves one seat closer. The backyard goes quiet for a game with no stated rules.`,
    ],rng);
    api.addBond(a,b,-.7); api.remember(a,b,'cold-war',2,{}); if(!targetOf(a)) api.setTarget(a,b,'personal standoff');
    return result(text,[a,b],'COLD WAR','red');
  },
};

export const EDITORIAL_SOCIAL_EVENTS=[bedroomPolitics,interruptedWhisper,kitchenAfterDark,secretSpill,hohOrbit,apologyTour,poolsideSpark,voteFlipRoom,houseRoast,storageRoomBreakdown,meetingCrash,silentStandoff];
export default EDITORIAL_SOCIAL_EVENTS;
