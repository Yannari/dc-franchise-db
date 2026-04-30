// js/chal/walk-like-an-egyptian.js — Walk Like an Egyptian (pre-merge tribe challenge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
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
    h => `"Phase two — desert trek!" ${h} tosses keys to the first-place tribe. "Winners get the camel. Second place gets... a goat. Last place gets a stick. Have fun!"`,
    h => `${h} points at the endless sand dunes. "Navigate to the Nile. First tribe there gets a head start. Last tribe gets to think about what they did wrong."`,
    h => `"Out there is sand, sun, scarabs, and exactly zero shade. Unless you got the camel." ${h} winks at the leading tribe. "Navigate wisely. Or don't. It's funny either way."`,
    h => `${h} squints at the horizon. "The Nile is... somewhere out there. Your navigator better be smart, because GPS hasn't been invented yet. In this challenge, anyway."`,
    h => `"One camel, one goat, one stick." ${h} holds up three fingers. "The stick might be more useful than you think. Or it might just be a stick. Only one way to find out."`,
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
    t => `${t} gets the camel. It spits at them immediately, but the shade it provides is worth it.`,
    t => `The camel regards ${t} with suspicion. They regard the camel with gratitude. Desert crossing with shade — luxury.`,
    t => `${t} loads up the camel and sets off. The beast knows the desert better than any of them. First-class travel.`,
    t => `"A camel!" ${t} cheers. The camel does not cheer back. But it walks, and it carries things, and it blocks the sun. Good enough.`,
    t => `${t}'s camel is surly, smelly, and perfect. Fifteen percent faster than walking, and the shade keeps the heat at bay.`,
  ],
  goat: [
    t => `${t} gets the goat. It's... enthusiastic. It also keeps trying to eat their map. But the weight distribution helps.`,
    t => `The goat headbutts the first person who tries to load it. After that, they reach an understanding. ${t} sets off.`,
    t => `"A goat?" ${t} looks at the goat. The goat looks back. "Fine. Let's go." At least it carries some of their gear.`,
    t => `${t}'s goat is small, angry, and surprisingly fast. Not exactly a camel, but better than nothing.`,
    t => `The goat bleats at ${t}. ${t} bleats back. The bond is formed. They set off into the desert at a decent pace.`,
  ],
  stick: [
    t => `${t} gets a stick. Just... a stick. The disappointment is visible from space.`,
    t => `"A STICK?" ${t} holds it up. It's a stick. "This is what we get for losing?" It's just a stick. Probably.`,
    t => `${t} stares at their "reward." A stick. Not even a good stick. It's slightly crooked.`,
    t => `The stick is unimpressive. ${t} debates throwing it away but keeps it out of spite. At least they can poke things.`,
    t => `"Last place gets a STICK." ${t} is not hiding their frustration. The stick just sits there, being a stick. Or is it?`,
  ],
  stickDiscovery: [
    (n, pr) => `Wait. ${n} stops walking and holds the stick level. It pulls. Not wind — it's a divining rod. ${pr.Sub} can feel water, direction, the path. "Guys. The stick is magic."`,
    (n, pr) => `${n} notices the stick vibrating. ${pr.Sub} points it different directions — it tugs toward water. "This isn't just a stick. It's a compass." The tribe stares.`,
    (n, pr) => `${n} was about to toss the stick when it twitched in ${pr.posAdj} hand. Points northeast. Toward the Nile? ${pr.Sub} follows it. The stick knows the way.`,
    (n, pr) => `The stick glows. Okay, it doesn't glow. But ${n} swears it hums. ${pr.Sub} follows its pull and finds the path immediately. "I take back everything I said about this stick."`,
    (n, pr) => `${n} spins the stick experimentally. It stops pointing the same direction every time. "It's a divining rod!" ${pr.Sub} grins. The losing tribe might just catch up.`,
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
    (target, tribe, pr) => `${target} feels the heat building. ${pr.posAdj} tribemates are looking for a scapegoat, and ${pr.sub}'s name keeps coming up.`,
    (target, tribe, pr) => `"This is ${target}'s fault." Nobody says it out loud, but the glances say everything. ${pr.Sub} is losing standing with every step.`,
    (target, tribe, pr) => `The blame spiral starts with a whisper and reaches ${target} by the time they crest the dune. ${pr.Sub} knows ${pr.sub}'s in trouble.`,
    (target, tribe, pr) => `${target} stumbles and someone mutters, "Typical." The tribe dynamic shifts. ${pr.Sub} is the weak link, and everyone knows it.`,
  ],
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
    (n, pr) => `${n}'s arms give out mid-river. ${pr.Sub} slumps over the oar, gasping. The boat loses momentum.`,
    (n, pr) => `${n} and the river are having a disagreement about which direction the boat should go. The river is winning.`,
    (n, pr) => `${n} drops the oar. Picks it up. Drops it again. The current pushes them backward during the fumble.`,
  ],
};

