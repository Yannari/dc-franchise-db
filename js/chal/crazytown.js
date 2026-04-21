// js/chal/crazytown.js — 3:10 to Crazytown Western challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── Text pools ──────────────────────────────────────────────────────────────

const HORSE_DIVE_JUMPED = {
  high: [
    (name, pr) => `${name} charges down the platform like ${pr.posAdj} boots are on fire, launching off the edge without so much as a flinch.`,
    (name, pr) => `${name} lets out a war whoop and goes airborne — ${pr.sub}'s in the saddle and the water's just the next stop on the trail.`,
    (name, pr) => `${name} tips ${pr.posAdj} hat to the crowd and steps off the edge like it's a sidewalk. Pure outlaw confidence.`,
    (name, pr) => `With a grin that'd scare a rattlesnake, ${name} blasts off the platform and drops into the tank below.`,
  ],
  mid: [
    (name, pr) => `${name} takes a breath, steadies ${pr.posAdj} nerve, and commits — off the edge and into the unknown.`,
    (name, pr) => `${name} mutters something under ${pr.posAdj} breath, then steps off the platform with grim determination.`,
    (name, pr) => `After a beat of hesitation, ${name} decides the water's better than the shame. ${pr.Sub} jumps.`,
    (name, pr) => `${name} plants both feet and goes — not pretty, not flashy, but the deed is done.`,
  ],
  low: [
    (name, pr) => `${name} shakes visibly at the edge before finally tipping forward, a yelp trailing ${pr.obj} all the way down.`,
    (name, pr) => `With closed eyes and a prayer, ${name} pushes off the platform — barely a jump, more of a controlled fall.`,
    (name, pr) => `${name} nearly turns back twice before ${pr.sub} pitches off the edge, arms flailing like a tumbleweed in a twister.`,
    (name, pr) => `${name} squeaks out a tiny "okay" and stumbles off the platform, splashing into the tank below with zero grace.`,
  ],
};

const HORSE_DIVE_CHICKEN = {
  high: [
    (name, pr) => `${name} pulls up hard at the lip of the platform, spurs scraping the planks — ${pr.sub} wasn't ready for THIS stretch of the trail.`,
    (name, pr) => `${name} gets to the edge, looks down, and shakes ${pr.posAdj} head once. Not today. ${pr.Sub} backs away without explanation.`,
    (name, pr) => `${name} plants ${pr.posAdj} boots and refuses to budge, staring down the drop with the eyes of someone who's done the math and doesn't like it.`,
    (name, pr) => `For all ${pr.posAdj} swagger, ${name} stops dead at the platform edge — the canyon's too wide, and ${pr.sub} knows it.`,
  ],
  mid: [
    (name, pr) => `${name} backs away from the platform, spurs scraping the planks — ${pr.sub} mutters something about the water looking "awful dark."`,
    (name, pr) => `${name} creeps to the edge, peers down, and retreats. No fanfare, just a quiet step back and a long sigh.`,
    (name, pr) => `${name} stands at the platform's lip for ten full seconds before ${pr.posAdj} nerve deserts ${pr.obj} entirely.`,
    (name, pr) => `The jump looks easy from the ground. Up here, ${name} decides it's a different story and backs off the platform.`,
  ],
  low: [
    (name, pr) => `${name} gets two steps from the edge and freezes — boots glued to the planks, face white as a ghost town.`,
    (name, pr) => `${name} shuffles toward the platform edge, spots the drop, and retreats with an audible "nope," spurs clicking against the wood.`,
    (name, pr) => `One look at the water and ${name} is done. ${pr.Sub} spins around so fast ${pr.posAdj} hat nearly flies off.`,
    (name, pr) => `${name} makes it exactly one step onto the platform before backing away, mumbling about a "bad feeling in ${pr.posAdj} boots."`,
  ],
};

