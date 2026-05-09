// js/chal/hangar-black.js — Operation: Hangar Black: both-phase twist challenge (facility breach + specimen hunt + extraction)
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
function aAn(word) { return /^[aeiou]/i.test(word) ? 'an' : 'a'; }
function portrait(name, size = 42) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);
const NEUTRAL_ARCHS = new Set(['hothead', 'challenge-beast', 'wildcard', 'chaos-agent', 'floater', 'perceptive-player']);

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

// ── ENTRY PHASE ──
const ENTRY_VENT_PASS = [
  (n, pr) => `${n} slides through the ventilation shaft headfirst. Tight squeeze. ${pr.Sub} emerges inside the facility without a sound.`,
  (n, pr) => `${n} pries the vent cover loose and worms ${pr.posAdj} way through the ductwork. Dusty, dark, but effective.`,
  (n, pr) => `The vent groans under ${n}'s weight, but ${pr.sub} keeps moving. ${pr.Sub} drops into the corridor on the other side. Clean entry.`,
  (n, pr) => `${n} navigates the ventilation system like ${pr.sub}'s done it before. Maybe ${pr.sub} has. ${pr.Sub}'s inside.`,
  (n, pr) => `${n} exhales, squeezes through the last bend in the vent, and rolls out onto the facility floor. No alarms.`,
  (n, pr) => `A tight crawl through rusted ductwork. ${n} ignores the claustrophobia and pushes forward. ${pr.Sub}'s through.`,
];

const ENTRY_VENT_FAIL = [
  (n, pr) => `${n} gets stuck halfway through the vent shaft. The banging echoes through the facility. ${pr.Sub} eventually pulls free, but not quietly.`,
  (n, pr) => `The vent collapses under ${n}. ${pr.Sub} crashes onto the corridor floor in a shower of dust and metal. So much for stealth.`,
  (n, pr) => `${n}'s shoulder catches on a bolt inside the vent. ${pr.Sub} rips free, leaving skin behind. That's going to leave a mark.`,
  (n, pr) => `${n} misjudges the drop at the end of the shaft and lands hard. ${pr.posAdj} ankle screams. Still inside, but limping.`,
];

const ENTRY_FENCE_PASS = [
  (n, pr) => `${n} cuts through the chain-link fence with surgical precision. The gap is clean. ${pr.Sub} slips inside.`,
  (n, pr) => `The wire cutters make quick work of the perimeter fence. ${n} peels it back and ducks through.`,
  (n, pr) => `${n} finds a weak point in the fence line and carves an opening. Strategic. Quiet. Textbook infiltration.`,
  (n, pr) => `${n} studies the fence for fifteen seconds, finds the sweet spot, and cuts a perfect entry hole. ${pr.Sub}'s through.`,
  (n, pr) => `Two snips and ${n} is inside the perimeter. The fence barely moves. ${pr.Sub} planned every cut.`,
];

const ENTRY_FENCE_FAIL = [
  (n, pr) => `${n} cuts into the fence but hits a reinforced cable. The cutters jam. ${pr.Sub} forces through the gap, catching ${pr.posAdj} gear on the wire.`,
  (n, pr) => `The fence is electrified. ${n} doesn't realize until ${pr.sub} grabs the wire. The shock rattles ${pr.posAdj} teeth.`,
  (n, pr) => `${n} gets tangled in the cut fence wire. Every movement drives the barbs deeper. ${pr.Sub} rips free, bleeding.`,
  (n, pr) => `${n} miscalculates the angle and the fence springs back, catching ${pr.obj} across the face. Inside, but battered.`,
];

const ENTRY_BLUFF_PASS = [
  (n, pr) => `${n} walks straight up to the guard station and delivers a flawless cover story. The guard waves ${pr.obj} through. Ice cold.`,
  (n, pr) => `"Facility inspection, Section 7." ${n} doesn't blink. The guard doesn't question it. ${pr.Sub}'s in.`,
  (n, pr) => `${n} flashes a fake badge and makes small talk about the weather. The guard opens the gate. Sometimes charm is all you need.`,
  (n, pr) => `${n} adopts a tone of complete authority and tells the guard there's a problem in the east wing. The guard runs to check. Front door is wide open.`,
  (n, pr) => `${n} bluffs ${pr.posAdj} way past security with a clipboard and a confident stride. Nobody stops a person with a clipboard.`,
  (n, pr) => `"You weren't told? They moved the briefing to 0400." ${n} says it with such conviction the guard apologizes for the confusion.`,
];

const ENTRY_BLUFF_FAIL = [
  (n, pr) => `${n} tries to bluff ${pr.posAdj} way past the guard. The guard isn't buying it. The alarm goes off before ${n} can finish the sentence.`,
  (n, pr) => `"Nice try." The guard stares at ${n}. The alarm wails across the facility. ${n}'s bluff just made everything harder for everyone.`,
  (n, pr) => `${n} starts ${pr.posAdj} cover story. The guard picks up the radio. ${n} runs. The alarm follows.`,
  (n, pr) => `The guard asks for ${n}'s clearance code. ${n} doesn't have one. The silence is deafening. Then the siren starts.`,
  (n, pr) => `${n} delivers ${pr.posAdj} bluff with confidence. Unfortunately, the guard's shift started ten minutes ago. ${pr.Sub} knows everyone on the roster. Alarm triggered.`,
];

// ── HUNT PHASE ──
const HAZARD_NAMES = {
  1: ['Motion Sensor', 'Locked Door', 'Tripwire', 'IR Beam'],
  2: ['Laser Grid', 'Guard Patrol', 'Pressure Plate', 'Gas Vent'],
  3: ['Security Lockdown', 'Containment Breach', 'Stun Turret', 'Electrified Floor'],
  4: ['Full Alarm', 'Alien Loose', 'Facility Collapse Sequence', 'Emergency Bulkhead']
};

const HAZARD_PASS = [
  (n, pr, hz) => `${n} navigates past the ${hz} without triggering it. Smooth.`,
  (n, pr, hz) => `The ${hz} activates, but ${n} was already past it. Perfect timing.`,
  (n, pr, hz) => `${n} spots the ${hz} and finds a way around it. No alarm. No damage.`,
  (n, pr, hz) => `${n} reads the ${hz} pattern and slips through the gap. Not even close.`,
  (n, pr, hz) => `The ${hz} hums ominously. ${n} holds ${pr.posAdj} breath, steps through, and nothing happens. Skill or luck? Doesn't matter.`,
  (n, pr, hz) => `${n} times the ${hz} cycle and darts past. ${pr.Sub} makes it look easy.`,
  (n, pr, hz) => `${n} disables the ${hz} with a well-placed throw. Resourceful.`,
  (n, pr, hz) => `The ${hz} charges up. ${n} was already three steps past it. Too fast.`,
  (n, pr, hz) => `${n} goes prone and slides under the ${hz}. Textbook evasion.`,
  (n, pr, hz) => `The ${hz} cycles on. ${n} counts the interval: three seconds. ${pr.Sub} moves on the gap.`,
  (n, pr, hz) => `${n} vaults over the ${hz} deployment mechanism. The sensors never register ${pr.obj}.`,
  (n, pr, hz) => `${n} spots the ${hz} emitter and takes a parallel corridor. The long way, but the safe way.`,
];

const HAZARD_FAIL = [
  (n, pr, hz) => `The ${hz} catches ${n} square in the chest. ${pr.Sub} stumbles back, gasping.`,
  (n, pr, hz) => `${n} trips the ${hz}. The impact knocks ${pr.obj} sideways. That's going to cost ${pr.obj}.`,
  (n, pr, hz) => `The ${hz} fires and ${n} doesn't dodge fast enough. ${pr.Sub} takes the full hit.`,
  (n, pr, hz) => `${n} misjudges the ${hz}. Bad call. ${pr.Sub} goes down hard, then drags ${pr.ref} back up.`,
  (n, pr, hz) => `The ${hz} catches ${n} off guard. ${pr.Sub} hits the wall and slides down. Still conscious. Barely.`,
  (n, pr, hz) => `The ${hz} detonates at ${n}'s feet. ${pr.Sub} is thrown sideways into the wall. Still moving. Barely.`,
  (n, pr, hz) => `${n} triggers the ${hz}. The blast catches ${pr.posAdj} left side. ${pr.Sub} keeps going, limping.`,
  (n, pr, hz) => `The ${hz} pins ${n} against the corridor wall. It takes ${pr.obj} ten seconds to break free. An eternity in here.`,
  (n, pr, hz) => `${n} walks straight into the ${hz}. Didn't see it. Didn't hear it. Felt it though.`,
  (n, pr, hz) => `The ${hz} catches ${n} mid-stride. ${pr.Sub} hits the deck hard. Gets up slower.`,
];

const SPECIMEN_FOUND = [
  (n, pr, temp, score) => `${n} opens the containment pod and finds ${aAn(temp)} ${temp} specimen inside. Estimated value: ${score} points.`,
  (n, pr, temp, score) => `${aAn(temp).charAt(0).toUpperCase() + aAn(temp).slice(1)} ${temp} alien specimen. ${n} stares at it through the glass. Worth ${score} points — if ${pr.sub} can get it out.`,
  (n, pr, temp, score) => `${n} discovers a containment unit with ${aAn(temp)} ${temp} specimen. ${score} points. The question is whether to keep pushing.`,
  (n, pr, temp, score) => `The containment pod hisses open. Inside: ${aAn(temp)} ${temp} specimen, glowing faintly. ${score} points on the board.`,
  (n, pr, temp, score) => `${n} cracks the seal on a specimen pod. ${temp}, ${score} points. ${pr.Sub} secures it carefully.`,
  (n, pr, temp, score) => `${aAn(temp).charAt(0).toUpperCase() + aAn(temp).slice(1)} ${temp} specimen — ${score} points. ${n} eyes it carefully. ${temp === 'aggressive' ? `It eyes ${pr.obj} back.` : `It barely reacts.`}`,
];

const SPECIMEN_UPGRADE = [
  (n, pr, oldT, newT, newS) => `${n} finds something better — ${aAn(newT)} ${newT} specimen worth ${newS} points. ${pr.Sub} drops the ${oldT} one without hesitation.`,
  (n, pr, oldT, newT, newS) => `"Upgrade." ${n} swaps ${pr.posAdj} ${oldT} specimen for ${aAn(newT)} ${newT} one. ${newS} points. Risky, but worth it.`,
  (n, pr, oldT, newT, newS) => `${n} trades up. The ${oldT} specimen goes back in the pod. The ${newT} one — ${newS} points — comes with ${pr.obj}.`,
  (n, pr, oldT, newT, newS) => `${aAn(newT).charAt(0).toUpperCase() + aAn(newT).slice(1)} ${newT} specimen, ${newS} points. ${n} makes the swap from ${pr.posAdj} ${oldT} without thinking twice.`,
];

const ADVANCE_DECISION = [
  (n, pr) => `${n} looks at the door to the next room. Deeper. More dangerous. More valuable. ${pr.Sub} goes in.`,
  (n, pr) => `${n} doesn't hesitate. Forward. Always forward.`,
  (n, pr) => `"One more room." ${n} pushes deeper into the facility.`,
  (n, pr) => `${n} checks ${pr.posAdj} HP, checks the door, and keeps going. Bold move.`,
];

const SECURE_DECISION = [
  (n, pr) => `${n} looks at what ${pr.sub} has and decides: enough. Time to get out alive.`,
  (n, pr) => `"I'm not pushing my luck." ${n} turns around and heads for extraction.`,
  (n, pr) => `${n} secures ${pr.posAdj} specimen and starts the long walk back. Smart play.`,
  (n, pr) => `${n} decides ${pr.posAdj} haul is good enough. No sense dying for a few more points.`,
];

const KO_TEXT = [
  (n, pr) => `${n} hits the floor. HP zero. Everything goes dark. ${pr.posAdj} specimens scatter across the corridor. All of them — gone.`,
  (n, pr) => `${n} collapses. The facility's hazards finally caught up to ${pr.obj}. Score: zero. Everything lost.`,
  (n, pr) => `It's over for ${n}. HP depleted. ${pr.Sub} lies motionless in the corridor as ${pr.posAdj} specimens crawl away.`,
  (n, pr) => `${n} pushed too deep. The last hazard was one too many. ${pr.Sub}'s out. Zero points.`,
  (n, pr) => `${n} goes down hard. The medics will find ${pr.obj} later. The specimens won't wait.`,
];

const NO_SPECIMEN_TEXT = [
  (n, pr) => `${n} searches the room but finds nothing. Empty containment pods. Bad luck.`,
  (n, pr) => `Nothing here. ${n} kicks an empty pod in frustration.`,
  (n, pr) => `The room's been cleaned out. ${n} finds nothing but dust and broken glass.`,
  (n, pr) => `${n} checks every pod in the room. All empty. ${pr.Sub} wasted time.`,
];

// ── EXTRACTION PHASE ──
const EXTRACT_HAZARD_PASS = [
  (n, pr, hz) => `${n} sprints past the ${hz} on the way out. ${pr.PosAdj} specimen stays secure.`,
  (n, pr, hz) => `The ${hz} fires again, but ${n} knows the pattern now. ${pr.Sub} dodges cleanly.`,
  (n, pr, hz) => `${n} ducks under the ${hz}. The specimen tucked tight against ${pr.posAdj} chest doesn't even shift.`,
  (n, pr, hz) => `The ${hz} activates as ${n} passes. Too slow. ${pr.Sub}'s already through.`,
  (n, pr, hz) => `${n} rolls under the ${hz} blast radius. Clean dodge. The specimen barely shifts in ${pr.posAdj} arms.`,
  (n, pr, hz) => `${n} spots the ${hz} pattern from the way in. This time, ${pr.sub} knows exactly when to move.`,
  (n, pr, hz) => `The ${hz} charges. ${n} is already past it. ${pr.Sub} learned the timing on the way in.`,
  (n, pr, hz) => `${n} sidesteps the ${hz} like it's standing still. Extraction mode: engaged.`,
  (n, pr, hz) => `${n} vaults the ${hz} deployment zone without breaking stride. The specimen stays locked against ${pr.posAdj} chest.`,
  (n, pr, hz) => `The ${hz} triggers behind ${n}. A second too late. ${pr.Sub}'s already in the next corridor.`,
];

const EXTRACT_HAZARD_FAIL = [
  (n, pr, hz) => `The ${hz} catches ${n} on the way out. ${pr.Sub} stumbles, clutching ${pr.posAdj} specimen.`,
  (n, pr, hz) => `${n} takes a hit from the ${hz}. The impact jars ${pr.posAdj} grip on the specimen.`,
  (n, pr, hz) => `The ${hz} clips ${n} hard. ${pr.Sub} slams into the wall. The specimen case cracks but holds.`,
  (n, pr, hz) => `${n} doesn't see the ${hz} in time. The hit sends ${pr.obj} spinning. The specimen almost slips free.`,
  (n, pr, hz) => `The ${hz} detonates right as ${n} passes. The blast throws ${pr.obj} three feet sideways. The specimen screams.`,
  (n, pr, hz) => `${n} catches the full force of the ${hz}. ${pr.Sub} crumples, then forces ${pr.ref} back up. The specimen writhes.`,
  (n, pr, hz) => `The ${hz} nails ${n} in the back. ${pr.Sub} goes down face-first. The specimen case bounces off the floor.`,
  (n, pr, hz) => `${n} rounds the corner into the ${hz}. No time to dodge. The hit rattles ${pr.posAdj} whole body. And the specimen's.`,
  (n, pr, hz) => `The ${hz} catches ${n}'s legs. ${pr.Sub} hits the ground hard, curling around the specimen to protect it.`,
  (n, pr, hz) => `${n} knew the ${hz} was there from the way in. Knowing doesn't help when you're exhausted. ${pr.Sub} takes it clean.`,
];

const SPECIMEN_ESCAPE = [
  (n, pr, temp) => `The ${temp} specimen thrashes free from ${n}'s grip and bolts into the corridor. Gone. All points — gone.`,
  (n, pr, temp) => `${n}'s ${temp} specimen breaks containment during the chaos. It screeches and disappears into the vents. Score zeroed.`,
  (n, pr, temp) => `The impact jars the ${temp} specimen loose. It hisses at ${n} and crawls away into the darkness. ${pr.Sub} watches ${pr.posAdj} score vanish.`,
  (n, pr, temp) => `The ${temp} specimen takes its chance. It wriggles free and vanishes. ${n} stands there, empty-handed.`,
];

const SPECIMEN_HELD = [
  (n, pr, temp) => `${n} tightens ${pr.posAdj} grip. The ${temp} specimen stays put. Close call.`,
  (n, pr, temp) => `The ${temp} specimen shifts but ${n} holds firm. Not losing this one.`,
  (n, pr, temp) => `${n} takes the hit but the ${temp} specimen doesn't budge. ${pr.Sub}'s not letting go.`,
  (n, pr, temp) => `The ${temp} specimen tries to escape. ${n} says no. Grip like iron.`,
  (n, pr, temp) => `The ${temp} specimen lunges. ${n} catches it mid-escape and slams the containment case shut. "No you don't."`,
  (n, pr, temp) => `${n} wraps both arms around the ${temp} specimen. It thrashes. ${pr.Sub} holds. Willpower wins.`,
  (n, pr, temp) => `The impact nearly shakes the ${temp} specimen free. ${n} catches it at the last second. Fingertips only.`,
  (n, pr, temp) => `The ${temp} specimen hisses and claws at ${n}. ${pr.Sub} doesn't flinch. Those points aren't going anywhere.`,
  (n, pr, temp) => `${n} feels the ${temp} specimen slipping. ${pr.Sub} adjusts ${pr.posAdj} grip and locks it down. Not today.`,
  (n, pr, temp) => `The case buckles from the impact. The ${temp} specimen pushes against the seal. ${n} holds it shut with everything ${pr.sub} has.`,
];

// ── SOCIAL EVENTS ──
const SOCIAL_HELP = [
  (a, b) => `${a} spots ${b} ahead and signals: hazard on the left. ${b} adjusts. "Thanks." A small nod between operators.`,
  (a, b) => `${a} pulls ${b} behind a support beam just before the turret fires. "Owe you one." ${b} means it.`,
  (a, b) => `${a} shares ${pronouns(a).posAdj} hazard intel with ${b}. The corridor ahead just got a lot safer.`,
  (a, b) => `"Third room — laser grid on the right wall. Don't touch the floor panel." ${a} gives ${b} the heads-up.`,
  (a, b) => `${a} leaves a marker on the wall for ${b}: safe path this way. ${b} follows it through without a scratch.`,
];

const SOCIAL_SABOTAGE = [
  (a, b) => `${a} trips the alarm near ${b}'s position. The hazards spike. ${b} has no idea who did it.`,
  (a, b) => `${a} "accidentally" knocks a canister into ${b}'s path. The gas forces ${b} to take a longer route.`,
  (a, b) => `${a} locks a door behind ${b}, forcing ${b} through a hazard zone. Cold-blooded.`,
  (a, b) => `${a} reroutes the security system to target ${b}'s corridor. The lights go red. ${b} pays the price.`,
  (a, b) => `${a} sets off a containment breach in ${b}'s sector. "Oops." The smirk says everything.`,
];

