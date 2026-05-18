// js/chal/drumheller.js — Awwwwww, Drumheller archaeology challenge (post-merge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const _usedTexts = new Set();
function pickU(arr) {
  const avail = arr.filter(x => !_usedTexts.has(x));
  const chosen = avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : pick(arr);
  _usedTexts.add(chosen);
  return chosen;
}
function noise(range = 2.5) { return (Math.random() - 0.5) * 2 * range; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function portrait(name, size = 42) {
  return `<img src="assets/avatars/${slug(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════

const BUILD_DESC = {
  'challenge-beast': [
    (n, pr) => `${n} assembled a scientifically precise Velociraptor with anatomically correct claws. ${pr.Sub} studied the reference sheet.`,
    (n, pr) => `${n} built a towering T-Rex skeleton with perfect proportions. Every bone in the right place.`,
    (n, pr) => `${n} constructed a fearsome Spinosaurus, triple-checking fossil alignment. Textbook precision.`,
    (n, pr) => `${n} crafted a Triceratops that could pass museum inspection. ${pr.Sub} measured twice, built once.`,
    (n, pr) => `${n} created a Pteranodon with proper wingspan ratios. The detail was frankly intimidating.`,
    (n, pr) => `${n} assembled a Stegosaurus with plate-perfect accuracy. Even the tail spikes were spaced correctly.`,
  ],
  wildcard: [
    (n, pr) => `${n} built a "Funkyraptor" — a dinosaur wearing sunglasses made of twigs. ${pr.Sub} was proud.`,
    (n, pr) => `${n} constructed what ${pr.sub} called a "Party-saurus Rex." It had streamers for arms.`,
    (n, pr) => `${n} assembled a dinosaur riding a smaller dinosaur. "It's called evolution," ${pr.sub} explained.`,
    (n, pr) => `${n} built a Brontosaurus with five heads. "More heads = more dinosaur." The math checks out.`,
    (n, pr) => `${n} created a dinosaur breakdancing. The bones were in impossible positions. ${pr.Sub} called it art.`,
    (n, pr) => `${n} made a hybrid dino-bird-fish thing. "It's transitional!" ${pr.sub} insisted.`,
  ],
  'social-butterfly': [
    (n, pr) => `${n} built a crowd-pleasing baby dinosaur with big eyes. Everyone went "awww."`,
    (n, pr) => `${n} assembled a family of three dinosaurs — parent, child, egg. The crowd loved the story.`,
    (n, pr) => `${n} created a dinosaur hugging another dinosaur. "It's about friendship!" ${pr.Sub} beamed.`,
    (n, pr) => `${n} built a gentle herbivore with an adorable expression. ${pr.Sub} added little bone flowers around it.`,
    (n, pr) => `${n} constructed a nest scene with a proud mama dinosaur. It told a whole narrative.`,
    (n, pr) => `${n} made a smiling Brachiosaurus. The skull was slightly wrong but the vibes were immaculate.`,
  ],
  villain: [
    (n, pr) => `${n} built a massive skull-only display. Just teeth. Just aggression. It was ${pr.posAdj} self-portrait.`,
    (n, pr) => `${n} constructed a predator mid-kill. The victim dinosaur bore a suspicious resemblance to ${pr.posAdj} rival.`,
    (n, pr) => `${n} assembled a dinosaur throne. ${pr.Sub} sat on it. "This is MY era."`,
    (n, pr) => `${n} built a T-Rex crushing smaller dinos underfoot. Subtle as always.`,
    (n, pr) => `${n} created what ${pr.sub} called "the apex predator of strategy." It had too many teeth.`,
    (n, pr) => `${n} made a dinosaur with glowing red eyes (painted rocks). ${pr.Sub} called it "a metaphor."`,
  ],
  default: [
    (n, pr) => `${n} assembled a respectable dinosaur skeleton. Not flashy, but solid work.`,
    (n, pr) => `${n} built a Triceratops with some creative bone placement. ${pr.Sub} did ${pr.posAdj} best.`,
    (n, pr) => `${n} constructed a medium-sized raptor. A couple bones were backwards, but hey.`,
    (n, pr) => `${n} put together a Diplodocus. The neck was wobbly but it held together.`,
    (n, pr) => `${n} assembled something vaguely dinosaur-shaped. "${pr.Sub}'s a late bloomer," ${pr.sub} muttered.`,
    (n, pr) => `${n} created a pterodactyl — or maybe a pelican? The wings were ambiguous.`,
  ],
};

// ── DESIGN-O-SAURUS BUILD PHASE TEXT POOLS ──

const SUPPLY_ITEMS = [
  'glitter glue', 'a canvas tarp', 'wire spooling', 'a bag of plaster', 'bone fragments',
  'spray paint cans', 'duct tape', 'wooden dowels', 'papier-mâché mix', 'a hot glue gun',
  'foam blocks', 'chicken wire', 'sequins and rhinestones', 'pipe cleaners', 'cardboard sheets',
  'a jar of paint', 'fabric scraps', 'zip ties', 'rope', 'rubber cement',
];

const DINO_NAMES = [
  'Bonezilla', 'Sir Chomps-a-Lot', 'Princess Clawdia', 'Professor Fossil',
  'Señor Teeth', 'Lady Spikes', 'Captain Crunch', 'The Bone Zone',
  'Cretaceous Carl', 'Mega Rex', 'Dino Destroyer', 'Stompy McStompface',
  'Jaws Jr.', 'The Fossil Fiend', 'Tricera-Tops', 'Raptor Wrangler',
  'Lord Vertebrae', 'Miss Extinction', 'Baron Von Bones', 'Duke Diplodocus',
];

const BUILD_SUPPLY_FIND_GOOD = [
  (n, pr, item) => `${n} dug through a crate and found ${item}! ${pr.Sub} clutched it like treasure.`,
  (n, pr, item) => `Jackpot — ${n} unearthed ${item} from the back of the cargo hold! Perfect for ${pr.posAdj} build.`,
  (n, pr, item) => `${n} spotted ${item} half-buried under other junk. "This changes EVERYTHING," ${pr.sub} grinned.`,
  (n, pr, item) => `${n}'s eyes lit up as ${pr.sub} pulled ${item} from a dusty shelf. Exactly what ${pr.sub} needed.`,
  (n, pr, item) => `"Yes! YES!" ${n} found ${item} and immediately started planning ${pr.posAdj} dinosaur around it.`,
  (n, pr, item) => `${n} rummaged through the cargo hold and emerged triumphant with ${item}.`,
];

const BUILD_SUPPLY_FIND_BAD = [
  (n, pr) => `${n} came back with a handful of broken sticks and lint. Not exactly building material.`,
  (n, pr) => `${n} searched the cargo hold for ten minutes and found... a single rubber band. Great.`,
  (n, pr) => `${n} grabbed what ${pr.sub} thought was plaster. It was dried toothpaste. This was going poorly.`,
  (n, pr) => `"There's NOTHING left!" ${n} kicked an empty crate. Everyone else had picked the hold clean.`,
  (n, pr) => `${n} found a soggy cardboard box. It fell apart in ${pr.posAdj} hands. ${pr.Sub} sighed deeply.`,
  (n, pr) => `${n} emerged from the cargo hold covered in dust and holding a bent spoon. Not ideal.`,
];

const BUILD_SUPPLY_STEAL = [
  (thief, victim, prT, item) => `${thief} waited until ${victim} turned around, then SWIPED ${item} right off ${victim}'s workstation! ${prT.Sub} didn't even flinch.`,
  (thief, victim, prT, item) => `${thief} "accidentally" knocked ${victim}'s ${item} off the table. "Oh, let me get that." ${prT.Sub} never gave it back.`,
  (thief, victim, prT, item) => `When ${victim} wasn't looking, ${thief} pocketed ${victim}'s ${item}. "Finders keepers," ${prT.sub} whispered.`,
  (thief, victim, prT, item) => `${thief} straight-up took ${item} from ${victim}'s pile. "You weren't using it right," ${prT.sub} shrugged.`,
  (thief, victim, prT, item) => `${thief} created a distraction, then swapped ${victim}'s ${item} for a pile of twigs. Cold-blooded.`,
  (thief, victim, prT, item) => `"Borrowing this!" ${thief} grabbed ${victim}'s ${item} and power-walked away before ${victim} could react.`,
];

const BUILD_HELP = [
  (helper, target, prH) => `${helper} noticed ${target} struggling and walked over. "Here, hold this part while I glue." They worked together seamlessly.`,
  (helper, target, prH) => `${helper} handed ${target} some spare supplies. "You need these more than me." Genuine kindness.`,
  (helper, target, prH) => `${helper} showed ${target} a trick for making bones stick. "My grandma taught me this." ${target}'s build improved instantly.`,
  (helper, target, prH) => `"Your spine is crooked — the DINOSAUR'S spine." ${helper} helped ${target} realign the skeleton. Much better.`,
  (helper, target, prH) => `${helper} quietly slid extra plaster to ${target}'s station when nobody was watching. Alliance loyalty.`,
  (helper, target, prH) => `${helper} and ${target} tag-teamed the tricky skull assembly. Four hands were better than two.`,
];

const BUILD_SABOTAGE = [
  (sab, victim, prS) => `${sab} bumped into ${victim}'s worktable — "accidentally" — and sent bone fragments scattering. "Oops."`,
  (sab, victim, prS) => `${sab} swapped ${victim}'s glue for water when nobody was looking. ${victim}'s dinosaur started falling apart mid-build.`,
  (sab, victim, prS) => `While ${victim} was away, ${sab} rearranged ${victim}'s skeleton. The head was now where the tail should be.`,
  (sab, victim, prS) => `${sab} kicked a support strut on ${victim}'s build as ${prS.sub} walked by. The whole thing wobbled dangerously.`,
  (sab, victim, prS) => `${sab} "borrowed" ${victim}'s reference chart and returned it with all the labels swapped. Pure chaos.`,
  (sab, victim, prS) => `${sab} dripped paint on ${victim}'s nearly-finished dinosaur. "My hand slipped." It had not slipped.`,
];

const BUILD_ARGUMENT = [
  (a, b) => `${a} and ${b} both reached for the same bone fragment. "I saw it first!" "No, I did!" An actual tug-of-war over a femur.`,
  (a, b) => `${b} criticized ${a}'s build technique. ${a} criticized ${b}'s FACE. Things escalated.`,
  (a, b) => `${a} accidentally spilled paint on ${b}'s workspace. ${b} retaliated by flicking plaster. A cold war began.`,
  (a, b) => `"Your dinosaur looks like a chicken," ${a} told ${b}. "Yours looks like a garbage disposal," ${b} fired back.`,
  (a, b) => `${a} claimed ${b} was copying ${a}'s design. ${b} claimed ${a}'s design wasn't worth copying. Both were right.`,
  (a, b) => `${a} and ${b} argued about whether Brontosaurus was a real dinosaur. It got HEATED. Tools were put down.`,
];

const BUILD_COPROLITE = [
  (n, pr) => `${n} cracked open a promising-looking rock. Inside: fossilized dino poop. ${pr.Sub} SCREAMED and dropped it.`,
  (n, pr) => `"I found a fossil egg!" ${n} announced. ${host()}: "That's coprolite." ${n}: "What—" ${host()}: "Dino dung." ${n}'s face: priceless.`,
  (n, pr) => `${n} proudly displayed ${pr.posAdj} find. The fossil expert took one look: "That's excrement." ${n} threw it across the tent.`,
  (n, pr) => `${n} used a mystery rock as ${pr.posAdj} dinosaur's head. "That's 65-million-year-old poop," someone informed ${pr.obj}. ${pr.Sub} kept it anyway.`,
  (n, pr) => `${n} picked up a round, smooth stone. Sniffed it. "Why does this smell like—" ${host()}: "DON'T finish that sentence."`,
  (n, pr) => `${n} accidentally broke open coprolite on ${pr.posAdj} workstation. The smell of ancient dung filled the tent. Everyone evacuated for thirty seconds.`,
];

const BUILD_SHOWMANCE = [
  (a, b) => `${a} and ${b} built their dinosaurs side by side, "accidentally" brushing hands reaching for the same bone. Nobody was fooled.`,
  (a, b) => `${b} made a tiny dinosaur heart out of clay and placed it inside ${a}'s build. "For luck," ${b} whispered. ${a} blushed.`,
  (a, b) => `${a} named ${a}'s dinosaur after ${b}. ${b} named ${b}'s after ${a}. The other contestants collectively gagged.`,
  (a, b) => `${a} wiped plaster dust from ${b}'s cheek. "You had something..." They held eye contact way too long. Someone coughed.`,
  (a, b) => `${b} helped ${a} position the skull. Their hands overlapped on the jawbone. The whole tent was watching. WHOLE. TENT.`,
  (a, b) => `${a} and ${b} kept finding excuses to visit each other's stations. "Checking technique." Sure. That's what that was.`,
];

const BUILD_ENCOURAGE = [
  (enc, target, prE) => `"Hey, that's actually looking really good!" ${enc} gave ${target} a genuine pep talk. ${target}'s confidence surged.`,
  (enc, target, prE) => `${enc} saw ${target} getting frustrated and walked over. "Keep going — you've got this." ${target} took a breath and refocused.`,
  (enc, target, prE) => `${enc} clapped ${target} on the shoulder. "Yours is one of the best here. Seriously." ${target} stood a little taller.`,
  (enc, target, prE) => `"Don't let them get in your head," ${enc} told ${target}. "Focus on your build. It's solid." ${target} nodded and doubled down.`,
  (enc, target, prE) => `${enc} dropped off water at ${target}'s station. "Stay hydrated, stay winning." Small gesture, big morale boost.`,
  (enc, target, prE) => `"Your tail section is genius," ${enc} told ${target}. Genuine compliment. ${target} beamed and added extra detail.`,
];

const BUILD_SCHEME = [
  (a, b) => `${a} leaned over to ${b} during the build. "We need to talk about the vote tonight..." Whispered strategy ensued.`,
  (a, b) => `${a} and ${b} huddled behind their workstations. "If we make it to merge, I've got your back." Alliance talk during arts and crafts.`,
  (a, b) => `"Who are you voting for best build?" ${a} murmured to ${b}. The game-within-the-game had begun.`,
  (a, b) => `While pretending to compare bone sizes, ${a} and ${b} mapped out their voting strategy. Multi-tasking.`,
  (a, b) => `${a} passed ${b} a note written on a bone fragment. It read: "Vote [target]. Trust me." ${b} pocketed it.`,
  (a, b) => `${a} and ${b} found a quiet corner of the tent. "Here's what I'm thinking about tribal..." Strategic whispers.`,
];

const BEAT_TRANS_SCAVENGE = [
  `${host()} flung open the cargo hold doors. "You've got two minutes to grab whatever you can carry. GO!"`,
  `The contestants stampeded toward the cargo hold. Crates flew open. Supplies scattered. Pure chaos.`,
  `"RAID THE HOLD!" ${host()} shouted. Players dove into mountains of junk, hunting for building materials.`,
  `A mountain of crates, tarps, and mystery supplies awaited. "First come, first served," ${host()} grinned.`,
];
const BEAT_TRANS_BUILD = [
  `${host()} checked ${host()}'s watch. "Supply run OVER! Time to build!" The cargo hold doors slammed shut.`,
  `"Clock's ticking, people!" ${host()} tapped the timer overhead. "Your dinosaurs aren't going to build themselves."`,
  `The real work began. Bones clattered against worktables as everyone raced to assemble their creations.`,
  `"BUILD PHASE!" ${host()} announced. Worktables were cluttered with bones and dubious craft supplies.`,
];
const BEAT_TRANS_FINISHING = [
  `"Last chance for finishing touches!" ${host()} announced. "Make 'em count — these builds are about to be JUDGED."`,
  `The timer flashed red. "FINAL MINUTES!" ${host()} shouted. Panic spread through the tent.`,
  `"Wrap it up, people! Thirty seconds!" Hands flew. Glue dripped. One dinosaur lost its head. Literally.`,
  `${host()} started the countdown. "Ten... nine..." Everyone scrambled for last-second fixes.`,
];

const VOTE_SHOCK_TEXT = [
  (n, pr) => `${n} tried to vote strategically but the lie detector BUZZED! "${pr.Sub}—I—WHAT?!" ${n} was forced to reveal ${pr.posAdj} true pick.`,
  (n, pr) => `The chair sparked violently as ${n} attempted deception! "LIAR!" the machine screamed. ${n}'s actual vote was displayed.`,
  (n, pr) => `${n} opened ${pr.posAdj} mouth to lie and got ZAPPED. "OW! Fine! FINE!" ${pr.Sub} admitted ${pr.posAdj} real choice.`,
  (n, pr) => `Smoke poured from the electrodes as ${n} tried to deceive. The machine was NOT having it.`,
  (n, pr) => `${n} said one name but the display showed another. "That machine is RIGGED!" No it isn't.`,
  (n, pr) => `The polygraph needle went haywire. ${n} was CAUGHT. ${pr.posAdj} true vote revealed itself.`,
];

const VOTE_HONEST_TEXT = [
  (n, target, pr) => `${n} voted for ${target}. The lie detector hummed quietly. Truth confirmed.`,
  (n, target, pr) => `${n} chose ${target}. No shock. Honest answer.`,
  (n, target, pr) => `"${target}," ${n} said clearly. The machine stayed calm. ${pr.Sub} meant it.`,
  (n, target, pr) => `${n} cast ${pr.posAdj} vote for ${target}. The needle barely moved. Truthful.`,
  (n, target, pr) => `${n} pointed at ${target}. The electrodes didn't even twitch. Genuine pick.`,
  (n, target, pr) => `"My vote goes to ${target}." ${n}'s voice was steady. The detector confirmed: honest.`,
];

const DIG_START_TEXT = [
  () => `${host()} led the group to the Drumheller badlands — a vast canyon of red rock and exposed strata.`,
  () => `The canyon walls rose on either side, striped with millions of years of geological history.`,
  () => `Somewhere in this ancient riverbed, a barrel was buried. First to find it wins.`,
  () => `Dust devils swirled between the fossil beds. The dig was on.`,
  () => `${host()} handed out the tools. "Dig deep, dig fast. There's a barrel down there somewhere."`,
  () => `The badlands stretched endlessly — layers of sandstone, clay, and secrets.`,
];

const DIG_PROGRESS_TEXT = [
  (n, pr, tool) => `${n} drove ${pr.posAdj} ${tool} into the hardpack, sending chips of sandstone flying.`,
  (n, pr, tool) => `${n} worked ${pr.posAdj} site methodically, ${pr.posAdj} ${tool} biting into the earth.`,
  (n, pr, tool) => `Sweat dripped from ${n}'s brow as ${pr.sub} swung ${pr.posAdj} ${tool} into the canyon floor.`,
  (n, pr, tool) => `${n} found a soft layer and ${pr.posAdj} ${tool} sank deep. Progress.`,
  (n, pr, tool) => `${n}'s ${tool} struck something hard — just a rock. ${pr.Sub} kept digging.`,
  (n, pr, tool) => `${n} grunted with effort, ${pr.posAdj} ${tool} carving through ancient sediment.`,
  (n, pr, tool) => `Dust clouds rose as ${n} attacked ${pr.posAdj} site with ${pr.posAdj} ${tool}.`,
  (n, pr, tool) => `${n} hit a clay pocket and made excellent progress, ${pr.posAdj} ${tool} sliding through easily.`,
  // technique
  (n, pr, tool) => `${n} switched grip on ${pr.posAdj} ${tool}, angling it sideways. The new technique cut deeper.`,
  (n, pr, tool) => `${n} found ${pr.posAdj} rhythm — short, sharp strikes with the ${tool}. Dirt flew in steady arcs.`,
  (n, pr, tool) => `${n} adjusted ${pr.posAdj} strategy, working in a spiral pattern. The ${tool} bit clean every swing.`,
  // discovery
  (n, pr, tool) => `${n}'s ${tool} cracked through a clay seam — amber-red earth crumbled away in chunks.`,
  (n, pr, tool) => `${n} hit a layer of fossilized shell fragments. Beautiful, but not the barrel. ${pr.Sub} pushed through.`,
  (n, pr, tool) => `${n}'s ${tool} scraped across a vein of dark rock. A new stratum — deeper than anyone else had reached.`,
  // effort
  (n, pr, tool) => `${n}'s arms burned but ${pr.sub} refused to slow down. The ${tool} kept swinging.`,
  (n, pr, tool) => `A second wind hit ${n} — ${pr.sub} attacked the earth with renewed fury, ${tool} a blur.`,
  (n, pr, tool) => `${n} wiped dust from ${pr.posAdj} eyes, took one breath, and drove the ${tool} down again. Relentless.`,
];

const BOULDER_HIT_TEXT = [
  (n, pr) => `A boulder broke loose from the cliff face and CRUSHED ${n}'s dig site! ${pr.Sub} was trapped!`,
  (n, pr) => `CRASH! Falling rocks buried ${n} up to ${pr.posAdj} waist! ${pr.Sub} couldn't move!`,
  (n, pr) => `The canyon wall crumbled and ${n} disappeared under a pile of rubble!`,
  (n, pr) => `A landslide caught ${n} off-guard — rocks pinned ${pr.posAdj} legs to the ground!`,
  (n, pr) => `${n} looked up just in time to see the boulder — but not in time to dodge. TRAPPED.`,
  (n, pr) => `The earth shifted and rocks cascaded onto ${n}! ${pr.Sub} was buried from the waist down!`,
];

const BOULDER_DODGE_TEXT = [
  (n, pr) => `${n} heard the crack above and DOVE sideways! The boulder smashed where ${pr.sub} had been standing!`,
  (n, pr) => `${n} spotted the falling rocks and rolled clear just in time! Close call!`,
  (n, pr) => `${n}'s instincts kicked in — ${pr.sub} leapt back as the rockslide crashed down!`,
  (n, pr) => `${n} dodged! The boulder whizzed past ${pr.posAdj} head by inches!`,
  (n, pr) => `${n} saw the shadow and jumped. The rocks exploded behind ${pr.obj}. "THAT WAS CLOSE!"`,
  (n, pr) => `Quick reflexes saved ${n} as ${pr.sub} sidestepped the falling debris!`,
];

const RESCUE_TEXT = [
  (rescuer, trapped, rpr) => `${rescuer} dropped everything and sprinted to ${trapped}'s side! ${rpr.Sub} hauled rocks off one by one!`,
  (rescuer, trapped, rpr) => `${rescuer} saw ${trapped} struggling and ran to help! "Hang on!" ${rpr.sub} pulled ${trapped} free!`,
  (rescuer, trapped, rpr) => `Without hesitation, ${rescuer} abandoned ${rpr.posAdj} dig to rescue ${trapped}!`,
  (rescuer, trapped, rpr) => `${rescuer} threw ${rpr.posAdj} tool aside and dug ${trapped} out with bare hands!`,
  (rescuer, trapped, rpr) => `"I got you!" ${rescuer} cleared the rubble from ${trapped} in record time!`,
  (rescuer, trapped, rpr) => `${rescuer} sacrificed ${rpr.posAdj} lead to pull ${trapped} from the rocks!`,
];

const IGNORE_TEXT = [
  (ignorer, trapped) => `${ignorer} glanced at ${trapped}'s predicament... and kept digging.`,
  (ignorer, trapped) => `${ignorer} heard ${trapped}'s calls for help. ${ignorer} pretended not to.`,
  (ignorer, trapped) => `${trapped} struggled under the rocks. ${ignorer} was too focused on ${ignorer}'s own site to notice. Allegedly.`,
  (ignorer, trapped) => `${ignorer} looked away from ${trapped}. "Every second counts," ${ignorer} muttered.`,
];

const BARREL_FIND_TEXT = [
  (n, pr) => `${n}'s ${pr.posAdj} tool struck metal! A hollow CLANG echoed through the canyon! THE BARREL!`,
  (n, pr) => `The earth gave way and there it was — a rusted oil barrel! ${n} FOUND IT!`,
  (n, pr) => `${n} felt something solid and dug frantically — BARREL! "I GOT IT! I GOT IT!"`,
  (n, pr) => `A flash of rusted metal under the sandstone — ${n} had found the barrel!`,
  (n, pr) => `${n} pulled back a layer of clay and gasped. The barrel. Right there. IMMUNITY.`,
  (n, pr) => `${n}'s fingers scraped across metal. ${pr.Sub} dug faster. It was THE BARREL!`,
];

const SOCIAL_DIG_TEXT = {
  showmance: [
    (a, b) => `${a} and ${b} shared a water break, fingers brushing over the canteen. The canyon heat wasn't the only warmth.`,
    (a, b) => `${a} wiped dust from ${b}'s face. "You've got dirt... everywhere." They both laughed.`,
    (a, b) => `${b} found a heart-shaped rock and tossed it to ${a}. "Fossil of our love." Eye-rolls from everyone.`,
    (a, b) => `${a} and ${b} dug side by side, stealing glances between swings. The canyon was romantic, somehow.`,
  ],
  rivalry: [
    (a, b) => `${a} and ${b} locked eyes across the dig site. ${a} dug harder. So did ${b}. It was ON.`,
    (a, b) => `${b} "accidentally" kicked dirt into ${a}'s hole. ${a} returned the favor with interest.`,
    (a, b) => `"Nice technique," ${a} sneered at ${b}. "Did you learn that at LOSER school?"`,
    (a, b) => `${a} side-eyed ${b}'s progress and picked up the pace. No way ${b} was winning this.`,
  ],
  coprolite: [
    (n, pr) => `${n} found something round in the dirt. "A dinosaur egg!" Nope. Fossilized dino dung. ${pr.Sub} screamed.`,
    (n, pr) => `${n} unearthed what ${pr.sub} thought was a gem. It was 65-million-year-old poop. ${pr.Sub} dropped it.`,
    (n, pr) => `"I found a fossil!" ${n} announced proudly. ${host()}: "That's coprolite." ${n}: "What's—" ${host()}: "Dino poop."`,
    (n, pr) => `${n} cracked open a rock to find coprolite. "It's ANCIENT dung!" ${pr.Sub} was oddly impressed.`,
  ],
  toolEnvy: [
    (have, haveNot, tool) => `${haveNot} eyed ${have}'s ${tool} jealously. "Trade you?" ${have}: "Not a chance."`,
    (have, haveNot, tool) => `${have}'s ${tool} tore through earth while ${haveNot} struggled. "Life isn't fair," ${have} smirked.`,
    (have, haveNot, tool) => `"That ${tool} should be MINE," ${haveNot} muttered, watching ${have} make easy progress.`,
    (have, haveNot, tool) => `${haveNot} glanced at ${have}'s ${tool}. Then at ${haveNot}'s bare hands. ${haveNot} sighed dramatically.`,
  ],
};

const ATMOSPHERE_BUILD = [
  `The paleontology tent fluttered in the canyon breeze. Bone fragments littered the workstations.`,
  `Reference charts of dinosaur skeletons hung from the tent poles, covered in dust.`,
  `A timer ticked overhead. Bones clattered against worktables.`,
  `The smell of ancient earth filled the air. This was REAL archaeology. Sort of.`,
  `${host()} circled the stations like a museum critic. "Fascinating. Terrible. Fascinating."`,
  `Somewhere in the distance, a coyote howled. The canyon was alive with history.`,
  `Trowels scraped. Bones clicked into place. The competition was silent and intense.`,
  `A fossil expert watched from the sidelines, wincing at the bone placement choices.`,
  `The desert sun beat down on the dig site. Sweat and determination in equal measure.`,
  `Layers of sandstone told stories millions of years old. Today they'd tell one more.`,
];

const ATMOSPHERE_VOTE = [
  `The lie-detector chair hummed with menacing electricity. Wires snaked across the platform.`,
  `A spotlight bore down on the chair. There was no hiding from the truth here.`,
  `The polygraph needles twitched with anticipation. Someone was about to get CAUGHT.`,
  `${host()} adjusted the electrodes with entirely too much enjoyment. "This won't hurt. Much."`,
  `The truth machine whirred. Its accuracy rate: 100%. Its mercy rate: 0%.`,
  `Nervous laughter rippled through the group. Nobody liked the look of those wires.`,
  `The chair crackled. A small spark jumped between electrodes. "That's normal," ${host()} assured nobody.`,
  `The canyon echoed with the machine's ominous buzzing. Honesty was the only option.`,
  `Someone gulped audibly. The lie detector seemed to GROW more menacing.`,
  `Blue-green light pulsed from the machine's core. It was almost alive. Almost hungry for lies.`,
];

const VOTE_APPROACH_TEXT = [
  (n, pr) => `${n} strode to the chair like ${pr.sub} owned the place. No fear.`,
  (n, pr) => `${n} sat in the chair gingerly, eyeing the electrodes. "${pr.Sub}... do those HURT?"`,
  (n, pr) => `${n} dropped into the chair with a confident grin. "Let's do this."`,
  (n, pr) => `${n} approached the chair like it might bite. ${pr.Sub} lowered ${pr.ref} in slowly, gripping the armrests.`,
  (n, pr) => `${n} practically swaggered to the platform. The wires didn't scare ${pr.obj} one bit.`,
  (n, pr) => `${n} took a deep breath and sat down. ${pr.PosAdj} hands were shaking, but ${pr.posAdj} voice was steady.`,
  (n, pr) => `${n} eyed the chair like an old enemy. ${pr.Sub} sat. The electrodes hummed.`,
  (n, pr) => `"Do I HAVE to sit in that?" ${n} asked. ${host()}: "Yes." ${n} sat.`,
];

const VOTE_REASON_TEXT = {
  quality: [
    (voter, target) => `"${target}'s dinosaur was genuinely impressive," ${voter} admitted.`,
    (voter, target) => `"Best build out there. Gotta be honest — ${target} earned it," ${voter} said.`,
    (voter, target) => `${voter} had no hesitation. ${target}'s work spoke for itself.`,
    (voter, target) => `"Quality is quality," ${voter} shrugged. "${target} built the best one."`,
    (voter, target) => `${voter} pointed at ${target}'s creation. "THAT is a dinosaur."`,
    (voter, target) => `"I mean, look at it," ${voter} gestured at ${target}'s build. "Obviously."`,
  ],
  alliance: [
    (voter, target) => `${voter} voted for ${target}. Alliance loyalty runs deep.`,
    (voter, target) => `"${target} has had my back," ${voter} said simply. "I have ${target}'s."`,
    (voter, target) => `${voter} glanced at ${target} and nodded. They had an understanding.`,
    (voter, target) => `${voter} didn't even have to think. ${target} was the obvious choice — they're tight.`,
    (voter, target) => `"We look out for each other," ${voter} said, voting for ${target}.`,
    (voter, target) => `${voter} kept ${pronouns(voter).posAdj} word. ${target} got the vote. Alliance first.`,
  ],
  grudge: [
    (voter, target) => `${voter} refused to vote for certain people. Not after what happened. ${target} was the safe pick.`,
    (voter, target) => `"I'd rather eat coprolite than vote for THEM," ${voter} muttered, choosing ${target} instead.`,
    (voter, target) => `${voter}'s jaw tightened. ${pronouns(voter).Sub} voted for ${target} — anyone but the enemy.`,
    (voter, target) => `Old grudges shaped ${voter}'s choice. ${target} got the vote by process of elimination.`,
    (voter, target) => `${voter} made ${pronouns(voter).posAdj} choice with spite in ${pronouns(voter).posAdj} eyes. ${target}.`,
    (voter, target) => `"Some people don't deserve votes," ${voter} said coldly. "${target} does."`,
  ],
  strategic: [
    (voter, target) => `${voter} weighed the options carefully. "${target}," ${voter} decided. Strategy.`,
    (voter, target) => `${voter} calculated the angles. Voting for ${target} was the optimal play.`,
    (voter, target) => `This wasn't about friendship. ${voter} voted for ${target} because it was smart.`,
    (voter, target) => `${voter}'s eyes darted around before settling. "${target}." A chess move, not a compliment.`,
    (voter, target) => `"Nothing personal," ${voter} said to nobody in particular. ${target} got the vote.`,
    (voter, target) => `${voter} voted with ${pronouns(voter).posAdj} head, not ${pronouns(voter).posAdj} heart. ${target}.`,
  ],
};

const VOTE_HONEST_REACTION = [
  () => `The crowd nodded. Fair pick.`,
  () => `${host()} marked the board. "Noted."`,
  () => `A murmur of agreement rippled through the group.`,
  () => `No surprises there. The machine hummed quietly.`,
  () => `${host()} gave a noncommittal grunt. "Moving on."`,
  () => `The polygraph barely registered. Clean as a whistle.`,
  () => `Someone in the back whispered, "Called it."`,
  () => `The crowd absorbed the vote in silence.`,
];

const VOTE_SHOCK_REACTION = [
  (n) => `The entire group WINCED. That looked painful.`,
  (n) => `"HAHAHAHA!" ${host()} was having the time of ${host()}'s life.`,
  (n) => `Gasps erupted. ${n} sat there, smoking slightly.`,
  (n) => `Several people covered their mouths. That was BRUTAL.`,
  (n) => `${host()} wiped away a tear of joy. "Never gets old."`,
  (n) => `The machine settled back to a smug hum. Another liar caught.`,
  (n) => `"That's what happens when you LIE," ${host()} beamed at the cameras.`,
  (n) => `The smell of singed hair filled the tent. ${n} patted ${pronouns(n).posAdj} head.`,
];

const VOTE_ZERO_TEXT = [
  (n, pr) => `${n}'s dinosaur received exactly zero votes. ${pr.Sub} stared at the ground.`,
  (n, pr) => `Not a single person voted for ${n}. The silence was deafening.`,
  (n, pr) => `Zero. ${n} got ZERO votes. ${pr.Sub} forced a smile. "I voted for me," ${pr.sub} mumbled.`,
  (n, pr) => `Nobody picked ${n}'s build. ${pr.Sub} pretended not to care. ${pr.Sub} cared.`,
  (n, pr) => `${n} watched every vote land elsewhere. ${pr.PosAdj} dinosaur stood alone. Unloved.`,
  (n, pr) => `The final tally was in. ${n}: zero. ${pr.Sub} folded ${pr.posAdj} arms and stared into the distance.`,
  (n, pr) => `${n}'s creation inspired exactly nobody. ${pr.Sub} made a mental note of everyone who didn't vote for ${pr.obj}.`,
  (n, pr) => `"Really? NOBODY?" ${n} looked genuinely hurt. The group avoided eye contact.`,
];

const ATMOSPHERE_DIG = [
  `Canyon wind whistled through the badlands, carrying dust and ancient whispers.`,
  `The red cliffs towered overhead, striped with eons of geological time.`,
  `Distant thunder rumbled. Or was that another rockslide?`,
  `Shovels clinked against stone. The rhythm of the dig was hypnotic.`,
  `A hawk circled overhead, watching the chaos below with prehistoric patience.`,
  `The canyon floor was a patchwork of excavation sites — holes everywhere.`,
  `Dust devils danced between the dig stations like ghostly spectators.`,
  `The sun cast long shadows through the hoodoos. Time was running out.`,
  `Ancient riverbeds crisscrossed the canyon floor. The barrel could be in any of them.`,
  `Somewhere deep in the earth, metal waited to be found. The race was relentless.`,
];

const SELF_FREE_TEXT = [
  (n, pr) => `${n} FINALLY wrenched ${pr.ref} free from the rubble! Battered but back in the race!`,
  (n, pr) => `After desperate clawing, ${n} pulled ${pr.posAdj} legs out from under the rocks! ${pr.Sub} staggered upright.`,
  (n, pr) => `${n} dug ${pr.ref} out one painful inch at a time. "Nobody's... stopping me..." ${pr.sub} gasped.`,
  (n, pr) => `The rocks shifted and ${n} squeezed free! Dusty, bruised, and FURIOUS. ${pr.Sub} grabbed ${pr.posAdj} tool.`,
  (n, pr) => `${n} refused to stay buried. ${pr.Sub} shoved the last boulder aside and rose, shaking dirt from ${pr.posAdj} hair.`,
  (n, pr) => `Pure stubbornness pulled ${n} from the collapse. ${pr.Sub} was limping but still digging.`,
];

const RESCUE_DILEMMA_TEXT = {
  hero: [
    (rescuer, trapped, rpr) => `${rescuer} didn't even think. ${rpr.Sub} was already running.`,
    (rescuer, trapped, rpr) => `${rescuer} heard ${trapped}'s shout and ${rpr.posAdj} body moved before ${rpr.posAdj} brain caught up.`,
    (rescuer, trapped, rpr) => `"COMING!" ${rescuer} dropped ${rpr.posAdj} tool mid-swing. Some things matter more than winning.`,
    (rescuer, trapped, rpr) => `${rescuer}'s eyes locked on ${trapped} under the rubble. The barrel could wait. This couldn't.`,
    (rescuer, trapped, rpr) => `${rescuer} was sprinting before the dust even settled. That's just who ${rpr.sub} is.`,
    (rescuer, trapped, rpr) => `No hesitation. No calculation. ${rescuer} saw someone in trouble and moved.`,
  ],
  villain_saves: [
    (rescuer, trapped, rpr) => `${rescuer} hesitated. Save ${trapped} and lose ground? But the jury was watching...`,
    (rescuer, trapped, rpr) => `${rescuer} paused. ${rpr.Sub} looked at ${rpr.posAdj} dig site, then at ${trapped}. "...This better be worth it."`,
    (rescuer, trapped, rpr) => `${rescuer}'s first instinct was to keep digging. ${rpr.PosAdj} second was to calculate what saving ${trapped} was worth in jury votes.`,
    (rescuer, trapped, rpr) => `${rescuer} weighed the optics. Help ${trapped}, look heroic. Ignore ${trapped}, look cold. ${rpr.Sub} chose the camera-friendly option.`,
    (rescuer, trapped, rpr) => `"This is a STRATEGIC rescue," ${rescuer} muttered, already jogging toward ${trapped}. "Remember this."`,
    (rescuer, trapped, rpr) => `${rescuer} sighed. Saving ${trapped} meant ${trapped} owed ${rpr.obj}. A debt ${rescuer} fully intended to collect.`,
  ],
  strategic: [
    (rescuer, trapped, rpr) => `${rescuer} calculated the odds. Saving ${trapped} meant ${trapped} owed ${rpr.obj}. Worth it.`,
    (rescuer, trapped, rpr) => `${rescuer} did the math mid-stride. Lost time vs. gained loyalty. The numbers worked.`,
    (rescuer, trapped, rpr) => `${rescuer} glanced at the other dig sites. Nobody else was close. ${rpr.Sub} could afford the detour.`,
    (rescuer, trapped, rpr) => `"Alliance investment," ${rescuer} rationalized, changing course toward ${trapped}. Smart play.`,
    (rescuer, trapped, rpr) => `${rescuer} saw the trapped player and the opportunity simultaneously. Help now, cash in later.`,
    (rescuer, trapped, rpr) => `${rescuer} wasn't being kind — ${rpr.sub} was being tactical. But ${trapped} wouldn't know the difference.`,
  ],
};

const DIG_CONFRONTATION_TEXT = [
  (a, b, pr) => `${a} suddenly whirled on ${b}. "STOP following me! Find your OWN site!" The canyon went silent.`,
  (a, b, pr) => `Something snapped in ${a}. "${b}, if you come near my dig one more time—" ${pr.Sub} didn't finish the sentence. Didn't need to.`,
  (a, b, pr) => `${a} slammed ${pr.posAdj} tool down and got in ${b}'s face. "We have a PROBLEM, you and me." ${b} didn't back down.`,
  (a, b, pr) => `"You're DELIBERATELY digging next to me!" ${a} shouted at ${b}. The accusation echoed off the canyon walls.`,
  (a, b, pr) => `${a} kicked dirt toward ${b}'s site. "Oops." The look on ${b}'s face said this wasn't over.`,
  (a, b, pr) => `${a} snapped. "Every time I look up, there you are. ${b}, I swear—" ${host()} stepped between them.`,
  (a, b, pr) => `The tension finally broke. ${a} pointed ${pr.posAdj} tool at ${b}. "Stay. Away. From. My. Dig." Each word a threat.`,
];

const BOULDER_LAUNCH_TEXT = [
  () => `"INCOMING!" Chef launched another boulder from the cliff. He was having too much fun.`,
  () => `${host()} signaled Chef. The trebuchet creaked. THOOM.`,
  () => `A shadow fell across the canyon floor. Someone looked up. "Oh no—"`,
  () => `The cliff groaned. Rocks shifted. Everyone froze for one terrible second.`,
  () => `"HEADS UP!" ${host()} shouted from the observation deck, barely hiding a grin.`,
  () => `Chef loaded another boulder. "Fire in the hole!" The canyon rumbled.`,
  () => `A crack echoed from above. The canyon wall was shedding again.`,
  () => `${host()} pressed a comically large red button. Somewhere above, something heavy started rolling.`,
];

const TOOL_NAMES = { 3: 'Post Digger', 2: 'Prospector Kit', 1: 'Bucket', 0: 'bare hands' };

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateDrumheller(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  // ══ PHASE 1: DESIGN-O-SAURUS ══
  const builds = {};
  const usedDinoNames = [];
  for (const name of active) {
    const dn = pick(DINO_NAMES.filter(d => !usedDinoNames.includes(d))) || pick(DINO_NAMES);
    usedDinoNames.push(dn);
    builds[name] = { quality: 0, desc: '', dinoName: dn, events: [], suppliesFound: [] };
  }

  // ── Beat 1: Supply Scavenge ──
  // Clear used text tracker for fresh picks
  _usedTexts.clear();
  const usedSupplies = [];
  const villains = active.filter(n => VILLAIN.has(arch(n)));
  const niceOnes = active.filter(n => NICE.has(arch(n)));
  const beat1Events = [];
  const scavengeOrder = [...active].sort(() => Math.random() - 0.5);

  // Each player gets ONE consolidated scavenge card
  for (const name of scavengeOrder) {
    const s = pStats(name);
    const pr = pronouns(name);
    const scavengeSkill = s.mental * 0.5 + s.intuition * 0.5 + noise(2.5);
    const goodFind = scavengeSkill > 7;
    const avail = SUPPLY_ITEMS.filter(i => !usedSupplies.includes(i));

    if (goodFind) {
      const item1 = avail.length > 0 ? pick(avail) : pick(SUPPLY_ITEMS);
      usedSupplies.push(item1);
      const avail2 = SUPPLY_ITEMS.filter(i => !usedSupplies.includes(i));
      const item2 = avail2.length > 0 ? pick(avail2) : null;
      if (item2) usedSupplies.push(item2);
      builds[name].quality += 1.2 + Math.random() * 0.8;
      builds[name].suppliesFound.push(item1);
      if (item2) builds[name].suppliesFound.push(item2);
      const itemStr = item2 ? `${item1} and ${item2}` : item1;
      beat1Events.push({ type: 'supply-find', beat: 1, text: pickU(BUILD_SUPPLY_FIND_GOOD)(name, pr, itemStr), delta: '+', player: name });
    } else {
      const item = avail.length > 0 ? pick(avail) : pick(SUPPLY_ITEMS);
      usedSupplies.push(item);
      builds[name].quality += 0.3 + Math.random() * 0.3;
      builds[name].suppliesFound.push(item);
      beat1Events.push({ type: 'supply-find-bad', beat: 1, text: pickU(BUILD_SUPPLY_FIND_BAD)(name, pr), delta: '-', player: name });
    }

    // Interleave a social event after the 2nd and 4th scavenger
    const idx = scavengeOrder.indexOf(name);
    if (idx === 1 && villains.length > 0 && Math.random() < 0.7) {
      const thief = pick(villains);
      const victims = scavengeOrder.slice(0, idx + 1).filter(n => n !== thief && builds[n].suppliesFound.length > 0);
      if (victims.length > 0) {
        const victim = pick(victims);
        const stolenItem = pick(builds[victim].suppliesFound) || pick(SUPPLY_ITEMS);
        const prT = pronouns(thief);
        builds[thief].quality += 1.2;
        builds[victim].quality -= 1.2;
        addBond(thief, victim, -1.5);
        popDelta(thief, -1);
        const evObj = { type: 'supply-steal', beat: 1, text: pickU(BUILD_SUPPLY_STEAL)(thief, victim, prT, stolenItem), players: [thief, victim], thief, victim };
        beat1Events.push(evObj);
        ep.campEvents[campKey].post.push({
          text: `${thief} stole ${stolenItem} from ${victim}'s workstation during the supply scavenge!`,
          players: [thief, victim], badgeText: 'STOLEN', badgeClass: 'red', tag: 'drumheller',
        });
      }
    }
    if (idx === 3 && niceOnes.length > 0 && Math.random() < 0.6) {
      const helper = pick(niceOnes);
      const friends = active.filter(n => n !== helper && getBond(helper, n) >= 1);
      const target = friends.length > 0 ? pick(friends) : pick(active.filter(n => n !== helper));
      const prH = pronouns(helper);
      builds[helper].quality += 0.4;
      builds[target].quality += 0.8;
      addBond(helper, target, 1.0);
      popDelta(helper, 1);
      beat1Events.push({ type: 'help-build', beat: 1, text: pickU(BUILD_HELP)(helper, target, prH), players: [helper, target], helper, target });
    }
  }

  // ── Beat 2: Build Process ──
  for (const name of active) {
    const s = pStats(name);
    const baseQuality = s.mental * 0.35 + s.boldness * 0.25 + noise(2.5);
    builds[name].quality += clamp(baseQuality, 1, 6);
  }

  // Beat 2 social events (2-3 events, each player max 1 appearance)
  const beat2Events = [];
  const numBeat2Events = 2 + (Math.random() < 0.4 ? 1 : 0);
  const eventTypes = [];
  if (villains.length > 0) eventTypes.push('sabotage');
  eventTypes.push('argument');
  if (niceOnes.length > 0) eventTypes.push('encourage');
  const schemers = active.filter(n => {
    const a = arch(n);
    if (VILLAIN.has(a)) return true;
    if (!NICE.has(a)) { const st = pStats(n); return st.strategic * 1 >= 6 && st.loyalty * 1 <= 4; }
    return false;
  });
  if (schemers.length >= 2) eventTypes.push('scheme-convo');
  const activeShowmances = (gs.showmances || []).filter(sh => !sh.broken && active.includes(sh.a) && active.includes(sh.b));
  if (activeShowmances.length > 0) eventTypes.push('showmance-build');

  const usedPlayersB2 = new Set();
  const usedTypesB2 = new Set();
  for (let ei = 0; ei < numBeat2Events; ei++) {
    const availTypes = eventTypes.filter(t => !usedTypesB2.has(t));
    if (availTypes.length === 0) break;
    const etype = pick(availTypes);
    usedTypesB2.add(etype);
    if (etype === 'sabotage') {
      const sab = pick(villains.filter(v => !usedPlayersB2.has(v)));
      if (!sab) continue;
      const victims2 = active.filter(n => n !== sab && !usedPlayersB2.has(n));
      if (victims2.length === 0) continue;
      const victim = pick(victims2);
      usedPlayersB2.add(sab); usedPlayersB2.add(victim);
      const prS = pronouns(sab);
      builds[victim].quality -= 1.5 + Math.random() * 0.5;
      addBond(sab, victim, -2.0);
      popDelta(sab, -2);
      popDelta(victim, 1);
      const evObj = { type: 'sabotage', beat: 2, text: pickU(BUILD_SABOTAGE)(sab, victim, prS), players: [sab, victim], saboteur: sab, victim };
      beat2Events.push(evObj);
      builds[sab].events.push(evObj);
      builds[victim].events.push(evObj);
      ep.campEvents[campKey].post.push({
        text: `${sab} sabotaged ${victim}'s dinosaur build during Design-o-Saurus!`,
        players: [sab, victim], badgeText: 'SABOTAGE', badgeClass: 'red', tag: 'drumheller',
      });
    } else if (etype === 'argument') {
      const avail = active.filter(n => !usedPlayersB2.has(n));
      const pair = [...avail].sort(() => Math.random() - 0.5).slice(0, 2);
      if (pair.length < 2) continue;
      usedPlayersB2.add(pair[0]); usedPlayersB2.add(pair[1]);
      builds[pair[0]].quality -= 0.4 + Math.random() * 0.3;
      builds[pair[1]].quality -= 0.4 + Math.random() * 0.3;
      addBond(pair[0], pair[1], -0.8);
      const evObj = { type: 'argument', beat: 2, text: pickU(BUILD_ARGUMENT)(pair[0], pair[1]), players: pair };
      beat2Events.push(evObj);
      builds[pair[0]].events.push(evObj);
      builds[pair[1]].events.push(evObj);
    } else if (etype === 'encourage') {
      const enc = pick(niceOnes.filter(n => !usedPlayersB2.has(n)));
      if (!enc) continue;
      const targets = active.filter(n => n !== enc && !usedPlayersB2.has(n));
      if (targets.length === 0) continue;
      const target = pick(targets);
      usedPlayersB2.add(enc); usedPlayersB2.add(target);
      const prE = pronouns(enc);
      builds[target].quality += 0.8 + Math.random() * 0.4;
      addBond(enc, target, 1.0);
      popDelta(enc, 1);
      const evObj = { type: 'encourage', beat: 2, text: pickU(BUILD_ENCOURAGE)(enc, target, prE), players: [enc, target], encourager: enc, target };
      beat2Events.push(evObj);
      builds[enc].events.push(evObj);
      builds[target].events.push(evObj);
    } else if (etype === 'scheme-convo') {
      const pair = [...schemers].filter(n => !usedPlayersB2.has(n)).sort(() => Math.random() - 0.5).slice(0, 2);
      if (pair.length < 2) continue;
      usedPlayersB2.add(pair[0]); usedPlayersB2.add(pair[1]);
      addBond(pair[0], pair[1], 0.5);
      const evObj = { type: 'scheme-convo', beat: 2, text: pickU(BUILD_SCHEME)(pair[0], pair[1]), players: pair };
      beat2Events.push(evObj);
      builds[pair[0]].events.push(evObj);
      builds[pair[1]].events.push(evObj);
    } else if (etype === 'showmance-build') {
      const sh = pick(activeShowmances.filter(s => !usedPlayersB2.has(s.a) && !usedPlayersB2.has(s.b)));
      if (!sh) continue;
      usedPlayersB2.add(sh.a); usedPlayersB2.add(sh.b);
      builds[sh.a].quality += 0.6;
      builds[sh.b].quality += 0.6;
      addBond(sh.a, sh.b, 1.5);
      popDelta(sh.a, 1);
      popDelta(sh.b, 1);
      _checkShowmanceChalMoment(sh.a, sh.b, null, null);
      const evObj = { type: 'showmance-build', beat: 2, text: pickU(BUILD_SHOWMANCE)(sh.a, sh.b), players: [sh.a, sh.b] };
      beat2Events.push(evObj);
      builds[sh.a].events.push(evObj);
      builds[sh.b].events.push(evObj);
    }
  }

  // ── Beat 3: Finishing Touches ──
  const beat3Events = [];
  // Coprolite discovery (1 player, 30% chance of a 2nd)
  const coproliteVictims = [...active].sort(() => Math.random() - 0.5).slice(0, 1 + (Math.random() < 0.3 ? 1 : 0));
  for (const name of coproliteVictims) {
    const pr = pronouns(name);
    builds[name].quality -= 0.5 + Math.random() * 0.3;
    popDelta(name, 1);
    const evObj = { type: 'coprolite', beat: 3, text: pickU(BUILD_COPROLITE)(name, pr), players: [name], player: name };
    beat3Events.push(evObj);
    builds[name].events.push(evObj);
  }

  // One last-second event: sabotage OR help (not both, 50/50)
  if (Math.random() < 0.5 && villains.length > 0) {
    const sab = pick(villains);
    const victims3 = active.filter(n => n !== sab);
    if (victims3.length > 0) {
      const victim = pick(victims3);
      const prS = pronouns(sab);
      builds[victim].quality -= 1.0;
      addBond(sab, victim, -1.5);
      popDelta(sab, -1);
      const evObj = { type: 'sabotage', beat: 3, text: pickU(BUILD_SABOTAGE)(sab, victim, prS), players: [sab, victim], saboteur: sab, victim };
      beat3Events.push(evObj);
      builds[sab].events.push(evObj);
      builds[victim].events.push(evObj);
      ep.campEvents[campKey].post.push({
        text: `${sab} pulled a last-second sabotage on ${victim}'s dinosaur right before judging!`,
        players: [sab, victim], badgeText: 'LAST-SEC SABOTAGE', badgeClass: 'red', tag: 'drumheller',
      });
    }
  } else if (niceOnes.length > 0) {
    const helper = pick(niceOnes);
    const target = pick(active.filter(n => n !== helper));
    if (target) {
      const prH = pronouns(helper);
      builds[target].quality += 0.6;
      addBond(helper, target, 0.8);
      const evObj = { type: 'help-build', beat: 3, text: pickU(BUILD_HELP)(helper, target, prH), players: [helper, target], helper, target };
      beat3Events.push(evObj);
      builds[helper].events.push(evObj);
      builds[target].events.push(evObj);
    }
  }

  // Showmance romance spark opportunity
  _challengeRomanceSpark(active, null, null);

  // Finalize builds — generate descriptions and clamp quality
  for (const name of active) {
    const a = arch(name);
    let descPool = BUILD_DESC.default;
    if (a === 'challenge-beast') descPool = BUILD_DESC['challenge-beast'];
    else if (a === 'wildcard' || a === 'chaos-agent') descPool = BUILD_DESC.wildcard;
    else if (a === 'social-butterfly' || a === 'showmancer') descPool = BUILD_DESC['social-butterfly'];
    else if (VILLAIN.has(a)) descPool = BUILD_DESC.villain;

    const pr = pronouns(name);
    builds[name].quality = clamp(builds[name].quality, 2, 14);
    builds[name].desc = pick(descPool)(name, pr);
    ep.chalMemberScores[name] += clamp(builds[name].quality, 5, 12);
  }

  // Collect all build events by beat for VP (beat1Events already interleaved)
  const buildPhaseEvents = {
    beat1: beat1Events,
    beat2: beat2Events,
    beat3: beat3Events,
  };

  // ══ LIE-DETECTOR VOTE ══
  const votes = {}; // voter → target
  const voteReasons = {}; // voter → reason category
  const votesReceived = {}; // target → count
  active.forEach(n => { votesReceived[n] = 0; });
  const shockMoments = []; // { voter, triedTarget, actualTarget }

  for (const voter of active) {
    const s = pStats(voter);
    const a = arch(voter);
    const pr = pronouns(voter);

    // Score each potential target
    const candidates = active.filter(n => n !== voter);
    const scored = candidates.map(target => {
      const qualityWeight = builds[target].quality * 0.5;
      const bondWeight = getBond(voter, target) * 0.3;
      // Personality: villains vote for weak to eliminate threats, nice vote for best
      let archWeight = 0;
      if (VILLAIN.has(a)) {
        // Villains want to vote strategically (NOT for best) but get caught
        archWeight = -builds[target].quality * 0.2;
      } else if (NICE.has(a)) {
        archWeight = builds[target].quality * 0.2;
      } else {
        archWeight = noise(1);
      }
      return { target, score: qualityWeight + bondWeight + archWeight + noise(1.5), qualityWeight, bondWeight, archWeight };
    }).sort((a, b) => b.score - a.score);

    const actualTarget = scored[0].target;
    const topScore = scored[0];

    // Determine dominant reason for the vote
    let reason = 'quality';
    if (topScore.bondWeight > topScore.qualityWeight && topScore.bondWeight > Math.abs(topScore.archWeight)) reason = 'alliance';
    else if (getBond(voter, actualTarget) <= -2) reason = 'grudge';
    else if (topScore.archWeight < -1) reason = 'strategic';
    voteReasons[voter] = reason;

    // Villains try to lie → get shocked
    if (VILLAIN.has(a) && Math.random() < 0.7) {
      // They tried to say a different name
      const fakeTarget = scored[Math.min(scored.length - 1, 2 + Math.floor(Math.random() * 2))].target;
      if (fakeTarget !== actualTarget) {
        shockMoments.push({ voter, triedTarget: fakeTarget, actualTarget });
        popDelta(voter, 1); // entertainment value
        ep.campEvents[campKey].post.push({
          text: `${voter} got SHOCKED by the lie detector trying to hide ${pr.posAdj} true vote!`,
          players: [voter], badgeText: 'SHOCKED', badgeClass: 'red', tag: 'drumheller',
        });
      }
    }

    votes[voter] = actualTarget;
    votesReceived[actualTarget] = (votesReceived[actualTarget] || 0) + 1;
  }

  // Vote scoring
  for (const name of active) {
    ep.chalMemberScores[name] += (votesReceived[name] || 0) * 3;
  }

  // Social fallout from votes
  const voteFallout = [];
  for (const voter of active) {
    const target = votes[voter];
    // Betrayal: ally didn't vote for you
    for (const other of active) {
      if (other === voter) continue;
      if (votes[other] !== voter && getBond(voter, other) >= 3) {
        // Voter expected ally 'other' to vote for them
        if (Math.random() < 0.4) { // don't trigger for every pair
          const delta = -(1 + Math.floor(Math.random() * 2));
          addBond(voter, other, delta);
          voteFallout.push({ type: 'betrayal', a: voter, b: other, delta });
          ep.campEvents[campKey].post.push({
            text: `${voter} felt betrayed that ${other} didn't vote for ${pronouns(voter).posAdj} dinosaur.`,
            players: [voter, other], badgeText: 'BETRAYED', badgeClass: 'red', tag: 'drumheller',
          });
        }
      }
    }
    // Grudging respect: enemy voted for you
    if (VILLAIN.has(arch(target)) || getBond(voter, target) <= -2) {
      if (votes[voter] === target || (getBond(target, voter) <= -2 && votes[target] === voter)) {
        // enemy voted for me
      }
    }
  }
  // Check for grudging respect (enemy voted FOR you)
  for (const voter of active) {
    const target = votes[voter];
    if (getBond(voter, target) <= -2) {
      addBond(target, voter, 1);
      voteFallout.push({ type: 'respect', a: target, b: voter });
      if (Math.random() < 0.5) {
        ep.campEvents[campKey].post.push({
          text: `${target} was surprised ${voter} voted for ${pronouns(target).obj}. Grudging respect earned.`,
          players: [target, voter], badgeText: 'RESPECT', badgeClass: 'blue', tag: 'drumheller',
        });
      }
    }
  }
  // Zero votes → popularity hit
  for (const name of active) {
    if (votesReceived[name] === 0) {
      popDelta(name, -2);
      voteFallout.push({ type: 'zero', name });
      ep.campEvents[campKey].post.push({
        text: `Nobody voted for ${name}'s dinosaur. Not a single person. Ouch.`,
        players: [name], badgeText: 'IGNORED', badgeClass: 'grey', tag: 'drumheller',
      });
    }
  }

  // Rank by votes received (tiebreak by quality)
  const voteRanking = [...active].sort((a, b) => {
    if (votesReceived[b] !== votesReceived[a]) return votesReceived[b] - votesReceived[a];
    return builds[b].quality - builds[a].quality;
  });
  const toolBonus = {};
  voteRanking.forEach((name, i) => {
    if (i === 0) toolBonus[name] = 3;
    else if (i === 1) toolBonus[name] = 2;
    else if (i === 2) toolBonus[name] = 1;
    else toolBonus[name] = 0;
  });

  // ══ PHASE 2: BARREL DIG ══
  const digProgress = {};
  const trapped = {}; // name → { round trapped, rescuer? }
  const digEvents = []; // { round, type, ... }
  const roundData = [];
  active.forEach(n => { digProgress[n] = 0; });

  let winner = null;
  const THRESHOLD = 38;
  const maxRounds = 8;

  for (let round = 1; round <= maxRounds && !winner; round++) {
    const roundEvents = [];

    // Dig progress
    for (const name of active) {
      if (trapped[name] && trapped[name].freeRound > round - 1) {
        roundEvents.push({ type: 'still-trapped', name });
        continue;
      }
      // Free from trap (self-freed if no rescuer)
      if (trapped[name] && trapped[name].freeRound <= round - 1) {
        if (!trapped[name].rescuer) {
          roundEvents.push({ type: 'self-freed', name });
        }
        delete trapped[name];
      }

      const s = pStats(name);
      const progress = s.physical * 0.4 + s.endurance * 0.4 + (toolBonus[name] || 0) + noise(2.5);
      digProgress[name] += Math.max(0.5, progress);

      if (digProgress[name] >= THRESHOLD && !winner) {
        winner = name;
        roundEvents.push({ type: 'barrel-found', name });
      } else {
        roundEvents.push({ type: 'dig', name, progress: Math.max(0.5, progress) });
      }
    }

    // Boulder hazard (escalating per round)
    const boulderCount = round <= 1 ? 1 : round <= 2 ? 1 + (Math.random() < 0.4 ? 1 : 0) : round <= 4 ? 2 : 2 + (Math.random() < 0.5 ? 1 : 0);
    for (let b = 0; b < boulderCount && !winner; b++) {
      // Slight bias toward leaders
      const digRanked = active.filter(n => !trapped[n]).sort((a, b) => digProgress[b] - digProgress[a]);
      if (digRanked.length < 2) break;
      const weights = digRanked.map((_, i) => Math.max(1, digRanked.length - i));
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      let r = Math.random() * totalWeight;
      let targetIdx = 0;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) { targetIdx = i; break; }
      }
      const boulderTarget = digRanked[targetIdx];
      const s = pStats(boulderTarget);
      const dodgeChance = (s.physical * 0.3 + s.intuition * 0.3 + noise(2)) / 10;

      if (Math.random() < clamp(dodgeChance, 0.15, 0.7)) {
        roundEvents.push({ type: 'boulder-dodge', name: boulderTarget });
        popDelta(boulderTarget, 1);
      } else {
        trapped[boulderTarget] = { round, freeRound: round + 1 };
        roundEvents.push({ type: 'boulder-hit', name: boulderTarget });

        // Rescue attempts
        const potentialRescuers = active.filter(n => n !== boulderTarget && !trapped[n]);
        let rescued = false;
        for (const rescuer of potentialRescuers) {
          const ra = arch(rescuer);
          const bond = getBond(rescuer, boulderTarget);
          let willRescue = false;

          if (NICE.has(ra)) {
            if (ra === 'hero' || ra === 'loyal-soldier') willRescue = bond >= 0;
            else willRescue = bond >= 2 || (gs.showmances?.some(sh => !sh.broken && ((sh.a === rescuer && sh.b === boulderTarget) || (sh.b === rescuer && sh.a === boulderTarget))));
          } else if (VILLAIN.has(ra)) {
            willRescue = bond >= 5 || (pStats(rescuer).strategic * 0.3 + noise(2) > 4);
          } else {
            willRescue = bond >= 3;
          }

          if (willRescue && !rescued) {
            rescued = true;
            trapped[boulderTarget].freeRound = round; // freed this round
            trapped[boulderTarget].rescuer = rescuer;
            // Rescue dilemma inner monologue
            const ra2 = arch(rescuer);
            let dilemmaCategory = 'strategic';
            if (NICE.has(ra2) && (ra2 === 'hero' || ra2 === 'loyal-soldier')) dilemmaCategory = 'hero';
            else if (VILLAIN.has(ra2)) dilemmaCategory = 'villain_saves';
            roundEvents.push({ type: 'rescue-dilemma', rescuer, trapped: boulderTarget, category: dilemmaCategory });
            // Cost: lose half progress this round
            digProgress[rescuer] -= Math.max(0, (pStats(rescuer).physical * 0.2 + noise(1)));
            // Reward
            addBond(rescuer, boulderTarget, 2);
            addBond(boulderTarget, rescuer, 2);
            popDelta(rescuer, 2);
            roundEvents.push({ type: 'rescue', rescuer, trapped: boulderTarget });
            ep.campEvents[campKey].post.push({
              text: `${rescuer} heroically rescued ${boulderTarget} from a rockslide during the dig!`,
              players: [rescuer, boulderTarget], badgeText: 'RESCUE', badgeClass: 'gold', tag: 'drumheller',
            });
            ep.chalMemberScores[rescuer] += 3;
            // Showmance moment
            if (gs.showmances?.some(sh => !sh.broken && ((sh.a === rescuer && sh.b === boulderTarget) || (sh.b === rescuer && sh.a === boulderTarget)))) {
              _checkShowmanceChalMoment(rescuer, boulderTarget, null, null);
            }
            break;
          }
        }

        // If not rescued, check if trapped player notices ignorers
        if (!rescued) {
          const st = pStats(boulderTarget);
          const noticeChance = (st.mental + st.intuition > 12) ? 0.6 : 0.3;
          for (const ignorer of potentialRescuers) {
            if (Math.random() < noticeChance && getBond(boulderTarget, ignorer) > -5) {
              addBond(boulderTarget, ignorer, -1);
              roundEvents.push({ type: 'ignore-noticed', ignorer, trapped: boulderTarget });
            }
          }
        }
      }
    }

    // Social events between rounds (1-2), tracking used players to prevent duplicates
    const socialCount = 1 + (Math.random() < 0.5 ? 1 : 0);
    const usedSocialPlayers = new Set();
    for (let s = 0; s < socialCount && !winner; s++) {
      const socialType = _pickSocialEvent(active, trapped, toolBonus, usedSocialPlayers);
      if (socialType) {
        roundEvents.push(socialType);
        // Track used players to prevent duplicate pairs
        if (socialType.a) usedSocialPlayers.add(socialType.a);
        if (socialType.b) usedSocialPlayers.add(socialType.b);
        if (socialType.name) usedSocialPlayers.add(socialType.name);
        if (socialType.have) usedSocialPlayers.add(socialType.have);
        if (socialType.haveNot) usedSocialPlayers.add(socialType.haveNot);
        if (socialType.aggressor) usedSocialPlayers.add(socialType.aggressor);
        if (socialType.target) usedSocialPlayers.add(socialType.target);
        // Apply consequences
        if (socialType.type === 'showmance-moment') {
          _checkShowmanceChalMoment(socialType.a, socialType.b, null, null);
        } else if (socialType.type === 'rivalry') {
          addBond(socialType.a, socialType.b, -1);
          popDelta(socialType.a, 1); // entertainment
        } else if (socialType.type === 'coprolite') {
          popDelta(socialType.name, -1);
        } else if (socialType.type === 'tool-envy') {
          addBond(socialType.haveNot, socialType.have, -1);
        } else if (socialType.type === 'confrontation') {
          addBond(socialType.aggressor, socialType.target, -1.5);
          popDelta(socialType.aggressor, -1);
          popDelta(socialType.target, 1); // sympathy
          ep.campEvents[campKey].post.push({
            text: `${socialType.aggressor} snapped at ${socialType.target} during the dig — ugly confrontation.`,
            players: [socialType.aggressor, socialType.target], badgeText: 'CLASH', badgeClass: 'red', tag: 'drumheller',
          });
        }
      }
    }

    roundData.push({ round, events: roundEvents, winner: winner || null });
  }

  // Free any still-trapped players at the end of the dig
  for (const name of active) {
    if (trapped[name]) {
      // Add self-freed to last round's events if still trapped
      const lastRound = roundData[roundData.length - 1];
      if (lastRound) lastRound.events.push({ type: 'self-freed', name });
      delete trapped[name];
    }
  }

  // If nobody found barrel in maxRounds, closest player wins
  if (!winner) {
    winner = active.reduce((best, n) => digProgress[n] > digProgress[best] ? n : best, active[0]);
  }

  // Dig scoring
  const maxDig = Math.max(...active.map(n => digProgress[n]));
  for (const name of active) {
    ep.chalMemberScores[name] += clamp((digProgress[name] / maxDig) * 15, 5, 15);
  }

  // Immunity winner bonus
  const maxOther = Math.max(...active.filter(n => n !== winner).map(n => ep.chalMemberScores[n]));
  ep.chalMemberScores[winner] = maxOther + active.length + 5;

  // Placements
  const chalPlacements = [...active].sort((a, b) => ep.chalMemberScores[b] - ep.chalMemberScores[a]);

  // ══ FINALIZE ══
  ep.challengeData = {
    builds,
    buildPhaseEvents,
    votes,
    voteReasons,
    votesReceived,
    shockMoments,
    voteFallout,
    voteRanking,
    toolBonus,
    digProgress,
    roundData,
    winner,
    immunityWinner: winner,
    active,
  };
  ep.isDrumheller = true;
  ep.challengeType = 'drumheller';
  ep.challengeLabel = 'Awwwwww, Drumheller';
  ep.challengeCategory = 'adventure';
  ep.chalPlacements = chalPlacements;
  ep.immunityWinner = winner;
  ep.tribalPlayers = active;

  updateChalRecord(ep);
}

