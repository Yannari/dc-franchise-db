// ══════════════════════════════════════════════════════════════════════
// greeces-pieces.js — Greece's Pieces: Olympic challenge (both phases)
// Pre-merge: tribe immunity via gold medals. Post-merge: individual immunity.
// 3 events (Pillar Maze, Wrestling, Hurdles) + Icarus tiebreaker.
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, tribeColor } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const noise = r => (Math.random() - 0.5) * r;
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function host() { return seasonConfig?.hostName || 'Chris'; }

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);

let _currentEp = null;
function _tribeColorFromEp(tribeName, ep) {
  if (!tribeName) return null;
  const data = ep?.challengeData;
  if (data?.tribeColorMap?.[tribeName]) return data.tribeColorMap[tribeName];
  return tribeColor(tribeName);
}

// ══════════════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════════════

// ── MAZE SEARCH ──
const MAZE_SEARCH_FIND = [
  (n, pr) => `${n} runs ${pr.posAdj} hand along a crumbling pillar and feels something metallic. Gold! ${pr.Sub} pries it loose with shaking hands.`,
  (n, pr) => `A glint in the rubble. ${n} drops to ${pr.posAdj} knees and digs. The gold medal emerges, tarnished but unmistakable.`,
  (n, pr) => `${n} spots the medallion wedged between two collapsed columns. ${pr.Sub} squeeze${pr.sub === 'they' ? '' : 's'} through and grab${pr.sub === 'they' ? '' : 's'} it.`,
  (n, pr) => `"There!" ${n} lunges into an alcove and comes out holding the gold medal. ${pr.PosAdj} eyes are wide.`,
  (n, pr) => `${n} nearly walks past it. A faint shimmer catches ${pr.posAdj} eye. The medal, half-buried under stone dust.`,
  (n, pr) => `The maze dead-ends. But ${n} looks up — the gold medal hangs from a vine above. ${pr.Sub} climb${pr.sub === 'they' ? '' : 's'} and snatch${pr.sub === 'they' ? '' : 'es'} it.`,
  (n, pr) => `${n} taps a hollow-sounding pillar, cracks it open, and finds the gold medal hidden inside. Ancient engineering — or production design.`,
  (n, pr) => `Crouching through a low archway, ${n} finds the gold medal resting on a pedestal of stacked stones. Almost too easy.`,
];

const MAZE_SEARCH_MISS = [
  (n, pr) => `${n} turns another corner and finds... more pillars. The maze gives nothing.`,
  (n, pr) => `Dead end. ${n} backtracks, frustration building with every step.`,
  (n, pr) => `${n} swears ${pr.sub} checked this corridor already. The pillars all look the same.`,
  (n, pr) => `${n} digs through rubble for two minutes and finds a rock shaped like a medallion. It's just a rock.`,
  (n, pr) => `Another empty chamber. ${n} kicks a pebble down the corridor and keeps moving.`,
  (n, pr) => `${n} reaches a mosaic floor — promising — but there's nothing hidden here.`,
  (n, pr) => `The walls are closing in. Or maybe it just feels that way. ${n} finds nothing and presses on.`,
  (n, pr) => `${n} follows what looks like a trail of gold dust. It leads to a puddle. Of regular water.`,
];

const MAZE_CLAIM_FIGHT = [
  (a, b, winner) => `Both ${a} and ${b} lunge for the medal at the same time. A tug-of-war erupts — ${winner} wrenches it free.`,
  (a, b, winner) => `${a} grabs one edge, ${b} grabs the other. For a heartbeat they're locked together. Then ${winner} twists and rips it away.`,
  (a, b, winner) => `The gold medal sits between them. They both dive. Elbows, hands, grunting — ${winner} comes up with it.`,
  (a, b, winner) => `"It's mine!" "No, it's MINE!" ${a} and ${b} grapple over the medal. ${winner} wins the tug.`,
  (a, b, winner) => `${a} touches it first. ${b} slaps ${a}'s hand away. ${winner} secures it through sheer determination.`,
  (a, b, winner) => `A scramble in the dust. ${a} and ${b} roll over each other reaching for the medal. ${winner} emerges victorious.`,
  (a, b, winner) => `${winner} fakes left, reaches right, and snatches the medal while ${winner === a ? b : a} is off-balance.`,
  (a, b, winner) => `Both hands close on the medal simultaneously. ${winner} has the stronger grip. It's over.`,
];

// ── BOAR ENCOUNTERS ──
const BOAR_CHARGE = [
  (n, pr) => `The Erymanthian Boar bursts through a crumbling wall! ${n} barely has time to react.`,
  (n, pr) => `A thundering squeal echoes through the maze. The Boar rounds the corner and locks eyes with ${n}.`,
  (n, pr) => `Dust explodes from a collapsed pillar. The Boar emerges, snorting, hooves scraping stone. ${n} is directly in its path.`,
  (n, pr) => `${n} hears the hoofbeats a second too late. The Boar is already charging.`,
  (n, pr) => `The ground trembles. The Boar slams through a pillar like it's nothing and barrels toward ${n}.`,
  (n, pr) => `${n} turns a corner and comes face-to-snout with the Boar. It does not look happy.`,
  (n, pr) => `A shadow fills the corridor. The Boar steps into the light, steam rising from its nostrils. ${n} freezes.`,
  (n, pr) => `The Boar charges from the darkness. ${n} has maybe two seconds to do something.`,
];

const BOAR_DODGE = [
  (n, pr) => `${n} rolls sideways as the Boar's tusks scrape the wall. Close. Too close.`,
  (n, pr) => `${n} vaults over a fallen column just as the Boar crashes through where ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} standing.`,
  (n, pr) => `${n} drops flat. The Boar sails over ${pr.obj} and crashes into a pillar. ${n} scrambles to ${pr.posAdj} feet and runs.`,
  (n, pr) => `${n} fakes left, darts right. The Boar overshoots. By the time it turns around, ${n} is three corridors away.`,
  (n, pr) => `${n} grabs a vine and swings out of the Boar's path like something out of a myth. ${pr.Sub} land${pr.sub === 'they' ? '' : 's'} running.`,
  (n, pr) => `The Boar charges. ${n} sidesteps at the last instant. The beast's flank brushes ${pr.posAdj} arm but doesn't connect.`,
  (n, pr) => `${n} reads the Boar's charge angle and pivots behind a pillar. The Boar rams the stone and staggers.`,
  (n, pr) => `${n} stands perfectly still. The Boar thunders past, inches away, and keeps going. Sometimes stillness is bravery.`,
];

const BOAR_HIT = [
  (n, pr) => `The Boar catches ${n} with a shoulder charge. ${pr.Sub} go${pr.sub === 'they' ? '' : 'es'} flying into a pillar and hit${pr.sub === 'they' ? '' : 's'} the ground hard.`,
  (n, pr) => `${n} can't dodge in time. The Boar slams into ${pr.obj} and sends ${pr.obj} sprawling across the stone floor.`,
  (n, pr) => `A direct hit. The Boar's tusk catches ${n}'s leg and ${pr.sub} crash${pr.sub === 'they' ? '' : 'es'} down with a yell.`,
  (n, pr) => `${n} tries to jump but doesn't clear the Boar. ${pr.Sub} get${pr.sub === 'they' ? '' : 's'} clipped and tumble${pr.sub === 'they' ? '' : 's'} into the rubble.`,
  (n, pr) => `The Boar lowers its head and connects. ${n} is airborne for a full second before hitting the ground.`,
  (n, pr) => `${n} tries to stand ${pr.posAdj} ground. The Boar has other plans. ${pr.Sub} get${pr.sub === 'they' ? '' : 's'} bowled over like a training dummy.`,
  (n, pr) => `No time to react. The Boar plows into ${n} and keeps running. ${n} lies in the dust, groaning.`,
  (n, pr) => `${n} catches a tusk to the midsection. The impact lifts ${pr.obj} off ${pr.posAdj} feet.`,
];

// ── WRESTLING ──
const WRESTLE_HIT = [
  (a, b) => `${a} catches ${b} with a clean takedown. The impact echoes across the arena.`,
  (a, b) => `${a} feints low and strikes high. ${b} takes the hit flush.`,
  (a, b) => `${a} explodes forward and drives ${b} backward. Pure power.`,
  (a, b) => `${a} hooks ${b}'s arm and twists. ${b} hits the mat with a grunt.`,
  (a, b) => `A devastating sweep from ${a}. ${b}'s legs go out and ${b} crashes down.`,
  (a, b) => `${a} charges, lifts ${b} off the ground, and slams ${b} back down. The crowd gasps.`,
  (a, b) => `${a} reads ${b}'s movement perfectly and counters with a throw that sends ${b} tumbling.`,
  (a, b) => `${a} catches ${b} with a spinning elbow. It connects with a thud.`,
];

const WRESTLE_MISS = [
  (a, b) => `${a} lunges but ${b} sidesteps. Nothing but air.`,
  (a, b) => `${a} overcommits to the attack. ${b} slips away untouched.`,
  (a, b) => `${a} swings wide. ${b} ducks under it easily.`,
  (a, b) => `${a} goes for a grab but ${b} twists free. Slippery.`,
  (a, b) => `${a} charges but ${b} redirects the momentum. ${a} stumbles past.`,
  (a, b) => `${a} throws a combination but none of it lands. ${b} reads every move.`,
  (a, b) => `${a} commits to a takedown that ${b} sprawls out of. Wasted energy.`,
  (a, b) => `${a} telegraphs the move. ${b} is already gone by the time it arrives.`,
];

const WRESTLE_KO = [
  (a, b) => `${b} hits the mat and doesn't get up. ${a} stands over ${b}, chest heaving. It's over.`,
  (a, b) => `One final throw from ${a} and ${b} is done. The ref calls it.`,
  (a, b) => `${b} staggers, knees buckle, and collapses. ${a} raises a fist.`,
  (a, b) => `${a} finishes with a devastating slam. ${b} lies flat, staring at the sky.`,
  (a, b) => `${b} tries to stand but can't. ${a} backs away. The knockout is official.`,
  (a, b) => `A thunderous impact sends ${b} to the ground for the last time. ${a} is victorious.`,
  (a, b) => `${b}'s legs give out. ${a} extends a hand — but the match is over.`,
  (a, b) => `${a} drops ${b} with a final perfectly-timed counter. ${b} is eliminated.`,
];

const WRESTLE_FLASHY = [
  (n, pr) => `${n} goes for a showboat move — spinning leap off the ropes! The crowd erupts.`,
  (n, pr) => `${n} flexes for the audience before attacking. Bold. Reckless. Entertaining.`,
  (n, pr) => `${n} taunts ${pr.posAdj} opponent before striking. The extra power is devastating.`,
  (n, pr) => `${n} does a backflip before charging. Unnecessary? Yes. Effective? Also yes.`,
  (n, pr) => `${n} roars at the crowd and launches into a running attack. Maximum spectacle.`,
  (n, pr) => `${n} strikes a pose mid-fight. It's either confidence or madness. Either way, ${pr.sub} swing${pr.sub === 'they' ? '' : 's'} harder afterward.`,
  (n, pr) => `${n} catches ${pr.posAdj} opponent's arm, spins, and throws with theatrical flair.`,
  (n, pr) => `A theatrical wind-up from ${n}. The crowd loves it. The opponent? Less so.`,
];

const WRESTLE_FLASHY_MISS = [
  (n, pr) => `${n} goes for a flashy move and completely whiffs. Embarrassing.`,
  (n, pr) => `${n} tries to showboat and pays for it. The opponent capitalizes immediately.`,
  (n, pr) => `The spinning attack from ${n} looks great but connects with nothing. ${pr.Sub} stumble${pr.sub === 'they' ? '' : 's'} off-balance.`,
  (n, pr) => `${n} does a flip. Lands badly. The crowd winces.`,
  (n, pr) => `${n} goes for a crowd-pleasing flying attack and faceplants. The crowd still cheers. Out of sympathy.`,
  (n, pr) => `Overconfidence from ${n}. The fancy move leaves ${pr.obj} wide open.`,
  (n, pr) => `${n}'s showboat finisher sails over ${pr.posAdj} opponent's head. So much for style points.`,
  (n, pr) => `${n} winds up for the big finish... and misses by a mile. ${host()} cackles from the sideline.`,
];

const WRESTLE_TAG_IN = [
  (out, into) => `${out} slaps ${into}'s hand. Tag! ${into} jumps in fresh.`,
  (out, into) => `${out} is hurting. ${out} crawls to the corner and tags ${into}. Relief.`,
  (out, into) => `"Get in there!" ${out} tags ${into} and rolls out of the ring, gasping.`,
  (out, into) => `${out} makes the tag. ${into} vaults over the ropes and charges in.`,
  (out, into) => `A desperate reach from ${out}. ${into}'s hand connects. The tag is made!`,
  (out, into) => `${out} stumbles to the corner. ${into} is reaching. Contact! ${into} explodes into the fight.`,
  (out, into) => `${out} can barely stand. ${into} leans over the ropes and makes the tag. Fresh legs.`,
  (out, into) => `"TAG ME IN!" ${into} screams. ${out} slaps ${into}'s hand and collapses.`,
];

const WRESTLE_BETRAYAL = [
  (a, partner) => `${a} turns and hits ${partner} instead! The crowd goes silent. ${a} just attacked ${a}'s own partner!`,
  (a, partner) => `${a} grabs ${partner} by the collar and throws ${partner} at the opponent. "Nothing personal."`,
  (a, partner) => `${a} "accidentally" elbows ${partner} in the chaos. The look on ${partner}'s face says it wasn't an accident.`,
  (a, partner) => `${a} uses ${partner} as a human shield. The opponent's hit lands on ${partner} instead. ${a} smirks.`,
  (a, partner) => `Instead of tagging in, ${a} shoves ${partner} back into the fight. "You're not done yet."`,
  (a, partner) => `${a} trips ${partner} from the apron. ${partner} goes down. The opponent pounces. ${a} watches with cold eyes.`,
  (a, partner) => `"Trust me," ${a} says, then throws ${partner} directly into the opponent's arms. Trust broken.`,
  (a, partner) => `${a} yanks ${partner} backward into a falling opponent. Both go down. ${a} steps over them.`,
];

// ── HURDLES ──
const HURDLE_RUN_SAFE = [
  (n, pr) => `${n} clears the hurdle with clean form. Nothing fancy, but effective.`,
  (n, pr) => `Steady pace from ${n}. Over the hurdle, keep running. No mistakes.`,
  (n, pr) => `${n} takes each hurdle with mechanical precision. Not exciting, but fast.`,
  (n, pr) => `${n} flows over the barrier like ${pr.sub}'${pr.sub === 'they' ? 've' : 's'} done this a thousand times.`,
  (n, pr) => `${n} keeps ${pr.posAdj} head down and runs. Clean clearance. Keep moving.`,
  (n, pr) => `${n} approaches the hurdle at full stride and clears it without breaking pace.`,
  (n, pr) => `No drama from ${n}. Just solid technique and forward momentum.`,
  (n, pr) => `${n} plants, pushes, and sails over the hurdle. Textbook.`,
];

const HURDLE_SHOWOFF_SUCCESS = [
  (n, pr) => `${n} does a FLIP over the hurdle! Lands it! The crowd goes wild!`,
  (n, pr) => `${n} doesn't jump the hurdle — ${pr.sub} slide${pr.sub === 'they' ? '' : 's'} under it like a limbo champion. Somehow faster.`,
  (n, pr) => `${n} vaults the hurdle one-handed and winks at the camera. Show-off. But it worked.`,
  (n, pr) => `${n} launches off the hurdle and does a mid-air spin. Sticks the landing. Disgusting talent.`,
  (n, pr) => `${n} treats the hurdle like a gymnastic apparatus. The resulting move is equal parts terrifying and graceful.`,
  (n, pr) => `${n} clears the hurdle with a diving roll that somehow gains speed. The physics don't add up but the clock doesn't lie.`,
  (n, pr) => `A cartwheel over the hurdle from ${n}. ${pr.Sub} land${pr.sub === 'they' ? '' : 's'} in a dead sprint. Absurd.`,
  (n, pr) => `${n} goes sideways over the hurdle — a lateral flip that shaves a full second off ${pr.posAdj} time.`,
];

const HURDLE_SHOWOFF_WIPEOUT = [
  (n, pr) => `${n} attempts a flip and clips the hurdle. ${pr.Sub} crash${pr.sub === 'they' ? '' : 'es'} face-first into the track. Ouch.`,
  (n, pr) => `${n} tries something fancy and eats dirt. The hurdle wins this round.`,
  (n, pr) => `${n} goes for the flashy clearance and gets tangled. ${pr.Sub} hit${pr.sub === 'they' ? '' : 's'} the ground in a heap.`,
  (n, pr) => `Too much style, not enough substance. ${n} wipes out spectacularly on the hurdle.`,
  (n, pr) => `${n} overrotates on the flip and lands on ${pr.posAdj} back. The groan echoes across the track.`,
  (n, pr) => `The showoff attempt from ${n} ends in disaster. ${pr.Sub} catch${pr.sub === 'they' ? '' : 'es'} a foot on the bar and tumble${pr.sub === 'they' ? '' : 's'} hard.`,
  (n, pr) => `${n} tries the cartwheel over the hurdle. Gets about 70% of the way. Gravity handles the rest.`,
  (n, pr) => `${n} launches off the wrong foot, clips the hurdle, and does a full somersault into the dirt. Not the good kind.`,
];

// ── ICARUS ──
const ICARUS_FLIGHT = [
  (n, pr, alt) => `${n} soars higher, wax wings straining. Altitude: ${alt.toFixed(1)}.`,
  (n, pr, alt) => `${n} catches a thermal and climbs. The ground shrinks below. Altitude: ${alt.toFixed(1)}.`,
  (n, pr, alt) => `${n} pumps ${pr.posAdj} wings and gains height. ${pr.Sub} can see the medal glinting above. Altitude: ${alt.toFixed(1)}.`,
  (n, pr, alt) => `Higher and higher. ${n}'s wings beat rhythmically against the updraft. Altitude: ${alt.toFixed(1)}.`,
  (n, pr, alt) => `${n} tilts into the wind and rises. The wax creaks. Altitude: ${alt.toFixed(1)}.`,
  (n, pr, alt) => `${n} spirals upward with surprising grace. The heat is building. Altitude: ${alt.toFixed(1)}.`,
  (n, pr, alt) => `${n} powers through the turbulence and climbs another level. Altitude: ${alt.toFixed(1)}.`,
  (n, pr, alt) => `${n}'s wings flex dangerously but hold. ${pr.Sub} gain${pr.sub === 'they' ? '' : 's'} altitude. ${alt.toFixed(1)}.`,
];

const ICARUS_MELT = [
  (n, pr, integ) => `The wax on ${n}'s wings is dripping. Integrity: ${integ}%.`,
  (n, pr, integ) => `${n} feels the heat. ${pr.PosAdj} wings are softening. Integrity: ${integ}%.`,
  (n, pr, integ) => `Feathers fall from ${n}'s wings. The wax can't hold much longer. Integrity: ${integ}%.`,
  (n, pr, integ) => `${n}'s wings shudder. The framework is warping in the heat. Integrity: ${integ}%.`,
  (n, pr, integ) => `Wax pools on ${n}'s shoulders. ${pr.PosAdj} wings are failing. Integrity: ${integ}%.`,
  (n, pr, integ) => `${n} can feel the structure giving way. The wings sag. Integrity: ${integ}%.`,
  (n, pr, integ) => `A feather breaks free and spirals away. ${n} watches it fall. Integrity: ${integ}%.`,
  (n, pr, integ) => `The sun beats down mercilessly. ${n}'s wings are barely holding together. Integrity: ${integ}%.`,
];

const ICARUS_COLLAPSE = [
  (n, pr) => `${n}'s wings shatter! ${pr.Sub} plummet${pr.sub === 'they' ? '' : 's'} earthward, arms flailing. The fall is not graceful.`,
  (n, pr) => `The wax gives out. ${n}'s wings fold like wet paper. Down ${pr.sub} go${pr.sub === 'they' ? '' : 'es'}.`,
  (n, pr) => `A sickening crack. ${n}'s wings disintegrate mid-flight. ${pr.Sub} tumble${pr.sub === 'they' ? '' : 's'} through the air.`,
  (n, pr) => `${n} reaches for the medal — and ${pr.posAdj} wings collapse. So close. So far.`,
  (n, pr) => `The myth of Icarus, played out in real time. ${n}'s wings melt. ${n} falls.`,
  (n, pr) => `${n} flew too high. The wings buckle and ${pr.sub} drop${pr.sub === 'they' ? '' : 's'} like a stone.`,
  (n, pr) => `With a final desperate flap, ${n}'s left wing snaps off. The right follows. Free fall.`,
  (n, pr) => `${n}'s wings dissolve into wax and feathers. ${pr.Sub} fall${pr.sub === 'they' ? '' : 's'} with a scream that fades into distance.`,
];

const ICARUS_MEDAL_GRAB = [
  (n, pr) => `${n} reaches the medal! ${pr.Sub} snatch${pr.sub === 'they' ? '' : 'es'} it from the sky and holds it high as ${pr.posAdj} wings begin to fail. Doesn't matter — gold secured.`,
  (n, pr) => `The medal is within reach. ${n} stretches, fingers closing around it. Got it! ${pr.Sub} grab${pr.sub === 'they' ? '' : 's'} the gold just as the wings give out.`,
  (n, pr) => `${n} flies directly at the medal and rips it from its mounting. The wax is dripping, the wings are failing, but ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} the gold!`,
  (n, pr) => `With ${pr.posAdj} last ounce of altitude, ${n} claims the medal. ${pr.Sub} clutch${pr.sub === 'they' ? '' : 'es'} it to ${pr.posAdj} chest as the wings crumble.`,
];

// ── SOCIAL EVENTS ──
const SOCIAL_TENSION = [
  (a, b) => `${a} blames ${b} for slowing them down in the maze. ${b} fires back. The argument echoes through the pillars.`,
  (a, b) => `"You went the wrong way!" ${a} snaps at ${b}. "YOU went the wrong way!" Tensions boil over.`,
  (a, b) => `${a} and ${b} can't agree on direction. They split up, each convinced the other is an idiot.`,
  (a, b) => `${a} accuses ${b} of hogging the search zones. ${b} rolls ${pronouns(b).posAdj} eyes but the damage is done.`,
  (a, b) => `The forced partnership between ${a} and ${b} is cracking. Neither trusts the other's instincts.`,
  (a, b) => `${a} mutters something under ${pronouns(a).posAdj} breath. ${b} hears it. "What did you just say?" Things escalate.`,
  (a, b) => `${a} deliberately checks a corridor ${b} already searched. "Just making sure." ${b} seethes.`,
  (a, b) => `${a} refuses to follow ${b}'s lead. "I'm not taking orders from you." The maze gets colder.`,
];

const SOCIAL_COOPERATION = [
  (a, b) => `${a} and ${b} work together to move a fallen pillar. Behind it: a new corridor. They exchange a nod.`,
  (a, b) => `${a} spots danger and pulls ${b} back. "Watch out." ${b} nods gratefully.`,
  (a, b) => `${a} and ${b} share water. A small gesture, but in this maze, it matters.`,
  (a, b) => `${b} starts to panic in a dead end. ${a} puts a hand on ${b}'s shoulder. "We'll find a way." They do.`,
  (a, b) => `${a} boosts ${b} up to a high ledge to scout ahead. Teamwork makes the dream work.`,
  (a, b) => `After the Boar charges past, ${a} checks on ${b} first. "You okay?" ${b} is.`,
  (a, b) => `${a} covers ${b}'s back while ${b} searches a chamber. Trust builds one corridor at a time.`,
  (a, b) => `${a} shares ${pronouns(a).posAdj} discovery of a shortcut with ${b}. They move through it together.`,
];

const SOCIAL_RESPECT = [
  (a, b) => `${a} watches ${b}'s performance and nods slowly. Respect. Even between rivals.`,
  (a, b) => `After the fight, ${a} offers ${b} a hand up. "Good match." ${b} accepts.`,
  (a, b) => `${a} admits ${b} is tougher than expected. "I underestimated you." It sounds genuine.`,
  (a, b) => `${a} and ${b} lock eyes after the event. A moment of mutual acknowledgment. Wordless, but real.`,
  (a, b) => `${a} tells ${host()}, "If I had to pick a partner, I'd pick ${b}." High praise.`,
  (a, b) => `"Not bad," ${a} says to ${b} after the hurdles. From ${a}, that's practically a standing ovation.`,
  (a, b) => `${a} tosses ${b} a water bottle. "Earned it." ${b} catches it. Something shifted between them.`,
  (a, b) => `${a} concedes the round to ${b} without complaint. "Fair and square." Respect gained.`,
];

