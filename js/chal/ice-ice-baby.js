// js/chal/ice-ice-baby.js — Ice Ice Baby: Siege & Steal (pre-merge tribe challenge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
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
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function portrait(name, size = 42) {
  const s = slug(name);
  return `<img src="assets/avatars/${s}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}

const _usedTexts = new Set();
function _pickUnique(pool, ...args) {
  const available = pool.filter((_, i) => !_usedTexts.has(pool[i]));
  const chosen = available.length > 0 ? pick(available) : pick(pool);
  _usedTexts.add(chosen);
  return chosen(...args);
}

const _prevClimbTier = {};

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);
function canSabotage(name) {
  const a = arch(name);
  if (VILLAIN_ARCHS.has(a)) return true;
  if (NICE_ARCHS.has(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════════════

// ── PHASE 1: SUMMIT SCRAMBLE ──
const CLIMB_TEXT = {
  strong: [
    (n, pr) => `${n} digs ${pr.posAdj} boots into the ice and hauls ${pr.ref} up another ledge. No hesitation.`,
    (n, pr) => `${n} finds a grip, pulls, and gains three feet in seconds. Like ${pr.sub} was born on a mountain.`,
    (n, pr) => `Powerful climbing from ${n}. ${pr.Sub} ${pr.sub === 'they' ? 'make' : 'makes'} the icy slope look like a ladder.`,
    (n, pr) => `${n} powers through the ice shelf. ${pr.posAdj} arms aren't even shaking.`,
    (n, pr) => `Clean, efficient climbing from ${n}. Every handhold is deliberate.`,
    (n, pr) => `${n} launches up three handholds in one fluid motion. Pure momentum.`,
    (n, pr) => `${n} attacks the rock face like ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} something to prove. ${pr.Sub} ${pr.sub === 'they' ? 'do' : 'does'}.`,
    (n, pr) => `${n} drives ${pr.posAdj} pick into the ice and vaults upward. The gap between ${pr.obj} and the pack widens.`,
    (n, pr) => `Textbook technique from ${n} — weight centered, legs driving, hands only guiding. ${pr.Sub} ${pr.sub === 'they' ? 'make' : 'makes'} it look effortless.`,
    (n, pr) => `${n} reaches the next ridge before anyone else on ${pr.posAdj} team. Not even breathing hard.`,
  ],
  mid: [
    (n, pr) => `${n} scrambles upward, slipping once but recovering. Steady progress.`,
    (n, pr) => `${n} grunts with effort, pulling ${pr.ref} over a frozen ledge. Not pretty, but it works.`,
    (n, pr) => `${n} is making progress, inch by frozen inch. Determination over technique.`,
    (n, pr) => `${n} grabs a jutting rock and hauls. ${pr.posAdj} hands are already red from the cold.`,
    (n, pr) => `${n} wedges ${pr.posAdj} knee into a crack and pushes up. Ugly form, real results.`,
    (n, pr) => `Slow and steady from ${n}. ${pr.Sub} ${pr.sub === 'they' ? 'find' : 'finds'} a route nobody else spotted.`,
    (n, pr) => `${n} pauses on a narrow ledge, catches ${pr.posAdj} breath, then keeps going. One section at a time.`,
    (n, pr) => `${n} tests every handhold before committing. Cautious, but ${pr.sub} ${pr.sub === 'they' ? 'keep' : 'keeps'} moving.`,
    (n, pr) => `${n} hugs the rock face and shimmies sideways to a better route. Smart detour.`,
    (n, pr) => `${n} muscles over a bulge in the ice wall. Not graceful, but ${pr.sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} fall.`,
  ],
  weak: [
    (n, pr) => `${n} slips and barely catches ${pr.ref}. The climb is not going well.`,
    (n, pr) => `${n}'s arms are shaking. Every ledge is a battle. The mountain is winning.`,
    (n, pr) => `${n} loses ${pr.posAdj} grip and slides back two feet. Panic flashes across ${pr.posAdj} face.`,
    (n, pr) => `${n} clings to the ice, frozen in place. The summit feels miles away.`,
    (n, pr) => `${n}'s fingers are numb. ${pr.Sub} ${pr.sub === 'they' ? 'can' : 'can'} barely grip the ice anymore.`,
    (n, pr) => `${n} puts ${pr.posAdj} foot on a ledge that crumbles. ${pr.Sub} ${pr.sub === 'they' ? 'drop' : 'drops'} a full body length before stopping.`,
    (n, pr) => `${n} presses ${pr.posAdj} forehead against the ice. Breathing hard. Not moving.`,
    (n, pr) => `Every inch costs ${n} everything. ${pr.posAdj} muscles are screaming.`,
    (n, pr) => `${n} reaches for a hold and misses. ${pr.posAdj} boots scrape uselessly against the ice.`,
    (n, pr) => `${n} makes the mistake of looking down. The color drains from ${pr.posAdj} face.`,
    (n, pr) => `${n} is stuck. Wedged into a crack with nowhere to go. The clock is ticking.`,
    (n, pr) => `${n}'s knee buckles on a narrow ledge. ${pr.Sub} ${pr.sub === 'they' ? 'grab' : 'grabs'} the wall with both hands, hanging on by willpower alone.`,
  ],
  rally: [
    (n, pr) => `Something clicks for ${n}. ${pr.Sub} ${pr.sub === 'they' ? 'find' : 'finds'} a second wind and SURGES upward.`,
    (n, pr) => `${n} was struggling — but not anymore. A burst of adrenaline carries ${pr.obj} past two players.`,
    (n, pr) => `${n} grits ${pr.posAdj} teeth and digs deep. The climb that was killing ${pr.obj} suddenly gets easier.`,
    (n, pr) => `${n} looks down, looks up, and chooses up. Renewed fire in ${pr.posAdj} eyes.`,
    (n, pr) => `${n} shakes out ${pr.posAdj} arms, takes a breath, and attacks the wall with fresh intensity.`,
    (n, pr) => `"NOT TODAY." ${n} growls it under ${pr.posAdj} breath and hauls ${pr.ref} over a ledge that stopped ${pr.obj} twice before.`,
  ],
  fadeOut: [
    (n, pr) => `${n} was climbing strong but the altitude is catching up. ${pr.posAdj} pace halves.`,
    (n, pr) => `Fatigue hits ${n} like a wall. ${pr.Sub} ${pr.sub === 'they' ? 'were' : 'was'} a machine earlier — now ${pr.sub}'s grinding gears.`,
    (n, pr) => `${n}'s earlier burst cost ${pr.obj}. ${pr.posAdj} arms have nothing left. Each pull is agony.`,
    (n, pr) => `The mountain finally catches up to ${n}. ${pr.Sub} ${pr.sub === 'they' ? 'slow' : 'slows'} to a crawl.`,
  ],
};

const ICE_BLOCK_DODGE = [
  (n, pr) => `An ice block hurtles down — ${n} rolls sideways and it shatters on the rock behind ${pr.obj}.`,
  (n, pr) => `${n} spots the ice block falling and tucks against the cliff face. It misses by inches.`,
  (n, pr) => `${n} hears the crack above and dives left. The ice block whizzes past ${pr.posAdj} shoulder.`,
  (n, pr) => `${n} senses it coming before ${pr.sub} sees it. Quick reflexes save the day.`,
  (n, pr) => `The shadow of an ice block passes over ${n}. ${pr.Sub} flattens against the mountain just in time.`,
];

const ICE_BLOCK_HIT = [
  (n, pr) => `An ice block slams into ${n}'s back. ${pr.Sub} gasps and nearly loses ${pr.posAdj} grip.`,
  (n, pr) => `${n} takes a direct hit from a falling ice block. The impact rattles ${pr.posAdj} teeth.`,
  (n, pr) => `ICE BLOCK! ${n} gets clipped on the shoulder. ${pr.Sub} slides down before catching a hold.`,
  (n, pr) => `${n} doesn't see it coming. The ice block catches ${pr.obj} on the side and sends ${pr.obj} tumbling.`,
  (n, pr) => `A chunk of ice the size of a basketball hits ${n} square in the chest. ${pr.Sub} drops two footholds.`,
];

const JUNK_PILE_ATTEMPT = [
  (n, pr) => `${n} breaks away from the climb and heads for the junk pile. "I've got an idea!"`,
  (n, pr) => `While the others climb, ${n} veers toward the pile of scrap metal and wires. ${pr.posAdj} eyes light up.`,
  (n, pr) => `${n} spots the junk pile and makes a calculated detour. The team watches nervously.`,
  (n, pr) => `"Cover me!" ${n} shouts, scrambling toward the junk pile instead of the summit.`,
];

const GADGET_RESULT = {
  high: [
    (n, pr, gadget) => `${n} emerges holding a ${gadget}. It's crude, but it works. ${pr.Sub} grins like a mad scientist.`,
    (n, pr, gadget) => `"Behold!" ${n} holds up the ${gadget}. It's actually... impressive? Even ${host()} looks intrigued.`,
  ],
  mid: [
    (n, pr, gadget) => `${n} cobbles together a ${gadget}. It's not elegant, but it'll do the job.`,
    (n, pr, gadget) => `The ${gadget} ${n} built rattles and sparks, but it seems functional. Probably.`,
  ],
  low: [
    (n, pr, gadget) => `${n} holds up... something. "${pr.Sub} ${pr.sub === 'they' ? 'call' : 'calls'} it a ${gadget}." Nobody's convinced.`,
    (n, pr, gadget) => `${n}'s ${gadget} falls apart in ${pr.posAdj} hands. ${pr.Sub} tries to tape it back together.`,
  ],
};

const BEETLE_ATTACK = [
  (n, pr) => `Scarab beetles swarm the junk pile! ${n} swats at them while trying to work.`,
  (n, pr) => `A cloud of beetles erupts from under the scrap. ${n} fights them off with one hand, builds with the other.`,
  (n, pr) => `"GET OFF!" ${n} shakes beetles out of ${pr.posAdj} hair while reaching for parts.`,
  (n, pr) => `The beetles are relentless. ${n} gets bitten twice before wrestling a gear free.`,
];

const BEETLE_FEND = [
  (n, pr) => `${n} smashes the beetles away with a pipe. Back to work.`,
  (n, pr) => `${n} shakes the last beetle off ${pr.posAdj} arm and keeps building. Focused.`,
];

const BEETLE_FAIL = [
  (n, pr) => `The beetles overwhelm ${n}. ${pr.Sub} drops a critical piece and has to start over.`,
  (n, pr) => `${n} retreats from the swarm, gadget quality suffering from the interruption.`,
];

// ── PHASE 1 SOCIAL ──
const RIVALRY_TAUNT = [
  (a, b, aPr) => `${a} looks down at ${b} struggling below. "Having fun down there?" ${aPr.Sub} smirks and keeps climbing.`,
  (a, b, aPr) => `"You call that climbing?" ${a} taunts ${b} from two ledges up. The tension is palpable.`,
  (a, b, aPr) => `${a} passes ${b} and makes sure to kick some snow in ${b}'s face. Accidentally, of course.`,
  (a, b, aPr) => `${a} glances at ${b}. "Try harder." Then ${aPr.sub} ${aPr.sub === 'they' ? 'pull' : 'pulls'} ahead.`,
];

const HELPING_HAND = [
  (a, b, aPr) => `${a} reaches back and grabs ${b}'s wrist, pulling ${pronouns(b).obj} up to the next ledge. "I got you."`,
  (a, b, aPr) => `${b} slips. ${a} catches ${pronouns(b).obj} without thinking. "You good?" ${b} nods. They keep climbing.`,
  (a, b, aPr) => `${a} pauses ${aPr.posAdj} own climb to help ${b} find a handhold. Teamwork.`,
  (a, b, aPr) => `"Grab my hand!" ${a} hoists ${b} over a slippery patch. Neither mentions it afterward.`,
];

const ICE_COLLISION = [
  (a, b) => `${a} and ${b} both get hit by the same ice barrage. They share a look of mutual suffering.`,
  (a, b) => `The ice block shatters between ${a} and ${b}. Fragments spray both of them.`,
  (a, b) => `${a} ducks an ice block that ricochets into ${b}. ${a}: "Sorry!" ${b}: "NOT HELPFUL."`,
  (a, b) => `${a} and ${b} huddle against the cliff as ice rains down. For a moment, rivalry takes a backseat to survival.`,
];

const COMPETITIVE_ONEUP = [
  (a, b) => `${a} notices ${b} gaining ground and pushes harder. This just became personal.`,
  (a, b) => `${a} and ${b} are neck and neck on the cliff face. Neither will let the other pass.`,
  (a, b) => `"I'm getting to the top before you." ${a} locks eyes with ${b}. The race is on.`,
  (a, b) => `${a} sees ${b} reaching for the same handhold. ${a} gets there first. ${b} seethes.`,
  (a, b) => `${a} glances sideways at ${b} and immediately doubles ${pronouns(a).posAdj} pace. Pride is a powerful fuel.`,
  (a, b) => `${b} overtakes ${a}. ${a}'s jaw tightens. This summit isn't big enough for both of them.`,
];

const ENCOURAGE_CLIMB = [
  (a, b, aPr) => `"You got this, ${b}!" ${a} shouts from above. ${b} nods and pushes harder.`,
  (a, b, aPr) => `${a} catches ${b}'s eye and gives a firm nod. No words needed. ${b} keeps going.`,
  (a, b, aPr) => `"One more ledge, ${b}. Don't quit on me." ${a}'s voice cuts through the wind.`,
  (a, b, aPr) => `${a} taps the rock above ${b}. "Right here — this hold is solid." The tip helps.`,
];

const TRASH_TALK_CLIMB = [
  (a, b, aPr) => `"Enjoy the view from down there, ${b}." ${a} doesn't even look back.`,
  (a, b, aPr) => `${a} laughs as ${b} slips again. "Maybe try the elevator next time."`,
  (a, b, aPr) => `"This is embarrassing for you, right?" ${a} asks ${b} with mock concern.`,
  (a, b, aPr) => `${a} blows on ${aPr.posAdj} nails while ${b} struggles below. The disrespect is intentional.`,
];

// ── PHASE 2: FORT CONSTRUCTION ──
const WALL_BUILD_STRONG = [
  (n, pr) => `${n} stacks ice blocks with mechanical precision. The wall grows thick and sturdy.`,
  (n, pr) => `${n}'s wall section is solid. Dense. Nobody's getting through this without a fight.`,
  (n, pr) => `${n} lifts a block that takes most people two hands and slots it in one-armed. Impressive.`,
  (n, pr) => `${n} finishes ${pr.posAdj} section and it's a fortress within a fortress. Reinforced, angled, brutal.`,
  (n, pr) => `${n} packs snow between blocks until the wall is practically concrete. ${pr.Sub} steps back, satisfied.`,
  (n, pr) => `${n}'s section could stop a truck. ${pr.Sub} built it twice as thick as anyone else's.`,
];

