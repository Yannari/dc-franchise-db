// js/chal/slap-slap-revolution.js — Slap Slap Revolution: pre-merge tribe challenge
// Phase 1: sausage grind + bobsled descent | Phase 2: 1v1 slap-dance tournament on electrified DDR platforms
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
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════

// ── GRIND PHASE ──
const GRIND_GOOD_GRINDER = [
  (n, pr) => `${n} cranks the grinder handle like ${pr.posAdj} life depends on it. Mystery meat flies through. Pure output.`,
  (n, pr) => `${n} finds a rhythm with the grinder — steady, powerful, relentless. The sausage casing fills fast.`,
  (n, pr) => `The grinder screams under ${n}'s grip. ${pr.Sub} is processing meat at an alarming rate.`,
  (n, pr) => `${n} puts ${pr.posAdj} whole body into each turn of the grinder. Efficient. Brutal. Perfect.`,
  (n, pr) => `${n} attacks the grinder with controlled fury. Chunks of mystery meat become smooth paste in seconds.`,
  (n, pr) => `"Is ${n} part machine?" ${host()} mutters. The grinder barely slows down under ${pr.posAdj} hands.`,
  (n, pr) => `${n} grinds with mechanical precision. Every rotation is identical. The sausage quality is exceptional.`,
  (n, pr) => `${n} leans into the grinder crank. The handle blurs. Meat goes in, sausage comes out. No questions asked.`,
];

const GRIND_BAD_GRINDER = [
  (n, pr) => `${n} struggles with the grinder. The handle jams. ${pr.Sub} yanks it free but loses a chunk of meat on the floor.`,
  (n, pr) => `The grinder fights back against ${n}. ${pr.Sub} can barely get it to turn. Mystery meat clogs the output.`,
  (n, pr) => `${n} tries a two-handed approach on the grinder. It works for three seconds, then everything jams.`,
  (n, pr) => `"That's... not how you grind." ${n}'s teammates wince as ${pr.sub} forces the wrong cut through.`,
  (n, pr) => `${n} grinds in bursts — three cranks, jam, clear, repeat. It's agonizingly slow.`,
  (n, pr) => `The grinder wins. ${n} steps back, panting. The sausage coming out the other end looks questionable at best.`,
  (n, pr) => `${n} pushes too much meat in at once and the grinder seizes. ${pr.Sub} has to disassemble it to clear the blockage.`,
  (n, pr) => `${n}'s grinding technique produces something more liquid than solid. The casing isn't going to hold this.`,
];

const GRIND_GOOD_SHOVELER = [
  (n, pr) => `${n} shovels chunks of mystery meat into the hopper with steady precision. Not too fast, not too slow.`,
  (n, pr) => `${n} keeps the hopper perfectly loaded. The grinder never starves, never jams. Expert feeding.`,
  (n, pr) => `${n} works the shovel like a metronome. Scoop, load, scoop, load. The rhythm is perfect.`,
  (n, pr) => `${n} sorts the best cuts before shoveling them in. ${pr.posAdj} tribe's sausage will be higher quality for it.`,
  (n, pr) => `${n} finds a groove with the shovel. Every load is exactly the right size for the grinder to process.`,
  (n, pr) => `"${n} was MADE for this!" someone shouts as ${pr.sub} keeps the hopper full without missing a beat.`,
];

const GRIND_BAD_SHOVELER = [
  (n, pr) => `${n} overfills the hopper. Meat tumbles over the sides. The grinder person gives ${pr.obj} a look.`,
  (n, pr) => `${n} is too slow with the shovel. The grinder sits empty for long stretches. The team loses precious time.`,
  (n, pr) => `${n} drops the shovel. Twice. The mystery meat pile isn't getting any smaller.`,
  (n, pr) => `${n} gags at the smell and has to step back from the shoveling station. "I can't — I just can't."`,
  (n, pr) => `${n} accidentally shovels in a chunk of something that is definitely not meat. Nobody mentions it.`,
  (n, pr) => `${n}'s shoveling sends meat flying in every direction except the hopper. More ends up on the ground than in the grinder.`,
];

const GRIND_GOOD_PACKER = [
  (n, pr) => `${n} packs the sausage with surgeon-like precision. Dense, uniform, no air pockets. Competition grade.`,
  (n, pr) => `${n} works the sausage casing with expert hands. Every section is perfectly shaped and firm.`,
  (n, pr) => `"${n}, have you done this before?" ${pr.posAdj} packing technique is suspiciously professional.`,
  (n, pr) => `${n} eliminates every air bubble and wrinkle. This sausage will hold together at any speed.`,
  (n, pr) => `${n} ties off each section with a practiced knot. The sausage looks ready for display.`,
  (n, pr) => `${n} packs with ${pr.posAdj} eyes closed — working entirely by feel. The results are flawless.`,
];

const GRIND_BAD_PACKER = [
  (n, pr) => `${n} packs unevenly. One end is rock hard, the other is mush. This sausage will wobble.`,
  (n, pr) => `Air pockets. ${n}'s packing has left the sausage looking like a balloon animal. Not ideal for a bobsled.`,
  (n, pr) => `${n} squeezes too hard and the casing splits. Mystery meat oozes out. ${pr.Sub} patches it and hopes nobody notices.`,
  (n, pr) => `"That's not packed, that's stuffed." ${n}'s section of sausage is lumpy and unstable.`,
  (n, pr) => `${n} ties the casing knots too loose. When the sausage shifts, meat leaks out the seams.`,
  (n, pr) => `${n}'s packing produces a sausage that looks like it's already been sat on. Twice.`,
];

const GRIND_GOOD_CASING = [
  (n, pr) => `${n} holds the casing steady as a rock. The sausage fills evenly thanks to ${pr.posAdj} grip.`,
  (n, pr) => `${n} manages the casing with careful tension. Not too tight, not too loose. The meat flows smoothly.`,
  (n, pr) => `${n} feeds the casing out at exactly the right pace. The sausage is uniform from end to end.`,
  (n, pr) => `${n}'s casing work is invisible — which means it's perfect. The sausage holds its shape.`,
  (n, pr) => `${n} adjusts the casing angle mid-fill without missing a beat. Subtle expertise.`,
  (n, pr) => `"Steady hands on the casing!" ${host()} notes. ${n} hasn't flinched once.`,
];

const GRIND_BAD_CASING = [
  (n, pr) => `${n} lets the casing twist. The sausage comes out corkscrewed. Not great for aerodynamics.`,
  (n, pr) => `${n}'s grip slips and the casing balloons out on one side. The sausage looks pregnant.`,
  (n, pr) => `${n} pinches the casing too hard and the sausage gets a bottleneck. Meat backs up behind it.`,
  (n, pr) => `${n} drops the casing end. Mystery meat splatters on the ground. ${pr.Sub} picks it up and hopes the judges didn't see.`,
  (n, pr) => `The casing keeps slipping through ${n}'s hands. ${pr.Sub} can't maintain tension. The sausage is all over the place.`,
  (n, pr) => `${n}'s casing management results in a sausage that looks like a deflated balloon. Not confidence-inspiring.`,
];

const GRIND_SLACKER_CALLOUT = [
  (caller, slacker) => `"Hey ${slacker}, you gonna help or just stand there?" ${caller} doesn't hide the frustration.`,
  (caller, slacker) => `${caller} glares at ${slacker}. "We're losing because of YOU." The accusation hangs in the air.`,
  (caller, slacker) => `"${slacker}! FOCUS!" ${caller} slams the table. The whole team flinches.`,
  (caller, slacker) => `${caller} corners ${slacker} by the grinder. "Everyone's pulling their weight except you. Fix it."`,
  (caller, slacker) => `"What exactly are you contributing here, ${slacker}?" ${caller}'s tone is ice cold.`,
  (caller, slacker) => `${caller} doesn't say anything. Just stares at ${slacker}. The silence is worse than any words.`,
];

const GRIND_TEAM_BONDING = [
  (a, b, tribe) => `${a} and ${b} fall into a groove together. Scoop, grind, pack. They make it look easy.`,
  (a, b, tribe) => `"We've got this!" ${a} high-fives ${b} with a meat-covered glove. Gross, but the spirit is there.`,
  (a, b, tribe) => `${a} and ${b} share a look of mutual suffering over the mystery meat. It brings them closer.`,
  (a, b, tribe) => `"If we can survive THIS smell together, we can survive anything." ${a} nudges ${b}. ${b} laughs.`,
  (a, b, tribe) => `${a} picks up ${b}'s slack without being asked. ${b} notices. No words needed.`,
  (a, b, tribe) => `Working side by side, ${a} and ${b} develop an unspoken rhythm. The meat moves faster.`,
];

const GRIND_MOLE_SABOTAGE = [
  (n, pr) => `${n} "accidentally" knocks over the seasoning jar. The sausage quality takes an invisible hit.`,
  (n, pr) => `${n} subtly underpacks a section of sausage. It'll fall apart at high speed. Nobody notices.`,
  (n, pr) => `While nobody's looking, ${n} loosens a casing knot. The sabotage is surgical.`,
  (n, pr) => `${n} introduces an air pocket the size of a fist into the sausage. ${pr.Sub} covers it with a smile.`,
  (n, pr) => `${n} feeds the wrong cut into the grinder — gristle and bone. The texture will suffer.`,
  (n, pr) => `${n} spills water on the meat before shoveling. The added moisture will make the sausage unstable at speed.`,
];

// ── SAUSAGE RESULT REACTIONS ──
const SAUSAGE_RESULT_EXCELLENT = [
  (tn) => `${tn}'s sausage is a masterpiece — dense, aerodynamic, perfectly packed. The team high-fives. This thing could win a county fair.`,
  (tn) => `${host()} inspects ${tn}'s sausage and whistles. "Now THAT is a competition-grade meat tube." The team beams.`,
  (tn) => `Rock solid. Perfectly symmetrical. ${tn}'s sausage gleams under the alpine sun. Their ride down will be smooth.`,
  (tn) => `"That sausage is a WEAPON," ${host()} declares. ${tn} exchanges smug looks. They know they nailed it.`,
  (tn) => `${tn} presents their sausage like a trophy. No air pockets, no loose ends, no wobble. Pure artisan meat craft.`,
  (tn) => `The sausage practically hums with structural integrity. ${tn} pats their creation like a beloved pet. This one's a winner.`,
];
const SAUSAGE_RESULT_DECENT = [
  (tn) => `${tn}'s sausage is... serviceable. A slight bend in the middle, but it'll hold. Probably. The team shrugs — could be worse.`,
  (tn) => `"It's not pretty, but it'll ride," ${host()} says, poking ${tn}'s sausage. A small chunk falls off. Nobody acknowledges it.`,
  (tn) => `${tn} stares at their sausage with mixed feelings. It's lumpy in places, but it's packed tight where it matters.`,
  (tn) => `${tn}'s sausage passes the squeeze test but fails the eye test. "Doesn't have to be pretty to be fast," someone mumbles.`,
  (tn) => `A solid B-minus sausage. ${tn} isn't celebrating, but they're not panicking either. Mid-tier meat for a mid-tier mountain.`,
  (tn) => `${host()} holds up ${tn}'s sausage and tilts his head. "I've seen worse. I've seen much better. But I've seen worse."`,
];
const SAUSAGE_RESULT_POOR = [
  (tn) => `${tn}'s sausage droops under its own weight. One end is basically liquid. The team argues about whose fault it is.`,
  (tn) => `"Is that a sausage or a crime scene?" ${host()} asks. ${tn}'s creation oozes from three separate holes. This will not end well.`,
  (tn) => `${tn}'s sausage looks like it was packed by raccoons. Lumps, gaps, and something that might be gravel. Team morale craters.`,
  (tn) => `The sausage splits when ${host()} picks it up. ${tn} scrambles to stuff the meat back in. It's too late. Everyone saw.`,
  (tn) => `"Well... it's technically sausage-shaped," someone on ${tn} offers. Nobody agrees. The thing has a visible air bubble the size of a fist.`,
  (tn) => `${tn}'s sausage leaks mystery juice. The team stares at it in horrified silence. "We're riding THAT down a mountain?" "...Yes."`,
];

// ── DESCENT PHASE ──
const DESCENT_SEGMENT_NAMES = ['Launch', 'Hairpin Turn', 'Goat Attack', 'Avalanche', 'Tree Slalom', 'Finish'];

const DESCENT_LAUNCH_GOOD = [
  (tribe) => `${tribe} rockets off the launch ramp! The sausage-sled cuts through the air and hits the slope perfectly.`,
  (tribe) => `Clean launch for ${tribe}! The sled drops into the chute and accelerates hard. Textbook start.`,
  (tribe) => `${tribe} pushes off in unison. The sausage catches the ice and they're flying.`,
  (tribe) => `"GO GO GO!" ${tribe} explodes off the platform. The sled's runners find their line immediately.`,
  (tribe) => `${tribe} nails the launch angle. Maximum speed from the first second. This sausage was built for speed.`,
  (tribe) => `Perfect push-off from ${tribe}. The sled drops and the G-force kicks in instantly.`,
];

const DESCENT_LAUNCH_BAD = [
  (tribe) => `${tribe}'s sausage-sled wobbles off the ramp. The weight distribution is all wrong. Slow start.`,
  (tribe) => `The sausage shifts mid-launch. ${tribe}'s sled fishtails off the platform and scrapes the wall.`,
  (tribe) => `${tribe} gets a terrible launch. The sausage is too soft — the sled sags and drags on the ice.`,
  (tribe) => `Disastrous start for ${tribe}. The sled catches an edge and spins 90 degrees before correcting.`,
  (tribe) => `${tribe}'s push-off is uncoordinated. The sled lurches left, then right, then finally finds the track.`,
  (tribe) => `The sausage splits slightly on launch. ${tribe}'s sled hemorrhages speed as meat drags on the ice.`,
];

const DESCENT_HAIRPIN_GOOD = [
  (tribe, nav) => `${nav} reads the hairpin perfectly. ${tribe}'s sled banks hard and exits clean. Zero time lost.`,
  (tribe, nav) => `${tribe} hits the hairpin at full speed. ${nav} leans into it and the sled follows. Masterful driving.`,
  (tribe, nav) => `The hairpin arrives fast. ${nav} reacts faster. ${tribe}'s sled carves through without touching the wall.`,
  (tribe, nav) => `${nav}'s line through the hairpin is textbook. ${tribe} maintains speed and exits in the lead.`,
  (tribe, nav) => `Perfect entry, perfect apex, perfect exit. ${nav} navigates ${tribe}'s sled through the hairpin like a pro.`,
  (tribe, nav) => `${nav} steers into the turn early. The sled drifts wide but recovers. ${tribe} loses nothing.`,
];

const DESCENT_HAIRPIN_BAD = [
  (tribe, nav) => `${nav} enters the hairpin too hot. ${tribe}'s sled slams the outer wall. Everyone screams.`,
  (tribe, nav) => `The hairpin catches ${nav} off guard. ${tribe}'s sled goes sideways and scrapes along the barrier.`,
  (tribe, nav) => `${nav} overcorrects into the hairpin. ${tribe}'s sled spins a full 360 before stopping. Major time loss.`,
  (tribe, nav) => `${tribe}'s sled clips the inside wall on the hairpin. The impact sends them ricocheting to the outside. ${nav} fights for control.`,
  (tribe, nav) => `The sausage shifts on the turn. ${tribe}'s sled bottoms out mid-hairpin. ${nav} can't steer through the drag.`,
  (tribe, nav) => `${nav} panics into the hairpin. Too much brake, too late. ${tribe}'s sled crawls through the turn.`,
];

const DESCENT_GOAT_DODGE = [
  (tribe, nav) => `A mountain goat leaps onto the track! ${nav} swerves ${tribe}'s sled around it with inches to spare.`,
  (tribe, nav) => `Goat on the track! ${nav} veers left. The goat goes right. ${tribe} narrowly avoids a sausage-on-goat collision.`,
  (tribe, nav) => `${nav} spots the goat herd crossing the track and brakes just in time. ${tribe}'s sled threads through the gap.`,
  (tribe, nav) => `A massive billy goat charges at ${tribe}'s sled. ${nav} feints left, goes right. The goat eats ice instead.`,
  (tribe, nav) => `"GOAT!" someone screams. ${nav} drops the sled into a controlled slide. ${tribe} misses the flock entirely.`,
  (tribe, nav) => `${nav} reads the goat's trajectory and adjusts ${tribe}'s sled. Clean dodge. The goat stares after them.`,
];

const DESCENT_GOAT_HIT = [
  (tribe, nav) => `A mountain goat slams headfirst into ${tribe}'s sausage-sled. The impact is devastating. Meat everywhere.`,
  (tribe, nav) => `${nav} never sees the goat coming. It plows into ${tribe}'s sled broadside. The sausage cracks.`,
  (tribe, nav) => `The goat herd stampedes across the track. ${tribe}'s sled hits three of them. The sausage splits at the seams.`,
  (tribe, nav) => `A goat jumps ONTO ${tribe}'s sled. Then another. ${nav} can't steer with two goats on the sausage.`,
  (tribe, nav) => `Direct hit. The goat headbutts ${tribe}'s sausage-sled and sends it spinning into the snowbank.`,
  (tribe, nav) => `${tribe}'s sled catches a goat at full speed. The sausage absorbs the impact — badly. Chunks fly off.`,
];

const DESCENT_AVALANCHE_DODGE = [
  (tribe, nav) => `The mountain rumbles. Snow cascades down. ${nav} guns ${tribe}'s sled through the gap before the avalanche seals the track.`,
  (tribe, nav) => `Avalanche! ${nav} reads the snowfield and threads ${tribe}'s sled under the overhang just in time.`,
  (tribe, nav) => `The world turns white. ${nav} doesn't stop. ${tribe}'s sled punches through the edge of the slide and comes out clean.`,
  (tribe, nav) => `${nav} hears the crack above and floors it. ${tribe}'s sled outruns the avalanche by seconds.`,
  (tribe, nav) => `Snow thunders down the mountainside. ${nav} tucks ${tribe}'s sled into a rock shelter. The avalanche roars past.`,
  (tribe, nav) => `${nav} spots the fracture line and veers hard left. ${tribe}'s sled skirts the avalanche path. Snow dusts them as it passes.`,
];

const DESCENT_AVALANCHE_HIT = [
  (tribe, nav) => `The avalanche catches ${tribe}'s sled. Snow buries everything. They dig out minutes later, covered and coughing.`,
  (tribe, nav) => `${nav} tries to outrun the avalanche but the sled isn't fast enough. ${tribe} gets swept off the track entirely.`,
  (tribe, nav) => `The avalanche hits ${tribe}'s sled broadside. The sausage is buried. The team scrambles to dig it out.`,
  (tribe, nav) => `${tribe}'s sled disappears under a wall of snow. When it emerges, the sausage is cracked and half the team is disoriented.`,
  (tribe, nav) => `The snowslide slams ${tribe}'s sled into the barrier. ${nav} is buried up to the waist. Massive time penalty.`,
  (tribe, nav) => `${nav} freezes. The avalanche doesn't. ${tribe}'s sled takes the full hit and gets pushed 50 meters off course.`,
];

const DESCENT_SLALOM_GOOD = [
  (tribe, nav) => `${nav} weaves ${tribe}'s sled through the tree line with surgical precision. Not a single trunk grazed.`,
  (tribe, nav) => `Left, right, left, right. ${nav}'s reflexes are perfect. ${tribe}'s sled dances between the trees.`,
  (tribe, nav) => `${tribe} enters the tree slalom and ${nav} hits the zone. Every tree dodged. Every turn nailed.`,
  (tribe, nav) => `The trees blur past as ${nav} navigates ${tribe}'s sled at full speed. Not one scratch on the sausage.`,
  (tribe, nav) => `${nav} calls out trees as they come. "LEFT! RIGHT! LEFT!" ${tribe}'s sled responds perfectly to each correction.`,
  (tribe, nav) => `The slalom section is brutal but ${nav} makes it look gentle. ${tribe}'s sled exits the trees at full speed.`,
];

const DESCENT_SLALOM_BAD = [
  (tribe, nav) => `${tribe}'s sled clips a pine tree and spins. Bark, snow, and sausage fragments scatter across the slope.`,
  (tribe, nav) => `${nav} misjudges the spacing. ${tribe}'s sled catches a tree dead center and the sausage wraps around it.`,
  (tribe, nav) => `The tree slalom chews up ${tribe}'s sled. Three direct hits. The sausage is barely holding together.`,
  (tribe, nav) => `${nav} overcorrects between two trees. ${tribe}'s sled wedges between them. Everyone has to push it free.`,
  (tribe, nav) => `${tribe} enters the slalom too fast. ${nav} can't keep up. The sled pinballs off tree trunks like a billiard ball.`,
  (tribe, nav) => `A low branch catches ${tribe}'s sled and rips the top layer of sausage clean off. ${nav} watches it fly.`,
];

const DESCENT_FINISH_CLOSE = [
  (tribe) => `${tribe} crosses the finish line! The sausage is battered but intact. They made it!`,
  (tribe) => `"${tribe} is IN!" ${host()} screams. The sled slides across the finish line and slams into the hay bales.`,
  (tribe) => `${tribe}'s sled grinds across the finish line. Steam rises from the overheated sausage. Done.`,
  (tribe) => `The finish banner whips past as ${tribe}'s sled rockets through. Everyone collapses in relief.`,
  (tribe) => `${tribe} crosses with a final burst of speed. The sausage is smoking. The team is screaming. They're finished.`,
  (tribe) => `"THAT'S ${tribe}!" ${host()} marks the time. The sled comes to a messy, meaty stop past the finish line.`,
];

const DESCENT_CRASH_BONDING = [
  (a, b) => `${a} and ${b} get thrown together when the sled hits a bump. They land tangled up and laughing.`,
  (a, b) => `The crash sends ${a} into ${b}. "Sorry!" "Don't be." They help each other up. Something shifts between them.`,
  (a, b) => `${a} shields ${b} from a chunk of flying sausage. "Thanks." "Anytime." The bond solidifies.`,
  (a, b) => `When the sled tips, ${a} grabs ${b}'s arm instinctively. They hold on until the sled rights itself.`,
  (a, b) => `${a} and ${b} both dive to stabilize the sled at the same time. Their hands overlap. Neither moves away.`,
  (a, b) => `The chaos of the descent forces ${a} and ${b} to rely on each other. By the bottom, they're a unit.`,
];

const DESCENT_TRASH_TALK = [
  (a, tA, b, tB) => `${a} screams at ${tB}'s sled as ${tA} passes: "ENJOY THE VIEW FROM BEHIND!"`,
  (a, tA, b, tB) => `"Better luck next time, ${b}!" ${a} waves from ${tA}'s sled. ${b} seethes.`,
  (a, tA, b, tB) => `${a} locks eyes with ${b} as the sleds run parallel. ${a} just smirks. ${b} wants blood.`,
  (a, tA, b, tB) => `"Your sausage looks TERRIBLE!" ${a} shouts from ${tA}'s sled. ${b} on ${tB} takes it personally.`,
  (a, tA, b, tB) => `${a} gives ${b} a mock salute as ${tA} surges ahead. The rivalry is now permanent.`,
  (a, tA, b, tB) => `"${b}! Try keeping UP!" ${a}'s taunt echoes down the mountain. ${b} clenches ${pronouns(b).posAdj} jaw.`,
];

const DESCENT_SHOWMANCE_SPARK = [
  (a, b) => `In the chaos of the descent, ${a} catches ${b}'s eye. Something sparks despite the freezing wind.`,
  (a, b) => `${a} and ${b} end up pressed together on the crowded sled. The cold disappears for a moment.`,
  (a, b) => `"Hold onto me!" ${a} shouts to ${b} as the sled bucks. ${b} does. Neither wants to let go after.`,
  (a, b) => `The near-miss with the avalanche makes ${a} and ${b} realize life is short. They look at each other differently now.`,
  (a, b) => `${a} wraps a blanket around ${b} at the bottom. The gesture is small. The feeling isn't.`,
  (a, b) => `Adrenaline makes people do things. Like ${a} kissing ${b}'s cheek when the sled crosses the finish line.`,
];

// ── HAT CEREMONY ──
const HAT_PICKELHAUBE = [
  (tribe) => `${tribe} gets the Pickelhaube! Chrome spike. Leather strap. +2 HP in every fight. The war helmets of champions.`,
  (tribe) => `${host()} presents ${tribe} with gleaming Pickelhauben. "You earned the SPIKE. Use it wisely."`,
  (tribe) => `${tribe} dons the Pickelhaube. They look ridiculous. They look powerful. +2 HP advantage in the arena.`,
  (tribe) => `"First place gets the Pickelhaube — the hat of DOMINANCE." ${host()} places the spiked helmets on ${tribe}. +2 HP bonus.`,
  (tribe) => `${tribe}'s reward: genuine Pickelhauben. The spike adds +2 HP in every fight. Winners' privilege.`,
  (tribe) => `Chrome spikes gleam on ${tribe}'s heads. The Pickelhaube: +2 HP per fight. First-place privilege never looked so sharp.`,
];

const HAT_USHANKA = [
  (tribe) => `${tribe} receives Ushankas. Fur-lined, ear-flapped, warm. +1 HP in the arena. Not bad for second.`,
  (tribe) => `"Second place: Ushankas!" ${host()} hands ${tribe} the furry hats. "Warm, practical. +1 HP."`,
  (tribe) => `${tribe} gets the Ushanka. They look cozy. +1 HP per fight. Middle-of-the-road and proud of it.`,
  (tribe) => `Ushankas for ${tribe}. The ear flaps provide warmth AND a +1 HP combat bonus. Silver medal headwear.`,
  (tribe) => `${tribe} ties on their Ushankas. Fur-lined confidence. +1 HP advantage. Not the best hat, but not the worst.`,
  (tribe) => `"These are genuine Ushankas. +1 HP in combat." ${host()} nods at ${tribe}. "You could've done worse."`,
];