// ── Social event picker ──
function _pickSocialEvent(active, trapped, toolBonus, usedSocialPlayers) {
  const used = usedSocialPlayers || new Set();
  const freeActive = active.filter(n => !trapped[n] && !used.has(n));
  if (freeActive.length < 2) return null;

  // Check for showmance pair
  if (gs.showmances?.length && Math.random() < 0.35) {
    for (const sm of gs.showmances) {
      if (!sm.broken && freeActive.includes(sm.a) && freeActive.includes(sm.b)) {
        return { type: 'showmance-moment', a: sm.a, b: sm.b };
      }
    }
  }

  // Confrontation between enemies (bond <= -2)
  if (Math.random() < 0.25) {
    for (const a of freeActive) {
      for (const b of freeActive) {
        if (a !== b && getBond(a, b) <= -2) {
          return { type: 'confrontation', aggressor: a, target: b };
        }
      }
    }
  }

  // Rivalry between enemies
  if (Math.random() < 0.4) {
    for (const a of freeActive) {
      for (const b of freeActive) {
        if (a !== b && getBond(a, b) <= -3) {
          return { type: 'rivalry', a, b };
        }
      }
    }
  }

  // Coprolite discovery
  if (Math.random() < 0.25) {
    const name = pick(freeActive);
    return { type: 'coprolite', name };
  }

  // Tool envy
  if (Math.random() < 0.3 && toolBonus) {
    const haves = freeActive.filter(n => (toolBonus[n] || 0) >= 2);
    const haveNots = freeActive.filter(n => (toolBonus[n] || 0) === 0);
    if (haves.length && haveNots.length) {
      const toolNames = { 3: 'Post Digger', 2: 'Prospector Kit', 1: 'Beach Bucket' };
      const have = pick(haves);
      return { type: 'tool-envy', have, haveNot: pick(haveNots), tool: toolNames[toolBonus[have]] || 'better tool' };
    }
  }

  return null;
}