const WALL_BUILD_MID = [
  (n, pr) => `${n} grunts as ${pr.sub} heaves another block into place. The fort is taking shape.`,
  (n, pr) => `Block by frozen block, ${n} builds. Steady work, nothing flashy.`,
  (n, pr) => `${n} finds a rhythm — lift, place, pack. The wall climbs higher.`,
  (n, pr) => `${n} wipes sweat off ${pr.posAdj} brow and stacks another block. Getting there.`,
  (n, pr) => `${n}'s section won't win any architecture awards, but it'll hold. Probably.`,
  (n, pr) => `${n} wrestles a stubborn block into position. It fits. Barely.`,
];

const WALL_BUILD_WEAK = [
  (n, pr) => `${n} places a block that immediately slides off. ${pr.Sub} catches it before it crushes ${pr.posAdj} foot.`,
  (n, pr) => `${n}'s section is... thin. Worryingly thin. A strong wind might do it in.`,
  (n, pr) => `${n} stacks two blocks and one falls. Stacks again and the other falls. This is painful to watch.`,
  (n, pr) => `${n} can barely lift the ice blocks. ${pr.posAdj} contribution is more moral support than structural.`,
  (n, pr) => `${n}'s wall section has visible gaps. ${pr.Sub} tries to fill them with snow. It doesn't help much.`,
  (n, pr) => `${n} leans a block against the wall and prays. It stays. For now.`,
];

const TRAP_BUILD = [
  (n, pr, trap) => `${n} rigs the ${trap} with ice wire and spring tension. "Try me."`,
  (n, pr, trap) => `${n}'s ${trap} is ingenious — hidden under packed snow, triggered by pressure.`,
  (n, pr, trap) => `"Don't step there." ${n} finishes wiring the ${trap}. A nasty surprise awaits.`,
  (n, pr, trap) => `${n} tests the ${trap} on a snowman. The snowman is no more. "Perfect."`,
  (n, pr, trap) => `${n} calibrates the ${trap} with surgical focus. One wrong step and WHAM.`,
  (n, pr, trap) => `${n} buries the ${trap} under fresh powder. Invisible. Lethal. Beautiful.`,
  (n, pr, trap) => `The ${trap} clicks into place under ${n}'s hands. ${pr.Sub} grins. "Armed and dangerous."`,
  (n, pr, trap) => `${n} steps back from the ${trap} and nods. "Nobody's getting past that without a limp."`,
];

const DECOY_BUILD = [
  (n, pr) => `${n} sculpts a convincing decoy flag from scraps and snow. Even ${pr.sub} almost falls for it.`,
  (n, pr) => `${n}'s decoy is a masterpiece of misdirection. It looks exactly like the real flag from twenty feet.`,
  (n, pr) => `"They'll waste so much time on this." ${n} plants the decoy with a satisfied grin.`,
  (n, pr) => `${n}'s decoy is... okay. It might fool someone in a hurry. Maybe.`,
  (n, pr) => `${n} adds final touches to the decoy — a bit of color, a flutter of fabric. Convincing.`,
  (n, pr) => `${n} places the decoy in a spot that screams "flag here!" Misdirection is an art.`,
  (n, pr) => `${n} steps back and squints at ${pr.posAdj} decoy. "Good enough to buy us thirty seconds."`,
  (n, pr) => `${n} rigs the decoy to collapse when grabbed. The frustration factor alone is worth it.`,
];

const SABOTAGE_TEXT = [
  (n, pr) => `When nobody's looking, ${n} loosens a key support block. The wall looks fine. For now.`,
  (n, pr) => `${n} "accidentally" uses wet snow in a load-bearing section. It'll collapse when it freezes.`,
  (n, pr) => `${n} sabotages the fort's foundation. Subtle. Calculated. Nobody suspects a thing.`,
  (n, pr) => `While pretending to reinforce, ${n} creates a hidden weak point. ${pr.posAdj} tribe will pay for it later.`,
];

const SABOTAGE_CAUGHT = [
  (sab, det, dPr) => `${det} watches ${sab} work and narrows ${dPr.posAdj} eyes. "What are you doing to that wall?" Busted.`,
  (sab, det, dPr) => `"Hey!" ${det} catches ${sab} loosening a block. "That's SABOTAGE!" The team turns to look.`,
  (sab, det, dPr) => `${det}'s gut feeling was right. ${dPr.Sub} sees ${sab} weakening the structure and calls it out immediately.`,
  (sab, det, dPr) => `${det} spots wet snow where there shouldn't be wet snow. Traces it back to ${sab}. "You did this."`,
];

const FRAME_TEXT = [
  (sab, framed) => `${sab} plants evidence near ${framed}'s work station. If things go wrong, ${framed} will take the blame.`,
  (sab, framed) => `${sab} makes sure the weak section is near ${framed}'s post. Plausible deniability.`,
  (sab, framed) => `"Wasn't ${framed} working on that section?" ${sab} asks innocently later. Seeds planted.`,
  (sab, framed) => `${sab} quietly moves ${framed}'s tools near the compromised wall. When it fails, the finger will point at ${framed}.`,
];

const BUILD_TEAMWORK = [
  (a, b) => `${a} and ${b} find a rhythm — one stacks, one packs. The wall section grows fast.`,
  (a, b) => `"Hand me that block." ${a} and ${b} work in perfect sync. Chemistry matters in construction too.`,
  (a, b) => `${a} and ${b} high-five as their wall section passes inspection. Solid work.`,
  (a, b) => `The bond between ${a} and ${b} strengthens with every block they place together.`,
];

const TRAP_ARGUMENT = [
  (a, b) => `"Put the trap THERE!" "No, THERE!" ${a} and ${b} can't agree on placement. Time is wasting.`,
  (a, b) => `${a} rearranges ${b}'s trap setup. ${b} rearranges it back. This could go on all day.`,
  (a, b) => `${a} and ${b} argue about trap mechanics until a teammate intervenes. "Just BUILD something!"`,
  (a, b) => `"That won't work." ${a} dismisses ${b}'s design. ${b}'s jaw tightens. The grudge forms quietly.`,
];

const BUILD_LEADERSHIP = [
  (a, b) => `${a} takes charge of the construction. "I need ${b} on reinforcement. Move!" ${b} complies. For now.`,
  (a, b) => `${a} starts giving orders. ${b} follows them, but the look on ${b}'s face says "we'll discuss this later."`,
  (a, b) => `"Trust me on this." ${a} overrides ${b}'s design. Confidence or arrogance? Hard to tell.`,
  (a, b) => `${a} organizes the build crew with military efficiency. ${b} is impressed despite ${pronouns(b).ref}.`,
];

const BUILD_SLACK = [
  (a, b) => `${a} takes a break while ${b} does the heavy lifting. ${b} notices. ${b} remembers.`,
  (a, b) => `${a} is "supervising." ${b} is doing all the work. The resentment builds faster than the fort.`,
  (a, b) => `"I'm thinking strategically," ${a} says, watching ${b} sweat. ${b} is thinking strategically too — about the vote tonight.`,
  (a, b) => `${a} disappears for a "bathroom break" during ${b}'s hardest section. ${b} has to cover alone.`,
];

// ── PHASE 3: CTF ASSAULT ──
const ADVANCE_TEXT = [
  (n, pr) => `${n} pushes forward through the snow. Low, fast, eyes on the fort ahead.`,
  (n, pr) => `${n} sprints between cover, dodging snowballs and scanning for traps.`,
  (n, pr) => `${n} advances aggressively, using ${pr.posAdj} speed to close the gap.`,
  (n, pr) => `${n} belly-crawls through the snow, inching toward the enemy fort.`,
  (n, pr) => `${n} darts from snowdrift to snowdrift, closing distance with every burst.`,
  (n, pr) => `${n} charges straight at the fort. No subtlety. Pure aggression.`,
  (n, pr) => `${n} flanks wide, approaching the fort from an angle nobody expected.`,
  (n, pr) => `${n} slides down an icy slope and uses the momentum to close the gap fast.`,
  (n, pr) => `${n} zigzags through the snow, making ${pr.ref} a difficult target.`,
  (n, pr) => `${n} uses ${pr.posAdj} teammates as cover, weaving between them toward the fort.`,
  (n, pr) => `${n} rolls behind a snow mound and pops up ten feet closer. Tactical.`,
  (n, pr) => `${n} times ${pr.posAdj} advance between paintball volleys. Smart movement.`,
];

const TRAP_TRIGGER = [
  (n, pr, trap) => `${n} steps on the ${trap}! Snow explodes upward and ${pr.sub} goes down hard.`,
  (n, pr, trap) => `WHAM! ${n} triggers a hidden ${trap}. ${pr.Sub} never saw it coming.`,
  (n, pr, trap) => `The ${trap} catches ${n} full-on. ${pr.Sub} scrambles to recover, covered in snow.`,
  (n, pr, trap) => `${n} walks right into the ${trap}. The sound echoes across the battlefield.`,
];

const PAINTBALL_WIN = [
  (a, b) => `${a} tags ${b} with a direct hit. "You're out!" ${b} slinks to the bench.`,
  (a, b) => `${a}'s aim is true — ${b} takes a paintball to the chest. Round over.`,
  (a, b) => `In a split-second draw, ${a} fires first. ${b} is eliminated from this round.`,
  (a, b) => `${a} outmaneuvers ${b} and lands the shot. Clean elimination.`,
];

const PAINTBALL_LOSE = [
  (a, b) => `${b} catches ${a} in the open. Splat. ${a} sits out this round.`,
  (a, b) => `${a} rounds a corner and walks straight into ${b}'s line of fire. Tagged.`,
  (a, b) => `${b} gets the drop on ${a}. One shot, one elimination.`,
  (a, b) => `${a} tries to dodge but ${b}'s paintball catches ${pronouns(a).obj} on the run. Out.`,
];

const BREACH_TEXT = [
  (n, pr) => `${n} hammers the fort wall with everything ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'}. Cracks spider outward.`,
  (n, pr) => `${n} charges the wall shoulder-first. The ice groans and splinters.`,
  (n, pr) => `${n} attacks the fort's weak point. Ice shards fly as the wall begins to give.`,
  (n, pr) => `With a roar, ${n} drives ${pr.posAdj} fist through the fort wall. Daylight appears on the other side.`,
  (n, pr) => `${n} kicks a support block loose and a whole section sags. The defenders scramble.`,
  (n, pr) => `${n} pounds the wall in a rhythm — CRACK, CRACK, CRACK. Each hit sends ice dust flying.`,
  (n, pr) => `${n} finds a hairline fracture and works it wider with ${pr.posAdj} bare hands. The wall won't hold much longer.`,
  (n, pr) => `${n} tears a block free and throws it aside. The breach is growing.`,
  (n, pr) => `${n} slams into the weakened section and feels it buckle. Almost through.`,
  (n, pr) => `The wall crumbles under ${n}'s assault. Chunks of ice scatter across the snow.`,
];

const FLAG_SEARCH_REAL = [
  (n, pr) => `${n} tears through the fort and finds it — the REAL flag! "I GOT IT!"`,
  (n, pr) => `${n}'s eyes lock onto the flag. Not a decoy. The real thing. ${pr.Sub} grabs it and runs.`,
  (n, pr) => `"THIS IS IT!" ${n} holds up the flag. ${pr.posAdj} teammates erupt.`,
  (n, pr) => `${n} checks the flag. Real. Genuine. "MOVE! I'VE GOT THE FLAG!"`,
];

const FLAG_SEARCH_FAKE = [
  (n, pr) => `${n} grabs a flag and sprints — but it crumbles in ${pr.posAdj} hands. Decoy. "NO!"`,
  (n, pr) => `"I found it!" ${n} holds up the flag triumphantly. It dissolves. "...That was fake."`,
  (n, pr) => `${n} wastes precious seconds on a decoy. ${pr.posAdj} face falls as the flag turns to mush.`,
  (n, pr) => `Decoy! ${n} throws the fake flag to the ground in frustration. Back to searching.`,
];

const ESCAPE_RUN = [
  (n, pr) => `${n} tucks the flag under ${pr.posAdj} arm and BOLTS. Legs pumping, breath steaming.`,
  (n, pr) => `Flag in hand, ${n} runs like ${pr.posAdj} life depends on it. And it kind of does.`,
  (n, pr) => `${n} bursts out of the fort with the flag. The other team gives chase immediately.`,
  (n, pr) => `${n} hits the open snow at full sprint, flag streaming behind ${pr.obj} like a banner.`,
];

const LAST_SHOT = [
  (def, carrier) => `${def} takes one last shot at ${carrier}! The snowball/paintball arcs through the air...`,
  (def, carrier) => `${def} winds up and fires everything at ${carrier}. One chance to stop the capture.`,
  (def, carrier) => `"STOP ${carrier.toUpperCase()}!" ${def} launches a desperate shot.`,
  (def, carrier) => `${def} sees ${carrier} running and hurls with everything left.`,
];

const HEROIC_DEFENSE = [
  (n, pr) => `${n} holds the line against multiple attackers. One against three. ${pr.Sub} doesn't budge.`,
  (n, pr) => `${n} plants ${pr.ref} in front of the flag and dares anyone to try. Nobody gets through.`,
  (n, pr) => `${n}'s defense is legendary — tagging two attackers in rapid succession. The fort holds because of ${pr.obj}.`,
  (n, pr) => `${n} becomes a wall of pure defiance. Attackers crash against ${pr.obj} and fail.`,
];

const COWARDLY_RETREAT = [
  (n, pr) => `${n} sees the attackers coming and backs away. "I'll... guard the rear." There is no rear.`,
  (n, pr) => `${n} retreats before contact. ${pr.posAdj} teammates stare as the attackers pour through the gap.`,
  (n, pr) => `When the battle gets real, ${n} finds an excuse to be elsewhere. The team notices.`,
  (n, pr) => `${n} turns and runs when the first paintball flies. Not a great look.`,
];

const MIRROR_REFLECTOR = [
  (n, pr) => `${n} activates the Mirror Reflector — concentrated light hits the fort wall and it begins to MELT.`,
  (n, pr) => `The Mirror Reflector fires! Ice turns to slush under ${n}'s device. The fort's HP plummets.`,
  (n, pr) => `${n}'s gadget unleashes a beam of focused light. The fort wall drips, then collapses. "SCIENCE!"`,
  (n, pr) => `The Mirror Reflector burns through the ice like a hot knife. ${n} grins. Worth every beetle bite.`,
];

const FORT_CRUMBLE = [
  t => `${t}'s fort is crumbling. The walls sag and ice chunks fall. Something was wrong from the start.`,
  t => `Cracks race through ${t}'s fort. The structure groans. Sabotage? Or just bad luck?`,
  t => `${t}'s fort collapses from within. The sabotaged section gives way first, taking the rest with it.`,
  t => `The fort didn't stand a chance. ${t}'s walls fold like wet cardboard. Someone weakened them.`,
];

const FRAMING_MOMENT = [
  (framed, pr) => `"Wait — wasn't ${framed} supposed to reinforce that section?" Eyes turn to ${framed}. ${pr.Sub} looks confused.`,
  (framed, pr) => `"${framed} built that wall!" The accusation flies. ${framed} protests, but the evidence is damning.`,
  (framed, pr) => `The collapse is traced back to ${framed}'s section. ${pr.Sub} insists ${pr.sub} did everything right. Nobody believes ${pr.obj}.`,
  (framed, pr) => `${framed} takes the heat for the structural failure. The real saboteur stays quiet.`,
];

