// js/chal/amazon-race.js — The Am-AH-Zon Race: pre-merge tribe challenge (jungle trek, 4 phases)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function portrait(name, size = 42) {
  const sl = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${sl}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);
function canScheme(name) {
  const a = arch(name);
  if (VILLAIN_ARCHS.has(a)) return true;
  if (NICE_ARCHS.has(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════

// ── ZIPLINE ──
const ZIP_CLEAN = [
  (n, pr) => `${n} launches off the platform and glides across the river. Clean. Fast. ${pr.Sub} barely touches the landing pad.`,
  (n, pr) => `${n} grabs the handle with both hands and rockets across the gap. The harness barely shakes.`,
  (n, pr) => `Perfect form from ${n}. ${pr.Sub} zips across like ${pr.sub}'s done this a hundred times.`,
  (n, pr) => `${n} doesn't hesitate. One deep breath, one launch, and ${pr.sub}'s across before anyone can blink.`,
  (n, pr) => `The zipline sings as ${n} flies across. ${pr.Sub} hits the platform on the other side with a confident thud.`,
  (n, pr) => `${n} locks in and goes. Gravity and guts carry ${pr.obj} across in record time.`,
];

const ZIP_SLOW = [
  (n, pr) => `${n} makes it across, but it's not pretty. ${pr.Sub} wobbles the whole way and lands with a stumble.`,
  (n, pr) => `${n} grips the handle too tight and slows ${pr.ref} down. The crossing takes twice as long as it should.`,
  (n, pr) => `${n} gets across, but the wind catches ${pr.obj} mid-crossing. ${pr.Sub} swings wide and lands off-center.`,
  (n, pr) => `${n} white-knuckles the entire crossing. ${pr.Sub} arrives shaking but intact.`,
  (n, pr) => `The harness jams slightly under ${n}'s weight. ${pr.Sub} has to kick-start the slide halfway across.`,
  (n, pr) => `${n} makes it, but ${pr.posAdj} technique needs work. That was more controlled falling than zipline skill.`,
];

const ZIP_FREEZE = [
  (n, pr) => `${n} stands at the edge of the platform and can't move. ${pr.posAdj} legs are locked. The height has ${pr.obj}.`,
  (n, pr) => `"I can't do this." ${n} backs away from the edge. ${pr.posAdj} teammates shout encouragement but ${pr.sub} is paralyzed.`,
  (n, pr) => `${n} looks down at the river below and goes pale. ${pr.Sub}'s not going anywhere without a push.`,
  (n, pr) => `The platform sways in the wind. ${n} grabs the railing and refuses to let go. Full freeze.`,
  (n, pr) => `${n}'s hands are shaking. ${pr.Sub} reaches for the handle three times before pulling back each time.`,
  (n, pr) => `"Nope. Nope. Nope." ${n} takes one look at the gap and plants ${pr.ref} on the platform.`,
];

const ZIP_FRAY = [
  (n, pr) => `The rope frays under ${n}'s weight! ${pr.Sub} drops two feet before the backup cable catches. Heart-stopping.`,
  (n, pr) => `${n} hears the rope snap mid-crossing. For one terrible second ${pr.sub} thinks it's over. The secondary line holds.`,
  (n, pr) => `A loud CRACK from the zipline as ${n} crosses. The rope shreds but doesn't break. ${pr.Sub} arrives shaken.`,
  (n, pr) => `${n}'s zipline starts unraveling halfway across. ${pr.Sub} speeds up, racing the fraying rope to the other side.`,
  (n, pr) => `The wind catches ${n} at the worst moment. The rope strains and a fiber pops. ${pr.Sub} feels the jolt in ${pr.posAdj} arms.`,
  (n, pr) => `${n} feels the zipline dip suddenly. Something's wrong with the rope. ${pr.Sub} pulls ${pr.posAdj} legs up and prays.`,
];

const ZIP_GUST = [
  (n, pr) => `A gust of wind slams into ${n} mid-crossing. ${pr.Sub} spins sideways and nearly loses ${pr.posAdj} grip.`,
  (n, pr) => `Wind hits ${n} broadside. The zipline swings wildly. ${pr.Sub} hangs on but loses precious seconds.`,
  (n, pr) => `A sudden crosswind catches ${n}. ${pr.Sub} pendulums back and forth over the river before regaining control.`,
  (n, pr) => `The jungle wind picks up just as ${n} crosses. ${pr.Sub} gets buffeted around like a leaf.`,
  (n, pr) => `${n} was making great time until the wind decided otherwise. ${pr.Sub} fights the gust and barely makes it.`,
  (n, pr) => `Nature doesn't cooperate. A blast of humid air hits ${n} and ${pr.sub} grinds to a halt mid-line.`,
];

const ZIP_ENCOURAGE = [
  (a, b) => `"You got this, ${b}!" ${a} shouts from below. The support is genuine.`,
  (a, b) => `${a} cups ${pronouns(a).posAdj} hands and yells up: "Don't look down! Just go!" ${b} nods and launches.`,
  (a, b) => `${a} starts a chant: "${b}! ${b}! ${b}!" The tribe joins in. It helps.`,
  (a, b) => `"I did it, you can too!" ${a} calls to ${b}. The encouragement breaks through the fear.`,
  (a, b) => `${a} gives ${b} a thumbs up from below. Simple gesture. Big effect.`,
  (a, b) => `"Eyes on the landing pad, not the river!" ${a}'s advice saves ${b}'s crossing.`,
];

const ZIP_HECKLE = [
  (a, b) => `"Oh come ON, ${b}!" ${a} is not impressed with the hesitation. "My grandma crosses faster!"`,
  (a, b) => `${a} watches ${b} freeze and rolls ${pronouns(a).posAdj} eyes. "We're going to lose because of you."`,
  (a, b) => `"Any day now, ${b}!" ${a} taps ${pronouns(a).posAdj} wrist impatiently.`,
  (a, b) => `${a} mutters just loud enough for ${b} to hear: "Should've left ${pronouns(b).obj} at camp."`,
  (a, b) => `"You're embarrassing us." ${a} doesn't whisper it. ${b} hears every word.`,
  (a, b) => `${a} looks at the other tribe's progress, then back at ${b}. The disappointment is visible.`,
];

// ── ZIPLINE DEBATE ──
const ZIP_ADVOCATE_TBAR = [
  (n, pr) => `${n} grabs the T-Bar and hoists it overhead. "One handle. Two hands. You grip it, you ride it, you land. Simple."`,
  (n, pr) => `"The T-Bar is right there. It's literally designed for this." ${n} taps the handle. "Why are we overthinking it?"`,
  (n, pr) => `"T-Bar. Standard equipment. One at a time, nice and clean." ${n} demonstrates the grip. "Just hold on tight."`,
  (n, pr) => `${n} tests the T-Bar weight. "Solid metal handle, strong cable. This is the safest way across. No improvising needed."`,
  (n, pr) => `"We take turns on the T-Bar. One crosses, sends it back, next person goes. Efficient." ${n} is practical.`,
  (n, pr) => `${n} points at the T-Bar. "It's literally hanging RIGHT THERE. Someone built this for a reason. Let's use it."`,
];

const ZIP_ADVOCATE_BELT = [
  (n, pr) => `${n} unbuckles ${pr.posAdj} belt and loops it over the cable. "Improvise. Belt over the line, lean back, ride the friction. Faster than waiting for the T-Bar."`,
  (n, pr) => `"We only have ONE T-Bar. That means waiting." ${n} holds up ${pr.posAdj} belt. "Everyone's got a belt. Everyone crosses at once."`,
  (n, pr) => `${n} whips off ${pr.posAdj} belt and tests it. "Leather holds. Trust me. Wrap it over the line, you slide down smooth. No waiting."`,
  (n, pr) => `"Belt slide. I saw someone do it once — coolest thing ever." ${n} grins. "Speed plus style. We'll be across before the other tribe starts."`,
  (n, pr) => `${n} examines the cable. "Thin enough for a belt loop. Everyone crosses simultaneously instead of one at a time. We save minutes."`,
  (n, pr) => `"Real adventurers improvise." ${n} cracks ${pr.posAdj} belt like a whip. "Belt over the cable. Everyone crosses together."`,
];

const ZIP_ADVOCATE_PIGGYBACK = [
  (n, pr) => `"Pairs. One person rides, one person carries. We cut our crossings in half." ${n} nods. "Nobody crosses alone."`,
  (n, pr) => `${n} looks at the platform height. "Some of us are going to freeze up there. You ride on your partner's back — they jump for you."`,
  (n, pr) => `"Piggyback. The strong carry the light. Two people per trip means fewer trips." ${n} sizes up the tribe.`,
  (n, pr) => `${n} gestures between teammates. "Pair up — strong with light. The carrier grips the line, the rider hangs on. Half the crossings."`,
  (n, pr) => `"I've seen what happens when scared people cross alone. They freeze. But nobody freezes with a partner on their back." ${n} is serious.`,
  (n, pr) => `${n} puts ${pr.posAdj} arm around the nearest teammate. "Hop on. We do this TOGETHER. Half the trips, twice the speed."`,
];

const ZIP_INTERJECT = {
  hothead: [
    (n, pr, target) => `"Just PICK something!" ${n} explodes. "We've been standing on this platform arguing while the other tribe crosses!"`,
    (n, pr, target) => `${n} kicks the platform railing. "T-Bar, belt, piggyback — I don't CARE. Just stop TALKING and GO!"`,
    (n, pr, target) => `"You know what? Forget it." ${n} grabs the cable. "I'll cross with my bare hands if I have to."`,
    (n, pr, target) => `${n} shoves past ${target}. "You want to debate? Do it while I'm already on the other side."`,
  ],
  hero: [
    (n, pr, target) => `"Whatever keeps everyone safe." ${n} steps between the arguing champions. "I'll go first and test it."`,
    (n, pr, target) => `${n} raises a hand. "Can we pick the method where nobody falls into the river? That'd be great."`,
    (n, pr, target) => `"I trust ${target}'s plan," ${n} says. "But if anyone freezes up there, I'm coming back for them."`,
  ],
  villain: [
    (n, pr, target) => `${n} watches the debate with a thin smile. "Let ${target} pick. I'll remember who chose wrong."`,
    (n, pr, target) => `"Sure, ${target}. Your method." ${n}'s tone drips. "I'll be watching from the landing pad."`,
    (n, pr, target) => `${n} folds ${pr.posAdj} arms. "Belt slide? Perfect. More chances for someone's pants to fall off."`,
  ],
  schemer: [
    (n, pr, target) => `"What if the other tribe took the T-Bar already?" ${n} tilts ${pr.posAdj} head. "Has anyone thought about that?"`,
    (n, pr, target) => `${n} whispers to ${target}: "Let someone else champion a method. Then if it fails, it's not on you."`,
    (n, pr, target) => `"Interesting plan," ${n} murmurs, cataloging every word. "I'll go along with whatever. For now."`,
  ],
  socialButterfly: [
    (n, pr, target) => `"Guys! GUYS!" ${n} claps ${pr.posAdj} hands. "Both methods work! Let's just VOTE and GO!"`,
    (n, pr, target) => `${n} bounces on ${pr.posAdj} toes. "I think ${target}'s onto something! Come on, let's try it!"`,
    (n, pr, target) => `"Can we all just get along for like five minutes?" ${n} beams at the tribe. "Pick a method and jump!"`,
  ],
  loyal: [
    (n, pr, target) => `"I'm with ${target}," ${n} says simply. "Whatever method ${pronouns(target).sub} picks, I'm in."`,
    (n, pr, target) => `${n} nods at ${target}. "Your call. I'll cross however you say."`,
  ],
  challenge: [
    (n, pr, target) => `${n} cracks ${pr.posAdj} knuckles. "T-Bar, belt, bare hands — doesn't matter. Just point me at the line."`,
    (n, pr, target) => `"I could cross this thing with my teeth." ${n} flexes. "Pick a method, ${target}. I'll make it work."`,
  ],
  underdog: [
    (n, pr, target) => `${n} raises a tentative hand. "Um — what about the piggyback option? Asking for... myself."`,
    (n, pr, target) => `"I'll do whatever," ${n} says quietly. "I just don't want to be the one whose belt snaps."`,
  ],
};

const ZIP_DECISION = [
  (winner, tech, pr) => `The tribe locks in. ${winner} clenches a fist. "${tech}. Let's go." The debate is over.`,
  (winner, tech, pr) => `${winner} won the argument. The dissenters grumble but fall in line. ${tech} it is.`,
  (winner, tech, pr) => `"Settled." ${winner} claps once. "${tech}. Everybody on the platform. NOW."`,
  (winner, tech, pr) => `${winner}'s plan carries. Nods around the tribe. ${tech}. No going back.`,
  (winner, tech, pr) => `The vote is clear. ${winner} grins — ${pr.sub} called it. The tribe moves to the platform with ${tech} locked in.`,
  (winner, tech, pr) => `${winner} reads the room right. "${tech}." The tribe nods. Confidence is contagious.`,
];

const ZIP_LANDING = [
  (tn, tech) => `${host()} sizes up ${tn}'s performance. "${tech} was... a choice. Some of you made it look easy. Others, not so much."`,
  (tn, tech) => `"Okay ${tn}, that's a wrap on the zipline!" ${host()} checks the clipboard. "Your technique worked. Mostly."`,
  (tn, tech) => `${host()} slow-claps as the last ${tn} member lands. "${tech}. Bold. Let's see if it was the right call."`,
  (tn, tech) => `"Everybody across? Good. Nobody died? Even better." ${host()} makes a note. "${tn}'s zipline is in the books."`,
  (tn, tech) => `${host()} watches ${tn} regroup on the far side. "The ${tech} approach. I'll remember that. The audience will too."`,
  (tn, tech) => `"Well THAT was entertaining." ${host()} grins as ${tn} catches their breath. "The zipline never disappoints."`,
];

// ── TREK ──
const TREK_GOOD_NAV = [
  (n, pr) => `${n} reads the terrain like a map. ${pr.Sub} guides the tribe through a gap in the underbrush without losing a step.`,
  (n, pr) => `"This way." ${n} spots a break in the canopy and leads the tribe onto solid ground. Good call.`,
  (n, pr) => `${n} finds a game trail that cuts through the dense undergrowth. The tribe saves valuable time.`,
  (n, pr) => `${n}'s instincts are sharp. ${pr.Sub} picks the right fork without hesitating.`,
  (n, pr) => `The path splits and ${n} reads the moss, the light, the slope. Left. Perfect choice.`,
  (n, pr) => `${n} notices the vegetation thinning ahead. ${pr.Sub} pushes the tribe that direction. It opens up beautifully.`,
  (n, pr) => `Years of hiking pay off. ${n} finds the fastest route through the thicket by reading the root patterns.`,
  (n, pr) => `${n} keeps the pace steady and the direction true. The tribe trusts ${pr.posAdj} judgment completely.`,
];

const TREK_BAD_NAV = [
  (n, pr) => `${n} leads the tribe into a dead end of tangled roots. Everyone has to backtrack. Time wasted.`,
  (n, pr) => `"I think it's this way..." ${n} doesn't sound confident. ${pr.Sub}'s right to be uncertain — it's wrong.`,
  (n, pr) => `${n} second-guesses ${pr.ref} three times. The tribe follows ${pr.obj} in circles.`,
  (n, pr) => `The trail ${n} picked looked promising. It wasn't. Dense vegetation forces a costly detour.`,
  (n, pr) => `${n}'s sense of direction fails spectacularly. The tribe ends up further from the goal than when they started.`,
  (n, pr) => `${n} misreads the canopy. The route ${pr.sub} chose leads straight into impassable terrain.`,
  (n, pr) => `"Trust me, I know where we're going." ${n} does not, in fact, know where they're going.`,
  (n, pr) => `${n} picks the absolute worst possible path. Even the bugs seem surprised to see the tribe here.`,
];

const TREK_SNAKE = [
  (n, pr) => `A pit of writhing serpents blocks the path! ${n} spots it just in time and pulls the tribe back.`,
  (n, pr) => `${n} nearly steps on a coiled snake the size of ${pr.posAdj} arm. The hiss stops everyone cold.`,
  (n, pr) => `Snakes. Everywhere. ${n} freezes as dozens of scaled bodies shift across the trail ahead.`,
  (n, pr) => `The ground moves. ${n} looks down and realizes the "roots" are snakes. ${pr.Sub} jumps backward.`,
  (n, pr) => `A massive serpent drops from a branch in front of ${n}. ${pr.Sub} nearly falls backwards into ${pr.posAdj} teammates.`,
  (n, pr) => `${n} hears the rattle before ${pr.sub} sees the nest. Quick reflexes save ${pr.obj} from a nasty bite.`,
];

const TREK_VINE = [
  (n, pr) => `A tangle of vines snags ${n}'s ankle and sends ${pr.obj} crashing to the jungle floor.`,
  (n, pr) => `${n} gets caught in a web of hanging vines. ${pr.Sub} thrashes to get free, losing time and energy.`,
  (n, pr) => `Thick vines wrap around ${n}'s legs. It takes two teammates to cut ${pr.obj} loose.`,
  (n, pr) => `${n} pushes through a vine curtain and gets completely tangled. The tribe has to stop and help.`,
  (n, pr) => `A trip-wire of jungle vines catches ${n} mid-stride. ${pr.Sub} goes down hard.`,
  (n, pr) => `The vines are alive here. Or they might as well be — ${n} can't take a step without getting snagged.`,
];

const TREK_QUICKSAND = [
  (n, pr) => `${n} steps into what looks like solid ground and sinks to ${pr.posAdj} knees. Quicksand!`,
  (n, pr) => `"I'm sinking!" ${n} is up to ${pr.posAdj} thighs before anyone reacts. The mud pulls hard.`,
  (n, pr) => `The ground swallows ${n}'s foot. Then ${pr.posAdj} calf. Then ${pr.posAdj} knee. Classic quicksand trap.`,
  (n, pr) => `${n} walks right into a quicksand pocket. ${pr.Sub} thrashes, which only makes it worse.`,
  (n, pr) => `Mud that isn't just mud. ${n} realizes too late that ${pr.sub}'s in quicksand and going down fast.`,
  (n, pr) => `${n} tries to pull ${pr.posAdj} leg free but the suction holds. The jungle floor has ${pr.obj}.`,
];

const TREK_SWARM = [
  (n, pr) => `A cloud of insects erupts from the undergrowth and engulfs ${n}. ${pr.Sub} swats wildly and runs.`,
  (n, pr) => `${n} disturbs a nest of buzzing horrors. The swarm descends on the whole tribe.`,
  (n, pr) => `The insect swarm hits ${n} first. Bites, stings, crawling in every crevice. Nightmare fuel.`,
  (n, pr) => `${n} walks face-first into an insect cloud. ${pr.Sub} emerges covered in welts and fury.`,
  (n, pr) => `A thick wall of flying insects blocks the trail. ${n} tries to push through and immediately regrets it.`,
  (n, pr) => `Somewhere in the canopy, ${n} disturbed something. Now a million angry insects want revenge.`,
];

const TREK_MACHETE = [
  (n, pr) => `${n} hacks through the dense vegetation with steady strokes. The machete path is slow but safe.`,
  (n, pr) => `Swing after swing, ${n} clears a path through the underbrush. Reliable. Methodical.`,
  (n, pr) => `${n} carves through bamboo stalks like they're butter. The machete route demands endurance, not luck.`,
  (n, pr) => `The vegetation fights back but ${n} fights harder. Every cleared meter is earned through sweat.`,
];

const TREK_CANOPY = [
  (n, pr) => `${n} scales the massive trunk and pulls ${pr.ref} into the canopy. The view from up here is incredible.`,
  (n, pr) => `${n} swings between branches with surprising agility. The canopy route is fast for those brave enough.`,
  (n, pr) => `${n} finds a network of thick vines overhead and uses them like highways. Risky but brilliant.`,
  (n, pr) => `${n} climbs above the jungle floor where the air is clearer and the path more visible.`,
];

const TREK_RIVER = [
  (n, pr) => `${n} wades into the river shortcut. The current pulls at ${pr.posAdj} legs but ${pr.sub} pushes through.`,
  (n, pr) => `The river route is fast but brutal. ${n} fights the current with every step.`,
  (n, pr) => `${n} dives into the shortcut. The water is cold and fast. ${pr.Sub} surfaces downstream but ahead of everyone.`,
  (n, pr) => `${n} takes the river. ${pr.posAdj} footing is unsteady on the slippery rocks beneath the surface.`,
];

// ── ZIPLINE METHOD-SPECIFIC FAILURES ──
const ZIP_BELT_SNAP = [
  (n, pr) => `${n}'s belt SNAPS mid-crossing! The leather tears and ${pr.sub} drops — catching the cable with bare hands at the last second!`,
  (n, pr) => `The friction shreds ${n}'s belt! ${pr.Sub} slides free and dangles by one arm over the river.`,
  (n, pr) => `SNAP! ${n}'s belt gives out halfway across. ${pr.Sub} swings wild, hands scrambling for the cable.`,
  (n, pr) => `${n}'s belt buckle pops open. The leather flies away and ${pr.sub} drops two feet before grabbing the line.`,
  (n, pr) => `"MY BELT!" ${n}'s improvised harness fails. ${pr.Sub} barely catches ${pr.ref} on the cable. Pants situation: critical.`,
  (n, pr) => `The cable eats through ${n}'s belt like butter. ${pr.Sub} has about three seconds before gravity wins.`,
];

const ZIP_PIGGYBACK_DROP = [
  (carrier, rider, cPr) => `${carrier} stumbles on the launch! ${rider} slips off ${cPr.posAdj} back and both nearly go over the edge!`,
  (carrier, rider, cPr) => `${rider}'s grip fails mid-crossing! ${carrier} feels ${rider} sliding and lunges to catch ${pronouns(rider).obj}.`,
  (carrier, rider, cPr) => `${carrier}'s legs give out under the combined weight. ${rider} hits the platform hard. Both are shaken.`,
  (carrier, rider, cPr) => `The piggyback goes sideways — literally. ${carrier} and ${rider} tilt dangerously before ${carrier} corrects.`,
  (carrier, rider, cPr) => `${rider} panics and squeezes ${carrier}'s neck too tight. ${carrier} chokes and nearly drops them both.`,
  (carrier, rider, cPr) => `${carrier}'s foot catches on the launch platform. ${rider} goes flying forward. Not the teamwork they planned.`,
];

const ZIP_TBAR_JAM = [
  (n, pr) => `The T-Bar handle JAMS on a cable knot! ${n} jerks to a dead stop mid-crossing, swinging over the river.`,
  (n, pr) => `${n}'s T-Bar catches on a frayed section of cable. ${pr.Sub} hangs motionless, working the handle free inch by inch.`,
  (n, pr) => `The T-Bar locks up. ${n} pulls and yanks but the handle won't budge. Stuck in the middle with nowhere to go.`,
  (n, pr) => `A cable splice catches ${n}'s T-Bar. ${pr.Sub} dangles, kicking ${pr.posAdj} legs to build momentum and force past it.`,
  (n, pr) => `${n}'s T-Bar grinds against a rust spot and stops cold. ${pr.Sub} has to hand-over-hand the rest of the way.`,
  (n, pr) => `The handle seizes. ${n} is stuck sixty feet up with the river churning below. Not ideal.`,
];

const ZIP_PIRANHA = [
  (n, pr) => `${n} plunges into the river below! The water CHURNS with piranhas. ${pr.Sub} thrashes to the bank, arriving soaked and terrified.`,
  (n, pr) => `SPLASH! ${n} hits the water and immediately feels tiny bites. PIRANHAS! ${pr.Sub} screams and scrambles for shore.`,
  (n, pr) => `${n} falls into piranha-infested water. The fish swarm. ${pr.Sub} launches out of the river faster than ${pr.sub} crossed the zipline.`,
  (n, pr) => `The river swallows ${n}. Something nibbles ${pr.posAdj} toes. Then ${pr.posAdj} ankles. PIRANHAS! ${pr.Sub} doesn't swim — ${pr.sub} FLIES to the bank.`,
  (n, pr) => `${n} drops into the river with a spectacular splash. The piranhas are waiting. ${pr.Sub} exits the water with several new holes in ${pr.posAdj} clothes.`,
  (n, pr) => `"NOT THE PIRANHAS!" ${n} surfaces, surrounded by silvery shadows. The scramble to shore is the fastest ${pr.sub}'s ever moved.`,
];

// ── TREK ANIMAL ENCOUNTERS ──
const TREK_MOSQUITO = [
  (n, pr) => `A swarm of GIANT mosquitoes descends on ${n}! These aren't normal bugs — they're the size of hummingbirds.`,
  (n, pr) => `${n} walks into a cloud of mega-mosquitoes. ${pr.Sub} slaps and swats but they keep coming, buzzing like tiny helicopters.`,
  (n, pr) => `The mosquitoes here are mutants. ${n} gets swarmed. The welts swell up like golf balls on ${pr.posAdj} arms.`,
  (n, pr) => `"WHAT ARE THOSE?!" ${n} sees the mosquitoes and panics. They're enormous. They're hungry. They found ${pr.obj}.`,
  (n, pr) => `Giant mosquitoes target ${n}. One bite swells into a welt the size of a fist. ${pr.Sub} is having an allergic reaction.`,
  (n, pr) => `${n}'s face balloons from mosquito bites. ${pr.Sub} looks like ${pr.sub} lost a boxing match with the jungle itself.`,
];

const TREK_MONKEY = [
  (n, pr) => `A troop of howler monkeys drops from the canopy! One grabs ${n}'s pack and bolts up a tree with it.`,
  (n, pr) => `MONKEYS! They're everywhere. One snatches the map right out of ${n}'s hands. Another steals ${pr.posAdj} hat.`,
  (n, pr) => `${n} feels ${pr.posAdj} belt pouch open. A spider monkey has ${pr.posAdj} supplies and is already twenty feet up a tree.`,
  (n, pr) => `"Give that BACK!" ${n} chases a monkey through the underbrush. The monkey has ${pr.posAdj} water bottle and no intention of returning it.`,
  (n, pr) => `A monkey pelts ${n} with fruit from above. When ${pr.sub} looks up, another one steals ${pr.posAdj} compass. Coordinated theft.`,
  (n, pr) => `The monkeys are organized. One distracts ${n} with screeching while two others raid ${pr.posAdj} pack. Professional criminals.`,
];

const TREK_CATERPILLAR = [
  (n, pr) => `A MASSIVE caterpillar creature drops from a branch and wraps around ${n}! ${pr.Sub}'s cocooned in silk before ${pr.sub} can scream.`,
  (n, pr) => `${n} feels something warm and sticky on ${pr.posAdj} shoulder. A giant caterpillar is wrapping ${pr.obj} in silk threads.`,
  (n, pr) => `"GET IT OFF! GET IT OFF!" ${n} is being cocooned by a caterpillar the size of a small dog. The silk hardens fast.`,
  (n, pr) => `${n} walks through what ${pr.sub} thinks is a vine curtain. It's caterpillar silk. ${pr.Sub}'s stuck like a fly in a web.`,
  (n, pr) => `The caterpillar drops onto ${n}'s back and starts spinning. In seconds, ${pr.posAdj} arms are pinned to ${pr.posAdj} sides. Cocooned.`,
  (n, pr) => `${n} gets wrapped up like a jungle burrito by a giant caterpillar. ${pr.posAdj} teammates have to cut ${pr.obj} free with machetes.`,
];

const TREK_MONKEY_SLAP = [
  (n, pr) => `${n} slaps the monkey right off the branch. "NOT TODAY!" The troop scatters. ${pr.Sub}'s pack is safe.`,
  (n, pr) => `${n} catches the monkey mid-theft and snatches ${pr.posAdj} supplies back. The monkey shrieks in outrage.`,
  (n, pr) => `${n} swats the monkey away and grabs the stolen goods. "You picked the WRONG person." The other monkeys take note.`,
];

// ── TREK OVERNIGHT CAMPING ──
const TREK_CAMP_SETUP = [
  (tribe) => `Night falls in the jungle. ${tribe} has no choice — the trail is invisible in the dark. Time to make camp.`,
  (tribe) => `Eighteen hours of hiking. The darkness is total. ${tribe} clears a patch of ground and settles in for the night.`,
  (tribe) => `The jungle doesn't have streetlights. ${tribe} finds a clearing and huddles together. Sleep will be minimal.`,
  (tribe) => `${host()} didn't mention the overnight part. ${tribe} stops as the last light dies. It's going to be a long night.`,
];

const TREK_NIGHT_MONKEY = [
  (n, pr) => `Something grabs ${n}'s face in the dark. ${pr.Sub} slaps it. A monkey SHRIEKS and bolts. ${n} is wide awake now.`,
  (n, pr) => `${n} wakes up to monkeys rummaging through the tribe's supplies. ${pr.Sub} slaps them away one by one. It takes a while.`,
  (n, pr) => `A monkey sits on ${n}'s chest, staring at ${pr.obj} in the moonlight. ${pr.Sub} screams. The monkey screams back.`,
  (n, pr) => `${n} is on monkey watch duty. ${pr.Sub} slaps away three separate midnight raids. ${pr.posAdj} reflexes are excellent.`,
];

const TREK_NIGHT_CATERPILLAR = [
  (n, pr) => `${n} wakes up WRAPPED. A giant caterpillar cocooned ${pr.obj} in ${pr.posAdj} sleep. ${pr.Sub} can't move ${pr.posAdj} arms.`,
  (n, pr) => `"MMMF!" ${n}'s screams are muffled by silk. The caterpillar cocooned ${pr.posAdj} entire upper body while ${pr.sub} slept.`,
  (n, pr) => `${n} fell asleep for twenty minutes and woke up a chrysalis. The tribe spends ten minutes cutting ${pr.obj} free.`,
  (n, pr) => `Morning reveals ${n} completely encased in caterpillar silk, hanging from a tree branch. Nobody knows how ${pr.sub} got up there.`,
];

const TREK_NIGHT_BOND = [
  (a, b) => `Unable to sleep, ${a} and ${b} talk quietly under the canopy. The vulnerability of the jungle night brings them closer.`,
  (a, b) => `${a} shares ${pronouns(a).posAdj} last snack with ${b} in the dark. No cameras, no strategy. Just kindness.`,
  (a, b) => `${a} and ${b} take watch shifts together. The shared vigil builds a trust that daytime competitions never could.`,
  (a, b) => `The jungle sounds are terrifying. ${a} and ${b} sit back to back, keeping each other safe. And sane.`,
];

const TREK_NIGHT_PARANOIA = [
  (a, b) => `${a} can't sleep. ${pronouns(a).Sub} watches ${b} whispering in the dark and wonders what ${pronouns(b).sub}'s planning.`,
  (a, b) => `In the dark, ${a} hears ${b} whispering to someone. About ${a}. Or was that the wind? Paranoia spreads.`,
  (a, b) => `${a} lies awake, convinced ${b} is plotting against ${pronouns(a).obj}. The jungle amplifies every fear.`,
];

// ── GUARDIAN ARRIVAL ──
const GUARD_ARRIVAL = [
  (tribe, members) => `The jungle goes SILENT. No birds, no insects. Then — DRUMS. Deep, pounding drums from everywhere at once. ${members[0]} freezes. Painted figures materialize from the undergrowth, spears leveled. The Zing-Zing tribe has found them.`,
  (tribe, members) => `A tripwire. ${members[0]} catches it with ${pronouns(members[0]).posAdj} ankle and a net of vines ROCKETS upward — empty, but a warning. When they look up, painted warriors line every branch above them. They've been watched for miles.`,
  (tribe, members) => `${members[1] || members[0]} steps on something hollow. A trapdoor? The ground gives slightly. Before anyone moves, the Zing-Zing guardians emerge from behind every tree, faces streaked with war paint, blocking the path forward.`,
  (tribe, members) => `The trail ends at a wall of sharpened bamboo stakes. No way around. Then the stakes MOVE — they're being held by painted warriors. The Zing-Zing tribe steps forward in unison, spears crossed, chanting something low and rhythmic.`,
  (tribe, members) => `Smoke. Thick, green smoke rolls across the path. ${members[0]} coughs, eyes watering. When it clears, the Zing-Zing tribe stands in a perfect semicircle around them. How long have they been there? Nobody knows.`,
  (tribe, members) => `${members[Math.min(2, members.length - 1)]} spots something hanging from a vine — a shrunken head. Fake? Real? Before anyone can decide, the Zing-Zing warriors drop from the canopy like spiders, surrounding the group in seconds.`,
];

// ── GUARDIAN FAKE REVEAL ──
const GUARD_FAKE_REVEAL = [
  (tribe) => `The "Zing-Zing" chief pulls off his headdress. It's... a TEENAGER? ${host()} steps out laughing. "LOCAL ACTORS. You got PUNKED!"`,
  (tribe) => `"CUT!" ${host()} strolls into frame. The guardians stop their ritual dance and check their phones. "They're from the local drama club."`,
  (tribe) => `One guardian breaks character and starts giggling. Then they ALL break. ${host()} reveals: "Meet the Zing-Zings. Ages 16 to 19. Theater majors."`,
  (tribe) => `The guardian chief's spear is foam. The war paint is washable. The accent is fake. ${host()}: "Greatest actors since Chef in a bear suit."`,
  (tribe) => `Chef emerges from behind a tree, pulls off a guardian mask. "I was the tall one." ${host()}: "The Zing-Zings are about as real as my concern for your safety."`,
  (tribe) => `The guardians high-five each other and one pulls out a selfie stick. ${host()}: "Hired talent. The real tribe here is bad decisions."`,
];

const GUARD_FAKE_REACTION = {
  smug: [
    (n, pr) => `${n} folds ${pr.posAdj} arms. "Called it. I KNEW those spears were foam."`,
    (n, pr) => `"Please. Their war paint was literally craft glitter." ${n} rolls ${pr.posAdj} eyes. "I wasn't fooled for a SECOND."`,
    (n, pr) => `${n} scoffs. "Their 'ancient chant' was a pop song backwards. Obviously fake."`,
    (n, pr) => `"Actors? Yeah, BAD actors." ${n} smirks. "I've seen better performances at a school play."`,
  ],
  shocked: [
    (n, pr) => `${n}'s jaw drops. "WHAT?! I was genuinely TERRIFIED! Those were TEENAGERS?!"`,
    (n, pr) => `"You're kidding me." ${n} stares at the unmasked guardians. "I almost peed myself over DRAMA STUDENTS?"`,
    (n, pr) => `${n} sits down heavily. "I... I offered them my SHOES. As tribute. To teenagers."`,
    (n, pr) => `"NO. No way." ${n} points at the tallest guardian. "That one had a REAL spear energy! ...It's foam?!"`,
  ],
  angry: [
    (n, pr) => `"Are you KIDDING me?!" ${n} kicks a prop totem. It wobbles pathetically. "I HATE this show!"`,
    (n, pr) => `${n} rounds on ${host()}. "You wasted our TIME with this?! We could've just WALKED THROUGH!"`,
    (n, pr) => `"I swear to—" ${n} takes a deep breath. "When I get my hands on that host..."`,
    (n, pr) => `${n} throws ${pr.posAdj} hands up. "FAKE. It's ALL fake. The tribe, the spears, my dignity."`,
  ],
  goddess: [
    (n, pr) => `${n} turns slowly toward the unmasked guardians. "Wait. So I'm NOT the chosen one?" ${pr.posAdj} face crumbles.`,
    (n, pr) => `"But... they said I was FORETOLD." ${n} looks at ${pr.posAdj} golden tooth gift. "Is THIS even real gold?"`,
    (n, pr) => `${n}: "So the whole goddess thing was..." ${host()}: "Completely fake." ${n}: "...I want to go home."`,
    (n, pr) => `${n} stares at the guardians pulling off their costumes. "But they WORSHIPPED me." A guardian shrugs: "It's in the script."`,
  ],
};

const GUARD_HEATHER_GODDESS = [
  (n, pr) => `${n} steps forward and the "guardians" gasp. "THE GOLDEN ONE! SHE IS FORETOLD!" ${n} preens immediately. "${pr.Sub}'s a GODDESS here."`,
  (n, pr) => `The Zing-Zing chief bows before ${n}. "You have the mark of the jungle queen!" ${n}: "I KNEW I was special."`,
  (n, pr) => `One guardian removes a gold tooth and offers it to ${n}. "A gift for the chosen one." ${n} accepts without question.`,
  (n, pr) => `${n} is surrounded by adoring Zing-Zings. "They recognize ROYALTY," ${pr.sub} announces. ${pr.posAdj} tribe is not amused.`,
];

// ── RUINS DECOYS ──
const RUINS_DECOY = [
  (n, pr) => `${n} grabs a gleaming idol from a pedestal. The floor SHAKES. Dust cascades. "THAT'S NOT A FRAGMENT!" The pillar cracks.`,
  (n, pr) => `"Found one!" ${n} holds up a golden statue. The ceiling groans. Stones fall. It's a DECOY and the ruins are collapsing!`,
  (n, pr) => `${n} pulls a jeweled cup from an alcove. Click. Something mechanical activates. The walls start closing in.`,
  (n, pr) => `A golden mask sits on a stone table. ${n} grabs it. The table SINKS into the floor and a boulder drops from above.`,
  (n, pr) => `${n} finds treasure — the WRONG treasure. The decoy triggers a chain reaction and an entire corridor starts crumbling.`,
  (n, pr) => `"This one looks different—" ${n} barely finishes the sentence before the decoy idol triggers a cascade of falling stone.`,
];

const RUINS_DECOY_ESCAPE = [
  (n, pr) => `${n} drops the decoy and SPRINTS! Stone crashes behind ${pr.obj} as ${pr.sub} dives to safety. Close call.`,
  (n, pr) => `${n} rolls under the falling pillar and comes up running. The ruins settle. ${pr.Sub}'s alive. The decoy is buried.`,
  (n, pr) => `${n} throws the fake treasure aside and vaults over the crumbling floor. ${pr.Sub} makes it out with nothing but adrenaline.`,
];

const RUINS_DECOY_HIT = [
  (n, pr) => `The collapsing pillar pins ${n}'s leg! ${pr.posAdj} teammates dig ${pr.obj} out, but the time loss is massive.`,
  (n, pr) => `${n} isn't fast enough. Rubble buries ${pr.posAdj} lower half. It takes three teammates to pull ${pr.obj} free.`,
  (n, pr) => `The decoy trap catches ${n} in a rockslide. ${pr.Sub} emerges bruised and limping. That treasure was NOT worth it.`,
];

// ── SOCIAL ──
const SOCIAL_BOND = [
  (a, b) => `${a} and ${b} share a canteen during a break. The small kindness strengthens their connection.`,
  (a, b) => `"We're in this together," ${a} tells ${b}. They lock eyes and nod. A bond forms in the green depths.`,
  (a, b) => `${a} helps ${b} over a fallen tree. ${b} squeezes ${pronouns(a).posAdj} hand. Neither pulls away immediately.`,
  (a, b) => `${a} catches ${b} when ${pronouns(b).sub} stumbles on a root. The gratitude is written all over ${b}'s face.`,
  (a, b) => `${a} and ${b} find their rhythm walking together. Conversation flows. Trust builds.`,
  (a, b) => `The trek is exhausting but ${a} and ${b} keep each other going with quiet encouragement.`,
];

const SOCIAL_BLAME = [
  (a, b) => `"This is YOUR fault we're lost!" ${a} jabs a finger at ${b}. The tension boils over.`,
  (a, b) => `${a} blames ${b} for the wrong turn. Loudly. In front of everyone. ${b} doesn't take it well.`,
  (a, b) => `"If ${b} had listened to me, we'd be ahead by now." ${a} makes sure everyone hears.`,
  (a, b) => `The frustration explodes. ${a} turns on ${b} and lets loose. The tribe goes silent.`,
  (a, b) => `${a}'s patience snaps. ${b} catches the full weight of it. The animosity is now public.`,
  (a, b) => `"Useless. Absolutely useless." ${a} says it about ${b}. To ${b}'s face.`,
];

const SOCIAL_RIVAL = [
  (a, b) => `${a} and ${b} lock eyes through the foliage. The rivalry doesn't need words. Both know.`,
  (a, b) => `${a} deliberately speeds up when ${b} slows down. It's petty. It's personal.`,
  (a, b) => `The competition between ${a} and ${b} has moved past friendly. Way past.`,
  (a, b) => `${a} blocks ${b}'s preferred path. Coincidence? Not a chance.`,
  (a, b) => `"You think you're better than me?" ${a} murmurs at ${b}. The rivalry deepens.`,
  (a, b) => `${a} and ${b} refuse to cooperate. The tribe suffers for their ego war.`,
];

const SOCIAL_ENCOURAGE = [
  (a, b) => `"Don't give up!" ${a} hauls ${b} to ${pronouns(b).posAdj} feet. The encouragement is exactly what ${b} needed.`,
  (a, b) => `${a} slows down to walk with ${b}. "We finish this together." The words hit different in the jungle.`,
  (a, b) => `${a} pulls a thorny branch aside so ${b} can pass safely. Leadership through action.`,
  (a, b) => `"You're tougher than you think," ${a} tells ${b}. ${b} stands a little straighter after that.`,
  (a, b) => `${a} shares ${pronouns(a).posAdj} water with ${b} when ${pronouns(b).sub} starts to flag. Survival is a team sport.`,
  (a, b) => `${a} notices ${b} falling behind and circles back. "Nobody gets left in this jungle."`,
];

const SOCIAL_SABOTAGE = [
  (a, b) => `${a} deliberately points ${b} toward the wrong path. A quiet smile follows.`,
  (a, b) => `While nobody's looking, ${a} kicks mud onto the trail markers. ${b} will take the fall.`,
  (a, b) => `${a} "accidentally" lets a branch snap back into ${b}'s face. "Oops."`,
  (a, b) => `${a} whispers false directions to ${b}. When things go wrong, ${a} feigns surprise.`,
  (a, b) => `${a} drops ${b}'s supplies when no one is watching. The sabotage is subtle but effective.`,
  (a, b) => `${a} spots a shortcut and keeps it to ${pronouns(a).ref}. Let ${b} take the long way around.`,
];

const SOCIAL_HERO = [
  (n, pr) => `${n} spots danger before anyone else and steers the tribe clear. Quiet heroism.`,
  (n, pr) => `When the trail collapses, ${n} is the one who finds the alternative. ${pr.Sub} saves the tribe precious minutes.`,
  (n, pr) => `${n} carries an exhausted teammate's pack without being asked. Pure heart.`,
  (n, pr) => `${n} takes the most dangerous position in the formation. ${pr.Sub}'d rather face the risk than let others.`,
  (n, pr) => `${n} fashions a bridge from fallen branches when the path floods. Resourceful and brave.`,
  (n, pr) => `${n} spots a rare medicinal plant and uses it to treat a teammate's insect bites. Jungle medicine.`,
];

// ── GUARDIAN ──
// ── GUARDIAN SPEAKER NOMINATIONS ──
const GUARD_NOMINATE_SELF = [
  (n, pr) => `"I'll handle this." ${n} steps forward before anyone else can speak. "I know how to talk to people."`,
  (n, pr) => `${n} plants ${pr.ref} between the tribe and the guardians. "Nobody else needs to do this. I've got it."`,
  (n, pr) => `"Let me." ${n} pushes to the front. "I'm the reason we made it this far — I'll get us through this too."`,
  (n, pr) => `${n} volunteers immediately. "I speak for us. No arguments." ${pr.posAdj} confidence is absolute.`,
  (n, pr) => `"Everyone shut up and let me do the talking." ${n} adjusts ${pr.posAdj} collar. "I was BORN for this."`,
  (n, pr) => `${n} is already walking toward the guardians before anyone votes. "You can thank me later."`,
];

const GUARD_NOMINATE_OTHER = [
  (n, pr, target, tPr) => `"${target} should speak," ${n} says. "${tPr.Sub}'s the best with people. No offense to the rest of us."`,
  (n, pr, target, tPr) => `${n} points at ${target}. "You. You've got that... thing. The charm. Use it."`,
  (n, pr, target, tPr) => `"I nominate ${target}." ${n} nods firmly. "No one here has better social instincts."`,
  (n, pr, target, tPr) => `"Honestly? ${target}. ${tPr.Sub} could sell sand in a desert." ${n} backs ${pr.posAdj} choice with a shrug.`,
  (n, pr, target, tPr) => `${n} grabs ${target}'s shoulder. "You're our best shot. Just... don't say anything weird."`,
  (n, pr, target, tPr) => `"If anyone can get us past them, it's ${target}." ${n} looks to the others for agreement.`,
];

const GUARD_NOMINATE_REFUSE = [
  (n, pr) => `"Don't look at me." ${n} takes a step back. "I don't do public speaking. Especially not to people with SPEARS."`,
  (n, pr) => `${n} backs away slowly. "Yeah, no. Someone else is getting stabbed today."`,
  (n, pr) => `"Absolutely not." ${n} crosses ${pr.posAdj} arms. "I can barely talk to my OWN tribe."`,
  (n, pr) => `${n} hides behind the tallest teammate. "I'll be emotional support. From back here."`,
];

// ── GUARDIAN APPROACH DEBATE ──
const GUARD_ADVOCATE_PEACEFUL = [
  (n, pr) => `"We go in PEACE." ${n} holds up open palms. "They have spears. We have manners. Manners win."`,
  (n, pr) => `"Think about it — they live here. We're the invaders." ${n} is calm. "Show respect. Earn passage."`,
  (n, pr) => `"Violence gets us killed. Sneaking gets us caught." ${n} looks around. "We TALK our way through."`,
  (n, pr) => `${n} picks up a flower and presents it. "See? Peace offering. It's universal. Even in the jungle."`,
  (n, pr) => `"They're people, not monsters. We treat them with dignity and they'll do the same." ${n} sounds certain.`,
  (n, pr) => `"Smile. Bow. Show empty hands. Basic diplomacy." ${n} sounds like ${pr.sub}'s done this before. ${pr.Sub} has not.`,
];

const GUARD_ADVOCATE_BOLD = [
  (n, pr) => `"We walk RIGHT UP to them. No fear." ${n} pounds ${pr.posAdj} chest. "Respect is EARNED, not begged for."`,
  (n, pr) => `"They respect STRENGTH. Roll over and they'll walk all over us." ${n} flexes. "We go bold."`,
  (n, pr) => `"Show weakness and we're done." ${n} cracks ${pr.posAdj} knuckles. "We look them in the eye and demand passage."`,
  (n, pr) => `${n} gestures at the spears. "They're testing us. They WANT us to cower. We don't. We challenge them."`,
  (n, pr) => `"Back home, I'd never let someone block my path. Why start now?" ${n}'s bravery borders on stupidity.`,
  (n, pr) => `"BOLD. Capital B." ${n} stares down the guardians from a distance. "I'm not bowing to hired extras."`,
];

const GUARD_ADVOCATE_SNEAKY = [
  (n, pr) => `"Or — hear me out — we DON'T fight the people with spears." ${n} eyes the treeline. "There's always a way around."`,
  (n, pr) => `"Their patrol has gaps. I counted." ${n} traces a path in the dirt. "We ghost through."`,
  (n, pr) => `"Bold gets you stabbed. Peace wastes time." ${n} taps ${pr.posAdj} temple. "Smart gets you through ALIVE."`,
  (n, pr) => `${n} points at the dense undergrowth. "We don't need their permission. We need their blind spot."`,
  (n, pr) => `"Why fight when you can disappear?" ${n} is already scanning escape routes. "Follow me."`,
  (n, pr) => `"The smartest way through a wall isn't THROUGH it." ${n} smirks. "It's around it."`,
];

const GUARD_APPROACH_INTERJECT = {
  hothead: [
    (n, pr) => `"JUST GO! I don't care HOW!" ${n} kicks a root. "Peace, bold, sneaky — ANYTHING but standing here ARGUING!"`,
    (n, pr) => `${n} grabs a stick. "We're surrounded by spear guys and you all want to VOTE? I'm going THROUGH them!"`,
    (n, pr) => `"Five more seconds of debate and I start throwing things." ${n} is NOT kidding.`,
  ],
  hero: [
    (n, pr) => `"Whatever keeps the team safe. I'll go first no matter what we pick." ${n}'s selflessness shuts up the arguers.`,
    (n, pr) => `${n} steps between the debaters. "We stick together. That matters more than HOW we approach."`,
  ],
  villain: [
    (n, pr) => `${n} smiles coldly. "Personally? I'd sacrifice the weakest one as a distraction. But sure. 'Peace.'"`,
    (n, pr) => `"Let the speaker figure it out." ${n} examines ${pr.posAdj} nails. "If they fail, we have someone to blame."`,
  ],
  socialButterfly: [
    (n, pr) => `"VOTE VOTE VOTE!" ${n} bounces. "Democracy! Let's all raise hands! Come on, it'll be fun!"`,
    (n, pr) => `"Okay everyone gets a voice! Even you!" ${n} points at the quietest teammate. "What do YOU think?"`,
  ],
  loyal: [
    (n, pr) => `"I'll back whatever the speaker decides. That's what a team does." ${n} nods at the speaker.`,
    (n, pr) => `${n} stands behind the speaker. "Your call. We're with you."`,
  ],
  underdog: [
    (n, pr) => `"Can we just... not get stabbed? Is that an option?" ${n} is shaking slightly.`,
    (n, pr) => `${n} raises a hand. "What if sneaky? Because I'm really good at not being noticed. Like, too good."`,
  ],
};

const GUARD_APPROACH_DECIDED = [
  (speaker, approach) => `The tribe decides: <strong>${approach}</strong>. ${speaker} nods. "Then that's what we do."`,
  (speaker, approach) => `Votes are in. <strong>${approach.charAt(0).toUpperCase() + approach.slice(1)}</strong> wins. ${speaker} squares ${pronouns(speaker).posAdj} shoulders. Time to face the guardians.`,
  (speaker, approach) => `"${approach.toUpperCase()} it is." ${speaker} takes a breath and turns toward the guardians. No going back.`,
  (speaker, approach) => `The debate ends. <strong>${approach.charAt(0).toUpperCase() + approach.slice(1)}</strong>. ${speaker} steps forward. The tribe holds its breath.`,
];

const GUARD_PEACEFUL = [
  (speaker, pr) => `${speaker} steps forward with open palms. "${pr.Sub} means no harm. We come offering respect."`,
  (speaker, pr) => `${speaker} bows low and presents a gift of gathered jungle flowers. The guardians watch, intrigued.`,
  (speaker, pr) => `"We ask only for safe passage," ${speaker} says calmly. ${pr.posAdj} voice doesn't waver.`,
  (speaker, pr) => `${speaker} speaks softly but with authority. The guardians lean in to listen. The tension eases.`,
  (speaker, pr) => `${speaker} extends a hand in peace. The guardian chief studies ${pr.posAdj} eyes for a long moment.`,
  (speaker, pr) => `"We honor this land and those who guard it." ${speaker}'s words are deliberate and sincere.`,
];

const GUARD_BOLD = [
  (speaker, pr) => `${speaker} stands tall and meets the guardians' gaze. "We're not afraid. We're passing through."`,
  (speaker, pr) => `"Test us," ${speaker} declares. The guardians exchange looks. A challenge has been issued.`,
  (speaker, pr) => `${speaker} pounds ${pr.posAdj} chest. "We'll prove we're worthy." The guardians raise their spears.`,
  (speaker, pr) => `"We didn't come this far to be stopped." ${speaker}'s defiance electrifies the tribe.`,
  (speaker, pr) => `${speaker} steps across the guardian line. Bold? Reckless? Maybe both.`,
  (speaker, pr) => `${speaker} locks eyes with the guardian chief and doesn't blink. "Let us pass."`,
];

const GUARD_SNEAKY = [
  (speaker, pr) => `${speaker} gestures for the tribe to go silent. ${pr.Sub}'s spotted a way around.`,
  (speaker, pr) => `"There's a gap in their patrol. Follow me." ${speaker} leads the tribe into the shadows.`,
  (speaker, pr) => `${speaker}'s eyes dart across the terrain, calculating. "We don't need to fight. We need to be invisible."`,
  (speaker, pr) => `${speaker} creates a distraction with thrown stones while the tribe sneaks past.`,
  (speaker, pr) => `"They expect us on the main trail. We go through the water." ${speaker} knows the jungle.`,
  (speaker, pr) => `${speaker} reads the guardian rotation like a clock. "Now." The tribe slips through undetected.`,
];

const GUARD_SUCCESS = [
  (tribe) => `The guardians step aside and bow. ${tribe} has earned passage. The jungle opens before them.`,
  (tribe) => `A rumble of approval from the guardians. ${tribe} may proceed. The path ahead is clear.`,
  (tribe) => `The guardian chief raises a fist. Permission granted. ${tribe} surges forward with renewed energy.`,
  (tribe) => `The guardians light torches and illuminate the path ahead. ${tribe} has been found worthy.`,
  (tribe) => `Stone totems along the trail glow as ${tribe} passes. The guardians nod in respect.`,
  (tribe) => `The jungle gate swings open. ${tribe} earned this.`,
];

const GUARD_FAIL = [
  (tribe, speaker) => `The guardians block the path. ${tribe} must take the long way around. ${speaker}'s approach failed.`,
  (tribe, speaker) => `A wall of spears. ${tribe} is turned away. ${speaker}'s gamble didn't pay off.`,
  (tribe, speaker) => `The guardians pound their shields. ${tribe} retreats. Precious minutes lost.`,
  (tribe, speaker) => `"Not worthy." The guardian chief's words cut deep. ${tribe} must find another way.`,
  (tribe, speaker) => `The jungle gate stays shut. ${tribe} loses time circling around. ${speaker} feels the weight of failure.`,
  (tribe, speaker) => `${tribe} is forced back into the undergrowth. The guardians won't budge.`,
];

// ── RUINS ──
const RUINS_FOUND = [
  (n, pr) => `${n} brushes away centuries of moss and finds it — a golden fragment glinting in the filtered light.`,
  (n, pr) => `There! Under a fallen stone column. ${n} pulls out a golden fragment and holds it up for the tribe.`,
  (n, pr) => `${n}'s fingers close around something metallic in the rubble. Gold. A fragment! ${pr.Sub} can't hide the grin.`,
  (n, pr) => `${n} follows an ancient marking on the wall to a hidden alcove. Inside: a golden fragment.`,
  (n, pr) => `Instinct guides ${n} to a crack in the temple floor. ${pr.Sub} reaches in and pulls out golden treasure.`,
  (n, pr) => `${n} spots a glimmer behind a crumbling statue. One golden fragment, right where it shouldn't be.`,
  (n, pr) => `Cobwebs and dust can't hide everything. ${n} finds a fragment wedged between two stone blocks.`,
  (n, pr) => `${n} reads the ancient symbols on the wall and follows them to a hidden niche. Fragment secured.`,
];

// ── RUINS ROOMS ──
const RUINS_ENTRANCE = [
  (tribe) => `${tribe} pushes through the vine-covered entrance. The air inside is cold and stale. Ancient carvings cover every surface — warnings, or a map?`,
  (tribe) => `The temple doors are massive, cracked, and barely standing. ${tribe} squeezes through the gap into darkness. Torchlight reveals murals of a forgotten civilization.`,
  (tribe) => `${tribe} enters the ruins. The floor is a mosaic of golden tiles, most shattered. Something glints deeper inside.`,
  (tribe) => `The entrance is a mouth — literally carved into the shape of a screaming face. ${tribe} walks into its jaws. The temperature drops ten degrees.`,
  (tribe) => `${tribe} crosses the threshold. Their footsteps echo in the vast entry hall. Pillars stretch to a ceiling they can't see. Somewhere ahead, something shifts.`,
];

const RUINS_CORRIDOR = [
  (tribe) => `${tribe} moves through a narrow corridor. The walls are covered in scratch marks — something was kept here. Or something tried to escape.`,
  (tribe) => `The corridor forks. Left goes up, right goes down. ${tribe} splits to cover ground — risky, but faster.`,
  (tribe) => `Cobwebs thick as curtains block the path. ${tribe} tears through them, triggering clouds of ancient dust.`,
  (tribe) => `Water drips from the ceiling. The corridor slopes downward. ${tribe}'s torches flicker in the damp air.`,
  (tribe) => `The walls narrow until ${tribe} has to move single file. Carved faces watch them pass with empty stone eyes.`,
];

const RUINS_SANCTUM = [
  (tribe) => `${tribe} reaches the inner sanctum — a vast chamber with a shattered altar at its center. Fragment pedestals ring the room. This is where the real treasure hides.`,
  (tribe) => `The inner sanctum opens up. Gold leaf peels from every surface. The ceiling is painted with a star map. And there — on raised pedestals — the fragments GLOW.`,
  (tribe) => `${tribe} enters the heart of the ruins. An underground spring feeds a pool of crystal water. The fragments are scattered around the chamber, half-buried in centuries of debris.`,
  (tribe) => `Light pours through a crack in the ceiling, illuminating a circular chamber lined with stone faces. ${tribe} can see fragments glinting in every corner. The final search begins.`,
  (tribe) => `The sanctum takes ${tribe}'s breath away. Towering statues guard a sunken floor covered in gold mosaic. The remaining fragments are HERE — embedded in the walls, hidden behind carvings.`,
];

const RUINS_PUZZLE = [
  (n, pr) => `${n} finds a door sealed with a stone puzzle — rotating discs with ancient symbols. ${pr.Sub} studies the pattern, turning discs one by one.`,
  (n, pr) => `The path is blocked by a weighted mechanism. ${n} experiments with stones on the pressure plates, trying to find the right combination.`,
  (n, pr) => `${n} discovers a mural with a sequence of animals. Below it, stone buttons shaped the same way. A puzzle lock. ${pr.Sub} starts pressing.`,
  (n, pr) => `The corridor ends at a wall of sliding stone panels. ${n} pushes one and the whole grid SHIFTS. It's a maze puzzle.`,
];
const RUINS_PUZZLE_SOLVE = [
  (n, pr) => `CLICK. The door grinds open. ${n} grins — ${pr.sub} actually solved it. Behind the door: a hidden chamber!`,
  (n, pr) => `The final disc locks into place and the wall slides apart. ${n} just cracked a puzzle that's been sealed for centuries.`,
  (n, pr) => `${n} presses the last button. The mechanism whirs. The path opens. ${pr.Sub} pumps ${pr.posAdj} fist.`,
  (n, pr) => `The symbols align. A deep THUNK echoes through the corridor. The stone wall retracts and ${n} doesn't even try to hide the smug grin.`,
];
const RUINS_PUZZLE_FAIL = [
  (n, pr) => `Wrong. The discs spin back to start and a section of wall drops, sealing the route. ${n} has to backtrack.`,
  (n, pr) => `${n} pushes the wrong panel. The whole grid resets with a grinding crash. Back to square one.`,
  (n, pr) => `The mechanism jams. ${n} forces it and the entire puzzle LOCKS UP permanently. That corridor is done.`,
  (n, pr) => `The symbols flash red. A grinding sound fills the corridor. ${n} just triggered the wrong sequence and the passage seals shut.`,
];

const RUINS_CROSS_RACE = [
  (a, aPr, b, bPr) => `${a} and ${b} spot the same fragment at the same time! They SPRINT — elbows out, diving for the pedestal!`,
  (a, aPr, b, bPr) => `Two torches converge on the same alcove. ${a} from ${aPr.posAdj} tribe. ${b} from ${bPr.posAdj}. One fragment. Both reaching.`,
  (a, aPr, b, bPr) => `${a} is inches from a fragment when ${b} rounds the corner. Their eyes lock. Both lunge!`,
  (a, aPr, b, bPr) => `The golden glint catches both of them at once. ${a} dives left, ${b} dives right — both sliding across ancient stone toward the same pedestal!`,
];
const RUINS_CROSS_WIN = [
  (winner, wPr, loser, lPr) => `${winner} gets there FIRST! ${loser} slams the ground in frustration. That fragment is gone.`,
  (winner, wPr, loser, lPr) => `${winner} snatches it! ${loser} grabs air. "TOO SLOW!" ${winner} shouts, already running.`,
  (winner, wPr, loser, lPr) => `${winner}'s hand closes around the fragment a heartbeat before ${loser}'s. ${loser} can only watch ${wPr.obj} run.`,
  (winner, wPr, loser, lPr) => `${winner} RIPS the fragment from the pedestal and is gone before ${loser} can react. "THAT WAS MINE!" ${loser} screams at the empty corridor.`,
];

const RUINS_CROSS_BLOCK = [
  (blocker, bPr, victim, vPr, blockerTribe) => `${blocker} sees ${victim} heading for a fragment and BLOCKS the corridor! "Find your own treasure!" ${victim}: "Are you KIDDING me?!"`,
  (blocker, bPr, victim, vPr, blockerTribe) => `${blocker} body-checks ${victim} at a junction. "Wrong corridor, friend." ${victim} has to find another route while ${blockerTribe} searches ahead.`,
  (blocker, bPr, victim, vPr, blockerTribe) => `${blocker} triggers a trap between ${victim} and the next chamber. Intentional? "Totally an accident." The smirk says otherwise.`,
  (blocker, bPr, victim, vPr, blockerTribe) => `${blocker} shoves a stone slab across the corridor just as ${victim} approaches. "Oops! Guess you'll need the long way around." ${victim} seethes.`,
];

const RUINS_CROSS_TAUNT = [
  (a, aPr, b, bPr, aFrags, bFrags) => `${a} holds up ${aPr.posAdj} tribe's fragments for ${b} to see. "We're at ${aFrags}. You?" ${b} looks at ${bPr.posAdj} tribe's pile: ${bFrags}. Not great.`,
  (a, aPr, b, bPr, aFrags, bFrags) => `${a} passes ${b} in a corridor. "Still looking? We found ours AGES ago." ${b}'s jaw tightens.`,
  (a, aPr, b, bPr, aFrags, bFrags) => `"How many you got?" ${a} asks ${b} with fake concern. "${bFrags}? Oh. Well, keep trying." ${a} waves and disappears around a corner.`,
  (a, aPr, b, bPr, aFrags, bFrags) => `${a} jingles ${aPr.posAdj} tribe's fragments like keys. "Hear that, ${b}? That's the sound of WINNING." ${b}: "That's the sound of someone who's about to get lost."`,
];

const RUINS_TRAP_HIT = [
  (n, pr) => `${n} steps on the wrong stone and a barrage of darts fires from the wall. ${pr.Sub} dives but gets clipped.`,
  (n, pr) => `The floor gives way under ${n}. ${pr.Sub} drops into a shallow pit lined with thorns. Painful.`,
  (n, pr) => `${n} pulls a lever hoping for treasure. Instead, a net drops from the ceiling and tangles ${pr.obj} up.`,
  (n, pr) => `A swinging log slams into ${n} from the shadows. The ancient trap still works perfectly.`,
  (n, pr) => `${n} reaches for what looks like a fragment. It's bait. A cage drops around ${pr.obj}.`,
  (n, pr) => `The stone ${n} grabbed was a trigger. Sand pours from above and nearly buries ${pr.obj}.`,
];

const RUINS_TRAP_DODGE = [
  (n, pr) => `${n} spots the pressure plate a heartbeat before stepping on it. Quick feet save the day.`,
  (n, pr) => `Something clicks under ${n}'s foot. ${pr.Sub} jumps back just as spikes shoot up from the floor.`,
  (n, pr) => `${n} sees the tripwire. Others might not have. ${pr.Sub} steps over it with precision.`,
  (n, pr) => `The wall starts to close in. ${n} rolls under the gap with inches to spare. Trap avoided.`,
  (n, pr) => `${n} reads the discolored stones and avoids the trapped ones entirely. Experience or luck? Both.`,
  (n, pr) => `A dart flies past ${n}'s ear. ${pr.Sub} doesn't even flinch. ${pr.Sub} saw it coming.`,
];

const RUINS_COLLAPSE = [
  (n, pr) => `The ceiling above ${n} cracks. ${pr.Sub} sprints as stones rain down behind ${pr.obj}.`,
  (n, pr) => `A section of the ruins crumbles around ${n}. Dust blinds ${pr.obj} but ${pr.sub} stumbles to safety.`,
  (n, pr) => `The floor tilts under ${n}'s weight. The ancient structure is giving way. ${pr.Sub} barely escapes.`,
  (n, pr) => `The column next to ${n} buckles. ${pr.Sub} dives clear as a ton of stone crashes where ${pr.sub} stood.`,
  (n, pr) => `${n} hears the groan of ancient masonry. ${pr.Sub} has seconds to run before the whole corridor falls.`,
  (n, pr) => `The ruins remind ${n} they weren't built to last forever. A section collapses and ${pr.sub} scrambles clear.`,
];

const RUINS_HELP = [
  (a, b) => `${a} hoists ${b} up to reach a high alcove where a fragment might be hiding.`,
  (a, b) => `${a} clears the rubble blocking ${b}'s search area. Teamwork in the temple.`,
  (a, b) => `"Look behind that pillar." ${a} points ${b} to a spot ${pronouns(b).sub} missed. It pays off.`,
  (a, b) => `${a} holds a torch while ${b} searches the dark corridor. Two pairs of eyes are better than one.`,
  (a, b) => `${a} decodes the wall markings and calls ${b} over. "I think there's one buried here."`,
  (a, b) => `${a} draws the trap's attention while ${b} slips past to search deeper in the ruins.`,
];

const RUINS_SABOTAGE = [
  (a, b) => `${a} triggers a trap near ${b}'s position on purpose. "Oh no, how did that happen?"`,
  (a, b) => `${a} palms a fragment and hides it. If ${b} can't find any, ${a} looks better by comparison.`,
  (a, b) => `${a} kicks dust onto the ancient markings ${b} was reading. "Oops. My bad."`,
  (a, b) => `${a} leads ${b} toward the trapped corridor. "I think I saw something shiny in there..."`,
  (a, b) => `${a} "accidentally" collapses a passage ${b} was about to search. Opportunities denied.`,
  (a, b) => `${a} watches ${b} approach a trap and says nothing. The crash echoes through the ruins.`,
];

// ── HOST ──
// ── COLD OPEN ──
const COLD_OPEN = [
  () => `Dawn breaks over the jungle canopy. Mist clings to the treetops. The tribes are gathered at the edge of a clearing where ancient stone markers jut from the earth — the start of something massive. ${host()} stands on a moss-covered platform, holding a golden idol. "Welcome to the Am-AH-Zon Race."`,
  () => `The air is thick. Heavy. Something about this stretch of jungle feels ANCIENT — the trees are wider, the vines thicker, the silence deeper. The tribes arrive to find ${host()} perched on a crumbling stone arch. "Today, you earn your place. Or the jungle takes it from you."`,
  () => `A river cuts through the clearing. On the far side, barely visible through the mist — ruins. Old ones. The kind of old that makes you feel small. ${host()} gestures across the water. "Four phases. One shot. Last tribe standing doesn't have to vote anyone out tonight."`,
  () => `Drums. Somewhere deep in the jungle, drums. The tribes file into a clearing ringed with torches that shouldn't still be burning. ${host()} is waiting, golden fragments hanging from ${host() === 'Chris' ? 'his' : 'the'} neck. "Hope you stretched. You're about to run, climb, beg, and dig your way across THIS."`,
  () => `The jungle goes quiet as the tribes approach. Too quiet. Even the insects are listening. A zipline stretches across a river gorge into green nothing. ${host()} grins from a platform above. "Welcome to the most BRUTAL challenge this season. Maybe ever."`,
];

const HOST_QUIP = [
  () => `${host()} adjusts ${host() === 'Chris' ? 'his' : 'the'} safari hat. "I love watching other people suffer in nature."`,
  () => `"Pro tip: the jungle doesn't care about your feelings." ${host()} is already sipping something iced.`,
  () => `${host()} watches from a safe distance. "I'd help, but I'm allergic to effort."`,
  () => `"Remember, I'll be at the finish line. With snacks. That I won't share." ${host()} waves.`,
  () => `${host()} checks ${host() === 'Chris' ? 'his' : 'the'} watch. "They're really taking their time, huh?"`,
  () => `"Fun fact: everything in this jungle can hurt you." ${host()} grins at the camera.`,
  () => `${host()} opens a juice box. "Continue suffering. You're doing great."`,
  () => `"This is what happens when you sign up for a survival show." ${host()} shrugs.`,
  () => `${host()} narrates to the camera: "Some will rise. Most will get bug bites."`,
  () => `"If you hear something growling, run. If you hear ME laughing, also run." ${host()} seems to enjoy this.`,
];

// ── CHATTER (atmospheric filler) ──
const CHATTER = [
  () => `The canopy rustles with unseen movements. Something is always watching in the deep green.`,
  () => `Heat rises from the jungle floor in shimmering waves. The humidity is suffocating.`,
  () => `Somewhere in the distance, a bird screams. It sounds almost human.`,
  () => `The undergrowth shifts. Eyes? Imagination? In this jungle, the difference doesn't matter.`,
  () => `Ancient vines cling to crumbling stone. This place has been forgotten by everything except time.`,
  () => `Cicadas create a wall of sound so thick it's almost visible. The jungle never stops talking.`,
  () => `The trail narrows. The canopy thickens. Light becomes a luxury down here.`,
  () => `A river of fire ants crosses the path in perfect formation. Nature's infantry.`,
  () => `The air tastes like earth and rain and something older. The jungle has its own flavor.`,
  () => `Thunder rumbles in the distance. The sky above the canopy is getting darker.`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════

export function simulateAmazonRace(ep) {
  const tribes = gs.tribes.map(t => ({
    tribeName: t.tribeName || t.name,
    members: [...t.members],
    color: tribeColor(t.tribeName || t.name)
  }));
  if (tribes.length < 2) return ep;

  const allActive = tribes.flatMap(t => t.members);
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => {
    if (!ep.campEvents[t.tribeName]) ep.campEvents[t.tribeName] = { pre: [], post: [] };
  });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.tribeName; }));

  const result = {
    tribes: [],
    tribesSorted: [],
    winner: '',
    loser: '',
    socialEvents: [],
    immunityWinner: null
  };

  // Per-tribe results containers
  const tribeResults = {};
  tribes.forEach(t => {
    tribeResults[t.tribeName] = {
      tribeName: t.tribeName,
      members: [...t.members],
      color: t.color,
      totalScore: 0,
      avgScore: 0,
      zipline: { events: [], score: 0 },
      trek: { pathfinder: '', route: '', routeVotes: {}, segments: [], score: 0 },
      guardian: { speaker: '', speakerVotes: {}, approach: '', approachVotes: {}, success: false, events: [], score: 0 },
      ruins: { events: [], fragmentsFound: 0, allFragments: false, traps: [], score: 0 }
    };
  });

  // ══ PHASE 1: ZIPLINE CROSSING ══
  // Beat 1: Technique Debate → Beat 2: Crossings with technique effects → Beat 3: Landing assessment
  const ZIP_TECHNIQUES = [
    { id: 'tbar', label: 'T-BAR', desc: 'Standard handle — one at a time, safe but slow',
      statA: 'physical', statB: 'endurance', mult: 1.0, freezeRisk: 0.0, hazardResist: 0.08, cleanBonus: 3 },
    { id: 'belt', label: 'BELT SLIDE', desc: 'Belt over the cable — fast, everyone crosses at once',
      statA: 'boldness', statB: 'physical', mult: 1.4, freezeRisk: 0.15, hazardResist: -0.05, cleanBonus: 5 },
    { id: 'piggyback', label: 'PIGGYBACK', desc: 'Pair up — strong carries light, half the crossings',
      statA: 'social', statB: 'loyalty', mult: 1.1, freezeRisk: -0.10, hazardResist: 0.0, cleanBonus: 4 },
  ];

  tribes.forEach(t => {
    const tr = tribeResults[t.tribeName];
    const tn = t.tribeName;
    tr.zipline.technique = null;
    tr.zipline.techVotes = {};
    tr.zipline.debate = { champions: [], advocacy: [], interjections: [], winner: null, decisionText: '' };

    // ── BEAT 1: TECHNIQUE DEBATE ──
    // Each technique gets a champion — the player with best matching stats
    const usedChampions = new Set();
    const champions = ZIP_TECHNIQUES.map(tech => {
      const eligible = t.members.filter(m => !usedChampions.has(m));
      if (!eligible.length) return { name: t.members[0], tech, score: 0 };
      const scored = eligible.map(n => {
        const s = pStats(n);
        return { name: n, score: s[tech.statA] * 0.12 + s[tech.statB] * 0.08 + noise(1.5) };
      }).sort((a, b) => b.score - a.score);
      usedChampions.add(scored[0].name);
      return { name: scored[0].name, tech, score: scored[0].score };
    });

    // Each champion gives an advocacy speech
    const advocacy = champions.map(c => {
      const pr = pronouns(c.name);
      const pools = { tbar: ZIP_ADVOCATE_TBAR, belt: ZIP_ADVOCATE_BELT, piggyback: ZIP_ADVOCATE_PIGGYBACK };
      const text = pick(pools[c.tech.id])(c.name, pr);
      return { champion: c.name, techId: c.tech.id, techLabel: c.tech.label, text };
    });

    // Store advocacy events
    advocacy.forEach(adv => {
      tr.zipline.events.push({
        type: 'debate', subtype: 'advocacy', player: adv.champion,
        text: adv.text,
        score: 0, badge: adv.techLabel, badgeClass: 'trek',
        _techId: adv.techId
      });
    });
    tr.zipline.debate.advocacy = advocacy;
    tr.zipline.debate.champions = champions.map(c => ({ name: c.name, techId: c.tech.id, techLabel: c.tech.label }));

    // 1-2 interjections from non-champion tribe members
    const interjectorPool = t.members.filter(m => !usedChampions.has(m));
    const numInterject = interjectorPool.length >= 2 ? (1 + (Math.random() < 0.6 ? 1 : 0)) : interjectorPool.length;
    const interjections = [];
    for (let i = 0; i < numInterject; i++) {
      if (!interjectorPool.length) break;
      const idx = Math.floor(Math.random() * interjectorPool.length);
      const speaker = interjectorPool.splice(idx, 1)[0];
      const spr = pronouns(speaker);
      const a = arch(speaker);
      let pool = ZIP_INTERJECT.socialButterfly;
      if (a === 'hothead') pool = ZIP_INTERJECT.hothead;
      else if (a === 'hero') pool = ZIP_INTERJECT.hero;
      else if (['villain', 'mastermind'].includes(a)) pool = ZIP_INTERJECT.villain;
      else if (a === 'schemer') pool = ZIP_INTERJECT.schemer;
      else if (a === 'social-butterfly') pool = ZIP_INTERJECT.socialButterfly;
      else if (['loyal-soldier', 'underdog'].includes(a)) pool = a === 'underdog' ? ZIP_INTERJECT.underdog : ZIP_INTERJECT.loyal;
      else if (a === 'challenge-beast') pool = ZIP_INTERJECT.challenge;

      const target = pick(champions).name;
      const text = pick(pool)(speaker, spr, target);
      interjections.push({ speaker, target, archetype: a, text });
      tr.zipline.events.push({
        type: 'debate', subtype: 'interjection', player: speaker, target,
        text, score: 0, badge: 'CHIMES IN', badgeClass: 'social'
      });
    }
    tr.zipline.debate.interjections = interjections;

    // Persuasion roll — each champion's case is judged
    const championRolls = champions.map(c => {
      const cs = pStats(c.name);
      const supportBonus = t.members.filter(m => m !== c.name).reduce((acc, m) =>
        acc + Math.max(0, getBond(c.name, m)) * 0.15, 0);
      const roll = cs.social * 0.4 + cs.strategic * 0.3 + c.score * 0.2 + supportBonus + noise(2.5);
      return { ...c, roll };
    }).sort((a, b) => b.roll - a.roll);

    const winner = championRolls[0];
    const losers = championRolls.slice(1);
    const chosen = winner.tech;
    tr.zipline.technique = chosen;
    tr.zipline.debate.winner = { name: winner.name, techId: chosen.id, techLabel: chosen.label };

    // Bond consequences: winner gains bonds with supporters, losers get friction
    ep.chalMemberScores[winner.name] = (ep.chalMemberScores[winner.name] || 0) + 2;
    t.members.filter(m => m !== winner.name).forEach(m => {
      addBond(winner.name, m, 0.3);
    });
    losers.forEach(loser => {
      if (getBond(loser.name, winner.name) < 0) {
        addBond(loser.name, winner.name, -0.3);
      }
    });

    // Decision event
    const winPr = pronouns(winner.name);
    const decisionText = pick(ZIP_DECISION)(winner.name, chosen.label, winPr);
    tr.zipline.debate.decisionText = decisionText;
    tr.zipline.events.push({
      type: 'debate', subtype: 'decision', player: winner.name,
      text: decisionText,
      score: 0, badge: chosen.label + ' LOCKED', badgeClass: 'trek',
      _techVotes: { tbar: 0, belt: 0, piggyback: 0 }
    });

    // Tally implicit votes (champions + supporters)
    const votes = { tbar: 0, belt: 0, piggyback: 0 };
    t.members.forEach(n => {
      const s = pStats(n);
      const weights = ZIP_TECHNIQUES.map(tech => ({
        id: tech.id,
        w: s[tech.statA] * 0.1 + s[tech.statB] * 0.05 + noise(2.0)
      }));
      weights.sort((a, b) => b.w - a.w);
      votes[weights[0].id]++;
    });
    tr.zipline.techVotes = { ...votes };
    // Patch the decision event with actual votes
    const lastEvt = tr.zipline.events[tr.zipline.events.length - 1];
    if (lastEvt && lastEvt.subtype === 'decision') lastEvt._techVotes = { ...votes };

    // ── BEAT 2: CROSSINGS WITH TECHNIQUE EFFECTS ──
    const crossingOrder = [];
    const members = [...t.members];
    if (chosen.id === 'piggyback') {
      while (members.length >= 2) {
        const a = members.shift();
        let bestIdx = 0, bestBond = -99;
        members.forEach((m, i) => {
          const b = getBond(a, m);
          if (b > bestBond) { bestBond = b; bestIdx = i; }
        });
        crossingOrder.push([a, members.splice(bestIdx, 1)[0]]);
      }
      if (members.length) crossingOrder.push([members[0]]);
    } else {
      members.forEach(n => crossingOrder.push([n]));
    }

    crossingOrder.forEach((group, gi) => {
      group.forEach(n => {
        const s = pStats(n);
        const pr = pronouns(n);
        const baseSpeed = s[chosen.statA] * 0.06 + s[chosen.statB] * 0.04 + noise(2.5);
        const speed = baseSpeed * chosen.mult;

        // Freeze check — technique modifies freeze risk
        const freezeThreshold = s.boldness * 0.08 + noise(2.5);
        const freezeChance = 0.12 + chosen.freezeRisk;
        if (freezeThreshold < 0 && Math.random() < freezeChance) {
          // Tandem partners prevent freezes for each other
          if (chosen.id === 'piggyback' && group.length === 2) {
            const partner = group.find(m => m !== n);
            tr.zipline.events.push({
              type: 'social', subtype: 'tandem-save', player: partner, target: n,
              text: `${n} freezes at the edge — but ${partner} grabs ${pronouns(n).posAdj} hand. "We go together. NOW." They jump.`,
              score: 2, badge: 'TANDEM SAVE', badgeClass: 'social'
            });
            addBond(n, partner, 1.0);
            ep.chalMemberScores[n] += 2;
            ep.chalMemberScores[partner] = (ep.chalMemberScores[partner] || 0) + 1;
            tr.zipline.score += 2;
            popDelta(partner, 1);
            return;
          }

          tr.zipline.events.push({
            type: 'zipline', subtype: 'freeze', player: n,
            text: pick(ZIP_FREEZE)(n, pr),
            score: 0, badge: 'FREEZE', badgeClass: 'danger'
          });
          popDelta(n, -1);

          // Teammate reaction: encourage or heckle based on archetype & bond
          const others = t.members.filter(m => m !== n);
          if (others.length > 0) {
            const helper = pick(others);
            if (NICE_ARCHS.has(arch(helper)) || getBond(helper, n) > 0) {
              tr.zipline.events.push({
                type: 'social', subtype: 'encourage', player: helper, target: n,
                text: pick(ZIP_ENCOURAGE)(helper, n),
                badge: 'ENCOURAGE', badgeClass: 'social'
              });
              addBond(helper, n, 0.5);
            } else {
              tr.zipline.events.push({
                type: 'social', subtype: 'heckle', player: helper, target: n,
                text: pick(ZIP_HECKLE)(helper, n),
                badge: 'HECKLE', badgeClass: 'danger'
              });
              addBond(helper, n, -0.5);
              popDelta(helper, -1);
            }
          }
          return;
        }

        // Method-specific failure (~15% for belt/piggyback, ~10% for T-Bar)
        const methodFailChance = chosen.id === 'belt' ? 0.15 : chosen.id === 'piggyback' ? 0.15 : chosen.id === 'tbar' ? 0.10 : 0;
        if (Math.random() < methodFailChance) {
          const saveCheck = s.physical * 0.07 + noise(2.5);
          if (chosen.id === 'belt') {
            if (saveCheck < 0) {
              // Belt snap — potential piranha splash (~40% of belt failures)
              if (Math.random() < 0.4) {
                tr.zipline.events.push({
                  type: 'hazard', subtype: 'piranha', player: n,
                  text: pick(ZIP_PIRANHA)(n, pr),
                  score: -1, badge: 'PIRANHA!', badgeClass: 'danger'
                });
                ep.chalMemberScores[n] -= 1;
                tr.zipline.score -= 1;
                popDelta(n, -2);
              } else {
                tr.zipline.events.push({
                  type: 'hazard', subtype: 'belt-snap', player: n,
                  text: pick(ZIP_BELT_SNAP)(n, pr),
                  score: 0, badge: 'BELT SNAP!', badgeClass: 'danger'
                });
                popDelta(n, -1);
              }
            } else {
              tr.zipline.events.push({
                type: 'zipline', subtype: 'belt-save', player: n,
                text: pick(ZIP_BELT_SNAP)(n, pr) + ` But ${pr.sub} catches the cable and hauls ${pr.ref} across!`,
                score: 3, badge: 'BELT SAVE', badgeClass: 'trek'
              });
              ep.chalMemberScores[n] += 3;
              tr.zipline.score += 3;
              popDelta(n, 1);
            }
          } else if (chosen.id === 'piggyback' && group.length === 2) {
            const carrier = n;
            const rider = group.find(m => m !== n) || n;
            const cPr = pronouns(carrier);
            if (saveCheck < 0) {
              tr.zipline.events.push({
                type: 'hazard', subtype: 'piggyback-drop', player: carrier, target: rider,
                text: pick(ZIP_PIGGYBACK_DROP)(carrier, rider, cPr),
                score: 0, badge: 'DROPPED!', badgeClass: 'danger'
              });
              popDelta(carrier, -1);
              addBond(rider, carrier, -0.5);
            } else {
              tr.zipline.events.push({
                type: 'zipline', subtype: 'piggyback-save', player: carrier, target: rider,
                text: pick(ZIP_PIGGYBACK_DROP)(carrier, rider, cPr) + ` ${carrier} recovers and holds on tight!`,
                score: 2, badge: 'CATCH!', badgeClass: 'trek'
              });
              ep.chalMemberScores[carrier] += 2;
              tr.zipline.score += 2;
              addBond(rider, carrier, 0.5);
            }
          } else if (chosen.id === 'tbar') {
            if (saveCheck < 0) {
              tr.zipline.events.push({
                type: 'hazard', subtype: 'tbar-jam', player: n,
                text: pick(ZIP_TBAR_JAM)(n, pr),
                score: 1, badge: 'JAMMED!', badgeClass: 'danger'
              });
              ep.chalMemberScores[n] += 1;
              tr.zipline.score += 1;
            } else {
              tr.zipline.events.push({
                type: 'zipline', subtype: 'tbar-unjam', player: n,
                text: pick(ZIP_TBAR_JAM)(n, pr) + ` ${pr.Sub} wrenches it free and powers through!`,
                score: 3, badge: 'UNJAMMED', badgeClass: 'trek'
              });
              ep.chalMemberScores[n] += 3;
              tr.zipline.score += 3;
            }
          }
          return;
        }

        // Rope fray hazard (~15% base, modified by technique hazard resist)
        if (Math.random() < (0.15 - chosen.hazardResist)) {
          const bCheck = s.boldness * 0.08 + noise(2.5);
          if (bCheck < 0) {
            // Fray can lead to piranha splash (~25%)
            if (Math.random() < 0.25) {
              tr.zipline.events.push({
                type: 'hazard', subtype: 'piranha', player: n,
                text: pick(ZIP_FRAY)(n, pr) + ` The rope BREAKS! ` + pick(ZIP_PIRANHA)(n, pr),
                score: -1, badge: 'PIRANHA!', badgeClass: 'danger'
              });
              ep.chalMemberScores[n] -= 1;
              tr.zipline.score -= 1;
              popDelta(n, -2);
            } else {
              tr.zipline.events.push({
                type: 'hazard', subtype: 'fray', player: n,
                text: pick(ZIP_FRAY)(n, pr),
                score: 1, badge: 'ROPE FRAY', badgeClass: 'danger'
              });
              ep.chalMemberScores[n] += 1;
              tr.zipline.score += 1;
            }
          } else {
            tr.zipline.events.push({
              type: 'zipline', subtype: 'fray-dodge', player: n,
              text: pick(ZIP_FRAY)(n, pr) + ` But ${pr.sub} powers through it.`,
              score: 3, badge: 'POWERED THROUGH', badgeClass: 'trek'
            });
            ep.chalMemberScores[n] += 3;
            tr.zipline.score += 3;
            popDelta(n, 1);
          }
          return;
        }

        // Wind gust (~15%)
        if (Math.random() < 0.15) {
          const pCheck = s.physical * 0.07 + noise(2.5);
          if (pCheck < 0) {
            tr.zipline.events.push({
              type: 'hazard', subtype: 'gust', player: n,
              text: pick(ZIP_GUST)(n, pr),
              score: 1, badge: 'WIND GUST', badgeClass: 'danger'
            });
            ep.chalMemberScores[n] += 1;
            tr.zipline.score += 1;
          } else {
            tr.zipline.events.push({
              type: 'zipline', subtype: 'gust-fight', player: n,
              text: pick(ZIP_GUST)(n, pr) + ` ${pr.Sub} fights through it and lands clean.`,
              score: 3, badge: 'WIND FIGHT', badgeClass: 'trek'
            });
            ep.chalMemberScores[n] += 3;
            tr.zipline.score += 3;
          }
          return;
        }

        // Normal crossing — technique bonus determines score ceiling
        if (speed > 1) {
          tr.zipline.events.push({
            type: 'zipline', subtype: 'clean', player: n,
            text: pick(ZIP_CLEAN)(n, pr),
            score: chosen.cleanBonus, badge: 'CLEAN CROSS', badgeClass: 'trek'
          });
          ep.chalMemberScores[n] += chosen.cleanBonus;
          tr.zipline.score += chosen.cleanBonus;
        } else {
          tr.zipline.events.push({
            type: 'zipline', subtype: 'slow', player: n,
            text: pick(ZIP_SLOW)(n, pr),
            score: 2, badge: 'SLOW CROSS', badgeClass: 'trap'
          });
          ep.chalMemberScores[n] += 2;
          tr.zipline.score += 2;
        }
      });

      // Tandem pair bond boost
      if (chosen.id === 'piggyback' && group.length === 2) {
        const [a, b] = group;
        addBond(a, b, 0.5);
        popDelta(a, 1);
        popDelta(b, 1);
        tr.zipline.events.push({
          type: 'social', subtype: 'tandem-bond', player: a, target: b,
          text: `${a} and ${b} land together from the piggyback crossing. Shared adrenaline builds trust.`,
          badge: 'TANDEM', badgeClass: 'social'
        });
      }

      // Social events between crossings (~35% chance per gap)
      if (gi < crossingOrder.length - 1 && Math.random() < 0.35) {
        // Intra-tribe social events
        if (Math.random() < 0.5) {
          const pair = [pick(t.members)];
          const others = t.members.filter(m => m !== pair[0]);
          if (others.length) {
            pair.push(pick(others));
            const bond = getBond(pair[0], pair[1]);
            const a0 = arch(pair[0]);
            if (NICE_ARCHS.has(a0) || bond > 1) {
              tr.zipline.events.push({
                type: 'social', subtype: 'encourage', player: pair[0], target: pair[1],
                text: pick(ZIP_ENCOURAGE)(pair[0], pair[1]),
                badge: 'ENCOURAGE', badgeClass: 'social'
              });
              addBond(pair[0], pair[1], 0.3);
            } else if (canScheme(pair[0]) || bond < -1) {
              tr.zipline.events.push({
                type: 'social', subtype: 'heckle', player: pair[0], target: pair[1],
                text: pick(ZIP_HECKLE)(pair[0], pair[1]),
                badge: 'HECKLE', badgeClass: 'danger'
              });
              addBond(pair[0], pair[1], -0.4);
              popDelta(pair[0], -1);
            }
          }
        } else {
          // Inter-tribe social events
          const otherTribes = tribes.filter(ot => ot.tribeName !== t.tribeName);
          if (otherTribes.length > 0) {
            const ot = pick(otherTribes);
            const otMember = pick(ot.members);
            const tMember = pick(t.members);
            const bond = getBond(tMember, otMember);
            if (bond > 1 || (NICE_ARCHS.has(arch(tMember)) && Math.random() < 0.5)) {
              tr.zipline.events.push({
                type: 'social', subtype: 'rival-respect', player: tMember, target: otMember,
                text: `${tMember} calls out to ${otMember} on the other tribe: "Nice crossing!" A nod of respect across tribal lines.`,
                badge: 'RESPECT', badgeClass: 'social'
              });
              addBond(tMember, otMember, 0.3);
            } else if (bond < -1 || canScheme(tMember)) {
              tr.zipline.events.push({
                type: 'social', subtype: 'rival-taunt', player: tMember, target: otMember,
                text: `${tMember} watches ${otMember} struggle on the line and laughs. "Hope your tribe brought a backup plan!"`,
                badge: 'TAUNT', badgeClass: 'danger'
              });
              addBond(tMember, otMember, -0.5);
              popDelta(tMember, -1);
            } else {
              tr.zipline.events.push({
                type: 'social', subtype: 'rival-observe', player: tMember, target: otMember,
                text: `${tMember} sizes up ${otMember}'s technique from the platform. Mental notes for later.`,
                badge: 'SCOUTING', badgeClass: 'trap'
              });
              addBond(tMember, otMember, -0.2);
              ep.chalMemberScores[tMember] = (ep.chalMemberScores[tMember] || 0) + 1;
            }
          }
        }
      }
    });

    // ── BEAT 3: LANDING ASSESSMENT ──
    const landingText = pick(ZIP_LANDING)(tn, chosen.label);
    tr.zipline.events.push({
      type: 'zipline', subtype: 'landing', player: null,
      text: landingText,
      score: 0, badge: 'ASSESSMENT', badgeClass: 'trek'
    });
    tr.zipline.landingText = landingText;

    tr.zipline.score = Math.round(tr.zipline.score / Math.max(1, t.members.length) * 10) / 10;
  });

  // ══ PHASE 2: JUNGLE TREK ══
  tribes.forEach(t => {
    const tr = tribeResults[t.tribeName];

    // Elect pathfinder (weighted by mental)
    const pfWeights = t.members.map(n => {
      const s = pStats(n);
      return { name: n, w: s.mental * 0.1 + s.intuition * 0.05 + noise(2.5) };
    });
    pfWeights.sort((a, b) => b.w - a.w);
    tr.trek.pathfinder = pfWeights[0].name;

    // Route vote
    const routeOptions = ['machete', 'river', 'canopy'];
    const votes = { machete: 0, river: 0, canopy: 0 };
    t.members.forEach(n => {
      const s = pStats(n);
      // Preferences based on stats
      const mach = s.endurance * 0.05 + noise(2);
      const riv = s.boldness * 0.05 + s.physical * 0.03 + noise(2);
      const can = s.mental * 0.04 + s.physical * 0.04 + noise(2);
      const best = [['machete', mach], ['river', riv], ['canopy', can]].sort((a, b) => b[1] - a[1])[0][0];
      votes[best]++;
    });
    tr.trek.routeVotes = { ...votes };
    tr.trek.route = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];

    // 3 segments
    for (let seg = 0; seg < 3; seg++) {
      const segResult = { events: [], hazards: [], score: 0 };
      const pf = tr.trek.pathfinder;
      const pfStats = pStats(pf);
      const pfPr = pronouns(pf);

      // Navigation check
      const navScore = pfStats.mental * 0.06 + pfStats.intuition * 0.04 + noise(2.5);
      const routeBonus = tr.trek.route === 'machete' ? 0.5 : tr.trek.route === 'river' ? -0.5 : 0;
      const adjustedNav = navScore + routeBonus;

      if (adjustedNav > 0.5) {
        segResult.events.push({
          type: 'nav', player: pf,
          text: pick(TREK_GOOD_NAV)(pf, pfPr),
          score: 3, badge: 'NAVIGATE', badgeClass: 'trek'
        });
        ep.chalMemberScores[pf] += 3;
        segResult.score += 3;
      } else if (adjustedNav > -0.5) {
        segResult.events.push({
          type: 'nav', player: pf,
          text: pick(TREK_GOOD_NAV)(pf, pfPr),
          score: 2, badge: 'NAVIGATE', badgeClass: 'trek'
        });
        ep.chalMemberScores[pf] += 2;
        segResult.score += 2;
      } else {
        segResult.events.push({
          type: 'nav', player: pf,
          text: pick(TREK_BAD_NAV)(pf, pfPr),
          score: -2, badge: 'LOST', badgeClass: 'danger'
        });
        ep.chalMemberScores[pf] -= 2;
        segResult.score -= 2;
        popDelta(pf, -1);
      }

      // Route-specific events
      if (tr.trek.route === 'machete' && Math.random() < 0.5) {
        const cutter = pick(t.members);
        const cPr = pronouns(cutter);
        segResult.events.push({
          type: 'nav', player: cutter,
          text: pick(TREK_MACHETE)(cutter, cPr),
          score: 2, badge: 'MACHETE', badgeClass: 'trek'
        });
        ep.chalMemberScores[cutter] += 2;
        segResult.score += 2;
      } else if (tr.trek.route === 'canopy' && Math.random() < 0.5) {
        const climber = pick(t.members);
        const clPr = pronouns(climber);
        const climbCheck = pStats(climber).physical * 0.07 + pStats(climber).boldness * 0.03 + noise(2.5);
        if (climbCheck > 0) {
          segResult.events.push({
            type: 'nav', player: climber,
            text: pick(TREK_CANOPY)(climber, clPr),
            score: 4, badge: 'CANOPY', badgeClass: 'trek'
          });
          ep.chalMemberScores[climber] += 4;
          segResult.score += 4;
        } else {
          segResult.events.push({
            type: 'hazard', player: climber,
            text: `${climber} loses ${clPr.posAdj} grip on the canopy vines and crashes back to the jungle floor. Painful.`,
            score: -1, badge: 'FALL', badgeClass: 'danger'
          });
          ep.chalMemberScores[climber] -= 1;
          segResult.score -= 1;
        }
      } else if (tr.trek.route === 'river' && Math.random() < 0.5) {
        const swimmer = pick(t.members);
        const swPr = pronouns(swimmer);
        const swimCheck = pStats(swimmer).physical * 0.06 + pStats(swimmer).endurance * 0.04 + noise(2.5);
        if (swimCheck > 0) {
          segResult.events.push({
            type: 'nav', player: swimmer,
            text: pick(TREK_RIVER)(swimmer, swPr),
            score: 4, badge: 'RIVER', badgeClass: 'trek'
          });
          ep.chalMemberScores[swimmer] += 4;
          segResult.score += 4;
        } else {
          segResult.events.push({
            type: 'hazard', player: swimmer,
            text: `The current drags ${swimmer} downstream. ${swPr.Sub} fights back but the river wins this round.`,
            score: -2, badge: 'SWEPT', badgeClass: 'danger'
          });
          ep.chalMemberScores[swimmer] -= 2;
          segResult.score -= 2;
        }
      }

      // Random hazard per segment (~60%) — now includes animal encounters
      if (Math.random() < 0.6) {
        const hazardTarget = pick(t.members);
        const htPr = pronouns(hazardTarget);
        const hazardType = pick(['snake', 'vine', 'quicksand', 'swarm', 'mosquito', 'monkey', 'caterpillar']);
        const dodgeStat = hazardType === 'snake' ? 'intuition' : hazardType === 'vine' ? 'physical' : hazardType === 'quicksand' ? 'physical' : hazardType === 'monkey' ? 'mental' : hazardType === 'caterpillar' ? 'physical' : hazardType === 'mosquito' ? 'endurance' : 'endurance';
        const dodgeScore = pStats(hazardTarget)[dodgeStat] * 0.07 + noise(2.5);
        const hazardTexts = { snake: TREK_SNAKE, vine: TREK_VINE, quicksand: TREK_QUICKSAND, swarm: TREK_SWARM, mosquito: TREK_MOSQUITO, monkey: TREK_MONKEY, caterpillar: TREK_CATERPILLAR };

        if (hazardType === 'monkey') {
          if (dodgeScore > 0) {
            segResult.events.push({
              type: 'hazard', subtype: 'monkey-dodge', player: hazardTarget,
              text: pick(TREK_MONKEY_SLAP)(hazardTarget, htPr),
              score: 2, badge: 'MONKEY SLAP', badgeClass: 'trek'
            });
            ep.chalMemberScores[hazardTarget] += 2;
            segResult.score += 2;
            popDelta(hazardTarget, 1);
            segResult.hazards.push({ type: 'monkey', player: hazardTarget, dodged: true });
          } else {
            segResult.events.push({
              type: 'hazard', subtype: 'monkey', player: hazardTarget,
              text: pick(TREK_MONKEY)(hazardTarget, htPr),
              score: -3, badge: 'ROBBED!', badgeClass: 'danger'
            });
            ep.chalMemberScores[hazardTarget] -= 3;
            segResult.score -= 3;
            popDelta(hazardTarget, -1);
            segResult.hazards.push({ type: 'monkey', player: hazardTarget, dodged: false });
          }
        } else if (hazardType === 'caterpillar') {
          if (dodgeScore > 0) {
            segResult.events.push({
              type: 'hazard', subtype: 'caterpillar-dodge', player: hazardTarget,
              text: pick(TREK_CATERPILLAR)(hazardTarget, htPr) + ` But ${htPr.posAdj} teammates cut ${htPr.obj} free quickly!`,
              score: 1, badge: 'ESCAPED COCOON', badgeClass: 'trek'
            });
            ep.chalMemberScores[hazardTarget] += 1;
            segResult.score += 1;
            segResult.hazards.push({ type: 'caterpillar', player: hazardTarget, dodged: true });
          } else {
            segResult.events.push({
              type: 'hazard', subtype: 'caterpillar', player: hazardTarget,
              text: pick(TREK_CATERPILLAR)(hazardTarget, htPr),
              score: -3, badge: 'COCOONED!', badgeClass: 'danger'
            });
            ep.chalMemberScores[hazardTarget] -= 3;
            segResult.score -= 3;
            popDelta(hazardTarget, -2);
            segResult.hazards.push({ type: 'caterpillar', player: hazardTarget, dodged: false });
          }
        } else if (hazardType === 'mosquito') {
          if (dodgeScore > 0) {
            segResult.events.push({
              type: 'hazard', subtype: 'mosquito-dodge', player: hazardTarget,
              text: pick(TREK_MOSQUITO)(hazardTarget, htPr) + ` ${htPr.Sub} covers up and pushes through the swarm.`,
              score: 1, badge: 'SWATTED', badgeClass: 'trek'
            });
            ep.chalMemberScores[hazardTarget] += 1;
            segResult.score += 1;
            segResult.hazards.push({ type: 'mosquito', player: hazardTarget, dodged: true });
          } else {
            segResult.events.push({
              type: 'hazard', subtype: 'mosquito', player: hazardTarget,
              text: pick(TREK_MOSQUITO)(hazardTarget, htPr),
              score: -2, badge: 'SWOLLEN!', badgeClass: 'danger'
            });
            ep.chalMemberScores[hazardTarget] -= 2;
            segResult.score -= 2;
            popDelta(hazardTarget, -1);
            segResult.hazards.push({ type: 'mosquito', player: hazardTarget, dodged: false });
          }
        } else if (dodgeScore > 0) {
          segResult.events.push({
            type: 'hazard', subtype: hazardType + '-dodge', player: hazardTarget,
            text: pick(hazardTexts[hazardType])(hazardTarget, htPr) + ` ${htPr.Sub} handles it and pushes on.`,
            score: 1, badge: hazardType.toUpperCase() + ' DODGE', badgeClass: 'trek'
          });
          ep.chalMemberScores[hazardTarget] += 1;
          segResult.score += 1;
          segResult.hazards.push({ type: hazardType, player: hazardTarget, dodged: true });
        } else {
          segResult.events.push({
            type: 'hazard', subtype: hazardType, player: hazardTarget,
            text: pick(hazardTexts[hazardType])(hazardTarget, htPr),
            score: -2, badge: hazardType.toUpperCase(), badgeClass: 'danger'
          });
          ep.chalMemberScores[hazardTarget] -= 2;
          segResult.score -= 2;
          popDelta(hazardTarget, -1);
          segResult.hazards.push({ type: hazardType, player: hazardTarget, dodged: false });
        }
      }

      // Social event between segments
      if (seg < 2 || Math.random() < 0.5) {
        const pair = t.members.length >= 2 ? [t.members[Math.floor(Math.random() * t.members.length)]] : [];
        if (pair.length > 0) {
          let target = pick(t.members.filter(m => m !== pair[0]));
          if (!target) target = pair[0]; // fallback
          const a = pair[0], b = target;
          if (a !== b) {
            const bond = getBond(a, b);
            const aArch = arch(a);

            if (canScheme(a) && bond < 0 && Math.random() < 0.3) {
              // Sabotage
              segResult.events.push({
                type: 'social', subtype: 'sabotage', player: a, target: b,
                text: pick(SOCIAL_SABOTAGE)(a, b),
                badge: 'SABOTAGE', badgeClass: 'danger', bond: -1, pop: -1
              });
              addBond(a, b, -1);
              popDelta(a, -1);
              ep.campEvents[t.tribeName].post.push({
                type: 'amazon-sabotage', text: `${a} sabotaged ${b} during the jungle trek`,
                players: [a, b], badgeText: 'Jungle Sabotage', badgeClass: 'badge-negative'
              });
            } else if (bond < -2) {
              // Blame
              segResult.events.push({
                type: 'social', subtype: 'blame', player: a, target: b,
                text: pick(SOCIAL_BLAME)(a, b),
                badge: 'BLAME', badgeClass: 'danger', bond: -1
              });
              addBond(a, b, -1);
              popDelta(a, -1);
            } else if (bond < 0) {
              // Rivalry
              segResult.events.push({
                type: 'social', subtype: 'rivalry', player: a, target: b,
                text: pick(SOCIAL_RIVAL)(a, b),
                badge: 'RIVALRY', badgeClass: 'danger', bond: -0.5
              });
              addBond(a, b, -0.5);
            } else if (NICE_ARCHS.has(aArch) || bond > 2) {
              // Encourage
              segResult.events.push({
                type: 'social', subtype: 'encourage', player: a, target: b,
                text: pick(SOCIAL_ENCOURAGE)(a, b),
                badge: 'ENCOURAGE', badgeClass: 'social', bond: 1
              });
              addBond(a, b, 1);
              popDelta(a, 1);
            } else {
              // Bond moment
              segResult.events.push({
                type: 'social', subtype: 'bond', player: a, target: b,
                text: pick(SOCIAL_BOND)(a, b),
                badge: 'BOND', badgeClass: 'social', bond: 0.5
              });
              addBond(a, b, 0.5);
            }
          }
        }
      }

      tr.trek.segments.push(segResult);
      tr.trek.score += segResult.score;

      // ── OVERNIGHT CAMPING (between segments 2 and 3) ──
      if (seg === 1) {
        const campResult = { events: [], score: 0, isCamp: true };
        campResult.events.push({
          type: 'camp', subtype: 'setup', player: null,
          text: pick(TREK_CAMP_SETUP)(t.tribeName),
          score: 0, badge: 'NIGHTFALL', badgeClass: 'tribe'
        });

        // 2-3 night events per tribe
        const nightEventCount = 2 + (Math.random() < 0.5 ? 1 : 0);
        const usedNightTargets = new Set();
        for (let ne = 0; ne < nightEventCount; ne++) {
          const nightRoll = Math.random();
          const availableTargets = t.members.filter(m => !usedNightTargets.has(m));
          if (!availableTargets.length) break;
          const target = pick(availableTargets);
          usedNightTargets.add(target);
          const tPr = pronouns(target);
          const tStats = pStats(target);

          if (nightRoll < 0.25) {
            // Monkey raid at night
            const monkeyCheck = tStats.physical * 0.06 + noise(2.5);
            if (monkeyCheck > 0) {
              campResult.events.push({
                type: 'hazard', subtype: 'night-monkey', player: target,
                text: pick(TREK_NIGHT_MONKEY)(target, tPr),
                score: 2, badge: 'MONKEY SLAP', badgeClass: 'trek'
              });
              ep.chalMemberScores[target] += 2;
              campResult.score += 2;
              popDelta(target, 1);
            } else {
              campResult.events.push({
                type: 'hazard', subtype: 'night-monkey', player: target,
                text: pick(TREK_NIGHT_MONKEY)(target, tPr) + ` The monkeys get away with everything.`,
                score: -2, badge: 'RAIDED', badgeClass: 'danger'
              });
              ep.chalMemberScores[target] -= 2;
              campResult.score -= 2;
            }
          } else if (nightRoll < 0.45) {
            // Caterpillar cocoon at night
            const escapeCheck = tStats.physical * 0.06 + noise(2.5);
            if (escapeCheck > 0) {
              campResult.events.push({
                type: 'hazard', subtype: 'night-caterpillar', player: target,
                text: pick(TREK_NIGHT_CATERPILLAR)(target, tPr) + ` Teammates cut ${tPr.obj} free quickly.`,
                score: 1, badge: 'ESCAPED', badgeClass: 'trek'
              });
              ep.chalMemberScores[target] += 1;
              campResult.score += 1;
            } else {
              campResult.events.push({
                type: 'hazard', subtype: 'night-caterpillar', player: target,
                text: pick(TREK_NIGHT_CATERPILLAR)(target, tPr),
                score: -3, badge: 'COCOONED!', badgeClass: 'danger'
              });
              ep.chalMemberScores[target] -= 3;
              campResult.score -= 3;
              popDelta(target, -1);
            }
          } else if (nightRoll < 0.75 && t.members.length >= 2) {
            // Night bonding
            const partner = pick(t.members.filter(m => m !== target));
            if (partner) {
              const bond = getBond(target, partner);
              if (bond > -2) {
                campResult.events.push({
                  type: 'social', subtype: 'night-bond', player: target, target: partner,
                  text: pick(TREK_NIGHT_BOND)(target, partner),
                  score: 0, badge: 'NIGHT BOND', badgeClass: 'social'
                });
                addBond(target, partner, 1.5);
              } else {
                campResult.events.push({
                  type: 'social', subtype: 'night-paranoia', player: target, target: partner,
                  text: pick(TREK_NIGHT_PARANOIA)(target, partner),
                  score: 0, badge: 'PARANOIA', badgeClass: 'danger'
                });
                addBond(target, partner, -0.5);
                popDelta(target, -1);
              }
            }
          } else {
            // Mosquito swarm at night
            campResult.events.push({
              type: 'hazard', subtype: 'night-mosquito', player: target,
              text: `${target} barely sleeps. The giant mosquitoes feast on ${tPr.obj} all night. ${tPr.Sub} looks wrecked by morning.`,
              score: -1, badge: 'BITTEN', badgeClass: 'danger'
            });
            ep.chalMemberScores[target] -= 1;
            campResult.score -= 1;
          }
        }

        // Camp event injection
        ep.campEvents[t.tribeName].post.push({
          type: 'amazon-camp', text: `${t.tribeName} spent a night in the deep jungle`,
          players: [...t.members], badgeText: 'Jungle Camp', badgeClass: 'badge-neutral'
        });

        tr.trek.segments.push(campResult);
        tr.trek.score += campResult.score;
      }
    }
    tr.trek.score = Math.round(tr.trek.score / Math.max(1, t.members.length) * 10) / 10;
  });

  // ══ PHASE 3: GUARDIAN ENCOUNTER ══
  tribes.forEach(t => {
    const tr = tribeResults[t.tribeName];

    // Arrival — dramatic setup before mechanics
    tr.guardian.events.push({
      type: 'guardian', subtype: 'arrival',
      text: pick(GUARD_ARRIVAL)(t.tribeName, t.members),
      badge: 'AMBUSH', badgeClass: 'danger'
    });

    // ── SPEAKER NOMINATION DEBATE ──
    const spkWeights = {};
    t.members.forEach(n => {
      const s = pStats(n);
      spkWeights[n] = s.social * 0.08 + s.charisma * 0.04 + noise(2.5);
    });
    const speakerRanked = t.members.slice().sort((a, b) => spkWeights[b] - spkWeights[a]);
    const speaker = speakerRanked[0];
    const speakerVotes = {};
    t.members.forEach(n => {
      const bestPick = t.members.slice().sort((a, b) => {
        const aW = spkWeights[a] + (a === n ? 1 : 0) + noise(1);
        const bW = spkWeights[b] + (b === n ? 1 : 0) + noise(1);
        return bW - aW;
      })[0];
      speakerVotes[bestPick] = (speakerVotes[bestPick] || 0) + 1;
    });
    tr.guardian.speaker = speaker;
    tr.guardian.speakerVotes = { ...speakerVotes };

    const sPr = pronouns(speaker);
    const sStats = pStats(speaker);
    const sArch = arch(speaker);

    // Speaker self-nominates or gets nominated
    const selfNom = ['social-butterfly', 'mastermind', 'villain', 'challenge-beast', 'hero'].includes(sArch) || (sStats.social * 0.12 + noise(1.5) > 0.6);
    if (selfNom) {
      tr.guardian.events.push({
        type: 'debate', subtype: 'nomination', player: speaker,
        text: pick(GUARD_NOMINATE_SELF)(speaker, sPr),
        badge: 'VOLUNTEERS', badgeClass: 'tribe'
      });
    } else {
      const nominator = t.members.filter(m => m !== speaker).sort(() => Math.random() - 0.5)[0];
      if (nominator) {
        tr.guardian.events.push({
          type: 'debate', subtype: 'nomination', player: nominator,
          text: pick(GUARD_NOMINATE_OTHER)(nominator, pronouns(nominator), speaker, sPr),
          badge: 'NOMINATES', badgeClass: 'tribe'
        });
      }
    }

    // Someone might refuse or deflect (20% chance, not the speaker)
    const refuser = t.members.filter(m => m !== speaker && (pStats(m).social * 0.1 + noise(1.5) < 0.4)).sort(() => Math.random() - 0.5)[0];
    if (refuser && Math.random() < 0.2) {
      tr.guardian.events.push({
        type: 'debate', subtype: 'refusal', player: refuser,
        text: pick(GUARD_NOMINATE_REFUSE)(refuser, pronouns(refuser)),
        badge: 'REFUSES', badgeClass: 'social'
      });
    }

    // ── APPROACH DEBATE ──
    const approachVotes = { peaceful: 0, bold: 0, sneaky: 0 };
    t.members.forEach(n => {
      const s = pStats(n);
      const a = arch(n);
      const peaceW = s.social * 0.05 + noise(2);
      const boldW = s.boldness * 0.05 + s.physical * 0.02 + noise(2);
      const sneakW = s.intuition * 0.05 + s.strategic * 0.03 + noise(2);
      if (NICE_ARCHS.has(a)) {
        const best = peaceW >= sneakW ? 'peaceful' : 'sneaky';
        approachVotes[best]++;
      } else if (VILLAIN_ARCHS.has(a)) {
        const best = sneakW >= boldW ? 'sneaky' : 'bold';
        approachVotes[best]++;
      } else {
        const best = [['peaceful', peaceW], ['bold', boldW], ['sneaky', sneakW]].sort((a, b) => b[1] - a[1])[0][0];
        approachVotes[best]++;
      }
    });
    tr.guardian.approachVotes = { ...approachVotes };
    tr.guardian.approach = Object.entries(approachVotes).sort((a, b) => b[1] - a[1])[0][0];

    // 2-3 approach advocates from tribe members
    const usedAdvocates = new Set();
    const approachPools = { peaceful: GUARD_ADVOCATE_PEACEFUL, bold: GUARD_ADVOCATE_BOLD, sneaky: GUARD_ADVOCATE_SNEAKY };
    const approaches = ['peaceful', 'bold', 'sneaky'].filter(a => approachVotes[a] > 0);
    approaches.forEach(appr => {
      const eligible = t.members.filter(m => !usedAdvocates.has(m));
      if (!eligible.length) return;
      const advocate = eligible.sort((a, b) => {
        const aFit = appr === 'peaceful' ? pStats(a).social : appr === 'bold' ? pStats(a).boldness : pStats(a).intuition;
        const bFit = appr === 'peaceful' ? pStats(b).social : appr === 'bold' ? pStats(b).boldness : pStats(b).intuition;
        return (bFit + noise(2)) - (aFit + noise(2));
      })[0];
      usedAdvocates.add(advocate);
      const advPr = pronouns(advocate);
      tr.guardian.events.push({
        type: 'debate', subtype: 'advocacy', player: advocate,
        text: pick(approachPools[appr])(advocate, advPr),
        badge: appr.toUpperCase(), badgeClass: 'trek'
      });
    });

    // 1-2 interjections from bystanders
    const interjPool = t.members.filter(m => !usedAdvocates.has(m));
    const numInterj = interjPool.length >= 2 ? (1 + (Math.random() < 0.5 ? 1 : 0)) : interjPool.length;
    for (let ii = 0; ii < numInterj; ii++) {
      if (!interjPool.length) break;
      const idx = Math.floor(Math.random() * interjPool.length);
      const interjector = interjPool.splice(idx, 1)[0];
      const iPr = pronouns(interjector);
      const iArch = arch(interjector);
      let pool = GUARD_APPROACH_INTERJECT.loyal;
      if (iArch === 'hothead') pool = GUARD_APPROACH_INTERJECT.hothead;
      else if (iArch === 'hero') pool = GUARD_APPROACH_INTERJECT.hero;
      else if (['villain', 'mastermind', 'schemer'].includes(iArch)) pool = GUARD_APPROACH_INTERJECT.villain;
      else if (iArch === 'social-butterfly') pool = GUARD_APPROACH_INTERJECT.socialButterfly;
      else if (['underdog', 'goat'].includes(iArch)) pool = GUARD_APPROACH_INTERJECT.underdog;
      tr.guardian.events.push({
        type: 'debate', subtype: 'interjection', player: interjector,
        text: pick(pool)(interjector, iPr),
        badge: 'CHIMES IN', badgeClass: 'social'
      });
    }

    // Decision card
    tr.guardian.events.push({
      type: 'debate', subtype: 'decision', player: speaker,
      text: pick(GUARD_APPROACH_DECIDED)(speaker, tr.guardian.approach),
      badge: tr.guardian.approach.toUpperCase() + ' LOCKED', badgeClass: 'trek'
    });

    // Speaker executes the approach
    const approachTexts = { peaceful: GUARD_PEACEFUL, bold: GUARD_BOLD, sneaky: GUARD_SNEAKY };
    tr.guardian.events.push({
      type: 'guardian', subtype: 'approach', player: speaker,
      text: pick(approachTexts[tr.guardian.approach])(speaker, sPr),
      badge: tr.guardian.approach.toUpperCase(), badgeClass: 'tribe'
    });

    // Success check
    let difficulty = 0.3;
    let checkStat;
    if (tr.guardian.approach === 'peaceful') {
      checkStat = sStats.social * 0.08 + sStats.charisma * 0.04;
      difficulty = 0.2;
    } else if (tr.guardian.approach === 'bold') {
      checkStat = sStats.boldness * 0.06 + sStats.physical * 0.04 + sStats.charisma * 0.03;
      difficulty = 0.5;
    } else {
      checkStat = sStats.intuition * 0.07 + sStats.strategic * 0.05;
      difficulty = 0.35;
    }

    const guardCheck = checkStat + noise(2.5) - difficulty;
    tr.guardian.success = guardCheck > 0;

    if (tr.guardian.success) {
      tr.guardian.events.push({
        type: 'guardian', subtype: 'success', player: speaker,
        text: pick(GUARD_SUCCESS)(t.tribeName),
        score: 5, badge: 'PASSAGE GRANTED', badgeClass: 'trek'
      });
      tr.guardian.score = 5;
      ep.chalMemberScores[speaker] += 5;
      popDelta(speaker, 2);
      t.members.filter(m => m !== speaker).forEach(m => addBond(m, speaker, 0.5));
      ep.campEvents[t.tribeName].post.push({
        type: 'amazon-guardian', text: `${speaker} convinced the jungle guardians to let ${t.tribeName} pass`,
        players: [speaker], badgeText: 'Guardian Speaker', badgeClass: 'badge-positive'
      });
    } else {
      tr.guardian.events.push({
        type: 'guardian', subtype: 'fail', player: speaker,
        text: pick(GUARD_FAIL)(t.tribeName, speaker),
        score: -3, badge: 'BLOCKED', badgeClass: 'danger'
      });
      tr.guardian.score = -3;
      ep.chalMemberScores[speaker] -= 3;
      popDelta(speaker, -2);
      // Blame from teammates
      const blamer = t.members.filter(m => m !== speaker && getBond(m, speaker) < 2).sort(() => Math.random() - 0.5)[0];
      if (blamer) {
        tr.guardian.events.push({
          type: 'social', subtype: 'blame', player: blamer, target: speaker,
          text: pick(SOCIAL_BLAME)(blamer, speaker),
          badge: 'BLAME', badgeClass: 'danger', bond: -1
        });
        addBond(blamer, speaker, -1);
      }
    }

    // Heather/goddess subplot — someone with high charisma gets worshipped
    const goddessCandidate = t.members.slice().sort((a, b) =>
      (pStats(b).charisma * 0.1 + pStats(b).social * 0.05 + noise(1.5)) -
      (pStats(a).charisma * 0.1 + pStats(a).social * 0.05 + noise(1.5))
    )[0];
    if (goddessCandidate && Math.random() < 0.4) {
      const gPr = pronouns(goddessCandidate);
      tr.guardian.events.push({
        type: 'guardian', subtype: 'goddess', player: goddessCandidate,
        text: pick(GUARD_HEATHER_GODDESS)(goddessCandidate, gPr),
        score: 1, badge: 'CHOSEN ONE', badgeClass: 'frag'
      });
      tr.guardian.goddess = goddessCandidate;
      ep.chalMemberScores[goddessCandidate] += 1;
      popDelta(goddessCandidate, 1);
    }

  });

  // FAKE REVEAL — one shared moment, Chef exposes the Zing-Zings as actors
  const fakeRevealEvents = [];
  fakeRevealEvents.push({
    type: 'guardian', subtype: 'fake-reveal', player: null,
    text: pick(GUARD_FAKE_REVEAL)(tribes[0].tribeName),
    score: 0, badge: 'BUSTED!', badgeClass: 'tribe'
  });

  // 2-3 reactions from random players across all tribes
  const allGuardMembers = tribes.flatMap(t => t.members);
  const reactors = allGuardMembers.slice().sort(() => Math.random() - 0.5);
  const numReactions = Math.min(reactors.length, 2 + (Math.random() < 0.5 ? 1 : 0));
  const usedReactTypes = new Set();
  for (let ri = 0; ri < numReactions; ri++) {
    const reactor = reactors[ri];
    const rPr = pronouns(reactor);
    const rArch = arch(reactor);

    // Goddess gets the goddess reaction
    const isGoddess = tribes.some(t => tribeResults[t.tribeName].guardian.goddess === reactor);
    let reactType;
    if (isGoddess && !usedReactTypes.has('goddess')) {
      reactType = 'goddess';
    } else if (['villain', 'mastermind', 'schemer', 'perceptive-player'].includes(rArch) && !usedReactTypes.has('smug')) {
      reactType = 'smug';
    } else if (['hothead'].includes(rArch) && !usedReactTypes.has('angry')) {
      reactType = 'angry';
    } else if (!usedReactTypes.has('shocked')) {
      reactType = 'shocked';
    } else {
      reactType = pick(['smug', 'shocked', 'angry'].filter(r => !usedReactTypes.has(r))) || 'shocked';
    }
    usedReactTypes.add(reactType);

    fakeRevealEvents.push({
      type: 'guardian', subtype: 'fake-reaction', player: reactor,
      text: pick(GUARD_FAKE_REACTION[reactType])(reactor, rPr),
      score: 0, badge: reactType === 'goddess' ? 'DEVASTATED' : reactType === 'angry' ? 'FURIOUS' : reactType === 'smug' ? 'KNEW IT' : 'SHOCKED',
      badgeClass: reactType === 'angry' ? 'danger' : 'social'
    });
  }

  // Store fake reveal events separately so VP can render them after all tribes
  tribes.forEach(t => { tribeResults[t.tribeName].guardian.fakeReveal = true; });
  // Attach to first tribe's results for simplicity — VP will pull from a shared key
  const fakeRevealData = { events: fakeRevealEvents };

  // ══ PHASE 4: TREASURE HUNT IN RUINS ══
  const FRAGMENTS_NEEDED = 4;
  const ruinsRooms = ['entrance', 'corridors', 'sanctum'];

  // Initialize per-tribe ruins data
  tribes.forEach(t => {
    const tr = tribeResults[t.tribeName];
    tr.ruins.rooms = [];
  });

  // ── ROOM 1: ENTRANCE HALL ──
  tribes.forEach(t => {
    const tr = tribeResults[t.tribeName];
    // Entrance narration
    tr.ruins.events.push({
      type: 'chatter', subtype: 'entrance',
      text: pick(RUINS_ENTRANCE)(t.tribeName),
      badge: 'ENTRANCE', badgeClass: 'tribe'
    });

    // 1-2 members search the entrance hall — can find 1 fragment here
    const searchers = t.members.slice().sort(() => Math.random() - 0.5).slice(0, Math.min(2, t.members.length));
    searchers.forEach(n => {
      const s = pStats(n);
      const pr = pronouns(n);
      const searchScore = s.intuition * 0.06 + s.mental * 0.05 + noise(2.5);

      if (searchScore > 0.4 && tr.ruins.fragmentsFound < FRAGMENTS_NEEDED && tr.ruins.fragmentsFound < 1) {
        tr.ruins.fragmentsFound++;
        tr.ruins.events.push({
          type: 'frag', player: n,
          text: pick(RUINS_FOUND)(n, pr),
          score: 2, badge: 'FRAGMENT', badgeClass: 'frag'
        });
        ep.chalMemberScores[n] += 2;
        tr.ruins.score += 2;
        popDelta(n, 1);
      }

      // Entrance trap (~25%)
      if (Math.random() < 0.25) {
        const dodgeScore = s.physical * 0.06 + s.intuition * 0.04 + noise(2.5);
        if (dodgeScore > 0) {
          tr.ruins.events.push({
            type: 'trap', subtype: 'dodge', player: n,
            text: pick(RUINS_TRAP_DODGE)(n, pr),
            score: 1, badge: 'TRAP DODGE', badgeClass: 'trek'
          });
          ep.chalMemberScores[n] += 1;
          tr.ruins.score += 1;
          tr.ruins.traps.push({ player: n, dodged: true });
        } else {
          tr.ruins.events.push({
            type: 'trap', subtype: 'hit', player: n,
            text: pick(RUINS_TRAP_HIT)(n, pr),
            score: -2, badge: 'TRAP', badgeClass: 'danger'
          });
          ep.chalMemberScores[n] -= 2;
          tr.ruins.score -= 2;
          popDelta(n, -1);
          tr.ruins.traps.push({ player: n, dodged: false });
        }
      }
    });

    tr.ruins.rooms.push('entrance');
  });

  // ── CROSS-TRIBE: ENTRANCE COLLISION ──
  // Tribes run into each other in the entrance hall
  if (tribes.length >= 2) {
    const t1 = tribes[Math.floor(Math.random() * tribes.length)];
    const t2 = tribes.filter(t => t !== t1)[Math.floor(Math.random() * (tribes.length - 1))];
    const p1 = pick(t1.members);
    const p2 = pick(t2.members);
    if (p1 && p2) {
      const p1Pr = pronouns(p1);
      const p2Pr = pronouns(p2);
      // Taunt or block
      if (canScheme(p1) && Math.random() < 0.5) {
        result.crossTribeEvents = result.crossTribeEvents || [];
        const evt = {
          type: 'social', subtype: 'cross-block', player: p1, target: p2,
          text: pick(RUINS_CROSS_BLOCK)(p1, p1Pr, p2, p2Pr, t1.tribeName),
          badge: 'BLOCKED!', badgeClass: 'danger'
        };
        result.crossTribeEvents.push(evt);
        addBond(p1, p2, -0.5);
        addBond(p2, p1, -0.5);
        popDelta(p1, -1);
      } else {
        const tr1 = tribeResults[t1.tribeName];
        const tr2 = tribeResults[t2.tribeName];
        result.crossTribeEvents = result.crossTribeEvents || [];
        const evt = {
          type: 'social', subtype: 'cross-taunt', player: p1, target: p2,
          text: pick(RUINS_CROSS_TAUNT)(p1, p1Pr, p2, p2Pr, tr1.ruins.fragmentsFound, tr2.ruins.fragmentsFound),
          badge: 'TRASH TALK', badgeClass: 'social'
        };
        result.crossTribeEvents.push(evt);
        addBond(p1, p2, -0.3);
        popDelta(p1, -1);
      }
    }
  }

  // ── ROOM 2: CORRIDORS ──
  tribes.forEach(t => {
    const tr = tribeResults[t.tribeName];
    // Corridor narration
    tr.ruins.events.push({
      type: 'chatter', subtype: 'corridor',
      text: pick(RUINS_CORRIDOR)(t.tribeName),
      badge: 'CORRIDORS', badgeClass: 'tribe'
    });

    // Puzzle door — one member attempts it
    const puzzler = t.members.slice().sort((a, b) =>
      (pStats(b).mental * 0.1 + pStats(b).intuition * 0.05 + noise(1.5)) -
      (pStats(a).mental * 0.1 + pStats(a).intuition * 0.05 + noise(1.5))
    )[0];
    if (puzzler) {
      const pzPr = pronouns(puzzler);
      const pzStats = pStats(puzzler);
      const puzzleCheck = pzStats.mental * 0.07 + pzStats.intuition * 0.05 + noise(2.5);

      tr.ruins.events.push({
        type: 'trap', subtype: 'puzzle', player: puzzler,
        text: pick(RUINS_PUZZLE)(puzzler, pzPr),
        badge: 'PUZZLE', badgeClass: 'trek'
      });

      if (puzzleCheck > 0.3) {
        tr.ruins.events.push({
          type: 'trap', subtype: 'puzzle-solve', player: puzzler,
          text: pick(RUINS_PUZZLE_SOLVE)(puzzler, pzPr),
          score: 3, badge: 'SOLVED!', badgeClass: 'frag'
        });
        ep.chalMemberScores[puzzler] += 3;
        tr.ruins.score += 3;
        popDelta(puzzler, 1);
        t.members.filter(m => m !== puzzler).forEach(m => addBond(m, puzzler, 0.3));
      } else {
        tr.ruins.events.push({
          type: 'trap', subtype: 'puzzle-fail', player: puzzler,
          text: pick(RUINS_PUZZLE_FAIL)(puzzler, pzPr),
          score: -2, badge: 'FAILED', badgeClass: 'danger'
        });
        ep.chalMemberScores[puzzler] -= 2;
        tr.ruins.score -= 2;
      }
    }

    // Corridor fragment searches — 2 members can find fragments here
    const corridorSearchers = t.members.slice().sort(() => Math.random() - 0.5);
    corridorSearchers.forEach(n => {
      const s = pStats(n);
      const pr = pronouns(n);
      const a = arch(n);

      // Fragment chance — harder in corridors
      const searchScore = s.intuition * 0.06 + s.mental * 0.04 + noise(2.5);
      if (searchScore > 0.35 && tr.ruins.fragmentsFound < FRAGMENTS_NEEDED && tr.ruins.fragmentsFound < 3) {
        tr.ruins.fragmentsFound++;
        tr.ruins.events.push({
          type: 'frag', player: n,
          text: pick(RUINS_FOUND)(n, pr),
          score: 2, badge: 'FRAGMENT', badgeClass: 'frag'
        });
        ep.chalMemberScores[n] += 2;
        tr.ruins.score += 2;
        popDelta(n, 1);
      }

      // Traps more frequent in corridors (~30%)
      if (Math.random() < 0.30) {
        const dodgeScore = s.physical * 0.06 + s.intuition * 0.04 + noise(2.5);
        if (dodgeScore > 0) {
          tr.ruins.events.push({
            type: 'trap', subtype: 'dodge', player: n,
            text: pick(RUINS_TRAP_DODGE)(n, pr),
            score: 1, badge: 'TRAP DODGE', badgeClass: 'trek'
          });
          ep.chalMemberScores[n] += 1;
          tr.ruins.score += 1;
          tr.ruins.traps.push({ player: n, dodged: true });
        } else {
          tr.ruins.events.push({
            type: 'trap', subtype: 'hit', player: n,
            text: pick(RUINS_TRAP_HIT)(n, pr),
            score: -2, badge: 'TRAP', badgeClass: 'danger'
          });
          ep.chalMemberScores[n] -= 2;
          tr.ruins.score -= 2;
          popDelta(n, -1);
          tr.ruins.traps.push({ player: n, dodged: false });
        }
      }

      // Collapse hazard (~15%)
      if (Math.random() < 0.15) {
        const escape = s.physical * 0.07 + noise(2.5);
        if (escape > 0) {
          tr.ruins.events.push({
            type: 'hazard', subtype: 'collapse-dodge', player: n,
            text: pick(RUINS_COLLAPSE)(n, pr),
            score: 1, badge: 'ESCAPE', badgeClass: 'trek'
          });
          ep.chalMemberScores[n] += 1;
          tr.ruins.score += 1;
        } else {
          tr.ruins.events.push({
            type: 'hazard', subtype: 'collapse', player: n,
            text: pick(RUINS_COLLAPSE)(n, pr) + ` The rubble costs ${pr.obj} valuable time.`,
            score: -1, badge: 'COLLAPSE', badgeClass: 'danger'
          });
          ep.chalMemberScores[n] -= 1;
          tr.ruins.score -= 1;
        }
      }

      // Help or sabotage (~25%)
      if (Math.random() < 0.25 && t.members.length >= 2) {
        const target = pick(t.members.filter(m => m !== n));
        if (target) {
          if (canScheme(n) && getBond(n, target) < 0) {
            tr.ruins.events.push({
              type: 'social', subtype: 'sabotage', player: n, target,
              text: pick(RUINS_SABOTAGE)(n, target),
              badge: 'SABOTAGE', badgeClass: 'danger', bond: -1
            });
            addBond(n, target, -1);
            popDelta(n, -1);
          } else if (NICE_ARCHS.has(a) || getBond(n, target) > 1) {
            tr.ruins.events.push({
              type: 'social', subtype: 'help', player: n, target,
              text: pick(RUINS_HELP)(n, target),
              badge: 'TEAMWORK', badgeClass: 'social', bond: 0.5
            });
            addBond(n, target, 0.5);
            popDelta(n, 1);
            ep.chalMemberScores[target] += 1;
          }
        }
      }
    });

    // Decoy treasure (~25% per tribe in corridors)
    if (Math.random() < 0.25) {
      const decoyVictim = pick(t.members);
      if (decoyVictim) {
        const dvS = pStats(decoyVictim);
        const dvPr = pronouns(decoyVictim);
        const intCheck = dvS.intuition * 0.06 + dvS.mental * 0.04 + noise(2.5);
        if (intCheck > 0.5) {
          tr.ruins.events.push({
            type: 'trap', subtype: 'decoy-spot', player: decoyVictim,
            text: `${decoyVictim} reaches for a gleaming idol, then stops. Something's off. The pedestal has a pressure plate. Smart call — it's a DECOY.`,
            score: 2, badge: 'DECOY SPOTTED', badgeClass: 'trek'
          });
          ep.chalMemberScores[decoyVictim] += 2;
          tr.ruins.score += 2;
          popDelta(decoyVictim, 1);
        } else {
          const escapeCheck = dvS.physical * 0.07 + noise(2.5);
          if (escapeCheck > 0) {
            tr.ruins.events.push({
              type: 'hazard', subtype: 'decoy-escape', player: decoyVictim,
              text: pick(RUINS_DECOY)(decoyVictim, dvPr) + ' ' + pick(RUINS_DECOY_ESCAPE)(decoyVictim, dvPr),
              score: -1, badge: 'DECOY TRAP!', badgeClass: 'danger'
            });
            ep.chalMemberScores[decoyVictim] -= 1;
            tr.ruins.score -= 1;
            popDelta(decoyVictim, -1);
          } else {
            tr.ruins.events.push({
              type: 'hazard', subtype: 'decoy-hit', player: decoyVictim,
              text: pick(RUINS_DECOY)(decoyVictim, dvPr) + ' ' + pick(RUINS_DECOY_HIT)(decoyVictim, dvPr),
              score: -4, badge: 'BURIED!', badgeClass: 'danger'
            });
            ep.chalMemberScores[decoyVictim] -= 4;
            tr.ruins.score -= 4;
            popDelta(decoyVictim, -2);
          }
        }
      }
    }

    // Showmance moment in dark corridors (~30% if active showmance in tribe)
    if (seasonConfig.romance) {
      const activeShowmances = (gs.showmances || []).filter(sh => !sh.broken);
      const tribeShowmance = activeShowmances.find(sh =>
        t.members.includes(sh.a) && t.members.includes(sh.b)
      );
      if (tribeShowmance && Math.random() < 0.3) {
        const [sa, sb] = [tribeShowmance.a, tribeShowmance.b];
        const saPr = pronouns(sa);
        const texts = [
          `In the dark corridor, ${sa} grabs ${sb}'s hand. Neither lets go. "Stay close," ${sa} whispers. For once, it's not strategy.`,
          `A trap nearly catches ${sb}. ${sa} yanks ${saPr.obj === 'him' ? 'her' : 'him'} back just in time. They stand chest-to-chest in the dark, breathing hard. The rescue lingers.`,
          `${sa} and ${sb} end up alone in a dead-end corridor. The torchlight flickers. "You okay?" "Better now." The ruins don't care about showmances. They do.`,
          `${sb} stumbles in the dark. ${sa} catches ${pronouns(sb).obj}. Their faces are inches apart. "This is NOT the time," ${sb} says. Neither moves.`,
        ];
        tr.ruins.events.push({
          type: 'social', subtype: 'bond', player: sa, target: sb,
          text: pick(texts),
          badge: 'MOMENT', badgeClass: 'social'
        });
        addBond(sa, sb, 0.8);
        popDelta(sa, 1);
        popDelta(sb, 1);
      }
    }

    tr.ruins.rooms.push('corridors');
  });

  // ── CROSS-TRIBE: FRAGMENT RACE ──
  // Two players from different tribes race for the same fragment
  if (tribes.length >= 2) {
    const raceTribes = tribes.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    const racer1 = pick(raceTribes[0].members);
    const racer2 = pick(raceTribes[1].members);
    if (racer1 && racer2) {
      const r1Pr = pronouns(racer1);
      const r2Pr = pronouns(racer2);
      const r1S = pStats(racer1);
      const r2S = pStats(racer2);
      result.crossTribeEvents = result.crossTribeEvents || [];

      // Race setup
      result.crossTribeEvents.push({
        type: 'social', subtype: 'cross-race', player: racer1, target: racer2,
        text: pick(RUINS_CROSS_RACE)(racer1, r1Pr, racer2, r2Pr),
        badge: 'RACE!', badgeClass: 'danger'
      });

      // Who wins the race
      const r1Score = r1S.physical * 0.06 + r1S.boldness * 0.04 + noise(2.5);
      const r2Score = r2S.physical * 0.06 + r2S.boldness * 0.04 + noise(2.5);
      const winner = r1Score >= r2Score ? racer1 : racer2;
      const loser = winner === racer1 ? racer2 : racer1;
      const wPr = pronouns(winner);
      const lPr = pronouns(loser);
      const winnerTribe = tribes.find(t => t.members.includes(winner));
      const winTr = tribeResults[winnerTribe.tribeName];

      result.crossTribeEvents.push({
        type: 'social', subtype: 'cross-win', player: winner, target: loser,
        text: pick(RUINS_CROSS_WIN)(winner, wPr, loser, lPr),
        badge: 'SNATCHED!', badgeClass: 'frag'
      });

      if (winTr.ruins.fragmentsFound < FRAGMENTS_NEEDED) {
        winTr.ruins.fragmentsFound++;
        ep.chalMemberScores[winner] += 3;
        winTr.ruins.score += 3;
        popDelta(winner, 2);
      }
      addBond(winner, loser, -0.5);
      addBond(loser, winner, -0.5);
      popDelta(loser, -1);
    }
  }

  // ── ROOM 3: INNER SANCTUM ──
  tribes.forEach(t => {
    const tr = tribeResults[t.tribeName];
    // Sanctum narration
    tr.ruins.events.push({
      type: 'chatter', subtype: 'sanctum',
      text: pick(RUINS_SANCTUM)(t.tribeName),
      badge: 'INNER SANCTUM', badgeClass: 'frag'
    });

    // Remaining fragments found here — easier in the sanctum
    t.members.forEach(n => {
      if (tr.ruins.fragmentsFound >= FRAGMENTS_NEEDED) return;
      const s = pStats(n);
      const pr = pronouns(n);
      const searchScore = s.intuition * 0.05 + s.mental * 0.04 + noise(2.5);

      if (searchScore > 0.2) {
        tr.ruins.fragmentsFound++;
        tr.ruins.events.push({
          type: 'frag', player: n,
          text: pick(RUINS_FOUND)(n, pr),
          score: 2, badge: 'FRAGMENT', badgeClass: 'frag'
        });
        ep.chalMemberScores[n] += 2;
        tr.ruins.score += 2;
        popDelta(n, 1);
      }

      // Final traps in sanctum (~20%)
      if (Math.random() < 0.20) {
        const dodgeScore = s.physical * 0.06 + s.intuition * 0.04 + noise(2.5);
        if (dodgeScore > 0) {
          tr.ruins.events.push({
            type: 'trap', subtype: 'dodge', player: n,
            text: pick(RUINS_TRAP_DODGE)(n, pr),
            score: 1, badge: 'TRAP DODGE', badgeClass: 'trek'
          });
          ep.chalMemberScores[n] += 1;
          tr.ruins.score += 1;
        } else {
          tr.ruins.events.push({
            type: 'trap', subtype: 'hit', player: n,
            text: pick(RUINS_TRAP_HIT)(n, pr),
            score: -2, badge: 'TRAP', badgeClass: 'danger'
          });
          ep.chalMemberScores[n] -= 2;
          tr.ruins.score -= 2;
          popDelta(n, -1);
        }
      }
    });

    // All fragments bonus
    if (tr.ruins.fragmentsFound >= FRAGMENTS_NEEDED) {
      tr.ruins.allFragments = true;
      tr.ruins.score += 8;
      t.members.forEach(n => { ep.chalMemberScores[n] += 2; });
      tr.ruins.events.push({
        type: 'frag', subtype: 'complete',
        text: `${t.tribeName} assembled all ${FRAGMENTS_NEEDED} golden fragments! The ruins unlock their ancient bonus!`,
        score: 8, badge: 'ALL FRAGMENTS', badgeClass: 'frag'
      });
    }

    tr.ruins.rooms.push('sanctum');
    tr.ruins.score = Math.round(tr.ruins.score / Math.max(1, t.members.length) * 10) / 10;
  });

  // ══ HERO MOMENTS ══
  tribes.forEach(t => {
    const tr = tribeResults[t.tribeName];
    if (Math.random() < 0.4) {
      const heroCandidate = t.members.filter(n => {
        const a = arch(n);
        return NICE_ARCHS.has(a) || a === 'challenge-beast';
      });
      if (heroCandidate.length > 0) {
        const hero = pick(heroCandidate);
        const pr = pronouns(hero);
        const evt = {
          type: 'hero', player: hero,
          text: pick(SOCIAL_HERO)(hero, pr),
          score: 3, badge: 'HERO', badgeClass: 'hero'
        };
        result.socialEvents.push(evt);
        ep.chalMemberScores[hero] += 3;
        popDelta(hero, 2);
        ep.campEvents[t.tribeName].post.push({
          type: 'amazon-hero', text: `${hero} had a heroic moment during the jungle expedition`,
          players: [hero], badgeText: 'Jungle Hero', badgeClass: 'badge-positive'
        });
      }
    }
  });

  // ══ CALCULATE TOTALS ══
  tribes.forEach(t => {
    const tr = tribeResults[t.tribeName];
    tr.totalScore = tr.zipline.score + tr.trek.score + tr.guardian.score + tr.ruins.score;
    tr.avgScore = Math.round(tr.totalScore * 100) / 100;
  });

  // Sort tribes by average score
  const sorted = tribes.slice().sort((a, b) => tribeResults[b.tribeName].avgScore - tribeResults[a.tribeName].avgScore);
  const tribesSorted = sorted.map(t => t.tribeName);

  result.tribes = tribes.map(t => tribeResults[t.tribeName]);
  result.fakeReveal = fakeRevealData;
  result.tribesSorted = tribesSorted;
  result.winner = tribesSorted[0];
  result.loser = tribesSorted[tribesSorted.length - 1];

  // Romance hooks
  for (let i = 0; i < allActive.length; i++)
    for (let j = i + 1; j < allActive.length; j++)
      _challengeRomanceSpark(allActive[i], allActive[j], ep, null, null, ep.chalMemberScores || {}, 'jungle expedition');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'jungle expedition', allActive);

  // ══ FINALIZE ══
  ep.amazonRace = result;
  ep.isAmazonRace = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Am-AH-Zon Race';
  ep.challengeCategory = 'adventure';

  const winnerTribe = gs.tribes.find(t => (t.tribeName || t.name) === result.winner);
  const loserTribe = gs.tribes.find(t => (t.tribeName || t.name) === result.loser);
  ep.winner = winnerTribe;
  ep.loser = loserTribe;
  ep.safeTribes = tribesSorted.length > 2
    ? tribesSorted.slice(1, -1).map(tn => gs.tribes.find(t => (t.tribeName || t.name) === tn)).filter(Boolean)
    : [];
  ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];

  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a).map(([n]) => n);

  // Top scorer from winning tribe gets massive bonus
  const topScorer = winnerTribe?.members.slice().sort((a, b) =>
    (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)
  )[0];
  if (topScorer) {
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== topScorer).map(([, s]) => s));
    ep.chalMemberScores[topScorer] = Math.max(
      ep.chalMemberScores[topScorer] || 0, maxOther) + allActive.length + 5;
    ep.immunityWinner = topScorer;
  }

  updateChalRecord(ep);
  return ep;
}

