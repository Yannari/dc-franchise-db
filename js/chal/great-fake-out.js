// js/chal/great-fake-out.js — The Great Fake-Out: post-merge vehicle race + eating gauntlet
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
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

// ══════════════════════════════════════════════════════════════
// VEHICLE DATA
// ══════════════════════════════════════════════════════════════
const VEHICLES = [
  { name: 'Skateboard',      tier: 1, mult: 1.3 },
  { name: 'Bicycle',         tier: 1, mult: 1.3 },
  { name: 'Rickshaw',        tier: 2, mult: 1.0 },
  { name: 'Tricycle',        tier: 2, mult: 1.0 },
  { name: 'Donkey',          tier: 3, mult: 0.75 },
  { name: 'Pogo Stick',      tier: 3, mult: 0.75 },
  { name: 'Wooden Sandals',  tier: 4, mult: 0.55 },
  { name: 'Wheelbarrow',     tier: 4, mult: 0.55 },
];

// ══════════════════════════════════════════════════════════════
// DISH DATA
// ══════════════════════════════════════════════════════════════
const DISH_POOL = [
  { name: 'Fermented Century Egg Pudding',  diff: 1, desc: 'A thousand years of patience, ruined in one bite.' },
  { name: 'Spicy Brain Jelly',              diff: 2, desc: 'Wobbles more than your confidence.' },
  { name: 'Live Tentacle Soup',             diff: 3, desc: 'Still moving. Still angry.' },
  { name: 'Durian Eyeball Stew',            diff: 4, desc: 'Smells like regret looks like nightmares.' },
  { name: 'Fermented Fish Intestine Paste',  diff: 3, desc: 'The chef who made this has been fired.' },
  { name: 'Mystery Organ Surprise',         diff: 2, desc: 'Even the host won\'t say what it is.' },
  { name: 'Deep-Fried Tarantula Cluster',   diff: 4, desc: 'Eight legs of terror in every bite.' },
  { name: 'Rancid Tofu Soufflé',       diff: 1, desc: 'Light, airy, and absolutely putrid.' },
  { name: 'Jellied Eel Brain Smoothie',     diff: 3, desc: 'Thick, gray, and disturbingly warm.' },
  { name: 'Charred Scorpion Skewers',       diff: 2, desc: 'The tail still stings.' },
  { name: 'Pickled Pig Snout Tartare',      diff: 1, desc: 'Raw nose. On a cracker.' },
  { name: 'Blood Sausage Slurpee',          diff: 4, desc: 'A frozen nightmare in a cup.' },
  { name: 'Maggot Cheese Fondue',           diff: 5, desc: 'The cheese moves. The maggots don\'t.' },
  { name: 'Fermented Shark Fin Mush',       diff: 5, desc: 'Buried underground for six months. Dug up for your suffering.' },
];

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════

// ── Phase 0: Scramble ──
const SCRAMBLE_GRAB = [
  (n, pr, v) => `${n} darts through the depot and snatches the ${v}. ${pr.Sub} grins — not bad.`,
  (n, pr, v) => `${n} shoulders past the crowd and grabs the ${v} before anyone else can reach it.`,
  (n, pr, v) => `The ${v} catches ${n}'s eye. ${pr.Sub} claims it without hesitation.`,
  (n, pr, v) => `${n} weaves between the other players and locks down the ${v}. Smart pick.`,
  (n, pr, v) => `${n} spots the ${v} and makes a beeline. Got wheels — or close enough.`,
  (n, pr, v) => `${n} slides across the depot floor and emerges clutching the ${v}. First come, first served.`,
];

const SCRAMBLE_MANIPULATE = [
  (actor, target, vBad, aPr) => `${actor} slides up to ${target} with a smile. "Trust me, the ${vBad} is actually the fastest." ${target} falls for it.`,
  (actor, target, vBad, aPr) => `${actor} whispers to ${target}: "I heard the ${vBad} has a hidden turbo mode." It doesn't.`,
  (actor, target, vBad, aPr) => `${actor} points ${target} toward the ${vBad}. "That's what the pros pick." ${target} doesn't question it.`,
  (actor, target, vBad, aPr) => `${actor} blocks ${target}'s path to the better vehicles. "Oh, those are taken. But the ${vBad} is right there." Pure scheme.`,
  (actor, target, vBad, aPr) => `"${target}, you WANT the ${vBad}," ${actor} insists with false confidence. ${target} hesitates, then grabs it.`,
  (actor, target, vBad, aPr) => `${actor} casually kicks the ${vBad} toward ${target}. "You'd look great on that." Manipulation at its finest.`,
];

const SCRAMBLE_SHOVE = [
  (a, b) => `${a} shoves ${b} out of the way. Hard. The depot goes quiet for a second.`,
  (a, b) => `${a} and ${b} reach for the same vehicle. ${a} uses an elbow. ${b} hits the floor.`,
  (a, b) => `${a} hip-checks ${b} into a pile of tires. Not subtle. Not sorry.`,
  (a, b) => `${a} straight-up pushes ${b} aside. ${b} stumbles. The rivalry is real.`,
  (a, b) => `${a} shoulder-charges ${b} on the way past. No words needed — the message is clear.`,
];

const SCRAMBLE_HELP = [
  (helper, target, v, hPr) => `${helper} spots the ${v} and waves ${target} over. "Take this one — it's solid." Genuine loyalty.`,
  (helper, target, v, hPr) => `${helper} saves the ${v} for ${target}. "I got your back." ${target} nods — alliance intact.`,
  (helper, target, v, hPr) => `${helper} points ${target} toward the ${v} before anyone else notices. Real friend move.`,
  (helper, target, v, hPr) => `${helper} body-blocks another player so ${target} can grab the ${v}. That's an ally.`,
  (helper, target, v, hPr) => `"Over here!" ${helper} calls out. ${target} sees the ${v} and grabs it. Teamwork in a solo game.`,
];

const SCRAMBLE_LAST_PICK = [
  (n, pr, v) => `${n} is the last one to the depot. All that's left is the ${v}. ${pr.Sub} stares at it in disbelief.`,
  (n, pr, v) => `${n} arrives at the depot and finds... the ${v}. The absolute bottom of the barrel. ${pr.Sub} sighs.`,
  (n, pr, v) => `Everyone else is already gone. ${n} picks up the ${v}. It's either this or walking.`,
  (n, pr, v) => `${n} gets stuck with the ${v}. A glance at the other players' vehicles — pure envy.`,
  (n, pr, v) => `The ${v}. That's what ${n} gets. Last pick. ${pr.Sub} already knows this is going to hurt.`,
  (n, pr, v) => `${n} stares at the lone ${v} left in the depot. "${host()} really had this planned for me, didn't ${pr.sub}."`,
];

// ── Phase 1: Gauntlet Race ──
const RACE_GOOD_SEGMENT = [
  (n, pr, v, t) => `${n} tears through on the ${v} — ${t}s flat. The fortress can't touch ${pr.obj}.`,
  (n, pr, v, t) => `Clean run. ${n} pushes the ${v} hard and clocks ${t}s. No traps, no drama — just raw pace.`,
  (n, pr, v, t) => `The ${v} hums beneath ${n}. ${t}s. Making this segment look effortless.`,
  (n, pr, v, t) => `${n} finds the perfect line — ${t}s on the ${v}. Nobody's catching ${pr.obj} right now.`,
  (n, pr, v, t) => `${t}s! ${n} blazes through on the ${v}. The walls blur past. Absolute domination.`,
  (n, pr, v, t) => `${n} and the ${v} are in sync. ${t}s. ${pr.Sub} barely slowed down.`,
];

const RACE_AVG_SEGMENT = [
  (n, pr, v, t) => `${n} grinds through on the ${v}. ${t}s — middle of the pack. Nothing special, nothing disastrous.`,
  (n, pr, v, t) => `${t}s for ${n}. The ${v} holds steady but ${pr.sub} lost time on a tight corner.`,
  (n, pr, v, t) => `${n} pushes the ${v} through in ${t}s. Not ${pr.posAdj} best segment, not ${pr.posAdj} worst.`,
  (n, pr, v, t) => `The ${v} wobbles but ${n} recovers. ${t}s. Serviceable, but the leaders are pulling away.`,
  (n, pr, v, t) => `${n} fights the ${v} around a blind curve. ${t}s. ${pr.Sub} keeps ${pr.posAdj} position.`,
  (n, pr, v, t) => `${t}s. ${n} on the ${v}, holding ground but not gaining. The fortress isn't making it easy.`,
];

const RACE_SLOW_SEGMENT = [
  (n, pr, v, t) => `${n} struggles on the ${v} — ${t}s. The wheels catch on every crack in the stone.`,
  (n, pr, v, t) => `Rough segment. ${n} limps the ${v} through in ${t}s. Losing ground fast.`,
  (n, pr, v, t) => `${t}s. The ${v} is fighting ${n} more than the course is. This is painful to watch.`,
  (n, pr, v, t) => `${n} can barely keep the ${v} moving. ${t}s — dead last pace. Desperation on every pedal.`,
  (n, pr, v, t) => `The ${v} nearly dies under ${n}. ${t}s. Falling further behind with every meter.`,
  (n, pr, v, t) => `${t}s. ${n} wrestles the ${v} through sheer willpower. The gap to the pack is growing.`,
];

const RACE_TRAP_HIT = [
  (n, pr, trap, v) => `A tripwire snaps across ${n}'s path — the ${v} flips and ${pr.sub} goes tumbling! Precious seconds lost.`,
  (n, pr, trap, v) => `${n} hits a hidden pressure plate. A wall of slime dumps on ${pr.obj}. The ${v} skids sideways.`,
  (n, pr, trap, v) => `BOOM! A paint bomb explodes under the ${v}. ${n} swerves but can't avoid the blast.`,
  (n, pr, trap, v) => `${n} triggers a spring-loaded barrier. It slams into the ${v} and sends ${pr.obj} spinning.`,
  (n, pr, trap, v) => `Spike strip! The ${v} hits it hard. ${n} staggers and loses ground.`,
  (n, pr, trap, v) => `A net drops from the ceiling and catches ${n} mid-stride. The ${v} keeps rolling without ${pr.obj}.`,
  (n, pr, trap, v) => `The floor gives way under the ${v}. ${n} drops into a pit, scrambles out, and drags the ${v} back onto the wall.`,
  (n, pr, trap, v) => `A swinging log smashes into ${n}'s ${v}. ${pr.Sub} goes airborne for a second. The landing is ugly.`,
];

const RACE_TRAP_CHAIN = [
  (victim, original, vV) => `${victim}'s ${vV} catches the blast from ${original}'s trap! Collateral damage!`,
  (victim, original, vV) => `The shockwave from ${original}'s trap sends debris flying into ${victim}'s ${vV}. Wrong place, wrong time.`,
  (victim, original, vV) => `${victim} was right behind ${original} when the trap went off. The ${vV} takes a direct hit.`,
  (victim, original, vV) => `${original}'s trap sends a chain reaction right into ${victim}'s path. The ${vV} rattles. Neither of them is happy.`,
  (victim, original, vV) => `"Watch out!" Too late. ${victim} rolls the ${vV} right through the mess left by ${original}'s trap.`,
  (victim, original, vV) => `Debris from ${original}'s trap ricochets off the wall and nails ${victim}'s ${vV}. Pure bad luck.`,
  (victim, original, vV) => `${victim} tries to dodge ${original}'s wreckage but the ${vV} clips it. Seconds lost.`,
  (victim, original, vV) => `The smoke from ${original}'s trap blinds ${victim}. The ${vV} slams into a stone column.`,
];

const RACE_RIVALRY_SPRINT = [
  (winner, loser) => `${winner} and ${loser} lock eyes. The sprint is ON. ${winner} edges ahead — barely — and ${loser} fumes behind.`,
  (winner, loser) => `${winner} pulls alongside ${loser}. Neck and neck. ${winner} digs deep and surges past. ${loser} falls back.`,
  (winner, loser) => `${winner} refuses to let ${loser} pass. They trade positions three times before ${winner} breaks free.`,
  (winner, loser) => `It's personal between ${winner} and ${loser}. The sprint is vicious. ${winner} wins the exchange. ${loser} stews.`,
  (winner, loser) => `${winner} catches ${loser}'s eye and accelerates. Pure rivalry fuel. ${loser} can't keep up.`,
];

const RACE_VEHICLE_BREAKDOWN = [
  (n, pr, v) => `${n}'s ${v} gives out mid-segment! A wheel pops off and rolls into a ditch.`,
  (n, pr, v) => `The ${v} shudders and collapses under ${n}. Nothing to do but drag the wreckage forward.`,
  (n, pr, v) => `Something snaps on ${n}'s ${v}. ${pr.Sub} grinds to a halt and stares at the broken vehicle in disbelief.`,
  (n, pr, v) => `${n}'s ${v} falls apart. Literally. Pieces scatter across the fortress wall. On foot from here.`,
  (n, pr, v) => `The ${v} wasn't built for this. ${n} watches helplessly as it disintegrates beneath ${pr.obj}.`,
];

const RACE_VEHICLE_RESCUE = [
  (rescuer, victim, rPr) => `${rescuer} circles back to help ${victim} patch the vehicle. "Come on, let's go!" Bond forged under pressure.`,
  (rescuer, victim, rPr) => `${rescuer} stops and pulls ${victim}'s ride back together. ${rPr.Sub} loses time, but gains a friend.`,
  (rescuer, victim, rPr) => `${rescuer} hands ${victim} a spare part from ${rPr.posAdj} own vehicle. "You need this more than me."`,
  (rescuer, victim, rPr) => `${rescuer} skids to a stop. "Get on." ${victim} hops on ${rescuer}'s vehicle for the rest of the segment.`,
];

const RACE_DIRTY_MOVE = [
  (villain, target, vPr) => `${villain} kicks a loose stone into ${target}'s path. ${target} swerves and loses control.`,
  (villain, target, vPr) => `${villain} subtly cuts off ${target} at a narrow section. ${target} has to brake hard.`,
  (villain, target, vPr) => `${villain} reaches over and grabs ${target}'s vehicle. A tug. A stumble. ${target} falls behind.`,
  (villain, target, vPr) => `${villain} throws debris behind ${vPr.obj}. ${target} rides straight into it. Classic dirty racing.`,
  (villain, target, vPr) => `${villain} bumps ${target} into the wall. "Oops." Not even a little sorry.`,
  (villain, target, vPr) => `${villain} "accidentally" veers into ${target}'s lane. ${target} has nowhere to go but the gutter.`,
];

const RACE_ENCOURAGE = [
  (helper, target, hPr) => `"You got this, ${target}!" ${helper} shouts from ahead. The encouragement lands. ${target} pushes harder.`,
  (helper, target, hPr) => `${helper} drops back to ride alongside ${target}. "Stay with me. We finish together." ${target} finds a second wind.`,
  (helper, target, hPr) => `${helper} flashes ${target} a thumbs up. Simple gesture, but it works. ${target} picks up the pace.`,
  (helper, target, hPr) => `"Don't give up!" ${helper} calls back to ${target}. The words hit different when you're exhausted.`,
  (helper, target, hPr) => `${helper} slows down just enough for ${target} to catch up. "We're almost through this." Genuine support.`,
];

const RACE_FINISH_FIRST = [
  (n, pr, v) => `${n} blazes across the finish line on the ${v}! First place — and it wasn't even close.`,
  (n, pr, v) => `The ${v} screeches to a stop. ${n} hops off, arms raised. Nobody else is even in sight.`,
  (n, pr, v) => `${n} and the ${v} cross the line in first. ${pr.Sub} didn't just win the race — ${pr.sub} dominated it.`,
  (n, pr, v) => `FIRST PLACE! ${n} on the ${v}, untouchable from start to finish. The fortress belongs to ${pr.obj}.`,
];

const RACE_FINISH_TOP = [
  (n, pr, place, v) => `${n} rolls the ${v} across the line — ${_ordinal(place)} place. Solid run.`,
  (n, pr, place, v) => `The ${v} holds together just long enough. ${n} finishes ${_ordinal(place)}. ${pr.Sub} exhales.`,
  (n, pr, place, v) => `${_ordinal(place)} place: ${n}. The ${v} served ${pr.obj} well out there.`,
  (n, pr, place, v) => `${n} crosses in ${_ordinal(place)}. ${pr.Sub} pats the ${v}. "We made it."`,
];

const RACE_FINISH_MID = [
  (n, pr, place, v) => `${n} limps the ${v} across the finish. ${_ordinal(place)} place. Could've been worse.`,
  (n, pr, place, v) => `${_ordinal(place)} for ${n}. The ${v} is barely recognizable. Just glad it's over.`,
  (n, pr, place, v) => `${n} drags the battered ${v} across the line. ${_ordinal(place)} place — survival, not victory.`,
  (n, pr, place, v) => `${n} finishes ${_ordinal(place)} on what's left of the ${v}. ${pr.Sub} collapses past the finish.`,
];

const RACE_FINISH_BOTTOM = [
  (n, pr, place, v) => `${n} crawls across the line in ${_ordinal(place)}. The ${v} gave up two segments ago.`,
  (n, pr, place, v) => `${_ordinal(place)} place. ${n} is carrying the ${v} at this point, not riding it.`,
  (n, pr, place, v) => `${n} staggers across in ${_ordinal(place)}. The ${v} is in pieces. So is ${pr.posAdj} dignity.`,
  (n, pr, place, v) => `${n} and the wreckage of the ${v} finally cross the line. ${_ordinal(place)} — barely.`,
];

const RACE_ELIMINATED = [
  (n, pr, v) => `${n} finishes dead last. The ${v} is a pile of scrap. ${host()} points to the sideline. "Sorry, ${n}. You're done."`,
  (n, pr, v) => `Last place. ${n} is cut from the eating gauntlet. ${pr.Sub} slumps onto the ruined ${v} and watches from the bench.`,
  (n, pr, v) => `The ${v} dies three feet from the line. ${n} pushes it across on foot. Last place. No eating round.`,
  (n, pr, v) => `${n} crawls across the finish on the destroyed ${v}. ${host()}: "The race has spoken. You're out of phase two."`,
  (n, pr, v) => `Dead last. ${n} kicks the ${v} in frustration. ${pr.Sub} watches the survivors line up at the table, powerless.`,
  (n, pr, v) => `${host()}: "${n}, you finished last. Which means you don't get to eat any disgusting food. Lucky you." ${n} doesn't look like ${pr.sub} agrees.`,
];

// ── Phase 2: Eating Gauntlet ──
const EAT_DISH_PRESENT = [
  (dish) => `${host()} lifts the cloche. "${dish.name}." The contestants stare in horror. ${dish.desc}`,
  (dish) => `"Round ${dish.round}: ${dish.name}." ${host()} is grinning. Nobody else is. ${dish.desc}`,
  (dish) => `The platter arrives. ${dish.name}. ${dish.desc} Several players gag just looking at it.`,
  (dish) => `${host()}: "Today's delicacy — ${dish.name}." ${dish.desc} The silence is deafening.`,
  (dish) => `Chef slams the plate down. ${dish.name}. ${dish.desc} Even the camera crew looks uncomfortable.`,
  (dish) => `"Bon appetit." ${host()} unveils ${dish.name}. ${dish.desc} Someone in the back whispers a prayer.`,
];

const EAT_SUCCESS = [
  (n, pr, dish) => `${n} shoves it down in one go. ${pr.Sub} doesn't even flinch. Impressive.`,
  (n, pr, dish) => `${n} chews, swallows, and opens ${pr.posAdj} mouth. Clean plate. The table erupts.`,
  (n, pr, dish) => `${n} powers through the ${dish} like it's nothing. No taste buds or an iron will — one of the two.`,
  (n, pr, dish) => `${n} finishes and slams ${pr.posAdj} fork down. "${pr.Sub === 'They' ? 'They want' : pr.Sub + ' wants'} seconds." Absolutely unhinged.`,
  (n, pr, dish) => `The plate is clean before anyone else has taken a second bite. ${n} sits back, arms crossed. Next.`,
  (n, pr, dish) => `${n} eats methodically. No drama. No gagging. Just pure execution.`,
  (n, pr, dish) => `${n} finishes the ${dish}, licks ${pr.posAdj} lips, and stares down the rest of the table. Dominance.`,
  (n, pr, dish) => `${n} treats the ${dish} like breakfast cereal. Two bites and it's gone. The table is stunned.`,
  (n, pr, dish) => `Plate empty. Mouth clean. ${n} even reaches for a napkin. Makes it look effortless.`,
  (n, pr, dish) => `${n} swallows, exhales once, and pushes the plate forward for more. ${host()} raises an eyebrow.`,
];

const EAT_STRUGGLE = [
  (n, pr, dish) => `${n} takes thirty seconds to get the first bite down. Barely survives. But survives.`,
  (n, pr, dish) => `${n}'s face turns green. ${pr.Sub} gags three times. But it goes down. Barely.`,
  (n, pr, dish) => `It takes everything ${n} has. Chewing with tears streaming. The dish almost wins. Almost.`,
  (n, pr, dish) => `${n} holds ${pr.posAdj} nose, closes ${pr.posAdj} eyes, and forces it down. ${pr.Sub} dry-heaves but keeps it in.`,
  (n, pr, dish) => `"I can't do this." ${n} stares at the plate. Then ${pr.sub} does it anyway. Willpower over stomach.`,
  (n, pr, dish) => `${n} puts it in ${pr.posAdj} mouth and immediately regrets it. But spitting it out means losing. One hard swallow. Done.`,
  (n, pr, dish) => `${n}'s hand shakes lifting the fork. The first bite takes ten seconds of chewing. The second takes twenty. But the plate empties.`,
  (n, pr, dish) => `Tears roll down ${n}'s face — gagging between bites, barely holding on. But ${n} keeps going. The table watches in horrified respect.`,
  (n, pr, dish) => `${n} slams the table. Breathes. Picks up the fork again. It's ugly, but the plate empties.`,
  (n, pr, dish) => `${n} needs water between every bite. Looks like quitting three separate times. Doesn't.`,
];

// Close fail — player tried hard but couldn't finish (roll close to threshold)
const EAT_FAIL_CLOSE = [
  (n, pr, dish) => `${n} tries. Really tries. But the body says no. The fork drops and ${host()} calls it.`,
  (n, pr, dish) => `${n} gets halfway through and stops. Fork down, shaking hands. "I can't." ${host()} points to the exit.`,
  (n, pr, dish) => `${n} stands up mid-bite, covers ${pr.posAdj} mouth, and bolts. ${host()} doesn't even need to say it.`,
  (n, pr, dish) => `Two bites in and ${n} can't take it anymore. Out.`,
  (n, pr, dish) => `${n} tries the ${dish}. It comes back up. Done.`,
  (n, pr, dish) => `The ${dish} breaks ${n}. ${pr.Sub} spits it out and ${host()} rings the bell. Done.`,
];
// Hard fail — player gave up or didn't try (roll far below threshold)
const EAT_FAIL_HARD = [
  (n, pr, dish) => `${n} takes one look and pushes ${pr.posAdj} plate away. "I'm done." ${host()} nods. Out.`,
  (n, pr, dish) => `${n} refuses to eat. Stares at the plate, shakes ${pr.posAdj} head, steps back. Game over.`,
  (n, pr, dish) => `${n} can't do it. The dish wins. A quiet walk away from the table.`,
  (n, pr, dish) => `The fork never makes it to ${n}'s mouth a second time. A push back from the table. That's it.`,
  (n, pr, dish) => `${n} doesn't even pick up the fork. One look at the ${dish} and ${pr.sub}'s done. ${host()} doesn't argue.`,
  (n, pr, dish) => `"No. Absolutely not." ${n} pushes the plate away before the lid is even fully off. Out.`,
];

const EAT_PSYCH_OUT = [
  (villain, target, vPr) => `${villain} leans over to ${target}: "You know what that's made of, right?" ${target}'s confidence crumbles.`,
  (villain, target, vPr) => `${villain} describes the dish's ingredients in graphic detail to ${target}. Pure psychological warfare.`,
  (villain, target, vPr) => `${villain} makes eye contact with ${target} and slowly, deliberately gags. ${target}'s stomach does a flip.`,
  (villain, target, vPr) => `"You look pale, ${target}." ${villain} smirks. "Maybe you should quit before it gets worse." The seed of doubt is planted.`,
  (villain, target, vPr) => `${villain} chews ${vPr.posAdj} portion while staring directly at ${target}. The dominance display is crystal clear.`,
  (villain, target, vPr) => `${villain} whispers to ${target}: "I can hear your stomach from here." ${target} swallows hard — and not the food.`,
];

const EAT_STOMACH_STEEL = [
  (n, pr) => `${n} eats every bite without flinching. The rest of the table watches in awe. Absolute machine.`,
  (n, pr) => `While everyone else struggles, ${n} cleans ${pr.posAdj} plate like it's a regular Tuesday lunch.`,
  (n, pr) => `${n} finishes first. Again. Looks around the table. "What? It's not that bad."`,
  (n, pr) => `The weakest eater at the table glances at ${n}'s empty plate and loses all hope.`,
  (n, pr) => `${n} is in a different league. Calm, efficient, zero visible discomfort. Terrifying.`,
  (n, pr) => `${n} doesn't just survive the dish — ${pr.sub} enjoys it. Or at least looks like ${pr.sub} does. The intimidation factor is enormous.`,
];