const HAT_TYROLEAN = [
  (tribe) => `${tribe} gets... Tyrolean Hats. The tiny feathered caps provide zero HP bonus. Also, they come with lederhosen.`,
  (tribe) => `"Last place gets the Tyrolean!" ${host()} grins. "No HP bonus. But you DO get complimentary lederhosen."`,
  (tribe) => `${tribe} stares at the tiny green hats with little feathers. +0 HP. Plus they have to wear lederhosen. In the arena.`,
  (tribe) => `Tyrolean Hats and lederhosen for ${tribe}. The hat gives no advantage. The lederhosen give no dignity.`,
  (tribe) => `"Congratulations on last place!" ${host()} tosses Tyrolean Hats at ${tribe}. "These come with mandatory lederhosen."`,
  (tribe) => `${tribe} gets the worst hat: the Tyrolean. A jaunty feather, zero combat bonus, and lederhosen that chafe.`,
];

const LEDERHOSEN_HUMILIATION = [
  (n, pr, tribe) => `${n} puts on the lederhosen. ${pr.Sub} looks down. ${pr.Sub} looks up. "${pr.Sub} quit." But ${pr.sub} can't.`,
  (n, pr, tribe) => `"Why ME?" ${n} holds up the lederhosen like they're radioactive. ${pr.Sub} puts them on anyway. The team can't stop laughing.`,
  (n, pr, tribe) => `${n} gets the tightest pair of lederhosen. They creak when ${pr.sub} walks. Everyone on ${tribe} pretends not to notice.`,
  (n, pr, tribe) => `${n} models the lederhosen for the cameras. ${pr.Sub}'s forced smile doesn't reach ${pr.posAdj} eyes.`,
  (n, pr, tribe) => `The lederhosen are two sizes too small for ${n}. ${pr.Sub} can barely move. Fighting in these will be... memorable.`,
  (n, pr, tribe) => `${n} pulls on the lederhosen and immediately regrets every life choice that led to this moment.`,
  (n, pr, tribe) => `"${n} in lederhosen!" ${host()} howls. "THAT is good television." ${n} just stares into the void.`,
  (n, pr, tribe) => `${n} squeezes into the lederhosen. The suspenders snap. The camera zooms in. ${pr.posAdj} dignity is gone.`,
];

// ── CAPTAIN ELECTION ──
const CAPTAIN_ELECTED = [
  (captain, tribe, pr) => `${tribe} chooses ${captain} as captain. ${pr.Sub} steps forward. "I won't let you down."`,
  (captain, tribe, pr) => `"${captain} is our captain!" ${tribe} rallies behind ${pr.obj}. Time to pick the fighters.`,
  (captain, tribe, pr) => `${captain} gets the vote. ${pr.Sub} cracks ${pr.posAdj} knuckles. "Let's build a lineup."`,
  (captain, tribe, pr) => `By unanimous(ish) decision: ${captain} leads ${tribe} into the tournament. Pressure's on.`,
  (captain, tribe, pr) => `${tribe} taps ${captain} for captain. ${pr.Sub} accepts with a nod. ${pr.Sub}'s already calculating matchups.`,
  (captain, tribe, pr) => `"${captain}, you're up." ${tribe} puts the strategy in ${pr.posAdj} hands. ${pr.Sub} won't waste it.`,
  (captain, tribe, pr) => `${captain} is elected ${tribe} captain. The weight of every matchup decision now rests on ${pr.posAdj} shoulders.`,
  (captain, tribe, pr) => `${tribe} picks ${captain}. ${pr.Sub} surveys the opposition. The draft begins in ${pr.posAdj} head immediately.`,
];

// ── SIT-OUT REACTIONS ──
const SITOUT_RELUCTANT = [
  (player, captain, pr) => `${player}'s face falls. "You're benching me?" ${captain} doesn't meet ${pr.posAdj} eyes. "We need you fresh."`,
  (player, captain, pr) => `"I can fight!" ${player} insists. ${captain} shakes ${pronouns(captain).posAdj} head. "Not today."`,
  (player, captain, pr) => `${player} opens ${pr.posAdj} mouth to argue, then closes it. The captain has spoken.`,
  (player, captain, pr) => `${player} sits down hard. "Fine. Whatever." ${pr.Sub} pulls ${pr.posAdj} hat low over ${pr.posAdj} eyes.`,
  (player, captain, pr) => `"You'd rather have THEM fight instead of ME?" ${player} points at the lineup. ${captain} nods slowly.`,
  (player, captain, pr) => `${player} takes the bench with visible frustration. ${pr.Sub}'ll remember this.`,
];

const SITOUT_RELIEVED = [
  (player, captain, pr) => `${player} exhales. "Oh thank god." Getting slapped on electrified platforms wasn't high on ${pr.posAdj} list.`,
  (player, captain, pr) => `"You want me to sit out? Yeah. Okay. Definitely." ${player} practically runs to the bench.`,
  (player, captain, pr) => `${player} can't hide the relief. The electroshock arena is terrifying. The bench is safe.`,
  (player, captain, pr) => `"Take one for the team by NOT getting electrocuted? Gladly." ${player} finds a seat immediately.`,
  (player, captain, pr) => `${player}'s whole body relaxes when ${captain} says ${pr.posAdj} name. "I'll cheer REALLY loud."`,
  (player, captain, pr) => `${player} sees the sparking DDR platforms and silently thanks ${captain} for the bench spot.`,
];

// ── DRAFT PICK REACTIONS ──
const DRAFT_PICK_CONFIDENT = [
  (captain, fighter, opponent) => `${captain} picks ${fighter} to face ${opponent}. "${fighter} has this." Pure confidence.`,
  (captain, fighter, opponent) => `"${fighter} vs ${opponent}." ${captain} doesn't hesitate. "That's our best matchup."`,
  (captain, fighter, opponent) => `${captain} points at ${fighter}. "You're fighting ${opponent}." ${fighter} grins. "Perfect."`,
  (captain, fighter, opponent) => `"${fighter}. You've got ${opponent}." ${captain}'s voice is steel. ${fighter} steps up.`,
  (captain, fighter, opponent) => `${captain} studies the board and picks ${fighter} against ${opponent}. "Guaranteed point."`,
  (captain, fighter, opponent) => `"${fighter} vs ${opponent} — that's free money." ${captain} makes the call.`,
];

const DRAFT_PICK_RISKY = [
  (captain, fighter, opponent) => `${captain} picks ${fighter} against ${opponent}. Risky. ${fighter} looks nervous.`,
  (captain, fighter, opponent) => `"${fighter}... vs ${opponent}." ${captain} hesitates. "I believe in you." The tone says otherwise.`,
  (captain, fighter, opponent) => `${captain} assigns ${fighter} to ${opponent}. The tribe exchanges worried looks.`,
  (captain, fighter, opponent) => `"Look, someone has to fight ${opponent}. ${fighter}, you're up." ${captain} doesn't sugarcoat it.`,
  (captain, fighter, opponent) => `${captain} puts ${fighter} against ${opponent}. It's a mismatch on paper. Maybe that's the point.`,
  (captain, fighter, opponent) => `"${fighter} vs ${opponent}." ${captain} shrugs. "Upsets happen." The tribe isn't convinced.`,
];

const DRAFT_PICK_RIVALRY = [
  (captain, p1, p2) => `${captain} doesn't even have to pick this one. ${p1} vs ${p2} — the rivalry auto-locks. Everyone saw this coming.`,
  (captain, p1, p2) => `"${p1} and ${p2}?" ${captain} laughs. "They've been waiting to hit each other since day one."`,
  (captain, p1, p2) => `The rivalry matchup is set: ${p1} vs ${p2}. Neither needed to be asked. They volunteered with their eyes.`,
  (captain, p1, p2) => `${p1} and ${p2} lock eyes across the arena. ${captain} just confirms what everyone already knew.`,
  (captain, p1, p2) => `"This isn't strategy. This is personal." ${captain} lets ${p1} and ${p2} have their grudge match.`,
  (captain, p1, p2) => `${p1} vs ${p2}. The hatred is palpable. ${captain} made this matchup because no one else would survive it.`,
];

// ── FIGHT MOVES ──
const MOVE_POWER_SLAP = [
  (atk, def, pr) => `${atk} winds up and CRACKS ${def} across the face with a full-arm power slap. The sound echoes.`,
  (atk, def, pr) => `${atk} loads up the biggest slap ${pr.sub} can muster. ${def}'s head snaps sideways. Devastating.`,
  (atk, def, pr) => `Full windup. Full follow-through. ${atk}'s power slap connects flush on ${def}'s cheek. The crowd gasps.`,
  (atk, def, pr) => `${atk} plants ${pr.posAdj} feet and delivers a thunderous power slap. ${def} staggers back three steps.`,
  (atk, def, pr) => `The power slap from ${atk} lands with the force of a falling tree. ${def}'s vision blurs.`,
  (atk, def, pr) => `${atk} channels everything into one slap. The contact is LOUD. ${def} wobbles. The platform shakes.`,
];

const MOVE_JAB_SLAP = [
  (atk, def, pr) => `${atk} snaps a quick jab-slap at ${def}. Fast, precise, stinging. No windup needed.`,
  (atk, def, pr) => `A rapid jab-slap from ${atk} catches ${def} on the ear. Quick and dirty.`,
  (atk, def, pr) => `${atk} flicks ${pr.posAdj} wrist. The jab-slap pops ${def} on the chin. "That's just a taste."`,
  (atk, def, pr) => `${atk} darts in with a jab-slap and darts back out. ${def} barely felt it. But the damage adds up.`,
  (atk, def, pr) => `Quick slap, quick retreat. ${atk} tags ${def} with a jab and resets. Classic volume fighting.`,
  (atk, def, pr) => `${atk} peppers ${def} with a stinging jab-slap. It's not flashy, but it works.`,
];

const MOVE_SPIN_SLAP = [
  (atk, def, pr) => `${atk} spins a full 360 and WHIPS a backhanded slap across ${def}'s face. Theatrical AND effective.`,
  (atk, def, pr) => `The spin slap! ${atk} pirouettes on the platform and catches ${def} with the follow-through. Brutal elegance.`,
  (atk, def, pr) => `${atk} channels ${pr.posAdj} inner dancer: spin, step, SLAP. ${def} didn't see it coming.`,
  (atk, def, pr) => `${atk} goes for the signature spin slap. The momentum adds force. ${def} eats every bit of it.`,
  (atk, def, pr) => `A spinning backhand from ${atk} catches ${def} flush. The DDR platform lights up with the impact.`,
  (atk, def, pr) => `${atk} does a full revolution and slaps ${def} so hard the cameras shake. The crowd goes wild.`,
];

const MOVE_OVERHEAD_SLAP = [
  (atk, def, pr) => `${atk} raises ${pr.posAdj} arm high and brings it down in a devastating overhead slap. ${def}'s knees buckle.`,
  (atk, def, pr) => `The overhead slap from ${atk} comes down like a hammer. ${def} drops to one knee.`,
  (atk, def, pr) => `${atk} goes over the top — literally. The overhead slap connects on ${def}'s crown with a sickening clap.`,
  (atk, def, pr) => `${atk} reaches for the sky and brings the palm down hard. The overhead connects. ${def} sees stars.`,
  (atk, def, pr) => `Gravity plus muscle plus anger: ${atk}'s overhead slap drives ${def} downward. Punishing.`,
  (atk, def, pr) => `${atk} loads the overhead, times the dance step, and CRASHES down on ${def}. The platform cracks beneath them.`,
];

const MOVE_DANCE_KICK = [
  (atk, def, pr) => `${atk} integrates a dance kick into ${pr.posAdj} routine and catches ${def} in the ribs. Style AND substance.`,
  (atk, def, pr) => `A dance-step kick from ${atk}! ${pr.Sub} follows the DDR arrows and adds a sweeping kick. ${def} folds.`,
  (atk, def, pr) => `${atk} hits the dance beat perfectly and extends into a kick that catches ${def} off-guard. Flashy but effective.`,
  (atk, def, pr) => `The arrows change and ${atk} adapts mid-move. Dance step into roundhouse kick. ${def} takes it square.`,
  (atk, def, pr) => `${atk} makes it look like a dance — until the kick lands. ${def} realizes too late it wasn't choreography.`,
  (atk, def, pr) => `${atk} leaps into a flying kick disguised as a dance move. ${def} blocks too late. Impact.`,
];

const MOVE_SWEEP = [
  (atk, def, pr) => `${atk} drops low and sweeps ${def}'s legs out from under ${pr.obj}. ${def} crashes hard on the platform.`,
  (atk, def, pr) => `Leg sweep from ${atk}! ${def} goes airborne for a half second before the platform catches ${pr.obj}.`,
  (atk, def, pr) => `${atk} reads the dance pattern and times a sweep perfectly. ${def} hits the ground and the arrows keep scrolling.`,
  (atk, def, pr) => `${atk} slides under ${def}'s guard and sweeps. ${def} lands on ${pronouns(def).posAdj} back. The shock panel sparks.`,
  (atk, def, pr) => `A low sweep catches ${def} completely by surprise. ${atk} pops back up. ${def} doesn't. Not immediately.`,
  (atk, def, pr) => `${atk} goes for the legs. The sweep connects. ${def} crashes down. The DDR platform punishes the fall.`,
];

const MOVE_RALLY_SLAP = [
  (atk, def, pr) => `${atk} is running on fumes — but pulls a rally slap from nowhere! The comeback energy is REAL.`,
  (atk, def, pr) => `Down but not out! ${atk} surges forward with a desperate rally slap. ${def} wasn't expecting the push.`,
  (atk, def, pr) => `${atk} is hurt, exhausted, electrocuted — and STILL lands a rally slap. The crowd roars.`,
  (atk, def, pr) => `Something shifts in ${atk}'s eyes. ${pr.Sub} draws from the bottom of the tank. The rally slap CONNECTS.`,
  (atk, def, pr) => `${atk} uses the last of ${pr.posAdj} energy for one massive rally slap. It lands. ${def} recoils.`,
  (atk, def, pr) => `"NOT YET!" ${atk} screams and throws a rally slap with everything left. The DDR arrows blur beneath ${pr.posAdj} feet.`,
];

const MOVE_COUNTER_SLAP = [
  (atk, def, pr) => `${def} swings first — but ${atk} reads it and COUNTERS with a slap that sends ${def} spinning.`,
  (atk, def, pr) => `${atk} baits ${def} into overextending, then punishes with a precise counter-slap. Textbook.`,
  (atk, def, pr) => `${atk} slips ${def}'s attack and fires back with a counter that connects clean. Defense into offense.`,
  (atk, def, pr) => `The counter-slap! ${atk} absorbs the hit and redirects all the energy back into ${def}'s face.`,
  (atk, def, pr) => `${atk} waits. ${def} commits. ${atk} counters. The slap catches ${def} with twice the force.`,
  (atk, def, pr) => `${atk} times the counter perfectly. ${def}'s momentum works against ${pronouns(def).obj}. SLAP. Devastating reversal.`,
];

const MOVE_HAYMAKER = [
  (atk, def, pr) => `${atk} throws a HAYMAKER slap — full body, no technique, pure fury. ${def} gets BLASTED off the platform.`,
  (atk, def, pr) => `THE HAYMAKER! ${atk} loads up from the hip and delivers a slap so hard ${def} leaves the ground.`,
  (atk, def, pr) => `All-in. ${atk} throws the biggest, wildest haymaker slap humanly possible. ${def} catches it all.`,
  (atk, def, pr) => `${atk} abandons all form and throws a haymaker. It connects with a sound like a cannon. ${def} goes DOWN.`,
  (atk, def, pr) => `${atk} rears back and unleashes a haymaker slap. The arena goes silent. Then ${def} hits the floor.`,
  (atk, def, pr) => `No finesse. No technique. Just ${atk}'s open palm meeting ${def}'s face at maximum velocity. HAYMAKER.`,
];

const MOVE_POOLS = {
  'power-slap': MOVE_POWER_SLAP,
  'jab-slap': MOVE_JAB_SLAP,
  'spin-slap': MOVE_SPIN_SLAP,
  'overhead-slap': MOVE_OVERHEAD_SLAP,
  'dance-kick': MOVE_DANCE_KICK,
  'sweep': MOVE_SWEEP,
  'rally-slap': MOVE_RALLY_SLAP,
  'counter-slap': MOVE_COUNTER_SLAP,
  'haymaker': MOVE_HAYMAKER,
};

const MOVE_TYPES = ['power-slap', 'jab-slap', 'spin-slap', 'overhead-slap', 'dance-kick', 'sweep'];
const DESPERATION_MOVES = ['rally-slap', 'counter-slap', 'haymaker'];

// ── ELECTROSHOCK ──
const ELECTROSHOCK = [
  (n, pr) => `The platform LIGHTS UP beneath ${n}! ${pr.Sub} convulses as electricity courses through ${pr.posAdj} body. "BZZZT!"`,
  (n, pr) => `SHOCK! ${n} steps on the wrong panel and gets hit with 10,000 volts of pure game show justice.`,
  (n, pr) => `The DDR arrows flash red. ${n} didn't hit the right one. The platform rewards ${pr.obj} with a massive shock.`,
  (n, pr) => `${n}'s feet miss the beat. The platform doesn't miss ${pr.obj}. Sparks fly. ${n} screams.`,
  (n, pr) => `ZAP! ${n} lights up like a neon sign. The electroshock drops ${pr.obj} to ${pr.posAdj} knees.`,
  (n, pr) => `"That's a SHOCK!" ${host()} winces. ${n} twitches on the platform. The DDR system shows no mercy.`,
  (n, pr) => `The floor turns electric blue under ${n}. ${pr.Sub} seizes up. When it stops, ${pr.sub}'s visibly slower.`,
  (n, pr) => `BZZZZZT! ${n} takes a full shock cycle. ${pr.posAdj} hair stands on end. ${pr.posAdj} dance meter plummets.`,
];

const RANDOM_SHOCK = [
  (n, pr) => `${host()} hits a button. ${n}'s panel shocks for no reason. "Oops. My finger slipped." It didn't.`,
  (n, pr) => `"Let's spice things up!" ${host()} zaps ${n}'s panel mid-fight. ${n} drops to a knee. "That's CHEATING!" "That's ENTERTAINMENT."`,
  (n, pr) => `The platform glitches — or does it? ${n} gets a random shock. ${host()} whistles innocently.`,
  (n, pr) => `${host()} casually presses the shock button. ${n} convulses. "I wanted to see what would happen."`,
  (n, pr) => `A "malfunction" zaps ${n} during a key moment. ${host()} examines ${pr.posAdj} nails. "Tragic."`,
  (n, pr) => `"Random shock!" ${host()} announces cheerfully. ${n} gets blasted. ${pr.Sub} had it coming. Maybe.`,
];

// ── BLOCK ──
const BLOCK_SUCCESS = [
  (def, atk, dPr) => `${def} reads the slap and blocks it cold! ${dPr.posAdj} forearm absorbs the impact. Damage minimized.`,
  (def, atk, dPr) => `${def} gets ${dPr.posAdj} guard up just in time. ${atk}'s slap glances off ${dPr.posAdj} arm.`,
  (def, atk, dPr) => `${def} ducks the slap and deflects the follow-through. ${atk} hit mostly air.`,
  (def, atk, dPr) => `${def} sees it coming and catches ${atk}'s hand mid-swing. Partial block. The sting is halved.`,
  (def, atk, dPr) => `${def} rolls with the slap. The impact is there but the damage is minimal. Smart defense.`,
  (def, atk, dPr) => `${def} turns ${dPr.posAdj} shoulder into the slap. ${atk}'s palm hits bone instead of cheek. Defense holds.`,
];

// ── KO ──
const KO_TEXT = [
  (winner, loser, wPr) => `${loser} can't take any more. ${winner} stands over ${pronouns(loser).obj}. KNOCKOUT! ${wPr.Sub} advances.`,
  (winner, loser, wPr) => `${loser} drops. The platform stops shocking. ${winner} raises ${wPr.posAdj} hand. The fight is OVER.`,
  (winner, loser, wPr) => `${loser}'s knees give out. ${winner} watches ${pronouns(loser).obj} fall. No celebration. Just relief.`,
  (winner, loser, wPr) => `"AND ${loser} IS DOWN!" ${host()} screams. ${winner} wins! The DDR platform plays a victory jingle.`,
  (winner, loser, wPr) => `${loser} collapses on the electrified platform. ${winner} steps back. It's over. ${wPr.Sub} won.`,
  (winner, loser, wPr) => `The final slap sends ${loser} to the mat. ${winner} pumps ${wPr.posAdj} fist. FIGHT OVER.`,
  (winner, loser, wPr) => `${loser} taps out. ${winner} can barely stand either, but ${wPr.sub}'s the one still upright. Victory.`,
  (winner, loser, wPr) => `KO! ${loser} goes down hard. ${winner} leans on ${wPr.posAdj} knees, gasping, but ${wPr.sub} won. That's all that matters.`,
];

// ── SOCIAL EVENTS (between fights) ──
const SOCIAL_COACHING = [
  (coach, fighter, tribe) => `"Watch ${pronouns(fighter).posAdj} left hand! That's where the power comes from!" ${coach} yells advice from the ${tribe} bench.`,
  (coach, fighter, tribe) => `${coach} grabs ${fighter} between fights. "Keep your dance meter up. Stay light. You've got this."`,
  (coach, fighter, tribe) => `"${fighter}! Remember what I told you!" ${coach} mimes a blocking stance from the sideline.`,
  (coach, fighter, tribe) => `${coach} wraps ${fighter}'s hands between rounds. "One more fight. Give it everything."`,
  (coach, fighter, tribe) => `${coach} pulls ${fighter} aside. "They're telegraphing the spin slap. Watch the shoulder."`,
  (coach, fighter, tribe) => `"FINISH IT!" ${coach} screams from ${tribe}'s corner. ${fighter} nods. Eyes refocus.`,
];

const SOCIAL_PREFIGHT_TENSION = [
  (p1, p2) => `${p1} and ${p2} stare each other down as they step onto their platforms. The DDR arrows haven't started and it's already intense.`,
  (p1, p2) => `"You're going down." ${p1} locks eyes with ${p2}. ${p2} doesn't blink. The tension could cut steel.`,
  (p1, p2) => `The platform powers up. ${p1} and ${p2} take their positions. Neither speaks. Both are shaking.`,
  (p1, p2) => `${p1} stretches. ${p2} watches. "Trying to intimidate me?" ${p2} asks. ${p1} doesn't answer. That IS the answer.`,
  (p1, p2) => `${p1} cracks ${pronouns(p1).posAdj} neck. ${p2} cracks ${pronouns(p2).posAdj} knuckles. The arena holds its breath.`,
  (p1, p2) => `The DDR screens boot up. ${p1} and ${p2} stand three feet apart on the electrified platform. "Ready?" Neither answers.`,
];

const SOCIAL_CELEBRATION = [
  (winner, tribe) => `${tribe} ERUPTS! ${winner} is swarmed by teammates. Hugs, screams, pure joy.`,
  (winner, tribe) => `${winner} stumbles off the platform into a wall of ${tribe} teammates. The celebration is deafening.`,
  (winner, tribe) => `"YES! YES! YES!" ${tribe} chants ${winner}'s name. The arena shakes with their energy.`,
  (winner, tribe) => `${winner} raises both arms. ${tribe} responds with a roar that drowns out the DDR music.`,
  (winner, tribe) => `${winner} drops to ${pronouns(winner).posAdj} knees and screams. ${tribe} piles on. They needed this win.`,
  (winner, tribe) => `${tribe} lifts ${winner} onto their shoulders. The victory lap is sloppy and beautiful.`,
];

const SOCIAL_PANIC = [
  (loser, tribe) => `${tribe} watches in horror as ${loser} goes down. The mood shifts from tense to desperate.`,
  (loser, tribe) => `"No no no..." ${tribe} watches ${loser} fall. They're running out of fighters.`,
  (loser, tribe) => `${loser}'s loss sends a wave of panic through ${tribe}. Eyes widen. Jaws clench. This is getting real.`,
  (loser, tribe) => `${tribe} goes quiet after ${loser}'s defeat. The math isn't good. They can feel tribal council approaching.`,
  (loser, tribe) => `${loser} limps back to the bench. ${tribe} tries to stay positive but the fear is written on every face.`,
  (loser, tribe) => `"We're fine. We're FINE." Someone on ${tribe} says it. Nobody on ${tribe} believes it.`,
];

const SOCIAL_RESPECT = [
  (p1, p2) => `${p1} extends a hand to ${p2} after the fight. ${p2} takes it. Mutual respect, hard-earned.`,
  (p1, p2) => `"Good fight." ${p1} nods at ${p2}. No sarcasm. No games. Just two people who just beat the hell out of each other.`,
  (p1, p2) => `After the KO, ${p1} helps ${p2} off the platform. "You almost had me." "I know."`,
  (p1, p2) => `${p1} and ${p2} shake hands. The fight was brutal. The respect is real.`,
  (p1, p2) => `${p1} claps ${p2} on the shoulder after the fight. "Next time, I won't hold back." "You didn't." They both laugh.`,
  (p1, p2) => `The fight is over but ${p1} waits for ${p2} to get up before celebrating. Class act.`,
];

const SOCIAL_BLAME = [
  (blamer, loser, tribe) => `"You LOST that? Against THEM?" ${blamer} turns on ${loser}. ${tribe}'s morale takes another hit.`,
  (blamer, loser, tribe) => `${blamer} doesn't hide the frustration. "What was that, ${loser}? That was embarrassing."`,
  (blamer, loser, tribe) => `${blamer} pulls ${loser} aside. "You just cost us the challenge. You know that, right?"`,
  (blamer, loser, tribe) => `"We're going to tribal because of you." ${blamer} stares at ${loser}. The words land like slaps.`,
  (blamer, loser, tribe) => `${blamer} shakes ${pronouns(blamer).posAdj} head at ${loser}. "All you had to do was win ONE fight."`,
  (blamer, loser, tribe) => `${blamer} won't even look at ${loser}. The silence is worse than any accusation.`,
];

