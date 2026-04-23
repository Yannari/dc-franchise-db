// js/chal/masters-of-disasters.js — Masters of Disasters disaster challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ─── Text pools ───────────────────────────────────────────────────────────────

const DISASTER_HOST = {
  earthquakeIntro: [
    h => `"Welcome to Masters of Disasters! Today's first phase: an earthquake marathon! The ground WILL move — the question is whether YOU will!" ${h} grins maniacally.`,
    h => `${h} strides to the starting line as the whole set vibrates. "Phase One! Earthquake! Run, stumble, crawl — just don't stop!"`,
    h => `"Interns spent THREE WEEKS rigging this thing!" ${h} beams. "Phase One — Earthquake of Inevitable Pain. Your goal: reach the finish line. Good luck not dying!"`,
  ],
  roundStart: [
    (h, r, haz) => `Round ${r} — ${haz.name}! ${haz.desc}`,
    (h, r, haz) => `${h} cranks a lever. "Round ${r}! ${haz.name}!" ${haz.desc}`,
    (h, r, haz) => `"Round ${r}, people!" ${h} announces over the chaos. ${haz.name}: ${haz.desc}`,
  ],
  playerAdvances: [
    (h, p) => `${p} pushes through and gains ground!`,
    (h, p) => `${p} finds a rhythm and surges forward!`,
    (h, p) => `"Nice moves, ${p}!" ${h} calls out as ${p} advances.`,
  ],
  playerStuck: [
    (h, p) => `${p} struggles but can't gain ground this round.`,
    (h, p) => `${p} slips and loses momentum, stuck in place.`,
    (h, p) => `${h} winces. "That's rough, ${p} — not your best round."`,
  ],
  playerStopped: [
    (h, p) => `${p} collapses to the ground — they're done for this phase!`,
    (h, p) => `${p} can't go on. The exhaustion is too much. They're out of Phase 1.`,
    (h, p) => `"${p} is DOWN!" ${h} shouts. "Medical, check on ${p}!"`,
  ],
  earthquakeEnd: [
    (h, winner) => `The shaking stops. ${winner} conquers Phase 1 and earns the escape code advantage heading into Phase 2!`,
    (h, winner) => `${h} blows his air horn. "Phase One — DONE! ${winner}, you survive the earthquake! That escape code is yours!"`,
    (h, winner) => `"Earthquake of Inevitable Pain — COMPLETE!" ${h} declares. "${winner} runs Phase 2 with a head start!"`,
  ],
};

const DISASTER_HAZARDS = [
  { id: 'tremors',  name: 'Minor Tremors',   desc: 'The ground shakes beneath their feet — small but relentless jolts that throw off every step.' },
  { id: 'lava',     name: 'Lava Eruption',   desc: 'Hot soup spews from above through industrial nozzles — scalding, sticky, and absolutely everywhere.' },
  { id: 'hailstorm',name: 'Hailstorm',       desc: 'Golf balls rain from ceiling-mounted cannons — rattling helmets and bruising shoulders.' },
  { id: 'debris',   name: 'Falling Debris',  desc: 'The ceiling is coming down — foam boulders and rigged planks crash in unpredictable waves.' },
  { id: 'collapse', name: 'Total Collapse',  desc: 'Everything at once — tremors, debris, lava-soup, wind machines. Pure catastrophic mayhem.' },
];

const DISASTER_EVENTS = {
  dodgeLava: [
    (p, pr) => `${p} spots the nozzle arc and ducks perfectly — not a drop lands on ${pr.obj}!`,
    (p, pr) => `"Eat hot soup!" — ${p} rolls sideways and the lava stream misses entirely.`,
    (p, pr) => `${p} reads the spray pattern and weaves through. ${pr.Sub} emerges spotless and pumped.`,
  ],
  lavaBurn: [
    (p, pr) => `A burst of lava-soup catches ${p} square in the back. ${pr.Sub} yelps and slows down.`,
    (p, pr) => `${p} takes a hot soup cannonball to the shoulder. ${pr.Sub} grimaces but keeps moving.`,
    (p, pr) => `The lava stream catches ${p} by surprise — sticky, scalding, and demoralizing.`,
  ],
  rockTrip: [
    (p, pr) => `${p} catches a foot on a loose chunk of rubble and goes sprawling. ${pr.Sub} scrambles back up, winded.`,
    (p, pr) => `A debris shard clips ${p}'s ankle — ${pr.sub} stumbles and loses precious ground.`,
    (p, pr) => `The ground shifts under ${p} at exactly the wrong moment. ${pr.Sub} trips hard.`,
  ],
  debrisDodge: [
    (p, pr) => `${p} sees the chunk falling and sidesteps cleanly — the crowd roars!`,
    (p, pr) => `${p}'s instincts kick in. ${pr.Sub} pivots, the boulder misses, ${pr.sub} keeps moving.`,
    (p, pr) => `"Nice!" — ${p} reads the debris arc and ducks under it with a grin.`,
  ],
  golfBallHit: [
    (p, pr) => `A golf ball rattles off ${p}'s helmet. ${pr.Sub} staggers, seeing stars.`,
    (p, pr) => `The hailstorm catches ${p} in the open — three direct hits slow ${pr.obj} down.`,
    (p, pr) => `${p} takes a golf ball to the knee. ${pr.Sub} winces and limps onward.`,
  ],
  shieldTeammate: [
    (p, tm, pp, tp) => `${p} throws ${pp.posAdj} body in front of ${tm}, absorbing a debris hit meant for ${tp.obj}.`,
    (p, tm, pp, tp) => `"I've got you!" — ${p} shoves ${tm} out of the lava stream's path, catching the spray ${pp.ref}.`,
    (p, tm, pp, tp) => `${p} spots ${tm} frozen in the hailstorm and pulls ${tp.obj} forward, taking the worst of it.`,
  ],
  adrenalineSurge: [
    (p, pr) => `Something clicks for ${p} — ${pr.sub} finds a second gear and the fatigue melts away.`,
    (p, pr) => `${p} hits a wall and breaks through it. Pure adrenaline carries ${pr.obj} forward.`,
    (p, pr) => `${pr.Sub} was dragging — then ${p} surges, eyes wide, moving like ${pr.sub}'s just getting started.`,
  ],
  stumbleRecover: [
    (p, pr) => `${p} trips, catches ${pr.ref} on a railing, and keeps moving — barely.`,
    (p, pr) => `${p} wobbles, arms flailing, but somehow stays upright.`,
    (p, pr) => `A stumble from ${p} — but ${pr.sub} recovers before losing any ground.`,
  ],
  surfShockwave: [
    (p, pr) => `${p} bends the knees just right and RIDES the shockwave — gaining ground like a surfer!`,
    (p, pr) => `The tremor rolls under ${p} and ${pr.sub} surfs it forward with a whoop.`,
    (p, pr) => `"Did you SEE that?!" — ${p} catches the shockwave perfectly and glides ahead.`,
  ],
  chefTargets: [
    (p, pr) => `Chef Hatchet spots ${p} and grins. ${pr.Sub} gets an extra-special soup-lava blast fired directly at ${pr.obj}.`,
    (p, pr) => `"You think this is a GAME?!" Chef hurls a manifesto at ${p} along with a soup-lava barrage.`,
    (p, pr) => `Chef singles out ${p} for a personal grudge attack — double soup, maximum velocity.`,
  ],
  draftBehind: [
    (p, tm, pp, tp) => `${p} tucks in behind ${tm} and lets ${tp.obj} break the wind — ${pp.sub} gains ground with minimal effort.`,
    (p, tm, pp, tp) => `Smart move from ${p}: follow ${tm}'s lead and draft through the chaos.`,
    (p, tm, pp, tp) => `${p} reads the course and slides in behind ${tm}, conserving energy perfectly.`,
  ],
  panicFreeze: [
    (p, pr) => `${p} locks up — eyes wide, feet planted — the disaster zone is just too much right now.`,
    (p, pr) => `${p} freezes mid-stride as another shockwave hits. ${pr.Sub} can't make ${pr.ref} move.`,
    (p, pr) => `The chaos overwhelms ${p}. ${pr.Sub} stands there, stuck, while the round ticks by.`,
  ],
  heroicSprint: [
    (p, pr) => `${p} digs deep and SPRINTS — burning everything in the tank to push ahead!`,
    (p, pr) => `"I am NOT stopping here!" — ${p} explodes forward, face red, arms pumping.`,
    (p, pr) => `${p} finds something extra and launches into a heroic sprint through the carnage.`,
  ],
  carryInjured: [
    (p, tm, pp, tp) => `${p} hauls ${tm} over ${pp.posAdj} shoulder and carries ${tp.obj} forward. Both advance — barely.`,
    (p, tm, pp, tp) => `"Leave no one behind!" — ${p} grabs ${tm} and drags ${tp.obj} through the round.`,
    (p, tm, pp, tp) => `${p} refuses to abandon ${tm}. ${pp.Sub} lifts ${tp.obj} bodily and pushes on.`,
  ],
  findShortcut: [
    (p, pr) => `${p} spots a gap in the debris field no one else noticed — and slips through for a massive shortcut!`,
    (p, pr) => `Sharp eyes from ${p}: ${pr.sub} reads the course and finds a route that cuts two stages worth of distance.`,
    (p, pr) => `${p} ducks under a collapsed beam and emerges ahead of everyone. Pure instinct.`,
  ],
  ceilingCollapse: [
    (p, pr) => `A massive ceiling section gives way — the shockwave ripples through the whole course, throwing everyone off balance.`,
    (p, pr) => `"EVERYONE DOWN!" — the ceiling collapses and the entire tribe staggers.`,
    (p, pr) => `The biggest collapse yet rocks the field. Nobody makes progress for a moment.`,
  ],
};