const SOCIAL_STEAL = [
  (a, b) => `${a} snatches ${b}'s specimen while ${b} is stunned by a hazard. Gone before ${b} can react. "Survival of the fittest."`,
  (a, b) => `${b} drops ${pronouns(b).posAdj} specimen after a hazard hit. ${a} picks it up. "Finders keepers." ${b} stares in disbelief.`,
  (a, b) => `${a} pries the specimen case from ${b}'s weakened grip. "Nothing personal." Everything about it is personal.`,
  (a, b) => `While ${b} reels from the impact, ${a} smoothly lifts the specimen. By the time ${b} notices, ${a} is two rooms away.`,
];

const SOCIAL_GUARD = [
  (a, b) => `${a} steps in front of ${b} and takes the hazard hit. ${b}'s specimen is safe. ${a}'s HP isn't.`,
  (a, b) => `${a} shoves ${b} out of the way and absorbs the blast. "Go! I'll be fine!" ${a} does not look fine.`,
  (a, b) => `${a} blocks the corridor with ${pronouns(a).posAdj} own body. The hazard hits ${a} instead of ${b}. ${b}'s specimen survives.`,
  (a, b) => `${a} sees the turret lock onto ${b} and throws ${pronouns(a).ref} in the line of fire. The hit lands on ${a}. ${b} is untouched.`,
];

const SOCIAL_ENCOURAGE = [
  (a, b) => `"You're almost out. Don't stop." ${a} catches up to ${b} and matches ${pronouns(b).posAdj} pace. The presence helps.`,
  (a, b) => `${a} puts a hand on ${b}'s shoulder. "I've seen you take worse than this. Keep going." ${b} does.`,
  (a, b) => `"Focus. Breathe. Move." ${a} talks ${b} through the next corridor. ${b}'s composure returns.`,
  (a, b) => `${a} starts counting steps for ${b}. "Ten more. Nine. Eight." It works. ${b} makes it through.`,
];

// ── CONFESSIONALS ──
const CONFESSIONAL_DEEP_PUSH = [
  (n, pr, depth) => `[Confessional] ${n}: "Room ${depth}. I don't know why I keep going deeper. Something in there is calling to me."`,
  (n, pr, depth) => `[Confessional] ${n}: "Everyone else stopped. I didn't. Room ${depth}. Let's see what's in here."`,
  (n, pr, depth) => `[Confessional] ${n}: "The smart play is to turn around. I'm not smart. Room ${depth}."`,
  (n, pr, depth) => `[Confessional] ${n}: "Am I scared? Yes. Am I going into Room ${depth} anyway? Also yes."`,
  (n, pr, depth) => `[Confessional] ${n}: "I can hear something moving in Room ${depth}. Good. That means there's something worth finding."`,
  (n, pr, depth) => `[Confessional] ${n}: "Room ${depth}. My gut says stop. My brain says one more. Guess which one wins?"`,
  (n, pr, depth) => `[Confessional] ${n}: "They built this place to keep people OUT. And here I am, walking deeper. What does that say about me?"`,
  (n, pr, depth) => `[Confessional] ${n}: "The lights stopped working two rooms ago. Room ${depth}. I'm navigating by instinct now."`,
  (n, pr, depth) => `[Confessional] ${n}: "I passed a sign that said 'AUTHORIZED PERSONNEL ONLY.' I am decidedly NOT authorized. Room ${depth} anyway."`,
  (n, pr, depth) => `[Confessional] ${n}: "Every room gets darker. Quieter. More wrong. Room ${depth}. I love it."`,
];

const CONFESSIONAL_SECURE = [
  (n, pr) => `[Confessional] ${n}: "I got what I need. Time to go home with it."`,
  (n, pr) => `[Confessional] ${n}: "Know when to fold. That's how you win this game."`,
  (n, pr) => `[Confessional] ${n}: "I'd rather have five points than zero. Let the daredevils push deeper."`,
  (n, pr) => `[Confessional] ${n}: "I'm walking out of here with my specimen and my dignity. Both intact."`,
  (n, pr) => `[Confessional] ${n}: "I've been in enough danger for one lifetime. Securing what I have."`,
  (n, pr) => `[Confessional] ${n}: "Call it conservative. Call it smart. I'm calling it 'not dying today.'"`,
  (n, pr) => `[Confessional] ${n}: "I can hear the others pushing deeper. I can also hear screaming. I'm out."`,
  (n, pr) => `[Confessional] ${n}: "My body is telling me to stop. For once, I'm listening."`,
  (n, pr) => `[Confessional] ${n}: "I looked at the next door. Something looked back. I'm securing."`,
  (n, pr) => `[Confessional] ${n}: "The people who push to Room 4? Heroes. The people who walk out with points? Winners. I want to be a winner."`,
];

const CONFESSIONAL_KO = [
  (n, pr) => `[Confessional] ${n}: "I got greedy. That's all there is to it."`,
  (n, pr) => `[Confessional] ${n}: "I can't feel my legs and I lost everything. Great day."`,
  (n, pr) => `[Confessional] ${n}: "Next time? There won't be a next time. I'm done."`,
  (n, pr) => `[Confessional] ${n}: "Zero points. ZERO. I had a rare alien and I lost it to a stun turret."`,
  (n, pr) => `[Confessional] ${n}: "I was doing so well. And then everything went wrong in about two seconds."`,
  (n, pr) => `[Confessional] ${n}: "They'll find me eventually. Probably. I hope."`,
  (n, pr) => `[Confessional] ${n}: "I had a plan. The plan did not survive contact with reality."`,
  (n, pr) => `[Confessional] ${n}: "My teammates are going to be furious. Actually — I'm furious with myself."`,
  (n, pr) => `[Confessional] ${n}: "Note to self: when the building starts shaking, that's a sign to LEAVE."`,
  (n, pr) => `[Confessional] ${n}: "I woke up in the medic tent. Apparently I was out for twenty minutes. Fun."`,
];

const CONFESSIONAL_AGGRESSIVE_EXTRACT = [
  (n, pr) => `[Confessional] ${n}: "I'm carrying an aggressive alien through a gauntlet. This is the worst idea I've ever had."`,
  (n, pr) => `[Confessional] ${n}: "It bit me twice on the way out. Worth it? Ask me after the scores."`,
  (n, pr) => `[Confessional] ${n}: "Every room, it tried to escape. Every room, I held on tighter."`,
  (n, pr) => `[Confessional] ${n}: "This thing hates me. The feeling is mutual. But I need those points."`,
];

// ── HOST COMMENTARY ──
const HOST_ENTRY = [
  () => `${host()} watches the monitors. "And we have breach. Let the hunt begin."`,
  () => `"They're in. Now the fun starts." ${host()} leans back in the command chair.`,
  () => `${host()} presses the intercom: "Welcome to Hangar Black. Don't touch anything. Or do. We have cameras."`,
  () => `"Perimeter breached. I love it when they think they're being sneaky." ${host()} grins.`,
  () => `${host()} checks the security feeds. "All operators inside. Release the specimens."`,
  () => `"You know what makes this facility special? Everything in it wants to kill you." ${host()} is helpful as always.`,
];

const HOST_HUNT = [
  () => `${host()} watches the depth meters. "They're going deeper. This is where it gets interesting."`,
  () => `"Fun fact: Room 4 hasn't been opened since the last... incident." ${host()} trails off.`,
  () => `"The specimens get feistier the deeper you go. That's not a warning. That's a promise." ${host()} smiles.`,
  () => `${host()} presses a button. Nothing happens. "Just checking. Carry on."`,
  () => `"Remember: the alien doesn't have to like you. It just has to come with you." ${host()} shrugs.`,
  () => `${host()} leans into the mic: "Attention operators. The facility's auto-defense system has been... partially disabled. Emphasis on partially."`,
];

const HOST_EXTRACT = [
  () => `${host()} watches the extraction feeds. "Now carry it back through all the stuff that almost killed you the first time."`,
  () => `"Extraction phase! The easy part." ${host()} winks. "I'm kidding. Nothing about this is easy."`,
  () => `"Some of those specimens do NOT like being carried." ${host()} glances at the containment breach sensor.`,
  () => `${host()} presses the alarm button. "Just keeping them on their toes."`,
  () => `"The path out is the same path in. Except now everything's on high alert. And you're carrying an alien." ${host()} loves this.`,
  () => `"Remember the rule: if your specimen escapes, your score is zero. Motivation!" ${host()} does jazz hands.`,
];

// ── FACILITY COMMS (atmospheric flavor between hunt runs) ──
const FACILITY_COMMS = [
  () => `[FACILITY PA] "Containment breach detected in Sector 7. All personnel to safe rooms."`,
  () => `[FACILITY PA] "Specimen transport corridor B is offline. Rerouting."`,
  () => `[COMMS] Static. Then breathing. Then nothing.`,
  () => `[FACILITY PA] "Reminder: unauthorized personnel will be neutralized. Have a nice day."`,
  () => `[COMMS] "Command, I'm seeing movement in the east wing. Can you confirm?" No response.`,
  () => `[FACILITY PA] "Power fluctuation in Sub-Level 3. Emergency lighting engaged."`,
  () => `[COMMS] "Who turned off the cameras in Sector 12?" Silence.`,
  () => `[FACILITY PA] "Attention: the self-destruct sequence has NOT been activated. Repeat: NOT activated. Probably."`,
  () => `[COMMS] Something scrapes against metal. A low growl. Then the channel cuts out.`,
  () => `[FACILITY PA] "Bio-hazard sensors are reading nominal. Bio-hazard sensors are also thirty years old."`,
  () => `[COMMS] "Did anyone else hear that?" No one responds. The channel stays open.`,
  () => `[FACILITY PA] "Security sweep in progress. Areas 51 through 54. Estimated duration: unknown."`,
  () => `[COMMS] Footsteps. Running. Getting faster. Then a door slams. Silence.`,
  () => `[FACILITY PA] "The ventilation system is functioning at 40% capacity. Air quality is... acceptable."`,
  () => `[COMMS] "Whatever's in Room 4... I don't think it's in a containment pod anymore."`,
  () => `[FACILITY PA] "All exits are sealed for your protection. We apologize for the inconvenience."`,
];

const DEPTH_SHIFT_FLAVOR = {
  shallow: [
    'The fluorescent lights buzz overhead. Green-tier. The easy part.',
    'Entry-level corridors. Scuffed floors. Old coffee stains. This part of the facility feels almost normal.',
    'Security cameras track movement, red LEDs blinking steadily. Still on the grid.',
    'The air conditioning hums. Climate-controlled. Civilized. It won\'t last.',
  ],
  mid: [
    'The lighting shifts to amber. Warning territory. The facility knows they\'re here.',
    'Reinforced doors. Blast shields. Whatever they were keeping behind these walls, they didn\'t want it getting out.',
    'The air tastes different down here. Sharper. Chemical.',
    'Emergency protocols engage. The facility\'s automated defenses are waking up.',
  ],
  deep: [
    'Red emergency lighting. The walls vibrate with subsonic frequencies. Deep territory.',
    'The floor is warm. Not from heating — from something underneath. Something alive.',
    'Every surface is scorched. Battle damage. Something fought its way through here.',
    'The facility\'s builders didn\'t intend for anyone to come this far. The architecture says so.',
  ],
};

// ── ROOM DESCRIPTIONS ──
const ROOM_DESC = {
  1: [
    'A dimly lit entry corridor. Flickering fluorescent lights. Equipment crates stacked against the walls.',
    'Storage bay. Rows of unmarked containers. The hum of ventilation. Green tier — relatively safe.',
    'The outer ring of the facility. Clean floors, low ceilings. Motion sensors blink lazily.',
    'Receiving dock. Forklifts abandoned mid-load. The air smells like ozone and industrial cleaner.',
    'Utility corridor. Pipes run along the ceiling. Steam hisses from a cracked valve somewhere ahead.',
    'The entry checkpoint. Overturned furniture. Someone left in a hurry. The coffee is still warm.',
    'Loading bay alpha. Crates marked with symbols you don\'t recognize. Overhead lights buzz and flicker.',
    'A long, sterile hallway. Scuff marks on the floor. Drag marks. Something was moved through here.',
  ],
  2: [
    'The labs. Glass walls reveal empty operating tables. Something was here recently.',
    'A narrow corridor of reinforced glass. Behind it: containment units. Some cracked. Some empty.',
    'The research wing. Whiteboards covered in equations. Warning labels in languages that don\'t exist.',
    'Specimen processing. Surgical tools scattered on trays. The lights pulse amber.',
    'Observation gallery. One-way mirrors line both walls. You can\'t tell which side you\'re on.',
    'A decontamination chamber. The chemical smell burns your nostrils. The UV lights are still cycling.',
    'Archive room. Filing cabinets torn open. Papers scattered. Someone was looking for something specific.',
    'Bio-monitoring lab. Heart rate graphs still running on screens. The subjects are gone. The data isn\'t.',
  ],
  3: [
    'Deep containment. Red emergency lighting. Steel doors with blast marks. Something got out once.',
    'The secure wing. Every surface is scorched. The air is thick. Something is breathing behind the walls.',
    'Classified sector. Every camera is smashed. The only light comes from flickering containment pods.',
    'High-security vault. Three blast doors. Each one more damaged than the last. Whatever was in here fought hard.',
    'Restricted biolab. Cracked containment tubes. The fluid inside has crystallized. The specimens inside haven\'t.',
    'Emergency bunker level. Blast-proof walls. Air recyclers humming. Built to survive something catastrophic.',
    'The isolation wing. Sound-dampening walls. Your footsteps disappear. So does your nerve.',
    'Testing chamber. Scorch marks on the ceiling. Whatever was tested here, it worked. Once.',
  ],
  4: [
    'The deepest level. No lights. No cameras. Just the sound of something large moving in the darkness.',
    'Sub-basement. The maps don\'t show this level. The walls are organic. This isn\'t human construction.',
    'The bottom. Temperature drops twenty degrees. The containment pods here are massive. One is open.',
    'Level Zero. Even the facility\'s builders didn\'t know this existed. The hum is deafening.',
    'The source. The walls pulse. The air tastes metallic. This room was here before the facility was built.',
    'Excavation site. The facility was built around THIS room. Ancient. Alien. Active.',
    'The core. Every sensor in the building points here. The temperature fluctuates wildly. Something is alive down here.',
    'A cavern. Natural rock gives way to something biomechanical. The facility didn\'t build this. Something else did.',
  ]
};