// ══════════════════════════════════════════════════════════════
// VP BUILDERS
// ══════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`az-step-${suffix}-${i}`);
    if (el) el.classList.add('az-visible');
  }
  const counter = document.getElementById(`az-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`az-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.az-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

// ── CSS ICONS ──
function _icon(type) {
  const icons = {
    vine: `<div class="az-icon az-icon-vine"><div class="ic"></div></div>`,
    leaf: `<div class="az-icon az-icon-leaf"><div class="ic"></div></div>`,
    machete: `<div class="az-icon az-icon-machete"><div class="ic"></div></div>`,
    tiki: `<div class="az-icon az-icon-tiki"><div class="ic"><div class="te te-l"></div><div class="te te-r"></div><div class="tm"></div></div></div>`,
    snake: `<div class="az-icon az-icon-snake"><div class="ic"></div></div>`,
    torch: `<div class="az-icon az-icon-torch"><div class="ic"><div class="fl"></div></div></div>`,
    frag: `<div class="az-icon az-icon-frag"><div class="ic"></div></div>`,
    trap: `<div class="az-icon az-icon-trap"><div class="ic"></div></div>`,
    heart: `<div class="az-icon az-icon-heart"><div class="ic"></div></div>`,
    shield: `<div class="az-icon az-icon-shield"><div class="ic"></div></div>`,
    debate: `<div class="az-icon az-icon-debate"><div class="ic"></div></div>`,
    xhair: `<div class="az-icon az-icon-xhair"><div class="ic"></div></div>`,
    zip: `<div class="az-icon az-icon-zip"><div class="ic"></div></div>`,
    wind: `<div class="az-icon az-icon-wind"><div class="ic"><div class="wl"></div><div class="wl"></div><div class="wl"></div></div></div>`,
  };
  return icons[type] || '';
}

function _eventIcon(evt) {
  if (!evt) return _icon('leaf');
  const t = evt.type || '';
  const st = evt.subtype || '';
  if (t === 'zipline' || st.includes('zip') || st.includes('belt-s') || st.includes('tbar') || st.includes('piggyback')) return _icon('zip');
  if (t === 'hazard' && st.includes('piranha')) return _icon('snake');
  if (t === 'hazard' && st.includes('snake')) return _icon('snake');
  if (t === 'hazard' && (st.includes('vine') || st.includes('fray'))) return _icon('vine');
  if (t === 'hazard' && st.includes('gust')) return _icon('wind');
  if (t === 'hazard' && (st.includes('collapse') || st.includes('decoy'))) return _icon('trap');
  if (t === 'hazard' && st.includes('quicksand')) return _icon('trap');
  if (t === 'hazard' && (st.includes('swarm') || st.includes('mosquito'))) return _icon('wind');
  if (t === 'hazard' && st.includes('monkey')) return _icon('leaf');
  if (t === 'hazard' && st.includes('caterpillar')) return _icon('vine');
  if (t === 'camp') return _icon('torch');
  if (t === 'nav') return _icon('machete');
  if (t === 'guardian') return _icon('tiki');
  if (t === 'frag') return _icon('frag');
  if (t === 'trap') return _icon('trap');
  if (t === 'hero') return _icon('shield');
  if (t === 'social' && st === 'sabotage') return _icon('xhair');
  if (t === 'social' && (st === 'cross-race' || st === 'cross-win')) return _icon('frag');
  if (t === 'social' && (st === 'cross-block' || st === 'cross-taunt')) return _icon('xhair');
  if (t === 'social' && (st === 'bond' || st === 'encourage' || st === 'help' || st === 'tandem-bond' || st === 'rival-respect' || st === 'night-bond')) return _icon('heart');
  if (t === 'social' && (st === 'blame' || st === 'rivalry' || st === 'heckle' || st === 'rival-taunt' || st === 'night-paranoia')) return _icon('xhair');
  if (t === 'social' && (st === 'rival-observe')) return _icon('machete');
  if (t === 'social' && st === 'tandem-save') return _icon('heart');
  if (t === 'debate' && st === 'nomination') return _icon('tiki');
  if (t === 'debate' && st === 'refusal') return _icon('wind');
  if (t === 'debate' && st === 'advocacy') return _icon('tiki');
  if (t === 'debate' && st === 'interjection') return _icon('wind');
  if (t === 'debate' && st === 'decision') return _icon('shield');
  if (t === 'chatter') return _icon('leaf');
  return _icon('leaf');
}

function _badgeCls(cls) {
  if (cls === 'trek') return 'az-badge-trek';
  if (cls === 'danger') return 'az-badge-danger';
  if (cls === 'social') return 'az-badge-social';
  if (cls === 'hero') return 'az-badge-hero';
  if (cls === 'frag') return 'az-badge-frag';
  if (cls === 'tribe') return 'az-badge-tribe';
  if (cls === 'trap') return 'az-badge-trap';
  return 'az-badge-trek';
}

function _av(name, size = 36) {
  const tc = _playerTribeColor(name);
  return `<img class="az-av" src="assets/avatars/${slug(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-color:${tc};" onerror="this.style.display='none'">`;
}

function _playerTribeColor(name) {
  const epIdx = window.vpEpNum;
  const epRecord = gs.episodeHistory?.[epIdx - 1];
  const az = epRecord?.amazonRace;
  if (!az) return 'var(--az-leaf)';
  const tribe = az.tribes.find(t => t.members.includes(name));
  return tribe ? tribeColor(_tn(tribe)) : 'var(--az-leaf)';
}

function _playerTribeName(name) {
  const epIdx = window.vpEpNum;
  const epRecord = gs.episodeHistory?.[epIdx - 1];
  const az = epRecord?.amazonRace;
  if (!az) return '';
  const tribe = az.tribes.find(t => t.members.includes(name));
  return tribe ? _tn(tribe) : '';
}

// ── CARD BUILDER ──
function _cardType(evt) {
  if (!evt) return 'trek';
  const t = evt.type || '';
  const st = evt.subtype || '';
  if (t === 'hazard' && (st.includes('-dodge') || st.includes('-escape') || st.includes('-spot'))) return 'trek';
  if (t === 'hazard' || (t === 'zipline' && st === 'freeze')) return 'danger';
  if (t === 'hero') return 'hero';
  if (t === 'camp') return 'tribe';
  if (t === 'guardian' && st === 'arrival') return 'danger';
  if (t === 'guardian' && st === 'fake-reaction') return 'social';
  if (t === 'guardian') return 'tribe';
  if (t === 'social' && (st === 'cross-race' || st === 'cross-block')) return 'danger';
  if (t === 'social' && st === 'cross-win') return 'frag';
  if (t === 'social') return 'social';
  if (t === 'debate' && st === 'interjection') return 'social';
  if (t === 'debate') return 'trek';
  if (t === 'trap' && (st === 'hit' || st === 'decoy-hit')) return 'danger';
  if (t === 'frag') return 'frag';
  if (t === 'trap') return 'trap';
  if (t === 'chatter') return 'trek';
  return 'trek';
}

function _buildCard(evt, idx) {
  const ct = _cardType(evt);
  const playerName = evt.player || '';
  const tc = playerName ? _playerTribeColor(playerName) : '';
  const borderColor = {
    trek: 'var(--az-leaf)', danger: 'var(--az-danger)', hero: 'var(--az-gold)',
    tribe: 'var(--az-tribal)', social: 'var(--az-moss)', frag: 'var(--az-gold)', trap: 'var(--az-amber)'
  }[ct] || 'var(--az-leaf)';
  const bgGrad = {
    trek: 'rgba(46,204,64,.04),rgba(11,26,15,.88)',
    danger: 'rgba(224,64,64,.06),rgba(11,26,15,.88)',
    hero: 'rgba(245,200,66,.06),rgba(11,26,15,.88)',
    tribe: 'rgba(224,120,48,.06),rgba(11,26,15,.88)',
    social: 'rgba(90,168,74,.04),rgba(11,26,15,.88)',
    frag: 'rgba(245,200,66,.06),rgba(11,26,15,.88)',
    trap: 'rgba(232,160,32,.05),rgba(11,26,15,.88)'
  }[ct] || 'rgba(46,204,64,.04),rgba(11,26,15,.88)';

  const isSocial = ct === 'social';
  const borderStyle = isSocial ? 'border:1px dashed rgba(90,168,74,.3)' : `border-left:3px solid ${borderColor};border:1px solid rgba(232,240,232,.08)`;

  let avHtml = '';
  if (playerName) avHtml = _av(playerName, 32);
  if (evt.target) avHtml += _av(evt.target, 28);

  const badgeHtml = evt.badge ? `<span class="az-badge ${_badgeCls(evt.badgeClass)}">${evt.badge}</span>` : '';

  const tribeBorder = evt._tribe ? `border-left:3px solid ${tribeColor(evt._tribe)};` : '';
  return `<div class="az-card az-card-${ct}" style="background:linear-gradient(135deg,${bgGrad});${isSocial ? borderStyle : tribeBorder + 'border:1px solid rgba(232,240,232,.08)'}">
    <div class="az-card-hdr">
      ${_eventIcon(evt)}
      <div style="display:flex;align-items:center;gap:6px;flex:1;">${avHtml}${evt._tribe ? `<span style="font-size:7px;color:${tribeColor(evt._tribe)};letter-spacing:1px;opacity:.6;">${evt._tribe.toUpperCase()}</span>` : ''}</div>
      ${badgeHtml}
    </div>
    <div class="az-card-txt">${evt.text || ''}</div>
    ${evt.score ? `<div class="az-score-pill" style="color:${evt.score > 0 ? 'var(--az-leaf)' : 'var(--az-danger)'};">${evt.score > 0 ? '+' : ''}${evt.score}</div>` : ''}
  </div>`;
}

// ── SIDEBAR ──
function _tn(tribe) { return tribe.tribeName || tribe.name || ''; }

function _outcomeColor(outcome) {
  const good = new Set(['CLEAN', 'POWERED', 'FOUGHT', 'SAVED', 'CATCH!', 'UNJAMMED']);
  const bad = new Set(['FROZE', 'FRAY', 'GUST', 'SNAP!', 'DROPPED', 'JAMMED', 'PIRANHA!']);
  if (good.has(outcome)) return 'var(--az-leaf)';
  if (bad.has(outcome)) return 'var(--az-danger)';
  return 'var(--az-amber)';
}

function _buildPlayerRoster(members, revealedOutcomes, tc) {
  let html = `<div class="az-sb-roster">`;
  members.forEach(name => {
    const res = revealedOutcomes[name];
    const avSrc = `assets/avatars/${slug(name)}.png`;
    const oc = res ? _outcomeColor(res.outcome) : '';
    const borderCol = res ? oc : 'rgba(232,240,232,.12)';
    html += `<div class="az-sb-row">
      <img class="az-sb-av" src="${avSrc}" alt="${name}" style="border-color:${borderCol};" onerror="this.style.display='none'">
      <span class="az-sb-pname">${name}</span>`;
    if (res) {
      const scoreStr = res.score > 0 ? `+${res.score}` : `${res.score}`;
      html += `<span class="az-sb-outcome" style="color:${oc};">${res.outcome}</span>
        <span class="az-sb-pscore" style="color:${oc};">${scoreStr}</span>`;
    } else {
      html += `<span class="az-sb-outcome" style="color:var(--az-muted);opacity:.3;">---</span>`;
    }
    html += `</div>`;
  });
  html += `</div>`;
  return html;
}

function _outcomeIcon(outcome) {
  if (!outcome) return '';
  const good = new Set(['CLEAN', 'POWERED', 'FOUGHT', 'SAVED', 'CATCH!', 'UNJAMMED']);
  const bad = new Set(['FROZE', 'FRAY', 'GUST', 'SNAP!', 'DROPPED', 'JAMMED', 'PIRANHA!']);
  if (outcome === 'PIRANHA!') return `<span class="az-sb-oi" style="color:var(--az-danger);">${_icon('snake')}</span>`;
  if (outcome === 'SNAP!' || outcome === 'FRAY') return `<span class="az-sb-oi" style="color:var(--az-danger);">${_icon('vine')}</span>`;
  if (outcome === 'GUST') return `<span class="az-sb-oi" style="color:var(--az-danger);">${_icon('wind')}</span>`;
  if (outcome === 'FROZE') return `<span class="az-sb-oi" style="color:var(--az-danger);">${_icon('trap')}</span>`;
  if (outcome === 'JAMMED') return `<span class="az-sb-oi" style="color:var(--az-danger);">${_icon('trap')}</span>`;
  if (outcome === 'DROPPED') return `<span class="az-sb-oi" style="color:var(--az-danger);">${_icon('xhair')}</span>`;
  if (good.has(outcome)) return `<span class="az-sb-oi" style="color:var(--az-leaf);">${_icon('shield')}</span>`;
  if (bad.has(outcome)) return `<span class="az-sb-oi" style="color:var(--az-danger);">${_icon('xhair')}</span>`;
  return `<span class="az-sb-oi">${_icon('zip')}</span>`;
}

function _buildPhasePlacementCard(az, phaseName, phaseNum, totalPhases, nextPhase, scoreGetter) {
  const ranked = az.tribes.slice().sort((a, b) => scoreGetter(b) - scoreGetter(a));
  const leader = _tn(ranked[0]);
  const leadTc = tribeColor(leader);
  const leadScore = scoreGetter(ranked[0]);
  const lastScore = scoreGetter(ranked[ranked.length - 1]);
  const gap = Math.abs(leadScore - lastScore).toFixed(1);

  let rows = '';
  ranked.forEach((tribe, ri) => {
    const tn = _tn(tribe);
    const tc = tribeColor(tn);
    const medal = ri === 0 ? '1ST' : ri === 1 ? '2ND' : '3RD';
    const medalColor = ri === 0 ? 'var(--az-gold)' : ri === 1 ? 'var(--az-leaf)' : 'var(--az-danger)';
    const sc = scoreGetter(tribe);
    rows += `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(${ri === 0 ? '245,200,66,.06' : '11,26,15,.5'});border-left:3px solid ${tc};border-radius:4px;margin:4px 0;">
      <span style="font-family:'Titan One',cursive;font-size:14px;color:${medalColor};min-width:30px;">${medal}</span>
      <span style="flex:1;font-size:11px;color:${tc};font-family:'Titan One',cursive;letter-spacing:1px;">${tn.toUpperCase()}</span>
      <span style="font-family:'Titan One',cursive;font-size:12px;color:${medalColor};">${sc > 0 ? '+' : ''}${sc.toFixed(1)}</span>
    </div>`;
  });

  const gapText = parseFloat(gap) > 0
    ? `<strong style="color:${leadTc};">${leader}</strong> leads by <strong>${gap}</strong> points.`
    : `Dead even! Every point from here on matters.`;
  const nextLabel = nextPhase ? `<div style="font-size:9px;color:var(--az-muted);margin-top:8px;opacity:.5;letter-spacing:1px;text-align:center;">NEXT UP: ${nextPhase}</div>` : '';

  return { rows, gapText, nextLabel, leader, leadTc };
}

function _renderPlacementCard(suffix, idx, title, badge, placement, icon) {
  return `<div id="az-step-${suffix}-${idx}" class="az-hidden">
    <div class="az-card" style="border:2px solid var(--az-gold);background:linear-gradient(135deg,rgba(245,200,66,.06),rgba(11,26,15,.92));">
      <div class="az-card-hdr">
        ${icon || _icon('shield')}
        <div style="font-family:'Titan One',cursive;font-size:14px;color:var(--az-gold);letter-spacing:2px;flex:1;">${title}</div>
        <span class="az-badge az-badge-frag">${badge}</span>
      </div>
      <div style="margin:10px 0;">${placement.rows}</div>
      <div class="az-card-txt" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(245,200,66,.15);">
        ${_icon('torch')} ${placement.gapText}
      </div>
      ${placement.nextLabel}
    </div>
  </div>`;
}

function _buildSidebarContent(ep, screenKey) {
  const az = ep?.amazonRace;
  if (!az) return '';
  const phase = screenKey?.includes('zip') ? 'zipline' : screenKey?.includes('trek') ? 'trek' : screenKey?.includes('guard') ? 'guardian' : screenKey?.includes('ruins') ? 'ruins' : screenKey?.includes('results') ? 'results' : 'title';

  let html = '';
  html += `<div class="az-sb-title">EXPEDITION BOARD</div>`;

  const stKey = screenKey || '';
  const st = _tvState[stKey];
  const revealIdx = st?.idx ?? -1;

  if (phase === 'title') {
    // Title screen: mission briefing, no scores
    html += `<div style="font-size:9px;color:var(--az-muted);letter-spacing:1px;margin:8px 0 4px;">MISSION BRIEFING</div>`;
    html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('zip')} PHASE 1</span><span class="az-sb-val" style="color:var(--az-muted);font-size:8px;">ZIPLINE</span></div>`;
    html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('machete')} PHASE 2</span><span class="az-sb-val" style="color:var(--az-muted);font-size:8px;">TREK</span></div>`;
    html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('tiki')} PHASE 3</span><span class="az-sb-val" style="color:var(--az-muted);font-size:8px;">GUARDIANS</span></div>`;
    html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('frag')} PHASE 4</span><span class="az-sb-val" style="color:var(--az-muted);font-size:8px;">RUINS</span></div>`;
    html += `<div style="margin-top:10px;border-top:1px solid rgba(46,204,64,.1);padding-top:8px;">`;
    az.tribes.forEach(tribe => {
      const tn = _tn(tribe);
      if (!tn) return;
      const tc = tribeColor(tn);
      html += `<div style="margin-bottom:6px;"><div class="az-sb-tribe-name" style="color:${tc};margin-bottom:2px;">${tn.toUpperCase()}</div>`;
      html += `<div style="font-size:8px;color:var(--az-muted);">${tribe.members.length} MEMBERS</div></div>`;
    });
    html += `</div>`;
    return html;
  }

  const phaseOrder = ['zipline', 'trek', 'guardian', 'ruins', 'results'];
  const phaseIdx = phaseOrder.indexOf(phase);
  const done = st ? st.idx >= st.total - 1 : false;

  // Tribe standings (non-title screens)
  az.tribes.forEach(tribe => {
    const tn = _tn(tribe);
    if (!tn) return;
    const tc = tribeColor(tn);
    html += `<div class="az-sb-tribe" style="border-color:${tc}33;">
      <div class="az-sb-tribe-name" style="color:${tc};">${tn.toUpperCase()}</div>`;

    // ZIPLINE — past: show final. Current: progressive via stepMeta.
    if (phaseIdx >= 0) {
      if (phaseIdx > 0) {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('zip')} ZIPLINE</span><span class="az-sb-val">${tribe.zipline.score > 0 ? '+' : ''}${tribe.zipline.score.toFixed(1)}</span></div>`;
      } else {
        // Active zipline phase — show technique, debate, crossing progress
        const stepMeta = window._azZipStepMeta || [];
        const tribeData = window._azZipTribeData?.[tn];
        if (revealIdx < 0) {
          html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('zip')} ZIPLINE</span><span class="az-sb-val" style="color:var(--az-muted);">---</span></div>`;
        } else if (done) {
          html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('zip')} ZIPLINE</span><span class="az-sb-val">${tribe.zipline.score > 0 ? '+' : ''}${tribe.zipline.score.toFixed(1)}</span></div>`;
          if (tribeData) {
            html += `<div style="font-size:8px;color:var(--az-muted);padding:0 0 2px 18px;">${_icon('shield')} ${tribeData.technique || '?'} &bull; Won by ${tribeData.debateWinner || '?'}</div>`;
          }
          // Build revealed outcomes map from stepMeta (done = show all)
          const revealedOutcomes = {};
          for (let mi = 0; mi < stepMeta.length; mi++) {
            const m = stepMeta[mi];
            if (m && m.tribe === tn && m.beat === 'crossing' && m.player && m.outcome) {
              revealedOutcomes[m.player] = { outcome: m.outcome, score: m.score || 0 };
            }
          }
          if (tribeData) {
            html += `<div style="font-size:8px;color:var(--az-muted);padding:0 0 2px 18px;">${_icon('shield')} ${tribeData.technique || '?'} &bull; Won by ${tribeData.debateWinner || '?'}</div>`;
          }
          html += _buildPlayerRoster(tribe.members, revealedOutcomes, tc);
        } else {
          // Progressive: compute score + current beat + per-player outcomes from stepMeta
          let zipScore = 0;
          let currentBeat = 'debate';
          const revealedOutcomes = {};
          const metaUpTo = Math.min(revealIdx - 1, stepMeta.length - 1);
          for (let mi = 0; mi <= metaUpTo; mi++) {
            const m = stepMeta[mi];
            if (m && m.tribe === tn) {
              zipScore += m.score || 0;
              currentBeat = m.beat;
              if (m.beat === 'crossing' && m.player && m.outcome) {
                revealedOutcomes[m.player] = { outcome: m.outcome, score: m.score || 0 };
              }
            }
          }

          // Technique + debate winner
          if (tribeData) {
            const pastDebate = stepMeta.some((m, mi) => mi <= metaUpTo && m.tribe === tn && m.beat !== 'debate');
            if (pastDebate && tribeData.technique) {
              html += `<div style="font-size:8px;color:var(--az-muted);padding:0 0 2px 18px;">${_icon('shield')} TECHNIQUE: <span style="color:var(--az-gold);">${tribeData.technique}</span></div>`;
            }
            if (tribeData.debateWinner && pastDebate) {
              html += `<div style="font-size:8px;color:var(--az-muted);padding:0 0 2px 18px;">${_icon('tiki')} WON BY: ${tribeData.debateWinner}</div>`;
            }
          }

          // Beat status
          const beatLabel = currentBeat === 'debate' ? 'DEBATING...' : currentBeat === 'crossing' ? `CROSSING` : 'LANDING';
          html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('zip')} ZIPLINE</span><span class="az-sb-val az-sb-live" style="color:var(--az-gold);">${beatLabel}</span></div>`;
          if (zipScore > 0) {
            html += `<div style="font-size:8px;color:var(--az-leaf);padding:0 0 2px 18px;">SCORE: +${zipScore.toFixed(1)}</div>`;
          }

          // Full player roster — always visible, results revealed progressively
          html += _buildPlayerRoster(tribe.members, revealedOutcomes, tc);
        }
      }
    }

    // TREK — past: show final. Current: progressive reveal.
    if (phaseIdx >= 2) {
      html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('machete')} TREK</span><span class="az-sb-val">${tribe.trek.score > 0 ? '+' : ''}${tribe.trek.score.toFixed(1)}</span></div>`;
    } else if (phase === 'trek') {
      if (revealIdx < 0) {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('machete')} TREK</span><span class="az-sb-val" style="color:var(--az-muted);">---</span></div>`;
      } else if (done) {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('machete')} TREK</span><span class="az-sb-val">${tribe.trek.score > 0 ? '+' : ''}${tribe.trek.score.toFixed(1)}</span></div>`;
      } else {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('machete')} TREK</span><span class="az-sb-val az-sb-live" style="color:var(--az-gold);">IN PROGRESS</span></div>`;
      }
    }

    // GUARDIAN — past: show final. Current: progressive reveal.
    if (phaseIdx >= 3) {
      html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('tiki')} GUARDIAN</span><span class="az-sb-val" style="color:${tribe.guardian.success ? 'var(--az-leaf)' : 'var(--az-danger)'};">${tribe.guardian.score > 0 ? '+' : ''}${tribe.guardian.score}</span></div>`;
    } else if (phase === 'guardian') {
      if (revealIdx < 0) {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('tiki')} GUARDIAN</span><span class="az-sb-val" style="color:var(--az-muted);">---</span></div>`;
      } else if (done) {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('tiki')} GUARDIAN</span><span class="az-sb-val" style="color:${tribe.guardian.success ? 'var(--az-leaf)' : 'var(--az-danger)'};">${tribe.guardian.score > 0 ? '+' : ''}${tribe.guardian.score}</span></div>`;
      } else {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('tiki')} GUARDIAN</span><span class="az-sb-val az-sb-live" style="color:var(--az-gold);">IN PROGRESS</span></div>`;
      }
    }

    // RUINS — past: show final. Current: progressive reveal.
    if (phase === 'results') {
      html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('frag')} RUINS</span><span class="az-sb-val">${tribe.ruins.score > 0 ? '+' : ''}${tribe.ruins.score.toFixed(1)}</span></div>`;
      html += `<div class="az-sb-frags">${_icon('frag')} ${tribe.ruins.fragmentsFound}/4 FRAGMENTS${tribe.ruins.allFragments ? ' <span style="color:var(--az-gold);">COMPLETE</span>' : ''}</div>`;
      html += `<div class="az-sb-total" style="color:${tc};">TOTAL: ${tribe.avgScore.toFixed(1)}</div>`;
    } else if (phase === 'ruins') {
      if (revealIdx < 0) {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('frag')} RUINS</span><span class="az-sb-val" style="color:var(--az-muted);">---</span></div>`;
      } else if (done) {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('frag')} RUINS</span><span class="az-sb-val">${tribe.ruins.score > 0 ? '+' : ''}${tribe.ruins.score.toFixed(1)}</span></div>`;
        html += `<div class="az-sb-frags">${_icon('frag')} ${tribe.ruins.fragmentsFound}/4 FRAGMENTS${tribe.ruins.allFragments ? ' <span style="color:var(--az-gold);">COMPLETE</span>' : ''}</div>`;
      } else {
        html += `<div class="az-sb-stat"><span class="az-sb-label">${_icon('frag')} RUINS</span><span class="az-sb-val az-sb-live" style="color:var(--az-gold);">IN PROGRESS</span></div>`;
      }
    }

    html += `</div>`;
  });

  // Event log for current phase
  if (phase !== 'results') {
    html += `<div class="az-sb-section">EXPEDITION LOG</div>`;
    const phaseLabel = phase.toUpperCase();
    if (revealIdx < 0) {
      html += `<div style="font-size:9px;color:var(--az-muted);opacity:.5;padding:4px 0;">Awaiting ${phaseLabel} start...</div>`;
    } else if (done) {
      html += `<div style="font-size:9px;color:var(--az-leaf);padding:4px 0;">${_icon('leaf')} ${phaseLabel} COMPLETE</div>`;
    } else {
      const pct = Math.round(((revealIdx + 1) / (st?.total || 1)) * 100);
      html += `<div style="font-size:9px;color:var(--az-gold);padding:4px 0;">${_icon('torch')} ${phaseLabel} — ${pct}% REVEALED</div>`;
      html += `<div style="height:3px;background:rgba(232,240,232,.08);border-radius:2px;margin-top:4px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:var(--az-gold);border-radius:2px;transition:width .3s;"></div></div>`;
    }
  }

  return html;
}

function _buildSidebar(ep, screenKey) {
  return `<div class="az-sidebar" id="az-sidebar"><div id="az-sidebar-inner">${_buildSidebarContent(ep, screenKey)}</div></div>`;
}

function _azUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('az-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._azEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.amazonRace) return;
  sideEl.innerHTML = _buildSidebarContent(epRecord, screenKey);
}

// ── MAP ──
function _buildMap(phase, ep) {
  const az = ep?.amazonRace;
  if (!az) return '';
  const phases = [
    { id: 'zipline', label: 'ZIPLINE', x: 10 },
    { id: 'trek', label: 'TREK', x: 30 },
    { id: 'guardian', label: 'GUARDIAN', x: 55 },
    { id: 'ruins', label: 'RUINS', x: 80 },
    { id: 'finish', label: 'FINISH', x: 95 }
  ];

  const activeIdx = phases.findIndex(p => p.id === phase);

  let nodesHtml = '';
  phases.forEach((p, i) => {
    const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'locked';
    const fill = state === 'done' ? 'var(--az-leaf)' : state === 'active' ? 'var(--az-gold)' : 'rgba(232,240,232,.15)';
    const glow = state === 'active' ? 'filter:drop-shadow(0 0 8px var(--az-gold));' : state === 'done' ? 'filter:drop-shadow(0 0 4px var(--az-leaf));' : '';
    nodesHtml += `<div class="az-map-node" style="left:${p.x}%;${glow}">
      <div class="az-map-dot" style="background:${fill};"></div>
      <div class="az-map-label">${p.label}</div>
    </div>`;
  });

  // Tribe markers
  let markersHtml = '';
  az.tribes.forEach((tribe, idx) => {
    const tc = tribeColor(_tn(tribe));
    const px = phases[Math.min(activeIdx, phases.length - 1)]?.x || 10;
    const initials = _tn(tribe).substring(0, 2).toUpperCase();
    markersHtml += `<div class="az-map-marker" id="az-marker-${_tn(tribe)}" style="left:${px - 2 + idx * 4}%;bottom:${60 + idx * 14}px;">
      <div class="az-map-marker-dot" style="background:${tc};border-color:${tc};">${initials}</div>
    </div>`;
  });

  return `<div class="az-map">
    <div class="az-map-title">EXPEDITION TRAIL</div>
    <svg viewBox="0 0 800 60" style="width:100%;height:40px;">
      <path d="M40,30 Q200,10 400,30 Q600,50 760,30" class="az-map-trail-glow"/>
      <path d="M40,30 Q200,10 400,30 Q600,50 760,30" class="az-map-trail"/>
    </svg>
    ${nodesHtml}
    ${markersHtml}
    <div class="az-map-tikis">
      <div class="az-map-tiki" style="left:2%;">${_icon('tiki')}</div>
      <div class="az-map-tiki" style="right:2%;">${_icon('tiki')}</div>
    </div>
  </div>`;
}

// ── ATMOSPHERE ──
function _buildAtmosphere() {
  let html = '<div class="az-atmosphere">';
  // Sky
  html += '<div class="az-sky"></div>';
  // Sun rays
  html += '<div class="az-rays">';
  for (let i = 0; i < 5; i++) {
    const left = 15 + i * 18;
    const rot = -30 + i * 15;
    const delay = i * 0.7;
    html += `<div class="az-ray" style="left:${left}%;transform:rotate(${rot}deg);animation-delay:${delay}s;"></div>`;
  }
  html += '</div>';
  // Canopy fringe
  html += '<div class="az-canopy-top"></div>';
  // Fireflies
  html += '<div class="az-flies">';
  for (let i = 0; i < 12; i++) {
    const left = (i * 23 + 7) % 100;
    const top = 15 + (i * 31 % 70);
    const dur = 4 + (i % 5);
    const delay = -(i * 0.9 % 6);
    html += `<div class="az-fly" style="left:${left}%;top:${top}%;animation-duration:${dur}s;animation-delay:${delay}s;"></div>`;
  }
  html += '</div>';
  // Undergrowth ferns
  html += '<div class="az-under">';
  for (let i = 0; i < 8; i++) {
    const left = i * 14 + (i * 7 % 4);
    const sc = 0.6 + (i * 11 % 6) * 0.08;
    html += `<div class="az-fern" style="left:${left}%;transform:scale(${sc.toFixed(1)});"></div>`;
  }
  html += '</div>';
  // Mist
  html += '<div class="az-mist"></div>';
  // Vines hanging from top — improved with variation
  html += '<div class="az-vines">';
  for (let i = 0; i < 10; i++) {
    const left = 3 + i * 10 + (i * 7 % 5);
    const height = 80 + (i * 23 % 120);
    const sway = 2 + (i % 4);
    const delay = -(i * 1.1 % 5);
    const thick = 1 + (i % 3);
    const leafCount = 1 + (i % 3);
    let leafHtml = '';
    for (let l = 0; l < leafCount; l++) {
      const ly = 20 + l * 30 + (l * 11 % 20);
      const lside = l % 2 === 0 ? 'left:-6px;' : 'right:-6px;';
      leafHtml += `<div class="az-vine-leaf" style="top:${ly}%;${lside}"></div>`;
    }
    html += `<div class="az-vine-strand" style="left:${left}%;height:${height}px;width:${thick}px;animation-duration:${sway}s;animation-delay:${delay}s;">${leafHtml}</div>`;
  }
  html += '</div>';
  html += '</div>';
  return html;
}

// ── SHELL WRAPPER ──
function _shell(content, ep, sidebarPhase = 'az-title') {
  const az = ep?.amazonRace;
  if (!az) return '';
  window._azEpRecord = ep;
  const sidebar = _buildSidebar(ep, sidebarPhase);

  return `
