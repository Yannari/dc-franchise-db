// js/chal/project-runaway.js — Project Runaway: fashion challenge (pre-merge tribe)
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
  return typeof chosen === 'function' ? chosen(...args) : chosen;
}

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);
function canScheme(name) {
  const a = arch(name);
  if (VILLAIN_ARCHS.has(a)) return true;
  if (NICE_ARCHS.has(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════════════
// CREATURE POOL
// ══════════════════════════════════════════════════════════════════════
const CREATURES = [
  { id: 'mutant-frog',      name: 'Mutant Frog',      coop: 7, show: 4, volatility: 3, difficulty: 'low' },
  { id: 'woolly-beaver',    name: 'Woolly Beaver',    coop: 5, show: 6, volatility: 5, difficulty: 'medium' },
  { id: 'giant-crab',       name: 'Giant Crab',       coop: 3, show: 8, volatility: 7, difficulty: 'high' },
  { id: 'neon-parrot',      name: 'Neon Parrot',      coop: 8, show: 7, volatility: 2, difficulty: 'medium' },
  { id: 'armored-turtle',   name: 'Armored Turtle',   coop: 6, show: 3, volatility: 4, difficulty: 'low' },
  { id: 'electric-eel',     name: 'Electric Eel',     coop: 2, show: 9, volatility: 9, difficulty: 'high' },
  { id: 'glitter-fox',      name: 'Glitter Fox',      coop: 9, show: 5, volatility: 1, difficulty: 'medium' },
  { id: 'spiky-porcupine',  name: 'Spiky Porcupine',  coop: 4, show: 6, volatility: 6, difficulty: 'high' },
];

const DIFF_MOD = { low: 3, medium: 5, high: 7 };

const THEMES = [
  'Island Castaway', 'Island Getaway', 'Tiki Royalty', 'Shipwreck Chic',
  'Jungle Couture', 'Coral Reef Glam', 'Volcanic Vogue', 'Moonlit Lagoon',
];

const MATERIALS = [
  { name: 'Iridescent Shells', color: '#d4af7d', thematic: 4 },
  { name: 'Palm Fiber', color: '#7a9a6a', thematic: 3 },
  { name: 'Hibiscus Flowers', color: '#e8486a', thematic: 5 },
  { name: 'Driftwood Clasps', color: '#6a8aaa', thematic: 2 },
  { name: 'Coconut Husks', color: '#8a6a3a', thematic: 3 },
  { name: 'Seaweed Ribbons', color: '#3a8a6a', thematic: 4 },
  { name: 'Volcanic Beads', color: '#aa3a3a', thematic: 5 },
  { name: 'Bamboo Strips', color: '#9a8a5a', thematic: 3 },
  { name: 'Coral Fragments', color: '#e8a0a0', thematic: 5 },
  { name: 'Feathered Fronds', color: '#4a7a9a', thematic: 4 },
];

// ══════════════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════════════

// ── ROLE ASSIGNMENT TEXT ──
const ROLE_ASSIGN_TEXT = {
  designer: [
    (n, pr) => `${n} steps forward with a vision already forming. ${pr.Sub} ${pr.sub === 'they' ? 'crack' : 'cracks'} ${pr.posAdj} knuckles — time to create.`,
    (n, pr) => `The team picks ${n} to lead the design. ${pr.Sub} ${pr.sub === 'they' ? 'nod' : 'nods'} slowly, ideas already racing.`,
    (n, pr) => `${n} accepts the designer role with quiet confidence. "I know exactly what we're going for."`,
    (n, pr) => `${n} grabs the sketchpad. ${pr.posAdj} mind is already three steps ahead of the competition.`,
    (n, pr) => `"Leave the design to me." ${n} says it like a promise, not a request.`,
  ],
  model: [
    (n, pr) => `${n} strikes a pose before anyone even asks. Born for this.`,
    (n, pr) => `The team selects ${n} as their model. ${pr.Sub} ${pr.sub === 'they' ? 'stand' : 'stands'} a little taller.`,
    (n, pr) => `${n} flips ${pr.posAdj} hair and steps onto the imaginary runway. "I was made for this moment."`,
    (n, pr) => `${n} accepts the model role with a grin. The pressure? ${pr.Sub} ${pr.sub === 'they' ? 'live' : 'lives'} for it.`,
    (n, pr) => `All eyes turn to ${n}. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} flinch. The runway is ${pr.pos}.`,
  ],
  handler: [
    (n, pr) => `${n} volunteers to handle the creature. ${pr.Sub} ${pr.sub === 'they' ? 'have' : 'has'} a way with animals — or so ${pr.sub} ${pr.sub === 'they' ? 'claim' : 'claims'}.`,
    (n, pr) => `The team trusts ${n} with the creature. ${pr.Sub} ${pr.sub === 'they' ? 'approach' : 'approaches'} carefully, reading its body language.`,
    (n, pr) => `${n} kneels near the creature, speaking in low tones. "Easy... I've got you."`,
    (n, pr) => `Creature handler goes to ${n}. ${pr.Sub} ${pr.sub === 'they' ? 'seem' : 'seems'} to understand what it needs.`,
  ],
  gatherer: [
    (n, pr) => `${n} heads into the jungle to scavenge materials. Time to get creative.`,
    (n, pr) => `${n} rolls up ${pr.posAdj} sleeves and disappears into the brush. Gathering duty.`,
    (n, pr) => `"I'll find us something amazing." ${n} vanishes into the foliage.`,
    (n, pr) => `${n} sets off on the material hunt, eyes scanning every surface for something usable.`,
  ],
};

// ── SCOUT TEXT ──
const SCOUT_TEXT = {
  strong: [
    (n, pr) => `${n} creeps through the underbrush with ${pr.posAdj} eyes locked on every movement. Three creatures spotted before anyone else even blinks.`,
    (n, pr) => `${n}'s gaze sweeps the treeline with uncanny precision. ${pr.Sub} signals the team — three targets confirmed.`,
    (n, pr) => `Silent as a shadow, ${n} picks up tracks, droppings, disturbed branches. ${pr.Sub} ${pr.sub === 'they' ? 'map' : 'maps'} three creature locations in minutes.`,
    (n, pr) => `${n} reads the jungle like a book. Every broken twig, every scuffed print. Three creatures — spotted, logged, and ready for the hunt.`,
    (n, pr) => `${n}'s intuition is firing on all cylinders. ${pr.Sub} ${pr.sub === 'they' ? 'find' : 'finds'} three creature trails before the others have even spread out.`,
  ],
  mid: [
    (n, pr) => `${n} pushes through the dense foliage, squinting at the canopy. It takes a while, but ${pr.sub} ${pr.sub === 'they' ? 'spot' : 'spots'} movement — creatures identified.`,
    (n, pr) => `${n} isn't the fastest scout, but ${pr.sub}'s thorough. Eventually ${pr.sub} ${pr.sub === 'they' ? 'locate' : 'locates'} the options.`,
    (n, pr) => `${n} follows a trail that loops back on itself twice before finding anything. ${pr.Sub} ${pr.sub === 'they' ? 'wave' : 'waves'} the team over.`,
    (n, pr) => `It's slow going for ${n}, but determination wins. ${pr.Sub} ${pr.sub === 'they' ? 'return' : 'returns'} with intel on the available creatures.`,
  ],
  weak: [
    (n, pr) => `${n} wanders in circles, jumping at every rustling leaf. ${pr.Sub} barely ${pr.sub === 'they' ? 'find' : 'finds'} anything useful.`,
    (n, pr) => `${n} stumbles over a root, startles a flock of birds, and returns looking flustered. The scouting report is... thin.`,
    (n, pr) => `${n} mistakes a shadow for a creature three times before finding an actual trail. The team waits impatiently.`,
    (n, pr) => `${n}'s scouting leaves much to be desired. ${pr.Sub} ${pr.sub === 'they' ? 'come' : 'comes'} back with vague directions and scratched arms.`,
  ],
};

// ── CHASE TEXT ──
const CHASE_TEXT = {
  strong: [
    (n, pr, creature) => `${n} sprints after the ${creature} with explosive speed, closing the gap in seconds. ${pr.posAdj} tackle is textbook.`,
    (n, pr, creature) => `${n} corners the ${creature} against a rock face. No escape. ${pr.Sub} ${pr.sub === 'they' ? 'move' : 'moves'} in without hesitation.`,
    (n, pr, creature) => `The ${creature} bolts, but ${n} is faster. ${pr.Sub} ${pr.sub === 'they' ? 'cut' : 'cuts'} it off at the ravine and ${pr.sub === 'they' ? 'make' : 'makes'} the grab.`,
    (n, pr, creature) => `${n} leaps over a log and lands right on top of the ${creature}. Pure athleticism.`,
    (n, pr, creature) => `${n} reads the ${creature}'s escape path and intercepts. Quick hands, quicker feet.`,
  ],
  mid: [
    (n, pr, creature) => `${n} gives chase through the trees. The ${creature} is slippery, but ${pr.sub} ${pr.sub === 'they' ? 'keep' : 'keeps'} pace.`,
    (n, pr, creature) => `${n} and the ${creature} trade ground back and forth. Not elegant, but ${pr.sub}'s not giving up.`,
    (n, pr, creature) => `${n} stumbles once but recovers. The ${creature} hisses but doesn't pull away completely.`,
    (n, pr, creature) => `${n} follows the ${creature} through a thicket, emerging scratched but still in pursuit.`,
  ],
  weak: [
    (n, pr, creature) => `${n} lunges and misses by a mile. The ${creature} darts away, almost mockingly.`,
    (n, pr, creature) => `${n} trips over ${pr.posAdj} own feet mid-chase. The ${creature} gains a massive lead.`,
    (n, pr, creature) => `The ${creature} outmaneuvers ${n} at every turn. ${pr.Sub}'s gasping for air while it disappears into the brush.`,
    (n, pr, creature) => `${n} chases the ${creature} into a dead end — then realizes it's ${pr.sub} who's trapped. The ${creature} scurries out through a gap ${n} can't fit through.`,
  ],
};

// ── CAPTURE TEXT ──
const CAPTURE_TEXT = {
  success: [
    (n, pr, creature) => `${n} wraps ${pr.posAdj} arms around the ${creature} and holds on for dear life. "GOT IT!" ${pr.Sub} ${pr.sub === 'they' ? 'grin' : 'grins'} through the mud.`,
    (n, pr, creature) => `After a final lunge, ${n} pins the ${creature}. It thrashes twice, then goes still. Captured.`,
    (n, pr, creature) => `${n} scoops up the ${creature} with surprising gentleness. It nuzzles into ${pr.posAdj} arms. Maybe this won't be so hard.`,
    (n, pr, creature) => `The ${creature} surrenders to ${n}'s persistence. ${pr.Sub} ${pr.sub === 'they' ? 'carry' : 'carries'} it back to camp, victorious.`,
  ],
  fail: [
    (n, pr, creature) => `${n} had the ${creature} in ${pr.posAdj} hands and it slipped away. ${pr.posAdj} face says it all.`,
    (n, pr, creature) => `The ${creature} bites ${n}'s hand and vanishes into the undergrowth. That's not the one.`,
    (n, pr, creature) => `${n} dives and comes up with nothing but a mouthful of dirt. The ${creature} is long gone.`,
    (n, pr, creature) => `${n} watches the ${creature} disappear over a ridge. ${pr.Sub} ${pr.sub === 'they' ? 'slam' : 'slams'} the ground in frustration.`,
  ],
};

// ── MATERIAL GATHERING TEXT ──
const GATHER_TEXT = {
  excellent: [
    (n, pr) => `${n} pulls iridescent materials from a hidden alcove. ${pr.posAdj} eyes go wide — this is designer-quality.`,
    (n, pr) => `${n} returns with armfuls of pristine materials, sorted by color. The designer's jaw drops.`,
    (n, pr) => `${n} discovers a cache of rare materials tucked behind a waterfall. Jackpot.`,
    (n, pr) => `${n} has an eye for quality. Every piece ${pr.sub} ${pr.sub === 'they' ? 'bring' : 'brings'} back is flawless.`,
    (n, pr) => `"Look at THESE." ${n} holds up materials that catch the light like gemstones. Premium finds.`,
  ],
  decent: [
    (n, pr) => `${n} returns with workable materials. Nothing spectacular, but the designer can use them.`,
    (n, pr) => `${n} gathers a solid haul. It's rough but the bones are there — this can work.`,
    (n, pr) => `${n} picks through the undergrowth and finds some serviceable supplies. Better than nothing.`,
    (n, pr) => `"It's not pretty, but it's functional." ${n} dumps an armload of materials by the workspace.`,
  ],
  poor: [
    (n, pr) => `${n} comes back with... not much. Scraggly scraps that barely qualify as materials.`,
    (n, pr) => `${n} returns empty-handed after a wasted search. The designer's expression darkens.`,
    (n, pr) => `${n} brings back materials that fall apart on contact. The team groans.`,
    (n, pr) => `${n}'s haul is mostly mud and broken sticks. ${pr.Sub} ${pr.sub === 'they' ? 'shrug' : 'shrugs'} apologetically.`,
  ],
};

// ── DESIGN WORK TEXT ──
const DESIGN_TEXT = {
  inspired: [
    (n, pr) => `${n}'s hands move with purpose, weaving materials into a vision that's clearly taking shape. Brilliant work.`,
    (n, pr) => `${n} steps back, tilts ${pr.posAdj} head, then makes one decisive cut. The outfit transforms. "${pr.Sub} ${pr.sub === 'they' ? 'see' : 'sees'} it now."`,
    (n, pr) => `${n} is in the zone. Every stitch, every fold, every drape — calculated and gorgeous.`,
    (n, pr) => `The design flowing from ${n}'s fingers is something special. Even the creature seems impressed.`,
  ],
  steady: [
    (n, pr) => `${n} works methodically, building the outfit layer by layer. Solid craftsmanship.`,
    (n, pr) => `${n} mutters measurements under ${pr.posAdj} breath while pinning fabric. Focused, competent.`,
    (n, pr) => `${n} follows a clear plan. No flash, no disaster — just steady progress.`,
    (n, pr) => `${n} keeps the design clean and structured. It won't win innovation awards, but it'll hold together.`,
  ],
  struggling: [
    (n, pr) => `${n} stares at the materials like they're written in a foreign language. Where does ${pr.sub} even start?`,
    (n, pr) => `${n} rips out ${pr.posAdj} third attempt at a seam. The fabric is winning.`,
    (n, pr) => `${n}'s design concept was ambitious. The execution... less so. Things keep falling apart.`,
    (n, pr) => `${n} holds up the half-finished outfit and winces. "It's a... statement piece?"`,
  ],
};

// ── HANDLER TEXT ──
const HANDLER_TEXT = {
  calm: [
    (n, pr, creature) => `${n} whispers something to the ${creature} and it visibly relaxes. ${pr.Sub} has a gift.`,
    (n, pr, creature) => `The ${creature} follows ${n} around like a loyal pet. Whatever ${pr.sub}'s doing, it's working.`,
    (n, pr, creature) => `${n} feeds the ${creature} a treat and scratches behind its ears. It purrs. Do those things purr?`,
    (n, pr, creature) => `${n} sits perfectly still beside the ${creature}. After a tense minute, it curls up against ${pr.obj}. Bond established.`,
  ],
  agitated: [
    (n, pr, creature) => `The ${creature} snaps at ${n}'s hand. ${pr.Sub} jerks back just in time. "Easy... easy..."`,
    (n, pr, creature) => `${n} tries to calm the ${creature} but it paces and growls. Not cooperating.`,
    (n, pr, creature) => `${n}'s patience is being tested. The ${creature} has knocked over the supply bin twice.`,
    (n, pr, creature) => `"HOLD STILL!" ${n} wrestles with the ${creature} while the team watches nervously.`,
  ],
  berserk: [
    (n, pr, creature) => `The ${creature} rears up and SHRIEKS. ${n} dives out of the way as it thrashes wildly.`,
    (n, pr, creature) => `${n} loses control completely. The ${creature} is tearing through camp like a tornado.`,
    (n, pr, creature) => `The ${creature} breaks free from ${n}'s grip and charges toward the design table. Chaos erupts.`,
    (n, pr, creature) => `${n}'s creature handling strategy just collapsed. The ${creature} is on top of the supply rack and HISSING.`,
  ],
};

// ── MODEL PRACTICE TEXT ──
const MODEL_TEXT = {
  confident: [
    (n, pr) => `${n} practices ${pr.posAdj} walk and it's magnetic. Every step commands the space.`,
    (n, pr) => `${n} works the imaginary runway like ${pr.sub} was born for it. Shoulders back, chin high, pure presence.`,
    (n, pr) => `${n} strikes three poses in rapid succession, each better than the last. Natural talent.`,
    (n, pr) => `${n} catches ${pr.posAdj} reflection and adjusts ${pr.posAdj} posture. Fierce. Confident. Ready.`,
  ],
  nervous: [
    (n, pr) => `${n} practices walking in a straight line. It goes... okay. ${pr.posAdj} arms are a little stiff.`,
    (n, pr) => `${n} fidgets with the outfit while rehearsing. "Do I look at the judges or straight ahead?"`,
    (n, pr) => `${n} trips over nothing during practice. Deep breath. Try again.`,
    (n, pr) => `${n} keeps adjusting ${pr.posAdj} stance, never quite finding comfort. Stage fright is setting in.`,
  ],
  stumble: [
    (n, pr) => `${n} face-plants during a practice turn. ${pr.Sub} ${pr.sub === 'they' ? 'lie' : 'lies'} there for a moment before getting up.`,
    (n, pr) => `${n}'s practice run is a disaster. Wrong turns, stiff arms, zero confidence. This needs work.`,
    (n, pr) => `${n} walks into a tree during practice. IN THE OPEN. The team tries not to laugh.`,
    (n, pr) => `${n} can't even fake confidence right now. ${pr.posAdj} practice walk looks like a march to the gallows.`,
  ],
};

// ── RUNWAY WALK TEXT ──
const RUNWAY_WALK = {
  strut: [
    (n, pr, tribe) => `${n} OWNS that runway. Every step is a statement. The crowd holds its breath.`,
    (n, pr, tribe) => `${n} glides down the runway for ${tribe} with the poise of a professional. Jaw-dropping.`,
    (n, pr, tribe) => `${n} hits the mark, pivots, and strikes a pose that could be in a magazine. ${host()} actually applauds.`,
    (n, pr, tribe) => `${n}'s walk is electric. Confidence radiates from every pore. ${tribe} erupts in cheers.`,
  ],
  decent: [
    (n, pr, tribe) => `${n} walks the runway with solid composure. Nothing flashy, but professional.`,
    (n, pr, tribe) => `${n} keeps it together for ${tribe}. Good posture, decent pace. Respectable showing.`,
    (n, pr, tribe) => `${n} delivers a clean walk. No stumbles, no showstoppers — just solid runway work.`,
    (n, pr, tribe) => `${n} walks with quiet determination. ${pr.Sub} won't win the catwalk award, but ${pr.sub} won't lose it either.`,
  ],
  trip: [
    (n, pr, tribe) => `${n} TRIPS on the runway. ${pr.Sub} ${pr.sub === 'they' ? 'recover' : 'recovers'} — barely — but the judges saw everything.`,
    (n, pr, tribe) => `${n}'s heel catches and ${pr.sub} ${pr.sub === 'they' ? 'stumble' : 'stumbles'} forward three steps. ${tribe} watches through their fingers.`,
    (n, pr, tribe) => `${n} goes down on one knee mid-runway. ${pr.Sub} plays it off as a pose but nobody's buying it.`,
    (n, pr, tribe) => `${n}'s walk for ${tribe} starts strong but a wobble at the turn undercuts the whole performance.`,
  ],
};

// ── CREATURE RUNWAY TEXT ──
const CREATURE_RUNWAY = {
  showsOff: [
    (n, creature) => `The ${creature} STRUTS down the runway like it was BORN for this. The crowd goes wild.`,
    (n, creature) => `The ${creature} strikes a pose at the end of the runway. Flashbulbs pop. This creature is a STAR.`,
    (n, creature) => `The ${creature} walks beside the model in perfect sync. It's wearing the outfit like it chose it.`,
    (n, creature) => `The ${creature} preens and shows off every angle of the outfit. Natural showmanship.`,
  ],
  refuses: [
    (n, creature) => `The ${creature} sits down on the runway and REFUSES to move. The handler's face goes white.`,
    (n, creature) => `The ${creature} takes two steps onto the runway, then turns around and walks back. Nope.`,
    (n, creature) => `The ${creature} lies flat on the stage. Dead weight. No amount of coaxing helps.`,
    (n, creature) => `The ${creature} digs its claws into the runway floor and will NOT budge.`,
  ],
  eatsOutfit: [
    (n, creature) => `The ${creature} starts EATING the outfit mid-runway. Fabric shreds fly everywhere. Horror.`,
    (n, creature) => `The ${creature} pulls at a seam with its teeth and the whole outfit unravels. Gasps from the crowd.`,
    (n, creature) => `The ${creature} mistakes a decorative element for food and bites it clean off. The outfit is compromised.`,
    (n, creature) => `A dangling thread catches the ${creature}'s attention. It pulls. The outfit disintegrates. Disaster.`,
  ],
};

// ── HOST COMMENTARY TEXT ──
const HOST_TEXT = {
  intro: [
    () => `"Today you'll catch a creature, dress it in couture, dress YOURSELVES in couture, and walk my runway. The losing tribe? See you at tribal. Any questions? Didn't think so."`,
    () => `"Fashion. Drama. Wild animals in evening wear. What more could you ask for? Welcome to Project Runaway!"`,
    () => `"I've been looking forward to this one. You're going to hunt creatures, build outfits from NOTHING, and strut your stuff on my runway. Let's get to it."`,
    () => `"The name of the game is fashion, people. Catch a creature, design an outfit, and pray it doesn't eat the clothes off your back. Good luck."`,
  ],
  scoring: [
    (tribe, score) => `"${tribe}... your total score is ${score.toFixed(1)}. Let's see if that holds up."`,
    (tribe, score) => `"For ${tribe}, the judges give... ${score.toFixed(1)}. Interesting."`,
    (tribe, score) => `"${tribe} comes in at ${score.toFixed(1)}. The runway has spoken."`,
    (tribe, score) => `"${score.toFixed(1)} for ${tribe}. That's the number to beat — or the number that beats you."`,
  ],
  winner: [
    (tribe) => `"${tribe}, you've earned immunity! Your creature walked that runway like it owned the place."`,
    (tribe) => `"${tribe} takes it! Fashion AND survival — turns out you CAN have both."`,
    (tribe) => `"Immunity goes to ${tribe}! The runway has crowned its champions."`,
    (tribe) => `"${tribe}, that was haute couture meets wild kingdom. Immunity is yours."`,
  ],
  loser: [
    (tribe) => `"${tribe}... your creature couldn't sell the vision. I'll see you at tribal council."`,
    (tribe) => `"${tribe}, I'm sorry. Fashion is cruel, and tonight it chose to be cruel to you. Tribal council awaits."`,
    (tribe) => `"${tribe}... that was a fashion disaster. Tribal. Tonight."`,
    (tribe) => `"${tribe}, the runway spoke, and it said 'no.' Pack your things."`,
  ],
};

// ── SOCIAL EVENT TEXT ──
const SOCIAL_TEXT = {
  designArgument: [
    (a, b) => `${a} and ${b} clash over the design direction. "This isn't working!" "YOUR ideas aren't working!"`,
    (a, b) => `${a} rips out ${b}'s stitching. "We're going a different direction." The tension is volcanic.`,
    (a, b) => `${a} questions every single choice ${b} makes. The workspace becomes a war zone.`,
    (a, b) => `"That color is WRONG." ${a} and ${b} stand nose to nose over a swatch of fabric.`,
  ],
  materialTheft: [
    (thief, victim) => `${thief} swipes a handful of premium materials from ${victim}'s pile when nobody's looking.`,
    (thief, victim) => `${thief} "accidentally" walks off with ${victim}'s best finds. Pure sabotage.`,
    (thief, victim) => `${thief} raids ${victim}'s material stash during a distraction. Ruthless.`,
    (thief, victim) => `${thief} pockets ${victim}'s coral fragments while "helping sort." Classic move.`,
  ],
  theftCaught: [
    (thief, witness) => `${witness} catches ${thief} red-handed with stolen materials. "WHAT are you doing?!"`,
    (thief, witness) => `"DROP IT." ${witness} spots ${thief} mid-theft. The whole team turns to look.`,
    (thief, witness) => `${thief} freezes as ${witness} rounds the corner. The stolen goods tumble from ${thief}'s hands.`,
    (thief, witness) => `${witness}'s eyes narrow. "Those aren't yours, ${thief}." The camp goes silent.`,
  ],
  creatureSpook: [
    (handler, creature) => `The ${creature} gets spooked and knocks over the material rack. ${handler} scrambles to salvage what's left.`,
    (handler, creature) => `CRASH. The ${creature} bolts through the workspace. ${handler} dives after it but the damage is done.`,
    (handler, creature) => `The ${creature} panics and shreds a section of fabric with its claws. ${handler} watches in horror.`,
    (handler, creature) => `${handler} loses the ${creature} for thirty seconds. It destroys two material piles before being corralled.`,
  ],
  fittingMoment: [
    (model, designer) => `${model} tries on the outfit and ${designer}'s face lights up. "It's PERFECT on you." The chemistry is real.`,
    (model, designer) => `${designer} pins a final detail on ${model} and steps back. "You're going to stop that runway cold."`,
    (model, designer) => `${model} and ${designer} share a look of mutual respect. This is coming together beautifully.`,
    (model, designer) => `${designer} adjusts ${model}'s collar with careful hands. "Trust the outfit. It'll do the work." ${model} smiles.`,
  ],
  inspirationStrike: [
    (n) => `${n}'s eyes go wide. "I SEE IT." ${n} tears apart the current design and rebuilds it in half the time. Twice as good.`,
    (n) => `Something clicks for ${n}. ${n} grabs materials with new purpose, fingers flying. The design transforms.`,
    (n) => `${n} wakes up from a creative trance having produced something extraordinary. "Where did THAT come from?"`,
    (n) => `${n} has a vision. ${n} barely speaks for ten minutes while creating something genuinely beautiful.`,
  ],
  fabricFight: [
    (a, b) => `${a} and ${b} grab the same piece of driftwood. Neither lets go. It snaps in half.`,
    (a, b) => `${a} shoves ${b} aside to reach a material cache. ${b}'s expression hardens.`,
    (a, b) => `"I SAW IT FIRST!" ${a} and ${b} tug-of-war over a rare find. The material tears.`,
    (a, b) => `${a} body-blocks ${b} from a supply pile. "Find your own." ${b} seethes.`,
  ],
  creatureBond: [
    (handler, creature) => `The ${creature} nuzzles against ${handler}'s chest. An unexpected bond forms between handler and beast.`,
    (handler, creature) => `${handler} scratches the ${creature} behind its ear and it makes a sound like... purring? A breakthrough.`,
    (handler, creature) => `The ${creature} starts following ${handler} everywhere, mimicking ${handler}'s posture. Adorable AND useful.`,
    (handler, creature) => `${handler} shares a snack with the ${creature}. From that moment on, it's ride or die. Full cooperation.`,
  ],
  sabotageFrame: [
    (schemer, framed) => `${schemer} deliberately damages the outfit, then points at ${framed}. "I saw ${framed} do it!"`,
    (schemer, framed) => `${schemer} tears a seam when nobody's looking and plants the evidence near ${framed}'s workspace.`,
    (schemer, framed) => `${schemer} spills dye on the fabric and immediately blames ${framed}. "Check ${framed}'s hands — stained!"`,
    (schemer, framed) => `${schemer} "finds" stolen materials in ${framed}'s bag. Materials that ${schemer} planted five minutes ago.`,
  ],
  crossPathTrashTalk: [
    (a, b) => `"Nice creature," ${a} sneers at ${b}'s team across the clearing. "Does it come with a leash for YOU?"`,
    (a, b) => `${a} locks eyes with ${b} from across the worksite. "Your outfit looks like it was designed by the creature."`,
    (a, b) => `${a} walks past ${b}'s station. "Oh... that's the design? Bold choice. Bold." The sarcasm drips.`,
    (a, b) => `"Hope your model walks better than your team works," ${a} calls out to ${b}. Shots fired.`,
  ],
  teamwork: [
    (a, b) => `${a} and ${b} sync up perfectly, one holding while the other stitches. Seamless teamwork.`,
    (a, b) => `"Hold it steady!" ${a} and ${b} work in tandem to assemble the base structure. Their section comes together fast.`,
    (a, b) => `${a} sees ${b} struggling and jumps in without being asked. Together they finish in record time.`,
    (a, b) => `${a} passes materials to ${b} before ${b} even asks. They're reading each other's minds.`,
  ],
};

// ── BERSERK TEXT ──
const BERSERK_TEXT = {
  escape: [
    (creature) => `The ${creature} SNAPS. It breaks free from the handler and bolts for the jungle, outfit and all.`,
    (creature) => `BERSERK! The ${creature} erupts, scattering players and equipment. It charges into the wild.`,
    (creature) => `The ${creature}'s eyes go wide. It SHRIEKS, rips free, and disappears into the undergrowth.`,
    (creature) => `Something set off the ${creature}. It thrashes, bites, and rockets away from camp. Total chaos.`,
  ],
  chase: [
    (n, pr, creature) => `${n} crashes through the bush after the ${creature}. Branches whip ${pr.posAdj} face.`,
    (n, pr, creature) => `${n} spots the ${creature} and gives chase, vaulting over a fallen log.`,
    (n, pr, creature) => `${n} sprints after the ${creature}, guided by the trail of scattered debris.`,
    (n, pr, creature) => `${n} rounds a boulder and nearly collides with the panicking ${creature}.`,
  ],
  rescue: [
    (n, pr, creature) => `${n} CATCHES the ${creature}! ${pr.Sub} ${pr.sub === 'they' ? 'wrap' : 'wraps'} both arms around it, whispering "easy... easy..."`,
    (n, pr, creature) => `${n} corners the ${creature} in a gully and carefully lures it back with food. Crisis averted.`,
    (n, pr, creature) => `${n} uses ${pr.posAdj} body to block the ${creature}'s escape route. Slow approach. Gentle hands. Got it.`,
    (n, pr, creature) => `${n} throws ${pr.posAdj} jacket over the ${creature}'s head. It calms instantly. Rescue complete.`,
  ],
};

// ── ATMOSPHERE FLAVOR TEXT ──
const ATMOSPHERE_HUNT = [
  'Palm fronds rustle overhead. Something moves in the underbrush — something big.',
  'The jungle hums with a thousand unseen creatures. Only three matter today.',
  'Sunlight filters through the canopy in golden shards. The hunt is on.',
  'A distant screech echoes off the cliffs. Whatever made that sound, somebody has to catch it.',
  'The air is thick with humidity and anticipation. Creature tracks crisscross the mud.',
  'Birds scatter from the treetops. Someone — or something — is moving fast through the undergrowth.',
  'Insect chorus swells as the hunters spread out. The jungle watches.',
  'A snapped branch. Frozen breath. Then — movement in the ferns.',
  'The clearing smells of wet earth and wildflowers. Not for long.',
  'Something glitters in the bushes. Scales? Eyes? Only one way to find out.',
];

const ATMOSPHERE_DESIGN = [
  'Fabric scraps drift in the breeze like confetti at a funeral.',
  'The sound of tearing cloth echoes across camp. Someone just made a big decision.',
  'Thread, bone needle, determination. That\'s all any of them have.',
  'The creature watches the designers work with an expression somewhere between curiosity and contempt.',
  'A measuring vine snaps. Someone curses. The clock keeps ticking.',
  'Colors spread across the workspace: coral pink, jungle green, volcanic black.',
  'The model practices poses while the designer mutters measurements.',
  'Scissors fashioned from shells make satisfying clicks with every cut.',
  'Someone holds a garment up to the light. The shadows reveal every flaw.',
  'The humidity curls the fabric. Everything designed here must survive the runway.',
];

const ATMOSPHERE_RUNWAY = [
  'The makeshift spotlights flicker on. The runway gleams.',
  'Flashbulbs pop from the audience of crew members and cameramen.',
  'The crowd leans forward. This is the moment everything was building toward.',
  'A hush falls over the runway. The music starts.',
  'The judges\'s pens hover over their scorecards. Every detail matters.',
  'Backstage, handlers whisper last-minute encouragement to their creatures.',
  'The runway stretches before them — twenty feet of glory or humiliation.',
  'Someone adjusts a crown of shells. One last deep breath.',
  'The spotlight hits the curtain. Behind it, a model steels their nerve.',
  'The air smells of sweat, flowers, and raw ambition.',
];

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════
export function simulateProjectRunaway(ep) {
  _usedTexts.clear();

  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return ep;

  const allActive = tribes.flatMap(t => t.members).filter(n => n !== ep.exileDuelPlayer);
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  // ─── THEME ASSIGNMENT ───
  const shuffledThemes = [...THEMES].sort(() => Math.random() - 0.5);
  const tribeThemes = {};
  tribes.forEach((t, i) => { tribeThemes[t.name] = shuffledThemes[i % shuffledThemes.length]; });

  // ══ ROLE ASSIGNMENT (before any phase) ══
  const tribeRoles = {};
  const roleEvents = [];

  tribes.forEach(tribe => {
    const members = tribe.members.filter(m => allActive.includes(m));
    if (members.length < 3) return;

    const designerScores = members.map(n => ({
      name: n, score: pStats(n).mental * 0.5 + pStats(n).strategic * 0.5 + noise(2.5),
    })).sort((a, b) => b.score - a.score);
    const designer = designerScores[0].name;

    const modelScores = members.filter(m => m !== designer).map(n => ({
      name: n, score: pStats(n).social * 0.5 + pStats(n).boldness * 0.5 + noise(2.5),
    })).sort((a, b) => b.score - a.score);
    const model = modelScores[0].name;

    const remaining = members.filter(m => m !== designer && m !== model);
    const handlerScores = remaining.map(n => ({
      name: n, score: pStats(n).intuition * 0.5 + pStats(n).temperament * 0.5 + noise(2.5),
    })).sort((a, b) => b.score - a.score);
    const handlers = handlerScores.slice(0, 2).map(h => h.name);

    const gatherers = remaining.filter(m => !handlers.includes(m));

    tribeRoles[tribe.name] = { designer, model, handlers, gatherers };

    const dpr = pronouns(designer), mpr = pronouns(model);
    const narration = [
      { player: designer, role: 'Designer', text: pick(ROLE_ASSIGN_TEXT.designer)(designer, dpr), badge: 'DESIGNER', badgeClass: 'gold' },
      { player: model, role: 'Model', text: pick(ROLE_ASSIGN_TEXT.model)(model, mpr), badge: 'MODEL', badgeClass: 'rose' },
      ...handlers.map(h => {
        const hpr = pronouns(h);
        return { player: h, role: 'Handler', text: pick(ROLE_ASSIGN_TEXT.handler)(h, hpr), badge: 'HANDLER', badgeClass: 'blue' };
      }),
      ...gatherers.map(g => {
        const gpr = pronouns(g);
        return { player: g, role: 'Gatherer', text: pick(ROLE_ASSIGN_TEXT.gatherer)(g, gpr), badge: 'GATHERER', badgeClass: 'gold' };
      }),
    ];
    roleEvents.push({
      type: 'roleAssign', tribe: tribe.name,
      roles: { designer, model, handlers: [...handlers], gatherers: [...gatherers] },
      theme: tribeThemes[tribe.name],
      narration,
    });
  });

  // ══ PHASE 1: CREATURE HUNT ══
  const huntEvents = [];
  const tribeCreatures = {};

  tribes.forEach(tribe => {
    const members = tribe.members.filter(m => allActive.includes(m));
    if (members.length === 0) return;

    // Beat 1: Scouting — best intuition player
    const scoutScores = members.map(n => ({
      name: n,
      score: pStats(n).intuition * 0.6 + pStats(n).mental * 0.4 + noise(2.5),
    })).sort((a, b) => b.score - a.score);
    const scout = scoutScores[0].name;
    const scoutQuality = scoutScores[0].score;

    // Determine available creatures based on scout quality
    const shuffledCreatures = [...CREATURES].sort(() => Math.random() - 0.5);
    let available;
    if (scoutQuality >= 6) {
      // Good scout: access to rarer creatures
      available = shuffledCreatures.slice(0, 4).sort((a, b) => DIFF_MOD[b.difficulty] - DIFF_MOD[a.difficulty]).slice(0, 3);
    } else if (scoutQuality >= 3) {
      available = shuffledCreatures.slice(0, 5).slice(0, 3);
    } else {
      // Poor scout: only easy creatures
      available = shuffledCreatures.filter(c => c.difficulty !== 'high').slice(0, 3);
      if (available.length < 3) available = shuffledCreatures.slice(0, 3);
    }

    const scoutTier = scoutQuality >= 6 ? 'strong' : scoutQuality >= 3 ? 'mid' : 'weak';
    const pr = pronouns(scout);
    huntEvents.push({
      type: 'scout', player: scout, tribe: tribe.name, beat: 0,
      text: pick(SCOUT_TEXT[scoutTier])(scout, pr),
      badge: 'SCOUT', badgeClass: 'gold',
      creaturesFound: available.map(c => c.name),
    });
    ep.chalMemberScores[scout] += 3;

    // Beat 2: Chase — 2-3 hunters from tribe
    const hunterCount = Math.min(members.length, 2 + (Math.random() < 0.4 ? 1 : 0));
    const hunters = members
      .filter(m => m !== scout)
      .map(n => ({ name: n, score: pStats(n).physical * 0.5 + pStats(n).boldness * 0.5 + noise(2.5) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, hunterCount)
      .map(h => h.name);

    // If not enough non-scouts, include scout
    if (hunters.length < 2) hunters.push(scout);

    // Target the best available creature (highest show + coop)
    const targetCreature = available.sort((a, b) => (b.show + b.coop) - (a.show + a.coop))[0];
    const diffMod = DIFF_MOD[targetCreature.difficulty];

    let chaseSuccess = false;
    hunters.forEach(hunter => {
      const s = pStats(hunter);
      const hpr = pronouns(hunter);
      const chaseScore = s.physical * 0.5 + s.boldness * 0.3 + s.endurance * 0.2 + noise(2.5) - diffMod * 0.5;
      const tier = chaseScore >= 5 ? 'strong' : chaseScore >= 2 ? 'mid' : 'weak';

      huntEvents.push({
        type: 'chase', player: hunter, tribe: tribe.name, beat: 1,
        text: pick(CHASE_TEXT[tier])(hunter, hpr, targetCreature.name),
        badge: tier === 'strong' ? 'FAST PURSUIT' : tier === 'mid' ? 'STEADY' : 'STRUGGLING',
        badgeClass: tier === 'strong' ? 'gold' : tier === 'mid' ? 'blue' : 'rose',
        creature: targetCreature.name,
      });

      ep.chalMemberScores[hunter] += tier === 'strong' ? 5 : tier === 'mid' ? 3 : 2;
      if (tier === 'strong' || (tier === 'mid' && Math.random() < 0.6)) chaseSuccess = true;
    });

    // Social event during hunt: cross-path trash talk
    if (tribes.length >= 2 && Math.random() < 0.5) {
      const otherTribe = tribes.find(t => t.name !== tribe.name);
      if (otherTribe && otherTribe.members.length > 0) {
        const talker = pick(members);
        const target = pick(otherTribe.members);
        huntEvents.push({
          type: 'social', subtype: 'crossPathTrashTalk', player: talker,
          player2: target, tribe: tribe.name, beat: 1,
          text: pick(SOCIAL_TEXT.crossPathTrashTalk)(talker, target),
          badge: 'RIVALRY', badgeClass: 'rose',
        });
        addBond(talker, target, -0.3);
        popDelta(talker, arch(talker) === 'villain' || arch(talker) === 'mastermind' ? 1 : -1);
      }
    }

    // Beat 3: Capture
    let capturedCreature;
    if (chaseSuccess) {
      capturedCreature = targetCreature;
      const capturer = pick(hunters);
      const cpr = pronouns(capturer);
      huntEvents.push({
        type: 'capture', player: capturer, tribe: tribe.name, beat: 2,
        text: pick(CAPTURE_TEXT.success)(capturer, cpr, targetCreature.name),
        badge: 'CAPTURED', badgeClass: 'gold',
        creature: targetCreature.name, success: true,
      });
      ep.chalMemberScores[capturer] += 4;
      popDelta(capturer, 1);
    } else {
      // Failed chase — guaranteed easiest remaining
      capturedCreature = available.sort((a, b) => DIFF_MOD[a.difficulty] - DIFF_MOD[b.difficulty])[0];
      const capturer = pick(hunters);
      const cpr = pronouns(capturer);
      huntEvents.push({
        type: 'capture', player: capturer, tribe: tribe.name, beat: 2,
        text: pick(CAPTURE_TEXT.fail)(capturer, cpr, targetCreature.name) +
          ` The team settles for the ${capturedCreature.name} instead.`,
        badge: 'FALLBACK', badgeClass: 'rose',
        creature: capturedCreature.name, success: false,
        originalTarget: targetCreature.name,
      });
      ep.chalMemberScores[capturer] += 1;
    }

    tribeCreatures[tribe.name] = { ...capturedCreature, currentCoop: capturedCreature.coop };

    // Creature reveal card
    huntEvents.push({
      type: 'creatureReveal', tribe: tribe.name, beat: 2,
      creature: capturedCreature,
    });
  });

  // ══ PHASE 2: DESIGN & BUILD ══
  const designEvents = [];
  const tribeMaterials = {};
  const tribeDesignScores = {};
  const tribeHandlerScores = {};
  const tribeModelScores = {};
  const tribeMaterialQuality = {};

  tribes.forEach(tribe => {
    const members = tribe.members.filter(m => allActive.includes(m));
    if (members.length < 3) return;

    const roles = tribeRoles[tribe.name];
    if (!roles) return;
    const { designer, model, handlers, gatherers } = roles;

    // Run 4 beats of design work
    let cumulativeDesign = 0;
    let cumulativeHandler = 0;
    let cumulativeModel = 0;
    let materialTotal = 0;
    const materialsGathered = [];
    const creature = tribeCreatures[tribe.name];

    for (let beat = 0; beat < 4; beat++) {
      // Gatherers search
      gatherers.forEach(g => {
        const s = pStats(g);
        const gpr = pronouns(g);
        const gatherScore = s.physical * 0.3 + s.intuition * 0.5 + s.endurance * 0.2 + noise(2.5);
        const quality = gatherScore >= 6 ? 'excellent' : gatherScore >= 3 ? 'decent' : 'poor';
        const matValue = quality === 'excellent' ? 3 : quality === 'decent' ? 2 : 1;
        materialTotal += matValue;

        const mat = pick(MATERIALS);
        materialsGathered.push({ ...mat, quality, gatherer: g });

        const fabricClass = quality === 'excellent' ? 'silk' : quality === 'decent' ? 'linen' : 'denim';
        designEvents.push({
          type: 'gather', player: g, tribe: tribe.name, beat,
          text: pick(GATHER_TEXT[quality])(g, gpr),
          badge: quality.toUpperCase() + ' FIND', badgeClass: quality === 'excellent' ? 'gold' : quality === 'decent' ? 'blue' : 'rose',
          material: mat.name, quality, fabricClass,
        });
        ep.chalMemberScores[g] += matValue;
      });

      // Designer works
      {
        const s = pStats(designer);
        const dpr = pronouns(designer);
        const designScore = s.mental * 0.5 + s.strategic * 0.3 + s.intuition * 0.2 + noise(2.5);
        const tier = designScore >= 6 ? 'inspired' : designScore >= 3 ? 'steady' : 'struggling';
        cumulativeDesign += designScore;

        designEvents.push({
          type: 'design', player: designer, tribe: tribe.name, beat,
          text: pick(DESIGN_TEXT[tier])(designer, dpr),
          badge: tier.toUpperCase(), badgeClass: tier === 'inspired' ? 'gold' : tier === 'steady' ? 'blue' : 'rose',
        });
        ep.chalMemberScores[designer] += tier === 'inspired' ? 5 : tier === 'steady' ? 3 : 1;
      }

      // Handlers keep creature calm (alternate lead handler each beat)
      handlers.forEach((handler, hIdx) => {
        const s = pStats(handler);
        const hpr = pronouns(handler);
        const isLead = (beat % handlers.length) === hIdx;
        const handlerScore = s.intuition * 0.4 + s.temperament * 0.4 + s.social * 0.2 + noise(2.5) - creature.volatility * 0.3;
        const tier = handlerScore >= 5 ? 'calm' : handlerScore >= 1 ? 'agitated' : 'berserk';
        cumulativeHandler += handlerScore;

        if (isLead) {
          if (tier === 'calm') creature.currentCoop = Math.min(10, creature.currentCoop + 0.5);
          else if (tier === 'berserk') creature.currentCoop = Math.max(1, creature.currentCoop - 2);
          else creature.currentCoop = Math.max(1, creature.currentCoop - 0.5);
        }

        designEvents.push({
          type: 'handler', player: handler, tribe: tribe.name, beat,
          text: pick(HANDLER_TEXT[tier])(handler, hpr, creature.name),
          badge: (isLead ? 'LEAD ' : '') + tier.toUpperCase(), badgeClass: tier === 'calm' ? 'gold' : tier === 'agitated' ? 'blue' : 'rose',
          creature: creature.name, mood: tier,
        });
        ep.chalMemberScores[handler] += tier === 'calm' ? 4 : tier === 'agitated' ? 2 : 0;
      });

      // Model practices
      {
        const s = pStats(model);
        const mpr = pronouns(model);
        const modelScore = s.social * 0.4 + s.boldness * 0.4 + s.physical * 0.2 + noise(2.5);
        const tier = modelScore >= 6 ? 'confident' : modelScore >= 3 ? 'nervous' : 'stumble';
        cumulativeModel += modelScore;

        designEvents.push({
          type: 'model', player: model, tribe: tribe.name, beat,
          text: pick(MODEL_TEXT[tier])(model, mpr),
          badge: tier === 'confident' ? 'FIERCE' : tier === 'nervous' ? 'NERVOUS' : 'STUMBLE',
          badgeClass: tier === 'confident' ? 'gold' : tier === 'nervous' ? 'blue' : 'rose',
        });
        ep.chalMemberScores[model] += tier === 'confident' ? 5 : tier === 'nervous' ? 3 : 1;
      }

      // Guaranteed social event per beat
      _fireBuildSocialEvent(tribe, members, beat, designEvents, ep, tribeRoles, tribeCreatures, tribeOf, tribes);
    }

    tribeDesignScores[tribe.name] = cumulativeDesign;
    tribeHandlerScores[tribe.name] = cumulativeHandler / Math.max(1, handlers.length);
    tribeModelScores[tribe.name] = cumulativeModel;
    tribeMaterialQuality[tribe.name] = materialTotal / Math.max(1, gatherers.length * 4);
    tribeMaterials[tribe.name] = materialsGathered;
  });

  // ══ PHASE 3: RUNWAY SHOW ══
  const runwayEvents = [];
  const tribeScores = {};
  const tribeScoreBreakdown = {};

  tribes.forEach(tribe => {
    const roles = tribeRoles[tribe.name];
    if (!roles) return;
    const creature = tribeCreatures[tribe.name];
    if (!creature) return;

    const modelName = roles.model;
    const designerName = roles.designer;
    const handlerNames = roles.handlers;

    // Calculate scoring components
    const designerScore = tribeDesignScores[tribe.name] || 0;
    const materialQuality = tribeMaterialQuality[tribe.name] || 0;
    const modelSocial = pStats(modelName).social;
    const modelBoldness = pStats(modelName).boldness;
    const modelPractice = tribeModelScores[tribe.name] || 0;
    const handlerScore = tribeHandlerScores[tribe.name] || 0;
    const creatureCoop = creature.currentCoop;
    const designerStrategic = pStats(designerName).strategic;

    // Thematic match bonus from materials
    const mats = tribeMaterials[tribe.name] || [];
    const thematicMatch = mats.reduce((s, m) => s + m.thematic, 0) / Math.max(1, mats.length);

    // Outfit Creativity (25%): designer_score * 0.6 + material_quality * 0.4 + noise(1.5)
    const creativity = clamp((designerScore / 4) * 0.6 + materialQuality * 3 * 0.4 + noise(1.5), 1, 10);
    // Theme Fit (20%): strategic * 0.7 + thematic * 0.3 + noise(1.5)
    const themeFit = clamp(designerStrategic * 0.7 + thematicMatch * 0.3 + noise(1.5), 1, 10);
    // Model Presentation (25%): social * 0.4 + boldness * 0.3 + practice * 0.3 + noise(1.5)
    const presentation = clamp(modelSocial * 0.4 + modelBoldness * 0.3 + (modelPractice / 4) * 0.3 + noise(1.5), 1, 10);
    // Creature Cooperation (30%): coop * 0.5 + handler * 0.3 + creature_outfit_quality * 0.2 + noise(2.0)
    const creatureCoopScore = clamp(creatureCoop * 0.5 + (handlerScore / 4) * 0.3 + (designerScore / 4) * 0.2 + noise(2.0), 1, 10);

    const total = creativity * 0.25 + themeFit * 0.20 + presentation * 0.25 + creatureCoopScore * 0.30;

    tribeScores[tribe.name] = total;
    tribeScoreBreakdown[tribe.name] = {
      creativity: +creativity.toFixed(1),
      themeFit: +themeFit.toFixed(1),
      presentation: +presentation.toFixed(1),
      creatureCoop: +creatureCoopScore.toFixed(1),
      total: +total.toFixed(1),
    };

    // Segment 1: Model walks
    const modelWalkScore = presentation;
    const walkTier = modelWalkScore >= 7 ? 'strut' : modelWalkScore >= 4 ? 'decent' : 'trip';
    const mpr = pronouns(modelName);
    runwayEvents.push({
      type: 'modelWalk', player: modelName, tribe: tribe.name,
      text: pick(RUNWAY_WALK[walkTier])(modelName, mpr, tribe.name),
      badge: walkTier === 'strut' ? 'PERFECT STRUT' : walkTier === 'decent' ? 'SOLID WALK' : 'TRIP',
      badgeClass: walkTier === 'strut' ? 'gold' : walkTier === 'decent' ? 'blue' : 'rose',
    });

    if (walkTier === 'strut') popDelta(modelName, 2);
    else if (walkTier === 'trip') popDelta(modelName, -1);

    // Segment 2: Creature walks
    const creatureWalkRoll = creatureCoop * 0.6 + (handlerScore / 4) * 0.4 + noise(2.5);
    let creatureWalkType;
    if (creatureWalkRoll >= 7) creatureWalkType = 'showsOff';
    else if (creatureWalkRoll >= 3) creatureWalkType = 'decent';  // no special text pool, use showsOff toned down
    else if (creature.volatility >= 6 && Math.random() < 0.3) creatureWalkType = 'eatsOutfit';
    else creatureWalkType = 'refuses';

    if (creatureWalkType === 'decent') {
      runwayEvents.push({
        type: 'creatureWalk', tribe: tribe.name,
        text: `The ${creature.name} trots down the runway. Not spectacular, but cooperative enough.`,
        badge: 'COMPLIANT', badgeClass: 'blue', creature: creature.name,
      });
    } else {
      runwayEvents.push({
        type: 'creatureWalk', tribe: tribe.name,
        text: pick(CREATURE_RUNWAY[creatureWalkType])(handlerName, creature.name),
        badge: creatureWalkType === 'showsOff' ? 'SHOWSTOPPER' : creatureWalkType === 'eatsOutfit' ? 'OUTFIT EATEN' : 'REFUSES',
        badgeClass: creatureWalkType === 'showsOff' ? 'gold' : 'rose',
        creature: creature.name,
      });
    }

    if (creatureWalkType === 'showsOff') {
      popDelta(handlerName, 2);
      ep.chalMemberScores[handlerName] += 4;
    } else if (creatureWalkType === 'eatsOutfit' || creatureWalkType === 'refuses') {
      popDelta(handlerName, -1);
      tribeScores[tribe.name] -= 0.5;
      tribeScoreBreakdown[tribe.name].total = +(tribeScores[tribe.name]).toFixed(1);
    }

    // Scoring event
    runwayEvents.push({
      type: 'scoring', tribe: tribe.name,
      breakdown: tribeScoreBreakdown[tribe.name],
      text: pick(HOST_TEXT.scoring)(tribe.name, tribeScores[tribe.name]),
    });
  });

  // ══ PHASE 4: CREATURE BERSERK (Optional) ══
  const berserkEvents = [];
  let berserkTriggered = false;
  let berserkTribe = null;
  let berserkRescueTribe = null;
  let berserkScoreBonus = 0;

  // Check each tribe's creature for berserk potential
  for (const tribe of tribes) {
    const creature = tribeCreatures[tribe.name];
    if (!creature) continue;
    if (creature.volatility >= 6 && creature.currentCoop < 4 && Math.random() < 0.4) {
      berserkTriggered = true;
      berserkTribe = tribe.name;

      berserkEvents.push({
        type: 'escape', tribe: tribe.name,
        text: pick(BERSERK_TEXT.escape)(creature.name),
        badge: 'BERSERK', badgeClass: 'rose',
        creature: creature.name,
      });

      // Camp event injection: berserk-blame (both handlers share blame)
      const blameHandlers = tribeRoles[tribe.name]?.handlers || [];
      if (blameHandlers.length > 0) {
        const campKey = tribe.name;
        const blameHandler = pick(blameHandlers);
        ep.campEvents[campKey].post.push({
          type: 'berserk-blame',
          desc: `${creature.name} went berserk during the runway show. ${blameHandler} takes heat for losing control.`,
          players: [...blameHandlers],
          badgeText: 'Berserk Blame',
          badgeClass: 'badge-negative',
        });
        blameHandlers.forEach(h => { popDelta(h, -2); addBond(h, tribeRoles[tribe.name]?.designer || h, -0.5); });
      }

      // Rescue race: 3 beats
      const allHunters = tribes.flatMap(t => t.members.filter(m => allActive.includes(m)));
      const rescueScores = {};
      tribes.forEach(t => { rescueScores[t.name] = 0; });

      for (let beat = 0; beat < 3; beat++) {
        tribes.forEach(t => {
          const rescuer = pick(t.members.filter(m => allActive.includes(m)));
          if (!rescuer) return;
          const s = pStats(rescuer);
          const rpr = pronouns(rescuer);
          const rescueRoll = s.physical * 0.4 + s.intuition * 0.3 + s.boldness * 0.3 + noise(2.5);
          rescueScores[t.name] += rescueRoll;

          const beatType = beat === 0 ? 'chase' : beat === 1 ? 'chase' : 'rescue';
          berserkEvents.push({
            type: beatType, player: rescuer, tribe: t.name, beat,
            text: pick(BERSERK_TEXT[beatType])(rescuer, rpr, creature.name),
            badge: beat < 2 ? 'PURSUIT' : 'RESCUE ATTEMPT',
            badgeClass: rescueRoll >= 5 ? 'gold' : 'blue',
            creature: creature.name,
          });
          ep.chalMemberScores[rescuer] += Math.round(rescueRoll * 0.5);
        });
      }

      // Determine rescue hero tribe
      const rescueSorted = Object.entries(rescueScores).sort(([, a], [, b]) => b - a);
      berserkRescueTribe = rescueSorted[0][0];

      // Score bonus: +5 to +10, but only if gap < 8
      const gap = Math.abs((tribeScores[rescueSorted[0][0]] || 0) - (tribeScores[rescueSorted[rescueSorted.length - 1][0]] || 0));
      if (gap < 8) {
        berserkScoreBonus = 5 + Math.round(Math.random() * 5);
        tribeScores[berserkRescueTribe] = (tribeScores[berserkRescueTribe] || 0) + berserkScoreBonus * 0.1;
        tribeScoreBreakdown[berserkRescueTribe].total = +(tribeScores[berserkRescueTribe]).toFixed(1);
      }

      berserkEvents.push({
        type: 'rescueResult', tribe: berserkRescueTribe,
        text: `${berserkRescueTribe} catches the ${creature.name}! ${berserkScoreBonus > 0 ? `Rescue hero bonus: +${(berserkScoreBonus * 0.1).toFixed(1)} to their score!` : 'The gap was too large for a rescue bonus to matter.'}`,
        badge: 'RESCUED', badgeClass: 'gold',
        bonus: berserkScoreBonus > 0 ? +(berserkScoreBonus * 0.1).toFixed(1) : 0,
      });

      // Camp event: berserk-rescue
      ep.campEvents[berserkRescueTribe].post.push({
        type: 'berserk-rescue',
        desc: `${berserkRescueTribe} heroically recaptured the berserk ${creature.name}.`,
        players: tribes.find(t => t.name === berserkRescueTribe)?.members || [],
        badgeText: 'Rescue Heroes',
        badgeClass: 'badge-positive',
      });

      break; // Only one berserk per challenge
    }
  }

  // ══ FINALIZATION ══
  // Rank tribes by avg score
  const tribesSorted = Object.entries(tribeScores)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name);

  const winnerTribeName = tribesSorted[0];
  const loserTribeName = tribesSorted[tribesSorted.length - 1];
  const winnerTribe = gs.tribes.find(t => t.name === winnerTribeName);
  const loserTribe = gs.tribes.find(t => t.name === loserTribeName);

  // Winner/loser events
  runwayEvents.push({
    type: 'winner', tribe: winnerTribeName,
    text: pick(HOST_TEXT.winner)(winnerTribeName),
    badge: 'IMMUNITY', badgeClass: 'gold',
  });
  runwayEvents.push({
    type: 'loser', tribe: loserTribeName,
    text: pick(HOST_TEXT.loser)(loserTribeName),
    badge: 'TRIBAL COUNCIL', badgeClass: 'rose',
  });

  // Romance hooks
  _challengeRomanceSpark(ep, null, null, ep.chalMemberScores, 'project runaway', allActive);
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores, 'project runaway', allActive);

  // Store simulation data
  ep.projectRunaway = {
    roleEvents,
    huntEvents,
    designEvents,
    runwayEvents,
    berserkEvents,
    berserkTriggered,
    berserkTribe,
    berserkRescueTribe,
    berserkScoreBonus,
    tribeCreatures,
    tribeRoles,
    tribeThemes,
    tribeMaterials,
    tribeScores,
    tribeScoreBreakdown,
    tribesSorted,
    winner: winnerTribeName,
    loser: loserTribeName,
    tribes: tribes.map(t => ({
      name: t.name,
      members: [...t.members],
      creature: tribeCreatures[t.name] || null,
      roles: tribeRoles[t.name] || null,
      theme: tribeThemes[t.name] || null,
      materials: tribeMaterials[t.name] || [],
      score: tribeScores[t.name] || 0,
      breakdown: tribeScoreBreakdown[t.name] || null,
      isWinner: t.name === winnerTribeName,
    })),
    hostIntro: pick(HOST_TEXT.intro)(),
    hostWinner: pick(HOST_TEXT.winner)(winnerTribeName),
    hostLoser: pick(HOST_TEXT.loser)(loserTribeName),
  };

  ep.isProjectRunaway = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Project Runaway';
  ep.challengeCategory = 'social';

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

  // Top scorer bonus for challenge record
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

// ── Social event helper for build phase ──
function _fireBuildSocialEvent(tribe, members, beat, events, ep, tribeRoles, tribeCreatures, tribeOf, tribes) {
  const roles = tribeRoles[tribe.name];
  if (!roles) return;
  const creature = tribeCreatures[tribe.name];

  const eventTypes = [];
  // Always possible
  eventTypes.push('teamwork', 'fittingMoment');
  // Conditional
  if (members.length >= 2) eventTypes.push('designArgument', 'fabricFight');
  if (creature) eventTypes.push('creatureSpook', 'creatureBond');
  // Villain-only
  const schemers = members.filter(m => canScheme(m));
  if (schemers.length > 0) eventTypes.push('materialTheft', 'sabotageFrame');
  // Rare
  eventTypes.push('inspirationStrike');

  const eventType = pick(eventTypes);

  switch (eventType) {
    case 'designArgument': {
      const a = roles.designer;
      const b = pick(members.filter(m => m !== a));
      if (!b) break;
      events.push({
        type: 'social', subtype: 'designArgument', player: a, player2: b, tribe: tribe.name, beat,
        text: pick(SOCIAL_TEXT.designArgument)(a, b),
        badge: 'ARGUMENT', badgeClass: 'rose',
      });
      addBond(a, b, -0.3);
      ep.chalMemberScores[roles.designer] += (Math.random() < 0.5 ? 1 : -1);
      break;
    }
    case 'materialTheft': {
      const thief = pick(schemers);
      const otherTribe = tribes.find(t => t.name !== tribe.name);
      if (!otherTribe || otherTribe.members.length === 0) break;
      const victim = pick(otherTribe.members);
      const caught = Math.random() < 0.35;

      events.push({
        type: 'social', subtype: 'materialTheft', player: thief, player2: victim, tribe: tribe.name, beat,
        text: pick(SOCIAL_TEXT.materialTheft)(thief, victim),
        badge: 'THEFT', badgeClass: 'rose',
      });

      if (caught) {
        const witness = pick(otherTribe.members.filter(m => m !== victim));
        if (witness) {
          events.push({
            type: 'social', subtype: 'theftCaught', player: thief, player2: witness, tribe: tribe.name, beat,
            text: pick(SOCIAL_TEXT.theftCaught)(thief, witness),
            badge: 'CAUGHT', badgeClass: 'rose',
          });
          popDelta(thief, -3);
          addBond(thief, witness, -1);
          // Heat via camp event
          ep.campEvents[tribe.name].post.push({
            type: 'theft-caught',
            desc: `${thief} was caught stealing materials from ${victim}.`,
            players: [thief, victim],
            badgeText: 'Material Theft',
            badgeClass: 'badge-negative',
          });
        }
      } else {
        ep.chalMemberScores[thief] += 2; // stolen materials help
        popDelta(thief, -1);
      }
      break;
    }
    case 'creatureSpook': {
      const handler = pick(roles.handlers);
      if (!creature) break;
      events.push({
        type: 'social', subtype: 'creatureSpook', player: handler, tribe: tribe.name, beat,
        text: pick(SOCIAL_TEXT.creatureSpook)(handler, creature.name),
        badge: 'CREATURE SPOOK', badgeClass: 'rose',
      });
      creature.currentCoop = Math.max(1, creature.currentCoop - 1);
      ep.chalMemberScores[handler] -= 1;
      break;
    }
    case 'fittingMoment': {
      const model = roles.model;
      const designer = roles.designer;
      events.push({
        type: 'social', subtype: 'fittingMoment', player: model, player2: designer, tribe: tribe.name, beat,
        text: pick(SOCIAL_TEXT.fittingMoment)(model, designer),
        badge: 'FITTING', badgeClass: 'gold',
      });
      addBond(model, designer, 0.4);
      ep.chalMemberScores[model] += 1;
      break;
    }
    case 'inspirationStrike': {
      const designer = roles.designer;
      events.push({
        type: 'social', subtype: 'inspirationStrike', player: designer, tribe: tribe.name, beat,
        text: pick(SOCIAL_TEXT.inspirationStrike)(designer),
        badge: 'INSPIRATION', badgeClass: 'gold',
      });
      ep.chalMemberScores[designer] += 4;
      popDelta(designer, 1);
      break;
    }
    case 'fabricFight': {
      const pair = [...members].sort(() => Math.random() - 0.5).slice(0, 2);
      if (pair.length < 2) break;
      const [a, b] = pair;
      const aRoll = pStats(a).physical + noise(2.5);
      const bRoll = pStats(b).physical + noise(2.5);
      const loser = aRoll >= bRoll ? b : a;
      events.push({
        type: 'social', subtype: 'fabricFight', player: a, player2: b, tribe: tribe.name, beat,
        text: pick(SOCIAL_TEXT.fabricFight)(a, b),
        badge: 'FABRIC FIGHT', badgeClass: 'rose',
      });
      addBond(a, b, -0.5);
      ep.chalMemberScores[loser] -= 1;
      break;
    }
    case 'creatureBond': {
      const handler = pick(roles.handlers);
      if (!creature) break;
      events.push({
        type: 'social', subtype: 'creatureBond', player: handler, tribe: tribe.name, beat,
        text: pick(SOCIAL_TEXT.creatureBond)(handler, creature.name),
        badge: 'CREATURE BOND', badgeClass: 'gold',
      });
      creature.currentCoop = Math.min(10, creature.currentCoop + 3);
      ep.chalMemberScores[handler] += 3;
      popDelta(handler, 1);
      break;
    }
    case 'sabotageFrame': {
      const schemer = pick(schemers);
      const framed = pick(members.filter(m => m !== schemer && !canScheme(m)));
      if (!framed) break;
      events.push({
        type: 'social', subtype: 'sabotageFrame', player: schemer, player2: framed, tribe: tribe.name, beat,
        text: pick(SOCIAL_TEXT.sabotageFrame)(schemer, framed),
        badge: 'FRAME JOB', badgeClass: 'rose',
      });
      popDelta(framed, -2);
      addBond(schemer, framed, -0.5);
      // Heat on framed player
      ep.campEvents[tribe.name].post.push({
        type: 'sabotage-frame',
        desc: `${schemer} framed ${framed} for sabotage during the design phase.`,
        players: [schemer, framed],
        badgeText: 'Framed',
        badgeClass: 'badge-negative',
      });
      break;
    }
    case 'teamwork': {
      const pair = [...members].sort(() => Math.random() - 0.5).slice(0, 2);
      if (pair.length < 2) break;
      const [a, b] = pair;
      events.push({
        type: 'social', subtype: 'teamwork', player: a, player2: b, tribe: tribe.name, beat,
        text: pick(SOCIAL_TEXT.teamwork)(a, b),
        badge: 'TEAMWORK', badgeClass: 'gold',
      });
      addBond(a, b, 0.4);
      ep.chalMemberScores[a] += 1;
      ep.chalMemberScores[b] += 1;
      break;
    }
  }
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
    const el = document.getElementById(`pr-step-${suffix}-${i}`);
    if (el) el.classList.add('pr-visible');
  }
  const counter = document.getElementById(`pr-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`pr-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.ctrl-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

function _prUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('pr-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._prEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.projectRunaway) return;
  sideEl.innerHTML = _buildSidebarContent(epRecord, screenKey);
}

export function prRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    const suffix = screenKey.replace('pr-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    const el = document.getElementById(`pr-step-${suffix}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) { console.warn('PR reveal error:', e); }
  try { _prUpdateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
}

export function prRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('pr-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
  } catch (e) { console.warn('PR revealAll error:', e); }
  try { _prUpdateSidebar(screenKey); } catch (e) { /* sidebar update optional */ }
}

// ── CSS CREATURE ICONS ──
function _creatureIcon(type) {
  switch (type) {
    case 'mutant-frog': return `<svg viewBox="0 0 36 36" fill="none" stroke="var(--gold)" stroke-width="2"><ellipse cx="18" cy="22" rx="10" ry="8"/><circle cx="12" cy="14" r="4" fill="rgba(244,200,66,0.3)"/><circle cx="24" cy="14" r="4" fill="rgba(244,200,66,0.3)"/><circle cx="12" cy="13" r="2" fill="var(--gold)"/><circle cx="24" cy="13" r="2" fill="var(--gold)"/><path d="M14 26 Q18 30 22 26" stroke-linecap="round"/></svg>`;
    case 'woolly-beaver': return `<svg viewBox="0 0 36 36" fill="none" stroke="var(--gold)" stroke-width="2"><ellipse cx="18" cy="20" rx="12" ry="10"/><circle cx="13" cy="17" r="2" fill="var(--gold)"/><circle cx="23" cy="17" r="2" fill="var(--gold)"/><path d="M12 28 Q18 33 24 28" stroke-linecap="round"/><path d="M6 14 Q10 8 14 12" stroke-linecap="round"/><path d="M22 12 Q26 8 30 14" stroke-linecap="round"/></svg>`;
    case 'giant-crab': return `<svg viewBox="0 0 36 36" fill="none" stroke="var(--gold)" stroke-width="2"><ellipse cx="18" cy="20" rx="14" ry="8"/><circle cx="12" cy="16" r="2" fill="var(--gold)"/><circle cx="24" cy="16" r="2" fill="var(--gold)"/><path d="M4 12 Q2 6 6 8 L10 14" stroke-linecap="round"/><path d="M32 12 Q34 6 30 8 L26 14" stroke-linecap="round"/><line x1="8" y1="28" x2="6" y2="32" stroke-linecap="round"/><line x1="14" y1="28" x2="13" y2="32" stroke-linecap="round"/><line x1="22" y1="28" x2="23" y2="32" stroke-linecap="round"/><line x1="28" y1="28" x2="30" y2="32" stroke-linecap="round"/></svg>`;
    case 'neon-parrot': return `<svg viewBox="0 0 36 36" fill="none" stroke="var(--gold)" stroke-width="2"><ellipse cx="18" cy="18" rx="8" ry="10"/><circle cx="15" cy="14" r="2" fill="var(--gold)"/><path d="M22 12 L28 8 L26 14 Z" fill="rgba(244,200,66,0.3)"/><path d="M12 26 Q8 34 14 30" stroke-linecap="round"/><path d="M24 26 Q28 34 22 30" stroke-linecap="round"/><path d="M10 10 Q6 4 8 10" stroke-linecap="round"/></svg>`;
    case 'armored-turtle': return `<svg viewBox="0 0 36 36" fill="none" stroke="var(--gold)" stroke-width="2"><ellipse cx="18" cy="20" rx="14" ry="10"/><path d="M4 20 Q18 6 32 20" fill="rgba(244,200,66,0.1)"/><line x1="10" y1="12" x2="10" y2="20"/><line x1="18" y1="10" x2="18" y2="20"/><line x1="26" y1="12" x2="26" y2="20"/><circle cx="8" cy="22" r="2" fill="var(--gold)"/><path d="M30 20 L34 18" stroke-linecap="round"/></svg>`;
    case 'electric-eel': return `<svg viewBox="0 0 36 36" fill="none" stroke="var(--gold)" stroke-width="2"><path d="M4 18 Q10 8 18 18 Q26 28 32 18" stroke-width="3"/><circle cx="30" cy="16" r="2" fill="var(--gold)"/><path d="M8 12 L6 6" stroke-linecap="round" stroke-dasharray="2 2"/><path d="M18 10 L16 4" stroke-linecap="round" stroke-dasharray="2 2"/><path d="M28 12 L30 6" stroke-linecap="round" stroke-dasharray="2 2"/></svg>`;
    case 'glitter-fox': return `<svg viewBox="0 0 36 36" fill="none" stroke="var(--gold)" stroke-width="2"><ellipse cx="18" cy="22" rx="10" ry="8"/><path d="M8 18 L4 6 L14 14" fill="rgba(244,200,66,0.15)"/><path d="M28 18 L32 6 L22 14" fill="rgba(244,200,66,0.15)"/><circle cx="14" cy="18" r="2" fill="var(--gold)"/><circle cx="22" cy="18" r="2" fill="var(--gold)"/><path d="M16 22 L18 24 L20 22" stroke-linecap="round"/><path d="M26 28 Q32 32 34 28" stroke-linecap="round"/></svg>`;
    case 'spiky-porcupine': return `<svg viewBox="0 0 36 36" fill="none" stroke="var(--gold)" stroke-width="2"><ellipse cx="18" cy="22" rx="12" ry="8"/><circle cx="13" cy="20" r="2" fill="var(--gold)"/><circle cx="23" cy="20" r="2" fill="var(--gold)"/><line x1="10" y1="14" x2="8" y2="6" stroke-linecap="round"/><line x1="14" y1="14" x2="13" y2="6" stroke-linecap="round"/><line x1="18" y1="14" x2="18" y2="5" stroke-linecap="round"/><line x1="22" y1="14" x2="23" y2="6" stroke-linecap="round"/><line x1="26" y1="14" x2="28" y2="6" stroke-linecap="round"/><path d="M14 26 Q18 29 22 26" stroke-linecap="round"/></svg>`;
    default: return `<svg viewBox="0 0 36 36" fill="none" stroke="var(--gold)" stroke-width="2"><circle cx="18" cy="18" r="12"/><circle cx="14" cy="16" r="2" fill="var(--gold)"/><circle cx="22" cy="16" r="2" fill="var(--gold)"/><path d="M14 22 Q18 26 22 22" stroke-linecap="round"/></svg>`;
  }
}

// ── AVATAR HELPER ──
function _av(name, size = 32) {
  const s = slug(name);
  return `<img class="evt-avatar" src="assets/avatars/${s}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:2px;object-fit:contain;border:1px solid var(--border);flex-shrink:0" onerror="this.style.display='none'">`;
}

// ── EVENT CARD BUILDER ──
function _card(evt, idx, screenKey) {
  const suffix = screenKey.replace('pr-', '');
  const isSocial = evt.type === 'social';
  const socialCls = isSocial ? ' social-card' : '';
  const fabricCls = evt.fabricClass ? ` fabric-card fabric-${evt.fabricClass}` : '';
  const badgeCls = evt.badgeClass === 'gold' ? 'badge-gold' : evt.badgeClass === 'rose' ? 'badge-rose' : 'badge-blue';

  let html = `<div class="evt-card${socialCls}${fabricCls}" id="pr-step-${suffix}-${idx}">`;
  html += `<div class="evt-card-hdr">`;
  if (evt.player) html += _av(evt.player);
  if (evt.player) {
    const nameDisplay = evt.player2 ? `${evt.player} & ${evt.player2}` : evt.player;
    html += `<span class="evt-name">${nameDisplay}</span>`;
  }
  if (evt.badge) html += `<span class="evt-badge ${badgeCls}">${evt.badge}</span>`;
  html += `</div>`;
  if (evt.text) html += `<div class="evt-text">${evt.text}</div>`;
  html += `</div>`;
  return html;
}

// ── CREATURE CARD BUILDER ──
function _creatureCard(creature) {
  return `<div class="creature-card">
    <div class="creature-icon">${_creatureIcon(creature.id)}</div>
    <div class="creature-info">
      <div class="creature-name">${creature.name}</div>
      <div class="creature-stats">
        <span class="creature-stat">Coop <span class="stat-val">${creature.coop}</span></span>
        <span class="creature-stat">Show <span class="stat-val">${creature.show}</span></span>
        <span class="creature-stat">Volatility <span class="stat-val">${creature.volatility}</span></span>
      </div>
    </div>
  </div>`;
}

// ── CONTROLS BUILDER ──
function _buildControls(screenKey, total) {
  const suffix = screenKey.replace('pr-', '');
  return `<div class="controls" id="pr-controls-${suffix}">
    <button class="ctrl-btn primary" onclick="prRevealNext('${screenKey}',${total})">Reveal Next</button>
    <div class="ctrl-counter" id="pr-counter-${suffix}">0 / ${total}</div>
    <button class="ctrl-btn" onclick="prRevealAll('${screenKey}',${total})">Reveal All</button>
  </div>`;
}

// ── CROWD FIGURES BUILDER ──
function _buildCrowdSide(side) {
  let html = `<div class="co-crowd co-crowd-${side}">`;
  for (let i = 0; i < 12; i++) {
    html += `<div class="co-crowd-fig"><div class="cf-head"></div><div class="cf-body"></div></div>`;
  }
  html += `</div>`;
  return html;
}

// ── SIDEBAR BUILDER ──
function _buildSidebarContent(ep, screenKey) {
  const pr = ep.projectRunaway;
  if (!pr) return '';

  const revIdx = _tvState[screenKey]?.idx ?? -1;
  let html = '';

  // Tribe editorial spreads — gated by screen to avoid spoiling roles
  const rolesRevealed = screenKey !== 'pr-title' && screenKey !== 'pr-roles';
  const rolesPartial = screenKey === 'pr-roles';

  (pr.tribes || []).forEach((tribe, tIdx) => {
    const roles = tribe.roles;
    if (!roles) return;

    html += `<div class="mag-page">`;
    html += `<div class="mag-page-header">${tribe.name}</div>`;
    html += `<div class="mag-page-sub">${tribe.theme || 'Theme TBD'}</div>`;

    if (!rolesRevealed && !rolesPartial) {
      // Title screen — just tribe name, no role details
      html += `<div style="font-family:var(--editorial);font-size:13px;font-style:italic;color:#7a5a6a;padding:8px 0;">Roles to be assigned...</div>`;
      html += `</div>`;
      return;
    }

    if (rolesPartial) {
      // On the roles screen — show roles progressively based on reveal index
      const rolesIdx = _tvState['pr-roles']?.idx ?? -1;
      const roleEvts = pr.roleEvents || [];
      // Map stepIdx back to tribes: each roleEvent has N narration cards
      let cardsBefore = 0;
      let tribeStartIdx = -1;
      for (const re of roleEvts) {
        if (re.tribe === tribe.name) { tribeStartIdx = cardsBefore; break; }
        cardsBefore += (re.narration || []).length;
      }
      if (tribeStartIdx === -1 || rolesIdx < tribeStartIdx) {
        html += `<div style="font-family:var(--editorial);font-size:13px;font-style:italic;color:#7a5a6a;padding:8px 0;">Awaiting role call...</div>`;
        html += `</div>`;
        return;
      }
    }

    // Full editorial spread (shown on hunt/design/runway/berserk/results, or on roles screen after reveal)
    html += `<div class="mag-spread">`;

    // Model = cover shot
    html += `<div class="mag-cover-shot">`;
    html += `<img src="assets/avatars/${slug(roles.model)}.png" alt="${roles.model}" onerror="this.parentElement.style.background='#3a2a4a'">`;
    html += `<span class="mag-role-banner">Cover Star</span>`;
    html += `<div class="mag-player-role"><div class="mag-player-name">${roles.model}</div><div class="mag-player-tag">Model</div></div>`;
    html += `</div>`;

    // Designer + Handlers mid row
    const midCards = [
      { name: roles.designer, tag: 'Designer', bg: '#2a3a4a' },
      ...(roles.handlers || []).map(h => ({ name: h, tag: 'Handler', bg: '#3a3a2a' })),
    ];
    html += `<div class="mag-mid-row" style="grid-template-columns:repeat(${midCards.length},1fr);">`;
    midCards.forEach(c => {
      html += `<div class="mag-mid-card"><img src="assets/avatars/${slug(c.name)}.png" alt="${c.name}" onerror="this.parentElement.style.background='${c.bg}'"><div class="mag-player-role"><div class="mag-player-name">${c.name}</div><div class="mag-player-tag">${c.tag}</div></div></div>`;
    });
    html += `</div>`;

    // Gatherers headshot row
    if (roles.gatherers && roles.gatherers.length > 0) {
      html += `<div class="mag-headshot-row">`;
      roles.gatherers.forEach(g => {
        html += `<div class="mag-headshot"><img src="assets/avatars/${slug(g)}.png" alt="${g}"><div class="mag-hs-name">${g}</div></div>`;
      });
      html += `</div>`;
    }

    html += `</div></div>`;
  });

  // Runway Scores (gated by reveal state — only show if we're on runway or results screens)
  const showScores = screenKey === 'pr-runway' || screenKey === 'pr-results' || screenKey === 'pr-berserk';
  if (showScores && pr.tribeScoreBreakdown) {
    html += `<div class="mag-page">`;
    html += `<div class="mag-page-header">Runway Scores</div>`;
    html += `<div class="mag-page-sub">Host evaluation, live updating</div>`;
    html += `<div class="mag-score"><div class="mag-score-title">Total Score</div>`;
    (pr.tribes || []).forEach(tribe => {
      const bd = tribe.breakdown;
      if (!bd) return;
      const pct = Math.min(100, Math.round(bd.total * 10));
      html += `<div class="score-row"><span class="score-tribe">${tribe.name}</span><span class="score-val">${bd.total}</span></div>`;
      html += `<div class="score-bar"><div class="score-bar-fill" style="width:${pct}%"></div></div>`;
    });
    html += `</div></div>`;
  }

  // Creature Dossier
  const showCreatures = screenKey !== 'pr-title';
  if (showCreatures) {
    html += `<div class="mag-page">`;
    html += `<div class="mag-page-header">Creature Dossier</div>`;
    html += `<div class="mag-page-sub">Volatility monitor</div>`;
    html += `<div style="font-family:var(--sans);font-size:12px;color:var(--ink);padding:4px 0;">`;
    (pr.tribes || []).forEach(tribe => {
      const c = tribe.creature;
      if (!c) return;
      const mood = (c.currentCoop || c.coop) >= 6 ? 'Calm' : (c.currentCoop || c.coop) >= 3 ? 'Agitated' : 'Hostile';
      const moodColor = mood === 'Calm' ? '#2a7a4a' : mood === 'Agitated' ? '#8a6a3a' : '#8a2a2a';
      html += `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.08);"><span style="font-weight:600;">${c.name}</span><span style="color:${moodColor};">${mood}</span></div>`;
    });
    html += `</div></div>`;
  }

  // Material Rack (only during design phase)
  const showMaterials = screenKey === 'pr-design' || screenKey === 'pr-runway';
  if (showMaterials) {
    html += `<div class="mag-page">`;
    html += `<div class="mag-page-header">Material Rack</div>`;
    html += `<div class="mag-page-sub">Gathered resources</div>`;
    html += `<div style="font-family:var(--sans);font-size:11px;color:var(--ink);">`;
    // Show materials for first tribe as sample
    const firstTribe = pr.tribes?.[0];
    if (firstTribe?.materials) {
      // Aggregate by name
      const matMap = {};
      firstTribe.materials.forEach(m => {
        if (!matMap[m.name]) matMap[m.name] = { ...m, count: 0 };
        matMap[m.name].count++;
        if (m.quality === 'excellent') matMap[m.name].quality = 'Excellent';
        else if (m.quality === 'decent' && matMap[m.name].quality !== 'Excellent') matMap[m.name].quality = 'Decent';
        else if (!matMap[m.name].quality) matMap[m.name].quality = 'Poor';
      });
      Object.values(matMap).slice(0, 6).forEach(m => {
        const qColor = m.quality === 'Excellent' ? '#8a6a3a' : m.quality === 'Decent' ? '#5a7a5a' : '#7a7a7a';
        html += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;">`;
        html += `<span style="width:8px;height:8px;border-radius:50%;background:${m.color};display:inline-block;"></span>`;
        html += `<span>${m.name} &times; ${m.count}</span>`;
        html += `<span style="margin-left:auto;color:${qColor};font-weight:600;">${m.quality}</span>`;
        html += `</div>`;
      });
    }
    html += `</div></div>`;
  }

  return html;
}

function _buildSidebar(ep, screenKey) {
  window._prEpRecord = ep;
  const content = _buildSidebarContent(ep, screenKey);
  return `<div class="sidebar-col" id="pr-sidebar-inner">${content}</div>`;
}

// ── AMBIENT PARTICLES ──
function _buildAmbient() {
  return `<div class="ambient"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
}

// ── TOP BAR ──
function _buildTopBar(ep) {
  const pr = ep.projectRunaway;
  const epNum = gs.episodeHistory?.length || (window.vpEpNum || '?');
  return `<div class="top-bar">
    <div class="masthead">
      <span class="masthead-logo">Soluna Couture</span>
      <span class="masthead-issue">Issue No. ${epNum} &bull; Challenge Special</span>
    </div>
    <div class="ticker-wrap">
      <div class="ticker">
        <span>&diams;</span> CREATURE HUNT underway on the north ridge <span>&diams;</span> Host describes today's challenge as "my magnum opus" <span>&diams;</span> FABRIC SUPPLIES running low in the east clearing <span>&diams;</span> Creature cooperation levels: VARIABLE <span>&diams;</span> Runway preparations intensifying <span>&diams;</span>
      </div>
    </div>
    <div class="live-badge">LIVE</div>
  </div>`;
}

// ── SHELL WRAPPER ──
function _prShell(content, ep, phaseCls) {
  const sidebar = _buildSidebar(ep, phaseCls);

  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Bungee+Inline&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Montserrat:wght@200;400;600;800&family=Inter:wght@400;600;700&display=swap');

:root {
  --noir: #0a0612;
  --deep: #1a0a1f;
  --stage: #3a0f33;
  --panel: rgba(16, 8, 24, 0.94);
  --card: rgba(28, 14, 42, 0.85);
  --border: rgba(244, 200, 100, 0.18);
  --border-hot: rgba(244, 200, 100, 0.45);
  --gold: #f4c842;
  --gold-bright: #ffd966;
  --rose: #e91e7a;
  --rose-soft: rgba(233, 30, 122, 0.12);
  --blush: #ffd5e1;
  --champagne: #faf3e8;
  --cream: #fbf6e7;
  --ink: #1a1018;
  --runway: #e8d3a6;
  --spotlight: rgba(255, 232, 163, 0.18);
  --muted: #9a7a8e;
  --text: #f0e8e0;
  --drape: #7a1a4a;
  --heading: 'Playfair Display', Georgia, serif;
  --editorial: 'Cormorant Garamond', 'Times New Roman', serif;
  --sans: 'Montserrat', -apple-system, sans-serif;
  --body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ─── AMBIENT PARTICLES ─── */
@keyframes float-up { 0% { transform: translateY(100vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 0.6; } 100% { transform: translateY(-20px) rotate(360deg); opacity: 0; } }
.ambient { position: fixed; top:46px; left:0; right:0; bottom:0; pointer-events: none; overflow: hidden; z-index: 0; }
.ambient i { position: absolute; display: block; animation: float-up linear infinite; opacity: 0; }
.ambient i:nth-child(1) { left: 5%; width: 3px; height: 3px; background: var(--gold); border-radius: 50%; animation-duration: 18s; animation-delay: 0s; }
.ambient i:nth-child(2) { left: 15%; width: 2px; height: 8px; background: var(--rose); animation-duration: 22s; animation-delay: 3s; }
.ambient i:nth-child(3) { left: 30%; width: 4px; height: 4px; background: var(--gold-bright); border-radius: 50%; animation-duration: 16s; animation-delay: 1s; }
.ambient i:nth-child(4) { left: 45%; width: 2px; height: 6px; background: var(--blush); animation-duration: 20s; animation-delay: 5s; }
.ambient i:nth-child(5) { left: 60%; width: 3px; height: 3px; background: var(--gold); border-radius: 50%; animation-duration: 24s; animation-delay: 2s; }
.ambient i:nth-child(6) { left: 75%; width: 2px; height: 10px; background: var(--rose); opacity: 0.6; animation-duration: 19s; animation-delay: 4s; }
.ambient i:nth-child(7) { left: 88%; width: 3px; height: 3px; background: var(--gold-bright); border-radius: 50%; animation-duration: 21s; animation-delay: 6s; }
.ambient i:nth-child(8) { left: 50%; width: 1px; height: 12px; background: var(--blush); animation-duration: 25s; animation-delay: 8s; }

/* ─── TOP BAR (Magazine Header) ─── */
.top-bar { position: fixed; top: 46px; left: 0; right: 0; height: 28px; background: rgba(10,6,18,0.97); display: flex; align-items: center; z-index: 1000; border-bottom: 1px solid var(--border); }
.masthead { display: flex; align-items: center; gap: 8px; padding: 0 14px; }
.masthead-logo { font-family: var(--heading); font-size: 14px; font-weight: 900; color: var(--gold); letter-spacing: 3px; text-transform: uppercase; }
.masthead-issue { font-family: var(--sans); font-size: 10px; font-weight: 200; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; }
.ticker-wrap { flex: 1; overflow: hidden; margin: 0 12px; }
.ticker { display: inline-block; white-space: nowrap; animation: ticker-scroll 50s linear infinite; font-family: var(--editorial); font-size: 12px; font-style: italic; color: var(--muted); }
.ticker span { color: var(--gold); margin: 0 8px; font-style: normal; }
@keyframes ticker-scroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
.live-badge { font-family: var(--sans); font-size: 10px; font-weight: 800; letter-spacing: 2px; color: var(--rose); padding: 0 14px; animation: pulse-live 2s infinite; }
@keyframes pulse-live { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ─── LAYOUT ─── */
.viewport { margin-top: 74px; display: grid; grid-template-columns: 1fr 280px; max-width: 1100px; margin-left: auto; margin-right: auto; padding: 24px 16px 100px; gap: 24px; }
.main-col { min-width: 0; }
@media(max-width:860px) { .viewport { grid-template-columns: 1fr; } .sidebar-col { position: static; } }

/* ─── SIDEBAR: MAGAZINE PAGES ─── */
.sidebar-col { position: sticky; top: 80px; align-self: start; display: flex; flex-direction: column; gap: 14px; }
.mag-page { background: linear-gradient(135deg, #f8f2e8, #f0e8df); border-radius: 3px; padding: 14px 12px; position: relative; overflow: hidden; box-shadow: 2px 4px 20px rgba(0,0,0,0.5), inset 0 0 30px rgba(122,26,74,0.03); border: 1px solid rgba(244,200,66,0.2); }
.mag-page::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--drape), var(--rose), var(--drape)); }
.mag-page::after { content: ''; position: absolute; top: 0; right: 0; width: 20px; height: 100%; background: linear-gradient(90deg, transparent, rgba(122,26,74,0.04)); pointer-events: none; }
.mag-page-header { font-family: var(--heading); font-size: 13px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: var(--drape); margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(122,26,74,0.15); }
.mag-page-sub { font-family: var(--editorial); font-size: 12px; font-style: italic; color: #7a5a6a; margin-bottom: 8px; }
.mag-spread { display: flex; flex-direction: column; gap: 6px; }
.mag-cover-shot { position: relative; width: 100%; aspect-ratio: 4/3; background: linear-gradient(180deg, #2a0f2a, #1a0a1f); border-radius: 3px; overflow: hidden; border: 2px solid var(--gold); box-shadow: 0 4px 20px rgba(244,200,66,0.15); }
.mag-cover-shot img { width: 100%; height: 100%; object-fit: contain; filter: contrast(1.1) saturate(1.05); }
.mag-cover-shot .mag-role-banner { position: absolute; top: 6px; left: 6px; font-family: var(--sans); font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: var(--ink); background: var(--gold); padding: 2px 8px; border-radius: 1px; }
.mag-cover-shot .mag-player-role { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(26,10,31,0.95)); padding: 24px 8px 8px; text-align: center; }
.mag-cover-shot .mag-player-name { font-family: var(--heading); font-size: 16px; font-weight: 700; color: #fff; letter-spacing: 1px; }
.mag-cover-shot .mag-player-tag { font-family: var(--editorial); font-size: 13px; font-style: italic; color: var(--gold-bright); }
.mag-mid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.mag-mid-card { position: relative; aspect-ratio: 3/4; background: linear-gradient(180deg, #2a0f2a, #1a0a1f); border-radius: 2px; overflow: hidden; border: 1px solid rgba(244,200,66,0.3); transition: transform 0.3s, box-shadow 0.3s; }
.mag-mid-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(233,30,122,0.2); }
.mag-mid-card img { width: 100%; height: 100%; object-fit: contain; }
.mag-mid-card .mag-player-role { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(26,10,31,0.92)); padding: 16px 4px 5px; text-align: center; }
.mag-mid-card .mag-player-name { font-family: var(--sans); font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #fff; text-transform: uppercase; }
.mag-mid-card .mag-player-tag { font-family: var(--editorial); font-size: 10px; font-style: italic; color: var(--gold-bright); }
.mag-headshot-row { display: flex; gap: 5px; }
.mag-headshot { position: relative; flex: 1; aspect-ratio: 1; background: linear-gradient(180deg, #2a0f2a, #1a0a1f); border-radius: 2px; overflow: hidden; border: 1px solid rgba(244,200,66,0.15); }
.mag-headshot img { width: 100%; height: 100%; object-fit: contain; }
.mag-headshot .mag-hs-name { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(26,10,31,0.85); text-align: center; padding: 2px; font-family: var(--sans); font-size: 9px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-transform: uppercase; }
.mag-score { background: linear-gradient(135deg, #1a0a1f, #2a0f2a); border-radius: 2px; padding: 10px 12px; border: 1px solid var(--border); }
.mag-score-title { font-family: var(--heading); font-size: 12px; letter-spacing: 2px; color: var(--gold); text-transform: uppercase; margin-bottom: 8px; }
.score-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(244,200,66,0.08); }
.score-row:last-child { border-bottom: none; }
.score-tribe { font-family: var(--sans); font-size: 12px; font-weight: 600; color: var(--text); }
.score-val { font-family: var(--heading); font-size: 16px; color: var(--gold-bright); }
.score-bar { height: 3px; background: rgba(244,200,66,0.12); border-radius: 2px; margin-top: 3px; }
.score-bar-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--rose), var(--gold)); transition: width 0.6s ease; }

/* ─── PHASE HEADER ─── */
.phase-hdr { text-align: center; margin-bottom: 28px; padding: 32px 20px 24px; position: relative; }
.phase-hdr::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(212,175,125,0.06) 0%, transparent 70%); }
.phase-num { font-family: var(--sans); font-size: 11px; font-weight: 800; letter-spacing: 4px; color: var(--gold); text-transform: uppercase; margin-bottom: 4px; display: block; }
.phase-title { font-family: var(--heading); font-size: 48px; font-weight: 900; color: var(--champagne); letter-spacing: 2px; line-height: 1.1; }
.phase-title em { font-style: italic; color: var(--rose); }
.phase-sub { font-family: var(--editorial); font-size: 17px; font-style: italic; font-weight: 300; color: var(--muted); margin-top: 8px; letter-spacing: 1px; }
.phase-rule { width: 60px; height: 1px; background: var(--gold); margin: 16px auto 0; }

/* ─── HOST QUOTE ─── */
.host-quote { background: linear-gradient(135deg, rgba(212,175,125,0.06), transparent); border-left: 3px solid var(--gold); border-radius: 0 6px 6px 0; padding: 14px 20px; margin-bottom: 24px; font-family: var(--editorial); font-size: 16px; font-style: italic; color: var(--text); line-height: 1.6; }
.host-quote .host-name { font-family: var(--sans); font-size: 10px; font-weight: 800; font-style: normal; letter-spacing: 2px; color: var(--gold); text-transform: uppercase; display: block; margin-bottom: 4px; }

/* ─── BEAT HEADER ─── */
.beat-hdr { font-family: var(--sans); font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); padding: 12px 0 8px; margin-top: 20px; display: flex; align-items: center; gap: 10px; }
.beat-hdr::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--border), transparent); }

/* ─── EVENT CARDS ─── */
.evt-card { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 14px 18px; margin-bottom: 10px; position: relative; transition: all 0.3s; opacity: 0; transform: translateY(8px); }
.evt-card.pr-visible { opacity: 1; transform: translateY(0); }
.evt-card:hover { border-color: var(--border-hot); box-shadow: 0 4px 20px rgba(212,175,125,0.08); }
.evt-card-hdr { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.evt-avatar { width: 32px; height: 32px; border-radius: 2px; object-fit: contain; border: 1px solid var(--border); flex-shrink: 0; }
.evt-name { font-family: var(--heading); font-size: 18px; color: var(--champagne); flex: 1; }
.evt-badge { font-family: var(--sans); font-size: 10px; font-weight: 800; letter-spacing: 1.5px; padding: 3px 8px; border-radius: 2px; text-transform: uppercase; white-space: nowrap; }
.badge-gold { background: rgba(212,175,125,0.15); color: var(--gold-bright); border: 1px solid rgba(212,175,125,0.3); }
.badge-rose { background: var(--rose-soft); color: var(--rose); border: 1px solid rgba(232,72,106,0.3); }
.badge-blue { background: rgba(100,160,220,0.12); color: #8ac4f0; border: 1px solid rgba(100,160,220,0.25); }
.evt-text { font-family: var(--editorial); font-size: 16px; line-height: 1.6; color: var(--text); padding-left: 42px; }

/* ─── FABRIC SWATCH CARDS ─── */
.fabric-card { position: relative; overflow: hidden; }
.fabric-card::before { content: ''; position: absolute; inset: 0; opacity: 0.04; pointer-events: none; }
.fabric-linen::before { background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 3px); }
.fabric-silk::before { background: linear-gradient(135deg, rgba(255,255,255,0.02) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.02) 75%, transparent 75%); background-size: 8px 8px; }
.fabric-denim::before { background: repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(100,130,180,0.1) 1px, rgba(100,130,180,0.1) 2px); }

/* ─── RUNWAY SECTION ─── */
.runway-stage { background: linear-gradient(180deg, var(--deep) 0%, rgba(26,15,30,0.95) 100%); border-radius: 8px; padding: 32px 20px; margin-bottom: 20px; position: relative; overflow: hidden; }
.runway-stage::before { content: ''; position: absolute; top: -20%; left: 30%; width: 40%; height: 60%; background: radial-gradient(ellipse, rgba(255,215,140,0.1) 0%, transparent 70%); pointer-events: none; }
.runway-stage::after { content: ''; position: absolute; bottom: 0; left: 10%; right: 10%; height: 4px; background: linear-gradient(90deg, transparent, var(--gold), transparent); border-radius: 2px; }
.runway-walk { text-align: center; padding: 20px; }
.runway-model-img { width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--gold); object-fit: contain; margin-bottom: 12px; box-shadow: 0 0 30px rgba(212,175,125,0.3); animation: glow-pulse 3s ease-in-out infinite; }
@keyframes glow-pulse { 0%,100% { box-shadow: 0 0 20px rgba(212,175,125,0.2); } 50% { box-shadow: 0 0 40px rgba(212,175,125,0.5); } }
.runway-model-name { font-family: var(--heading); font-size: 24px; color: var(--champagne); margin-bottom: 4px; }
.runway-tribe { font-family: var(--sans); font-size: 11px; font-weight: 600; letter-spacing: 2px; color: var(--gold); text-transform: uppercase; }

/* ─── SCORING BREAKDOWN ─── */
.score-breakdown { background: var(--panel); border: 1px solid var(--border); border-radius: 6px; padding: 20px; margin-bottom: 16px; }
.score-breakdown-title { font-family: var(--heading); font-size: 18px; color: var(--champagne); margin-bottom: 16px; text-align: center; letter-spacing: 1px; }
.score-criterion { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(212,175,125,0.08); }
.score-criterion:last-child { border-bottom: none; }
.score-criterion-label { font-family: var(--sans); font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); width: 140px; flex-shrink: 0; }
.score-criterion-bar { flex: 1; height: 6px; background: rgba(212,175,125,0.1); border-radius: 3px; overflow: hidden; }
.score-criterion-fill { height: 100%; border-radius: 3px; transition: width 0.8s ease; }
.fill-gold { background: linear-gradient(90deg, var(--gold), var(--gold-bright)); }
.fill-rose { background: linear-gradient(90deg, var(--rose), #ff8aa5); }
.score-criterion-val { font-family: var(--heading); font-size: 18px; color: var(--champagne); width: 32px; text-align: right; }

/* ─── CREATURE CARD ─── */
.creature-card { background: linear-gradient(135deg, rgba(28,18,38,0.9), rgba(40,25,50,0.9)); border: 1px solid var(--border); border-radius: 8px; padding: 18px; margin-bottom: 16px; display: flex; gap: 16px; align-items: center; }
.creature-icon { width: 64px; height: 64px; border-radius: 50%; background: var(--deep); border: 2px solid var(--gold); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.creature-icon svg { width: 36px; height: 36px; }
.creature-info { flex: 1; }
.creature-name { font-family: var(--heading); font-size: 18px; color: var(--champagne); margin-bottom: 4px; }
.creature-stats { display: flex; gap: 12px; }
.creature-stat { font-family: var(--sans); font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
.creature-stat .stat-val { color: var(--gold-bright); margin-left: 4px; }

/* ─── WINNER CARD ─── */
.winner-card { background: linear-gradient(135deg, rgba(212,175,125,0.08), rgba(232,72,106,0.05)); border: 2px solid var(--gold); border-radius: 8px; padding: 28px; text-align: center; position: relative; overflow: hidden; animation: winner-glow 2s ease-in-out infinite; }
@keyframes winner-glow { 0%,100% { box-shadow: 0 0 20px rgba(212,175,125,0.15); } 50% { box-shadow: 0 0 50px rgba(212,175,125,0.3); } }
.winner-card::before { content: 'IMMUNITY'; position: absolute; top: 8px; left: 50%; transform: translateX(-50%); font-family: var(--sans); font-size: 10px; font-weight: 800; letter-spacing: 4px; color: var(--gold); }
.winner-tribe { font-family: var(--heading); font-size: 36px; color: var(--champagne); margin-top: 12px; }
.winner-sub { font-family: var(--editorial); font-size: 16px; font-style: italic; color: var(--muted); margin-top: 6px; }
.loser-card { background: linear-gradient(135deg, rgba(232,72,106,0.08), rgba(28,14,42,0.85)); border: 2px solid var(--rose); border-radius: 8px; padding: 24px; text-align: center; margin-top: 16px; }
.loser-tribe { font-family: var(--heading); font-size: 28px; color: var(--rose); margin-bottom: 4px; }
.loser-sub { font-family: var(--editorial); font-size: 15px; font-style: italic; color: var(--muted); }

/* ─── FLAVOR TEXT ─── */
.flavor { font-family: var(--editorial); font-size: 14px; font-style: italic; color: rgba(232,221,212,0.35); padding: 6px 14px; margin: 8px 0; border-left: 1px solid rgba(212,175,125,0.12); }

/* ─── SOCIAL EVENT CARD ─── */
.social-card { border-left: 3px dashed var(--rose); background: rgba(232,72,106,0.04); }
.social-card .evt-badge { background: var(--rose-soft); color: var(--rose); }

/* ─── CONTROLS ─── */
.controls { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(12,8,16,0.97); border-top: 1px solid var(--border); padding: 10px 20px; display: flex; align-items: center; justify-content: center; gap: 12px; z-index: 1000; backdrop-filter: blur(8px); }
.ctrl-btn { font-family: var(--sans); font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 8px 20px; border-radius: 3px; border: 1px solid var(--border); background: transparent; color: var(--text); cursor: pointer; transition: all 0.3s; }
.ctrl-btn:hover { background: rgba(212,175,125,0.1); border-color: var(--gold); color: var(--champagne); }
.ctrl-btn.primary { background: var(--gold); color: var(--ink); border-color: var(--gold); }
.ctrl-btn.primary:hover { background: var(--gold-bright); }
.ctrl-counter { font-family: var(--heading); font-size: 16px; color: var(--muted); min-width: 60px; text-align: center; }

/* ─── COLD OPEN ANIMATIONS ─── */
@keyframes co-spot-sway-l { 0%,100% { transform: rotate(-8deg); opacity: 0.15; } 50% { transform: rotate(4deg); opacity: 0.25; } }
@keyframes co-spot-sway-r { 0%,100% { transform: rotate(8deg); opacity: 0.12; } 50% { transform: rotate(-4deg); opacity: 0.22; } }
@keyframes co-flash-burst { 0% { opacity: 0; } 2% { opacity: 0.9; } 6% { opacity: 0; } 100% { opacity: 0; } }
@keyframes co-runway-lights { 0% { background-position: 0% 0%; } 100% { background-position: 200% 0%; } }
@keyframes co-title-entrance { 0% { opacity: 0; transform: translateX(-50%) scale(0.8); } 60% { opacity: 1; transform: translateX(-50%) scale(1.05); } 100% { transform: translateX(-50%) scale(1); } }
@keyframes co-walk-runway { 0% { top: 30%; transform: translateX(-50%) scale(0.5); opacity: 0; } 8% { opacity: 1; } 90% { opacity: 1; } 100% { top: 78%; transform: translateX(-50%) scale(1.15); opacity: 0; } }
@keyframes co-drape-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes co-crowd-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes spotlight-sweep { 0% { left: -20%; } 100% { left: 120%; } }

.cold-open { position: relative; border-radius: 6px; overflow: hidden; margin-bottom: 28px; aspect-ratio: 3/2; background: linear-gradient(180deg, var(--deep), var(--stage)); }
.cold-open .co-drape { position: absolute; top: 0; left: 0; right: 0; height: 36px; background: var(--drape); z-index: 3; }
.cold-open .co-drape::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, var(--gold), transparent, var(--gold), transparent, var(--gold)); background-size: 200% 100%; animation: co-drape-shimmer 4s linear infinite; }
.cold-open .co-spotlight-l { position: absolute; top: -20px; left: 20%; width: 160px; height: 400px; background: linear-gradient(180deg, rgba(255,232,163,0.3) 0%, rgba(255,232,163,0) 100%); clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%); transform-origin: top center; animation: co-spot-sway-l 5s ease-in-out infinite; z-index: 1; pointer-events: none; }
.cold-open .co-spotlight-r { position: absolute; top: -20px; right: 20%; width: 160px; height: 400px; background: linear-gradient(180deg, rgba(255,77,141,0.25) 0%, rgba(255,77,141,0) 100%); clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%); transform-origin: top center; animation: co-spot-sway-r 6s ease-in-out infinite; z-index: 1; pointer-events: none; }
.cold-open .co-runway { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 90%; height: 55%; clip-path: polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%); background: linear-gradient(180deg, var(--runway), var(--cream)); z-index: 2; }
.cold-open .co-runway-edge-l { position: absolute; bottom: 0; left: 50%; width: 90%; height: 55%; clip-path: polygon(35% 0%, 36% 0%, 2% 100%, 0% 100%); background: repeating-linear-gradient(180deg, var(--gold) 0px, var(--gold) 12px, transparent 12px, transparent 24px); background-size: 100% 200%; animation: co-runway-lights 2s linear infinite; z-index: 2; transform: translateX(-50%); }
.cold-open .co-runway-edge-r { position: absolute; bottom: 0; left: 50%; width: 90%; height: 55%; clip-path: polygon(64% 0%, 65% 0%, 100% 100%, 98% 100%); background: repeating-linear-gradient(180deg, var(--gold) 0px, var(--gold) 12px, transparent 12px, transparent 24px); background-size: 100% 200%; animation: co-runway-lights 2s linear infinite; animation-delay: 0.5s; z-index: 2; transform: translateX(-50%); }
.cold-open .co-runway-mark { position: absolute; top: 22%; left: 50%; transform: translateX(-50%); width: 80px; height: 18px; border-radius: 50%; background: var(--gold); opacity: 0.7; z-index: 3; box-shadow: 0 0 20px rgba(244,200,66,0.5); }
.cold-open .co-flash { position: absolute; width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,240,0.5) 35%, transparent 70%); opacity: 0; z-index: 6; pointer-events: none; }
.cold-open .co-flash:nth-of-type(1) { top: 58%; left: 5%; animation: co-flash-burst 2.8s ease-out 0.3s infinite; }
.cold-open .co-flash:nth-of-type(2) { top: 44%; right: 4%; left: auto; animation: co-flash-burst 3.5s ease-out 1.5s infinite; }
.cold-open .co-flash:nth-of-type(3) { top: 65%; left: 18%; animation: co-flash-burst 4.0s ease-out 2.7s infinite; }
.cold-open .co-flash:nth-of-type(4) { top: 50%; right: 14%; left: auto; animation: co-flash-burst 3.1s ease-out 0.8s infinite; }
.cold-open .co-flash:nth-of-type(5) { top: 70%; left: 60%; animation: co-flash-burst 3.8s ease-out 3.2s infinite; }
.cold-open .co-flash:nth-of-type(6) { top: 52%; left: 2%; animation: co-flash-burst 4.3s ease-out 1.1s infinite; }
.cold-open .co-flash:nth-of-type(7) { top: 62%; right: 8%; left: auto; animation: co-flash-burst 2.6s ease-out 2.0s infinite; }
.cold-open .co-crowd { position: absolute; bottom: 0; z-index: 5; pointer-events: none; }
.cold-open .co-crowd-left { left: 0; width: 100%; height: 100%; }
.cold-open .co-crowd-right { right: 0; width: 100%; height: 100%; }
.cold-open .co-crowd-fig { position: absolute; }
.cold-open .co-crowd-fig .cf-body { border-radius: 40% 40% 0 0; background: rgba(22,8,32,0.9); position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); }
.cold-open .co-crowd-fig .cf-head { border-radius: 50%; position: absolute; left: 50%; transform: translateX(-50%); }
.cold-open .co-crowd-fig:nth-child(odd) .cf-body { background: rgba(30,12,40,0.88); }
.cold-open .co-crowd-fig:nth-child(even) .cf-body { background: rgba(18,6,28,0.92); }
.cold-open .co-crowd-fig:nth-child(3n) .cf-head { background: #3a2040; }
.cold-open .co-crowd-fig:nth-child(3n+1) .cf-head { background: #2a1535; }
.cold-open .co-crowd-fig:nth-child(3n+2) .cf-head { background: #4a2050; }
/* Left crowd positions */
.co-crowd-left .co-crowd-fig:nth-child(1) { bottom:2%;left:2%;animation:co-crowd-bob 3.2s ease-in-out 0s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(1) .cf-body { width:30px;height:32px; }
.co-crowd-left .co-crowd-fig:nth-child(1) .cf-head { width:18px;height:18px;bottom:28px; }
.co-crowd-left .co-crowd-fig:nth-child(2) { bottom:8%;left:5%;animation:co-crowd-bob 2.8s ease-in-out .3s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(2) .cf-body { width:28px;height:30px; }
.co-crowd-left .co-crowd-fig:nth-child(2) .cf-head { width:16px;height:16px;bottom:26px; }
.co-crowd-left .co-crowd-fig:nth-child(3) { bottom:14%;left:6%;animation:co-crowd-bob 3.5s ease-in-out .6s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(3) .cf-body { width:26px;height:28px; }
.co-crowd-left .co-crowd-fig:nth-child(3) .cf-head { width:15px;height:15px;bottom:24px; }
.co-crowd-left .co-crowd-fig:nth-child(4) { bottom:20%;left:8%;animation:co-crowd-bob 2.9s ease-in-out .9s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(4) .cf-body { width:24px;height:26px; }
.co-crowd-left .co-crowd-fig:nth-child(4) .cf-head { width:14px;height:14px;bottom:22px; }
.co-crowd-left .co-crowd-fig:nth-child(5) { bottom:25%;left:11%;animation:co-crowd-bob 3.1s ease-in-out 1.2s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(5) .cf-body { width:22px;height:24px; }
.co-crowd-left .co-crowd-fig:nth-child(5) .cf-head { width:13px;height:13px;bottom:20px; }
.co-crowd-left .co-crowd-fig:nth-child(6) { bottom:30%;left:14%;animation:co-crowd-bob 3.4s ease-in-out .2s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(6) .cf-body { width:20px;height:22px; }
.co-crowd-left .co-crowd-fig:nth-child(6) .cf-head { width:12px;height:12px;bottom:18px; }
.co-crowd-left .co-crowd-fig:nth-child(7) { bottom:35%;left:17%;animation:co-crowd-bob 2.7s ease-in-out .5s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(7) .cf-body { width:18px;height:20px; }
.co-crowd-left .co-crowd-fig:nth-child(7) .cf-head { width:11px;height:11px;bottom:16px; }
.co-crowd-left .co-crowd-fig:nth-child(8) { bottom:39%;left:20%;animation:co-crowd-bob 3.0s ease-in-out .8s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(8) .cf-body { width:16px;height:18px; }
.co-crowd-left .co-crowd-fig:nth-child(8) .cf-head { width:10px;height:10px;bottom:14px; }
.co-crowd-left .co-crowd-fig:nth-child(9) { bottom:4%;left:-2%;animation:co-crowd-bob 3.3s ease-in-out 1s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(9) .cf-body { width:28px;height:28px; }
.co-crowd-left .co-crowd-fig:nth-child(9) .cf-head { width:16px;height:16px;bottom:24px; }
.co-crowd-left .co-crowd-fig:nth-child(10) { bottom:12%;left:0%;animation:co-crowd-bob 2.6s ease-in-out 1.3s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(10) .cf-body { width:26px;height:26px; }
.co-crowd-left .co-crowd-fig:nth-child(10) .cf-head { width:15px;height:15px;bottom:22px; }
.co-crowd-left .co-crowd-fig:nth-child(11) { bottom:22%;left:2%;animation:co-crowd-bob 3.6s ease-in-out .4s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(11) .cf-body { width:22px;height:24px; }
.co-crowd-left .co-crowd-fig:nth-child(11) .cf-head { width:13px;height:13px;bottom:20px; }
.co-crowd-left .co-crowd-fig:nth-child(12) { bottom:32%;left:8%;animation:co-crowd-bob 2.9s ease-in-out 1.5s infinite; }
.co-crowd-left .co-crowd-fig:nth-child(12) .cf-body { width:18px;height:20px; }
.co-crowd-left .co-crowd-fig:nth-child(12) .cf-head { width:11px;height:11px;bottom:16px; }
/* Right crowd positions */
.co-crowd-right .co-crowd-fig:nth-child(1) { bottom:2%;right:2%;animation:co-crowd-bob 3.0s ease-in-out .1s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(1) .cf-body { width:30px;height:32px; }
.co-crowd-right .co-crowd-fig:nth-child(1) .cf-head { width:18px;height:18px;bottom:28px; }
.co-crowd-right .co-crowd-fig:nth-child(2) { bottom:8%;right:5%;animation:co-crowd-bob 3.3s ease-in-out .4s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(2) .cf-body { width:28px;height:30px; }
.co-crowd-right .co-crowd-fig:nth-child(2) .cf-head { width:16px;height:16px;bottom:26px; }
.co-crowd-right .co-crowd-fig:nth-child(3) { bottom:14%;right:6%;animation:co-crowd-bob 2.8s ease-in-out .7s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(3) .cf-body { width:26px;height:28px; }
.co-crowd-right .co-crowd-fig:nth-child(3) .cf-head { width:15px;height:15px;bottom:24px; }
.co-crowd-right .co-crowd-fig:nth-child(4) { bottom:20%;right:8%;animation:co-crowd-bob 3.4s ease-in-out 1s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(4) .cf-body { width:24px;height:26px; }
.co-crowd-right .co-crowd-fig:nth-child(4) .cf-head { width:14px;height:14px;bottom:22px; }
.co-crowd-right .co-crowd-fig:nth-child(5) { bottom:25%;right:11%;animation:co-crowd-bob 2.7s ease-in-out 1.3s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(5) .cf-body { width:22px;height:24px; }
.co-crowd-right .co-crowd-fig:nth-child(5) .cf-head { width:13px;height:13px;bottom:20px; }
.co-crowd-right .co-crowd-fig:nth-child(6) { bottom:30%;right:14%;animation:co-crowd-bob 3.1s ease-in-out .3s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(6) .cf-body { width:20px;height:22px; }
.co-crowd-right .co-crowd-fig:nth-child(6) .cf-head { width:12px;height:12px;bottom:18px; }
.co-crowd-right .co-crowd-fig:nth-child(7) { bottom:35%;right:17%;animation:co-crowd-bob 3.5s ease-in-out .6s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(7) .cf-body { width:18px;height:20px; }
.co-crowd-right .co-crowd-fig:nth-child(7) .cf-head { width:11px;height:11px;bottom:16px; }
.co-crowd-right .co-crowd-fig:nth-child(8) { bottom:39%;right:20%;animation:co-crowd-bob 2.9s ease-in-out .9s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(8) .cf-body { width:16px;height:18px; }
.co-crowd-right .co-crowd-fig:nth-child(8) .cf-head { width:10px;height:10px;bottom:14px; }
.co-crowd-right .co-crowd-fig:nth-child(9) { bottom:4%;right:-2%;animation:co-crowd-bob 3.2s ease-in-out 1.1s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(9) .cf-body { width:28px;height:28px; }
.co-crowd-right .co-crowd-fig:nth-child(9) .cf-head { width:16px;height:16px;bottom:24px; }
.co-crowd-right .co-crowd-fig:nth-child(10) { bottom:12%;right:0%;animation:co-crowd-bob 2.8s ease-in-out 1.4s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(10) .cf-body { width:26px;height:26px; }
.co-crowd-right .co-crowd-fig:nth-child(10) .cf-head { width:15px;height:15px;bottom:22px; }
.co-crowd-right .co-crowd-fig:nth-child(11) { bottom:22%;right:2%;animation:co-crowd-bob 3.3s ease-in-out .5s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(11) .cf-body { width:22px;height:24px; }
.co-crowd-right .co-crowd-fig:nth-child(11) .cf-head { width:13px;height:13px;bottom:20px; }
.co-crowd-right .co-crowd-fig:nth-child(12) { bottom:32%;right:8%;animation:co-crowd-bob 3.0s ease-in-out 1.6s infinite; }
.co-crowd-right .co-crowd-fig:nth-child(12) .cf-body { width:18px;height:20px; }
.co-crowd-right .co-crowd-fig:nth-child(12) .cf-head { width:11px;height:11px;bottom:16px; }
.cold-open .co-title { position: absolute; top: 50px; left: 50%; transform: translateX(-50%); text-align: center; z-index: 5; animation: co-title-entrance 1.2s ease-out both; }
.cold-open .co-title h1 { font-family: 'Bungee Inline', Impact, var(--heading); font-size: 64px; font-weight: 900; line-height: 1.0; background: linear-gradient(180deg, var(--blush), var(--rose), #7a0a3a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-shadow: none; letter-spacing: 2px; }
.cold-open .co-title .co-sub { font-family: var(--editorial); font-size: 15px; font-style: italic; color: var(--champagne); margin-top: 6px; letter-spacing: 2px; opacity: 0.8; }
.cold-open .co-title .co-season { font-family: var(--sans); font-size: 9px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); margin-top: 10px; }
.cold-open .co-model-avi { position: absolute; left: 50%; width: 42px; height: 42px; border-radius: 50%; border: 3px solid var(--gold); object-fit: contain; background: var(--deep); z-index: 4; opacity: 0; box-shadow: 0 4px 16px rgba(244,200,66,0.35); }
.cold-open .co-model-avi:nth-of-type(1) { animation: co-walk-runway 10s ease-in-out 0s infinite; }
.cold-open .co-model-avi:nth-of-type(2) { animation: co-walk-runway 10s ease-in-out 2.5s infinite; border-color: var(--rose); box-shadow: 0 4px 16px rgba(233,30,122,0.35); }
.cold-open .co-model-avi:nth-of-type(3) { animation: co-walk-runway 10s ease-in-out 5s infinite; }
.cold-open .co-model-avi:nth-of-type(4) { animation: co-walk-runway 10s ease-in-out 7.5s infinite; border-color: var(--rose); box-shadow: 0 4px 16px rgba(233,30,122,0.35); }
.cold-open .co-model-avi:nth-of-type(5) { animation: co-walk-runway 10s ease-in-out 10s infinite; }
.cold-open .co-model-avi:nth-of-type(6) { animation: co-walk-runway 10s ease-in-out 12.5s infinite; border-color: var(--rose); box-shadow: 0 4px 16px rgba(233,30,122,0.35); }
.cold-open .co-model-avi:nth-of-type(7) { animation: co-walk-runway 10s ease-in-out 15s infinite; }
.cold-open .co-model-avi:nth-of-type(8) { animation: co-walk-runway 10s ease-in-out 17.5s infinite; border-color: var(--rose); box-shadow: 0 4px 16px rgba(233,30,122,0.35); }
.cold-open .co-scissors { position: absolute; top: 60px; right: 12%; z-index: 5; animation: glow-pulse 4s ease-in-out infinite; }
.cold-open .co-scissors svg { width: 40px; height: 40px; opacity: 0.7; }
.spotlight-sweep { position: absolute; top: 0; width: 20%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent); animation: spotlight-sweep 6s linear infinite; pointer-events: none; }

/* ─── THEME CARDS ─── */
.theme-row { display:flex; gap:12px; margin-bottom:24px; }
.theme-card { flex:1; background:var(--card); border:1px solid var(--border); border-radius:4px; padding:14px 16px; }
.theme-label { font-family:var(--sans); font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase; margin-bottom:4px; }
.theme-name { font-family:var(--heading); font-size:20px; color:var(--champagne); }

/* ─── REDUCED MOTION ─── */
@media (prefers-reduced-motion: reduce) {
  .ambient i, .ticker, .spotlight-sweep { animation: none !important; }
  .evt-card { transition: none; }
  .runway-model-img, .winner-card { animation: none !important; }
  .cold-open .co-spotlight-l, .cold-open .co-spotlight-r { animation: none !important; opacity: 0.15 !important; }
  .cold-open .co-flash { animation: none !important; opacity: 0 !important; }
  .cold-open .co-runway-edge-l, .cold-open .co-runway-edge-r { animation: none !important; }
  .cold-open .co-drape::after { animation: none !important; }
  .cold-open .co-title { animation: none !important; opacity: 1 !important; transform: translateX(-50%) !important; }
  .cold-open .co-model-avi { animation: none !important; opacity: 1 !important; top: 55% !important; }
  .cold-open .co-model-avi:nth-of-type(n+4) { display: none; }
  .cold-open .co-crowd-fig { animation: none !important; }
  .cold-open .co-scissors { animation: none !important; }
}
</style>

<div style="position:fixed;top:46px;left:0;right:0;bottom:0;background:var(--noir);background-image:radial-gradient(ellipse at 50% 0%, var(--stage) 0%, var(--noir) 70%);z-index:-1;"></div>
${_buildAmbient()}
${_buildTopBar(ep)}
<div class="viewport">
  <div class="main-col">${content}</div>
  ${sidebar}
</div>`;
}

// ══════════════════════════════════════════════════════════════════════
// VP SCREEN BUILDERS
// ══════════════════════════════════════════════════════════════════════

export function rpBuildPRTitleCard(ep) {
  const pr = ep.projectRunaway;
  if (!pr) return '';

  const allActive = pr.tribes?.flatMap(t => t.members) || [];

  // Build cold open with animated runway
  let content = `<div class="cold-open">`;
  content += `<div class="co-drape"></div>`;
  content += `<div class="co-spotlight-l"></div>`;
  content += `<div class="co-spotlight-r"></div>`;
  // Camera flashes
  for (let i = 0; i < 7; i++) content += `<div class="co-flash"></div>`;
  // Stage elements
  content += `<div class="co-runway"></div>`;
  content += `<div class="co-runway-edge-l"></div>`;
  content += `<div class="co-runway-edge-r"></div>`;
  content += `<div class="co-runway-mark"></div>`;
  // Title
  const epNum = gs.episodeHistory?.length || (window.vpEpNum || '?');
  content += `<div class="co-title">`;
  content += `<h1>PROJECT<br>RUNAWAY</h1>`;
  content += `<div class="co-sub">Catch. Create. Conquer the Runway.</div>`;
  content += `<div class="co-season">Episode ${epNum} &bull; Pre-Merge</div>`;
  content += `</div>`;
  // Walking models (up to 8 active players)
  allActive.slice(0, 8).forEach(name => {
    content += `<img class="co-model-avi" src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none'">`;
  });
  // Crowd
  content += _buildCrowdSide('left');
  content += _buildCrowdSide('right');
  // Scissors accent
  content += `<div class="co-scissors"><svg viewBox="0 0 40 40" fill="none" stroke="var(--gold)" stroke-width="3"><circle cx="14" cy="12" r="8"/><circle cx="14" cy="30" r="8"/><line x1="22" y1="12" x2="38" y2="28" stroke-linecap="round"/><line x1="22" y1="30" x2="38" y2="14" stroke-linecap="round"/></svg></div>`;
  content += `</div>`;

  // Host intro
  content += `<div class="host-quote"><span class="host-name">${host()}</span>${pr.hostIntro}</div>`;

  // Theme assignments
  content += `<div class="theme-row">`;
  pr.tribes.forEach((tribe, i) => {
    const labelColor = i === 0 ? 'var(--gold)' : 'var(--rose)';
    content += `<div class="theme-card">`;
    content += `<div class="theme-label" style="color:${labelColor};">${tribe.name} Theme</div>`;
    content += `<div class="theme-name">${tribe.theme}</div>`;
    content += `</div>`;
  });
  content += `</div>`;

  return _prShell(content, ep, 'pr-title');
}

export function rpBuildPRRoles(ep) {
  const pr = ep.projectRunaway;
  if (!pr) return '';
  const screenKey = 'pr-roles';

  let content = '';
  content += `<div class="phase-hdr"><span class="phase-num">Role Call</span>`;
  content += `<div class="phase-title">The <em>Lineup</em></div>`;
  content += `<div class="phase-sub">Every tribe assigns their model, designer, handlers, and gatherers.</div>`;
  content += `<div class="phase-rule"></div></div>`;

  content += `<div class="host-quote"><span class="host-name">${host()}</span>`;
  content += `"Each tribe needs a model, a designer, two creature handlers, and gatherers. Choose wisely — your roles will make or break you on the runway."</div>`;

  let stepIdx = 0;
  (pr.roleEvents || []).forEach(re => {
    content += `<div class="beat-hdr">${re.tribe} — ${re.theme}</div>`;
    (re.narration || []).forEach(nr => {
      content += `<div class="evt-card" id="pr-step-roles-${stepIdx}">`;
      content += `<div class="evt-card-hdr">`;
      content += _av(nr.player);
      content += `<span class="evt-name">${nr.player}</span>`;
      const badgeCls = nr.badgeClass === 'gold' ? 'badge-gold' : nr.badgeClass === 'rose' ? 'badge-rose' : 'badge-blue';
      content += `<span class="evt-badge ${badgeCls}">${nr.badge}</span>`;
      content += `</div>`;
      content += `<div class="evt-text">${nr.text}</div>`;
      content += `</div>`;
      stepIdx++;
    });
  });

  const total = stepIdx;
  content += _buildControls(screenKey, total);

  return _prShell(content, ep, screenKey);
}

export function rpBuildPRCreatureHunt(ep) {
  const pr = ep.projectRunaway;
  if (!pr) return '';

  const screenKey = 'pr-hunt';
  const events = pr.huntEvents || [];
  const totalCards = events.length;
  _ensureState(screenKey, totalCards);

  let content = `<div class="phase-hdr">`;
  content += `<span class="phase-num">Phase I</span>`;
  content += `<div class="phase-title">Creature <em>Hunt</em></div>`;
  content += `<div class="phase-sub">Scout the island. Catch your model. Choose wisely.</div>`;
  content += `<div class="phase-rule"></div>`;
  content += `</div>`;

  const beatLabels = ['Beat 1 — Scouting', 'Beat 2 — Chase', 'Beat 3 — Capture'];
  let lastBeat = -1;
  const shuffledAtmo = [...ATMOSPHERE_HUNT].sort(() => Math.random() - 0.5);
  let atmoIdx = 0;

  events.forEach((evt, idx) => {
    // Beat header
    if (evt.beat !== undefined && evt.beat !== lastBeat) {
      lastBeat = evt.beat;
      content += `<div class="beat-hdr">${beatLabels[evt.beat] || `Beat ${evt.beat + 1}`}</div>`;
    }
    // Atmosphere flavor
    if (idx > 0 && idx % 4 === 0 && atmoIdx < shuffledAtmo.length) {
      content += `<div class="flavor">${shuffledAtmo[atmoIdx++]}</div>`;
    }
    // Creature reveal card (special)
    if (evt.type === 'creatureReveal') {
      content += `<div id="pr-step-hunt-${idx}">`;
      content += _creatureCard(evt.creature);
      content += `</div>`;
    } else {
      content += _card(evt, idx, screenKey);
    }
  });

  content += _buildControls(screenKey, totalCards);

  return _prShell(content, ep, 'pr-hunt');
}

export function rpBuildPRDesignStudio(ep) {
  const pr = ep.projectRunaway;
  if (!pr) return '';

  const screenKey = 'pr-design';
  const events = pr.designEvents || [];
  const totalCards = events.length;
  _ensureState(screenKey, totalCards);

  let content = `<div class="phase-hdr">`;
  content += `<span class="phase-num">Phase II</span>`;
  content += `<div class="phase-title">Design <em>Studio</em></div>`;
  content += `<div class="phase-sub">Gather. Create. Dress the beast.</div>`;
  content += `<div class="phase-rule"></div>`;
  content += `</div>`;

  let lastBeat = -1;
  const shuffledAtmo = [...ATMOSPHERE_DESIGN].sort(() => Math.random() - 0.5);
  let atmoIdx = 0;

  events.forEach((evt, idx) => {
    // Role assignment (special card)
    if (evt.type === 'roleAssign') {
      const r = evt.roles;
      content += `<div id="pr-step-design-${idx}" class="evt-card">`;
      content += `<div class="evt-card-hdr"><span class="evt-name">${evt.tribe} — Role Assignment</span><span class="evt-badge badge-gold">ROLES</span></div>`;
      content += `<div class="evt-text" style="padding-left:0;">`;
      content += `<strong>Designer:</strong> ${r.designer} &bull; <strong>Model:</strong> ${r.model} &bull; <strong>Handlers:</strong> ${(r.handlers || [r.handler]).join(', ')}<br>`;
      content += `${r.gatherers.length ? '<strong>Gatherers:</strong> ' + r.gatherers.join(', ') + '<br>' : ''}`;
      content += `<strong>Theme:</strong> ${evt.theme}`;
      content += `</div></div>`;
      return;
    }

    // Beat header
    if (evt.beat !== undefined && evt.beat !== lastBeat && evt.beat >= 0) {
      lastBeat = evt.beat;
      content += `<div class="beat-hdr">Beat ${evt.beat + 1} — Build</div>`;
    }
    // Atmosphere flavor
    if (idx > 0 && idx % 5 === 0 && atmoIdx < shuffledAtmo.length) {
      content += `<div class="flavor">${shuffledAtmo[atmoIdx++]}</div>`;
    }
    content += _card(evt, idx, screenKey);
  });

  content += _buildControls(screenKey, totalCards);

  return _prShell(content, ep, 'pr-design');
}

export function rpBuildPRRunway(ep) {
  const pr = ep.projectRunaway;
  if (!pr) return '';

  const screenKey = 'pr-runway';
  const events = pr.runwayEvents || [];
  const totalCards = events.length;
  _ensureState(screenKey, totalCards);

  let content = `<div class="phase-hdr">`;
  content += `<span class="phase-num">Phase III</span>`;
  content += `<div class="phase-title">The <em>Runway</em></div>`;
  content += `<div class="phase-sub">Walk. Strut. Survive the judges.</div>`;
  content += `<div class="phase-rule"></div>`;
  content += `</div>`;

  const shuffledAtmo = [...ATMOSPHERE_RUNWAY].sort(() => Math.random() - 0.5);
  let atmoIdx = 0;
  let lastTribe = null;

  events.forEach((evt, idx) => {
    // Model walk — runway stage
    if (evt.type === 'modelWalk') {
      if (evt.tribe !== lastTribe) {
        lastTribe = evt.tribe;
        if (atmoIdx < shuffledAtmo.length) {
          content += `<div class="flavor">${shuffledAtmo[atmoIdx++]}</div>`;
        }
      }
      // Build runway stage visual
      const roles = pr.tribeRoles?.[evt.tribe] || (pr.tribes?.find(t => t.name === evt.tribe)?.roles);
      const modelName = roles?.model || evt.player;
      content += `<div id="pr-step-runway-${idx}">`;
      content += `<div class="runway-stage"><div class="spotlight-sweep"></div><div class="runway-walk">`;
      content += `<img class="runway-model-img" src="assets/avatars/${slug(modelName)}.png" alt="${modelName}" onerror="this.style.background='var(--gold)'">`;
      content += `<div class="runway-model-name">${modelName}</div>`;
      content += `<div class="runway-tribe">${evt.tribe} &bull; Model</div>`;
      content += `</div></div>`;
      // Walk event card
      content += `<div class="evt-card pr-visible">`;
      content += `<div class="evt-card-hdr">${_av(evt.player)}<span class="evt-name">${evt.player}</span><span class="evt-badge ${evt.badgeClass === 'gold' ? 'badge-gold' : evt.badgeClass === 'rose' ? 'badge-rose' : 'badge-blue'}">${evt.badge}</span></div>`;
      content += `<div class="evt-text">${evt.text}</div></div>`;
      content += `</div>`;
      return;
    }

    // Scoring breakdown
    if (evt.type === 'scoring') {
      const bd = evt.breakdown;
      if (!bd) { content += _card(evt, idx, screenKey); return; }
      content += `<div id="pr-step-runway-${idx}">`;
      content += `<div class="score-breakdown">`;
      content += `<div class="score-breakdown-title">${evt.tribe} &mdash; Scoring</div>`;
      const criteria = [
        { label: 'Creativity', val: bd.creativity, fill: 'fill-gold' },
        { label: 'Theme Fit', val: bd.themeFit, fill: 'fill-gold' },
        { label: 'Presentation', val: bd.presentation, fill: 'fill-gold' },
        { label: 'Creature Coop', val: bd.creatureCoop, fill: bd.creatureCoop < 5 ? 'fill-rose' : 'fill-gold' },
      ];
      criteria.forEach(c => {
        const pct = Math.min(100, Math.round(c.val * 10));
        content += `<div class="score-criterion">`;
        content += `<span class="score-criterion-label">${c.label}</span>`;
        content += `<div class="score-criterion-bar"><div class="score-criterion-fill ${c.fill}" style="width:${pct}%"></div></div>`;
        content += `<span class="score-criterion-val">${c.val}</span>`;
        content += `</div>`;
      });
      content += `</div></div>`;
      return;
    }

    // Winner/loser cards
    if (evt.type === 'winner') {
      content += `<div id="pr-step-runway-${idx}">`;
      content += `<div class="winner-card"><div class="winner-tribe">${evt.tribe}</div><div class="winner-sub">${evt.text}</div></div>`;
      content += `</div>`;
      return;
    }
    if (evt.type === 'loser') {
      content += `<div id="pr-step-runway-${idx}">`;
      content += `<div class="loser-card"><div class="loser-tribe">${evt.tribe}</div><div class="loser-sub">${evt.text}</div></div>`;
      content += `</div>`;
      return;
    }

    // Default: creature walk or other
    content += _card(evt, idx, screenKey);
  });

  content += _buildControls(screenKey, totalCards);

  return _prShell(content, ep, 'pr-runway');
}

export function rpBuildPRBerserk(ep) {
  const pr = ep.projectRunaway;
  if (!pr || !pr.berserkTriggered) return '';

  const screenKey = 'pr-berserk';
  const events = pr.berserkEvents || [];
  const totalCards = events.length;
  _ensureState(screenKey, totalCards);

  let content = `<div class="phase-hdr">`;
  content += `<span class="phase-num">Phase IV</span>`;
  content += `<div class="phase-title">Creature <em>Berserk</em></div>`;
  content += `<div class="phase-sub">It escaped. Catch it. NOW.</div>`;
  content += `<div class="phase-rule"></div>`;
  content += `</div>`;

  let lastBeat = -1;
  events.forEach((evt, idx) => {
    if (evt.beat !== undefined && evt.beat !== lastBeat) {
      lastBeat = evt.beat;
      const labels = ['Track', 'Chase', 'Capture'];
      content += `<div class="beat-hdr">Beat ${evt.beat + 1} — ${labels[evt.beat] || 'Action'}</div>`;
    }

    if (evt.type === 'rescueResult') {
      content += `<div id="pr-step-berserk-${idx}">`;
      if (evt.bonus > 0) {
        content += `<div class="winner-card"><div class="winner-tribe">${evt.tribe}</div><div class="winner-sub">${evt.text}</div></div>`;
      } else {
        content += `<div class="evt-card pr-visible"><div class="evt-card-hdr"><span class="evt-name">${evt.tribe}</span><span class="evt-badge badge-gold">${evt.badge}</span></div><div class="evt-text">${evt.text}</div></div>`;
      }
      content += `</div>`;
      return;
    }

    content += _card(evt, idx, screenKey);
  });

  content += _buildControls(screenKey, totalCards);

  return _prShell(content, ep, 'pr-berserk');
}

export function rpBuildPRResults(ep) {
  const pr = ep.projectRunaway;
  if (!pr) return '';

  let content = `<div class="phase-hdr">`;
  content += `<span class="phase-num">Final</span>`;
  content += `<div class="phase-title"><em>Results</em></div>`;
  content += `<div class="phase-sub">The runway has spoken.</div>`;
  content += `<div class="phase-rule"></div>`;
  content += `</div>`;

  // Final scores for all tribes
  (pr.tribes || []).forEach(tribe => {
    const bd = tribe.breakdown;
    if (!bd) return;
    const isWinner = tribe.isWinner;
    content += `<div class="${isWinner ? 'winner-card' : 'loser-card'}" style="margin-bottom:20px;">`;
    if (isWinner) {
      content += `<div class="winner-tribe">${tribe.name}</div>`;
      content += `<div class="winner-sub">Total Score: ${bd.total} &mdash; IMMUNITY</div>`;
    } else {
      content += `<div class="loser-tribe">${tribe.name}</div>`;
      content += `<div class="loser-sub">Total Score: ${bd.total} &mdash; Tribal Council</div>`;
    }
    content += `</div>`;
  });

  // Berserk recap if applicable
  if (pr.berserkTriggered && pr.berserkScoreBonus > 0) {
    content += `<div class="host-quote"><span class="host-name">${host()}</span>"The berserk rescue by ${pr.berserkRescueTribe} earned them a +${(pr.berserkScoreBonus * 0.1).toFixed(1)} bonus. That might have changed everything."</div>`;
  }

  // Tribal council assignment
  content += `<div class="host-quote"><span class="host-name">${host()}</span>${pr.hostLoser}</div>`;

  return _prShell(content, ep, 'pr-results');
}