const HOST_INTRO = [
  h => `${h} stands atop an icy cliff, parka unzipped because he's THAT confident. "Welcome to the most epic snowball fight of your LIVES!"`,
  h => `"See that mountain?" ${h} points. "You're climbing it. Then you're building a fort ON it. Then you're attacking EACH OTHER'S forts." ${h} grins. "Any questions? Don't care."`,
  h => `${h} adjusts his aviators. "Today's challenge: climb, build, conquer. Last tribe standing keeps their torch."`,
  h => `"Alright, campers." ${h} spreads his arms. "Three phases. Climbing. Construction. WAR. The losing tribe goes to tribal council tonight."`,
];

const HOST_PHASE2 = [
  h => `"Phase two!" ${h} tosses a blueprint into the wind. "Build me a fort. Make it strong. Or don't. It's your funeral."`,
  h => `${h} inspects the summit. "You've got materials, you've got time, you've got... beetles. Build your forts!"`,
  h => `"Construction time! Walls, traps, decoys — whatever you need to survive Phase 3." ${h} settles into a lawn chair.`,
  h => `${h} checks his watch. "Four beats to build. Make every second count. Or make a sandcastle. I get entertained either way."`,
];

const HOST_PHASE3 = [
  h => `"PHASE THREE!" ${h} fires a flare gun. "CAPTURE. THE. FLAG. First tribe to grab the enemy flag and escape wins immunity!"`,
  h => `${h} raises a bullhorn. "SIEGE AND STEAL, people! Get in there, find their flag, get out alive. GO!"`,
  h => `"Forts are built. Flags are planted. Now..." ${h} grins. "DESTROY EACH OTHER. Immunity is on the line!"`,
  h => `${h} blows an air horn. "IT'S WAR! Attackers advance! Defenders dig in! Move move MOVE!"`,
];

const HOST_WINNER = [
  (h, w) => `${h} raises ${w}'s flag. "And ${w} captures the flag! Immunity is YOURS!"`,
  (h, w) => `"${w} wins immunity!" ${h} is genuinely impressed. "That was BRUTAL. I loved it."`,
  (h, w) => `${h} nods approvingly at ${w}. "You earned this one. ${w} — immunity. The rest of you? See you tonight."`,
  (h, w) => `"AND ${w.toUpperCase()} TAKES IT!" ${h} tosses the immunity idol to ${w}. "Well fought."`,
];

const HOST_LOSER = [
  (h, l) => `${h} looks at ${l}. "Your fort crumbled. Your flag was taken. Tribal council. Tonight."`,
  (h, l) => `"${l}..." ${h} shakes his head. "That was painful to watch. I'll see you at tribal."`,
  (h, l) => `${h} doesn't even look at ${l}. "Tribal. Tonight. Bring your A-game. Or don't." He walks away.`,
  (h, l) => `"${l}, your fort had the structural integrity of a wet napkin. Tribal council awaits."`,
];

const TICKER_MESSAGES = [
  'INCOMING: Heavy ice bombardment reported on the north face.',
  'WEATHER UPDATE: Aurora borealis activity at peak levels tonight.',
  'BREAKING: Chef reportedly throwing ice blocks "for science."',
  'FORT INSPECTION: Engineers rate fortifications "questionable at best."',
  'BEETLE ADVISORY: Scarab beetles swarming the junk pile area.',
  'SABOTAGE ALERT: Structural integrity of one fort may be compromised.',
  'MORALE REPORT: One tribe is arguing about trap placement. Again.',
  'FLAG STATUS: Both flags confirmed planted. The hunt begins.',
  'PAINTBALL SUPPLY: Ammunition is limited. Make every shot count.',
  'MEDICAL UPDATE: Frostbite cases rising. Medics on standby.',
  'HOST COMMENTARY: "This is the best challenge we\'ve ever done."',
  'VIEWER POLL: 73% think the saboteur will be caught. 27% hope not.',
  'GADGET WATCH: Mirror Reflector prototype spotted on the battlefield.',
  'DECOY COUNT: Multiple fake flags detected. Trust nothing.',
  'SUMMIT UPDATE: All teams approaching Phase 1 completion.',
  'CONSTRUCTION: Fort walls averaging 60+ HP. The siege will be brutal.',
  'CTF STATUS: Attackers are advancing. Defenders are digging in.',
];

const ATMOSPHERE_FLAVOR = [
  'The aurora shifts from green to purple. The mountain breathes.',
  'Wind howls across the summit. Snow stings exposed skin.',
  'The temperature drops another five degrees. Nobody complains. Out loud.',
  'A distant rumble. Avalanche? Thunder? Nobody wants to find out.',
  'Stars pierce through gaps in the aurora. The sky is on fire.',
  'Ice crystals catch the light and scatter rainbows across the snow.',
  'The mountain groans. An ancient sound. Everyone pretends they didn\'t hear it.',
  'Breath hangs in the air like smoke signals nobody can read.',
  'The northern lights dance overhead, indifferent to the chaos below.',
  'Somewhere below, a wolf howls. Or maybe that was just the wind.',
  'Frost creeps across exposed metal like a living thing.',
  'A sheet of ice cracks somewhere deep in the glacier. The sound echoes for three seconds.',
  'Snow begins to fall — light, silent, and utterly indifferent to the struggle below.',
  'The sun dips behind the peak. Shadows stretch across the snow like dark fingers.',
  'An eagle circles overhead. Even it looks cold.',
  'The wind dies. The silence is somehow worse.',
  'Icicles on the cliff face glow like teeth in the aurora light.',
  'The air is thin enough that every breath feels like a conscious choice.',
];

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════