const EAT_VOMIT_CHAIN = [
  (trigger, victim) => `${trigger}'s elimination triggers a wave of nausea. ${victim} gags — barely holds on.`,
  (trigger, victim) => `The sight of ${trigger} going down is too much for ${victim}. ${victim} fights back the urge.`,
  (trigger, victim) => `${victim} watches ${trigger} get eliminated and feels ${pronouns(victim).posAdj} own stomach turn. Chain reaction incoming.`,
  (trigger, victim) => `${trigger}'s exit sets off a domino effect. ${victim} clutches the table. "Don't look. Don't look." ${pronouns(victim).Sub} looks.`,
  (trigger, victim) => `${trigger} stumbling away from the table is the last straw. ${victim}'s stomach flips. ${pronouns(victim).Sub} grips the edge and holds on.`,
  (trigger, victim) => `The sound of ${trigger} retching echoes across the set. ${victim} goes pale. "Oh no. Oh no no no."`,
];

const DOUBLE_ELIM_REACTIONS = [
  (names, count, host) => `"${count} down in one round. That's a massacre." — ${host}`,
  (names, count, host) => `${names} — gone. Just like that. The table feels twice as empty.`,
  (names, count, host) => `"${names}! Both at once! I didn't plan for this kind of carnage!" — ${host}`,
  (names, count, host) => `A collective gasp from the crew. ${names} — eliminated in the same round. Brutal.`,
  (names, count, host) => `"We're losing them in bunches now. ${names}, you fought well. You lost, but you fought well." — ${host}`,
  (names, count, host) => `The remaining players stare at the empty seats where ${names} just sat. Nobody speaks for a moment.`,
];

const EAT_ENCOURAGE = [
  (helper, target, hPr) => `${helper} squeezes ${target}'s shoulder. "One more bite. You can do this." ${target} nods and keeps going.`,
  (helper, target, hPr) => `"Just think about something else," ${helper} tells ${target}. "Think about winning." It helps.`,
  (helper, target, hPr) => `${helper} eats alongside ${target}, matching pace. "Together. On three." The solidarity keeps ${target} going.`,
  (helper, target, hPr) => `${helper} quietly slides ${target} some water. "Wash it down fast." Small mercy, big impact.`,
];

const EAT_WINNER = [
  (n, pr) => `${n} is the last one standing. ${host()} places the immunity necklace around ${pr.posAdj} neck. "You earned it. Somehow."`,
  (n, pr) => `It's over. ${n} wins immunity. ${pr.Sub} ate things no human should eat, and ${pr.sub} survived.`,
  (n, pr) => `${host()}: "Against all odds, all stomachs, and all decency — ${n} wins immunity tonight!" ${n} raises ${pr.posAdj} arms.`,
  (n, pr) => `The table is empty except for ${n}. Everyone else quit, puked, or refused. ${n} gets the necklace.`,
  (n, pr) => `${n} stares at the empty chairs around ${pr.obj}. One by one they fell. But ${pr.sub} didn't. Immunity is ${pr.pos}.`,
  (n, pr) => `${host()} slow-claps. "${n}. The Great Fake-Out champion. And the only person still standing." ${n} tries to smile through the nausea.`,
];

const EAT_EATOFF = [
  (a, b) => `It comes down to ${a} and ${b}. One more dish. One more bite. Whoever finishes first wins immunity.`,
  (a, b) => `${host()}: "We have a tie. ${a} vs ${b}. Final eat-off. One plate. First to finish wins."`,
  (a, b) => `The table is cleared. A single plate placed between ${a} and ${b}. "Eat or go home."`,
  (a, b) => `Two players remain. ${a} and ${b} stare each other down across the table. ${host()} drops the final dish. "Go."`,
];

// ── Announcer / Host ──
const ANNOUNCER_RACE = [
  `"This is getting UGLY, folks!" — ${host()}`,
  `"I've seen toddlers ride better than that!" — ${host()}`,
  `"Remember, last place doesn't eat! Motivation enough?" — ${host()}`,
  `"The fortress doesn't care about your feelings!" — ${host()}`,
  `"If you thought the race was bad, WAIT until you see dinner!" — ${host()}`,
  `"That's gonna leave a mark. Several marks." — ${host()}`,
  `"Pogo stick versus skateboard? That's just cruel. I love it." — ${host()}`,
  `"These booby traps were Chef's idea. Blame him." — ${host()}`,
  `"Every second counts! Unless you're on sandals. Then nothing counts." — ${host()}`,
  `"I'd say 'may the best racer win' but honestly? Just surviving is a win today." — ${host()}`,
];

const ANNOUNCER_EAT = [
  `"If you can smell it from the audience, it's working." — ${host()}`,
  `"Chef outdid himself today. And by 'outdid' I mean 'went way too far.'" — ${host()}`,
  `"This isn't a cooking competition. This is punishment." — ${host()}`,
  `"Who needs enemies when you have a menu like this?" — ${host()}`,
  `"I genuinely don't know what's in that one. And I approved the budget." — ${host()}`,
  `"The human body was not designed for this. Let's find out anyway!" — ${host()}`,
  `"Three players left. Two stomachs remaining." — ${host()}`,
  `"If you throw up ON someone, that's a bonus point. Kidding. Maybe." — ${host()}`,
  `"The interns refused to taste-test these. All five of them quit." — ${host()}`,
  `"Fun fact: the fermentation process takes six months. The suffering is instant." — ${host()}`,
];

function _ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ══════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateGreatFakeOut(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!gs.campEvents) gs.campEvents = {};
  if (!gs.campEvents[campKey]) gs.campEvents[campKey] = [];

  ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  // ══════════════════════════════════════════════════════
  // PHASE 0 — VEHICLE SCRAMBLE
  // ══════════════════════════════════════════════════════
  const grabOrder = active.map(name => {
    const s = pStats(name);
    const score = (s.physical * 0.4 + s.boldness * 0.3 + s.endurance * 0.3) + noise(2.5);
    return { name, score };
  }).sort((a, b) => b.score - a.score);

  // Shuffle vehicle pool — pick as many as active players, cycling if needed
  const availableVehicles = [];
  const shuffled = [...VEHICLES].sort(() => Math.random() - 0.5);
  while (availableVehicles.length < active.length) {
    availableVehicles.push(...shuffled.slice(0, active.length - availableVehicles.length));
  }

  const vehicleAssignments = [];
  const nameToVehicle = {};
  const remainingVehicles = [...availableVehicles];
  grabOrder.forEach((entry, i) => {
    const s = pStats(entry.name);
    // Higher mental+intuition = stronger pull toward better-tier vehicles
    const smarts = s.mental * 0.6 + s.intuition * 0.4 + noise(2.5);
    const weights = remainingVehicles.map(v => {
      const tierPenalty = (v.tier - 1) * smarts * 0.4;
      return Math.max(0.1, 10 - tierPenalty);
    });
    const totalW = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalW;
    let chosen = 0;
    for (let w = 0; w < weights.length; w++) {
      roll -= weights[w];
      if (roll <= 0) { chosen = w; break; }
    }
    const v = remainingVehicles.splice(chosen, 1)[0];
    const assignment = {
      name: entry.name, vehicle: v.name, vehicleName: v.name,
      tier: v.tier, tierMult: v.mult, grabOrder: i + 1,
    };
    vehicleAssignments.push(assignment);
    nameToVehicle[entry.name] = assignment;
  });

  // Scramble drama events (2-3 events)
  const scrambleDrama = [];
  const numDrama = 2 + (Math.random() < 0.5 ? 1 : 0);
  const usedDramaPlayers = new Set();

  for (let d = 0; d < numDrama; d++) {
    // Try manipulation (villain tricks someone into worse vehicle)
    const villains = active.filter(n => canScheme(n) && !usedDramaPlayers.has(n));
    const niceGuys = active.filter(n => NICE_ARCHS.has(arch(n)) && !usedDramaPlayers.has(n));
    const rivalPairs = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (getBond(active[i], active[j]) < -2 && !usedDramaPlayers.has(active[i]) && !usedDramaPlayers.has(active[j])) {
          rivalPairs.push([active[i], active[j]]);
        }
      }
    }
    const friendPairs = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (getBond(active[i], active[j]) > 3 && !usedDramaPlayers.has(active[i]) && !usedDramaPlayers.has(active[j])) {
          friendPairs.push([active[i], active[j]]);
        }
      }
    }

    const roll = Math.random();

    if (roll < 0.35 && villains.length > 0) {
      // Manipulation
      const actor = pick(villains);
      const targets = active.filter(n => n !== actor && !usedDramaPlayers.has(n));
      if (targets.length > 0) {
        const target = pick(targets);
        const actorPr = pronouns(actor);
        const vName = nameToVehicle[target]?.vehicleName || 'Wheelbarrow';
        const text = pick(SCRAMBLE_MANIPULATE)(actor, target, vName, actorPr);
        scrambleDrama.push({
          type: 'manipulate', actor, target, text,
          consequences: 'bond -1, villain pop -1',
        });
        addBond(actor, target, -1);
        popDelta(actor, -1);
        usedDramaPlayers.add(actor);
        usedDramaPlayers.add(target);
        gs.campEvents[campKey].push({
          type: 'gfo-manipulate', players: [actor, target],
          text: `${actor} tricked ${target} into grabbing a terrible vehicle during the scramble.`,
          badgeText: 'Manipulated', badgeClass: 'bad',
        });
      }
    } else if (roll < 0.6 && rivalPairs.length > 0) {
      // Rivalry shove
      const [a, b] = pick(rivalPairs);
      const text = pick(SCRAMBLE_SHOVE)(a, b);
      scrambleDrama.push({
        type: 'shove', actor: a, target: b, text,
        consequences: 'bond -2, shover pop -1',
      });
      addBond(a, b, -2);
      popDelta(a, -1);
      usedDramaPlayers.add(a);
      usedDramaPlayers.add(b);
      gs.campEvents[campKey].push({
        type: 'gfo-shove', players: [a, b],
        text: `${a} shoved ${b} during the vehicle scramble.`,
        badgeText: 'Shoved', badgeClass: 'bad',
      });
    } else if (friendPairs.length > 0) {
      // Friend help
      const [helper, target] = pick(friendPairs);
      const hPr = pronouns(helper);
      const vName = nameToVehicle[target]?.vehicleName || 'Bicycle';
      const text = pick(SCRAMBLE_HELP)(helper, target, vName, hPr);
      scrambleDrama.push({
        type: 'help', actor: helper, target, text,
        consequences: 'bond +1, helper pop +1',
      });
      addBond(helper, target, 1);
      popDelta(helper, 1);
      usedDramaPlayers.add(helper);
      usedDramaPlayers.add(target);
      gs.campEvents[campKey].push({
        type: 'gfo-help', players: [helper, target],
        text: `${helper} helped ${target} get a good vehicle during the scramble.`,
        badgeText: 'Helped Ally', badgeClass: 'green',
      });
    }
  }

  // Generate grab text for all players
  vehicleAssignments.forEach((va, i) => {
    const pr = pronouns(va.name);
    if (i === vehicleAssignments.length - 1 && va.tier >= 3) {
      va.grabText = pick(SCRAMBLE_LAST_PICK)(va.name, pr, va.vehicleName);
    } else {
      va.grabText = pick(SCRAMBLE_GRAB)(va.name, pr, va.vehicleName);
    }
  });

  // ══════════════════════════════════════════════════════
  // PHASE 1 — GAUNTLET RACE
  // ══════════════════════════════════════════════════════
  const NUM_SEGMENTS = 5;
  const BASE_TIME = 5.0;
  const raceTimes = {};
  const segmentTimes = {};
  active.forEach(n => { raceTimes[n] = 0; segmentTimes[n] = []; });

  const raceSegments = [];
  const racePositions = {}; // track relative position for chain damage
  active.forEach(n => { racePositions[n] = 0; });

  for (let seg = 1; seg <= NUM_SEGMENTS; seg++) {
    const segEvents = [];

    // Each player rolls for this segment
    active.forEach(name => {
      const s = pStats(name);
      const va = nameToVehicle[name];
      const roll = (s.physical * 0.35 + s.endurance * 0.35 + s.boldness * 0.3) * va.tierMult + noise(2.5);
      const clampedRoll = Math.max(roll, 0.5);
      let segTime = BASE_TIME / clampedRoll;

      // Booby trap: ~18% chance (down from 25% to reduce trap spam)
      if (Math.random() < 0.18) {
        const trapPenalty = 1.5 + Math.random() * 2.0;
        segTime += trapPenalty;
        const pr = pronouns(name);
        segEvents.push({
          type: 'trap', player: name, target: null,
          text: pick(RACE_TRAP_HIT)(name, pr, 'trap', va.vehicleName),
          timeDelta: trapPenalty,
          consequences: `+${trapPenalty.toFixed(1)}s penalty`,
        });

        // Chain damage: 40% to ONE nearby racer (down from 50% to each neighbor)
        const sorted = Object.entries(raceTimes).sort(([,a],[,b]) => a - b);
        const myIdx = sorted.findIndex(([n]) => n === name);
        const neighbors = [-1, 1].map(o => sorted[myIdx + o]).filter(Boolean);
        if (neighbors.length > 0 && Math.random() < 0.4) {
          const neighbor = pick(neighbors);
          const chainPenalty = trapPenalty * 0.5;
          segmentTimes[neighbor[0]] = segmentTimes[neighbor[0]] || [];
          raceTimes[neighbor[0]] += chainPenalty;
          const victimVehicle = nameToVehicle[neighbor[0]]?.vehicleName || 'vehicle';
          segEvents.push({
            type: 'trap-chain', player: neighbor[0], target: name,
            text: pick(RACE_TRAP_CHAIN)(neighbor[0], name, victimVehicle),
            timeDelta: chainPenalty,
            consequences: `+${chainPenalty.toFixed(1)}s chain damage`,
          });
        }
      }

      raceTimes[name] += segTime;
      segmentTimes[name].push(segTime);
    });

    // ── Per-player segment results: show every racer's segment ──
    const segTimesThisRound = active.map(name => ({
      name, segTime: segmentTimes[name][seg - 1],
    })).sort((a, b) => a.segTime - b.segTime);
    const medianTime = segTimesThisRound[Math.floor(segTimesThisRound.length / 2)].segTime;
    const playersWithEvents = new Set(segEvents.filter(e => e.player).map(e => e.player));

    segTimesThisRound.forEach((st, rank) => {
      if (playersWithEvents.has(st.name)) return;
      const pr = pronouns(st.name);
      const v = nameToVehicle[st.name].vehicleName;
      const t = st.segTime.toFixed(1);
      let text;
      if (st.segTime <= medianTime * 0.85) {
        text = pick(RACE_GOOD_SEGMENT)(st.name, pr, v, t);
      } else if (st.segTime >= medianTime * 1.2) {
        text = pick(RACE_SLOW_SEGMENT)(st.name, pr, v, t);
      } else {
        text = pick(RACE_AVG_SEGMENT)(st.name, pr, v, t);
      }
      segEvents.push({
        type: 'segment-result', player: st.name, target: null,
        text, timeDelta: 0,
        consequences: `${t}s — ${rank === 0 ? 'fastest' : rank < 3 ? 'top 3' : rank >= segTimesThisRound.length - 2 ? 'trailing' : 'mid-pack'}`,
      });
    });

    // ── Social events: GUARANTEE 2-3 per segment ──
    const socialEventPool = [];
    const usedEventPlayers = new Set();

    // Always try: Rivalry Sprint
    const closePairs = [];
    const sorted = Object.entries(raceTimes).sort(([,a],[,b]) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (Math.abs(sorted[i][1] - sorted[i+1][1]) < 3.0 &&
          getBond(sorted[i][0], sorted[i+1][0]) < 3) {
        closePairs.push([sorted[i][0], sorted[i+1][0]]);
      }
    }
    if (closePairs.length > 0) socialEventPool.push('rivalry');

    // Always try: Vehicle Breakdown
    const breakdownCandidates = active.filter(n => nameToVehicle[n].tier >= 3);
    if (breakdownCandidates.length > 0) socialEventPool.push('breakdown');

    // Always try: Dirty Move
    const dirtyMovers = active.filter(n => canScheme(n));
    if (dirtyMovers.length > 0) socialEventPool.push('dirty');

    // Always try: Encouragement
    const encouragers = active.filter(n => NICE_ARCHS.has(arch(n)));
    if (encouragers.length > 0) socialEventPool.push('encourage');

    // Always available as fallback
    socialEventPool.push('rivalry', 'encourage');

    // Shuffle and pick 2-3 unique event types
    const shuffledEvents = socialEventPool.sort(() => Math.random() - 0.5);
    const numSocialEvents = 2 + (Math.random() < 0.4 ? 1 : 0);
    const pickedTypes = new Set();

    for (let e = 0; e < numSocialEvents && shuffledEvents.length > 0; e++) {
      let eventType = shuffledEvents.shift();
      if (pickedTypes.has(eventType) && shuffledEvents.length > 0) {
        eventType = shuffledEvents.shift();
      }
      pickedTypes.add(eventType);

      if (eventType === 'rivalry') {
        const available = closePairs.filter(([a, b]) => !usedEventPlayers.has(a) && !usedEventPlayers.has(b));
        if (available.length > 0) {
          const [a, b] = pick(available);
          const sA = pStats(a), sB = pStats(b);
          const rollA = (sA.physical * 0.5 + sA.endurance * 0.5) + noise(2.5);
          const rollB = (sB.physical * 0.5 + sB.endurance * 0.5) + noise(2.5);
          const winner = rollA >= rollB ? a : b;
          const loser = winner === a ? b : a;
          raceTimes[winner] -= 2.0;
          raceTimes[loser] += 1.0;
          addBond(winner, loser, -1);
          segEvents.push({
            type: 'rivalry-sprint', player: winner, target: loser,
            text: pick(RACE_RIVALRY_SPRINT)(winner, loser),
            timeDelta: -2.0,
            consequences: 'winner -2s',
          });
          usedEventPlayers.add(winner);
          usedEventPlayers.add(loser);
        }
      }

      if (eventType === 'breakdown') {
        const candidates = breakdownCandidates.filter(n => !usedEventPlayers.has(n) && Math.random() < 0.6);
        if (candidates.length > 0) {
          const victim = pick(candidates);
          const va = nameToVehicle[victim];
          const pr = pronouns(victim);
          const penalty = 2.0 + Math.random() * 2.0;
          raceTimes[victim] += penalty;
          segEvents.push({
            type: 'vehicle-breakdown', player: victim, target: null,
            text: pick(RACE_VEHICLE_BREAKDOWN)(victim, pr, va.vehicleName),
            timeDelta: penalty,
            consequences: `+${penalty.toFixed(1)}s breakdown`,
          });
          usedEventPlayers.add(victim);

          // Rescue by bonded player (~60% chance)
          const rescuers = active.filter(n => n !== victim && getBond(n, victim) > 2 && !usedEventPlayers.has(n));
          if (rescuers.length > 0 && Math.random() < 0.6) {
            const rescuer = pick(rescuers);
            const rPr = pronouns(rescuer);
            raceTimes[victim] -= penalty * 0.5;
            raceTimes[rescuer] += 1.5;
            addBond(rescuer, victim, 2);
            popDelta(rescuer, 1);
            segEvents.push({
              type: 'vehicle-rescue', player: rescuer, target: victim,
              text: pick(RACE_VEHICLE_RESCUE)(rescuer, victim, rPr),
              timeDelta: 1.5,
              consequences: 'rescuer +1.5s, victim recovers half, bond +2',
            });
            usedEventPlayers.add(rescuer);
            gs.campEvents[campKey].push({
              type: 'gfo-rescue', players: [rescuer, victim],
              text: `${rescuer} stopped to help ${victim} when ${pronouns(victim).posAdj} vehicle broke down during the race.`,
              badgeText: 'Race Rescue', badgeClass: 'green',
            });
          }
        }
      }

      if (eventType === 'dirty') {
        const movers = dirtyMovers.filter(n => !usedEventPlayers.has(n));
        if (movers.length > 0) {
          const villain = pick(movers);
          const targets = active.filter(n => n !== villain && !usedEventPlayers.has(n));
          if (targets.length > 0) {
            const target = pick(targets);
            const vPr = pronouns(villain);
            const penalty = 1.5 + Math.random() * 1.0;
            raceTimes[target] += penalty;
            popDelta(villain, -1);
            addBond(villain, target, -2);
            segEvents.push({
              type: 'dirty-move', player: villain, target,
              text: pick(RACE_DIRTY_MOVE)(villain, target, vPr),
              timeDelta: penalty,
              consequences: `target +${penalty.toFixed(1)}s`,
            });
            usedEventPlayers.add(villain);
            usedEventPlayers.add(target);
            gs.campEvents[campKey].push({
              type: 'gfo-dirty', players: [villain, target],
              text: `${villain} sabotaged ${target} during the fortress race.`,
              badgeText: 'Dirty Racer', badgeClass: 'bad',
            });
          }
        }
      }

      if (eventType === 'encourage') {
        const helpers = encouragers.filter(n => !usedEventPlayers.has(n));
        if (helpers.length > 0) {
          const helper = pick(helpers);
          const targets = active.filter(n => n !== helper && !usedEventPlayers.has(n));
          if (targets.length > 0) {
            const target = pick(targets);
            const hPr = pronouns(helper);
            raceTimes[target] -= 1.0;
            addBond(helper, target, 1);
            segEvents.push({
              type: 'encourage', player: helper, target,
              text: pick(RACE_ENCOURAGE)(helper, target, hPr),
              timeDelta: -1.0,
              consequences: 'target -1s, bond +1',
            });
            usedEventPlayers.add(helper);
            usedEventPlayers.add(target);
          }
        }
      }
    }

    // Showmance moment (~30% per segment if showmances exist)
    if (seg <= NUM_SEGMENTS) {
      try { _checkShowmanceChalMoment(ep, null, null); } catch (_) {}
    }

    // ── Segment standings summary (after social events modify times) ──
    const standingsAfterSeg = active.map(name => ({
      name, totalTime: raceTimes[name],
    })).sort((a, b) => a.totalTime - b.totalTime);
    segEvents.push({
      type: 'standings', player: null, target: null,
      text: standingsAfterSeg.map((s, i) =>
        `${i + 1}. ${s.name} — ${s.totalTime.toFixed(1)}s${i === 0 ? ' ⛩' : i === standingsAfterSeg.length - 1 ? ' ⚠' : ''}`
      ).join('\n'),
      timeDelta: 0,
      consequences: `After segment ${seg}`,
    });

    // Announcer chatter — guaranteed every segment, 50% chance of a second
    segEvents.push({
      type: 'announcer', player: null, target: null,
      text: pick(ANNOUNCER_RACE),
      timeDelta: 0, consequences: '',
    });
    if (Math.random() < 0.4) {
      segEvents.push({
        type: 'announcer', player: null, target: null,
        text: pick(ANNOUNCER_RACE),
        timeDelta: 0, consequences: '',
      });
    }

    raceSegments.push({ seg, events: segEvents });
  }

  // Build race standings
  const raceStandings = active.map(name => ({
    name,
    totalTime: raceTimes[name],
    segments: segmentTimes[name],
    vehicle: nameToVehicle[name].vehicleName,
    tier: nameToVehicle[name].tier,
  })).sort((a, b) => a.totalTime - b.totalTime);

  // Generate finish text — tiered by placement
  raceStandings.forEach((rs, i) => {
    const pr = pronouns(rs.name);
    const place = i + 1;
    const v = rs.vehicle;
    if (place === 1) {
      rs.finishText = pick(RACE_FINISH_FIRST)(rs.name, pr, v);
    } else if (place <= Math.ceil(active.length * 0.33)) {
      rs.finishText = pick(RACE_FINISH_TOP)(rs.name, pr, place, v);
    } else if (place <= Math.ceil(active.length * 0.66)) {
      rs.finishText = pick(RACE_FINISH_MID)(rs.name, pr, place, v);
    } else {
      rs.finishText = pick(RACE_FINISH_BOTTOM)(rs.name, pr, place, v);
    }
  });

  // Race scoring: position-based
  raceStandings.forEach((rs, i) => {
    const pts = Math.max(2, 15 - i * Math.floor(13 / Math.max(active.length - 1, 1)));
    ep.chalMemberScores[rs.name] += pts;
  });

  // Last place eliminated from eating
  const raceEliminated = raceStandings[raceStandings.length - 1].name;
  const raceElimPr = pronouns(raceEliminated);
  const raceElimVehicle = raceStandings[raceStandings.length - 1].vehicle;
  const raceElimText = pick(RACE_ELIMINATED)(raceEliminated, raceElimPr, raceElimVehicle);

  gs.campEvents[campKey].push({
    type: 'gfo-race-elim', players: [raceEliminated],
    text: `${raceEliminated} finished last in the race and was cut from the eating gauntlet.`,
    badgeText: 'Race Eliminated', badgeClass: 'bad',
  });
  popDelta(raceEliminated, -1);

  // ══════════════════════════════════════════════════════
  // PHASE 2 — EATING GAUNTLET
  // ══════════════════════════════════════════════════════
  const eaters = active.filter(n => n !== raceEliminated);
  const survivors = new Set(eaters);

  // Pick 5 random dishes, sorted by difficulty
  const shuffledDishes = [...DISH_POOL].sort(() => Math.random() - 0.5).slice(0, 5);
  shuffledDishes.sort((a, b) => a.diff - b.diff);
  const dishes = shuffledDishes.map((d, i) => ({ ...d, round: i + 1 }));

  const eatingRounds = [];
  const eatingStandings = {};
  eaters.forEach(n => { eatingStandings[n] = { name: n, roundEliminated: null, ate: 0 }; });

  // Vomit chain debuff tracking
  const vomitDebuff = {};
  eaters.forEach(n => { vomitDebuff[n] = 0; });

  for (let round = 0; round < dishes.length; round++) {
    if (survivors.size <= 1) break;

    const dish = dishes[round];
    const difficulty = dish.diff;
    const threshold = 3.5 + difficulty * 0.9 + round * 0.6;

    const roundEvents = [];

    // Dish presentation
    roundEvents.push({
      type: 'dish-present', player: null, target: null,
      text: pick(EAT_DISH_PRESENT)(dish),
      timeDelta: 0, consequences: '',
    });

    // Pre-eat events
    const roundSurvivors = [...survivors];

    // Psych-out attempt (villain -> weakest) — more likely in later rounds
    const socialBoost = Math.min(round * 0.1, 0.3);
    const eaterVillains = roundSurvivors.filter(n => canScheme(n));
    if (eaterVillains.length > 0 && Math.random() < 0.35 + socialBoost) {
      const villain = pick(eaterVillains);
      const targets = roundSurvivors.filter(n => n !== villain);
      // Target weakest endurance
      const weakest = targets.sort((a, b) =>
        (pStats(a).endurance + noise(1)) - (pStats(b).endurance + noise(1))
      )[0];
      if (weakest) {
        const vPr = pronouns(villain);
        vomitDebuff[weakest] += 2; // temporary endurance penalty for this round
        addBond(villain, weakest, -1);
        roundEvents.push({
          type: 'psych-out', player: villain, target: weakest,
          text: pick(EAT_PSYCH_OUT)(villain, weakest, vPr),
          timeDelta: 0, consequences: 'target endurance -2 this round, bond -1',
        });
      }
    }

    // Encouragement from nice archetypes — more likely in later rounds
    const eaterNice = roundSurvivors.filter(n => NICE_ARCHS.has(arch(n)));
    if (eaterNice.length > 0 && Math.random() < 0.3 + socialBoost) {
      const helper = pick(eaterNice);
      const targets = roundSurvivors.filter(n => n !== helper && getBond(helper, n) > 0);
      if (targets.length > 0) {
        const target = pick(targets);
        const hPr = pronouns(helper);
        vomitDebuff[target] -= 1; // small bonus
        addBond(helper, target, 1);
        roundEvents.push({
          type: 'encourage', player: helper, target,
          text: pick(EAT_ENCOURAGE)(helper, target, hPr),
          timeDelta: 0, consequences: 'target small bonus, bond +1',
        });
      }
    }

    // Each player attempts to eat
    let roundEliminated = null;
    let roundEliminatedAll = null;
    const eatResults = [];

    roundSurvivors.forEach(name => {
      const s = pStats(name);
      const debuff = vomitDebuff[name] || 0;
      const eatRoll =
        (s.endurance - debuff) * 0.30 +
        s.boldness * 0.25 +
        s.mental * 0.20 +
        s.temperament * 0.25 +
        noise(2.5);

      const pr = pronouns(name);
      const survived = eatRoll >= threshold;

      if (survived) {
        eatingStandings[name].ate++;
        if (eatRoll >= threshold + 3) {
          // Dominant performance
          eatResults.push({ name, survived: true, dominant: true, roll: eatRoll });
          roundEvents.push({
            type: 'eat-success', player: name, target: null,
            text: pickFresh(EAT_SUCCESS, 'eat-success')(name, pr, dish.name),
            timeDelta: 0, consequences: 'survived',
          });
        } else if (eatRoll < threshold + 1.5) {
          // Barely survived
          eatResults.push({ name, survived: true, dominant: false, roll: eatRoll });
          roundEvents.push({
            type: 'eat-struggle', player: name, target: null,
            text: pickFresh(EAT_STRUGGLE, 'eat-struggle')(name, pr, dish.name),
            timeDelta: 0, consequences: 'survived (barely)',
          });
        } else {
          eatResults.push({ name, survived: true, dominant: false, roll: eatRoll });
          roundEvents.push({
            type: 'eat-success', player: name, target: null,
            text: pickFresh(EAT_SUCCESS, 'eat-success')(name, pr, dish.name),
            timeDelta: 0, consequences: 'survived',
          });
        }
      } else {
        eatResults.push({ name, survived: false, dominant: false, roll: eatRoll });
        const closeFail = eatRoll >= threshold - 1.5;
        const failPool = closeFail ? EAT_FAIL_CLOSE : EAT_FAIL_HARD;
        const failKey = closeFail ? 'eat-fail-close' : 'eat-fail-hard';
        roundEvents.push({
          type: 'eat-fail', player: name, target: null,
          text: pickFresh(failPool, failKey)(name, pr, dish.name),
          timeDelta: 0, consequences: 'eliminated',
        });
        survivors.delete(name);
        eatingStandings[name].roundEliminated = round + 1;
        eatingStandings[name].finalRoll = eatRoll;
        if (!roundEliminated) roundEliminated = name;
        if (!roundEliminatedAll) roundEliminatedAll = [];
        roundEliminatedAll.push(name);
        popDelta(name, -1);
      }
    });

    // Stomach of Steel moment (best eater this round)
    const dominant = eatResults.filter(r => r.survived && r.dominant);
    if (dominant.length > 0) {
      const best = dominant.sort((a, b) => b.roll - a.roll)[0];
      const bPr = pronouns(best.name);
      roundEvents.push({
        type: 'stomach-steel', player: best.name, target: null,
        text: pick(EAT_STOMACH_STEEL)(best.name, bPr),
        timeDelta: 0, consequences: 'pop +1, intimidates weakest',
      });
      popDelta(best.name, 1);
      // Intimidate the weakest remaining survivor
      const weakest = eatResults.filter(r => r.survived && r.name !== best.name)
        .sort((a, b) => a.roll - b.roll)[0];
      if (weakest) {
        vomitDebuff[weakest.name] += 1;
      }
    }

    // Vomit chain on elimination (30% per remaining)
    if (roundEliminated) {
      [...survivors].forEach(name => {
        if (Math.random() < 0.3) {
          vomitDebuff[name] += 1;
          roundEvents.push({
            type: 'vomit-chain', player: name, target: roundEliminated,
            text: pickFresh(EAT_VOMIT_CHAIN, 'vomit-chain')(roundEliminated, name),
            timeDelta: 0, consequences: 'endurance -1 next round',
          });
        }
      });
    }

    // Double-elimination reaction
    const elimCount = roundEliminatedAll ? roundEliminatedAll.length : (roundEliminated ? 1 : 0);
    if (elimCount >= 2) {
      const names = roundEliminatedAll.join(' and ');
      roundEvents.push({
        type: 'announcer', player: null, target: null,
        text: pickFresh(DOUBLE_ELIM_REACTIONS, 'double-elim')(names, elimCount, host()),
        timeDelta: 0, consequences: '',
      });
    }

    // Survivor count
    if (survivors.size > 0 && elimCount > 0) {
      const survCount = survivors.size;
      const survText = survCount === 1
        ? `One player remains. This is it.`
        : survCount === 2
          ? `Two players remain. The tension is unbearable.`
          : `${survCount} players remain. The table is getting emptier.`;
      roundEvents.push({
        type: 'announcer', player: null, target: null,
        text: `"${survText}" — ${host()}`,
        timeDelta: 0, consequences: '',
      });
    }

    // Announcer chatter
    if (Math.random() < 0.4) {
      roundEvents.push({
        type: 'announcer', player: null, target: null,
        text: pickFresh(ANNOUNCER_EAT, 'announcer-eat'),
        timeDelta: 0, consequences: '',
      });
    }

    eatingRounds.push({
      round: round + 1,
      dish,
      events: roundEvents,
      eliminated: roundEliminated,
      eliminatedAll: roundEliminatedAll || (roundEliminated ? [roundEliminated] : []),
      survivors: [...survivors],
    });

    // Reset psych-out debuffs for next round (keep vomit chain)
    roundSurvivors.forEach(n => {
      if (vomitDebuff[n] > 0) vomitDebuff[n] = Math.max(0, vomitDebuff[n] - 1);
    });
  }

  // Determine winner
  let immunityWinner;
  const survivorList = [...survivors];

  if (survivorList.length === 0) {
    // Everyone eliminated — pick from the LAST round's eliminated (they lasted longest)
    const lastRound = eatingRounds[eatingRounds.length - 1];
    const lastRoundElim = lastRound?.eliminatedAll || (lastRound?.eliminated ? [lastRound.eliminated] : []);
    const candidates = lastRoundElim.length > 0 ? lastRoundElim : eaters;
    if (candidates.length === 1) {
      immunityWinner = candidates[0];
    } else {
      // Use actual rolls from the round — whoever came closest to surviving wins
      const roundResults = candidates.map(n => ({
        name: n, roll: eatingStandings[n]?.finalRoll ?? 0,
      })).sort((a, b) => b.roll - a.roll);
      immunityWinner = roundResults[0].name;
    }
  } else if (survivorList.length === 1) {
    immunityWinner = survivorList[0];
  } else if (survivorList.length === 2) {
    // Eat-off
    const [a, b] = survivorList;
    const sA = pStats(a), sB = pStats(b);
    const rollA = sA.endurance * 0.30 + sA.boldness * 0.25 + sA.mental * 0.20 + sA.temperament * 0.25 + noise(2.5);
    const rollB = sB.endurance * 0.30 + sB.boldness * 0.25 + sB.mental * 0.20 + sB.temperament * 0.25 + noise(2.5);

    const eatOffText = pick(EAT_EATOFF)(a, b);
    const eatOffDish = pick(DISH_POOL.filter(d => d.diff >= 4)) || DISH_POOL[DISH_POOL.length - 1];

    immunityWinner = rollA >= rollB ? a : b;
    const loser = immunityWinner === a ? b : a;
    eatingStandings[loser].roundEliminated = dishes.length + 1; // eat-off round

    // Add eat-off round to data
    const eatOffEvents = [
      { type: 'eat-off', player: a, target: b, text: eatOffText, timeDelta: 0, consequences: 'eat-off' },
      {
        type: immunityWinner === a ? 'eat-success' : 'eat-fail',
        player: a, target: null,
        text: immunityWinner === a
          ? pickFresh(EAT_SUCCESS, 'eat-success')(a, pronouns(a), eatOffDish.name)
          : pickFresh(EAT_FAIL_CLOSE, 'eat-fail-close')(a, pronouns(a), eatOffDish.name),
        timeDelta: 0, consequences: immunityWinner === a ? 'won eat-off' : 'lost eat-off',
      },
      {
        type: immunityWinner === b ? 'eat-success' : 'eat-fail',
        player: b, target: null,
        text: immunityWinner === b
          ? pickFresh(EAT_SUCCESS, 'eat-success')(b, pronouns(b), eatOffDish.name)
          : pickFresh(EAT_FAIL_CLOSE, 'eat-fail-close')(b, pronouns(b), eatOffDish.name),
        timeDelta: 0, consequences: immunityWinner === b ? 'won eat-off' : 'lost eat-off',
      },
    ];
    eatingRounds.push({
      round: dishes.length + 1,
      dish: { ...eatOffDish, round: dishes.length + 1 },
      events: eatOffEvents,
      eliminated: loser,
      survivors: [immunityWinner],
    });
  } else {
    // More than 2 survived all rounds — sudden death eat-off with hardest dish
    const eatOffDish = pick(DISH_POOL.filter(d => d.diff >= 4)) || DISH_POOL[DISH_POOL.length - 1];
    const eatOffRolls = survivorList.map(n => {
      const s = pStats(n);
      return { name: n, roll: s.endurance * 0.30 + s.boldness * 0.25 + s.mental * 0.20 + s.temperament * 0.25 + noise(2.5) };
    }).sort((a, b) => b.roll - a.roll);
    immunityWinner = eatOffRolls[0].name;
    const losers = eatOffRolls.slice(1);
    losers.forEach(l => { eatingStandings[l.name].roundEliminated = dishes.length + 1; });

    const eatOffEvents = [
      { type: 'announcer', player: null, target: null,
        text: `"${survivorList.length} still standing?! Fine. One more dish. Sudden death." — ${host()}`,
        timeDelta: 0, consequences: 'sudden death eat-off' },
      { type: 'dish-present', player: null, target: null,
        text: `${eatOffDish.name} — ${eatOffDish.desc}`, timeDelta: 0, consequences: '' },
    ];
    // Winner survives
    eatOffEvents.push({
      type: 'eat-success', player: immunityWinner, target: null,
      text: pickFresh(EAT_SUCCESS, 'eat-success')(immunityWinner, pronouns(immunityWinner), eatOffDish.name),
      timeDelta: 0, consequences: 'won eat-off',
    });
    // Losers fall
    losers.forEach(l => {
      eatOffEvents.push({
        type: 'eat-fail', player: l.name, target: null,
        text: pickFresh(EAT_FAIL_CLOSE, 'eat-fail-close')(l.name, pronouns(l.name), eatOffDish.name),
        timeDelta: 0, consequences: 'lost eat-off',
      });
    });
    eatingRounds.push({
      round: dishes.length + 1,
      dish: { ...eatOffDish, round: dishes.length + 1 },
      events: eatOffEvents,
      eliminated: losers[0]?.name || null,
      eliminatedAll: losers.map(l => l.name),
      survivors: [immunityWinner],
    });
  }

  // Winner text + scoring
  const winPr = pronouns(immunityWinner);
  const winnerText = pick(EAT_WINNER)(immunityWinner, winPr);

  // Eating scoring: round survived * 3, winner gets 20
  eaters.forEach(n => {
    const rounds = eatingStandings[n].ate;
    ep.chalMemberScores[n] += rounds * 3;
  });
  // Winner bonus: maxOther + active.length + 5
  const maxOther = Math.max(...active.filter(n => n !== immunityWinner).map(n => ep.chalMemberScores[n] || 0));
  ep.chalMemberScores[immunityWinner] = maxOther + active.length + 5;

  popDelta(immunityWinner, 2);

  gs.campEvents[campKey].push({
    type: 'gfo-winner', players: [immunityWinner],
    text: `${immunityWinner} won The Great Fake-Out immunity challenge by surviving the eating gauntlet.`,
    badgeText: 'Immunity Winner', badgeClass: 'gold',
  });

  // Build eating standings sorted
  const eatingStandingsList = Object.values(eatingStandings).sort((a, b) => {
    if (a.name === immunityWinner) return -1;
    if (b.name === immunityWinner) return 1;
    return (b.roundEliminated || Infinity) - (a.roundEliminated || Infinity);
  });

  // ══════════════════════════════════════════════════════
  // FINALIZATION
  // ══════════════════════════════════════════════════════

  // chalPlacements: winner first, then eating order, race eliminated last
  const finalPlacements = [];
  finalPlacements.push({ name: immunityWinner, place: 1, detail: 'Immunity Winner' });
  let placeIdx = 2;
  eatingStandingsList.forEach(es => {
    if (es.name === immunityWinner) return;
    finalPlacements.push({
      name: es.name, place: placeIdx++,
      detail: es.roundEliminated ? `Eliminated round ${es.roundEliminated}` : 'Survived all rounds',
    });
  });
  finalPlacements.push({
    name: raceEliminated, place: placeIdx,
    detail: 'Eliminated in race (last place)',
  });

  ep.chalPlacements = finalPlacements.map(fp => fp.name);

  // Romance hooks
  _challengeRomanceSpark(null, null, active);
  _checkShowmanceChalMoment(ep, null, null);

  // Set episode data
  ep.immunityWinner = immunityWinner;
  ep.isGreatFakeOut = true;
  ep.challengeType = 'great-fake-out';
  ep.challengeLabel = 'The Great Fake-Out';
  ep.challengeCategory = 'adventure';
  ep.challengeDesc = 'A two-phase gauntlet: fortress race on bizarre vehicles, then a gross-food eating challenge.';
  ep.tribalPlayers = active;

  ep.challengeData = {
    vehicles: vehicleAssignments,
    scrambleDrama,
    raceSegments,
    raceStandings,
    raceEliminated,
    raceElimText,
    dishes,
    eatingRounds,
    eatingStandings: eatingStandingsList,
    immunityWinner,
    winnerText,
    finalPlacements,
  };

  updateChalRecord(ep);
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textGreatFakeOut(ep, ln, sec) {
  const cd = ep.challengeData;
  if (!cd) return;

  sec('THE GREAT FAKE-OUT');
  ln(`${cd.vehicles.length} players line up at the vehicle depot. Two phases: fortress race, then eating gauntlet.`);
  ln('');

  // Phase 0: Scramble
  sec('Vehicle Scramble');
  cd.vehicles.forEach(va => {
    ln(`  ${va.name}: ${va.vehicleName} (Tier ${va.tier}, x${va.tierMult})`);
  });
  ln('');
  if (cd.scrambleDrama.length) {
    cd.scrambleDrama.forEach(d => ln(d.text));
    ln('');
  }

  // Phase 1: Race
  sec('Gauntlet Race');
  cd.raceSegments.forEach(seg => {
    ln(`--- Segment ${seg.seg} ---`);
    seg.events.forEach(e => {
      if (e.text) ln(`  ${e.text}`);
    });
  });
  ln('');
  sec('Race Results');
  cd.raceStandings.forEach((rs, i) => {
    ln(`  ${_ordinal(i + 1)}: ${rs.name} — ${rs.totalTime.toFixed(1)}s (${rs.vehicle})`);
  });
  ln('');
  ln(cd.raceElimText);
  ln('');

  // Phase 2: Eating
  sec('Eating Gauntlet');
  cd.eatingRounds.forEach(round => {
    ln(`--- Round ${round.round}: ${round.dish.name} (difficulty ${round.dish.diff}) ---`);
    round.events.forEach(e => {
      if (e.text) ln(`  ${e.text}`);
    });
    if (round.eliminated) ln(`  ELIMINATED: ${round.eliminated}`);
    if (round.survivors.length) ln(`  Survivors: ${round.survivors.join(', ')}`);
    ln('');
  });

  // Winner
  sec('IMMUNITY');
  ln(cd.winnerText);
  ln(`${cd.immunityWinner} wins immunity at The Great Fake-Out.`);
  ln('');

  // Final placements
  sec('Final Placements');
  cd.finalPlacements.forEach(fp => {
    ln(`  ${_ordinal(fp.place)}: ${fp.name} — ${fp.detail}`);
  });
}