// ════════════════════════════════════════════════════════════
// VP — CSS
// ════════════════════════════════════════════════════════════
function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Bungee&family=Cinzel:wght@600;800&family=Cutive+Mono&family=IBM+Plex+Mono:wght@400;500;600&family=Karla:wght@300;400;500;600;700&family=Rye&display=swap');

  .dh-shell{
    --dh-night:#0e0a06;--dh-coal:#1a120a;--dh-tar:#2a1d10;
    --dh-rust:#7a3a1a;--dh-terracotta:#b5562c;--dh-ochre:#d68a3a;
    --dh-sand:#e8c486;--dh-bone:#f1e3c4;--dh-paper:#f7eedc;
    --dh-dust:#caa676;--dh-shadow:#4a2e18;--dh-mud:#3a2814;
    --dh-prairie:#5e7f8a;--dh-sky:#a8c0c8;--dh-dusk:#c47b5a;
    --dh-spark:#ffd34a;--dh-fuse:#ff8a1a;--dh-blood:#a8281c;
    --dh-cake:#f0a8b8;--dh-cake-deep:#d06880;--dh-oil:#08060a;
    /* legacy aliases */
    --sandstone:var(--dh-sand);--amber:var(--dh-ochre);--terracotta:var(--dh-terracotta);
    --soil:var(--dh-shadow);--dark:var(--dh-night);--cream:var(--dh-bone);
    --red:var(--dh-blood);--electric:#2dd4bf;--sky:#38bdf8;
    --bone:var(--dh-dust);--fossil:#8b6914;--clay:#6b3a1f;
    font-family:'Karla',sans-serif;color:var(--dh-bone);
    background:var(--dh-night);
    padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
    overflow:clip;border:3px solid var(--dh-shadow);box-shadow:0 4px 32px rgba(0,0,0,0.6);
  }
  .dh-shell *{box-sizing:border-box}

  /* ── BACKDROP ── */
  .dh-backdrop{position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0}
  .dh-sky-layer{position:absolute;inset:0;
    background:linear-gradient(180deg,var(--dh-dusk) 0%,var(--dh-rust) 45%,var(--dh-coal) 100%);opacity:0.55}
  .dh-dust-haze{position:absolute;inset:0;
    background:radial-gradient(ellipse 120% 60% at 50% 70%,rgba(202,166,118,0.12),transparent);
    animation:dh-hazeShift 20s ease-in-out infinite alternate}
  @keyframes dh-hazeShift{0%{opacity:0.5;transform:translateX(-2%)}100%{opacity:0.8;transform:translateX(2%)}}
  .dh-horizon{position:absolute;bottom:28%;left:0;right:0;height:180px;display:flex;align-items:flex-end;justify-content:center;gap:0}
  .dh-hoodoo{background:var(--dh-tar);border-radius:8px 8px 0 0;position:relative;flex-shrink:0}
  .dh-hoodoo.h1{width:28px;height:90px;margin-right:40px;opacity:0.7}
  .dh-hoodoo.h2{width:50px;height:140px;border-radius:12px 12px 0 0;opacity:0.85}
  .dh-hoodoo.h3{width:35px;height:110px;margin-left:20px;opacity:0.6}
  .dh-hoodoo.h4{width:22px;height:70px;margin-left:60px;opacity:0.5}
  .dh-hoodoo.h5{width:60px;height:160px;margin-left:30px;border-radius:14px 14px 0 0;opacity:0.9}
  .dh-hoodoo.h6{width:30px;height:80px;margin-left:25px;opacity:0.55}
  .dh-flats{position:absolute;bottom:0;left:0;right:0;height:28%;
    background:linear-gradient(0deg,var(--dh-coal) 0%,var(--dh-tar) 60%,transparent 100%)}

  /* ── CHROME (Documentary HUD) ── */
  .dh-chrome{position:sticky;top:46px;z-index:50;
    background:rgba(14,10,6,0.96);border-bottom:1px solid var(--dh-shadow);
    padding:6px 16px;display:flex;align-items:center;gap:12px;
    font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--dh-sand);
    backdrop-filter:blur(6px)}
  .dh-rec{display:flex;align-items:center;gap:5px;color:var(--dh-blood);font-weight:600;letter-spacing:1px;font-size:10px;white-space:nowrap}
  .dh-rec-dot{width:7px;height:7px;border-radius:50%;background:var(--dh-blood);animation:dh-blink 2s step-end infinite}
  @keyframes dh-blink{0%,50%{opacity:1}51%,100%{opacity:0.3}}
  .dh-coord{flex:1;overflow:hidden;position:relative;height:14px}
  .dh-coord-inner{white-space:nowrap;position:absolute;animation:dh-ticker 40s linear infinite;
    font-family:'Cutive Mono',monospace;font-size:10px;letter-spacing:1.5px;color:var(--dh-dust);opacity:0.7}
  @keyframes dh-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  .dh-wind{white-space:nowrap;opacity:0.5;font-size:10px}
  .dh-call{background:var(--dh-shadow);padding:2px 8px;border-radius:3px;font-weight:600;font-size:10px;letter-spacing:1px;color:var(--dh-ochre)}

  /* ── TABS ── */
  .dh-tabs{display:flex;gap:2px;padding:8px 16px;background:rgba(26,18,10,0.9);border-bottom:1px solid var(--dh-tar);position:sticky;top:calc(46px + 32px);z-index:49}
  .dh-tab{background:var(--dh-tar);border:1px solid var(--dh-shadow);border-radius:4px;
    padding:5px 12px;font-family:'Big Shoulders Display',sans-serif;font-size:12px;font-weight:700;
    color:var(--dh-dust);letter-spacing:0.5px;cursor:default;display:flex;align-items:center;gap:6px;transition:all 0.2s}
  .dh-tab .n{font-family:'IBM Plex Mono',monospace;font-size:9px;background:var(--dh-shadow);
    padding:1px 5px;border-radius:2px;color:var(--dh-ochre);margin-right:2px}
  .dh-tab.active{background:var(--dh-rust);border-color:var(--dh-terracotta);color:var(--dh-paper)}
  .dh-tab.done{opacity:0.5;border-color:transparent}

  /* ── LAYOUT ── */
  .dh-layout{display:flex;gap:20px;padding:20px 16px 80px;position:relative;z-index:5}
  .dh-feed{flex:1;min-width:0}
  .dh-sidebar{width:260px;flex-shrink:0;position:sticky;top:140px;align-self:flex-start;max-height:calc(100vh - 200px);overflow-y:auto}
  @media(max-width:800px){.dh-sidebar{display:none}.dh-layout{padding:16px 10px 80px}}

  /* ── PHASE HEADERS ── */
  .dh-phase-hdr{font-family:'Big Shoulders Display',sans-serif;font-size:20px;font-weight:800;
    color:var(--dh-ochre);letter-spacing:2px;margin-bottom:16px;padding-bottom:8px;
    border-bottom:1px solid var(--dh-tar);display:flex;align-items:center;gap:8px}
  .dh-phase-tag{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;
    background:var(--dh-tar);padding:2px 8px;border-radius:3px;color:var(--dh-dust);letter-spacing:1px}

  /* ── CARDS (field log entries) ── */
  .dh-card{background:rgba(42,29,16,0.7);border:1px solid var(--dh-shadow);border-radius:6px;
    padding:14px 16px;margin-bottom:10px;backdrop-filter:blur(4px);
    opacity:0;transform:translateY(8px);transition:opacity 0.3s,transform 0.3s}
  .dh-card.visible{opacity:1;transform:translateY(0)}
  .dh-card-vote{background:rgba(30,42,40,0.6);border:1px solid rgba(45,212,191,0.15);border-radius:6px;
    padding:14px 16px;margin-bottom:10px;backdrop-filter:blur(4px);
    opacity:0;transform:translateY(8px);transition:opacity 0.3s,transform 0.3s}
  .dh-card-vote.visible{opacity:1;transform:translateY(0)}
  .dh-card-dig{background:rgba(60,30,16,0.5);border:1px solid rgba(181,86,44,0.25);border-radius:6px;
    padding:14px 16px;margin-bottom:10px;backdrop-filter:blur(4px);
    opacity:0;transform:translateY(8px);transition:opacity 0.3s,transform 0.3s}
  .dh-card-dig.visible{opacity:1;transform:translateY(0)}
  .dh-card-social{background:rgba(42,29,16,0.4);border:1px dashed rgba(202,166,118,0.3);border-radius:6px;
    padding:12px 14px;margin-bottom:10px;
    opacity:0;transform:translateY(8px);transition:opacity 0.3s,transform 0.3s}
  .dh-card-social.visible{opacity:1;transform:translateY(0)}

  /* ── PLAYER ROWS ── */
  .dh-player-row{display:flex;align-items:center;gap:10px}
  .dh-player-name{font-family:'Big Shoulders Display',sans-serif;font-size:15px;font-weight:700;color:var(--dh-bone);letter-spacing:0.5px}
  .dh-player-detail{font-size:12px;color:var(--dh-dust);line-height:1.5;font-family:'Karla',sans-serif}

  /* ── BADGES ── */
  .dh-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:1px;
    padding:2px 8px;border-radius:3px;text-transform:uppercase}
  .dh-badge-green{background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3)}
  .dh-badge-gold{background:rgba(214,138,58,0.15);color:var(--dh-ochre);border:1px solid rgba(214,138,58,0.3)}
  .dh-badge-red{background:rgba(168,40,28,0.15);color:var(--dh-blood);border:1px solid rgba(168,40,28,0.3)}
  .dh-badge-grey{background:rgba(100,80,60,0.2);color:var(--dh-dust);border:1px solid rgba(100,80,60,0.3)}
  .dh-badge-blue{background:rgba(56,189,248,0.15);color:var(--sky);border:1px solid rgba(56,189,248,0.3)}

  /* ── BUILD PHASE CARDS ── */
  .dh-build-dino{text-align:center;margin:10px 0;padding:8px;border-radius:4px;
    background:rgba(232,196,134,0.04);border:1px solid rgba(232,196,134,0.08)}
  .dh-build-dino svg{height:50px;width:auto;opacity:0.85}
  .dh-build-stats{display:flex;gap:16px;margin-top:8px;padding-top:8px;border-top:1px solid var(--dh-tar)}
  .dh-build-stat{text-align:center}
  .dh-build-stat-val{font-family:'Big Shoulders Display',sans-serif;font-size:20px;font-weight:800;color:var(--dh-ochre)}
  .dh-build-stat-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--dh-dust);letter-spacing:1px;text-transform:uppercase}

  /* ── VOTE PHASE ── */
  .dh-shock-card{border-color:rgba(255,187,36,0.4)!important;box-shadow:0 0 18px rgba(255,187,36,0.15)}
  .dh-shock-animate{animation:dh-shockZap 0.6s ease-out}
  @keyframes dh-shockZap{
    0%{transform:translateX(0);box-shadow:0 0 30px rgba(255,187,36,0.6)}
    10%{transform:translateX(-4px)}
    20%{transform:translateX(4px)}
    30%{transform:translateX(-3px)}
    40%{transform:translateX(3px)}
    50%{transform:translateX(-2px);box-shadow:0 0 20px rgba(255,187,36,0.4)}
    60%{transform:translateX(2px)}
    70%{transform:translateX(-1px)}
    100%{transform:translateX(0);box-shadow:0 0 18px rgba(255,187,36,0.15)}
  }
  .dh-zap-spark{display:inline-block;position:relative;width:10px;height:14px;margin:0 2px;vertical-align:middle}
  .dh-zap-spark::before{content:'';position:absolute;top:0;left:3px;width:4px;height:14px;
    background:var(--dh-spark);clip-path:polygon(50% 0%,30% 45%,65% 45%,35% 100%,55% 55%,20% 55%);
    animation:dh-zapFlicker 0.4s ease-in-out infinite alternate}
  @keyframes dh-zapFlicker{0%{opacity:1;transform:scaleY(1)}100%{opacity:0.6;transform:scaleY(0.85)}}
  .dh-vote-arrow{color:var(--dh-ochre);font-size:18px;font-weight:700;margin:0 4px}
  .dh-vote-approach{font-family:'Cutive Mono',monospace;font-size:11px;color:var(--dh-dust);opacity:0.7;
    font-style:italic;padding:4px 0 6px;line-height:1.5;border-bottom:1px solid rgba(74,46,24,0.2);margin-bottom:8px}
  .dh-vote-reason{font-family:'Karla',sans-serif;font-size:11px;color:var(--dh-sand);opacity:0.8;margin-top:6px;
    padding-top:6px;border-top:1px dashed rgba(74,46,24,0.25);line-height:1.5}
  .dh-vote-crowd{font-family:'Cutive Mono',monospace;font-size:10px;color:var(--dh-dust);opacity:0.5;
    margin-top:4px;font-style:italic}
  .dh-fallout-card{border-left:3px solid;padding:10px 12px;margin:2px 0;border-radius:0 4px 4px 0}
  .dh-fallout-betrayal{border-color:var(--dh-blood);background:rgba(168,40,28,0.06)}
  .dh-fallout-respect{border-color:var(--electric);background:rgba(45,212,191,0.04)}
  .dh-fallout-zero{border-color:var(--dh-shadow);background:rgba(74,46,24,0.08)}
  .dh-truth-meter{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:6px 0;background:var(--dh-tar)}
  .dh-truth-bar{height:100%;transition:width 0.3s}
  .dh-truth-honest{background:linear-gradient(90deg,var(--electric),rgba(45,212,191,0.7))}
  .dh-truth-shock{background:linear-gradient(90deg,var(--dh-spark),rgba(255,187,36,0.7))}

  /* ── DIG PHASE ── */
  .dh-progress{width:100%;height:6px;background:var(--dh-tar);border-radius:3px;margin-top:6px;overflow:hidden}
  .dh-progress-fill{height:100%;background:linear-gradient(90deg,var(--dh-rust),var(--dh-ochre));border-radius:3px;transition:width 0.3s}
  .dh-progress-fill.winner{background:linear-gradient(90deg,var(--dh-spark),var(--dh-fuse))!important;box-shadow:0 0 8px var(--dh-spark)}
  .dh-valley-svg{width:100%;border-radius:4px;margin:8px 0}
  .dh-valley-map{background:linear-gradient(180deg,rgba(74,46,24,0.3),rgba(14,10,6,0.5));border:1px solid var(--dh-shadow);border-radius:8px;padding:12px;margin:12px 0;position:relative;min-height:100px;overflow:hidden}

  /* ── DIG MAP (sidebar live map) ── */
  .dh-digmap{position:relative;background:linear-gradient(180deg,rgba(181,86,44,0.25) 0%,rgba(74,46,24,0.5) 40%,rgba(42,29,16,0.7) 80%,rgba(14,10,6,0.9) 100%);
    border-radius:6px;overflow:hidden;height:180px;border:1px solid var(--dh-tar)}
  .dh-digmap-layers{position:absolute;inset:0;pointer-events:none}
  .dh-digmap-layer{position:absolute;left:0;right:0;height:1px;border-top:1px dashed rgba(181,86,44,0.12)}
  .dh-digmap-barrel{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:9px;
    color:var(--dh-ochre);font-family:'IBM Plex Mono',monospace;letter-spacing:1px;opacity:0.5;text-align:center}
  .dh-digmap-barrel svg{display:block;margin:0 auto 2px}
  .dh-digmap-marker{position:absolute;transition:top 0.6s ease-out,left 0.3s;z-index:2;display:flex;flex-direction:column;align-items:center;gap:1px}
  .dh-digmap-marker img,.dh-digmap-marker .player-portrait{width:24px;height:24px;border-radius:50%;border:2px solid var(--dh-sand);box-shadow:0 0 6px rgba(0,0,0,0.6)}
  .dh-digmap-marker.trapped img,.dh-digmap-marker.trapped .player-portrait{border-color:var(--dh-blood);opacity:0.5;filter:grayscale(0.5)}
  .dh-digmap-marker.winner img,.dh-digmap-marker.winner .player-portrait{border-color:var(--dh-spark);box-shadow:0 0 12px var(--dh-spark)}
  .dh-digmap-lbl{font-size:7px;color:var(--dh-bone);font-family:'IBM Plex Mono',monospace;text-shadow:0 1px 3px rgba(0,0,0,0.8);white-space:nowrap;letter-spacing:0.5px}
  .dh-digmap-surface{position:absolute;top:16px;left:0;right:0;height:2px;background:rgba(181,86,44,0.3)}
  .dh-digmap-threshold{position:absolute;left:0;right:0;height:1px;border-top:1px dashed rgba(214,138,58,0.3)}
  @media(prefers-reduced-motion:reduce){.dh-digmap-marker{transition:none!important}}

  /* ── SIDEBAR ── */
  .dh-sidebar .dh-sb-section{background:rgba(42,29,16,0.6);border:1px solid var(--dh-tar);border-radius:6px;padding:12px;margin-bottom:10px}
  .dh-sb-title{font-family:'Big Shoulders Display',sans-serif;font-size:13px;font-weight:700;
    color:var(--dh-ochre);letter-spacing:1px;margin-bottom:8px;display:flex;align-items:center;gap:6px}
  .dh-sb-progress{display:flex;align-items:center;gap:4px;margin-bottom:6px}
  .dh-sb-dot{width:22px;height:22px;border-radius:50%;background:var(--dh-tar);border:1px solid var(--dh-shadow);
    display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--dh-dust);font-family:'IBM Plex Mono',monospace}
  .dh-sb-dot.active{background:var(--dh-rust);border-color:var(--dh-terracotta);color:var(--dh-paper)}
  .dh-sb-dot.done{background:var(--dh-shadow);border-color:var(--dh-ochre);color:var(--dh-ochre)}
  .dh-sb-dot-line{flex:1;height:2px;background:var(--dh-tar)}
  .dh-sb-dot-line.done{background:var(--dh-ochre)}
  .dh-sb-player{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(42,29,16,0.4)}
  .dh-sb-player:last-child{border-bottom:none}
  .dh-sb-score{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;color:var(--dh-ochre)}

  /* ── SIDEBAR: Beat Progress ── */
  .dh-sb-beats{display:flex;align-items:center;gap:0}
  .dh-sb-beat{display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0}
  .dh-sb-beat-num{width:20px;height:20px;border-radius:50%;background:var(--dh-tar);border:1px solid var(--dh-shadow);
    display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--dh-dust);
    font-family:'IBM Plex Mono',monospace;transition:all 0.3s}
  .dh-sb-beat.active .dh-sb-beat-num{background:var(--dh-rust);border-color:var(--dh-terracotta);color:var(--dh-paper);
    box-shadow:0 0 6px rgba(168,40,28,0.4)}
  .dh-sb-beat.done .dh-sb-beat-num{background:var(--dh-shadow);border-color:var(--dh-ochre);color:var(--dh-ochre)}
  .dh-sb-beat-lbl{font-family:'IBM Plex Mono',monospace;font-size:7px;color:var(--dh-dust);letter-spacing:0.5px;
    text-transform:uppercase;opacity:0.5;white-space:nowrap}
  .dh-sb-beat.active .dh-sb-beat-lbl{opacity:1;color:var(--dh-ochre)}
  .dh-sb-beat.done .dh-sb-beat-lbl{opacity:0.7;color:var(--dh-ochre)}
  .dh-sb-beat-line{flex:1;height:2px;background:var(--dh-tar);min-width:8px;margin:0 2px;align-self:flex-start;margin-top:10px}
  .dh-sb-beat-line.done{background:var(--dh-ochre)}

  /* ── SIDEBAR: Modifier Pills ── */
  .dh-sb-pill{font-family:'IBM Plex Mono',monospace;font-size:7px;font-weight:600;letter-spacing:0.5px;
    padding:1px 5px;border-radius:2px;text-transform:uppercase;white-space:nowrap}
  .dh-sb-pill-good{background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.25)}
  .dh-sb-pill-bad{background:rgba(168,40,28,0.12);color:var(--dh-blood);border:1px solid rgba(168,40,28,0.2)}
  .dh-sb-pill-sab{background:rgba(168,40,28,0.2);color:#ef4444;border:1px solid rgba(168,40,28,0.35)}
  .dh-sb-pill-help{background:rgba(34,197,94,0.12);color:#4ade80;border:1px solid rgba(34,197,94,0.2)}
  .dh-sb-pill-arg{background:rgba(214,138,58,0.15);color:var(--dh-ochre);border:1px solid rgba(214,138,58,0.25)}
  .dh-sb-pill-love{background:rgba(236,72,153,0.15);color:#f472b6;border:1px solid rgba(236,72,153,0.25)}
  .dh-sb-pill-scheme{background:rgba(100,100,180,0.15);color:#a5b4fc;border:1px solid rgba(100,100,180,0.25)}
  .dh-sb-pill-mishap{background:rgba(139,90,43,0.2);color:#c9a96e;border:1px solid rgba(139,90,43,0.3)}
  .dh-sb-pill-final{background:rgba(214,138,58,0.2);color:var(--dh-ochre);border:1px solid rgba(214,138,58,0.3)}

  /* ── SIDEBAR: Drama Log ── */
  .dh-sb-drama{display:flex;flex-direction:column;gap:4px}
  .dh-sb-drama-row{display:flex;align-items:center;gap:6px;padding:2px 0}
  .dh-sb-drama-icon{width:14px;display:flex;justify-content:center;flex-shrink:0}
  .dh-sb-drama-lbl{font-family:'Karla',sans-serif;font-size:11px;color:var(--dh-bone);flex:1}
  .dh-sb-drama-val{font-family:'Big Shoulders Display',sans-serif;font-size:16px;font-weight:800;color:var(--dh-ochre)}

  /* ── HERO / TITLE CARD ── */
  .dh-hero{text-align:center;padding:40px 24px 32px;position:relative;z-index:5}
  .dh-bone-col{position:absolute;top:30px;display:flex;flex-direction:column;gap:12px;opacity:0.35}
  .dh-bone-col.l{left:16px}.dh-bone-col.r{right:16px}
  .dh-bone-col svg{width:28px;height:20px;color:var(--dh-dust)}
  .dh-stamp-meta{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--dh-dust);
    letter-spacing:2px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}
  .dh-stamp-meta .dot{width:3px;height:3px;border-radius:50%;background:var(--dh-rust)}
  .dh-stamp-meta .pip{background:var(--dh-tar);padding:1px 6px;border-radius:2px;color:var(--dh-ochre)}
  .dh-hero-title{font-family:'Rye',cursive;font-size:48px;color:var(--dh-bone);letter-spacing:4px;text-shadow:0 2px 12px rgba(0,0,0,0.5);margin:16px 0 10px}
  .dh-hero-title .pre{display:block;font-family:'Big Shoulders Display',sans-serif;font-size:28px;font-weight:900;color:var(--dh-blood);letter-spacing:6px}
  .dh-hero-title .pre .comma{color:var(--dh-terracotta)}
  .dh-hero-sub{font-family:'Cinzel',serif;font-size:14px;color:var(--dh-dust);letter-spacing:3px;margin-bottom:6px}
  .dh-hero-tag{font-family:'Karla',sans-serif;font-size:13px;color:var(--dh-dust);opacity:0.7;max-width:600px;margin:10px auto;line-height:1.6}
  .dh-hero-stats{display:flex;justify-content:center;gap:16px;margin-top:20px;flex-wrap:wrap}
  .dh-stat-box{background:rgba(42,29,16,0.6);border:1px solid var(--dh-tar);border-radius:6px;padding:10px 16px;min-width:90px;text-align:center}
  .dh-stat-box-val{font-family:'Big Shoulders Display',sans-serif;font-size:24px;font-weight:800;color:var(--dh-ochre)}
  .dh-stat-box-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--dh-dust);letter-spacing:1px;text-transform:uppercase}

  /* ── ROSTER ── */
  .dh-roster{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:20px}
  .dh-roster-chip{display:flex;align-items:center;gap:6px;background:rgba(42,29,16,0.7);
    border:1px solid var(--dh-tar);border-radius:4px;padding:4px 10px 4px 4px;
    opacity:0;transform:translateY(14px) scale(0.92);animation:dh-chipIn 0.5s ease forwards}
  @keyframes dh-chipIn{to{opacity:1;transform:translateY(0) scale(1)}}
  .dh-roster-avatar{width:28px;height:28px;border-radius:50%;overflow:hidden;background:var(--dh-tar);
    display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--dh-dust);
    box-shadow:0 0 0 2px var(--dh-tar);transition:box-shadow 0.3s}
  .dh-roster-chip:hover .dh-roster-avatar{box-shadow:0 0 0 2px var(--dh-ochre)}
  .dh-roster-avatar img{width:100%;height:100%;object-fit:cover}
  .dh-roster-name{font-family:'Big Shoulders Display',sans-serif;font-size:12px;font-weight:700;color:var(--dh-bone)}
  .dh-roster-arch{font-size:9px;color:var(--dh-dust);opacity:0.6;text-transform:uppercase;letter-spacing:0.5px}

  /* ── COLD OPEN ANIMATIONS ── */
  .dh-hero .dh-stamp-meta{opacity:0;animation:dh-fadeSlide 0.6s ease 0.2s forwards}
  .dh-hero-title{opacity:0;animation:dh-titleSlam 0.7s ease 0.5s forwards}
  @keyframes dh-titleSlam{0%{opacity:0;transform:scale(1.15);letter-spacing:12px}100%{opacity:1;transform:scale(1);letter-spacing:4px}}
  .dh-hero-sub{opacity:0;animation:dh-fadeSlide 0.5s ease 1.0s forwards}
  .dh-hero-tag{opacity:0;animation:dh-fadeSlide 0.6s ease 1.3s forwards}
  .dh-hero-stats{opacity:0;animation:dh-fadeSlide 0.5s ease 1.6s forwards}
  .dh-hero-stats .dh-stat-box{opacity:0;animation:dh-chipIn 0.4s ease forwards}
  @keyframes dh-fadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .dh-bone-col svg{opacity:0;animation:dh-boneFloat 0.4s ease forwards}
  @keyframes dh-boneFloat{from{opacity:0;transform:translateY(8px) rotate(-5deg)}to{opacity:0.35;transform:translateY(0) rotate(0deg)}}

  /* ── DIG SITE SCENE (cold open vignette) ── */
  .dh-scene{position:relative;margin:24px auto 8px;max-width:600px;height:120px;
    opacity:0;animation:dh-fadeSlide 0.8s ease 1.4s forwards;overflow:visible}
  .dh-scene-ground{position:absolute;bottom:0;left:0;right:0;height:36px;
    background:linear-gradient(0deg,var(--dh-tar) 0%,var(--dh-shadow) 60%,transparent 100%);
    border-radius:8px 8px 0 0}
  .dh-scene-stratum{position:absolute;bottom:4px;left:5%;right:5%;height:2px;
    background:var(--dh-rust);opacity:0.25;border-radius:1px}
  .dh-scene-stratum.s2{bottom:12px;left:10%;right:8%;background:var(--dh-ochre);opacity:0.15}
  .dh-scene-stratum.s3{bottom:20px;left:3%;right:12%;background:var(--dh-terracotta);opacity:0.12}
  .dh-digger{position:absolute;bottom:28px;display:flex;flex-direction:column;align-items:center;gap:2px;
    opacity:0;animation:dh-diggerIn 0.5s ease forwards}
  @keyframes dh-diggerIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  .dh-digger-avatar{width:36px;height:36px;border-radius:50%;overflow:hidden;background:var(--dh-tar);
    border:2px solid var(--dh-ochre);box-shadow:0 2px 8px rgba(0,0,0,0.5)}
  .dh-digger-avatar img{width:100%;height:100%;object-fit:cover}
  .dh-digger-tool{position:absolute;bottom:-6px;right:-8px;color:var(--dh-ochre);
    transform-origin:bottom center;animation:dh-pickSwing 1.2s ease-in-out infinite}
  @keyframes dh-pickSwing{0%,100%{transform:rotate(0deg)}40%{transform:rotate(-35deg)}60%{transform:rotate(10deg)}}
  .dh-digger-name{font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;
    color:var(--dh-dust);letter-spacing:0.5px;white-space:nowrap;margin-top:1px}
  .dh-scene-dirt{position:absolute;width:3px;height:3px;background:var(--dh-sand);border-radius:50%;
    opacity:0;animation:dh-dirtFly 1.4s ease-out infinite}
  @keyframes dh-dirtFly{0%{opacity:0;transform:translate(0,0)}15%{opacity:0.7}80%{opacity:0.3}100%{opacity:0;transform:translate(var(--dx),-30px)}}
  .dh-scene-bone{position:absolute;bottom:6px;color:var(--dh-bone);opacity:0;
    animation:dh-boneEmerge 2s ease 2.5s forwards}
  @keyframes dh-boneEmerge{0%{opacity:0;transform:translateY(10px) rotate(15deg)}60%{opacity:0.5;transform:translateY(2px) rotate(5deg)}100%{opacity:0.35;transform:translateY(0) rotate(0deg)}}

  /* ── RESULTS ── */
  .dh-result-card{text-align:center;background:rgba(42,29,16,0.7);border:2px solid var(--dh-ochre);
    border-radius:10px;padding:28px 24px;box-shadow:0 0 40px rgba(214,138,58,0.15)}
  .dh-winner-name{font-family:'Rye',cursive;font-size:28px;color:var(--dh-ochre);letter-spacing:2px;text-shadow:0 2px 8px rgba(0,0,0,0.4)}
  .dh-standing-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:4px;
    background:rgba(42,29,16,0.4);margin-bottom:4px;border:1px solid transparent}
  .dh-standing-row.first{border-color:var(--dh-ochre);background:rgba(214,138,58,0.08)}
  .dh-standing-medal{font-family:'Big Shoulders Display',sans-serif;font-size:14px;font-weight:800;min-width:32px}

  /* ── CONTROLS ── */
  .dh-controls{position:fixed;bottom:0;left:0;right:0;z-index:100;
    background:rgba(14,10,6,0.97);border-top:1px solid var(--dh-shadow);
    padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:12px;
    backdrop-filter:blur(8px)}
  .dh-btn{font-family:'Big Shoulders Display',sans-serif;font-size:13px;font-weight:700;
    letter-spacing:1.5px;padding:8px 20px;border-radius:4px;border:1px solid var(--dh-terracotta);
    background:var(--dh-rust);color:var(--dh-paper);cursor:pointer;transition:all 0.15s}
  .dh-btn:hover:not(:disabled){background:var(--dh-terracotta);transform:translateY(-1px)}
  .dh-btn:disabled{opacity:0.3;cursor:not-allowed}
  .dh-counter{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--dh-dust);letter-spacing:1px}

  /* ── ATMOSPHERE TEXT ── */
  .dh-atmo{font-family:'Cutive Mono',monospace;font-size:11px;color:var(--dh-dust);opacity:0.6;
    font-style:italic;padding:6px 0;letter-spacing:0.5px;line-height:1.5}

  /* ── BRIEF BLOCKS ── */
  .dh-brief{font-family:'Karla',sans-serif;font-size:13px;color:var(--dh-bone);line-height:1.6;
    padding:12px 14px;border-left:3px solid var(--dh-terracotta);background:rgba(42,29,16,0.4);border-radius:0 4px 4px 0}

  /* ── ICONS ── */
  .dh-ico{display:inline-block;vertical-align:middle;fill:currentColor}

  /* ── DUST PARTICLES ── */
  .dh-particles{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1}
  .dh-particle{position:absolute;width:2px;height:2px;background:var(--dh-dust);border-radius:50%;opacity:0;animation:dh-drift 12s linear infinite}
  @keyframes dh-drift{0%{opacity:0;transform:translate(0,0)}10%{opacity:0.4}90%{opacity:0.2}100%{opacity:0;transform:translate(60px,-200px)}}

  /* ── BACKGROUND SKELETONS ── */
  .dh-bg-skeletons{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden}
  .dh-bg-skel{position:absolute;opacity:0.06;color:var(--dh-dust);filter:blur(0.5px)}
  .dh-bg-skel.near{opacity:0.1;filter:none}
  .dh-bg-skel.far{opacity:0.04;filter:blur(1px)}
  .dh-bg-skel svg{width:100%;height:100%}
  .dh-bg-skel.s1{bottom:18%;left:2%;width:180px;height:80px;transform:scaleX(-1)}
  .dh-bg-skel.s2{bottom:30%;right:5%;width:120px;height:55px;opacity:0.035;filter:blur(1.2px)}
  .dh-bg-skel.s3{bottom:22%;left:38%;width:90px;height:42px;transform:rotate(-5deg)}
  .dh-bg-skel.s4{bottom:14%;right:25%;width:140px;height:60px;transform:scaleX(-1) rotate(3deg)}
  .dh-bg-skel.s5{bottom:35%;left:18%;width:70px;height:35px;opacity:0.03;filter:blur(1.5px)}

  /* ── TUMBLEWEEDS ── */
  .dh-tumbleweeds{position:absolute;bottom:20%;left:0;right:0;height:40%;pointer-events:none;z-index:1;overflow:hidden}
  .dh-tumbleweed{position:absolute;bottom:0;opacity:0;animation:dh-tumble var(--tw-dur,18s) linear var(--tw-delay,0s) infinite}
  .dh-tumbleweed svg{width:var(--tw-sz,24px);height:var(--tw-sz,24px);color:var(--dh-shadow);animation:dh-twSpin var(--tw-spin,4s) linear infinite}
  @keyframes dh-tumble{
    0%{opacity:0;left:-5%;bottom:var(--tw-y,10%)}
    5%{opacity:0.35}
    30%{bottom:calc(var(--tw-y,10%) + 8%)}
    50%{bottom:var(--tw-y,10%)}
    70%{bottom:calc(var(--tw-y,10%) + 5%)}
    95%{opacity:0.2}
    100%{opacity:0;left:105%;bottom:calc(var(--tw-y,10%) + 3%)}
  }
  @keyframes dh-twSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  .dh-tw-inner{border-radius:50%;border:2px solid currentColor;width:100%;height:100%;
    background:radial-gradient(circle,transparent 30%,currentColor 32%,transparent 34%,currentColor 60%,transparent 62%);opacity:0.7}

  /* ── HEAT SHIMMER ── */
  .dh-shimmer{position:absolute;bottom:24%;left:0;right:0;height:80px;pointer-events:none;z-index:0;
    background:repeating-linear-gradient(0deg,transparent,rgba(202,166,118,0.02) 2px,transparent 4px);
    animation:dh-shimmerWave 3s ease-in-out infinite alternate;opacity:0.6}
  @keyframes dh-shimmerWave{
    0%{transform:scaleY(1) translateY(0)}
    50%{transform:scaleY(1.08) translateY(-2px)}
    100%{transform:scaleY(0.95) translateY(1px)}
  }

  /* ── FLOATING BONE FRAGMENTS ── */
  .dh-bone-frags{position:absolute;inset:0;pointer-events:none;z-index:1;overflow:hidden}
  .dh-bone-frag{position:absolute;opacity:0;animation:dh-boneDrift var(--bf-dur,20s) linear var(--bf-delay,0s) infinite}
  .dh-bone-frag svg{color:var(--dh-dust);opacity:0.25}
  @keyframes dh-boneDrift{
    0%{opacity:0;transform:translateY(0) rotate(var(--bf-rot,0deg))}
    8%{opacity:0.2}
    50%{transform:translateY(-60px) rotate(calc(var(--bf-rot,0deg) + 15deg))}
    92%{opacity:0.15}
    100%{opacity:0;transform:translateY(-130px) rotate(calc(var(--bf-rot,0deg) + 30deg))}
  }

  /* ── DISTANT DUST CLOUDS ── */
  .dh-dust-clouds{position:absolute;bottom:25%;left:0;right:0;height:100px;pointer-events:none;z-index:0;overflow:hidden}
  .dh-dust-cloud{position:absolute;border-radius:50%;background:radial-gradient(ellipse,rgba(202,166,118,0.06),transparent 70%);
    animation:dh-cloudDrift var(--dc-dur,30s) linear var(--dc-delay,0s) infinite}
  @keyframes dh-cloudDrift{
    0%{opacity:0;transform:translateX(-100%)}
    10%{opacity:1}
    90%{opacity:0.6}
    100%{opacity:0;transform:translateX(calc(100vw + 100%))}
  }

  /* ── PHASE BACKGROUNDS ── */
  .dh-phase-build .dh-feed{background:linear-gradient(180deg,rgba(74,46,24,0.12) 0%,rgba(214,138,58,0.03) 100%);border-radius:6px}
  .dh-phase-vote .dh-feed{background:linear-gradient(180deg,rgba(10,30,40,0.18) 0%,rgba(45,212,191,0.02) 100%);border-radius:6px}
  .dh-phase-dig .dh-feed{background:linear-gradient(180deg,rgba(100,40,20,0.12) 0%,rgba(181,86,44,0.03) 100%);border-radius:6px}

  /* ── REDUCED MOTION ── */
  @media(prefers-reduced-motion:reduce){
    .dh-coord-inner{animation:none!important}
    .dh-rec-dot{animation:none!important;opacity:1}
    .dh-dust-haze{animation:none!important}
    .dh-particle{animation:none!important;display:none}
    .dh-tumbleweed{animation:none!important;display:none}
    .dh-tumbleweed svg{animation:none!important}
    .dh-shimmer{animation:none!important}
    .dh-bone-frag{animation:none!important;display:none}
    .dh-dust-cloud{animation:none!important;display:none}
    .dh-shock-card{animation:none!important}
    .dh-shock-animate{animation:none!important}
    .dh-zap-spark::before{animation:none!important}
    .dh-card,.dh-card-vote,.dh-card-dig,.dh-card-social{transition:none!important;opacity:1!important;transform:none!important}
    .dh-roster-chip,.dh-bone-col svg,.dh-hero .dh-stamp-meta,.dh-hero-title,.dh-hero-sub,.dh-hero-tag,.dh-hero-stats,.dh-stat-box,.dh-scene,.dh-digger,.dh-scene-bone{animation:none!important;opacity:1!important;transform:none!important}
    .dh-digger-tool,.dh-scene-dirt{animation:none!important;opacity:0!important}
    @keyframes dh-hazeShift{0%,100%{opacity:0.6;transform:none}}
  }
  </style>`;
}

// ════════════════════════════════════════════════════════════
// VP — SVG DEFS (16-symbol system)
// ════════════════════════════════════════════════════════════
const SVG_DEFS = `<svg class="dh-defs" aria-hidden="true" style="position:absolute;width:0;height:0;">
  <defs>
    <symbol id="dh-bone" viewBox="0 0 64 24"><path fill="currentColor" d="M10 12 Q10 4 16 4 Q22 4 22 10 L42 10 Q42 4 48 4 Q54 4 54 12 Q54 20 48 20 Q42 20 42 14 L22 14 Q22 20 16 20 Q10 20 10 12 Z"/></symbol>
    <symbol id="dh-skull" viewBox="0 0 32 32"><path fill="currentColor" d="M16 4 C8 4 4 10 4 16 C4 21 7 24 9 25 L9 28 L13 28 L13 26 L19 26 L19 28 L23 28 L23 25 C25 24 28 21 28 16 C28 10 24 4 16 4 Z M11 14 A2 2 0 1 1 11 18 A2 2 0 1 1 11 14 Z M21 14 A2 2 0 1 1 21 18 A2 2 0 1 1 21 14 Z M14 22 L18 22 L18 24 L14 24 Z"/></symbol>
    <symbol id="dh-pick" viewBox="0 0 40 40"><path fill="currentColor" d="M4 8 L20 6 L36 12 L34 15 L20 11 L8 13 Z"/><rect fill="currentColor" x="18" y="12" width="3" height="26" transform="rotate(8 19 25)"/></symbol>
    <symbol id="dh-shovel" viewBox="0 0 30 40"><rect fill="currentColor" x="13" y="2" width="4" height="22"/><path fill="currentColor" d="M8 22 L22 22 L22 28 Q22 38 15 38 Q8 38 8 28 Z"/><rect fill="currentColor" x="10" y="0" width="10" height="4"/></symbol>
    <symbol id="dh-bucket" viewBox="0 0 36 40"><path fill="currentColor" d="M6 12 L30 12 L28 36 L8 36 Z"/><path fill="none" stroke="currentColor" stroke-width="2" d="M8 12 Q18 4 28 12"/></symbol>
    <symbol id="dh-post" viewBox="0 0 30 40"><rect fill="currentColor" x="13" y="0" width="4" height="20"/><path fill="currentColor" d="M5 20 L13 18 L13 32 L8 38 Z"/><path fill="currentColor" d="M25 20 L17 18 L17 32 L22 38 Z"/></symbol>
    <symbol id="dh-petro" viewBox="0 0 32 32"><path fill="currentColor" d="M3 18 L7 14 L11 16 L14 12 L18 14 L24 8 L26 10 L22 16 L24 22 L20 22 L18 18 L14 22 L12 22 L10 18 L6 22 L4 22 Z"/></symbol>
    <symbol id="dh-spiral" viewBox="0 0 32 32"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M16 16 m-1 0 a1 1 0 1 1 2 0 a3 3 0 1 1 -4 0 a5 5 0 1 1 8 0 a7 7 0 1 1 -10 0 a9 9 0 1 1 12 0"/></symbol>
    <symbol id="dh-feather" viewBox="0 0 32 32"><path fill="currentColor" d="M22 4 Q12 8 8 18 Q6 24 8 28 L12 24 Q14 18 18 14 Q22 10 24 6 Z M8 28 L18 18"/></symbol>
    <symbol id="dh-trex" viewBox="0 0 120 60"><path fill="currentColor" d="M6 38 Q4 30 10 28 L14 32 L24 30 L28 22 Q26 14 32 8 Q40 4 48 8 L52 14 L60 14 L62 20 L72 22 L82 18 L92 20 L98 26 L92 30 L82 30 L78 36 L84 38 L90 44 L88 50 L82 50 L78 46 L72 44 L70 50 L64 50 L62 44 L52 42 L48 50 L42 50 L40 44 L32 42 L26 50 L20 50 L22 42 L14 40 Z M40 16 L42 18"/><circle fill="var(--dh-night)" cx="40" cy="14" r="1.8"/></symbol>
    <symbol id="dh-chris" viewBox="0 0 120 60"><path fill="currentColor" d="M8 42 Q6 34 12 32 L18 34 L26 28 Q22 22 28 16 L36 16 L40 22 L52 22 L56 18 L70 20 L82 26 L94 26 L100 32 L94 38 L82 38 L80 44 L86 46 L88 52 L80 52 L76 46 L68 44 L66 52 L60 52 L58 46 L46 44 L42 52 L34 52 L36 44 L22 44 Z"/><circle fill="var(--dh-spark)" cx="32" cy="16" r="6" stroke="currentColor" stroke-width="1.5"/><path fill="var(--dh-night)" d="M28 14 L31 14 L31 17 L28 17 Z M34 14 L37 14 L37 17 L34 17 Z M30 19 L36 19 L35 21 L31 21 Z"/></symbol>
    <symbol id="dh-codio" viewBox="0 0 90 50"><path fill="currentColor" d="M6 32 L10 28 L18 28 L22 22 L34 22 L40 18 L52 18 L58 22 L70 22 L74 26 L70 30 L62 30 L60 36 L66 38 L66 42 L58 42 L56 36 L48 36 L46 42 L40 42 L38 36 L28 34 L22 38 L14 38 L12 34 Z"/><circle fill="var(--dh-night)" cx="40" cy="22" r="1.5"/></symbol>
    <symbol id="dh-heartdino" viewBox="0 0 120 70"><path fill="currentColor" d="M40 14 Q40 6 48 6 Q56 6 56 14 Q56 6 64 6 Q72 6 72 14 Q72 22 56 36 Q40 22 40 14 Z"/><path fill="var(--dh-night)" d="M52 18 L60 32 L56 32 L62 46 L54 32 L58 32 Z"/><path fill="currentColor" d="M14 50 L26 46 L36 50 L46 46 L58 50 L70 46 L82 50 L94 46 L106 50 L106 56 L14 56 Z"/><circle fill="currentColor" cx="80" cy="44" r="6"/><path fill="var(--dh-cake)" d="M76 40 L80 36 L84 40 L82 42 L80 40 L78 42 Z"/></symbol>
    <symbol id="dh-allo" viewBox="0 0 130 60"><path fill="currentColor" d="M8 40 L12 32 L20 34 L24 28 L20 22 Q24 14 32 12 Q42 10 50 14 L54 20 L66 22 L74 16 L86 18 L98 24 L110 26 L116 32 L110 36 L98 36 L92 42 L96 46 L96 52 L88 52 L84 46 L74 44 L72 52 L64 52 L62 46 L52 44 L48 52 L40 52 L42 46 L34 44 L26 50 L20 50 L22 44 L14 42 Z"/><circle fill="var(--dh-night)" cx="42" cy="18" r="1.8"/><path fill="var(--dh-night)" d="M48 22 L52 24 L48 26 Z"/></symbol>
    <symbol id="dh-plane" viewBox="0 0 110 40"><path fill="currentColor" d="M6 22 L20 18 L30 14 L72 12 L86 14 L102 22 L102 26 L86 28 L72 30 L30 30 L20 26 L6 24 Z"/><path fill="currentColor" d="M40 6 L48 6 L46 12 L42 12 Z"/><path fill="currentColor" d="M40 28 L48 28 L46 34 L42 34 Z"/><path fill="var(--dh-night)" d="M76 18 L84 18 L84 20 L76 20 Z M68 18 L74 18 L74 20 L68 20 Z M60 18 L66 18 L66 20 L60 20 Z"/></symbol>
    <symbol id="dh-cake" viewBox="0 0 90 70"><path fill="var(--dh-cake)" d="M14 30 L76 30 L72 60 L18 60 Z"/><path fill="var(--dh-cake-deep)" d="M14 30 L76 30 L74 36 L16 36 Z"/><path fill="var(--dh-tar)" d="M22 28 L26 22 L30 28 Z M34 28 L38 22 L42 28 Z M46 28 L50 22 L54 28 Z M58 28 L62 22 L66 28 Z"/><rect fill="var(--dh-bone)" x="24" y="14" width="3" height="10"/><rect fill="var(--dh-bone)" x="36" y="14" width="3" height="10"/><rect fill="var(--dh-bone)" x="48" y="14" width="3" height="10"/><rect fill="var(--dh-bone)" x="60" y="14" width="3" height="10"/><circle fill="var(--dh-spark)" cx="25" cy="12" r="3"/><circle fill="var(--dh-fuse)" cx="37" cy="12" r="3"/><circle fill="var(--dh-spark)" cx="49" cy="12" r="3"/><circle fill="var(--dh-fuse)" cx="61" cy="12" r="3"/></symbol>
  </defs>