<link href="https://fonts.googleapis.com/css2?family=Titan+One&family=Archivo+Narrow:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{--az-deep:#0b1a0f;--az-canopy:#0d2614;--az-floor:#162e1a;--az-leaf:#2ecc40;--az-moss:#4a7a3a;--az-vine:#5ca84a;--az-toxic:#39ff14;--az-gold:#f5c842;--az-amber:#e8a020;--az-danger:#e04040;--az-water:#2aa8c0;--az-mud:#7a5a30;--az-tribal:#e07830;--az-orchid:#d946ef;--az-blood:#c02020;--az-white:#e8f0e8;--az-muted:rgba(232,240,232,.55);--az-card-bg:rgba(11,26,15,.88);--az-bark:#3a2810;--az-clay:#8a5a2a;--az-jade:#1a8a5a;}

.az-shell-wrap{max-width:1100px;margin:0 auto;padding:20px;position:relative;z-index:2;font-family:'Archivo Narrow',sans-serif;color:var(--az-white);min-height:800px;display:flex;gap:16px;align-items:flex-start;}
.az-shell-wrap *{box-sizing:border-box;}

/* ═══ ATMOSPHERE ═══ */
.az-atmosphere{position:fixed;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:0;}
.az-sky{position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,#041a08 0%,#0b1a0f 30%,#0d2614 60%,#162e1a 100%);}
.az-rays{position:absolute;top:0;left:0;right:0;height:600px;overflow:hidden;pointer-events:none;}
.az-ray{position:absolute;top:-100px;width:60px;height:500px;background:linear-gradient(180deg,rgba(245,200,66,.06),transparent);filter:blur(30px);animation:az-ray 8s ease-in-out infinite alternate;transform-origin:top center;}
@keyframes az-ray{0%{opacity:.3;transform:rotate(var(--r,0deg)) scaleY(.8);}50%{opacity:.6;transform:rotate(var(--r,0deg)) scaleY(1.2);}100%{opacity:.3;transform:rotate(var(--r,0deg)) scaleY(.9);}}
.az-canopy-top{position:absolute;top:0;left:0;right:0;height:120px;background:linear-gradient(180deg,rgba(13,38,20,.95),transparent);pointer-events:none;}
.az-flies{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;}
.az-fly{position:absolute;width:3px;height:3px;background:var(--az-toxic);border-radius:50%;box-shadow:0 0 6px var(--az-toxic),0 0 12px rgba(57,255,20,.3);animation:az-float 6s ease-in-out infinite;}
@keyframes az-float{0%,100%{transform:translate(0,0);opacity:.3;}25%{transform:translate(15px,-20px);opacity:.8;}50%{transform:translate(-10px,-10px);opacity:.5;}75%{transform:translate(20px,15px);opacity:.9;}}
.az-under{position:absolute;bottom:0;left:0;right:0;height:80px;pointer-events:none;}
.az-fern{position:absolute;bottom:0;}
.az-fern::before{content:'';display:block;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:24px solid rgba(46,204,64,.05);}
.az-mist{position:absolute;bottom:0;left:0;right:0;height:200px;background:linear-gradient(to top,rgba(11,26,15,.9),transparent);pointer-events:none;}
.az-vines{position:absolute;top:0;left:0;right:0;height:300px;pointer-events:none;overflow:hidden;}
.az-vine-strand{position:absolute;top:0;background:linear-gradient(180deg,rgba(92,168,74,.15),rgba(74,122,58,.08),transparent);border-radius:0 0 2px 2px;animation:az-sway ease-in-out infinite alternate;}
.az-vine-leaf{position:absolute;width:8px;height:5px;background:rgba(46,204,64,.12);border-radius:50% 0;transform:rotate(-20deg);}
@keyframes az-sway{0%{transform:rotate(-1deg) translateX(-3px);}100%{transform:rotate(1deg) translateX(3px);}}

/* ═══ SHELL LAYOUT ═══ */
.az-main{position:relative;z-index:2;flex:1;min-width:0;order:1;}

/* ═══ MAP ═══ */
.az-map{background:linear-gradient(135deg,rgba(13,38,20,.7),rgba(11,26,15,.9));border:2px solid rgba(46,204,64,.12);border-radius:16px;padding:20px;margin:16px 0;position:relative;overflow:hidden;min-height:100px;}
.az-map::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 30%,rgba(46,204,64,.04),transparent 50%);pointer-events:none;}
.az-map-title{font-family:'Titan One',cursive;font-size:11px;color:var(--az-leaf);letter-spacing:4px;text-align:center;margin-bottom:12px;opacity:.5;}
.az-map-trail-glow{fill:none;stroke:rgba(46,204,64,.06);stroke-width:12;stroke-linecap:round;filter:blur(4px);}
.az-map-trail{fill:none;stroke:rgba(46,204,64,.15);stroke-width:4;stroke-linecap:round;stroke-dasharray:8 4;}
.az-map-node{position:absolute;top:50%;transform:translateY(-50%);text-align:center;z-index:3;}
.az-map-dot{width:14px;height:14px;border-radius:50%;margin:0 auto;}
.az-map-label{font-size:7px;color:var(--az-muted);letter-spacing:2px;margin-top:4px;font-family:'Titan One',cursive;}
.az-map-marker{position:absolute;z-index:5;transition:all 1.5s cubic-bezier(.25,.46,.45,.94);}
.az-map-marker-dot{width:22px;height:22px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;font-family:'Titan One',cursive;color:var(--az-deep);box-shadow:0 2px 8px rgba(0,0,0,.5);}
.az-map-tikis{position:absolute;top:50%;transform:translateY(-50%);left:0;right:0;pointer-events:none;}
.az-map-tiki{position:absolute;opacity:.3;}
.az-map-sticky{position:sticky;top:70px;z-index:10;margin-bottom:12px;}