const SOCIAL_CONFRONTATION = [
  (a, b) => `${a} gets in ${b}'s face after the wrestling match. "That was a cheap shot and you know it."`,
  (a, b) => `${a} shoves ${b} after the event. "Try that again and see what happens."`,
  (a, b) => `${a} storms up to ${b}. "You sabotaged me in there." ${b} doesn't deny it.`,
  (a, b) => `"Stay out of my way next time." ${a} stares ${b} down. ${b} stares back. Neither blinks.`,
  (a, b) => `${a} accuses ${b} of cheating. ${b} laughs. "Prove it." The tension is thick enough to cut.`,
  (a, b) => `${a} is furious with ${b}. Words are exchanged. None of them are pleasant.`,
  (a, b) => `"This isn't over." ${a} says it quietly to ${b}. Quiet threats are the worst kind.`,
  (a, b) => `${a} and ${b} have to be separated after the event. Both are seething.`,
];

// ── HOST COMMENTARY ──
const HOST_BETWEEN_EVENTS = [
  () => `${host()} adjusts his laurel crown. "On to the next event, athletes! Try not to embarrass yourselves."`,
  () => `"Three events, three golds, one path to glory!" ${host()} announces from his golden throne.`,
  () => `${host()} sips from a goblet. "The ancient competitors had it easy compared to MY Olympics."`,
  () => `"Moving on!" ${host()} claps. "The next event awaits. Stretch if you want. I don't care."`,
  () => `${host()} checks his clipboard. "Alright, next event. Injuries from the last one are NOT my problem."`,
  () => `"The crowd demands more!" ${host()} gestures at the empty arena. "Okay, I demand more."`,
  () => `${host()} struts between events. "Remember: this is MY Olympics. I make the rules. There are no rules."`,
  () => `"How's everyone feeling?" ${host()} doesn't wait for answers. "Great! Next event!"`,
  () => `${host()} polishes a gold medal. "One of you MIGHT earn this. Emphasis on might."`,
  () => `"Contestants, assemble!" ${host()} blows a conch shell. It sounds terrible. He doesn't care.`,
];

// ── MAZE ZONES ──
const MAZE_ZONES = [
  { id: 'colonnade', name: 'The Colonnade', searchMod: 0.08, boarMod: -0.05, goldWeight: 1 },
  { id: 'pediment', name: 'Pediment Chamber', searchMod: 0, boarMod: 0, goldWeight: 1.5 },
  { id: 'cistern', name: 'Underground Cistern', searchMod: -0.12, boarMod: 0.15, goldWeight: 2 },
  { id: 'sanctum', name: 'Inner Sanctum', searchMod: -0.08, boarMod: 0.05, goldWeight: 2.5 },
  { id: 'agora', name: 'Ruined Agora', searchMod: 0.05, boarMod: -0.10, goldWeight: 0.8 },
];

const MAZE_ZONE_ENTER = [
  (pair, z) => `${pair[0]} and ${pair[1]} push into ${z.name}. The pillars close in around them.`,
  (pair, z) => `The pair chooses ${z.name}. ${pair[0]} takes point, ${pair[1]} watches the flanks.`,
  (pair, z) => `"This way." ${pair[0]} pulls ${pair[1]} toward ${z.name}. The maze narrows.`,
  (pair, z) => `${pair[1]} spots a gap in the ruins — ${z.name}. They squeeze through together.`,
  (pair, z) => `${pair[0]} and ${pair[1]} navigate deeper into the labyrinth, entering ${z.name}.`,
  (pair, z) => `The corridors twist and split. ${pair[0]} chooses ${z.name}. ${pair[1]} follows warily.`,
  (pair, z) => `${pair[1]} grabs ${pair[0]}'s shoulder. "In here." They duck into ${z.name}.`,
  (pair, z) => `A crumbling archway leads to ${z.name}. ${pair[0]} and ${pair[1]} trade glances and enter.`,
];

const MAZE_ZONE_FLAVOR = {
  colonnade: [
    'Sunlight filters between the massive columns. Good visibility but nowhere to hide.',
    'The columns cast long shadows. Every few steps reveals another corridor.',
    'Open sky above. The marble pillars stand like silent sentinels.',
    'Birds scatter from a broken capital overhead. The Colonnade stretches endlessly.',
    'Wind whistles through the column gaps. Marble dust drifts like snow.',
    'The pillars here are intact — towering, pristine, ancient. And empty.',
  ],
  pediment: [
    'Rubble crunches underfoot. Collapsed roof beams create a treacherous obstacle course.',
    'Shattered friezes and toppled capitals litter the floor.',
    'Dust motes float in thin beams of light piercing through the wreckage.',
    'A section of wall groans ominously. This chamber is not structurally sound.',
    'Broken stone faces stare up from the rubble. The gods have fallen here.',
    'Every step sends pebbles skittering. The footing is treacherous.',
  ],
  cistern: [
    'Water drips from unseen ceilings. Every sound echoes. Something moves in the dark.',
    'The torchlight barely reaches the cistern walls. Ankle-deep water slows every step.',
    'The air is thick and damp. Moss covers the ancient waterways.',
    'A distant splashing echoes through the tunnels. Is that the boar? Or worse?',
    'The cistern swallows all light. Stone steps descend into blackness.',
    'Water gurgles through channels carved a thousand years ago. The boar loves it down here.',
  ],
  sanctum: [
    'Faded murals depict forgotten gods. Offering bowls collect centuries of dust.',
    'The air smells of ancient incense. Gold leaf flakes from the ceiling.',
    'Torchlight dances across painted eyes. The Sanctum feels like it is watching.',
    'Stone altars and prayer niches line the walls. If gold is anywhere, it is here.',
    'Silence so deep it hurts. The Sanctum has been waiting for visitors.',
    'Sacred geometry in the tile floor. The builders hid things in these walls.',
  ],
  agora: [
    'Toppled market stalls and shattered pottery everywhere. Wide open, nowhere to hide.',
    'A headless statue presides over the abandoned marketplace.',
    'The Agora is exposed. Easy to search but easy for the boar to spot you.',
    'Broken merchant weights and scattered coins — but no gold medal.',
    'An overturned amphora leaks ancient oil across the stones. Slippery.',
    'The open sky is both a relief and a risk. No maze walls to hide behind.',
  ],
};


// ══════════════════════════════════════════════════════════════════════
// PHASE 1: PILLAR MAZE GOLD HUNT — Zone-based exploration
// ══════════════════════════════════════════════════════════════════════
function _simulateMaze(active, ep, tribeData) {
  const isMerged = gs.isMerged;
  const maze = { pairs: [], rounds: [], goldWinner: null, goldTribe: null, boarEvents: [], socialEvents: [], zoneHistory: [], performances: [] };

  // ── Pairing — cross-tribe pairs of 2 ──
  let pairs = [];
  if (!isMerged && tribeData && tribeData.length >= 2) {
    const pools = tribeData.map(t => ({ tribeName: t.tribeName, members: [...t.members].sort(() => Math.random() - 0.5) }));
    const allPlayers = new Set(active);
    const paired = new Set();
    // Round-robin across tribe combinations to ensure all tribes get represented
    const tribeCombos = [];
    for (let i = 0; i < pools.length; i++)
      for (let j = i + 1; j < pools.length; j++)
        tribeCombos.push([i, j]);
    let comboIdx = 0;
    while (paired.size < allPlayers.size - 1) {
      const [ti, tj] = tribeCombos[comboIdx % tribeCombos.length];
      const pA = pools[ti].members.find(m => !paired.has(m));
      const pB = pools[tj].members.find(m => !paired.has(m));
      if (pA && pB) {
        pairs.push([pA, pB]);
        paired.add(pA);
        paired.add(pB);
      }
      comboIdx++;
      if (comboIdx > tribeCombos.length * 20) break;
    }
    // Any leftover unpaired player pairs with another leftover or goes solo
    const leftovers = active.filter(p => !paired.has(p));
    for (let i = 0; i < leftovers.length; i += 2) {
      if (i + 1 < leftovers.length) pairs.push([leftovers[i], leftovers[i + 1]]);
      else pairs.push([leftovers[i]]);
    }
  } else {
    const shuffled = [...active].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) pairs.push([shuffled[i], shuffled[i + 1]]);
      else pairs.push([shuffled[i]]);
    }
  }
  maze.pairs = pairs.map(p => [...p]);

  // ── Round simulation with zone system ──
  let goldFound = false;
  const cumulativeSearch = {};
  active.forEach(n => { cumulativeSearch[n] = 0; });
  const maxRounds = 5;
  const pairZoneHistory = {};

  for (let round = 0; round < maxRounds && !goldFound; round++) {
    const roundData = { round: round + 1, events: [], zoneAssignments: [], goldZone: null };

    // Place gold in a weighted-random zone (harder zones more likely, escalates)
    const goldWeights = MAZE_ZONES.map(z => z.goldWeight + round * 0.3);
    const totalW = goldWeights.reduce((a, b) => a + b, 0);
    let gr = Math.random() * totalW;
    let goldZoneIdx = 0;
    for (let i = 0; i < goldWeights.length; i++) { gr -= goldWeights[i]; if (gr <= 0) { goldZoneIdx = i; break; } }
    const goldZone = MAZE_ZONES[goldZoneIdx];
    roundData.goldZone = goldZone.id;

    const boarBase = round <= 1 ? 0.20 : (round <= 3 ? 0.45 : 0.70);

    pairs.forEach((pair, pairIdx) => {
      if (!pairZoneHistory[pairIdx]) pairZoneHistory[pairIdx] = [];
      const leader = pair[0];
      const leaderS = pStats(leader);

      // Zone pick: stat-driven, avoid repeats, smarter players go deeper
      const zoneScores = MAZE_ZONES.map(z => {
        let sc = leaderS.intuition * 0.1 + leaderS.mental * 0.06 + noise(2.5);
        if (z.goldWeight > 1.5) sc += leaderS.strategic * 0.05;
        if (pairZoneHistory[pairIdx].includes(z.id)) sc -= 0.3;
        return { zone: z, score: sc };
      });
      zoneScores.sort((a, b) => b.score - a.score);
      const chosenZone = zoneScores[0].zone;
      pairZoneHistory[pairIdx].push(chosenZone.id);

      roundData.zoneAssignments.push({ pair: [...pair], zone: chosenZone.id, zoneName: chosenZone.name });

      // Zone entry event
      roundData.events.push({
        type: 'zone-enter', pair: [...pair], zone: chosenZone.id, zoneName: chosenZone.name, round: round + 1,
        text: pick(MAZE_ZONE_ENTER)(pair, chosenZone),
        flavor: pick(MAZE_ZONE_FLAVOR[chosenZone.id]),
        badge: chosenZone.name.toUpperCase(), badgeClass: 'blue'
      });

      // ── Search: each player searches ──
      const inGoldZone = chosenZone.id === goldZone.id;

      pair.forEach(name => {
        const s = pStats(name);
        const pr = pronouns(name);
        const searchRoll = s.intuition * 0.12 + s.mental * 0.08 + chosenZone.searchMod + noise(2.5);
        cumulativeSearch[name] += searchRoll;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;

        if (inGoldZone && searchRoll >= 0.55 && !goldFound) {
          goldFound = true;
          const claimants = pair.length > 1 ? pair : [pair[0]];

          if (claimants.length === 1) {
            maze.goldWinner = claimants[0];
            ep.chalMemberScores[claimants[0]] = (ep.chalMemberScores[claimants[0]] || 0) + 5;
            popDelta(claimants[0], 2);
            roundData.events.push({
              type: 'gold-found', player: claimants[0], round: round + 1, zone: chosenZone.id,
              text: pick(MAZE_SEARCH_FIND)(claimants[0], pronouns(claimants[0])),
              badge: 'GOLD MEDAL', badgeClass: 'gold'
            });
          } else {
            const bond = getBond(claimants[0], claimants[1]);
            const rolls = claimants.map(n => {
              const st = pStats(n);
              let roll = st.intuition * 0.1 + st.boldness * 0.08 + noise(2.5);
              if (bond < -2 && Math.random() < 0.30) {
                const partner = pair.find(p => p !== n);
                roll -= 0.15;
                roundData.events.push({
                  type: 'maze-sabotage', saboteur: partner, victim: n, round: round + 1, zone: chosenZone.id,
                  text: `${partner} subtly interferes with ${n}'s reach for the medal.`,
                  badge: 'SABOTAGE', badgeClass: 'red'
                });
                addBond(n, partner, -1);
                popDelta(partner, -1);
              }
              return { name: n, roll };
            });
            rolls.sort((a, b) => b.roll - a.roll);
            maze.goldWinner = rolls[0].name;
            ep.chalMemberScores[rolls[0].name] = (ep.chalMemberScores[rolls[0].name] || 0) + 5;
            popDelta(rolls[0].name, 2);
            roundData.events.push({
              type: 'gold-claim', winner: rolls[0].name, loser: rolls[1].name, round: round + 1, zone: chosenZone.id,
              text: pick(MAZE_CLAIM_FIGHT)(claimants[0], claimants[1], rolls[0].name),
              badge: 'GOLD CLAIMED', badgeClass: 'gold'
            });
          }
        } else if (!goldFound && Math.random() < 0.60) {
          roundData.events.push({
            type: 'search-miss', player: name, round: round + 1, zone: chosenZone.id,
            text: pick(MAZE_SEARCH_MISS)(name, pr),
            badge: 'SEARCHING', badgeClass: 'grey'
          });
        }
      });

      // ── Boar encounter (zone-modified chance) ──
      const boarChance = clamp(boarBase + chosenZone.boarMod, 0, 0.9);
      if (Math.random() < boarChance) {
        const target = pick(pair);
        const s = pStats(target);
        const pr = pronouns(target);
        const boarRoll = s.physical * 0.1 + s.intuition * 0.06 + noise(2.5);
        const chargeText = pick(BOAR_CHARGE)(target, pr);

        if (boarRoll > 0.5) {
          ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 1;
          popDelta(target, 1);
          const evt = {
            type: 'boar-dodge', player: target, round: round + 1, zone: chosenZone.id,
            chargeText, text: pick(BOAR_DODGE)(target, pr),
            badge: 'BOAR DODGE', badgeClass: 'gold'
          };
          roundData.events.push(evt);
          maze.boarEvents.push(evt);
        } else {
          ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) - 2;
          popDelta(target, -1);
          const evt = {
            type: 'boar-hit', player: target, round: round + 1, zone: chosenZone.id,
            chargeText, text: pick(BOAR_HIT)(target, pr),
            badge: 'BOAR ATTACK', badgeClass: 'red'
          };
          roundData.events.push(evt);
          maze.boarEvents.push(evt);

          if (pair.length > 1) {
            const partner = pair.find(p => p !== target);
            if (partner && Math.random() < 0.50) {
              const pArch = arch(partner);
              const helpChance = pStats(partner).loyalty * 0.1 + noise(2.5);
              if (helpChance > 0.4 || NICE_ARCHS.has(pArch)) {
                addBond(target, partner, 1);
                popDelta(partner, 1);
                roundData.events.push({
                  type: 'boar-help', helper: partner, helped: target, round: round + 1, zone: chosenZone.id,
                  text: pick(SOCIAL_COOPERATION)(partner, target),
                  badge: 'TEAMWORK', badgeClass: 'green'
                });
              } else {
                addBond(target, partner, -1);
                popDelta(partner, -1);
                roundData.events.push({
                  type: 'boar-abandon', abandoner: partner, victim: target, round: round + 1, zone: chosenZone.id,
                  text: `${partner} sees ${target} go down and keeps running. Self-preservation.`,
                  badge: 'ABANDONED', badgeClass: 'red'
                });
              }
            }
          }
        }
      }

      // ── Double boar in cistern (rounds 3+) ──
      if (round >= 2 && chosenZone.id === 'cistern' && Math.random() < 0.35) {
        const target = pick(pair);
        const s = pStats(target);
        const pr = pronouns(target);
        const boarRoll = s.physical * 0.1 + s.intuition * 0.06 + noise(2.5);
        if (boarRoll > 0.55) {
          ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 2;
          popDelta(target, 1);
          const evt = {
            type: 'boar-dodge', player: target, round: round + 1, zone: chosenZone.id,
            chargeText: `The Boar circles back through the flooded cistern tunnels — ${target} in its sights again!`,
            text: pick(BOAR_DODGE)(target, pr),
            badge: 'DOUBLE DODGE', badgeClass: 'gold'
          };
          roundData.events.push(evt);
          maze.boarEvents.push(evt);
        } else {
          ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) - 3;
          popDelta(target, -1);
          const evt = {
            type: 'boar-hit', player: target, round: round + 1, zone: chosenZone.id,
            chargeText: `The Boar comes back for seconds! ${target} barely sees it in the dark cistern!`,
            text: pick(BOAR_HIT)(target, pr),
            badge: 'TRAMPLED', badgeClass: 'red'
          };
          roundData.events.push(evt);
          maze.boarEvents.push(evt);
        }
      }

      // ── Social events ──
      if (pair.length > 1) {
        const bond = getBond(pair[0], pair[1]);

        if (bond < 0 && Math.random() < 0.65) {
          addBond(pair[0], pair[1], -1);
          const evt = {
            type: 'social-tension', players: [...pair], round: round + 1, zone: chosenZone.id,
            text: pick(SOCIAL_TENSION)(pair[0], pair[1]),
            badge: 'TENSION', badgeClass: 'red'
          };
          roundData.events.push(evt);
          maze.socialEvents.push(evt);
        } else if (bond >= 0 && Math.random() < 0.35) {
          addBond(pair[0], pair[1], 1);
          const evt = {
            type: 'social-cooperation', players: [...pair], round: round + 1, zone: chosenZone.id,
            text: pick(SOCIAL_COOPERATION)(pair[0], pair[1]),
            badge: 'TEAMWORK', badgeClass: 'green'
          };
          roundData.events.push(evt);
          maze.socialEvents.push(evt);
        }

        // Confrontation in later rounds when bond very negative
        if (round >= 2 && bond <= -3 && Math.random() < 0.40) {
          addBond(pair[0], pair[1], -2);
          popDelta(pair[0], -1);
          popDelta(pair[1], -1);
          const instigator = Math.random() < 0.5 ? pair[0] : pair[1];
          const other = pair.find(p => p !== instigator);
          const evt = {
            type: 'social-confrontation', players: [...pair], instigator, other, round: round + 1, zone: chosenZone.id,
            text: `${instigator} snaps at ${other} in the maze corridors. "You're useless! I'd be better off alone!" The partnership is fracturing.`,
            badge: 'CONFRONTATION', badgeClass: 'red'
          };
          roundData.events.push(evt);
          maze.socialEvents.push(evt);
        }

        // Cross-tribe respect (pre-merge, later rounds)
        if (!isMerged && round >= 1 && Math.random() < 0.25) {
          const s0 = pStats(pair[0]);
          const s1 = pStats(pair[1]);
          if (s0.physical > 7 && s1.physical > 7 && bond > -2) {
            addBond(pair[0], pair[1], 1);
            roundData.events.push({
              type: 'social-respect', players: [...pair], round: round + 1, zone: chosenZone.id,
              text: `${pair[0]} and ${pair[1]} share a grudging nod after navigating ${chosenZone.name} together. Enemies? Maybe. But respect is earned in the maze.`,
              badge: 'RESPECT', badgeClass: 'green'
            });
          }
        }
      }
    });

    maze.rounds.push(roundData);
    maze.zoneHistory.push(roundData.zoneAssignments);
  }

  // Fallback: best searcher gets gold
  if (!goldFound) {
    const best = active.slice().sort((a, b) => (cumulativeSearch[b] || 0) - (cumulativeSearch[a] || 0))[0];
    maze.goldWinner = best;
    ep.chalMemberScores[best] = (ep.chalMemberScores[best] || 0) + 5;
    popDelta(best, 2);
    const lastRound = maze.rounds[maze.rounds.length - 1] || { round: maxRounds, events: [] };
    lastRound.events.push({
      type: 'gold-found-default', player: best, round: maxRounds,
      text: `After exhausting every corridor, ${best} finds the gold medal embedded in the maze's central column.`,
      badge: 'GOLD MEDAL', badgeClass: 'gold'
    });
  }

  if (!isMerged && tribeData) {
    for (const t of tribeData) {
      if (t.members.includes(maze.goldWinner)) { maze.goldTribe = t.tribeName; break; }
    }
  }

  maze.performances = active.map(n => ({ name: n, score: ep.chalMemberScores[n] || 0 }));

  const evtKey = isMerged ? (gs.mergeName || 'merge') : maze.goldTribe;
  if (evtKey) {
    if (!ep.campEvents[evtKey]) ep.campEvents[evtKey] = { pre: [], post: [] };
    ep.campEvents[evtKey].post.push({
      type: 'greeces-pieces-maze-gold',
      players: [maze.goldWinner],
      badgeText: 'Maze Gold',
      badgeClass: 'badge-gold',
      text: `${maze.goldWinner} claimed the gold medal in the Pillar Maze!`
    });
  }

  return maze;
}