</svg>`;

// ════════════════════════════════════════════════════════════
// VP — ICONS (SVG use-href system)
// ════════════════════════════════════════════════════════════
function _icon(type) {
  const sizes = { bone:[22,12], skull:[16,16], pick:[18,18], shovel:[14,18], bucket:[16,18],
    post:[14,18], petro:[16,16], spiral:[16,16], feather:[14,16], trex:[48,24],
    chris:[48,24], codio:[40,22], heartdino:[48,28], allo:[52,24], plane:[44,16], cake:[36,28],
    boulder:[16,14], shock:[14,16], rescue:[16,16], barrel:[14,17] };
  // Special non-SVG icons for event types
  if (type === 'boulder') return `<svg class="dh-ico" width="16" height="14" viewBox="0 0 16 14"><ellipse cx="8" cy="7" rx="7" ry="6" fill="var(--dh-terracotta)" stroke="var(--dh-shadow)" stroke-width="1"/></svg>`;
  if (type === 'shock') return `<svg class="dh-ico" width="14" height="16" viewBox="0 0 14 16"><path fill="var(--dh-spark)" d="M8 0 L6 6 L10 6 L5 16 L7 9 L3 9 Z"/></svg>`;
  if (type === 'rescue') return `<svg class="dh-ico" width="16" height="16" viewBox="0 0 16 16"><path fill="var(--dh-ochre)" d="M8 2 L10 6 L14 6 L11 9 L12 14 L8 11 L4 14 L5 9 L2 6 L6 6 Z"/></svg>`;
  if (type === 'barrel') return `<svg class="dh-ico" width="14" height="17" viewBox="0 0 14 17"><rect x="1" y="1" width="12" height="15" rx="2" fill="var(--dh-shadow)" stroke="var(--dh-ochre)" stroke-width="1.5"/><line x1="1" y1="8" x2="13" y2="8" stroke="var(--dh-ochre)" stroke-width="1"/></svg>`;
  const s = sizes[type] || [16,16];
  return `<svg class="dh-ico" width="${s[0]}" height="${s[1]}"><use href="#dh-${type}"/></svg>`;
}

// ════════════════════════════════════════════════════════════
// VP — DINOSAUR SVG HELPER
// ════════════════════════════════════════════════════════════
const DINO_SYMBOLS = ['trex', 'chris', 'codio', 'heartdino', 'allo'];

function _getDinoSvg(name, quality) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  const idx = Math.abs(hash) % DINO_SYMBOLS.length;
  const sym = DINO_SYMBOLS[idx];
  const color = quality >= 10 ? '#22c55e' : quality >= 7 ? 'var(--dh-ochre)' : quality >= 4 ? 'var(--dh-sand)' : 'var(--dh-blood)';
  return `<svg width="80" height="44" style="color:${color}"><use href="#dh-${sym}"/></svg>`;
}

// ════════════════════════════════════════════════════════════
// VP — REVEAL SYSTEM
// ════════════════════════════════════════════════════════════
function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`dh-step-${suffix}-${i}`);
    if (el) el.classList.add('visible');
  }
  const counter = document.getElementById(`dh-counter-${suffix}`);
  if (counter) counter.textContent = `${upToIdx + 1} / ${total}`;
  const controls = document.getElementById(`dh-controls-${suffix}`);
  if (controls) {
    const btns = controls.querySelectorAll('.dh-btn');
    if (upToIdx >= total - 1) btns.forEach(b => b.disabled = true);
  }
}

export function dhRevealNext(screenKey, totalSteps) {
  window._tvState = window._tvState || {};
  window._tvState[screenKey] = window._tvState[screenKey] || { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  _reapplyVisibility(screenKey, state.idx, totalSteps);
  _applyStepMeta(screenKey, state.idx);
  const el = document.getElementById(`dh-step-${screenKey}-${state.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _updateSidebar(screenKey);
}

