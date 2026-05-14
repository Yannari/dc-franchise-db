// js/chal/african-lying-safari.js — African Lying Safari: post-merge hunt challenge (TDWT S3E21)
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
// ZONES
// ══════════════════════════════════════════════════════════════
const ZONES = [
  { id: 'watering-hole', name: 'Watering Hole', trackMod: 1, hazard: 'crocodile', adj: ['tall-grass', 'acacia-grove', 'riverbed'] },
  { id: 'tall-grass', name: 'Tall Grass', trackMod: -1, hazard: 'snake', adj: ['watering-hole', 'acacia-grove', 'mud-flats'] },
  { id: 'acacia-grove', name: 'Acacia Grove', trackMod: 0, hazard: 'baboon', adj: ['watering-hole', 'tall-grass', 'rocky-outcrop'] },
  { id: 'rocky-outcrop', name: 'Rocky Outcrop', trackMod: 2, hazard: 'rockslide', adj: ['acacia-grove', 'mud-flats', 'riverbed'] },
  { id: 'mud-flats', name: 'Mud Flats', trackMod: 0, hazard: 'quicksand', adj: ['tall-grass', 'rocky-outcrop', 'riverbed'] },
  { id: 'riverbed', name: 'Riverbed', trackMod: 0, hazard: 'hippo', adj: ['watering-hole', 'rocky-outcrop', 'mud-flats'] },
];
function zoneById(id) { return ZONES.find(z => z.id === id); }

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════

// ── Phase 1: Sock-et To Me ──
const DODGE_SUCCESS = [
  (n, pr) => `${n} weaves through the incoming fire like it's nothing. Soccer balls fly wide. ${pr.Sub} barely breaks stride.`,
  (n, pr) => `${n} jukes left, spins right — every kick misses. The crowd is watching something beautiful.`,
  (n, pr) => `${n} reads each kick before the foot lands. Dodge, duck, dive — clean run.`,
  (n, pr) => `${n} moves with impossible grace. Balls sail past ${pr.posAdj} ears. Not a scratch.`,
  (n, pr) => `${n} hits the gas and never slows down. The kickers can't lead ${pr.obj} fast enough. Clean sweep.`,
  (n, pr) => `"You can't hit what you can't catch." ${n} zips through the gauntlet untouched.`,
];

const DODGE_PARTIAL = [
  (n, pr, hits) => `${n} takes ${hits} hit${hits > 1 ? 's' : ''} but keeps running. Plums scatter but ${pr.Sub} recovers what ${pr.Sub} can.`,
  (n, pr, hits) => `A ball clips ${n}'s shoulder. ${pr.Sub} stumbles but doesn't fall. ${hits} solid connection${hits > 1 ? 's' : ''}.`,
  (n, pr, hits) => `${n} absorbs ${hits} shot${hits > 1 ? 's' : ''}. It hurts. But ${pr.Sub} grabs plums with bruised hands and sprints back.`,
  (n, pr, hits) => `${n} gets tagged ${hits} time${hits > 1 ? 's' : ''}. Each impact sends a plum rolling. ${pr.Sub} saves what ${pr.Sub} can.`,
  (n, pr, hits) => `${n} eats ${hits} soccer ball${hits > 1 ? 's' : ''} to the body. Not pretty. Still standing.`,
  (n, pr, hits) => `${n} catches ${hits} clean hit${hits > 1 ? 's' : ''}. ${pr.PosAdj} plum haul takes a dent.`,
];

const DODGE_WIPEOUT = [
  (n, pr) => `${n} trips on the starting line. THREE balls converge on ${pr.posAdj} position like heat-seeking missiles. It's beautiful. It's awful.`,
  (n, pr) => `${n} faceplants into the plum pile. The kickers don't even need to aim — the plums are already rolling away.`,
  (n, pr) => `${n} runs directly INTO the nearest soccer ball. Forehead first. The crowd winces in unison.`,
  (n, pr) => `${n} slips on a plum, spins twice, and lands in a heap. The kickers line up like a firing squad. Comedy.`,
  (n, pr) => `${n} goes down hard. Plums everywhere. Dignity? Gone. ${host()} cackles from the sidelines.`,
  (n, pr) => `"I believe that's what we call a TOTAL wipeout." ${n} lies face-down in the dirt while ${host()} provides color commentary.`,
];

const BALL_DEFLECT = [
  (n, pr, kicker) => `${n} BOOTS the incoming ball straight back at ${kicker}. Dead center. ${kicker} goes down like a sack of potatoes.`,
  (n, pr, kicker) => `${n} sidesteps and bicycle-kicks the ball back at ${kicker}. The sound of impact echoes. The crowd gasps.`,
  (n, pr, kicker) => `${n} catches the ball on ${pr.posAdj} foot and redirects it into ${kicker}'s chest. Return to sender.`,
  (n, pr, kicker) => `${n} headers the ball straight into ${kicker}'s face. "${pr.Sub === 'They' ? 'Thought' : 'Thought'} you wanted it back?"`,
];

const HEADSHOT = [
  (kicker, runner) => `${kicker} winds up and DRILLS the ball into ${runner}'s face. Not an accident. That was personal.`,
  (kicker, runner) => `${kicker} aims high. The ball connects with ${runner}'s skull. "Sorry! Slipped!" ${kicker} is not sorry.`,
  (kicker, runner) => `${kicker} puts everything into this kick. The ball rockets directly into ${runner}. Plums explode everywhere.`,
  (kicker, runner) => `${kicker}'s kick curves with vicious intent. It finds ${runner}'s head. The kind of shot that starts grudges.`,
];

const INTENTIONAL_MISS = [
  (kicker, runner) => `${kicker} kicks wide on purpose. ${runner} doesn't notice. Bond preserved.`,
  (kicker, runner) => `${kicker}'s shot sails three feet over ${runner}'s head. Deliberate? Nobody can prove it.`,
  (kicker, runner) => `${kicker} toe-pokes the ball into the dirt. "Slipped." It didn't slip. ${runner} runs clean.`,
  (kicker, runner) => `${kicker} hesitates and the ball rolls harmlessly. ${runner} gets a free pass. ${kicker} knows what ${pronouns(kicker).Sub} did.`,
];

const PRODIGY = [
  (n, pr) => `${n} is UNTOUCHABLE. Every ball finds empty air. The gauntlet looks like it was designed for ${pr.obj}.`,
  (n, pr) => `${n} moves with the certainty of someone who's done this a thousand times. Not a single ball gets close.`,
  (n, pr) => `Nobody can touch ${n}. The run is so clean it looks choreographed. Maximum plums, zero damage.`,
  (n, pr) => `${n} dances through the gauntlet like the soccer balls are moving in slow motion. Peak performance.`,
];

const COLLATERAL = [
  (k1, k2) => `${k1} and ${k2} kick at the exact same time. The balls COLLIDE mid-air. Nobody gets hit. Everyone stares.`,
  (k1, k2) => `Friendly fire! ${k1}'s ball intersects ${k2}'s and both deflect wildly off-course.`,
  (k1, k2) => `${k1} and ${k2} somehow manage to cancel each other out. The balls pinball off each other into the bushes.`,
  (k1, k2) => `"Did those balls just..." ${host()} leans forward. ${k1} and ${k2}'s shots neutralize each other. Physics has spoken.`,
];

const TAUNT_WHIFF = [
  (kicker, runner) => `${kicker} points at ${runner}, does a little windup dance — and kicks it into the dirt. The silence is deafening.`,
  (kicker, runner) => `"Watch THIS." ${kicker} announces the shot, takes a dramatic run-up, and shanks it. ${runner} jogs past untouched.`,
  (kicker, runner) => `${kicker} makes eye contact with ${runner}. Blows a kiss. Fires. The ball sails ten feet over everyone's head.`,
  (kicker, runner) => `${kicker} screams ${runner}'s name, winds up like a penalty kick — and whiffs completely. ${host()} is dying.`,
  (kicker, runner) => `${kicker} trash-talks ${runner} the entire approach. The kick? Pathetic. The embarrassment? Permanent.`,
];

const DODGE_JUKE = [
  (runner, kicker) => `${runner} sells the fake left so hard ${kicker} kicks into empty space. Filthy.`,
  (runner, kicker) => `${runner} stutters mid-stride — ${kicker} commits too early and the ball sails wide. Pure instinct.`,
  (runner, kicker) => `${runner} drops a shoulder like a running back. ${kicker} bites hard. The ball goes nowhere useful.`,
  (runner, kicker) => `${runner} plants, pivots, and ${kicker}'s shot goes exactly where ${runner} isn't. Humiliating read.`,
  (runner, kicker) => `${runner} makes ${kicker} look amateur with a last-second cut. The crowd gasps. ${kicker} stares at the ground.`,
];

const PANIC_THROW = [
  (kicker, runner) => `${kicker} panics under the pressure and boots it into the bushes. Not even close.`,
  (kicker, runner) => `${kicker} rushes the kick. The ball dribbles three feet and stops. ${runner} doesn't even notice.`,
  (kicker, runner) => `${kicker}'s nerves betray ${pronouns(kicker).obj}. The kick has no power, no direction. ${runner} walks past it.`,
  (kicker, runner) => `${kicker} kicks with eyes closed. The ball bounces once and rolls away. ${host()} covers ${pronouns(host()).posAdj} mouth.`,
  (kicker, runner) => `"Take the shot!" someone yells. ${kicker} flinches and the ball pops up weakly. ${runner} doesn't even flinch.`,
];

const REVENGE_KICK = [
  (kicker, runner) => `${kicker} remembers getting hammered during ${pronouns(kicker).posAdj} own run. This one's personal. DRILLS it into ${runner}.`,
  (kicker, runner) => `Payback. ${kicker} puts everything into this kick. The ball finds ${runner}'s ribs. They're even now.`,
  (kicker, runner) => `${kicker} has been waiting for this. ${runner} nailed ${pronouns(kicker).obj} earlier and now the debt comes due.`,
  (kicker, runner) => `${kicker}'s eyes narrow. ${runner} hit ${pronouns(kicker).obj} hard on the gauntlet. This kick carries a grudge.`,
];

// ── Phase 2: Gourd Smash ──
const GOURD_SMASH = [
  (n, pr, ord) => `CRACK! ${n} obliterates the gourd on impact. Pulp flies. ${pr.Sub} finishes ${ord}.`,
  (n, pr, ord) => `${n} swings and connects. The gourd detonates. Seeds and rind scatter. Clean smash — ${ord} place.`,
  (n, pr, ord) => `${n} brings the bat down with authority. The gourd doesn't stand a chance. ${ord} to finish.`,
  (n, pr, ord) => `"COME ON!" ${n} screams and obliterates the gourd. The bat vibrates. ${pr.Sub} claims ${ord} place.`,
  (n, pr, ord) => `${n}'s swing is surgical. One hit. One kill. The gourd splits clean down the middle. Finishes ${ord}.`,
  (n, pr, ord) => `${n} channels everything into the swing. The gourd explodes like a melon in a blender. ${ord} place.`,
];

const GOURD_MISS = [
  (n, pr) => `${n} whiffs. The bat whistles through empty air. The gourd sits there, mocking.`,
  (n, pr) => `${n} connects but the plum glances off the gourd's surface. Barely a dent. Try again.`,
  (n, pr) => `${n} fires a plum — it bounces off the gourd like a rubber ball. Nothing. Not even a crack.`,
  (n, pr) => `${n} throws the plum too high. It sails over the gourd and vanishes into the grass. Wasted.`,
  (n, pr) => `${n} swings hard but clips the top of the gourd. It wobbles. It holds. ${pr.Sub} swears under ${pr.posAdj} breath.`,
  (n, pr) => `${n} misses by an inch. The plum splatters on the ground NEXT to the gourd. ${host()} slow-claps.`,
];

const GOURD_FAIL_TOTAL = [
  (n, pr) => `${n} burns through every plum. The gourd stands defiant. No slingshot. ${host()} hands ${pr.obj} a single tranq ball. "Try not to cry."`,
  (n, pr) => `All plums spent. Zero smashes. ${n} stares at the intact gourd with pure hatred. ${pr.Sub} gets one mercy dart.`,
  (n, pr) => `${n} exhausts ${pr.posAdj} plum supply without cracking the gourd. ${host()} tosses ${pr.obj} a single dart. "Better make it count."`,
  (n, pr) => `The gourd wins. ${n} has nothing left. One dart, no slingshot, no dignity.`,
];

const CHRIS_DISTRACT = [
  (n, pr, rival) => `${host()} cups ${pr.posAdj} hands: "Hey ${n}! That's ${rival}'s boyfriend, right?" ${n} freezes mid-swing.`,
  (n, pr, rival) => `"${n}! ${rival} says you throw like a child!" ${n} turns to glare. Momentum: gone.`,
  (n, pr, rival) => `${host()} stage-whispers: "I heard ${rival} already called dibs on the dart gun." ${n}'s concentration shatters.`,
  (n, pr, rival) => `"${n}! Is that ${rival}'s perfume I smell?" ${n} turns beet red and completely botches the swing.`,
];

const BAT_TOSS = [
  (n, pr) => `${n} THROWS the entire bat at the gourd pile. It tumbles end-over-end and smashes one. ${host()}: "That's... one way to do it."`,
  (n, pr) => `${n} snaps. Yeets the bat overhand like a javelin. It spears through a gourd. Technical foul? ${host()} allows it.`,
  (n, pr) => `"ENOUGH!" ${n} launches the bat into the gourd display. One gourd cracks open on impact. Angry, but effective.`,
  (n, pr) => `${n} spin-throws the bat out of sheer frustration. It connects. Gourd destroyed. ${n} loses an ammo point but doesn't care.`,
];

const LUCKY_RICO = [
  (n, pr) => `${n}'s plum bounces off the gourd... flies up... arcs backward... and cracks it from behind. ${n} stares. "...Did that count?"`,
  (n, pr) => `The plum ricochets off the gourd, hits a rock, rebounds, and smashes through the back wall. ${host()}: "I'll allow it."`,
  (n, pr) => `${n}'s throw is terrible. But physics saves the day — the plum takes a lucky hop and demolishes the gourd from the side.`,
  (n, pr) => `A miracle ricochet. ${n}'s plum defies every law of motion and destroys the gourd on the second bounce.`,
];

// ── Phase 3: Hunt ──
const TRACK_FOUND = [
  (n, pr, clue) => `${n} kneels. ${clue}. ${pr.Sub} marks the direction in the dirt. Getting closer.`,
  (n, pr, clue) => `"Here." ${n} points at the ground. ${clue}. Another piece of the puzzle falls into place.`,
  (n, pr, clue) => `${n} spots it — ${clue}. ${pr.PosAdj} eyes narrow. The trail is getting warmer.`,
  (n, pr, clue) => `${n} crouches low and studies the terrain. ${clue}. The hunt tightens.`,
  (n, pr, clue) => `Something catches ${n}'s eye. ${clue}. ${pr.Sub} smiles. "Found you."`,
  (n, pr, clue) => `${n} reads the savanna like a book. ${clue}. Another breadcrumb on the trail.`,
];

const TRACK_FAIL = [
  (n, pr) => `${n} searches but the savanna gives up nothing. Wind erases every trace.`,
  (n, pr) => `Nothing. ${n} circles the zone twice and finds only dust. The target is a ghost.`,
  (n, pr) => `${n} follows a promising trail that leads to a dead end. Time wasted.`,
  (n, pr) => `${n} misreads a set of prints. They belong to a warthog. Disappointing.`,
  (n, pr) => `${n} scans the horizon. Nothing moves. The savanna keeps its secrets.`,
  (n, pr) => `${n} thought ${pr.Sub} saw something. ${pr.Sub} didn't. The hunt continues.`,
];

const CLUE_TYPES = [
  'Fresh tracks in the mud — large, barefoot, heading east',
  'A torn scrap of costume fabric caught on a thorn bush',
  'Claw marks gouged into an acacia trunk — recent',
  'A half-eaten plum, still wet — someone was here minutes ago',
  'Disturbed grass forming a clear path through the savanna',
  'A feather from the costume, caught in a spider web',
  'Musky scent on the wind — unmistakably feral',
  'A handprint on a rock, still warm from body heat',
  'Broken branches at shoulder height — something large pushed through',
  'A crude shelter made of palm fronds — abandoned recently',
];

const CHEF_ENCOUNTER = [
  (n, pr) => `${n} freezes. There — behind the brush. A shape. Breathing. Watching. It's Chef. The hunt just got real.`,
  (n, pr) => `Movement. ${n}'s hand goes to the tranq gun. Through the foliage: two eyes, wild and calculating. Chef.`,
  (n, pr) => `${n} rounds a tree and nearly collides with him. Chef. In full feral costume. They lock eyes.`,
  (n, pr) => `"Contact." ${n} whispers it to nobody. Chef crouches thirty feet away, muscles coiled. This is it.`,
  (n, pr) => `${n} spots the costume first — the tail, twitching behind a boulder. Then the eyes. Chef is HERE.`,
  (n, pr) => `The reeds part and Chef stands there, half-wild, half-calculating. ${n} raises the tranq gun. Heartbeat: deafening.`,
];

const TRANQ_HIT = [
  (n, pr) => `THWACK. Dead center. Chef goes down like a tranquilized rhino. ${n} stands over the target. "Tagged."`,
  (n, pr) => `${n} fires. The dart flies true. Chef stumbles, reaches for it, and crumples into the tall grass. It's over.`,
  (n, pr) => `One shot. One hit. Chef's eyes go wide, then sleepy, then closed. ${n} pumps ${pr.posAdj} fist. IMMUNITY.`,
  (n, pr) => `The dart catches Chef in the shoulder. ${pr.Sub} wobbles, pirouettes, and faceplants into a mud puddle. ${n} wins.`,
  (n, pr) => `${n}'s aim is perfect. The tranq dart buries itself in Chef's thigh. Chef looks betrayed, then unconscious. Game over.`,
  (n, pr) => `DIRECT HIT. Chef freezes mid-stride. The tranquilizer hits fast. ${n} watches ${pr.posAdj} target drop. Victory.`,
];

const TRANQ_MISS = [
  (n, pr) => `The dart sails past Chef's ear. Chef BOLTS. ${n} curses and gives chase, but the feral man is FAST.`,
  (n, pr) => `${n} fires — and hits a tree. Chef is already moving. Gone in three heartbeats.`,
  (n, pr) => `Miss! The dart embeds in a log. Chef vanishes into the tall grass like a ghost.`,
  (n, pr) => `${n}'s hands are shaking. The shot goes wide. Chef locks eyes for one second — then disappears.`,
  (n, pr) => `So close. The dart grazes Chef's costume but doesn't connect. Chef howls and RUNS.`,
  (n, pr) => `${n} fires from too far. The dart loses velocity and drops into the dirt. Chef doesn't even flinch.`,
];

const LAST_DART_HIT = [
  (n, pr) => `One dart left. One chance. ${n}'s hands are steady. The world goes quiet. THWACK. Chef drops. LEGENDARY.`,
  (n, pr) => `Last shot. Everything rides on this. ${n} exhales. Fires. The dart hits Chef between the shoulder blades. The savanna erupts.`,
  (n, pr) => `"This is it." ${n} raises the gun with ${pr.posAdj} final dart. Aims. Fires. DIRECT HIT. The crowd loses their minds.`,
  (n, pr) => `One dart. One breath. One shot. ${n} doesn't blink. THWACK. Chef goes down. Clutch of the season.`,
];

const LAST_DART_MISS = [
  (n, pr) => `Last dart. ${n} fires... and misses. The dart sinks into the dirt. Empty gun. Empty hopes. ${n} stares at nothing.`,
  (n, pr) => `One chance. ${n} takes it. The dart curves left. Chef is gone. ${n} has nothing left. The gun clicks empty.`,
  (n, pr) => `${n} burns ${pr.posAdj} last dart on a prayer. It doesn't connect. ${n} drops the gun. It's over.`,
  (n, pr) => `The final dart leaves the gun. It misses by inches. ${n}'s face falls. No ammo. No hope. Just savanna.`,
];

// ── Wildlife Hazards ──
const CROC_FAIL = [
  (n, pr) => `A crocodile LUNGES from the shallows and clamps onto ${n}'s pack. ${pr.Sub} kicks free but the croc takes a tranq ball with it.`,
  (n, pr) => `${n} steps too close to the water's edge. SNAP. The croc drags ${pr.obj} in. ${pr.Sub} scrambles out — minus one dart.`,
  (n, pr) => `The water erupts. ${n} barely dodges the jaws but the croc's tail sweep sends ${pr.posAdj} equipment flying.`,
  (n, pr) => `${n} freezes as yellow eyes surface. Too late — the croc strikes. ${pr.Sub} escapes but loses precious ammo.`,
];
const CROC_WIN = [
  (n, pr) => `${n} sees the ripples and LEAPS back. The croc snaps empty air. "Nice try." ${n} doesn't even break stride.`,
  (n, pr) => `A crocodile lunges — ${n} sidesteps like a matador. The croc slides past on the mud. ${n}: "Come on."`,
  (n, pr) => `${n} spots the croc before it strikes. Jumps the tail sweep and keeps moving. The savanna tests everyone.`,
  (n, pr) => `${n} slaps the water to spook the croc, then crosses while it retreats. Pro move.`,
];

const SNAKE_FAIL = [
  (n, pr) => `A mamba strikes from the tall grass. ${n} goes rigid. Paralyzed by the venom — out of action for a full tick.`,
  (n, pr) => `${n} steps on something that hisses. The bite is fast. ${pr.Sub} goes pale. The medic says ${pr.Sub}'ll recover, but not this tick.`,
  (n, pr) => `The snake gets ${n}'s ankle before ${pr.Sub} even sees it. One tick of paralysis. The savanna doesn't warn you twice.`,
  (n, pr) => `${n} reaches into the grass and immediately regrets it. Snake bite. ${pr.Sub} sits down hard. "Give me a minute."`,
];
const SNAKE_WIN = [
  (n, pr) => `${n} snatches the snake behind its head before it strikes. Uses it as a tracking rope. Incredible.`,
  (n, pr) => `${n} spots the snake's pattern in the grass and sidesteps. Then picks it up. "This could be useful."`,
  (n, pr) => `The snake coils to strike. ${n} stares it down. The snake decides this isn't worth it and slithers away.`,
  (n, pr) => `${n} hears the rattle and freezes perfectly still. The snake passes. ${n}'s tracking instinct sharpens from the adrenaline.`,
];

const BABOON_FAIL = [
  (n, pr) => `A pack of baboons descends on ${n}. They're ORGANIZED. One distracts while two others raid ${pr.posAdj} ammo pouch.`,
  (n, pr) => `Chattering fills the trees. ${n} looks up — baboons. They strip ${pr.posAdj} pack in seconds. Professional thieves.`,
  (n, pr) => `${n} tries to shoo the baboons. They don't shoo. They take ${pr.posAdj} tranq darts and vanish into the canopy.`,
  (n, pr) => `"HEY! GIVE THAT BACK!" ${n} chases baboons through the acacia grove. ${pr.Sub} doesn't catch them. ${pr.Sub} loses ammo.`,
];
const BABOON_WIN = [
  (n, pr) => `${n} offers a plum to the alpha baboon. It accepts. The pack leads ${pr.obj} toward fresh tracks. Alliance formed.`,
  (n, pr) => `${n} sits perfectly still while the baboons investigate. They decide ${pr.Sub}'s okay. One of them points east. A clue.`,
  (n, pr) => `${n} and the baboons reach an understanding. ${pr.Sub} shares food; they share intel. The baboons saw Chef.`,
  (n, pr) => `The baboons chatter excitedly when ${n} approaches. One drops a scrap of costume fabric at ${pr.posAdj} feet. Helpful.`,
];

const ROCK_FAIL = [
  (n, pr) => `The rocks shift. ${n} goes down in an avalanche of rubble. Nothing broken, but ${pr.Sub}'s stuck for a full tick.`,
  (n, pr) => `A boulder dislodges above ${n}. ${pr.Sub} dives but catches a rock to the shoulder. Minor injury, major delay.`,
  (n, pr) => `${n} reaches for a handhold. It crumbles. ${pr.Sub} slides down the outcrop in a shower of gravel.`,
  (n, pr) => `The outcrop is unstable. ${n} learns this the hard way when the ledge gives out beneath ${pr.obj}.`,
];
const ROCK_WIN = [
  (n, pr) => `${n} scrambles up the outcrop and reaches the top. The view is incredible — and there, in the distance, movement.`,
  (n, pr) => `${n} climbs through the rockslide zone and reaches a vantage point. From up here, the whole savanna is readable.`,
  (n, pr) => `${n} navigates the unstable rocks with care. Reward: a high-ground view that reveals tracks in the valley below.`,
  (n, pr) => `${n} pulls ${pr.ref} onto the ridge. Eagles circle overhead. Below: a trail of disturbed grass. A clue.`,
];

