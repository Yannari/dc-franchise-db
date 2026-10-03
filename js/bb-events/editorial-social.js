// Big Brother house-life scenes: ordinary rooms becoming strategic territory.
// Each event has four written cuts and leaves state behind for later decisions.
import { bond, closestTo, couldRomance, pStats, targetOf } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

/** Which room a scene happens in: by hash, never a die. */
function _room(rooms, ctx, ...people) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return rooms[hash % rooms.length];
}

const pick = (list, rng) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
const actor = (house, rng) => pick(house, rng);
const other = (house, name, rng) => pick(house.filter(n => n !== name), rng);
const trio = (house, rng) => {
  const a = actor(house, rng); const b = other(house, a, rng); const c = other(house, a, rng);
  return [a, b, c === b ? house.find(n => n !== a && n !== b) : c];
};
const result = (scene, players, badgeText, badgeClass = 'blue') => ({ scene, players:players.filter(Boolean), badgeText, badgeClass });
const fit = (ctx, base = 2) => ['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act) ? base * .3 : base;

const bedroomPolitics = {
  id:'editorial-bedroom-politics', category:'social',
  weight:(h, c) => h.length >= 5 ? fit(c, 2.2) : 0,
  fire(h, c, api, rng) {
    const [a,b,d] = trio(h, rng);
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene = makeScene('editorial.bedroom',{a,b,c:d},{ending:'scene'},[],'bedroom');
    api.addBond(a,b,-.8); api.suspicion(d,a,1); api.remember(b,a,'territorial',1,{ room:'bedroom' });
    return result(scene,[a,b,d],'BEDROOM WAR','red');
  },
};

const interruptedWhisper = {
  id:'editorial-interrupted-whisper', category:'social',
  weight:(h,c) => h.length >= 6 ? fit(c, 2.6) : 0,
  fire(h,c,api,rng) {
    const [a,b,d] = trio(h,rng);
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene = makeScene('editorial.whisper',{a,b,c:d},{ending:'scene'},[],_room(['kitchen','bedroom','living-room'],c,a,b));
    api.addBond(a,b,.5); api.suspicion(d,a,2.2); api.suspicion(d,b,1.6); api.remember(d,a,'caught-whispering',2,{ with:b });
    return result(scene,[a,b,d],'CAUGHT TALKING','purple');
  },
};

const kitchenAfterDark = {
  id:'editorial-kitchen-after-dark', category:'social',
  weight:(h,c) => h.length >= 4 ? fit(c, 2.5) : 0,
  fire(h,c,api,rng) {
    const [a,b,d] = trio(h,rng);
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene = makeScene('editorial.latenight',{a,b,c:d},{ending:'scene'},[],'kitchen');
    api.addBond(a,b,1.1); api.addBond(a,d,.5); api.addBond(b,d,.5);
    return result(scene,[a,b,d],'2 A.M. CREW','green');
  },
};

const secretSpill = {
  id:'editorial-secret-spill', category:'social',
  weight:(h,c) => h.length >= 5 ? fit(c, 2.1) : 0,
  fire(h,c,api,rng) {
    const [a,b,d] = trio(h,rng);
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene = makeScene('editorial.spill',{a,b,c:d},{ending:'scene'},[],_room(['kitchen','living-room','backyard','bedroom'],c,a,b));
    api.addBond(a,b,-1.2); api.suspicion(d,a,2); api.remember(b,a,'leaked-information',3,{ witness:d });
    return result(scene,[a,b,d],'SECRET SPILLED','red');
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
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene=makeScene('editorial.orbit',{a,b,c:hoh},{ending:'scene'},[],'hoh-room');
    api.addBond(a,hoh,.8); api.suspicion(b,a,1.8); api.remember(b,a,'hoh-orbit',2,{ hoh });
    return result(scene,[hoh,a,b],'HOH TRAFFIC','gold');
  },
};

const apologyTour = {
  id:'editorial-apology-tour', category:'social',
  weight:(h,c) => h.length >= 4 ? fit(c, 1.9) : 0,
  fire(h,c,api,rng) {
    const a=actor(h,rng); const b=[...h].filter(n=>n!==a).sort((x,y)=>bond(a,x)-bond(a,y))[0];
    rng(); // the draw the old line pick made: the engine's dice must not move
    const lands=pStats(a).social + rng()*6 >= 8;
    const scene=makeScene('editorial.apology',{a,b},{ending:lands?'lands':'fails'},[],_room(['kitchen','living-room','backyard','bedroom'],c,a,b));
    api.addBond(a,b,lands?1.2:-.4); api.remember(b,a,lands?'made-amends':'bad-apology',lands?1:2,{});
    return result(scene,[a,b],lands?'APOLOGY LANDS':'NOT BUYING IT',lands?'green':'red');
  },
};

const poolsideSpark = {
  id:'editorial-poolside-spark', category:'social',
  weight:(h,c) => h.length >= 5 && h.some(a=>h.some(b=>a!==b&&couldRomance(a,b))) ? fit(c, 1.8) : 0,
  fire(h,c,api,rng) {
    const pairs=[]; for(const a of h) for(const b of h) if(a<b&&couldRomance(a,b)) pairs.push([a,b]);
    const [a,b]=pick(pairs,rng);
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene=makeScene('editorial.spark',{a,b},{ending:'scene'},[],'backyard');
    // This is chemistry, not yet a relationship. Turning one flirtatious
    // afternoon into a showmance made later "define it" scenes nonsensical.
    api.addBond(a,b,1.1); api.remember(a,b,'romantic-spark',1,{}); api.remember(b,a,'romantic-spark',1,{});
    return result(scene,[a,b],'CHEMISTRY','pink');
  },
};

const voteFlipRoom = {
  id:'editorial-vote-flip-room', category:'social',
  weight:(h,c) => c?.act==='campaign' && (c.nominees||[]).length===2 && h.length>=6 ? 3.4 : 0,
  fire(h,c,api,rng) {
    const noms=c.nominees, [a,b,d]=trio(h.filter(n=>!noms.includes(n)),rng), target=pick(noms,rng);
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene=makeScene('editorial.flip',{a,b,c:d},{ending:'scene',target},[],'bedroom');
    api.addBond(a,b,.5); api.suspicion(d,a,1.2); api.setTarget(a,target,'late vote flip'); api.remember(b,a,'vote-flip-pitch',2,{ target });
    return result(scene,[a,b,d,target],'VOTES IN MOTION','purple');
  },
};

const houseRoast = {
  id:'editorial-house-roast', category:'social',
  weight:(h,c) => h.length>=5 ? fit(c,2) : 0,
  fire(h,c,api,rng) {
    const [a,b,d]=trio(h,rng); const lands=pStats(a).social+rng()*6>=8;
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene=makeScene('editorial.roast',{a,b,c:d},{ending:lands?'lands':'cuts'},[],_room(['kitchen','living-room'],c,a,b));
    api.addBond(a,b,lands?.5:-1.1); api.addBond(a,d,.4); api.remember(b,a,lands?'shared-joke':'humiliated',lands?1:2,{});
    return result(scene,[a,b,d],lands?'HOUSE IN TEARS':'JOKE CUTS DEEP',lands?'green':'red');
  },
};

const storageRoomBreakdown = {
  id:'editorial-storage-room-breakdown', category:'social',
  weight:(h,c) => h.length>=4 ? fit(c,1.7) : 0,
  fire(h,c,api,rng) {
    const a=actor(h,rng), b=closestTo(a,h.filter(n=>n!==a))||other(h,a,rng);
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene=makeScene('editorial.breakdown',{a,b},{ending:'scene'},[],'pantry');
    api.addBond(a,b,1.5); api.remember(a,b,'emotional-support',3,{}); api.popDelta(b,.5);
    return result(scene,[a,b],'A REAL MOMENT','green');
  },
};

const meetingCrash = {
  id:'editorial-meeting-crash', category:'social',
  weight:(h,c) => h.length>=7 ? fit(c,2.2) : 0,
  fire(h,c,api,rng) {
    const [a,b,d]=trio(h,rng);
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene=makeScene('editorial.meeting',{a,b,c:d},{ending:'scene'},[],'bedroom');
    api.addBond(b,d,.4); api.suspicion(a,b,2); api.suspicion(a,d,2); api.remember(a,b,'closed-door-meeting',2,{ with:d });
    return result(scene,[a,b,d],'MEETING CRASHED','purple');
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
    rng(); // the draw the old line pick made: the engine's dice must not move
    const scene=makeScene('editorial.standoff',{a,b},{ending:'scene'},[],'kitchen');
    api.addBond(a,b,-.7); api.remember(a,b,'cold-war',2,{}); if(!targetOf(a)) api.setTarget(a,b,'personal standoff');
    return result(scene,[a,b],'COLD WAR','red');
  },
};

export const EDITORIAL_SOCIAL_EVENTS=[bedroomPolitics,interruptedWhisper,kitchenAfterDark,secretSpill,hohOrbit,apologyTour,poolsideSpark,voteFlipRoom,houseRoast,storageRoomBreakdown,meetingCrash,silentStandoff];
export default EDITORIAL_SOCIAL_EVENTS;