export function dhRevealAll(screenKey, totalSteps) {
  window._tvState = window._tvState || {};
  window._tvState[screenKey] = window._tvState[screenKey] || { idx: -1 };
  window._tvState[screenKey].idx = totalSteps - 1;
  _reapplyVisibility(screenKey, totalSteps - 1, totalSteps);
  const meta = window._dhStepMeta?.[screenKey] || [];
  for (let i = 0; i < meta.length; i++) _applyStepMeta(screenKey, i);
  _updateSidebar(screenKey);
}

function _applyStepMeta(screenKey, idx) {
  const meta = window._dhStepMeta?.[screenKey]?.[idx];
  if (!meta) return;
  if (screenKey === 'dh-build') {
    if (meta.player) {
      window._dhBuildRevealed = window._dhBuildRevealed || [];
      if (!window._dhBuildRevealed.includes(meta.player)) window._dhBuildRevealed.push(meta.player);
    }
    if (meta.qualitySnapshot) {
      window._dhBuildQuality = { ...(window._dhBuildQuality || {}), ...meta.qualitySnapshot };
    }
    if (meta.beat !== undefined) {
      window._dhBuildBeat = meta.beat;
    }
    if (meta.supplyResult) {
      window._dhBuildSupplies = window._dhBuildSupplies || {};
      window._dhBuildSupplies[meta.supplyResult.player] = meta.supplyResult.good;
    }
    if (meta.socialEvent) {
      window._dhBuildModifiers = window._dhBuildModifiers || [];
      window._dhBuildModifiers.push(meta.socialEvent);
      window._dhBuildDrama = window._dhBuildDrama || {};
      const cat = meta.socialEvent.category;
      window._dhBuildDrama[cat] = (window._dhBuildDrama[cat] || 0) + 1;
    }
  } else if (screenKey === 'dh-vote' && meta.voter && meta.target) {
    window._dhVoteRevealed = window._dhVoteRevealed || {};
    window._dhVoteRevealed[meta.voter] = meta.target;
    if (meta.isShock !== undefined) {
      window._dhVoteShocks = window._dhVoteShocks || { honest: 0, shocked: 0 };
      if (meta.isShock) window._dhVoteShocks.shocked++;
      else window._dhVoteShocks.honest++;
    }
  } else if (screenKey === 'dh-dig') {
    if (meta.snapshot) {
      window._dhDigRevealed = window._dhDigRevealed || {};
      Object.assign(window._dhDigRevealed, meta.snapshot);
    }
    if (meta.round !== undefined) {
      window._dhDigRound = meta.round;
    }
    if (meta.boulderHit) {
      window._dhDigBoulders = window._dhDigBoulders || { launched: 0, hits: 0, dodges: 0 };
      window._dhDigBoulders.launched++;
      window._dhDigBoulders.hits++;
      window._dhDigTrapped = window._dhDigTrapped || new Set();
      window._dhDigTrapped.add(meta.boulderHit);
    }
    if (meta.boulderDodge) {
      window._dhDigBoulders = window._dhDigBoulders || { launched: 0, hits: 0, dodges: 0 };
      window._dhDigBoulders.launched++;
      window._dhDigBoulders.dodges++;
    }
    if (meta.rescue) {
      window._dhDigRescues = window._dhDigRescues || [];
      window._dhDigRescues.push(meta.rescue);
      window._dhDigTrapped = window._dhDigTrapped || new Set();
      window._dhDigTrapped.delete(meta.rescue.trapped);
    }
    if (meta.selfFreed) {
      window._dhDigTrapped = window._dhDigTrapped || new Set();
      window._dhDigTrapped.delete(meta.selfFreed);
    }
    if (meta.digEvent) {
      window._dhDigDrama = window._dhDigDrama || {};
      const cat = meta.digEvent;
      window._dhDigDrama[cat] = (window._dhDigDrama[cat] || 0) + 1;
    }
    if (meta.winner) {
      window._dhDigWinner = meta.winner;
    }
  }
}


