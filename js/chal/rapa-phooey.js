// js/chal/rapa-phooey.js — Rapa Phooey!: Easter Island egg hunt (TDWT post-merge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function noise(range = 2.5) { return (Math.random() - 0.5) * 2 * range; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function host() { return seasonConfig?.hostName || 'Chris'; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
function canScheme(n) {
  const a = arch(n);
  if (VILLAIN.has(a)) return true;
  if (NICE.has(a)) return false;
  const s = pStats(n);
  return s.strategic >= 6 && s.loyalty <= 4;
}

const _usedIndices = new Map();
function pickFresh(arr, poolKey) {
  if (!_usedIndices.has(poolKey)) _usedIndices.set(poolKey, new Set());
  const used = _usedIndices.get(poolKey);
  if (used.size >= arr.length) used.clear();
  const available = arr.map((_, i) => i).filter(i => !used.has(i));
  const idx = available[Math.floor(Math.random() * available.length)];
  used.add(idx);
  return arr[idx];
}

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════

const EGGS_PER_PLAYER = 5;
const EGGS_TO_WIN = 3;

const EGG_COLORS = [
  { id: 'red',    hex: '#d44a4a', label: 'Red' },
  { id: 'blue',   hex: '#4a82d4', label: 'Blue' },
  { id: 'purple', hex: '#a060d4', label: 'Purple' },
  { id: 'green',  hex: '#5ab04a', label: 'Green' },
  { id: 'orange', hex: '#e8952e', label: 'Orange' },
  { id: 'yellow', hex: '#d4c44a', label: 'Yellow' },
  { id: 'pink',   hex: '#d44a8a', label: 'Pink' },
  { id: 'teal',   hex: '#4abcd4', label: 'Teal' },
];

const CAVE_SEGMENTS = [
  { id: 'boulder', name: 'Boulder Corridor', stats: [['physical',0.35],['mental',0.30],['endurance',0.20]], threshold: 5.0, breakChance: 0.25, breakBasket: 0.08 },
  { id: 'squeeze', name: 'Narrow Squeeze',   stats: [['intuition',0.35],['boldness',0.30],['physical',0.20]], threshold: 5.0, breakChance: 0.20, breakBasket: 0.05 },
  { id: 'exit',    name: 'Exit Passage',     stats: [['strategic',0.35],['endurance',0.30],['physical',0.20]], threshold: 5.0, breakChance: 0.22, breakBasket: 0.06 },
];

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════

const T = {
  SEARCH_OWN: [
    n => `${n} pries open a stone head and finds one of their eggs nestled in the cavity. Score.`,
    n => `${n} checks behind the base of a moai and spots the familiar color. One down.`,
    n => `Patience pays off for ${n} — another moai checked, and finally their egg turns up.`,
    n => `${n} reaches into the carved mouth of a stone face and pulls out their colored egg, grinning.`,
    n => `${n} spots the telltale glint of their egg color in the shadow of a moai platform. Got it.`,
    n => `A careful inspection of the moai's jaw. ${n} finds their egg tucked in the gap. Perfect.`,
  ],
  SEARCH_OTHER: [
    (n, t, col, head) => `${n} reaches into ${head}'s moai and pulls out ${t}'s ${col} egg. Interesting. Very interesting.`,
    (n, t, col, head) => `It's not ${n}'s color — it's ${t}'s ${col}, tucked inside ${head}'s moai. Now, what to do with that?`,
    (n, t, col, head) => `${n} cracks open ${head}'s moai and finds ${t}'s ${col} egg. They hold it up, weighing their options.`,
    (n, t, col, head) => `Wrong color. ${n} found ${t}'s ${col} egg in ${head}'s moai and the wheels are turning.`,
    (n, t, col, head) => `${n} pulls a ${col} egg free from ${head}'s moai. That belongs to ${t}. A decision hangs in the air.`,
  ],
  SEARCH_FAIL: [], // replaced by _searchFailText function below
  EGG_HELP: [
    (n, t) => `${n} hands ${t} their egg without a word. A small gesture, but noted.`,
    (n, t) => `"Found yours." ${n} holds out ${t}'s egg. The trade is clean and honest.`,
    (n, t) => `${n} jogs over to ${t} and delivers the egg. The alliance holds.`,
    (n, t) => `${n} could have hidden it. Instead they hand it straight to ${t}. Trust, building.`,
    (n, t) => `A nod from ${n}. The egg changes hands. ${t} exhales with relief.`,
  ],
  EGG_TRADE: [
    (a, b) => `${a} and ${b} swap eggs — each one step closer to a full set.`,
    (a, b) => `A clean exchange. ${a} hands over ${b}'s color, ${b} returns the favor.`,
    (a, b) => `${a} and ${b} lock eyes and trade eggs simultaneously. Mutual benefit.`,
    (a, b) => `"Yours for mine." ${a} and ${b} make the swap without hesitation.`,
  ],
  EGG_SABOTAGE: [
    (n, t) => `${n} smashes ${t}'s egg on the nearest stone face. Gone. ${t}'s face goes pale.`,
    (n, t) => `Without a second thought, ${n} drops ${t}'s egg and grinds it into the dirt.`,
    (n, t) => `${n} pitches ${t}'s egg against a moai base. The crack echoes across the field.`,
    (n, t) => `${n} holds ${t}'s egg over the ground and lets it fall. Cold as stone.`,
    (n, t) => `${n} looks ${t} dead in the eye. Then crushes the egg in their fist. Yolk drips.`,
  ],
  EGG_HOSTAGE: [
    (n, t) => `${n} pockets ${t}'s egg with a small smile. "We'll talk terms later."`,
    (n, t) => `${n} holds up ${t}'s egg. "I found this. Seems like we need to have a conversation."`,
    (n, t) => `${t}'s egg disappears into ${n}'s bag. Insurance policy.`,
    (n, t) => `${n} keeps ${t}'s egg close. A bargaining chip still in the field.`,
    (n, t) => `"This stays with me until I decide otherwise." ${n} tucks ${t}'s egg away.`,
  ],
  EGG_HIDE: [
    (n, t) => `${n} re-hides ${t}'s egg in a different moai, buying a few ticks.`,
    (n, t) => `Quietly, ${n} slides ${t}'s egg into a harder-to-reach cavity. No confrontation needed.`,
    (n, t) => `${n} buries ${t}'s egg deeper. Not destroyed — just delayed.`,
    (n, t) => `${n} swaps ${t}'s egg to a moai on the far edge of the field. Let them search.`,
  ],
  NEGOTIATE_INTEL: [
    (n, t) => `${n} holds ${t}'s egg just out of reach. "Tell me which heads you've already cleared. Then you get this back."`,
    (n, t) => `"I'll return this. But first — which moai are empty?" ${n} keeps ${t}'s egg close.`,
    (n, t) => `${n} taps ${t}'s egg against the nearest stone. "Share your search intel and it's yours."`,
    (n, t) => `"Information for an egg. Fair deal." ${n} waits for ${t}'s answer.`,
  ],
  NEGOTIATE_LOYALTY: [
    (n, t) => `${n} locks eyes with ${t}. "I give you this egg, you vote with me at tribal. Deal?"`,
    (n, t) => `"This egg buys my protection at tribal council." ${n} holds it between them. "What do you say?"`,
    (n, t) => `${n} turns ${t}'s egg in their fingers. "I need a vote. You need an egg. Seems simple."`,
    (n, t) => `"You want this back? Then we're allies at the next vote." ${n} extends the egg, waiting.`,
  ],
  NEGOTIATE_ASSIST: [
    (n, t) => `"Help me search the next moai and this is yours." ${n} holds the egg between them.`,
    (n, t) => `${n} nods toward the far row. "Search with me, and you get this back. Two pairs of hands."`,
    (n, t) => `"One tick. That's all I need. Help me search, and the egg's yours." ${n} makes the offer.`,
    (n, t) => `${n} grips ${t}'s egg. "I'm falling behind. Help me look, and we both walk away happy."`,
  ],
  NEGOTIATE_DEBT: [
    (n, t) => `"I'll give you yours. But if you find mine, it comes straight to me. No questions." ${n} waits.`,
    (n, t) => `${n} holds the egg just out of reach. "You owe me one. Next time you find my color, it's mine."`,
    (n, t) => `"An egg for an egg. You find mine, you return it. Simple." ${n} offers the deal.`,
    (n, t) => `"Consider this a loan." ${n} extends the egg. "I'll collect when you find my color."`,
  ],
  NEGOTIATE_ACCEPT: [
    (n, t) => `${t} nods. The deal is struck. ${n} hands over the egg.`,
    (n, t) => `A beat. Then ${t} agrees. The egg changes hands. Both know what it cost.`,
    (n, t) => `${t} accepts the terms without hesitation. Business is business.`,
    (n, t) => `"Fine." ${t} takes the egg and the debt. Neither looks happy, but both got what they needed.`,
  ],
  NEGOTIATE_COUNTER: [
    (n, t) => `${t} shakes their head. "Too much. How about we share what we know instead?" ${n} considers... and accepts.`,
    (n, t) => `"That's steep." ${t} counters: "Intel swap. We both share search data." ${n} nods. Fair enough.`,
    (n, t) => `${t} won't agree to the full ask. They settle on sharing moai intel — both walk away knowing more.`,
    (n, t) => `Haggling. ${t} talks ${n} down to a mutual intel exchange. The egg returns. Grudging respect.`,
  ],
  NEGOTIATE_REFUSE: [
    (n, t) => `${t} turns away. "Keep it." ${n} watches them go, then pockets the egg. Their loss.`,
    (n, t) => `"No deal." ${t} won't bend. ${n} re-hides the egg without another word.`,
    (n, t) => `${t} stares ${n} down. "I'll find my own." And walks away. ${n} hides the egg somewhere else.`,
    (n, t) => `The negotiation collapses. ${t} refuses the terms. ${n} makes the egg disappear into a different moai.`,
  ],
  BASKET_WEAVE: [
    n => `${n} stops searching and starts weaving grass into a rough basket. Smart preparation.`,
    n => `${n} takes a tick to braid together a protective carrier. The cave will be kinder for it.`,
    n => `${n} works quickly, fingers flying over dry island grass. Basket ready.`,
    n => `While others scramble, ${n} weaves a basket. They've thought ahead.`,
  ],
  BASKET_GIFT: [
    (a, b) => `${a} hands ${b} a freshly-woven grass basket. "You'll need this more than me."`,
    (a, b) => `${a} spends the tick weaving a basket for ${b}. A genuine ally move.`,
    (a, b) => `"Take it." ${a} presses a basket into ${b}'s hands. The bond is real.`,
    (a, b) => `${a} puts the finishing touches on a basket and tosses it to ${b}. Alliance reinforced.`,
  ],
  CAVE_BOULDER_PASS: [
    n => `${n} dives sideways as a boulder thunders through. The eggs hold.`,
    n => `${n} braces against the cave wall and takes the hit — eggs intact, barely.`,
    n => `${n} times it perfectly. The boulder rolls past. Not a scratch on the eggs.`,
    n => `${n} rolls under the boulder at the last second. Heart pounding, eggs safe.`,
    n => `${n} reads the boulder's path and sidesteps clean. Textbook.`,
    n => `The boulder crashes past. ${n} pressed flat against the wall, eggs tucked high. All clear.`,
  ],
  CAVE_BOULDER_FAIL: [
    n => `The boulder clips ${n} and sends them spinning. One egg doesn't survive the tumble.`,
    n => `${n} can't dodge it — the boulder pins them and eggs crack against the wall.`,
    n => `The corridor shakes. ${n} stumbles and hears the sickening crack of shell against stone.`,
    n => `${n} catches the edge of the boulder. An egg shatters on impact.`,
    n => `${n} zigged when they should have zagged. The boulder says hello. An egg says goodbye.`,
    n => `A spray of rock chips catches ${n} mid-dodge. An egg takes the collateral damage.`,
  ],
  CAVE_BOULDER_STUCK: [
    n => `The boulder rumbles past. ${n} is shaken but the eggs survive.`,
    n => `${n} flattens against the wall as the boulder passes. Delayed, not broken.`,
    n => `${n} catches the edge of the boulder and gets knocked sideways. Eggs rattle but hold.`,
    n => `The corridor fills with dust after the boulder passes. ${n} coughs but pushes forward. Eggs safe.`,
  ],
  CAVE_SQUEEZE_PASS: [
    n => `${n} exhales and squeezes through the narrow passage. Tight, but clean.`,
    n => `${n} makes it through the squeeze sideways. Barely. Eggs intact.`,
    n => `${n} contorts through the gap, eggs pressed against their chest. All survive.`,
    n => `Inch by inch, ${n} works through the squeeze. Nothing broken.`,
    n => `${n} turns sideways, sucks in air, and slides through. A claustrophobe's nightmare, but the eggs are fine.`,
    n => `${n} wiggles through the passage with elbows tucked. Clean squeeze.`,
  ],
  CAVE_SQUEEZE_FAIL: [
    n => `${n} gets stuck in the squeeze and panics — an egg slips and shatters.`,
    n => `Arms pinned, ${n} can't protect the eggs. One breaks in the passage.`,
    n => `The passage crushes down on ${n}. They hear the crack before they feel it. Egg gone.`,
    n => `${n} forces through the narrow gap. The walls don't forgive — an egg crunches.`,
  ],
  CAVE_SQUEEZE_STUCK: [
    n => `${n} gets wedged in the narrow section. Loses time wiggling free, but the eggs hold.`,
    n => `The squeeze fights ${n} hard. They make it through eventually, eggs rattling but intact.`,
    n => `${n} panics in the tight space. Deep breath. Pushes through. The eggs survive the delay.`,
    n => `${n} gets stuck, arms pinned. Struggles free after a long moment. The eggs are fine.`,
  ],
  CAVE_DARK: [
    n => `The chamber goes black. ${n} takes the wrong path and loops back.`,
    n => `${n} trusts their instincts in the dark — and ends up exactly where they started.`,
    n => `Total darkness. ${n} counts three wrong turns before finding the right corridor.`,
    n => `${n} moves slowly through the dark chamber, feeling the walls. Dead end. Again.`,
  ],
  CAVE_EXIT_PASS: [
    n => `${n} sprints through the exit passage as rocks cascade from above. Clean escape.`,
    n => `Water crashes down at the cave mouth. ${n} times it between surges — eggs safe.`,
    n => `The exit rumbles. ${n} doesn't hesitate — dives through the gap before the rockfall seals it.`,
    n => `${n} shields the eggs and charges through the crumbling exit. Daylight. Safe.`,
    n => `${n} explodes through the exit like the cave is chasing them. Eggs intact. Daylight at last.`,
    n => `One final leap. ${n} clears the exit collapse by inches. The eggs? Still whole.`,
  ],
  CAVE_EXIT_FAIL: [
    n => `A rockslide at the exit catches ${n} off guard. An egg shatters on the cave floor.`,
    n => `${n} gets clipped by falling stone at the mouth. An egg doesn't survive the hit.`,
    n => `The exit collapse pins ${n} for a moment — long enough for an egg to crack against the rocks.`,
    n => `Water surges through the exit. ${n} shields what they can, but one egg washes against the wall. Gone.`,
  ],
  CAVE_EXIT_STUCK: [
    n => `Rocks tumble at the exit. ${n} covers the eggs — all intact, but they're pinned down.`,
    n => `The exit shakes. ${n} hunkers behind a rock shelf. Eggs survive, but they lose ground.`,
    n => `A cascade of loose stone blocks the path ahead. ${n} waits it out. Eggs safe, time lost.`,
    n => `${n} misjudges the exit timing and gets caught in the slide. Bruised, but eggs unbroken.`,
  ],
  CAVE_PACE_RUSH: [
    n => `${n} grits their teeth and breaks into a sprint. No caution, maximum speed.`,
    n => `Full send. ${n} charges into the next stretch like the cave owes them money.`,
    n => `${n} doesn't slow down. Eyes forward, eggs rattling, pure adrenaline.`,
    n => `"Move move move!" ${n} barrels through at top speed. The eggs are along for the ride.`,
    n => `${n} picks rush. Consequences later — speed now.`,
  ],
  CAVE_PACE_STEADY: [
    n => `${n} settles into a measured pace. Not fast, not slow. Controlled.`,
    n => `${n} takes the middle road — enough speed to stay competitive, enough care to protect the eggs.`,
    n => `A deliberate rhythm from ${n}. Each step calculated, each turn anticipated.`,
    n => `${n} moves steady. The cave can't rattle what the cave can't rush.`,
    n => `${n} picks steady. Balance over risk.`,
  ],
  CAVE_PACE_CAREFUL: [
    n => `${n} slows to a crawl. Every step is tested before weight is committed.`,
    n => `Careful as a surgeon. ${n} edges forward, eggs cradled tight against their chest.`,
    n => `${n} chooses safety. The eggs come first; speed comes last.`,
    n => `Inch by inch. ${n} takes the careful route. Nothing breaks if nothing moves fast.`,
    n => `${n} picks careful. Let the others rush. Let the others break.`,
  ],
  CAVE_STUCK_BOULDER: [
    n => `${n} clips the edge of a boulder and gets wedged against the corridor wall. Not going anywhere fast.`,
    n => `A rockfall pins ${n}'s foot. They wrench free but the momentum is gone.`,
    n => `${n} tried to sprint past the boulder and misjudged the gap. Stuck.`,
    n => `The boulder catches ${n}'s pack strap. They struggle, yank free — but they've lost a tick.`,
  ],
  CAVE_STUCK_SQUEEZE: [
    n => `${n} gets jammed in the narrow section, arms pinned at their sides. Deep breaths.`,
    n => `The squeeze fights back. ${n} is stuck, contorting slowly to work free.`,
    n => `${n} pushed too fast into the squeeze and got wedged. Panic flickers, then control returns.`,
    n => `Shoulders too wide for the gap. ${n} has to back out and try again sideways.`,
  ],
  CAVE_STUCK_EXIT: [
    n => `Loose rubble collapses around ${n}'s legs at the exit. They dig out, cursing.`,
    n => `${n} gets tangled in vines at the cave mouth. Freedom is right there but not yet.`,
    n => `A rockslide at the exit pins ${n} against the wall. They squirm free, but time's gone.`,
    n => `${n} trips over debris at the exit and goes sprawling. The eggs survive. The dignity doesn't.`,
  ],
  PYTHON_COIL: [
    n => `A massive python blocks the passage ahead of ${n}, coiled in a lazy figure-eight. It's not moving.`,
    n => `${n} rounds the corner and freezes — the cave python lies across the path, scales shimmering in the dim light.`,
    n => `The python has settled directly in ${n}'s path. Twenty feet of muscle between them and progress.`,
    n => `${n} spots the python's coils filling the corridor. The tongue flicks out. Testing the air.`,
  ],
  PYTHON_COIL_PUSH: [
    n => `${n} sucks in a breath and pushes past the python. Bold. The snake hisses but doesn't strike.`,
    n => `Pure guts. ${n} steps OVER the python's body and keeps moving. The snake uncoils slowly behind them.`,
    n => `${n} charges past the python with a yell. The snake recoils. Nobody expected that.`,
    n => `${n} stares the python down, then edges past. The scales brush their leg. Chills — but through.`,
  ],
  PYTHON_COIL_WAIT: [
    n => `${n} waits for the python to move. It takes its sweet time. A full tick, lost to patience.`,
    n => `${n} holds back, watching the python slowly uncoil and slither deeper into the dark. Tick wasted, but alive.`,
    n => `The python doesn't care about ${n}'s schedule. ${n} waits. And waits. Then finally, the path clears.`,
    n => `${n} crouches in the shadows until the python decides to relocate. Wise choice. Slow choice.`,
  ],
  PYTHON_STRIKE: [
    n => `The python lunges at ${n}'s egg bundle. Fangs close around shell. CRACK.`,
    n => `Lightning fast — the python strikes at ${n}'s hands. An egg is caught in the impact.`,
    n => `${n} never saw it coming. The python's head whips forward and an egg shatters in its jaws.`,
    n => `The python lashes out at ${n}'s eggs. One is punctured by a fang before ${n} can pull away.`,
  ],
  PYTHON_STRIKE_DODGE: [
    n => `The python strikes — but ${n} reads the motion and yanks the eggs clear. Not today, snake.`,
    n => `${n} dodges the python's lunge with reflexes that even the snake didn't expect.`,
    n => `The python's fangs snap shut on empty air. ${n} pulled the eggs away just in time.`,
    n => `${n} anticipates the strike and rolls sideways. The python gets nothing but cave dust.`,
    n => `The python lunges. ${n} twists. Misses by inches. The eggs rattle but hold.`,
  ],
  PYTHON_DISTRACTION: [
    (a, b) => `${a} waves their arms and stamps their feet. The python turns — and ${b}'s eggs are safe.`,
    (a, b) => `"Hey! Over here!" ${a} draws the python's attention away from ${b}. Pure courage.`,
    (a, b) => `${a} throws a loose rock at the python. It pivots toward ${a}, giving ${b} a clear path.`,
    (a, b) => `${a} makes themselves the bigger threat. The python forgets about ${b} entirely.`,
    (a, b) => `${a} steps between the python and ${b}. The snake's tongue flickers toward ${a}. The diversion works.`,
  ],
  CAVE_SEG_HEADER_BOULDER: [
    'The ceiling drops. The walls narrow. Welcome to the Boulder Corridor.',
    'Rumbling ahead. The Boulder Corridor awaits — and the boulders wait for no one.',
    'The first segment: Boulder Corridor. Where the cave tests whether you deserve to keep your eggs.',
    'Torchlight flickers off rolling stone. The Boulder Corridor begins.',
  ],
  CAVE_SEG_HEADER_SQUEEZE: [
    'The passage narrows to barely shoulder-width. The Narrow Squeeze begins.',
    'Air gets thin. Walls close in. Welcome to the Narrow Squeeze.',
    'From wide corridors to claustrophobic nightmare — the Narrow Squeeze is next.',
    'The cave contracts. If you brought too many eggs, this is where you pay for it.',
  ],
  CAVE_SEG_HEADER_EXIT: [
    'Light ahead — but the Exit Passage is no gift. The ceiling is coming down.',
    'The exit is close. But the cave has one more trick — rockslides, water surges, and crumbling stone.',
    'Final stretch. The Exit Passage. Where daylight is visible and the danger peaks.',
    'Almost out. The Exit Passage rumbles overhead. Sprint or crawl — pick your poison.',
  ],
  EGG_BREAK: [
    (n, count) => `${count > 1 ? count + ' of' : 'One of'} ${n}'s eggs doesn't survive. Back to the field.`,
    (n) => `Crack. ${n} watches the yolk spread across the cave floor. That hurts.`,
    (n) => `${n}'s egg shatters on impact. The race just got harder.`,
    (n) => `Fragments. ${n}'s egg is gone and the backtrack clock starts ticking.`,
  ],
  PILLAR_CLIMB: [
    n => `${n} hauls themselves up the pillar, fingers finding every carved handhold.`,
    n => `${n} moves steadily up the stone column. Deliberate, controlled.`,
    n => `${n} makes the next tier look easy. Experience showing.`,
    n => `${n} digs in and climbs hard, gaining the next tier before the condor circles back.`,
    n => `Hand over hand, ${n} gains altitude. The wind picks up but the grip holds.`,
  ],
  PILLAR_FALL: [
    n => `${n}'s grip gives out — they slide back a tier, clutching the egg tight.`,
    n => `A foothold crumbles and ${n} drops. The egg rattles in their grip.`,
    n => `${n} slips and barely catches themselves. A scary moment on the stone.`,
    n => `The pillar rejects ${n} this time. They fall back, shielding the egg with their body.`,
  ],
  CONDOR_DODGE: [
    n => `${n} reads the condor's dive and rolls aside. The talons find nothing.`,
    n => `The condor screams overhead. ${n} flattens against the pillar and survives the pass.`,
    n => `Bold as anything, ${n} stares down the condor and doesn't flinch. The bird banks away.`,
    n => `${n} ducks under the wing and the condor overshoots. Clean dodge.`,
  ],
  CONDOR_MASK: [
    n => `${n} uses the catcher's mask — the condor's dive is blocked. One free pass used.`,
    n => `The mask absorbs the full condor strike. ${n} tosses it aside — single use, worth it.`,
  ],
  CONDOR_HIT: [
    n => `The condor's talons connect. ${n} is knocked back and the egg shatters.`,
    n => `Direct hit. ${n} slides down a tier and loses the egg to the dive.`,
    n => `The condor dive-bombs ${n} and sends them sprawling. The egg doesn't survive.`,
    n => `${n} can't dodge it — full condor impact. The egg explodes against the stone.`,
  ],
  NEST_EGG: [
    (n, count) => `${n} places egg number ${count} in the summit nest. ${EGGS_TO_WIN - count} to go.`,
    (n, count) => `Egg ${count} of ${EGGS_TO_WIN} nested. ${n} is ${count === EGGS_TO_WIN - 1 ? 'one away' : count === EGGS_TO_WIN ? 'done' : 'making progress'}.`,
    (n, count) => `${n} sets the egg carefully in the nest at the summit. ${count}/${EGGS_TO_WIN}.`,
    (n, count) => `${n} reaches the nest and delivers egg ${count}. The condor screams overhead.`,
  ],
  CAVE_SQUEEZE_CRACK: [
    n => `${n} squeezes through — but the tight walls pinch an egg. A hairline crack appears, then spreads. Gone.`,
    n => `The passage is tighter than expected. ${n} hears the sickening crunch of shell against stone. One less egg.`,
    n => `${n} makes it through the squeeze, but the eggs didn't all survive the compression. One cracked clean through.`,
    n => `Even sideways, the gap crushes one of ${n}'s eggs against the wall. The yolk seeps into the cracks.`,
  ],
  PILLAR_FUMBLE: [
    n => `${n} loses grip mid-climb — an egg tumbles out of their hands and shatters on the rocks below.`,
    n => `A bad handhold. ${n} lurches and an egg slips free, falling end over end. Smash.`,
    n => `${n}'s fingers can't hold everything. An egg rolls off the pillar ledge and is gone.`,
    n => `The climb rattles ${n}'s grip. One egg bounces off the stone column and explodes on impact.`,
  ],
  WIND_GUST: [
    n => `A gust of wind hammers the pillar. ${n} clings on but an egg is ripped from their grasp.`,
    n => `The wind howls and ${n}'s exposed egg catches the gust. It sails into the void.`,
    n => `A sudden updraft. ${n} shields their face and an egg is swept off the pillar like nothing.`,
    n => `The condor rides a wind gust straight past ${n}. The turbulence costs them an egg.`,
  ],
  NEST_REJECTION: [
    n => `The condor swoops and bats ${n}'s freshly nested egg right off the summit. Gone.`,
    n => `${n} sets the egg down — and the condor knocks it off the nest with one wing. Heartbreaking.`,
    n => `The condor doesn't approve. ${n}'s egg gets launched off the summit by a furious talon strike.`,
    n => `Just as ${n} steps back, the condor rakes the nest. The newest egg tumbles over the edge.`,
  ],
  ELIMINATED: [
    n => `${n} has no eggs left — none in the pool, none in hand, not enough nested. They're done.`,
    n => `That's it for ${n}. Every egg destroyed, nothing left to carry. A brutal exit.`,
    n => `${n} looks at the empty base. No eggs anywhere. The challenge is over for them.`,
    n => `All of ${n}'s eggs are gone. Broken, smashed, sabotaged — the pool is dry. They sit down and watch.`,
  ],
  FIELD_FAILED: [
    (n, count) => `Time's up. ${n} only found ${count} egg${count !== 1 ? 's' : ''} — not enough to enter the cave. They're out.`,
    (n, count) => `The field closes. ${n} stands among the moai with just ${count} egg${count !== 1 ? 's' : ''}. Not enough. Eliminated.`,
    (n, count) => `${host()} blows the horn. ${n} never made it to ${EGGS_TO_WIN} eggs — stuck at ${count}. The challenge is over for them.`,
    (n, count) => `"${n}. ${count} egg${count !== 1 ? 's' : ''}. You needed ${EGGS_TO_WIN}. Pack it up." ${host()} doesn't sugarcoat it.`,
  ],
  AUCTION_PACT: [
    (a, b) => `${a} and ${b} shake on it — "find yours, hand it over." The egg pact is sealed.`,
    (a, b) => `"I find your eggs, you find mine." ${a} and ${b} make the deal before the gun fires.`,
    (a, b) => `${a} and ${b} agree: mutual egg delivery. Trust front-loaded, race about to begin.`,
    (a, b) => `The pact is simple. ${a} and ${b} look each other in the eye. Done.`,
  ],
  AUCTION_BRIBE: [
    (n, t) => `${n} produces the candy cart and slides it toward ${t}. Sugar for silence.`,
    (n, t) => `${n} offers ${t} a stack of candy bars. "Just one vote. Whenever I need it." A beat. ${t} reaches for the candy.`,
    (n, t) => `"Consider this a gift." ${n} hands ${t} half the candy cart. Strings visible to everyone but ${t}.`,
    (n, t) => `${n} bribes ${t} with enough candy to last through tribal. ${t} looks guilty. Takes it anyway.`,
  ],
  VICTORY_TEXT: [
    n => `${n} places the third egg in the nest. It's over. The condor screams and wheels away.`,
    n => `Egg three. ${n} stands at the summit and spreads their arms. Immunity.`,
    n => `${n} deposits the final egg and collapses against the nest. Done. They won.`,
    n => `The third egg settles into the nest. ${n} roars at the condor. The condor retreats. ${host()} calls it.`,
  ],
  SOCIAL_SHIELD: [
    (a, b) => `${a} throws themselves in front of ${b} as the boulder rolls. Takes the hit so ${b} doesn't have to.`,
    (a, b) => `"Move!" — ${a} shoves ${b} clear of the boulder and absorbs the impact alone.`,
    (a, b) => `${a} blocks the passage for ${b}. The boulder hits them. ${b} passes clean.`,
    (a, b) => `${a} shields ${b} without hesitation. The alliance is real.`,
  ],
  SOCIAL_SHOVE: [
    (n, t) => `${n} gives ${t} a hard shove at the segment entrance. ${t} stumbles, loses timing.`,
    (n, t) => `${n} throws an elbow into ${t} mid-crawl. ${t} drops an egg.`,
    (n, t) => `${n} cuts in front of ${t} on the cave path, forcing them back.`,
    (n, t) => `A sharp shove from ${n} sends ${t} into the cave wall. Dirty play.`,
  ],
  SOCIAL_BOOST: [
    (a, b) => `${a} cups their hands and boosts ${b} up to the next tier. ${b} flies past the hardest part.`,
    (a, b) => `"I've got you." ${a} pushes ${b} upward, sacrificing their own climb tick.`,
    (a, b) => `${a} hoists ${b} at the pillar base. ${b} gains a full tier. The crowd would go wild.`,
    (a, b) => `${a} gives ${b} the boost they needed. Up they go.`,
  ],
  SOCIAL_CATCH: [
    (a, b) => `${b}'s egg falls from above. ${a} reads the trajectory and catches it clean.`,
    (a, b) => `${a} dives and scoops ${b}'s falling egg out of the air. Incredible.`,
    (a, b) => `The egg drops from ${b}'s grip. ${a}, one tier below, extends a hand and grabs it.`,
    (a, b) => `${a} makes the mid-air catch and passes the egg back up to ${b}. Unreal.`,
  ],
  SOCIAL_CONDOR_BAIT: [
    (a, b) => `${a} waves their arms at the condor, drawing its attention away from ${b}. Pure guts.`,
    (a, b) => `${a} screams at the condor. It banks hard, targeting ${a} instead of ${b}.`,
    (a, b) => `"Over here, ugly!" ${a} taunts the condor. ${b} climbs unimpeded.`,
    (a, b) => `${a} baits the condor with a decoy move. ${b} gets a free climb tick.`,
  ],
  SOCIAL_KNOCK_DOWN: [
    (n, t) => `${n} swipes at ${t}'s handhold. ${t} slides down a tier.`,
    (n, t) => `${n} kicks loose a stone above ${t}. It clips ${t}'s grip and they fall.`,
    (n, t) => `${n} shoulder-checks ${t} on the pillar. ${t} loses a tier.`,
    (n, t) => `A vicious elbow from ${n} sends ${t} tumbling down the pillar face.`,
  ],
  SOCIAL_EGG_EXTORT: [
    (n, t) => `${n} holds up ${t}'s egg. "Vote with me tonight, or I crush it." ${t} has no choice.`,
    (n, t) => `"Here's the deal," ${n} says, dangling ${t}'s egg. "Loyalty for survival."`,
    (n, t) => `${n} squeezes ${t}'s egg between two fingers. "We have an understanding?"`,
    (n, t) => `The extortion is quiet but clear. ${n} has ${t}'s egg and the leverage to use it.`,
  ],
  EXTORT_RESIST: [
    (n, t) => `${t} stares ${n} down. "Do it." ${n} crushes the egg. Neither blinks.`,
    (n, t) => `${t} refuses to fold. ${n} smashes the egg against the rock. The power play backfires.`,
    (n, t) => `"I don't negotiate with bullies." ${t} watches ${n} destroy the egg. A costly stand.`,
    (n, t) => `${t} calls the bluff. ${n} follows through — the egg shatters. Respect earned, egg lost.`,
  ],
  EXTORT_SUBMIT: [
    (n, t) => `${t} agrees to the terms. ${n} hands the egg back. The deal is struck.`,
    (n, t) => `${t} nods slowly. ${n} returns the egg. An uneasy alliance is born.`,
    (n, t) => `"Fine." ${t} takes the egg back. ${pronouns(t).Sub} won't forget this.`,
    (n, t) => `${n} slides the egg back to ${t}. The leverage worked. For now.`,
  ],
  SOCIAL_INTEL: [
    (a, b) => `${a} points toward a far moai. "Your egg's in that one." ${b} nods gratefully.`,
    (a, b) => `${a} shares what they've learned about the field layout. ${b}'s awareness spikes.`,
    (a, b) => `Quick intel swap. ${a} and ${b} pool what they know about the egg locations.`,
    (a, b) => `${a} whispers a tip to ${b}: "Skip the first row. Nothing there."`,
  ],
  SOCIAL_ALLIANCE_SEARCH: [
    (a, b) => `${a} and ${b} sweep the field together, splitting up the rock heads between them.`,
    (a, b) => `Coordinated search: ${a} takes the north heads, ${b} takes the south. Efficient.`,
    (a, b) => `${a} and ${b} work as a unit, clearing moai twice as fast.`,
    (a, b) => `Alliance in action — ${a} and ${b} divide and conquer the field.`,
  ],
  SOCIAL_TRASH_TALK: [
    (n, t, rattled) => `${n} taunts ${t} across the field. ${rattled ? `${t} visibly rattled.` : `${t} ignores it entirely.`}`,
    (n, t, rattled) => `"You're going home tonight!" ${n} yells at ${t}. ${rattled ? `${t} fumbles their next search.` : `${t} doesn't even look up.`}`,
    (n, t, rattled) => `${n} mocks ${t}'s strategy. ${rattled ? `It gets in ${t}'s head.` : `Water off a duck's back.`}`,
    (n, t, rattled) => `Verbal jab from ${n} aimed at ${t}. ${rattled ? `Effective — ${t} loses focus.` : `${t} just smirks.`}`,
  ],
  SOCIAL_ROCK_HEAD_REACT: [
    (n, elim, positive) => positive
      ? `${n} pauses at ${elim}'s moai, running a hand gently over the carved face. A moment of respect.`
      : `${n} kicks ${elim}'s moai. "Good riddance." The stone doesn't flinch.`,
    (n, elim, positive) => positive
      ? `${n} touches ${elim}'s stone forehead. "Miss you out here." Then moves on.`
      : `${n} sneers at ${elim}'s moai and spits on the base. No love lost.`,
  ],
  SOCIAL_PANIC_CHAIN: [
    (a, b, calmer) => calmer
      ? `Both freeze in the dark. ${a} steadies ${b}'s breathing. "Follow my voice." They push through together.`
      : `Panic in the Dark Chamber. ${a} and ${b} crash into each other, both losing precious time.`,
    (a, b, calmer) => calmer
      ? `${a} grabs ${b}'s arm in the blackout. "This way." One calm voice saves them both a tick.`
      : `The darkness swallows them both. ${a} and ${b} stumble in circles, wasting a full tick.`,
  ],
  SOCIAL_EGG_RESCUE: [
    (a, b) => `${b}'s egg cracks against the wall. ${a} lunges — catches the pieces — holds it together. The egg survives.`,
    (a, b) => `A miracle save. ${a} snags ${b}'s falling egg just before it shatters on the cave floor.`,
    (a, b) => `${a} dives across the cave passage and catches ${b}'s egg mid-tumble. Incredible reflexes.`,
    (a, b) => `The egg slips from ${b}'s grip. ${a}, right there, scoops it up. Not today.`,
  ],
  SOCIAL_EXIT_DISTRACTION: [
    (a, b) => `${a} braces the collapsing exit beam. "Go!" ${b} dives through the gap.`,
    (a, b) => `The exit starts caving in. ${a} holds the rocks back with both arms while ${b} scrambles past.`,
    (a, b) => `${a} throws themselves into the debris field, clearing a path. ${b} sprints through.`,
    (a, b) => `"I've got the rocks — move!" ${a} shields the exit. ${b} escapes clean.`,
  ],
  SOCIAL_CAVE_WARN: [
    (a, b, seg) => `"Watch the ${seg === 'boulder' ? 'left wall' : seg === 'squeeze' ? 'low ceiling' : 'loose rocks'}!" ${a} shouts back. ${b} adjusts.`,
    (a, b, seg) => `${a} calls back a warning about the ${seg === 'boulder' ? 'boulder corridor' : seg === 'squeeze' ? 'narrow squeeze' : 'exit collapse'}. ${b} hears it.`,
    (a, b) => `${a} scratches an arrow into the cave wall. ${b} finds it and takes the better path.`,
    (a, b) => `"Don't go left!" ${a}'s voice echoes through the dark. ${b} goes right. Smart.`,
  ],
  SOCIAL_CAVE_BLOCK: [
    (n, t) => `${n} plants themselves in the narrow passage. ${t} can't get through until ${n} moves.`,
    (n, t) => `"After me." ${n} blocks the path and forces ${t} to wait. Power move.`,
    (n, t) => `${n} deliberately slows down in the tight section, trapping ${t} behind them.`,
    (n, t) => `${n} wedges into the squeeze and takes their sweet time. ${t} fumes behind them.`,
  ],
  SOCIAL_CAVE_CARRY: [
    (a, b) => `${a} takes two of ${b}'s eggs through the tight section. Both pairs of hands are steadier for it.`,
    (a, b) => `"Hand me yours — I've got room." ${a} carries ${b}'s eggs through the worst part.`,
    (a, b) => `${a} and ${b} bundle their eggs together to get through the passage. Teamwork in the dark.`,
    (a, b) => `${a} cradles ${b}'s eggs against their chest. "I won't drop them. Move." They don't.`,
  ],
  SOCIAL_CAVE_RACE: [
    (a, b, winner) => `${a} and ${b} spot the same clear path. Both sprint — ${winner} gets through first.`,
    (a, b, winner) => `Side by side in the dark. ${a} and ${b} race for the next chamber. ${winner} edges ahead.`,
    (a, b, winner) => `Footsteps echo. ${a} and ${b} realize they're neck and neck. ${winner} wins the dash.`,
    (a, b, winner) => `An unspoken race breaks out between ${a} and ${b} in the tunnel. ${winner} clears first.`,
  ],
  SOCIAL_CAVE_TRASH: [
    (n, t) => `${n}'s voice echoes through the cave: "You're never getting out of here, ${t}." The dark makes it worse.`,
    (n, t) => `"Hear that dripping? That's your chances." ${n} taunts ${t} from somewhere in the dark.`,
    (n, t) => `${n} whispers just loud enough for ${t} to hear: "Drop your eggs. Save yourself the embarrassment."`,
    (n, t) => `In the dark, ${n}'s trash talk hits different. ${t} can't see where it's coming from.`,
  ],
  SOCIAL_STAMPEDE: [
    (worst, others) => `Three players in the same segment when the hazard fires. ${worst} takes the worst of it.`,
    (worst, others) => `Chaos. The stampede knocks ${worst} back a segment. Blame flies.`,
    (worst, others) => `Pileup in the cave. ${worst} ends up at the bottom. Their egg doesn't survive.`,
  ],
  CROSS_SHOUT_WARNING: [
    (a, b) => `${a} shouts from the cave entrance: "Watch out for the boulder corridor!" ${b} takes note.`,
    (a, b) => `${a} yells intel back toward the field. ${b} hears it and adjusts.`,
    (a, b) => `"First segment's the worst!" ${a} calls to ${b}. A small edge, freely given.`,
  ],
  CROSS_TAUNT_FROM_ABOVE: [
    (n, t, rattled) => `${n} yells down from the pillar: "Still looking for eggs? Pathetic!" ${rattled ? `${t} fumbles.` : `${t} ignores the noise.`}`,
    (n, t, rattled) => `"I can see the nest from here!" ${n} taunts ${t} from above. ${rattled ? `It stings.` : `${t} keeps working.`}`,
  ],
  CROSS_BACKTRACK_ENCOUNTER: [
    (a, b, friendly) => friendly
      ? `${a} passes ${b} heading the other way. Quick intel exchange — both benefit.`
      : `${a} and ${b} cross paths. Words are exchanged. None of them friendly.`,
  ],
  SOCIAL_DESPERATE_THROW: [
    n => `${n} hurls the egg from mid-pillar — it arcs, catches the wind — and lands in the nest! Unbelievable!`,
    n => `A Hail Mary from ${n}. The egg sails upward, tumbling end over end — and nestles into the summit. The crowd erupts.`,
    n => `${n} throws the egg with everything they've got. Time slows. It hits the rim of the nest. Wobbles. Stays.`,
    n => `Desperate throw from ${n}. The egg traces a perfect arc and drops into the nest. Miraculous.`,
  ],
  SOCIAL_DESPERATE_FAIL: [
    n => `${n} heaves the egg from mid-pillar. It sails past the nest. Shatters on the far side. Back to base.`,
    n => `The throw goes wide. ${n}'s egg explodes against the pillar face. Down they go.`,
    n => `${n} gambles everything on a throw. The wind catches it wrong. Shattered. Back to the pool.`,
  ],
  NEST_SABOTAGE: [
    (n, t) => `${n} reaches into the nest and knocks ${t}'s placed egg out. It tumbles down the pillar. Vicious.`,
    (n, t) => `At the summit, ${n} swipes ${t}'s nested egg. It falls, cracks on stone. Ruthless play.`,
    (n, t) => `${n} bumps the nest "accidentally." ${t}'s egg rolls out and shatters below.`,
    (n, t) => `${n} destroys ${t}'s hard-won nest egg. The summit becomes a warzone.`,
  ],
  SUMMIT_SHOWDOWN: [
    (a, b) => `${a} and ${b} reach the summit at the same time. Both have an egg to nest. The race intensifies.`,
  ],
  DESCENT_NEST: [
    (n, count) => `${n} slides down the pillar in triumph. ${count}/${EGGS_TO_WIN} nested — back to base for the next one.`,
    (n, count) => `Egg ${count} secured. ${n} rappels down the pillar face, already eyeing the next egg.`,
    (n, count) => `${n} drops from the summit like a stone, landing at the base. ${count} down, ${EGGS_TO_WIN - count} to go.`,
    (n, count) => `The descent is a blur. ${n} hits the base running — ${count} nested, momentum building.`,
  ],
  DESCENT_CRASH: [
    n => `${n} plummets down the pillar, egg shattered above. A hard landing at the base.`,
    n => `Down the pillar. No egg. No dignity. ${n} picks themselves up at the base and reaches for another.`,
    n => `${n} slides down in defeat, yolk still on their hands. Back to the pool.`,
    n => `The crash landing rattles ${n}. The egg is gone — but the pool still has spares.`,
  ],
  BASE_PICKUP_FIRST: [
    (n) => `${n} picks up the first egg from the pool. One hand on the pillar — the climb begins.`,
    (n) => `${n} cradles an egg and stares up at the pillar. A long way to the nest.`,
    (n) => `First egg in hand. ${n} takes a breath, grips the stone, and starts climbing.`,
    (n) => `${n} grabs an egg from the base and sizes up the pillar. Here we go.`,
  ],
  BASE_PICKUP_RETURN: [
    (n, trip) => `${n} grabs egg number ${trip} from the pool. Back up the pillar.`,
    (n, trip) => `A fresh egg from the base. ${n} knows the route now — trip ${trip} begins.`,
    (n, trip) => `${n} selects the next egg carefully. Trip ${trip} — the pillar isn't getting any shorter.`,
    (n, trip) => `Trip ${trip}. ${n} cradles a new egg and eyes the summit again.`,
  ],
  SOCIAL_PEP_TALK: [
    (a, b) => `"You've got this!" ${a} calls up from the base. ${b} finds a second wind.`,
    (a, b) => `${a} cups their hands around their mouth: "Keep going, ${b}!" The encouragement lands.`,
    (a, b) => `From the base, ${a} shouts strategy tips up to ${b}. The climb steadies.`,
    (a, b) => `${a} slaps the pillar twice. ${b} looks down, gets a nod. Confidence restored.`,
  ],
  SOCIAL_BASE_SABOTAGE: [
    (n, t) => `${n} bumps into ${t} at the base — "accidentally" crushing ${t}'s egg. Oops.`,
    (n, t) => `${n} swipes ${t}'s egg off the base ledge. It shatters before ${t} can react.`,
    (n, t) => `"Oh no, was that yours?" ${n} steps on ${t}'s egg with theatrical regret.`,
    (n, t) => `${n} leans on ${t}'s egg pile. Crack. ${t} stares in disbelief.`,
  ],
  SOCIAL_RACE_RIVALRY: [
    (a, b) => `${a} and ${b} are on the same trip — and they both know it. The race is personal now.`,
    (a, b) => `Eyes lock between ${a} and ${b} at the same tier. Same trip. Same stakes. This is war.`,
    (a, b) => `${a} glances at ${b}'s progress. Same trip number. The rivalry kicks both into overdrive.`,
    (a, b) => `Trip parity. ${a} and ${b} are neck and neck, and the tension makes them both reckless.`,
  ],
  SOCIAL_ALLIANCE_CLIMB: [
    (a, b) => `${a} and ${b} climb in sync, spotting each other up the pillar face. Both advance.`,
    (a, b) => `Alliance pays off — ${a} braces a handhold for ${b}, who returns the favor. Both up a tier.`,
    (a, b) => `${a} and ${b} work as a unit on the pillar, using each other as leverage. Both gain altitude.`,
    (a, b) => `Coordinated climb. ${a} goes left, ${b} goes right, and they pull each other up simultaneously.`,
  ],
  SOCIAL_NEST_BLOCK: [
    (n, t) => `${n} parks themselves in front of the nest. ${t} can't place their egg until ${n} moves.`,
    (n, t) => `"After me." ${n} blocks the nest entrance. ${t} fumes, egg in hand, losing a tick.`,
    (n, t) => `${n} spreads out at the summit, physically preventing ${t} from reaching the nest.`,
    (n, t) => `A summit standoff. ${n} won't budge from the nest. ${t} has to wait.`,
  ],
  PILLAR_SPRINT: [
    n => `${n} throws caution to the wind — SPRINTING up the pillar face!`,
    n => `Full send. ${n} attacks the pillar like a ladder, flying past two tiers in one burst.`,
    n => `${n} goes beast mode on the climb. Arms burning, legs pumping — two tiers gained!`,
    n => `"Move!" ${n} explodes up the pillar. Nobody's climbing this fast.`,
    n => `${n} channels raw adrenaline and tears up the stone column. Two tiers in one go.`,
  ],
  PILLAR_SPRINT_FAIL: [
    n => `${n} sprints recklessly — foot slips, body swings out. They barely hold on but lose ground.`,
    n => `Too fast. ${n}'s grip gives out mid-sprint. The egg rattles dangerously.`,
    n => `${n} goes for the sprint and immediately regrets it. Hands raw, no progress.`,
    n => `The sprint attempt backfires. ${n} overcommits and has to claw back to their starting tier.`,
  ],
  PILLAR_STEADY: [
    n => `${n} climbs methodically. One handhold at a time. Gains a tier with zero drama.`,
    n => `Steady and controlled. ${n} inches upward, never losing balance.`,
    n => `${n} takes the patient route. Slow but sure — another tier conquered.`,
    n => `No flash, all substance. ${n} gains a tier through sheer discipline.`,
    n => `${n} reads the rock face, picks the best holds, and advances. Textbook.`,
  ],
  PILLAR_BRACE: [
    n => `${n} flattens against the pillar and braces. Eyes on the condor. Not moving this turn.`,
    n => `${n} reads the condor's pattern and hunkers down. Smart. Let it pass.`,
    n => `"Not yet." ${n} waits, pressed to the stone. The condor swoops overhead harmlessly.`,
    n => `${n} goes still as the condor circles. Stone-cold patience. The bird loses interest.`,
  ],
  PILLAR_TAUNT: [
    (n, t) => `${n} waves their free hand at the condor and redirects its rage toward ${t}. Devious.`,
    (n, t) => `"Hey bird! Over there!" ${n} throws a pebble near ${t}. The condor locks on to a new target.`,
    (n, t) => `${n} makes noise and points at ${t}. The condor's head swivels. ${t} is now the target.`,
    (n, t) => `A villain's gambit — ${n} attracts the condor's attention and deflects it toward ${t}.`,
  ],
  PILLAR_SHIELD_ALLY: [
    (n, t) => `${n} positions themselves between ${t} and the condor. "Climb. I've got you."`,
    (n, t) => `${n} waves arms wide, drawing the condor's attention away from ${t}. A selfless turn.`,
    (n, t) => `"Go go go!" ${n} shields ${t} from above. The condor targets ${n} instead.`,
    (n, t) => `${n} sacrifices their climb turn to cover ${t}. The condor banks away from its original target.`,
  ],
  SOCIAL_TRASH_PILLAR: [
    (n, t) => `"Looking tired up there, ${t}!" ${n} calls from below. ${t} grits their teeth.`,
    (n, t) => `${n} heckles ${t} mid-climb: "That egg's gonna crack before you reach the top!" ${t} fumes.`,
    (n, t) => `"Slip! Slip! Slip!" ${n} chants at ${t}. Psychological warfare on the pillar face.`,
    (n, t) => `${n} laughs as ${t} struggles on the stone. "Should've stayed in the cave, ${t}."`,
  ],
  SOCIAL_CLIMBING_TIP: [
    (n, t) => `${n} spots a hidden handhold and calls it out to ${t}: "Three o'clock, crack in the stone!" ${t} finds it.`,
    (n, t) => `"Use the ridge on your left!" ${n} shouts route guidance to ${t}. It works.`,
    (n, t) => `${n} points to a faster route they found earlier. ${t} follows the path and gains ground.`,
    (n, t) => `${n} shares their climbing line with ${t}. Knowledge is power — and friendship.`,
  ],
  SOCIAL_SHOWMANCE_PILLAR: [
    (a, b) => `${a} and ${b} lock eyes mid-climb. A moment. Both find strength in it.`,
    (a, b) => `${a} reaches for ${b}'s hand across the gap. Brief contact. Both climb harder.`,
    (a, b) => `"Together." ${a} nods at ${b}. They climb in rhythm, watching out for each other.`,
    (a, b) => `The showmance energy is ELECTRIC on the pillar. ${a} and ${b} feed off each other's proximity.`,
  ],
  SOCIAL_PANIC_FREEZE: [
    (n, trigger) => `${n} freezes after seeing ${trigger} get hit by the condor. Can't move. Wasted turn.`,
    (n, trigger) => `The condor impact on ${trigger} sends ${n} into panic mode. They cling to the stone, unable to climb.`,
    (n, trigger) => `${n} watches ${trigger} get slammed and goes rigid. "I can't—" Turn lost to fear.`,
    (n, trigger) => `After ${trigger}'s condor hit, ${n} is paralyzed with fear. They're not climbing this turn.`,
  ],
  SOCIAL_STRATEGIC_WAIT: [
    (a, b) => `${a} and ${b} time it together — climbing simultaneously to split the condor's attention.`,
    (a, b) => `Alliance coordination: ${a} and ${b} advance at the same moment. The condor can only target one.`,
    (a, b) => `"On three." ${a} counts down. Both climb. The condor hesitates, unsure who to dive.`,
    (a, b) => `${a} and ${b} execute a split push — forcing the condor to choose. Brilliant teamwork.`,
  ],
  CANDY_BRIBE_ACCEPT: [
    (n, t) => `${n} slides a candy bar across the rock to ${t}. ${t} takes it. No words needed.`,
    (n, t) => `"Hungry?" ${n} holds out candy. ${t} eyes it, then pockets it. Loyalty, purchased.`,
    (n, t) => `${n} bribes ${t} with candy mid-search. ${t} chews thoughtfully. Deal accepted.`,
    (n, t) => `Sugar diplomacy. ${n} offers, ${t} accepts. The alliance is sealed in chocolate.`,
  ],
  CANDY_BRIBE_REFUSE: [
    (n, t) => `${n} offers candy. ${t} swats it away. "I'm not for sale." Cold.`,
    (n, t) => `"Keep your candy." ${t} doesn't even look at ${n}'s outstretched hand.`,
    (n, t) => `${n} tries the candy angle on ${t}. ${t} laughs. "Try that on someone dumber."`,
    (n, t) => `${t} stares at ${n}'s candy offering. "Seriously?" Walks away. ${n} eats it themselves.`,
  ],
  HEAD_RACE: [
    (a, b, winner) => `${a} and ${b} spot the same moai at the same time. Both sprint. ${winner} gets there first.`,
    (a, b, winner) => `Collision course — ${a} and ${b} converge on one moai. ${winner} shoulders past and searches first.`,
    (a, b, winner) => `${a} and ${b} lock eyes across the field. Same target. ${winner} is faster on the draw.`,
    (a, b, winner) => `A footrace to the same stone head. ${a} dives left, ${b} dives right — ${winner} reaches the mouth first.`,
    (a, b, winner) => `Two players, one moai. ${winner} slides in first. ${winner === a ? b : a} kicks the dirt in frustration.`,
  ],
  REACT_FIND: [
    (n, finder) => `${n} watches ${finder} pull an egg from a moai. Their expression says everything.`,
    (n, finder) => `${n} sees ${finder} score and mutters, "Lucky break." Then searches harder.`,
    (n, finder) => `${finder}'s find doesn't go unnoticed. ${n} clocks it from three moai away. Strategy recalibrating.`,
    (n, finder) => `${n} freezes mid-search. ${finder} just found one. The pressure ratchets up.`,
  ],
  REACT_SABOTAGE: [
    (n, actor, target) => `${n} watches ${actor} smash ${target}'s egg. Their jaw drops. Mental note: don't cross ${actor}.`,
    (n, actor, target) => `${n} sees the sabotage unfold. ${NICE.has(arch(n)) ? `Horrified. "That's low, even out here."` : `Interesting. Filing that away for later.`}`,
    (n, actor, target) => `${n} catches ${actor} destroying ${target}'s egg. The whole field dynamic just shifted.`,
    (n, actor, target) => `${n} doesn't miss it — ${actor} just took out ${target}'s egg. ${n} decides to give ${actor} a wider berth.`,
  ],
};

// ── Archetype-driven search fail text ──
const _FAIL_COMEDIC = [
  (n, head) => `${n} jams both arms into ${head}'s stone mouth. Nothing but a beetle, which crawls up ${n}'s sleeve. Screaming ensues.`,
  (n, head) => `${n} shakes ${head}'s moai like it owes them money. Dust, pebbles, one startled lizard. No egg.`,
  (n, head) => `${n} headbutts ${head}'s moai out of sheer frustration. The moai wins. ${n} staggers back, seeing stars.`,
  (n, head) => `${n} reaches in and pulls out... a crab. The crab pinches. ${n} yells. The crab holds on. This goes on for a while.`,
  (n, head) => `${n} kicks ${head}'s moai, hurts their foot, hops around in a circle, and falls over. The island is undefeated.`,
  (n, head) => `${n} peers into ${head}'s jaw with one eye closed. A spider drops onto their face. That's a wrap for this moai.`,
  (n, head) => `${n} tries to tip ${head}'s moai over. The moai doesn't budge. ${n} does, landing flat on their back.`,
  (n, head) => `${n} sticks a hand in and something bites it. Not an egg. Definitely not an egg. ${n} runs.`,
];
const _FAIL_STRATEGIC = [
  (n, head) => `${n} scans ${head}'s moai, notes the undisturbed dust pattern, and moves on. "Already searched."`,
  (n, head) => `Nothing in ${head}'s head. But ${n} noticed footprints leading south — someone else searched here recently.`,
  (n, head) => `${n} checks ${head}'s moai methodically, top to bottom. Empty. But the search revealed a pattern in the placements.`,
  (n, head) => `${n} feels around ${head}'s base. No egg, but the soil's been disturbed on the east side. Someone re-hid something here.`,
  (n, head) => `Empty. ${n} pulls out and quietly counts: four moai left unchecked. The math is narrowing.`,
  (n, head) => `${n} lingers at ${head}'s moai, pretending to still be searching. Really they're watching who goes where.`,
  (n, head) => `Nothing in this one either. ${n} files it away — the eggs must be clustered elsewhere.`,
  (n, head) => `${n} opens ${head}'s moai and finds nothing. Pauses. Thinks. Then walks to the opposite end of the field. Theory forming.`,
];
const _FAIL_EMOTIONAL = [
  (n, head) => `${n} opens ${head}'s moai gently. Empty. They linger a moment, hand on the stone. "Still rooting for you."`,
  (n, head) => `${n} brushes the dust off ${head}'s carved face before checking inside. Empty, but the gesture is tender.`,
  (n, head) => `"Sorry to bother you." ${n} whispers it to ${head}'s moai and moves on. The respect is real.`,
  (n, head) => `${n} checks ${head}'s moai and finds nothing. Straightens the head gently on the way out. Old friendships linger.`,
  (n, head) => `Empty. ${n} pats ${head}'s stone shoulder. "Wish you were still out here with me."`,
  (n, head) => `${n} opens the moai with care, as if ${head} might actually feel it. Nothing inside. A small sigh.`,
];
const _FAIL_GRITTY = [
  (n, head) => `${n} rips into ${head}'s moai with both hands. Empty. Resets. Next one. No wasted motion.`,
  (n, head) => `Nothing. ${n} doesn't react. Just pivots to the next head. Systematic.`,
  (n, head) => `${n} runs a hand through ${head}'s cavity. Empty. Already moving to the next before pulling their arm out.`,
  (n, head) => `${n} checks ${head}'s moai in three seconds flat. Not there. On to the next. Machine mode.`,
  (n, head) => `Empty again. ${n} exhales through their nose and keeps the pace up. Endurance over frustration.`,
  (n, head) => `${n} clears ${head}'s moai and marks it with a scratch in the rock. Won't be back. Efficient.`,
];
const _FAIL_VILLAIN = [
  (n, head) => `${n} opens ${head}'s moai, finds nothing, and snaps the carved jaw off. "Useless. Even in stone."`,
  (n, head) => `${n} spits into ${head}'s moai. "As helpful dead as alive." Moves on without looking back.`,
  (n, head) => `Nothing inside. ${n} uses ${head}'s moai to sharpen a rock. Might come in handy.`,
  (n, head) => `${n} sneers at ${head}'s carved face. "Should've known you'd have nothing for me." Kicks it sideways.`,
  (n, head) => `${n} checks ${head}'s moai, finds it empty, and shoves the head off the platform. Intimidation is the point.`,
  (n, head) => `Empty. ${n} carves an X into ${head}'s forehead with a sharp stone. "Marked as worthless."`,
];
const _FAIL_GOAT = [
  (n, head) => `${n} searches ${head}'s moai and blinks. "Wait, didn't someone already...?" Déjà vu hits hard.`,
  (n, head) => `${n} reaches into ${head}'s moai and pulls out a rock. Stares at it. "Is this an egg?" It's a rock.`,
  (n, head) => `${n} checks the wrong end of the moai. Like, the feet. If moai had feet.`,
  (n, head) => `${n} peers into ${head}'s moai and somehow gets their arm stuck. This takes two minutes to resolve.`,
  (n, head) => `${n} searches ${head}'s moai carefully, finds nothing, then wanders off in a random direction. Plan unclear.`,
  (n, head) => `"Found one!" ${n} holds up... a coconut. From ${head}'s moai. Not even close.`,
];
const _FAIL_ESCALATED = [
  (n, head) => `${n} yanks at ${head}'s moai so hard the stone cracks. Still empty. ${n} is losing it out here.`,
  (n, head) => `${n} drops to their knees in front of ${head}'s moai. "GIVE. ME. AN. EGG." Nothing. The field gives nothing.`,
  (n, head) => `Something snaps in ${n}. They start checking ${head}'s moai with their eyes closed, muttering a prayer. Empty.`,
  (n, head) => `${n} is talking to ${head}'s moai now. Full conversation. Asking where the eggs are. The moai stays quiet.`,
  (n, head) => `${n} opens ${head}'s moai, stares into the empty cavity, and just... sits down. The field has broken them.`,
  (n, head) => `${n} flips ${head}'s moai upside down, shakes it, slams it back. Birds scatter. Still nothing.`,
  (n, head) => `Tick ${n} where everything falls apart. ${n} searches ${head}'s head with the energy of someone losing a war.`,
  (n, head) => `${n} is crawling now. On hands and knees, checking ${head}'s moai at ground level. Dignity: gone. Egg: also gone.`,
];

function _searchFailText(n, head, stateObj) {
  const a = arch(n);
  const ticks = stateObj?.ticksInZone || 0;

  if (ticks >= 3 && Math.random() < 0.4) {
    return pickFresh(_FAIL_ESCALATED, 'fail-esc')(n, head);
  } else if (a === 'hothead' || a === 'chaos-agent' || a === 'wildcard') {
    return pickFresh(_FAIL_COMEDIC, 'fail-com')(n, head);
  } else if (a === 'mastermind' || a === 'schemer' || a === 'perceptive-player') {
    return pickFresh(_FAIL_STRATEGIC, 'fail-str')(n, head);
  } else if (a === 'hero' || a === 'loyal-soldier' || a === 'social-butterfly' || a === 'showmancer' || a === 'underdog') {
    return pickFresh(_FAIL_EMOTIONAL, 'fail-emo')(n, head);
  } else if (a === 'challenge-beast') {
    return pickFresh(_FAIL_GRITTY, 'fail-grt')(n, head);
  } else if (a === 'villain') {
    return pickFresh(_FAIL_VILLAIN, 'fail-vil')(n, head);
  } else if (a === 'goat') {
    return pickFresh(_FAIL_GOAT, 'fail-goat')(n, head);
  } else {
    return pickFresh([..._FAIL_COMEDIC, ..._FAIL_STRATEGIC, ..._FAIL_GRITTY], 'fail-mix')(n, head);
  }
}

// ══════════════════════════════════════════════════════════════
// SIMULATE
// ══════════════════════════════════════════════════════════════

export function simulateRapaPhooey(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);

  const campKey = gs.mergeName || 'merge';
  const campEvents = [];
  ep.chalMemberScores = {};
  for (const n of active) ep.chalMemberScores[n] = 0;

  // ── Assign egg colors ──
  const colorAssign = {};
  const shuffledColors = [...EGG_COLORS].sort(() => Math.random() - 0.5);
  active.forEach((n, i) => { colorAssign[n] = shuffledColors[i % shuffledColors.length]; });

  // ── Build moai heads (one per eliminated player, min 8) ──
  const eliminated = (gs.episodeHistory || [])
    .map(e => e.eliminated).flat().filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i && !active.includes(v));
  const headNames = [...eliminated];
  const GENERIC = ['Ancient One','Forgotten One','Silent Guard','Stone Watcher','Old Voice','Wind Reader','Deep Carver','Tide Caller'];
  while (headNames.length < 8) headNames.push(GENERIC[headNames.length % GENERIC.length]);
  const heads = headNames.slice(0, 8);

  // ── Distribute eggs per player randomly ──
  const headEggs = {};
  for (const h of heads) headEggs[h] = [];
  for (const n of active) {
    const shuffledHeads = [...heads].sort(() => Math.random() - 0.5);
    for (let i = 0; i < EGGS_PER_PLAYER; i++) {
      headEggs[shuffledHeads[i % shuffledHeads.length]].push({ owner: n, color: colorAssign[n], found: false });
    }
  }

  // ── Player state ──
  const state = {};
  for (const n of active) {
    state[n] = {
      zone: 1,
      carrying: [],
      nested: 0,
      eliminated: false,
      nestTicks: [],
      totalEggsLost: 0,
      basket: false,
      awareness: 0,
      caveSegment: 0,
      pillarTier: 0,
      eggInHand: null,
      trip: 0,
      atBase: true,
      pepTalkBuff: false,
      rivalryBuff: false,
      nestBlocked: false,
      catcherMask: false,
      pacts: [],
      ticksInZone: 0,
      heldHostage: null,
      heldHostageOwner: null,
      pillarTicks: 0,
      lastStrategy: null,
      lastCondorHit: false,
      panicFrozen: false,
      condorSplit: false,
      condorTaunted: false,
      shieldedBy: null,
      shieldDebuff: false,
      rattled: false,
      searchedEmpty: new Set(),
      caveEggArmor: 0,
      cavePace: null,
      caveStuck: false,
      caveStuckTick: 0,
      slowPillarStart: false,
      caveSegEntered: new Set(),
      cavePaceShown: new Set(),
      caveSegFails: 0,
      caveTicks: 0,
    };
  }
  let fieldExitOrder = 0;
  let fragileAssigned = false;

  // ══════════════════════════════════════════════
  // ALLIANCE AUCTION
  // ══════════════════════════════════════════════
  const auctionEvents = [];
  const bribers = active.filter(n => {
    const a = arch(n);
    return VILLAIN.has(a) || a === 'social-butterfly';
  });
  const numAuctionEvents = clamp(1 + Math.floor(active.length / 3), 1, 3);

  for (let i = 0; i < numAuctionEvents; i++) {
    if (i === 0 && bribers.length > 0 && active.length >= 2) {
      // Candy bribe attempt
      const schemer = bribers[Math.floor(Math.random() * bribers.length)];
      const targets = active.filter(n => n !== schemer && !canScheme(n));
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        const ss = pStats(schemer); const ts = pStats(target);
        const roll = ss.social * 0.4 + ss.strategic * 0.3 + noise(2);
        const resist = ts.mental * 0.3 + ts.intuition * 0.3 + noise(2);
        const success = roll > resist;
        const txt = pick(T.AUCTION_BRIBE)(schemer, target);
        if (success) {
          addBond(schemer, target, 0.5);
          state[target].awareness += 0.5;
          state[schemer].pacts.push(target);
          state[target].pacts.push(schemer);
        }
        campEvents.push({ type: 'rapaAuction', players: [schemer, target], badgeText: 'Candy Deal', badgeClass: 'bad', desc: txt });
        auctionEvents.push({ type: 'bribe', actor: schemer, target, success, text: txt });
        popDelta(schemer, success ? 0 : -1);
      }
    } else {
      // Egg pact
      const pairs = [];
      for (let a = 0; a < active.length; a++) {
        for (let b = a + 1; b < active.length; b++) {
          if (getBond(active[a], active[b]) >= 2) pairs.push([active[a], active[b]]);
        }
      }
      if (pairs.length > 0) {
        const [pa, pb] = pairs[Math.floor(Math.random() * pairs.length)];
        const txt = pick(T.AUCTION_PACT)(pa, pb);
        state[pa].pacts.push(pb);
        state[pb].pacts.push(pa);
        addBond(pa, pb, 0.3);
        campEvents.push({ type: 'rapaAuction', players: [pa, pb], badgeText: 'Egg Pact', badgeClass: 'green', desc: txt });
        auctionEvents.push({ type: 'pact', actor: pa, target: pb, text: txt });
      }
    }
  }

  // ── Condor state ──
  let pillarTicksGlobal = 0;
  let firstCaveExiter = null;

  // ── Phase event buckets (for VP grouping) ──
  const fieldEvents = [];
  const caveEvents = [];
  const pillarEvents = [];

  // ── Pillar round-robin state ──
  let pillarRound = 0;
  let pillarTurnIdx = 0;
  let pillarTurnsSinceSocial = 0;
  let pillarTurnOrder = [];
  let pillarSocialPending = false; // true = all players acted, fire social next tick

  function _calcPillarTurnOrder() {
    const occ = active.filter(n => state[n].zone === 3 && !state[n].eliminated);
    return occ.sort((a, b) => {
      const sa = pStats(a), sb = pStats(b);
      const ra = sa.physical * 0.3 + sa.endurance * 0.3 + noise(2.5);
      const rb = sb.physical * 0.3 + sb.endurance * 0.3 + noise(2.5);
      return rb - ra;
    });
  }

  // ── Race ticks ──
  const raceTicks = [];
  let winner = null;
  const maxTicks = 120;

  for (let tick = 0; tick < maxTicks && !winner; tick++) {
    const tickEvents = [];
    const pillarOccupants = active.filter(n => state[n].zone === 3);
    const caveOccupants   = active.filter(n => state[n].zone === 2);
    const fieldOccupants  = active.filter(n => state[n].zone === 1);

    // Clear per-tick debuffs
    for (const n of active) {
      state[n].shieldDebuff = false;
      state[n].rattled = false;
      state[n].pepTalkBuff = false;
      state[n].rivalryBuff = false;
      state[n].nestBlocked = false;
    }

    // ════════════════════════════════════════
    // ZONE 3: Nest Pillar (ROUND-ROBIN)
    // ════════════════════════════════════════
    if (pillarOccupants.length > 0) {
      pillarTicksGlobal++;

      // Initialize or refresh turn order at start of each round
      const livePillar = pillarOccupants.filter(n => !state[n].eliminated);
      if (livePillar.length > 0 && (pillarTurnOrder.length === 0 || pillarTurnIdx >= pillarTurnOrder.length)) {
        // Start new round
        if (pillarTurnOrder.length > 0) pillarSocialPending = true;
        pillarTurnOrder = _calcPillarTurnOrder();
        pillarTurnIdx = 0;
        pillarRound++;
        // Emit round header (only when 2+ players for meaningful turn rotation)
        if (pillarTurnOrder.length >= 2) {
          const orderNames = pillarTurnOrder.join(', ');
          const roundTxt = `— Round ${pillarRound} — Turn order: ${orderNames} —`;
          const roundEv = { type: 'pillar-round', round: pillarRound, turnOrder: [...pillarTurnOrder], zone: 3, tick: tick + 1, text: roundTxt };
          tickEvents.push(roundEv); pillarEvents.push(roundEv);
        }
      }

      // ── Strategic choice selection ──
      function _pickStrategy(n, st, ps, livePillar) {
        const a = arch(n);
        const pTicks = st.pillarTicks;
        const condorHot = pTicks >= 8;
        const hasAllyClimbing = livePillar.some(o => o !== n && !state[o].atBase && !state[o].eliminated && getBond(n, o) >= 3);
        const hasRivalClimbing = livePillar.some(o => o !== n && !state[o].atBase && !state[o].eliminated && getBond(n, o) <= -2);
        const nearSummit = st.pillarTier >= 2;

        const weights = { sprint: 0, steady: 0, brace: 0, taunt: 0, shield: 0 };

        // Base weights by archetype
        if (a === 'challenge-beast' || a === 'hothead') { weights.sprint += 4; weights.steady += 2; }
        else if (a === 'loyal-soldier' || a === 'underdog' || a === 'goat') { weights.steady += 5; weights.sprint += 1; }
        else if (a === 'mastermind' || a === 'schemer' || a === 'villain') { weights.steady += 3; weights.taunt += 3; }
        else if (a === 'wildcard' || a === 'chaos-agent') { weights.sprint += 3; weights.steady += 2; weights.brace += 1; }
        else if (a === 'social-butterfly' || a === 'showmancer') { weights.steady += 3; weights.shield += 2; }
        else if (a === 'perceptive-player' || a === 'floater') { weights.steady += 3; weights.brace += 2; }
        else { weights.steady += 3; weights.sprint += 2; }

        // Stat modifiers
        weights.sprint += ps.physical * 0.3 + ps.boldness * 0.3 + noise(1.5);
        weights.steady += ps.endurance * 0.3 + ps.mental * 0.2 + noise(1.5);
        weights.brace += ps.strategic * 0.3 + ps.intuition * 0.2 + noise(1.5);

        // Situational modifiers
        if (condorHot && nearSummit) weights.brace += 3;
        if (condorHot && !nearSummit) weights.brace += 1.5;
        if (st.pillarTier === 0) { weights.sprint += 2; weights.brace -= 3; }
        if (nearSummit) { weights.steady += 2; weights.sprint -= 1; }
        if (st.basket) weights.sprint += 1.5;

        // Taunt: only villains/schemers with rival on pillar
        if (canScheme(n) && hasRivalClimbing && !st.atBase) {
          weights.taunt += ps.strategic * 0.25 + ps.boldness * 0.2 + noise(1.5);
        } else {
          weights.taunt = -99;
        }

        // Shield: only nice archetypes or high-bond players with ally climbing
        if (hasAllyClimbing && !st.atBase && (NICE.has(a) || ps.loyalty >= 6)) {
          weights.shield += ps.loyalty * 0.3 + ps.social * 0.2 + noise(1.5);
        } else {
          weights.shield = -99;
        }

        // Pick highest weight
        let best = 'steady'; let bestW = -Infinity;
        for (const [k, w] of Object.entries(weights)) {
          if (w > bestW) { bestW = w; best = k; }
        }
        return best;
      }

      // ── Interspersed social event (fires after every 2-3 player turns) ──
      function _firePillarSocial(livePillar, lastActor) {
        if (livePillar.length < 2) return;
        const shuffled = [...livePillar].sort(() => Math.random() - 0.5);
        const basePlayers = livePillar.filter(x => state[x].atBase && !state[x].eliminated);
        const climbingPlayers = livePillar.filter(x => !state[x].atBase && !state[x].eliminated && state[x].eggInHand);

        // Showmance moment (pair both on pillar)
        if (gs.showmances?.length > 0) {
          for (const sh of gs.showmances) {
            if (sh.broken) continue;
            const [pa, pb] = sh.pair;
            if (livePillar.includes(pa) && livePillar.includes(pb) && !state[pa].atBase && !state[pb].atBase && Math.random() < 0.30) {
              state[pa].pepTalkBuff = true; state[pb].pepTalkBuff = true;
              addBond(pa, pb, 1.5); popDelta(pa, 2); popDelta(pb, 2);
              const txt = pick(T.SOCIAL_SHOWMANCE_PILLAR)(pa, pb);
              const ev = { type: 'showmance-pillar', actor: pa, target: pb, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
              tickEvents.push(ev); pillarEvents.push(ev);
              campEvents.push({ type: 'rapaShowmance', players: [pa, pb], badgeText: 'Showmance', badgeClass: 'green', desc: txt });
              _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores, 'partner', null);
              return;
            }
          }
        }

        // Trash talk from villain to rival (rattled debuff)
        for (const pa of shuffled) {
          if (!canScheme(pa)) continue;
          for (const pb of shuffled) {
            if (pb === pa) continue;
            if (state[pb].atBase || state[pb].eliminated) continue;
            if (getBond(pa, pb) <= -1 && Math.random() < 0.35) {
              state[pb].rattled = true;
              addBond(pa, pb, -1.5); popDelta(pa, -2);
              const txt = pick(T.SOCIAL_TRASH_PILLAR)(pa, pb);
              const ev = { type: 'trash-talk-pillar', actor: pa, target: pb, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
              tickEvents.push(ev); pillarEvents.push(ev);
              campEvents.push({ type: 'rapaTaunt', players: [pa, pb], badgeText: 'Trash Talk', badgeClass: '', desc: txt });
              return;
            }
          }
        }

        // Climbing tip (high mental shares route with ally)
        for (const pa of shuffled) {
          if (pStats(pa).mental < 6) continue;
          for (const pb of shuffled) {
            if (pb === pa || state[pb].atBase || state[pb].eliminated || !state[pb].eggInHand) continue;
            if (getBond(pa, pb) >= 2 && state[pb].pillarTier < 3 && Math.random() < 0.30) {
              state[pb].pillarTier = Math.min(3, state[pb].pillarTier + 1);
              ep.chalMemberScores[pa] += 1; ep.chalMemberScores[pb] += 2;
              addBond(pa, pb, 1.5); popDelta(pa, 2);
              const txt = pick(T.SOCIAL_CLIMBING_TIP)(pa, pb);
              const ev = { type: 'climbing-tip', actor: pa, target: pb, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
              tickEvents.push(ev); pillarEvents.push(ev);
              campEvents.push({ type: 'rapaHeroic', players: [pa, pb], badgeText: 'Climbing Tip', badgeClass: 'green', desc: txt });
              return;
            }
          }
        }

        // Panic freeze (after a condor hit on someone, nearby player freezes)
        if (lastActor && state[lastActor]?.lastCondorHit) {
          const nearby = livePillar.filter(o => o !== lastActor && !state[o].atBase && !state[o].eliminated && pStats(o).boldness <= 5);
          if (nearby.length > 0 && Math.random() < 0.25) {
            const panicked = nearby[Math.floor(Math.random() * nearby.length)];
            state[panicked].panicFrozen = true;
            popDelta(panicked, -1);
            const txt = pick(T.SOCIAL_PANIC_FREEZE)(panicked, lastActor);
            const ev = { type: 'panic-freeze', actor: lastActor, target: panicked, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
            tickEvents.push(ev); pillarEvents.push(ev);
            return;
          }
        }

        // Strategic wait (allies coordinate to split condor)
        for (let i = 0; i < shuffled.length - 1; i++) {
          const pa = shuffled[i]; const pb = shuffled[i + 1];
          if (state[pa].atBase || state[pb].atBase) continue;
          if (!state[pa].eggInHand || !state[pb].eggInHand) continue;
          if (getBond(pa, pb) >= 3 && pStats(pa).strategic >= 5 && Math.random() < 0.20) {
            state[pa].condorSplit = true; state[pb].condorSplit = true;
            ep.chalMemberScores[pa] += 1; ep.chalMemberScores[pb] += 1;
            addBond(pa, pb, 1.0);
            const txt = pick(T.SOCIAL_STRATEGIC_WAIT)(pa, pb);
            const ev = { type: 'strategic-wait', actor: pa, target: pb, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
            tickEvents.push(ev); pillarEvents.push(ev);
            campEvents.push({ type: 'rapaAlliance', players: [pa, pb], badgeText: 'Split Push', badgeClass: 'green', desc: txt });
            return;
          }
        }

        // Pep talk (ally at base encourages climber)
        for (const pa of basePlayers) {
          for (const pb of climbingPlayers) {
            if (getBond(pa, pb) >= 2 && Math.random() < 0.35) {
              state[pb].pepTalkBuff = true;
              addBond(pa, pb, 1.5); popDelta(pa, 2);
              ep.chalMemberScores[pa] += 1;
              const txt = pick(T.SOCIAL_PEP_TALK)(pa, pb);
              const ev = { type: 'pep-talk', actor: pa, target: pb, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
              tickEvents.push(ev); pillarEvents.push(ev);
              campEvents.push({ type: 'rapaHeroic', players: [pa, pb], badgeText: 'Pep Talk', badgeClass: 'green', desc: txt });
              return;
            }
          }
        }

        // Race rivalry (negative bond, both climbing)
        for (let i = 0; i < shuffled.length - 1; i++) {
          const pa = shuffled[i]; const pb = shuffled[i + 1];
          if (state[pa].atBase || state[pb].atBase) continue;
          if (!state[pa].eggInHand || !state[pb].eggInHand) continue;
          if (getBond(pa, pb) <= -1 && Math.random() < 0.30) {
            state[pa].rivalryBuff = true; state[pb].rivalryBuff = true;
            addBond(pa, pb, -1); popDelta(pa, -1); popDelta(pb, -1);
            const txt = pick(T.SOCIAL_RACE_RIVALRY)(pa, pb);
            const ev = { type: 'race-rivalry', actor: pa, target: pb, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
            tickEvents.push(ev); pillarEvents.push(ev);
            campEvents.push({ type: 'rapaRivalry', players: [pa, pb], badgeText: 'Race Rivalry', badgeClass: '', desc: txt });
            return;
          }
        }
      }

      // ── Between-round social events (1 guaranteed + bonus) ──
      if (pillarSocialPending && livePillar.length >= 2) {
        pillarSocialPending = false;
        _firePillarSocial(livePillar, null);
        if (Math.random() < 0.30) _firePillarSocial(livePillar, null);
      } else if (pillarSocialPending) {
        pillarSocialPending = false;
      }

      // ── Single player turn (round-robin: one action per tick) ──
      if (pillarTurnIdx < pillarTurnOrder.length) {
        const n = pillarTurnOrder[pillarTurnIdx];
        pillarTurnIdx++;

        // Skip eliminated or players who left the zone
        if (!state[n].eliminated && state[n].zone === 3) {
          const st = state[n];
          const ps = pStats(n);
          st.pillarTicks++;
          pillarTurnsSinceSocial++;

          // Consume per-tick buffs
          const hasPepTalk = st.pepTalkBuff; st.pepTalkBuff = false;
          const hasRivalry = st.rivalryBuff; st.rivalryBuff = false;
          const isNestBlocked = st.nestBlocked; st.nestBlocked = false;
          const isPanicFrozen = st.panicFrozen; st.panicFrozen = false;
          const hasCondorSplit = st.condorSplit; st.condorSplit = false;
          const isRattled = st.rattled; st.rattled = false;

          // Slow pillar start — last cave exiter misses their first pillar tick
          if (st.slowPillarStart && st.pillarTicks === 1) {
            st.slowPillarStart = false;
            const slowTxt = `${n} arrives at the pillar winded from the cave. Still catching their breath — skipping this turn.`;
            const slowEv = { type: 'pillar-slow-start', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: slowTxt };
            tickEvents.push(slowEv); pillarEvents.push(slowEv);
          }
          // Panic frozen — skip turn
          else if (isPanicFrozen) {
            const freezeTxt = `${n} is frozen with fear. Can't move. The condor circles overhead.`;
            const freezeEv = { type: 'panic-frozen', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: freezeTxt };
            tickEvents.push(freezeEv); pillarEvents.push(freezeEv);
          }
          // ── AT BASE: pick up egg ──
          else if (st.atBase) {
            if (st.carrying.length > 0) {
              st.eggInHand = st.carrying.pop();
              st.trip++;
              st.atBase = false;
              st.pillarTier = 0;
              const txt = st.trip === 1 ? pick(T.BASE_PICKUP_FIRST)(n) : pick(T.BASE_PICKUP_RETURN)(n, st.trip);
              const ev = { type: 'base-pickup', player: n, trip: st.trip, eggColor: st.eggInHand.color, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
              tickEvents.push(ev); pillarEvents.push(ev);
            } else if (st.eggInHand === null && st.nested < EGGS_TO_WIN) {
              st.eliminated = true; st.zone = 0;
              ep.chalMemberScores[n] -= 10;
              popDelta(n, -3);
              const txt = pick(T.ELIMINATED)(n);
              const ev = { type: 'pillar-eliminated', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
              tickEvents.push(ev); pillarEvents.push(ev);
              campEvents.push({ type: 'rapaEliminated', players: [n], badgeText: 'Out of Eggs', badgeClass: 'bad', desc: txt });
            }
          }
          // ── No egg safety ──
          else if (!st.eggInHand) {
            st.pillarTier = 0; st.atBase = true;
          }
          // ── Has egg: STRATEGIC CHOICE ──
          else {
            const strategy = _pickStrategy(n, st, ps, livePillar);
            st.lastStrategy = strategy;

            // Condor targets highest climber
            const condorTarget = livePillar.reduce((best, c) => {
              if (!best) return c;
              const cs = state[c]; const bs = state[best];
              if (cs.atBase || cs.eliminated) return best;
              if (bs.atBase || bs.eliminated) return c;
              if (cs.pillarTier > bs.pillarTier) return c;
              if (cs.pillarTier === bs.pillarTier && cs.eggInHand && !bs.eggInHand) return c;
              return best;
            }, null);

            // ── BRACE: skip climb, guaranteed condor dodge ──
            if (strategy === 'brace') {
              const txt = pick(T.PILLAR_BRACE)(n);
              const ev = { type: 'brace', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
              tickEvents.push(ev); pillarEvents.push(ev);
              ep.chalMemberScores[n] += 1;
            }
            // ── TAUNT: redirect condor to rival ──
            else if (strategy === 'taunt') {
              const rivals = livePillar.filter(o => o !== n && !state[o].atBase && !state[o].eliminated && getBond(n, o) <= -2);
              const target = rivals.length > 0 ? rivals[Math.floor(Math.random() * rivals.length)] : null;
              if (target) {
                state[target].condorTaunted = true;
                addBond(n, target, -2); popDelta(n, -3); ep.chalMemberScores[n] += 1;
                const txt = pick(T.PILLAR_TAUNT)(n, target);
                const ev = { type: 'taunt', actor: n, target, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                tickEvents.push(ev); pillarEvents.push(ev);
                campEvents.push({ type: 'rapaTaunt', players: [n, target], badgeText: 'Condor Taunt', badgeClass: 'bad', desc: txt });
              } else {
                // Fallback to steady if no valid rival
                const txt = pick(T.PILLAR_STEADY)(n);
                const ev = { type: 'climb', player: n, tier: st.pillarTier, strategy: 'steady', zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                tickEvents.push(ev); pillarEvents.push(ev);
              }
            }
            // ── SHIELD: protect ally from condor this turn ──
            else if (strategy === 'shield') {
              const allies = livePillar.filter(o => o !== n && !state[o].atBase && !state[o].eliminated && getBond(n, o) >= 3);
              const target = allies.length > 0 ? allies.reduce((b, c) => state[c].pillarTier > state[b].pillarTier ? c : b) : null;
              if (target) {
                state[target].shieldedBy = n;
                addBond(n, target, 2.0); popDelta(n, 3); ep.chalMemberScores[n] += 2;
                const txt = pick(T.PILLAR_SHIELD_ALLY)(n, target);
                const ev = { type: 'shield-ally', actor: n, target, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                tickEvents.push(ev); pillarEvents.push(ev);
                campEvents.push({ type: 'rapaHeroic', players: [n, target], badgeText: 'Shield', badgeClass: 'green', desc: txt });
                _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores, 'danger', null);
              } else {
                const txt = pick(T.PILLAR_STEADY)(n);
                const ev = { type: 'climb', player: n, tier: st.pillarTier, strategy: 'steady', zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                tickEvents.push(ev); pillarEvents.push(ev);
              }
            }
            // ── SPRINT or STEADY: actual climbing ──
            else {
              const isSprint = strategy === 'sprint';

              // Condor attack check (reduced if bracing ally nearby, increased if taunted)
              let condorChance = condorTarget === n ? 0.55 : 0;
              if (st.condorTaunted) { condorChance = 0.80; st.condorTaunted = false; }
              if (hasCondorSplit) condorChance *= 0.5;
              if (st.shieldedBy) { condorChance = 0; st.shieldedBy = null; }
              const condorAttacksThis = Math.random() < condorChance;
              let condorHit = false;
              st.lastCondorHit = false;

              if (condorAttacksThis) {
                let dodgeStat, dodgeThreshold;
                const pTicks = st.pillarTicks;
                if (pTicks <= 4) {
                  dodgeStat = ps.intuition * 0.35 + ps.boldness * 0.25;
                  dodgeThreshold = 4.0;
                } else if (pTicks <= 8) {
                  dodgeStat = ps.mental * 0.30 + ps.physical * 0.25 + ps.intuition * 0.20;
                  dodgeThreshold = 5.5;
                } else {
                  dodgeStat = ps.strategic * 0.25 + ps.physical * 0.25 + ps.endurance * 0.20 + ps.intuition * 0.15;
                  dodgeThreshold = 7.0;
                }
                // Sprint penalty to dodge, rattled penalty
                if (isSprint) dodgeThreshold += 1.5;
                if (isRattled) dodgeThreshold += 1.0;
                const dodgeRoll = dodgeStat + noise(2.5);
                const maskSave = st.catcherMask && dodgeRoll < dodgeThreshold;

                if (dodgeRoll >= dodgeThreshold || maskSave) {
                  if (maskSave) st.catcherMask = false;
                  const txt = maskSave ? pick(T.CONDOR_MASK)(n) : pick(T.CONDOR_DODGE)(n);
                  const ev = { type: 'condor-dodge', player: n, maskUsed: maskSave, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                  tickEvents.push(ev); pillarEvents.push(ev);
                  popDelta(n, 2); ep.chalMemberScores[n] += 2;
                } else {
                  condorHit = true;
                  st.lastCondorHit = true;
                  const pTk = st.pillarTicks;
                  if (pTk >= 12) {
                    if (Math.random() < (st.basket ? 0.15 : 0.30)) {
                      st.eggInHand = null; st.totalEggsLost++; ep.chalMemberScores[n] -= 2;
                      st.pillarTier = 0; st.atBase = true;
                      const txt = pick(T.CONDOR_HIT)(n);
                      const ev = { type: 'condor-hit', player: n, severity: 'full', zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                      tickEvents.push(ev); pillarEvents.push(ev);
                      const dTxt = pick(T.DESCENT_CRASH)(n);
                      const dEv = { type: 'descent-crash', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: dTxt };
                      tickEvents.push(dEv); pillarEvents.push(dEv);
                    } else {
                      if (st.pillarTier > 0) st.pillarTier--;
                      const txt = pick(T.CONDOR_HIT)(n);
                      const ev = { type: 'condor-hit', player: n, severity: 'full', zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                      tickEvents.push(ev); pillarEvents.push(ev);
                    }
                  } else if (pTk >= 5) {
                    if (st.pillarTier > 0) st.pillarTier--;
                    const txt = pick(T.CONDOR_HIT)(n);
                    const ev = { type: 'condor-hit', player: n, severity: 'talon', zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                    tickEvents.push(ev); pillarEvents.push(ev);
                  } else {
                    const flinchTxt = `${n} flinches at the condor's warning swoop. A turn wasted.`;
                    const ev = { type: 'condor-flinch', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: flinchTxt };
                    tickEvents.push(ev); pillarEvents.push(ev);
                  }
                  popDelta(n, -1);
                }
              }

              // ── Climb / Nest (only if condor didn't stop them) ──
              if (!condorHit && st.eggInHand) {
                if (st.pillarTier >= 3) {
                  // AT SUMMIT — nest the egg
                  if (isNestBlocked) {
                    const blockTxt = `${n} reaches for the nest but can't place the egg — blocked by a rival! Turn wasted at the summit.`;
                    const blockEv = { type: 'nest-blocked', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: blockTxt };
                    tickEvents.push(blockEv); pillarEvents.push(blockEv);
                  } else {
                    const egg = st.eggInHand;
                    st.eggInHand = null;
                    st.nested++;
                    st.nestTicks.push(tick + 1);
                    ep.chalMemberScores[n] += 8;

                    // Nest rejection (condor knocks egg off — rare)
                    if (st.nested < EGGS_TO_WIN && st.pillarTicks >= 15 && Math.random() < 0.06) {
                      st.nested--;
                      st.nestTicks.pop();
                      st.totalEggsLost++;
                      ep.chalMemberScores[n] -= 4;
                      popDelta(n, -3);
                      const rejTxt = pick(T.NEST_REJECTION)(n);
                      const rejEv = { type: 'nest-rejection', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: rejTxt };
                      tickEvents.push(rejEv); pillarEvents.push(rejEv);
                      campEvents.push({ type: 'rapaCondor', players: [n], badgeText: 'Nest Rejected', badgeClass: 'bad', desc: rejTxt });
                    }

                    if (st.nested >= EGGS_TO_WIN) {
                      const txt = pick(T.NEST_EGG)(n, st.nested);
                      const ev = { type: 'nest', player: n, nested: st.nested, eggColor: egg.color, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                      tickEvents.push(ev); pillarEvents.push(ev);
                      winner = n;
                    } else {
                      st.pillarTier = 0; st.atBase = true;
                      const dTxt = pick(T.DESCENT_NEST)(n, st.nested);
                      const dEv = { type: 'descent-nest', player: n, nested: st.nested, eggColor: egg.color, zone: 3, tick: tick + 1, round: pillarRound, text: dTxt };
                      tickEvents.push(dEv); pillarEvents.push(dEv);
                    }
                  }
                } else {
                  // CLIMBING — strategy determines outcome
                  const rattledPenalty = isRattled ? -1.5 : 0;
                  const pepMod = hasPepTalk ? 1.5 : 0;
                  const rivalryMod = hasRivalry ? 1.5 : 0;
                  const basketMod = st.basket ? 1.0 : 0;

                  if (isSprint) {
                    // SPRINT: +2 tiers possible, but higher threshold + fumble risk
                    const sprintThreshold = 6.0;
                    const sprintRoll = ps.physical * 0.45 + ps.boldness * 0.35 + ps.endurance * 0.2
                      + basketMod + rivalryMod + pepMod + rattledPenalty + noise(2.5);

                    if (sprintRoll >= sprintThreshold) {
                      const gain = (sprintRoll >= sprintThreshold + 2.5 && st.pillarTier < 2) ? 2 : (st.pillarTier < 3 ? Math.min(2, 3 - st.pillarTier) : 1);
                      st.pillarTier = Math.min(3, st.pillarTier + gain);
                      ep.chalMemberScores[n] += gain * 3;
                      const txt = pick(T.PILLAR_SPRINT)(n);
                      const ev = { type: 'sprint', player: n, tier: st.pillarTier, gain, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                      tickEvents.push(ev); pillarEvents.push(ev);

                      // High fumble risk on sprint
                      const fumbleChance = 0.08 + (st.pillarTier >= 3 ? 0.05 : 0) + (hasRivalry ? 0.05 : 0);
                      if (Math.random() < fumbleChance) {
                        st.eggInHand = null; st.totalEggsLost++;
                        ep.chalMemberScores[n] -= 2;
                        st.pillarTier = 0; st.atBase = true;
                        const fTxt = pick(T.PILLAR_FUMBLE)(n);
                        const fEv = { type: 'pillar-fumble', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: fTxt };
                        tickEvents.push(fEv); pillarEvents.push(fEv);
                        const dTxt = pick(T.DESCENT_CRASH)(n);
                        const dEv = { type: 'descent-crash', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: dTxt };
                        tickEvents.push(dEv); pillarEvents.push(dEv);
                      }
                    } else {
                      // Sprint fail — lose a tier + possible egg break
                      if (st.pillarTier > 0) st.pillarTier--;
                      const breakChance = st.basket ? 0.08 : 0.18;
                      if (Math.random() < breakChance) {
                        st.eggInHand = null; st.totalEggsLost++;
                        ep.chalMemberScores[n] -= 3;
                        st.pillarTier = 0; st.atBase = true;
                        const txt = pick(T.PILLAR_SPRINT_FAIL)(n);
                        const ev = { type: 'sprint-fail', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                        tickEvents.push(ev); pillarEvents.push(ev);
                        const dTxt = pick(T.DESCENT_CRASH)(n);
                        const dEv = { type: 'descent-crash', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: dTxt };
                        tickEvents.push(dEv); pillarEvents.push(dEv);
                      } else {
                        const txt = pick(T.PILLAR_SPRINT_FAIL)(n);
                        const ev = { type: 'sprint-fail', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                        tickEvents.push(ev); pillarEvents.push(ev);
                      }
                    }
                  } else {
                    // STEADY: reliable +1, low fumble
                    const steadyThreshold = st.pillarTier >= 2 ? 4.5 : 3.5;
                    const steadyRoll = ps.endurance * 0.35 + ps.physical * 0.30 + ps.mental * 0.20
                      + basketMod + pepMod + rattledPenalty + noise(2.5);

                    if (steadyRoll >= steadyThreshold) {
                      st.pillarTier++;
                      st.pillarTier = Math.min(st.pillarTier, 3);
                      ep.chalMemberScores[n] += 3;
                      const txt = pick(T.PILLAR_STEADY)(n);
                      const ev = { type: 'climb', player: n, tier: st.pillarTier, strategy: 'steady', zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                      tickEvents.push(ev); pillarEvents.push(ev);

                      // Low fumble
                      const fumbleChance = st.pillarTier >= 3 ? 0.03 : 0.01;
                      if (Math.random() < fumbleChance) {
                        st.eggInHand = null; st.totalEggsLost++;
                        ep.chalMemberScores[n] -= 2;
                        st.pillarTier = 0; st.atBase = true;
                        const fTxt = pick(T.PILLAR_FUMBLE)(n);
                        const fEv = { type: 'pillar-fumble', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: fTxt };
                        tickEvents.push(fEv); pillarEvents.push(fEv);
                        const dTxt = pick(T.DESCENT_CRASH)(n);
                        const dEv = { type: 'descent-crash', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: dTxt };
                        tickEvents.push(dEv); pillarEvents.push(dEv);
                      }
                    } else {
                      // Steady fail — might slip but rarely break
                      if (st.pillarTier > 0 && Math.random() < 0.25) st.pillarTier--;
                      const breakChance = st.basket ? 0.02 : 0.06;
                      if (Math.random() < breakChance) {
                        st.eggInHand = null; st.totalEggsLost++;
                        ep.chalMemberScores[n] -= 2;
                        st.pillarTier = 0; st.atBase = true;
                        const txt = pick(T.PILLAR_FALL)(n);
                        const ev = { type: 'fall-break', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                        tickEvents.push(ev); pillarEvents.push(ev);
                        const dTxt = pick(T.DESCENT_CRASH)(n);
                        const dEv = { type: 'descent-crash', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: dTxt };
                        tickEvents.push(dEv); pillarEvents.push(dEv);
                      } else {
                        const txt = pick(T.PILLAR_FALL)(n);
                        const ev = { type: 'slip', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                        tickEvents.push(ev); pillarEvents.push(ev);
                      }
                    }
                  }

                  // Desperate throw (tier 2, 1 away from winning, behind)
                  if (!winner && st.eggInHand && st.pillarTier === 2 && st.nested === EGGS_TO_WIN - 1 && Math.random() < 0.20) {
                    const behind = active.some(o => o !== n && state[o].nested > st.nested);
                    if (behind) {
                      const throwRoll = ps.mental * 0.2 + ps.physical * 0.3 + noise(3);
                      if (throwRoll >= 7.5) {
                        st.eggInHand = null;
                        st.nested++;
                        st.nestTicks.push(tick + 1);
                        ep.chalMemberScores[n] += 13;
                        popDelta(n, 5);
                        const txt = pick(T.SOCIAL_DESPERATE_THROW)(n);
                        const ev = { type: 'desperate-throw', player: n, success: true, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                        tickEvents.push(ev); pillarEvents.push(ev);
                        campEvents.push({ type: 'rapaClutch', players: [n], badgeText: 'Desperate Throw!', badgeClass: 'win', desc: txt });
                        if (st.nested >= EGGS_TO_WIN) { winner = n; }
                        else { st.pillarTier = 0; st.atBase = true; }
                      } else {
                        st.eggInHand = null; st.totalEggsLost++;
                        st.pillarTier = 0; st.atBase = true;
                        ep.chalMemberScores[n] -= 5;
                        popDelta(n, -2);
                        const txt = pick(T.SOCIAL_DESPERATE_FAIL)(n);
                        const ev = { type: 'desperate-throw', player: n, success: false, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                        tickEvents.push(ev); pillarEvents.push(ev);
                        campEvents.push({ type: 'rapaBacktrack', players: [n], badgeText: 'Sent Back', badgeClass: '', desc: txt });
                      }
                    }
                  }
                }

                // Wind gust — rare hazard at high tiers
                if (!winner && st.pillarTier >= 2 && st.eggInHand && Math.random() < 0.03) {
                  st.eggInHand = null; st.totalEggsLost++;
                  st.pillarTier = 0; st.atBase = true;
                  ep.chalMemberScores[n] -= 3;
                  popDelta(n, -1);
                  const wTxt = pick(T.WIND_GUST)(n);
                  const wEv = { type: 'wind-gust', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: wTxt };
                  tickEvents.push(wEv); pillarEvents.push(wEv);
                  campEvents.push({ type: 'rapaHazard', players: [n], badgeText: 'Wind Gust', badgeClass: '', desc: wTxt });
                  const dTxt = pick(T.DESCENT_CRASH)(n);
                  const dEv = { type: 'descent-crash', player: n, zone: 3, tick: tick + 1, round: pillarRound, text: dTxt };
                  tickEvents.push(dEv); pillarEvents.push(dEv);
                }

                // Egg catch — ally below saves a nearly-dropped egg
                if (!winner && st.eggInHand && livePillar.length >= 2) {
                  const below = livePillar.filter(o => o !== n && state[o].pillarTier < st.pillarTier && !state[o].atBase && getBond(n, o) >= 2);
                  if (below.length > 0 && Math.random() < 0.12) {
                    const catcher = below[Math.floor(Math.random() * below.length)];
                    const catchRoll = pStats(catcher).intuition * 0.3 + pStats(catcher).physical * 0.3 + noise(2);
                    if (catchRoll >= 6.5) {
                      addBond(n, catcher, 3.0); popDelta(catcher, 4); ep.chalMemberScores[catcher] += 2;
                      const txt = pick(T.SOCIAL_CATCH)(catcher, n);
                      const ev = { type: 'egg-catch', actor: catcher, target: n, zone: 3, tick: tick + 1, round: pillarRound, text: txt };
                      tickEvents.push(ev); pillarEvents.push(ev);
                      campEvents.push({ type: 'rapaCatch', players: [catcher, n], badgeText: 'Mid-Air Save', badgeClass: 'green', desc: txt });
                    }
                  }
                }
              }
            }
          }

          // ── Interspersed social event (every 2-3 turns within a round) ──
          if (pillarTurnsSinceSocial >= 2 && Math.random() < 0.55 && livePillar.length >= 2) {
            pillarTurnsSinceSocial = 0;
            _firePillarSocial(livePillar, n);
          }
        }
      }
    }

    if (winner) {
      raceTicks.push({ tick: tick + 1, events: tickEvents, playerStates: JSON.parse(JSON.stringify(state)) });
      break;
    }

    // ════════════════════════════════════════
    // ZONE 2: Underground Cave
    // ════════════════════════════════════════

    // ── Collect per-player events into a bucket, then interleave at the end ──
    const _cavePlayerEvents = {}; // name → [ev, ...]
    const _caveSharedEvents = []; // events not tied to one player (stampede, social, headers)

    // Helper: pick pace for a player this segment
    function _pickCavePace(n, st) {
      const ps = pStats(n);
      const a = arch(n);
      // Base tier: 0=careful, 1=steady, 2=rush
      let tier = 1; // start steady

      // Archetype lean
      if (a === 'hothead' || a === 'challenge-beast' || a === 'chaos-agent') tier += 0.8;
      else if (a === 'wildcard') tier += 0.4;
      else if (a === 'loyal-soldier' || a === 'underdog' || a === 'goat') tier -= 0.6;
      else if (a === 'hero') tier += 0.2;

      // Boldness + temperament
      tier += (ps.boldness - 5) * 0.15 + (ps.temperament - 5) * 0.1;

      // Strategic awareness: ahead → slow down, behind → push harder
      const othersCave = caveOccupants.filter(o => o !== n && !state[o].eliminated);
      const myProg = st.caveSegment;
      const avgProg = othersCave.length > 0 ? othersCave.reduce((s, o) => s + state[o].caveSegment, 0) / othersCave.length : myProg;
      if (ps.strategic >= 5 && myProg > avgProg + 0.5) tier -= 0.5;
      if (myProg < avgProg - 0.5) tier += 0.5;

      // Rivalry: if rival 1+ segment ahead, bump aggression
      for (const o of othersCave) {
        if (getBond(n, o) <= -3 && state[o].caveSegment > st.caveSegment) { tier += 0.6; break; }
      }

      // Egg armor confidence
      if (st.caveEggArmor === 1) tier += 0.5;
      else if (st.caveEggArmor === -1) tier -= 0.5;
      if (st.basket) tier -= 0.2; // baskets make careful less necessary, slightly lean steady

      // Last cave occupant awareness
      if (othersCave.length === 0 && ps.strategic >= 5) tier += 0.5;

      tier += noise(1.0); // randomness

      if (tier >= 1.6) return 'rush';
      if (tier <= 0.4) return 'careful';
      return 'steady';
    }

    // ── Phase 0b: Cave tick tracking ──
    for (const n of [...caveOccupants]) {
      const st = state[n];
      if (st.eliminated || st.zone !== 2) continue;
      st.caveTicks = (st.caveTicks || 0) + 1;
    }

    // ── Phase 1: Determine pace for each cave occupant this tick ──
    for (const n of [...caveOccupants]) {
      const st = state[n];
      if (st.eliminated || st.zone !== 2) continue;
      if (!_cavePlayerEvents[n]) _cavePlayerEvents[n] = [];

      // If this is the first time a player enters a segment, inject a segment header
      const currentSeg = clamp(st.caveSegment, 0, 2);
      if (!st.caveSegEntered.has(currentSeg)) {
        st.caveSegEntered.add(currentSeg);
        const segId = CAVE_SEGMENTS[currentSeg].id;
        const headerPool = segId === 'boulder' ? T.CAVE_SEG_HEADER_BOULDER : segId === 'squeeze' ? T.CAVE_SEG_HEADER_SQUEEZE : T.CAVE_SEG_HEADER_EXIT;
        const hdrEv = { type: 'segment-header', segment: segId, segName: CAVE_SEGMENTS[currentSeg].name, zone: 2, tick: tick + 1, text: pick(headerPool), player: n };
        _cavePlayerEvents[n].push(hdrEv);
      }

      // Pick pace — only emit card on first attempt at each segment
      const pace = _pickCavePace(n, st);
      st.cavePace = pace;
      if (!st.cavePaceShown.has(currentSeg)) {
        st.cavePaceShown.add(currentSeg);
        const pacePool = pace === 'rush' ? T.CAVE_PACE_RUSH : pace === 'careful' ? T.CAVE_PACE_CAREFUL : T.CAVE_PACE_STEADY;
        const paceEv = { type: 'cave-pace', player: n, pace, zone: 2, tick: tick + 1, text: pick(pacePool)(n), entryEggs: st.carrying.length };
        _cavePlayerEvents[n].push(paceEv);
      }
    }

    // ── Phase 2: Python encounters (2-3 total per cave run, not every tick) ──
    // Track python encounters on the outer scope
    if (!ep._pythonEncounters) ep._pythonEncounters = 0;
    const pythonMaxEncounters = caveOccupants.length >= 4 ? 3 : 2;
    const pythonChance = ep._pythonEncounters < pythonMaxEncounters ? 0.30 : 0;
    const liveCavers = caveOccupants.filter(n => !state[n].eliminated && state[n].zone === 2);
    if (liveCavers.length > 0 && Math.random() < pythonChance) {
      // Pick a target — python tends to target whoever is furthest ahead or rushing
      const sortedByProg = [...liveCavers].sort((a, b) => state[b].caveSegment - state[a].caveSegment || (state[b].cavePace === 'rush' ? 1 : 0) - (state[a].cavePace === 'rush' ? 1 : 0));
      const target = sortedByProg[0];
      const tSt = state[target];
      const tPs = pStats(target);
      ep._pythonEncounters++;
      if (!_cavePlayerEvents[target]) _cavePlayerEvents[target] = [];

      // Decide encounter type: coil block (50%) or egg strike (50%)
      if (Math.random() < 0.50) {
        // COIL BLOCK — blocks passage, player must push past or wait
        const boldRoll = tPs.boldness * 0.4 + tPs.physical * 0.2 + noise(2.5);
        if (boldRoll >= 6.0) {
          // Push past — brave, no time lost
          const txt = pick(T.PYTHON_COIL_PUSH)(target);
          const ev = { type: 'python-coil-push', player: target, zone: 2, tick: tick + 1, text: txt };
          _cavePlayerEvents[target].push(ev);
          ep.chalMemberScores[target] += 2;
          popDelta(target, 2);
          campEvents.push({ type: 'rapaPython', players: [target], badgeText: 'Python Brave', badgeClass: 'green', desc: txt });
        } else {
          // Wait — lose a tick (mark as stuck)
          tSt.caveStuck = true;
          tSt.caveStuckTick = tick + 1;
          const txt = pick(T.PYTHON_COIL_WAIT)(target);
          const ev = { type: 'python-coil-wait', player: target, zone: 2, tick: tick + 1, text: txt };
          _cavePlayerEvents[target].push(ev);
          campEvents.push({ type: 'rapaPython', players: [target], badgeText: 'Python Block', badgeClass: '', desc: txt });
        }
      } else {
        // EGG STRIKE — python lunges at eggs
        const dodgeRoll = tPs.boldness * 0.3 + tPs.intuition * 0.3 + (tSt.cavePace === 'rush' ? -1 : tSt.cavePace === 'careful' ? 1.5 : 0) + noise(2.5);
        if (dodgeRoll >= 5.5) {
          // Dodge — eggs safe
          const txt = pick(T.PYTHON_STRIKE_DODGE)(target);
          const ev = { type: 'python-strike-dodge', player: target, zone: 2, tick: tick + 1, text: txt };
          _cavePlayerEvents[target].push(ev);
          ep.chalMemberScores[target] += 2;
          popDelta(target, 2);
          campEvents.push({ type: 'rapaPython', players: [target], badgeText: 'Python Dodge', badgeClass: 'green', desc: txt });
        } else {
          // Strike hits — lose exactly 1 egg (capped)
          if (tSt.carrying.length > 0) {
            tSt.carrying.pop();
            tSt.totalEggsLost++;
            ep.chalMemberScores[target] -= 3;
            popDelta(target, -2);
            const txt = pick(T.PYTHON_STRIKE)(target);
            const ev = { type: 'python-strike', player: target, zone: 2, tick: tick + 1, text: txt };
            _cavePlayerEvents[target].push(ev);
            campEvents.push({ type: 'rapaPython', players: [target], badgeText: 'Python Strike', badgeClass: 'bad', desc: txt });
          } else {
            const txt = pick(T.PYTHON_COIL)(target);
            const ev = { type: 'python-coil', player: target, zone: 2, tick: tick + 1, text: txt };
            _cavePlayerEvents[target].push(ev);
          }
        }

        // Distraction save — nearby ally draws python away (only if strike connected)
        if (dodgeRoll < 5.5) {
          const nearbyAllies = liveCavers.filter(o => o !== target && getBond(o, target) >= 2 && Math.abs(state[o].caveSegment - tSt.caveSegment) <= 1);
          if (nearbyAllies.length > 0 && Math.random() < 0.40) {
            const saver = nearbyAllies[Math.floor(Math.random() * nearbyAllies.length)];
            addBond(saver, target, 3.0); popDelta(saver, 3); ep.chalMemberScores[saver] += 3;
            const dTxt = pick(T.PYTHON_DISTRACTION)(saver, target);
            const dEv = { type: 'python-distraction', actor: saver, target, zone: 2, tick: tick + 1, text: dTxt };
            if (!_cavePlayerEvents[saver]) _cavePlayerEvents[saver] = [];
            _cavePlayerEvents[saver].push(dEv);
            campEvents.push({ type: 'rapaHeroic', players: [saver, target], badgeText: 'Python Save', badgeClass: 'green', desc: dTxt });
            _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores, 'danger', null);
          }
        }
      }
    }

    // ── Phase 3: Cave social events — guaranteed 1 per tick with 2+ occupants, chance of 2nd ──
    if (liveCavers.length >= 2) {
      const numSocial = 1 + (Math.random() < 0.35 ? 1 : 0);
      const usedPairs = new Set();
      for (let si = 0; si < numSocial && liveCavers.length >= 2; si++) {
        const shuffled = [...liveCavers].sort(() => Math.random() - 0.5);
        let ca = null, cb = null;
        for (let i = 0; i < shuffled.length - 1 && !ca; i++) {
          for (let j = i + 1; j < shuffled.length && !ca; j++) {
            const key = [shuffled[i], shuffled[j]].sort().join('|');
            if (!usedPairs.has(key)) { ca = shuffled[i]; cb = shuffled[j]; usedPairs.add(key); }
          }
        }
        if (!ca || !cb) break;
        if (state[ca].eliminated || state[cb].eliminated) continue;

        const bondAB = getBond(ca, cb);
        const segA = state[ca].caveSegment;
        const segB = state[cb].caveSegment;
        const sameSeg = segA === segB;

        // Shield (Boulder Corridor only, same segment, high bond)
        if (bondAB >= 3 && sameSeg && segA === 0 && Math.random() < 0.40) {
          const shieldRoll = pStats(ca).physical * 0.4 + pStats(ca).endurance * 0.3 + noise(2);
          if (shieldRoll >= 5.5) {
            if (state[cb].caveSegment < 4) state[cb].caveSegment++;
            ep.chalMemberScores[ca] += 1; ep.chalMemberScores[cb] += 2;
            addBond(ca, cb, 2.0); popDelta(ca, 2);
            state[ca].shieldDebuff = true;
            const txt = pick(T.SOCIAL_SHIELD)(ca, cb);
            const ev = { type: 'shield', actor: ca, target: cb, zone: 2, tick: tick + 1, text: txt };
            _caveSharedEvents.push(ev);
            campEvents.push({ type: 'rapaShield', players: [ca, cb], badgeText: 'Boulder Shield', badgeClass: 'green', desc: txt });
          }
        }
        // Shove (villain only, same segment, negative bond)
        else if (canScheme(ca) && bondAB <= -2 && sameSeg && Math.random() < 0.35) {
          ep.chalMemberScores[ca] += 1; addBond(ca, cb, -2.0); popDelta(ca, -2);
          if (state[cb].carrying.length > 0 && Math.random() < 0.45) {
            state[cb].carrying.pop(); ep.chalMemberScores[cb] -= 2;
          }
          const txt = pick(T.SOCIAL_SHOVE)(ca, cb);
          const ev = { type: 'shove', actor: ca, target: cb, zone: 2, tick: tick + 1, text: txt };
          _caveSharedEvents.push(ev);
          campEvents.push({ type: 'rapaSaboteur', players: [ca, cb], badgeText: 'Egg Destroyer', badgeClass: 'bad', desc: txt });
        }
        // Passage block (villain, squeeze segment, same segment)
        else if (canScheme(ca) && sameSeg && segA === 1 && Math.random() < 0.30) {
          state[cb].caveSegment = Math.max(0, state[cb].caveSegment - 1);
          ep.chalMemberScores[ca] += 1; ep.chalMemberScores[cb] -= 1;
          addBond(ca, cb, -1.5); popDelta(ca, -1);
          const txt = pick(T.SOCIAL_CAVE_BLOCK)(ca, cb);
          const ev = { type: 'cave-block', actor: ca, target: cb, zone: 2, tick: tick + 1, text: txt };
          _caveSharedEvents.push(ev);
          campEvents.push({ type: 'rapaSaboteur', players: [ca, cb], badgeText: 'Blocked', badgeClass: 'bad', desc: txt });
        }
        // Panic chain (Narrow Squeeze, same segment)
        else if (sameSeg && segA === 1 && Math.random() < 0.30) {
          const tempA = pStats(ca).temperament + noise(2);
          const tempB = pStats(cb).temperament + noise(2);
          const calmer = tempA > tempB ? ca : cb;
          const panicker = calmer === ca ? cb : ca;
          if (tempA <= 4 && tempB <= 4) {
            const txt = pick(T.SOCIAL_PANIC_CHAIN)(ca, cb, false);
            const ev = { type: 'panic-chain', actor: ca, target: cb, zone: 2, tick: tick + 1, calmer: false, text: txt };
            _caveSharedEvents.push(ev);
            campEvents.push({ type: 'rapaPanic', players: [ca, cb], badgeText: 'Panic', badgeClass: '', desc: txt });
          } else {
            addBond(calmer, panicker, 1.0);
            const txt = pick(T.SOCIAL_PANIC_CHAIN)(calmer, panicker, true);
            const ev = { type: 'panic-chain', actor: calmer, target: panicker, zone: 2, tick: tick + 1, calmer: true, text: txt };
            _caveSharedEvents.push(ev);
            campEvents.push({ type: 'rapaHeroic', players: [calmer, panicker], badgeText: 'Heroic Save', badgeClass: 'green', desc: txt });
          }
        }
        // Warning call (different segments, ahead player warns behind)
        else if (!sameSeg && bondAB >= 1 && Math.abs(segA - segB) >= 1 && Math.random() < 0.35) {
          const ahead = segA > segB ? ca : cb;
          const behind = ahead === ca ? cb : ca;
          const aheadSeg = state[ahead].caveSegment;
          const segName = aheadSeg === 0 ? 'boulder' : aheadSeg === 1 ? 'squeeze' : 'exit';
          ep.chalMemberScores[behind] += 1;
          addBond(ahead, behind, 1.0); popDelta(ahead, 1);
          const txt = pick(T.SOCIAL_CAVE_WARN)(ahead, behind, segName);
          const ev = { type: 'cave-warn', actor: ahead, target: behind, zone: 2, tick: tick + 1, text: txt };
          _caveSharedEvents.push(ev);
          campEvents.push({ type: 'rapaHeroic', players: [ahead, behind], badgeText: 'Warning', badgeClass: 'green', desc: txt });
        }
        // Egg carry (same segment, high bond, squeeze)
        else if (bondAB >= 4 && sameSeg && segA === 1 && Math.random() < 0.25) {
          ep.chalMemberScores[ca] += 1; ep.chalMemberScores[cb] += 1;
          addBond(ca, cb, 2.0); popDelta(ca, 1);
          const txt = pick(T.SOCIAL_CAVE_CARRY)(ca, cb);
          const ev = { type: 'cave-carry', actor: ca, target: cb, zone: 2, tick: tick + 1, text: txt };
          _caveSharedEvents.push(ev);
          campEvents.push({ type: 'rapaCatch', players: [ca, cb], badgeText: 'Egg Carry', badgeClass: 'green', desc: txt });
        }
        // Cave race (same segment, any bond)
        else if (sameSeg && Math.random() < 0.25) {
          const rollA = pStats(ca).physical * 0.3 + pStats(ca).endurance * 0.3 + noise(2.5);
          const rollB = pStats(cb).physical * 0.3 + pStats(cb).endurance * 0.3 + noise(2.5);
          const raceWinner = rollA >= rollB ? ca : cb;
          ep.chalMemberScores[raceWinner] += 2;
          if (bondAB <= 0) addBond(ca, cb, -0.5);
          const txt = pick(T.SOCIAL_CAVE_RACE)(ca, cb, raceWinner);
          const ev = { type: 'cave-race', actor: ca, target: cb, winner: raceWinner, zone: 2, tick: tick + 1, text: txt };
          _caveSharedEvents.push(ev);
        }
        // Egg rescue (positive bond)
        else if (bondAB >= 2 && Math.random() < 0.25) {
          const rescueRoll = pStats(ca).intuition * 0.3 + pStats(ca).physical * 0.3 + noise(2);
          if (rescueRoll >= 6.0) {
            addBond(ca, cb, 2.5); popDelta(ca, 3); ep.chalMemberScores[ca] += 2;
            const txt = pick(T.SOCIAL_EGG_RESCUE)(ca, cb);
            const ev = { type: 'egg-rescue', actor: ca, target: cb, zone: 2, tick: tick + 1, text: txt };
            _caveSharedEvents.push(ev);
            campEvents.push({ type: 'rapaCatch', players: [ca, cb], badgeText: 'Mid-Air Save', badgeClass: 'green', desc: txt });
          }
        }
        // Cave trash talk (negative bond or villain, same segment)
        else if (sameSeg && (bondAB <= -1 || canScheme(ca)) && Math.random() < 0.30) {
          const rattled = pStats(cb).temperament + noise(2) < 5;
          if (rattled) ep.chalMemberScores[cb] -= 1;
          addBond(ca, cb, -1.0); popDelta(ca, rattled ? -1 : 0);
          const txt = pick(T.SOCIAL_CAVE_TRASH)(ca, cb);
          const ev = { type: 'cave-trash', actor: ca, target: cb, rattled, zone: 2, tick: tick + 1, text: txt };
          _caveSharedEvents.push(ev);
          campEvents.push({ type: 'rapaSaboteur', players: [ca, cb], badgeText: 'Cave Trash Talk', badgeClass: 'bad', desc: txt });
        }
        // Exit distraction (exit passage, positive bond)
        else if (sameSeg && segA === 2 && bondAB >= 2 && Math.random() < 0.30) {
          const distractRoll = pStats(ca).boldness * 0.4 + pStats(ca).endurance * 0.3 + noise(2);
          if (distractRoll >= 5.5) {
            addBond(ca, cb, 2.0); popDelta(ca, 2); ep.chalMemberScores[ca] += 2;
            state[cb].caveSegment = 3; // auto-pass exit
            const txt = pick(T.SOCIAL_EXIT_DISTRACTION)(ca, cb);
            const ev = { type: 'exit-distraction', actor: ca, target: cb, zone: 2, tick: tick + 1, text: txt };
            _caveSharedEvents.push(ev);
            campEvents.push({ type: 'rapaHeroic', players: [ca, cb], badgeText: 'Heroic Save', badgeClass: 'green', desc: txt });
          }
        }
      }
    }

    // ── Phase 4: Stampede check (3+ players in same segment) ──
    const segmentGroups = {};
    for (const n of liveCavers) {
      const seg = state[n].caveSegment;
      if (!segmentGroups[seg]) segmentGroups[seg] = [];
      segmentGroups[seg].push(n);
    }
    for (const [seg, group] of Object.entries(segmentGroups)) {
      if (group.length >= 3 && Math.random() < 0.35) {
        let worstN = null, worstRoll = Infinity;
        for (const n of group) {
          const r = pStats(n).physical * 0.3 + pStats(n).endurance * 0.3 + noise(2.5);
          if (r < worstRoll) { worstRoll = r; worstN = n; }
        }
        if (worstN && state[worstN].caveSegment > 0) {
          state[worstN].caveSegment = Math.max(0, state[worstN].caveSegment - 1);
          if (state[worstN].carrying.length > 0 && Math.random() < 0.4) {
            state[worstN].carrying.pop(); state[worstN].totalEggsLost++; ep.chalMemberScores[worstN] -= 2;
          }
          const txt = pick(T.SOCIAL_STAMPEDE)(worstN, group.filter(x => x !== worstN));
          const ev = { type: 'stampede', player: worstN, others: group.filter(x => x !== worstN), zone: 2, tick: tick + 1, text: txt };
          _caveSharedEvents.push(ev);
          campEvents.push({ type: 'rapaStampede', players: group, badgeText: 'Stampede', badgeClass: '', desc: txt });
        }
      }
    }

    // ── Phase 5: Cave segment progression (pace-driven) ──
    let lastCaveExitOrder = 0;
    for (const n of [...caveOccupants]) {
      const st = state[n];
      if (st.eliminated) continue;
      if (st.zone !== 2) continue;
      if (!_cavePlayerEvents[n]) _cavePlayerEvents[n] = [];

      // Already exited via social event (exit distraction)
      if (st.caveSegment >= 3) {
        st.zone = 3; st.caveSegment = 0; st.ticksInZone = 0;
        if (!st.pillarStartEggs) st.pillarStartEggs = st.carrying.length;
        if (!firstCaveExiter) {
          firstCaveExiter = n; st.catcherMask = true;
          const txt = `${n} bursts out of the cave first — and grabs the catcher's mask! It blocks one condor strike on the pillar, saving an egg that would otherwise break.`;
          const ev = { type: 'cave-exit', player: n, first: true, zone: 2, tick: tick + 1, text: txt };
          _cavePlayerEvents[n].push(ev);
        } else {
          const txt = `${n} clears the cave and charges for the pillar.`;
          const ev = { type: 'cave-exit', player: n, first: false, zone: 2, tick: tick + 1, text: txt };
          _cavePlayerEvents[n].push(ev);
        }
        ep.chalMemberScores[n] += 2;
        continue;
      }

      // If stuck (from python coil wait or getting stuck mechanic last iteration), skip progression this tick
      if (st.caveStuck) {
        st.caveStuck = false;
        continue;
      }

      const ps = pStats(n);
      const seg = CAVE_SEGMENTS[clamp(st.caveSegment, 0, 2)];
      const pace = st.cavePace || 'steady';

      // Pace modifiers for ticks to clear
      // Rush: always 1 tick. Steady: 1-2 ticks (roll-based). Careful: always 2 ticks (but first tick generates no progression event — handled via stuck).
      let ticksToClear;
      if (pace === 'rush') {
        ticksToClear = 1;
      } else if (pace === 'careful') {
        // Careful always takes 2 ticks — first tick is "careful approach" (no progression)
        if (!st._carefulTick) {
          st._carefulTick = true;
          // No progression this tick — just approaching carefully
          continue;
        } else {
          ticksToClear = 1; // second tick, now progress
          st._carefulTick = false;
        }
      } else {
        // Steady: 60% chance of clearing in 1 tick, 40% needs 2
        const steadyRoll = ps.endurance * 0.3 + ps.physical * 0.2 + noise(2.5);
        if (steadyRoll >= 5.0 || st._steadySecondTick) {
          ticksToClear = 1;
          st._steadySecondTick = false;
        } else {
          st._steadySecondTick = true;
          continue; // Will progress next tick
        }
      }

      // Getting stuck check (rush: ~20%, steady: ~10%, careful: 0%)
      const stuckChance = pace === 'rush' ? 0.20 : pace === 'steady' ? 0.10 : 0;
      if (Math.random() < stuckChance) {
        st.caveStuck = true;
        st.caveStuckTick = tick + 1;
        const stuckPool = seg.id === 'boulder' ? T.CAVE_STUCK_BOULDER : seg.id === 'squeeze' ? T.CAVE_STUCK_SQUEEZE : T.CAVE_STUCK_EXIT;
        const stuckTxt = pick(stuckPool)(n);
        const stuckBadge = seg.id === 'boulder' ? 'BOULDER STUCK' : seg.id === 'squeeze' ? 'SQUEEZE STUCK' : 'EXIT PINNED';
        const stuckEv = { type: 'cave-stuck', player: n, segment: seg.id, zone: 2, tick: tick + 1, text: stuckTxt, stuckBadge };
        _cavePlayerEvents[n].push(stuckEv);
        continue; // Skip progression — stuck costs a tick
      }

      // Segment progression roll
      let adjustedThreshold = seg.threshold;
      if (seg.id === 'exit') {
        if (st.carrying.length === 1) adjustedThreshold = 5.0;
        else if (st.carrying.length === 2) adjustedThreshold = 5.5;
        else if (st.carrying.length >= 3) adjustedThreshold = 6.5;
      }

      const debuff = st.shieldDebuff ? -1 : 0;
      let roll = seg.stats.reduce((sum, [stat, w]) => sum + ps[stat] * w, 0) + noise(2.5) + debuff;

      // Pace modifier for break chance
      const paceBreakMul = pace === 'rush' ? 1.8 : pace === 'careful' ? 0.4 : 1.0;

      // Mercy rule: after 3 consecutive fails on same segment, auto-clear (with egg risk)
      if (st.caveSegFails >= 3) {
        roll = adjustedThreshold + 1; // force pass
        st.caveSegFails = 0;
      }

      if (roll >= adjustedThreshold) {
        st.caveSegFails = 0; // reset on success
        const fastTrack = (roll >= adjustedThreshold + 3.0 && st.caveSegment < 2);
        st.caveSegment += fastTrack ? 2 : 1;
        ep.chalMemberScores[n] += fastTrack ? 4 : 2;

        // Squeeze-crack: even on success, the tight passage can crack an egg (max 1)
        const sqArmorMod = st.caveEggArmor === 1 ? 0.5 : st.caveEggArmor === -1 ? 1.8 : 1.0;
        if (seg.id === 'squeeze' && st.carrying.length > 0 && Math.random() < (st.basket ? 0.04 : 0.12) * sqArmorMod * paceBreakMul) {
          st.carrying.pop();
          st.totalEggsLost++;
          ep.chalMemberScores[n] -= 2;
          const scTxt = pick(T.CAVE_SQUEEZE_CRACK)(n);
          const scEv = { type: 'squeeze-crack', player: n, zone: 2, tick: tick + 1, text: scTxt };
          _cavePlayerEvents[n].push(scEv);
        }

        if (st.caveSegment >= 3) {
          if (fastTrack) {
            const ftTexts = [
              `${n} doesn't stop — blasts through the Exit Passage without slowing down. Pure momentum.`,
              `${n} finds a shortcut through a side tunnel and skips the entire Exit Passage. Brilliant.`,
              `${n} hits a dead sprint and tears through the final stretch like the cave is chasing ${pronouns(n).obj}.`,
              `The exit passage is a blur. ${n} barely registers it — just runs straight through to daylight.`,
            ];
            const ftEv = { type: 'cave-advance', player: n, segment: 2, segName: 'Exit Passage', zone: 2, tick: tick + 1, text: pick(ftTexts), passBadge: 'FAST TRACK' };
            _cavePlayerEvents[n].push(ftEv);
          }
          st.zone = 3; st.caveSegment = 0; st.ticksInZone = 0;
          if (!st.pillarStartEggs) st.pillarStartEggs = st.carrying.length;
          lastCaveExitOrder++;
          if (!firstCaveExiter) {
            firstCaveExiter = n; st.catcherMask = true;
            const txt = `${n} bursts out of the cave first — and grabs the catcher's mask! It blocks one condor strike on the pillar, saving an egg that would otherwise break.`;
            const ev = { type: 'cave-exit', player: n, first: true, zone: 2, tick: tick + 1, text: txt };
            _cavePlayerEvents[n].push(ev);
          } else {
            const txt = `${n} clears the cave and charges for the pillar.`;
            const ev = { type: 'cave-exit', player: n, first: false, zone: 2, tick: tick + 1, text: txt };
            _cavePlayerEvents[n].push(ev);
          }
        } else {
          const segId = seg.id;
          const badge = segId === 'boulder' ? 'BOULDER DODGE' : segId === 'squeeze' ? 'SQUEEZE THROUGH' : 'EXIT DASH';
          const txt = segId === 'boulder' ? pick(T.CAVE_BOULDER_PASS)(n) :
                      segId === 'squeeze' ? pick(T.CAVE_SQUEEZE_PASS)(n) :
                      pick(T.CAVE_EXIT_PASS)(n);
          const ev = { type: 'cave-advance', player: n, segment: st.caveSegment, segName: seg.name, zone: 2, tick: tick + 1, text: txt, passBadge: badge };
          _cavePlayerEvents[n].push(ev);
        }
      } else {
        // Failure — max 1 egg lost per segment per player per tick (capped)
          st.caveSegFails++;
        {
          let extraBreak = (seg.id === 'exit' && st.carrying.length >= 3) ? 0.10 : 0;
          const armorMod = st.caveEggArmor === 1 ? 0.5 : st.caveEggArmor === -1 ? 1.8 : 1.0;
          const breakChance = ((st.basket ? seg.breakBasket : seg.breakChance) + extraBreak) * armorMod * paceBreakMul;
          // Roll once: if break, lose exactly 1 egg (not per-egg roll)
          const eggBreaks = st.carrying.length > 0 && Math.random() < breakChance;
          if (eggBreaks) {
            st.carrying.pop();
            st.totalEggsLost++;
            ep.chalMemberScores[n] -= 2;
            const segId = seg.id;
            const badge = segId === 'boulder' ? 'BOULDER HIT' : segId === 'squeeze' ? 'SQUEEZE CRACK' : 'EXIT CAUGHT';
            const bt = segId === 'boulder' ? pick(T.CAVE_BOULDER_FAIL)(n) :
                       segId === 'squeeze' ? pick(T.CAVE_SQUEEZE_FAIL)(n) :
                       pick(T.CAVE_EXIT_FAIL)(n);
            const ev = { type: 'cave-hazard', player: n, segment: segId, broken: 1, zone: 2, tick: tick + 1, text: bt, failBadge: badge };
            _cavePlayerEvents[n].push(ev);
          } else {
            const segId = seg.id;
            const badge = segId === 'boulder' ? 'BOULDER STUCK' : segId === 'squeeze' ? 'SQUEEZE STUCK' : 'EXIT PINNED';
            const safeTxt = segId === 'boulder' ? pick(T.CAVE_BOULDER_STUCK)(n) :
                            segId === 'squeeze' ? pick(T.CAVE_SQUEEZE_STUCK)(n) :
                            pick(T.CAVE_EXIT_STUCK)(n);
            const ev = { type: 'cave-hazard-safe', player: n, segment: segId, zone: 2, tick: tick + 1, text: safeTxt, safeBadge: badge };
            _cavePlayerEvents[n].push(ev);
          }

          if (st.carrying.length === 0) {
            st.eliminated = true; st.zone = 0;
            ep.chalMemberScores[n] -= 10;
            popDelta(n, -3);
            const backTxt = `${n} lost every egg in the cave. There's no going back. They're out.`;
            const ev = { type: 'cave-eliminated', player: n, zone: 2, tick: tick + 1, text: backTxt };
            _cavePlayerEvents[n].push(ev);
            campEvents.push({ type: 'rapaEliminated', players: [n], badgeText: 'Cave Wipeout', badgeClass: 'bad', desc: backTxt });
          }
        }
      }
    }

    // ── Phase 5b: Forced cave exit — after 10 cave ticks, force remaining players out ──
    {
      const stuckInCave = caveOccupants.filter(n => state[n].zone === 2 && !state[n].eliminated && (state[n].caveTicks || 0) >= 10);
      for (const n of stuckInCave) {
        const st = state[n];
        st.zone = 3; st.caveSegment = 0; st.ticksInZone = 0;
        if (!st.pillarStartEggs) st.pillarStartEggs = st.carrying.length;
        if (!firstCaveExiter) { firstCaveExiter = n; st.catcherMask = true; }
        if (!_cavePlayerEvents[n]) _cavePlayerEvents[n] = [];
        const pn = pronouns(n);
        const forcedTexts = [
          `${n} finally stumbles out of the cave, battered and behind. The cave almost won.`,
          `After what feels like an eternity, ${n} drags ${pn.ref} out of the darkness. Barely.`,
          `${n} emerges from the cave looking like ${pn.sub}'ve been through a war. And ${pn.sub} ha${pn.sub === 'they' ? 've' : 's'}.`,
          `The cave spits ${n} out. Not because it's generous — because even it got bored.`,
        ];
        const txt = pick(forcedTexts);
        const ev = { type: 'cave-exit', player: n, first: false, forced: true, zone: 2, tick: tick + 1, text: txt };
        _cavePlayerEvents[n].push(ev);
        ep.chalMemberScores[n] -= 3;
      }
    }

    // ── Phase 6: Last out penalty ──
    // When all cave occupants have exited or been eliminated, the last exiter gets slowPillarStart
    {
      const stillInCave = caveOccupants.filter(n => state[n].zone === 2 && !state[n].eliminated);
      const allExited = caveOccupants.filter(n => state[n].zone === 3 && !state[n].eliminated);
      if (stillInCave.length === 0 && allExited.length >= 2) {
        // Last exiter = the one who exited most recently (highest caveTicks or forced)
        let lastExiter = null;
        let maxTicks = -1;
        for (const n of allExited) {
          if (n === firstCaveExiter) continue;
          const ct = state[n].caveTicks || 0;
          if (ct > maxTicks) { maxTicks = ct; lastExiter = n; }
        }
        if (lastExiter && !state[lastExiter].slowPillarStart) {
          state[lastExiter].slowPillarStart = true;
          const lpn = pronouns(lastExiter);
          const slowTxt = `${lastExiter} is the last one out of the cave. ${lpn.Sub}'ll start the pillar a step behind — no climb on ${lpn.posAdj} first tick.`;
          const slowEv = { type: 'cave-last-out', player: lastExiter, zone: 2, tick: tick + 1, text: slowTxt };
          if (!_cavePlayerEvents[lastExiter]) _cavePlayerEvents[lastExiter] = [];
          _cavePlayerEvents[lastExiter].push(slowEv);
        }
      }
    }

    // ── Phase 7: Interleave cave events round-robin and push to tickEvents/caveEvents ──
    {
      // Collect all player names that have events
      const cavePlayerNames = Object.keys(_cavePlayerEvents).filter(n => _cavePlayerEvents[n].length > 0);
      // Sort by cave segment (furthest ahead first) for display priority
      cavePlayerNames.sort((a, b) => (state[b]?.caveSegment || 0) - (state[a]?.caveSegment || 0));

      // Round-robin interleave: take one event from each player in turn
      const pointers = {};
      for (const n of cavePlayerNames) pointers[n] = 0;
      const interleaved = [];
      let anyLeft = true;
      while (anyLeft) {
        anyLeft = false;
        for (const n of cavePlayerNames) {
          if (pointers[n] < _cavePlayerEvents[n].length) {
            interleaved.push(_cavePlayerEvents[n][pointers[n]]);
            pointers[n]++;
            anyLeft = true;
          }
        }
      }

      // Insert shared events (social, stampede) at the end of each round-robin pass
      // For simplicity, interleave shared events after each full pass
      const finalCaveEvents = [];
      const sharedPerPass = Math.ceil(_caveSharedEvents.length / Math.max(1, cavePlayerNames.length));
      let sharedIdx = 0;
      for (let i = 0; i < interleaved.length; i++) {
        finalCaveEvents.push(interleaved[i]);
        // After every N player events (one full pass), insert a shared event
        if ((i + 1) % cavePlayerNames.length === 0 && sharedIdx < _caveSharedEvents.length) {
          for (let s = 0; s < sharedPerPass && sharedIdx < _caveSharedEvents.length; s++) {
            finalCaveEvents.push(_caveSharedEvents[sharedIdx++]);
          }
        }
      }
      // Any remaining shared events
      while (sharedIdx < _caveSharedEvents.length) {
        finalCaveEvents.push(_caveSharedEvents[sharedIdx++]);
      }

      // Push all to tickEvents and caveEvents
      for (const ev of finalCaveEvents) {
        tickEvents.push(ev);
        caveEvents.push(ev);
      }
    }

    // ════════════════════════════════════════
    // ZONE 1: Rock Head Field
    // ════════════════════════════════════════
    for (const n of [...fieldOccupants]) {
      const st = state[n];
      if (st.eliminated) continue;
      if (st.zone !== 1) continue;
      const ps = pStats(n);
      st.ticksInZone++;

      // Basket weaving decision
      const wantBasket = !st.basket && (ps.strategic >= 6 || st.carrying.length >= 2);
      const wantGiftBasket = st.basket && fieldOccupants.some(o => {
        return o !== n && !state[o].basket && (getBond(n, o) >= 5 || (gs.showmances || []).some(sh => !sh.broken && sh.pair?.includes(n) && sh.pair?.includes(o)) || ps.loyalty >= 7);
      });

      if (wantGiftBasket && Math.random() < 0.25) {
        // Basket gift for an ally
        const recipients = fieldOccupants.filter(o => o !== n && !state[o].basket && getBond(n, o) >= 3);
        if (recipients.length > 0) {
          const recipient = recipients[Math.floor(Math.random() * recipients.length)];
          state[recipient].basket = true;
          ep.chalMemberScores[n] += 1;
          addBond(n, recipient, 1.5); popDelta(n, 1);
          const txt = pick(T.BASKET_GIFT)(n, recipient);
          const ev = { type: 'basket-gift', actor: n, target: recipient, zone: 1, tick: tick + 1, text: txt };
          tickEvents.push(ev); fieldEvents.push(ev);
          campEvents.push({ type: 'rapaBasket', players: [n, recipient], badgeText: 'Basket Weaver', badgeClass: 'green', desc: txt });
          continue; // Skip search this tick
        }
      }

      if (wantBasket && !st.basket && Math.random() < 0.32) {
        st.basket = true; ep.chalMemberScores[n] += 1;
        const txt = pick(T.BASKET_WEAVE)(n);
        const ev = { type: 'basket', player: n, zone: 1, tick: tick + 1, text: txt };
        tickEvents.push(ev); fieldEvents.push(ev);
        campEvents.push({ type: 'rapaBasket', players: [n], badgeText: 'Basket Weaver', badgeClass: 'green', desc: txt });
      } else {
        // Search
        // ── Pick a specific moai to search (weighted) ──
        const moaiWeights = heads.map((h, hi) => {
          let w = 1.0;
          if (st.searchedEmpty.has(hi)) w = 0.05;
          const unfound = headEggs[h].filter(e => !e.found).length;
          w += ps.intuition * 0.08 * (unfound > 0 ? 1 : 0);
          return w;
        });
        const totalW = moaiWeights.reduce((s, w) => s + w, 0);
        let roll = Math.random() * totalW, chosenIdx = 0;
        for (let mi = 0; mi < moaiWeights.length; mi++) {
          roll -= moaiWeights[mi];
          if (roll <= 0) { chosenIdx = mi; break; }
        }
        const chosenHead = heads[chosenIdx];
        const moaiEggs = headEggs[chosenHead].filter(e => !e.found);

        // ── Search roll at chosen moai ──
        const densityBonus = moaiEggs.length * 0.30;
        const searchRoll = ps.mental * 0.35 + ps.intuition * 0.35 + st.awareness * 0.15 + densityBonus + noise(2.5);
        const threshold = 4.5 + Math.random() * 2.0;

        if (searchRoll >= threshold && moaiEggs.length > 0) {
          // Weight own eggs 3x more likely to be found (you know your color)
          const weighted = moaiEggs.map(e => ({ egg: e, w: e.owner === n ? 3.0 : 1.0 }));
          const wTotal = weighted.reduce((s, w) => s + w.w, 0);
          let wRoll = Math.random() * wTotal;
          let foundEgg = weighted[0].egg;
          for (const we of weighted) { wRoll -= we.w; if (wRoll <= 0) { foundEgg = we.egg; break; } }
          const hArr = headEggs[chosenHead];
          const eIdx = hArr.findIndex(e => e.owner === foundEgg.owner && !e.found);
          if (eIdx >= 0) hArr[eIdx].found = true;

          if (foundEgg.owner === n) {
            st.carrying.push({ color: foundEgg.color, fragile: false });
            ep.chalMemberScores[n] += 3;
            const txt = pick(T.SEARCH_OWN)(n);
            const ev = { type: 'find-own', player: n, color: foundEgg.color, zone: 1, tick: tick + 1, text: txt, head: chosenHead };
            tickEvents.push(ev); fieldEvents.push(ev);
          } else {
            const target = foundEgg.owner;
            const targetSt = state[target];
            if (targetSt && targetSt.zone >= 2) {
              const hArr2 = headEggs[chosenHead];
              const reIdx = hArr2.findIndex(e => e.owner === target && e.found);
              if (reIdx >= 0) hArr2[reIdx].found = false;
              continue;
            }
            const bond = getBond(n, target);
            const colorLabel = colorAssign[target]?.label || 'unknown';
            let action;
            const hasPact = st.pacts.includes(target);

            if (hasPact && !canScheme(n)) {
              action = 'help';
            } else if (NICE.has(arch(n))) {
              action = bond >= 0 ? 'help' : 'trade';
            } else if (VILLAIN.has(arch(n)) && bond <= -2) {
              action = Math.random() < 0.6 ? 'sabotage' : 'hostage';
            } else if (canScheme(n) && ps.strategic >= 5 && bond <= 0) {
              action = Math.random() < 0.5 ? 'hostage' : 'hide';
            } else if (!NICE.has(arch(n)) && ps.social + ps.strategic >= 8) {
              action = 'trade';
            } else if (bond >= 5) {
              action = 'help';
            } else {
              action = 'trade';
            }

            const discoveryTxt = pick(T.SEARCH_OTHER)(n, target, colorLabel, chosenHead);
            const discoveryEv = { type: 'find-other', player: n, target, color: foundEgg.color, action, zone: 1, tick: tick + 1, text: discoveryTxt, head: chosenHead };
            tickEvents.push(discoveryEv); fieldEvents.push(discoveryEv);

            if (action === 'help') {
              if (state[target]) {
                state[target].carrying.push({ color: foundEgg.color, fragile: false });
                ep.chalMemberScores[target] += 3;
              }
              ep.chalMemberScores[n] += 1; addBond(n, target, 1.5); popDelta(n, 1);
              if (hasPact) addBond(n, target, 1.5);
              const txt = pick(T.EGG_HELP)(n, target);
              const ev = { type: 'egg-help', actor: n, target, zone: 1, tick: tick + 1, text: txt, head: chosenHead };
              tickEvents.push(ev); fieldEvents.push(ev);
              campEvents.push({ type: 'rapaHeroic', players: [n, target], badgeText: 'Heroic Save', badgeClass: 'green', desc: txt });
            } else if (action === 'sabotage') {
              if (state[target]) state[target].totalEggsLost++;
              addBond(n, target, -2.0); popDelta(n, -3); ep.chalMemberScores[n] += 1;
              if (hasPact) {
                addBond(n, target, -3.0);
                campEvents.push({ type: 'rapaBrokenPact', players: [n, target], badgeText: 'Broken Promise', badgeClass: 'bad', desc: `${n} broke their egg pact with ${target} by destroying their egg.` });
              }
              const txt = pick(T.EGG_SABOTAGE)(n, target);
              const ev = { type: 'egg-sabotage', actor: n, target, color: colorLabel, zone: 1, tick: tick + 1, text: txt, head: chosenHead };
              tickEvents.push(ev); fieldEvents.push(ev);
              campEvents.push({ type: 'rapaSaboteur', players: [n, target], badgeText: 'Egg Destroyer', badgeClass: 'bad', desc: txt });

              const witnesses = fieldOccupants.filter(w => w !== n && w !== target && pStats(w).intuition >= 7);
              if (witnesses.length > 0 && Math.random() < 0.4) {
                const witness = witnesses[Math.floor(Math.random() * witnesses.length)];
                const wArch = arch(witness);
                const wBondVictim = getBond(witness, target);
                const wBondSaboteur = getBond(witness, n);
                const isNasty = VILLAIN.has(wArch) || (canScheme(witness) && wBondVictim <= -2);
                const isNice = NICE.has(wArch) || wBondVictim >= 3;

                let wTxt, wBadge, wBadgeClass, wType;
                if (isNasty) {
                  addBond(witness, n, 0.5);
                  const pa = pronouns(witness);
                  wTxt = pick([
                    (w, s, v) => `${w} watches ${s} crush ${v}'s egg and smirks. One less competitor to worry about.`,
                    (w, s, v) => `${w} sees the whole thing. ${pa.Sub} shrugs — ${v} had it coming.`,
                    (w, s, v) => `${w} catches ${s} in the act. Instead of outrage? A slow nod. ${pa.Sub} respects the play.`,
                    (w, s, v) => `${w} spots the sabotage and does nothing. If anything, ${pa.sub} looks entertained.`,
                  ])(witness, n, target);
                  wBadge = 'Enjoyed That'; wBadgeClass = ''; wType = 'sabotage-amused';
                } else if (isNice) {
                  addBond(witness, n, -2);
                  addBond(witness, target, 1.5);
                  wTxt = pick([
                    (w, s, v) => `${w} saw it all. ${s} is caught red-handed destroying ${v}'s egg. The fallout begins.`,
                    (w, s, v) => `"Are you serious right now?!" ${w} storms over after watching ${s} smash ${v}'s egg.`,
                    (w, s, v) => `${w} catches ${s} mid-destruction. ${pronouns(w).Sub} locks eyes with ${v} — a silent promise of payback.`,
                    (w, s, v) => `${w} witnessed the whole thing. ${s} just made an enemy.`,
                  ])(witness, n, target);
                  wBadge = 'Caught Red-Handed'; wBadgeClass = 'bad'; wType = 'sabotage-discovery';
                } else {
                  addBond(witness, n, -0.5);
                  wTxt = pick([
                    (w, s, v) => `${w} sees ${s} destroy ${v}'s egg. Files it away. Says nothing.`,
                    (w, s, v) => `${w} glances over just in time to see the shell crack. ${pronouns(w).Sub} keeps moving. Not ${pronouns(w).pos} problem.`,
                    (w, s, v) => `${w} catches the sabotage but stays out of it. Noted, though.`,
                    (w, s, v) => `${w} watches ${s} smash the egg with a blank expression. No reaction. Just... noted.`,
                  ])(witness, n, target);
                  wBadge = 'Noted'; wBadgeClass = ''; wType = 'sabotage-indifferent';
                }
                const wev = { type: wType, actor: witness, target: n, victim: target, zone: 1, tick: tick + 1, text: wTxt };
                tickEvents.push(wev); fieldEvents.push(wev);
                campEvents.push({ type: 'rapaSaboteur', players: [witness, n], badgeText: wBadge, badgeClass: wBadgeClass, desc: wTxt });
              }
            } else if (action === 'hostage') {
              if (st.heldHostage && st.heldHostageOwner) {
                const prevOwner = st.heldHostageOwner;
                const prevColor = st.heldHostage.color;
                const otherHeads = heads.filter(h => h !== chosenHead);
                const dropHead = otherHeads[Math.floor(Math.random() * otherHeads.length)];
                if (dropHead) headEggs[dropHead].push({ owner: prevOwner, color: prevColor, found: false });
              }
              st.heldHostage = foundEgg; st.heldHostageOwner = target;
              ep.chalMemberScores[n] += 1;
              const txt = pick(T.EGG_HOSTAGE)(n, target);
              const ev = { type: 'egg-hostage', actor: n, target, zone: 1, tick: tick + 1, text: txt, head: chosenHead };
              tickEvents.push(ev); fieldEvents.push(ev);
              campEvents.push({ type: 'rapaExtortion', players: [n, target], badgeText: 'Egg Hostage', badgeClass: 'bad', desc: txt });
            } else if (action === 'hide') {
              addBond(n, target, -0.5); ep.chalMemberScores[n] += 1;
              const otherHeads = heads.filter(h => h !== chosenHead);
              const newHead = otherHeads[Math.floor(Math.random() * otherHeads.length)];
              if (newHead) headEggs[newHead].push({ owner: target, color: foundEgg.color, found: false });
              const txt = pick(T.EGG_HIDE)(n, target);
              const ev = { type: 'egg-hide', actor: n, target, zone: 1, tick: tick + 1, text: txt, head: chosenHead };
              tickEvents.push(ev); fieldEvents.push(ev);
            } else {
              // ── Negotiation: finder demands compensation ──
              const fa = arch(n);
              let demandType;
              if (fa === 'mastermind' || fa === 'schemer' || fa === 'perceptive-player') demandType = 'intel';
              else if (fa === 'social-butterfly' || fa === 'showmancer' || fa === 'floater') demandType = 'loyalty';
              else if (fa === 'challenge-beast' || fa === 'hothead') demandType = 'assist';
              else demandType = 'debt';

              const demandPool = { intel: T.NEGOTIATE_INTEL, loyalty: T.NEGOTIATE_LOYALTY, assist: T.NEGOTIATE_ASSIST, debt: T.NEGOTIATE_DEBT };
              const demandTxt = pick(demandPool[demandType])(n, target);
              const demandEv = { type: 'egg-negotiate', actor: n, target, demandType, zone: 1, tick: tick + 1, text: demandTxt, head: chosenHead };
              tickEvents.push(demandEv); fieldEvents.push(demandEv);

              const targetSt = state[target];
              const desperation = EGGS_TO_WIN - (targetSt?.carrying?.length || 0);
              const responseRoll = desperation * 2.0 + getBond(target, n) * 0.5 + noise(2);

              if (responseRoll >= 5.0) {
                // Accept — egg returned + demand fulfilled
                if (targetSt) {
                  targetSt.carrying.push({ color: foundEgg.color, fragile: false });
                  ep.chalMemberScores[target] += 3;
                }
                ep.chalMemberScores[n] += 2; addBond(n, target, 0.5);

                if (demandType === 'intel' && targetSt) {
                  for (const idx of targetSt.searchedEmpty) st.searchedEmpty.add(idx);
                } else if (demandType === 'loyalty') {
                  const loyaltyBoost = pStats(target).loyalty * 0.4;
                  if (loyaltyBoost > 0) addBond(target, n, loyaltyBoost);
                  campEvents.push({ type: 'rapaLoyaltyPledge', players: [n, target], badgeText: 'Loyalty Pledge', badgeClass: 'yellow', desc: `${target} pledged to vote with ${n} at tribal in exchange for their egg.` });
                } else if (demandType === 'assist') {
                  if (targetSt) targetSt.pacts.push(n);
                  st.pacts.push(target);
                } else if (demandType === 'debt') {
                  if (targetSt) targetSt.pacts.push(n);
                }

                const txt = pick(T.NEGOTIATE_ACCEPT)(n, target);
                const ev = { type: 'egg-deal', actor: n, target, demandType, outcome: 'accept', zone: 1, tick: tick + 1, text: txt, head: chosenHead };
                tickEvents.push(ev); fieldEvents.push(ev);
                campEvents.push({ type: 'rapaNegotiation', players: [n, target], badgeText: 'Deal Struck', badgeClass: 'yellow', desc: `${n} traded ${target}'s egg back for ${demandType}. ${txt}` });
              } else if (responseRoll >= 3.0) {
                // Counter-offer — mutual intel swap
                if (targetSt) {
                  targetSt.carrying.push({ color: foundEgg.color, fragile: false });
                  ep.chalMemberScores[target] += 3;
                  for (const idx of targetSt.searchedEmpty) st.searchedEmpty.add(idx);
                  for (const idx of st.searchedEmpty) targetSt.searchedEmpty.add(idx);
                }
                ep.chalMemberScores[n] += 1; addBond(n, target, 0.3);
                st.awareness += 1.5;
                if (targetSt) targetSt.awareness += 1.5;

                const txt = pick(T.NEGOTIATE_COUNTER)(n, target);
                const ev = { type: 'egg-deal', actor: n, target, demandType, outcome: 'counter', zone: 1, tick: tick + 1, text: txt, head: chosenHead };
                tickEvents.push(ev); fieldEvents.push(ev);
              } else {
                // Refuse — finder hides the egg
                addBond(n, target, -0.5); addBond(target, n, -0.5);
                ep.chalMemberScores[n] += 1;
                const otherHeads = heads.filter(h => h !== chosenHead);
                const newHead = otherHeads[Math.floor(Math.random() * otherHeads.length)];
                if (newHead) headEggs[newHead].push({ owner: target, color: foundEgg.color, found: false });

                const txt = pick(T.NEGOTIATE_REFUSE)(n, target);
                const ev = { type: 'egg-deal', actor: n, target, demandType, outcome: 'refuse', zone: 1, tick: tick + 1, text: txt, head: chosenHead };
                tickEvents.push(ev); fieldEvents.push(ev);
                campEvents.push({ type: 'rapaNegotiationFailed', players: [n, target], badgeText: 'No Deal', badgeClass: 'bad', desc: txt });
              }
            }
          }
        } else {
          // Search fail — mark empty moai in player memory
          if (moaiEggs.length === 0) st.searchedEmpty.add(chosenIdx);
          st.awareness += 0.5;
          if (Math.random() < 0.55) {
            const txt = _searchFailText(n, chosenHead, st);
            const ev = { type: 'search-fail', player: n, zone: 1, tick: tick + 1, text: txt, head: chosenHead };
            tickEvents.push(ev); fieldEvents.push(ev);
          }
        }
      }

      // Extortion — if holding someone's egg hostage
      if (st.heldHostage && st.heldHostageOwner && state[st.heldHostageOwner] && state[st.heldHostageOwner].zone === 1 && Math.random() < 0.5) {
        const target = st.heldHostageOwner;
        const txt = pick(T.SOCIAL_EGG_EXTORT)(n, target);
        const ev = { type: 'egg-extort', actor: n, target, zone: 1, tick: tick + 1, text: txt };
        tickEvents.push(ev); fieldEvents.push(ev);
        campEvents.push({ type: 'rapaExtortion', players: [n, target], badgeText: 'Egg Hostage', badgeClass: 'bad', desc: txt });
        const targetResist = pStats(target).mental * 0.3 + pStats(target).boldness * 0.3 + noise(2);
        if (targetResist >= 5.5) {
          if (state[target]) state[target].totalEggsLost++;
          addBond(n, target, -1.5);
          popDelta(n, -2);
          const rTxt = pick(T.EXTORT_RESIST)(n, target);
          const rev = { type: 'extort-resist', actor: n, target, zone: 1, tick: tick + 1, text: rTxt };
          tickEvents.push(rev); fieldEvents.push(rev);
        } else {
          state[target].carrying.push({ color: st.heldHostage.color, fragile: false });
          ep.chalMemberScores[target] += 3;
          const extortLoyalty = pStats(target).loyalty * 0.4;
          if (extortLoyalty > 0) addBond(target, n, extortLoyalty);
          addBond(n, target, -0.5);
          const sTxt = pick(T.EXTORT_SUBMIT)(n, target);
          const sev = { type: 'extort-submit', actor: n, target, zone: 1, tick: tick + 1, text: sTxt };
          tickEvents.push(sev); fieldEvents.push(sev);
        }
        st.heldHostage = null;
        st.heldHostageOwner = null;
      }

      // Zone 1 → 2 transition — minimum 3 eggs, but greedy players stay for extras
      if (st.zone === 1 && st.carrying.length >= EGGS_TO_WIN) {
        const othersGone = active.filter(a => a !== n && state[a].zone >= 2 && !state[a].eliminated).length;
        const pressure = othersGone * 0.5;
        const extraEggs = st.carrying.length - EGGS_TO_WIN;
        const diminishing = extraEggs === 0 ? 0 : extraEggs === 1 ? 1.2 : 3.5;
        const a = arch(n);
        const greed = (a === 'challenge-beast' || a === 'hero') ? 7.0
          : (a === 'mastermind' || a === 'schemer' || a === 'perceptive-player') ? 6.0
          : (a === 'wildcard' || a === 'chaos-agent') ? 3.5 : 4.5;
        const wantMore = ps.strategic * 0.5 + greed + noise(2.5) - pressure - diminishing;
        const goNow = st.carrying.length >= 5 || wantMore < 7.0;
        if (goNow) {
          if (st.heldHostage && st.heldHostageOwner) {
            const ho = st.heldHostageOwner;
            const hoSt = state[ho];
            if (hoSt && hoSt.zone === 1) {
              hoSt.carrying.push({ color: st.heldHostage.color, fragile: false });
              const rTxt = `${n} tosses ${ho}'s egg back on the way to the cave. No time for games.`;
              const rev = { type: 'egg-help', actor: n, target: ho, zone: 1, tick: tick + 1, text: rTxt };
              tickEvents.push(rev); fieldEvents.push(rev);
            } else {
              const otherHeads = heads.filter(h => true);
              const dropHead = otherHeads[Math.floor(Math.random() * otherHeads.length)];
              if (dropHead) headEggs[dropHead].push({ owner: ho, color: st.heldHostage.color, found: false });
            }
            st.heldHostage = null; st.heldHostageOwner = null;
          }
          st.zone = 2; st.ticksInZone = 0;
          st.eggsOnAdvance = st.carrying.length;
          st.fieldExitOrder = ++fieldExitOrder;
          const txt = `${n} pockets their eggs and ducks into the cave entrance.`;
          const ev = { type: 'zone-advance', player: n, from: 1, to: 2, zone: 1, tick: tick + 1, text: txt };
          tickEvents.push(ev); fieldEvents.push(ev);

          if (st.fieldExitOrder === 1) {
            st.caveEggArmor = 1;
            const rTxt = `${n} is first into the cave — eggs reinforced for the journey ahead.`;
            const rev = { type: 'cave-armor', player: n, armor: 'reinforced', zone: 1, tick: tick + 1, text: rTxt };
            tickEvents.push(rev); fieldEvents.push(rev);
          }
        }
      }
    }

    // Last player out of the field gets fragile eggs (once only)
    if (!fragileAssigned) {
      const stillInField = active.filter(a => state[a].zone === 1 && !state[a].eliminated);
      if (stillInField.length === 0 && fieldExitOrder > 1) {
        const lastOut = active.filter(a => state[a].fieldExitOrder === fieldExitOrder);
        if (lastOut.length === 1 && lastOut[0] !== active.find(a => state[a].fieldExitOrder === 1)) {
          const ln = lastOut[0];
          state[ln].caveEggArmor = -1;
          fragileAssigned = true;
          const fTxt = `${ln} is the last one out — eggs rattling loose, fragile from the rush.`;
          const fev = { type: 'cave-armor', player: ln, armor: 'fragile', zone: 1, tick: tick + 1, text: fTxt };
          tickEvents.push(fev); fieldEvents.push(fev);
        }
      }
    }

    // Field social events (between players)
    if (fieldOccupants.filter(n => state[n].zone === 1).length >= 2) {
      const zoners = fieldOccupants.filter(n => state[n].zone === 1);
      // Guaranteed 1 social event per tick with 2+ players
      const numSocial = 1 + (Math.random() < 0.45 ? 1 : 0);
      for (let si = 0; si < numSocial && zoners.length >= 2; si++) {
        const fa = zoners[Math.floor(Math.random() * zoners.length)];
        const fbArr = zoners.filter(x => x !== fa);
        if (fbArr.length === 0) break;
        const fb = fbArr[Math.floor(Math.random() * fbArr.length)];
        const bondF = getBond(fa, fb);

        // Egg trade (both have each other's eggs)
        if (state[fa].carrying.some(e => e.color?.id === colorAssign[fb]?.id) &&
            state[fb].carrying.some(e => e.color?.id === colorAssign[fa]?.id) && Math.random() < 0.7) {
          // Swap eggs
          addBond(fa, fb, 1.5); addBond(fb, fa, 1.5);
          ep.chalMemberScores[fa] += 1; ep.chalMemberScores[fb] += 1;
          const txt = pick(T.EGG_TRADE)(fa, fb);
          const ev = { type: 'egg-swap', actor: fa, target: fb, zone: 1, tick: tick + 1, text: txt };
          tickEvents.push(ev); fieldEvents.push(ev);
          campEvents.push({ type: 'rapaTrade', players: [fa, fb], badgeText: 'Egg Trade', badgeClass: 'green', desc: txt });
        }
        // Intel share
        else if (bondF >= 3 && Math.random() < 0.40) {
          state[fb].awareness += 1.0; addBond(fa, fb, 1.0);
          const txt = pick(T.SOCIAL_INTEL)(fa, fb);
          const ev = { type: 'intel-share', actor: fa, target: fb, zone: 1, tick: tick + 1, text: txt };
          tickEvents.push(ev); fieldEvents.push(ev);
          campEvents.push({ type: 'rapaIntel', players: [fa, fb], badgeText: 'Intel Share', badgeClass: 'green', desc: txt });
        }
        // Alliance search
        else if (bondF >= 4 && Math.random() < 0.40) {
          state[fa].awareness += 1.0; state[fb].awareness += 1.0; addBond(fa, fb, 0.5);
          const txt = pick(T.SOCIAL_ALLIANCE_SEARCH)(fa, fb);
          const ev = { type: 'alliance-search', actor: fa, target: fb, zone: 1, tick: tick + 1, text: txt };
          tickEvents.push(ev); fieldEvents.push(ev);
        }
        // Trash talk
        else if (bondF <= -3 && Math.random() < 0.40) {
          const rattled = (pStats(fb).temperament + noise(2)) < 5;
          if (rattled) state[fb].awareness = Math.max(0, state[fb].awareness - 1.0);
          addBond(fa, fb, -0.5);
          const txt = pick(T.SOCIAL_TRASH_TALK)(fa, fb, rattled);
          const ev = { type: 'trash-talk', actor: fa, target: fb, rattled, zone: 1, tick: tick + 1, text: txt };
          tickEvents.push(ev); fieldEvents.push(ev);
          campEvents.push({ type: 'rapaTrashTalk', players: [fa, fb], badgeText: 'Trash Talk', badgeClass: '', desc: txt });
        }
        // Rock head reaction
        else if (Math.random() < 0.30) {
          const elimBond = heads.find(e => Math.abs(getBond(fa, e)) >= 2);
          if (elimBond) {
            const positive = getBond(fa, elimBond) >= 2;
            popDelta(fa, positive ? 1 : -1);
            const txt = pick(T.SOCIAL_ROCK_HEAD_REACT)(fa, elimBond, positive);
            const ev = { type: 'rock-head-react', player: fa, eliminated: elimBond, positive, zone: 1, tick: tick + 1, text: txt };
            tickEvents.push(ev); fieldEvents.push(ev);
            if (positive) campEvents.push({ type: 'rapaRespect', players: [fa], badgeText: 'Respect', badgeClass: 'green', desc: txt });
          }
        }
        // Candy bribe (~20% if a schemer/mastermind/villain is involved)
        else if (canScheme(fa) && Math.random() < 0.20) {
          const acceptChance = 0.3 + pStats(fb).loyalty * 0.04 + getBond(fa, fb) * 0.05 + noise(1.5) * 0.1;
          if (acceptChance >= 0.5) {
            addBond(fa, fb, 1.0); addBond(fb, fa, 0.5);
            popDelta(fa, -1);
            state[fb].awareness += 0.5;
            const txt = pick(T.CANDY_BRIBE_ACCEPT)(fa, fb);
            const ev = { type: 'candy-bribe', actor: fa, target: fb, accepted: true, zone: 1, tick: tick + 1, text: txt };
            tickEvents.push(ev); fieldEvents.push(ev);
            campEvents.push({ type: 'rapaBribe', players: [fa, fb], badgeText: 'Candy Bribe', badgeClass: 'bad', desc: txt });
          } else {
            addBond(fa, fb, -0.5); addBond(fb, fa, -1.0);
            popDelta(fb, 1);
            const txt = pick(T.CANDY_BRIBE_REFUSE)(fa, fb);
            const ev = { type: 'candy-bribe', actor: fa, target: fb, accepted: false, zone: 1, tick: tick + 1, text: txt };
            tickEvents.push(ev); fieldEvents.push(ev);
            campEvents.push({ type: 'rapaBribeRefused', players: [fa, fb], badgeText: 'Bribe Refused', badgeClass: 'green', desc: txt });
          }
        }
        // Head-to-head race (~25%)
        else if (Math.random() < 0.25) {
          const scoreA = pStats(fa).physical * 0.4 + pStats(fa).endurance * 0.3 + noise(2.5);
          const scoreB = pStats(fb).physical * 0.4 + pStats(fb).endurance * 0.3 + noise(2.5);
          const winner = scoreA >= scoreB ? fa : fb;
          state[winner].awareness += 0.5;
          ep.chalMemberScores[winner] += 0.5;
          const txt = pick(T.HEAD_RACE)(fa, fb, winner);
          const ev = { type: 'head-race', actor: fa, target: fb, winner, zone: 1, tick: tick + 1, text: txt };
          tickEvents.push(ev); fieldEvents.push(ev);
        }
        // Reaction to nearby find/sabotage this tick (~30% if something happened)
        else {
          const findThisTick = tickEvents.find(e => e.type === 'find-own' && e.player !== fa);
          const sabotageThisTick = tickEvents.find(e => e.type === 'egg-sabotage' && e.actor !== fa);
          if (findThisTick && Math.random() < 0.30) {
            const finder = findThisTick.player || findThisTick.actor;
            const bond = getBond(fa, finder);
            addBond(fa, finder, bond >= 0 ? -0.5 : -0.3); // jealousy or concern
            popDelta(fa, NICE.has(arch(fa)) ? 0 : -1);
            const txt = pick(T.REACT_FIND)(fa, finder);
            const ev = { type: 'react-find', player: fa, target: finder, zone: 1, tick: tick + 1, text: txt };
            tickEvents.push(ev); fieldEvents.push(ev);
          } else if (sabotageThisTick && Math.random() < 0.30) {
            const actor = sabotageThisTick.actor;
            const target = sabotageThisTick.target;
            if (NICE.has(arch(fa))) {
              addBond(fa, actor, -1.0); addBond(fa, target, 0.5);
              popDelta(actor, -1);
            } else if (VILLAIN.has(arch(fa))) {
              addBond(fa, actor, 0.5);
            } else {
              addBond(fa, actor, -0.5);
            }
            const txt = pick(T.REACT_SABOTAGE)(fa, actor, target);
            const ev = { type: 'react-sabotage', player: fa, actor, target, zone: 1, tick: tick + 1, text: txt };
            tickEvents.push(ev); fieldEvents.push(ev);
            campEvents.push({ type: 'rapaWitness', players: [fa, actor], badgeText: 'Witnessed', badgeClass: '', desc: txt });
          }
        }
      }
    }

    // Cross-zone interactions
    if (fieldOccupants.length > 0 && caveOccupants.length > 0 && Math.random() < 0.25) {
      const caver = caveOccupants[Math.floor(Math.random() * caveOccupants.length)];
      const fielder = fieldOccupants.filter(n => state[n].zone === 1)[0];
      if (fielder && getBond(caver, fielder) >= 1) {
        state[fielder].awareness += 1.0; addBond(caver, fielder, 1.0);
        const txt = pick(T.CROSS_SHOUT_WARNING)(caver, fielder);
        const ev = { type: 'cross-shout', actor: caver, target: fielder, fromZone: 2, toZone: 1, tick: tick + 1, text: txt };
        tickEvents.push(ev); fieldEvents.push(ev);
        campEvents.push({ type: 'rapaIntel', players: [caver, fielder], badgeText: 'Intel Share', badgeClass: 'green', desc: txt });
      }
    }
    if (pillarOccupants.length > 0 && (fieldOccupants.length > 0 || caveOccupants.length > 0) && Math.random() < 0.15) {
      const climber = pillarOccupants[Math.floor(Math.random() * pillarOccupants.length)];
      const targets = [...fieldOccupants.filter(n => state[n].zone === 1), ...caveOccupants];
      const rival = targets.find(t => getBond(climber, t) <= -2);
      if (rival) {
        const rattled = (pStats(rival).temperament + noise(2)) < 5;
        addBond(climber, rival, -0.5);
        const txt = pick(T.CROSS_TAUNT_FROM_ABOVE)(climber, rival, rattled);
        const ev = { type: 'cross-taunt', actor: climber, target: rival, fromZone: 3, toZone: state[rival].zone, tick: tick + 1, text: txt };
        tickEvents.push(ev);
        if (state[rival].zone === 1) fieldEvents.push(ev);
        else caveEvents.push(ev);
        campEvents.push({ type: 'rapaTrashTalk', players: [climber, rival], badgeText: 'Trash Talk', badgeClass: '', desc: txt });
      }
    }

    // Backtrack encounters
    const backtrackers = tickEvents.filter(e => e.type === 'backtrack' || e.type === 'voluntary-retreat');
    const advancers = tickEvents.filter(e => e.type === 'zone-advance');
    if (backtrackers.length > 0 && advancers.length > 0 && Math.random() < 0.4) {
      const bt = backtrackers[0];
      const adv = advancers[0];
      const btName = bt.player;
      const advName = adv.player;
      const friendly = getBond(btName, advName) >= 1;
      const txt = pick(T.CROSS_BACKTRACK_ENCOUNTER)(btName, advName, friendly);
      if (friendly) {
        state[btName].awareness += 1.0; state[advName].awareness += 1.0;
        addBond(btName, advName, 0.5);
      } else {
        addBond(btName, advName, -0.5);
      }
      const ev = { type: 'backtrack-encounter', actor: btName, target: advName, friendly, tick: tick + 1, text: txt };
      tickEvents.push(ev); fieldEvents.push(ev);
    }

    // Elimination check — if player has no eggs anywhere, they're out
    for (const n of active) {
      const st = state[n];
      if (st.eliminated) continue;
      if (st.carrying.length > 0 || st.nested > 0) continue;
      const unfoundOwn = Object.values(headEggs).flat().filter(e => e.owner === n && !e.found).length;
      const heldByOthers = active.some(o => o !== n && state[o].heldHostage?.owner === n);
      if (unfoundOwn === 0 && !heldByOthers) {
        st.eliminated = true;
        st.zone = 0;
        ep.chalMemberScores[n] -= 10;
        popDelta(n, -3);
        const txt = pick(T.ELIMINATED)(n);
        const ev = { type: 'eliminated', player: n, tick: tick + 1, text: txt };
        tickEvents.push(ev); fieldEvents.push(ev);
        campEvents.push({ type: 'rapaEliminated', players: [n], badgeText: 'All Eggs Lost', badgeClass: 'bad', desc: txt });
      }
    }

    // Romance hooks
    _challengeRomanceSpark(null, null, ep, null, null, ep.chalMemberScores);
    _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores, 'danger', null);

    raceTicks.push({ tick: tick + 1, events: tickEvents, playerStates: JSON.parse(JSON.stringify(state)) });
  }

  // ── Force-resolve any remaining hostages after game ends ──
  for (const n of active) {
    const st = state[n];
    if (st.heldHostage && st.heldHostageOwner) {
      const ho = st.heldHostageOwner;
      const hoSt = state[ho];
      if (hoSt && !hoSt.eliminated) {
        hoSt.carrying.push({ color: st.heldHostage.color, fragile: false });
      } else {
        const dropHead = heads[Math.floor(Math.random() * heads.length)];
        headEggs[dropHead].push({ owner: ho, color: st.heldHostage.color, found: false });
      }
      st.heldHostage = null;
      st.heldHostageOwner = null;
    }
  }

  // ── Post-loop: Force all remaining cave players out ──
  {
    const stuckInCave = active.filter(n => state[n].zone === 2 && !state[n].eliminated);
    const lastTick = raceTicks.length > 0 ? raceTicks[raceTicks.length - 1].tick : 1;
    for (const n of stuckInCave) {
      const st = state[n];
      st.zone = 3; st.caveSegment = 0; st.ticksInZone = 0;
      if (!st.pillarStartEggs) st.pillarStartEggs = st.carrying.length;
      if (!firstCaveExiter) { firstCaveExiter = n; st.catcherMask = true; }
      const forcedTexts = [
        `${n} finally stumbles out of the cave, battered and behind. The cave almost won.`,
        `After what feels like an eternity, ${n} drags ${pronouns(n).ref} out of the darkness. Barely.`,
        `${n} emerges from the cave looking like ${pronouns(n).sub}'ve been through a war. And ${pronouns(n).sub} ha${pronouns(n).sub === 'they' ? 've' : 's'}.`,
        `The cave spits ${n} out. Not because it's generous — because even it got bored.`,
      ];
      const txt = pick(forcedTexts);
      const ev = { type: 'cave-exit', player: n, first: false, forced: true, zone: 2, tick: lastTick + 1, text: txt };
      caveEvents.push(ev);
      ep.chalMemberScores[n] -= 3;
    }
    // Last-out penalty: player with most cave ticks (excluding first exiter)
    const allCaveExited = active.filter(n => state[n].zone === 3 && !state[n].eliminated);
    if (allCaveExited.length >= 2) {
      let lastExiter = null;
      let maxCT = -1;
      for (const n of allCaveExited) {
        if (n === firstCaveExiter) continue;
        const ct = state[n].caveTicks || 0;
        if (ct > maxCT) { maxCT = ct; lastExiter = n; }
      }
      if (lastExiter && !state[lastExiter].slowPillarStart) {
        state[lastExiter].slowPillarStart = true;
        const slowTxt = `${lastExiter} is the last one out of the cave. ${pronouns(lastExiter).Sub}'ll start the pillar a step behind — no climb on ${pronouns(lastExiter).posAdj} first tick.`;
        const slowEv = { type: 'cave-last-out', player: lastExiter, zone: 2, tick: lastTick + 1, text: slowTxt };
        caveEvents.push(slowEv);
      }
    }
  }

  // ── Eliminate players still stuck in the field (didn't collect enough eggs) ──
  {
    const stuckInField = active.filter(n => state[n].zone === 1 && !state[n].eliminated);
    if (stuckInField.length > 0) {
      for (const n of stuckInField) {
        const st = state[n];
        const count = st.carrying.length;
        st.eliminated = true;
        st.zone = 0;
        ep.chalMemberScores[n] -= 8;
        popDelta(n, -2);
        const txt = pick(T.FIELD_FAILED)(n, count);
        const lastTick = raceTicks.length > 0 ? raceTicks[raceTicks.length - 1].tick : 1;
        const ev = { type: 'field-eliminated', player: n, zone: 1, eggsFound: count, tick: lastTick + 1, text: txt };
        if (raceTicks.length > 0) {
          raceTicks[raceTicks.length - 1].events.push(ev);
        }
        fieldEvents.push(ev);
        campEvents.push({ type: 'rapaEliminated', players: [n], badgeText: 'Not Enough Eggs', badgeClass: 'bad', desc: txt });
      }
      if (raceTicks.length > 0) {
        raceTicks[raceTicks.length - 1].playerStates = JSON.parse(JSON.stringify(state));
      }
    }
  }

  // ── Resolve winner if none by tick limit ──
  if (!winner) {
    // Most nested wins; tiebreak by earliest nest timing
    let candidates = active.filter(n => !state[n].eliminated);
    if (candidates.length === 0) candidates = [...active];
    winner = candidates.reduce((best, n) => {
      const bNested = state[best]?.nested || 0;
      const nNested = state[n]?.nested || 0;
      if (nNested > bNested) return n;
      if (nNested < bNested) return best;
      // Same nested count — earliest last nest tick wins
      const bTick = state[best]?.nestTicks?.length > 0 ? state[best].nestTicks[state[best].nestTicks.length - 1] : Infinity;
      const nTick = state[n]?.nestTicks?.length > 0 ? state[n].nestTicks[state[n].nestTicks.length - 1] : Infinity;
      if (nTick < bTick) return n;
      if (nTick > bTick) return best;
      // Final fallback: chalMemberScores
      return (ep.chalMemberScores[n] || 0) > (ep.chalMemberScores[best] || 0) ? n : best;
    }, candidates[0] || active[0]);
  }

  popDelta(winner, 2);
  const maxOther = Math.max(...active.filter(n => n !== winner).map(n => ep.chalMemberScores[n] || 0), 0);
  ep.chalMemberScores[winner] = maxOther + active.length + 5;

  campEvents.push({ type: 'rapaImmune', players: [winner], badgeText: 'Won the Egg Race', badgeClass: 'win', desc: pick(T.VICTORY_TEXT)(winner) });

  if (!gs.campEvents) gs.campEvents = {};
  if (!gs.campEvents[campKey]) gs.campEvents[campKey] = [];
  gs.campEvents[campKey].push(...campEvents);

  const standings = [...active].sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0));

  ep.immunityWinner = winner;
  ep.tribalPlayers = active;
  ep.isRapaPhooey = true;
  ep.challengeType = 'rapa-phooey';
  ep.challengeLabel = 'Rapa Phooey!';
  ep.challengeCategory = 'hunt';
  ep.challengeData = {
    immunityWinner: winner,
    colorAssign,
    heads,
    headEggs,
    auctionEvents,
    raceTicks,
    fieldEvents,
    caveEvents,
    pillarEvents,
    standings,
    playerStates: state,
    winnerText: pick(T.VICTORY_TEXT)(winner),
    campKey,
    pillarTicksGlobal,
    eggsPerPlayer: EGGS_PER_PLAYER,
    eggsToWin: EGGS_TO_WIN,
  };
  ep.chalPlacements = standings;
  updateChalRecord(ep);
}

// ══════════════════════════════════════════════════════════════
// VP STATE
// ══════════════════════════════════════════════════════════════
const _tvState = {};

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`rp-step-${suffix}-${i}`);
    if (el) el.classList.add('visible');
  }
  const counter = document.getElementById(`rp-counter-${suffix}`);
  if (counter) counter.textContent = `${upToIdx + 1} / ${total}`;
  const controls = document.getElementById(`rp-controls-${suffix}`);
  if (controls && upToIdx >= total - 1) {
    controls.querySelectorAll('button').forEach(b => { b.style.opacity = '0.4'; b.disabled = true; });
  }
}

export function rpRevealNext(screenKey, totalSteps) {
  if (!_tvState[screenKey]) _tvState[screenKey] = { idx: -1 };
  const st = _tvState[screenKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  _reapplyVisibility(screenKey, st.idx, totalSteps);
  const el = document.getElementById(`rp-step-${screenKey}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _updateSidebar(screenKey);
  _updateMap(screenKey);
}

export function rpRevealAll(screenKey, totalSteps) {
  if (!_tvState[screenKey]) _tvState[screenKey] = { idx: -1 };
  _tvState[screenKey].idx = totalSteps - 1;
  _reapplyVisibility(screenKey, totalSteps - 1, totalSteps);
  _updateSidebar(screenKey);
  _updateMap(screenKey);
}

window.rpRevealNext = rpRevealNext;
window.rpRevealAll = rpRevealAll;

function _getChalData(epData) {
  return epData?.challengeData || epData?.rapaPhooey || null;
}

function _updateSidebar(screenKey) {
  try {
    const sideEl = document.getElementById('rp-chal-side-inner');
    if (!sideEl) return;
    const epNum = window.vpEpNum;
    const epData = gs.episodeHistory?.[epNum - 1];
    if (!_getChalData(epData)) return;
    if (!epData.challengeData) epData.challengeData = _getChalData(epData);
    sideEl.innerHTML = _buildSidebarContent(epData, screenKey);
  } catch (e) { console.warn('[rapa] sidebar update failed:', e.message); }
}

function _updateMap(screenKey) {
  try {
    _updateFieldMap(screenKey);
  } catch (e) { console.warn('[rapa] field map:', e.message); }
  try {
    _updateCaveMap(screenKey);
  } catch (e) { console.warn('[rapa] cave map:', e.message); }
  try {
    _updatePillarMap(screenKey);
  } catch (e) { console.warn('[rapa] pillar map:', e.message); }
}

// ══════════════════════════════════════════════════════════════
// VP HELPERS
// ══════════════════════════════════════════════════════════════

function _icon(type) {
  const icons = {
    moai: `<span class="rp-icon rp-icon-moai"></span>`,
    condor: `<span class="rp-icon rp-icon-condor"></span>`,
    egg: `<span class="rp-icon rp-icon-egg"></span>`,
    cave: `<span class="rp-icon rp-icon-cave"></span>`,
    nest: `<span class="rp-icon rp-icon-nest"></span>`,
    basket: `<span class="rp-icon rp-icon-basket"></span>`,
    star: `<span class="rp-icon rp-icon-star"></span>`,
    skull: `<span class="rp-icon rp-icon-skull"></span>`,
    shield: `<span class="rp-icon rp-icon-shield"></span>`,
    climb: `<span class="rp-icon rp-icon-climb"></span>`,
    alert: `<span class="rp-icon rp-icon-alert"></span>`,
    search: `<span class="rp-icon rp-icon-search"></span>`,
    break: `<span class="rp-icon rp-icon-break"></span>`,
    python: `<span class="rp-icon rp-icon-python"></span>`,
  };
  return icons[type] || '';
}

function _av(name, size = '') {
  const sl = slug(name);
  return `<span class="rp-av ${size}" data-player="${sl}"><img src="assets/avatars/${sl}.png" alt="${name}" onerror="this.outerHTML='${name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}'"></span>`;
}

function _eggDot(colorHex, nested = false) {
  return `<span class="rp-egg-dot${nested ? ' nested' : ''}" style="background:${colorHex}"></span>`;
}

function _zonePill(zone) {
  const labels = { 1: 'ROCK HEADS', 2: 'CAVE', 3: 'PILLAR' };
  const cls = { 1: 'zone-field', 2: 'zone-cave', 3: 'zone-pillar' };
  return `<span class="rp-zone-pill ${cls[zone] || ''}">${labels[zone] || '?'}</span>`;
}

function _getPlayerStateAtReveal(cd, screenKey) {
  const st = _tvState[screenKey];
  const revIdx = st?.idx ?? -1;
  if (revIdx < 0 || !cd.raceTicks) return null;

  // Figure out which tick events have been revealed up to this point
  // For phase screens, stepMeta on window tracks which tick's state to use
  const meta = window._rpStepMeta?.[screenKey];
  if (meta && meta.length > 0 && revIdx >= 0 && revIdx < meta.length) {
    const tickIdx = meta[revIdx].tickIdx;
    if (tickIdx >= 0 && tickIdx < cd.raceTicks.length) {
      return cd.raceTicks[tickIdx].playerStates;
    }
  }

  // Fallback: use last tick
  const lastTick = cd.raceTicks[cd.raceTicks.length - 1];
  return lastTick?.playerStates || null;
}

function _cardBadge(type, ev) {
  const map = {
    'find-own': ['rp-b-egg', 'EGG FOUND'],
    'find-other': ['rp-b-egg', 'WRONG COLOR'],
    'egg-negotiate': ['rp-b-social', 'NEGOTIATION'],
    'egg-deal': [ev?.outcome === 'accept' ? 'rp-b-social' : ev?.outcome === 'counter' ? 'rp-b-social' : 'rp-b-hazard', ev?.outcome === 'accept' ? 'DEAL' : ev?.outcome === 'counter' ? 'COUNTER-OFFER' : 'NO DEAL'],
    'search-fail': ['rp-b-egg', 'SEARCH'],
    'basket': ['rp-b-social', 'BASKET WEAVE'],
    'basket-gift': ['rp-b-social', 'BASKET GIFT'],
    'egg-help': ['rp-b-social', 'EGG DELIVERED'],
    'egg-sabotage': ['rp-b-hazard', 'EGG DESTROYED'],
    'egg-hostage': ['rp-b-hazard', 'EGG HOSTAGE'],
    'egg-hide': ['rp-b-egg', 'HIDDEN'],
    'egg-trade': ['rp-b-social', 'EGG TRADE'],
    'egg-swap': ['rp-b-social', 'EGG TRADE'],
    'egg-extort': ['rp-b-hazard', 'EXTORTION'],
    'extort-resist': ['rp-b-hazard', 'RESISTED'],
    'extort-submit': ['rp-b-social', 'DEAL STRUCK'],
    'sabotage-discovery': ['rp-b-hazard', 'CAUGHT RED-HANDED'],
    'sabotage-amused': ['rp-b-hazard', 'ENJOYED THAT'],
    'sabotage-indifferent': ['rp-b-egg', 'NOTED'],
    'intel-share': ['rp-b-social', 'INTEL'],
    'alliance-search': ['rp-b-alliance', 'COORDINATING'],
    'trash-talk': ['rp-b-hazard', 'TRASH TALK'],
    'rock-head-react': ['rp-b-egg', 'MOAI MOMENT'],
    'zone-advance': ['rp-b-egg', 'ADVANCING'],
    'field-eliminated': ['rp-b-condor', 'ELIMINATED'],
    'cave-eliminated': ['rp-b-hazard', 'ELIMINATED'],
    'pillar-eliminated': ['rp-b-hazard', 'ELIMINATED'],
    'cave-armor': [ev?.armor === 'reinforced' ? 'rp-b-social' : 'rp-b-hazard', ev?.armor === 'reinforced' ? 'REINFORCED' : 'FRAGILE'],
    'cross-shout': ['rp-b-social', 'CROSS-ZONE INTEL'],
    'cross-taunt': ['rp-b-hazard', 'TAUNT FROM ABOVE'],
    'backtrack-encounter': ['rp-b-social', 'PASSING PATHS'],
    'cave-advance': ['rp-b-egg', ev?.passBadge || 'CAVE CLEAR'],
    'cave-exit': [ev?.first ? 'rp-b-social' : ev?.forced ? 'rp-b-hazard' : 'rp-b-egg', ev?.first ? 'FIRST OUT — MASK' : ev?.forced ? 'FORCED EXIT' : 'CAVE EXIT'],
    'cave-fail': ['rp-b-hazard', 'WRONG TURN'],
    'cave-hazard': ['rp-b-hazard', ev?.failBadge || (ev?.broken > 1 ? `${ev.broken} EGGS LOST` : 'EGG LOST')],
    'cave-hazard-safe': ['rp-b-egg', ev?.safeBadge || 'SURVIVED'],
    'cave-pace': ['rp-b-egg', ev?.pace === 'rush' ? 'RUSHING' : ev?.pace === 'careful' ? 'CAREFUL' : 'STEADY'],
    'cave-stuck': ['rp-b-hazard', ev?.stuckBadge || 'STUCK'],
    'cave-last-out': ['rp-b-hazard', 'LAST OUT'],
    'segment-header': ['rp-b-host', ev?.segName?.toUpperCase() || 'SEGMENT'],
    'python-coil': ['rp-b-hazard', 'PYTHON BLOCK'],
    'python-coil-push': ['rp-b-social', 'PYTHON BRAVE'],
    'python-coil-wait': ['rp-b-hazard', 'PYTHON BLOCK'],
    'python-strike': ['rp-b-condor', 'PYTHON STRIKE'],
    'python-strike-dodge': ['rp-b-egg', 'PYTHON DODGE'],
    'python-distraction': ['rp-b-social', 'PYTHON SAVE'],
    'shield': ['rp-b-social', 'BOULDER SHIELD'],
    'shove': ['rp-b-hazard', 'SHOVE'],
    'panic-chain': ['rp-b-hazard', 'PANIC'],
    'egg-rescue': ['rp-b-social', 'EGG RESCUE'],
    'exit-distraction': ['rp-b-social', 'EXIT SAVE'],
    'cave-block': ['rp-b-hazard', 'BLOCKED'],
    'cave-warn': ['rp-b-social', 'WARNING'],
    'cave-carry': ['rp-b-social', 'EGG CARRY'],
    'cave-race': ['rp-b-egg', 'CAVE RACE'],
    'cave-trash': ['rp-b-hazard', 'CAVE TRASH TALK'],
    'stampede': ['rp-b-hazard', 'STAMPEDE'],
    'backtrack': ['rp-b-hazard', 'BACKTRACK'],
    'voluntary-retreat': ['rp-b-hazard', 'RETREAT'],
    'pillar-slow-start': ['rp-b-hazard', 'LATE ARRIVAL'],
    'pillar-round': ['rp-b-alliance', ev?.round ? `ROUND ${ev.round}` : 'NEW ROUND'],
    'climb': ['rp-b-egg', ev?.tier ? `TIER ${ev.tier}/3` : 'CLIMB'],
    'fall': ['rp-b-condor', 'FALL'],
    'slip': ['rp-b-hazard', 'SLIP'],
    'nest': ['rp-b-win', ev?.nested ? `NESTED ${ev.nested}/${EGGS_TO_WIN}` : 'NESTED'],
    'nest-rejection': ['rp-b-condor', 'NEST REJECTED'],
    'squeeze-crack': ['rp-b-hazard', 'SQUEEZE CRACK'],
    'pillar-fumble': ['rp-b-hazard', 'FUMBLE'],
    'wind-gust': ['rp-b-condor', 'WIND GUST'],
    'eliminated': ['rp-b-condor', 'ELIMINATED'],
    'condor-dodge': ['rp-b-egg', 'CONDOR DODGE'],
    'condor-flinch': ['rp-b-egg', 'CONDOR FLINCH'],
    'condor-hit': ['rp-b-condor', 'CONDOR STRIKE'],
    'condor-bait': ['rp-b-social', 'CONDOR BAIT'],
    'boost': ['rp-b-social', 'BOOSTED'],
    'knock-down': ['rp-b-hazard', 'KNOCKED DOWN'],
    'egg-catch': ['rp-b-social', 'MID-AIR SAVE'],
    'summit-showdown': ['rp-b-win', 'SUMMIT SHOWDOWN'],
    'nest-sabotage': ['rp-b-condor', 'NEST SABOTAGE'],
    'desperate-throw': [ev?.success ? 'rp-b-win' : 'rp-b-hazard', ev?.success ? 'DESPERATE THROW' : 'FAILED THROW'],
    'candy-bribe': [ev?.accepted ? 'rp-b-hazard' : 'rp-b-social', ev?.accepted ? 'CANDY BRIBE' : 'BRIBE REFUSED'],
    'head-race': ['rp-b-egg', 'HEAD-TO-HEAD'],
    'react-find': ['rp-b-social', 'REACTION'],
    'react-sabotage': ['rp-b-hazard', 'REACTION'],
    'descent-nest': ['rp-b-win', ev?.nested ? `NESTED ${ev.nested}/${EGGS_TO_WIN}` : 'NESTED'],
    'descent-crash': ['rp-b-condor', 'EGG SHATTERED'],
    'base-pickup': ['rp-b-egg', ev?.trip ? `TRIP ${ev.trip}` : 'PICKUP'],
    'pep-talk': ['rp-b-social', 'PEP TALK'],
    'base-sabotage': ['rp-b-hazard', 'BASE SABOTAGE'],
    'race-rivalry': ['rp-b-hazard', 'RACE RIVALRY'],
    'alliance-climb': ['rp-b-alliance', 'ALLIANCE CLIMB'],
    'nest-block': ['rp-b-hazard', 'NEST BLOCK'],
    'nest-blocked': ['rp-b-hazard', 'BLOCKED'],
    'sprint': ['rp-b-egg', ev?.gain ? `SPRINT +${ev.gain}` : 'SPRINT'],
    'sprint-fail': ['rp-b-hazard', 'SPRINT FAIL'],
    'brace': ['rp-b-egg', 'BRACED'],
    'taunt': ['rp-b-hazard', 'CONDOR TAUNT'],
    'shield-ally': ['rp-b-social', 'SHIELD ALLY'],
    'panic-frozen': ['rp-b-hazard', 'FROZEN'],
    'panic-freeze': ['rp-b-hazard', 'PANIC FREEZE'],
    'trash-talk-pillar': ['rp-b-hazard', 'TRASH TALK'],
    'climbing-tip': ['rp-b-social', 'CLIMBING TIP'],
    'showmance-pillar': ['rp-b-social', 'SHOWMANCE'],
    'strategic-wait': ['rp-b-alliance', 'SPLIT PUSH'],
    'fall-break': ['rp-b-condor', 'EGG SHATTERED'],
  };
  return map[type] || ['rp-b-egg', type?.toUpperCase() || 'EVENT'];
}

function _cardDataType(type, ev) {
  const socialTypes = new Set(['egg-help', 'egg-trade', 'egg-swap', 'egg-negotiate', 'egg-deal', 'shield', 'boost', 'egg-catch', 'condor-bait', 'exit-distraction', 'egg-rescue', 'basket-gift', 'intel-share', 'alliance-search', 'cross-shout', 'backtrack-encounter', 'react-find', 'head-race', 'extort-submit', 'cave-warn', 'cave-carry', 'cave-race', 'python-coil-push', 'python-strike-dodge', 'python-distraction', 'pep-talk', 'alliance-climb', 'shield-ally', 'climbing-tip', 'showmance-pillar', 'strategic-wait']);
  const condorTypes = new Set(['condor-hit', 'fall', 'egg-sabotage', 'shove', 'knock-down', 'nest-sabotage', 'stampede', 'sabotage-discovery', 'sabotage-amused', 'field-eliminated', 'python-strike', 'descent-crash', 'fall-break']);
  const winTypes = new Set(['nest', 'desperate-throw', 'descent-nest']);
  const hazardTypes = new Set(['cave-hazard', 'cave-fail', 'panic-chain', 'slip', 'trash-talk', 'egg-extort', 'egg-hostage', 'cross-taunt', 'candy-bribe', 'react-sabotage', 'extort-resist', 'sabotage-indifferent', 'cave-eliminated', 'pillar-eliminated', 'cave-block', 'cave-trash', 'cave-stuck', 'python-coil', 'python-coil-wait', 'cave-last-out', 'pillar-slow-start', 'base-sabotage', 'race-rivalry', 'nest-block', 'nest-blocked', 'sprint-fail', 'taunt', 'panic-frozen', 'panic-freeze', 'trash-talk-pillar']);

  if (type === 'segment-header' || type === 'pillar-round') return 'host';
  if (type === 'cave-pace') return 'egg';
  if (winTypes.has(type) && (type !== 'desperate-throw' || ev?.success)) return 'win';
  if (condorTypes.has(type)) return 'condor';
  if (type === 'cave-armor') return ev?.armor === 'reinforced' ? 'social' : 'hazard';
  if (socialTypes.has(type)) return 'social';
  if (hazardTypes.has(type)) return 'hazard';
  return 'egg';
}

function _buildEventCard(ev, idx, screenKey) {
  const [badgeCls, badgeLabel] = _cardBadge(ev.type, ev);
  const dataType = _cardDataType(ev.type, ev);
  const playerName = ev.player || ev.actor || '';
  const pc = _getPlayerColor(playerName);
  let avHTML = '';
  if (ev.player) avHTML = _av(ev.player, 'sm');
  else if (ev.actor) avHTML = _av(ev.actor, 'sm');
  if (ev.target && ev.target !== ev.player && ev.target !== ev.actor) avHTML += _av(ev.target, 'sm');

  // Build card title from event type
  const titleMap = {
    'find-own': 'Egg Found', 'find-other': 'Wrong Color', 'egg-negotiate': 'Negotiation',
    'egg-deal': ev?.outcome === 'accept' ? 'Deal Struck' : ev?.outcome === 'counter' ? 'Counter-Offer' : 'No Deal',
    'search-fail': 'Searching', 'basket': 'Basket Weave',
    'basket-gift': 'Basket Gift', 'egg-help': 'Egg Delivered', 'egg-sabotage': 'Sabotage',
    'egg-hostage': 'Hostage', 'egg-hide': 'Hidden', 'egg-trade': 'Trade',
    'egg-swap': 'Trade', 'egg-extort': 'Extortion', 'extort-resist': 'Resisted', 'extort-submit': 'Deal Struck',
    'sabotage-discovery': 'Caught', 'sabotage-amused': 'Enjoyed That', 'sabotage-indifferent': 'Noted',
    'intel-share': 'Intel', 'alliance-search': 'Coordination', 'trash-talk': 'Trash Talk',
    'rock-head-react': 'Moai Moment', 'zone-advance': 'Advancing', 'field-eliminated': 'Not Enough Eggs', 'cave-eliminated': 'Cave Wipeout', 'pillar-eliminated': 'Pillar Wipeout', 'cave-armor': ev?.armor === 'reinforced' ? 'Reinforced' : 'Fragile Eggs', 'cross-shout': 'Cross-Zone',
    'cross-taunt': 'Taunt', 'backtrack-encounter': 'Crossing Paths', 'cave-advance': 'Cave Clear',
    'cave-exit': 'Exit', 'cave-fail': 'Wrong Turn', 'cave-hazard': ev?.broken > 1 ? `${ev.broken} Eggs Lost` : 'Egg Lost',
    'cave-hazard-safe': 'Survived', 'shield': 'Shield', 'shove': 'Shove',
    'panic-chain': 'Panic', 'egg-rescue': 'Rescue', 'exit-distraction': 'Exit Save',
    'cave-block': 'Blocked', 'cave-warn': 'Warning', 'cave-carry': 'Egg Carry', 'cave-race': 'Cave Race', 'cave-trash': 'Cave Trash Talk',
    'stampede': 'Stampede', 'backtrack': 'Backtrack', 'voluntary-retreat': 'Retreat',
    'climb': 'Climbing', 'fall': 'Fall', 'slip': 'Slip', 'nest': 'Nested',
    'condor-dodge': 'Dodge', 'condor-flinch': 'Flinch', 'condor-hit': 'Condor Strike',
    'condor-bait': 'Bait', 'boost': 'Boosted', 'knock-down': 'Knocked Down',
    'egg-catch': 'Mid-Air Save', 'summit-showdown': 'Showdown', 'nest-sabotage': 'Sabotage',
    'desperate-throw': ev?.success ? 'Desperate Throw' : 'Failed Throw',
    'candy-bribe': ev?.accepted ? 'Candy Bribe' : 'Bribe Refused',
    'head-race': 'Head-to-Head',
    'react-find': 'Reaction',
    'react-sabotage': 'Reaction',
    'descent-nest': 'Egg Nested',
    'descent-crash': 'Egg Shattered',
    'base-pickup': 'Next Egg',
    'pep-talk': 'Pep Talk',
    'base-sabotage': 'Base Sabotage',
    'race-rivalry': 'Race Rivalry',
    'alliance-climb': 'Alliance Climb',
    'nest-block': 'Nest Block',
    'nest-blocked': 'Blocked',
    'cave-pace': ev?.pace === 'rush' ? 'Rushing' : ev?.pace === 'careful' ? 'Careful Approach' : 'Steady Pace',
    'cave-stuck': 'Stuck',
    'cave-last-out': 'Last Out',
    'segment-header': ev?.segName || 'New Segment',
    'python-coil': 'Python Encounter',
    'python-coil-push': 'Pushed Past Python',
    'python-coil-wait': 'Python Block',
    'python-strike': 'Python Strike',
    'python-strike-dodge': 'Python Dodge',
    'python-distraction': 'Python Distraction',
    'pillar-slow-start': 'Late Arrival',
    'pillar-round': 'New Round',
    'pillar-fumble': 'Fumble',
    'wind-gust': 'Wind Gust',
    'nest-rejection': 'Nest Rejected',
    'squeeze-crack': 'Squeeze Crack',
    'eliminated': 'Eliminated',
  };
  const title = titleMap[ev.type] || (ev.type?.replace(/-/g, ' ') || 'Event');

  return `<div class="rp-card" data-type="${dataType}" id="rp-step-${screenKey}-${idx}" style="--rp-clr:${pc}">
    <div class="rp-card-hdr">${avHTML}<span class="rp-card-title">${title}</span><span class="rp-badge ${badgeCls}">${badgeLabel}</span></div>
    <div class="rp-card-body">${ev.text}</div>
  </div>`;
}

function _getPlayerColor(name) {
  if (!name) return 'var(--rp-surf)';
  const epIdx = (window.vpEpNum || gs.episodeHistory?.length || 1) - 1;
  const ep = gs.episodeHistory?.[epIdx];
  const hex = ep?.challengeData?.colorAssign?.[name]?.hex;
  return hex || 'var(--rp-surf)';
}

// ══════════════════════════════════════════════════════════════
// VP CSS + SHELL
// ══════════════════════════════════════════════════════════════

const _RP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Bungee&family=Bungee+Inline&family=Cinzel:wght@400;700&family=Cutive+Mono&family=IBM+Plex+Mono:wght@400;500;600&family=Karla:wght@400;500;600;700&display=swap');
:root{
  --rp-abyss:#070d12;--rp-deep:#0d1820;--rp-stormy:#1a2a36;--rp-ocean:#1e4658;
  --rp-tide:#2a7a8c;--rp-surf:#4ec0d4;--rp-foam:#a8e0e6;--rp-coral:#e87654;
  --rp-sunset:#f0a464;--rp-bone:#ecdfc8;--rp-paper:#f4ead4;--rp-sand:#cdb274;
  --rp-sand-lt:#ead7a5;--rp-sand-dk:#a8895a;--rp-sand-deep:#705634;
  --rp-moai-shadow:#2a2620;--rp-moai:#5a544a;--rp-moai-lit:#8a8276;
  --rp-volcanic:#8b2500;--rp-lava:#d44a1a;--rp-gold:#c8a040;--rp-gold-lt:#e8c860;
  --rp-condor:#c0392b;--rp-chick:#f4c842;--rp-tuff:#c8b89a;
  --rp-egg-green:#5ab04a;--rp-egg-blue:#4a82d4;--rp-egg-red:#d44a4a;--rp-egg-purple:#a060d4;
  --rp-sand-mid:#a8895a;--rp-sand-dark:#705634;--rp-sand-shadow:#3e2e14;--rp-carved:#1f1607;
  --f-hero:'Bungee Inline',sans-serif;--f-display:'Bungee',sans-serif;
  --f-title:'Black Ops One',cursive;--f-serif:'Cinzel',serif;
  --f-mono:'IBM Plex Mono',monospace;--f-mono2:'Cutive Mono',monospace;--f-body:'Karla',sans-serif;
}
.rp-shell{font-family:var(--f-body);font-size:14px;line-height:1.55;color:var(--rp-bone);position:relative;z-index:10;max-width:1260px;margin:0 auto;letter-spacing:.01em;}
.rp-shell *{box-sizing:border-box;}
/* Atmosphere */
.rp-atmo{position:fixed;top:46px;left:172px;right:0;bottom:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 60% 40% at 50% 10%,rgba(232,118,84,.18) 0%,transparent 55%),
    radial-gradient(ellipse 100% 60% at 50% 100%,rgba(30,70,88,.6) 0%,transparent 65%),
    linear-gradient(180deg,#070d12 0%,#0d1820 25%,#1a2a36 55%,#1e4658 88%,#2a7a8c 100%);}
.rp-atmo.phase-cave{background:linear-gradient(180deg,#030608 0%,#0a1018 35%,#0d1218 65%,#111618 100%)!important;}
.rp-atmo.phase-pillar{background:
  radial-gradient(ellipse 50% 40% at 50% 10%,rgba(240,164,100,.08) 0%,transparent 60%),
  linear-gradient(180deg,#0d0a06 0%,#1a1208 30%,#2a1e10 55%,#c44a1a 100%);}
/* Stars */
.rp-stars{position:fixed;top:46px;left:172px;right:0;bottom:0;z-index:0;pointer-events:none;opacity:.6;
  background-image:radial-gradient(1px 1px at 14% 12%,var(--rp-foam) 50%,transparent),radial-gradient(1px 1px at 32% 8%,var(--rp-bone) 50%,transparent),radial-gradient(1px 1px at 68% 18%,var(--rp-foam) 50%,transparent),radial-gradient(1.5px 1.5px at 82% 6%,var(--rp-bone) 50%,transparent),radial-gradient(1px 1px at 51% 22%,var(--rp-foam) 50%,transparent),radial-gradient(1px 1px at 90% 30%,var(--rp-foam) 50%,transparent);
  animation:rp-twinkle 6s ease-in-out infinite alternate;}
@keyframes rp-twinkle{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
/* Palm fronds */
.rp-palms{position:fixed;top:46px;left:172px;right:0;bottom:0;pointer-events:none;z-index:3;}
.rp-palm{position:absolute;width:260px;height:240px;opacity:.6;}
.rp-palm.tl{top:42px;left:-20px;}
.rp-palm.tr{top:42px;right:-20px;transform:scaleX(-1);}
.rp-palm.bl{bottom:-20px;left:-20px;transform:scaleY(-1);}
.rp-palm.br{bottom:-20px;right:-20px;transform:scale(-1,-1);}
.rp-layout{position:relative;z-index:3;}
/* Flanking moai busts */
.rp-flank{position:fixed;top:96px;width:170px;height:calc(100vh - 96px);
  pointer-events:none;z-index:2;display:flex;align-items:center;justify-content:center;opacity:.55;}
.rp-flank.l{left:max(0px, calc(50vw - 780px));}
.rp-flank.r{right:max(0px, calc(50vw - 880px));transform:scaleX(-1);}
.rp-flank svg{width:100%;height:auto;max-height:80vh;filter:drop-shadow(0 12px 24px rgba(0,0,0,.6));}
@media(max-width:1400px){.rp-flank{display:none;}}
/* Moai silhouette row */
.rp-moai-row{position:fixed;bottom:0;left:172px;right:0;z-index:2;pointer-events:none;height:30vh;}
.rp-moai-sil{position:absolute;bottom:0;filter:drop-shadow(0 0 18px rgba(0,0,0,.5));}
.rp-moai-sil .head{width:60px;height:78px;background:var(--rp-abyss);border-radius:30px 30px 8px 8px;position:relative;}
.rp-moai-sil .head::before{content:'';position:absolute;top:34%;left:14%;width:20%;height:24%;background:var(--rp-stormy);border-radius:8px 8px 0 0;box-shadow:34px 0 0 var(--rp-stormy);}
.rp-moai-sil .head::after{content:'';position:absolute;top:62%;left:30%;width:40%;height:8%;background:var(--rp-stormy);border-radius:2px;}
.rp-moai-sil .body{width:78px;height:50px;background:var(--rp-abyss);margin-left:-9px;border-radius:12px 12px 0 0;}
.rp-moai-sil.s1{left:4%;transform:scale(.55);}
.rp-moai-sil.s2{left:13%;transform:scale(.9);}
.rp-moai-sil.s3{left:24%;transform:scale(.7);}
.rp-moai-sil.s4{left:62%;transform:scale(.65);}
.rp-moai-sil.s5{left:74%;transform:scale(1);}
.rp-moai-sil.s6{left:88%;transform:scale(.6);}
/* Waves */
.rp-waves{position:fixed;left:172px;right:0;bottom:0;height:14vh;z-index:1;pointer-events:none;
  background:
    repeating-linear-gradient(90deg,rgba(78,192,212,0) 0px,rgba(78,192,212,.08) 14px,rgba(78,192,212,0) 28px),
    linear-gradient(180deg,transparent 0%,rgba(30,70,88,.4) 60%,rgba(42,122,140,.5) 100%);
  -webkit-mask:linear-gradient(180deg,transparent 0%,#000 60%);mask:linear-gradient(180deg,transparent 0%,#000 60%);}
/* Spray motes */
.rp-spray{position:fixed;top:46px;left:172px;right:0;bottom:0;z-index:4;pointer-events:none;overflow:hidden;}
.rp-mote{position:absolute;width:2px;height:2px;border-radius:50%;
  background:var(--rp-foam);box-shadow:0 0 4px rgba(168,224,230,.7);opacity:0;
  animation:rp-drift linear infinite;}
@keyframes rp-drift{0%{transform:translate(0,0);opacity:0}10%{opacity:.7}90%{opacity:.4}100%{transform:translate(-30vw,-40vh);opacity:0}}
/* Chrome bar */
.rp-chrome{position:fixed;top:46px;left:172px;right:0;height:42px;z-index:50;
  background:linear-gradient(90deg,rgba(7,13,18,.97),rgba(30,70,88,.88) 70%,rgba(7,13,18,.97));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--rp-tide);
  display:flex;align-items:center;justify-content:space-between;padding:0 20px;
  font-family:var(--f-mono);font-size:11px;color:var(--rp-tide);}
.rp-chrome-left{display:flex;align-items:center;gap:12px;}
.rp-chrome-logo{font-family:var(--f-display);font-size:13px;color:var(--rp-coral);letter-spacing:1px;}
.rp-chrome-ep{color:var(--rp-foam);opacity:.7;font-size:10px;}
.rp-chrome-ticker{flex:1;overflow:hidden;margin:0 20px;}
.rp-chrome-ticker-inner{white-space:nowrap;animation:rp-ticker 30s linear infinite;color:var(--rp-tide);opacity:.6;font-family:var(--f-mono2);font-size:10px;}
@keyframes rp-ticker{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.rp-chrome-coords{font-family:var(--f-mono2);font-size:10px;color:var(--rp-sunset);opacity:.7;}
/* Layout */
.rp-layout{display:grid;grid-template-columns:1fr 350px;gap:20px;padding:0 20px 60px;}
.rp-layout>.rp-main{display:flex;flex-direction:column;gap:14px;overflow:visible!important;}
/* Cold open hero card */
.rp-hero{grid-column:1/-1;position:relative;padding:28px 80px 24px;margin-bottom:16px;border:3px solid var(--rp-sand-deep);border-radius:4px;overflow:hidden;
  background:radial-gradient(at 30% -10%,var(--rp-sand-lt) 0%,var(--rp-sand) 38%,var(--rp-sand-dk) 78%,var(--rp-sand-deep) 100%);}
.rp-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at top right,rgba(232,118,84,.12),transparent 60%);pointer-events:none;}
.rp-hero::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent 0,transparent 18px,rgba(168,224,230,.025) 18px,rgba(168,224,230,.025) 19px);pointer-events:none;}
.rp-hero-meta{display:flex;gap:14px;align-items:center;font-family:var(--f-mono);font-size:10px;letter-spacing:3.5px;color:var(--rp-sand-deep);margin-bottom:10px;text-transform:uppercase;}
.rp-hero-meta .dot{width:4px;height:4px;border-radius:50%;background:var(--rp-sand-deep);opacity:.4;}
.rp-hero h1{font-family:var(--f-hero);font-size:88px;line-height:.95;letter-spacing:3px;color:rgb(31,22,7);text-shadow:rgba(255,255,255,.35) 1px 1px 0,rgba(0,0,0,.45) -1px -1px 0,var(--rp-sand-dk) 4px 4px 0,rgba(62,46,20,.5) 7px 7px 0;}
.rp-hero-sub{font-family:var(--f-display);font-size:14px;letter-spacing:6px;color:var(--rp-sand-deep);margin-top:8px;text-transform:uppercase;}
.rp-hero-tagline{font-family:var(--f-body);font-size:13.5px;color:rgba(62,46,20,.75);margin-top:10px;max-width:620px;line-height:1.55;}
.rp-hero-stats{display:flex;gap:14px;margin-top:18px;flex-wrap:wrap;}
.rp-hero-stat{padding:8px 16px;border:1px solid rgba(62,46,20,.35);border-radius:3px;
  background:rgba(255,255,255,.18);min-width:110px;}
.rp-hero-stat .lbl{display:block;font-family:var(--f-mono);font-size:9px;letter-spacing:1.5px;
  color:var(--rp-sand-deep);text-transform:uppercase;}
.rp-hero-stat .val{display:block;font-family:var(--f-display);font-size:18px;color:rgb(31,22,7);
  letter-spacing:.5px;margin-top:3px;}
.rp-hero-stat .val.coral{color:#a82820;}
.rp-roster-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:12px;margin-top:18px;}
.rp-rs{padding:12px 8px 8px;border:1px solid rgba(62,46,20,.25);background:rgba(255,255,255,.2);
  border-radius:3px;text-align:center;position:relative;border-top:4px solid var(--pc,var(--rp-sand-dk));}
.rp-rs .feather{position:absolute;top:-8px;right:-4px;font-family:var(--f-display);font-size:9px;
  letter-spacing:1px;padding:2px 6px;border-radius:2px;text-transform:uppercase;
  background:var(--pc,var(--rp-sand-dk));color:#fff;transform:rotate(8deg);
  box-shadow:0 1px 3px rgba(0,0,0,.25);text-shadow:0 1px 1px rgba(0,0,0,.3);}
.rp-rs .av-ring{width:50px;height:50px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;
  justify-content:center;font-family:var(--f-display);font-size:17px;font-weight:700;color:#fff;
  letter-spacing:1px;border:3px solid var(--pc,var(--rp-sand-dk));
  background:var(--pc,var(--rp-sand-dk));text-shadow:0 1px 3px rgba(0,0,0,.4);
  box-shadow:0 0 0 1px rgba(255,255,255,.08);overflow:hidden;}
.rp-rs .av-ring img{width:100%;height:100%;object-fit:contain;border-radius:50%;}
.rp-rs .rs-nm{font-family:var(--f-display);font-size:13px;letter-spacing:1.5px;color:rgb(31,22,7);text-align:center;}
.rp-rs .rs-arch{font-family:var(--f-mono);font-size:9.5px;color:var(--rp-sand-deep);opacity:.65;text-align:center;text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
/* Phase title */
.rp-phase-hdr{background:linear-gradient(135deg,rgba(30,70,88,.4),rgba(13,24,32,.6));border:1px solid rgba(42,122,140,.3);border-radius:8px;padding:20px 24px;position:relative;overflow:hidden;}
.rp-phase-hdr h2{font-family:var(--f-title);font-size:22px;color:var(--rp-coral);letter-spacing:1px;}
.rp-phase-hdr p{font-family:var(--f-body);font-size:14px;color:var(--rp-foam);opacity:.7;margin-top:6px;}
/* Map containers */
.rp-map{background:rgba(13,24,32,.8);border:1px solid rgba(42,122,140,.25);border-radius:10px;position:sticky;top:0;z-index:8;}
.rp-map-header{background:rgba(7,13,18,.6);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(42,122,140,.2);}
.rp-map-header h3{font-family:var(--f-display);font-size:12px;color:var(--rp-surf);letter-spacing:1px;}
.rp-map-header .map-tag{font-family:var(--f-mono);font-size:9px;color:var(--rp-sunset);background:rgba(240,164,100,.1);padding:2px 8px;border-radius:10px;border:1px solid rgba(240,164,100,.2);}
.rp-map-body{position:relative;height:280px;overflow:hidden;}
/* Map 1: Field */
.map-field{background:radial-gradient(ellipse 80% 60% at 50% 80%,rgba(42,122,140,.15) 0%,transparent 70%),linear-gradient(180deg,rgba(13,24,32,.9),rgba(26,42,54,.95));}
.field-grid{position:absolute;inset:20px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,1fr);gap:12px;padding:10px;}
.field-head{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;}
.field-head-icon{width:40px;height:56px;position:relative;}
.field-head-icon .fh-face{width:100%;height:100%;background:linear-gradient(180deg,var(--rp-stormy),rgba(26,42,54,.9));border-radius:6px 6px 3px 3px;clip-path:polygon(15% 0%,85% 0%,92% 25%,88% 55%,78% 80%,68% 100%,32% 100%,22% 80%,12% 55%,8% 25%);border:1px solid rgba(42,122,140,.2);position:relative;}
.field-head-icon .fh-eye{position:absolute;width:5px;height:8px;background:rgba(78,192,212,.3);border-radius:50%;top:35%;animation:rp-eye-glow 4s ease-in-out infinite alternate;}
.field-head-icon .fh-eye.l{left:28%;}
.field-head-icon .fh-eye.r{right:28%;}
@keyframes rp-eye-glow{0%{opacity:.2;box-shadow:none}50%{opacity:.8;box-shadow:0 0 6px rgba(78,192,212,.5)}100%{opacity:.3;box-shadow:none}}
.field-head-name{font-family:var(--f-mono);font-size:8px;color:var(--rp-tide);opacity:.7;text-align:center;}
.field-eggs{display:flex;gap:3px;position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);}
.field-egg{width:7px;height:9px;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;opacity:.8;animation:rp-egg-pulse 3s ease-in-out infinite;animation-delay:var(--ad,0s);}
@keyframes rp-egg-pulse{0%,100%{box-shadow:0 0 4px rgba(78,192,212,.25);transform:scale(1)}50%{box-shadow:0 0 10px rgba(78,192,212,.25);transform:scale(1.15)}}
.field-scan{position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(78,192,212,.06) 48%,rgba(78,192,212,.12) 50%,rgba(78,192,212,.06) 52%,transparent 100%);animation:rp-scan 6s linear infinite;pointer-events:none;}
@keyframes rp-scan{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.field-player{position:absolute;width:24px;height:24px;border-radius:50%;border:2px solid var(--rp-foam);z-index:5;box-shadow:0 0 6px rgba(168,224,230,.3);overflow:hidden;transition:left .5s ease,top .5s ease,opacity .4s ease;}
.field-player.fp-gone{opacity:.25;filter:grayscale(1);}
.field-player img{width:100%;height:100%;object-fit:cover;display:block;}
.field-player .fp-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--f-mono);font-size:9px;font-weight:700;color:var(--rp-bone);background:rgba(13,24,32,.8);}
.field-player .fp-label{position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-family:var(--f-mono);font-size:7px;color:var(--rp-bone);white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.8);pointer-events:none;}
.field-head.fh-active{outline:2px solid var(--rp-coral);outline-offset:2px;animation:fh-pulse .8s ease-in-out infinite alternate}
.field-head.fh-searched .field-head-icon{opacity:.5}
.fh-status{font-family:var(--f-mono);font-size:8px;min-height:14px;text-align:center;margin-top:2px}
.fh-found{display:inline-block;margin:0 2px;font-size:9px}
.fh-searched-icon{opacity:.7;font-size:9px;letter-spacing:.5px}
@keyframes fh-pulse{from{outline-color:var(--rp-coral)}to{outline-color:var(--rp-sunset)}}
/* Map 2: Cave */
.map-cave{background:radial-gradient(ellipse 40% 30% at 10% 50%,rgba(139,37,0,.1) 0%,transparent 60%),linear-gradient(180deg,rgba(7,13,18,.95),rgba(13,18,22,.98));overflow:hidden;}
.cave-ceiling{position:absolute;top:0;left:0;right:0;height:60px;background:linear-gradient(180deg,rgba(26,42,54,1),transparent);clip-path:polygon(0% 0%,100% 0%,100% 40%,92% 65%,85% 45%,75% 70%,68% 50%,58% 75%,50% 55%,40% 72%,32% 48%,22% 68%,15% 42%,8% 60%,0% 35%);}
.cave-floor{position:absolute;bottom:0;left:0;right:0;height:50px;background:linear-gradient(0deg,rgba(26,42,54,1),transparent);clip-path:polygon(0% 100%,100% 100%,100% 50%,95% 30%,88% 55%,80% 25%,72% 45%,65% 20%,55% 40%,48% 15%,38% 35%,30% 20%,20% 40%,12% 25%,5% 45%,0% 30%);}
.cave-stalactite{position:absolute;top:0;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:30px solid rgba(42,60,70,.8);filter:drop-shadow(0 4px 6px rgba(0,0,0,.3));}
.cave-seg-zone{position:absolute;top:52px;bottom:42px;border:1px dashed rgba(78,192,212,.12);border-radius:4px;z-index:1;}
.cave-seg-zone.csz-active{border-color:rgba(78,192,212,.35);background:rgba(78,192,212,.04);}
.cave-seg-lbl{position:absolute;top:2px;left:4px;font-family:var(--f-mono);font-size:7px;color:var(--rp-tide);opacity:.45;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;}
.cave-seg-zone.csz-active .cave-seg-lbl{opacity:.8;}
.cave-python-zone{position:absolute;top:0;bottom:0;left:0;right:0;pointer-events:none;z-index:2;}
.cave-python-icon{position:absolute;top:36px;font-family:var(--f-mono);font-size:7px;color:var(--rp-condor);opacity:0;transition:opacity .3s ease;white-space:nowrap;letter-spacing:.5px;}
.cave-python-icon.cp-visible{opacity:.8;animation:rp-python-pulse 2s ease-in-out infinite alternate;}
@keyframes rp-python-pulse{0%{opacity:.5;text-shadow:0 0 4px rgba(192,57,43,.3)}100%{opacity:.9;text-shadow:0 0 10px rgba(192,57,43,.6)}}
.cave-gate{position:absolute;top:50%;transform:translateY(-50%);font-family:var(--f-mono);font-size:8px;color:var(--rp-sunset);opacity:.6;text-transform:uppercase;letter-spacing:1px;z-index:3;}
.cave-gate-enter{left:2%;}
.cave-gate-exit{right:2%;}
.cave-exit-glow{position:absolute;right:0;top:0;bottom:0;width:50px;background:radial-gradient(ellipse 100% 80% at 100% 50%,rgba(200,160,64,.12) 0%,transparent 70%);z-index:0;}
.cave-player{position:absolute;width:26px;height:26px;border-radius:50%;border:2px solid var(--rp-foam);z-index:5;box-shadow:0 0 6px rgba(168,224,230,.3);overflow:hidden;transition:left .6s ease,top .4s ease,opacity .4s ease;display:none;}
.cave-player img{width:100%;height:100%;object-fit:cover;display:block;}
.cave-player .cp-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--f-mono);font-size:9px;font-weight:700;color:var(--rp-bone);background:rgba(13,24,32,.8);}
.cave-player .cp-name{position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-family:var(--f-mono);font-size:7px;color:var(--rp-bone);white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.8);pointer-events:none;}
.cave-player .cp-eggs{position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);display:flex;gap:2px;pointer-events:none;}
.cave-player .cp-egg{width:5px;height:7px;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;box-shadow:0 0 3px rgba(0,0,0,.4);}
.cave-player.cp-exited{opacity:.3;filter:grayscale(.6);}
.cave-player.cp-eliminated{opacity:.15;filter:grayscale(1);}
.cave-player.cp-first-out{box-shadow:0 0 8px rgba(200,160,64,.6),0 0 16px rgba(200,160,64,.3);}
.cave-player.cp-last-out{box-shadow:0 0 8px rgba(192,57,43,.5),0 0 16px rgba(192,57,43,.2);}
.cave-drip{position:absolute;width:2px;height:2px;background:rgba(78,192,212,.5);border-radius:50%;animation:rp-drip var(--dd,3s) ease-in infinite;animation-delay:var(--dly,0s);}
@keyframes rp-drip{0%{opacity:1;transform:translateY(0) scale(1)}80%{opacity:.6;transform:translateY(80px) scale(.8)}100%{opacity:0;transform:translateY(100px) scale(.4)}}
.cave-lava-glow{position:absolute;right:0;top:0;bottom:0;width:60px;background:radial-gradient(ellipse 100% 80% at 100% 50%,rgba(139,37,0,.2) 0%,transparent 70%);animation:rp-lava-pulse 4s ease-in-out infinite alternate;}
@keyframes rp-lava-pulse{0%{opacity:.5}100%{opacity:1}}
/* Map 3: Pillar */
.map-pillar{background:radial-gradient(ellipse 50% 40% at 50% 10%,rgba(240,164,100,.08) 0%,transparent 60%),linear-gradient(180deg,rgba(30,50,60,.9),rgba(13,24,32,.95));}
.pillar-col{position:absolute;left:50%;transform:translateX(-50%);width:60px;top:30px;bottom:30px;background:linear-gradient(90deg,rgba(60,70,78,.8) 0%,rgba(80,90,98,.6) 40%,rgba(60,70,78,.8) 100%);border-radius:4px;border:1px solid rgba(100,120,130,.2);}
.pillar-tier{position:absolute;left:50%;transform:translateX(-50%);width:90px;height:1px;background:rgba(78,192,212,.2);}
.pillar-tier-label{position:absolute;right:calc(50% + 55px);font-family:var(--f-mono);font-size:8px;color:var(--rp-tide);opacity:.5;white-space:nowrap;transform:translateY(-50%);}
.pillar-nest{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:50px;height:24px;border-radius:0 0 50% 50%;background:linear-gradient(0deg,rgba(139,100,50,.8),rgba(110,80,40,.6));border:2px solid rgba(160,120,60,.4);display:flex;align-items:center;justify-content:center;gap:3px;box-shadow:0 4px 12px rgba(0,0,0,.3);animation:rp-nest-glow 3s ease-in-out infinite alternate;}
@keyframes rp-nest-glow{0%{box-shadow:0 4px 12px rgba(0,0,0,.3)}100%{box-shadow:0 4px 20px rgba(200,160,64,.2),0 0 30px rgba(200,160,64,.1)}}
.nest-egg{width:6px;height:8px;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;opacity:.9;}
.pillar-climber{position:absolute;width:28px;height:28px;border-radius:50%;border:2.5px solid var(--rp-foam);z-index:5;box-shadow:0 0 8px rgba(168,224,230,.3);overflow:hidden;transition:left .5s ease,top .6s ease,opacity .4s ease;transform:translateX(-50%);display:none;}
.pillar-climber img{width:100%;height:100%;object-fit:cover;display:block;}
.pillar-climber .pc-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--f-mono);font-size:9px;font-weight:700;color:var(--rp-bone);background:rgba(13,24,32,.8);}
.pillar-climber .pc-label{position:absolute;left:34px;top:50%;transform:translateY(-50%);font-family:var(--f-mono);font-size:9px;color:var(--rp-bone);white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.8);pointer-events:none;}
.pillar-climber .pc-eggs{position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);display:flex;gap:2px;pointer-events:none;}
.pillar-climber .pc-egg{width:5px;height:7px;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;box-shadow:0 0 3px rgba(0,0,0,.4);}
.pillar-climber .pc-egg.nested{opacity:1;box-shadow:0 0 4px rgba(200,160,64,.5);}
.pillar-climber .pc-egg.held{opacity:.8;animation:rp-egg-pulse 2s ease-in-out infinite alternate;}
.pillar-climber.pc-at-base{opacity:.55;filter:grayscale(.3);}
.pillar-climber.pc-eliminated{opacity:.15;filter:grayscale(1);}
.pillar-climber.pc-winner{box-shadow:0 0 12px rgba(200,160,64,.7),0 0 24px rgba(200,160,64,.3);border-color:var(--rp-gold);}
.pillar-climber.pc-has-egg{box-shadow:0 0 8px rgba(78,192,212,.4);}
.pillar-condor{position:absolute;width:36px;height:12px;top:50px;animation:rp-condor-circle 8s linear infinite;}
@keyframes rp-condor-circle{0%{left:15%;top:40px;transform:scaleX(1)}25%{left:70%;top:60px;transform:scaleX(1)}50%{left:75%;top:45px;transform:scaleX(-1)}75%{left:20%;top:55px;transform:scaleX(-1)}100%{left:15%;top:40px;transform:scaleX(1)}}
.condor-wing{position:absolute;top:0;height:4px;background:rgba(60,50,45,.9);border-radius:2px;animation:rp-wing-flap .8s ease-in-out infinite alternate;}
.condor-wing.l{left:0;width:16px;transform-origin:right center;}
.condor-wing.r{right:0;width:16px;transform-origin:left center;}
@keyframes rp-wing-flap{0%{transform:rotate(-15deg)}100%{transform:rotate(10deg)}}
.condor-head{position:absolute;left:50%;top:-2px;transform:translateX(-50%);width:8px;height:6px;background:rgba(50,40,35,.9);border-radius:50%;}
.pillar-wind{position:absolute;height:1px;background:linear-gradient(90deg,transparent,rgba(168,224,230,.15),transparent);animation:rp-wind var(--wd,4s) linear infinite;}
@keyframes rp-wind{0%{transform:translateX(-100%);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:translateX(400%);opacity:0}}
/* Narration cards */
.rp-card{position:relative;margin:14px 0;padding:18px 20px 18px 24px;border-radius:4px;
  border:1px solid rgba(78,192,212,.14);
  background:linear-gradient(135deg,rgba(30,70,88,.32),rgba(7,13,18,.4));
  opacity:0;transition:opacity .3s ease;}
.rp-card.visible{opacity:1;animation:rp-cardin .55s cubic-bezier(.16,1,.3,1) forwards;}
.rp-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;
  background:var(--rp-clr,var(--rp-surf));}
.rp-card[data-type="host"]{background:linear-gradient(135deg,rgba(232,118,84,.08),rgba(7,13,18,.4));}
.rp-card[data-type="host"]::before{background:var(--rp-sunset);}
.rp-card[data-type="hazard"]::before{background:var(--rp-coral);
  background-image:repeating-linear-gradient(0deg,var(--rp-coral) 0,var(--rp-coral) 4px,var(--rp-abyss) 4px,var(--rp-abyss) 7px);}
.rp-card[data-type="alliance"]::before{background:var(--rp-clr,var(--rp-surf));
  background-image:repeating-linear-gradient(0deg,var(--rp-clr,var(--rp-surf)) 0,var(--rp-clr,var(--rp-surf)) 6px,transparent 6px,transparent 10px);}
.rp-card[data-type="bribe"]::before{background:var(--rp-chick);}
.rp-card[data-type="egg"]::before{background:var(--rp-clr,var(--rp-egg-green));}
.rp-card[data-type="social"]::before{background:var(--rp-sunset);}
.rp-card[data-type="condor"]::before{background:var(--rp-coral);}
.rp-card[data-type="win"]::before{background:var(--rp-chick);}
@keyframes rp-cardin{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
@keyframes rp-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
.rp-card-hdr{display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;}
.rp-card-title{font-family:var(--f-display);font-size:14px;letter-spacing:1.5px;
  color:var(--rp-bone);text-transform:uppercase;}
.rp-card-time{font-family:var(--f-mono);font-size:9px;color:var(--rp-tide);letter-spacing:1.2px;}
.rp-badge{margin-left:auto;padding:3px 9px;border-radius:2px;font-family:var(--f-mono);
  font-size:8.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;border:1px solid;}
.rp-b-host{color:var(--rp-sunset);border-color:rgba(240,164,100,.5);background:rgba(240,164,100,.08);}
.rp-b-hazard{color:var(--rp-coral);border-color:rgba(232,118,84,.5);background:rgba(232,118,84,.08);}
.rp-b-bribe{color:var(--rp-chick);border-color:rgba(244,200,66,.5);background:rgba(244,200,66,.08);}
.rp-b-alliance{color:var(--rp-surf);border-color:rgba(78,192,212,.5);background:rgba(78,192,212,.08);}
.rp-b-egg{color:var(--rp-egg-green);border-color:rgba(90,176,74,.5);background:rgba(90,176,74,.08);}
.rp-b-social{color:var(--rp-sunset);border-color:rgba(240,164,100,.5);background:rgba(240,164,100,.08);}
.rp-b-condor{color:var(--rp-coral);border-color:rgba(232,118,84,.5);background:rgba(232,118,84,.08);}
.rp-b-win{color:var(--rp-chick);border-color:rgba(244,200,66,.5);background:rgba(244,200,66,.08);}
.rp-card-body{font-size:13.5px;line-height:1.7;color:rgba(236,223,200,.85);}
.rp-card-body em{color:var(--rp-sunset);font-style:normal;font-weight:600;}
.rp-card-body strong{color:var(--rp-foam);font-weight:700;}
.rp-card-body i{color:var(--rp-chick);font-style:italic;}
.rp-card-meta{margin-top:11px;padding-top:9px;border-top:1px dashed rgba(78,192,212,.15);
  display:flex;gap:16px;flex-wrap:wrap;font-family:var(--f-mono);font-size:10px;
  color:var(--rp-tide);letter-spacing:.3px;}
.rp-card-meta .pos{color:var(--rp-egg-green);}
.rp-card-meta .neg{color:var(--rp-coral);}
.rp-card-meta .neu{color:var(--rp-surf);}
.rp-card-meta .gold{color:var(--rp-chick);}
.rp-quote{display:flex;gap:14px;align-items:flex-start;}
.rp-quote .mark{font-family:var(--f-hero);font-size:46px;color:var(--rp-sunset);line-height:.7;margin-top:-2px;}
.rp-quote .text{font-family:var(--f-serif);font-size:14.5px;font-weight:600;color:var(--rp-bone);line-height:1.6;}
.rp-quote .who{display:block;margin-top:8px;font-family:var(--f-mono);font-size:9px;color:var(--rp-sunset);letter-spacing:2.5px;font-weight:500;}
.rp-conf{margin:14px 0;padding:16px 18px 14px 22px;background:rgba(7,13,18,.5);
  border-left:3px solid var(--rp-clr,var(--rp-surf));border-radius:2px;position:relative;}
.rp-conf::before{content:'\\25E2 CONFESSIONAL CAM';position:absolute;top:-7px;left:14px;background:var(--rp-abyss);
  padding:0 8px;font-family:var(--f-mono);font-size:8.5px;letter-spacing:2px;
  color:var(--rp-tide);font-weight:600;}
.rp-conf-hdr{display:flex;align-items:center;gap:10px;margin-bottom:7px;}
.rp-conf-name{font-family:var(--f-display);font-size:12px;letter-spacing:1.5px;color:var(--rp-clr,var(--rp-surf));}
.rp-conf-body{font-family:var(--f-mono2);font-size:13px;line-height:1.6;color:rgba(236,223,200,.8);font-style:italic;}
/* Divider */
.rp-divider{display:flex;align-items:center;gap:12px;margin:22px 4px;}
.rp-div-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(168,137,90,.5) 20%,rgba(168,137,90,.5) 80%,transparent);}
.rp-divider svg{width:22px;height:22px;color:var(--rp-sand-mid);opacity:.75;filter:drop-shadow(0 1px 0 rgba(0,0,0,.5));}
/* Phase stamp */
.rp-stamp{display:flex;align-items:center;gap:14px;margin:24px 4px 16px;padding:12px 18px;
  background:linear-gradient(180deg,var(--rp-sand-mid),var(--rp-sand-dark));
  border:1.5px solid var(--rp-sand-shadow);border-radius:3px;color:var(--rp-carved);
  box-shadow:inset 0 2px 0 rgba(255,255,255,.25),inset 0 -2px 0 rgba(0,0,0,.3),0 4px 14px rgba(0,0,0,.45);
  position:relative;}
.rp-stamp::before,.rp-stamp::after{content:'';position:absolute;top:50%;width:14px;height:14px;
  background:var(--rp-sand-shadow);transform:translateY(-50%) rotate(45deg);border:1px solid rgba(0,0,0,.4);}
.rp-stamp::before{left:-7px;}.rp-stamp::after{right:-7px;}
.rp-stamp .num{font-family:var(--f-display);font-size:13px;color:#a82820;letter-spacing:2px;}
.rp-stamp .ttl{font-family:var(--f-display);font-size:16px;letter-spacing:2.5px;text-transform:uppercase;color:var(--rp-carved);text-shadow:1px 1px 0 rgba(255,255,255,.25);}
.rp-stamp .sub{margin-left:auto;font-family:var(--f-mono);font-size:9.5px;letter-spacing:1.5px;color:var(--rp-sand-shadow);text-transform:uppercase;}
/* Flavor text */
.rp-flavor{font-family:var(--f-mono2);font-size:11px;color:var(--rp-tide);opacity:.5;padding:6px 0;text-align:center;font-style:italic;}
/* Avatars */
.rp-av{width:32px;height:32px;border-radius:50%;background:var(--rp-clr,var(--rp-surf));
  display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--f-display);font-size:13px;color:var(--rp-abyss);
  border:2px solid rgba(7,13,18,.7);flex-shrink:0;letter-spacing:.4px;
  box-shadow:0 0 0 1px rgba(255,255,255,.08);}
.rp-av img{width:100%;height:100%;object-fit:contain;border-radius:50%;}
.rp-av.sm{width:24px;height:24px;font-size:10px;border-width:1.5px;}
.rp-av.lg{width:48px;height:48px;font-size:18px;}
.rp-av.candied{box-shadow:0 0 0 2px var(--rp-chick),0 0 10px rgba(244,200,66,.5);}
.rp-av.dazed{filter:saturate(.6) brightness(.85);}
.rp-av.out{filter:grayscale(1) brightness(.5);opacity:.55;}
/* Egg dots (inline small) */
.rp-egg-dot{display:inline-block;width:8px;height:10px;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;vertical-align:middle;margin:0 2px;opacity:.85;}
.rp-egg-dot.nested{box-shadow:0 0 5px var(--rp-gold);}
/* Condor stat block */
.rp-condor{display:grid;grid-template-columns:60px 1fr;gap:10px;margin-bottom:8px;}
.rp-condor-mug{width:60px;height:60px;background:
  radial-gradient(circle at 40% 30%,var(--rp-volcanic) 0%,var(--rp-moai-shadow) 70%);
  border:2px solid var(--rp-coral);border-radius:2px;position:relative;overflow:hidden;}
.rp-condor-mug::before{content:'';position:absolute;top:18px;left:50%;transform:translateX(-50%);
  width:14px;height:5px;background:var(--rp-coral);clip-path:polygon(0 0,100% 50%,0 100%);}
.rp-condor-mug::after{content:'CONDOR \\2640';position:absolute;bottom:0;left:0;right:0;
  background:rgba(7,13,18,.85);color:var(--rp-coral);font-family:var(--f-mono);
  font-size:7px;letter-spacing:1px;text-align:center;padding:2px 0;font-weight:700;}
.rp-condor-eyes{position:absolute;top:6px;left:50%;transform:translateX(-50%);
  display:flex;gap:5px;z-index:2;}
.rp-condor-eyes span{width:5px;height:5px;background:var(--rp-coral);border-radius:50%;
  box-shadow:0 0 6px var(--rp-coral);animation:rp-pulse .8s infinite;}
.rp-condor-info .nm{font-family:var(--f-display);font-size:15px;color:var(--rp-coral);letter-spacing:1px;}
.rp-condor-info .stat{font-family:var(--f-mono);font-size:9px;
  color:var(--rp-tide);margin-top:2px;letter-spacing:.4px;}
.rp-condor-detail{display:grid;grid-template-columns:1fr 1fr;gap:5px 10px;margin-top:8px;
  font-family:var(--f-mono);font-size:9px;}
.rp-condor-detail .k{color:var(--rp-tide);}
.rp-condor-detail .v{color:var(--rp-bone);font-weight:600;}
/* Egg tally board */
.rp-eggboard{display:flex;flex-direction:column;gap:8px;}
.rp-eggrow{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:8px;
  padding:6px 0;border-bottom:1px dashed rgba(78,192,212,.08);}
.rp-eggrow:last-child{border-bottom:none;}
.rp-eggrow .nm{font-family:var(--f-display);font-size:12px;letter-spacing:1.2px;
  color:var(--rp-bone);}
.rp-eggrow .sub{font-family:var(--f-mono);font-size:8.5px;
  color:var(--rp-tide);letter-spacing:.4px;}
.rp-eggrow .tally{display:flex;gap:3px;}
.rp-eggrow .e{width:13px;height:17px;border-radius:50% 50% 45% 45%;
  background:var(--rp-egg-c,var(--rp-tuff));box-shadow:inset -2px -3px 0 rgba(0,0,0,.25);
  border:1px solid rgba(0,0,0,.3);}
.rp-eggrow .e.empty{background:transparent;border:1px dashed rgba(236,223,200,.2);box-shadow:none;}
/* Zone pills */
.rp-zone-pill{display:inline-block;font-family:var(--f-mono);font-size:7px;padding:1px 6px;border-radius:8px;letter-spacing:.5px;text-transform:uppercase;}
.zone-field{background:rgba(42,122,140,.2);color:var(--rp-surf);border:1px solid rgba(42,122,140,.3);}
.zone-cave{background:rgba(139,37,0,.2);color:var(--rp-lava);border:1px solid rgba(139,37,0,.3);}
.zone-pillar{background:rgba(200,160,64,.2);color:var(--rp-gold-lt);border:1px solid rgba(200,160,64,.3);}
/* CSS Icons */
.rp-icon{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;flex-shrink:0;position:relative;}
.rp-icon-moai::before{content:'';position:absolute;width:8px;height:10px;background:var(--rp-stormy);border-radius:4px 4px 2px 2px;top:1px;left:3px;}
.rp-icon-moai::after{content:'';position:absolute;width:10px;height:5px;background:var(--rp-stormy);bottom:1px;left:2px;border-radius:2px 2px 0 0;}
.rp-icon-condor::before{content:'';position:absolute;width:12px;height:3px;background:var(--rp-condor);border-radius:1px;top:6px;left:1px;}
.rp-icon-condor::after{content:'';position:absolute;width:4px;height:4px;background:var(--rp-condor);border-radius:50%;top:2px;left:5px;}
.rp-icon-egg::before{content:'';position:absolute;width:7px;height:9px;background:var(--rp-surf);border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;top:2px;left:3.5px;}
.rp-icon-cave::before{content:'';position:absolute;width:10px;height:6px;background:var(--rp-stormy);border-radius:0 0 40% 40%;top:4px;left:2px;border:1px solid rgba(42,122,140,.4);}
.rp-icon-nest::before{content:'';position:absolute;width:10px;height:5px;background:rgba(139,100,50,.8);border-radius:0 0 50% 50%;top:5px;left:2px;}
.rp-icon-basket::before{content:'';position:absolute;width:8px;height:6px;border:1.5px solid var(--rp-sand);border-radius:0 0 4px 4px;bottom:2px;left:3px;}
.rp-icon-star::before{content:'';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--rp-gold);font-size:11px;}
.rp-icon-skull::before{content:'';position:absolute;width:7px;height:6px;background:var(--rp-condor);border-radius:50% 50% 30% 30%;top:2px;left:3.5px;}
.rp-icon-skull::after{content:'';position:absolute;width:5px;height:2px;background:var(--rp-condor);border-radius:0 0 2px 2px;top:8px;left:4.5px;}
.rp-icon-shield::before{content:'';position:absolute;width:7px;height:9px;background:var(--rp-surf);border-radius:0 0 50% 50%;top:2px;left:3.5px;}
.rp-icon-climb::before{content:'';position:absolute;width:3px;height:10px;background:var(--rp-sand);top:2px;left:5.5px;border-radius:1px;}
.rp-icon-climb::after{content:'';position:absolute;width:6px;height:2px;background:var(--rp-sand);top:4px;left:3px;}
.rp-icon-alert::before{content:'';position:absolute;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid #d44a4a;top:2px;left:2.5px;}
.rp-icon-alert::after{content:'!';position:absolute;color:#fff;font-size:7px;font-weight:bold;top:4px;left:5.5px;}
.rp-icon-search::before{content:'';position:absolute;width:6px;height:6px;border:2px solid var(--rp-sand);border-radius:50%;top:1px;left:2px;}
.rp-icon-search::after{content:'';position:absolute;width:4px;height:2px;background:var(--rp-sand);top:9px;left:8px;transform:rotate(45deg);border-radius:1px;}
.rp-icon-break::before{content:'';position:absolute;width:5px;height:3px;background:var(--rp-coral);top:3px;left:2px;border-radius:1px;transform:rotate(-15deg);}
.rp-icon-break::after{content:'';position:absolute;width:5px;height:3px;background:var(--rp-coral);top:7px;left:6px;border-radius:1px;transform:rotate(15deg);}
.rp-icon-python{background:rgba(80,160,60,.18);}
.rp-icon-python::before{content:'';position:absolute;width:8px;height:3px;background:#5a9e3a;top:4px;left:2px;border-radius:4px 4px 0 0;transform:rotate(-10deg);}
.rp-icon-python::after{content:'';position:absolute;width:4px;height:3px;background:#5a9e3a;top:7px;left:7px;border-radius:0 0 4px 4px;transform:rotate(10deg);}
/* Sidebar */
.rp-chal-side{position:sticky;top:92px;height:calc(100vh - 108px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(42,122,140,.2) transparent;display:flex;flex-direction:column;gap:14px;min-width:0;}
.rp-chal-side::-webkit-scrollbar{width:4px;}
.rp-chal-side::-webkit-scrollbar-thumb{background:var(--rp-ocean);border-radius:2px;}
.rp-sb-panel{background:linear-gradient(135deg,rgba(30,70,88,.48),rgba(7,13,18,.55));border:1px solid rgba(78,192,212,.18);border-radius:4px;overflow:hidden;}
.rp-sb-hdr{background:rgba(7,13,18,.35);padding:10px 14px;border-bottom:1px solid rgba(78,192,212,.12);display:flex;align-items:center;justify-content:space-between;}
.rp-sb-hdr h3{font-family:var(--f-display);font-size:11px;color:var(--rp-surf);letter-spacing:1px;}
.rp-sb-hdr .sb-tag{font-family:var(--f-mono);font-size:9px;color:var(--rp-sunset);}
/* Contestant roster in sidebar */
.rp-sb-roster{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;}
.rp-sb-row{background:rgba(26,42,54,.5);border:1px solid rgba(42,122,140,.15);border-top:3px solid var(--pc,var(--rp-tide));border-radius:6px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;transition:border-color .3s,background .3s;}
.rp-sb-row:hover{background:rgba(42,60,74,.4);border-color:rgba(78,192,212,.3);}
.rp-sb-row .sb-name{font-family:var(--f-mono);font-size:9px;color:var(--rp-foam);text-align:center;line-height:1.2;}
.rp-sb-row .sb-zone{font-family:var(--f-mono);font-size:8px;color:var(--rp-tide);opacity:.7;}
.rp-sb-eggs{display:flex;gap:3px;align-items:center;}
/* Condor threat bar (legacy — still used in aggression meter) */
.rp-condor-panel{padding:12px;}
.rp-condor-bar-bg{width:100%;height:8px;background:rgba(7,13,18,.6);border-radius:4px;overflow:hidden;border:1px solid rgba(192,57,43,.2);margin-top:8px;}
.rp-condor-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--rp-sunset),var(--rp-condor));transition:width .4s ease;animation:rp-threat-pulse 2s ease-in-out infinite alternate;}
@keyframes rp-threat-pulse{0%{box-shadow:0 0 4px rgba(192,57,43,.3)}100%{box-shadow:0 0 12px rgba(192,57,43,.6)}}
.rp-condor-label{font-family:var(--f-mono);font-size:9px;color:var(--rp-condor);margin-top:4px;display:flex;justify-content:space-between;}
/* Race progress */
.rp-race-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.rp-race-name{font-family:var(--f-mono);font-size:9px;color:var(--rp-foam);width:55px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.rp-race-bar-bg{flex:1;height:6px;background:rgba(7,13,18,.5);border-radius:3px;overflow:hidden;}
.rp-race-bar-fill{height:100%;border-radius:3px;transition:width .5s ease;}
.rp-cave-bar-bg{flex:1;height:5px;background:rgba(7,13,18,.5);border-radius:3px;overflow:hidden;min-width:40px;}
.rp-cave-bar-fill{height:100%;border-radius:3px;transition:width .5s ease;}
/* Results table */
.rp-results-grid{display:flex;flex-direction:column;gap:5px;padding:14px;}
.rp-result-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:4px;background:rgba(13,24,32,.5);border:1px solid rgba(42,122,140,.1);}
.rp-result-row.top{background:rgba(200,160,64,.1);border-color:rgba(200,160,64,.3);}
.rp-result-rank{font-family:var(--f-title);font-size:13px;color:var(--rp-coral);min-width:26px;}
.rp-result-name{flex:1;font-family:var(--f-mono);font-size:11px;color:var(--rp-bone);}
.rp-result-score{font-family:var(--f-mono2);font-size:10px;color:var(--rp-sand);margin-left:auto;}
/* Census */
.rp-census-legend{display:flex;gap:14px;padding:6px 14px;font-family:var(--f-mono2);font-size:9px;color:var(--rp-sand);flex-wrap:wrap;}
.rp-census-legend span{display:flex;align-items:center;gap:3px;}
.rp-census-grid{display:flex;flex-direction:column;gap:5px;padding:8px 14px;}
.rp-census-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:4px;background:rgba(13,24,32,.5);border:1px solid rgba(42,122,140,.1);}
.rp-census-row.top{background:rgba(200,160,64,.08);border-color:rgba(200,160,64,.25);}
.rp-census-info{display:flex;flex-direction:column;min-width:70px;}
.rp-census-name{font-family:var(--f-mono);font-size:11px;color:var(--rp-bone);}
.rp-census-color{font-family:var(--f-mono2);font-size:9px;text-transform:uppercase;letter-spacing:.5px;}
.rp-census-eggs{display:flex;gap:10px;flex:1;flex-wrap:wrap;align-items:center;}
.rp-census-group{display:flex;align-items:center;gap:3px;}
.rp-census-label{font-size:11px;margin-right:3px;opacity:.8;}
.rp-census-egg{display:inline-block;width:16px;height:20px;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;position:relative;}
.rp-census-egg.nested{background:var(--egg-color);box-shadow:0 0 8px var(--egg-color),0 0 3px var(--egg-color),inset 0 -3px 4px rgba(0,0,0,.25);border:1.5px solid rgba(255,255,255,.35);}
.rp-census-egg.carrying{background:var(--egg-color);opacity:.7;border:1px dashed rgba(255,255,255,.3);}
.rp-census-egg.held{background:var(--egg-color);opacity:.5;border:1px solid rgba(255,80,80,.4);}
.rp-census-egg.unfound{background:rgba(60,60,60,.4);border:1px dashed var(--egg-color);opacity:.5;}
.rp-census-egg.lost{background:rgba(40,40,40,.3);border:1px solid rgba(120,40,40,.3);position:relative;}
.rp-census-egg.lost::after{content:'✕';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:8px;color:rgba(200,60,60,.7);}
.rp-census-tally{font-family:var(--f-title);font-size:13px;color:var(--rp-coral);min-width:32px;text-align:right;}
/* Controls */
.rp-controls{position:fixed;bottom:0;left:172px;right:0;z-index:100;background:rgba(7,13,18,.85);backdrop-filter:blur(10px);border-top:1px solid rgba(42,122,140,.2);padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:16px;}
.rp-btn{font-family:var(--f-display);font-size:11px;color:var(--rp-foam);background:rgba(42,122,140,.2);border:1px solid rgba(78,192,212,.3);border-radius:4px;padding:8px 20px;cursor:pointer;transition:all .25s;letter-spacing:.5px;}
.rp-btn:hover{background:rgba(78,192,212,.25);border-color:var(--rp-surf);box-shadow:0 0 12px rgba(78,192,212,.15);}
.rp-btn.primary{background:linear-gradient(135deg,rgba(232,118,84,.3),rgba(240,164,100,.2));border-color:var(--rp-coral);color:var(--rp-bone);}
.rp-btn.primary:hover{background:linear-gradient(135deg,rgba(232,118,84,.4),rgba(240,164,100,.3));box-shadow:0 0 16px rgba(232,118,84,.2);}
.rp-counter{font-family:var(--f-mono);font-size:11px;color:var(--rp-tide);}
/* Pact list */
.rp-pact-row{display:flex;align-items:center;gap:6px;margin-bottom:4px;padding:0 10px;font-family:var(--f-mono);font-size:10px;color:var(--rp-foam);line-height:1.8;}
.rp-pact-row .pact-dot{display:inline-block;width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.rp-pact-row .pact-type{font-size:8px;margin-left:auto;}
/* Field sidebar — Egg Tracker */
.rp-field-tracker{display:flex;flex-direction:column;gap:2px;padding:8px 10px;max-height:340px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(42,122,140,.15) transparent;}
.rp-ft-row{display:flex;align-items:center;gap:8px;padding:8px 8px;border-radius:4px;background:rgba(13,24,32,.4);border:1px solid rgba(42,122,140,.08);transition:background .2s;}
.rp-ft-row:hover{background:rgba(26,42,54,.55);}
.rp-ft-row.ft-gone{opacity:.4;filter:grayscale(.5);}
.rp-ft-av{width:30px;height:30px;border-radius:50%;overflow:hidden;border:2px solid var(--rp-tide);flex-shrink:0;background:rgba(7,13,18,.5);}
.rp-ft-av img{width:100%;height:100%;object-fit:cover;}
.ft-init{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-family:var(--f-mono);font-size:10px;color:var(--rp-foam);background:rgba(42,60,74,.6);}
.rp-ft-info{flex:1;min-width:0;}
.rp-ft-name{font-family:var(--f-display);font-size:10px;color:var(--rp-bone);letter-spacing:1px;display:flex;align-items:center;gap:5px;}
.rp-ft-color{display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.rp-ft-clabel{font-family:var(--f-mono);font-size:7px;color:var(--rp-tide);letter-spacing:.3px;}
.rp-ft-eggs{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;}
.rp-ft-egg{width:11px;height:14px;border-radius:50% 50% 45% 45%;border:1px solid rgba(0,0,0,.3);position:relative;}
.rp-ft-egg.nested{background:var(--ec,var(--rp-surf));box-shadow:inset -2px -2px 0 rgba(0,0,0,.2),0 0 6px rgba(78,192,212,.3);}
.rp-ft-egg.nested::after{content:'';position:absolute;bottom:-1px;right:-1px;width:5px;height:5px;background:var(--rp-gold);border-radius:50%;border:1px solid rgba(0,0,0,.3);}
.rp-ft-egg.held{background:var(--ec,var(--rp-surf));box-shadow:inset -2px -2px 0 rgba(0,0,0,.2);animation:rp-egg-pulse 2s ease-in-out infinite alternate;}
@keyframes rp-egg-pulse{0%{opacity:.7}100%{opacity:1}}
.rp-ft-egg.lost{background:rgba(192,57,43,.35);border-color:rgba(192,57,43,.5);box-shadow:none;}
.rp-ft-egg.lost::after{content:'';position:absolute;top:3px;left:2px;width:7px;height:1px;background:var(--rp-condor);transform:rotate(-30deg);}
.rp-ft-egg.other{background:var(--ec,#888);opacity:.55;box-shadow:inset -1px -1px 0 rgba(0,0,0,.15);border-style:dashed;}
.rp-ft-egg.pool{background:var(--ec,var(--rp-surf));opacity:.3;box-shadow:inset -1px -1px 0 rgba(0,0,0,.1);border-style:dotted;}
.rp-ft-none{font-family:var(--f-mono);font-size:8px;color:var(--rp-tide);opacity:.5;font-style:italic;}
.rp-ft-sep{width:1px;height:12px;background:rgba(78,192,212,.25);margin:0 2px;align-self:center;}
.rp-ft-status{font-family:var(--f-mono);font-size:9px;color:var(--rp-tide);margin-top:2px;letter-spacing:.3px;}
.rp-ft-remain{font-family:var(--f-mono);font-size:8px;color:var(--rp-tide);margin-left:auto;padding:1px 5px;border-radius:3px;background:rgba(42,122,140,.15);letter-spacing:.3px;}
.rp-ft-remain.hurt{color:var(--rp-condor);background:rgba(192,57,43,.2);border:1px solid rgba(192,57,43,.3);}
/* Field sidebar — Activity Log */
.rp-field-log{display:flex;flex-direction:column;gap:1px;padding:6px;max-height:340px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(42,122,140,.15) transparent;}
.rp-field-log::-webkit-scrollbar{width:3px;}
.rp-field-log::-webkit-scrollbar-thumb{background:var(--rp-ocean);border-radius:2px;}
.rp-log-entry{display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:3px;background:rgba(13,24,32,.3);border-left:2px solid rgba(42,122,140,.15);transition:background .2s;}
.rp-log-entry:hover{background:rgba(26,42,54,.45);}
.rp-log-av{width:20px;height:20px;border-radius:50%;overflow:hidden;border:1.5px solid var(--rp-tide);flex-shrink:0;background:rgba(7,13,18,.5);}
.rp-log-av img{width:100%;height:100%;object-fit:cover;}
.rp-log-body{flex:1;min-width:0;font-family:var(--f-mono);font-size:8.5px;line-height:1.3;color:var(--rp-foam);}
.rp-log-name{color:var(--rp-bone);font-weight:600;margin-right:3px;}
.rp-log-desc{color:var(--rp-tide);}
.rp-log-badge{font-family:var(--f-mono);font-size:6.5px;padding:1px 4px;border-radius:2px;letter-spacing:.3px;flex-shrink:0;white-space:nowrap;}
.rp-log-badge.rp-b-egg{background:rgba(78,192,212,.15);color:var(--rp-surf);border:1px solid rgba(78,192,212,.2);}
.rp-log-badge.rp-b-social{background:rgba(200,160,64,.15);color:var(--rp-gold-lt);border:1px solid rgba(200,160,64,.2);}
.rp-log-badge.rp-b-hazard{background:rgba(232,118,84,.15);color:var(--rp-coral);border:1px solid rgba(232,118,84,.2);}
.rp-log-badge.rp-b-condor{background:rgba(192,57,43,.15);color:var(--rp-condor);border:1px solid rgba(192,57,43,.2);}
.rp-log-badge.rp-b-win{background:rgba(200,160,64,.2);color:var(--rp-gold);border:1px solid rgba(200,160,64,.3);}
.rp-log-badge.rp-b-alliance{background:rgba(78,192,212,.1);color:var(--rp-surf);border:1px solid rgba(78,192,212,.15);}
.rp-log-empty{font-family:var(--f-mono);font-size:9px;color:var(--rp-tide);opacity:.5;text-align:center;padding:16px;font-style:italic;}
/* Title card — wood sculpture title */
.rp-hero-title{font-family:var(--f-hero);font-size:88px;line-height:.92;letter-spacing:3px;color:rgb(31,22,7);text-shadow:rgba(255,255,255,.35) 1px 1px 0,rgba(0,0,0,.45) -1px -1px 0,var(--rp-sand-dk) 4px 4px 0,rgba(62,46,20,.5) 7px 7px 0;margin:0;padding:0;}
.rp-hero-title .coral{color:#a82820;}
.rp-hero-title .bang{color:#3a7a44;}
/* Glyph columns */
.rp-glyph-col{position:absolute;top:24px;bottom:24px;width:48px;
  display:flex;flex-direction:column;align-items:center;justify-content:space-around;
  padding:14px 0;gap:6px;z-index:2;
  background:linear-gradient(180deg,rgba(62,46,20,.2),rgba(62,46,20,.32));
  border:1.5px solid rgba(62,46,20,.4);border-radius:3px;
  box-shadow:inset 1px 1px 0 rgba(255,255,255,.28),inset -1px -1px 0 rgba(0,0,0,.25);}
.rp-glyph-col.left{left:22px;}
.rp-glyph-col.right{right:22px;}
.rp-glyph-col svg{width:26px;height:26px;fill:var(--rp-sand-deep);opacity:.85;
  filter:drop-shadow(0 1px 0 rgba(255,255,255,.3));}
/* Corner labels */
.rp-corner-label{position:absolute;font-family:var(--f-mono);font-size:9px;letter-spacing:2px;color:var(--rp-sand-deep);opacity:.45;text-transform:uppercase;}
.rp-corner-label.tl{top:8px;left:80px;}
.rp-corner-label.tr{top:8px;right:80px;}
/* Condor scene diorama */
.rp-scene{position:relative;height:160px;margin-top:16px;border-radius:6px;overflow:hidden;background:linear-gradient(180deg,rgba(13,24,32,.95) 0%,rgba(26,42,54,.92) 40%,rgba(30,70,88,.6) 100%);border:1px solid rgba(42,122,140,.2);box-shadow:inset 0 0 40px rgba(0,0,0,.4);}
.rp-scene-ground{position:absolute;bottom:0;left:0;right:0;height:48px;background:linear-gradient(180deg,rgba(112,86,52,.25),rgba(112,86,52,.45));border-top:1px solid rgba(168,137,90,.15);}
.rp-scene-moai{position:absolute;bottom:40px;opacity:.18;fill:var(--rp-sand-dk);}
.rp-scene-moai.m1{left:10%;width:60px;height:80px;}
.rp-scene-moai.m2{right:12%;width:50px;height:70px;}
/* Player figures in scene */
.rp-scene-players{position:absolute;bottom:24px;left:5%;right:5%;height:120px;}
.rp-scene-fig{position:absolute;bottom:0;display:flex;flex-direction:column;align-items:center;gap:2px;animation:rp-fig-idle 3s ease-in-out infinite alternate;}
.rp-scene-fig .fig-ring{width:42px;height:42px;border-radius:50%;border:3px solid var(--fig-color,var(--rp-sand-dk));overflow:hidden;background:radial-gradient(circle at 35% 35%,var(--fig-color,var(--rp-sand-dk)),rgba(0,0,0,.5));box-shadow:0 2px 8px rgba(0,0,0,.4);}
.rp-scene-fig .fig-ring img{width:100%;height:100%;object-fit:contain;border-radius:50%;}
.rp-scene-fig .fig-name{font-family:var(--f-mono);font-size:7px;color:var(--rp-foam);opacity:.7;letter-spacing:.5px;text-align:center;white-space:nowrap;}
.rp-scene-fig .fig-egg{width:6px;height:8px;border-radius:50%;margin-top:-1px;box-shadow:0 0 4px rgba(0,0,0,.3);}
/* Condor swoop */
.rp-condor-swoop{position:absolute;top:18px;left:-80px;animation:rp-condor-fly 6s ease-in-out infinite;}
.rp-condor-swoop svg{width:80px;height:40px;fill:var(--rp-condor);opacity:.7;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5));}
/* Player reaction animations */
.rp-scene-fig.duck{animation:rp-fig-duck 6s ease-in-out infinite;}
.rp-scene-fig.grabbed{animation:rp-fig-grabbed 6s ease-in-out infinite;}
.rp-scene-fig.dodge{animation:rp-fig-dodge 6s ease-in-out infinite;}
@keyframes rp-fig-idle{0%{transform:translateY(0)}100%{transform:translateY(-3px)}}
@keyframes rp-condor-fly{0%{left:-80px;top:18px;opacity:.7}35%{left:45%;top:60px;opacity:1}65%{left:55%;top:35px;opacity:1}100%{left:110%;top:12px;opacity:.5}}
@keyframes rp-fig-duck{0%,30%{transform:scale(1) translateY(0)}38%{transform:scale(.7) translateY(6px)}46%{transform:scale(1) translateY(0)}100%{transform:scale(1) translateY(0)}}
@keyframes rp-fig-grabbed{0%,32%{transform:translateY(0)}40%{transform:translateY(-28px)}48%{transform:translateY(-22px)}55%{transform:translateY(0)}100%{transform:translateY(0)}}
@keyframes rp-fig-dodge{0%,34%{transform:translateX(0)}42%{transform:translateX(14px)}50%{transform:translateX(-8px)}58%{transform:translateX(0)}100%{transform:translateX(0)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;}.rp-mote,.rp-waves,.field-scan,.cave-drip,.pillar-wind,.rp-condor-swoop{display:none;}.rp-scene-fig{transform:none!important;}}
@media(max-width:900px){.rp-layout{grid-template-columns:1fr;}.rp-chal-side{position:relative;top:0;max-height:none;}.rp-hero{padding-left:32px;padding-right:32px;}.rp-hero h1{font-size:48px;}.rp-hero-title{font-size:48px;}.rp-roster-strip{grid-template-columns:repeat(2,1fr);}.rp-glyph-col{display:none;}.rp-corner-label{display:none;}.rp-scene-fig .fig-ring{width:32px;height:32px;}}
`;

const _PALM_SVG = `<svg viewBox="0 0 260 240" xmlns="http://www.w3.org/2000/svg"><defs><symbol id="rp-g-palm" viewBox="0 0 260 240"><g fill="#1a3a1a"><path d="M0 0 Q 80 60 150 90 Q 130 92 60 80 Q 20 50 0 0 Z"/><path d="M0 0 Q 100 100 160 150 Q 120 130 50 120 Q 18 70 0 0 Z" opacity=".85"/><path d="M0 0 Q 60 130 90 200 Q 60 150 30 140 Q 10 60 0 0 Z" opacity=".78"/><path d="M0 0 Q 18 140 40 230 Q 22 150 14 130 Q 6 60 0 0 Z" opacity=".72"/><path d="M0 0 Q 130 30 200 50 Q 140 50 70 50 Q 20 30 0 0 Z" opacity=".65"/></g><g fill="#2d5a30"><path d="M0 0 Q 70 50 130 80 Q 100 78 55 72 Q 22 45 0 0 Z" opacity=".55"/><path d="M0 0 Q 50 110 78 180 Q 50 130 24 120 Q 10 55 0 0 Z" opacity=".45"/></g></symbol></defs><use href="#rp-g-palm"/></svg>`;

function _rpShell(content, ep, phase = 'field') {
  const epNum = ep?.episodeNum || (gs.episodeHistory?.length || 0) + 1;
  const active = Object.keys(ep?.challengeData?.colorAssign || {});
  const sprayMotes = Array.from({ length: 30 }, () => {
    const left = 40 + Math.random() * 70;
    const top = 40 + Math.random() * 60;
    const dur = 10 + Math.random() * 16;
    const delay = -Math.random() * 16;
    const op = (0.25 + Math.random() * 0.55).toFixed(2);
    const sz = (2 + Math.random() * 3).toFixed(1);
    return `<div class="rp-mote" style="left:${left.toFixed(1)}%;top:${top.toFixed(1)}%;animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s;opacity:${op};width:${sz}px;height:${sz}px"></div>`;
  }).join('');

  return `<div class="rp-shell">
<style>${_RP_CSS}</style>
<div class="rp-atmo phase-${phase}"></div>
<div class="rp-stars"></div>
<div class="rp-palms">
<svg class="rp-palm tl" viewBox="0 0 260 240" xmlns="http://www.w3.org/2000/svg"><use href="#rp-g-palm"/></svg>
<svg class="rp-palm tr" viewBox="0 0 260 240" xmlns="http://www.w3.org/2000/svg"><use href="#rp-g-palm"/></svg>
<svg class="rp-palm bl" viewBox="0 0 260 240" xmlns="http://www.w3.org/2000/svg"><use href="#rp-g-palm"/></svg>
<svg class="rp-palm br" viewBox="0 0 260 240" xmlns="http://www.w3.org/2000/svg"><use href="#rp-g-palm"/></svg>
<svg style="position:absolute;width:0;height:0;"><defs><symbol id="rp-g-palm" viewBox="0 0 260 240"><g fill="#1a3a1a"><path d="M0 0 Q 80 60 150 90 Q 130 92 60 80 Q 20 50 0 0 Z"/><path d="M0 0 Q 100 100 160 150 Q 120 130 50 120 Q 18 70 0 0 Z" opacity=".85"/><path d="M0 0 Q 60 130 90 200 Q 60 150 30 140 Q 10 60 0 0 Z" opacity=".78"/><path d="M0 0 Q 18 140 40 230 Q 22 150 14 130 Q 6 60 0 0 Z" opacity=".72"/><path d="M0 0 Q 130 30 200 50 Q 140 50 70 50 Q 20 30 0 0 Z" opacity=".65"/></g><g fill="#2d5a30"><path d="M0 0 Q 70 50 130 80 Q 100 78 55 72 Q 22 45 0 0 Z" opacity=".55"/><path d="M0 0 Q 50 110 78 180 Q 50 130 24 120 Q 10 55 0 0 Z" opacity=".45"/></g></symbol></defs></svg>
</div>
<svg style="position:absolute;width:0;height:0;"><defs><symbol id="rp-g-flank-moai" viewBox="0 0 200 600"><g><rect x="14" y="520" width="172" height="78" rx="6" fill="#080c10"/><rect x="34" y="380" width="132" height="160" rx="10" fill="#0d1820"/><ellipse cx="100" cy="220" rx="78" ry="170" fill="#0d1820"/><ellipse cx="100" cy="360" rx="68" ry="40" fill="#1a2a36"/><path d="M30 180 Q 100 150 170 180 L 170 200 Q 100 170 30 200 Z" fill="#1a2a36"/><ellipse cx="70" cy="230" rx="14" ry="22" fill="#070d12"/><ellipse cx="130" cy="230" rx="14" ry="22" fill="#070d12"/><path d="M95 250 L88 340 L112 340 L105 250 Z" fill="#1a2a36"/><rect x="76" y="370" width="48" height="8" rx="2" fill="#1a2a36"/><path d="M28 100 Q 50 70 80 60 Q 60 90 44 180 Z" fill="rgba(168,224,230,.06)"/></g></symbol></defs></svg>
<div class="rp-flank l" aria-hidden="true"><svg viewBox="0 0 200 600"><use href="#rp-g-flank-moai"/></svg></div>
<div class="rp-flank r" aria-hidden="true"><svg viewBox="0 0 200 600"><use href="#rp-g-flank-moai"/></svg></div>
<div class="rp-moai-row"><div class="rp-moai-sil s1"><div class="head"></div><div class="body"></div></div><div class="rp-moai-sil s2"><div class="head"></div><div class="body"></div></div><div class="rp-moai-sil s3"><div class="head"></div><div class="body"></div></div><div class="rp-moai-sil s4"><div class="head"></div><div class="body"></div></div><div class="rp-moai-sil s5"><div class="head"></div><div class="body"></div></div><div class="rp-moai-sil s6"><div class="head"></div><div class="body"></div></div></div>
<div class="rp-waves"></div>
<div class="rp-spray">${sprayMotes}</div>
${content}
</div>`;
}

// ══════════════════════════════════════════════════════════════
// SIDEBAR BUILDER
// ══════════════════════════════════════════════════════════════

function _buildSidebarContent(epData, screenKey) {
  const cd = _getChalData(epData);
  if (!cd) return '';
  const st = _tvState[screenKey];
  const revIdx = st?.idx ?? -1;

  const contestants = Object.keys(cd.colorAssign || {});
  const lastTickStates = _getPlayerStateAtReveal(cd, screenKey);

  // ── Phase bar (always shown) ──
  const phaseMap = { 'rp-field': 0, 'rp-cave': 1, 'rp-pillar': 2 };
  const currentPhase = phaseMap[screenKey] ?? 0;
  const phases = ['EGG HUNT', 'CAVE', 'PILLAR'];
  let phasesHTML = `<div class="rp-sb-panel"><div class="rp-sb-hdr"><h3>Challenge Phases</h3><span class="sb-tag">${currentPhase + 1} of ${phases.length}</span></div>`;
  phasesHTML += `<div class="rp-progress" style="display:flex;gap:4px;padding:10px 14px;">`;
  for (let i = 0; i < phases.length; i++) {
    const active = i <= currentPhase;
    const bg = active ? 'rgba(78,192,212,.35)' : 'rgba(7,13,18,.4)';
    const clr = active ? 'var(--rp-surf)' : 'var(--rp-tide)';
    const op = active ? '1' : '.4';
    phasesHTML += `<div style="flex:1;text-align:center;padding:6px 4px;background:${bg};border-radius:3px;opacity:${op};">
      <div style="font-family:var(--f-mono);font-size:7px;color:${clr};opacity:.7;">${String(i + 1).padStart(2, '0')}</div>
      <div style="font-family:var(--f-mono);font-size:8px;color:${clr};letter-spacing:.5px;">${phases[i]}</div>
    </div>`;
  }
  phasesHTML += `</div></div>`;

  // ══ FIELD-SPECIFIC SIDEBAR ══
  if (screenKey === 'rp-field') {
    return phasesHTML + _buildFieldSidebar(cd, contestants, lastTickStates, revIdx);
  }

  // ══ CAVE-SPECIFIC SIDEBAR ══
  if (screenKey === 'rp-cave') {
    return phasesHTML + _buildCaveSidebar(cd, contestants, lastTickStates, revIdx);
  }

  // ══ PILLAR-SPECIFIC SIDEBAR ══
  return phasesHTML + _buildPillarSidebar(cd, contestants, lastTickStates, revIdx);
}

function _buildFieldSidebar(cd, contestants, lastTickStates, revIdx) {
  const fieldEvts = cd.fieldEvents || [];
  const visibleEvts = revIdx >= 0 ? fieldEvts.slice(0, revIdx + 1) : [];

  // ── Derive egg lifecycle per player from visible field events ──
  // Track own-color and foreign eggs separately, purely from events (not tick state)
  const eggLife = {};
  for (const n of contestants) {
    eggLife[n] = { ownCarry: 0, foreignCarry: [], lost: 0, sabotaged: [], helpedBy: [], negotiated: [], gone: false };
  }

  for (const ev of visibleEvts) {
    const p = ev.player || ev.actor;
    if (ev.type === 'find-own' && eggLife[p]) {
      eggLife[p].ownCarry++;
    } else if (ev.type === 'find-other' && eggLife[p]) {
      // Finder picks up a foreign egg
      eggLife[p].foreignCarry.push({ target: ev.target, color: ev.color });
    } else if (ev.type === 'egg-help') {
      // Finder gave the egg to its owner — remove from finder, add to owner
      if (eggLife[ev.actor || p]) {
        const fi = eggLife[ev.actor || p].foreignCarry.findIndex(e => e.target === ev.target);
        if (fi >= 0) eggLife[ev.actor || p].foreignCarry.splice(fi, 1);
      }
      if (eggLife[ev.target]) {
        eggLife[ev.target].ownCarry++;
        eggLife[ev.target].helpedBy.push(ev.actor || p);
      }
    } else if (ev.type === 'egg-sabotage') {
      // Finder destroyed the egg — remove from finder's foreign, target loses it
      if (eggLife[ev.actor || p]) {
        const fi = eggLife[ev.actor || p].foreignCarry.findIndex(e => e.target === ev.target);
        if (fi >= 0) eggLife[ev.actor || p].foreignCarry.splice(fi, 1);
      }
      if (eggLife[ev.target]) {
        eggLife[ev.target].sabotaged.push(ev.actor || p);
        eggLife[ev.target].lost++;
      }
    } else if (ev.type === 'egg-deal') {
      if (eggLife[p]) eggLife[p].negotiated.push({ target: ev.target, outcome: ev.outcome, demandType: ev.demandType });
      if (ev.outcome === 'accept' || ev.outcome === 'counter') {
        // Egg returned to owner — remove from finder's foreign, add to owner's own
        if (eggLife[p]) {
          const fi = eggLife[p].foreignCarry.findIndex(e => e.target === ev.target);
          if (fi >= 0) eggLife[p].foreignCarry.splice(fi, 1);
        }
        if (eggLife[ev.target]) eggLife[ev.target].ownCarry++;
      } else if (ev.outcome === 'refuse') {
        // Finder hid the egg — remove from finder, target loses access
        if (eggLife[p]) {
          const fi = eggLife[p].foreignCarry.findIndex(e => e.target === ev.target);
          if (fi >= 0) eggLife[p].foreignCarry.splice(fi, 1);
        }
        if (eggLife[ev.target]) eggLife[ev.target].lost++;
      }
    } else if (ev.type === 'egg-hostage') {
      // Finder holds egg hostage — stays in finder's foreign list
      // (already added via find-other)
    } else if (ev.type === 'extort-submit') {
      if (eggLife[ev.actor || p]) {
        const fi = eggLife[ev.actor || p].foreignCarry.findIndex(e => e.target === ev.target);
        if (fi >= 0) eggLife[ev.actor || p].foreignCarry.splice(fi, 1);
      }
      if (eggLife[ev.target]) eggLife[ev.target].ownCarry++;
    } else if (ev.type === 'extort-resist') {
      if (eggLife[ev.actor || p]) {
        const fi = eggLife[ev.actor || p].foreignCarry.findIndex(e => e.target === ev.target);
        if (fi >= 0) eggLife[ev.actor || p].foreignCarry.splice(fi, 1);
      }
      if (eggLife[ev.target]) eggLife[ev.target].lost++;
    } else if (ev.type === 'egg-hide') {
      // Finder hid the egg — remove from finder's foreign
      if (eggLife[p]) {
        const fi = eggLife[p].foreignCarry.findIndex(e => e.target === ev.target);
        if (fi >= 0) eggLife[p].foreignCarry.splice(fi, 1);
      }
    } else if (ev.type === 'zone-advance' && eggLife[p]) {
      eggLife[p].gone = true;
    } else if (ev.type === 'eliminated' && eggLife[p]) {
      eggLife[p].gone = true;
    }
  }

  // ── EGG TRACKER panel ──
  const sortedPlayers = [...contestants].sort((a, b) => {
    const sa = eggLife[a], sb = eggLife[b];
    const scoreA = sa.ownCarry * 5 + sa.foreignCarry.length;
    const scoreB = sb.ownCarry * 5 + sb.foreignCarry.length;
    return scoreB - scoreA;
  });

  let trackerHTML = `<div class="rp-sb-panel"><div class="rp-sb-hdr"><h3>${_icon('egg')} Egg Tracker</h3><span class="sb-tag">FIELD</span></div>`;
  trackerHTML += `<div class="rp-field-tracker">`;

  const epp = cd.eggsPerPlayer || EGGS_PER_PLAYER;
  for (const n of sortedPlayers) {
    const el = eggLife[n];
    const color = cd.colorAssign[n];
    const pc = color?.hex || '#4ec0d4';
    const colorLabel = (color?.label || '?').toUpperCase();
    const sl = slug(n);
    const remaining = epp - el.lost;

    // Own eggs (player's color)
    let ownDotsHTML = '';
    for (let i = 0; i < el.ownCarry; i++) ownDotsHTML += `<span class="rp-ft-egg held" style="--ec:${pc}" title="Your egg"></span>`;

    // Foreign eggs (other colors) — shown in the other player's color
    let foreignDotsHTML = '';
    for (const f of el.foreignCarry) {
      const fc = f.color?.hex || cd.colorAssign[f.target]?.hex || '#888';
      foreignDotsHTML += `<span class="rp-ft-egg other" style="--ec:${fc}" title="${f.target}'s egg"></span>`;
    }

    // Status line
    let statusParts = [];
    if (el.ownCarry > 0) statusParts.push(`${el.ownCarry} own`);
    if (el.foreignCarry.length > 0) statusParts.push(`${el.foreignCarry.length} foreign`);
    if (el.gone) statusParts = ['ENTERED CAVE'];
    const statusLine = statusParts.length > 0 ? statusParts.join(' · ') : 'searching...';
    const remainTag = el.lost > 0 ? `<span class="rp-ft-remain hurt">${remaining}/${epp}</span>` : `<span class="rp-ft-remain">${epp}</span>`;

    const initials = n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    trackerHTML += `<div class="rp-ft-row${el.gone ? ' ft-gone' : ''}">
      <div class="rp-ft-av" style="border-color:${pc}">
        <img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.outerHTML='<span class=ft-init>${initials}</span>'">
      </div>
      <div class="rp-ft-info">
        <div class="rp-ft-name">${n.toUpperCase()}<span class="rp-ft-color" style="background:${pc}"></span><span class="rp-ft-clabel">${colorLabel}</span>${remainTag}</div>
        <div class="rp-ft-eggs">${(ownDotsHTML || foreignDotsHTML) ? `${ownDotsHTML}${ownDotsHTML && foreignDotsHTML ? '<span class="rp-ft-sep"></span>' : ''}${foreignDotsHTML}` : '<span class="rp-ft-none">no eggs yet</span>'}</div>
        <div class="rp-ft-status">${statusLine}</div>
      </div>
    </div>`;
  }
  trackerHTML += `</div></div>`;

  // ── ACTIVITY LOG panel ──
  const logEvts = [...visibleEvts].reverse().slice(0, 15);
  let logHTML = `<div class="rp-sb-panel"><div class="rp-sb-hdr"><h3>${_icon('moai')} Activity Log</h3><span class="sb-tag">${visibleEvts.length} events</span></div>`;
  logHTML += `<div class="rp-field-log">`;

  if (logEvts.length === 0) {
    logHTML += `<div class="rp-log-empty">Waiting for first reveal...</div>`;
  }

  for (const ev of logEvts) {
    const p = ev.player || ev.actor || '?';
    const pc = cd.colorAssign[p]?.hex || '#4ec0d4';
    const sl = slug(p);
    const badge = _cardBadge(ev.type, ev);
    const badgeCls = badge[0];
    const badgeLabel = badge[1];

    let desc = '';
    switch (ev.type) {
      case 'find-own': desc = `found own egg at ${ev.head}'s moai`; break;
      case 'find-other': {
        const tCol = cd.colorAssign[ev.target]?.label || '?';
        desc = `found ${ev.target}'s ${tCol} egg at ${ev.head}'s moai`;
        break;
      }
      case 'search-fail': desc = `searched ${ev.head}'s moai — nothing`; break;
      case 'egg-help': desc = `delivered egg to ${ev.target}`; break;
      case 'egg-sabotage': desc = `destroyed ${ev.target}'s egg`; break;
      case 'egg-hostage': desc = `took ${ev.target}'s egg hostage`; break;
      case 'egg-hide': desc = `hid ${ev.target}'s egg elsewhere`; break;
      case 'egg-negotiate': desc = `demands ${ev.demandType} from ${ev.target}`; break;
      case 'egg-deal': {
        const outcomeLabel = ev.outcome === 'accept' ? 'DEAL' : ev.outcome === 'counter' ? 'counter-offer' : 'no deal';
        desc = `${outcomeLabel} with ${ev.target}`;
        break;
      }
      case 'egg-trade': desc = `traded egg with ${ev.target}`; break;
      case 'egg-extort': desc = `extorting ${ev.target}`; break;
      case 'extort-resist': desc = `${ev.target} resisted — egg destroyed`; break;
      case 'extort-submit': desc = `${ev.target} submitted — egg returned`; break;
      case 'basket': desc = `wove a carrying basket`; break;
      case 'basket-gift': desc = `gifted basket to ${ev.target}`; break;
      case 'sabotage-discovery': desc = `caught ${ev.target} destroying eggs`; break;
      case 'intel-share': desc = `shared intel with ${ev.target}`; break;
      case 'alliance-search': desc = `coordinating search`; break;
      case 'trash-talk': desc = `trash talking ${ev.target || ''}`; break;
      case 'rock-head-react': desc = `reacted to a moai`; break;
      case 'zone-advance': desc = `entered the cave`; break;
      case 'field-eliminated': desc = `eliminated — not enough eggs to enter cave`; break;
      case 'cave-eliminated': desc = `eliminated — lost all eggs in cave`; break;
      case 'pillar-eliminated': desc = `eliminated — lost all eggs on pillar`; break;
      case 'cave-armor': desc = ev.armor === 'reinforced' ? `eggs reinforced — first in` : `eggs fragile — last out`; break;
      case 'cave-hazard': desc = ev.broken > 1 ? `lost ${ev.broken} eggs in ${ev.segment || 'cave'}` : `lost an egg in ${ev.segment || 'cave'}`; break;
      case 'cave-hazard-safe': desc = `survived ${ev.segment || 'cave'} hazard — eggs intact`; break;
      case 'cave-block': desc = `blocked ${ev.target} in the squeeze`; break;
      case 'cave-warn': desc = `warned ${ev.target} about hazards ahead`; break;
      case 'cave-carry': desc = `carried ${ev.target}'s eggs through squeeze`; break;
      case 'cave-race': desc = `raced ${ev.target} — ${ev.winner === p ? 'won' : 'lost'}`; break;
      case 'cave-trash': desc = `trash talked ${ev.target} in the dark`; break;
      case 'exit-distraction': desc = `held back debris for ${ev.target}`; break;
      case 'cross-shout': desc = `shouted intel across zones`; break;
      case 'cross-taunt': desc = `taunted from above`; break;
      case 'eliminated': desc = `eliminated — all eggs lost`; break;
      default: desc = badgeLabel.toLowerCase();
    }

    const logInit = p.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    logHTML += `<div class="rp-log-entry">
      <div class="rp-log-av" style="border-color:${pc}">
        <img src="assets/avatars/${sl}.png" alt="${p}" onerror="this.outerHTML='<span class=ft-init>${logInit}</span>'">
      </div>
      <div class="rp-log-body">
        <span class="rp-log-name">${p}</span>
        <span class="rp-log-desc">${desc}</span>
      </div>
      <span class="rp-log-badge ${badgeCls}">${badgeLabel}</span>
    </div>`;
  }
  logHTML += `</div></div>`;

  return trackerHTML + logHTML;
}

function _buildCaveSidebar(cd, contestants, lastTickStates, revIdx) {
  const caveEvts = cd.caveEvents || [];
  const visibleEvts = revIdx >= 0 ? caveEvts.slice(0, revIdx + 1) : [];
  const segNames = ['Boulder Corridor', 'Narrow Squeeze', 'Exit Passage'];
  const segIcons = ['&#9650;', '&#9644;', '&#9654;'];

  // Derive cave state per player from visible events
  const caveState = {};
  for (const n of contestants) {
    caveState[n] = { segment: 0, eggsCarried: 0, eggsLost: 0, inCave: false, exited: false, eliminated: false, exitOrder: 0, events: [], pace: null, stuck: false, pythonHit: false, lastOut: false, firstOut: false, forcedExit: false };
  }

  let exitOrder = 0;
  for (const ev of visibleEvts) {
    const p = ev.player || ev.actor;
    if (!caveState[p]) continue;
    const cs = caveState[p];

    if (!cs.inCave && !cs.exited && !cs.eliminated) {
      // First cave event for this player — they're in the cave now
      cs.inCave = true;
    }

    if (ev.type === 'segment-header') {
      const segMap = { 'boulder': 0, 'squeeze': 1, 'exit': 2 };
      if (ev.segment in segMap) cs.segment = segMap[ev.segment];
    } else if (ev.type === 'cave-advance') {
      cs.segment = Math.min(2, (ev.segment || cs.segment + 1));
    } else if (ev.type === 'cave-exit') {
      cs.exited = true; cs.inCave = false;
      cs.exitOrder = ++exitOrder;
      if (ev.first) cs.firstOut = true;
      if (ev.forced) cs.forcedExit = true;
    } else if (ev.type === 'cave-hazard') {
      cs.eggsLost += ev.broken || 1;
    } else if (ev.type === 'squeeze-crack') {
      cs.eggsLost += 1;
    } else if (ev.type === 'cave-eliminated') {
      cs.eliminated = true; cs.inCave = false;
    } else if (ev.type === 'stampede' && ev.player === p) {
      if (ev.broken) cs.eggsLost += 1;
    } else if (ev.type === 'cave-pace') {
      cs.pace = ev.pace;
    } else if (ev.type === 'cave-stuck') {
      cs.stuck = true;
    } else if (ev.type === 'python-strike') {
      cs.pythonHit = true; cs.eggsLost += 1;
    } else if (ev.type === 'cave-last-out') {
      cs.lastOut = true;
    } else if (ev.type === 'shove' && ev.target === p) {
      // shove target may lose an egg
    }

    // Track social/python events for the activity log
    const socialTypes = new Set(['shield', 'shove', 'cave-block', 'panic-chain', 'cave-warn', 'cave-carry', 'cave-race', 'egg-rescue', 'exit-distraction', 'cave-trash', 'stampede', 'python-coil', 'python-coil-push', 'python-coil-wait', 'python-strike', 'python-strike-dodge', 'python-distraction', 'cave-stuck', 'cave-last-out']);
    if (socialTypes.has(ev.type)) {
      cs.events.push(ev);
    }
  }

  // Derive egg counts from visible events only (don't use tick snapshots which spoil ahead)
  // Entry egg count is stored on the first cave-pace event per player
  for (const n of contestants) {
    const cs = caveState[n];
    if (!cs.inCave && !cs.exited && !cs.eliminated) continue;
    const firstPace = visibleEvts.find(e => e.type === 'cave-pace' && e.player === n);
    const entryEggs = firstPace?.entryEggs ?? 0;
    cs.eggsCarried = Math.max(0, entryEggs - cs.eggsLost);
  }

  // ── CAVE PROGRESS panel ──
  const cavePlayers = contestants.filter(n => caveState[n].inCave || caveState[n].exited || caveState[n].eliminated);
  const sortedCave = [...cavePlayers].sort((a, b) => {
    const sa = caveState[a], sb = caveState[b];
    if (sa.exited && !sb.exited) return -1;
    if (!sa.exited && sb.exited) return 1;
    if (sa.exited && sb.exited) return sa.exitOrder - sb.exitOrder;
    if (sa.eliminated && !sb.eliminated) return 1;
    if (!sa.eliminated && sb.eliminated) return -1;
    return sb.segment - sa.segment;
  });

  let progressHTML = `<div class="rp-sb-panel"><div class="rp-sb-hdr"><h3>${_icon('cave')} Cave Progress</h3><span class="sb-tag">${cavePlayers.length} in cave</span></div>`;

  // Segment legend
  progressHTML += `<div style="display:flex;gap:3px;padding:8px 12px 4px;font-family:var(--f-mono);font-size:7.5px;color:var(--rp-tide);letter-spacing:.3px;">`;
  for (let i = 0; i < 3; i++) {
    progressHTML += `<div style="flex:1;text-align:center;padding:3px 2px;background:rgba(13,24,32,.5);border-radius:2px;border:1px solid rgba(42,122,140,.1);">${segIcons[i]} ${segNames[i].toUpperCase()}</div>`;
  }
  progressHTML += `<div style="flex:.6;text-align:center;padding:3px 2px;background:rgba(200,160,64,.1);border-radius:2px;border:1px solid rgba(200,160,64,.15);color:var(--rp-gold-lt);">EXIT</div>`;
  progressHTML += `</div>`;

  progressHTML += `<div class="rp-field-tracker">`;
  for (const n of sortedCave) {
    const cs = caveState[n];
    const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
    const sl = slug(n);
    const initials = n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

    // Progress bar: 3 segments + exit
    const pct = cs.exited ? 100 : cs.eliminated ? 0 : Math.round(((cs.segment) / 3) * 100);
    const segLabel = cs.exited ? 'EXITED' : cs.eliminated ? 'ELIMINATED' : segNames[cs.segment] || 'Entering';

    // Egg dots
    let eggDotsHTML = '';
    for (let i = 0; i < cs.eggsCarried; i++) eggDotsHTML += `<span class="rp-ft-egg held" style="--ec:${pc}"></span>`;
    for (let i = 0; i < cs.eggsLost; i++) eggDotsHTML += `<span class="rp-ft-egg lost"></span>`;

    const hasBasket = lastTickStates?.[n]?.basket;
    const armor = lastTickStates?.[n]?.caveEggArmor;
    let statusParts = [];
    if (cs.eggsCarried > 0) statusParts.push(`${cs.eggsCarried} egg${cs.eggsCarried > 1 ? 's' : ''}`);
    if (cs.eggsLost > 0) statusParts.push(`${cs.eggsLost} lost`);
    if (hasBasket) statusParts.push('basket');
    if (armor === 1) statusParts.push('reinforced');
    if (armor === -1) statusParts.push('fragile');
    if (cs.pace) statusParts.push(cs.pace);
    if (cs.stuck) statusParts.push('STUCK');
    if (cs.pythonHit) statusParts.push('python');
    if (cs.lastOut) statusParts.push('LAST OUT — slow pillar start');
    if (cs.firstOut) statusParts.push('1st out');
    const exitLabel = cs.firstOut ? `Exited (#1) — CATCHER'S MASK` :
                      cs.lastOut ? `Exited (#${cs.exitOrder}) — SLOW START` :
                      cs.forcedExit ? `Forced out (#${cs.exitOrder})` :
                      `Exited${cs.exitOrder > 0 ? ` (#${cs.exitOrder})` : ''}`;
    const statusLine = cs.exited ? exitLabel : cs.eliminated ? 'All eggs lost' : statusParts.join(' · ') || 'entering...';

    progressHTML += `<div class="rp-ft-row${cs.eliminated ? ' ft-gone' : ''}${cs.exited ? '' : ''}">
      <div class="rp-ft-av" style="border-color:${pc}">
        <img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.outerHTML='<span class=ft-init>${initials}</span>'">
      </div>
      <div class="rp-ft-info">
        <div class="rp-ft-name">${n.toUpperCase()}<span class="rp-ft-color" style="background:${pc}"></span></div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
          <div class="rp-cave-bar-bg"><div class="rp-cave-bar-fill" style="background:linear-gradient(90deg,${pc},${pc}88);width:${pct}%"></div></div>
          <span style="font-family:var(--f-mono);font-size:7px;color:${cs.exited ? 'var(--rp-gold-lt)' : cs.eliminated ? 'var(--rp-condor)' : 'var(--rp-tide)'};min-width:40px;white-space:nowrap;">${segLabel.toUpperCase()}</span>
        </div>
        <div class="rp-ft-eggs" style="margin-top:3px;">${eggDotsHTML || '<span class="rp-ft-none">—</span>'}</div>
        <div class="rp-ft-status">${statusLine}</div>
      </div>
    </div>`;
  }

  if (cavePlayers.length === 0) {
    progressHTML += `<div class="rp-log-empty">No one has entered the cave yet.</div>`;
  }
  progressHTML += `</div></div>`;

  // ── CAVE ACTIVITY LOG ──
  const logEvts = [...visibleEvts].reverse().slice(0, 18);
  let logHTML = `<div class="rp-sb-panel"><div class="rp-sb-hdr"><h3>${_icon('alert')} Cave Log</h3><span class="sb-tag">${visibleEvts.length} events</span></div>`;
  logHTML += `<div class="rp-field-log">`;

  if (logEvts.length === 0) {
    logHTML += `<div class="rp-log-empty">Waiting for first reveal...</div>`;
  }

  for (const ev of logEvts) {
    const p = ev.player || ev.actor || '?';
    const pc = cd.colorAssign[p]?.hex || '#4ec0d4';
    const sl = slug(p);
    const badge = _cardBadge(ev.type, ev);
    const badgeCls = badge[0];
    const badgeLabel = badge[1];

    let desc = '';
    switch (ev.type) {
      case 'cave-advance': desc = `cleared ${ev.segName || segNames[Math.min(2, (ev.segment || 1) - 1)] || 'segment'}`; break;
      case 'cave-exit': desc = ev.first ? `FIRST OUT — catcher's mask (blocks 1 condor strike)` : ev.forced ? `forced out after too long in the cave` : `exited the cave`; break;
      case 'cave-hazard': desc = ev.broken > 1 ? `lost ${ev.broken} eggs in ${ev.segment || 'cave'}` : `lost an egg in ${ev.segment || 'cave'}`; break;
      case 'cave-hazard-safe': desc = `survived ${ev.segment || 'cave'} — eggs intact`; break;
      case 'squeeze-crack': desc = `egg cracked in the squeeze`; break;
      case 'shield': desc = `shielded ${ev.target} from boulder`; break;
      case 'shove': desc = `shoved ${ev.target}`; break;
      case 'cave-block': desc = `blocked ${ev.target} in passage`; break;
      case 'panic-chain': desc = ev.calmer ? `calmed ${ev.target} in the dark` : `panic with ${ev.target}`; break;
      case 'cave-warn': desc = `warned ${ev.target} about hazards`; break;
      case 'cave-carry': desc = `helped carry ${ev.target}'s eggs`; break;
      case 'cave-race': desc = `raced ${ev.target} — ${ev.winner === p ? 'won' : 'lost'}`; break;
      case 'egg-rescue': desc = `rescued ${ev.target}'s falling egg`; break;
      case 'exit-distraction': desc = `held debris for ${ev.target}`; break;
      case 'cave-trash': desc = `trash talked ${ev.target}`; break;
      case 'stampede': desc = `caught in stampede`; break;
      case 'cave-eliminated': desc = `eliminated — all eggs lost`; break;
      case 'cave-armor': desc = ev.armor === 'reinforced' ? `eggs reinforced` : `eggs fragile`; break;
      case 'cave-pace': desc = `chose ${ev.pace} pace`; break;
      case 'cave-stuck': desc = `stuck in ${ev.segment || 'cave'}`; break;
      case 'cave-last-out': desc = `LAST OUT — skips first pillar tick (no climb)`; break;
      case 'segment-header': desc = `entering ${ev.segName || 'segment'}`; break;
      case 'python-coil': desc = `python blocking the path`; break;
      case 'python-coil-push': desc = `pushed past the python`; break;
      case 'python-coil-wait': desc = `waited for python to move`; break;
      case 'python-strike': desc = `python struck — egg lost`; break;
      case 'python-strike-dodge': desc = `dodged python strike`; break;
      case 'python-distraction': desc = `distracted python for ${ev.target}`; break;
      default: desc = badgeLabel.toLowerCase();
    }

    const logInit = p.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    logHTML += `<div class="rp-log-entry">
      <div class="rp-log-av" style="border-color:${pc}">
        <img src="assets/avatars/${sl}.png" alt="${p}" onerror="this.outerHTML='<span class=ft-init>${logInit}</span>'">
      </div>
      <div class="rp-log-body">
        <span class="rp-log-name">${p}</span>
        <span class="rp-log-desc">${desc}</span>
      </div>
      <span class="rp-log-badge ${badgeCls}">${badgeLabel}</span>
    </div>`;
  }
  logHTML += `</div></div>`;

  return progressHTML + logHTML;
}

function _buildPillarSidebar(cd, contestants, lastTickStates, revIdx) {
  const pillarEvts = cd.pillarEvents || [];
  const visibleEvts = revIdx >= 0 ? pillarEvts.slice(0, revIdx + 1) : [];
  const etw = cd.eggsToWin || EGGS_TO_WIN;

  // ── Derive pillar state per player from visible events ──
  const pState = {};
  for (const n of contestants) {
    const startEggs = cd.playerStates?.[n]?.pillarStartEggs || cd.eggsPerPlayer || EGGS_PER_PLAYER;
    pState[n] = { tier: 0, trip: 0, nested: 0, eggsLost: 0, atBase: true, hasEgg: false, eliminated: false, isWinner: false, condorHits: 0, condorDodges: 0, socialEvents: [], eggsRemaining: startEggs, startEggs };
  }

  let condorStrikes = 0;
  let condorDodges = 0;
  let currentRound = 0;
  for (const ev of visibleEvts) {
    if (ev.round) currentRound = Math.max(currentRound, ev.round);
    const p = ev.player || ev.actor;
    if (!pState[p]) continue;
    const ps = pState[p];

    switch (ev.type) {
      case 'base-pickup':
        ps.trip = ev.trip || ps.trip + 1;
        ps.hasEgg = true; ps.atBase = false; ps.tier = 0;
        ps.eggsRemaining--;
        break;
      case 'climb':
        ps.tier = ev.tier || Math.min(3, ps.tier + 1);
        break;
      case 'slip':
        ps.tier = Math.max(0, ps.tier - 1);
        break;
      case 'fall':
        ps.tier = 0; ps.hasEgg = false; ps.atBase = true; ps.eggsLost++;
        break;
      case 'nest':
        ps.nested = ev.nested || ps.nested + 1;
        ps.hasEgg = false;
        if (ps.nested >= etw) ps.isWinner = true;
        break;
      case 'descent-nest':
        ps.nested = ev.nested || ps.nested + 1;
        ps.hasEgg = false; ps.tier = 0; ps.atBase = true;
        break;
      case 'descent-crash':
        ps.hasEgg = false; ps.tier = 0; ps.atBase = true; ps.eggsLost++;
        break;
      case 'condor-hit':
        ps.condorHits++; condorStrikes++;
        if (ev.text?.includes('shatter') || ev.text?.includes('explode') || ev.text?.includes('survive') || ev.text?.includes('lost')) {
          ps.hasEgg = false; ps.tier = 0; ps.atBase = true; ps.eggsLost++;
        } else {
          ps.tier = Math.max(0, ps.tier - 1);
        }
        break;
      case 'condor-dodge': case 'condor-flinch':
        ps.condorDodges++; condorDodges++;
        break;
      case 'wind-gust': case 'pillar-fumble':
        ps.hasEgg = false; ps.tier = 0; ps.atBase = true; ps.eggsLost++;
        break;
      case 'nest-rejection':
        ps.nested = Math.max(0, ps.nested - 1); ps.eggsLost++;
        break;
      case 'pillar-eliminated':
        ps.eliminated = true; ps.hasEgg = false;
        break;
      case 'pillar-slow-start':
      case 'pillar-round':
        break;
      case 'base-sabotage': {
        ps.socialEvents.push(ev);
        const tgt = ev.target;
        if (pState[tgt]) { pState[tgt].hasEgg = false; pState[tgt].eggsLost++; }
        break;
      }
      case 'sprint':
        ps.tier = ev.tier || Math.min(3, ps.tier + (ev.gain || 2));
        break;
      case 'sprint-fail':
        ps.tier = Math.max(0, ps.tier - 1);
        break;
      case 'fall-break':
        ps.hasEgg = false; ps.tier = 0; ps.atBase = true; ps.eggsLost++;
        break;
      case 'brace': case 'panic-frozen':
        break;
      case 'taunt': case 'shield-ally': case 'trash-talk-pillar': case 'climbing-tip':
      case 'showmance-pillar': case 'strategic-wait': case 'panic-freeze':
      case 'boost': case 'pep-talk': case 'alliance-climb': case 'race-rivalry':
      case 'nest-block': case 'nest-blocked':
      case 'knock-down': case 'condor-bait': case 'egg-catch': case 'summit-showdown':
      case 'desperate-throw':
        ps.socialEvents.push(ev);
        break;
    }
  }

  // ── PILLAR TRACKER panel ──
  const sortedPlayers = [...contestants].filter(n => {
    const ps = pState[n];
    return ps.trip > 0 || ps.nested > 0 || ps.eliminated;
  }).sort((a, b) => {
    const sa = pState[a], sb = pState[b];
    if (sa.isWinner && !sb.isWinner) return -1;
    if (!sa.isWinner && sb.isWinner) return 1;
    if (sa.eliminated && !sb.eliminated) return 1;
    if (!sa.eliminated && sb.eliminated) return -1;
    if (sb.nested !== sa.nested) return sb.nested - sa.nested;
    return sb.tier - sa.tier;
  });

  const tierLabels = ['BASE', 'TIER 1', 'TIER 2', 'SUMMIT'];

  let trackerHTML = `<div class="rp-sb-panel"><div class="rp-sb-hdr"><h3>${_icon('climb')} Pillar Tracker</h3><span class="sb-tag">ROUND ${currentRound} · ${sortedPlayers.length} climbing</span></div>`;

  // Tier legend
  trackerHTML += `<div style="display:flex;gap:3px;padding:8px 12px 4px;font-family:var(--f-mono);font-size:7.5px;color:var(--rp-tide);letter-spacing:.3px;">`;
  for (let i = 0; i < 4; i++) {
    const bg = i === 3 ? 'rgba(200,160,64,.15)' : 'rgba(13,24,32,.5)';
    const clr = i === 3 ? 'var(--rp-gold-lt)' : 'var(--rp-tide)';
    const border = i === 3 ? 'rgba(200,160,64,.2)' : 'rgba(42,122,140,.1)';
    trackerHTML += `<div style="flex:1;text-align:center;padding:3px 2px;background:${bg};border-radius:2px;border:1px solid ${border};color:${clr};">${tierLabels[i]}</div>`;
  }
  trackerHTML += `</div>`;

  trackerHTML += `<div class="rp-field-tracker">`;

  if (sortedPlayers.length === 0) {
    trackerHTML += `<div class="rp-log-empty">No one has reached the pillar yet.</div>`;
  }

  for (const n of sortedPlayers) {
    const ps = pState[n];
    const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
    const sl = slug(n);
    const initials = n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);

    // Progress bar: tier / 3
    const pct = ps.isWinner ? 100 : ps.eliminated ? 0 : Math.round((ps.tier / 3) * 100);
    const posLabel = ps.isWinner ? 'WINNER' : ps.eliminated ? 'OUT' : ps.atBase ? 'BASE' : tierLabels[Math.min(3, ps.tier)];
    const posColor = ps.isWinner ? 'var(--rp-gold-lt)' : ps.eliminated ? 'var(--rp-condor)' : ps.atBase ? 'var(--rp-tide)' : 'var(--rp-surf)';

    // Egg dots: all starting eggs shown as visual dots, state changes as events reveal
    // nested (solid gold) + in-hand (pulsing) + pool (dim waiting) + lost (X)
    let eggDotsHTML = '';
    for (let i = 0; i < ps.nested; i++) eggDotsHTML += `<span class="rp-ft-egg nested" style="--ec:${pc}"></span>`;
    if (ps.hasEgg) eggDotsHTML += `<span class="rp-ft-egg held" style="--ec:${pc}"></span>`;
    const eggsInPool = Math.max(0, ps.eggsRemaining);
    for (let i = 0; i < eggsInPool; i++) eggDotsHTML += `<span class="rp-ft-egg pool" style="--ec:${pc}"></span>`;
    for (let i = 0; i < ps.eggsLost; i++) eggDotsHTML += `<span class="rp-ft-egg lost"></span>`;

    // Status
    let statusParts = [];
    if (ps.isWinner) {
      statusParts = [`${etw}/${etw} NESTED — IMMUNE`];
    } else if (ps.eliminated) {
      statusParts = ['all eggs gone'];
    } else {
      if (ps.nested > 0) statusParts.push(`${ps.nested}/${etw} nested`);
      statusParts.push(`${eggsInPool} egg${eggsInPool !== 1 ? 's' : ''} left`);
      if (ps.trip > 0) statusParts.push(`trip ${ps.trip}`);
      if (ps.condorHits > 0) statusParts.push(`${ps.condorHits} condor hit${ps.condorHits > 1 ? 's' : ''}`);
    }
    const statusLine = statusParts.length > 0 ? statusParts.join(' · ') : 'waiting...';

    trackerHTML += `<div class="rp-ft-row${ps.eliminated ? ' ft-gone' : ''}">
      <div class="rp-ft-av" style="border-color:${pc}">
        <img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.outerHTML='<span class=ft-init>${initials}</span>'">
      </div>
      <div class="rp-ft-info">
        <div class="rp-ft-name">${n.toUpperCase()}<span class="rp-ft-color" style="background:${pc}"></span></div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
          <div class="rp-cave-bar-bg"><div class="rp-cave-bar-fill" style="background:linear-gradient(90deg,${pc},${pc}88);width:${pct}%"></div></div>
          <span style="font-family:var(--f-mono);font-size:7px;color:${posColor};min-width:40px;white-space:nowrap;">${posLabel}</span>
        </div>
        <div class="rp-ft-eggs" style="margin-top:3px;">${eggDotsHTML || '<span class="rp-ft-none">—</span>'}</div>
        <div class="rp-ft-status">${statusLine}</div>
      </div>
    </div>`;
  }
  trackerHTML += `</div></div>`;

  // ── CONDOR THREAT panel (derived from visible events) ──
  const totalCondorEvents = condorStrikes + condorDodges;
  const threatPct = Math.min(100, Math.round((totalCondorEvents / 15) * 100));
  const condorLabel = threatPct < 30 ? 'CIRCLING' : threatPct < 60 ? 'AGGRESSIVE' : threatPct < 85 ? 'HUNTING' : 'ENRAGED';
  const condorChick = cd.condorChickName || 'CODY JR.';

  let condorHTML = `<div class="rp-sb-panel"><div class="rp-sb-hdr"><h3>${_icon('condor')} Condor Threat</h3><span class="sb-tag">${condorStrikes} HITS · ${condorDodges} DODGED</span></div>`;
  condorHTML += `<div class="rp-condor-panel">`;
  condorHTML += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">`;
  condorHTML += `<div style="text-align:center;padding:6px;background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.2);border-radius:3px;">
    <div style="font-family:var(--f-title);font-size:16px;color:var(--rp-condor);">${condorStrikes}</div>
    <div style="font-family:var(--f-mono);font-size:7px;color:var(--rp-condor);letter-spacing:.5px;">STRIKES</div>
  </div>`;
  condorHTML += `<div style="text-align:center;padding:6px;background:rgba(78,192,212,.08);border:1px solid rgba(78,192,212,.15);border-radius:3px;">
    <div style="font-family:var(--f-title);font-size:16px;color:var(--rp-surf);">${condorDodges}</div>
    <div style="font-family:var(--f-mono);font-size:7px;color:var(--rp-surf);letter-spacing:.5px;">DODGED</div>
  </div>`;
  condorHTML += `</div>`;
  condorHTML += `<div style="font-family:var(--f-mono);font-size:9px;color:var(--rp-foam);opacity:.7;margin:4px 0;">Aggression · ${condorLabel}</div>`;
  condorHTML += `<div class="rp-condor-bar-bg"><div class="rp-condor-bar-fill" style="width:${threatPct}%"></div></div>`;
  condorHTML += `<div class="rp-condor-label"><span>CALM</span><span>${threatPct}%</span><span>RAGE</span></div>`;

  // Per-player condor encounters
  const condorPlayers = contestants.filter(n => pState[n].condorHits > 0 || pState[n].condorDodges > 0);
  if (condorPlayers.length > 0) {
    condorHTML += `<div style="margin-top:10px;border-top:1px solid rgba(42,122,140,.15);padding-top:8px;">`;
    condorHTML += `<div style="font-family:var(--f-mono);font-size:7.5px;color:var(--rp-tide);letter-spacing:.4px;margin-bottom:6px;">PLAYER ENCOUNTERS</div>`;
    for (const n of condorPlayers) {
      const ps = pState[n];
      const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
      condorHTML += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-family:var(--f-mono);font-size:8.5px;">`;
      condorHTML += `<span style="color:${pc};min-width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n}</span>`;
      if (ps.condorHits > 0) condorHTML += `<span style="color:var(--rp-condor);">${ps.condorHits} hit${ps.condorHits > 1 ? 's' : ''}</span>`;
      if (ps.condorDodges > 0) condorHTML += `<span style="color:var(--rp-surf);">${ps.condorDodges} dodge${ps.condorDodges > 1 ? 's' : ''}</span>`;
      condorHTML += `</div>`;
    }
    condorHTML += `</div>`;
  }

  condorHTML += `</div></div>`;

  // ── ACTIVITY LOG panel ──
  const logEvts = [...visibleEvts].reverse().slice(0, 24);
  let logHTML = `<div class="rp-sb-panel" style="max-height:380px;overflow-y:auto;"><div class="rp-sb-hdr"><h3>${_icon('alert')} Pillar Log</h3><span class="sb-tag">${visibleEvts.length} events</span></div>`;
  logHTML += `<div class="rp-field-log">`;

  if (logEvts.length === 0) {
    logHTML += `<div class="rp-log-empty">Waiting for first reveal...</div>`;
  }

  for (const ev of logEvts) {
    const p = ev.player || ev.actor || '?';
    const pc = cd.colorAssign[p]?.hex || '#4ec0d4';
    const sl = slug(p);
    const badge = _cardBadge(ev.type, ev);
    const badgeCls = badge[0];
    const badgeLabel = badge[1];

    let desc = '';
    switch (ev.type) {
      case 'base-pickup': desc = ev.trip === 1 ? `grabbed first egg` : `grabbed egg — trip ${ev.trip}`; break;
      case 'climb': desc = `climbed to tier ${ev.tier || '?'}`; break;
      case 'slip': desc = `slipped back a tier`; break;
      case 'fall': desc = `fell — egg lost`; break;
      case 'nest': desc = `nested egg ${ev.nested}/${etw}`; break;
      case 'descent-nest': desc = `nested ${ev.nested}/${etw} — back to base`; break;
      case 'descent-crash': desc = `egg shattered — crashed to base`; break;
      case 'condor-hit': desc = `condor strike — ${ev.text?.includes('shatter') || ev.text?.includes('explode') ? 'egg lost' : 'knocked back'}`; break;
      case 'condor-dodge': desc = `dodged condor dive`; break;
      case 'condor-flinch': desc = `flinched — condor passed`; break;
      case 'condor-bait': desc = `baited condor away from ${ev.target || 'ally'}`; break;
      case 'boost': desc = `boosted ${ev.target} up a tier`; break;
      case 'knock-down': desc = `knocked ${ev.target} back`; break;
      case 'pep-talk': desc = `encouraged ${ev.target}`; break;
      case 'base-sabotage': desc = `crushed ${ev.target}'s egg at base`; break;
      case 'race-rivalry': desc = `racing ${ev.target} — tensions high`; break;
      case 'alliance-climb': desc = `climbing with ${ev.target}`; break;
      case 'nest-block': desc = `blocked ${ev.target} at the nest`; break;
      case 'nest-blocked': desc = `blocked at the nest`; break;
      case 'egg-catch': desc = `caught ${ev.target}'s falling egg`; break;
      case 'summit-showdown': desc = `summit showdown with ${ev.target}`; break;
      case 'desperate-throw': desc = ev.success ? `desperate throw — NESTED` : `desperate throw — missed`; break;
      case 'pillar-fumble': desc = `fumbled — egg gone`; break;
      case 'wind-gust': desc = `wind gust — egg lost`; break;
      case 'nest-rejection': desc = `condor knocked egg from nest`; break;
      case 'pillar-eliminated': desc = `eliminated — no eggs left`; break;
      case 'pillar-slow-start': desc = `late arrival — skipped turn`; break;
      case 'pillar-round': desc = `round ${ev.round} begins`; break;
      case 'nest-sabotage': desc = `sabotaged ${ev.target}'s nest attempt`; break;
      default: desc = badgeLabel.toLowerCase();
    }

    const logInit = p.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    logHTML += `<div class="rp-log-entry">
      <div class="rp-log-av" style="border-color:${pc}">
        <img src="assets/avatars/${sl}.png" alt="${p}" onerror="this.outerHTML='<span class=ft-init>${logInit}</span>'">
      </div>
      <div class="rp-log-body">
        <span class="rp-log-name">${p}</span>
        <span class="rp-log-desc">${desc}</span>
      </div>
      <span class="rp-log-badge ${badgeCls}">${badgeLabel}</span>
    </div>`;
  }
  logHTML += `</div></div>`;

  return trackerHTML + condorHTML + logHTML;
}

// ══════════════════════════════════════════════════════════════
// MAP UPDATE FUNCTIONS
// ══════════════════════════════════════════════════════════════

function _updateFieldMap(screenKey) {
  const epNum = window.vpEpNum;
  const epData = gs.episodeHistory?.[epNum - 1];
  const cd = _getChalData(epData);
  if (!cd) return;
  const st = _tvState[screenKey];
  const revIdx = st?.idx ?? -1;

  const fieldEvts = cd.fieldEvents || [];
  const heads = cd.heads || [];
  const displayHeads = heads.slice(0, 8);
  const contestants = Object.keys(cd.colorAssign || {});

  const headState = {};
  for (const h of displayHeads) headState[h] = { searches: [], found: [], active: false };

  const playerLastHead = {};
  const playerVisible = {};

  for (let i = 0; i <= revIdx && i < fieldEvts.length; i++) {
    const ev = fieldEvts[i];
    const pName = ev.player || ev.actor;
    if (pName) playerVisible[pName] = true;

    const headName = ev.head;
    if (headName && headState[headName]) {
      if (pName) {
        headState[headName].searches.push({ player: pName, tick: ev.tick, type: ev.type });
        playerLastHead[pName] = displayHeads.indexOf(headName);
      }
      if (ev.type === 'find-own' || ev.type === 'egg-help' || ev.type === 'egg-trade' || ev.type === 'egg-sabotage') {
        const eggOwner = ev.type === 'find-own' ? (ev.player || ev.actor) : ev.target;
        const eggColor = ev.color?.hex || cd.colorAssign[eggOwner]?.hex || '#4ec0d4';
        headState[headName].found.push({ color: eggColor, owner: eggOwner, finder: ev.player || ev.actor, type: ev.type });
      }
    }
    if (ev.type === 'zone-advance' && pName) {
      playerVisible[pName] = 'gone';
    }
  }

  if (revIdx >= 0 && revIdx < fieldEvts.length) {
    const curEv = fieldEvts[revIdx];
    if (curEv.head && headState[curEv.head]) {
      headState[curEv.head].active = true;
    }
  }

  for (let hi = 0; hi < displayHeads.length; hi++) {
    const h = displayHeads[hi];
    const hs = headState[h];
    const headEl = document.getElementById(`rp-fh-${hi}`);
    const statusEl = document.getElementById(`rp-fh-status-${hi}`);
    const eggsEl = document.getElementById(`rp-fh-eggs-${hi}`);

    if (headEl) {
      headEl.classList.toggle('fh-active', hs.active);
      headEl.classList.toggle('fh-searched', hs.searches.length > 0 && hs.found.length === 0);
    }

    if (statusEl) {
      if (hs.found.length > 0) {
        let html = '';
        for (const f of hs.found) {
          const init = (f.finder || '?').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
          const icon = f.type === 'egg-sabotage' ? _icon('skull') : _icon('egg');
          html += `<span class="fh-found" style="color:${f.color}">${icon} ${init}</span>`;
        }
        statusEl.innerHTML = html;
      } else if (hs.searches.length > 0) {
        const last = hs.searches[hs.searches.length - 1];
        const pc = cd.colorAssign[last.player]?.hex || '#4ec0d4';
        statusEl.innerHTML = `<span class="fh-searched-icon" style="color:${pc}">✗ ${hs.searches.length}</span>`;
      } else {
        statusEl.innerHTML = '';
      }
    }

    if (eggsEl) {
      const allEggs = cd.headEggs?.[h] || [];
      const foundOwners = hs.found.map(f => f.owner);
      let dotsHTML = '';
      for (const egg of allEggs) {
        if (!foundOwners.includes(egg.owner)) {
          const hex = egg.color?.hex || '#4ec0d4';
          dotsHTML += `<div class="field-egg" style="background:${hex}"></div>`;
        }
      }
      eggsEl.innerHTML = dotsHTML;
    }
  }

  // Move player avatars to the moai they last interacted with
  for (let pi = 0; pi < contestants.length; pi++) {
    const n = contestants[pi];
    const marker = document.getElementById(`rp-field-player-${pi}`);
    if (!marker) continue;

    const vis = playerVisible[n];
    if (vis === 'gone') {
      marker.classList.add('fp-gone');
    } else {
      marker.classList.remove('fp-gone');
    }

    const hi = playerLastHead[n];
    if (hi !== undefined && hi >= 0) {
      const col = hi % 4;
      const row = Math.floor(hi / 4);
      const baseLeft = (col * 23) + 5;
      const baseTop = (row * 35) + 12;
      const stagger = (pi % 3) * 8 - 8;
      marker.style.left = clamp(baseLeft + stagger, 2, 85) + '%';
      marker.style.top = clamp(baseTop + 38 + (pi % 2) * 10, 10, 88) + '%';
    }
  }
}

function _updateCaveMap(screenKey) {
  const epNum = window.vpEpNum;
  const epData = gs.episodeHistory?.[epNum - 1];
  const cd = _getChalData(epData);
  if (!cd) return;
  const st = _tvState[screenKey];
  const revIdx = st?.idx ?? -1;

  const caveEvts = cd.caveEvents || [];
  const contestants = Object.keys(cd.colorAssign || {});
  const segIdMap = { 'boulder': 0, 'squeeze': 1, 'exit': 2 };

  const pState = {};
  for (const n of contestants) pState[n] = { seg: -1, inCave: false, exited: false, eliminated: false, firstOut: false, lastOut: false, forced: false, eggs: cd.eggsPerPlayer || 5, pythonSeg: -1 };

  const pythonSegs = new Set();

  for (let i = 0; i <= revIdx && i < caveEvts.length; i++) {
    const ev = caveEvts[i];
    const pn = ev.player;
    const ps = pn ? pState[pn] : null;

    if (ev.type === 'segment-header' && ps) {
      ps.inCave = true;
      if (ev.segment in segIdMap) ps.seg = segIdMap[ev.segment];
    } else if (ev.type === 'cave-advance' && ps) {
      ps.seg = typeof ev.segment === 'number' ? ev.segment : (ps.seg + 1);
    } else if (ev.type === 'cave-exit' && ps) {
      ps.exited = true; ps.inCave = false;
      if (ev.first) ps.firstOut = true;
      if (ev.forced) ps.forced = true;
    } else if (ev.type === 'cave-last-out' && ps) {
      ps.lastOut = true;
    } else if (ev.type === 'cave-eliminated' && ps) {
      ps.eliminated = true; ps.inCave = false;
    } else if (ev.type === 'python-strike' && ps) {
      ps.eggs = Math.max(0, ps.eggs - 1);
      if (ps.seg >= 0) pythonSegs.add(ps.seg);
    } else if (ev.type === 'python-coil-wait' && ps) {
      if (ps.seg >= 0) pythonSegs.add(ps.seg);
    } else if (ev.type === 'python-coil-push' && ps) {
      if (ps.seg >= 0) pythonSegs.add(ps.seg);
    } else if (ev.type === 'python-strike-dodge' && ps) {
      if (ps.seg >= 0) pythonSegs.add(ps.seg);
    } else if (ev.type === 'squeeze-crack' && ps) {
      ps.eggs = Math.max(0, ps.eggs - 1);
    } else if (ev.type === 'stampede' && ps) {
      ps.eggs = Math.max(0, ps.eggs - 1);
    }
  }

  const segCenters = [21, 49, 77];
  const exitPct = 93;
  const enterPct = 3;
  let exitCount = 0;

  for (let pi = 0; pi < contestants.length; pi++) {
    const n = contestants[pi];
    const marker = document.getElementById(`rp-cave-player-${pi}`);
    const eggsEl = document.getElementById(`rp-cave-eggs-${pi}`);
    if (!marker) continue;
    const p = pState[n];
    const pc = cd.colorAssign[n]?.hex || '#4ec0d4';

    marker.classList.remove('cp-exited', 'cp-eliminated', 'cp-first-out', 'cp-last-out');

    if (!p.inCave && !p.exited && !p.eliminated && p.seg < 0) {
      marker.style.display = 'none';
    } else {
      marker.style.display = 'block';
      let leftPct, topPct;
      if (p.exited) {
        const exitIdx = exitCount++;
        const col = exitIdx % 3;
        const row = Math.floor(exitIdx / 3);
        leftPct = exitPct - 4 + col * 3;
        topPct = 35 + row * 16;
        marker.classList.add('cp-exited');
        if (p.firstOut) marker.classList.add('cp-first-out');
        if (p.lastOut) marker.classList.add('cp-last-out');
      } else if (p.eliminated) {
        leftPct = p.seg >= 0 ? segCenters[Math.min(p.seg, 2)] : enterPct;
        topPct = 42 + (pi % 3) * 14;
        marker.classList.add('cp-eliminated');
      } else if (p.seg >= 0) {
        leftPct = segCenters[Math.min(p.seg, 2)];
        const stagger = (pi % 5) * 4 - 8;
        leftPct += stagger;
        topPct = 42 + (pi % 3) * 14;
      } else {
        leftPct = enterPct;
        topPct = 42 + (pi % 3) * 14;
      }
      marker.style.left = Math.max(2, Math.min(95, leftPct)) + '%';
      marker.style.top = topPct + '%';
    }

    if (eggsEl) {
      let dotsHTML = '';
      for (let ei = 0; ei < p.eggs; ei++) {
        dotsHTML += `<div class="cp-egg" style="background:${pc}"></div>`;
      }
      eggsEl.innerHTML = dotsHTML;
    }
  }

  // Highlight active segment zones + python indicators
  for (let si = 0; si < 3; si++) {
    const zoneEl = document.getElementById(`rp-cave-zone-${si}`);
    const pyEl = document.getElementById(`rp-cave-python-${si}`);
    const hasPlayers = contestants.some(n => pState[n].inCave && pState[n].seg === si);
    if (zoneEl) zoneEl.classList.toggle('csz-active', hasPlayers);
    if (pyEl) pyEl.classList.toggle('cp-visible', pythonSegs.has(si));
  }
}

function _updatePillarMap(screenKey) {
  const epNum = window.vpEpNum;
  const epData = gs.episodeHistory?.[epNum - 1];
  const cd = _getChalData(epData);
  if (!cd) return;
  const st = _tvState[screenKey];
  const revIdx = st?.idx ?? -1;

  const pillarEvts = cd.pillarEvents || [];
  const contestants = Object.keys(cd.colorAssign || {});
  const etw = cd.eggsToWin || EGGS_TO_WIN;

  // Derive pillar state from visible events only
  const pState = {};
  for (const n of contestants) pState[n] = { tier: 0, trip: 0, nested: 0, atBase: true, hasEgg: false, eliminated: false, isWinner: false, visible: false };

  for (let i = 0; i <= revIdx && i < pillarEvts.length; i++) {
    const ev = pillarEvts[i];
    const p = ev.player || ev.actor;
    if (!pState[p]) continue;
    const ps = pState[p];
    ps.visible = true;

    switch (ev.type) {
      case 'base-pickup':
        ps.trip = ev.trip || ps.trip + 1;
        ps.hasEgg = true; ps.atBase = false; ps.tier = 0;
        break;
      case 'climb':
        ps.tier = ev.tier || Math.min(3, ps.tier + 1);
        break;
      case 'slip':
        ps.tier = Math.max(0, ps.tier - 1);
        break;
      case 'fall': case 'descent-crash': case 'wind-gust': case 'pillar-fumble':
        ps.tier = 0; ps.hasEgg = false; ps.atBase = true;
        break;
      case 'nest':
        ps.nested = ev.nested || ps.nested + 1;
        ps.hasEgg = false;
        if (ps.nested >= etw) ps.isWinner = true;
        break;
      case 'descent-nest':
        ps.nested = ev.nested || ps.nested + 1;
        ps.hasEgg = false; ps.tier = 0; ps.atBase = true;
        break;
      case 'condor-hit':
        if (ev.text?.includes('shatter') || ev.text?.includes('explode') || ev.text?.includes('survive') || ev.text?.includes('lost')) {
          ps.hasEgg = false; ps.tier = 0; ps.atBase = true;
        } else {
          ps.tier = Math.max(0, ps.tier - 1);
        }
        break;
      case 'nest-rejection':
        ps.nested = Math.max(0, ps.nested - 1);
        break;
      case 'pillar-eliminated':
        ps.eliminated = true; ps.hasEgg = false;
        break;
      case 'boost':
        if (ev.target && pState[ev.target]) pState[ev.target].tier = Math.min(3, pState[ev.target].tier + 1);
        break;
      case 'knock-down':
        if (ev.target && pState[ev.target]) pState[ev.target].tier = Math.max(0, pState[ev.target].tier - 1);
        break;
      case 'alliance-climb':
        if (ev.target && pState[ev.target]) pState[ev.target].tier = Math.min(3, pState[ev.target].tier + 1);
        ps.tier = Math.min(3, ps.tier + 1);
        break;
    }
  }

  // Update nest eggs
  const nestEl = document.getElementById('rp-pillar-nest');
  if (nestEl) {
    let nestHTML = '';
    for (const n of contestants) {
      const ps = pState[n];
      if (ps.nested > 0) {
        const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
        for (let i = 0; i < ps.nested; i++) {
          nestHTML += `<div class="nest-egg" style="background:${pc}"></div>`;
        }
      }
    }
    nestEl.innerHTML = nestHTML;
  }

  // Update climber positions — group by tier for stagger
  const tierPcts = [75, 55, 35, 15];
  const tierGroups = { base: [], elim: [], winner: [], 0: [], 1: [], 2: [], 3: [] };
  for (let pi = 0; pi < contestants.length; pi++) {
    const n = contestants[pi];
    const ps = pState[n];
    if (!ps.visible) continue;
    if (ps.eliminated) tierGroups.elim.push(pi);
    else if (ps.isWinner) tierGroups.winner.push(pi);
    else if (ps.atBase) tierGroups.base.push(pi);
    else tierGroups[clamp(ps.tier, 0, 3)].push(pi);
  }

  for (let pi = 0; pi < contestants.length; pi++) {
    const n = contestants[pi];
    const marker = document.getElementById(`rp-pillar-climber-${pi}`);
    if (!marker) continue;
    const ps = pState[n];

    marker.classList.remove('pc-at-base', 'pc-eliminated', 'pc-winner', 'pc-has-egg');

    if (!ps.visible) {
      marker.style.display = 'none';
      continue;
    }

    marker.style.display = 'block';

    if (ps.eliminated) {
      marker.classList.add('pc-eliminated');
      const idx = tierGroups.elim.indexOf(pi);
      const count = tierGroups.elim.length;
      const spread = Math.min(14, 60 / Math.max(1, count));
      marker.style.top = '85%';
      marker.style.left = `${50 + (idx - (count - 1) / 2) * spread}%`;
    } else if (ps.isWinner) {
      marker.classList.add('pc-winner');
      marker.style.top = '8%';
      marker.style.left = '50%';
    } else if (ps.atBase) {
      marker.classList.add('pc-at-base');
      const idx = tierGroups.base.indexOf(pi);
      const count = tierGroups.base.length;
      const spacing = Math.min(32, 120 / Math.max(1, count));
      const offset = (idx - (count - 1) / 2) * spacing;
      marker.style.top = '80%';
      marker.style.left = `calc(50% + ${offset}px)`;
    } else {
      const tier = clamp(ps.tier, 0, 3);
      const topPct = tierPcts[tier];
      const group = tierGroups[tier];
      const idx = group.indexOf(pi);
      const count = group.length;
      const spacing = Math.min(40, 140 / Math.max(1, count));
      const offset = (idx - (count - 1) / 2) * spacing;
      marker.style.top = topPct + '%';
      marker.style.left = `calc(50% + ${offset}px)`;
    }

    if (ps.hasEgg) marker.classList.add('pc-has-egg');

    // Update label
    const label = marker.querySelector('.pc-label');
    if (label) {
      const statusBits = [];
      if (ps.isWinner) statusBits.push('IMMUNE');
      else if (ps.eliminated) statusBits.push('OUT');
      else {
        if (ps.trip > 0) statusBits.push(`T${ps.trip}`);
        statusBits.push(`${ps.nested}/${etw}`);
        if (ps.atBase) statusBits.push('base');
      }
      label.textContent = `${n} · ${statusBits.join(' · ')}`;
    }

    // Update egg indicator
    const eggEl = marker.querySelector('.pc-eggs');
    if (eggEl) {
      const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
      let dotsHTML = '';
      for (let i = 0; i < ps.nested; i++) dotsHTML += `<div class="pc-egg nested" style="background:${pc}"></div>`;
      if (ps.hasEgg) dotsHTML += `<div class="pc-egg held" style="background:${pc}"></div>`;
      eggEl.innerHTML = dotsHTML;
    }
  }
}

// ══════════════════════════════════════════════════════════════
// MAP BUILDERS
// ══════════════════════════════════════════════════════════════

function _buildFieldMap(cd) {
  const heads = cd.heads || [];
  const contestants = Object.keys(cd.colorAssign || {});
  const displayHeads = heads.slice(0, 8);

  let headHTML = '';
  for (let hi = 0; hi < displayHeads.length; hi++) {
    const h = displayHeads[hi];
    const eggs = cd.headEggs?.[h] || [];
    let eggDots = '';
    for (const egg of eggs) {
      const hex = egg.color?.hex || '#4ec0d4';
      eggDots += `<div class="field-egg" style="background:${hex};--ad:${(hi * 0.15).toFixed(1)}s"></div>`;
    }
    const shortName = h.length > 10 ? h.slice(0, 8) + '..' : h;
    headHTML += `<div class="field-head" id="rp-fh-${hi}">
      <div class="field-head-icon"><div class="fh-face"><div class="fh-eye l"></div><div class="fh-eye r"></div></div></div>
      <div class="field-head-name">${shortName.toUpperCase()}</div>
      <div class="fh-status" id="rp-fh-status-${hi}"></div>
      <div class="field-eggs" id="rp-fh-eggs-${hi}">${eggDots}</div>
    </div>`;
  }

  let playerAvatars = '';
  for (let pi = 0; pi < contestants.length; pi++) {
    const n = contestants[pi];
    const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
    const sl = players.find(p => p.name === n)?.slug || n.toLowerCase().replace(/\s+/g, '-');
    const initials = n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    playerAvatars += `<div class="field-player" id="rp-field-player-${pi}" style="border-color:${pc};top:85%;left:${15 + pi * 12}%"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.outerHTML='<div class=fp-fallback>${initials}</div>'"><span class="fp-label">${n.split(' ')[0].toUpperCase()}</span></div>`;
  }

  return `<div class="rp-map" id="rp-field-map">
    <div class="rp-map-header"><h3>ROCK HEAD FIELD &mdash; OVERHEAD VIEW</h3><span class="map-tag">LIVE TRACKING</span></div>
    <div class="rp-map-body map-field">
      <div class="field-scan"></div>
      <div class="field-grid">${headHTML}</div>
      ${playerAvatars}
    </div>
  </div>`;
}

function _buildCaveMap(cd) {
  const contestants = Object.keys(cd.colorAssign || {});
  const segs = [
    { id: 'boulder', label: 'BOULDER CORRIDOR', left: 8, width: 26 },
    { id: 'squeeze', label: 'NARROW SQUEEZE',   left: 36, width: 26 },
    { id: 'exit',    label: 'EXIT PASSAGE',     left: 64, width: 26 },
  ];

  let segHTML = '';
  for (let si = 0; si < segs.length; si++) {
    const s = segs[si];
    segHTML += `<div class="cave-seg-zone" id="rp-cave-zone-${si}" style="left:${s.left}%;width:${s.width}%"><span class="cave-seg-lbl">${s.label}</span></div>`;
  }

  const pythonIcons = segs.map((s, si) =>
    `<div class="cave-python-icon" id="rp-cave-python-${si}" style="left:${s.left + s.width / 2 - 3}%">${_icon('skull')} PYTHON</div>`
  ).join('');

  let playerAvatars = '';
  for (let pi = 0; pi < contestants.length; pi++) {
    const n = contestants[pi];
    const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
    const sl = players.find(p => p.name === n)?.slug || n.toLowerCase().replace(/\s+/g, '-');
    const initials = n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const topPct = 42 + (pi % 3) * 14;
    playerAvatars += `<div class="cave-player" id="rp-cave-player-${pi}" style="border-color:${pc};top:${topPct}%;left:5%"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.outerHTML='<div class=cp-fallback>${initials}</div>'"><span class="cp-name">${n.split(' ')[0].toUpperCase()}</span><span class="cp-eggs" id="rp-cave-eggs-${pi}"></span></div>`;
  }

  const stalactites = [12, 28, 48, 65, 82].map(l =>
    `<div class="cave-stalactite" style="left:${l}%;border-top-width:${25 + Math.floor(Math.random() * 15)}px;"></div>`
  ).join('');

  const drips = [15, 35, 55, 75, 88].map((l, i) =>
    `<div class="cave-drip" style="left:${l}%;top:${45 + Math.floor(Math.random() * 10)}px;--dd:${(2.2 + i * 0.3).toFixed(1)}s;--dly:${(i * 0.4).toFixed(1)}s"></div>`
  ).join('');

  return `<div class="rp-map">
    <div class="rp-map-header"><h3>UNDERGROUND CAVE &mdash; CROSS SECTION</h3><span class="map-tag">LIVE TRACKING</span></div>
    <div class="rp-map-body map-cave">
      <div class="cave-ceiling"></div>
      <div class="cave-floor"></div>
      ${stalactites}
      ${segHTML}
      <div class="cave-gate cave-gate-enter">${_icon('egg')} IN</div>
      <div class="cave-gate cave-gate-exit">${_icon('egg')} OUT</div>
      <div class="cave-exit-glow"></div>
      <div class="cave-python-zone">${pythonIcons}</div>
      ${drips}
      <div class="cave-lava-glow"></div>
      ${playerAvatars}
    </div>
  </div>`;
}

function _buildPillarMap(cd) {
  const contestants = Object.keys(cd.colorAssign || {});

  let playerAvatars = '';
  for (let pi = 0; pi < contestants.length; pi++) {
    const n = contestants[pi];
    const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
    const sl = players.find(p => p.name === n)?.slug || n.toLowerCase().replace(/\s+/g, '-');
    const initials = n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const offset = pi % 2 === 0 ? -38 : 38;
    playerAvatars += `<div class="pillar-climber" id="rp-pillar-climber-${pi}" style="border-color:${pc};top:80%;display:none;left:calc(50% + ${offset}px)"><img src="assets/avatars/${sl}.png" alt="${n}" onerror="this.outerHTML='<div class=pc-fallback>${initials}</div>'"><span class="pc-label">${n.split(' ')[0].toUpperCase()}</span><span class="pc-eggs"></span></div>`;
  }

  const winds = [
    { top: 30, left: 0, w: 60, wd: 3.5, delay: 0 },
    { top: 45, left: 20, w: 80, wd: 5, delay: 1 },
    { top: 60, left: 10, w: 50, wd: 4, delay: 2.5 },
    { top: 22, left: 40, w: 70, wd: 3, delay: 0.5 },
  ].map(w => `<div class="pillar-wind" style="top:${w.top}%;left:${w.left}%;width:${w.w}px;--wd:${w.wd}s;animation-delay:${w.delay}s"></div>`).join('');

  return `<div class="rp-map">
    <div class="rp-map-header"><h3>NEST PILLAR &mdash; VERTICAL CLIMB</h3><span class="map-tag">LIVE TRACKING</span></div>
    <div class="rp-map-body map-pillar">
      <div class="pillar-col"></div>
      <div class="pillar-tier" style="top:75%"><span class="pillar-tier-label">BASE</span></div>
      <div class="pillar-tier" style="top:55%"><span class="pillar-tier-label">MID-CLIMB</span></div>
      <div class="pillar-tier" style="top:35%"><span class="pillar-tier-label">HIGH PERCH</span></div>
      <div class="pillar-tier" style="top:15%"><span class="pillar-tier-label">SUMMIT</span></div>
      <div class="pillar-nest" id="rp-pillar-nest"></div>
      <div class="pillar-condor"><div class="condor-wing l"></div><div class="condor-wing r"></div><div class="condor-head"></div></div>
      ${playerAvatars}
      ${winds}
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// FLAVOR LINES
// ══════════════════════════════════════════════════════════════

const FLAVOR_FIELD = [
  `${host()} watches from the observation platform. "This is either strategy or chaos. I can't tell."`,
  'A gust rolls off the Pacific. The moai don\'t react.',
  'The carved eyes of the moai stare across the egg field.',
  `${host()}: "Eggs. Ancient stone. A giant angry bird. This is Total Drama."`,
  'The sun beats down. The rock heads heat up. The search continues.',
  'A shadow passes overhead. Just a cloud. This time.',
];
const FLAVOR_CAVE = [
  'Somewhere in the cave, something drips.',
  'The cave groans. Probably just the rock settling. Probably.',
  'Water echoes off ancient stone. The dark swallows every other sound.',
  'The smell of sulfur rises from somewhere deeper in the cave.',
  'A bat colony shifts overhead. Tiny eyes. Hundreds of them.',
  'The cave floor turns slick. Someone is going to slip.',
  'Ancient carvings line the walls. Nobody stops to read them.',
  'The air gets thicker. Warmer. Something is wrong down here.',
  'A distant rumble. The cave breathes.',
  'Phosphorescent moss casts the walls in sickly green light.',
  'The ceiling drops to shoulder height. Everyone crouches.',
  'Condensation drips onto eggs. Cold water on warm shell.',
  `${host()} over the PA: "The cave was not tested for safety. Legal made me say that."`,
  'Stalactites hang like teeth above the passage.',
  'Something large shifts in the dark. Scales on stone.',
  'A hiss echoes from somewhere deep in the tunnel. The python is awake.',
  'The air smells like snake. Nobody talks about it.',
  `${host()} over the PA: "Fun fact — that python is not an actor. We found it here. It found us back."`,
  'The cave floor is slick with something organic. Best not to think about it.',
];
const FLAVOR_PILLAR = [
  'The condor circles twice before banking south.',
  `${host()}: "Someone's going home tonight. The island doesn't care which one."`,
  'Wind picks up at the pillar. Forty feet is a long way to fall.',
  'The nest waits at the summit. The condor waits beside it.',
  'Salt air stings the eyes. The summit is close. The condor is closer.',
];

// ══════════════════════════════════════════════════════════════
// VP BUILDERS
// ══════════════════════════════════════════════════════════════

export function rpBuildRPTitleCard(ep) {
  for (const key of Object.keys(_tvState)) { if (key.startsWith('rp-')) delete _tvState[key]; }
  const cd = ep?.challengeData;
  if (!cd) return '<div>No data</div>';
  const active = Object.keys(cd.colorAssign || {});
  const epNum = ep.episodeNum || (gs.episodeHistory?.length || 0) + 1;

  // SVG glyph definitions for side columns
  const glyphs = {
    moai: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="2" width="24" height="32" rx="4" fill="currentColor"/><rect x="10" y="10" width="28" height="4" rx="1" fill="currentColor" opacity=".6"/><rect x="14" y="34" width="20" height="12" rx="2" fill="currentColor" opacity=".7"/><circle cx="20" cy="20" r="2" fill="var(--rp-sand-lt)" opacity=".5"/><circle cx="28" cy="20" r="2" fill="var(--rp-sand-lt)" opacity=".5"/><rect x="21" y="25" width="6" height="3" rx="1" fill="var(--rp-sand-lt)" opacity=".3"/>
</svg>`,
    bird: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="10" r="6" fill="currentColor"/><path d="M30 9 L38 7 L32 11Z" fill="currentColor" opacity=".8"/><ellipse cx="24" cy="26" rx="10" ry="12" fill="currentColor" opacity=".85"/><path d="M14 22 Q4 18 8 28 L14 26Z" fill="currentColor" opacity=".6"/><path d="M34 22 Q44 18 40 28 L34 26Z" fill="currentColor" opacity=".6"/><line x1="20" y1="38" x2="18" y2="46" stroke="currentColor" stroke-width="2"/><line x1="28" y1="38" x2="30" y2="46" stroke="currentColor" stroke-width="2"/>
</svg>`,
    egg: `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="26" rx="12" ry="16" fill="currentColor"/><ellipse cx="20" cy="20" rx="4" ry="6" fill="var(--rp-sand-lt)" opacity=".2" transform="rotate(-15 20 20)"/>
</svg>`,
    sun: `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="8" fill="currentColor"/><g stroke="currentColor" stroke-width="2" opacity=".7"><line x1="24" y1="4" x2="24" y2="12"/><line x1="24" y1="36" x2="24" y2="44"/><line x1="4" y1="24" x2="12" y2="24"/><line x1="36" y1="24" x2="44" y2="24"/><line x1="10" y1="10" x2="16" y2="16"/><line x1="32" y1="32" x2="38" y2="38"/><line x1="38" y1="10" x2="32" y2="16"/><line x1="16" y1="32" x2="10" y2="38"/></g>
</svg>`,
    spiral: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 28 C24 26 26 24 28 24 C30 24 32 26 32 28 C32 32 28 36 24 36 C18 36 14 30 14 24 C14 16 20 10 28 10 C38 10 44 18 44 28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
</svg>`,
    wave: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 24 Q12 14 20 24 Q28 34 36 24 Q40 19 44 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M4 32 Q12 22 20 32 Q28 42 36 32 Q40 27 44 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".5"/>
</svg>`
  };
  const glyphOrder = ['moai', 'bird', 'egg', 'sun', 'spiral', 'wave'];
  const glyphRight = ['sun', 'moai', 'wave', 'egg', 'bird', 'spiral'];
  const glyphColL = glyphOrder.map(g => glyphs[g]).join('');
  const glyphColR = glyphRight.map(g => glyphs[g]).join('');

  // Condor SVG silhouette for the swoop animation
  const condorSVG = `<svg viewBox="0 0 80 40"><path d="M40 20 Q30 8 10 4 Q5 3 0 6 Q8 10 16 16 Q24 22 32 22 L40 20Z" fill="currentColor"/><path d="M40 20 Q50 8 70 4 Q75 3 80 6 Q72 10 64 16 Q56 22 48 22 L40 20Z" fill="currentColor"/><ellipse cx="40" cy="22" rx="6" ry="4" fill="currentColor"/><path d="M38 26 L40 34 L42 26Z" fill="currentColor" opacity=".6"/></svg>`;

  // Moai silhouettes for scene background
  const sceneMoai = `<svg viewBox="0 0 60 80"><rect x="14" y="2" width="32" height="50" rx="6" fill="currentColor"/><rect x="12" y="14" width="36" height="6" rx="2" fill="currentColor" opacity=".6"/><rect x="18" y="52" width="24" height="26" rx="3" fill="currentColor" opacity=".7"/><circle cx="24" cy="30" r="3" fill="var(--rp-sand-lt)" opacity=".15"/><circle cx="36" cy="30" r="3" fill="var(--rp-sand-lt)" opacity=".15"/></svg>`;

  // Archetype display labels
  const archLabel = a => (a || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Build scene player figures with condor-dodge animations
  const reactions = ['duck', 'grabbed', 'dodge'];
  const sceneFigures = active.map((n, i) => {
    const color = cd.colorAssign[n];
    const pc = color?.hex || '#4ec0d4';
    const initials = n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const firstName = n.split(' ')[0];
    const leftPct = 2 + (i / Math.max(active.length - 1, 1)) * 88;
    const bottomOff = 4 + (i % 3) * 14;
    const react = reactions[i % 3];
    const delay = (i * 0.4 + 0.2).toFixed(1);
    return `<div class="rp-scene-fig ${react}" style="left:${leftPct.toFixed(1)}%;bottom:${bottomOff}px;--fig-color:${pc};animation-delay:${delay}s">
      <div class="fig-ring"><img src="assets/avatars/${slug(n)}.png" alt="${n}" onerror="this.outerHTML='<span style=\\"font-size:11px;color:var(--rp-bone)\\">${initials}</span>'"></div>
      <div class="fig-egg" style="background:${pc}"></div>
      <div class="fig-name">${firstName}</div>
    </div>`;
  }).join('');

  // Build compact mockup-style roster strip
  const rosterCards = active.map(n => {
    const color = cd.colorAssign[n];
    const pc = color?.hex || '#4ec0d4';
    const initials = n.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colorLabel = (color?.label || '?').toUpperCase();
    const firstName = n.split(' ')[0].toUpperCase();
    const archetype = archLabel(arch(n));
    return `<div class="rp-rs" style="--pc:${pc}">
      <span class="feather" style="background:${pc}">${colorLabel}</span>
      <div class="av-ring"><img src="assets/avatars/${slug(n)}.png" alt="${n}" onerror="this.style.display='none';this.nextSibling.style.display=''"><span style="display:none">${initials}</span></div>
      <div class="rs-nm">${firstName}</div>
      <div class="rs-arch">${archetype}</div>
    </div>`;
  }).join('');

  const content = `<div class="rp-layout">
<div class="rp-hero" style="position:relative;overflow:hidden;">
  <div class="rp-glyph-col left">${glyphColL}</div>
  <div class="rp-glyph-col right">${glyphColR}</div>
  <div class="rp-corner-label tl">RAPA NUI &bull; ISLA DE PASCUA</div>
  <div class="rp-corner-label tr">CHALLENGE &bull; ORIG. 03:03</div>
  <div class="rp-hero-meta"><span>SEASON ${String(Math.ceil(epNum / 26)).padStart(2,'0')}</span><span class="dot"></span><span>EPISODE ${String(epNum).padStart(2,'0')}</span><span class="dot"></span><span style="color:var(--rp-coral);font-weight:700">FINAL ${active.length}</span><span class="dot"></span><span>EGG HUNT</span></div>
  <div class="rp-hero-title" style="position:relative;z-index:1;">RAPA<br><span class="coral">PHOOEY</span><span class="bang">!</span></div>
  <div class="rp-hero-sub">EGGS &bull; MOAI &bull; CANDY &bull; CONDORS</div>
  <div class="rp-hero-tagline">${active.length} contestants. ${cd.heads?.length || 8} carved-rock heads of the eliminated. ${EGGS_PER_PLAYER} eggs each, color-matched to a feathered headset. One cave, one pillar, one mother condor &mdash; and a candy cart big enough to buy a vote.</div>
  <div class="rp-hero-stats">
    <div class="rp-hero-stat"><span class="lbl">Remaining</span><span class="val">${active.length} / ${players.length}</span></div>
    <div class="rp-hero-stat"><span class="lbl">Eggs in Play</span><span class="val">${active.length * (cd.eggsPerPlayer || EGGS_PER_PLAYER)}</span></div>
    <div class="rp-hero-stat"><span class="lbl">Condor Wingspan</span><span class="val coral">12 FT</span></div>
    <div class="rp-hero-stat"><span class="lbl">Rock Heads</span><span class="val">${cd.heads?.length || 8}</span></div>
  </div>
  <div class="rp-roster-strip">${rosterCards}</div>
  <div class="rp-scene">
    <div class="rp-scene-moai m1">${sceneMoai}</div>
    <div class="rp-scene-moai m2">${sceneMoai}</div>
    <div class="rp-condor-swoop">${condorSVG}</div>
    <div class="rp-scene-players">${sceneFigures}</div>
    <div class="rp-scene-ground"></div>
  </div>
</div>
<div class="rp-chal-side" id="rp-chal-side-inner"></div>
</div>`;
  return _rpShell(content, ep, 'field');
}

export function rpBuildRPAuction(ep) {
  const cd = ep?.challengeData;
  if (!cd) return '<div>No data</div>';
  const key = 'rp-auction';
  if (!_tvState[key]) _tvState[key] = { idx: -1 };
  const events = cd.auctionEvents || [];
  const total = events.length;

  // Store stepMeta for sidebar tracking
  if (!window._rpStepMeta) window._rpStepMeta = {};
  window._rpStepMeta[key] = events.map(() => ({ tickIdx: -1 }));

  const cards = events.map((ev, i) => {
    const isBribe = ev.type === 'bribe';
    const dataType = isBribe ? 'bribe' : 'alliance';
    const badgeCls = isBribe ? 'rp-b-bribe' : 'rp-b-alliance';
    const badgeLabel = isBribe ? 'CANDY BRIBE' : 'EGG PACT';
    const title = isBribe ? 'Candy Bribe' : 'Egg Pact';
    const actorColor = _getPlayerColor(ev.actor);
    const outcome = isBribe
      ? (ev.success ? `${ev.target} takes the candy. A deal is struck.` : `${ev.target} pushes the cart away. No deal.`)
      : '';
    return `<div class="rp-card" data-type="${dataType}" id="rp-step-${key}-${i}" style="--rp-clr:${actorColor}">
      <div class="rp-card-hdr">${_av(ev.actor, 'sm')}${ev.target ? _av(ev.target, 'sm') : ''}<span class="rp-card-title">${title}</span><span class="rp-badge ${badgeCls}">${badgeLabel}</span></div>
      <div class="rp-card-body">${ev.text}${outcome ? ` <em>${outcome}</em>` : ''}</div>
    </div>`;
  }).join('');

  const noEvents = total === 0 ? `<div class="rp-card visible" data-type="host"><div class="rp-card-body">No deals made before the challenge. Everyone's on their own.</div></div>` : '';

  const content = `<div class="rp-layout">
<div class="rp-main">
  <div class="rp-stamp"><span class="num">PHASE 00</span><span class="ttl">ALLIANCE AUCTION</span><span class="sub">PRE-RACE</span></div>
  ${noEvents}${cards}
  ${total > 0 ? `<div class="rp-flavor">"The race begins. ${host()} fires the starting gun. The moai stare blankly."</div>` : ''}
</div>
<div class="rp-chal-side" id="rp-chal-side-inner">${_buildSidebarContent(ep, key)}</div>
</div>
<div class="rp-controls" id="rp-controls-${key}">
  <button class="rp-btn" onclick="rpRevealNext('${key}',${total})">REVEAL NEXT</button>
  <span class="rp-counter" id="rp-counter-${key}" aria-live="polite">0 / ${total}</span>
  <button class="rp-btn primary" onclick="rpRevealAll('${key}',${total})">REVEAL ALL</button>
</div>`;
  return _rpShell(content, ep, 'field');
}

export function rpBuildRPFieldPhase(ep) {
  const cd = ep?.challengeData;
  if (!cd) return '<div>No data</div>';
  const key = 'rp-field';
  if (!_tvState[key]) _tvState[key] = { idx: -1 };

  // Collect all field events across all ticks
  const allFieldEvents = cd.fieldEvents || [];
  const total = allFieldEvents.length;

  // Store stepMeta for sidebar updates
  if (!window._rpStepMeta) window._rpStepMeta = {};
  window._rpStepMeta[key] = allFieldEvents.map(ev => ({ tickIdx: Math.max(0, (ev.tick || 1) - 1) }));

  let cards = '';
  let lastTick = -1;
  for (let i = 0; i < allFieldEvents.length; i++) {
    const ev = allFieldEvents[i];
    // Insert tick separator
    if (ev.tick !== lastTick) {
      if (lastTick >= 0) {
        const flavorLine = FLAVOR_FIELD[(ev.tick - 1) % FLAVOR_FIELD.length];
        cards += `<div class="rp-flavor" id="rp-step-${key}-flavor-${ev.tick}">&mdash; ${flavorLine} &mdash;</div>`;
      }
      lastTick = ev.tick;
    }
    cards += _buildEventCard(ev, i, key);
  }

  const content = `<div class="rp-layout">
<div class="rp-main">
  <div class="rp-stamp"><span class="num">PHASE 01</span><span class="ttl">ROCK HEAD FIELD</span><span class="sub">${Object.keys(cd.colorAssign).length * (cd.eggsPerPlayer || EGGS_PER_PLAYER)} EGGS &bull; ${cd.heads?.length || 8} HEADS</span></div>
  <div class="rp-card visible" data-type="host">
    <div class="rp-card-hdr"><span class="rp-card-title">The Rock Head Field</span><span class="rp-badge rp-b-host">CHALLENGE 01</span></div>
    <div class="rp-quote"><span class="mark">&ldquo;</span><div class="text">See those carved rock heads? Each one is a former contestant. Your eggs are hidden inside them &mdash; ${cd.eggsPerPlayer || EGGS_PER_PLAYER} each, color-matched to your feathered headset. You need ${cd.eggsToWin || EGGS_TO_WIN} in the nest to win, but you've got spares &mdash; you'll need them. Find your color. If you find someone else's egg, well&hellip; help, hide, trade, hold hostage, or smash it. Your call. Lose all your eggs? You're out. Oh, and weave a basket from the grass &mdash; you'll need it for the cave.<span class="who">&mdash; ${host().toUpperCase()} &bull; BRIEFING</span></div></div>
  </div>
  ${_buildFieldMap(cd)}
  ${cards}
</div>
<div class="rp-chal-side" id="rp-chal-side-inner">${_buildSidebarContent(ep, key)}</div>
</div>
<div class="rp-controls" id="rp-controls-${key}">
  <button class="rp-btn" onclick="rpRevealNext('${key}',${total})">REVEAL NEXT</button>
  <span class="rp-counter" id="rp-counter-${key}" aria-live="polite">0 / ${total}</span>
  <button class="rp-btn primary" onclick="rpRevealAll('${key}',${total})">REVEAL ALL</button>
</div>`;
  return _rpShell(content, ep, 'field');
}

export function rpBuildRPCavePhase(ep) {
  const cd = ep?.challengeData;
  if (!cd) return '<div>No data</div>';
  const key = 'rp-cave';
  if (!_tvState[key]) _tvState[key] = { idx: -1 };

  const allCaveEvents = cd.caveEvents || [];
  const total = allCaveEvents.length;

  if (!window._rpStepMeta) window._rpStepMeta = {};
  window._rpStepMeta[key] = allCaveEvents.map(ev => ({ tickIdx: Math.max(0, (ev.tick || 1) - 1) }));

  let cards = '';
  let lastTick = -1;
  for (let i = 0; i < allCaveEvents.length; i++) {
    const ev = allCaveEvents[i];
    if (ev.tick !== lastTick) {
      if (lastTick >= 0) {
        const flavorLine = FLAVOR_CAVE[(ev.tick - 1) % FLAVOR_CAVE.length];
        cards += `<div class="rp-flavor">&mdash; ${flavorLine} &mdash;</div>`;
      }
      lastTick = ev.tick;
    }
    cards += _buildEventCard(ev, i, key);
  }

  const noCave = total === 0 ? `<div class="rp-card visible" data-type="host"><div class="rp-card-body">No one has entered the cave yet.</div></div>` : '';

  const content = `<div class="rp-layout">
<div class="rp-main">
  <div class="rp-stamp"><span class="num">PHASE 02</span><span class="ttl">UNDERGROUND CAVE</span><span class="sub">HAZARD GAUNTLET</span></div>
  <div class="rp-card visible" data-type="host">
    <div class="rp-card-hdr"><span class="rp-card-title">The Underground Cave</span><span class="rp-badge rp-b-host">CHALLENGE 02</span></div>
    <div class="rp-quote"><span class="mark">&ldquo;</span><div class="text">Now carry those eggs through the underground cave. Three segments: the Boulder Corridor, the Narrow Squeeze, and the Exit Passage. Oh, and there's a giant python living in there. She doesn't like visitors. Pick your pace &mdash; rush and risk getting stuck, or take it slow and fall behind. Drop an egg, it breaks. First one out gets the catcher's mask &mdash; it blocks one condor strike on the pillar, saving an egg. Last one out? They skip their first pillar tick. No climbing while you're catching your breath.<span class="who">&mdash; ${host().toUpperCase()} &bull; BRIEFING</span></div></div>
  </div>
  ${_buildCaveMap(cd)}
  ${noCave}${cards}
</div>
<div class="rp-chal-side" id="rp-chal-side-inner">${_buildSidebarContent(ep, key)}</div>
</div>
<div class="rp-controls" id="rp-controls-${key}">
  <button class="rp-btn" onclick="rpRevealNext('${key}',${total})">REVEAL NEXT</button>
  <span class="rp-counter" id="rp-counter-${key}" aria-live="polite">0 / ${total}</span>
  <button class="rp-btn primary" onclick="rpRevealAll('${key}',${total})">REVEAL ALL</button>
</div>`;
  return _rpShell(content, ep, 'cave');
}

export function rpBuildRPPillarPhase(ep) {
  const cd = ep?.challengeData;
  if (!cd) return '<div>No data</div>';
  const key = 'rp-pillar';
  if (!_tvState[key]) _tvState[key] = { idx: -1 };

  const allPillarEvents = cd.pillarEvents || [];
  const total = allPillarEvents.length;

  if (!window._rpStepMeta) window._rpStepMeta = {};
  window._rpStepMeta[key] = allPillarEvents.map(ev => ({ tickIdx: Math.max(0, (ev.tick || 1) - 1) }));

  let cards = '';
  let lastTick = -1;
  for (let i = 0; i < allPillarEvents.length; i++) {
    const ev = allPillarEvents[i];
    if (ev.tick !== lastTick) {
      if (lastTick >= 0) {
        const flavorLine = FLAVOR_PILLAR[(ev.tick - 1) % FLAVOR_PILLAR.length];
        cards += `<div class="rp-flavor">&mdash; ${flavorLine} &mdash;</div>`;
      }
      lastTick = ev.tick;
    }
    cards += _buildEventCard(ev, i, key);
  }

  const noPillar = total === 0 ? `<div class="rp-card visible" data-type="host"><div class="rp-card-body">No one has reached the pillar yet.</div></div>` : '';

  const content = `<div class="rp-layout">
<div class="rp-main">
  <div class="rp-stamp"><span class="num">PHASE 03</span><span class="ttl">NEST PILLAR</span><span class="sub">VOLCANIC SUMMIT</span></div>
  <div class="rp-card visible" data-type="host">
    <div class="rp-card-hdr"><span class="rp-card-title">The Nest Above</span><span class="rp-badge rp-b-host">CHALLENGE 03</span></div>
    <div class="rp-quote"><span class="mark">&ldquo;</span><div class="text">Climb the pillar. Return ${EGGS_TO_WIN} eggs to the nest. Mother Condor is up there. <em>She is two Alejandros wide.</em> First out gets a catcher's mask. Everyone else gets &mdash; well &mdash; Tuesday.<span class="who">&mdash; ${host().toUpperCase()} &bull; BRIEFING</span></div></div>
  </div>
  ${_buildPillarMap(cd)}
  ${noPillar}${cards}
</div>
<div class="rp-chal-side" id="rp-chal-side-inner">${_buildSidebarContent(ep, key)}</div>
</div>
<div class="rp-controls" id="rp-controls-${key}">
  <button class="rp-btn" onclick="rpRevealNext('${key}',${total})">REVEAL NEXT</button>
  <span class="rp-counter" id="rp-counter-${key}" aria-live="polite">0 / ${total}</span>
  <button class="rp-btn primary" onclick="rpRevealAll('${key}',${total})">REVEAL ALL</button>
</div>`;
  return _rpShell(content, ep, 'pillar');
}

export function rpBuildRPResults(ep) {
  const cd = ep?.challengeData;
  if (!cd) return '<div>No data</div>';
  const winner = cd.immunityWinner;
  const standings = Array.isArray(cd.standings) ? cd.standings : Object.keys(cd.colorAssign || {});

  const resultRows = standings.map((n, i) => {
    const isWinner = n === winner;
    const score = ep.chalMemberScores?.[n] ?? 0;
    const pst = cd.playerStates?.[n] || {};
    const etw = cd.eggsToWin || EGGS_TO_WIN;
    const nested = pst.nested || (isWinner ? etw : 0);
    const isElim = pst.eliminated || false;
    const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
    return `<div class="rp-result-row${isWinner ? ' top' : ''}${isElim ? ' ft-gone' : ''}">
      <span class="rp-result-rank">${i === 0 ? _icon('star') : (i + 1)}</span>
      ${_av(n, 'sm')}
      <span class="rp-result-name">${n}${isWinner ? ' <span style="color:var(--rp-gold-lt);font-size:9px;">IMMUNE</span>' : isElim ? ' <span style="color:#d44a4a;font-size:9px;">OUT</span>' : ''}</span>
      <span class="rp-sb-eggs">${Array.from({ length: etw }, (_, j) => _eggDot(pc, j < nested)).join('')}</span>
      <span class="rp-result-score">${score} pts</span>
    </div>`;
  }).join('');

  // Egg census — count egg fates per player
  const epp = cd.eggsPerPlayer || EGGS_PER_PLAYER;
  const headEggArr = Object.values(cd.headEggs || {}).flat();
  const censusRows = standings.map(n => {
    const pst = cd.playerStates?.[n] || {};
    const pc = cd.colorAssign[n]?.hex || '#4ec0d4';
    const colorLabel = cd.colorAssign[n]?.label || '?';
    const nested = pst.nested || 0;
    const carrying = (pst.carrying || []).length + (pst.eggInHand ? 1 : 0);
    const lost = pst.totalEggsLost || 0;
    const unfound = headEggArr.filter(e => e.owner === n && !e.found).length;
    const heldByOthers = Object.entries(cd.playerStates || {}).reduce((c, [o, ost]) => {
      if (o === n) return c;
      return c + (ost.carrying || []).filter(e => e.color?.id === cd.colorAssign[n]?.id).length
        + (ost.eggInHand && ost.eggInHand.color?.id === cd.colorAssign[n]?.id ? 1 : 0);
    }, 0);
    const isElim = pst.eliminated || false;
    const isWinner = n === winner;

    const eggIcons = (count, cls) => Array.from({ length: count }, () =>
      `<span class="rp-census-egg ${cls}" style="--egg-color:${pc}"></span>`
    ).join('');

    return `<div class="rp-census-row${isWinner ? ' top' : ''}${isElim ? ' ft-gone' : ''}">
      ${_av(n, 'sm')}
      <div class="rp-census-info">
        <span class="rp-census-name">${n}</span>
        <span class="rp-census-color" style="color:${pc}">${colorLabel}</span>
      </div>
      <div class="rp-census-eggs">
        ${nested > 0 ? `<div class="rp-census-group"><span class="rp-census-label">${_icon('star')}</span>${eggIcons(nested, 'nested')}</div>` : ''}
        ${carrying > 0 ? `<div class="rp-census-group"><span class="rp-census-label">${_icon('egg')}</span>${eggIcons(carrying, 'carrying')}</div>` : ''}
        ${heldByOthers > 0 ? `<div class="rp-census-group"><span class="rp-census-label">${_icon('alert')}</span>${eggIcons(heldByOthers, 'held')}</div>` : ''}
        ${unfound > 0 ? `<div class="rp-census-group"><span class="rp-census-label">${_icon('search')}</span>${eggIcons(unfound, 'unfound')}</div>` : ''}
        ${lost > 0 ? `<div class="rp-census-group"><span class="rp-census-label">${_icon('break')}</span>${eggIcons(lost, 'lost')}</div>` : ''}
      </div>
      <span class="rp-census-tally">${nested}/${epp}</span>
    </div>`;
  }).join('');

  // Race stats summary
  const totalTicks = cd.raceTicks?.length || 0;
  const totalFieldEvts = (cd.fieldEvents || []).length;
  const totalCaveEvts = (cd.caveEvents || []).length;
  const totalPillarEvts = (cd.pillarEvents || []).length;

  const content = `<div class="rp-layout">
<div class="rp-main">
  <div class="rp-stamp"><span class="num">FINAL</span><span class="ttl">RACE COMPLETE</span><span class="sub">RESULTS</span></div>
  <div class="rp-card visible" data-type="win">
    <div class="rp-card-hdr">${_av(winner, 'lg')}<span class="rp-card-title">Immunity Winner</span><span class="rp-badge rp-b-win">IMMUNITY</span></div>
    <div class="rp-card-body" style="font-size:15px;"><strong>${winner}</strong> nests the final egg. The condor retreats. ${host()} calls it.</div>
    <div class="rp-card-meta"><span>RESULT <span class="gold">IMMUNE</span></span></div>
  </div>
  <div class="rp-divider"><div class="rp-div-line"></div><div class="rp-div-line"></div></div>
  <div class="rp-stamp"><span class="num">STANDINGS</span><span class="ttl">FINAL RANKINGS</span><span class="sub">ALL PHASES</span></div>
  <div class="rp-results-grid">${resultRows}</div>
  <div class="rp-divider"><div class="rp-div-line"></div><div class="rp-div-line"></div></div>
  <div class="rp-stamp"><span class="num">EGG CENSUS</span><span class="ttl">FINAL EGG COUNT</span><span class="sub">BY COLOR</span></div>
  <div class="rp-census-legend">
    <span>${_icon('star')} Nested</span>
    <span>${_icon('egg')} Carrying</span>
    <span>${_icon('alert')} Held by rival</span>
    <span>${_icon('search')} Unfound</span>
    <span>${_icon('break')} Broken</span>
  </div>
  <div class="rp-census-grid">${censusRows}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:14px;">
    <div class="rp-hero-stat" style="background:rgba(42,122,140,.1);border-color:rgba(42,122,140,.2);color:var(--rp-tide);">Ticks<strong style="color:var(--rp-foam)">${totalTicks}</strong></div>
    <div class="rp-hero-stat" style="background:rgba(42,122,140,.1);border-color:rgba(42,122,140,.2);color:var(--rp-tide);">Field Events<strong style="color:var(--rp-foam)">${totalFieldEvts}</strong></div>
    <div class="rp-hero-stat" style="background:rgba(42,122,140,.1);border-color:rgba(42,122,140,.2);color:var(--rp-tide);">Cave Events<strong style="color:var(--rp-foam)">${totalCaveEvts}</strong></div>
    <div class="rp-hero-stat" style="background:rgba(42,122,140,.1);border-color:rgba(42,122,140,.2);color:var(--rp-tide);">Pillar Events<strong style="color:var(--rp-foam)">${totalPillarEvts}</strong></div>
  </div>
  <div class="rp-flavor">Tonight: one player goes home. The moai will get a new face.</div>
</div>
<div class="rp-chal-side" id="rp-chal-side-inner">${_buildSidebarContent(ep, 'rp-results')}</div>
</div>`;
  return _rpShell(content, ep, 'pillar');
}