// ─── Submarine text pools ─────────────────────────────────────────────────────

const SUBMARINE_HOST = {
  intro: [
    h => `${h} grins from the dry observation deck above. "Phase Two: Sinking Submarine! Water's coming in, the clock is ticking, and the exit code won't solve itself. GOOD LUCK!"`,
    h => `"Welcome to the belly of the beast!" ${h} announces as a klaxon blares. "The submarine is going DOWN. Your only way out? Crack the code and crank that hatch — before you're breathing water!"`,
    h => `${h} slaps a big red button. Somewhere below, pipes groan and water begins flooding the chamber. "Phase Two — Sinking Submarine! First tribe to escape wins immunity. Last tribe gets tribal!"`,
  ],
  stageStart: [
    (h, stage) => `${h} checks the gauge. "${stage.name}. Water's at ${stage.waterPct}%. You've got time — not a lot of time, but time."`,
    (h, stage) => `The rising water has reached ${stage.name.toLowerCase()} level. ${stage.desc}`,
    (h, stage) => `"${stage.name}!" ${h} calls through the intercom. "${stage.desc} Figure it out!"`,
  ],
  playerSubmerged: [
    (h, p) => `${p} goes under — completely submerged! ${p} is out of the escape push!`,
    (h, p) => `"${p} is DOWN!" ${h} announces. "${p} can't contribute to the code while underwater!"`,
    (h, p) => `The water swallows ${p}. ${p}'s out of the escape attempt for now.`,
  ],
  escape: [
    (h, tribe) => `The hatch BLOWS open! ${tribe} has cracked the escape code! They're OUT!`,
    (h, tribe) => `"${tribe} — YOU'RE FREE!" ${h} roars as the tribe scrambles through the hatch. "THAT is how you survive a sinking submarine!"`,
    (h, tribe) => `Escape code accepted! The hatch swings wide and ${tribe} pours through. They made it!`,
  ],
  flooding: [
    (h, pct) => `Water now at ${pct}%. The pressure is rising — literally.`,
    (h, pct) => `${h} watches the gauge tick past ${pct}%. "It's getting cozy in there, folks!"`,
    (h, pct) => `"${pct}% flooded!" ${h} announces cheerfully. "Loving the urgency!"`,
  ],
};

const SUBMARINE_STAGES = [
  { id: 'ankles', name: 'Ankles', waterPct: 25, desc: 'Water begins seeping in through the floor grates — cold, rising, and relentless.' },
  { id: 'waist', name: 'Waist', waterPct: 50, desc: 'The water is climbing fast. Every movement takes twice the effort.' },
  { id: 'chest', name: 'Chest', waterPct: 75, desc: 'Chest-deep and rising. The pressure is making it hard to think.' },
  { id: 'overhead', name: 'Overhead', waterPct: 100, desc: 'Completely underwater. The only way out is through.' },
];