// ── HOST COMMENTARY ──
const HOST_FLAVOR = [
  () => `${host()} watches from behind the DJ booth. "This is what television was INVENTED for."`,
  () => `"Remember, the dance arrows aren't just for show — miss enough and the platform shocks you!" ${host()} is way too happy about this.`,
  () => `${host()} takes a bite of sausage from the grind station. "Not bad. Seven out of ten." The tribes stare in horror.`,
  () => `"The beauty of Slap Slap Revolution is that EVERYONE gets hurt. It's very egalitarian." ${host()} smiles.`,
  () => `${host()} adjusts the voltage dial. "Let's see... this goes to 11." The competitors pale.`,
  () => `"Fun fact: the DDR system was designed by an ex-military interrogation specialist." ${host()} pauses. "That's not fun at all, is it?"`,
  () => `${host()} leans into the mic. "SOMEBODY'S going home tonight. And they're going to be SORE when they get there."`,
  () => `"Sausage, bobsleds, and electroshock slapping. And people say reality TV is lowbrow." ${host()} sniffs indignantly.`,
  () => `${host()} watches a fighter get shocked. "We really should have more safety regulations. But we don't. So."`,
  () => `"If you're wondering whether this is legal — technically, they signed a 47-page waiver." ${host()} holds it up.`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════

export function simulateSlapSlapRevolution(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return ep;

  const allActive = tribes.flatMap(t => t.members);
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  const result = {
    grindPhase: { tribes: [] },
    descentPhase: { segments: [], results: [] },
    hatCeremony: { placements: [], humiliation: null },
    captainDraft: { captains: [], rivalryLocks: [], sitOuts: [], matchups: [], fighterCount: 0 },
    tournament: { rounds: [], champion: null, eliminatedTribe: null, immunityWinner: null },
  };

  // ══════════════════════════════════════════════════════════════
  // PHASE 1: THE GRIND
  // ══════════════════════════════════════════════════════════════
  tribes.forEach(tribe => {
    const members = [...tribe.members];
    const n = members.length;
    const grindData = {
      tribeName: tribe.name,
      members: [...members],
      roles: [],
      sausageQuality: 0,
      events: [],
    };

    // Assign roles: 1 grinder, 1-2 shovelers, 1-2 packers, 1 casing
    // Slight priority for physical stats on grinder, but noise keeps it fair
    const sorted = members.slice().sort((a, b) =>
      (pStats(b).physical * 0.6 + noise(3)) - (pStats(a).physical * 0.6 + noise(3))
    );

    const roles = [];
    roles.push({ name: sorted[0], role: 'grinder' });

    // Assign remaining roles
    const remaining = sorted.slice(1);
    const numShovelers = n >= 6 ? 2 : 1;
    const numPackers = n >= 5 ? 2 : 1;
    for (let i = 0; i < remaining.length; i++) {
      if (i < numShovelers) {
        roles.push({ name: remaining[i], role: 'shoveler' });
      } else if (i < numShovelers + numPackers) {
        roles.push({ name: remaining[i], role: 'packer' });
      } else {
        roles.push({ name: remaining[i], role: 'casing' });
      }
    }

    // Calculate contributions
    let totalContribution = 0;
    let qualityBonus = 0;
    roles.forEach(r => {
      const s = pStats(r.name);
      const pr = pronouns(r.name);
      let contribution = 0;
      let qualityDelta = 0;
      let textPool, badPool;

      switch (r.role) {
        case 'grinder':
          contribution = s.physical * 4 + noise(5);
          textPool = GRIND_GOOD_GRINDER;
          badPool = GRIND_BAD_GRINDER;
          break;
        case 'shoveler':
          contribution = s.physical * 2 + s.endurance * 1.5 + noise(4);
          textPool = GRIND_GOOD_SHOVELER;
          badPool = GRIND_BAD_SHOVELER;
          break;
        case 'packer':
          contribution = s.mental * 2 + s.physical * 1.5 + noise(3);
          qualityDelta = contribution * 0.3;
          textPool = GRIND_GOOD_PACKER;
          badPool = GRIND_BAD_PACKER;
          break;
        case 'casing':
          contribution = s.endurance * 1.5 + noise(3);
          qualityDelta = contribution * 0.15;
          textPool = GRIND_GOOD_CASING;
          badPool = GRIND_BAD_CASING;
          break;
      }

      const isGood = contribution > 12;
      const text = isGood ? pick(textPool)(r.name, pr) : pick(badPool)(r.name, pr);

      r.contribution = Math.round(contribution * 10) / 10;
      r.qualityDelta = Math.round(qualityDelta * 10) / 10;
      r.text = text;

      totalContribution += contribution;
      qualityBonus += qualityDelta;

      // chalMemberScores
      if (contribution >= 25) {
        ep.chalMemberScores[r.name] += 5;
      } else if (contribution >= 15) {
        ep.chalMemberScores[r.name] += 3;
      } else if (contribution >= 8) {
        ep.chalMemberScores[r.name] += 1;
      } else {
        ep.chalMemberScores[r.name] -= 2;
      }
    });

    // Normalize to 0-100
    const maxPossible = n * 40; // rough theoretical max
    const rawQuality = (totalContribution / maxPossible) * 80 + qualityBonus * 0.5;
    grindData.sausageQuality = clamp(Math.round(rawQuality + noise(8)), 10, 95);
    grindData.roles = roles;

    // Mole sabotage
    if (gs.moles?.length) {
      const tribeMoles = gs.moles.filter(ml =>
        tribe.members.includes(ml.player) && !ml.exposed && !ml.layingLow
      );
      tribeMoles.forEach(mObj => {
        if (Math.random() < 0.35) {
          const penalty = 15 + Math.random() * 10;
          grindData.sausageQuality = clamp(grindData.sausageQuality - penalty, 5, 95);
          const pr = pronouns(mObj.player);
          grindData.events.push({
            type: 'mole-sabotage',
            players: [mObj.player],
            text: pick(GRIND_MOLE_SABOTAGE)(mObj.player, pr),
            consequences: `Sausage quality -${Math.round(penalty)}`,
          });
          mObj.sabotageCount++;
          mObj.sabotageLog.push({ ep: (gs.episode || 0) + 1, type: 'sausageSabotage', tribe: tribe.name });
        }
      });
    }

    // Social events: slacker callout + team bonding (1-2 per tribe)
    const slackers = roles.filter(r => r.contribution < 8);
    const hardWorkers = roles.filter(r => r.contribution >= 20);

    if (slackers.length > 0 && hardWorkers.length > 0) {
      const caller = pick(hardWorkers).name;
      const slacker = pick(slackers).name;
      grindData.events.push({
        type: 'slacker-callout',
        players: [caller, slacker],
        text: pick(GRIND_SLACKER_CALLOUT)(caller, slacker),
        consequences: 'bond -2',
      });
      addBond(caller, slacker, -2);
      popDelta(slacker, -1);
      ep.campEvents[tribe.name].post.push({
        text: `${caller} called out ${slacker} for slacking during the sausage grind.`,
        players: [caller, slacker],
        badgeText: 'SLACKER CALLOUT',
        badgeClass: 'red',
      });
    }

    // Team bonding (60% chance if no slacker drama)
    if (members.length >= 2 && (slackers.length === 0 || Math.random() < 0.4)) {
      const bondPair = shuffle(members).slice(0, 2);
      grindData.events.push({
        type: 'team-bonding',
        players: bondPair,
        text: pick(GRIND_TEAM_BONDING)(bondPair[0], bondPair[1], tribe.name),
        consequences: 'bond +1',
      });
      addBond(bondPair[0], bondPair[1], 1);
    }

    result.grindPhase.tribes.push(grindData);
  });

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: THE DESCENT (Bobsled Race)
  // ══════════════════════════════════════════════════════════════
  const tribeTimers = {};
  const tribeNavigators = {};

  tribes.forEach(tribe => {
    tribeTimers[tribe.name] = 0;

    // Pick navigator: highest physical+endurance combo with noise
    const navScores = tribe.members.map(m => {
      const s = pStats(m);
      return { name: m, score: s.physical * 0.6 + s.endurance * 0.4 + noise(3) };
    });
    navScores.sort((a, b) => b.score - a.score);
    tribeNavigators[tribe.name] = navScores[0].name;
  });

  // Get sausage quality per tribe
  const sausageQuality = {};
  result.grindPhase.tribes.forEach(gt => { sausageQuality[gt.tribeName] = gt.sausageQuality; });

  for (let seg = 0; seg < 6; seg++) {
    const segName = DESCENT_SEGMENT_NAMES[seg];
    const segData = {
      segNum: seg + 1,
      segName,
      tribeActions: [],
      hazard: null,
      socialEvents: [],
    };

    const isHazard = seg === 2 || seg === 3; // Goat Attack, Avalanche

    tribes.forEach(tribe => {
      const nav = tribeNavigators[tribe.name];
      const navStats = pStats(nav);
      const quality = sausageQuality[tribe.name];

      // Base time
      let baseTime = 6.0 + noise(1.5);
      // Quality modifier: good quality = faster
      baseTime += (50 - quality) * 0.08;

      // Navigation check
      const navScore = navStats.physical * 0.6 + navStats.endurance * 0.4 + noise(3);
      const isGoodNav = navScore > 5;
      let penalty = 0;

      if (!isGoodNav) {
        penalty = 2 + Math.random() * 4;
      }

      // Hazard check
      let hazardPenalty = 0;
      let hazardHit = false;
      if (isHazard) {
        const hazardScore = navStats.endurance * 0.4 + navStats.physical * 0.3 + navStats.mental * 0.2 + noise(3);
        if (hazardScore < 5) {
          hazardPenalty = 3 + Math.random() * 4;
          hazardHit = true;
        }
      }

      const segTime = Math.round((baseTime + penalty + hazardPenalty) * 10) / 10;
      tribeTimers[tribe.name] += segTime;

      // Generate text
      let text = '';
      let speedTag = 'normal';
      const goodPools = {
        0: DESCENT_LAUNCH_GOOD,
        1: DESCENT_HAIRPIN_GOOD,
        2: DESCENT_GOAT_DODGE,
        3: DESCENT_AVALANCHE_DODGE,
        4: DESCENT_SLALOM_GOOD,
        5: DESCENT_FINISH_CLOSE,
      };
      const badPools = {
        0: DESCENT_LAUNCH_BAD,
        1: DESCENT_HAIRPIN_BAD,
        2: DESCENT_GOAT_HIT,
        3: DESCENT_AVALANCHE_HIT,
        4: DESCENT_SLALOM_BAD,
        5: DESCENT_FINISH_CLOSE,
      };

      if (isHazard && hazardHit) {
        text = pick(badPools[seg])(tribe.name, nav);
        speedTag = 'hazard-hit';
      } else if (!isGoodNav) {
        text = pick(badPools[seg])(tribe.name, nav);
        speedTag = 'slow';
      } else {
        text = pick(goodPools[seg])(tribe.name, nav);
        speedTag = 'fast';
      }

      // Nav scoring
      if (isGoodNav) {
        ep.chalMemberScores[nav] += 4;
      } else {
        ep.chalMemberScores[nav] -= 1;
      }

      segData.tribeActions.push({
        tribeName: tribe.name,
        navigator: nav,
        text,
        timeDelta: segTime,
        totalTime: Math.round(tribeTimers[tribe.name] * 10) / 10,
        speedTag,
        event: hazardHit ? segName.toLowerCase() : null,
      });
    });

    // Hazard annotation
    if (isHazard) {
      segData.hazard = {
        type: seg === 2 ? 'goat' : 'avalanche',
        text: seg === 2
          ? 'A herd of mountain goats stampedes across the track!'
          : 'The mountain rumbles! Avalanche incoming!',
      };
    }

    // Social events during descent (1 per segment, 40% chance)
    if (Math.random() < 0.4 && tribes.length >= 2) {
      const eventType = Math.random();
      if (eventType < 0.35) {
        // Crash bonding within a tribe
        const tribe = pick(tribes);
        if (tribe.members.length >= 2) {
          const pair = shuffle(tribe.members).slice(0, 2);
          segData.socialEvents.push({
            type: 'crash-bonding',
            p1: pair[0], p2: pair[1],
            tribe: tribe.name,
            text: pick(DESCENT_CRASH_BONDING)(pair[0], pair[1]),
            bondDelta: 1,
          });
          addBond(pair[0], pair[1], 1);
        }
      } else if (eventType < 0.65) {
        // Trash talk between tribes
        const [tA, tB] = shuffle(tribes).slice(0, 2);
        const talker = pick(tA.members);
        const target = pick(tB.members);
        if (canScheme(talker) || VILLAIN_ARCHS.has(arch(talker)) || Math.random() < 0.3) {
          segData.socialEvents.push({
            type: 'trash-talk',
            p1: talker, p2: target,
            tribe1: tA.name, tribe2: tB.name,
            text: pick(DESCENT_TRASH_TALK)(talker, tA.name, target, tB.name),
            bondDelta: -1,
          });
          addBond(talker, target, -1);
          popDelta(talker, -1);
        }
      } else {
        // Showmance spark during descent (check romanticCompat)
        const tribe = pick(tribes);
        if (tribe.members.length >= 2 && seasonConfig.romance) {
          const candidates = shuffle(tribe.members).slice(0, 2);
          if (romanticCompat(candidates[0], candidates[1])) {
            segData.socialEvents.push({
              type: 'showmance-spark',
              p1: candidates[0], p2: candidates[1],
              tribe: tribe.name,
              text: pick(DESCENT_SHOWMANCE_SPARK)(candidates[0], candidates[1]),
              bondDelta: 2,
            });
            addBond(candidates[0], candidates[1], 2);
          }
        }
      }
    }

    result.descentPhase.segments.push(segData);
  }

  // Sort tribes by total time → placement
  const tribesSorted = tribes.slice().sort((a, b) => tribeTimers[a.name] - tribeTimers[b.name]);
  result.descentPhase.results = tribesSorted.map((t, i) => ({
    tribeName: t.name,
    totalTime: Math.round(tribeTimers[t.name] * 10) / 10,
    placement: i + 1,
  }));

  // Scoring for descent
  tribesSorted.forEach((t, i) => {
    const bonus = i === 0 ? 3 : (i === tribesSorted.length - 1 ? -1 : 1);
    t.members.forEach(m => { ep.chalMemberScores[m] += bonus; });
  });

  // Camp events for descent
  const winnerDescentTribe = tribesSorted[0];
  const loserDescentTribe = tribesSorted[tribesSorted.length - 1];
  ep.campEvents[winnerDescentTribe.name].post.push({
    text: `${winnerDescentTribe.name} finished the bobsled descent in first place!`,
    players: [...winnerDescentTribe.members],
    badgeText: 'FASTEST SLED',
    badgeClass: 'gold',
  });
  ep.campEvents[loserDescentTribe.name].post.push({
    text: `${loserDescentTribe.name} finished last in the bobsled descent.`,
    players: [...loserDescentTribe.members],
    badgeText: 'SLOWEST SLED',
    badgeClass: 'red',
  });

  // ══════════════════════════════════════════════════════════════
  // PHASE 3: HAT CEREMONY
  // ══════════════════════════════════════════════════════════════
  const hatTypes = ['pickelhaube', 'ushanka', 'tyrolean'];
  const hatBonuses = { pickelhaube: 2, ushanka: 1, tyrolean: 0 };
  const tribeHats = {};

  tribesSorted.forEach((t, i) => {
    const hatIdx = Math.min(i, 2); // 3+ tribes: 3rd and beyond get tyrolean
    const hatType = hatTypes[hatIdx] || 'tyrolean';
    tribeHats[t.name] = hatType;

    const hatTextPool = hatType === 'pickelhaube' ? HAT_PICKELHAUBE
      : hatType === 'ushanka' ? HAT_USHANKA
      : HAT_TYROLEAN;

    result.hatCeremony.placements.push({
      tribeName: t.name,
      place: i + 1,
      hatType,
      hpBonus: hatBonuses[hatType],
      text: pick(hatTextPool)(t.name),
    });
  });

  // Lederhosen humiliation for last-place tribe
  const lastTribe = tribesSorted[tribesSorted.length - 1];
  // Pick the most comedic/embarrassing player: lowest physical + boldness with noise
  const humiliationCandidates = lastTribe.members.map(m => {
    const s = pStats(m);
    return { name: m, score: (10 - s.physical) * 0.4 + (10 - s.boldness) * 0.3 + s.social * 0.2 + noise(2) };
  });
  humiliationCandidates.sort((a, b) => b.score - a.score);
  const humiliated = humiliationCandidates[0].name;
  const humPr = pronouns(humiliated);
  const humDelta = -(2 + Math.floor(Math.random() * 3));

  result.hatCeremony.humiliation = {
    tribeName: lastTribe.name,
    player: humiliated,
    text: pick(LEDERHOSEN_HUMILIATION)(humiliated, humPr, lastTribe.name),
  };
  popDelta(humiliated, humDelta);
  ep.campEvents[lastTribe.name].post.push({
    text: `${humiliated} was humiliated in lederhosen during the hat ceremony.`,
    players: [humiliated],
    badgeText: 'LEDERHOSEN',
    badgeClass: 'red',
  });

  // ══════════════════════════════════════════════════════════════
  // PHASE 4: CAPTAIN ELECTION + DRAFT
  // ══════════════════════════════════════════════════════════════

  // Elect captains
  const tribeCaptains = {};
  tribes.forEach(tribe => {
    const scores = tribe.members.map(m => {
      const s = pStats(m);
      return {
        name: m,
        score: s.social * 0.4 + s.strategic * 0.3 + s.physical * 0.2 + noise(2),
        tiebreak: s.strategic + s.social,
      };
    });
    scores.sort((a, b) => b.score - a.score || b.tiebreak - a.tiebreak);
    const captain = scores[0].name;
    tribeCaptains[tribe.name] = captain;

    const pr = pronouns(captain);
    result.captainDraft.captains.push({
      tribeName: tribe.name,
      captain,
      reason: pick(CAPTAIN_ELECTED)(captain, tribe.name, pr),
    });
    ep.chalMemberScores[captain] += 2;
  });

  // Equalize fighter count
  const minTribeSize = Math.min(...tribes.map(t => t.members.length));
  const fighterCount = clamp(minTribeSize, 3, 5);
  result.captainDraft.fighterCount = fighterCount;

  // Each tribe: captain picks who sits out (if tribe is larger than fighterCount)
  const tribeFighters = {};
  const tribeSitOuts = {};

  tribes.forEach(tribe => {
    const captain = tribeCaptains[tribe.name];
    const otherMembers = tribe.members.filter(m => m !== captain);
    const numToSit = tribe.members.length - fighterCount;

    if (numToSit <= 0) {
      // Everyone fights (including captain)
      tribeFighters[tribe.name] = [...tribe.members];
      tribeSitOuts[tribe.name] = [];
      return;
    }

    // Captain always fights. Sit out the "weakest" fighters with noise
    const sitScores = otherMembers.map(m => {
      const s = pStats(m);
      return {
        name: m,
        fightScore: s.physical * 0.4 + s.endurance * 0.3 + s.boldness * 0.2 + noise(2.5),
      };
    });
    sitScores.sort((a, b) => a.fightScore - b.fightScore);
    const sittingOut = sitScores.slice(0, numToSit).map(x => x.name);
    const fighting = otherMembers.filter(m => !sittingOut.includes(m));

    tribeFighters[tribe.name] = [captain, ...fighting];
    tribeSitOuts[tribe.name] = sittingOut;

    // Sit-out reactions + bond consequences
    sittingOut.forEach(player => {
      const pr = pronouns(player);
      const s = pStats(player);
      const isRelieved = s.boldness * 0.4 + noise(2) < 4;
      const reaction = isRelieved
        ? pick(SITOUT_RELIEVED)(player, captain, pr)
        : pick(SITOUT_RELUCTANT)(player, captain, pr);

      const bondChanges = [];
      if (!isRelieved) {
        addBond(player, captain, -1);
        bondChanges.push({ from: player, to: captain, delta: -1 });
      } else {
        addBond(player, captain, 1);
        bondChanges.push({ from: player, to: captain, delta: 1 });
      }

      result.captainDraft.sitOuts.push({
        tribeName: tribe.name,
        player,
        captain,
        reaction,
        bondChanges,
        isRelieved,
      });
      ep.chalMemberScores[player] -= 1;
    });
  });

  // Rivalry auto-lock: find the pair across tribes with lowest bond
  let worstBondPair = null;
  let worstBond = Infinity;
  for (let ti = 0; ti < tribes.length; ti++) {
    for (let tj = ti + 1; tj < tribes.length; tj++) {
      const fA = tribeFighters[tribes[ti].name];
      const fB = tribeFighters[tribes[tj].name];
      for (const a of fA) {
        for (const b of fB) {
          const bond = getBond(a, b);
          if (bond < worstBond) {
            worstBond = bond;
            worstBondPair = { p1: a, tribe1: tribes[ti].name, p2: b, tribe2: tribes[tj].name, bond };
          }
        }
      }
    }
  }

  if (worstBondPair && worstBond < 0) {
    result.captainDraft.rivalryLocks.push(worstBondPair);
  }

  // ── Build matchups via snake draft ──
  // For simplicity with 2+ tribes: pair fighters from different tribes
  // Draft order = descent placement (1st picks first)
  // With 2 tribes: straightforward 1v1 across tribes
  // With 3+ tribes: round-robin style, captains pick cross-tribe matchups

  const matchups = [];
  const usedFighters = new Set();

  // Handle rivalry lock first
  if (worstBondPair && worstBond < 0) {
    matchups.push({
      p1: worstBondPair.p1,
      tribe1: worstBondPair.tribe1,
      p2: worstBondPair.p2,
      tribe2: worstBondPair.tribe2,
      pickNum: 0,
      captain: null,
      reaction: pick(DRAFT_PICK_RIVALRY)(
        tribeCaptains[worstBondPair.tribe1], worstBondPair.p1, worstBondPair.p2
      ),
      isRivalry: true,
    });
    usedFighters.add(worstBondPair.p1);
    usedFighters.add(worstBondPair.p2);
  }

  // Build remaining matchups
  // For 2-tribe scenario: pair remaining fighters across tribes
  if (tribes.length === 2) {
    const tA = tribesSorted[0].name;
    const tB = tribesSorted[1].name;
    const remainA = tribeFighters[tA].filter(f => !usedFighters.has(f));
    const remainB = tribeFighters[tB].filter(f => !usedFighters.has(f));
    const pairCount = Math.min(remainA.length, remainB.length);

    // Snake draft: captain of tribe A picks first, then B, then A...
    const captainOrder = [tribesSorted[0].name, tribesSorted[1].name];
    let pickIdx = 0;

    for (let p = 0; p < pairCount; p++) {
      const draftCaptainTribe = captainOrder[p % 2];
      const draftCaptain = tribeCaptains[draftCaptainTribe];
      const myPool = draftCaptainTribe === tA ? remainA : remainB;
      const theirPool = draftCaptainTribe === tA ? remainB : remainA;

      if (myPool.length === 0 || theirPool.length === 0) break;

      // Captain picks their best available vs opponent's weakest available
      const myFighter = myPool.shift();
      const theirFighter = theirPool.shift();
      if (!myFighter || !theirFighter) break;

      const isConfident = pStats(myFighter).physical * 0.5 + noise(2) >
                          pStats(theirFighter).physical * 0.5;

      pickIdx++;
      matchups.push({
        p1: myFighter,
        tribe1: draftCaptainTribe,
        p2: theirFighter,
        tribe2: draftCaptainTribe === tA ? tB : tA,
        pickNum: pickIdx,
        captain: draftCaptain,
        captainTribe: draftCaptainTribe,
        reaction: isConfident
          ? pick(DRAFT_PICK_CONFIDENT)(draftCaptain, myFighter, theirFighter)
          : pick(DRAFT_PICK_RISKY)(draftCaptain, myFighter, theirFighter),
        isRivalry: false,
      });
      usedFighters.add(myFighter);
      usedFighters.add(theirFighter);
    }
  } else {
    // 3+ tribes: interleave fighters round-robin across tribes so every tribe gets opponents
    const tribeQueues = {};
    tribesSorted.forEach(t => {
      tribeQueues[t.name] = tribeFighters[t.name].filter(f => !usedFighters.has(f));
    });

    // Build interleaved pool: take one fighter per tribe in rotation
    const interleaved = [];
    let maxLen = Math.max(...Object.values(tribeQueues).map(q => q.length));
    for (let slot = 0; slot < maxLen; slot++) {
      tribesSorted.forEach(t => {
        if (slot < tribeQueues[t.name].length) {
          interleaved.push({ name: tribeQueues[t.name][slot], tribe: t.name });
        }
      });
    }

    // Pair adjacent fighters from different tribes; skip same-tribe adjacencies
    const available = [...interleaved];
    let pickIdx = matchups.length;
    // Cycle drafting captain through tribes
    const captainCycle = tribesSorted.map(t => t.name);
    let captCycleIdx = 0;

    while (available.length >= 2) {
      const f1 = available.shift();
      const f2Idx = available.findIndex(f => f.tribe !== f1.tribe);
      if (f2Idx === -1) break;
      const f2 = available.splice(f2Idx, 1)[0];

      const draftCaptainTribe = captainCycle[captCycleIdx % captainCycle.length];
      captCycleIdx++;
      const draftCaptain = tribeCaptains[draftCaptainTribe];
      const isConfident = pStats(f1.name).physical * 0.5 + noise(2) >
                          pStats(f2.name).physical * 0.5;

      matchups.push({
        p1: f1.name, tribe1: f1.tribe,
        p2: f2.name, tribe2: f2.tribe,
        pickNum: ++pickIdx,
        captain: draftCaptain,
        captainTribe: draftCaptainTribe,
        reaction: isConfident
          ? pick(DRAFT_PICK_CONFIDENT)(draftCaptain, f1.name, f2.name)
          : pick(DRAFT_PICK_RISKY)(draftCaptain, f1.name, f2.name),
        isRivalry: false,
      });
      usedFighters.add(f1.name);
      usedFighters.add(f2.name);
    }
  }

  result.captainDraft.matchups = matchups;

  // ══════════════════════════════════════════════════════════════
  // PHASE 5: TOURNAMENT BRACKET
  // ══════════════════════════════════════════════════════════════

  // Track tribe fighter KO counts
  const tribeKOs = {};
  const tribeFighterWins = {};
  tribes.forEach(t => {
    tribeKOs[t.name] = 0;
    tribeFighterWins[t.name] = 0;
  });

  const allFights = [];
  let eliminatedTribe = null;

  // ── Simulate fights ──
  function simulateFight(matchup, roundNum, fightNum) {
    const { p1, tribe1, p2, tribe2, isRivalry } = matchup;

    const hat1 = tribeHats[tribe1];
    const hat2 = tribeHats[tribe2];
    const hpBonus1 = hatBonuses[hat1] || 0;
    const hpBonus2 = hatBonuses[hat2] || 0;

    let hp1 = 10 + hpBonus1;
    let hp2 = 10 + hpBonus2;
    let dm1 = 70; // dance meter
    let dm2 = 70;

    const exchanges = [];
    const maxExchanges = 4 + Math.floor(Math.random() * 3); // 4-6

    for (let ex = 0; ex < maxExchanges && hp1 > 0 && hp2 > 0; ex++) {
      // Alternate attacker or random
      const isP1Attack = ex % 2 === 0 ? true : false;
      const attacker = isP1Attack ? p1 : p2;
      const defender = isP1Attack ? p2 : p1;
      const atkStats = pStats(attacker);
      const defStats = pStats(defender);
      const atkPr = pronouns(attacker);
      const atkDM = isP1Attack ? dm1 : dm2;
      const defDM = isP1Attack ? dm2 : dm1;

      // Pick move type
      let moveType;
      if (atkDM < 30 || (isP1Attack ? hp1 : hp2) < 4) {
        // Desperation
        moveType = pick(DESPERATION_MOVES);
      } else {
        moveType = pick(MOVE_TYPES);
      }

      // Calculate damage
      let rawDamage = (atkStats.physical * 0.5 + atkStats.boldness * 0.3) * (atkDM / 100) + noise(2);
      rawDamage = clamp(Math.round(rawDamage), 1, 5);

      // Block check
      let blockReduction = 0;
      const blockScore = (defStats.endurance * 0.3 + defStats.physical * 0.2) * (defDM / 100) + noise(1.5);
      const blocked = blockScore > 3;
      if (blocked) {
        blockReduction = clamp(Math.round(blockScore * 0.5), 1, 2);
        rawDamage = Math.max(1, rawDamage - blockReduction);
      }

      // Apply damage
      if (isP1Attack) { hp2 -= rawDamage; } else { hp1 -= rawDamage; }

      // Dance meter decay
      const dmDecay = 5 + Math.round(10 * (1 - (atkStats.endurance * 5 + atkStats.mental * 3 + noise(5)) / 80));
      const clampedDecay = clamp(dmDecay, 5, 15);
      if (isP1Attack) { dm1 = clamp(dm1 - clampedDecay, 0, 100); } else { dm2 = clamp(dm2 - clampedDecay, 0, 100); }

      // Electroshock check
      let shockEvent = false;
      let shockTarget = null;
      let shockDamage = 0;
      const currentDM = isP1Attack ? dm1 : dm2;

      if (currentDM < 30 && Math.random() < 0.4) {
        // Low DM → shock the attacker
        shockTarget = attacker;
        shockDamage = 1 + (Math.random() < 0.3 ? 1 : 0);
        shockEvent = true;
        if (isP1Attack) {
          hp1 -= shockDamage;
          dm1 = clamp(dm1 - (10 + Math.round(Math.random() * 5)), 0, 100);
        } else {
          hp2 -= shockDamage;
          dm2 = clamp(dm2 - (10 + Math.round(Math.random() * 5)), 0, 100);
        }
      } else if (Math.random() < 0.2) {
        // Random Chris shock — can hit either
        const shockVictim = Math.random() < 0.5 ? p1 : p2;
        shockTarget = shockVictim;
        shockDamage = 1 + (Math.random() < 0.2 ? 1 : 0);
        shockEvent = true;
        if (shockVictim === p1) {
          hp1 -= shockDamage;
          dm1 = clamp(dm1 - (10 + Math.round(Math.random() * 5)), 0, 100);
        } else {
          hp2 -= shockDamage;
          dm2 = clamp(dm2 - (10 + Math.round(Math.random() * 5)), 0, 100);
        }
      }

      hp1 = Math.max(0, hp1);
      hp2 = Math.max(0, hp2);

      // Build text
      const movePool = MOVE_POOLS[moveType] || MOVE_POWER_SLAP;
      let text = pick(movePool)(attacker, defender, atkPr);
      if (blocked) {
        const dPr = pronouns(defender);
        text += ' ' + pick(BLOCK_SUCCESS)(defender, attacker, dPr);
      }
      if (shockEvent && shockTarget) {
        const sPr = pronouns(shockTarget);
        if (currentDM < 30 && shockTarget === attacker) {
          text += ' ' + pick(ELECTROSHOCK)(shockTarget, sPr);
        } else {
          text += ' ' + pick(RANDOM_SHOCK)(shockTarget, sPr);
        }
      }

      exchanges.push({
        attackerName: attacker,
        defenderName: defender,
        moveType,
        damage: rawDamage,
        blocked,
        blockReduction,
        shockEvent,
        shockTarget,
        shockDamage,
        attackerHP: isP1Attack ? hp1 : hp2,
        defenderHP: isP1Attack ? hp2 : hp1,
        attackerDM: isP1Attack ? dm1 : dm2,
        defenderDM: isP1Attack ? dm2 : dm1,
        text,
      });
    }

    // Determine winner
    let winner, loser, winnerFinalHP, loserFinalHP;
    if (hp1 <= 0 && hp2 <= 0) {
      // Both KO'd — whoever has higher HP "survives"
      winner = hp1 >= hp2 ? p1 : p2;
      loser = winner === p1 ? p2 : p1;
      winnerFinalHP = Math.max(hp1, hp2);
      loserFinalHP = Math.min(hp1, hp2);
    } else if (hp1 <= 0) {
      winner = p2; loser = p1;
      winnerFinalHP = hp2; loserFinalHP = hp1;
    } else if (hp2 <= 0) {
      winner = p1; loser = p2;
      winnerFinalHP = hp1; loserFinalHP = hp2;
    } else {
      // Ran out of exchanges — higher HP wins
      winner = hp1 >= hp2 ? p1 : p2;
      loser = winner === p1 ? p2 : p1;
      winnerFinalHP = winner === p1 ? hp1 : hp2;
      loserFinalHP = loser === p1 ? hp1 : hp2;
    }

    const wPr = pronouns(winner);

    // Scoring
    ep.chalMemberScores[winner] += 6;
    ep.chalMemberScores[loser] -= 2;
    popDelta(winner, 1);
    if (isRivalry) {
      popDelta(winner, 1); // Extra pop for rivalry win
      addBond(winner, loser, -1); // Rivalry deepens
    }

    // Track tribe stats
    tribeKOs[tribeOf[loser]]++;
    tribeFighterWins[tribeOf[winner]]++;

    // Social events for this fight (1-2)
    const socialEvents = [];

    // Always at least one social event
    const socialRoll = Math.random();
    if (socialRoll < 0.25) {
      // Sideline coaching
      const winnerTribe = tribes.find(t => t.name === tribeOf[winner]);
      const coaches = winnerTribe.members.filter(m => m !== winner);
      if (coaches.length > 0) {
        const coach = pick(coaches);
        socialEvents.push({
          type: 'coaching',
          players: [coach, winner],
          text: pick(SOCIAL_COACHING)(coach, winner, tribeOf[winner]),
          bondDelta: 1,
          popDelta: 0,
        });
        addBond(coach, winner, 1);
      }
    } else if (socialRoll < 0.45) {
      // Celebration
      socialEvents.push({
        type: 'celebration',
        players: [winner],
        text: pick(SOCIAL_CELEBRATION)(winner, tribeOf[winner]),
        bondDelta: 0,
        popDelta: 1,
      });
      popDelta(winner, 1);
    } else if (socialRoll < 0.65) {
      // Panic on losing side
      const loserTribe = tribes.find(t => t.name === tribeOf[loser]);
      const panickers = loserTribe.members.filter(m => m !== loser);
      if (panickers.length > 0) {
        socialEvents.push({
          type: 'panic',
          players: [loser],
          text: pick(SOCIAL_PANIC)(loser, tribeOf[loser]),
          bondDelta: 0,
          popDelta: -1,
        });
        popDelta(loser, -1);
      }
    } else if (socialRoll < 0.8) {
      // Respect between fighters
      socialEvents.push({
        type: 'respect',
        players: [winner, loser],
        text: pick(SOCIAL_RESPECT)(winner, loser),
        bondDelta: 1,
        popDelta: 0,
      });
      addBond(winner, loser, 1);
    } else {
      // Blame (villain/schemer on losing tribe blames the loser)
      const loserTribe = tribes.find(t => t.name === tribeOf[loser]);
      const blamers = loserTribe.members.filter(m => m !== loser && (VILLAIN_ARCHS.has(arch(m)) || canScheme(m)));
      if (blamers.length > 0) {
        const blamer = pick(blamers);
        socialEvents.push({
          type: 'blame',
          players: [blamer, loser],
          text: pick(SOCIAL_BLAME)(blamer, loser, tribeOf[loser]),
          bondDelta: -2,
          popDelta: -1,
        });
        addBond(blamer, loser, -2);
        popDelta(loser, -1);
      } else {
        // Fallback: pre-fight tension for the next fight
        socialEvents.push({
          type: 'tension',
          players: [winner, loser],
          text: pick(SOCIAL_PREFIGHT_TENSION)(winner, loser),
          bondDelta: 0,
          popDelta: 0,
        });
      }
    }

    // Bonus social event (40% chance)
    if (Math.random() < 0.4) {
      // Coaching from non-fighting tribe member
      const winnerTribeObj = tribes.find(t => t.name === tribeOf[winner]);
      const benchMembers = (tribeSitOuts[tribeOf[winner]] || []);
      if (benchMembers.length > 0) {
        const benchCoach = pick(benchMembers);
        socialEvents.push({
          type: 'coaching',
          players: [benchCoach, winner],
          text: pick(SOCIAL_COACHING)(benchCoach, winner, tribeOf[winner]),
          bondDelta: 1,
          popDelta: 0,
        });
        addBond(benchCoach, winner, 1);
      }
    }

    return {
      fightNum,
      p1, tribe1, p1Hat: hat1, p1HpBonus: hpBonus1,
      p2, tribe2, p2Hat: hat2, p2HpBonus: hpBonus2,
      isRivalry,
      exchanges,
      socialEvents,
      winner, loser,
      winnerFinalHP, loserFinalHP,
      koText: pick(KO_TEXT)(winner, loser, wPr),
    };
  }

  // Run tournament rounds
  let currentMatchups = [...matchups];
  let roundNum = 0;
  const totalRounds = currentMatchups.length <= 3 ? 1 : (currentMatchups.length <= 6 ? 2 : 3);

  // Simple approach: all matchups in round 1, check tribe elimination
  const round1 = {
    roundNum: 1,
    roundLabel: totalRounds === 1 ? 'Final' : 'Round 1',
    fights: [],
    tribeEliminations: null,
  };

  currentMatchups.forEach((m, i) => {
    const fight = simulateFight(m, 1, i + 1);
    round1.fights.push(fight);

    // Check if any tribe is fully eliminated
    const tribeTotal = {};
    tribes.forEach(t => { tribeTotal[t.name] = tribeFighters[t.name].length; });

    // After each fight, check if any tribe has all fighters KO'd
    if (!eliminatedTribe) {
      for (const t of tribes) {
        if (tribeKOs[t.name] >= tribeTotal[t.name]) {
          eliminatedTribe = t.name;
          round1.tribeEliminations = { tribeName: t.name, eliminated: true };
          break;
        }
      }
    }
  });

  result.tournament.rounds.push(round1);

  // If no tribe eliminated after round 1 (rare with matched fighter counts), determine loser by KO ratio
  if (!eliminatedTribe) {
    // Tribe with the worst KO ratio loses
    let worstTribe = null;
    let worstRatio = Infinity;
    tribes.forEach(t => {
      const wins = tribeFighterWins[t.name] || 0;
      const kos = tribeKOs[t.name] || 0;
      const ratio = wins - kos;
      if (ratio < worstRatio || (ratio === worstRatio && Math.random() < 0.5)) {
        worstRatio = ratio;
        worstTribe = t.name;
      }
    });
    eliminatedTribe = worstTribe;
  }

  // Determine champion: fighter with the most wins from the best-performing tribe
  let bestTribe = null;
  let bestRecord = -Infinity;
  tribes.forEach(t => {
    const record = (tribeFighterWins[t.name] || 0) - (tribeKOs[t.name] || 0);
    if (record > bestRecord || (record === bestRecord && Math.random() < 0.5)) {
      bestRecord = record;
      bestTribe = t.name;
    }
  });

  // Champion: fighter from best tribe with highest chalMemberScores
  const champCandidates = tribeFighters[bestTribe]
    .sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0));
  const champion = champCandidates[0] || tribeFighters[bestTribe][0];

  result.tournament.champion = champion;
  result.tournament.eliminatedTribe = eliminatedTribe;

  // Camp events for tournament
  ep.campEvents[bestTribe].post.push({
    text: `${champion} was the standout fighter in the Slap Slap Revolution tournament!`,
    players: [champion],
    badgeText: 'CHAMPION',
    badgeClass: 'gold',
  });
  ep.campEvents[eliminatedTribe].post.push({
    text: `${eliminatedTribe} was eliminated from the tournament and must attend tribal council.`,
    players: [...(tribes.find(t => t.name === eliminatedTribe)?.members || [])],
    badgeText: 'ELIMINATED',
    badgeClass: 'red',
  });

  // ══════════════════════════════════════════════════════════════
  // ROMANCE HOOKS
  // ══════════════════════════════════════════════════════════════
  const _romActive = allActive;
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'slap slap revolution');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'slap slap revolution', _romActive);

  // ══════════════════════════════════════════════════════════════
  // FINALIZE
  // ══════════════════════════════════════════════════════════════
  ep.slapRevolution = result;
  ep.isSlapRevolution = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Slap Slap Revolution';
  ep.challengeCategory = 'physical';

  // Winner = tribe with best record; Loser = eliminated tribe
  const winnerTribe = tribes.find(t => t.name === bestTribe);
  const loserTribe = tribes.find(t => t.name === eliminatedTribe);

  ep.winner = winnerTribe;
  ep.loser = loserTribe;
  ep.safeTribes = tribes.length > 2
    ? tribes.filter(t => t.name !== bestTribe && t.name !== eliminatedTribe)
    : [];
  ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];

  ep.challengePlacements = tribesSorted.map(tn => ({
    name: tn.name,
    members: [...tn.members],
  }));

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

  result.tournament.immunityWinner = ep.immunityWinner;

  updateChalRecord(ep);
  return ep;
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER STUBS — actual VP builders will be implemented by another agent
// These exports provide the simulation data structures the VP builders will need
// ══════════════════════════════════════════════════════════════