// ════════════════════════════════════════════════════════════
// VP — SIDEBAR
// ════════════════════════════════════════════════════════════
function _buildSidebarContent(screenKey, data, phase) {
  const state = window._tvState?.[screenKey];
  if (!state) return '';
  let html = '';

  // Phase progress dots
  const phases = ['BRIEF', 'BUILD', 'VOTE', 'DIG', 'RESULTS'];
  const phaseIdx = phase === 'build' ? 1 : phase === 'vote' ? 2 : phase === 'dig' ? 3 : phase === 'results' ? 4 : 0;
  html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('petro')} Episode Progress</div><div class="dh-sb-progress">`;
  for (let i = 0; i < phases.length; i++) {
    const cls = i < phaseIdx ? 'done' : i === phaseIdx ? 'active' : '';
    html += `<div class="dh-sb-dot ${cls}">${i + 1}</div>`;
    if (i < phases.length - 1) html += `<div class="dh-sb-dot-line ${i < phaseIdx ? 'done' : ''}"></div>`;
  }
  html += `</div></div>`;

  if (phase === 'build') {
    // ── Beat Progress Indicator ──
    const beat = window._dhBuildBeat || 0;
    const beatLabels = ['BRIEF', 'SCAVENGE', 'BUILD', 'FINISHING', 'FINAL'];
    const beatIcons = ['📋', '🔍', '🔨', '✨', '🦴'];
    html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('bone')} Workshop Phase</div>`;
    html += `<div class="dh-sb-beats">`;
    for (let i = 1; i <= 4; i++) {
      const cls = i < beat ? 'done' : i === beat ? 'active' : '';
      html += `<div class="dh-sb-beat ${cls}"><div class="dh-sb-beat-num">${i}</div><div class="dh-sb-beat-lbl">${beatLabels[i]}</div></div>`;
      if (i < 4) html += `<div class="dh-sb-beat-line ${i < beat ? 'done' : ''}"></div>`;
    }
    html += `</div></div>`;

    // ── Player Build Tracker ──
    const qualSnap = window._dhBuildQuality || {};
    const supplies = window._dhBuildSupplies || {};
    const modifiers = window._dhBuildModifiers || [];
    const revealed = window._dhBuildRevealed || [];
    const maxQ = Math.max(14, ...Object.values(qualSnap).map(v => Math.abs(v)));

    html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('petro')} Build Quality</div>`;
    const sorted = [...data.active].sort((a, b) => (qualSnap[b] || 0) - (qualSnap[a] || 0));
    for (const name of sorted) {
      const q = qualSnap[name] || 0;
      const isRevealed = revealed.includes(name);
      const pct = Math.min(100, Math.max(0, (q / maxQ) * 100));
      const qualColor = q >= 10 ? '#22c55e' : q >= 7 ? 'var(--dh-ochre)' : q >= 4 ? 'var(--dh-sand)' : q > 0 ? 'var(--dh-blood)' : 'var(--dh-dust)';
      const qualDisp = q > 0 ? q.toFixed(1) : '--';

      // Supply pill
      const supplyPill = supplies[name] !== undefined
        ? (supplies[name] ? `<span class="dh-sb-pill dh-sb-pill-good">GOOD</span>` : `<span class="dh-sb-pill dh-sb-pill-bad">SLIM</span>`)
        : '';

      // Social modifier pills for this player
      const playerMods = modifiers.filter(m => (m.players || []).includes(name));
      let modPills = '';
      for (const m of playerMods) {
        if (m.category === 'sabotage') modPills += `<span class="dh-sb-pill dh-sb-pill-sab">${m.actor === name ? 'SABOTEUR' : 'SABOTAGED'}</span>`;
        else if (m.category === 'help') modPills += `<span class="dh-sb-pill dh-sb-pill-help">${m.actor === name ? 'HELPED' : 'GOT HELP'}</span>`;
        else if (m.category === 'argument') modPills += `<span class="dh-sb-pill dh-sb-pill-arg">ARGUMENT</span>`;
        else if (m.category === 'showmance') modPills += `<span class="dh-sb-pill dh-sb-pill-love">MOMENT</span>`;
        else if (m.category === 'scheme') modPills += `<span class="dh-sb-pill dh-sb-pill-scheme">SCHEME</span>`;
        else if (m.category === 'mishap') modPills += `<span class="dh-sb-pill dh-sb-pill-mishap">MISHAP</span>`;
      }

      // Final tag
      const finalTag = isRevealed ? `<span class="dh-sb-pill dh-sb-pill-final">JUDGED</span>` : '';
      const dinoName = data.builds[name]?.dinoName;
      const nameTag = dinoName && isRevealed ? `<div style="font-size:8px;color:var(--dh-dust);font-style:italic;margin-top:1px">"${dinoName}"</div>` : '';

      html += `<div class="dh-sb-player" style="flex-direction:column;align-items:stretch;gap:3px;padding:5px 0">
        <div style="display:flex;align-items:center;gap:6px">${portrait(name, 20)}<div style="flex:1;min-width:0"><span style="font-size:11px;color:var(--dh-bone)">${name}</span>${nameTag}</div><span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:${qualColor}">${qualDisp}</span></div>
        <div class="dh-progress" style="height:5px;margin:0"><div class="dh-progress-fill" style="width:${pct}%;background:${qualColor};transition:width 0.4s"></div></div>
        <div style="display:flex;flex-wrap:wrap;gap:3px">${supplyPill}${modPills}${finalTag}</div>
      </div>`;
    }
    html += `</div>`;

    // ── Drama Ticker ──
    const drama = window._dhBuildDrama || {};
    const dramaTotal = Object.values(drama).reduce((s, v) => s + v, 0);
    if (dramaTotal > 0) {
      html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('shock')} Drama Log</div>`;
      html += `<div class="dh-sb-drama">`;
      if (drama.sabotage) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-blood)">${_icon('pick')}</span><span class="dh-sb-drama-lbl">Sabotages</span><span class="dh-sb-drama-val">${drama.sabotage}</span></div>`;
      if (drama.argument) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-ochre)">${_icon('shock')}</span><span class="dh-sb-drama-lbl">Arguments</span><span class="dh-sb-drama-val">${drama.argument}</span></div>`;
      if (drama.help) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:#22c55e">${_icon('bone')}</span><span class="dh-sb-drama-lbl">Assists</span><span class="dh-sb-drama-val">${drama.help}</span></div>`;
      if (drama.showmance) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:#f472b6">${_icon('petro')}</span><span class="dh-sb-drama-lbl">Moments</span><span class="dh-sb-drama-val">${drama.showmance}</span></div>`;
      if (drama.scheme) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:#a5b4fc">${_icon('petro')}</span><span class="dh-sb-drama-lbl">Schemes</span><span class="dh-sb-drama-val">${drama.scheme}</span></div>`;
      if (drama.mishap) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:#c9a96e">${_icon('barrel')}</span><span class="dh-sb-drama-lbl">Mishaps</span><span class="dh-sb-drama-val">${drama.mishap}</span></div>`;
      html += `</div></div>`;
    }
  } else if (phase === 'vote') {
    // ── Truth Meter ──
    const shockData = window._dhVoteShocks || { honest: 0, shocked: 0 };
    const totalRevealed = shockData.honest + shockData.shocked;
    if (totalRevealed > 0) {
      const honestPct = Math.round((shockData.honest / totalRevealed) * 100);
      const shockPct = 100 - honestPct;
      html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('shock')} Truth Meter</div>`;
      html += `<div class="dh-truth-meter"><div class="dh-truth-bar dh-truth-honest" style="width:${honestPct}%"></div><div class="dh-truth-bar dh-truth-shock" style="width:${shockPct}%"></div></div>`;
      html += `<div style="display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.5px">`;
      html += `<span style="color:var(--electric)">${_icon('rescue')} ${shockData.honest} HONEST</span>`;
      html += `<span style="color:var(--dh-spark)">${_icon('shock')} ${shockData.shocked} SHOCKED</span>`;
      html += `</div></div>`;
    }

    // ── Vote Tally ──
    html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('bone')} Vote Tally</div>`;
    const revealedVotes = window._dhVoteRevealed || {};
    const tally = {};
    for (const [, target] of Object.entries(revealedVotes)) { tally[target] = (tally[target] || 0) + 1; }
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) html += `<div style="color:var(--dh-bone);opacity:0.4;font-size:11px">Votes revealing...</div>`;
    for (const [name, count] of sorted) {
      const pct = Math.min(100, (count / data.active.length) * 100);
      html += `<div class="dh-sb-player" style="flex-wrap:wrap">${portrait(name, 24)}<span style="font-size:11px;color:var(--dh-bone)">${name}</span><span class="dh-sb-score">${count}</span><div style="width:100%;margin-top:2px"><div class="dh-progress" style="height:4px"><div class="dh-progress-fill" style="width:${pct}%;background:var(--electric)"></div></div></div></div>`;
    }
    html += `</div>`;
    // Tool preview after all votes
    const totalVoters = Object.keys(revealedVotes).length;
    if (totalVoters >= data.active.length) {
      html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('pick')} Tools Earned</div>`;
      for (let i = 0; i < Math.min(4, data.voteRanking.length); i++) {
        const n = data.voteRanking[i];
        const tool = TOOL_NAMES[data.toolBonus[n]] || 'bare hands';
        html += `<div class="dh-sb-player">${portrait(n, 22)}<span style="font-size:10px;color:var(--dh-bone)">${n}</span><span style="margin-left:auto;font-size:10px;color:var(--dh-ochre)">${tool}</span></div>`;
      }
      html += `</div>`;
    }
  } else if (phase === 'dig') {
    // ── Round Indicator ──
    const round = window._dhDigRound || 0;
    const maxRounds = data.roundData?.length || 8;
    if (round > 0) {
      const escalation = round <= 2 ? 'LOW' : round <= 4 ? 'MED' : 'HIGH';
      const escColor = round <= 2 ? '#22c55e' : round <= 4 ? 'var(--dh-ochre)' : 'var(--dh-blood)';
      html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('pick')} Round ${round}</div>`;
      html += `<div class="dh-sb-beats">`;
      for (let i = 1; i <= maxRounds; i++) {
        const cls = i < round ? 'done' : i === round ? 'active' : '';
        html += `<div class="dh-sb-beat ${cls}" style="width:16px;height:16px;font-size:8px"><div class="dh-sb-beat-num">${i}</div></div>`;
        if (i < maxRounds) html += `<div class="dh-sb-beat-line ${i < round ? 'done' : ''}" style="flex:1;min-width:4px"></div>`;
      }
      html += `</div>`;
      html += `<div style="margin-top:4px;text-align:center"><span style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:1.5px;padding:2px 6px;border-radius:3px;background:rgba(0,0,0,0.3);color:${escColor}">${_icon('boulder')} HAZARD: ${escalation}</span></div>`;
      html += `</div>`;
    }

    // ── Dig Progress ──
    html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('pick')} Dig Progress</div>`;
    const progress = window._dhDigRevealed || {};
    const trapped = window._dhDigTrapped || new Set();
    const winner = window._dhDigWinner;
    const sorted = Object.entries(progress).sort((a, b) => b[1] - a[1]);
    const threshold = 38;
    if (sorted.length === 0) html += `<div style="color:var(--dh-bone);opacity:0.4;font-size:11px">Dig starting...</div>`;
    for (let si = 0; si < sorted.length; si++) {
      const [name, prog] = sorted[si];
      const pct = Math.min(100, (prog / threshold) * 100);
      const isWinner = name === winner;
      const isTrapped = trapped.has?.(name) || (trapped instanceof Set && trapped.has(name));
      const tb = data.toolBonus[name] || 0;
      const tool = TOOL_NAMES[tb] || 'bare hands';
      const progColor = isWinner ? 'var(--dh-ochre)' : pct >= 70 ? '#22c55e' : pct >= 40 ? 'var(--dh-sand)' : 'var(--dh-dust)';

      let statusPills = '';
      if (isWinner) statusPills += `<span class="dh-sb-pill dh-sb-pill-good" style="background:var(--dh-ochre);color:var(--dh-night)">WINNER</span>`;
      else if (isTrapped) statusPills += `<span class="dh-sb-pill dh-sb-pill-sab">TRAPPED</span>`;
      if (si === 0 && !isWinner && prog > 0) statusPills += `<span class="dh-sb-pill" style="background:rgba(34,197,94,0.15);color:#22c55e;font-size:7px;padding:1px 4px;border-radius:2px">LEAD</span>`;
      if (tb >= 2) statusPills += `<span class="dh-sb-pill" style="background:rgba(214,138,58,0.15);color:var(--dh-ochre);font-size:7px;padding:1px 4px;border-radius:2px">${tool}</span>`;

      html += `<div class="dh-sb-player" style="flex-direction:column;align-items:stretch;gap:2px;padding:4px 0;${isTrapped ? 'opacity:0.5;' : ''}">
        <div style="display:flex;align-items:center;gap:5px">${portrait(name, 20)}<span style="font-size:10px;color:var(--dh-bone);flex:1">${name}</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:${progColor}">${prog.toFixed(0)}/${threshold}</span></div>
        <div class="dh-progress" style="height:5px;margin:0"><div class="dh-progress-fill${isWinner ? ' winner' : ''}" style="width:${pct}%;background:${progColor};transition:width 0.4s"></div></div>
        ${statusPills ? `<div style="display:flex;flex-wrap:wrap;gap:3px">${statusPills}</div>` : ''}
      </div>`;
    }
    html += `</div>`;

    // ── Boulder Hazard Monitor ──
    const boulders = window._dhDigBoulders || { launched: 0, hits: 0, dodges: 0 };
    const rescues = window._dhDigRescues || [];
    if (boulders.launched > 0 || rescues.length > 0) {
      html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('boulder')} Hazard Monitor</div>`;
      html += `<div class="dh-sb-drama">`;
      if (boulders.launched > 0) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-terracotta)">${_icon('boulder')}</span><span class="dh-sb-drama-lbl">Boulders</span><span class="dh-sb-drama-val">${boulders.launched}</span></div>`;
      if (boulders.hits > 0) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-blood)">${_icon('shock')}</span><span class="dh-sb-drama-lbl">Hits</span><span class="dh-sb-drama-val">${boulders.hits}</span></div>`;
      if (boulders.dodges > 0) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:#22c55e">${_icon('bone')}</span><span class="dh-sb-drama-lbl">Dodges</span><span class="dh-sb-drama-val">${boulders.dodges}</span></div>`;
      if (rescues.length > 0) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-ochre)">${_icon('rescue')}</span><span class="dh-sb-drama-lbl">Rescues</span><span class="dh-sb-drama-val">${rescues.length}</span></div>`;
      html += `</div>`;
      // Rescue log
      if (rescues.length > 0) {
        html += `<div style="margin-top:6px">`;
        for (const r of rescues) {
          html += `<div style="display:flex;align-items:center;gap:4px;padding:3px 0;font-size:9px;color:var(--dh-sand)">${portrait(r.rescuer, 16)}<span style="color:var(--dh-ochre)">&rarr;</span>${portrait(r.trapped, 16)}<span>${r.rescuer} saved ${r.trapped}</span></div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    }

    // ── Drama Log ──
    const drama = window._dhDigDrama || {};
    const dramaTotal = Object.values(drama).reduce((s, v) => s + v, 0);
    if (dramaTotal > 0) {
      html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('shock')} Drama Log</div>`;
      html += `<div class="dh-sb-drama">`;
      if (drama.rivalry) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-blood)">${_icon('shock')}</span><span class="dh-sb-drama-lbl">Rivalries</span><span class="dh-sb-drama-val">${drama.rivalry}</span></div>`;
      if (drama.confrontation) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-blood)">${_icon('pick')}</span><span class="dh-sb-drama-lbl">Clashes</span><span class="dh-sb-drama-val">${drama.confrontation}</span></div>`;
      if (drama['tool-envy']) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-ochre)">${_icon('pick')}</span><span class="dh-sb-drama-lbl">Tool Envy</span><span class="dh-sb-drama-val">${drama['tool-envy']}</span></div>`;
      if (drama.showmance) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:#f472b6">${_icon('petro')}</span><span class="dh-sb-drama-lbl">Moments</span><span class="dh-sb-drama-val">${drama.showmance}</span></div>`;
      if (drama.coprolite) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-sand)">${_icon('barrel')}</span><span class="dh-sb-drama-lbl">Mishaps</span><span class="dh-sb-drama-val">${drama.coprolite}</span></div>`;
      if (drama.ignored) html += `<div class="dh-sb-drama-row"><span class="dh-sb-drama-icon" style="color:var(--dh-dust)">${_icon('skull')}</span><span class="dh-sb-drama-lbl">Left Behind</span><span class="dh-sb-drama-val">${drama.ignored}</span></div>`;
      html += `</div></div>`;
    }

    // ── Tools ──
    const anyTools = data.active.some(n => (data.toolBonus[n] || 0) > 0);
    if (anyTools) {
      html += `<div class="dh-sb-section"><div class="dh-sb-title">${_icon('barrel')} Tools</div>`;
      for (const name of data.active) {
        const tb = data.toolBonus[name];
        if (tb > 0) html += `<div style="font-size:10px;color:var(--dh-sand);margin:2px 0">${name}: ${TOOL_NAMES[tb]}</div>`;
      }
      html += `</div>`;
    }
  }
  return html;
}

function _updateSidebar(screenKey) {
  const sideEl = document.getElementById('dh-sidebar-inner');
  if (!sideEl) return;
  const ep = gs.episodeHistory?.[window.vpEpNum - 1];
  const data = ep?.challengeData || ep?.drumheller;
  if (!data) return;
  const phaseEl = sideEl.closest('[data-phase]');
  const phaseFromDom = phaseEl?.getAttribute('data-phase');
  const phaseFromKey = screenKey === 'dh-dig' ? 'dig' : screenKey === 'dh-vote' ? 'vote' : screenKey === 'dh-build' ? 'build' : null;
  const phase = phaseFromKey || phaseFromDom || 'build';
  sideEl.innerHTML = _buildSidebarContent(screenKey, data, phase);
  if (phase === 'dig') {
    try { _updateDigMap(); } catch(_) {}
  }
}

function _initialSidebar(screenKey, data, phase) {
  return _buildSidebarContent(screenKey, data, phase);
}


// ════════════════════════════════════════════════════════════
// VP — SHELL (warm badlands documentary frame)
// ════════════════════════════════════════════════════════════
function _shell(content, ep, phaseCls = '') {
  const epNum = window.vpEpNum || (ep ? (gs.episodeHistory?.indexOf(ep) + 1 || '??') : '??');
  const activeCount = ep?.challengeData?.active?.length || '?';
  const seasonNum = Math.ceil((typeof epNum === 'number' ? epNum : 1) / 12);

  // Scrolling coordinate ticker text (doubled for infinite marquee)
  const tickerText = `51°28′N 112°43′W // DRUMHELLER · ALBERTA // CANADIAN BADLANDS // FINAL ${activeCount} · DAY ${typeof epNum === 'number' ? epNum + 14 : '??'} // BARREL CONTENTS: OIL (intern error) // BOULDER LAUNCHER · CHEF · ACTIVE // WIND: SW 12kt DRY // S${String(seasonNum).padStart(2,'0')} EP${String(epNum).padStart(2,'0')} // FIELD-LOG 0${epNum}`;

  // Phase tab highlighting
  const phaseMap = { 'dh-phase-build': 'build', 'dh-phase-vote': 'vote', 'dh-phase-dig': 'dig' };
  const currentPhase = phaseMap[phaseCls] || '';
  const tabData = [
    { id: 'brief', label: 'Briefing', n: '00' },
    { id: 'build', label: 'Design-o-Saurus', n: '01' },
    { id: 'vote', label: 'Frame-Up', n: '02' },
    { id: 'dig', label: 'Barrel Dig', n: '03' },
    { id: 'results', label: 'Ceremony', n: '04' },
  ];
  const tabsHtml = tabData.map(t => {
    const cls = t.id === currentPhase ? 'active' : (tabData.indexOf(t) < tabData.findIndex(x => x.id === currentPhase) ? 'done' : '');
    return `<button class="dh-tab ${cls}" data-phase="${t.id}"><span class="n">${t.n}</span>${t.label}</button>`;
  }).join('');

  // Particles
  const particles = Array.from({length: 12}, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const dur = 10 + Math.random() * 8;
    return `<div class="dh-particle" style="left:${left}%;bottom:${10 + Math.random() * 60}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
  }).join('');

  // Background dinosaur skeletons (silhouettes at various depths)
  const bgSkeletons = `
    <div class="dh-bg-skeletons">
      <div class="dh-bg-skel s1 near"><svg viewBox="0 0 120 60"><use href="#dh-trex"/></svg></div>
      <div class="dh-bg-skel s2 far"><svg viewBox="0 0 130 60"><use href="#dh-allo"/></svg></div>
      <div class="dh-bg-skel s3"><svg viewBox="0 0 90 50"><use href="#dh-codio"/></svg></div>
      <div class="dh-bg-skel s4"><svg viewBox="0 0 120 60"><use href="#dh-chris"/></svg></div>
      <div class="dh-bg-skel s5 far"><svg viewBox="0 0 120 60"><use href="#dh-trex"/></svg></div>
    </div>`;

  // Tumbleweeds (3 at staggered timing/size)
  const tumbleweeds = `
    <div class="dh-tumbleweeds">
      <div class="dh-tumbleweed" style="--tw-dur:22s;--tw-delay:0s;--tw-y:5%;--tw-sz:20px;--tw-spin:3.5s"><svg viewBox="0 0 24 24"><circle class="dh-tw-inner" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 12 Q12 6 18 12 M7 8 Q12 14 17 8 M8 16 Q12 10 16 16" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.5"/></svg></div>
      <div class="dh-tumbleweed" style="--tw-dur:28s;--tw-delay:7s;--tw-y:15%;--tw-sz:16px;--tw-spin:5s"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 12 Q12 6 18 12 M7 8 Q12 14 17 8" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.5"/></svg></div>
      <div class="dh-tumbleweed" style="--tw-dur:34s;--tw-delay:15s;--tw-y:2%;--tw-sz:26px;--tw-spin:3s"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 12 Q12 6 18 12 M7 8 Q12 14 17 8 M8 16 Q12 10 16 16" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.5"/></svg></div>
    </div>`;

  // Floating bone fragments (6 small bones drifting up from the ground)
  const boneFrags = Array.from({length: 6}, (_, i) => {
    const left = 8 + Math.random() * 84;
    const dur = 16 + Math.random() * 12;
    const delay = Math.random() * 18;
    const rot = -20 + Math.random() * 40;
    const sz = 12 + Math.random() * 10;
    const syms = ['bone', 'skull', 'feather', 'spiral'];
    const sym = syms[i % syms.length];
    return `<div class="dh-bone-frag" style="left:${left}%;bottom:${15 + Math.random()*15}%;--bf-dur:${dur}s;--bf-delay:${delay}s;--bf-rot:${rot}deg"><svg width="${sz}" height="${sz * 0.7}"><use href="#dh-${sym}"/></svg></div>`;
  }).join('');

  // Distant dust clouds (2 large soft blobs)
  const dustClouds = `
    <div class="dh-dust-clouds">
      <div class="dh-dust-cloud" style="width:200px;height:60px;bottom:20px;--dc-dur:35s;--dc-delay:0s"></div>
      <div class="dh-dust-cloud" style="width:140px;height:45px;bottom:40px;--dc-dur:45s;--dc-delay:12s"></div>
    </div>`;

  return `${_css()}${SVG_DEFS}<div class="dh-shell ${phaseCls}">
    <div class="dh-backdrop">
      <div class="dh-sky-layer"></div>
      <div class="dh-dust-haze"></div>
      ${dustClouds}
      <div class="dh-shimmer"></div>
      ${bgSkeletons}
      <div class="dh-horizon">
        <div class="dh-hoodoo h1"></div><div class="dh-hoodoo h2"></div><div class="dh-hoodoo h3"></div>
        <div class="dh-hoodoo h4"></div><div class="dh-hoodoo h5"></div><div class="dh-hoodoo h6"></div>
      </div>
      <div class="dh-flats"></div>
      <div class="dh-particles">${particles}</div>
      <div class="dh-bone-frags">${boneFrags}</div>
      ${tumbleweeds}
    </div>
    <div class="dh-chrome">
      <div class="dh-rec"><span class="dh-rec-dot"></span>REC · FIELD-LOG ${String(epNum).padStart(3, '0')}</div>
      <div class="dh-coord"><div class="dh-coord-inner">${tickerText} // ${tickerText}</div></div>
      <div class="dh-wind">SW 12kt · DRY</div>
      <div class="dh-call">EP·${String(epNum).padStart(2,'0')}</div>
    </div>
    <div class="dh-tabs">${tabsHtml}</div>
    ${content}
  </div>`;
}

// Valley map SVG helper
function _buildValleyMap(data) {
  const active = data.active;
  const colors = ['var(--dh-sand)', 'var(--dh-ochre)', 'var(--dh-terracotta)', 'var(--electric)', 'var(--sky)', '#a78bfa', '#f472b6', '#22c55e'];
  let markers = '';
  const spacing = Math.min(120, 700 / active.length);
  for (let i = 0; i < active.length; i++) {
    const x = 50 + i * spacing;
    const y = 80 + (i % 2) * 20;
    const color = colors[i % colors.length];
    const initials = active[i].split(' ').map(w => w[0]).join('').slice(0, 2);
    markers += `<circle cx="${x}" cy="${y}" r="10" fill="${color}" stroke="var(--dh-night)" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="var(--dh-night)" font-size="8" font-weight="700" font-family="IBM Plex Mono,monospace">${initials}</text>`;
  }
  const w = 50 + active.length * spacing + 50;
  return `<svg viewBox="0 0 ${w} 140" class="dh-valley-svg" style="max-height:120px">
    <path d="M0 20 Q${w/4} 5 ${w/2} 15 Q${w*3/4} 25 ${w} 10 L${w} 40 Q${w*3/4} 50 ${w/2} 45 Q${w/4} 40 0 50Z" fill="rgba(181,86,44,0.3)" stroke="rgba(181,86,44,0.5)" stroke-width="1"/>
    <line x1="0" y1="60" x2="${w}" y2="62" stroke="rgba(232,196,134,0.15)" stroke-width="1"/>
    <line x1="0" y1="100" x2="${w}" y2="98" stroke="rgba(232,196,134,0.1)" stroke-width="1"/>
    <rect x="0" y="110" width="${w}" height="30" fill="rgba(74,46,24,0.4)"/>
    <rect x="${25 + Math.floor(active.length / 2) * spacing}" y="118" width="10" height="12" fill="rgba(214,138,58,0.2)" stroke="rgba(214,138,58,0.3)" stroke-width="0.8" rx="1"/>
    ${markers}</svg>`;
}

function _buildDigMapHTML(data) {
  const active = data.active;
  const spacing = Math.floor(100 / (active.length + 1));
  let markers = '';
  for (let i = 0; i < active.length; i++) {
    const name = active[i];
    const leftPct = spacing * (i + 1);
    const initials = name.slice(0, 3);
    markers += `<div id="dh-digmap-${slug(name)}" class="dh-digmap-marker" style="left:calc(${leftPct}% - 12px);top:18px" data-player="${name}">
      ${portrait(name, 24)}
      <span class="dh-digmap-lbl">${initials}</span>
    </div>`;
  }

  const layerLines = [0.25, 0.5, 0.75].map(f =>
    `<div class="dh-digmap-layer" style="top:${16 + f * 140}px"></div>`
  ).join('');

  return `<div class="dh-digmap" id="dh-digmap">
    <div class="dh-digmap-surface"></div>
    <div class="dh-digmap-layers">${layerLines}</div>
    <div class="dh-digmap-threshold" style="bottom:28px"></div>
    <div class="dh-digmap-barrel">${_icon('barrel')}<span>BARREL</span></div>
    ${markers}
  </div>`;
}

function _updateDigMap() {
  const mapEl = document.getElementById('dh-digmap');
  if (!mapEl) return;
  const progress = window._dhDigRevealed || {};
  const trapped = window._dhDigTrapped || new Set();
  const winner = window._dhDigWinner;
  const threshold = 38;
  const mapHeight = 180;
  const topY = 18;
  const bottomY = mapHeight - 38;
  const range = bottomY - topY;

  for (const [name, prog] of Object.entries(progress)) {
    const marker = document.getElementById('dh-digmap-' + slug(name));
    if (!marker) continue;
    const pct = Math.min(1, prog / threshold);
    const y = topY + pct * range;
    marker.style.top = y + 'px';
    marker.classList.toggle('trapped', trapped.has?.(name) || false);
    marker.classList.toggle('winner', name === winner);
  }
}

// ════════════════════════════════════════════════════════════
// VP — DIG SITE SCENE (cold open animated vignette)
// ════════════════════════════════════════════════════════════
function _buildDigScene(active) {
  const tools = ['pick', 'shovel', 'pick', 'post', 'shovel', 'pick', 'bucket', 'shovel'];
  const boneSymbols = ['bone', 'skull', 'spiral', 'feather', 'petro'];
  const count = active.length;
  const spacing = Math.min(130, 520 / count);
  const startX = Math.max(20, (600 - count * spacing) / 2);

  let diggers = '';
  for (let i = 0; i < count; i++) {
    const name = active[i];
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
    const x = startX + i * spacing;
    const toolSym = tools[i % tools.length];
    const delay = (1.6 + i * 0.2).toFixed(2);
    const swingDelay = (0.1 * i).toFixed(2);

    // Dirt particles (2-3 per player)
    let dirt = '';
    for (let d = 0; d < 2 + (i % 2); d++) {
      const dx = (-10 + Math.round(Math.random() * 20));
      const dirtDelay = (2.0 + i * 0.2 + d * 0.4).toFixed(2);
      const dirtX = x + 8 + d * 6;
      dirt += `<div class="dh-scene-dirt" style="left:${dirtX}px;bottom:32px;--dx:${dx}px;animation-delay:${dirtDelay}s"></div>`;
    }

    diggers += `<div class="dh-digger" style="left:${x}px;animation-delay:${delay}s">
      <div style="position:relative">
        <div class="dh-digger-avatar"><img src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none';this.parentElement.textContent='${initials}'"></div>
        <div class="dh-digger-tool" style="animation-delay:${swingDelay}s"><svg width="18" height="18"><use href="#dh-${toolSym}"/></svg></div>
      </div>
      <div class="dh-digger-name">${name.split(' ')[0]}</div>
    </div>${dirt}`;
  }

  // Buried bones peeking out between diggers
  let bones = '';
  for (let b = 0; b < Math.min(3, count - 1); b++) {
    const bx = startX + (b + 0.5) * spacing + 15;
    const sym = boneSymbols[b % boneSymbols.length];
    const bDelay = (2.8 + b * 0.6).toFixed(2);
    bones += `<div class="dh-scene-bone" style="left:${bx}px;animation-delay:${bDelay}s"><svg width="24" height="16"><use href="#dh-${sym}"/></svg></div>`;
  }

  return `<div class="dh-scene">
    <div class="dh-scene-ground"></div>
    <div class="dh-scene-stratum"></div>
    <div class="dh-scene-stratum s2"></div>
    <div class="dh-scene-stratum s3"></div>
    ${diggers}${bones}
  </div>`;
}

// ════════════════════════════════════════════════════════════
// VP — TITLE CARD
// ════════════════════════════════════════════════════════════
export function rpBuildDHTitleCard(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const epNum = window.vpEpNum || (gs.episodeHistory?.indexOf(ep) + 1 || '??');
  const activeCount = data.active.length;
  const seasonNum = Math.ceil((typeof epNum === 'number' ? epNum : 1) / 12);

  // Bone columns (left and right)
  const boneColIcons = ['bone','skull','spiral','petro','bone','feather','skull'];
  const boneColL = boneColIcons.map((ic, i) => `<svg width="28" height="20" style="color:var(--dh-dust);animation-delay:${(0.3 + i * 0.12).toFixed(2)}s"><use href="#dh-${ic}"/></svg>`).join('');
  const boneColR = [...boneColIcons].reverse().map((ic, i) => `<svg width="28" height="20" style="color:var(--dh-dust);animation-delay:${(0.4 + i * 0.12).toFixed(2)}s"><use href="#dh-${ic}"/></svg>`).join('');

  let rosterHtml = '';
  for (let i = 0; i < data.active.length; i++) {
    const name = data.active[i];
    const a = arch(name);
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
    const delay = (1.8 + i * 0.15).toFixed(2);
    rosterHtml += `<div class="dh-roster-chip" style="animation-delay:${delay}s"><div class="dh-roster-avatar"><img src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none';this.parentElement.textContent='${initials}'"></div><div><div class="dh-roster-name">${name}</div><div class="dh-roster-arch">${a}</div></div></div>`;
  }

  return _shell(`
    <div class="dh-hero">
      <div class="dh-bone-col l" aria-hidden="true">${boneColL}</div>
      <div class="dh-bone-col r" aria-hidden="true">${boneColR}</div>
      <div class="dh-stamp-meta">
        <span>SEASON ${String(seasonNum).padStart(2,'0')}</span><span class="dot"></span>
        <span>EPISODE ${String(epNum).padStart(2,'0')}</span><span class="dot"></span>
        <span class="pip">FINAL ${activeCount} → FINAL ${activeCount - 1}</span><span class="dot"></span>
        <span>ARCHAEOLOGY · 2-PART</span>
      </div>
      <div class="dh-hero-title">
        <span class="pre">AWWWWWW<span class="comma">,</span></span>
        DRUMHELLER
      </div>
      <div class="dh-hero-sub">Bones · Boulders · Barrels of Oil · Birthday</div>
      <div class="dh-hero-tag">In the Alberta badlands, ${activeCount} contestants build dinosaur skeletons, face a lie-detector vote for digging tools, then race to unearth a buried barrel while dodging falling boulders. First to find the barrel wins individual immunity.</div>
      ${_buildDigScene(data.active)}
      <div class="dh-hero-stats">
        <div class="dh-stat-box" style="animation-delay:1.6s"><div class="dh-stat-box-val">${activeCount}</div><div class="dh-stat-box-lbl">Remaining</div></div>
        <div class="dh-stat-box" style="animation-delay:1.72s"><div class="dh-stat-box-val">1</div><div class="dh-stat-box-lbl">Buried Barrel</div></div>
        <div class="dh-stat-box" style="animation-delay:1.84s"><div class="dh-stat-box-val">~90s</div><div class="dh-stat-box-lbl">Boulder Cadence</div></div>
        <div class="dh-stat-box" style="animation-delay:1.96s"><div class="dh-stat-box-val">4</div><div class="dh-stat-box-lbl">Tool Tiers</div></div>
      </div>
      <div class="dh-roster">${rosterHtml}</div>
    </div>
  `, ep, '');
}


