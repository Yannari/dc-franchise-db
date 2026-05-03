// ── Broadway Baby — 3-phase pre-merge tribe challenge ──
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

/* ── local helpers ── */
function noise(range) { return (Math.random() - 0.5) * range; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ── narration text pools ── */

const CLIMB_SUCCESS = [
  (n, p, seg) => `${n} hauls ${p.ref} up segment ${seg} with raw determination.`,
  (n, p, seg) => `Gripping the rope with both hands, ${n} powers through segment ${seg}.`,
  (n, p, seg) => `${p.Sub} scales segment ${seg} like ${p.sub} was born for it.`,
  (n, p, seg) => `${n} finds a foothold and vaults up to segment ${seg} in one fluid motion.`,
  (n, p, seg) => `With a grunt of effort, ${n} conquers segment ${seg} of the Colossus.`,
];

const CLIMB_SLIP = [
  (n, p) => `${n} loses ${p.posAdj} grip and slides back down the rope.`,
  (n, p) => `${p.Sub} scrambles for purchase but the statue is too slick.`,
  (n, p) => `${n}'s hands slip — ${p.sub} dangles helplessly for a moment.`,
  (n, p) => `A gust of wind catches ${n} off guard and ${p.sub} tumbles backward.`,
  (n, p) => `${n} reaches for the next handhold but comes up short.`,
];

const CLIMB_SHOWOFF = [
  (n, p) => `${n} LAUNCHES past an entire segment — the crowd goes wild!`,
  (n, p) => `${p.Sub} free-climbs without the rope, skipping a whole section!`,
  (n, p) => `${n} muscles up two segments at once like it's nothing!`,
  (n, p) => `Show-off alert: ${n} literally RUNS up the statue face!`,
];

const ROPE_BURN = [
  (n, p) => `${n} winces — nasty rope burn across ${p.posAdj} palms.`,
  (n, p) => `The friction leaves angry red marks on ${n}'s hands.`,
  (n, p) => `${p.Sub} shakes out ${p.posAdj} hands — the rope tore skin.`,
  (n, p) => `${n} grits ${p.posAdj} teeth through the sting of shredded rope fibers.`,
];

const STUCK_IN_STATUE = [
  (n, p, rescuer) => `${n} gets wedged in the Chris statue's nostril! ${rescuer} climbs back down to pull ${p.obj} free.`,
  (n, p, rescuer) => `${p.Sub} slips into a gap between Chris's teeth — ${rescuer} hauls ${p.obj} out by the ankles.`,
  (n, p, rescuer) => `${n} is trapped behind the statue's ear! ${rescuer} rappels over to the rescue.`,
  (n, p, rescuer) => `${n} somehow gets stuck in Chris's nostril cavity. ${rescuer} heroically goes back for ${p.obj}.`,
];

const ROPE_SNAP = [
  () => `A rope SNAPS — the whole tribe freezes as it swings loose!`,
  () => `Steel wool gives way with a sickening twang!`,
  () => `One of the climbing ropes frays and drops — momentary panic!`,
  () => `CRACK! A rope line snaps against the statue's face.`,
];

const POLE_GOOD = [
  (n, p) => `${n} slides down the fire pole with practiced ease.`,
  (n, p) => `${p.Sub} grips the pole and descends smoothly — no drama.`,
  (n, p) => `${n} hits the pole and glides to the bottom like a firefighter.`,
  (n, p) => `Clean descent for ${n} — ${p.sub} sticks the landing perfectly.`,
];

const POLE_BAD = [
  (n, p) => `${n} loses control on the pole and tumbles the last few feet.`,
  (n, p) => `${p.Sub} grabs the pole too late and drops like a sack of potatoes.`,
  (n, p) => `${n} spirals down the pole in a tangle of limbs.`,
  (n, p) => `Not ${n}'s finest moment — ${p.sub} bonks every rung on the way down.`,
];

const POLE_CRASH = [
  (n, p) => `${n} LAUNCHES off the pole and faceplants into the mat — spectacular!`,
  (n, p) => `${p.Sub} does a full backflip off the pole and belly-flops. The crowd LOVES it.`,
  (n, p) => `${n} misses the pole entirely and bounces off the crash pad like a pinball.`,
  (n, p) => `Epic wipeout: ${n} cartwheels off the pole and skids across the platform.`,
];

const NAV_GOOD = [
  (n, p) => `${n} reads the tunnel markers and steers them true.`,
  (n, p) => `${p.Sub} picks the right tunnel without hesitation — good instincts.`,
  (n, p) => `${n} spots the arrow markings and threads the boat through cleanly.`,
  (n, p) => `Smooth sailing — ${n} keeps the boat on course through the darkness.`,
  (n, p) => `${n} navigates the junction perfectly. Not a second wasted.`,
  (n, p) => `"This way!" ${n} steers confidently through the murky fork.`,
  (n, p) => `${p.Sub} squints through the gloom and finds the correct tunnel. Nice.`,
  (n, p) => `${n} guides the boat around a tight bend without scraping the walls.`,
];

const WRONG_TURN = [
  (n, p) => `${n} steers them straight into a dead end — precious seconds wasted.`,
  (n, p) => `"Left! ...No wait, RIGHT!" ${n} picks the wrong tunnel.`,
  (n, p) => `${p.Sub} confidently leads the boat into a brick wall.`,
  (n, p) => `${n} misreads the tunnel markers and takes them on a scenic detour.`,
  (n, p) => `The sewer forks and ${n} guesses wrong — the boat has to reverse.`,
];

const NAV_BLAME = [
  (blamer, nav, bp, np) => `${blamer} snaps at ${nav}: "Nice navigating, genius."`,
  (blamer, nav, bp, np) => `"Are you even LOOKING at the map?!" ${blamer} glares at ${nav}.`,
  (blamer, nav, bp, np) => `${blamer} mutters under ${bp.posAdj} breath about ${nav}'s sense of direction.`,
  (blamer, nav, bp, np) => `${blamer} throws ${bp.posAdj} hands up: "${nav}, you're getting us killed down here!"`,
];

const BAD_PADDLE = [
  (n, p) => `${n}'s paddle strokes are all over the place — more splashing than propelling.`,
  (n, p) => `${p.Sub} accidentally paddles in circles.`,
  (n, p) => `${n} catches a paddle blade on the tunnel wall and nearly drops it.`,
  (n, p) => `Weak paddling from ${n} — the boat barely moves.`,
];

const LOW_PIPE_HIT = [
  (n, p) => `${n} doesn't duck in time — CLANG! Right off a low pipe.`,
  (n, p) => `${p.Sub} takes a pipe to the forehead and sees stars.`,
  (n, p) => `LOW BRIDGE! ${n} catches it right across the shoulders.`,
  (n, p) => `${n} sits up at the wrong moment and eats a faceful of iron pipe.`,
];

const LOW_PIPE_DODGE = [
  (n, p) => `${n} ducks just in time — the pipe whistles over ${p.posAdj} head.`,
  (n, p) => `"DUCK!" ${n} flattens ${p.ref} as a pipe sweeps past.`,
  (n, p) => `${p.Sub} limbo-slides under the low pipe with inches to spare.`,
  (n, p) => `${n} spots the pipe early and pulls everyone down.`,
];

const RATS_PANIC = [
  (n, p) => `${n} SCREAMS as a wave of sewer rats pours over the boat!`,
  (n, p) => `${p.Sub} freaks out — rats everywhere, climbing up ${p.posAdj} legs!`,
  (n, p) => `Rats swarm the deck and ${n} loses it, flailing wildly.`,
  (n, p) => `${n} leaps onto the boat's edge in terror as rats flood the hull.`,
];

const RATS_BRAVE = [
  (n, p) => `Rats pour in but ${n} calmly brushes them aside. No big deal.`,
  (n, p) => `${p.Sub} sees the rats, shrugs, and keeps paddling. Ice cold.`,
  (n, p) => `${n} picks up a rat, examines it, and tosses it overboard. Unbothered.`,
  (n, p) => `While everyone panics about rats, ${n} just focuses on the route.`,
];

const CURRENT_FAIL = [
  (tribe) => `A surge of sewer current slams into ${tribe}'s boat — they're pushed backward!`,
  (tribe) => `${tribe}'s boat gets caught in a whirlpool of... things best not identified.`,
  (tribe) => `The current overpowers ${tribe}'s paddlers and drags them downstream.`,
  (tribe) => `A wall of water crashes through the tunnel and sends ${tribe} spinning.`,
];

const CURRENT_RIDE = [
  (tribe) => `${tribe} catches the current perfectly — the boat SURGES forward!`,
  (tribe) => `The current carries ${tribe}'s boat like a leaf on a river. Fast!`,
  (tribe) => `${tribe} rides the sewer rapids like white-water pros!`,
  (tribe) => `Smart work — ${tribe} angles the boat to ride the current's momentum.`,
];

const FORK_WRONG = [
  (nav, p) => `${nav} picks the wrong fork — this tunnel loops back on itself!`,
  (nav, p) => `"Trust me, it's this way." It was not, in fact, that way.`,
  (nav, p) => `${p.Sub} leads them into a maintenance dead-end. Total backtrack.`,
  (nav, p) => `${nav}'s gut feeling leads them into the wrong pipe junction.`,
];

const FORK_RIGHT = [
  (nav, p) => `${nav} reads the tunnel markers perfectly — shortcut found!`,
  (nav, p) => `"This way!" ${nav}'s instinct pays off — express route!`,
  (nav, p) => `${p.Sub} spots a narrow side tunnel that cuts half the distance.`,
  (nav, p) => `${nav} recognizes the junction layout and picks the fast lane.`,
];

const LEAK_FAIL = [
  (n, p) => `The boat springs a leak and ${n} can't patch it fast enough!`,
  (n, p) => `Water pouring in! ${n} tries to plug the hole but it keeps growing.`,
  (n, p) => `${p.Sub} fumbles with the patch kit as sewer water fills the boat.`,
  (n, p) => `${n} sticks ${p.posAdj} hand over the leak but it sprays through ${p.posAdj} fingers.`,
];

const LEAK_FIX = [
  (n, p) => `${n} spots the leak early and patches it before it becomes a problem.`,
  (n, p) => `Quick thinking from ${n} — ${p.sub} jams a rag into the crack.`,
  (n, p) => `${p.Sub} fixes the leak with one hand while paddling with the other.`,
  (n, p) => `${n} patches the boat hull like a seasoned sailor.`,
];

const GATOR_DODGE = [
  (n, p) => `GATOR! ${n} spots it first and swerves the boat clear — adrenaline rush!`,
  (n, p) => `${p.Sub} whacks the alligator with a paddle and it retreats!`,
  (n, p) => `${n} stares down the gator and it decides to pick an easier meal.`,
  (n, p) => `An alligator lunges but ${n} yanks everyone out of reach!`,
];

const GATOR_HERO = [
  (n, p) => `${n} DIVES at the gator, wrestling it away from the boat! Legendary!`,
  (n, p) => `${p.Sub} grabs the alligator by the tail and THROWS it aside!`,
  (n, p) => `${n} body-blocks the gator to protect the crew — absolute hero moment!`,
  (n, p) => `In a move nobody expected, ${n} puts ${p.ref} between the gator and ${p.posAdj} tribe!`,
];

const GATOR_HIT = [
  (tribe) => `The gator capsizes ${tribe}'s boat! Everyone scrambles to right it!`,
  (tribe) => `${tribe}'s boat takes a direct hit — water everywhere, pure chaos!`,
  (tribe) => `The alligator rams ${tribe}'s hull and sends them spinning into the wall!`,
  (tribe) => `DISASTER for ${tribe} — the gator tips the whole boat sideways!`,
];

const ENCOURAGEMENT = [
  (a, b, pa) => `${a} shouts encouragement to ${b}: "You got this!"`,
  (a, b, pa) => `${a} claps ${b} on the back: "Keep pushing, we're almost there!"`,
  (a, b, pa) => `"Don't give up!" ${a} rallies ${b} with a fierce look.`,
  (a, b, pa) => `${a} locks eyes with ${b}: "We finish this TOGETHER."`,
];

const BONDING = [
  (a, b) => `${a} and ${b} share a look of mutual respect after that ordeal.`,
  (a, b) => `${a} helps ${b} up — a small gesture that means a lot down here.`,
  (a, b) => `${a} and ${b} fist-bump in the darkness. Solidarity.`,
  (a, b) => `After nearly drowning together, ${a} and ${b} have a new understanding.`,
];

const BICKERING = [
  (a, b) => `${a} and ${b} get into it over who's pulling their weight.`,
  (a, b) => `"You're slowing us down!" ${a} snaps at ${b}.`,
  (a, b) => `Tensions boil over — ${a} and ${b} exchange heated words.`,
  (a, b) => `${a} blames ${b} for the setback. ${b} fires back twice as hard.`,
];

const MORALE = [
  (a, b) => `${a} cracks a joke and even ${b} has to laugh despite the pressure.`,
  (a, b) => `${a} starts a chant and the whole tribe joins in. Spirits lift.`,
  (a, b) => `${a} tells ${b} a story to keep everyone's minds off the challenge.`,
  (a, b) => `${a} refuses to let morale drop — ${a} keeps the energy high.`,
];

const CRITICAL_BOB = [
  (n, p) => `${n} PLUNGES in and comes up with the apple on the first try! Jaw-dropping!`,
  (n, p) => `${p.Sub} barely gets ${p.posAdj} face wet — apple secured in RECORD time!`,
  (n, p) => `${n} bites down HARD and rips the apple out of the barrel like a shark!`,
  (n, p) => `Lightning-fast! ${n} surfaces with the apple already in ${p.posAdj} teeth!`,
];

const GOOD_BOB = [
  (n, p) => `${n} comes up sputtering but triumphant — apple in mouth!`,
  (n, p) => `After some aggressive bobbing, ${n} snags the apple.`,
  (n, p) => `${p.Sub} pushes through the cold water and bites down. Got it!`,
  (n, p) => `${n} wrestles an apple out of the barrel — not pretty, but effective.`,
];

const FAIL_BOB = [
  (n, p) => `${n} comes up empty. The apple keeps slipping away.`,
  (n, p) => `${p.Sub} dunks ${p.posAdj} whole head in but can't get a bite.`,
  (n, p) => `No luck for ${n} — the apples are too slippery.`,
  (n, p) => `${n} surfaces gasping, apple-less. Back for another try.`,
];

const CRITICAL_FAIL_BOB = [
  (n, p) => `${n} inhales water and comes up CHOKING — no apple AND lost time!`,
  (n, p) => `${p.Sub} somehow gets ${p.posAdj} head stuck in the barrel!`,
  (n, p) => `Disaster — ${n} knocks the barrel over and has to fish apples out of the grass!`,
  (n, p) => `${n} bites down on ${p.posAdj} own lip instead of the apple. Painful.`,
];

const TURTLE_CLING = [
  (n, p) => `A snapping turtle latches onto ${n}'s face! ${p.Sub} screams bloody murder!`,
  (n, p) => `TURTLE! It clamps down on ${n}'s nose and will NOT let go!`,
  (n, p) => `${n} surfaces with a turtle hanging off ${p.posAdj} chin. Chaos ensues.`,
  (n, p) => `A turtle mistake ${n}'s ear for food. ${p.Sub} runs in circles screaming.`,
];

const TURTLE_DODGE_TEXT = [
  (n, p) => `${n} spots the turtle and yanks ${p.posAdj} face clear just in time.`,
  (n, p) => `A turtle snaps at ${n} but ${p.sub} dodges — nice reflexes!`,
  (n, p) => `${p.Sub} sees the shell and backs off before the turtle can strike.`,
  (n, p) => `${n} flicks the turtle away before it can get a grip. Close call.`,
];

const SABOTAGE_SETUP = [
  (n, p) => `While everyone watches the bobbing, ${n} quietly loosens another tribe's carriage wheels...`,
  (n, p) => `${p.Sub} sneaks over to a rival carriage and does something to the axle...`,
  (n, p) => `${n} pretends to stretch but ${p.sub}'s actually tampering with the competition's wheels.`,
  (n, p) => `Nobody notices ${n} slipping behind a rival carriage with a wrench.`,
];

const SWAP_DETECTED = [
  (sab, det, dp) => `${det} catches ${sab} red-handed tampering with the carriage! "CHEATER!"`,
  (sab, det, dp) => `"HEY! What are you DOING to our wheels?!" ${det} spots ${sab} mid-sabotage!`,
  (sab, det, dp) => `${det}'s sharp eyes catch ${sab} messing with the carriage. Busted.`,
  (sab, det, dp) => `${sab} freezes as ${det} rounds the corner. The wrench clatters to the ground.`,
];

const SWAP_SUCCESS = [
  (sab, tribe, sp) => `${sab} swapped the carriages! ${tribe} doesn't realize they've got the wrong one!`,
  (sab, tribe, sp) => `The sabotage works — ${tribe} pushes off with a carriage that pulls hard left.`,
  (sab, tribe, sp) => `${tribe} is halfway through the race before they realize ${sab} switched their wheels!`,
  (sab, tribe, sp) => `Diabolical! ${sab}'s carriage swap goes undetected. ${tribe} is in for a rough ride.`,
];

const BABY_NAV = [
  (n, p, ok) => ok ? `${n} spots a shortcut from the carriage and shouts directions!` : `${n} tries to navigate but ${p.posAdj} view from the baby seat is terrible.`,
  (n, p, ok) => ok ? `From ${p.posAdj} elevated perch, ${n} steers the pushers around obstacles.` : `${n} points the wrong way. The pushers ignore ${p.obj}.`,
  (n, p, ok) => ok ? `${n}'s bird's-eye view from the carriage helps the team dodge a pothole.` : `${n} can't see anything from inside the blankets.`,
  (n, p, ok) => ok ? `"LEFT! LEFT!" ${n} screams from the carriage. Good call — they avoid a curb.` : `${n}'s directions are worse than no directions at all.`,
];

const BABY_BALANCE = [
  (n, p, ok) => ok ? `${n} shifts ${p.posAdj} weight to keep the carriage balanced through the turn.` : `${n} leans the wrong way and nearly tips the whole carriage.`,
  (n, p, ok) => ok ? `Impressive core strength — ${n} keeps the apple steady even on bumps.` : `${n} flails around in the carriage like a ragdoll.`,
  (n, p, ok) => ok ? `${n} braces ${p.ref} perfectly, absorbing every bump.` : `The carriage rocks dangerously as ${n} can't find ${p.posAdj} balance.`,
  (n, p, ok) => ok ? `${n} hunkers down low, keeping the center of gravity stable.` : `${n} keeps shifting around, making the carriage wobble constantly.`,
];

const BABY_MORALE = [
  (n, p, ok) => ok ? `${n} cheers on the pushers from the carriage — the energy is infectious!` : `${n} whines about the bumpy ride. Morale drops.`,
  (n, p, ok) => ok ? `"FASTER! We're WINNING!" ${n}'s enthusiasm pushes the team forward!` : `${n} screams in panic at every bump. Not helpful.`,
  (n, p, ok) => ok ? `${n} starts a rally cry from the baby seat. The pushers dig deep!` : `${n} complains the whole time. The pushers grit their teeth.`,
  (n, p, ok) => ok ? `${n} waves the apple like a trophy — the pushers laugh and sprint harder.` : `"Are we there yet?!" ${n}'s whining makes everyone push slower out of spite.`,
];

const POTHOLE = [
  (tribe) => `${tribe}'s carriage hits a massive pothole — the whole frame shudders!`,
  (tribe) => `WHAM! ${tribe} plows through a crater in the road.`,
  (tribe) => `A pothole nearly swallows ${tribe}'s front wheel.`,
  (tribe) => `${tribe}'s carriage bounces violently over broken pavement.`,
];

const WHEEL_OFF_FAIL = [
  (tribe) => `${tribe}'s wheel pops off! The carriage grinds to a halt!`,
  (tribe) => `DISASTER — a wheel detaches from ${tribe}'s carriage mid-sprint!`,
  (tribe) => `The axle snaps on ${tribe}'s carriage. Wheel rolling away into traffic!`,
  (tribe) => `${tribe} loses a wheel! They're dragging the carriage on three.`,
];

const WHEEL_OFF_FIX = [
  (n, p) => `The wheel wobbles loose but ${n} jams it back on without stopping!`,
  (n, p) => `${n} catches the wheel before it falls off and hammers it home!`,
  (n, p) => `Quick hands from ${n} — ${p.sub} reattaches the wheel mid-stride!`,
  (n, p) => `${n} spots the loose wheel and kicks it back into the axle. Genius!`,
];

const APPLE_DROP = [
  (n, p) => `${n} drops the apple! The carriage screeches to a halt as everyone scrambles!`,
  (n, p) => `The apple bounces out of ${n}'s hands and rolls into the street!`,
  (n, p) => `"THE APPLE!" ${n} fumbles it and the team has to backtrack!`,
  (n, p) => `${n} loses ${p.posAdj} grip on the apple — it rolls under the carriage!`,
];

const FINAL_SPRINT = [
  (tribe) => `${tribe} gives everything they have for the final sprint to the finish line!`,
  (tribe) => `All-out push from ${tribe} — legs pumping, lungs burning!`,
  (tribe) => `${tribe} rounds the final corner and CHARGES for the finish!`,
  (tribe) => `The finish line is in sight! ${tribe} digs deep for one last surge!`,
];

const PUSHER_ENCOURAGE = [
  (a, b) => `${a} encourages ${b}: "Dig in, we're almost there!"`,
  (a, b) => `"Match my pace!" ${a} shouts to ${b} as they push together.`,
  (a, b) => `${a} and ${b} lock into a rhythm — perfect synchronization.`,
  (a, b) => `${a} grabs ${b}'s shoulder: "One more block. Give it everything."`,
];

const PUSHER_BICKER = [
  (a, b) => `${a} and ${b} shove each other fighting for position on the carriage handle.`,
  (a, b) => `"You're not even pushing!" ${a} yells at ${b} mid-sprint.`,
  (a, b) => `${a} accuses ${b} of dead-legging it. ${b} fires back hard.`,
  (a, b) => `Tempers flare between ${a} and ${b} — the carriage veers off-course.`,
];

/* ── helpers ── */

function canScheme(name) {
  const arch = players.find(p => p.name === name)?.archetype;
  if (['villain', 'mastermind', 'schemer'].includes(arch)) return true;
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
  if (nice.includes(arch)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

function pushCampEvent(ep, tribeName, evt) {
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[tribeName]) ep.campEvents[tribeName] = { pre: [], post: [] };
  ep.campEvents[tribeName].post.push(evt);
}

function makeSocialEvent(ep, tribe, members, chalScores) {
  if (members.length < 2) return null;
  const a = pick(members);
  let b = pick(members.filter(m => m !== a));
  if (!b) return null;
  const pa = pronouns(a);

  const roll = Math.random();
  if (roll < 0.35) {
    addBond(a, b, 0.5);
    popDelta(a, 1);
    chalScores[a] = (chalScores[a] || 0) + 1;
    pushCampEvent(ep, tribe, {
      text: `${a} encouraged ${b} during the Colossus climb`,
      players: [a, b], badgeText: 'Teamwork', badgeClass: 'badge-social'
    });
    return { type: 'encouragement', tribe, player: a, target: b,
      text: pick(ENCOURAGEMENT)(a, b, pa),
      badge: 'Teamwork', badgeClass: 'badge-social' };
  } else if (roll < 0.55) {
    addBond(a, b, 1.0);
    pushCampEvent(ep, tribe, {
      text: `${a} and ${b} bonded while climbing the Chris Colossus`,
      players: [a, b], badgeText: 'Bond', badgeClass: 'badge-social'
    });
    return { type: 'bonding', tribe, player: a, target: b,
      text: pick(BONDING)(a, b),
      badge: 'Bond', badgeClass: 'badge-social' };
  } else if (roll < 0.75) {
    addBond(a, b, -0.5);
    popDelta(a, -1);
    pushCampEvent(ep, tribe, {
      text: `${a} and ${b} got into it during the Colossus climb`,
      players: [a, b], badgeText: 'Tension', badgeClass: 'badge-danger'
    });
    return { type: 'bickering', tribe, player: a, target: b,
      text: pick(BICKERING)(a, b),
      badge: 'Tension', badgeClass: 'badge-danger' };
  } else if (roll < 0.90) {
    addBond(a, b, 0.3);
    popDelta(a, 1);
    pushCampEvent(ep, tribe, {
      text: `${a} rallied ${b}'s spirits on the Colossus`,
      players: [a, b], badgeText: 'Morale', badgeClass: 'badge-social'
    });
    return { type: 'morale', tribe, player: a, target: b,
      text: pick(MORALE)(a, b),
      badge: 'Morale', badgeClass: 'badge-social' };
  } else {
    addBond(a, b, -1.0);
    popDelta(a, -1);
    popDelta(b, -1);
    pushCampEvent(ep, tribe, {
      text: `${a} and ${b} clashed hard during the Colossus climb — it's personal`,
      players: [a, b], badgeText: 'Rivalry', badgeClass: 'badge-danger'
    });
    return { type: 'rivalry', tribe, player: a, target: b,
      text: `${a} and ${b} clash hard — this is personal now.`,
      badge: 'Rivalry', badgeClass: 'badge-danger' };
  }
}

const CROSS_TRIBE_TAUNT = [
  (a, tA, b, tB) => `${a} from ${tA} locks eyes with ${b} from ${tB} on the next rope over. "See you at the top — if you make it!"`,
  (a, tA, b, tB) => `${a} glances at ${tB}'s rope and sees ${b} struggling. "That's what losing looks like!"`,
  (a, tA, b, tB) => `"Hey ${b}!" ${a} calls across the gap. "My grandma climbs faster than ${tB}!"`,
  (a, tA, b, tB) => `${a} spots ${b} on ${tB}'s rope and laughs. "You call that climbing?"`,
  (a, tA, b, tB) => `${a} from ${tA} watches ${b} slip and yells: "Careful, ${tB}! Wouldn't want you to embarrass yourselves — MORE."`,
  (a, tA, b, tB) => `${a} pulls ahead and shouts down to ${b}: "Tell ${tB} I said goodbye!"`,
];

const CROSS_TRIBE_RESPECT = [
  (a, tA, b, tB) => `${a} watches ${b} from ${tB} recover from a nasty slip. Grudging nod of respect.`,
  (a, tA, b, tB) => `${a} and ${b} reach the same height at the same time. For a moment, tribe lines don't matter — just two climbers sharing the view.`,
  (a, tA, b, tB) => `"Not bad, ${b}," ${a} mutters, watching ${tB}'s best climber pull ahead.`,
  (a, tA, b, tB) => `${a} sees ${b} make a jaw-dropping move on ${tB}'s rope. Even rivals have to respect that.`,
];


function makeCrossTribeEvent(ep, tribes, chalScores) {
  if (tribes.length < 2) return null;
  const t1 = pick(tribes);
  const t2 = pick(tribes.filter(t => t.tribeName !== t1.tribeName));
  if (!t2 || t1.members.length < 1 || t2.members.length < 1) return null;
  const a = pick(t1.members);
  const b = pick(t2.members);
  const archA = players.find(pl => pl.name === a)?.archetype;

  if (['villain', 'mastermind', 'schemer', 'hothead', 'chaos-agent'].includes(archA) || Math.random() < 0.4) {
    addBond(a, b, -1.0);
    popDelta(a, Math.random() < 0.5 ? 1 : -1);
    popDelta(b, -1);
    pushCampEvent(ep, t1.tribeName, {
      text: `${a} trash-talked ${b} from ${t2.tribeName} during the Colossus climb`,
      players: [a, b], badgeText: 'Trash Talk', badgeClass: 'badge-danger'
    });
    return { type: 'taunt', tribe: t1.tribeName, player: a, target: b,
      text: pick(CROSS_TRIBE_TAUNT)(a, t1.tribeName, b, t2.tribeName),
      badge: 'Trash Talk', badgeClass: 'badge-danger' };
  } else {
    addBond(a, b, 1.0);
    popDelta(a, 1);
    popDelta(b, 1);
    pushCampEvent(ep, t1.tribeName, {
      text: `${a} and ${b} from ${t2.tribeName} shared a moment of respect on the Colossus`,
      players: [a, b], badgeText: 'Respect', badgeClass: 'badge-social'
    });
    return { type: 'respect', tribe: t1.tribeName, player: a, target: b,
      text: pick(CROSS_TRIBE_RESPECT)(a, t1.tribeName, b, t2.tribeName),
      badge: 'Respect', badgeClass: 'badge-social' };
  }
}

/* ════════════════════════════════════════════════════════════════════════
   simulateBroadwayBaby  —  Main simulation function
   ════════════════════════════════════════════════════════════════════════ */

export function simulateBroadwayBaby(ep) {

  /* ── INIT ── */
  const tribes = gs.tribes.map(t => ({
    tribeName: t.name,
    members: [...t.members],
    color: tribeColor(t.name),
    time: 0,
    carriageWeight: 1.0,
    navigator: null,
    bobber: null,
    baby: null,
    pushers: [],
    carriageSwapReady: false
  }));

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => {
    if (!ep.campEvents[t.tribeName]) ep.campEvents[t.tribeName] = { pre: [], post: [] };
  });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  const allMembers = tribes.flatMap(t => t.members);
  allMembers.forEach(n => { ep.chalMemberScores[n] = 0; });
  if (!gs.popularity) gs.popularity = {};

  const result = {
    tribes: tribes.map(t => ({ tribeName: t.tribeName, members: [...t.members], color: t.color })),
    phase1: { events: [], climbProgress: {}, carriageOrder: [], poleSlide: [] },
    phase2: { events: [], segments: [], gatorEvents: [], navigators: {} },
    phase3: { events: [], bobbing: [], carriageRace: [], roles: {} },
    winner: null,
    loser: null,
    placements: [],
    tribeResults: []
  };


  /* ══════════════════════════════════════════════════════════════════════
     PHASE 1: THE CHRIS COLOSSUS
     ══════════════════════════════════════════════════════════════════════ */

  // Interleaved climbing — all tribes climb simultaneously, round by round
  const climbState = {};
  const atTopMap = {};
  tribes.forEach(t => {
    climbState[t.tribeName] = {};
    t.members.forEach(n => { climbState[t.tribeName][n] = 0; });
    atTopMap[t.tribeName] = [];
  });

  let globalRound = 0;
  while (globalRound < 50) {
    globalRound++;
    let anyStillClimbing = false;

    for (const tribe of tribes) {
      const atTop = atTopMap[tribe.tribeName];
      const cp = climbState[tribe.tribeName];
      if (atTop.length >= tribe.members.length || tribe._finishAnnounced) continue;
      anyStillClimbing = true;

      const climbers = tribe.members.filter(n => !atTop.includes(n));
      for (const name of climbers) {
        const s = pStats(name);
        const p = pronouns(name);
        const arch = players.find(pl => pl.name === name)?.archetype;

        let bonus = 0;
        if (atTop.length > 0) bonus = 0.15 * pStats(atTop[atTop.length - 1]).physical;

        let score = s.physical * 0.07 + s.endurance * 0.04 + noise(2.5) + bonus;

        if (score > 0) {
          cp[name]++;
          ep.chalMemberScores[name] += 2;
          tribe.time += 1.5;

          result.phase1.events.push({
            type: 'climb', tribe: tribe.tribeName, player: name, success: true,
            segment: cp[name],
            text: pick(CLIMB_SUCCESS)(name, p, cp[name]),
            badge: 'Climb', badgeClass: 'badge-physical'
          });

          if (Math.random() < 0.15 && ['challenge-beast', 'hothead'].includes(arch) && s.physical >= 7) {
            cp[name] = Math.min(cp[name] + 1, 3);
            ep.chalMemberScores[name] += 3;
            popDelta(name, 1);
            result.phase1.events.push({
              type: 'showoff', tribe: tribe.tribeName, player: name,
              text: pick(CLIMB_SHOWOFF)(name, p),
              badge: 'Show-Off', badgeClass: 'badge-hero'
            });
          }

          if (cp[name] >= 3) {
            atTop.push(name);
            if (atTop.length > 1) addBond(atTop[atTop.length - 2], name, 0.5);
          }
        } else {
          tribe.time += 3.0;
          result.phase1.events.push({
            type: 'slip', tribe: tribe.tribeName, player: name,
            text: pick(CLIMB_SLIP)(name, p),
            badge: 'Slip', badgeClass: 'badge-danger'
          });

          if (Math.random() < 0.3) {
            result.phase1.events.push({
              type: 'ropeBurn', tribe: tribe.tribeName, player: name,
              text: pick(ROPE_BURN)(name, p),
              badge: 'Rope Burn', badgeClass: 'badge-danger'
            });
          }

          if (Math.random() < 0.12) {
            tribe.time += 4.0;
            const rescuePool = atTop.length > 0 ? atTop : climbers.filter(c => c !== name);
            if (rescuePool.length > 0) {
              const rescuer = rescuePool[0];
              addBond(rescuer, name, 1.0);
              popDelta(rescuer, 2);
              ep.chalMemberScores[rescuer] += 4;
              result.phase1.events.push({
                type: 'stuck', tribe: tribe.tribeName, player: name, rescuer,
                text: pick(STUCK_IN_STATUE)(name, p, rescuer),
                badge: 'Hero Rescue', badgeClass: 'badge-hero'
              });
              pushCampEvent(ep, tribe.tribeName, {
                text: `${rescuer} pulled ${name} out of the Chris statue during the climb`,
                players: [rescuer, name],
                badgeText: 'Hero Rescue',
                badgeClass: 'badge-hero'
              });
            }
          }

          if (Math.random() < 0.08) {
            result.phase1.events.push({
              type: 'ropeSnap', tribe: tribe.tribeName,
              text: pick(ROPE_SNAP)(),
              badge: 'Rope Snap!', badgeClass: 'badge-danger'
            });
          }
        }
      }

      // Track finish order silently (announced at end)
      if (atTop.length >= tribe.members.length && !tribe._finishAnnounced) {
        tribe._finishAnnounced = true;
        tribe._finishPlace = tribes.filter(t => t._finishAnnounced).length;
      }

      // Intra-tribe social events — only for tribes still climbing
      if (!tribe._finishAnnounced) {
        const evt = makeSocialEvent(ep, tribe.tribeName, tribe.members, ep.chalMemberScores);
        if (evt) result.phase1.events.push(evt);
      }
    }

    // Cross-tribe trash talk / respect — only between tribes still climbing
    const stillClimbingTribes = tribes.filter(t => !t._finishAnnounced);
    if (stillClimbingTribes.length >= 2) {
      const crossEvt = makeCrossTribeEvent(ep, stillClimbingTribes, ep.chalMemberScores);
      if (crossEvt) result.phase1.events.push(crossEvt);
    }

    if (!anyStillClimbing) break;
  }

  // Store climb progress
  tribes.forEach(t => {
    t.members.forEach(n => {
      result.phase1.climbProgress[n] = climbState[t.tribeName][n];
    });
  });

  /* ── Carriage Grab + Pole Slide + Placements ── */
  // Order: carriage grab → pole slide → placement card (per tribe, in finish order)
  const slideOrder = [...tribes].sort((a, b) => (a._finishPlace || 99) - (b._finishPlace || 99));
  const sortedByFinish = slideOrder;

  for (let i = 0; i < slideOrder.length; i++) {
    const tribe = slideOrder[i];

    // Carriage grab
    result.phase1.events.push({
      type: 'carriage-grab', tribe: tribe.tribeName, player: null,
      members: [...tribe.members],
      text: `${tribe.tribeName} grabs their baby carriage from the crown! Now they need to get back down — the fireman's pole is thirty stories high.`,
      badge: 'Carriage Secured', badgeClass: 'badge-hero'
    });

    // Pole slide
    for (const name of tribe.members) {
      const s = pStats(name);
      const p = pronouns(name);
      const score = s.boldness * 0.06 + s.physical * 0.04 + noise(2.5);

      if (score > 0) {
        tribe.time += 0.5;
        result.phase1.events.push({
          type: 'poleGood', tribe: tribe.tribeName, player: name,
          text: pick(POLE_GOOD)(name, p),
          badge: 'Clean Slide', badgeClass: 'badge-physical'
        });
      } else {
        tribe.time += 2.0;
        result.phase1.events.push({
          type: 'poleBad', tribe: tribe.tribeName, player: name,
          text: pick(POLE_BAD)(name, p),
          badge: 'Bad Slide', badgeClass: 'badge-danger'
        });

        if (Math.random() < 0.1) {
          tribe.time += 3.0;
          popDelta(name, 1);
          result.phase1.events.push({
            type: 'poleCrash', tribe: tribe.tribeName, player: name,
            text: pick(POLE_CRASH)(name, p),
            badge: 'EPIC Crash', badgeClass: 'badge-chaos'
          });
        }
      }
    }
  }
  const placeLabels = ['1ST PLACE', '2ND PLACE', '3RD PLACE'];
  const rewardLabels = [
    'First to the boats — massive head start in the Sewer Race!',
    'Second to the boats — they\'ll need to make up ground in the sewers.',
    'Dead last to the boats — the other teams are already in the water!'
  ];
  sortedByFinish.forEach((t, i) => {
    t._finalPlace = i + 1;
    // Apply head start as time bonus (subtract from accumulated time)
    const headStartBonus = i === 0 ? 3.0 : i === 1 ? 1.5 : 0;
    t.time -= headStartBonus;
    result.phase1.carriageOrder.push({
      tribeName: t.tribeName,
      order: i + 1
    });
    result.phase1.events.push({
      type: i === 0 ? 'placement-winner' : i === 1 ? 'placement-second' : 'placement-loser',
      tribe: t.tribeName,
      player: null,
      members: [...t.members],
      text: `${t.tribeName} finishes the Colossus in ${placeLabels[i]}! ${rewardLabels[i]}`,
      badge: placeLabels[i],
      badgeClass: i === 0 ? 'badge-hero' : i === 1 ? 'badge-physical' : 'badge-danger'
    });
  });


  /* ══════════════════════════════════════════════════════════════════════
     PHASE 2: THE UNDERGROUND GAUNTLET
     ══════════════════════════════════════════════════════════════════════ */

  // Assign navigator per tribe
  for (const tribe of tribes) {
    let bestNav = null;
    let bestScore = -Infinity;
    for (const name of tribe.members) {
      const s = pStats(name);
      const score = s.mental * 0.6 + s.intuition * 0.4 + noise(2.5);
      if (score > bestScore) {
        bestScore = score;
        bestNav = name;
      }
    }
    tribe.navigator = bestNav;
    result.phase2.navigators[tribe.tribeName] = bestNav;
  }

  const TOTAL_SEGMENTS = 6;
  tribes.forEach(t => { t._preSewerTime = t.time; t._sewerMomentum = 0; });

  for (let seg = 1; seg <= TOTAL_SEGMENTS; seg++) {
    const segmentData = { segment: seg, events: [] };

    // Sort tribes by current time (interleave — fastest goes first)
    const tribeOrder = [...tribes].sort((a, b) => a.time - b.time);

    for (const tribe of tribeOrder) {
      const nav = tribe.navigator;
      const navStats = pStats(nav);
      const navP = pronouns(nav);
      const nonNav = tribe.members.filter(m => m !== nav);
      // Momentum compounds: leading tribe gains confidence, trailing tribe panics
      const momFactor = 1.0 + tribe._sewerMomentum * 0.1;

      // ── Navigation roll ──
      const navScore = navStats.mental * 0.06 + navStats.intuition * 0.04 + noise(2.5);
      if (navScore > 0) {
        tribe.time += 1.0;
        tribe._sewerMomentum = Math.max(tribe._sewerMomentum - 0.2, -2);
        ep.chalMemberScores[nav] += 2;
        if (Math.random() < 0.35) {
          segmentData.events.push({
            type: 'navGood', tribe: tribe.tribeName, player: nav, segment: seg,
            text: pick(NAV_GOOD)(nav, navP),
            badge: 'Good Nav', badgeClass: 'badge-mental'
          });
        }
      } else {
        tribe.time += 4.0 * momFactor;
        tribe._sewerMomentum = Math.min(tribe._sewerMomentum + 0.6, 2);
        segmentData.events.push({
          type: 'wrongTurn', tribe: tribe.tribeName, player: nav, segment: seg,
          text: pick(WRONG_TURN)(nav, navP),
          badge: 'Wrong Turn', badgeClass: 'badge-danger'
        });

        // Navigator blame: ~40%
        if (Math.random() < 0.4 && nonNav.length > 0) {
          const blameCandidates = nonNav.filter(m => pStats(m).loyalty < 6);
          const blamer = blameCandidates.length > 0 ? pick(blameCandidates) : null;
          if (blamer) {
            const bp = pronouns(blamer);
            addBond(blamer, nav, -0.5);
            segmentData.events.push({
              type: 'blame', tribe: tribe.tribeName, player: blamer, target: nav, segment: seg,
              text: pick(NAV_BLAME)(blamer, nav, bp, navP),
              badge: 'Blame', badgeClass: 'badge-danger'
            });
          }
        }
      }

      // ── Crew paddling ──
      if (nonNav.length > 0) {
        const paddler = pick(nonNav);
        const ps = pStats(paddler);
        const pp = pronouns(paddler);
        const padScore = ps.physical * 0.06 + ps.endurance * 0.04 + noise(2.5);
        if (padScore > 0) {
          tribe.time -= 0.5;
          tribe._sewerMomentum = Math.max(tribe._sewerMomentum - 0.15, -2);
          ep.chalMemberScores[paddler] += 1;
        } else {
          tribe.time += 1.0;
          segmentData.events.push({
            type: 'badPaddle', tribe: tribe.tribeName, player: paddler, segment: seg,
            text: pick(BAD_PADDLE)(paddler, pp),
            badge: 'Weak Paddle', badgeClass: 'badge-danger'
          });
        }
      }

      // ── Hazards ──
      const hazardRoll = Math.random();

      if (hazardRoll < 0.20) {
        // Low pipe
        const victim = pick(tribe.members);
        const vs = pStats(victim);
        const vp = pronouns(victim);
        const hScore = vs.physical * 0.06 + noise(2.5);
        if (hScore <= 0) {
          tribe.time += 2.0 * momFactor;
          tribe._sewerMomentum = Math.min(tribe._sewerMomentum + 0.4, 2);
          segmentData.events.push({
            type: 'lowPipe', tribe: tribe.tribeName, player: victim, hit: true, segment: seg,
            text: pick(LOW_PIPE_HIT)(victim, vp),
            badge: 'Pipe Hit', badgeClass: 'badge-danger'
          });
        } else {
          segmentData.events.push({
            type: 'lowPipe', tribe: tribe.tribeName, player: victim, hit: false, segment: seg,
            text: pick(LOW_PIPE_DODGE)(victim, vp),
            badge: 'Dodge', badgeClass: 'badge-physical'
          });
        }
      } else if (hazardRoll < 0.35) {
        // Rats
        const victim = pick(tribe.members);
        const vs = pStats(victim);
        const vp = pronouns(victim);
        const rScore = vs.boldness * 0.08 + noise(2.5);
        if (rScore <= 0) {
          tribe.time += 1.5 * momFactor;
          tribe._sewerMomentum = Math.min(tribe._sewerMomentum + 0.3, 2);
          segmentData.events.push({
            type: 'rats', tribe: tribe.tribeName, player: victim, panic: true, segment: seg,
            text: pick(RATS_PANIC)(victim, vp),
            badge: 'Rat Panic', badgeClass: 'badge-danger'
          });
        } else {
          tribe.time -= 0.3;
          popDelta(victim, 1);
          segmentData.events.push({
            type: 'rats', tribe: tribe.tribeName, player: victim, panic: false, segment: seg,
            text: pick(RATS_BRAVE)(victim, vp),
            badge: 'Rat Wrangler', badgeClass: 'badge-hero'
          });
        }
      } else if (hazardRoll < 0.60) {
        // Water current
        const currentPlayer = pick(tribe.members);
        const cs = pStats(currentPlayer);
        const cScore = cs.endurance * 0.07 + noise(2.5);
        if (cScore <= 0) {
          tribe.time += 3.0 * momFactor;
          tribe._sewerMomentum = Math.min(tribe._sewerMomentum + 0.5, 2);
          segmentData.events.push({
            type: 'current', tribe: tribe.tribeName, fail: true, segment: seg,
            text: pick(CURRENT_FAIL)(tribe.tribeName),
            badge: 'Current!', badgeClass: 'badge-danger'
          });
        } else {
          tribe.time -= 1.5;
          tribe._sewerMomentum = Math.max(tribe._sewerMomentum - 0.3, -2);
          segmentData.events.push({
            type: 'current', tribe: tribe.tribeName, fail: false, segment: seg,
            text: pick(CURRENT_RIDE)(tribe.tribeName),
            badge: 'Current Ride', badgeClass: 'badge-physical'
          });
        }
      } else if (hazardRoll < 0.80) {
        // Tunnel fork
        const fScore = navStats.mental * 0.08 + noise(2.5);
        if (fScore <= 0) {
          tribe.time += 4.5 * momFactor;
          tribe._sewerMomentum = Math.min(tribe._sewerMomentum + 0.7, 2);
          segmentData.events.push({
            type: 'fork', tribe: tribe.tribeName, player: nav, wrong: true, segment: seg,
            text: pick(FORK_WRONG)(nav, navP),
            badge: 'Wrong Fork', badgeClass: 'badge-danger'
          });
        } else {
          tribe.time -= 2.0;
          tribe._sewerMomentum = Math.max(tribe._sewerMomentum - 0.4, -2);
          ep.chalMemberScores[nav] += 2;
          segmentData.events.push({
            type: 'fork', tribe: tribe.tribeName, player: nav, wrong: false, segment: seg,
            text: pick(FORK_RIGHT)(nav, navP),
            badge: 'Shortcut!', badgeClass: 'badge-mental'
          });
        }
      } else if (hazardRoll < 0.90) {
        // Boat leak
        const fixer = pick(tribe.members);
        const fs = pStats(fixer);
        const fp = pronouns(fixer);
        const lScore = fs.physical * 0.05 + noise(2.5);
        if (lScore <= 0) {
          tribe.time += 1.5 * momFactor;
          tribe._sewerMomentum = Math.min(tribe._sewerMomentum + 0.2, 2);
          segmentData.events.push({
            type: 'leak', tribe: tribe.tribeName, player: fixer, fail: true, segment: seg,
            text: pick(LEAK_FAIL)(fixer, fp),
            badge: 'Leak!', badgeClass: 'badge-danger'
          });
        } else {
          ep.chalMemberScores[fixer] += 1;
          segmentData.events.push({
            type: 'leak', tribe: tribe.tribeName, player: fixer, fail: false, segment: seg,
            text: pick(LEAK_FIX)(fixer, fp),
            badge: 'Patched', badgeClass: 'badge-physical'
          });
        }
      }
      // else: no hazard this segment

      // ── Social events (~30% per segment) ──
      if (Math.random() < 0.3) {
        const evt = makeSocialEvent(ep, tribe.tribeName, tribe.members, ep.chalMemberScores);
        if (evt) {
          evt.segment = seg;
          segmentData.events.push(evt);
        }
      }

      // ── Alligator — segments 4-6 ──
      if (seg >= 4) {
        const isLastTribe = tribe === tribeOrder[tribeOrder.length - 1];
        const gatorChance = isLastTribe ? 0.40 : 0.20;

        if (Math.random() < gatorChance) {
          const dodger = pick(tribe.members);
          const ds = pStats(dodger);
          const dp = pronouns(dodger);
          const dodgeScore = ds.physical * 0.06 + ds.boldness * 0.05 + noise(2.5);

          if (dodgeScore > 0) {
            // Dodged
            popDelta(dodger, 1);
            tribe.time -= 1.0; // adrenaline boost
            tribe._sewerMomentum = Math.max(tribe._sewerMomentum - 0.35, -2);
            ep.chalMemberScores[dodger] += 3;
            const gEvt = {
              type: 'gatorDodge', tribe: tribe.tribeName, player: dodger, segment: seg,
              text: pick(GATOR_DODGE)(dodger, dp),
              badge: 'Gator Dodge!', badgeClass: 'badge-hero'
            };
            segmentData.events.push(gEvt);
            result.phase2.gatorEvents.push(gEvt);
          } else {
            // Hit — hero attempt
            tribe.time += 3.5 * momFactor;
            tribe._sewerMomentum = Math.min(tribe._sewerMomentum + 0.7, 2);

            // Find hero (highest physical)
            let hero = tribe.members[0];
            let heroPhys = 0;
            for (const m of tribe.members) {
              if (pStats(m).physical > heroPhys) {
                heroPhys = pStats(m).physical;
                hero = m;
              }
            }
            const hp = pronouns(hero);
            const heroScore = pStats(hero).physical * 0.08 + noise(2.5);

            if (heroScore > 0) {
              popDelta(hero, 3);
              tribe.members.forEach(m => {
                if (m !== hero) addBond(hero, m, 1.0);
              });
              ep.chalMemberScores[hero] += 5;
              const gEvt = {
                type: 'gatorHero', tribe: tribe.tribeName, player: hero, segment: seg,
                text: pick(GATOR_HERO)(hero, hp),
                badge: 'Gator Fighter!', badgeClass: 'badge-hero'
              };
              segmentData.events.push(gEvt);
              result.phase2.gatorEvents.push(gEvt);
              pushCampEvent(ep, tribe.tribeName, {
                text: `${hero} fought off a sewer alligator to protect ${pronouns(hero).posAdj} tribe`,
                players: [hero, ...tribe.members.filter(m => m !== hero)],
                badgeText: 'Gator Fighter',
                badgeClass: 'badge-hero'
              });
            } else {
              tribe.time += 4.5 * momFactor; // capsized
              tribe._sewerMomentum = Math.min(tribe._sewerMomentum + 0.8, 2);
              const gEvt = {
                type: 'gatorHit', tribe: tribe.tribeName, segment: seg,
                text: pick(GATOR_HIT)(tribe.tribeName),
                badge: 'CAPSIZED!', badgeClass: 'badge-danger'
              };
              segmentData.events.push(gEvt);
              result.phase2.gatorEvents.push(gEvt);
            }
          }
        }
      }
    }

    // ── Cross-tribe events (~25% per segment) ──
    if (Math.random() < 0.25 && tribeOrder.length > 1) {
      const evt = makeCrossTribeEvent(ep, tribes, ep.chalMemberScores);
      if (evt) {
        evt.segment = seg;
        segmentData.events.push(evt);
      }
    }

    result.phase2.segments.push(segmentData);
  }

  // ── Phase 2 finish order (sewer-only time, ignoring Phase 1 carry-over) ──
  tribes.forEach(t => { t._sewerTime = t.time - (t._preSewerTime || 0); });
  const sewerOrder = [...tribes].sort((a, b) => a._sewerTime - b._sewerTime);
  const sewerPlaceLabels = ['1ST OUT', '2ND OUT', '3RD OUT'];
  const sewerRewards = [
    'First out of the sewers — massive momentum into the Park Dash!',
    'Second out — still in the race but ground to make up.',
    'Dead last out of the tunnels — they\'ll need a miracle in Central Park!'
  ];
  result.phase2.finishOrder = sewerOrder.map((t, i) => ({
    tribeName: t.tribeName, place: i + 1
  }));
  sewerOrder.forEach((t, i) => {
    t._sewerPlace = i + 1;
    result.phase2.events.push({
      type: i === 0 ? 'placement-winner' : i === 1 ? 'placement-second' : 'placement-loser',
      tribe: t.tribeName,
      player: null,
      members: [...t.members],
      segment: 6,
      text: `${t.tribeName} emerges from the sewers in ${sewerPlaceLabels[i]}! ${sewerRewards[i]}`,
      badge: sewerPlaceLabels[i],
      badgeClass: i === 0 ? 'badge-hero' : i === 1 ? 'badge-physical' : 'badge-danger'
    });
  });


  /* ══════════════════════════════════════════════════════════════════════
     PHASE 3: CENTRAL PARK DASH
     ══════════════════════════════════════════════════════════════════════ */

  // ── Role assignment per tribe ──
  for (const tribe of tribes) {
    // Bobber: highest (endurance * 0.5 + physical * 0.3 + boldness * 0.2 + noise)
    let bestBobber = null;
    let bestBobScore = -Infinity;
    for (const name of tribe.members) {
      const s = pStats(name);
      const score = s.endurance * 0.5 + s.physical * 0.3 + s.boldness * 0.2 + noise(2.5);
      if (score > bestBobScore) {
        bestBobScore = score;
        bestBobber = name;
      }
    }
    tribe.bobber = bestBobber;

    // Baby: lowest (physical * 0.5 + endurance * 0.3 + noise) excluding bobber
    const babyPool = tribe.members.filter(m => m !== tribe.bobber);
    let bestBaby = null;
    let bestBabyScore = Infinity;
    for (const name of babyPool) {
      const s = pStats(name);
      const score = s.physical * 0.5 + s.endurance * 0.3 + noise(2.5);
      if (score < bestBabyScore) {
        bestBabyScore = score;
        bestBaby = name;
      }
    }
    tribe.baby = bestBaby;

    // Pushers: everyone else
    tribe.pushers = tribe.members.filter(m => m !== tribe.bobber && m !== tribe.baby);

    result.phase3.roles[tribe.tribeName] = {
      bobber: tribe.bobber,
      baby: tribe.baby,
      pushers: [...tribe.pushers]
    };
  }

  // ── Sub-Phase A: Apple Bobbing ── (3 attempts per bobber)
  const bobResults = {}; // tribeName -> { got: bool, attempt: number }
  tribes.forEach(t => { bobResults[t.tribeName] = { got: false, attempt: 0 }; });

  for (let attempt = 1; attempt <= 3; attempt++) {
    // Interleave by current time
    const tribeOrder = [...tribes].sort((a, b) => a.time - b.time);

    for (const tribe of tribeOrder) {
      if (bobResults[tribe.tribeName].got) continue; // already got apple

      const bobber = tribe.bobber;
      const s = pStats(bobber);
      const p = pronouns(bobber);

      // Time penalty per attempt
      const attemptTimeCost = [0.5, 1.0, 1.5][attempt - 1];

      const score = s.physical * 0.06 + s.endurance * 0.05 + s.boldness * 0.04 + noise(2.5);

      let bobEvt;
      if (score > 0.7) {
        // Critical success
        bobResults[tribe.tribeName].got = true;
        bobResults[tribe.tribeName].attempt = attempt;
        popDelta(bobber, 2);
        ep.chalMemberScores[bobber] += 5;
        tribe.time += attemptTimeCost * 0.5; // fast
        bobEvt = {
          type: 'criticalBob', tribe: tribe.tribeName, player: bobber, attempt,
          text: pick(CRITICAL_BOB)(bobber, p),
          badge: 'INSTANT Bob!', badgeClass: 'badge-hero'
        };
      } else if (score > 0.3) {
        // Success
        bobResults[tribe.tribeName].got = true;
        bobResults[tribe.tribeName].attempt = attempt;
        ep.chalMemberScores[bobber] += 3;
        tribe.time += attemptTimeCost;
        bobEvt = {
          type: 'goodBob', tribe: tribe.tribeName, player: bobber, attempt,
          text: pick(GOOD_BOB)(bobber, p),
          badge: 'Apple!', badgeClass: 'badge-physical'
        };
      } else if (score < -0.3) {
        // Critical fail
        tribe.time += attemptTimeCost + 1.5;
        bobEvt = {
          type: 'criticalFailBob', tribe: tribe.tribeName, player: bobber, attempt,
          text: pick(CRITICAL_FAIL_BOB)(bobber, p),
          badge: 'Disaster!', badgeClass: 'badge-danger'
        };
      } else {
        // Normal fail
        tribe.time += attemptTimeCost + 0.8;
        bobEvt = {
          type: 'failBob', tribe: tribe.tribeName, player: bobber, attempt,
          text: pick(FAIL_BOB)(bobber, p),
          badge: 'Miss', badgeClass: 'badge-danger'
        };
      }
      result.phase3.bobbing.push(bobEvt);

      // Turtle attack: ~25%
      if (Math.random() < 0.25) {
        const turtleScore = s.physical * 0.07 + noise(2.5);
        if (turtleScore <= 0) {
          tribe.time += 1.0;
          result.phase3.bobbing.push({
            type: 'turtle', tribe: tribe.tribeName, player: bobber, clung: true, attempt,
            text: pick(TURTLE_CLING)(bobber, p),
            badge: 'TURTLE!', badgeClass: 'badge-danger'
          });
        } else {
          result.phase3.bobbing.push({
            type: 'turtle', tribe: tribe.tribeName, player: bobber, clung: false, attempt,
            text: pick(TURTLE_DODGE_TEXT)(bobber, p),
            badge: 'Turtle Dodge', badgeClass: 'badge-physical'
          });
        }
      }

      // Sabotage setup: ~10% for villain/schemer/mastermind pushers on shore
      const schemers = tribe.pushers.filter(m => canScheme(m));
      if (schemers.length > 0 && Math.random() < 0.10 && !tribe.carriageSwapReady) {
        const saboteur = schemers[0];
        const sp = pronouns(saboteur);
        tribe.carriageSwapReady = true;
        result.phase3.bobbing.push({
          type: 'sabotageSetup', tribe: tribe.tribeName, player: saboteur, attempt,
          text: pick(SABOTAGE_SETUP)(saboteur, sp),
          badge: 'Sabotage...', badgeClass: 'badge-scheme'
        });
      }
    }
  }

  // If a tribe didn't get the apple after 3 attempts, they still proceed (with massive time penalty already applied)
  tribes.forEach(t => {
    if (!bobResults[t.tribeName].got) {
      // Forced apple — they eventually get it with huge time loss
      t.time += 3.0;
      bobResults[t.tribeName].got = true;
      bobResults[t.tribeName].attempt = 4; // marker for "took forever"
      result.phase3.bobbing.push({
        type: 'forcedBob', tribe: t.tribeName, player: t.bobber,
        text: `After an agonizing struggle, ${t.bobber} finally, FINALLY gets the apple. The other tribes are long gone.`,
        badge: 'Finally...', badgeClass: 'badge-danger'
      });
    }
  });
  result.phase3.bobResults = bobResults;

  // ── Sub-Phase B: Baby Carriage Race ── (4 segments)

  // Find which tribe has carriageSwapReady (saboteur tribe)
  const saboteurTribe = tribes.find(t => t.carriageSwapReady);
  let swapUsed = false;

  for (let segment = 1; segment <= 4; segment++) {
    const segEvents = [];
    const tribeOrder = [...tribes].sort((a, b) => a.time - b.time);

    for (const tribe of tribeOrder) {
      // ── Pusher speed (average) ──
      let avgSpeed = 0;
      for (const pusher of tribe.pushers) {
        const ps = pStats(pusher);
        avgSpeed += ps.physical * 0.07 + ps.endurance * 0.04 + noise(2.5);
      }
      if (tribe.pushers.length > 0) avgSpeed /= tribe.pushers.length;

      // All carriages are the same baby carriages

      // ── Baby action ──
      const bs = pStats(tribe.baby);
      const bp = pronouns(tribe.baby);
      const babyActions = [
        { actionType: 'navigate', score: bs.mental * 0.07 + noise(2.5) },
        { actionType: 'balance', score: bs.endurance * 0.06 + noise(2.5) },
        { actionType: 'morale', score: bs.social * 0.07 + noise(2.5) }
      ];
      babyActions.sort((a, b) => b.score - a.score);
      const bestAction = babyActions[0];
      const babySuccess = bestAction.score > 0;

      if (babySuccess) {
        tribe.time -= 1.0;
        ep.chalMemberScores[tribe.baby] += 1;
      } else {
        tribe.time += 1.5;
      }

      // Pick narration based on action type
      let babyText;
      if (bestAction.actionType === 'navigate') {
        babyText = pick(BABY_NAV)(tribe.baby, bp, babySuccess);
      } else if (bestAction.actionType === 'balance') {
        babyText = pick(BABY_BALANCE)(tribe.baby, bp, babySuccess);
      } else {
        babyText = pick(BABY_MORALE)(tribe.baby, bp, babySuccess);
      }

      segEvents.push({
        type: 'babyAction', tribe: tribe.tribeName, player: tribe.baby,
        action: bestAction.actionType, success: babySuccess, segment,
        text: babyText,
        badge: babySuccess ? 'Good Baby' : 'Bad Baby',
        badgeClass: babySuccess ? 'badge-social' : 'badge-danger'
      });

      // ── Speed to time ──
      if (avgSpeed > 0) {
        tribe.time += (2.0 - avgSpeed * 0.8);
        tribe.pushers.forEach(p => { ep.chalMemberScores[p] += 1; });
      } else {
        tribe.time += 4.0;
      }

      // ── Carriage swap sabotage ──
      if (saboteurTribe && saboteurTribe !== tribe && !swapUsed && Math.random() < 0.30 && segment <= 2) {
        swapUsed = true;
        const saboteur = saboteurTribe.pushers.find(m => canScheme(m)) || saboteurTribe.pushers[0];
        if (saboteur) {
          const sp = pronouns(saboteur);
          // Detection check
          const detector = pick(tribe.members);
          const dp = pronouns(detector);
          const detScore = pStats(detector).intuition * 0.07 + noise(2.5);

          if (detScore > 0) {
            // Detected — small penalty
            tribe.time += 2.0;
            popDelta(saboteur, -3);
            addBond(detector, saboteur, -2.0);
            segEvents.push({
              type: 'swapDetected', tribe: tribe.tribeName, saboteur, detector, segment,
              saboteurTribe: saboteurTribe.tribeName,
              text: pick(SWAP_DETECTED)(saboteur, detector, dp),
              badge: 'CAUGHT!', badgeClass: 'badge-danger'
            });
            pushCampEvent(ep, tribe.tribeName, {
              text: `${detector} caught ${saboteur} trying to sabotage their carriage`,
              players: [detector, saboteur],
              badgeText: 'Cheater Caught',
              badgeClass: 'badge-danger'
            });
          } else {
            // Undetected — huge penalty for victim
            tribe.time += 5.0;
            popDelta(saboteur, -2);
            ep.chalMemberScores[saboteur] += 5;
            tribe.members.forEach(m => addBond(saboteur, m, -1.0));
            segEvents.push({
              type: 'swapSuccess', tribe: tribe.tribeName, saboteur, segment,
              saboteurTribe: saboteurTribe.tribeName,
              text: pick(SWAP_SUCCESS)(saboteur, tribe.tribeName, sp),
              badge: 'SABOTAGE!', badgeClass: 'badge-scheme'
            });
            pushCampEvent(ep, tribe.tribeName, {
              text: `${saboteur} secretly swapped ${tribe.tribeName}'s carriage, costing them the race`,
              players: [saboteur, ...tribe.members],
              badgeText: 'Carriage Sabotage',
              badgeClass: 'badge-scheme'
            });
            gs._broadwayBabyHeat = {
              target: saboteur,
              amount: 3,
              expiresEp: gs.episodeHistory.length + 3
            };
          }
        }
      }

      // ── Pothole: ~20% ──
      if (Math.random() < 0.20 && tribe.pushers.length > 0) {
        const pusher = pick(tribe.pushers);
        const pScore = pStats(pusher).physical * 0.06 + noise(2.5);
        if (pScore <= 0) {
          tribe.time += 2.5;
          segEvents.push({
            type: 'pothole', tribe: tribe.tribeName, fail: true, player: pusher, segment,
            text: pick(POTHOLE)(tribe.tribeName),
            badge: 'Pothole!', badgeClass: 'badge-danger'
          });
        }
      }

      // ── Wheel falls off: ~8% ──
      if (Math.random() < 0.08 && tribe.pushers.length > 0) {
        const fixer = pick(tribe.pushers);
        const fs = pStats(fixer);
        const fp = pronouns(fixer);
        const wScore = fs.physical * 0.07 + noise(2.5);
        if (wScore <= 0) {
          tribe.time += 5.0;
          segEvents.push({
            type: 'wheelOff', tribe: tribe.tribeName, fail: true, player: fixer, segment,
            text: pick(WHEEL_OFF_FAIL)(tribe.tribeName),
            badge: 'WHEEL OFF!', badgeClass: 'badge-danger'
          });
        } else {
          popDelta(fixer, 1);
          ep.chalMemberScores[fixer] += 2;
          segEvents.push({
            type: 'wheelOff', tribe: tribe.tribeName, fail: false, player: fixer, segment,
            text: pick(WHEEL_OFF_FIX)(fixer, fp),
            badge: 'Quick Fix', badgeClass: 'badge-physical'
          });
        }
      }

      // ── Baby drops apple: ~10% ──
      if (Math.random() < 0.10) {
        const babyDropP = pronouns(tribe.baby);
        const dropScore = pStats(tribe.baby).endurance * 0.06 + noise(2.5);
        if (dropScore <= 0) {
          tribe.time += 4.0;
          tribe.pushers.forEach(pusher => addBond(pusher, tribe.baby, -0.5));
          segEvents.push({
            type: 'appleDropped', tribe: tribe.tribeName, player: tribe.baby, segment,
            text: pick(APPLE_DROP)(tribe.baby, babyDropP),
            badge: 'DROPPED!', badgeClass: 'badge-danger'
          });
          pushCampEvent(ep, tribe.tribeName, {
            text: `${tribe.baby} dropped the apple during the carriage race, costing the tribe precious time`,
            players: [tribe.baby, ...tribe.pushers],
            badgeText: 'Apple Fumble',
            badgeClass: 'badge-danger'
          });
        }
      }

      // ── Social events: ~25% ──
      if (Math.random() < 0.25 && tribe.pushers.length >= 2) {
        const roll = Math.random();
        const a = pick(tribe.pushers);
        let b = pick(tribe.pushers.filter(m => m !== a));
        if (!b) b = tribe.baby; // fallback
        if (b) {
          if (roll < 0.6) {
            // Encouragement
            addBond(a, b, 0.5);
            segEvents.push({
              type: 'pusherEncourage', tribe: tribe.tribeName, player: a, target: b, segment,
              text: pick(PUSHER_ENCOURAGE)(a, b),
              badge: 'Teamwork', badgeClass: 'badge-social'
            });
          } else {
            // Bickering
            addBond(a, b, -0.5);
            segEvents.push({
              type: 'pusherBicker', tribe: tribe.tribeName, player: a, target: b, segment,
              text: pick(PUSHER_BICKER)(a, b),
              badge: 'Friction', badgeClass: 'badge-danger'
            });
          }
        }
      }
    }

    // ── Last segment = final sprint ──
    if (segment === 4) {
      for (const tribe of tribeOrder) {
        let sprintTotal = 0;
        const sprintPlayers = tribe.pushers.length > 0 ? tribe.pushers : tribe.members;
        for (const pusher of sprintPlayers) {
          const ps = pStats(pusher);
          sprintTotal += ps.physical * 0.05 + ps.endurance * 0.05 + ps.boldness * 0.03 + noise(2.5);
        }
        const sprintAvg = sprintTotal / sprintPlayers.length;
        tribe.time += (3.0 - sprintAvg * 1.0);

        // Score bonus for sprint
        sprintPlayers.forEach(p => {
          ep.chalMemberScores[p] += 2;
        });

        segEvents.push({
          type: 'finalSprint', tribe: tribe.tribeName, segment,
          text: pick(FINAL_SPRINT)(tribe.tribeName),
          badge: 'SPRINT!', badgeClass: 'badge-physical'
        });
      }
    }

    result.phase3.carriageRace.push({ segment, events: segEvents });
  }


  /* ══════════════════════════════════════════════════════════════════════
     RESULTS
     ══════════════════════════════════════════════════════════════════════ */

  // Sort tribes by time (ascending = best)
  tribes.sort((a, b) => a.time - b.time);
  result.winner = tribes[0].tribeName;
  result.loser = tribes[tribes.length - 1].tribeName;
  result.placements = tribes.map(t => t.tribeName);
  result.tribeResults = tribes.map(t => ({
    tribeName: t.tribeName,
    time: Math.round(t.time * 100) / 100,
    carriageWeight: t.carriageWeight,
    navigator: t.navigator,
    bobber: t.bobber,
    baby: t.baby,
    pushers: [...t.pushers]
  }));

  // Bonus scores for winning tribe members
  const winTribe = tribes[0];
  winTribe.members.forEach(n => {
    ep.chalMemberScores[n] += 5;
  });

  // Mid-place tribe gets small bonus
  if (tribes.length > 2) {
    tribes[1].members.forEach(n => {
      ep.chalMemberScores[n] += 2;
    });
  }

  // Romance hooks
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++) {
    for (let j = i + 1; j < _romActive.length; j++) {
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'broadway baby');
    }
  }
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'broadway baby', _romActive);

  // Set episode data
  ep.broadwayBaby = result;
  ep.isBroadwayBaby = true;
  ep.challengeType = 'broadway-baby';
  ep.challengeLabel = 'Broadway Baby';
  ep.challengeCategory = 'adventure';
  ep.immunityWinner = null; // tribe challenge — no individual immunity
  ep.winner = gs.tribes.find(t => t.name === result.winner);
  ep.loser = gs.tribes.find(t => t.name === result.loser);
  ep.tribalPlayers = ep.loser ? [...ep.loser.members] : [];
  ep.chalPlacements = [...allMembers].sort((a, b) => (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0));
  updateChalRecord(ep);
  return ep;
}