// TV state for click-to-reveal
const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

// Re-apply visibility after screen switch (patches stale DOM)
function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`ssr-step-${suffix}-${i}`);
    if (el) el.classList.add('ssr-visible');
  }
  const counter = document.getElementById(`ssr-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`ssr-controls-${suffix}`);
    if (controls) {
      const btns = controls.querySelectorAll('.ssr-btn');
      btns.forEach(b => { b.style.opacity = '0.4'; });
    }
  }
}

export function ssrRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('ssr-', '');
  _reapplyVisibility(suffix, st.idx, st.total);
  const el = document.getElementById(`ssr-step-${suffix}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try { _updateSidebar(screenKey); } catch (e) { /* sidebar may not exist yet */ }
}

export function ssrRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('ssr-', '');
  _reapplyVisibility(suffix, st.idx, st.total);
  try { _updateSidebar(screenKey); } catch (e) { /* sidebar may not exist yet */ }
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER FUNCTIONS
// ══════════════════════════════════════════════════════════════

// ── CSS Icon helper ──
function _icon(type) {
  switch (type) {
    case 'sausage': return '<div class="ssr-i-sausage"></div>';
    case 'meat': return '<div class="ssr-i-meat"><div></div></div>';
    case 'bolt': return '<div class="ssr-i-bolt"></div>';
    case 'mtn': return '<div class="ssr-i-mtn"></div>';
    case 'pad': return '<div class="ssr-i-pad"><div class="arr arr-u"></div><div class="arr arr-d"></div><div class="arr arr-l"></div><div class="arr arr-r"></div><div class="ctr"></div></div>';
    case 'goat': return '<div class="ssr-i-goat"></div>';
    default: return '';
  }
}

// ── Avatar helper ──
function _av(name, tribeName, size = '') {
  const tc = tribeColor(tribeName) || '#a8d8ea';
  const cls = `ssr-av${size ? ' ssr-av-' + size : ''}`;
  return `<div class="${cls}" style="border-color:${tc}">${portrait(name, size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'sm' ? 26 : 36)}</div>`;
}

// ── HP bar ──
function _hpBar(current, max, label = 'HP') {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const cls = pct > 60 ? 'full' : pct > 30 ? 'mid' : 'low';
  const col = cls === 'full' ? 'green' : cls === 'mid' ? 'gold' : 'danger';
  return `<div class="ssr-hp"><span class="ssr-hp-label">${label}</span><div class="ssr-hp-track"><div class="ssr-hp-fill ${cls}" style="width:${pct}%"></div></div><span class="ssr-hp-val" style="color:var(--ssr-${col})">${current}</span></div>`;
}

// ── Dance meter bar ──
function _dmBar(current, label = 'RHYTHM') {
  const cls = current >= 30 ? 'good' : 'danger';
  return `<div class="ssr-dm"><span class="ssr-dm-label">${label}</span><div class="ssr-dm-track"><div class="ssr-dm-fill ${cls}" style="width:${current}%"></div></div><span class="ssr-dm-val">${current}</span></div>`;
}

// ── Speed tag ──
function _speedTag(tag) {
  if (tag === 'fast') return '<span class="ssr-speed fast">BLAZING</span>';
  if (tag === 'slow') return '<span class="ssr-speed slow">CRAWLING</span>';
  if (tag === 'hazard-hit') return '<span class="ssr-speed slow">HIT!</span>';
  return '<span class="ssr-speed mid">STEADY</span>';
}

// ── Move icon ──
function _moveIcon(moveType) {
  if (moveType === 'dance-kick' || moveType === 'sweep') return '&#129461;';
  if (moveType === 'haymaker' || moveType === 'rally-slap') return '&#128165;';
  return '&#128074;';
}

// ── Move display name ──
function _moveName(moveType) {
  const names = { 'power-slap':'POWER SLAP','jab-slap':'JAB SLAP','spin-slap':'SPIN SLAP',
    'overhead-slap':'OVERHEAD SLAP','dance-kick':'DANCE KICK','sweep':'LEG SWEEP',
    'rally-slap':'RALLY SLAP','counter-slap':'COUNTER SLAP','haymaker':'HAYMAKER' };
  return names[moveType] || 'SLAP';
}

// ── Hat display name ──
function _hatName(hatType) {
  if (hatType === 'pickelhaube') return 'Pickelhaube';
  if (hatType === 'ushanka') return 'Ushanka';
  return 'Tyrolean';
}

// ── Tribe dot helper ──
function _tribeDot(tribeName) {
  const tc = tribeColor(tribeName) || '#a8d8ea';
  return `<div class="ssr-side-tribe-dot" style="background:${tc}"></div>`;
}

// ── Tournament bracket builder ──
// revealedFightIdxs: Set of fight indices whose results should be visible
function _buildBracket(matchups, fights, revealedFightIdxs) {
  const revealed = revealedFightIdxs || new Set();
  let h = `<div class="ssr-bracket">`;

  // Build matchup slots
  matchups.forEach((m, mi) => {
    const fight = fights?.[mi];
    const isRevealed = revealed.has(mi);
    const tc1 = tribeColor(m.tribe1) || '#a8d8ea';
    const tc2 = tribeColor(m.tribe2) || '#a8d8ea';
    const p1Won = isRevealed && fight?.winner === m.p1;
    const p2Won = isRevealed && fight?.winner === m.p2;
    const rivalryTag = m.isRivalry ? `<span style="color:var(--ssr-danger);font-size:7px;letter-spacing:.5px;"> &#9876; RIVAL</span>` : '';

    h += `<div class="ssr-bracket-match${m.isRivalry ? ' rivalry' : ''}">
      <div class="ssr-bracket-label">${m.isRivalry ? 'RIVALRY' : 'MATCH ' + mi}${rivalryTag}</div>
      <div class="ssr-bracket-slot${p1Won ? ' winner' : p2Won ? ' loser' : ''}">
        <div class="ssr-bracket-dot" style="background:${tc1};">${(m.p1 || '?')[0]}</div>
        <span class="ssr-bracket-name">${m.p1}</span>
        <span class="ssr-bracket-tribe" style="color:${tc1};">${m.tribe1}</span>
        <span class="ssr-bracket-result" style="color:${p1Won ? 'var(--ssr-gold)' : p2Won ? 'var(--ssr-danger)' : 'rgba(232,240,248,.2)'};">${p1Won ? 'W' : p2Won ? 'KO' : '—'}</span>
      </div>
      <div class="ssr-bracket-vs">VS</div>
      <div class="ssr-bracket-slot${p2Won ? ' winner' : p1Won ? ' loser' : ''}">
        <div class="ssr-bracket-dot" style="background:${tc2};">${(m.p2 || '?')[0]}</div>
        <span class="ssr-bracket-name">${m.p2}</span>
        <span class="ssr-bracket-tribe" style="color:${tc2};">${m.tribe2}</span>
        <span class="ssr-bracket-result" style="color:${p2Won ? 'var(--ssr-gold)' : p1Won ? 'var(--ssr-danger)' : 'rgba(232,240,248,.2)'};">${p2Won ? 'W' : p1Won ? 'KO' : '—'}</span>
      </div>
    </div>`;
  });

  // Tribe scoreboard
  if (fights?.length > 0) {
    const tribeWins = {};
    const tribeLosses = {};
    matchups.forEach((m, mi) => {
      const fight = fights?.[mi];
      if (!fight || !revealed.has(mi)) return;
      const wTribe = m.p1 === fight.winner ? m.tribe1 : m.tribe2;
      const lTribe = m.p1 === fight.winner ? m.tribe2 : m.tribe1;
      tribeWins[wTribe] = (tribeWins[wTribe] || 0) + 1;
      tribeLosses[lTribe] = (tribeLosses[lTribe] || 0) + 1;
    });
    if (Object.keys(tribeWins).length > 0) {
      h += `<div class="ssr-bracket-score"><div style="font-size:7px;color:rgba(232,240,248,.3);letter-spacing:1px;margin-bottom:4px;">TRIBE SCORE</div>`;
      const allTribes = new Set([...matchups.map(m => m.tribe1), ...matchups.map(m => m.tribe2)]);
      allTribes.forEach(tn => {
        const tc = tribeColor(tn) || '#a8d8ea';
        const w = tribeWins[tn] || 0;
        const l = tribeLosses[tn] || 0;
        h += `<div style="display:flex;align-items:center;gap:4px;font-size:9px;"><div class="ssr-bracket-dot" style="background:${tc};width:8px;height:8px;">${tn[0]}</div><span style="flex:1;">${tn}</span><span style="color:var(--ssr-green);">${w}W</span><span style="color:var(--ssr-danger);">${l}L</span></div>`;
      });
      h += `</div>`;
    }
  }

  h += `</div>`;
  return h;
}

// ── Flavor text helper ──
function _flavor(flavorArr, idx) {
  return `<div class="ssr-flavor host">${flavorArr[idx % flavorArr.length]()}</div>`;
}

// ── Generate static particle elements ──
function _genSnow(count) {
  let h = '';
  for (let i = 0; i < count; i++) {
    const sz = (1 + Math.random() * 3).toFixed(1);
    h += `<div class="ssr-sf" style="left:${(Math.random()*100).toFixed(1)}%;width:${sz}px;height:${sz}px;animation-duration:${(6+Math.random()*8).toFixed(1)}s;animation-delay:${(Math.random()*10).toFixed(1)}s;opacity:${(0.2+Math.random()*0.4).toFixed(2)}"></div>`;
  }
  return h;
}
function _genSparks(count) {
  let h = '';
  for (let i = 0; i < count; i++) {
    h += `<div class="ssr-spark-p" style="left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;animation-delay:${(Math.random()*5).toFixed(1)}s;animation-duration:${(1.5+Math.random()*3).toFixed(1)}s"></div>`;
  }
  return h;
}
function _genArrows(count) {
  const arrows = ['←','↑','→','↓'];
  let h = '';
  for (let i = 0; i < count; i++) {
    h += `<div class="ssr-farrow" style="left:${(Math.random()*100).toFixed(1)}%;font-size:${(16+Math.random()*20).toFixed(0)}px;animation-duration:${(8+Math.random()*12).toFixed(1)}s;animation-delay:${(Math.random()*15).toFixed(1)}s">${arrows[Math.floor(Math.random()*4)]}</div>`;
  }
  return h;
}
function _genMeat(count) {
  const colors = ['#c0392b','#e74c3c','#d4874a','#a93226'];
  let h = '';
  for (let i = 0; i < count; i++) {
    const sz = (3 + Math.random() * 6).toFixed(1);
    h += `<div class="ssr-meatp" style="left:${(Math.random()*100).toFixed(1)}%;top:${(Math.random()*100).toFixed(1)}%;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${(3+Math.random()*5).toFixed(1)}s;animation-delay:${(Math.random()*8).toFixed(1)}s"></div>`;
  }
  return h;
}

// ── Ticker text builder ──
function _tickerText(ep) {
  const d = ep.slapRevolution;
  if (!d) return 'SLAP SLAP REVOLUTION';
  const parts = ['SLAP SLAP REVOLUTION'];
  parts.push('ALPINE THROWDOWN');
  if (d.tournament?.champion) parts.push(`CHAMPION: ${d.tournament.champion}`);
  if (d.tournament?.eliminatedTribe) parts.push(`${d.tournament.eliminatedTribe} ELIMINATED`);
  (d.hatCeremony?.placements || []).forEach(p => parts.push(`${p.tribeName}: ${_hatName(p.hatType)}`));
  return parts.join(' &mdash; ');
}