// ═══════════════════════════════════════════════════════════
// VP BUILDERS — Ink Wash Fortress VP
// ═══════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i < total; i++) {
    const el = document.getElementById(`gfo-step-${suffix}-${i}`);
    if (!el) continue;
    if (i <= upToIdx) {
      el.classList.add('visible');
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    } else {
      el.classList.remove('visible');
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
    }
  }
  const counter = document.getElementById(`gfo-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`gfo-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.gfo-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

// ── SVG ICON HELPERS ──
function _vehicleSvg(vehicleName) {
  const vn = (vehicleName || '').toLowerCase();
  if (vn.includes('skateboard')) return `<svg viewBox="0 0 32 32"><rect x="6" y="14" width="20" height="4" rx="2"/><circle cx="10" cy="22" r="3"/><circle cx="22" cy="22" r="3"/></svg>`;
  if (vn.includes('bicycle')) return `<svg viewBox="0 0 32 32"><circle cx="9" cy="22" r="6"/><circle cx="23" cy="22" r="6"/><path d="M9,22 L16,10 L23,22"/><line x1="12" y1="10" x2="20" y2="10"/></svg>`;
  if (vn.includes('rickshaw')) return `<svg viewBox="0 0 32 32"><rect x="10" y="8" width="14" height="12" rx="2"/><circle cx="17" cy="26" r="5"/><line x1="10" y1="14" x2="4" y2="20"/><line x1="4" y1="20" x2="4" y2="14"/></svg>`;
  if (vn.includes('tricycle')) return `<svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="5"/><circle cx="8" cy="24" r="5"/><circle cx="24" cy="24" r="5"/><line x1="16" y1="15" x2="8" y2="24"/><line x1="16" y1="15" x2="24" y2="24"/></svg>`;
  if (vn.includes('donkey')) return `<svg viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="8" ry="6"/><line x1="10" y1="22" x2="9" y2="28"/><line x1="14" y1="22" x2="13" y2="28"/><line x1="18" y1="22" x2="19" y2="28"/><line x1="22" y1="22" x2="23" y2="28"/><path d="M8,12 L5,6"/><path d="M10,12 L8,6"/><circle cx="24" cy="14" r="1.5"/></svg>`;
  if (vn.includes('pogo')) return `<svg viewBox="0 0 32 32"><line x1="16" y1="4" x2="16" y2="24"/><line x1="12" y1="12" x2="20" y2="12"/><circle cx="16" cy="27" r="3"/><line x1="13" y1="8" x2="19" y2="8"/></svg>`;
  if (vn.includes('sandal')) return `<svg viewBox="0 0 32 32"><path d="M6,12 Q6,8 10,8 Q14,8 14,12 L14,24 Q14,28 10,28 Q6,28 6,24 Z"/><path d="M18,12 Q18,8 22,8 Q26,8 26,12 L26,24 Q26,28 22,28 Q18,28 18,24 Z"/><line x1="10" y1="10" x2="10" y2="16"/><line x1="22" y1="10" x2="22" y2="16"/></svg>`;
  if (vn.includes('wheelbarrow')) return `<svg viewBox="0 0 32 32"><path d="M8,10 L22,10 L26,20 L4,20 Z"/><circle cx="15" cy="24" r="4"/><line x1="22" y1="10" x2="28" y2="6"/><line x1="4" y1="20" x2="2" y2="16"/></svg>`;
  return `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="none" stroke-width="2"/></svg>`;
}

function _dishSvg() {
  return `<svg viewBox="0 0 36 36"><ellipse cx="18" cy="22" rx="14" ry="8" fill="none" stroke="rgba(232,149,46,0.5)" stroke-width="1.5"/><path d="M8,22 Q8,14 18,14 Q28,14 28,22" fill="none" stroke="rgba(232,149,46,0.3)" stroke-width="1"/><path d="M12,12 Q13,8 12,4" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/><path d="M18,10 Q19,6 18,2" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/><path d="M24,12 Q25,8 24,4" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></svg>`;
}

function _trapStampSvg() {
  return `<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="none" stroke="rgba(194,54,22,0.4)" stroke-width="2"/><path d="M14,6 L14,14 M10,10 L18,10 M8,18 L14,14 L20,18" stroke="rgba(194,54,22,0.4)" stroke-width="1.5" fill="none"/></svg>`;
}

function _socialStampSvg() {
  return `<svg viewBox="0 0 28 28"><path d="M6,22 L14,6 L22,22" fill="none" stroke="rgba(45,106,79,0.4)" stroke-width="2"/><circle cx="14" cy="14" r="3" fill="rgba(45,106,79,0.3)"/></svg>`;
}

function _birdSvg() {
  return `<svg viewBox="0 0 20 12"><path d="M0,6 Q5,0 10,6 Q15,0 20,6"/></svg>`;
}

function _fortressSvg() {
  return `<svg class="gfo-fortress-svg" viewBox="0 0 600 80" preserveAspectRatio="none">
    <defs><linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(240,230,211,0.3)"/><stop offset="100%" stop-color="rgba(240,230,211,0.05)"/></linearGradient></defs>
    <path d="M0,65 L40,65 L40,55 L50,55 L50,35 L55,35 L55,30 L60,30 L60,35 L65,35 L65,55 L75,55 L75,60 L120,58 L120,55 L130,55 L130,30 L135,30 L135,25 L140,25 L140,30 L145,30 L145,55 L155,55 L155,58 L200,55 L240,52 L240,50 L250,50 L250,28 L255,28 L255,22 L260,22 L260,28 L265,28 L265,50 L275,50 L275,52 L320,48 L360,45 L360,42 L370,42 L370,20 L375,20 L375,15 L380,15 L380,20 L385,20 L385,42 L395,42 L395,45 L440,42 L480,40 L480,38 L490,38 L490,18 L495,18 L495,12 L500,12 L500,18 L505,18 L505,38 L515,38 L515,40 L560,38 L600,35" stroke="url(#wallGrad)" stroke-width="2" fill="none"/>
    <path d="M0,65 L40,65 L40,55 L75,55 L75,60 L155,55 L155,58 L275,50 L275,52 L395,42 L395,45 L515,38 L515,40 L600,35 L600,80 L0,80 Z" fill="rgba(240,230,211,0.03)"/>
    <g stroke="rgba(240,230,211,0.15)" stroke-width="1" fill="none"><rect x="80" y="56" width="4" height="4"/><rect x="90" y="55" width="4" height="4"/><rect x="100" y="56" width="4" height="4"/><rect x="160" y="54" width="4" height="4"/><rect x="170" y="53" width="4" height="4"/><rect x="280" y="49" width="4" height="4"/><rect x="290" y="48" width="4" height="4"/><rect x="400" y="43" width="4" height="4"/><rect x="520" y="38" width="4" height="4"/></g>
  </svg>`;
}

function _tierLabel(tier) {
  if (tier === 1) return `<div class="gfo-scramble-tier t1">Fast</div>`;
  if (tier === 2) return `<div class="gfo-scramble-tier t2">Medium</div>`;
  if (tier === 3) return `<div class="gfo-scramble-tier t3">Slow</div>`;
  return `<div class="gfo-scramble-tier t4">Terrible</div>`;
}

function _tierCss(tier) {
  if (tier === 1) return 'tier1';
  if (tier === 3 || tier === 4) return 'tier3';
  return '';
}

function _tierDotColor(tier) {
  if (tier === 1) return 'var(--gfo-gold)';
  if (tier === 2) return 'rgba(240,230,211,0.3)';
  if (tier === 3) return 'var(--gfo-amber)';
  return 'var(--gfo-cinnabar)';
}

function _tierTimeColor(tier) {
  if (tier === 1) return 'color:var(--gfo-gold)';
  if (tier === 3) return 'color:var(--gfo-amber)';
  if (tier === 4) return 'color:var(--gfo-cinnabar)';
  return '';
}

function _initial(name) {
  if (!name) return '?';
  const parts = name.split(/\s+/);
  return parts.length > 1 ? parts[0][0] + parts[1][0] : name.substring(0, Math.min(name.length, 2));
}

function _reactIcon(idx) {
  const icons = [
    { char: '✓', color: 'var(--gfo-gold)' },
    { char: '\u{1f4aa}', color: 'var(--gfo-jade-light)' },
    { char: '❗', color: 'var(--gfo-cinnabar)' },
    { char: '★', color: 'var(--gfo-gold)' },
    { char: '?', color: 'var(--gfo-mist-light)' },
    { char: '✨', color: 'var(--gfo-amber)' },
    { char: '\u{1f621}', color: 'var(--gfo-cinnabar)' },
  ];
  const ic = icons[idx % icons.length];
  return `<div class="gfo-scramble-react" style="color:${ic.color};">${ic.char}</div>`;
}

function _cardTypeClass(type) {
  if (type === 'trap' || type === 'trap-chain' || type === 'dirty-move') return 'trap-event';
  if (type === 'rivalry-sprint' || type === 'encourage' || type === 'vehicle-rescue' || type === 'psych-out') return 'social-event';
  if (type === 'eat-fail') return 'elimination-event';
  if (type === 'vomit-chain') return 'vomit-card';
  if (type === 'segment-result') return 'segment-result';
  if (type === 'standings') return 'standings-card';
  return 'race-event';
}

function _cardStamp(type) {
  if (type === 'trap' || type === 'trap-chain' || type === 'dirty-move') return `<div class="gfo-card-stamp">${_trapStampSvg()}</div>`;
  if (type === 'rivalry-sprint' || type === 'encourage' || type === 'vehicle-rescue' || type === 'psych-out') return `<div class="gfo-card-stamp">${_socialStampSvg()}</div>`;
  if (type === 'segment-result') return `<div class="gfo-card-stamp"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(240,230,211,0.4)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>`;
  return '';
}

function _consequenceTags(consequences) {
  if (!consequences) return '';
  const tags = [];
  const c = consequences.toLowerCase();
  if (c.includes('fastest') || c.includes('top 3')) {
    tags.push(`<div class="gfo-consequence time-gain">${consequences}</div>`);
  } else if (c.includes('trailing')) {
    tags.push(`<div class="gfo-consequence time-loss">${consequences}</div>`);
  } else if (c.includes('mid-pack')) {
    tags.push(`<div class="gfo-consequence bond-change">${consequences}</div>`);
  } else if (c.includes('after segment')) {
    return '';
  } else if (c.includes('+') && c.includes('s') && (c.includes('penalty') || c.includes('breakdown') || c.includes('chain') || c.includes('target +'))) {
    tags.push(`<div class="gfo-consequence time-loss">${consequences.split(',')[0].trim()}</div>`);
  } else if (c.includes('-') && c.includes('s')) {
    tags.push(`<div class="gfo-consequence time-gain">${consequences.split(',')[0].trim()}</div>`);
  }
  if (c.includes('bond')) tags.push(`<div class="gfo-consequence bond-change">Bond change</div>`);
  if (c.includes('pop')) tags.push(`<div class="gfo-consequence pop-change">Pop change</div>`);
  if (c.includes('eliminated')) tags.push(`<div class="gfo-consequence time-loss">Eliminated</div>`);
  if (c.includes('endurance')) tags.push(`<div class="gfo-consequence time-loss">${consequences}</div>`);
  if (c.includes('survived')) tags.push(`<div class="gfo-consequence time-gain">Survived</div>`);
  if (c.includes('intimidat')) tags.push(`<div class="gfo-consequence pop-change">Intimidation</div>`);
  if (c.includes('eat-off')) tags.push(`<div class="gfo-consequence time-loss">Eat-Off</div>`);
  if (tags.length === 0 && consequences) tags.push(`<div class="gfo-consequence time-loss">${consequences}</div>`);
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">${tags.join('')}</div>`;
}

function _eventTitle(type) {
  const map = {
    'trap': 'Booby Trap!', 'trap-chain': 'Chain Damage!', 'rivalry-sprint': 'Rivalry Sprint',
    'vehicle-breakdown': 'Vehicle Breakdown', 'vehicle-rescue': 'Race Rescue', 'dirty-move': 'Dirty Move',
    'encourage': 'Encouragement', 'segment-result': 'Segment Run', 'standings': 'Standings',
    'announcer': '', 'dish-present': 'Course Served',
    'psych-out': 'Psych-Out', 'eat-success': 'Ate It!', 'eat-struggle': 'Barely Survived',
    'eat-fail': 'Eliminated', 'stomach-steel': 'Stomach of Steel', 'vomit-chain': 'Vomit Chain!',
    'eat-off': 'Eat-Off!',
  };
  return map[type] || type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function _eventSubtitle(type) {
  if (type === 'trap' || type === 'trap-chain') return 'Trap Trigger';
  if (type === 'rivalry-sprint' || type === 'encourage' || type === 'vehicle-rescue' || type === 'psych-out') return 'Social Event';
  if (type === 'dirty-move') return 'Sabotage';
  if (type === 'vehicle-breakdown') return 'Vehicle Failure';
  if (type === 'segment-result') return 'Performance';
  if (type === 'standings') return 'Leaderboard';
  if (type === 'eat-fail') return 'Eating Failure';
  if (type === 'vomit-chain') return 'Chain Reaction';
  if (type === 'stomach-steel') return 'Eating Event';
  if (type === 'eat-off') return 'Final Round';
  return 'Event';
}

function _dramaTypeLabel(type) {
  if (type === 'manipulate') return 'Manipulation';
  if (type === 'shove') return 'Shove';
  if (type === 'help') return 'Helped Ally';
  return type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── SEGMENT FLAVOR TEXT ──
const SEGMENT_FLAVORS = [
  'The ancient stones tremble underfoot. Something mechanical clicks inside the walls.',
  'The wall narrows. The air thickens with dust.',
  'Smoke rises from the last trap. The finish line glimmers in the distance.',
  'Shadows lengthen between the watchtowers. The wind picks up.',
  'The fortress groans. Paint splatters dry on the walls from earlier chaos.',
  'Battlements crumble under racing feet. The path grows treacherous.',
  'Ink drips from cracks in the stone. The wall is alive with traps.',
  'The final stretch beckons. No one is safe.',
];

const RACE_CHATTER = [
  '"This is getting UGLY, folks!"',
  '"Remember, last place doesn\'t eat! Motivation enough?"',
  '"The fortress doesn\'t care about your feelings!"',
  '"These booby traps were Chef\'s idea. Blame him."',
  '"Every second counts! Unless you\'re on sandals."',
  '"Pogo stick versus skateboard? That\'s just cruel. I love it."',
  '"That\'s gonna leave a mark. Several marks."',
  '"If you thought the race was bad, WAIT until you see dinner!"',
];

const EAT_CHATTER = [
  '"If you can smell it from the audience, it\'s working."',
  '"Chef outdid himself today. And by \'outdid\' I mean \'went way too far.\'"',
  '"This isn\'t a cooking competition. This is punishment."',
  '"The interns refused to taste-test these. All five of them quit."',
  '"Fun fact: the fermentation process takes six months. The suffering is instant."',
  '"If you throw up ON someone, that\'s a bonus point. Kidding. Maybe."',
];

const EAT_ROUND_FLAVOR = [
  'The dishes grow darker. The air grows thicker with dread.',
  'The table trembles. The weaker stomachs are already gone.',
  'Chef places the next plate with a disturbing amount of pride.',
  'The survivors eye each other. Who breaks next?',
  'Only the truly unhinged remain. This is the final stretch.',
];

// ── SIDEBAR BUILDER ──
function _buildGFOSidebarContent(ep, screenKey) {
  const cd = ep.challengeData;
  if (!cd) return '';
  let html = '';

  if (screenKey.includes('scramble')) {
    // Vehicle Assignments sidebar
    html += `<div class="gfo-sidebar-title">Vehicle Assignments</div>`;
    const st = _tvState['gfo-scramble'] || _tvState['scramble'];
    const revealIdx = st ? st.idx : -1;

    // Count how many grab cards have been revealed (steps include dividers + drama)
    const stepMeta = window._gfoScrambleStepMeta || [];
    let grabsRevealed = 0;
    for (let s = 0; s <= Math.min(revealIdx, stepMeta.length - 1); s++) {
      if (stepMeta[s]?.type === 'grab') grabsRevealed++;
    }

    cd.vehicles.forEach((va, i) => {
      if (i >= grabsRevealed) return;
      const isLast = i === cd.vehicles.length - 1;
      const tc = _tierCss(va.tier);
      html += `<div class="gfo-lb-entry${isLast ? ' danger' : ''}">
        <div class="gfo-lb-pos${i === 0 ? ' first' : ''}${isLast ? ' last' : ''}">${i + 1}</div>
        <div class="gfo-lb-avatar">${portrait(va.name, 24) || _initial(va.name)}</div>
        <div class="gfo-lb-name">${va.name} <span class="gfo-lb-vehicle-tag ${tc}">${va.vehicleName}</span></div>
        <div class="gfo-lb-time" style="font-size:9px;${_tierTimeColor(va.tier)}">T${va.tier}</div>
      </div>`;
    });

    // Drama summary — only show revealed drama
    const revealedDrama = [];
    for (let s = 0; s <= Math.min(revealIdx, stepMeta.length - 1); s++) {
      if (stepMeta[s]?.type === 'drama' && stepMeta[s].drama) revealedDrama.push(stepMeta[s].drama);
    }
    if (revealedDrama.length > 0) {
      html += `<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(240,230,211,0.06);">
        <div style="font-family:var(--gfo-font-display);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,230,211,0.25);margin-bottom:8px;">Scramble Drama</div>
        <div style="font-family:var(--gfo-font-body);font-size:12px;color:rgba(240,230,211,0.35);line-height:1.8;">`;
      revealedDrama.forEach(d => {
        const color = d.type === 'manipulate' ? 'var(--gfo-amber)' : d.type === 'shove' ? 'var(--gfo-cinnabar)' : 'var(--gfo-jade-light)';
        const label = d.type === 'manipulate' ? 'tricked' : d.type === 'shove' ? 'shoved' : 'helped';
        html += `<div style="display:flex;align-items:center;gap:4px;color:${color};">${portrait(d.actor, 18)} <span>${d.actor}</span> <span style="opacity:0.6;">${label}</span> ${portrait(d.target, 18)} <span>${d.target}</span></div>`;
      });
      html += `</div></div>`;
    }

    // Tier legend
    html += `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(240,230,211,0.06);">
      <div style="font-family:var(--gfo-font-display);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,230,211,0.25);margin-bottom:8px;">Vehicle Tiers</div>
      <div style="display:flex;flex-direction:column;gap:4px;font-family:var(--gfo-font-body);font-size:11px;">
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;border-radius:50%;background:var(--gfo-gold);"></div><span style="color:var(--gfo-gold);">T1 &#8212; Fast</span><span style="color:rgba(240,230,211,0.25);margin-left:auto;">&#215;1.3</span></div>
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;border-radius:50%;background:rgba(240,230,211,0.3);"></div><span style="color:rgba(240,230,211,0.4);">T2 &#8212; Medium</span><span style="color:rgba(240,230,211,0.25);margin-left:auto;">&#215;1.0</span></div>
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;border-radius:50%;background:var(--gfo-amber);"></div><span style="color:var(--gfo-amber);">T3 &#8212; Slow</span><span style="color:rgba(240,230,211,0.25);margin-left:auto;">&#215;0.75</span></div>
        <div style="display:flex;align-items:center;gap:6px;"><div style="width:8px;height:8px;border-radius:50%;background:var(--gfo-cinnabar);"></div><span style="color:var(--gfo-cinnabar);">T4 &#8212; Terrible</span><span style="color:rgba(240,230,211,0.25);margin-left:auto;">&#215;0.55</span></div>
      </div>
    </div>`;

  } else if (screenKey.includes('race')) {
    // Race Standings sidebar
    html += `<div class="gfo-sidebar-title">Race Standings</div>`;
    const st = _tvState['gfo-race'] || _tvState['race'];
    const revealIdx = st ? st.idx : -1;

    // Build cumulative standings from revealed steps
    const stepMeta = window._gfoRaceStepMeta || [];
    const revealedTimes = {};
    let maxRevealedSeg = 0;
    for (let i = 0; i <= Math.min(revealIdx, stepMeta.length - 1); i++) {
      const sm = stepMeta[i];
      if (sm && sm.standings) {
        sm.standings.forEach(s => { revealedTimes[s.name] = s.totalTime; });
      }
      if (sm && sm.segment) maxRevealedSeg = Math.max(maxRevealedSeg, sm.segment);
    }

    // Sort by revealed times, fallback to final standings
    const standings = cd.raceStandings.map(rs => ({
      ...rs,
      displayTime: revealedTimes[rs.name] !== undefined ? revealedTimes[rs.name] : null,
    })).filter(rs => rs.displayTime !== null).sort((a, b) => a.displayTime - b.displayTime);

    // Mini race map inside sidebar
    if (standings.length > 0 && cd.raceSegments) {
      const totalSegs = cd.raceSegments.length;
      const minT = standings[0].displayTime;
      const maxT = standings[standings.length - 1].displayTime;
      const timeRange = maxT - minT;
      const frontPct = 5 + (maxRevealedSeg / totalSegs) * 80;
      const maxSpread = Math.min(35, maxRevealedSeg * 10);
      html += `<div class="gfo-mini-map">`;
      html += `<div class="gfo-mini-map-track">`;
      for (let s = 0; s < totalSegs; s++) {
        const pct = 5 + ((s + 1) / totalSegs) * 80;
        html += `<div class="gfo-mini-map-seg" style="left:${pct}%;">${s + 1}</div>`;
      }
      html += `<div class="gfo-mini-map-finish" style="left:90%;">⛩</div>`;
      standings.forEach((rs, i) => {
        const behind = timeRange > 0.01 ? (rs.displayTime - minT) / timeRange : 0;
        const pct = Math.max(3, frontPct - behind * maxSpread);
        const ava = portrait(rs.name, 18) || `<span style="font-size:8px;">${rs.name[0]}</span>`;
        html += `<div class="gfo-mini-map-dot" style="left:${pct}%;bottom:${4 + (i % 3) * 12}px;" title="${rs.name} — ${rs.displayTime.toFixed(1)}s">${ava}</div>`;
      });
      html += `</div></div>`;
    }

    standings.forEach((rs, i) => {
      const isLast = i === standings.length - 1 && standings.length === cd.raceStandings.length;
      const tc = _tierCss(rs.tier);
      const shortV = rs.vehicle.length > 8 ? rs.vehicle.substring(0, 7) : rs.vehicle;
      html += `<div class="gfo-lb-entry${isLast ? ' danger' : ''}">
        <div class="gfo-lb-pos${i === 0 ? ' first' : ''}${isLast ? ' last' : ''}">${i + 1}</div>
        <div class="gfo-lb-avatar">${portrait(rs.name, 24) || _initial(rs.name)}</div>
        <div class="gfo-lb-name">${rs.name} <span class="gfo-lb-vehicle-tag ${tc}">${shortV}</span></div>
        <div class="gfo-lb-time">${rs.displayTime.toFixed(1)}s</div>
      </div>`;
    });

    // Segment progress
    const currentSeg = window._gfoCurrentSeg || 0;
    html += `<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(240,230,211,0.06);">
      <div style="font-family:var(--gfo-font-display);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,230,211,0.25);margin-bottom:8px;">Segment Progress</div>
      <div style="display:flex;gap:4px;">`;
    for (let s = 0; s < cd.raceSegments.length; s++) {
      const bg = s < currentSeg ? 'var(--gfo-jade)' : s === currentSeg ? 'var(--gfo-gold)' : 'rgba(240,230,211,0.08)';
      html += `<div style="flex:1;height:6px;border-radius:3px;background:${bg};"></div>`;
    }
    html += `</div><div style="font-family:var(--gfo-font-body);font-size:11px;color:rgba(240,230,211,0.3);margin-top:6px;text-align:center;">${currentSeg} of ${cd.raceSegments.length} segments complete</div></div>`;

    // Trap counter
    const trapCount = window._gfoTrapCount || 0;
    html += `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(240,230,211,0.06);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="font-family:var(--gfo-font-display);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,230,211,0.25);">Traps Triggered</div>
        <div style="font-family:var(--gfo-font-display);font-size:16px;font-weight:700;color:var(--gfo-cinnabar);">${trapCount}</div>
      </div>
    </div>`;

  } else if (screenKey.includes('eating')) {
    // Eating Bracket sidebar
    html += `<div class="gfo-sidebar-title">Eating Bracket</div>`;
    const st = _tvState['gfo-eating'] || _tvState['eating'];
    const revealIdx = st ? st.idx : -1;

    const stepMeta = window._gfoEatStepMeta || [];
    let currentRound = 0;
    let currentDish = null;
    const eliminated = new Set();
    let winner = null;

    for (let i = 0; i <= Math.min(revealIdx, stepMeta.length - 1); i++) {
      const sm = stepMeta[i];
      if (sm) {
        if (sm.round > currentRound) currentRound = sm.round;
        if (sm.dish) currentDish = sm.dish;
        if (sm.eliminated) eliminated.add(sm.eliminated);
        if (sm.winner) winner = sm.winner;
      }
    }

    // Lantern status pips
    const eaters = cd.vehicles.filter(v => v.name !== cd.raceEliminated).map(v => v.name);
    html += `<div class="gfo-lantern-status" style="flex-wrap:wrap;gap:6px;">`;
    eaters.forEach(name => {
      const cls = winner === name ? 'golden' : eliminated.has(name) ? 'extinguished' : 'lit';
      const opacity = eliminated.has(name) ? 'opacity:0.35;filter:grayscale(1);' : '';
      const border = winner === name ? 'border:2px solid var(--gfo-gold);border-radius:4px;' : eliminated.has(name) ? 'border:2px solid var(--gfo-cinnabar);border-radius:4px;' : 'border:2px solid rgba(240,230,211,0.15);border-radius:4px;';
      html += `<div class="gfo-lantern-pip ${cls}" title="${name}" style="width:auto;height:auto;${border}${opacity}display:flex;align-items:center;gap:3px;padding:2px 6px 2px 2px;">
        ${portrait(name, 20)}
        <span style="font-size:10px;font-family:var(--gfo-font-body);color:rgba(240,230,211,0.6);">${name}</span>
      </div>`;
    });
    html += `</div>`;

    // Current dish
    if (currentDish) {
      html += `<div class="gfo-sidebar-dish">
        <div class="gfo-sidebar-dish-label">Now Serving</div>
        <div class="gfo-sidebar-dish-name">${currentDish.name}</div>
        <div class="gfo-sidebar-round">Round ${currentRound} of ${cd.dishes.length}</div>
      </div>`;
    }

    // Player bracket
    html += `<div class="gfo-eat-bracket">`;
    eaters.forEach(name => {
      const isOut = eliminated.has(name);
      const isWinner = winner === name;
      const statusCls = isWinner ? 'winner' : isOut ? 'eliminated' : 'eating';
      const statusText = isWinner ? 'Winner' : isOut ? `Round ${cd.eatingStandings.find(es => es.name === name)?.roundEliminated || '?'}` : 'Eating';
      html += `<div class="gfo-eat-entry${isOut ? ' out' : ''}">
        <div class="gfo-eat-avatar">${portrait(name, 24) || _initial(name)}</div>
        <div class="gfo-eat-name">${name}</div>
        <div class="gfo-eat-status ${statusCls}">${statusText}</div>
      </div>`;
    });
    html += `</div>`;

    // Elimination log
    if (eliminated.size > 0 || cd.raceEliminated) {
      html += `<div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(240,230,211,0.06);">
        <div style="font-family:var(--gfo-font-display);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,230,211,0.25);margin-bottom:8px;">Elimination Log</div>
        <div style="font-family:var(--gfo-font-body);font-size:12px;color:rgba(240,230,211,0.35);line-height:1.8;">`;
      if (cd.raceEliminated) {
        html += `<div style="display:flex;align-items:center;gap:4px;">R0: ${portrait(cd.raceEliminated, 18)} <span style="color:var(--gfo-cinnabar);text-decoration:line-through;">${cd.raceEliminated}</span> &#8212; <span style="font-style:italic;color:rgba(240,230,211,0.25);">Did not qualify</span></div>`;
      }
      cd.eatingRounds.forEach(round => {
        const allElim = round.eliminatedAll || (round.eliminated ? [round.eliminated] : []);
        allElim.forEach(elName => {
          if (eliminated.has(elName)) {
            html += `<div style="display:flex;align-items:center;gap:4px;">R${round.round}: ${portrait(elName, 18)} <span style="color:var(--gfo-cinnabar);text-decoration:line-through;">${elName}</span> &#8212; <span style="font-style:italic;color:rgba(240,230,211,0.25);">${round.dish.name}</span></div>`;
          }
        });
      });
      html += `</div></div>`;
    }

    // Dish difficulty bar chart
    html += `<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(240,230,211,0.06);">
      <div style="font-family:var(--gfo-font-display);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,230,211,0.25);margin-bottom:8px;">Dish Difficulty</div>
      <div style="display:flex;gap:3px;align-items:flex-end;height:40px;">`;
    cd.dishes.forEach((dish, i) => {
      const pct = (dish.diff / 5 * 100);
      const bg = i < currentRound ? (dish.diff >= 4 ? 'var(--gfo-cinnabar)' : dish.diff >= 2 ? 'var(--gfo-amber)' : 'var(--gfo-jade)') : 'rgba(240,230,211,0.08)';
      const shadow = i < currentRound && dish.diff >= 4 ? 'box-shadow:0 0 8px rgba(194,54,22,0.3);' : '';
      html += `<div style="flex:1;background:${bg};border-radius:2px 2px 0 0;height:${pct}%;${shadow}"></div>`;
    });
    html += `</div></div>`;
  }

  return html;
}

function _updateGFOSidebar(screenKey) {
  const sideEl = document.getElementById('gfo-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._gfoEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord) return;
  if (epRecord.greatFakeOut && !epRecord.challengeData) epRecord.challengeData = epRecord.greatFakeOut;
  if (!epRecord.challengeData) return;
  sideEl.innerHTML = _buildGFOSidebarContent(epRecord, screenKey);
}

// ── ATMOSPHERE BUILDERS ──
function _buildTitleAtmosphere() {
  let html = '';
  // Parallax mountains
  html += `<div class="gfo-title-mountains"><div class="gfo-mountain-layer gfo-mountain-far"></div><div class="gfo-mountain-layer gfo-mountain-mid"></div></div>`;
  // Sun glow at horizon
  html += `<div style="position:absolute;bottom:18%;left:50%;transform:translateX(-50%);width:500px;height:200px;background:radial-gradient(ellipse,rgba(240,180,60,0.25),rgba(220,120,40,0.08) 50%,transparent 75%);pointer-events:none;z-index:0;"></div>`;
  // Mist
  html += `<div class="gfo-mist-layer"><div class="gfo-mist-band"></div><div class="gfo-mist-band"></div><div class="gfo-mist-band"></div></div>`;
  return html;
}

function _buildRaceAtmosphere() {
  let html = '';
  // Warm glow pools — torch light on the fortress walls
  html += `<div style="position:absolute;top:15%;left:10%;width:200px;height:200px;background:radial-gradient(ellipse,rgba(232,149,46,0.08),transparent 70%);pointer-events:none;z-index:0;"></div>`;
  html += `<div style="position:absolute;top:30%;right:8%;width:250px;height:180px;background:radial-gradient(ellipse,rgba(212,160,23,0.06),transparent 70%);pointer-events:none;z-index:0;"></div>`;
  html += `<div style="position:absolute;bottom:25%;left:20%;width:300px;height:200px;background:radial-gradient(ellipse,rgba(194,100,40,0.06),transparent 70%);pointer-events:none;z-index:0;"></div>`;
  // Torches along the wall
  html += `<div class="gfo-torch-glow" style="top:20%;left:5%;"><div class="gfo-torch-flame"></div><div class="gfo-torch-halo"></div></div>`;
  html += `<div class="gfo-torch-glow" style="top:40%;right:4%;"><div class="gfo-torch-flame"></div><div class="gfo-torch-halo"></div></div>`;
  html += `<div class="gfo-torch-glow" style="top:65%;left:8%;"><div class="gfo-torch-flame"></div><div class="gfo-torch-halo"></div></div>`;
  html += `<div class="gfo-torch-glow" style="bottom:20%;right:6%;"><div class="gfo-torch-flame"></div><div class="gfo-torch-halo"></div></div>`;
  // Birds
  html += `<div class="gfo-bird" style="top:8%;animation-duration:18s;">${_birdSvg()}</div>`;
  html += `<div class="gfo-bird" style="top:12%;animation-duration:25s;animation-delay:-8s;">${_birdSvg()}</div>`;
  html += `<div class="gfo-bird" style="top:5%;animation-duration:22s;animation-delay:-15s;"><svg viewBox="0 0 20 12" style="width:14px;height:8px;"><path d="M0,6 Q5,0 10,6 Q15,0 20,6"/></svg></div>`;
  // Fog bands — warm valley fog
  html += `<div class="gfo-fog-band" style="top:35%;width:120%;animation-duration:30s;opacity:0.6;"></div>`;
  html += `<div class="gfo-fog-band" style="top:55%;width:150%;animation-duration:40s;animation-delay:-15s;opacity:0.4;"></div>`;
  html += `<div class="gfo-fog-band" style="top:75%;width:130%;animation-duration:35s;animation-delay:-8s;opacity:0.3;"></div>`;
  // Ink drips
  html += `<div class="gfo-ink-drip" style="top:5%;left:3%;"><div class="gfo-ink-drip-drop" style="animation-duration:5s;"></div></div>`;
  html += `<div class="gfo-ink-drip" style="top:15%;right:5%;"><div class="gfo-ink-drip-drop" style="animation-duration:7s;animation-delay:-2s;"></div></div>`;
  html += `<div class="gfo-ink-drip" style="top:45%;left:8%;"><div class="gfo-ink-drip-drop" style="animation-duration:6s;animation-delay:-4s;"></div></div>`;
  // Calligraphy fragments
  html += `<div class="gfo-calli-fragment" style="top:10%;right:5%;font-size:36px;transform:rotate(-12deg);">GAUNTLET</div>`;
  html += `<div class="gfo-calli-fragment" style="bottom:15%;left:3%;font-size:24px;transform:rotate(6deg);">RACE</div>`;
  // Brush flourishes
  html += `<div class="gfo-brush-flourish" style="top:0;left:0;width:200px;height:40px;opacity:0.08;"><svg viewBox="0 0 200 40"><path d="M0,30 Q30,5 80,20 T160,15 T200,25" stroke="rgba(240,230,211,0.3)" stroke-width="3" fill="none" stroke-linecap="round"/></svg></div>`;
  html += `<div class="gfo-brush-flourish" style="bottom:0;right:0;width:180px;height:35px;opacity:0.06;transform:scaleX(-1);"><svg viewBox="0 0 180 35"><path d="M0,25 Q40,5 90,18 T180,10" stroke="rgba(240,230,211,0.25)" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg></div>`;
  return html;
}

function _buildEatingAtmosphere() {
  let html = '';
  // Warm ambient glow pools — overlapping lantern light on walls
  html += `<div style="position:absolute;top:5%;left:15%;width:350px;height:250px;background:radial-gradient(ellipse,rgba(232,149,46,0.1),transparent 70%);pointer-events:none;z-index:0;"></div>`;
  html += `<div style="position:absolute;top:10%;right:10%;width:300px;height:200px;background:radial-gradient(ellipse,rgba(194,80,30,0.08),transparent 70%);pointer-events:none;z-index:0;"></div>`;
  html += `<div style="position:absolute;top:35%;left:40%;width:400px;height:300px;background:radial-gradient(ellipse,rgba(212,160,23,0.06),transparent 70%);pointer-events:none;z-index:0;"></div>`;
  html += `<div style="position:absolute;bottom:30%;right:20%;width:280px;height:200px;background:radial-gradient(ellipse,rgba(232,149,46,0.07),transparent 70%);pointer-events:none;z-index:0;"></div>`;
  // Lanterns
  const lanternPositions = [5, 14, 24, 33, 42, 52, 62, 72, 80, 90];
  const lanternColors = ['amber', 'red', 'gold', 'amber', 'gold', 'red', 'amber', 'gold', 'red', 'amber'];
  html += `<div class="gfo-lantern-layer">`;
  lanternPositions.forEach((pos, i) => {
    html += `<div class="gfo-lantern" style="left:${pos}%;"><div class="gfo-lantern-string"></div><div class="gfo-lantern-body ${lanternColors[i]}"><div class="gfo-lantern-glow"></div></div></div>`;
  });
  html += `</div>`;
  // Steam (doubled density)
  html += `<div class="gfo-steam-layer">`;
  const steamPositions = [15, 30, 50, 65, 80, 20, 40, 60, 75];
  const steamDurations = [6, 8, 7, 9, 5, 7.5, 6.5, 8.5, 5.5];
  const steamDelays = [0, -2, -4, -1, -3, -1.5, -3.5, -5, -2.5];
  steamPositions.forEach((pos, i) => {
    html += `<div class="gfo-steam-particle" style="left:${pos}%;animation-duration:${steamDurations[i]}s;animation-delay:${steamDelays[i]}s;"></div>`;
  });
  html += `</div>`;
  // Hanging scrolls
  html += `<div class="gfo-hanging-scroll" style="left:4%;top:60px;"><div class="gfo-hanging-scroll-string"></div><div class="gfo-hanging-scroll-body"><div class="gfo-hanging-scroll-char"></div></div></div>`;
  html += `<div class="gfo-hanging-scroll" style="right:4%;top:50px;"><div class="gfo-hanging-scroll-string"></div><div class="gfo-hanging-scroll-body" style="animation-delay:-2s;"><div class="gfo-hanging-scroll-char"></div></div></div>`;
  html += `<div class="gfo-hanging-scroll" style="left:12%;top:45px;"><div class="gfo-hanging-scroll-string"></div><div class="gfo-hanging-scroll-body" style="animation-delay:-1s;height:40px;"><div class="gfo-hanging-scroll-char"></div></div></div>`;
  html += `<div class="gfo-hanging-scroll" style="right:12%;top:55px;"><div class="gfo-hanging-scroll-string"></div><div class="gfo-hanging-scroll-body" style="animation-delay:-3s;height:45px;"><div class="gfo-hanging-scroll-char"></div></div></div>`;
  // Chopstick motifs
  html += `<div class="gfo-chopsticks" style="left:2%;top:200px;opacity:0.06;transform:rotate(15deg);"><svg viewBox="0 0 30 60"><line x1="8" y1="0" x2="12" y2="58" stroke="rgba(240,230,211,0.4)" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="0" x2="18" y2="58" stroke="rgba(240,230,211,0.4)" stroke-width="2" stroke-linecap="round"/></svg></div>`;
  html += `<div class="gfo-chopsticks" style="right:2%;bottom:300px;opacity:0.05;transform:rotate(-20deg);"><svg viewBox="0 0 30 60"><line x1="8" y1="0" x2="12" y2="58" stroke="rgba(240,230,211,0.4)" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="0" x2="18" y2="58" stroke="rgba(240,230,211,0.4)" stroke-width="2" stroke-linecap="round"/></svg></div>`;
  // Grease drips
  html += `<svg class="gfo-grease-drip visible" style="right:6%;top:30%;width:15px;height:60px;" viewBox="0 0 15 60"><path d="M7,0 Q8,15 7,30 Q6,40 8,50 Q7,55 8,60" stroke="rgba(120,80,30,0.2)" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="8" cy="58" r="3" fill="rgba(120,80,30,0.15)"/></svg>`;
  html += `<svg class="gfo-grease-drip visible" style="left:5%;top:45%;width:12px;height:50px;" viewBox="0 0 12 50"><path d="M6,0 Q7,12 6,25 Q5,35 7,45" stroke="rgba(120,80,30,0.15)" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="7" cy="48" r="2.5" fill="rgba(120,80,30,0.12)"/></svg>`;
  html += `<svg class="gfo-grease-drip visible" style="right:15%;top:60%;width:10px;height:45px;" viewBox="0 0 10 45"><path d="M5,0 Q6,10 5,20 Q4,30 6,40" stroke="rgba(120,80,30,0.18)" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="6" cy="43" r="2" fill="rgba(120,80,30,0.1)"/></svg>`;
  // Steam columns
  html += `<div class="gfo-steam-column" style="left:35%;"><div class="gfo-steam-puff" style="animation-duration:4s;left:5px;"></div><div class="gfo-steam-puff" style="animation-duration:5s;animation-delay:-1.5s;left:15px;"></div><div class="gfo-steam-puff" style="animation-duration:3.5s;animation-delay:-3s;left:10px;"></div></div>`;
  html += `<div class="gfo-steam-column" style="left:55%;"><div class="gfo-steam-puff" style="animation-duration:4.5s;animation-delay:-0.5s;left:8px;"></div><div class="gfo-steam-puff" style="animation-duration:3.8s;animation-delay:-2s;left:18px;"></div></div>`;
  // Ink drips
  html += `<div class="gfo-ink-drip" style="top:10%;right:3%;"><div class="gfo-ink-drip-drop" style="animation-duration:8s;"></div></div>`;
  html += `<div class="gfo-ink-drip" style="top:50%;left:2%;"><div class="gfo-ink-drip-drop" style="animation-duration:6s;animation-delay:-3s;"></div></div>`;
  // Brush flourishes
  html += `<div class="gfo-brush-flourish" style="top:60px;right:0;width:160px;height:30px;opacity:0.06;"><svg viewBox="0 0 160 30"><path d="M0,20 Q40,5 80,15 T160,8" stroke="rgba(232,149,46,0.3)" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg></div>`;
  // Calligraphy
  html += `<div class="gfo-calli-fragment" style="top:20%;left:1%;font-size:32px;transform:rotate(-10deg);color:rgba(232,149,46,0.02);">FEAST</div>`;
  html += `<div class="gfo-calli-fragment" style="bottom:20%;right:2%;font-size:26px;transform:rotate(4deg);color:rgba(194,54,22,0.02);">GAUNTLET</div>`;
  return html;
}

// ── WALL MAP BUILDER ──
function _buildWallMap(cd) {
  let html = `<div class="gfo-wall-map">`;
  // Mountain backdrop
  html += `<div class="gfo-wall-bg-mountains"><div class="gfo-wall-bg-far"></div></div>`;
  // Wall path SVG
  html += `<div class="gfo-wall-path"><svg class="gfo-wall-svg" viewBox="0 0 1000 80" preserveAspectRatio="none">
    <defs><linearGradient id="wallPathGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="rgba(143,167,196,0.3)"/><stop offset="50%" stop-color="rgba(212,160,23,0.2)"/><stop offset="100%" stop-color="rgba(194,54,22,0.3)"/></linearGradient></defs>
    <path d="M0,50 L100,48 C150,46 180,40 200,42 L300,38 C350,35 380,30 400,32 L500,28 C550,25 580,22 600,24 L700,20 C750,18 780,15 800,16 L900,14 L1000,12" stroke="url(#wallPathGrad)" stroke-width="3" fill="none"/>
    <path d="M0,50 L100,48 C150,46 180,40 200,42 L300,38 C350,35 380,30 400,32 L500,28 C550,25 580,22 600,24 L700,20 C750,18 780,15 800,16 L900,14 L1000,12 L1000,80 L0,80 Z" fill="rgba(240,230,211,0.02)"/>
    <g stroke="rgba(240,230,211,0.1)" stroke-width="1" fill="none">`;
  [50,65,150,165,250,350,450,550,650,750,850,950].forEach(x => {
    html += `<rect x="${x}" y="${Math.max(11, 50 - x * 0.04)}" width="5" height="4"/>`;
  });
  html += `</g>`;
  // Watchtower markers
  html += `<g fill="rgba(240,230,211,0.12)">`;
  [200, 400, 600, 800].forEach((x, i) => {
    const y = 22 - i * 6;
    html += `<rect x="${x-2}" y="${y}" width="10" height="22" rx="1"/><rect x="${x}" y="${y-4}" width="6" height="6" rx="1"/>`;
  });
  html += `</g>`;
  // Segment labels
  [100,300,500,700,900].forEach((x, i) => {
    html += `<text x="${x}" y="70" font-family="Cinzel" font-size="8" fill="rgba(240,230,211,0.15)" text-anchor="middle">SEG ${i+1}</text>`;
  });
  // Finish flag + start gate
  html += `<g transform="translate(980,6)"><line x1="0" y1="0" x2="0" y2="16" stroke="rgba(212,160,23,0.4)" stroke-width="1.5"/><path d="M0,0 L12,4 L0,8 Z" fill="rgba(212,160,23,0.3)"/></g>`;
  html += `<g transform="translate(10,44)"><line x1="0" y1="0" x2="0" y2="16" stroke="rgba(240,230,211,0.2)" stroke-width="1.5"/><text x="4" y="8" font-family="Cinzel" font-size="7" fill="rgba(240,230,211,0.2)">START</text></g>`;
  html += `</svg></div>`;

  // Player markers (initial: all at start)
  cd.raceStandings.forEach((rs, i) => {
    const isLast = rs.name === cd.raceEliminated;
    const stagger = 30 + (i % 3) * 22;
    html += `<div class="gfo-racer-marker${isLast ? ' last-place' : ''}" id="gfo-racer-${slug(rs.name)}" style="left:3%;bottom:${stagger}px;">
      <div class="gfo-racer-avatar">${portrait(rs.name, 28) || _initial(rs.name)}</div>
      <div class="gfo-racer-name">${rs.name}</div>
    </div>`;
  });

  // Torch glows at watchtower positions
  [19.5, 39.5, 59.5, 79.5].forEach((pos, i) => {
    html += `<div class="gfo-torch-glow" style="left:${pos}%;bottom:${60 + i * 8}px;">
      <div class="gfo-torch-halo"></div>
      <div class="gfo-torch-flame" style="animation-delay:-${i * 0.2}s;"></div>
    </div>`;
  });

  // Ink splatters on map
  html += `<svg class="gfo-map-splatter" id="gfo-map-splatter-0" style="left:25%;top:30%;width:50px;height:40px;" viewBox="0 0 50 40"><circle cx="25" cy="20" r="15" fill="rgba(194,54,22,0.15)"/><circle cx="10" cy="10" r="6" fill="rgba(194,54,22,0.1)"/><circle cx="40" cy="30" r="5" fill="rgba(194,54,22,0.08)"/></svg>`;
  html += `<svg class="gfo-map-splatter" id="gfo-map-splatter-1" style="left:55%;top:20%;width:35px;height:35px;" viewBox="0 0 35 35"><circle cx="18" cy="18" r="12" fill="rgba(26,26,26,0.12)"/><circle cx="8" cy="8" r="4" fill="rgba(26,26,26,0.08)"/></svg>`;
  html += `<svg class="gfo-map-splatter" id="gfo-map-splatter-2" style="left:72%;top:40%;width:30px;height:25px;" viewBox="0 0 30 25"><circle cx="15" cy="12" r="9" fill="rgba(194,54,22,0.1)"/><circle cx="6" cy="6" r="4" fill="rgba(194,54,22,0.06)"/></svg>`;

  html += `</div>`;
  return html;
}

// ── PHASE TRACKER ──
function _phaseTracker(activePhase) {
  const phases = ['Cold Open', 'The Scramble', 'Gauntlet Race', 'Eating Gauntlet', 'Results'];
  const activeIdx = phases.indexOf(activePhase);
  let html = `<div class="gfo-phase-tracker">`;
  phases.forEach((p, i) => {
    if (i > 0) html += `<div class="gfo-phase-arrow">&#x203a;</div>`;
    const cls = i === activeIdx ? 'active' : i < activeIdx ? 'completed' : '';
    html += `<div class="gfo-phase-pip ${cls}">${p}</div>`;
  });
  html += `</div>`;
  return html;
}

// ── CONTROLS ──
function _controls(screenKey, totalSteps) {
  return `<div class="gfo-controls" id="gfo-controls-${screenKey}" style="position:fixed;bottom:0;left:0;right:0;z-index:200;display:flex;justify-content:center;align-items:center;gap:12px;padding:12px;background:linear-gradient(180deg,transparent,rgba(26,15,10,0.95) 30%);backdrop-filter:blur(4px);">
    <button class="gfo-btn" onclick="gfoRevealNext('${screenKey}',${totalSteps})" style="font-family:var(--gfo-font-display);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--gfo-gold);background:rgba(212,160,23,0.1);border:1px solid rgba(212,160,23,0.3);border-radius:3px;padding:8px 20px;cursor:pointer;transition:all 0.3s;">Reveal Next</button>
    <span id="gfo-counter-${screenKey}" style="font-family:var(--gfo-font-display);font-size:11px;color:rgba(240,230,211,0.3);letter-spacing:1px;">0 / ${totalSteps}</span>
    <button class="gfo-btn" onclick="gfoRevealAll('${screenKey}',${totalSteps})" style="font-family:var(--gfo-font-display);font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,230,211,0.4);background:rgba(240,230,211,0.04);border:1px solid rgba(240,230,211,0.1);border-radius:3px;padding:8px 20px;cursor:pointer;transition:all 0.3s;">Reveal All</button>
  </div>`;
}

// ── CSS ──
function _gfoCss() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');

:root{
  --gfo-cinnabar:#c23616;--gfo-cinnabar-dark:#8b1a0e;--gfo-jade:#2d6a4f;--gfo-jade-light:#40916c;
  --gfo-gold:#d4a017;--gfo-gold-light:#f0c94b;--gfo-ink:#1a1a1a;--gfo-parchment:#f0e6d3;
  --gfo-parchment-dark:#d9cbb8;--gfo-mist:#8fa7c4;--gfo-mist-light:#b8cfe0;
  --gfo-amber:#e8952e;--gfo-amber-dark:#b8700f;--gfo-steam:rgba(255,255,255,0.12);
  --gfo-vomit:#7a9a3a;--gfo-grease:rgba(120,80,30,0.15);
  --gfo-font-display:'Cinzel', serif;--gfo-font-body:'Crimson Text', serif;
}

.gfo-shell{max-width:1100px;margin:0 auto;position:relative;min-height:100vh;font-family:var(--gfo-font-body);color:var(--gfo-ink);}
.gfo-shell *{box-sizing:border-box;}
.gfo-shell{--grain:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E");}

.gfo-title-screen::before,.gfo-race-screen::before,.gfo-scramble-screen::before,.gfo-eating-screen::before,.gfo-results-screen::before{content:'';position:absolute;inset:0;background:var(--grain);pointer-events:none;z-index:0;opacity:0.6;}

/* Card brush borders */
.gfo-card::before{content:'';position:absolute;inset:-1px;background:linear-gradient(90deg,rgba(240,230,211,0.06) 0%,transparent 3%,transparent 97%,rgba(240,230,211,0.06) 100%),linear-gradient(180deg,rgba(240,230,211,0.04) 0%,transparent 4%,transparent 96%,rgba(240,230,211,0.04) 100%);pointer-events:none;border-radius:3px;}
.gfo-card::after{content:'';position:absolute;bottom:-1px;left:8px;right:8px;height:2px;background:linear-gradient(90deg,transparent,rgba(240,230,211,0.05),rgba(240,230,211,0.08),rgba(240,230,211,0.05),transparent);pointer-events:none;}
.gfo-card{background:radial-gradient(ellipse at 0% 0%,rgba(240,230,211,0.04) 0%,transparent 35%),radial-gradient(ellipse at 100% 100%,rgba(240,230,211,0.03) 0%,transparent 35%),linear-gradient(135deg,rgba(240,230,211,0.06) 0%,rgba(240,230,211,0.02) 100%);transition:box-shadow 0.3s ease,border-color 0.3s ease;}
.gfo-card:hover{box-shadow:0 0 15px rgba(240,230,211,0.03);}

/* Ink drips */
.gfo-ink-drip{position:absolute;width:3px;pointer-events:none;z-index:1;}
.gfo-ink-drip-drop{width:3px;height:0;background:linear-gradient(180deg,rgba(26,26,26,0.3),rgba(26,26,26,0.05));border-radius:0 0 2px 2px;animation:gfo-drip-fall linear infinite;}
@keyframes gfo-drip-fall{0%{height:0;opacity:0;transform:translateY(0);}10%{opacity:0.6;}60%{height:25px;opacity:0.4;}100%{height:35px;opacity:0;transform:translateY(80px);}}

/* Brush flourish */
.gfo-brush-flourish{position:absolute;pointer-events:none;z-index:1;overflow:visible;}
.gfo-brush-flourish svg{width:100%;height:100%;}

/* Birds */
.gfo-bird{position:absolute;pointer-events:none;z-index:2;animation:gfo-bird-fly linear infinite;}
@keyframes gfo-bird-fly{0%{transform:translateX(-100px) translateY(0);}25%{transform:translateX(100px) translateY(-15px);}50%{transform:translateX(300px) translateY(-5px);}75%{transform:translateX(500px) translateY(-20px);}100%{transform:translateX(1200px) translateY(-10px);}}
.gfo-bird svg{width:20px;height:12px;fill:none;stroke:rgba(60,30,40,0.4);stroke-width:1.5;stroke-linecap:round;}

/* Torch glow */
.gfo-torch-glow{position:absolute;pointer-events:none;z-index:2;}
.gfo-torch-flame{width:8px;height:14px;background:radial-gradient(ellipse at 50% 80%,rgba(255,200,80,0.9),rgba(232,149,46,0.5),transparent);border-radius:50% 50% 30% 30%;animation:gfo-torch-flicker 0.8s ease-in-out infinite alternate;filter:blur(1px);}
@keyframes gfo-torch-flicker{0%{transform:scaleY(1) scaleX(1);opacity:0.8;}30%{transform:scaleY(1.2) scaleX(0.85);opacity:1;}60%{transform:scaleY(0.9) scaleX(1.1);opacity:0.7;}100%{transform:scaleY(1.1) scaleX(0.9);opacity:0.9;}}
.gfo-torch-halo{position:absolute;top:-15px;left:-20px;width:46px;height:46px;background:radial-gradient(circle,rgba(232,149,46,0.3),rgba(232,120,40,0.1) 50%,transparent 70%);animation:gfo-torch-halo-pulse 2s ease-in-out infinite alternate;}
@keyframes gfo-torch-halo-pulse{0%{opacity:0.6;transform:scale(0.9);}100%{opacity:1;transform:scale(1.15);}}

/* Fog bands */
.gfo-fog-band{position:absolute;pointer-events:none;z-index:1;height:25px;background:linear-gradient(90deg,transparent 0%,rgba(220,180,140,0.1) 20%,rgba(240,200,150,0.15) 50%,rgba(220,180,140,0.1) 80%,transparent 100%);filter:blur(10px);border-radius:50%;animation:gfo-fog-drift linear infinite;}
@keyframes gfo-fog-drift{0%{transform:translateX(-30%);}100%{transform:translateX(30%);}}

/* Calligraphy fragments */
.gfo-calli-fragment{position:absolute;pointer-events:none;z-index:0;font-family:var(--gfo-font-display);font-size:28px;font-weight:900;color:rgba(240,230,211,0.02);letter-spacing:4px;transform:rotate(-8deg);user-select:none;white-space:nowrap;}

/* Announcer chatter */
.gfo-announcer{text-align:center;padding:6px 16px;margin:4px 0;font-family:var(--gfo-font-body);font-size:12px;font-style:italic;color:rgba(240,230,211,0.2);position:relative;}
.gfo-announcer::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(240,230,211,0.15);margin-right:8px;vertical-align:middle;}
.gfo-announcer.host{color:rgba(212,160,23,0.25);}
.gfo-announcer.host::before{background:rgba(212,160,23,0.3);box-shadow:0 0 4px rgba(212,160,23,0.2);}
.gfo-announcer.crowd{color:rgba(143,167,196,0.2);}
.gfo-announcer.crowd::before{background:rgba(143,167,196,0.2);}

/* Hanging scrolls */
.gfo-hanging-scroll{position:absolute;pointer-events:none;z-index:1;display:flex;flex-direction:column;align-items:center;}
.gfo-hanging-scroll-string{width:1px;height:25px;background:rgba(240,230,211,0.1);}
.gfo-hanging-scroll-body{width:18px;height:50px;background:linear-gradient(180deg,rgba(240,230,211,0.06),rgba(240,230,211,0.02));border:1px solid rgba(240,230,211,0.04);border-radius:2px 2px 0 0;position:relative;animation:gfo-scroll-sway 5s ease-in-out infinite;}
@keyframes gfo-scroll-sway{0%,100%{transform:rotate(-1deg);}50%{transform:rotate(1deg);}}
.gfo-hanging-scroll-body::after{content:'';position:absolute;bottom:-8px;left:3px;right:3px;height:8px;background:linear-gradient(180deg,rgba(240,230,211,0.03),transparent);clip-path:polygon(0 0,100% 0,50% 100%);}
.gfo-hanging-scroll-char{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:1px;height:30px;background:linear-gradient(180deg,rgba(26,26,26,0.15),rgba(26,26,26,0.05));}

/* Chopstick motifs */
.gfo-chopsticks{position:absolute;pointer-events:none;z-index:1;width:30px;height:60px;}
.gfo-chopsticks svg{width:100%;height:100%;}

/* Grease drips */
.gfo-grease-drip{position:absolute;pointer-events:none;z-index:1;opacity:0;transition:opacity 0.8s ease;}
.gfo-grease-drip.visible{opacity:1;}
.gfo-grease-drip svg{width:100%;height:100%;}

/* Steam columns */
.gfo-steam-column{position:absolute;bottom:0;pointer-events:none;z-index:1;width:40px;overflow:visible;}
.gfo-steam-puff{position:absolute;bottom:0;width:20px;height:20px;background:radial-gradient(circle,rgba(255,255,255,0.06),transparent 70%);border-radius:50%;animation:gfo-puff-rise ease-out infinite;}
@keyframes gfo-puff-rise{0%{transform:translateY(0) scale(1);opacity:0.5;}40%{opacity:0.3;}100%{transform:translateY(-200px) scale(3);opacity:0;}}

/* Ink wash wipe */
.gfo-ink-wipe{position:absolute;inset:0;pointer-events:none;z-index:3;}
.gfo-ink-wipe-band{position:absolute;top:0;bottom:0;background:rgba(26,26,26,0.85);animation:gfo-wipe-sweep 1.5s cubic-bezier(0.7,0,0.3,1) forwards;}
@keyframes gfo-wipe-sweep{0%{left:-100%;width:100%;}40%{left:0%;width:100%;}60%{left:0%;width:100%;}100%{left:100%;width:100%;}}
.gfo-ink-wipe-band:nth-child(2){animation-delay:0.1s;background:rgba(26,26,26,0.5);}
.gfo-ink-wipe-band:nth-child(3){animation-delay:0.2s;background:rgba(26,26,26,0.3);}

/* Gong burst */
.gfo-gong-burst{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;pointer-events:none;animation:gfo-gong-ring 2s ease-out forwards;animation-delay:2.5s;opacity:0;width:500px!important;height:500px!important;}
@keyframes gfo-gong-ring{0%{opacity:0;transform:translate(-50%,-50%) scale(0);}20%{opacity:0.6;}100%{opacity:0;transform:translate(-50%,-50%) scale(3);}}
.gfo-gong-circle{position:absolute;inset:0;border:2px solid var(--gfo-gold);border-radius:50%;opacity:0.4;}
.gfo-gong-circle:nth-child(2){inset:15%;animation-delay:2.6s;border-color:rgba(212,160,23,0.3);}
.gfo-gong-circle:nth-child(3){inset:30%;animation-delay:2.7s;border-color:rgba(212,160,23,0.2);}
.gfo-gong-shockwave{position:absolute;inset:20%;border:3px solid rgba(212,160,23,0.4);border-radius:50%;animation:gfo-shockwave 1s ease-out forwards;animation-delay:2.5s;opacity:0;}
@keyframes gfo-shockwave{0%{opacity:0;transform:scale(0);border-width:3px;}30%{opacity:0.8;border-width:2px;}100%{opacity:0;transform:scale(5);border-width:0.5px;}}

/* Ink pools */
.gfo-ink-pool{position:absolute;pointer-events:none;border-radius:50%;animation:gfo-pool-spread 3s ease-out forwards;opacity:0;}
@keyframes gfo-pool-spread{0%{opacity:0;transform:scale(0);}20%{opacity:0.15;}100%{opacity:0.08;transform:scale(1);}}

/* Ink splatters */
.gfo-ink-splatter{position:absolute;pointer-events:none;animation:gfo-splat-in 0.3s ease-out forwards;opacity:0;}
@keyframes gfo-splat-in{0%{opacity:0;transform:scale(0);}60%{opacity:0.7;transform:scale(1.2);}100%{opacity:0.5;transform:scale(1);}}
.gfo-splatter-1{top:15%;left:8%;animation-delay:2.8s;width:40px;height:35px;}
.gfo-splatter-2{top:60%;right:10%;animation-delay:3.0s;width:30px;height:40px;}
.gfo-splatter-3{bottom:20%;left:20%;animation-delay:3.2s;width:50px;height:30px;}
.gfo-splatter-4{top:35%;right:25%;animation-delay:3.1s;width:25px;height:25px;}

/* Section border brush strokes */
.gfo-race-screen,.gfo-scramble-screen,.gfo-eating-screen{border-top:2px solid transparent;border-image:linear-gradient(90deg,transparent 5%,rgba(212,160,23,0.15) 15%,rgba(212,160,23,0.25) 50%,rgba(212,160,23,0.15) 85%,transparent 95%) 1;}

/* Fortress wall silhouette at bottom of scramble/race */
.gfo-scramble-screen::after,.gfo-race-screen::after{content:'';position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(180deg,transparent 0%,rgba(26,15,10,0.4) 40%,rgba(26,15,10,0.7) 100%);clip-path:polygon(0 60%,2% 45%,5% 55%,8% 35%,12% 50%,15% 30%,18% 45%,22% 25%,26% 40%,30% 20%,34% 35%,38% 22%,42% 38%,46% 18%,50% 32%,54% 15%,58% 28%,62% 20%,66% 35%,70% 18%,74% 30%,78% 22%,82% 38%,86% 15%,90% 30%,94% 20%,98% 35%,100% 25%,100% 100%,0 100%);pointer-events:none;z-index:0;}

/* Phase tracker */
.gfo-phase-tracker{position:sticky;top:46px;z-index:100;display:flex;align-items:center;justify-content:center;gap:0;padding:4px 20px;background:linear-gradient(180deg,rgba(30,18,12,0.95) 0%,rgba(40,25,15,0.9) 100%);backdrop-filter:blur(8px);border-bottom:2px solid var(--gfo-gold);box-sizing:border-box;}
.gfo-phase-pip{font-family:var(--gfo-font-display);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(240,230,211,0.35);padding:3px 14px;position:relative;transition:all 0.4s ease;}
.gfo-phase-pip.active{color:var(--gfo-gold);text-shadow:0 0 12px rgba(212,160,23,0.4);}
.gfo-phase-pip.active::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:2px;background:linear-gradient(90deg,transparent,var(--gfo-gold),transparent);border-radius:1px;}
.gfo-phase-pip.completed{color:rgba(240,230,211,0.55);}
.gfo-phase-arrow{color:rgba(240,230,211,0.2);font-size:16px;margin:0 4px;}

/* ── TITLE SCREEN ── */
.gfo-title-screen{position:relative;min-height:90vh;overflow:hidden;background:linear-gradient(180deg,#1a0f2e 0%,#3d1f3f 15%,#7a3b2e 30%,#c4652a 48%,#e8a030 62%,#f0c94b 72%,#f5dfa0 82%,#e8c87a 92%,#c49040 100%);display:flex;align-items:center;justify-content:center;}
.gfo-title-mountains{position:absolute;inset:0;overflow:hidden;}
.gfo-mountain-layer{position:absolute;bottom:0;left:0;width:100%;}
.gfo-mountain-far{height:50%;opacity:0.5;background:linear-gradient(180deg,#3d2040 0%,#5a3050 50%,#4a2535 100%);clip-path:polygon(0 60%,8% 35%,15% 50%,25% 20%,35% 40%,45% 15%,55% 35%,65% 10%,75% 30%,85% 18%,92% 40%,100% 25%,100% 100%,0 100%);animation:gfo-parallax-drift 40s ease-in-out infinite alternate;}
.gfo-mountain-mid{height:40%;opacity:0.65;background:linear-gradient(180deg,#2a1525 0%,#3d1f30 50%,#1a0f15 100%);clip-path:polygon(0 55%,10% 30%,20% 45%,30% 15%,42% 35%,55% 10%,68% 30%,78% 20%,88% 35%,100% 15%,100% 100%,0 100%);animation:gfo-parallax-drift 30s ease-in-out infinite alternate-reverse;}
@keyframes gfo-parallax-drift{0%{transform:translateX(-10px);}100%{transform:translateX(10px);}}

.gfo-mist-layer{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.gfo-mist-band{position:absolute;width:200%;height:40px;background:linear-gradient(90deg,transparent,rgba(232,168,80,0.12),rgba(240,200,130,0.18),rgba(232,168,80,0.12),transparent);animation:gfo-mist-flow linear infinite;border-radius:50%;filter:blur(12px);}
.gfo-mist-band:nth-child(1){top:30%;animation-duration:35s;opacity:0.8;}
.gfo-mist-band:nth-child(2){top:50%;animation-duration:28s;opacity:0.6;animation-delay:-10s;}
.gfo-mist-band:nth-child(3){top:70%;animation-duration:42s;opacity:0.5;animation-delay:-20s;background:linear-gradient(90deg,transparent,rgba(196,100,60,0.1),rgba(220,140,80,0.15),rgba(196,100,60,0.1),transparent);}
@keyframes gfo-mist-flow{0%{transform:translateX(-50%);}100%{transform:translateX(0%);}}

.gfo-scroll-unfurl{position:relative;z-index:10;text-align:center;padding:60px 40px;}
.gfo-scroll-paper{position:relative;background:radial-gradient(ellipse at 30% 20%,rgba(60,40,25,0.95) 0%,rgba(35,22,15,0.92) 60%),linear-gradient(180deg,rgba(45,30,20,0.95) 0%,rgba(30,20,12,0.95) 100%);border:1px solid rgba(212,160,23,0.2);padding:60px 50px 50px;max-width:700px;margin:0 auto;animation:gfo-scroll-reveal 1.8s cubic-bezier(0.16,1,0.3,1) forwards;transform-origin:top center;box-shadow:0 8px 40px rgba(0,0,0,0.5),0 0 80px rgba(26,15,10,0.4);}
@keyframes gfo-scroll-reveal{0%{max-height:0;opacity:0;padding:0 50px;}30%{opacity:1;}100%{max-height:800px;opacity:1;padding:60px 50px 50px;}}

.gfo-scroll-roller{position:absolute;left:-8px;right:-8px;height:18px;background:linear-gradient(180deg,rgba(90,60,30,0.6) 0%,rgba(120,80,40,0.8) 30%,rgba(160,120,60,0.6) 50%,rgba(120,80,40,0.8) 70%,rgba(90,60,30,0.6) 100%);border-radius:9px;box-shadow:0 2px 8px rgba(0,0,0,0.4);}
.gfo-scroll-roller-top{top:-9px;}
.gfo-scroll-roller-bottom{bottom:-9px;}
.gfo-scroll-roller-knob{position:absolute;top:2px;width:14px;height:14px;background:radial-gradient(circle at 40% 40%,rgba(212,160,23,0.6),rgba(120,80,30,0.8));border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);}
.gfo-scroll-roller-knob.left{left:4px;}
.gfo-scroll-roller-knob.right{right:4px;}

.gfo-brush-line{height:2px;background:linear-gradient(90deg,transparent,rgba(212,160,23,0.3),rgba(212,160,23,0.6),rgba(212,160,23,0.3),transparent);margin:16px auto;max-width:300px;position:relative;}
.gfo-brush-line::after{content:'';position:absolute;top:-1px;left:20%;right:20%;height:4px;background:linear-gradient(90deg,transparent,rgba(212,160,23,0.15),transparent);filter:blur(2px);}

.gfo-title-main{font-family:var(--gfo-font-display);font-size:42px;font-weight:900;color:var(--gfo-gold);text-shadow:0 0 20px rgba(212,160,23,0.3),0 2px 4px rgba(0,0,0,0.5);letter-spacing:3px;text-transform:uppercase;line-height:1.2;margin:8px 0;animation:gfo-title-burn 2.5s ease forwards;animation-delay:1s;opacity:0;}
@keyframes gfo-title-burn{0%{opacity:0;letter-spacing:8px;filter:blur(4px);}60%{opacity:1;filter:blur(0);}100%{opacity:1;letter-spacing:3px;filter:blur(0);}}

.gfo-title-sub{font-family:var(--gfo-font-display);font-size:14px;font-weight:600;color:rgba(240,230,211,0.7);letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;animation:gfo-fade-in 1s ease forwards;animation-delay:0.5s;opacity:0;}
@keyframes gfo-fade-in{to{opacity:1;}}

.gfo-fortress-silhouette{position:relative;height:80px;margin:24px 0 16px;animation:gfo-fade-in 1.5s ease forwards;animation-delay:1.8s;opacity:0;}
.gfo-fortress-svg{width:100%;height:100%;}

.gfo-host-announce{font-family:var(--gfo-font-body);font-size:16px;font-style:italic;color:rgba(240,230,211,0.75);margin-top:20px;animation:gfo-fade-in 1s ease forwards;animation-delay:2s;opacity:0;line-height:1.5;}
.gfo-host-ellipsis{color:var(--gfo-cinnabar);font-weight:700;font-style:normal;}

/* Scramble grid */
.gfo-scramble-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:24px;animation:gfo-fade-in 1s ease forwards;animation-delay:2.2s;opacity:0;}
.gfo-scramble-card{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px 6px;width:72px;background:rgba(30,20,12,0.7);border:1px solid rgba(212,160,23,0.12);border-radius:3px;position:relative;animation:gfo-scramble-jolt 0.8s ease forwards;opacity:0;}
@keyframes gfo-scramble-jolt{0%{opacity:0;transform:translateY(15px) rotate(0deg);}40%{opacity:1;transform:translateY(-4px) rotate(-2deg);}60%{transform:translateY(2px) rotate(1deg);}100%{opacity:1;transform:translateY(0) rotate(0deg);}}
.gfo-scramble-card:nth-child(odd){animation:gfo-scramble-jolt 0.8s ease forwards,gfo-jitter-a 2.5s ease-in-out infinite 3.5s;}
.gfo-scramble-card:nth-child(even){animation:gfo-scramble-jolt 0.8s ease forwards,gfo-jitter-b 3s ease-in-out infinite 3.5s;}
@keyframes gfo-jitter-a{0%,100%{transform:translateX(0) rotate(0deg);}25%{transform:translateX(-2px) rotate(-1deg);}75%{transform:translateX(2px) rotate(1deg);}}
@keyframes gfo-jitter-b{0%,100%{transform:translateY(0) rotate(0deg);}30%{transform:translateY(-2px) rotate(0.5deg);}70%{transform:translateY(2px) rotate(-0.5deg);}}

.gfo-scramble-avatar{width:32px;height:32px;border-radius:50%;border:2px solid rgba(240,230,211,0.2);background:rgba(26,26,26,0.6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--gfo-parchment);font-family:var(--gfo-font-display);position:relative;overflow:visible;}
.gfo-scramble-avatar img{width:32px;height:32px;border-radius:50%;object-fit:contain;}
.gfo-scramble-name{font-family:var(--gfo-font-display);font-size:8px;font-weight:600;letter-spacing:0.5px;color:rgba(240,230,211,0.5);text-align:center;line-height:1.2;}
.gfo-scramble-vehicle{width:22px;height:22px;margin-top:2px;}
.gfo-scramble-vehicle svg{width:100%;height:100%;fill:none;stroke:rgba(240,230,211,0.3);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
.gfo-scramble-tier{font-family:var(--gfo-font-display);font-size:7px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;padding:1px 4px;border-radius:2px;}
.gfo-scramble-tier.t1{color:var(--gfo-gold);background:rgba(212,160,23,0.12);}
.gfo-scramble-tier.t2{color:rgba(240,230,211,0.4);background:rgba(240,230,211,0.05);}
.gfo-scramble-tier.t3{color:var(--gfo-amber);background:rgba(232,149,46,0.1);}
.gfo-scramble-tier.t4{color:var(--gfo-cinnabar);background:rgba(194,54,22,0.1);}

.gfo-scramble-react{position:absolute;top:-6px;right:-6px;font-size:10px;}
.gfo-scramble-legs{position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:20px;height:10px;}
.gfo-scramble-leg{position:absolute;bottom:0;width:2px;height:8px;background:rgba(240,230,211,0.25);border-radius:1px;transform-origin:top center;}
.gfo-scramble-leg.left{left:5px;animation:gfo-leg-run-l 0.4s ease-in-out infinite 3.5s;}
.gfo-scramble-leg.right{right:5px;animation:gfo-leg-run-r 0.4s ease-in-out infinite 3.5s;}
@keyframes gfo-leg-run-l{0%,100%{transform:rotate(-20deg);}50%{transform:rotate(20deg);}}
@keyframes gfo-leg-run-r{0%,100%{transform:rotate(20deg);}50%{transform:rotate(-20deg);}}

/* ── SCRAMBLE SCREEN ── */
.gfo-scramble-screen{position:relative;min-height:80vh;padding:30px 0;background:linear-gradient(180deg,#2a1520 0%,#4a2820 10%,#6b3d22 25%,#8a5525 40%,#a06a28 55%,#8a5525 70%,#5a3520 85%,#2a1a15 100%);}
.gfo-scramble-banner{text-align:center;padding:0 20px 20px;}
.gfo-scramble-phase-title{font-family:var(--gfo-font-display);font-size:22px;font-weight:800;color:var(--gfo-gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;}
.gfo-scramble-phase-sub{font-family:var(--gfo-font-body);font-size:14px;font-style:italic;color:rgba(240,230,211,0.4);}

.gfo-vehicle-depot{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:16px 20px;padding:16px;background:rgba(240,230,211,0.02);border:1px solid rgba(240,230,211,0.06);border-radius:3px;}
.gfo-depot-slot{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;min-width:65px;border:1px dashed rgba(240,230,211,0.08);border-radius:3px;transition:all 0.3s ease;}
.gfo-depot-slot.grabbed{opacity:0.25;border-color:transparent;}
.gfo-depot-vehicle{width:28px;height:28px;}
.gfo-depot-vehicle svg{width:100%;height:100%;fill:none;stroke:rgba(240,230,211,0.3);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
.gfo-depot-vehicle-name{font-family:var(--gfo-font-display);font-size:8px;font-weight:600;letter-spacing:0.5px;color:rgba(240,230,211,0.35);text-align:center;}
.gfo-depot-tier-dot{width:6px;height:6px;border-radius:50%;}

.gfo-grab-card{position:relative;background:linear-gradient(135deg,rgba(240,230,211,0.05) 0%,rgba(240,230,211,0.02) 100%);border:1px solid rgba(240,230,211,0.08);border-radius:3px;padding:14px 18px;display:grid;grid-template-columns:36px auto 1fr auto;align-items:center;gap:12px;}
.gfo-grab-card.has-drama{border-left:3px solid var(--gfo-amber);}
.gfo-grab-order{font-family:var(--gfo-font-display);font-size:18px;font-weight:800;color:rgba(240,230,211,0.2);text-align:center;}
.gfo-grab-info{display:flex;flex-direction:column;gap:2px;}
.gfo-grab-player{font-family:var(--gfo-font-display);font-size:14px;font-weight:700;color:var(--gfo-parchment);}
.gfo-grab-action{font-family:var(--gfo-font-body);font-size:13px;color:rgba(240,230,211,0.55);line-height:1.4;}
.gfo-grab-action strong{color:var(--gfo-gold);}
.gfo-grab-action .gfo-neg{color:var(--gfo-cinnabar);}
.gfo-grab-vehicle-result{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 10px;background:rgba(240,230,211,0.03);border:1px solid rgba(240,230,211,0.06);border-radius:3px;min-width:70px;}
.gfo-grab-vehicle-icon{width:24px;height:24px;}
.gfo-grab-vehicle-icon svg{width:100%;height:100%;fill:none;stroke:rgba(240,230,211,0.4);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;}
.gfo-grab-vehicle-label{font-family:var(--gfo-font-display);font-size:8px;font-weight:600;letter-spacing:0.5px;color:rgba(240,230,211,0.4);}

.gfo-scramble-drama{position:relative;background:linear-gradient(135deg,rgba(232,149,46,0.06) 0%,rgba(26,26,26,0.4) 100%);border:1px solid rgba(232,149,46,0.12);border-left:3px solid var(--gfo-amber);border-radius:3px;padding:14px 18px;}
.gfo-scramble-drama-header{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.gfo-scramble-drama-tag{font-family:var(--gfo-font-display);font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--gfo-amber);}
.gfo-scramble-drama-body{font-family:var(--gfo-font-body);font-size:14px;color:rgba(240,230,211,0.7);line-height:1.5;}
.gfo-scramble-drama-body strong{color:var(--gfo-gold);}

/* ── RACE SCREEN ── */
.gfo-race-screen{position:relative;background:linear-gradient(180deg,#1a0f2e 0%,#2d1835 10%,#4a2540 20%,#6a3535 35%,#8a4a30 50%,#7a4030 65%,#4a2530 80%,#2a1525 90%,#1a0f1e 100%);padding:20px 0;min-height:100vh;}

.gfo-wall-map{position:sticky;top:76px;z-index:55;margin:0 20px;height:140px;background:linear-gradient(180deg,#3a2030 0%,#5a3535 20%,#7a4a35 45%,#6a4030 65%,#4a2a25 85%,#2a1520 100%);border-radius:0 0 4px 4px;overflow:hidden;border:1px solid rgba(212,160,23,0.15);border-top:none;}
.gfo-wall-bg-mountains{position:absolute;top:0;left:0;right:0;height:60%;opacity:0.6;}
.gfo-wall-bg-far{position:absolute;bottom:0;left:0;width:100%;height:100%;clip-path:polygon(0 70%,5% 50%,12% 65%,20% 35%,30% 55%,40% 25%,50% 45%,60% 20%,70% 40%,80% 30%,90% 50%,100% 35%,100% 100%,0 100%);background:linear-gradient(180deg,#4a2535,#3a1a25);}
.gfo-wall-path{position:absolute;bottom:30px;left:40px;right:40px;height:80px;}
.gfo-wall-svg{width:100%;height:100%;}

.gfo-racer-marker{position:absolute;bottom:40px;display:flex;flex-direction:column;align-items:center;gap:1px;transition:left 0.8s cubic-bezier(0.16,1,0.3,1);}
.gfo-racer-avatar{width:28px;height:28px;border-radius:50%;border:2px solid var(--gfo-gold);background:rgba(26,26,26,0.8);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--gfo-parchment);font-family:var(--gfo-font-display);overflow:hidden;}
.gfo-racer-avatar img{width:28px;height:28px;border-radius:50%;object-fit:contain;}
.gfo-racer-name{font-size:9px;font-family:var(--gfo-font-display);color:rgba(240,230,211,0.6);letter-spacing:0.5px;font-weight:600;white-space:nowrap;}
.gfo-racer-marker.last-place .gfo-racer-avatar{border-color:var(--gfo-cinnabar);}
.gfo-racer-marker.last-place .gfo-racer-name{color:var(--gfo-cinnabar);}

.gfo-map-splatter{position:absolute;pointer-events:none;opacity:0;transition:opacity 0.3s ease;}
.gfo-map-splatter.visible{opacity:0.3;}

/* Content area */
.gfo-content-area{display:grid;grid-template-columns:1fr 280px;gap:16px;padding:0 20px 20px;}
.gfo-card-feed{display:flex;flex-direction:column;gap:12px;}

/* Base card */
.gfo-card{position:relative;background:linear-gradient(135deg,rgba(240,230,211,0.06) 0%,rgba(240,230,211,0.02) 100%);border:1px solid rgba(240,230,211,0.08);border-radius:3px;padding:16px 20px;overflow:hidden;}
[id^="gfo-step-"].visible.paint-in{animation:gfo-card-paint 0.6s cubic-bezier(0.16,1,0.3,1) forwards;}
@keyframes gfo-card-paint{0%{clip-path:inset(0 100% 0 0);}100%{clip-path:inset(0 0% 0 0);}}

.gfo-card.race-event{border-left:3px solid var(--gfo-gold);}
.gfo-card.trap-event{border-left:3px solid var(--gfo-cinnabar);}
.gfo-card.social-event{border-left:3px solid var(--gfo-jade);}
.gfo-card.segment-result{border-left:3px solid rgba(240,230,211,0.25);background:rgba(26,26,26,0.25);}
.gfo-card.standings-card{border-left:3px solid var(--gfo-gold);background:linear-gradient(135deg,rgba(212,175,55,0.06) 0%,rgba(26,26,26,0.4) 100%);}
.gfo-card.elimination-event{border-left:3px solid var(--gfo-cinnabar);background:linear-gradient(135deg,rgba(194,54,22,0.08) 0%,rgba(26,26,26,0.4) 100%);}

.gfo-standings-board{display:flex;flex-direction:column;gap:3px;margin-top:6px;}
.gfo-standings-row{display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:3px;font-family:var(--gfo-font-body);font-size:13px;color:rgba(240,230,211,0.7);background:rgba(26,26,26,0.25);}
.gfo-standings-row.gfo-pos-first{background:rgba(212,175,55,0.12);color:var(--gfo-gold);font-weight:600;}
.gfo-standings-row.gfo-pos-last{background:rgba(194,54,22,0.1);color:var(--gfo-cinnabar);}
.gfo-standings-pos{font-family:var(--gfo-font-display);font-weight:700;width:18px;text-align:center;font-size:12px;}
.gfo-standings-avatar{width:24px;height:24px;border-radius:50%;overflow:hidden;flex-shrink:0;}
.gfo-standings-avatar img{width:24px;height:24px;border-radius:50%;object-fit:contain;}
.gfo-standings-name{flex:1;font-weight:500;}
.gfo-standings-time{font-family:var(--gfo-font-display);font-size:12px;letter-spacing:0.5px;opacity:0.8;}
.gfo-standings-badge{font-size:14px;}

.gfo-card-stamp{position:absolute;top:8px;right:12px;width:28px;height:28px;opacity:0.5;}
.gfo-card-stamp svg{width:100%;height:100%;}
.gfo-card-header{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.gfo-card-player-ring{width:32px;height:32px;border-radius:50%;border:2px solid rgba(240,230,211,0.2);background:rgba(26,26,26,0.6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--gfo-parchment);font-family:var(--gfo-font-display);flex-shrink:0;overflow:hidden;}
.gfo-card-player-ring img{width:32px;height:32px;border-radius:50%;object-fit:contain;}
.gfo-card-title{font-family:var(--gfo-font-display);font-size:14px;font-weight:700;color:var(--gfo-parchment);letter-spacing:0.5px;}
.gfo-card-subtitle{font-size:11px;color:rgba(240,230,211,0.4);font-family:var(--gfo-font-display);letter-spacing:1px;text-transform:uppercase;}
.gfo-card-body{font-family:var(--gfo-font-body);font-size:15px;color:rgba(240,230,211,0.75);line-height:1.5;}
.gfo-card-body strong{color:var(--gfo-gold);font-weight:600;}
.gfo-card-body .gfo-neg{color:var(--gfo-cinnabar);}
.gfo-card-body .gfo-pos{color:var(--gfo-jade-light);}

.gfo-consequence{display:inline-flex;align-items:center;gap:4px;margin-top:0;padding:3px 10px;border-radius:2px;font-family:var(--gfo-font-display);font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;}
.gfo-consequence.time-loss{background:rgba(194,54,22,0.15);color:var(--gfo-cinnabar);border:1px solid rgba(194,54,22,0.2);}
.gfo-consequence.time-gain{background:rgba(45,106,79,0.15);color:var(--gfo-jade-light);border:1px solid rgba(45,106,79,0.2);}
.gfo-consequence.bond-change{background:rgba(212,160,23,0.1);color:var(--gfo-gold);border:1px solid rgba(212,160,23,0.15);}
.gfo-consequence.pop-change{background:rgba(143,167,196,0.1);color:var(--gfo-mist-light);border:1px solid rgba(143,167,196,0.15);}

.gfo-segment-divider{text-align:center;padding:12px 0;position:relative;}
.gfo-segment-divider::before,.gfo-segment-divider::after{content:'';position:absolute;top:50%;height:1px;width:30%;background:linear-gradient(90deg,transparent,rgba(240,230,211,0.1),transparent);}
.gfo-segment-divider::before{left:0;}
.gfo-segment-divider::after{right:0;}
.gfo-segment-label{font-family:var(--gfo-font-display);font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(240,230,211,0.25);}
.gfo-segment-flavor{font-family:var(--gfo-font-body);font-size:13px;font-style:italic;color:rgba(240,230,211,0.3);margin-top:4px;}

/* Sidebar */
.gfo-sidebar{position:sticky;top:80px;align-self:start;background:rgba(30,20,15,0.85);border:1px solid rgba(212,160,23,0.12);border-radius:3px;padding:14px;max-height:calc(100vh - 90px);overflow-y:auto;backdrop-filter:blur(4px);z-index:60;}
.gfo-sidebar-title{font-family:var(--gfo-font-display);font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gfo-gold);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(212,160,23,0.2);}

.gfo-mini-map{margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(240,230,211,0.06);}
.gfo-mini-map-track{position:relative;height:44px;background:linear-gradient(180deg,rgba(90,53,53,0.4) 0%,rgba(42,21,32,0.4) 100%);border-radius:3px;border:1px solid rgba(212,160,23,0.08);overflow:hidden;}
.gfo-mini-map-seg{position:absolute;top:2px;transform:translateX(-50%);font-family:var(--gfo-font-display);font-size:8px;color:rgba(240,230,211,0.15);letter-spacing:0.5px;}
.gfo-mini-map-finish{position:absolute;top:2px;transform:translateX(-50%);font-size:12px;}
.gfo-mini-map-dot{position:absolute;width:18px;height:18px;border-radius:50%;border:1.5px solid var(--gfo-gold);background:rgba(26,26,26,0.8);display:flex;align-items:center;justify-content:center;overflow:hidden;transition:left 0.6s cubic-bezier(0.16,1,0.3,1);}
.gfo-mini-map-dot img{width:18px;height:18px;border-radius:50%;object-fit:contain;}

.gfo-lb-entry{display:grid;grid-template-columns:18px 28px 1fr 50px;align-items:center;gap:6px;padding:6px 4px;border-bottom:1px solid rgba(240,230,211,0.04);transition:all 0.4s ease;}
.gfo-lb-pos{font-family:var(--gfo-font-display);font-size:11px;font-weight:700;color:rgba(240,230,211,0.4);text-align:center;}
.gfo-lb-pos.first{color:var(--gfo-gold);}
.gfo-lb-pos.last{color:var(--gfo-cinnabar);}
.gfo-lb-avatar{width:24px;height:24px;border-radius:50%;border:1.5px solid rgba(240,230,211,0.15);background:rgba(26,26,26,0.6);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--gfo-parchment);font-family:var(--gfo-font-display);overflow:hidden;}
.gfo-lb-avatar img{width:24px;height:24px;border-radius:50%;object-fit:contain;}
.gfo-lb-name{font-family:var(--gfo-font-body);font-size:13px;color:rgba(240,230,211,0.7);}
.gfo-lb-time{font-family:var(--gfo-font-display);font-size:11px;font-weight:600;color:rgba(240,230,211,0.5);text-align:right;}
.gfo-lb-entry.danger{background:rgba(194,54,22,0.06);}
.gfo-lb-entry.danger .gfo-lb-name{color:var(--gfo-cinnabar);}
.gfo-lb-entry.danger .gfo-lb-avatar{border-color:var(--gfo-cinnabar);}
.gfo-lb-vehicle-tag{font-family:var(--gfo-font-display);font-size:8px;letter-spacing:0.5px;text-transform:uppercase;padding:1px 5px;border-radius:2px;background:rgba(240,230,211,0.06);color:rgba(240,230,211,0.35);margin-left:4px;}
.gfo-lb-vehicle-tag.tier1{color:var(--gfo-gold);background:rgba(212,160,23,0.1);}
.gfo-lb-vehicle-tag.tier3{color:var(--gfo-cinnabar);background:rgba(194,54,22,0.08);}

/* Transition */
.gfo-transition{position:relative;height:250px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#2a1a15 0%,#4a3020 30%,#5a3a22 50%,#4a3020 70%,#2a1a15 100%);overflow:hidden;}
.gfo-transition-ink{position:absolute;inset:0;background:linear-gradient(90deg,rgba(42,26,21,0.9) 0%,rgba(42,26,21,0.4) 40%,rgba(42,26,21,0.15) 60%,rgba(42,26,21,0.4) 80%,rgba(42,26,21,0.9) 100%);}
.gfo-transition-text{position:relative;z-index:2;text-align:center;}
.gfo-transition-quote{font-family:var(--gfo-font-body);font-size:22px;font-style:italic;color:rgba(240,230,211,0.5);line-height:1.4;}
.gfo-transition-quote em{color:var(--gfo-gold);font-style:normal;font-weight:700;}
.gfo-transition-sub{font-family:var(--gfo-font-display);font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(240,230,211,0.2);margin-top:12px;}

/* Eating screen */
.gfo-eating-screen{position:relative;min-height:100vh;padding:20px 0;background:linear-gradient(180deg,#1a1210 0%,#2e1e14 10%,#4a3020 25%,#5a3a22 40%,#6a4528 50%,#5a3a22 60%,#4a3020 75%,#2e1e14 90%,#1a1210 100%);}

.gfo-lantern-layer{position:absolute;top:0;left:0;right:0;height:200px;pointer-events:none;overflow:hidden;}
.gfo-lantern{position:absolute;top:-5px;display:flex;flex-direction:column;align-items:center;}
.gfo-lantern-string{width:1px;height:20px;background:rgba(240,230,211,0.15);}
.gfo-lantern-body{width:22px;height:30px;border-radius:4px 4px 8px 8px;position:relative;overflow:hidden;animation:gfo-lantern-sway 4s ease-in-out infinite;}
.gfo-lantern-body.amber{background:rgba(232,149,46,0.5);box-shadow:0 4px 30px rgba(232,149,46,0.4),0 8px 60px rgba(232,149,46,0.15);}
.gfo-lantern-body.red{background:rgba(194,54,22,0.45);box-shadow:0 4px 30px rgba(194,54,22,0.35),0 8px 60px rgba(194,54,22,0.12);}
.gfo-lantern-body.gold{background:rgba(212,160,23,0.45);box-shadow:0 4px 30px rgba(212,160,23,0.35),0 8px 60px rgba(212,160,23,0.12);}
.gfo-lantern-glow{position:absolute;inset:15% 10%;background:radial-gradient(ellipse,rgba(255,220,120,0.7),rgba(255,180,80,0.2),transparent);animation:gfo-lantern-flicker 2s ease-in-out infinite alternate;}
@keyframes gfo-lantern-sway{0%,100%{transform:rotate(-2deg);}50%{transform:rotate(2deg);}}
@keyframes gfo-lantern-flicker{0%{opacity:0.6;}50%{opacity:1;}100%{opacity:0.7;}}

.gfo-steam-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
.gfo-steam-particle{position:absolute;bottom:-20px;width:8px;height:8px;background:radial-gradient(circle,rgba(255,220,160,0.15),rgba(255,200,130,0.05),transparent);border-radius:50%;animation:gfo-steam-rise linear infinite;}
@keyframes gfo-steam-rise{0%{transform:translateY(0) scale(1);opacity:0.7;}50%{transform:translateY(-200px) scale(2.5);opacity:0.35;}100%{transform:translateY(-400px) scale(4);opacity:0;}}

.gfo-card.eating-card{border-left:3px solid var(--gfo-amber);}
[id^="gfo-step-"].visible.eating-card{animation:gfo-chopstick-snap 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;}
@keyframes gfo-chopstick-snap{0%{opacity:0;transform:translateY(-30px);}60%{transform:translateY(3px);}100%{opacity:1;transform:translateY(0);}}
.gfo-card.vomit-card{border-left:3px solid var(--gfo-vomit);background:linear-gradient(135deg,rgba(122,154,58,0.06) 0%,rgba(26,26,26,0.4) 100%);}
.gfo-card.eliminated-card{border-left:3px solid var(--gfo-cinnabar);position:relative;}
.gfo-card.eliminated-card::after{content:'';position:absolute;top:0;right:0;bottom:0;width:40%;background:linear-gradient(90deg,transparent,rgba(26,26,26,0.4));pointer-events:none;}

.gfo-dish-display{display:flex;align-items:center;gap:12px;padding:10px 14px;margin:8px 0;background:rgba(240,230,211,0.03);border:1px solid rgba(240,230,211,0.06);border-radius:3px;}
.gfo-dish-icon{width:36px;height:36px;flex-shrink:0;}
.gfo-dish-icon svg{width:100%;height:100%;}
.gfo-dish-name{font-family:var(--gfo-font-display);font-size:13px;font-weight:700;color:var(--gfo-parchment);}
.gfo-dish-desc{font-family:var(--gfo-font-body);font-size:12px;font-style:italic;color:rgba(240,230,211,0.4);}
.gfo-dish-difficulty{margin-left:auto;display:flex;gap:3px;}
.gfo-dish-pip{width:8px;height:8px;border-radius:50%;background:rgba(240,230,211,0.1);}
.gfo-dish-pip.filled{background:var(--gfo-cinnabar);}

/* Eating sidebar */
.gfo-eat-bracket{display:flex;flex-direction:column;gap:4px;}
.gfo-eat-entry{display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid rgba(240,230,211,0.04);transition:all 0.4s ease;}
.gfo-eat-avatar{width:24px;height:24px;border-radius:50%;border:1.5px solid rgba(240,230,211,0.15);background:rgba(26,26,26,0.6);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--gfo-parchment);font-family:var(--gfo-font-display);overflow:hidden;}
.gfo-eat-avatar img{width:24px;height:24px;border-radius:50%;object-fit:contain;}
.gfo-eat-name{font-family:var(--gfo-font-body);font-size:13px;color:rgba(240,230,211,0.7);}
.gfo-eat-status{font-family:var(--gfo-font-display);font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:2px;}
.gfo-eat-status.eating{color:var(--gfo-jade-light);background:rgba(45,106,79,0.15);}
.gfo-eat-status.eliminated{color:var(--gfo-cinnabar);background:rgba(194,54,22,0.1);text-decoration:line-through;}
.gfo-eat-status.winner{color:var(--gfo-gold);background:rgba(212,160,23,0.15);}
.gfo-eat-entry.out .gfo-eat-name{text-decoration:line-through;color:rgba(240,230,211,0.3);}
.gfo-eat-entry.out .gfo-eat-avatar{opacity:0.4;border-color:var(--gfo-cinnabar);}

.gfo-sidebar-dish{margin:12px 0;padding:10px;background:rgba(240,230,211,0.03);border:1px solid rgba(240,230,211,0.06);border-radius:3px;text-align:center;}
.gfo-sidebar-dish-label{font-family:var(--gfo-font-display);font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(240,230,211,0.3);}
.gfo-sidebar-dish-name{font-family:var(--gfo-font-display);font-size:14px;font-weight:700;color:var(--gfo-amber);margin-top:4px;}
.gfo-sidebar-round{font-family:var(--gfo-font-display);font-size:10px;letter-spacing:1.5px;color:rgba(240,230,211,0.2);margin-top:4px;}

.gfo-lantern-status{display:flex;justify-content:center;gap:6px;margin:10px 0;}
.gfo-lantern-pip{width:10px;height:14px;border-radius:2px 2px 4px 4px;transition:all 0.3s ease;}
.gfo-lantern-pip.lit{background:var(--gfo-amber);box-shadow:0 2px 8px rgba(232,149,46,0.3);}
.gfo-lantern-pip.extinguished{background:rgba(240,230,211,0.08);}
.gfo-lantern-pip.golden{background:var(--gfo-gold);box-shadow:0 2px 12px rgba(212,160,23,0.4);}

/* Results */
.gfo-results-screen{padding:40px 20px;text-align:center;background:linear-gradient(180deg,#1a1210 0%,#3a2818 30%,#4a3520 50%,#3a2818 70%,#1a1210 100%);position:relative;}
.gfo-results-title{font-family:var(--gfo-font-display);font-size:28px;font-weight:900;color:var(--gfo-gold);letter-spacing:2px;text-transform:uppercase;text-shadow:0 0 20px rgba(212,160,23,0.3);margin-bottom:24px;}
.gfo-winner-card{max-width:400px;margin:0 auto 30px;padding:24px;background:linear-gradient(135deg,rgba(212,160,23,0.08) 0%,rgba(26,26,26,0.4) 100%);border:2px solid rgba(212,160,23,0.3);border-radius:4px;position:relative;}
.gfo-winner-card::before{content:'';position:absolute;inset:-2px;border:1px solid rgba(212,160,23,0.1);border-radius:6px;pointer-events:none;}
.gfo-winner-avatar{width:56px;height:56px;border-radius:50%;border:3px solid var(--gfo-gold);background:rgba(26,26,26,0.8);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:var(--gfo-gold);font-family:var(--gfo-font-display);margin:0 auto 12px;box-shadow:0 0 20px rgba(212,160,23,0.2);overflow:hidden;}
.gfo-winner-avatar img{width:56px;height:56px;border-radius:50%;object-fit:contain;}
.gfo-winner-name{font-family:var(--gfo-font-display);font-size:22px;font-weight:700;color:var(--gfo-gold);margin-bottom:4px;}
.gfo-winner-subtitle{font-family:var(--gfo-font-body);font-size:14px;font-style:italic;color:rgba(240,230,211,0.5);}

/* Step visibility */
[id^="gfo-step-"]{opacity:0;transform:translateY(8px);transition:opacity 0.4s ease,transform 0.4s ease;}
[id^="gfo-step-"].visible{opacity:1;transform:translateY(0);}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .gfo-mist-band,.gfo-steam-particle,.gfo-lantern-body,.gfo-lantern-glow,.gfo-mountain-far,.gfo-mountain-mid{animation:none!important;}
  .gfo-card.paint-in{animation:none!important;opacity:1;clip-path:none;}
  .gfo-card.eating-card{animation:none!important;opacity:1;transform:none;}
  .gfo-title-main{animation:none!important;opacity:1;letter-spacing:3px;filter:none;}
  .gfo-title-sub,.gfo-host-announce,.gfo-scramble-grid,.gfo-fortress-silhouette{animation:none!important;opacity:1;}
  .gfo-scramble-card{animation:none!important;opacity:1;transform:none!important;}
  .gfo-scramble-react{animation:none!important;opacity:1;}
  .gfo-scramble-leg{animation:none!important;}
  .gfo-scroll-paper{animation:none!important;max-height:none;opacity:1;}
  .gfo-bird,.gfo-fog-band,.gfo-ink-drip-drop,.gfo-torch-flame,.gfo-torch-halo,.gfo-hanging-scroll-body,.gfo-steam-puff,.gfo-ink-wipe-band,.gfo-gong-shockwave,.gfo-ink-pool{animation:none!important;opacity:0.5;}
  .gfo-ink-splatter{animation:none!important;opacity:0.3;}
  [id^="gfo-step-"]{transition:none!important;}
}

@media(max-width:768px){
  .gfo-content-area{grid-template-columns:1fr;gap:12px;}
  .gfo-sidebar{position:static;max-height:none;}
  .gfo-title-main{font-size:28px;}
  .gfo-wall-map{height:160px;}
  .gfo-phase-pip{font-size:10px;padding:4px 8px;letter-spacing:0.5px;}
}
`;
}

// ── SHELL WRAPPER ──
function _shell(content, ep, phaseCls = '') {
  window._gfoEpRecord = ep;
  return `<style>${_gfoCss()}</style><div class="gfo-shell ${phaseCls}">${content}</div>`;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 1 — TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildGFOTitleCard(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  window._gfoEpRecord = ep;

  const active = cd.vehicles.map(v => v.name);

  let content = _phaseTracker('Cold Open');
  content += `<div class="gfo-title-screen">`;
  content += _buildTitleAtmosphere();

  // Scroll unfurl
  content += `<div class="gfo-scroll-unfurl"><div class="gfo-scroll-paper">`;
  content += `<div class="gfo-scroll-roller gfo-scroll-roller-top"><div class="gfo-scroll-roller-knob left"></div><div class="gfo-scroll-roller-knob right"></div></div>`;
  content += `<div class="gfo-scroll-roller gfo-scroll-roller-bottom"><div class="gfo-scroll-roller-knob left"></div><div class="gfo-scroll-roller-knob right"></div></div>`;

  content += `<div class="gfo-title-sub">Post-Merge Challenge</div>`;
  content += `<div class="gfo-brush-line"></div>`;
  content += `<div class="gfo-title-main">The Great<br>Fake-Out</div>`;
  content += `<div class="gfo-brush-line"></div>`;

  // Fortress silhouette
  content += `<div class="gfo-fortress-silhouette">${_fortressSvg()}</div>`;

  // Host announcement
  content += `<div class="gfo-host-announce">"Race along the fortress wall to the finish line, and<span class="gfo-host-ellipsis">...</span> that's all you need to know."</div>`;

  // Player scramble grid
  content += `<div class="gfo-scramble-grid">`;
  cd.vehicles.forEach((va, i) => {
    const delayS = (2.3 + i * 0.1).toFixed(1);
    content += `<div class="gfo-scramble-card" style="animation-delay:${delayS}s;">
      <div class="gfo-scramble-avatar">
        ${portrait(va.name, 32)}
        ${_reactIcon(i)}
        <div class="gfo-scramble-legs"><div class="gfo-scramble-leg left"></div><div class="gfo-scramble-leg right"></div></div>
      </div>
      <div class="gfo-scramble-name">${va.name}</div>
      <div class="gfo-scramble-vehicle">${_vehicleSvg(va.vehicleName)}</div>
      ${_tierLabel(va.tier)}
    </div>`;
  });
  content += `</div>`;

  // Ink splatters
  content += `<svg class="gfo-ink-splatter gfo-splatter-1" viewBox="0 0 40 35"><circle cx="20" cy="18" r="12" fill="rgba(26,26,26,0.6)"/><circle cx="10" cy="10" r="5" fill="rgba(26,26,26,0.4)"/><circle cx="30" cy="25" r="4" fill="rgba(26,26,26,0.3)"/><ellipse cx="25" cy="8" rx="6" ry="3" fill="rgba(26,26,26,0.35)"/></svg>`;
  content += `<svg class="gfo-ink-splatter gfo-splatter-2" viewBox="0 0 30 40"><circle cx="15" cy="20" r="10" fill="rgba(26,26,26,0.5)"/><circle cx="8" cy="8" r="4" fill="rgba(26,26,26,0.3)"/><circle cx="22" cy="32" r="6" fill="rgba(26,26,26,0.4)"/></svg>`;
  content += `<svg class="gfo-ink-splatter gfo-splatter-3" viewBox="0 0 50 30"><ellipse cx="25" cy="15" rx="18" ry="10" fill="rgba(26,26,26,0.5)"/><circle cx="8" cy="8" r="5" fill="rgba(26,26,26,0.3)"/><circle cx="42" cy="22" r="4" fill="rgba(26,26,26,0.25)"/></svg>`;
  content += `<svg class="gfo-ink-splatter gfo-splatter-4" viewBox="0 0 25 25"><circle cx="12" cy="12" r="8" fill="rgba(26,26,26,0.4)"/><circle cx="5" cy="5" r="3" fill="rgba(26,26,26,0.25)"/></svg>`;

  // Ink pools
  content += `<div class="gfo-ink-pool" style="width:120px;height:80px;bottom:10%;left:5%;background:radial-gradient(ellipse,rgba(26,26,26,0.2),transparent 70%);animation-delay:3.5s;"></div>`;
  content += `<div class="gfo-ink-pool" style="width:90px;height:60px;top:20%;right:8%;background:radial-gradient(ellipse,rgba(26,26,26,0.15),transparent 70%);animation-delay:3.8s;"></div>`;

  // Gong burst
  content += `<div class="gfo-gong-burst"><div class="gfo-gong-circle"></div><div class="gfo-gong-circle"></div><div class="gfo-gong-circle"></div><div class="gfo-gong-shockwave"></div><div class="gfo-gong-shockwave" style="animation-delay:2.65s;inset:25%;border-color:rgba(212,160,23,0.25);"></div></div>`;

  // Calligraphy fragments
  content += `<div class="gfo-calli-fragment" style="top:15%;left:2%;">FORTRESS</div>`;
  content += `<div class="gfo-calli-fragment" style="bottom:25%;right:3%;transform:rotate(5deg);">SCROLL</div>`;

  content += `</div></div>`; // close scroll-paper + scroll-unfurl
  content += `</div>`; // close title-screen

  return _shell(content, ep);
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2 — VEHICLE SCRAMBLE
// ══════════════════════════════════════════════════════════════
export function rpBuildGFOScramble(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  window._gfoEpRecord = ep;
  delete _tvState['scramble'];

  // Build step metadata for sidebar
  const stepMeta = [];
  let stepIdx = 0;

  let content = _phaseTracker('The Scramble');
  content += `<div class="gfo-scramble-screen">`;

  content += `<div class="gfo-scramble-banner">
    <div class="gfo-scramble-phase-title">The Scramble</div>
    <div class="gfo-scramble-phase-sub">Grab a vehicle. Any vehicle. Don't ask questions.</div>
  </div>`;

  // Vehicle depot
  const grabbedVehicles = new Set(cd.vehicles.map(v => v.vehicleName));
  content += `<div class="gfo-vehicle-depot">`;
  VEHICLES.forEach(v => {
    const isGrabbed = grabbedVehicles.has(v.name);
    content += `<div class="gfo-depot-slot${isGrabbed ? ' grabbed' : ''}">
      <div class="gfo-depot-vehicle">${_vehicleSvg(v.name)}</div>
      <div class="gfo-depot-vehicle-name">${v.name}</div>
      <div class="gfo-depot-tier-dot" style="background:${_tierDotColor(v.tier)};"></div>
    </div>`;
  });
  content += `</div>`;

  // Cards + sidebar
  content += `<div class="gfo-content-area"><div class="gfo-card-feed">`;

  // Host announcement divider
  content += `<div id="gfo-step-scramble-${stepIdx}" class="gfo-segment-divider" style="opacity:0">
    <div class="gfo-segment-label">Host Announcement</div>
    <div class="gfo-segment-flavor">"Today you'll race along the ancient fortress wall to the finish line, and the winner gets&#8212;" *phone rings* "...just go!"</div>
  </div>`;
  stepMeta.push({ type: 'divider' });
  stepIdx++;

  // Interleave drama events with grab cards
  const dramaByGrabOrder = {};
  cd.scrambleDrama.forEach(d => {
    // Place drama before the first involved player's grab
    const actorGrab = cd.vehicles.findIndex(v => v.name === d.actor);
    const targetGrab = cd.vehicles.findIndex(v => v.name === d.target);
    const earlierGrab = Math.min(actorGrab >= 0 ? actorGrab : Infinity, targetGrab >= 0 ? targetGrab : Infinity);
    if (!dramaByGrabOrder[earlierGrab]) dramaByGrabOrder[earlierGrab] = [];
    dramaByGrabOrder[earlierGrab].push(d);
  });

  cd.vehicles.forEach((va, i) => {
    // Drama events before this grab
    if (dramaByGrabOrder[i]) {
      dramaByGrabOrder[i].forEach(d => {
        content += `<div id="gfo-step-scramble-${stepIdx}" class="gfo-scramble-drama" style="opacity:0">
          <div class="gfo-scramble-drama-header">
            <div class="gfo-card-player-ring">${portrait(d.actor, 32) || _initial(d.actor)}</div>
            ${d.target ? `<div class="gfo-card-player-ring">${portrait(d.target, 32) || _initial(d.target)}</div>` : ''}
            <div class="gfo-scramble-drama-tag">${_dramaTypeLabel(d.type)}</div>
          </div>
          <div class="gfo-scramble-drama-body">${d.text}</div>
          ${_consequenceTags(d.consequences)}
        </div>`;
        stepMeta.push({ type: 'drama', drama: d });
        stepIdx++;
      });
    }

    // Grab card
    const hasDrama = cd.scrambleDrama.some(d => d.actor === va.name || d.target === va.name);
    content += `<div id="gfo-step-scramble-${stepIdx}" class="gfo-grab-card${hasDrama ? ' has-drama' : ''}" style="opacity:0">
      <div class="gfo-grab-order">${i + 1}</div>
      <div class="gfo-card-player-ring">${portrait(va.name, 32)}</div>
      <div class="gfo-grab-info">
        <div class="gfo-grab-player">${va.name}</div>
        <div class="gfo-grab-action">${va.grabText || 'Grabs a vehicle.'}</div>
      </div>
      <div class="gfo-grab-vehicle-result">
        <div class="gfo-grab-vehicle-icon">${_vehicleSvg(va.vehicleName)}</div>
        <div class="gfo-grab-vehicle-label">${va.vehicleName}</div>
        ${_tierLabel(va.tier)}
      </div>
    </div>`;
    stepMeta.push({ type: 'grab', vehicle: va });
    stepIdx++;

    // Announcer chatter occasionally
    if (i > 0 && i < cd.vehicles.length - 1 && Math.random() < 0.3) {
      const chatter = RACE_CHATTER[i % RACE_CHATTER.length];
      content += `<div id="gfo-step-scramble-${stepIdx}" class="gfo-announcer host" style="opacity:0">${chatter}</div>`;
      stepMeta.push({ type: 'chatter' });
      stepIdx++;
    }
  });

  content += `</div>`; // close card-feed

  // Sidebar
  content += `<div class="gfo-sidebar" id="gfo-sidebar"><div id="gfo-sidebar-inner">${_buildGFOSidebarContent(ep, 'gfo-scramble')}</div></div>`;

  content += `</div>`; // close content-area
  content += `</div>`; // close scramble-screen

  // Controls
  content += _controls('scramble', stepIdx);

  window._gfoScrambleStepMeta = stepMeta;
  return _shell(content, ep);
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3 — FORTRESS WALL GAUNTLET RACE
// ══════════════════════════════════════════════════════════════
export function rpBuildGFORace(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  window._gfoEpRecord = ep;
  delete _tvState['race'];

  const stepMeta = [];
  let stepIdx = 0;
  let trapCount = 0;

  let content = _phaseTracker('Gauntlet Race');
  content += `<div class="gfo-race-screen">`;
  content += _buildRaceAtmosphere();

  // Fortress wall map
  content += _buildWallMap(cd);

  // Cards + sidebar
  content += `<div class="gfo-content-area"><div class="gfo-card-feed">`;

  // Build cumulative times — advance each player individually as their card appears
  const cumulativeTimes = {};
  const playerSegmentAdded = {};
  cd.raceStandings.forEach(rs => { cumulativeTimes[rs.name] = 0; playerSegmentAdded[rs.name] = -1; });

  // Helper: advance a specific player's marker to include up to segIdx
  function _advancePlayer(name, segIdx) {
    const rs = cd.raceStandings.find(r => r.name === name);
    if (!rs?.segments) return;
    while (playerSegmentAdded[name] < segIdx) {
      playerSegmentAdded[name]++;
      const segT = rs.segments[playerSegmentAdded[name]];
      if (segT != null) cumulativeTimes[name] += segT;
    }
  }

  function _currentStandings() {
    return Object.entries(cumulativeTimes).map(([name, t]) => ({ name, totalTime: t }));
  }

  cd.raceSegments.forEach((seg, segIdx) => {
    // Segment divider — don't advance anyone yet, just mark the segment
    const flavor = SEGMENT_FLAVORS[segIdx % SEGMENT_FLAVORS.length];
    content += `<div id="gfo-step-race-${stepIdx}" class="gfo-segment-divider" style="opacity:0">
      <div class="gfo-segment-label">Segment ${seg.seg} of ${cd.raceSegments.length}</div>
      <div class="gfo-segment-flavor">${flavor}</div>
    </div>`;
    stepMeta.push({ type: 'divider', segment: segIdx + 1, standings: _currentStandings() });
    stepIdx++;

    // Event cards — advance the player mentioned in each card
    seg.events.forEach(ev => {
      if (ev.type === 'announcer') {
        content += `<div id="gfo-step-race-${stepIdx}" class="gfo-announcer host" style="opacity:0">${ev.text}</div>`;
        stepMeta.push({ type: 'chatter', segment: segIdx + 1, standings: _currentStandings() });
        stepIdx++;
        return;
      }

      // Standings leaderboard — special compact table
      if (ev.type === 'standings') {
        cd.raceStandings.forEach(rs => _advancePlayer(rs.name, segIdx));
        const lines = ev.text.split('\n');
        const rows = lines.map(line => {
          const m = line.match(/^(\d+)\.\s+(.+?)\s+—\s+([\d.]+s)(.*)/);
          if (!m) return `<div class="gfo-standings-row">${line}</div>`;
          const pos = m[1], name = m[2], time = m[3], badge = m[4].trim();
          const posClass = pos === '1' ? 'gfo-pos-first' : pos === String(lines.length) ? 'gfo-pos-last' : '';
          const ring = portrait(name, 24) || _initial(name);
          return `<div class="gfo-standings-row ${posClass}">
            <span class="gfo-standings-pos">${pos}</span>
            <span class="gfo-standings-avatar">${ring}</span>
            <span class="gfo-standings-name">${name}</span>
            <span class="gfo-standings-time">${time}</span>
            ${badge ? `<span class="gfo-standings-badge">${badge}</span>` : ''}
          </div>`;
        }).join('');
        content += `<div id="gfo-step-race-${stepIdx}" class="gfo-card standings-card paint-in" style="opacity:0">
          <div class="gfo-card-header">
            <div><div class="gfo-card-title">Standings</div>
            <div class="gfo-card-subtitle">After Segment ${segIdx + 1}</div></div>
          </div>
          <div class="gfo-standings-board">${rows}</div>
        </div>`;
        stepMeta.push({
          type: 'standings', segment: segIdx + 1,
          standings: _currentStandings(),
        });
        stepIdx++;
        return;
      }

      // Advance the player(s) in this card to current segment
      if (ev.player) _advancePlayer(ev.player, segIdx);
      if (ev.target) _advancePlayer(ev.target, segIdx);

      if (ev.type === 'trap' || ev.type === 'trap-chain') trapCount++;

      const cardCls = _cardTypeClass(ev.type);
      const stamp = _cardStamp(ev.type);
      const title = _eventTitle(ev.type);
      const subtitle = _eventSubtitle(ev.type);
      const playerRing = ev.player ? (portrait(ev.player, 32) || _initial(ev.player)) : '';
      const targetRing = ev.target ? (portrait(ev.target, 32) || _initial(ev.target)) : '';
      const elimCls = ev.type === 'eat-fail' ? ' eliminated-card' : '';

      content += `<div id="gfo-step-race-${stepIdx}" class="gfo-card ${cardCls}${elimCls} paint-in" style="opacity:0">
        ${stamp}
        <div class="gfo-card-header">
          <div class="gfo-card-player-ring">${playerRing}</div>
          ${targetRing ? `<div class="gfo-card-player-ring">${targetRing}</div>` : ''}
          <div>
            <div class="gfo-card-title">${title}</div>
            <div class="gfo-card-subtitle">${subtitle}</div>
          </div>
        </div>
        <div class="gfo-card-body">${ev.text}</div>
        ${_consequenceTags(ev.consequences)}
      </div>`;
      stepMeta.push({
        type: 'event', eventType: ev.type, segment: segIdx + 1, trapCount,
        standings: _currentStandings(),
      });
      stepIdx++;
    });
  });

  // Race finish + elimination
  content += `<div id="gfo-step-race-${stepIdx}" class="gfo-segment-divider" style="opacity:0">
    <div class="gfo-segment-label">Finish Line</div>
    <div class="gfo-segment-flavor">The dust settles. The standings are final.</div>
  </div>`;
  stepMeta.push({
    type: 'divider', segment: cd.raceSegments.length,
    standings: cd.raceStandings.map(rs => ({ name: rs.name, totalTime: rs.totalTime })),
  });
  stepIdx++;

  // Finish order cards
  cd.raceStandings.forEach((rs, i) => {
    const isElim = rs.name === cd.raceEliminated;
    const cardCls = isElim ? 'elimination-event eliminated-card' : 'race-event';
    const title = isElim ? `Last Place &#8212; Eliminated` : `${_ordinal(i + 1)} Place`;
    const subtitle = isElim ? 'Cut from Eating Round' : `${(rs.totalTime ?? 0).toFixed(1)}s total`;
    const text = rs.finishText || `${rs.name} finishes in ${_ordinal(i + 1)} place.`;
    const ringStyle = isElim ? ' style="border-color:var(--gfo-cinnabar);"' : '';
    const titleStyle = isElim ? ' style="color:var(--gfo-cinnabar);"' : '';

    content += `<div id="gfo-step-race-${stepIdx}" class="gfo-card ${cardCls} paint-in" style="opacity:0">
      <div class="gfo-card-header">
        <div class="gfo-card-player-ring"${ringStyle}>${portrait(rs.name, 32) || _initial(rs.name)}</div>
        <div>
          <div class="gfo-card-title"${titleStyle}>${title}</div>
          <div class="gfo-card-subtitle">${subtitle}</div>
        </div>
      </div>
      <div class="gfo-card-body">${text}</div>
    </div>`;
    stepMeta.push({
      type: 'finish', place: i + 1, name: rs.name, eliminated: isElim,
      standings: cd.raceStandings.map(r => ({ name: r.name, totalTime: r.totalTime })),
    });
    stepIdx++;
  });

  content += `</div>`; // close card-feed

  // Sidebar
  content += `<div class="gfo-sidebar" id="gfo-sidebar"><div id="gfo-sidebar-inner">${_buildGFOSidebarContent(ep, 'gfo-race')}</div></div>`;

  content += `</div>`; // close content-area
  content += `</div>`; // close race-screen

  content += _controls('race', stepIdx);

  window._gfoRaceStepMeta = stepMeta;
  window._gfoCurrentSeg = 0;
  window._gfoTrapCount = 0;
  return _shell(content, ep);
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4 — TRANSITION
// ══════════════════════════════════════════════════════════════
export function rpBuildGFOTransition(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';

  let content = _phaseTracker('Eating Gauntlet');
  content += `<div class="gfo-transition">
    <div class="gfo-transition-ink"></div>
    <div class="gfo-ink-wipe"><div class="gfo-ink-wipe-band"></div><div class="gfo-ink-wipe-band"></div><div class="gfo-ink-wipe-band"></div></div>
    <div class="gfo-brush-flourish" style="top:20%;left:10%;width:150px;height:20px;opacity:0.1;">
      <svg viewBox="0 0 150 20"><path d="M0,15 Q30,2 75,10 T150,5" stroke="rgba(212,160,23,0.3)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
    </div>
    <div class="gfo-brush-flourish" style="bottom:20%;right:10%;width:150px;height:20px;opacity:0.1;transform:scaleX(-1);">
      <svg viewBox="0 0 150 20"><path d="M0,15 Q30,2 75,10 T150,5" stroke="rgba(212,160,23,0.3)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
    </div>
    <div class="gfo-transition-text">
      <div class="gfo-transition-quote">"The race was never the challenge<span class="gfo-host-ellipsis">...</span><br><em>the feast</em> is."</div>
      <div class="gfo-transition-sub">Phase 2 &#8212; The Eating Gauntlet</div>
    </div>
  </div>`;

  return _shell(content, ep);
}

// ══════════════════════════════════════════════════════════════
// SCREEN 5 — EATING GAUNTLET
// ══════════════════════════════════════════════════════════════
export function rpBuildGFOEating(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  window._gfoEpRecord = ep;
  delete _tvState['eating'];

  const stepMeta = [];
  let stepIdx = 0;

  let content = _phaseTracker('Eating Gauntlet');
  content += `<div class="gfo-eating-screen">`;
  content += _buildEatingAtmosphere();

  // Cards + sidebar
  content += `<div class="gfo-content-area" style="padding-top:60px;"><div class="gfo-card-feed">`;

  cd.eatingRounds.forEach((round, rIdx) => {
    // Round divider
    const flavor = EAT_ROUND_FLAVOR[rIdx % EAT_ROUND_FLAVOR.length];
    content += `<div id="gfo-step-eating-${stepIdx}" class="gfo-segment-divider" style="opacity:0">
      <div class="gfo-segment-label">Round ${round.round} of ${cd.dishes.length}</div>
      <div class="gfo-segment-flavor">${flavor}</div>
    </div>`;
    stepMeta.push({ type: 'divider', round: round.round, dish: round.dish });
    stepIdx++;

    // Event cards
    round.events.forEach(ev => {
      if (ev.type === 'announcer') {
        content += `<div id="gfo-step-eating-${stepIdx}" class="gfo-announcer host" style="opacity:0">${ev.text}</div>`;
        stepMeta.push({ type: 'chatter', round: round.round, dish: round.dish });
        stepIdx++;
        return;
      }

      if (ev.type === 'dish-present') {
        // Dish presentation card
        content += `<div id="gfo-step-eating-${stepIdx}" class="gfo-card eating-card" style="opacity:0">
          <div class="gfo-dish-display">
            <div class="gfo-dish-icon">${_dishSvg()}</div>
            <div>
              <div class="gfo-dish-name">${round.dish.name}</div>
              <div class="gfo-dish-desc">${round.dish.desc}</div>
            </div>
            <div class="gfo-dish-difficulty">`;
        for (let p = 0; p < 5; p++) {
          content += `<div class="gfo-dish-pip${p < round.dish.diff ? ' filled' : ''}"></div>`;
        }
        content += `</div></div></div>`;
        stepMeta.push({ type: 'dish', round: round.round, dish: round.dish });
        stepIdx++;
        return;
      }

      // Regular event card
      const isElim = ev.type === 'eat-fail';
      const isVomit = ev.type === 'vomit-chain';
      const isSocial = ev.type === 'psych-out' || ev.type === 'encourage';
      let cardCls = 'eating-card';
      if (isElim) cardCls += ' eliminated-card';
      else if (isVomit) cardCls += ' vomit-card';
      else if (isSocial) cardCls += ' social-event';

      const title = _eventTitle(ev.type);
      const subtitle = _eventSubtitle(ev.type);
      const ringStyle = isElim ? ' style="border-color:var(--gfo-cinnabar);"' : '';
      const titleStyle = isElim ? ' style="color:var(--gfo-cinnabar);"' : '';
      const playerRing = ev.player ? (portrait(ev.player, 32) || _initial(ev.player)) : '';
      const targetRing = ev.target ? (portrait(ev.target, 32) || _initial(ev.target)) : '';

      content += `<div id="gfo-step-eating-${stepIdx}" class="gfo-card ${cardCls}" style="opacity:0">
        <div class="gfo-card-header">
          <div class="gfo-card-player-ring"${ringStyle}>${playerRing}</div>
          ${targetRing ? `<div class="gfo-card-player-ring">${targetRing}</div>` : ''}
          <div>
            <div class="gfo-card-title"${titleStyle}>${title}</div>
            <div class="gfo-card-subtitle">${subtitle}</div>
          </div>
        </div>
        <div class="gfo-card-body">${ev.text}</div>
        ${_consequenceTags(ev.consequences)}
      </div>`;
      stepMeta.push({
        type: 'event', eventType: ev.type, round: round.round, dish: round.dish,
        eliminated: isElim ? ev.player : null,
        winner: null,
      });
      stepIdx++;
    });
  });

  // Winner announcement
  content += `<div id="gfo-step-eating-${stepIdx}" class="gfo-card eating-card" style="opacity:0;border-left:3px solid var(--gfo-gold);background:linear-gradient(135deg,rgba(212,160,23,0.08) 0%,rgba(26,26,26,0.4) 100%);">
    <div class="gfo-card-header">
      <div class="gfo-card-player-ring" style="border-color:var(--gfo-gold);">${portrait(cd.immunityWinner, 32) || _initial(cd.immunityWinner)}</div>
      <div>
        <div class="gfo-card-title" style="color:var(--gfo-gold);">Immunity Winner!</div>
        <div class="gfo-card-subtitle">The Great Fake-Out Champion</div>
      </div>
    </div>
    <div class="gfo-card-body">${cd.winnerText}</div>
  </div>`;
  stepMeta.push({ type: 'winner', winner: cd.immunityWinner, round: cd.eatingRounds.length, dish: cd.dishes[cd.dishes.length - 1] });
  stepIdx++;

  content += `</div>`; // close card-feed

  // Sidebar
  content += `<div class="gfo-sidebar" id="gfo-sidebar"><div id="gfo-sidebar-inner">${_buildGFOSidebarContent(ep, 'gfo-eating')}</div></div>`;

  content += `</div>`; // close content-area
  content += `</div>`; // close eating-screen

  content += _controls('eating', stepIdx);

  window._gfoEatStepMeta = stepMeta;
  return _shell(content, ep);
}

// ══════════════════════════════════════════════════════════════
// SCREEN 6 — RESULTS
// ══════════════════════════════════════════════════════════════
export function rpBuildGFOResults(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';

  let content = _phaseTracker('Results');
  content += `<div class="gfo-results-screen">`;

  content += `<div class="gfo-results-title">Immunity Winner</div>`;

  // Winner card
  content += `<div class="gfo-winner-card">
    <div class="gfo-winner-avatar">${portrait(cd.immunityWinner, 56) || _initial(cd.immunityWinner)}</div>
    <div class="gfo-winner-name">${cd.immunityWinner}</div>
    <div class="gfo-winner-subtitle">Last one eating &#8212; stomach of absolute steel</div>
    <div style="margin-top:16px;">
      <div class="gfo-lantern-status"><div class="gfo-lantern-pip golden"></div></div>
    </div>
  </div>`;

  // Final standings
  content += `<div style="max-width:500px;margin:0 auto;text-align:left;">
    <div style="font-family:var(--gfo-font-display);font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(240,230,211,0.25);margin-bottom:12px;text-align:center;">Final Standings</div>`;

  cd.finalPlacements.forEach((fp, i) => {
    const isWinner = fp.place === 1;
    const isLast = i === cd.finalPlacements.length - 1;
    const isDanger = isLast;
    const posCls = isWinner ? ' first' : isDanger ? ' last' : '';
    const nameStyle = isWinner ? ' style="color:var(--gfo-gold);font-weight:600;"' : '';
    const avatarStyle = isWinner ? ' style="border-color:var(--gfo-gold);"' : '';
    const timeStyle = isWinner ? ' style="color:var(--gfo-gold);"' : '';

    content += `<div class="gfo-lb-entry${isDanger ? ' danger' : ''}" style="${isWinner ? 'border-bottom-color:rgba(212,160,23,0.1);' : ''}">
      <div class="gfo-lb-pos${posCls}">${fp.place}</div>
      <div class="gfo-lb-avatar"${avatarStyle}>${portrait(fp.name, 24) || _initial(fp.name)}</div>
      <div class="gfo-lb-name"${nameStyle}>${fp.name}</div>
      <div class="gfo-lb-time"${timeStyle}>${fp.detail}</div>
    </div>`;
  });

  content += `</div>`;
  content += `</div>`; // close results-screen

  return _shell(content, ep);
}

// ══════════════════════════════════════════════════════════════
// REVEAL HANDLERS
// ══════════════════════════════════════════════════════════════
export function gfoRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    _reapplyVisibility(screenKey, st.idx, st.total);
    const el = document.getElementById(`gfo-step-${screenKey}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Update map/segment tracking for race
    if (screenKey === 'race') {
      const sm = window._gfoRaceStepMeta?.[st.idx];
      if (sm) {
        if (sm.segment) window._gfoCurrentSeg = sm.segment;
        if (sm.trapCount !== undefined) window._gfoTrapCount = sm.trapCount;
        // Update racer positions on map
        _updateRaceMap(sm);
        // Show map splatters progressively
        const splatterIdx = Math.floor(st.idx / (totalSteps / 3));
        for (let s = 0; s <= splatterIdx && s < 3; s++) {
          const spl = document.getElementById(`gfo-map-splatter-${s}`);
          if (spl) spl.classList.add('visible');
        }
      }
    }
  } catch (e) { console.warn('GFO reveal error:', e); }
  try { _updateGFOSidebar(`gfo-${screenKey}`); } catch (e) { /* sidebar optional */ }
}

export function gfoRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    _reapplyVisibility(screenKey, st.idx, st.total);

    if (screenKey === 'race') {
      const sm = window._gfoRaceStepMeta?.[st.idx];
      if (sm) {
        window._gfoCurrentSeg = sm.segment || window._gfoCurrentSeg;
        window._gfoTrapCount = sm.trapCount || window._gfoTrapCount;
        _updateRaceMap(sm);
      }
      for (let s = 0; s < 3; s++) {
        const spl = document.getElementById(`gfo-map-splatter-${s}`);
        if (spl) spl.classList.add('visible');
      }
    }
  } catch (e) { console.warn('GFO revealAll error:', e); }
  try { _updateGFOSidebar(`gfo-${screenKey}`); } catch (e) { /* sidebar optional */ }
}

function _updateRaceMap(stepMeta) {
  if (!stepMeta?.standings) return;
  const cd = window._gfoEpRecord?.challengeData;
  if (!cd) return;

  const totalSegs = cd.raceSegments.length;
  const currentSeg = stepMeta.segment || 1;

  // Only consider players whose time has been revealed (> 0)
  const revealed = stepMeta.standings.filter(s => (s.totalTime || 0) > 0);
  const revTimes = revealed.map(s => s.totalTime);
  const minT = revTimes.length > 0 ? Math.min(...revTimes) : 0;
  const maxT = revTimes.length > 0 ? Math.max(...revTimes) : 1;
  const timeRange = maxT - minT;

  // Leader position advances by segment (3% start → 88% finish)
  const frontPct = 3 + (currentSeg / totalSegs) * 85;
  // Spread between leader and slowest grows as race progresses
  const maxSpread = Math.min(35, currentSeg * 10);

  stepMeta.standings.forEach((s, i) => {
    const el = document.getElementById(`gfo-racer-${slug(s.name)}`);
    if (!el) return;
    const t = s.totalTime || 0;

    if (t === 0) {
      el.style.left = '3%';
    } else {
      // Lower time = faster = further ahead. behind=0 for leader, behind=1 for slowest.
      const behind = timeRange > 0.01 ? (t - minT) / timeRange : 0;
      const pct = frontPct - behind * maxSpread;
      el.style.left = `${Math.max(3, pct)}%`;
    }
    el.style.transition = 'left 0.6s cubic-bezier(0.16,1,0.3,1)';
    el.style.bottom = (30 + (i % 3) * 22) + 'px';
  });
}