/* ═══ PHASE HEADERS ═══ */
.az-phase-hdr{text-align:center;padding:40px 0 20px;}
.az-phase-hdr h2{font-family:'Titan One',cursive;font-size:28px;color:var(--az-white);text-shadow:0 0 30px rgba(46,204,64,.3);letter-spacing:4px;}
.az-phase-hdr .az-sub{font-size:11px;color:var(--az-leaf);letter-spacing:5px;text-transform:uppercase;opacity:.4;margin-top:4px;}

/* ═══ TITLE CARD ═══ */
.az-titlecard{text-align:center;padding:60px 30px 40px;position:relative;}
.az-title-frame{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.az-title-tribal-top,.az-title-tribal-bottom{position:absolute;left:0;right:0;height:18px;background:repeating-linear-gradient(90deg,transparent 0px,transparent 12px,var(--az-tribal) 12px,var(--az-tribal) 14px,transparent 14px,transparent 20px,var(--az-gold) 20px,var(--az-gold) 22px,transparent 22px,transparent 30px);opacity:.2;}
.az-title-tribal-top{top:0;}
.az-title-tribal-bottom{bottom:0;}
.az-title-tribal-left,.az-title-tribal-right{position:absolute;top:18px;bottom:18px;width:18px;background:repeating-linear-gradient(180deg,transparent 0px,transparent 12px,var(--az-tribal) 12px,var(--az-tribal) 14px,transparent 14px,transparent 20px,var(--az-gold) 20px,var(--az-gold) 22px,transparent 22px,transparent 30px);opacity:.2;}
.az-title-tribal-left{left:0;}
.az-title-tribal-right{right:0;}
.az-title-tiki-l,.az-title-tiki-r{position:absolute;top:50%;transform:translateY(-50%) scale(2.5);opacity:.12;}
.az-title-tiki-l{left:28px;}
.az-title-tiki-r{right:28px;}
.az-title-main{font-family:'Titan One',cursive;font-size:48px;color:var(--az-white);text-shadow:0 0 60px rgba(46,204,64,.4),0 0 120px rgba(57,255,20,.1),0 4px 20px rgba(0,0,0,.6);letter-spacing:5px;animation:az-breathe 6s ease-in-out infinite;margin-top:20px;}
@keyframes az-breathe{0%,100%{text-shadow:0 0 60px rgba(46,204,64,.4),0 4px 20px rgba(0,0,0,.6);}50%{text-shadow:0 0 90px rgba(46,204,64,.6),0 0 160px rgba(57,255,20,.15),0 4px 20px rgba(0,0,0,.6);}}
.az-tsub{font-size:12px;color:var(--az-leaf);letter-spacing:6px;text-transform:uppercase;opacity:.45;margin-top:6px;}
.az-ttag{display:inline-block;margin-top:20px;padding:5px 20px;border:1px solid rgba(46,204,64,.12);border-radius:20px;background:rgba(46,204,64,.03);font-size:10px;color:var(--az-leaf);letter-spacing:3px;}
.az-tcrack{display:block;margin:20px auto;width:280px;height:2px;background:linear-gradient(90deg,transparent,rgba(46,204,64,.3),rgba(232,240,232,.4),rgba(46,204,64,.3),transparent);}
.az-ticons{display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap;align-items:center;}
.az-ticon-item{text-align:center;}
.az-ticon-ring{width:44px;height:44px;border-radius:50%;border:2px solid rgba(46,204,64,.2);background:rgba(46,204,64,.04);display:flex;align-items:center;justify-content:center;margin:0 auto;transition:border-color .3s;}
.az-ticon-arrow{opacity:.2;transform:scale(.7);}
.az-ticons .lbl{font-size:7px;color:var(--az-leaf);letter-spacing:2px;margin-top:4px;opacity:.6;}
.az-title-tribes{display:flex;gap:20px;justify-content:center;margin-top:28px;flex-wrap:wrap;}
.az-title-tribe{background:rgba(11,26,15,.6);border:1px solid rgba(46,204,64,.08);border-radius:8px;padding:10px 14px;min-width:120px;}
.az-title-tribe-name{font-family:'Titan One',cursive;font-size:11px;letter-spacing:3px;padding-bottom:6px;margin-bottom:8px;}
.az-title-tribe-avs{display:flex;gap:3px;justify-content:center;flex-wrap:wrap;}
.az-title-host{display:flex;align-items:center;gap:8px;justify-content:center;margin-top:22px;opacity:.3;}
.az-title-host-av{width:22px;height:22px;border-radius:50%;border:1px solid rgba(46,204,64,.2);object-fit:cover;}
.az-title-host-quote{font-size:11px;font-style:italic;color:var(--az-muted);}
.az-title-phases{margin-top:22px;text-align:left;max-width:480px;margin-left:auto;margin-right:auto;display:flex;flex-direction:column;gap:8px;}
.az-title-phase-desc{display:flex;gap:10px;align-items:flex-start;padding:8px 12px;background:rgba(11,26,15,.5);border:1px solid rgba(46,204,64,.06);border-radius:6px;}
.az-tpd-num{font-family:'Titan One',cursive;font-size:18px;color:var(--az-leaf);opacity:.25;line-height:1;min-width:22px;text-align:center;padding-top:2px;}
.az-tpd-name{font-family:'Titan One',cursive;font-size:10px;color:var(--az-gold);letter-spacing:2px;margin-bottom:2px;}
.az-tpd-text{font-size:10px;color:var(--az-muted);line-height:1.4;}
.az-title-start{margin-top:20px;font-size:10px;letter-spacing:4px;color:var(--az-leaf);opacity:.35;animation:az-pulse-start 2.5s ease-in-out infinite;}
@keyframes az-pulse-start{0%,100%{opacity:.25;}50%{opacity:.55;}}

/* ═══ CSS ICONS ═══ */
.az-icon{width:20px;height:20px;position:relative;flex-shrink:0;display:inline-block;}
.az-icon .ic{width:100%;height:100%;position:relative;}
.az-icon-vine .ic{width:3px;height:18px;background:linear-gradient(180deg,var(--az-vine),var(--az-moss));border-radius:2px;margin:0 auto;position:relative;}
.az-icon-vine .ic::before{content:'';position:absolute;top:3px;left:-5px;width:7px;height:4px;background:var(--az-leaf);border-radius:50% 0;transform:rotate(-30deg);opacity:.6;}
.az-icon-vine .ic::after{content:'';position:absolute;top:10px;right:-5px;width:7px;height:4px;background:var(--az-leaf);border-radius:0 50%;transform:rotate(30deg);opacity:.6;}
.az-icon-leaf .ic{width:12px;height:8px;background:var(--az-leaf);border-radius:50% 0;transform:rotate(-30deg);margin:6px auto;opacity:.7;box-shadow:0 0 4px rgba(46,204,64,.3);}
.az-icon-machete .ic{width:4px;height:16px;background:linear-gradient(180deg,#ccc,#999);border-radius:1px;margin:2px auto;position:relative;}
.az-icon-machete .ic::before{content:'';position:absolute;bottom:-2px;left:-2px;width:8px;height:4px;background:var(--az-bark);border-radius:2px;}
.az-icon-tiki .ic{width:14px;height:18px;background:linear-gradient(180deg,var(--az-bark),var(--az-clay));border-radius:3px 3px 2px 2px;margin:1px auto;position:relative;}
.az-icon-tiki .te{position:absolute;width:4px;height:3px;background:var(--az-tribal);border-radius:50%;}
.az-icon-tiki .te-l{top:4px;left:2px;}
.az-icon-tiki .te-r{top:4px;right:2px;}
.az-icon-tiki .tm{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:6px;height:3px;border-bottom:2px solid var(--az-tribal);border-radius:0 0 3px 3px;}
.az-icon-snake .ic{width:16px;height:10px;border:2px solid var(--az-leaf);border-radius:0 8px 8px 0;border-left:none;margin:5px auto;position:relative;}
.az-icon-snake .ic::before{content:'';position:absolute;top:-1px;right:-2px;width:3px;height:3px;background:var(--az-danger);border-radius:50%;}
.az-icon-torch .ic{width:4px;height:14px;background:linear-gradient(180deg,var(--az-bark),#5a3a10);border-radius:1px;margin:3px auto;position:relative;}
.az-icon-torch .fl{position:absolute;top:-6px;left:-3px;width:10px;height:8px;background:radial-gradient(ellipse,var(--az-gold),var(--az-tribal),transparent);border-radius:50%;animation:az-flicker 1s ease-in-out infinite;}
@keyframes az-flicker{0%,100%{opacity:.7;transform:scale(.9);}50%{opacity:1;transform:scale(1.1);}}
.az-icon-frag .ic{width:12px;height:12px;background:linear-gradient(135deg,var(--az-gold),var(--az-amber));clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);margin:4px auto;box-shadow:0 0 6px rgba(245,200,66,.4);}
.az-icon-trap .ic{width:14px;height:12px;border:2px solid var(--az-amber);border-top:none;border-radius:0 0 4px 4px;margin:4px auto;position:relative;}
.az-icon-trap .ic::before{content:'';position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:6px solid var(--az-amber);}
.az-icon-heart .ic{width:14px;height:12px;position:relative;margin:4px auto;filter:drop-shadow(0 0 3px rgba(217,70,239,.4));}
.az-icon-heart .ic::before,.az-icon-heart .ic::after{content:'';position:absolute;width:7px;height:10px;background:var(--az-orchid);border-radius:7px 7px 0 0;}
.az-icon-heart .ic::before{left:0;transform:rotate(-45deg);transform-origin:bottom right;}
.az-icon-heart .ic::after{right:0;transform:rotate(45deg);transform-origin:bottom left;}
.az-icon-shield .ic{width:12px;height:14px;background:linear-gradient(180deg,var(--az-gold),var(--az-amber));clip-path:polygon(50% 0%,100% 20%,100% 60%,50% 100%,0% 60%,0% 20%);margin:3px auto;box-shadow:0 0 4px rgba(245,200,66,.3);}
.az-icon-debate .ic{width:14px;height:12px;border:2px solid var(--az-tribal);border-radius:6px;margin:4px auto;position:relative;}
.az-icon-debate .ic::before{content:'';position:absolute;bottom:-4px;left:3px;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:4px solid var(--az-tribal);}
.az-icon-xhair .ic{width:14px;height:14px;margin:3px auto;position:relative;}
.az-icon-xhair .ic::before{content:'';position:absolute;top:50%;left:0;right:0;height:2px;background:var(--az-danger);transform:translateY(-50%);}
.az-icon-xhair .ic::after{content:'';position:absolute;left:50%;top:0;bottom:0;width:2px;background:var(--az-danger);transform:translateX(-50%);}
.az-icon-zip .ic{width:16px;height:12px;margin:4px auto;position:relative;}
.az-icon-zip .ic::before{content:'';position:absolute;top:2px;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--az-moss),var(--az-leaf));border-radius:1px;transform:rotate(-15deg);}
.az-icon-zip .ic::after{content:'';position:absolute;top:3px;left:10px;width:5px;height:5px;border-radius:50%;background:var(--az-amber);border:1px solid var(--az-bark);}
.az-icon-wind .ic{width:16px;height:10px;margin:5px auto;position:relative;}
.az-icon-wind .wl{height:2px;background:linear-gradient(90deg,transparent,var(--az-muted),transparent);border-radius:1px;position:absolute;}
.az-icon-wind .wl:nth-child(1){width:14px;top:0;left:1px;}
.az-icon-wind .wl:nth-child(2){width:10px;top:4px;left:4px;}
.az-icon-wind .wl:nth-child(3){width:16px;top:8px;left:0;}

/* ═══ CARDS ═══ */
.az-card{background:var(--az-card-bg);border:1px solid rgba(232,240,232,.08);border-radius:10px;padding:16px 20px;margin:12px 0;position:relative;overflow:hidden;animation:az-slide .6s cubic-bezier(.16,1,.3,1) forwards;}
.az-card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 10%,rgba(46,204,64,.25) 50%,transparent 90%);animation:az-shim 4s ease-in-out infinite;}
@keyframes az-shim{0%,100%{opacity:.3;}50%{opacity:1;}}
@keyframes az-slide{from{transform:translateX(-20px);opacity:0;filter:blur(2px);}to{transform:none;opacity:1;filter:none;}}
.az-card-trek{border-left:3px solid var(--az-leaf);}
.az-card-danger{border-left:3px solid var(--az-danger);background:linear-gradient(135deg,rgba(224,64,64,.06),var(--az-card-bg))!important;}
.az-card-hero{border-left:3px solid var(--az-gold);background:linear-gradient(135deg,rgba(245,200,66,.06),var(--az-card-bg))!important;}
.az-card-tribe{border-left:3px solid var(--az-tribal);background:linear-gradient(135deg,rgba(224,120,48,.06),var(--az-card-bg))!important;}
.az-card-social{border:1px dashed rgba(90,168,74,.3);background:transparent!important;}
.az-card-trap{border-left:3px solid var(--az-amber);}
.az-card-frag{border-left:3px solid var(--az-gold);background:linear-gradient(135deg,rgba(245,200,66,.05),var(--az-card-bg))!important;}
.az-card-hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.az-card-txt{font-size:12px;line-height:1.6;color:rgba(232,240,232,.7);}
.az-card-txt strong{color:var(--az-leaf);}