// ══════════════════════════════════════════════════════════════
// SHELL WRAPPER — full CSS from mockup
// ══════════════════════════════════════════════════════════════
function _shell(content, ep, phaseCls) {
  return `<style>
@import url('https://fonts.googleapis.com/css2?family=Bungee+Shade&family=Russo+One&family=Oswald:wght@400;600;700&family=Special+Elite&family=Press+Start+2P&display=swap');
:root{--ssr-wood:#5c3a1e;--ssr-wood-lt:#8b5e34;--ssr-wood-dk:#3a2210;--ssr-snow:#e8f0f8;--ssr-ice:#a8d8ea;--ssr-alpine:#1a3550;--ssr-deep:#0c1824;--ssr-deep2:#0f1f30;--ssr-meat:#c0392b;--ssr-meat-lt:#e74c3c;--ssr-sausage:#d4874a;--ssr-shock:#ffe44d;--ssr-shock-hot:#ffcc00;--ssr-spark:#fff700;--ssr-neon-pink:#ff2d7b;--ssr-neon-cyan:#00e5ff;--ssr-neon-green:#39ff14;--ssr-gold:#fbbf24;--ssr-red:#ef4444;--ssr-blue:#3b82f6;--ssr-green:#22c55e;--ssr-purple:#a855f7;--ssr-danger:#ff3b3b;--ssr-pad-bg:#2a1a3d;--ssr-pad-arrow:#7c3aed;}
.ssr-broadcast{position:sticky;top:0;left:0;right:0;z-index:50;height:38px;background:linear-gradient(90deg,rgba(12,24,36,.97),rgba(42,26,61,.97));border-bottom:2px solid var(--ssr-shock);display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:12px;}
.ssr-live{display:flex;align-items:center;gap:6px;color:var(--ssr-danger);text-transform:uppercase;letter-spacing:2px;font-size:10px;font-weight:700;}
.ssr-live-dot{width:8px;height:8px;background:var(--ssr-danger);border-radius:50%;animation:ssr-blink 1s infinite;}
@keyframes ssr-blink{0%,100%{opacity:1}50%{opacity:.2}}
.ssr-ticker{flex:1;overflow:hidden;margin:0 24px;height:20px;position:relative;}
.ssr-ticker-inner{position:absolute;white-space:nowrap;animation:ssr-scroll 30s linear infinite;font-size:11px;color:var(--ssr-shock);letter-spacing:1px;}
@keyframes ssr-scroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.ssr-channel{font-family:'Bungee Shade',cursive;color:var(--ssr-neon-cyan);font-size:13px;letter-spacing:2px;}
.ssr-alps{position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;pointer-events:none;overflow:hidden;}
.ssr-mtn{position:absolute;bottom:0;}
.ssr-mtn.m1{left:-8%;width:0;height:0;border-style:solid;border-width:0 240px 380px 200px;border-color:transparent transparent rgba(26,53,80,.6) transparent;}
.ssr-mtn.m2{left:15%;width:0;height:0;border-style:solid;border-width:0 180px 300px 160px;border-color:transparent transparent rgba(20,40,65,.5) transparent;}
.ssr-mtn.m3{left:38%;width:0;height:0;border-style:solid;border-width:0 260px 420px 220px;border-color:transparent transparent rgba(30,55,85,.65) transparent;}
.ssr-mtn.m4{left:62%;width:0;height:0;border-style:solid;border-width:0 200px 340px 180px;border-color:transparent transparent rgba(22,45,70,.55) transparent;}
.ssr-mtn.m5{left:82%;width:0;height:0;border-style:solid;border-width:0 160px 280px 140px;border-color:transparent transparent rgba(25,48,75,.5) transparent;}
.ssr-cap{position:absolute;bottom:0;}
.ssr-cap.c1{left:calc(-8% + 120px);bottom:280px;width:0;height:0;border-style:solid;border-width:0 100px 100px 80px;border-color:transparent transparent rgba(232,240,248,.08) transparent;}
.ssr-cap.c3{left:calc(38% + 100px);bottom:320px;width:0;height:0;border-style:solid;border-width:0 130px 100px 110px;border-color:transparent transparent rgba(232,240,248,.1) transparent;}
.ssr-snow-wrap{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;overflow:hidden;}
.ssr-sf{position:absolute;background:white;border-radius:50%;animation:ssr-fall linear infinite;}
@keyframes ssr-fall{0%{transform:translateY(-20px) translateX(0);opacity:0;}5%{opacity:.6;}50%{transform:translateY(50vh) translateX(40px);}100%{transform:translateY(105vh) translateX(15px);opacity:0;}}
.ssr-sparks{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;}
.ssr-spark-p{position:absolute;width:3px;height:3px;background:var(--ssr-shock);border-radius:50%;box-shadow:0 0 6px var(--ssr-shock),0 0 12px var(--ssr-shock-hot);animation:ssr-zap 2s ease-out infinite;}
@keyframes ssr-zap{0%{opacity:0;transform:scale(0);}10%{opacity:1;transform:scale(1.5);}20%{opacity:0;transform:scale(0);}100%{opacity:0;}}
.ssr-float-arrows{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;overflow:hidden;}
.ssr-farrow{position:absolute;font-size:24px;color:rgba(124,58,237,.08);animation:ssr-arrowfloat linear infinite;}
@keyframes ssr-arrowfloat{0%{transform:translateY(110vh) rotate(0deg);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translateY(-10vh) rotate(360deg);opacity:0;}}
.ssr-meatsplat{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;overflow:hidden;}
.ssr-meatp{position:absolute;border-radius:50%;animation:ssr-splat 4s ease-out infinite;}
@keyframes ssr-splat{0%{transform:translateY(0) scale(.5);opacity:0;}5%{opacity:.4;}30%{transform:translateY(-60px) translateX(30px) scale(1.2);opacity:.3;}100%{transform:translateY(100px) scale(.3);opacity:0;}}
.ssr-fog{position:absolute;bottom:0;left:0;right:0;height:200px;z-index:1;pointer-events:none;background:linear-gradient(to top,rgba(12,24,36,.95),transparent);}
.ssr-shell{max-width:1100px;margin:16px auto 80px;display:grid;grid-template-columns:1fr 280px;gap:16px;padding:0 16px;position:relative;z-index:2;}
.ssr-main{min-width:0;}
.ssr-title-card{text-align:center;padding:50px 20px 40px;position:relative;overflow:hidden;border-radius:16px;border:3px solid var(--ssr-shock);background:linear-gradient(135deg,var(--ssr-pad-bg),var(--ssr-deep));margin-bottom:20px;}
.ssr-title-card::before{content:'';position:absolute;bottom:0;left:0;right:0;height:35%;background:repeating-linear-gradient(90deg,transparent 0px,transparent 48px,rgba(124,58,237,.1) 48px,rgba(124,58,237,.1) 50px),repeating-linear-gradient(180deg,transparent 0px,transparent 24px,rgba(124,58,237,.07) 24px,rgba(124,58,237,.07) 26px);transform:perspective(400px) rotateX(50deg);transform-origin:bottom;pointer-events:none;}
.ssr-title-card::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(255,228,77,.02) 3px,rgba(255,228,77,.02) 6px);pointer-events:none;z-index:1;}
.ssr-title-main{font-family:'Bungee Shade',cursive;font-size:42px;color:var(--ssr-shock);text-shadow:0 0 20px rgba(255,228,77,.4),0 0 60px rgba(255,228,77,.15),3px 3px 0 var(--ssr-pad-bg);letter-spacing:3px;line-height:1.1;position:relative;z-index:2;animation:ssr-glow 3s ease-in-out infinite alternate;}
@keyframes ssr-glow{0%{text-shadow:0 0 20px rgba(255,228,77,.4),0 0 60px rgba(255,228,77,.15),3px 3px 0 var(--ssr-pad-bg);}100%{text-shadow:0 0 30px rgba(255,228,77,.6),0 0 80px rgba(255,228,77,.25),3px 3px 0 var(--ssr-pad-bg);}}
.ssr-title-sub{font-family:'Oswald',sans-serif;font-size:14px;color:rgba(232,240,248,.5);letter-spacing:4px;text-transform:uppercase;margin-top:12px;position:relative;z-index:2;}
.ssr-title-ep{font-family:'Press Start 2P',monospace;font-size:10px;color:var(--ssr-neon-cyan);margin-top:8px;letter-spacing:2px;position:relative;z-index:2;}
.ssr-arrows{display:flex;justify-content:center;gap:16px;margin-top:20px;position:relative;z-index:2;}
.ssr-arrow{width:36px;height:36px;border:2px solid var(--ssr-pad-arrow);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--ssr-pad-arrow);font-size:20px;background:rgba(124,58,237,.1);animation:ssr-apulse 1.5s ease-in-out infinite;}
.ssr-arrow:nth-child(1){animation-delay:0s;}.ssr-arrow:nth-child(2){animation-delay:.15s;}.ssr-arrow:nth-child(3){animation-delay:.3s;}.ssr-arrow:nth-child(4){animation-delay:.45s;}
@keyframes ssr-apulse{0%,100%{opacity:.5;transform:scale(1);}50%{opacity:1;transform:scale(1.08);box-shadow:0 0 12px rgba(124,58,237,.4);}}
.ssr-card{background:linear-gradient(135deg,rgba(92,58,30,.08),rgba(168,216,234,.03));border:1px solid rgba(168,216,234,.10);border-radius:10px;padding:18px 22px;margin:14px 0;position:relative;overflow:hidden;animation:ssr-slide .6s cubic-bezier(.16,1,.3,1) forwards;}
.ssr-card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 10%,rgba(255,228,77,.25) 50%,transparent 90%);}
@keyframes ssr-slide{from{transform:translateX(-20px);opacity:0;filter:blur(2px);}to{transform:none;opacity:1;filter:none;}}
.ssr-card-meat{border-color:rgba(192,57,43,.3)!important;background:linear-gradient(135deg,rgba(192,57,43,.08),rgba(92,58,30,.04))!important;}
.ssr-card-shock{border-color:rgba(255,228,77,.3)!important;background:linear-gradient(135deg,rgba(255,228,77,.06),rgba(42,26,61,.06))!important;}
.ssr-card-social{border-left:3px dashed rgba(168,216,234,.2)!important;background:linear-gradient(135deg,rgba(168,216,234,.04),rgba(42,26,61,.04))!important;}
.ssr-card-ko{border-color:rgba(255,59,59,.4)!important;background:linear-gradient(135deg,rgba(255,59,59,.1),rgba(42,26,61,.06))!important;}
.ssr-card-winner{border-color:rgba(251,191,36,.4)!important;background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(42,26,61,.04))!important;}
.ssr-card-ride{border-color:rgba(0,229,255,.2)!important;background:linear-gradient(135deg,rgba(0,229,255,.04),rgba(12,24,36,.04))!important;}
.ssr-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.ssr-title{font-family:'Russo One',sans-serif;font-size:13px;color:var(--ssr-snow);letter-spacing:1px;}
.ssr-txt{font-size:12.5px;line-height:1.65;color:rgba(232,240,248,.7);}
.ssr-badge{margin-left:auto;padding:3px 10px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:1px;white-space:nowrap;}
.ssr-b-grind{background:rgba(192,57,43,.1);color:var(--ssr-meat-lt);border:1px solid rgba(192,57,43,.25);}
.ssr-b-ride{background:rgba(0,229,255,.08);color:var(--ssr-neon-cyan);border:1px solid rgba(0,229,255,.2);}
.ssr-b-hazard{background:rgba(255,59,59,.08);color:var(--ssr-danger);border:1px solid rgba(255,59,59,.2);}
.ssr-b-social{background:rgba(168,216,234,.06);color:var(--ssr-ice);border:1px solid rgba(168,216,234,.2);}
.ssr-b-fight{background:rgba(124,58,237,.1);color:var(--ssr-purple);border:1px solid rgba(124,58,237,.25);}
.ssr-b-shock{background:rgba(255,228,77,.1);color:var(--ssr-shock);border:1px solid rgba(255,228,77,.25);}
.ssr-b-ko{background:rgba(255,59,59,.1);color:var(--ssr-danger);border:1px solid rgba(255,59,59,.25);}
.ssr-b-win{background:rgba(251,191,36,.1);color:var(--ssr-gold);border:1px solid rgba(251,191,36,.25);}
.ssr-b-hat{background:rgba(212,135,74,.1);color:var(--ssr-sausage);border:1px solid rgba(212,135,74,.25);}
.ssr-b-draft{background:rgba(168,85,247,.1);color:var(--ssr-purple);border:1px solid rgba(168,85,247,.25);}
.ssr-av{width:36px;height:36px;border-radius:50%;border:2px solid var(--ssr-ice);background:var(--ssr-alpine);display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden;}
.ssr-av-lg{width:48px;height:48px;font-size:16px;}
.ssr-av-xl{width:64px;height:64px;font-size:22px;border-width:3px;}
.ssr-av-sm{width:26px;height:26px;font-size:10px;}
.ssr-av-xs{width:20px;height:20px;font-size:8px;}
.ssr-av-shocked{animation:ssr-shiver .12s ease-in-out infinite;filter:brightness(1.3) saturate(1.5);box-shadow:0 0 12px rgba(255,228,77,.6);}
@keyframes ssr-shiver{0%,100%{transform:translateX(0);}25%{transform:translateX(-2px) rotate(-1deg);}75%{transform:translateX(2px) rotate(1deg);}}
.ssr-av-ko{filter:grayscale(.8) brightness(.6);opacity:.5;}
.ssr-i-sausage{width:24px;height:10px;background:linear-gradient(90deg,var(--ssr-sausage),#c27a3f);border-radius:5px;position:relative;box-shadow:0 2px 4px rgba(0,0,0,.3);flex-shrink:0;}
.ssr-i-sausage::before{content:'';position:absolute;top:1px;left:2px;right:2px;height:3px;background:rgba(255,255,255,.15);border-radius:2px;}
.ssr-i-meat{width:22px;height:16px;position:relative;flex-shrink:0;}
.ssr-i-meat::before{content:'';position:absolute;bottom:0;left:0;width:22px;height:12px;background:var(--ssr-meat);border-radius:40% 40% 30% 30%;box-shadow:0 0 6px rgba(192,57,43,.4);}
.ssr-i-meat::after{content:'';position:absolute;top:0;left:4px;width:14px;height:8px;background:var(--ssr-meat-lt);border-radius:50%;opacity:.7;}
.ssr-i-bolt{width:14px;height:20px;position:relative;flex-shrink:0;}
.ssr-i-bolt::before{content:'';position:absolute;top:0;left:3px;width:10px;height:20px;background:var(--ssr-shock);clip-path:polygon(40% 0,100% 0,30% 45%,70% 45%,0 100%,35% 55%,0 55%);filter:drop-shadow(0 0 4px var(--ssr-shock));}
.ssr-i-mtn{width:22px;height:16px;position:relative;flex-shrink:0;}
.ssr-i-mtn::before{content:'';position:absolute;bottom:0;left:0;width:0;height:0;border-style:solid;border-width:0 11px 16px 11px;border-color:transparent transparent var(--ssr-alpine) transparent;}
.ssr-i-mtn::after{content:'';position:absolute;top:0;left:5px;width:0;height:0;border-style:solid;border-width:0 6px 6px 6px;border-color:transparent transparent rgba(232,240,248,.3) transparent;}
.ssr-i-pad{width:22px;height:22px;background:var(--ssr-pad-bg);border:1.5px solid var(--ssr-pad-arrow);border-radius:3px;position:relative;display:grid;grid-template:1fr 1fr 1fr/1fr 1fr 1fr;gap:1px;padding:2px;flex-shrink:0;}
.ssr-i-pad .arr{width:4px;height:4px;background:var(--ssr-pad-arrow);}
.ssr-i-pad .arr-u{grid-area:1/2;clip-path:polygon(50% 0,100% 100%,0 100%);}
.ssr-i-pad .arr-d{grid-area:3/2;clip-path:polygon(0 0,100% 0,50% 100%);}
.ssr-i-pad .arr-l{grid-area:2/1;clip-path:polygon(100% 0,100% 100%,0 50%);}
.ssr-i-pad .arr-r{grid-area:2/3;clip-path:polygon(0 0,100% 50%,0 100%);}
.ssr-i-pad .ctr{grid-area:2/2;width:4px;height:4px;background:var(--ssr-shock);border-radius:50%;}
.ssr-i-goat{width:20px;height:18px;position:relative;flex-shrink:0;filter:drop-shadow(0 1px 3px rgba(0,0,0,.3));}
.ssr-i-goat::before{content:'';position:absolute;bottom:0;left:3px;width:14px;height:12px;background:#d1d5db;border-radius:40%;}
.ssr-i-goat::after{content:'';position:absolute;top:0;left:6px;width:4px;height:6px;background:#e5e7eb;border-radius:30%;transform:rotate(-15deg);}
.ssr-hp{display:flex;align-items:center;gap:8px;margin:6px 0;}
.ssr-hp-track{flex:1;height:8px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden;}
.ssr-hp-fill{height:100%;border-radius:4px;transition:width .8s cubic-bezier(.34,1.56,.64,1);}
.ssr-hp-fill.full{background:linear-gradient(90deg,#22c55e,#4ade80);box-shadow:0 0 6px rgba(34,197,94,.3);}
.ssr-hp-fill.mid{background:linear-gradient(90deg,#f59e0b,#fbbf24);box-shadow:0 0 6px rgba(245,158,11,.3);}
.ssr-hp-fill.low{background:linear-gradient(90deg,#ef4444,#f87171);box-shadow:0 0 6px rgba(239,68,68,.4);animation:ssr-hpulse 1s ease-in-out infinite;}
@keyframes ssr-hpulse{0%,100%{opacity:1;}50%{opacity:.6;}}
.ssr-hp-val{font-size:11px;font-weight:700;min-width:30px;text-align:right;font-family:'Russo One',sans-serif;}
.ssr-hp-label{font-size:9px;color:rgba(232,240,248,.4);min-width:18px;letter-spacing:1px;}
.ssr-dm{display:flex;align-items:center;gap:8px;margin:4px 0;}
.ssr-dm-track{flex:1;height:6px;background:rgba(255,255,255,.04);border-radius:3px;overflow:hidden;}
.ssr-dm-fill{height:100%;border-radius:3px;transition:width .6s ease;}
.ssr-dm-fill.good{background:linear-gradient(90deg,var(--ssr-pad-arrow),#a78bfa);box-shadow:0 0 8px rgba(124,58,237,.3);}
.ssr-dm-fill.danger{background:linear-gradient(90deg,#f97316,#ef4444);box-shadow:0 0 8px rgba(249,115,22,.3);animation:ssr-dmpulse .8s ease-in-out infinite;}
@keyframes ssr-dmpulse{0%,100%{opacity:1;}50%{opacity:.7;}}
.ssr-dm-label{font-size:8px;color:rgba(232,240,248,.35);min-width:40px;letter-spacing:.5px;}
.ssr-dm-val{font-size:10px;font-weight:600;min-width:28px;text-align:right;color:var(--ssr-pad-arrow);}
.ssr-grind{display:flex;align-items:center;gap:8px;margin:8px 0;width:100%;}
.ssr-grind-track{flex:1;height:10px;background:rgba(192,57,43,.06);border-radius:5px;overflow:hidden;border:1px solid rgba(192,57,43,.1);min-width:0;}
.ssr-grind-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--ssr-meat),var(--ssr-sausage));box-shadow:0 0 8px rgba(192,57,43,.3);transition:width 1s ease;position:relative;}
.ssr-grind-label{font-size:10px;color:var(--ssr-sausage);font-weight:700;min-width:40px;}
.ssr-vs{display:flex;align-items:center;justify-content:center;gap:16px;padding:24px;background:linear-gradient(135deg,rgba(42,26,61,.3),rgba(12,24,36,.3));border:2px solid var(--ssr-pad-arrow);border-radius:12px;margin:16px 0;position:relative;overflow:hidden;}
.ssr-vs::before{content:'VS';position:absolute;font-family:'Bungee Shade',cursive;font-size:48px;color:rgba(124,58,237,.06);letter-spacing:8px;z-index:0;}
.ssr-vs-fighter{display:flex;flex-direction:column;align-items:center;gap:6px;z-index:1;min-width:110px;}
.ssr-vs-name{font-family:'Russo One',sans-serif;font-size:14px;letter-spacing:1px;}
.ssr-vs-hat{font-size:9px;color:var(--ssr-sausage);letter-spacing:1px;text-transform:uppercase;}
.ssr-vs-tribe{font-size:9px;letter-spacing:1px;text-transform:uppercase;}
.ssr-vs-tag{font-family:'Bungee Shade',cursive;font-size:32px;color:var(--ssr-shock);z-index:1;text-shadow:0 0 20px rgba(255,228,77,.4);animation:ssr-vspulse 2s ease-in-out infinite;}
@keyframes ssr-vspulse{0%,100%{transform:scale(1);}50%{transform:scale(1.1);text-shadow:0 0 30px rgba(255,228,77,.6);}}
.ssr-exchange{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;padding:14px;background:rgba(42,26,61,.12);border:1px solid rgba(124,58,237,.12);border-radius:8px;margin:8px 0;}
.ssr-ex-player{display:flex;align-items:center;gap:8px;}
.ssr-ex-player.right{flex-direction:row-reverse;text-align:right;}
.ssr-ex-move{text-align:center;}
.ssr-ex-dmg{font-family:'Russo One',sans-serif;font-size:14px;font-weight:700;}
.ssr-ex-dmg.red{color:var(--ssr-danger);}
.ssr-ex-dmg.yellow{color:var(--ssr-shock);}
.ssr-ko{text-align:center;padding:30px;background:linear-gradient(135deg,rgba(255,59,59,.08),rgba(42,26,61,.1));border:2px solid rgba(255,59,59,.3);border-radius:12px;margin:16px 0;position:relative;overflow:hidden;}
.ssr-ko::before{content:'';position:absolute;top:50%;left:50%;width:200px;height:200px;background:radial-gradient(circle,rgba(255,59,59,.15),transparent 70%);transform:translate(-50%,-50%);animation:ssr-kopulse 2s ease-in-out infinite;}
@keyframes ssr-kopulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.5;}50%{transform:translate(-50%,-50%) scale(1.3);opacity:1;}}
.ssr-ko-text{font-family:'Bungee Shade',cursive;font-size:36px;color:var(--ssr-danger);text-shadow:0 0 20px rgba(255,59,59,.5);position:relative;z-index:1;}
.ssr-ko-sub{font-size:13px;color:rgba(232,240,248,.6);margin-top:8px;position:relative;z-index:1;}
.ssr-flavor{font-size:10px;color:rgba(232,240,248,.25);letter-spacing:1px;padding:8px 16px;text-align:center;font-family:'Special Elite',cursive;font-style:italic;border-left:2px solid rgba(255,228,77,.08);margin:8px 0;}
.ssr-flavor.host{border-left-color:rgba(255,228,77,.2);color:rgba(255,228,77,.4);}
.ssr-flavor.crowd{border-left-color:rgba(124,58,237,.2);color:rgba(168,130,255,.35);}
.ssr-sidebar{position:sticky;top:60px;align-self:start;}
.ssr-side-box{background:linear-gradient(135deg,rgba(42,26,61,.12),rgba(12,24,36,.2));border:1px solid rgba(124,58,237,.15);border-radius:10px;padding:14px;margin-bottom:12px;}
.ssr-side-title{font-family:'Russo One',sans-serif;font-size:10px;letter-spacing:2px;color:var(--ssr-shock);text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,228,77,.1);}
.ssr-side-tribe{display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);}
.ssr-side-tribe:last-child{border-bottom:none;}
.ssr-side-tribe-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.ssr-side-tribe-name{font-size:10px;font-weight:600;flex:1;}
.ssr-side-tribe-stat{font-size:9px;color:rgba(232,240,248,.5);}
.ssr-side-tribe-tag{font-size:8px;padding:2px 6px;border-radius:8px;letter-spacing:1px;font-weight:700;}
.ssr-side-fighter{display:flex;align-items:center;gap:5px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.03);}
.ssr-side-fighter:last-child{border-bottom:none;}
.ssr-side-f-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.ssr-side-f-dot.alive{background:var(--ssr-green);}
.ssr-side-f-dot.ko{background:var(--ssr-danger);opacity:.5;}
.ssr-mini-match{display:flex;flex-direction:column;border:1px solid rgba(124,58,237,.15);border-radius:4px;overflow:hidden;width:100%;margin:3px 0;font-size:9px;}
.ssr-mini-slot{display:flex;align-items:center;gap:4px;padding:3px 6px;border-bottom:1px solid rgba(124,58,237,.08);}
.ssr-mini-slot:last-child{border-bottom:none;}
.ssr-mini-slot.winner{background:rgba(251,191,36,.06);}
.ssr-mini-slot.loser{opacity:.35;}
.ssr-mini-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:6px;font-weight:700;color:#fff;}
.ssr-mini-name{flex:1;font-weight:600;}
.ssr-mini-result{font-family:'Russo One',sans-serif;font-size:8px;}
.ssr-bracket{display:flex;flex-direction:column;gap:8px;padding:8px 0;}
.ssr-bracket-match{border:1px solid rgba(124,58,237,.15);border-radius:6px;overflow:hidden;background:rgba(42,26,61,.08);}
.ssr-bracket-match.rivalry{border-color:rgba(239,68,68,.25);background:rgba(239,68,68,.04);}
.ssr-bracket-label{font-size:7px;color:rgba(232,240,248,.3);letter-spacing:1px;padding:4px 8px 2px;text-transform:uppercase;}
.ssr-bracket-slot{display:flex;align-items:center;gap:5px;padding:5px 8px;transition:opacity .3s;}
.ssr-bracket-slot.winner{background:rgba(251,191,36,.06);}
.ssr-bracket-slot.loser{opacity:.35;}
.ssr-bracket-dot{width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff;flex-shrink:0;}
.ssr-bracket-name{font-size:10px;font-weight:600;flex:1;}
.ssr-bracket-tribe{font-size:7px;letter-spacing:.5px;}
.ssr-bracket-result{font-family:'Russo One',sans-serif;font-size:9px;min-width:18px;text-align:right;}
.ssr-bracket-vs{text-align:center;font-family:'Russo One',sans-serif;font-size:8px;color:var(--ssr-shock);padding:1px 0;letter-spacing:2px;opacity:.5;}
.ssr-bracket-score{padding:8px;border-top:1px solid rgba(124,58,237,.1);margin-top:4px;}
.ssr-hat-ceremony{display:flex;justify-content:center;gap:20px;padding:16px;flex-wrap:wrap;}
.ssr-hat-group{text-align:center;padding:14px;background:rgba(92,58,30,.08);border:1px solid rgba(212,135,74,.15);border-radius:10px;min-width:130px;flex:1;}
.ssr-hat-place{font-family:'Russo One',sans-serif;font-size:10px;color:var(--ssr-sausage);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
.ssr-hat-bonus{font-size:10px;color:var(--ssr-gold);margin-top:4px;font-weight:700;}
.ssr-speed{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:1px;}
.ssr-speed.fast{background:rgba(0,229,255,.1);color:var(--ssr-neon-cyan);border:1px solid rgba(0,229,255,.2);}
.ssr-speed.mid{background:rgba(251,191,36,.1);color:var(--ssr-gold);border:1px solid rgba(251,191,36,.2);}
.ssr-speed.slow{background:rgba(239,68,68,.1);color:var(--ssr-danger);border:1px solid rgba(239,68,68,.2);}
.ssr-controls{position:sticky;bottom:0;z-index:50;background:linear-gradient(0deg,rgba(12,24,36,.97),rgba(12,24,36,.9));border-top:1px solid rgba(255,228,77,.15);padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:16px;backdrop-filter:blur(10px);}
.ssr-btn{padding:8px 20px;border:1px solid var(--ssr-pad-arrow);border-radius:4px;background:rgba(124,58,237,.1);color:var(--ssr-snow);font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:1px;cursor:pointer;text-transform:uppercase;transition:all .2s;}
.ssr-btn:hover{background:var(--ssr-pad-arrow);color:#fff;box-shadow:0 0 12px rgba(124,58,237,.3);}
.ssr-counter{font-family:'Press Start 2P',monospace;font-size:10px;color:var(--ssr-shock);letter-spacing:1px;}
.ssr-step{transition:opacity .4s ease,transform .4s ease;}
.ssr-step-hidden{opacity:0;height:0;overflow:hidden;margin:0;padding:0;border:none;pointer-events:none;}
.ssr-visible{opacity:1;height:auto;overflow:visible;margin:14px 0;padding:18px 22px;pointer-events:auto;}
.ssr-visible.ssr-exchange{padding:14px;}
.ssr-visible.ssr-ko{padding:30px;}
.ssr-visible.ssr-vs{padding:24px;margin:16px 0;}
.ssr-visible.ssr-flavor{padding:8px 16px;margin:8px 0;height:auto;}
.ssr-visible.ssr-hat-ceremony{padding:16px;}
@keyframes ssr-shake{0%{transform:translate(0,0);}10%{transform:translate(-4px,2px);}20%{transform:translate(3px,-2px);}30%{transform:translate(-2px,1px);}40%{transform:translate(2px,-1px);}50%{transform:translate(0,0);}}
@media(max-width:900px){.ssr-shell{grid-template-columns:1fr;}.ssr-sidebar{position:static;}}
@media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;}}
</style>
<div class="ssr-wrap" style="position:relative;min-height:100vh;">
<div class="ssr-broadcast">
  <div class="ssr-live"><div class="ssr-live-dot"></div> LIVE</div>
  <div class="ssr-ticker"><div class="ssr-ticker-inner">${_tickerText(ep)}</div></div>
  <div class="ssr-channel">SSR-TV</div>
</div>
<div class="ssr-alps"><div class="ssr-mtn m1"></div><div class="ssr-mtn m2"></div><div class="ssr-mtn m3"></div><div class="ssr-mtn m4"></div><div class="ssr-mtn m5"></div><div class="ssr-cap c1"></div><div class="ssr-cap c3"></div></div>
<div class="ssr-snow-wrap">${_genSnow(40)}</div>
<div class="ssr-sparks">${_genSparks(10)}</div>
<div class="ssr-float-arrows">${_genArrows(15)}</div>
<div class="ssr-meatsplat">${_genMeat(10)}</div>
<div class="ssr-fog"></div>
<div class="ssr-shell ${phaseCls || ''}">
  <div class="ssr-main">${content}</div>
  <div class="ssr-sidebar" id="ssr-sidebar-inner">${_buildSidebarContent(ep, phaseCls)}</div>
</div>
</div>`;
}