const SUBMARINE_EVENTS = {
  sharkInHatch: [
    (p, pr) => `${p} reaches for the hatch — and pulls back fast. Something with fins is circling the exit tunnel. ${pr.Sub} hesitates, burning precious escape time.`,
    (p, pr) => `"IS THAT A SHARK?!" ${p} backs away from the hatch, eyes wide. The tribe loses ground while ${pr.sub} works up the nerve.`,
    (p, pr) => `A mechanical fin surfaces near the hatch. ${p} doesn't know it's fake — and neither does the tribe's escape progress.`,
  ],
  fireAbove: [
    (p, pr) => `Smoke billows through the upper hatch vent. The top exit's blocked — the tribe has to reroute while the water keeps rising.`,
    (p, pr) => `"Fire above deck!" ${p} spots the smoke first and the tribe pivots — losing precious escape time rerouting.`,
    (p, pr) => `The smell of smoke kills the primary exit route. ${p} scans the walls for an alternative while the water climbs.`,
  ],
  droppedCode: [
    (p, pr) => `${p} fumbles the laminated escape code — it disappears into the rising water. The Phase 1 head start is compromised.`,
    (p, pr) => `"I had it! I had it!" — ${p} watches the code sink below the surface. The tribe's escape advantage is cut in half.`,
    (p, pr) => `${p} loses their grip on the code sheet. It floats face-down for a tense moment before ${pr.sub} fishes it back out, but the shortcut's gone.`,
  ],
  strawSnorkel: [
    (p, pr) => `${p} jury-rigs a breathing straw from a broken pipe and slips under — ${pr.sub}'s submerged but still working the lock panel! The tribe gains ground.`,
    (p, pr) => `"I can still help!" — ${p} improvises a snorkel and stays in the escape effort despite being fully underwater.`,
    (p, pr) => `${p}'s engineering instinct kicks in. A bent tube, some waterproof sealant from the wall, and ${pr.sub}'s breathing underwater — and contributing.`,
  ],
  panicDrowning: [
    (p, pr) => `${p} panics — flailing, grabbing at a tribemate, dragging them under too. Two players out of the escape push.`,
    (p, pr) => `"Don't touch me — wait — HELP!" ${p}'s panic is contagious. A nearby tribemate goes down with ${pr.obj}.`,
    (p, pr) => `${p} thrashes in the rising water and latches onto the closest person. Two go under at once.`,
  ],
  airPocket: [
    (p, pr) => `${p} finds a sealed air pocket near the ceiling — enough for a gasping survivor to surface. One submerged player is back in the fight!`,
    (p, pr) => `"HERE! UP HERE!" — ${p} spots an air pocket and hauls a struggling tribemate into it. They're back.`,
    (p, pr) => `A hollow section of hull traps air near the top. ${p} discovers it just in time to pull a submerged player back into the escape effort.`,
  ],
  lockBreakthrough: [
    (p, pr) => `${p} cracks the code sequence — the lock clicks and the whole tribe surges forward on escape progress!`,
    (p, pr) => `"GOT IT!" — ${p} punches in the last digit and the panel goes green. Major breakthrough on the escape.`,
    (p, pr) => `${p}'s mental sharpness cuts through the pressure. ${pr.Sub} solves the panel sequence and buys the tribe a massive escape boost.`,
  ],
  teamworkPush: [
    (p, pr) => `Multiple survivors work in sync — hands on the wheel, voices calling the count. The escape panel moves. They're gaining ground.`,
    (p, pr) => `The remaining tribe members find a rhythm together and push hard — combined effort on the lock shows real progress.`,
    (p, pr) => `Nobody panics. They coordinate. The escape progress ticks up faster than anyone expected.`,
  ],
  leakPlug: [
    (p, pr) => `${p} spots a burst pipe and plugs it with ${pr.posAdj} arm — slowing the flood just enough to buy the tribe one more stage without a submerge check.`,
    (p, pr) => `"I'll hold it!" — ${p} throws ${pr.posAdj} body against a gushing pipe, buying the tribe critical seconds.`,
    (p, pr) => `${p} finds the leak source and muscles it shut. The water slows. One submerge check skipped.`,
  ],
  breathHold: [
    (p, pr) => `${p} takes one massive breath and plunges under — ${pr.sub}'s submerged but ${pr.sub} can handle one more stage before surfacing.`,
    (p, pr) => `Iron lungs on ${p}. ${pr.Sub} goes fully under and keeps holding on — surviving one more stage submerged.`,
    (p, pr) => `${p} clears ${pr.posAdj} lungs and goes down. ${pr.Sub}'s been here before. ${pr.Sub} can hold on one more stage.`,
  ],
  floodingPanic: [
    (p, pr) => `The water surges faster than expected — everyone in the tribe stumbles. Escape progress stalls.`,
    (p, pr) => `A sudden flood rush hits the whole submarine interior. The tribe scrambles just to stay upright. No progress this stage.`,
    (p, pr) => `"MORE WATER?!" The tribe's escape effort grinds to a halt as a flood wave crashes through the chamber.`,
  ],
  heroicDive: [
    (p, pr) => `${p} is submerged — but ${pr.sub} pushes off the floor and swims to the escape panel, buying the tribe one last push from underwater.`,
    (p, pr) => `"I can still DO this!" — ${p} dives hard and reaches the lock panel from below. Heroic, desperate, and it WORKS.`,
    (p, pr) => `${p} isn't done yet. Submerged or not, ${pr.sub} kicks to the panel and drives the escape progress forward.`,
  ],
};

// ─── Drama Break ──────────────────────────────────────────────────────────────