export function simulateIceIceBaby(ep) {
  _usedTexts.clear();
  for (const k in _prevClimbTier) delete _prevClimbTier[k];

  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return ep;

  const allActive = tribes.flatMap(t => t.members);
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  // ══ PHASE 1: SUMMIT SCRAMBLE ══
  const BEATS = 5;
  const phase1Events = [];
  const climbScores = {};
  allActive.forEach(n => { climbScores[n] = 0; });
  const tribeClimbAvg = {};
  const gadgets = {}; // tribeName -> { builder, quality, tier, gadgetName }
  const junkPileUsed = {}; // tribeName -> true

  for (let beat = 0; beat < BEATS; beat++) {
    tribes.forEach(tribe => {
      const members = tribe.members;

      // Junk Pile Gambit: beat 2 or 3, highest-mental player
      if ((beat === 1 || beat === 2) && !junkPileUsed[tribe.name]) {
        const mentalSorted = [...members].sort((a, b) => pStats(b).mental - pStats(a).mental);
        const builder = mentalSorted[0];
        if (Math.random() < 0.6) { // 60% chance the smart player tries
          junkPileUsed[tribe.name] = true;
          const s = pStats(builder);
          const pr = pronouns(builder);
          let quality = (s.mental * 0.5 + s.strategic * 0.3 + s.intuition * 0.2) * noise(2.5);

          phase1Events.push({
            type: 'junkPile', player: builder, tribe: tribe.name, beat,
            text: pick(JUNK_PILE_ATTEMPT)(builder, pr),
            badge: 'JUNK PILE', badgeClass: 'blue'
          });

          // Beetle attack
          const beetleRoll = pStats(builder).physical * noise(2.5);
          if (beetleRoll > 4) {
            phase1Events.push({
              type: 'beetleFend', player: builder, tribe: tribe.name, beat,
              text: pick(BEETLE_ATTACK)(builder, pr) + ' ' + pick(BEETLE_FEND)(builder, pr),
              badge: 'BEETLES FENDED', badgeClass: 'gold'
            });
          } else {
            quality -= 2;
            phase1Events.push({
              type: 'beetleFail', player: builder, tribe: tribe.name, beat,
              text: pick(BEETLE_ATTACK)(builder, pr) + ' ' + pick(BEETLE_FAIL)(builder, pr),
              badge: 'BEETLE SWARM', badgeClass: 'red'
            });
          }

          // Determine gadget tier
          let tier, gadgetName;
          if (quality >= 6) { tier = 'high'; gadgetName = 'Mirror Reflector'; }
          else if (quality >= 3) { tier = 'mid'; gadgetName = 'Rope Launcher'; }
          else { tier = 'low'; gadgetName = 'Ice Shield'; }

          const resultPool = GADGET_RESULT[tier] || GADGET_RESULT.low;
          phase1Events.push({
            type: 'gadgetResult', player: builder, tribe: tribe.name, beat,
            text: pick(resultPool)(builder, pr, gadgetName),
            gadgetTier: tier, gadgetName,
            badge: gadgetName.toUpperCase(), badgeClass: tier === 'high' ? 'gold' : tier === 'mid' ? 'blue' : 'red'
          });

          gadgets[tribe.name] = { builder, quality, tier, gadgetName };
          ep.chalMemberScores[builder] += tier === 'high' ? 6 : tier === 'mid' ? 4 : 2;
          popDelta(builder, tier === 'high' ? 2 : 1);

          // Builder skips climb this beat
          members.filter(m => m !== builder).forEach(m => {
            _doClimb(m, tribe.name, beat, phase1Events, climbScores, ep);
          });
          return; // skip normal climb loop for this tribe
        }
      }

      // Normal climb for all members
      members.forEach(m => {
        _doClimb(m, tribe.name, beat, phase1Events, climbScores, ep);
      });
    });

    // Ice blocks: 1-2 random players per tribe get hit
    tribes.forEach(tribe => {
      const hitCount = 1 + (Math.random() < 0.4 ? 1 : 0);
      const targets = [...tribe.members].sort(() => Math.random() - 0.5).slice(0, hitCount);
      targets.forEach(target => {
        const s = pStats(target);
        const pr = pronouns(target);
        const dodgeRoll = s.intuition * noise(2.5);
        if (dodgeRoll > 5) {
          ep.chalMemberScores[target] += 1;
          phase1Events.push({
            type: 'iceBlockDodge', player: target, tribe: tribe.name, beat,
            text: _pickUnique(ICE_BLOCK_DODGE, target, pr),
            badge: 'DODGE', badgeClass: 'gold'
          });
        } else {
          const penalty = -(3 + noise(1.5));
          climbScores[target] += penalty;
          ep.chalMemberScores[target] -= 2;
          phase1Events.push({
            type: 'iceBlockHit', player: target, tribe: tribe.name, beat,
            text: _pickUnique(ICE_BLOCK_HIT, target, pr),
            penalty: Math.abs(penalty).toFixed(1),
            badge: 'ICE BLOCK', badgeClass: 'red'
          });
        }
      });
    });

    // Social events between beats (1 guaranteed + 1-2 bonus per tribe)
    tribes.forEach(tribe => {
      const socialCount = 1 + (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0);
      const shuffled = [...tribe.members].sort(() => Math.random() - 0.5);
      for (let si = 0; si < Math.min(socialCount, Math.floor(shuffled.length / 2)); si++) {
        const a = shuffled[si * 2];
        const b = shuffled[si * 2 + 1];
        if (!a || !b) continue;
        const aPr = pronouns(a);
        const aArch = arch(a);
        const bArch = arch(b);
        const roll = Math.random();

        if (roll < 0.15 && VILLAIN_ARCHS.has(aArch)) {
          // Trash talk (villain-only)
          phase1Events.push({
            type: 'trashTalk', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(TRASH_TALK_CLIMB, a, b, aPr),
            badge: 'TRASH TALK', badgeClass: 'red'
          });
          addBond(a, b, -0.7);
          popDelta(a, -1);
          ep.campEvents[tribe.name].post.push({
            type: 'iib-trash-talk', text: `${a} trash-talked ${b} during the summit climb. ${b} hasn't forgotten.`,
            players: [a, b], badgeText: 'TRASH TALK', badgeClass: 'badge-negative'
          });
        } else if (roll < 0.30 && (VILLAIN_ARCHS.has(aArch) || pStats(a).boldness >= 6)) {
          // Rivalry taunt
          phase1Events.push({
            type: 'rivalryTaunt', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(RIVALRY_TAUNT, a, b, aPr),
            badge: 'TAUNT', badgeClass: 'red'
          });
          addBond(a, b, -0.5);
          if (VILLAIN_ARCHS.has(aArch)) popDelta(a, 1);
        } else if (roll < 0.50 && (NICE_ARCHS.has(aArch) || pStats(a).loyalty >= 5)) {
          // Helping hand
          phase1Events.push({
            type: 'helpingHand', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(HELPING_HAND, a, b, aPr),
            badge: 'HELP', badgeClass: 'gold'
          });
          addBond(a, b, 0.5);
          popDelta(a, 1);
        } else if (roll < 0.60 && (NICE_ARCHS.has(aArch) || pStats(a).social >= 5)) {
          // Encouragement (nice/social players)
          phase1Events.push({
            type: 'encourage', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(ENCOURAGE_CLIMB, a, b, aPr),
            badge: 'ENCOURAGE', badgeClass: 'gold'
          });
          addBond(a, b, 0.3);
          ep.chalMemberScores[b] += 1;
        } else if (roll < 0.80) {
          // Competitive one-up
          phase1Events.push({
            type: 'competitiveOneUp', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(COMPETITIVE_ONEUP, a, b),
            badge: 'RIVALRY', badgeClass: 'blue'
          });
          addBond(a, b, -0.2);
          ep.chalMemberScores[a] += 1;
          ep.chalMemberScores[b] += 1;
        } else {
          // Ice collision (if both got hit this beat)
          const bothHit = phase1Events.filter(e => e.beat === beat && e.type === 'iceBlockHit' &&
            (e.player === a || e.player === b)).length >= 2;
          if (bothHit) {
            phase1Events.push({
              type: 'iceCollision', players: [a, b], tribe: tribe.name, beat,
              text: _pickUnique(ICE_COLLISION, a, b),
              badge: 'ICE BOND', badgeClass: 'blue'
            });
            const tempBonus = pStats(a).temperament >= 5 ? 0.3 : -0.2;
            addBond(a, b, tempBonus);
          }
        }
      }

      // Showmance moment
      _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'ice ice baby summit', tribe.members);
    });
  }

  // Phase 1 results: avg climb per tribe
  tribes.forEach(tribe => {
    const avg = tribe.members.reduce((sum, m) => sum + climbScores[m], 0) / tribe.members.length;
    tribeClimbAvg[tribe.name] = avg;
  });

  const tribesSortedPhase1 = [...tribes].sort((a, b) =>
    tribeClimbAvg[b.name] - tribeClimbAvg[a.name]
  );
  const phase1Winner = tribesSortedPhase1[0].name;

  // Phase 1 winner gets fort pick advantage and gadget upgrade
  const fortHP = {};
  tribes.forEach(t => { fortHP[t.name] = t.name === phase1Winner ? 80 : 60; });

  // Upgrade gadget for winner
  if (gadgets[phase1Winner]) {
    const g = gadgets[phase1Winner];
    if (g.tier === 'low') { g.tier = 'mid'; g.gadgetName = 'Rope Launcher'; }
    else if (g.tier === 'mid') { g.tier = 'high'; g.gadgetName = 'Mirror Reflector'; }
    // high stays high
  }

  // ══ PHASE 2: FORT CONSTRUCTION ══
  const BUILD_BEATS = 4;
  const phase2Events = [];
  const fortRoles = {}; // tribeName -> { walls: [], traps: [], decoys: [] }
  const traps = {}; // tribeName -> [{ type, quality }]
  const decoys = {}; // tribeName -> [{ convincingness }]
  const saboteurData = {}; // tribeName -> { saboteur, caught, framed, damage }

  tribes.forEach(tribe => {
    const members = [...tribe.members];
    const sorted = members.map(n => ({
      name: n,
      wallScore: pStats(n).physical + pStats(n).endurance,
      trapScore: pStats(n).strategic + pStats(n).mental,
      decoyScore: pStats(n).mental + pStats(n).intuition,
    }));

    // Priority draft: assign roles
    const walls = [], trappers = [], decoyers = [];
    const assigned = new Set();

    // Best trap scorer gets traps
    sorted.sort((a, b) => b.trapScore - a.trapScore);
    const trapPick = sorted.find(s => !assigned.has(s.name));
    if (trapPick) { trappers.push(trapPick.name); assigned.add(trapPick.name); }

    // Best decoy scorer gets decoys
    sorted.sort((a, b) => b.decoyScore - a.decoyScore);
    const decoyPick = sorted.find(s => !assigned.has(s.name));
    if (decoyPick) { decoyers.push(decoyPick.name); assigned.add(decoyPick.name); }

    // Rest are wall builders
    members.filter(m => !assigned.has(m)).forEach(m => walls.push(m));

    fortRoles[tribe.name] = { walls, traps: trappers, decoys: decoyers };
    traps[tribe.name] = [];
    decoys[tribe.name] = [];
  });

  for (let beat = 0; beat < BUILD_BEATS; beat++) {
    tribes.forEach(tribe => {
      const roles = fortRoles[tribe.name];

      // Wall builders
      roles.walls.forEach(n => {
        const s = pStats(n);
        const pr = pronouns(n);
        const wallContrib = (s.physical * 0.5 + s.endurance * 0.3 + s.loyalty * 0.2) + noise(2.5);
        const hpAdd = Math.max(0, wallContrib);
        fortHP[tribe.name] += hpAdd;
        ep.chalMemberScores[n] += Math.round(wallContrib);
        const wallPool = hpAdd >= 8 ? WALL_BUILD_STRONG : hpAdd >= 1 ? WALL_BUILD_MID : WALL_BUILD_WEAK;
        const badgeClass = hpAdd >= 8 ? 'gold' : hpAdd >= 1 ? 'blue' : 'red';
        phase2Events.push({
          type: 'wallBuild', player: n, tribe: tribe.name, beat,
          text: _pickUnique(wallPool, n, pr),
          hpAdd: hpAdd.toFixed(1),
          badge: `+${hpAdd.toFixed(0)} HP`, badgeClass
        });
      });

      // Trap engineers — cycle through trap types so the same player doesn't repeat
      const TRAP_TYPES_CYCLE = ['Snowball Turret', 'Ice Floor', 'Alarm Bell', 'Spike Pit'];
      roles.traps.forEach(n => {
        const s = pStats(n);
        const pr = pronouns(n);
        const trapQuality = (s.strategic * 0.5 + s.mental * 0.4 + s.intuition * 0.1) * noise(2.5);
        const trapType = TRAP_TYPES_CYCLE[beat % TRAP_TYPES_CYCLE.length];
        traps[tribe.name].push({ type: trapType, quality: trapQuality });
        ep.chalMemberScores[n] += 3;
        phase2Events.push({
          type: 'trapBuild', player: n, tribe: tribe.name, beat,
          text: _pickUnique(TRAP_BUILD, n, pr, trapType),
          trapType, quality: trapQuality.toFixed(1),
          badge: trapType.toUpperCase(), badgeClass: 'blue'
        });
      });

      // Decoy crafters
      roles.decoys.forEach(n => {
        const s = pStats(n);
        const pr = pronouns(n);
        const convincingness = (s.mental * 0.4 + s.intuition * 0.4 + s.strategic * 0.2) * noise(2.5);
        decoys[tribe.name].push({ convincingness });
        ep.chalMemberScores[n] += 2;
        phase2Events.push({
          type: 'decoyBuild', player: n, tribe: tribe.name, beat,
          text: _pickUnique(DECOY_BUILD, n, pr),
          convincingness: convincingness.toFixed(1),
          badge: 'DECOY', badgeClass: 'blue'
        });
      });

      // Saboteur mechanic
      if (beat === 1 && !saboteurData[tribe.name]) {
        const eligible = tribe.members.filter(m => canSabotage(m));
        if (eligible.length > 0 && Math.random() < 0.4) {
          const saboteur = pick(eligible);
          const s = pStats(saboteur);
          const pr = pronouns(saboteur);
          const damage = (s.strategic * 0.4 + s.boldness * 0.3) + noise(2.0);
          fortHP[tribe.name] -= Math.max(0, damage);

          // Frame lowest-bond teammate
          const teammates = tribe.members.filter(m => m !== saboteur);
          const framed = teammates.sort((a, b) => getBond(saboteur, a) - getBond(saboteur, b))[0];

          // Detection roll
          const detector = teammates.sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
          const detectionRoll = pStats(detector).intuition * noise(2.5);
          const caught = detectionRoll > 7;

          saboteurData[tribe.name] = { saboteur, caught, framed, damage: Math.max(0, damage), detector };

          phase2Events.push({
            type: 'sabotage', player: saboteur, tribe: tribe.name, beat,
            text: pick(SABOTAGE_TEXT)(saboteur, pr),
            damage: Math.max(0, damage).toFixed(1),
            badge: 'SABOTAGE', badgeClass: 'red'
          });

          if (caught) {
            const dPr = pronouns(detector);
            phase2Events.push({
              type: 'sabotageCaught', player: saboteur, detector, tribe: tribe.name, beat,
              text: pick(SABOTAGE_CAUGHT)(saboteur, detector, dPr),
              badge: 'BUSTED', badgeClass: 'red'
            });
            addBond(detector, saboteur, -2);
            teammates.forEach(m => addBond(m, saboteur, -1));
            popDelta(saboteur, -3);
            popDelta(detector, 2);
            // Partial repair
            fortHP[tribe.name] += Math.max(0, damage) * 0.5;
            ep.campEvents[tribe.name].post.push({
              type: 'iib-saboteur-caught',
              text: `${detector} caught ${saboteur} sabotaging the fort during Ice Ice Baby. The team is furious.`,
              players: [saboteur, detector],
              badgeText: 'SABOTEUR CAUGHT', badgeClass: 'badge-negative'
            });
          } else {
            // Frame someone
            phase2Events.push({
              type: 'frame', player: saboteur, framed, tribe: tribe.name, beat,
              text: pick(FRAME_TEXT)(saboteur, framed),
              badge: 'FRAMED', badgeClass: 'red'
            });
          }
        }
      }

      // Social events during build (1 guaranteed per beat)
      if (tribe.members.length >= 2) {
        const pair = [...tribe.members].sort(() => Math.random() - 0.5).slice(0, 2);
        const [a, b] = pair;
        const aArch = arch(a);
        const roll = Math.random();

        if (roll < 0.25) {
          phase2Events.push({
            type: 'buildTeamwork', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(BUILD_TEAMWORK, a, b),
            badge: 'TEAMWORK', badgeClass: 'gold'
          });
          addBond(a, b, 0.3);
        } else if (roll < 0.45) {
          phase2Events.push({
            type: 'trapArgument', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(TRAP_ARGUMENT, a, b),
            badge: 'ARGUMENT', badgeClass: 'red'
          });
          addBond(a, b, -0.3);
        } else if (roll < 0.65 && (pStats(a).strategic >= 5 || aArch === 'challenge-beast')) {
          phase2Events.push({
            type: 'buildLeadership', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(BUILD_LEADERSHIP, a, b),
            badge: 'LEADERSHIP', badgeClass: 'blue'
          });
          ep.chalMemberScores[a] += 1;
          addBond(a, b, -0.1);
        } else if (roll < 0.85 && (pStats(a).loyalty <= 4 || VILLAIN_ARCHS.has(aArch))) {
          phase2Events.push({
            type: 'buildSlack', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(BUILD_SLACK, a, b),
            badge: 'SLACKER', badgeClass: 'red'
          });
          addBond(a, b, -0.5);
          popDelta(a, -1);
          ep.campEvents[tribe.name].post.push({
            type: 'iib-slacker', text: `${b} did all the work while ${a} took it easy during the fort build. The tribe noticed.`,
            players: [a, b], badgeText: 'SLACKER', badgeClass: 'badge-negative'
          });
        } else {
          phase2Events.push({
            type: 'buildTeamwork', players: [a, b], tribe: tribe.name, beat,
            text: _pickUnique(BUILD_TEAMWORK, a, b),
            badge: 'TEAMWORK', badgeClass: 'gold'
          });
          addBond(a, b, 0.3);
        }

        // Showmance moment during build
        _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'ice ice baby build', tribe.members);
      }
    });
  }

  // ══ PHASE 3: CTF ASSAULT ══
  const phase3Events = [];
  const CTF_MAX_ROUNDS = 6;

  // Each tribe attacks the other(s) — for 2-tribe pre-merge, tribe A attacks tribe B and vice versa
  // For 3+ tribes, each tribe attacks the tribe to their right (circular)
  const tribeAttackTarget = {};
  for (let i = 0; i < tribes.length; i++) {
    tribeAttackTarget[tribes[i].name] = tribes[(i + 1) % tribes.length].name;
  }

  // Split each tribe into attackers (~60%) and defenders (~40%)
  const attackers = {};
  const defenders = {};
  tribes.forEach(tribe => {
    const sorted = [...tribe.members].sort((a, b) => {
      const aAtk = pStats(a).boldness + pStats(a).physical;
      const bAtk = pStats(b).boldness + pStats(b).physical;
      return bAtk - aAtk;
    });
    const splitIdx = Math.ceil(sorted.length * 0.6);
    attackers[tribe.name] = sorted.slice(0, splitIdx);
    defenders[tribe.name] = sorted.slice(splitIdx);
  });

  const sittingOut = {}; // player -> rounds remaining
  const flagCaptured = {}; // tribeName that was captured from -> capturer tribe name
  const fortDestroyed = {}; // tribeName -> true
  let ctfResolved = false;

  for (let round = 0; round < CTF_MAX_ROUNDS && !ctfResolved; round++) {
    tribes.forEach(tribe => {
      const targetTribe = tribeAttackTarget[tribe.name];
      if (flagCaptured[targetTribe] || fortDestroyed[targetTribe]) return;

      const myAttackers = attackers[tribe.name].filter(n => !sittingOut[n]);
      const theirDefenders = defenders[targetTribe].filter(n => !sittingOut[n]);

      // Attackers advance (only emit ~40% of routine advances after round 1 to reduce spam)
      myAttackers.forEach(atk => {
        const s = pStats(atk);
        const pr = pronouns(atk);
        const advanceScore = (s.physical * 0.3 + s.boldness * 0.3 + s.endurance * 0.2 + s.intuition * 0.2) + noise(2.5);
        ep.chalMemberScores[atk] += Math.max(0, Math.round(advanceScore));

        if (round === 0 || Math.random() < 0.4) {
          phase3Events.push({
            type: 'advance', player: atk, tribe: tribe.name, targetTribe, round,
            text: _pickUnique(ADVANCE_TEXT, atk, pr),
            badge: 'ADVANCE', badgeClass: 'blue'
          });
        }

        // Trap trigger (first round only, one-time traps)
        if (round === 0 && traps[targetTribe]?.length > 0) {
          const trap = traps[targetTribe].shift();
          if (trap && Math.random() < 0.6) {
            ep.chalMemberScores[atk] -= 2;
            sittingOut[atk] = 1;
            phase3Events.push({
              type: 'trapTrigger', player: atk, tribe: tribe.name, round,
              text: pick(TRAP_TRIGGER)(atk, pr, trap.type),
              trapType: trap.type,
              badge: 'TRAPPED', badgeClass: 'red'
            });
          }
        }
      });

      // Paintball duels (active attackers vs active defenders)
      const activeAtk = myAttackers.filter(n => !sittingOut[n]);
      const activeDef = theirDefenders.filter(n => !sittingOut[n]);
      const duelCount = Math.min(activeAtk.length, activeDef.length, 2);
      for (let d = 0; d < duelCount; d++) {
        const atk = activeAtk[d];
        const def = activeDef[d];
        if (!atk || !def) continue;
        const atkScore = (pStats(atk).physical * 0.4 + pStats(atk).boldness * 0.3 + pStats(atk).intuition * 0.3) * noise(2.5);
        const defScore = (pStats(def).strategic * 0.4 + pStats(def).physical * 0.3 + pStats(def).loyalty * 0.3) * noise(2.5);

        if (atkScore > defScore) {
          sittingOut[def] = 1;
          ep.chalMemberScores[atk] += 3;
          ep.chalMemberScores[def] -= 1;
          addBond(atk, def, -0.3);
          phase3Events.push({
            type: 'paintballWin', player: atk, eliminated: def, tribe: tribe.name, round,
            text: pick(PAINTBALL_WIN)(atk, def),
            badge: 'TAGGED', badgeClass: 'gold'
          });
        } else {
          sittingOut[atk] = 1;
          ep.chalMemberScores[def] += 3;
          ep.chalMemberScores[atk] -= 1;
          addBond(atk, def, -0.3);
          phase3Events.push({
            type: 'paintballLose', player: atk, eliminator: def, tribe: tribe.name, round,
            text: pick(PAINTBALL_LOSE)(atk, def),
            badge: 'ELIMINATED', badgeClass: 'red'
          });
        }
      }

      // Heroic defense events
      activeDef.forEach(def => {
        if (sittingOut[def]) return;
        const s = pStats(def);
        const pr = pronouns(def);
        if (activeAtk.length >= 2 && s.loyalty >= 5 && Math.random() < 0.25) {
          phase3Events.push({
            type: 'heroicDefense', player: def, tribe: targetTribe, round,
            text: pick(HEROIC_DEFENSE)(def, pr),
            badge: 'HEROIC DEFENSE', badgeClass: 'gold'
          });
          ep.chalMemberScores[def] += 4;
          popDelta(def, 2);
          addBond(def, pick(defenders[targetTribe].filter(d => d !== def) || [def]), 0.5);
        }
      });

      // Cowardly retreat
      activeDef.forEach(def => {
        if (sittingOut[def]) return;
        const s = pStats(def);
        const pr = pronouns(def);
        if (s.boldness <= 3 && s.loyalty <= 4 && Math.random() < 0.15) {
          phase3Events.push({
            type: 'cowardlyRetreat', player: def, tribe: targetTribe, round,
            text: pick(COWARDLY_RETREAT)(def, pr),
            badge: 'RETREAT', badgeClass: 'red'
          });
          ep.chalMemberScores[def] -= 3;
          popDelta(def, -2);
          sittingOut[def] = 2;
        }
      });

      // Fort breach damage — escalates each round as attackers get organized
      const remainingAtk = activeAtk.filter(n => !sittingOut[n]);
      const escalation = 1 + round * 0.3;
      remainingAtk.forEach(atk => {
        const s = pStats(atk);
        const pr = pronouns(atk);
        let breachDmg = ((s.physical * 0.5 + s.boldness * 0.3) + noise(2.5)) * escalation;

        // Mirror Reflector bonus
        if (gadgets[tribe.name]?.tier === 'high') {
          breachDmg += 15;
          if (round === 0) {
            phase3Events.push({
              type: 'mirrorReflector', player: gadgets[tribe.name].builder, tribe: tribe.name, round,
              text: pick(MIRROR_REFLECTOR)(gadgets[tribe.name].builder, pronouns(gadgets[tribe.name].builder)),
              badge: 'MIRROR REFLECTOR', badgeClass: 'gold'
            });
            popDelta(gadgets[tribe.name].builder, 3);
          }
        }

        const actualDmg = Math.max(0, breachDmg);
        fortHP[targetTribe] = Math.max(0, fortHP[targetTribe] - actualDmg);

        if (actualDmg > 2) {
          phase3Events.push({
            type: 'breach', player: atk, tribe: tribe.name, targetTribe, round,
            text: _pickUnique(BREACH_TEXT, atk, pr),
            damage: actualDmg.toFixed(1), remainingHP: fortHP[targetTribe].toFixed(0),
            badge: `${actualDmg.toFixed(0)} DMG`, badgeClass: 'red'
          });
        }
      });

      // Sabotage payoff: fort crumbles faster
      if (saboteurData[targetTribe] && !saboteurData[targetTribe].caught && fortHP[targetTribe] < 20) {
        const sd = saboteurData[targetTribe];
        if (!sd.framingFired) {
          sd.framingFired = true;
          const framedPr = pronouns(sd.framed);
          phase3Events.push({
            type: 'fortCrumble', tribe: targetTribe, round,
            text: pick(FORT_CRUMBLE)(targetTribe),
            badge: 'CRUMBLING', badgeClass: 'red'
          });
          phase3Events.push({
            type: 'framingMoment', player: sd.framed, tribe: targetTribe, round,
            text: pick(FRAMING_MOMENT)(sd.framed, framedPr),
            badge: 'BLAMED', badgeClass: 'red'
          });
          // Framed player takes heat
          defenders[targetTribe].filter(d => d !== sd.framed).forEach(d => {
            addBond(d, sd.framed, -0.8);
          });
          popDelta(sd.framed, -2);
          ep.campEvents[targetTribe].post.push({
            type: 'iib-framed',
            text: `${sd.framed} is blamed for the fort collapse in Ice Ice Baby — but ${sd.saboteur} was the real saboteur.`,
            players: [sd.framed, sd.saboteur],
            badgeText: 'FRAMED', badgeClass: 'badge-negative'
          });
        }
      }

      // Check fort destroyed
      if (fortHP[targetTribe] <= 0) {
        fortDestroyed[targetTribe] = true;
        phase3Events.push({
          type: 'fortDestroyed', tribe: targetTribe, round,
          text: `${targetTribe}'s fort is DESTROYED! The flag is exposed!`,
          badge: 'FORT DOWN', badgeClass: 'red'
        });
      }

      // Flag search — threshold rises each round so late rounds can force resolution
      const searchThreshold = 20 + round * 15;
      if (fortDestroyed[targetTribe] || fortHP[targetTribe] <= searchThreshold) {
        const searchers = remainingAtk.filter(n => !sittingOut[n]);
        if (searchers.length > 0) {
          const searcher = pick(searchers);
          const s = pStats(searcher);
          const pr = pronouns(searcher);
          const searchScore = (s.mental * 0.4 + s.intuition * 0.5 + s.strategic * 0.1) * noise(2.5);

          // Check vs decoys
          const activeDecoys = decoys[targetTribe] || [];
          const bestDecoy = activeDecoys.length > 0 ? Math.max(...activeDecoys.map(d => d.convincingness)) : 0;

          if (searchScore > bestDecoy || activeDecoys.length === 0) {
            // Found real flag
            phase3Events.push({
              type: 'flagReal', player: searcher, tribe: tribe.name, targetTribe, round,
              text: pick(FLAG_SEARCH_REAL)(searcher, pr),
              badge: 'FLAG FOUND', badgeClass: 'gold'
            });
            ep.chalMemberScores[searcher] += 8;
            popDelta(searcher, 3);

            // Escape run
            const escapeScore = (s.endurance * 0.4 + s.physical * 0.3 + s.boldness * 0.3) * noise(2.5);
            phase3Events.push({
              type: 'escapeRun', player: searcher, tribe: tribe.name, round,
              text: pick(ESCAPE_RUN)(searcher, pr),
              badge: 'FLAG RUN', badgeClass: 'gold'
            });

            // Last shot from defender
            const lastDef = activeDef.filter(n => !sittingOut[n])[0];
            if (lastDef) {
              phase3Events.push({
                type: 'lastShot', player: lastDef, target: searcher, tribe: targetTribe, round,
                text: pick(LAST_SHOT)(lastDef, searcher),
                badge: 'LAST SHOT', badgeClass: 'red'
              });
              const shotScore = pStats(lastDef).physical * 0.4 * noise(2.5);
              if (shotScore > escapeScore && Math.random() < 0.2) {
                // Rare: defender stops the capture!
                phase3Events.push({
                  type: 'lastShotHit', player: lastDef, target: searcher, tribe: targetTribe, round,
                  text: `${lastDef}'s shot connects! ${searcher} drops the flag! The capture is DENIED!`,
                  badge: 'DENIED', badgeClass: 'red'
                });
                ep.chalMemberScores[lastDef] += 6;
                popDelta(lastDef, 3);
              } else {
                // Capture succeeds
                flagCaptured[targetTribe] = tribe.name;
                ctfResolved = true;
                phase3Events.push({
                  type: 'flagCaptured', player: searcher, tribe: tribe.name, targetTribe, round,
                  text: `${searcher} crosses the line! ${tribe.name} CAPTURES ${targetTribe}'s FLAG! IMMUNITY!`,
                  badge: 'CAPTURED', badgeClass: 'gold'
                });
              }
            } else {
              // No defender to stop — auto-capture
              flagCaptured[targetTribe] = tribe.name;
              ctfResolved = true;
              phase3Events.push({
                type: 'flagCaptured', player: searcher, tribe: tribe.name, targetTribe, round,
                text: `Nobody left to stop ${searcher}! ${tribe.name} captures the flag! IMMUNITY!`,
                badge: 'CAPTURED', badgeClass: 'gold'
              });
            }
          } else {
            // Got a decoy
            phase3Events.push({
              type: 'flagFake', player: searcher, tribe: tribe.name, targetTribe, round,
              text: pick(FLAG_SEARCH_FAKE)(searcher, pr),
              badge: 'DECOY', badgeClass: 'red'
            });
            sittingOut[searcher] = 1;
            ep.chalMemberScores[searcher] -= 2;
            if (activeDecoys.length > 0) activeDecoys.shift();
          }
        }
      }
    });

    // Reduce sit-out timers
    Object.keys(sittingOut).forEach(n => {
      if (sittingOut[n] > 0) sittingOut[n]--;
      if (sittingOut[n] <= 0) delete sittingOut[n];
    });

    // Showmance moment between rounds
    if (!ctfResolved) {
      _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'ice ice baby ctf', allActive);
    }
  }

  // Timeout resolution: most fort HP wins
  if (!ctfResolved) {
    const tribeFortHP = tribes.map(t => ({ name: t.name, hp: fortHP[t.name] }))
      .sort((a, b) => b.hp - a.hp);
    phase3Events.push({
      type: 'timeout', round: CTF_MAX_ROUNDS,
      text: `Time's up! Neither team captured a flag. ${tribeFortHP[0].name}'s fort stood tallest with ${tribeFortHP[0].hp.toFixed(0)} HP remaining!`,
      badge: 'TIMEOUT', badgeClass: 'blue'
    });
  }

  // ══ DETERMINE WINNER ══
  let winnerTribeName, loserTribeName;
  if (ctfResolved) {
    // Tribe that captured a flag wins
    const capturerTribes = Object.values(flagCaptured);
    winnerTribeName = capturerTribes[0];
    loserTribeName = Object.keys(flagCaptured)[0]; // tribe that lost their flag
  } else {
    // Most fort HP
    const tribeFortHP = tribes.map(t => ({ name: t.name, hp: fortHP[t.name] }))
      .sort((a, b) => b.hp - a.hp);
    winnerTribeName = tribeFortHP[0].name;
    loserTribeName = tribeFortHP[tribeFortHP.length - 1].name;
  }

  // Romance hooks
  for (let i = 0; i < allActive.length; i++)
    for (let j = i + 1; j < allActive.length; j++)
      _challengeRomanceSpark(allActive[i], allActive[j], ep, null, null, ep.chalMemberScores || {}, 'ice ice baby');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'ice ice baby', allActive);

  // ══ FINALIZE ══
  const tribesSorted = [winnerTribeName, ...tribes.map(t => t.name).filter(n => n !== winnerTribeName && n !== loserTribeName), loserTribeName];
  const winnerTribe = gs.tribes.find(t => t.name === winnerTribeName);
  const loserTribe = gs.tribes.find(t => t.name === loserTribeName);

  ep.iceIceBaby = {
    phase1Events,
    phase2Events,
    phase3Events,
    climbScores: { ...climbScores },
    tribeClimbAvg: { ...tribeClimbAvg },
    phase1Winner,
    fortHP: { ...fortHP },
    fortRoles,
    traps: Object.fromEntries(Object.entries(traps).map(([k, v]) => [k, v.length])),
    decoys: Object.fromEntries(Object.entries(decoys).map(([k, v]) => [k, v.length])),
    gadgets,
    saboteurData,
    attackers,
    defenders,
    flagCaptured,
    fortDestroyed,
    tribesSorted,
    winner: winnerTribeName,
    loser: loserTribeName,
    ctfResolved,
    tribes: tribes.map(t => ({
      name: t.name,
      members: [...t.members],
      fortHP: fortHP[t.name],
      gadget: gadgets[t.name] || null,
      saboteur: saboteurData[t.name] || null,
      isWinner: t.name === winnerTribeName,
    })),
    hostIntro: pick(HOST_INTRO)(host()),
    hostPhase2: pick(HOST_PHASE2)(host()),
    hostPhase3: pick(HOST_PHASE3)(host()),
    hostWinner: pick(HOST_WINNER)(host(), winnerTribeName),
    hostLoser: pick(HOST_LOSER)(host(), loserTribeName),
  };

  ep.isIceIceBaby = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Ice Ice Baby';
  ep.challengeCategory = 'adventure';

  ep.winner = winnerTribe;
  ep.loser = loserTribe;
  ep.safeTribes = tribesSorted.length > 2
    ? tribesSorted.slice(1, -1).map(tn => gs.tribes.find(t => t.name === tn)).filter(Boolean)
    : [];
  ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];

  ep.challengePlacements = tribesSorted.map(tn => ({
    name: tn, members: [...(gs.tribes.find(t => t.name === tn)?.members || [])],
    memberScores: Object.fromEntries((gs.tribes.find(t => t.name === tn)?.members || []).map(m => [m, ep.chalMemberScores[m] || 0])),
  }));

  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a).map(([n]) => n);

  // Top scorer bonus
  const topScorer = winnerTribe?.members.slice().sort((a, b) =>
    (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)
  )[0];
  if (topScorer) {
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== topScorer).map(([, s]) => s));
    ep.chalMemberScores[topScorer] = Math.max(
      ep.chalMemberScores[topScorer] || 0, maxOther) + allActive.length + 5;
  }

  updateChalRecord(ep);
  return ep;
}