const HORSE_DIVE_LANDING = {
  perfect: [
    (name, pr) => `${name} slices into the water clean as a whistle — the crowd sees the spray and the smile says it all.`,
    (name, pr) => `${name} hits the tank feet-first, picture-perfect. Even the judges in their rocking chairs have to tip their hats.`,
    (name, pr) => `A textbook entry. ${name} surfaces to a chorus of whoops — that's how you ride the bronco into the deep end.`,
  ],
  rough: [
    (name, pr) => `${name} makes it in but it's no oil painting — legs splayed, arms windmilling, landing in a tangle of limbs and splash.`,
    (name, pr) => `${name} hits the water sideways. ${pr.Sub} survives. The dignity doesn't fully recover, but ${pr.sub}'s in.`,
    (name, pr) => `It ain't pretty, but ${name} goes in and that's the point. The tribe takes the point and tries not to wince.`,
  ],
  bellyflop: [
    (name, pr) => `${name} goes flat as a pancake against the surface — the SLAP echoes across the lot. ${pr.Sub} bobs up red-faced.`,
    (name, pr) => `A full bellyflop from ${name}. Chris winces. The tribe winces. The water wins.`,
    (name, pr) => `${name} catches all the air on the way down and none of the angle — belly-first, maximum splash, minimum dignity.`,
  ],
  miss: [
    (name, pr) => `${name} clips the edge of the tank and tumbles in sideways — technically in, but the judges call it a miss. Zero points.`,
    (name, pr) => `${name} overcorrects mid-air and barely grazes the water outside the zone. The whistle blows. No score.`,
    (name, pr) => `A noble attempt from ${name}, but the landing is off the mark. Zero points, and a very long walk back to the tribe.`,
  ],
};

const HORSE_DIVE_HOST = {
  intro: [
    (host) => `${host} spreads ${host === 'Chris' ? 'his' : 'their'} arms wide from the top of the platform: "Welcome to the Horse Dive — where we separate the cowboys from the chickens! One at a time, partners!"`,
    (host) => `"Alright, saddle up!" ${host} bellows from the judge's booth. "Each of you rides the platform to the edge and takes the plunge. Points for style, points for courage — and zero for CHICKENING OUT!"`,
    (host) => `${host} tips ${host === 'Chris' ? 'his' : 'their'} wide-brimmed hat: "This ain't no petting zoo, folks. The tank's below, the platform's above, and there are no guarantees in the Wild West. Let's ride!"`,
  ],
  afterChicken: [
    (host, name) => `${host} shakes ${host === 'Chris' ? 'his' : 'their'} head slowly: "And ${name} loses ${host === 'Chris' ? 'their' : 'their'} nerve at the rail. Folks, that's what we in the business call… a chicken."`,
    (host, name) => `"${name}!" ${host} calls out. "The horse dove. You did not. Let's move on — try not to make eye contact with your tribe."`,
    (host, name) => `${host} sighs theatrically into the microphone. "Zero points for ${name}. The Wild West has no mercy for the faint of heart, pardner."`,
  ],
  afterBoldJump: [
    (host, name) => `${host} pumps a fist: "THAT'S what I'm talking about! ${name} with absolutely no hesitation — pure outlaw energy!"`,
    (host, name) => `"Oh, ${name} is NOT playing around today!" ${host} shouts. "That's the spirit of the frontier right there, folks!"`,
    (host, name) => `${host} grins from the booth: "${name} with ZERO fear. I love this cast sometimes."`,
  ],
  afterScaredJump: [
    (host, name) => `${host} gives a slow clap: "They were scared. They jumped anyway. That's a point for ${name} and a point for personal growth."`,
    (host, name) => `"Barely made it, but made it counts!" ${host} calls out. "${name} with the shaky but successful plunge!"`,
    (host, name) => `${host} nods approvingly: "Not pretty — but ${name} went over the edge and that's all the scoreboard needs."`,
  ],
};