/* Badges */
.az-badge{margin-left:auto;padding:2px 8px;border-radius:10px;font-size:8px;font-weight:700;letter-spacing:1px;white-space:nowrap;}
.az-badge-trek{background:rgba(46,204,64,.08);color:var(--az-leaf);border:1px solid rgba(46,204,64,.2);}
.az-badge-danger{background:rgba(224,64,64,.08);color:var(--az-danger);border:1px solid rgba(224,64,64,.2);}
.az-badge-social{background:rgba(217,70,239,.08);color:var(--az-orchid);border:1px solid rgba(217,70,239,.2);}
.az-badge-hero{background:rgba(245,200,66,.08);color:var(--az-gold);border:1px solid rgba(245,200,66,.2);}
.az-badge-frag{background:rgba(245,200,66,.1);color:var(--az-gold);border:1px solid rgba(245,200,66,.25);}
.az-badge-tribe{background:rgba(224,120,48,.08);color:var(--az-tribal);border:1px solid rgba(224,120,48,.2);}
.az-badge-trap{background:rgba(232,160,32,.08);color:var(--az-amber);border:1px solid rgba(232,160,32,.2);}

.az-score-pill{font-size:10px;font-weight:700;font-family:'Titan One',cursive;margin-top:6px;letter-spacing:1px;}