// ── Climb helper ──
function _doClimb(name, tribeName, beat, events, climbScores, ep) {
  const s = pStats(name);
  const pr = pronouns(name);
  const fatigueMod = beat >= 3 ? -(beat - 2) * 0.8 : 0;
  const score = (s.physical * 0.4 + s.endurance * 0.4 + s.boldness * 0.2) * noise(2.5) + fatigueMod;
  climbScores[name] += score;
  ep.chalMemberScores[name] += Math.max(0, Math.round(score));

  let tier = score >= 5 ? 'strong' : score >= 2 ? 'mid' : 'weak';
  const prevTier = _prevClimbTier[name];

  // Rally: was weak last beat, now mid/strong → use rally text (30% chance)
  if (prevTier === 'weak' && tier !== 'weak' && Math.random() < 0.3 && CLIMB_TEXT.rally) {
    _prevClimbTier[name] = tier;
    events.push({
      type: 'climb', player: name, tribe: tribeName, beat,
      text: _pickUnique(CLIMB_TEXT.rally, name, pr),
      score: score.toFixed(1),
      badge: 'RALLY', badgeClass: 'gold'
    });
    return;
  }

  // FadeOut: was strong last beat, now weak → use fadeOut text (40% chance)
  if (prevTier === 'strong' && tier === 'weak' && Math.random() < 0.4 && CLIMB_TEXT.fadeOut) {
    _prevClimbTier[name] = tier;
    events.push({
      type: 'climb', player: name, tribe: tribeName, beat,
      text: _pickUnique(CLIMB_TEXT.fadeOut, name, pr),
      score: score.toFixed(1),
      badge: 'FADING', badgeClass: 'red'
    });
    return;
  }

  _prevClimbTier[name] = tier;
  events.push({
    type: 'climb', player: name, tribe: tribeName, beat,
    text: _pickUnique(CLIMB_TEXT[tier], name, pr),
    score: score.toFixed(1),
    badge: tier === 'strong' ? 'STRONG' : tier === 'mid' ? 'STEADY' : 'STRUGGLING',
    badgeClass: tier === 'strong' ? 'gold' : tier === 'mid' ? 'blue' : 'red'
  });
}