// ══════════════════════════════════════════════════════════════
// SIDEBAR — builds content per phase, gated by _tvState
// ══════════════════════════════════════════════════════════════

function _buildSidebarContent(ep, phase) {
  const d = ep.slapRevolution;
  if (!d) return '';
  const tribes = d.grindPhase?.tribes || [];

  // Determine which phase based on screenKey or phase class
  const phaseKey = typeof phase === 'string' ? phase.replace('ssr-', '') : '';

  if (phaseKey === 'grind' || phaseKey === 'phase-grind') {
    return _sidebarGrind(d, tribes);
  } else if (phaseKey === 'descent' || phaseKey === 'phase-descent') {
    return _sidebarDescent(d, tribes);
  } else if (phaseKey === 'hats' || phaseKey === 'phase-hats') {
    return _sidebarHats(d, tribes);
  } else if (phaseKey === 'draft' || phaseKey === 'phase-draft') {
    return _sidebarDraft(d, tribes);
  } else if (phaseKey === 'fights' || phaseKey === 'phase-fights') {
    return _sidebarFights(d, tribes, 'ssr-fights');
  } else if (phaseKey === 'finals' || phaseKey === 'phase-finals') {
    return _sidebarFights(d, tribes, 'ssr-finals');
  } else if (phaseKey === 'results' || phaseKey === 'phase-results') {
    return _sidebarResults(d, tribes);
  }
  // Default: title sidebar
  return _sidebarTitle(d, tribes);
}

function _sidebarTitle(d, tribes) {
  let h = `<div class="ssr-side-box"><div class="ssr-side-title">CHALLENGE INFO</div>
    <div style="font-size:10px;color:rgba(232,240,248,.5);line-height:1.6;">
      <strong style="color:var(--ssr-shock);">Phase 1:</strong> Grind meat, build sausage, bobsled down the mountain<br>
      <strong style="color:var(--ssr-shock);">Phase 2:</strong> 1v1 slap-dance fights on electrified platforms<br>
      <strong style="color:var(--ssr-shock);">Loser:</strong> First tribe fully eliminated from bracket &rarr; tribal council
    </div></div>`;
  h += `<div class="ssr-side-box"><div class="ssr-side-title">TRIBES</div>`;
  tribes.forEach(t => {
    const tc = tribeColor(t.tribeName) || '#a8d8ea';
    h += `<div class="ssr-side-tribe"><div class="ssr-side-tribe-dot" style="background:${tc}"></div><span class="ssr-side-tribe-name">${t.tribeName}</span><span class="ssr-side-tribe-stat">${t.members.length} members</span></div>`;
  });
  h += `</div>`;
  return h;
}

function _sidebarGrind(d, tribes) {
  const stKey = 'ssr-grind';
  const st = _tvState[stKey];
  const idx = st ? st.idx : -1;
  const stepMeta = window._ssrGrindStepMeta || [];

  // Progressive accumulation: track revealed contributions per tribe
  const tribeContribs = {}; // tribeName → { total, count, totalRoles, players[], resultRevealed }
  tribes.forEach(t => {
    const totalRoles = t.roles?.length || 1;
    tribeContribs[t.tribeName] = { total: 0, count: 0, totalRoles, players: [], resultRevealed: false };
  });

  for (let i = 0; i <= idx && i < stepMeta.length; i++) {
    const sm = stepMeta[i];
    if (sm?.type === 'contribution' && sm.tribe && tribeContribs[sm.tribe]) {
      tribeContribs[sm.tribe].total += sm.contribution;
      tribeContribs[sm.tribe].count++;
      tribeContribs[sm.tribe].players.push({ name: sm.player, contribution: sm.contribution });
    }
    if (sm?.type === 'result' && sm.tribe && tribeContribs[sm.tribe]) {
      tribeContribs[sm.tribe].resultRevealed = true;
    }
  }

  let h = `<div class="ssr-side-box"><div class="ssr-side-title">SAUSAGE PROGRESS</div>`;
  tribes.forEach(t => {
    const tc = tribeColor(t.tribeName) || '#a8d8ea';
    const tc2 = tribeContribs[t.tribeName];
    const allRevealed = tc2.count >= tc2.totalRoles;

    // Progressive quality: proportional to revealed contributions
    let displayQuality = 0;
    let qualLabel = '---';
    let qualCol = '';
    let descText = '';

    if (tc2.count > 0) {
      // Scale quality proportionally to how many roles are revealed
      displayQuality = Math.round(t.sausageQuality * (tc2.count / tc2.totalRoles));
      if (tc2.resultRevealed) {
        displayQuality = t.sausageQuality;
        qualLabel = t.sausageQuality >= 70 ? 'EXCELLENT' : t.sausageQuality >= 45 ? 'DECENT' : 'POOR';
        qualCol = t.sausageQuality >= 70 ? 'green' : t.sausageQuality >= 45 ? 'gold' : 'danger';
        const speedMod = Math.round((t.sausageQuality - 50) * 0.3);
        descText = t.sausageQuality >= 70
          ? `Dense, aerodynamic. +${speedMod}% speed bonus`
          : t.sausageQuality >= 45
            ? `Decent build. ${speedMod >= 0 ? '+' : ''}${speedMod}% speed`
            : `Misshapen, lumpy. ${speedMod}% speed penalty`;
      } else {
        qualLabel = `${tc2.count}/${tc2.totalRoles}`;
        qualCol = 'ice';
      }
    }

    h += `<div style="margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><div class="ssr-side-tribe-dot" style="background:${tc}"></div><span style="font-size:10px;flex:1;">${t.tribeName}</span>${tc2.count > 0 ? `<span style="font-size:9px;color:var(--ssr-${qualCol});">${qualLabel}</span>` : '<span style="font-size:9px;color:rgba(232,240,248,.3);">---</span>'}</div>
      <div class="ssr-grind" style="margin:2px 0;"><div class="ssr-grind-track" style="height:6px;"><div class="ssr-grind-fill" style="width:${displayQuality}%"></div></div></div>
      ${descText ? `<div style="font-size:8px;color:rgba(232,240,248,.35);">${descText}</div>` : ''}
    </div>`;
  });
  h += `</div>`;

  // Top contributors (only revealed players)
  const allContribs = [];
  tribes.forEach(t => {
    const tc = tribeColor(t.tribeName) || '#a8d8ea';
    (tribeContribs[t.tribeName]?.players || []).forEach(p => {
      allContribs.push({ name: p.name, contribution: p.contribution, tc });
    });
  });
  if (allContribs.length > 0) {
    allContribs.sort((a, b) => b.contribution - a.contribution);
    h += `<div class="ssr-side-box"><div class="ssr-side-title">TOP CONTRIBUTORS</div><div style="font-size:9px;line-height:1.8;color:rgba(232,240,248,.5);">`;
    allContribs.slice(0, 6).forEach(c => {
      const col = c.contribution >= 20 ? 'green' : c.contribution >= 12 ? 'gold' : 'danger';
      h += `<span style="color:${c.tc};">&#9679;</span> ${c.name} &mdash; <span style="color:var(--ssr-${col});">${c.contribution.toFixed(0)}pts</span><br>`;
    });
    h += `</div></div>`;
  }
  return h;
}

function _sidebarDescent(d, tribes) {
  const stKey = 'ssr-descent';
  const st = _tvState[stKey];
  const idx = st ? st.idx : -1;
  const stepMeta = window._ssrDescentStepMeta || [];

  // Accumulate times from revealed steps + track per-tribe segment progress
  const tribeTimes = {};
  const tribeSegs = {}; // tribeName → highest segment revealed
  tribes.forEach(t => { tribeTimes[t.tribeName] = 0; tribeSegs[t.tribeName] = 0; });
  const incidents = [];
  let segRevealed = 0;

  for (let i = 0; i <= idx && i < stepMeta.length; i++) {
    const sm = stepMeta[i];
    if (!sm) continue;
    if (sm.type === 'tribe-action') {
      tribeTimes[sm.tribe] = (tribeTimes[sm.tribe] || 0) + (sm.timeDelta || 0);
      if (sm.segNum > segRevealed) segRevealed = sm.segNum;
      if (sm.segNum > (tribeSegs[sm.tribe] || 0)) tribeSegs[sm.tribe] = sm.segNum;
    }
    if (sm.type === 'hazard' || sm.type === 'social') {
      if (sm.incident) incidents.push(sm.incident);
    }
  }

  // ── MOUNTAIN RACE MAP ──
  const totalSegs = 6;
  let h = `<div class="ssr-side-box"><div class="ssr-side-title">MOUNTAIN MAP</div>
    <div style="position:relative;height:220px;margin:8px 0;">`;

  // Vertical track line
  h += `<div style="position:absolute;left:16px;top:8px;bottom:8px;width:3px;background:linear-gradient(to bottom,rgba(232,240,248,.15),rgba(232,240,248,.05));border-radius:2px;"></div>`;

  // Segment waypoints
  DESCENT_SEGMENT_NAMES.forEach((name, i) => {
    const segNum = i + 1;
    const yPct = (i / (totalSegs - 1)) * 100;
    const isHazard = segNum === 3 || segNum === 4;
    const isPast = segNum <= segRevealed;
    const isCurrent = segNum === segRevealed;
    const isFinish = segNum === 6;
    const dotColor = isPast
      ? (isHazard ? 'var(--ssr-danger)' : isFinish ? 'var(--ssr-gold)' : 'var(--ssr-neon-cyan)')
      : 'rgba(232,240,248,.15)';
    const dotSize = isCurrent ? 10 : 7;
    const glow = isCurrent ? `box-shadow:0 0 8px ${dotColor};` : '';

    h += `<div style="position:absolute;top:${yPct}%;left:8px;display:flex;align-items:center;gap:8px;transform:translateY(-50%);">
      <div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${dotColor};border:1px solid rgba(232,240,248,.1);flex-shrink:0;${glow}"></div>
      <span style="font-size:7px;color:${isPast ? 'rgba(232,240,248,.5)' : 'rgba(232,240,248,.15)'};letter-spacing:.5px;white-space:nowrap;">${segNum}${isHazard ? ' &#9888;' : isFinish ? ' &#9733;' : ''} ${name}</span>
    </div>`;
  });

  // Tribe position markers on the track
  const sortedTribes = tribes.slice().sort((a, b) => tribeTimes[a.tribeName] - tribeTimes[b.tribeName]);
  sortedTribes.forEach((t, ti) => {
    const tc = tribeColor(t.tribeName) || '#a8d8ea';
    const seg = tribeSegs[t.tribeName] || 0;
    const yPct = seg > 0 ? ((seg - 1) / (totalSegs - 1)) * 100 : 0;
    const xOff = 36 + ti * 42;
    const initial = t.tribeName[0] || '?';
    const placeLabel = ti === 0 && seg > 0 ? '1st' : ti === 1 && seg > 0 ? '2nd' : seg > 0 ? `${ti + 1}th` : '';

    h += `<div style="position:absolute;top:${yPct}%;left:${xOff}px;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:2px;transition:top .6s ease;">
      <div style="width:20px;height:20px;border-radius:50%;background:${tc};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;border:2px solid rgba(255,255,255,.2);box-shadow:0 0 6px ${tc}60;">${initial}</div>
      ${placeLabel ? `<span style="font-size:6px;color:${tc};letter-spacing:.5px;">${placeLabel}</span>` : ''}
    </div>`;
  });

  h += `</div></div>`;

  // Race standings
  const sorted = Object.entries(tribeTimes).sort((a, b) => a[1] - b[1]);
  h += `<div class="ssr-side-box"><div class="ssr-side-title">RACE STANDINGS</div><div style="display:flex;flex-direction:column;gap:8px;">`;
  sorted.forEach(([tn, time], i) => {
    const tc = tribeColor(tn) || '#a8d8ea';
    const placeFont = i === 0 ? '14' : i === 1 ? '12' : '11';
    const placeCol = i === 0 ? 'gold' : i === 1 ? 'ice' : 'sausage';
    const opa = i === 0 ? '1' : i === 1 ? '.7' : '.5';
    h += `<div style="display:flex;align-items:center;gap:6px;opacity:${opa};">
      <span style="font-family:'Bungee Shade',cursive;font-size:${placeFont}px;color:var(--ssr-${placeCol});">${i + 1}</span>
      <div class="ssr-side-tribe-dot" style="background:${tc}"></div>
      <span style="font-size:10px;flex:1;">${tn}</span>
      <span style="font-size:9px;color:var(--ssr-${placeCol});font-family:'Press Start 2P',monospace;">${time.toFixed(1)}s</span></div>`;
  });
  h += `</div></div>`;

  // Segment tracker
  h += `<div class="ssr-side-box"><div class="ssr-side-title">SEGMENT TRACKER</div><div style="font-size:9px;line-height:2;color:rgba(232,240,248,.5);">`;
  DESCENT_SEGMENT_NAMES.forEach((name, i) => {
    const segNum = i + 1;
    const isHazard = segNum === 3 || segNum === 4;
    if (segNum <= segRevealed) {
      const icon = isHazard ? '<span style="color:var(--ssr-danger);">&#9888;</span>' : '<span style="color:var(--ssr-neon-cyan);">&#10003;</span>';
      h += `${icon} ${segNum}. ${name}<br>`;
    } else if (segNum === 6 && segRevealed >= 6) {
      h += `<span style="color:var(--ssr-gold);">&#9733;</span> ${segNum}. ${name}<br>`;
    } else {
      h += `<span style="color:rgba(232,240,248,.2);">&#9675;</span> ${segNum}. ${name}<br>`;
    }
  });
  h += `</div></div>`;

  // Incidents
  if (incidents.length > 0) {
    h += `<div class="ssr-side-box"><div class="ssr-side-title">INCIDENTS</div><div style="font-size:9px;line-height:1.8;color:rgba(232,240,248,.5);">`;
    incidents.forEach(inc => {
      h += `<span style="color:var(--ssr-${inc.positive ? 'green' : 'danger'});">&#9679;</span> ${inc.text}<br>`;
    });
    h += `</div></div>`;
  }
  return h;
}

function _sidebarHats(d) {
  let h = `<div class="ssr-side-box"><div class="ssr-side-title">HAT ASSIGNMENTS</div><div style="font-size:10px;line-height:2;color:rgba(232,240,248,.6);">`;
  (d.hatCeremony?.placements || []).forEach(p => {
    const tc = tribeColor(p.tribeName) || '#a8d8ea';
    const bonusCol = p.hpBonus >= 2 ? 'gold' : p.hpBonus >= 1 ? 'ice' : 'danger';
    h += `<div style="display:flex;align-items:center;gap:6px;"><div class="ssr-side-tribe-dot" style="background:${tc}"></div><span style="flex:1;">${p.tribeName}</span><span style="color:var(--ssr-${bonusCol});font-weight:700;">+${p.hpBonus} HP</span></div>`;
  });
  h += `</div></div>`;
  h += `<div class="ssr-side-box"><div class="ssr-side-title">DRAFT ORDER</div><div style="font-size:10px;line-height:2;color:rgba(232,240,248,.5);">`;
  (d.hatCeremony?.placements || []).forEach((p, i) => {
    h += `${i + 1}. ${p.tribeName}${i === 0 ? ' (picks first)' : i === (d.hatCeremony.placements.length - 1) ? ' (picks last)' : ''}<br>`;
  });
  h += `</div></div>`;
  return h;
}

function _sidebarDraft(d) {
  let h = `<div class="ssr-side-box"><div class="ssr-side-title">CAPTAINS</div><div style="font-size:10px;line-height:2;color:rgba(232,240,248,.6);">`;
  (d.captainDraft?.captains || []).forEach((c, i) => {
    const tc = tribeColor(c.tribeName) || '#a8d8ea';
    const pickLabel = i === 0 ? '1ST PICK' : i === 1 ? '2ND PICK' : '3RD PICK';
    const pickCol = i === 0 ? 'gold' : i === 1 ? 'ice' : 'sausage';
    h += `<div style="display:flex;align-items:center;gap:6px;"><div class="ssr-side-tribe-dot" style="background:${tc}"></div><span>${c.captain}</span><span style="margin-left:auto;font-size:8px;color:var(--ssr-${pickCol});">${pickLabel}</span></div>`;
  });
  h += `</div></div>`;

  // Locked matchups
  const stKey = 'ssr-draft';
  const st = _tvState[stKey];
  const idx = st ? st.idx : -1;
  const stepMeta = window._ssrDraftStepMeta || [];

  const revealedMatchups = [];
  for (let i = 0; i <= idx && i < stepMeta.length; i++) {
    if (stepMeta[i]?.matchup) revealedMatchups.push(stepMeta[i].matchup);
  }

  if (revealedMatchups.length > 0) {
    h += `<div class="ssr-side-box"><div class="ssr-side-title">BRACKET PREVIEW</div>`;
    h += _buildBracket(revealedMatchups, [], new Set());
    h += `</div>`;
  }

  // Benched
  const sitOuts = d.captainDraft?.sitOuts || [];
  if (sitOuts.length > 0) {
    h += `<div class="ssr-side-box"><div class="ssr-side-title">BENCHED</div><div style="font-size:9px;line-height:1.8;color:rgba(232,240,248,.4);">`;
    sitOuts.forEach(so => {
      const tc = tribeColor(so.tribeName) || '#a8d8ea';
      const reaction = so.isRelieved ? '(relieved)' : '<span style="color:var(--ssr-danger);font-size:8px;">(FURIOUS)</span>';
      h += `<span style="color:${tc};">&#9679;</span> ${so.player} ${reaction}<br>`;
    });
    h += `</div></div>`;
  }
  return h;
}

function _sidebarFights(d, tribes, screenKey) {
  const allFights = [];
  (d.tournament?.rounds || []).forEach(r => { allFights.push(...r.fights); });
  const isFinals = screenKey === 'ssr-finals';
  const allMatchups = d.captainDraft?.matchups || [];

  const st = _tvState[screenKey];
  const idx = st ? st.idx : -1;
  const stepMeta = isFinals ? (window._ssrFinalsStepMeta || []) : (window._ssrFightsStepMeta || []);

  // Count fights revealed
  const revealedFightIdxs = new Set();
  for (let i = 0; i <= idx && i < stepMeta.length; i++) {
    if (stepMeta[i]?.fightIdx !== undefined) revealedFightIdxs.add(stepMeta[i].fightIdx);
    if (stepMeta[i]?.isKO) revealedFightIdxs.add(stepMeta[i].fightIdx);
  }

  // In finals mode, pre-finals fights are already revealed
  if (isFinals) {
    for (let fi = 0; fi < allFights.length - 1; fi++) revealedFightIdxs.add(fi);
  }

  // Tournament bracket using shared builder
  let h = `<div class="ssr-side-box"><div class="ssr-side-title">TOURNAMENT BRACKET</div>`;
  h += _buildBracket(allMatchups, allFights, revealedFightIdxs);
  h += `</div>`;

  // Tribe status
  h += `<div class="ssr-side-box"><div class="ssr-side-title">TRIBE STATUS</div>`;
  const tribeKOCount = {};
  const tribeFighterCount = {};
  tribes.forEach(t => { tribeKOCount[t.tribeName] = 0; tribeFighterCount[t.tribeName] = 0; });

  const countedPlayers = {};
  allMatchups.forEach(m => {
    if (!countedPlayers[m.p1]) { countedPlayers[m.p1] = m.tribe1; }
    if (!countedPlayers[m.p2]) { countedPlayers[m.p2] = m.tribe2; }
  });
  Object.entries(countedPlayers).forEach(([, tn]) => { tribeFighterCount[tn] = (tribeFighterCount[tn] || 0) + 1; });

  allFights.forEach((f, fi) => {
    if (revealedFightIdxs.has(fi) && f.loser) {
      const lt = f.loser === f.p1 ? f.tribe1 : f.tribe2;
      tribeKOCount[lt] = (tribeKOCount[lt] || 0) + 1;
    }
  });

  tribes.forEach(t => {
    const tc = tribeColor(t.tribeName) || '#a8d8ea';
    const total = tribeFighterCount[t.tribeName] || 0;
    const kos = tribeKOCount[t.tribeName] || 0;
    const alive = Math.max(0, total - kos);
    const isElim = alive === 0 && total > 0;
    const isAtRisk = kos > 0 && !isElim;
    const tagCol = isElim ? 'danger' : isAtRisk ? 'gold' : 'green';
    const tagText = isElim ? 'TRIBAL' : isAtRisk ? 'AT RISK' : 'SAFE';
    h += `<div class="ssr-side-tribe"${isElim ? ' style="opacity:.4;"' : ''}>
      <div class="ssr-side-tribe-dot" style="background:${tc}"></div>
      <span class="ssr-side-tribe-name">${t.tribeName}</span>
      <span class="ssr-side-tribe-stat"${isElim ? ' style="color:var(--ssr-danger);"' : ''}>${alive}/${total}</span>
      <span class="ssr-side-tribe-tag" style="background:rgba(${isElim ? '255,59,59' : isAtRisk ? '251,191,36' : '34,197,94'},.1);color:var(--ssr-${tagCol});border:1px solid rgba(${isElim ? '255,59,59' : isAtRisk ? '251,191,36' : '34,197,94'},.2);">${tagText}</span>
    </div>`;
  });
  h += `</div>`;
  return h;
}