// ════════════════════════════════════════════════════════════
// VP — BUILD PHASE
// ════════════════════════════════════════════════════════════
export function rpBuildDHBuildPhase(ep) {
  const data = ep.challengeData;
  if (!data) return '';

  const screenKey = 'dh-build';
  window._tvState = window._tvState || {};
  window._tvState[screenKey] = window._tvState[screenKey] || { idx: -1 };
  window._dhBuildRevealed = [];
  window._dhBuildQuality = {};
  window._dhBuildSupplies = {};
  window._dhBuildModifiers = [];
  window._dhBuildDrama = {};
  window._dhBuildBeat = 0;
  window._dhStepMeta = window._dhStepMeta || {};
  window._dhStepMeta[screenKey] = [];

  let cards = '';
  let stepIdx = 0;
  const stepMeta = window._dhStepMeta[screenKey];
  const bpe = data.buildPhaseEvents || { beat1: [], beat2: [], beat3: [] };

  // Quality tracker for progressive sidebar
  const qualTracker = {};
  data.active.forEach(n => { qualTracker[n] = 0; });

  // ── Opening Brief ──
  cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card"><div class="dh-brief">${host()} leads the group to a paleontology dig site stocked with fossil fragments, glitter glue, and questionable building supplies. "Welcome to Design-o-Saurus! Build me a dinosaur," ${host()} grins. "First, raid the cargo hold for supplies. Then BUILD. Best builds earn the best digging tools for Phase 2."</div></div>`;
  stepMeta[stepIdx] = { beat: 0, qualitySnapshot: { ...qualTracker } };
  stepIdx++;

  // Opening atmosphere
  cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" style="border:none;background:none"><div class="dh-atmo">${pick(ATMOSPHERE_BUILD)}</div></div>`;
  stepMeta[stepIdx] = { beat: 0, qualitySnapshot: { ...qualTracker } };
  stepIdx++;

  // ── Beat 1: Supply Scavenge ──
  cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" style="border:none;background:rgba(214,138,58,0.08);border-left:3px solid var(--dh-ochre)"><div style="font-family:'Cinzel',serif;color:var(--dh-ochre);font-size:14px;letter-spacing:2px">${_icon('bone')} SUPPLY SCAVENGE</div><div class="dh-atmo" style="margin-top:6px">${pick(BEAT_TRANS_SCAVENGE)}</div></div>`;
  stepMeta[stepIdx] = { beat: 1, qualitySnapshot: { ...qualTracker } };
  stepIdx++;

  for (const ev of bpe.beat1) {
    const isSocial = ev.type === 'supply-steal' || ev.type === 'help-build';
    const isSteal = ev.type === 'supply-steal';
    const isHelp = ev.type === 'help-build';
    const borderStyle = isSteal ? 'border-color:rgba(168,40,28,0.5)' : isHelp ? 'border-color:rgba(34,197,94,0.4)' : '';
    const cardCls = isSocial ? 'dh-card-social' : 'dh-card';

    // Update quality tracker
    if (ev.type === 'supply-find' && ev.player) qualTracker[ev.player] = (qualTracker[ev.player] || 0) + 1.0;
    else if (ev.type === 'supply-find-bad' && ev.player) qualTracker[ev.player] = (qualTracker[ev.player] || 0) + 0.2;
    else if (ev.type === 'supply-steal') {
      if (ev.thief) qualTracker[ev.thief] = (qualTracker[ev.thief] || 0) + 1.2;
      if (ev.victim) qualTracker[ev.victim] = (qualTracker[ev.victim] || 0) - 1.2;
    } else if (ev.type === 'help-build') {
      if (ev.helper) qualTracker[ev.helper] = (qualTracker[ev.helper] || 0) + 0.4;
      if (ev.target) qualTracker[ev.target] = (qualTracker[ev.target] || 0) + 0.8;
    }

    const playerPortraits = (ev.players || [ev.player]).filter(Boolean).map(n =>
      `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px">${portrait(n, 22)}<span style="font-size:10px;color:var(--dh-bone);font-weight:600">${n}</span></span>`
    ).join('');

    const badge = isSteal ? `<span class="dh-badge dh-badge-red" style="font-size:9px">STOLEN</span>` :
      isHelp ? `<span class="dh-badge dh-badge-green" style="font-size:9px">HELP</span>` :
      ev.delta === '+' ? `<span class="dh-badge dh-badge-gold" style="font-size:9px">GOOD FIND</span>` :
      `<span class="dh-badge dh-badge-grey" style="font-size:9px">SLIM PICKINGS</span>`;

    cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="${cardCls}" style="${borderStyle}">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap">${playerPortraits}${badge}</div>
      <div class="dh-player-detail" style="font-size:12px">${ev.text}</div>
    </div>`;
    const b1Meta = { beat: 1, qualitySnapshot: { ...qualTracker } };
    if (ev.type === 'supply-find') b1Meta.supplyResult = { player: ev.player, good: true };
    else if (ev.type === 'supply-find-bad') b1Meta.supplyResult = { player: ev.player, good: false };
    else if (ev.type === 'supply-steal') b1Meta.socialEvent = { category: 'sabotage', type: 'steal', players: [ev.thief, ev.victim], label: `Stole from ${ev.victim}`, target: ev.victim, actor: ev.thief };
    else if (ev.type === 'help-build') b1Meta.socialEvent = { category: 'help', type: 'help', players: [ev.helper, ev.target], label: `Helped ${ev.target}`, target: ev.target, actor: ev.helper };
    stepMeta[stepIdx] = b1Meta;
    stepIdx++;
  }

  // ── Beat 2: Build Process ──
  cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" style="border:none;background:rgba(214,138,58,0.08);border-left:3px solid var(--dh-ochre)"><div style="font-family:'Cinzel',serif;color:var(--dh-ochre);font-size:14px;letter-spacing:2px">${_icon('bone')} BUILD PROCESS</div><div class="dh-atmo" style="margin-top:6px">${pick(BEAT_TRANS_BUILD)}</div></div>`;
  for (const name of data.active) {
    qualTracker[name] = (qualTracker[name] || 0) + (data.builds[name].quality - qualTracker[name]) * 0.5;
  }
  stepMeta[stepIdx] = { beat: 2, qualitySnapshot: { ...qualTracker } };
  stepIdx++;

  // Atmosphere between build events
  cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" style="border:none;background:none"><div class="dh-atmo">${pick(ATMOSPHERE_BUILD)}</div></div>`;
  stepMeta[stepIdx] = { beat: 2, qualitySnapshot: { ...qualTracker } };
  stepIdx++;

  for (let ei = 0; ei < bpe.beat2.length; ei++) {
    const ev = bpe.beat2[ei];
    const isSab = ev.type === 'sabotage';
    const isHelp = ev.type === 'help-build' || ev.type === 'encourage';
    const isScheme = ev.type === 'scheme-convo';
    const isShowmance = ev.type === 'showmance-build';
    const isArg = ev.type === 'argument';
    const borderStyle = isSab ? 'border-color:rgba(168,40,28,0.5)' : isHelp ? 'border-color:rgba(34,197,94,0.4)' : isShowmance ? 'border-color:rgba(236,72,153,0.4);background:rgba(236,72,153,0.05)' : isScheme ? 'border-color:rgba(100,100,180,0.4)' : '';

    // Update quality tracker for events with quality changes
    if (isSab && ev.victim) qualTracker[ev.victim] = (qualTracker[ev.victim] || 0) - 1.5;
    if (ev.type === 'encourage' && ev.target) qualTracker[ev.target] = (qualTracker[ev.target] || 0) + 0.8;
    if (ev.type === 'help-build') {
      if (ev.helper) qualTracker[ev.helper] = (qualTracker[ev.helper] || 0) + 0.4;
      if (ev.target) qualTracker[ev.target] = (qualTracker[ev.target] || 0) + 0.8;
    }
    if (isArg && ev.players) {
      for (const p of ev.players) qualTracker[p] = (qualTracker[p] || 0) - 0.4;
    }
    if (isShowmance && ev.players) {
      for (const p of ev.players) qualTracker[p] = (qualTracker[p] || 0) + 0.6;
    }

    const playerPortraits = (ev.players || []).map(n =>
      `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px">${portrait(n, 22)}<span style="font-size:10px;color:var(--dh-bone);font-weight:600">${n}</span></span>`
    ).join('');

    const badge = isSab ? `<span class="dh-badge dh-badge-red" style="font-size:9px">SABOTAGE</span>` :
      isHelp ? `<span class="dh-badge dh-badge-green" style="font-size:9px">${ev.type === 'encourage' ? 'ENCOURAGE' : 'TEAMWORK'}</span>` :
      isShowmance ? `<span class="dh-badge" style="font-size:9px;background:rgba(236,72,153,0.3);color:#f472b6">MOMENT</span>` :
      isScheme ? `<span class="dh-badge" style="font-size:9px;background:rgba(100,100,180,0.3);color:#a5b4fc">STRATEGY</span>` :
      isArg ? `<span class="dh-badge dh-badge-red" style="font-size:9px">ARGUMENT</span>` :
      '';

    cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social" style="${borderStyle}">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap">${playerPortraits}${badge}</div>
      <div class="dh-player-detail" style="font-size:12px">${ev.text}</div>
    </div>`;
    const b2Social = { category: isSab ? 'sabotage' : isArg ? 'argument' : isHelp ? 'help' : isShowmance ? 'showmance' : isScheme ? 'scheme' : 'other',
      type: ev.type, players: ev.players || [] };
    if (isSab) { b2Social.label = `Sabotaged ${ev.victim}`; b2Social.actor = ev.saboteur; b2Social.target = ev.victim; }
    else if (isArg) { b2Social.label = `${ev.players[0]} vs ${ev.players[1]}`; }
    else if (ev.type === 'encourage') { b2Social.label = `Encouraged ${ev.target}`; b2Social.actor = ev.encourager; b2Social.target = ev.target; }
    else if (ev.type === 'help-build') { b2Social.label = `Helped ${ev.target}`; b2Social.actor = ev.helper; b2Social.target = ev.target; }
    else if (isShowmance) { b2Social.label = `${ev.players[0]} & ${ev.players[1]}`; }
    else if (isScheme) { b2Social.label = `${ev.players[0]} & ${ev.players[1]}`; }
    stepMeta[stepIdx] = { beat: 2, qualitySnapshot: { ...qualTracker }, socialEvent: b2Social };
    stepIdx++;

    // Atmosphere between every 2 events
    if (ei > 0 && ei % 2 === 0 && ei < bpe.beat2.length - 1) {
      cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" style="border:none;background:none"><div class="dh-atmo">${pick(ATMOSPHERE_BUILD)}</div></div>`;
      stepMeta[stepIdx] = { beat: 2, qualitySnapshot: { ...qualTracker } };
      stepIdx++;
    }
  }

  // ── Beat 3: Finishing Touches ──
  cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" style="border:none;background:rgba(214,138,58,0.08);border-left:3px solid var(--dh-ochre)"><div style="font-family:'Cinzel',serif;color:var(--dh-ochre);font-size:14px;letter-spacing:2px">${_icon('bone')} FINISHING TOUCHES</div><div class="dh-atmo" style="margin-top:6px">${pick(BEAT_TRANS_FINISHING)}</div></div>`;
  stepMeta[stepIdx] = { beat: 3, qualitySnapshot: { ...qualTracker } };
  stepIdx++;

  for (const ev of bpe.beat3) {
    const isCoprolite = ev.type === 'coprolite';
    const isSab = ev.type === 'sabotage';
    const isHelp = ev.type === 'help-build';
    const borderStyle = isSab ? 'border-color:rgba(168,40,28,0.5)' : isHelp ? 'border-color:rgba(34,197,94,0.4)' : isCoprolite ? 'border-color:rgba(139,90,43,0.6);background:rgba(139,90,43,0.08)' : '';

    if (isCoprolite && ev.player) qualTracker[ev.player] = (qualTracker[ev.player] || 0) - 0.5;
    if (isSab && ev.victim) qualTracker[ev.victim] = (qualTracker[ev.victim] || 0) - 1.0;
    if (isHelp && ev.target) qualTracker[ev.target] = (qualTracker[ev.target] || 0) + 0.6;

    const playerPortraits = (ev.players || [ev.player]).filter(Boolean).map(n =>
      `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px">${portrait(n, 22)}<span style="font-size:10px;color:var(--dh-bone);font-weight:600">${n}</span></span>`
    ).join('');

    const badge = isCoprolite ? `<span class="dh-badge" style="font-size:9px;background:rgba(139,90,43,0.4);color:#c9a96e">COPROLITE!</span>` :
      isSab ? `<span class="dh-badge dh-badge-red" style="font-size:9px">LAST-SEC SABOTAGE</span>` :
      isHelp ? `<span class="dh-badge dh-badge-green" style="font-size:9px">HELPING HAND</span>` :
      '';

    cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="${isCoprolite ? 'dh-card' : 'dh-card-social'}" style="${borderStyle}">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap">${playerPortraits}${badge}</div>
      <div class="dh-player-detail" style="font-size:12px">${ev.text}</div>
    </div>`;
    const b3Social = isCoprolite ? { category: 'mishap', type: 'coprolite', players: [ev.player], label: 'Coprolite disaster' }
      : isSab ? { category: 'sabotage', type: 'sabotage', players: ev.players || [], label: `Sabotaged ${ev.victim}`, actor: ev.saboteur, target: ev.victim }
      : isHelp ? { category: 'help', type: 'help', players: ev.players || [], label: `Helped ${ev.target}`, actor: ev.helper, target: ev.target }
      : null;
    stepMeta[stepIdx] = { beat: 3, qualitySnapshot: { ...qualTracker }, ...(b3Social ? { socialEvent: b3Social } : {}) };
    stepIdx++;
  }

  // ── Final Reveals — each player's finished dinosaur ──
  cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" style="border:none;background:rgba(214,138,58,0.08);border-left:3px solid var(--dh-ochre)"><div style="font-family:'Cinzel',serif;color:var(--dh-ochre);font-size:14px;letter-spacing:2px">${_icon('bone')} FINAL BUILDS</div><div class="dh-atmo" style="margin-top:6px">"TIME! Hands off your dinosaurs!" ${host()} surveys the carnage of bones, glue, and creative ambition.</div></div>`;
  stepMeta[stepIdx] = { beat: 4, qualitySnapshot: { ...qualTracker } };
  stepIdx++;

  const shuffled = [...data.active].sort(() => Math.random() - 0.5);
  window._dhBuildOrder = shuffled;

  for (let i = 0; i < shuffled.length; i++) {
    const name = shuffled[i];
    const build = data.builds[name];
    const qualityLabel = build.quality >= 10 ? 'EXCELLENT' : build.quality >= 7 ? 'SOLID' : build.quality >= 4 ? 'DECENT' : 'ROUGH';
    const qualityColor = build.quality >= 10 ? '#22c55e' : build.quality >= 7 ? 'var(--dh-ochre)' : build.quality >= 4 ? 'var(--dh-sand)' : 'var(--dh-blood)';
    const borderColor = build.quality >= 10 ? 'rgba(34,197,94,0.4)' : build.quality >= 7 ? 'rgba(214,138,58,0.4)' : build.quality >= 4 ? 'var(--dh-shadow)' : 'rgba(168,40,28,0.4)';
    const dinoSvg = _getDinoSvg(name, build.quality);
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2);
    const dinoName = build.dinoName || '';
    const suppliesList = (build.suppliesFound || []).slice(0, 3).join(', ') || 'scraps';

    // Set final quality in tracker
    qualTracker[name] = build.quality;

    cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" style="border-color:${borderColor}" data-player="${name}">
      <div class="dh-player-row">
        <div style="width:40px;height:40px;border-radius:50%;border:2px solid ${borderColor};overflow:hidden;flex-shrink:0"><img src="assets/avatars/${slug(name)}.png" alt="${name}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.parentElement.textContent='${initials}'"></div>
        <div><div class="dh-player-name">${name}</div><div style="font-size:10px;color:${qualityColor};font-weight:700;letter-spacing:0.5px;font-family:'IBM Plex Mono',monospace">${qualityLabel}</div></div>
        <div class="dh-badge dh-badge-${build.quality >= 10 ? 'green' : build.quality >= 7 ? 'gold' : build.quality >= 4 ? 'grey' : 'red'}" style="margin-left:auto">${qualityLabel}</div>
      </div>
      ${dinoName ? `<div style="font-family:'Cinzel',serif;color:var(--dh-ochre);font-size:12px;text-align:center;margin:6px 0;letter-spacing:1px">"${dinoName}"</div>` : ''}
      <div class="dh-build-dino">${dinoSvg}</div>
      <div class="dh-player-detail" style="margin:8px 0;font-size:12px">${build.desc}</div>
      <div style="font-size:10px;color:var(--dh-dust);margin-bottom:6px">Built with: ${suppliesList}</div>
      <div class="dh-build-stats">
        <div class="dh-build-stat"><div class="dh-build-stat-val">${build.quality.toFixed(1)}</div><div class="dh-build-stat-lbl">Accuracy</div></div>
      </div>
    </div>`;
    stepMeta[stepIdx] = { beat: 4, player: name, qualitySnapshot: { ...qualTracker } };
    stepIdx++;

    // Atmosphere every 3 builds
    if (i > 0 && i % 3 === 0 && i < shuffled.length - 1) {
      cards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card" style="border:none;background:none"><div class="dh-atmo">${pick(ATMOSPHERE_BUILD)}</div></div>`;
      stepMeta[stepIdx] = { beat: 4, qualitySnapshot: { ...qualTracker } };
      stepIdx++;
    }
  }

  const totalSteps = stepIdx;
  const controls = `<div id="dh-controls-${screenKey}" class="dh-controls"><button class="dh-btn" onclick="dhRevealNext('${screenKey}',${totalSteps})">REVEAL NEXT</button><button class="dh-btn" onclick="dhRevealAll('${screenKey}',${totalSteps})">REVEAL ALL</button><span id="dh-counter-${screenKey}" class="dh-counter">0 / ${totalSteps}</span></div>`;

  const sidebarInit = _initialSidebar(screenKey, data, 'build');
  return _shell(`
    <div class="dh-layout" data-phase="build">
      <div class="dh-feed"><div class="dh-phase-hdr">${_icon('bone')} Design-o-Saurus <span class="dh-phase-tag">Bone Yard</span></div>${cards}</div>
      <div class="dh-sidebar"><div id="dh-sidebar-inner">${sidebarInit}</div></div>
    </div>${controls}
  `, ep, 'dh-phase-build');
}