const HORSE_DIVE_CONVINCE_SUCCESS = [
  (talker, chicken, tPr, cPr) => `${talker} gets alongside ${chicken} and talks ${cPr.obj} through it step by step — ${cPr.sub} nods, steadies, and goes.`,
  (talker, chicken, tPr, cPr) => `"You can do it," ${talker} says, and somehow that's enough. ${chicken} takes a breath and launches off the edge.`,
  (talker, chicken, tPr, cPr) => `${talker} puts a hand on ${chicken}'s shoulder and whispers something nobody else can hear. Whatever it is, ${cPr.sub} jumps.`,
  (talker, chicken, tPr, cPr) => `After thirty seconds of ${talker}'s steady talk, ${chicken} raises ${cPr.posAdj} chin and steps off the platform.`,
];

const HORSE_DIVE_CONVINCE_FAIL = [
  (talker, chicken, tPr, cPr) => `${talker} tries every angle but ${chicken} won't move. ${cPr.Sub} plants ${cPr.posAdj} boots and shakes ${cPr.posAdj} head.`,
  (talker, chicken, tPr, cPr) => `${talker}'s pep talk runs dry. ${chicken} listens politely and then steps back from the edge anyway.`,
  (talker, chicken, tPr, cPr) => `${talker} gestures, reasons, pleads — ${chicken} just stares at the water and refuses to move.`,
  (talker, chicken, tPr, cPr) => `All of ${talker}'s words can't shift ${chicken} from the spot. ${cPr.Sub} watches the others jump and does not follow.`,
];

const HORSE_DIVE_FORCE_SUCCESS = [
  (thrower, chicken, tPr, cPr) => `${thrower} runs out of patience, grabs ${chicken} by the arm, and the two of them go off the edge together — chaotic, but it counts.`,
  (thrower, chicken, tPr, cPr) => `With a sharp shove from ${thrower}, ${chicken} yelps and goes airborne. Not exactly voluntary, but the scoreboard doesn't care.`,
  (thrower, chicken, tPr, cPr) => `${thrower} physically maneuvers ${chicken} to the edge. There's a brief scuffle, and then ${cPr.sub}'s in the air — and then in the tank.`,
  (thrower, chicken, tPr, cPr) => `${thrower} roars "GO!" and gives ${chicken} just enough of a nudge. ${chicken} screams the whole way down.`,
];

const HORSE_DIVE_FORCE_FAIL = [
  (thrower, chicken, tPr, cPr) => `${thrower} tries to push ${chicken} forward and nearly goes over ${tPr.pos} instead. ${chicken} sidesteps and the moment collapses.`,
  (thrower, chicken, tPr, cPr) => `${chicken} braces hard against ${thrower}'s shove. Nobody moves. It's a stalemate, and the tribe groans.`,
  (thrower, chicken, tPr, cPr) => `${thrower} lunges toward ${chicken}, who ducks aside. The push misses completely and they both look foolish.`,
  (thrower, chicken, tPr, cPr) => `${thrower}'s intervention backfires — ${chicken} digs in harder and ${cPr.sub}'s going nowhere.`,
];

const HORSE_DIVE_HOST_INTERVENTION = {
  convinceSuccess: [
    (host, actor, chicken) => `${host} leans into the mic: "And ${actor} talks ${chicken} off the ledge — wait, no, ONTO the ledge. Impressive!"`,
    (host, actor, chicken) => `"I did NOT expect that pep talk to work," ${host} admits from the booth, "but here we are. ${chicken} is going in!"`,
    (host, actor, chicken) => `${host} scribbles a note: "Credit ${actor} with the assist. That's Western teamwork, folks."`,
  ],
  convinceFail: [
    (host, actor, chicken) => `${host} winces: "And the pep talk from ${actor}… goes absolutely nowhere. ${chicken} is unmoved."`,
    (host, actor, chicken) => `"${actor} gave it everything," ${host} sighs into the mic, "and ${chicken} gave them nothing. Moving on."`,
    (host, actor, chicken) => `${host} shrugs dramatically at the camera: "${actor} tried. ${chicken} refused. The scoreboard reflects accordingly."`,
  ],
  forceSuccess: [
    (host, actor, chicken) => `${host} raises an eyebrow: "Was that a jump or a push? Either way — the tank has ${chicken}. I'll allow it."`,
    (host, actor, chicken) => `"${actor} took matters into ${actor === 'Chris' ? 'his' : 'their'} own hands," ${host} observes, "and ${chicken} is now very wet. I respect the hustle."`,
    (host, actor, chicken) => `${host} cackles into the mic: "Classic ${actor}! One way or another, ${chicken} was getting in that tank!"`,
  ],
  forceFail: [
    (host, actor, chicken) => `${host} covers ${host === 'Chris' ? 'his' : 'their'} face: "That was painful to watch. ${actor} tried to move ${chicken}. ${chicken} did not move."`,
    (host, actor, chicken) => `"Nobody wins when brute force meets stubborn refusal," ${host} announces. "And that's the lesson of the day, courtesy of ${actor} and ${chicken}."`,
    (host, actor, chicken) => `${host} just shakes ${host === 'Chris' ? 'his' : 'their'} head at the camera: "${actor} pushed. ${chicken} didn't budge. Zero for everyone involved."`,
  ],
};