function _sidebarResults(d, tribes) {
  let h = `<div class="ssr-side-box"><div class="ssr-side-title">FINAL RESULTS</div>`;
  if (d.tournament?.champion) {
    const champTribe = tribes.find(t => t.members.includes(d.tournament.champion))?.tribeName || '';
    const tc = tribeColor(champTribe) || '#a8d8ea';
    h += `<div style="text-align:center;padding:8px 0;">
      <div style="font-family:'Bungee Shade',cursive;font-size:14px;color:var(--ssr-gold);margin-bottom:6px;">CHAMPION</div>
      ${_av(d.tournament.champion, champTribe, 'lg')}
      <div style="font-size:11px;font-weight:700;margin-top:4px;">${d.tournament.champion}</div>
      <div style="font-size:9px;color:${tc};">${champTribe}</div>
    </div>`;
  }
  if (d.tournament?.eliminatedTribe) {
    const tc = tribeColor(d.tournament.eliminatedTribe) || '#a8d8ea';
    h += `<div style="text-align:center;padding:8px 0;border-top:1px solid rgba(255,59,59,.15);">
      <div style="font-size:10px;color:var(--ssr-danger);font-weight:700;letter-spacing:2px;">ELIMINATED</div>
      <div style="font-size:11px;margin-top:4px;color:${tc};">${d.tournament.eliminatedTribe}</div>
      <div style="font-size:9px;color:rgba(232,240,248,.4);margin-top:2px;">TRIBAL COUNCIL</div>
    </div>`;
  }
  h += `</div>`;
  return h;
}