const DISASTER_DRAMA_EVENTS = {
  injuryAftermath: {
    check: (a, b, ep) => !!(gs.lingeringInjuries?.[a] || gs.lingeringInjuries?.[b]),
    apply: (a, b, ep, rp) => {
      const injured = gs.lingeringInjuries?.[a] ? a : b;
      const other = injured === a ? b : a;
      const prI = pronouns(injured);
      const pool = [
        `${injured} nurses ${prI.posAdj} injuries from the earthquake phase — ${prI.sub}'s not going into Phase 2 at full strength.`,
        `"I felt something pop during that last round," ${injured} admits quietly. ${other} checks on ${prI.obj}, concern flickering across their face.`,
        `${injured} sits on the sideline between phases, flexing ${prI.posAdj} hands. The earthquake took a toll.`,
      ];
      const text = pool[Math.floor(Math.random() * pool.length)];
      addBond(injured, other, 0.3);
      rp.push({ type: 'drama', eventType: 'injuryAftermath', players: [injured, other], text,
        badgeText: 'INJURY AFTERMATH', badgeClass: 'red', tag: 'challenge' });
    },
  },
  chefBlame: {
    check: (a, b, ep) => true,
    apply: (a, b, ep, rp) => {
      const host = seasonConfig.host || 'Chris';
      const pool = [
        `Chef Hatchet blames the equipment failure on ${a}, who was nowhere near it. ${a} glares back. Something's brewing.`,
        `"YOU broke my earthquake rig!" Chef jabs a finger at ${b}. ${b} opens ${pronouns(b).posAdj} mouth, then thinks better of it.`,
        `Chef spends the break dramatically taping up equipment and muttering grievances about ${a} within earshot. ${host} films it on his phone.`,
      ];
      const text = pool[Math.floor(Math.random() * pool.length)];
      if (!gs._disasterHeat) gs._disasterHeat = {};
      gs._disasterHeat[b] = { target: a, amount: 0.5, expiresEp: (gs.episode || 0) + 3 };
      rp.push({ type: 'drama', eventType: 'chefBlame', players: [a, b], text,
        badgeText: 'CHEF DRAMA', badgeClass: 'orange', tag: 'challenge' });
    },
  },
  allianceInCrisis: {
    check: (a, b, ep) => getBond(a, b) < -1,
    apply: (a, b, ep, rp) => {
      const pool = [
        `${a} pulls ${b} aside during the break. Voices are low but the tension is impossible to miss. Their alliance is cracking.`,
        `${b} catches ${a} whispering to someone from the other tribe. The alliance may not survive Phase 2.`,
        `"We need to talk — after Phase 2." ${a} doesn't wait for an answer and walks away from ${b}. The alliance is on ice.`,
      ];
      const text = pool[Math.floor(Math.random() * pool.length)];
      addBond(a, b, -0.5);
      rp.push({ type: 'drama', eventType: 'allianceInCrisis', players: [a, b], text,
        badgeText: 'ALLIANCE IN CRISIS', badgeClass: 'red', tag: 'challenge' });
    },
  },
  secretReveal: {
    check: (a, b, ep) => getBond(a, b) > 1,
    apply: (a, b, ep, rp) => {
      const prA = pronouns(a);
      const pool = [
        `In the quiet between phases, ${a} tells ${b} something ${prA.sub}'s never told anyone out here. ${b} listens carefully. Something shifts between them.`,
        `${a} lets something slip that ${prA.sub} didn't mean to — and ${b} catches it. Neither says anything. But they both heard it.`,
        `"Don't tell anyone," ${a} says. ${b} nods. It's the kind of secret that either builds trust — or gets weaponized.`,
      ];
      const text = pool[Math.floor(Math.random() * pool.length)];
      addBond(a, b, 0.6);
      rp.push({ type: 'drama', eventType: 'secretReveal', players: [a, b], text,
        badgeText: 'SECRET REVEAL', badgeClass: 'purple', tag: 'challenge' });
    },
  },
  quitConsideration: {
    check: (a, b, ep) => {
      const st = pStats(a);
      return st.mental < 4 || st.temperament < 3;
    },
    apply: (a, b, ep, rp) => {
      const prA = pronouns(a);
      const pool = [
        `${a} stares at the submarine entrance and goes quiet. "I don't know if I can do that," ${prA.sub} admits. ${b} grabs ${prA.posAdj} arm. "Yes you can."`,
        `${a} sits apart from the group, head down. Going back into that flooding chamber… ${prA.sub}'s not sure ${prA.sub} has it in ${prA.obj}.`,
        `"What if I just… don't go in?" ${a} says it as a joke. ${b} doesn't laugh. Neither do they.`,
      ];
      const text = pool[Math.floor(Math.random() * pool.length)];
      addBond(a, b, 0.4);
      rp.push({ type: 'drama', eventType: 'quitConsideration', players: [a, b], text,
        badgeText: 'QUIT CONSIDERATION', badgeClass: 'gray', tag: 'challenge' });
    },
  },
  heroicRecognition: {
    check: (a, b, ep) => {
      const scores = ep.chalMemberScores || {};
      return (scores[a] || 0) >= 8;
    },
    apply: (a, b, ep, rp) => {
      const prA = pronouns(a);
      const pool = [
        `${b} pats ${a} on the back after the earthquake phase. "You kept us in it." ${a} shrugs — but ${prA.sub}'s clearly touched.`,
        `"MVP of Phase 1? That's ${a}." ${b} announces it to the whole tribe. ${a} protests, but nobody's listening.`,
        `The tribe circles around ${a} after the earthquake. ${prA.Sub} took the hits so others wouldn't have to. They remember that.`,
      ];
      const text = pool[Math.floor(Math.random() * pool.length)];
      addBond(a, b, 0.5);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[a] = (gs.popularity[a] || 0) + 1;
      rp.push({ type: 'drama', eventType: 'heroicRecognition', players: [a, b], text,
        badgeText: 'HEROIC RECOGNITION', badgeClass: 'gold', tag: 'challenge' });
    },
  },
  bethBoyfriendClaim: {
    check: (a, b, ep) => {
      return players.find(p => p.name === a)?.archetype === 'goat' || players.find(p => p.name === b)?.archetype === 'goat';
    },
    apply: (a, b, ep, rp) => {
      const goat = (players.find(p => p.name === a)?.archetype === 'goat') ? a : b;
      const other = goat === a ? b : a;
      const prG = pronouns(goat);
      const pool = [
        `${goat} launches into a detailed story about ${prG.posAdj} boyfriend back home while waiting for Phase 2. ${other} nods politely for what feels like an eternity.`,
        `"My boyfriend would be SO good at this challenge," ${goat} announces. ${other} pauses. "...Cool."`,
        `${goat} describes ${prG.posAdj} boyfriend's many accomplishments in loving detail. Nobody asked. ${other} looks for an escape.`,
      ];
      const text = pool[Math.floor(Math.random() * pool.length)];
      rp.push({ type: 'drama', eventType: 'bethBoyfriendClaim', players: [goat, other], text,
        badgeText: 'BOYFRIEND CLAIM', badgeClass: 'pink', tag: 'challenge' });
    },
  },
  panicBonding: {
    check: (a, b, ep) => {
      const stA = pStats(a);
      const stB = pStats(b);
      return stA.temperament < 5 || stB.temperament < 5;
    },
    apply: (a, b, ep, rp) => {
      const pool = [
        `${a} and ${b} sit together between phases, neither saying much. After a shared disaster, there's nothing much to say — and everything. Bond deepened.`,
        `"I thought I was done for in that last round." ${a} looks at ${b}. ${b} nods slowly. "Me too." Shared near-disaster has a way of connecting people.`,
        `${a} and ${b} grip each other's arms for a moment before Phase 2. No words. Just a look. They both know what's coming.`,
      ];
      const text = pool[Math.floor(Math.random() * pool.length)];
      addBond(a, b, 0.7);
      rp.push({ type: 'drama', eventType: 'panicBonding', players: [a, b], text,
        badgeText: 'PANIC BONDING', badgeClass: 'blue', tag: 'challenge' });
    },
  },
};

function _simulateDisasterDramaBreak(ep, tribeMembers, result) {
  const rp = [];
  const allPlayers = tribeMembers.flatMap(t => t.members);
  const campKey = gs.tribes[0]?.name || 'merge';

  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  const numEvents = 4 + Math.floor(Math.random() * 3); // 4-6
  const eventKeys = Object.keys(DISASTER_DRAMA_EVENTS);
  const used = new Set();

  // Two-pass: first pass eligible, second pass fallback
  for (let pass = 0; pass < 2 && rp.length < numEvents; pass++) {
    const shuffled = [...eventKeys].sort(() => Math.random() - 0.5);
    for (const key of shuffled) {
      if (used.has(key)) continue;
      if (rp.length >= numEvents) break;

      const ev = DISASTER_DRAMA_EVENTS[key];
      // Pick two players for the event
      const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
      let fired = false;
      for (let i = 0; i < shuffledPlayers.length && !fired; i++) {
        for (let j = 0; j < shuffledPlayers.length && !fired; j++) {
          if (i === j) continue;
          const a = shuffledPlayers[i];
          const b = shuffledPlayers[j];
          const passes = pass === 0 ? ev.check(a, b, ep) : true;
          if (passes) {
            ev.apply(a, b, ep, rp);
            used.add(key);
            fired = true;
          }
        }
      }
    }
  }

  // Push all drama events as camp events
  rp.forEach(e => {
    ep.campEvents[campKey].post.push({
      text: e.text,
      players: e.players || allPlayers,
      badgeText: e.badgeText || 'DRAMA BREAK',
      badgeClass: e.badgeClass || 'blue',
      tag: 'challenge',
    });
  });

  result.breakEvents = rp;
  result.phases.push('dramaBreak');
}

// ─── Phase 2: Submarine ───────────────────────────────────────────────────────