/* Avatars */
.az-av{border-radius:50%;border:2px solid var(--az-leaf);object-fit:cover;flex-shrink:0;}

/* ═══ FLAVOR / DIVIDERS ═══ */
.az-flavor{text-align:center;padding:8px 16px;font-size:10px;color:var(--az-leaf);opacity:.2;font-style:italic;letter-spacing:1px;}
.az-divider{display:flex;align-items:center;gap:14px;margin:30px 0;}
.az-divider::before,.az-divider::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(46,204,64,.12),transparent);}
.az-divider span{font-size:8px;color:var(--az-leaf);letter-spacing:4px;opacity:.2;text-transform:uppercase;white-space:nowrap;}

/* ═══ TRIBE BANNER ═══ */
.az-tribe-banner{display:flex;align-items:center;gap:10px;padding:8px 14px;border:1px solid rgba(232,240,232,.1);border-radius:8px;margin:16px 0 8px;position:relative;overflow:hidden;background:rgba(11,26,15,.6);}
.az-tribe-banner-bar{position:absolute;left:0;top:0;bottom:0;width:4px;}
.az-tribe-banner-name{font-family:'Titan One',cursive;font-size:13px;letter-spacing:2px;}

/* ═══ RESULTS ═══ */
.az-results{text-align:center;padding:40px 20px;}
.az-results-title{font-family:'Titan One',cursive;font-size:32px;color:var(--az-white);text-shadow:0 0 40px rgba(46,204,64,.4);letter-spacing:5px;}
.az-results-sub{font-size:11px;color:var(--az-leaf);letter-spacing:5px;opacity:.35;margin-top:4px;margin-bottom:24px;}
.az-rteam{background:linear-gradient(135deg,rgba(46,204,64,.04),rgba(11,26,15,.85));border:1px solid rgba(232,240,232,.08);border-radius:12px;padding:16px 20px;margin:10px auto;max-width:500px;display:flex;align-items:center;gap:14px;position:relative;}
.az-rteam.winner{border-color:rgba(245,200,66,.25);box-shadow:0 0 20px rgba(245,200,66,.05);}
.az-rteam.loser{border-color:rgba(224,64,64,.25);}