// ── Phase 1: Horse Dive ──────────────────────────────────────────────────────

function _simulateHorseDive(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const allMembers = tribeMembers.flatMap(t => t.members);

  const throwResult = checkChallengeThrows(allMembers, { phase: 'pre-merge', tribes: gs.tribes });
  const throwers = throwResult.throwers;

  const tribeResults = [];

  for (const tribe of tribeMembers) {
    // Shuffle jump order
    const order = [...tribe.members].sort(() => Math.random() - 0.5);
    const jumpers = [];
    const chickens = [];
    const reactions = [];
    let momentum = 0;

    for (const name of order) {
      const st = pStats(name);
      const pr = pronouns(name);

      if (throwers.has(name)) {
        // Throw disguised as chicken
        const tier = st.boldness >= 7 ? 'high' : st.boldness <= 3 ? 'low' : 'mid';
        const text = _rp(HORSE_DIVE_CHICKEN[tier])(name, pr);
        reactions.push({ name, jumped: false, text, boldness: st.boldness, throwDisguised: true });
        chickens.push(name);
        momentum--;
      } else {
        const jumpChance = Math.min(0.95, Math.max(0.05,
          st.boldness * 0.05 + st.physical * 0.02 + st.loyalty * 0.02 + 0.08 + Math.max(-2, momentum) * 0.04
        ));

        if (Math.random() < jumpChance) {
          // Jumped
          const roll = st.physical * 0.06 + st.boldness * 0.04 + Math.random() * 0.3;
          let landingKey, landingPoints;
          if (roll >= 0.7) { landingKey = 'perfect'; landingPoints = 3; }
          else if (roll >= 0.5) { landingKey = 'rough'; landingPoints = 2; }
          else if (roll >= 0.3) { landingKey = 'bellyflop'; landingPoints = 1; }
          else { landingKey = 'miss'; landingPoints = 0; }

          const tier = st.boldness >= 7 ? 'high' : st.boldness <= 3 ? 'low' : 'mid';
          const jumpText = _rp(HORSE_DIVE_JUMPED[tier])(name, pr);
          const landText = _rp(HORSE_DIVE_LANDING[landingKey])(name, pr);
          const hostLine = st.boldness >= 7
            ? _rp(HORSE_DIVE_HOST.afterBoldJump)(host, name)
            : _rp(HORSE_DIVE_HOST.afterScaredJump)(host, name);

          reactions.push({ name, jumped: true, text: jumpText + ' ' + landText, hostLine, boldness: st.boldness, landingKey, landingPoints });
          jumpers.push({ name, landingPoints });
          momentum++;

          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + landingPoints * 3;

          if (!gs.popularity) gs.popularity = {};
          if (landingKey === 'perfect') gs.popularity[name] = (gs.popularity[name] || 0) + 2;
        } else {
          // Chicken
          const tier = st.boldness >= 7 ? 'high' : st.boldness <= 3 ? 'low' : 'mid';
          const text = _rp(HORSE_DIVE_CHICKEN[tier])(name, pr);
          const hostLine = _rp(HORSE_DIVE_HOST.afterChicken)(host, name);
          reactions.push({ name, jumped: false, text, hostLine, boldness: st.boldness, throwDisguised: false });
          chickens.push(name);
          momentum--;

          if (!gs.popularity) gs.popularity = {};
          gs.popularity[name] = (gs.popularity[name] || 0) - 1;
        }
      }
    }

    // Interventions (max 2 per tribe)
    const interventions = [];
    const remainingChickens = [...chickens];
    let interventionCount = 0;

    for (const chicken of remainingChickens) {
      if (interventionCount >= 2) break;
      const chickenSt = pStats(chicken);
      const chickenPr = pronouns(chicken);

      // Find most motivated jumper
      let bestTalker = null;
      let bestMotivation = -Infinity;

      for (const j of jumpers) {
        const bond = getBond(j.name, chicken);
        const jSt = pStats(j.name);
        const motivation = Math.abs(bond) * 0.4 + jSt.social * 0.03 + jSt.physical * 0.02;
        if (motivation > bestMotivation) {
          bestMotivation = motivation;
          bestTalker = { name: j.name, bond, st: jSt };
        }
      }

      if (!bestTalker || bestMotivation < 0.3) continue;

      const talkerPr = pronouns(bestTalker.name);
      const bond = bestTalker.bond;
      const path = bond >= 2 ? 'convince' : bond <= -2 ? 'force' : (bestTalker.st.social > bestTalker.st.physical ? 'convince' : 'force');

      if (path === 'convince') {
        const chance = Math.min(0.80, Math.max(0.10,
          bestTalker.st.social * 0.06 + bond * 0.04 + chickenSt.loyalty * 0.03
        ));
        const success = Math.random() < chance;
        const convText = success
          ? _rp(HORSE_DIVE_CONVINCE_SUCCESS)(bestTalker.name, chicken, talkerPr, chickenPr)
          : _rp(HORSE_DIVE_CONVINCE_FAIL)(bestTalker.name, chicken, talkerPr, chickenPr);
        const hostLine = success
          ? _rp(HORSE_DIVE_HOST_INTERVENTION.convinceSuccess)(host, bestTalker.name, chicken)
          : _rp(HORSE_DIVE_HOST_INTERVENTION.convinceFail)(host, bestTalker.name, chicken);

        if (success) {
          addBond(bestTalker.name, chicken, 0.2);
          // Remove from chickens, add to jumpers with bellyflop score (1pt default for coerced)
          const idx = chickens.indexOf(chicken);
          if (idx !== -1) chickens.splice(idx, 1);
          jumpers.push({ name: chicken, landingPoints: 1 });
          ep.chalMemberScores[chicken] = (ep.chalMemberScores[chicken] || 0) + 3;
          // Update reaction
          const rx = reactions.find(r => r.name === chicken);
          if (rx) { rx.jumped = true; rx.intervention = { actor: bestTalker.name, path, success, text: convText, hostLine }; }
        } else {
          addBond(bestTalker.name, chicken, -0.1);
          const rx = reactions.find(r => r.name === chicken);
          if (rx) rx.intervention = { actor: bestTalker.name, path, success, text: convText, hostLine };
        }

        interventions.push({ actor: bestTalker.name, chicken, path, success, text: convText, hostLine });
      } else {
        // Force
        const physDiff = bestTalker.st.physical - chickenSt.physical;
        const chance = Math.min(0.75, Math.max(0.10,
          physDiff * 0.06 + bestTalker.st.boldness * 0.03 + 0.15
        ));
        const success = Math.random() < chance;
        const forceText = success
          ? _rp(HORSE_DIVE_FORCE_SUCCESS)(bestTalker.name, chicken, talkerPr, chickenPr)
          : _rp(HORSE_DIVE_FORCE_FAIL)(bestTalker.name, chicken, talkerPr, chickenPr);
        const hostLine = success
          ? _rp(HORSE_DIVE_HOST_INTERVENTION.forceSuccess)(host, bestTalker.name, chicken)
          : _rp(HORSE_DIVE_HOST_INTERVENTION.forceFail)(host, bestTalker.name, chicken);

        if (success) {
          addBond(bestTalker.name, chicken, -0.5);
          const idx = chickens.indexOf(chicken);
          if (idx !== -1) chickens.splice(idx, 1);
          jumpers.push({ name: chicken, landingPoints: 1 });
          ep.chalMemberScores[chicken] = (ep.chalMemberScores[chicken] || 0) + 3;
          const rx = reactions.find(r => r.name === chicken);
          if (rx) { rx.jumped = true; rx.intervention = { actor: bestTalker.name, path, success, text: forceText, hostLine }; }
        } else {
          addBond(bestTalker.name, chicken, -0.2);
          const rx = reactions.find(r => r.name === chicken);
          if (rx) rx.intervention = { actor: bestTalker.name, path, success, text: forceText, hostLine };
        }

        interventions.push({ actor: bestTalker.name, chicken, path, success, text: forceText, hostLine });
      }

      interventionCount++;
    }

    // Pressure reactions for remaining true chickens
    for (const chicken of chickens) {
      const rx = reactions.find(r => r.name === chicken && !r.throwDisguised && !r.jumped);
      if (!rx) continue;
      // Pick a random jumper to be frustrated
      if (jumpers.length > 0) {
        const frustrated = jumpers[Math.floor(Math.random() * jumpers.length)];
        addBond(frustrated.name, chicken, -0.1);
      }
      // Bond penalty from all teammates
      for (const teammate of tribe.members) {
        if (teammate !== chicken) addBond(teammate, chicken, -0.1);
      }
    }

    // Scoring
    const tribeScore = jumpers.length > 0
      ? jumpers.reduce((sum, j) => sum + j.landingPoints, 0) / jumpers.length
      : 0;

    tribeResults.push({ tribe: tribe.name, jumpers, chickens, reactions, interventions, tribeScore });
  }

  // Winner
  const sorted = [...tribeResults].sort((a, b) => b.tribeScore - a.tribeScore);
  const winnerTribe = sorted[0];
  result.tribeScores[winnerTribe.tribe] = (result.tribeScores[winnerTribe.tribe] || 0) + 1;

  // Throw processing
  const throwData = processChallengeThrows(throwResult, allMembers);

  result.horseDive = {
    tribeResults,
    throws: throwData,
    winner: winnerTribe.tribe,
  };
}