// ── TRIBE CAPTAIN ENTRY ──
const CAPTAIN_PICKS = [
  (cap, method, tribe) => `${cap} makes the call for ${tribe}: ${method}. No hesitation.`,
  (cap, method, tribe) => `"We're going ${method}." ${cap} doesn't ask for input. ${tribe} follows.`,
  (cap, method, tribe) => `${cap} studies the facility blueprints and chooses ${method} for ${tribe}.`,
  (cap, method, tribe) => `${tribe}'s captain ${cap} locks in the approach: ${method}.`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════

// Specimen generation for a given room depth
function _generateSpecimen(depth) {
  // Deeper rooms = better specimens
  const roll = Math.random();
  let temperament, score;

  if (depth <= 1) {
    // Room 1: mostly docile
    if (roll < 0.50) { temperament = 'docile'; score = 3 + Math.floor(Math.random() * 4); }       // 3-6
    else if (roll < 0.85) { temperament = 'skittish'; score = 6 + Math.floor(Math.random() * 3); } // 6-8
    else { temperament = 'aggressive'; score = 8 + Math.floor(Math.random() * 3); }                 // 8-10
  } else if (depth === 2) {
    // Room 2: mixed
    if (roll < 0.30) { temperament = 'docile'; score = 4 + Math.floor(Math.random() * 3); }        // 4-6
    else if (roll < 0.70) { temperament = 'skittish'; score = 6 + Math.floor(Math.random() * 5); }  // 6-10
    else { temperament = 'aggressive'; score = 10 + Math.floor(Math.random() * 3); }                // 10-12
  } else if (depth === 3) {
    // Room 3: aggressive favored
    if (roll < 0.15) { temperament = 'docile'; score = 5 + Math.floor(Math.random() * 2); }        // 5-6
    else if (roll < 0.50) { temperament = 'skittish'; score = 7 + Math.floor(Math.random() * 4); }  // 7-10
    else { temperament = 'aggressive'; score = 10 + Math.floor(Math.random() * 5); }                // 10-14
  } else {
    // Room 4: rare / aggressive heavy
    if (roll < 0.10) { temperament = 'docile'; score = 6; }
    else if (roll < 0.35) { temperament = 'skittish'; score = 9 + Math.floor(Math.random() * 4); }  // 9-12
    else { temperament = 'aggressive'; score = 12 + Math.floor(Math.random() * 7); }                // 12-18
  }
  return { temperament, score };
}

// Hazard difficulty per room depth
function _hazardDifficulty(depth, alarmActive) {
  const base = [0.0, 0.1, 0.35, 0.55, 0.75][depth] || 0.5;
  return base + (alarmActive ? 0.15 : 0);
}

// Entry method stat-based choice for individuals (post-merge)
function _pickEntryMethod(name) {
  const s = pStats(name);
  const a = arch(name);
  // Weight each method by relevant stats + noise
  const ventScore  = s.physical * 0.12 + s.strategic * 0.06 + noise(2.5);
  const fenceScore = s.strategic * 0.12 + s.mental * 0.08 + noise(2.5);
  const bluffScore = s.social * 0.14 + s.boldness * 0.08 + noise(2.5);
  // Archetype nudges
  const scores = { vent: ventScore, fence: fenceScore, bluff: bluffScore };
  if (a === 'challenge-beast' || a === 'hothead') scores.vent += 0.8;
  if (a === 'mastermind' || a === 'perceptive-player') scores.fence += 0.8;
  if (a === 'social-butterfly' || a === 'schemer') scores.bluff += 0.8;
  if (a === 'wildcard' || a === 'chaos-agent') scores.bluff += 0.5;

  const best = Object.entries(scores).sort(([,a],[,b]) => b - a)[0][0];
  return best;
}

// Captain pick for tribe entry (pre-merge)
function _pickCaptainEntryMethod(captain) {
  const s = pStats(captain);
  const a = arch(captain);
  // Captain biases the tribe decision
  const ventScore  = s.physical * 0.1 + s.strategic * 0.05 + noise(2.5);
  const fenceScore = s.strategic * 0.12 + s.mental * 0.06 + noise(2.5);
  const bluffScore = s.social * 0.12 + s.boldness * 0.1 + noise(2.5);
  if (VILLAIN_ARCHS.has(a) || a === 'chaos-agent') bluffScore + 1.0;
  const scores = { vent: ventScore, fence: fenceScore, bluff: bluffScore };
  return Object.entries(scores).sort(([,a],[,b]) => b - a)[0][0];
}

// Decide whether to advance or secure
function _shouldAdvance(name, currentDepth, currentHP, hasSpecimen) {
  const s = pStats(name);
  const a = arch(name);
  const pr = pronouns(name);

  // Base push score: bold players push, strategic players read odds
  let pushScore = s.boldness * 0.15 + noise(2.5);

  // Strategic risk assessment: lower HP = less push
  const hpFraction = currentHP / 100;
  pushScore += (hpFraction - 0.5) * 2; // +1 at full, -1 at empty

  // Depth penalty: deeper = scarier
  pushScore -= currentDepth * 0.4;

  // Specimen hedge: if you already have something, risk is higher
  if (hasSpecimen) pushScore -= 0.5;

  // Archetype modifiers
  if (a === 'challenge-beast') pushScore += 1.0;
  if (a === 'floater' || a === 'goat') pushScore -= 1.2;
  if (a === 'wildcard' || a === 'chaos-agent') pushScore += noise(1.5); // pure chaos
  if (a === 'hero') pushScore += 0.3;
  if (a === 'underdog') pushScore += 0.5; // has to prove something

  return pushScore > 0;
}

export function simulateHangarBlack(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  // Shared state
  const hp = {};          // per-player HP (0-100)
  const alarmActive = { value: false }; // global alarm if bluff fails
  const entries = [];
  const huntRuns = [];
  const extractions = [];
  const allSocialEvents = [];
  const scores = {};

  active.forEach(n => { hp[n] = 100; scores[n] = 0; });

  // ══════════════════════════════════════════════════════
  // BOTH PHASES share the same core logic
  // Only difference: grouping (tribe vs individual), immunity assignment, and social event density
  // ══════════════════════════════════════════════════════

  const isMerged = gs.isMerged;
  let campKey, tribeData;

  if (!isMerged) {
    // PRE-MERGE: tribe-based
    tribeData = gs.tribes.map(t => ({
      tribeName: t.name,
      members: t.members.filter(m => active.includes(m))
    }));
    tribeData.forEach(t => {
      if (!ep.campEvents[t.tribeName]) ep.campEvents[t.tribeName] = { pre: [], post: [] };
    });
  } else {
    // POST-MERGE: individual
    campKey = gs.mergeName || 'merge';
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  }

  // ══ PHASE 1: ENTRY ══
  if (!isMerged) {
    // Pre-merge: captain picks method for tribe
    tribeData.forEach(td => {
      // Pick captain (highest strategic + boldness)
      const captain = td.members.slice().sort((a, b) => {
        const sa = pStats(a), sb = pStats(b);
        return (sb.strategic * 0.6 + sb.boldness * 0.4 + noise(1.5)) - (sa.strategic * 0.6 + sa.boldness * 0.4 + noise(1.5));
      })[0];
      if (!captain) return;

      const method = _pickCaptainEntryMethod(captain);
      const methodLabel = method === 'vent' ? 'Vent Crawl' : method === 'fence' ? 'Fence Cut' : 'Guard Bluff';

      // Stat check for the method
      td.members.forEach(name => {
        const s = pStats(name);
        const pr = pronouns(name);
        let statCheck, passed, hpCost, narrative;

        if (method === 'vent') {
          statCheck = s.physical * 0.1 + s.strategic * 0.04 + noise(2.5);
          passed = statCheck > 0.3;
          hpCost = 5;
          hp[name] -= hpCost;
          narrative = passed ? pick(ENTRY_VENT_PASS)(name, pr) : pick(ENTRY_VENT_FAIL)(name, pr);
          if (!passed) { hp[name] -= 5; hpCost += 5; }
        } else if (method === 'fence') {
          statCheck = s.strategic * 0.1 + s.mental * 0.06 + noise(2.5);
          passed = statCheck > 0.25;
          hpCost = 10;
          hp[name] -= hpCost;
          narrative = passed ? pick(ENTRY_FENCE_PASS)(name, pr) : pick(ENTRY_FENCE_FAIL)(name, pr);
          if (!passed) { hp[name] -= 5; hpCost += 5; }
        } else {
          // Bluff
          statCheck = s.social * 0.1 + s.boldness * 0.06 + noise(2.5);
          passed = statCheck > 0.5;
          if (passed) {
            hpCost = 0;
            narrative = pick(ENTRY_BLUFF_PASS)(name, pr);
          } else {
            hpCost = 20;
            hp[name] -= hpCost;
            alarmActive.value = true;
            narrative = pick(ENTRY_BLUFF_FAIL)(name, pr);
          }
        }
        hp[name] = clamp(hp[name], 0, 100);
        ep.chalMemberScores[name] += passed ? 2 : -1;

        entries.push({
          name, method, methodLabel, statCheck: Math.round(statCheck * 100) / 100,
          hpCost, passed, narrative, tribe: td.tribeName, captain: name === captain
        });
      });

      // Captain camp event
      ep.campEvents[td.tribeName].post.push({
        type: 'hangar-black-entry',
        text: pick(CAPTAIN_PICKS)(captain, methodLabel, td.tribeName),
        players: [captain],
        badgeText: 'Breach Captain', badgeClass: 'badge-info'
      });
    });
  } else {
    // Post-merge: individual method pick
    active.forEach(name => {
      const s = pStats(name);
      const pr = pronouns(name);
      const method = _pickEntryMethod(name);
      const methodLabel = method === 'vent' ? 'Vent Crawl' : method === 'fence' ? 'Fence Cut' : 'Guard Bluff';

      let statCheck, passed, hpCost, narrative;

      if (method === 'vent') {
        statCheck = s.physical * 0.1 + s.strategic * 0.04 + noise(2.5);
        passed = statCheck > 0.3;
        hpCost = 5;
        hp[name] -= hpCost;
        narrative = passed ? pick(ENTRY_VENT_PASS)(name, pr) : pick(ENTRY_VENT_FAIL)(name, pr);
        if (!passed) { hp[name] -= 5; hpCost += 5; }
      } else if (method === 'fence') {
        statCheck = s.strategic * 0.1 + s.mental * 0.06 + noise(2.5);
        passed = statCheck > 0.25;
        hpCost = 10;
        hp[name] -= hpCost;
        narrative = passed ? pick(ENTRY_FENCE_PASS)(name, pr) : pick(ENTRY_FENCE_FAIL)(name, pr);
        if (!passed) { hp[name] -= 5; hpCost += 5; }
      } else {
        statCheck = s.social * 0.1 + s.boldness * 0.06 + noise(2.5);
        passed = statCheck > 0.5;
        if (passed) {
          hpCost = 0;
          narrative = pick(ENTRY_BLUFF_PASS)(name, pr);
        } else {
          hpCost = 20;
          hp[name] -= hpCost;
          alarmActive.value = true;
          narrative = pick(ENTRY_BLUFF_FAIL)(name, pr);
        }
      }
      hp[name] = clamp(hp[name], 0, 100);
      ep.chalMemberScores[name] += passed ? 2 : -1;

      entries.push({
        name, method, methodLabel, statCheck: Math.round(statCheck * 100) / 100,
        hpCost, passed, narrative, tribe: null, captain: false
      });
    });
  }

  // ══ PHASE 2: HUNT (Push-Your-Luck) ══
  const huntSocialEvents = []; // social events that fire BETWEEN player runs

  // Shuffle player order for variety
  const huntOrder = [...active].sort(() => Math.random() - 0.5);

  huntOrder.forEach((name, playerIdx) => {
    if (hp[name] <= 0) {
      huntRuns.push({
        name, rooms: [], deepestRoom: 0, secured: false,
        specimenCarried: null, koRound: 0
      });
      return;
    }

    const s = pStats(name);
    const pr = pronouns(name);
    const rooms = [];
    let currentSpecimen = null;
    let depth = 0;
    let ko = false;

    const entryData = entries.find(e => e.name === name);
    const startDepth = (entryData?.method === 'vent' && entryData?.passed) ? 1 : 0;

    for (let roomIdx = startDepth; roomIdx < 4; roomIdx++) {
      depth = roomIdx + 1;
      const tier = depth;
      const hazardName = pick(HAZARD_NAMES[tier] || HAZARD_NAMES[4]);
      const difficulty = _hazardDifficulty(depth, alarmActive.value);

      const dodgeScore = s.physical * 0.06 + s.mental * 0.04 + s.strategic * 0.03 + noise(2.5);
      const passed = dodgeScore > difficulty;

      let hpLoss = 0;
      if (!passed) {
        hpLoss = 10 + tier * 7 + Math.floor(noise(5));
        hpLoss = Math.max(12, hpLoss);
        hp[name] -= hpLoss;
        hp[name] = clamp(hp[name], 0, 100);
      }

      let specimenFound = null;
      if (Math.random() < 0.75) {
        specimenFound = _generateSpecimen(depth);
      }

      const roomNarrative = passed
        ? pick(HAZARD_PASS)(name, pr, hazardName)
        : pick(HAZARD_FAIL)(name, pr, hazardName);

      let specimenNarrative = '';
      if (specimenFound) {
        if (!currentSpecimen || specimenFound.score > currentSpecimen.score) {
          if (currentSpecimen) {
            specimenNarrative = pick(SPECIMEN_UPGRADE)(name, pr, currentSpecimen.temperament, specimenFound.temperament, specimenFound.score);
          } else {
            specimenNarrative = pick(SPECIMEN_FOUND)(name, pr, specimenFound.temperament, specimenFound.score);
          }
          currentSpecimen = specimenFound;
        } else {
          specimenNarrative = `${name} finds ${aAn(specimenFound.temperament)} ${specimenFound.temperament} specimen worth ${specimenFound.score} points, but ${pr.posAdj} current catch is better. ${pr.Sub} leaves it.`;
        }
      } else {
        specimenNarrative = pick(NO_SPECIMEN_TEXT)(name, pr);
      }

      if (hp[name] <= 0) {
        ko = true;
        rooms.push({
          depth, tier, hazardType: hazardName, passed, hpLoss,
          specimenFound, decision: 'ko',
          narrative: roomNarrative, specimenNarrative,
          roomDesc: pick(ROOM_DESC[depth]),
          confessional: pick(CONFESSIONAL_KO)(name, pr)
        });
        currentSpecimen = null;
        ep.chalMemberScores[name] -= 5;
        popDelta(name, -1);

        const koKey = isMerged ? campKey : (entries.find(e => e.name === name)?.tribe || campKey);
        if (ep.campEvents[koKey]) {
          ep.campEvents[koKey].post.push({
            type: 'hangar-black-ko',
            text: `${name} was knocked out in the facility and lost all specimens`,
            players: [name],
            badgeText: 'KO\'d', badgeClass: 'badge-negative'
          });
        }
        break;
      }

      const advance = _shouldAdvance(name, depth, hp[name], !!currentSpecimen);
      const decision = (depth >= 4) ? 'secure' : (advance ? 'advance' : 'secure');

      let confessional = '';
      if (decision === 'advance' && depth >= 2) {
        confessional = pick(CONFESSIONAL_DEEP_PUSH)(name, pr, depth + 1);
      } else if (decision === 'secure') {
        confessional = pick(CONFESSIONAL_SECURE)(name, pr);
      }

      rooms.push({
        depth, tier, hazardType: hazardName, passed, hpLoss,
        specimenFound, decision,
        narrative: roomNarrative, specimenNarrative,
        roomDesc: pick(ROOM_DESC[depth]),
        confessional
      });

      ep.chalMemberScores[name] += passed ? 1.5 : 0.5;

      if (decision === 'secure') break;
    }

    if (depth >= 4 && !ko) {
      popDelta(name, 1);
    }

    if (depth >= 3 && currentSpecimen && !ko) {
      const pushKey = isMerged ? campKey : (entries.find(e => e.name === name)?.tribe || campKey);
      if (ep.campEvents[pushKey]) {
        ep.campEvents[pushKey].post.push({
          type: 'hangar-black-deep-push',
          text: `${name} pushed to Room ${depth} and captured ${aAn(currentSpecimen.temperament)} ${currentSpecimen.temperament} specimen worth ${currentSpecimen.score} points`,
          players: [name],
          badgeText: `Room ${depth}`, badgeClass: 'badge-positive'
        });
      }
    }

    huntRuns.push({
      name, rooms, deepestRoom: depth, secured: !ko && rooms.length > 0,
      specimenCarried: ko ? null : currentSpecimen,
      koRound: ko ? depth : null
    });

    // ── SOCIAL EVENTS between runs (every 2-3 players) ──
    if ((playerIdx + 1) % 2 === 0 || playerIdx === huntOrder.length - 1) {
      const finishedPlayers = huntRuns.filter(r => r.name).map(r => r.name);
      const stillInFacility = finishedPlayers.filter(n => {
        const run = huntRuns.find(r => r.name === n);
        return run && run.koRound === null && run.specimenCarried;
      });

      if (stillInFacility.length >= 2) {
        const eventCount = 1 + (Math.random() < 0.45 ? 1 : 0);
        for (let ei = 0; ei < eventCount; ei++) {
          const actor = pick(stillInFacility);
          const targets = stillInFacility.filter(n => n !== actor);
          if (targets.length === 0) break;
          const target = pick(targets);
          const actorArch = arch(actor);
          const bond = getBond(actor, target);

          let eventType = null, narrative = '', bondDelta = 0, hpEffect = 0, scoreEffect = 0;
          let stolenSpec = null;

          if (VILLAIN_ARCHS.has(actorArch) && bond < 2) {
            if (Math.random() < 0.4) {
              eventType = 'sabotage';
              narrative = pick(SOCIAL_SABOTAGE)(actor, target);
              bondDelta = -2;
              hpEffect = -10;
              scoreEffect = -2;
              popDelta(actor, -1);
            } else {
              const targetRun = huntRuns.find(r => r.name === target);
              if (targetRun?.specimenCarried) {
                eventType = 'steal';
                narrative = pick(SOCIAL_STEAL)(actor, target);
                bondDelta = -3;
                const actorRun = huntRuns.find(r => r.name === actor);
                stolenSpec = { ...targetRun.specimenCarried };
                if (actorRun) {
                  if (!actorRun.specimenCarried || stolenSpec.score > actorRun.specimenCarried.score) {
                    actorRun.specimenCarried = stolenSpec;
                  }
                  targetRun.specimenCarried = null;
                }
                scoreEffect = 3;
                ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) - 3;
                popDelta(actor, -1);
              } else {
                eventType = 'sabotage';
                narrative = pick(SOCIAL_SABOTAGE)(actor, target);
                bondDelta = -2;
                hpEffect = -10;
                scoreEffect = -2;
                popDelta(actor, -1);
              }
            }
          } else if (canScheme(actor) && !NICE_ARCHS.has(actorArch) && bond < 0) {
            eventType = 'sabotage';
            narrative = pick(SOCIAL_SABOTAGE)(actor, target);
            bondDelta = -2;
            hpEffect = -8;
            scoreEffect = -1;
            popDelta(actor, -1);
          } else if (NICE_ARCHS.has(actorArch) && (actorArch === 'hero' || actorArch === 'loyal-soldier')) {
            eventType = 'guard';
            narrative = pick(SOCIAL_GUARD)(actor, target);
            bondDelta = 2;
            hp[actor] -= 8;
            hp[actor] = clamp(hp[actor], 0, 100);
            ep.chalMemberScores[actor] = (ep.chalMemberScores[actor] || 0) + 2;
            popDelta(actor, 1);
          } else if (NICE_ARCHS.has(actorArch)) {
            eventType = 'encourage';
            narrative = pick(SOCIAL_ENCOURAGE)(actor, target);
            bondDelta = 1;
            ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 1;
          } else if (bond > 3) {
            eventType = 'help';
            narrative = pick(SOCIAL_HELP)(actor, target);
            bondDelta = 1;
            ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 1.5;
          } else {
            const helpChance = pStats(actor).social * 0.08 + noise(2);
            if (helpChance > 0.5) {
              eventType = 'help';
              narrative = pick(SOCIAL_HELP)(actor, target);
              bondDelta = 1;
              ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 1;
            } else {
              eventType = 'encourage';
              narrative = pick(SOCIAL_ENCOURAGE)(actor, target);
              bondDelta = 0.5;
            }
          }

          if (eventType) {
            addBond(actor, target, bondDelta);
            if (hpEffect) {
              hp[target] = clamp((hp[target] || 0) + hpEffect, 0, 100);
            }
            if (scoreEffect > 0) {
              ep.chalMemberScores[actor] = (ep.chalMemberScores[actor] || 0) + scoreEffect;
            }

            const socialEvt = { type: eventType, actor, target, narrative, bondDelta };
            if (eventType === 'steal' && stolenSpec) {
              socialEvt.stolenSpecimen = stolenSpec;
            }
            huntSocialEvents.push(socialEvt);
            allSocialEvents.push(socialEvt);

            const socialKey = isMerged ? campKey : (entries.find(e => e.name === actor)?.tribe || campKey);
            if (ep.campEvents[socialKey]) {
              const badgeMap = {
                help: { text: 'Intel Shared', cls: 'badge-positive' },
                sabotage: { text: 'Sabotage', cls: 'badge-negative' },
                steal: { text: 'Specimen Theft', cls: 'badge-negative' },
                guard: { text: 'Body Shield', cls: 'badge-positive' },
                encourage: { text: 'Morale Boost', cls: 'badge-info' }
              };
              const badge = badgeMap[eventType] || { text: eventType, cls: 'badge-info' };
              ep.campEvents[socialKey].post.push({
                type: `hangar-black-hunt-${eventType}`,
                text: narrative,
                players: [actor, target],
                badgeText: badge.text, badgeClass: badge.cls
              });
            }
          }
        }
      }
    }
  });

  // ══ PHASE 3: EXTRACTION ══
  const extractSocialEvents = [];
  const extractOrder = [...active].sort(() => Math.random() - 0.5);

  extractOrder.forEach((name, extIdx) => {
    const run = huntRuns.find(r => r.name === name);
    if (!run || run.koRound !== null || !run.specimenCarried) {
      scores[name] = 0;
      extractions.push({
        name, hazards: [], socialEvents: [],
        finalSpecimen: null, extractionMultiplier: 0
      });
      return;
    }

    const s = pStats(name);
    const pr = pronouns(name);
    const specimen = { ...run.specimenCarried, escaped: false };
    const hazards = [];
    let damaged = false;

    for (let roomIdx = run.deepestRoom; roomIdx >= 1; roomIdx--) {
      const hazardName = pick(HAZARD_NAMES[roomIdx] || HAZARD_NAMES[1]);
      const difficulty = _hazardDifficulty(roomIdx, alarmActive.value) + 0.1;

      const dodgeScore = s.physical * 0.06 + s.endurance * 0.04 + s.strategic * 0.02 + noise(2.5);
      const passed = dodgeScore > difficulty;

      let hpLoss = 0;
      let specimenEscaped = false;

      if (!passed) {
        hpLoss = 8 + roomIdx * 5 + Math.floor(noise(4));
        hpLoss = Math.max(8, hpLoss);
        hp[name] -= hpLoss;
        hp[name] = clamp(hp[name], 0, 100);
        damaged = true;

        const escapeChance = specimen.temperament === 'aggressive' ? 0.40
          : specimen.temperament === 'skittish' ? 0.25 : 0.05;

        if (Math.random() < escapeChance) {
          specimenEscaped = true;
          specimen.escaped = true;
        }
      }

      const narrative = passed
        ? pick(EXTRACT_HAZARD_PASS)(name, pr, hazardName)
        : pick(EXTRACT_HAZARD_FAIL)(name, pr, hazardName);

      let escapeNarrative = '';
      if (specimenEscaped) {
        escapeNarrative = pick(SPECIMEN_ESCAPE)(name, pr, specimen.temperament);
      } else if (!passed) {
        escapeNarrative = pick(SPECIMEN_HELD)(name, pr, specimen.temperament);
      }

      hazards.push({
        room: roomIdx, passed, specimenEscaped, hpLoss,
        narrative, escapeNarrative, hazardType: hazardName
      });

      if (specimenEscaped) break;

      if (hp[name] <= 0) {
        specimen.escaped = true;
        ep.chalMemberScores[name] -= 3;
        popDelta(name, -1);
        break;
      }
    }

    // ── SCORING ──
    let extractionMultiplier = 1.0;
    if (specimen.escaped) {
      extractionMultiplier = 0.0;
    } else if (damaged) {
      extractionMultiplier = 0.5;
    }

    const baseScore = specimen.escaped ? 0 : specimen.score;
    let finalScore = baseScore * extractionMultiplier;
    finalScore += Math.min(run.deepestRoom, 4);
    if (!damaged && !specimen.escaped) {
      finalScore += 2;
    }

    scores[name] = Math.round(finalScore * 10) / 10;
    ep.chalMemberScores[name] += finalScore;

    if (specimen.temperament === 'aggressive' && !specimen.escaped) {
      popDelta(name, 2);
      const agKey = isMerged ? campKey : (entries.find(e => e.name === name)?.tribe || campKey);
      if (ep.campEvents[agKey]) {
        ep.campEvents[agKey].post.push({
          type: 'hangar-black-aggressive-extract',
          text: `${name} successfully extracted an aggressive alien specimen — legendary feat`,
          players: [name],
          badgeText: 'Legendary Extract', badgeClass: 'badge-positive'
        });
      }
    }

    extractions.push({
      name, hazards, socialEvents: [],
      finalSpecimen: { ...specimen },
      extractionMultiplier,
      confessional: specimen.temperament === 'aggressive' && !specimen.escaped
        ? pick(CONFESSIONAL_AGGRESSIVE_EXTRACT)(name, pr)
        : null
    });

    // ── SOCIAL EVENTS between extraction runs (every 2 players) ──
    if ((extIdx + 1) % 2 === 0 || extIdx === extractOrder.length - 1) {
      const extracting = extractions.filter(e => e.finalSpecimen && !e.finalSpecimen.escaped).map(e => e.name);
      if (extracting.length >= 2) {
        const eventCount = 1 + (Math.random() < 0.45 ? 1 : 0);
        for (let ei = 0; ei < eventCount; ei++) {
          const actor = pick(extracting);
          const targets = extracting.filter(n => n !== actor);
          if (targets.length === 0) break;
          const target = pick(targets);
          const actorArch = arch(actor);
          const bond = getBond(actor, target);

          let eventType = null, narrative = '', bondDelta = 0;
          let extStolenSpec = null;

          if (VILLAIN_ARCHS.has(actorArch) && bond < 2) {
            if (Math.random() < 0.35) {
              const tgtExt = extractions.find(e => e.name === target);
              if (tgtExt?.finalSpecimen && !tgtExt.finalSpecimen.escaped) {
                eventType = 'steal';
                narrative = pick(SOCIAL_STEAL)(actor, target);
                bondDelta = -3;
                const actorExt = extractions.find(e => e.name === actor);
                if (actorExt && tgtExt) {
                  const stolen = { ...tgtExt.finalSpecimen };
                  extStolenSpec = stolen;
                  if (!actorExt.finalSpecimen || stolen.score > actorExt.finalSpecimen.score) {
                    actorExt.finalSpecimen = stolen;
                  }
                  tgtExt.finalSpecimen = { ...tgtExt.finalSpecimen, escaped: true };
                  tgtExt.extractionMultiplier = 0;
                  scores[target] = 0;
                  ep.chalMemberScores[target] -= 4;
                  ep.chalMemberScores[actor] = (ep.chalMemberScores[actor] || 0) + 4;
                }
                popDelta(actor, -1);
              } else {
                eventType = 'sabotage';
                narrative = pick(SOCIAL_SABOTAGE)(actor, target);
                bondDelta = -2;
                hp[target] = clamp((hp[target] || 0) - 10, 0, 100);
                popDelta(actor, -1);
              }
            } else {
              eventType = 'sabotage';
              narrative = pick(SOCIAL_SABOTAGE)(actor, target);
              bondDelta = -2;
              hp[target] = clamp((hp[target] || 0) - 10, 0, 100);
              popDelta(actor, -1);
            }
          } else if (canScheme(actor) && !NICE_ARCHS.has(actorArch) && bond < 0) {
            eventType = 'sabotage';
            narrative = pick(SOCIAL_SABOTAGE)(actor, target);
            bondDelta = -2;
            hp[target] = clamp((hp[target] || 0) - 8, 0, 100);
            popDelta(actor, -1);
          } else if (NICE_ARCHS.has(actorArch) && (actorArch === 'hero' || actorArch === 'loyal-soldier')) {
            eventType = 'guard';
            narrative = pick(SOCIAL_GUARD)(actor, target);
            bondDelta = 2;
            hp[actor] = clamp((hp[actor] || 0) - 8, 0, 100);
            ep.chalMemberScores[actor] = (ep.chalMemberScores[actor] || 0) + 2;
            popDelta(actor, 1);
          } else if (NICE_ARCHS.has(actorArch)) {
            eventType = 'encourage';
            narrative = pick(SOCIAL_ENCOURAGE)(actor, target);
            bondDelta = 1;
            ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 1;
          } else if (bond > 3) {
            eventType = 'help';
            narrative = pick(SOCIAL_HELP)(actor, target);
            bondDelta = 1;
            ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 1.5;
          } else {
            const helpChance = pStats(actor).social * 0.08 + noise(2);
            if (helpChance > 0.5) {
              eventType = 'help';
              narrative = pick(SOCIAL_HELP)(actor, target);
              bondDelta = 1;
              ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 1;
            } else {
              eventType = 'encourage';
              narrative = pick(SOCIAL_ENCOURAGE)(actor, target);
              bondDelta = 0.5;
            }
          }

          if (eventType) {
            addBond(actor, target, bondDelta);
            const socialEvt = { type: eventType, actor, target, narrative, bondDelta };
            if (eventType === 'steal' && extStolenSpec) {
              socialEvt.stolenSpecimen = extStolenSpec;
            }
            extractSocialEvents.push(socialEvt);
            allSocialEvents.push(socialEvt);

            const socialKey = isMerged ? campKey : (entries.find(e => e.name === actor)?.tribe || campKey);
            if (ep.campEvents[socialKey]) {
              const badgeMap = {
                help: { text: 'Intel Shared', cls: 'badge-positive' },
                sabotage: { text: 'Sabotage', cls: 'badge-negative' },
                steal: { text: 'Specimen Theft', cls: 'badge-negative' },
                guard: { text: 'Body Shield', cls: 'badge-positive' },
                encourage: { text: 'Morale Boost', cls: 'badge-info' }
              };
              const badge = badgeMap[eventType] || { text: eventType, cls: 'badge-info' };
              ep.campEvents[socialKey].post.push({
                type: `hangar-black-extract-${eventType}`,
                text: narrative,
                players: [actor, target],
                badgeText: badge.text, badgeClass: badge.cls
              });
            }
          }
        }
      }
    }
  });

  // Fill scores for KO'd / no-specimen players
  active.forEach(name => {
    if (scores[name] === undefined) scores[name] = 0;
  });

  // ══ ROMANCE HOOKS ══
  const _romActive = active;
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'hangar black');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'hangar black', _romActive);

  // ══ DETERMINE RESULTS ══
  const result = {
    phase: isMerged ? 'post-merge' : 'pre-merge',
    entries,
    huntRuns,
    extractions,
    scores,
    socialEvents: allSocialEvents,
    huntSocialEvents,
    extractSocialEvents,
    alarmTriggered: alarmActive.value,
    hp: { ...hp },
    hostEntry: pick(HOST_ENTRY)(),
    hostHunt: pick(HOST_HUNT)(),
    hostExtract: pick(HOST_EXTRACT)()
  };

  if (!isMerged) {
    // ── PRE-MERGE: tribe average scores ──
    const tribeResults = tribeData.map(td => {
      const memberScores = td.members.map(n => scores[n] || 0);
      const avgScore = memberScores.length > 0
        ? memberScores.reduce((a, b) => a + b, 0) / memberScores.length
        : 0;
      return { tribeName: td.tribeName, avgScore: Math.round(avgScore * 10) / 10, members: [...td.members] };
    });

    tribeResults.sort((a, b) => b.avgScore - a.avgScore);
    const winningTribe = tribeResults[0]?.tribeName;
    const losingTribe = tribeResults[tribeResults.length - 1]?.tribeName;

    result.tribeResults = tribeResults;
    result.winningTribe = winningTribe;
    result.losingTribe = losingTribe;
    result.immunityWinner = null; // tribe challenge — no individual immunity

    // ── FINALIZE PRE-MERGE ──
    ep.challengeData = result;
    ep.isHangarBlack = true;
    ep.challengeType = 'hangar-black';
    ep.challengeLabel = 'Operation: Hangar Black';
    ep.challengeCategory = 'adventure';

    const winnerTribe = gs.tribes.find(t => t.name === winningTribe);
    const loserTribe = gs.tribes.find(t => t.name === losingTribe);

    ep.winner = winnerTribe;
    ep.loser = loserTribe;
    ep.safeTribes = tribeResults.length > 2
      ? tribeResults.slice(1, -1).map(tr => gs.tribes.find(t => t.name === tr.tribeName)).filter(Boolean)
      : [];
    ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];

    ep.challengePlacements = tribeResults.map(tr => ({
      name: tr.tribeName,
      members: [...(gs.tribes.find(t => t.name === tr.tribeName)?.members || [])],
      memberScores: {}
    }));

    ep.chalPlacements = Object.entries(ep.chalMemberScores)
      .sort(([, a], [, b]) => b - a).map(([n]) => n);

    // Top scorer from winning tribe gets massive bonus for podium
    const topScorer = winnerTribe?.members.slice().sort((a, b) =>
      (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)
    )[0];
    if (topScorer) {
      const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
        .filter(([n]) => n !== topScorer).map(([, s]) => s));
      ep.chalMemberScores[topScorer] = Math.max(
        ep.chalMemberScores[topScorer] || 0, maxOther) + active.length + 5;
    }

  } else {
    // ── POST-MERGE: individual immunity ──
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    const immunityWinner = sorted[0]?.[0] || active[0];

    result.immunityWinner = immunityWinner;
    result.tribeResults = null;
    result.winningTribe = null;

    // ── FINALIZE POST-MERGE ──
    ep.challengeData = result;
    ep.isHangarBlack = true;
    ep.challengeType = 'hangar-black';
    ep.challengeLabel = 'Operation: Hangar Black';
    ep.challengeCategory = 'adventure';
    ep.immunityWinner = immunityWinner;

    ep.chalPlacements = sorted.map(([n]) => n);
    ep.tribalPlayers = active;

    // Immunity winner massive bonus
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== immunityWinner).map(([, s]) => s));
    ep.chalMemberScores[immunityWinner] = Math.max(
      ep.chalMemberScores[immunityWinner] || 0, maxOther) + active.length + 5;
  }

  updateChalRecord(ep);
  return ep;
}