function _simulateSubmarine(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const noise = (range) => (Math.random() - 0.5) * range;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
  if (!gs.popularity) gs.popularity = {};
  if (!gs._disasterHeat) gs._disasterHeat = {};

  const phases1Winner = result.earthquakeWinner;
  const escapeCode = 0.15; // phase 1 winner bonus per stage

  // Per-player state: submerged, skipCheck (leakPlug), breathExtend
  const pState = {};
  tribeMembers.forEach(t => {
    t.members.forEach(name => {
      pState[name] = { tribe: t.name, submerged: false, skipCheck: false, breathExtend: false };
    });
  });

  // Per-tribe escape progress
  const escapeProgress = {};
  tribeMembers.forEach(t => { escapeProgress[t.name] = 0; });

  const stages = [];
  const rp = [];
  let escapedTribe = null;
  const campKey = gs.tribes[0]?.name || 'merge';

  // Intro
  rp.push({ type: 'host', text: pick(SUBMARINE_HOST.intro)(host) });

  const ESCAPE_THRESHOLD = 1.5;

  for (let si = 0; si < SUBMARINE_STAGES.length; si++) {
    const stage = SUBMARINE_STAGES[si];
    rp.push({ type: 'stageStart', text: pick(SUBMARINE_HOST.stageStart)(host, stage) });
    rp.push({ type: 'flooding', text: pick(SUBMARINE_HOST.flooding)(host, stage.waterPct) });

    const stageData = { num: si + 1, waterPct: stage.waterPct, tribeStates: [] };

    for (const t of tribeMembers) {
      const tribeEscapeProg = { tribe: t.name, surviving: [], submerged: [], escapeProgress: 0, events: [] };

      // Submerge checks per player
      const thresholds = [0.35, 0.45, 0.55, 0.65];
      const threshold = thresholds[si];
      const statFns = [
        st => st.temperament * 0.06 + st.mental * 0.03,
        st => st.intuition * 0.06 + st.strategic * 0.04,
        st => st.mental * 0.06 + st.strategic * 0.05,
        st => st.endurance * 0.06 + st.physical * 0.05,
      ];

      for (const name of t.members) {
        const ps = pState[name];
        if (ps.submerged) {
          // Breath extend: survives one more stage submerged
          if (ps.breathExtend) {
            ps.breathExtend = false;
            tribeEscapeProg.submerged.push(name);
          } else {
            tribeEscapeProg.submerged.push(name);
          }
          continue;
        }
        if (ps.skipCheck) {
          ps.skipCheck = false;
          tribeEscapeProg.surviving.push(name);
          continue;
        }

        const st = pStats(name);
        let roll = statFns[si](st) + noise(0.2);
        // Earthquake injury penalty
        if (gs.lingeringInjuries?.[name]) roll -= 0.1;

        if (roll <= threshold) {
          ps.submerged = true;
          rp.push({ type: 'submerged', player: name, tribe: t.name,
            text: pick(SUBMARINE_HOST.playerSubmerged)(host, name) });
          tribeEscapeProg.submerged.push(name);
        } else {
          tribeEscapeProg.surviving.push(name);
        }
      }

      // Events: 2-3 per tribe per stage
      const numEvents = 2 + (Math.random() < 0.33 ? 1 : 0);
      const eventKeys = Object.keys(SUBMARINE_EVENTS);
      const usedEvents = new Set();

      for (let ei = 0; ei < numEvents; ei++) {
        const candidates = eventKeys.filter(k => !usedEvents.has(k));
        if (!candidates.length) break;
        const evKey = candidates[Math.floor(Math.random() * candidates.length)];
        usedEvents.add(evKey);

        const surviving = tribeEscapeProg.surviving;
        const submerged = tribeEscapeProg.submerged;
        const allMembers = t.members;

        // Pick a player for narrative
        const pickPlayer = (pool) => pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : allMembers[0];
        const actor = pickPlayer(surviving.length > 0 ? surviving : allMembers);
        const pr = pronouns(actor);
        const st = pStats(actor);

        const evPool = SUBMARINE_EVENTS[evKey];
        const evText = pick(evPool)(actor, pr);
        let progressDelta = 0;

        switch (evKey) {
          case 'sharkInHatch': {
            // boldness check or -0.1
            const boldRoll = st.boldness * 0.08 + noise(0.2);
            if (boldRoll < 0.4) progressDelta = -0.1;
            break;
          }
          case 'fireAbove':
            progressDelta = -0.05;
            break;
          case 'droppedCode':
            // halve phase 1 bonus for this stage (tracked via flag on result)
            if (t.name === phases1Winner) progressDelta = -escapeCode * 0.5;
            break;
          case 'strawSnorkel': {
            // submerged player can contribute
            const sub = pickPlayer(submerged);
            if (sub && pState[sub]) {
              const subSt = pStats(sub);
              const snorkelRoll = subSt.mental * 0.08 + noise(0.2);
              if (snorkelRoll > 0.5) {
                progressDelta = 0.1;
                ep.chalMemberScores[sub] = (ep.chalMemberScores[sub] || 0) + 7;
                gs.popularity[sub] = (gs.popularity[sub] || 0) + 3;
              }
            }
            break;
          }
          case 'panicDrowning': {
            // temperament check — drags teammate
            const panicRoll = st.temperament * 0.08 + noise(0.1);
            if (panicRoll < 0.3) {
              pState[actor].submerged = true;
              if (!tribeEscapeProg.submerged.includes(actor)) {
                tribeEscapeProg.submerged.push(actor);
                const idx = tribeEscapeProg.surviving.indexOf(actor);
                if (idx !== -1) tribeEscapeProg.surviving.splice(idx, 1);
              }
              // drag a tribemate
              const dragged = pickPlayer(surviving.filter(n => n !== actor));
              if (dragged && pState[dragged]) {
                pState[dragged].submerged = true;
                tribeEscapeProg.submerged.push(dragged);
                const idx2 = tribeEscapeProg.surviving.indexOf(dragged);
                if (idx2 !== -1) tribeEscapeProg.surviving.splice(idx2, 1);
              }
              gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
              if (!gs._disasterHeat[dragged || actor]) {
                const target = dragged || actor;
                gs._disasterHeat[target] = { target: actor, amount: 1.0, expiresEp: (gs.episode || 0) + 2 };
              }
            }
            break;
          }
          case 'airPocket': {
            // un-submerge one player
            if (submerged.length > 0) {
              const rescued = submerged[Math.floor(Math.random() * submerged.length)];
              if (pState[rescued]) {
                pState[rescued].submerged = false;
                tribeEscapeProg.submerged.splice(tribeEscapeProg.submerged.indexOf(rescued), 1);
                tribeEscapeProg.surviving.push(rescued);
              }
            }
            break;
          }
          case 'lockBreakthrough': {
            const lockRoll = st.mental * 0.08 + noise(0.2);
            if (lockRoll > 0.5) {
              progressDelta = escapeProgress[t.name] * 0.3; // +30% of current
              ep.chalMemberScores[actor] = (ep.chalMemberScores[actor] || 0) + 7;
              gs.popularity[actor] = (gs.popularity[actor] || 0) + 2;
            }
            break;
          }
          case 'teamworkPush': {
            if (surviving.length >= 2) progressDelta = 0.1;
            break;
          }
          case 'leakPlug': {
            const leakRoll = st.physical * 0.08 + noise(0.2);
            if (leakRoll > 0.4) {
              // skip next submerge check for this player
              pState[actor].skipCheck = true;
            }
            break;
          }
          case 'breathHold': {
            const breathRoll = st.endurance * 0.08 + noise(0.1);
            if (breathRoll > 0.5) {
              pState[actor].breathExtend = true;
            }
            break;
          }
          case 'floodingPanic':
            progressDelta = -0.05 * t.members.length;
            break;
          case 'heroicDive': {
            const heroSub = pickPlayer(submerged);
            if (heroSub) {
              progressDelta = 0.1;
              ep.chalMemberScores[heroSub] = (ep.chalMemberScores[heroSub] || 0) + 6;
            }
            break;
          }
        }

        tribeEscapeProg.events.push({ type: evKey, actor, text: evText, progressDelta });
        rp.push({ type: 'event', eventType: evKey, tribe: t.name, player: actor, text: evText });
      }

      // Compute escape progress for this stage
      let stageProg = 0;
      for (const name of tribeEscapeProg.surviving) {
        const st = pStats(name);
        stageProg += (st.mental * 0.04 + st.strategic * 0.03 + noise(0.15));
      }
      // Average by tribe member count (fairness for small tribes)
      if (t.members.length > 0) stageProg /= t.members.length;

      // Phase 1 winner bonus
      if (t.name === phases1Winner) stageProg += escapeCode;

      // Event deltas
      stageProg += tribeEscapeProg.events.reduce((s, e) => s + (e.progressDelta || 0), 0);

      escapeProgress[t.name] += stageProg;
      tribeEscapeProg.escapeProgress = +stageProg.toFixed(3);

      // chalMemberScores: +4 per stage survived, +6 for escape contribution
      for (const name of tribeEscapeProg.surviving) {
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 4;
        if (stageProg > 0) ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 6;
      }

      stageData.tribeStates.push(tribeEscapeProg);
    } // end tribe loop

    stages.push(stageData);

    // Win check: first tribe past threshold
    for (const t of tribeMembers) {
      if (escapeProgress[t.name] >= ESCAPE_THRESHOLD && !escapedTribe) {
        escapedTribe = t.name;
        rp.push({ type: 'escape', tribe: t.name, text: pick(SUBMARINE_HOST.escape)(host, t.name) });
        break;
      }
    }
    if (escapedTribe) break;
  }

  // If nobody escaped after all stages, highest progress wins
  if (!escapedTribe) {
    const sorted = Object.entries(escapeProgress).sort((a, b) => b[1] - a[1]);
    escapedTribe = sorted[0][0];
    rp.push({ type: 'escape', tribe: escapedTribe,
      text: pick(SUBMARINE_HOST.escape)(host, escapedTribe) + ' (closest to escape)' });
  }

  result.submarine = {
    stages,
    escapeProgress: Object.fromEntries(Object.entries(escapeProgress).map(([k, v]) => [k, +v.toFixed(3)])),
    winner: escapedTribe,
    rp,
  };
  result.phases.push('submarine');

  // Camp event (campKey declared above)
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  ep.campEvents[campKey].post.push({
    text: `Submarine Phase — ${escapedTribe} cracks the escape code first! The other tribe is going to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'SUBMARINE PHASE', badgeClass: 'blue',
    tag: 'challenge',
  });

  ep._debugSubmarine = {
    escapeProgress: result.submarine.escapeProgress,
    winner: escapedTribe,
    phases1Winner,
  };
}

// ─── Phase 1: Earthquake ──────────────────────────────────────────────────────

function _simulateEarthquake(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const rp = [];
  const noise = (range) => (Math.random() - 0.5) * range;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Player state map: name -> { tribe, stage, fatigue, stopped, injured, events }
  const stateMap = {};
  tribeMembers.forEach(t => {
    t.members.forEach(name => {
      stateMap[name] = { tribe: t.name, stage: 0, fatigue: 0, stopped: false, injured: false, passStreak: 0 };
    });
  });

  if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
  if (!gs.popularity) gs.popularity = {};

  const rounds = [];
  let phaseWinner = null;

  // Intro
  rp.push({ type: 'host', text: pick(DISASTER_HOST.earthquakeIntro)(host) });

  for (let r = 1; r <= 5; r++) {
    const hazard = DISASTER_HAZARDS[r - 1];
    rp.push({ type: 'roundStart', text: pick(DISASTER_HOST.roundStart)(host, r, hazard) });

    // Escalating threshold
    const thresholds = [0.35, 0.38, 0.42, 0.48, 0.52];
    const threshold = thresholds[r - 1];

    const roundData = { num: r, hazard: hazard.id, playerStates: [] };

    // Collect all active players in a random order for event interactions
    const allActive = Object.entries(stateMap).filter(([, s]) => !s.stopped).map(([n]) => n);

    for (const name of allActive) {
      const s = stateMap[name];
      const pr = pronouns(name);
      const st = pStats(name);
      const tribe = s.tribe;
      const tribemates = tribeMembers.find(t => t.name === tribe)?.members.filter(m => m !== name) || [];

      // Base fatigue
      s.fatigue += 1.0;

      // Events selection
      const eventsThisRound = [];
      let movementBonus = 0;
      let stuck = false;

      // Build candidate event list
      const candidates = [];

      // Lava-specific
      if (hazard.id === 'lava') {
        if (st.boldness * 0.08 > Math.random() * 0.5) candidates.push({ type: 'dodgeLava', w: 2 });
        else candidates.push({ type: 'lavaBurn', w: 1.5 });
      }
      // Tremors/collapse
      if (hazard.id === 'tremors' || hazard.id === 'collapse') {
        candidates.push({ type: 'rockTrip', w: 1 });
        if (st.boldness * 0.08 > 0.4 + Math.random() * 0.3) candidates.push({ type: 'surfShockwave', w: 1.5 });
      }
      // Debris/hail
      if (hazard.id === 'debris' || hazard.id === 'hailstorm' || hazard.id === 'collapse') {
        if (st.intuition * 0.08 > Math.random() * 0.4) candidates.push({ type: 'debrisDodge', w: 2 });
        if (hazard.id === 'hailstorm' || hazard.id === 'collapse') candidates.push({ type: 'golfBallHit', w: 1.5 });
      }
      // r4+ ceilingCollapse
      if (r >= 4 && Math.random() < 0.2) candidates.push({ type: 'ceilingCollapse', w: 1 });

      // Universal candidates
      if (st.endurance * 0.08 > 0.4 + Math.random() * 0.3) candidates.push({ type: 'adrenalineSurge', w: 1.5 });
      candidates.push({ type: 'stumbleRecover', w: 0.8 });
      if (st.physical * 0.08 > 0.4 + Math.random() * 0.3) candidates.push({ type: 'heroicSprint', w: 1.5 });
      if (st.temperament * 0.08 < 0.3) candidates.push({ type: 'panicFreeze', w: 1 });
      if (Math.random() < 0.1) candidates.push({ type: 'chefTargets', w: 1 });

      // Social/team candidates
      if (st.social * 0.08 > 0.3 + Math.random() * 0.3 && tribemates.length > 0) candidates.push({ type: 'draftBehind', w: 1 });
      if (st.loyalty * 0.08 > 0.4 + Math.random() * 0.3 && tribemates.length > 0) candidates.push({ type: 'shieldTeammate', w: 1.5 });
      // carryInjured — needs a stopped teammate
      const stoppedTm = tribemates.find(tm => stateMap[tm]?.stopped);
      if (stoppedTm && st.loyalty * 0.08 > 0.5) candidates.push({ type: 'carryInjured', w: 1, teammate: stoppedTm });
      // findShortcut
      if (st.intuition * 0.08 > 0.5 + Math.random() * 0.3 && Math.random() < 0.25) candidates.push({ type: 'findShortcut', w: 1 });

      // Pick 1-2 events (deduplicate type)
      const seen = new Set();
      const deduped = candidates.filter(c => { if (seen.has(c.type)) return false; seen.add(c.type); return true; });
      const totalW = deduped.reduce((a, c) => a + c.w, 0);
      const numPick = Math.random() < 0.5 ? 1 : 2;

      for (let pick_i = 0; pick_i < numPick && deduped.length > 0; pick_i++) {
        let rw = Math.random() * totalW;
        for (const cand of deduped) {
          rw -= cand.w;
          if (rw <= 0) {
            eventsThisRound.push(cand);
            break;
          }
        }
      }

      // Apply events
      for (const ev of eventsThisRound) {
        const pool = DISASTER_EVENTS[ev.type];
        let text = '';
        const tm = ev.teammate || (tribemates.length > 0 ? tribemates[Math.floor(Math.random() * tribemates.length)] : null);
        const tmPr = tm ? pronouns(tm) : null;

        if (['shieldTeammate', 'draftBehind', 'carryInjured'].includes(ev.type) && tm && tmPr) {
          text = pick(pool)(name, tm, pr, tmPr);
        } else {
          text = pick(pool)(name, pr);
        }

        rp.push({ type: 'event', eventType: ev.type, player: name, tribe, text });

        switch (ev.type) {
          case 'dodgeLava':
            movementBonus += 0.1;
            s.fatigue -= 0.5;
            break;
          case 'lavaBurn':
            s.fatigue += 1.0;
            movementBonus -= 0.1;
            break;
          case 'rockTrip':
            s.fatigue += 1.0;
            stuck = true;
            break;
          case 'debrisDodge':
            movementBonus += 0.05;
            gs.popularity[name] = (gs.popularity[name] || 0) + 1;
            break;
          case 'golfBallHit':
            s.fatigue += 1.5;
            movementBonus -= 0.15;
            break;
          case 'shieldTeammate':
            s.fatigue += 1.0;
            if (tm) addBond(name, tm, 0.4);
            gs.popularity[name] = (gs.popularity[name] || 0) + 1;
            break;
          case 'adrenalineSurge':
            s.fatigue = Math.max(0, s.fatigue - 1.0);
            movementBonus += 0.1;
            break;
          case 'stumbleRecover':
            s.fatigue += 0.5;
            break;
          case 'surfShockwave':
            movementBonus += 0.15;
            break;
          case 'chefTargets':
            s.fatigue += 2.0;
            break;
          case 'draftBehind':
            movementBonus += 0.1;
            break;
          case 'panicFreeze':
            stuck = true;
            s.fatigue += 0.5;
            break;
          case 'heroicSprint':
            movementBonus += 0.2;
            s.fatigue += 1.0;
            gs.popularity[name] = (gs.popularity[name] || 0) + 1;
            break;
          case 'carryInjured':
            s.fatigue += 1.5;
            if (tm && stateMap[tm]) {
              stateMap[tm].stage = Math.min(5, stateMap[tm].stage + 1);
              stateMap[tm].stopped = false; // briefly helped forward
            }
            break;
          case 'findShortcut':
            movementBonus += 1.0; // will add extra stage below
            break;
          case 'ceilingCollapse':
            // applied tribe-wide below
            break;
        }
      }

      // Tribe-wide ceilingCollapse penalty
      if (eventsThisRound.some(e => e.type === 'ceilingCollapse')) {
        tribeMembers.find(t => t.name === tribe)?.members.forEach(m => {
          if (!stateMap[m].stopped) stateMap[m].fatigue += 0.2;
        });
      }

      // Stat check
      let roll = 0;
      if (r === 1) roll = st.physical * 0.05 + st.endurance * 0.03 + noise(0.25);
      else if (r === 2) roll = st.boldness * 0.05 + st.endurance * 0.04 + noise(0.25);
      else if (r === 3) roll = st.intuition * 0.05 + st.physical * 0.04 + noise(0.25);
      else if (r === 4) roll = st.mental * 0.04 + st.physical * 0.05 + noise(0.25);
      else roll = (st.physical + st.endurance + st.boldness + st.mental) * 0.02 + noise(0.2);

      roll += movementBonus;

      let advanced = false;
      const passed = !stuck && roll > threshold;

      if (passed) {
        s.passStreak = (s.passStreak || 0) + 1;
        // injured players need 2 passes to advance
        if (s.injured) {
          if (s.passStreak >= 2) { s.stage = Math.min(5, s.stage + 1); advanced = true; s.passStreak = 0; }
        } else {
          s.stage = Math.min(5, s.stage + 1);
          advanced = true;
          s.passStreak = 0;
        }
        // findShortcut bonus stage
        if (eventsThisRound.some(e => e.type === 'findShortcut')) {
          s.stage = Math.min(5, s.stage + 1);
        }
        rp.push({ type: 'advance', player: name, tribe, text: pick(DISASTER_HOST.playerAdvances)(host, name) });
      } else if (!stuck) {
        s.fatigue += 0.5;
        s.passStreak = 0;
        rp.push({ type: 'stuck', player: name, tribe, text: pick(DISASTER_HOST.playerStuck)(host, name) });
      }

      // Stopped check
      const endStat = st.endurance;
      if (s.fatigue >= endStat && !s.stopped) {
        s.stopped = true;
        s.injured = true;
        gs.lingeringInjuries[name] = { ep: (gs.episode || 0) + 1, duration: 2, penalty: 0.15 };
        rp.push({ type: 'stopped', player: name, tribe, text: pick(DISASTER_HOST.playerStopped)(host, name) });
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0); // no bonus for stopping
      }

      // chalMemberScores
      if (advanced) ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 3;
      if (s.stage >= 5) ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 5;
      const heroicEvents = ['heroicSprint', 'shieldTeammate', 'carryInjured'];
      if (eventsThisRound.some(e => heroicEvents.includes(e.type))) {
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
      }

      roundData.playerStates.push({
        name, tribe,
        stage: s.stage,
        fatigue: +s.fatigue.toFixed(2),
        stopped: s.stopped,
        events: eventsThisRound.map(e => e.type),
        advanced,
      });
    }

    rounds.push(roundData);

    // Win check: tribe with ALL members at stage 5
    for (const t of tribeMembers) {
      if (t.members.every(m => stateMap[m].stage >= 5)) {
        phaseWinner = t.name;
        break;
      }
    }
    if (phaseWinner) break;
  }

  // Fallback: tribe with most total stages
  if (!phaseWinner) {
    const tribeStages = {};
    tribeMembers.forEach(t => {
      tribeStages[t.name] = t.members.reduce((sum, m) => sum + (stateMap[m]?.stage || 0), 0);
    });
    const sorted = Object.entries(tribeStages).sort((a, b) => b[1] - a[1]);
    phaseWinner = sorted[0][0];
  }

  rp.push({ type: 'end', text: pick(DISASTER_HOST.earthquakeEnd)(host, phaseWinner) });

  // Phase 2 bonus flag
  result.earthquakeWinner = phaseWinner;
  result.earthquakeBonus = 0.15;

  // tribeScores contribution
  result.tribeScores[phaseWinner] = (result.tribeScores[phaseWinner] || 0) + 1;

  result.earthquake = {
    rounds,
    tribeFinishOrder: null,
    winner: phaseWinner,
    rp,
  };
  result.phases.push('earthquake');

  // Camp event
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  ep.campEvents[campKey].post.push({
    text: `Earthquake Phase — ${phaseWinner} survives the disaster marathon first! Lingering injuries will slow some players next episode.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'EARTHQUAKE PHASE', badgeClass: 'orange',
    tag: 'challenge',
  });

  ep._debugEarthquake = {
    winner: phaseWinner,
    playerFinal: Object.fromEntries(Object.entries(stateMap).map(([n, s]) => [n, { stage: s.stage, fatigue: +s.fatigue.toFixed(2), stopped: s.stopped }])),
  };
}