/* ═══ SIDEBAR ═══ */
.az-sidebar{position:sticky;top:80px;flex-shrink:0;width:210px;background:linear-gradient(180deg,rgba(46,204,64,.04),rgba(11,26,15,.92));border:1px solid rgba(46,204,64,.1);border-radius:12px;padding:12px;backdrop-filter:blur(16px);z-index:20;box-shadow:0 4px 24px rgba(0,0,0,.5);max-height:calc(100vh - 100px);overflow-y:auto;order:2;}
.az-sb-title{font-family:'Titan One',cursive;font-size:9px;color:var(--az-leaf);letter-spacing:3px;text-align:center;margin-bottom:8px;opacity:.5;}
.az-sb-section{font-family:'Titan One',cursive;font-size:8px;color:var(--az-muted);letter-spacing:3px;margin:10px 0 4px;opacity:.4;border-top:1px solid rgba(232,240,232,.05);padding-top:8px;}
.az-sb-tribe{padding:6px 0;border-bottom:1px solid rgba(232,240,232,.04);}
.az-sb-tribe:last-child{border-bottom:none;}
.az-sb-tribe-name{font-family:'Titan One',cursive;font-size:9px;letter-spacing:2px;margin-bottom:4px;}
.az-sb-stat{display:flex;align-items:center;gap:4px;padding:2px 0;font-size:9px;}
.az-sb-label{display:flex;align-items:center;gap:3px;flex:1;color:var(--az-muted);font-size:8px;letter-spacing:1px;}
.az-sb-val{font-family:'Titan One',cursive;font-size:9px;letter-spacing:1px;}
.az-sb-total{font-family:'Titan One',cursive;font-size:10px;letter-spacing:2px;margin-top:4px;padding-top:4px;border-top:1px solid rgba(232,240,232,.06);}
.az-sb-frags{font-size:8px;color:var(--az-amber);letter-spacing:1px;margin-top:3px;display:flex;align-items:center;gap:3px;}
.az-sb-oi{display:inline-flex;flex-shrink:0;transform:scale(.65);margin:-2px -3px;}
.az-sb-roster{margin-top:5px;padding-top:5px;border-top:1px solid rgba(46,204,64,.08);display:flex;flex-direction:column;gap:3px;}
.az-sb-row{display:flex;align-items:center;gap:5px;padding:2px 0;font-size:9px;}
.az-sb-av{width:22px;height:22px;border-radius:4px;object-fit:contain;flex-shrink:0;border:2px solid rgba(232,240,232,.12);background:rgba(11,26,15,.5);}
.az-sb-pname{color:var(--az-white);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;}
.az-sb-outcome{letter-spacing:.5px;font-size:8px;font-family:'Titan One',cursive;white-space:nowrap;}
.az-sb-pscore{min-width:18px;text-align:right;font-size:9px;font-family:'Titan One',cursive;}
.az-sb-row{display:flex;align-items:center;gap:4px;padding:2px 0;border-bottom:1px solid rgba(232,240,232,.03);}
.az-sb-row:last-child{border-bottom:none;}
.az-sb-av{width:18px;height:18px;border-radius:50%;border:1px solid var(--az-leaf);object-fit:cover;flex-shrink:0;}
.az-sb-name{font-size:9px;font-weight:600;color:var(--az-white);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.az-sb-score{font-size:9px;font-weight:700;font-family:'Titan One',cursive;letter-spacing:1px;}
.az-sb-live{font-size:7px;letter-spacing:1px;animation:az-sb-pulse 1.5s ease-in-out infinite;}
@keyframes az-sb-pulse{0%,100%{opacity:.5;}50%{opacity:1;}}

/* ═══ CONTROLS ═══ */
.az-controls{position:fixed;bottom:0;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:12px 24px;background:rgba(11,26,15,.95);border:1px solid rgba(46,204,64,.1);border-bottom:none;border-radius:12px 12px 0 0;backdrop-filter:blur(16px);z-index:30;box-shadow:0 -4px 24px rgba(0,0,0,.5);}
.az-btn{padding:7px 20px;border-radius:6px;border:1px solid rgba(46,204,64,.2);background:transparent;color:var(--az-leaf);font-family:'Archivo Narrow',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;cursor:pointer;transition:all .25s;}
.az-btn:hover{background:rgba(46,204,64,.06);border-color:var(--az-leaf);}
.az-btn-p{background:linear-gradient(135deg,rgba(46,204,64,.12),rgba(57,255,20,.06));color:var(--az-white);border-color:rgba(46,204,64,.25);}
.az-counter{font-size:10px;color:var(--az-leaf);opacity:.35;letter-spacing:3px;font-family:'Titan One',cursive;}

/* ═══ STEP VISIBILITY ═══ */
.az-hidden{display:none;}
.az-visible{display:block!important;}

/* ═══ BIG MOMENT ═══ */
.az-big{border-width:2px;padding:24px;text-align:center;box-shadow:0 0 30px rgba(245,200,66,.06);}
.az-big .az-card-txt{font-size:14px;}

/* ═══ SHAKE ═══ */
@keyframes az-shake{0%,100%{transform:translateX(0);}10%{transform:translateX(-4px) rotate(-.3deg);}20%{transform:translateX(4px) rotate(.3deg);}30%{transform:translateX(-3px);}40%{transform:translateX(3px);}50%{transform:translateX(-1px);}}

/* ═══ RESPONSIVE ═══ */
@media(max-width:900px){.az-sidebar{display:none;}.az-shell-wrap{display:block;}}
@media(prefers-reduced-motion:reduce){.az-ray,.az-fly,.az-vine-strand,.az-card,.az-title-main,.az-title-start,.az-icon-torch .fl{animation:none!important;}}
</style>

<div class="az-shell-wrap" data-phase="${sidebarPhase}">
  ${_buildAtmosphere()}
  <div class="az-main">
    ${content}
  </div>
  ${sidebar}
</div>
<div style="height:80px;"></div>`;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN BUILDERS
// ══════════════════════════════════════════════════════════════

export function rpBuildAZTitleCard(ep) {
  const az = ep?.amazonRace;
  if (!az) return '';

  const epNum = window.vpEpNum || gs.episodeHistory?.length || 1;
  const h = host();
  const hostSlug = seasonConfig?.hostSlug || 'chris';

  // Recover tribe names from gs.tribes if result data is missing them
  az.tribes.forEach(t => {
    if (!t.tribeName && !t.name && t.members?.length) {
      const gst = gs.tribes.find(gt => gt.members && t.members.some(m => gt.members.includes(m)));
      if (gst) t.tribeName = gst.tribeName;
    }
  });

  // Tribe blocks with avatars
  const tribeBlocks = az.tribes.map(t => {
    const tc = tribeColor(_tn(t));
    const tn = _tn(t);
    const avs = t.members.map(name =>
      `<img class="az-av" src="assets/avatars/${slug(name)}.png" style="width:30px;height:30px;border-color:${tc};" onerror="this.style.display='none'">`
    ).join('');
    return `<div class="az-title-tribe">
      <div class="az-title-tribe-name" style="color:${tc};border-bottom:2px solid ${tc}40;">${tn.toUpperCase()}</div>
      <div class="az-title-tribe-avs">${avs}</div>
    </div>`;
  }).join('');

  const content = `
    <div class="az-titlecard">
      <div class="az-title-frame">
        <div class="az-title-tribal-top"></div>
        <div class="az-title-tribal-left"></div>
        <div class="az-title-tribal-right"></div>
        <div class="az-title-tribal-bottom"></div>
        <div class="az-title-tiki-l">${_icon('tiki')}</div>
        <div class="az-title-tiki-r">${_icon('tiki')}</div>
      </div>
      <div class="az-ttag">EPISODE ${epNum} &mdash; TRIBE CHALLENGE</div>
      <h1 class="az-title-main">THE AM-AH-ZON RACE</h1>
      <div class="az-tsub">SURVIVE THE JUNGLE &bull; CLAIM THE TREASURE</div>
      <div class="az-tcrack"></div>
      <div class="az-ticons">
        <div class="az-ticon-item"><div class="az-ticon-ring">${_icon('zip')}</div><div class="lbl">ZIPLINE</div></div>
        <div class="az-ticon-arrow">${_icon('leaf')}</div>
        <div class="az-ticon-item"><div class="az-ticon-ring">${_icon('machete')}</div><div class="lbl">TREK</div></div>
        <div class="az-ticon-arrow">${_icon('leaf')}</div>
        <div class="az-ticon-item"><div class="az-ticon-ring">${_icon('tiki')}</div><div class="lbl">GUARDIANS</div></div>
        <div class="az-ticon-arrow">${_icon('leaf')}</div>
        <div class="az-ticon-item"><div class="az-ticon-ring">${_icon('frag')}</div><div class="lbl">RUINS</div></div>
      </div>
      <div class="az-title-phases">
        <div class="az-title-phase-desc">
          <div class="az-tpd-num">1</div>
          <div><div class="az-tpd-name">ZIPLINE CROSSING</div><div class="az-tpd-text">Leap from the cliff and ride the vine zipline across a jungle chasm. Hold on tight — wind, snakes, and fraying vines await.</div></div>
        </div>
        <div class="az-title-phase-desc">
          <div class="az-tpd-num">2</div>
          <div><div class="az-tpd-name">JUNGLE TREK</div><div class="az-tpd-text">Navigate three dense jungle segments. Vote on your route, hack through the undergrowth, and survive quicksand, swarms, and collapsing canopy.</div></div>
        </div>
        <div class="az-title-phase-desc">
          <div class="az-tpd-num">3</div>
          <div><div class="az-tpd-name">GUARDIAN ENCOUNTER</div><div class="az-tpd-text">Face the ancient Zing-Zing tribe. Elect a speaker, choose your approach — diplomacy, bribery, or intimidation — and hope they let you pass.</div></div>
        </div>
        <div class="az-title-phase-desc">
          <div class="az-tpd-num">4</div>
          <div><div class="az-tpd-name">TEMPLE RUINS</div><div class="az-tpd-text">Hunt for golden fragments in crumbling ruins. Dodge traps, unearth ancient relics, and race to assemble the treasure before time runs out.</div></div>
        </div>
      </div>
      <div class="az-title-tribes">${tribeBlocks}</div>
      <div class="az-title-cold-open" style="padding:14px 18px;margin:12px 0;background:rgba(11,26,15,.6);border-left:3px solid var(--az-tribal);border-radius:6px;font-size:11px;line-height:1.6;color:var(--az-text);font-style:italic;">
        ${pick(COLD_OPEN)()}
      </div>
      <div class="az-title-host">
        <img src="assets/avatars/${hostSlug}.png" class="az-title-host-av" onerror="this.style.display='none'">
        <div class="az-title-host-quote">"${pick(HOST_QUIP)()}"</div>
      </div>
      <div class="az-title-start">► PRESS REVEAL TO BEGIN EXPEDITION ◄</div>
    </div>`;

  return _shell(content, ep, 'az-title');
}

export function rpBuildAZZipline(ep) {
  const az = ep?.amazonRace;
  if (!az) return '';

  const screenKey = 'az-zipline';
  const suffix = 'zipline';

  // Deduplicate tribes by name to prevent tripling
  const seenTribes = new Set();
  const uniqueTribes = az.tribes.filter(tribe => {
    const tn = _tn(tribe);
    if (seenTribes.has(tn)) return false;
    seenTribes.add(tn);
    return true;
  });

  // Build structured event list: host intro → per-tribe debate → crossings → landing
  const allEvents = [];
  const zipStepMeta = [];  // flat array parallel to allEvents: { tribe, beat, score }

  // Per-tribe: debate section → crossing banner → crossings → landing banner → landing
  uniqueTribes.forEach(tribe => {
    const tn = _tn(tribe);
    const tc = tribeColor(tn);

    // Tribe debate header
    allEvents.push({ _tribe: tn, type: 'tribe-header', _beat: 'debate', _tribeColor: tc });
    zipStepMeta.push({ tribe: tn, beat: 'debate', score: 0 });

    // Debate events: advocacy, interjections, decision
    const debateEvts = tribe.zipline.events.filter(e => e.type === 'debate');
    debateEvts.forEach(evt => {
      allEvents.push({ ...evt, _tribe: tn });
      zipStepMeta.push({ tribe: tn, beat: 'debate', score: 0 });
    });

    // Crossing beat banner
    const techLabel = tribe.zipline.technique?.label || 'UNKNOWN';
    allEvents.push({ _tribe: tn, type: 'beat-header', _beat: 'crossing', _tribeColor: tc, _techLabel: techLabel });
    zipStepMeta.push({ tribe: tn, beat: 'crossing', score: 0 });

    // Crossing events (non-debate, non-landing)
    const crossingEvts = tribe.zipline.events.filter(e => e.type !== 'debate' && e.subtype !== 'landing');
    crossingEvts.forEach(evt => {
      allEvents.push({ ...evt, _tribe: tn });
      const outcome = evt.subtype === 'freeze' ? 'FROZE' : evt.subtype === 'fray' ? 'FRAY' : evt.subtype === 'fray-dodge' ? 'POWERED' : evt.subtype === 'gust' ? 'GUST' : evt.subtype === 'gust-fight' ? 'FOUGHT' : evt.subtype === 'clean' ? 'CLEAN' : evt.subtype === 'slow' ? 'SLOW' : evt.subtype === 'tandem-save' ? 'SAVED' : evt.subtype === 'belt-snap' ? 'SNAP!' : evt.subtype === 'belt-save' ? 'SAVED' : evt.subtype === 'piggyback-drop' ? 'DROPPED' : evt.subtype === 'piggyback-save' ? 'CATCH!' : evt.subtype === 'tbar-jam' ? 'JAMMED' : evt.subtype === 'tbar-unjam' ? 'UNJAMMED' : evt.subtype === 'piranha' ? 'PIRANHA!' : evt.subtype === 'encourage' ? null : evt.subtype === 'heckle' ? null : null;
      zipStepMeta.push({ tribe: tn, beat: 'crossing', score: evt.score || 0, player: evt.player || null, outcome });
    });

    // Landing beat banner
    allEvents.push({ _tribe: tn, type: 'beat-header', _beat: 'landing', _tribeColor: tc });
    zipStepMeta.push({ tribe: tn, beat: 'landing', score: 0 });

    // Landing assessment
    const landingEvt = tribe.zipline.events.find(e => e.subtype === 'landing');
    if (landingEvt) {
      allEvents.push({ ...landingEvt, _tribe: tn });
      zipStepMeta.push({ tribe: tn, beat: 'landing', score: landingEvt.score || 0 });
    }
  });
  // ── ZIPLINE PLACEMENT CARD ──
  const zipPlacement = _buildPhasePlacementCard(
    { tribes: uniqueTribes }, 'ZIPLINE', 1, 4, 'JUNGLE TREK',
    t => t.zipline.score
  );
  allEvents.push({ type: 'zip-results', _placement: zipPlacement });
  zipStepMeta.push({ tribe: '', beat: 'results', score: 0 });

  window._azZipStepMeta = zipStepMeta;

  // Store per-tribe zipline data for sidebar
  const zipTribeData = {};
  uniqueTribes.forEach(tribe => {
    const tn = _tn(tribe);
    const tech = tribe.zipline.technique;
    const debate = tribe.zipline.debate || {};
    const crossingEvts = tribe.zipline.events.filter(e => e.type !== 'debate' && e.subtype !== 'landing');
    zipTribeData[tn] = {
      technique: tech ? tech.label : null,
      techId: tech ? tech.id : null,
      debateWinner: debate.winner?.name || null,
      totalCrossers: tribe.members.length,
      crossingCount: crossingEvts.length,
      finalScore: tribe.zipline.score
    };
  });
  window._azZipTribeData = zipTribeData;

  const totalSteps = allEvents.length + 1; // +1 for host intro at step 0
  _ensureState(screenKey, totalSteps);

  let cardsHtml = '';
  const h = host();
  const hostSlug = seasonConfig?.hostSlug || 'chris';

  // Step 0: Host intro
  cardsHtml += `<div id="az-step-${suffix}-0" class="az-hidden">
    <div class="az-card az-card-trek" style="border-left:3px solid var(--az-gold);">
      <div class="az-card-hdr">
        <img src="assets/avatars/${hostSlug}.png" class="az-av" style="width:36px;height:36px;border-color:var(--az-gold);" onerror="this.style.display='none'">
        <div><div style="font-family:'Titan One',cursive;font-size:12px;color:var(--az-gold);letter-spacing:1px;">${h.toUpperCase()} EXPLAINS</div><div style="font-size:9px;color:var(--az-gold);opacity:.5;">Phase 1: Zipline</div></div>
      </div>
      <div class="az-card-txt">
        <div>"Alright everyone! First up: the <strong>Zipline Crossing</strong>. Each tribe has to get across that chasm. You've got a T-Bar, your belts, and each other. Pick your method."</div>
        <div style="margin-top:6px;">"But first — you'll <em>debate</em> how to cross. T-Bar one at a time? Belt slide all at once? Or piggyback in pairs? Choose wisely."</div>
      </div>
    </div>
  </div>`;

  allEvents.forEach((evt, idx) => {
    const i = idx + 1;

    // Tribe header banner (debate start)
    if (evt.type === 'tribe-header') {
      const tc = evt._tribeColor || tribeColor(evt._tribe);
      cardsHtml += `<div id="az-step-${suffix}-${i}" class="az-hidden">
        <div class="az-tribe-banner" style="border-color:${tc}33;">
          <div class="az-tribe-banner-bar" style="background:${tc};"></div>
          <div class="az-tribe-banner-name" style="color:${tc};">${(evt._tribe || '').toUpperCase()} &mdash; TECHNIQUE DEBATE</div>
        </div>
      </div>`;
      return;
    }

    // Beat transition banner (crossing / landing)
    if (evt.type === 'beat-header') {
      const tc = evt._tribeColor || tribeColor(evt._tribe);
      const beatLabel = evt._beat === 'crossing' ? `CROSSING &mdash; ${evt._techLabel || 'TECHNIQUE'}` : 'LANDING ASSESSMENT';
      const beatIcon = evt._beat === 'crossing' ? _icon('zip') : _icon('leaf');
      cardsHtml += `<div id="az-step-${suffix}-${i}" class="az-hidden">
        <div class="az-tribe-banner" style="border-color:${tc}33;background:linear-gradient(90deg,${tc}15,transparent);">
          <div class="az-tribe-banner-bar" style="background:${tc};opacity:.6;"></div>
          <div class="az-tribe-banner-name" style="color:${tc};font-size:11px;">${beatIcon} ${(evt._tribe || '').toUpperCase()} &mdash; ${beatLabel}</div>
        </div>
      </div>`;
      return;
    }

    // Zipline placement results card
    if (evt.type === 'zip-results') {
      cardsHtml += _renderPlacementCard(suffix, i, 'ZIPLINE RESULTS', 'PHASE 1 COMPLETE', evt._placement, _icon('zip'));
      return;
    }

    // Decision card with vote breakdown visual
    if (evt.type === 'debate' && evt.subtype === 'decision') {
      const votes = evt._techVotes || {};
      const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
      const voteBarHtml = Object.entries(votes).filter(([,v]) => v > 0).map(([techId, count]) => {
        const pct = Math.round(count / totalVotes * 100);
        const label = techId === 'tbar' ? 'T-BAR' : techId === 'belt' ? 'BELT' : 'PIGGYBACK';
        const color = techId === 'belt' ? 'var(--az-danger)' : techId === 'tbar' ? 'var(--az-leaf)' : 'var(--az-moss)';
        return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">
          <span style="font-size:8px;color:${color};letter-spacing:1px;width:52px;text-align:right;">${label}</span>
          <div style="flex:1;height:12px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;transition:width .3s;"></div>
          </div>
          <span style="font-size:9px;color:var(--az-cream);opacity:.7;width:20px;">${count}</span>
        </div>`;
      }).join('');

      cardsHtml += `<div id="az-step-${suffix}-${i}" class="az-hidden">
        <div class="az-card az-card-trek" style="border-left:3px solid ${tribeColor(evt._tribe)};border:1px solid rgba(232,240,232,.08);">
          <div class="az-card-hdr">
            ${evt.player ? _av(evt.player, 32) : ''}
            <div style="flex:1;">
              <span style="font-size:7px;color:${tribeColor(evt._tribe)};letter-spacing:1px;opacity:.6;">${(evt._tribe || '').toUpperCase()}</span>
            </div>
            ${evt.badge ? `<span class="az-badge ${_badgeCls(evt.badgeClass)}">${evt.badge}</span>` : ''}
          </div>
          <div class="az-card-txt">${evt.text || ''}</div>
          <div style="margin-top:8px;padding:6px 8px;background:rgba(0,0,0,.2);border-radius:4px;">
            <div style="font-size:8px;color:var(--az-gold);letter-spacing:1px;margin-bottom:4px;">TRIBE VOTE BREAKDOWN</div>
            ${voteBarHtml}
          </div>
        </div>
      </div>`;
      return;
    }

    // Regular card with tribe color border
    cardsHtml += `<div id="az-step-${suffix}-${i}" class="az-hidden">${_buildCard(evt, i)}</div>`;
  });

  const content = `
    <div class="az-map-sticky">${_buildMap('zipline', ep)}</div>
    <div class="az-phase-hdr">
      <h2>ZIPLINE CROSSING</h2>
      <div class="az-sub">Phase 1 of 4 &mdash; Debate, Cross, Survive</div>
    </div>
    ${cardsHtml}
    <div class="az-controls" id="az-controls-${suffix}">
      <button class="az-btn az-btn-p" onclick="azRevealNext('${screenKey}',${totalSteps})">NEXT</button>
      <span class="az-counter" id="az-counter-${suffix}">0 / ${totalSteps}</span>
      <button class="az-btn" onclick="azRevealAll('${screenKey}',${totalSteps})">ALL</button>
    </div>`;

  return _shell(content, ep, 'az-zipline');
}

