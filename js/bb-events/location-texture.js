// One consequence-bearing slice of house life for every supported camera.
import { archetype, band, beatsInvolving, bond, closestTo, furthestFrom, pStats, targetOf } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const others = (house, ...skip) => house.filter(n => n && !skip.includes(n));
const quiet = pool => [...pool].sort((a,b) => beatsInvolving(a)-beatsInvolving(b));
const first = pool => quiet(pool)[0] || null;
const out = (scene, players, badgeText, badgeClass) => ({ scene, players:players.filter(Boolean), badgeText, badgeClass });
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
    const scene=makeScene('texture.kitchen',{a:cook,b:learner},{ending:'scene'},[],'kitchen');
    api.addBond(cook,learner,1.1); api.remember(learner,cook,'kindness',1,{about:'helped with dinner'});
    return out(scene,[cook,learner],'DINNER DUTY','green');
  },
};

const backyardGame = {
  id:'texture-backyard-game', category:'house-life', location:'backyard',
  weight:(h,c)=>h.length>=6?fit(c,2.9):0,
  fire(h,c,api) {
    const [a,b,d]=quiet(h).slice(0,3);
    const scene=makeScene('texture.backyard',{a,b,c:d},{ending:'scene'},[],'backyard');
    api.addBond(a,b,.5); api.addBond(b,d,.5); api.addBond(a,d,.4); api.popDelta(d,1);
    return out(scene,[a,b,d],'BACKYARD LEAGUE','green');
  },
};

const bedroomSnoring = {
  id:'texture-bedroom-snoring', category:'house-life', location:'bedroom',
  weight:(h,c)=>h.length>=4?fit(c,2.7):0,
  fire(h,c,api) {
    const sleeper=first(h), exhausted=furthestFrom(sleeper,others(h,sleeper))||first(others(h,sleeper));
    const scene=makeScene('texture.snoring',{a:sleeper,b:exhausted},{ending:'scene'},[],'bedroom');
    api.addBond(exhausted,sleeper,-.7); api.remember(exhausted,sleeper,'irritation',1,{about:'kept the bedroom awake'});
    return out(scene,[sleeper,exhausted],'NO SLEEP','grey');
  },
};

const washroomHaircut = {
  id:'texture-washroom-haircut', category:'house-life', location:'washroom',
  weight:(h,c)=>h.length>=4?fit(c,2.5):0,
  fire(h,c,api) {
    const stylist=first(h.filter(n=>pStats(n).mental>=5||pStats(n).social>=6))||first(h);
    const client=first(others(h,stylist));
    const works=pStats(stylist).mental+pStats(stylist).social>=11;
    const scene=makeScene('texture.haircut',{a:stylist,b:client},{ending:works?'good':'bad'},[],'washroom');
    api.addBond(stylist,client,works?1:-1.2); api.remember(client,stylist,works?'kindness':'embarrassment',works?1:2,{about:'house haircut'}); api.popDelta(stylist,works?1:-1);
    return out(scene,[stylist,client],works?'FRESH CUT':'HAT SEASON',works?'green':'red');
  },
};

const livingRoomTrial = {
  id:'texture-living-room-trial', category:'house-life', location:'living-room',
  weight:(h,c)=>h.length>=6?fit(c,2.9):0,
  fire(h,c,api) {
    const host=first(h.filter(n=>['wildcard','chaos-agent','social-butterfly'].includes(archetype(n))))||first(h);
    const accused=first(others(h,host)), witness=first(others(h,host,accused));
    const funny=pStats(accused).temperament>=5&&bond(accused,host)>-2;
    const scene=makeScene('texture.trial',{a:host,b:accused,c:witness},{ending:funny?'fun':'bad'},[],'living-room');
    api.addBond(host,accused,funny?.8:-1.2); api.addBond(host,witness,.4); api.popDelta(host,funny?1:-1);
    if(!funny) api.remember(accused,host,'humiliation',2,{about:'living-room joke'});
    return out(scene,[host,accused,witness],funny?'HOUSE COURT':'BIT GOES BAD',funny?'green':'red');
  },
};

const pantryNameDrop = {
  id:'texture-pantry-name-drop', category:'deals', location:'pantry',
  weight:(h,c)=>h.length>=6?fit(c,3.1):0,
  fire(h,c,api) {
    const speaker=first(h), listener=closestTo(speaker,others(h,speaker))||first(others(h,speaker));
    const target=furthestFrom(speaker,others(h,speaker,listener))||first(others(h,speaker,listener));
    const scene=makeScene('texture.namedrop',{a:speaker,b:listener,c:target},{ending:'scene'},[],'pantry');
    api.addBond(speaker,listener,.5); api.suspicion(target,speaker,1.8); api.remember(target,speaker,'overheard-plot',2,{with:listener});
    return out(scene,[speaker,listener,target],'NAME OVERHEARD','purple');
  },
};

const diaryRoomRant = {
  id:'texture-diary-room-rant', category:'social', location:'diary-room',
  weight:(h,c)=>h.length>=4?fit(c,2.7):0,
  fire(h,c,api) {
    const speaker=first(h.filter(n=>pStats(n).temperament<=5||targetOf(n)))||first(h);
    const enemy=targetOf(speaker)||furthestFrom(speaker,others(h,speaker));
    const scene=makeScene('texture.rant',{a:speaker},{ending:'scene',target:enemy},[],'diary-room');
    api.setTarget(speaker,enemy,'could not let it go in the Diary Room'); api.suspicion(speaker,enemy,.8); api.remember(speaker,enemy,'resolve',2,{said:'in the Diary Room'});
    return out(scene,[speaker],'DIARY ROOM RANT','red');
  },
};

const hohLetter = {
  id:'texture-hoh-letter', category:'social', location:'hoh-room', oncePerWeek:true,
  weight:(h,c)=>c?.hoh&&h.includes(c.hoh)&&h.length>=4?fit(c,2.6):0,
  fire(h,c,api) {
    const hoh=c.hoh, guest=closestTo(hoh,others(h,hoh))||first(others(h,hoh));
    const scene=makeScene('texture.letter',{a:hoh,b:guest},{ending:'scene'},[],'hoh-room');
    api.addBond(hoh,guest,1.3); api.remember(hoh,guest,'emotional-support',2,{about:'shared the HOH letter'});
    return out(scene,[hoh,guest],'LETTER FROM HOME','green');
  },
};

export const LOCATION_TEXTURE_EVENTS=[kitchenLesson,backyardGame,bedroomSnoring,washroomHaircut,livingRoomTrial,pantryNameDrop,diaryRoomRant,hohLetter];
export default LOCATION_TEXTURE_EVENTS;