const QUICK_FAIL = [
  (n, pr) => `${n} steps into quicksand and sinks to ${pr.posAdj} waist. "HELP! SOMEBODY!" The savanna doesn't answer. Stuck for two ticks.`,
  (n, pr) => `The mud grabs ${n}'s legs. ${pr.Sub} fights it — which makes it worse. Two ticks of struggling unless someone helps.`,
  (n, pr) => `${n} walks onto what looks like solid ground. It isn't. ${pr.Sub} sinks fast. Panic sets in.`,
  (n, pr) => `"This feels wrong—" ${n} is already waist-deep. Quicksand. The more ${pr.Sub} moves, the deeper ${pr.Sub} goes.`,
];
const QUICK_WIN = [
  (n, pr) => `${n} spots the discolored earth just in time. Quicksand. ${pr.Sub} marks it with a stick for others.`,
  (n, pr) => `${n} tests the ground with ${pr.posAdj} foot. Soft. Too soft. ${pr.Sub} reroutes and avoids the trap entirely.`,
  (n, pr) => `The mud bubbles. ${n} knows what that means. ${pr.Sub} sidesteps the quicksand and keeps moving. Smart.`,
  (n, pr) => `${n} reads the terrain like a pro. The quicksand patch is obvious to trained eyes. ${pr.Sub} goes around.`,
];

const HIPPO_FAIL = [
  (n, pr) => `A hippo surfaces in the riverbed crossing. ${n} tries to stand ${pr.posAdj} ground — bad idea. Charged backward. Ammo lost.`,
  (n, pr) => `The hippo's mouth opens wider than ${n}'s entire body. ${pr.Sub} retreats so fast ${pr.Sub} leaves a trail of equipment.`,
  (n, pr) => `${n} underestimates the hippo. It charges. ${pr.Sub}'s forced back to the previous zone. One dart lost in the river.`,
  (n, pr) => `The riverbed explodes as a hippo emerges. ${n} doesn't run — ${pr.Sub} SCRAMBLES. Back to safety, minus ammo.`,
];
const HIPPO_WIN = [
  (n, pr) => `${n} and the hippo have a staredown. Ten seconds. Twenty. The hippo blinks first. ${n} crosses.`,
  (n, pr) => `${n} waits for the hippo to submerge, then sprints across the shallow crossing. Perfect timing.`,
  (n, pr) => `The hippo snorts. ${n} holds ground. Something in ${pr.posAdj} eyes says "not today." The hippo yields.`,
  (n, pr) => `${n} finds a secondary crossing upstream, bypassing the hippo entirely. Smart navigation.`,
];

// ── Social Events ──
const ALLIANCE_HUNT = [
  (a, b) => `${a} and ${b} fall into step together. They share clues, split the search grid, and move as a unit.`,
  (a, b) => `"Over here." ${a} waves ${b} over. They compare tracks and suddenly the trail makes sense. Teamwork.`,
  (a, b) => `${a} and ${b} hunt together. One reads tracks, the other covers. Both learn more than they would alone.`,
  (a, b) => `${a} spots something ${b} missed. ${b} catches a detail ${a} overlooked. Together they're twice as effective.`,
];

const AMMO_THEFT = [
  (thief, victim) => `${thief} sidles up to ${victim}'s pack while they're distracted. Two tranq darts change ownership. Silently.`,
  (thief, victim) => { const pr = pronouns(victim); return `${thief} bumps into ${victim} in the brush. "Sorry." ${victim} doesn't notice ${pr.posAdj} ammo pouch is lighter.`; },
  (thief, victim) => `${thief} waits until ${victim} sets down the gun. Quick hands. Two darts. Gone before ${victim} turns around.`,
  (thief, victim) => `${thief} "accidentally" knocks ${victim}'s ammo pouch open. What falls out? ${thief}'s gain.`,
];

const AMMO_CAUGHT = [
  (thief, victim) => `"Put. That. Back." ${victim} catches ${thief} red-handed. The stolen darts are returned. ${thief}'s reputation? Not so much.`,
  (thief, victim) => `${victim}'s eyes go cold. "I watched you take them." ${thief} tries to deny it. Nobody believes ${pronouns(thief).obj}.`,
  (thief, victim) => `${victim} grabs ${thief}'s wrist. The stolen darts clatter to the ground. "You really thought I wouldn't notice?"`,
  (thief, victim) => `${thief} fumbles the stolen ammo. ${victim} picks it up. Stares. The silence is worse than shouting.`,
];

const RIVALRY_SHOW = [
  (a, b, winner) => `${a} and ${b} spot the same clue. Neither backs down. It gets physical. ${winner} walks away with the intel.`,
  (a, b, winner) => `${a} and ${b} collide in the bush. Old grudges ignite. A wrestling match over a single track. ${winner} wins.`,
  (a, b, winner) => `"That's MY lead." ${a} and ${b} shove each other over a clue in the dirt. ${winner} claims it. ${winner === a ? b : a} fumes.`,
  (a, b, winner) => `${a} and ${b} go head-to-head over contested ground. The confrontation is brief and brutal. ${winner} takes the clue.`,
];

const QUICKSAND_RESCUE = [
  (rescuer, victim) => `${rescuer} grabs ${victim}'s wrist and PULLS. "${victim}: "I owe you." ${rescuer}: "Remember that at tribal."`,
  (rescuer, victim) => `${rescuer} fashions a vine rope and pulls ${victim} free. They collapse on solid ground, both breathing hard.`,
  (rescuer, victim) => `${rescuer} lies flat and reaches into the quicksand. ${victim} grabs on. It takes everything to pull free.`,
  (rescuer, victim) => `"Don't move. Just grab my hand." ${rescuer} anchors against a tree and hauls ${victim} out. A moment of genuine heroism.`,
];

const CHEF_SIGHTING = [
  () => `A ROAR echoes across the savanna. Every head snaps toward the sound. Chef just revealed himself.`,
  () => `Something crashes through the brush. A flash of costume. Chef, spotted — and he's running.`,
  () => `A flock of birds erupts from the trees. Something spooked them. Something big. Something feral.`,
  () => `The watering hole goes silent. Then — movement. Chef rises from behind a rock, wild-eyed. Everyone sees him.`,
];

const NIGHT_FALLS = [
  () => `The sun bleeds below the horizon. The savanna turns dark blue. The hunt enters its final chapter.`,
  () => `Night falls like a curtain. Shadows stretch. Sounds sharpen. Everything changes.`,
  () => `The last light dies. Stars appear. Somewhere in the darkness, Chef is still out there. Waiting.`,
  () => `Dusk gives way to darkness. The flashlights come out. The hunt is different now. Colder. Closer.`,
];

const ATTENBOROUGH = [
  'The hunter becomes still. The savanna holds its breath.',
  'Something moves in the tall grass. Or perhaps it was nothing.',
  'The golden hour bleeds into dusk. Time is running out.',
  'A distant roar. Every head turns. Nobody moves.',
  'The savanna does not forgive hesitation.',
  'Somewhere out there, Chef watches. And waits.',
  'The sun touches the horizon. The hunt enters its final chapter.',
  'Night falls like a curtain. The rules change.',
  'In the tall grass, patience is the only weapon that never runs out.',
  'The prey is watching the predators. It has always been this way.',
  'Every step leaves a story. The question is who can read it.',
  'The savanna is ancient. It has seen a thousand hunts. This one amuses it.',
];

// ── New Social: Sabotage & Misdirection ──
const FALSE_TRAIL = [
  (n, pr, victim) => `${n} scratches fake claw marks into a tree and plants a torn cloth strip. ${victim} finds it next tick and follows the phantom trail.`,
  (n, pr, victim) => `${n} drags a branch through the mud, creating convincing footprints leading east. ${victim} takes the bait.`,
  (n, pr, victim) => `${n} leaves a half-eaten plum and some fur at a decoy site. ${victim} will waste a full tick investigating.`,
  (n, pr, victim) => `${n} scatters costume fragments near a watering hole. The trail is fabricated. ${victim} won't know until it's too late.`,
];
const FALSE_TRAIL_DETECTED = [
  (victim, schemer) => `${victim} studies the fake trail. Something's off — the tracks are too clean. ${victim} looks back. Sees ${schemer} watching. "Nice try."`,
  (victim, schemer) => `${victim} crouches at the planted evidence. Sniffs. "This was placed here." ${victim} locks eyes with ${schemer}. Busted.`,
  (victim, schemer) => `${victim}'s intuition fires. The claw marks are wrong — too shallow, wrong angle. ${schemer}'s trap fails.`,
  (victim, schemer) => `"These prints are backwards." ${victim} stands up. Looks directly at ${schemer}. "You think I'm stupid?"`,
];
const ZONE_LURE = [
  (schemer, victim) => `${schemer} sidles up to ${victim}. "I saw Chef heading toward the ridge. Trust me." ${victim} changes course. Chef is nowhere near the ridge.`,
  (schemer, victim) => `"Psst — ${victim}. Chef's at the watering hole. Go NOW." ${schemer} smiles as ${victim} runs the wrong direction.`,
  (schemer, victim) => `${schemer} whispers false intel to ${victim}: "Chef's hiding in the ravine." ${victim} believes it. The ravine is empty.`,
  (schemer, victim) => `${schemer} points ${victim} toward the far zone. "He went that way. I'm sure of it." ${schemer} is not sure of it.`,
];
const ZONE_LURE_RESISTED = [
  (schemer, victim) => `${victim} squints at ${schemer}. "You want me to go WHERE? I'll pass." ${schemer}'s misdirection falls flat.`,
  (schemer, victim) => `"Right. And you're just telling me this out of the kindness of your heart?" ${victim} doesn't move. ${schemer} shrugs and walks away.`,
  (schemer, victim) => `${victim} considers ${schemer}'s tip, then checks the tracks. They don't match. "You're lying." ${schemer} doesn't deny it.`,
  (schemer, victim) => `${victim} crosses ${pronouns(victim).posAdj} arms. "Last time you 'helped' me, I ended up in quicksand." ${schemer}'s reputation precedes ${pronouns(schemer).obj}.`,
];

// ── New Social: Truces & Betrayals ──
const HUNT_PACT = [
  (a, b) => `${a} and ${b} make a pact. "We hunt together until we find Chef. Then... we'll figure it out." Hands shake. Eyes don't trust.`,
  (a, b) => `"Truce?" ${a} extends a hand. ${b} takes it. They combine their tracking knowledge. For now, they're a unit.`,
  (a, b) => `${a} and ${b} agree to pool clues and cover more ground. The alliance is temporary — but neither says that out loud.`,
  (a, b) => `"Two heads, double the eyes." ${a} and ${b} team up. The savanna just got smaller for Chef.`,
];
const PACT_BETRAYAL = [
  (traitor, partner) => `${traitor} spots Chef. Looks at ${partner}. Looks back at Chef. Raises the gun. Fires. ALONE. The pact dies in a single heartbeat.`,
  (traitor, partner) => `"Sorry about this." ${traitor} breaks formation and sprints toward Chef, leaving ${partner} behind. The truce was always temporary.`,
  (traitor, partner) => `${partner} turns to coordinate — but ${traitor} is already gone, tranq gun raised, hunting solo. Betrayed.`,
  (traitor, partner) => `${traitor} said they'd share the shot. ${traitor} lied. ${partner} watches ${traitor} fire alone and understands everything.`,
];
const PACT_HONOR = [
  (a, b) => `${a} spots Chef. Signals ${b}. They approach together. Both raise their guns. Both get a shot. Honor kept.`,
  (a, b) => `"Over here — Chef!" ${a} calls ${b} over instead of shooting solo. The pact holds. They both fire.`,
  (a, b) => `${a} could have taken the shot alone. Instead: a whistle. ${b} arrives. They aim together. The pact is real.`,
  (a, b) => `The pact holds. ${a} and ${b} approach Chef as a team. Whatever happens next, they face it together.`,
];

// ── New Social: Ammo Economy ──
const DART_TRADE = [
  (giver, receiver) => `${giver} slides a dart across. ${receiver} shares a clue. Fair trade. Both walk away better armed.`,
  (giver, receiver) => `"I've got darts but no clue where Chef is. You've got clues but nothing to shoot with. Deal?" ${giver} and ${receiver} shake on it.`,
  (giver, receiver) => `${giver} trades a spare dart for ${receiver}'s tracking intel. The economy of the savanna at work.`,
  (giver, receiver) => `"Take it." ${giver} hands ${receiver} a dart. In return: a whispered direction and a drawn map in the dirt.`,
];
const DESPERATE_BEG = [
  (beggar, donor) => `${beggar} approaches ${donor} with empty hands and desperate eyes. "I've got nothing. Please." ${donor} hesitates... then hands over a dart.`,
  (beggar, donor) => `"I'm begging you." ${beggar} actually gets on ${pronouns(beggar).posAdj} knees. ${donor} sighs and gives up a dart. "Don't waste it."`,
  (beggar, donor) => `${beggar}'s gun is empty. ${donor} sees the desperation. A dart changes hands. "You owe me."`,
  (beggar, donor) => `${beggar} has nothing left. ${donor} looks at ${pronouns(donor).posAdj} ammo pouch, then at ${beggar}'s face. "...Fine. ONE."`,
];
const BEG_REJECTED = [
  (beggar, donor) => `${beggar} asks ${donor} for a dart. ${donor} laughs. "Sorry, survival of the fittest." ${beggar} walks away humiliated.`,
  (beggar, donor) => `"Can I have a—" "No." ${donor} doesn't even let ${beggar} finish. Cold. Effective.`,
  (beggar, donor) => `${beggar} approaches ${donor}, hands out. ${donor} shakes ${pronouns(donor).posAdj} head. "Not my problem." The savanna is cruel.`,
  (beggar, donor) => `${beggar}: "One dart. Just one." ${donor}: "Should've smashed more gourds." ${beggar} has never hated anyone more.`,
];
const PROTECTION_RACKET = [
  (schemer, victim) => `${schemer} blocks ${victim}'s path. "Give me a dart, or I stampede this entire zone. Your call." ${victim} complies.`,
  (schemer, victim) => `"Nice tracking you're doing here. Be a shame if someone... SCREAMED and scared Chef away." ${schemer} gets a dart from ${victim}.`,
  (schemer, victim) => `${schemer} stands over ${victim}'s pack. "One dart. Or I make noise. Lots of noise." ${victim} hands it over, seething.`,
  (schemer, victim) => `"Insurance premium." ${schemer} holds out a hand. ${victim} knows what happens if ${pronouns(victim).Sub} refuses. A dart is surrendered.`,
];
const RACKET_REFUSED = [
  (schemer, victim) => `"Give me a dart or—" "Or what?" ${victim} stands tall. ${schemer} backs down. Not worth the fight.`,
  (schemer, victim) => `${schemer} tries to intimidate ${victim}. ${victim} doesn't blink. "Touch my ammo and I'll make tribal council VERY interesting for you."`,
  (schemer, victim) => `${victim} laughs in ${schemer}'s face. "Stampede away. I'll tell everyone what you tried." ${schemer} retreats.`,
  (schemer, victim) => `${schemer} makes the threat. ${victim} picks up a rock. Stares. ${schemer} decides this isn't the hill to die on.`,
];
const RACKET_STAMPEDE = [
  (schemer) => `${schemer} makes good on the threat. A bloodcurdling scream. Birds scatter. Tracking in the zone is ruined for everyone.`,
  (schemer) => `${schemer} wasn't bluffing. The noise is enormous. Every hunter nearby loses their trail. Chef relocates.`,
  (schemer) => `CHAOS. ${schemer} kicks dirt, screams, throws rocks. The zone is compromised. Nobody's tracking anything here now.`,
  (schemer) => `${schemer} follows through. The stampede is deliberate. Calculated destruction. Everyone in the zone pays the price.`,
];

// ── Chef Stamina Events ──
const CHEF_WINDED = [
  () => `Chef's breathing is labored now. ${host()} notices from the commentary booth: "He's slowing down, folks."`,
  () => `The feral man stumbles. Just a half-step, but the hunters notice. He's getting tired.`,
  () => `Chef pauses to catch his breath behind a baobab tree. His hands shake. The stamina is draining.`,
  () => `Sweat drips from Chef's chin. His movements are less explosive, more conserving. The hunt is wearing him down.`,
];
const CHEF_EXHAUSTED = [
  () => `Chef is SPENT. He's barely moving, chest heaving, hiding behind anything that casts a shadow. The endgame is here.`,
  () => `${host()} grabs the PA: "Hunters — Chef is running on FUMES. This is your moment."`,
  () => `Chef's costume is torn, he's limping, and his eyes have lost that feral edge. He's prey now.`,
  () => `The feral man collapses behind a rock. Gets up. Collapses again. The stamina meter is in the red.`,
];
const CHEF_COLLAPSE = [
  (winner) => `Chef doesn't run. He CAN'T run. He drops to his knees in the open savanna. ${winner} walks up and tags him. It's over.`,
  (winner) => `The feral man gives out. No more stamina. No more running. ${winner}, closest to the scene, claims the catch.`,
  (winner) => `Chef faceplants into the dirt. The tranquilizer isn't even needed — he's done. ${winner} stands over the exhausted target.`,
  (winner) => `"He's down! HE'S DOWN!" ${host()} screams as Chef collapses. ${winner} reaches him first. The Great Safari Hunt is over.`,
];

// ── Awareness Tier Narration ──
const TIER_UP_SPOTTED = [
  (n, pr) => `${n}'s eyes sharpen. The signs are converging. Chef is close — ${pr.Sub} can feel it. SPOTTED.`,
  (n, pr) => `"I know where you are." ${n} whispers it. The tracks, the scent, the broken branches — they all point the same way. SPOTTED.`,
];
const TIER_UP_STALKING = [
  (n, pr) => `${n} drops to a crouch. Every step deliberate. Every breath measured. ${pr.Sub}'s not tracking anymore — ${pr.Sub}'s STALKING.`,
  (n, pr) => `${n} sees the shadow move. Thirty meters. Twenty. ${pr.Sub} matches Chef's pace from the brush. The predator is now the prey. STALKING.`,
];
const TIER_UP_AMBUSH = [
  (n, pr) => `${n} is in position. Perfect angle. Perfect cover. Chef has no idea. The ambush is set. One shot is all it takes.`,
  (n, pr) => `${n} circles downwind. Lines up behind a fallen tree. Chef is right there. This is the moment. AMBUSH READY.`,
];

const STEAL_KILL = [
  (a, b) => `${a} and ${b} spot Chef at the same time. Both raise their guns. Both fire. Only one dart connects.`,
  (a, b) => `Two hunters. One target. ${a} and ${b} sprint from different angles. The showdown is simultaneous.`,
  (a, b) => `${a} had Chef lined up — then ${b} appears from the grass. Both shoot. The savanna holds its breath.`,
  (a, b) => `It's a race to the trigger. ${a} and ${b} see Chef and each other. Three heartbeats. Two darts. One winner.`,
];

// ══════════════════════════════════════════════════════════════
// PHASE 1: SOCK-ET TO ME
// ══════════════════════════════════════════════════════════════

function simulateSockerToMe(active, ep, campKey, campEvents) {
  const results = [];
  const maxPlums = clamp(Math.ceil(active.length * 0.7), 6, 12);

  for (const runner of active) {
    const s = pStats(runner);
    const pr = pronouns(runner);
    const others = active.filter(n => n !== runner);
    const dodgeRoll = s.physical * 0.30 + s.intuition * 0.30 + s.boldness * 0.20 + s.endurance * 0.20 + noise(2.5);
    const events = [];
    const hitBy = [];
    let totalHits = 0;
    let savedPlums = 0;
    let isWipeout = false;
    let isProdigy = false;

    // Check for prodigy / wipeout first
    if (dodgeRoll <= 3.5) {
      isWipeout = true;
      popDelta(runner, -1);
      for (const o of active) if (o !== runner) addBond(runner, o, 0.5);
    } else if (s.physical >= 8 && dodgeRoll >= 8) {
      isProdigy = true;
      popDelta(runner, 1);
    }

    // Each kicker kicks
    const kickResults = [];
    for (const kicker of others) {
      const ks = pStats(kicker);
      const kickRoll = ks.physical * 0.40 + ks.intuition * 0.25 + ks.boldness * 0.20 + ks.strategic * 0.15 + noise(2.5);
      const ka = arch(kicker);

      // Intentional miss — saves a plum for the runner
      if (NICE.has(ka) && getBond(kicker, runner) >= 3 && Math.random() < 0.6) {
        savedPlums++;
        addBond(kicker, runner, 1);
        if (Math.random() < 0.4) popDelta(kicker, -0.5);
        kickResults.push({ kicker, roll: kickRoll, hit: false, intentionalMiss: true,
          text: pickFresh(INTENTIONAL_MISS, 'int-miss')(kicker, runner) });
        continue;
      }

      // Targeted headshot — villain aims for their lowest bond
      if (VILLAIN.has(ka)) {
        const lowestBond = others.reduce((best, o) => getBond(kicker, o) < getBond(kicker, best) ? o : best, others[0]);
        if (runner === lowestBond && Math.random() < 0.4) {
          totalHits += 2;
          hitBy.push(kicker, kicker);
          popDelta(kicker, 0.5);
          addBond(kicker, runner, -1.5);
          ep.chalMemberScores[kicker] = (ep.chalMemberScores[kicker] || 0) + 3;
          kickResults.push({ kicker, roll: kickRoll, hit: true, headshot: true,
            text: pickFresh(HEADSHOT, 'headshot')(kicker, runner) });
          continue;
        }
      }

      // Revenge kick — runner hit this kicker hard during kicker's own run
      const prevRun = results.find(r => r.name === kicker);
      if (prevRun && prevRun.hitBy.includes(runner) && getBond(kicker, runner) < 0 && Math.random() < 0.35) {
        totalHits += 2;
        hitBy.push(kicker, kicker);
        popDelta(kicker, 0.5);
        addBond(kicker, runner, -1);
        ep.chalMemberScores[kicker] = (ep.chalMemberScores[kicker] || 0) + 3;
        kickResults.push({ kicker, roll: kickRoll, hit: true, revenge: true,
          text: pickFresh(REVENGE_KICK, 'revenge')(kicker, runner) });
        continue;
      }

      // Taunt & whiff — bold villain/neutral showboats and misses
      if ((VILLAIN.has(ka) || ks.boldness >= 7) && ks.boldness >= 6 && kickRoll <= dodgeRoll && Math.random() < 0.3) {
        popDelta(kicker, -1);
        addBond(kicker, runner, -0.5);
        ep.chalMemberScores[kicker] = (ep.chalMemberScores[kicker] || 0) - 1;
        kickResults.push({ kicker, roll: kickRoll, hit: false, taunt: true,
          text: pickFresh(TAUNT_WHIFF, 'taunt')(kicker, runner) });
        continue;
      }

      // Dodge juke — high intuition runner fakes out a kicker
      if (s.intuition >= 7 && kickRoll > dodgeRoll - 1 && kickRoll <= dodgeRoll + 1.5 && Math.random() < 0.25) {
        popDelta(runner, 0.5);
        ep.chalMemberScores[runner] = (ep.chalMemberScores[runner] || 0) + 1;
        kickResults.push({ kicker, roll: kickRoll, hit: false, juke: true,
          text: pickFresh(DODGE_JUKE, 'juke')(runner, kicker) });
        continue;
      }

      // Panic throw — low boldness kicker chokes
      if (ks.boldness <= 4 && kickRoll <= dodgeRoll && Math.random() < 0.25) {
        popDelta(kicker, -0.5);
        ep.chalMemberScores[kicker] = (ep.chalMemberScores[kicker] || 0) - 1;
        kickResults.push({ kicker, roll: kickRoll, hit: false, panic: true,
          text: pickFresh(PANIC_THROW, 'panic')(kicker, runner) });
        continue;
      }

      // Standard hit/miss
      if (kickRoll > dodgeRoll) {
        totalHits++;
        hitBy.push(kicker);
        popDelta(kicker, 0.5);
        addBond(kicker, runner, -0.5);
        ep.chalMemberScores[kicker] = (ep.chalMemberScores[kicker] || 0) + 2;
        kickResults.push({ kicker, roll: kickRoll, hit: true });
      } else {
        kickResults.push({ kicker, roll: kickRoll, hit: false });
      }
    }

    // Raw hits = kicks that actually connected (before deflect/collateral adjustments)
    const rawHits = totalHits;
    let negatedHits = 0;

    // Ball deflection (post-kick special)
    if (s.physical >= 7 && dodgeRoll >= 8 && totalHits > 0) {
      const hitKicker = hitBy[0];
      const deflectedKick = kickResults.find(k => k.kicker === hitKicker && k.hit);
      if (deflectedKick) deflectedKick.deflected = true;
      events.push({ type: 'deflect', kicker: hitKicker, text: pickFresh(BALL_DEFLECT, 'deflect')(runner, pr, hitKicker) });
      popDelta(hitKicker, -1);
      popDelta(runner, 1);
      addBond(runner, hitKicker, -1);
      totalHits = Math.max(0, totalHits - 1);
      negatedHits++;
    }

    // Collateral damage (post-kick special)
    const hitKickers = kickResults.filter(k => k.hit && !k.headshot && !k.intentionalMiss && !k.revenge);
    if (hitKickers.length >= 2 && Math.random() < 0.35) {
      const [k1, k2] = hitKickers;
      events.push({ type: 'collateral', text: pickFresh(COLLATERAL, 'collateral')(k1.kicker, k2.kicker) });
      k1.collided = true;
      k2.collided = true;
      const negated = Math.min(2, totalHits);
      totalHits = Math.max(0, totalHits - 2);
      negatedHits += negated;
    }

    // Wipeout/prodigy events (stored as post-kick events for VP)
    if (isWipeout) {
      events.unshift({ type: 'wipeout', text: pickFresh(DODGE_WIPEOUT, 'wipeout')(runner, pr) });
    } else if (isProdigy) {
      events.unshift({ type: 'prodigy', text: pickFresh(PRODIGY, 'prodigy')(runner, pr) });
    }

    const finalPlums = isWipeout ? 0 : clamp(maxPlums - totalHits, 0, maxPlums);

    // Narrate the run — use rawHits so "clean run" only fires if NO kicks connected
    if (rawHits === 0 && !isProdigy && !isWipeout) {
      events.unshift({ type: 'dodge-success', text: pickFresh(DODGE_SUCCESS, 'dodge-ok')(runner, pr) });
    } else if (rawHits > 0 && !isWipeout) {
      events.unshift({ type: 'dodge-partial', text: pickFresh(DODGE_PARTIAL, 'dodge-part')(runner, pr, rawHits) });
    }

    ep.chalMemberScores[runner] = (ep.chalMemberScores[runner] || 0) + finalPlums * 2;
    results.push({ name: runner, dodgeRoll, plums: finalPlums, maxPlums, hits: totalHits, rawHits, negatedHits, savedPlums, hitBy, events, kickResults });
  }

  // Romance hook
  _challengeRomanceSpark(active, null, null, campKey, campEvents, ep);
  return results;
}