export function rpBuildAZTrek(ep) {
  const az = ep?.amazonRace;
  if (!az) return '';

  const screenKey = 'az-trek';
  const suffix = 'trek';

  const allEvents = [];
  az.tribes.forEach(tribe => {
    allEvents.push({ _tribe: _tn(tribe), type: 'tribe-header' });
    // Route info
    allEvents.push({
      _tribe: _tn(tribe), type: 'nav', subtype: 'route',
      text: `<strong>${_tn(tribe)}</strong> votes on a route: <strong>${tribe.trek.route.toUpperCase()}</strong> path. Pathfinder: <strong>${tribe.trek.pathfinder}</strong>.`,
      badge: tribe.trek.route.toUpperCase(), badgeClass: 'trek'
    });
    let trekSegNum = 0;
    tribe.trek.segments.forEach((seg) => {
      if (seg.isCamp) {
        allEvents.push({
          _tribe: _tn(tribe), type: 'chatter',
          text: `The jungle goes dark. ${_tn(tribe)} has no choice but to make camp and survive the night.`,
          badge: 'NIGHT CAMP', badgeClass: 'tribe'
        });
      } else {
        trekSegNum++;
        allEvents.push({
          _tribe: _tn(tribe), type: 'chatter',
          text: pick(CHATTER)(),
          badge: `SEGMENT ${trekSegNum}`, badgeClass: 'trek'
        });
      }
      seg.events.forEach(evt => {
        allEvents.push({ ...evt, _tribe: _tn(tribe) });
      });
    });
  });

  // Trek placement card — cumulative scores through phase 2
  const trekPlacement = _buildPhasePlacementCard(
    az, 'TREK', 2, 4, 'GUARDIAN ENCOUNTER',
    t => t.zipline.score + t.trek.score
  );
  allEvents.push({ type: 'phase-results', _placement: trekPlacement, _title: 'TREK RESULTS', _badge: 'PHASE 2 COMPLETE', _icon: _icon('machete') });

  const totalSteps = allEvents.length;
  _ensureState(screenKey, totalSteps);

  let cardsHtml = '';
  allEvents.forEach((evt, idx) => {
    if (evt.type === 'tribe-header') {
      const tc = tribeColor(evt._tribe);
      cardsHtml += `<div id="az-step-${suffix}-${idx}" class="az-hidden">
        <div class="az-tribe-banner" style="border-color:${tc}33;">
          <div class="az-tribe-banner-bar" style="background:${tc};"></div>
          <div class="az-tribe-banner-name" style="color:${tc};">${evt._tribe.toUpperCase()}</div>
        </div>
      </div>`;
    } else if (evt.type === 'phase-results') {
      cardsHtml += _renderPlacementCard(suffix, idx, evt._title, evt._badge, evt._placement, evt._icon);
    } else {
      cardsHtml += `<div id="az-step-${suffix}-${idx}" class="az-hidden">${_buildCard(evt, idx)}</div>`;
    }
  });

  const content = `
    <div class="az-map-sticky">${_buildMap('trek', ep)}</div>
    <div class="az-phase-hdr">
      <h2>JUNGLE TREK</h2>
      <div class="az-sub">Phase 2 of 4 &mdash; Navigate the Deep Green</div>
    </div>
    ${cardsHtml}
    <div class="az-controls" id="az-controls-${suffix}">
      <button class="az-btn az-btn-p" onclick="azRevealNext('${screenKey}',${totalSteps})">NEXT</button>
      <span class="az-counter" id="az-counter-${suffix}">0 / ${totalSteps}</span>
      <button class="az-btn" onclick="azRevealAll('${screenKey}',${totalSteps})">ALL</button>
    </div>`;

  return _shell(content, ep, 'az-trek');
}

export function rpBuildAZGuardian(ep) {
  const az = ep?.amazonRace;
  if (!az) return '';

  const screenKey = 'az-guardian';
  const suffix = 'guardian';

  const allEvents = [];
  az.tribes.forEach(tribe => {
    allEvents.push({ _tribe: _tn(tribe), type: 'tribe-header' });
    // All events flow through in order: arrival → nominations → approach debate → decision → approach execution → outcome
    tribe.guardian.events.forEach(evt => {
      allEvents.push({ ...evt, _tribe: _tn(tribe) });
    });
  });

  // Guardian placement card — cumulative scores through phase 3
  const guardPlacement = _buildPhasePlacementCard(
    az, 'GUARDIAN', 3, 4, 'TREASURE HUNT',
    t => t.zipline.score + t.trek.score + t.guardian.score
  );
  allEvents.push({ type: 'phase-results', _placement: guardPlacement, _title: 'GUARDIAN RESULTS', _badge: 'PHASE 3 COMPLETE', _icon: _icon('tiki') });

  // Fake reveal + reactions — one shared moment after all tribes
  if (az.fakeReveal?.events) {
    az.fakeReveal.events.forEach(evt => {
      allEvents.push({ ...evt, _tribe: null });
    });
  }

  const totalSteps = allEvents.length;
  _ensureState(screenKey, totalSteps);

  let cardsHtml = '';
  allEvents.forEach((evt, idx) => {
    if (evt.type === 'tribe-header') {
      const tc = tribeColor(evt._tribe);
      cardsHtml += `<div id="az-step-${suffix}-${idx}" class="az-hidden">
        <div class="az-tribe-banner" style="border-color:${tc}33;">
          <div class="az-tribe-banner-bar" style="background:${tc};"></div>
          <div class="az-tribe-banner-name" style="color:${tc};">${evt._tribe.toUpperCase()}</div>
        </div>
      </div>`;
    } else if (evt.type === 'phase-results') {
      cardsHtml += _renderPlacementCard(suffix, idx, evt._title, evt._badge, evt._placement, evt._icon);
    } else {
      cardsHtml += `<div id="az-step-${suffix}-${idx}" class="az-hidden">${_buildCard(evt, idx)}</div>`;
    }
  });

  const content = `
    <div class="az-map-sticky">${_buildMap('guardian', ep)}</div>
    <div class="az-phase-hdr">
      <h2>GUARDIAN ENCOUNTER</h2>
      <div class="az-sub">Phase 3 of 4 &mdash; The Zing-Zing Tribe</div>
    </div>
    ${cardsHtml}
    <div class="az-controls" id="az-controls-${suffix}">
      <button class="az-btn az-btn-p" onclick="azRevealNext('${screenKey}',${totalSteps})">NEXT</button>
      <span class="az-counter" id="az-counter-${suffix}">0 / ${totalSteps}</span>
      <button class="az-btn" onclick="azRevealAll('${screenKey}',${totalSteps})">ALL</button>
    </div>`;

  return _shell(content, ep, 'az-guardian');
}

export function rpBuildAZRuins(ep) {
  const az = ep?.amazonRace;
  if (!az) return '';

  const screenKey = 'az-ruins';
  const suffix = 'ruins';

  const allEvents = [];

  // Group events by room — entrance events come first per tribe, then corridors, then sanctum
  const roomSubtypes = {
    entrance: new Set(['entrance']),
    corridors: new Set(['corridor', 'puzzle', 'puzzle-solve', 'puzzle-fail']),
    sanctum: new Set(['sanctum']),
  };

  // Helper: get events for a tribe in a specific room
  function _ruinsRoomEvents(tribe, roomIdx) {
    const events = tribe.ruins.events;
    let roomCount = -1;
    const result = [];
    for (const evt of events) {
      if (evt.type === 'chatter' && (evt.subtype === 'entrance' || evt.subtype === 'corridor' || evt.subtype === 'sanctum')) {
        roomCount++;
      }
      if (roomCount === roomIdx) result.push(evt);
      if (roomCount > roomIdx) break;
    }
    return result;
  }

  // Room 1: Entrance
  az.tribes.forEach(tribe => {
    allEvents.push({ _tribe: _tn(tribe), type: 'tribe-header' });
    _ruinsRoomEvents(tribe, 0).forEach(evt => {
      allEvents.push({ ...evt, _tribe: _tn(tribe) });
    });
  });

  // Cross-tribe events after entrance (block/taunt)
  if (az.crossTribeEvents?.length) {
    const entranceEvents = az.crossTribeEvents.filter(e => e.subtype === 'cross-block' || e.subtype === 'cross-taunt');
    entranceEvents.forEach(evt => {
      allEvents.push({ ...evt, _tribe: null });
    });
  }

  // Room 2: Corridors
  az.tribes.forEach(tribe => {
    allEvents.push({ _tribe: _tn(tribe), type: 'tribe-header' });
    _ruinsRoomEvents(tribe, 1).forEach(evt => {
      allEvents.push({ ...evt, _tribe: _tn(tribe) });
    });
  });

  // Cross-tribe fragment race after corridors
  if (az.crossTribeEvents?.length) {
    const raceEvents = az.crossTribeEvents.filter(e => e.subtype === 'cross-race' || e.subtype === 'cross-win');
    if (raceEvents.length) {
      allEvents.push({ type: 'chatter', text: `Two explorers from rival tribes converge on the same corridor...`, badge: 'COLLISION', badgeClass: 'danger', _tribe: null });
      raceEvents.forEach(evt => {
        allEvents.push({ ...evt, _tribe: null });
      });
    }
  }

  // Room 3: Inner Sanctum
  az.tribes.forEach(tribe => {
    allEvents.push({ _tribe: _tn(tribe), type: 'tribe-header' });
    _ruinsRoomEvents(tribe, 2).forEach(evt => {
      allEvents.push({ ...evt, _tribe: _tn(tribe) });
    });
  });

  // Ruins placement card — final cumulative scores, declares winner
  const ruinsPlacement = _buildPhasePlacementCard(
    az, 'RUINS', 4, 4, null,
    t => t.zipline.score + t.trek.score + t.guardian.score + t.ruins.score
  );
  const finalWinner = az.tribesSorted[0];
  const finalLoser = az.tribesSorted[az.tribesSorted.length - 1];
  const winTc = tribeColor(finalWinner);
  const loseTc = tribeColor(finalLoser);
  ruinsPlacement.gapText = `<strong style="color:${winTc};">${finalWinner}</strong> wins immunity! <strong style="color:${loseTc};">${finalLoser}</strong> faces tribal council.`;
  ruinsPlacement.nextLabel = '';
  allEvents.push({ type: 'phase-results', _placement: ruinsPlacement, _title: 'FINAL STANDINGS', _badge: 'EXPEDITION COMPLETE', _icon: _icon('frag') });

  const totalSteps = allEvents.length;
  _ensureState(screenKey, totalSteps);

  let cardsHtml = '';
  allEvents.forEach((evt, idx) => {
    if (evt.type === 'tribe-header') {
      const tc = tribeColor(evt._tribe);
      cardsHtml += `<div id="az-step-${suffix}-${idx}" class="az-hidden">
        <div class="az-tribe-banner" style="border-color:${tc}33;">
          <div class="az-tribe-banner-bar" style="background:${tc};"></div>
          <div class="az-tribe-banner-name" style="color:${tc};">${evt._tribe.toUpperCase()}</div>
        </div>
      </div>`;
    } else if (evt.type === 'phase-results') {
      cardsHtml += _renderPlacementCard(suffix, idx, evt._title, evt._badge, evt._placement, evt._icon);
    } else {
      cardsHtml += `<div id="az-step-${suffix}-${idx}" class="az-hidden">${_buildCard(evt, idx)}</div>`;
    }
  });

  const content = `
    <div class="az-map-sticky">${_buildMap('ruins', ep)}</div>
    <div class="az-phase-hdr">
      <h2>TREASURE HUNT</h2>
      <div class="az-sub">Phase 4 of 4 &mdash; The Ancient Ruins</div>
    </div>
    ${cardsHtml}
    <div class="az-controls" id="az-controls-${suffix}">
      <button class="az-btn az-btn-p" onclick="azRevealNext('${screenKey}',${totalSteps})">NEXT</button>
      <span class="az-counter" id="az-counter-${suffix}">0 / ${totalSteps}</span>
      <button class="az-btn" onclick="azRevealAll('${screenKey}',${totalSteps})">ALL</button>
    </div>`;

  return _shell(content, ep, 'az-ruins');
}

export function rpBuildAZResults(ep) {
  const az = ep?.amazonRace;
  if (!az) return '';

  const screenKey = 'az-results';
  const suffix = 'results';

  const steps = [];

  // Step 0: Final standings header
  steps.push(`<div class="az-results">
    <div class="az-results-title">EXPEDITION RESULTS</div>
    <div class="az-results-sub">THE JUNGLE HAS SPOKEN</div>
  </div>`);

  // Team results
  az.tribesSorted.forEach((tn, i) => {
    const tribe = az.tribes.find(t => _tn(t) === tn);
    if (!tribe) return;
    const tc = tribeColor(tn);
    const place = i === 0 ? '1ST' : i === az.tribesSorted.length - 1 ? 'LAST' : `${i + 1}${i === 1 ? 'ND' : 'RD'}`;
    const cls = i === 0 ? 'winner' : i === az.tribesSorted.length - 1 ? 'loser' : '';
    const placeColor = i === 0 ? 'var(--az-gold)' : i === az.tribesSorted.length - 1 ? 'var(--az-danger)' : 'var(--az-leaf)';

    const memberAvatars = tribe.members.map(name =>
      `<img class="az-av" src="assets/avatars/${slug(name)}.png" style="width:24px;height:24px;border-color:${tc};" onerror="this.style.display='none'">`
    ).join('');

    const fragStr = tribe.ruins.allFragments ? `<span style="color:var(--az-gold);font-size:9px;letter-spacing:1px;">ALL FRAGMENTS</span>` : `<span style="color:var(--az-amber);font-size:9px;">${tribe.ruins.fragmentsFound}/4</span>`;
    const guardStr = tribe.guardian.success ? `<span style="color:var(--az-leaf);font-size:9px;">PASSAGE GRANTED</span>` : `<span style="color:var(--az-danger);font-size:9px;">BLOCKED</span>`;

    steps.push(`<div class="az-rteam ${cls}" style="border-left:4px solid ${tc};">
      <div style="font-family:'Titan One',cursive;font-size:20px;color:${placeColor};min-width:50px;text-align:center;">${place}</div>
      <div style="flex:1;">
        <div style="font-family:'Titan One',cursive;font-size:14px;color:${tc};letter-spacing:2px;">${tn.toUpperCase()}</div>
        <div style="display:flex;gap:3px;margin:4px 0;">${memberAvatars}</div>
        <div style="font-size:10px;color:var(--az-muted);display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;">
          ${_icon('zip')} <span>${tribe.zipline.score.toFixed(1)}</span>
          ${_icon('machete')} <span>${tribe.trek.score.toFixed(1)}</span>
          ${_icon('tiki')} ${guardStr}
          ${_icon('frag')} ${fragStr}
        </div>
      </div>
      <div style="font-family:'Titan One',cursive;font-size:18px;color:${placeColor};">${tribe.avgScore.toFixed(1)}</div>
    </div>`);
  });

  // Host closing
  const h = host();
  const hostSlug = seasonConfig?.hostSlug || 'chris';
  steps.push(`<div class="az-card" style="border-left:3px solid var(--az-gold);margin-top:20px;">
    <div class="az-card-hdr">
      <img src="assets/avatars/${hostSlug}.png" class="az-av" style="width:36px;height:36px;border-color:var(--az-gold);" onerror="this.style.display='none'">
      <div style="font-family:'Titan One',cursive;font-size:12px;color:var(--az-gold);letter-spacing:1px;">${h.toUpperCase()}</div>
    </div>
    <div class="az-card-txt">"${az.winner}, congratulations! You survived the jungle, the guardians, and the ruins. You're safe tonight."<br>
    "${az.loser}... the jungle wasn't kind to you. I'll see you at tribal council."</div>
  </div>`);

  const totalSteps = steps.length;
  _ensureState(screenKey, totalSteps);

  let cardsHtml = '';
  steps.forEach((html, idx) => {
    cardsHtml += `<div id="az-step-${suffix}-${idx}" class="az-hidden">${html}</div>`;
  });

  const content = `
    <div class="az-map-sticky">${_buildMap('finish', ep)}</div>
    ${cardsHtml}
    <div class="az-controls" id="az-controls-${suffix}">
      <button class="az-btn az-btn-p" onclick="azRevealNext('${screenKey}',${totalSteps})">NEXT</button>
      <span class="az-counter" id="az-counter-${suffix}">0 / ${totalSteps}</span>
      <button class="az-btn" onclick="azRevealAll('${screenKey}',${totalSteps})">ALL</button>
    </div>`;

  return _shell(content, ep, 'az-results');
}

// ══════════════════════════════════════════════════════════════
// REVEAL HANDLERS
// ══════════════════════════════════════════════════════════════

export function azRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('az-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch (e) { console.warn('AZ reveal error:', e); }
  try { _azUpdateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
  const el = document.getElementById(`az-step-${suffix}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function azRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('az-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch (e) { console.warn('AZ revealAll error:', e); }
  try { _azUpdateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
  const last = document.getElementById(`az-step-${suffix}-${st.total - 1}`);
  if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