// ══════════════════════════════════════════════════════════════════════
// PHASE 2: WRESTLING — TAG-TEAM BRAWL
// ══════════════════════════════════════════════════════════════════════
function _simulateWrestling(active, ep, tribeData) {
  const isMerged = gs.isMerged;
  const wrestling = { matches: [], rounds: [], goldWinner: null, goldTribe: null, knockouts: [] };

  // ── Build teams ──
  let teams = [];
  if (!isMerged && tribeData) {
    // Pre-merge: 2 per tribe (highest physical+social combo)
    tribeData.forEach(t => {
      const ranked = [...t.members].sort((a, b) => {
        const sa = pStats(a), sb = pStats(b);
        return (sb.physical + sb.social) - (sa.physical + sa.social);
      });
      teams.push({
        tribeName: t.tribeName,
        fighters: ranked.slice(0, 2),
        hp: [100, 100],
        tags: 2,
        active: 0 // index of active fighter
      });
    });
  } else {
    // Post-merge: random pairs, bracket tournament
    const shuffled = [...active].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        teams.push({
          tribeName: null,
          fighters: [shuffled[i], shuffled[i + 1]],
          hp: [100, 100],
          tags: 2,
          active: 0
        });
      } else {
        // Odd player out — solo fighter
        teams.push({
          tribeName: null,
          fighters: [shuffled[i]],
          hp: [100],
          tags: 0,
          active: 0
        });
      }
    }
  }

  // ── Combat simulation ──
  const maxRounds = 8;
  const alive = new Set(teams.map((_, i) => i));

  for (let round = 0; round < maxRounds && alive.size > 1; round++) {
    const roundData = { round: round + 1, events: [] };
    const teamIndices = [...alive];

    // Each active fighter targets a random opponent
    for (const ti of teamIndices) {
      if (!alive.has(ti)) continue;
      const team = teams[ti];
      const fighter = team.fighters[team.active];
      if (!fighter) continue;

      // Pick target
      const opponents = teamIndices.filter(j => j !== ti && alive.has(j));
      if (opponents.length === 0) continue;
      const oppIdx = pick(opponents);
      const oppTeam = teams[oppIdx];
      const opponent = oppTeam.fighters[oppTeam.active];
      if (!opponent) continue;

      const fs = pStats(fighter);
      const os = pStats(opponent);
      const fpr = pronouns(fighter);

      // Flashy move check (boldness >= 7)
      const isCocky = fs.boldness >= 7;
      let doFlashy = isCocky && Math.random() < 0.35;

      // Hit roll
      let hitRoll = fs.physical * 0.1 + fs.boldness * 0.06 + noise(2.5);
      let defRoll = os.physical * 0.08 + os.intuition * 0.05 + noise(2.5);

      if (doFlashy) {
        hitRoll += 0.15; // miss penalty for flashy
        if (hitRoll > defRoll) {
          // Flashy hit — 1.5x damage
          const damage = Math.floor((15 + Math.floor(Math.random() * 16)) * 1.5);
          oppTeam.hp[oppTeam.active] -= damage;
          ep.chalMemberScores[fighter] = (ep.chalMemberScores[fighter] || 0) + 2;
          roundData.events.push({
            type: 'flashy-hit', attacker: fighter, defender: opponent, damage, round: round + 1,
            text: pick(WRESTLE_FLASHY)(fighter, fpr) + ' ' + pick(WRESTLE_HIT)(fighter, opponent),
            badge: 'FLASHY HIT', badgeClass: 'gold'
          });
          popDelta(fighter, 1);
        } else {
          // Flashy miss
          roundData.events.push({
            type: 'flashy-miss', attacker: fighter, defender: opponent, round: round + 1,
            text: pick(WRESTLE_FLASHY_MISS)(fighter, fpr),
            badge: 'SHOWBOAT FAIL', badgeClass: 'red'
          });
          popDelta(fighter, -1);
        }
      } else if (hitRoll > defRoll) {
        // Normal hit
        const damage = 15 + Math.floor(Math.random() * 16);
        oppTeam.hp[oppTeam.active] -= damage;
        ep.chalMemberScores[fighter] = (ep.chalMemberScores[fighter] || 0) + 1;
        roundData.events.push({
          type: 'hit', attacker: fighter, defender: opponent, damage, round: round + 1,
          text: pick(WRESTLE_HIT)(fighter, opponent),
          badge: 'HIT', badgeClass: 'orange'
        });
      } else {
        // Miss
        roundData.events.push({
          type: 'miss', attacker: fighter, defender: opponent, round: round + 1,
          text: pick(WRESTLE_MISS)(fighter, opponent),
          badge: 'MISS', badgeClass: 'grey'
        });
      }

      // Betrayal check: partner bond < -2, villain/schemer archetype
      if (team.fighters.length > 1) {
        const partnerIdx = team.active === 0 ? 1 : 0;
        const partner = team.fighters[partnerIdx];
        if (partner && team.hp[partnerIdx] > 0) {
          const bond = getBond(fighter, partner);
          const a = arch(fighter);
          const canBetray = VILLAIN_ARCHS.has(a) || (
            !NICE_ARCHS.has(a) && fs.strategic >= 6 && fs.loyalty <= 4
          );
          if (bond < -2 && canBetray && Math.random() < 0.20) {
            team.hp[partnerIdx] -= 20;
            addBond(fighter, partner, -3);
            popDelta(fighter, -2);
            roundData.events.push({
              type: 'betrayal', betrayer: fighter, victim: partner, round: round + 1,
              text: pick(WRESTLE_BETRAYAL)(fighter, partner),
              badge: 'BETRAYAL', badgeClass: 'red'
            });
            // Camp event
            const evtKey = isMerged ? (gs.mergeName || 'merge') : (team.tribeName || gs.mergeName || 'merge');
            if (!ep.campEvents[evtKey]) ep.campEvents[evtKey] = { pre: [], post: [] };
            ep.campEvents[evtKey].post.push({
              type: 'greeces-pieces-betrayal',
              players: [fighter, partner],
              badgeText: 'Betrayal',
              badgeClass: 'badge-red',
              text: `${fighter} turned on ${partner} during the wrestling match!`
            });
          }
        }
      }

      // Villain throw partner at opponent (15%)
      if (team.fighters.length > 1 && VILLAIN_ARCHS.has(arch(fighter))) {
        const partnerIdx = team.active === 0 ? 1 : 0;
        const partner = team.fighters[partnerIdx];
        if (partner && team.hp[partnerIdx] > 0 && Math.random() < 0.15) {
          team.hp[partnerIdx] -= 20;
          oppTeam.hp[oppTeam.active] -= 10;
          popDelta(fighter, -1);
          addBond(fighter, partner, -2);
          roundData.events.push({
            type: 'throw-partner', thrower: fighter, partner, target: opponent, round: round + 1,
            text: `${fighter} grabs ${partner} and hurls ${pronouns(partner).obj} at ${opponent}! Both go down!`,
            badge: 'DIRTY MOVE', badgeClass: 'red'
          });
        }
      }
    }

    // Check KOs and tag-outs
    for (const ti of teamIndices) {
      if (!alive.has(ti)) continue;
      const team = teams[ti];
      const activeIdx = team.active;
      const fighter = team.fighters[activeIdx];
      if (!fighter) continue;

      if (team.hp[activeIdx] <= 0) {
        // KO
        ep.chalMemberScores[fighter] = (ep.chalMemberScores[fighter] || 0) - 1;
        wrestling.knockouts.push({ player: fighter, round: round + 1 });

        // Find who last hit this fighter for KO text
        const lastHit = roundData.events.filter(e =>
          (e.type === 'hit' || e.type === 'flashy-hit') && e.defender === fighter
        );
        const koPair = lastHit.length > 0 ? lastHit[lastHit.length - 1].attacker : 'the opponent';
        roundData.events.push({
          type: 'ko', eliminated: fighter, by: koPair, round: round + 1,
          text: pick(WRESTLE_KO)(koPair, fighter),
          badge: 'KO', badgeClass: 'red'
        });

        if (typeof koPair === 'string' && koPair !== 'the opponent') {
          ep.chalMemberScores[koPair] = (ep.chalMemberScores[koPair] || 0) + 3;
          popDelta(koPair, 1);
        }

        // Can tag partner?
        const partnerIdx = activeIdx === 0 ? 1 : 0;
        if (team.fighters.length > 1 && team.hp[partnerIdx] > 0 && team.tags > 0) {
          team.tags--;
          team.active = partnerIdx;
          const partner = team.fighters[partnerIdx];
          roundData.events.push({
            type: 'tag-in', out: fighter, into: partner, round: round + 1,
            text: pick(WRESTLE_TAG_IN)(fighter, partner),
            badge: 'TAG IN', badgeClass: 'blue'
          });
        } else {
          // Team eliminated
          alive.delete(ti);
        }
      } else if (team.hp[activeIdx] < 30 && team.fighters.length > 1 && team.tags > 0) {
        // Low HP — might tag out
        const partnerIdx = activeIdx === 0 ? 1 : 0;
        if (team.hp[partnerIdx] > 0 && Math.random() < 0.50) {
          team.tags--;
          team.active = partnerIdx;
          const partner = team.fighters[partnerIdx];
          roundData.events.push({
            type: 'tag-in', out: fighter, into: partner, round: round + 1,
            text: pick(WRESTLE_TAG_IN)(fighter, partner),
            badge: 'TAG IN', badgeClass: 'blue'
          });
        }
      }
    }

    wrestling.rounds.push(roundData);
  }

  // Determine winner
  const survivors = [...alive];
  if (survivors.length === 1) {
    const winTeam = teams[survivors[0]];
    const winFighter = winTeam.fighters[winTeam.active];
    wrestling.goldWinner = winFighter;
    ep.chalMemberScores[winFighter] = (ep.chalMemberScores[winFighter] || 0) + 5;
    popDelta(winFighter, 2);

    if (!isMerged) {
      wrestling.goldTribe = winTeam.tribeName;
    } else {
      // Post-merge: for 1v1 final if bracket, the winner of the last standing team gets gold
      // Award both fighters in winning team
      winTeam.fighters.forEach(f => {
        ep.chalMemberScores[f] = (ep.chalMemberScores[f] || 0) + 2;
      });
    }
  } else if (survivors.length > 1) {
    // Multiple survivors — highest remaining HP
    let bestTeamIdx = survivors[0];
    let bestHP = 0;
    survivors.forEach(ti => {
      const t = teams[ti];
      const hp = t.hp[t.active] || 0;
      if (hp > bestHP) { bestHP = hp; bestTeamIdx = ti; }
    });
    const winTeam = teams[bestTeamIdx];
    const winFighter = winTeam.fighters[winTeam.active];
    wrestling.goldWinner = winFighter;
    ep.chalMemberScores[winFighter] = (ep.chalMemberScores[winFighter] || 0) + 5;
    popDelta(winFighter, 2);
    if (!isMerged) wrestling.goldTribe = winTeam.tribeName;
  } else {
    // All eliminated — last KO'd fighter gets gold by default
    const lastKO = wrestling.knockouts[wrestling.knockouts.length - 1];
    wrestling.goldWinner = lastKO ? lastKO.player : active[0];
    ep.chalMemberScores[wrestling.goldWinner] = (ep.chalMemberScores[wrestling.goldWinner] || 0) + 5;
    if (!isMerged && tribeData) {
      for (const t of tribeData) {
        if (t.members.includes(wrestling.goldWinner)) {
          wrestling.goldTribe = t.tribeName;
          break;
        }
      }
    }
  }

  wrestling.teams = teams.map(t => ({
    tribeName: t.tribeName,
    fighters: [...t.fighters],
    finalHP: [...t.hp],
    tagsUsed: 2 - t.tags
  }));

  // Social events between wrestlers
  const allFighters = teams.flatMap(t => t.fighters);
  for (let i = 0; i < allFighters.length; i++) {
    for (let j = i + 1; j < allFighters.length; j++) {
      if (Math.random() < 0.25) {
        const a = allFighters[i], b = allFighters[j];
        const bond = getBond(a, b);
        if (bond < -2) {
          addBond(a, b, -1);
          wrestling.matches.push({
            type: 'social-confrontation', players: [a, b],
            text: pick(SOCIAL_CONFRONTATION)(a, b),
            badge: 'CONFRONTATION', badgeClass: 'red'
          });
        } else {
          addBond(a, b, 1);
          wrestling.matches.push({
            type: 'social-respect', players: [a, b],
            text: pick(SOCIAL_RESPECT)(a, b),
            badge: 'RESPECT', badgeClass: 'green'
          });
        }
      }
    }
  }

  // Camp event for wrestling gold
  const evtKey = isMerged ? (gs.mergeName || 'merge') : wrestling.goldTribe;
  if (evtKey) {
    if (!ep.campEvents[evtKey]) ep.campEvents[evtKey] = { pre: [], post: [] };
    ep.campEvents[evtKey].post.push({
      type: 'greeces-pieces-wrestling-gold',
      players: [wrestling.goldWinner],
      badgeText: 'Wrestling Gold',
      badgeClass: 'badge-gold',
      text: `${wrestling.goldWinner} dominated the wrestling event and claimed gold!`
    });
  }

  return wrestling;
}


// ══════════════════════════════════════════════════════════════════════
// PHASE 3: HURDLES RACE
// ══════════════════════════════════════════════════════════════════════
function _simulateHurdles(active, ep, tribeData) {
  const isMerged = gs.isMerged;
  const hurdles = { runners: [], segments: [], goldWinner: null, goldTribe: null, wipeouts: [], showoffs: [] };
  const SEGMENTS = 6;
  const times = {};
  active.forEach(n => { times[n] = 0; });

  // Track lead for showoff decisions
  const segmentData = [];

  for (let seg = 0; seg < SEGMENTS; seg++) {
    const segEvents = { segment: seg + 1, events: [] };
    const currentLead = active.slice().sort((a, b) => (times[a] || 0) - (times[b] || 0))[0];

    active.forEach(name => {
      const s = pStats(name);
      const pr = pronouns(name);

      // Decide: showoff or safe
      const inLead = name === currentLead;
      let doShowoff = false;
      if (s.boldness >= 7) doShowoff = true;
      else if (inLead && Math.random() < 0.3) doShowoff = true;
      else if (s.boldness * 0.1 > Math.random()) doShowoff = true;

      if (doShowoff) {
        // Showoff attempt
        const successRoll = s.physical * 0.08 + s.boldness * 0.06 + noise(2.5);
        if (successRoll > 0.5) {
          // Success
          const time = 1.5 + (10 - s.boldness) * 0.1 + noise(0.5);
          times[name] += Math.max(0.5, time);
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 3;
          popDelta(name, 1);
          segEvents.events.push({
            type: 'showoff-success', player: name, segment: seg + 1, time: Math.max(0.5, time),
            text: pick(HURDLE_SHOWOFF_SUCCESS)(name, pr),
            badge: 'SHOWOFF', badgeClass: 'gold'
          });
          hurdles.showoffs.push({ player: name, segment: seg + 1, success: true });
        } else {
          // Wipeout
          let time = 4.0 + noise(1.0);
          if (seg === SEGMENTS - 1) time += 2.0; // last-segment penalty
          times[name] += Math.max(1.0, time);
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) - 2;
          popDelta(name, -1);
          segEvents.events.push({
            type: 'showoff-wipeout', player: name, segment: seg + 1, time: Math.max(1.0, time),
            text: pick(HURDLE_SHOWOFF_WIPEOUT)(name, pr),
            badge: 'WIPEOUT', badgeClass: 'red'
          });
          hurdles.wipeouts.push({ player: name, segment: seg + 1 });
        }
      } else {
        // Run safe
        const time = 2.0 + (10 - s.physical) * 0.15 + noise(0.5);
        times[name] += Math.max(0.5, time);
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
        segEvents.events.push({
          type: 'run-safe', player: name, segment: seg + 1, time: Math.max(0.5, time),
          text: pick(HURDLE_RUN_SAFE)(name, pr),
          badge: 'CLEAN', badgeClass: 'green'
        });
      }
    });

    segmentData.push(segEvents);
  }

  hurdles.segments = segmentData;
  hurdles.times = { ...times };

  // Determine gold winner — fastest overall
  const ranked = active.slice().sort((a, b) => (times[a] || 999) - (times[b] || 999));
  hurdles.goldWinner = ranked[0];
  ep.chalMemberScores[ranked[0]] = (ep.chalMemberScores[ranked[0]] || 0) + 5;
  popDelta(ranked[0], 2);
  hurdles.runners = ranked.map(n => ({ name: n, time: times[n] }));

  if (!isMerged && tribeData) {
    // Gold goes to the tribe of the fastest player
    for (const t of tribeData) {
      if (t.members.includes(hurdles.goldWinner)) {
        hurdles.goldTribe = t.tribeName;
        break;
      }
    }
  }

  // Camp event for hurdles gold
  const evtKey = isMerged ? (gs.mergeName || 'merge') : hurdles.goldTribe;
  if (evtKey) {
    if (!ep.campEvents[evtKey]) ep.campEvents[evtKey] = { pre: [], post: [] };
    ep.campEvents[evtKey].post.push({
      type: 'greeces-pieces-hurdles-gold',
      players: [hurdles.goldWinner],
      badgeText: 'Hurdles Gold',
      badgeClass: 'badge-gold',
      text: `${hurdles.goldWinner} blazed through the hurdles and claimed gold!`
    });
  }

  return hurdles;
}


// ══════════════════════════════════════════════════════════════════════
// PHASE 4: ICARUS TIEBREAKER (conditional)
// ══════════════════════════════════════════════════════════════════════
function _simulateIcarus(contenders, ep) {
  const icarus = { rounds: [], winner: null, participants: [...contenders] };
  const MAX_ROUNDS = 6;
  const MEDAL_ALTITUDE = 5.0;

  const state = {};
  contenders.forEach(n => {
    state[n] = { altitude: 0, integrity: 100, alive: true };
  });

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const roundData = { round: round + 1, events: [] };
    let medalClaimed = false;

    contenders.forEach(name => {
      if (!state[name].alive || medalClaimed) return;
      const s = pStats(name);
      const pr = pronouns(name);

      // Fly higher
      const gain = s.physical * 0.08 + s.boldness * 0.06 + noise(2.5);
      state[name].altitude += Math.max(0, gain);

      // Wing degradation — heavier = more melt
      const melt = 15 + s.physical * 2 + noise(5);
      state[name].integrity -= Math.max(5, melt);
      state[name].integrity = Math.max(0, state[name].integrity);

      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;

      // Flight text
      roundData.events.push({
        type: 'flight', player: name, round: round + 1,
        altitude: state[name].altitude,
        integrity: Math.round(state[name].integrity),
        text: pick(ICARUS_FLIGHT)(name, pr, state[name].altitude),
        badge: 'FLYING', badgeClass: 'blue'
      });

      // Melt text
      if (state[name].integrity < 60) {
        roundData.events.push({
          type: 'melt', player: name, round: round + 1,
          integrity: Math.round(state[name].integrity),
          text: pick(ICARUS_MELT)(name, pr, Math.round(state[name].integrity)),
          badge: 'MELTING', badgeClass: 'orange'
        });
      }

      // Check medal reach
      if (state[name].altitude >= MEDAL_ALTITUDE && state[name].integrity > 0) {
        medalClaimed = true;
        icarus.winner = name;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 8;
        popDelta(name, 3);
        roundData.events.push({
          type: 'medal-grab', player: name, round: round + 1,
          text: pick(ICARUS_MEDAL_GRAB)(name, pr),
          badge: 'GOLD MEDAL', badgeClass: 'gold'
        });
      }

      // Wing collapse
      if (state[name].integrity <= 0 && state[name].alive) {
        state[name].alive = false;
        popDelta(name, -1);
        roundData.events.push({
          type: 'collapse', player: name, round: round + 1,
          text: pick(ICARUS_COLLAPSE)(name, pr),
          badge: 'WINGS COLLAPSED', badgeClass: 'red'
        });
      }
    });

    icarus.rounds.push(roundData);

    if (medalClaimed) break;

    // Check if all fallen
    const aliveCount = contenders.filter(n => state[n]?.alive).length;
    if (aliveCount === 0) {
      // Last one standing (highest altitude)
      const best = contenders.slice().sort((a, b) => (state[b]?.altitude || 0) - (state[a]?.altitude || 0))[0];
      icarus.winner = best;
      ep.chalMemberScores[best] = (ep.chalMemberScores[best] || 0) + 8;
      popDelta(best, 2);
      break;
    }
  }

  // If no winner after all rounds, highest altitude wins
  if (!icarus.winner) {
    const best = contenders.slice().sort((a, b) => (state[b]?.altitude || 0) - (state[a]?.altitude || 0))[0];
    icarus.winner = best;
    ep.chalMemberScores[best] = (ep.chalMemberScores[best] || 0) + 8;
    popDelta(best, 2);
  }

  icarus.state = {};
  contenders.forEach(n => {
    icarus.state[n] = { altitude: state[n].altitude, integrity: Math.round(state[n].integrity), alive: state[n].alive };
  });

  return icarus;
}


// ══════════════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ══════════════════════════════════════════════════════════════════════
export function simulateGreecesPieces(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const isMerged = gs.isMerged;
  const campKey = isMerged ? (gs.mergeName || 'merge') : null;

  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const tribeData = !isMerged
    ? gs.tribes.map(t => ({ tribeName: t.name, members: t.members.filter(m => active.includes(m)) }))
    : null;

  // Pre-merge: set up per-tribe camp event keys
  if (!isMerged && tribeData) {
    tribeData.forEach(t => {
      if (!ep.campEvents[t.tribeName]) ep.campEvents[t.tribeName] = { pre: [], post: [] };
    });
  } else {
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  }

  // Store tribe membership for VP replay (gs.tribes is stale during replay)
  const tribeMap = {};
  const tribeNames = [];
  const tribeColorMap = {};
  if (!isMerged && tribeData) {
    tribeData.forEach(t => {
      tribeNames.push(t.tribeName);
      t.members.forEach(m => { tribeMap[m] = t.tribeName; });
    });
    gs.tribes.forEach(t => {
      if (t.color) tribeColorMap[t.name] = t.color;
    });
  }

  const result = {
    maze: null,
    wrestling: null,
    hurdles: null,
    icarus: null,
    golds: {},
    socialEvents: [],
    isMerged,
    active: [...active],
    hostCommentary: [],
    tribeMap,
    tribeNames,
    tribeColorMap,
  };

  // ── Phase 1: Pillar Maze ──
  result.maze = _simulateMaze(active, ep, tribeData);
  result.hostCommentary.push(pick(HOST_BETWEEN_EVENTS)());

  // ── Phase 2: Wrestling ──
  result.wrestling = _simulateWrestling(active, ep, tribeData);
  result.hostCommentary.push(pick(HOST_BETWEEN_EVENTS)());

  // ── Phase 3: Hurdles ──
  result.hurdles = _simulateHurdles(active, ep, tribeData);

  // ── Count golds ──
  if (isMerged) {
    // Individual golds
    [result.maze, result.wrestling, result.hurdles].forEach(phase => {
      if (phase && phase.goldWinner) {
        result.golds[phase.goldWinner] = (result.golds[phase.goldWinner] || 0) + 1;
      }
    });
  } else {
    // Tribe golds
    [result.maze, result.wrestling, result.hurdles].forEach(phase => {
      if (phase && phase.goldTribe) {
        result.golds[phase.goldTribe] = (result.golds[phase.goldTribe] || 0) + 1;
      }
    });
  }

  // ── Icarus Tiebreaker ──
  if (isMerged) {
    // Check tie for most golds among players
    const maxGolds = Math.max(0, ...Object.values(result.golds));
    const tiedPlayers = Object.entries(result.golds).filter(([, g]) => g === maxGolds).map(([n]) => n);
    // Also include players with 0 golds if maxGolds is 0 (three different winners = all tied at 0-1)
    if (tiedPlayers.length > 1 || maxGolds === 0) {
      // If maxGolds === 0 all players are tied, pick top by score
      const contenders = tiedPlayers.length > 1 ? tiedPlayers :
        active.slice().sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)).slice(0, 2);
      if (contenders.length >= 2) {
        result.icarus = _simulateIcarus(contenders, ep);
        result.golds[result.icarus.winner] = (result.golds[result.icarus.winner] || 0) + 1;
      }
    }
  } else if (tribeData) {
    // Check tie for most golds among tribes
    const maxGolds = Math.max(0, ...Object.values(result.golds));
    const tiedTribes = Object.entries(result.golds).filter(([, g]) => g === maxGolds).map(([n]) => n);
    if (tiedTribes.length > 1) {
      // Each tied tribe sends their best player
      const contenders = tiedTribes.map(tribeName => {
        const tMembers = tribeData.find(t => t.tribeName === tribeName)?.members || [];
        return tMembers.sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0))[0];
      }).filter(Boolean);

      if (contenders.length >= 2) {
        result.icarus = _simulateIcarus(contenders, ep);
        // Map winner back to tribe
        const winnerTribe = tribeData.find(t => t.members.includes(result.icarus.winner))?.tribeName;
        if (winnerTribe) {
          result.golds[winnerTribe] = (result.golds[winnerTribe] || 0) + 1;
        }
      }
    }
  }

  // ── Determine overall winner ──
  if (isMerged) {
    // Post-merge: player with most golds wins. Tiebreak by chalMemberScores.
    const playerGolds = {};
    active.forEach(n => { playerGolds[n] = result.golds[n] || 0; });
    const ranked = active.slice().sort((a, b) => {
      const gDiff = (playerGolds[b] || 0) - (playerGolds[a] || 0);
      if (gDiff !== 0) return gDiff;
      return (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0);
    });
    result.overallWinner = ranked[0];

    ep.immunityWinner = result.overallWinner;
    ep.tribalPlayers = active;

    // Massive chalMemberScores bonus for winner
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== result.overallWinner).map(([, s]) => s));
    ep.chalMemberScores[result.overallWinner] = Math.max(
      ep.chalMemberScores[result.overallWinner] || 0, maxOther
    ) + active.length + 5;

  } else {
    // Pre-merge: tribe with most golds wins. Tiebreak by avg chalMemberScores.
    const tribeRankings = tribeData.map(t => {
      const goldCount = result.golds[t.tribeName] || 0;
      const avg = t.members.length > 0
        ? t.members.reduce((sum, n) => sum + (ep.chalMemberScores[n] || 0), 0) / t.members.length
        : 0;
      return { tribeName: t.tribeName, goldCount, avg, members: [...t.members] };
    });

    tribeRankings.sort((a, b) => {
      const gDiff = b.goldCount - a.goldCount;
      if (gDiff !== 0) return gDiff;
      return b.avg - a.avg;
    });

    result.winningTribe = tribeRankings[0].tribeName;
    result.tribeRankings = tribeRankings;

    const lastTribe = tribeRankings[tribeRankings.length - 1];
    // DO NOT set ep.immunityWinner for pre-merge
    ep.tribalPlayers = gs.tribes.find(t => t.name === lastTribe.tribeName)?.members || active;
    ep.winner = gs.tribes.find(t => t.name === tribeRankings[0].tribeName);
    ep.loser = gs.tribes.find(t => t.name === lastTribe.tribeName);
    ep.safeTribes = tribeRankings.slice(1, -1).map(t =>
      gs.tribes.find(gt => gt.name === t.tribeName)
    ).filter(Boolean);
    ep.challengePlacements = tribeRankings.map(t =>
      gs.tribes.find(gt => gt.name === t.tribeName)
    ).filter(Boolean);
  }

  // ── Collect all social events ──
  result.socialEvents = [
    ...(result.maze.socialEvents || []),
    ...(result.wrestling.matches || []),
  ];

  // ── Romance hooks ──
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++) {
    for (let j = i + 1; j < _romActive.length; j++) {
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'olympic ruins');
    }
  }
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'olympic challenge', _romActive);

  // ── Finalize ──
  ep.challengeData = result;
  ep.isGreecesPieces = true;
  ep.challengeType = 'greeces-pieces';
  ep.challengeLabel = "Greece's Pieces";
  ep.challengeCategory = 'mixed';
  ep.chalPlacements = active.slice().sort((a, b) =>
    (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)
  );
  ep.tribalPlayers = ep.tribalPlayers || active;
  updateChalRecord(ep);
  return ep;
}