// ══════════════════════════════════════════════════════════════
// PHASE 2: GOURD SMASH
// ══════════════════════════════════════════════════════════════

function simulateGourdSmash(active, ep, campKey, campEvents, sockerResults) {
  const plumMap = {};
  for (const r of sockerResults) plumMap[r.name] = r.plums;

  const results = [];
  const threshold = 5.5;

  for (const name of active) {
    const s = pStats(name);
    const pr = pronouns(name);
    const plums = plumMap[name] || 0;
    const events = [];
    const swings = [];
    let gourdsSmashed = 0;

    for (let a = 0; a < plums; a++) {
      let roll = s.physical * 0.35 + s.boldness * 0.30 + s.endurance * 0.20 + s.temperament * 0.15 + noise(2.5);

      // Chris distraction (~20% per swing)
      let distracted = false;
      let distractText = '';
      if (Math.random() < 0.20) {
        const rival = active.filter(o => o !== name).reduce((best, o) => getBond(name, o) < getBond(name, best) ? o : best, active.filter(o => o !== name)[0]);
        const mentalCheck = s.mental + noise(2) >= 5;
        if (!mentalCheck) {
          distracted = true;
          distractText = pickFresh(CHRIS_DISTRACT, 'chris-d')(name, pr, rival);
          events.push({ type: 'chris-distract', swing: a + 1, text: distractText });
          roll -= 2;
        }
      }

      // Lucky ricochet — near miss becomes a smash
      let ricochet = false;
      let ricoText = '';
      if (roll >= threshold - 0.5 && roll < threshold) {
        ricochet = true;
        ricoText = pickFresh(LUCKY_RICO, 'ricochet')(name, pr);
        events.push({ type: 'lucky-ricochet', swing: a + 1, text: ricoText });
      }

      const hit = roll >= threshold || ricochet;

      // Bat toss — frustration smash on a miss (hotheads/bold, 20%)
      let batToss = false;
      let batText = '';
      if (!hit && (s.temperament <= 3 || s.boldness >= 8) && Math.random() < 0.2) {
        batToss = true;
        batText = pickFresh(BAT_TOSS, 'bat-toss')(name, pr);
        events.push({ type: 'bat-toss', swing: a + 1, text: batText });
      }

      const smashed = hit || batToss;
      if (smashed) gourdsSmashed++;

      // Per-swing narration text
      const ord = ['1st','2nd','3rd','4th','5th','6th','7th','8th'][gourdsSmashed - 1] || `${gourdsSmashed}th`;
      let narr = '';
      if (distractText) narr = distractText;
      else if (ricoText) narr = ricoText;
      else if (batText) narr = batText;
      else if (smashed) narr = pickFresh(GOURD_SMASH, 'gourd-smash')(name, pr, ord);
      else narr = pickFresh(GOURD_MISS, 'gourd-miss')(name, pr);

      swings.push({ swing: a + 1, roll, smashed, distracted, ricochet, batToss, narr });
    }

    if (gourdsSmashed === 0) {
      events.push({ type: 'fail', text: pickFresh(GOURD_FAIL_TOTAL, 'gourd-fail')(name, pr) });
    }

    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + gourdsSmashed * 3;
    results.push({ name, plums, swings, gourdsSmashed, tranqAmmo: 0, hasSlingshot: gourdsSmashed > 0, events });
  }

  // +1 dart to everyone (baseline), then gourds smashed on top
  for (const r of results) {
    r.tranqAmmo = r.gourdsSmashed + 1;
  }

  // Most gourds smashed = hunt advantage (clue to Antler Chef location)
  const sorted = [...results].sort((a, b) => b.gourdsSmashed - a.gourdsSmashed);
  if (sorted[0] && sorted[0].gourdsSmashed > 0 && (sorted.length < 2 || sorted[0].gourdsSmashed > sorted[1].gourdsSmashed)) {
    sorted[0].huntAdvantage = true;
    sorted[0].events.push({ type: 'hunt-advantage', text: `${sorted[0].name} smashed the most gourds. Chris hands over a sealed clue — a head start in the hunt.` });
  }

  _challengeRomanceSpark(active, null, null, campKey, campEvents, ep);
  return results;
}

// ══════════════════════════════════════════════════════════════
// PHASE 3: THE GREAT SAFARI HUNT
// ══════════════════════════════════════════════════════════════