// ══════════════════════════════════════════════════════════════════════
// VP SCREENS
// ══════════════════════════════════════════════════════════════════════



/* ───────────────────────── helpers ───────────────────────── */


function slugFor(name) { return name.toLowerCase().replace(/\s+/g, '-'); }

function _tribeStyle(hexColor) {
  const hex = (hexColor || '#c03030').replace('#','');
  const r = parseInt(hex.substring(0,2),16), g = parseInt(hex.substring(2,4),16), b = parseInt(hex.substring(4,6),16);
  const lighter = `rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`;
  return { bg: hexColor || '#c03030', light: `rgba(${r},${g},${b},0.15)`, text: lighter };
}

function _tribeLookup(ep) {
  const m = {};
  (ep.broadwayBaby.tribes || []).forEach(t => {
    m[t.tribeName] = t;
    (t.members || []).forEach(n => { m[n] = t; });
  });
  return m;
}

function _avatar(name, size) {
  size = size || 28;
  return `<img class="bb-avatar" src="assets/avatars/${slugFor(name)}.png" style="width:${size}px;height:${size}px" onerror="this.style.display='none'">`;
}

/* ───────────────────────── tvState ───────────────────────── */

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`bb-step-${suffix}-${i}`);
    if (el) el.classList.add('bb-visible');
  }
  const counter = document.getElementById(`bb-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`bb-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.bb-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

/* ───────────────────────── CSS ───────────────────────── */

const BB_CSS = `
/* ===== BROADWAY BABY VP ===== */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=Permanent+Marker&display=swap');

/* Override VP dark background so phase-specific sky/underground bg shows through */

.bb-shell {
  --bb-sky:#4a90c2; --bb-gold:#f0a500; --bb-danger:#e04040;
  --bb-sewer:#3d5a3a; --bb-water:#2a6b5e; --bb-park:#5a9e4f;
  --bb-rust:#c97b3a; --bb-metal:#8a9bb0; --bb-deep:#0d1117;
  --bb-white:#f0f0f0; --bb-muted:rgba(240,240,240,0.55);
  --bb-card-bg:rgba(14,18,26,0.95);
  max-width:1100px; margin:0 auto; display:flex; gap:16px; align-items:flex-start;
  font-family:'Barlow Condensed',sans-serif; color:var(--bb-white);
  position:relative; min-height:800px; padding:20px 16px 80px;
}

/* ── phase backgrounds ── */
.bb-bg { position:absolute; top:0; left:0; right:0; bottom:0; z-index:0; overflow:hidden; pointer-events:none; }

/* Phase 1 — Daytime Sky */
.bb-bg-phase1 { background:linear-gradient(180deg,#5ba8e0 0%,#6ec4f5 25%,#a0ddfb 55%,#d4f0ff 80%,#e8d8c8 100%); }
.bb-bg-phase1 .bb-cloud { position:absolute; background:rgba(255,255,255,0.7); border-radius:50%; animation:bb-drift 50s linear infinite; }
.bb-bg-phase1 .bb-p1-bird { position:absolute; font-size:10px; color:rgba(60,60,60,0.5); animation:bb-fly 22s linear infinite; }
.bb-bg-phase1 .bb-dust { position:absolute; width:3px; height:3px; background:rgba(255,255,255,0.2); border-radius:50%; animation:bb-float-up 8s linear infinite; }
.bb-bg-phase1 .bb-graffiti { position:absolute; font-family:'Permanent Marker',cursive; color:rgba(120,60,160,0.08); font-size:18px; transform:rotate(-8deg); }

/* Phase 2 — Underground */
.bb-bg-phase2 { background:linear-gradient(180deg,#1a1810 0%,#0c0a06 100%); }
.bb-bg-phase2::after { content:''; position:absolute; top:0; left:0; width:100%; height:100%;
  background:repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(80,60,40,0.06) 18px,rgba(80,60,40,0.06) 20px),
             repeating-linear-gradient(90deg,transparent,transparent 38px,rgba(80,60,40,0.06) 38px,rgba(80,60,40,0.06) 40px);
  pointer-events:none; }

/* Phase 3 — Central Park Golden Afternoon */
.bb-bg-phase3 { background:linear-gradient(180deg,#3a5a7a 0%,#5a8aaa 20%,#7ab0c8 40%,#c8dce8 55%,#2a4a28 60%,#1e3a1c 100%); }
.bb-bg-phase3 .bb-p3-canopy { position:absolute; top:45%; left:0; right:0; height:20%; background:linear-gradient(180deg,rgba(30,58,28,0),rgba(30,58,28,0.95)); pointer-events:none; }
.bb-bg-phase3 .bb-p3-tree { position:absolute; bottom:38%; }
.bb-bg-phase3 .bb-p3-trunk { width:6px; background:linear-gradient(180deg,#4a3a28,#3a2a1a); border-radius:2px; margin:0 auto; }
.bb-bg-phase3 .bb-p3-crown { border-radius:50% 50% 45% 45%; position:relative; top:-2px; }
.bb-bg-phase3 .bb-p3-cloud { position:absolute; background:rgba(220,230,240,0.4); border-radius:50%; animation:bb-drift 60s linear infinite; filter:blur(2px); }
.bb-bg-phase3 .bb-p3-leaf { position:absolute; width:5px; height:5px; border-radius:0 50% 50% 50%; transform:rotate(45deg); opacity:0.5; animation:bb-leaf-fall 8s ease-in infinite; }
@keyframes bb-leaf-fall { 0%{transform:rotate(45deg) translateY(0);opacity:0.5} 50%{transform:rotate(135deg) translateX(20px)} 100%{transform:rotate(225deg) translateY(300px);opacity:0} }
.bb-bg-phase3 .bb-p3-lamppost { position:absolute; bottom:0; width:3px; background:linear-gradient(180deg,#5a5040,#3a3028); }
.bb-bg-phase3 .bb-p3-lamp { position:absolute; top:-6px; left:-4px; width:11px; height:6px; background:radial-gradient(ellipse,rgba(255,220,120,0.8),rgba(255,200,80,0.2)); border-radius:50%; }
.bb-bg-phase3 .bb-p3-path { position:absolute; bottom:0; left:0; right:0; height:12%; background:linear-gradient(180deg,#6a6050,#4a4038); }
.bb-bg-phase3 .bb-p3-path::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(160,140,100,0.3),transparent); }
.bb-bg-phase3 .bb-p3-sunbeam { position:absolute; top:0; width:80px; height:100%; background:linear-gradient(180deg,rgba(255,220,140,0.08),transparent 60%); transform:skewX(-8deg); pointer-events:none; }

/* results bg — Night Sky */
.bb-bg-results { background:linear-gradient(180deg,#0e1a30 0%,#1a3050 40%,#0c1018 100%); }
.bb-bg-results .bb-star { position:absolute; width:2px; height:2px; background:#fff; border-radius:50%; animation:bb-twinkle 3s infinite alternate; }
.bb-bg-results .bb-moon { position:absolute; top:8%; right:12%; width:60px; height:60px; border-radius:50%; background:radial-gradient(circle at 40% 40%,#f0e8d0,#d4c8a0); box-shadow:0 0 40px rgba(240,232,208,0.3),0 0 80px rgba(240,232,208,0.1); }
.bb-bg-results .bb-cloud { position:absolute; background:rgba(180,200,220,0.06); border-radius:50%; animation:bb-drift 70s linear infinite; }

/* title bg — Daytime */
.bb-bg-title { background:linear-gradient(180deg,#5ba8e0 0%,#6ec4f5 25%,#a0ddfb 55%,#d4f0ff 80%,#e8d8c8 100%); }
.bb-bg-title .bb-cloud { position:absolute; background:rgba(255,255,255,0.75); border-radius:50%; animation:bb-drift 55s linear infinite; }
.bb-bg-title .bb-p1-bird { position:absolute; font-size:10px; color:rgba(60,60,60,0.5); animation:bb-fly 18s linear infinite; }

/* ── 3-layer dense skyline system ── */
.bb-skyline-wrap { position:absolute; bottom:0; left:0; right:0; height:35%; overflow:hidden; }
.bb-sky-back { position:absolute; bottom:0; left:0; right:0; height:100%; }
.bb-sky-back .bb-b { position:absolute; bottom:0; background:linear-gradient(180deg,rgba(140,170,200,0.5),rgba(120,150,180,0.45)); transform:scaleY(0.48); transform-origin:bottom; }
.bb-sky-mid { position:absolute; bottom:0; left:0; right:0; height:85%; }
.bb-sky-mid .bb-b { position:absolute; bottom:0; transform:scaleY(0.48); transform-origin:bottom; }
.bb-sky-front { position:absolute; bottom:0; left:0; right:0; height:65%; }
.bb-sky-front .bb-b { position:absolute; bottom:0; border-top:2px solid rgba(100,140,170,0.3); transform:scaleY(0.48); transform-origin:bottom; }
.bb-sky-front .bb-b .bb-w { position:absolute; width:5px; height:6px; border-radius:1px; }
.bb-b-cool { background:linear-gradient(180deg,#4a6a85,#3a5570) !important; }
.bb-b-warm { background:linear-gradient(180deg,#7a6a5a,#5a4a3a) !important; }
.bb-b-steel { background:linear-gradient(180deg,#6a7a8a,#4a5a6a) !important; }
.bb-b-dark { background:linear-gradient(180deg,#3a4a5a,#2a3a48) !important; }
.bb-b-rose { background:linear-gradient(180deg,#8a6070,#6a4a58) !important; }
.bb-b-teal { background:linear-gradient(180deg,#4a7a7a,#3a6060) !important; }
.bb-b-sand { background:linear-gradient(180deg,#9a8a6a,#7a6a4a) !important; }
.bb-b-slate { background:linear-gradient(180deg,#5a6a7a,#3a4a5a) !important; }
.bb-b .bb-glass { position:absolute; top:0; width:30%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent); pointer-events:none; }
.bb-b .bb-spire { position:absolute; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; }
.bb-b .bb-crown { position:absolute; clip-path:polygon(0% 100%,12% 0%,24% 55%,38% 0%,50% 55%,62% 0%,76% 55%,88% 0%,100% 100%); }
.bb-b .bb-wt { position:absolute; border-radius:3px 3px 0 0; }
.bb-b .bb-ant { position:absolute; width:2px; }
.bb-b .bb-al { position:absolute; width:4px; height:4px; border-radius:50%; background:#e04040; animation:bb-blink 2s infinite; }
/* night skyline overrides */
.bb-bg-results .bb-sky-back .bb-b { background:linear-gradient(180deg,rgba(20,30,50,0.6),rgba(15,25,40,0.5)) !important; }
.bb-bg-results .bb-sky-mid .bb-b { opacity:0.9; }
.bb-bg-results .bb-sky-front .bb-b .bb-w { background:rgba(255,220,100,0.6) !important; }
.bb-bg-results .bb-b-cool { background:linear-gradient(180deg,#1a3050,#0e2040) !important; }
.bb-bg-results .bb-b-warm { background:linear-gradient(180deg,#2a2018,#1a1510) !important; }
.bb-bg-results .bb-b-steel { background:linear-gradient(180deg,#2a3040,#1a2030) !important; }
.bb-bg-results .bb-b-dark { background:linear-gradient(180deg,#1a2030,#0e1520) !important; }
.bb-bg-results .bb-b-rose { background:linear-gradient(180deg,#2a1820,#1a1018) !important; }
.bb-bg-results .bb-b-teal { background:linear-gradient(180deg,#1a3030,#102020) !important; }
.bb-bg-results .bb-b-sand { background:linear-gradient(180deg,#2a2418,#1a1810) !important; }
.bb-bg-results .bb-b-slate { background:linear-gradient(180deg,#1a2230,#0e1620) !important; }
/* daytime window color */
.bb-bg-phase1 .bb-sky-front .bb-b .bb-w, .bb-bg-title .bb-sky-front .bb-b .bb-w { background:rgba(180,220,255,0.25); }

/* ── title statue (MASSIVE) ── */
.bb-title-statue { position:relative; width:240px; margin:0 auto 4px; }
.bb-title-statue-sun { position:absolute; top:-30px; left:50%; transform:translateX(-50%); width:300px; height:300px; border-radius:50%; background:radial-gradient(circle,rgba(255,220,80,0.35) 0%,rgba(255,200,60,0.15) 30%,rgba(255,180,40,0.05) 55%,transparent 70%); pointer-events:none; }
.bb-title-statue-spotlight { position:absolute; bottom:0; width:60px; height:250px; background:linear-gradient(0deg,rgba(255,220,100,0.15),transparent 80%); pointer-events:none; }
.bb-title-statue-spotlight-l { left:15px; transform:rotate(8deg); transform-origin:bottom center; }
.bb-title-statue-spotlight-r { right:15px; transform:rotate(-8deg); transform-origin:bottom center; }
.bb-title-statue-pedestal { width:140px; height:36px; margin:0 auto; background:linear-gradient(180deg,#8a7a5a,#6a5a3a); border-radius:6px 6px 0 0; position:relative; }
.bb-title-statue-pedestal::after { content:'THE CHRIS COLOSSUS'; position:absolute; bottom:6px; left:0; right:0; text-align:center; font-family:'Bebas Neue',sans-serif; font-size:10px; letter-spacing:2px; color:rgba(240,220,160,0.7); }
.bb-title-statue-body { width:50px; height:170px; margin:0 auto; background:linear-gradient(135deg,#e8b820,#d4a017,#b08a10); border-radius:8px 8px 0 0; position:relative; }
.bb-title-statue-arm { position:absolute; width:70px; height:10px; background:linear-gradient(90deg,#d4a017,#b08a10); top:22px; border-radius:5px; }
.bb-title-statue-arm-l { left:-55px; transform:rotate(-15deg); transform-origin:right center; }
.bb-title-statue-arm-r { right:-55px; transform:rotate(15deg); transform-origin:left center; }
.bb-title-statue-head { width:65px; height:65px; margin:0 auto -6px; border-radius:50%; background:linear-gradient(135deg,#d4a017,#f0c040); overflow:hidden; border:3px solid #b08a10; position:relative; z-index:2; }
.bb-title-statue-head img { width:100%; height:100%; object-fit:cover; }
.bb-title-statue-halo { position:absolute; top:-15px; left:50%; transform:translateX(-50%); width:90px; height:90px; border-radius:50%; background:radial-gradient(circle,rgba(240,200,60,0.5),rgba(240,165,0,0.15),transparent 70%); animation:bb-halo-pulse 3s ease-in-out infinite; z-index:1; }
.bb-title-statue-beams { position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:240px; height:300px; pointer-events:none; }
.bb-title-statue-beam { position:absolute; bottom:0; background:linear-gradient(0deg,rgba(240,200,60,0.1),transparent); }
.bb-title-statue-beam:nth-child(1) { left:25%; width:24px; height:100%; transform:rotate(-10deg); }
.bb-title-statue-beam:nth-child(2) { left:50%; width:20px; height:110%; transform:translateX(-50%); }
.bb-title-statue-beam:nth-child(3) { right:25%; width:24px; height:100%; transform:rotate(10deg); }
.bb-title-statue-beam:nth-child(4) { left:10%; width:14px; height:80%; transform:rotate(-18deg); opacity:0.5; }
.bb-title-statue-beam:nth-child(5) { right:10%; width:14px; height:80%; transform:rotate(18deg); opacity:0.5; }
.bb-title-sparkle { position:absolute; width:4px; height:4px; background:rgba(240,200,60,0.6); border-radius:50%; animation:bb-sparkle-float 5s ease-in-out infinite; }

/* ── title overdrive elements ── */
.bb-ep-tag { display:inline-block; font-family:'Bebas Neue',sans-serif; font-size:13px; letter-spacing:4px; color:rgba(30,60,90,0.7); background:rgba(255,255,255,0.25); padding:4px 18px; border-radius:20px; margin-bottom:16px; backdrop-filter:blur(4px); }
.bb-gold-divider { width:200px; height:2px; margin:10px auto; background:linear-gradient(90deg,transparent,#d4a017 30%,#f0c040 50%,#d4a017 70%,transparent); position:relative; }
.bb-gold-divider::before { content:''; position:absolute; top:-4px; left:50%; transform:translateX(-50%); width:10px; height:10px; background:#f0c040; border-radius:50%; box-shadow:0 0 8px rgba(240,200,60,0.5); }
.bb-mech-row { display:flex; justify-content:center; gap:16px; margin:8px 0; flex-wrap:wrap; }
.bb-mech-item { text-align:center; min-width:70px; }
.bb-mech-icon { width:40px; height:40px; margin:0 auto 4px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(14,18,26,0.7); border:2px solid rgba(240,200,60,0.3); backdrop-filter:blur(4px); }
.bb-mech-label { font-family:'Bebas Neue',sans-serif; font-size:10px; letter-spacing:2px; color:rgba(30,60,100,0.55); font-weight:700; }
.bb-ic-rope { width:4px; height:24px; background:repeating-linear-gradient(0deg,#c97b3a 0px,#c97b3a 3px,#8a5a2a 3px,#8a5a2a 6px); border-radius:1px; }
.bb-ic-boat { width:26px; height:12px; background:#6a5a3a; border-radius:0 0 8px 8px; position:relative; }
.bb-ic-boat::before { content:''; position:absolute; top:-8px; left:8px; width:3px; height:10px; background:#555; }
.bb-ic-boat::after { content:''; position:absolute; top:-10px; left:11px; width:10px; height:8px; background:rgba(200,80,80,0.8); clip-path:polygon(0% 100%,0% 30%,100% 0%); }
.bb-ic-apple { width:18px; height:20px; background:radial-gradient(circle at 40% 30%,#e04040,#a02020); border-radius:40% 40% 45% 45%; position:relative; }
.bb-ic-apple::before { content:''; position:absolute; top:-4px; left:7px; width:3px; height:6px; background:#5a3a1a; border-radius:1px; }
.bb-ic-apple::after { content:''; position:absolute; top:-6px; left:9px; width:6px; height:5px; background:rgba(90,160,60,0.8); border-radius:50%; transform:rotate(-30deg); }
.bb-ic-carriage { width:22px; height:16px; background:#6a5a3a; border-radius:4px 4px 0 0; position:relative; border:1px solid #8a7a5a; }
.bb-ic-carriage::after { content:''; position:absolute; bottom:-6px; left:2px; width:6px; height:6px; border-radius:50%; border:2px solid #8a7a5a; box-shadow:10px 0 0 0 #8a7a5a; background:transparent; }
.bb-ic-gator { width:28px; height:10px; background:#3d5a3a; border-radius:8px 14px 4px 4px; position:relative; }
.bb-ic-gator::before { content:''; position:absolute; top:1px; left:18px; width:4px; height:3px; background:#e8b820; border-radius:50%; }
.bb-ic-gator::after { content:''; position:absolute; bottom:-3px; left:2px; width:24px; height:4px; background:#2a4a28; border-radius:0 0 6px 4px; }
.bb-player-grid-label { font-family:'Bebas Neue',sans-serif; font-size:12px; letter-spacing:4px; color:rgba(30,60,100,0.5); margin:6px 0 4px; }
.bb-player-grid { display:flex; flex-wrap:wrap; justify-content:center; gap:4px; margin-bottom:8px; }
.bb-player-av { width:32px; height:32px; border-radius:50%; overflow:hidden; border:2px solid #f0a500; background:rgba(14,18,26,0.5); }
.bb-player-av img { width:100%; height:100%; object-fit:cover; }
.bb-tribe-tag { display:inline-block; font-family:'Bebas Neue',sans-serif; font-size:11px; letter-spacing:2px; padding:2px 10px; border-radius:10px; margin:2px 6px; }
.bb-host-quote { font-family:'Permanent Marker',cursive; font-size:13px; color:rgba(30,60,100,0.35); margin-top:8px; }

/* ── layout ── */
.bb-main { flex:1; min-width:0; position:relative; z-index:2; }
.bb-sidebar { width:260px; position:sticky; top:20px; z-index:2; }
.bb-shell[data-bb-phase="title"] { display:block; }
.bb-shell[data-bb-phase="title"] .bb-main { max-width:800px; margin:0 auto; }
.bb-shell[data-bb-phase="title"] .bb-sidebar { display:none; }
.bb-sidebar-inner { background:rgba(10,14,20,0.92); border:1px solid rgba(240,240,240,0.1); border-radius:8px; padding:12px; backdrop-filter:blur(8px); }

/* ── cards ── */
.bb-card {
  background:linear-gradient(135deg,rgba(18,24,38,0.92) 0%,rgba(14,18,26,0.96) 100%);
  border-radius:12px; padding:0; margin:10px 0;
  border:1px solid rgba(240,240,240,0.08); backdrop-filter:blur(10px);
  animation:bb-slide-in 0.3s ease-out; position:relative; overflow:hidden;
  box-shadow:0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
}
.bb-card-header {
  display:flex; align-items:center; gap:10px; padding:12px 16px 8px;
  border-bottom:1px solid rgba(240,240,240,0.06);
}
.bb-card-header .bb-player-av { flex-shrink:0; }
.bb-card-header .bb-player { font-weight:700; color:var(--bb-white); font-size:15px; }
.bb-card-accent {
  position:absolute; top:0; left:0; width:4px; height:100%; border-radius:12px 0 0 12px;
}
.bb-card-body { padding:10px 16px 14px; padding-left:20px; }
.bb-card-climb .bb-card-accent { background:var(--bb-sky); }
.bb-card-danger .bb-card-accent { background:var(--bb-danger); }
.bb-card-danger { background:linear-gradient(135deg,rgba(18,24,38,0.92) 50%,rgba(224,64,64,0.1)); animation:bb-slide-in 0.3s ease-out, bb-shake 0.5s ease-out; }
.bb-card-hero .bb-card-accent { background:linear-gradient(180deg,var(--bb-gold),#d4a017); box-shadow:0 0 8px rgba(240,165,0,0.4); }
.bb-card-hero { box-shadow:0 4px 20px rgba(240,165,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05); animation:bb-slide-in 0.3s ease-out, bb-gold-pulse 2s ease-in-out infinite; }
.bb-card-social .bb-card-accent { background:rgba(240,240,240,0.2); }
.bb-card-social { border:1px dashed rgba(240,240,240,0.15); background:rgba(20,24,32,0.8); }
.bb-card-sewer .bb-card-accent { background:var(--bb-sewer); }
.bb-card-park .bb-card-accent { background:var(--bb-park); }
.bb-card-gator .bb-card-accent { background:var(--bb-danger); }
.bb-card-gator { background:linear-gradient(135deg,rgba(18,24,38,0.92) 50%,rgba(60,90,58,0.15)); animation:bb-slide-in 0.3s ease-out, bb-shake 0.6s ease-out; }
.bb-card-speed .bb-card-accent { background:var(--bb-gold); }
.bb-card-speed::after { content:''; position:absolute; right:0; top:0; bottom:0; width:80px; background:linear-gradient(90deg,transparent,rgba(240,165,0,0.06)); pointer-events:none; }

/* ── placement cards ── */
.bb-card-placement {
  border:2px solid rgba(240,240,240,0.1); border-radius:14px; padding:0;
  text-align:center; overflow:hidden;
}
.bb-card-placement .bb-card-accent { display:none; }
.bb-card-placement .bb-card-header { justify-content:center; flex-wrap:wrap; padding:16px 16px 10px; }
.bb-card-placement .bb-card-header-placement { flex-direction:column; gap:8px; }
.bb-card-placement .bb-card-body { padding:8px 20px 18px; }
.bb-card-placement .bb-player { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:3px; }
.bb-card-placement .bb-badge { font-size:13px; padding:5px 16px; letter-spacing:2px; }
.bb-card-placement .bb-player-av { border-width:2px; }

.bb-card-placement-winner {
  background:linear-gradient(135deg,rgba(30,28,14,0.95) 0%,rgba(60,50,10,0.9) 50%,rgba(30,28,14,0.95) 100%);
  border-color:rgba(240,165,0,0.5);
  box-shadow:0 0 30px rgba(240,165,0,0.15), 0 8px 24px rgba(0,0,0,0.4);
  animation:bb-slide-in 0.4s ease-out, bb-winner-glow 2s ease-in-out infinite;
}
.bb-card-placement-winner .bb-player { color:var(--bb-gold); }
.bb-card-placement-winner .bb-badge { background:rgba(240,165,0,0.3); color:var(--bb-gold); font-size:15px; padding:6px 20px; }
.bb-card-placement-winner .bb-player-av { border-color:var(--bb-gold) !important; }

.bb-card-placement-second {
  background:linear-gradient(135deg,rgba(18,24,38,0.95) 0%,rgba(30,40,60,0.9) 50%,rgba(18,24,38,0.95) 100%);
  border-color:rgba(140,170,200,0.4);
  box-shadow:0 0 16px rgba(140,170,200,0.08), 0 6px 20px rgba(0,0,0,0.35);
  animation:bb-slide-in 0.5s ease-out, bb-second-fade 3s ease-in-out infinite;
}
.bb-card-placement-second .bb-player { color:var(--bb-metal); }
.bb-card-placement-second .bb-badge { background:rgba(140,170,200,0.2); color:var(--bb-metal); }
.bb-card-placement-second .bb-player-av { border-color:var(--bb-metal) !important; }

.bb-card-placement-loser {
  background:linear-gradient(135deg,rgba(30,14,14,0.95) 0%,rgba(50,20,20,0.9) 50%,rgba(30,14,14,0.95) 100%);
  border-color:rgba(224,64,64,0.4);
  box-shadow:0 0 16px rgba(224,64,64,0.08), 0 6px 20px rgba(0,0,0,0.35);
  animation:bb-slide-in 0.6s ease-out, bb-loser-shake 0.8s ease-out;
}
.bb-card-placement-loser .bb-player { color:var(--bb-danger); }
.bb-card-placement-loser .bb-badge { background:rgba(224,64,64,0.2); color:var(--bb-danger); }
.bb-card-placement-loser .bb-player-av { border-color:var(--bb-danger) !important; }

.bb-card .bb-badge { display:inline-block; font-family:'Bebas Neue',sans-serif; font-size:10px; letter-spacing:1.5px; padding:3px 10px; border-radius:20px; text-transform:uppercase; }
.bb-badge-climb { background:rgba(74,144,194,0.2); color:var(--bb-sky); }
.bb-badge-danger { background:rgba(224,64,64,0.2); color:var(--bb-danger); }
.bb-badge-hero { background:rgba(240,165,0,0.2); color:var(--bb-gold); }
.bb-badge-social { background:rgba(240,240,240,0.08); color:var(--bb-muted); }
.bb-badge-sewer { background:rgba(61,90,58,0.2); color:#6ab366; }
.bb-badge-gator { background:rgba(224,64,64,0.15); color:#e06060; }
.bb-badge-park { background:rgba(90,158,79,0.2); color:var(--bb-park); }
.bb-badge-speed { background:rgba(240,165,0,0.15); color:var(--bb-gold); }
.bb-badge-apple { background:rgba(200,40,40,0.15); color:#e06060; }
.bb-badge-carriage { background:rgba(74,144,194,0.15); color:var(--bb-sky); }

.bb-card .bb-txt { line-height:1.6; color:rgba(240,240,240,0.88); font-size:14px; }
.bb-card .bb-tribe-tag { display:inline-block; font-family:'Bebas Neue',sans-serif; font-size:10px; letter-spacing:1.5px; padding:2px 8px; border-radius:10px; vertical-align:middle; }

/* ── step visibility ── */
.bb-step-hidden { display:none; }
.bb-visible { display:block !important; }

/* ── chatter ── */
.bb-chatter { padding:8px 16px; font-size:13px; color:rgba(240,240,240,0.75); font-style:italic; background:rgba(14,18,26,0.6); border-radius:8px; margin:6px 0; backdrop-filter:blur(6px); }
.bb-chatter-host { font-style:normal; font-weight:700; color:var(--bb-gold); margin-right:4px; }

/* ── tribe POV header ── */
.bb-tribe-pov { font-family:'Bebas Neue',sans-serif; font-size:16px; letter-spacing:2px; padding:8px 16px; margin:12px 0 4px; border-radius:4px; }

/* ── phase header ── */
.bb-phase-hdr { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:3px; text-align:center; padding:14px 16px 6px; color:var(--bb-white); text-shadow:0 2px 8px rgba(0,0,0,0.7); background:rgba(14,18,26,0.6); border-radius:8px 8px 0 0; backdrop-filter:blur(4px); margin:0 -4px; }
.bb-phase-sub { font-family:'Barlow Condensed',sans-serif; font-size:14px; text-align:center; color:var(--bb-muted); margin-bottom:12px; background:rgba(14,18,26,0.6); padding:4px 16px 10px; border-radius:0 0 8px 8px; margin:0 -4px 12px; backdrop-filter:blur(4px); }

/* ── sub-phase header ── */
.bb-subphase { font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:2px; padding:12px 16px 4px; color:var(--bb-gold); border-bottom:1px solid rgba(240,165,0,0.2); margin:16px 0 8px; }

/* ── controls ── */
.bb-controls { position:fixed; bottom:0; left:0; right:0; z-index:100; background:rgba(10,14,20,0.95); backdrop-filter:blur(10px); border-top:1px solid rgba(240,240,240,0.1); padding:10px 20px; display:flex; align-items:center; justify-content:center; gap:16px; }
.bb-btn { font-family:'Bebas Neue',sans-serif; font-size:14px; letter-spacing:1.5px; padding:8px 20px; border:none; border-radius:4px; cursor:pointer; transition:opacity 0.2s; }
.bb-btn-reveal { background:var(--bb-gold); color:#111; }
.bb-btn-all { background:rgba(240,240,240,0.15); color:var(--bb-white); }
.bb-counter { font-family:'Bebas Neue',sans-serif; font-size:14px; color:var(--bb-muted); letter-spacing:1px; min-width:60px; text-align:center; }

/* ── title card ── */
.bb-title-wrap { text-align:center; padding:10px 20px 30px; display:flex; flex-direction:column; align-items:center; }
.bb-title-logo { font-family:'Bebas Neue',sans-serif; font-size:56px; letter-spacing:6px; color:var(--bb-gold); text-shadow:0 2px 12px rgba(240,165,0,0.4),0 0 40px rgba(240,165,0,0.15); margin:2px 0 2px; }
.bb-title-sub { font-family:'Barlow Condensed',sans-serif; font-size:15px; color:rgba(30,60,100,0.6); font-weight:600; max-width:500px; margin:0 auto 8px; }
.bb-title-phases { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin:8px 0; }
.bb-title-phase { background:rgba(14,18,26,0.85); border-radius:6px; padding:10px 14px; flex:1; min-width:180px; max-width:240px; border-left:3px solid var(--bb-gold); text-align:left; }
.bb-title-phase-num { font-family:'Bebas Neue',sans-serif; font-size:11px; letter-spacing:2px; color:var(--bb-gold); }
.bb-title-phase-name { font-family:'Bebas Neue',sans-serif; font-size:16px; letter-spacing:1px; margin:2px 0; }
.bb-title-phase-desc { font-size:11px; color:var(--bb-muted); }
.bb-title-tribes { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; margin-top:30px; }
.bb-title-tribe { background:rgba(14,18,26,0.8); border-radius:8px; padding:14px 18px; min-width:180px; text-align:left; }
.bb-title-tribe-name { font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:2px; margin-bottom:6px; }
.bb-title-tribe-members { font-size:13px; color:rgba(240,240,240,0.7); line-height:1.6; }

/* ── results ── */
.bb-results-wrap { text-align:center; padding:30px 20px; }
.bb-results-title { font-family:'Bebas Neue',sans-serif; font-size:36px; letter-spacing:3px; color:var(--bb-gold); margin-bottom:20px; }
.bb-podium { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; margin:20px 0; }
.bb-podium-slot { background:rgba(14,18,26,0.88); border-radius:8px; padding:20px; min-width:200px; flex:1; max-width:300px; }
.bb-podium-rank { font-family:'Bebas Neue',sans-serif; font-size:42px; }
.bb-podium-tribe { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; margin:8px 0; }
.bb-podium-time { font-size:14px; color:var(--bb-muted); }
.bb-podium-slot.bb-winner { border:2px solid var(--bb-gold); box-shadow:0 0 20px rgba(240,165,0,0.2); }
.bb-podium-slot.bb-loser { border:2px solid var(--bb-danger); opacity:0.8; }

/* ── sticky maps ── */
.bb-map-wrap { position:sticky; top:0; z-index:10; margin:0 0 16px; border-radius:10px; overflow:hidden; border:2px solid rgba(240,165,0,0.25); box-shadow:0 4px 20px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.2); }
.bb-map-wrap::before { content:'CLIMB TRACKER'; position:absolute; top:8px; left:12px; z-index:5; font-family:'Bebas Neue',sans-serif; font-size:11px; letter-spacing:2px; color:rgba(240,165,0,0.5); }

/* Phase 1 map — Climb Tracker */
.bb-map-climb { height:260px; background:linear-gradient(180deg,#0d1a2e 0%,#152642 30%,#1a3050 60%,#1e3a5c 100%); position:relative; }
.bb-map-climb .bb-statue-base { position:absolute; bottom:10px; left:50%; transform:translateX(-50%); width:80px; height:30px; background:linear-gradient(180deg,#5a4a20,#3a2a10); border-radius:4px; }
.bb-map-climb .bb-statue-body { position:absolute; bottom:40px; left:50%; transform:translateX(-50%); width:35px; height:140px; background:linear-gradient(180deg,#d4a017,#b08a10); border-radius:6px 6px 0 0; box-shadow:0 0 20px rgba(240,165,0,0.25); }
.bb-map-climb .bb-statue-head { position:absolute; bottom:180px; left:50%; transform:translateX(-50%); width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#d4a017,#f0c040); overflow:hidden; border:2px solid #b08a10; box-shadow:0 0 12px rgba(240,165,0,0.3); }
.bb-map-climb .bb-statue-head img { width:100%; height:100%; object-fit:cover; }
.bb-map-climb .bb-halo { position:absolute; bottom:176px; left:50%; transform:translateX(-50%); width:60px; height:60px; border-radius:50%; border:2px solid rgba(240,165,0,0.4); animation:bb-halo-pulse 3s ease-in-out infinite; box-shadow:0 0 16px rgba(240,165,0,0.15); }
.bb-map-climb .bb-arm { position:absolute; bottom:120px; width:40px; height:6px; background:linear-gradient(90deg,#d4a017,#b08a10); }
.bb-map-climb .bb-arm-l { left:calc(50% - 55px); border-radius:4px 0 0 4px; transform:rotate(-15deg); }
.bb-map-climb .bb-arm-r { left:calc(50% + 15px); border-radius:0 4px 4px 0; transform:rotate(15deg); }
.bb-map-climb .bb-rope { position:absolute; width:2px; background:repeating-linear-gradient(180deg,rgba(201,123,58,0.7) 0px,rgba(160,96,48,0.7) 3px,rgba(201,123,58,0.7) 6px); }
.bb-map-climb .bb-carriage-top { position:absolute; top:10px; width:22px; height:12px; background:var(--bb-gold); border-radius:3px; animation:bb-swing 4s ease-in-out infinite; box-shadow:0 0 8px rgba(240,165,0,0.3); }
.bb-map-climb .bb-climber { position:absolute; width:26px; height:26px; border-radius:50%; border:2px solid rgba(255,255,255,0.6); overflow:hidden; transition:bottom 0.6s ease-out; box-shadow:0 0 6px rgba(0,0,0,0.5); }
.bb-map-climb .bb-climber img { width:100%; height:100%; object-fit:cover; }
.bb-map-climb .bb-seg-label { position:absolute; right:12px; font-family:'Bebas Neue',sans-serif; font-size:10px; letter-spacing:1.5px; color:rgba(240,240,240,0.35); }

/* Phase 2 map — Sewer */
.bb-map-sewer { height:160px; background:linear-gradient(180deg,#1a1810,#0e0c08); position:relative; overflow:hidden; }
.bb-map-sewer::before { content:''; position:absolute; top:0; left:0; width:100%; height:100%;
  background:repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(80,60,40,0.08) 18px,rgba(80,60,40,0.08) 20px),
             repeating-linear-gradient(90deg,transparent,transparent 38px,rgba(80,60,40,0.08) 38px,rgba(80,60,40,0.08) 40px);
  pointer-events:none; }
.bb-map-sewer .bb-sewer-arch { position:absolute; top:0; left:10%; right:10%; height:40px; border-radius:0 0 50% 50%; background:linear-gradient(180deg,rgba(30,25,15,0.9),transparent); }
.bb-map-sewer .bb-sewer-floor { position:absolute; bottom:0; left:0; right:0; height:30px; background:linear-gradient(0deg,rgba(30,25,15,0.9),transparent); }
.bb-map-sewer .bb-sewer-water { position:absolute; bottom:0; left:0; right:0; height:25px; background:linear-gradient(180deg,rgba(40,90,60,0.4),rgba(30,70,50,0.6)); animation:bb-water-shimmer 3s ease-in-out infinite; }
.bb-map-sewer .bb-sewer-ripple { position:absolute; bottom:12px; width:30px; height:4px; border-radius:50%; background:rgba(60,120,80,0.3); animation:bb-ripple 4s ease-in-out infinite; }
.bb-map-sewer .bb-pipe { position:absolute; height:4px; background:linear-gradient(180deg,#666,#444); border-radius:2px; }
.bb-map-sewer .bb-drip { position:absolute; width:3px; height:6px; background:rgba(60,120,80,0.5); border-radius:0 0 3px 3px; animation:bb-drip-fall 3s linear infinite; }
.bb-map-sewer .bb-grate-light { position:absolute; top:0; width:40px; height:80px; background:linear-gradient(180deg,rgba(255,220,100,0.06),transparent); clip-path:polygon(30% 0%,70% 0%,100% 100%,0% 100%); }
.bb-map-sewer .bb-boat-marker { position:absolute; width:36px; height:14px; border-radius:0 0 8px 8px; transition:left 0.6s ease-out; display:flex; align-items:center; justify-content:center; transform:translateX(-50%); z-index:2; }
.bb-map-sewer .bb-boat-label { position:absolute; top:-18px; left:50%; transform:translateX(-50%); font-size:9px; font-weight:700; letter-spacing:0.5px; color:#fff; background:inherit; padding:1px 5px; border-radius:4px; white-space:nowrap; text-shadow:0 1px 2px rgba(0,0,0,0.8); pointer-events:none; }
.bb-map-sewer .bb-gator-eyes { position:absolute; bottom:18px; display:flex; gap:6px; }
.bb-map-sewer .bb-gator-eye { width:6px; height:4px; background:#d4d400; border-radius:50%; animation:bb-gator-blink 5s ease-in-out infinite; }
.bb-map-sewer .bb-seg-label-s { position:absolute; bottom:4px; font-family:'Bebas Neue',sans-serif; font-size:9px; letter-spacing:1px; color:rgba(240,240,240,0.2); }

/* Phase 3 map — Park */
.bb-map-park { height:160px; background:linear-gradient(180deg,#2a5a2a,#1a3a1a); position:relative; overflow:hidden; }
.bb-map-park::before { content:''; position:absolute; top:0; left:0; width:100%; height:100%;
  background:repeating-linear-gradient(0deg,transparent,transparent 8px,rgba(60,100,50,0.06) 8px,rgba(60,100,50,0.06) 10px);
  pointer-events:none; }
.bb-map-park .bb-pond { position:absolute; left:10%; top:30%; width:100px; height:50px; background:radial-gradient(ellipse,#2a6b5e,#1a4a3e); border-radius:50%; border:1px solid rgba(42,107,94,0.4); }
.bb-map-park .bb-pond-ripple { position:absolute; left:10%; top:30%; width:100px; height:50px; border-radius:50%; border:1px solid rgba(60,140,120,0.2); animation:bb-pond-ripple 4s ease-in-out infinite; pointer-events:none; }
.bb-map-park .bb-pond-apple { position:absolute; left:calc(10% + 42px); top:calc(30% + 16px); width:14px; height:14px; background:radial-gradient(circle,#e04040,#a02020); border-radius:50%; animation:bb-bob 2s ease-in-out infinite; }
.bb-map-park .bb-pond-apple::before { content:''; position:absolute; top:-4px; left:5px; width:3px; height:5px; background:#6a4a2a; border-radius:1px; }
.bb-map-park .bb-tree { position:absolute; }
.bb-map-park .bb-tree-top { width:30px; height:30px; background:radial-gradient(circle,#4a9a4a,#2a6a2a); border-radius:50%; }
.bb-map-park .bb-tree-trunk { width:6px; height:14px; background:#6a4a2a; margin:0 auto; border-radius:0 0 2px 2px; }
.bb-map-park .bb-track { position:absolute; bottom:40px; left:20%; right:10%; height:2px; background:repeating-linear-gradient(90deg,rgba(240,240,240,0.15) 0px,rgba(240,240,240,0.15) 6px,transparent 6px,transparent 12px); }
.bb-map-park .bb-checkpoint { position:absolute; bottom:35px; width:2px; height:14px; background:rgba(240,240,240,0.2); }
.bb-map-park .bb-carriage-marker { position:absolute; width:26px; height:14px; border-radius:4px; transition:left 0.6s ease-out; display:flex; align-items:center; justify-content:center; transform:translateX(-50%); z-index:2; }
.bb-map-park .bb-speed-lines { position:absolute; bottom:47px; width:30px; height:4px; background:linear-gradient(90deg,rgba(240,165,0,0.3),transparent); animation:bb-speed-fade 1s ease-in-out infinite; pointer-events:none; }
.bb-map-park .bb-finish { position:absolute; bottom:32px; right:10%; width:8px; height:24px; background:repeating-linear-gradient(0deg,#111 0px,#111 3px,#fff 3px,#fff 6px); }

/* ── icons ── */
.bb-icon { display:inline-block; width:18px; height:18px; vertical-align:middle; margin-right:6px; position:relative; }
.bb-icon .ic { display:block; width:100%; height:100%; position:relative; }

.bb-icon-rope .ic { width:3px; height:18px; margin:0 auto; background:repeating-linear-gradient(180deg,var(--bb-rust) 0px,#a06030 3px,var(--bb-rust) 6px); border-radius:1px; }
.bb-icon-hero .ic { width:18px; height:18px; background:var(--bb-gold); clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
.bb-icon-danger .ic { width:18px; height:18px; background:var(--bb-danger); clip-path:polygon(50% 0%,0% 100%,100% 100%); position:relative; }
.bb-icon-danger .ic::after { content:'!'; position:absolute; top:6px; left:7px; font-size:10px; font-weight:900; color:#fff; line-height:1; }
.bb-icon-pole .ic { width:3px; height:18px; margin:0 auto; background:var(--bb-metal); border-radius:1px; }
.bb-icon-speed .ic { display:flex; flex-direction:column; justify-content:center; gap:2px; }
.bb-icon-speed .ic::before { content:''; display:block; width:12px; height:2px; background:var(--bb-gold); border-radius:1px; }
.bb-icon-speed .ic::after { content:''; display:block; width:8px; height:2px; background:var(--bb-gold); border-radius:1px; }
.bb-icon-boat .ic { width:16px; height:10px; margin:4px auto 0; background:var(--bb-metal); border-radius:0 0 6px 6px; position:relative; }
.bb-icon-boat .ic::after { content:''; position:absolute; top:-5px; left:5px; width:6px; height:5px; background:var(--bb-metal); border-radius:2px 2px 0 0; }
.bb-icon-gator .ic { width:18px; height:8px; margin:5px 0; background:linear-gradient(90deg,#2a6a2a,#3d8a3d); border-radius:0 4px 4px 0; position:relative; }
.bb-icon-gator .ic::after { content:''; position:absolute; top:1px; right:2px; width:3px; height:3px; background:#d4d400; border-radius:50%; }
.bb-icon-apple .ic { width:14px; height:14px; margin:2px auto; background:radial-gradient(circle,#e04040,#a02020); border-radius:50%; position:relative; }
.bb-icon-apple .ic::before { content:''; position:absolute; top:-3px; left:5px; width:3px; height:4px; background:#6a4a2a; border-radius:1px; }
.bb-icon-turtle .ic { width:16px; height:12px; margin:3px auto; background:#3d8a3d; border-radius:50% 50% 30% 30%; position:relative; }
.bb-icon-turtle .ic::after { content:''; position:absolute; bottom:0; left:2px; width:4px; height:4px; background:#2a6a2a; border-radius:50%; }
.bb-icon-carriage .ic { width:16px; height:10px; margin:3px auto; background:var(--bb-sky); border-radius:3px; position:relative; }
.bb-icon-carriage .ic::before { content:''; position:absolute; bottom:-4px; left:2px; width:4px; height:4px; border-radius:50%; background:#666; border:1px solid #888; }
.bb-icon-carriage .ic::after { content:''; position:absolute; bottom:-4px; right:2px; width:4px; height:4px; border-radius:50%; background:#666; border:1px solid #888; }
.bb-icon-splash .ic { width:14px; height:14px; margin:2px auto; position:relative; }
.bb-icon-splash .ic::before { content:''; position:absolute; top:2px; left:3px; width:4px; height:6px; background:var(--bb-sky); border-radius:50%; transform:rotate(-15deg); }
.bb-icon-splash .ic::after { content:''; position:absolute; top:0; right:3px; width:3px; height:5px; background:rgba(74,144,194,0.7); border-radius:50%; transform:rotate(15deg); }

/* ── sidebar specifics ── */
.bb-sb-phase-dots { display:flex; gap:8px; justify-content:center; margin-bottom:10px; }
.bb-sb-dot { width:10px; height:10px; border-radius:50%; background:rgba(240,240,240,0.15); }
.bb-sb-dot-done { background:var(--bb-gold); }
.bb-sb-dot-active { background:var(--bb-gold); animation:bb-climber-pulse 1.5s infinite; }
.bb-sb-section { margin-top:10px; }
.bb-sb-label { font-family:'Bebas Neue',sans-serif; font-size:12px; letter-spacing:1.5px; color:var(--bb-muted); margin-bottom:4px; }
.bb-sb-tribe-row { display:flex; align-items:center; gap:6px; padding:3px 0; font-size:13px; }
.bb-sb-tribe-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.bb-sb-event { display:flex; align-items:center; gap:6px; padding:2px 0; font-size:12px; color:rgba(240,240,240,0.6); }
.bb-sb-event-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.bb-sb-player-row { display:flex; align-items:center; gap:6px; padding:2px 0; font-size:12px; }
.bb-sb-gator-status { font-family:'Bebas Neue',sans-serif; font-size:14px; letter-spacing:1px; padding:4px 8px; border-radius:4px; text-align:center; margin-top:6px; }
.bb-sb-role { font-size:12px; color:rgba(240,240,240,0.7); padding:2px 0; display:flex; align-items:center; gap:4px; }

.bb-avatar { border-radius:50%; object-fit:cover; vertical-align:middle; }

/* ── animations ── */
@keyframes bb-slide-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes bb-shake { 0%,100%{transform:translateX(0) rotate(0)} 20%{transform:translateX(-4px) rotate(-0.3deg)} 40%{transform:translateX(4px) rotate(0.3deg)} 60%{transform:translateX(-3px) rotate(-0.2deg)} 80%{transform:translateX(2px) rotate(0.1deg)} }
@keyframes bb-gold-pulse { 0%,100%{box-shadow:0 0 8px rgba(240,165,0,0.1)} 50%{box-shadow:0 0 18px rgba(240,165,0,0.25)} }
@keyframes bb-winner-glow { 0%,100%{box-shadow:0 0 20px rgba(240,165,0,0.1),0 8px 24px rgba(0,0,0,0.4)} 50%{box-shadow:0 0 40px rgba(240,165,0,0.25),0 8px 24px rgba(0,0,0,0.4)} }
@keyframes bb-second-fade { 0%,100%{border-color:rgba(140,170,200,0.25)} 50%{border-color:rgba(140,170,200,0.5)} }
@keyframes bb-loser-shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(6px)} 45%{transform:translateX(-5px)} 60%{transform:translateX(4px)} 75%{transform:translateX(-2px)} 90%{transform:translateX(1px)} }
@keyframes bb-twinkle { 0%{opacity:0.3} 100%{opacity:1} }
@keyframes bb-drift { 0%{transform:translateX(-150px)} 100%{transform:translateX(calc(100vw + 150px))} }
@keyframes bb-float-up { 0%{transform:translateY(0);opacity:0.15} 50%{opacity:0.3} 100%{transform:translateY(-200px);opacity:0} }
@keyframes bb-blink { 0%,45%,55%,100%{opacity:1} 50%{opacity:0} }
@keyframes bb-halo-pulse { 0%,100%{transform:translateX(-50%) scale(1);opacity:0.3} 50%{transform:translateX(-50%) scale(1.15);opacity:0.6} }
@keyframes bb-swing { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
@keyframes bb-climber-pulse { 0%,100%{box-shadow:0 0 4px rgba(255,255,255,0.2)} 50%{box-shadow:0 0 10px rgba(255,255,255,0.5)} }
@keyframes bb-water-shimmer { 0%,100%{opacity:0.7} 50%{opacity:1} }
@keyframes bb-ripple { 0%{transform:scaleX(0.9)} 50%{transform:scaleX(1.05)} 100%{transform:scaleX(0.9)} }
@keyframes bb-drip-fall { 0%{opacity:1;transform:translateY(0)} 80%{opacity:0.6} 100%{opacity:0;transform:translateY(30px)} }
@keyframes bb-gator-blink { 0%,40%,60%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.1)} }
@keyframes bb-pond-ripple { 0%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.1);opacity:0.1} 100%{transform:scale(1);opacity:0.3} }
@keyframes bb-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes bb-speed-fade { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
@keyframes bb-fly { 0%{transform:translateX(-40px)} 100%{transform:translateX(calc(100vw + 40px))} }
@keyframes bb-sparkle-float { 0%{transform:translateY(0) scale(1);opacity:0.4} 25%{opacity:0.8;transform:translateY(-15px) scale(1.3)} 50%{opacity:0.4;transform:translateY(-30px) scale(1)} 75%{opacity:0.7;transform:translateY(-45px) scale(1.2)} 100%{transform:translateY(-60px) scale(0.8);opacity:0} }

@media(prefers-reduced-motion:reduce) {
  .bb-card, .bb-card-danger, .bb-card-hero, .bb-card-gator, .bb-card-placement-winner, .bb-card-placement-second, .bb-card-placement-loser { animation:none !important; }
  .bb-bg-phase1 .bb-cloud, .bb-bg-phase1 .bb-dust, .bb-bg-phase1 .bb-p1-bird,
  .bb-bg-phase1 .bb-antenna-light, .bb-bg-phase3 .bb-p3-cloud, .bb-bg-phase3 .bb-p3-leaf, .bb-bg-phase3 .bb-p3-sunbeam,
  .bb-bg-title .bb-cloud, .bb-bg-title .bb-p1-bird, .bb-title-sparkle, .bb-al,
  .bb-bg-results .bb-star, .bb-bg-results .bb-cloud, .bb-bg-results .bb-antenna-light,
  .bb-title-statue-halo,
  .bb-map-climb .bb-halo, .bb-map-climb .bb-carriage-top, .bb-map-climb .bb-climber,
  .bb-map-sewer .bb-sewer-water, .bb-map-sewer .bb-sewer-ripple, .bb-map-sewer .bb-drip,
  .bb-map-sewer .bb-gator-eye, .bb-map-park .bb-pond-ripple, .bb-map-park .bb-pond-apple,
  .bb-map-park .bb-speed-lines, .bb-sb-dot-active { animation:none !important; }
}
`;

/* ───────────────────────── icon helper ───────────────────────── */

export function _icon(type) {
  return `<span class="bb-icon bb-icon-${type}"><span class="ic"></span></span>`;
}

/* ───────────────────────── chatter pools ───────────────────────── */

const _chatterPhase1 = [
  { host:true, text:`"The wind up here is no joke! Look at them hold on for dear life!"` },
  { host:true, text:`"Careful, climbers! One wrong grip and you're back at base!"` },
  { host:true, text:`"That statue has never looked so good. Or so terrifying."` },
  { host:true, text:`"Remember, the carriages at the top are your ticket to Phase 3!"` },
  { host:false, text:`A gust of wind rattles the ropes. Someone screams.` },
  { host:false, text:`Floodlights sweep across the statue, casting long shadows.` },
  { host:false, text:`The city hums below — oblivious to the chaos above.` },
  { host:false, text:`Dust falls from the statue's crown. The whole structure shudders.` },
  { host:true, text:`"I really outdid myself commissioning this statue. Just look at my jawline."` },
  { host:true, text:`"The pole slide is coming up — hope nobody's afraid of heights!"` },
  { host:false, text:`A helicopter spotlight sweeps the climb zone.` },
  { host:false, text:`Someone's shoe tumbles down into the darkness.` },
];

const _chatterPhase2 = [
  { host:true, text:`"Welcome to the underground. Try not to think about what's in the water."` },
  { host:true, text:`"These sewers were built in 1847. They smell like it too."` },
  { host:true, text:`"Was that... an alligator? In the SEWER? Who put that there? Oh right, me."` },
  { host:true, text:`"Navigate carefully — one wrong turn and you're swimming with the rats."` },
  { host:false, text:`Something slithers beneath the murky green water.` },
  { host:false, text:`A distant echo reverberates through the tunnel. Drip. Drip. Drip.` },
  { host:false, text:`The brick walls seep with moisture. The air tastes like pennies.` },
  { host:false, text:`A pipe bursts overhead, showering the tunnel in rusty water.` },
  { host:true, text:`"Fun fact: these tunnels connect to my personal panic room. Don't go there."` },
  { host:true, text:`"The gator hasn't been fed today. Just saying."` },
  { host:false, text:`A rat scurries across a pipe. Several contestants shriek.` },
  { host:false, text:`The current picks up. The boats lurch forward.` },
];

const _chatterPhase3 = [
  { host:true, text:`"Apple bobbing! A classic. Except these apples have been in the pond since Tuesday."` },
  { host:true, text:`"Get those carriages moving! The baby won't push itself!"` },
  { host:true, text:`"This is what Central Park was made for. Chaos."` },
  { host:true, text:`"Last stretch, people! Give it everything you've got!"` },
  { host:false, text:`Pigeons scatter as the carriages barrel through the park.` },
  { host:false, text:`A jogger dives out of the way. This is why the park was closed.` },
  { host:false, text:`The pond water is surprisingly cold. And green. Very green.` },
  { host:false, text:`Squirrels watch from the trees, judging.` },
  { host:true, text:`"Those carriages cost more than your collective prize money. Be careful! Actually, don't."` },
  { host:true, text:`"We're approaching the finish line! Who wants it more?!"` },
  { host:false, text:`A duck quacks angrily as pond water splashes everywhere.` },
  { host:false, text:`The afternoon sun glints off the carriage chrome.` },
];

function _pickChatter(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function _renderChatter(c) {
  if (c.host) return `<div class="bb-chatter"><span class="bb-chatter-host">Chris:</span> ${c.text}</div>`;
  return `<div class="bb-chatter">${c.text}</div>`;
}

/* ───────────────────────── backgrounds ───────────────────────── */

function _buildSkylineHTML() {
  return `<div class="bb-skyline-wrap">
    <div class="bb-sky-back">
      <div class="bb-b" style="left:0%;width:3.5%;height:220px"></div>
      <div class="bb-b" style="left:3%;width:4%;height:300px"><div class="bb-spire" style="top:-18px;left:40%;border-bottom:18px solid rgba(140,170,200,0.4)"></div></div>
      <div class="bb-b" style="left:6.5%;width:3%;height:260px"></div>
      <div class="bb-b" style="left:9%;width:5%;height:180px"></div>
      <div class="bb-b" style="left:13%;width:3.5%;height:340px"><div class="bb-spire" style="top:-24px;left:35%;border-bottom:24px solid rgba(140,170,200,0.45)"></div></div>
      <div class="bb-b" style="left:16%;width:4%;height:240px"></div>
      <div class="bb-b" style="left:19%;width:3%;height:280px"></div>
      <div class="bb-b" style="left:22%;width:5%;height:200px"></div>
      <div class="bb-b" style="left:26%;width:3.5%;height:320px"><div class="bb-ant" style="left:45%;top:-20px;height:20px;background:rgba(140,170,200,0.35)"><div class="bb-al" style="top:-3px;left:-1px;opacity:0.4;animation-delay:0.5s"></div></div></div>
      <div class="bb-b" style="left:29%;width:4%;height:250px"></div>
      <div class="bb-b" style="left:32%;width:3%;height:190px"></div>
      <div class="bb-b" style="left:35%;width:4.5%;height:310px"></div>
      <div class="bb-b" style="left:39%;width:3%;height:230px"></div>
      <div class="bb-b" style="left:41.5%;width:4%;height:270px"></div>
      <div class="bb-b" style="left:45%;width:3.5%;height:350px"><div class="bb-spire" style="top:-22px;left:38%;border-bottom:22px solid rgba(140,170,200,0.4)"></div></div>
      <div class="bb-b" style="left:48%;width:4%;height:210px"></div>
      <div class="bb-b" style="left:51.5%;width:3%;height:280px"></div>
      <div class="bb-b" style="left:54%;width:5%;height:240px"></div>
      <div class="bb-b" style="left:58.5%;width:3.5%;height:330px"><div class="bb-ant" style="left:42%;top:-18px;height:18px;background:rgba(140,170,200,0.3)"></div></div>
      <div class="bb-b" style="left:61.5%;width:4%;height:260px"></div>
      <div class="bb-b" style="left:65%;width:3%;height:200px"></div>
      <div class="bb-b" style="left:67.5%;width:4.5%;height:290px"></div>
      <div class="bb-b" style="left:71.5%;width:3%;height:220px"></div>
      <div class="bb-b" style="left:74%;width:4%;height:360px"><div class="bb-spire" style="top:-26px;left:36%;border-bottom:26px solid rgba(140,170,200,0.45)"></div></div>
      <div class="bb-b" style="left:77.5%;width:3.5%;height:250px"></div>
      <div class="bb-b" style="left:80.5%;width:4%;height:180px"></div>
      <div class="bb-b" style="left:84%;width:3%;height:300px"></div>
      <div class="bb-b" style="left:86.5%;width:4.5%;height:230px"></div>
      <div class="bb-b" style="left:90.5%;width:3.5%;height:270px"></div>
      <div class="bb-b" style="left:93.5%;width:4%;height:310px"><div class="bb-ant" style="left:45%;top:-16px;height:16px;background:rgba(140,170,200,0.3)"></div></div>
      <div class="bb-b" style="left:97%;width:3.5%;height:200px"></div>
    </div>
    <div class="bb-sky-mid">
      <div class="bb-b bb-b-cool" style="left:0%;width:5%;height:180px;opacity:0.8"><div class="bb-glass" style="left:60%"></div></div>
      <div class="bb-b bb-b-sand" style="left:4%;width:4.5%;height:250px;opacity:0.8"><div class="bb-crown" style="top:-10px;left:10%;width:80%;height:10px;background:rgba(90,120,150,0.6)"></div></div>
      <div class="bb-b bb-b-steel" style="left:8%;width:5.5%;height:200px;opacity:0.8"></div>
      <div class="bb-b bb-b-rose" style="left:12.5%;width:4%;height:280px;opacity:0.8"><div class="bb-spire" style="top:-16px;left:35%;border-bottom:16px solid rgba(120,80,100,0.7)"></div><div class="bb-glass" style="left:30%"></div></div>
      <div class="bb-b bb-b-cool" style="left:16%;width:5%;height:170px;opacity:0.8"></div>
      <div class="bb-b bb-b-teal" style="left:20%;width:4.5%;height:240px;opacity:0.8"><div class="bb-wt" style="top:-14px;left:30%;width:14px;height:10px;background:rgba(80,120,120,0.6)"></div></div>
      <div class="bb-b bb-b-warm" style="left:24%;width:5%;height:190px;opacity:0.8"><div class="bb-glass" style="left:20%"></div></div>
      <div class="bb-b bb-b-steel" style="left:28.5%;width:4%;height:260px;opacity:0.8"><div class="bb-ant" style="left:45%;top:-14px;height:14px;background:rgba(80,100,120,0.5)"><div class="bb-al" style="top:-3px;left:-1px;opacity:0.5;animation-delay:1.2s"></div></div></div>
      <div class="bb-b bb-b-sand" style="left:32%;width:5.5%;height:210px;opacity:0.8"></div>
      <div class="bb-b bb-b-cool" style="left:37%;width:4%;height:290px;opacity:0.8"><div class="bb-spire" style="top:-20px;left:32%;border-bottom:20px solid rgba(70,100,130,0.7)"></div><div class="bb-glass" style="left:50%"></div></div>
      <div class="bb-b bb-b-warm" style="left:40.5%;width:5%;height:180px;opacity:0.8"></div>
      <div class="bb-b bb-b-slate" style="left:45%;width:4.5%;height:230px;opacity:0.8"></div>
      <div class="bb-b bb-b-rose" style="left:49%;width:4%;height:270px;opacity:0.8"><div class="bb-crown" style="top:-8px;left:8%;width:84%;height:8px;background:rgba(100,70,85,0.6)"></div></div>
      <div class="bb-b bb-b-teal" style="left:52.5%;width:5.5%;height:200px;opacity:0.8"><div class="bb-glass" style="left:40%"></div></div>
      <div class="bb-b bb-b-steel" style="left:57.5%;width:4%;height:250px;opacity:0.8"></div>
      <div class="bb-b bb-b-warm" style="left:61%;width:5%;height:170px;opacity:0.8"></div>
      <div class="bb-b bb-b-cool" style="left:65.5%;width:4.5%;height:300px;opacity:0.8"><div class="bb-spire" style="top:-18px;left:34%;border-bottom:18px solid rgba(70,100,130,0.7)"></div></div>
      <div class="bb-b bb-b-sand" style="left:69.5%;width:5%;height:220px;opacity:0.8"><div class="bb-glass" style="left:60%"></div></div>
      <div class="bb-b bb-b-slate" style="left:74%;width:4%;height:260px;opacity:0.8"><div class="bb-wt" style="top:-12px;left:28%;width:12px;height:8px;background:rgba(70,85,100,0.6)"></div></div>
      <div class="bb-b bb-b-rose" style="left:77.5%;width:5.5%;height:190px;opacity:0.8"></div>
      <div class="bb-b bb-b-teal" style="left:82.5%;width:4%;height:280px;opacity:0.8"><div class="bb-ant" style="left:42%;top:-16px;height:16px;background:rgba(60,100,100,0.5)"></div></div>
      <div class="bb-b bb-b-warm" style="left:86%;width:5%;height:230px;opacity:0.8"><div class="bb-glass" style="left:35%"></div></div>
      <div class="bb-b bb-b-cool" style="left:90.5%;width:4.5%;height:170px;opacity:0.8"></div>
      <div class="bb-b bb-b-steel" style="left:94.5%;width:5.5%;height:250px;opacity:0.8"><div class="bb-crown" style="top:-10px;left:12%;width:76%;height:10px;background:rgba(80,100,110,0.6)"></div></div>
    </div>
    <div class="bb-sky-front">
      <div class="bb-b bb-b-dark" style="left:0%;width:6%;height:140px"><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:30px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:6px;bottom:52px"></div><div class="bb-w" style="left:18px;bottom:52px"></div><div class="bb-glass" style="left:65%"></div></div>
      <div class="bb-b bb-b-warm" style="left:5%;width:4.5%;height:200px"><div class="bb-spire" style="top:-20px;left:30%;border-bottom:20px solid #5a4a3a"></div><div class="bb-al" style="top:-24px;left:38%;animation-delay:0.3s"></div><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:6px;bottom:52px"></div><div class="bb-w" style="left:18px;bottom:52px"></div><div class="bb-w" style="left:6px;bottom:66px"></div></div>
      <div class="bb-b bb-b-slate" style="left:9%;width:7%;height:130px"><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:42px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:30px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:30px;bottom:38px"></div><div class="bb-glass" style="left:50%"></div></div>
      <div class="bb-b bb-b-cool" style="left:15%;width:5%;height:220px"><div class="bb-crown" style="top:-12px;left:8%;width:84%;height:12px;background:#3a5570"></div><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:30px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:6px;bottom:52px"></div><div class="bb-w" style="left:18px;bottom:52px"></div><div class="bb-w" style="left:6px;bottom:66px"></div></div>
      <div class="bb-b bb-b-sand" style="left:19.5%;width:5.5%;height:160px"><div class="bb-wt" style="top:-16px;left:35%;width:16px;height:12px;background:#7a6a4a"></div><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:30px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-glass" style="left:20%"></div></div>
      <div class="bb-b bb-b-rose" style="left:24.5%;width:4%;height:240px"><div class="bb-spire" style="top:-22px;left:28%;border-bottom:22px solid #6a4a58"></div><div class="bb-al" style="top:-26px;left:34%;animation-delay:1.5s"></div><div class="bb-w" style="left:5px;bottom:10px"></div><div class="bb-w" style="left:16px;bottom:10px"></div><div class="bb-w" style="left:5px;bottom:24px"></div><div class="bb-w" style="left:16px;bottom:24px"></div><div class="bb-w" style="left:5px;bottom:38px"></div><div class="bb-w" style="left:16px;bottom:38px"></div><div class="bb-w" style="left:5px;bottom:52px"></div><div class="bb-w" style="left:5px;bottom:66px"></div></div>
      <div class="bb-b bb-b-dark" style="left:28%;width:6.5%;height:150px"><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:42px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:30px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:30px;bottom:38px"></div><div class="bb-w" style="left:6px;bottom:52px"></div><div class="bb-w" style="left:18px;bottom:52px"></div></div>
      <div class="bb-b bb-b-teal" style="left:34%;width:4.5%;height:190px"><div class="bb-ant" style="left:42%;top:-18px;height:18px;background:#3a6060"><div class="bb-al" style="top:-3px;left:-1px;animation-delay:0.8s"></div></div><div class="bb-w" style="left:5px;bottom:10px"></div><div class="bb-w" style="left:16px;bottom:10px"></div><div class="bb-w" style="left:27px;bottom:10px"></div><div class="bb-w" style="left:5px;bottom:24px"></div><div class="bb-w" style="left:16px;bottom:24px"></div><div class="bb-w" style="left:5px;bottom:38px"></div><div class="bb-w" style="left:16px;bottom:38px"></div><div class="bb-w" style="left:5px;bottom:52px"></div><div class="bb-glass" style="left:70%"></div></div>
      <div class="bb-b bb-b-steel" style="left:38%;width:5%;height:170px"><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:30px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:6px;bottom:52px"></div></div>
      <div class="bb-b bb-b-warm" style="left:56%;width:5.5%;height:180px"><div class="bb-crown" style="top:-10px;left:10%;width:80%;height:10px;background:#5a4a3a"></div><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:30px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:6px;bottom:52px"></div></div>
      <div class="bb-b bb-b-cool" style="left:61%;width:4.5%;height:230px"><div class="bb-spire" style="top:-24px;left:30%;border-bottom:24px solid #3a5570"></div><div class="bb-al" style="top:-28px;left:36%;animation-delay:2.1s"></div><div class="bb-w" style="left:5px;bottom:10px"></div><div class="bb-w" style="left:16px;bottom:10px"></div><div class="bb-w" style="left:27px;bottom:10px"></div><div class="bb-w" style="left:5px;bottom:24px"></div><div class="bb-w" style="left:16px;bottom:24px"></div><div class="bb-w" style="left:27px;bottom:24px"></div><div class="bb-w" style="left:5px;bottom:38px"></div><div class="bb-w" style="left:16px;bottom:38px"></div><div class="bb-w" style="left:5px;bottom:52px"></div><div class="bb-w" style="left:16px;bottom:52px"></div><div class="bb-w" style="left:5px;bottom:66px"></div><div class="bb-glass" style="left:60%"></div></div>
      <div class="bb-b bb-b-dark" style="left:65%;width:5.5%;height:145px"><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:30px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div></div>
      <div class="bb-b bb-b-sand" style="left:70%;width:5%;height:210px"><div class="bb-wt" style="top:-16px;left:32%;width:16px;height:12px;background:#7a6a4a"></div><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:6px;bottom:52px"></div><div class="bb-w" style="left:6px;bottom:66px"></div><div class="bb-glass" style="left:25%"></div></div>
      <div class="bb-b bb-b-rose" style="left:74.5%;width:4.5%;height:175px"><div class="bb-w" style="left:5px;bottom:10px"></div><div class="bb-w" style="left:16px;bottom:10px"></div><div class="bb-w" style="left:27px;bottom:10px"></div><div class="bb-w" style="left:5px;bottom:24px"></div><div class="bb-w" style="left:16px;bottom:24px"></div><div class="bb-w" style="left:5px;bottom:38px"></div><div class="bb-w" style="left:16px;bottom:38px"></div><div class="bb-w" style="left:5px;bottom:52px"></div></div>
      <div class="bb-b bb-b-steel" style="left:78.5%;width:6%;height:195px"><div class="bb-ant" style="left:45%;top:-20px;height:20px;background:#4a5a6a"><div class="bb-al" style="top:-3px;left:-1px;animation-delay:1.8s"></div></div><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:42px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:30px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:30px;bottom:38px"></div><div class="bb-w" style="left:6px;bottom:52px"></div><div class="bb-w" style="left:18px;bottom:52px"></div><div class="bb-glass" style="left:70%"></div></div>
      <div class="bb-b bb-b-teal" style="left:84%;width:4.5%;height:160px"><div class="bb-w" style="left:5px;bottom:10px"></div><div class="bb-w" style="left:16px;bottom:10px"></div><div class="bb-w" style="left:27px;bottom:10px"></div><div class="bb-w" style="left:5px;bottom:24px"></div><div class="bb-w" style="left:16px;bottom:24px"></div><div class="bb-w" style="left:5px;bottom:38px"></div><div class="bb-w" style="left:16px;bottom:38px"></div></div>
      <div class="bb-b bb-b-warm" style="left:88%;width:5%;height:225px"><div class="bb-spire" style="top:-20px;left:32%;border-bottom:20px solid #5a4a3a"></div><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:30px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div><div class="bb-w" style="left:18px;bottom:38px"></div><div class="bb-w" style="left:6px;bottom:52px"></div><div class="bb-w" style="left:6px;bottom:66px"></div><div class="bb-glass" style="left:55%"></div></div>
      <div class="bb-b bb-b-dark" style="left:92.5%;width:4%;height:155px"><div class="bb-w" style="left:5px;bottom:10px"></div><div class="bb-w" style="left:16px;bottom:10px"></div><div class="bb-w" style="left:5px;bottom:24px"></div><div class="bb-w" style="left:16px;bottom:24px"></div><div class="bb-w" style="left:5px;bottom:38px"></div><div class="bb-w" style="left:16px;bottom:38px"></div></div>
      <div class="bb-b bb-b-slate" style="left:96%;width:4.5%;height:185px"><div class="bb-crown" style="top:-8px;left:10%;width:80%;height:8px;background:#3a4a5a"></div><div class="bb-w" style="left:6px;bottom:10px"></div><div class="bb-w" style="left:18px;bottom:10px"></div><div class="bb-w" style="left:6px;bottom:24px"></div><div class="bb-w" style="left:18px;bottom:24px"></div><div class="bb-w" style="left:6px;bottom:38px"></div></div>
    </div>
  </div>`;
}

function _bgPhase1() {
  let clouds = '';
  for (let i = 0; i < 5; i++) {
    const y = 5 + Math.random() * 25, w = 70 + Math.random() * 90, h = 18 + Math.random() * 14;
    clouds += `<div class="bb-cloud" style="top:${y}%;width:${w}px;height:${h}px;animation-delay:${i*10}s"></div>`;
  }
  let birds = '';
  for (let i = 0; i < 4; i++) {
    birds += `<div class="bb-p1-bird" style="top:${8+Math.random()*18}%;animation-delay:${i*5}s">~</div>`;
  }
  let dust = '';
  for (let i = 0; i < 15; i++) {
    dust += `<div class="bb-dust" style="left:${Math.random()*100}%;bottom:${Math.random()*30}%;animation-delay:${Math.random()*8}s"></div>`;
  }
  return `<div class="bb-bg bb-bg-phase1">${clouds}${birds}${_buildSkylineHTML()}${dust}</div>`;
}

function _bgPhase2() {
  return `<div class="bb-bg bb-bg-phase2"></div>`;
}

function _bgPhase3() {
  let clouds = '';
  for (let i = 0; i < 4; i++) {
    const y = 3 + Math.random() * 18, w = 80 + Math.random() * 120, h = 20 + Math.random() * 20;
    clouds += `<div class="bb-p3-cloud" style="top:${y}%;width:${w}px;height:${h}px;animation-delay:${i*12}s"></div>`;
  }
  const treeColors = ['#2a5a28','#1e4a1c','#3a6a30','#2a4a20','#1a3a18','#345a2a'];
  let trees = '';
  for (let i = 0; i < 12; i++) {
    const x = 3 + i * 8 + (Math.random() * 4 - 2);
    const crownW = 20 + Math.random() * 18;
    const crownH = 16 + Math.random() * 14;
    const trunkH = 12 + Math.random() * 10;
    const color = treeColors[i % treeColors.length];
    trees += `<div class="bb-p3-tree" style="left:${x}%">`;
    trees += `<div class="bb-p3-crown" style="width:${crownW}px;height:${crownH}px;background:radial-gradient(ellipse at 40% 35%,${color},${color}dd)"></div>`;
    trees += `<div class="bb-p3-trunk" style="height:${trunkH}px"></div>`;
    trees += `</div>`;
  }
  let leaves = '';
  const leafColors = ['#5a8a40','#4a7a30','#6a9a4a','#8aaa50','#3a6a28'];
  for (let i = 0; i < 8; i++) {
    const x = 5 + Math.random() * 90;
    const color = leafColors[i % leafColors.length];
    leaves += `<div class="bb-p3-leaf" style="left:${x}%;top:${30 + Math.random() * 20}%;background:${color};animation-delay:${i * 1.5}s"></div>`;
  }
  let sunbeams = '';
  for (let i = 0; i < 3; i++) {
    sunbeams += `<div class="bb-p3-sunbeam" style="left:${15 + i * 30}%"></div>`;
  }
  let lampposts = '';
  for (let i = 0; i < 3; i++) {
    const x = 18 + i * 30;
    lampposts += `<div class="bb-p3-lamppost" style="left:${x}%;height:${60 + Math.random() * 20}px"><div class="bb-p3-lamp"></div></div>`;
  }
  return `<div class="bb-bg bb-bg-phase3">${clouds}${sunbeams}${_buildSkylineHTML()}${trees}<div class="bb-p3-canopy"></div>${leaves}${lampposts}<div class="bb-p3-path"></div></div>`;
}

function _bgTitle() {
  let clouds = '';
  for (let i = 0; i < 7; i++) {
    const y = 4 + Math.random() * 28, w = 80 + Math.random() * 100, h = 20 + Math.random() * 18;
    clouds += `<div class="bb-cloud" style="top:${y}%;width:${w}px;height:${h}px;animation-delay:${i*7}s"></div>`;
  }
  let birds = '';
  for (let i = 0; i < 5; i++) {
    const size = 8 + Math.random() * 5;
    birds += `<div class="bb-p1-bird" style="top:${5+Math.random()*20}%;font-size:${size}px;animation-delay:${i*4}s">~</div>`;
  }
  return `<div class="bb-bg bb-bg-title">${clouds}${birds}${_buildSkylineHTML()}</div>`;
}

function _bgResults() {
  let stars = '';
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 100, y = Math.random() * 60, d = 1 + Math.random() * 3;
    stars += `<div class="bb-star" style="left:${x}%;top:${y}%;animation-delay:${d}s;width:${1+Math.random()*2}px;height:${1+Math.random()*2}px"></div>`;
  }
  let clouds = '';
  for (let i = 0; i < 3; i++) {
    clouds += `<div class="bb-cloud" style="top:${12+i*14}%;width:${90+Math.random()*80}px;height:${18+Math.random()*12}px;animation-delay:${i*15}s"></div>`;
  }
  const moon = `<div class="bb-moon"></div>`;
  return `<div class="bb-bg bb-bg-results">${stars}${moon}${clouds}${_buildSkylineHTML()}</div>`;
}

/* ───────────────────────── maps ───────────────────────── */

function _buildClimbMap(ep) {
  const d = ep.broadwayBaby;
  const tribes = d.tribes || [];
  const climb = d.phase1?.climbProgress || {};

  // Ropes per tribe
  const ropePositions = [
    { left:'25%' }, { left:'38%' }, { left:'62%' }, { left:'75%' }
  ];

  let ropes = '';
  tribes.forEach((t, ti) => {
    const rp = ropePositions[ti] || ropePositions[0];
    ropes += `<div class="bb-rope" style="left:${rp.left};top:20px;height:220px"></div>`;
    // Carriage at top
    const ts = _tribeStyle(t.color);
    ropes += `<div class="bb-carriage-top" style="left:calc(${rp.left} - 14px);background:${ts.bg};animation-delay:${ti*0.8}s"></div>`;
    (t.members || []).forEach((m, mi) => {
      const offsetX = (mi - 1) * 22;
      ropes += `<div class="bb-climber" id="bb-climber-${(m||'').replace(/\s+/g,'-')}" style="left:calc(${rp.left} + ${offsetX}px - 14px);bottom:40px;border-color:${ts.bg};transition:bottom 0.6s ease-out">${_avatar(m, 24)}</div>`;
    });
  });

  const segLabels = `
    <div class="bb-seg-label" style="top:10px">TOP</div>
    <div class="bb-seg-label" style="top:100px">SEG 2</div>
    <div class="bb-seg-label" style="bottom:30px">BASE</div>
  `;

  return `<div class="bb-map-wrap"><div class="bb-map-climb">
    <div class="bb-statue-base"></div>
    <div class="bb-statue-body"></div>
    <div class="bb-statue-head"><img src="assets/avatars/chris.png" onerror="this.style.display='none'"></div>
    <div class="bb-halo"></div>
    <div class="bb-arm bb-arm-l"></div>
    <div class="bb-arm bb-arm-r"></div>
    ${ropes}${segLabels}
  </div></div>`;
}

function _buildSewerMap(ep) {
  const d = ep.broadwayBaby;
  const tribes = d.tribes || [];
  const segments = d.phase2?.segments || [];

  // Pipes
  let pipes = '';
  const pipePos = [
    { top:15, left:'5%', width:'18%' }, { top:8, left:'40%', width:'15%' },
    { top:20, left:'70%', width:'20%' }, { top:30, left:'25%', width:'12%' }
  ];
  pipePos.forEach(p => {
    pipes += `<div class="bb-pipe" style="top:${p.top}px;left:${p.left};width:${p.width}"></div>`;
  });

  // Drips
  let drips = '';
  for (let i = 0; i < 6; i++) {
    drips += `<div class="bb-drip" style="left:${10+i*15}%;top:${20+Math.random()*10}px;animation-delay:${i*0.7}s"></div>`;
  }

  // Grate lights
  let grates = '';
  for (let i = 0; i < 3; i++) {
    grates += `<div class="bb-grate-light" style="left:${15+i*30}%"></div>`;
  }

  // Ripples
  let ripples = '';
  for (let i = 0; i < 4; i++) {
    ripples += `<div class="bb-sewer-ripple" style="left:${10+i*22}%;animation-delay:${i*1.2}s"></div>`;
  }

  // Boat markers — start at ENTRY, updated live by _updateSewerMap
  let boats = '';
  const segLabels = ['ENTRY','FORK 1','PIPES','CURRENT','EXIT'];
  const segCount = segLabels.length;
  tribes.forEach((t, ti) => {
    const ts = _tribeStyle(t.color);
    const label = (t.tribeName || '').split(/\s+/).map(w => w[0]).join('').toUpperCase();
    const bottomPx = 28 + ti * 22;
    boats += `<div class="bb-boat-marker" id="bb-boat-${(t.tribeName||'').replace(/\s+/g,'-')}" style="left:10%;bottom:${bottomPx}px;background:${ts.bg}"><div class="bb-boat-label" style="background:${ts.bg}">${label}</div></div>`;
  });

  // Gator eyes
  const gatorPct = 50 + Math.random() * 20;
  const gatorEyes = `<div class="bb-gator-eyes" style="left:${gatorPct}%"><div class="bb-gator-eye"></div><div class="bb-gator-eye"></div></div>`;

  // Segment labels
  let sLabels = '';
  segLabels.forEach((l, i) => {
    sLabels += `<div class="bb-seg-label-s" style="left:${10 + i * (75 / (segCount - 1))}%">${l}</div>`;
  });

  return `<div class="bb-map-wrap"><div class="bb-map-sewer">
    <div class="bb-sewer-arch"></div>
    <div class="bb-sewer-floor"></div>
    <div class="bb-sewer-water"></div>
    ${ripples}${pipes}${drips}${grates}${boats}${gatorEyes}${sLabels}
  </div></div>`;
}

function _buildParkMap(ep) {
  const d = ep.broadwayBaby;
  const tribes = d.tribes || [];
  const carriageRace = d.phase3?.carriageRace || [];

  // Trees
  let trees = '';
  const treePos = [{ l:'5%',t:'15%' },{ l:'75%',t:'10%' },{ l:'88%',t:'20%' },{ l:'45%',t:'5%' }];
  treePos.forEach(tp => {
    trees += `<div class="bb-tree" style="left:${tp.l};top:${tp.t}"><div class="bb-tree-top"></div><div class="bb-tree-trunk"></div></div>`;
  });

  // Track + checkpoints
  const track = `<div class="bb-track"></div>`;
  let checkpoints = '';
  for (let i = 0; i < 5; i++) {
    checkpoints += `<div class="bb-checkpoint" style="left:${20+i*15}%"></div>`;
  }

  // Carriage markers — start at pond (20%), updated live by _updateParkMap
  let carriages = '';
  const label = (name) => (name || '').split(/\s+/).map(w => w[0]).join('').toUpperCase();
  tribes.forEach((t, ti) => {
    const ts = _tribeStyle(t.color);
    const tid = (t.tribeName || '').replace(/\s+/g, '-');
    const bottomPx = 43 + ti * 18;
    carriages += `<div class="bb-carriage-marker" id="bb-carriage-${tid}" style="left:20%;bottom:${bottomPx}px;background:${ts.bg}"><span style="font-size:8px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.8);line-height:12px">${label(t.tribeName)}</span></div>`;
  });

  // Speed lines behind leader
  const speedLines = `<div class="bb-speed-lines" style="left:60%"></div>`;

  // Finish line
  const finish = `<div class="bb-finish"></div>`;

  return `<div class="bb-map-wrap"><div class="bb-map-park">
    ${trees}
    <div class="bb-pond"></div><div class="bb-pond-ripple"></div><div class="bb-pond-apple"></div>
    ${track}${checkpoints}${carriages}${speedLines}${finish}
  </div></div>`;
}

/* ───────────────────────── sidebar ───────────────────────── */

function _buildSidebarContent(ep, phase, revealIdx) {
  const d = ep.broadwayBaby;
  const tribes = d.tribes || [];
  revealIdx = revealIdx ?? -1;

  // Phase dots
  const phases = ['phase1','phase2','phase3'];
  const phaseLabels = ['COLOSSUS','SEWERS','PARK'];
  const curPhaseIdx = phases.indexOf(phase);
  let dots = '<div class="bb-sb-phase-dots">';
  phases.forEach((p, i) => {
    const cls = i < curPhaseIdx ? 'bb-sb-dot bb-sb-dot-done' : i === curPhaseIdx ? 'bb-sb-dot bb-sb-dot-active' : 'bb-sb-dot';
    dots += `<div class="${cls}" title="${phaseLabels[i]}"></div>`;
  });
  dots += '</div>';

  // Team rosters with player icons
  let standings = '<div class="bb-sb-section"><div class="bb-sb-label">TEAMS</div>';
  const results = d.tribeResults || [];
  tribes.forEach(t => {
    const ts = _tribeStyle(t.color);
    const res = results.find(r => r.tribeName === t.tribeName);
    const timeStr = (phase === 'results' && res) ? `<span style="color:var(--bb-muted);font-size:11px;margin-left:auto">${res.time}s</span>` : '';
    standings += `<div style="margin:8px 0 4px;display:flex;align-items:center;gap:6px">
      <div class="bb-sb-tribe-dot" style="background:${ts.bg}"></div>
      <span style="color:${ts.text};font-family:'Bebas Neue',sans-serif;letter-spacing:1px;font-size:14px">${t.tribeName}</span>${timeStr}
    </div>`;
    standings += `<div style="display:flex;flex-wrap:wrap;gap:4px;padding-left:4px">`;
    (t.members || []).forEach(m => {
      standings += `<div style="width:26px;height:26px;border-radius:50%;overflow:hidden;border:2px solid ${ts.bg};flex-shrink:0" title="${m}">${_avatar(m, 26)}</div>`;
    });
    standings += `</div>`;
  });
  standings += '</div>';

  // Phase-specific content
  let specific = '';

  if (phase === 'phase1') {
    // Climb progress
    const climbProg = d.phase1?.climbProgress || {};
    const stepMeta = window._bbPhase1StepMeta || [];
    const revealedEvents = stepMeta.slice(0, revealIdx + 1);

    specific += '<div class="bb-sb-section"><div class="bb-sb-label">CLIMB PROGRESS</div>';
    const featured = {};
    revealedEvents.forEach(ev => {
      if (ev.player && ev.tribe) {
        if (!featured[ev.player]) featured[ev.player] = { tribe: ev.tribe, segs: 0 };
        if (ev.type === 'climb' || ev.type === 'hero' || ev.type === 'advance') featured[ev.player].segs++;
      }
    });
    Object.entries(featured).forEach(([name, info]) => {
      const t = tribes.find(tr => tr.tribeName === info.tribe);
      const ts = t ? _tribeStyle(t.color) : _tribeStyle('red');
      specific += `<div class="bb-sb-player-row">${_avatar(name, 20)} <span style="color:${ts.text}">${name}</span> <span style="margin-left:auto;color:var(--bb-muted)">${info.segs} seg</span></div>`;
    });
    specific += '</div>';


  } else if (phase === 'phase2') {
    // Navigator
    const navs = d.phase2?.navigators || {};
    specific += '<div class="bb-sb-section"><div class="bb-sb-label">NAVIGATORS</div>';
    Object.entries(navs).forEach(([tName, pName]) => {
      const t = tribes.find(tr => tr.tribeName === tName);
      const ts = t ? _tribeStyle(t.color) : _tribeStyle('red');
      specific += `<div class="bb-sb-player-row">${_avatar(pName, 20)} <span style="color:${ts.text}">${pName}</span> <span style="margin-left:auto;font-size:11px;color:var(--bb-muted)">for ${tName}</span></div>`;
    });
    specific += '</div>';

    // Gator status
    const stepMeta2 = window._bbPhase2StepMeta || [];
    const revealed2 = stepMeta2.slice(0, revealIdx + 1);
    const hasGatorAttack = revealed2.some(e => e.type === 'gator' || e.type === 'gator-attack');
    const gatorStatus = hasGatorAttack ? 'ATTACKING' : 'LURKING';
    const gatorColor = hasGatorAttack ? 'var(--bb-danger)' : 'var(--bb-sewer)';
    specific += `<div class="bb-sb-gator-status" style="background:${hasGatorAttack ? 'rgba(224,64,64,0.15)' : 'rgba(61,90,58,0.15)'};color:${gatorColor}">${_icon('gator')} GATOR: ${gatorStatus}</div>`;

  } else if (phase === 'phase3') {
    // Roles
    const roles = d.phase3?.roles || {};
    specific += '<div class="bb-sb-section"><div class="bb-sb-label">ROLE ASSIGNMENTS</div>';
    tribes.forEach(t => {
      const ts = _tribeStyle(t.color);
      const r = roles[t.tribeName];
      if (r) {
        specific += `<div style="margin:6px 0 2px"><span style="color:${ts.text};font-family:'Bebas Neue',sans-serif;letter-spacing:1px">${t.tribeName}</span></div>`;
        if (r.bobber) specific += `<div class="bb-sb-role">${_avatar(r.bobber, 18)} ${_icon('apple')} <span>${r.bobber}</span> <span style="color:var(--bb-muted);margin-left:auto">BOBBER</span></div>`;
        if (r.baby) specific += `<div class="bb-sb-role">${_avatar(r.baby, 18)} ${_icon('carriage')} <span>${r.baby}</span> <span style="color:var(--bb-muted);margin-left:auto">BABY</span></div>`;
        if (r.pushers && r.pushers.length) {
          r.pushers.forEach(p => {
            specific += `<div class="bb-sb-role">${_avatar(p, 18)} ${_icon('speed')} <span>${p}</span> <span style="color:var(--bb-muted);margin-left:auto">PUSHER</span></div>`;
          });
        }
      }
    });
    specific += '</div>';

    // Apple bob status
    const stepMeta3 = window._bbPhase3StepMeta || [];
    const revealed3 = stepMeta3.slice(0, revealIdx + 1);
    const appleDone = {};
    revealed3.forEach(e => {
      if (e.type === 'apple-success' && e.tribe) appleDone[e.tribe] = true;
    });
    specific += '<div class="bb-sb-section"><div class="bb-sb-label">APPLE BOB STATUS</div>';
    tribes.forEach(t => {
      const ts = _tribeStyle(t.color);
      const done = appleDone[t.tribeName];
      specific += `<div class="bb-sb-tribe-row"><div class="bb-sb-tribe-dot" style="background:${ts.bg}"></div><span style="color:${ts.text}">${t.tribeName}</span><span style="margin-left:auto;color:${done ? 'var(--bb-gold)' : 'var(--bb-muted)'}">${done ? 'GOT IT' : '---'}</span></div>`;
    });
    specific += '</div>';

    // Race progress (only once race events appear)
    const raceRevealed = revealed3.filter(e => e.subphase === 'race');
    if (raceRevealed.length > 0) {
      const maxSeg = {};
      raceRevealed.forEach(e => {
        if (e.tribe && e.segment) {
          if (!maxSeg[e.tribe] || e.segment > maxSeg[e.tribe]) maxSeg[e.tribe] = e.segment;
        }
      });
      specific += '<div class="bb-sb-section"><div class="bb-sb-label">RACE PROGRESS</div>';
      tribes.forEach(t => {
        const ts = _tribeStyle(t.color);
        const seg = maxSeg[t.tribeName] || 0;
        const pct = Math.round((seg / 5) * 100);
        specific += `<div class="bb-sb-tribe-row"><div class="bb-sb-tribe-dot" style="background:${ts.bg}"></div><span style="color:${ts.text}">${t.tribeName}</span><span style="margin-left:auto;color:var(--bb-muted)">${pct}%</span></div>`;
        specific += `<div style="height:4px;background:rgba(240,240,240,0.08);border-radius:2px;margin:2px 0 6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${ts.bg};border-radius:2px;transition:width 0.4s"></div></div>`;
      });
      specific += '</div>';
    }

  }

  return dots + standings + specific;
}

export function _updateSidebar(screenKey) {
  const sideEl = document.getElementById('bb-sidebar-inner');
  if (!sideEl) return;
  const phase = sideEl.getAttribute('data-phase') || 'phase1';
  const st = _tvState[screenKey];
  const idx = st ? st.idx : -1;
  const epNum = window.vpEpNum;
  if (!epNum) return;
  const epRec = gs.episodeHistory[epNum - 1];
  if (!epRec) return;
  sideEl.innerHTML = _buildSidebarContent(epRec, phase, idx);
}

/* ───────────────────────── shell wrapper ───────────────────────── */

function _shell(content, ep, phase) {
  let bg;
  switch (phase) {
    case 'phase1': bg = _bgPhase1(); break;
    case 'phase2': bg = _bgPhase2(); break;
    case 'phase3': bg = _bgPhase3(); break;
    case 'results': bg = _bgResults(); break;
    case 'title': bg = _bgTitle(); break;
    default: bg = _bgTitle(); break;
  }

  const sidebarContent = _buildSidebarContent(ep, phase, -1);

  return `<style>${BB_CSS}</style>
  <div class="bb-shell" data-bb-phase="${phase}">
    ${bg}
    <div class="bb-main">${content}</div>
    <div class="bb-sidebar">
      <div class="bb-sidebar-inner" id="bb-sidebar-inner" data-phase="${phase}">${sidebarContent}</div>
    </div>
  </div>`;
}

/* ───────────────────────── card builder ───────────────────────── */

function _cardClass(type) {
  const map = {
    'climb':'bb-card-climb', 'advance':'bb-card-climb', 'rope':'bb-card-climb',
    'danger':'bb-card-danger', 'fall':'bb-card-danger', 'slip':'bb-card-danger', 'crash':'bb-card-danger',
    'ropeBurn':'bb-card-danger', 'ropeSnap':'bb-card-danger',
    'hero':'bb-card-hero', 'rescue':'bb-card-hero', 'save':'bb-card-hero', 'stuck':'bb-card-hero', 'showoff':'bb-card-hero',
    'finish':'bb-card-hero', 'reward':'bb-card-speed',
    'carriage-grab':'bb-card-hero',
    'placement-winner':'bb-card-placement bb-card-placement-winner',
    'placement-second':'bb-card-placement bb-card-placement-second',
    'placement-loser':'bb-card-placement bb-card-placement-loser',
    'social':'bb-card-social', 'bond':'bb-card-social', 'rivalry':'bb-card-danger', 'showmance':'bb-card-social',
    'encouragement':'bb-card-social', 'bonding':'bb-card-social', 'bickering':'bb-card-danger',
    'morale':'bb-card-social', 'taunt':'bb-card-danger', 'respect':'bb-card-social',
    'sewer':'bb-card-sewer', 'navigate':'bb-card-sewer', 'segment':'bb-card-sewer',
    'gator':'bb-card-gator', 'gator-attack':'bb-card-gator',
    'park':'bb-card-park', 'apple':'bb-card-park', 'apple-success':'bb-card-park', 'apple-fail':'bb-card-park', 'bob':'bb-card-park',
    'speed':'bb-card-speed', 'sprint':'bb-card-speed',
    'carriage':'bb-card-climb', 'pole':'bb-card-climb', 'slide':'bb-card-climb',
    'poleGood':'bb-card-climb', 'poleBad':'bb-card-danger', 'poleCrash':'bb-card-danger',
  };
  return map[type] || 'bb-card-climb';
}

function _badgeClass(badgeClass) {
  const map = {
    'climb':'bb-badge-climb', 'danger':'bb-badge-danger', 'hero':'bb-badge-hero',
    'social':'bb-badge-social', 'sewer':'bb-badge-sewer', 'gator':'bb-badge-gator',
    'park':'bb-badge-park', 'speed':'bb-badge-speed', 'apple':'bb-badge-apple',
    'carriage':'bb-badge-carriage',
    'badge-physical':'bb-badge-climb', 'badge-hero':'bb-badge-hero',
    'badge-danger':'bb-badge-danger', 'badge-social':'bb-badge-social',
  };
  return map[badgeClass] || 'bb-badge-climb';
}

function _iconForType(type) {
  const map = {
    'climb':'rope','advance':'rope','rope':'rope',
    'danger':'danger','fall':'danger','slip':'danger','crash':'danger',
    'ropeBurn':'danger','ropeSnap':'danger',
    'hero':'hero','rescue':'hero','save':'hero','stuck':'hero','showoff':'hero',
    'finish':'carriage','reward':'carriage',
    'carriage-grab':'carriage',
    'placement-winner':'carriage','placement-second':'carriage','placement-loser':'carriage',
    'social':'splash','bond':'splash','rivalry':'splash','showmance':'splash',
    'encouragement':'splash','bonding':'splash','bickering':'danger',
    'morale':'splash','taunt':'danger','respect':'splash',
    'sewer':'boat','navigate':'boat','segment':'boat',
    'gator':'gator','gator-attack':'gator',
    'park':'apple','apple':'apple','apple-success':'apple','apple-fail':'apple','bob':'apple',
    'speed':'speed','sprint':'speed',
    'carriage':'carriage','pole':'pole','slide':'pole',
    'poleGood':'pole','poleBad':'pole','poleCrash':'danger',
  };
  return map[type] || 'rope';
}

function _buildCard(ev, tribeMap) {
  const cc = _cardClass(ev.type);
  const ic = _icon(_iconForType(ev.type));
  const badge = ev.badge ? `<span class="bb-badge ${_badgeClass(ev.badgeClass || ev.type)}">${ev.badge}</span>` : '';

  let tribeTag = '';
  if (ev.tribe) {
    const t = tribeMap[ev.tribe];
    const ts = t ? _tribeStyle(t.color) : _tribeStyle('red');
    tribeTag = `<span class="bb-tribe-tag" style="background:${ts.light};color:${ts.text}">${ev.tribe}</span>`;
  }

  const text = ev.text || `${ev.player || 'A contestant'} ${ev.type === 'hero' ? 'makes a heroic play!' : ev.type === 'danger' ? 'faces danger!' : 'pushes forward.'}`;

  const target = ev.target || ev.rescuer;
  const isTeamCard = ev.type?.startsWith('placement-') || ev.type === 'carriage-grab';
  let header;
  if (isTeamCard && ev.members) {
    const avatars = ev.members.map(m => _avatar(m, 30)).join('');
    header = `<div class="bb-card-header bb-card-header-placement"><div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">${avatars}</div><span class="bb-player" style="margin-left:8px">${ev.tribe}</span><span style="margin-left:auto;display:flex;align-items:center;gap:6px">${badge}${ic}</span></div>`;
  } else if (ev.player && target) {
    header = `<div class="bb-card-header">${_avatar(ev.player, 28)}${_avatar(target, 28)}<span class="bb-player">${ev.player} & ${target}</span>${tribeTag}<span style="margin-left:auto;display:flex;align-items:center;gap:6px">${badge}${ic}</span></div>`;
  } else if (ev.player) {
    header = `<div class="bb-card-header">${_avatar(ev.player, 28)}<span class="bb-player">${ev.player}</span>${tribeTag}<span style="margin-left:auto;display:flex;align-items:center;gap:6px">${badge}${ic}</span></div>`;
  } else {
    header = `<div class="bb-card-header"><span style="display:flex;align-items:center;gap:6px">${ic}${badge}</span>${tribeTag}</div>`;
  }

  return `<div class="bb-card ${cc}">
    <div class="bb-card-accent"></div>
    ${header}
    <div class="bb-card-body"><div class="bb-txt">${text}</div></div>
  </div>`;
}

/* ───────────────────────── reveal handlers ───────────────────────── */

function _updateClimbMap(screenKey) {
  if (!screenKey.includes('phase1')) return;
  const stepMeta = window._bbPhase1StepMeta || [];
  const st = _tvState[screenKey];
  const idx = st ? st.idx : -1;
  const revealed = stepMeta.slice(0, idx + 1);
  const progress = {};
  revealed.forEach(ev => {
    if (ev.player) {
      if (!progress[ev.player]) progress[ev.player] = 0;
      if (ev.type === 'climb' || ev.type === 'hero' || ev.type === 'advance' || ev.type === 'showoff' || ev.type === 'carriage' || ev.type === 'pole' || ev.type === 'slide') progress[ev.player]++;
    }
  });
  Object.entries(progress).forEach(([name, segs]) => {
    const el = document.getElementById(`bb-climber-${name.replace(/\s+/g, '-')}`);
    if (el) {
      const maxSeg = 3;
      const bottomPx = 40 + (Math.min(segs, maxSeg) / maxSeg) * 180;
      el.style.bottom = bottomPx + 'px';
    }
  });
}

function _updateSewerMap(screenKey) {
  if (!screenKey.includes('phase2')) return;
  const stepMeta = window._bbPhase2StepMeta || [];
  const st = _tvState[screenKey];
  const idx = st ? st.idx : -1;
  const revealed = stepMeta.slice(0, idx + 1);
  const maxSeg = {};
  revealed.forEach(ev => {
    if (ev.tribe && ev.segment) {
      if (!maxSeg[ev.tribe] || ev.segment > maxSeg[ev.tribe]) maxSeg[ev.tribe] = ev.segment;
    }
  });
  const totalSegs = 6;
  Object.entries(maxSeg).forEach(([tribe, seg]) => {
    const el = document.getElementById(`bb-boat-${tribe.replace(/\s+/g, '-')}`);
    if (el) {
      const pct = 10 + (seg / totalSegs) * 75;
      el.style.left = pct + '%';
    }
  });
}

function _updateParkMap(screenKey) {
  if (!screenKey.includes('phase3')) return;
  const stepMeta = window._bbPhase3StepMeta || [];
  const st = _tvState[screenKey];
  const idx = st ? st.idx : -1;
  const revealed = stepMeta.slice(0, idx + 1);
  const maxSeg = {};
  const appleDone = {};
  revealed.forEach(ev => {
    if (ev.tribe && ev.segment && ev.subphase === 'race') {
      if (!maxSeg[ev.tribe] || ev.segment > maxSeg[ev.tribe]) maxSeg[ev.tribe] = ev.segment;
    }
    if (ev.type === 'apple-success' && ev.tribe) appleDone[ev.tribe] = true;
  });
  const totalSegs = 5;
  Object.entries(maxSeg).forEach(([tribe, seg]) => {
    const el = document.getElementById(`bb-carriage-${tribe.replace(/\s+/g, '-')}`);
    if (el) {
      const pct = 20 + (seg / totalSegs) * 68;
      el.style.left = pct + '%';
    }
  });
}

function _updateMap(screenKey) {
  try { _updateClimbMap(screenKey); } catch(e) {}
  try { _updateSewerMap(screenKey); } catch(e) {}
  try { _updateParkMap(screenKey); } catch(e) {}
}

export function broadwayBabyRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('bb-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch(e) {}
  const el = document.getElementById(`bb-step-${suffix}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try { _updateSidebar(screenKey); } catch(e) {}
  try { _updateMap(screenKey); } catch(e) {}
}

export function broadwayBabyRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('bb-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch(e) {}
  try { _updateSidebar(screenKey); } catch(e) {}
  try { _updateMap(screenKey); } catch(e) {}
}

/* ───────────────────────── controls builder ───────────────────────── */

function _controls(screenKey, total) {
  const suffix = screenKey.replace('bb-', '');
  return `<div class="bb-controls" id="bb-controls-${suffix}">
    <button class="bb-btn bb-btn-reveal" onclick="broadwayBabyRevealNext('${screenKey}', ${total})">REVEAL NEXT</button>
    <span class="bb-counter" id="bb-counter-${suffix}">0 / ${total}</span>
    <button class="bb-btn bb-btn-all" onclick="broadwayBabyRevealAll('${screenKey}', ${total})">SEE ALL</button>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════════
   TITLE CARD
   ═══════════════════════════════════════════════════════════════════ */

export function rpBuildBBTitleCard(ep) {
  const d = ep.broadwayBaby;
  const tribes = d.tribes || [];
  const epNum = window.vpEpNum || gs.episodeHistory?.length || 1;

  const HOST_QUIPS = [
    "Hope you're not afraid of heights... or alligators... or losing!",
    "Three phases of pain! I LOVE this show!",
    "The Chris Colossus is my finest work. After me, of course.",
    "Last one standing gets immunity. Last one crying gets a highlight reel.",
    "Climb it, survive it, race it. Simple! ...For me to watch.",
    "I had the statue built to scale. It's VERY flattering.",
  ];

  let sparkles = '';
  for (let i = 0; i < 10; i++) {
    const x = 20 + Math.random() * 60, y = 8 + Math.random() * 55;
    sparkles += `<div class="bb-title-sparkle" style="left:${x}%;top:${y}%;animation-delay:${(Math.random()*5).toFixed(1)}s;width:${3+Math.random()*3}px;height:${3+Math.random()*3}px"></div>`;
  }

  let playerGrids = '';
  tribes.forEach(t => {
    const ts = _tribeStyle(t.color);
    const avatars = (t.members || []).map(m =>
      `<div class="bb-player-av" style="border-color:${ts.bg}"><img src="assets/avatars/${(m||'').toLowerCase().replace(/\s+/g,'-')}.png" onerror="this.style.display='none'"></div>`
    ).join('');
    playerGrids += `<div style="margin-bottom:14px"><div class="bb-tribe-tag" style="background:${ts.light};color:${ts.text};border:1px solid ${ts.bg}">${t.tribeName}</div></div>
    <div class="bb-player-grid">${avatars}</div>`;
  });

  const content = `<div class="bb-title-wrap">
    ${sparkles}
    <div class="bb-title-statue">
      <div class="bb-title-statue-sun"></div>
      <div class="bb-title-statue-spotlight bb-title-statue-spotlight-l"></div>
      <div class="bb-title-statue-spotlight bb-title-statue-spotlight-r"></div>
      <div class="bb-title-statue-beams">
        <div class="bb-title-statue-beam"></div>
        <div class="bb-title-statue-beam"></div>
        <div class="bb-title-statue-beam"></div>
        <div class="bb-title-statue-beam"></div>
        <div class="bb-title-statue-beam"></div>
      </div>
      <div style="position:relative;z-index:2">
        <div style="position:relative;display:inline-block">
          <div class="bb-title-statue-halo"></div>
          <div class="bb-title-statue-head"><img src="assets/avatars/chris.png" onerror="this.style.display='none'"></div>
        </div>
        <div class="bb-title-statue-body">
          <div class="bb-title-statue-arm bb-title-statue-arm-l"></div>
          <div class="bb-title-statue-arm bb-title-statue-arm-r"></div>
        </div>
        <div class="bb-title-statue-pedestal"></div>
      </div>
    </div>
    <div class="bb-title-logo">BROADWAY BABY</div>
    <div class="bb-title-sub">Three tribes. Three phases. One giant statue.<br>Climb. Survive. Race.</div>
    <div class="bb-gold-divider"></div>
    <div class="bb-mech-row">
      <div class="bb-mech-item"><div class="bb-mech-icon"><div class="bb-ic-rope"></div></div><div class="bb-mech-label">CLIMB</div></div>
      <div class="bb-mech-item"><div class="bb-mech-icon"><div class="bb-ic-boat"></div></div><div class="bb-mech-label">NAVIGATE</div></div>
      <div class="bb-mech-item"><div class="bb-mech-icon"><div class="bb-ic-gator"></div></div><div class="bb-mech-label">SURVIVE</div></div>
      <div class="bb-mech-item"><div class="bb-mech-icon"><div class="bb-ic-apple"></div></div><div class="bb-mech-label">BOB</div></div>
      <div class="bb-mech-item"><div class="bb-mech-icon"><div class="bb-ic-carriage"></div></div><div class="bb-mech-label">RACE</div></div>
    </div>
    <div class="bb-title-phases">
      <div class="bb-title-phase">
        <div class="bb-title-phase-num">PHASE 1</div>
        <div class="bb-title-phase-name">${_icon('rope')} The Chris Colossus</div>
        <div class="bb-title-phase-desc">Scale the golden statue and retrieve your carriage from the top</div>
      </div>
      <div class="bb-title-phase">
        <div class="bb-title-phase-num">PHASE 2</div>
        <div class="bb-title-phase-name">${_icon('boat')} The Underground Gauntlet</div>
        <div class="bb-title-phase-desc">Navigate the sewers by boat — dodge rats, gators, and low pipes</div>
      </div>
      <div class="bb-title-phase">
        <div class="bb-title-phase-num">PHASE 3</div>
        <div class="bb-title-phase-name">${_icon('apple')} The Park Dash</div>
        <div class="bb-title-phase-desc">Bob for apples, load the carriage, and race to the finish line</div>
      </div>
    </div>
    <div class="bb-gold-divider"></div>
    <div class="bb-player-grid-label">COMPETITORS</div>
    ${playerGrids}
    <div class="bb-host-quote">"${pick(HOST_QUIPS)}"</div>
  </div>`;

  return _shell(content, ep, 'title');
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE 1 — CHRIS COLOSSUS CLIMB + POLE SLIDE
   ═══════════════════════════════════════════════════════════════════ */

export function rpBuildBBPhase1(ep) {
  const d = ep.broadwayBaby;
  const tribeMap = _tribeLookup(ep);
  const allEvents = d.phase1?.events || [];
  const screenKey = 'bb-phase1';
  const suffix = 'phase1';
  const total = allEvents.length;

  _ensureState(screenKey, total);

  // Build stepMeta for sidebar
  const stepMeta = allEvents.map(ev => ({
    type: ev.type || 'climb',
    player: ev.player || null,
    tribe: ev.tribe || null,
    badge: ev.badge || ev.type || '',
  }));
  // We store it directly since script tags won't execute in innerHTML
  window._bbPhase1StepMeta = stepMeta;

  // Chatter
  const chatters = _pickChatter(_chatterPhase1, 8);
  let chatterIdx = 0;

  // Map
  const map = _buildClimbMap(ep);

  // Phase header
  let html = map;
  html += `<div class="bb-phase-hdr">${_icon('rope')} PHASE 1 OF 3 — THE CHRIS COLOSSUS</div>`;
  html += `<div class="bb-phase-sub">Climb the statue. Retrieve the carriage. Slide down the pole.</div>`;

  // Event cards with interleaved chatter
  allEvents.forEach((ev, i) => {
    // Insert chatter every 3-4 cards
    if (i > 0 && i % 3 === 0 && chatterIdx < chatters.length) {
      html += `<div id="bb-step-${suffix}-${i}" class="bb-step-hidden">`;
      html += _renderChatter(chatters[chatterIdx++]);
      html += _buildCard(ev, tribeMap);
      html += `</div>`;
    } else {
      html += `<div id="bb-step-${suffix}-${i}" class="bb-step-hidden">`;
      html += _buildCard(ev, tribeMap);
      html += `</div>`;
    }
  });

  html += _controls(screenKey, total);

  return _shell(html, ep, 'phase1');
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE 2 — UNDERGROUND GAUNTLET (SEWER RACE)
   ═══════════════════════════════════════════════════════════════════ */

export function rpBuildBBPhase2(ep) {
  const d = ep.broadwayBaby;
  const tribeMap = _tribeLookup(ep);
  const events = d.phase2?.events || [];
  const segments = d.phase2?.segments || [];

  // Flatten segment events + placement events (gator events already inside segments)
  const allItems = [];
  segments.forEach(seg => {
    (seg.events || []).forEach(ev => allItems.push({ ...ev, src: 'event' }));
  });
  events.forEach(ev => allItems.push({ ...ev, src: 'event' }));

  const screenKey = 'bb-phase2';
  const suffix = 'phase2';
  const total = allItems.length;

  _ensureState(screenKey, total);

  // stepMeta
  const stepMeta = allItems.map(ev => ({
    type: ev.type || 'sewer',
    player: ev.player || null,
    tribe: ev.tribe || null,
    segment: ev.segment || ev.segNum || null,
    badge: ev.badge || ev.type || '',
  }));
  window._bbPhase2StepMeta = stepMeta;

  // Chatter
  const chatters = _pickChatter(_chatterPhase2, 8);
  let chatterIdx = 0;

  // Map
  const map = _buildSewerMap(ep);

  let html = map;
  html += `<div class="bb-phase-hdr">${_icon('boat')} PHASE 2 OF 3 — THE UNDERGROUND GAUNTLET</div>`;
  html += `<div class="bb-phase-sub">Boat race through the sewers to Turtle Pond. Watch out for the gator.</div>`;

  // Track current tribe for POV headers
  let lastTribe = null;
  allItems.forEach((ev, i) => {
    let tribePov = '';
    if (ev.tribe && ev.tribe !== lastTribe) {
      lastTribe = ev.tribe;
      const t = tribeMap[ev.tribe];
      const ts = t ? _tribeStyle(t.color) : _tribeStyle('red');
      tribePov = `<div class="bb-tribe-pov" style="background:${ts.light};color:${ts.text};border-left:3px solid ${ts.bg}">${ev.tribe.toUpperCase()}</div>`;
    }

    let chatter = '';
    if (i > 0 && i % 3 === 0 && chatterIdx < chatters.length) {
      chatter = _renderChatter(chatters[chatterIdx++]);
    }

    html += `<div id="bb-step-${suffix}-${i}" class="bb-step-hidden">`;
    html += tribePov;
    html += chatter;
    html += _buildCard(ev, tribeMap);
    html += `</div>`;
  });

  html += _controls(screenKey, total);

  return _shell(html, ep, 'phase2');
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE 3 — PARK DASH (APPLE BOB + CARRIAGE RACE)
   ═══════════════════════════════════════════════════════════════════ */

export function rpBuildBBPhase3(ep) {
  const d = ep.broadwayBaby;
  const tribeMap = _tribeLookup(ep);
  const events = d.phase3?.events || [];
  const bobbing = d.phase3?.bobbing || [];
  const carriageRace = d.phase3?.carriageRace || [];

  // Combined timeline: bobbing events + flattened carriage race segment events + general events
  const allItems = [];
  bobbing.forEach(ev => allItems.push({ ...ev, subphase: 'bob' }));
  carriageRace.forEach(seg => {
    (seg.events || []).forEach(ev => allItems.push({ ...ev, subphase: 'race' }));
  });
  events.forEach(ev => allItems.push({ ...ev, subphase: ev.type === 'apple' || ev.type === 'bob' ? 'bob' : 'race' }));

  // Sort: bob events first, then race events
  allItems.sort((a, b) => {
    if (a.subphase === 'bob' && b.subphase === 'race') return -1;
    if (a.subphase === 'race' && b.subphase === 'bob') return 1;
    return 0;
  });

  const screenKey = 'bb-phase3';
  const suffix = 'phase3';
  const total = allItems.length;

  _ensureState(screenKey, total);

  // stepMeta
  const stepMeta = allItems.map(ev => ({
    type: ev.type || 'park',
    player: ev.player || null,
    tribe: ev.tribe || null,
    segment: ev.segment || null,
    badge: ev.badge || ev.type || '',
    subphase: ev.subphase || 'race',
  }));
  window._bbPhase3StepMeta = stepMeta;

  // Chatter
  const chatters = _pickChatter(_chatterPhase3, 8);
  let chatterIdx = 0;

  // Map
  const map = _buildParkMap(ep);

  let html = map;
  html += `<div class="bb-phase-hdr">${_icon('apple')} PHASE 3 OF 3 — THE PARK DASH</div>`;
  html += `<div class="bb-phase-sub">Bob for an apple at Turtle Pond (no hands!). Load a teammate as baby. Race the carriage to Central Park.</div>`;

  // Sub-phase headers
  let addedBobHeader = false;
  let addedRaceHeader = false;

  allItems.forEach((ev, i) => {
    let subHeader = '';
    if (ev.subphase === 'bob' && !addedBobHeader) {
      addedBobHeader = true;
      subHeader = `<div class="bb-subphase">${_icon('apple')} APPLE BOBBING</div>`;
    }
    if (ev.subphase === 'race' && !addedRaceHeader) {
      addedRaceHeader = true;
      subHeader = `<div class="bb-subphase">${_icon('carriage')} BABY CARRIAGE RACE</div>`;
    }

    let chatter = '';
    if (i > 0 && i % 3 === 0 && chatterIdx < chatters.length) {
      chatter = _renderChatter(chatters[chatterIdx++]);
    }

    html += `<div id="bb-step-${suffix}-${i}" class="bb-step-hidden">`;
    html += subHeader;
    html += chatter;
    html += _buildCard(ev, tribeMap);
    html += `</div>`;
  });

  html += _controls(screenKey, total);

  return _shell(html, ep, 'phase3');
}

/* ═══════════════════════════════════════════════════════════════════
   RESULTS
   ═══════════════════════════════════════════════════════════════════ */

export function rpBuildBBResults(ep) {
  const d = ep.broadwayBaby;
  const tribes = d.tribes || [];
  const placements = d.placements || [];
  const tribeResults = d.tribeResults || [];
  const winner = d.winner;
  const loser = d.loser;

  let podium = '<div class="bb-podium">';
  placements.forEach((tName, i) => {
    const t = tribes.find(tr => tr.tribeName === tName);
    const ts = t ? _tribeStyle(t.color) : _tribeStyle('red');
    const res = tribeResults.find(r => r.tribeName === tName);
    const timeStr = res ? `${res.time}s` : '---';
    const rankEmoji = i === 0 ? '1ST' : i === 1 ? '2ND' : `${i + 1}${i === 2 ? 'RD' : 'TH'}`;
    const isWinner = tName === winner;
    const isLoser = tName === loser;
    const slotCls = isWinner ? 'bb-podium-slot bb-winner' : isLoser ? 'bb-podium-slot bb-loser' : 'bb-podium-slot';
    const rankColor = i === 0 ? 'var(--bb-gold)' : i === placements.length - 1 ? 'var(--bb-danger)' : 'var(--bb-metal)';

    let members = '';
    if (t) {
      members = (t.members || []).map(m => `<div style="display:inline-block;margin:4px">${_avatar(m, 32)}</div>`).join('');
    }

    podium += `<div class="${slotCls}">
      <div class="bb-podium-rank" style="color:${rankColor}">${rankEmoji}</div>
      <div class="bb-podium-tribe" style="color:${ts.text}">${tName}</div>
      <div class="bb-podium-time">${timeStr}</div>
      <div style="margin-top:10px">${members}</div>
      ${isWinner ? `<div style="margin-top:8px;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;color:var(--bb-gold)">IMMUNITY</div>` : ''}
      ${isLoser ? `<div style="margin-top:8px;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;color:var(--bb-danger)">TRIBAL COUNCIL</div>` : ''}
    </div>`;
  });
  podium += '</div>';

  // MVP highlights — find hero events across all phases
  const heroEvents = [];
  const allPhases = [d.phase1?.events, d.phase2?.events, d.phase3?.events, d.phase3?.bobbing, d.phase3?.carriageRace, d.phase1?.poleSlide, d.phase2?.gatorEvents];
  allPhases.forEach(evArr => {
    (evArr || []).forEach(ev => {
      if (ev.type === 'hero' || ev.type === 'rescue' || ev.type === 'save' || ev.type === 'speed') {
        heroEvents.push(ev);
      }
    });
  });

  let mvpHtml = '';
  if (heroEvents.length > 0) {
    mvpHtml = '<div style="margin-top:30px"><div style="font-family:\'Bebas Neue\',sans-serif;font-size:20px;letter-spacing:2px;color:var(--bb-gold);margin-bottom:12px">MVP MOMENTS</div>';
    const tribeMap = _tribeLookup(ep);
    heroEvents.slice(0, 5).forEach(ev => {
      const t = tribeMap[ev.tribe];
      const ts = t ? _tribeStyle(t.color) : _tribeStyle('red');
      mvpHtml += `<div style="background:var(--bb-card-bg);border-radius:6px;padding:10px 14px;margin:6px 0;border-left:3px solid var(--bb-gold);text-align:left">
        ${_icon('hero')} <span class="bb-player">${_avatar(ev.player, 20)} ${ev.player || '???'}</span>
        <span class="bb-tribe-tag" style="background:${ts.light};color:${ts.text}">${ev.tribe || ''}</span>
        <div class="bb-txt" style="margin-top:4px">${ev.text || 'Made a heroic play!'}</div>
      </div>`;
    });
    mvpHtml += '</div>';
  }

  // Winner announcement
  const winnerTribe = tribes.find(t => t.tribeName === winner);
  const winnerTS = winnerTribe ? _tribeStyle(winnerTribe.color) : _tribeStyle('red');
  const winnerAnnounce = winner ? `<div style="margin-top:30px;padding:20px;background:rgba(240,165,0,0.08);border:1px solid rgba(240,165,0,0.2);border-radius:8px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:3px;color:var(--bb-gold)">${_icon('hero')} ${winner} WINS IMMUNITY!</div>
    <div style="margin-top:8px;color:var(--bb-muted)">Safe from tonight's tribal council</div>
  </div>` : '';

  const content = `<div class="bb-results-wrap">
    <div class="bb-results-title">${_icon('carriage')} FINAL RESULTS</div>
    ${podium}
    ${winnerAnnounce}
    ${mvpHtml}
  </div>`;

  return _shell(content, ep, 'results');
}