// ══════════════════════════════════════════════════════════════════════
// VP BUILDER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function _avatar(name) { return `assets/avatars/${_slug(name)}.png`; }
function _icon(type) { return `<span class="gp-icon gp-icon-${type}"></span>`; }
function _pin(name) {
  const tribe = _currentEp ? _tribeForPlayer(name, _currentEp) : null;
  const dot = tribe ? `<span class="gp-pin-tribe-dot" style="background:${_tribeColorFromEp(tribe, _currentEp)}"></span>` : '';
  return `<div class="gp-pin">${dot}<img class="gp-pin-avatar" src="${_avatar(name)}" alt=""><span class="gp-pin-name">${name}</span></div>`;
}

function _tribeForPlayer(name, ep) {
  const data = ep.challengeData;
  if (data.isMerged) return null;
  if (data.tribeMap && data.tribeMap[name]) return data.tribeMap[name];
  if (!gs.tribes) return null;
  for (const t of gs.tribes) {
    if (t.members && t.members.includes(name)) return t.name;
  }
  return null;
}

// ── Laurel SVG snippets ──
const _laurelSmall = `<svg class="gp-title-laurel-svg" viewBox="0 0 36 36">
  <path d="M18 34 C12 28,4 24,4 14 C4 8,8 4,14 6 C16 7,17 9,18 12" fill="none" stroke="#8a6c38" stroke-width="1.5"/>
  <ellipse cx="10" cy="10" rx="4" ry="7" fill="none" stroke="#6b7c3c" stroke-width="1" transform="rotate(-20,10,10)"/>
  <ellipse cx="8" cy="16" rx="3.5" ry="6" fill="none" stroke="#6b7c3c" stroke-width="1" transform="rotate(-10,8,16)"/>
  <ellipse cx="10" cy="22" rx="3" ry="5.5" fill="none" stroke="#6b7c3c" stroke-width="1" transform="rotate(0,10,22)"/>
  <ellipse cx="13" cy="27" rx="3" ry="5" fill="none" stroke="#6b7c3c" stroke-width="1" transform="rotate(10,13,27)"/>
</svg>`;
const _laurelLarge = `<svg class="gp-ts-laurel-svg" viewBox="0 0 56 56">
  <path d="M28 52 C20 44,6 38,6 22 C6 12,12 6,22 9 C25 10,27 14,28 18" fill="none" stroke="#6b7c3c" stroke-width="1.5"/>
  <ellipse cx="14" cy="14" rx="5" ry="9" fill="none" stroke="#6b7c3c" stroke-width="1.2" transform="rotate(-20,14,14)"/>
  <ellipse cx="11" cy="23" rx="4.5" ry="8" fill="none" stroke="#6b7c3c" stroke-width="1.2" transform="rotate(-10,11,23)"/>
  <ellipse cx="14" cy="32" rx="4" ry="7.5" fill="none" stroke="#6b7c3c" stroke-width="1.2" transform="rotate(0,14,32)"/>
  <ellipse cx="18" cy="40" rx="4" ry="7" fill="none" stroke="#6b7c3c" stroke-width="1.2" transform="rotate(10,18,40)"/>
  <ellipse cx="23" cy="46" rx="3.5" ry="6" fill="none" stroke="#6b7c3c" stroke-width="1" transform="rotate(15,23,46)"/>
</svg>`;

// ── Medal SVG for scoreboard ──
const _medalSVG = `<svg class="gp-sb-medal-lg" viewBox="0 0 38 38">
  <circle cx="19" cy="19" r="16" fill="url(#gp-mgr)" stroke="#8a6c28" stroke-width="2"/>
  <path d="M19 7 L21 14 L28 14 L23 18 L25 25 L19 21 L13 25 L15 18 L10 14 L17 14Z" fill="#8a6c28" opacity=".25"/>
  <defs><radialGradient id="gp-mgr" cx=".35" cy=".35"><stop offset="0%" stop-color="#f0d870"/><stop offset="100%" stop-color="#c9a84c"/></radialGradient></defs>
</svg>`;

// ── Feed card SVG icons ──

// Parthenon silhouette SVG
const _parthenonSVG = `<svg width="280" height="120" viewBox="0 0 280 120" fill="#1a1020">
  <polygon points="20,40 140,8 260,40" fill="#1a1020"/>
  <rect x="15" y="38" width="250" height="8" fill="#1a1020"/>
  <rect x="24" y="46" width="10" height="60" fill="#1a1020" rx="2"/>
  <rect x="52" y="46" width="10" height="60" fill="#1a1020" rx="2"/>
  <rect x="80" y="46" width="10" height="60" fill="#1a1020" rx="2"/>
  <rect x="108" y="46" width="10" height="60" fill="#1a1020" rx="2"/>
  <rect x="136" y="46" width="10" height="60" fill="#1a1020" rx="2"/>
  <rect x="164" y="46" width="10" height="60" fill="#1a1020" rx="2"/>
  <rect x="192" y="46" width="10" height="60" fill="#1a1020" rx="2"/>
  <rect x="220" y="46" width="10" height="60" fill="#1a1020" rx="2"/>
  <rect x="248" y="46" width="10" height="60" fill="#1a1020" rx="2"/>
  <rect x="10" y="104" width="260" height="6" fill="#1a1020"/>
  <rect x="5" y="110" width="270" height="5" fill="#1a1020"/>
  <rect x="0" y="115" width="280" height="5" fill="#1a1020"/>
  <rect x="40" y="50" width="200" height="54" fill="#1a1020" opacity=".4"/>
</svg>`;