function simulateHunt(active, ep, campKey, campEvents, gourdResults) {
  const ammoMap = {};
  const slingshotMap = {};
  const advantageMap = {};
  for (const r of gourdResults) {
    ammoMap[r.name] = r.tranqAmmo;
    slingshotMap[r.name] = r.hasSlingshot;
    if (r.huntAdvantage) advantageMap[r.name] = true;
  }

  // ── AWARENESS TIERS ──
  // 0=Tracking, 1=Spotted, 2=Stalking, 3=Ambush
  const TIER_NAMES = ['Tracking', 'Spotted', 'Stalking', 'Ambush'];
  const TIER_HIT_BONUS = [0, 0, 1.0, 2.5];

  // Init player states
  const playerStates = {};
  const zoneIds = ZONES.map(z => z.id);
  for (const name of active) {
    playerStates[name] = {
      zone: pick(zoneIds),
      clues: advantageMap[name] ? 1 : 0,
      awareness: advantageMap[name] ? 1 : 0,
      ammo: ammoMap[name] || 1,
      hasSlingshot: slingshotMap[name] || false,
      stuckTicks: 0,
      hazardsSurvived: 0,
      ammoSpent: 0,
      paralyzed: false,
      snakeBonus: false,
      huntAdvantage: !!advantageMap[name],
      pactPartner: null,
      falseTrailVictim: false,
    };
  }

  // ── CHEF STAMINA SYSTEM ──
  let chefStamina = 100;
  const CHEF_BASE_DODGE = 9.5;
  let chefZone = pick(zoneIds.filter(z => !Object.values(playerStates).some(p => p.zone === z))) || pick(zoneIds);
  const chefPath = [chefZone];
  let immunityWinner = null;
  let winTick = null;
  const maxTicks = 30;
  const huntTicks = [];

  for (let tick = 1; tick <= maxTicks && !immunityWinner && chefStamina > 0; tick++) {
    // Chef stamina-based dodge
    const staminaPct = chefStamina / 100;
    const CHEF_DODGE_FLOOR = 4.5;
    const chefDodge = CHEF_DODGE_FLOOR + (CHEF_BASE_DODGE - CHEF_DODGE_FLOOR) * staminaPct;
    const isNight = chefStamina <= 40;
    const isExhausted = chefStamina <= 15;
    const tickEvents = [];
    const encounterData = [];
    let chefAlertBonus = 0;

    // Passive stamina drain
    chefStamina = Math.max(0, chefStamina - 2);
    if (isNight) chefStamina = Math.max(0, chefStamina - 1);

    // Move Chef every 2 ticks — costs stamina
    if (tick > 1 && tick % 2 === 0) {
      const adjZones = zoneById(chefZone).adj;
      chefZone = pick(adjZones);
      chefPath.push(chefZone);
      chefStamina = Math.max(0, chefStamina - 5);
    }

    // Chef senses converging hunters and flees preemptively
    const huntersInZone = active.filter(n => playerStates[n].zone === chefZone && playerStates[n].awareness >= 1).length;
    if (huntersInZone >= 3 && chefStamina > 10) {
      const fleeZones = zoneById(chefZone).adj.filter(z => !active.some(n => playerStates[n].zone === z && playerStates[n].awareness >= 2));
      if (fleeZones.length) {
        chefZone = pick(fleeZones);
        chefPath.push(chefZone);
        chefStamina = Math.max(0, chefStamina - 4);
        tickEvents.push({ type: 'chef-flees', text: `Chef senses the pack closing in and bolts! He crashes through the brush to a new zone — but it costs him.` });
      }
    }

    // Night falls event (first time stamina drops below 40)
    if (isNight && tick > 1 && !huntTicks.some(t => t.isNight)) {
      tickEvents.push({ type: 'night-falls', text: pickFresh(NIGHT_FALLS, 'night')() });
    }

    // Chef winded event (stamina crosses 50)
    if (chefStamina <= 50 && chefStamina > 15 && !huntTicks.some(t => t.chefStamina <= 50)) {
      tickEvents.push({ type: 'chef-winded', text: pickFresh(CHEF_WINDED, 'winded')() });
    }

    // Chef exhausted event (stamina crosses 15)
    if (isExhausted && !huntTicks.some(t => t.chefStamina <= 15)) {
      tickEvents.push({ type: 'chef-exhausted', text: pickFresh(CHEF_EXHAUSTED, 'exhausted')() });
    }

    // ── PER-PLAYER ACTIONS ──
    for (const name of active) {
      if (immunityWinner) break;
      const ps = playerStates[name];
      const s = pStats(name);
      const pr = pronouns(name);

      // Skip if stuck
      if (ps.stuckTicks > 0) {
        ps.stuckTicks--;
        tickEvents.push({ type: 'stuck', player: name, text: `${name} is still stuck. ${ps.stuckTicks > 0 ? 'Still struggling.' : 'Finally free.'}` });
        continue;
      }
      if (ps.paralyzed) {
        ps.paralyzed = false;
        tickEvents.push({ type: 'recovering', player: name, text: `${name} shakes off the venom. Back in action.` });
        continue;
      }

      // Clear false trail flag
      if (ps.falseTrailVictim) {
        ps.falseTrailVictim = false;
        tickEvents.push({ type: 'track-fail', player: name, zone: ps.zone, text: `${name} follows the planted clue to a dead end. The trail was fabricated. A tick wasted.` });
        continue;
      }

      // Zone movement — awareness drives strategy
      if (ps.awareness >= 3 && ps.zone !== chefZone) {
        // Ambush players lock onto Chef's zone
        const zone = zoneById(ps.zone);
        if (zone.adj.includes(chefZone)) {
          ps.zone = chefZone;
        } else {
          ps.zone = pick(zone.adj);
        }
      } else if (ps.awareness === 2 && ps.zone !== chefZone && Math.random() < 0.65) {
        // Stalking players track toward Chef ~65% of the time
        const zone = zoneById(ps.zone);
        if (zone.adj.includes(chefZone)) {
          ps.zone = chefZone;
        } else {
          ps.zone = pick(zone.adj);
        }
      } else if (ps.awareness === 1 && ps.zone !== chefZone && Math.random() < 0.4) {
        // Spotted players drift toward Chef with 50% chance
        const zone = zoneById(ps.zone);
        if (zone.adj.includes(chefZone)) {
          ps.zone = chefZone;
        } else {
          ps.zone = pick(zone.adj);
        }
      } else if (ps.awareness < 1 && Math.random() < 0.3) {
        const zone = zoneById(ps.zone);
        ps.zone = pick(zone.adj);
      }

      // Track roll
      const zone = zoneById(ps.zone);
      let trackRoll = s.intuition * 0.30 + s.mental * 0.25 + s.strategic * 0.25 + s.endurance * 0.20 + noise(2.5);
      trackRoll += zone.trackMod;
      if (isNight) trackRoll -= 1;
      if (ps.snakeBonus) { trackRoll += 1; ps.snakeBonus = false; }
      if (ps.pactPartner && playerStates[ps.pactPartner]?.zone === ps.zone) trackRoll += 0.8;

      // Clue discovery → awareness tier advancement
      if (trackRoll >= 6.0) {
        ps.clues = Math.min(ps.clues + 1, 10);
        const oldTier = ps.awareness;
        if (ps.clues >= 7 && ps.awareness < 3) ps.awareness = 3;
        else if (ps.clues >= 5 && ps.awareness < 2) ps.awareness = 2;
        else if (ps.clues >= 3 && ps.awareness < 1) ps.awareness = 1;

        const clueText = pick(CLUE_TYPES);
        tickEvents.push({ type: 'clue', player: name, zone: ps.zone, text: pickFresh(TRACK_FOUND, 'track-found')(name, pr, clueText) });
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 3;

        // Tier-up narration
        if (ps.awareness > oldTier) {
          if (ps.awareness === 1) tickEvents.push({ type: 'tier-up', player: name, tier: 1, text: pickFresh(TIER_UP_SPOTTED, 'tier-spot')(name, pr) });
          else if (ps.awareness === 2) tickEvents.push({ type: 'tier-up', player: name, tier: 2, text: pickFresh(TIER_UP_STALKING, 'tier-stalk')(name, pr) });
          else if (ps.awareness === 3) tickEvents.push({ type: 'tier-up', player: name, tier: 3, text: pickFresh(TIER_UP_AMBUSH, 'tier-ambush')(name, pr) });
        }
      } else {
        tickEvents.push({ type: 'track-fail', player: name, zone: ps.zone, text: pickFresh(TRACK_FAIL, 'track-fail')(name, pr) });
      }

      // ── CHEF ENCOUNTER CHECK ──
      const inChefZone = ps.zone === chefZone;
      const adjToChef = !inChefZone && zoneById(ps.zone).adj.includes(chefZone);
      const canEncounter = ps.ammo > 0 && trackRoll >= 6.5 && (
        (ps.awareness >= 1 && inChefZone) ||
        (ps.awareness >= 2 && adjToChef && trackRoll >= 7.5) ||
        (ps.awareness >= 3 && adjToChef)
      );
      if (canEncounter) {
        if (adjToChef) ps.zone = chefZone;
        // Stat-driven shoot decision: should this player fire or keep stalking?
        const holdCheck = s.strategic * 0.4 + s.intuition * 0.3 + staminaPct * 3 + noise(2);
        const shouldHold = holdCheck >= 6 && ps.awareness < 3 && chefStamina > 25;

        if (shouldHold) {
          tickEvents.push({ type: 'hold-fire', player: name, text: `${name} spots Chef but holds fire. ${pr.Sub} needs a better angle. Smart — Chef is still too fresh.` });
          if (ps.awareness < 3) { ps.awareness = Math.min(ps.awareness + 1, 3); ps.clues++; }
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
        } else {
          // Check for hunt pact — betrayal or honor?
          let pactBetray = false;
          let pactPartnerName = ps.pactPartner;
          if (pactPartnerName && playerStates[pactPartnerName]?.zone === ps.zone && playerStates[pactPartnerName]?.ammo > 0) {
            const betrayRoll = s.strategic * 0.3 + (10 - s.loyalty) * 0.3 + noise(2);
            if (betrayRoll >= 6) {
              pactBetray = true;
              tickEvents.push({ type: 'pact-betrayal', player: name, target: pactPartnerName, text: pickFresh(PACT_BETRAYAL, 'pact-betray')(name, pactPartnerName) });
              addBond(name, pactPartnerName, -4);
              popDelta(name, -2);
              campEvents.push({ type: 'pactBetrayal', text: `${name} betrays ${pactPartnerName}'s hunt pact — takes the shot alone.`, players: [name, pactPartnerName], badgeText: 'Betrayed', badgeClass: 'badge-danger' });
              playerStates[pactPartnerName].pactPartner = null;
              ps.pactPartner = null;
            } else {
              tickEvents.push({ type: 'pact-honor', players: [name, pactPartnerName], text: pickFresh(PACT_HONOR, 'pact-honor')(name, pactPartnerName) });
              addBond(name, pactPartnerName, 2);
              campEvents.push({ type: 'pactHonored', text: `${name} honors the hunt pact with ${pactPartnerName} — shares the shot.`, players: [name, pactPartnerName], badgeText: 'Honored', badgeClass: 'badge-success' });
            }
          }

          tickEvents.push({ type: 'encounter', player: name, text: pickFresh(CHEF_ENCOUNTER, 'encounter')(name, pr) });

          // Fire tranq shots
          let hit = false;
          const tranqRolls = [];
          const shotsToFire = Math.min(ps.ammo, 2);
          for (let shot = 0; shot < shotsToFire && !hit; shot++) {
            let tranqRoll = s.physical * 0.30 + s.boldness * 0.25 + s.intuition * 0.25 + s.strategic * 0.20 + noise(2.5);
            if (!ps.hasSlingshot) tranqRoll -= 1.5;
            tranqRoll += TIER_HIT_BONUS[ps.awareness];

            // Showmance distraction bonus
            const showmance = gs.showmances?.find(sh => !sh.broken && (sh.p1 === name || sh.p2 === name));
            if (showmance) {
              const partner = showmance.p1 === name ? showmance.p2 : showmance.p1;
              if (playerStates[partner]?.zone === ps.zone) {
                tranqRoll += 1;
                _checkShowmanceChalMoment(name, partner, null, null, campKey, campEvents, ep);
              }
            }

            ps.ammo--;
            ps.ammoSpent++;
            tranqRolls.push(tranqRoll);
            chefStamina = Math.max(0, chefStamina - 6);

            const isLastDart = ps.ammo === 0;

            if (tranqRoll >= chefDodge + chefAlertBonus) {
              hit = true;
              if (isLastDart && shot === shotsToFire - 1) {
                tickEvents.push({ type: 'tranq-hit-last', player: name, text: pickFresh(LAST_DART_HIT, 'last-hit')(name, pr) });
                popDelta(name, 2);
              } else {
                tickEvents.push({ type: 'tranq-hit', player: name, text: pickFresh(TRANQ_HIT, 'tranq-hit')(name, pr) });
                popDelta(name, 1);
              }
              ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 5;
              immunityWinner = name;
              winTick = tick;
            } else {
              if (isLastDart) {
                tickEvents.push({ type: 'tranq-miss-last', player: name, text: pickFresh(LAST_DART_MISS, 'last-miss')(name, pr) });
              } else {
                tickEvents.push({ type: 'tranq-miss', player: name, text: pickFresh(TRANQ_MISS, 'tranq-miss')(name, pr) });
              }
              ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 1;
              chefAlertBonus += 1.5;
            }
          }

          encounterData.push({ player: name, tranqRolls, hit, tier: ps.awareness });

          // Chef flees if missed — costs stamina
          if (!hit) {
            const nonAdj = zoneIds.filter(z => z !== chefZone && !zoneById(chefZone).adj.includes(z));
            chefZone = pick(nonAdj.length ? nonAdj : zoneIds.filter(z => z !== chefZone));
            chefPath.push(chefZone);
            chefStamina = Math.max(0, chefStamina - 5);
            // Missed shot drops awareness by 1 tier
            ps.awareness = Math.max(0, ps.awareness - 1);
            for (const o of active) {
              if (playerStates[o].zone === ps.zone && o !== name) {
                playerStates[o].awareness = Math.max(0, playerStates[o].awareness - 1);
              }
            }
          }

          // Pact partner gets a shot too if honor was kept
          if (!pactBetray && pactPartnerName && !hit && playerStates[pactPartnerName]?.zone === ps.zone && playerStates[pactPartnerName]?.ammo > 0) {
            const pps = playerStates[pactPartnerName];
            const ps2 = pStats(pactPartnerName);
            const pr2 = pronouns(pactPartnerName);
            tickEvents.push({ type: 'encounter', player: pactPartnerName, text: `${pactPartnerName} steps up — the pact grants a shared shot.` });
            let pRoll = ps2.physical * 0.30 + ps2.boldness * 0.25 + ps2.intuition * 0.25 + ps2.strategic * 0.20 + noise(2.5);
            if (!pps.hasSlingshot) pRoll -= 1.5;
            pRoll += TIER_HIT_BONUS[pps.awareness];
            pps.ammo--;
            pps.ammoSpent++;
            chefStamina = Math.max(0, chefStamina - 6);
            if (pRoll >= chefDodge) {
              tickEvents.push({ type: 'tranq-hit', player: pactPartnerName, text: pickFresh(TRANQ_HIT, 'tranq-hit')(pactPartnerName, pr2) });
              popDelta(pactPartnerName, 1);
              ep.chalMemberScores[pactPartnerName] = (ep.chalMemberScores[pactPartnerName] || 0) + 5;
              immunityWinner = pactPartnerName;
              winTick = tick;
            } else {
              tickEvents.push({ type: 'tranq-miss', player: pactPartnerName, text: pickFresh(TRANQ_MISS, 'tranq-miss')(pactPartnerName, pr2) });
              pps.awareness = Math.max(0, pps.awareness - 1);
            }
            encounterData.push({ player: pactPartnerName, tranqRolls: [pRoll], hit: pRoll >= chefDodge, tier: pps.awareness });
          }
        }
      }
    }

    if (immunityWinner) {
      huntTicks.push({ tick, chefZone, chefDodge, chefStamina, isNight, playerStates: snapStates(playerStates, active), events: tickEvents, encounters: encounterData });
      break;
    }

    // ── CHEF COLLAPSE CHECK ──
    if (chefStamina <= 0) {
      const scores = active.map(n => ({ name: n, score: playerStates[n].awareness * 3 + playerStates[n].clues * 2 + playerStates[n].ammo })).sort((a, b) => b.score - a.score);
      immunityWinner = scores[0].name;
      winTick = tick;
      tickEvents.push({ type: 'chef-collapse', player: immunityWinner, text: pickFresh(CHEF_COLLAPSE, 'collapse')(immunityWinner) });
      popDelta(immunityWinner, 1);
      ep.chalMemberScores[immunityWinner] = (ep.chalMemberScores[immunityWinner] || 0) + 5;
      huntTicks.push({ tick, chefZone, chefDodge, chefStamina: 0, isNight, playerStates: snapStates(playerStates, active), events: tickEvents, encounters: encounterData });
      break;
    }

    // ── WILDLIFE HAZARDS (1 per tick, 70% chance) ──
    const hazardCandidates = active.filter(n => playerStates[n].stuckTicks === 0 && !playerStates[n].paralyzed);
    if (hazardCandidates.length > 0 && Math.random() < 0.7) {
      const target = pick(hazardCandidates);
      const ps = playerStates[target];
      const zone = zoneById(ps.zone);
      const s = pStats(target);
      const pr = pronouns(target);
      let hazardRoll, threshold, failText, winText;

      switch (zone.hazard) {
        case 'crocodile':
          hazardRoll = s.physical * 0.4 + s.boldness * 0.3 + noise(2); threshold = 6;
          failText = pickFresh(CROC_FAIL, 'croc-f')(target, pr);
          winText = pickFresh(CROC_WIN, 'croc-w')(target, pr);
          if (hazardRoll < threshold) { ps.ammo = Math.max(0, ps.ammo - 1); ps.stuckTicks = 1; }
          break;
        case 'snake':
          hazardRoll = s.intuition * 0.4 + s.temperament * 0.3 + noise(2); threshold = 5.5;
          failText = pickFresh(SNAKE_FAIL, 'snake-f')(target, pr);
          winText = pickFresh(SNAKE_WIN, 'snake-w')(target, pr);
          if (hazardRoll < threshold) { ps.paralyzed = true; } else { ps.snakeBonus = true; }
          break;
        case 'baboon':
          hazardRoll = s.social * 0.3 + s.temperament * 0.3 + noise(2); threshold = 5;
          failText = pickFresh(BABOON_FAIL, 'bab-f')(target, pr);
          winText = pickFresh(BABOON_WIN, 'bab-w')(target, pr);
          if (hazardRoll < threshold) { const loss = Math.min(ps.ammo, 1 + (Math.random() < 0.3 ? 1 : 0)); ps.ammo -= loss; } else { ps.clues = Math.min(ps.clues + 1, 10); }
          break;
        case 'rockslide':
          hazardRoll = s.endurance * 0.4 + s.physical * 0.3 + noise(2); threshold = 6;
          failText = pickFresh(ROCK_FAIL, 'rock-f')(target, pr);
          winText = pickFresh(ROCK_WIN, 'rock-w')(target, pr);
          if (hazardRoll < threshold) { ps.stuckTicks = 1; } else { ps.clues = Math.min(ps.clues + 1, 10); }
          break;
        case 'quicksand':
          hazardRoll = s.endurance * 0.3 + s.mental * 0.3 + noise(2); threshold = 5.5;
          failText = pickFresh(QUICK_FAIL, 'quick-f')(target, pr);
          winText = pickFresh(QUICK_WIN, 'quick-w')(target, pr);
          if (hazardRoll < threshold) { ps.stuckTicks = 2; } else { popDelta(target, 1); }
          break;
        case 'hippo':
          hazardRoll = s.boldness * 0.4 + s.physical * 0.3 + noise(2); threshold = 6.5;
          failText = pickFresh(HIPPO_FAIL, 'hippo-f')(target, pr);
          winText = pickFresh(HIPPO_WIN, 'hippo-w')(target, pr);
          if (hazardRoll < threshold) { const prevZone = zoneById(ps.zone).adj[0]; ps.zone = prevZone; ps.ammo = Math.max(0, ps.ammo - 1); }
          break;
      }
      const survived = hazardRoll >= threshold;
      if (survived) {
        ps.hazardsSurvived++;
        ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 2;
      } else {
        ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) - 1;
      }
      tickEvents.push({ type: survived ? 'hazard-win' : 'hazard-fail', player: target, hazard: zone.hazard, zone: ps.zone, text: survived ? winText : failText });

      if (!survived) {
        const othersInZone = active.filter(o => o !== target && playerStates[o].zone === ps.zone);
        if (othersInZone.length > 0 && Math.random() < 0.4) {
          tickEvents.push({ type: 'stampede', player: target, affected: othersInZone, text: `${target}'s panic startles everyone nearby. ${othersInZone.join(', ')} — tracking disrupted.` });
        }
      }

      const othersInSameZone = active.filter(o => o !== target && playerStates[o].zone === ps.zone);
      if (othersInSameZone.length > 0) {
        _challengeRomanceSpark(active, null, null, campKey, campEvents, ep);
      }
    }

    // ══════════════════════════════════════════════════════════
    // SOCIAL EVENTS (2-3 per tick)
    // ══════════════════════════════════════════════════════════
    const socialCount = 2 + (Math.random() < 0.5 ? 1 : 0);
    for (let sc = 0; sc < socialCount; sc++) {
      const shuffled = [...active].sort(() => Math.random() - 0.5);

      // ── HUNT PACT (new) ──
      for (let i = 0; i < shuffled.length - 1 && sc < socialCount; i++) {
        for (let j = i + 1; j < shuffled.length; j++) {
          const a = shuffled[i], b = shuffled[j];
          if (playerStates[a].pactPartner || playerStates[b].pactPartner) continue;
          if (playerStates[a].zone === playerStates[b].zone && getBond(a, b) >= 2 && Math.random() < 0.3) {
            playerStates[a].pactPartner = b;
            playerStates[b].pactPartner = a;
            const sharedTier = Math.max(playerStates[a].awareness, playerStates[b].awareness);
            playerStates[a].awareness = sharedTier;
            playerStates[b].awareness = sharedTier;
            addBond(a, b, 1);
            ep.chalMemberScores[a] = (ep.chalMemberScores[a] || 0) + 1;
            ep.chalMemberScores[b] = (ep.chalMemberScores[b] || 0) + 1;
            tickEvents.push({ type: 'hunt-pact', players: [a, b], text: pickFresh(HUNT_PACT, 'pact')(a, b) });
            campEvents.push({ type: 'huntPact', text: `${a} and ${b} form a hunt pact during the safari.`, players: [a, b], badgeText: 'Pact', badgeClass: 'badge-info' });
            sc++;
            break;
          }
        }
        if (sc >= socialCount) break;
      }

      // ── FALSE TRAIL (schemers only, new) ──
      for (const schemer of shuffled) {
        if (sc >= socialCount) break;
        if (!canScheme(schemer)) continue;
        const victims = active.filter(v => v !== schemer && playerStates[v].zone === playerStates[schemer].zone && !playerStates[v].falseTrailVictim);
        if (victims.length === 0) continue;
        if (Math.random() < 0.2) {
          const victim = pick(victims);
          const vs = pStats(victim);
          if (vs.intuition >= 7 && vs.intuition + noise(2) >= 8) {
            tickEvents.push({ type: 'false-trail-detected', player: victim, schemer, text: pickFresh(FALSE_TRAIL_DETECTED, 'ft-detect')(victim, schemer) });
            addBond(victim, schemer, -2);
            popDelta(schemer, -1);
            campEvents.push({ type: 'schemeCaught', text: `${victim} catches ${schemer} planting a false trail.`, players: [schemer, victim], badgeText: 'Caught', badgeClass: 'badge-danger' });
          } else {
            playerStates[victim].falseTrailVictim = true;
            tickEvents.push({ type: 'false-trail', player: schemer, target: victim, text: pickFresh(FALSE_TRAIL, 'false-trail')(schemer, pronouns(schemer), victim) });
            addBond(schemer, victim, -1);
            ep.chalMemberScores[schemer] = (ep.chalMemberScores[schemer] || 0) + 2;
            campEvents.push({ type: 'falseTrail', text: `${schemer} plants a false trail that tricks ${victim}.`, players: [schemer, victim], badgeText: 'Sabotage', badgeClass: 'badge-warning' });
          }
          sc++;
          break;
        }
      }

      // ── ZONE LURE (schemers only, new) ──
      for (const schemer of shuffled) {
        if (sc >= socialCount) break;
        if (!canScheme(schemer)) continue;
        const victims = active.filter(v => v !== schemer && playerStates[v].zone === playerStates[schemer].zone && playerStates[v].awareness >= 1);
        if (victims.length === 0) continue;
        if (Math.random() < 0.15) {
          const victim = pick(victims);
          const vs = pStats(victim);
          const resistRoll = vs.mental * 0.4 + vs.intuition * 0.3 + noise(2);
          const lureRoll = pStats(schemer).social * 0.4 + pStats(schemer).strategic * 0.3 + noise(2);
          if (resistRoll >= lureRoll) {
            tickEvents.push({ type: 'zone-lure-resisted', player: victim, schemer, text: pickFresh(ZONE_LURE_RESISTED, 'lure-resist')(schemer, victim) });
            addBond(victim, schemer, -1);
          } else {
            const wrongZone = pick(zoneIds.filter(z => z !== chefZone && z !== playerStates[victim].zone));
            playerStates[victim].zone = wrongZone;
            playerStates[victim].awareness = Math.max(0, playerStates[victim].awareness - 1);
            tickEvents.push({ type: 'zone-lure', player: schemer, target: victim, text: pickFresh(ZONE_LURE, 'zone-lure')(schemer, victim) });
            addBond(schemer, victim, -2);
            ep.chalMemberScores[schemer] = (ep.chalMemberScores[schemer] || 0) + 2;
            campEvents.push({ type: 'zoneLure', text: `${schemer} lures ${victim} to the wrong zone with false intel.`, players: [schemer, victim], badgeText: 'Lured', badgeClass: 'badge-warning' });
          }
          sc++;
          break;
        }
      }

      // ── DART TRADE (new) ──
      for (let i = 0; i < shuffled.length - 1 && sc < socialCount; i++) {
        for (let j = i + 1; j < shuffled.length; j++) {
          const a = shuffled[i], b = shuffled[j];
          if (playerStates[a].zone !== playerStates[b].zone) continue;
          if (getBond(a, b) < 1) continue;
          // A has darts but low awareness, B has awareness but low darts (or vice versa)
          let giver, receiver;
          if (playerStates[a].ammo >= 3 && playerStates[b].awareness >= 2 && playerStates[b].ammo <= 1) { giver = a; receiver = b; }
          else if (playerStates[b].ammo >= 3 && playerStates[a].awareness >= 2 && playerStates[a].ammo <= 1) { giver = b; receiver = a; }
          else continue;
          if (Math.random() < 0.35) {
            playerStates[giver].ammo--;
            playerStates[receiver].ammo++;
            playerStates[giver].awareness = Math.min(playerStates[giver].awareness + 1, 3);
            playerStates[giver].clues++;
            addBond(giver, receiver, 1);
            tickEvents.push({ type: 'dart-trade', players: [giver, receiver], text: pickFresh(DART_TRADE, 'dart-trade')(giver, receiver) });
            campEvents.push({ type: 'dartTrade', text: `${giver} trades a dart to ${receiver} for tracking intel.`, players: [giver, receiver], badgeText: 'Trade', badgeClass: 'badge-info' });
            sc++;
            break;
          }
        }
        if (sc >= socialCount) break;
      }

      // ── DESPERATE BEG (new) ──
      for (const beggar of shuffled) {
        if (sc >= socialCount) break;
        if (playerStates[beggar].ammo > 0) continue;
        const donors = active.filter(d => d !== beggar && playerStates[d].zone === playerStates[beggar].zone && playerStates[d].ammo >= 3);
        if (donors.length === 0) continue;
        if (Math.random() < 0.4) {
          const donor = pick(donors);
          const socialCheck = pStats(beggar).social * 0.4 + getBond(beggar, donor) * 0.3 + noise(2);
          if (socialCheck >= 5) {
            playerStates[donor].ammo--;
            playerStates[beggar].ammo++;
            addBond(beggar, donor, 2);
            tickEvents.push({ type: 'desperate-beg', player: beggar, donor, text: pickFresh(DESPERATE_BEG, 'beg')(beggar, donor) });
            campEvents.push({ type: 'mercyDart', text: `${donor} gives ${beggar} a mercy dart during the hunt.`, players: [beggar, donor], badgeText: 'Mercy', badgeClass: 'badge-success' });
          } else {
            addBond(beggar, donor, -1);
            popDelta(beggar, -1);
            tickEvents.push({ type: 'beg-rejected', player: beggar, donor, text: pickFresh(BEG_REJECTED, 'beg-reject')(beggar, donor) });
          }
          sc++;
          break;
        }
      }

      // ── PROTECTION RACKET (schemers only, new) ──
      for (const schemer of shuffled) {
        if (sc >= socialCount) break;
        if (!canScheme(schemer)) continue;
        const victims = active.filter(v => v !== schemer && playerStates[v].zone === playerStates[schemer].zone && playerStates[v].ammo >= 2 && !VILLAIN.has(arch(v)));
        if (victims.length === 0) continue;
        if (Math.random() < 0.15) {
          const victim = pick(victims);
          const vs = pStats(victim);
          if (vs.boldness >= 7) {
            tickEvents.push({ type: 'racket-refused', player: victim, schemer, text: pickFresh(RACKET_REFUSED, 'racket-refuse')(schemer, victim) });
            addBond(victim, schemer, -2);
            popDelta(victim, 1);
            // Schemer follows through or backs down
            if (pStats(schemer).boldness >= 7 && Math.random() < 0.5) {
              tickEvents.push({ type: 'racket-stampede', player: schemer, text: pickFresh(RACKET_STAMPEDE, 'racket-stamp')(schemer) });
              for (const o of active) {
                if (playerStates[o].zone === playerStates[schemer].zone) {
                  playerStates[o].awareness = Math.max(0, playerStates[o].awareness - 1);
                }
              }
              popDelta(schemer, -2);
              campEvents.push({ type: 'racketStampede', text: `${schemer} stampedes the zone after being refused a dart.`, players: [schemer, victim], badgeText: 'Stampede', badgeClass: 'badge-danger' });
            }
          } else {
            playerStates[victim].ammo--;
            playerStates[schemer].ammo++;
            addBond(victim, schemer, -3);
            popDelta(schemer, -1);
            tickEvents.push({ type: 'protection-racket', player: schemer, target: victim, text: pickFresh(PROTECTION_RACKET, 'racket')(schemer, victim) });
            campEvents.push({ type: 'protectionRacket', text: `${schemer} extorts a dart from ${victim} with threats.`, players: [schemer, victim], badgeText: 'Extortion', badgeClass: 'badge-danger' });
            if (!gs._safariHeat) gs._safariHeat = {};
            gs._safariHeat[schemer] = { amount: 4, expiresEp: (gs.episodeHistory?.length || 0) + 3 };
          }
          sc++;
          break;
        }
      }

      // ── AMMO THEFT (kept from original) ──
      for (const thief of shuffled) {
        if (sc >= socialCount) break;
        if (!canScheme(thief)) continue;
        const victims = active.filter(v => v !== thief && playerStates[v].zone === playerStates[thief].zone && playerStates[v].ammo > 0);
        if (victims.length === 0) continue;
        if (Math.random() < 0.2) {
          const victim = pick(victims);
          const vs = pStats(victim);
          if (vs.intuition >= 7) {
            tickEvents.push({ type: 'theft-caught', player: thief, target: victim, text: pickFresh(AMMO_CAUGHT, 'ammo-caught')(thief, victim) });
            popDelta(thief, -2);
            addBond(thief, victim, -3);
            ep.chalMemberScores[thief] = (ep.chalMemberScores[thief] || 0) - 2;
            ep.chalMemberScores[victim] = (ep.chalMemberScores[victim] || 0) + 1;
            campEvents.push({ type: 'schemeExposed', text: `${victim} catches ${thief} stealing tranq darts during the safari hunt.`, players: [thief, victim], badgeText: 'Caught', badgeClass: 'badge-danger' });
          } else {
            const stolen = Math.min(playerStates[victim].ammo, 1 + (Math.random() < 0.3 ? 1 : 0));
            playerStates[victim].ammo -= stolen;
            playerStates[thief].ammo += stolen;
            addBond(thief, victim, -2);
            ep.chalMemberScores[thief] = (ep.chalMemberScores[thief] || 0) + 2;
            tickEvents.push({ type: 'theft', player: thief, target: victim, text: pickFresh(AMMO_THEFT, 'ammo-theft')(thief, victim) });
            campEvents.push({ type: 'ammoTheft', text: `${thief} steals tranq darts from ${victim} during the hunt.`, players: [thief, victim], badgeText: 'Theft', badgeClass: 'badge-warning' });
            if (!gs._safariHeat) gs._safariHeat = {};
            gs._safariHeat[thief] = { amount: 3, expiresEp: (gs.episodeHistory?.length || 0) + 3 };
          }
          sc++;
          break;
        }
      }

      // ── RIVALRY SHOWDOWN (kept) ──
      for (let i = 0; i < shuffled.length - 1 && sc < socialCount; i++) {
        for (let j = i + 1; j < shuffled.length; j++) {
          const a = shuffled[i], b = shuffled[j];
          if (playerStates[a].zone === playerStates[b].zone && getBond(a, b) <= -3 && Math.random() < 0.4) {
            const as = pStats(a), bs = pStats(b);
            const aRoll = as.physical + as.boldness + noise(2.5);
            const bRoll = bs.physical + bs.boldness + noise(2.5);
            const winner = aRoll >= bRoll ? a : b;
            const loser = winner === a ? b : a;
            playerStates[winner].clues = Math.min(playerStates[winner].clues + 1, 10);
            if (playerStates[winner].awareness < 3) playerStates[winner].awareness++;
            playerStates[loser].stuckTicks = 1;
            addBond(a, b, -1);
            popDelta(winner, 1);
            ep.chalMemberScores[winner] = (ep.chalMemberScores[winner] || 0) + 2;
            ep.chalMemberScores[loser] = (ep.chalMemberScores[loser] || 0) - 1;
            tickEvents.push({ type: 'rivalry', players: [a, b], winner, text: pickFresh(RIVALRY_SHOW, 'rivalry')(a, b, winner) });
            campEvents.push({ type: 'rivalryShowdown', text: `${a} and ${b} clash during the safari hunt. ${winner} comes out on top.`, players: [a, b], badgeText: 'Clash', badgeClass: 'badge-danger' });
            sc++;
            break;
          }
        }
      }

      // ── QUICKSAND RESCUE (kept) ──
      for (const rescuer of shuffled) {
        if (sc >= socialCount) break;
        const stuckInZone = active.filter(v => v !== rescuer && playerStates[v].zone === playerStates[rescuer].zone && playerStates[v].stuckTicks >= 2);
        if (stuckInZone.length > 0 && Math.random() < 0.6) {
          const victim = pick(stuckInZone);
          playerStates[victim].stuckTicks = 0;
          addBond(rescuer, victim, 3);
          popDelta(rescuer, 1);
          popDelta(victim, 1);
          ep.chalMemberScores[rescuer] = (ep.chalMemberScores[rescuer] || 0) + 2;
          tickEvents.push({ type: 'rescue', player: rescuer, target: victim, text: pickFresh(QUICKSAND_RESCUE, 'rescue')(rescuer, victim) });
          _checkShowmanceChalMoment(rescuer, victim, null, null, campKey, campEvents, ep);
          campEvents.push({ type: 'heroicRescue', text: `${rescuer} pulls ${victim} from quicksand during the safari hunt.`, players: [rescuer, victim], badgeText: 'Rescue', badgeClass: 'badge-success' });
          sc++;
          break;
        }
      }

      // ── CHEF SIGHTING (kept, adjusted for awareness) ──
      if (tick >= 3 && Math.random() < 0.15 && sc < socialCount) {
        const playersInZone = active.filter(n => playerStates[n].zone === chefZone);
        for (const n of playersInZone) {
          playerStates[n].clues = Math.min(playerStates[n].clues + 1, 6);
          if (playerStates[n].awareness < 2) playerStates[n].awareness++;
        }
        tickEvents.push({ type: 'chef-sighting', zone: chefZone, text: pickFresh(CHEF_SIGHTING, 'sighting')() });
        sc++;
      }

      // ── PREDATOR STARE / SHARE (kept, adjusted for awareness) ──
      for (let i = 0; i < shuffled.length - 1 && sc < socialCount; i++) {
        for (let j = i + 1; j < shuffled.length; j++) {
          const a = shuffled[i], b = shuffled[j];
          if (playerStates[a].zone !== playerStates[b].zone) continue;
          const dominant = playerStates[a].awareness >= 2 && playerStates[b].awareness === 0 ? a : playerStates[b].awareness >= 2 && playerStates[a].awareness === 0 ? b : null;
          if (!dominant) continue;
          const weak = dominant === a ? b : a;
          if (Math.random() < 0.3) {
            if (NICE.has(arch(dominant))) {
              if (playerStates[weak].awareness < 1) playerStates[weak].awareness = 1;
              playerStates[weak].clues = Math.min(playerStates[weak].clues + 1, 6);
              addBond(dominant, weak, 2);
              tickEvents.push({ type: 'share-clue', player: dominant, target: weak, text: `${dominant} shares a clue with ${weak}. "You looked lost. Here." Bond strengthened.` });
            } else {
              addBond(dominant, weak, -1);
              popDelta(dominant, 0.5);
              tickEvents.push({ type: 'intimidate', player: dominant, target: weak, text: `${dominant} stares ${weak} down. "This is MY hunt." ${weak} backs off.` });
            }
            sc++;
            break;
          }
        }
      }

      // ── TRACKER'S INSTINCT (pity, adjusted for awareness) ──
      if (tick >= 4) {
        for (const name of shuffled) {
          if (sc >= socialCount) break;
          if (playerStates[name].awareness === 0 && playerStates[name].clues === 0 && pStats(name).intuition >= 7) {
            playerStates[name].clues = 1;
            if (playerStates[name].awareness < 1) playerStates[name].awareness = 1;
            tickEvents.push({ type: 'instinct', player: name, text: `Something in the wind. A feeling. ${name}'s instinct kicks in. A clue emerges from nothing.` });
            sc++;
          }
        }
      }
    }

    // ── STEAL THE KILL CHECK (kept) ──
    if (!immunityWinner) {
      const encountersThisTick = encounterData.filter(e => !e.hit);
      if (encountersThisTick.length >= 2) {
        const [e1, e2] = encountersThisTick;
        tickEvents.push({ type: 'steal-kill', players: [e1.player, e2.player], text: pickFresh(STEAL_KILL, 'steal-kill')(e1.player, e2.player) });
        addBond(e1.player, e2.player, -2);
      }
    }

    // Attenborough flavor
    if (Math.random() < 0.4) {
      tickEvents.push({ type: 'flavor', text: pickFresh(ATTENBOROUGH, 'atten') });
    }

    huntTicks.push({ tick, chefZone, chefDodge, chefStamina, isNight, playerStates: snapStates(playerStates, active), events: tickEvents, encounters: encounterData });
  }

  // Tiebreaker if no winner (shouldn't happen with collapse, but safety net)
  if (!immunityWinner) {
    const scores = active.map(n => ({
      name: n,
      score: playerStates[n].awareness * 3 + playerStates[n].clues * 2 + playerStates[n].ammoSpent + playerStates[n].hazardsSurvived,
    })).sort((a, b) => b.score - a.score);
    immunityWinner = scores[0].name;
    winTick = huntTicks.length;
  }

  // Build standings
  const standings = active.map(n => ({
    name: n,
    clues: playerStates[n].clues,
    awareness: playerStates[n].awareness,
    ammoSpent: playerStates[n].ammoSpent,
    ammoRemaining: playerStates[n].ammo,
    hazardsSurvived: playerStates[n].hazardsSurvived,
    pactPartner: playerStates[n].pactPartner,
    finalScore: playerStates[n].awareness * 3 + playerStates[n].clues * 2 + playerStates[n].ammoSpent + playerStates[n].hazardsSurvived,
  })).sort((a, b) => b.finalScore - a.finalScore);

  return { huntTicks, immunityWinner, winTick, standings, chefPath, zones: ZONES };
}

function snapStates(states, active) {
  return active.map(n => ({
    name: n,
    zone: states[n].zone,
    clues: states[n].clues,
    awareness: states[n].awareness,
    ammo: states[n].ammo,
    stuckTicks: states[n].stuckTicks,
    hazardsSurvived: states[n].hazardsSurvived,
    pactPartner: states[n].pactPartner,
  }));
}

// ══════════════════════════════════════════════════════════════
// MAIN SIMULATE
// ══════════════════════════════════════════════════════════════

export function simulateAfricanLyingSafari(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  const campEvents = ep.campEvents[campKey].post;
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  for (const n of active) ep.chalMemberScores[n] = 0;

  // Phase 1
  const sockerResults = simulateSockerToMe(active, ep, campKey, campEvents);

  // Phase 2
  const gourdResults = simulateGourdSmash(active, ep, campKey, campEvents, sockerResults);

  // Phase 3
  const huntData = simulateHunt(active, ep, campKey, campEvents, gourdResults);

  // Immunity winner bonus
  const maxOther = Math.max(...active.filter(n => n !== huntData.immunityWinner).map(n => ep.chalMemberScores[n] || 0));
  ep.chalMemberScores[huntData.immunityWinner] = maxOther + active.length + 5;

  // Set episode data
  ep.immunityWinner = huntData.immunityWinner;
  ep.tribalPlayers = active;
  ep.challengeData = {
    sockerResults,
    gourdResults,
    huntTicks: huntData.huntTicks,
    immunityWinner: huntData.immunityWinner,
    winnerText: huntData.huntTicks.some(t => t.events?.some(e => e.type === 'chef-collapse'))
      ? `Chef collapses from exhaustion. ${huntData.immunityWinner} claims the catch.`
      : `${huntData.immunityWinner} tranquilizes Chef on the golden savanna.`,
    huntWinTick: huntData.winTick,
    standings: huntData.standings,
    zones: huntData.zones,
    chefPath: huntData.chefPath,
  };
  ep.isAfricanLyingSafari = true;
  ep.challengeType = 'african-lying-safari';
  ep.challengeLabel = 'African Lying Safari';
  ep.challengeCategory = 'hunt';

  // Placements
  ep.chalPlacements = huntData.standings.map(s => s.name);
  updateChalRecord(ep);
}

// ══════════════════════════════════════════════════════════════
// VP STATE
// ══════════════════════════════════════════════════════════════
const _tvState = {};

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`als-step-${suffix}-${i}`);
    if (el) el.classList.add('visible');
  }
  const counter = document.getElementById(`als-counter-${suffix}`);
  if (counter) counter.textContent = `${upToIdx + 1} / ${total}`;
  const controls = document.getElementById(`als-controls-${suffix}`);
  if (controls && upToIdx >= total - 1) {
    controls.querySelectorAll('button').forEach(b => b.style.opacity = '0.3');
  }
}