// ══ VP BUILDERS INSERTED BELOW ══

// ──────────────────────────────────────────────────────────
// VP STATE & REVEAL HANDLERS
// ──────────────────────────────────────────────────────────
const _tvState = {};

function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`hb-step-${suffix}-${i}`);
    if (el) el.classList.add('hb-visible');
  }
  const counter = document.getElementById(`hb-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`hb-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.hb-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

function _hbUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('hb-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._hbEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  const cd = epRecord?.challengeData || epRecord?.hangarBlack;
  if (!cd) return;
  sideEl.innerHTML = _buildSidebarContent(epRecord, screenKey);
}

function _hbUpdateMap(screenKey) {
  // Update team tokens on map based on reveal progress
  const st = _tvState[screenKey];
  if (!st) return;
  const ep = window._hbEpRecord;
  const cd = ep?.challengeData || ep?.hangarBlack;
  if (!cd) return;

  const stepMeta = window._hbStepMeta?.[screenKey];
  if (!stepMeta) return;

  const revealIdx = Math.max(st.idx, 0);
  const meta = stepMeta[Math.min(revealIdx, stepMeta.length - 1)];
  if (!meta) return;

  // Accumulate all known positions up to current reveal
  const allPositions = {};
  for (let i = 0; i <= Math.min(revealIdx, stepMeta.length - 1); i++) {
    const m = stepMeta[i];
    if (m?.positions) Object.assign(allPositions, m.positions);
  }

  // Group by zone to stagger
  const zonePositions = { perimeter: { left: 15, top: 70 }, hangar: { left: 35, top: 55 }, labs: { left: 55, top: 40 }, deep: { left: 75, top: 30 }, exfil: { left: 90, top: 65 } };
  const zoneCounts = {};
  const zoneIdx = {};
  Object.values(allPositions).forEach(z => { zoneCounts[z] = (zoneCounts[z] || 0) + 1; });

  Object.entries(allPositions).forEach(([name, zone]) => {
    const tok = document.getElementById(`hb-maptok-${name.replace(/\s+/g, '-')}`);
    if (!tok) return;
    const base = zonePositions[zone] || zonePositions.perimeter;
    const count = zoneCounts[zone] || 1;
    if (!zoneIdx[zone]) zoneIdx[zone] = 0;
    const i = zoneIdx[zone]++;
    const col = i % 4;
    const row = Math.floor(i / 4);
    const leftOff = (col - (Math.min(count, 4) - 1) / 2) * 3.5;
    const topOff = row * 12;
    tok.style.left = `${base.left + leftOff}%`;
    tok.style.top = `${base.top + topOff}%`;
  });

  // Hazard pulses
  if (meta.hazardZone) {
    const hz = document.getElementById('hb-map-hazard-pulse');
    if (hz) {
      const zp = { perimeter: '15% 70%', hangar: '35% 55%', labs: '55% 40%', deep: '75% 30%', exfil: '90% 65%' };
      const pos = zp[meta.hazardZone];
      if (pos) {
        const [l, t] = pos.split(' ');
        hz.style.left = l; hz.style.top = t;
        hz.style.display = 'block';
        hz.style.borderColor = 'var(--hot)';
        hz.style.animation = 'none'; hz.offsetHeight; hz.style.animation = 'hpulse 1.4s ease-out forwards';
      }
    }
  }
}

export function hbRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    const suffix = screenKey.replace('hb-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    const el = document.getElementById(`hb-step-${suffix}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) { console.warn('HB reveal error:', e); }
  try { _hbUpdateSidebar(screenKey); } catch (e) { console.warn('HB sidebar error:', e); }
  try { _hbUpdateMap(screenKey); } catch (e) { console.warn('HB map error:', e); }
}

export function hbRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('hb-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
  } catch (e) { console.warn('HB revealAll error:', e); }
  try { _hbUpdateSidebar(screenKey); } catch (e) { console.warn('HB sidebar error:', e); }
  try { _hbUpdateMap(screenKey); } catch (e) { console.warn('HB map error:', e); }
}

// ──────────────────────────────────────────────────────────
// CSS ICONS (no emoji)
// ──────────────────────────────────────────────────────────
function _icon(type) {
  switch (type) {
    case 'briefing': return `<div class="hb-icon-briefing"><div class="hb-ib-board"></div><div class="hb-ib-clip"></div><div class="hb-ib-line"></div><div class="hb-ib-line"></div><div class="hb-ib-line"></div></div>`;
    case 'movement': return `<div class="hb-icon-movement"><div class="hb-im-chev"></div><div class="hb-im-chev"></div></div>`;
    case 'hazard': return `<div class="hb-icon-hazard"><div class="hb-ih-tri"></div><div class="hb-ih-bang"></div></div>`;
    case 'alien': return `<div class="hb-icon-alien"><div class="hb-ia-head"></div><div class="hb-ia-eye hb-ia-eye-l"></div><div class="hb-ia-eye hb-ia-eye-r"></div></div>`;
    case 'discovery': return `<div class="hb-icon-discovery"><div class="hb-id-ring"></div><div class="hb-id-cross-h"></div><div class="hb-id-cross-v"></div><div class="hb-id-dot"></div></div>`;
    case 'social': return `<div class="hb-icon-social"><div class="hb-is-hand hb-is-hand-l"></div><div class="hb-is-hand hb-is-hand-r"></div></div>`;
    case 'shield': return `<div class="hb-icon-shield"><div class="hb-ish-body"></div></div>`;
    case 'skull': return `<div class="hb-icon-skull"><div class="hb-isk-head"></div><div class="hb-isk-eye hb-isk-eye-l"></div><div class="hb-isk-eye hb-isk-eye-r"></div><div class="hb-isk-jaw"></div></div>`;
    case 'medal': return `<div class="hb-icon-medal"><div class="hb-imd-circle"></div><div class="hb-imd-ribbon hb-imd-ribbon-l"></div><div class="hb-imd-ribbon hb-imd-ribbon-r"></div></div>`;
    case 'confessional': return `<div class="hb-icon-confessional"><div class="hb-ic-cam"></div><div class="hb-ic-lens"></div></div>`;
    case 'radio': { const sz = 18, c = 'var(--hud-dim)'; return `<div class="hb-icon" style="width:${sz}px;height:${sz}px"><svg viewBox="0 0 24 24" width="${sz}" height="${sz}"><rect x="3" y="8" width="18" height="12" rx="2" fill="none" stroke="${c}" stroke-width="1.5"/><line x1="8" y1="4" x2="12" y2="8" stroke="${c}" stroke-width="1.5"/><circle cx="9" cy="14" r="3" fill="none" stroke="${c}" stroke-width="1.2"/><line x1="15" y1="11" x2="19" y2="11" stroke="${c}" stroke-width="1.2"/><line x1="15" y1="14" x2="19" y2="14" stroke="${c}" stroke-width="1.2"/><line x1="15" y1="17" x2="19" y2="17" stroke="${c}" stroke-width="1.2"/></svg></div>`; }
    default: return `<div class="hb-icon-briefing"><div class="hb-ib-board"></div></div>`;
  }
}

// ──────────────────────────────────────────────────────────
// HELPER: get data object from ep
// ──────────────────────────────────────────────────────────
function _cd(ep) { return ep?.challengeData || ep?.hangarBlack || null; }

function _hpClass(hp) {
  if (hp > 60) return 'ok';
  if (hp > 30) return 'warn';
  return 'hot';
}

function _hpPercent(hp) { return Math.max(0, Math.min(100, hp)); }

function _tierClass(tier) {
  if (tier <= 1) return 'ok';
  if (tier <= 2) return 'warn';
  if (tier <= 3) return 'bad';
  return 'bad';
}

function _tierLabel(tier) {
  return ['', 'GREEN', 'YELLOW', 'RED', 'RED+'][tier] || 'RED+';
}

function _tierColor(tier) {
  return ['', 'var(--hud)', 'var(--warn)', 'var(--hot)', 'var(--classified)'][tier] || 'var(--hot)';
}

function _temperamentIcon(temp) {
  if (temp === 'aggressive') return _icon('skull');
  if (temp === 'skittish') return _icon('movement');
  return _icon('alien');
}

function _tribeColorSafe(tribeName) {
  try { return tribeColor(tribeName); } catch { return 'var(--teamA)'; }
}

// ──────────────────────────────────────────────────────────
// CSS
// ──────────────────────────────────────────────────────────
function _getCSS() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@500;700;900&display=swap');

