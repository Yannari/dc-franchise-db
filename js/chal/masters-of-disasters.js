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
  // ── Narrative-only events (no mechanical effect, add atmosphere) ──
  lightFlicker: [
    (p, pr) => `The emergency lights flicker and die. For three seconds, the submarine is pitch black. ${p} grabs the nearest wall and holds on.`,
    (p, pr) => `A power surge kills the lights. ${p} feels the water rising in the dark. When the lights come back, everyone's moved.`,
    (p, pr) => `The bulb above ${p} explodes. Glass in the water. Nobody's hurt, but the mood drops another notch.`,
  ],
  metalGroan: [
    (p, pr) => `The hull GROANS — a deep, structural sound that makes everyone freeze. Is the sub breaking apart?`,
    (p, pr) => `A metallic screech echoes through the chamber. ${p} looks at the ceiling. Something shifted up there.`,
    (p, pr) => `The pressure outside pushes in. The walls creak. ${p} mutters something nobody wants to hear repeated.`,
  ],
  confessionMoment: [
    (p, pr) => `"If we don't make it out —" ${p} starts, then stops. The tribe goes quiet. ${pr.Sub} doesn't finish the sentence.`,
    (p, pr) => `${p} turns to ${pr.posAdj} tribemate and says something only they can hear. Whatever it is, it lands hard.`,
    (p, pr) => `"I never told anyone this, but—" ${p} catches ${pr.ref}. "${pr.Sub} trails off. The water keeps rising.`,
  ],
  chrisOnIntercom: [
    (p, pr) => `Chris's voice crackles through the intercom: "Just checking in! How's everyone doing? Great? Great." The intercom clicks off.`,
    (p, pr) => `"Fun fact!" Chris announces through a speaker. "This submarine was decommissioned for safety reasons! Anyway, good luck!"`,
    (p, pr) => `The intercom buzzes: "Chef, can you— wait, is this thing on? ...We should probably get them out soon." Chris sounds nervous.`,
  ],
  chefDoesntCare: [
    (p, pr) => `Chef's voice booms through a pipe: "Y'all still alive in there? ...Good. I'm on break." The pipe goes quiet.`,
    (p, pr) => `Someone bangs on the hull from outside. Chef yells back: "I HEARD you! I'm BUSY!" Silence.`,
    (p, pr) => `Through the wall, the tribe hears Chef humming. He's playing cards. He is not coming.`,
  ],
  waterTemperature: [
    (p, pr) => `The water is getting colder. ${p} can feel ${pr.posAdj} fingers going numb. Focus is harder now.`,
    (p, pr) => `"Is it just me or is this water FREEZING?" ${p} shivers. It's not just ${pr.obj}.`,
    (p, pr) => `${p}'s teeth chatter so loud the tribe can hear it over the rushing water.`,
  ],
  floatingDebris: [
    (p, pr) => `A toolbox floats past ${p}'s face. Then a chair. Then something that looks disturbingly organic.`,
    (p, pr) => `${p} pushes aside a floating clipboard. It reads "EMERGENCY PROCEDURES." Page one is blank.`,
    (p, pr) => `A rubber duck surfaces next to ${p}. Nobody knows where it came from. Nobody asks.`,
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
  const snorkelUsed = new Set();
  const fireAboveUsed = new Set();
  const airPocketUsed = new Set();
  const teamworkUsed = new Set();
  const breathHoldUsed = new Set();

  for (let si = 0; si < SUBMARINE_STAGES.length; si++) {
    const stage = SUBMARINE_STAGES[si];
    rp.push({ type: 'stageStart', text: pick(SUBMARINE_HOST.stageStart)(host, stage) });
    rp.push({ type: 'flooding', text: pick(SUBMARINE_HOST.flooding)(host, stage.waterPct) });

    const stageData = { num: si + 1, waterPct: stage.waterPct, tribeStates: [] };

    for (const t of tribeMembers) {
      const tribeEscapeProg = { tribe: t.name, surviving: [], submerged: [], escapeProgress: 0, events: [] };

      // Submerge checks per player
      const thresholds = [0.2, 0.35, 0.48, 0.6];
      const threshold = thresholds[si];
      const statFns = [
        st => st.temperament * 0.06 + st.mental * 0.03,
        st => st.intuition * 0.06 + st.strategic * 0.04,
        st => st.mental * 0.04 + st.endurance * 0.03 + st.strategic * 0.02,
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

      // Events: 2-3 per tribe per stage — no repeat types within same stage
      const numEvents = 2 + (Math.random() < 0.33 ? 1 : 0);
      const eventKeys = Object.keys(SUBMARINE_EVENTS);
      const usedEventsThisStage = new Set();

      for (let ei = 0; ei < numEvents; ei++) {
        const candidates = eventKeys.filter(k => {
          if (usedEventsThisStage.has(k)) return false;
          // Straw snorkel: only fire once per player across entire submarine
          if (k === 'strawSnorkel' && (!tribeEscapeProg.submerged.length || snorkelUsed.has(t.name))) return false;
          // Panic drowning: needs 2+ survivors to drag
          if (k === 'panicDrowning' && tribeEscapeProg.surviving.length < 2) return false;
          // Dropped code: only works if this tribe is Phase 1 winner
          if (k === 'droppedCode' && t.name !== phases1Winner) return false;
          // Limit fire above to once per tribe
          if (k === 'fireAbove' && fireAboveUsed.has(t.name)) return false;
          // Lock breakthrough: ONLY on stage 4 (the finale moment)
          if (k === 'lockBreakthrough' && si < SUBMARINE_STAGES.length - 1) return false;
          // Air pocket: once per tribe
          if (k === 'airPocket' && airPocketUsed.has(t.name)) return false;
          // Teamwork push: once per tribe
          if (k === 'teamworkPush' && teamworkUsed.has(t.name)) return false;
          // Breath hold: once per tribe
          if (k === 'breathHold' && breathHoldUsed.has(t.name)) return false;
          return true;
        });
        if (!candidates.length) break;
        const evKey = candidates[Math.floor(Math.random() * candidates.length)];
        usedEventsThisStage.add(evKey);
        if (evKey === 'fireAbove') fireAboveUsed.add(t.name);
        if (evKey === 'strawSnorkel') snorkelUsed.add(t.name);
        if (evKey === 'airPocket') airPocketUsed.add(t.name);
        if (evKey === 'teamworkPush') teamworkUsed.add(t.name);
        if (evKey === 'breathHold') breathHoldUsed.add(t.name);

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
            // temperament check — drags teammate. Only if 2+ survivors.
            const panicSurvivors = tribeEscapeProg.surviving.filter(n => n !== actor);
            if (panicSurvivors.length < 1) break;
            const panicRoll = st.temperament * 0.08 + noise(0.1);
            if (panicRoll < 0.3) {
              pState[actor].submerged = true;
              if (!tribeEscapeProg.submerged.includes(actor)) {
                tribeEscapeProg.submerged.push(actor);
                const idx = tribeEscapeProg.surviving.indexOf(actor);
                if (idx !== -1) tribeEscapeProg.surviving.splice(idx, 1);
              }
              const dragged = panicSurvivors[Math.floor(Math.random() * panicSurvivors.length)];
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
          // Narrative events — atmosphere only, no mechanical effect
          case 'lightFlicker':
          case 'metalGroan':
          case 'confessionMoment':
          case 'chrisOnIntercom':
          case 'chefDoesntCare':
          case 'waterTemperature':
          case 'floatingDebris':
            break;
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

  }

  // After all 4 stages: highest escape progress wins (regardless of threshold)
  const progressSorted = Object.entries(escapeProgress).sort((a, b) => b[1] - a[1]);
  escapedTribe = progressSorted[0][0];
  rp.push({ type: 'escape', tribe: escapedTribe, text: pick(SUBMARINE_HOST.escape)(host, escapedTribe) });

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

  const MAX_ROUNDS = 8;
  for (let r = 1; r <= MAX_ROUNDS; r++) {
    // Use hazard from list, or repeat last hazard for extra rounds
    const hazard = DISASTER_HAZARDS[Math.min(r - 1, DISASTER_HAZARDS.length - 1)];
    rp.push({ type: 'roundStart', text: pick(DISASTER_HOST.roundStart)(host, r, hazard) });

    // Escalating threshold (caps at round 5 difficulty for extra rounds)
    const thresholds = [0.35, 0.38, 0.42, 0.48, 0.52];
    const threshold = thresholds[Math.min(r - 1, thresholds.length - 1)];

    const roundData = { num: r, hazard: hazard.id, playerStates: [] };

    // Collect all active players in a random order for event interactions
    const allActive = Object.entries(stateMap).filter(([, s]) => !s.stopped && s.stage < 5).map(([n]) => n);

    for (const name of allActive) {
      const s = stateMap[name];
      const pr = pronouns(name);
      const st = pStats(name);
      const tribe = s.tribe;
      const tribemates = tribeMembers.find(t => t.name === tribe)?.members.filter(m => m !== name) || [];

      // Base fatigue — 0.4 per round. Events add the real fatigue.
      // 5 rounds * 0.4 = 2.0 base. Endurance 3 survives base but events push over.
      s.fatigue += 0.4;

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

      const remaining = [...deduped];
      for (let pick_i = 0; pick_i < numPick && remaining.length > 0; pick_i++) {
        const remW = remaining.reduce((a, c) => a + c.w, 0);
        let rw = Math.random() * remW;
        for (let ci = 0; ci < remaining.length; ci++) {
          rw -= remaining[ci].w;
          if (rw <= 0) {
            eventsThisRound.push(remaining[ci]);
            remaining.splice(ci, 1);
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
            s.fatigue += 0.5;
            movementBonus -= 0.1;
            break;
          case 'rockTrip':
            s.fatigue += 0.5;
            stuck = true;
            break;
          case 'debrisDodge':
            movementBonus += 0.05;
            gs.popularity[name] = (gs.popularity[name] || 0) + 1;
            break;
          case 'golfBallHit':
            s.fatigue += 0.5;
            movementBonus -= 0.15;
            break;
          case 'shieldTeammate':
            s.fatigue += 0.5;
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
            s.fatigue += 0.5;
            gs.popularity[name] = (gs.popularity[name] || 0) + 1;
            break;
          case 'carryInjured':
            s.fatigue += 0.5;
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
      if (s.stage >= 5) ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 8;
      if (s.stopped) ep.chalMemberScores[name] = Math.max(0, (ep.chalMemberScores[name] || 0) - 3);
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
    // Stop if ALL remaining runners are stopped (no more progress possible)
    const anyoneRunning = tribeMembers.some(t => t.members.some(m => !stateMap[m].stopped && stateMap[m].stage < 5));
    if (!anyoneRunning) break;
  }

  // Timeout: anyone still running after max rounds gets STOPPED
  const timedOutPlayers = [];
  for (const [name, s] of Object.entries(stateMap)) {
    if (!s.stopped && s.stage < 5) {
      s.stopped = true;
      s.timedOut = true;
      gs.lingeringInjuries = gs.lingeringInjuries || {};
      gs.lingeringInjuries[name] = { ep: (gs.episode || 0) + 1, duration: 2, penalty: 0.15 };
      ep.chalMemberScores[name] = Math.max(0, (ep.chalMemberScores[name] || 0) - 3);
      timedOutPlayers.push({ name, tribe: s.tribe, stage: s.stage });
      rp.push({ type: 'stopped', text: `${name} couldn't make it across in time. The course collapses around ${pronouns(name).obj}. Timed out at stage ${s.stage}.` });
    }
  }
  // Add timeout data to last round so VP can show it
  if (timedOutPlayers.length && rounds.length) {
    const lastRound = rounds[rounds.length - 1];
    lastRound.timedOut = timedOutPlayers;
  }

  // Fallback: most FINISHERS first, then stage percentage as tiebreak
  if (!phaseWinner) {
    const tribeStats = {};
    tribeMembers.forEach(t => {
      const finishers = t.members.filter(m => stateMap[m]?.stage >= 5).length;
      const finishPct = t.members.length > 0 ? finishers / t.members.length : 0;
      const totalStages = t.members.reduce((sum, m) => sum + (stateMap[m]?.stage || 0), 0);
      const stagePct = t.members.length > 0 ? totalStages / (t.members.length * 5) : 0;
      tribeStats[t.name] = { finishers, finishPct, stagePct };
    });
    // Sort: finisher % first, then stage % as tiebreak
    const sorted = Object.entries(tribeStats).sort((a, b) => {
      if (b[1].finishPct !== a[1].finishPct) return b[1].finishPct - a[1].finishPct;
      return b[1].stagePct - a[1].stagePct;
    });
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

  // ── Showmance moment (cross-tribe, 40% chance, romanticCompat gated) ──────
  if (seasonConfig.romance && Math.random() < 0.4) {
    const allPlayers = tribeMembers.flatMap(t => t.members);
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    let showmanceFired = false;
    outer: for (let i = 0; i < shuffled.length && !showmanceFired; i++) {
      for (let j = 0; j < shuffled.length && !showmanceFired; j++) {
        if (i === j) continue;
        const a = shuffled[i];
        const b = shuffled[j];
        // Must be cross-tribe
        const tribeA = tribeMembers.find(t => t.members.includes(a))?.name;
        const tribeB = tribeMembers.find(t => t.members.includes(b))?.name;
        if (tribeA === tribeB) continue;
        if (romanticCompat(a, b) <= 0) continue;

        const prA = pronouns(a);
        const prB = pronouns(b);
        const pool = [
          `Between phases, ${a} and ${b} end up side-by-side near the submarine entrance — two people from opposing tribes, catching their breath after surviving a disaster together. Something passes between them that the challenge never planned for.`,
          `${a} helps ${b} wring soup-lava out of ${prB.posAdj} hair between phases. It started as a kind gesture. It became something more charged than that. Both notice.`,
          `"You okay?" ${a} asks ${b}, who's sitting apart from the group nursing a bruise from the earthquake phase. It's a small thing — but ${prA.sub} lingers longer than ${prA.sub} needed to. So does ${b}.`,
          `Disaster, it turns out, is romantic. ${a} and ${b} — rivals from opposite tribes — share a moment in the chaos between Phase 1 and Phase 2 that neither expected.`,
          `${b} catches ${prB.posAdj} balance on ${a}'s arm when the submarine hatch lurches. ${a} doesn't let go immediately. ${b} doesn't pull away.`,
        ];
        const text = pool[Math.floor(Math.random() * pool.length)];
        addBond(a, b, 0.5);

        if (!ep.campEvents) ep.campEvents = {};
        if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
        if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
        ep.campEvents[campKey].post.push({
          text,
          players: [a, b],
          badgeText: 'DISASTER ROMANCE',
          badgeClass: 'pink',
          tag: 'challenge',
        });

        // Store on result for text backlog / VP
        result.showmanceMoment = { a, b, text };
        showmanceFired = true;
      }
    }
  }

  // ── Cold open ─────────────────────────────────────────────────────────────
  // Priority: Chef manifesto injury > all tribe stopped > lock breakthrough > straw snorkel > panic drowning drags teammate
  let coldOpen = null;

  // 1. Chef manifesto injury — chefTargets in earthquake rp with a stopped player
  if (!coldOpen && result.earthquake) {
    const eqRp = result.earthquake.rp || [];
    const chefEv = eqRp.find(r => r.type === 'event' && r.eventType === 'chefTargets');
    if (chefEv) {
      const stoppedPlayers = Object.entries(ep._debugEarthquake?.playerFinal || {}).filter(([, s]) => s.stopped).map(([n]) => n);
      if (stoppedPlayers.includes(chefEv.player)) {
        const pr = pronouns(chefEv.player);
        coldOpen = {
          type: 'chefManifesto',
          players: [chefEv.player],
          text: `Chef Hatchet singled out ${chefEv.player} with a personal grudge barrage — double soup, maximum velocity. ${pr.Sub} was still picking lava-soup out of ${pr.posAdj} ears when the exhaustion took over. Chef filmed it on ${seasonConfig.host || 'Chris'}'s phone.`,
          badgeText: 'CHEF MANIFESTO INJURY',
          badgeClass: 'red',
        };
      }
    }
  }

  // 2. All members of a tribe stopped in earthquake
  if (!coldOpen && result.earthquake) {
    const debugFinal = ep._debugEarthquake?.playerFinal || {};
    for (const t of tribeMembers) {
      if (t.members.every(m => debugFinal[m]?.stopped)) {
        coldOpen = {
          type: 'allStopped',
          players: t.members,
          text: `${t.name} went down to a player. Every member stopped in the earthquake phase — the tribe carried nothing but injuries into the submarine.`,
          badgeText: 'ENTIRE TRIBE STOPPED',
          badgeClass: 'red',
        };
        break;
      }
    }
  }

  // 3. Lock breakthrough underwater
  if (!coldOpen && result.submarine) {
    const subStages = result.submarine.stages || [];
    for (const stage of subStages) {
      for (const ts of (stage.tribeStates || [])) {
        const lockEv = (ts.events || []).find(ev => ev.type === 'lockBreakthrough' && ts.submerged?.includes(ev.actor));
        if (lockEv) {
          const pr = pronouns(lockEv.actor);
          coldOpen = {
            type: 'lockBreakthroughUnderwater',
            players: [lockEv.actor],
            text: `${lockEv.actor} was fully submerged — and still cracked the lock panel. Underwater, lungs burning, ${pr.sub} punched in the final sequence and the panel went green. The tribe went wild.`,
            badgeText: 'LOCK BREAKTHROUGH UNDERWATER',
            badgeClass: 'blue',
          };
          break;
        }
      }
      if (coldOpen) break;
    }
  }

  // 4. Straw snorkel hero
  if (!coldOpen && result.submarine) {
    const subStages = result.submarine.stages || [];
    for (const stage of subStages) {
      for (const ts of (stage.tribeStates || [])) {
        const snorkEv = (ts.events || []).find(ev => ev.type === 'strawSnorkel');
        if (snorkEv) {
          const pr = pronouns(snorkEv.actor);
          coldOpen = {
            type: 'strawSnorkelHero',
            players: [snorkEv.actor],
            text: `${snorkEv.actor} was underwater — and still contributing. A bent tube, a broken pipe fitting, and ${pr.sub} had a working snorkel. Submerged and still fighting. ${pr.Sub} bought the tribe the escape.`,
            badgeText: 'STRAW SNORKEL HERO',
            badgeClass: 'blue',
          };
          break;
        }
      }
      if (coldOpen) break;
    }
  }

  // 5. Panic drowning drags teammate
  if (!coldOpen && result.submarine) {
    const subStages = result.submarine.stages || [];
    for (const stage of subStages) {
      for (const ts of (stage.tribeStates || [])) {
        const panicEv = (ts.events || []).find(ev => ev.type === 'panicDrowning');
        if (panicEv) {
          const pr = pronouns(panicEv.actor);
          coldOpen = {
            type: 'panicDrowning',
            players: [panicEv.actor],
            text: `${panicEv.actor} panicked. Grabbed the closest person. Two went under at once. The tribe lost two escape contributors in a single moment — and ${pr.sub} had to live with that at tribal.`,
            badgeText: 'PANIC DROWNING',
            badgeClass: 'orange',
          };
          break;
        }
      }
      if (coldOpen) break;
    }
  }

  if (coldOpen) result.coldOpen = coldOpen;
}

export function _textMastersOfDisasters(ep, ln, sec) {
  const md = ep.mastersOfDisasters;
  if (!md) return;
  const host = seasonConfig.host || 'Chris';
  const eq = md.earthquake;
  const sub = md.submarine;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ── Masters of Disasters intro ────────────────────────────────────────────
  sec('Masters of Disasters');
  const introLines = [
    `${host} stands in the middle of a rigged disaster set — lava-soup nozzles overhead, a mechanical earthquake platform underfoot, and a submarine hull looming in the back. "Two phases. Two disasters. One tribe goes home soaking wet — in more ways than one."`,
    `"Welcome," ${host} announces over the PA, "to the most overengineered challenge in franchise history." The set shakes on cue. A nozzle test-fires lava-soup. Chef Hatchet grins somewhere nearby. "Masters. Of. DISASTERS."`,
    `The challenge area looks like a disaster movie set — because it is one. ${host} paces past smoking craters and half-submerged submarine props. "Two phases. Earthquake. Submarine. Survive both. Lose Phase 2 and you're heading to tribal council."`,
  ];
  ln(pick(introLines));

  // ── Phase 1: Earthquake ───────────────────────────────────────────────────
  if (eq) {
    sec('Earthquake of Inevitable Pain');
    const eqIntros = [
      `The earthquake platform fires up. Lava-soup nozzles prime. Golf-ball cannons load. Phase 1: Earthquake of Inevitable Pain — five escalating rounds of pure chaos.`,
      `Round 1 starts with Minor Tremors. Round 5 ends in Total Collapse. Between them? Lava-soup, hailstorms, falling debris, and whatever Chef Hatchet decides to throw personally.`,
      `"Move or die — metaphorically," ${host} clarifies. "Actually don't die. HR made me say that." Phase 1 begins.`,
    ];
    ln(pick(eqIntros));

    const rounds = eq.rounds || [];
    for (const rd of rounds) {
      const hazard = DISASTER_HAZARDS.find(h => h.id === rd.hazard) || { name: rd.hazard, desc: '' };
      const roundLabels = [
        `Round ${rd.num} — ${hazard.name}. ${hazard.desc}`,
        `${host} cranks the controls. Round ${rd.num}: ${hazard.name}. ${hazard.desc}`,
        `"Round ${rd.num}!" ${host} shouts. ${hazard.name}: ${hazard.desc}`,
      ];
      ln(pick(roundLabels));

      const stoppedThisRound = (rd.playerStates || []).filter(ps => ps.stopped);
      const advancedThisRound = (rd.playerStates || []).filter(ps => ps.advanced);

      // Per-player events from rp log
      const rpEvents = (eq.rp || []).filter(r => r.type === 'event');
      const roundStart = (eq.rp || []).findIndex(r => r.type === 'roundStart' && r.text?.includes(`Round ${rd.num}`));
      const nextRound = (eq.rp || []).findIndex((r, idx) => idx > roundStart && r.type === 'roundStart');
      const roundRp = (eq.rp || []).filter((r, idx) => {
        if (idx <= roundStart) return false;
        if (nextRound > 0 && idx >= nextRound) return false;
        return r.type === 'event';
      });

      // Emit 2-3 event lines per round
      const eventsToShow = roundRp.slice(0, 3);
      for (const ev of eventsToShow) {
        if (ev.text) ln(ev.text);
      }

      // Players who advanced
      if (advancedThisRound.length > 0) {
        const names = advancedThisRound.map(ps => ps.name);
        const advLines = [
          `${names.slice(0, 2).join(' and ')} push through the chaos and advance a stage.`,
          `Progress from ${names.slice(0, 2).join(' and ')} — they're gaining ground despite the carnage.`,
          `${names[0]} surges forward. ${names.length > 1 ? names[1] + ' follows.' : 'The rest struggle to keep up.'}`,
        ];
        ln(pick(advLines));
      }

      // Players who stopped this round
      for (const ps of stoppedThisRound) {
        const pr = pronouns(ps.name);
        const stopLines = [
          `${ps.name} hits the wall — fatigue overtakes ${pr.obj} and ${pr.sub} goes down. ${pr.Sub} carries a lingering injury out of Phase 1.`,
          `"${ps.name} is DOWN!" ${host} announces. The exhaustion finally wins. ${ps.name} is done for Phase 1.`,
          `${ps.name} collapses mid-run. ${pr.Sub} can't go on — out of Phase 1, and carrying damage into Phase 2.`,
        ];
        ln(pick(stopLines));
      }
    }

    // Phase 1 winner
    const eqEndLines = [
      `The shaking stops. ${eq.winner} crosses first — they've earned the escape code advantage going into Phase 2.`,
      `${host} blows the air horn. "${eq.winner} — Phase 1 is YOURS. That escape code gives you a head start in the submarine."`,
      `"Earthquake of Inevitable Pain — COMPLETE!" The winning call goes to ${eq.winner}. Escape code secured.`,
    ];
    ln(pick(eqEndLines));

    // Stopped players summary
    const stoppedAll = Object.values(ep._debugEarthquake?.playerFinal || {}).filter(s => s.stopped);
    if (stoppedAll.length > 0) {
      ln(`${stoppedAll.length} player${stoppedAll.length > 1 ? 's' : ''} couldn't finish Phase 1. They carry lingering injuries that will slow them in Phase 2.`);
    }
  }

  // ── Between Phases: Drama break ───────────────────────────────────────────
  const breakEvents = md.breakEvents || [];
  if (breakEvents.length > 0) {
    sec('Between Phases');
    const breakIntros = [
      `The earthquake platform powers down. Players stagger toward the submarine entrance, using the break to catch their breath — and settle old scores.`,
      `A short window between phases. Some players treat wounds. Others have conversations they've been putting off. Chef blames someone for breaking the earthquake rig.`,
      `The transition period between Phase 1 and Phase 2. ${seasonConfig.host || 'Chris'} films everything on his phone. The drama doesn't wait.`,
    ];
    ln(pick(breakIntros));

    const eventsToShow = breakEvents.slice(0, 4);
    for (const ev of eventsToShow) {
      if (ev.text) ln(ev.text);
    }
  }

  // ── Phase 2: Submarine ────────────────────────────────────────────────────
  if (sub) {
    sec('Sinking Submarine');
    const subIntros = [
      `The klaxon sounds. Somewhere below the platform, water begins flooding the submarine chamber. Phase 2 — Sinking Submarine — has begun.`,
      `"Welcome to Phase 2!" ${host} calls from the dry observation deck above. "The submarine is going DOWN. Crack the escape code before the water covers your head. Simple!"`,
      `The escape code panel waits behind a locked door at the far end of a flooding chamber. The water won't wait.`,
    ];
    ln(pick(subIntros));

    const stages = sub.stages || [];
    for (const stage of stages) {
      const stageDef = SUBMARINE_STAGES.find(s => s.waterPct === stage.waterPct) || { name: `Stage ${stage.num}`, desc: '', waterPct: stage.waterPct };

      const stageLines = [
        `Water level: ${stage.waterPct}%. ${stageDef.desc}`,
        `${host} reads the gauge. "${stageDef.name} level — ${stage.waterPct}% flooded." The pressure builds.`,
        `Stage ${stage.num}. ${stageDef.name}: ${stageDef.desc}`,
      ];
      ln(pick(stageLines));

      for (const ts of (stage.tribeStates || [])) {
        // Submerged players
        for (const subName of (ts.submerged || [])) {
          const pr = pronouns(subName);
          const subLines = [
            `${subName} goes under — completely submerged! ${pr.Sub} can't contribute to the escape effort.`,
            `The water swallows ${subName}. ${pr.Sub}'s out of the escape push.`,
            `"${subName} is DOWN!" ${host} announces from above. ${pr.Sub}'s underwater now.`,
          ];
          ln(pick(subLines));
        }

        // Key events: strawSnorkel, lockBreakthrough, panicDrowning hero moments
        for (const ev of (ts.events || [])) {
          if (['strawSnorkel', 'lockBreakthrough', 'panicDrowning', 'heroicDive', 'airPocket'].includes(ev.type)) {
            if (ev.text) ln(ev.text);
          }
        }
      }
    }

    // Escape winner
    const escLines = [
      `The hatch BLOWS open — ${sub.winner} has cracked the escape code! They pour through the hatch to safety.`,
      `"${sub.winner} — YOU'RE FREE!" ${host} roars as the tribe scrambles through the open hatch. They made it.`,
      `Escape code accepted. The hatch swings wide and ${sub.winner} pours through. The other tribe is still underwater.`,
    ];
    ln(pick(escLines));

    // Escape progress breakdown
    const prog = sub.escapeProgress || {};
    const progEntries = Object.entries(prog).sort((a, b) => b[1] - a[1]);
    if (progEntries.length > 1) {
      const [winner, wProg] = progEntries[0];
      const [loser, lProg] = progEntries[progEntries.length - 1];
      ln(`Final escape progress — ${winner}: ${wProg.toFixed(2)}, ${loser}: ${lProg.toFixed(2)}.`);
    }
  }

  // ── Verdict ───────────────────────────────────────────────────────────────
  sec('The Verdict');
  if (ep.winner && ep.loser) {
    const verdictLines = [
      `${ep.winner.name} wins immunity. ${ep.loser.name} is going to tribal council.`,
      `Immunity: ${ep.winner.name}. Tribal council: ${ep.loser.name}. The disaster challenge has spoken.`,
      `${host} blows the final horn. "${ep.winner.name} — safe. ${ep.loser.name} — tribal council. See you tonight."`,
    ];
    ln(pick(verdictLines));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Helpers
// ═══════════════════════════════════════════════════════════════════════════

function _mdSmallPortrait(name, size = 44) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<div style="width:${size}px;height:${size}px;flex-shrink:0;border-radius:2px;overflow:hidden;border:2px solid var(--md-smoke);box-shadow:0 2px 6px rgba(0,0,0,0.5)">
    <img src="assets/avatars/${slug}.png" width="${size}" height="${size}" style="display:block;object-fit:cover" onerror="this.style.display='none'">
  </div>`;
}

function _mdStamp(text, color = 'red') {
  const colors = { red: '#ef4444', orange: '#f97316', gold: '#eab308', green: '#22c55e', blue: '#0ea5e9', purple: '#a855f7', gray: '#6b7280' };
  const bg = colors[color] || color;
  return `<span style="display:inline-block;font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:3px;color:#fff;background:${bg};padding:2px 10px;border-radius:2px;text-transform:uppercase;box-shadow:0 2px 4px rgba(0,0,0,0.4)">${text}</span>`;
}

function _mdBadge(text, cls = 'gray') {
  const colors = { red: '#ef4444', orange: '#f97316', gold: '#eab308', green: '#22c55e', blue: '#0ea5e9', purple: '#a855f7', pink: '#ec4899', gray: '#6b7280' };
  const bg = colors[cls] || '#6b7280';
  return `<span style="display:inline-block;font-size:9px;letter-spacing:1px;color:#fff;background:${bg};padding:1px 6px;border-radius:3px;margin-right:4px;text-transform:uppercase">${text}</span>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Shell with disaster movie CSS + animations
// ═══════════════════════════════════════════════════════════════════════════

function _mdShell(content, ep, phase = 'earthquake') {
  const isEq = phase === 'earthquake' || phase === 'title';
  const isSub = phase === 'submarine';
  const bgGrad = isEq
    ? 'linear-gradient(180deg,#1a0a00 0%,#1c0800 20%,#0f0600 50%,#0a0300 85%,#050200 100%)'
    : isSub
    ? 'linear-gradient(180deg,#061926 0%,#0a1e2e 20%,#081520 50%,#040d15 85%,#020810 100%)'
    : 'linear-gradient(180deg,#0f172a 0%,#0d1321 50%,#070b14 100%)';

  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;900&display=swap');

.md-shell{
  --md-fire:#ef4444;--md-lava:#f97316;--md-ember:#fbbf24;
  --md-smoke:#78716c;--md-ash:#a8a29e;--md-ground:#92400e;
  --md-deep:#0e7490;--md-water:#22d3ee;--md-abyss:#164e63;
  --md-bubble:#93c5fd;--md-pressure:#1e3a5f;
  --md-danger:#dc2626;--md-safe:#22c55e;--md-warning:#eab308;
  font-family:'Inter',sans-serif;color:#e2e8f0;
  background:${bgGrad};
  padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
  overflow:clip;border:3px solid ${isEq ? '#7c2d12' : isSub ? '#0c4a6e' : '#1e293b'};
  box-shadow:inset 0 0 60px rgba(0,0,0,0.6),0 0 30px rgba(0,0,0,0.5);
}

/* ── Earthquake shake keyframes (escalating intensity) ── */
@keyframes md-shake-1{0%,100%{transform:translate(0)}25%{transform:translate(-2px,1px)}75%{transform:translate(2px,-1px)}}
@keyframes md-shake-2{0%,100%{transform:translate(0)}20%{transform:translate(-3px,2px)}60%{transform:translate(3px,-2px)}80%{transform:translate(-1px,3px)}}
@keyframes md-shake-3{0%,100%{transform:translate(0)}15%{transform:translate(-4px,3px)}35%{transform:translate(4px,-3px)}55%{transform:translate(-3px,4px)}85%{transform:translate(2px,-2px)}}
@keyframes md-shake-4{0%,100%{transform:translate(0)}10%{transform:translate(-5px,4px)}30%{transform:translate(5px,-4px)}50%{transform:translate(-4px,5px)}70%{transform:translate(3px,-3px)}90%{transform:translate(-2px,4px)}}
@keyframes md-shake-5{0%,100%{transform:translate(0)}8%{transform:translate(-6px,5px)}24%{transform:translate(6px,-5px)}40%{transform:translate(-5px,6px)}56%{transform:translate(4px,-4px)}72%{transform:translate(-6px,3px)}88%{transform:translate(5px,-6px)}}
.md-shake-1{animation:md-shake-1 0.4s ease infinite}
.md-shake-2{animation:md-shake-2 0.35s ease infinite}
.md-shake-3{animation:md-shake-3 0.3s ease infinite}
.md-shake-4{animation:md-shake-4 0.25s ease infinite}
.md-shake-5{animation:md-shake-5 0.2s ease infinite}

/* ── Lava drips ── */
@keyframes md-lava-fall{0%{top:-20px;opacity:0.9}100%{top:calc(100% + 20px);opacity:0}}
.md-lava-drip{position:absolute;top:-20px;width:6px;height:18px;
  background:linear-gradient(180deg,#ef4444,#f97316,#fbbf24);
  border-radius:0 0 50% 50%;opacity:0;pointer-events:none;z-index:3}
.md-lava-active .md-lava-drip{animation:md-lava-fall 2.5s ease-in infinite;opacity:1}

/* ── Debris particles ── */
@keyframes md-debris-fall{0%{top:-10px;opacity:0.7;transform:rotate(0deg)}100%{top:calc(100% + 10px);opacity:0;transform:rotate(180deg)}}
.md-debris{position:absolute;top:-10px;width:4px;height:4px;background:#78716c;opacity:0;pointer-events:none;z-index:3}
.md-debris-active .md-debris{animation:md-debris-fall 1.8s linear infinite;opacity:1}

/* ── Crack overlay ── */
.md-cracks{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:2;
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L55 80 L30 120 L45 200 L20 280 L40 400' stroke='%23451a03' stroke-width='1' fill='none'/%3E%3Cpath d='M200 0 L190 60 L210 130 L195 200 L220 300 L200 400' stroke='%23451a03' stroke-width='1' fill='none'/%3E%3Cpath d='M350 0 L340 90 L360 160 L345 250 L355 400' stroke='%23451a03' stroke-width='0.5' fill='none'/%3E%3C/svg%3E");
  background-size:100% 100%;opacity:0;transition:opacity 0.5s}

/* ── Seismograph line ── */
@keyframes md-seismo-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.md-seismo-line{overflow:hidden;height:24px;background:rgba(0,0,0,0.4);border-radius:3px;position:relative}
.md-seismo-line svg{animation:md-seismo-scroll 4s linear infinite}

/* ── Rising water ── */
.md-water-overlay{position:absolute;bottom:0;left:0;right:0;z-index:2;pointer-events:none;
  background:linear-gradient(0deg,rgba(14,116,144,0.55),rgba(14,116,144,0.3),rgba(14,116,144,0.1),transparent);
  transition:height 1.2s ease-in;height:0}

/* ── Bubbles ── */
@keyframes md-bubble-rise{0%{bottom:-10px;opacity:0.5;transform:translateX(0)}50%{transform:translateX(8px)}100%{bottom:calc(100% + 10px);opacity:0;transform:translateX(-4px)}}
.md-bubble{position:absolute;width:5px;height:5px;border-radius:50%;
  background:rgba(147,197,253,0.3);border:1px solid rgba(147,197,253,0.15);
  opacity:0;pointer-events:none;z-index:3}
.md-bubbles-active .md-bubble{animation:md-bubble-rise 3.5s ease-in infinite;opacity:1}

/* ── Underwater blur ── */
.md-blur-1{filter:blur(0.3px)}.md-blur-2{filter:blur(0.6px)}.md-blur-3{filter:blur(1px)}

/* ── Layout ── */
.md-layout{display:flex;gap:14px;align-items:flex-start;padding:14px;position:relative;z-index:6}
.md-feed{flex:1;min-width:0}
.md-sidebar{width:260px;flex-shrink:0;position:sticky;top:0;max-height:100vh;overflow-y:auto;align-self:flex-start;
  scrollbar-width:thin;scrollbar-color:rgba(249,115,22,0.25) transparent;
  background:linear-gradient(180deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95));
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  border:1px solid ${isEq ? 'rgba(249,115,22,0.15)' : 'rgba(14,116,144,0.15)'};border-radius:4px;padding:12px;
  box-shadow:inset 0 0 20px rgba(0,0,0,0.4)}

/* ── HUD bar ── */
.md-hud{display:flex;gap:2px;margin:0 14px 2px;position:relative;z-index:6}
.md-hud-cell{flex:1;background:rgba(0,0,0,0.5);border:1px solid ${isEq ? 'rgba(249,115,22,0.12)' : 'rgba(14,116,144,0.12)'};
  padding:8px 4px;text-align:center}
.md-hud-cell:first-child{border-radius:4px 0 0 4px}.md-hud-cell:last-child{border-radius:0 4px 4px 0}
.md-hud-val{font-family:'Bebas Neue',sans-serif;font-size:20px;font-weight:700;color:${isEq ? 'var(--md-ember)' : 'var(--md-water)'};
  text-shadow:0 0 8px ${isEq ? 'rgba(251,191,36,0.3)' : 'rgba(34,211,238,0.3)'}}
.md-hud-lbl{font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-top:2px;text-transform:uppercase}

/* ── Header ── */
.md-header{background:linear-gradient(180deg,${isEq ? '#1e0c00' : isSub ? '#061520' : '#1e293b'} 0%,${isEq ? '#0f0600' : isSub ? '#040d15' : '#0f172a'} 100%);
  padding:14px 20px;display:flex;align-items:center;justify-content:space-between;
  border-bottom:2px solid ${isEq ? 'var(--md-lava)' : isSub ? 'var(--md-deep)' : '#334155'};position:relative;z-index:6;
  box-shadow:inset 0 -2px 8px rgba(0,0,0,0.5),0 2px 10px rgba(0,0,0,0.4)}
.md-title{font-family:'Bebas Neue',sans-serif;font-size:18px;color:${isEq ? 'var(--md-ember)' : isSub ? 'var(--md-water)' : 'var(--md-ash)'};
  letter-spacing:3px}
.md-subtitle{font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:4px;text-transform:uppercase;margin-top:2px}

/* ── Event card ── */
.md-ev{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;margin-bottom:6px;
  background:rgba(0,0,0,0.3);border-left:3px solid ${isEq ? 'rgba(249,115,22,0.3)' : 'rgba(14,116,144,0.3)'};
  border-radius:0 4px 4px 0;transition:background 0.3s,border-color 0.3s}
.md-ev.round-header{background:rgba(0,0,0,0.5);border-left-color:${isEq ? 'var(--md-lava)' : 'var(--md-deep)'};margin-top:12px}
.md-ev.positive{border-left-color:var(--md-safe)}.md-ev.negative{border-left-color:var(--md-danger)}
.md-ev-text{font-size:13px;color:rgba(255,255,255,0.85);line-height:1.6}
.md-ev-badge{display:inline-block;font-size:9px;letter-spacing:1px;padding:1px 6px;border-radius:3px;
  margin-bottom:4px;text-transform:uppercase}
.md-ev-badge.orange{background:rgba(249,115,22,0.15);color:#fb923c;border:1px solid rgba(249,115,22,0.2)}
.md-ev-badge.red{background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.2)}
.md-ev-badge.green{background:rgba(34,197,94,0.15);color:#86efac;border:1px solid rgba(34,197,94,0.2)}
.md-ev-badge.blue{background:rgba(14,165,233,0.15);color:#7dd3fc;border:1px solid rgba(14,165,233,0.2)}
.md-ev-badge.gold{background:rgba(234,179,8,0.15);color:#fde68a;border:1px solid rgba(234,179,8,0.2)}
.md-ev-badge.purple{background:rgba(168,85,247,0.15);color:#c4b5fd;border:1px solid rgba(168,85,247,0.2)}
.md-ev-badge.pink{background:rgba(236,72,153,0.15);color:#f9a8d4;border:1px solid rgba(236,72,153,0.2)}
.md-ev-badge.gray{background:rgba(107,114,128,0.15);color:#9ca3af;border:1px solid rgba(107,114,128,0.2)}

/* ── Sidebar sections ── */
.md-side-sec{font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:3px;
  color:${isEq ? 'var(--md-lava)' : 'var(--md-deep)'};margin:10px 0 6px;
  border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:4px}
.md-side-row{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;color:rgba(255,255,255,0.7)}
.md-side-bar{flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden}
.md-side-fill{height:100%;border-radius:3px;transition:width 0.4s}

/* ── Controls ── */
.md-btn-next{background:${isEq ? 'linear-gradient(135deg,#b45309,#92400e)' : 'linear-gradient(135deg,#0e7490,#164e63)'};
  color:#fff;border:none;padding:8px 20px;font-family:'Bebas Neue',sans-serif;font-size:14px;
  letter-spacing:3px;border-radius:4px;cursor:pointer;
  box-shadow:0 4px 12px ${isEq ? 'rgba(180,83,9,0.4)' : 'rgba(14,116,144,0.4)'};transition:transform 0.1s}
.md-btn-next:hover{transform:scale(1.03)}
.md-btn-all{background:transparent;color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.1);
  padding:6px 14px;font-size:10px;letter-spacing:2px;border-radius:4px;cursor:pointer;margin-left:8px}

/* ── Depth gauge (submarine sidebar) ── */
.md-depth-gauge{width:100%;height:16px;background:rgba(0,0,0,0.4);border-radius:3px;overflow:hidden;
  border:1px solid rgba(14,116,144,0.2);position:relative}
.md-depth-fill{height:100%;background:linear-gradient(90deg,var(--md-deep),var(--md-water));
  border-radius:3px;transition:width 0.8s ease-in}
.md-depth-label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.6);text-transform:uppercase}

/* ── Fatigue / progress bars ── */
.md-fat-bar{width:100%;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-top:2px}
.md-fat-fill{height:100%;border-radius:3px;transition:width 0.4s}
.md-stage-bar{display:flex;gap:2px;margin-top:3px}
.md-stage-pip{width:12px;height:5px;border-radius:1px;background:rgba(255,255,255,0.08);transition:background 0.3s}
.md-stage-pip.filled{background:var(--md-ember)}
.md-stage-pip.stopped{background:var(--md-danger)}

/* ── Stopped / submerged stamps ── */
.md-stamp-stopped{display:inline-block;font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:3px;
  color:#fff;background:var(--md-danger);padding:2px 10px;border-radius:2px;
  transform:rotate(-3deg);box-shadow:0 2px 6px rgba(220,38,38,0.4)}
.md-stamp-submerged{display:inline-block;font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:3px;
  color:#fff;background:var(--md-deep);padding:2px 10px;border-radius:2px;
  transform:rotate(-2deg);box-shadow:0 2px 6px rgba(14,116,144,0.4)}

/* ── Reduced motion ── */
@media(prefers-reduced-motion:reduce){
  .md-shake-1,.md-shake-2,.md-shake-3,.md-shake-4,.md-shake-5{animation:none!important}
  .md-lava-drip,.md-debris,.md-bubble{animation:none!important;opacity:0!important}
  .md-seismo-line svg{animation:none!important}
  .md-water-overlay{transition:none!important}
}
</style>
<div class="md-shell">
  ${content}
</div>`;
}

// Build lava drip elements (positioned at various left% values)
function _mdLavaDrips(count = 8) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = 5 + (i * (90 / count)) + Math.floor(Math.random() * 8);
    const delay = (Math.random() * 2).toFixed(1);
    const h = 14 + Math.floor(Math.random() * 10);
    html += `<div class="md-lava-drip" style="left:${left}%;animation-delay:${delay}s;height:${h}px"></div>`;
  }
  return html;
}

// Build debris elements
function _mdDebris(count = 12) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.floor(Math.random() * 95);
    const delay = (Math.random() * 1.5).toFixed(1);
    const size = 3 + Math.floor(Math.random() * 4);
    const rot = Math.floor(Math.random() * 45);
    html += `<div class="md-debris" style="left:${left}%;animation-delay:${delay}s;width:${size}px;height:${size}px;transform:rotate(${rot}deg)"></div>`;
  }
  return html;
}

// Build bubble elements
function _mdBubbles(count = 15) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.floor(Math.random() * 95);
    const delay = (Math.random() * 3).toFixed(1);
    const size = 3 + Math.floor(Math.random() * 5);
    html += `<div class="md-bubble" style="left:${left}%;animation-delay:${delay}s;width:${size}px;height:${size}px"></div>`;
  }
  return html;
}

// Seismograph SVG line
function _mdSeismograph(intensity = 1) {
  const amp = 3 + intensity * 2;
  const freq = 8 - intensity;
  let path = 'M0,12';
  for (let x = 0; x < 400; x += 2) {
    const y = 12 + Math.sin(x / freq) * amp * (0.5 + Math.random() * 0.5) * (Math.random() > 0.85 ? 2 : 1);
    path += ` L${x},${y.toFixed(1)}`;
  }
  return `<div class="md-seismo-line"><svg viewBox="0 0 400 24" width="800" height="24" style="display:block"><path d="${path}" fill="none" stroke="${intensity >= 4 ? '#ef4444' : intensity >= 2 ? '#f97316' : '#fbbf24'}" stroke-width="1.5"/></svg></div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Earthquake sidebar builder (extracted for live updates)
// ═══════════════════════════════════════════════════════════════════════════

function _mdBuildEarthquakeSidebar(eq, revIdx, tribeNames, ep) {
  if (!eq) return '';
  const rounds = eq.rounds || [];
  const visibleRounds = rounds.filter((_, i) => i <= revIdx);

  // Compute latest player states from visible rounds
  const playerState = {};
  for (const rd of visibleRounds) {
    for (const ps of (rd.playerStates || [])) {
      playerState[ps.name] = ps;
    }
    // Apply timeout data from last visible round
    if (rd.timedOut) {
      for (const to of rd.timedOut) {
        if (playerState[to.name]) {
          playerState[to.name].stopped = true;
          playerState[to.name].timedOut = true;
        }
      }
    }
  }

  let html = '';
  for (const tName of tribeNames) {
    const tribeMembers = Object.entries(playerState).filter(([, s]) => s.tribe === tName);
    if (!tribeMembers.length) continue;

    html += `<div class="md-side-sec">${tName}</div>`;
    for (const [name, s] of tribeMembers) {
      const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
      const st = pStats(name);
      const fatPct = Math.min(100, Math.round((s.fatigue / Math.max(1, st.endurance)) * 100));
      const stagePips = Array.from({ length: 5 }, (_, i) =>
        `<div class="md-stage-pip ${s.stopped ? (i < s.stage ? 'stopped' : '') : (i < s.stage ? 'filled' : '')}"></div>`
      ).join('');

      html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0">
        <img src="assets/avatars/${slug}.png" width="28" height="28" style="border-radius:2px;border:1px solid ${s.stopped ? '#ef4444' : '#334155'}" onerror="this.style.display='none'">
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:10px;color:${s.stopped ? '#fca5a5' : 'rgba(255,255,255,0.8)'}${s.stopped ? ';text-decoration:line-through' : ''}">${name}</span>
            ${s.stage >= 5 ? '<span style="font-size:8px;color:#fbbf24;letter-spacing:1px">🏁 FINISHED</span>' : s.timedOut ? '<span style="font-size:8px;color:#f97316;letter-spacing:1px">⏱️ TIMED OUT</span>' : s.stopped ? '<span style="font-size:8px;color:#ef4444;letter-spacing:1px">STOPPED</span>' : ''}
          </div>
          <div class="md-stage-bar">${stagePips}</div>
          <div class="md-fat-bar"><div class="md-fat-fill" style="width:${100 - fatPct}%;background:${fatPct > 75 ? '#ef4444' : fatPct > 50 ? '#f97316' : '#22c55e'}"></div></div>
        </div>
      </div>`;
    }

    // Tribe total stages
    const totalStages = tribeMembers.reduce((s, [, ps]) => s + ps.stage, 0);
    const maxStages = tribeMembers.length * 5;
    html += `<div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.35);margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.05)">
      <span>Progress</span><span>${totalStages}/${maxStages} stages</span>
    </div>`;
  }
  return html;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Submarine sidebar builder (extracted for live updates)
// ═══════════════════════════════════════════════════════════════════════════

function _mdBuildSubmarineSidebar(sub, revIdx, tribeNames, ep) {
  if (!sub) return '';
  const stages = sub.stages || [];
  const visibleStages = stages.filter((_, i) => i <= revIdx);
  const escProg = sub.escapeProgress || {};

  // Compute latest tribe states from visible stages
  const tribeState = {};
  for (const st of visibleStages) {
    for (const ts of (st.tribeStates || [])) {
      tribeState[ts.tribe] = ts;
    }
  }

  const lastStage = visibleStages[visibleStages.length - 1];
  const waterPct = lastStage?.waterPct || 0;

  let html = '';

  // Depth gauge
  html += `<div class="md-side-sec">DEPTH</div>`;
  html += `<div class="md-depth-gauge">
    <div class="md-depth-fill" style="width:${waterPct}%"></div>
    <div class="md-depth-label">${waterPct}% FLOODED</div>
  </div>`;

  // Per-tribe escape progress + survivors
  for (const tName of tribeNames) {
    html += `<div class="md-side-sec">${tName}</div>`;
    const ts = tribeState[tName];
    const surv = ts?.surviving || [];
    const sub_list = ts?.submerged || [];

    // Escape progress bar
    const maxEsc = 1.5;
    const prog = escProg[tName] || 0;
    const cumProg = visibleStages.reduce((s, st) => {
      const found = st.tribeStates?.find(t => t.tribe === tName);
      return s + (found?.escapeProgress || 0);
    }, 0);
    const progPct = Math.min(100, Math.round((cumProg / maxEsc) * 100));

    html += `<div style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;font-size:9px;color:rgba(255,255,255,0.5)">
        <span>Escape</span><span>${cumProg.toFixed(2)} / ${maxEsc.toFixed(2)}</span>
      </div>
      <div class="md-side-bar"><div class="md-side-fill" style="width:${progPct}%;background:${prog >= maxEsc ? '#22c55e' : '#0ea5e9'}"></div></div>
    </div>`;

    // Surviving
    if (surv.length) {
      html += `<div style="font-size:9px;color:rgba(255,255,255,0.35);margin-bottom:3px">SURVIVING (${surv.length})</div>`;
      html += `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:6px">`;
      for (const name of surv) {
        const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
        html += `<img src="assets/avatars/${slug}.png" width="24" height="24" title="${name}" style="border-radius:2px;border:1px solid rgba(34,211,238,0.3)" onerror="this.style.display='none'">`;
      }
      html += `</div>`;
    }
    // Submerged
    if (sub_list.length) {
      html += `<div style="font-size:9px;color:#fca5a5;margin-bottom:3px">SUBMERGED (${sub_list.length})</div>`;
      html += `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:6px">`;
      for (const name of sub_list) {
        const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
        html += `<img src="assets/avatars/${slug}.png" width="24" height="24" title="${name}" style="border-radius:2px;border:1px solid rgba(239,68,68,0.3);opacity:0.5;filter:saturate(0.4)" onerror="this.style.display='none'">`;
      }
      html += `</div>`;
    }
  }
  return html;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Title Card
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildMastersOfDisastersTitleCard(ep) {
  if (!ep.mastersOfDisasters) return '';
  const md = ep.mastersOfDisasters;
  const tribeNames = Object.keys(md.tribeScores || {});
  const host = seasonConfig.host || 'Chris';

  const quotes = [
    `"Welcome to Masters of Disasters! Two phases. Two ways to die. One way to win."`,
    `"Phase One: Earthquake of Inevitable Pain. Phase Two: Sinking Submarine. First tribe out wins. Last tribe drowns — metaphorically. Maybe."`,
    `"Today's challenge has earthquakes, lava, flooding, and at least one mechanical shark. You're welcome."`,
  ];
  const quote = quotes[(ep.num || 0) % quotes.length];

  return _mdShell(`
    <div style="text-align:center;padding:50px 20px 80px;position:relative;z-index:6;">

      <!-- Split fire/water background -->
      <div style="position:absolute;top:0;left:0;right:50%;bottom:0;background:linear-gradient(135deg,rgba(239,68,68,0.06),rgba(249,115,22,0.04),transparent);pointer-events:none;z-index:0"></div>
      <div style="position:absolute;top:0;left:50%;right:0;bottom:0;background:linear-gradient(225deg,rgba(14,116,144,0.06),rgba(34,211,238,0.04),transparent);pointer-events:none;z-index:0"></div>

      <div style="font-family:'Inter',sans-serif;font-size:11px;letter-spacing:4px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:12px;position:relative">${host} Presents</div>

      <div style="font-family:'Bebas Neue',sans-serif;font-size:48px;color:var(--md-ember);text-shadow:3px 3px 0 rgba(0,0,0,0.6),0 0 40px rgba(251,191,36,0.2);letter-spacing:6px;line-height:1;margin-bottom:6px;position:relative">MASTERS OF<br>DISASTERS</div>

      <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:8px;margin-bottom:24px;position:relative">
        <span style="color:var(--md-fire)">QUAKE</span>
        <span style="color:rgba(255,255,255,0.2);margin:0 4px">&middot;</span>
        <span style="color:var(--md-water)">FLOOD</span>
        <span style="color:rgba(255,255,255,0.2);margin:0 4px">&middot;</span>
        <span style="color:var(--md-safe)">SURVIVE</span>
      </div>

      <div style="display:inline-block;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(249,115,22,0.12);border-radius:8px;padding:14px 24px;margin-bottom:24px;position:relative">
        <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:8px">Briefing</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.7;font-style:italic;max-width:500px">${host}: ${quote}</div>
      </div>

      <div style="display:flex;gap:20px;justify-content:center;margin-bottom:20px;flex-wrap:wrap;position:relative">
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);border-radius:6px;padding:12px 20px;text-align:center">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:10px;letter-spacing:3px;color:var(--md-fire)">PHASE 1</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px">Earthquake</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:2px">5 disaster zones</div>
        </div>
        <div style="background:rgba(14,116,144,0.08);border:1px solid rgba(14,116,144,0.15);border-radius:6px;padding:12px 20px;text-align:center">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:10px;letter-spacing:3px;color:var(--md-water)">PHASE 2</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px">Submarine</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:2px">Escape the flood</div>
        </div>
      </div>

      <div style="display:flex;gap:20px;justify-content:center;font-size:11px;color:rgba(255,255,255,0.4);flex-wrap:wrap;position:relative">
        ${tribeNames.map(t => `<span>${t}</span>`).join('')}
        <span>2 Phases</span>
      </div>
    </div>

    <!-- lava drips for title card ambiance -->
    ${_mdLavaDrips(6)}
  `, ep, 'title');
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Earthquake Phase (click-to-reveal per round)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildMastersOfDisastersEarthquake(ep) {
  const md = ep.mastersOfDisasters;
  if (!md?.earthquake) return '';
  const eq = md.earthquake;
  const rounds = eq.rounds || [];
  const tribeNames = Object.keys(md.tribeScores || {});

  if (!window._tvState) window._tvState = {};
  if (!window._tvState['md-eq']) window._tvState['md-eq'] = { idx: -1 };
  const revIdx = window._tvState['md-eq'].idx;

  const totalSteps = rounds.length;

  // Rules box
  let feed = `<div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:6px;padding:12px 16px;margin-bottom:12px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:10px;letter-spacing:3px;color:rgba(249,115,22,0.5);margin-bottom:6px">PHASE RULES</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7">Race through 5 disaster zones. Pass the stat check to advance a stage. Fail and you're stuck &mdash; plus fatigue builds. When fatigue exceeds endurance, you STOP. First tribe with all members across wins the escape code for Phase 2.</div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(249,115,22,0.1);color:#fb923c;border:1px solid rgba(249,115,22,0.15)">5 ROUNDS</span>
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(239,68,68,0.1);color:#fca5a5;border:1px solid rgba(239,68,68,0.15)">FATIGUE = DANGER</span>
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(34,197,94,0.1);color:#86efac;border:1px solid rgba(34,197,94,0.15)">ADVANCE = PROGRESS</span>
    </div>
  </div>`;

  // Build round steps
  for (let ri = 0; ri < rounds.length; ri++) {
    const rd = rounds[ri];
    const hazard = DISASTER_HAZARDS.find(h => h.id === rd.hazard) || { name: rd.hazard, desc: '' };
    const shakeClass = `md-shake-${Math.min(5, ri + 1)}`;
    const showLava = ri >= 1;
    const showDebris = ri >= 2;
    const crackOpacity = Math.min(0.3, ri * 0.08);

    let roundHtml = `<div class="${ri <= revIdx ? shakeClass : ''}" style="position:relative">`;

    // Crack overlay per round
    if (crackOpacity > 0) {
      roundHtml += `<div class="md-cracks" style="opacity:${crackOpacity}"></div>`;
    }

    // Round header
    roundHtml += `<div class="md-ev round-header"><div style="flex:1;text-align:center">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--md-ember);letter-spacing:3px">ROUND ${rd.num}</div>
      <div style="font-size:11px;color:var(--md-lava);margin-top:2px">${hazard.name}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">${hazard.desc}</div>
    </div></div>`;

    // Player cards for this round
    for (const ps of (rd.playerStates || [])) {
      const evTypes = ps.events || [];
      const heroic = evTypes.some(e => ['heroicSprint', 'shieldTeammate', 'carryInjured', 'surfShockwave', 'findShortcut', 'debrisDodge', 'dodgeLava', 'adrenalineSurge'].includes(e));
      const negative = evTypes.some(e => ['lavaBurn', 'rockTrip', 'golfBallHit', 'panicFreeze', 'chefTargets', 'ceilingCollapse'].includes(e));
      const evClass = ps.stopped ? 'negative' : heroic ? 'positive' : negative ? 'negative' : '';

      // Get event text from rp array
      const rpEvents = (eq.rp || []).filter(r => r.type === 'event' && r.player === ps.name);
      // Find the ones from this round (approximate by matching round index)
      const roundRpStart = (eq.rp || []).findIndex(r => r.type === 'roundStart' && r.text?.includes(`Round ${rd.num}`));
      const nextRoundStart = (eq.rp || []).findIndex((r, idx) => idx > roundRpStart && r.type === 'roundStart');
      const roundRp = (eq.rp || []).filter((r, idx) => {
        if (idx <= roundRpStart) return false;
        if (nextRoundStart > 0 && idx >= nextRoundStart) return false;
        return r.player === ps.name && r.type === 'event';
      });

      const st = pStats(ps.name);
      const fatPct = Math.min(100, Math.round((ps.fatigue / Math.max(1, st.endurance)) * 100));

      roundHtml += `<div class="md-ev ${evClass}">
        ${_mdSmallPortrait(ps.name, 40)}
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600;color:${ps.stopped ? '#fca5a5' : 'rgba(255,255,255,0.9)'}">${ps.name}</span>
            <span style="font-size:9px;color:rgba(255,255,255,0.35)">${ps.tribe}</span>
          </div>
          ${roundRp.map(r => `<div class="md-ev-text" style="margin-bottom:2px">${r.text}</div>`).join('')}
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap">
            ${ps.stage >= 5
              ? `<span style="font-size:9px;color:#fbbf24;border:1px solid rgba(251,191,36,0.3);padding:1px 6px;border-radius:3px;font-weight:700">🏁 FINISHED</span>`
              : ps.advanced ? `<span style="font-size:9px;color:#86efac;border:1px solid rgba(34,197,94,0.2);padding:1px 6px;border-radius:3px">ADVANCED to Stage ${ps.stage}</span>`
              : `<span style="font-size:9px;color:rgba(255,255,255,0.35)">Stage ${ps.stage}/5</span>`}
            <div style="display:flex;align-items:center;gap:4px;flex:1;min-width:80px">
              <span style="font-size:8px;color:${fatPct > 75 ? '#fca5a5' : 'rgba(255,255,255,0.3)'}">FATIGUE</span>
              <div class="md-fat-bar" style="flex:1"><div class="md-fat-fill" style="width:${fatPct}%;background:${fatPct > 75 ? '#ef4444' : fatPct > 50 ? '#f97316' : '#fbbf24'}"></div></div>
            </div>
            ${ps.stopped ? '<span class="md-stamp-stopped">STOPPED</span>' : ''}
          </div>
        </div>
      </div>`;
    }

    // Timeout cards — show on last round
    if (rd.timedOut?.length) {
      for (const to of rd.timedOut) {
        const slug = players.find(p => p.name === to.name)?.slug || to.name.toLowerCase().replace(/\s+/g, '-');
        roundHtml += `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;margin:4px 0;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-left:4px solid var(--md-danger);border-radius:4px">
          <img src="assets/avatars/${slug}.png" width="36" height="36" style="border-radius:2px;border:2px solid var(--md-danger);filter:grayscale(0.5)" onerror="this.style.display='none'">
          <div style="flex:1;min-width:0">
            <div style="font-size:9px;color:#fca5a5;letter-spacing:1px;font-family:'Bebas Neue',sans-serif">⏱️ TIMED OUT</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7)">${to.name} couldn't make it across in time. Stopped at stage ${to.stage}/5.</div>
          </div>
        </div>`;
      }
    }

    // Lava drips and debris (round-dependent)
    if (showLava) roundHtml += `<div class="md-lava-active" style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden">${_mdLavaDrips(4 + ri)}</div>`;
    if (showDebris) roundHtml += `<div class="md-debris-active" style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden">${_mdDebris(6 + ri * 2)}</div>`;

    roundHtml += `</div>`;

    feed += `<div id="md-step-eq-${ri}" style="${ri <= revIdx ? '' : 'display:none'}">${roundHtml}</div>`;
  }

  // Controls
  feed += `<div id="md-controls-eq" style="display:flex;gap:8px;justify-content:center;padding:16px 0;${revIdx >= totalSteps - 1 ? 'display:none' : ''}">
    <button class="md-btn-next" onclick="mastersOfDisastersRevealNext('md-eq',${totalSteps})">NEXT ROUND</button>
    <button class="md-btn-all" onclick="mastersOfDisastersRevealAll('md-eq',${totalSteps})">REVEAL ALL</button>
  </div>`;

  // Done box
  const eqWinner = eq.winner || '';
  feed += `<div id="md-done-eq" style="${revIdx >= totalSteps - 1 ? '' : 'display:none'};text-align:center;padding:16px;background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);border-radius:6px;margin-top:12px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--md-ember);letter-spacing:4px">EARTHQUAKE COMPLETE</div>
    ${eqWinner ? `<div style="font-size:13px;color:var(--md-lava);margin-top:6px">${eqWinner} conquers Phase 1 &mdash; escape code advantage earned!</div>` : ''}
  </div>`;

  // HUD
  const currentRound = Math.min(revIdx + 1, rounds.length);
  const hud = `<div class="md-hud">
    <div class="md-hud-cell"><div class="md-hud-val">${currentRound > 0 ? currentRound : '-'}</div><div class="md-hud-lbl">Round</div></div>
    <div class="md-hud-cell"><div class="md-hud-val">${rounds.length}</div><div class="md-hud-lbl">Total</div></div>
    <div class="md-hud-cell" style="flex:2"><div style="padding-top:4px">${_mdSeismograph(currentRound)}</div><div class="md-hud-lbl">Seismograph</div></div>
  </div>`;

  // Sidebar
  const sidebarContent = _mdBuildEarthquakeSidebar(eq, revIdx, tribeNames, ep);
  const sidebar = `<div class="md-sidebar" id="md-sidebar-eq">${sidebarContent}</div>`;

  return _mdShell(`
    <div class="md-header">
      <div><div class="md-title">EARTHQUAKE OF INEVITABLE PAIN</div><div class="md-subtitle">Phase 1</div></div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:2px;color:var(--md-lava)">5 DISASTER ZONES</div>
    </div>
    ${hud}
    <div class="md-layout">
      <div class="md-feed">${feed}</div>
      ${sidebar}
    </div>
  `, ep, 'earthquake');
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Drama Break (show all at once)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildMastersOfDisastersDramaBreak(ep) {
  const md = ep.mastersOfDisasters;
  if (!md) return '';
  const events = md.breakEvents || [];
  if (!events.length) return '';

  const host = seasonConfig.host || 'Chris';

  const impactMap = {
    injuryAftermath:    { impact: 'Bond formed', color: '#fca5a5' },
    chefBlame:          { impact: 'Heat generated', color: '#fdba74' },
    allianceInCrisis:   { impact: 'Bond damaged', color: '#fca5a5' },
    secretReveal:       { impact: 'Bond deepened', color: '#c4b5fd' },
    quitConsideration:  { impact: 'Bond formed', color: '#94a3b8' },
    heroicRecognition:  { impact: 'Bond + popularity boost', color: '#86efac' },
    bethBoyfriendClaim: { impact: 'Comedy moment', color: '#f9a8d4' },
    panicBonding:       { impact: 'Bond deepened', color: '#93c5fd' },
  };

  let feed = '';
  for (const evt of events) {
    const firstPlayer = (evt.players || [])[0];
    const imp = impactMap[evt.eventType] || { impact: '', color: '#6b7280' };
    feed += `<div class="md-ev" style="border-left-color:${imp.color}">
      ${firstPlayer ? _mdSmallPortrait(firstPlayer, 44) : ''}
      <div style="flex:1;min-width:0">
        ${_mdBadge(evt.badgeText || 'DRAMA', evt.badgeClass || 'gray')}
        <div class="md-ev-text">${evt.text || ''}</div>
        ${imp.impact ? `<div style="display:flex;align-items:center;gap:4px;margin-top:6px;font-size:10px;color:${imp.color}">${imp.impact}</div>` : ''}
        ${(evt.players || []).length > 1 ? `<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">${evt.players.slice(1).map(n => {
          const s = players.find(p => p.name === n)?.slug || n.toLowerCase().replace(/\s+/g, '-');
          return `<img src="assets/avatars/${s}.png" width="24" height="24" style="border-radius:2px;border:1px solid #334155" title="${n}" onerror="this.style.display='none'">`;
        }).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  const breakIntro = `<div style="background:rgba(0,0,0,0.5);border:1px solid rgba(148,163,184,0.15);border-radius:6px;padding:12px 16px;margin-bottom:12px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:10px;letter-spacing:3px;color:rgba(148,163,184,0.5);margin-bottom:6px">BETWEEN PHASES</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7">While ${host} resets the set for Phase 2, the survivors regroup. Injuries sting. Alliances crack. Someone says something they shouldn't.</div>
  </div>`;

  return _mdShell(`
    <div class="md-header">
      <div><div class="md-title" style="color:var(--md-ash)">DRAMA BREAK</div><div class="md-subtitle">Between Phases</div></div>
    </div>
    <div style="padding:14px;position:relative;z-index:6">
      ${breakIntro}
      ${feed}
    </div>
  `, ep, 'drama');
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Submarine Phase (click-to-reveal per stage) — THE BIG VISUAL MOMENT
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildMastersOfDisastersSubmarine(ep) {
  const md = ep.mastersOfDisasters;
  if (!md?.submarine) return '';
  const sub = md.submarine;
  const stages = sub.stages || [];
  const tribeNames = Object.keys(md.tribeScores || {});

  if (!window._tvState) window._tvState = {};
  if (!window._tvState['md-sub']) window._tvState['md-sub'] = { idx: -1 };
  const revIdx = window._tvState['md-sub'].idx;

  const totalSteps = stages.length;

  // Rules box
  let feed = `<div style="background:rgba(14,116,144,0.05);border:1px solid rgba(14,116,144,0.2);border-radius:6px;padding:12px 16px;margin-bottom:12px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:10px;letter-spacing:3px;color:rgba(14,116,144,0.5);margin-bottom:6px">PHASE RULES</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7">Water rises each stage. Fail the survival check and you're SUBMERGED &mdash; unable to help escape. Surviving members work the lock panel. First tribe to crack the escape code wins immunity. The Phase 1 winner has a head start on the code.</div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(14,116,144,0.1);color:#7dd3fc;border:1px solid rgba(14,116,144,0.15)">4 WATER STAGES</span>
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(239,68,68,0.1);color:#fca5a5;border:1px solid rgba(239,68,68,0.15)">SUBMERGE = OUT</span>
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(34,197,94,0.1);color:#86efac;border:1px solid rgba(34,197,94,0.15)">ESCAPE = WIN</span>
    </div>
  </div>`;

  // Build stage steps
  const stageNames = ['ANKLES', 'WAIST', 'CHEST', 'OVERHEAD'];
  const waterHeights = [25, 50, 75, 100];

  for (let si = 0; si < stages.length; si++) {
    const st = stages[si];
    const waterH = waterHeights[si] || 25;
    const blurClass = si >= 3 ? 'md-blur-3' : si >= 2 ? 'md-blur-2' : si >= 1 ? 'md-blur-1' : '';
    const bubbleCount = 5 + si * 4;

    let stageHtml = `<div style="position:relative">`;

    // Stage header
    stageHtml += `<div class="md-ev round-header"><div style="flex:1;text-align:center">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--md-water);letter-spacing:3px">STAGE ${st.num} &mdash; ${stageNames[si] || 'DEEP'}</div>
      <div style="font-size:11px;color:rgba(34,211,238,0.6);margin-top:2px">Water Level: ${st.waterPct}%</div>
    </div></div>`;

    // Per-tribe results
    for (const ts of (st.tribeStates || [])) {
      stageHtml += `<div class="md-ev" style="border-left-color:rgba(14,116,144,0.4)">
        <div style="flex:1;min-width:0">
          <div class="md-ev-badge blue">${ts.tribe}</div>`;

      // Surviving list
      if (ts.surviving.length) {
        stageHtml += `<div style="display:flex;gap:4px;margin:6px 0;flex-wrap:wrap">`;
        for (const name of ts.surviving) {
          stageHtml += `<div style="text-align:center">${_mdSmallPortrait(name, 32)}<div style="font-size:8px;color:rgba(255,255,255,0.5);margin-top:2px">${name.split(' ')[0]}</div></div>`;
        }
        stageHtml += `</div>`;
      }

      // Submerged
      if (ts.submerged.length) {
        stageHtml += `<div style="margin:6px 0"><span style="font-size:9px;color:#fca5a5">SUBMERGED:</span> <span style="font-size:10px;color:rgba(255,255,255,0.5)">${ts.submerged.join(', ')}</span></div>`;
        for (const name of ts.submerged) {
          // Only show stamp for newly submerged (check if they weren't submerged in previous stage)
          const prevStage = si > 0 ? stages[si - 1].tribeStates?.find(t => t.tribe === ts.tribe) : null;
          const wasSubmerged = prevStage?.submerged?.includes(name);
          if (!wasSubmerged) {
            stageHtml += `<div style="margin:4px 0"><span class="md-stamp-submerged">SUBMERGED</span> <span style="font-size:11px;color:rgba(255,255,255,0.6);margin-left:4px">${name}</span></div>`;
          }
        }
      }

      // Events
      for (const evt of (ts.events || [])) {
        // Get text from submarine rp
        const rpEvt = (sub.rp || []).find(r => r.type === 'event' && r.eventType === evt.type && r.tribe === ts.tribe);
        const evText = rpEvt?.text || evt.text || evt.type;
        const isPositive = (evt.progressDelta || 0) > 0;
        const isNegative = (evt.progressDelta || 0) < 0;
        stageHtml += `<div class="md-ev ${isPositive ? 'positive' : isNegative ? 'negative' : ''}" style="margin:4px 0;padding:6px 10px">
          <div style="flex:1;min-width:0">
            <div class="md-ev-badge ${isPositive ? 'green' : isNegative ? 'red' : 'blue'}">${(evt.type || '').replace(/([A-Z])/g, ' $1').toUpperCase().trim()}</div>
            <div class="md-ev-text" style="font-size:12px">${evText}</div>
            ${evt.progressDelta ? `<div style="font-size:9px;color:${isPositive ? '#86efac' : '#fca5a5'};margin-top:2px">Escape ${isPositive ? '+' : ''}${evt.progressDelta.toFixed(2)}</div>` : ''}
          </div>
        </div>`;
      }

      // Stage escape progress
      stageHtml += `<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px">Stage progress: +${ts.escapeProgress?.toFixed(3) || '0.000'}</div>`;

      stageHtml += `</div></div>`;
    }

    // Bubble particles (increase with depth)
    stageHtml += `<div class="md-bubbles-active" style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden">${_mdBubbles(bubbleCount)}</div>`;

    stageHtml += `</div>`;

    feed += `<div id="md-step-sub-${si}" style="${si <= revIdx ? '' : 'display:none'}" class="${blurClass}">${stageHtml}</div>`;
  }

  // Controls
  feed += `<div id="md-controls-sub" style="display:flex;gap:8px;justify-content:center;padding:16px 0;${revIdx >= totalSteps - 1 ? 'display:none' : ''}">
    <button class="md-btn-next" onclick="mastersOfDisastersRevealNext('md-sub',${totalSteps})">NEXT STAGE</button>
    <button class="md-btn-all" onclick="mastersOfDisastersRevealAll('md-sub',${totalSteps})">REVEAL ALL</button>
  </div>`;

  // Done box
  const subWinner = sub.winner || '';
  feed += `<div id="md-done-sub" style="${revIdx >= totalSteps - 1 ? '' : 'display:none'};text-align:center;padding:16px;background:rgba(14,116,144,0.08);border:1px solid rgba(14,116,144,0.2);border-radius:6px;margin-top:12px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--md-water);letter-spacing:4px">SUBMARINE ESCAPE</div>
    ${subWinner ? `<div style="font-size:13px;color:var(--md-safe);margin-top:6px">${subWinner} cracks the code and escapes &mdash; IMMUNITY!</div>` : ''}
  </div>`;

  // HUD
  const currentStage = Math.min(revIdx + 1, stages.length);
  const currentWater = currentStage > 0 ? (stages[currentStage - 1]?.waterPct || 0) : 0;
  const hud = `<div class="md-hud">
    <div class="md-hud-cell"><div class="md-hud-val">${currentStage > 0 ? currentStage : '-'}</div><div class="md-hud-lbl">Stage</div></div>
    <div class="md-hud-cell"><div class="md-hud-val">${currentWater}%</div><div class="md-hud-lbl">Water</div></div>
    <div class="md-hud-cell" style="flex:2">
      <div class="md-depth-gauge"><div class="md-depth-fill" style="width:${currentWater}%"></div><div class="md-depth-label">${currentWater}% FLOODED</div></div>
      <div class="md-hud-lbl" style="margin-top:4px">Depth Gauge</div>
    </div>
  </div>`;

  // Sidebar
  const sidebarContent = _mdBuildSubmarineSidebar(sub, revIdx, tribeNames, ep);
  const sidebar = `<div class="md-sidebar" id="md-sidebar-sub">${sidebarContent}</div>`;

  // Water overlay (rises with reveals)
  const waterOverlayH = revIdx >= 0 ? waterHeights[Math.min(revIdx, waterHeights.length - 1)] : 0;

  return _mdShell(`
    <div class="md-header">
      <div><div class="md-title">SINKING SUBMARINE</div><div class="md-subtitle">Phase 2</div></div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:2px;color:var(--md-water)">ESCAPE OR DROWN</div>
    </div>
    ${hud}
    <div class="md-layout" style="position:relative">
      <div class="md-feed">${feed}</div>
      ${sidebar}
      <div class="md-water-overlay" style="height:${waterOverlayH}%"></div>
    </div>
    <div class="md-bubbles-active" style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden">${_mdBubbles(20)}</div>
  `, ep, 'submarine');
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Results (Final Verdict)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildMastersOfDisastersResults(ep) {
  const md = ep.mastersOfDisasters;
  if (!md) return '';

  const eq = md.earthquake;
  const sub = md.submarine;
  const tribeScores = md.tribeScores || {};
  const tribeNames = Object.keys(tribeScores);
  const subWinner = sub?.winner || '';
  const eqWinner = eq?.winner || '';
  const escProg = sub?.escapeProgress || {};

  // Phase scoreboard
  const phaseData = [
    { label: 'EARTHQUAKE', winner: eqWinner, color: 'var(--md-fire)' },
    { label: 'SUBMARINE', winner: subWinner, color: 'var(--md-water)' },
  ];

  const headerCells = tribeNames.map(t =>
    `<th style="padding:6px 12px;text-align:center;font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:2px;color:var(--md-ember)">${t}</th>`
  ).join('');

  let phaseRows = phaseData.map(ph => {
    const cells = tribeNames.map(t => {
      const isW = ph.winner === t;
      return `<td style="padding:6px 12px;text-align:center;color:${isW ? '#86efac' : '#fca5a5'};font-weight:${isW ? '700' : '400'}">${isW ? 'W' : 'L'}</td>`;
    }).join('');
    return `<tr><td style="padding:6px 12px;text-align:left;font-family:'Bebas Neue',sans-serif;font-size:10px;letter-spacing:2px;color:${ph.color}">${ph.label}</td>${cells}</tr>`;
  }).join('');

  const scoreboard = `<div style="background:linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,41,59,0.8));border:2px solid rgba(255,255,255,0.08);border-radius:4px;padding:12px;margin:12px 14px;box-shadow:inset 0 0 20px rgba(0,0,0,0.4)">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:3px;color:var(--md-ash);text-align:center;margin-bottom:8px">PHASE RESULTS</div>
    <table style="width:100%;border-collapse:collapse;color:var(--md-ash)">
      <thead><tr><th></th>${headerCells}</tr></thead>
      <tbody>${phaseRows}</tbody>
    </table>
  </div>`;

  // Escape progress comparison (split fire/water design)
  let progressCompare = `<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;padding:0 14px 16px">`;
  for (const tName of tribeNames) {
    const prog = escProg[tName] || 0;
    const pct = Math.min(100, Math.round((prog / 1.5) * 100));
    const isWin = tName === subWinner;
    progressCompare += `<div style="flex:1;min-width:140px;max-width:280px;position:relative;overflow:hidden;border-radius:6px;border:1px solid ${isWin ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}">
      <!-- Split bg -->
      <div style="position:absolute;top:0;left:0;right:50%;bottom:0;background:rgba(239,68,68,0.04)"></div>
      <div style="position:absolute;top:0;left:50%;right:0;bottom:0;background:rgba(14,116,144,0.04)"></div>
      <div style="position:relative;padding:12px;text-align:center">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:2px;color:${isWin ? 'var(--md-safe)' : 'rgba(255,255,255,0.5)'}">${tName}</div>
        <div style="font-size:22px;font-weight:900;color:${isWin ? '#fff' : 'rgba(255,255,255,0.5)'};margin:4px 0">${prog.toFixed(2)}</div>
        <div class="md-side-bar" style="margin:6px 0"><div class="md-side-fill" style="width:${pct}%;background:${isWin ? '#22c55e' : '#0ea5e9'}"></div></div>
        <div style="font-size:9px;color:rgba(255,255,255,0.35)">${tName === eqWinner ? 'EQ Winner + ' : ''}${pct}% escape</div>
      </div>
    </div>`;
  }
  progressCompare += `</div>`;

  // Winner banner
  const immuneTribe = subWinner;
  const loserTribe = Object.entries(escProg).sort((a, b) => a[1] - b[1])[0]?.[0] || '';
  const immuneMembers = gs.tribes?.find(t => t.name === immuneTribe)?.members || [];
  const tribalMembers = gs.tribes?.find(t => t.name === loserTribe)?.members || [];

  const winnerBanner = `<div style="text-align:center;padding:24px 14px;position:relative;z-index:6">
    <!-- Fire/water split glow -->
    <div style="position:absolute;top:0;left:0;right:50%;bottom:0;background:radial-gradient(ellipse at 80% 50%,rgba(249,115,22,0.06),transparent);pointer-events:none"></div>
    <div style="position:absolute;top:0;left:50%;right:0;bottom:0;background:radial-gradient(ellipse at 20% 50%,rgba(14,116,144,0.06),transparent);pointer-events:none"></div>

    <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;position:relative">
      ${immuneMembers.map(m => _mdSmallPortrait(m, 44)).join('')}
    </div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:var(--md-ember);letter-spacing:5px;text-shadow:0 0 20px rgba(251,191,36,0.2),3px 3px 0 rgba(0,0,0,0.6);position:relative">${immuneTribe}</div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:6px;color:var(--md-safe);margin-top:4px;position:relative">ESCAPES THE DISASTER</div>
    <div style="margin-top:10px;position:relative">${_mdStamp('IMMUNITY', 'green')}</div>

    ${loserTribe ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);position:relative">
      <div style="font-size:10px;color:#ef4444;letter-spacing:2px;margin-bottom:8px">TRIBAL COUNCIL</div>
      <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:6px">
        ${tribalMembers.map(m => `<div style="opacity:0.5">${_mdSmallPortrait(m, 28)}</div>`).join('')}
      </div>
      <div style="font-size:10px;color:#fca5a5">${loserTribe} &mdash; someone's going home tonight.</div>
    </div>` : ''}
  </div>`;

  // Player leaderboard
  const scores = Object.entries(ep.chalMemberScores || {}).sort((a, b) => b[1] - a[1]);
  let leaderboard = '<div style="padding:0 14px 16px">';
  leaderboard += '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:12px;letter-spacing:3px;color:var(--md-ash);text-align:center;margin-bottom:8px">SURVIVOR RECORD</div>';
  leaderboard += '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">';
  for (const [name, score] of scores) {
    const roundedScore = typeof score === 'number' ? Math.round(score) : score;
    const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
    leaderboard += `<div style="text-align:center;width:64px">
      <div style="width:48px;height:48px;border-radius:2px;overflow:hidden;border:2px solid var(--md-smoke);box-shadow:0 2px 6px rgba(0,0,0,0.5);margin:0 auto">
        <img src="assets/avatars/${slug}.png" width="48" height="48" style="display:block;object-fit:cover" onerror="this.style.display='none'">
      </div>
      <div style="font-size:9px;color:rgba(255,255,255,0.6);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--md-ember)">${roundedScore}</div>
    </div>`;
  }
  leaderboard += '</div></div>';

  return _mdShell(`
    ${winnerBanner}
    ${scoreboard}
    ${progressCompare}
    ${leaderboard}
  `, ep, 'title');
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Reveal functions
// ═══════════════════════════════════════════════════════════════════════════

export function mastersOfDisastersRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('md-', '');
  const el = document.getElementById(`md-step-${suffix}-${state.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`md-controls-${suffix}`);
    const done = document.getElementById(`md-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _mdUpdateSidebar(screenKey, state.idx);

  // Update water overlay for submarine
  if (screenKey === 'md-sub') {
    const waterHeights = [25, 50, 75, 100];
    const waterEl = document.querySelector('.md-water-overlay');
    if (waterEl) waterEl.style.height = waterHeights[Math.min(state.idx, waterHeights.length - 1)] + '%';
  }
}

export function mastersOfDisastersRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('md-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`md-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`md-controls-${suffix}`);
  const done = document.getElementById(`md-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  const last = document.getElementById(`md-step-${suffix}-${totalSteps - 1}`);
  if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _mdUpdateSidebar(screenKey, totalSteps - 1);

  // Update water overlay for submarine
  if (screenKey === 'md-sub') {
    const waterEl = document.querySelector('.md-water-overlay');
    if (waterEl) waterEl.style.height = '100%';
  }
}

function _mdUpdateSidebar(screenKey, revIdx) {
  const ep = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  if (!ep?.mastersOfDisasters) return;
  const md = ep.mastersOfDisasters;
  const tribeNames = Object.keys(md.tribeScores || {});

  if (screenKey === 'md-eq' && md.earthquake) {
    const sideEl = document.getElementById('md-sidebar-eq');
    if (sideEl) sideEl.innerHTML = _mdBuildEarthquakeSidebar(md.earthquake, revIdx, tribeNames, ep);
  }
  if (screenKey === 'md-sub' && md.submarine) {
    const sideEl = document.getElementById('md-sidebar-sub');
    if (sideEl) sideEl.innerHTML = _mdBuildSubmarineSidebar(md.submarine, revIdx, tribeNames, ep);
  }
}
