// js/chal/walk-like-an-egyptian.js — Walk Like an Egyptian (pre-merge tribe challenge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
// _pickUnique: tracks used items per tag so the same line doesn't repeat for the same player/context.
const _pickUsed = {};
function _pickUnique(arr, tag) {
  if (!arr?.length) return null;
  if (!_pickUsed[tag]) _pickUsed[tag] = new Set();
  let avail = arr.filter(x => !_pickUsed[tag].has(x));
  if (!avail.length) { _pickUsed[tag].clear(); avail = arr; }
  const choice = avail[Math.floor(Math.random() * avail.length)];
  _pickUsed[tag].add(choice);
  return choice;
}
function _resetPickCache() { for (const k in _pickUsed) delete _pickUsed[k]; }
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function portrait(name, size = 42) {
  const sl = slug(name);
  return `<img src="assets/avatars/${sl}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function canScheme(name) {
  const a = arch(name);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════

// ── HOST LINES ──
const HOST_TEXT = {
  intro: [
    h => `${h} stands at the base of a massive sandstone pyramid. "Welcome to Egypt, campers. Well, the Total Drama version. Less ancient. Equally deadly."`,
    h => `"Behind me is a pyramid. Inside it are scarabs, mummies, and probably tetanus." ${h} gestures grandly. "You're going through it. Over it. Or both."`,
    h => `${h} adjusts his sunglasses. "Three phases. Pyramid. Desert. Nile. Last tribe standing goes to tribal. First one across the finish gets immunity. Questions? Don't care. Go."`,
    h => `"Today's challenge spans the entire Egyptian set!" ${h} waves at the pyramid, the desert beyond, and the river in the distance. "Try not to die. I just had this place built."`,
    h => `${h} holds up a papyrus scroll. "Pyramid. Desert. River. Three phases. Two tribes get immunity. One gets tribal council. And somebody gets a mummified dog. Don't ask."`,
  ],
  phase1: [
    h => `"Phase one!" ${h} points at the pyramid. "Over or under. Climbers go over the top. Tunnelers go through the guts. Both paths have... surprises."`,
    h => `${h} grins. "You can climb over the pyramid — fast but dangerous — or crawl through the tunnels. The tunnels have three doors, by the way. Two of them are traps."`,
    h => `"Choose wisely, campers. Over the top means sun, wind, and a very long fall if you slip. Under means darkness, scarabs, and things that go bump." ${h} shrugs. "Your call."`,
    h => `${h} leans against the pyramid. "Climbers, you've got a hundred-foot ascent and a slide down. Tunnelers, you've got ancient booby traps and bad lighting. Choose your poison."`,
    h => `"I love this part," ${h} says. "Watching people realize both options are terrible."`,
  ],
  phase2: [
    h => `"Phase two — desert trek!" ${h} tosses a stick to the first-place tribe. "Winners get the stick. Second place gets a goat. Last place gets the camel. Good luck getting THAT across the Nile later."`,
    h => `${h} points at the endless sand dunes. "Navigate to the Nile. First tribe there gets a head start. Last tribe gets to think about what they did wrong."`,
    h => `"Out there is sand, sun, scarabs, and exactly zero shade." ${h} grins at the last-place tribe. "At least your camel provides shade. Too bad it won't fit in a boat."`,
    h => `${h} squints at the horizon. "The Nile is... somewhere out there. Your navigator better be smart, because GPS hasn't been invented yet. In this challenge, anyway."`,
    h => `"One stick, one goat, one camel." ${h} holds up three fingers. "The stick is a sorcerer's divining rod — it'll help you find the Nile. The camel? It'll help you carry regret."`,
  ],
  phase3: [
    h => `"Final phase!" ${h} stands at the riverbank. "Build a basket boat, load your animal, cross the Nile. Oh, and there are crocodiles. Real ones. Chef's pets."`,
    h => `${h} gestures at the murky river. "Weave a boat. Row across. Don't get eaten. Simple, right?" A croc tail splashes. "Maybe not simple."`,
    h => `"Last leg, campers. You need a boat, you need your animal, and you need to not become crocodile food." ${h} checks his watch. "Clock's ticking."`,
    h => `${h} tosses reeds at the tribes. "Weave. Load. Row. Survive. First tribe across wins. Last tribe gets to explain to their torch why they're here tonight."`,
    h => `"I've got front-row seats and popcorn." ${h} settles into a chair on the far bank. "The crocodiles are hungry. The river is wide. And your boats look terrible already."`,
  ],
  finish1st: [
    (h, t) => `"${t} crosses first!" ${h} waves them ashore. "Immunity! You're safe tonight."`,
    (h, t) => `${h} slow-claps as ${t} hits the beach. "First place. Not even close. Immunity is yours."`,
    (h, t) => `"${t}! Welcome to the winners' circle!" ${h} drapes immunity around their representative. "Nobody's going home from your tribe tonight."`,
    (h, t) => `${h} nods approvingly. "${t} — across the Nile, immunity secured. Well played."`,
    (h, t) => `"And ${t} is SAFE!" ${h} announces. "Take a seat. Enjoy watching the others sweat."`,
  ],
  finish2nd: [
    (h, t) => `"${t} sneaks in second!" ${h} gestures them ashore. "Immunity for you too. Barely."`,
    (h, t) => `${h} checks ${t}'s boat. "It's held together with hope and reeds, but you made it. Immunity."`,
    (h, t) => `"${t} — second place but still safe." ${h} tosses them a towel. "Dry off. You're not going to tribal."`,
    (h, t) => `"Close call, ${t}." ${h} grins. "But close counts in horseshoes and Nile crossings. You're immune."`,
  ],
  finishLast: [
    (h, t) => `${h} watches ${t} stagger ashore. "Dead last. ${t}, I'll see you at tribal council tonight."`,
    (h, t) => `"${t}." ${h} shakes his head. "Not your day. Tribal council. Someone's going home."`,
    (h, t) => `${h} doesn't even look at ${t}'s boat. "Tribal council. Tonight. Bring your excuses."`,
    (h, t) => `"Well, ${t}, that was..." ${h} pauses. "...exactly as bad as it looked. Tribal tonight."`,
    (h, t) => `${h} tosses a torch at ${t}. "You'll need this later. Tribal council. Pack your bags."`,
  ],
};

// ── PHASE 1: OVER PATH ──
const OVER_ASCENT_TEXT = {
  good: [
    (n, pr) => `${n} scales the pyramid like ${pr.sub} was born on a cliff face. Hands find every groove, feet never slip. Smooth as sandstone.`,
    (n, pr) => `${n} attacks the ascent with raw power, hauling ${pr.ref} up block after block. The sun beats down but ${pr.sub} doesn't slow.`,
    (n, pr) => `Steady and relentless, ${n} climbs. No wasted motion, no hesitation. ${pr.Sub} reaches the top with energy to spare.`,
    (n, pr) => `${n} practically runs up the pyramid face. ${pr.posAdj} teammates below watch in disbelief as ${pr.sub} summits in record time.`,
    (n, pr) => `The stones are hot enough to cook on, but ${n} doesn't care. ${pr.Sub} climbs with a focus that borders on obsession.`,
    (n, pr) => `${n} finds a rhythm — grab, push, breathe — and eats up the pyramid one tier at a time. The altitude doesn't bother ${pr.obj} at all.`,
  ],
  bad: [
    (n, pr) => `${n} is three tiers up and already breathing hard. ${pr.posAdj} hands keep slipping on the sun-baked stone.`,
    (n, pr) => `${n} slips. Catches ${pr.ref}. Slips again. The pyramid is winning this fight.`,
    (n, pr) => `Every time ${n} looks down, ${pr.sub} freezes. Every time ${pr.sub} looks up, there's more pyramid. This is taking forever.`,
    (n, pr) => `${n}'s legs are shaking by the halfway point. The heat, the height, the sand in ${pr.posAdj} eyes — it all adds up.`,
    (n, pr) => `${n} grabs a loose stone and almost takes a header. ${pr.Sub} clings to the face, breathing hard, going nowhere fast.`,
    (n, pr) => `The pyramid doesn't care about ${n}'s feelings. ${pr.Sub} slides back two tiers for every three ${pr.sub} climbs.`,
  ],
  comedy: [
    (n, pr) => `${n} does a full split between two blocks and just... hangs there. "${pr.Sub} can't feel ${pr.posAdj} legs anymore."`,
    (n, pr) => `${n} accidentally grabs a lizard instead of a handhold. The screaming is mutual.`,
    (n, pr) => `${n} reaches the top of one tier and celebrates. Then realizes there are forty more. The celebration dies.`,
    (n, pr) => `A hawk swoops at ${n}'s head. ${pr.Sub} flails, loses two tiers of progress, and gains a new fear.`,
    (n, pr) => `${n} gets sunscreen in ${pr.posAdj} eyes and climbs sideways for three minutes before anyone tells ${pr.obj}.`,
    (n, pr) => `${n} discovers that pyramid stones are approximately nine thousand degrees in direct sun. ${pr.posAdj} palms will never be the same.`,
  ],
};

const OVER_DESCENT_SURF = {
  success: [
    (n, pr) => `${n} spots a smooth channel of stone and goes for it — surfing the pyramid face on ${pr.posAdj} feet. Wind in ${pr.posAdj} hair, sand flying, and somehow still upright at the bottom.`,
    (n, pr) => `${n} leaps onto the descent channel and rides it like a wave. ${pr.Sub} hits the ground running, barely breaking stride. Incredible.`,
    (n, pr) => `No hesitation from ${n}. ${pr.Sub} launches off the summit and slides the entire descent on ${pr.posAdj} back, catching air on the bumps. Sticks the landing.`,
    (n, pr) => `${n} grins at the top, sits down, and pushes off. The slide is fifty feet of pure adrenaline, and ${pr.sub} nails the dismount.`,
    (n, pr) => `"WATCH THIS!" ${n} shouts — and proceeds to surf down the pyramid like it's a water park. ${pr.Sub} actually makes it look fun.`,
  ],
  fail: [
    (n, pr) => `${n} tries to surf the descent and immediately eats sand. ${pr.Sub} tumbles, rolls, and lands in a heap at the bottom. Everything hurts.`,
    (n, pr) => `${n} catches an edge two seconds into the surf and goes cartwheeling. The landing is... not a landing. It's a crash.`,
    (n, pr) => `${n} starts the surf strong, but ${pr.posAdj} foot catches a crack and ${pr.sub} ragdolls the rest of the way down. Brutal.`,
    (n, pr) => `The surf starts well. Then ${n}'s balance goes. Then ${pr.posAdj} dignity goes. Then ${pr.sub} goes — face-first into the sand.`,
    (n, pr) => `${n} overshoots the channel and bounces off three tiers of stone before flopping into the sand. ${pr.Sub} is alive. Probably.`,
  ],
  collision: [
    (n, other, pr) => `${n} is mid-surf when ${other} cuts across ${pr.posAdj} line. They collide at speed — arms, legs, sand everywhere. Both go tumbling.`,
    (n, other, pr) => `${n} and ${other} pick the same descent channel. At the same time. The resulting crash echoes across the desert.`,
    (n, other, pr) => `${n} slams into ${other} on the slide down. They roll as a tangled ball of limbs for thirty feet before separating.`,
    (n, other, pr) => `"LOOK OUT!" Too late. ${n} plows into ${other} at full speed. Both wipe out spectacularly.`,
    (n, other, pr) => `${n} and ${other} meet in the middle of the descent. Violently. They sit in the sand afterward, glaring at each other.`,
  ],
};

const OVER_DESCENT_WALK = [
  (n, pr) => `${n} takes the safe route down, picking ${pr.posAdj} way carefully tier by tier. Slow, but ${pr.sub} reaches the bottom in one piece.`,
  (n, pr) => `No need to be a hero. ${n} walks the descent, using every handhold. ${pr.Sub} arrives intact while surfers tumble past.`,
  (n, pr) => `${n} watches someone surf past and wipe out. ${pr.Sub} decides walking is fine. Walking is great, actually.`,
  (n, pr) => `${n} climbs down methodically. It's not exciting. ${pr.Sub} doesn't care. ${pr.posAdj} bones are all where they started.`,
  (n, pr) => `Step by step, ${n} descends. ${pr.Sub} can hear the surfers screaming. ${pr.Sub} can also hear ${pr.ref} not screaming. Good trade.`,
];

const SUMMIT_VIEW = [
  (n, pr) => `From the summit, ${n} gets a panoramic view of the desert. ${pr.Sub} spots landmarks, water, potential shortcuts. This could be useful later.`,
  (n, pr) => `${n} pauses at the top to scan the horizon. The Nile glints in the distance. ${pr.Sub} memorizes the route before descending.`,
  (n, pr) => `The summit view is breathtaking. ${n} takes it all in — sand dunes, oasis, river bend. ${pr.Sub} knows exactly where to go now.`,
  (n, pr) => `${n} shields ${pr.posAdj} eyes at the peak and studies the landscape. "I can see the path." ${pr.Sub} files it away for Phase 2.`,
  (n, pr) => `At the apex, ${n} spots something the tunnelers won't — a clear line through the dunes toward the river. ${pr.Sub} commits it to memory.`,
];

// ── PHASE 1: UNDER PATH ──
const UNDER_DOOR_TEXT = {
  correct: [
    (n, door, pr) => `${n} studies all three doors. Something about Door ${door} feels right. ${pr.Sub} pushes it open — clear passage. Good instincts.`,
    (n, door, pr) => `${n} taps each door, listens. Door ${door}. "${pr.Sub} can feel the airflow." Smart. The passage opens easily.`,
    (n, door, pr) => `Logic, intuition, or luck — whatever it is, ${n} picks Door ${door} and finds the fastest route through the tunnels.`,
    (n, door, pr) => `${n} doesn't hesitate. Door ${door}. The torchlight reveals a clear passage ahead. ${pr.Sub} grins and moves.`,
    (n, door, pr) => `"Door ${door}," ${n} says with confidence. It opens to a straight shot. Everyone behind ${pr.obj} breathes easier.`,
  ],
  wrong: [
    (n, door, pr) => `${n} picks Door ${door} — and immediately triggers a dead end. Sand pours in. ${pr.Sub} has to backtrack and try again.`,
    (n, door, pr) => `Door ${door} looked promising. It wasn't. ${n} walks face-first into a wall of cobwebs and has to find an alternate route.`,
    (n, door, pr) => `${n} pushes through Door ${door} and falls three feet into a lower tunnel. Wrong door, wrong direction, wrong everything.`,
    (n, door, pr) => `"Definitely Door ${door}." ${n} opens it. Bats. So many bats. ${pr.Sub} slams it shut and picks another.`,
    (n, door, pr) => `${n} commits to Door ${door}. The tunnel narrows, twists, and dead-ends at a painting of ${host()} giving a thumbs-down. Wrong door.`,
  ],
};

const UNDER_TRAP_SCARAB = {
  pass: [
    (n, pr) => `Scarabs pour from a crack in the wall. ${n} grits ${pr.posAdj} teeth and pushes through, brushing them off without slowing down.`,
    (n, pr) => `${n} feels the scarabs crawling but doesn't panic. ${pr.Sub} powers through the swarm with steady breathing and kept ${pr.posAdj} composure.`,
    (n, pr) => `The scarabs come in waves. ${n} locks in — one foot in front of the other — and outlasts them. "That was disgusting. But I'm through."`,
    (n, pr) => `${n} wraps ${pr.posAdj} face in ${pr.posAdj} shirt and charges straight through the scarab swarm. Gross, but effective.`,
    (n, pr) => `"Just bugs," ${n} mutters, wading through the clicking, crawling mass. ${pr.Sub} emerges on the other side with only minor emotional damage.`,
  ],
  fail: [
    (n, pr) => `The scarabs hit ${n}'s legs and ${pr.sub} locks up. Frozen. ${pr.Sub} loses precious time swatting at ${pr.ref} before finally staggering through.`,
    (n, pr) => `${n} sees the scarabs and retreats. Then advances. Then retreats again. The back-and-forth costs ${pr.obj} dearly.`,
    (n, pr) => `${n} screams when the scarabs reach ${pr.posAdj} arms. ${pr.Sub} runs — wrong direction — and has to double back after the swarm passes.`,
    (n, pr) => `The scarab swarm overwhelms ${n}. ${pr.Sub} drops ${pr.posAdj} torch, panics in the dark, and doesn't find the exit for ages.`,
    (n, pr) => `${n} tries to outrun the scarabs and trips on an uneven stone. ${pr.Sub} goes down hard, and the scarabs go up enthusiastically.`,
  ],
};

const UNDER_TRAP_MUMMY = {
  pass: [
    (n, pr) => `A mummy lurches from an alcove. ${n} doesn't even flinch. "Nice costume." ${pr.Sub} walks right past.`,
    (n, pr) => `The mummy jump-scare gets a raised eyebrow from ${n}. "Seriously?" ${pr.Sub} shoves past it and keeps moving.`,
    (n, pr) => `${n} sees the mummy coming and sidesteps it like a matador. Zero reaction time lost. Cold-blooded.`,
    (n, pr) => `The mummy groans. ${n} groans louder. "Move." The mummy steps aside. ${pr.Sub} continues unbothered.`,
    (n, pr) => `${n} spots the mummy before it springs. ${pr.Sub} ducks under its arms and clears the trap without breaking stride.`,
  ],
  fail: [
    (n, pr) => `The mummy drops from the ceiling and ${n} screams. Full volume. ${pr.Sub} runs the wrong way for twenty seconds before recovering.`,
    (n, pr) => `${n} rounds a corner and goes face-to-bandage with the mummy. ${pr.Sub} backpedals so fast ${pr.sub} trips over ${pr.posAdj} own feet.`,
    (n, pr) => `"MUMMY! ACTUAL MUMMY!" ${n} is climbing the walls. Literally. ${pr.Sub} ends up wedged in a corner for a solid minute.`,
    (n, pr) => `The mummy pops out and ${n} freezes. Just stands there. The mummy stands there. It's a standoff nobody asked for.`,
    (n, pr) => `${n} sees the mummy and throws ${pr.posAdj} torch at it. Now ${pr.sub}'s alone in the dark with a mummy. Great plan.`,
  ],
};

const UNDER_TRAP_COLLAPSE = {
  pass: [
    (n, pr) => `The tunnel starts crumbling. ${n} sprints, ducking debris, and dives through the gap before it seals. Close. Very close.`,
    (n, pr) => `Stones fall. ${n} reads the pattern and weaves through the collapse like ${pr.sub}'s done this before. ${pr.Sub} clears it clean.`,
    (n, pr) => `${n} hears the rumble and moves. Fast. ${pr.posAdj} instincts fire perfectly — ${pr.sub} slides under a falling block and out the other side.`,
    (n, pr) => `The ceiling gives way. ${n} doesn't look up. ${pr.Sub} just runs. The rubble crashes behind ${pr.obj} by inches.`,
    (n, pr) => `${n} shoulder-checks through the collapsing passage with pure force. Stones bounce off ${pr.posAdj} back. ${pr.Sub} doesn't stop.`,
  ],
  fail: [
    (n, pr) => `The collapse catches ${n} mid-stride. ${pr.Sub}'s buried up to ${pr.posAdj} waist in rubble and has to dig ${pr.ref} out. Major time loss.`,
    (n, pr) => `${n} hesitates at the wrong moment. A stone clips ${pr.posAdj} shoulder and ${pr.sub} stumbles. By the time ${pr.sub} recovers, ${pr.sub}'s walled off.`,
    (n, pr) => `Rocks everywhere. ${n} tries to dodge but catches a glancing blow and goes down. ${pr.Sub} crawls through the debris, slow and battered.`,
    (n, pr) => `The passage collapses and ${n} barely avoids being crushed. ${pr.Sub} has to find an alternate route through the rubble. Costly detour.`,
    (n, pr) => `${n} freezes as the tunnel crumbles around ${pr.obj}. ${pr.Sub} survives, but ${pr.sub}'s trapped for long, painful minutes before finding a gap.`,
  ],
};

const UNDER_MUMMIFIED_DOG = [
  (n, pr) => `${n} finds something in an alcove. A mummified dog. Ancient. Creepy. ${pr.Sub} picks it up. "...why did I pick it up?" Too late. The curse is on.`,
  (n, pr) => `Deep in the tunnels, ${n} stumbles over a wrapped bundle. It's a mummified dog. ${pr.Sub} unwraps part of it, curious. The air goes cold. Cursed.`,
  (n, pr) => `${n} notices glinting eyes in a wall niche. A mummified dog, perfectly preserved. ${pr.Sub} touches it. Bad idea. ${pr.Sub} can feel something change.`,
  (n, pr) => `"What is THAT?" ${n} kneels next to a mummified dog. ${pr.Sub} tries to move it. It crumbles slightly. A cold wind blows through the tunnel. Cursed.`,
  (n, pr) => `${n} finds the mummified dog in the deepest part of the tunnel. It's wrapped in ancient linen. ${pr.Sub} pockets a fragment. Mistake. Big mistake.`,
];

// ── PHASE 2: DESERT TREK ──
const REWARD_TEXT = {
  camel: [
    t => `${t} gets the camel. It spits at them immediately. Great. Now they have to haul this beast across the desert AND fit it in a boat later.`,
    t => `"A CAMEL?" ${t} stares at the massive beast. "How are we supposed to get that on a boat?!" Chris shrugs. The camel sits down.`,
    t => `The camel regards ${t} with suspicion. The shade is nice, sure, but this thing weighs a literal ton. The Nile crossing is going to be a nightmare.`,
    t => `${t}'s camel is surly, smelly, and enormous. At least it blocks the sun. Too bad it'll also block the entire boat.`,
    t => `${t} gets the short end of the camel. "Last place gets a two-thousand-pound anchor. Thanks, Chris." The camel spits in agreement.`,
  ],
  goat: [
    t => `${t} gets the goat. It's... enthusiastic. It also keeps trying to eat their map. But hey, at least it fits in a boat.`,
    t => `The goat headbutts the first person who tries to lead it. After that, they reach an understanding. ${t} sets off.`,
    t => `"A goat?" ${t} looks at the goat. The goat looks back. "Fine. Let's go." At least it won't sink their boat.`,
    t => `${t}'s goat is small, angry, and surprisingly fast. Middle of the road — not a handicap, not an advantage.`,
    t => `The goat bleats at ${t}. ${t} bleats back. The bond is formed. It's no divining rod, but it won't drown them either.`,
  ],
  stick: [
    t => `${t} gets the stick. "A... stick?" They look at Chris. Chris winks. There's something about this stick.`,
    t => `"First place gets a STICK?" ${t} holds it up, confused. It's oddly warm. Vibrating? "Just trust the process," Chris says.`,
    t => `${t} takes the stick. It's not much to look at. But winners get it for a reason — and they'll find out why in the desert.`,
    t => `The stick looks unimpressive. ${t} almost drops it. But Chris's grin says there's more to this reward than meets the eye.`,
    t => `"The sorcerer's stick," Chris calls it. ${t} holds it skeptically. It's a stick. A weird, slightly warm stick. For now.`,
  ],
  // Tribe reactions to their reward — said BEFORE they realize what it actually does
  reactionStick: [
    (n, pr, t) => `"WE WON and we get a STICK?!" ${n} is incensed. "${t} BEAT both other tribes and our prize is FIREWOOD?!" The tribe glares at Chris. Chris just smiles.`,
    (n, pr, t) => `${n} stares at the stick. Then at Chris. Then at the camel the LAST PLACE tribe is loading. "...is this a prank?" Chris winks. ${pr.Sub} doesn't trust that wink.`,
    (n, pr, t) => `"Are you KIDDING me?" ${n} drops the stick in protest. "We get sticks, they get a CAMEL with SHADE? Make it make sense, Chris!" Chris just sips his coffee.`,
    (n, pr, t) => `${n} picks up the stick. It's surprisingly heavy. Warm. A little hum to it. "...okay. Maybe Chris isn't messing with us." The tribe is unconvinced.`,
    (n, pr, t) => `"This better be magic." ${n} brandishes the stick at Chris. "I swear to god, if this is just a stick I'm walking back and demanding the camel." Chris waves them off. "Walk on."`,
    (n, pr, t) => `The whole tribe groans when ${n} holds up the stick. "WE FINISHED FIRST." "Yes." "AND WE GET A STICK." "Yes." "...okay." They start walking. Confused.`,
  ],
  reactionGoat: [
    (n, pr, t) => `${n} regards the goat. The goat regards ${pr.obj}. "Could be worse," ${pr.sub} sighs. "Could be a stick." Meanwhile the stick tribe is staring daggers from across the dunes.`,
    (n, pr, t) => `"A GOAT. Okay. We can work with this." ${n} pats the goat. The goat headbutts ${pr.obj} immediately. "We can SOMETIMES work with this."`,
    (n, pr, t) => `${n} surveys the situation. Camel for last place — too big to boat. Stick for first — apparently magic? "Honestly? Goat might be the best of all three. Let's go."`,
    (n, pr, t) => `The goat bleats at ${n}. ${pr.Sub} bleats back. The bond is instant and weird. "We're gonna call him Steve." "It's a girl." "We're calling her Steve."`,
    (n, pr, t) => `${n} watches the camel struggle and the stick tribe panic. ${pr.Sub} pets the goat. "We are SO middle-of-the-pack. I love it. Let's go."`,
  ],
  reactionCamel: [
    (n, pr, t) => `${n} stares at the camel. The camel stares back, dead-eyed. "...how are we supposed to get this thing on a BOAT later?!" Chris doesn't answer. Chris is gone.`,
    (n, pr, t) => `"At least we have shade." ${n} tries to find a silver lining. The camel immediately spits on ${pr.obj}. "...nevermind."`,
    (n, pr, t) => `The camel is enormous. ${n} circles it slowly. "We came in last and our reward is... a two-thousand-pound problem?" The tribe nods grimly.`,
    (n, pr, t) => `${n} tries to mount the camel. The camel sits down. ${n} tries to lead it. The camel sits down. "OH COME ON." The trek hasn't even started yet.`,
    (n, pr, t) => `"Camel for last place is BS," ${n} mutters. "It's not even faster — it's slower because it stops every TWO MINUTES." The camel bites ${pr.posAdj} sleeve. "SEE."`,
    (n, pr, t) => `${n} watches the stick tribe complain about their stick. "Trade you?" ${pr.Sub} calls. "NO!" the stick tribe shouts back, hugging their stick. ${n} doesn't trust this.`,
  ],
  stickDiscovery: [
    (n, pr) => `Wait. ${n} holds the stick level and it PULLS. Not wind — it's a sorcerer's divining rod. ${pr.Sub} can feel water, direction, the path. "Guys. The stick is magic."`,
    (n, pr) => `${n} notices the stick vibrating. ${pr.Sub} points it different directions — it tugs toward water. "Chris wasn't lying. This IS a sorcerer's rod." The tribe stares.`,
    (n, pr) => `The stick starts humming in ${n}'s hand. ${pr.Sub} follows its pull and finds the path immediately. "This is why we won." The winner's reward pays off.`,
    (n, pr) => `${n} feels the stick twitch northeast. Toward the Nile? ${pr.Sub} follows it. The sorcerer's stick knows the way. First place advantage activated.`,
    (n, pr) => `${n} spins the stick experimentally. It stops pointing the same direction every time. "It's a divining rod!" ${pr.Sub} grins. First place earned this.`,
  ],
  stickLost: [
    (t, n, pr) => `${n} trips and the stick goes flying. By the time they look for it, the sand has swallowed it. ${t}'s secret weapon is gone.`,
    (t, n, pr) => `The goat — wait, no, they don't have the goat. Whatever animal knocked the stick from ${n}'s hands, it's gone now. ${t} is back to navigating blind.`,
    (t, n, pr) => `A sandstorm gust rips the stick from ${n}'s grip. It vanishes into the dunes. ${pr.Sub} searches frantically. Nothing. The advantage is lost.`,
    (t, n, pr) => `${n} sets the stick down for one second. One. When ${pr.sub} turns back, it's buried in sand. ${t} curses the desert.`,
  ],
};

const LEADER_TEXT = {
  selected: [
    (n, pr) => `${n} takes the navigator role. ${pr.posAdj} tribe looks to ${pr.obj} for direction. ${pr.Sub} scans the horizon and points. "That way."`,
    (n, pr) => `The tribe turns to ${n}. ${pr.Sub} has the sharpest mind here. "Follow me," ${pr.sub} says, already reading the dunes.`,
    (n, pr) => `${n} steps forward as navigator. "I've been studying the landscape since the summit." The tribe trusts ${pr.posAdj} lead.`,
    (n, pr) => `Nobody argues when ${n} takes charge of navigation. ${pr.posAdj} strategic mind is exactly what they need right now.`,
    (n, pr) => `${n} grabs the lead position. "I know where we're going. Probably." ${pr.posAdj} confidence is contagious. Mostly.`,
  ],
  challenged: [
    (n, challenger, pr, cpr) => `${challenger} steps up. "I should be navigating, not ${n}." ${cpr.Sub} squares off. The tribe watches the power struggle unfold.`,
    (n, challenger, pr, cpr) => `"No offense, ${n}, but I've got a better sense of direction." ${challenger} muscles ${cpr.posAdj} way to the front. It's a challenge.`,
    (n, challenger, pr, cpr) => `${challenger} cuts in front of ${n}. "You're going to get us lost. Let me lead." The tribe holds its breath.`,
    (n, challenger, pr, cpr) => `"Step aside, ${n}." ${challenger} doesn't ask — ${cpr.sub} demands. The navigator position is suddenly contested.`,
    (n, challenger, pr, cpr) => `${challenger} plants ${cpr.ref} between ${n} and the horizon. "I'm taking over. Unless you want to argue about it." ${n} has to decide.`,
  ],
  challengeWon: [
    (challenger, n, cpr) => `${challenger} wins the argument with facts, force of will, and a pointed finger at the correct heading. ${n} yields. New navigator.`,
    (challenger, n, cpr) => `The tribe sides with ${challenger}. ${cpr.Sub} takes the lead, and ${n} falls back, visibly frustrated.`,
    (challenger, n, cpr) => `${challenger} proves ${cpr.posAdj} case with a quick read of the sun position and wind. The tribe follows. ${n} has been replaced.`,
  ],
  challengeLost: [
    (challenger, n, cpr) => `${n} holds ${n === challenger ? 'the' : `${pronouns(n).posAdj}`} ground. "${challenger}, sit down." The tribe backs the original navigator. Challenge rejected.`,
    (challenger, n, cpr) => `${challenger} makes ${cpr.posAdj} case, but the tribe trusts ${n} more. ${challenger} falls back, muttering.`,
    (challenger, n, cpr) => `"Nice try, ${challenger}." ${n} keeps walking. The tribe follows ${n}, not the challenger. Power move.`,
  ],
};

const NAV_TEXT = {
  success: [
    (n, pr) => `${n} reads the dunes perfectly. "${pr.Sub} sees the pattern — follow the wind lines." The tribe gains ground.`,
    (n, pr) => `Sharp call from ${n}. ${pr.Sub} spots a rock formation and adjusts course. Straight and true. Time saved.`,
    (n, pr) => `${n} keeps them on the optimal path. Sun position, shadow angles, sand color — ${pr.sub} reads it all. The tribe moves fast.`,
    (n, pr) => `"Left at the big dune, straight past the cactus." ${n}'s directions are precise. The tribe trusts ${pr.obj} completely.`,
    (n, pr) => `${n}'s navigation instincts are razor-sharp. ${pr.Sub} cuts through the desert like ${pr.sub}'s walked it before.`,
  ],
  fail: [
    (n, pr) => `${n} takes a wrong turn. The tribe walks in a circle for ten minutes before someone points out they passed that same cactus twice.`,
    (n, pr) => `"I think it's this way." It's not. ${n}'s miscalculation costs the tribe precious time wandering into a sand valley.`,
    (n, pr) => `${n} misreads the sun angle and leads the tribe northeast instead of northwest. By the time ${pr.sub} realizes, they've lost ground.`,
    (n, pr) => `The dunes all look the same to ${n}. ${pr.Sub} picks a direction and hopes. Hope is not a navigation strategy.`,
    (n, pr) => `${n} insists the Nile is left. It's right. The argument wastes more time than the detour.`,
  ],
  lost: [
    (n, pr) => `${n} is completely lost. The tribe is circling the same cactus for the third time. Morale is collapsing.`,
    (n, pr) => `"We're NOT lost," ${n} says. They are very lost. The cactus behind ${pr.obj} is starting to feel like an old friend.`,
    (n, pr) => `${n} stops. Looks left. Looks right. Looks at the tribe. "Okay. We might be lost." Understatement of the century.`,
    (n, pr) => `The tribe is going in circles under ${n}'s navigation. Two members are arguing about directions. One is sitting down. This is bad.`,
  ],
};

const SHORTCUT_TEXT = {
  attempt: [
    (n, pr) => `${n} remembers something from the summit — a gap between dunes that could save them twenty minutes. "I think I know a shortcut."`,
    (n, pr) => `"Wait." ${n} squints at the horizon. "I saw this from the top of the pyramid. There's a faster route through that canyon."`,
    (n, pr) => `${n}'s summit view pays off. "Between those two rock formations — there's a pass. Follow me." Bold call.`,
    (n, pr) => `The memory clicks. ${n} saw the route from above. "Trust me — left through the ravine." ${pr.Sub} has to convince them to follow.`,
  ],
  success: [
    (n, pr) => `${n}'s shortcut works perfectly. The ravine cuts through the dunes and dumps them two miles ahead. The tribe erupts. "HOW DID YOU KNOW THAT?"`,
    (n, pr) => `The shortcut is real. ${n} leads the tribe through a hidden pass that shaves off massive time. The summit view was worth every blister.`,
    (n, pr) => `${n}'s gamble pays off. The canyon route is smooth, shaded, and cuts their trek time by a third. ${pr.Sub} is the hero of Phase 2.`,
    (n, pr) => `Through the pass, down the slope, and suddenly the Nile is visible. ${n}'s shortcut saved the tribe. "I told you. I TOLD you."`,
    (n, pr) => `${n} is vindicated. The shortcut drops them right at the river approach. The other tribes are still trudging through open desert.`,
  ],
  fail: [
    (n, pr) => `${n}'s "shortcut" leads straight into a sandstorm pocket. The tribe loses ten minutes digging sand out of their eyes and finding the real path.`,
    (n, pr) => `The ravine turns out to be a dead end. ${n}'s summit memory was wrong — or the desert shifted. Massive time loss.`,
    (n, pr) => `${n}'s shortcut hits a cliff face. No way through. They backtrack, and the tribe's mood goes from hopeful to furious.`,
    (n, pr) => `The canyon ${n} remembered is full of sand. Waist-deep sand. They wade through it slower than the normal route. "Shortcut," someone mutters sarcastically.`,
    (n, pr) => `${n}'s gamble fails. The pass is blocked by rockfall. The detour eats more time than the main route would have. ${pr.Sub} does not meet anyone's eyes.`,
  ],
};

const SCARAB_SWARM_TEXT = {
  pass: [
    (n, pr) => `The scarab swarm hits and ${n} powers through. Endurance and willpower. ${pr.Sub} emerges on the other side with bugs in ${pr.posAdj} hair but time intact.`,
    (n, pr) => `${n} doesn't flinch when the scarabs come. ${pr.Sub} keeps walking, keeps breathing, keeps moving. "They're just bugs."`,
    (n, pr) => `${n} wraps ${pr.posAdj} arms and pushes through the scarab cloud. Determination over disgust. ${pr.Sub} makes it through with barely any delay.`,
    (n, pr) => `The swarm parts around ${n} like water around a rock. ${pr.Sub} walks through it steadily, focus unbroken.`,
    (n, pr) => `Scarabs crawl up ${n}'s legs. ${pr.Sub} doesn't stop. Doesn't scream. Just keeps walking. The tribe follows ${pr.posAdj} lead.`,
  ],
  fail: [
    (n, pr) => `The scarab swarm overwhelms ${n}. ${pr.Sub} drops to ${pr.posAdj} knees, swatting wildly. By the time it passes, ${pr.sub}'s lost serious ground.`,
    (n, pr) => `${n} panics in the swarm. ${pr.Sub} runs — wrong direction — and has to be called back by teammates. Time hemorrhage.`,
    (n, pr) => `${n} can't handle the scarabs. ${pr.Sub} freezes, whimpers, and has to be physically dragged through by a teammate. Rough moment.`,
    (n, pr) => `The scarabs find every gap in ${n}'s clothes. ${pr.Sub} spends more time dancing and screaming than moving forward.`,
    (n, pr) => `${n} tries to fight the swarm. You can't fight a swarm. ${pr.Sub} loses the fight and several minutes.`,
  ],
  calmSuccess: [
    (n, pr) => `${n} drops to one knee and hums — low, steady, commanding. The scarabs slow. Part. A corridor opens through the swarm. The tribe stares. ${pr.Sub} just talked down a million bugs.`,
    (n, pr) => `"Nobody move." ${n} raises ${pr.posAdj} hands slowly. The scarabs settle. ${pr.Sub} is communicating with them somehow — body language, vibration, something. A path clears.`,
    (n, pr) => `${n} steps forward alone, hands open, voice steady. The scarabs spiral around ${pr.obj} but don't land. ${pr.Sub} leads the tribe through the eye of the swarm. Incredible.`,
    (n, pr) => `It shouldn't work. ${n} stands still, breathes deep, and the scarabs flow AROUND ${pr.obj}. "They're more scared of us," ${pr.sub} says. The tribe isn't convinced but follows.`,
    (n, pr) => `${n} channels something primal. ${pr.Sub} stamps ${pr.posAdj} foot in a specific rhythm. The scarabs scatter. "My grandma taught me that." Nobody asks follow-up questions.`,
  ],
  calmFail: [
    (n, pr) => `${n} tries the calm approach. The scarabs do not care about ${pr.posAdj} calm approach. They swarm ${pr.obj} harder than anyone. So much for diplomacy.`,
    (n, pr) => `"I can communicate with them," ${n} says confidently. ${pr.Sub} cannot. The scarabs demonstrate this by covering ${pr.posAdj} entire left side.`,
    (n, pr) => `${n} steps forward to calm the swarm and gets absolutely mobbed. ${pr.posAdj} teammates have to pull ${pr.obj} out. The bugs were not interested in peace.`,
    (n, pr) => `${n}'s attempt to soothe the scarabs is admirable. It's also a complete failure. The swarm seems personally offended by the effort.`,
    (n, pr) => `${n} raises ${pr.posAdj} hands in a calming gesture. The scarabs interpret this as "land here." ${pr.Sub} is now wearing a scarab suit.`,
  ],
  cursedExtra: [
    (n, pr) => `The scarabs LOVE ${n}. Every bug in a fifty-foot radius makes a beeline for ${pr.obj}. The mummified dog curse is real, and it is angry.`,
    (n, pr) => `${n} gets triple the scarabs of anyone else. They're attracted to the curse like magnets. ${pr.Sub} is practically invisible under the swarm.`,
    (n, pr) => `The curse kicks in. The scarab swarm ignores everyone else and converges on ${n}. It's personal. It's supernatural. It's terrible.`,
    (n, pr) => `${n} didn't believe in curses before today. The scarabs — every single one of which is targeting ${pr.obj} specifically — are making a compelling argument.`,
  ],
};

const SOCIAL_TEXT = {
  seduction: [
    (schemer, target, pr) => `${schemer} sidles up to ${target} during the trek. "You know, we'd make a good team. After this is over." ${pr.Sub} plants seeds of alliance through charm.`,
    (schemer, target, pr) => `${schemer} finds ${target} at the back of the pack and whispers promises. Flattery, strategy, a future deal. Classic ${arch(schemer)} move.`,
    (schemer, target, pr) => `"Between you and me," ${schemer} murmurs to ${target}, "I'm the one you want on your side." ${pr.posAdj} social game never stops, even in a desert.`,
    (schemer, target, pr) => `${schemer} matches ${target}'s pace and starts talking. By the time they crest the next dune, ${target} is nodding. ${schemer} works fast.`,
    (schemer, target, pr) => `${schemer} catches ${target} alone and turns the charm up to eleven. "I've been meaning to talk to you about the next vote..." ${pr.Sub} is always scheming.`,
  ],
  alliance: [
    (a, b, pr) => `${a} and ${b} fall into step together. The desert walk gives them time to talk — really talk. A bond forms in the sand and heat.`,
    (a, b, pr) => `"Stick with me," ${a} says to ${b}. ${b} nods. It's not a formal alliance — it's stronger. It's understanding.`,
    (a, b, pr) => `${a} shares water with ${b}. ${b} shares intel with ${a}. The desert forges partnerships the camp never could.`,
    (a, b, pr) => `The trek is long enough for ${a} and ${b} to have the conversation they've been avoiding. By the end, they're aligned.`,
    (a, b, pr) => `${a} and ${b} walk side by side through the dunes, planning. Laughing. Watching each other's backs. Something shifted out here.`,
  ],
  blame: [
    (target, tribe, pr) => `The tribe is frustrated. Someone has to take the blame. Eyes turn to ${target}. "If ${pr.sub} hadn't slowed us down in the pyramid..."`,
    (target, tribe, pr) => `${target} feels the heat building. ${pr.posAdj} tribemates are looking for a scapegoat, and ${pr.posAdj} name keeps coming up.`,
    (target, tribe, pr) => `"This is ${target}'s fault." Nobody says it out loud, but the glances say everything. ${pr.Sub} is losing standing with every step.`,
    (target, tribe, pr) => `The blame spiral starts with a whisper and reaches ${target} by the time they crest the dune. ${pr.Sub} knows ${pr.sub}'${pr.sub === 'they' ? 're' : 's'} in trouble.`,
    (target, tribe, pr) => `${target} stumbles and someone mutters, "Typical." The tribe dynamic shifts. ${pr.Sub} is the weak link, and everyone knows it.`,
  ],
};

// ── PHASE 1 SOCIAL EVENTS ──
const P1_SOCIAL = {
  pathDebate: [
    (a, b, apr) => `${a} and ${b} square off at the fork. "Over is suicide," ${b} insists. ${a} fires back: "Under is a maze for rats." They split — and neither forgets the other's choice.`,
    (a, b, apr) => `"You're going UNDER?" ${a} stares at ${b}. "I thought you had guts." ${b} shrugs: "I thought you had brains." The barb stings.`,
    (a, b, apr) => `${a} tries to convince ${b} to take the same path. ${b} won't budge. The argument gets heated. Tribes don't need this energy right now.`,
    (a, b, apr) => `${a} calls the under path "cowardly." ${b} calls the over path "suicidal." ${host()} watches with popcorn. This is excellent television.`,
  ],
  trapBuddy: [
    (hero, saved, hpr) => `${hero} grabs ${saved}'s hand just before the scarab pit. "Don't look down," ${hpr.sub} whispers. They make it through together.`,
    (hero, saved, hpr) => `${saved} freezes at the mummy sarcophagus. ${hero} puts a hand on ${saved}'s shoulder. "I've got you. Walk." They walk.`,
    (hero, saved, hpr) => `${hero} spots the collapse before ${saved} does. One pull backward saves a broken ankle. "You owe me," ${hero} grins.`,
    (hero, saved, hpr) => `${hero} shields ${saved} from the scarab swarm with ${hpr.posAdj} own body. Takes the hits. Doesn't complain.`,
  ],
  summitTaunt: [
    (taunter, target, tpr) => `${taunter} reaches the summit and looks down at the under players below. "ENJOY THE DARK!" ${tpr.Sub} cups ${tpr.posAdj} hands and hollers. ${target} hears it and seethes.`,
    (taunter, target, tpr) => `From the pyramid's peak, ${taunter} waves at the tunnels below. "Better luck next time, ${target}!" The provocation is unnecessary. And effective.`,
    (taunter, target, tpr) => `${taunter} poses at the summit like a pharaoh surveying ${tpr.posAdj} kingdom. ${target} looks up from below. The humiliation burns.`,
    (taunter, target, tpr) => `"UNDER was the wrong call, ${target}!" ${taunter} shouts from above. ${tpr.Sub} can't help ${tpr.ref}. The high ground brings out the worst in ${tpr.obj}.`,
  ],
  mummyPanic: [
    (panicker, affected, ppr) => `${panicker} rounds a corner and SCREAMS. Full-body, echoing-through-the-pyramid scream. ${affected} jumps sideways into a wall.`,
    (panicker, affected, ppr) => `Something brushes ${panicker}'s neck. ${ppr.Sub} flails. ${affected} catches an elbow. Now BOTH of them are panicking.`,
    (panicker, affected, ppr) => `${panicker} sees a shape in the dark and bolts. ${affected} doesn't know what ${panicker} saw — but runs too. Fear is contagious.`,
    (panicker, affected, ppr) => `"MUMMY! ACTUAL MUMMY!" ${panicker} barrels past ${affected}, knocking ${affected} into a wall carving. ${affected} is NOT amused.`,
  ],
  encourage: [
    (giver, receiver, gpr) => `${giver} waits for ${receiver} at the difficult section. "Take your time. I'll spot you." The support means everything in here.`,
    (giver, receiver, gpr) => `"You've GOT this, ${receiver}." ${giver} doesn't need to say it — but ${gpr.sub} does. And ${receiver} pushes through.`,
    (giver, receiver, gpr) => `${giver} passes ${gpr.posAdj} torch to ${receiver} when the darkness gets too thick. "Here. I can see in the dark." A lie — but a kind one.`,
    (giver, receiver, gpr) => `${giver} gives ${receiver} a fist bump at the halfway point. "Almost there." Simple. But ${receiver} needed it.`,
  ],
};

// ── PHASE 2 SOCIAL EVENTS (ADDITIONAL) ──
const P2_SOCIAL = {
  waterShare: [
    (giver, receiver, gpr) => `${giver} notices ${receiver} struggling and offers ${gpr.posAdj} water. No hesitation. Just humanity. ${receiver} won't forget this.`,
    (giver, receiver, gpr) => `"Drink." ${giver} shoves the canteen at ${receiver}. ${receiver} protests. ${giver} insists. "You're no good to us dead."`,
    (giver, receiver, gpr) => `${giver} shares water with ${receiver} without being asked. ${receiver} looks surprised — then grateful.`,
    (giver, receiver, gpr) => `${giver} takes a smaller sip to save some for ${receiver}. It's the kind of move people remember at tribal council.`,
  ],
  waterHoard: [
    (hoarder, victim, hpr) => `${hoarder} hides the water from ${victim}. "Finished it already. Sorry." ${hpr.Sub} didn't. ${victim} sees the bulge under ${hpr.posAdj} shirt.`,
    (hoarder, victim, hpr) => `${hoarder} takes a long drink and puts the cap back on. Tight. When ${victim} reaches for it: "We need to ration." But ${hoarder}'s already had plenty.`,
    (hoarder, victim, hpr) => `${hoarder} conveniently "forgets" to pass the water to ${victim}. Twice. ${victim} starts keeping count.`,
    (hoarder, victim, hpr) => `"Water's running low." ${hoarder} fails to mention that ${hpr.sub} drank most of it. ${victim} is parched and suspicious.`,
  ],
  // Keyed by reward — animal-specific
  camelDrama: [
    (player, tName, pr) => `The camel spits on ${player}. A FULL spit. The whole tribe watches. Nobody helps. Some laugh. ${pr.Sub} wipes ${pr.posAdj} face in silence and adds the camel to ${pr.posAdj} list.`,
    (player, tName, pr) => `The camel decides ${player} is its enemy and refuses to walk near ${pr.obj}. The tribe has to rotate who walks with it like it's a custody arrangement.`,
    (player, tName, pr) => `${player} tries to ride the camel. The camel tolerates this for 12 seconds, then bucks ${pr.obj} into a dune. The tribe applauds. The camel walks away.`,
    (player, tName, pr) => `${player} bonds with the camel. ${pr.Sub} names it Geoff. Geoff seems to like ${pr.obj} back. Geoff also seems to hate everyone else, which is somehow worse.`,
    (player, tName, pr) => `The camel sits down. Refuses to move. ${player} pleads. ${player} bargains. ${player} cries. The camel finally stands up after twelve agonizing minutes — and immediately sits back down.`,
    (player, tName, pr) => `${player} feeds the camel a date. The camel takes ${pr.posAdj} entire hand briefly into its mouth, then releases ${pr.obj}, slimy. "I think we're friends now." ${pr.Sub} is bleeding slightly.`,
  ],
  goatDrama: [
    (player, tName, pr) => `The goat headbutts ${player} for the third time. "WHY does it hate ME?" ${pr.Sub} shouts. The tribe has theories. None of them flattering.`,
    (player, tName, pr) => `The goat eats ${player}'s map. Just chews it up. ${pr.Sub} watches in horror. "We were USING THAT." The goat burps.`,
    (player, tName, pr) => `${player} tries to lead the goat with a rope. The goat decides this is a game. ${player} is now being dragged across the dunes. The tribe is laughing too hard to help.`,
    (player, tName, pr) => `The goat falls asleep. Standing up. ${player} pokes it. Nothing. The tribe waits. Three minutes pass. The goat wakes up, bleats indignantly, and walks the wrong direction.`,
    (player, tName, pr) => `${player} discovers the goat is shockingly affectionate. It nuzzles ${pr.posAdj} hand. It follows ${pr.obj} willingly. "Maybe goats are underrated." The goat then headbutts ${pr.obj} into a cactus.`,
    (player, tName, pr) => `The goat eats ${player}'s shoelace. Then ${pr.posAdj} hat. Then ${pr.posAdj} sleeve. ${pr.Sub} is being slowly DECONSTRUCTED by this small, evil creature.`,
  ],
  stickDrama: [
    (player, tName, pr) => `${player} accidentally swings the stick into ${pr.posAdj} own face. The tribe pauses. "...Are you okay?" "Yes." "Are you SURE?" "...I don't know."`,
    (player, tName, pr) => `${player} tries to use the stick like a walking staff. It's the wrong height and ${pr.sub} stumbles every third step. The tribe pretends not to notice.`,
    (player, tName, pr) => `The stick gets HOT in ${player}'s hand. ${pr.Sub} drops it. It's not glowing. It's not on fire. But it's HOT. ${pr.Sub} cautiously picks it back up. "...okay magic stick. Be cool."`,
    (player, tName, pr) => `${player} talks to the stick. Out loud. "Which way, buddy?" The tribe stares. The stick does not respond. ${pr.Sub} keeps walking, undeterred.`,
    (player, tName, pr) => `${player} insists on carrying the stick like a sword. "I'm pretending we're on a quest." The tribe sighs. ${pr.Sub} is correct, technically.`,
    (player, tName, pr) => `${player} loses ${pr.posAdj} grip and the stick rolls down a dune. The whole tribe SCREAMS and chases it. They retrieve it, panting. "We are not LOSING the magic stick."`,
  ],
  desertMirage: [
    (player, pr) => `${player} stops dead. "I see water." ${pr.Sub} walks toward nothing. The tribe has to physically pull ${pr.obj} back. "It was RIGHT THERE."`,
    (player, pr) => `${player}'s eyes go wide. "${pr.Sub} sees the finish line!" There is no finish line. Just more sand. The heat is winning.`,
    (player, pr) => `${player} starts talking to someone who isn't there. The tribe exchanges looks. "${pr.Sub} needs shade. NOW."`,
    (player, pr) => `"Did you see that?" ${player} points at an empty dune. Nobody saw anything. ${pr.Sub} starts questioning ${pr.posAdj} own sanity.`,
  ],
  raJudgment: [
    (blessed, pr) => `The sun breaks through at the exact moment ${blessed} crests the dune. The light catches ${pr.obj} like a spotlight from heaven. Ra smiles on this one.`,
    (cursed, pr) => `The heat intensifies around ${cursed}. Specifically ${cursed}. The sun seems to follow ${pr.obj}. Ra is displeased with this mortal.`,
  ],
  // Strategy & gameplay moments during the trek
  voteWhisper: [
    (a, b, target, apr) => `${a} drops back to walk beside ${b}. Quiet voice: "When we lose this... ${target}. Right?" ${b} considers. The dune walk gives them privacy nobody else gets.`,
    (a, b, target, apr) => `"You thinking what I'm thinking?" ${a} murmurs to ${b}. "${target}." ${b} doesn't even nod — just keeps walking. The pact is sealed in heat-shimmer.`,
    (a, b, target, apr) => `${a} matches ${b}'s pace at the back of the line. "If we go to tribal — ${target}. Lock it in now." ${b}'s answer is one word. "Done."`,
    (a, b, target, apr) => `Two tribemates falling slightly behind. ${a} and ${b}. Their conversation is short. ${target}'s name comes up. Decision made. Nobody else hears.`,
    (a, b, target, apr) => `${a} times the conversation perfectly — when the wind picks up and nobody can overhear. "${target} goes home first." ${b} squints at the horizon. "Yeah. Yeah they do."`,
  ],
  intelTrade: [
    (a, b, apr) => `${a} catches ${b} alone for a moment. Information changes hands — what ${a} overheard at camp last night, what ${b} saw between two other tribemates. Currency in this game.`,
    (a, b, apr) => `"I'll tell you something if you tell me something." ${a} keeps walking, eyes forward. ${b} considers, then accepts. Two pieces of intel cross the dunes.`,
    (a, b, apr) => `${a} pulls ${b} aside under the pretext of checking a boot. Real reason: trading what they each know about who's plotting what. The desert is the best meeting room.`,
    (a, b, apr) => `${b} slows down. ${a} catches up. They walk in step. By the next dune, both know things they didn't before. Information is the only resource that grows out here.`,
  ],
  secretPact: [
    (a, b, apr) => `${a} extends a hand mid-stride. Not a handshake — a fist bump, casual, deniable. ${b} bumps back. The alliance is real. Witnessed only by sand.`,
    (a, b, apr) => `"Final two." ${a} doesn't look at ${b} when ${apr.sub} says it. ${b} doesn't look back. But the answer is "Yeah." The desert just witnessed a pact.`,
    (a, b, apr) => `${a} and ${b} fall behind on purpose. Just enough distance. "If we both make merge..." A promise is made. A real one. The kind that holds.`,
    (a, b, apr) => `Walking behind everyone else, ${a} and ${b} form something the tribe doesn't see coming. A secret two-person bloc. The dunes hide everything.`,
  ],
  rivalryFlare: [
    (a, b, apr) => `${a} steps on ${b}'s heel. Probably not on purpose. ${b} mutters something under ${apr.posAdj} breath. ${a} hears it. The rivalry just got a degree hotter.`,
    (a, b, apr) => `"Maybe walk faster, ${b}." ${a} doesn't even look back when ${apr.sub} says it. ${b}'s jaw tightens. There will be a reckoning. Not today, but soon.`,
    (a, b, apr) => `${a} and ${b} keep ending up next to each other. Neither wants this. Both pretend not to notice. The tension radiates more heat than the sun.`,
    (a, b, apr) => `A sharp word from ${a}. A sharper one back from ${b}. The tribe pretends not to hear. The desert echoes the silence after.`,
  ],
  showmanceMoment: [
    (a, b, apr, bpr) => `${a} and ${b} fall into rhythm together. ${apr.Sub} grabs ${bpr.posAdj} hand briefly when no one's looking. Just a squeeze. Just a moment. The dunes blur a little.`,
    (a, b, apr, bpr) => `${a} carries ${b}'s pack for a stretch without being asked. ${bpr.Sub} doesn't argue. They walk closer than they need to. The tribe pretends not to see.`,
    (a, b, apr, bpr) => `${a} pulls ${b} aside behind a dune. A quick kiss. A whispered promise. They rejoin the line like nothing happened. Everyone knows.`,
    (a, b, apr, bpr) => `${b} stumbles. ${a} catches ${bpr.obj}. Their eyes meet for a half-second too long. Someone behind them coughs. They keep walking, smiling.`,
    (a, b, apr, bpr) => `${a} shares ${apr.posAdj} water with ${b}. The whole canteen. The tribe notices. ${bpr.Sub} drinks slowly, watching ${apr.obj}. The desert just got cinematic.`,
    (a, b, apr, bpr) => `${a} writes something in the sand with a stick. ${b} reads it. Smiles. Erases it with ${bpr.posAdj} foot before anyone else sees. The tribe walks on, oblivious.`,
  ],
  showmanceFriction: [
    (a, b, apr, bpr) => `${a} snaps at ${b} over nothing — direction, water, pace. ${bpr.Sub} stops walking. "Are we doing this NOW?" The whole tribe pretends very hard not to listen.`,
    (a, b, apr, bpr) => `${a} and ${b} aren't talking. The tribe notices because they NEVER stop talking. Something happened back at camp. The desert isn't fixing it.`,
    (a, b, apr, bpr) => `"You're being weird." ${a} doesn't look at ${b}. "I'm being NORMAL." ${bpr.Sub} keeps walking. The showmance is having a desert.`,
  ],
};

// ── DESERT ENCOUNTERS — random adventure beats during phase 2 ──
const DESERT_ENCOUNTERS = {
  sandstorm: [
    (t) => `A wall of sand rolls toward ${t}. The horizon vanishes. The wind screams. They drop, hood up, eyes shut, and wait. When it passes, half their gear is buried and they're somehow facing the wrong way.`,
    (t) => `The sky goes orange. A sandstorm hits ${t} like a freight train. They form a chain, hands locked, heads down. Three minutes of chaos. When it ends, everyone is still there. Barely.`,
    (t) => `Sand fills every crevice ${t} owns. Mouth, ears, boots, soul. The storm is brief but brutal. Visibility was zero. Direction was a guess. They emerge dazed, gritty, and behind schedule.`,
    (t) => `${t} sees the sandstorm coming. They huddle behind a dune. The wind howls overhead like a wounded animal. They survive, but the trail is gone — wiped clean by the wind.`,
  ],
  oasis: [
    (t, finder, pr) => `${finder} spots palm trees. PALM TREES. ${pr.Sub} sprints. The tribe sprints. It's a real oasis — water, shade, dates ripe on the trees. They drink. They rest. They almost don't want to leave.`,
    (t, finder, pr) => `${finder} hears birdsong. ${pr.Sub} follows it. Behind a dune: a small spring, surrounded by green. ${t} tops up canteens, splashes water on burned faces, and gains a second wind.`,
    (t, finder, pr) => `An actual oasis. ${finder} laughs in disbelief. The tribe collapses by the water. Five minutes of paradise. Five minutes of believing they might actually win this.`,
  ],
  oasisTrap: [
    (t, victim, pr) => `${t} reaches an "oasis." It's a mirage. The water is dust. The palms are heat-shimmer. ${victim} keeps walking into the empty space, refusing to believe it's not real, until the tribe physically restrains ${pr.obj}.`,
    (t, victim, pr) => `What looks like water turns out to be a salt flat. ${victim} face-plants into it trying to drink. The tribe winces. ${pr.Sub} stands up with white crust on ${pr.posAdj} face, dignity gone.`,
  ],
  ruin: [
    (t, scout, pr) => `${scout} spots stones poking through the sand. ${pr.Sub} brushes them off. A buried obelisk. Hieroglyphs glow faintly under ${pr.posAdj} hand. "I think... I think this was a marker. Pointing east." The tribe gains direction.`,
    (t, scout, pr) => `${scout} stumbles into a sunken courtyard. Ancient. Ruined. There's a worn carving of the Nile on the wall, and a faded arrow pointing somewhere. ${t} follows it without hesitation.`,
    (t, scout, pr) => `Half-buried temple steps. ${scout} climbs them. From the top, ${pr.sub} can see a green ribbon on the horizon — the Nile. "TRIBE. THIS WAY." Game-changer.`,
  ],
  scorpion: [
    (t, victim, pr) => `${victim} steps on a scorpion. Or near one. The pinch comes anyway. ${pr.Sub} screams a sound that does not belong in this dimension. The tribe halts. Someone has antivenom in a kit nobody remembered packing. ${pr.Sub} survives. Mostly.`,
    (t, victim, pr) => `A scorpion drops out of ${victim}'s collar mid-step. ${pr.Sub} discovers acrobatics ${pr.sub} never knew ${pr.sub} had. The scorpion is fine. ${victim} is changed forever.`,
    (t, victim, pr) => `${victim} flips a rock. Bad idea. Scorpion. Strike. ${pr.Sub} hisses through gritted teeth. The tribe debates whether to suck out the venom (no) and settles for water and walking it off.`,
  ],
  nomad: [
    (t, talker, pr) => `An old nomad on a camel passes ${t}. ${talker} flags ${pr.obj} down. There's broken-language haggling. The nomad gestures northeast. Hands over a waterskin. Vanishes. ${t} now has bonus water and a direction. Nobody asks questions.`,
    (t, talker, pr) => `A robed figure appears out of nowhere. Nomad. ${talker} approaches respectfully. The nomad listens, smiles, and points at the dunes. "Three hills. Then water." Then ${pr.sub} keeps walking. Was that real? It doesn't matter — it was right.`,
    (t, talker, pr) => `A trader with a goat-drawn cart greets ${t} cheerfully. ${talker} barters charm for information. The trader laughs, points, and offers a piece of dried meat. The tribe leaves with a tip and full stomachs.`,
  ],
  sandPit: [
    (t, faller, hero, fpr, hpr) => `${faller} steps wrong and the dune just OPENS. ${fpr.Sub} disappears to ${fpr.posAdj} chest in seconds. ${hero} doesn't hesitate — drops ${hpr.posAdj} pack, grabs ${fpr.posAdj} hand, hauls. The tribe forms a chain. ${faller} comes out coughing sand. Bond forged.`,
    (t, faller, hero, fpr, hpr) => `Quicksand. Real quicksand. ${faller} starts sinking and ${fpr.sub} doesn't believe it at first. ${hero} believes it. ${hpr.Sub} throws a rope, pulls hard, and saves ${fpr.posAdj} life. Maybe. Probably. Either way, ${faller} owes ${hero}.`,
    (t, faller, hero, fpr, hpr) => `The ground gives way under ${faller}. ${hero} catches ${fpr.posAdj} arm at the last second. They both nearly go down. ${hpr.Sub} braces. The tribe pulls. Both come out. Nobody talks for a minute.`,
  ],
  vultures: [
    (t) => `Vultures circle. Lazy, patient. ${t} pretends not to notice. The vultures notice. ${t} walks faster.`,
    (t) => `A buzzard lands ten feet from ${t}, watching. Tilting its head. Waiting. The tribe collectively decides to walk faster.`,
  ],
  cobra: [
    (t, charmer, pr) => `A cobra rises from a coiled basket-shape in the sand. Hood flared. ${charmer} freezes. The tribe freezes. ${pr.Sub} slowly, slowly backs away. The cobra watches them leave. They don't turn ${pr.posAdj} back on it for a full minute.`,
    (t, charmer, pr) => `Snake. Big snake. Bigger than expected. ${charmer} performs the most cautious sidestep in human history. The tribe follows ${pr.posAdj} lead exactly. Heart rate: maximum.`,
  ],
};
// ── PHASE 3 SOCIAL EVENTS ──
const P3_SOCIAL = {
  boatTeamwork: [
    (a, b) => `${a} and ${b} find a rowing rhythm. Perfect sync. The boat surges forward. For one glorious moment, they're a machine.`,
    (a, b) => `"LEFT! RIGHT! LEFT!" ${a} and ${b} call the strokes together. The coordination is beautiful. The boat flies.`,
    (a, b) => `${a} matches ${b}'s stroke naturally. No words needed. The boat cuts through the water like it was born to race.`,
    (a, b) => `${a} and ${b} lock eyes across the boat. Nod. And row together like they've done it a thousand times. Chemistry.`,
  ],
  crocPanic: [
    (panicker, affected, ppr) => `${panicker} sees scales break the surface and STANDS UP in the boat. The boat rocks. ${affected} grabs the sides. "SIT DOWN!"`,
    (panicker, affected, ppr) => `"CROC! CROC! CROC!" ${panicker} drops ${ppr.posAdj} oar and clutches ${affected}. ${affected} peels ${panicker} off, but the boat has lost momentum.`,
    (panicker, affected, ppr) => `${panicker}'s oar splashes wildly, attracting attention. ${affected} slaps ${panicker}'s arm. "You're making it WORSE."`,
    (panicker, affected, ppr) => `${panicker} tries to jump out of the boat. ${affected} tackles ${ppr.obj} back in. The boat nearly capsizes. "Are you INSANE?"`,
  ],
  boatSabotage: [
    (villain, targetTribe, vpr) => `${villain} reaches over and PULLS a reed from ${targetTribe}'s passing boat. Subtle. Devastating. A leak begins to form.`,
    (villain, targetTribe, vpr) => `${villain} "accidentally" splashes ${targetTribe}'s boat with ${vpr.posAdj} oar. The water weighs them down. Pure coincidence, of course.`,
    (villain, targetTribe, vpr) => `When boats pass close, ${villain} bumps ${targetTribe}'s hull. "Oops." The impact loosens a seam. ${vpr.Sub} doesn't look sorry.`,
    (villain, targetTribe, vpr) => `${villain} spots a weak point in ${targetTribe}'s boat and kicks it during a close pass. A crack appears. ${vpr.Sub} whistles innocently.`,
  ],
  sobekJudgment: [
    (player, pr) => `The water around ${player}'s oar turns still. Unnaturally still. Even the crocs give ${pr.obj} a wide berth. Sobek has chosen a champion.`,
    (player, pr) => `A massive ripple follows ${player}'s boat. Not a croc — something bigger. Something watching. Sobek tests this one's nerve.`,
  ],
  encourageRow: [
    (giver, receiver, gpr) => `"Keep going! You're doing amazing!" ${giver} shouts at ${receiver} between strokes. The encouragement is genuine — and needed.`,
    (giver, receiver, gpr) => `${giver} takes ${receiver}'s oar for a few strokes. "Catch your breath." ${giver} rows double while ${receiver} recovers.`,
    (giver, receiver, gpr) => `${receiver}'s arms are burning. ${giver} starts singing a rowing chant. It's stupid. But it works. ${receiver} finds the rhythm again.`,
    (giver, receiver, gpr) => `${giver} swaps positions with ${receiver}, putting ${receiver} on the easier side. Nobody asked. ${giver} just saw the struggle.`,
  ],
};

// ── CROSS-TRIBE / EXTRA SOCIAL EVENTS ──
const P1_CROSS = {
  samePath: [
    (a, b, pathName, apr) => `${a} and ${b} — different tribes, same path. Their eyes meet on the ${pathName === 'over' ? 'summit face' : 'tunnel corridor'}. No words. Just competition. Both push harder.`,
    (a, b, pathName, apr) => `${a} catches up to ${b} on the ${pathName === 'over' ? 'ascent' : 'tunnel'}. "See you at the top." The race within the race is ON.`,
    (a, b, pathName, apr) => `${a} passes ${b} on the ${pathName === 'over' ? 'climb' : 'crawl'}. ${b} grits teeth and surges. No way is ${a} finishing first.`,
    (a, b, pathName, apr) => `${a} and ${b} reach the same chokepoint. Shoulder to shoulder. Neither gives way. The ${pathName === 'over' ? 'ridge' : 'tunnel'} isn't wide enough for both.`,
  ],
  overRivalry: [
    (a, b, apr) => `${a} and ${b} are neck-and-neck on the pyramid face. ${a} kicks a loose stone — it tumbles toward ${b}. Accident? Hard to say.`,
    (a, b, apr) => `"Get your own handhold!" ${a} snaps as ${b} reaches for the same ledge. The pyramid is big enough for both — but pride isn't.`,
    (a, b, apr) => `${a} reaches the top first. ${apr.Sub} looks back at ${b}, still climbing. The smirk says everything words can't.`,
    (a, b, apr) => `${a} and ${b} jockey for the fastest descent line. Elbows fly. Neither will admit who shoved first.`,
  ],
  underAlliance: [
    (a, b, apr) => `Lost in the dark, ${a} hears ${b}'s footsteps ahead. "Wrong tribe, but... share the torch?" They navigate together for a stretch.`,
    (a, b, apr) => `${a} and ${b} face the same sealed door. Enemy tribes. But the door won't budge alone. They heave together, then split without a word.`,
    (a, b, apr) => `"Your tribe's torch is brighter than ours," ${a} admits. ${b} holds it higher so both can see. The help won't be forgotten — or forgiven.`,
    (a, b, apr) => `${a} and ${b} reach a fork together. ${a} gestures: "After you." It's not politeness — it's using ${b} as a canary. ${b} knows. Goes anyway.`,
  ],
  surfCollision: [
    (a, b) => `${a} slams into ${b} on the slide down. They roll as a tangled ball of limbs for thirty feet before separating. Both furious. Both sand-burned.`,
    (a, b) => `"LOOK OUT!" Too late. ${a} plows into ${b} at full speed. Both wipe out spectacularly. The crowd below cringes.`,
    (a, b) => `${a} and ${b} hit the same descent groove. Physics wins. They crash, tumble, and land in a heap. Accusations start before the dust settles.`,
    (a, b) => `${a} tries to pass ${b} on the slide. Bad idea. They clip each other and cartwheel into the sand. Neither is happy.`,
  ],
  respect: [
    (a, b, apr) => `${a} watches ${b} power through the obstacle and nods. No words needed. That was impressive. Even an enemy earns respect.`,
    (a, b, apr) => `${b} finishes the phase and finds ${a} waiting. "Nice run." The compliment is genuine. ${a} tips an imaginary hat.`,
    (a, b, apr) => `${a} sees ${b} struggling but pushing through with grit. ${apr.Sub} won't help — wrong tribe — but something like admiration flickers.`,
    (a, b, apr) => `"You're faster than I thought," ${a} admits to ${b} after the phase. It's a compliment wrapped in a threat.`,
  ],
};

// ── DEITY JUDGMENT TEXT ──
const DEITY_JUDGMENT = {
  anubis: {
    bless: [
      (player, pr) => `Anubis, Guardian of the Dead, peers through the darkness. ${pr.posAdj} eyes find ${player} — and approve. "${player} passes the weighing of the heart."`,
      (player, pr) => `The jackal god's shadow falls across ${player}. But it is not threatening — it is protective. Anubis grants safe passage through the dark.`,
    ],
    curse: [
      (player, pr) => `Anubis turns ${pr.posAdj} jackal head toward ${player}. The temperature drops. "${player}'s heart is heavy with deception." The walls seem to close in.`,
      (player, pr) => `The shadows deepen around ${player}. Anubis has weighed ${pr.posAdj} heart against the feather of Ma'at — and found it wanting.`,
    ],
  },
  ra: {
    bless: [
      (player, pr) => `Ra's light blazes through the clouds and lands on ${player}. Warmth floods ${pr.posAdj} body. The sun god grants ${pr.obj} renewed strength.`,
      (player, pr) => `The Eye of Ra opens above ${player}. Golden light pours down. ${pr.Sub} feels invincible — and for this moment, ${pr.sub} is.`,
    ],
    curse: [
      (player, pr) => `Ra's fury descends. The sun intensifies specifically on ${player}. Sweat pours. Vision blurs. The sun god demands more from this mortal.`,
      (player, pr) => `The desert sun singles out ${player}. Heat distortion warps the air around ${pr.obj}. Ra is not finished testing this one.`,
    ],
  },
  sobek: {
    bless: [
      (player, pr) => `Sobek, Lord of the Waters, parts the current for ${player}. The Nile itself bows. Crocodiles scatter. ${pr.Sub} rows through glass-smooth water.`,
      (player, pr) => `A massive crocodile surfaces beside ${player}'s boat — then swims ahead, clearing a path. Sobek protects ${pr.posAdj} favored.`,
    ],
    curse: [
      (player, pr) => `Sobek's eye glints beneath the surface. The current shifts against ${player}. The river has teeth — and they're aimed at ${pr.obj}.`,
      (player, pr) => `The water churns around ${player}'s oar. Sobek's displeasure is palpable. The Nile fights every stroke ${pr.sub} takes.`,
    ],
  },
  isis: {
    bless: [
      (player, pr) => `Isis spreads her wings of protection. ${player} feels a calm descend — focus sharpens, pain fades, the path ahead becomes clear.`,
      (player, pr) => `The wisdom of Isis touches ${player}'s mind. ${pr.Sub} sees the way forward with crystalline clarity. The goddess rewards the worthy.`,
    ],
    curse: [
      (player, pr) => `Isis withdraws her favor. ${player} stumbles where others walked sure-footed. The goddess of magic strips the veil of protection.`,
      (player, pr) => `${player} feels Isis's gaze — not warmth, but scrutiny. The goddess tests those who think themselves clever enough.`,
    ],
  },
};

// ── PHASE 3: NILE CROSSING ──
const WEAVING_TEXT = {
  good: [
    (n, pr) => `${n}'s fingers fly through the reeds. Tight weave, perfect tension. ${pr.posAdj} section of the boat is practically waterproof.`,
    (n, pr) => `${n} weaves with a craftsman's touch. Every reed locked in, every gap sealed. The boat takes shape under ${pr.posAdj} hands.`,
    (n, pr) => `"I used to make baskets at camp." ${n} wasn't lying. ${pr.posAdj} weaving is miles ahead of everyone else's.`,
    (n, pr) => `${n} picks up the technique instantly. ${pr.Sub} weaves two sections while others are still figuring out the pattern.`,
    (n, pr) => `Steady hands, sharp focus. ${n} produces a boat section that could survive the open sea, let alone the Nile.`,
    (n, pr) => `${n} hums while ${pr.sub} works. The reeds obey ${pr.posAdj} hands. The result is beautiful — tight, sturdy, reliable.`,
  ],
  bad: [
    (n, pr) => `${n}'s section looks like a bird's nest in a windstorm. Reeds stick out at angles. Water is getting through. Everywhere.`,
    (n, pr) => `"Is that supposed to be a boat?" ${n}'s weaving is... creative. Unfortunately, creativity doesn't float.`,
    (n, pr) => `${n} breaks three reeds trying to force them into a pattern. ${pr.posAdj} section is more hole than boat.`,
    (n, pr) => `${n} cannot weave. The reeds fight ${pr.obj}. The pattern defeats ${pr.obj}. ${pr.posAdj} section is a structural liability.`,
    (n, pr) => `${n} stares at the reeds. The reeds stare back. Nothing productive happens for an embarrassing amount of time.`,
    (n, pr) => `${n}'s weaving is so bad that a teammate quietly redoes ${pr.posAdj} entire section when ${pr.sub} isn't looking.`,
  ],
  prodigy: [
    (n, pr) => `${n} is a weaving PRODIGY. ${pr.Sub} finishes ${pr.posAdj} section, helps three teammates, and reinforces the hull. The boat is a masterpiece because of ${pr.obj}.`,
    (n, pr) => `Something clicks for ${n}. ${pr.Sub} weaves like ${pr.posAdj} hands were designed for it. The tribe's boat quality doubles thanks to ${pr.obj} alone.`,
    (n, pr) => `${n} takes over the entire boat construction. "Let me." ${pr.posAdj} fingers blur. The result is structurally perfect. Even ${host()} looks impressed.`,
    (n, pr) => `"I've never seen anyone weave like that," a teammate whispers. ${n} doesn't hear — ${pr.sub}'s too busy building the best boat in challenge history.`,
  ],
};

const ANIMAL_LOAD_TEXT = {
  camelSuccess: [
    (n, pr) => `${n} sweet-talks the camel into the basket boat. It takes persuasion, two apples, and a full-body push, but the beast cooperates. Eventually.`,
    (n, pr) => `The camel resists, but ${n}'s patience wins out. ${pr.Sub} guides the animal in with steady hands and a calm voice. "Easy. Easy. There you go."`,
    (n, pr) => `${n} stares the camel down. The camel blinks first. It climbs into the boat with a disgusted groan. Victory.`,
    (n, pr) => `"You're getting in that boat." ${n}'s tone leaves no room for argument. The camel senses authority and complies. Grudgingly.`,
    (n, pr) => `${n} finds the camel's sweet spot — behind the ears. Scratches. The camel melts. Into the boat it goes. Smooth.`,
  ],
  camelFail: [
    (n, pr) => `The camel spits in ${n}'s face. Then sits down. Then spits again. It is NOT getting in that boat and ${n} can NOT make it.`,
    (n, pr) => `${n} pushes. The camel doesn't move. ${n} pulls. The camel moves backward. ${pr.Sub} is losing this argument badly.`,
    (n, pr) => `${n} tries everything — coaxing, commanding, bribing. The camel responds by kicking the boat. Major setback.`,
    (n, pr) => `"GET IN THE BOAT!" ${n} is shouting at a camel. The camel is winning. ${pr.Sub} is not.`,
    (n, pr) => `The camel likes ${n} exactly enough to not leave, and exactly not enough to cooperate. ${pr.Sub} is trapped in camel purgatory.`,
  ],
  speakingCamel: [
    (n, pr) => `${n} tries something desperate — ${pr.sub} makes a series of grunts and clicks at the camel. The camel's ears perk up. It... responds? And climbs into the boat. Nobody can explain what just happened.`,
    (n, pr) => `"HRRRNGGGG." ${n} is... speaking camel? ${pr.Sub} makes a noise that should not come from a human throat. The camel nods — NODS — and steps into the basket. The tribe is speechless.`,
    (n, pr) => `${n} drops to all fours and makes eye contact with the camel at its level. Then ${pr.sub} makes a sound. The camel makes the same sound. Then it gets in the boat. What.`,
    (n, pr) => `"I saw this in a documentary," ${n} says, right before making a sound like a rusty gate. The camel startles, studies ${pr.obj}, and then — impossibly — cooperates. The tribe will never look at ${n} the same way.`,
  ],
  goat: [
    (n, pr) => `The goat hops into the boat like it's been doing this its whole life. Easy. It immediately starts chewing the reeds. Less easy.`,
    (n, pr) => `Loading the goat takes three seconds. It jumps in, sits down, and looks bored. But now it's chewing the hull.`,
    (n, pr) => `The goat is cooperative. Suspiciously cooperative. It sits in the boat, bleats once, and starts nervously eying the water.`,
    (n, pr) => `The goat loads easy but starts panicking the moment it sees the river. Bleating. Thrashing. ${n} has to hold it still.`,
    (n, pr) => `"At least the goat gets in the boat." ${n} lifts the goat in. It weighs nothing. Then it sees the water and loses its mind.`,
  ],
  stickInstant: [
    t => `No animal to load. ${t} sticks the stick in the boat (pun intended) and pushes off immediately. Time advantage: massive.`,
    t => `"Load the animal." ${t} places the stick in the boat. "Done." While others wrestle camels and goats, they're already rowing.`,
    t => `The stick goes in the boat. Two seconds. ${t} is paddling while the other tribes are still arguing with livestock.`,
    t => `${t} picks up the stick, puts it in the boat, and launches. Fastest animal-loading time in challenge history.`,
  ],
};

const ROWING_TEXT = {
  good: [
    (n, pr) => `${n} rows with power and rhythm. Every stroke drives the boat forward. ${pr.Sub} is an engine.`,
    (n, pr) => `${n} finds ${pr.posAdj} stroke and the boat surges. Efficient, powerful, steady. The river bows to ${pr.posAdj} effort.`,
    (n, pr) => `Arms burning, ${n} doesn't slow down. ${pr.Sub} rows like the crocs behind them are personal motivation.`,
    (n, pr) => `${n} digs deep and rows hard. The boat cuts through the current. ${pr.posAdj} tribe gains a full length on the competition.`,
    (n, pr) => `Splash after splash, ${n} powers through. Endurance meets determination. ${pr.posAdj} rowing is relentless.`,
  ],
  bad: [
    (n, pr) => `${n}'s rowing is... counterproductive. ${pr.Sub} keeps catching crabs — wrong angle, wrong timing. The boat barely moves.`,
    (n, pr) => `${n} rows hard. Unfortunately, ${pr.sub} rows hard in slightly the wrong direction. The boat drifts sideways.`,
    (n, pr) => `${n}'s arms give out mid-river. ${pr.Sub} ${pr.sub === 'they' ? 'slump' : 'slumps'} over the oar, gasping. The boat loses momentum.`,
    (n, pr) => `${n} and the river are having a disagreement about which direction the boat should go. The river is winning.`,
    (n, pr) => `${n} drops the oar. Picks it up. Drops it again. The current pushes them backward during the fumble.`,
  ],
};

const CROC_TEXT = {
  attack: [
    (n, pr) => `A croc surges from the murk and snaps at the boat near ${n}. Reeds splinter. "IT HIT THE BOAT!"`,
    (n, pr) => `Crocodile — big one — comes straight at ${n}'s side of the boat. Jaws wide. The tribe screams.`,
    (n, pr) => `The water erupts next to ${n}. Scales, teeth, and bad intentions. The croc wants ${pr.obj} specifically.`,
    (n, pr) => `${n} sees the croc too late. It rams the boat from below, launching ${pr.obj} half out of the basket. HOLD ON.`,
    (n, pr) => `Two yellow eyes break the surface next to ${n}. The croc hisses. ${n} stares into primal terror.`,
  ],
  defenseSuccess: [
    (n, pr) => `${n} swings an oar and CRACKS the croc across the snout. It veers away, stunned. "NOT TODAY."`,
    (n, pr) => `${n} kicks the croc square in the nose. It sinks below the surface, dazed. The boat survives.`,
    (n, pr) => `${n} shoves ${pr.posAdj} oar into the croc's mouth and forces it sideways. The beast spins away. Close. Too close.`,
    (n, pr) => `${n} doesn't think — just acts. Fist meets croc snout. The croc considers this and decides to find easier prey.`,
    (n, pr) => `${n} jams a reed bundle at the croc like a lance. The croc bites the reeds instead of the boat. Decoy: successful.`,
  ],
  defenseFail: [
    (n, pr) => `${n} swings at the croc and misses. The croc doesn't miss — it takes a chunk out of the boat's hull. Water floods in.`,
    (n, pr) => `${n} freezes. The croc's jaws close on the boat edge inches from ${pr.posAdj} hand. Reeds tear. Water enters. Panic.`,
    (n, pr) => `${n} tries to fend off the croc but ${pr.posAdj} arms won't cooperate. The croc rips through the hull. The boat is taking on water.`,
    (n, pr) => `The croc is faster than ${n}. It bites the boat, shakes, and tears a hole the size of a basketball. Not good.`,
    (n, pr) => `${n} throws ${pr.posAdj} oar at the croc. Misses. Now ${pr.sub}'s down an oar AND the croc is still attacking. Bad trade.`,
  ],
  heroSave: [
    (hero, saved, hpr) => `"LOOK OUT!" ${hero} throws ${hpr.ref} between ${saved} and the croc, taking the hit. The croc bites ${hpr.posAdj} oar instead of ${saved}. Heroic.`,
    (hero, saved, hpr) => `${hero} grabs ${saved} by the collar and yanks ${pronouns(saved).obj} back just as the croc's jaws snap shut where ${pronouns(saved).sub} was sitting. Inches from disaster.`,
    (hero, saved, hpr) => `${hero} doesn't hesitate. ${hpr.Sub} dives across the boat and shields ${saved} with ${hpr.posAdj} own body. The croc's jaws clamp on ${hpr.posAdj} oar. "${saved}, you okay?"`,
    (hero, saved, hpr) => `Without a word, ${hero} pushes ${saved} aside and faces the croc alone. ${hpr.Sub} takes the hit so ${saved} doesn't have to. That's what heroes do.`,
    (hero, saved, hpr) => `${hero} sees the croc coming for ${saved} and acts on instinct. ${hpr.Sub} absorbs the impact, the boat lurches, but ${saved} is safe. "You owe me," ${hero} gasps.`,
  ],
  villainShove: [
    (villain, target, vpr) => `In the chaos, ${villain} shoves ${target} toward the croc's jaws. "${vpr.Sub} slipped," ${villain} says with a smile that says otherwise.`,
    (villain, target, vpr) => `${villain} "accidentally" pushes ${target} into the croc's path. The croc snaps. ${target} scrambles back. ${villain} shrugs. "Oops."`,
    (villain, target, vpr) => `"Better you than me." ${villain} uses ${target} as a human shield against the croc. Subtle? No. Effective? Unfortunately, yes.`,
    (villain, target, vpr) => `${villain} nudges ${target} off-balance just as the croc strikes. ${target} nearly goes overboard. ${villain} helps ${pronouns(target).obj} back up, playing innocent.`,
    (villain, target, vpr) => `Under cover of the croc attack, ${villain} elbows ${target} toward the water. "Whoops. Current shifted." ${vpr.posAdj} eyes say everything ${vpr.posAdj} mouth won't.`,
  ],
  villainShoveCaught: [
    (villain, target, witness) => `"I SAW THAT." ${witness} watched ${villain} push ${target}. The tribe turns. ${villain}'s cover is blown. "It was the current—" Nobody believes ${villain}.`,
    (villain, target, witness) => `${witness} catches ${villain}'s shove in real-time. "Are you SERIOUS right now?" The boat erupts. ${villain}'s social game just cratered.`,
    (villain, target, witness) => `"${villain} just PUSHED ${target} at the croc!" ${witness} isn't letting this slide. The tribe stares at ${villain}. ${villain} has no defense.`,
    (villain, target, witness) => `${witness} locks eyes with ${villain} mid-shove. They both know what happened. "We'll talk about this at camp," ${witness} says quietly. ${villain} goes pale.`,
  ],
};

const FINAL_SPRINT_TEXT = {
  good: [
    (t) => `${t}'s boat holds. They bail water as they go, but the hull is solid. The final stretch is a sprint to the shore.`,
    (t) => `Battered but afloat, ${t} powers through the final stretch. The reeds hold. The crew holds. The finish is in sight.`,
    (t) => `${t}'s weaving pays off now — the boat barely leaks despite the croc damage. They cross the finish with dry(ish) feet.`,
    (t) => `${t} hits the final stretch with momentum. The boat creaks, the crew is exhausted, but they're going to make it.`,
  ],
  bad: [
    (t) => `${t}'s boat is taking on water fast. They're bailing with their hands while rowing with their elbows. It's a disaster in slow motion.`,
    (t) => `The hull is failing. ${t} is sinking by inches. Every stroke pushes water in as much as forward. This is going to be close.`,
    (t) => `${t}'s boat is more water than boat at this point. They're essentially swimming while sitting in a reed basket. Not ideal.`,
    (t) => `${t} can see the bottom of the river through their boat. That's not a feature. That's structural failure.`,
  ],
  sinking: [
    (t) => `${t}'s boat gives up the ghost. The reeds split and the whole thing folds. They're in the water — swimming, thrashing, dragging their animal to shore.`,
    (t) => `SINKING. ${t}'s boat breaks apart mid-river. Players scatter. The animal panics. It's every person for themselves now.`,
    (t) => `The boat collapses. ${t} is in the Nile, swimming with the crocs. The shore is close but not close enough. This is a nightmare.`,
    (t) => `${t}'s boat disintegrates in a burst of reeds and broken dreams. The swim to shore is the longest of their lives.`,
    (t) => `The boat doesn't so much sink as dissolve. ${t} is suddenly swimming and wondering where all those crocodiles went.`,
  ],
};

const BAIL_TEXT = [
  (n, pr) => `${n} bails water frantically, cupping ${pr.posAdj} hands and throwing Nile back into Nile. ${pr.Sub}'s fighting a losing battle but won't give up.`,
  (n, pr) => `${n} is on bail duty — scooping water out with both hands while the others row. ${pr.posAdj} arms are burning.`,
  (n, pr) => `"I can keep us afloat!" ${n} bails like ${pr.posAdj} life depends on it. It might.`,
  (n, pr) => `${n} tears off ${pr.posAdj} shirt and uses it as a bucket, wringing water over the side. Improvised, desperate, and barely working.`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION ENGINE
// ══════════════════════════════════════════════════════════════

export function simulateWalkLikeAnEgyptian(ep) {
  _resetPickCache();
  const tribes = gs.tribes;
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => {
    if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] };
  });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  const allActive = [];
  tribes.forEach(t => t.members.forEach(m => {
    ep.chalMemberScores[m] = 0;
    allActive.push(m);
  }));

  // ── Master result object ──
  const result = {
    tribes: {},
    phase1: { choices: [], overBeats: [], underBeats: [], mummifiedDog: null, socialEvents: [], deityJudgments: [] },
    phase2: { leaders: {}, navBeats: [], scarabSwarm: [], socialEvents: [], deityJudgments: [], reactions: [], encounters: [], stickLost: false, stickDiscovery: null },
    phase3: { weaving: [], animalLoading: [], rowingBeats: [], crocAttacks: [], finalSprint: [], boatSunk: null, socialEvents: [], deityJudgments: [] },
    tribeFinishOrder: [],
    hostLines: {
      intro: pick(HOST_TEXT.intro)(host()),
      phase1: pick(HOST_TEXT.phase1)(host()),
      phase2: pick(HOST_TEXT.phase2)(host()),
      phase3: pick(HOST_TEXT.phase3)(host()),
    },
    immunityTribe: null,
    losingTribe: null,
  };

  // ══════════════════════════════════════════════════════════
  // PHASE 1: PYRAMID OVER/UNDER
  // ══════════════════════════════════════════════════════════
  const tribeP1Scores = {}; // tribeName → avg score
  const summitViewPlayers = []; // players who got summit view

  tribes.forEach(tribe => {
    const tName = tribe.name;
    result.tribes[tName] = { members: [...tribe.members], reward: null, p1Avg: 0, p2Score: 0, p3Score: 0, totalScore: 0, boatQuality: 0, boatDamage: 0 };

    tribe.members.forEach(name => {
      const s = pStats(name);
      const pr = pronouns(name);
      const a = arch(name);

      // ── Choice logic ──
      let overBias = 0.5; // default even
      if (['challenge-beast', 'hothead', 'hero'].includes(a)) overBias = 0.75;
      else if (['schemer', 'mastermind', 'perceptive-player'].includes(a)) overBias = 0.25;
      else if (['wildcard', 'chaos-agent'].includes(a)) overBias = 0.5; // coin flip
      else overBias = clamp(s.physical / (s.physical + s.mental + 0.01) + noise(1.5) * 0.1, 0.1, 0.9);

      const goesOver = Math.random() < overBias;
      const choice = { name, tribe: tName, path: goesOver ? 'over' : 'under', score: 0, beats: [], summitView: false };

      if (goesOver) {
        // ── OVER: Ascent ──
        const ascentRaw = s.physical * s.endurance * 0.15 + noise(2.5);
        const ascentScore = clamp(ascentRaw, 0, 15);
        let ascentTier, ascentPool;
        if (ascentScore >= 9) { ascentTier = 'good'; ascentPool = OVER_ASCENT_TEXT.good; }
        else if (ascentScore <= 4) {
          ascentTier = Math.random() < 0.4 ? 'comedy' : 'bad';
          ascentPool = ascentTier === 'comedy' ? OVER_ASCENT_TEXT.comedy : OVER_ASCENT_TEXT.bad;
        } else { ascentTier = 'mid'; ascentPool = OVER_ASCENT_TEXT.good; } // mid uses good pool with lower score

        const ascentText = pick(ascentPool)(name, pr);
        choice.beats.push({ type: 'ascent', score: ascentScore, tier: ascentTier, text: ascentText });
        choice.score += ascentScore;

        // Summit view for top climbers
        if (ascentScore >= 8) {
          choice.summitView = true;
          summitViewPlayers.push(name);
          const svText = pick(SUMMIT_VIEW)(name, pr);
          choice.beats.push({ type: 'summitView', text: svText });
          popDelta(name, 1);
        }

        // ── OVER: Descent ──
        const surfChance = s.physical * 0.06 + s.boldness * 0.06 + noise(1.5) * 0.1;
        const trySurf = Math.random() < clamp(surfChance, 0.1, 0.85);

        if (trySurf) {
          const surfScore = s.physical * s.boldness * 0.12 + noise(2.5);
          if (surfScore >= 5) {
            // Check for collision with another OVER player in same tribe
            const otherOverInTribe = result.phase1.choices.filter(c => c.tribe === tName && c.path === 'over' && c.name !== name);
            const collisionChance = otherOverInTribe.length * 0.15;
            if (otherOverInTribe.length > 0 && Math.random() < collisionChance) {
              const other = pick(otherOverInTribe);
              const collText = pick(OVER_DESCENT_SURF.collision)(name, other.name, pr);
              choice.beats.push({ type: 'descent', method: 'surf_collision', score: -2, text: collText, collidedWith: other.name });
              choice.score -= 2;
              addBond(name, other.name, -0.3);
              ep.chalMemberScores[name] += -2;
            } else {
              const surfText = pick(OVER_DESCENT_SURF.success)(name, pr);
              const descentBonus = 4 + noise(1.5);
              choice.beats.push({ type: 'descent', method: 'surf_success', score: descentBonus, text: surfText });
              choice.score += descentBonus;
              popDelta(name, 1);
            }
          } else {
            const failText = pick(OVER_DESCENT_SURF.fail)(name, pr);
            choice.beats.push({ type: 'descent', method: 'surf_fail', score: -1, text: failText });
            choice.score -= 1;
            popDelta(name, -1);
          }
        } else {
          const walkText = pick(OVER_DESCENT_WALK)(name, pr);
          const walkScore = 1 + noise(1);
          choice.beats.push({ type: 'descent', method: 'walk', score: walkScore, text: walkText });
          choice.score += walkScore;
        }

        result.phase1.overBeats.push(choice);
      } else {
        // ── UNDER: Three Doors ──
        const doorA_fit = s.mental + s.intuition + noise(2.5);
        const doorB_fit = s.endurance + s.physical + noise(2.5);
        const doorC_fit = s.social + s.boldness + noise(2.5);
        const doorScores = { A: doorA_fit, B: doorB_fit, C: doorC_fit };
        const bestDoor = Object.entries(doorScores).sort(([,a],[,b]) => b - a)[0][0];
        // Actual best door is random per player instance
        const correctDoor = pick(['A', 'B', 'C']);
        const isCorrect = bestDoor === correctDoor;
        const doorText = isCorrect
          ? pick(UNDER_DOOR_TEXT.correct)(name, bestDoor, pr)
          : pick(UNDER_DOOR_TEXT.wrong)(name, bestDoor, pr);
        const doorScore = isCorrect ? 4 + noise(1) : 1 + noise(0.5);
        choice.beats.push({ type: 'door', chosen: bestDoor, correct: correctDoor, isCorrect, score: doorScore, text: doorText });
        choice.score += doorScore;

        // ── UNDER: Trap Encounters (1-2) ──
        const numTraps = Math.random() < 0.5 ? 1 : 2;
        const trapTypes = ['scarab', 'mummy', 'collapse'];
        const chosenTraps = [];
        for (let i = 0; i < numTraps; i++) {
          const avail = trapTypes.filter(t => !chosenTraps.includes(t));
          chosenTraps.push(pick(avail));
        }

        chosenTraps.forEach(trap => {
          let checkStat, pool;
          if (trap === 'scarab') { checkStat = s.endurance; pool = UNDER_TRAP_SCARAB; }
          else if (trap === 'mummy') { checkStat = s.boldness; pool = UNDER_TRAP_MUMMY; }
          else { checkStat = s.physical; pool = UNDER_TRAP_COLLAPSE; }

          const trapRoll = checkStat * 0.8 + noise(2.5);
          const passed = trapRoll >= 4;
          const trapScore = passed ? 3 + noise(1) : -1 + noise(0.5);
          const trapText = passed ? pick(pool.pass)(name, pr) : pick(pool.fail)(name, pr);
          choice.beats.push({ type: `trap_${trap}`, passed, score: trapScore, text: trapText });
          choice.score += trapScore;
        });

        result.phase1.underBeats.push(choice);
      }

      choice.score = clamp(choice.score, 0, 15);
      ep.chalMemberScores[name] += Math.round(choice.score);
      result.phase1.choices.push(choice);
    });

    // ── Phase 1 Social Events (between beats) ──
    const tribeOverP1 = result.phase1.choices.filter(c => c.tribe === tName && c.path === 'over');
    const tribeUnderP1 = result.phase1.choices.filter(c => c.tribe === tName && c.path === 'under');

    // GUARANTEED: Path Debate when tribe splits between over/under
    if (tribeOverP1.length > 0 && tribeUnderP1.length > 0) {
      const overPlayer = pick(tribeOverP1).name;
      const underPlayer = pick(tribeUnderP1).name;
      const opr = pronouns(overPlayer);
      result.phase1.socialEvents.push({
        type: 'pathDebate', tribe: tName, players: [overPlayer, underPlayer],
        text: pick(P1_SOCIAL.pathDebate)(overPlayer, underPlayer, opr),
      });
      addBond(overPlayer, underPlayer, -0.2);
    }

    // GUARANTEED: Trap Buddy among under players (nice archetypes help)
    if (tribeUnderP1.length >= 2) {
      const niceUnder = tribeUnderP1.filter(c => ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog'].includes(arch(c.name)));
      const needyUnder = tribeUnderP1.filter(c => !niceUnder.some(n => n.name === c.name));
      if (niceUnder.length > 0 && needyUnder.length > 0) {
        const hero = pick(niceUnder).name;
        const saved = pick(needyUnder).name;
        const hpr = pronouns(hero);
        result.phase1.socialEvents.push({
          type: 'trapBuddy', tribe: tName, players: [hero, saved],
          text: pick(P1_SOCIAL.trapBuddy)(hero, saved, hpr),
        });
        addBond(saved, hero, 0.5);
        popDelta(hero, 1);
      }
    }

    // GUARANTEED: Summit Taunt if a villain went over and someone went under
    if (tribeOverP1.length > 0 && tribeUnderP1.length > 0) {
      const villainOver = tribeOverP1.filter(c => canScheme(c.name));
      if (villainOver.length > 0) {
        const taunter = pick(villainOver).name;
        const target = pick(tribeUnderP1).name;
        const tpr = pronouns(taunter);
        result.phase1.socialEvents.push({
          type: 'summitTaunt', tribe: tName, players: [taunter, target],
          text: pick(P1_SOCIAL.summitTaunt)(taunter, target, tpr),
        });
        addBond(target, taunter, -0.4);
        popDelta(taunter, -1);
      }
    }

    // GUARANTEED: Mummy Panic Chain when 2+ go under
    if (tribeUnderP1.length >= 2) {
      const panicker = pick(tribeUnderP1).name;
      const affected = pick(tribeUnderP1.filter(c => c.name !== panicker))?.name;
      if (affected) {
        const ppr = pronouns(panicker);
        result.phase1.socialEvents.push({
          type: 'mummyPanic', tribe: tName, players: [panicker, affected],
          text: pick(P1_SOCIAL.mummyPanic)(panicker, affected, ppr),
        });
        addBond(affected, panicker, -0.2);
      }
    }

    // GUARANTEED: Encourage — nice player supports low scorer
    if (tribe.members.length >= 2) {
      const niceMembers = tribe.members.filter(m => ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(arch(m)));
      const lowScorers = result.phase1.choices.filter(c => c.tribe === tName && c.score <= 5).map(c => c.name);
      const validGivers = niceMembers.filter(m => !lowScorers.includes(m));
      if (validGivers.length > 0 && lowScorers.length > 0) {
        const giver = pick(validGivers);
        const receiver = pick(lowScorers);
        const gpr = pronouns(giver);
        result.phase1.socialEvents.push({
          type: 'encourage', tribe: tName, players: [giver, receiver],
          text: pick(P1_SOCIAL.encourage)(giver, receiver, gpr),
        });
        addBond(receiver, giver, 0.3);
      }
    }

    // BONUS: Second encourage (35% chance)
    if (tribe.members.length >= 3 && Math.random() < 0.35) {
      const niceMembers2 = tribe.members.filter(m => ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(arch(m)));
      const usedGivers = result.phase1.socialEvents.filter(e => e.type === 'encourage' && e.tribe === tName).map(e => e.players[0]);
      const availGivers = niceMembers2.filter(m => !usedGivers.includes(m));
      const lowScorers2 = result.phase1.choices.filter(c => c.tribe === tName && c.score <= 6).map(c => c.name).filter(m => !usedGivers.includes(m));
      if (availGivers.length > 0 && lowScorers2.length > 0) {
        const giver = pick(availGivers);
        const receiver = pick(lowScorers2.filter(m => m !== giver));
        if (receiver) {
          const gpr = pronouns(giver);
          result.phase1.socialEvents.push({
            type: 'encourage', tribe: tName, players: [giver, receiver],
            text: pick(P1_SOCIAL.encourage)(giver, receiver, gpr),
          });
          addBond(receiver, giver, 0.3);
        }
      }
    }

    // Anubis Deity Judgment (35% chance per tribe)
    if (Math.random() < 0.35) {
      const judgedPlayer = pick(tribe.members);
      const jpr = pronouns(judgedPlayer);
      const blessed = pStats(judgedPlayer).loyalty >= 5 || arch(judgedPlayer) === 'hero';
      const judgmentText = blessed
        ? pick(DEITY_JUDGMENT.anubis.bless)(judgedPlayer, jpr)
        : pick(DEITY_JUDGMENT.anubis.curse)(judgedPlayer, jpr);
      result.phase1.deityJudgments.push({
        deity: 'anubis', player: judgedPlayer, tribe: tName, blessed,
        text: judgmentText,
      });
      if (blessed) { popDelta(judgedPlayer, 1); ep.chalMemberScores[judgedPlayer] += 2; }
      else { popDelta(judgedPlayer, -1); ep.chalMemberScores[judgedPlayer] -= 1; }
    }

    // Tribe average for P1
    const tribeChoices = result.phase1.choices.filter(c => c.tribe === tName);
    const avg = tribeChoices.reduce((sum, c) => sum + c.score, 0) / (tribeChoices.length || 1);
    tribeP1Scores[tName] = avg;
    result.tribes[tName].p1Avg = avg;
  });

  // ── Cross-Tribe Social Events (same path, different tribes) ──
  const allOverP1 = result.phase1.choices.filter(c => c.path === 'over');
  const allUnderP1 = result.phase1.choices.filter(c => c.path === 'under');
  const tribeNames = tribes.map(t => t.name);

  // Over-path cross-tribe encounters
  for (let ti = 0; ti < tribeNames.length; ti++) {
    for (let tj = ti + 1; tj < tribeNames.length; tj++) {
      const overA = allOverP1.filter(c => c.tribe === tribeNames[ti]);
      const overB = allOverP1.filter(c => c.tribe === tribeNames[tj]);
      if (overA.length > 0 && overB.length > 0) {
        // Guaranteed: same-path encounter
        const a = pick(overA).name;
        const b = pick(overB).name;
        const apr = pronouns(a);
        result.phase1.socialEvents.push({
          type: 'samePath', tribe: null, players: [a, b],
          text: pick(P1_CROSS.samePath)(a, b, 'over', apr),
        });
        addBond(a, b, -0.3);
        popDelta(a, 0.5);
        popDelta(b, 0.5);

        // 50% chance: rivalry/collision on the descent
        if (Math.random() < 0.5 && overA.length > 0 && overB.length > 0) {
          const ra = pick(overA).name;
          const rb = pick(overB.filter(c => c.name !== ra)).name || pick(overB).name;
          if (Math.random() < 0.5) {
            result.phase1.socialEvents.push({
              type: 'surfCollision', tribe: null, players: [ra, rb],
              text: pick(P1_CROSS.surfCollision)(ra, rb),
            });
            addBond(ra, rb, -0.4);
          } else {
            const rpr = pronouns(ra);
            result.phase1.socialEvents.push({
              type: 'overRivalry', tribe: null, players: [ra, rb],
              text: pick(P1_CROSS.overRivalry)(ra, rb, rpr),
            });
            addBond(ra, rb, -0.3);
          }
        }
      }
    }
  }

  // Under-path cross-tribe encounters
  for (let ti = 0; ti < tribeNames.length; ti++) {
    for (let tj = ti + 1; tj < tribeNames.length; tj++) {
      const underA = allUnderP1.filter(c => c.tribe === tribeNames[ti]);
      const underB = allUnderP1.filter(c => c.tribe === tribeNames[tj]);
      if (underA.length > 0 && underB.length > 0) {
        const a = pick(underA).name;
        const b = pick(underB).name;
        const apr = pronouns(a);
        // Guaranteed: tunnel encounter
        result.phase1.socialEvents.push({
          type: 'samePath', tribe: null, players: [a, b],
          text: pick(P1_CROSS.samePath)(a, b, 'under', apr),
        });
        addBond(a, b, -0.2);

        // 45% chance: temporary alliance or rivalry
        if (Math.random() < 0.45) {
          const ua = pick(underA).name;
          const ub = pick(underB.filter(c => c.name !== ua)).name || pick(underB).name;
          const upr = pronouns(ua);
          result.phase1.socialEvents.push({
            type: 'underAlliance', tribe: null, players: [ua, ub],
            text: pick(P1_CROSS.underAlliance)(ua, ub, upr),
          });
          addBond(ua, ub, 0.3);
        }
      }
    }
  }

  // Cross-tribe respect (high performers acknowledge each other)
  const topScorers = [...result.phase1.choices].sort((a, b) => b.score - a.score).slice(0, 4);
  for (let i = 0; i < topScorers.length; i++) {
    for (let j = i + 1; j < topScorers.length; j++) {
      if (topScorers[i].tribe !== topScorers[j].tribe && Math.random() < 0.4) {
        const a = topScorers[i].name;
        const b = topScorers[j].name;
        const apr = pronouns(a);
        result.phase1.socialEvents.push({
          type: 'respect', tribe: null, players: [a, b],
          text: pick(P1_CROSS.respect)(a, b, apr),
        });
        addBond(a, b, 0.2);
        break;
      }
    }
  }

  // ── Mummified Dog (one random UNDER player) ──
  const underPlayers = result.phase1.choices.filter(c => c.path === 'under');
  if (underPlayers.length > 0) {
    const cursedChoice = pick(underPlayers);
    const cursedName = cursedChoice.name;
    const cursedPr = pronouns(cursedName);
    const dogText = pick(UNDER_MUMMIFIED_DOG)(cursedName, cursedPr);
    result.phase1.mummifiedDog = { player: cursedName, tribe: cursedChoice.tribe, text: dogText };
    gs._mummifiedDogCurse = { player: cursedName, expiresEp: gs.episode + 3 };

    cursedChoice.beats.push({ type: 'mummifiedDog', text: dogText });

    // Camp event for curse
    ep.campEvents[cursedChoice.tribe].post.push({
      type: 'mummifiedDogCurse',
      players: [cursedName],
      text: `${cursedName} found a mummified dog in the pyramid tunnels. ${cursedPr.Sub} touched it. The air went cold. Something is following ${cursedPr.obj}.`,
      consequences: 'Cursed for 3 episodes. Scarabs attracted. Bad luck.',
      badgeText: 'CURSED', badgeClass: 'badge-danger',
    });
  }

  // ── Phase 1 finish order → reward assignment ──
  const p1Ranking = tribes.map(t => ({ name: t.name, score: tribeP1Scores[t.name] }))
    .sort((a, b) => b.score - a.score);

  const rewardMap = {};
  p1Ranking.forEach((entry, i) => {
    if (i === 0) rewardMap[entry.name] = 'stick';
    else if (i === p1Ranking.length - 1) rewardMap[entry.name] = 'camel';
    else rewardMap[entry.name] = 'goat';
  });
  if (tribes.length === 2) {
    rewardMap[p1Ranking[0].name] = 'stick';
    rewardMap[p1Ranking[1].name] = 'camel';
  }

  tribes.forEach(t => {
    result.tribes[t.name].reward = rewardMap[t.name];
    const rText = pick(REWARD_TEXT[rewardMap[t.name]])(t.name);
    result.tribes[t.name].rewardText = rText;

    // Tribe reaction — pick the loudest member to voice the reaction
    const loudest = [...t.members].sort((a, b) => (pStats(b).boldness + pStats(b).social) - (pStats(a).boldness + pStats(a).social))[0];
    const lpr = pronouns(loudest);
    const reward = rewardMap[t.name];
    const reactionPool = reward === 'stick' ? REWARD_TEXT.reactionStick : reward === 'goat' ? REWARD_TEXT.reactionGoat : REWARD_TEXT.reactionCamel;
    result.phase2.reactions.push({
      tribe: t.name,
      reward,
      voicedBy: loudest,
      players: [loudest],
      text: pick(reactionPool)(loudest, lpr, t.name),
    });
  });

  // ══════════════════════════════════════════════════════════
  // PHASE 2: DESERT TREK
  // ══════════════════════════════════════════════════════════
  const tribeP2Scores = {};

  tribes.forEach(tribe => {
    const tName = tribe.name;
    const members = [...tribe.members];
    const reward = rewardMap[tName];
    let tribeSpeed = 0;
    let navBonusPenalty = 0;
    const perPlayerP2 = {};
    members.forEach(m => { perPlayerP2[m] = 0; });

    // Speed modifier from reward
    // Speed modifier: stick = divining rod (slight edge), camel = shade (slight edge), goat = neutral.
    // Spread is tight (1.06 vs 1.04 vs 1.0) so reward isn't the only factor that decides P2.
    const speedMod = reward === 'stick' ? 1.06 : reward === 'camel' ? 1.04 : 1.0;
    // Camel gives a small flat nav cushion (the tribe rests in shade, conserves energy).
    if (reward === 'camel') navBonusPenalty += 2;

    // ── Leader Selection ──
    const strategicRanked = [...members].sort((a, b) => pStats(b).strategic - pStats(a).strategic);
    let navigator = strategicRanked[0];
    let leaderBeat = null;

    // Can a hothead/mastermind challenge?
    const challengers = members.filter(m => m !== navigator &&
      ['hothead', 'mastermind', 'schemer', 'villain'].includes(arch(m)) &&
      Math.random() < 0.35);

    if (challengers.length > 0) {
      const challenger = challengers[0];
      const cpr = pronouns(challenger);
      const npr = pronouns(navigator);
      const challengeText = pick(LEADER_TEXT.challenged)(navigator, challenger, npr, cpr);

      // Contest: strategic + social
      const navPower = pStats(navigator).strategic * 0.6 + pStats(navigator).social * 0.4 + noise(2.5);
      const chalPower = pStats(challenger).strategic * 0.6 + pStats(challenger).social * 0.4 + noise(2.5);

      if (chalPower > navPower) {
        const wonText = pick(LEADER_TEXT.challengeWon)(challenger, navigator, cpr);
        leaderBeat = { type: 'leaderChallenge', navigator, challenger, won: true, text: challengeText + ' ' + wonText };
        addBond(navigator, challenger, -0.5);
        navigator = challenger;
      } else {
        const lostText = pick(LEADER_TEXT.challengeLost)(challenger, navigator, cpr);
        leaderBeat = { type: 'leaderChallenge', navigator, challenger, won: false, text: challengeText + ' ' + lostText };
        addBond(navigator, challenger, -0.3);
      }
    } else {
      const npr = pronouns(navigator);
      const selText = pick(LEADER_TEXT.selected)(navigator, npr);
      leaderBeat = { type: 'leaderSelected', navigator, text: selText };
    }

    result.phase2.leaders[tName] = { navigator, beat: leaderBeat };
    perPlayerP2[navigator] = (perPlayerP2[navigator] || 0) + 2; // navigator baseline bonus

    // ── Navigation Beats (2-3) ──
    const numNavBeats = Math.random() < 0.4 ? 3 : 2;
    const navBeats = [];

    for (let i = 0; i < numNavBeats; i++) {
      const nStats = pStats(navigator);
      const difficulty = 5 + i * 1.5 + noise(1.5);
      const navRoll = nStats.mental * 0.5 + nStats.intuition * 0.5 + noise(2.5);
      const navPr = pronouns(navigator);

      let beatResult;
      if (navRoll >= difficulty + 2) {
        beatResult = { type: 'nav', tribe: tName, navigator, success: 'good', text: _pickUnique(NAV_TEXT.success, `nav-good-${navigator}`)(navigator, navPr), score: 3 };
        navBonusPenalty += 3;
        perPlayerP2[navigator] += 3;
      } else if (navRoll >= difficulty - 1) {
        beatResult = { type: 'nav', tribe: tName, navigator, success: 'fail', text: _pickUnique(NAV_TEXT.fail, `nav-fail-${navigator}`)(navigator, navPr), score: -1 };
        navBonusPenalty -= 1;
        perPlayerP2[navigator] -= 1;
      } else {
        beatResult = { type: 'nav', tribe: tName, navigator, success: 'lost', text: _pickUnique(NAV_TEXT.lost, `nav-lost-${navigator}`)(navigator, navPr), score: -3 };
        navBonusPenalty -= 3;
        perPlayerP2[navigator] -= 3;
        popDelta(navigator, -1);
      }

      // Summit view shortcut attempt?
      const svPlayersInTribe = summitViewPlayers.filter(p => tribe.members.includes(p));
      if (svPlayersInTribe.length > 0 && i === 0 && Math.random() < 0.6) {
        const spotter = pick(svPlayersInTribe);
        const spotPr = pronouns(spotter);
        const attemptText = pick(SHORTCUT_TEXT.attempt)(spotter, spotPr);
        const spotRoll = pStats(spotter).boldness * 0.5 + pStats(spotter).intuition * 0.5 + noise(2.5);
        if (spotRoll >= 5) {
          const successText = pick(SHORTCUT_TEXT.success)(spotter, spotPr);
          beatResult.shortcut = { player: spotter, success: true, text: attemptText + ' ' + successText };
          navBonusPenalty += 5;
          perPlayerP2[spotter] = (perPlayerP2[spotter] || 0) + 4;
          popDelta(spotter, 1);
          addBond(navigator, spotter, 0.3);
        } else {
          const failText = pick(SHORTCUT_TEXT.fail)(spotter, spotPr);
          beatResult.shortcut = { player: spotter, success: false, text: attemptText + ' ' + failText };
          navBonusPenalty -= 3;
          perPlayerP2[spotter] = (perPlayerP2[spotter] || 0) - 2;
          popDelta(spotter, -1);
        }
      }

      navBeats.push(beatResult);
      result.phase2.navBeats.push(beatResult);
    }

    // ── Stick Discovery (last-place tribe only) ──
    if (reward === 'stick') {
      const mentalRanked = [...members].sort((a, b) => (pStats(b).mental + pStats(b).intuition) - (pStats(a).mental + pStats(a).intuition));
      const discoverer = mentalRanked[0];
      const discRoll = pStats(discoverer).mental * 0.4 + pStats(discoverer).intuition * 0.4 + noise(2.5);

      if (discRoll >= 4) {
        const discPr = pronouns(discoverer);
        const discText = pick(REWARD_TEXT.stickDiscovery)(discoverer, discPr);
        result.phase2.stickDiscovery = { player: discoverer, tribe: tName, text: discText };
        navBonusPenalty += 3; // Divining rod is roughly one good nav beat — not a free win
        perPlayerP2[discoverer] = (perPlayerP2[discoverer] || 0) + 4;
        popDelta(discoverer, 1);

        ep.campEvents[tName].post.push({
          type: 'stickDiscovery',
          players: [discoverer],
          text: `${discoverer} discovered the stick was actually a sorcerer's divining rod and used it to navigate the desert. The winner's reward pays off.`,
          consequences: 'Navigation bonus for the tribe. +1 popularity.',
          badgeText: 'DIVINING ROD', badgeClass: 'badge-info',
        });

        // Stick loss event (20% chance)
        if (Math.random() < 0.2) {
          const loser = pick(members);
          const loserPr = pronouns(loser);
          const lostText = pick(REWARD_TEXT.stickLost)(tName, loser, loserPr);
          result.phase2.stickLost = true;
          result.phase2.stickLostEvent = { player: loser, tribe: tName, text: lostText };
          navBonusPenalty -= 2; // lose most of the benefit
        }
      }
    }

    // ── Scarab Swarm (2-3 featured players per tribe, all scored) ──
    const scarabResults = [];
    const cursedPlayer = result.phase1.mummifiedDog?.player;

    // Score all members but only feature 2-3 in VP
    const scarabRolls = members.map(name => {
      const s = pStats(name);
      const isCursed = name === cursedPlayer;
      const swarmRoll = s.endurance * 0.5 + s.mental * 0.3 + noise(2.5) - (isCursed ? 3 : 0);
      const passed = swarmRoll >= 4;
      if (isCursed) { perPlayerP2[name] = (perPlayerP2[name] || 0) - 3; }
      else if (passed) { perPlayerP2[name] = (perPlayerP2[name] || 0) + 2; }
      else { perPlayerP2[name] = (perPlayerP2[name] || 0) - 1; }
      return { name, passed, cursed: isCursed, roll: swarmRoll };
    });

    // Feature ONE highlight per tribe — prefer cursed player, else most dramatic outcome
    const featured = new Set();
    const cursedEntry = scarabRolls.find(r => r.cursed);
    if (cursedEntry) {
      featured.add(cursedEntry.name);
    } else {
      // Pick whichever is more extreme: worst fail or best pass
      const worstFail = scarabRolls.filter(r => !r.passed).sort((a, b) => a.roll - b.roll)[0];
      const bestPass = scarabRolls.filter(r => r.passed).sort((a, b) => b.roll - a.roll)[0];
      const drama = !worstFail ? bestPass : !bestPass ? worstFail : (Math.abs(worstFail.roll) > Math.abs(bestPass.roll - 4) ? worstFail : bestPass);
      if (drama) featured.add(drama.name);
    }

    for (const entry of scarabRolls.filter(r => featured.has(r.name))) {
      const pr = pronouns(entry.name);
      let scarabBeat;
      if (entry.cursed) {
        scarabBeat = { name: entry.name, tribe: tName, passed: false, cursed: true, text: pick(SCARAB_SWARM_TEXT.cursedExtra)(entry.name, pr), score: -3 };
      } else if (entry.passed) {
        scarabBeat = { name: entry.name, tribe: tName, passed: true, cursed: false, text: pick(SCARAB_SWARM_TEXT.pass)(entry.name, pr), score: 2 };
      } else {
        scarabBeat = { name: entry.name, tribe: tName, passed: false, cursed: false, text: pick(SCARAB_SWARM_TEXT.fail)(entry.name, pr), score: -1 };
      }
      scarabResults.push(scarabBeat);
      result.phase2.scarabSwarm.push(scarabBeat);
    }

    // ── Scarab Calmer (one per tribe may try) ──
    const calmCandidates = members.filter(m => {
      const s = pStats(m);
      return s.social * 0.5 + s.boldness * 0.5 + noise(1) >= 5;
    });
    if (calmCandidates.length > 0 && Math.random() < 0.2) {
      const calmer = pick(calmCandidates);
      const calmerPr = pronouns(calmer);
      const calmRoll = pStats(calmer).social * 0.5 + pStats(calmer).boldness * 0.5 + noise(2.5);
      if (calmRoll >= 5.5) {
        const calmText = pick(SCARAB_SWARM_TEXT.calmSuccess)(calmer, calmerPr);
        result.phase2.scarabSwarm.push({ name: calmer, tribe: tName, type: 'calm', success: true, text: calmText, score: 5 });
        perPlayerP2[calmer] = (perPlayerP2[calmer] || 0) + 5;
        popDelta(calmer, 1);

        ep.campEvents[tName].post.push({
          type: 'scarabCalmer',
          players: [calmer],
          text: `${calmer} calmed the scarab swarm during the desert trek. The tribe walked through unscathed thanks to ${calmerPr.obj}.`,
          consequences: 'Scarab calmer bonus. +1 popularity. Bond +0.2 from tribe.',
          badgeText: 'SCARAB WHISPERER', badgeClass: 'badge-success',
        });
        members.filter(m => m !== calmer).forEach(m => addBond(m, calmer, 0.2));
      } else {
        const failText = pick(SCARAB_SWARM_TEXT.calmFail)(calmer, calmerPr);
        result.phase2.scarabSwarm.push({ name: calmer, tribe: tName, type: 'calm', success: false, text: failText, score: -2 });
        perPlayerP2[calmer] = (perPlayerP2[calmer] || 0) - 2;
      }
    }

    // ── Social Events (2-3) ──
    const numSocial = Math.random() < 0.5 ? 3 : 2;
    const socialTypes = ['seduction', 'alliance', 'blame'];
    const usedTypes = [];

    for (let i = 0; i < numSocial && i < socialTypes.length; i++) {
      const avail = socialTypes.filter(t => !usedTypes.includes(t));
      if (avail.length === 0) break;
      const sType = pick(avail);
      usedTypes.push(sType);

      if (sType === 'seduction') {
        const schemers = members.filter(m => canScheme(m));
        if (schemers.length > 0) {
          const schemer = pick(schemers);
          const targets = members.filter(m => m !== schemer);
          if (targets.length > 0) {
            const target = pick(targets);
            const spr = pronouns(schemer);
            const sText = pick(SOCIAL_TEXT.seduction)(schemer, target, spr);
            const seductionRoll = pStats(schemer).social * 0.6 + pStats(schemer).strategic * 0.4 + noise(2.5);
            const resistRoll = pStats(target).intuition * 0.5 + pStats(target).mental * 0.5 + noise(2.5);
            const success = seductionRoll > resistRoll;

            result.phase2.socialEvents.push({ type: 'seduction', schemer, target, players: [schemer, target], tribe: tName, success, text: sText });

            if (success) {
              addBond(target, schemer, 0.4);
              perPlayerP2[schemer] = (perPlayerP2[schemer] || 0) + 1;
            } else {
              addBond(target, schemer, -0.2);
            }
          }
        }
      } else if (sType === 'alliance') {
        if (members.length >= 2) {
          const shuffled = [...members].sort(() => Math.random() - 0.5);
          const a = shuffled[0], b = shuffled[1];
          const apr = pronouns(a);
          const alliText = pick(SOCIAL_TEXT.alliance)(a, b, apr);
          result.phase2.socialEvents.push({ type: 'alliance', players: [a, b], tribe: tName, text: alliText });
          addBond(a, b, 0.5);
          perPlayerP2[a] = (perPlayerP2[a] || 0) + 1;
          perPlayerP2[b] = (perPlayerP2[b] || 0) + 1;
        }
      } else if (sType === 'blame') {
        // Lowest bond member gets blame
        const bondSums = members.map(m => {
          const sum = members.filter(o => o !== m).reduce((acc, o) => acc + getBond(m, o), 0);
          return { name: m, sum };
        }).sort((a, b) => a.sum - b.sum);
        const blameTarget = bondSums[0].name;
        const bpr = pronouns(blameTarget);
        const blameText = pick(SOCIAL_TEXT.blame)(blameTarget, tName, bpr);
        result.phase2.socialEvents.push({ type: 'blame', target: blameTarget, players: [blameTarget], tribe: tName, text: blameText });

        gs._egyptHeat = { target: blameTarget, amount: 1.5, expiresEp: gs.episode + 2 };
        members.filter(m => m !== blameTarget).forEach(m => addBond(m, blameTarget, -0.3));
        popDelta(blameTarget, -1);

        ep.campEvents[tName].post.push({
          type: 'egyptBlame',
          players: [blameTarget, ...members.filter(m => m !== blameTarget).slice(0, 2)],
          text: `${blameTarget} got blamed for slowing the tribe down during the desert trek. The heat is on.`,
          consequences: 'Heat +1.5 (2 episodes). Bond -0.3 from tribe. -1 popularity.',
          badgeText: 'BLAMED', badgeClass: 'badge-warning',
        });
      }
    }

    // ── Phase 2 Additional Social Events ──

    // Water Share/Hoard (GUARANTEED when 2+ members)
    if (members.length >= 2) {
      const niceForWater = members.filter(m => ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog'].includes(arch(m)));
      const villainsForWater = members.filter(m => canScheme(m));
      const weakest = [...members].sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];

      if (niceForWater.length > 0 && Math.random() < 0.6) {
        const giver = pick(niceForWater);
        const receiver = weakest !== giver ? weakest : pick(members.filter(m => m !== giver));
        const gpr = pronouns(giver);
        result.phase2.socialEvents.push({ type: 'waterShare', players: [giver, receiver], tribe: tName, text: pick(P2_SOCIAL.waterShare)(giver, receiver, gpr) });
        addBond(receiver, giver, 0.4);
        perPlayerP2[giver] = (perPlayerP2[giver] || 0) + 1;
      } else if (villainsForWater.length > 0) {
        const hoarder = pick(villainsForWater);
        const victim = weakest !== hoarder ? weakest : pick(members.filter(m => m !== hoarder));
        const hpr = pronouns(hoarder);
        result.phase2.socialEvents.push({ type: 'waterHoard', players: [hoarder, victim], tribe: tName, text: pick(P2_SOCIAL.waterHoard)(hoarder, victim, hpr) });
        addBond(victim, hoarder, -0.4);
      }
    }

    // Animal Drama (GUARANTEED)
    if (true) {
      const animalPlayer = pick(members);
      const apr = pronouns(animalPlayer);
      const dramaPool = reward === 'camel' ? P2_SOCIAL.camelDrama : reward === 'goat' ? P2_SOCIAL.goatDrama : P2_SOCIAL.stickDrama;
      result.phase2.socialEvents.push({ type: 'animalDrama', players: [animalPlayer], tribe: tName, reward, text: pick(dramaPool)(animalPlayer, tName, apr) });
    }

    // Desert Mirage (40% chance, low endurance player)
    if (Math.random() < 0.4) {
      const endSorted = [...members].sort((a, b) => pStats(a).endurance - pStats(b).endurance);
      const miragePlayer = endSorted[0];
      const mpr = pronouns(miragePlayer);
      result.phase2.socialEvents.push({ type: 'desertMirage', players: [miragePlayer], tribe: tName, text: pick(P2_SOCIAL.desertMirage)(miragePlayer, mpr) });
      perPlayerP2[miragePlayer] = (perPlayerP2[miragePlayer] || 0) - 1;
    }

    // Ra Deity Judgment (35% chance per tribe in desert phase)
    if (Math.random() < 0.35) {
      const judgedPlayer = pick(members);
      const jpr = pronouns(judgedPlayer);
      const blessed = pStats(judgedPlayer).endurance >= 6 || arch(judgedPlayer) === 'challenge-beast';
      const judgmentText = blessed
        ? pick(DEITY_JUDGMENT.ra.bless)(judgedPlayer, jpr)
        : pick(DEITY_JUDGMENT.ra.curse)(judgedPlayer, jpr);
      result.phase2.deityJudgments.push({
        deity: 'ra', player: judgedPlayer, tribe: tName, blessed,
        text: judgmentText,
      });
      if (blessed) { popDelta(judgedPlayer, 1); perPlayerP2[judgedPlayer] = (perPlayerP2[judgedPlayer] || 0) + 2; }
      else { perPlayerP2[judgedPlayer] = (perPlayerP2[judgedPlayer] || 0) - 1; }
    }

    // ── Strategy & Gameplay Beats (1-2 per tribe) ──
    if (members.length >= 2) {
      const stratEvents = [];

      // Vote Whisper — two strategic players plot a vote target
      const strategists = members.filter(m => pStats(m).strategic >= 5).sort((a, b) => pStats(b).strategic - pStats(a).strategic);
      if (strategists.length >= 2 && Math.random() < 0.55) {
        const a = strategists[0];
        const b = strategists[1];
        const targetPool = members.filter(m => m !== a && m !== b)
          .map(m => ({ name: m, score: getBond(a, m) + getBond(b, m) }))
          .sort((x, y) => x.score - y.score);
        if (targetPool.length) {
          const target = targetPool[0].name;
          const apr = pronouns(a);
          stratEvents.push({ kind: 'voteWhisper', players: [a, b], target, text: pick(P2_SOCIAL.voteWhisper)(a, b, target, apr) });
        }
      }

      // Intel Trade — two social players exchange information
      const socials = members.filter(m => pStats(m).social >= 5);
      if (socials.length >= 2 && Math.random() < 0.4) {
        const shuffled = [...socials].sort(() => Math.random() - 0.5);
        const a = shuffled[0], b = shuffled[1];
        const apr = pronouns(a);
        stratEvents.push({ kind: 'intelTrade', players: [a, b], text: pick(P2_SOCIAL.intelTrade)(a, b, apr) });
        addBond(a, b, 0.3);
      }

      // Secret Pact — two loyal/strategic players form a hidden alliance
      const pactCandidates = members.filter(m => pStats(m).loyalty >= 5 && pStats(m).strategic >= 5);
      if (pactCandidates.length >= 2 && Math.random() < 0.35) {
        const shuffled = [...pactCandidates].sort(() => Math.random() - 0.5);
        const a = shuffled[0], b = shuffled[1];
        const apr = pronouns(a);
        stratEvents.push({ kind: 'secretPact', players: [a, b], text: pick(P2_SOCIAL.secretPact)(a, b, apr) });
        addBond(a, b, 0.6);
        perPlayerP2[a] = (perPlayerP2[a] || 0) + 1;
        perPlayerP2[b] = (perPlayerP2[b] || 0) + 1;
      }

      // Rivalry Flare — two players with low bond clash
      if (members.length >= 3 && Math.random() < 0.45) {
        let worstPair = null, worstBond = 99;
        for (let i = 0; i < members.length; i++) {
          for (let j = i + 1; j < members.length; j++) {
            const b = getBond(members[i], members[j]);
            if (b < worstBond) { worstBond = b; worstPair = [members[i], members[j]]; }
          }
        }
        if (worstPair && worstBond <= 0) {
          const [a, b] = worstPair;
          const apr = pronouns(a);
          stratEvents.push({ kind: 'rivalryFlare', players: [a, b], text: pick(P2_SOCIAL.rivalryFlare)(a, b, apr) });
          addBond(a, b, -0.4);
        }
      }

      // Cap at 2 strategy beats per tribe to keep things tight
      if (stratEvents.length > 2) {
        stratEvents.sort(() => Math.random() - 0.5);
        stratEvents.length = 2;
      }
      stratEvents.forEach(ev => {
        result.phase2.socialEvents.push({ type: ev.kind, players: ev.players, target: ev.target, tribe: tName, text: ev.text });
      });

      // Vote whisper has gameplay consequence: heat on the target
      stratEvents.forEach(ev => {
        if (ev.kind === 'voteWhisper' && ev.target) {
          gs._egyptHeat = { target: ev.target, amount: 1.5, expiresEp: gs.episode + 2 };
          ep.campEvents[tName].post.push({
            type: 'voteWhisperEgypt',
            players: [...ev.players, ev.target],
            text: `${ev.players[0]} and ${ev.players[1]} agreed during the desert trek to target ${ev.target} at the next tribal.`,
            consequences: `Heat +1.5 on ${ev.target} (2 episodes). Bond +0.4 between ${ev.players[0]} and ${ev.players[1]}.`,
            badgeText: 'DESERT PACT', badgeClass: 'badge-warning',
          });
          addBond(ev.players[0], ev.players[1], 0.4);
        }
      });
    }

    // ── Showmance Moment (if any active showmance has both members in this tribe) ──
    const tribeShowmances = (gs.showmances || []).filter(sh =>
      sh.phase !== 'broken-up' &&
      sh.players.length === 2 &&
      members.includes(sh.players[0]) &&
      members.includes(sh.players[1])
    );
    if (tribeShowmances.length && Math.random() < 0.7) {
      const sh = pick(tribeShowmances);
      const [a, b] = sh.players;
      const apr = pronouns(a);
      const bpr = pronouns(b);
      const friction = sh.phase === 'rocky' || (getBond(a, b) < 3 && Math.random() < 0.4);
      const pool = friction ? P2_SOCIAL.showmanceFriction : P2_SOCIAL.showmanceMoment;
      result.phase2.socialEvents.push({
        type: friction ? 'showmanceFriction' : 'showmanceMoment',
        players: [a, b], tribe: tName,
        text: pick(pool)(a, b, apr, bpr),
      });
      if (friction) addBond(a, b, -0.3);
      else addBond(a, b, 0.4);
    }

    // ── Desert Encounters (1-2 random adventures per tribe) ──
    const encounterPool = ['sandstorm', 'oasis', 'oasisTrap', 'ruin', 'scorpion', 'nomad', 'sandPit', 'vultures', 'cobra'];
    const numEncounters = Math.random() < 0.6 ? 2 : 1;
    const usedEnc = [];
    for (let e = 0; e < numEncounters; e++) {
      const avail = encounterPool.filter(t => !usedEnc.includes(t));
      if (!avail.length) break;
      const eType = pick(avail);
      usedEnc.push(eType);

      if (eType === 'sandstorm') {
        const text = pick(DESERT_ENCOUNTERS.sandstorm)(tName);
        result.phase2.encounters.push({ type: 'sandstorm', tribe: tName, players: [...members].slice(0, 4), text, scope: 'tribe' });
        navBonusPenalty -= 2;
        members.forEach(m => { perPlayerP2[m] = (perPlayerP2[m] || 0) - 1; });
      } else if (eType === 'oasis') {
        const finder = members.sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
        const fpr = pronouns(finder);
        const text = pick(DESERT_ENCOUNTERS.oasis)(tName, finder, fpr);
        result.phase2.encounters.push({ type: 'oasis', tribe: tName, players: [finder], text, scope: 'tribe', good: true });
        navBonusPenalty += 3;
        members.forEach(m => { perPlayerP2[m] = (perPlayerP2[m] || 0) + 1; });
        perPlayerP2[finder] = (perPlayerP2[finder] || 0) + 1;
        popDelta(finder, 1);
      } else if (eType === 'oasisTrap') {
        const victim = members.sort((a, b) => pStats(a).mental - pStats(b).mental)[0];
        const vpr = pronouns(victim);
        const text = pick(DESERT_ENCOUNTERS.oasisTrap)(tName, victim, vpr);
        result.phase2.encounters.push({ type: 'oasisTrap', tribe: tName, players: [victim], text });
        perPlayerP2[victim] = (perPlayerP2[victim] || 0) - 1;
      } else if (eType === 'ruin') {
        const scout = members.sort((a, b) => (pStats(b).intuition + pStats(b).mental) - (pStats(a).intuition + pStats(a).mental))[0];
        const spr = pronouns(scout);
        const text = pick(DESERT_ENCOUNTERS.ruin)(tName, scout, spr);
        result.phase2.encounters.push({ type: 'ruin', tribe: tName, players: [scout], text, good: true });
        navBonusPenalty += 4;
        perPlayerP2[scout] = (perPlayerP2[scout] || 0) + 3;
        popDelta(scout, 1);
      } else if (eType === 'scorpion') {
        const victim = pick(members);
        const vpr = pronouns(victim);
        const text = pick(DESERT_ENCOUNTERS.scorpion)(tName, victim, vpr);
        result.phase2.encounters.push({ type: 'scorpion', tribe: tName, players: [victim], text });
        perPlayerP2[victim] = (perPlayerP2[victim] || 0) - 2;
        navBonusPenalty -= 1;
      } else if (eType === 'nomad') {
        const talker = members.sort((a, b) => pStats(b).social - pStats(a).social)[0];
        const tpr = pronouns(talker);
        const text = pick(DESERT_ENCOUNTERS.nomad)(tName, talker, tpr);
        result.phase2.encounters.push({ type: 'nomad', tribe: tName, players: [talker], text, good: true });
        navBonusPenalty += 3;
        perPlayerP2[talker] = (perPlayerP2[talker] || 0) + 2;
        popDelta(talker, 1);
      } else if (eType === 'sandPit') {
        if (members.length >= 2) {
          const faller = members.sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
          const heroPool = members.filter(m => m !== faller);
          const hero = heroPool.sort((a, b) => (pStats(b).strength + pStats(b).loyalty) - (pStats(a).strength + pStats(a).loyalty))[0];
          const fpr = pronouns(faller);
          const hpr = pronouns(hero);
          const text = pick(DESERT_ENCOUNTERS.sandPit)(tName, faller, hero, fpr, hpr);
          result.phase2.encounters.push({ type: 'sandPit', tribe: tName, players: [faller, hero], text });
          addBond(faller, hero, 0.6);
          perPlayerP2[hero] = (perPlayerP2[hero] || 0) + 2;
          popDelta(hero, 1);
        }
      } else if (eType === 'vultures') {
        const text = pick(DESERT_ENCOUNTERS.vultures)(tName);
        result.phase2.encounters.push({ type: 'vultures', tribe: tName, players: members.slice(0, 3), text, scope: 'tribe' });
      } else if (eType === 'cobra') {
        const charmer = members.sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
        const cpr = pronouns(charmer);
        const text = pick(DESERT_ENCOUNTERS.cobra)(tName, charmer, cpr);
        result.phase2.encounters.push({ type: 'cobra', tribe: tName, players: [charmer], text });
        perPlayerP2[charmer] = (perPlayerP2[charmer] || 0) + 1;
      }
    }

    // ── Tribe P2 total ──
    const p2Raw = Object.values(perPlayerP2).reduce((sum, v) => sum + v, 0) / (members.length || 1);
    tribeP2Scores[tName] = p2Raw * speedMod + navBonusPenalty;
    result.tribes[tName].p2Score = tribeP2Scores[tName];

    // Add per-player scores to chalMemberScores
    members.forEach(m => {
      ep.chalMemberScores[m] += Math.round(clamp(perPlayerP2[m], 0, 10));
    });
  });

  // ══════════════════════════════════════════════════════════
  // PHASE 3: NILE CROSSING
  // ══════════════════════════════════════════════════════════
  const tribeP3Scores = {};

  tribes.forEach(tribe => {
    const tName = tribe.name;
    const members = [...tribe.members];
    const reward = rewardMap[tName];
    const perPlayerP3 = {};
    members.forEach(m => { perPlayerP3[m] = 0; });
    let boatQuality = 0;
    let boatDamage = 0;

    // ── Beat 1: Basket Weaving ──
    // Score everyone, but only show 1-2 highlights per tribe (best + worst, or just one)
    let weavingProdigy = null;
    const weavingResults = [];
    const weaveScored = members.map(name => {
      const s = pStats(name);
      const pr = pronouns(name);
      const weaveScore = s.mental * 0.5 + s.social * 0.5 + noise(2.5);
      let tier;
      if (weaveScore >= 8) { tier = 'good'; boatQuality += 3; perPlayerP3[name] += 3; }
      else if (weaveScore <= 3) { tier = 'bad'; boatQuality += 0.5; perPlayerP3[name] += 0.5; }
      else { tier = 'mid'; boatQuality += 1.5; perPlayerP3[name] += 1.5; }
      return { name, pr, weaveScore, tier };
    });

    // Pick best and worst as highlights
    const sortedWeave = [...weaveScored].sort((a, b) => b.weaveScore - a.weaveScore);
    const featuredWeave = new Set();
    if (sortedWeave[0]) featuredWeave.add(sortedWeave[0].name);
    const worstWeave = sortedWeave[sortedWeave.length - 1];
    if (worstWeave && worstWeave.weaveScore <= 3) featuredWeave.add(worstWeave.name);

    weaveScored.filter(w => featuredWeave.has(w.name)).forEach(w => {
      const weaveText = w.tier === 'bad'
        ? _pickUnique(WEAVING_TEXT.bad, `weave-bad-${w.name}`)(w.name, w.pr)
        : _pickUnique(WEAVING_TEXT.good, `weave-good-${w.name}`)(w.name, w.pr);
      weavingResults.push({ name: w.name, tribe: tName, tier: w.tier, score: w.weaveScore, text: weaveText });
    });

    // Find prodigy (highest mental on tribe)
    const mentalSorted = [...members].sort((a, b) => pStats(b).mental - pStats(a).mental);
    const topMental = mentalSorted[0];
    const topWeaveScore = pStats(topMental).mental * 0.6 + pStats(topMental).social * 0.4 + noise(2);
    if (topWeaveScore >= 7) {
      weavingProdigy = topMental;
      const prodigyPr = pronouns(topMental);
      const prodigyText = pick(WEAVING_TEXT.prodigy)(topMental, prodigyPr);
      weavingResults.push({ name: topMental, tribe: tName, tier: 'prodigy', text: prodigyText, isProdigy: true });
      boatQuality += 5;
      perPlayerP3[topMental] = (perPlayerP3[topMental] || 0) + 4;
      popDelta(topMental, 1);

      ep.campEvents[tName].post.push({
        type: 'weavingProdigy',
        players: [topMental],
        text: `${topMental} turned out to be a basket-weaving prodigy. ${prodigyPr.posAdj} section of the boat was flawless — practically art.`,
        consequences: 'Massive boat quality bonus. +1 popularity.',
        badgeText: 'WEAVE PRODIGY', badgeClass: 'badge-info',
      });
    }

    result.phase3.weaving.push(...weavingResults);
    result.tribes[tName].boatQuality = boatQuality;

    // ── Beat 2: Animal Loading ──
    const loadResults = [];

    if (reward === 'camel') {
      // Camel loading: social + endurance check
      const loader = pick(members);
      const lPr = pronouns(loader);
      const loadRoll = pStats(loader).social * 0.5 + pStats(loader).endurance * 0.5 + noise(2.5);

      if (loadRoll >= 5) {
        const loadText = pick(ANIMAL_LOAD_TEXT.camelSuccess)(loader, lPr);
        loadResults.push({ type: 'camelLoad', name: loader, tribe: tName, success: true, text: loadText });
        perPlayerP3[loader] = (perPlayerP3[loader] || 0) + 2;
      } else {
        // Speaking camel boldness check
        const speakRoll = pStats(loader).boldness * 0.7 + noise(2.5);
        if (speakRoll >= 6 && Math.random() < 0.3) {
          const speakText = pick(ANIMAL_LOAD_TEXT.speakingCamel)(loader, lPr);
          loadResults.push({ type: 'camelLoad', name: loader, tribe: tName, success: true, speaking: true, text: speakText });
          perPlayerP3[loader] = (perPlayerP3[loader] || 0) + 3;
          popDelta(loader, 1);
        } else {
          const failText = pick(ANIMAL_LOAD_TEXT.camelFail)(loader, lPr);
          loadResults.push({ type: 'camelLoad', name: loader, tribe: tName, success: false, text: failText });
          perPlayerP3[loader] = (perPlayerP3[loader] || 0) - 1;
          boatDamage += 1; // Camel kicked the boat
        }
      }
    } else if (reward === 'goat') {
      const goatHandler = pick(members);
      const goatText = pick(ANIMAL_LOAD_TEXT.goat)(goatHandler, pronouns(goatHandler));
      loadResults.push({ type: 'goatLoad', name: goatHandler, players: [goatHandler], tribe: tName, text: goatText });
      // Goat panics on water — minor ongoing penalty handled in rowing
    } else {
      // Stick — instant load. Modest time advantage, NOT a runaway lead.
      if (!result.phase2.stickLost) {
        const stickText = pick(ANIMAL_LOAD_TEXT.stickInstant)(tName);
        loadResults.push({ type: 'stickLoad', tribe: tName, text: stickText, instant: true });
        members.forEach(m => { perPlayerP3[m] = (perPlayerP3[m] || 0) + 0.5; });
        boatQuality += 1; // Slight head start on rowing without animal-loading time lost
      } else {
        loadResults.push({ type: 'stickLost', tribe: tName, text: `${tName} lost the stick in the desert. Nothing to load — but nothing to help, either.` });
      }
    }

    result.phase3.animalLoading.push(...loadResults);

    // ── Beat 3: Rowing & Croc Gauntlet ──
    const numRowBeats = 3;
    const boatQualityMod = boatQuality * 0.3; // Better boat = easier rowing
    // Goat panic is a flavor problem, not a major handicap (camel is the real boat penalty).
    const goatPanicPenalty = reward === 'goat' ? -0.4 : 0;
    // Camel is HARD to keep balanced in a reed boat — cumulative drag on the rowing.
    const camelDragPenalty = reward === 'camel' ? -0.8 : 0;
    const cursedPlayer = result.phase1.mummifiedDog?.player;
    const recentCrocTargets = []; // last 2 targets — avoid hitting same player back-to-back

    for (let beat = 0; beat < numRowBeats; beat++) {
      // Score every member but only feature 1-2 highlights per beat (best + worst)
      const rowResults = [];
      let beatRowScore = 0;
      const rowScored = members.map(name => {
        const s = pStats(name);
        const pr = pronouns(name);
        const rowRoll = s.physical * 0.5 + s.endurance * 0.5 + noise(2.5) + boatQualityMod * 0.1 + goatPanicPenalty * 0.2 + camelDragPenalty * 0.2;
        if (rowRoll >= 6) { perPlayerP3[name] = (perPlayerP3[name] || 0) + 2; beatRowScore += 2; }
        else { perPlayerP3[name] = (perPlayerP3[name] || 0) - 0.5; beatRowScore -= 0.5; }
        return { name, pr, rowRoll, good: rowRoll >= 6 };
      });

      const sortedRow = [...rowScored].sort((a, b) => b.rowRoll - a.rowRoll);
      const featuredRow = new Set();
      if (sortedRow[0]) featuredRow.add(sortedRow[0].name);
      const worstRow = sortedRow[sortedRow.length - 1];
      if (worstRow && !worstRow.good) featuredRow.add(worstRow.name);

      rowScored.filter(r => featuredRow.has(r.name)).forEach(r => {
        const rowText = r.good
          ? _pickUnique(ROWING_TEXT.good, `row-good-${r.name}`)(r.name, r.pr)
          : _pickUnique(ROWING_TEXT.bad, `row-bad-${r.name}`)(r.name, r.pr);
        rowResults.push({ name: r.name, tribe: tName, beat, score: r.rowRoll, text: rowText });
      });

      result.phase3.rowingBeats.push(...rowResults);

      // ── Croc Attacks (1 per beat, occasionally 2) ──
      const numCrocs = Math.random() < 0.25 ? 2 : 1;
      for (let c = 0; c < numCrocs; c++) {
        // Pick target avoiding recent victims
        const eligibleTargets = members.filter(m => !recentCrocTargets.includes(m));
        const targetPool = eligibleTargets.length > 0 ? eligibleTargets : members;
        let target;
        if (cursedPlayer && targetPool.includes(cursedPlayer) && Math.random() < 0.4) {
          target = cursedPlayer;
        } else {
          const physSorted = [...targetPool].sort((a, b) => pStats(a).physical - pStats(b).physical);
          target = Math.random() < 0.4 ? physSorted[0] : pick(targetPool);
        }
        recentCrocTargets.push(target);
        if (recentCrocTargets.length > 2) recentCrocTargets.shift();

        const tpr = pronouns(target);
        const attackText = _pickUnique(CROC_TEXT.attack, `croc-atk-${target}`)(target, tpr);

        // Defense check
        const defRoll = pStats(target).physical * 0.5 + pStats(target).boldness * 0.5 + noise(2.5);
        let defResult;

        if (defRoll >= 5) {
          const defText = _pickUnique(CROC_TEXT.defenseSuccess, `croc-def-${target}`)(target, tpr);
          defResult = { target, tribe: tName, beat, defended: true, attackText, defenseText: defText };
          perPlayerP3[target] = (perPlayerP3[target] || 0) + 2;
        } else {
          const defText = _pickUnique(CROC_TEXT.defenseFail, `croc-fail-${target}`)(target, tpr);
          defResult = { target, tribe: tName, beat, defended: false, attackText, defenseText: defText };
          boatDamage += 2;
          perPlayerP3[target] = (perPlayerP3[target] || 0) - 1;
        }

        // Hero save attempt (nice archetypes)
        const heroes = members.filter(m => m !== target &&
          ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog'].includes(arch(m)));
        if (!defResult.defended && heroes.length > 0 && Math.random() < 0.4) {
          const hero = pick(heroes);
          const hpr = pronouns(hero);
          const saveText = pick(CROC_TEXT.heroSave)(hero, target, hpr);
          defResult.heroSave = { hero, text: saveText };
          addBond(target, hero, 0.5);
          perPlayerP3[hero] = (perPlayerP3[hero] || 0) + 3;
          popDelta(hero, 2);
          boatDamage -= 1; // Hero mitigated some damage

          ep.campEvents[tName].post.push({
            type: 'crocHeroSave',
            players: [hero, target],
            text: `${hero} threw ${pronouns(hero).ref} between ${target} and a crocodile during the Nile crossing. Heroic moment.`,
            consequences: 'Bond +0.5 from saved player. +2 popularity.',
            badgeText: 'CROC SAVE', badgeClass: 'badge-success',
          });
        }

        // Villain shove attempt (villain archetypes)
        const villains = members.filter(m => m !== target && canScheme(m));
        if (defResult.defended && villains.length > 0 && Math.random() < 0.25) {
          const villain = pick(villains);
          const vpr = pronouns(villain);
          const villainTarget = members.filter(m => m !== villain && getBond(villain, m) <= 0);
          const shoveTarget = villainTarget.length > 0 ? pick(villainTarget) : pick(members.filter(m => m !== villain));

          const shoveText = pick(CROC_TEXT.villainShove)(villain, shoveTarget, vpr);
          defResult.villainShove = { villain, target: shoveTarget, text: shoveText };
          addBond(shoveTarget, villain, -0.8);
          perPlayerP3[shoveTarget] = (perPlayerP3[shoveTarget] || 0) - 2;
          boatDamage += 1;

          // Caught check
          const witnesses = members.filter(m => m !== villain && m !== shoveTarget);
          const caught = witnesses.some(w => pStats(w).intuition * 0.6 + noise(2) >= 5);
          if (caught) {
            const witness = witnesses.find(w => pStats(w).intuition * 0.6 + noise(2) >= 5) || pick(witnesses);
            const caughtText = pick(CROC_TEXT.villainShoveCaught)(villain, shoveTarget, witness);
            defResult.villainShove.caught = true;
            defResult.villainShove.witness = witness;
            defResult.villainShove.caughtText = caughtText;
            popDelta(villain, -3);
            addBond(witness, villain, -0.5);
            members.filter(m => m !== villain).forEach(m => addBond(m, villain, -0.3));

            ep.campEvents[tName].post.push({
              type: 'crocVillainShove',
              players: [villain, shoveTarget, witness],
              text: `${witness} caught ${villain} shoving ${shoveTarget} toward a crocodile during the Nile crossing. The tribe is furious.`,
              consequences: 'Bond -0.8 from target, -0.3 from tribe. -3 popularity. Heat.',
              badgeText: 'CROC SHOVER', badgeClass: 'badge-danger',
            });
          } else {
            popDelta(villain, -1); // Still bad karma even if not caught
          }
        }

        result.phase3.crocAttacks.push(defResult);
      }
    }

    result.tribes[tName].boatDamage = boatDamage;

    // ── Phase 3 Social Events ──

    // Boat Teamwork (GUARANTEED, high bond pairs)
    if (members.length >= 2) {
      const pairs = [];
      for (let i = 0; i < members.length; i++)
        for (let j = i + 1; j < members.length; j++)
          if (getBond(members[i], members[j]) >= 2) pairs.push([members[i], members[j]]);
      if (pairs.length > 0) {
        const [a, b] = pick(pairs);
        result.phase3.socialEvents.push({ type: 'boatTeamwork', players: [a, b], tribe: tName, text: pick(P3_SOCIAL.boatTeamwork)(a, b) });
        addBond(a, b, 0.3);
        perPlayerP3[a] = (perPlayerP3[a] || 0) + 1;
        perPlayerP3[b] = (perPlayerP3[b] || 0) + 1;
      }
    }

    // Croc Panic (GUARANTEED, low boldness player)
    if (members.length >= 2) {
      const boldSorted = [...members].sort((a, b) => pStats(a).boldness - pStats(b).boldness);
      const panicker = boldSorted[0];
      const affected = pick(members.filter(m => m !== panicker));
      const ppr = pronouns(panicker);
      result.phase3.socialEvents.push({ type: 'crocPanic', players: [panicker, affected], tribe: tName, text: pick(P3_SOCIAL.crocPanic)(panicker, affected, ppr) });
      addBond(affected, panicker, -0.2);
      boatDamage += 0.5;
    }

    // Encourage Row (GUARANTEED, nice players help struggling rowers)
    if (members.length >= 2) {
      const niceRowers = members.filter(m => ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog'].includes(arch(m)));
      const weakRowers = [...members].sort((a, b) => pStats(a).physical - pStats(b).physical).slice(0, 2);
      const validGivers = niceRowers.filter(m => !weakRowers.includes(m));
      if (validGivers.length > 0 && weakRowers.length > 0) {
        const giver = pick(validGivers);
        const receiver = pick(weakRowers);
        const gpr = pronouns(giver);
        result.phase3.socialEvents.push({ type: 'encourageRow', players: [giver, receiver], tribe: tName, text: pick(P3_SOCIAL.encourageRow)(giver, receiver, gpr) });
        addBond(receiver, giver, 0.3);
        perPlayerP3[receiver] = (perPlayerP3[receiver] || 0) + 1;
      }
    }

    // Sobek Deity Judgment (35% chance per tribe)
    if (Math.random() < 0.35) {
      const judgedPlayer = pick(members);
      const jpr = pronouns(judgedPlayer);
      const blessed = pStats(judgedPlayer).physical >= 6 || arch(judgedPlayer) === 'challenge-beast';
      const judgmentText = blessed
        ? pick(DEITY_JUDGMENT.sobek.bless)(judgedPlayer, jpr)
        : pick(DEITY_JUDGMENT.sobek.curse)(judgedPlayer, jpr);
      result.phase3.deityJudgments.push({
        deity: 'sobek', player: judgedPlayer, tribe: tName, blessed,
        text: judgmentText,
      });
      if (blessed) { perPlayerP3[judgedPlayer] = (perPlayerP3[judgedPlayer] || 0) + 2; }
      else { boatDamage += 1; perPlayerP3[judgedPlayer] = (perPlayerP3[judgedPlayer] || 0) - 1; }
    }

    // ── Beat 4: Final Sprint ──
    const sinkThreshold = boatQuality * 1.5;
    const willSink = boatDamage > sinkThreshold;
    // Anchor = strongest rower, used for chip + narrative focus
    const anchor = [...members].sort((a, b) => (pStats(b).physical + pStats(b).endurance) - (pStats(a).physical + pStats(a).endurance))[0];

    let sprintResult;
    if (willSink) {
      sprintResult = { tribe: tName, sunk: true, players: [anchor], text: _pickUnique(FINAL_SPRINT_TEXT.sinking, `sprint-sink-${tName}`)(tName), penalty: -8 };
      result.phase3.boatSunk = tName;
      // Bail attempts — only top 2 endurance bailers feature in VP
      const bailers = [...members].sort((a, b) => pStats(b).endurance - pStats(a).endurance).slice(0, 2);
      bailers.forEach(name => {
        const s = pStats(name);
        const pr = pronouns(name);
        const bailRoll = s.endurance * 0.7 + noise(2);
        if (bailRoll >= 4) {
          const bailText = _pickUnique(BAIL_TEXT, `bail-${name}`)(name, pr);
          sprintResult.bailAttempts = sprintResult.bailAttempts || [];
          sprintResult.bailAttempts.push({ name, text: bailText });
          perPlayerP3[name] = (perPlayerP3[name] || 0) + 1;
        }
      });
    } else if (boatDamage > sinkThreshold * 0.5) {
      sprintResult = { tribe: tName, sunk: false, damaged: true, players: [anchor], text: _pickUnique(FINAL_SPRINT_TEXT.bad, `sprint-bad-${tName}`)(tName), penalty: -3 };
      const bailer = pick(members);
      const bailerPr = pronouns(bailer);
      sprintResult.bailAttempts = [{ name: bailer, text: _pickUnique(BAIL_TEXT, `bail-${bailer}`)(bailer, bailerPr) }];
      perPlayerP3[bailer] = (perPlayerP3[bailer] || 0) + 1;
    } else {
      sprintResult = { tribe: tName, sunk: false, damaged: false, players: [anchor], text: _pickUnique(FINAL_SPRINT_TEXT.good, `sprint-good-${tName}`)(tName), penalty: 0 };
    }

    result.phase3.finalSprint.push(sprintResult);

    // ── Tribe P3 total ──
    const p3Avg = Object.values(perPlayerP3).reduce((sum, v) => sum + v, 0) / (members.length || 1);
    tribeP3Scores[tName] = p3Avg + (sprintResult.penalty || 0);
    result.tribes[tName].p3Score = tribeP3Scores[tName];

    // Add per-player scores to chalMemberScores
    members.forEach(m => {
      ep.chalMemberScores[m] += Math.round(clamp(perPlayerP3[m] || 0, 0, 12));
    });
  });

  // ── Cross-tribe Boat Sabotage (40% chance, villain archetypes) ──
  if (tribes.length >= 2 && Math.random() < 0.4) {
    const allVillains = [];
    tribes.forEach(t => t.members.filter(m => canScheme(m)).forEach(v => allVillains.push({ name: v, tribe: t.name })));
    if (allVillains.length > 0) {
      const saboteur = pick(allVillains);
      const targetTribes = tribes.filter(t => t.name !== saboteur.tribe);
      const targetTribe = pick(targetTribes);
      const vpr = pronouns(saboteur.name);
      result.phase3.socialEvents.push({
        type: 'boatSabotage', players: [saboteur.name], tribe: saboteur.tribe, targetTribe: targetTribe.name,
        text: pick(P3_SOCIAL.boatSabotage)(saboteur.name, targetTribe.name, vpr),
      });
      result.tribes[targetTribe.name].boatDamage = (result.tribes[targetTribe.name].boatDamage || 0) + 2;
      popDelta(saboteur.name, -2);

      const campKey = saboteur.tribe;
      ep.campEvents[campKey].post.push({
        type: 'boatSabotage', players: [saboteur.name],
        text: `${saboteur.name} sabotaged ${targetTribe.name}'s boat during the Nile crossing. Underhanded — but effective.`,
        consequences: 'Target tribe +2 boat damage. -2 popularity for saboteur.',
        badgeText: 'SABOTEUR', badgeClass: 'badge-danger',
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // FINISH ORDER
  // ══════════════════════════════════════════════════════════
  tribes.forEach(t => {
    result.tribes[t.name].totalScore = (result.tribes[t.name].p1Avg || 0) + (result.tribes[t.name].p2Score || 0) + (result.tribes[t.name].p3Score || 0);
  });

  const finishOrder = tribes.map(t => t.name)
    .sort((a, b) => result.tribes[b].totalScore - result.tribes[a].totalScore);

  result.tribeFinishOrder = finishOrder;
  const immunityTribe = finishOrder[0];
  const losingTribe = finishOrder[finishOrder.length - 1];
  result.immunityTribe = immunityTribe;
  result.losingTribe = losingTribe;

  // Host finish lines
  result.hostLines.finish1st = pick(HOST_TEXT.finish1st)(host(), immunityTribe);
  if (finishOrder.length > 2) {
    result.hostLines.finish2nd = pick(HOST_TEXT.finish2nd)(host(), finishOrder[1]);
  }
  result.hostLines.finishLast = pick(HOST_TEXT.finishLast)(host(), losingTribe);

  // ══════════════════════════════════════════════════════════
  // ROMANCE HOOKS
  // ══════════════════════════════════════════════════════════
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'pyramid expedition');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'walk-like-an-egyptian', _romActive);

  // ══════════════════════════════════════════════════════════
  // FINALIZE
  // ══════════════════════════════════════════════════════════
  ep.walkEgypt = result;
  ep.challengeData = result;
  ep.isWalkEgypt = true;
  ep.challengeType = 'walk-like-an-egyptian';
  ep.challengeLabel = 'Walk Like an Egyptian';
  ep.challengeCategory = 'mixed';
  ep.winner = gs.tribes.find(t => t.name === immunityTribe);
  ep.loser = gs.tribes.find(t => t.name === losingTribe);
  ep.safeTribes = finishOrder.length > 2
    ? finishOrder.slice(1, -1).map(n => gs.tribes.find(t => t.name === n)).filter(Boolean)
    : [];
  ep.tribalPlayers = [...(gs.tribes.find(t => t.name === losingTribe)?.members || [])];

  // chalPlacements: ordered by individual scores
  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a)
    .map(([n]) => n);

  // Top scorer on winning tribe gets massive bonus
  const winningMembers = gs.tribes.find(t => t.name === immunityTribe)?.members || [];
  if (winningMembers.length > 0) {
    const topWinner = [...winningMembers].sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0))[0];
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => !winningMembers.includes(n))
      .map(([, s]) => s));
    ep.chalMemberScores[topWinner] = Math.max(ep.chalMemberScores[topWinner] || 0, maxOther) + allActive.length + 5;
  }

  // Re-sort placements after boost
  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a)
    .map(([n]) => n);

  updateChalRecord(ep);
  return ep;
}


// ══════════════════════════════════════════════════════════════
// VP (VISUAL PLAYBACK) SYSTEM
// ══════════════════════════════════════════════════════════════

// ── REVEAL STATE ──
const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

export function egyptRevealNext(screenKey, total) {
  const st = _ensureState(screenKey, total);
  if (st.idx < st.total - 1) { st.idx++; }
  _rebuildCurrentScreen(screenKey);
  _rebuildSidebar();
  _updateCounter(screenKey);
  _scrollToRevealedStep(screenKey, st.idx);
}
export function egyptRevealAll(screenKey, total) {
  const st = _ensureState(screenKey, total);
  st.idx = st.total - 1;
  _rebuildCurrentScreen(screenKey);
  _rebuildSidebar();
  _updateCounter(screenKey);
}
function _scrollToRevealedStep(screenKey, idx) {
  requestAnimationFrame(() => {
    const container = document.querySelector(`[data-screen-key="${screenKey}"]`);
    if (!container) return;
    const allSteps = container.querySelectorAll('.eg-step.eg-visible');
    const target = allSteps[allSteps.length - 1];
    if (!target) return;
    let scrollParent = target.closest('.rp-main');
    if (!scrollParent) {
      let el = target.parentElement;
      while (el) {
        const style = getComputedStyle(el);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') { scrollParent = el; break; }
        el = el.parentElement;
      }
    }
    if (!scrollParent) scrollParent = document.documentElement;
    const parentRect = scrollParent.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - parentRect.top + scrollParent.scrollTop - parentRect.height * 0.3;
    scrollParent.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  });
}

function _updateCounter(screenKey) {
  const st = _tvState[screenKey];
  if (!st) return;
  const el = document.getElementById(`eg-counter-${screenKey}`);
  if (el) el.textContent = `${Math.max(0, st.idx + 1)}/${st.total}`;
}
window.egyptRevealNext = egyptRevealNext;
window.egyptRevealAll = egyptRevealAll;

function _rebuildCurrentScreen(screenKey) {
  const el = document.querySelector(`[data-screen-key="${screenKey}"]`);
  if (!el) return;
  const scrollTop = el.scrollTop;
  const builder = window._egScreenBuilders?.[screenKey];
  if (builder) {
    const ep = window._egEp;
    if (ep) {
      const tmp = document.createElement('div');
      tmp.innerHTML = builder(ep);
      const inner = tmp.querySelector(`[data-screen-key="${screenKey}"]`);
      if (inner) el.innerHTML = inner.innerHTML;
    }
  }
  el.scrollTop = scrollTop;
}

function _rebuildSidebar() {
  const sidebarEl = document.getElementById('eg-sidebar');
  if (!sidebarEl) return;
  const shell = sidebarEl.closest('.eg-shell');
  const phase = shell?.dataset?.phase || '';
  const data = window._egData;
  if (!data) return;
  sidebarEl.innerHTML = _buildSidebarContent(data, phase);
}


// ══════════════════════════════════════════════════════════════
// FRIEZE DATA — hieroglyph→english pairs + procession figures
// ══════════════════════════════════════════════════════════════
const FRIEZE_READINGS = {
  '': [
    { glyph: '𓂀𓏏𓎛 𓊪𓃭𓏏𓇋𓅱', text: 'GIZA PLATEAU' },
    { glyph: '𓃀𓇋𓎼𓇋𓈖', text: 'EXPEDITION BEGINS' },
    { glyph: '𓉐𓂋𓏏 𓊪𓇋𓂋', text: 'THE PYRAMID AWAITS' },
  ],
  'eg-cold-open': [
    { glyph: '𓇳𓂀𓏏 𓊪𓃭𓏏', text: 'RA WATCHES' },
    { glyph: '𓂧𓈖𓎼𓏏 𓇋𓅱', text: 'THE DEAD STIR' },
    { glyph: '𓊃𓈖𓂧 𓏏𓎛𓇋', text: 'SAND REMEMBERS' },
    { glyph: '𓉐𓂋𓏏 𓃀𓇋𓎼', text: 'EXPEDITION BEGINS' },
  ],
  'eg-pyramid': [
    { glyph: '𓇥𓂧𓊪𓏏𓉔 ▼▼▼', text: 'PASSAGE DEPTH ▼▼▼' },
    { glyph: '𓎛𓂝𓏏 ████░░', text: 'TORCH FUEL ████░░' },
    { glyph: '𓆣𓆣𓆣 ◈◈◈', text: 'SCARAB PROXIMITY ◈◈◈' },
    { glyph: '𓇳𓏏𓂋 ▲▲▲', text: 'STONE TEMP RISING' },
  ],
  'eg-desert': [
    { glyph: '𓇳𓃀𓂋𓈖𓎼', text: 'SUN BEARING DOWN' },
    { glyph: '𓊃𓈖𓂧 ▲▲▲', text: 'SAND TEMP ▲▲▲' },
    { glyph: '𓈗𓏏𓂋 ██░░░', text: 'WATER RESERVES ██░░░' },
    { glyph: '𓂝𓇋𓈖 𓏏𓎛𓇋', text: 'VISIBILITY FADING' },
  ],
  'eg-nile': [
    { glyph: '𓈗𓂋𓏏 𓊪𓃭𓈖', text: 'CURRENT PULLING' },
    { glyph: '𓉐𓏏𓎼 ███░', text: 'HULL INTEGRITY ███░' },
    { glyph: '𓆊𓂀 𓊃𓂋𓆑', text: 'CROC EYES SURFACING' },
    { glyph: '𓇥𓂧𓏏 ???', text: 'DEPTH UNKNOWN' },
  ],
  'eg-winner': [
    { glyph: '𓈗𓃀𓈖𓎛', text: 'EAST BANK REACHED' },
    { glyph: '𓊪𓂋𓏏𓇋𓅱', text: 'CHALLENGE COMPLETE' },
    { glyph: '𓏏𓂋𓇋𓃀𓃭', text: 'TRIBAL COUNCIL AWAITS' },
  ],
};
const FRIEZE_FIGURES = {
  '': 'explorer',
  'eg-cold-open': 'pharaoh',
  'eg-pyramid': 'torch-bearer',
  'eg-desert': 'camel-rider',
  'eg-nile': 'rower',
  'eg-winner': 'pharaoh',
};

const COMM_CHATTER = {
  'eg-pyramid': [
    '"Team Bravo, we\'ve breached the lower chamber. Watch the ceiling."',
    '"Copy that. Scarab readings are off the charts down here."',
    '"Torch two is flickering. We may lose visibility in sector four."',
    '"Passage three is clear but narrow. Single file only."',
    '"Ground control, we have movement on the thermal. Large, cold-blooded."',
    '"The hieroglyphs suggest a false wall ahead. Proceed with caution."',
    '"Someone just triggered a pressure plate. Standby for debris."',
    '"Topside team is past the midpoint. Strong winds up there."',
  ],
  'eg-desert': [
    '"Caravan Alpha is two clicks from the waypoint. Visibility dropping."',
    '"We\'ve lost visual on Team Charlie. Last heading was southwest."',
    '"Scarab mating swarm detected bearing 270. All teams brace."',
    '"Temperature is now 48 degrees. That\'s air temp, not sand."',
    '"The camel team has veered off-course again. Classic."',
    '"Mirage confirmed at grid reference 7-7. That\'s not the oasis."',
    '"Goat team is maintaining formation. Barely."',
    '"Camel refused to move for four minutes. Situation resolved with dates."',
  ],
  'eg-nile': [
    '"Movement detected at bearing 270. Large reptilian."',
    '"Boat Alpha taking on water. Structural compromise portside."',
    '"Crocodile surfaced 20 meters from Team Bravo. Eyes on."',
    '"The reed boat is holding. For now."',
    '"Current is picking up near the midpoint. All teams adjust heading."',
    '"We have a swimmer. Repeat, we have a swimmer in the water."',
    '"Goat is panicking again. The boat is rocking."',
    '"Final stretch — 50 meters to east bank. Push through."',
  ],
};


// ══════════════════════════════════════════════════════════════
// ICON SYSTEM (CSS-only, no emoji)
// ══════════════════════════════════════════════════════════════
function _icon(type) {
  const map = {
    climb: 'eg-icon-climb', ascent: 'eg-icon-climb', over: 'eg-icon-climb',
    surf: 'eg-icon-surf', slide: 'eg-icon-surf', descent: 'eg-icon-surf',
    door: 'eg-icon-door', choice: 'eg-icon-door', under: 'eg-icon-door',
    scarab: 'eg-icon-scarab', swarm: 'eg-icon-scarab', bug: 'eg-icon-scarab',
    mummy: 'eg-icon-mummy', curse: 'eg-icon-mummy', trap: 'eg-icon-mummy',
    camel: 'eg-icon-camel', reward: 'eg-icon-camel',
    croc: 'eg-icon-croc', attack: 'eg-icon-croc', bite: 'eg-icon-croc',
    boat: 'eg-icon-boat', weave: 'eg-icon-boat', row: 'eg-icon-boat',
    hero: 'eg-icon-hero', save: 'eg-icon-hero', protect: 'eg-icon-hero',
    villain: 'eg-icon-villain', shove: 'eg-icon-villain', scheme: 'eg-icon-villain',
    navigate: 'eg-icon-navigate', compass: 'eg-icon-navigate', shortcut: 'eg-icon-navigate',
    sand: 'eg-icon-sand', storm: 'eg-icon-sand', lost: 'eg-icon-sand',
    heart: 'eg-icon-heart', showmance: 'eg-icon-heart',
    alert: 'eg-icon-alert', panic: 'eg-icon-alert', blame: 'eg-icon-alert',
    eye: 'eg-icon-eye', spy: 'eg-icon-eye', seduction: 'eg-icon-eye',
    bond: 'eg-icon-bond', alliance: 'eg-icon-bond', help: 'eg-icon-bond',
    summit: 'eg-icon-summit', view: 'eg-icon-summit',
    stick: 'eg-icon-stick', divining: 'eg-icon-stick',
    collision: 'eg-icon-collision', bump: 'eg-icon-collision',
    fail: 'eg-icon-fail', miss: 'eg-icon-fail',
    success: 'eg-icon-success', found: 'eg-icon-success',
  };
  const cls = map[type] || 'eg-icon-scarab';
  return `<span class="eg-icon ${cls}"></span>`;
}


// ══════════════════════════════════════════════════════════════
// CARTOUCHE PLAYER CARD
// ══════════════════════════════════════════════════════════════
function _tribeBadge(tribeName) {
  if (!tribeName) return '';
  const tc = tribeColor(tribeName);
  return `<span style="font-family:Metamorphous,cursive;font-size:0.55rem;letter-spacing:1.5px;padding:1px 6px;border-radius:2px;background:${tc}18;color:${tc};border:1px solid ${tc}33;white-space:nowrap">${tribeName.toUpperCase()}</span>`;
}

function _playerChips(names, tribeName) {
  if (!names?.length) return '';
  const tc = tribeName ? tribeColor(tribeName) : 'var(--eg-muted)';
  return `<div style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 2px">${names.map(n => {
    const sl = slug(n);
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 6px 2px 2px;border-radius:14px;background:rgba(0,0,0,0.15);border:1px solid ${tc}44;font-size:0.78rem;font-family:Cormorant Garamond,serif;color:inherit">
      <img src="assets/avatars/${sl}.png" alt="${n}" style="width:20px;height:20px;border-radius:50%;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">${n}</span>`;
  }).join('')}</div>`;
}

function _cartouche(name, statusCls = '', tag = '', tribeName = '') {
  const sl = slug(name);
  const tc = tribeName ? tribeColor(tribeName) : '';
  const borderStyle = tribeName ? `border-left:3px solid ${tc};padding-left:4px` : '';
  return `<span class="eg-cartouche ${statusCls}" style="${borderStyle}">
    <span class="eg-seal-frame"><img src="assets/avatars/${sl}.png" alt="${name}" onerror="this.style.display='none'"></span>
    <span class="eg-seal-name">${name}</span>${tribeName ? _tribeBadge(tribeName) : ''}${tag ? `<span class="eg-seal-tag ${tag.cls || ''}">${tag.text}</span>` : ''}
  </span>`;
}


// ══════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════
function _css() {
  return `<style>
/* ═══ WALK LIKE AN EGYPTIAN VP ═══ */
@import url('https://fonts.googleapis.com/css2?family=Metamorphous&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

:root{
  --eg-papyrus:#E8C870;--eg-gold:#D4A017;--eg-pharaoh-gold:#F0C030;--eg-scarab:#2D8B57;
  --eg-nile:#00A0A0;--eg-terra:#C04820;--eg-tomb:#1A1510;--eg-sand:#F0E0B0;
  --eg-danger:#C02020;--eg-success:#228B22;--eg-text:#2A1A0A;--eg-muted:#8A7A5A;
  --eg-torch:#FF9944;--eg-water:#1B4B7A;
  --eg-lapis:#2D5FBA;--eg-faience:#00A0A0;--eg-carnelian:#C04820;--eg-malachite:#228B22;
  --eg-band:linear-gradient(90deg,var(--eg-gold),rgba(212,160,23,0.6));
  --eg-zigzag:repeating-linear-gradient(135deg,rgba(212,160,23,0.15) 0px,rgba(212,160,23,0.15) 3px,transparent 3px,transparent 6px);
}

.eg-shell{position:relative;display:flex;gap:0;min-height:520px;max-width:1100px;margin:0 auto;font-family:'Cormorant Garamond','Georgia',serif;font-size:1.12rem;color:var(--eg-text);background:var(--eg-papyrus);border-radius:2px;overflow:clip;border:none;
  border-top:3px solid rgba(212,160,23,0.5);border-bottom:3px solid rgba(212,160,23,0.5);
  box-shadow:0 6px 30px rgba(26,21,16,0.35),0 2px 0 rgba(212,160,23,0.2)}
.eg-shell *{box-sizing:border-box}
.eg-main{flex:1;padding:18px 20px 60px 20px;overflow-y:auto;position:relative;z-index:1}
.eg-sidebar{width:240px;min-width:240px;padding:12px 10px;overflow-y:auto;font-size:0.92rem;position:relative;z-index:1;
  background:linear-gradient(180deg,rgba(42,31,20,0.06),rgba(194,166,69,0.04));color:var(--eg-text);
  border-left:1px solid rgba(194,166,69,0.15);
  box-shadow:inset 3px 0 0 rgba(194,166,69,0.06);
  background-image:repeating-linear-gradient(0deg,transparent,transparent 38px,rgba(194,166,69,0.04) 38px,rgba(194,166,69,0.04) 40px)}

/* Subtle gold accent lines top/bottom */
.eg-shell::before{content:'';position:absolute;top:0;left:0;right:0;height:14px;z-index:2;pointer-events:none;
  background:repeating-linear-gradient(90deg,transparent 0px,transparent 28px,rgba(194,166,69,0.1) 28px,rgba(194,166,69,0.1) 30px);
  border-bottom:1px solid rgba(194,166,69,0.12)}
.eg-shell::after{content:'';position:absolute;bottom:0;left:0;right:0;height:14px;z-index:2;pointer-events:none;
  background:repeating-linear-gradient(90deg,transparent 0px,transparent 28px,rgba(194,166,69,0.1) 28px,rgba(194,166,69,0.1) 30px);
  border-top:1px solid rgba(194,166,69,0.12)}

/* Hieroglyph walker figures (CSS clip-path) */
.eg-hiero-walker{position:absolute;z-index:3;pointer-events:none;width:12px;height:14px;top:2px;opacity:0.15}
.eg-hiero-walker::before{content:'';position:absolute;width:6px;height:6px;background:var(--eg-terra);border-radius:50%;top:0;left:3px}
.eg-hiero-walker::after{content:'';position:absolute;width:8px;height:8px;background:var(--eg-terra);clip-path:polygon(50% 0%,100% 100%,0% 100%);top:5px;left:2px}
.eg-hiero-walker.eg-walk{animation:eg-hiero-walk 8s linear infinite}
@keyframes eg-hiero-walk{0%{transform:translateX(0)}100%{transform:translateX(80px)}}

/* Phase backgrounds */
.eg-shell.eg-cold-open{background:linear-gradient(175deg,#1C1408 0%,#2E1E0E 20%,#3A2510 45%,#2A1A08 70%,#1A1005 100%);color:#E8D5A8;
  border-color:rgba(212,160,23,0.3);box-shadow:0 6px 30px rgba(0,0,0,0.5),inset 0 0 80px rgba(212,160,23,0.03)}
.eg-shell.eg-cold-open .eg-sidebar{background:linear-gradient(180deg,rgba(42,31,16,0.5),rgba(26,16,5,0.6));
  border-left-color:rgba(212,160,23,0.1);
  box-shadow:inset 4px 0 0 rgba(212,160,23,0.06),inset 5px 0 0 rgba(0,0,0,0.15)}
.eg-shell.eg-cold-open .eg-frieze{background:linear-gradient(180deg,rgba(212,160,23,0.04),rgba(26,20,8,0.3));border-bottom-color:rgba(212,160,23,0.1)}
.eg-shell.eg-cold-open .eg-hfig{opacity:0.08;color:var(--eg-pharaoh-gold)}
.eg-shell.eg-cold-open .eg-frieze-text{color:rgba(240,192,48,0.35)}
.eg-shell.eg-cold-open .eg-frieze-light{background:radial-gradient(ellipse 80px 40px at 50% 50%,rgba(240,192,48,0.06),transparent);animation:eg-gold-pulse 3s ease-in-out infinite}
.eg-shell.eg-cold-open .eg-sb-title{color:var(--eg-pharaoh-gold);border-bottom-color:rgba(212,160,23,0.1)}
.eg-shell.eg-cold-open .eg-sb-section{background:rgba(212,160,23,0.02)}
.eg-shell.eg-pyramid{background:linear-gradient(180deg,#2A1F14 0%,#3D2E1E 40%,#1A1510 100%);color:#E8D5A8;border-color:#5C3D2E}
.eg-shell.eg-pyramid .eg-sidebar{background:linear-gradient(180deg,rgba(42,31,20,0.1),rgba(255,153,68,0.03));box-shadow:inset 4px 0 0 rgba(255,153,68,0.1),inset 5px 0 0 rgba(0,0,0,0.1)}
.eg-shell.eg-desert{background:linear-gradient(180deg,#E8C870 0%,#D4A040 30%,#C89030 60%,#B87830 100%);color:#2A1A0A;border-color:#B85C38}
.eg-shell.eg-desert .eg-sidebar{background:linear-gradient(180deg,rgba(184,92,56,0.04),rgba(232,200,112,0.03));box-shadow:inset 4px 0 0 rgba(184,92,56,0.1),inset 5px 0 0 rgba(0,0,0,0.08)}
.eg-shell.eg-nile{background:linear-gradient(180deg,#1A3540 0%,#1B4B7A 30%,#164060 70%,#0E2A3E 100%);color:#E0E8F0;border-color:#1B6B7A}
.eg-shell.eg-nile .eg-sidebar{background:linear-gradient(180deg,rgba(14,42,62,0.08),rgba(27,107,122,0.03));box-shadow:inset 4px 0 0 rgba(27,107,122,0.1),inset 5px 0 0 rgba(0,0,0,0.1)}
.eg-shell.eg-winner{background:linear-gradient(180deg,var(--eg-papyrus) 0%,#E8D5A8 50%,var(--eg-papyrus) 100%);border-color:#D4A017;box-shadow:0 6px 30px rgba(212,160,23,0.3)}

/* Pyramid beat styling */
.eg-pyr-beat{margin:4px 0;font-size:0.92rem;line-height:1.5;display:flex;align-items:flex-start;gap:4px}
.eg-pyr-beat .eg-icon{margin-top:2px}
.eg-pyr-beat-gold{color:var(--eg-pharaoh-gold)}

/* Torch flicker (pyramid phase) */
.eg-pyramid .eg-card{box-shadow:0 0 15px rgba(255,153,68,0.15),0 0 30px rgba(255,153,68,0.08);animation:eg-torch-flicker 3s ease-in-out infinite}
.eg-pyramid .eg-card:nth-child(2n){animation-delay:0.5s;animation-duration:3.4s}
.eg-pyramid .eg-card:nth-child(3n){animation-delay:1s;animation-duration:2.8s}
@keyframes eg-torch-flicker{0%,100%{box-shadow:0 0 15px rgba(255,153,68,0.15),0 0 30px rgba(255,153,68,0.08)}50%{box-shadow:0 0 20px rgba(255,153,68,0.25),0 0 40px rgba(255,153,68,0.12)}}

/* Heat shimmer (desert phase) */
.eg-desert .eg-card{animation:eg-heat-shimmer 4s ease-in-out infinite}
.eg-desert .eg-card:nth-child(2n){animation-delay:0.8s}
.eg-desert .eg-card:nth-child(3n){animation-delay:1.6s}
@keyframes eg-heat-shimmer{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}

/* Water bob (nile phase) */
.eg-nile .eg-card{animation:eg-water-bob 3s ease-in-out infinite}
.eg-nile .eg-card:nth-child(2n){animation-delay:0.6s;animation-duration:3.5s}
.eg-nile .eg-card:nth-child(3n){animation-delay:1.2s;animation-duration:2.7s}
@keyframes eg-water-bob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-2px) rotate(0.5deg)}}

/* ═══ STONE SLAB REVEAL — excavation materialization ═══ */
.eg-step{opacity:0;max-height:0;overflow:hidden;transition:opacity 0.6s ease-out,max-height 0.7s ease-out}
.eg-step.eg-visible{opacity:1;max-height:4000px}
.eg-step.eg-visible>.eg-card{animation:eg-stone-emerge 0.5s ease-out}
@keyframes eg-stone-emerge{0%{transform:translateY(6px);opacity:0.3;filter:brightness(0.7)}100%{transform:translateY(0);opacity:1;filter:brightness(1)}}

/* ═══ HEADERS ═══ */
.eg-h1{font-family:'Metamorphous',cursive;font-size:2.6rem;font-weight:700;text-align:center;letter-spacing:4px;text-transform:uppercase;
  color:var(--eg-pharaoh-gold);margin:0 0 4px 0;position:relative;
  text-shadow:1px 1px 0 rgba(0,0,0,0.4),0 0 15px rgba(212,160,23,0.2)}
.eg-h1::after{content:'';display:block;width:80px;height:1px;margin:8px auto 12px;
  background:linear-gradient(90deg,transparent,var(--eg-gold),transparent)}

.eg-h2{font-family:'Metamorphous',cursive;font-size:1.4rem;font-weight:700;letter-spacing:3px;color:var(--eg-terra);margin:16px 0 8px;text-transform:uppercase;position:relative;
  text-shadow:1px 1px 0 rgba(0,0,0,0.2);padding-bottom:6px;
  border-bottom:1px solid rgba(194,166,69,0.15)}
.eg-h2::before{content:'𓋹';margin-right:8px;font-size:0.85em;opacity:0.3}
.eg-h2::after{content:'';position:absolute;bottom:-1px;left:0;width:40px;height:1px;background:var(--eg-gold);opacity:0.3}

.eg-h3{font-family:'Metamorphous',cursive;font-size:1.15rem;font-weight:600;color:var(--eg-gold);margin:10px 0 6px;letter-spacing:2px;
  text-shadow:0 1px 0 rgba(0,0,0,0.2)}

.eg-pyramid .eg-h2{color:var(--eg-torch);border-bottom-color:rgba(255,153,68,0.15)}
.eg-pyramid .eg-h2::after{background:var(--eg-torch)}
.eg-nile .eg-h2{color:#4AC1D0;border-bottom-color:rgba(74,193,208,0.15)}
.eg-nile .eg-h2::after{background:#4AC1D0}
.eg-nile .eg-h3{color:#4AC1D0}

/* ═══ SAND-WEATHERED CARDS — desert-worn panels ═══ */
.eg-card{
  background:linear-gradient(175deg,rgba(194,166,69,0.08) 0%,rgba(194,166,69,0.04) 40%,rgba(184,140,60,0.06) 100%);
  border:none;border-left:3px solid rgba(194,166,69,0.25);
  border-radius:2px;padding:12px 16px;margin:8px 0;color:var(--eg-text);font-size:1.0rem;line-height:1.55;position:relative;
  box-shadow:inset 2px 2px 0 rgba(255,235,180,0.1),inset -2px -2px 0 rgba(0,0,0,0.12),0 2px 6px rgba(0,0,0,0.08)}
.eg-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,rgba(194,166,69,0.15),transparent);border-radius:2px 2px 0 0}

.eg-pyramid .eg-card{
  background:linear-gradient(175deg,rgba(255,153,68,0.05) 0%,rgba(42,31,20,0.3) 100%);color:#E8D5A8;
  border-left-color:rgba(255,153,68,0.3);
  box-shadow:inset 2px 2px 0 rgba(255,153,68,0.08),inset -2px -2px 0 rgba(0,0,0,0.2),0 2px 8px rgba(0,0,0,0.2)}
.eg-nile .eg-card{
  background:linear-gradient(175deg,rgba(27,107,122,0.06) 0%,rgba(14,42,62,0.2) 100%);color:#E0E8F0;
  border-left-color:rgba(74,193,208,0.3);
  box-shadow:inset 2px 2px 0 rgba(74,193,208,0.06),inset -2px -2px 0 rgba(0,0,0,0.2),0 2px 8px rgba(0,0,0,0.18)}

.eg-card.eg-social{border-left-color:rgba(184,92,56,0.35);
  background:linear-gradient(175deg,rgba(184,92,56,0.06),rgba(184,92,56,0.02));
  border-left-style:dashed}
.eg-card.eg-social::before{background:linear-gradient(90deg,rgba(184,92,56,0.2),transparent)}

.eg-card.eg-curse{border-left-color:rgba(192,32,32,0.4);
  background:linear-gradient(175deg,rgba(192,32,32,0.06),rgba(192,32,32,0.02));
  box-shadow:inset 2px 2px 0 rgba(192,32,32,0.08),inset -2px -2px 0 rgba(0,0,0,0.15),0 2px 8px rgba(192,32,32,0.08)}
.eg-card.eg-curse::before{background:linear-gradient(90deg,rgba(192,32,32,0.25),transparent)}

.eg-card.eg-hero-card{border-left-color:rgba(34,139,34,0.35);
  background:linear-gradient(175deg,rgba(34,139,34,0.05),rgba(34,139,34,0.02))}

.eg-card.eg-villain-card{border-left-color:rgba(192,32,32,0.3);
  background:linear-gradient(175deg,rgba(192,32,32,0.04),rgba(0,0,0,0.02))}

.eg-card.eg-winner-card{border-left-color:rgba(212,160,23,0.5);
  background:linear-gradient(175deg,rgba(212,160,23,0.1),rgba(194,166,69,0.05));
  box-shadow:inset 2px 2px 0 rgba(212,160,23,0.15),inset -2px -2px 0 rgba(0,0,0,0.12),0 4px 12px rgba(212,160,23,0.12)}
.eg-card.eg-winner-card::before{background:linear-gradient(90deg,rgba(212,160,23,0.3),transparent)}

/* ═══ CARTOUCHE — subtle oval name badge ═══ */
.eg-cartouche{display:inline-flex;align-items:center;gap:6px;padding:5px 14px 5px 5px;margin:4px;position:relative;
  background:linear-gradient(135deg,rgba(194,166,69,0.1),rgba(160,136,56,0.05));
  border:1.5px solid rgba(194,166,69,0.3);border-radius:18px;
  box-shadow:0 2px 4px rgba(0,0,0,0.1)}
.eg-cartouche::before{content:'';position:absolute;left:-3px;top:30%;bottom:30%;width:2px;background:rgba(194,166,69,0.4);border-radius:1px}
.eg-cartouche::after{content:'';position:absolute;right:-3px;top:30%;bottom:30%;width:2px;background:rgba(194,166,69,0.4);border-radius:1px}

.eg-cartouche.eg-over{border-color:rgba(255,153,68,0.35);background:linear-gradient(135deg,rgba(255,153,68,0.1),rgba(184,92,56,0.05))}
.eg-cartouche.eg-under{border-color:rgba(45,139,87,0.3);background:linear-gradient(135deg,rgba(45,139,87,0.08),rgba(45,95,62,0.04))}
.eg-cartouche.eg-cursed{border-color:rgba(192,32,32,0.4);animation:eg-curse-pulse 2s ease infinite}
.eg-cartouche.eg-immune{border-color:rgba(212,160,23,0.5);background:linear-gradient(135deg,rgba(212,160,23,0.15),rgba(194,166,69,0.08));
  box-shadow:0 0 8px rgba(212,160,23,0.2)}
@keyframes eg-curse-pulse{0%,100%{box-shadow:0 0 4px rgba(192,32,32,0.15)}
  50%{box-shadow:0 0 10px rgba(192,32,32,0.3)}}

.eg-seal-frame{width:36px;height:36px;flex-shrink:0;overflow:hidden;border-radius:50%;position:relative;
  border:2px solid rgba(194,166,69,0.4)}
.eg-seal-frame img{width:100%;height:100%;object-fit:contain;display:block}
.eg-seal-frame::after{content:'';position:absolute;inset:0;border-radius:50%;
  box-shadow:inset 0 2px 4px rgba(0,0,0,0.15);pointer-events:none}

.eg-seal-name{font-family:'Cormorant Garamond',serif;font-size:0.95rem;font-weight:600;white-space:nowrap;letter-spacing:0.3px}
.eg-seal-tag{font-size:0.72rem;font-family:'Cormorant Garamond',serif;padding:1px 5px;letter-spacing:0.5px;
  border:1px solid rgba(194,166,69,0.25);border-radius:1px;text-transform:uppercase;margin-left:3px;color:var(--eg-muted)}

/* ═══ ANIMATED ICONS (CSS-only, no emoji) ═══ */
.eg-icon{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;margin-right:8px;vertical-align:middle;flex-shrink:0;position:relative}

/* Climb — ascending triangle */
.eg-icon-climb::before{content:'';width:14px;height:14px;background:var(--eg-terra);clip-path:polygon(50% 0%,100% 100%,0% 100%);animation:eg-climb-bob 1.5s ease infinite}
@keyframes eg-climb-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}

/* Surf — wave slash */
.eg-icon-surf::before{content:'';width:16px;height:8px;border:2px solid var(--eg-torch);border-radius:0 0 50% 50%;border-top:none;animation:eg-surf-rock 1s ease infinite alternate}
@keyframes eg-surf-rock{0%{transform:rotate(-10deg)}100%{transform:rotate(10deg)}}

/* Door — archway */
.eg-icon-door::before{content:'';width:12px;height:14px;border:2px solid var(--eg-gold);border-radius:6px 6px 0 0;border-bottom:none}
.eg-icon-door::after{content:'';position:absolute;bottom:0;width:12px;height:2px;background:var(--eg-gold)}

/* Scarab — pulsing beetle */
.eg-icon-scarab::before{content:'';width:12px;height:10px;background:var(--eg-scarab);border-radius:50% 50% 30% 30%;animation:eg-scarab-crawl 1.2s ease infinite}
.eg-icon-scarab::after{content:'';position:absolute;width:8px;height:1px;background:var(--eg-scarab);top:2px;animation:eg-scarab-antenna 0.6s ease infinite alternate}
@keyframes eg-scarab-crawl{0%,100%{transform:translateX(0)}50%{transform:translateX(2px)}}
@keyframes eg-scarab-antenna{0%{width:6px}100%{width:10px}}

/* Mummy — wrapped figure */
.eg-icon-mummy::before{content:'';width:10px;height:14px;background:repeating-linear-gradient(0deg,#C2A645 0px,#C2A645 2px,#A08838 2px,#A08838 4px);border-radius:4px 4px 2px 2px;animation:eg-mummy-sway 2s ease infinite}
@keyframes eg-mummy-sway{0%,100%{transform:rotate(0deg)}50%{transform:rotate(3deg)}}

/* Camel — humped silhouette */
.eg-icon-camel::before{content:'';width:16px;height:12px;background:var(--eg-terra);clip-path:polygon(10% 100%,15% 50%,30% 30%,45% 15%,55% 25%,65% 15%,75% 30%,85% 50%,90% 100%);animation:eg-camel-walk 2s ease infinite}
@keyframes eg-camel-walk{0%,100%{transform:translateX(0)}50%{transform:translateX(2px)}}

/* Croc — jaw snap */
.eg-icon-croc::before,.eg-icon-croc::after{content:'';position:absolute;width:10px;height:5px;background:var(--eg-scarab)}
.eg-icon-croc::before{top:3px;clip-path:polygon(0 100%,50% 0%,100% 100%);animation:eg-jaw-top 1.5s ease infinite}
.eg-icon-croc::after{bottom:3px;clip-path:polygon(0 0%,50% 100%,100% 0%);animation:eg-jaw-bottom 1.5s ease infinite}
@keyframes eg-jaw-top{0%,70%,100%{transform:translateY(0)}80%{transform:translateY(3px)}}
@keyframes eg-jaw-bottom{0%,70%,100%{transform:translateY(0)}80%{transform:translateY(-3px)}}

/* Boat — reed vessel */
.eg-icon-boat::before{content:'';width:16px;height:8px;border:2px solid var(--eg-gold);border-radius:0 0 50% 50%;border-top:none;animation:eg-boat-rock 2s ease infinite}
@keyframes eg-boat-rock{0%,100%{transform:rotate(0deg)}25%{transform:rotate(3deg)}75%{transform:rotate(-3deg)}}

/* Hero — shield */
.eg-icon-hero::before{content:'';width:12px;height:14px;background:var(--eg-success);clip-path:polygon(50% 0%,100% 25%,100% 60%,50% 100%,0% 60%,0% 25%);animation:eg-shield-glow 1.5s ease infinite}
@keyframes eg-shield-glow{0%,100%{box-shadow:none;filter:brightness(1)}50%{filter:brightness(1.3)}}

/* Villain — horns */
.eg-icon-villain::before,.eg-icon-villain::after{content:'';position:absolute;width:4px;height:10px;background:var(--eg-danger);border-radius:2px 2px 0 0}
.eg-icon-villain::before{left:3px;transform:rotate(-20deg)}
.eg-icon-villain::after{right:3px;transform:rotate(20deg)}

/* Navigate — compass */
.eg-icon-navigate::before{content:'';width:14px;height:14px;border:2px solid var(--eg-gold);border-radius:50%;animation:eg-compass-spin 4s linear infinite}
.eg-icon-navigate::after{content:'';position:absolute;width:2px;height:8px;background:linear-gradient(var(--eg-danger) 50%,var(--eg-text) 50%);border-radius:1px}
@keyframes eg-compass-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}

/* Sand — drifting particles */
.eg-icon-sand::before{content:'';width:14px;height:14px;background:radial-gradient(circle 2px at 30% 40%,var(--eg-sand),transparent),radial-gradient(circle 1.5px at 70% 60%,var(--eg-sand),transparent),radial-gradient(circle 1px at 50% 20%,var(--eg-sand),transparent);animation:eg-sand-drift 2s ease infinite}
@keyframes eg-sand-drift{0%{transform:translateX(0)}100%{transform:translateX(5px);opacity:0.5}}

/* Heart — beating */
.eg-icon-heart::before{content:'';width:14px;height:13px;background:var(--eg-danger);clip-path:polygon(50% 100%,0% 35%,0% 15%,25% 0%,50% 15%,75% 0%,100% 15%,100% 35%);animation:eg-heartbeat 1s ease infinite}
@keyframes eg-heartbeat{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.1)}}

/* Alert — triangle */
.eg-icon-alert::before{content:'';width:16px;height:14px;background:none;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:14px solid var(--eg-torch);animation:eg-alert-flash 0.8s ease infinite alternate}
@keyframes eg-alert-flash{0%{opacity:0.6}100%{opacity:1}}

/* Eye — blinking */
.eg-icon-eye::before{content:'';width:16px;height:10px;border:2px solid var(--eg-gold);border-radius:50%;animation:eg-blink 3s ease infinite}
.eg-icon-eye::after{content:'';position:absolute;width:6px;height:6px;background:var(--eg-gold);border-radius:50%;animation:eg-blink 3s ease infinite}
@keyframes eg-blink{0%,42%,46%,100%{transform:scaleY(1)}44%{transform:scaleY(0.1)}}

/* Bond — linked ankhs */
.eg-icon-bond::before,.eg-icon-bond::after{content:'';width:8px;height:10px;border:2px solid var(--eg-success);border-radius:50% 50% 0 0;position:absolute}
.eg-icon-bond::before{left:0;animation:eg-bond-l 1.5s ease infinite}
.eg-icon-bond::after{right:0;animation:eg-bond-r 1.5s ease infinite}
@keyframes eg-bond-l{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}
@keyframes eg-bond-r{0%,100%{transform:translateX(0)}50%{transform:translateX(-3px)}}

/* Summit — sun rays */
.eg-icon-summit::before{content:'';width:14px;height:14px;background:var(--eg-pharaoh-gold);clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);animation:eg-sun-spin 3s linear infinite}
@keyframes eg-sun-spin{to{transform:rotate(360deg)}}

/* Stick — divining rod */
.eg-icon-stick::before{content:'';width:3px;height:16px;background:linear-gradient(var(--eg-terra),#8B7530);border-radius:1px;animation:eg-stick-twitch 2s ease infinite}
@keyframes eg-stick-twitch{0%,80%,100%{transform:rotate(0deg)}85%{transform:rotate(-5deg)}90%{transform:rotate(5deg)}95%{transform:rotate(-3deg)}}

/* Collision — two dots */
.eg-icon-collision::before,.eg-icon-collision::after{content:'';width:7px;height:7px;border-radius:50%;position:absolute}
.eg-icon-collision::before{background:var(--eg-torch);animation:eg-bump-l 1s ease infinite}
.eg-icon-collision::after{background:var(--eg-terra);animation:eg-bump-r 1s ease infinite}
@keyframes eg-bump-l{0%{transform:translate(3px,0)}30%{transform:translate(0,0)}50%{transform:translate(-5px,-2px)}100%{transform:translate(3px,0)}}
@keyframes eg-bump-r{0%{transform:translate(-3px,0)}30%{transform:translate(0,0)}50%{transform:translate(5px,2px)}100%{transform:translate(-3px,0)}}

/* Fail — X */
.eg-icon-fail::before,.eg-icon-fail::after{content:'';position:absolute;width:12px;height:2px;background:var(--eg-danger);border-radius:1px}
.eg-icon-fail::before{transform:rotate(45deg)}
.eg-icon-fail::after{transform:rotate(-45deg)}

/* Success — checkmark */
.eg-icon-success::before{content:'';width:10px;height:6px;border-left:2px solid var(--eg-success);border-bottom:2px solid var(--eg-success);transform:rotate(-45deg)}

@media(prefers-reduced-motion:reduce){
  .eg-icon-climb::before,.eg-icon-surf::before,.eg-icon-scarab::before,.eg-icon-scarab::after,
  .eg-icon-mummy::before,.eg-icon-camel::before,.eg-icon-croc::before,.eg-icon-croc::after,
  .eg-icon-boat::before,.eg-icon-hero::before,.eg-icon-navigate::before,
  .eg-icon-sand::before,.eg-icon-heart::before,.eg-icon-alert::before,
  .eg-icon-eye::before,.eg-icon-eye::after,.eg-icon-bond::before,.eg-icon-bond::after,
  .eg-icon-summit::before,.eg-icon-stick::before,.eg-icon-collision::before,.eg-icon-collision::after{animation:none!important}
}

/* Scarab particle creatures */
.eg-scarab-particle{position:absolute;z-index:0;pointer-events:none;width:8px;height:6px;opacity:0.12}
.eg-scarab-particle::before{content:'';position:absolute;width:6px;height:5px;background:var(--eg-scarab);border-radius:50% 50% 30% 30%}
.eg-scarab-particle::after{content:'';position:absolute;width:4px;height:1px;background:var(--eg-scarab);top:0;left:1px}
.eg-scarab-particle.eg-active{animation:eg-scarab-scurry 5s linear infinite;opacity:0.2}
@keyframes eg-scarab-scurry{0%{transform:translate(0,0) scaleX(1)}25%{transform:translate(20px,-8px) scaleX(1)}50%{transform:translate(40px,3px) scaleX(-1)}75%{transform:translate(15px,-5px) scaleX(-1)}100%{transform:translate(0,0) scaleX(1)}}

/* Croc shadow creatures (nile phase) */
.eg-croc-shadow{position:absolute;z-index:0;pointer-events:none;width:24px;height:8px;opacity:0.1}
.eg-croc-shadow::before{content:'';position:absolute;width:16px;height:6px;background:rgba(27,75,122,0.8);border-radius:60% 40% 40% 60%}
.eg-croc-shadow::after{content:'';position:absolute;right:0;width:8px;height:3px;background:rgba(27,75,122,0.6);border-radius:0 50% 50% 0;top:2px}
.eg-croc-shadow.eg-swim{animation:eg-croc-swim 8s ease-in-out infinite;opacity:0.15}
@keyframes eg-croc-swim{0%{transform:translateX(0) scaleX(1)}45%{transform:translateX(60px) scaleX(1)}55%{transform:translateX(60px) scaleX(-1)}100%{transform:translateX(0) scaleX(-1)}}

/* Sand drift particles (desert phase) */
.eg-sand-drift{position:absolute;z-index:0;pointer-events:none;width:3px;height:3px;border-radius:50%;background:rgba(232,213,168,0.3);animation:eg-sand-blow 6s linear infinite}
@keyframes eg-sand-blow{0%{transform:translate(0,0);opacity:0}10%{opacity:0.4}90%{opacity:0.2}100%{transform:translate(200px,30px);opacity:0}}

/* ═══ CARVED CHANNEL PROGRESS — stone trough with flowing fill ═══ */
.eg-bar-wrap{height:10px;margin:4px 0;position:relative;border-radius:1px;
  background:linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.05));
  box-shadow:inset 2px 2px 0 rgba(0,0,0,0.1),inset -1px -1px 0 rgba(255,235,180,0.08);
  clip-path:polygon(2% 0%,98% 0%,100% 50%,98% 100%,2% 100%,0% 50%)}
.eg-bar{height:100%;transition:width 0.4s ease;position:relative}
.eg-bar::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,0.06) 0px,rgba(255,255,255,0.06) 2px,transparent 2px,transparent 6px);animation:eg-bar-flow 2s linear infinite}
@keyframes eg-bar-flow{0%{background-position:0 0}100%{background-position:24px 0}}
.eg-bar.eg-gold{background:linear-gradient(180deg,var(--eg-pharaoh-gold),var(--eg-gold),rgba(160,136,56,0.8))}
.eg-bar.eg-green{background:linear-gradient(180deg,#4CAF50,var(--eg-success),rgba(58,138,42,0.8))}
.eg-bar.eg-orange{background:linear-gradient(180deg,#E87830,var(--eg-torch),rgba(184,92,56,0.8))}
.eg-bar.eg-red{background:linear-gradient(180deg,#E53935,var(--eg-danger),rgba(204,48,48,0.8))}
.eg-bar.eg-blue{background:linear-gradient(180deg,#2196F3,var(--eg-nile),rgba(27,75,122,0.8))}

/* ═══ REVEAL CONTROLS ═══ */
.eg-reveal-bar{display:flex;gap:10px;align-items:center;justify-content:center;padding:12px 24px;flex-wrap:wrap;
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:100;max-width:860px;width:100%;
  background:linear-gradient(0deg,rgba(26,21,16,0.95),rgba(42,31,20,0.9));
  backdrop-filter:blur(8px);border-radius:0;
  box-shadow:0 -3px 0 rgba(194,166,69,0.15),0 -6px 20px rgba(0,0,0,0.4);
  border-top:2px solid rgba(194,166,69,0.12)}
.eg-reveal-bar::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(194,166,69,0.2),transparent)}
.eg-btn{font-family:'Metamorphous',cursive;font-size:0.95rem;font-weight:600;padding:8px 20px;border:1.5px solid rgba(194,166,69,0.3);border-radius:2px;
  background:linear-gradient(180deg,rgba(194,166,69,0.1),rgba(194,166,69,0.03));color:var(--eg-gold);cursor:pointer;
  letter-spacing:2px;text-transform:uppercase;
  box-shadow:inset 1px 1px 0 rgba(255,235,180,0.08),0 2px 4px rgba(0,0,0,0.2);
  transition:all 0.2s}
.eg-btn:hover{background:linear-gradient(180deg,rgba(194,166,69,0.18),rgba(194,166,69,0.06));border-color:var(--eg-gold);
  box-shadow:inset 1px 1px 0 rgba(255,235,180,0.12),0 2px 6px rgba(212,160,23,0.15)}
.eg-btn.eg-btn-terra{border-color:rgba(184,92,56,0.3);color:var(--eg-terra);
  background:linear-gradient(180deg,rgba(184,92,56,0.1),rgba(184,92,56,0.03))}
.eg-btn.eg-btn-terra:hover{border-color:var(--eg-terra);background:linear-gradient(180deg,rgba(184,92,56,0.18),rgba(184,92,56,0.06))}

/* ═══ HOST LINES ═══ */
.eg-host{font-family:'Cormorant Garamond',serif;font-size:1.08rem;font-style:italic;color:var(--eg-terra);margin:10px 0;padding:10px 16px;
  border:none;border-radius:2px;position:relative;
  background:linear-gradient(135deg,rgba(184,92,56,0.05),rgba(194,166,69,0.03));
  box-shadow:inset 2px 2px 0 rgba(255,235,180,0.06),inset -2px -2px 0 rgba(0,0,0,0.08);
  text-shadow:0 1px 0 rgba(0,0,0,0.1);letter-spacing:0.3px;line-height:1.6}
.eg-host::before{content:'𓂋';position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:0.65rem;opacity:0.2}
.eg-host::after{content:'';position:absolute;bottom:0;left:8px;right:8px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(194,166,69,0.15),transparent)}
.eg-pyramid .eg-host{color:var(--eg-torch);background:linear-gradient(135deg,rgba(255,153,68,0.04),rgba(42,31,20,0.06))}
.eg-nile .eg-host{color:#4AC1D0;background:linear-gradient(135deg,rgba(74,193,208,0.04),rgba(14,42,62,0.06))}

/* ═══ SIDEBAR SECTIONS ═══ */
.eg-sb-title{font-family:'Metamorphous',cursive;font-size:0.9rem;font-weight:700;letter-spacing:2px;color:var(--eg-gold);text-transform:uppercase;
  margin:0 0 8px 0;padding:4px 6px;text-align:center;position:relative;
  text-shadow:0 1px 0 rgba(0,0,0,0.15);
  background:linear-gradient(135deg,rgba(194,166,69,0.06),transparent);
  border-bottom:1px solid rgba(194,166,69,0.12)}
.eg-sb-title::before,.eg-sb-title::after{content:'';position:absolute;top:50%;width:10px;height:1px;background:var(--eg-gold);opacity:0.2}
.eg-sb-title::before{left:0}.eg-sb-title::after{right:0}

.eg-sb-section{margin:10px 0;padding:6px;border-radius:2px;
  background:rgba(194,166,69,0.03);
  box-shadow:inset 1px 1px 0 rgba(255,235,180,0.04),inset -1px -1px 0 rgba(0,0,0,0.04)}

.eg-sb-row{display:flex;align-items:center;gap:5px;margin:3px 0;font-size:0.88rem;padding:2px 3px;
  border-bottom:1px solid rgba(212,160,23,0.08)}
.eg-sb-row:last-child{border-bottom:none}
.eg-sb-row img{width:22px;height:22px;border-radius:2px;object-fit:contain;flex-shrink:0;
  border:1.5px solid rgba(194,166,69,0.3);box-shadow:inset 1px 1px 0 rgba(255,235,180,0.1)}
.eg-sb-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:'Cormorant Garamond',serif;font-size:0.92rem}

.eg-sb-tag{font-family:'Cormorant Garamond',serif;font-size:0.7rem;padding:2px 5px;border-radius:1px;white-space:nowrap;
  letter-spacing:1px;text-transform:uppercase;border:1px solid currentColor;opacity:0.85}
.eg-sb-tag.eg-t-gold{color:var(--eg-gold);background:rgba(194,166,69,0.06);border-color:rgba(194,166,69,0.2)}
.eg-sb-tag.eg-t-green{color:var(--eg-success);background:rgba(58,138,42,0.06);border-color:rgba(58,138,42,0.2)}
.eg-sb-tag.eg-t-orange{color:var(--eg-torch);background:rgba(255,153,68,0.06);border-color:rgba(255,153,68,0.2)}
.eg-sb-tag.eg-t-red{color:var(--eg-danger);background:rgba(204,48,48,0.06);border-color:rgba(204,48,48,0.2)}
.eg-sb-tag.eg-t-blue{color:var(--eg-nile);background:rgba(27,107,122,0.06);border-color:rgba(27,107,122,0.2)}
.eg-sb-tag.eg-t-grey{color:#999;background:rgba(200,200,200,0.04);border-color:rgba(200,200,200,0.12)}

/* ═══ STONE HOURGLASS RELIEF — carved sand timer ═══ */
.eg-hourglass{width:28px;height:54px;margin:8px auto;position:relative;border-radius:2px;
  border:2px solid var(--eg-gold);overflow:hidden;
  box-shadow:inset 2px 2px 0 rgba(255,235,180,0.12),inset -1px -1px 0 rgba(0,0,0,0.15),0 2px 4px rgba(0,0,0,0.1);
  clip-path:polygon(0% 0%,100% 0%,70% 45%,70% 55%,100% 100%,0% 100%,30% 55%,30% 45%)}
.eg-hourglass-top{position:absolute;top:0;left:0;right:0;background:linear-gradient(180deg,var(--eg-sand),rgba(232,213,168,0.6));transition:height 0.5s}
.eg-hourglass-bot{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(0deg,var(--eg-sand),rgba(232,213,168,0.6));transition:height 0.5s}
.eg-hourglass::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:3px;height:3px;background:var(--eg-sand);border-radius:50%;opacity:0.6}

/* ═══ CARVED PYRAMID CROSS-SECTION — engraved tracker ═══ */
.eg-pyramid-tracker{width:100%;height:80px;margin:8px 0;position:relative;border-radius:2px;overflow:hidden;
  background:linear-gradient(180deg,rgba(194,166,69,0.03),rgba(194,166,69,0.08));
  box-shadow:inset 2px 2px 0 rgba(255,235,180,0.06),inset -2px -2px 0 rgba(0,0,0,0.08)}
.eg-pyramid-tracker::before{content:'';position:absolute;left:50%;bottom:0;transform:translateX(-50%);
  width:0;height:0;border-left:55px solid transparent;border-right:55px solid transparent;
  border-bottom:65px solid rgba(194,166,69,0.1)}
.eg-pyramid-tracker::after{content:'';position:absolute;left:50%;bottom:0;transform:translateX(-50%);
  width:0;height:0;border-left:52px solid transparent;border-right:52px solid transparent;
  border-bottom:62px solid rgba(0,0,0,0.04)}
.eg-pyr-dot{position:absolute;width:7px;height:7px;border-radius:1px;transition:all 0.3s;
  box-shadow:inset 1px 1px 0 rgba(255,255,255,0.2)}
.eg-pyr-dot.eg-over-dot{background:var(--eg-torch)}
.eg-pyr-dot.eg-under-dot{background:var(--eg-scarab)}
.eg-pyr-dot.eg-hidden-dot{background:var(--eg-muted);opacity:0.2}

/* ═══ AMBIENT NARRATION ═══ */
.eg-comm{font-family:'Cormorant Garamond',serif;font-size:0.88rem;font-style:italic;color:var(--eg-muted);padding:6px 14px;margin:8px 0;
  line-height:1.5;text-align:center;position:relative;letter-spacing:0.5px;
  opacity:0.6}
.eg-comm::before,.eg-comm::after{content:'𓃭';font-style:normal;font-size:0.5rem;opacity:0.2;vertical-align:middle}
.eg-comm::before{margin-right:8px}.eg-comm::after{margin-left:8px}
.eg-pyramid .eg-comm{color:rgba(232,213,168,0.4)}
.eg-nile .eg-comm{color:rgba(74,193,208,0.35)}

/* ═══ LIVING FRIEZE — walking hieroglyphs + papyrus scroll + sand erosion decode ═══ */
.eg-frieze{position:relative;height:44px;z-index:2;overflow:hidden;
  background:linear-gradient(180deg,rgba(194,166,69,0.08),rgba(194,166,69,0.03));
  border-bottom:2px solid rgba(194,166,69,0.15);
  border-image:repeating-linear-gradient(90deg,var(--eg-gold) 0px,var(--eg-gold) 8px,transparent 8px,transparent 16px) 2}

/* Papyrus scroll material — fiber texture via layered gradients */
.eg-frieze::before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:
    repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(194,166,69,0.03) 3px,rgba(194,166,69,0.03) 4px),
    repeating-linear-gradient(90deg,transparent,transparent 7px,rgba(160,136,56,0.02) 7px,rgba(160,136,56,0.02) 8px)}

/* Curled scroll edges */
.eg-frieze::after{content:'';position:absolute;top:0;bottom:0;right:0;width:20px;z-index:3;pointer-events:none;
  background:linear-gradient(270deg,rgba(194,166,69,0.12),transparent);
  border-left:1px solid rgba(194,166,69,0.06);
  box-shadow:inset 2px 0 4px rgba(0,0,0,0.05)}
.eg-frieze-curl-l{position:absolute;top:0;bottom:0;left:0;width:16px;z-index:3;pointer-events:none;
  background:linear-gradient(90deg,rgba(194,166,69,0.12),transparent);
  border-right:1px solid rgba(194,166,69,0.06);
  box-shadow:inset -2px 0 4px rgba(0,0,0,0.05)}

/* Phase degradation — pristine → sun-bleached → cracked → waterlogged */
.eg-pyramid .eg-frieze{background:linear-gradient(180deg,rgba(255,153,68,0.06),rgba(26,21,16,0.15));border-bottom-color:rgba(255,153,68,0.2)}
.eg-desert .eg-frieze{background:linear-gradient(180deg,rgba(232,200,112,0.1),rgba(184,92,56,0.06));border-bottom-color:rgba(184,92,56,0.2);
  filter:contrast(1.05) brightness(1.02)}
.eg-desert .eg-frieze::before{background:
  repeating-linear-gradient(37deg,transparent,transparent 5px,rgba(184,92,56,0.04) 5px,rgba(184,92,56,0.04) 6px),
  repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(194,166,69,0.03) 3px,rgba(194,166,69,0.03) 4px)}
.eg-nile .eg-frieze{background:linear-gradient(180deg,rgba(27,75,122,0.12),rgba(14,42,62,0.2));border-bottom-color:rgba(27,107,122,0.25)}
.eg-nile .eg-frieze::before{background:
  repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(74,193,208,0.04) 2px,rgba(74,193,208,0.04) 3px),
  repeating-linear-gradient(90deg,transparent,transparent 5px,rgba(27,107,122,0.03) 5px,rgba(27,107,122,0.03) 6px)}
.eg-winner .eg-frieze{background:linear-gradient(180deg,rgba(212,160,23,0.1),rgba(194,166,69,0.05));border-bottom-color:rgba(212,160,23,0.3);
  box-shadow:0 2px 12px rgba(212,160,23,0.15)}

/* Walking hieroglyph procession — clip-path figures with 2-frame walk */
.eg-frieze-proc{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;overflow:hidden}
.eg-hfig{position:absolute;bottom:4px;width:12px;height:26px;opacity:0.12;animation:eg-fig-walk var(--eg-walk-dur,14s) linear infinite}
.eg-pyramid .eg-hfig{opacity:0.18}
.eg-nile .eg-hfig{opacity:0.1}

/* Figure body — clip-path walking person with torch/oar/etc */
.eg-hfig-body{position:absolute;inset:0}
.eg-hfig-body::before{content:'';position:absolute;width:100%;height:100%;background:currentColor}

/* Torch-bearer (pyramid) */
.eg-fig-torch .eg-hfig-body::before{clip-path:polygon(42% 0%,58% 0%,58% 15%,75% 15%,75% 20%,58% 20%,62% 35%,80% 55%,72% 58%,55% 40%,55% 65%,70% 95%,60% 100%,50% 72%,40% 100%,30% 95%,45% 65%,45% 40%,28% 58%,20% 55%,38% 35%,42% 20%)}
.eg-fig-torch .eg-hfig-body::after{content:'';position:absolute;top:-4px;right:-2px;width:6px;height:6px;background:var(--eg-torch);border-radius:50%;filter:blur(2px);animation:eg-torch-bob 0.6s ease infinite alternate}
@keyframes eg-torch-bob{0%{opacity:0.7;transform:scale(0.8)}100%{opacity:1;transform:scale(1.1) translateY(-1px)}}

/* Camel-rider (desert) */
.eg-fig-camel .eg-hfig-body::before{clip-path:polygon(20% 100%,25% 60%,30% 45%,40% 30%,50% 20%,55% 25%,60% 20%,65% 30%,70% 20%,75% 30%,80% 45%,85% 60%,80% 100%,70% 100%,70% 65%,65% 55%,60% 50%,55% 45%,50% 40%,45% 35%,42% 25%,40% 15%,38% 25%,35% 35%,30% 100%)}

/* Rower (nile) */
.eg-fig-rower .eg-hfig-body::before{clip-path:polygon(40% 5%,60% 5%,58% 20%,65% 30%,90% 25%,92% 32%,62% 38%,58% 55%,65% 95%,55% 100%,50% 65%,45% 100%,35% 95%,42% 55%,38% 38%,8% 50%,5% 43%,35% 30%,42% 20%)}

/* Pharaoh (winner) */
.eg-fig-pharaoh .eg-hfig-body::before{clip-path:polygon(35% 0%,65% 0%,70% 10%,65% 12%,60% 20%,62% 35%,78% 50%,72% 55%,58% 42%,58% 60%,68% 95%,58% 100%,50% 68%,42% 100%,32% 95%,42% 60%,42% 42%,28% 55%,22% 50%,38% 35%,40% 20%,35% 12%,30% 10%)}
.eg-fig-pharaoh .eg-hfig-body::after{content:'';position:absolute;top:-2px;left:50%;transform:translateX(-50%);width:10px;height:5px;background:var(--eg-pharaoh-gold);clip-path:polygon(50% 0%,100% 100%,0% 100%);opacity:0.5}

/* Explorer (default) */
.eg-fig-explorer .eg-hfig-body::before{clip-path:polygon(42% 0%,58% 0%,58% 18%,62% 35%,78% 52%,72% 58%,55% 42%,55% 62%,68% 95%,58% 100%,50% 70%,42% 100%,32% 95%,45% 62%,45% 42%,28% 58%,22% 52%,38% 35%,42% 18%)}

/* Walk animation — figures march across */
@keyframes eg-fig-walk{0%{transform:translateX(-20px)}100%{transform:translateX(calc(100vw + 20px))}}

/* 2-frame walk cycle via scaleX flip */
.eg-hfig:nth-child(odd){animation-direction:normal}
.eg-hfig:nth-child(even){transform:scaleX(-1)}

/* Figure shadows */
.eg-hfig-shadow{position:absolute;bottom:0;left:0;width:14px;height:3px;background:rgba(0,0,0,0.08);border-radius:50%;filter:blur(1px)}
.eg-pyramid .eg-hfig-shadow{background:rgba(0,0,0,0.15)}

/* Phase-reactive lighting */
.eg-frieze-light{position:absolute;inset:0;z-index:2;pointer-events:none}

/* Pyramid: torch glow sweeps left to right */
.eg-pyramid .eg-frieze-light{background:radial-gradient(ellipse 60px 40px at var(--eg-glow-x,30%) 50%,rgba(255,153,68,0.15),transparent);animation:eg-glow-sweep 6s ease-in-out infinite}
@keyframes eg-glow-sweep{0%{--eg-glow-x:10%}50%{--eg-glow-x:90%}100%{--eg-glow-x:10%}}
@supports not (animation: a) {.eg-pyramid .eg-frieze-light{background:linear-gradient(90deg,transparent,rgba(255,153,68,0.08),transparent)}}

/* Desert: heat distortion warp */
.eg-desert .eg-frieze-light{background:repeating-linear-gradient(0deg,transparent,transparent 6px,rgba(232,200,112,0.06) 6px,rgba(232,200,112,0.06) 8px);animation:eg-heat-warp 3s ease-in-out infinite}
@keyframes eg-heat-warp{0%,100%{transform:skewX(0deg)}25%{transform:skewX(0.3deg)}75%{transform:skewX(-0.3deg)}}

/* Nile: water caustic ripple */
.eg-nile .eg-frieze-light{background:
  radial-gradient(ellipse 30px 20px at 25% 60%,rgba(74,193,208,0.1),transparent),
  radial-gradient(ellipse 25px 15px at 65% 30%,rgba(74,193,208,0.08),transparent),
  radial-gradient(ellipse 35px 18px at 45% 70%,rgba(74,193,208,0.06),transparent);
  animation:eg-caustic-drift 5s ease-in-out infinite}
@keyframes eg-caustic-drift{0%{background-position:0 0,0 0,0 0}50%{background-position:15px 3px,-10px -2px,8px 4px}100%{background-position:0 0,0 0,0 0}}

/* Winner: golden pulse */
.eg-winner .eg-frieze-light{background:radial-gradient(ellipse at 50% 50%,rgba(212,160,23,0.2),transparent 70%);animation:eg-gold-pulse 2s ease-in-out infinite}
@keyframes eg-gold-pulse{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}

/* Sand erosion decode — text container */
.eg-frieze-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:4;text-align:center;white-space:nowrap;font-family:'Metamorphous',cursive;font-size:0.85rem;letter-spacing:3px;color:var(--eg-muted);text-transform:uppercase;height:16px;overflow:hidden}
.eg-pyramid .eg-frieze-text{color:rgba(232,213,168,0.6)}
.eg-nile .eg-frieze-text{color:rgba(74,193,208,0.5)}
.eg-desert .eg-frieze-text{color:rgba(42,26,10,0.5)}
.eg-winner .eg-frieze-text{color:var(--eg-pharaoh-gold)}

/* Each reading: glyph layer + english layer, sand wipes glyph away to reveal english */
.eg-frieze-reading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;animation:eg-read-show var(--eg-rd-dur,16s) linear infinite}
@keyframes eg-read-show{0%{opacity:0}2%{opacity:1}20%{opacity:1}23%{opacity:0}100%{opacity:0}}

.eg-frieze-glyph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  animation:eg-sand-erode var(--eg-rd-dur,16s) linear infinite;
  background:linear-gradient(90deg,transparent var(--eg-erode,0%),currentColor var(--eg-erode,0%));
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
@keyframes eg-sand-erode{0%,2%{--eg-erode:0%}10%{--eg-erode:0%}18%{--eg-erode:100%}100%{--eg-erode:100%}}

.eg-frieze-english{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  clip-path:inset(0 calc(100% - var(--eg-reveal,0%)) 0 0);
  animation:eg-text-reveal var(--eg-rd-dur,16s) linear infinite}
@keyframes eg-text-reveal{0%,2%{clip-path:inset(0 100% 0 0)}10%{clip-path:inset(0 100% 0 0)}18%{clip-path:inset(0 0% 0 0)}20%{clip-path:inset(0 0% 0 0)}23%{clip-path:inset(0 0% 0 0)}100%{clip-path:inset(0 0% 0 0)}}

/* Sand grain particles that fall during erosion */
.eg-frieze-sand{position:absolute;bottom:0;left:0;right:0;height:6px;z-index:5;pointer-events:none;overflow:hidden}
.eg-sand-grain{position:absolute;width:2px;height:2px;background:var(--eg-sand);border-radius:50%;opacity:0;animation:eg-grain-fall var(--eg-grain-dur,2s) ease-in infinite}
@keyframes eg-grain-fall{0%{top:-2px;opacity:0}10%{opacity:0.4}90%{opacity:0.3}100%{top:6px;opacity:0}}
.eg-pyramid .eg-sand-grain{background:rgba(255,153,68,0.3)}
.eg-nile .eg-sand-grain{background:rgba(74,193,208,0.2)}

/* Phase transitions */
.eg-transition{position:absolute;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;pointer-events:none}
.eg-transition.eg-trans-sandstorm{background:rgba(232,200,112,0.8);overflow:hidden;animation:eg-trans-sand 2.5s ease-out forwards}
@keyframes eg-trans-sand{0%{opacity:1}70%{opacity:0.6}100%{opacity:0;visibility:hidden}}
.eg-trans-sandstorm::before,.eg-trans-sandstorm::after{content:'';position:absolute;width:100%;height:100%;
  background:radial-gradient(circle 3px at 10% 30%,var(--eg-sand),transparent),
    radial-gradient(circle 2px at 30% 60%,var(--eg-sand),transparent),
    radial-gradient(circle 4px at 60% 20%,var(--eg-sand),transparent),
    radial-gradient(circle 2px at 80% 70%,var(--eg-sand),transparent),
    radial-gradient(circle 3px at 50% 50%,var(--eg-sand),transparent);
  animation:eg-sand-rush 1s linear infinite}
@keyframes eg-sand-rush{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.eg-transition.eg-trans-flood{background:linear-gradient(0deg,rgba(27,75,122,0.8) 0%,transparent 60%);animation:eg-trans-water 2s ease-out forwards}
@keyframes eg-trans-water{0%{opacity:1}100%{opacity:0;visibility:hidden}}
.eg-transition.eg-trans-winner{background:radial-gradient(circle,rgba(212,160,23,0.6),transparent 70%);animation:eg-trans-gold 2s ease-out forwards}
@keyframes eg-trans-gold{0%{opacity:1;transform:scale(0.5)}40%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(2);visibility:hidden}}


/* Rising water line for Nile phase */
.eg-water-rise{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(0deg,rgba(27,75,122,0.15),transparent);transition:height 0.5s;pointer-events:none;z-index:0}

/* Croc jaw snap on attack cards */
.eg-jaw-snap .eg-card{animation:eg-jaw-attack 0.4s ease-out}
@keyframes eg-jaw-attack{0%{transform:scale(1)}20%{transform:scale(1.02)}40%{transform:scale(0.98) translateX(-2px)}60%{transform:scale(1.01) translateX(2px)}100%{transform:scale(1)}}

/* Screen shake */
.eg-shake{animation:eg-screen-shake 0.3s ease-in-out}
@keyframes eg-screen-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}

/* ═══ LEADERBOARD ═══ */
.eg-lb-row{display:flex;align-items:center;gap:6px;padding:6px 10px;margin:3px 0;border-radius:2px;font-size:0.95rem;
  background:linear-gradient(135deg,rgba(194,166,69,0.04),transparent);
  border-bottom:1px solid rgba(194,166,69,0.06)}
.eg-lb-row.eg-first{
  background:linear-gradient(135deg,rgba(212,160,23,0.08),rgba(194,166,69,0.04));
  box-shadow:inset 2px 2px 0 rgba(212,160,23,0.08),0 2px 6px rgba(212,160,23,0.06);
  border-bottom:1px solid rgba(212,160,23,0.15)}
.eg-lb-rank{font-family:'Metamorphous',cursive;width:28px;text-align:center;color:var(--eg-terra);font-weight:700;font-size:1.0rem;
  text-shadow:0 1px 0 rgba(0,0,0,0.1)}
.eg-lb-name{flex:1;font-family:'Cormorant Garamond',serif;font-size:1.0rem;letter-spacing:0.3px}
.eg-lb-score{font-family:'Cormorant Garamond',serif;color:var(--eg-gold);font-size:0.95rem;font-weight:600;letter-spacing:0.5px}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .eg-shell::before,.eg-shell::after{animation:none!important}
  .eg-h1,.eg-hiero-walker{animation:none!important}
  .eg-step{transition:none!important}
  .eg-bar{transition:none!important}
  .eg-transition{animation:none!important;opacity:0!important;visibility:hidden!important}
  .eg-transition::before,.eg-transition::after{animation:none!important}
  .eg-hfig,.eg-frieze-light,.eg-sand-grain{animation:none!important;display:none}
  .eg-frieze-reading,.eg-frieze-glyph,.eg-frieze-english{animation:none!important}
  .eg-frieze-reading:first-child{opacity:1;position:static}
  .eg-frieze-reading:first-child .eg-frieze-glyph{display:none}
  .eg-frieze-reading:first-child .eg-frieze-english{clip-path:none;position:static}
  .eg-heat-warp,.eg-glow-sweep,.eg-caustic-drift,.eg-gold-pulse{animation:none!important}
  .eg-card{animation:none!important;filter:none!important;opacity:1!important;transform:none!important}
  .eg-scarab-particle,.eg-croc-shadow,.eg-sand-drift{animation:none!important;display:none}
  .eg-cartouche.eg-cursed{animation:none!important}
  .eg-bar::after{animation:none!important}
  .eg-step.eg-visible>.eg-card{animation:none!important}
  .eg-water-rise{transition:none!important}
}

.eg-step .eg-card{animation-play-state:paused}
.eg-step.eg-visible .eg-card{animation-play-state:running}

/* ═══ DEITY SILHOUETTES — CSS clip-path Egyptian gods ═══ */
.eg-deity{position:relative;width:60px;height:80px;margin:0 auto 8px;opacity:0.7}
.eg-deity::before{content:'';position:absolute;inset:0;background:currentColor}

.eg-deity-anubis{color:var(--eg-gold)}
.eg-deity-anubis::before{clip-path:polygon(45% 0%,55% 0%,58% 8%,65% 5%,70% 12%,62% 15%,58% 20%,60% 25%,70% 40%,90% 35%,85% 42%,65% 45%,62% 50%,65% 60%,60% 95%,55% 100%,52% 65%,48% 65%,45% 100%,40% 95%,35% 60%,38% 50%,35% 45%,15% 42%,10% 35%,30% 40%,40% 25%,42% 20%,38% 15%,30% 12%,35% 5%,42% 8%)}
.eg-deity-anubis::after{content:'';position:absolute;top:6%;left:48%;width:5px;height:3px;background:var(--eg-faience);border-radius:50%;animation:eg-deity-eye 3s ease infinite}

.eg-deity-ra{color:var(--eg-pharaoh-gold)}
.eg-deity-ra::before{clip-path:polygon(50% 0%,60% 5%,65% 3%,62% 10%,55% 12%,58% 20%,62% 25%,75% 38%,95% 30%,88% 40%,68% 45%,62% 50%,65% 60%,60% 95%,55% 100%,52% 65%,48% 65%,45% 100%,40% 95%,35% 60%,38% 50%,32% 45%,12% 40%,5% 30%,25% 38%,38% 25%,42% 20%,45% 12%,38% 10%,35% 3%,40% 5%)}
.eg-deity-ra::after{content:'';position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:24px;height:12px;background:var(--eg-pharaoh-gold);border-radius:50% 50% 0 0;box-shadow:0 0 8px rgba(240,192,48,0.5);animation:eg-ra-glow 2s ease infinite}

.eg-deity-sobek{color:var(--eg-scarab)}
.eg-deity-sobek::before{clip-path:polygon(40% 0%,55% 0%,60% 3%,68% 2%,72% 8%,65% 12%,58% 15%,60% 22%,62% 28%,72% 38%,88% 32%,82% 42%,65% 45%,60% 52%,62% 62%,58% 95%,52% 100%,50% 68%,48% 68%,48% 100%,42% 95%,38% 62%,40% 52%,35% 45%,18% 42%,12% 32%,28% 38%,38% 28%,40% 22%,42% 15%,35% 12%,28% 8%,32% 2%,38% 3%)}

.eg-deity-isis{color:var(--eg-lapis)}
.eg-deity-isis::before{clip-path:polygon(50% 0%,55% 8%,58% 15%,60% 22%,65% 30%,95% 20%,90% 28%,70% 35%,65% 40%,62% 48%,60% 55%,70% 58%,62% 62%,60% 68%,58% 95%,52% 100%,50% 70%,48% 70%,48% 100%,42% 95%,40% 68%,38% 62%,30% 58%,40% 55%,38% 48%,35% 40%,30% 35%,10% 28%,5% 20%,35% 30%,40% 22%,42% 15%,45% 8%)}
.eg-deity-isis::after{content:'';position:absolute;top:-4px;left:30%;right:30%;height:6px;background:var(--eg-faience);clip-path:polygon(0% 100%,50% 0%,100% 100%);animation:eg-isis-wings 3s ease infinite}

@keyframes eg-deity-eye{0%,90%,100%{opacity:1}94%{opacity:0.1}}
@keyframes eg-ra-glow{0%,100%{box-shadow:0 0 6px rgba(240,192,48,0.4);opacity:0.8}50%{box-shadow:0 0 14px rgba(240,192,48,0.7);opacity:1}}
@keyframes eg-isis-wings{0%,100%{transform:scaleX(1)}50%{transform:scaleX(1.15)}}

/* ═══ DEITY JUDGMENT CARDS ═══ */
.eg-card.eg-deity-card{border-left-color:rgba(212,160,23,0.4);
  background:linear-gradient(175deg,rgba(212,160,23,0.06),rgba(194,166,69,0.03))}

/* ═══ ANIMATION KEYFRAMES ═══ */

/* Hieroglyph Decode — glyphs fade into readable text */
@keyframes eg-hiero-decode{0%{opacity:0;filter:blur(3px);letter-spacing:8px}40%{opacity:1;filter:blur(1px);letter-spacing:5px}100%{filter:blur(0);letter-spacing:normal}}
.eg-decode{animation:eg-hiero-decode 1.2s ease-out}

/* Papyrus Unroll — card slides open from top */
@keyframes eg-papyrus-unroll{0%{max-height:0;opacity:0;transform:rotateX(15deg)}60%{opacity:1}100%{max-height:600px;transform:rotateX(0)}}
.eg-unroll{animation:eg-papyrus-unroll 0.8s ease-out}

/* Cartouche Stamp — seal pressed into place */
@keyframes eg-cartouche-stamp{0%{transform:scale(1.8) rotate(-5deg);opacity:0}50%{transform:scale(0.95) rotate(1deg);opacity:1}70%{transform:scale(1.03)}100%{transform:scale(1) rotate(0)}}
.eg-stamp{animation:eg-cartouche-stamp 0.5s cubic-bezier(0.22,1,0.36,1)}

/* Ankh Pulse — life symbol radiates */
@keyframes eg-ankh-pulse{0%{box-shadow:0 0 0 0 rgba(0,160,160,0.4)}70%{box-shadow:0 0 0 12px rgba(0,160,160,0)}100%{box-shadow:0 0 0 0 rgba(0,160,160,0)}}
.eg-ankh-pulse{animation:eg-ankh-pulse 1.5s ease infinite}

/* Scarab Scout — beetle skitters across */
@keyframes eg-scarab-scout{0%{transform:translateX(-20px) scaleX(1);opacity:0}20%{opacity:1}50%{transform:translateX(50px) scaleX(1)}55%{transform:translateX(50px) scaleX(-1)}100%{transform:translateX(-10px) scaleX(-1);opacity:0}}
.eg-scarab-scout{animation:eg-scarab-scout 3s ease infinite}

/* Torch Illumination — light reveals from darkness */
@keyframes eg-torch-reveal{0%{filter:brightness(0.2);opacity:0.3}30%{filter:brightness(0.6);opacity:0.7}100%{filter:brightness(1);opacity:1}}
.eg-torch-reveal{animation:eg-torch-reveal 1s ease-out}

/* Water Ink Bleed — content bleeds in like wet papyrus */
@keyframes eg-ink-bleed{0%{clip-path:inset(50% 50% 50% 50%);opacity:0.3;filter:blur(2px)}60%{clip-path:inset(5% 5% 5% 5%);filter:blur(0.5px)}100%{clip-path:inset(0);opacity:1;filter:blur(0)}}
.eg-ink-bleed{animation:eg-ink-bleed 0.9s ease-out}

/* Sand Excavation — content dug from beneath sand */
@keyframes eg-excavate{0%{transform:translateY(10px);opacity:0;filter:sepia(0.5) brightness(0.8)}50%{filter:sepia(0.2) brightness(0.95)}100%{transform:translateY(0);opacity:1;filter:none}}
.eg-excavate{animation:eg-excavate 0.7s ease-out}

/* Curse Smoke — dark wisps rise */
@keyframes eg-curse-smoke{0%{opacity:0;transform:translateY(8px) scale(0.9);filter:brightness(0.6)}50%{opacity:1;filter:brightness(0.85)}100%{transform:translateY(0) scale(1);filter:brightness(1)}}
.eg-curse-smoke{animation:eg-curse-smoke 0.8s ease-out}

/* Ra's Beam — golden light descends */
@keyframes eg-ra-beam{0%{opacity:0;background-position:50% -100%}50%{opacity:1}100%{background-position:50% 100%}}
.eg-ra-beam{position:relative}
.eg-ra-beam::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(240,192,48,0.15),transparent,transparent);
  animation:eg-ra-beam 1.5s ease-out forwards}

/* Anubis Emergence — figure rises from shadow */
@keyframes eg-anubis-emerge{0%{transform:translateY(20px) scale(0.8);opacity:0;filter:brightness(0)}40%{filter:brightness(0.5)}100%{transform:translateY(0) scale(1);opacity:1;filter:brightness(1)}}
.eg-anubis-emerge{animation:eg-anubis-emerge 1s ease-out}

/* Ra Flare — sun burst */
@keyframes eg-ra-flare{0%{box-shadow:0 0 0 0 rgba(240,192,48,0.6)}50%{box-shadow:0 0 30px 10px rgba(240,192,48,0.2)}100%{box-shadow:0 0 0 0 rgba(240,192,48,0)}}
.eg-ra-flare{animation:eg-ra-flare 1.2s ease-out}

/* Sobek Surge — water rush */
@keyframes eg-sobek-surge{0%{transform:translateX(-100%);opacity:0}30%{opacity:1}100%{transform:translateX(0)}}
.eg-sobek-surge{animation:eg-sobek-surge 0.7s cubic-bezier(0.22,1,0.36,1)}

/* Isis Wings — protective spread */
@keyframes eg-isis-spread{0%{transform:scaleX(0);opacity:0}60%{transform:scaleX(1.1)}100%{transform:scaleX(1);opacity:1}}
.eg-isis-spread{animation:eg-isis-spread 0.8s cubic-bezier(0.22,1,0.36,1)}

/* ═══ DEITY JUDGMENT ENTRANCE — dramatic god appearance ═══ */
.eg-deity-entrance{text-align:center;padding:12px;margin:8px 0;position:relative;
  background:linear-gradient(180deg,rgba(194,166,69,0.04),transparent);
  border:1px solid rgba(194,166,69,0.1);border-radius:2px}
.eg-deity-entrance::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(194,166,69,0.2),transparent)}
.eg-deity-entrance .eg-deity-name{font-family:'Metamorphous',cursive;font-size:1.35rem;font-weight:700;color:var(--eg-pharaoh-gold);
  letter-spacing:4px;text-transform:uppercase;margin-top:4px;text-shadow:0 1px 0 rgba(0,0,0,0.3)}
.eg-deity-entrance .eg-deity-title{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.0rem;color:var(--eg-muted);
  margin-top:2px;letter-spacing:1px}

@media(prefers-reduced-motion:reduce){
  .eg-decode,.eg-unroll,.eg-stamp,.eg-ankh-pulse,.eg-scarab-scout,.eg-torch-reveal,
  .eg-ink-bleed,.eg-excavate,.eg-curse-smoke,.eg-ra-beam::after,.eg-anubis-emerge,
  .eg-ra-flare,.eg-sobek-surge,.eg-isis-spread,.eg-deity-anubis::after,
  .eg-deity-ra::after,.eg-deity-isis::after{animation:none!important}
}

/* ═══ COLD OPEN — dark cinematic Egyptian atmosphere ═══ */
.eg-co-wrap{text-align:center;padding:8px 0 20px;position:relative;z-index:1}

/* Golden dust motes floating through the scene */
.eg-gold-mote{position:absolute;z-index:0;pointer-events:none;border-radius:50%;
  background:radial-gradient(circle,rgba(240,192,48,0.6),rgba(212,160,23,0.1));
  box-shadow:0 0 4px rgba(240,192,48,0.3);
  animation:eg-mote-drift 6s ease-in-out infinite}
@keyframes eg-mote-drift{0%{transform:translate(0,0);opacity:0}15%{opacity:0.5}50%{transform:translate(15px,-20px);opacity:0.3}85%{opacity:0.4}100%{transform:translate(-10px,10px);opacity:0}}

/* Pyramid silhouette in background */
.eg-co-pyramid-sil{position:absolute;bottom:0;left:50%;transform:translateX(-50%);z-index:0;pointer-events:none;
  width:0;height:0;border-left:180px solid transparent;border-right:180px solid transparent;
  border-bottom:220px solid rgba(212,160,23,0.025);opacity:1}
.eg-co-pyramid-sil::before{content:'';position:absolute;bottom:-220px;left:-120px;
  width:0;height:0;border-left:120px solid transparent;border-right:120px solid transparent;
  border-bottom:150px solid rgba(212,160,23,0.018)}
.eg-co-pyramid-sil::after{content:'';position:absolute;bottom:-220px;left:60px;
  width:0;height:0;border-left:90px solid transparent;border-right:90px solid transparent;
  border-bottom:110px solid rgba(212,160,23,0.015)}

/* Horizon glow — warm golden light at the base */
.eg-co-horizon-glow{position:absolute;bottom:0;left:0;right:0;height:120px;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse 70% 100% at 50% 100%,rgba(212,160,23,0.08),transparent);
  animation:eg-horizon-breathe 5s ease-in-out infinite}
@keyframes eg-horizon-breathe{0%,100%{opacity:0.6}50%{opacity:1}}

/* Eye of Horus — CSS animated */
.eg-co-eye{width:70px;height:48px;margin:0 auto 10px;position:relative;opacity:0.35;animation:eg-co-eye-pulse 4s ease-in-out infinite}
.eg-co-eye-inner{position:absolute;inset:0}
.eg-co-eye-inner::before{content:'';position:absolute;width:44px;height:24px;left:13px;top:6px;
  border:2px solid rgba(240,192,48,0.6);border-radius:50%;
  box-shadow:0 0 15px rgba(240,192,48,0.15),inset 0 0 8px rgba(240,192,48,0.05)}
.eg-co-eye-inner::after{content:'';position:absolute;width:10px;height:10px;left:30px;top:13px;
  background:var(--eg-pharaoh-gold);border-radius:50%;
  box-shadow:0 0 8px rgba(240,192,48,0.5),0 0 20px rgba(240,192,48,0.15)}
@keyframes eg-co-eye-pulse{0%,100%{opacity:0.2;transform:scale(1)}50%{opacity:0.45;transform:scale(1.06)}}

/* "CHRIS McLEAN PRESENTS" */
.eg-co-presents{font-family:'Cormorant Garamond',serif;font-size:0.7rem;font-weight:600;letter-spacing:6px;
  color:rgba(232,213,168,0.35);text-transform:uppercase;margin-bottom:18px}

/* Title block */
.eg-co-title-block{position:relative;margin:0 auto 14px;max-width:520px}
.eg-co-hiero{font-size:1.0rem;letter-spacing:8px;color:rgba(240,192,48,0.2);margin-bottom:4px;
  animation:eg-co-hiero-fade 6s ease-in-out infinite}
@keyframes eg-co-hiero-fade{0%,100%{opacity:0.1}50%{opacity:0.3}}
.eg-co-title{font-family:'Metamorphous',cursive;font-size:2.6rem;font-weight:700;line-height:1.08;
  letter-spacing:4px;
  background:linear-gradient(180deg,#FFE08A 0%,#D4A017 40%,#B8860B 80%,#8B6914 100%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4)) drop-shadow(0 0 30px rgba(240,192,48,0.1));
  position:relative;z-index:1}
.eg-co-stripe{width:180px;height:1px;margin:10px auto 8px;position:relative;
  background:linear-gradient(90deg,transparent,rgba(212,160,23,0.4),transparent)}
.eg-co-stripe::before{content:'';position:absolute;top:-2px;left:50%;transform:translateX(-50%);
  width:6px;height:6px;background:var(--eg-pharaoh-gold);border-radius:50%;opacity:0.4;
  box-shadow:0 0 6px rgba(240,192,48,0.3)}
.eg-co-subtitle{font-family:'Metamorphous',cursive;font-size:0.8rem;letter-spacing:7px;
  color:rgba(192,72,32,0.7);text-transform:uppercase}

/* Tagline */
.eg-co-tagline{font-family:'Cormorant Garamond',serif;font-size:1.0rem;font-style:italic;
  color:rgba(232,213,168,0.4);margin:14px 0 20px;letter-spacing:0.5px;line-height:1.5}

/* Host announcement card */
.eg-co-host-card{display:flex;align-items:flex-start;gap:12px;text-align:left;
  max-width:500px;margin:0 auto 22px;padding:14px 16px;
  background:linear-gradient(135deg,rgba(192,72,32,0.08),rgba(42,31,16,0.3));
  border-left:3px solid rgba(192,72,32,0.5);border-radius:0 3px 3px 0;
  box-shadow:0 3px 12px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,153,68,0.05)}
.eg-co-host-badge{font-family:'Metamorphous',cursive;font-size:0.62rem;font-weight:700;letter-spacing:2px;
  color:var(--eg-torch);white-space:nowrap;padding:3px 8px;margin-top:2px;
  border:1.5px solid rgba(255,153,68,0.25);border-radius:2px;flex-shrink:0;
  background:rgba(255,153,68,0.06)}
.eg-co-host-text{font-family:'Cormorant Garamond',serif;font-size:1.0rem;font-style:italic;
  color:rgba(232,213,168,0.8);line-height:1.55;letter-spacing:0.2px}

/* Section labels */
.eg-co-section-label{font-family:'Metamorphous',cursive;font-size:0.72rem;font-weight:700;
  letter-spacing:5px;color:rgba(212,160,23,0.4);text-transform:uppercase;margin:0 0 10px;
  position:relative;display:flex;align-items:center;justify-content:center;gap:12px}
.eg-co-section-label::before,.eg-co-section-label::after{content:'';flex:1;max-width:80px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,160,23,0.15))}
.eg-co-section-label::after{background:linear-gradient(270deg,transparent,rgba(212,160,23,0.15))}

/* Tribe blocks */
.eg-co-tribes{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
.eg-co-tribe{flex:1;min-width:180px;max-width:280px;padding:10px 8px;
  background:linear-gradient(175deg,rgba(232,213,168,0.04),rgba(0,0,0,0.1));
  border:1px solid rgba(212,160,23,0.08);border-radius:3px;
  border-top:2px solid var(--eg-tribe-accent);
  box-shadow:0 2px 8px rgba(0,0,0,0.15)}
.eg-co-tribe-header{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.eg-co-tribe-line{flex:1;height:1px;background:rgba(212,160,23,0.08)}
.eg-co-tribe-name{font-family:'Metamorphous',cursive;font-size:0.8rem;font-weight:700;
  letter-spacing:2px;color:var(--eg-tribe-accent);text-transform:uppercase;white-space:nowrap}
.eg-co-members{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
.eg-co-member{display:flex;align-items:center;gap:5px;padding:3px 8px 3px 3px;
  background:rgba(232,213,168,0.04);border:1px solid rgba(212,160,23,0.08);border-radius:14px;
  transition:background 0.2s}
.eg-co-member:hover{background:rgba(232,213,168,0.08)}
.eg-co-avatar{width:26px;height:26px;border-radius:50%;overflow:hidden;flex-shrink:0;
  border:1.5px solid rgba(212,160,23,0.2);box-shadow:0 0 4px rgba(0,0,0,0.2)}
.eg-co-avatar img{width:100%;height:100%;object-fit:contain;display:block}
.eg-co-mname{font-family:'Cormorant Garamond',serif;font-size:0.82rem;font-weight:600;
  white-space:nowrap;color:rgba(232,213,168,0.75)}

/* Phase preview cards */
.eg-co-phases{display:flex;flex-direction:column;gap:5px;max-width:460px;margin:0 auto 16px}
.eg-co-phase{display:flex;align-items:center;gap:12px;padding:10px 14px;text-align:left;
  background:linear-gradient(135deg,var(--eg-phase-bg),rgba(0,0,0,0.08));
  border:1px solid rgba(212,160,23,0.06);border-radius:3px;
  border-left:3px solid var(--eg-phase-color);
  box-shadow:0 2px 6px rgba(0,0,0,0.12);transition:transform 0.2s,box-shadow 0.2s}
.eg-co-phase:hover{transform:translateX(4px);box-shadow:0 3px 10px rgba(0,0,0,0.2)}
.eg-co-phase-num{font-family:'Metamorphous',cursive;font-size:1.5rem;font-weight:700;
  color:var(--eg-phase-color);line-height:1;min-width:30px;text-align:center;
  text-shadow:0 2px 4px rgba(0,0,0,0.3);opacity:0.6}
.eg-co-phase-body{flex:1}
.eg-co-phase-name{font-family:'Metamorphous',cursive;font-size:0.85rem;font-weight:700;
  letter-spacing:2px;color:var(--eg-phase-color);text-transform:uppercase;margin-bottom:2px}
.eg-co-phase-desc{font-family:'Cormorant Garamond',serif;font-size:0.85rem;color:rgba(232,213,168,0.45);
  line-height:1.4}

/* Stakes bar */
.eg-co-stakes{display:flex;align-items:center;gap:10px;max-width:460px;margin:0 auto 22px;
  padding:8px 14px;background:linear-gradient(135deg,rgba(212,160,23,0.05),rgba(0,0,0,0.1));
  border:1px solid rgba(212,160,23,0.1);border-radius:3px;
  box-shadow:0 2px 6px rgba(0,0,0,0.1)}
.eg-co-stakes-icon{flex-shrink:0;opacity:0.4}
.eg-co-stakes-text{font-family:'Cormorant Garamond',serif;font-size:0.88rem;font-weight:600;
  color:rgba(240,192,48,0.6);text-align:left;line-height:1.4}

/* Launch line */
.eg-co-launch{font-family:'Metamorphous',cursive;font-size:0.95rem;font-weight:700;
  letter-spacing:6px;color:var(--eg-pharaoh-gold);text-transform:uppercase;
  padding:10px 0 4px;position:relative;
  animation:eg-co-launch-glow 3s ease-in-out infinite}
.eg-co-launch::before,.eg-co-launch::after{content:'';position:absolute;top:50%;width:50px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(212,160,23,0.2))}
.eg-co-launch::before{right:calc(50% + 150px)}
.eg-co-launch::after{left:calc(50% + 150px);background:linear-gradient(270deg,transparent,rgba(212,160,23,0.2))}
@keyframes eg-co-launch-glow{0%,100%{opacity:0.35;text-shadow:0 0 0 transparent}50%{opacity:0.7;text-shadow:0 0 20px rgba(240,192,48,0.15)}}

/* Sidebar cold-open stats */
.eg-co-sb-stat{display:flex;justify-content:space-between;align-items:center;padding:3px 0;
  border-bottom:1px solid rgba(212,160,23,0.06);font-family:'Cormorant Garamond',serif;font-size:0.82rem}
.eg-co-sb-stat:last-child{border-bottom:none}
.eg-co-sb-label{color:rgba(232,213,168,0.35);letter-spacing:1px;font-size:0.75rem}
.eg-co-sb-val{color:rgba(232,213,168,0.7);font-weight:700;font-size:0.9rem}

/* Sidebar route visualization */
.eg-co-sb-route{display:flex;align-items:center;justify-content:center;gap:0;padding:6px 0}
.eg-co-sb-route-node{text-align:center;position:relative}
.eg-co-sb-route-dot{width:10px;height:10px;border-radius:50%;margin:0 auto 3px;
  background:var(--rn-color);opacity:0.5;box-shadow:0 0 6px color-mix(in srgb,var(--rn-color) 30%,transparent)}
.eg-co-sb-route-label{font-family:'Metamorphous',cursive;font-size:0.6rem;letter-spacing:1px;
  color:rgba(232,213,168,0.4);text-transform:uppercase}
.eg-co-sb-route-line{width:20px;height:1px;background:rgba(212,160,23,0.15);margin-bottom:12px}

@media(prefers-reduced-motion:reduce){
  .eg-co-eye,.eg-co-hiero,.eg-co-launch,.eg-gold-mote,.eg-co-horizon-glow{animation:none!important;opacity:0.3}
  .eg-co-phase:hover,.eg-co-member:hover{transform:none!important}
}
</style>`;
}


// ══════════════════════════════════════════════════════════════
// SHELL WRAPPER
// ══════════════════════════════════════════════════════════════
function _shell(content, ep, phaseCls = '') {
  window._egData = ep.walkEgypt;
  window._egEp = ep;
  return `${_css()}<div class="eg-shell ${phaseCls}" data-phase="${phaseCls}">
    ${_buildTransition(phaseCls)}
    ${_buildParticles(phaseCls)}
    ${_buildHieroWalkers(phaseCls)}
    <div class="eg-main">${_buildFrieze(phaseCls)}${content}</div>
    <div class="eg-sidebar" id="eg-sidebar">${_buildSidebarContent(ep.walkEgypt, phaseCls)}</div>
  </div>`;
}

function _buildHieroWalkers(phaseCls) {
  let h = '';
  for (let i = 0; i < 6; i++) {
    h += `<div class="eg-hiero-walker eg-walk" style="left:${i * 120 + 20}px;animation-delay:${(i * 1.2).toFixed(1)}s"></div>`;
  }
  return h;
}

function _buildParticles(phaseCls) {
  let h = '';
  if (phaseCls === 'eg-pyramid') {
    for (let i = 0; i < 5; i++) {
      h += `<div class="eg-scarab-particle eg-active" style="left:${10 + i * 18}%;top:${20 + i * 12}%;animation-delay:${(i * 0.8).toFixed(1)}s;animation-duration:${(4 + i * 0.6).toFixed(1)}s"></div>`;
    }
  } else if (phaseCls === 'eg-desert') {
    for (let i = 0; i < 8; i++) {
      h += `<div class="eg-sand-drift" style="left:${Math.random() * 80}%;top:${10 + Math.random() * 70}%;animation-delay:${(i * 0.7).toFixed(1)}s;animation-duration:${(5 + Math.random() * 3).toFixed(1)}s"></div>`;
    }
  } else if (phaseCls === 'eg-nile') {
    for (let i = 0; i < 3; i++) {
      h += `<div class="eg-croc-shadow eg-swim" style="left:${15 + i * 25}%;top:${50 + i * 10}%;animation-delay:${(i * 2.5).toFixed(1)}s;animation-duration:${(7 + i).toFixed(1)}s"></div>`;
    }
  } else if (phaseCls === 'eg-cold-open') {
    for (let i = 0; i < 12; i++) {
      const x = 5 + Math.random() * 85;
      const y = 8 + Math.random() * 80;
      const size = 1.5 + Math.random() * 2;
      const dur = 4 + Math.random() * 5;
      const delay = Math.random() * 6;
      h += `<div class="eg-gold-mote" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:${delay.toFixed(1)}s;animation-duration:${dur.toFixed(1)}s"></div>`;
    }
    h += '<div class="eg-co-pyramid-sil"></div>';
    h += '<div class="eg-co-horizon-glow"></div>';
  }
  return h;
}

function _buildTransition(phaseCls) {
  if (phaseCls === 'eg-desert') return '<div class="eg-transition eg-trans-sandstorm"></div>';
  if (phaseCls === 'eg-nile') return '<div class="eg-transition eg-trans-flood"></div>';
  if (phaseCls === 'eg-winner') return '<div class="eg-transition eg-trans-winner"></div>';
  return '';
}

function _buildFrieze(phaseCls) {
  const readings = FRIEZE_READINGS[phaseCls] || FRIEZE_READINGS[''];
  const figType = FRIEZE_FIGURES[phaseCls] || 'explorer';
  const count = readings.length;
  const cycleDur = count * 5;

  // Walking hieroglyph procession — 6 figures staggered across
  let procHtml = '';
  for (let i = 0; i < 6; i++) {
    const walkDur = 12 + (i * 1.5);
    const delay = i * 2.3;
    const figCls = `eg-fig-${figType}`;
    procHtml += `<div class="eg-hfig ${figCls}" style="--eg-walk-dur:${walkDur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s;color:var(--eg-${phaseCls === 'eg-nile' ? 'nile' : phaseCls === 'eg-desert' ? 'terra' : phaseCls === 'eg-winner' ? 'pharaoh-gold' : 'gold'})">
      <div class="eg-hfig-body"></div>
      <div class="eg-hfig-shadow"></div>
    </div>`;
  }

  // Sand erosion decode readings — glyph → english
  let readHtml = '';
  readings.forEach((r, i) => {
    const delay = (i * cycleDur / count).toFixed(1);
    readHtml += `<div class="eg-frieze-reading" style="--eg-rd-dur:${cycleDur}s;animation-delay:${delay}s">
      <span class="eg-frieze-glyph">${r.glyph}</span>
      <span class="eg-frieze-english">${r.text}</span>
    </div>`;
  });

  // Sand grain particles
  let grainHtml = '';
  for (let i = 0; i < 10; i++) {
    const left = 20 + Math.round(Math.random() * 60);
    const dur = 1.5 + Math.random() * 1.5;
    const delay = Math.random() * cycleDur;
    grainHtml += `<div class="eg-sand-grain" style="left:${left}%;--eg-grain-dur:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"></div>`;
  }

  return `<div class="eg-frieze">
    <div class="eg-frieze-curl-l"></div>
    <div class="eg-frieze-proc">${procHtml}</div>
    <div class="eg-frieze-light"></div>
    <div class="eg-frieze-text">${readHtml}</div>
    <div class="eg-frieze-sand">${grainHtml}</div>
  </div>`;
}


// ══════════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════════
function _buildSidebarContent(data, phase) {
  if (!data) return '<div class="eg-sb-title">NO DATA</div>';
  if (phase === 'eg-cold-open') return _sidebarColdOpen(data);
  if (phase === 'eg-pyramid') return _sidebarPyramid(data);
  if (phase === 'eg-desert') return _sidebarDesert(data);
  if (phase === 'eg-nile') return _sidebarNile(data);
  if (phase === 'eg-winner') return _sidebarResults(data);
  return _sidebarRoster(data);
}

function _sidebarColdOpen(data) {
  const tribes = data.tribes;
  const tribeCount = Object.keys(tribes).length;
  const totalPlayers = Object.values(tribes).reduce((sum, t) => sum + t.members.length, 0);

  let h = '';
  h += `<div class="eg-sb-title" style="color:var(--eg-pharaoh-gold)">EXPEDITION MANIFEST</div>`;

  // Deity patron
  h += `<div style="text-align:center;margin:8px 0 12px">
    <div class="eg-deity eg-deity-ra" style="width:40px;height:55px;opacity:0.5"></div>
    <div style="font-family:Metamorphous,cursive;font-size:0.75rem;color:var(--eg-pharaoh-gold);letter-spacing:2px;opacity:0.6">RA PRESIDES</div>
  </div>`;

  // Mission stats
  h += `<div class="eg-sb-section" style="background:rgba(212,160,23,0.03)">
    <div style="font-family:'Cormorant Garamond',serif;font-size:0.78rem;color:rgba(232,213,168,0.5);letter-spacing:1px;margin-bottom:6px">MISSION OVERVIEW</div>
    <div class="eg-co-sb-stat"><span class="eg-co-sb-label">TEAMS</span><span class="eg-co-sb-val">${tribeCount}</span></div>
    <div class="eg-co-sb-stat"><span class="eg-co-sb-label">CREW</span><span class="eg-co-sb-val">${totalPlayers}</span></div>
    <div class="eg-co-sb-stat"><span class="eg-co-sb-label">PHASES</span><span class="eg-co-sb-val">3</span></div>
    <div class="eg-co-sb-stat"><span class="eg-co-sb-label">SAFE TRIBES</span><span class="eg-co-sb-val" style="color:var(--eg-success)">2</span></div>
    <div class="eg-co-sb-stat"><span class="eg-co-sb-label">TRIBAL</span><span class="eg-co-sb-val" style="color:var(--eg-danger)">1</span></div>
  </div>`;

  // Phase route
  h += `<div class="eg-sb-section" style="background:rgba(212,160,23,0.03)">
    <div style="font-family:'Cormorant Garamond',serif;font-size:0.78rem;color:rgba(232,213,168,0.5);letter-spacing:1px;margin-bottom:6px">EXPEDITION ROUTE</div>
    <div class="eg-co-sb-route">
      <div class="eg-co-sb-route-node" style="--rn-color:var(--eg-torch)"><div class="eg-co-sb-route-dot"></div><div class="eg-co-sb-route-label">PYRAMID</div></div>
      <div class="eg-co-sb-route-line"></div>
      <div class="eg-co-sb-route-node" style="--rn-color:var(--eg-terra)"><div class="eg-co-sb-route-dot"></div><div class="eg-co-sb-route-label">DESERT</div></div>
      <div class="eg-co-sb-route-line"></div>
      <div class="eg-co-sb-route-node" style="--rn-color:var(--eg-nile)"><div class="eg-co-sb-route-dot"></div><div class="eg-co-sb-route-label">NILE</div></div>
    </div>
  </div>`;

  // Coordinates
  h += `<div style="text-align:center;margin:8px 0 4px">
    <div style="font-family:'Cormorant Garamond',serif;font-size:0.7rem;color:rgba(232,213,168,0.25);letter-spacing:2px">29.9792° N, 31.1342° E</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:0.65rem;color:rgba(232,213,168,0.18);letter-spacing:1px;margin-top:2px">GIZA PLATEAU — SECTOR 7</div>
  </div>`;

  return h;
}

function _sidebarRoster(data) {
  const tribes = data.tribes;
  let h = '<div class="eg-sb-title">EXPEDITION ROSTER</div>';
  Object.entries(tribes).forEach(([tName, tData]) => {
    h += `<div class="eg-sb-section"><div style="font-family:Metamorphous,cursive;font-size:0.88rem;font-weight:700;color:var(--eg-terra);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;text-shadow:0 1px 0 rgba(0,0,0,0.1)">${tName}</div>`;
    tData.members.forEach(n => {
      const sl = slug(n);
      h += `<div class="eg-sb-row"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="eg-sb-name">${n}</span><span class="eg-sb-tag eg-t-gold">CREW</span></div>`;
    });
    h += '</div>';
  });
  return h;
}

function _buildHourglass(pct) {
  const topH = Math.max(0, 100 - pct);
  const botH = pct;
  return `<div class="eg-hourglass"><div class="eg-hourglass-top" style="height:${topH}%"></div><div class="eg-hourglass-bot" style="height:${botH}%"></div></div>`;
}

function _sidebarPyramid(data) {
  const st = _tvState['eg-pyramid'];
  const revIdx = st ? st.idx : -1;
  const choices = data.phase1.choices || [];
  const socialEvents = data.phase1.socialEvents || [];
  const deityJudgments = data.phase1.deityJudgments || [];
  const overTotal = choices.filter(c => c.path === 'over').length;
  const underTotal = choices.filter(c => c.path === 'under').length;

  // Reconstruct interleaved order to map revIdx to player cards
  const extras = [...socialEvents.map(e => ({ kind: 'social' })), ...deityJudgments.map(d => ({ kind: 'deity' }))];
  const spacing = extras.length > 0 ? Math.max(2, Math.floor(choices.length / (extras.length + 1))) : Infinity;
  const interleaved = [];
  let eIdx = 0;
  choices.forEach((c, i) => {
    interleaved.push({ kind: 'player', choice: c, choiceIdx: i });
    if (eIdx < extras.length && (i + 1) % spacing === 0 && i < choices.length - 1) {
      interleaved.push(extras[eIdx++]);
    }
  });
  while (eIdx < extras.length) interleaved.push(extras[eIdx++]);

  // Figure out which player choices have been revealed
  const revealedChoices = [];
  interleaved.forEach((item, i) => {
    if (i <= revIdx && item.kind === 'player') revealedChoices.push(item.choice);
  });
  const overRevealed = revealedChoices.filter(c => c.path === 'over');
  const underRevealed = revealedChoices.filter(c => c.path === 'under');

  let h = '<div class="eg-sb-title">PYRAMID STATUS</div>';

  // Pyramid cross-section with positioned dots
  h += '<div class="eg-pyramid-tracker">';
  choices.forEach((c, ci) => {
    const isRevealed = revealedChoices.includes(c);
    const isOver = c.path === 'over';
    const dotCls = isRevealed ? (isOver ? 'eg-over-dot' : 'eg-under-dot') : 'eg-hidden-dot';
    const x = isOver ? (20 + (ci % 4) * 15) : (25 + (ci % 3) * 20);
    const y = isOver ? (5 + (ci % 3) * 8) : (45 + (ci % 3) * 12);
    h += `<div class="eg-pyr-dot ${dotCls}" style="left:${x}%;top:${y}%" title="${isRevealed ? c.name + ' (' + c.path.toUpperCase() + ')' : '???'}"></div>`;
  });
  h += '</div>';

  // Path split stats
  h += `<div class="eg-sb-section">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <div style="text-align:center;flex:1">
        <div style="font-family:Metamorphous,cursive;font-size:0.7rem;letter-spacing:1px;color:var(--eg-torch);margin-bottom:2px">${_icon('climb')} OVER</div>
        <div style="font-family:Cormorant Garamond,serif;font-size:1.1rem;font-weight:700;color:#E8D5A8">${overRevealed.length}<span style="font-size:0.75rem;opacity:0.4">/${overTotal}</span></div>
      </div>
      <div style="width:1px;background:rgba(255,153,68,0.1)"></div>
      <div style="text-align:center;flex:1">
        <div style="font-family:Metamorphous,cursive;font-size:0.7rem;letter-spacing:1px;color:var(--eg-scarab);margin-bottom:2px">${_icon('door')} UNDER</div>
        <div style="font-family:Cormorant Garamond,serif;font-size:1.1rem;font-weight:700;color:#E8D5A8">${underRevealed.length}<span style="font-size:0.75rem;opacity:0.4">/${underTotal}</span></div>
      </div>
    </div>
  </div>`;

  // Depth gauge
  const depthPct = Math.min(100, revIdx >= 0 ? ((revIdx + 1) / interleaved.length * 100) : 0);
  h += `<div class="eg-sb-section">
    <div style="font-family:Cormorant Garamond,serif;font-size:0.75rem;color:rgba(232,213,168,0.4);letter-spacing:1px;margin-bottom:4px">DEPTH PROGRESS</div>
    <div class="eg-bar-wrap"><div class="eg-bar eg-orange" style="width:${depthPct}%"></div></div>
    <div style="font-family:Cormorant Garamond,serif;font-size:0.72rem;color:rgba(232,213,168,0.3);margin-top:2px;text-align:right">${Math.round(depthPct)}%</div>
  </div>`;

  // Explorer list
  h += '<div class="eg-sb-section"><div style="font-family:Cormorant Garamond,serif;font-size:0.75rem;color:rgba(232,213,168,0.4);letter-spacing:1px;margin-bottom:4px">EXPLORERS</div>';
  choices.forEach(c => {
    const sl = slug(c.name);
    const isRevealed = revealedChoices.includes(c);
    if (isRevealed) {
      const pathTag = c.path === 'over'
        ? '<span class="eg-sb-tag eg-t-orange">OVER</span>'
        : '<span class="eg-sb-tag eg-t-green">UNDER</span>';
      const scoreTag = `<span style="font-family:Cormorant Garamond,serif;font-size:0.72rem;color:rgba(232,213,168,0.4)">${Math.round((c.score || 0) * 10) / 10}</span>`;
      h += `<div class="eg-sb-row"><img src="assets/avatars/${sl}.png" alt="${c.name}" onerror="this.style.display='none'"><span class="eg-sb-name">${c.name}</span>${scoreTag}${pathTag}</div>`;
    } else {
      h += `<div class="eg-sb-row" style="opacity:0.4"><img src="assets/avatars/${sl}.png" alt="${c.name}" onerror="this.style.display='none'" style="filter:brightness(0.5)"><span class="eg-sb-name">${c.name}</span><span class="eg-sb-tag eg-t-grey">???</span></div>`;
    }
  });
  h += '</div>';
  return h;
}

function _sidebarDesert(data) {
  const st = _tvState['eg-desert'];
  const revIdx = st ? st.idx : -1;
  let h = '<div class="eg-sb-title">CARAVAN STATUS</div>';

  // Journey progress bar
  const navBeats = data.phase2.navBeats || [];
  const revealedNavs = navBeats.filter((_, i) => i <= revIdx);
  const onCourse = revealedNavs.filter(n => n.success).length;
  const offCourse = revealedNavs.filter(n => !n.success).length;
  const journeyPct = Math.min(100, revIdx >= 0 ? ((revIdx + 1) / Math.max(1, navBeats.length + Object.keys(data.tribes).length + 1) * 100) : 0);
  h += `<div class="eg-sb-section">
    <div style="font-family:Cormorant Garamond,serif;font-size:0.75rem;color:rgba(232,213,168,0.4);letter-spacing:1px;margin-bottom:4px">JOURNEY PROGRESS</div>
    <div class="eg-bar-wrap"><div class="eg-bar eg-orange" style="width:${journeyPct}%"></div></div>
    <div style="display:flex;justify-content:space-between;margin-top:4px">
      <span style="font-family:Cormorant Garamond,serif;font-size:0.68rem;color:var(--eg-success)">${_icon('navigate')} ${onCourse} on course</span>
      <span style="font-family:Cormorant Garamond,serif;font-size:0.68rem;color:var(--eg-danger)">${_icon('sand')} ${offCourse} lost</span>
    </div>
  </div>`;

  // Tribe caravans
  Object.entries(data.tribes).forEach(([tName, tData]) => {
    const reward = tData.reward || 'stick';
    const rewardIcon = reward === 'camel' ? _icon('camel') : reward === 'goat' ? _icon('camel') : _icon('stick');
    const tagCls = reward === 'stick' ? 'eg-t-gold' : reward === 'goat' ? 'eg-t-orange' : 'eg-t-grey';
    const borderColor = reward === 'stick' ? 'var(--eg-pharaoh-gold)' : reward === 'goat' ? 'var(--eg-terra)' : 'rgba(138,122,90,0.3)';

    h += `<div class="eg-sb-section" style="border-left:2px solid ${borderColor};padding-left:8px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        ${rewardIcon}
        <span style="font-family:Metamorphous,cursive;font-size:0.82rem;font-weight:700;color:var(--eg-terra);letter-spacing:1px">${tName}</span>
        <span class="eg-sb-tag ${tagCls}" style="margin-left:auto;font-size:0.62rem">${reward.toUpperCase()}</span>
      </div>`;

    // Navigator
    const leader = data.phase2.leaders?.[tName];
    if (leader && revIdx >= 0) {
      const navSl = slug(leader.navigator);
      h += `<div class="eg-sb-row" style="margin-top:2px">
        <img src="assets/avatars/${navSl}.png" alt="${leader.navigator}" onerror="this.style.display='none'">
        <span class="eg-sb-name">${leader.navigator}</span>
        <span style="font-family:Cormorant Garamond,serif;font-size:0.65rem;color:rgba(232,213,168,0.4);letter-spacing:0.5px">NAV</span>
      </div>`;
    }
    h += '</div>';
  });

  // Scarab threat
  const scarabs = data.phase2.scarabSwarm || [];
  const revealedScarabs = scarabs.filter((_, i) => {
    const scarabStart = 1 + Object.keys(data.tribes).length + navBeats.length;
    return (scarabStart + i) <= revIdx;
  }).length;
  if (revealedScarabs > 0) {
    h += `<div class="eg-sb-section">
      <div style="font-family:Cormorant Garamond,serif;font-size:0.75rem;color:rgba(232,213,168,0.4);letter-spacing:1px;margin-bottom:3px">SCARAB SWARMS</div>
      <div style="font-family:Cormorant Garamond,serif;font-size:0.85rem;color:var(--eg-danger)">${_icon('scarab')} ${revealedScarabs} encounter${revealedScarabs !== 1 ? 's' : ''}</div>
    </div>`;
  }

  // Stick lost warning
  if (data.phase2.stickLost && revIdx >= 3) {
    h += `<div style="font-family:Cormorant Garamond,serif;font-size:0.78rem;color:var(--eg-danger);margin-top:6px;font-style:italic;padding:4px 6px;border:1px solid rgba(220,50,50,0.15);border-radius:3px;background:rgba(220,50,50,0.04)">${_icon('alert')} Divining rod lost!</div>`;
  }
  return h;
}

function _sidebarNile(data) {
  const st = _tvState['eg-nile'];
  const revIdx = st ? st.idx : -1;
  let h = '<div class="eg-sb-title">NILE CROSSING</div>';

  // Crossing progress
  const p3 = data.phase3;
  const totalSteps = (p3.weaving?.length || 0) + (p3.animalLoading?.length || 0) + (p3.rowingBeats?.length || 0) + (p3.crocAttacks?.length || 0) + (p3.socialEvents?.length || 0) + (p3.deityJudgments?.length || 0) + (p3.finalSprint?.length || 0);
  const crossPct = Math.min(100, revIdx >= 0 ? ((revIdx + 1) / Math.max(1, totalSteps) * 100) : 0);
  h += `<div class="eg-sb-section">
    <div style="font-family:Cormorant Garamond,serif;font-size:0.75rem;color:rgba(232,213,168,0.4);letter-spacing:1px;margin-bottom:4px">CROSSING PROGRESS</div>
    <div class="eg-bar-wrap"><div class="eg-bar eg-nile-bar" style="width:${crossPct}%;background:linear-gradient(90deg,var(--eg-nile),#4A8B6F)"></div></div>
    <div style="font-family:Cormorant Garamond,serif;font-size:0.72rem;color:rgba(232,213,168,0.3);margin-top:2px;text-align:right">${Math.round(crossPct)}%</div>
  </div>`;

  // Phase indicator — what stage are we in
  const weaveCt = p3.weaving?.length || 0;
  const loadCt = p3.animalLoading?.length || 0;
  const rowCt = p3.rowingBeats?.length || 0;
  let currentPhase = 'WEAVING';
  if (revIdx >= weaveCt + loadCt + rowCt) currentPhase = 'SPRINT';
  else if (revIdx >= weaveCt + loadCt) currentPhase = 'ROWING';
  else if (revIdx >= weaveCt) currentPhase = 'LOADING';
  const phaseSteps = ['WEAVING', 'LOADING', 'ROWING', 'SPRINT'];
  h += `<div class="eg-sb-section">
    <div style="display:flex;gap:2px;margin-bottom:6px">${phaseSteps.map(ps => {
      const isCurrent = ps === currentPhase && revIdx >= 0;
      const isPast = phaseSteps.indexOf(ps) < phaseSteps.indexOf(currentPhase) && revIdx >= 0;
      const color = isCurrent ? 'var(--eg-nile)' : isPast ? 'rgba(78,157,116,0.4)' : 'rgba(138,122,90,0.15)';
      return `<div style="flex:1;height:3px;border-radius:2px;background:${color}"></div>`;
    }).join('')}</div>
    ${revIdx >= 0 ? `<div style="font-family:Metamorphous,cursive;font-size:0.65rem;letter-spacing:2px;color:var(--eg-nile);text-align:center">${currentPhase}</div>` : ''}
  </div>`;

  // Tribe boats
  Object.entries(data.tribes).forEach(([tName, tData]) => {
    const bq = tData.boatQuality || 0;
    const bd = tData.boatDamage || 0;
    const integrity = Math.max(0, Math.min(100, Math.round((bq - bd) / Math.max(1, bq) * 100)));
    const barCls = integrity > 60 ? 'eg-green' : integrity > 30 ? 'eg-orange' : 'eg-red';
    const statusLabel = integrity > 60 ? 'SEAWORTHY' : integrity > 30 ? 'DAMAGED' : 'SINKING';
    const statusColor = integrity > 60 ? 'var(--eg-success)' : integrity > 30 ? 'var(--eg-terra)' : 'var(--eg-danger)';

    h += `<div class="eg-sb-section" style="border-left:2px solid ${statusColor};padding-left:8px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        ${_icon('boat')}
        <span style="font-family:Metamorphous,cursive;font-size:0.82rem;font-weight:700;color:#E8D5A8;letter-spacing:1px">${tName}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <div style="flex:1"><div class="eg-bar-wrap"><div class="eg-bar ${barCls}" style="width:${integrity}%"></div></div></div>
        <span style="font-family:Cormorant Garamond,serif;font-size:0.65rem;color:${statusColor};letter-spacing:0.5px">${statusLabel}</span>
      </div>
    </div>`;
  });

  // Croc attack tracker
  const crocAttacks = p3.crocAttacks || [];
  const revealedCrocs = crocAttacks.filter((_, ci) => {
    const crocStart = weaveCt + loadCt + rowCt;
    return (crocStart + ci) <= revIdx;
  }).length;
  h += `<div class="eg-sb-section">
    <div style="font-family:Cormorant Garamond,serif;font-size:0.75rem;color:rgba(232,213,168,0.4);letter-spacing:1px;margin-bottom:3px">CROC ATTACKS</div>
    <div style="display:flex;align-items:center;gap:6px">
      ${_icon('croc')}
      <span style="font-family:Cormorant Garamond,serif;font-size:1rem;font-weight:700;color:${revealedCrocs > 0 ? 'var(--eg-danger)' : 'rgba(232,213,168,0.3)'}">${revealedCrocs}</span>
      <span style="font-family:Cormorant Garamond,serif;font-size:0.7rem;color:rgba(232,213,168,0.3)">/ ${crocAttacks.length} total</span>
    </div>
  </div>`;

  return h;
}

function _sidebarResults(data) {
  const finishOrder = data.tribeFinishOrder || [];
  let h = '<div class="eg-sb-title">FINAL STANDINGS</div>';

  // Deity blessing
  h += `<div style="text-align:center;margin:6px 0 10px">
    <div class="eg-deity eg-deity-ra" style="width:36px;height:48px;margin:0 auto 4px;opacity:0.35"></div>
    <div style="font-family:Metamorphous,cursive;font-size:0.65rem;letter-spacing:2px;color:var(--eg-pharaoh-gold);opacity:0.5">JUDGMENT RENDERED</div>
  </div>`;

  // Tribe standings with visual hierarchy
  finishOrder.forEach((tName, i) => {
    const isFirst = i === 0;
    const isLast = i === finishOrder.length - 1;
    const tag = isFirst ? '<span class="eg-sb-tag eg-t-gold">IMMUNE</span>'
      : isLast ? '<span class="eg-sb-tag eg-t-red">TRIBAL</span>'
      : '<span class="eg-sb-tag eg-t-green">SAFE</span>';
    const accentColor = isFirst ? 'rgba(212,160,23,0.15)' : isLast ? 'rgba(192,32,32,0.08)' : 'rgba(34,139,34,0.06)';
    const borderColor = isFirst ? 'rgba(212,160,23,0.3)' : isLast ? 'rgba(192,32,32,0.2)' : 'rgba(34,139,34,0.15)';
    const tribeScore = Math.round((data.tribes[tName]?.totalScore || 0) * 10) / 10;

    h += `<div class="eg-sb-section" style="background:${accentColor};border-left:2px solid ${borderColor};padding:6px 8px;margin:6px 0">
      <div class="eg-sb-row" style="border-bottom:none"><span class="eg-sb-name" style="font-weight:700;font-family:Metamorphous,cursive;font-size:0.82rem;letter-spacing:1px">#${i + 1} ${tName}</span>${tag}</div>
      <div style="font-family:Cormorant Garamond,serif;font-size:0.72rem;color:var(--eg-muted);margin:2px 0 4px">${tribeScore} pts</div>`;
    const members = data.tribes[tName]?.members || [];
    members.forEach(n => {
      const sl = slug(n);
      h += `<div class="eg-sb-row" style="margin-left:4px;border-bottom-color:rgba(194,166,69,0.04)"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="eg-sb-name">${n}</span></div>`;
    });
    h += '</div>';
  });

  // Expedition stats
  h += `<div style="text-align:center;margin:8px 0 4px">
    <div style="font-family:Cormorant Garamond,serif;font-size:0.65rem;color:rgba(232,213,168,0.2);letter-spacing:2px">EXPEDITION COMPLETE</div>
  </div>`;

  return h;
}


// ══════════════════════════════════════════════════════════════
// SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildEgyptTitleCard(ep) {
  const data = ep.walkEgypt;
  if (!data) return '<div>No challenge data</div>';

  const h = host();
  const tribes = Object.entries(data.tribes);

  const tribeBlocks = tribes.map(([tName, tData], ti) => {
    const accentColor = ti === 0 ? 'var(--eg-torch)' : ti === 1 ? 'var(--eg-nile)' : 'var(--eg-scarab)';
    const members = tData.members.map(n => {
      const sl = slug(n);
      return `<div class="eg-co-member">
        <div class="eg-co-avatar"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"></div>
        <div class="eg-co-mname">${n}</div>
      </div>`;
    }).join('');
    return `<div class="eg-co-tribe" style="--eg-tribe-accent:${accentColor}">
      <div class="eg-co-tribe-header">
        <div class="eg-co-tribe-line"></div>
        <div class="eg-co-tribe-name">${tName}</div>
        <div class="eg-co-tribe-line"></div>
      </div>
      <div class="eg-co-members">${members}</div>
    </div>`;
  }).join('');

  const phases = [
    { num: 'I', name: 'THE PYRAMID', desc: 'Scale the summit or crawl through the tombs', color: 'var(--eg-torch)', bg: 'rgba(255,153,68,0.08)', iconCls: 'eg-icon-climb' },
    { num: 'II', name: 'THE DESERT', desc: 'Navigate the dunes with camel, goat, or stick', color: 'var(--eg-terra)', bg: 'rgba(192,72,32,0.06)', iconCls: 'eg-icon-navigate' },
    { num: 'III', name: 'THE NILE', desc: 'Build a reed boat and cross crocodile waters', color: 'var(--eg-nile)', bg: 'rgba(0,160,160,0.06)', iconCls: 'eg-icon-croc' },
  ];
  const phaseCards = phases.map(p => `<div class="eg-co-phase" style="--eg-phase-color:${p.color};--eg-phase-bg:${p.bg}">
    <div class="eg-co-phase-num">${p.num}</div>
    <div class="eg-co-phase-body">
      <div class="eg-co-phase-name">${p.name}</div>
      <div class="eg-co-phase-desc">${p.desc}</div>
    </div>
    <span class="eg-icon ${p.iconCls}" style="margin:0;opacity:0.5"></span>
  </div>`).join('');

  const content = `
    <div class="eg-co-wrap">
      <div class="eg-co-eye"><div class="eg-co-eye-inner"></div></div>
      <div class="eg-co-presents">${h.toUpperCase()} McLEAN PRESENTS</div>
      <div class="eg-co-title-block">
        <div class="eg-co-hiero">𓂀𓊪𓇋𓈖𓏏 𓃭𓇋𓎛 𓊖𓈖 𓂧𓇳𓏏𓎼</div>
        <div class="eg-co-title">WALK LIKE AN<br>EGYPTIAN</div>
        <div class="eg-co-stripe"></div>
        <div class="eg-co-subtitle">IMMUNITY CHALLENGE</div>
      </div>
      <div class="eg-co-tagline">"Three phases. Two safe tribes. One torch snuffed."</div>
      <div class="eg-co-host-card">
        <div class="eg-co-host-badge">${h.toUpperCase()}</div>
        <div class="eg-co-host-text">${data.hostLines?.intro || ''}</div>
      </div>
      <div class="eg-co-section-label">EXPEDITION TEAMS</div>
      <div class="eg-co-tribes">${tribeBlocks}</div>
      <div class="eg-co-section-label" style="margin-top:20px">THE GAUNTLET</div>
      <div class="eg-co-phases">${phaseCards}</div>
      <div class="eg-co-stakes">
        <div class="eg-co-stakes-icon"><span class="eg-icon eg-icon-summit" style="margin:0"></span></div>
        <div class="eg-co-stakes-text">First tribe across the Nile wins immunity. Last tribe faces tribal council.</div>
      </div>
      <div class="eg-co-launch">THE EXPEDITION BEGINS</div>
    </div>`;

  if (!window._egScreenBuilders) window._egScreenBuilders = {};
  window._egScreenBuilders['eg-title'] = rpBuildEgyptTitleCard;
  return _shell(content, ep, 'eg-cold-open');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 2: PYRAMID OVER/UNDER
// ══════════════════════════════════════════════════════════════
export function rpBuildEgyptPyramid(ep) {
  const data = ep.walkEgypt;
  if (!data?.phase1) return '';
  const p1 = data.phase1;
  const choices = p1.choices || [];
  const socialEvents = p1.socialEvents || [];
  const deityJudgments = p1.deityJudgments || [];

  // Interleave social events and deity judgments between player cards
  // Distribute them evenly: after every N player cards, insert a social/deity card
  const interleaved = [];
  const extras = [...socialEvents.map(e => ({ kind: 'social', data: e })), ...deityJudgments.map(d => ({ kind: 'deity', data: d }))];
  const spacing = extras.length > 0 ? Math.max(2, Math.floor(choices.length / (extras.length + 1))) : Infinity;
  let extraIdx = 0;

  choices.forEach((c, i) => {
    interleaved.push({ kind: 'player', data: c, playerIdx: i });
    // After every `spacing` player cards, inject the next social/deity event
    if (extraIdx < extras.length && (i + 1) % spacing === 0 && i < choices.length - 1) {
      interleaved.push(extras[extraIdx++]);
    }
  });
  // Append any remaining extras
  while (extraIdx < extras.length) interleaved.push(extras[extraIdx++]);

  const total = interleaved.length;
  const st = _ensureState('eg-pyramid', total);

  let cards = '';

  // Phase header with torch icon and path split
  const overCount = choices.filter(c => c.path === 'over').length;
  const underCount = choices.filter(c => c.path === 'under').length;
  cards += `<div style="text-align:center;margin-bottom:6px">
    <div class="eg-h2" style="text-align:center;border-bottom:none;padding-bottom:0;margin-bottom:4px">
      ${_icon('climb')} Phase 1: The Pyramid ${_icon('door')}
    </div>
    <div style="display:flex;justify-content:center;gap:16px;margin:6px 0 10px">
      <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:2px;color:var(--eg-torch);padding:2px 10px;border:1px solid rgba(255,153,68,0.2);border-radius:2px;background:rgba(255,153,68,0.06)">${overCount} OVER</span>
      <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:2px;color:var(--eg-scarab);padding:2px 10px;border:1px solid rgba(45,139,87,0.2);border-radius:2px;background:rgba(45,139,87,0.06)">${underCount} UNDER</span>
    </div>
  </div>`;
  cards += `<div class="eg-host">${data.hostLines?.phase1 || ''}</div>`;
  cards += `<div class="eg-comm">${pick(COMM_CHATTER['eg-pyramid'])}</div>`;

  let playerCardCount = 0;
  interleaved.forEach((item, i) => {
    const vis = st.idx >= i ? 'eg-visible' : '';

    if (item.kind === 'player') {
      const c = item.data;
      playerCardCount++;
      const pathCls = c.path === 'over' ? 'eg-over' : 'eg-under';
      const pathIcon = c.path === 'over' ? _icon('climb') : _icon('door');
      const pathLabel = c.path === 'over' ? 'SUMMIT PATH' : 'TUNNEL PATH';
      const pathColor = c.path === 'over' ? 'var(--eg-torch)' : 'var(--eg-scarab)';

      let detail = '';
      if (c.path === 'over') {
        const match = (p1.overBeats || []).find(b => b.name === c.name);
        if (match) (match.beats || []).forEach(b => {
          const bIcon = b.method === 'surf_collision' ? _icon('collision') : b.method?.startsWith('surf') ? _icon('surf') : _icon('climb');
          detail += `<div class="eg-pyr-beat">${bIcon} ${b.text}</div>`;
        });
        if (c.summitView) detail += `<div class="eg-pyr-beat eg-pyr-beat-gold">${_icon('summit')} Summit view acquired — shortcut spotted for Phase 2!</div>`;
      } else {
        const match = (p1.underBeats || []).find(b => b.name === c.name);
        if (match) (match.beats || []).forEach(b => {
          const beatIcon = b.type === 'door' ? _icon('door') : b.type?.includes('scarab') ? _icon('scarab') : b.type?.includes('mummy') ? _icon('mummy') : b.type?.includes('collapse') ? _icon('alert') : _icon('trap');
          detail += `<div class="eg-pyr-beat">${beatIcon} ${b.text}</div>`;
        });
      }

      if (p1.mummifiedDog && p1.mummifiedDog.player === c.name) {
        detail += `<div class="eg-card eg-curse" style="margin-top:6px">${_icon('curse')} ${p1.mummifiedDog.text || `${c.name} discovered the Mummified Dog. The curse takes hold...`}</div>`;
      }

      const scoreDisplay = Math.round((c.score || 0) * 10) / 10;
      const scorePct = Math.min(100, Math.max(5, (c.score || 0) * 10));
      const barCls = scorePct > 60 ? 'eg-orange' : scorePct > 30 ? 'eg-gold' : 'eg-red';

      cards += `<div class="eg-step ${vis}"><div class="eg-card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${_cartouche(c.name, pathCls, '', c.tribe)}
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
              ${pathIcon}
              <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:2px;color:${pathColor}">${pathLabel}</span>
              <span style="font-family:Cormorant Garamond,serif;font-size:0.85rem;color:var(--eg-muted);margin-left:auto">${scoreDisplay} pts</span>
            </div>
            <div class="eg-bar-wrap"><div class="eg-bar ${barCls}" style="width:${scorePct}%"></div></div>
          </div>
        </div>
        ${detail}
      </div></div>`;

      // Interleave comm chatter every 3rd player card
      if (playerCardCount > 0 && playerCardCount % 3 === 0 && i < interleaved.length - 1) {
        cards += `<div class="eg-step ${vis}"><div class="eg-comm">${pick(COMM_CHATTER['eg-pyramid'])}</div></div>`;
      }
    } else if (item.kind === 'social') {
      const evt = item.data;
      const iconType = evt.type === 'trapBuddy' ? 'hero' : evt.type === 'summitTaunt' ? 'villain' : evt.type === 'mummyPanic' ? 'mummy' : evt.type === 'encourage' ? 'heart' : evt.type === 'samePath' ? 'climb' : evt.type === 'overRivalry' ? 'collision' : evt.type === 'surfCollision' ? 'collision' : evt.type === 'underAlliance' ? 'bond' : evt.type === 'respect' ? 'summit' : 'collision';
      const evtLabel = evt.type.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
      const evtTc = evt.tribe ? tribeColor(evt.tribe) : '';
      const isCrossTribe = ['samePath', 'overRivalry', 'surfCollision', 'underAlliance', 'respect'].includes(evt.type);
      cards += `<div class="eg-step ${vis}"><div class="eg-card eg-social" ${evt.tribe && !isCrossTribe ? `style="border-left:3px solid ${evtTc}"` : ''}>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${_icon(iconType)}
          <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:1px;color:var(--eg-torch);opacity:0.6">${evtLabel}</span>
          ${evt.tribe && !isCrossTribe ? _tribeBadge(evt.tribe) : ''}
          ${isCrossTribe ? '<span style="font-family:Metamorphous,cursive;font-size:0.55rem;letter-spacing:1.5px;padding:1px 6px;border-radius:2px;background:rgba(255,153,68,0.1);color:var(--eg-torch);border:1px solid rgba(255,153,68,0.2);white-space:nowrap">CROSS-TRIBE</span>' : ''}
        </div>
        ${evt.players?.length ? _playerChips(evt.players, isCrossTribe ? null : evt.tribe) : ''}
        <div style="font-size:0.95rem;line-height:1.5">${evt.text}</div>
      </div></div>`;
    } else if (item.kind === 'deity') {
      const dj = item.data;
      cards += `<div class="eg-step ${vis}"><div class="eg-card eg-deity-card">
        <div class="eg-deity-entrance">
          <div class="eg-deity eg-deity-${dj.deity}" style="width:40px;height:54px"></div>
          <div class="eg-deity-name">${dj.deity.toUpperCase()}</div>
          <div class="eg-deity-title">${dj.blessed ? 'Grants Blessing' : 'Passes Judgment'}</div>
        </div>
        <div style="margin-top:6px;font-size:0.95rem;font-style:italic;line-height:1.5">${dj.text}</div>
      </div></div>`;
    }
  });

  // Reveal bar
  cards += `<div class="eg-reveal-bar">
    <button class="eg-btn" onclick="egyptRevealNext('eg-pyramid',${total})">NEXT ▶</button>
    <span style="font-family:Metamorphous,cursive;font-size:0.9rem;color:var(--eg-gold)" id="eg-counter-eg-pyramid">0/${total}</span>
    <button class="eg-btn eg-btn-terra" onclick="egyptRevealAll('eg-pyramid',${total})">REVEAL ALL ⏩</button>
  </div>`;

  if (!window._egScreenBuilders) window._egScreenBuilders = {};
  window._egScreenBuilders['eg-pyramid'] = rpBuildEgyptPyramid;
  return _shell(`<div data-screen-key="eg-pyramid">${cards}</div>`, ep, 'eg-pyramid');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 3: DESERT TREK
// ══════════════════════════════════════════════════════════════
export function rpBuildEgyptDesert(ep) {
  const data = ep.walkEgypt;
  if (!data?.phase2) return '';
  const p2 = data.phase2;

  const allSteps = [];
  allSteps.push({ type: 'reward', text: '' });
  (p2.reactions || []).forEach(rx => allSteps.push({ type: 'reaction', data: rx }));
  Object.entries(p2.leaders || {}).forEach(([tName, leader]) => {
    allSteps.push({ type: 'leader', tribe: tName, data: leader });
  });
  (p2.navBeats || []).forEach(nb => allSteps.push({ type: 'nav', data: nb }));
  (p2.encounters || []).forEach(en => allSteps.push({ type: 'encounter', data: en }));
  (p2.scarabSwarm || []).forEach(sw => allSteps.push({ type: 'scarab', data: sw }));
  (p2.socialEvents || []).forEach(se => allSteps.push({ type: 'social', data: se }));
  (p2.deityJudgments || []).forEach(dj => allSteps.push({ type: 'deity', data: dj }));

  const total = allSteps.length;
  const st = _ensureState('eg-desert', total);

  let cards = '';

  // Phase header with caravan info
  const tribeEntries = Object.entries(data.tribes);
  const rewardSummary = tribeEntries.map(([tName, tData]) => {
    const r = tData.reward || 'stick';
    const color = r === 'stick' ? 'var(--eg-pharaoh-gold)' : r === 'goat' ? 'var(--eg-terra)' : 'var(--eg-muted)';
    return `<span style="font-family:Metamorphous,cursive;font-size:0.7rem;letter-spacing:1px;color:${color};padding:2px 8px;border:1px solid ${color === 'var(--eg-muted)' ? 'rgba(138,122,90,0.2)' : color};border-radius:2px;opacity:0.7;background:rgba(0,0,0,0.05)">${tName}: ${r.toUpperCase()}</span>`;
  }).join(' ');

  cards += `<div style="text-align:center;margin-bottom:6px">
    <div class="eg-h2" style="text-align:center;border-bottom:none;padding-bottom:0;margin-bottom:4px">
      ${_icon('navigate')} Phase 2: The Desert ${_icon('sand')}
    </div>
    <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:6px 0 10px">${rewardSummary}</div>
  </div>`;
  cards += `<div class="eg-host">${data.hostLines?.phase2 || ''}</div>`;
  cards += `<div class="eg-comm">${pick(COMM_CHATTER['eg-desert'])}</div>`;

  let navCount = 0;
  allSteps.forEach((step, i) => {
    const vis = st.idx >= i ? 'eg-visible' : '';
    let cardContent = '';

    if (step.type === 'reward') {
      let rewardCards = tribeEntries.map(([tName, tData]) => {
        const r = tData.reward || 'stick';
        const icon = _icon(r === 'stick' ? 'stick' : 'camel');
        const tagCls = r === 'stick' ? 'eg-t-gold' : r === 'goat' ? 'eg-t-orange' : 'eg-t-grey';
        return `<div style="display:flex;align-items:center;gap:8px;margin:5px 0">
          ${icon}<span style="font-family:Metamorphous,cursive;font-size:0.88rem;font-weight:700;letter-spacing:1px">${tName}</span>
          <span class="eg-sb-tag ${tagCls}" style="margin-left:auto">${r.toUpperCase()}</span>
        </div>`;
      }).join('');
      cardContent = `<div class="eg-card"><div class="eg-h3" style="margin-top:0">Caravan Assignment</div>${rewardCards}</div>`;
    } else if (step.type === 'leader') {
      const l = step.data;
      const ltc = tribeColor(step.tribe);
      // For challenge beats, show original navigator + challenger (l.beat.navigator captured pre-swap).
      // For uncontested selections, just the navigator.
      const leaderNames = l.beat?.challenger
        ? [l.beat.navigator, l.beat.challenger]
        : [l.navigator];
      cardContent = `<div class="eg-card" style="border-left:3px solid ${ltc}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${_icon('navigate')}
          <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:2px;color:${ltc}">NAVIGATOR</span>
          ${_tribeBadge(step.tribe)}
        </div>
        ${_playerChips(leaderNames, step.tribe)}
        <div style="font-size:0.95rem;line-height:1.5">${l.beat?.text || `${l.navigator} takes the lead for ${step.tribe}.`}</div>
      </div>`;
    } else if (step.type === 'nav') {
      navCount++;
      const nb = step.data;
      const ntc = tribeColor(nb.tribe);
      const isGood = nb.success === 'good';
      const isLost = nb.success === 'lost';
      const icon = isGood ? _icon('navigate') : _icon('sand');
      const statusLabel = isGood ? 'ON COURSE' : isLost ? 'LOST' : 'OFF COURSE';
      const statusColor = isGood ? 'var(--eg-success)' : 'var(--eg-danger)';
      const statusTag = `<span style="font-family:Metamorphous,cursive;font-size:0.65rem;letter-spacing:1px;color:${statusColor};opacity:0.6">${statusLabel}</span>`;
      cardContent = `<div class="eg-card" style="border-left:3px solid ${ntc}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">${icon}${statusTag}${_tribeBadge(nb.tribe)}</div>
        ${_playerChips([nb.navigator], nb.tribe)}
        <div style="font-size:0.95rem;line-height:1.5">${nb.text}</div>
      </div>`;
    } else if (step.type === 'scarab') {
      const sw = step.data;
      const swtc = sw.tribe ? tribeColor(sw.tribe) : '';
      cardContent = `<div class="eg-card eg-curse" ${sw.tribe ? `style="border-left:3px solid ${swtc}"` : ''}>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          ${_icon('scarab')}
          <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:2px;color:var(--eg-danger);opacity:0.6">SCARAB SWARM</span>
          ${sw.tribe ? _tribeBadge(sw.tribe) : ''}
        </div>
        ${sw.name ? _playerChips([sw.name], sw.tribe) : ''}
        <div style="font-size:0.95rem;line-height:1.5">${sw.text}</div>
      </div>`;
    } else if (step.type === 'social') {
      const se = step.data;
      const sIcon = se.type === 'seduction' ? _icon('eye')
        : se.type === 'alliance' ? _icon('bond')
        : se.type === 'waterShare' ? _icon('heart')
        : se.type === 'waterHoard' ? _icon('villain')
        : se.type === 'animalDrama' ? _icon('camel')
        : se.type === 'desertMirage' ? _icon('eye')
        : se.type === 'voteWhisper' ? _icon('villain')
        : se.type === 'intelTrade' ? _icon('eye')
        : se.type === 'secretPact' ? _icon('bond')
        : se.type === 'rivalryFlare' ? _icon('alert')
        : se.type === 'showmanceMoment' ? _icon('heart')
        : se.type === 'showmanceFriction' ? _icon('heart')
        : _icon('alert');
      const sLabel = se.type.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
      const setc = se.tribe ? tribeColor(se.tribe) : '';
      cardContent = `<div class="eg-card eg-social" ${se.tribe ? `style="border-left:3px solid ${setc}"` : ''}>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${sIcon}
          <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:1px;color:var(--eg-terra);opacity:0.6">${sLabel}</span>
          ${se.tribe ? _tribeBadge(se.tribe) : ''}
        </div>
        ${se.players?.length ? _playerChips(se.players, se.tribe) : ''}
        <div style="font-size:0.95rem;line-height:1.5">${se.text}</div>
      </div>`;
    } else if (step.type === 'deity') {
      const dj = step.data;
      cardContent = `<div class="eg-card eg-deity-card">
        <div class="eg-deity-entrance">
          <div class="eg-deity eg-deity-${dj.deity}" style="width:40px;height:54px"></div>
          <div class="eg-deity-name">${dj.deity.toUpperCase()}</div>
          <div class="eg-deity-title">${dj.blessed ? 'Grants Blessing' : 'Passes Judgment'}</div>
        </div>
        <div style="margin-top:6px;font-size:0.95rem;font-style:italic;line-height:1.5">${dj.text}</div>
      </div>`;
    } else if (step.type === 'reaction') {
      const rx = step.data;
      const rtc = tribeColor(rx.tribe);
      const rewardLabel = rx.reward.toUpperCase();
      const rewardColor = rx.reward === 'stick' ? 'var(--eg-pharaoh-gold)' : rx.reward === 'goat' ? 'var(--eg-terra)' : 'var(--eg-muted)';
      cardContent = `<div class="eg-card" style="border-left:3px solid ${rtc};background:linear-gradient(175deg,rgba(194,166,69,0.10),rgba(184,92,56,0.04))">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${_icon('eye')}
          <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:1.5px;color:${rtc}">REACTION</span>
          <span style="font-family:Metamorphous,cursive;font-size:0.6rem;letter-spacing:1px;padding:1px 6px;border-radius:2px;color:${rewardColor};border:1px solid ${rewardColor};opacity:0.8">${rewardLabel}</span>
          ${_tribeBadge(rx.tribe)}
        </div>
        ${rx.players?.length ? _playerChips(rx.players, rx.tribe) : ''}
        <div style="font-size:0.95rem;line-height:1.5;font-style:italic">${rx.text}</div>
      </div>`;
    } else if (step.type === 'encounter') {
      const en = step.data;
      const etc = en.tribe ? tribeColor(en.tribe) : '';
      const encMeta = {
        sandstorm: { icon: 'storm', label: 'SANDSTORM', color: 'var(--eg-danger)' },
        oasis: { icon: 'success', label: 'OASIS', color: 'var(--eg-success)' },
        oasisTrap: { icon: 'eye', label: 'MIRAGE OASIS', color: 'var(--eg-danger)' },
        ruin: { icon: 'summit', label: 'ANCIENT RUIN', color: 'var(--eg-pharaoh-gold)' },
        scorpion: { icon: 'alert', label: 'SCORPION', color: 'var(--eg-danger)' },
        nomad: { icon: 'camel', label: 'DESERT NOMAD', color: 'var(--eg-success)' },
        sandPit: { icon: 'fail', label: 'SAND PIT', color: 'var(--eg-danger)' },
        vultures: { icon: 'sand', label: 'VULTURES CIRCLE', color: 'var(--eg-muted)' },
        cobra: { icon: 'alert', label: 'COBRA', color: 'var(--eg-danger)' },
      };
      const meta = encMeta[en.type] || { icon: 'sand', label: 'ENCOUNTER', color: 'var(--eg-terra)' };
      const goodBg = en.good ? 'background:linear-gradient(175deg,rgba(45,139,87,0.12),rgba(194,166,69,0.04))' : 'background:linear-gradient(175deg,rgba(192,32,32,0.10),rgba(42,31,20,0.20))';
      cardContent = `<div class="eg-card" style="border-left:3px solid ${meta.color};${goodBg}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${_icon(meta.icon)}
          <span style="font-family:Metamorphous,cursive;font-size:0.74rem;letter-spacing:2px;color:${meta.color};font-weight:700">${meta.label}</span>
          ${en.tribe ? _tribeBadge(en.tribe) : ''}
        </div>
        ${en.players?.length ? _playerChips(en.players, en.tribe) : ''}
        <div style="font-size:0.95rem;line-height:1.5">${en.text}</div>
      </div>`;
    }

    cards += `<div class="eg-step ${vis}">${cardContent}</div>`;

    // Interleave comm chatter
    if (i > 1 && i % 4 === 3 && i < allSteps.length - 1) {
      cards += `<div class="eg-step ${vis}"><div class="eg-comm">${pick(COMM_CHATTER['eg-desert'])}</div></div>`;
    }
  });

  cards += `<div class="eg-reveal-bar">
    <button class="eg-btn" onclick="egyptRevealNext('eg-desert',${total})">NEXT ▶</button>
    <span style="font-family:Metamorphous,cursive;font-size:0.9rem;color:var(--eg-gold)" id="eg-counter-eg-desert">0/${total}</span>
    <button class="eg-btn eg-btn-terra" onclick="egyptRevealAll('eg-desert',${total})">REVEAL ALL ⏩</button>
  </div>`;

  if (!window._egScreenBuilders) window._egScreenBuilders = {};
  window._egScreenBuilders['eg-desert'] = rpBuildEgyptDesert;
  return _shell(`<div data-screen-key="eg-desert">${cards}</div>`, ep, 'eg-desert');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 4: NILE CROSSING
// ══════════════════════════════════════════════════════════════
export function rpBuildEgyptNile(ep) {
  const data = ep.walkEgypt;
  if (!data?.phase3) return '';
  const p3 = data.phase3;

  const allSteps = [];
  (p3.weaving || []).forEach(w => allSteps.push({ type: 'weave', data: w }));
  (p3.animalLoading || []).forEach(al => allSteps.push({ type: 'load', data: al }));
  (p3.rowingBeats || []).forEach(rb => allSteps.push({ type: 'row', data: rb }));
  (p3.crocAttacks || []).forEach(ca => allSteps.push({ type: 'croc', data: ca }));
  (p3.socialEvents || []).forEach(se => allSteps.push({ type: 'social', data: se }));
  (p3.deityJudgments || []).forEach(dj => allSteps.push({ type: 'deity', data: dj }));
  (p3.finalSprint || []).forEach(fs => allSteps.push({ type: 'sprint', data: fs }));

  const total = allSteps.length;
  const st = _ensureState('eg-nile', total);

  let cards = '';

  // Phase header with boat status badges
  const tribeEntries = Object.entries(data.tribes);
  const boatSummary = tribeEntries.map(([tName, tData]) => {
    const bq = tData.boatQuality || 0;
    const bd = tData.boatDamage || 0;
    const integrity = Math.max(0, Math.min(100, Math.round((bq - bd) / Math.max(1, bq) * 100)));
    const color = integrity > 60 ? 'var(--eg-nile)' : integrity > 30 ? 'var(--eg-terra)' : 'var(--eg-danger)';
    return `<span style="font-family:Metamorphous,cursive;font-size:0.7rem;letter-spacing:1px;color:${color};padding:2px 8px;border:1px solid ${color};border-radius:2px;opacity:0.7;background:rgba(0,0,0,0.05)">${_icon('boat')} ${tName}: ${integrity}%</span>`;
  }).join(' ');

  cards += `<div style="text-align:center;margin-bottom:6px">
    <div class="eg-h2" style="text-align:center;border-bottom:none;padding-bottom:0;margin-bottom:4px">
      ${_icon('row')} Phase 3: Nile Crossing ${_icon('croc')}
    </div>
    <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:6px 0 10px">${boatSummary}</div>
  </div>`;
  cards += `<div class="eg-host">${data.hostLines?.phase3 || ''}</div>`;
  cards += `<div class="eg-comm">${pick(COMM_CHATTER['eg-nile'])}</div>`;

  // Rising water line
  const waterPct = Math.min(70, (st.idx + 1) / Math.max(1, total) * 70);
  cards += `<div class="eg-water-rise" style="height:${waterPct}%"></div>`;

  allSteps.forEach((step, i) => {
    const vis = st.idx >= i ? 'eg-visible' : '';
    let cardContent = '';

    if (step.type === 'weave') {
      const w = step.data;
      const wtc = tribeColor(w.tribe);
      const cls = w.isProdigy ? 'eg-card eg-hero-card' : 'eg-card';
      cardContent = `<div class="${cls}" style="border-left:3px solid ${wtc}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          ${_icon('weave')}
          <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:2px;color:var(--eg-nile);opacity:0.6">REED WEAVING</span>
          ${_tribeBadge(w.tribe)}
          ${w.isProdigy ? '<span class="eg-sb-tag eg-t-green" style="margin-left:auto;font-size:0.6rem">PRODIGY</span>' : ''}
        </div>
        ${w.name ? _playerChips([w.name], w.tribe) : ''}
        <div style="font-size:0.95rem;line-height:1.5">${w.text}</div>
      </div>`;
    } else if (step.type === 'load') {
      const al = step.data;
      const altc = tribeColor(al.tribe);
      cardContent = `<div class="eg-card" style="border-left:3px solid ${altc}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          ${_icon('camel')}
          <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:2px;color:var(--eg-terra);opacity:0.6">ANIMAL LOADING</span>
          ${_tribeBadge(al.tribe)}
        </div>
        ${al.name ? _playerChips([al.name], al.tribe) : ''}
        <div style="font-size:0.95rem;line-height:1.5">${al.text}</div>
      </div>`;
    } else if (step.type === 'row') {
      const rb = step.data;
      const rtc = tribeColor(rb.tribe);
      const rowIcon = rb.strong ? _icon('success') : rb.struggle ? _icon('alert') : _icon('row');
      const statusTag = rb.strong
        ? '<span style="font-family:Metamorphous,cursive;font-size:0.65rem;letter-spacing:1px;color:var(--eg-success);opacity:0.6">STRONG STROKE</span>'
        : rb.struggle
        ? '<span style="font-family:Metamorphous,cursive;font-size:0.65rem;letter-spacing:1px;color:var(--eg-danger);opacity:0.6">STRUGGLING</span>'
        : '<span style="font-family:Metamorphous,cursive;font-size:0.65rem;letter-spacing:1px;color:var(--eg-nile);opacity:0.6">ROWING</span>';
      cardContent = `<div class="eg-card" style="border-left:3px solid ${rtc}">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">${rowIcon}${statusTag}${_tribeBadge(rb.tribe)}</div>
        ${rb.name ? _playerChips([rb.name], rb.tribe) : ''}
        <div style="font-size:0.95rem;line-height:1.5">${rb.text}</div>
      </div>`;
    } else if (step.type === 'croc') {
      const ca = step.data;
      const ctc = tribeColor(ca.tribe);
      const cls = ca.heroSave ? 'eg-card eg-hero-card' : ca.villainShove ? 'eg-card eg-villain-card' : ca.defended ? 'eg-card' : 'eg-card eg-curse';
      const crocPlayers = [ca.target];
      if (ca.heroSave?.hero) crocPlayers.push(ca.heroSave.hero);
      if (ca.villainShove?.villain) crocPlayers.push(ca.villainShove.villain);
      let crocText = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        ${_icon('croc')}
        <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:2px;color:var(--eg-danger);opacity:0.6">CROC ATTACK</span>
        ${_tribeBadge(ca.tribe)}
        ${ca.defended ? '<span class="eg-sb-tag eg-t-green" style="margin-left:auto;font-size:0.6rem">DEFENDED</span>' : '<span class="eg-sb-tag eg-t-red" style="margin-left:auto;font-size:0.6rem">DANGER</span>'}
      </div>`;
      crocText += _playerChips(crocPlayers, ca.tribe);
      crocText += `<div style="font-size:0.95rem;line-height:1.5">${ca.attackText || ''}</div>`;
      if (ca.defenseText) crocText += `<div style="font-size:0.92rem;line-height:1.5;margin-top:3px;color:var(--eg-muted)">${ca.defenseText}</div>`;
      if (ca.heroSave) crocText += `<div style="margin-top:4px;color:var(--eg-success);font-size:0.92rem">${_icon('hero')} ${ca.heroSave.text}</div>`;
      if (ca.villainShove) {
        crocText += `<div style="margin-top:4px;color:var(--eg-danger);font-size:0.92rem">${_icon('villain')} ${ca.villainShove.text}</div>`;
        if (ca.villainShove.caught) crocText += `<div style="margin-top:2px;color:var(--eg-danger);font-size:0.88rem">${_icon('eye')} ${ca.villainShove.caughtText}</div>`;
      }
      cardContent = `<div class="${cls}">${crocText}</div>`;
    } else if (step.type === 'social') {
      const se = step.data;
      const sIcon = se.type === 'boatTeamwork' ? _icon('bond') : se.type === 'crocPanic' ? _icon('alert') : se.type === 'encourageRow' ? _icon('heart') : se.type === 'boatSabotage' ? _icon('villain') : _icon('collision');
      const sLabel = se.type.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
      const setc2 = se.tribe ? tribeColor(se.tribe) : '';
      cardContent = `<div class="eg-card eg-social" ${se.tribe ? `style="border-left:3px solid ${setc2}"` : ''}>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          ${sIcon}
          <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:1px;color:var(--eg-terra);opacity:0.6">${sLabel}</span>
          ${se.tribe ? _tribeBadge(se.tribe) : ''}
        </div>
        ${se.players?.length ? _playerChips(se.players, se.tribe) : ''}
        <div style="font-size:0.95rem;line-height:1.5">${se.text}</div>
      </div>`;
    } else if (step.type === 'deity') {
      const dj = step.data;
      cardContent = `<div class="eg-card eg-deity-card">
        <div class="eg-deity-entrance">
          <div class="eg-deity eg-deity-${dj.deity}" style="width:40px;height:54px"></div>
          <div class="eg-deity-name">${dj.deity.toUpperCase()}</div>
          <div class="eg-deity-title">${dj.blessed ? 'Grants Blessing' : 'Passes Judgment'}</div>
        </div>
        <div style="margin-top:6px;font-size:0.95rem;font-style:italic;line-height:1.5">${dj.text}</div>
      </div>`;
    } else if (step.type === 'sprint') {
      const fs = step.data;
      const stc = tribeColor(fs.tribe);
      const cls = fs.sunk ? 'eg-card eg-curse' : 'eg-card';
      const sprintLabel = fs.sunk ? 'CAPSIZED' : 'FINAL SPRINT';
      const sprintColor = fs.sunk ? 'var(--eg-danger)' : 'var(--eg-success)';
      const sprintIcon = fs.sunk ? _icon('alert') : _icon('boat');
      let sprintText = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        ${sprintIcon}
        <span style="font-family:Metamorphous,cursive;font-size:0.72rem;letter-spacing:2px;color:${sprintColor};opacity:0.6">${sprintLabel}</span>
        ${_tribeBadge(fs.tribe)}
      </div>`;
      if (fs.players?.length) sprintText += _playerChips(fs.players, fs.tribe);
      sprintText += `<div style="font-size:0.95rem;line-height:1.5">${fs.text || ''}</div>`;
      if (fs.bailAttempts?.length) sprintText += fs.bailAttempts.map(b => `<div style="margin-top:3px;font-size:0.92rem">${_icon('hero')} ${b.text}</div>`).join('');
      cardContent = `<div class="${cls}">${sprintText}</div>`;
    }

    cards += `<div class="eg-step ${vis}">${cardContent}</div>`;

    // Interleave comm chatter
    if (i > 1 && i % 4 === 3 && i < allSteps.length - 1) {
      cards += `<div class="eg-step ${vis}"><div class="eg-comm">${pick(COMM_CHATTER['eg-nile'])}</div></div>`;
    }
  });

  cards += `<div class="eg-reveal-bar">
    <button class="eg-btn" onclick="egyptRevealNext('eg-nile',${total})">NEXT ▶</button>
    <span style="font-family:Metamorphous,cursive;font-size:0.9rem;color:var(--eg-gold)" id="eg-counter-eg-nile">0/${total}</span>
    <button class="eg-btn eg-btn-terra" onclick="egyptRevealAll('eg-nile',${total})">REVEAL ALL ⏩</button>
  </div>`;

  if (!window._egScreenBuilders) window._egScreenBuilders = {};
  window._egScreenBuilders['eg-nile'] = rpBuildEgyptNile;
  return _shell(`<div data-screen-key="eg-nile">${cards}</div>`, ep, 'eg-nile');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 5: RESULTS
// ══════════════════════════════════════════════════════════════
export function rpBuildEgyptResults(ep) {
  const data = ep.walkEgypt;
  if (!data) return '';

  const finishOrder = data.tribeFinishOrder || [];
  const h = host();
  let content = '';

  // Title with deity
  content += `<div style="text-align:center;margin-bottom:6px">
    <div class="eg-deity eg-deity-ra" style="width:50px;height:65px;margin:0 auto 6px;opacity:0.4"></div>
    <div class="eg-h1" style="font-size:2rem;margin:0 0 4px">THE EXPEDITION CONCLUDES</div>
    <div style="font-family:Metamorphous,cursive;font-size:0.75rem;letter-spacing:5px;color:var(--eg-muted);opacity:0.5">RA HAS JUDGED</div>
  </div>`;

  // Tribe results — dramatic placement cards
  finishOrder.forEach((tName, i) => {
    const tData = data.tribes[tName] || {};
    const members = tData.members || [];
    const isFirst = i === 0;
    const isLast = i === finishOrder.length - 1;
    const label = isFirst ? 'IMMUNITY' : isLast ? 'TRIBAL COUNCIL' : 'SAFE';
    const tagCls = isFirst ? 'eg-t-gold' : isLast ? 'eg-t-red' : 'eg-t-green';
    const cardCls = isFirst ? 'eg-card eg-winner-card' : isLast ? 'eg-card eg-curse' : 'eg-card';
    const placeIcon = isFirst ? _icon('summit') : isLast ? _icon('alert') : _icon('success');
    const placeSuffix = i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th';

    content += `<div class="${cardCls}" style="margin:10px 0">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        ${placeIcon}
        <div style="flex:1">
          <div style="display:flex;align-items:baseline;gap:6px">
            <span style="font-family:Metamorphous,cursive;font-size:1.4rem;font-weight:700;color:${isFirst ? 'var(--eg-pharaoh-gold)' : isLast ? 'var(--eg-danger)' : 'var(--eg-success)'}">${i + 1}${placeSuffix}</span>
            <span class="eg-h3" style="margin:0">${tName}</span>
          </div>
          <div style="font-family:Cormorant Garamond,serif;font-size:0.82rem;color:var(--eg-muted);letter-spacing:0.5px">
            ${tData.reward?.toUpperCase() || '—'} · ${Math.round((tData.totalScore || 0) * 10) / 10} pts
          </div>
        </div>
        <span class="eg-sb-tag ${tagCls}" style="font-size:0.72rem">${label}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:3px">
        ${members.map(n => _cartouche(n, isFirst ? 'eg-immune' : '')).join('')}
      </div>
    </div>`;
  });

  // Host finish lines
  const hostLines = [data.hostLines?.finish1st, data.hostLines?.finish2nd, data.hostLines?.finishLast].filter(Boolean);
  hostLines.forEach(line => {
    content += `<div class="eg-host">${line}</div>`;
  });

  // Individual leaderboard
  content += `<div style="text-align:center;margin:18px 0 8px">
    <div class="eg-h2" style="text-align:center;border-bottom:none;padding-bottom:0">Individual Expedition Scores</div>
  </div>`;
  const scores = Object.entries(ep.chalMemberScores || {}).sort(([, a], [, b]) => b - a);
  const maxScore = scores.length > 0 ? scores[0][1] : 1;
  scores.forEach(([name, score], i) => {
    const sl = slug(name);
    const pct = Math.min(100, Math.max(8, (score / maxScore) * 100));
    const barCls = i === 0 ? 'eg-gold' : i < 3 ? 'eg-orange' : 'eg-green';
    content += `<div class="eg-lb-row ${i === 0 ? 'eg-first' : ''}" style="gap:8px">
      <span class="eg-lb-rank">${i + 1}</span>
      <img src="assets/avatars/${sl}.png" alt="${name}" style="width:24px;height:24px;border-radius:50%;object-fit:contain;border:1.5px solid ${i === 0 ? 'var(--eg-pharaoh-gold)' : 'rgba(194,166,69,0.25)'}" onerror="this.style.display='none'">
      <span class="eg-lb-name">${name}</span>
      <div style="width:60px;flex-shrink:0"><div class="eg-bar-wrap" style="height:6px"><div class="eg-bar ${barCls}" style="width:${pct}%"></div></div></div>
      <span class="eg-lb-score">${Math.round(score * 10) / 10}</span>
    </div>`;
  });

  if (!window._egScreenBuilders) window._egScreenBuilders = {};
  window._egScreenBuilders['eg-winner'] = rpBuildEgyptResults;
  return _shell(content, ep, 'eg-winner');
}


// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG (custom export for text-backlog.js)
// ══════════════════════════════════════════════════════════════
export function _textWalkEgypt(ep, ln, sec) {
  if (!ep.walkEgypt) return;
  // Use _textTwistChallenge from text-backlog.js instead
  // This is kept as fallback
}