:root{--bg-0:#060a0e;--bg-1:#0c1218;--bg-2:#131a22;--bg-3:#1a232c;--grid:rgba(120,255,160,0.06);--line:#2a3a44;--line-2:#3d5260;--hud:#92ffb3;--hud-dim:#5fa67c;--warn:#ffb836;--hot:#ff3a3a;--laser:#ff2a6a;--alien:#b76dff;--classified:#ff5e3a;--paper:#d8d2bc;--paper-dim:#a39d88;--tan:#c8b88a;--redacted:#1a1a1a;--teamA:#3aa0ff;--teamA-dim:#1d5d99;--teamB:#ff5e3a;--teamB-dim:#993218;}

/* ═══ ATMOSPHERE (must not cover VP nav) ═══ */
.hb-bg{position:fixed;top:46px;left:0;right:0;bottom:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 80% 50% at 50% 100%,rgba(146,255,179,0.05) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 20% 0%,rgba(255,90,58,0.04) 0%,transparent 60%),linear-gradient(180deg,#050810 0%,#0c1218 70%,#1a1410 100%);}
.hb-grid{position:fixed;top:46px;left:0;right:0;bottom:0;z-index:0;pointer-events:none;background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:40px 40px;transform:perspective(700px) rotateX(60deg) translateY(20vh) scale(2);transform-origin:center bottom;opacity:0.6;mask-image:linear-gradient(to top,black 0%,transparent 70%);}
.hb-scanlines{position:fixed;top:46px;left:0;right:0;bottom:0;z-index:1;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 3px);mix-blend-mode:overlay;}
.hb-vignette{position:fixed;top:46px;left:0;right:0;bottom:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.6) 100%);}
.hb-stars{position:fixed;top:46px;left:0;right:0;bottom:0;z-index:0;pointer-events:none;}
.hb-star{position:absolute;width:2px;height:2px;background:white;border-radius:50%;opacity:0.4;animation:twinkle 4s infinite ease-in-out;}
@keyframes twinkle{0%,100%{opacity:0.2;}50%{opacity:0.8;}}

/* ═══ BROADCAST BAR ═══ */
.hb-broadcast{position:sticky;top:0;z-index:50;background:linear-gradient(180deg,#060a0e 0%,#0c1218 100%);border-bottom:1px solid var(--hud-dim);height:36px;display:flex;align-items:center;gap:16px;padding:0 16px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.15em;}
.hb-rec{display:flex;align-items:center;gap:6px;color:var(--hot);font-weight:700;}
.hb-rec-dot{width:8px;height:8px;border-radius:50%;background:var(--hot);animation:blink 1s infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0.2;}}
.hb-channel{color:var(--hud);}
.hb-ticker{flex:1;overflow:hidden;position:relative;height:16px;}
.hb-ticker-inner{position:absolute;white-space:nowrap;animation:scroll 40s linear infinite;color:var(--hud-dim);}
.hb-ticker-inner span{color:var(--warn);margin:0 6px;}
@keyframes scroll{from{transform:translateX(100%);}to{transform:translateX(-100%);}}
.hb-clock{color:var(--hud);}
.hb-feed-id{color:var(--paper-dim);}

/* ═══ TITLE PLATE ═══ */
.hb-title-plate{position:relative;z-index:5;max-width:1100px;margin:16px auto 0;padding:18px 24px;background:linear-gradient(135deg,rgba(146,255,179,0.04),rgba(255,90,58,0.04)),linear-gradient(180deg,var(--bg-2),var(--bg-1));border:1px solid var(--hud-dim);border-left:4px solid var(--classified);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;box-shadow:0 0 60px rgba(146,255,179,0.05);}
.hb-title-plate::before{content:'CLASSIFIED';position:absolute;top:8px;right:12px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.4em;color:var(--classified);border:1px solid var(--classified);padding:2px 6px;transform:rotate(2deg);opacity:0.7;}
.hb-title-meta{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.2em;color:var(--hud-dim);line-height:1.6;}
.hb-title-meta b{color:var(--hud);display:block;}
.hb-title-main{text-align:center;}
.hb-title-eyebrow{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.4em;color:var(--warn);}
.hb-title-name{font-family:'Black Ops One',sans-serif;font-size:38px;letter-spacing:0.06em;color:var(--paper);text-shadow:0 0 20px rgba(146,255,179,0.2);line-height:1;margin:4px 0 6px;}
.hb-title-sub{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.3em;color:var(--hud);}
.hb-title-stats{display:flex;gap:16px;justify-content:flex-end;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.15em;}
.hb-stat{text-align:right;}
.hb-stat-v{font-family:'Orbitron',sans-serif;font-weight:900;font-size:22px;color:var(--hud);display:block;line-height:1;}
.hb-stat-l{color:var(--paper-dim);display:block;margin-top:4px;}

/* ═══ SHELL ═══ */
.hb-shell{position:relative;z-index:5;max-width:1100px;margin:0 auto;padding:16px;display:grid;grid-template-columns:1fr 280px;gap:16px;font-family:'Rajdhani',sans-serif;color:var(--paper);}
.hb-shell *{box-sizing:border-box;}
.hb-main{min-width:0;}

/* ═══ MAP ═══ */
.hb-map-wrap{position:sticky;top:36px;z-index:10;background:var(--bg-1);border:1px solid var(--hud-dim);margin-bottom:16px;box-shadow:0 8px 30px rgba(0,0,0,0.6);}
.hb-map-header{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:linear-gradient(90deg,var(--bg-3),var(--bg-2));border-bottom:1px solid var(--hud-dim);font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.2em;}
.hb-map-title{color:var(--hud);font-weight:700;}
.hb-map-coords{color:var(--paper-dim);}
.hb-map-phase{color:var(--warn);border:1px solid var(--warn);padding:2px 8px;}
.hb-map{position:relative;height:200px;overflow:hidden;background:radial-gradient(ellipse at 50% 100%,rgba(146,255,179,0.08),transparent 70%),linear-gradient(180deg,#0a0d12 0%,#1a1410 100%);}
.hb-map svg{display:block;width:100%;height:100%;}

/* Map elements */
.hb-zone-label{position:absolute;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.25em;color:var(--hud);background:rgba(6,10,14,0.85);border:1px solid var(--hud-dim);padding:3px 7px;pointer-events:none;text-transform:uppercase;}
.hb-zone-label .stat{color:var(--paper-dim);display:block;font-size:8px;letter-spacing:0.2em;margin-top:2px;}
.hb-zone-label.danger{color:var(--warn);border-color:var(--warn);animation:hazardpulse 1.6s infinite;}
@keyframes hazardpulse{0%,100%{box-shadow:0 0 0 0 rgba(255,184,54,0.6);}50%{box-shadow:0 0 0 6px rgba(255,184,54,0);}}

.hb-tok{position:absolute;width:28px;height:28px;border-radius:50%;border:2px solid;display:grid;place-items:center;overflow:hidden;transition:top 0.8s cubic-bezier(.4,0,.2,1),left 0.8s cubic-bezier(.4,0,.2,1);z-index:3;}
.hb-tok-pic{width:100%;height:100%;object-fit:cover;border-radius:50%;}
@keyframes tokhit{0%,100%{transform:translate(0,0);}25%{transform:translate(-3px,-2px);}75%{transform:translate(3px,2px);}}
.hb-hazard-pulse{position:absolute;width:16px;height:16px;border-radius:50%;border:2px solid;pointer-events:none;display:none;}
@keyframes hpulse{0%{transform:scale(0.4);opacity:1;}100%{transform:scale(4);opacity:0;}}
.map-fence{stroke:var(--hud-dim);stroke-width:1.5;stroke-dasharray:3 2;fill:none;}
.map-bldg{fill:var(--bg-2);stroke:var(--hud-dim);stroke-width:1;}
.map-bldg-2{fill:var(--bg-3);stroke:var(--line-2);stroke-width:1;}
.map-path{stroke:var(--hud);stroke-width:1.5;stroke-dasharray:4 3;fill:none;opacity:0.5;}
.map-text{font-family:'Share Tech Mono',monospace;font-size:8px;fill:var(--paper-dim);letter-spacing:1px;}

/* ═══ FEED ═══ */
.hb-feed{display:flex;flex-direction:column;gap:10px;padding-bottom:80px;}
.hb-section-bar{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:8px 14px;background:linear-gradient(90deg,var(--bg-3),transparent);border-left:3px solid var(--hud);font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.25em;margin-top:8px;}
.hb-section-bar:first-child{margin-top:0;}
.hb-section-tag{color:var(--hud);font-weight:700;}
.hb-section-title{color:var(--paper);font-family:'Black Ops One',sans-serif;font-size:14px;letter-spacing:0.1em;}
.hb-section-meta{color:var(--paper-dim);}

/* ═══ CARDS ═══ */
.hb-card{position:relative;background:linear-gradient(135deg,var(--bg-2),var(--bg-1));border:1px solid var(--line-2);padding:12px 14px;animation:cardin .45s cubic-bezier(.16,1,.3,1) both;}
@keyframes cardin{from{opacity:0;transform:translateX(-10px);filter:blur(2px);}to{opacity:1;transform:translateX(0);filter:blur(0);}}
.hb-card-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px dashed rgba(146,255,179,0.15);}
.hb-card-icon{width:28px;height:28px;flex-shrink:0;border:1px solid;display:grid;place-items:center;font-family:'Share Tech Mono',monospace;font-size:12px;font-weight:700;}
.hb-card-who{font-family:'Black Ops One',sans-serif;font-size:13px;letter-spacing:0.1em;flex:1;}
.hb-card-tag{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.2em;padding:2px 8px;border:1px solid;}
.hb-card-body{font-size:13.5px;line-height:1.55;color:var(--paper);}
.hb-card-body em{font-style:normal;color:var(--hud);font-family:'Share Tech Mono',monospace;font-size:12px;background:rgba(146,255,179,0.08);padding:0 4px;}
.hb-card-body b{color:var(--warn);font-weight:700;}
.hb-card-foot{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.15em;}
.hb-chip{padding:2px 8px;border:1px solid;}
.hb-chip.ok{color:var(--hud);border-color:var(--hud-dim);}
.hb-chip.bad{color:var(--hot);border-color:var(--hot);}
.hb-chip.warn{color:var(--warn);border-color:var(--warn);}

/* Card variants */
.hb-card.briefing{background:linear-gradient(135deg,rgba(146,255,179,0.06),var(--bg-1));border-color:var(--hud-dim);border-left:3px solid var(--hud);}
.hb-card.briefing .hb-card-icon{border-color:var(--hud);color:var(--hud);}
.hb-card.briefing .hb-card-tag{border-color:var(--hud);color:var(--hud);}

.hb-card.movement{border-color:var(--line-2);}
.hb-card.movement .hb-card-icon{border-color:var(--hud);color:var(--hud);}

.hb-card.hazard{background:linear-gradient(135deg,rgba(255,90,58,0.12),var(--bg-1));border:1px solid var(--hot);border-left:4px solid var(--hot);animation:cardin .45s cubic-bezier(.16,1,.3,1) both,hazardflash .6s ease;}
@keyframes hazardflash{0%{box-shadow:0 0 0 4px rgba(255,58,58,0.6),0 0 40px rgba(255,58,58,0.4);}100%{box-shadow:0 0 0 0 rgba(255,58,58,0),0 0 0 rgba(255,58,58,0);}}
.hb-card.hazard .hb-card-icon{border-color:var(--hot);color:var(--hot);background:rgba(255,58,58,0.1);}
.hb-card.hazard .hb-card-tag{border-color:var(--hot);color:var(--hot);background:rgba(255,58,58,0.1);}
.hb-card.hazard .hb-card-who{color:var(--hot);}

.hb-card.interrupt{background:var(--bg-2);border:1px solid var(--warn);border-left:4px solid var(--warn);position:relative;}
.hb-card.interrupt::before{content:'INTERRUPT';position:absolute;top:-1px;right:-1px;background:var(--warn);color:var(--bg-0);font-family:'Share Tech Mono',monospace;font-size:9px;font-weight:700;letter-spacing:0.2em;padding:2px 8px;}
.hb-card.interrupt .hb-card-who{color:var(--warn);}
.hb-card.interrupt .hb-card-icon{border-color:var(--warn);color:var(--warn);}

.hb-card.alien{background:linear-gradient(135deg,rgba(183,109,255,0.12),var(--bg-1));border:1px solid var(--alien);border-left:4px solid var(--alien);animation:cardin .45s,alienpulse 2s ease-in-out infinite;}
@keyframes alienpulse{0%,100%{box-shadow:inset 0 0 30px rgba(183,109,255,0.05);}50%{box-shadow:inset 0 0 50px rgba(183,109,255,0.15),0 0 30px rgba(183,109,255,0.2);}}
.hb-card.alien .hb-card-icon{border-color:var(--alien);color:var(--alien);}
.hb-card.alien .hb-card-tag{border-color:var(--alien);color:var(--alien);}
.hb-card.alien .hb-card-who{color:var(--alien);}

.hb-card.discovery{background:linear-gradient(135deg,rgba(146,255,179,0.1),var(--bg-1));border:1px solid var(--hud);box-shadow:0 0 30px rgba(146,255,179,0.1);}
.hb-card.discovery .hb-card-icon{border-color:var(--hud);color:var(--hud);background:rgba(146,255,179,0.1);}
.hb-card.discovery .hb-card-tag{border-color:var(--hud);color:var(--hud);}
.hb-card.discovery .hb-card-who{color:var(--hud);}

.hb-card.confessional{background:var(--bg-2);border:1px dashed var(--paper-dim);border-left:3px solid var(--paper-dim);}
.hb-card.confessional .hb-card-body{font-style:italic;color:var(--paper-dim);}
.hb-card.confessional .hb-card-icon{border-color:var(--paper-dim);color:var(--paper-dim);}

.hb-card.victory{background:linear-gradient(135deg,rgba(255,184,54,0.15),var(--bg-1));border:2px solid var(--warn);text-align:center;}
.hb-card.victory .hb-card-who{color:var(--warn);font-size:18px;}

/* Cause-effect connector */
.hb-cause-effect{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);}
.hb-ce-side{padding:8px;background:rgba(0,0,0,0.3);border:1px solid var(--line);font-family:'Share Tech Mono',monospace;font-size:10px;line-height:1.5;letter-spacing:0.05em;}
.hb-ce-side .lbl{color:var(--paper-dim);display:block;font-size:8px;letter-spacing:0.25em;margin-bottom:4px;}
.hb-ce-arrow{align-self:center;font-family:'Black Ops One',sans-serif;font-size:24px;color:var(--warn);animation:arrowshift 1s ease-in-out infinite;}
@keyframes arrowshift{0%,100%{transform:translateX(0);}50%{transform:translateX(4px);}}

/* Avatar */
.hb-av{width:28px;height:28px;border-radius:50%;border:2px solid;display:grid;place-items:center;font-family:'Black Ops One',sans-serif;font-size:10px;flex-shrink:0;object-fit:cover;}

/* ═══ SIDEBAR ═══ */
.hb-side{position:sticky;top:50px;align-self:start;max-height:calc(100vh - 70px);overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding-right:4px;}
.hb-side::-webkit-scrollbar{width:6px;}
.hb-side::-webkit-scrollbar-thumb{background:var(--line-2);}
.hb-panel{background:linear-gradient(180deg,var(--bg-2),var(--bg-1));border:1px solid var(--hud-dim);position:relative;}
.hb-panel-head{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:linear-gradient(90deg,var(--bg-3),transparent);border-bottom:1px solid var(--hud-dim);font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.25em;color:var(--hud);}
.hb-panel-head .pill{background:var(--hud);color:var(--bg-0);padding:1px 6px;font-weight:700;}
.hb-panel-body{padding:10px 12px;}
.hb-roster{display:flex;flex-direction:column;gap:6px;}
.hb-roster-row{display:grid;grid-template-columns:32px 1fr auto;gap:8px;align-items:center;padding:6px;background:var(--bg-1);border-left:3px solid var(--line-2);transition:all 0.3s;}
.hb-roster-row.eliminated{opacity:0.4;filter:grayscale(0.8);}
.hb-roster-row.injured{background:rgba(255,184,54,0.06);}
.hb-roster-pic{width:32px;height:32px;border-radius:50%;border:2px solid;display:grid;place-items:center;font-family:'Black Ops One',sans-serif;font-size:11px;position:relative;object-fit:cover;}
.hb-roster-info{min-width:0;}
.hb-roster-name{font-family:'Black Ops One',sans-serif;font-size:12px;letter-spacing:0.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hb-roster-role{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--paper-dim);letter-spacing:0.1em;}
.hb-roster-status{font-family:'Share Tech Mono',monospace;font-size:9px;padding:2px 6px;border:1px solid;text-transform:uppercase;letter-spacing:0.15em;}
.hb-status-ok{color:var(--hud);border-color:var(--hud-dim);}
.hb-status-warn{color:var(--warn);border-color:var(--warn);}
.hb-status-hot{color:var(--hot);border-color:var(--hot);}
.hb-status-alien{color:var(--alien);border-color:var(--alien);}
.hb-hp{margin-top:4px;height:3px;background:rgba(255,255,255,0.05);position:relative;}
.hb-hp-fill{height:100%;transition:width 0.6s;}
.hb-hp-fill.ok{background:var(--hud);}
.hb-hp-fill.warn{background:var(--warn);}
.hb-hp-fill.hot{background:var(--hot);}

/* Artifact grid */
.hb-art-grid{display:flex;flex-direction:column;gap:8px;}
.hb-art{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:8px;background:var(--bg-1);border:1px solid var(--line);position:relative;}
.hb-art.confirmed{border-color:var(--hud);background:rgba(146,255,179,0.05);box-shadow:0 0 12px rgba(146,255,179,0.2);}
.hb-art.alive{border-color:var(--alien);animation:alienthrob 2s infinite;}
@keyframes alienthrob{0%,100%{box-shadow:inset 0 0 0 0 var(--alien);}50%{box-shadow:inset 0 0 18px rgba(183,109,255,0.3);}}
.hb-art-icon{width:28px;height:28px;border:1px solid var(--line-2);display:grid;place-items:center;background:rgba(0,0,0,0.4);}
.hb-art-name{font-family:'Black Ops One',sans-serif;font-size:11px;letter-spacing:0.05em;}
.hb-art-meta{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--paper-dim);letter-spacing:0.1em;}
.hb-art-status{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.15em;}

/* Hazard log */
.hb-haz-list{display:flex;flex-direction:column;gap:4px;}
.hb-haz-item{display:grid;grid-template-columns:14px 1fr auto;gap:6px;padding:5px 0;border-bottom:1px dotted rgba(255,255,255,0.06);font-family:'Share Tech Mono',monospace;font-size:10px;}
.hb-haz-item:last-child{border-bottom:none;}
.hb-haz-dot{width:8px;height:8px;border-radius:50%;align-self:center;}
.hb-haz-fence{background:var(--warn);box-shadow:0 0 6px var(--warn);}
.hb-haz-mine{background:var(--hot);box-shadow:0 0 6px var(--hot);}
.hb-haz-laser{background:var(--laser);box-shadow:0 0 6px var(--laser);}
.hb-haz-alien-dot{background:var(--alien);box-shadow:0 0 6px var(--alien);}
.hb-haz-label{color:var(--paper);letter-spacing:0.1em;}
.hb-haz-count{color:var(--paper-dim);}

/* Race meter */
.hb-race{display:flex;flex-direction:column;gap:8px;}
.hb-race-row{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.1em;}
.hb-race-row .label{display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.hb-race-pic{width:18px;height:18px;border-radius:50%;border:1.5px solid;object-fit:cover;flex-shrink:0;}
.hb-race-row .lname{font-family:'Black Ops One',sans-serif;font-size:11px;}
.hb-race-row .lpct{color:var(--paper-dim);margin-left:auto;}
.hb-race-track{height:14px;background:var(--bg-1);border:1px solid var(--line);position:relative;overflow:hidden;}
.hb-race-track::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0,transparent 19px,rgba(255,255,255,0.04) 19px,rgba(255,255,255,0.04) 20px);}
.hb-race-fill{height:100%;transition:width 0.8s cubic-bezier(.4,0,.2,1);position:relative;}
.hb-race-fill::after{content:'';position:absolute;right:0;top:-4px;bottom:-4px;width:2px;background:white;box-shadow:0 0 8px white;}