// ─── Main simulate ────────────────────────────────────────────────────────────

export function simulateMastersOfDisasters(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    earthquake: null,
    submarine: null,
    breakEvents: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.mastersOfDisasters = result;
  ep.challengeType = 'masters-of-disasters';
  ep.challengeLabel = 'Masters of Disasters';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // Phase 1 — Earthquake
  _simulateEarthquake(ep, tribeMembers, result);

  // Drama Break between phases
  _simulateDisasterDramaBreak(ep, tribeMembers, result);

  // Phase 2 — Submarine
  _simulateSubmarine(ep, tribeMembers, result);

  // Winner/loser based solely on submarine result
  const subWinner = result.submarine.winner;
  const subProgress = result.submarine.escapeProgress;
  const loserName = Object.entries(subProgress).sort((a, b) => a[1] - b[1])[0][0];

  ep.winner = tribes.find(t => t.name === subWinner);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== subWinner);

  updateChalRecord(ep);

  ep.campEvents[campKey].post.push({
    text: `Masters of Disasters: ${subWinner} escapes the sinking submarine first! ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'MASTERS OF DISASTERS', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugMastersOfDisasters = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
    subWinner,
    earthquakeWinner: result.earthquakeWinner,
    escapeProgress: result.submarine.escapeProgress,
  };
}

export function _textMastersOfDisasters(ep, ln, sec) {
  const md = ep.mastersOfDisasters;
  if (!md) return;
  const eq = md.earthquake;
  const sub = md.submarine;
  sec('Masters of Disasters');
  if (eq) {
    ln(`Phase 1 — Earthquake of Inevitable Pain. The ground shook, the lava-soup flew, and ${eq.winner} survived first, earning the escape code advantage.`);
    const stopped = Object.values(ep._debugEarthquake?.playerFinal || {}).filter(s => s.stopped).length;
    if (stopped > 0) ln(`${stopped} player${stopped > 1 ? 's' : ''} collapsed from exhaustion and carry lingering injuries into Phase 2.`);
  }
  if (sub) {
    ln(`Phase 2 — Sinking Submarine. Water rose stage by stage as tribes raced to crack the escape code.`);
    const prog = sub.escapeProgress || {};
    const progLines = Object.entries(prog).map(([t, v]) => `${t}: ${v.toFixed(2)}`).join(', ');
    if (progLines) ln(`Escape progress — ${progLines}.`);
    ln(`${sub.winner} cracked the code and escaped first — immunity is theirs.`);
  } else {
    ln('The teams face disaster-themed challenges — survive an earthquake marathon, then escape a sinking submarine.');
  }
}

export function rpBuildMastersOfDisastersTitleCard(ep) {
  if (!ep.mastersOfDisasters) return '';
  const md = ep.mastersOfDisasters;
  const eq = md.earthquake;
  const sub = md.submarine;
  const drama = md.breakEvents || [];

  // ── Earthquake section ──
  const eqRows = (eq?.rp || []).map(r => {
    const cls = r.type === 'host' ? 'color:#f59e0b' : r.type === 'roundStart' ? 'color:#fb923c;font-weight:bold' : r.type === 'stopped' ? 'color:#ef4444' : r.type === 'advance' ? 'color:#4ade80' : 'color:#e2e8f0';
    return `<p style="margin:4px 0;font-size:13px;${cls}">${r.text}</p>`;
  }).join('');

  // ── Drama break section ──
  const dramaBadge = (e) => {
    const colors = { red: '#ef4444', orange: '#f97316', purple: '#a855f7', gold: '#f59e0b', blue: '#3b82f6', pink: '#ec4899', gray: '#6b7280' };
    const col = colors[e.badgeClass] || '#94a3b8';
    return `<span style="background:${col};color:#fff;font-size:10px;padding:1px 6px;border-radius:3px;margin-right:6px">${e.badgeText || 'DRAMA'}</span>`;
  };
  const dramaRows = drama.map(e =>
    `<p style="margin:4px 0;font-size:13px;color:#e2e8f0">${dramaBadge(e)}${e.text}</p>`
  ).join('');

  // ── Submarine section ──
  const subRows = (sub?.rp || []).map(r => {
    const cls = r.type === 'host' ? 'color:#38bdf8' : r.type === 'stageStart' ? 'color:#7dd3fc;font-weight:bold' : r.type === 'flooding' ? 'color:#60a5fa' : r.type === 'submerged' ? 'color:#ef4444' : r.type === 'escape' ? 'color:#4ade80;font-weight:bold' : 'color:#e2e8f0';
    return `<p style="margin:4px 0;font-size:13px;${cls}">${r.text}</p>`;
  }).join('');

  const subProg = sub?.escapeProgress || {};
  const progBar = Object.entries(subProg).map(([tribe, v]) => {
    const pct = Math.min(100, Math.round((v / 1.5) * 100));
    const isWin = tribe === sub?.winner;
    return `<div style="margin:6px 0">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:${isWin ? '#4ade80' : '#94a3b8'}">
        <span>${tribe}</span><span>${v.toFixed(2)} / 1.50</span>
      </div>
      <div style="background:#1e3a5f;border-radius:4px;height:8px;margin-top:2px">
        <div style="background:${isWin ? '#4ade80' : '#38bdf8'};height:8px;border-radius:4px;width:${pct}%"></div>
      </div>
    </div>`;
  }).join('');

  const eqWinner = eq?.winner || '';
  const subWinner = sub?.winner || '';

  return `
<div style="background:#060d1a;padding:32px;font-family:serif;min-height:100%;color:#e2e8f0">

  <!-- HEADER -->
  <div style="text-align:center;margin-bottom:28px">
    <div style="font-size:11px;letter-spacing:4px;color:#f59e0b;text-transform:uppercase;margin-bottom:4px">Masters of Disasters</div>
    <h1 style="color:#f97316;font-size:30px;margin:0">⚡ Two-Phase Challenge</h1>
    <div style="color:#94a3b8;font-size:13px;margin-top:6px">Phase 1: Earthquake &nbsp;|&nbsp; Drama Break &nbsp;|&nbsp; Phase 2: Submarine</div>
  </div>

  <!-- PHASE 1 -->
  <div style="background:#1a0a00;border:1px solid #7c2d12;border-radius:8px;padding:16px;margin-bottom:16px">
    <div style="font-size:14px;font-weight:bold;color:#fb923c;margin-bottom:10px">🌋 Phase 1 — Earthquake of Inevitable Pain</div>
    <div style="max-height:280px;overflow-y:auto">${eqRows}</div>
    ${eqWinner ? `<div style="margin-top:10px;padding:6px 10px;background:#451a03;border-radius:4px;color:#fb923c;font-size:12px">Phase 1 Winner: <strong>${eqWinner}</strong> — escape code advantage earned</div>` : ''}
  </div>

  <!-- DRAMA BREAK -->
  ${drama.length > 0 ? `
  <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:16px;margin-bottom:16px">
    <div style="font-size:14px;font-weight:bold;color:#94a3b8;margin-bottom:10px">🎭 Drama Break — Between Phases</div>
    ${dramaRows}
  </div>` : ''}

  <!-- PHASE 2 -->
  <div style="background:#061926;border:1px solid #0c4a6e;border-radius:8px;padding:16px;margin-bottom:16px">
    <div style="font-size:14px;font-weight:bold;color:#38bdf8;margin-bottom:10px">🚢 Phase 2 — Sinking Submarine</div>
    <div style="max-height:280px;overflow-y:auto;margin-bottom:12px">${subRows}</div>
    ${progBar}
    ${subWinner ? `<div style="margin-top:10px;padding:6px 10px;background:#0c4a6e;border-radius:4px;color:#4ade80;font-size:12px">🏆 Submarine Winner: <strong>${subWinner}</strong> — IMMUNITY</div>` : ''}
  </div>

</div>`;
}

export function mastersOfDisastersRevealNext() {}
export function mastersOfDisastersRevealAll() {}