// ══════════════════════════════════════════════════════════════════════
// VP BUILDERS
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`iib-step-${suffix}-${i}`);
    if (el) el.classList.add('iib-visible');
  }
  const counter = document.getElementById(`iib-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`iib-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.iib-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

function _iibUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('iib-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._iibEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.iceIceBaby) return;
  sideEl.innerHTML = _buildSidebarContent(epRecord, screenKey);
}

export function iibRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    const suffix = screenKey.replace('iib-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    const el = document.getElementById(`iib-step-${suffix}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) { console.warn('IIB reveal error:', e); }
  try { _iibUpdateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
}

export function iibRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('iib-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
  } catch (e) { console.warn('IIB revealAll error:', e); }
  try { _iibUpdateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
}

// ── CSS ICONS ──
function _iconSnowflake() {
  return `<div class="iib-icon-snow"><span class="a"></span><span class="a"></span><span class="a"></span><span class="d"></span></div>`;
}
function _iconMountain() {
  return `<div class="iib-icon-mtn"><div class="pk"></div><div class="cap"></div></div>`;
}
function _iconFort() {
  return `<div class="iib-icon-fort"><div class="w1"></div><div class="w2"></div><div class="w3"></div><div class="bt"></div></div>`;
}
function _iconFlag() {
  return `<div class="iib-icon-flag"><div class="pole"></div><div class="cloth"></div></div>`;
}
function _iconSword() {
  return `<div class="iib-icon-sword"><div class="blade"></div><div class="guard"></div><div class="hilt"></div></div>`;
}
function _iconShield() {
  return `<div class="iib-icon-shield"><div class="face"></div><div class="emb"></div></div>`;
}
function _iconGadget() {
  return `<div class="iib-icon-gadget"><div class="gear"></div><div class="bolt"></div></div>`;
}
function _iconPaintball() {
  return `<div class="iib-icon-pb"><div class="splat"></div></div>`;
}

function _eventIcon(type) {
  const map = {
    climb: _iconMountain,
    iceBlockDodge: _iconSnowflake,
    iceBlockHit: _iconSnowflake,
    junkPile: _iconGadget,
    beetleFend: _iconGadget,
    beetleFail: _iconGadget,
    gadgetResult: _iconGadget,
    rivalryTaunt: _iconSword,
    helpingHand: _iconShield,
    iceCollision: _iconSnowflake,
    competitiveOneUp: _iconSword,
    wallBuild: _iconFort,
    trapBuild: _iconFort,
    decoyBuild: _iconFlag,
    sabotage: _iconSword,
    sabotageCaught: _iconShield,
    frame: _iconSword,
    buildTeamwork: _iconShield,
    trapArgument: _iconSword,
    advance: _iconFlag,
    trapTrigger: _iconFort,
    paintballWin: _iconPaintball,
    paintballLose: _iconPaintball,
    heroicDefense: _iconShield,
    cowardlyRetreat: _iconSnowflake,
    breach: _iconSword,
    mirrorReflector: _iconGadget,
    fortCrumble: _iconFort,
    framingMoment: _iconSword,
    fortDestroyed: _iconFort,
    flagReal: _iconFlag,
    flagFake: _iconFlag,
    escapeRun: _iconFlag,
    lastShot: _iconPaintball,
    lastShotHit: _iconPaintball,
    flagCaptured: _iconFlag,
    timeout: _iconSnowflake,
  };
  return (map[type] || _iconSnowflake)();
}

function _badgeClass(cls) {
  return cls === 'gold' ? 'iib-bs' : cls === 'red' ? 'iib-bd' : cls === 'blue' ? 'iib-bc' : 'iib-bh';
}

function _av(name, cls = '') {
  const tc = _playerTribeColor(name);
  return `<img class="iib-av${cls ? ' iib-av-' + cls : ''}" src="assets/avatars/${slug(name)}.png" alt="${name}" style="border-color:${tc};" onerror="this.style.display='none'">`;
}

function _playerTribeColor(name) {
  const epIdx = window.vpEpNum;
  const epRecord = gs.episodeHistory?.[epIdx - 1];
  const iib = epRecord?.iceIceBaby;
  if (!iib) return '#5ad8ff';
  const tribe = iib.tribes.find(t => t.members.includes(name));
  return tribe ? tribeColor(tribe.name) : '#5ad8ff';
}

// ── SIDEBAR CONTENT ──
function _buildSidebarContent(ep, screenKey) {
  const iib = ep.iceIceBaby;
  if (!iib) return '';

  const phase = screenKey?.includes('summit') ? 'summit' :
    screenKey?.includes('fort') ? 'fort' :
    screenKey?.includes('ctf') ? 'ctf' :
    screenKey?.includes('results') ? 'results' : 'title';

  const revIdx = _tvState[screenKey]?.idx ?? -1;
  let html = '';

  if (phase === 'title') {
    html += `<div class="iib-sbtitle">TEAMS</div>`;
    iib.tribes.forEach(tribe => {
      const tc = tribeColor(tribe.name);
      html += `<div class="iib-sb-tribe" style="color:${tc};">${tribe.name.toUpperCase()}</div>`;
      tribe.members.forEach(name => {
        html += `<div class="iib-sbrow">${_av(name, 'xs')} <span class="iib-sbname">${name}</span></div>`;
      });
    });
  } else if (phase === 'summit') {
    const meta = window._iibSummitMeta;
    const seen = revIdx >= 0 && meta?.[revIdx] ? meta[revIdx].seen : new Set();
    html += `<div class="iib-sbtitle">SUMMIT PROGRESS</div>`;
    iib.tribes.forEach(tribe => {
      const tc = tribeColor(tribe.name);
      const tribeRevealed = tribe.members.filter(n => seen.has(n));
      html += `<div class="iib-sb-tribe" style="color:${tc};">${tribe.name.toUpperCase()}</div>`;
      if (tribeRevealed.length > 0) {
        const avg = tribeRevealed.reduce((s, n) => s + (iib.climbScores[n] || 0), 0) / tribeRevealed.length;
        html += `<div class="iib-sb-stat">Avg Climb: ${avg.toFixed(1)}</div>`;
      } else {
        html += `<div class="iib-sb-stat">Avg Climb: ---</div>`;
      }
      if (tribe.gadget && seen.size > 0) {
        html += `<div class="iib-sb-gadget">${_iconGadget()} ${tribe.gadget.gadgetName}</div>`;
      }
      tribe.members.forEach(name => {
        html += `<div class="iib-sbrow">${_av(name, 'xs')} <span class="iib-sbname">${name}</span>`;
        html += `<span class="iib-sb-score">${seen.has(name) ? (iib.climbScores[name] || 0).toFixed(1) : '---'}</span></div>`;
      });
    });
  } else if (phase === 'fort') {
    const meta = window._iibFortMeta;
    const snap = revIdx >= 0 && meta?.[revIdx] ? meta[revIdx] : null;
    html += `<div class="iib-sbtitle">FORT STATUS</div>`;
    iib.tribes.forEach(tribe => {
      const tc = tribeColor(tribe.name);
      const maxHP = tribe.name === iib.phase1Winner ? 80 : 60;
      const hp = snap ? (snap.hp[tribe.name] || 0) : 0;
      const hpPct = clamp(hp / (maxHP + 40), 0, 1) * 100;
      const hpColor = hp > maxHP * 0.6 ? '#4fffb0' : hp > maxHP * 0.3 ? '#fbbf24' : '#ef4444';
      html += `<div class="iib-sb-tribe" style="color:${tc};">${tribe.name.toUpperCase()}</div>`;
      html += `<div class="iib-sb-hpbar"><div class="iib-sb-hpfill" style="width:${hpPct}%;background:${hpColor};transition:width .4s;"></div></div>`;
      html += `<div class="iib-sb-stat">${hp.toFixed(0)} HP</div>`;
      if (snap?.caught?.[tribe.name]) {
        html += `<div class="iib-sb-alert">SABOTEUR CAUGHT</div>`;
      }
    });
  } else if (phase === 'ctf') {
    const meta = window._iibCtfMeta;
    const snap = revIdx >= 0 && meta?.[revIdx] ? meta[revIdx] : null;
    html += `<div class="iib-sbtitle">BATTLE STATUS</div>`;
    iib.tribes.forEach(tribe => {
      const tc = tribeColor(tribe.name);
      const maxHP = tribe.name === iib.phase1Winner ? 80 : 60;
      const hp = snap ? (snap.hp[tribe.name] ?? iib.fortHP[tribe.name] ?? 0) : (iib.fortHP[tribe.name] || 0);
      const hpPct = clamp(hp / (maxHP + 40), 0, 1) * 100;
      const hpColor = hp > maxHP * 0.6 ? '#4fffb0' : hp > maxHP * 0.3 ? '#fbbf24' : '#ef4444';
      html += `<div class="iib-sb-tribe" style="color:${tc};">${tribe.name.toUpperCase()}</div>`;
      html += `<div class="iib-sb-hpbar"><div class="iib-sb-hpfill" style="width:${hpPct}%;background:${hpColor};transition:width .4s;"></div></div>`;
      html += `<div class="iib-sb-stat">${hp.toFixed(0)} HP</div>`;
      const atkCount = snap ? (snap.atkCount[tribe.name] || 0) : 0;
      const defCount = snap ? (snap.defCount[tribe.name] || 0) : 0;
      html += `<div class="iib-sb-roles">${_iconSword()} ${atkCount} ATK &nbsp; ${_iconShield()} ${defCount} DEF</div>`;
    });
    if (snap?.flagCaptured) {
      html += `<div class="iib-sb-alert" style="color:#4fffb0;">FLAG CAPTURED BY ${snap.flagCaptured.toUpperCase()}</div>`;
    }
  } else {
    html += `<div class="iib-sbtitle">FINAL STANDINGS</div>`;
    iib.tribesSorted.forEach((tn, i) => {
      const tc = tribeColor(tn);
      const medal = i === 0 ? '1ST' : i === iib.tribesSorted.length - 1 ? 'LAST' : `${i + 1}${i === 1 ? 'ND' : 'RD'}`;
      const medalColor = i === 0 ? '#4fffb0' : i === iib.tribesSorted.length - 1 ? '#ef4444' : '#5ad8ff';
      html += `<div class="iib-sb-standing"><span style="color:${medalColor};font-weight:700;">${medal}</span> <span style="color:${tc};">${tn}</span></div>`;
    });
  }

  return html;
}

function _buildSidebar(ep, screenKey) {
  return `<div class="iib-sidebar" id="iib-sidebar"><div id="iib-sidebar-inner">${_buildSidebarContent(ep, screenKey)}</div></div>`;
}

// ── ATMOSPHERE ──
function _buildAtmosphere(phaseCls) {
  let html = `<div class="iib-atmos ${phaseCls || ''}">`;

  // Aurora bands
  html += `<div class="iib-aurora"><div class="iib-aband"></div><div class="iib-aband"></div><div class="iib-aband"></div></div>`;

  // Mountains
  html += `<div class="iib-mountains"><div class="iib-mtn m1"></div><div class="iib-mtn m2"></div><div class="iib-mtn m3"></div></div>`;

  // Snowfall (45 flakes)
  html += `<div class="iib-snowfall">`;
  for (let i = 0; i < 45; i++) {
    const left = ((i * 31 + 7) % 100);
    const sz = 2 + (i % 4);
    const dur = 5 + (i % 9);
    const delay = -((i * 0.7) % 10);
    const opacity = 0.1 + (i % 5) * 0.08;
    html += `<div class="iib-flake" style="left:${left}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s;opacity:${opacity};"></div>`;
  }
  html += `</div>`;

  // Frost edges
  html += `<div class="iib-frost-t"></div><div class="iib-frost-l"></div><div class="iib-frost-r"></div>`;

  html += `</div>`;
  return html;
}

// ── TICKER BAR ──
function _buildTicker() {
  const msgs = [...TICKER_MESSAGES].sort(() => Math.random() - 0.5).slice(0, 8);
  const tickerText = msgs.map(m => `<span class="iib-ticker-item">${m}</span>`).join(' ');
  return `<div class="iib-topbar">
    <div class="iib-onair"><div class="iib-onair-dot"></div> ON AIR</div>
    <div class="iib-eptag">EP ${window.vpEpNum || '?'}</div>
    <div class="iib-ticker"><div class="iib-ticker-scroll">${tickerText}${tickerText}</div></div>
    <div class="iib-chris-tv">CHRIS.TV</div>
  </div>`;
}

// ── CONTROLS ──
function _buildControls(screenKey, total) {
  const suffix = screenKey.replace('iib-', '');
  return `<div class="iib-controls" id="iib-controls-${suffix}">
    <button class="iib-btn" onclick="iibRevealNext('${screenKey}',${total})">NEXT</button>
    <span class="iib-counter" id="iib-counter-${suffix}">0 / ${total}</span>
    <button class="iib-btn" onclick="iibRevealAll('${screenKey}',${total})">ALL</button>
  </div>`;
}

// ── CARD BUILDER ──
function _card(event, idx, screenKey, extraClass = '') {
  const suffix = screenKey.replace('iib-', '');
  const icon = _eventIcon(event.type);
  const badge = event.badge ? `<span class="iib-badge ${_badgeClass(event.badgeClass)}">${event.badge}</span>` : '';
  const playerAv = event.player ? _av(event.player) : '';
  const dangerClass = ['iceBlockHit', 'sabotage', 'trapTrigger', 'breach', 'fortCrumble', 'fortDestroyed', 'cowardlyRetreat', 'framingMoment'].includes(event.type) ? ' iib-card-danger' : '';
  const shakeClass = ['sabotage', 'fortCrumble', 'fortDestroyed', 'breach'].includes(event.type) ? ' iib-shake-card' : '';
  return `<div class="iib-card${dangerClass}${shakeClass} ${extraClass}" id="iib-step-${suffix}-${idx}">
    <div class="iib-card-hdr">${icon}${playerAv}<div class="iib-card-title">${event.type.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>${badge}</div>
    <div class="iib-card-txt">${event.text}</div>
  </div>`;
}

// ── SHELL WRAPPER ──
function _iibShell(content, ep, phaseCls) {
  const sidebar = _buildSidebar(ep, phaseCls);
  window._iibEpRecord = ep;

  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Inter:wght@400;600;700&display=swap');

:root{--iib-deep:#04070f;--iib-deep2:#0a1628;--iib-frost:#5ad8ff;--iib-aurora-g:#4fffb0;--iib-aurora-p:#b07cff;--iib-danger:#ef4444;--iib-gold:#fbbf24;--iib-white:#f0f9ff;--iib-glass:rgba(90,216,255,0.04);--iib-gb:rgba(90,216,255,0.10);}

.iib-shell{max-width:1100px;margin:0 auto;padding:20px;position:relative;z-index:2;font-family:'Inter',sans-serif;color:var(--iib-white);min-height:800px;display:flex;gap:16px;align-items:flex-start;}
.iib-shell *{box-sizing:border-box;}
.iib-main{flex:1;min-width:0;}

/* ═══ ATMOSPHERE ═══ */
.iib-atmos{position:fixed;top:46px;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:0;background:linear-gradient(180deg,var(--iib-deep) 0%,var(--iib-deep2) 60%,#0d1f3a 100%);}
.iib-atmos.phase-summit{background:linear-gradient(180deg,#060e1f 0%,#0b1a35 40%,#132b52 100%);}
.iib-atmos.phase-fort{background:linear-gradient(180deg,#0f1520 0%,#1a2035 40%,#2a1f15 100%);}
.iib-atmos.phase-ctf{background:linear-gradient(180deg,#020510 0%,#08102a 40%,#0a0a20 100%);}

.iib-aurora{position:absolute;top:0;left:0;right:0;height:500px;pointer-events:none;overflow:hidden;}
.iib-aband{position:absolute;width:300%;height:120px;border-radius:50%;filter:blur(60px);}
.iib-aband:nth-child(1){background:linear-gradient(90deg,transparent 5%,var(--iib-aurora-g) 25%,var(--iib-frost) 50%,#2dd4bf 75%,transparent 95%);top:20px;left:-40%;opacity:.2;animation:iib-aurora 18s ease-in-out infinite alternate;}
.iib-aband:nth-child(2){background:linear-gradient(90deg,transparent 10%,var(--iib-aurora-p) 35%,var(--iib-aurora-g) 65%,transparent 90%);top:80px;left:-60%;opacity:.15;animation:iib-aurora 24s ease-in-out infinite alternate-reverse;}
.iib-aband:nth-child(3){background:linear-gradient(90deg,transparent,var(--iib-frost),#2dd4bf,transparent);top:150px;left:-20%;opacity:.1;animation:iib-aurora 14s ease-in-out infinite alternate;}
@keyframes iib-aurora{0%{transform:translateX(-10%) scaleY(.7) rotate(-1deg);}50%{transform:translateX(12%) scaleY(2) rotate(1.5deg);}100%{transform:translateX(-8%) scaleY(1) rotate(-.5deg);}}

.iib-mountains{position:absolute;bottom:0;left:0;right:0;height:350px;pointer-events:none;}
.iib-mtn{position:absolute;bottom:0;}
.iib-mtn.m1{left:-5%;width:0;height:0;border-style:solid;border-width:0 200px 280px 180px;border-color:transparent transparent rgba(10,22,40,.7) transparent;}
.iib-mtn.m2{left:35%;width:0;height:0;border-style:solid;border-width:0 240px 340px 200px;border-color:transparent transparent rgba(8,18,36,.8) transparent;}
.iib-mtn.m3{left:72%;width:0;height:0;border-style:solid;border-width:0 180px 250px 160px;border-color:transparent transparent rgba(12,22,40,.65) transparent;}

.iib-snowfall{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden;}
.iib-flake{position:absolute;background:white;border-radius:50%;box-shadow:0 0 3px rgba(255,255,255,.3);animation:iib-fall linear infinite;}
@keyframes iib-fall{0%{transform:translateY(-20px) rotate(0);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translateY(100vh) rotate(360deg);opacity:0;}}

.iib-frost-t{position:fixed;top:46px;left:0;right:0;height:80px;pointer-events:none;background:linear-gradient(to bottom,rgba(90,216,255,.08),transparent);z-index:1;}
.iib-frost-l{position:fixed;top:46px;bottom:0;left:0;width:40px;pointer-events:none;background:linear-gradient(to right,rgba(90,216,255,.05),transparent);z-index:1;}
.iib-frost-r{position:fixed;top:46px;bottom:0;right:0;width:40px;pointer-events:none;background:linear-gradient(to left,rgba(90,216,255,.05),transparent);z-index:1;}

/* ═══ TOP BAR ═══ */
.iib-topbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;padding:6px 14px;background:rgba(4,7,15,.9);border-bottom:1px solid rgba(90,216,255,.15);backdrop-filter:blur(8px);font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;color:var(--iib-frost);}
.iib-onair{display:flex;align-items:center;gap:5px;font-weight:700;color:var(--iib-aurora-g);}
.iib-onair-dot{width:8px;height:8px;border-radius:50%;background:var(--iib-aurora-g);animation:iib-pulse 1.5s ease-in-out infinite;}
@keyframes iib-pulse{0%,100%{opacity:1;box-shadow:0 0 4px var(--iib-aurora-g);}50%{opacity:.3;box-shadow:0 0 12px var(--iib-aurora-g);}}
.iib-eptag{padding:2px 8px;border:1px solid rgba(90,216,255,.3);border-radius:4px;font-size:9px;}
.iib-ticker{flex:1;overflow:hidden;white-space:nowrap;position:relative;}
.iib-ticker-scroll{display:inline-block;animation:iib-ticker 60s linear infinite;}
@keyframes iib-ticker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
.iib-ticker-item{margin-right:40px;color:rgba(90,216,255,.6);}
.iib-chris-tv{font-family:'Bebas Neue',cursive;font-size:14px;letter-spacing:2px;color:var(--iib-gold);text-shadow:0 0 8px rgba(251,191,36,.3);}

/* ═══ CARDS ═══ */
.iib-card{background:linear-gradient(135deg,rgba(90,216,255,.05),rgba(176,124,255,.02));border:1px solid rgba(90,216,255,.10);border-radius:10px;padding:16px 20px;margin:12px 0;position:relative;overflow:hidden;opacity:0;transform:translateY(20px);transition:none;}
.iib-visible .iib-card,.iib-card.iib-visible,.iib-visible{animation:iib-card-in .6s cubic-bezier(.16,1,.3,1) forwards;}
div[id^="iib-step-"].iib-visible{opacity:1;transform:translateY(0);}
div[id^="iib-step-"]{opacity:0;transform:translateY(20px);}
div[id^="iib-step-"].iib-visible{animation:iib-card-in .6s cubic-bezier(.16,1,.3,1) forwards;}
@keyframes iib-card-in{0%{opacity:0;transform:translateY(20px);}100%{opacity:1;transform:translateY(0);}}
.iib-card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 10%,rgba(90,216,255,.3) 50%,transparent 90%);animation:iib-shimmer 4s ease-in-out infinite;}
@keyframes iib-shimmer{0%,100%{opacity:.3;}50%{opacity:1;}}
.iib-card-danger{border-color:rgba(239,68,68,.25)!important;background:linear-gradient(135deg,rgba(239,68,68,.06),rgba(90,216,255,.02))!important;}
.iib-shake-card{animation:iib-shake .5s ease-in-out,iib-card-in .6s cubic-bezier(.16,1,.3,1) forwards!important;}
@keyframes iib-shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-4px);}40%{transform:translateX(4px);}60%{transform:translateX(-3px);}80%{transform:translateX(2px);}}

.iib-card-hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.iib-card-title{font-family:'Bebas Neue',cursive;font-size:13px;color:var(--iib-frost);letter-spacing:1px;}
.iib-card-txt{font-size:12.5px;line-height:1.65;color:rgba(240,249,255,.7);}
.iib-card-txt strong{color:var(--iib-frost);}
.iib-badge{margin-left:auto;padding:3px 10px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:1px;white-space:nowrap;font-family:'Share Tech Mono',monospace;}
.iib-bs{background:rgba(79,255,176,.08);color:var(--iib-aurora-g);border:1px solid rgba(79,255,176,.2);}
.iib-bd{background:rgba(239,68,68,.08);color:var(--iib-danger);border:1px solid rgba(239,68,68,.2);}
.iib-bc{background:rgba(90,216,255,.08);color:var(--iib-frost);border:1px solid rgba(90,216,255,.2);}
.iib-bh{background:rgba(251,191,36,.08);color:var(--iib-gold);border:1px solid rgba(251,191,36,.2);}

/* Avatars */
.iib-av{width:32px;height:32px;border-radius:50%;border:2px solid var(--iib-frost);object-fit:cover;flex-shrink:0;}
.iib-av-xs{width:24px;height:24px;border-width:1px;}
.iib-av-lg{width:48px;height:48px;}

/* ═══ SIDEBAR ═══ */
.iib-sidebar{width:320px;flex-shrink:0;position:sticky;top:60px;max-height:calc(100vh - 100px);overflow-y:auto;background:rgba(4,7,15,.88);border:1px solid rgba(90,216,255,.15);border-radius:12px;padding:18px;backdrop-filter:blur(8px);font-size:13px;}
.iib-sbtitle{font-family:'Bebas Neue',cursive;font-size:18px;letter-spacing:2px;color:var(--iib-frost);margin-bottom:12px;border-bottom:1px solid rgba(90,216,255,.2);padding-bottom:8px;}
.iib-sb-tribe{font-family:'Bebas Neue',cursive;font-size:14px;letter-spacing:2px;margin:12px 0 6px;border-bottom:1px solid currentColor;padding-bottom:3px;opacity:.85;}
.iib-sb-stat{font-family:'Share Tech Mono',monospace;font-size:12px;color:rgba(90,216,255,.7);margin:3px 0;}
.iib-sb-gadget{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--iib-gold);margin:4px 0;}
.iib-sbrow{display:flex;align-items:center;gap:8px;padding:4px 0;}
.iib-sbname{font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iib-sb-score{font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--iib-aurora-g);font-weight:600;}
.iib-sb-hpbar{width:100%;height:10px;background:rgba(90,216,255,.08);border-radius:5px;overflow:hidden;margin:5px 0;}
.iib-sb-hpfill{height:100%;border-radius:5px;transition:width 1s cubic-bezier(.34,1.56,.64,1);}
.iib-sb-roles{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(90,216,255,.6);margin:3px 0;}
.iib-sb-alert{font-family:'Bebas Neue',cursive;font-size:15px;letter-spacing:1px;color:var(--iib-danger);margin:10px 0;text-align:center;}
.iib-sb-standing{font-family:'Share Tech Mono',monospace;font-size:14px;padding:5px 0;border-bottom:1px solid rgba(90,216,255,.08);}

/* ═══ CSS ICONS ═══ */
.iib-icon-snow{width:18px;height:18px;position:relative;flex-shrink:0;filter:drop-shadow(0 0 3px rgba(90,216,255,.4));}
.iib-icon-snow .a{position:absolute;top:50%;left:50%;width:2px;height:14px;background:var(--iib-frost);border-radius:1px;}
.iib-icon-snow .a:nth-child(1){transform:translate(-50%,-50%) rotate(0);}
.iib-icon-snow .a:nth-child(2){transform:translate(-50%,-50%) rotate(60deg);}
.iib-icon-snow .a:nth-child(3){transform:translate(-50%,-50%) rotate(-60deg);}
.iib-icon-snow .d{position:absolute;top:50%;left:50%;width:4px;height:4px;background:var(--iib-white);border-radius:50%;transform:translate(-50%,-50%);}

.iib-icon-mtn{width:20px;height:18px;position:relative;flex-shrink:0;}
.iib-icon-mtn .pk{position:absolute;bottom:0;left:2px;width:0;height:0;border-style:solid;border-width:0 8px 14px 8px;border-color:transparent transparent rgba(90,216,255,.3) transparent;}
.iib-icon-mtn .cap{position:absolute;bottom:8px;left:5px;width:0;height:0;border-style:solid;border-width:0 5px 6px 5px;border-color:transparent transparent rgba(255,255,255,.5) transparent;}

.iib-icon-fort{width:22px;height:18px;position:relative;flex-shrink:0;}
.iib-icon-fort .w1,.iib-icon-fort .w2,.iib-icon-fort .w3{position:absolute;bottom:0;background:rgba(90,216,255,.25);border-radius:1px;}
.iib-icon-fort .w1{left:1px;width:5px;height:14px;}
.iib-icon-fort .w2{left:8px;width:6px;height:18px;}
.iib-icon-fort .w3{left:16px;width:5px;height:12px;}
.iib-icon-fort .bt{position:absolute;top:0;left:6px;width:10px;height:3px;background:rgba(90,216,255,.15);border-radius:1px;}

.iib-icon-flag{width:18px;height:20px;position:relative;flex-shrink:0;}
.iib-icon-flag .pole{position:absolute;bottom:0;left:4px;width:2px;height:18px;background:rgba(90,216,255,.4);}
.iib-icon-flag .cloth{position:absolute;top:1px;left:6px;width:10px;height:7px;background:var(--iib-aurora-g);border-radius:0 2px 2px 0;animation:iib-flagwave 2s ease-in-out infinite;}
@keyframes iib-flagwave{0%,100%{transform:skewY(0);}50%{transform:skewY(-3deg);}}

.iib-icon-sword{width:18px;height:20px;position:relative;flex-shrink:0;}
.iib-icon-sword .blade{position:absolute;top:0;left:8px;width:2px;height:14px;background:linear-gradient(180deg,#fff,var(--iib-frost));border-radius:1px 1px 0 0;}
.iib-icon-sword .guard{position:absolute;top:12px;left:4px;width:10px;height:2px;background:var(--iib-gold);border-radius:1px;}
.iib-icon-sword .hilt{position:absolute;top:14px;left:7px;width:4px;height:5px;background:rgba(251,191,36,.5);border-radius:0 0 2px 2px;}

.iib-icon-shield{width:18px;height:20px;position:relative;flex-shrink:0;}
.iib-icon-shield .face{position:absolute;top:1px;left:1px;width:16px;height:18px;background:rgba(79,255,176,.15);border:1px solid rgba(79,255,176,.3);border-radius:2px 2px 8px 8px;clip-path:polygon(50% 0,100% 0,100% 70%,50% 100%,0 70%,0 0);}
.iib-icon-shield .emb{position:absolute;top:6px;left:6px;width:6px;height:6px;background:var(--iib-aurora-g);border-radius:50%;opacity:.6;}

.iib-icon-gadget{width:20px;height:20px;position:relative;flex-shrink:0;}
.iib-icon-gadget .gear{position:absolute;top:2px;left:2px;width:12px;height:12px;border:2px solid var(--iib-gold);border-radius:50%;animation:iib-gear 4s linear infinite;}
@keyframes iib-gear{0%{transform:rotate(0);}100%{transform:rotate(360deg);}}
.iib-icon-gadget .bolt{position:absolute;bottom:2px;right:2px;width:8px;height:3px;background:var(--iib-frost);border-radius:1px;transform:rotate(-30deg);}

.iib-icon-pb{width:18px;height:18px;position:relative;flex-shrink:0;}
.iib-icon-pb .splat{position:absolute;top:2px;left:2px;width:14px;height:14px;background:radial-gradient(circle,var(--iib-danger) 30%,rgba(239,68,68,.3) 70%);border-radius:50% 40% 60% 45%;}

/* ═══ CONTROLS ═══ */
.iib-controls{position:fixed;bottom:0;left:0;right:0;z-index:20;display:flex;align-items:center;justify-content:center;gap:16px;padding:10px 20px;background:rgba(4,7,15,.95);border-top:1px solid rgba(90,216,255,.15);backdrop-filter:blur(8px);}
.iib-btn{font-family:'Bebas Neue',cursive;font-size:14px;letter-spacing:2px;padding:6px 24px;border:1px solid rgba(90,216,255,.3);background:rgba(90,216,255,.08);color:var(--iib-frost);border-radius:6px;cursor:pointer;transition:all .2s;}
.iib-btn:hover{background:rgba(90,216,255,.15);border-color:var(--iib-frost);}
.iib-counter{font-family:'Share Tech Mono',monospace;font-size:12px;color:rgba(90,216,255,.6);}

/* ═══ TITLE CARD ═══ */
.iib-title-card{text-align:center;padding:60px 20px;}
.iib-title-main{font-family:'Bebas Neue',cursive;font-size:56px;letter-spacing:6px;color:var(--iib-frost);text-shadow:0 0 30px rgba(90,216,255,.3),0 0 60px rgba(90,216,255,.1);animation:iib-title-glow 3s ease-in-out infinite alternate;}
@keyframes iib-title-glow{0%{text-shadow:0 0 30px rgba(90,216,255,.3);}100%{text-shadow:0 0 40px rgba(90,216,255,.5),0 4px 20px rgba(176,124,255,.2);}}
.iib-title-sub{font-family:'Share Tech Mono',monospace;font-size:14px;letter-spacing:3px;color:var(--iib-aurora-p);margin-top:8px;}
.iib-title-desc{font-size:13px;color:rgba(240,249,255,.5);margin-top:16px;max-width:500px;margin-left:auto;margin-right:auto;line-height:1.6;}
.iib-team-row{display:flex;justify-content:center;gap:32px;margin-top:30px;flex-wrap:wrap;}
.iib-team-card{background:rgba(90,216,255,.04);border:1px solid rgba(90,216,255,.1);border-radius:10px;padding:16px 20px;min-width:200px;text-align:center;}
.iib-team-name{font-family:'Bebas Neue',cursive;font-size:18px;letter-spacing:2px;margin-bottom:10px;}
.iib-team-avatars{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;}
.iib-host-line{font-style:italic;color:rgba(240,249,255,.55);margin:20px auto;max-width:600px;font-size:12.5px;line-height:1.5;text-align:center;padding:12px;border-left:2px solid var(--iib-gold);background:rgba(251,191,36,.03);border-radius:0 6px 6px 0;}

/* ═══ PHASE HEADER ═══ */
.iib-phase-hdr{text-align:center;margin:20px 0 30px;padding:20px;}
.iib-phase-title{font-family:'Bebas Neue',cursive;font-size:32px;letter-spacing:4px;color:var(--iib-frost);}
.iib-phase-sub{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--iib-aurora-p);letter-spacing:2px;margin-top:4px;}

/* ═══ RESULTS ═══ */
.iib-result-card{background:rgba(90,216,255,.04);border:1px solid rgba(90,216,255,.15);border-radius:12px;padding:24px;margin:16px 0;text-align:center;}
.iib-result-tribe{font-family:'Bebas Neue',cursive;font-size:28px;letter-spacing:3px;margin-bottom:8px;}
.iib-result-label{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;margin-bottom:12px;}
.iib-result-avatars{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:12px 0;}

/* ═══ BEAT HEADER ═══ */
.iib-beat-hdr{font-family:'Bebas Neue',cursive;font-size:14px;letter-spacing:2px;color:var(--iib-aurora-p);margin:20px 0 8px;padding:6px 12px;border-left:3px solid var(--iib-aurora-p);background:rgba(176,124,255,.05);border-radius:0 6px 6px 0;}

/* ═══ FLAVOR ═══ */
.iib-flavor{font-style:italic;font-size:11px;color:rgba(240,249,255,.3);padding:8px 14px;margin:10px 0;border-left:1px solid rgba(176,124,255,.15);}

/* ═══ REDUCED MOTION ═══ */
@media(prefers-reduced-motion:reduce){
  .iib-flake,.iib-aband,.iib-onair-dot,.iib-ticker-scroll,.iib-icon-gadget .gear{animation:none!important;}
  .iib-flake{display:none;}
  div[id^="iib-step-"]{opacity:1;transform:none;}
  div[id^="iib-step-"].iib-visible{animation:none;}
  .iib-shake-card{animation:none!important;}
  @keyframes iib-card-in{0%,100%{opacity:1;transform:none;}}
  @keyframes iib-shimmer{0%,100%{opacity:.5;}}
}
</style>

${_buildAtmosphere(phaseCls)}
<div class="iib-shell">
  <div class="iib-main">
    ${_buildTicker()}
    ${content}
  </div>
  ${sidebar}
</div>`;
}

// ══════════════════════════════════════════════════════════════════════
// VP SCREEN BUILDERS
// ══════════════════════════════════════════════════════════════════════

export function rpBuildIIBTitleCard(ep) {
  const iib = ep.iceIceBaby;
  if (!iib) return '';

  let content = `<div class="iib-title-card">`;
  content += `<div class="iib-title-main">ICE ICE BABY</div>`;
  content += `<div class="iib-title-sub">SIEGE & STEAL</div>`;
  content += `<div class="iib-title-desc">Three phases. Summit scramble. Fort construction. Capture the flag.<br>The losing tribe goes to tribal council.</div>`;

  // Host intro
  content += `<div class="iib-host-line">${iib.hostIntro}</div>`;

  // Team cards
  content += `<div class="iib-team-row">`;
  iib.tribes.forEach(tribe => {
    const tc = tribeColor(tribe.name);
    content += `<div class="iib-team-card" style="border-color:${tc}33;">`;
    content += `<div class="iib-team-name" style="color:${tc};">${tribe.name}</div>`;
    content += `<div class="iib-team-avatars">`;
    tribe.members.forEach(m => { content += _av(m); });
    content += `</div></div>`;
  });
  content += `</div></div>`;

  return _iibShell(content, ep, 'phase-title');
}

export function rpBuildIIBSummit(ep) {
  const iib = ep.iceIceBaby;
  if (!iib) return '';

  const screenKey = 'iib-summit';
  const events = iib.phase1Events || [];
  const totalCards = events.length + 1; // +1 for result card
  _ensureState(screenKey, totalCards);

  let content = `<div class="iib-phase-hdr">`;
  content += `<div class="iib-phase-title">PHASE 1: SUMMIT SCRAMBLE</div>`;
  content += `<div class="iib-phase-sub">CLIMB // DODGE // BUILD</div>`;
  content += `</div>`;

  const summitMeta = [];
  const seenPlayers = new Set();
  let lastBeat = -1;
  const shuffledAtmo = [...ATMOSPHERE_FLAVOR].sort(() => Math.random() - 0.5);
  let atmoIdx = 0;
  events.forEach((evt, idx) => {
    if (evt.player) seenPlayers.add(evt.player);
    if (evt.players) evt.players.forEach(p => seenPlayers.add(p));
    summitMeta.push({ seen: new Set(seenPlayers) });
    // Beat header
    if (evt.beat !== undefined && evt.beat !== lastBeat) {
      lastBeat = evt.beat;
      content += `<div class="iib-beat-hdr">BEAT ${evt.beat + 1}</div>`;
    }
    // Atmosphere flavor (shuffled, no repeats until pool exhausted)
    if (idx > 0 && idx % 6 === 0) {
      content += `<div class="iib-flavor">${shuffledAtmo[atmoIdx % shuffledAtmo.length]}</div>`;
      atmoIdx++;
    }
    content += _card(evt, idx, screenKey);
  });
  window._iibSummitMeta = summitMeta;

  // Phase 1 result summary (included in reveal count)
  summitMeta.push({ seen: new Set(seenPlayers) });
  content += `<div class="iib-result-card" id="iib-step-summit-${events.length}">`;
  content += `<div class="iib-result-label">SUMMIT WINNER</div>`;
  content += `<div class="iib-result-tribe" style="color:${tribeColor(iib.phase1Winner)};">${iib.phase1Winner}</div>`;
  content += `<div class="iib-card-txt" style="text-align:center;">Earns the stronger fort (80 HP) and a gadget upgrade!</div>`;
  content += `</div>`;

  content += _buildControls(screenKey, totalCards);

  return _iibShell(content, ep, 'phase-summit');
}

export function rpBuildIIBFortBuild(ep) {
  const iib = ep.iceIceBaby;
  if (!iib) return '';

  const screenKey = 'iib-fort';
  const events = iib.phase2Events || [];
  const total = events.length;
  _ensureState(screenKey, total);

  let content = `<div class="iib-phase-hdr">`;
  content += `<div class="iib-phase-title">PHASE 2: FORT CONSTRUCTION</div>`;
  content += `<div class="iib-phase-sub">BUILD // TRAP // DECEIVE</div>`;
  content += `</div>`;

  content += `<div class="iib-host-line">${iib.hostPhase2}</div>`;

  const runHP = {};
  const caught = {};
  iib.tribes.forEach(t => { runHP[t.name] = t.name === iib.phase1Winner ? 80 : 60; });
  const fortMeta = [];
  let lastBeat = -1;
  const shuffledAtmo2 = [...ATMOSPHERE_FLAVOR].sort(() => Math.random() - 0.5);
  let atmoIdx2 = 0;
  events.forEach((evt, idx) => {
    if (evt.type === 'wallBuild') runHP[evt.tribe] += parseFloat(evt.hpAdd || 0);
    else if (evt.type === 'sabotage') runHP[evt.tribe] -= parseFloat(evt.damage || 0);
    else if (evt.type === 'sabotageCaught') { caught[evt.tribe] = true; runHP[evt.tribe] += parseFloat(iib.saboteurData?.[evt.tribe]?.damage || 0) * 0.5; }
    fortMeta.push({ hp: { ...runHP }, caught: { ...caught } });
    if (evt.beat !== undefined && evt.beat !== lastBeat) {
      lastBeat = evt.beat;
      content += `<div class="iib-beat-hdr">BUILD BEAT ${evt.beat + 1}</div>`;
    }
    if (idx > 0 && idx % 5 === 0) {
      content += `<div class="iib-flavor">${shuffledAtmo2[atmoIdx2 % shuffledAtmo2.length]}</div>`;
      atmoIdx2++;
    }
    content += _card(evt, idx, screenKey);
  });
  window._iibFortMeta = fortMeta;

  content += _buildControls(screenKey, total);

  return _iibShell(content, ep, 'phase-fort');
}

export function rpBuildIIBCtfAssault(ep) {
  const iib = ep.iceIceBaby;
  if (!iib) return '';

  const screenKey = 'iib-ctf';
  const events = iib.phase3Events || [];
  const total = events.length;
  _ensureState(screenKey, total);

  let content = `<div class="iib-phase-hdr">`;
  content += `<div class="iib-phase-title">PHASE 3: CTF ASSAULT</div>`;
  content += `<div class="iib-phase-sub">BREACH // BATTLE // CAPTURE</div>`;
  content += `</div>`;

  content += `<div class="iib-host-line">${iib.hostPhase3}</div>`;

  const ctfHP = {};
  iib.tribes.forEach(t => { ctfHP[t.name] = iib.fortHP[t.name] || 0; });
  const ctfAtkCount = {};
  const ctfDefCount = {};
  iib.tribes.forEach(t => { ctfAtkCount[t.name] = 0; ctfDefCount[t.name] = 0; });
  const ctfMeta = [];
  let ctfFlag = null;
  let lastRound = -1;
  const shuffledAtmo3 = [...ATMOSPHERE_FLAVOR].sort(() => Math.random() - 0.5);
  let atmoIdx3 = 0;
  events.forEach((evt, idx) => {
    if (evt.type === 'breach' && evt.targetTribe) ctfHP[evt.targetTribe] = parseFloat(evt.remainingHP || 0);
    else if (evt.type === 'fortDestroyed' && evt.tribe) ctfHP[evt.tribe] = 0;
    if (evt.type === 'paintballWin') { ctfAtkCount[evt.tribe] = (ctfAtkCount[evt.tribe] || 0) + 1; }
    if (evt.type === 'heroicDefense') { ctfDefCount[evt.tribe] = (ctfDefCount[evt.tribe] || 0) + 1; }
    if (evt.type === 'flagCapture' || evt.type === 'escapeSuccess') ctfFlag = evt.tribe;
    ctfMeta.push({ hp: { ...ctfHP }, atkCount: { ...ctfAtkCount }, defCount: { ...ctfDefCount }, flagCaptured: ctfFlag });
    if (evt.round !== undefined && evt.round !== lastRound) {
      lastRound = evt.round;
      content += `<div class="iib-beat-hdr">ROUND ${evt.round + 1}</div>`;
    }
    if (idx > 0 && idx % 4 === 0) {
      content += `<div class="iib-flavor">${shuffledAtmo3[atmoIdx3 % shuffledAtmo3.length]}</div>`;
      atmoIdx3++;
    }
    content += _card(evt, idx, screenKey);
  });
  window._iibCtfMeta = ctfMeta;

  content += _buildControls(screenKey, total);

  return _iibShell(content, ep, 'phase-ctf');
}

export function rpBuildIIBResults(ep) {
  const iib = ep.iceIceBaby;
  if (!iib) return '';

  const screenKey = 'iib-results';
  const steps = [];

  // Winner announcement
  steps.push(`<div class="iib-host-line">${iib.hostWinner}</div>`);

  // Winner card
  const winnerTribe = iib.tribes.find(t => t.name === iib.winner);
  steps.push(`<div class="iib-result-card" style="border-color:${tribeColor(iib.winner)}44;">
    <div class="iib-result-label" style="color:var(--iib-aurora-g);">IMMUNITY WINNER</div>
    <div class="iib-result-tribe" style="color:${tribeColor(iib.winner)};">${iib.winner}</div>
    <div class="iib-result-avatars">${(winnerTribe?.members || []).map(m => _av(m, 'lg')).join('')}</div>
  </div>`);

  // Loser card
  steps.push(`<div class="iib-host-line">${iib.hostLoser}</div>`);
  const loserTribe = iib.tribes.find(t => t.name === iib.loser);
  steps.push(`<div class="iib-result-card" style="border-color:${tribeColor(iib.loser)}44;">
    <div class="iib-result-label" style="color:var(--iib-danger);">TRIBAL COUNCIL</div>
    <div class="iib-result-tribe" style="color:${tribeColor(iib.loser)};">${iib.loser}</div>
    <div class="iib-result-avatars">${(loserTribe?.members || []).map(m => _av(m)).join('')}</div>
  </div>`);

  // Saboteur reveal
  Object.entries(iib.saboteurData || {}).forEach(([tribeName, sd]) => {
    if (sd.caught) {
      steps.push(`<div class="iib-result-card iib-card-danger">
        <div class="iib-result-label" style="color:var(--iib-danger);">SABOTEUR CAUGHT</div>
        <div class="iib-card-txt" style="text-align:center;"><strong>${sd.saboteur}</strong> was caught sabotaging ${tribeName}'s fort by ${sd.detector}. Massive heat incoming.</div>
      </div>`);
    } else {
      steps.push(`<div class="iib-result-card" style="border-color:rgba(176,124,255,.3);">
        <div class="iib-result-label" style="color:var(--iib-aurora-p);">UNCAUGHT SABOTEUR</div>
        <div class="iib-card-txt" style="text-align:center;"><strong>${sd.saboteur}</strong> sabotaged ${tribeName}'s fort and framed <strong>${sd.framed}</strong>. Nobody knows the truth.</div>
      </div>`);
    }
  });

  // Gadget summary
  Object.entries(iib.gadgets || {}).forEach(([tribeName, g]) => {
    steps.push(`<div class="iib-result-card">
      <div class="iib-result-label" style="color:var(--iib-gold);">GADGET: ${g.gadgetName.toUpperCase()}</div>
      <div class="iib-card-txt" style="text-align:center;">Built by <strong>${g.builder}</strong> for ${tribeName}. Tier: ${g.tier.toUpperCase()}</div>
    </div>`);
  });

  const total = steps.length;
  _ensureState(screenKey, total);

  let content = `<div class="iib-phase-hdr">`;
  content += `<div class="iib-phase-title">RESULTS</div>`;
  content += `<div class="iib-phase-sub">VICTORY // DEFEAT // SECRETS</div>`;
  content += `</div>`;

  steps.forEach((html, idx) => {
    const suffix = screenKey.replace('iib-', '');
    content += `<div id="iib-step-${suffix}-${idx}">${html}</div>`;
  });

  content += _buildControls(screenKey, total);

  return _iibShell(content, ep, 'phase-results');
}