// ══════════════════════════════════════════════════════════════════════
// SHELL CSS — inlined in every VP screen
// ══════════════════════════════════════════════════════════════════════
function _gpCSS() {
  return `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');

.gp-shell{max-width:1100px;margin:0 auto;position:relative;min-height:100vh;
  background:#2a2018;border-left:3px solid #6a5030;border-right:3px solid #6a5030;}

/* ATMOSPHERE */
.gp-atmo{position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.gp-atmo-sky{position:absolute;inset:0;
  background:linear-gradient(180deg,#87CEEB 0%,#b8d4e8 30%,#e8c8a0 70%,#d4956a 100%);}
.gp-atmo-ruins{position:absolute;bottom:0;left:0;right:0;height:40%;
  background:linear-gradient(0deg,#c4a06a 0%,#d4b07a 20%,transparent 100%);}
.gp-atmo-columns{position:absolute;bottom:15%;left:5%;width:12%;height:35%;
  border:4px solid #b8a080;border-bottom:none;background:linear-gradient(90deg,#e8dcc8,#d4c8b0,#e8dcc8);opacity:.3;}
.gp-atmo-columns2{position:absolute;bottom:15%;right:8%;width:8%;height:28%;
  border:4px solid #b8a080;border-bottom:none;background:linear-gradient(90deg,#e8dcc8,#d4c8b0);opacity:.25;}
.gp-atmo-sun{position:absolute;top:8%;right:15%;width:80px;height:80px;border-radius:50%;
  background:radial-gradient(circle,#fff8e0 0%,#f0d870 40%,rgba(240,216,112,0) 70%);
  box-shadow:0 0 60px 30px rgba(240,216,112,.3);opacity:.6;}
@keyframes gp-feather-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:0}10%{opacity:.25}90%{opacity:.2}100%{transform:translateY(100vh) rotate(360deg);opacity:0}}
.gp-feather{position:absolute;width:8px;height:16px;background:linear-gradient(135deg,#d4a844,#c49838);
  border-radius:50% 50% 50% 0;opacity:0;animation:gp-feather-fall linear infinite;}
.gp-feather:nth-child(1){left:10%;animation-duration:12s;animation-delay:0s;}
.gp-feather:nth-child(2){left:30%;animation-duration:15s;animation-delay:3s;width:6px;height:12px;}
.gp-feather:nth-child(3){left:55%;animation-duration:18s;animation-delay:6s;}
.gp-feather:nth-child(4){left:75%;animation-duration:14s;animation-delay:9s;width:10px;height:18px;}
.gp-feather:nth-child(5){left:90%;animation-duration:16s;animation-delay:2s;width:5px;height:10px;}
@media(prefers-reduced-motion:reduce){.gp-feather{animation:none;}}

/* MARBLE TEXTURE */
.gp-marble{
  background:
    linear-gradient(125deg, transparent 18%, rgba(160,140,110,.18) 20%, rgba(150,130,100,.12) 22%, transparent 25%),
    linear-gradient(245deg, transparent 30%, rgba(140,120,90,.15) 33%, rgba(130,110,80,.08) 36%, transparent 39%),
    linear-gradient(170deg, transparent 45%, rgba(170,150,120,.16) 48%, rgba(160,140,110,.10) 51%, transparent 54%),
    linear-gradient(300deg, transparent 60%, rgba(155,135,105,.14) 63%, rgba(145,125,95,.08) 66%, transparent 69%),
    linear-gradient(80deg, transparent 10%, rgba(175,155,125,.10) 15%, transparent 20%),
    linear-gradient(200deg, transparent 70%, rgba(165,145,115,.12) 75%, transparent 80%),
    linear-gradient(180deg,#e8dfd0 0%,#ddd4c4 15%,#e4dbd0 30%,#d5cbb8 50%,#e0d8c8 70%,#d8cfbf 85%,#dbd2c4 100%);
  position:relative;}
.gp-marble::before{content:'';position:absolute;inset:0;
  background:
    radial-gradient(ellipse at 15% 25%, rgba(190,170,140,.2) 0%, transparent 45%),
    radial-gradient(ellipse at 65% 55%, rgba(180,160,130,.18) 0%, transparent 35%),
    radial-gradient(ellipse at 35% 75%, rgba(185,165,135,.15) 0%, transparent 40%),
    radial-gradient(ellipse at 80% 20%, rgba(195,175,145,.12) 0%, transparent 30%),
    radial-gradient(ellipse at 50% 50%, rgba(170,150,120,.08) 0%, transparent 60%);
  pointer-events:none;z-index:0;}
.gp-marble::after{content:'';position:absolute;inset:0;
  background:
    linear-gradient(140deg, transparent 25%, rgba(120,100,70,.06) 26%, transparent 27%),
    linear-gradient(140deg, transparent 55%, rgba(120,100,70,.05) 56%, transparent 57%),
    linear-gradient(140deg, transparent 75%, rgba(120,100,70,.04) 76%, transparent 77%),
    linear-gradient(320deg, transparent 35%, rgba(130,110,80,.05) 36%, transparent 37%),
    linear-gradient(320deg, transparent 65%, rgba(130,110,80,.04) 66%, transparent 67%);
  pointer-events:none;z-index:0;}

/* BRONZE FRAME */
.gp-frame{border:3px solid #8a6c38;box-shadow:inset 0 0 0 1px #a88850,inset 0 0 0 2px rgba(0,0,0,.2),
  0 2px 8px rgba(0,0,0,.4);position:relative;}

/* TITLE BANNER */
.gp-title-banner{
  background:linear-gradient(180deg,#3a2a14 0%,#2a1c0e 40%,#1e1408 100%);
  border-bottom:4px solid #a88850;
  padding:18px 24px 14px;text-align:center;position:relative;z-index:2;
  box-shadow:0 4px 20px rgba(0,0,0,.6);}
.gp-title-banner::before,.gp-title-banner::after{content:'';position:absolute;top:0;bottom:0;width:50px;
  background:repeating-linear-gradient(0deg,transparent 0px,transparent 4px,rgba(168,136,80,.15) 4px,rgba(168,136,80,.15) 5px);}
.gp-title-banner::before{left:0;}
.gp-title-banner::after{right:0;}
.gp-title-main{font-family:'Cinzel',serif;font-weight:900;font-size:28px;color:#d4a844;
  letter-spacing:6px;text-transform:uppercase;
  text-shadow:0 2px 4px rgba(0,0,0,.6),0 0 30px rgba(212,168,68,.2);}
.gp-title-sub{font-family:'Cinzel',serif;font-size:12px;color:#a08850;letter-spacing:8px;
  text-transform:uppercase;margin-top:4px;}
.gp-greek-key{height:14px;margin-top:10px;
  background:
    repeating-linear-gradient(90deg,
      #a88850 0px,#a88850 4px,transparent 4px,transparent 6px,
      #a88850 6px,#a88850 10px,transparent 10px,transparent 12px,
      #a88850 12px,#a88850 14px,transparent 14px,transparent 20px);
  opacity:.35;}
.gp-title-laurels{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:6px;}
.gp-title-laurel-svg{width:36px;height:36px;opacity:.5;}

/* MEDAL SCOREBOARD */
.gp-scoreboard{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;
  padding:10px 16px;
  background:linear-gradient(180deg,#4a3520 0%,#3a2818 100%);
  border-bottom:3px solid #8a6c38;box-shadow:0 3px 12px rgba(0,0,0,.4);}
.gp-sb-tribe{display:flex;align-items:center;gap:10px;flex:1;}
.gp-sb-tribe-left{justify-content:flex-end;}
.gp-sb-tribe-right{justify-content:flex-start;}
.gp-sb-tribe-name{font-family:'Cinzel',serif;font-weight:700;font-size:13px;color:#d4c8a8;letter-spacing:2px;text-transform:uppercase;}
.gp-sb-medals{display:flex;gap:4px;}
.gp-sb-medal{width:20px;height:20px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,#f0d870,#c9a84c,#a08030);
  border:2px solid #8a6c28;box-shadow:0 2px 4px rgba(0,0,0,.4);}
.gp-sb-medal-empty{background:radial-gradient(circle at 35% 35%,#5a5040,#3a3028);
  border-color:#4a4030;opacity:.5;box-shadow:none;}
.gp-sb-medal-count{font-family:'Cinzel',serif;font-weight:900;font-size:28px;color:#d4a844;
  text-shadow:0 2px 6px rgba(0,0,0,.4);}
.gp-sb-center{display:flex;flex-direction:column;align-items:center;gap:2px;padding:0 20px;}
.gp-sb-vs{font-family:'Cinzel',serif;font-size:11px;color:#8a7850;letter-spacing:4px;text-transform:uppercase;}
.gp-sb-status{font-family:'Cinzel',serif;font-size:11px;color:#6a5a3a;letter-spacing:2px;text-transform:uppercase;}
.gp-sb-medal-lg{width:38px;height:38px;}
.gp-tribe-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:16px;border:2px solid #8a6c38;}

/* 3-COLUMN LAYOUT */
.gp-layout{display:flex;position:relative;z-index:1;}

/* Main column — full width, no left sidebar */
.gp-main-col{flex:1;min-width:0;padding:16px 24px 80px;position:relative;z-index:1;}

/* Right sidebar */
.gp-sidebar-right{width:260px;flex-shrink:0;position:sticky;top:50px;align-self:flex-start;
  background:linear-gradient(180deg,#2a2018 0%,#241c14 100%);
  border-left:3px solid #6a5030;
  padding:0;overflow-y:auto;max-height:calc(100vh - 60px);}
.gp-right-header{font-family:'Cinzel',serif;font-weight:700;font-size:11px;color:#a08850;
  letter-spacing:3px;text-transform:uppercase;padding:10px 12px 6px;
  border-bottom:2px solid #5a4828;text-align:center;}

/* CONTESTANTS GRID */
.gp-contestants{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:8px;}
.gp-contestant{display:flex;flex-direction:column;align-items:center;padding:6px 2px;
  border:1px solid #4a3828;border-radius:2px;
  background:linear-gradient(180deg,#3a3020 0%,#2e2418 100%);}
.gp-contestant img{width:36px;height:36px;border-radius:50%;border:2px solid #8a6c38;
  object-fit:cover;box-shadow:0 2px 4px rgba(0,0,0,.4);}
.gp-contestant-name{font-family:'Cinzel',serif;font-size:8px;font-weight:700;color:#d4c8a8;
  letter-spacing:.5px;margin-top:3px;text-align:center;}
.gp-contestant-tribe{font-family:'Cinzel',serif;font-size:7px;color:#8a7850;letter-spacing:1px;text-transform:uppercase;}
.gp-contestant-gold{position:relative;}
.gp-contestant-gold::after{content:'';position:absolute;top:0;right:calc(50% - 22px);width:10px;height:10px;
  border-radius:50%;background:radial-gradient(circle at 35% 35%,#f0d870,#c9a84c);
  border:1.5px solid #8a6c28;box-shadow:0 1px 3px rgba(0,0,0,.3);}

/* CURRENT MATCHUP */
.gp-matchup-box{margin:6px 8px;padding:10px;
  border:2px solid #5a4828;border-radius:2px;
  background:linear-gradient(135deg,#3a3020 0%,#2e2418 100%);}
.gp-matchup-event{font-family:'Cinzel',serif;font-size:8px;color:#8a7850;text-align:center;
  letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
.gp-matchup-vs{display:flex;align-items:center;justify-content:center;gap:10px;}
.gp-matchup-player{text-align:center;}
.gp-matchup-player img{width:38px;height:38px;border-radius:50%;border:2px solid #8a6c38;
  object-fit:cover;box-shadow:0 2px 6px rgba(0,0,0,.4);}
.gp-matchup-player-name{font-family:'Cinzel',serif;font-size:11px;font-weight:700;color:#d4c8a8;margin-top:3px;}
.gp-matchup-label{font-family:'Cinzel',serif;font-weight:900;font-size:18px;color:#d4a844;
  text-shadow:0 2px 8px rgba(212,168,68,.4);}

/* EVENT RESULTS */
.gp-results-list{padding:6px 8px;}
.gp-result-row{display:flex;align-items:center;gap:6px;padding:6px 8px;margin:3px 0;
  border:1px solid #4a3828;border-radius:2px;
  background:linear-gradient(135deg,#3a3020 0%,#2e2418 100%);}
.gp-result-num{font-family:'Cinzel',serif;font-weight:900;font-size:11px;color:#d4a844;width:14px;flex-shrink:0;}
.gp-result-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.gp-result-dot-maze{background:#6b7c3c;}
.gp-result-dot-wrestle{background:#b85c38;}
.gp-result-dot-hurdle{background:#4a7ab8;}
.gp-result-dot-icarus{background:#c9a84c;}
.gp-result-info{flex:1;min-width:0;}
.gp-result-event{font-family:'Cinzel',serif;font-size:11px;font-weight:700;color:#a09070;letter-spacing:1px;text-transform:uppercase;}
.gp-result-winner{font-family:'Crimson Text',serif;font-size:12px;color:#d4c8a8;}
.gp-result-pending{font-family:'Crimson Text',serif;font-size:12px;color:#6a5a3a;font-style:italic;}

/* PERFORMANCE LEADERBOARD */
.gp-leaderboard{padding:4px 8px 8px;}
.gp-lb-row{display:flex;align-items:center;gap:6px;padding:5px 6px;margin:2px 0;
  border-bottom:1px solid rgba(90,72,40,.3);}
.gp-lb-rank{font-family:'Cinzel',serif;font-weight:900;font-size:11px;color:#8a7850;width:14px;text-align:center;}
.gp-lb-rank-1{color:#d4a844;}
.gp-lb-rank-2{color:#b0a080;}
.gp-lb-rank-3{color:#8a6c38;}
.gp-lb-avatar{width:22px;height:22px;border-radius:50%;border:1.5px solid #6a5030;
  object-fit:cover;flex-shrink:0;}
.gp-lb-name{font-family:'Cinzel',serif;font-size:12px;color:#d4c8a8;flex:1;letter-spacing:.5px;}
.gp-lb-golds{display:flex;gap:2px;flex-shrink:0;}
.gp-lb-gold-dot{width:8px;height:8px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,#f0d870,#c9a84c);border:1px solid #8a6c28;}
.gp-lb-score{font-family:'Cinzel',serif;font-size:12px;font-weight:700;color:#d4a844;width:32px;text-align:right;}

/* EVENT BANNER */
.gp-event-banner{position:relative;margin:16px 0 10px;padding:12px 20px;text-align:center;
  background:linear-gradient(180deg,#3a2a14 0%,#2a1c0e 100%);
  border:2px solid #8a6c38;border-radius:2px;
  box-shadow:0 4px 16px rgba(0,0,0,.4);}
.gp-event-banner::before,.gp-event-banner::after{content:'';position:absolute;top:50%;width:20px;height:34px;
  border:2px solid #8a6c38;border-radius:50%;opacity:.25;transform:translateY(-50%);}
.gp-event-banner::before{left:10px;border-right:none;}
.gp-event-banner::after{right:10px;border-left:none;}
.gp-event-banner-num{font-family:'Cinzel',serif;font-size:11px;color:#8a7850;letter-spacing:4px;text-transform:uppercase;}
.gp-event-banner-title{font-family:'Cinzel',serif;font-weight:900;font-size:17px;color:#d4a844;
  letter-spacing:2px;text-transform:uppercase;margin-top:2px;}
.gp-event-banner-desc{font-family:'Crimson Text',serif;font-size:14px;color:#a09070;margin-top:4px;font-style:italic;}

/* CARDS */
.gp-card{position:relative;margin-bottom:14px;color:#2a1c10;padding:16px 20px;
  border:1px solid #b8a878;border-radius:2px;
  box-shadow:0 2px 8px rgba(0,0,0,.15);transition:opacity .4s,transform .3s;
  background:
    linear-gradient(130deg, transparent 15%, rgba(185,170,140,.06) 17%, transparent 19%),
    linear-gradient(250deg, transparent 40%, rgba(175,160,130,.05) 42%, transparent 44%),
    linear-gradient(180deg,#ece5d6 0%,#e4ddd0 30%,#e8e0d4 60%,#e0d9cc 100%);}
.gp-card::before{content:'';position:absolute;inset:0;border-radius:2px;
  background:radial-gradient(ellipse at 30% 20%, rgba(200,190,170,.1) 0%, transparent 50%);
  pointer-events:none;}
.gp-card-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;
  padding-bottom:6px;border-bottom:1px solid rgba(184,168,120,.3);position:relative;z-index:1;}
.gp-card-type{font-family:'Cinzel',serif;font-weight:700;font-size:12px;letter-spacing:1.5px;
  text-transform:uppercase;color:#6a5a40;}
.gp-card-body{font-family:'Crimson Text',serif;font-size:16px;line-height:1.6;color:#3a2a18;position:relative;z-index:1;}
.gp-card-foot{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;position:relative;z-index:1;}

/* Card variants */
.gp-card-maze{border-left:4px solid #6b7c3c;}
.gp-card-wrestle{border-left:4px solid #b85c38;}
.gp-card-hurdle{border-left:4px solid #4a7ab8;}
.gp-card-icarus{border-left:4px solid #c9a84c;
  background:
    linear-gradient(130deg, transparent 15%, rgba(200,185,140,.08) 17%, transparent 19%),
    linear-gradient(180deg,#f0eadc 0%,#ece4d4 30%,#f0e8d8 60%,#e8e0d0 100%);}
.gp-card-social{border-left:4px solid #8a5a8a;border-left-style:dashed;
  background:linear-gradient(180deg,#eae4d8 0%,#e4ded2 100%);}
.gp-card-drama{border-left:4px solid #c02020;
  background:linear-gradient(180deg,#ece2d4 0%,#e8dcd0 100%);}
.gp-card-gold{border:2px solid #c9a84c;
  background:
    linear-gradient(130deg, transparent 10%, rgba(212,168,68,.06) 12%, transparent 14%),
    linear-gradient(180deg,#f4eede 0%,#ece4d0 50%,#e8dcc4 100%);
  box-shadow:0 0 12px rgba(201,168,76,.25);}

/* STAMPS */
.gp-stamp{position:absolute;top:-6px;right:12px;padding:3px 10px;
  font-family:'Cinzel',serif;font-weight:700;font-size:11px;letter-spacing:2px;
  text-transform:uppercase;border-radius:1px;transform:rotate(2deg);z-index:2;}
.gp-stamp-gold{background:linear-gradient(135deg,#f0d870,#c9a84c);color:#3a2a18;
  border:1px solid #a08030;box-shadow:0 2px 6px rgba(201,168,76,.4);}
.gp-stamp-ko{background:linear-gradient(135deg,#c02020,#8a1818);color:#fff;
  border:1px solid #6a1010;}
.gp-stamp-wipeout{background:linear-gradient(135deg,#b85c38,#8a4028);color:#fff;
  border:1px solid #6a3018;}
.gp-stamp-event{background:linear-gradient(135deg,#4a7ab8,#3a5a88);color:#fff;
  border:1px solid #2a4a78;}

/* BADGES */
.gp-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;
  font-family:'Cinzel',serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;
  border:1px solid;border-radius:1px;}
.gp-badge-score{background:rgba(201,168,76,.08);color:#8a6c28;border-color:rgba(201,168,76,.25);}
.gp-badge-gold{background:linear-gradient(135deg,rgba(240,216,112,.15),rgba(201,168,76,.1));
  color:#8a6c28;border-color:#c9a84c;font-weight:700;}
.gp-badge-ko{background:rgba(184,92,56,.08);color:#8a4028;border-color:rgba(184,92,56,.25);}
.gp-badge-pop{background:rgba(58,122,58,.08);color:#3a7a3a;border-color:rgba(58,122,58,.2);}
.gp-badge-neg{background:rgba(192,32,32,.06);color:#c02020;border-color:rgba(192,32,32,.12);}
.gp-badge-camp{background:rgba(100,80,140,.06);color:#6a5a8a;border-color:rgba(100,80,140,.15);}

/* PLAYER PIN */
.gp-pin{display:inline-flex;align-items:center;gap:4px;
  padding:2px 6px;border-radius:2px;
  background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.15);}
.gp-pin-avatar{width:18px;height:18px;border-radius:50%;object-fit:cover;
  border:1.5px solid #8a6c38;}
.gp-pin-name{font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:#3a2a18;letter-spacing:.5px;}

/* BOAR THREAT METER */
.gp-boar-meter{display:flex;align-items:center;gap:8px;margin:8px 0;padding:6px 10px;
  background:rgba(184,92,56,.04);border:1px solid rgba(184,92,56,.15);border-radius:2px;}
.gp-boar-label{font-family:'Cinzel',serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#8a4028;}
.gp-boar-bar{flex:1;height:8px;background:#d0c8b8;border-radius:4px;overflow:hidden;}
.gp-boar-fill{height:100%;border-radius:4px;transition:width .5s;}
.gp-boar-fill-low{background:linear-gradient(90deg,#6b7c3c,#8a9c4c);width:20%;}
.gp-boar-fill-mid{background:linear-gradient(90deg,#c9a84c,#d4a030);width:50%;}
.gp-boar-fill-high{background:linear-gradient(90deg,#c05020,#e04030);width:85%;}
.gp-boar-status{font-family:'Crimson Text',serif;font-size:13px;font-style:italic;color:#6a4a28;}

/* WRESTLING HP BARS */
.gp-hp-bar{display:flex;align-items:center;gap:6px;margin:4px 0;}
.gp-hp-name{font-family:'Cinzel',serif;font-size:12px;width:64px;text-align:right;color:#3a2a18;}
.gp-hp-track{flex:1;height:10px;background:#d0c8b8;border-radius:5px;overflow:hidden;border:1px solid #b8a888;}
.gp-hp-fill{height:100%;border-radius:5px;transition:width .4s;}
.gp-hp-full{background:linear-gradient(90deg,#5a9a3a,#6aaa4a);width:100%;}
.gp-hp-mid{background:linear-gradient(90deg,#c9a84c,#d4a030);width:55%;}
.gp-hp-low{background:linear-gradient(90deg,#c05020,#e04030);width:20%;}
.gp-hp-ko{background:#6a6a6a;width:0%;}
.gp-hp-pct{font-family:'Cinzel',serif;font-size:11px;width:30px;color:#6a5a40;}

/* HURDLE TRACK */
.gp-hurdle-track{position:relative;margin:10px 0;padding:8px;}
.gp-hurdle-row{display:flex;align-items:center;gap:4px;margin:4px 0;}
.gp-hurdle-name{font-family:'Cinzel',serif;font-size:12px;width:60px;text-align:right;color:#3a2a18;}
.gp-hurdle-segments{display:flex;gap:2px;flex:1;}
.gp-hurdle-seg{width:14%;height:16px;border-radius:2px;border:1px solid;display:flex;align-items:center;justify-content:center;
  font-family:'Cinzel',serif;font-size:7px;font-weight:700;letter-spacing:.5px;}
.gp-seg-safe{background:#d8e4cc;border-color:#a0b888;color:#5a7a3a;}
.gp-seg-showoff{background:#ece4cc;border-color:#c9a84c;color:#8a6c28;}
.gp-seg-wipe{background:#ecd0c0;border-color:#c05020;color:#8a3018;}
.gp-seg-pending{background:#e0d8cc;border-color:#b8b098;color:#a09880;}
.gp-hurdle-time{font-family:'Cinzel',serif;font-size:12px;width:44px;text-align:right;color:#4a7ab8;font-weight:700;}

/* ICARUS ALTITUDE */
.gp-icarus-alt{position:relative;margin:10px 0;padding:10px;
  background:linear-gradient(180deg,#c8ddf0 0%,#e0ecf4 100%);
  border:1px solid rgba(74,122,184,.2);border-radius:2px;}
.gp-icarus-row{display:flex;align-items:center;gap:8px;margin:6px 0;}
.gp-icarus-name{font-family:'Cinzel',serif;font-size:12px;width:60px;text-align:right;color:#2a3a5c;}
.gp-icarus-bar{flex:1;height:12px;background:linear-gradient(90deg,#d4c8b0 0%,#87CEEB 50%,#5a9ae0 100%);
  border-radius:6px;overflow:hidden;position:relative;border:1px solid #a0b8d0;}
.gp-icarus-fill{position:absolute;left:0;top:0;height:100%;background:linear-gradient(90deg,#c9a84c,#f0d870);
  border-radius:6px;transition:width .4s;}
.gp-icarus-medal{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:10px;height:10px;
  border-radius:50%;background:radial-gradient(circle at 35% 35%,#f0d870,#c9a84c);border:1px solid #8a6c28;}
.gp-icarus-wings{display:flex;gap:2px;width:60px;}
.gp-icarus-wing{height:8px;border-radius:2px;flex:1;}
.gp-wing-ok{background:#c9a84c;}
.gp-wing-melting{background:#d4a030;opacity:.6;}
.gp-wing-gone{background:#8a8070;opacity:.3;}

/* VS CARD */
.gp-vs{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px;margin:8px 0;
  background:linear-gradient(135deg,#3a2a14 0%,#2e2010 100%);border:2px solid #8a6c38;border-radius:2px;}
.gp-vs-player{display:flex;flex-direction:column;align-items:center;gap:4px;}
.gp-vs-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;
  border:2px solid #8a6c38;box-shadow:0 2px 8px rgba(0,0,0,.4);}
.gp-vs-name{font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:#d4a844;letter-spacing:1px;}
.gp-vs-label{font-family:'Cinzel',serif;font-weight:900;font-size:20px;color:#d4a844;
  text-shadow:0 2px 8px rgba(212,168,68,.4);}

/* CSS ICONS */
.gp-icon{display:inline-block;width:16px;height:16px;position:relative;flex-shrink:0;}
.gp-icon-laurel::before,.gp-icon-laurel::after{content:'';position:absolute;width:6px;height:14px;
  border:2px solid #6b7c3c;border-radius:50%;top:1px;}
.gp-icon-laurel::before{left:1px;border-right:none;}
.gp-icon-laurel::after{right:1px;border-left:none;}
.gp-icon-medal{width:14px;height:14px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,#f0d870,#c9a84c);
  border:1.5px solid #8a6c28;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.gp-icon-boar::before,.gp-icon-boar::after{content:'';position:absolute;width:4px;height:10px;
  border:2px solid #8a6040;border-radius:0 0 50% 50%;bottom:2px;}
.gp-icon-boar::before{left:2px;transform:rotate(-15deg);}
.gp-icon-boar::after{right:2px;transform:rotate(15deg);}
.gp-icon-fist::before{content:'';position:absolute;width:10px;height:8px;
  background:#b85c38;border-radius:3px 3px 1px 1px;top:4px;left:3px;}
.gp-icon-fist::after{content:'';position:absolute;width:6px;height:4px;
  background:#d07050;border-radius:2px;top:2px;left:5px;}
.gp-icon-hurdle::before{content:'';position:absolute;width:12px;height:2px;
  background:#4a7ab8;top:5px;left:2px;}
.gp-icon-hurdle::after{content:'';position:absolute;width:2px;height:10px;
  background:#4a7ab8;top:3px;left:3px;box-shadow:10px 0 0 #4a7ab8;}
.gp-icon-wing::before,.gp-icon-wing::after{content:'';position:absolute;
  border:2px solid #c9a84c;border-radius:50%;top:3px;}
.gp-icon-wing::before{left:0;width:7px;height:10px;border-right:none;}
.gp-icon-wing::after{right:0;width:7px;height:10px;border-left:none;}
.gp-icon-social::before{content:'';position:absolute;width:12px;height:8px;
  background:#8a5a8a;border-radius:4px;top:2px;left:2px;}
.gp-icon-social::after{content:'';position:absolute;width:0;height:0;
  border-left:4px solid #8a5a8a;border-bottom:4px solid transparent;bottom:2px;left:4px;}
.gp-icon-column::before{content:'';position:absolute;width:8px;height:12px;
  background:linear-gradient(90deg,#d4c8b0,#e8dcc8,#d4c8b0);
  border:1px solid #b8a890;top:2px;left:4px;}
.gp-icon-column::after{content:'';position:absolute;width:12px;height:3px;
  background:#c0b498;border:1px solid #a89878;top:1px;left:2px;border-radius:1px;}

/* FLAVOR TEXT */
.gp-flavor{font-family:'Crimson Text',serif;font-size:15px;font-style:italic;color:#8a7a60;
  text-align:center;margin:10px 0;padding:8px 16px;
  border-top:1px solid rgba(184,168,120,.2);border-bottom:1px solid rgba(184,168,120,.2);}

/* REVEAL CONTROLS */
.gp-controls{position:fixed;bottom:0;left:50%;transform:translateX(-50%);
  max-width:1100px;width:100%;display:flex;align-items:center;justify-content:center;gap:16px;
  padding:10px 20px;z-index:10;
  background:linear-gradient(180deg,rgba(42,32,24,.95),rgba(30,20,12,.98));
  border-top:3px solid #8a6c38;box-shadow:0 -4px 20px rgba(0,0,0,.6);}
.gp-btn{font-family:'Cinzel',serif;font-weight:700;font-size:11px;letter-spacing:2px;
  text-transform:uppercase;padding:8px 22px;border:2px solid #8a6c38;
  background:linear-gradient(180deg,#4a3828,#3a2a18);color:#d4a844;cursor:pointer;
  border-radius:2px;transition:all .2s;}
.gp-btn:hover{background:linear-gradient(180deg,#5a4838,#4a3828);box-shadow:0 0 12px rgba(212,168,68,.3);}
.gp-counter{font-family:'Cinzel',serif;font-size:12px;color:#8a7850;letter-spacing:1px;}


/* STEP VISIBILITY */
.gp-step-hidden{opacity:0;transform:translateY(10px);pointer-events:none;max-height:0;overflow:hidden;margin:0;padding:0;}
.gp-step-visible{opacity:1;transform:none;pointer-events:auto;max-height:none;overflow:visible;
  transition:opacity .4s,transform .3s;}

/* TITLE SCREEN — full viewport cinematic cold open */
.gp-titlescreen{position:relative;overflow:hidden;min-height:calc(100vh - 46px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:60px 20px 40px;z-index:2;
  border:6px solid #8a6c38;
  box-shadow:inset 0 0 0 2px #a88850,inset 0 0 0 4px rgba(0,0,0,.3),
    inset 0 0 60px rgba(212,168,68,.08),0 0 40px rgba(0,0,0,.6);}
.gp-ts-sky{position:absolute;inset:0;z-index:0;
  background:linear-gradient(180deg,
    #1a0a2e 0%,#2a1848 12%,#5a2858 25%,#8a3848 38%,
    #c46838 50%,#e8984c 62%,#f0c070 75%,#f8e8b0 88%,#faf4d8 100%);}
.gp-ts-sun{position:absolute;bottom:22%;left:50%;transform:translateX(-50%);z-index:1;
  width:120px;height:120px;border-radius:50%;
  background:radial-gradient(circle,#fff8e0 0%,#f8e080 25%,#f0c848 50%,rgba(240,200,72,0) 70%);
  box-shadow:0 0 80px 40px rgba(248,224,128,.4),0 0 160px 80px rgba(240,180,60,.15);}
.gp-ts-sea{position:absolute;bottom:0;left:0;right:0;height:20%;z-index:1;
  background:linear-gradient(180deg,rgba(200,160,80,.3) 0%,#1a2848 30%,#0e1a30 100%);
  border-top:1px solid rgba(240,200,100,.2);}
.gp-ts-sea::before{content:'';position:absolute;top:2px;left:20%;right:20%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(248,224,128,.3),transparent);}
.gp-ts-sea::after{content:'';position:absolute;top:8px;left:30%;right:30%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(248,224,128,.15),transparent);}
.gp-ts-parthenon{position:absolute;bottom:18%;left:50%;transform:translateX(-50%);z-index:2;}
.gp-ts-cliff{position:absolute;bottom:18%;left:0;right:0;height:60px;z-index:1;
  background:
    radial-gradient(ellipse 60% 100% at 50% 100%,#1a1020 0%,#1a1020 60%,transparent 61%),
    radial-gradient(ellipse 90% 60% at 30% 100%,#1a0e1e 0%,#1a0e1e 50%,transparent 51%),
    radial-gradient(ellipse 80% 50% at 70% 100%,#1e1224 0%,#1e1224 50%,transparent 51%);}
@keyframes gp-mote{0%{transform:translateY(0) scale(1);opacity:0}15%{opacity:.6}85%{opacity:.4}100%{transform:translateY(-80px) scale(.5);opacity:0}}
.gp-ts-mote{position:absolute;width:3px;height:3px;border-radius:50%;
  background:radial-gradient(circle,#f8e8b0,#d4a844);opacity:0;z-index:3;
  animation:gp-mote linear infinite;}
.gp-ts-mote:nth-child(1){bottom:25%;left:15%;animation-duration:6s;animation-delay:0s;}
.gp-ts-mote:nth-child(2){bottom:30%;left:35%;animation-duration:8s;animation-delay:2s;width:2px;height:2px;}
.gp-ts-mote:nth-child(3){bottom:28%;left:55%;animation-duration:7s;animation-delay:4s;}
.gp-ts-mote:nth-child(4){bottom:32%;left:75%;animation-duration:9s;animation-delay:1s;width:4px;height:4px;}
.gp-ts-mote:nth-child(5){bottom:26%;left:85%;animation-duration:5s;animation-delay:3s;width:2px;height:2px;}
.gp-ts-mote:nth-child(6){bottom:35%;left:45%;animation-duration:10s;animation-delay:5s;}
@media(prefers-reduced-motion:reduce){.gp-ts-mote{animation:none;}}
@keyframes gp-flare{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.35;transform:scale(1.1)}}
.gp-ts-flare{position:absolute;bottom:28%;left:50%;transform:translateX(-50%);z-index:3;
  width:300px;height:6px;border-radius:50%;
  background:linear-gradient(90deg,transparent 0%,rgba(255,248,224,.15) 20%,rgba(248,224,128,.3) 50%,rgba(255,248,224,.15) 80%,transparent 100%);
  animation:gp-flare 4s ease-in-out infinite;}
@media(prefers-reduced-motion:reduce){.gp-ts-flare{animation:none;opacity:.2;}}
.gp-ts-title-wrap{position:relative;z-index:5;text-align:center;margin-bottom:8px;}
.gp-ts-title{font-family:'Cinzel',serif;font-weight:900;font-size:42px;color:#f0e8d0;
  letter-spacing:8px;text-transform:uppercase;line-height:1.1;
  text-shadow:0 3px 6px rgba(0,0,0,.7),0 0 40px rgba(212,168,68,.3),
    0 0 2px rgba(240,216,112,.4);
  -webkit-text-stroke:1px rgba(168,136,80,.4);}
.gp-ts-subtitle{font-family:'Cinzel',serif;font-size:14px;color:#d4a844;
  letter-spacing:10px;text-transform:uppercase;margin-top:6px;
  text-shadow:0 2px 4px rgba(0,0,0,.5);}
.gp-ts-laurel{position:relative;z-index:5;display:flex;align-items:center;justify-content:center;gap:20px;}
.gp-ts-laurel-svg{width:56px;height:56px;opacity:.6;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));}
.gp-ts-info{position:relative;z-index:5;margin-top:20px;padding:14px 28px;text-align:center;
  background:rgba(26,16,8,.7);border:2px solid rgba(168,136,80,.4);border-radius:2px;
  backdrop-filter:blur(4px);max-width:500px;}
.gp-ts-info-title{font-family:'Cinzel',serif;font-weight:700;font-size:11px;color:#d4a844;
  letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;}
.gp-ts-info-text{font-family:'Crimson Text',serif;font-size:13px;color:#c0b090;line-height:1.5;}
.gp-ts-info-events{display:flex;justify-content:center;gap:16px;margin-top:10px;flex-wrap:wrap;}
.gp-ts-event-pill{display:flex;align-items:center;gap:5px;padding:4px 10px;
  border:1px solid rgba(168,136,80,.3);border-radius:2px;
  background:rgba(168,136,80,.08);}
.gp-ts-event-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.gp-ts-event-dot-maze{background:#6b7c3c;}
.gp-ts-event-dot-wrestle{background:#b85c38;}
.gp-ts-event-dot-hurdle{background:#4a7ab8;}
.gp-ts-event-dot-icarus{background:#c9a84c;}
.gp-ts-event-label{font-family:'Cinzel',serif;font-size:11px;color:#c0b090;letter-spacing:1px;text-transform:uppercase;}
.gp-ts-greek{height:16px;margin-top:20px;z-index:5;position:relative;width:100%;
  background:
    repeating-linear-gradient(90deg,
      rgba(168,136,80,.3) 0px,rgba(168,136,80,.3) 4px,transparent 4px,transparent 6px,
      rgba(168,136,80,.3) 6px,rgba(168,136,80,.3) 10px,transparent 10px,transparent 12px,
      rgba(168,136,80,.3) 12px,rgba(168,136,80,.3) 14px,transparent 14px,transparent 20px);}
/* Marble frame top/bottom borders */
.gp-titlescreen::before{content:'';position:absolute;top:0;left:0;right:0;height:14px;z-index:10;
  background:linear-gradient(180deg,
    rgba(232,224,208,.15) 0%,rgba(212,200,180,.08) 40%,transparent 100%);
  border-bottom:1px solid rgba(168,136,80,.15);}
.gp-titlescreen::after{content:'';position:absolute;bottom:0;left:0;right:0;height:14px;z-index:10;
  background:linear-gradient(0deg,
    rgba(232,224,208,.15) 0%,rgba(212,200,180,.08) 40%,transparent 100%);
  border-top:1px solid rgba(168,136,80,.15);}
/* Bronze corner ornaments */
.gp-ts-corner{position:absolute;width:28px;height:28px;z-index:11;
  border-color:#a88850;border-style:solid;}
.gp-ts-corner-tl{top:8px;left:8px;border-width:3px 0 0 3px;}
.gp-ts-corner-tr{top:8px;right:8px;border-width:3px 3px 0 0;}
.gp-ts-corner-bl{bottom:8px;left:8px;border-width:0 0 3px 3px;}
.gp-ts-corner-br{bottom:8px;right:8px;border-width:0 3px 3px 0;}
.gp-ts-stars{position:absolute;top:0;left:0;right:0;height:35%;z-index:1;}
.gp-ts-star{position:absolute;width:2px;height:2px;border-radius:50%;background:#e8e0d0;}
.gp-ts-star:nth-child(1){top:8%;left:12%;opacity:.5;}
.gp-ts-star:nth-child(2){top:5%;left:28%;opacity:.3;width:1px;height:1px;}
.gp-ts-star:nth-child(3){top:12%;left:45%;opacity:.4;}
.gp-ts-star:nth-child(4){top:3%;left:62%;opacity:.6;width:3px;height:3px;}
.gp-ts-star:nth-child(5){top:9%;left:78%;opacity:.3;}
.gp-ts-star:nth-child(6){top:15%;left:88%;opacity:.4;width:1px;height:1px;}
.gp-ts-star:nth-child(7){top:6%;left:52%;opacity:.25;width:1px;height:1px;}
.gp-ts-star:nth-child(8){top:18%;left:20%;opacity:.2;}

/* CHALLENGE RULES BOX */
.gp-rules-btn{display:block;width:calc(100% - 12px);margin:6px;padding:8px;text-align:center;
  font-family:'Cinzel',serif;font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;
  color:#a08850;border:2px solid #5a4828;background:linear-gradient(180deg,#2e2418,#241c14);
  cursor:pointer;border-radius:2px;}
.gp-rules-btn:hover{border-color:#8a6c38;color:#d4a844;}

/* PLAYER GRID (title screen) */
.gp-ts-grid{position:relative;z-index:5;display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:24px;max-width:600px;}
.gp-ts-grid-player{display:flex;flex-direction:column;align-items:center;gap:3px;}
.gp-ts-grid-player img{width:52px;height:52px;border-radius:50%;border:3px solid #8a6c38;
  object-fit:cover;box-shadow:0 2px 12px rgba(0,0,0,.6),0 0 20px rgba(212,168,68,.15);}
.gp-ts-grid-name{font-family:'Cinzel',serif;font-size:11px;font-weight:700;color:#f0e8d0;
  text-shadow:0 1px 3px rgba(0,0,0,.8);letter-spacing:.5px;}
.gp-ts-grid-tribe{font-family:'Cinzel',serif;font-size:7px;color:#d4a844;letter-spacing:1px;text-transform:uppercase;
  text-shadow:0 1px 2px rgba(0,0,0,.6);}

/* RESULTS */
.gp-final-winner{text-align:center;padding:20px;margin:16px 0;
  background:linear-gradient(180deg,#3a2a14 0%,#2a1c0e 100%);
  border:3px solid #c9a84c;border-radius:2px;
  box-shadow:0 0 20px rgba(201,168,76,.3);}
.gp-final-winner-label{font-family:'Cinzel',serif;font-size:12px;color:#8a7850;letter-spacing:4px;text-transform:uppercase;}
.gp-final-winner-name{font-family:'Cinzel',serif;font-weight:900;font-size:24px;color:#d4a844;
  letter-spacing:3px;margin-top:6px;text-shadow:0 2px 8px rgba(212,168,68,.4);}
.gp-final-winner img{width:60px;height:60px;border-radius:50%;border:3px solid #c9a84c;
  object-fit:cover;box-shadow:0 4px 16px rgba(0,0,0,.5);margin-top:8px;}
.gp-final-tally{display:flex;justify-content:center;gap:20px;margin-top:16px;flex-wrap:wrap;}
.gp-final-tally-item{text-align:center;padding:8px 14px;
  border:1px solid #5a4828;border-radius:2px;
  background:linear-gradient(180deg,#3a3020 0%,#2e2418 100%);min-width:80px;}
.gp-final-tally-name{font-family:'Cinzel',serif;font-size:12px;color:#d4c8a8;font-weight:700;}
.gp-final-tally-golds{display:flex;gap:3px;justify-content:center;margin-top:4px;}

/* TRIBE DOTS */
.gp-pin-tribe-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;
  border:1px solid rgba(0,0,0,.15);box-shadow:0 1px 2px rgba(0,0,0,.1);}
.gp-tribe-divider{font-family:'Cinzel',serif;font-size:8px;letter-spacing:2px;text-transform:uppercase;
  color:#8a7850;padding:6px 8px 2px;text-align:center;
  border-top:1px solid #4a3828;margin-top:4px;}
.gp-tribe-divider:first-child{border-top:none;margin-top:0;}
.gp-contestant-dot{width:8px;height:8px;border-radius:50%;margin-top:2px;
  border:1px solid rgba(0,0,0,.15);}

/* MAZE DEPTH SECTIONS */
.gp-depth-section{position:relative;padding:4px 0;margin:0;}
.gp-depth-section > *{position:relative;z-index:1;}
.gp-depth-pillars{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;opacity:.5;}
.gp-depth-r1 .gp-depth-pillars{background:
  repeating-linear-gradient(90deg,
    transparent 0%,transparent 22%,rgba(200,190,170,.05) 22.5%,rgba(200,190,170,.05) 23.5%,transparent 24%,
    transparent 47%,rgba(200,190,170,.05) 47.5%,rgba(200,190,170,.05) 48.5%,transparent 49%,
    transparent 72%,rgba(200,190,170,.05) 72.5%,rgba(200,190,170,.05) 73.5%,transparent 74%,
    transparent 97%,rgba(200,190,170,.05) 97.5%,rgba(200,190,170,.05) 98.5%,transparent 99%);}
.gp-depth-r2 .gp-depth-pillars{background:
  repeating-linear-gradient(90deg,
    transparent 0%,transparent 14%,rgba(190,175,150,.07) 14.5%,rgba(190,175,150,.07) 15.5%,transparent 16%,
    transparent 30%,rgba(190,175,150,.07) 30.5%,rgba(190,175,150,.07) 31.5%,transparent 32%,
    transparent 47%,rgba(190,175,150,.07) 47.5%,rgba(190,175,150,.07) 48.5%,transparent 49%,
    transparent 63%,rgba(190,175,150,.07) 63.5%,rgba(190,175,150,.07) 64.5%,transparent 65%,
    transparent 80%,rgba(190,175,150,.07) 80.5%,rgba(190,175,150,.07) 81.5%,transparent 82%,
    transparent 97%,rgba(190,175,150,.07) 97.5%,rgba(190,175,150,.07) 98.5%,transparent 99%);}
.gp-depth-r3 .gp-depth-pillars{background:
  repeating-linear-gradient(90deg,
    transparent 0%,transparent 10%,rgba(170,155,130,.09) 10.5%,rgba(170,155,130,.09) 12%,transparent 12.5%,
    transparent 22%,rgba(170,155,130,.09) 22.5%,rgba(170,155,130,.09) 24%,transparent 24.5%,
    transparent 34%,rgba(170,155,130,.09) 34.5%,rgba(170,155,130,.09) 36%,transparent 36.5%,
    transparent 46%,rgba(170,155,130,.09) 46.5%,rgba(170,155,130,.09) 48%,transparent 48.5%,
    transparent 58%,rgba(170,155,130,.09) 58.5%,rgba(170,155,130,.09) 60%,transparent 60.5%,
    transparent 70%,rgba(170,155,130,.09) 70.5%,rgba(170,155,130,.09) 72%,transparent 72.5%,
    transparent 82%,rgba(170,155,130,.09) 82.5%,rgba(170,155,130,.09) 84%,transparent 84.5%,
    transparent 94%,rgba(170,155,130,.09) 94.5%,rgba(170,155,130,.09) 96%,transparent 96.5%);
  background-color:rgba(0,0,0,.015);}
.gp-depth-r4 .gp-depth-pillars{background:
  repeating-linear-gradient(90deg,
    transparent 0%,transparent 7%,rgba(150,135,110,.11) 7.5%,rgba(150,135,110,.11) 9.5%,transparent 10%,
    transparent 17%,rgba(150,135,110,.11) 17.5%,rgba(150,135,110,.11) 19.5%,transparent 20%,
    transparent 27%,rgba(150,135,110,.11) 27.5%,rgba(150,135,110,.11) 29.5%,transparent 30%,
    transparent 37%,rgba(150,135,110,.11) 37.5%,rgba(150,135,110,.11) 39.5%,transparent 40%,
    transparent 47%,rgba(150,135,110,.11) 47.5%,rgba(150,135,110,.11) 49.5%,transparent 50%,
    transparent 57%,rgba(150,135,110,.11) 57.5%,rgba(150,135,110,.11) 59.5%,transparent 60%,
    transparent 67%,rgba(150,135,110,.11) 67.5%,rgba(150,135,110,.11) 69.5%,transparent 70%,
    transparent 77%,rgba(150,135,110,.11) 77.5%,rgba(150,135,110,.11) 79.5%,transparent 80%,
    transparent 87%,rgba(150,135,110,.11) 87.5%,rgba(150,135,110,.11) 89.5%,transparent 90%,
    transparent 97%,rgba(150,135,110,.11) 97.5%,rgba(150,135,110,.11) 99.5%);
  background-color:rgba(0,0,0,.03);}
.gp-depth-r5 .gp-depth-pillars{background:
  repeating-linear-gradient(90deg,
    rgba(130,115,90,.13) 0%,rgba(130,115,90,.13) 3%,transparent 3.5%,
    transparent 6%,rgba(130,115,90,.13) 6.5%,rgba(130,115,90,.13) 9.5%,transparent 10%,
    transparent 13%,rgba(130,115,90,.13) 13.5%,rgba(130,115,90,.13) 16.5%,transparent 17%,
    transparent 20%,rgba(130,115,90,.13) 20.5%,rgba(130,115,90,.13) 23.5%,transparent 24%,
    transparent 27%,rgba(130,115,90,.13) 27.5%,rgba(130,115,90,.13) 30.5%,transparent 31%);
  background-color:rgba(0,0,0,.05);}

/* DEPTH DIVIDERS */
.gp-depth-divider{display:flex;align-items:center;gap:12px;margin:16px 0 8px;padding:0 8px;}
.gp-depth-divider-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,#8a6c38,transparent);}
.gp-depth-divider-text{font-family:'Cinzel',serif;font-weight:700;font-size:12px;color:#8a7850;
  letter-spacing:3px;text-transform:uppercase;white-space:nowrap;}

/* ZONE LABEL */
.gp-zone-label{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;margin-bottom:6px;
  font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
  color:#6a5a40;border:1px solid rgba(138,108,56,.2);border-radius:2px;
  background:rgba(138,108,56,.06);}
.gp-zone-dot{width:6px;height:6px;border-radius:50%;}
.gp-zone-dot-colonnade{background:#8aa040;}
.gp-zone-dot-pediment{background:#b89050;}
.gp-zone-dot-cistern{background:#5080a0;}
.gp-zone-dot-sanctum{background:#a06898;}
.gp-zone-dot-agora{background:#c08838;}

/* ZONE FLAVOR TEXT */
.gp-zone-flavor{font-family:'Crimson Text',serif;font-size:15px;font-style:italic;color:#7a6a50;
  padding:4px 14px 6px;margin:-4px 0 4px;
  border-left:2px solid rgba(138,108,56,.15);}

/* STONE TABLET (boar threat) */
.gp-tablet{position:relative;display:flex;align-items:center;gap:10px;margin:12px 0;padding:10px 14px;
  background:linear-gradient(135deg,#d0c4a8 0%,#c4b898 40%,#b8ac8c 100%);
  border:2px solid #9a8a68;border-radius:2px;color:#4a3a20;
  box-shadow:inset 0 1px 2px rgba(255,255,255,.15),0 2px 6px rgba(0,0,0,.15);}
.gp-tablet-icon{width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.gp-tablet-boar-svg{width:28px;height:28px;}
.gp-tablet-body{flex:1;}
.gp-tablet-title{font-family:'Cinzel',serif;font-weight:900;font-size:12px;letter-spacing:2px;
  text-transform:uppercase;color:#5a4a28;}
.gp-tablet-status{font-family:'Crimson Text',serif;font-size:13px;font-style:italic;color:#6a5a38;margin-top:2px;}
.gp-tablet-cracks{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:2px;}
.gp-tablet-crack{position:absolute;background:#8a7a58;opacity:.15;}
.gp-tablet-crack-1{width:40px;height:1px;top:30%;left:15%;transform:rotate(-12deg);}
.gp-tablet-crack-2{width:30px;height:1px;top:55%;right:20%;transform:rotate(8deg);}
.gp-tablet-crack-3{width:50px;height:1px;top:70%;left:25%;transform:rotate(-5deg);}
.gp-tablet-crack-4{width:25px;height:1px;top:20%;right:30%;transform:rotate(18deg);}
.gp-tablet-crack-5{width:35px;height:1px;top:45%;left:40%;transform:rotate(-15deg);}
.gp-tablet-enraged{border-color:#c05020;box-shadow:inset 0 0 8px rgba(192,80,32,.1),0 2px 6px rgba(0,0,0,.15);}
.gp-tablet-enraged .gp-tablet-title{color:#8a3a18;}
.gp-tablet-enraged .gp-tablet-crack{background:#a05030;opacity:.25;}

/* GOLD BURST */
@keyframes gp-gold-burst{0%{opacity:0;transform:scale(.8)}50%{opacity:1;transform:scale(1.02)}100%{opacity:.7;transform:scale(1)}}
.gp-gold-burst{position:relative;padding:4px;margin:6px 0;
  background:radial-gradient(ellipse at center,rgba(240,216,112,.12) 0%,rgba(201,168,76,.06) 40%,transparent 70%);
  border-radius:4px;animation:gp-gold-burst .8s ease-out;}
@media(prefers-reduced-motion:reduce){.gp-gold-burst{animation:none;}}

/* BOAR SILHOUETTE (environmental) */
.gp-boar-sil{position:absolute;pointer-events:none;opacity:.04;z-index:0;}
.gp-boar-sil-svg{width:100%;height:100%;}
.gp-boar-sil-r3{width:80px;height:50px;right:5%;top:10%;}
.gp-boar-sil-r4{width:100px;height:60px;left:3%;bottom:10%;opacity:.06;}
.gp-boar-sil-r5{width:120px;height:70px;right:8%;bottom:15%;opacity:.08;}
`;
}