// ════════════════════════════════════════════════════════════
// VP — VOTE PHASE
// ════════════════════════════════════════════════════════════
export function rpBuildDHVotePhase(ep) {
  const data = ep.challengeData;
  if (!data) return '';

  const screenKey = 'dh-vote';
  window._tvState = window._tvState || {};
  window._tvState[screenKey] = window._tvState[screenKey] || { idx: -1 };
  window._dhVoteRevealed = {};
  window._dhVoteShocks = { honest: 0, shocked: 0 };
  window._dhStepMeta = window._dhStepMeta || {};
  window._dhStepMeta[screenKey] = [];

  const voters = [...data.active];
  const reasons = data.voteReasons || {};
  let stepIdx = 0;
  let voteCards = '';
  const stepMeta = window._dhStepMeta[screenKey];

  // Brief
  voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote"><div class="dh-brief" style="border-color:rgba(45,212,191,0.3)">${host()} unveils the lie-detector chair. "Time to vote on whose dinosaur was best. But here's the thing — the polygraph WILL catch you if you lie. And liars get <em>shocked</em>." The chair sparks ominously. Top vote-getters earn the best digging tools for Phase 2.</div></div>`;
  stepMeta[stepIdx] = {};
  stepIdx++;

  voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote" style="border:none;background:none"><div class="dh-atmo">${pickU(ATMOSPHERE_VOTE)}</div></div>`;
  stepMeta[stepIdx] = {};
  stepIdx++;

  for (let vi = 0; vi < voters.length; vi++) {
    const voter = voters[vi];
    const target = data.votes[voter];
    const pr = pronouns(voter);
    const shock = data.shockMoments.find(s => s.voter === voter);
    const reason = reasons[voter] || 'quality';
    const reasonPool = VOTE_REASON_TEXT[reason] || VOTE_REASON_TEXT.quality;
    const approachText = pickU(VOTE_APPROACH_TEXT)(voter, pr);
    const reasonText = pickU(reasonPool)(voter, target);

    if (shock) {
      const shockReaction = pickU(VOTE_SHOCK_REACTION)(voter);
      voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote dh-shock-card dh-shock-animate" data-voter="${voter}" data-target="${target}">
        <div class="dh-vote-approach">${approachText}</div>
        <div class="dh-player-row">
          ${portrait(voter, 42)}
          <div style="flex:1">
            <div class="dh-player-name" style="color:var(--dh-spark)">${voter} <span class="dh-zap-spark"></span><span class="dh-zap-spark"></span>${_icon('shock')}</div>
            <div class="dh-player-detail" style="margin-top:4px">${pickU(VOTE_SHOCK_TEXT)(voter, pr)}</div>
            <div style="margin-top:8px;display:flex;align-items:center;gap:6px">
              <span style="text-decoration:line-through;color:var(--dh-blood);font-size:12px;opacity:0.7">${shock.triedTarget}</span>
              <span class="dh-vote-arrow">&rarr;</span>
              ${portrait(target, 28)}
              <span style="color:var(--electric);font-weight:700;font-size:13px">${target}</span>
            </div>
            <div class="dh-vote-reason">${reasonText}</div>
          </div>
          <div class="dh-badge dh-badge-red" style="align-self:flex-start">SHOCKED</div>
        </div>
        <div class="dh-vote-crowd">${shockReaction}</div>
      </div>`;
    } else {
      const honestReaction = pickU(VOTE_HONEST_REACTION)();
      voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote" data-voter="${voter}" data-target="${target}">
        <div class="dh-vote-approach">${approachText}</div>
        <div class="dh-player-row">
          ${portrait(voter, 42)}
          <div style="flex:1">
            <div class="dh-player-name">${voter}</div>
            <div class="dh-player-detail" style="margin-top:2px">${pickU(VOTE_HONEST_TEXT)(voter, target, pr)}</div>
            <div class="dh-vote-reason">${reasonText}</div>
          </div>
          <span class="dh-vote-arrow">&rarr;</span>
          ${portrait(target, 36)}
          <span style="color:var(--electric);font-weight:700;font-size:13px">${target}</span>
        </div>
        <div class="dh-vote-crowd">${honestReaction}</div>
      </div>`;
    }
    stepMeta[stepIdx] = { voter, target, isShock: !!shock };
    stepIdx++;

    // Atmosphere every 2-3 votes (every 2, with occasional skip at 3)
    if ((vi + 1) % 2 === 0 && vi < voters.length - 1 && (vi % 6 !== 5)) {
      voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote" style="border:none;background:none"><div class="dh-atmo">${pickU(ATMOSPHERE_VOTE)}</div></div>`;
      stepMeta[stepIdx] = {};
      stepIdx++;
    }
  }

  // Vote fallout — individual cards per event
  for (const f of data.voteFallout) {
    if (f.type === 'betrayal') {
      const prA = pronouns(f.a);
      voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote dh-fallout-card dh-fallout-betrayal">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${portrait(f.a, 32)}${_icon('shock')}${portrait(f.b, 32)}
          <span style="font-family:'Cinzel',serif;font-size:12px;color:var(--dh-blood);letter-spacing:1px">BETRAYAL</span>
          <span class="dh-badge dh-badge-red" style="font-size:8px;margin-left:auto">${f.delta}</span>
        </div>
        <div style="font-size:12px;color:var(--dh-bone);line-height:1.5">${f.a} expected ${f.b} to vote for ${prA.obj}. ${f.b} didn't. The trust between them cracked.</div>
      </div>`;
    } else if (f.type === 'respect') {
      voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote dh-fallout-card dh-fallout-respect">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${portrait(f.a, 32)}${_icon('rescue')}${portrait(f.b, 32)}
          <span style="font-family:'Cinzel',serif;font-size:12px;color:var(--electric);letter-spacing:1px">GRUDGING RESPECT</span>
        </div>
        <div style="font-size:12px;color:var(--dh-bone);line-height:1.5">${f.a} was surprised ${f.b} voted for ${pronouns(f.a).obj}. An unexpected nod of acknowledgment passed between them.</div>
      </div>`;
    } else if (f.type === 'zero') {
      const prZ = pronouns(f.name);
      voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote dh-fallout-card dh-fallout-zero">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${portrait(f.name, 32)}
          <span style="font-family:'Cinzel',serif;font-size:12px;color:var(--dh-dust);letter-spacing:1px">ZERO VOTES</span>
        </div>
        <div style="font-size:12px;color:var(--dh-bone);line-height:1.5;opacity:0.8">${pickU(VOTE_ZERO_TEXT)(f.name, prZ)}</div>
      </div>`;
    }
    stepMeta[stepIdx] = {};
    stepIdx++;
  }

  // Tool assignment
  voteCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-vote" style="border-color:rgba(214,138,58,0.4)">
    <div style="font-family:'Cinzel',serif;color:var(--dh-ochre);margin-bottom:10px;font-size:15px;letter-spacing:1px">${_icon('pick')} TOOL ASSIGNMENT</div>
    <div style="font-size:12px;color:var(--dh-bone);opacity:0.7;margin-bottom:10px">Based on votes received, ${host()} distributes digging equipment for Phase 2:</div>`;
  for (let i = 0; i < data.voteRanking.length; i++) {
    const name = data.voteRanking[i];
    const tool = TOOL_NAMES[data.toolBonus[name]] || 'bare hands';
    const bonus = data.toolBonus[name] || 0;
    const votes = data.votesReceived[name] || 0;
    const tierColor = bonus === 3 ? '#22c55e' : bonus === 2 ? 'var(--dh-ochre)' : bonus === 1 ? 'var(--dh-sand)' : 'var(--dh-bone)';
    voteCards += `<div class="dh-player-row" style="padding:4px 0;${i < 3 ? 'border-bottom:1px solid rgba(74,46,24,0.3)' : ''}">${portrait(name, 30)}<div style="flex:1"><span class="dh-player-name" style="font-size:13px">${name}</span><span style="font-size:10px;color:var(--dh-bone);opacity:0.5;margin-left:6px">(${votes} vote${votes !== 1 ? 's' : ''})</span></div><span style="font-size:12px;color:${tierColor};font-weight:700;font-family:'IBM Plex Mono',monospace">${tool}</span><span style="font-size:10px;color:var(--dh-sand);opacity:0.6;margin-left:4px">+${bonus}</span></div>`;
  }
  const topName = data.voteRanking[0];
  const topVotes = data.votesReceived[topName] || 0;
  voteCards += `<div style="margin-top:8px;font-size:11px;color:var(--dh-dust);font-style:italic">"${topName} — ${topVotes} votes. That's a Post Digger right there." ${host()} tossed the tool with a grin.</div>`;
  voteCards += `</div>`;
  stepMeta[stepIdx] = {};
  stepIdx++;

  const totalSteps = stepIdx;
  const controls = `<div id="dh-controls-${screenKey}" class="dh-controls"><button class="dh-btn" onclick="dhRevealNext('${screenKey}',${totalSteps})">REVEAL NEXT</button><button class="dh-btn" onclick="dhRevealAll('${screenKey}',${totalSteps})">REVEAL ALL</button><span id="dh-counter-${screenKey}" class="dh-counter">0 / ${totalSteps}</span></div>`;

  const sidebarInit = _initialSidebar(screenKey, data, 'vote');
  return _shell(`
    <div class="dh-layout" data-phase="vote">
      <div class="dh-feed"><div class="dh-phase-hdr">${_icon('shock')} Lie-Detector Vote <span class="dh-phase-tag">The Chair</span></div>${voteCards}</div>
      <div class="dh-sidebar"><div id="dh-sidebar-inner">${sidebarInit}</div></div>
    </div>${controls}
  `, ep, 'dh-phase-vote');
}


// ════════════════════════════════════════════════════════════
// VP — DIG PHASE
// ════════════════════════════════════════════════════════════
export function rpBuildDHDigPhase(ep) {
  const data = ep.challengeData;
  if (!data) return '';

  _usedTexts.clear();

  const screenKey = 'dh-dig';
  window._tvState = window._tvState || {};
  window._tvState[screenKey] = window._tvState[screenKey] || { idx: -1 };
  window._dhDigRevealed = {};
  data.active.forEach(n => { window._dhDigRevealed[n] = 0; });
  window._dhDigRound = 0;
  window._dhDigBoulders = { launched: 0, hits: 0, dodges: 0 };
  window._dhDigRescues = [];
  window._dhDigTrapped = new Set();
  window._dhDigDrama = {};
  window._dhDigWinner = null;
  window._dhStepMeta = window._dhStepMeta || {};
  window._dhStepMeta[screenKey] = [];

  let stepIdx = 0;
  let digCards = '';
  const THRESHOLD = 38;
  const progressSnapshot = {};
  data.active.forEach(n => { progressSnapshot[n] = 0; });
  const stepMeta = window._dhStepMeta[screenKey];

  // Helper: snapshot all progress for sidebar at this step
  const _digMeta = (name) => ({ player: name, progress: progressSnapshot[name] || 0, snapshot: {...progressSnapshot} });

  // Brief
  digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig">
    <div class="dh-brief" style="border-color:rgba(181,86,44,0.4)">${pickU(DIG_START_TEXT)()} Each player claims a dig site in the canyon. Boulders will fall periodically. First to unearth the barrel wins immunity.</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${data.active.map(n => {
      const tool = TOOL_NAMES[data.toolBonus[n]] || 'bare hands';
      const bonus = data.toolBonus[n] || 0;
      return `<div style="font-size:10px;color:var(--dh-sand);background:rgba(74,46,24,0.4);padding:3px 8px;border-radius:3px;font-family:'IBM Plex Mono',monospace">${n}: <span style="color:${bonus >= 2 ? 'var(--dh-ochre)' : 'var(--dh-bone)'}">${tool}</span></div>`;
    }).join('')}</div>
  </div>`;
  stepMeta[stepIdx] = {};
  stepIdx++;

  for (const rd of data.roundData) {
    // Round header
    digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border:none;background:rgba(100,40,20,0.15);text-align:center">
      <div style="font-family:'Big Shoulders Display',sans-serif;color:var(--dh-terracotta);font-size:17px;font-weight:700;letter-spacing:2px">${_icon('pick')} ROUND ${rd.round}</div>
      <div class="dh-atmo" style="margin:4px 0">${pickU(ATMOSPHERE_DIG)}</div>
    </div>`;
    stepMeta[stepIdx] = { round: rd.round };
    stepIdx++;

    // Boulder launch atmosphere before boulder events
    const hasBoulders = rd.events.some(e => e.type === 'boulder-hit' || e.type === 'boulder-dodge');
    if (hasBoulders) {
      digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border:none;background:rgba(168,40,28,0.08);text-align:center">
        <div class="dh-atmo" style="color:var(--dh-blood);font-weight:600">${_icon('boulder')} ${pickU(BOULDER_LAUNCH_TEXT)()}</div>
      </div>`;
      stepMeta[stepIdx] = {};
      stepIdx++;
    }

    for (const ev of rd.events) {
      const pr = ev.name ? pronouns(ev.name) : null;

      if (ev.type === 'dig') {
        progressSnapshot[ev.name] = (progressSnapshot[ev.name] || 0) + ev.progress;
        const tool = TOOL_NAMES[data.toolBonus[ev.name]] || 'bare hands';
        const pct = Math.min(100, (progressSnapshot[ev.name] / THRESHOLD) * 100);
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" data-player="${ev.name}" data-progress="${progressSnapshot[ev.name].toFixed(1)}">
          <div class="dh-player-row">${portrait(ev.name, 34)}<div style="flex:1"><div class="dh-player-name" style="font-size:13px">${ev.name} <span style="font-size:10px;color:var(--dh-sand);font-weight:400;font-family:'IBM Plex Mono',monospace">[${tool}]</span></div><div class="dh-player-detail" style="font-size:12px">${pickU(DIG_PROGRESS_TEXT)(ev.name, pr, tool)}</div></div><span class="dh-sb-score" style="color:var(--dh-ochre)">+${ev.progress.toFixed(1)}</span></div>
          <div class="dh-progress"><div class="dh-progress-fill" style="width:${pct}%"></div></div>
          <div style="font-size:9px;color:var(--dh-sand);opacity:0.6;text-align:right;margin-top:2px;font-family:'IBM Plex Mono',monospace">${progressSnapshot[ev.name].toFixed(1)} / ${THRESHOLD}</div>
        </div>`;
        stepMeta[stepIdx] = _digMeta(ev.name);
        stepIdx++;
      } else if (ev.type === 'boulder-hit') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border-color:var(--dh-blood);box-shadow:0 0 16px rgba(168,40,28,0.35);background:linear-gradient(135deg,rgba(168,40,28,0.15),rgba(50,20,10,0.6))">
          <div class="dh-player-row">${_icon('boulder')}${portrait(ev.name, 36)}<div style="flex:1"><div class="dh-player-name" style="color:var(--dh-blood)">${ev.name}</div><div class="dh-player-detail">${pickU(BOULDER_HIT_TEXT)(ev.name, pr)}</div></div><div class="dh-badge dh-badge-red">TRAPPED</div></div></div>`;
        stepMeta[stepIdx] = { boulderHit: ev.name };
        stepIdx++;
      } else if (ev.type === 'boulder-dodge') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border-color:rgba(34,197,94,0.4);box-shadow:0 0 10px rgba(34,197,94,0.15)">
          <div class="dh-player-row">${_icon('boulder')}${portrait(ev.name, 36)}<div style="flex:1"><div class="dh-player-name" style="color:#22c55e">${ev.name}</div><div class="dh-player-detail">${pickU(BOULDER_DODGE_TEXT)(ev.name, pr)}</div></div><div class="dh-badge dh-badge-green">DODGED</div></div></div>`;
        stepMeta[stepIdx] = { boulderDodge: ev.name };
        stepIdx++;
      } else if (ev.type === 'rescue-dilemma') {
        const rpr = pronouns(ev.rescuer);
        const pool = RESCUE_DILEMMA_TEXT[ev.category] || RESCUE_DILEMMA_TEXT.strategic;
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border:none;background:rgba(214,138,58,0.06);padding:6px 14px">
          <div class="dh-player-row" style="opacity:0.85">${portrait(ev.rescuer, 28)}<div class="dh-player-detail" style="font-size:12px;font-style:italic;color:var(--dh-sand)">${pickU(pool)(ev.rescuer, ev.trapped, rpr)}</div></div></div>`;
        stepMeta[stepIdx] = {};
        stepIdx++;
      } else if (ev.type === 'rescue') {
        const rpr = pronouns(ev.rescuer);
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border-color:rgba(214,138,58,0.5);box-shadow:0 0 14px rgba(214,138,58,0.3);background:linear-gradient(135deg,rgba(214,138,58,0.1),rgba(50,20,10,0.5))">
          <div class="dh-player-row">${_icon('rescue')}${portrait(ev.rescuer, 36)}<div style="flex:1"><div class="dh-player-name" style="color:var(--dh-ochre)">${ev.rescuer} &rarr; ${ev.trapped}</div><div class="dh-player-detail">${pickU(RESCUE_TEXT)(ev.rescuer, ev.trapped, rpr)}</div></div><div class="dh-badge dh-badge-gold">RESCUE</div></div></div>`;
        stepMeta[stepIdx] = { rescue: { rescuer: ev.rescuer, trapped: ev.trapped } };
        stepIdx++;
      } else if (ev.type === 'ignore-noticed') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social" style="border-color:rgba(168,40,28,0.3)">
          <div class="dh-player-row">${portrait(ev.ignorer, 28)}${portrait(ev.trapped, 28)}<div class="dh-player-detail" style="color:var(--dh-bone);opacity:0.7;font-size:12px">${pickU(IGNORE_TEXT)(ev.ignorer, ev.trapped)}</div></div></div>`;
        stepMeta[stepIdx] = { digEvent: 'ignored' };
        stepIdx++;
      } else if (ev.type === 'still-trapped') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="opacity:0.55;border-style:dashed">
          <div class="dh-player-row">${portrait(ev.name, 26)}<span style="font-size:12px;color:var(--dh-blood);font-style:italic">${ev.name} is still trapped under rocks...</span></div></div>`;
        stepMeta[stepIdx] = {};
        stepIdx++;
      } else if (ev.type === 'self-freed') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border-color:rgba(34,197,94,0.3);box-shadow:0 0 10px rgba(34,197,94,0.1);background:linear-gradient(135deg,rgba(34,197,94,0.08),rgba(50,20,10,0.4))">
          <div class="dh-player-row">${portrait(ev.name, 34)}<div style="flex:1"><div class="dh-player-name" style="color:#22c55e">${ev.name}</div><div class="dh-player-detail" style="font-size:12px">${pickU(SELF_FREE_TEXT)(ev.name, pronouns(ev.name))}</div></div><div class="dh-badge dh-badge-green">FREED</div></div></div>`;
        stepMeta[stepIdx] = { selfFreed: ev.name };
        stepIdx++;
      } else if (ev.type === 'barrel-found') {
        progressSnapshot[ev.name] = THRESHOLD;
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border:2px solid var(--dh-ochre);box-shadow:0 0 28px rgba(214,138,58,0.5);background:linear-gradient(135deg,rgba(214,138,58,0.18),rgba(74,46,24,0.4))">
          <div style="text-align:center;padding:8px 0">
            <div style="font-family:'Rye',cursive;font-size:22px;color:var(--dh-ochre);margin-bottom:10px;letter-spacing:2px">${_icon('barrel')} BARREL FOUND!</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:10px 0">${portrait(ev.name, 60)}<div style="text-align:left"><div class="dh-player-name" style="font-size:18px;color:var(--dh-ochre)">${ev.name}</div><div class="dh-badge dh-badge-gold" style="margin-top:4px">IMMUNITY WINNER</div></div></div>
            <div class="dh-player-detail" style="margin-top:10px;font-size:13px">${pickU(BARREL_FIND_TEXT)(ev.name, pr)}</div>
          </div></div>`;
        stepMeta[stepIdx] = { ..._digMeta(ev.name), winner: ev.name };
        stepIdx++;
      } else if (ev.type === 'showmance-moment') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social" style="border-color:rgba(236,72,153,0.4);background:rgba(236,72,153,0.05)">
          <div class="dh-player-row">${portrait(ev.a, 28)}${portrait(ev.b, 28)}<div class="dh-player-detail" style="font-size:12px">${pickU(SOCIAL_DIG_TEXT.showmance)(ev.a, ev.b)}</div></div></div>`;
        stepMeta[stepIdx] = { digEvent: 'showmance' };
        stepIdx++;
      } else if (ev.type === 'rivalry') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social" style="border-color:rgba(168,40,28,0.5)">
          <div class="dh-player-row">${portrait(ev.a, 28)}${portrait(ev.b, 28)}<div class="dh-player-detail" style="font-size:12px;color:var(--dh-blood)">${pickU(SOCIAL_DIG_TEXT.rivalry)(ev.a, ev.b)}</div></div></div>`;
        stepMeta[stepIdx] = { digEvent: 'rivalry' };
        stepIdx++;
      } else if (ev.type === 'confrontation') {
        const apr = pronouns(ev.aggressor);
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social" style="border-color:rgba(168,40,28,0.6);border-width:2px;box-shadow:0 0 12px rgba(168,40,28,0.25);background:rgba(168,40,28,0.08)">
          <div class="dh-player-row">${portrait(ev.aggressor, 30)}${portrait(ev.target, 30)}<div style="flex:1"><div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--dh-blood);font-weight:700;margin-bottom:3px">${_icon('shock')} CONFRONTATION</div><div class="dh-player-detail" style="font-size:12px;color:var(--dh-blood)">${pickU(DIG_CONFRONTATION_TEXT)(ev.aggressor, ev.target, apr)}</div></div></div></div>`;
        stepMeta[stepIdx] = { digEvent: 'confrontation' };
        stepIdx++;
      } else if (ev.type === 'coprolite') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social">
          <div class="dh-player-row">${portrait(ev.name, 28)}<div class="dh-player-detail" style="font-size:12px">${pickU(SOCIAL_DIG_TEXT.coprolite)(ev.name, pronouns(ev.name))}</div></div></div>`;
        stepMeta[stepIdx] = { digEvent: 'coprolite' };
        stepIdx++;
      } else if (ev.type === 'tool-envy') {
        digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-social">
          <div class="dh-player-row">${portrait(ev.have, 28)}${portrait(ev.haveNot, 28)}<div class="dh-player-detail" style="font-size:12px">${pickU(SOCIAL_DIG_TEXT.toolEnvy)(ev.have, ev.haveNot, ev.tool || 'tool')}</div></div></div>`;
        stepMeta[stepIdx] = { digEvent: 'tool-envy' };
        stepIdx++;
      }
    }

    // Inter-round atmosphere
    if (rd.round < data.roundData.length && !rd.winner) {
      digCards += `<div id="dh-step-${screenKey}-${stepIdx}" class="dh-card-dig" style="border:none;background:none"><div class="dh-atmo">${pickU(ATMOSPHERE_DIG)}</div></div>`;
      stepMeta[stepIdx] = {};
      stepIdx++;
    }
  }

  const totalSteps = stepIdx;
  const controls = `<div id="dh-controls-${screenKey}" class="dh-controls"><button class="dh-btn" onclick="dhRevealNext('${screenKey}',${totalSteps})">REVEAL NEXT</button><button class="dh-btn" onclick="dhRevealAll('${screenKey}',${totalSteps})">REVEAL ALL</button><span id="dh-counter-${screenKey}" class="dh-counter">0 / ${totalSteps}</span></div>`;

  const sidebarInit = _initialSidebar(screenKey, data, 'dig');
  const digMapHtml = _buildDigMapHTML(data);
  return _shell(`
    <div class="dh-layout" data-phase="dig">
      <div class="dh-feed"><div class="dh-phase-hdr">${_icon('barrel')} Barrel Dig <span class="dh-phase-tag">The Badlands</span></div>${digCards}</div>
      <div class="dh-sidebar">${digMapHtml}<div id="dh-sidebar-inner">${sidebarInit}</div></div>
    </div>${controls}
  `, ep, 'dh-phase-dig');
}


// ════════════════════════════════════════════════════════════
// VP — RESULTS
// ════════════════════════════════════════════════════════════
export function rpBuildDHResults(ep) {
  const data = ep.challengeData;
  if (!data) return '';
  const winner = data.winner || data.immunityWinner;
  if (!winner) return '';
  const pr = pronouns(winner);

  const scores = ep.chalMemberScores || {};
  const placements = ep.chalPlacements || [...data.active].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));

  let standingsHtml = '';
  for (let i = 0; i < placements.length; i++) {
    const name = placements[i];
    if (!name) continue;
    const score = scores[name] || 0;
    const medal = i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`;
    const color = i === 0 ? 'var(--dh-ochre)' : i === 1 ? '#94a3b8' : i === 2 ? 'var(--dh-terracotta)' : 'var(--dh-bone)';
    const tool = TOOL_NAMES[data.toolBonus[name]] || 'bare hands';
    const dig = data.digProgress[name] || 0;
    standingsHtml += `<div class="dh-standing-row ${i === 0 ? 'first' : ''}">
      <span class="dh-standing-medal" style="color:${color}">${medal}</span>
      ${portrait(name, 32)}
      <div style="flex:1"><span class="dh-player-name" style="font-size:13px">${name}</span><span style="font-size:11px;color:var(--dh-sand);opacity:0.7;margin-left:6px">${tool}</span></div>
      <div style="text-align:right"><div style="font-size:13px;font-weight:700;color:${color};font-family:'IBM Plex Mono',monospace">${score.toFixed(1)}</div><div style="font-size:9px;color:var(--dh-sand);opacity:0.6">dig: ${dig.toFixed(1)}</div></div>
    </div>`;
  }

  // Highlight moments
  let highlightsHtml = '';
  const rescues = [];
  const shocks = data.shockMoments || [];
  for (const rd of data.roundData) {
    for (const ev of rd.events) {
      if (ev.type === 'rescue') rescues.push(ev);
    }
  }
  if (rescues.length || shocks.length) {
    highlightsHtml += `<div style="margin-top:20px;padding-top:14px;border-top:1px solid var(--dh-tar)"><div style="font-family:'Cinzel',serif;font-size:14px;color:var(--dh-ochre);margin-bottom:10px;letter-spacing:1px">KEY MOMENTS</div>`;
    for (const r of rescues) highlightsHtml += `<div style="margin:6px 0;font-size:12px;display:flex;align-items:center;gap:6px">${_icon('rescue')}<span style="color:var(--dh-ochre)">${r.rescuer}</span><span style="color:var(--dh-bone);opacity:0.6">rescued</span><span style="color:var(--dh-ochre)">${r.trapped}</span></div>`;
    for (const s of shocks) highlightsHtml += `<div style="margin:6px 0;font-size:12px;display:flex;align-items:center;gap:6px">${_icon('shock')}<span style="color:var(--dh-spark)">${s.voter}</span><span style="color:var(--dh-bone);opacity:0.6">shocked trying to vote for</span><span style="color:var(--dh-blood);text-decoration:line-through">${s.triedTarget}</span></div>`;
    highlightsHtml += `</div>`;
  }

  return _shell(`
    <div style="padding:28px 24px;position:relative;z-index:5">
      <div class="dh-result-card">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:var(--dh-sand);margin-bottom:10px;font-family:'IBM Plex Mono',monospace">INDIVIDUAL IMMUNITY</div>
        <div style="display:flex;justify-content:center;margin:14px 0">${portrait(winner, 80)}</div>
        <div class="dh-winner-name">${winner}</div>
        <div style="color:var(--dh-bone);opacity:0.7;margin-top:10px;font-size:14px;line-height:1.5">${pr.Sub} unearthed the buried barrel in the Drumheller badlands and secured individual immunity!</div>
      </div>
      <div style="margin-top:20px"><div class="dh-phase-hdr" style="font-size:15px">${_icon('skull')} Final Standings</div>${standingsHtml}</div>
      ${highlightsHtml}
      <div style="margin-top:24px;text-align:center;color:var(--dh-bone);opacity:0.4;font-size:12px;font-style:italic;font-family:'Cutive Mono',monospace">"The badlands always reveal the truth. And the barrel." &mdash; ${host()}</div>
    </div>
  `, ep, '');
}


// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textDrumheller(ep, ln, sec) {
  const data = ep.challengeData;
  if (!data) return;
  sec('AWWWWWW, DRUMHELLER');
  ln(`${host()} announces an archaeology challenge in the Drumheller badlands.`);

  ln('── DINOSAUR BUILD ──');
  for (const name of data.active) {
    const b = data.builds[name];
    ln(`  ${name}: quality ${b.quality.toFixed(1)} — ${b.desc.replace(/<[^>]+>/g, '')}`);
  }

  ln('── LIE-DETECTOR VOTE ──');
  for (const voter of data.active) {
    const target = data.votes[voter];
    const shock = data.shockMoments.find(s => s.voter === voter);
    if (shock) {
      ln(`  ${voter} → tried "${shock.triedTarget}" → SHOCKED → actual: ${target}`);
    } else {
      ln(`  ${voter} → ${target}`);
    }
  }
  ln(`  Vote ranking: ${data.voteRanking.slice(0, 3).map((n, i) => `${i + 1}. ${n} (${data.votesReceived[n]} votes)`).join(', ')}`);

  if (data.voteFallout.length) {
    ln('  Social fallout:');
    for (const f of data.voteFallout) {
      if (f.type === 'betrayal') ln(`    ${f.a} felt betrayed by ${f.b} (bond ${f.delta})`);
      else if (f.type === 'respect') ln(`    ${f.a} gained respect for ${f.b}`);
      else if (f.type === 'zero') ln(`    ${f.name} got zero votes`);
    }
  }

  ln(`  Tools: ${data.voteRanking.slice(0, 3).map((n, i) => `${n}=${TOOL_NAMES[3 - i]}`).join(', ')}`);

  ln('── BARREL DIG ──');
  for (const rd of data.roundData) {
    ln(`  Round ${rd.round}:`);
    for (const ev of rd.events) {
      if (ev.type === 'dig') ln(`    ${ev.name} digs +${ev.progress.toFixed(1)}`);
      else if (ev.type === 'boulder-hit') ln(`    BOULDER hits ${ev.name} — TRAPPED`);
      else if (ev.type === 'boulder-dodge') ln(`    ${ev.name} dodges a boulder!`);
      else if (ev.type === 'rescue-dilemma') ln(`    ${ev.rescuer} considers rescuing ${ev.trapped}...`);
      else if (ev.type === 'rescue') ln(`    ${ev.rescuer} rescues ${ev.trapped}!`);
      else if (ev.type === 'self-freed') ln(`    ${ev.name} digs themselves out!`);
      else if (ev.type === 'barrel-found') ln(`    ${ev.name} FINDS THE BARREL!`);
      else if (ev.type === 'showmance-moment') ln(`    Showmance moment: ${ev.a} & ${ev.b}`);
      else if (ev.type === 'rivalry') ln(`    Rivalry: ${ev.a} vs ${ev.b}`);
      else if (ev.type === 'confrontation') ln(`    CONFRONTATION: ${ev.aggressor} snaps at ${ev.target}`);
      else if (ev.type === 'coprolite') ln(`    ${ev.name} found coprolite (dino poop)`);
      else if (ev.type === 'tool-envy') ln(`    ${ev.haveNot} envies ${ev.have}'s ${ev.tool || 'tool'}`);
    }
  }

  ln(`  IMMUNITY: ${data.winner}`);
}