export function safariRevealNext(screenKey, totalSteps) {
  if (!_tvState[screenKey]) _tvState[screenKey] = { idx: -1 };
  const st = _tvState[screenKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  _reapplyVisibility(screenKey, st.idx, totalSteps);
  const el = document.getElementById(`als-step-${screenKey}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _updateSidebar(screenKey);
}

export function safariRevealAll(screenKey, totalSteps) {
  if (!_tvState[screenKey]) _tvState[screenKey] = { idx: -1 };
  _tvState[screenKey].idx = totalSteps - 1;
  _reapplyVisibility(screenKey, totalSteps - 1, totalSteps);
  _updateSidebar(screenKey);
}

// Gauntlet kick-by-kick internal reveal system
const _kickState = {};
function _kickStateKey(screenKey, ri) { return `${screenKey}-${ri}`; }

function _alsKickNext(screenKey, ri, totalKicks) {
  const sk = _kickStateKey(screenKey, ri);
  if (!_kickState[sk]) _kickState[sk] = { idx: -1 };
  const st = _kickState[sk];
  if (st.idx >= totalKicks - 1) return;
  st.idx++;
  _alsKickApply(screenKey, ri, st.idx, totalKicks);
  const el = document.getElementById(`als-kick-${screenKey}-${ri}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function _alsKickAll(screenKey, ri, totalKicks) {
  const sk = _kickStateKey(screenKey, ri);
  if (!_kickState[sk]) _kickState[sk] = { idx: -1 };
  _kickState[sk].idx = totalKicks - 1;
  _alsKickApply(screenKey, ri, totalKicks - 1, totalKicks);
}

function _alsKickApply(screenKey, ri, upToIdx, total) {
  let hitCount = 0;
  let savedCount = 0;
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`als-kick-${screenKey}-${ri}-${i}`);
    if (el) {
      el.classList.add('visible');
      hitCount += parseInt(el.dataset.hits || '0');
      savedCount += parseInt(el.dataset.saves || '0');
    }
  }
  const counter = document.getElementById(`als-kick-counter-${screenKey}-${ri}`);
  if (counter) counter.textContent = `${upToIdx + 1} / ${total}`;
  const hitsBadge = document.getElementById(`als-kick-hits-${screenKey}-${ri}`);
  if (hitsBadge) {
    hitsBadge.textContent = `HITS: ${hitCount}`;
    hitsBadge.className = hitCount === 0 ? 'als-badge als-b-encounter' : hitCount >= 3 ? 'als-badge als-b-hazard' : 'als-badge als-b-gather';
  }
  // Update plum strip live
  const strip = document.getElementById(`als-plum-strip-${screenKey}-${ri}`);
  if (strip) {
    const mxP = parseInt(strip.dataset.max) || 6;
    const finalPlums = parseInt(strip.dataset.plums) || 0;
    const revealedPlums = upToIdx >= total - 1 ? finalPlums : Math.max(1, mxP - hitCount + savedCount);
    for (let i = 0; i < mxP; i++) {
      const dot = document.getElementById(`als-plum-${screenKey}-${ri}-${i}`);
      if (dot) {
        if (i < revealedPlums) dot.classList.add('full');
        else dot.classList.remove('full');
      }
    }
  }
  // Dim buttons when done
  if (upToIdx >= total - 1) {
    const card = document.getElementById(`als-kick-${screenKey}-${ri}-0`)?.closest('.als-gauntlet-card');
    if (card) card.querySelectorAll('.als-kick-controls button').forEach(b => b.style.opacity = '0.3');
  }
}

window._alsKickNext = _alsKickNext;
window._alsKickAll = _alsKickAll;

function _updateSidebar(screenKey) {
  const sideEl = document.getElementById('als-sidebar-inner');
  if (!sideEl) return;
  try {
    const epNum = window.vpEpNum;
    const epData = gs.episodeHistory?.[epNum - 1];
    if (!epData) return;
    if (!epData.challengeData && epData.africanLyingSafari) epData.challengeData = epData.africanLyingSafari;
    if (!epData.challengeData) return;
    sideEl.innerHTML = _buildSidebarContent(epData, screenKey);
  } catch (e) { /* sidebar update failed silently */ }
}

// ══════════════════════════════════════════════════════════════
// VP ICON SYSTEM
// ══════════════════════════════════════════════════════════════

function _icon(type) {
  const icons = {
    binoculars: '<span class="als-icon als-icon-bino"></span>',
    crosshair: '<span class="als-icon als-icon-xhair"></span>',
    dart: '<span class="als-icon als-icon-dart"></span>',
    paw: '<span class="als-icon als-icon-paw"></span>',
    flame: '<span class="als-icon als-icon-flame"></span>',
    soccer: '<span class="als-icon als-icon-soccer"></span>',
    gourd: '<span class="als-icon als-icon-gourd"></span>',
    slingshot: '<span class="als-icon als-icon-sling"></span>',
    snake: '<span class="als-icon als-icon-snake"></span>',
    croc: '<span class="als-icon als-icon-croc"></span>',
    skull: '<span class="als-icon als-icon-skull"></span>',
    star: '<span class="als-icon als-icon-star"></span>',
    shield: '<span class="als-icon als-icon-shield"></span>',
    clue: '<span class="als-icon als-icon-clue"></span>',
  };
  return icons[type] || '';
}

function _av(name, size = '') {
  const sl = slug(name);
  return `<span class="als-av ${size}" data-player="${sl}"><img src="assets/avatars/${sl}.png" alt="${name}" onerror="this.outerHTML='${name.split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2)}'"></span>`;
}

function _chefAv(size = '') {
  return `<span class="als-av als-chef-av ${size}"><img src="assets/avatars/chef.png" alt="Chef Hatchet"></span>`;
}

function _evAvatars(ev) {
  const avs = [];
  if (ev.players && ev.players.length) {
    for (const p of ev.players) avs.push(_av(p, 'sm'));
  } else if (ev.player) {
    avs.push(_av(ev.player, 'sm'));
  }
  if (ev.target && (!ev.players || !ev.players.includes(ev.target)) && ev.target !== ev.player) avs.push(_av(ev.target, 'sm'));
  if (ev.schemer && ev.schemer !== ev.player && (!ev.players || !ev.players.includes(ev.schemer))) avs.push(_av(ev.schemer, 'sm'));
  if (ev.donor && ev.donor !== ev.player && (!ev.players || !ev.players.includes(ev.donor))) avs.push(_av(ev.donor, 'sm'));
  if (ev.affected && ev.affected.length) {
    for (const a of ev.affected) if (a !== ev.player) avs.push(_av(a, 'sm'));
  }
  if (ev.type.startsWith('chef-') || ev.type === 'encounter' || ev.type.startsWith('tranq')) avs.push(_chefAv('sm'));
  return avs.join('');
}

// ══════════════════════════════════════════════════════════════
// VP SHELL + CSS
// ══════════════════════════════════════════════════════════════

function _shell(content, ep, phaseCls = '') {
  return `<div class="als-shell ${phaseCls}" style="max-width:1240px;margin:0 auto;position:relative;">
<style>
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Staatliches&family=Special+Elite&family=JetBrains+Mono:wght@400;700&display=swap');
:root{
  --als-night:#0d0805;--als-ember:#2d1810;--als-clay:#3d2418;--als-rust:#7a3018;
  --als-terra:#c44a1c;--als-flame:#e36218;--als-gold:#f4a72a;--als-sun:#fbd24a;
  --als-dust:#e6c489;--als-bone:#f0e0c2;--als-acacia:#0a0604;
  --als-tranq:#5ac4d4;--als-tranq-deep:#1d6878;--als-blood:#a02828;
  --als-poison:#7ed957;--als-bruise:#6a4080;--als-earth:#8B6B4A;
}
/* ═══ ATMOSPHERE ═══ */
.als-shell{font-family:'Special Elite','Georgia',cursive;font-size:14px;line-height:1.6;color:var(--als-bone);position:relative;z-index:10;padding-top:40px;}
.als-shell *{box-sizing:border-box;}
.als-atmo{position:fixed;top:46px;left:172px;right:0;bottom:0;z-index:-1;pointer-events:none;
  background:linear-gradient(180deg,#0a0408 0%,#3d1a18 55%,#c44a1c 100%);}
.phase-night .als-atmo{background:linear-gradient(180deg,#0a0c1a 0%,#1a1e35 30%,#2A2D45 60%,#1a1e35 85%,#0a0c1a 100%);}
.phase-golden .als-atmo{background:linear-gradient(180deg,#0a0408 0%,#3d1a18 55%,#c44a1c 100%);}

/* Scanlines */
.als-scanlines{position:fixed;top:46px;left:172px;right:0;bottom:0;z-index:98;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px);
  mix-blend-mode:multiply;}

/* Vignette */
.als-vignette{position:fixed;top:46px;left:172px;right:0;bottom:0;z-index:97;pointer-events:none;
  background:radial-gradient(ellipse 70% 65% at 50% 50%,transparent 50%,rgba(13,8,5,0.55) 100%);}

/* Dust particles */
.als-dust{position:fixed;top:46px;left:172px;right:0;bottom:0;z-index:96;pointer-events:none;overflow:hidden;}
.als-mote{position:absolute;width:2px;height:2px;border-radius:50%;background:var(--als-dust);opacity:0;
  animation:als-drift linear infinite;}
@keyframes als-drift{0%{transform:translate(0,0);opacity:0;}10%{opacity:.5;}90%{opacity:.3;}100%{transform:translate(100vw,-20vh);opacity:0;}}

/* Heat shimmer */
.als-shimmer{position:fixed;left:172px;right:0;bottom:0;height:25vh;z-index:95;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent 0px,rgba(244,167,42,0.03) 1px,transparent 3px);
  animation:als-heat 4s ease-in-out infinite;}
@keyframes als-heat{0%,100%{transform:translateY(0) scaleY(1);}50%{transform:translateY(2px) scaleY(1.02);}}
.phase-night .als-shimmer{display:none;}

/* Acacia silhouettes */
.als-horizon{position:fixed;left:172px;right:0;bottom:0;height:20vh;z-index:0;pointer-events:none;opacity:0.5;}
.als-tree{position:absolute;bottom:0;}
.als-tree .trunk{width:5px;height:100px;background:#0a0604;margin:0 auto;}
.als-tree .canopy{width:120px;height:24px;background:#0a0604;border-radius:50%;position:relative;top:4px;left:50%;transform:translateX(-50%);}
.als-tree .canopy::before{content:'';position:absolute;top:-10px;left:15%;width:70%;height:18px;background:#0a0604;border-radius:50%;}
.als-tree.t1{left:5%;transform:scale(.6);}.als-tree.t2{left:20%;transform:scale(.9);}
.als-tree.t3{left:45%;transform:scale(.5);opacity:.8;}.als-tree.t4{left:78%;transform:scale(.85);}
.als-tree.t5{left:92%;transform:scale(.55);}

/* Grass foreground */
.als-grass{position:fixed;left:172px;right:0;bottom:0;height:8vh;z-index:0;pointer-events:none;
  background:linear-gradient(0deg,rgba(10,6,4,0.9) 0%,transparent 100%);}

/* ═══ BROADCAST BAR ═══ */
.als-bar{position:fixed;top:46px;left:172px;right:0;height:40px;z-index:50;
  background:linear-gradient(90deg,rgba(13,8,5,0.96),rgba(45,24,16,0.96));
  border-bottom:2px solid var(--als-terra);display:flex;align-items:center;justify-content:space-between;
  padding:0 18px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1.5px;
  backdrop-filter:blur(8px);box-shadow:0 2px 12px rgba(0,0,0,0.4);}
.als-live{display:flex;align-items:center;gap:8px;color:var(--als-blood);font-weight:700;}
.als-live-dot{width:9px;height:9px;background:var(--als-blood);border-radius:50%;box-shadow:0 0 12px var(--als-blood);
  animation:als-blink 1.2s ease infinite;}
@keyframes als-blink{0%,100%{opacity:1;}50%{opacity:.15;}}
.als-ticker{flex:1;overflow:hidden;margin:0 24px;position:relative;height:18px;}
.als-ticker-inner{position:absolute;white-space:nowrap;color:var(--als-gold);animation:als-scroll 40s linear infinite;}
@keyframes als-scroll{0%{transform:translateX(100%);}100%{transform:translateX(-100%);}}
.als-channel{color:var(--als-dust);font-weight:700;letter-spacing:2px;}

/* ═══ PHASE TABS ═══ */
.als-phases{position:sticky;top:86px;z-index:49;background:rgba(13,8,5,0.93);
  border-bottom:1px solid rgba(244,167,42,0.18);display:flex;justify-content:center;gap:0;padding:0 16px;backdrop-filter:blur(8px);}
.als-phase-tab{padding:10px 18px;font-family:'Staatliches',sans-serif;font-size:14px;letter-spacing:2.5px;
  color:rgba(240,224,194,0.42);text-transform:uppercase;border-bottom:2px solid transparent;cursor:pointer;position:relative;}
.als-phase-tab .tab-num{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--als-rust);margin-right:6px;letter-spacing:1px;}
.als-phase-tab.active{color:var(--als-sun);border-bottom-color:var(--als-terra);}
.als-phase-tab.active .tab-num{color:var(--als-terra);}
.als-phase-tab.done{color:var(--als-poison);}

/* ═══ CARDS ═══ */
.als-card{position:relative;margin:14px 0;padding:18px 20px;border-radius:5px;
  background:linear-gradient(135deg,rgba(45,24,16,0.45),rgba(13,8,5,0.3));
  border:1px solid rgba(244,167,42,0.12);
  box-shadow:inset 0 0 30px rgba(13,8,5,0.3),0 2px 8px rgba(0,0,0,0.3);
  opacity:0;transition:opacity 0.4s ease;position:relative;}
.als-card.visible{opacity:1;animation:als-card-in 0.55s cubic-bezier(.16,1,.3,1) forwards;}
@keyframes als-card-in{
  0%{opacity:0;transform:translateX(-14px);filter:blur(2px) brightness(1.3);}
  15%{opacity:0.6;transform:translateX(2px) skewX(-1deg);filter:blur(0) brightness(1.1);}
  30%{opacity:0.8;transform:translateX(-1px) skewX(0.5deg);filter:none;}
  100%{opacity:1;transform:none;filter:none;}}
.als-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--als-terra);border-radius:2px 0 0 2px;}
.als-card::after{content:'';position:absolute;inset:0;pointer-events:none;border-radius:5px;
  background:radial-gradient(circle at 85% 15%,rgba(196,74,28,0.08) 0%,transparent 40%),
    radial-gradient(circle at 15% 80%,rgba(230,196,137,0.05) 0%,transparent 35%);mix-blend-mode:overlay;}
.als-card[data-type="hazard"]::before{background:var(--als-blood);}
.als-card[data-type="social"]::before{background:var(--als-bruise);background-image:repeating-linear-gradient(0deg,var(--als-bruise) 0,var(--als-bruise) 6px,transparent 6px,transparent 10px);}
.als-card[data-type="encounter"]::before{background:var(--als-flame);box-shadow:0 0 8px var(--als-flame);}
.als-card[data-type="host"]{background:linear-gradient(135deg,rgba(244,167,42,0.08),rgba(13,8,5,0.3));}
.als-card[data-type="host"]::before{background:var(--als-gold);}
.als-card[data-type="host"]::after{
  background:radial-gradient(circle at 82% 20%,rgba(196,74,28,0.12) 0%,rgba(196,74,28,0.04) 25%,transparent 45%),
    radial-gradient(circle at 78% 25%,rgba(160,100,40,0.08) 0%,transparent 30%) !important;}
.als-card[data-type="flavor"]{background:transparent !important;border:none !important;box-shadow:none !important;
  padding:6px 14px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.5px;
  color:rgba(244,167,42,0.35);font-style:italic;border-left:2px solid rgba(244,167,42,0.1) !important;}
.als-card[data-type="flavor"]::before{display:none;}
.als-card[data-type="flavor"]::after{display:none;}
.als-card[data-type="flavor"] .als-freq{color:rgba(160,40,40,0.5);font-weight:700;font-style:normal;margin-right:6px;}

.als-card-hdr{display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;}
.als-card-title{font-family:'Staatliches',sans-serif;font-size:16px;letter-spacing:2px;color:var(--als-bone);text-transform:uppercase;}
.als-card-time{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--als-rust);letter-spacing:1px;}
.als-badge{margin-left:auto;padding:3px 9px;border-radius:2px;font-family:'JetBrains Mono',monospace;
  font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:1px solid;}
.als-b-phase{color:var(--als-gold);border-color:rgba(244,167,42,0.4);background:rgba(244,167,42,0.06);}
.als-b-gather{color:var(--als-flame);border-color:rgba(227,98,24,0.4);background:rgba(227,98,24,0.06);}
.als-b-smash{color:var(--als-sun);border-color:rgba(251,210,74,0.4);background:rgba(251,210,74,0.06);}
.als-b-hunt{color:var(--als-tranq);border-color:rgba(90,196,212,0.4);background:rgba(90,196,212,0.06);}
.als-b-hazard{color:var(--als-blood);border-color:rgba(160,40,40,0.4);background:rgba(160,40,40,0.06);}
.als-b-social{color:var(--als-bruise);border-color:rgba(106,64,128,0.5);background:rgba(106,64,128,0.08);}
.als-b-encounter{color:var(--als-flame);border-color:rgba(227,98,24,0.5);background:rgba(227,98,24,0.08);}
.als-b-win{color:var(--als-gold);border-color:rgba(244,167,42,0.5);background:rgba(244,167,42,0.1);}
.als-b-host{color:var(--als-gold);border-color:rgba(244,167,42,0.4);background:rgba(244,167,42,0.06);}
.als-b-ghoul{color:var(--als-poison);border-color:rgba(126,217,87,0.4);background:rgba(126,217,87,0.06);}

.als-card-body{font-size:13.5px;line-height:1.65;color:rgba(240,224,194,0.82);}
.als-card-body em{color:var(--als-gold);font-style:normal;font-weight:600;}
.als-card-body strong{color:var(--als-bone);font-weight:700;}
.als-card-meta{margin-top:10px;padding-top:8px;border-top:1px dashed rgba(244,167,42,0.12);
  display:flex;gap:14px;flex-wrap:wrap;font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(230,196,137,0.55);}
.als-card-meta .pos{color:var(--als-poison);}.als-card-meta .neg{color:var(--als-blood);}.als-card-meta .neu{color:var(--als-tranq);}

/* ═══ SUMMARY BOARD ═══ */
.als-summary-board{display:flex;flex-direction:column;gap:4px;margin-top:8px;}
.als-summary-row{display:flex;align-items:center;gap:10px;padding:7px 12px;border-radius:6px;
  background:rgba(13,8,5,0.5);border:1px solid rgba(244,167,42,0.08);font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--als-bone);}
.als-summary-row-top{background:rgba(244,167,42,0.12);border-color:rgba(244,167,42,0.25);}
.als-summary-row-zero{opacity:.55;}
.als-summary-rank{font-family:'Anton',sans-serif;font-size:14px;color:var(--als-terra);min-width:28px;}
.als-summary-name{flex:1;font-family:'Bitter',serif;font-size:12px;color:var(--als-bone);}
.als-summary-stat{color:rgba(230,196,137,0.6);font-size:10px;display:flex;align-items:center;gap:3px;}

/* ═══ AVATARS ═══ */
.als-av{width:30px;height:30px;border-radius:50%;background:var(--als-terra);overflow:hidden;
  display:inline-flex;align-items:center;justify-content:center;
  font-family:'Anton',sans-serif;font-size:13px;color:var(--als-night);
  border:2px solid rgba(13,8,5,0.6);flex-shrink:0;letter-spacing:.5px;}
.als-av img{width:100%;height:100%;object-fit:contain;border-radius:50%;}
.als-av.lg{width:44px;height:44px;font-size:18px;}
.als-av.sm{width:22px;height:22px;font-size:10px;border-width:1.5px;}
.als-av.ko{filter:grayscale(1) brightness(.45);opacity:.6;}
.als-chef-av{border-color:var(--als-blood);box-shadow:0 0 6px rgba(170,40,40,0.4);}
.als-card-hdr .als-av+.als-av,.als-card-hdr .als-av+.als-chef-av{margin-left:-6px;}
.als-card-hdr .als-av.sm+.als-av.sm,.als-card-hdr .als-av.sm+.als-chef-av.sm{margin-left:-4px;}

/* ═══ CSS ICONS ═══ */
.als-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex-shrink:0;position:relative;}
.als-icon-bino::before,.als-icon-bino::after{content:'';position:absolute;width:6px;height:8px;border:1.5px solid var(--als-gold);border-radius:2px;top:3px;}
.als-icon-bino::before{left:1px;}.als-icon-bino::after{right:1px;}
.als-icon-xhair::before{content:'';position:absolute;width:10px;height:10px;border:1.5px solid var(--als-tranq);border-radius:50%;top:3px;left:3px;}
.als-icon-xhair::after{content:'+';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--als-tranq);font-size:8px;font-weight:700;}
.als-icon-dart::before{content:'';position:absolute;width:2px;height:10px;background:var(--als-tranq);top:3px;left:7px;border-radius:1px;}
.als-icon-dart::after{content:'';position:absolute;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:5px solid var(--als-tranq);top:1px;left:4px;}
.als-icon-paw::before{content:'';position:absolute;width:7px;height:5px;background:var(--als-poison);border-radius:50%;bottom:2px;left:4.5px;}
.als-icon-paw::after{content:'';position:absolute;width:3px;height:3px;background:var(--als-poison);border-radius:50%;top:3px;left:3px;
  box-shadow:5px 0 0 var(--als-poison),1px -3px 0 var(--als-poison),4px -3px 0 var(--als-poison);}
.als-icon-soccer::before{content:'';position:absolute;width:9px;height:9px;border:1.5px solid var(--als-bone);border-radius:50%;top:2px;left:2px;}
.als-icon-soccer::after{content:'';position:absolute;width:3px;height:3px;background:var(--als-bone);border-radius:50%;top:5px;left:5px;}
.als-icon-gourd::before{content:'';position:absolute;width:8px;height:10px;background:var(--als-flame);border-radius:40%;top:2px;left:3px;}
.als-icon-gourd::after{content:'';position:absolute;width:3px;height:3px;background:var(--als-night);border-radius:50%;top:1px;left:5px;}
.als-icon-clue::before{content:'';position:absolute;width:7px;height:7px;border:1.5px solid var(--als-gold);border-radius:50%;top:2px;left:1px;}
.als-icon-clue::after{content:'';position:absolute;width:5px;height:1.5px;background:var(--als-gold);top:10px;left:7px;transform:rotate(45deg);}
.als-icon-star::before{content:'★';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--als-gold);font-size:12px;}
.als-icon-skull::before{content:'';position:absolute;width:8px;height:7px;background:var(--als-blood);border-radius:50% 50% 30% 30%;top:2px;left:3px;}
.als-icon-skull::after{content:'';position:absolute;width:6px;height:3px;background:var(--als-blood);border-radius:0 0 30% 30%;top:9px;left:4px;}
.als-icon-shield::before{content:'';position:absolute;width:8px;height:10px;background:var(--als-poison);border-radius:0 0 50% 50%;top:2px;left:3px;}
.als-icon-snake::before{content:'';position:absolute;width:8px;height:8px;border:1.5px solid var(--als-poison);border-radius:50%;top:2px;left:1px;border-right-color:transparent;}
.als-icon-snake::after{content:'';position:absolute;width:3px;height:1.5px;background:var(--als-poison);top:5px;left:8px;}
.als-icon-croc::before{content:'';position:absolute;width:10px;height:4px;background:var(--als-poison);border-radius:2px;top:5px;left:2px;}
.als-icon-croc::after{content:'';position:absolute;width:0;height:0;border-top:3px solid transparent;border-bottom:3px solid transparent;border-left:4px solid var(--als-blood);top:4px;left:10px;}
.als-icon-sling::before{content:'';position:absolute;width:6px;height:8px;border:1.5px solid var(--als-earth);border-radius:0 50% 50% 0;top:3px;left:2px;border-left:none;}
.als-icon-sling::after{content:'';position:absolute;width:3px;height:1.5px;background:var(--als-earth);top:3px;left:2px;}
.als-icon-flame::before{content:'';position:absolute;width:8px;height:10px;
  background:radial-gradient(ellipse at bottom,var(--als-flame) 0%,var(--als-gold) 40%,transparent 70%);
  border-radius:50% 50% 20% 20%;bottom:1px;left:4px;}

/* ═══ SIDEBAR ═══ */
.als-sidebar{position:sticky;top:92px;align-self:start;display:flex;flex-direction:column;gap:14px;
  max-height:calc(100vh - 110px);overflow-y:auto;scrollbar-width:thin;
  scrollbar-color:rgba(244,167,42,0.2) transparent;padding-right:2px;}
.als-sidebar::-webkit-scrollbar{width:5px;}.als-sidebar::-webkit-scrollbar-thumb{background:rgba(244,167,42,0.2);border-radius:3px;}
.als-sbox{padding:12px 14px;border:1px solid rgba(244,167,42,0.15);border-radius:5px;
  background:linear-gradient(135deg,rgba(45,24,16,0.6),rgba(13,8,5,0.5));backdrop-filter:blur(6px);
  box-shadow:0 2px 12px rgba(0,0,0,0.3),inset 0 1px 0 rgba(244,167,42,0.08);}
.als-sbox-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;
  padding-bottom:6px;border-bottom:1px solid rgba(244,167,42,0.12);}
.als-sbox-title{font-family:'Staatliches',sans-serif;font-size:12px;letter-spacing:2.5px;color:var(--als-gold);text-transform:uppercase;}
.als-sbox-meta{font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(230,196,137,0.5);letter-spacing:1px;}

/* Zone map */
.als-map{position:relative;height:240px;border-radius:4px;overflow:hidden;
  background:radial-gradient(ellipse at 30% 40%,rgba(94,156,80,0.18) 0%,transparent 35%),
    radial-gradient(ellipse at 70% 60%,rgba(244,167,42,0.12) 0%,transparent 40%),
    linear-gradient(135deg,#3a2418 0%,#5a3520 50%,#3d2018 100%);
  border:1px solid rgba(244,167,42,0.18);box-shadow:inset 0 0 40px rgba(13,8,5,0.5);}
.als-map::before{content:'';position:absolute;inset:0;
  background-image:linear-gradient(90deg,rgba(244,167,42,0.05) 1px,transparent 1px),
    linear-gradient(0deg,rgba(244,167,42,0.05) 1px,transparent 1px);
  background-size:24px 24px;}
.als-map::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 60% 40% at 35% 45%,transparent 28%,rgba(244,167,42,0.06) 29%,transparent 31%),
    radial-gradient(ellipse 50% 35% at 35% 45%,transparent 28%,rgba(244,167,42,0.05) 29%,transparent 31%),
    radial-gradient(ellipse 55% 45% at 65% 55%,transparent 28%,rgba(244,167,42,0.06) 29%,transparent 31%);z-index:1;}
.als-map-zone{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:'JetBrains Mono',monospace;font-size:7px;color:rgba(13,8,5,0.7);letter-spacing:1px;
  text-transform:uppercase;font-weight:700;}
.als-map-zone.water{background:radial-gradient(circle,rgba(90,196,212,0.45),rgba(90,196,212,0.1));
  width:54px;height:42px;top:14%;left:8%;border:1px dashed rgba(90,196,212,0.5);color:var(--als-tranq);}
.als-map-zone.quicksand{background:radial-gradient(circle,rgba(230,196,137,0.55),rgba(230,196,137,0.2));
  width:46px;height:46px;top:55%;left:48%;border:1px dashed rgba(230,196,137,0.5);color:#4a3520;}
.als-map-zone.brush{background:radial-gradient(circle,rgba(126,217,87,0.25),rgba(126,217,87,0.05));
  width:80px;height:60px;top:8%;right:8%;border:1px dashed rgba(126,217,87,0.4);color:var(--als-poison);}
.als-map-zone.rocks{width:36px;height:36px;background:radial-gradient(circle,rgba(122,48,24,0.55),rgba(122,48,24,0.15));
  top:62%;right:14%;border:1px dashed rgba(196,74,28,0.5);color:var(--als-terra);}
.als-map-dot{position:absolute;width:12px;height:12px;border-radius:50%;background:var(--als-terra);
  border:2px solid rgba(13,8,5,0.7);box-shadow:0 0 8px var(--als-terra);transform:translate(-50%,-50%);z-index:3;
  transition:all 0.6s ease;}
.als-map-dot::before{content:'';position:absolute;inset:-6px;border:1px solid var(--als-terra);
  border-radius:50%;opacity:0.3;animation:als-dot-ring 2s ease infinite;}
@keyframes als-dot-ring{0%{transform:scale(0.8);opacity:0.4;}50%{transform:scale(1.4);opacity:0;}100%{transform:scale(0.8);opacity:0;}}
.als-map-dot::after{content:attr(data-tag);position:absolute;top:-14px;left:50%;transform:translateX(-50%);
  font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:1px;
  color:var(--als-terra);text-shadow:0 1px 2px rgba(0,0,0,.7);}
.als-map-chef{width:24px;height:24px;background:transparent;border:2px dashed var(--als-poison);
  animation:als-chef-pulse 1.5s ease infinite;display:flex;align-items:center;justify-content:center;overflow:visible;}
.als-map-chef .als-av.sm{width:18px;height:18px;border-color:var(--als-poison);}
.als-map-chef::before{content:'';position:absolute;inset:-8px;border:1px dashed rgba(126,217,87,0.4);
  border-radius:50%;animation:als-ping 2s ease-out infinite;}
@keyframes als-chef-pulse{0%,100%{transform:translate(-50%,-50%) scale(1);}50%{transform:translate(-50%,-50%) scale(1.3);}}
@keyframes als-ping{0%{transform:scale(.4);opacity:1;}100%{transform:scale(2.5);opacity:0;}}
.als-map-legend{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:8px;font-size:9px;}
.als-map-leg-item{display:flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;
  color:rgba(230,196,137,0.55);font-size:8.5px;letter-spacing:.5px;}
.als-map-leg-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}

/* Roster rows */
.als-roster-row{display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;
  padding:7px 0;border-bottom:1px solid rgba(244,167,42,0.06);}
.als-roster-row:last-child{border-bottom:none;}
.als-roster-name{font-family:'Staatliches',sans-serif;font-size:13px;letter-spacing:1.2px;color:var(--als-bone);line-height:1.1;}
.als-roster-arch{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.8px;color:rgba(230,196,137,0.5);text-transform:uppercase;}
.als-roster-detail{font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(230,196,137,0.5);letter-spacing:.5px;}
.als-roster-status{display:flex;flex-direction:column;align-items:flex-end;gap:3px;}
.als-status-tag{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.8px;
  padding:2px 6px;border-radius:2px;border:1px solid;text-transform:uppercase;font-weight:700;}
.als-ammo-mini{display:flex;gap:2px;margin-top:2px;}
.als-ammo-mini .a{width:5px;height:9px;background:var(--als-tranq);border-radius:2px;}
.als-ammo-mini .a.spent{background:transparent;border:1px dashed rgba(90,196,212,0.3);}
.als-tally{display:flex;gap:1px;}.als-tally .t{width:2px;height:8px;background:var(--als-gold);border-radius:1px;}

/* Ammo strip (large) */
.als-ammo-strip{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;}
.als-ammo{width:12px;height:18px;background:var(--als-tranq);border-radius:6px;
  border:1px solid var(--als-tranq-deep);box-shadow:inset 0 -3px 0 rgba(0,0,0,0.2);position:relative;}
.als-ammo.spent{background:transparent;border-style:dashed;opacity:.4;}
.als-ammo::after{content:'';position:absolute;top:2px;left:2px;right:2px;height:3px;
  background:rgba(255,255,255,0.25);border-radius:2px;}

/* Target tracker (Chef dossier) */
.als-target-box{border-color:rgba(126,217,87,0.3) !important;background:linear-gradient(135deg,rgba(40,55,30,0.5),rgba(13,8,5,0.5)) !important;}
.als-target-mug{display:flex;gap:10px;align-items:center;margin-bottom:8px;}
.als-target-mug .als-av.lg{width:52px;height:52px;border-color:var(--als-poison);box-shadow:0 0 8px rgba(126,217,87,0.3);}
.als-target-portrait{width:60px;height:60px;flex-shrink:0;border:2px solid var(--als-poison);
  background:linear-gradient(135deg,#3a3018,#5a4828);position:relative;overflow:hidden;border-radius:2px;}
.als-target-portrait::before{content:'CHEF';position:absolute;bottom:0;left:0;right:0;background:rgba(13,8,5,0.8);
  color:var(--als-poison);font-family:'JetBrains Mono',monospace;font-size:7px;
  text-align:center;letter-spacing:1px;padding:2px 0;font-weight:700;}
.als-target-portrait::after{content:'';position:absolute;top:14px;left:50%;transform:translateX(-50%);
  width:34px;height:30px;background:radial-gradient(ellipse,var(--als-dust) 30%,transparent 70%);}
.als-target-eyes{position:absolute;top:24px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:2;}
.als-target-eyes span{width:5px;height:5px;background:var(--als-poison);border-radius:50%;
  box-shadow:0 0 6px var(--als-poison);animation:als-blink 0.8s infinite;}
.als-target-info{flex:1;}
.als-target-info .nm{font-family:'Anton',sans-serif;font-size:18px;color:var(--als-poison);letter-spacing:1px;}
.als-target-info .stat{font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(230,196,137,0.55);letter-spacing:.5px;margin-top:2px;}
.als-target-detail{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin-top:8px;
  font-family:'JetBrains Mono',monospace;font-size:9px;}
.als-target-detail .k{color:rgba(230,196,137,0.45);letter-spacing:.5px;}
.als-target-detail .v{color:var(--als-bone);font-weight:700;}

/* Stamina bar */
.als-stamina-bar{display:flex;align-items:center;gap:6px;margin:8px 0 4px;font-family:'JetBrains Mono',monospace;font-size:9px;}
.als-stamina-label{color:rgba(230,196,137,0.45);letter-spacing:1px;min-width:52px;}
.als-stamina-track{flex:1;height:8px;background:rgba(13,8,5,0.6);border-radius:4px;overflow:hidden;border:1px solid rgba(230,196,137,0.1);}
.als-stamina-fill{height:100%;border-radius:3px;transition:width .4s ease-out,background .4s;}
.als-stamina-pct{font-weight:700;min-width:28px;text-align:right;}

/* Tier tag */
.als-tier-tag{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:1px;padding:1px 5px;border-radius:2px;
  border:1px solid;background:rgba(0,0,0,0.2);margin-left:4px;vertical-align:middle;}

/* Tick stats row */
.als-tick-stats{display:flex;gap:14px;font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(230,196,137,0.55);padding:4px 14px;}

/* Phase progress */
.als-progress{display:flex;gap:0;border-radius:3px;overflow:hidden;border:1px solid rgba(244,167,42,0.15);}
.als-prog-step{flex:1;padding:8px 6px;text-align:center;font-family:'JetBrains Mono',monospace;
  font-size:8px;letter-spacing:1px;color:rgba(230,196,137,0.45);
  border-right:1px solid rgba(244,167,42,0.1);background:rgba(13,8,5,0.4);}
.als-prog-step:last-child{border-right:none;}
.als-prog-step.done{background:rgba(126,217,87,0.12);color:var(--als-poison);}
.als-prog-step.now{background:rgba(244,167,42,0.18);color:var(--als-sun);font-weight:700;
  box-shadow:inset 0 -2px 0 var(--als-flame);}
.als-prog-step .n{display:block;font-family:'Anton',sans-serif;font-size:14px;letter-spacing:0;color:inherit;margin-bottom:2px;}

/* ═══ WINNER ═══ */
.als-winner{margin:18px 0;padding:30px 20px;text-align:center;border-radius:6px;position:relative;
  background:linear-gradient(135deg,rgba(244,167,42,0.18),rgba(122,48,24,0.12));
  border:2px solid var(--als-gold);overflow:hidden;}
.als-winner::before{content:'';position:absolute;inset:-50%;
  background:conic-gradient(from 0deg,transparent 0deg,rgba(244,167,42,0.08) 30deg,transparent 60deg,transparent 180deg,rgba(244,167,42,0.08) 210deg,transparent 240deg);
  animation:als-rotate 8s linear infinite;}
@keyframes als-rotate{to{transform:rotate(360deg);}}
.als-winner > *{position:relative;z-index:1;}
.als-winner .tag{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:4px;color:var(--als-sun);margin-bottom:8px;}
.als-winner .nm{font-family:'Anton',sans-serif;font-size:54px;color:var(--als-bone);
  letter-spacing:2px;text-shadow:3px 3px 0 var(--als-rust);}
.als-winner .sub{font-family:'Special Elite',cursive;font-style:italic;color:var(--als-dust);margin-top:6px;}

/* ═══ CONTROLS ═══ */
.als-controls{position:fixed;bottom:0;left:172px;right:0;z-index:100;background:rgba(13,8,5,0.95);
  border-top:2px solid var(--als-terra);padding:8px 16px;display:flex;align-items:center;justify-content:center;gap:12px;
  backdrop-filter:blur(8px);}
.als-controls button{background:var(--als-earth);color:var(--als-bone);border:none;padding:6px 16px;border-radius:3px;
  font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all .2s;}
.als-controls button:hover{background:var(--als-gold);color:var(--als-night);}
.als-controls .counter{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--als-dust);letter-spacing:1px;}

/* ═══ LAYOUT ═══ */
.als-layout{display:grid;grid-template-columns:1fr 340px;gap:18px;padding-top:8px;}
.als-main{min-width:0;padding-bottom:60px;}
@media(max-width:980px){.als-layout{grid-template-columns:1fr;}.als-sidebar{position:static;max-height:none;}}

/* ═══ COLD OPEN / HERO ═══ */
.als-cold-open{position:relative;padding:40px 28px 36px;margin-bottom:18px;text-align:center;overflow:hidden;
  border:1px solid rgba(244,167,42,0.18);border-radius:6px;
  background:linear-gradient(135deg,rgba(45,24,16,0.55),rgba(13,8,5,0.4));}
.als-cold-open::before{content:'';position:absolute;inset:0;
  background:repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(244,167,42,0.02) 3px,rgba(244,167,42,0.02) 4px);
  pointer-events:none;}
.als-hero-corner{position:absolute;width:20px;height:20px;border:2px solid var(--als-terra);}
.als-hero-corner.tl{top:8px;left:8px;border-right:none;border-bottom:none;}
.als-hero-corner.tr{top:8px;right:8px;border-left:none;border-bottom:none;}
.als-hero-corner.bl{bottom:8px;left:8px;border-right:none;border-top:none;}
.als-hero-corner.br{bottom:8px;right:8px;border-left:none;border-top:none;}
.als-hero-ep{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:4px;
  color:var(--als-gold);margin-bottom:14px;}
.als-hero-ep .dot{display:inline-block;width:5px;height:5px;background:var(--als-blood);
  border-radius:50%;margin:0 8px 2px;vertical-align:middle;}
.als-cold-title{font-family:'Anton',sans-serif;font-size:84px;line-height:.92;
  color:var(--als-bone);letter-spacing:2px;text-transform:uppercase;
  text-shadow:4px 4px 0 var(--als-rust),8px 8px 0 rgba(13,8,5,0.4),0 0 40px rgba(244,167,42,0.15);}
.als-cold-title .ember{color:var(--als-flame);}
.als-cold-sub{font-family:'Staatliches',sans-serif;font-size:16px;letter-spacing:6px;color:var(--als-dust);
  margin-top:10px;text-transform:uppercase;}
.als-cold-tagline{font-family:'Special Elite',cursive;font-style:italic;font-size:13px;color:rgba(230,196,137,0.7);
  margin-top:22px;max-width:560px;margin-left:auto;margin-right:auto;line-height:1.6;}
.als-cold-stats{display:flex;gap:18px;justify-content:center;margin-top:22px;flex-wrap:wrap;}
.als-cold-stat{padding:8px 14px;border:1px solid rgba(244,167,42,0.22);border-radius:3px;background:rgba(13,8,5,0.4);}
.als-cold-stat .lbl{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.5px;color:rgba(230,196,137,0.55);text-transform:uppercase;}
.als-cold-stat .val{font-family:'Anton',sans-serif;font-size:22px;color:var(--als-gold);letter-spacing:1px;margin-top:2px;}

/* Roster strip in hero */
.als-roster-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:24px;}
.als-rs-card{padding:10px;border:1px solid rgba(244,167,42,0.15);background:rgba(13,8,5,0.5);
  border-radius:4px;text-align:center;position:relative;border-top:3px solid var(--als-terra);
  transition:transform 0.3s ease,box-shadow 0.3s ease;}
.als-rs-card:hover{transform:translateY(-4px);box-shadow:0 6px 20px rgba(0,0,0,0.4),0 0 12px rgba(244,167,42,0.1);}
.als-rs-card .av{width:48px;height:48px;border-radius:50%;margin:0 auto 6px;overflow:hidden;
  background:var(--als-terra);display:flex;align-items:center;justify-content:center;
  font-family:'Anton',sans-serif;font-size:20px;color:var(--als-night);border:2px solid rgba(13,8,5,0.6);}
.als-rs-card .av img{width:100%;height:100%;object-fit:contain;border-radius:50%;}
.als-rs-card .nm{font-family:'Staatliches',sans-serif;font-size:13px;letter-spacing:1.5px;color:var(--als-bone);}
.als-rs-card .arch{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:1px;
  color:rgba(230,196,137,0.55);text-transform:uppercase;margin-top:2px;}

/* Player orbit animation for cold open */
.als-orbit{position:relative;width:280px;height:280px;margin:30px auto 10px;}
.als-orbit-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:70px;height:70px;border:3px dashed var(--als-poison);border-radius:50%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:1px;color:var(--als-poison);
  animation:als-chef-pulse 2s ease infinite;}
.als-orbit-center .als-av{width:32px;height:32px;border-color:var(--als-poison);}
.als-orbit-ring{position:absolute;inset:0;animation:als-orbit-spin 20s linear infinite;}
@keyframes als-orbit-spin{to{transform:rotate(360deg);}}
.als-orbit-player{position:absolute;width:36px;height:36px;border-radius:50%;overflow:hidden;
  display:flex;align-items:center;justify-content:center;background:var(--als-terra);
  font-family:'Anton',sans-serif;font-size:13px;color:var(--als-night);
  border:2px solid rgba(13,8,5,0.6);box-shadow:0 0 10px rgba(0,0,0,0.4);
  animation:als-orbit-counterspin 20s linear infinite;}
.als-orbit-player img{width:100%;height:100%;object-fit:contain;border-radius:50%;}
@keyframes als-orbit-counterspin{to{transform:rotate(-360deg);}}

/* Host quote */
.als-host-quote{display:flex;gap:14px;align-items:flex-start;}
.als-host-quote .qmark{font-family:'Anton',sans-serif;font-size:42px;color:var(--als-gold);line-height:.7;margin-top:-4px;}
.als-host-quote .text{font-family:'Special Elite',cursive;font-size:14px;color:var(--als-sun);line-height:1.55;font-style:italic;}
.als-host-quote .who{display:block;margin-top:6px;font-family:'JetBrains Mono',monospace;font-size:9px;
  color:rgba(244,167,42,0.6);letter-spacing:2px;font-style:normal;}

/* Confessional */
.als-conf{margin:14px 0;padding:14px 16px 14px 22px;
  background:linear-gradient(135deg,rgba(50,38,24,0.7),rgba(30,20,12,0.6));
  border:1px solid rgba(244,167,42,0.15);border-left:none;border-radius:3px;
  box-shadow:3px 3px 0 rgba(13,8,5,0.4),inset 3px 0 0 var(--als-terra);transform:rotate(-0.3deg);position:relative;}
.als-conf::before{content:'CONFESSIONAL';position:absolute;top:-7px;left:14px;
  background:linear-gradient(90deg,rgba(50,38,24,0.9),rgba(30,20,12,0.9));
  border:1px solid rgba(244,167,42,0.12);border-radius:2px;
  padding:1px 8px;font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--als-rust);}
.als-conf-hdr{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
.als-conf-name{font-family:'Staatliches',sans-serif;font-size:13px;letter-spacing:1.5px;color:var(--als-terra);}
.als-conf-body{font-family:'Special Elite',cursive;font-size:13px;line-height:1.55;color:rgba(240,224,194,0.78);font-style:italic;}

/* Radio chatter */
.als-chatter{margin:8px 0;padding:6px 14px;font-family:'JetBrains Mono',monospace;font-size:9px;
  letter-spacing:1.5px;color:rgba(244,167,42,0.35);border-left:2px solid rgba(244,167,42,0.1);
  font-style:italic;opacity:0;}
.als-chatter.visible{animation:als-chatter-in 0.8s ease forwards;}
@keyframes als-chatter-in{from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:none;}}
.als-chatter .freq{color:rgba(160,40,40,0.5);font-weight:700;font-style:normal;margin-right:6px;}

/* Screen shake for encounters */
@keyframes als-shake{0%,100%{transform:none;}10%{transform:translateX(-4px) rotate(-0.5deg);}30%{transform:translateX(3px) rotate(0.3deg);}50%{transform:translateX(-2px);}70%{transform:translateX(1px) rotate(-0.2deg);}}
.als-shake{animation:als-shake 0.4s ease-out;}

/* ═══ PHASE 1: GAUNTLET VIZ ═══ */
.als-gauntlet{margin:12px 0 6px;padding:10px 14px;background:rgba(13,8,5,0.5);border:1px solid rgba(244,167,42,0.12);border-radius:4px;}
.als-gauntlet-track{position:relative;height:56px;background:linear-gradient(90deg,rgba(45,24,16,0.6),rgba(126,217,87,0.08));
  border-radius:3px;border:1px solid rgba(244,167,42,0.08);overflow:visible;}
.als-gauntlet-runner{position:absolute;left:var(--pos,0%);top:50%;transform:translateY(-50%);
  width:32px;height:32px;border-radius:50%;z-index:3;border:2px solid var(--als-poison);
  box-shadow:0 0 10px rgba(126,217,87,0.3);transition:left 0.6s ease;
  animation:als-runner-pulse 1.5s ease infinite;}
@keyframes als-runner-pulse{0%,100%{box-shadow:0 0 10px rgba(126,217,87,0.3);}50%{box-shadow:0 0 18px rgba(126,217,87,0.6);}}
.als-gauntlet-goal{position:absolute;right:6px;top:50%;transform:translateY(-50%);
  font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--als-poison);
  display:flex;align-items:center;gap:4px;z-index:2;opacity:0.8;}
.als-gauntlet-kicker{position:absolute;top:50%;transform:translateY(-50%);
  left:calc(15% + (var(--ki) / var(--total)) * 65%);width:26px;height:26px;border-radius:50%;
  border:2px solid var(--als-blood);z-index:2;opacity:0.7;background:rgba(160,40,40,0.15);
  box-shadow:0 0 6px rgba(160,40,40,0.2);}

/* ═══ PHASE 1: PLUM STRIP ═══ */
.als-plum-strip{display:flex;gap:6px;justify-content:center;margin:10px 0 14px;padding:8px;
  background:rgba(13,8,5,0.4);border-radius:4px;border:1px solid rgba(244,167,42,0.08);}
.als-plum-dot{width:28px;height:28px;display:flex;align-items:center;justify-content:center;
  border-radius:50%;border:2px dashed rgba(160,40,40,0.3);background:rgba(13,8,5,0.4);
  font-size:14px;color:rgba(160,40,40,0.3);transition:all 0.3s ease;}
.als-plum-dot.full{border-color:var(--als-flame);border-style:solid;background:rgba(227,98,24,0.15);
  color:var(--als-flame);box-shadow:0 0 8px rgba(227,98,24,0.3);
  animation:als-plum-glow 2s ease infinite;}
@keyframes als-plum-glow{0%,100%{box-shadow:0 0 8px rgba(227,98,24,0.3);}50%{box-shadow:0 0 16px rgba(227,98,24,0.5);}}

/* ═══ PHASE 1: RUN SUMMARY ═══ */
.als-run-summary{margin-top:10px;padding:12px;background:rgba(13,8,5,0.4);border-radius:4px;
  border:1px solid rgba(244,167,42,0.1);}
.als-run-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;margin-top:6px;}
.als-run-stat{display:flex;justify-content:space-between;align-items:center;
  padding:5px 8px;border-radius:3px;background:rgba(13,8,5,0.3);
  border:1px solid rgba(244,167,42,0.06);}
.als-run-stat .k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.5px;
  color:rgba(230,196,137,0.55);display:flex;align-items:center;gap:4px;}
.als-run-stat .v{font-family:'Staatliches',sans-serif;font-size:13px;letter-spacing:1px;color:var(--als-bone);}
.als-run-stat .v.pos{color:var(--als-poison);}
.als-run-stat .v.neg{color:var(--als-blood);}
.als-run-stat .v.neu{color:var(--als-gold);}

/* ═══ PHASE 1: GAUNTLET KICK-BY-KICK ═══ */
.als-gauntlet-card{padding-bottom:8px;}
.als-kick-rows{display:flex;flex-direction:column;gap:0;}
.als-kick-row{display:grid;grid-template-columns:140px auto 1fr;gap:8px;align-items:center;
  padding:7px 10px;border-bottom:1px solid rgba(244,167,42,0.06);opacity:0;transition:opacity 0.3s ease;}
.als-kick-row.visible{opacity:1;animation:als-kick-in 0.35s cubic-bezier(.16,1,.3,1) forwards;}
@keyframes als-kick-in{0%{opacity:0;transform:translateX(-10px);}100%{opacity:1;transform:none;}}
.als-kick-row-hit{background:rgba(160,40,40,0.08);border-left:3px solid var(--als-blood);}
.als-kick-row-miss{background:rgba(126,217,87,0.04);border-left:3px solid rgba(126,217,87,0.2);}
.als-kick-row-saved{background:rgba(106,64,128,0.08);border-left:3px solid var(--als-bruise);}
.als-kick-who{display:flex;align-items:center;gap:6px;}
.als-kick-name{font-family:'Staatliches',sans-serif;font-size:12px;letter-spacing:1.2px;color:var(--als-bone);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.als-kick-result{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1.5px;font-weight:700;
  padding:2px 8px;border-radius:2px;border:1px solid;text-transform:uppercase;white-space:nowrap;text-align:center;min-width:60px;}
.als-kick-hit{color:var(--als-blood);border-color:rgba(160,40,40,0.5);background:rgba(160,40,40,0.12);}
.als-kick-miss{color:rgba(126,217,87,0.6);border-color:rgba(126,217,87,0.2);background:rgba(126,217,87,0.04);}
.als-kick-headshot{color:#ff4444;border-color:rgba(255,68,68,0.6);background:rgba(255,68,68,0.15);animation:als-shake 0.4s ease-out;}
.als-kick-revenge{color:var(--als-flame);border-color:rgba(227,98,24,0.5);background:rgba(227,98,24,0.12);animation:als-shake 0.4s ease-out;}
.als-kick-saved{color:var(--als-bruise);border-color:rgba(106,64,128,0.5);background:rgba(106,64,128,0.1);}
.als-kick-taunt{color:var(--als-sun);border-color:rgba(251,210,74,0.5);background:rgba(251,210,74,0.08);}
.als-kick-juke{color:var(--als-poison);border-color:rgba(126,217,87,0.5);background:rgba(126,217,87,0.08);}
.als-kick-panic{color:var(--als-dust);border-color:rgba(230,196,137,0.3);background:rgba(230,196,137,0.06);}
.als-swing-body{font-style:italic;font-size:12px;color:#cdd9e5;padding:6px 14px;line-height:1.5;min-height:20px;}
.als-swing-tally{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(230,196,137,0.5);padding:4px 14px 2px;display:flex;align-items:center;gap:5px;}
.als-swing-tally .pos{color:var(--als-poison);font-weight:700;}.als-swing-tally .neg{color:rgba(230,196,137,0.3);}
.als-swing-progress{display:flex;gap:4px;align-items:center;margin:0 8px;}
.als-sw-dot{width:8px;height:8px;border-radius:50%;background:rgba(230,196,137,0.15);border:1px solid rgba(230,196,137,0.2);transition:all .3s;}
.als-sw-dot.filled{background:var(--als-terra);border-color:var(--als-flame);}
.als-sw-dot.current{background:var(--als-flame);border-color:var(--als-sun);box-shadow:0 0 6px rgba(227,98,24,0.5);transform:scale(1.3);}
@keyframes als-gourd-burst{0%{transform:scale(1);}15%{transform:scale(1.03) rotate(0.5deg);}30%{transform:scale(0.98) rotate(-0.3deg);}50%{transform:scale(1.01);}100%{transform:none;}}
.als-gourd-burst{animation:als-gourd-burst 0.5s cubic-bezier(.16,1,.3,1);}
.als-kick-text{grid-column:1/-1;font-family:'Special Elite',cursive;font-size:11.5px;line-height:1.5;
  color:rgba(240,224,194,0.7);padding:2px 0 0 0;font-style:italic;}
.als-kick-counter{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--als-dust);margin-left:auto;}
.als-kick-controls{display:flex;gap:8px;justify-content:center;padding:8px 0 4px;border-top:1px solid rgba(244,167,42,0.08);margin-top:6px;}
.als-kick-controls button{background:var(--als-earth);color:var(--als-bone);border:none;padding:4px 12px;border-radius:3px;
  font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;transition:all .2s;}
.als-kick-controls button:hover{background:var(--als-gold);color:var(--als-night);}

/* ═══ PHASE 1: LEADERBOARD ═══ */
.als-lb-row{display:flex;align-items:center;gap:8px;padding:6px 8px;
  border-bottom:1px solid rgba(244,167,42,0.06);transition:background 0.2s;}
.als-lb-row:hover{background:rgba(244,167,42,0.04);}
.als-lb-row:last-child{border-bottom:none;}
.als-lb-rank{font-family:'Anton',sans-serif;font-size:16px;color:var(--als-gold);
  width:28px;text-align:center;flex-shrink:0;}
.als-lb-name{font-family:'Staatliches',sans-serif;font-size:13px;letter-spacing:1.2px;
  color:var(--als-bone);width:100px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.als-lb-bar{flex:1;height:14px;background:rgba(13,8,5,0.5);border-radius:2px;overflow:hidden;
  border:1px solid rgba(244,167,42,0.08);}
.als-lb-fill{height:100%;border-radius:2px;transition:width 0.6s ease;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.15);}
.als-lb-val{font-family:'Anton',sans-serif;font-size:16px;color:var(--als-flame);
  width:24px;text-align:right;flex-shrink:0;}

@media(prefers-reduced-motion:reduce){
  *{animation-duration:.01ms !important;animation-iteration-count:1 !important;}
  .als-card{opacity:1 !important;}
  .als-card.visible{animation:none !important;opacity:1 !important;}
  .als-conf{transform:none !important;}
  .als-scanlines,.als-vignette{display:none;}
  .als-gauntlet-runner{animation:none !important;box-shadow:0 0 10px rgba(126,217,87,0.3) !important;}
  .als-plum-dot.full{animation:none !important;box-shadow:0 0 8px rgba(227,98,24,0.3) !important;}
  .als-runner-pulse{animation:none !important;}
}
</style>

<div class="als-atmo"></div>
<div class="als-scanlines"></div>
<div class="als-vignette"></div>
<div class="als-dust">${Array.from({length:15},(_,i)=>`<div class="als-mote" style="left:${Math.random()*100}%;top:${60+Math.random()*40}%;width:${2+Math.random()*2}px;height:${2+Math.random()*2}px;animation-duration:${12+Math.random()*15}s;animation-delay:${Math.random()*10}s;"></div>`).join('')}</div>
<div class="als-shimmer"></div>
<div class="als-horizon">
  <div class="als-tree t1"><div class="canopy"></div><div class="trunk"></div></div>
  <div class="als-tree t2"><div class="canopy"></div><div class="trunk"></div></div>
  <div class="als-tree t3"><div class="canopy"></div><div class="trunk"></div></div>
  <div class="als-tree t4"><div class="canopy"></div><div class="trunk"></div></div>
  <div class="als-tree t5"><div class="canopy"></div><div class="trunk"></div></div>
</div>
<div class="als-grass"></div>

<div class="als-bar">
  <div class="als-live"><span class="als-live-dot"></span>LIVE · CH-07</div>
  <div class="als-ticker"><div class="als-ticker-inner">
    AFRICAN LYING SAFARI &nbsp;//&nbsp; ${ep.challengeData?.standings?.length || '?'} HUNTERS REMAIN &nbsp;//&nbsp; <b>TARGET:</b> CHEF HATCHET · FERAL &nbsp;//&nbsp; AMMO RESERVES CRITICAL &nbsp;//&nbsp; HEAT WARNING IN EFFECT &nbsp;//&nbsp; ALL FREQUENCIES MONITORED
  </div></div>
  <div class="als-channel">SAFARI NET</div>
</div>

${content}
</div>`;
}

// ══════════════════════════════════════════════════════════════
// VP BUILDERS
// ══════════════════════════════════════════════════════════════

export function rpBuildSafariColdOpen(ep) {
  const d = ep.challengeData;
  if (!d) return '';
  const active = d.standings?.map(s => s.name) || [];
  const playerCount = active.length;
  const epNum = gs.episodeHistory?.length || '?';

  const orbitPlayers = active.map((name, i) => {
    const angle = (i / playerCount) * 360;
    const rad = angle * Math.PI / 180;
    const x = 50 + 42 * Math.cos(rad);
    const y = 50 + 42 * Math.sin(rad);
    const sl = slug(name);
    return `<div class="als-orbit-player" data-player="${sl}" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%);"><img src="assets/avatars/${sl}.png" alt="${name}" onerror="this.outerHTML='${name.split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2)}'"></div>`;
  }).join('');

  const rosterCards = active.slice(0, 10).map(name => {
    const sl = slug(name);
    const p = players.find(pl => pl.name === name);
    const arch = p?.archetype || 'unknown';
    return `<div class="als-rs-card">
      <div class="av"><img src="assets/avatars/${sl}.png" alt="${name}" onerror="this.outerHTML='${name.split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2)}'"></div>
      <div class="nm">${name.split(' ')[0]}</div>
      <div class="arch">${arch}</div>
    </div>`;
  }).join('');

  const html = `
<div class="als-cold-open">
  <div class="als-hero-corner tl"></div><div class="als-hero-corner tr"></div>
  <div class="als-hero-corner bl"></div><div class="als-hero-corner br"></div>
  <div class="als-hero-ep">EPISODE ${epNum} <span class="dot"></span> POST-MERGE</div>
  <div class="als-cold-title">AFRICAN LYING<br><span class="ember">SAFARI</span></div>
  <div class="als-cold-sub">${_icon('binoculars')} Track ${_icon('dart')} Tranq ${_icon('paw')} Survive</div>
  <div class="als-cold-tagline">${playerCount} hunters. One feral ex-contestant loose on the golden savanna. Three phases. One immunity necklace. The hunt of a lifetime.</div>
  <div class="als-cold-stats">
    <div class="als-cold-stat"><div class="lbl">Hunters</div><div class="val">${playerCount}</div></div>
    <div class="als-cold-stat"><div class="lbl">Phases</div><div class="val">3</div></div>
    <div class="als-cold-stat"><div class="lbl">Hunt Ticks</div><div class="val">${d.huntTicks?.length || '?'}</div></div>
    <div class="als-cold-stat"><div class="lbl">Zones</div><div class="val">6</div></div>
  </div>
  <div class="als-orbit">
    <div class="als-orbit-ring">${orbitPlayers}</div>
    <div class="als-orbit-center">${_chefAv()} CHEF</div>
  </div>
  <div class="als-roster-strip">${rosterCards}</div>
</div>`;
  return _shell(html, ep, 'phase-golden');
}

export function rpBuildSafariPhase1(ep) {
  const d = ep.challengeData;
  if (!d?.sockerResults) return '';
  const steps = [];
  const stepMeta = [];
  const key = 'p1';
  const totalRunners = d.sockerResults.length;
  const firstMaxPlums = d.sockerResults[0]?.maxPlums || 6;

  // Rules explanation card
  steps.push(`<div id="als-step-${key}-0" class="als-card" data-type="host" style="opacity:0">
    <div class="als-card-hdr">
      <span class="als-card-title">${_icon('soccer')} Sock-et To Me</span>
      <span class="als-badge als-b-gather">Phase 1 of 3</span>
    </div>
    <div class="als-host-quote">
      <span class="qmark">"</span>
      <div class="text">One at a time, you'll sprint to the plum pile at the far end of the field. Everyone else kicks soccer balls at you. Every ball that hits you knocks a plum out of your hands. The more plums you bring back, the more throws you get in Phase 2. <em>Dodge well, and you'll have ammunition. Get hammered, and you're throwing one dart in the dark.</em>
      <span class="who">— ${host().toUpperCase()} · SOCK-ET TO ME</span></div>
    </div>
    <div class="als-card-meta">
      <span>${_icon('soccer')} ${totalRunners} runners take turns</span>
      <span>${_icon('dart')} Plums = currency for Phase 2</span>
      <span>MAX ${_icon('flame')} ${firstMaxPlums} plums · MIN 1</span>
    </div>
  </div>`);
  stepMeta.push({ type: 'host' });

  let stepIdx = 1;

  for (let ri = 0; ri < d.sockerResults.length; ri++) {
    const r = d.sockerResults[ri];
    const pr = pronouns(r.name);
    const kickers = r.kickResults || [];
    const mxP = r.maxPlums || 6;
    const intentMisses = kickers.filter(k => k.intentionalMiss).length;
    const headshots = kickers.filter(k => k.headshot).length;
    const revengeKicks = kickers.filter(k => k.revenge).length;
    const taunts = kickers.filter(k => k.taunt).length;
    const jukes = kickers.filter(k => k.juke).length;
    const panics = kickers.filter(k => k.panic).length;

    // Runner announcement card with gauntlet viz
    const kickerNames = d.sockerResults.filter(x => x.name !== r.name).map(x => x.name);
    steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" data-type="host" style="opacity:0">
      <div class="als-card-hdr">
        ${_av(r.name, 'lg')}
        <div style="flex:1;">
          <div class="als-card-title" style="font-size:20px;">${_icon('flame')} Runner ${ri + 1}/${totalRunners}: ${r.name}</div>
          <div class="als-card-time">KICKERS: ${kickerNames.join(' · ')}</div>
        </div>
        <span class="als-badge als-b-gather">UP NEXT</span>
      </div>
      <div class="als-gauntlet">
        <div class="als-gauntlet-track">
          <div class="als-gauntlet-runner" style="--pos:0%">${_av(r.name, 'sm')}</div>
          <div class="als-gauntlet-goal">${_icon('flame')} PLUMS</div>
          ${kickerNames.map((k, ki) => `<div class="als-gauntlet-kicker" style="--ki:${ki};--total:${kickerNames.length}">${_av(k, 'sm')}</div>`).join('')}
        </div>
      </div>
    </div>`);
    stepMeta.push({ type: 'announce', name: r.name });
    stepIdx++;

    // Gauntlet card — kick-by-kick rows inside one card
    const kickRows = kickers.map((k, ki) => {
      let resultTag, resultCls, rowCls, hitVal = 0, saveVal = 0;
      if (k.headshot) {
        resultTag = 'HEADSHOT ×2'; resultCls = 'als-kick-headshot'; rowCls = 'als-kick-row-hit'; hitVal = 2;
      } else if (k.revenge) {
        resultTag = 'REVENGE ×2'; resultCls = 'als-kick-revenge'; rowCls = 'als-kick-row-hit'; hitVal = 2;
      } else if (k.intentionalMiss) {
        resultTag = 'MISSED ON PURPOSE'; resultCls = 'als-kick-saved'; rowCls = 'als-kick-row-saved'; saveVal = 1;
      } else if (k.taunt) {
        resultTag = 'TAUNTED & WHIFFED'; resultCls = 'als-kick-taunt'; rowCls = 'als-kick-row-miss';
      } else if (k.juke) {
        resultTag = 'JUKED'; resultCls = 'als-kick-juke'; rowCls = 'als-kick-row-miss';
      } else if (k.panic) {
        resultTag = 'CHOKED'; resultCls = 'als-kick-panic'; rowCls = 'als-kick-row-miss';
      } else if (k.collided) {
        resultTag = 'COLLIDED'; resultCls = 'als-kick-miss'; rowCls = 'als-kick-row-miss';
      } else if (k.deflected) {
        resultTag = 'DEFLECTED'; resultCls = 'als-kick-miss'; rowCls = 'als-kick-row-miss';
      } else if (k.hit) {
        resultTag = 'HIT'; resultCls = 'als-kick-hit'; rowCls = 'als-kick-row-hit'; hitVal = 1;
      } else {
        resultTag = 'MISS'; resultCls = 'als-kick-miss'; rowCls = 'als-kick-row-miss';
      }
      const hasText = k.text || '';
      return `<div class="als-kick-row ${rowCls}" id="als-kick-${key}-${ri}-${ki}" data-hits="${hitVal}" data-saves="${saveVal}" style="opacity:0">
        <div class="als-kick-who">${_av(k.kicker, 'sm')} <span class="als-kick-name">${k.kicker}</span></div>
        <div class="als-kick-result ${resultCls}">${resultTag}</div>
        ${hasText ? `<div class="als-kick-text">${hasText}</div>` : ''}
      </div>`;
    }).join('');

    // Plum meter that updates live
    const plumMeter = Array.from({length: mxP}, (_, i) =>
      `<span class="als-plum-dot${i < mxP ? '' : ''}" id="als-plum-${key}-${ri}-${i}">${_icon('flame')}</span>`
    ).join('');

    steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card als-gauntlet-card" data-type="host" data-runner="${ri}" data-kicks="${kickers.length}" style="opacity:0">
      <div class="als-card-hdr">
        ${_av(r.name)} <span class="als-card-title">${_icon('soccer')} ${r.name}'s Gauntlet</span>
        <span class="als-kick-counter" id="als-kick-counter-${key}-${ri}">0 / ${kickers.length}</span>
        <span class="als-badge als-b-gather" id="als-kick-hits-${key}-${ri}">HITS: 0</span>
      </div>
      <div class="als-plum-strip" id="als-plum-strip-${key}-${ri}" data-max="${mxP}" data-plums="${r.plums}">${plumMeter}</div>
      <div class="als-kick-rows">${kickRows}</div>
      <div class="als-kick-controls">
        <button onclick="window._alsKickNext('${key}',${ri},${kickers.length})">Next Kick</button>
        <button onclick="window._alsKickAll('${key}',${ri},${kickers.length})">Reveal All</button>
      </div>
    </div>`);
    stepMeta.push({ type: 'gauntlet', name: r.name, kicks: kickers.length, runnerIdx: ri });
    stepIdx++;

    // Post-kick special event cards (deflect, collateral, wipeout, prodigy, etc.)
    for (const ev of r.events) {
      const cardType = ev.type === 'wipeout' || ev.type === 'headshot' ? 'hazard' :
                       ev.type === 'deflect' || ev.type === 'prodigy' ? 'encounter' :
                       ev.type === 'collateral' ? 'social' : 'host';
      const badgeCls = ev.type === 'wipeout' ? 'als-b-hazard' :
                       ev.type === 'deflect' || ev.type === 'prodigy' ? 'als-b-encounter' :
                       ev.type === 'collateral' ? 'als-b-social' : 'als-b-gather';
      const evLabel = ev.type === 'dodge-success' ? 'CLEAN RUN' :
                      ev.type === 'dodge-partial' ? 'TOOK HITS' :
                      ev.type === 'wipeout' ? 'WIPEOUT' :
                      ev.type === 'deflect' ? 'DEFLECTION' :
                      ev.type === 'prodigy' ? 'UNTOUCHABLE' :
                      ev.type === 'collateral' ? 'BALL COLLISION' :
                      ev.type.replace(/-/g, ' ').toUpperCase();

      steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card ${ev.type === 'wipeout' ? 'als-shake' : ''}" data-type="${cardType}" style="opacity:0">
        <div class="als-card-hdr">
          ${_av(r.name)} <span class="als-card-title">${r.name}</span>
          <span class="als-badge ${badgeCls}">${evLabel}</span>
        </div>
        <div class="als-card-body">${ev.text}</div>
      </div>`);
      stepMeta.push({ type: 'event', name: r.name, evType: ev.type });
      stepIdx++;
    }

    // Runner summary card
    const plumDots = Array.from({length: mxP}, (_, i) =>
      `<span class="als-plum-dot${i < r.plums ? ' full' : ''}">${_icon('flame')}</span>`
    ).join('');
    const rh = r.rawHits || 0;
    const neg = r.negatedHits || 0;
    const verdict = rh === 0 ? 'CLEAN' : rh >= 3 ? 'BATTERED' : 'BRUISED';
    const verdictCls = rh === 0 ? 'pos' : rh >= 3 ? 'neg' : 'neu';
    const halfMax = Math.ceil(mxP / 2);

    const statRows = [];
    const hitsLabel = neg > 0 ? `${rh} (${neg} negated)` : `${rh}`;
    statRows.push(`<div class="als-run-stat"><span class="k">${_icon('soccer')} Hits Taken</span><span class="v ${verdictCls}">${hitsLabel} — ${verdict}</span></div>`);
    if (intentMisses) statRows.push(`<div class="als-run-stat"><span class="k">${_icon('shield')} Plums Saved</span><span class="v pos">${intentMisses}</span></div>`);
    if (headshots) statRows.push(`<div class="als-run-stat"><span class="k">${_icon('skull')} Headshots</span><span class="v neg">${headshots}</span></div>`);
    if (revengeKicks) statRows.push(`<div class="als-run-stat"><span class="k">${_icon('skull')} Revenge Kicks</span><span class="v neg">${revengeKicks}</span></div>`);
    if (jukes) statRows.push(`<div class="als-run-stat"><span class="k">${_icon('paw')} Dodge Jukes</span><span class="v pos">${jukes}</span></div>`);
    if (taunts) statRows.push(`<div class="als-run-stat"><span class="k">${_icon('soccer')} Taunts Whiffed</span><span class="v pos">${taunts}</span></div>`);
    if (panics) statRows.push(`<div class="als-run-stat"><span class="k">${_icon('soccer')} Choked Kicks</span><span class="v pos">${panics}</span></div>`);
    const effectiveHits = rh - neg;
    const sv = r.savedPlums || 0;
    const isWipeout = r.plums === 1 && r.events?.some(e => e.type === 'wipeout');
    let plumBreakdown;
    if (isWipeout) {
      plumBreakdown = `WIPEOUT — <strong>0</strong> / ${mxP}`;
    } else {
      const breakdownParts = [`${mxP} max`];
      if (effectiveHits > 0) breakdownParts.push(`−${effectiveHits} knocked`);
      plumBreakdown = `${breakdownParts.join(' ')} = <strong>${r.plums}</strong> / ${mxP}`;
    }
    statRows.push(`<div class="als-run-stat" style="grid-column:1/-1"><span class="k">${_icon('flame')} Plums</span><span class="v" style="font-family:'Anton',sans-serif;font-size:16px;color:${r.plums >= halfMax ? 'var(--als-poison)' : 'var(--als-blood)'};">${plumBreakdown}</span></div>`);

    steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" data-type="${r.plums >= halfMax ? 'encounter' : 'host'}" style="opacity:0">
      <div class="als-card-hdr">
        ${_av(r.name)} <span class="als-card-title">${r.name} — Run Complete</span>
        <span class="als-badge ${r.plums >= halfMax + 1 ? 'als-b-encounter' : r.plums <= 2 ? 'als-b-hazard' : 'als-b-gather'}">${r.plums} PLUM${r.plums !== 1 ? 'S' : ''}</span>
      </div>
      <div class="als-run-summary">
        <div class="als-plum-strip">${plumDots}</div>
        <div class="als-run-stats">${statRows.join('')}</div>
      </div>
    </div>`);
    stepMeta.push({ type: 'summary', name: r.name, plums: r.plums, hits: r.hits });
    stepIdx++;

    // Flavor text between runners
    if (ri < d.sockerResults.length - 1 && Math.random() < 0.5) {
      const flavor = pickFresh(ATTENBOROUGH, 'atten-p1');
      steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" data-type="flavor" style="opacity:0">
        <span class="als-freq">CH-07:</span> ${flavor}
      </div>`);
      stepMeta.push({ type: 'flavor' });
      stepIdx++;
    }
  }

  // Phase 1 leaderboard card
  const sorted = [...d.sockerResults].sort((a, b) => b.plums - a.plums);
  const lbRows = sorted.map((r, i) => {
    const mxP = r.maxPlums || 6;
    const bar = Math.round((r.plums / mxP) * 100);
    return `<div class="als-lb-row">
      <span class="als-lb-rank">#${i + 1}</span>
      ${_av(r.name, 'sm')}
      <span class="als-lb-name">${r.name}</span>
      <div class="als-lb-bar"><div class="als-lb-fill" style="width:${bar}%;background:${r.plums >= Math.ceil(mxP / 2) ? 'var(--als-poison)' : r.plums >= Math.ceil(mxP / 3) ? 'var(--als-gold)' : 'var(--als-blood)'};"></div></div>
      <span class="als-lb-val">${r.plums}</span>
    </div>`;
  }).join('');
  steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" data-type="host" style="opacity:0">
    <div class="als-card-hdr">
      <span class="als-card-title">${_icon('binoculars')} Phase 1 Complete — Plum Leaderboard</span>
      <span class="als-badge als-b-phase">RESULTS</span>
    </div>
    <div class="als-card-body" style="margin-top:4px;">
      <div style="font-family:'Special Elite',cursive;font-size:12px;color:rgba(240,224,194,0.6);margin-bottom:10px;">
        Every plum is a throw in Phase 2. More plums = more chances to crack your gourd and earn tranq darts.
      </div>
      ${lbRows}
    </div>
  </div>`);
  stepMeta.push({ type: 'leaderboard' });
  stepIdx++;

  const total = steps.length;
  window._als_p1_total = total;
  window._als_p1_meta = stepMeta;
  const html = `
<div class="als-phases">
  <span class="als-phase-tab active"><span class="tab-num">01</span>SOCK-ET</span>
  <span class="als-phase-tab"><span class="tab-num">02</span>GOURD</span>
  <span class="als-phase-tab"><span class="tab-num">03</span>HUNT</span>
</div>
<div class="als-layout"><div class="als-main">${steps.join('\n')}</div>
<div class="als-sidebar" id="als-sidebar-inner">${_buildSidebarContent(ep, key)}</div></div>
<div class="als-controls" id="als-controls-${key}">
  <button onclick="window.safariRevealNext('${key}',${total})">REVEAL NEXT</button>
  <span class="counter" id="als-counter-${key}">0 / ${total}</span>
  <button onclick="window.safariRevealAll('${key}',${total})">REVEAL ALL</button>
</div>`;
  return _shell(html, ep, 'phase-golden');
}

export function rpBuildSafariPhase2(ep) {
  const d = ep.challengeData;
  if (!d?.gourdResults) return '';
  const steps = [];
  const stepMeta = [];
  const key = 'p2';

  steps.push(`<div id="als-step-${key}-0" class="als-card" data-type="host" style="opacity:0">
    <div class="als-card-hdr">
      <span class="als-card-title">${_icon('gourd')} Gourd Smash</span>
      <span class="als-badge als-b-smash">Phase 2</span>
    </div>
    <div class="als-host-quote">
      <span class="qmark">"</span>
      <div class="text">Each plum is one swing at a fresh gourd. Every gourd you smash becomes a tranq dart for the hunt. <em>Most gourds smashed gets a head start.</em>
      <span class="who">— ${host().toUpperCase()} · GOURD SMASH</span></div>
    </div>
  </div>`);
  stepMeta.push({ type: 'host' });

  let stepIdx = 1;
  for (const r of d.gourdResults) {
    const swings = r.swings || [];
    const hasSwings = swings.length > 0;

    // Player intro card — "stepping up to the gourd"
    const plumLabel = r.plums === 0 ? 'NO PLUMS' : `${r.plums} PLUM${r.plums !== 1 ? 'S' : ''}`;
    steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" data-type="host" style="opacity:0">
      <div class="als-card-hdr">
        ${_av(r.name, 'lg')} <span class="als-card-title">${r.name}</span>
        <span class="als-badge als-b-smash">${plumLabel}</span>
      </div>
      <div class="als-card-body" style="color:var(--als-bone);font-style:italic;">
        ${hasSwings
          ? `${r.name} steps up to the gourd station. ${r.plums} plum${r.plums !== 1 ? 's' : ''} loaded. ${r.plums} swing${r.plums !== 1 ? 's' : ''}.`
          : `${r.name} has no plums. No swings. ${pronouns(r.name).Sub} watches from the sideline.`}
      </div>
    </div>`);
    stepMeta.push({ type: 'gourd-intro', name: r.name });
    stepIdx++;

    // Each swing = its own reveal step
    let runningSmashed = 0;
    for (const sw of swings) {
      if (sw.smashed) runningSmashed++;

      let tag, tagCls, cardType, shakeCls = '';
      if (sw.batToss) { tag = 'BAT TOSS'; tagCls = 'als-kick-revenge'; cardType = 'encounter'; shakeCls = ' als-shake'; }
      else if (sw.ricochet) { tag = 'RICOCHET'; tagCls = 'als-kick-juke'; cardType = 'encounter'; shakeCls = ' als-shake'; }
      else if (sw.smashed) { tag = 'SMASH'; tagCls = 'als-kick-hit'; cardType = 'encounter'; shakeCls = ' als-gourd-burst'; }
      else if (sw.distracted) { tag = 'DISTRACTED'; tagCls = 'als-kick-taunt'; cardType = 'hazard'; }
      else { tag = 'WHIFF'; tagCls = 'als-kick-miss'; cardType = 'hazard'; }

      const progressDots = Array.from({ length: r.plums }, (_, i) => {
        const filled = i < sw.swing;
        const current = i === sw.swing - 1;
        return `<span class="als-sw-dot${filled ? ' filled' : ''}${current ? ' current' : ''}"></span>`;
      }).join('');

      steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card${shakeCls}" data-type="${cardType}" style="opacity:0">
        <div class="als-card-hdr">
          ${_av(r.name)} <span class="als-card-title">Swing ${sw.swing} / ${r.plums}</span>
          <span class="als-swing-progress">${progressDots}</span>
          <span class="${tagCls}">${tag}</span>
        </div>
        <div class="als-swing-body">${sw.narr || ''}</div>
        <div class="als-swing-tally">
          ${_icon('gourd')} <span class="${runningSmashed > 0 ? 'pos' : 'neg'}">${runningSmashed}</span> smashed so far
        </div>
      </div>`);
      stepMeta.push({ type: 'swing', name: r.name, swing: sw.swing, smashed: sw.smashed, runningSmashed });
      stepIdx++;
    }

    // Player result card — total gourds + darts
    const resultLabel = r.gourdsSmashed > 0
      ? `${r.gourdsSmashed} GOURD${r.gourdsSmashed !== 1 ? 'S' : ''} SMASHED`
      : 'ZERO SMASHED';
    const resBadgeCls = r.gourdsSmashed > 0 ? 'als-b-encounter' : 'als-b-hazard';
    const failText = r.events.filter(ev => ev.type === 'fail').map(ev => ev.text).join('');
    const advText = r.events.filter(ev => ev.type === 'hunt-advantage').map(ev => ev.text).join('');

    steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" data-type="${r.gourdsSmashed > 0 ? 'encounter' : 'hazard'}" style="opacity:0">
      <div class="als-card-hdr">
        ${_av(r.name)} <span class="als-card-title">${r.name} — Result</span>
        <span class="als-badge ${resBadgeCls}">${resultLabel}</span>
      </div>
      ${failText ? `<div class="als-card-body" style="font-style:italic;color:#cdd9e5;margin-bottom:6px">${failText}</div>` : ''}
      ${advText ? `<div class="als-card-body" style="font-style:italic;color:var(--als-poison);margin-bottom:6px">${advText}</div>` : ''}
      <div class="als-card-meta">
        <span>${_icon('gourd')} PLUMS <span class="neu">${r.plums}</span></span>
        <span>${_icon('gourd')} SMASHED <span class="${r.gourdsSmashed > 0 ? 'pos' : 'neg'}">${r.gourdsSmashed}</span></span>
        <span>${_icon('dart')} DARTS <span class="${r.tranqAmmo >= 3 ? 'pos' : 'neg'}">${r.tranqAmmo}</span></span>
        ${r.huntAdvantage ? `<span>${_icon('crosshair')} <span class="pos">HUNT ADVANTAGE</span></span>` : ''}
      </div>
    </div>`);
    stepMeta.push({ type: 'gourd-result', name: r.name, ammo: r.tranqAmmo, smashed: r.gourdsSmashed });
    stepIdx++;
  }

  // Final results summary card
  const ranked = [...d.gourdResults].sort((a, b) => b.gourdsSmashed - a.gourdsSmashed || b.tranqAmmo - a.tranqAmmo);
  const summaryRows = ranked.map((r, i) => {
    const rank = i + 1;
    const advTag = r.huntAdvantage ? `<span class="als-badge als-b-win" style="margin-left:8px;font-size:.7em">HUNT ADVANTAGE</span>` : '';
    const rowCls = rank === 1 ? 'als-summary-row-top' : r.gourdsSmashed === 0 ? 'als-summary-row-zero' : '';
    return `<div class="als-summary-row ${rowCls}">
      <span class="als-summary-rank">#${rank}</span>
      ${_av(r.name)} <span class="als-summary-name">${r.name}</span>
      <span class="als-summary-stat">${_icon('gourd')} ${r.gourdsSmashed}</span>
      <span class="als-summary-stat">${_icon('dart')} ${r.tranqAmmo} dart${r.tranqAmmo !== 1 ? 's' : ''}</span>
      ${advTag}
    </div>`;
  }).join('');
  steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" data-type="host" style="opacity:0">
    <div class="als-card-hdr">
      <span class="als-card-title">${_icon('gourd')} Gourd Smash — Final Results</span>
      <span class="als-badge als-b-smash">RESULTS</span>
    </div>
    <div class="als-summary-board">${summaryRows}</div>
  </div>`);
  stepMeta.push({ type: 'summary' });

  const total = steps.length;
  window._als_p2_total = total;
  window._als_p2_meta = stepMeta;
  const html = `
<div class="als-phases">
  <span class="als-phase-tab done"><span class="tab-num">01</span>SOCK-ET</span>
  <span class="als-phase-tab active"><span class="tab-num">02</span>GOURD</span>
  <span class="als-phase-tab"><span class="tab-num">03</span>HUNT</span>
</div>
<div class="als-layout"><div class="als-main">${steps.join('\n')}</div>
<div class="als-sidebar" id="als-sidebar-inner">${_buildSidebarContent(ep, key)}</div></div>
<div class="als-controls" id="als-controls-${key}">
  <button onclick="window.safariRevealNext('${key}',${total})">REVEAL NEXT</button>
  <span class="counter" id="als-counter-${key}">0 / ${total}</span>
  <button onclick="window.safariRevealAll('${key}',${total})">REVEAL ALL</button>
</div>`;
  return _shell(html, ep, 'phase-golden');
}