// Real _updateSidebar — replaces sidebar innerHTML based on current phase
function _updateSidebar(screenKey) {
  const sideEl = document.getElementById('ssr-sidebar-inner');
  if (!sideEl) return;
  const ep = gs.episodeHistory?.[window.vpEpNum - 1];
  if (!ep?.slapRevolution) return;
  const phase = screenKey || '';
  sideEl.innerHTML = _buildSidebarContent(ep, phase);
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER: TITLE CARD
// ══════════════════════════════════════════════════════════════

export function rpBuildSSRTitleCard(ep) {
  const d = ep.slapRevolution;
  if (!d) return '';
  const tribes = d.grindPhase?.tribes || [];
  const epNum = gs.episodeHistory?.length || '?';

  let main = `<div class="ssr-title-card">
    <div class="ssr-title-ep">EPISODE ${epNum} &bull; TRIBE CHALLENGE</div>
    <div class="ssr-title-main">SLAP SLAP<br>REVOLUTION</div>
    <div class="ssr-title-sub">Alpine Sausage Derby &amp; Dance-Fight Tournament</div>
    <div class="ssr-arrows">
      <div class="ssr-arrow">&larr;</div><div class="ssr-arrow">&darr;</div><div class="ssr-arrow">&uarr;</div><div class="ssr-arrow">&rarr;</div>
    </div>
  </div>`;

  // Tribe roster cards
  tribes.forEach(t => {
    const tc = tribeColor(t.tribeName) || '#a8d8ea';
    main += `<div class="ssr-card" style="border-left:3px solid ${tc};box-shadow:inset 3px 0 15px -8px ${tc}40;">
      <div class="ssr-hdr">${_icon('sausage')}<span class="ssr-title">${t.tribeName.toUpperCase()}</span><span class="ssr-badge ssr-b-fight">${t.members.length} MEMBERS</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${t.members.map(m => _av(m, t.tribeName, 'sm')).join('')}</div>
    </div>`;
  });

  return _shell(main, ep, 'phase-title');
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER: GRIND PHASE
// ══════════════════════════════════════════════════════════════

export function rpBuildSSRGrind(ep) {
  const d = ep.slapRevolution;
  if (!d) return '';
  const tribes = d.grindPhase?.tribes || [];
  const screenKey = 'ssr-grind';
  const suffix = 'grind';

  const steps = [];
  const stepMeta = []; // for sidebar gating

  // Opening flavor
  steps.push(`<div class="ssr-flavor host">"See those lovely piles of mystery meat? Grind it. Stuff it. Ride it down a mountain. Ready? GO!" &mdash; ${host()}</div>`);
  stepMeta.push({ type: 'flavor' });

  tribes.forEach(t => {
    const tc = tribeColor(t.tribeName) || '#a8d8ea';

    // Role assignment card
    const roleText = t.roles.map(r => `<strong>${r.name}</strong> (${r.role})`).join(', ');
    steps.push(`<div class="ssr-card ssr-card-meat" style="border-left:3px solid ${tc};">
      <div class="ssr-hdr">${_icon('meat')}<span class="ssr-title">${t.tribeName.toUpperCase()} &mdash; GRINDER ASSIGNMENTS</span><span class="ssr-badge ssr-b-grind">ROLES</span></div>
      <div class="ssr-txt">${roleText}</div>
    </div>`);
    stepMeta.push({ type: 'roles', tribe: t.tribeName });

    // Per-player contribution cards
    t.roles.forEach(r => {
      const isGood = r.contribution >= 12;
      const contribCol = r.contribution >= 20 ? 'green' : r.contribution >= 12 ? 'gold' : 'danger';
      const checkLabel = r.contribution >= 20 ? 'CRUSHED' : r.contribution >= 12 ? 'STEADY' : 'SLACKING';
      steps.push(`<div class="ssr-card" style="border-left:3px solid ${tc};">
        <div class="ssr-hdr">${_av(r.name, t.tribeName, 'sm')}<span class="ssr-title">${r.name.toUpperCase()} ${r.role.toUpperCase()}S</span><span class="ssr-badge ssr-b-grind">${r.role.toUpperCase()}</span></div>
        <div class="ssr-txt">${r.text}</div>
        <div style="font-size:10px;margin-top:6px;">Contribution: <strong style="color:var(--ssr-${contribCol});">${r.contribution.toFixed(0)}pts</strong> &nbsp;|&nbsp; Check: <strong style="color:var(--ssr-${contribCol});">${checkLabel}</strong></div>
      </div>`);
      stepMeta.push({ type: 'contribution', tribe: t.tribeName, player: r.name, contribution: r.contribution });
    });

    // Social events for this tribe
    t.events.forEach(ev => {
      let cardClass = 'ssr-card-social';
      let badgeCls = 'ssr-b-social';
      let titleColor = 'var(--ssr-ice)';
      let badgeLabel = ev.type === 'slacker-callout' ? 'TENSION' : ev.type === 'mole-sabotage' ? 'SUSPICIOUS' : 'BOND';

      if (ev.type === 'mole-sabotage') {
        cardClass = 'ssr-card-shock';
        badgeCls = 'ssr-b-shock';
        titleColor = 'var(--ssr-shock)';
      }

      const avHtml = (ev.players || []).map(p => _av(p, t.tribeName, 'sm')).join('');
      const typeLabel = ev.type === 'slacker-callout' ? 'SLACKER CALLOUT' : ev.type === 'mole-sabotage' ? 'MOLE SABOTAGE' : 'TEAM BONDING';

      steps.push(`<div class="ssr-card ${cardClass}">
        <div class="ssr-hdr">${avHtml}${ev.type === 'mole-sabotage' ? _icon('bolt') : ''}<span class="ssr-title" style="color:${titleColor};">${typeLabel}</span><span class="ssr-badge ${badgeCls}">${badgeLabel}</span></div>
        <div class="ssr-txt">${ev.text}</div>
        <div style="font-size:10px;margin-top:6px;color:rgba(232,240,248,.4);">${ev.consequences || ''}</div>
      </div>`);
      stepMeta.push({ type: 'social', tribe: t.tribeName });
    });

    // ── SAUSAGE RESULT CARD ──
    const q = t.sausageQuality;
    const qualLabel = q >= 70 ? 'EXCELLENT' : q >= 45 ? 'DECENT' : 'POOR';
    const qualCol = q >= 70 ? 'green' : q >= 45 ? 'gold' : 'danger';
    const qualBorder = q >= 70 ? 'var(--ssr-green)' : q >= 45 ? 'var(--ssr-gold)' : 'var(--ssr-danger)';
    const reactionPool = q >= 70 ? SAUSAGE_RESULT_EXCELLENT : q >= 45 ? SAUSAGE_RESULT_DECENT : SAUSAGE_RESULT_POOR;
    const speedMod = Math.round((q - 50) * 0.3);
    const speedText = speedMod >= 0 ? `+${speedMod}% speed bonus` : `${speedMod}% speed penalty`;

    // Avatars of all members for the result card
    const memberAvs = t.members.map(m => _av(m, t.tribeName, 'sm')).join('');

    steps.push(`<div class="ssr-card" style="border:2px solid ${qualBorder};background:linear-gradient(135deg,rgba(${q >= 70 ? '34,197,94' : q >= 45 ? '251,191,36' : '239,68,68'},.06),transparent);">
      <div class="ssr-hdr">${_icon('sausage')}<span class="ssr-title" style="color:${qualBorder};">${t.tribeName.toUpperCase()} &mdash; SAUSAGE COMPLETE</span><span class="ssr-badge" style="background:rgba(${q >= 70 ? '34,197,94' : q >= 45 ? '251,191,36' : '239,68,68'},.12);color:${qualBorder};border:1px solid ${qualBorder}40;">${qualLabel}</span></div>
      <div style="display:flex;align-items:center;gap:12px;margin:10px 0;">
        <div style="flex-shrink:0;width:60px;text-align:center;">
          <div style="font-family:'Bungee Shade',cursive;font-size:28px;color:${qualBorder};line-height:1;">${q}</div>
          <div style="font-size:7px;color:rgba(232,240,248,.4);letter-spacing:1px;margin-top:2px;">QUALITY</div>
        </div>
        <div style="flex:1;">
          <div class="ssr-grind" style="margin:4px 0;"><div class="ssr-grind-track" style="height:10px;"><div class="ssr-grind-fill" style="width:${q}%;background:linear-gradient(90deg,${qualBorder}80,${qualBorder});"></div></div></div>
          <div style="font-size:9px;color:rgba(232,240,248,.4);margin-top:4px;">${speedText} on descent</div>
        </div>
      </div>
      <div class="ssr-txt">${pick(reactionPool)(t.tribeName)}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:10px;">${memberAvs}</div>
    </div>`);
    stepMeta.push({ type: 'result', tribe: t.tribeName });
  });

  // Final flavor
  steps.push(`<div class="ssr-flavor crowd">${HOST_FLAVOR[Math.floor(Math.random() * HOST_FLAVOR.length)]()}</div>`);
  stepMeta.push({ type: 'flavor' });

  // Store stepMeta on window for sidebar
  window._ssrGrindStepMeta = stepMeta;

  const totalSteps = steps.length;
  let html = '';
  steps.forEach((s, i) => {
    html += `<div id="ssr-step-${suffix}-${i}" class="ssr-step ssr-step-hidden">${s}</div>`;
  });

  html += `<div id="ssr-controls-${suffix}" class="ssr-controls">
    <button class="ssr-btn" onclick="ssrRevealNext('${screenKey}',${totalSteps})">NEXT &#9654;</button>
    <span class="ssr-counter" id="ssr-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="ssr-btn" onclick="ssrRevealAll('${screenKey}',${totalSteps})" style="margin-left:16px;border-color:var(--ssr-shock);color:var(--ssr-shock);">REVEAL ALL</button>
  </div>`;

  return _shell(html, ep, 'phase-grind');
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER: DESCENT (Bobsled Race)
// ══════════════════════════════════════════════════════════════

export function rpBuildSSRDescent(ep) {
  const d = ep.slapRevolution;
  if (!d) return '';
  const screenKey = 'ssr-descent';
  const suffix = 'descent';
  const segments = d.descentPhase?.segments || [];
  const results = d.descentPhase?.results || [];

  const steps = [];
  const stepMeta = [];

  // Opening flavor
  steps.push(`<div class="ssr-flavor host">"Mount your sausages! First team to the bottom wins FABULOUS headwear. And watch out for the... surprises. GO!" &mdash; ${host()}</div>`);
  stepMeta.push({ type: 'flavor' });

  let flavorIdx = 0;

  segments.forEach((seg, si) => {
    // Hazard card if applicable
    if (seg.hazard) {
      const hazIcon = seg.hazard.type === 'goat' ? _icon('goat') : _icon('mtn');
      steps.push(`<div class="ssr-card ssr-card-ko">
        <div class="ssr-hdr">${hazIcon}<span class="ssr-title">HAZARD &mdash; ${seg.hazard.type === 'goat' ? 'MOUNTAIN GOATS!' : 'AVALANCHE!'}</span><span class="ssr-badge ssr-b-hazard">DANGER</span></div>
        <div class="ssr-txt">${seg.hazard.text}</div>
      </div>`);
      stepMeta.push({ type: 'hazard', incident: { text: seg.hazard.type === 'goat' ? 'Goat attack!' : 'Avalanche!', positive: false } });
    }

    // Per-tribe action cards for this segment
    seg.tribeActions.forEach(ta => {
      const tc = tribeColor(ta.tribeName) || '#a8d8ea';
      const isRide = ta.speedTag === 'fast' || ta.speedTag === 'normal';
      const cardCls = ta.speedTag === 'hazard-hit' ? 'ssr-card-ko' : (isRide ? 'ssr-card-ride' : '');
      const badgeCls = ta.speedTag === 'hazard-hit' ? 'ssr-b-hazard' : 'ssr-b-ride';

      steps.push(`<div class="ssr-card ${cardCls}" style="border-left:3px solid ${tc};">
        <div class="ssr-hdr">${_icon('mtn')}<span class="ssr-title">${ta.tribeName.toUpperCase()} &mdash; ${seg.segName.toUpperCase()}</span><span class="ssr-badge ${badgeCls}">SEG ${seg.segNum}/6</span></div>
        <div class="ssr-txt">${ta.text}</div>
        <div style="display:flex;gap:8px;margin-top:8px;align-items:center;">${_speedTag(ta.speedTag)}<span style="font-size:9px;color:rgba(232,240,248,.4);">Time: ${ta.timeDelta.toFixed(1)}s | Total: ${ta.totalTime.toFixed(1)}s</span></div>
      </div>`);
      stepMeta.push({
        type: 'tribe-action', tribe: ta.tribeName, timeDelta: ta.timeDelta,
        segNum: seg.segNum,
        incident: ta.speedTag === 'hazard-hit' ? { text: `${ta.tribeName} hit &mdash; +${ta.timeDelta.toFixed(1)}s`, positive: false } : null,
      });
    });

    // Social events during this segment
    (seg.socialEvents || []).forEach(ev => {
      const evTypeLabel = ev.type === 'crash-bonding' ? 'CRASH BONDING' : ev.type === 'trash-talk' ? 'TRASH TALK' : 'SAUSAGE SPARK';
      const evBadge = ev.type === 'crash-bonding' ? 'BOND' : ev.type === 'trash-talk' ? 'RIVALRY' : 'SPARK';
      const bondCol = (ev.bondDelta || 0) >= 0 ? 'green' : 'danger';
      const tribe1 = ev.tribe || ev.tribe1 || '';
      const tribe2 = ev.tribe2 || tribe1;
      const avs = [];
      if (ev.p1) avs.push(_av(ev.p1, tribe1, 'sm'));
      if (ev.p2) avs.push(_av(ev.p2, tribe2, 'sm'));

      steps.push(`<div class="ssr-card ssr-card-social">
        <div class="ssr-hdr">${avs.join('')}<span class="ssr-title" style="color:var(--ssr-ice);">${evTypeLabel}</span><span class="ssr-badge ssr-b-social">${evBadge}</span></div>
        <div class="ssr-txt">${ev.text}</div>
        ${ev.bondDelta ? `<div style="font-size:10px;margin-top:6px;color:rgba(232,240,248,.4);">${ev.p1} &harr; ${ev.p2}: bond <span style="color:var(--ssr-${bondCol});">${ev.bondDelta > 0 ? '+' : ''}${ev.bondDelta}</span></div>` : ''}
      </div>`);
      stepMeta.push({
        type: 'social',
        incident: ev.type === 'crash-bonding' ? { text: `${ev.p1} & ${ev.p2} bond`, positive: true } : null,
      });
    });

    // Mid-race flavor every 2 segments
    if (si % 2 === 1 && si < segments.length - 1) {
      flavorIdx++;
      steps.push(`<div class="ssr-flavor host">${HOST_FLAVOR[(flavorIdx + 3) % HOST_FLAVOR.length]()}</div>`);
      stepMeta.push({ type: 'flavor' });
    }
  });

  // Results card
  if (results.length > 0) {
    let resHtml = `<div class="ssr-card ssr-card-winner" style="border:2px solid var(--ssr-gold);">
      <div class="ssr-hdr" style="margin-bottom:4px;"><span class="ssr-title" style="color:var(--ssr-gold);">DESCENT RESULTS</span><span class="ssr-badge ssr-b-win">FINAL</span></div>
      <div style="display:flex;flex-direction:column;gap:8px;">`;
    results.forEach((r, i) => {
      const tc = tribeColor(r.tribeName) || '#a8d8ea';
      const placeCol = i === 0 ? 'gold' : i === 1 ? 'ice' : 'sausage';
      const fontSize = i === 0 ? 20 : i === 1 ? 16 : 14;
      const opa = i === 0 ? 1 : i === 1 ? 0.7 : 0.5;
      resHtml += `<div style="display:flex;align-items:center;gap:10px;opacity:${opa};">
        <span style="font-family:'Bungee Shade',cursive;font-size:${fontSize}px;color:var(--ssr-${placeCol});">${i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}</span>
        <div class="ssr-side-tribe-dot" style="background:${tc}"></div>
        <span class="ssr-title">${r.tribeName}</span>
        <span style="margin-left:auto;font-family:'Press Start 2P',monospace;font-size:9px;color:var(--ssr-${placeCol});">${r.totalTime.toFixed(1)}s</span>
      </div>`;
    });
    resHtml += `</div></div>`;
    steps.push(resHtml);
    stepMeta.push({ type: 'results' });
  }

  window._ssrDescentStepMeta = stepMeta;

  const totalSteps = steps.length;
  let html = '';
  steps.forEach((s, i) => {
    html += `<div id="ssr-step-${suffix}-${i}" class="ssr-step ssr-step-hidden">${s}</div>`;
  });
  html += `<div id="ssr-controls-${suffix}" class="ssr-controls">
    <button class="ssr-btn" onclick="ssrRevealNext('${screenKey}',${totalSteps})">NEXT &#9654;</button>
    <span class="ssr-counter" id="ssr-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="ssr-btn" onclick="ssrRevealAll('${screenKey}',${totalSteps})" style="margin-left:16px;border-color:var(--ssr-shock);color:var(--ssr-shock);">REVEAL ALL</button>
  </div>`;

  return _shell(html, ep, 'phase-descent');
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER: HAT CEREMONY
// ══════════════════════════════════════════════════════════════

export function rpBuildSSRHats(ep) {
  const d = ep.slapRevolution;
  if (!d) return '';
  const screenKey = 'ssr-hats';
  const suffix = 'hats';
  const placements = d.hatCeremony?.placements || [];
  const humiliation = d.hatCeremony?.humiliation;

  const steps = [];

  // Opening flavor
  steps.push(`<div class="ssr-flavor host">"Winners! Step forward for your HATS OF POWER. Losers... someone's wearing lederhosen." &mdash; ${host()}</div>`);

  // Hat ceremony card
  let hatHtml = '<div class="ssr-hat-ceremony">';
  const hatEmojis = { pickelhaube: '&#9935;', ushanka: '&#127913;', tyrolean: '&#129490;' };
  placements.forEach((p, i) => {
    const tc = tribeColor(p.tribeName) || '#a8d8ea';
    const isLast = i === placements.length - 1;
    const borderStyle = i === 0 ? `border-color:rgba(251,191,36,.3);background:rgba(251,191,36,.04);` : (isLast ? `border-color:rgba(239,68,68,.2);background:rgba(239,68,68,.03);` : '');
    const placeCol = i === 0 ? 'var(--ssr-gold)' : (isLast ? 'var(--ssr-danger)' : 'var(--ssr-sausage)');
    hatHtml += `<div class="ssr-hat-group" style="${borderStyle}">
      <div class="ssr-hat-place" style="color:${placeCol};">${['1ST','2ND','3RD','4TH'][i] || `${i+1}TH`} &mdash; ${p.tribeName.toUpperCase()}</div>
      <div style="font-size:28px;margin:8px 0;">${hatEmojis[p.hatType] || '&#129490;'}</div>
      <div style="font-size:11px;color:rgba(232,240,248,.6);">${_hatName(p.hatType)}${p.hatType === 'pickelhaube' ? 'n' : p.hatType === 'ushanka' ? 's' : ' Hats'}</div>
      <div class="ssr-hat-bonus"${isLast ? ' style="color:var(--ssr-danger);"' : ''}>+${p.hpBonus} HP IN FIGHTS${p.hpBonus === 0 ? ' (NONE)' : ''}</div>
      ${i === 0 ? '<div style="font-size:9px;color:rgba(232,240,248,.4);margin-top:4px;">Picks matchups first</div>' : ''}
      ${isLast ? '<div style="font-size:9px;color:rgba(232,240,248,.4);margin-top:4px;">+ Lederhosen of Shame</div>' : ''}
    </div>`;
  });
  hatHtml += '</div>';
  steps.push(hatHtml);

  // Lederhosen humiliation
  if (humiliation) {
    const tc = tribeColor(humiliation.tribeName) || '#a8d8ea';
    steps.push(`<div class="ssr-card ssr-card-social" style="border-color:rgba(212,135,74,.2);">
      <div class="ssr-hdr">${_av(humiliation.player, humiliation.tribeName, 'sm')}<span class="ssr-title" style="color:var(--ssr-sausage);">LEDERHOSEN OF SHAME</span><span class="ssr-badge ssr-b-hat">HUMILIATION</span></div>
      <div class="ssr-txt">${humiliation.text}</div>
    </div>`);
  }

  const totalSteps = steps.length;
  let html = '';
  steps.forEach((s, i) => {
    html += `<div id="ssr-step-${suffix}-${i}" class="ssr-step ssr-step-hidden">${s}</div>`;
  });
  html += `<div id="ssr-controls-${suffix}" class="ssr-controls">
    <button class="ssr-btn" onclick="ssrRevealNext('${screenKey}',${totalSteps})">NEXT &#9654;</button>
    <span class="ssr-counter" id="ssr-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="ssr-btn" onclick="ssrRevealAll('${screenKey}',${totalSteps})" style="margin-left:16px;border-color:var(--ssr-shock);color:var(--ssr-shock);">REVEAL ALL</button>
  </div>`;

  return _shell(html, ep, 'phase-hats');
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER: CAPTAIN'S DRAFT
// ══════════════════════════════════════════════════════════════

export function rpBuildSSRDraft(ep) {
  const d = ep.slapRevolution;
  if (!d) return '';
  const screenKey = 'ssr-draft';
  const suffix = 'draft';
  const draft = d.captainDraft;

  const steps = [];
  const stepMeta = [];

  // Captain election card
  let captHtml = `<div class="ssr-card" style="border:1px solid rgba(251,191,36,.2);">
    <div class="ssr-hdr">${_icon('pad')}<span class="ssr-title">CAPTAIN ELECTION</span><span class="ssr-badge ssr-b-win">LEADERSHIP</span></div>
    <div class="ssr-txt">Each tribe votes for their captain &mdash; the player who picks who fights and who sits out.</div>
    <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;">`;
  (draft.captains || []).forEach(c => {
    const tc = tribeColor(c.tribeName) || '#a8d8ea';
    captHtml += `<div style="text-align:center;">${_av(c.captain, c.tribeName)}<div style="font-size:10px;margin-top:4px;font-weight:700;">${c.captain}</div><div style="font-size:8px;color:${tc};">${c.tribeName.toUpperCase()} CPT</div></div>`;
  });
  captHtml += `</div></div>`;
  steps.push(captHtml);
  stepMeta.push({ type: 'captains' });

  // Flavor
  steps.push(`<div class="ssr-flavor host">"Captains! Time to pick your fighters. Who's in... and who's OUT?" &mdash; ${host()}</div>`);
  stepMeta.push({ type: 'flavor' });

  // Rivalry auto-lock
  (draft.rivalryLocks || []).forEach(rl => {
    const tc1 = tribeColor(rl.tribe1) || '#a8d8ea';
    const tc2 = tribeColor(rl.tribe2) || '#a8d8ea';
    steps.push(`<div class="ssr-card" style="border:1px solid rgba(255,59,59,.2);background:linear-gradient(135deg,rgba(255,59,59,.04),rgba(42,26,61,.04));">
      <div class="ssr-hdr">${_icon('bolt')}<span class="ssr-title" style="color:var(--ssr-danger);">RIVALRY AUTO-LOCK</span><span class="ssr-badge ssr-b-ko">GRUDGE MATCH</span></div>
      <div class="ssr-txt">"These two have UNFINISHED BUSINESS," the host announces.</div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px;justify-content:center;">
        <div style="text-align:center;">${_av(rl.p1, rl.tribe1, 'lg')}<div style="font-size:11px;margin-top:4px;font-weight:700;">${rl.p1}</div><div style="font-size:9px;color:${tc1};">${rl.tribe1}</div></div>
        <div style="font-family:'Bungee Shade',cursive;font-size:20px;color:var(--ssr-danger);">VS</div>
        <div style="text-align:center;">${_av(rl.p2, rl.tribe2, 'lg')}<div style="font-size:11px;margin-top:4px;font-weight:700;">${rl.p2}</div><div style="font-size:9px;color:${tc2};">${rl.tribe2}</div></div>
      </div>
      <div style="text-align:center;margin-top:8px;font-size:10px;color:rgba(232,240,248,.35);">Bond: <span style="color:var(--ssr-danger);">${rl.bond}</span></div>
    </div>`);
    stepMeta.push({ type: 'rivalry', matchup: { p1: rl.p1, p2: rl.p2, isRivalry: true } });
  });

  // Sit-out picks
  (draft.sitOuts || []).forEach(so => {
    const tc = tribeColor(so.tribeName) || '#a8d8ea';
    const bondCol = so.isRelieved ? 'green' : 'danger';
    const bondDelta = so.isRelieved ? '+1' : '-1';
    steps.push(`<div class="ssr-card ssr-card-social">
      <div class="ssr-hdr">${_av(so.captain, so.tribeName, 'sm')}${_av(so.player, so.tribeName, 'sm')}<span class="ssr-title" style="color:var(--ssr-ice);">${so.tribeName.toUpperCase()} SIT-OUT PICK</span><span class="ssr-badge ssr-b-draft">CAPTAIN'S CHOICE</span></div>
      <div class="ssr-txt">${so.reaction}</div>
      <div style="font-size:10px;margin-top:6px;color:rgba(232,240,248,.4);">${so.captain} &rarr; ${so.player}: bond <span style="color:var(--ssr-${bondCol});">${bondDelta}</span></div>
    </div>`);
    stepMeta.push({ type: 'sitout' });
  });

  // Matchup draft picks
  (draft.matchups || []).filter(m => !m.isRivalry).forEach(m => {
    const tc1 = tribeColor(m.tribe1) || '#a8d8ea';
    const tc2 = tribeColor(m.tribe2) || '#a8d8ea';
    const captTribe = m.captainTribe || '';
    const captAv = m.captain ? _av(m.captain, captTribe, 'sm') : '';
    steps.push(`<div class="ssr-card">
      <div class="ssr-hdr">${captAv}${_icon('pad')}<span class="ssr-title">MATCHUP DRAFT${captTribe ? ' &mdash; ' + captTribe.toUpperCase() : ''}</span><span class="ssr-badge ssr-b-draft">PICK ${m.pickNum}</span></div>
      <div class="ssr-txt">${m.reaction}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
        <div style="display:flex;align-items:center;gap:4px;">${_av(m.p1, m.tribe1, 'sm')}<span style="font-size:10px;">${m.p1}</span></div>
        <span style="font-family:'Russo One',sans-serif;font-size:10px;color:var(--ssr-shock);">VS</span>
        <div style="display:flex;align-items:center;gap:4px;">${_av(m.p2, m.tribe2, 'sm')}<span style="font-size:10px;">${m.p2}</span></div>
      </div>
    </div>`);
    stepMeta.push({ type: 'matchup-pick', matchup: { p1: m.p1, tribe1: m.tribe1, p2: m.p2, tribe2: m.tribe2, isRivalry: false } });
  });

  // Final flavor
  // Tournament bracket card (no results yet — just the matchup layout)
  const allMatchups = draft.matchups || [];
  steps.push(`<div class="ssr-card" style="border:2px solid var(--ssr-pad-arrow);">
    <div class="ssr-hdr">${_icon('pad')}<span class="ssr-title" style="color:var(--ssr-pad-arrow);">TOURNAMENT BRACKET</span><span class="ssr-badge ssr-b-fight">${allMatchups.length} FIGHTS</span></div>
    ${_buildBracket(allMatchups, [], new Set())}
  </div>`);
  stepMeta.push({ type: 'bracket' });

  steps.push(`<div class="ssr-flavor crowd">"The bracket is set. Cold, calculated. This is chess on a dance pad." &mdash; ${host()}</div>`);
  stepMeta.push({ type: 'flavor' });

  window._ssrDraftStepMeta = stepMeta;

  const totalSteps = steps.length;
  let html = '';
  steps.forEach((s, i) => {
    html += `<div id="ssr-step-${suffix}-${i}" class="ssr-step ssr-step-hidden">${s}</div>`;
  });
  html += `<div id="ssr-controls-${suffix}" class="ssr-controls">
    <button class="ssr-btn" onclick="ssrRevealNext('${screenKey}',${totalSteps})">NEXT &#9654;</button>
    <span class="ssr-counter" id="ssr-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="ssr-btn" onclick="ssrRevealAll('${screenKey}',${totalSteps})" style="margin-left:16px;border-color:var(--ssr-shock);color:var(--ssr-shock);">REVEAL ALL</button>
  </div>`;

  return _shell(html, ep, 'phase-draft');
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER: FIGHTS (non-final rounds)
// ══════════════════════════════════════════════════════════════

function _buildFightCards(fights, suffix, screenKey, isFinals) {
  const steps = [];
  const stepMeta = [];

  fights.forEach((fight, fi) => {
    const tc1 = tribeColor(fight.tribe1) || '#a8d8ea';
    const tc2 = tribeColor(fight.tribe2) || '#a8d8ea';
    const maxHP1 = 10 + (fight.p1HpBonus || 0);
    const maxHP2 = 10 + (fight.p2HpBonus || 0);
    const hat1 = _hatName(fight.p1Hat);
    const hat2 = _hatName(fight.p2Hat);
    const avSize = isFinals ? 'xl' : 'lg';
    const vsSize = isFinals ? '40' : '32';

    // Pre-fight social events (if any from fight social events with type 'tension')
    const preFight = (fight.socialEvents || []).filter(e => e.type === 'tension');
    preFight.forEach(ev => {
      steps.push(`<div class="ssr-card ssr-card-social" style="border-color:rgba(255,59,59,.15);">
        <div class="ssr-hdr">${(ev.players || []).map(p => {
          const tribe = p === fight.p1 ? fight.tribe1 : fight.tribe2;
          return _av(p, tribe, 'sm');
        }).join('')}<span class="ssr-title" style="color:var(--ssr-danger);">PRE-FIGHT TENSION</span><span class="ssr-badge" style="background:rgba(255,59,59,.1);color:var(--ssr-danger);border:1px solid rgba(255,59,59,.2);">COMPETITIVE</span></div>
        <div class="ssr-txt">${ev.text}</div>
      </div>`);
      stepMeta.push({ fightIdx: fi });
    });

    // VS card
    const vsStyle = isFinals ? ' style="border-color:var(--ssr-shock);box-shadow:0 0 30px rgba(255,228,77,.15);"' : '';
    steps.push(`<div class="ssr-vs"${vsStyle}>
      <div class="ssr-vs-fighter">${_av(fight.p1, fight.tribe1, avSize)}<div class="ssr-vs-name">${fight.p1.toUpperCase()}</div><div class="ssr-vs-hat">${hat1} &bull; +${fight.p1HpBonus} HP</div><div class="ssr-vs-tribe" style="color:${tc1};">${fight.tribe1.toUpperCase()}</div></div>
      <div class="ssr-vs-tag" style="font-size:${vsSize}px;">VS</div>
      <div class="ssr-vs-fighter">${_av(fight.p2, fight.tribe2, avSize)}<div class="ssr-vs-name">${fight.p2.toUpperCase()}</div><div class="ssr-vs-hat">${hat2} &bull; +${fight.p2HpBonus} HP</div><div class="ssr-vs-tribe" style="color:${tc2};">${fight.tribe2.toUpperCase()}</div></div>
    </div>`);
    stepMeta.push({ fightIdx: fi });

    // Initial HP/DM bars
    steps.push(`<div class="ssr-card" style="border-color:rgba(124,58,237,.2);">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div><div style="font-size:10px;font-weight:700;color:${tc1};margin-bottom:4px;">${fight.p1.toUpperCase()}</div>${_hpBar(maxHP1, maxHP1)}${_dmBar(70)}</div>
        <div><div style="font-size:10px;font-weight:700;color:${tc2};margin-bottom:4px;">${fight.p2.toUpperCase()}</div>${_hpBar(maxHP2, maxHP2)}${_dmBar(70)}</div>
      </div>
    </div>`);
    stepMeta.push({ fightIdx: fi });

    // Exchanges
    (fight.exchanges || []).forEach((ex, ei) => {
      const isAttP1 = ex.attackerName === fight.p1;
      const atkTribe = isAttP1 ? fight.tribe1 : fight.tribe2;
      const defTribe = isAttP1 ? fight.tribe2 : fight.tribe1;
      const isShock = ex.shockEvent;
      const isFinalExchange = ei === fight.exchanges.length - 1;

      // Exchange card
      const exStyle = isShock
        ? ' style="border-color:rgba(255,228,77,.2);background:rgba(255,228,77,.04);"'
        : (isFinalExchange ? ' style="border:2px solid rgba(255,59,59,.3);background:rgba(255,59,59,.06);"' : '');
      const atkShocked = isShock && ex.shockTarget === ex.attackerName;
      const defShocked = isShock && ex.shockTarget === ex.defenderName;

      steps.push(`<div class="ssr-exchange"${exStyle}>
        <div class="ssr-ex-player">
          <div class="ssr-av ssr-av-sm${atkShocked ? ' ssr-av-shocked' : ''}" style="border-color:${tribeColor(atkTribe) || '#a8d8ea'}">${portrait(ex.attackerName, 26)}</div>
          <div><div style="font-size:11px;font-weight:600;">${ex.attackerName}</div><div style="font-size:9px;color:var(--ssr-neon-green);">${_moveName(ex.moveType)}</div></div>
        </div>
        <div class="ssr-ex-move"><div style="font-size:22px;">${isShock ? '' : _moveIcon(ex.moveType)}</div>${isShock ? _icon('bolt') : ''}<div class="ssr-ex-dmg ${isShock ? 'yellow' : 'red'}">-${ex.damage} HP${isShock && ex.shockDamage ? ` (+${ex.shockDamage} shock)` : ''}</div></div>
        <div class="ssr-ex-player right">
          <div class="ssr-av ssr-av-sm${defShocked ? ' ssr-av-shocked' : ''}" style="border-color:${tribeColor(defTribe) || '#a8d8ea'}">${portrait(ex.defenderName, 26)}</div>
          <div><div style="font-size:11px;font-weight:600;">${ex.defenderName}</div><div style="font-size:9px;color:${ex.blocked ? 'var(--ssr-green)' : 'rgba(232,240,248,.4)'};">${ex.blocked ? 'PARTIAL BLOCK' : (defShocked ? 'SHOCKED!' : 'HIT')}</div></div>
        </div>
      </div>`);
      stepMeta.push({ fightIdx: fi });

      // Narration text
      steps.push(`<div class="ssr-txt" style="padding:0 14px;font-size:11px;color:${isShock ? 'rgba(255,228,77,.4)' : 'rgba(232,240,248,.5)'};font-style:italic;">${ex.text}</div>`);
      stepMeta.push({ fightIdx: fi });

      // Mid-fight HP update every 2 exchanges
      if (ei % 2 === 1 && ei < fight.exchanges.length - 1) {
        const hp1Now = isAttP1 ? ex.attackerHP : ex.defenderHP;
        const hp2Now = isAttP1 ? ex.defenderHP : ex.attackerHP;
        const dm1Now = isAttP1 ? ex.attackerDM : ex.defenderDM;
        const dm2Now = isAttP1 ? ex.defenderDM : ex.attackerDM;
        steps.push(`<div class="ssr-card" style="border-color:rgba(124,58,237,.12);padding:12px 18px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div><div style="font-size:10px;font-weight:700;color:${tc1};margin-bottom:4px;">${fight.p1.toUpperCase()}</div>${_hpBar(Math.max(0, hp1Now), maxHP1)}${_dmBar(Math.max(0, dm1Now))}</div>
            <div><div style="font-size:10px;font-weight:700;color:${tc2};margin-bottom:4px;">${fight.p2.toUpperCase()}</div>${_hpBar(Math.max(0, hp2Now), maxHP2)}${_dmBar(Math.max(0, dm2Now))}</div>
          </div>
        </div>`);
        stepMeta.push({ fightIdx: fi });
      }
    });

    // KO card
    const winnerTribe = fight.winner === fight.p1 ? fight.tribe1 : fight.tribe2;
    const loserTribe = fight.loser === fight.p1 ? fight.tribe1 : fight.tribe2;
    const winTC = tribeColor(winnerTribe) || '#a8d8ea';
    steps.push(`<div class="ssr-ko">
      <div class="ssr-ko-text">K.O.!</div>
      <div class="ssr-ko-sub">${fight.koText || `<strong>${fight.loser}</strong> is down! <strong>${fight.winner}</strong> wins for <span style="color:${winTC};">${winnerTribe.toUpperCase()}</span>!`}</div>
      <div style="display:flex;justify-content:center;gap:24px;margin-top:16px;">
        <div style="text-align:center;">${_av(fight.winner, winnerTribe, 'lg').replace('ssr-av', 'ssr-av" style="border-color:var(--ssr-gold);box-shadow:0 0 12px rgba(251,191,36,.3)')}<div style="font-size:10px;color:var(--ssr-gold);margin-top:4px;">WINNER</div></div>
        <div style="text-align:center;"><div class="ssr-av ssr-av-lg ssr-av-ko" style="border-color:${tribeColor(loserTribe) || '#a8d8ea'}">${portrait(fight.loser, 48)}</div><div style="font-size:10px;color:var(--ssr-danger);margin-top:4px;opacity:.5;">ELIMINATED</div></div>
      </div>
    </div>`);
    stepMeta.push({ fightIdx: fi, isKO: true });

    // Post-fight social events
    const postFight = (fight.socialEvents || []).filter(e => e.type !== 'tension');
    postFight.forEach(ev => {
      const evPlayers = ev.players || [];
      const avHtml = evPlayers.map(p => {
        const tribe = p === fight.p1 ? fight.tribe1 : (p === fight.p2 ? fight.tribe2 : winnerTribe);
        return _av(p, tribe, 'sm');
      }).join('');
      const typeLabel = ev.type === 'coaching' ? 'SIDELINE COACHING' : ev.type === 'celebration' ? 'CELEBRATION' : ev.type === 'panic' ? 'PANIC' : ev.type === 'respect' ? 'RESPECT' : ev.type === 'blame' ? 'BLAME' : 'REACTION';
      const badgeText = ev.type === 'coaching' ? 'PLAYFUL' : ev.type === 'celebration' ? 'HOPE' : ev.type === 'panic' ? 'CONCERN' : ev.type === 'respect' ? 'EARNED' : ev.type === 'blame' ? 'CONFLICT' : 'REACTION';

      steps.push(`<div class="ssr-card ssr-card-social">
        <div class="ssr-hdr">${avHtml}<span class="ssr-title" style="color:var(--ssr-ice);">${typeLabel}</span><span class="ssr-badge ssr-b-social">${badgeText}</span></div>
        <div class="ssr-txt">${ev.text}</div>
      </div>`);
      stepMeta.push({ fightIdx: fi });
    });

    // Inter-fight flavor (not after last fight)
    if (fi < fights.length - 1) {
      steps.push(`<div class="ssr-flavor crowd">${HOST_FLAVOR[(fi + 5) % HOST_FLAVOR.length]()}</div>`);
      stepMeta.push({ type: 'flavor', fightIdx: fi });
    }
  });

  return { steps, stepMeta };
}

export function rpBuildSSRFights(ep) {
  const d = ep.slapRevolution;
  if (!d) return '';
  const screenKey = 'ssr-fights';
  const suffix = 'fights';

  // All fights except the last one (which is the final)
  const allFights = [];
  (d.tournament?.rounds || []).forEach(r => { allFights.push(...r.fights); });
  const nonFinalFights = allFights.length > 1 ? allFights.slice(0, -1) : allFights;

  if (nonFinalFights.length === 0) return '';

  const { steps, stepMeta } = _buildFightCards(nonFinalFights, suffix, screenKey, false);
  window._ssrFightsStepMeta = stepMeta;

  const totalSteps = steps.length;
  let html = '';
  steps.forEach((s, i) => {
    html += `<div id="ssr-step-${suffix}-${i}" class="ssr-step ssr-step-hidden">${s}</div>`;
  });
  html += `<div id="ssr-controls-${suffix}" class="ssr-controls">
    <button class="ssr-btn" onclick="ssrRevealNext('${screenKey}',${totalSteps})">NEXT &#9654;</button>
    <span class="ssr-counter" id="ssr-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="ssr-btn" onclick="ssrRevealAll('${screenKey}',${totalSteps})" style="margin-left:16px;border-color:var(--ssr-shock);color:var(--ssr-shock);">REVEAL ALL</button>
  </div>`;

  return _shell(html, ep, 'phase-fights');
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER: FINALS (championship fight)
// ══════════════════════════════════════════════════════════════

export function rpBuildSSRFinals(ep) {
  const d = ep.slapRevolution;
  if (!d) return '';
  const screenKey = 'ssr-finals';
  const suffix = 'finals';

  const allFights = [];
  (d.tournament?.rounds || []).forEach(r => { allFights.push(...r.fights); });
  const finalFight = allFights.length > 0 ? [allFights[allFights.length - 1]] : [];

  if (finalFight.length === 0) return '';

  // Opening flavor
  const preSteps = [`<div class="ssr-flavor host">"FINAL MATCH! The last two standing! This is for the CHAMPIONSHIP!" &mdash; ${host()}</div>`];
  const preStepMeta = [{ type: 'flavor' }];

  const { steps: fightSteps, stepMeta: fightMeta } = _buildFightCards(finalFight, suffix, screenKey, true);

  // Adjust fightIdx for the finals — the final fight is the last fight index overall
  const finalFightIdx = allFights.length - 1;
  fightMeta.forEach(sm => { if (sm.fightIdx !== undefined) sm.fightIdx = finalFightIdx; });

  const allSteps = [...preSteps, ...fightSteps];
  const allMeta = [...preStepMeta, ...fightMeta];
  window._ssrFinalsStepMeta = allMeta;

  const totalSteps = allSteps.length;
  let html = '';
  allSteps.forEach((s, i) => {
    html += `<div id="ssr-step-${suffix}-${i}" class="ssr-step ssr-step-hidden">${s}</div>`;
  });
  html += `<div id="ssr-controls-${suffix}" class="ssr-controls">
    <button class="ssr-btn" onclick="ssrRevealNext('${screenKey}',${totalSteps})">NEXT &#9654;</button>
    <span class="ssr-counter" id="ssr-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="ssr-btn" onclick="ssrRevealAll('${screenKey}',${totalSteps})" style="margin-left:16px;border-color:var(--ssr-shock);color:var(--ssr-shock);">REVEAL ALL</button>
  </div>`;

  return _shell(html, ep, 'phase-finals');
}

// ══════════════════════════════════════════════════════════════
// VP BUILDER: RESULTS
// ══════════════════════════════════════════════════════════════

export function rpBuildSSRResults(ep) {
  const d = ep.slapRevolution;
  if (!d) return '';
  const screenKey = 'ssr-results';
  const suffix = 'results';
  const tribes = d.grindPhase?.tribes || [];

  const steps = [];

  // Champion card
  if (d.tournament?.champion) {
    const champTribe = tribes.find(t => t.members.includes(d.tournament.champion))?.tribeName || '';
    const tc = tribeColor(champTribe) || '#a8d8ea';

    // Count wins
    const allFights = [];
    (d.tournament?.rounds || []).forEach(r => { allFights.push(...r.fights); });
    const wins = allFights.filter(f => f.winner === d.tournament.champion).length;
    const totalFights = allFights.filter(f => f.p1 === d.tournament.champion || f.p2 === d.tournament.champion).length;

    steps.push(`<div class="ssr-card ssr-card-winner" style="border:3px solid var(--ssr-gold);text-align:center;padding:30px;">
      <div style="font-family:'Bungee Shade',cursive;font-size:28px;color:var(--ssr-gold);text-shadow:0 0 20px rgba(251,191,36,.3);margin-bottom:8px;">TOURNAMENT CHAMPION</div>
      ${_av(d.tournament.champion, champTribe, 'xl').replace('border-color:', 'border-color:var(--ssr-gold);box-shadow:0 0 20px rgba(251,191,36,.3);border-color-orig:')}
      <div style="font-family:'Russo One',sans-serif;font-size:18px;letter-spacing:2px;margin-top:8px;">${d.tournament.champion.toUpperCase()}</div>
      <div style="font-size:11px;color:${tc};margin-top:4px;">${champTribe.toUpperCase()}</div>
      <div style="font-size:10px;color:rgba(232,240,248,.4);margin-top:8px;">${totalFights} fight${totalFights !== 1 ? 's' : ''} &bull; ${wins} win${wins !== 1 ? 's' : ''} &bull; Tournament MVP</div>
      ${d.tournament.eliminatedTribe ? `<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(251,191,36,.15);">
        <div style="font-size:12px;color:var(--ssr-danger);font-weight:700;letter-spacing:2px;">ELIMINATED: ${d.tournament.eliminatedTribe.toUpperCase()}</div>
        <div style="font-size:10px;color:rgba(232,240,248,.4);margin-top:4px;">All fighters eliminated from bracket &rarr; TRIBAL COUNCIL</div>
      </div>` : ''}
    </div>`);
  }

  // Full bracket display
  const allFights = [];
  (d.tournament?.rounds || []).forEach(r => { allFights.push(...r.fights); });

  if (allFights.length > 0) {
    let bracketHtml = `<div class="ssr-card" style="border:1px solid rgba(124,58,237,.2);">
      <div class="ssr-hdr">${_icon('pad')}<span class="ssr-title">FINAL BRACKET</span><span class="ssr-badge ssr-b-fight">COMPLETE</span></div>`;
    allFights.forEach(f => {
      const tc1 = tribeColor(f.tribe1) || '#a8d8ea';
      const tc2 = tribeColor(f.tribe2) || '#a8d8ea';
      const p1Won = f.winner === f.p1;
      bracketHtml += `<div class="ssr-mini-match" style="margin:6px 0;">
        <div class="ssr-mini-slot ${p1Won ? 'winner' : 'loser'}"><div class="ssr-mini-dot" style="background:${tc1};">${(f.p1 || '?')[0]}</div><span class="ssr-mini-name">${f.p1}</span><span class="ssr-mini-result" style="color:${p1Won ? 'var(--ssr-gold)' : 'var(--ssr-danger)'};">${p1Won ? 'W' : 'KO'}</span></div>
        <div class="ssr-mini-slot ${!p1Won ? 'winner' : 'loser'}"><div class="ssr-mini-dot" style="background:${tc2};">${(f.p2 || '?')[0]}</div><span class="ssr-mini-name">${f.p2}</span><span class="ssr-mini-result" style="color:${!p1Won ? 'var(--ssr-gold)' : 'var(--ssr-danger)'};">${!p1Won ? 'W' : 'KO'}</span></div>
      </div>`;
    });
    bracketHtml += `</div>`;
    steps.push(bracketHtml);
  }

  // Aftermath social — respect between finalists
  const finalFight = allFights.length > 0 ? allFights[allFights.length - 1] : null;
  if (finalFight) {
    const winnerTribe = finalFight.winner === finalFight.p1 ? finalFight.tribe1 : finalFight.tribe2;
    const loserTribe = finalFight.loser === finalFight.p1 ? finalFight.tribe1 : finalFight.tribe2;
    steps.push(`<div class="ssr-card ssr-card-social" style="border-color:rgba(251,191,36,.15);">
      <div class="ssr-hdr">${_av(finalFight.winner, winnerTribe, 'sm')}${_av(finalFight.loser, loserTribe, 'sm')}<span class="ssr-title" style="color:var(--ssr-gold);">AFTERMATH &mdash; RESPECT</span><span class="ssr-badge ssr-b-win">EARNED</span></div>
      <div class="ssr-txt"><strong>${finalFight.winner}</strong> and <strong>${finalFight.loser}</strong> exchange a nod. The fight was brutal. The respect is real. Both gave everything they had on the platform.</div>
    </div>`);
  }

  const totalSteps = steps.length;
  let html = '';
  steps.forEach((s, i) => {
    html += `<div id="ssr-step-${suffix}-${i}" class="ssr-step ssr-step-hidden">${s}</div>`;
  });
  html += `<div id="ssr-controls-${suffix}" class="ssr-controls">
    <button class="ssr-btn" onclick="ssrRevealNext('${screenKey}',${totalSteps})">NEXT &#9654;</button>
    <span class="ssr-counter" id="ssr-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="ssr-btn" onclick="ssrRevealAll('${screenKey}',${totalSteps})" style="margin-left:16px;border-color:var(--ssr-shock);color:var(--ssr-shock);">REVEAL ALL</button>
  </div>`;

  return _shell(html, ep, 'phase-results');
}

// Export text pools, helpers, and VP builders
export {
  GRIND_GOOD_GRINDER, GRIND_BAD_GRINDER,
  GRIND_GOOD_SHOVELER, GRIND_BAD_SHOVELER,
  GRIND_GOOD_PACKER, GRIND_BAD_PACKER,
  GRIND_GOOD_CASING, GRIND_BAD_CASING,
  GRIND_SLACKER_CALLOUT, GRIND_TEAM_BONDING, GRIND_MOLE_SABOTAGE,
  DESCENT_SEGMENT_NAMES,
  DESCENT_LAUNCH_GOOD, DESCENT_LAUNCH_BAD,
  DESCENT_HAIRPIN_GOOD, DESCENT_HAIRPIN_BAD,
  DESCENT_GOAT_DODGE, DESCENT_GOAT_HIT,
  DESCENT_AVALANCHE_DODGE, DESCENT_AVALANCHE_HIT,
  DESCENT_SLALOM_GOOD, DESCENT_SLALOM_BAD,
  DESCENT_FINISH_CLOSE,
  DESCENT_CRASH_BONDING, DESCENT_TRASH_TALK, DESCENT_SHOWMANCE_SPARK,
  HAT_PICKELHAUBE, HAT_USHANKA, HAT_TYROLEAN, LEDERHOSEN_HUMILIATION,
  CAPTAIN_ELECTED,
  SITOUT_RELUCTANT, SITOUT_RELIEVED,
  DRAFT_PICK_CONFIDENT, DRAFT_PICK_RISKY, DRAFT_PICK_RIVALRY,
  MOVE_POWER_SLAP, MOVE_JAB_SLAP, MOVE_SPIN_SLAP, MOVE_OVERHEAD_SLAP,
  MOVE_DANCE_KICK, MOVE_SWEEP, MOVE_RALLY_SLAP, MOVE_COUNTER_SLAP, MOVE_HAYMAKER,
  MOVE_POOLS, MOVE_TYPES, DESPERATION_MOVES,
  ELECTROSHOCK, RANDOM_SHOCK, BLOCK_SUCCESS,
  KO_TEXT,
  SOCIAL_COACHING, SOCIAL_PREFIGHT_TENSION, SOCIAL_CELEBRATION,
  SOCIAL_PANIC, SOCIAL_RESPECT, SOCIAL_BLAME,
  HOST_FLAVOR,
  host, pick, noise, clamp, popDelta, arch, portrait, slug,
  NICE_ARCHS, VILLAIN_ARCHS,
  _tvState, _ensureState, _reapplyVisibility,
};