/* ═══ CONTROLS ═══ */
.hb-controls{position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:30;display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;background:var(--bg-1);border:1px solid var(--hud-dim);border-bottom:none;box-shadow:0 -8px 30px rgba(0,0,0,0.7);}
.hb-btn{background:linear-gradient(180deg,var(--bg-3),var(--bg-2));color:var(--paper);border:none;border-right:1px solid var(--line-2);padding:14px 18px;cursor:pointer;font-family:'Black Ops One',sans-serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.15s;}
.hb-btn:hover:not(:disabled){background:linear-gradient(180deg,var(--hud-dim),var(--bg-3));color:var(--bg-0);}
.hb-btn:disabled{opacity:0.3;cursor:not-allowed;}
.hb-btn.primary{color:var(--hud);}
.hb-btn.primary:hover:not(:disabled){background:var(--hud);color:var(--bg-0);}
.hb-btn:last-child{border-right:none;}
.hb-progress{grid-column:1/-1;height:4px;background:var(--bg-0);overflow:hidden;border-top:1px solid var(--line);}
.hb-progress-fill{height:100%;background:linear-gradient(90deg,var(--hud),var(--warn));transition:width 0.4s;}

/* ═══ STEP VISIBILITY ═══ */
.hb-hidden{display:none;}
.hb-visible{display:block!important;animation:cardin .45s cubic-bezier(.16,1,.3,1) both;}

/* ═══ UFO TITLE ANIMATIONS ═══ */
.hb-ufo-scene{position:relative;min-height:350px;margin:20px auto;max-width:600px;overflow:hidden;}
.hb-desert{position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(to top,rgba(30,20,10,0.8),transparent);border-top:1px solid rgba(146,255,179,0.06);}
.hb-ufo{position:absolute;top:20px;left:50%;transform:translateX(-50%);animation:hb-ufo-descend 4s ease-out forwards;}
@keyframes hb-ufo-descend{0%{top:-80px;opacity:0;}30%{opacity:1;}100%{top:20px;}}
.hb-ufo-body{width:100px;height:30px;background:radial-gradient(ellipse,#3a3a4a,#22222e);border-radius:50%;position:relative;box-shadow:0 0 30px rgba(146,255,179,0.3);}
.hb-ufo-dome{width:50px;height:25px;background:radial-gradient(ellipse at 50% 80%,rgba(146,255,179,0.3),rgba(146,255,179,0.05));border-radius:50% 50% 0 0;position:absolute;top:-18px;left:25px;border:1px solid rgba(146,255,179,0.15);border-bottom:none;}
.hb-ufo-lights{position:absolute;bottom:-4px;left:10px;right:10px;display:flex;justify-content:space-between;}
.hb-ufo-light{width:6px;height:6px;border-radius:50%;animation:hb-ufo-blink 0.8s infinite alternate;}
.hb-ufo-light:nth-child(1){background:var(--hud);animation-delay:0s;}
.hb-ufo-light:nth-child(2){background:var(--warn);animation-delay:0.2s;}
.hb-ufo-light:nth-child(3){background:var(--hot);animation-delay:0.4s;}
.hb-ufo-light:nth-child(4){background:var(--alien);animation-delay:0.6s;}
.hb-ufo-light:nth-child(5){background:var(--hud);animation-delay:0.8s;}
@keyframes hb-ufo-blink{0%{opacity:0.3;transform:scale(0.8);}100%{opacity:1;transform:scale(1.2);}}
.hb-beam{position:absolute;top:30px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:60px solid transparent;border-right:60px solid transparent;border-top:200px solid rgba(146,255,179,0.08);animation:hb-beam-pulse 2s ease-in-out infinite;filter:blur(2px);}
@keyframes hb-beam-pulse{0%,100%{opacity:0.4;}50%{opacity:0.8;}}
.hb-ground-figures{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:16px;animation:hb-figures-float 3s ease-in-out 2s forwards;}
@keyframes hb-figures-float{0%{transform:translateX(-50%) translateY(0);}100%{transform:translateX(-50%) translateY(-120px) scale(0.6);opacity:0.3;}}
.hb-ground-fig{width:24px;height:24px;border-radius:50%;border:2px solid var(--hud-dim);overflow:hidden;object-fit:cover;animation:hb-fig-spin 4s linear 2s infinite;}
@keyframes hb-fig-spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}

/* ═══ CSS ICONS ═══ */
.hb-icon-briefing{width:20px;height:20px;position:relative;}
.hb-ib-board{width:14px;height:18px;background:var(--hud);opacity:0.2;position:absolute;top:1px;left:3px;border-radius:1px;}
.hb-ib-clip{width:8px;height:4px;border:2px solid var(--hud);border-bottom:none;border-radius:3px 3px 0 0;position:absolute;top:-1px;left:6px;}
.hb-ib-line{width:8px;height:1px;background:var(--hud);position:absolute;left:6px;}
.hb-ib-line:nth-child(3){top:7px;}
.hb-ib-line:nth-child(4){top:10px;}
.hb-ib-line:nth-child(5){top:13px;}

.hb-icon-movement{width:20px;height:20px;position:relative;display:flex;align-items:center;justify-content:center;gap:2px;}
.hb-im-chev{width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:6px solid var(--hud);}
.hb-im-chev:nth-child(2){opacity:0.5;}

.hb-icon-hazard{width:20px;height:20px;position:relative;}
.hb-ih-tri{width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:16px solid var(--hot);position:absolute;top:2px;left:0;opacity:0.3;}
.hb-ih-bang{width:2px;height:7px;background:var(--hot);position:absolute;top:7px;left:9px;border-radius:1px;}
.hb-ih-bang::after{content:'';width:2px;height:2px;background:var(--hot);border-radius:50%;position:absolute;bottom:-4px;left:0;}

.hb-icon-alien{width:20px;height:20px;position:relative;}
.hb-ia-head{width:14px;height:18px;background:var(--alien);opacity:0.15;border-radius:50% 50% 40% 40%;position:absolute;top:1px;left:3px;}
.hb-ia-eye{width:4px;height:5px;background:var(--alien);border-radius:50%;position:absolute;top:7px;}
.hb-ia-eye-l{left:5px;}
.hb-ia-eye-r{right:5px;}

.hb-icon-discovery{width:20px;height:20px;position:relative;}
.hb-id-ring{width:14px;height:14px;border:2px solid var(--hud);border-radius:50%;position:absolute;top:3px;left:3px;opacity:0.4;}
.hb-id-cross-h{width:18px;height:1px;background:var(--hud);position:absolute;top:10px;left:1px;}
.hb-id-cross-v{width:1px;height:18px;background:var(--hud);position:absolute;top:1px;left:10px;}
.hb-id-dot{width:3px;height:3px;background:var(--hud);border-radius:50%;position:absolute;top:9px;left:9px;}

.hb-icon-social{width:20px;height:20px;position:relative;display:flex;align-items:center;justify-content:center;}
.hb-is-hand{width:8px;height:6px;background:var(--warn);border-radius:2px;opacity:0.5;}
.hb-is-hand-l{transform:rotate(-15deg) translateX(2px);}
.hb-is-hand-r{transform:rotate(15deg) translateX(-2px);}

.hb-icon-shield{width:20px;height:20px;position:relative;}
.hb-ish-body{width:14px;height:16px;background:var(--hud);opacity:0.2;clip-path:polygon(50% 0%,100% 20%,100% 65%,50% 100%,0% 65%,0% 20%);position:absolute;top:2px;left:3px;}

.hb-icon-skull{width:20px;height:20px;position:relative;}
.hb-isk-head{width:14px;height:12px;background:var(--hot);opacity:0.2;border-radius:50% 50% 30% 30%;position:absolute;top:1px;left:3px;}
.hb-isk-eye{width:3px;height:3px;background:var(--hot);border-radius:50%;position:absolute;top:5px;}
.hb-isk-eye-l{left:6px;}
.hb-isk-eye-r{right:6px;}
.hb-isk-jaw{width:8px;height:4px;border-bottom:2px solid var(--hot);border-left:1px solid var(--hot);border-right:1px solid var(--hot);position:absolute;bottom:3px;left:6px;opacity:0.4;}

.hb-icon-medal{width:20px;height:20px;position:relative;}
.hb-imd-circle{width:12px;height:12px;border:2px solid var(--warn);border-radius:50%;position:absolute;top:0;left:4px;}
.hb-imd-ribbon{width:4px;height:8px;position:absolute;bottom:0;}
.hb-imd-ribbon-l{left:5px;background:var(--warn);opacity:0.3;transform:skewX(-10deg);}
.hb-imd-ribbon-r{right:5px;background:var(--warn);opacity:0.3;transform:skewX(10deg);}

.hb-icon-confessional{width:20px;height:20px;position:relative;}
.hb-ic-cam{width:16px;height:10px;background:var(--paper-dim);opacity:0.2;border-radius:2px;position:absolute;top:5px;left:0;}
.hb-ic-lens{width:6px;height:6px;border:2px solid var(--paper-dim);border-radius:50%;position:absolute;top:7px;left:5px;opacity:0.5;}

/* Social card dashed border */
.hb-card.social-event{border:1px dashed var(--warn);background:linear-gradient(135deg,rgba(255,184,54,0.06),var(--bg-1));}
.hb-card.social-event .hb-card-icon{border-color:var(--warn);color:var(--warn);}

/* ═══ MOBILE ═══ */
@media(max-width:980px){.hb-shell{grid-template-columns:1fr;}.hb-side{position:static;max-height:none;}.hb-title-plate{grid-template-columns:1fr;text-align:center;}.hb-title-stats{justify-content:center;}.hb-title-meta{text-align:center;}}
@media(prefers-reduced-motion:reduce){.hb-star,.hb-ufo,.hb-beam,.hb-ground-figures,.hb-ground-fig,.hb-ticker-inner,.hb-rec-dot,.hb-ufo-light,.hb-card,.hb-card.hazard,.hb-card.alien,.hb-visible{animation:none!important;transition:none!important;}}
`;
}

// ──────────────────────────────────────────────────────────
// SIDEBAR
// ──────────────────────────────────────────────────────────
function _buildSidebar(ep, screenKey) {
  return `<div class="hb-side"><div id="hb-sidebar-inner">${_buildSidebarContent(ep, screenKey)}</div></div>`;
}

function _buildSidebarContent(ep, screenKey) {
  const cd = _cd(ep);
  if (!cd) return '<div style="color:var(--paper-dim);text-align:center;padding:20px;font-size:11px;">NO DATA</div>';

  const active = cd.entries?.map(e => e.name) || [];
  const st = _tvState[screenKey];
  const revIdx = st ? st.idx : -1;
  const stepMeta = window._hbStepMeta?.[screenKey];

  // Determine revealed state per player
  const revealedHP = {};
  const revealedDepth = {};
  const revealedSpecimen = {};
  const revealedStatus = {};

  if (stepMeta && revIdx >= 0) {
    for (let i = 0; i <= Math.min(revIdx, stepMeta.length - 1); i++) {
      const m = stepMeta[i];
      if (m?.playerHP) Object.assign(revealedHP, m.playerHP);
      if (m?.playerDepth) Object.entries(m.playerDepth).forEach(([n, d]) => { revealedDepth[n] = Math.max(revealedDepth[n] || 0, d); });
      if (m?.playerSpecimen) Object.assign(revealedSpecimen, m.playerSpecimen);
      if (m?.playerStatus) Object.assign(revealedStatus, m.playerStatus);
    }
  }

  let html = '';

  // Panel 1: Race Progress (depth bars)
  html += `<div class="hb-panel"><div class="hb-panel-head"><span>DEPTH PROGRESS</span><span class="pill">${active.length}</span></div><div class="hb-panel-body"><div class="hb-race">`;
  active.forEach(name => {
    const depth = revealedDepth[name] || 0;
    const maxDepth = 4;
    const pct = Math.round((depth / maxDepth) * 100);
    const entry = cd.entries?.find(e => e.name === name);
    const tc = entry?.tribe ? _tribeColorSafe(entry.tribe) : 'var(--hud)';
    html += `<div class="hb-race-row"><div class="label"><img src="assets/avatars/${slug(name)}.png" class="hb-race-pic" style="border-color:${tc}" onerror="this.style.display='none'"><span class="lname" style="color:${tc}">${name}</span><span class="lpct">RM ${depth}/${maxDepth}</span></div><div class="hb-race-track"><div class="hb-race-fill" style="width:${pct}%;background:linear-gradient(90deg,${tc}80,${tc})"></div></div></div>`;
  });
  html += `</div></div></div>`;

  // Panel 2: Operator Roster (HP + status)
  html += `<div class="hb-panel"><div class="hb-panel-head"><span>OPERATORS</span></div><div class="hb-panel-body"><div class="hb-roster">`;
  active.forEach(name => {
    const hp = revealedHP[name] !== undefined ? revealedHP[name] : 100;
    const hpPct = _hpPercent(hp);
    const hpCls = _hpClass(hp);
    const status = revealedStatus[name] || 'READY';
    const statusCls = status === 'KO' ? 'hb-status-hot' : status === 'EXTRACTING' ? 'hb-status-warn' : status === 'ESCAPED' ? 'hb-status-alien' : 'hb-status-ok';
    const entry = cd.entries?.find(e => e.name === name);
    const tc = entry?.tribe ? _tribeColorSafe(entry.tribe) : 'var(--hud)';
    const rowCls = status === 'KO' ? 'eliminated' : hp < 30 ? 'injured' : '';
    html += `<div class="hb-roster-row ${rowCls}" style="border-left-color:${tc}"><img src="assets/avatars/${slug(name)}.png" class="hb-roster-pic" style="border-color:${tc}" onerror="this.style.display='none'"><div class="hb-roster-info"><div class="hb-roster-name">${name}</div><div class="hb-hp"><div class="hb-hp-fill ${hpCls}" style="width:${hpPct}%"></div></div></div><div class="hb-roster-status ${statusCls}">${status}</div></div>`;
  });
  html += `</div></div></div>`;

  // Panel 3: Artifacts (specimens captured)
  const specimens = [];
  if (revIdx >= 0) {
    active.forEach(name => {
      const spec = revealedSpecimen[name];
      if (spec) specimens.push({ name, ...spec });
    });
  }
  html += `<div class="hb-panel"><div class="hb-panel-head"><span>SPECIMENS</span><span class="pill">${specimens.length}</span></div><div class="hb-panel-body"><div class="hb-art-grid">`;
  if (specimens.length === 0) {
    html += `<div style="color:var(--paper-dim);font-size:10px;text-align:center;padding:10px;">No specimens captured yet</div>`;
  } else {
    specimens.forEach(s => {
      const cls = s.escaped ? '' : s.temperament === 'aggressive' ? 'alive' : 'confirmed';
      const statusColor = s.escaped ? 'var(--hot)' : 'var(--hud)';
      const statusText = s.escaped ? 'LOST' : 'SECURED';
      html += `<div class="hb-art ${cls}"><div class="hb-art-icon">${_temperamentIcon(s.temperament)}</div><div><div class="hb-art-name">${s.name}</div><div class="hb-art-meta">${s.temperament} / ${s.score}pts</div></div><div class="hb-art-status" style="color:${statusColor}">${statusText}</div></div>`;
    });
  }
  html += `</div></div></div>`;

  // Panel 4: Hazard Log
  const hazards = {};
  if (stepMeta && revIdx >= 0) {
    for (let i = 0; i <= Math.min(revIdx, stepMeta.length - 1); i++) {
      const m = stepMeta[i];
      if (m?.hazardType) {
        hazards[m.hazardType] = (hazards[m.hazardType] || 0) + 1;
      }
    }
  }
  html += `<div class="hb-panel"><div class="hb-panel-head"><span>HAZARD LOG</span></div><div class="hb-panel-body"><div class="hb-haz-list">`;
  if (Object.keys(hazards).length === 0) {
    html += `<div style="color:var(--paper-dim);font-size:10px;text-align:center;padding:10px;">No hazards triggered</div>`;
  } else {
    Object.entries(hazards).forEach(([type, count]) => {
      const dotCls = type.toLowerCase().includes('laser') ? 'hb-haz-laser'
        : type.toLowerCase().includes('alarm') || type.toLowerCase().includes('turret') || type.toLowerCase().includes('mine') ? 'hb-haz-mine'
        : type.toLowerCase().includes('alien') ? 'hb-haz-alien-dot'
        : 'hb-haz-fence';
      html += `<div class="hb-haz-item"><div class="hb-haz-dot ${dotCls}"></div><div class="hb-haz-label">${type}</div><div class="hb-haz-count">x${count}</div></div>`;
    });
  }
  html += `</div></div></div>`;

  return html;
}

// ──────────────────────────────────────────────────────────
// MAP
// ──────────────────────────────────────────────────────────
function _buildMap(ep, phase) {
  const cd = _cd(ep);
  if (!cd) return '';
  const active = cd.entries?.map(e => e.name) || [];

  // Build tokens — fan out at perimeter start
  let tokens = '';
  const count = active.length;
  active.forEach((name, idx) => {
    const entry = cd.entries?.find(e => e.name === name);
    const tc = entry?.tribe ? _tribeColorSafe(entry.tribe) : 'var(--hud)';
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const leftOff = (col - (Math.min(count, 4) - 1) / 2) * 3.5;
    const topOff = row * 12;
    const left = 15 + leftOff;
    const top = 70 + topOff;
    tokens += `<div class="hb-tok" id="hb-maptok-${name.replace(/\s+/g, '-')}" style="border-color:${tc};box-shadow:0 0 14px ${tc};left:${left}%;top:${top}%"><img src="assets/avatars/${slug(name)}.png" class="hb-tok-pic" onerror="this.outerHTML='<span style=\\'color:${tc}\\'>${name.charAt(0)}</span>'"></div>`;
  });

  return `
<div class="hb-map-wrap">
  <div class="hb-map-header">
    <span class="hb-map-title">FACILITY SCHEMATIC</span>
    <span class="hb-map-coords">37.2350N 115.8111W</span>
    <span class="hb-map-phase">${phase}</span>
  </div>
  <div class="hb-map">
    <svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid meet">
      <!-- Perimeter fence -->
      <rect class="map-fence" x="20" y="20" width="760" height="160" rx="4"/>
      <!-- Buildings -->
      <rect class="map-bldg" x="80" y="60" width="100" height="80" rx="2"/>
      <text class="map-text" x="105" y="105">PERIMETER</text>
      <rect class="map-bldg" x="230" y="50" width="120" height="100" rx="2"/>
      <text class="map-text" x="265" y="105">HANGAR</text>
      <rect class="map-bldg-2" x="400" y="40" width="110" height="110" rx="2"/>
      <text class="map-text" x="430" y="100">LABS</text>
      <rect class="map-bldg" x="560" y="50" width="100" height="90" rx="2"/>
      <text class="map-text" x="575" y="100">DEEP STORAGE</text>
      <!-- Exfil -->
      <rect class="map-bldg-2" x="700" y="80" width="60" height="50" rx="2"/>
      <text class="map-text" x="710" y="110">EXFIL</text>
      <!-- Paths -->
      <path class="map-path" d="M180 100 L230 100"/>
      <path class="map-path" d="M350 100 L400 100"/>
      <path class="map-path" d="M510 100 L560 100"/>
      <path class="map-path" d="M660 100 L700 105"/>
    </svg>
    ${tokens}
    <div class="hb-hazard-pulse" id="hb-map-hazard-pulse" style="border-color:var(--hot);display:none;"></div>
  </div>
</div>`;
}

// ──────────────────────────────────────────────────────────
// SHELL WRAPPER
// ──────────────────────────────────────────────────────────
function _shell(content, ep, screenKey, phase = 'ENTRY') {
  const cd = _cd(ep);
  if (!cd) return '<div style="color:#aaa;text-align:center;padding:60px;">No challenge data available.</div>';

  window._hbEpRecord = ep;
  window._hbPhaseData = phase;

  const sidebar = _buildSidebar(ep, screenKey);
  const map = _buildMap(ep, phase);

  // Generate stars
  let starsHtml = '';
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() * 100).toFixed(1);
    const y = (Math.random() * 60).toFixed(1);
    const delay = (Math.random() * 4).toFixed(1);
    starsHtml += `<div class="hb-star" style="left:${x}%;top:${y}%;animation-delay:${delay}s;opacity:${(0.2 + Math.random() * 0.6).toFixed(2)}"></div>`;
  }

  return `
<style>${_getCSS()}</style>
<div class="hb-bg"></div>
<div class="hb-grid"></div>
<div class="hb-stars">${starsHtml}</div>
<div class="hb-scanlines"></div>
<div class="hb-vignette"></div>
<div class="hb-broadcast">
  <div class="hb-rec"><div class="hb-rec-dot"></div>REC</div>
  <div class="hb-channel">CH-51 SECURE</div>
  <div class="hb-ticker"><div class="hb-ticker-inner"><span>ALERT</span> FACILITY BREACH DETECTED <span>|</span> CONTAINMENT PROTOCOL ACTIVE <span>|</span> ALL PERSONNEL REPORT TO STATIONS <span>|</span> SPECIMEN TRANSPORT AUTHORIZED <span>|</span> ALARM LEVEL: ${cd.alarmTriggered ? 'RED' : 'GREEN'}</div></div>
  <div class="hb-clock">${phase}</div>
  <div class="hb-feed-id">FEED-${Math.floor(Math.random() * 9000 + 1000)}</div>
</div>
<div class="hb-shell">
  <div class="hb-main">
    ${map}
    <div class="hb-feed">
      ${content}
    </div>
  </div>
  ${sidebar}
</div>`;
}

// ──────────────────────────────────────────────────────────
// SCREEN 1: TITLE CARD (static)
// ──────────────────────────────────────────────────────────
export function rpBuildHBTitleCard(ep) {
  const cd = _cd(ep);
  if (!cd) return '';

  const active = cd.entries?.map(e => e.name) || [];
  const epNum = gs.episodeHistory?.length || '?';
  const isMerged = cd.phase === 'post-merge';

  // Avatar figures
  const figuresHtml = active.map(name =>
    `<img class="hb-ground-fig" src="assets/avatars/${slug(name)}.png" alt="${name}" style="animation-delay:${(Math.random() * 1.5).toFixed(1)}s" onerror="this.style.display='none'">`
  ).join('');

  // Team blocks (pre-merge) or operator count (post-merge)
  let metaLeft = '', metaRight = '';
  if (!isMerged && cd.tribeResults) {
    metaLeft = cd.tribeResults.map(tr => `<b style="color:${_tribeColorSafe(tr.tribeName)}">${tr.tribeName}</b><br>${tr.members.length} operators`).join('<br>');
    metaRight = `<div class="hb-title-stats">${cd.tribeResults.map(tr => `<div class="hb-stat"><span class="hb-stat-v" style="color:${_tribeColorSafe(tr.tribeName)}">${tr.members.length}</span><span class="hb-stat-l">${tr.tribeName}</span></div>`).join('')}</div>`;
  } else {
    metaLeft = `<b>OPERATORS</b>${active.length} operatives deployed`;
    metaRight = `<div class="hb-title-stats"><div class="hb-stat"><span class="hb-stat-v">${active.length}</span><span class="hb-stat-l">OPERATORS</span></div><div class="hb-stat"><span class="hb-stat-v">4</span><span class="hb-stat-l">DEPTH LVL</span></div></div>`;
  }

  const content = `
<div class="hb-ufo-scene">
  <div class="hb-ufo">
    <div class="hb-ufo-dome"></div>
    <div class="hb-ufo-body">
      <div class="hb-ufo-lights">
        <div class="hb-ufo-light"></div>
        <div class="hb-ufo-light"></div>
        <div class="hb-ufo-light"></div>
        <div class="hb-ufo-light"></div>
        <div class="hb-ufo-light"></div>
      </div>
    </div>
    <div class="hb-beam"></div>
  </div>
  <div class="hb-desert"></div>
  <div class="hb-ground-figures">${figuresHtml}</div>
</div>
<div class="hb-title-plate">
  <div class="hb-title-meta">${metaLeft}</div>
  <div class="hb-title-main">
    <div class="hb-title-eyebrow">EPISODE ${epNum}</div>
    <div class="hb-title-name">OPERATION:<br>HANGAR BLACK</div>
    <div class="hb-title-sub">FACILITY BREACH / SPECIMEN HUNT / EXTRACTION</div>
  </div>
  <div>${metaRight}</div>
</div>
<div style="text-align:center;padding:30px 0;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.4em;color:var(--hud-dim);animation:blink 1.5s infinite;">PRESS REVEAL TO BEGIN BRIEFING</div>`;

  // Title card is static — no reveals needed, use _shell but without map
  window._hbEpRecord = ep;
  window._hbPhaseData = 'BRIEFING';

  let starsHtml = '';
  for (let i = 0; i < 60; i++) {
    starsHtml += `<div class="hb-star" style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 60).toFixed(1)}%;animation-delay:${(Math.random() * 4).toFixed(1)}s;opacity:${(0.2 + Math.random() * 0.6).toFixed(2)}"></div>`;
  }

  return `
<style>${_getCSS()}</style>
<div class="hb-bg"></div>
<div class="hb-grid"></div>
<div class="hb-stars">${starsHtml}</div>
<div class="hb-scanlines"></div>
<div class="hb-vignette"></div>
<div class="hb-broadcast">
  <div class="hb-rec"><div class="hb-rec-dot"></div>REC</div>
  <div class="hb-channel">CH-51 CLASSIFIED</div>
  <div class="hb-ticker"><div class="hb-ticker-inner"><span>STANDBY</span> OPERATION HANGAR BLACK COMMENCING <span>|</span> ALL TEAMS REPORT TO STAGING AREA <span>|</span> FACILITY LOCKDOWN IN EFFECT</div></div>
  <div class="hb-clock">BRIEFING</div>
  <div class="hb-feed-id">FEED-0001</div>
</div>
<div style="max-width:1100px;margin:0 auto;padding:16px;position:relative;z-index:5;">
  ${content}
</div>`;
}