export function rpBuildSafariHunt(ep) {
  const d = ep.challengeData;
  if (!d?.huntTicks) return '';
  const steps = [];
  const stepMeta = [];
  const key = 'p3';
  let stepIdx = 0;

  steps.push(`<div id="als-step-${key}-0" class="als-card" data-type="host" style="opacity:0">
    <div class="als-card-hdr">
      <span class="als-card-title">${_icon('crosshair')} The Great Safari Hunt</span>
      <span class="als-badge als-b-hunt">Phase 3</span>
    </div>
    <div class="als-host-quote">
      <span class="qmark">"</span>
      <div class="text">Chef is out there. Somewhere. He's feral, he's fast, and he's angry. Find him. Track him. Tranq him. <em>First successful hit wins immunity.</em> The rest of you? Tribal council.
      <span class="who">— ${host().toUpperCase()} · THE HUNT BEGINS</span></div>
    </div>
  </div>`);
  stepMeta.push({ type: 'host' });
  stepIdx++;

  for (const tick of d.huntTicks) {
    const staminaPct = typeof tick.chefStamina === 'number' ? tick.chefStamina : 100;
    const staminaColor = staminaPct > 50 ? 'var(--als-poison)' : staminaPct > 15 ? 'var(--als-sun)' : 'var(--als-blood)';
    const staminaLabel = staminaPct <= 0 ? 'COLLAPSED' : staminaPct <= 15 ? 'EXHAUSTED' : staminaPct <= 50 ? 'WINDED' : 'ACTIVE';

    steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" data-type="host" style="opacity:0" data-tick="${tick.tick}">
      <div class="als-card-hdr">
        ${_chefAv('sm')}
        <span class="als-card-title">${tick.isNight ? _icon('skull') : _icon('binoculars')} Tick ${tick.tick}</span>
        <span class="als-badge ${tick.isNight ? 'als-b-hazard' : 'als-b-hunt'}">${tick.isNight ? 'NIGHT' : `TICK ${tick.tick}`}</span>
      </div>
      <div class="als-tick-stats">
        <span>Dodge: <strong>${tick.chefDodge.toFixed(1)}</strong></span>
        <span>Stamina: <span style="color:${staminaColor};font-weight:700">${staminaPct}%</span></span>
        <span>Status: <span style="color:${staminaColor}">${staminaLabel}</span></span>
      </div>
    </div>`);
    stepMeta.push({ type: 'tick', tick: tick.tick, isNight: tick.isNight, chefDodge: tick.chefDodge, chefStamina: staminaPct });
    stepIdx++;

    for (const ev of tick.events) {
      // Expanded card type mapping for new event types
      const SOCIAL_TYPES = new Set(['alliance','theft','rivalry','rescue','share','intimidate','stampede','sighting','instinct',
        'hunt-pact','pact-betrayal','pact-honor','false-trail','false-trail-detected','zone-lure','zone-lure-resisted',
        'dart-trade','desperate-beg','beg-rejected','protection-racket','racket-refused','racket-stampede',
        'hold-fire','tier-up','chef-winded','chef-exhausted','chef-collapse','chef-flees','steal-kill']);
      const cardType = ev.type.includes('hazard') ? 'hazard' :
                       ev.type.includes('encounter') || ev.type.includes('tranq') || ev.type === 'desperation' ? 'encounter' :
                       ev.type === 'flavor' ? 'flavor' :
                       [...SOCIAL_TYPES].some(t => ev.type.includes(t)) ? 'social' : 'host';

      if (ev.type === 'flavor') {
        steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" data-type="flavor" style="opacity:0">
          <span class="als-freq">FIELD NOTE:</span> ${ev.text}
        </div>`);
        stepMeta.push({ type: 'flavor' });
      } else {
        const playerDisplay = _evAvatars(ev);
        const badgeType = ev.type.includes('hazard') ? 'als-b-hazard' :
                         ev.type.includes('encounter') || ev.type.includes('tranq') ? 'als-b-encounter' :
                         ev.type.includes('pact') || ev.type.includes('trade') || ev.type.includes('rescue') || ev.type === 'pact-honor' ? 'als-b-social' :
                         ev.type.includes('betray') || ev.type.includes('racket') || ev.type.includes('false-trail') || ev.type.includes('lure') || ev.type.includes('theft') ? 'als-b-hazard' :
                         ev.type.includes('hit') || ev.type.includes('collapse') ? 'als-b-win' :
                         ev.type.includes('tier') || ev.type === 'hold-fire' ? 'als-b-gather' : 'als-b-hunt';
        const label = ev.type.replace(/-/g, ' ').toUpperCase();
        const shakeCls = ev.type.includes('tranq-hit') || ev.type.includes('collapse') || ev.type.includes('betray') || ev.type.includes('racket-stampede') ? ' als-shake' : '';
        steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card${shakeCls}" data-type="${cardType}" style="opacity:0">
          <div class="als-card-hdr">
            ${playerDisplay} <span class="als-card-title">${label}</span>
            <span class="als-badge ${badgeType}">${ev.hazard ? ev.hazard.toUpperCase() : label}</span>
          </div>
          <div class="als-card-body">${ev.text}</div>
        </div>`);
        stepMeta.push({ type: 'hunt-event', player: ev.player, evType: ev.type, tick: tick.tick });
      }
      stepIdx++;
    }
  }

  if (d.immunityWinner) {
    steps.push(`<div id="als-step-${key}-${stepIdx}" class="als-card" style="opacity:0">
      <div class="als-winner">
        <div class="tag">${_icon('star')} IMMUNITY WINNER ${_icon('star')}</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0;">
          ${_av(d.immunityWinner, 'lg')} ${_chefAv('lg')}
        </div>
        <div class="nm">${d.immunityWinner}</div>
        <div class="sub">${d.winnerText || 'Wins immunity on the golden savanna.'}</div>
      </div>
    </div>`);
    stepMeta.push({ type: 'winner', name: d.immunityWinner });
    stepIdx++;
  }

  const total = steps.length;
  window._als_p3_total = total;
  window._als_p3_meta = stepMeta;
  const phaseCls = d.huntTicks.some(t => t.isNight) ? 'phase-night' : 'phase-golden';
  const html = `
<div class="als-phases">
  <span class="als-phase-tab done"><span class="tab-num">01</span>SOCK-ET</span>
  <span class="als-phase-tab done"><span class="tab-num">02</span>GOURD</span>
  <span class="als-phase-tab active"><span class="tab-num">03</span>HUNT</span>
</div>
<div class="als-layout"><div class="als-main">${steps.join('\n')}</div>
<div class="als-sidebar" id="als-sidebar-inner">${_buildSidebarContent(ep, key)}</div></div>
<div class="als-controls" id="als-controls-${key}">
  <button onclick="window.safariRevealNext('${key}',${total})">REVEAL NEXT</button>
  <span class="counter" id="als-counter-${key}">0 / ${total}</span>
  <button onclick="window.safariRevealAll('${key}',${total})">REVEAL ALL</button>
</div>`;
  return _shell(html, ep, phaseCls);
}

export function rpBuildSafariResults(ep) {
  const d = ep.challengeData;
  if (!d?.standings) return '';

  const rows = d.standings.map((s, i) => {
    const isWinner = s.name === d.immunityWinner;
    return `<div class="als-roster-row" style="${isWinner ? 'border:1px solid var(--als-gold);border-radius:3px;padding:8px;background:rgba(196,163,90,0.08);' : ''}">
      ${_av(s.name)}
      <div>
        <div class="als-roster-name">${isWinner ? _icon('star') + ' ' : ''}${s.name}${isWinner ? ' — IMMUNITY' : ''}</div>
        <div class="als-roster-detail">
          ${_icon('clue')} ${s.clues} clues · ${_icon('dart')} ${s.ammoSpent} spent · ${_icon('shield')} ${s.hazardsSurvived} survived · Score: ${s.finalScore}
        </div>
      </div>
      <div style="font-family:'Anton',sans-serif;font-size:18px;color:${isWinner ? 'var(--als-gold)' : 'var(--als-bone)'};">#${i + 1}</div>
    </div>`;
  }).join('');

  const html = `
<div class="als-phases">
  <span class="als-phase-tab done"><span class="tab-num">01</span>SOCK-ET</span>
  <span class="als-phase-tab done"><span class="tab-num">02</span>GOURD</span>
  <span class="als-phase-tab done"><span class="tab-num">03</span>HUNT</span>
</div>
<div style="padding:16px;">
  <div class="als-sbox">
    <div class="als-sbox-hdr">
      <span class="als-sbox-title">${_icon('binoculars')} Final Safari Standings</span>
      <span class="als-sbox-meta">HUNT COMPLETE</span>
    </div>
    ${rows}
  </div>
</div>`;
  return _shell(html, ep);
}

// ══════════════════════════════════════════════════════════════
// SIDEBAR BUILDER
// ══════════════════════════════════════════════════════════════

function _buildSidebarContent(ep, screenKey) {
  const d = ep.challengeData;
  if (!d) return '';
  const st = _tvState[screenKey] || { idx: -1 };
  const meta = window[`_als_${screenKey}_meta`] || [];
  const revealedIdx = st.idx;

  // Collect revealed player names from stepMeta
  const revealedPlayers = new Set();
  const playerLastData = {};
  for (let i = 0; i <= revealedIdx && i < meta.length; i++) {
    const m = meta[i];
    if (m.name) {
      revealedPlayers.add(m.name);
      playerLastData[m.name] = m;
    }
    if (m.player) {
      revealedPlayers.add(m.player);
      if (!playerLastData[m.player]) playerLastData[m.player] = m;
    }
  }

  let html = '';

  // Phase progress
  const p1Cls = screenKey === 'p1' ? 'now' : (screenKey === 'p2' || screenKey === 'p3') ? 'done' : '';
  const p2Cls = screenKey === 'p2' ? 'now' : screenKey === 'p3' ? 'done' : '';
  const p3Cls = screenKey === 'p3' ? 'now' : '';
  html += `<div class="als-sbox"><div class="als-sbox-hdr"><span class="als-sbox-title">${_icon('binoculars')} Progress</span></div>
    <div class="als-progress">
      <div class="als-prog-step ${p1Cls}"><span class="n">01</span>SOCK-ET</div>
      <div class="als-prog-step ${p2Cls}"><span class="n">02</span>GOURD</div>
      <div class="als-prog-step ${p3Cls}"><span class="n">03</span>HUNT</div>
    </div></div>`;

  // Target tracker — Chef dossier with stamina bar
  const lastTick = screenKey === 'p3' ? meta.filter((m, i) => i <= revealedIdx && m.type === 'tick').pop() : null;
  const chefStam = lastTick?.chefStamina ?? 100;
  const stamColor = chefStam > 50 ? 'var(--als-poison)' : chefStam > 15 ? 'var(--als-sun)' : 'var(--als-blood)';
  const chefStatus = chefStam <= 0 ? 'COLLAPSED' : chefStam <= 15 ? 'EXHAUSTED' : chefStam <= 50 ? 'WINDED' : lastTick?.isNight ? 'NIGHT STALKING' : 'FERAL';
  html += `<div class="als-sbox als-target-box"><div class="als-sbox-hdr"><span class="als-sbox-title">${_icon('crosshair')} Target</span>
    <span class="als-sbox-meta" style="color:${stamColor}">${chefStatus}</span></div>
    <div class="als-target-mug">
      ${_chefAv('lg')}
      <div class="als-target-info">
        <div class="nm">Chef Hatchet</div>
        <div class="stat">STATUS: ${chefStatus}</div>
      </div>
    </div>
    <div class="als-stamina-bar">
      <div class="als-stamina-label">STAMINA</div>
      <div class="als-stamina-track"><div class="als-stamina-fill" style="width:${chefStam}%;background:${stamColor};${chefStam <= 15 ? 'animation:als-blink 1s infinite;' : ''}"></div></div>
      <div class="als-stamina-pct" style="color:${stamColor}">${chefStam}%</div>
    </div>
    <div class="als-target-detail">
      <div class="k">Dodge</div><div class="v">${lastTick ? lastTick.chefDodge.toFixed(1) : '8.0'}</div>
      <div class="k">Tick</div><div class="v">${lastTick ? lastTick.tick : '—'}</div>
      <div class="k">Mode</div><div class="v">${lastTick?.isNight ? '<span style="color:var(--als-blood)">NIGHT</span>' : 'DAY'}</div>
      <div class="k">Threat</div><div class="v" style="color:${stamColor};">${chefStam > 50 ? 'HIGH' : chefStam > 15 ? 'MEDIUM' : 'LOW'}</div>
    </div></div>`;

  // Player roster — only show revealed players
  if (d.standings) {
    const revealedCount = revealedIdx < 0 ? 0 : revealedPlayers.size;
    const showAll = revealedIdx < 0; // before any reveals, show all as "waiting"
    html += `<div class="als-sbox"><div class="als-sbox-hdr"><span class="als-sbox-title">${_icon('dart')} Hunters</span>
      <span class="als-sbox-meta">${showAll ? d.standings.length : revealedCount} / ${d.standings.length}</span></div>`;

    for (const s of d.standings) {
      const isRevealed = showAll || revealedPlayers.has(s.name);
      const isWinner = s.name === d.immunityWinner;
      const dimStyle = !isRevealed ? 'opacity:0.25;' : '';

      if (screenKey === 'p1') {
        // Show plum count only for revealed runners
        const plumData = isRevealed ? d.sockerResults?.find(r => r.name === s.name) : null;
        const plums = plumData ? plumData.plums : '—';
        const hits = plumData ? plumData.hits : '—';
        html += `<div class="als-roster-row" style="${dimStyle}">
          ${_av(s.name, 'sm')}
          <div>
            <div class="als-roster-name">${s.name}</div>
            <div class="als-roster-detail">${_icon('soccer')} Plums: <strong style="color:${plumData && plumData.plums >= Math.ceil((plumData.maxPlums || 6) / 2) ? 'var(--als-poison)' : plumData ? 'var(--als-blood)' : 'inherit'}">${plums}${plumData ? ' / ' + (plumData.maxPlums || 6) : ''}</strong> · Hits: ${hits}</div>
          </div>
          <div class="als-roster-status"></div>
        </div>`;
      } else if (screenKey === 'p2') {
        // Progressive sidebar: show running smash count from revealed swings
        const gourdData = d.gourdResults?.find(r => r.name === s.name);
        const totalPlums = gourdData ? gourdData.plums : 0;

        // Count smashed so far from revealed stepMeta
        let revSmashed = 0, revSwings = 0, isDone = false;
        for (let i = 0; i <= revealedIdx && i < meta.length; i++) {
          const m = meta[i];
          if (m.name === s.name && m.type === 'swing') { revSwings++; if (m.smashed) revSmashed++; }
          if (m.name === s.name && m.type === 'gourd-result') isDone = true;
        }
        const hasStarted = revealedPlayers.has(s.name);
        const ammo = isDone ? gourdData?.tranqAmmo || 0 : revSmashed + 1;

        const swingDots = totalPlums > 0 ? Array.from({length: totalPlums}, (_, i) => {
          if (i >= revSwings) return `<span class="a spent"></span>`;
          const swMeta = meta.filter(m => m.name === s.name && m.type === 'swing')[i];
          return swMeta?.smashed ? `<span class="a"></span>` : `<span class="a spent"></span>`;
        }).join('') : '<span style="color:rgba(230,196,137,0.3)">—</span>';

        html += `<div class="als-roster-row" style="${dimStyle}">
          ${_av(s.name, 'sm')}
          <div>
            <div class="als-roster-name">${s.name}</div>
            <div class="als-roster-detail">${_icon('gourd')} ${hasStarted ? `${revSmashed} / ${totalPlums} smashed` : '?'} · ${_icon('dart')} ${hasStarted ? ammo : '?'} dart${ammo !== 1 ? 's' : ''}</div>
            ${hasStarted ? `<div class="als-ammo-mini">${swingDots}</div>` : ''}
          </div>
          <div class="als-roster-status">
            ${isDone && gourdData?.huntAdvantage ? `<span class="als-status-tag" style="color:var(--als-sun);border-color:rgba(251,210,74,.4);background:rgba(251,210,74,.08);">${_icon('crosshair')} ADVANTAGE</span>` : ''}
          </div>
        </div>`;
      } else {
        // Phase 3 — hunt: show ammo, awareness tier, pact (from tick snapshots)
        const totalAmmo = d.gourdResults?.find(g => g.name === s.name)?.tranqAmmo || 0;

        // Find latest revealed tick's player state for progressive data
        const lastRevTick = lastTick ? d.huntTicks?.find(t => t.tick === lastTick.tick) : null;
        const tickPS = lastRevTick?.playerStates?.find(p => p.name === s.name);
        const ammoLeft = isRevealed && tickPS ? tickPS.ammo : totalAmmo;
        const ammoDots = Array.from({length: Math.max(totalAmmo, 1)}, (_, i) =>
          `<span class="a${i >= ammoLeft ? ' spent' : ''}"></span>`).join('');

        const tierNames = ['TRACKING', 'SPOTTED', 'STALKING', 'AMBUSH'];
        const tierColors = ['rgba(230,196,137,0.3)', 'var(--als-sun)', 'var(--als-flame)', 'var(--als-blood)'];
        const awareness = isRevealed && tickPS ? (tickPS.awareness || 0) : 0;
        const tierTag = isRevealed ? `<span class="als-tier-tag" style="color:${tierColors[awareness]};border-color:${tierColors[awareness]}">${tierNames[awareness]}</span>` : '';

        const statusTag = isWinner && revealedPlayers.has(s.name) ? '<span class="als-status-tag" style="color:var(--als-gold);border-color:rgba(244,167,42,.4);background:rgba(244,167,42,.08);">IMMUNE</span>' : '';
        const pactPartner = tickPS?.pactPartner;
        const pactTag = isRevealed && pactPartner ? `<span style="font-family:'JetBrains Mono',monospace;font-size:7px;color:var(--als-tranq);opacity:.7">PACT: ${pactPartner}</span>` : '';

        html += `<div class="als-roster-row" style="${dimStyle}">
          ${_av(s.name, 'sm')}
          <div>
            <div class="als-roster-name">${s.name}${isWinner && isRevealed ? ' ★' : ''}</div>
            <div class="als-roster-detail">${_icon('dart')} ${ammoLeft} dart${ammoLeft !== 1 ? 's' : ''} ${tierTag}</div>
            <div class="als-ammo-mini">${ammoDots}</div>
            ${pactTag}
          </div>
          <div class="als-roster-status">
            ${statusTag}
            ${isRevealed && s.hazardsSurvived > 0 ? `<span style="font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(230,196,137,0.4);">${_icon('shield')} ${s.hazardsSurvived}</span>` : ''}
          </div>
        </div>`;
      }
    }
    html += '</div>';
  }

  // Zone map (Phase 3 only)
  if (screenKey === 'p3') {
    html += `<div class="als-sbox"><div class="als-sbox-hdr"><span class="als-sbox-title">${_icon('paw')} Savanna Map</span>
      <span class="als-sbox-meta">${lastTick ? `TICK ${lastTick.tick}` : 'STANDBY'}</span></div>
      <div class="als-map">
        <div class="als-map-zone water">WATER</div>
        <div class="als-map-zone brush">BRUSH</div>
        <div class="als-map-zone quicksand">MUD</div>
        <div class="als-map-zone rocks">ROCKS</div>
        <div class="als-map-dot als-map-chef" style="top:50%;left:50%;" data-tag="CHEF?">${_chefAv('sm')}</div>
      </div>
      <div class="als-map-legend">
        <div class="als-map-leg-item"><div class="als-map-leg-dot" style="background:var(--als-tranq)"></div>Water</div>
        <div class="als-map-leg-item"><div class="als-map-leg-dot" style="background:var(--als-poison)"></div>Brush</div>
        <div class="als-map-leg-item"><div class="als-map-leg-dot" style="background:var(--als-dust)"></div>Quicksand</div>
        <div class="als-map-leg-item"><div class="als-map-leg-dot" style="background:var(--als-terra)"></div>Rocks</div>
      </div></div>`;
  }

  return html;
}