// ══════════════════════════════════════════════════════════════════════
// SHELL WRAPPER
// ══════════════════════════════════════════════════════════════════════
function _gpShell(content, ep, screenKey, totalSteps) {
  const suffix = screenKey.replace('gp-', '');
  return `<style>${_gpCSS()}</style>
<div class="gp-shell">
  <div class="gp-atmo">
    <div class="gp-atmo-sky"></div>
    <div class="gp-atmo-ruins"></div>
    <div class="gp-atmo-columns"></div>
    <div class="gp-atmo-columns2"></div>
    <div class="gp-atmo-sun"></div>
    <div class="gp-feather"></div>
    <div class="gp-feather"></div>
    <div class="gp-feather"></div>
    <div class="gp-feather"></div>
    <div class="gp-feather"></div>
  </div>
  <div class="gp-title-banner">
    <div class="gp-title-laurels">
      ${_laurelSmall}
      <div>
        <div class="gp-title-main">Greece's Pieces</div>
        <div class="gp-title-sub">Olympic Challenge</div>
      </div>
      ${_laurelSmall.replace('viewBox="0 0 36 36"', 'viewBox="0 0 36 36" style="transform:scaleX(-1)"')}
    </div>
    <div class="gp-greek-key"></div>
  </div>
  ${_buildScoreboard(ep, screenKey)}
  <div class="gp-layout">
    <div class="gp-main-col gp-marble">
      ${content}
    </div>
    <div class="gp-sidebar-right">
      ${_buildRightSidebar(ep, screenKey)}
    </div>
  </div>
  <div class="gp-controls" id="gp-controls-${suffix}">
    <button class="gp-btn" onclick="gpRevealNext('${screenKey}',${totalSteps})">Reveal Next</button>
    <span class="gp-counter" id="gp-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="gp-btn" onclick="gpRevealAll('${screenKey}',${totalSteps})">Reveal All</button>
  </div>
</div>`;
}


// ══════════════════════════════════════════════════════════════════════
// SCOREBOARD
// ══════════════════════════════════════════════════════════════════════
function _buildScoreboard(ep, screenKey) {
  const data = ep.challengeData;
  if (!data) return '';

  const screenPhase = screenKey.replace('gp-', '').replace(/\d+$/, '').replace(/-$/, '');
  const phaseOrder = ['title', 'maze', 'wrestling', 'hurdles', 'icarus', 'results'];
  const phaseIdx = phaseOrder.indexOf(screenPhase);

  // Gate golds by phase — only show golds for completed events
  const gatedGolds = {};
  if (phaseIdx > 1 && data.maze) {
    const key = data.isMerged ? data.maze.goldWinner : data.maze.goldTribe;
    if (key) gatedGolds[key] = (gatedGolds[key] || 0) + 1;
  }
  if (phaseIdx > 2 && data.wrestling) {
    const key = data.isMerged ? data.wrestling.goldWinner : data.wrestling.goldTribe;
    if (key) gatedGolds[key] = (gatedGolds[key] || 0) + 1;
  }
  if (phaseIdx > 3 && data.hurdles) {
    const key = data.isMerged ? data.hurdles.goldWinner : data.hurdles.goldTribe;
    if (key) gatedGolds[key] = (gatedGolds[key] || 0) + 1;
  }
  if (phaseIdx > 4 && data.icarus && data.icarus.winner) {
    if (data.isMerged) {
      gatedGolds[data.icarus.winner] = (gatedGolds[data.icarus.winner] || 0) + 1;
    } else {
      const winTribe = (data.tribeRankings || []).find(t =>
        (t.members || []).includes(data.icarus.winner))?.tribeName;
      if (winTribe) gatedGolds[winTribe] = (gatedGolds[winTribe] || 0) + 1;
    }
  }

  if (data.isMerged) {
    const ranked = [...(data.active || [])].sort((a, b) => (gatedGolds[b] || 0) - (gatedGolds[a] || 0));
    const p1 = ranked[0] || 'TBD';
    const p2 = ranked[1] || 'TBD';
    const g1 = gatedGolds[p1] || 0;
    const g2 = gatedGolds[p2] || 0;
    const maxG = 3;
    const m1 = Array.from({ length: maxG }, (_, i) => `<div class="gp-sb-medal${i < g1 ? '' : ' gp-sb-medal-empty'}"></div>`).join('');
    const m2 = Array.from({ length: maxG }, (_, i) => `<div class="gp-sb-medal${i < g2 ? '' : ' gp-sb-medal-empty'}"></div>`).join('');
    return `<div class="gp-scoreboard">
      <div class="gp-sb-tribe gp-sb-tribe-left">
        <div>
          <div class="gp-sb-tribe-name">${p1}</div>
          <div class="gp-sb-medals" style="justify-content:flex-end">${m1}</div>
        </div>
        <div class="gp-sb-medal-count">${g1}</div>
      </div>
      <div class="gp-sb-center">${_medalSVG}<div class="gp-sb-vs">VS</div>
        <div class="gp-sb-status">Most Golds Wins</div></div>
      <div class="gp-sb-tribe gp-sb-tribe-right">
        <div class="gp-sb-medal-count">${g2}</div>
        <div>
          <div class="gp-sb-tribe-name">${p2}</div>
          <div class="gp-sb-medals">${m2}</div>
        </div>
      </div>
    </div>`;
  } else {
    // Pre-merge: supports 2+ tribes
    const tNames = data.tribeNames || (data.tribeRankings || []).map(t => t.tribeName) || [];
    if (tNames.length === 0) return '';
    const maxG = 3;
    const tribeCards = tNames.map(tName => {
      const g = gatedGolds[tName] || 0;
      const tc = _tribeColorFromEp(tName, ep);
      const medals = Array.from({ length: maxG }, (_, i) =>
        `<div class="gp-sb-medal${i < g ? '' : ' gp-sb-medal-empty'}"></div>`).join('');
      return `<div class="gp-sb-tribe" style="justify-content:center;flex:1">
        <div style="text-align:center">
          <div class="gp-sb-tribe-name" style="color:${tc || '#d4c8a8'}">${tName}</div>
          <div class="gp-sb-medals" style="justify-content:center;margin-top:4px">${medals}</div>
        </div>
        <div class="gp-sb-medal-count" style="margin-left:8px">${g}</div>
      </div>`;
    });
    const dividers = tribeCards.map((card, i) =>
      i < tribeCards.length - 1 ? card + `<div class="gp-sb-center" style="padding:0 8px">${_medalSVG}</div>` : card
    ).join('');
    return `<div class="gp-scoreboard" style="flex-wrap:wrap">
      ${dividers}
      <div style="width:100%;text-align:center;margin-top:4px">
        <div class="gp-sb-status">Most Golds Wins</div>
      </div>
    </div>`;
  }
}




// ══════════════════════════════════════════════════════════════════════
// ZONE MAP — Interactive sticky map in sidebar, live-updates on reveal
// ══════════════════════════════════════════════════════════════════════
const ZONE_POS = {
  agora:     { x: 50, y: 14 },
  colonnade: { x: 14, y: 38 },
  pediment:  { x: 86, y: 38 },
  sanctum:   { x: 26, y: 72 },
  cistern:   { x: 74, y: 72 },
};
const ZONE_COLORS = { colonnade: '#8aa040', pediment: '#b89050', cistern: '#5080a0', sanctum: '#a06898', agora: '#c08838' };
const ZONE_PATHS = [
  ['agora','colonnade'],['agora','pediment'],['colonnade','sanctum'],
  ['pediment','cistern'],['sanctum','cistern'],['colonnade','pediment'],
];

function _buildZoneMapSVG(ep, screenKey) {
  const data = ep?.challengeData;
  if (!data?.maze) return '';
  const stepMeta = (typeof window !== 'undefined' && window._gpMazeStepMeta) || [];
  const zoneData = (typeof window !== 'undefined' && window._gpMazeZoneData) || [];
  const st = _tvState['gp-maze'];
  const revealIdx = st ? st.idx : -1;

  // Determine current round from revealed steps
  let currentRound = 0;
  for (let i = 0; i <= revealIdx && i < stepMeta.length; i++) {
    if (stepMeta[i].round && stepMeta[i].round > currentRound) currentRound = stepMeta[i].round;
  }

  // Collect zone assignments up to current round
  const playerZones = {};
  for (let r = 0; r < currentRound && r < zoneData.length; r++) {
    zoneData[r].forEach(za => {
      za.pair.forEach(name => { playerZones[name] = za.zone; });
    });
  }

  let svg = `<svg viewBox="0 0 100 92" style="width:100%;display:block">`;

  // Paths between zones
  ZONE_PATHS.forEach(([from, to]) => {
    const f = ZONE_POS[from], t = ZONE_POS[to];
    svg += `<line x1="${f.x}" y1="${f.y}" x2="${t.x}" y2="${t.y}" stroke="#8a6c38" stroke-width=".6" stroke-dasharray="1.5,1" opacity=".4"/>`;
  });

  // Zone nodes
  Object.entries(ZONE_POS).forEach(([id, pos]) => {
    svg += `<circle cx="${pos.x}" cy="${pos.y}" r="4" fill="${ZONE_COLORS[id]}" stroke="#4a3a20" stroke-width=".6" opacity=".85"/>`;
    const label = MAZE_ZONES.find(z => z.id === id)?.name || id;
    const words = label.split(' ');
    if (words.length <= 2) {
      svg += `<text x="${pos.x}" y="${pos.y + 8}" text-anchor="middle" font-family="Cinzel,serif" font-size="3.2" fill="#a09070" letter-spacing=".3">${label}</text>`;
    } else {
      svg += `<text x="${pos.x}" y="${pos.y + 7.5}" text-anchor="middle" font-family="Cinzel,serif" font-size="3.2" fill="#a09070" letter-spacing=".3">${words.slice(0, 2).join(' ')}</text>`;
      svg += `<text x="${pos.x}" y="${pos.y + 10.5}" text-anchor="middle" font-family="Cinzel,serif" font-size="3.2" fill="#a09070" letter-spacing=".3">${words.slice(2).join(' ')}</text>`;
    }
  });

  // Player avatars at their zones
  if (currentRound > 0) {
    const zoneOccupants = {};
    Object.entries(playerZones).forEach(([name, zone]) => {
      if (!zoneOccupants[zone]) zoneOccupants[zone] = [];
      zoneOccupants[zone].push(name);
    });

    Object.entries(zoneOccupants).forEach(([zone, names]) => {
      const pos = ZONE_POS[zone];
      if (!pos) return;
      const count = names.length;
      names.forEach((name, i) => {
        const angle = (2 * Math.PI * i / Math.max(count, 1)) - Math.PI / 2;
        const spread = count <= 2 ? 6 : (count <= 4 ? 7 : 8);
        const ox = pos.x + Math.cos(angle) * spread;
        const oy = pos.y + Math.sin(angle) * spread - 2;
        const tc = _tribeColorFromEp(_tribeForPlayer(name, ep), ep) || '#8a7850';
        const slug = _slug(name);
        svg += `<circle cx="${ox}" cy="${oy}" r="3.2" fill="#2a2018" stroke="${tc}" stroke-width=".8"/>`;
        svg += `<image href="assets/avatars/${slug}.png" x="${ox - 2.5}" y="${oy - 2.5}" width="5" height="5" clip-path="circle(2.5px at 2.5px 2.5px)"/>`;
        svg += `<text x="${ox}" y="${oy + 5.5}" text-anchor="middle" font-family="Cinzel,serif" font-size="2.2" fill="${tc}" font-weight="700">${name.length > 6 ? name.slice(0, 5) + '.' : name}</text>`;
      });
    });
  }

  // Round label
  svg += `<text x="50" y="90" text-anchor="middle" font-family="Cinzel,serif" font-size="3" fill="#8a7850" letter-spacing="1">${currentRound > 0 ? `ROUND ${currentRound}` : 'AWAITING START'}</text>`;
  svg += `</svg>`;
  return svg;
}