// ──────────────────────────────────────────────────────────
// SCREEN 2: ENTRY PHASE (reveal per player)
// ──────────────────────────────────────────────────────────
export function rpBuildHBEntry(ep) {
  const cd = _cd(ep);
  if (!cd) return '';

  const screenKey = 'hb-entry';
  const suffix = 'entry';
  const entries = cd.entries || [];
  if (!window._hbStepMeta) window._hbStepMeta = {};

  const stepMeta = [];
  let cards = '';
  let stepIdx = 0;

  // Host commentary
  if (cd.hostEntry) {
    cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
      <div class="hb-card briefing">
        <div class="hb-card-head">${_icon('briefing')}<div class="hb-card-who" style="color:var(--hud)">${host()}</div><div class="hb-card-tag" style="border-color:var(--hud);color:var(--hud)">HOST</div></div>
        <div class="hb-card-body">${cd.hostEntry}</div>
      </div></div>`;
    stepMeta.push({});
    stepIdx++;
  }

  // Group by tribe if pre-merge
  const isMerged = cd.phase === 'post-merge';
  if (!isMerged) {
    const tribes = {};
    entries.forEach(e => {
      if (!tribes[e.tribe]) tribes[e.tribe] = [];
      tribes[e.tribe].push(e);
    });

    Object.entries(tribes).forEach(([tribeName, members]) => {
      const captain = members.find(m => m.captain);
      const tc = _tribeColorSafe(tribeName);

      // Tribe header + captain pick
      if (captain) {
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-section-bar" style="border-left-color:${tc}">
            <span class="hb-section-tag" style="color:${tc}">${tribeName.toUpperCase()}</span>
            <span class="hb-section-title">BREACH: ${captain.methodLabel.toUpperCase()}</span>
            <span class="hb-section-meta">CPT: ${captain.name}</span>
          </div></div>`;
        stepMeta.push({});
        stepIdx++;
      }

      // Each member entry
      members.forEach(e => {
        const cardType = e.passed ? 'movement' : 'hazard';
        const chipCls = e.passed ? 'ok' : 'bad';
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card ${cardType}">
            <div class="hb-card-head">${_icon(e.passed ? 'movement' : 'hazard')}
              ${portrait(e.name, 28)}
              <div class="hb-card-who" style="color:${tc}">${e.name}</div>
              <div class="hb-card-tag" style="border-color:${tc};color:${tc}">${e.methodLabel.toUpperCase()}</div>
            </div>
            <div class="hb-card-body">${e.narrative}</div>
            <div class="hb-card-foot">
              <div class="hb-chip ${chipCls}">${e.passed ? 'CLEAN ENTRY' : 'ROUGH ENTRY'}</div>
              <div class="hb-chip ${e.hpCost > 10 ? 'bad' : 'warn'}">HP -${e.hpCost}</div>
            </div>
          </div></div>`;
        stepMeta.push({
          playerHP: { [e.name]: 100 - e.hpCost },
          playerStatus: { [e.name]: 'INSIDE' }
        });
        stepIdx++;
      });
    });
  } else {
    // Post-merge: individual entries
    entries.forEach(e => {
      const cardType = e.passed ? 'movement' : 'hazard';
      const chipCls = e.passed ? 'ok' : 'bad';
      cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
        <div class="hb-card ${cardType}">
          <div class="hb-card-head">${_icon(e.passed ? 'movement' : 'hazard')}
            ${portrait(e.name, 28)}
            <div class="hb-card-who">${e.name}</div>
            <div class="hb-card-tag">${e.methodLabel.toUpperCase()}</div>
          </div>
          <div class="hb-card-body">${e.narrative}</div>
          <div class="hb-card-foot">
            <div class="hb-chip ${chipCls}">${e.passed ? 'CLEAN ENTRY' : 'ROUGH ENTRY'}</div>
            <div class="hb-chip ${e.hpCost > 10 ? 'bad' : 'warn'}">HP -${e.hpCost}</div>
          </div>
        </div></div>`;
      stepMeta.push({
        playerHP: { [e.name]: 100 - e.hpCost },
        playerStatus: { [e.name]: 'INSIDE' },
        positions: { [e.name]: 'perimeter' }
      });
      stepIdx++;
    });
  }

  const totalSteps = stepIdx;
  window._hbStepMeta[screenKey] = stepMeta;

  const controls = `
<div class="hb-controls" id="hb-controls-${suffix}">
  <div class="hb-progress"><div class="hb-progress-fill" style="width:0%"></div></div>
  <button class="hb-btn primary" onclick="hbRevealNext('${screenKey}',${totalSteps})">REVEAL</button>
  <span id="hb-counter-${suffix}" style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--hud-dim);letter-spacing:0.3em;text-align:center;">0 / ${totalSteps}</span>
  <button class="hb-btn" onclick="hbRevealAll('${screenKey}',${totalSteps})">REVEAL ALL</button>
</div>`;

  return _shell(cards + controls, ep, screenKey, 'ENTRY');
}

// ──────────────────────────────────────────────────────────
// SCREEN 3: HUNT PHASE (reveal per room per player)
// ──────────────────────────────────────────────────────────
export function rpBuildHBHunt(ep) {
  const cd = _cd(ep);
  if (!cd) return '';

  const screenKey = 'hb-hunt';
  const suffix = 'hunt';
  const huntRuns = cd.huntRuns || [];
  if (!window._hbStepMeta) window._hbStepMeta = {};

  const stepMeta = [];
  let cards = '';
  let stepIdx = 0;

  // Host commentary
  if (cd.hostHunt) {
    cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
      <div class="hb-card briefing">
        <div class="hb-card-head">${_icon('briefing')}<div class="hb-card-who" style="color:var(--hud)">${host()}</div><div class="hb-card-tag" style="border-color:var(--hud);color:var(--hud)">HOST</div></div>
        <div class="hb-card-body">${cd.hostHunt}</div>
      </div></div>`;
    stepMeta.push({});
    stepIdx++;
  }

  // Track HP state from entry
  const runningHP = {};
  (cd.entries || []).forEach(e => {
    runningHP[e.name] = 100 - (e.hpCost || 0);
  });

  const huntSocialEvts = cd.huntSocialEvents || [];
  let socialEvtIdx = 0;
  const usedComms = new Set();

  huntRuns.forEach((run, runIdx) => {
    const name = run.name;
    const entry = cd.entries?.find(e => e.name === name);
    const tc = entry?.tribe ? _tribeColorSafe(entry.tribe) : 'var(--hud)';

    if (run.rooms.length === 0 && run.koRound === 0) {
      // Already KO'd from entry
      cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
        <div class="hb-card hazard">
          <div class="hb-card-head">${_icon('skull')}${portrait(name, 28)}<div class="hb-card-who" style="color:var(--hot)">${name}</div><div class="hb-card-tag" style="border-color:var(--hot);color:var(--hot)">KO FROM ENTRY</div></div>
          <div class="hb-card-body">${name} never made it past the entry. HP depleted.</div>
        </div></div>`;
      stepMeta.push({ playerHP: { [name]: 0 }, playerStatus: { [name]: 'KO' } });
      stepIdx++;
      return;
    }

    // Player header
    cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
      <div class="hb-section-bar" style="border-left-color:${tc}">
        <span class="hb-section-tag" style="color:${tc}">${name.toUpperCase()}</span>
        <span class="hb-section-title">FACILITY RUN</span>
        <span class="hb-section-meta">ENTRY HP: ${Math.round(runningHP[name] || 100)}</span>
      </div></div>`;
    stepMeta.push({});
    stepIdx++;

    run.rooms.forEach(room => {
      // Depth-shift atmosphere card
      const zoneKey = room.depth <= 1 ? 'shallow' : room.depth <= 3 ? 'mid' : 'deep';
      const prevRoom = run.rooms[run.rooms.indexOf(room) - 1];
      const prevZoneKey = !prevRoom ? 'shallow' : prevRoom.depth <= 1 ? 'shallow' : prevRoom.depth <= 3 ? 'mid' : 'deep';
      if (zoneKey !== prevZoneKey || (!prevRoom && room.depth > 1)) {
        const flavorPool = DEPTH_SHIFT_FLAVOR[zoneKey];
        if (flavorPool) {
          cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
            <div class="hb-card briefing" style="border-left:3px solid ${room.depth <= 1 ? 'var(--hud)' : room.depth <= 3 ? 'var(--warn)' : 'var(--hot)'};background:rgba(0,0,0,0.3)">
              <div class="hb-card-head"><div class="hb-card-who" style="color:var(--paper-dim);font-size:10px;letter-spacing:0.3em;text-transform:uppercase">DEPTH SHIFT — ${zoneKey.toUpperCase()}</div></div>
              <div class="hb-card-body" style="font-style:italic;color:var(--paper-dim);font-size:12px">${pick(flavorPool)}</div>
            </div></div>`;
          stepMeta.push({});
          stepIdx++;
        }
      }

      const depthZone = room.depth <= 1 ? 'perimeter' : room.depth <= 2 ? 'hangar' : room.depth <= 3 ? 'labs' : 'deep';

      // Update running HP
      if (room.hpLoss) {
        runningHP[name] = Math.max(0, (runningHP[name] || 100) - room.hpLoss);
      }

      // Room description + hazard card
      const hazardType = room.passed ? 'movement' : 'hazard';
      const tierColor = _tierColor(room.tier);

      cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
        <div class="hb-card ${hazardType}">
          <div class="hb-card-head">
            ${_icon(room.passed ? 'movement' : 'hazard')}
            ${portrait(name, 28)}
            <div class="hb-card-who" style="color:${room.passed ? tc : 'var(--hot)'}">${name}</div>
            <div class="hb-card-tag" style="border-color:${tierColor};color:${tierColor}">RM ${room.depth} / ${_tierLabel(room.tier)}</div>
          </div>
          <div class="hb-card-body">
            ${room.roomDesc ? `<div style="font-size:11px;color:var(--paper-dim);font-style:italic;margin-bottom:6px;">${room.roomDesc}</div>` : ''}
            ${room.narrative}
          </div>
          ${!room.passed ? `<div class="hb-cause-effect">
            <div class="hb-ce-side"><span class="lbl">HAZARD</span>${room.hazardType}</div>
            <div class="hb-ce-arrow">&rarr;</div>
            <div class="hb-ce-side"><span class="lbl">EFFECT</span>HP -${room.hpLoss} (${Math.round(runningHP[name])} remaining)</div>
          </div>` : ''}
          <div class="hb-card-foot">
            <div class="hb-chip ${room.passed ? 'ok' : 'bad'}">${room.passed ? 'CLEARED' : 'HIT'}</div>
            <div class="hb-chip warn">${room.hazardType}</div>
          </div>
        </div></div>`;

      const metaEntry = {
        playerHP: { [name]: Math.round(runningHP[name] || 0) },
        playerDepth: { [name]: room.depth },
        playerStatus: { [name]: room.decision === 'ko' ? 'KO' : 'HUNTING' },
        positions: { [name]: depthZone },
        hazardType: room.passed ? null : room.hazardType
      };
      stepMeta.push(metaEntry);
      stepIdx++;

      // Specimen found card
      if (room.specimenFound && room.specimenNarrative) {
        const specCard = room.specimenFound.score >= 10 ? 'discovery' : 'alien';
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card ${specCard}">
            <div class="hb-card-head">
              ${_temperamentIcon(room.specimenFound.temperament)}
              ${portrait(name, 28)}
              <div class="hb-card-who">${name}</div>
              <div class="hb-card-tag" style="border-color:var(--alien);color:var(--alien)">SPECIMEN</div>
            </div>
            <div class="hb-card-body">${room.specimenNarrative}</div>
            <div class="hb-card-foot">
              <div class="hb-chip" style="color:var(--alien);border-color:var(--alien)">${room.specimenFound.temperament.toUpperCase()}</div>
              <div class="hb-chip ok">${room.specimenFound.score} PTS</div>
            </div>
          </div></div>`;
        stepMeta.push({
          playerSpecimen: { [name]: { temperament: room.specimenFound.temperament, score: room.specimenFound.score, escaped: false } }
        });
        stepIdx++;
      } else if (!room.specimenFound && room.specimenNarrative) {
        // No specimen text
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card confessional">
            <div class="hb-card-head">${_icon('discovery')}${portrait(name, 28)}<div class="hb-card-who">${name}</div></div>
            <div class="hb-card-body">${room.specimenNarrative}</div>
          </div></div>`;
        stepMeta.push({});
        stepIdx++;
      }

      // Decision card (advance/secure/ko)
      if (room.decision === 'ko') {
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card hazard">
            <div class="hb-card-head">${_icon('skull')}${portrait(name, 28)}<div class="hb-card-who" style="color:var(--hot)">${name}</div><div class="hb-card-tag" style="border-color:var(--hot);color:var(--hot)">KO</div></div>
            <div class="hb-card-body">${room.confessional || `${name} is down. HP depleted. All specimens lost.`}</div>
          </div></div>`;
        stepMeta.push({ playerHP: { [name]: 0 }, playerStatus: { [name]: 'KO' } });
        stepIdx++;
      } else if (room.decision === 'advance') {
        if (room.confessional) {
          cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
            <div class="hb-card confessional">
              <div class="hb-card-head">${_icon('confessional')}${portrait(name, 28)}<div class="hb-card-who">${name}</div><div class="hb-card-tag" style="border-color:var(--paper-dim);color:var(--paper-dim)">CONFESSIONAL</div></div>
              <div class="hb-card-body">${room.confessional}</div>
            </div></div>`;
          stepMeta.push({});
          stepIdx++;
        }
      } else if (room.decision === 'secure') {
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card briefing">
            <div class="hb-card-head">${_icon('shield')}${portrait(name, 28)}<div class="hb-card-who" style="color:var(--hud)">${name}</div><div class="hb-card-tag" style="border-color:var(--hud);color:var(--hud)">SECURE</div></div>
            <div class="hb-card-body">${room.confessional || `${name} secures the specimen and heads for extraction.`}</div>
          </div></div>`;
        stepMeta.push({ playerStatus: { [name]: 'EXTRACTING' } });
        stepIdx++;
      }
    });

    // ── SOCIAL EVENTS after this player's run ──
    if ((runIdx + 1) % 2 === 0 || runIdx === huntRuns.length - 1) {
      // Emit any hunt social events queued at this point
      const eventsToShow = Math.min(2, huntSocialEvts.length - socialEvtIdx);
      for (let sei = 0; sei < eventsToShow; sei++) {
        const se = huntSocialEvts[socialEvtIdx];
        if (!se) break;
        socialEvtIdx++;
        const socialIcon = se.type === 'guard' ? 'shield' : se.type === 'sabotage' || se.type === 'steal' ? 'skull' : 'social';
        const socialCardCls = se.type === 'sabotage' || se.type === 'steal' ? 'hazard' : 'social-event';
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card ${socialCardCls}" style="border-left:3px dashed var(--warn)">
            <div class="hb-card-head">
              ${_icon(socialIcon)}
              ${portrait(se.actor, 28)}
              ${se.target ? portrait(se.target, 28) : ''}
              <div class="hb-card-who">${se.actor}${se.target ? ` → ${se.target}` : ''}</div>
              <div class="hb-card-tag" style="border-color:var(--warn);color:var(--warn)">${se.type.toUpperCase()}</div>
            </div>
            <div class="hb-card-body">${se.narrative}</div>
            <div class="hb-card-foot">
              <div class="hb-chip ${se.bondDelta > 0 ? 'ok' : se.bondDelta < 0 ? 'bad' : 'warn'}">BOND ${se.bondDelta > 0 ? '+' : ''}${se.bondDelta}</div>
            </div>
          </div></div>`;
        const stealMeta = {};
        if (se.type === 'steal' && se.stolenSpecimen && se.target) {
          stealMeta.playerSpecimen = {
            [se.target]: { ...se.stolenSpecimen, escaped: true },
            [se.actor]: { ...se.stolenSpecimen, escaped: false }
          };
        }
        stepMeta.push(stealMeta);
        stepIdx++;
      }

      // Comm chatter atmosphere card
      let commMsg;
      for (let ci = 0; ci < FACILITY_COMMS.length; ci++) {
        const candidate = FACILITY_COMMS[Math.floor(Math.random() * FACILITY_COMMS.length)];
        const msg = candidate();
        if (!usedComms.has(msg)) { usedComms.add(msg); commMsg = msg; break; }
      }
      if (commMsg) {
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card briefing" style="border-left:2px solid var(--hud-dim);opacity:0.85">
            <div class="hb-card-head">${_icon('radio')}<div class="hb-card-who" style="color:var(--hud-dim);font-size:10px;letter-spacing:0.2em">FACILITY COMMS</div></div>
            <div class="hb-card-body" style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--hud-dim);letter-spacing:0.05em">${commMsg}</div>
          </div></div>`;
        stepMeta.push({});
        stepIdx++;
      }
    }
  });

  const totalSteps = stepIdx;
  window._hbStepMeta[screenKey] = stepMeta;

  const controls = `
<div class="hb-controls" id="hb-controls-${suffix}">
  <div class="hb-progress"><div class="hb-progress-fill" style="width:0%"></div></div>
  <button class="hb-btn primary" onclick="hbRevealNext('${screenKey}',${totalSteps})">REVEAL</button>
  <span id="hb-counter-${suffix}" style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--hud-dim);letter-spacing:0.3em;text-align:center;">0 / ${totalSteps}</span>
  <button class="hb-btn" onclick="hbRevealAll('${screenKey}',${totalSteps})">REVEAL ALL</button>
</div>`;

  return _shell(cards + controls, ep, screenKey, 'HUNT');
}