export function simulateCrazytown(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    horseDive: null,
    standoff: null,
    roundup: null,
    breakEvents1: null,
    breakEvents2: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.crazytown = result;
  ep.challengeType = 'crazytown';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  _simulateHorseDive(ep, tribeMembers, result);
  result.phases.push('horseDive');

  // TODO: Phase 2, 3 go here

  // Winner/loser — ensure there's always a distinct winner (horse dive score already applied)
  const tNames = Object.keys(result.tribeScores);
  const allZero = tNames.every(n => result.tribeScores[n] === 0);
  if (allZero) result.tribeScores[tNames[Math.random() < 0.5 ? 0 : 1]] += 1;

  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);

  updateChalRecord(ep);

  ep.campEvents[campKey].post.push({
    text: `3:10 to Crazytown: ${winnerName} wins the Western showdown. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: '3:10 TO CRAZYTOWN', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugCrazytown = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
  };
}

export function _textCrazytown(ep, ln, sec) {
  const ct = ep.crazytown;
  if (!ct) return;
  sec('3:10 to Crazytown');
  ln('The teams saddle up for a rootin\'-tootin\' Western showdown.');
}

export function rpBuildCrazytownTitleCard(ep) {
  if (!ep.crazytown) return '';
  return '<div style="padding:40px;text-align:center;color:#d4a574;font-family:serif;"><h1>🤠 3:10 TO CRAZYTOWN</h1><p>Title Card — Full VP coming soon</p></div>';
}

export function crazytownRevealNext() {}
export function crazytownRevealAll() {}