const CROC_TEXT = {
  attack: [
    (n, pr) => `A croc surges from the murk and snaps at the boat near ${n}. Reeds splinter. "${pr.Sub} hit THE BOAT!"`,
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
    phase1: { choices: [], overBeats: [], underBeats: [], mummifiedDog: null },
    phase2: { leaders: {}, navBeats: [], scarabSwarm: [], socialEvents: [], stickLost: false, stickDiscovery: null },
    phase3: { weaving: [], animalLoading: [], rowingBeats: [], crocAttacks: [], finalSprint: [], boatSunk: null },
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

    // Tribe average for P1
    const tribeChoices = result.phase1.choices.filter(c => c.tribe === tName);
    const avg = tribeChoices.reduce((sum, c) => sum + c.score, 0) / (tribeChoices.length || 1);
    tribeP1Scores[tName] = avg;
    result.tribes[tName].p1Avg = avg;
  });

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
    if (i === 0) rewardMap[entry.name] = 'camel';
    else if (i === p1Ranking.length - 1) rewardMap[entry.name] = 'stick';
    else rewardMap[entry.name] = 'goat';
  });
  // For 2-tribe games, last gets stick
  if (tribes.length === 2) {
    rewardMap[p1Ranking[0].name] = 'camel';
    rewardMap[p1Ranking[1].name] = 'stick';
  }

  tribes.forEach(t => {
    result.tribes[t.name].reward = rewardMap[t.name];
    const rText = pick(REWARD_TEXT[rewardMap[t.name]])(t.name);
    result.tribes[t.name].rewardText = rText;
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
    const speedMod = reward === 'camel' ? 1.15 : reward === 'goat' ? 1.08 : 1.0;

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
        beatResult = { type: 'nav', tribe: tName, navigator, success: 'good', text: pick(NAV_TEXT.success)(navigator, navPr), score: 3 };
        navBonusPenalty += 3;
        perPlayerP2[navigator] += 3;
      } else if (navRoll >= difficulty - 1) {
        beatResult = { type: 'nav', tribe: tName, navigator, success: 'fail', text: pick(NAV_TEXT.fail)(navigator, navPr), score: -1 };
        navBonusPenalty -= 1;
        perPlayerP2[navigator] -= 1;
      } else {
        beatResult = { type: 'nav', tribe: tName, navigator, success: 'lost', text: pick(NAV_TEXT.lost)(navigator, navPr), score: -3 };
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
        navBonusPenalty += 6; // Divining rod auto-passes one nav beat equivalent
        perPlayerP2[discoverer] = (perPlayerP2[discoverer] || 0) + 4;
        popDelta(discoverer, 1);

        ep.campEvents[tName].post.push({
          type: 'stickDiscovery',
          players: [discoverer],
          text: `${discoverer} discovered the stick was actually a divining rod and used it to navigate the desert. Turned a last-place reward into an advantage.`,
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
          navBonusPenalty -= 4; // lose most of the benefit
        }
      }
    }

    // ── Scarab Swarm (all tribes hit simultaneously) ──
    const scarabResults = [];
    const cursedPlayer = result.phase1.mummifiedDog?.player;

    members.forEach(name => {
      const s = pStats(name);
      const pr = pronouns(name);
      const isCursed = name === cursedPlayer;
      const swarmRoll = s.endurance * 0.5 + s.mental * 0.3 + noise(2.5) - (isCursed ? 3 : 0);
      const passed = swarmRoll >= 4;

      let scarabBeat;
      if (isCursed) {
        scarabBeat = { name, tribe: tName, passed: false, cursed: true, text: pick(SCARAB_SWARM_TEXT.cursedExtra)(name, pr), score: -3 };
        perPlayerP2[name] = (perPlayerP2[name] || 0) - 3;
      } else if (passed) {
        scarabBeat = { name, tribe: tName, passed: true, cursed: false, text: pick(SCARAB_SWARM_TEXT.pass)(name, pr), score: 2 };
        perPlayerP2[name] = (perPlayerP2[name] || 0) + 2;
      } else {
        scarabBeat = { name, tribe: tName, passed: false, cursed: false, text: pick(SCARAB_SWARM_TEXT.fail)(name, pr), score: -1 };
        perPlayerP2[name] = (perPlayerP2[name] || 0) - 1;
      }

      scarabResults.push(scarabBeat);
      result.phase2.scarabSwarm.push(scarabBeat);
    });

    // ── Scarab Calmer (one per tribe may try) ──
    const calmCandidates = members.filter(m => {
      const s = pStats(m);
      return s.social * 0.5 + s.boldness * 0.5 + noise(1) >= 5;
    });
    if (calmCandidates.length > 0 && Math.random() < 0.4) {
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

            result.phase2.socialEvents.push({ type: 'seduction', schemer, target, tribe: tName, success, text: sText });

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
        result.phase2.socialEvents.push({ type: 'blame', target: blameTarget, tribe: tName, text: blameText });

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
    let weavingProdigy = null;
    const weavingResults = [];

    members.forEach(name => {
      const s = pStats(name);
      const pr = pronouns(name);
      const weaveScore = s.mental * 0.5 + s.social * 0.5 + noise(2.5);

      let weaveTier, weaveText;
      if (weaveScore >= 8) {
        weaveTier = 'good'; weaveText = pick(WEAVING_TEXT.good)(name, pr);
        boatQuality += 3;
        perPlayerP3[name] += 3;
      } else if (weaveScore <= 3) {
        weaveTier = 'bad'; weaveText = pick(WEAVING_TEXT.bad)(name, pr);
        boatQuality += 0.5;
        perPlayerP3[name] += 0.5;
      } else {
        weaveTier = 'mid'; weaveText = pick(WEAVING_TEXT.good)(name, pr);
        boatQuality += 1.5;
        perPlayerP3[name] += 1.5;
      }

      weavingResults.push({ name, tribe: tName, tier: weaveTier, score: weaveScore, text: weaveText });
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
      const goatText = pick(ANIMAL_LOAD_TEXT.goat)(pick(members), pronouns(pick(members)));
      loadResults.push({ type: 'goatLoad', tribe: tName, text: goatText });
      // Goat panics on water — minor ongoing penalty handled in rowing
    } else {
      // Stick — instant load
      if (!result.phase2.stickLost) {
        const stickText = pick(ANIMAL_LOAD_TEXT.stickInstant)(tName);
        loadResults.push({ type: 'stickLoad', tribe: tName, text: stickText, instant: true });
        // Massive time advantage
        members.forEach(m => { perPlayerP3[m] = (perPlayerP3[m] || 0) + 2; });
      } else {
        loadResults.push({ type: 'stickLost', tribe: tName, text: `${tName} lost the stick in the desert. Nothing to load — but nothing to help, either.` });
      }
    }

    result.phase3.animalLoading.push(...loadResults);

    // ── Beat 3: Rowing & Croc Gauntlet ──
    const numRowBeats = Math.random() < 0.3 ? 4 : 3;
    const boatQualityMod = boatQuality * 0.3; // Better boat = easier rowing
    const goatPanicPenalty = reward === 'goat' ? -1.5 : 0;
    const cursedPlayer = result.phase1.mummifiedDog?.player;

    for (let beat = 0; beat < numRowBeats; beat++) {
      // Tribe rowing score
      const rowResults = [];
      let beatRowScore = 0;

      members.forEach(name => {
        const s = pStats(name);
        const pr = pronouns(name);
        const rowRoll = s.physical * 0.5 + s.endurance * 0.5 + noise(2.5) + boatQualityMod * 0.1 + goatPanicPenalty * 0.2;

        let rowText;
        if (rowRoll >= 6) {
          rowText = pick(ROWING_TEXT.good)(name, pr);
          perPlayerP3[name] = (perPlayerP3[name] || 0) + 2;
          beatRowScore += 2;
        } else {
          rowText = pick(ROWING_TEXT.bad)(name, pr);
          perPlayerP3[name] = (perPlayerP3[name] || 0) - 0.5;
          beatRowScore -= 0.5;
        }

        rowResults.push({ name, tribe: tName, beat, score: rowRoll, text: rowText });
      });

      result.phase3.rowingBeats.push(...rowResults);

      // ── Croc Attacks (1-2 per beat) ──
      const numCrocs = Math.random() < 0.4 ? 2 : 1;
      for (let c = 0; c < numCrocs; c++) {
        // Target priority: cursed → lowest physical → random
        let target;
        if (cursedPlayer && tribe.members.includes(cursedPlayer) && Math.random() < 0.5) {
          target = cursedPlayer;
        } else {
          const physSorted = [...members].sort((a, b) => pStats(a).physical - pStats(b).physical);
          target = Math.random() < 0.4 ? physSorted[0] : pick(members);
        }

        const tpr = pronouns(target);
        const attackText = pick(CROC_TEXT.attack)(target, tpr);

        // Defense check
        const defRoll = pStats(target).physical * 0.5 + pStats(target).boldness * 0.5 + noise(2.5);
        let defResult;

        if (defRoll >= 5) {
          const defText = pick(CROC_TEXT.defenseSuccess)(target, tpr);
          defResult = { target, tribe: tName, beat, defended: true, attackText, defenseText: defText };
          perPlayerP3[target] = (perPlayerP3[target] || 0) + 2;
        } else {
          const defText = pick(CROC_TEXT.defenseFail)(target, tpr);
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

    // ── Beat 4: Final Sprint ──
    const sinkThreshold = boatQuality * 1.5;
    const willSink = boatDamage > sinkThreshold;

    let sprintResult;
    if (willSink) {
      sprintResult = { tribe: tName, sunk: true, text: pick(FINAL_SPRINT_TEXT.sinking)(tName), penalty: -8 };
      result.phase3.boatSunk = tName;
      // Bail attempts
      members.forEach(name => {
        const s = pStats(name);
        const pr = pronouns(name);
        const bailRoll = s.endurance * 0.7 + noise(2);
        if (bailRoll >= 5) {
          const bailText = pick(BAIL_TEXT)(name, pr);
          sprintResult.bailAttempts = sprintResult.bailAttempts || [];
          sprintResult.bailAttempts.push({ name, text: bailText });
          perPlayerP3[name] = (perPlayerP3[name] || 0) + 1;
        }
      });
    } else if (boatDamage > sinkThreshold * 0.5) {
      sprintResult = { tribe: tName, sunk: false, damaged: true, text: pick(FINAL_SPRINT_TEXT.bad)(tName), penalty: -3 };
      // Bailing needed
      const bailer = pick(members);
      const bailerPr = pronouns(bailer);
      sprintResult.bailAttempts = [{ name: bailer, text: pick(BAIL_TEXT)(bailer, bailerPr) }];
      perPlayerP3[bailer] = (perPlayerP3[bailer] || 0) + 1;
    } else {
      sprintResult = { tribe: tName, sunk: false, damaged: false, text: pick(FINAL_SPRINT_TEXT.good)(tName), penalty: 0 };
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
    '"The stick team has veered off-course again. Classic."',
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
function _cartouche(name, statusCls = '', tag = '') {
  const sl = slug(name);
  return `<span class="eg-cartouche ${statusCls}">
    <span class="eg-seal-frame"><img src="assets/avatars/${sl}.png" alt="${name}" onerror="this.style.display='none'"></span>
    <span class="eg-seal-name">${name}</span>${tag ? `<span class="eg-seal-tag ${tag.cls || ''}">${tag.text}</span>` : ''}
  </span>`;
}


// ══════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════
function _css() {
  return `<style>
/* ═══ WALK LIKE AN EGYPTIAN VP ═══ */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600;700&family=Noto+Sans+Egyptian+Hieroglyphs&display=swap');

:root{
  --eg-papyrus:#F5E6C8;--eg-gold:#C2A645;--eg-pharaoh-gold:#D4A017;--eg-scarab:#2D5F3E;
  --eg-nile:#1B6B7A;--eg-terra:#B85C38;--eg-tomb:#1A1510;--eg-sand:#E8D5A8;
  --eg-danger:#CC3030;--eg-success:#3A8A2A;--eg-text:#2A1A0A;--eg-muted:#7A6A5A;
  --eg-torch:#FF9944;--eg-water:#1B4B7A;
}

.eg-shell{position:relative;display:flex;gap:0;min-height:520px;max-width:1100px;margin:0 auto;font-family:'Inter','Segoe UI',sans-serif;color:var(--eg-text);background:var(--eg-papyrus);border-radius:2px;overflow:clip;border:none;
  box-shadow:inset 4px 4px 0 rgba(255,235,180,0.12),inset -4px -4px 0 rgba(0,0,0,0.15),
    0 6px 30px rgba(26,21,16,0.3),0 2px 0 var(--eg-terra),0 -2px 0 var(--eg-terra),-2px 0 0 var(--eg-terra),2px 0 0 var(--eg-terra)}
.eg-shell *{box-sizing:border-box}
.eg-main{flex:1;padding:18px 20px 60px 20px;overflow-y:auto;position:relative;z-index:1}
.eg-sidebar{width:240px;min-width:240px;padding:12px 10px;overflow-y:auto;font-size:0.82rem;position:relative;z-index:1;
  background:linear-gradient(180deg,rgba(42,31,20,0.06),rgba(194,166,69,0.04));
  border-left:none;box-shadow:inset 4px 0 0 rgba(194,166,69,0.12),inset 5px 0 0 rgba(0,0,0,0.08);
  background-image:repeating-linear-gradient(0deg,transparent,transparent 38px,rgba(194,166,69,0.06) 38px,rgba(194,166,69,0.06) 40px)}

/* Living hieroglyph border — walking figures along top/bottom */
.eg-shell::before{content:'';position:absolute;top:0;left:0;right:0;height:18px;z-index:2;pointer-events:none;
  background:repeating-linear-gradient(90deg,
    transparent 0px,transparent 30px,
    rgba(194,166,69,0.12) 30px,rgba(194,166,69,0.12) 31px);
  border-bottom:1px solid rgba(194,166,69,0.15)}
.eg-shell::after{content:'';position:absolute;bottom:0;left:0;right:0;height:18px;z-index:2;pointer-events:none;
  background:repeating-linear-gradient(90deg,
    transparent 0px,transparent 30px,
    rgba(194,166,69,0.12) 30px,rgba(194,166,69,0.12) 31px);
  border-top:1px solid rgba(194,166,69,0.15)}

/* Hieroglyph walker figures (CSS clip-path) */
.eg-hiero-walker{position:absolute;z-index:3;pointer-events:none;width:12px;height:14px;top:2px;opacity:0.15}
.eg-hiero-walker::before{content:'';position:absolute;width:6px;height:6px;background:var(--eg-terra);border-radius:50%;top:0;left:3px}
.eg-hiero-walker::after{content:'';position:absolute;width:8px;height:8px;background:var(--eg-terra);clip-path:polygon(50% 0%,100% 100%,0% 100%);top:5px;left:2px}
.eg-hiero-walker.eg-walk{animation:eg-hiero-walk 8s linear infinite}
@keyframes eg-hiero-walk{0%{transform:translateX(0)}100%{transform:translateX(80px)}}

/* Phase backgrounds */
.eg-shell.eg-pyramid{background:linear-gradient(180deg,#2A1F14 0%,#3D2E1E 40%,#1A1510 100%);color:#E8D5A8;border-color:#5C3D2E}
.eg-shell.eg-pyramid .eg-sidebar{background:linear-gradient(180deg,rgba(42,31,20,0.1),rgba(255,153,68,0.03));box-shadow:inset 4px 0 0 rgba(255,153,68,0.1),inset 5px 0 0 rgba(0,0,0,0.1)}
.eg-shell.eg-desert{background:linear-gradient(180deg,#E8C870 0%,#D4A040 30%,#C89030 60%,#B87830 100%);color:#2A1A0A;border-color:#B85C38}
.eg-shell.eg-desert .eg-sidebar{background:linear-gradient(180deg,rgba(184,92,56,0.04),rgba(232,200,112,0.03));box-shadow:inset 4px 0 0 rgba(184,92,56,0.1),inset 5px 0 0 rgba(0,0,0,0.08)}
.eg-shell.eg-nile{background:linear-gradient(180deg,#1A3540 0%,#1B4B7A 30%,#164060 70%,#0E2A3E 100%);color:#E0E8F0;border-color:#1B6B7A}
.eg-shell.eg-nile .eg-sidebar{background:linear-gradient(180deg,rgba(14,42,62,0.08),rgba(27,107,122,0.03));box-shadow:inset 4px 0 0 rgba(27,107,122,0.1),inset 5px 0 0 rgba(0,0,0,0.1)}
.eg-shell.eg-winner{background:linear-gradient(180deg,var(--eg-papyrus) 0%,#E8D5A8 50%,var(--eg-papyrus) 100%);border-color:#D4A017;box-shadow:0 6px 30px rgba(212,160,23,0.3)}

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

/* ═══ CHISELED MONUMENTAL HEADERS — incised relief text ═══ */
.eg-h1{font-family:'Cinzel',serif;font-size:1.8rem;text-align:center;letter-spacing:4px;text-transform:uppercase;
  color:var(--eg-pharaoh-gold);margin:0 0 4px 0;position:relative;
  text-shadow:1px 1px 0 rgba(0,0,0,0.5),-1px -1px 0 rgba(255,235,180,0.15),0 0 20px rgba(212,160,23,0.25)}
.eg-h1::after{content:'';display:block;width:100px;height:10px;margin:8px auto 12px;opacity:0.3;
  background:currentColor;
  clip-path:polygon(0% 50%,12% 0%,24% 45%,36% 5%,50% 50%,64% 5%,76% 45%,88% 0%,100% 50%,88% 100%,76% 55%,64% 95%,50% 50%,36% 95%,24% 55%,12% 100%)}

.eg-h2{font-family:'Cinzel',serif;font-size:1.05rem;letter-spacing:3px;color:var(--eg-terra);margin:16px 0 8px;text-transform:uppercase;position:relative;
  text-shadow:1px 1px 0 rgba(0,0,0,0.25),-1px -1px 0 rgba(255,235,180,0.1);
  border-bottom:2px solid rgba(194,166,69,0.15);padding-bottom:6px}
.eg-h2::before{content:'𓋹';margin-right:8px;font-size:0.85em;opacity:0.35}
.eg-h2::after{content:'';position:absolute;bottom:-2px;left:0;width:40px;height:2px;background:var(--eg-gold);opacity:0.4}

.eg-h3{font-family:'Cinzel',serif;font-size:0.9rem;color:var(--eg-gold);margin:10px 0 6px;letter-spacing:2px;
  text-shadow:0 1px 0 rgba(0,0,0,0.25)}

.eg-pyramid .eg-h2{color:var(--eg-torch);border-bottom-color:rgba(255,153,68,0.15)}
.eg-pyramid .eg-h2::after{background:var(--eg-torch)}
.eg-nile .eg-h2{color:#4AC1D0;border-bottom-color:rgba(74,193,208,0.15)}
.eg-nile .eg-h2::after{background:#4AC1D0}
.eg-nile .eg-h3{color:#4AC1D0}

/* ═══ STONE TABLET CARDS — chiseled relief panels ═══ */
.eg-card{
  background:linear-gradient(175deg,rgba(194,166,69,0.1) 0%,rgba(194,166,69,0.05) 40%,rgba(184,140,60,0.07) 100%);
  border:none;border-radius:2px;padding:12px 16px;margin:8px 0;color:var(--eg-text);font-size:0.88rem;line-height:1.5;position:relative;
  box-shadow:inset 3px 3px 0 rgba(255,235,180,0.15),inset -3px -3px 0 rgba(0,0,0,0.18),0 2px 6px rgba(0,0,0,0.1);
  background-image:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(194,166,69,0.02) 3px,rgba(194,166,69,0.02) 4px)}
.eg-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:repeating-linear-gradient(90deg,var(--eg-gold) 0px,var(--eg-gold) 4px,transparent 4px,transparent 8px,var(--eg-terra) 8px,var(--eg-terra) 10px,transparent 10px,transparent 14px);opacity:0.2;border-radius:2px 2px 0 0}

.eg-pyramid .eg-card{
  background:linear-gradient(175deg,rgba(255,153,68,0.07) 0%,rgba(42,31,20,0.35) 100%);color:#E8D5A8;
  box-shadow:inset 3px 3px 0 rgba(255,153,68,0.12),inset -3px -3px 0 rgba(0,0,0,0.3),0 2px 8px rgba(0,0,0,0.25)}
.eg-nile .eg-card{
  background:linear-gradient(175deg,rgba(27,107,122,0.08) 0%,rgba(14,42,62,0.25) 100%);color:#E0E8F0;
  box-shadow:inset 3px 3px 0 rgba(74,193,208,0.08),inset -3px -3px 0 rgba(0,0,0,0.25),0 2px 8px rgba(0,0,0,0.2)}

.eg-card.eg-social{
  box-shadow:inset 3px 3px 0 rgba(184,92,56,0.12),inset -3px -3px 0 rgba(0,0,0,0.18),0 2px 6px rgba(0,0,0,0.1);
  background:linear-gradient(175deg,rgba(184,92,56,0.07),rgba(184,92,56,0.02))}
.eg-card.eg-social::before{background:repeating-linear-gradient(90deg,var(--eg-terra) 0px,var(--eg-terra) 6px,transparent 6px,transparent 12px);opacity:0.25}

.eg-card.eg-curse{
  box-shadow:inset 3px 3px 0 rgba(204,48,48,0.12),inset -3px -3px 0 rgba(0,0,0,0.22),0 2px 6px rgba(204,48,48,0.12);
  background:linear-gradient(175deg,rgba(204,48,48,0.07),rgba(204,48,48,0.02))}
.eg-card.eg-curse::before{background:repeating-linear-gradient(90deg,var(--eg-danger) 0px,var(--eg-danger) 3px,transparent 3px,transparent 6px);opacity:0.3}

.eg-card.eg-hero-card{
  box-shadow:inset 3px 3px 0 rgba(58,138,42,0.12),inset -3px -3px 0 rgba(0,0,0,0.18),0 2px 6px rgba(58,138,42,0.08);
  background:linear-gradient(175deg,rgba(58,138,42,0.07),rgba(58,138,42,0.02))}

.eg-card.eg-villain-card{
  box-shadow:inset 3px 3px 0 rgba(204,48,48,0.1),inset -3px -3px 0 rgba(0,0,0,0.22),0 2px 6px rgba(204,48,48,0.08);
  background:linear-gradient(175deg,rgba(204,48,48,0.05),rgba(0,0,0,0.03))}

.eg-card.eg-winner-card{
  box-shadow:inset 3px 3px 0 rgba(212,160,23,0.2),inset -3px -3px 0 rgba(0,0,0,0.18),0 4px 12px rgba(212,160,23,0.15),0 0 20px rgba(212,160,23,0.06);
  background:linear-gradient(175deg,rgba(212,160,23,0.1),rgba(194,166,69,0.05))}
.eg-card.eg-winner-card::before{background:repeating-linear-gradient(90deg,var(--eg-pharaoh-gold) 0px,var(--eg-pharaoh-gold) 4px,transparent 4px,transparent 6px,var(--eg-gold) 6px,var(--eg-gold) 8px,transparent 8px,transparent 12px);opacity:0.35}

/* ═══ STONE SEAL CARTOUCHE — angular relief player badge ═══ */
.eg-cartouche{display:inline-flex;align-items:center;gap:6px;padding:5px 14px 5px 5px;margin:4px;position:relative;
  background:linear-gradient(135deg,rgba(194,166,69,0.12),rgba(160,136,56,0.06));
  border:2px solid rgba(194,166,69,0.3);border-radius:2px;
  box-shadow:inset 2px 2px 0 rgba(255,235,180,0.1),inset -2px -2px 0 rgba(0,0,0,0.12),0 2px 4px rgba(0,0,0,0.12)}
.eg-cartouche::after{content:'';position:absolute;right:3px;top:20%;bottom:20%;width:2px;
  background:linear-gradient(180deg,transparent,var(--eg-gold),transparent);opacity:0.4}
.eg-cartouche::before{content:'· · ·';position:absolute;top:-2px;left:50%;transform:translateX(-50%);
  font-size:0.45rem;color:var(--eg-gold);opacity:0.35;letter-spacing:2px;line-height:1}

.eg-cartouche.eg-over{border-color:rgba(255,153,68,0.4);background:linear-gradient(135deg,rgba(255,153,68,0.12),rgba(184,92,56,0.06));
  box-shadow:inset 2px 2px 0 rgba(255,153,68,0.1),inset -2px -2px 0 rgba(0,0,0,0.15),0 0 6px rgba(255,153,68,0.15)}
.eg-cartouche.eg-under{border-color:rgba(45,95,62,0.4);background:linear-gradient(135deg,rgba(45,95,62,0.12),rgba(45,95,62,0.06));
  box-shadow:inset 2px 2px 0 rgba(45,95,62,0.1),inset -2px -2px 0 rgba(0,0,0,0.15),0 0 6px rgba(45,95,62,0.15)}
.eg-cartouche.eg-cursed{border-color:rgba(204,48,48,0.5);animation:eg-curse-pulse 2s ease infinite}
.eg-cartouche.eg-immune{border-color:rgba(212,160,23,0.5);background:linear-gradient(135deg,rgba(212,160,23,0.2),rgba(194,166,69,0.1));
  box-shadow:inset 2px 2px 0 rgba(212,160,23,0.15),inset -2px -2px 0 rgba(0,0,0,0.12),0 0 10px rgba(212,160,23,0.3)}
@keyframes eg-curse-pulse{0%,100%{box-shadow:inset 2px 2px 0 rgba(204,48,48,0.1),inset -2px -2px 0 rgba(0,0,0,0.15),0 0 4px rgba(204,48,48,0.2)}
  50%{box-shadow:inset 2px 2px 0 rgba(204,48,48,0.15),inset -2px -2px 0 rgba(0,0,0,0.15),0 0 12px rgba(204,48,48,0.4)}}

.eg-seal-frame{width:36px;height:36px;flex-shrink:0;overflow:hidden;border-radius:2px;position:relative;
  border:2px solid var(--eg-gold);
  box-shadow:inset 2px 2px 0 rgba(255,235,180,0.2),inset -1px -1px 0 rgba(0,0,0,0.25)}
.eg-seal-frame img{width:100%;height:100%;object-fit:contain;display:block}
.eg-seal-frame::after{content:'';position:absolute;inset:0;
  box-shadow:inset 2px 2px 0 rgba(255,235,180,0.15),inset -1px -1px 0 rgba(0,0,0,0.2);pointer-events:none}

.eg-seal-name{font-family:'Cinzel',serif;font-size:0.75rem;font-weight:600;white-space:nowrap;letter-spacing:0.5px}
.eg-seal-tag{font-size:0.58rem;font-family:'Cinzel',serif;padding:1px 5px;letter-spacing:1px;
  border:1px solid rgba(194,166,69,0.25);border-radius:1px;text-transform:uppercase;margin-left:3px}

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

/* ═══ STONE SLAB REVEAL CONTROLS — monumental buttons ═══ */
.eg-reveal-bar{display:flex;gap:10px;align-items:center;justify-content:center;padding:12px 24px;flex-wrap:wrap;
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:100;max-width:860px;width:100%;
  background:linear-gradient(0deg,rgba(26,21,16,0.95),rgba(42,31,20,0.9));
  backdrop-filter:blur(8px);border-radius:0;
  box-shadow:0 -3px 0 rgba(194,166,69,0.2),0 -6px 20px rgba(0,0,0,0.5);
  border-top:3px solid rgba(194,166,69,0.15)}
.eg-reveal-bar::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:repeating-linear-gradient(90deg,var(--eg-gold) 0px,var(--eg-gold) 8px,transparent 8px,transparent 16px);opacity:0.2}
.eg-btn{font-family:'Cinzel',serif;font-size:0.75rem;padding:6px 18px;border:2px solid rgba(194,166,69,0.3);border-radius:2px;
  background:linear-gradient(180deg,rgba(194,166,69,0.12),rgba(194,166,69,0.04));color:var(--eg-gold);cursor:pointer;
  letter-spacing:2px;text-transform:uppercase;
  box-shadow:inset 1px 1px 0 rgba(255,235,180,0.1),inset -1px -1px 0 rgba(0,0,0,0.15),0 2px 4px rgba(0,0,0,0.2);
  transition:all 0.2s}
.eg-btn:hover{background:linear-gradient(180deg,rgba(194,166,69,0.2),rgba(194,166,69,0.08));border-color:var(--eg-gold);
  box-shadow:inset 1px 1px 0 rgba(255,235,180,0.15),inset -1px -1px 0 rgba(0,0,0,0.1),0 2px 6px rgba(212,160,23,0.2)}
.eg-btn.eg-btn-terra{border-color:rgba(184,92,56,0.3);background:linear-gradient(180deg,rgba(184,92,56,0.12),rgba(184,92,56,0.04));color:var(--eg-terra)}
.eg-btn.eg-btn-terra:hover{border-color:var(--eg-terra);background:linear-gradient(180deg,rgba(184,92,56,0.2),rgba(184,92,56,0.08))}

/* ═══ STONE INSCRIPTION HOST — carved decree panels ═══ */
.eg-host{font-family:'Cinzel',serif;font-size:0.85rem;color:var(--eg-terra);margin:10px 0;padding:10px 16px;
  border:none;border-radius:2px;position:relative;
  background:linear-gradient(135deg,rgba(184,92,56,0.06),rgba(194,166,69,0.04));
  box-shadow:inset 2px 2px 0 rgba(255,235,180,0.08),inset -2px -2px 0 rgba(0,0,0,0.1);
  text-shadow:0 1px 0 rgba(0,0,0,0.15);letter-spacing:0.3px;line-height:1.6}
.eg-host::before{content:'𓂋';position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:0.7rem;opacity:0.2}
.eg-host::after{content:'';position:absolute;bottom:0;left:8px;right:8px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(194,166,69,0.2),transparent)}
.eg-pyramid .eg-host{color:var(--eg-torch);background:linear-gradient(135deg,rgba(255,153,68,0.05),rgba(42,31,20,0.08));
  box-shadow:inset 2px 2px 0 rgba(255,153,68,0.06),inset -2px -2px 0 rgba(0,0,0,0.15)}
.eg-nile .eg-host{color:#4AC1D0;background:linear-gradient(135deg,rgba(74,193,208,0.05),rgba(14,42,62,0.08));
  box-shadow:inset 2px 2px 0 rgba(74,193,208,0.06),inset -2px -2px 0 rgba(0,0,0,0.15)}

/* ═══ STONE COLUMN SIDEBAR — stacked tablet sections ═══ */
.eg-sb-title{font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:2px;color:var(--eg-gold);text-transform:uppercase;
  margin:0 0 8px 0;padding:4px 6px;text-align:center;position:relative;
  text-shadow:0 1px 0 rgba(0,0,0,0.2);
  background:linear-gradient(135deg,rgba(194,166,69,0.08),transparent);
  box-shadow:inset 1px 1px 0 rgba(255,235,180,0.08),inset -1px -1px 0 rgba(0,0,0,0.08)}
.eg-sb-title::before,.eg-sb-title::after{content:'';position:absolute;top:50%;width:12px;height:1px;background:var(--eg-gold);opacity:0.25}
.eg-sb-title::before{left:0}.eg-sb-title::after{right:0}

.eg-sb-section{margin:10px 0;padding:6px;border-radius:2px;
  background:rgba(194,166,69,0.03);
  box-shadow:inset 1px 1px 0 rgba(255,235,180,0.05),inset -1px -1px 0 rgba(0,0,0,0.06)}

.eg-sb-row{display:flex;align-items:center;gap:5px;margin:3px 0;font-size:0.78rem;padding:2px 3px;
  border-bottom:1px solid rgba(194,166,69,0.06)}
.eg-sb-row:last-child{border-bottom:none}
.eg-sb-row img{width:22px;height:22px;border-radius:2px;object-fit:contain;flex-shrink:0;
  border:1.5px solid rgba(194,166,69,0.3);box-shadow:inset 1px 1px 0 rgba(255,235,180,0.1)}
.eg-sb-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:'Cinzel',serif;font-size:0.72rem}

.eg-sb-tag{font-family:'Cinzel',serif;font-size:0.55rem;padding:2px 5px;border-radius:1px;white-space:nowrap;
  letter-spacing:1px;text-transform:uppercase;border:1px solid currentColor;opacity:0.9}
.eg-sb-tag.eg-t-gold{color:var(--eg-gold);background:rgba(194,166,69,0.08);border-color:rgba(194,166,69,0.25)}
.eg-sb-tag.eg-t-green{color:var(--eg-success);background:rgba(58,138,42,0.08);border-color:rgba(58,138,42,0.25)}
.eg-sb-tag.eg-t-orange{color:var(--eg-torch);background:rgba(255,153,68,0.08);border-color:rgba(255,153,68,0.25)}
.eg-sb-tag.eg-t-red{color:var(--eg-danger);background:rgba(204,48,48,0.08);border-color:rgba(204,48,48,0.25)}
.eg-sb-tag.eg-t-blue{color:var(--eg-nile);background:rgba(27,107,122,0.08);border-color:rgba(27,107,122,0.25)}
.eg-sb-tag.eg-t-grey{color:#999;background:rgba(200,200,200,0.05);border-color:rgba(200,200,200,0.15)}

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

/* ═══ CHAMBER ECHOES — whispered ambient narration ═══ */
.eg-comm{font-family:'Cinzel',serif;font-size:0.7rem;color:var(--eg-muted);padding:6px 14px;margin:8px 0;
  line-height:1.5;text-align:center;position:relative;letter-spacing:0.5px;font-style:italic;
  opacity:0.7}
.eg-comm::before,.eg-comm::after{content:'𓃭';font-style:normal;font-size:0.5rem;opacity:0.25;vertical-align:middle}
.eg-comm::before{margin-right:8px}.eg-comm::after{margin-left:8px}
.eg-pyramid .eg-comm{color:rgba(232,213,168,0.45)}
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
.eg-frieze-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:4;text-align:center;white-space:nowrap;font-family:'Cinzel',serif;font-size:0.7rem;letter-spacing:3px;color:var(--eg-muted);text-transform:uppercase;height:16px;overflow:hidden}
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

/* ═══ CARVED STONE RANKINGS — engraved leaderboard plaques ═══ */
.eg-lb-row{display:flex;align-items:center;gap:6px;padding:6px 10px;margin:3px 0;border-radius:2px;font-size:0.85rem;
  background:linear-gradient(135deg,rgba(194,166,69,0.05),transparent);
  box-shadow:inset 1px 1px 0 rgba(255,235,180,0.06),inset -1px -1px 0 rgba(0,0,0,0.06);
  border-bottom:1px solid rgba(194,166,69,0.08)}
.eg-lb-row.eg-first{
  background:linear-gradient(135deg,rgba(212,160,23,0.12),rgba(194,166,69,0.06));
  box-shadow:inset 2px 2px 0 rgba(212,160,23,0.12),inset -2px -2px 0 rgba(0,0,0,0.1),0 2px 6px rgba(212,160,23,0.1);
  border-bottom:2px solid rgba(212,160,23,0.2)}
.eg-lb-rank{font-family:'Cinzel',serif;width:28px;text-align:center;color:var(--eg-terra);font-weight:700;font-size:0.8rem;
  text-shadow:0 1px 0 rgba(0,0,0,0.15)}
.eg-lb-name{flex:1;font-family:'Cinzel',serif;font-size:0.82rem;letter-spacing:0.3px}
.eg-lb-score{font-family:'Cinzel',serif;color:var(--eg-gold);font-size:0.78rem;font-weight:600;letter-spacing:0.5px}

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
  if (phase === 'eg-pyramid') return _sidebarPyramid(data);
  if (phase === 'eg-desert') return _sidebarDesert(data);
  if (phase === 'eg-nile') return _sidebarNile(data);
  if (phase === 'eg-winner') return _sidebarResults(data);
  return _sidebarRoster(data);
}

function _sidebarRoster(data) {
  const tribes = data.tribes;
  let h = '<div class="eg-sb-title">EXPEDITION ROSTER</div>';
  Object.entries(tribes).forEach(([tName, tData]) => {
    h += `<div class="eg-sb-section"><div style="font-family:'Cinzel',serif;font-size:0.68rem;font-weight:700;color:var(--eg-terra);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;text-shadow:0 1px 0 rgba(0,0,0,0.1)">${tName}</div>`;
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
  let h = '<div class="eg-sb-title">PYRAMID STATUS</div>';
  h += _buildHourglass(Math.min(100, (revIdx + 1) * 15));

  // Pyramid cross-section tracker
  h += '<div class="eg-pyramid-tracker">';
  const choices = data.phase1.choices || [];
  choices.forEach((c, i) => {
    const revealed = i <= revIdx;
    const isOver = c.path === 'over';
    const dotCls = revealed ? (isOver ? 'eg-over-dot' : 'eg-under-dot') : 'eg-hidden-dot';
    const x = isOver ? (20 + (i % 4) * 15) : (25 + (i % 3) * 20);
    const y = isOver ? (5 + (i % 3) * 8) : (45 + (i % 3) * 12);
    h += `<div class="eg-pyr-dot ${dotCls}" style="left:${x}%;top:${y}%" title="${revealed ? c.name + ' (' + c.path.toUpperCase() + ')' : '???'}"></div>`;
  });
  h += '</div>';

  h += '<div class="eg-sb-section"><div class="eg-sb-title">EXPLORERS</div>';
  choices.forEach((c, i) => {
    const sl = slug(c.name);
    const revealed = i <= revIdx;
    if (revealed) {
      const pathTag = c.path === 'over'
        ? '<span class="eg-sb-tag eg-t-orange">OVER</span>'
        : '<span class="eg-sb-tag eg-t-green">UNDER</span>';
      h += `<div class="eg-sb-row"><img src="assets/avatars/${sl}.png" alt="${c.name}" onerror="this.style.display='none'"><span class="eg-sb-name">${c.name}</span>${pathTag}</div>`;
    } else {
      h += `<div class="eg-sb-row"><img src="assets/avatars/${sl}.png" alt="${c.name}" onerror="this.style.display='none'"><span class="eg-sb-name">${c.name}</span><span class="eg-sb-tag eg-t-grey">???</span></div>`;
    }
  });
  h += '</div>';
  return h;
}

function _sidebarDesert(data) {
  const st = _tvState['eg-desert'];
  const revIdx = st ? st.idx : -1;
  let h = '<div class="eg-sb-title">CARAVAN STATUS</div>';
  h += _buildHourglass(Math.min(100, 33 + (revIdx + 1) * 10));

  Object.entries(data.tribes).forEach(([tName, tData]) => {
    const reward = tData.reward || 'stick';
    const rewardIcon = reward === 'camel' ? _icon('camel') : reward === 'goat' ? _icon('camel') : _icon('stick');
    const tagCls = reward === 'camel' ? 'eg-t-gold' : reward === 'goat' ? 'eg-t-orange' : 'eg-t-grey';
    h += `<div class="eg-sb-section"><div style="font-family:'Cinzel',serif;font-size:0.68rem;font-weight:700;color:var(--eg-terra);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;text-shadow:0 1px 0 rgba(0,0,0,0.1)">${rewardIcon} ${tName}</div>`;
    h += `<span class="eg-sb-tag ${tagCls}">${reward.toUpperCase()}</span>`;
    // Leader
    const leader = data.phase2.leaders?.[tName];
    if (leader && revIdx >= 0) {
      h += `<div style="font-family:'Cinzel',serif;font-size:0.63rem;color:var(--eg-muted);margin-top:2px;letter-spacing:0.5px">Navigator: ${leader.navigator}</div>`;
    }
    h += '</div>';
  });

  if (data.phase2.stickLost && revIdx >= 3) {
    h += '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:var(--eg-danger);margin-top:6px;font-style:italic;text-shadow:0 1px 0 rgba(0,0,0,0.15)">𓃭 The divining rod has been lost!</div>';
  }
  return h;
}

function _sidebarNile(data) {
  const st = _tvState['eg-nile'];
  const revIdx = st ? st.idx : -1;
  let h = '<div class="eg-sb-title">NILE CROSSING</div>';
  h += _buildHourglass(Math.min(100, 66 + (revIdx + 1) * 5));

  Object.entries(data.tribes).forEach(([tName, tData]) => {
    const bq = tData.boatQuality || 0;
    const bd = tData.boatDamage || 0;
    const integrity = Math.max(0, Math.min(100, Math.round((bq - bd) / Math.max(1, bq) * 100)));
    const barCls = integrity > 60 ? 'eg-green' : integrity > 30 ? 'eg-orange' : 'eg-red';

    h += `<div class="eg-sb-section"><div style="font-size:0.7rem;font-weight:700;margin-bottom:3px">${tName}</div>`;
    h += `<div style="font-family:'Cinzel',serif;font-size:0.58rem;color:var(--eg-muted);letter-spacing:0.5px">Boat Integrity</div>`;
    h += `<div class="eg-bar-wrap"><div class="eg-bar ${barCls}" style="width:${integrity}%"></div></div>`;
    h += '</div>';
  });

  // Croc attack count
  const crocCount = data.phase3.crocAttacks?.filter((_, i) => i <= revIdx).length || 0;
  h += `<div style="font-family:'Cinzel',serif;font-size:0.63rem;color:var(--eg-muted);margin-top:6px;letter-spacing:0.5px">${_icon('croc')} Croc attacks: ${crocCount}</div>`;

  return h;
}

function _sidebarResults(data) {
  let h = '<div class="eg-sb-title">FINAL STANDINGS</div>';
  const finishOrder = data.tribeFinishOrder || [];
  finishOrder.forEach((tName, i) => {
    const tag = i === 0 ? '<span class="eg-sb-tag eg-t-gold">IMMUNE</span>'
      : i === finishOrder.length - 1 ? '<span class="eg-sb-tag eg-t-red">TRIBAL</span>'
      : '<span class="eg-sb-tag eg-t-green">SAFE</span>';
    h += `<div class="eg-sb-row"><span class="eg-sb-name" style="font-weight:700">#${i + 1} ${tName}</span>${tag}</div>`;
    const members = data.tribes[tName]?.members || [];
    members.forEach(n => {
      const sl = slug(n);
      h += `<div class="eg-sb-row" style="margin-left:10px"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.style.display='none'"><span class="eg-sb-name">${n}</span></div>`;
    });
  });
  return h;
}


// ══════════════════════════════════════════════════════════════
// SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildEgyptTitleCard(ep) {
  const data = ep.walkEgypt;
  if (!data) return '<div>No challenge data</div>';

  const tribes = Object.entries(data.tribes);
  let rosterCards = tribes.map(([tName, tData]) =>
    `<div style="display:inline-block;margin:8px;vertical-align:top">
      <div style="font-family:'Cinzel',serif;font-size:0.8rem;letter-spacing:3px;color:var(--eg-terra);margin-bottom:6px;text-shadow:1px 1px 0 rgba(0,0,0,0.2);text-transform:uppercase">${tName}</div>
      <div style="display:flex;flex-wrap:wrap;gap:3px">${tData.members.map(n => _cartouche(n, '', '')).join('')}</div>
    </div>`
  ).join('');

  const content = `
    <div class="eg-h1" style="font-size:2rem;margin:20px 0 6px">WALK LIKE AN EGYPTIAN</div>
    <div style="text-align:center;font-family:'Cinzel',serif;font-size:0.72rem;color:var(--eg-muted);letter-spacing:5px;margin-bottom:16px;text-shadow:0 1px 0 rgba(0,0,0,0.15)">𓂀 IMMUNITY CHALLENGE 𓂀</div>
    <div class="eg-host">${data.hostLines?.intro || ''}</div>
    <div style="text-align:center;margin:16px 0">${rosterCards}</div>
    <div style="margin-top:16px;text-align:center">
      <div class="eg-card" style="display:inline-block;max-width:440px;text-align:left">
        <div class="eg-h3">𓏏 EXPEDITION PARAMETERS</div>
        <div style="font-size:0.82rem;line-height:1.7;font-family:'Cinzel',serif">
          <b style="color:var(--eg-torch)">𓊖 PHASE I</b> — Pyramid Over/Under<br>
          <b style="color:var(--eg-terra)">𓇳 PHASE II</b> — Desert Trek + Reward Animals<br>
          <b style="color:var(--eg-nile)">𓈗 PHASE III</b> — Nile Crossing + Crocodile Gauntlet<br>
          <span style="color:var(--eg-pharaoh-gold);font-size:0.78rem;display:block;margin-top:4px;text-shadow:0 1px 0 rgba(0,0,0,0.15)">First tribe across wins immunity. Last tribe faces tribal council.</span>
        </div>
      </div>
    </div>`;

  if (!window._egScreenBuilders) window._egScreenBuilders = {};
  window._egScreenBuilders['eg-title'] = rpBuildEgyptTitleCard;
  return _shell(content, ep, '');
}


// ══════════════════════════════════════════════════════════════
// SCREEN 2: PYRAMID OVER/UNDER
// ══════════════════════════════════════════════════════════════
export function rpBuildEgyptPyramid(ep) {
  const data = ep.walkEgypt;
  if (!data?.phase1) return '';
  const p1 = data.phase1;
  const st = _ensureState('eg-pyramid', (p1.choices?.length || 0));

  let cards = '';
  cards += `<div class="eg-h2">Phase 1: Pyramid Over/Under</div>`;
  cards += `<div class="eg-host">${data.hostLines?.phase1 || ''}</div>`;

  // Add comm chatter
  const comm = pick(COMM_CHATTER['eg-pyramid']);
  cards += `<div class="eg-comm">${comm}</div>`;

  (p1.choices || []).forEach((c, i) => {
    const vis = st.idx >= i ? 'eg-visible' : '';
    const pathCls = c.path === 'over' ? 'eg-over' : 'eg-under';
    const icon = c.path === 'over' ? _icon('climb') : _icon('door');

    let detail = '';
    if (c.path === 'over') {
      const match = (p1.overBeats || []).find(b => b.name === c.name);
      if (match) (match.beats || []).forEach(b => {
        const bIcon = b.method === 'surf_collision' ? _icon('collision') : b.method?.startsWith('surf') ? _icon('surf') : _icon('climb');
        detail += `<div style="margin:3px 0;font-size:0.82rem">${bIcon} ${b.text}</div>`;
      });
      if (c.summitView) detail += `<div style="margin:3px 0;font-size:0.82rem;color:var(--eg-pharaoh-gold)">${_icon('summit')} Summit view acquired — shortcut spotted for Phase 2!</div>`;
    } else {
      const match = (p1.underBeats || []).find(b => b.name === c.name);
      if (match) (match.beats || []).forEach(b => {
        const beatIcon = b.type === 'door' ? _icon('door') : b.type?.includes('scarab') ? _icon('scarab') : b.type?.includes('mummy') ? _icon('mummy') : b.type?.includes('collapse') ? _icon('alert') : _icon('trap');
        detail += `<div style="margin:3px 0;font-size:0.82rem">${beatIcon} ${b.text}</div>`;
      });
    }

    // Mummified dog
    if (p1.mummifiedDog && p1.mummifiedDog.player === c.name) {
      detail += `<div class="eg-card eg-curse" style="margin-top:6px">${_icon('curse')} ${p1.mummifiedDog.text || `${c.name} discovered the Mummified Dog. The curse takes hold...`}</div>`;
    }

    const scoreDisplay = Math.round((c.score || 0) * 10) / 10;
    cards += `<div class="eg-step ${vis}"><div class="eg-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        ${_cartouche(c.name, pathCls)}
        ${icon}
        <span style="font-family:'Cinzel',serif;font-size:0.7rem;color:var(--eg-muted)">${c.path.toUpperCase()} • ${scoreDisplay} pts</span>
      </div>
      ${detail}
    </div></div>`;
  });

  // Reveal bar
  const total = p1.choices?.length || 0;
  cards += `<div class="eg-reveal-bar">
    <button class="eg-btn" onclick="egyptRevealNext('eg-pyramid',${total})">NEXT ▶</button>
    <span style="font-family:'Cinzel',serif;font-size:0.72rem;color:var(--eg-gold)" id="eg-counter-eg-pyramid">0/${total}</span>
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

  // Count total steps: leaders + nav beats + scarab + social events
  const allSteps = [];
  // Reward assignment
  allSteps.push({ type: 'reward', text: '' });
  // Leaders
  Object.entries(p2.leaders || {}).forEach(([tName, leader]) => {
    allSteps.push({ type: 'leader', tribe: tName, data: leader });
  });
  // Nav beats
  (p2.navBeats || []).forEach(nb => allSteps.push({ type: 'nav', data: nb }));
  // Scarab swarm
  (p2.scarabSwarm || []).forEach(sw => allSteps.push({ type: 'scarab', data: sw }));
  // Social events
  (p2.socialEvents || []).forEach(se => allSteps.push({ type: 'social', data: se }));

  const total = allSteps.length;
  const st = _ensureState('eg-desert', total);

  let cards = '';
  cards += `<div class="eg-h2">Phase 2: Desert Trek</div>`;
  cards += `<div class="eg-host">${data.hostLines?.phase2 || ''}</div>`;

  const comm = pick(COMM_CHATTER['eg-desert']);
  cards += `<div class="eg-comm">${comm}</div>`;

  allSteps.forEach((step, i) => {
    const vis = st.idx >= i ? 'eg-visible' : '';
    let cardContent = '';

    if (step.type === 'reward') {
      let rewardCards = Object.entries(data.tribes).map(([tName, tData]) => {
        const r = tData.reward || 'stick';
        const icon = _icon(r === 'stick' ? 'stick' : 'camel');
        return `<div style="margin:4px 0">${icon} <b>${tName}</b>: ${r.toUpperCase()}</div>`;
      }).join('');
      cardContent = `<div class="eg-card"><div class="eg-h3">Reward Assignment</div>${rewardCards}</div>`;
    } else if (step.type === 'leader') {
      const l = step.data;
      cardContent = `<div class="eg-card">${_icon('navigate')} ${l.beat?.text || `${l.navigator} takes the lead for ${step.tribe}.`}</div>`;
    } else if (step.type === 'nav') {
      const nb = step.data;
      const icon = nb.success ? _icon('navigate') : _icon('sand');
      cardContent = `<div class="eg-card">${icon} ${nb.text}</div>`;
    } else if (step.type === 'scarab') {
      const sw = step.data;
      const icon = _icon('scarab');
      cardContent = `<div class="eg-card">${icon} ${sw.text}</div>`;
    } else if (step.type === 'social') {
      const se = step.data;
      const icon = se.subtype === 'seduction' ? _icon('eye') : se.subtype === 'alliance' ? _icon('bond') : _icon('alert');
      cardContent = `<div class="eg-card eg-social">${icon} ${se.text}</div>`;
    }

    cards += `<div class="eg-step ${vis}">${cardContent}</div>`;
  });

  cards += `<div class="eg-reveal-bar">
    <button class="eg-btn" onclick="egyptRevealNext('eg-desert',${total})">NEXT ▶</button>
    <span style="font-family:'Cinzel',serif;font-size:0.72rem;color:var(--eg-gold)" id="eg-counter-eg-desert">0/${total}</span>
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
  // Weaving
  (p3.weaving || []).forEach(w => allSteps.push({ type: 'weave', data: w }));
  // Animal loading
  (p3.animalLoading || []).forEach(al => allSteps.push({ type: 'load', data: al }));
  // Rowing beats
  (p3.rowingBeats || []).forEach(rb => allSteps.push({ type: 'row', data: rb }));
  // Croc attacks interleaved
  (p3.crocAttacks || []).forEach(ca => allSteps.push({ type: 'croc', data: ca }));
  // Final sprint
  (p3.finalSprint || []).forEach(fs => allSteps.push({ type: 'sprint', data: fs }));

  const total = allSteps.length;
  const st = _ensureState('eg-nile', total);

  let cards = '';
  cards += `<div class="eg-h2">Phase 3: Nile Crossing</div>`;
  cards += `<div class="eg-host">${data.hostLines?.phase3 || ''}</div>`;

  const comm = pick(COMM_CHATTER['eg-nile']);
  cards += `<div class="eg-comm">${comm}</div>`;

  // Rising water line (percentage based on reveal progress)
  const waterPct = Math.min(70, (st.idx + 1) / Math.max(1, total) * 70);
  cards += `<div class="eg-water-rise" style="height:${waterPct}%"></div>`;

  allSteps.forEach((step, i) => {
    const vis = st.idx >= i ? 'eg-visible' : '';
    let cardContent = '';

    if (step.type === 'weave') {
      const w = step.data;
      const icon = _icon('weave');
      const cls = w.isProdigy ? 'eg-card eg-hero-card' : 'eg-card';
      cardContent = `<div class="${cls}">${icon} ${w.text}</div>`;
    } else if (step.type === 'load') {
      const al = step.data;
      const icon = _icon('camel');
      cardContent = `<div class="eg-card">${icon} ${al.text}</div>`;
    } else if (step.type === 'row') {
      const rb = step.data;
      const icon = _icon('row');
      cardContent = `<div class="eg-card">${icon} ${rb.text}</div>`;
    } else if (step.type === 'croc') {
      const ca = step.data;
      const icon = _icon('croc');
      const cls = ca.isHeroSave ? 'eg-card eg-hero-card' : ca.isVillainShove ? 'eg-card eg-villain-card' : 'eg-card';
      cardContent = `<div class="${cls}">${icon} ${ca.text}</div>`;
    } else if (step.type === 'sprint') {
      const fs = step.data;
      const icon = fs.isSinking ? _icon('alert') : _icon('boat');
      const cls = fs.isSinking ? 'eg-card eg-curse' : 'eg-card';
      cardContent = `<div class="${cls}">${icon} ${fs.text}</div>`;
    }

    cards += `<div class="eg-step ${vis}">${cardContent}</div>`;
  });

  cards += `<div class="eg-reveal-bar">
    <button class="eg-btn" onclick="egyptRevealNext('eg-nile',${total})">NEXT ▶</button>
    <span style="font-family:'Cinzel',serif;font-size:0.72rem;color:var(--eg-gold)" id="eg-counter-eg-nile">0/${total}</span>
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
  let content = '';
  content += `<div class="eg-h1">CHALLENGE RESULTS</div>`;

  // Finish order
  finishOrder.forEach((tName, i) => {
    const tData = data.tribes[tName] || {};
    const members = tData.members || [];
    const cls = i === 0 ? 'eg-card eg-winner-card' : i === finishOrder.length - 1 ? 'eg-card eg-curse' : 'eg-card';
    const label = i === 0 ? 'IMMUNITY' : i === finishOrder.length - 1 ? 'TRIBAL COUNCIL' : 'SAFE';
    const tagCls = i === 0 ? 'eg-t-gold' : i === finishOrder.length - 1 ? 'eg-t-red' : 'eg-t-green';

    content += `<div class="${cls}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span class="eg-h3">#${i + 1} — ${tName}</span>
        <span class="eg-sb-tag ${tagCls}">${label}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:3px">
        ${members.map(n => _cartouche(n, i === 0 ? 'eg-immune' : '')).join('')}
      </div>
      <div style="font-family:'Cinzel',serif;font-size:0.7rem;color:var(--eg-muted);margin-top:6px;letter-spacing:0.5px;text-shadow:0 1px 0 rgba(0,0,0,0.1)">
        Reward: ${tData.reward?.toUpperCase() || '—'} · Score: ${Math.round(tData.totalScore * 10) / 10}
      </div>
    </div>`;
  });

  // Host finish lines
  if (data.hostLines?.finish1st) content += `<div class="eg-host">${data.hostLines.finish1st}</div>`;
  if (data.hostLines?.finish2nd) content += `<div class="eg-host">${data.hostLines.finish2nd}</div>`;
  if (data.hostLines?.finishLast) content += `<div class="eg-host">${data.hostLines.finishLast}</div>`;

  // Individual leaderboard
  content += `<div class="eg-h2" style="margin-top:16px">Individual Scores</div>`;
  const scores = Object.entries(ep.chalMemberScores || {}).sort(([, a], [, b]) => b - a);
  scores.forEach(([name, score], i) => {
    const sl = slug(name);
    content += `<div class="eg-lb-row ${i === 0 ? 'eg-first' : ''}">
      <span class="eg-lb-rank">#${i + 1}</span>
      <img src="assets/avatars/${sl}.png" alt="${name}" style="width:22px;height:22px;border-radius:2px;object-fit:contain;border:1.5px solid rgba(194,166,69,0.3)" onerror="this.style.display='none'">
      <span class="eg-lb-name">${name}</span>
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