// ──────────────────────────────────────────────────────────
// SCREEN 4: EXTRACTION PHASE (reveal per event)
// ──────────────────────────────────────────────────────────
export function rpBuildHBExtract(ep) {
  const cd = _cd(ep);
  if (!cd) return '';

  const screenKey = 'hb-extract';
  const suffix = 'extract';
  const extractions = cd.extractions || [];
  if (!window._hbStepMeta) window._hbStepMeta = {};

  const stepMeta = [];
  let cards = '';
  let stepIdx = 0;

  // Host commentary
  if (cd.hostExtract) {
    cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
      <div class="hb-card briefing">
        <div class="hb-card-head">${_icon('briefing')}<div class="hb-card-who" style="color:var(--hud)">${host()}</div><div class="hb-card-tag" style="border-color:var(--hud);color:var(--hud)">HOST</div></div>
        <div class="hb-card-body">${cd.hostExtract}</div>
      </div></div>`;
    stepMeta.push({});
    stepIdx++;
  }

  // Build running HP from entry + hunt
  const runningHP = {};
  (cd.entries || []).forEach(e => { runningHP[e.name] = 100 - (e.hpCost || 0); });
  (cd.huntRuns || []).forEach(run => {
    run.rooms.forEach(room => {
      if (room.hpLoss) runningHP[run.name] = Math.max(0, (runningHP[run.name] || 100) - room.hpLoss);
    });
  });

  const extSocialEvts = cd.extractSocialEvents || [];
  let extSocialIdx = 0;
  const usedExtComms = new Set();

  extractions.forEach((ext, extRunIdx) => {
    const name = ext.name;
    const entry = cd.entries?.find(e => e.name === name);
    const tc = entry?.tribe ? _tribeColorSafe(entry.tribe) : 'var(--hud)';

    if (!ext.finalSpecimen && ext.hazards.length === 0) {
      // No specimen / KO'd — skip or show brief
      cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
        <div class="hb-card confessional">
          <div class="hb-card-head">${_icon('skull')}${portrait(name, 28)}<div class="hb-card-who" style="color:var(--paper-dim)">${name}</div><div class="hb-card-tag" style="border-color:var(--paper-dim);color:var(--paper-dim)">NO EXTRACT</div></div>
          <div class="hb-card-body">${name} has nothing to extract. KO'd or came up empty.</div>
        </div></div>`;
      stepMeta.push({ playerStatus: { [name]: 'KO' } });
      stepIdx++;
      return;
    }

    // Player extraction header
    cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
      <div class="hb-section-bar" style="border-left-color:${tc}">
        <span class="hb-section-tag" style="color:${tc}">${name.toUpperCase()}</span>
        <span class="hb-section-title">EXTRACTION RUN</span>
        <span class="hb-section-meta">SPECIMEN: ${ext.finalSpecimen?.temperament || 'NONE'}</span>
      </div></div>`;
    stepMeta.push({ playerStatus: { [name]: 'EXTRACTING' } });
    stepIdx++;

    // Hazard cards
    ext.hazards.forEach(hz => {
      if (hz.hpLoss) runningHP[name] = Math.max(0, (runningHP[name] || 0) - hz.hpLoss);

      const cardType = hz.passed ? 'movement' : 'hazard';
      cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
        <div class="hb-card ${cardType}">
          <div class="hb-card-head">
            ${_icon(hz.passed ? 'movement' : 'hazard')}
            ${portrait(name, 28)}
            <div class="hb-card-who" style="color:${hz.passed ? tc : 'var(--hot)'}">${name}</div>
            <div class="hb-card-tag" style="border-color:${hz.passed ? 'var(--hud)' : 'var(--hot)'};color:${hz.passed ? 'var(--hud)' : 'var(--hot)'}">RM ${hz.room} EXIT</div>
          </div>
          <div class="hb-card-body">${hz.narrative}</div>
          ${!hz.passed ? `<div class="hb-cause-effect">
            <div class="hb-ce-side"><span class="lbl">HAZARD</span>${hz.hazardType}</div>
            <div class="hb-ce-arrow">&rarr;</div>
            <div class="hb-ce-side"><span class="lbl">DAMAGE</span>HP -${hz.hpLoss} (${Math.round(runningHP[name])} remaining)</div>
          </div>` : ''}
          <div class="hb-card-foot">
            <div class="hb-chip ${hz.passed ? 'ok' : 'bad'}">${hz.passed ? 'DODGED' : 'HIT'}</div>
          </div>
        </div></div>`;

      stepMeta.push({
        playerHP: { [name]: Math.round(runningHP[name] || 0) },
        hazardType: hz.passed ? null : hz.hazardType,
        positions: { [name]: 'exfil' }
      });
      stepIdx++;

      // Specimen escape
      if (hz.specimenEscaped) {
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card alien">
            <div class="hb-card-head">${_icon('alien')}${portrait(name, 28)}<div class="hb-card-who" style="color:var(--alien)">${name}</div><div class="hb-card-tag" style="border-color:var(--alien);color:var(--alien)">SPECIMEN LOST</div></div>
            <div class="hb-card-body">${hz.escapeNarrative || 'The specimen broke free and vanished.'}</div>
          </div></div>`;
        stepMeta.push({
          playerSpecimen: { [name]: { ...ext.finalSpecimen, escaped: true } },
          playerStatus: { [name]: 'ESCAPED' }
        });
        stepIdx++;
      } else if (hz.escapeNarrative && !hz.passed) {
        // Specimen held
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card discovery">
            <div class="hb-card-head">${_icon('shield')}${portrait(name, 28)}<div class="hb-card-who" style="color:var(--hud)">${name}</div><div class="hb-card-tag" style="border-color:var(--hud);color:var(--hud)">HELD</div></div>
            <div class="hb-card-body">${hz.escapeNarrative}</div>
          </div></div>`;
        stepMeta.push({});
        stepIdx++;
      }
    });

    // Confessional if aggressive extract
    if (ext.confessional) {
      cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
        <div class="hb-card confessional">
          <div class="hb-card-head">${_icon('confessional')}${portrait(name, 28)}<div class="hb-card-who">${name}</div><div class="hb-card-tag" style="border-color:var(--paper-dim);color:var(--paper-dim)">CONFESSIONAL</div></div>
          <div class="hb-card-body">${ext.confessional}</div>
        </div></div>`;
      stepMeta.push({});
      stepIdx++;
    }

    // ── SOCIAL EVENTS + COMMS between extraction runs ──
    if ((extRunIdx + 1) % 2 === 0 || extRunIdx === extractions.length - 1) {
      const eventsToShow = Math.min(2, extSocialEvts.length - extSocialIdx);
      for (let sei = 0; sei < eventsToShow; sei++) {
        const se = extSocialEvts[extSocialIdx];
        if (!se) break;
        extSocialIdx++;
        const socialIcon = se.type === 'guard' ? 'shield' : se.type === 'sabotage' || se.type === 'steal' ? 'skull' : 'social';
        const socialCardCls = se.type === 'sabotage' || se.type === 'steal' ? 'hazard' : 'social-event';
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card ${socialCardCls}" style="border-left:3px dashed var(--warn)">
            <div class="hb-card-head">
              ${_icon(socialIcon)}
              ${portrait(se.actor, 28)}
              ${se.target ? portrait(se.target, 28) : ''}
              <div class="hb-card-who">${se.actor}${se.target ? ` → ${se.target}` : ''}</div>
              <div class="hb-card-tag" style="border-color:var(--warn);color:var(--warn)">${se.type.toUpperCase()}</div>
            </div>
            <div class="hb-card-body">${se.narrative}</div>
            <div class="hb-card-foot">
              <div class="hb-chip ${se.bondDelta > 0 ? 'ok' : se.bondDelta < 0 ? 'bad' : 'warn'}">BOND ${se.bondDelta > 0 ? '+' : ''}${se.bondDelta}</div>
            </div>
          </div></div>`;
        const extStealMeta = {};
        if (se.type === 'steal' && se.stolenSpecimen && se.target) {
          extStealMeta.playerSpecimen = {
            [se.target]: { ...se.stolenSpecimen, escaped: true },
            [se.actor]: { ...se.stolenSpecimen, escaped: false }
          };
        }
        stepMeta.push(extStealMeta);
        stepIdx++;
      }

      let commMsg;
      for (let ci = 0; ci < FACILITY_COMMS.length; ci++) {
        const candidate = FACILITY_COMMS[Math.floor(Math.random() * FACILITY_COMMS.length)];
        const msg = candidate();
        if (!usedExtComms.has(msg)) { usedExtComms.add(msg); commMsg = msg; break; }
      }
      if (commMsg) {
        cards += `<div id="hb-step-${suffix}-${stepIdx}" class="hb-hidden">
          <div class="hb-card briefing" style="border-left:2px solid var(--hud-dim);opacity:0.85">
            <div class="hb-card-head">${_icon('radio')}<div class="hb-card-who" style="color:var(--hud-dim);font-size:10px;letter-spacing:0.2em">FACILITY COMMS</div></div>
            <div class="hb-card-body" style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--hud-dim);letter-spacing:0.05em">${commMsg}</div>
          </div></div>`;
        stepMeta.push({});
        stepIdx++;
      }
    }
  });

  const totalSteps = stepIdx;
  window._hbStepMeta[screenKey] = stepMeta;

  const controls = `
<div class="hb-controls" id="hb-controls-${suffix}">
  <div class="hb-progress"><div class="hb-progress-fill" style="width:0%"></div></div>
  <button class="hb-btn primary" onclick="hbRevealNext('${screenKey}',${totalSteps})">REVEAL</button>
  <span id="hb-counter-${suffix}" style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--hud-dim);letter-spacing:0.3em;text-align:center;">0 / ${totalSteps}</span>
  <button class="hb-btn" onclick="hbRevealAll('${screenKey}',${totalSteps})">REVEAL ALL</button>
</div>`;

  return _shell(cards + controls, ep, screenKey, 'EXTRACTION');
}

// ──────────────────────────────────────────────────────────
// SCREEN 5: RESULTS (static)
// ──────────────────────────────────────────────────────────
export function rpBuildHBResults(ep) {
  const cd = _cd(ep);
  if (!cd) return '';

  const isMerged = cd.phase === 'post-merge';
  let content = '';

  if (isMerged) {
    // Post-merge: individual scores, immunity winner
    const sorted = Object.entries(cd.scores || {}).sort(([, a], [, b]) => b - a);
    const winner = cd.immunityWinner || sorted[0]?.[0];

    content += `<div style="text-align:center;padding:30px 0;">
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.4em;color:var(--warn);margin-bottom:6px;">FINAL SCORES</div>
      <div style="font-family:'Black Ops One',sans-serif;font-size:32px;color:var(--paper);letter-spacing:0.06em;text-shadow:0 0 20px rgba(146,255,179,0.2);">OPERATION COMPLETE</div>
    </div>`;

    // Winner card
    content += `<div class="hb-card victory" style="margin:16px auto;max-width:500px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:16px;">
        ${_icon('medal')}
        ${portrait(winner, 48)}
        <div>
          <div class="hb-card-who" style="color:var(--warn);font-size:20px">${winner}</div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--hud);letter-spacing:0.3em;">IMMUNITY WINNER</div>
        </div>
      </div>
      <div style="font-family:'Orbitron',sans-serif;font-size:28px;color:var(--warn);margin-top:12px;">${cd.scores[winner]?.toFixed(1) || '0.0'} PTS</div>
    </div>`;

    // All scores
    sorted.forEach(([name, score], idx) => {
      if (name === winner) return;
      const isKo = score <= 0;
      content += `<div class="hb-card ${isKo ? 'hazard' : 'movement'}" style="margin:6px auto;max-width:500px;">
        <div class="hb-card-head">
          <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:var(--paper-dim);min-width:28px;">#${idx + 1}</div>
          ${portrait(name, 28)}
          <div class="hb-card-who">${name}</div>
          <div class="hb-card-tag" style="border-color:${isKo ? 'var(--hot)' : 'var(--hud)'};color:${isKo ? 'var(--hot)' : 'var(--hud)'}">${score.toFixed(1)} PTS</div>
        </div>
      </div>`;
    });

  } else {
    // Pre-merge: tribe placements
    const tribeResults = cd.tribeResults || [];
    content += `<div style="text-align:center;padding:30px 0;">
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:0.4em;color:var(--warn);margin-bottom:6px;">TRIBE STANDINGS</div>
      <div style="font-family:'Black Ops One',sans-serif;font-size:32px;color:var(--paper);letter-spacing:0.06em;text-shadow:0 0 20px rgba(146,255,179,0.2);">OPERATION COMPLETE</div>
    </div>`;

    tribeResults.forEach((tr, idx) => {
      const tc = _tribeColorSafe(tr.tribeName);
      const isWinner = idx === 0;
      const isLoser = idx === tribeResults.length - 1;
      const cardCls = isWinner ? 'victory' : isLoser ? 'hazard' : 'movement';

      content += `<div class="hb-card ${cardCls}" style="margin:10px auto;max-width:500px;">
        <div class="hb-card-head">
          <div style="font-family:'Orbitron',sans-serif;font-size:18px;color:${tc};min-width:28px;">#${idx + 1}</div>
          <div class="hb-card-who" style="color:${tc};font-size:16px">${tr.tribeName}</div>
          <div class="hb-card-tag" style="border-color:${tc};color:${tc}">${tr.avgScore.toFixed(1)} AVG</div>
        </div>
        <div class="hb-card-body">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
            ${(tr.members || []).map(n => `<div style="display:flex;align-items:center;gap:4px;">${portrait(n, 22)}<span style="font-size:11px">${n}</span><span style="font-size:10px;color:var(--hud-dim)">${(cd.scores[n] || 0).toFixed(1)}</span></div>`).join('')}
          </div>
        </div>
        <div class="hb-card-foot">
          <div class="hb-chip ${isWinner ? 'ok' : isLoser ? 'bad' : 'warn'}">${isWinner ? 'SAFE' : isLoser ? 'TRIBAL COUNCIL' : 'SAFE'}</div>
        </div>
      </div>`;
    });
  }

  // Alarm status
  content += `<div style="text-align:center;padding:16px;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.3em;color:${cd.alarmTriggered ? 'var(--hot)' : 'var(--hud-dim)'};">FACILITY ALARM: ${cd.alarmTriggered ? 'TRIGGERED' : 'SILENT'}</div>`;

  return _shell(content, ep, 'hb-results', 'RESULTS');
}