// ══════════════════════════════════════════════════════════════════════
// RIGHT SIDEBAR — Contestants, Matchup, Results, Leaderboard
// ══════════════════════════════════════════════════════════════════════
function _buildRightSidebar(ep, screenKey) {
  const data = ep.challengeData;
  if (!data) return '';
  const active = data.active || [];
  const isMerged = data.isMerged;

  const screenPhase = screenKey.replace('gp-', '').replace(/\d+$/, '').replace(/-$/, '');
  const phaseOrder = ['title', 'maze', 'wrestling', 'hurdles', 'icarus', 'results'];
  const phaseIdx = phaseOrder.indexOf(screenPhase);

  let html = '';

  // Contestants Grid — grouped by tribe with colored dots in pre-merge
  html += `<div class="gp-right-header">Contestants</div>`;
  if (!isMerged) {
    const tribeGroups = {};
    active.forEach(name => {
      const tribe = _tribeForPlayer(name, ep) || 'Unknown';
      if (!tribeGroups[tribe]) tribeGroups[tribe] = [];
      tribeGroups[tribe].push(name);
    });
    Object.entries(tribeGroups).forEach(([tribe, members]) => {
      const tc = _tribeColorFromEp(tribe, ep);
      html += `<div class="gp-tribe-divider" style="color:${tc || '#8a7850'}">${tribe}</div>
      <div class="gp-contestants">`;
      members.forEach(name => {
        html += `<div class="gp-contestant">
          <img src="${_avatar(name)}" alt="" style="border-color:${tc || '#8a6c38'}">
          <div class="gp-contestant-name">${name}</div>
          <div class="gp-contestant-dot" style="background:${tc || '#8a7850'}"></div>
        </div>`;
      });
      html += `</div>`;
    });
  } else {
    html += `<div class="gp-contestants">`;
    active.forEach(name => {
      html += `<div class="gp-contestant">
        <img src="${_avatar(name)}" alt="">
        <div class="gp-contestant-name">${name}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Zone Map — only visible on maze phase
  if (screenPhase === 'maze' || screenPhase === 'title') {
    html += `<div class="gp-right-header" style="margin-top:4px">Labyrinth Map</div>
    <div id="gp-zone-map-inner" style="padding:4px 8px;background:rgba(138,108,56,.06);border-bottom:1px solid #4a3828">
      ${_buildZoneMapSVG(ep, screenKey)}
    </div>`;
  }

  // Event Results — only show completed events (phase must be PAST the event)
  html += `<div class="gp-right-header" style="margin-top:4px">Event Results</div>
  <div class="gp-results-list">`;

  const maze = data.maze;
  const wrestling = data.wrestling;
  const hurdles = data.hurdles;
  const icarus = data.icarus;

  function _resultLabel(winner, tribe) {
    if (!winner) return '';
    if (isMerged) return winner;
    return tribe ? `${winner} (${tribe})` : winner;
  }

  const mazeRevealed = phaseIdx > 1;
  html += `<div class="gp-result-row">
    <div class="gp-result-num">I</div>
    <div class="gp-result-dot gp-result-dot-maze"></div>
    <div class="gp-result-info">
      <div class="gp-result-event">Maze &amp; Beast Hunt</div>
      ${mazeRevealed && maze && maze.goldWinner ? `<div class="gp-result-winner">${_resultLabel(maze.goldWinner, maze.goldTribe)}</div>` :
        `<div class="gp-result-pending">${phaseIdx === 1 ? 'In progress...' : 'Pending'}</div>`}
    </div>
  </div>`;

  const wrestleRevealed = phaseIdx > 2;
  html += `<div class="gp-result-row">
    <div class="gp-result-num">II</div>
    <div class="gp-result-dot gp-result-dot-wrestle"></div>
    <div class="gp-result-info">
      <div class="gp-result-event">Wrestling Match</div>
      ${wrestleRevealed && wrestling && wrestling.goldWinner ? `<div class="gp-result-winner">${_resultLabel(wrestling.goldWinner, wrestling.goldTribe)}</div>` :
        `<div class="gp-result-pending">${phaseIdx === 2 ? 'In progress...' : 'Pending'}</div>`}
    </div>
  </div>`;

  const hurdleRevealed = phaseIdx > 3;
  html += `<div class="gp-result-row">
    <div class="gp-result-num">III</div>
    <div class="gp-result-dot gp-result-dot-hurdle"></div>
    <div class="gp-result-info">
      <div class="gp-result-event">Hurdle Race</div>
      ${hurdleRevealed && hurdles && hurdles.goldWinner ? `<div class="gp-result-winner">${_resultLabel(hurdles.goldWinner, hurdles.goldTribe)}</div>` :
        `<div class="gp-result-pending">${phaseIdx === 3 ? 'In progress...' : 'Pending'}</div>`}
    </div>
  </div>`;

  if (icarus) {
    const icarusRevealed = phaseIdx > 4;
    html += `<div class="gp-result-row" style="border-color:rgba(212,168,68,.3)">
      <div class="gp-result-num" style="color:#d4a844">&#9733;</div>
      <div class="gp-result-dot gp-result-dot-icarus"></div>
      <div class="gp-result-info">
        <div class="gp-result-event">Flight Tiebreaker</div>
        ${icarusRevealed && icarus.winner ? `<div class="gp-result-winner">${_resultLabel(icarus.winner, _tribeForPlayer(icarus.winner, ep))}</div>` :
          `<div class="gp-result-pending">${phaseIdx === 4 ? 'In progress...' : 'Pending'}</div>`}
      </div>
    </div>`;
  }
  html += `</div>`;

  // Performance Leaderboard — show scores only for completed events
  html += `<div class="gp-right-header" style="margin-top:4px">Performance</div>
  <div class="gp-leaderboard">`;

  // Gate scores: only show scores accumulated up through completed phases
  // Use stepMeta snapshots if available, otherwise gate by phase
  const gatedGolds = {};
  const gatedScores = {};
  active.forEach(n => { gatedGolds[n] = 0; gatedScores[n] = 0; });

  if (mazeRevealed && maze) {
    (maze.performances || []).forEach(p => {
      gatedScores[p.name] = (gatedScores[p.name] || 0) + (p.score || 0);
    });
    if (maze.goldWinner) {
      if (isMerged) gatedGolds[maze.goldWinner] = (gatedGolds[maze.goldWinner] || 0) + 1;
    }
  }
  if (wrestleRevealed && wrestling) {
    (wrestling.performances || []).forEach(p => {
      gatedScores[p.name] = (gatedScores[p.name] || 0) + (p.score || 0);
    });
    if (wrestling.goldWinner) {
      if (isMerged) gatedGolds[wrestling.goldWinner] = (gatedGolds[wrestling.goldWinner] || 0) + 1;
    }
  }
  if (hurdleRevealed && hurdles) {
    (hurdles.performances || []).forEach(p => {
      gatedScores[p.name] = (gatedScores[p.name] || 0) + (p.score || 0);
    });
    if (hurdles.goldWinner) {
      if (isMerged) gatedGolds[hurdles.goldWinner] = (gatedGolds[hurdles.goldWinner] || 0) + 1;
    }
  }

  // On results screen, use final scores
  const useScores = phaseIdx >= 5 ? (ep.chalMemberScores || {}) : gatedScores;
  const useGolds = phaseIdx >= 5 ? (data.golds || {}) : gatedGolds;

  const ranked = [...active].sort((a, b) => (useScores[b] || 0) - (useScores[a] || 0));
  ranked.forEach((name, i) => {
    const rankCls = i === 0 ? ' gp-lb-rank-1' : (i === 1 ? ' gp-lb-rank-2' : (i === 2 ? ' gp-lb-rank-3' : ''));
    const playerGolds = isMerged ? (useGolds[name] || 0) : 0;
    const goldDots = Array.from({ length: playerGolds }, () => `<div class="gp-lb-gold-dot"></div>`).join('');
    const score = useScores[name] || 0;
    html += `<div class="gp-lb-row">
      <div class="gp-lb-rank${rankCls}">${i + 1}</div>
      <img class="gp-lb-avatar" src="${_avatar(name)}" alt="">
      <div class="gp-lb-name">${name}</div>
      <div class="gp-lb-golds">${goldDots}</div>
      <div class="gp-lb-score">${score > 0 ? '+' + score : '—'}</div>
    </div>`;
  });
  html += `</div>`;

  return html;
}


// ══════════════════════════════════════════════════════════════════════
// CARD BUILDERS
// ══════════════════════════════════════════════════════════════════════
function _badgeCls(bc) {
  const map = {
    gold: 'gp-badge-gold', green: 'gp-badge-pop', blue: 'gp-badge-score',
    red: 'gp-badge-neg', orange: 'gp-badge-ko', grey: 'gp-badge-score',
    camp: 'gp-badge-camp'
  };
  return map[bc] || 'gp-badge-score';
}

function _eventCard(evt, cardClass, iconType) {
  const stamp = evt.type === 'ko' ? `<div class="gp-stamp gp-stamp-ko">K.O.!</div>` :
    (evt.type === 'gold-found' || evt.type === 'gold-claim' || evt.type === 'gold-found-default' || evt.type === 'medal-grab') ? `<div class="gp-stamp gp-stamp-gold">Gold Medal!</div>` :
    (evt.type === 'showoff-wipeout' || evt.type === 'collapse') ? `<div class="gp-stamp gp-stamp-wipeout">${evt.type === 'collapse' ? 'Wings Lost!' : 'Wipeout!'}</div>` :
    (evt.type === 'boar-hit') ? `<div class="gp-stamp gp-stamp-wipeout">Beast!</div>` :
    (evt.type === 'betrayal') ? `<div class="gp-stamp gp-stamp-ko">Betrayal!</div>` :
    '';

  const typeLabel = evt.type === 'ko' ? 'Knockout!' :
    (evt.type === 'gold-found' || evt.type === 'gold-claim' || evt.type === 'gold-found-default') ? 'Gold Claimed!' :
    (evt.type === 'medal-grab') ? 'Medal Grabbed!' :
    (evt.type === 'boar-dodge' || evt.type === 'boar-hit') ? 'Boar Charge!' :
    (evt.type.startsWith('social-') || evt.type === 'boar-help' || evt.type === 'boar-abandon') ? (
      evt.type === 'social-tension' ? 'Partner Tension' :
      evt.type === 'social-cooperation' ? 'Teamwork' :
      evt.type === 'social-confrontation' ? 'Confrontation' :
      evt.type === 'social-respect' ? 'Respect' :
      evt.type === 'boar-help' ? 'Rescue' :
      evt.type === 'boar-abandon' ? 'Abandoned!' :
      'Social'
    ) :
    (evt.type === 'betrayal') ? 'Partner Betrayal!' :
    (evt.type === 'throw-partner') ? 'Dirty Move!' :
    (evt.type === 'maze-sabotage') ? 'Sabotage!' :
    (evt.type === 'collapse') ? 'Wing Collapse' :
    (evt.type === 'melt') ? `Flight` :
    (evt.type === 'tag-in') ? 'Tag In!' :
    (evt.type === 'flashy-hit') ? `Wrestling` :
    (evt.type === 'flashy-miss') ? `Wrestling` :
    (evt.badge || 'Event');

  const typeColor = cardClass === 'gp-card-maze' ? '#6b7c3c' :
    cardClass === 'gp-card-wrestle' ? '#b85c38' :
    cardClass === 'gp-card-hurdle' ? '#4a7ab8' :
    cardClass === 'gp-card-icarus' ? '#c9a84c' :
    cardClass === 'gp-card-social' ? '#8a5a8a' :
    cardClass === 'gp-card-drama' ? '#c02020' :
    cardClass === 'gp-card-gold' ? '#8a6c28' :
    '#6a5a40';

  // Determine which players to pin
  const pins = [];
  if (evt.player) pins.push(evt.player);
  if (evt.attacker) pins.push(evt.attacker);
  if (evt.defender && !pins.includes(evt.defender)) pins.push(evt.defender);
  if (evt.winner && !pins.includes(evt.winner)) pins.push(evt.winner);
  if (evt.loser && !pins.includes(evt.loser)) pins.push(evt.loser);
  if (evt.betrayer) { if (!pins.includes(evt.betrayer)) pins.push(evt.betrayer); }
  if (evt.victim && !pins.includes(evt.victim)) pins.push(evt.victim);
  if (evt.helper && !pins.includes(evt.helper)) pins.push(evt.helper);
  if (evt.helped && !pins.includes(evt.helped)) pins.push(evt.helped);
  if (evt.saboteur && !pins.includes(evt.saboteur)) pins.push(evt.saboteur);
  if (evt.thrower && !pins.includes(evt.thrower)) pins.push(evt.thrower);
  if (evt.partner && !pins.includes(evt.partner)) pins.push(evt.partner);
  if (evt.target && typeof evt.target === 'string' && !pins.includes(evt.target)) pins.push(evt.target);
  if (evt.eliminated && !pins.includes(evt.eliminated)) pins.push(evt.eliminated);
  if (evt.out && !pins.includes(evt.out)) pins.push(evt.out);
  if (evt.into && !pins.includes(evt.into)) pins.push(evt.into);
  if (evt.players) evt.players.forEach(p => { if (!pins.includes(p)) pins.push(p); });

  const roundLabel = evt.round ? ` · Round ${evt.round}` : (evt.segment ? ` · Segment ${evt.segment}` : '');

  const badges = [];
  if (evt.badge) badges.push(`<span class="gp-badge ${_badgeCls(evt.badgeClass)}">${evt.badge}</span>`);
  if (evt.damage) badges.push(`<span class="gp-badge gp-badge-ko">${evt.damage} DMG</span>`);

  return `<div class="gp-card ${cardClass}">
    ${stamp}
    <div class="gp-card-head">
      ${_icon(iconType)}
      <span class="gp-card-type" style="color:${typeColor}">${typeLabel}${roundLabel}</span>
      ${pins.map(p => _pin(p)).join('')}
    </div>
    <div class="gp-card-body">${evt.text || ''}</div>
    ${badges.length > 0 ? `<div class="gp-card-foot">${badges.join('')}</div>` : ''}
  </div>`;
}


// ══════════════════════════════════════════════════════════════════════
// rpBuildGPTitleCard
// ══════════════════════════════════════════════════════════════════════
export function rpBuildGPTitleCard(ep) {
  _currentEp = ep;
  const data = ep.challengeData;
  if (!data) return '<div>No challenge data</div>';
  const active = data.active || [];

  // Player grid
  let gridHtml = '<div class="gp-ts-grid">';
  active.forEach(name => {
    const tribe = _tribeForPlayer(name, ep);
    gridHtml += `<div class="gp-ts-grid-player">
      <img src="${_avatar(name)}" alt="">
      <div class="gp-ts-grid-name">${name}</div>
      ${!data.isMerged && tribe ? `<div class="gp-ts-grid-tribe">${tribe}</div>` : ''}
    </div>`;
  });
  gridHtml += '</div>';

  const content = `<div class="gp-titlescreen">
    <div class="gp-ts-corner gp-ts-corner-tl"></div>
    <div class="gp-ts-corner gp-ts-corner-tr"></div>
    <div class="gp-ts-corner gp-ts-corner-bl"></div>
    <div class="gp-ts-corner gp-ts-corner-br"></div>
    <div class="gp-ts-sky"></div>
    <div class="gp-ts-stars">
      <div class="gp-ts-star"></div><div class="gp-ts-star"></div><div class="gp-ts-star"></div>
      <div class="gp-ts-star"></div><div class="gp-ts-star"></div><div class="gp-ts-star"></div>
      <div class="gp-ts-star"></div><div class="gp-ts-star"></div>
    </div>
    <div class="gp-ts-mote"></div><div class="gp-ts-mote"></div><div class="gp-ts-mote"></div>
    <div class="gp-ts-mote"></div><div class="gp-ts-mote"></div><div class="gp-ts-mote"></div>
    <div class="gp-ts-sun"></div>
    <div class="gp-ts-flare"></div>
    <div class="gp-ts-cliff"></div>
    <div class="gp-ts-parthenon">${_parthenonSVG}</div>
    <div class="gp-ts-sea"></div>
    <div class="gp-ts-laurel">
      ${_laurelLarge}
      <div class="gp-ts-title-wrap">
        <div class="gp-ts-title">Greece's<br>Pieces</div>
        <div class="gp-ts-subtitle">Olympic Challenge</div>
      </div>
      ${_laurelLarge.replace('viewBox="0 0 56 56"', 'viewBox="0 0 56 56" style="transform:scaleX(-1)"')}
    </div>
    <div class="gp-ts-info">
      <div class="gp-ts-info-title">The Olympic Gauntlet</div>
      <div class="gp-ts-info-text">Three events. Gold medals on the line. Win the most golds to claim victory — or face the tiebreaker where wings of wax decide everything.</div>
      <div class="gp-ts-info-events">
        <div class="gp-ts-event-pill"><div class="gp-ts-event-dot gp-ts-event-dot-maze"></div><div class="gp-ts-event-label">Pillar Maze</div></div>
        <div class="gp-ts-event-pill"><div class="gp-ts-event-dot gp-ts-event-dot-wrestle"></div><div class="gp-ts-event-label">Wrestling</div></div>
        <div class="gp-ts-event-pill"><div class="gp-ts-event-dot gp-ts-event-dot-hurdle"></div><div class="gp-ts-event-label">Hurdle Race</div></div>
        <div class="gp-ts-event-pill"><div class="gp-ts-event-dot gp-ts-event-dot-icarus"></div><div class="gp-ts-event-label">Icarus</div></div>
      </div>
    </div>
    ${gridHtml}
    <div class="gp-ts-greek"></div>
  </div>`;

  return `<style>${_gpCSS()}
.gp-ts-outer{background:linear-gradient(180deg,#1a0a2e 0%,#5a2858 25%,#c46838 50%,#f0c070 75%,#0e1a30 100%);
  min-height:calc(100vh - 46px);display:flex;align-items:center;justify-content:center;padding:0;}
</style>
<div class="gp-ts-outer">
  <div class="gp-shell" style="background:transparent;border:none;min-height:auto;width:100%;max-width:1100px;">
    ${content}
  </div>
</div>`;
}


// ══════════════════════════════════════════════════════════════════════
// rpBuildGPMaze — Event I: Pillar Maze & Beast Hunt
// ══════════════════════════════════════════════════════════════════════
export function rpBuildGPMaze(ep) {
  _currentEp = ep;
  const data = ep.challengeData;
  if (!data || !data.maze) return '<div>No maze data</div>';
  const maze = data.maze;
  const stepMeta = [];
  let stepIdx = 0;
  let html = '';

  const _boarTabletSVG = `<svg class="gp-tablet-boar-svg" viewBox="0 0 28 28"><ellipse cx="14" cy="16" rx="10" ry="7" fill="#6a5a38"/><ellipse cx="14" cy="14" rx="7" ry="5" fill="#7a6a48"/><circle cx="10" cy="12" r="1.5" fill="#3a2a18"/><circle cx="18" cy="12" r="1.5" fill="#3a2a18"/><path d="M8 18 L6 22 M20 18 L22 22" stroke="#5a4a28" stroke-width="2" stroke-linecap="round"/><path d="M7 14 L4 11 M21 14 L24 11" stroke="#8a7a58" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  const _boarSilSVG = `<svg class="gp-boar-sil-svg" viewBox="0 0 100 60"><ellipse cx="50" cy="38" rx="35" ry="18" fill="currentColor"/><ellipse cx="50" cy="28" rx="22" ry="14" fill="currentColor"/><circle cx="38" cy="24" r="3" fill="currentColor"/><circle cx="62" cy="24" r="3" fill="currentColor"/><path d="M25 42 L18 55 M75 42 L82 55 M35 42 L30 55 M65 42 L70 55" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M28 30 L18 20 M72 30 L82 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;

  function _mazeCard(evt) {
    let cardClass = 'gp-card-maze';
    let iconType = 'column';
    if (evt.type === 'boar-dodge' || evt.type === 'boar-hit') { iconType = 'boar'; }
    else if (evt.type.startsWith('social-') || evt.type === 'boar-help' || evt.type === 'boar-abandon') {
      cardClass = (evt.type === 'social-tension' || evt.type === 'boar-abandon' || evt.type === 'social-confrontation') ? 'gp-card-drama' : 'gp-card-social';
      iconType = 'social';
    } else if (evt.type === 'gold-found' || evt.type === 'gold-claim' || evt.type === 'gold-found-default') {
      cardClass = 'gp-card-gold'; iconType = 'medal';
    } else if (evt.type === 'maze-sabotage') { cardClass = 'gp-card-drama'; iconType = 'social'; }
    else if (evt.type === 'zone-enter') { iconType = 'column'; }
    else if (evt.type === 'social-respect') { cardClass = 'gp-card-social'; iconType = 'social'; }
    return _eventCard(evt, cardClass, iconType);
  }

  const isGold = t => t === 'gold-found' || t === 'gold-claim' || t === 'gold-found-default';

  // ── Event banner ──
  html += `<div class="gp-event-banner">
    <div class="gp-event-banner-num">Event I</div>
    <div class="gp-event-banner-title">Pillar Maze &amp; Beast Hunt</div>
    <div class="gp-event-banner-desc">Navigate the ancient ruins. Find the gold. Survive the boar.</div>
  </div>`;

  if (data.hostCommentary && data.hostCommentary[0]) {
    html += `<div class="gp-flavor">${data.hostCommentary[0]}</div>`;
  }

  // ── Pair assignments with cross-tribe annotation ──
  function _pairNarration(a, b, crossTribe, tribe1, tribe2) {
    const aArch = arch(a), bArch = arch(b);
    const aP = pronouns(a), bP = pronouns(b);
    const aV = VILLAIN_ARCHS.has(aArch), bV = VILLAIN_ARCHS.has(bArch);
    const aN = NICE_ARCHS.has(aArch), bN = NICE_ARCHS.has(bArch);
    const aCB = aArch === 'challenge-beast', bCB = bArch === 'challenge-beast';
    const bond = getBond(a, b);
    const h = host();

    if (crossTribe) {
      if (aV && bN) return `${h} grins as ${a} and ${b} step up. "A ${tribe1} schemer paired with a ${tribe2} sweetheart — this should be interesting." ${a} already looks like ${aP.sub}'s calculating how to use ${b} as a human shield. ${b} keeps ${bP.posAdj} distance.`;
      if (bV && aN) return `${h} grins as ${b} and ${a} step up. "A ${tribe2} schemer paired with a ${tribe1} sweetheart — this should be interesting." ${b} already looks like ${bP.sub}'s calculating how to use ${a} as bait. ${a} shifts uncomfortably.`;
      if (aV && bV) return `"Two schemers, one maze," ${h} announces with barely contained glee. ${a} from ${tribe1} and ${b} from ${tribe2} size each other up — neither willing to turn their back first. The maze might not survive these two.`;
      if (aN && bN) return `${a} from ${tribe1} extends a hand to ${b} from ${tribe2}. "We got this, right?" ${b} nods, and for a moment the tribal lines blur. ${h} raises an eyebrow — "Don't get too cozy, you're still enemies after this."`;
      if (aCB || bCB) return `${h} watches ${a} and ${b} stretch at the maze entrance. "Cross-tribe muscle right here — ${tribe1} meets ${tribe2}." ${aCB ? a : b} rolls ${(aCB ? aP : bP).posAdj} shoulders, already eyeing the pillars. ${aCB ? b : a} tries to keep up with the warm-up pace.`;
      if (bond > 3) return `Despite wearing different colors — ${tribe1} and ${tribe2} — ${a} and ${b} share a look that says they've been waiting for this. ${h} catches it: "I see that look. Don't forget where your loyalties lie."`;
      if (bond < -3) return `${h} couldn't look happier. "${a} from ${tribe1}, meet your partner: ${b} from ${tribe2}." The temperature drops. These two can barely stand each other on a good day — now they're stuck navigating a labyrinth together.`;
      return `"${tribe1} and ${tribe2}, forced to cooperate!" ${h} announces. ${a} and ${b} approach the maze entrance from opposite sides, studying each other. Neither wants to lead. Neither wants to follow. The maze waits for no one.`;
    }

    if (aV && bN) return `${a} turns to ${b} with a grin that doesn't reach ${aP.posAdj} eyes. "Stay behind me." ${b} wisely keeps one eye on the maze and one on ${aP.posAdj} partner. ${h}: "Trust issues already — love it."`;
    if (bV && aN) return `${b} turns to ${a} with a grin that doesn't reach ${bP.posAdj} eyes. "I'll take point." ${a} wisely keeps one eye on the maze and one on ${bP.posAdj} partner. ${h}: "Trust issues already — love it."`;
    if (aCB && bCB) return `Two competitors who live for moments like this. ${a} and ${b} lock eyes at the entrance — no words needed. ${h}: "Ladies and gentlemen, the dream team nobody asked for. These two might actually break the maze."`;
    if (bond > 5) return `${a} and ${b} step forward together, shoulders nearly touching. There's an easy rhythm between them — they've been through enough to trust each other blind in a dark labyrinth. ${h}: "Well isn't that adorable."`;
    if (bond < -4) return `${h} draws the pair and can barely contain himself. "${a} and ${b} — together!" The hatred is immediate and mutual. ${a} starts walking without waiting. ${b} goes the opposite direction. This is going to be a disaster.`;
    if (aArch === 'wildcard' || bArch === 'wildcard') { const wc = aArch === 'wildcard' ? a : b; const other = wc === a ? b : a; return `${wc} peers into the maze and starts laughing. "Oh this is gonna be FUN." ${other} looks significantly less excited. ${h}: "I give them three turns before someone gets abandoned."` }
    if (aArch === 'chaos-agent' || bArch === 'chaos-agent') { const ca = aArch === 'chaos-agent' ? a : b; const other = ca === a ? b : a; return `${ca} immediately tries to climb one of the pillars instead of walking through the maze. ${other} grabs ${(ca === a ? aP : bP).posAdj} ankle. "We're supposed to go THROUGH it." ${h} sighs.`; }
    return pick([
      () => `${h} gestures them forward. "Into the labyrinth." ${a} grabs a torch from the wall as ${b} studies the entrance. Neither speaks — but the competitive tension between them is thick enough to cut.`,
      () => `${a} stretches while ${b} bounces on ${bP.posAdj} heels, scanning the maze. "Who's navigating?" ${a} asks. ${b}'s answer is to walk straight in. ${a} scrambles to follow. ${h}: "And they're off — sort of."`,
      () => `The maze swallows them whole. ${a} takes the left fork, ${b} takes the right — then they realize they're supposed to be a team. An awkward three seconds of backing up before they pick a path together. ${h} is already laughing.`,
      () => `${a} cracks ${aP.posAdj} neck. ${b} rolls ${bP.posAdj} shoulders. They share one look at the labyrinth entrance — pillars stretching into shadow — and a silent agreement passes between them: don't die.`,
    ])();
  }
  if (maze.pairs) {
    maze.pairs.forEach((pair, pi) => {
      if (pair.length >= 2) {
        const tribe1 = _tribeForPlayer(pair[0], ep);
        const tribe2 = _tribeForPlayer(pair[1], ep);
        const tc1 = _tribeColorFromEp(tribe1, ep);
        const tc2 = _tribeColorFromEp(tribe2, ep);
        const crossTribe = !data.isMerged && tribe1 && tribe2 && tribe1 !== tribe2;
        const pairLabel = crossTribe
          ? `<div style="text-align:center;font-family:Cinzel,serif;font-size:11px;color:#a08850;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">Cross-Tribe Pair · <span style="color:${tc1}">${tribe1}</span> × <span style="color:${tc2}">${tribe2}</span></div>`
          : (!data.isMerged && tribe1 ? `<div style="text-align:center;font-family:Cinzel,serif;font-size:11px;color:${tc1 || '#a08850'};letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">${tribe1} Pair</div>` : '');
        const reaction = _pairNarration(pair[0], pair[1], crossTribe, tribe1, tribe2);
        html += `<div class="gp-step-hidden" id="gp-step-maze-${stepIdx}">
          ${pairLabel}
          <div class="gp-vs"${crossTribe ? ` style="border-image:linear-gradient(90deg,${tc1},#8a6c38,${tc2}) 1"` : ''}>
            <div class="gp-vs-player">
              <img class="gp-vs-avatar" src="${_avatar(pair[0])}" alt=""${tc1 ? ` style="border-color:${tc1}"` : ''}>
              <div class="gp-vs-name">${pair[0]}</div>
              ${!data.isMerged && tribe1 ? `<div style="font-size:11px;color:${tc1 || '#8a7850'};font-family:Cinzel,serif">${tribe1}</div>` : ''}
            </div>
            <div class="gp-vs-label">&amp;</div>
            <div class="gp-vs-player">
              <img class="gp-vs-avatar" src="${_avatar(pair[1])}" alt=""${tc2 ? ` style="border-color:${tc2}"` : ''}>
              <div class="gp-vs-name">${pair[1]}</div>
              ${!data.isMerged && tribe2 ? `<div style="font-size:11px;color:${tc2 || '#8a7850'};font-family:Cinzel,serif">${tribe2}</div>` : ''}
            </div>
          </div>
          <div class="gp-zone-flavor">${reaction}</div>
        </div>`;
        stepMeta.push({ phase: 'maze', type: 'pair' });
        stepIdx++;
      }
    });
  }

  // ── Initial stone tablet — boar sleeping ──
  html += `<div class="gp-step-hidden" id="gp-step-maze-${stepIdx}">
    <div class="gp-tablet">
      <div class="gp-tablet-icon">${_boarTabletSVG}</div>
      <div class="gp-tablet-body">
        <div class="gp-tablet-title">The Erymanthian Boar</div>
        <div class="gp-tablet-status">Sleeping deep in the ruins...</div>
      </div>
      <div class="gp-tablet-cracks"></div>
    </div>
  </div>`;
  stepMeta.push({ phase: 'maze', type: 'boar-tablet' });
  stepIdx++;

  // ── Per-round depth sections ──
  maze.rounds.forEach((round, rIdx) => {
    const rNum = rIdx + 1;
    const depthCls = `gp-depth-r${Math.min(rNum, 5)}`;

    // Round divider
    if (rIdx > 0) {
      const dividerTexts = [
        `Deeper Into the Maze — Round ${rNum}`,
        `The Pillars Close In — Round ${rNum}`,
        `Further From Daylight — Round ${rNum}`,
        `The Labyrinth Tightens — Round ${rNum}`,
        `Into the Dark — Round ${rNum}`,
      ];
      html += `<div class="gp-step-hidden" id="gp-step-maze-${stepIdx}">
        <div class="gp-depth-divider">
          <span class="gp-depth-divider-line"></span>
          <span class="gp-depth-divider-text">${dividerTexts[Math.min(rIdx, dividerTexts.length - 1)]}</span>
          <span class="gp-depth-divider-line"></span>
        </div>
      </div>`;
      stepMeta.push({ phase: 'maze', type: 'depth-divider', round: rNum });
      stepIdx++;
    }

    // Open depth section
    html += `<div class="gp-depth-section ${depthCls}">
      <div class="gp-depth-pillars"></div>`;

    // Boar silhouettes in later rounds
    if (rNum >= 3) {
      html += `<div class="gp-boar-sil gp-boar-sil-r${Math.min(rNum, 5)}" style="color:#6a5a38">${_boarSilSVG}</div>`;
    }

    // Render events for this round
    round.events.forEach(evt => {
      const isGoldEvt = isGold(evt.type);
      const wrapper = isGoldEvt ? '<div class="gp-gold-burst">' : '';
      const wrapperEnd = isGoldEvt ? '</div>' : '';

      // Zone-enter events get zone label + flavor text
      if (evt.type === 'zone-enter') {
        const zoneDotCls = `gp-zone-dot-${evt.zone || 'colonnade'}`;
        html += `<div class="gp-step-hidden" id="gp-step-maze-${stepIdx}">
          <div class="gp-zone-label"><span class="gp-zone-dot ${zoneDotCls}"></span>${evt.zoneName || 'Unknown Zone'} · Round ${rNum}</div>
          ${_mazeCard(evt)}
          ${evt.flavor ? `<div class="gp-zone-flavor">${evt.flavor}</div>` : ''}
        </div>`;
      } else {
        html += `<div class="gp-step-hidden" id="gp-step-maze-${stepIdx}">
          ${wrapper}${_mazeCard(evt)}${wrapperEnd}
        </div>`;
      }
      stepMeta.push({ phase: 'maze', type: evt.type, round: rNum });
      stepIdx++;
    });

    // Close depth section
    html += `</div>`;

    // Stone tablet escalation between rounds
    if (rIdx < maze.rounds.length - 1) {
      const level = rIdx + 1;
      const isEnraged = level >= 3;
      const cracks = Array.from({ length: Math.min(level * 2, 5) }, (_, i) =>
        `<div class="gp-tablet-crack gp-tablet-crack-${i + 1}"></div>`).join('');
      const statusTexts = ['Stirring... hooves scrape stone', 'Agitated — snorting through the corridors', 'Enraged — charging through the maze!', 'BERSERK — destroying pillars in its path!'];
      html += `<div class="gp-step-hidden" id="gp-step-maze-${stepIdx}">
        <div class="gp-tablet${isEnraged ? ' gp-tablet-enraged' : ''}">
          <div class="gp-tablet-icon">${_boarTabletSVG}</div>
          <div class="gp-tablet-body">
            <div class="gp-tablet-title">The Erymanthian Boar</div>
            <div class="gp-tablet-status">${statusTexts[Math.min(level - 1, statusTexts.length - 1)]}</div>
          </div>
          <div class="gp-tablet-cracks">${cracks}</div>
        </div>
      </div>`;
      stepMeta.push({ phase: 'maze', type: 'boar-tablet', round: rNum });
      stepIdx++;
    }
  });

  const totalSteps = stepIdx;
  if (typeof window !== 'undefined') {
    window._gpMazeStepMeta = stepMeta;
    window._gpMazeZoneData = maze.rounds.map(r => r.zoneAssignments || []);
    window._gpMazePairs = maze.pairs || [];
  }
  return _gpShell(html, ep, 'gp-maze', totalSteps);
}


// ══════════════════════════════════════════════════════════════════════
// rpBuildGPWrestling — Event II: Wrestling
// ══════════════════════════════════════════════════════════════════════
export function rpBuildGPWrestling(ep) {
  _currentEp = ep;
  const data = ep.challengeData;
  if (!data || !data.wrestling) return '<div>No wrestling data</div>';
  const wrestling = data.wrestling;
  const stepMeta = [];
  let stepIdx = 0;
  let html = '';

  // Between-event flavor
  if (data.hostCommentary && data.hostCommentary[0]) {
    html += `<div class="gp-flavor">${data.hostCommentary[0]}</div>`;
  }

  // Event banner
  html += `<div class="gp-event-banner">
    <div class="gp-event-banner-num">Event II</div>
    <div class="gp-event-banner-title">Tag-Team Wrestling</div>
    <div class="gp-event-banner-desc">Pairs enter the ring. Chaos determines who leaves it.</div>
  </div>`;

  // Initial HP bars
  if (wrestling.teams) {
    let hpHtml = `<div class="gp-card gp-card-wrestle" style="padding:14px">
      <div class="gp-card-head">
        ${_icon('fist')}
        <span class="gp-card-type" style="color:#b85c38">Arena Status</span>
      </div>`;
    wrestling.teams.forEach((team, tIdx) => {
      team.fighters.forEach((fighter, fIdx) => {
        hpHtml += `<div class="gp-hp-bar">
          <div class="gp-hp-name">${fighter}</div>
          <div class="gp-hp-track"><div class="gp-hp-fill gp-hp-full"></div></div>
          <div class="gp-hp-pct">100%</div>
        </div>`;
      });
      if (tIdx < wrestling.teams.length - 1) {
        hpHtml += `<div style="height:6px;border-bottom:1px dashed rgba(184,92,56,.3);margin:4px 0"></div>`;
      }
    });
    hpHtml += `</div>`;
    html += `<div class="gp-step-hidden" id="gp-step-wrestling-${stepIdx}">${hpHtml}</div>`;
    stepMeta.push({ phase: 'wrestling', type: 'hp-status' });
    stepIdx++;
  }

  // Round events
  wrestling.rounds.forEach(round => {
    round.events.forEach(evt => {
      let cardClass = 'gp-card-wrestle';
      let iconType = 'fist';

      if (evt.type === 'betrayal' || evt.type === 'throw-partner') {
        cardClass = 'gp-card-drama';
        iconType = 'social';
      } else if (evt.type === 'tag-in') {
        cardClass = 'gp-card-wrestle';
      } else if (evt.type === 'ko') {
        cardClass = 'gp-card-wrestle';
      } else if (evt.type === 'flashy-hit') {
        cardClass = 'gp-card-wrestle';
      } else if (evt.type === 'flashy-miss') {
        cardClass = 'gp-card-wrestle';
      }

      html += `<div class="gp-step-hidden" id="gp-step-wrestling-${stepIdx}">
        ${_eventCard(evt, cardClass, iconType)}
      </div>`;
      stepMeta.push({ phase: 'wrestling', type: evt.type, round: round.round });
      stepIdx++;
    });
  });

  // Social events from wrestling
  if (wrestling.matches) {
    wrestling.matches.forEach(evt => {
      const cardClass = evt.type === 'social-confrontation' ? 'gp-card-drama' : 'gp-card-social';
      html += `<div class="gp-step-hidden" id="gp-step-wrestling-${stepIdx}">
        ${_eventCard(evt, cardClass, 'social')}
      </div>`;
      stepMeta.push({ phase: 'wrestling', type: evt.type });
      stepIdx++;
    });
  }

  // Wrestling gold medal card
  if (wrestling.goldWinner) {
    const goldEvt = {
      type: 'gold-found',
      player: wrestling.goldWinner,
      text: `${wrestling.goldWinner} stands victorious in the arena! The gold medal is awarded.`,
      badge: wrestling.goldTribe ? `GOLD — ${wrestling.goldTribe.toUpperCase()}` : `GOLD — ${wrestling.goldWinner.toUpperCase()}`,
      badgeClass: 'gold'
    };
    html += `<div class="gp-step-hidden" id="gp-step-wrestling-${stepIdx}">
      ${_eventCard(goldEvt, 'gp-card-gold', 'medal')}
    </div>`;
    stepMeta.push({ phase: 'wrestling', type: 'gold' });
    stepIdx++;
  }

  const totalSteps = stepIdx;
  if (typeof window !== 'undefined') window._gpWrestlingStepMeta = stepMeta;
  return _gpShell(html, ep, 'gp-wrestling', totalSteps);
}


// ══════════════════════════════════════════════════════════════════════
// rpBuildGPHurdles — Event III: Hurdle Race
// ══════════════════════════════════════════════════════════════════════
export function rpBuildGPHurdles(ep) {
  _currentEp = ep;
  const data = ep.challengeData;
  if (!data || !data.hurdles) return '<div>No hurdles data</div>';
  const hurdles = data.hurdles;
  const stepMeta = [];
  let stepIdx = 0;
  let html = '';

  // Between-event flavor
  if (data.hostCommentary && data.hostCommentary[1]) {
    html += `<div class="gp-flavor">${data.hostCommentary[1]}</div>`;
  }

  // Event banner
  html += `<div class="gp-event-banner">
    <div class="gp-event-banner-num">Event III</div>
    <div class="gp-event-banner-title">Hurdle Race</div>
    <div class="gp-event-banner-desc">Sprint. Jump. Don't show off... or do. Your funeral.</div>
  </div>`;

  // Hurdle track visualization
  if (hurdles.runners && hurdles.segments) {
    let trackHtml = `<div class="gp-card gp-card-hurdle" style="padding:14px">
      <div class="gp-card-head">
        ${_icon('hurdle')}
        <span class="gp-card-type" style="color:#4a7ab8">Race Progress</span>
      </div>
      <div class="gp-hurdle-track">`;

    hurdles.runners.forEach(runner => {
      trackHtml += `<div class="gp-hurdle-row">
        <div class="gp-hurdle-name">${runner.name}</div>
        <div class="gp-hurdle-segments">`;

      // Build segment visualization from events
      const SEGMENTS = 6;
      for (let seg = 0; seg < SEGMENTS; seg++) {
        const segData = hurdles.segments[seg];
        if (segData) {
          const playerEvt = segData.events.find(e => e.player === runner.name);
          if (playerEvt) {
            if (playerEvt.type === 'showoff-success') {
              trackHtml += `<div class="gp-hurdle-seg gp-seg-showoff">SHOW</div>`;
            } else if (playerEvt.type === 'showoff-wipeout') {
              trackHtml += `<div class="gp-hurdle-seg gp-seg-wipe">WIPE</div>`;
            } else {
              trackHtml += `<div class="gp-hurdle-seg gp-seg-safe">RUN</div>`;
            }
          } else {
            trackHtml += `<div class="gp-hurdle-seg gp-seg-pending">---</div>`;
          }
        } else {
          trackHtml += `<div class="gp-hurdle-seg gp-seg-pending">---</div>`;
        }
      }

      trackHtml += `</div>
        <div class="gp-hurdle-time">${runner.time.toFixed(1)}s</div>
      </div>`;
    });

    trackHtml += `</div></div>`;
    html += `<div class="gp-step-hidden" id="gp-step-hurdles-${stepIdx}">${trackHtml}</div>`;
    stepMeta.push({ phase: 'hurdles', type: 'track' });
    stepIdx++;
  }

  // Segment events
  hurdles.segments.forEach(seg => {
    seg.events.forEach(evt => {
      html += `<div class="gp-step-hidden" id="gp-step-hurdles-${stepIdx}">
        ${_eventCard(evt, 'gp-card-hurdle', 'hurdle')}
      </div>`;
      stepMeta.push({ phase: 'hurdles', type: evt.type, segment: seg.segment });
      stepIdx++;
    });
  });

  // Hurdles gold medal card
  if (hurdles.goldWinner) {
    const goldEvt = {
      type: 'gold-found',
      player: hurdles.goldWinner,
      text: `${hurdles.goldWinner} crosses the finish line first! The hurdle gold is theirs.`,
      badge: hurdles.goldTribe ? `GOLD — ${hurdles.goldTribe.toUpperCase()}` : `GOLD — ${hurdles.goldWinner.toUpperCase()}`,
      badgeClass: 'gold'
    };
    html += `<div class="gp-step-hidden" id="gp-step-hurdles-${stepIdx}">
      ${_eventCard(goldEvt, 'gp-card-gold', 'medal')}
    </div>`;
    stepMeta.push({ phase: 'hurdles', type: 'gold' });
    stepIdx++;
  }

  const totalSteps = stepIdx;
  if (typeof window !== 'undefined') window._gpHurdlesStepMeta = stepMeta;
  return _gpShell(html, ep, 'gp-hurdles', totalSteps);
}


// ══════════════════════════════════════════════════════════════════════
// rpBuildGPIcarus — Tiebreaker: Wings of Icarus
// ══════════════════════════════════════════════════════════════════════
export function rpBuildGPIcarus(ep) {
  _currentEp = ep;
  const data = ep.challengeData;
  if (!data || !data.icarus) return '<div>No Icarus data</div>';
  const icarus = data.icarus;
  const stepMeta = [];
  let stepIdx = 0;
  let html = '';

  // Event banner (blue background for Icarus)
  html += `<div class="gp-event-banner" style="border-color:#d4a844;background:linear-gradient(180deg,#2a3a5c 0%,#1e2d4a 100%);">
    <div class="gp-event-banner-num" style="color:#d4a844">Tiebreaker</div>
    <div class="gp-event-banner-title" style="color:#f0d870">Wings of Icarus</div>
    <div class="gp-event-banner-desc" style="color:#a0b8d0">Wax wings. One medal. Don't fly too close to the sun.</div>
  </div>`;

  // Altitude tracker
  if (icarus.state && icarus.participants) {
    let altHtml = `<div class="gp-card gp-card-icarus" style="padding:14px">
      <div class="gp-card-head">
        ${_icon('wing')}
        <span class="gp-card-type" style="color:#c9a84c">Altitude &amp; Wing Integrity</span>
      </div>
      <div class="gp-icarus-alt">`;

    icarus.participants.forEach(name => {
      const st = icarus.state[name] || { altitude: 0, integrity: 0 };
      const altPct = Math.min(100, (st.altitude / 5.0) * 100);
      const integ = st.integrity;
      // Wing segments: 4 blocks
      const wingCount = 4;
      const wingBlocks = [];
      for (let w = 0; w < wingCount; w++) {
        const threshold = (wingCount - w) * (100 / wingCount);
        if (integ >= threshold) wingBlocks.push('gp-wing-ok');
        else if (integ >= threshold - 15) wingBlocks.push('gp-wing-melting');
        else wingBlocks.push('gp-wing-gone');
      }

      altHtml += `<div class="gp-icarus-row">
        <div class="gp-icarus-name">${name}</div>
        <div class="gp-icarus-bar">
          <div class="gp-icarus-fill" style="width:${altPct}%"></div>
          <div class="gp-icarus-medal"></div>
        </div>
        <div class="gp-icarus-wings">
          ${wingBlocks.map(cls => `<div class="gp-icarus-wing ${cls}"></div>`).join('')}
        </div>
      </div>`;
    });

    altHtml += `</div></div>`;
    html += `<div class="gp-step-hidden" id="gp-step-icarus-${stepIdx}">${altHtml}</div>`;
    stepMeta.push({ phase: 'icarus', type: 'altitude-tracker' });
    stepIdx++;
  }

  // Round events
  icarus.rounds.forEach(round => {
    round.events.forEach(evt => {
      let cardClass = 'gp-card-icarus';
      if (evt.type === 'collapse') {
        cardClass = 'gp-card-icarus';
      } else if (evt.type === 'medal-grab') {
        cardClass = 'gp-card-gold';
      }

      html += `<div class="gp-step-hidden" id="gp-step-icarus-${stepIdx}">
        ${_eventCard(evt, cardClass, 'wing')}
      </div>`;
      stepMeta.push({ phase: 'icarus', type: evt.type, round: round.round });
      stepIdx++;
    });
  });

  // If icarus winner was determined by highest altitude (no medal-grab event)
  const hasMedalGrab = icarus.rounds.some(r => r.events.some(e => e.type === 'medal-grab'));
  if (!hasMedalGrab && icarus.winner) {
    const goldEvt = {
      type: 'gold-found',
      player: icarus.winner,
      text: `${icarus.winner} reached the highest altitude! The tiebreaker gold is awarded.`,
      badge: 'TIEBREAKER GOLD',
      badgeClass: 'gold'
    };
    html += `<div class="gp-step-hidden" id="gp-step-icarus-${stepIdx}">
      ${_eventCard(goldEvt, 'gp-card-gold', 'medal')}
    </div>`;
    stepMeta.push({ phase: 'icarus', type: 'gold' });
    stepIdx++;
  }

  const totalSteps = stepIdx;
  if (typeof window !== 'undefined') window._gpIcarusStepMeta = stepMeta;
  return _gpShell(html, ep, 'gp-icarus', totalSteps);
}


// ══════════════════════════════════════════════════════════════════════
// rpBuildGPResults — Final Results
// ══════════════════════════════════════════════════════════════════════
export function rpBuildGPResults(ep) {
  _currentEp = ep;
  const data = ep.challengeData;
  if (!data) return '<div>No challenge data</div>';
  const golds = data.golds || {};
  const isMerged = data.isMerged;
  const scores = ep.chalMemberScores || {};
  const active = data.active || [];
  let stepIdx = 0;
  let html = '';

  // Winner announcement
  const winner = isMerged ? data.overallWinner : data.winningTribe;
  html += `<div class="gp-step-hidden" id="gp-step-results-${stepIdx}">
    <div class="gp-final-winner">
      <div class="gp-final-winner-label">${isMerged ? 'Olympic Champion' : 'Winning Tribe'}</div>
      <div class="gp-final-winner-name">${winner || 'TBD'}</div>
      ${isMerged && winner ? `<img src="${_avatar(winner)}" alt="">` : ''}
    </div>
  </div>`;
  stepIdx++;

  // Gold medal tally
  let tallyHtml = '<div class="gp-final-tally">';
  if (isMerged) {
    const rankedPlayers = [...active].sort((a, b) => (golds[b] || 0) - (golds[a] || 0));
    rankedPlayers.forEach(name => {
      const g = golds[name] || 0;
      if (g > 0) {
        const dots = Array.from({ length: g }, () => `<div class="gp-lb-gold-dot"></div>`).join('');
        tallyHtml += `<div class="gp-final-tally-item">
          <div class="gp-final-tally-name">${name}</div>
          <div class="gp-final-tally-golds">${dots}</div>
        </div>`;
      }
    });
  } else {
    const tribeRankings = data.tribeRankings || [];
    tribeRankings.forEach(t => {
      const dots = Array.from({ length: t.goldCount || 0 }, () => `<div class="gp-lb-gold-dot"></div>`).join('');
      tallyHtml += `<div class="gp-final-tally-item">
        <div class="gp-final-tally-name">${t.tribeName}</div>
        <div class="gp-final-tally-golds">${dots}</div>
      </div>`;
    });
  }
  tallyHtml += '</div>';

  html += `<div class="gp-step-hidden" id="gp-step-results-${stepIdx}">${tallyHtml}</div>`;
  stepIdx++;

  // Final leaderboard
  let lbHtml = `<div class="gp-right-header" style="margin-top:8px">Final Standings</div>
    <div class="gp-leaderboard" style="max-width:400px;margin:0 auto;">`;
  const ranked = [...active].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  ranked.forEach((name, i) => {
    const rankCls = i === 0 ? ' gp-lb-rank-1' : (i === 1 ? ' gp-lb-rank-2' : (i === 2 ? ' gp-lb-rank-3' : ''));
    const playerGolds = isMerged ? (golds[name] || 0) : 0;
    const goldDots = Array.from({ length: playerGolds }, () => `<div class="gp-lb-gold-dot"></div>`).join('');
    const score = scores[name] || 0;
    lbHtml += `<div class="gp-lb-row">
      <div class="gp-lb-rank${rankCls}">${i + 1}</div>
      <img class="gp-lb-avatar" src="${_avatar(name)}" alt="">
      <div class="gp-lb-name">${name}</div>
      <div class="gp-lb-golds">${goldDots}</div>
      <div class="gp-lb-score">+${score}</div>
    </div>`;
  });
  lbHtml += '</div>';

  html += `<div class="gp-step-hidden" id="gp-step-results-${stepIdx}">${lbHtml}</div>`;
  stepIdx++;

  const totalSteps = stepIdx;
  return _gpShell(html, ep, 'gp-results', totalSteps);
}


// ══════════════════════════════════════════════════════════════════════
// REVEAL HANDLERS
// ══════════════════════════════════════════════════════════════════════
function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`gp-step-${suffix}-${i}`);
    if (el) el.classList.add('gp-step-visible');
  }
  const counter = document.getElementById(`gp-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`gp-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.gp-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

function _gpUpdateZoneMap(screenKey) {
  try {
    if (screenKey !== 'gp-maze') return;
    const mapEl = document.getElementById('gp-zone-map-inner');
    if (!mapEl) return;
    const epIdx = window.vpEpNum;
    const epRecord = gs.episodeHistory && gs.episodeHistory[epIdx - 1];
    if (!epRecord) return;
    mapEl.innerHTML = _buildZoneMapSVG(epRecord, screenKey);
  } catch (e) {}
}

export function gpRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('gp-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch (e) {}
  try {
    const el = document.getElementById(`gp-step-${suffix}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) {}
  try { _gpUpdateZoneMap(screenKey); } catch (e) {}
}

export function gpRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('gp-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch (e) {}
  try { _gpUpdateZoneMap(screenKey); } catch (e) {}
}
