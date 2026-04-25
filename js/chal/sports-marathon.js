// js/chal/sports-marathon.js — Sports Marathon challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── HELPERS ──
function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function noise(range = 0.15) { return (Math.random() - 0.5) * range; }
function host() { return seasonConfig?.hostName || 'Chris'; }

// ── HOST LINES ──
const SM_HOST = {
  intro: [
    (h) => `${h} blew a whistle. "Today's challenge? SPORTS. Four events. One winner. Get your game faces on."`,
    (h) => `"Athletes! Welcome to the Sports Marathon!" ${h} tossed a football in the air. "Hope you stretched."`,
    (h) => `${h} appeared in a referee outfit. "Four sports. Four chances to not embarrass yourself. BEGIN!"`,
  ],
  obstacleIntro: [
    (h) => `"Before we start, we need to know who's facing who." ${h} pointed at the obstacle course. "This determines your seeding."`,
    (h) => `"First — the obstacle course. Your ranking here determines your matchups." ${h} cracked his knuckles.`,
  ],
  sportIntro: {
    boxing: [
      (h) => `"Event one: BOXING!" ${h} held up marshmallow gloves. "And yes — you fight in SLOW MOTION."`,
      (h) => `${h} rang a tiny bell. "Welcome to the ring. Slow-motion only. Break the rule and you lose points."`,
    ],
    badminton: [
      (h) => `"Event two: BADMINTON!" ${h} twirled a racket. "Don't let the shuttlecock fool you — this gets intense."`,
      (h) => `"You think badminton is boring?" ${h} scoffed. "I once starred in a movie about badminton. It was... actually pretty boring. BUT THIS WON'T BE!"`,
    ],
    wrestling: [
      (h) => `"Event three: WRESTLING!" ${h} kicked open a ball pit. "Greco-Roman style. In a kiddie ball pit."`,
      (h) => `"Get ready to grapple!" ${h} pointed at the ball pit. "There's a lost toddler in there somewhere. Don't ask."`,
    ],
    slamDunk: [
      (h) => `"Final event: SLAM DUNK!" ${h} bounced a basketball. "Style points count. Bore me and you lose."`,
      (h) => `"Trampoline. Basketball. Style." ${h} counted on his fingers. "Make it MEMORABLE."`,
    ],
  },
  cheerIntro: [
    (h) => `"It's TIED! Tiebreaker time — CHEERLEADING!" ${h} pulled out pom-poms. "Each team performs. I'm the judge."`,
    (h) => `"We need a winner. And the way we settle this?" ${h} grinned. "POM-POMS."`,
  ],
  seedReveal: [
    (h) => `${h} pinned the seeding board. "Here's who you're fighting. No complaints."`,
    (h) => `"Rankings are in." ${h} slapped the board. "Deal with it."`,
  ],
};

// ── OBSTACLE COURSE EVENTS ──
// Archetype-aware text: pick archetype-specific line if available, else generic
function _archText(archetype, archPool, genericPool, ...args) {
  const pool = archPool[archetype];
  if (pool?.length && Math.random() < 0.6) return pick(pool)(...args);
  return pick(genericPool)(...args);
}

const OC_EVENTS = {
  pushGood: {
    generic: [
      (p, pr) => `${p} lowered ${pr.posAdj} shoulder and DROVE Chef across the field.`,
      (p, pr) => `${p} dug in and pushed like a freight train. Chef slid back on his heels.`,
      (p, pr) => `${p} exploded off the line. Chef's feet left skid marks in the turf.`,
      (p, pr) => `${p} got low, drove ${pr.posAdj} legs, and moved Chef a solid ten yards.`,
    ],
    arch: {
      'challenge-beast': [
        (p, pr) => `${p} treated Chef like a training dummy. Effortless power. This is what ${pr.sub} lives for.`,
        (p, pr) => `${p} moved Chef so fast it looked rehearsed. Pure athlete.`,
      ],
      'hothead': [
        (p, pr) => `${p} SCREAMED and charged Chef like a bull. Raw fury. Chef flew.`,
        (p, pr) => `"GET OUT OF MY WAY!" ${p} hit Chef with everything. Rage-powered.`,
      ],
      'villain': [
        (p, pr) => `${p} waited for Chef to blink, then shoved with perfect timing. Calculated.`,
        (p, pr) => `${p} drove Chef back with a smirk. "Too easy. Next."`,
      ],
      'social-butterfly': [
        (p, pr) => `${p} surprised everyone — including ${pr.ref} — by bulldozing Chef. "I WORK OUT SOMETIMES!"`,
      ],
      'underdog': [
        (p, pr) => `${p} gritted ${pr.posAdj} teeth and pushed. Chef moved. ${p} couldn't believe it. Neither could anyone else.`,
      ],
    },
  },
  pushBad: {
    generic: [
      (p, pr) => `${p} pushed with everything ${pr.sub} had. Chef didn't budge. "That tickled."`,
      (p, pr) => `${p} bounced off Chef like a ping pong ball. "Next!"`,
      (p, pr) => `${p} slipped on the grass and slid under Chef's legs. Not the plan.`,
      (p, pr) => `${p}'s shoes had zero grip. ${pr.Sub} just ran in place while Chef laughed.`,
    ],
    arch: {
      'social-butterfly': [
        (p, pr) => `${p} tried to charm Chef into moving. "Pretty please?" Chef folded his arms. No.`,
        (p, pr) => `${p} hugged Chef instead of pushing. "Is... is this right?" It was not.`,
      ],
      'floater': [
        (p, pr) => `${p} leaned into Chef and just... stayed there. Pushing nothing. "Is it working?"`,
        (p, pr) => `${p} put in about 30% effort. Chef yawned.`,
      ],
      'showmancer': [
        (p, pr) => `${p} was too busy looking at the crowd to push properly. Chef tapped ${pr.posAdj} shoulder. "Focus."`,
      ],
      'wildcard': [
        (p, pr) => `${p} tried to push Chef from the side. "Nobody said I had to push FORWARD!" ${host()} said yes, yes they did.`,
      ],
      'goat': [
        (p, pr) => `${p} pushed. Nothing happened. ${p} pushed again. Still nothing. Chef sighed.`,
      ],
    },
  },
  tireGood: {
    generic: [
      (p, pr) => `${p} danced through the tires like a pro running back. Untouchable.`,
      (p, pr) => `${p} high-kneed through every tire cleanly. Not a single misstep.`,
      (p, pr) => `${p} hopped through the tires like ${pr.sub}'d done this a thousand times.`,
      (p, pr) => `${p} cleared the tire gauntlet in record time. ${host()} checked the stopwatch twice.`,
    ],
    arch: {
      'challenge-beast': [
        (p, pr) => `${p} attacked the tires like a training exercise. Quick, precise, dominant.`,
      ],
      'chaos-agent': [
        (p, pr) => `${p} JUMPED over three tires at once. Unorthodox but somehow it worked.`,
      ],
      'perceptive-player': [
        (p, pr) => `${p} studied the pattern first, then glided through. Calculated steps.`,
      ],
      'wildcard': [
        (p, pr) => `${p} cartwheeled through the tires. ${host()} had no idea how to score that but it was fast.`,
      ],
    },
  },
  tireBad: {
    generic: [
      (p, pr) => `${p} got ${pr.posAdj} foot stuck in a tire. "It's eating my shoe!"`,
      (p, pr) => `${p} stepped on a mousetrap hidden in a tire. "YOWCH!" Hopping on one foot.`,
      (p, pr) => `${p} tripped on the second tire and faceplanted into the third.`,
      (p, pr) => `${p} rolled ${pr.posAdj} ankle on the first tire. Limped the rest.`,
    ],
    arch: {
      'mastermind': [
        (p, pr) => `${p} overthought the tire pattern and froze up. "Wait, which foot goes—" CRASH.`,
      ],
      'schemer': [
        (p, pr) => `${p} tried to find a shortcut around the tires. There wasn't one. Lost time.`,
      ],
      'social-butterfly': [
        (p, pr) => `${p} waved at the crowd mid-tire and ate dirt. "I'M FINE! I'm fine."`,
      ],
      'hothead': [
        (p, pr) => `${p} kicked a tire in frustration. It went airborne. Hit Chef. "MY BAD!"`,
      ],
      'loyal-soldier': [
        (p, pr) => `${p} tried to help a teammate through the tires first. Lost ${pr.posAdj} own rhythm.`,
      ],
    },
  },
  mudGood: {
    generic: [
      (p, pr) => `${p} army-crawled through the mud like a commando. Fast and flat.`,
      (p, pr) => `${p} slithered through the mud like a snake. No hesitation.`,
      (p, pr) => `${p} powered through the mud pit. Filthy but FAST.`,
      (p, pr) => `${p} dove in and came out the other end before anyone else blinked.`,
    ],
    arch: {
      'challenge-beast': [
        (p, pr) => `${p} ate mud for breakfast. Through the pit like a machine.`,
      ],
      'villain': [
        (p, pr) => `${p} crawled through with a smirk. "Please. I've dragged myself through worse."`,
      ],
      'hero': [
        (p, pr) => `${p} led the charge into the mud. First in, first out. Inspiring.`,
      ],
      'chaos-agent': [
        (p, pr) => `${p} rolled through the mud like a log. Weird technique. Somehow the fastest.`,
      ],
    },
  },
  mudBad: {
    generic: [
      (p, pr) => `${p} got stuck in the mud halfway through. "I can't... move..."`,
      (p, pr) => `${p} panicked and stood up into the barbed wire. "OW OW OW!" Back down.`,
      (p, pr) => `${p} crawled so slowly a worm passed ${pr.obj}. ${host()} timed it.`,
      (p, pr) => `${p} swallowed a mouthful of mud. The gagging did not help.`,
    ],
    arch: {
      'social-butterfly': [
        (p, pr) => `"I am NOT putting my face in that." ${p} crawled on all fours. Way slower.`,
      ],
      'showmancer': [
        (p, pr) => `${p} was worried about ${pr.posAdj} hair getting muddy. Priorities all wrong.`,
      ],
      'floater': [
        (p, pr) => `${p} sort of just... lay in the mud. "I'm working on it." ${pr.Sub} was not.`,
      ],
      'goat': [
        (p, pr) => `${p} went the wrong direction in the mud pit. Had to turn around.`,
      ],
      'schemer': [
        (p, pr) => `${p} waited for someone else to crawl first, planning to follow their path. They all went different ways.`,
      ],
    },
  },
};

// ── SPORT EVENTS ──
const SPORT_EVENTS = {
  boxing: {
    good: [
      (p, pr) => `${p} threw a perfect slow-motion uppercut. Poetry in motion.`,
      (p, pr) => `${p} delivered a devastating slow-mo combo. Left, left, right. Beautiful.`,
      (p, pr) => `${p} dodged in slow motion, then counter-punched. "Too... slow..."`,
      (p, pr) => `${p} danced around ${pr.posAdj} opponent. Slow-mo footwork. Elegant.`,
    ],
    bad: [
      (p, pr) => `${p} broke the slow-motion rule and punched at full speed. "FOUL!" ${host()} docked points.`,
      (p, pr) => `${p} tried a slow-motion jab but it looked more like a sleepy wave.`,
      (p, pr) => `${p} took a bite of ${pr.posAdj} marshmallow glove mid-fight. "They're real marshmallows!"`,
      (p, pr) => `${p} lost ${pr.posAdj} balance during a slow-motion spin. Hit the mat.`,
    ],
    knockout: [
      (a, b) => `${a} connected with a glacially slow but DEVASTATING hook. ${b} went down in ultra slow-mo!`,
      (a, b) => `${a}'s slow-motion uppercut caught ${b} clean on the chin. DOWN GOES ${b.toUpperCase()}!`,
    ],
  },
  badminton: {
    good: [
      (p, pr) => `${p} smashed the shuttlecock so hard it left a dent in the court.`,
      (p, pr) => `${p} dropped a perfect net shot. Unreturnable.`,
      (p, pr) => `${p} served an ace. The shuttlecock was a blur.`,
      (p, pr) => `${p} dove for the return and nailed a cross-court winner. Athletic!`,
    ],
    bad: [
      (p, pr) => `${p} whiffed the serve completely. The shuttlecock just sat there.`,
      (p, pr) => `${p} hit the shuttlecock into the net. Three times in a row.`,
      (p, pr) => `${p} swung the racket like a fly swatter. It was painful to watch.`,
      (p, pr) => `${p} returned the shot directly into ${pr.posAdj} own face. "...Ow."`,
    ],
    winner: [
      (a, b) => `${a} won with a devastating cross-court smash! ${b} didn't even move.`,
      (a, b) => `Game, set, match! ${a} crushed ${b} at the net.`,
    ],
  },
  wrestling: {
    good: [
      (p, pr) => `${p} grabbed ${pr.posAdj} opponent and flipped them into the ball pit!`,
      (p, pr) => `${p} got a perfect takedown, pinning ${pr.posAdj} opponent under a pile of balls.`,
      (p, pr) => `${p} used the balls as cover, then lunged for a surprise grapple!`,
      (p, pr) => `${p} emerged from under the balls like a shark. Grabbed a leg. PULL!`,
    ],
    bad: [
      (p, pr) => `${p} sank into the ball pit and couldn't find ${pr.posAdj} opponent. "Where'd they go?!"`,
      (p, pr) => `${p} tried a throw but slipped on the balls. Fell flat on ${pr.posAdj} back.`,
      (p, pr) => `A lost toddler grabbed ${p}'s leg. "Mama?" ${p} was very distracted.`,
      (p, pr) => `${p} flailed in the ball pit, accidentally punching balls everywhere. Zero technique.`,
    ],
    pin: [
      (a, b) => `${a} PINNED ${b} under a mountain of plastic balls! "ONE, TWO, THREE!"`,
      (a, b) => `${a} locked ${b} in a headlock and dragged them down. ${b} tapped out!`,
    ],
  },
  slamDunk: {
    good: [
      (p, pr) => `${p} launched off the trampoline, spun 360, and SLAMMED it home! The crowd erupted!`,
      (p, pr) => `${p} did a between-the-legs dunk. Pure style points.`,
      (p, pr) => `${p} bounced twice, reached the rim, and threw down a monster jam!`,
      (p, pr) => `${p} grabbed someone's wig off the ball, put it on the basketball, and dunked it. LEGENDARY.`,
    ],
    bad: [
      (p, pr) => `${p} hit the rim. The ball bounced off ${pr.posAdj} head on the way down.`,
      (p, pr) => `${p} couldn't reach the rim. Not even close. ${host()} winced.`,
      (p, pr) => `${p} tripped on the trampoline and launched sideways into the bleachers.`,
      (p, pr) => `${p} dunked it... into the wrong basket. "THAT ONE COUNTS, RIGHT?" No.`,
    ],
    showboat: [
      (p, pr) => `${p} did a victory dance on the trampoline after the dunk. Extra style points!`,
      (p, pr) => `${p} threw the ball at someone's chest, bounced them onto the trampoline, and DUNKED. Savage.`,
    ],
  },
  cheer: {
    good: [
      (tribe) => `${tribe}'s cheer was synchronized, energetic, and genuinely touching. The crowd loved it.`,
      (tribe) => `${tribe} did a full pyramid formation. Choreography on POINT.`,
    ],
    bad: [
      (tribe) => `${tribe}'s cheer was... an effort. At least they tried. ${host()} looked pained.`,
      (tribe) => `${tribe} couldn't agree on a rhythm. It was a mess of pom-poms and confusion.`,
    ],
    forHost: [
      (tribe, h) => `${tribe} cheered for... ${h}?! "Give me a C! Give me an H! Give me a—" ${h} was BEAMING. "I'm flattered."`,
    ],
  },
  // Mid-sport drama
  trashTalk: [
    (p, target) => `"That all you got, ${target}?" ${p} wasn't impressed.`,
    (p, target) => `${p} pointed at ${target}. "Sit down. This is MY sport."`,
    (p, target) => `"You play like my little sister." ${p} smirked at ${target}.`,
    (p, target) => `${p} slow-clapped ${target}'s performance. Disrespectful.`,
  ],
  trashTalkFail: [
    (p, target) => `${p} tried to talk smack but ${target} scored immediately after. Karma.`,
    (p, target) => `"You're trash at this!" ${p} shouted. ${target} won the point. Silence.`,
  ],
  confessional: [
    (p, pr) => `${p}: "I haven't played sports since gym class. And I HATED gym class."`,
    (p, pr) => `${p}: "Slow-motion boxing? That's not a real sport. ...I lost anyway."`,
    (p, pr) => `${p}: "The ball pit wrestling was actually fun. Don't tell anyone I said that."`,
    (p, pr) => `${p}: "I didn't know I could dunk. I also didn't know I could miss a dunk that badly."`,
    (p, pr) => `${p}: "Sports Marathon? More like Sports NIGHTMARE."`,
    (p, pr) => `${p}: "${host()} in a referee outfit is my sleep paralysis demon."`,
    (p, pr) => `${p}: "My strategy was simple: don't embarrass myself. I failed."`,
    (p, pr) => `${p}: "I actually ENJOYED that. Is something wrong with me?"`,
  ],
  hostBetween: [
    (h) => `${h} checked the scoreboard. "Oh, this is getting GOOD."`,
    (h) => `"Next sport!" ${h} blew the whistle so hard he coughed.`,
    (h) => `${h} dabbed sweat off his forehead. "The drama is REAL today."`,
    (h) => `"Loving the energy! Loving the pain! Mostly the pain." ${h} grinned.`,
  ],
  crowdReaction: [
    (tribe) => `${tribe}'s bench went CRAZY! Stomping, screaming, banging the bleachers!`,
    (tribe) => `${tribe}'s teammates chanted their fighter's name! The stadium shook!`,
    (tribe) => `${tribe}'s bench held up homemade signs. "DESTROY THEM" was the classiest one.`,
  ],
  coachMoment: [
    (a, b) => `${a} pulled ${b} aside before the match. "Remember — aim for the weak side." ${b} nodded.`,
    (a, b) => `"You've GOT this." ${a} grabbed ${b}'s shoulders. "I believe in you." Genuine.`,
  ],
  soreLoss: [
    (p, teammate) => `${p} lost and kicked the equipment. ${teammate} tried to console ${p} but got shoved away.`,
    (p, teammate) => `"I should've WON that!" ${p} was fuming. ${teammate} kept a safe distance.`,
  ],
  victoryHug: [
    (winner, teammate) => `${teammate} rushed the field and tackled ${winner} in a bear hug. "YOU DID IT!"`,
    (winner, teammate) => `${winner} pointed at ${teammate} in the crowd. "That was for YOU!" ${teammate} teared up.`,
  ],
};

// ── MATCHUP REACTIONS ──
const MATCHUP_REACTIONS = {
  eager: [
    (p, pr) => `${p} punched the air. "Let's GO!"`,
    (p, pr) => `${p} stretched ${pr.posAdj} arms. "I was BORN for this event."`,
  ],
  nervous: [
    (p, pr) => `${p} looked at ${pr.posAdj} opponent and gulped. "Oh no."`,
    (p, pr) => `${p}: "Can I switch events? Please?"`,
  ],
  cocky: [
    (p, pr) => `"This is gonna be easy." ${p} barely looked at ${pr.posAdj} opponents.`,
    (p, pr) => `${p} inspected ${pr.posAdj} nails. "Wake me up when it's over."`,
  ],
  rivalry: [
    (p, rival) => `${p} stared down ${rival}. "Finally. We settle this."`,
    (p, rival) => `${p} cracked ${p === rival ? '' : 'every knuckle '}when ${rival}'s name was called. Personal.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateSportsMarathon(ep, tribes) {
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));
  const result = {
    obstacleCourse: { players: [] },
    sports: [],
    cheerleader: null,
    seedBoard: [],
    tribeScores: {},
    breakEvents: [],
    benchDecisions: {},
  };

  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });
  ep.sportsMarathon = result;
  ep.challengeType = 'sports-marathon';
  ep.challengeLabel = 'Sports Marathon';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.mergeName || gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  _simulateObstacleCourse(ep, tribeMembers, result);
  _simulateSeedingBreak(ep, tribeMembers, result);
  result.halftimeEvents = _simulateHalftime(ep, tribeMembers, result);
  _simulateSports(ep, tribeMembers, result);

  // Tribe immunity = sport wins only
  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);
  ep.tribalPlayers = ep.loser ? [...ep.loser.members] : [];
  ep.challengeCategory = 'mixed';

  result.winner = winnerName;
  result.loser = loserName;

  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = {
    type: 'sports-marathon',
    label: 'Sports Marathon',
    winner: winnerName,
    loser: loserName,
    tribeScores: { ...result.tribeScores },
  };

  return ep;
}

// ══════════════════════════════════════════════════════════════
// PHASE 1: OBSTACLE COURSE
// ══════════════════════════════════════════════════════════════
function _simulateObstacleCourse(ep, tribeMembers, result) {
  const allPlayers = [];

  for (const tribe of tribeMembers) {
    for (const name of tribe.members) {
      const s = pStats(name);
      const pr = pronouns(name);
      const events = [];

      const arch = getArchetype(name);

      // Push drill
      const pushScore = s.physical * 0.03 + s.endurance * 0.02 + noise(0.3);
      if (pushScore > 0.30) {
        events.push({ type: 'pushGood', icon: '💪', text: _archText(arch, OC_EVENTS.pushGood.arch, OC_EVENTS.pushGood.generic, name, pr) });
      } else {
        events.push({ type: 'pushBad', icon: '😤', text: _archText(arch, OC_EVENTS.pushBad.arch, OC_EVENTS.pushBad.generic, name, pr) });
      }

      // Tire run
      const tireScore = s.physical * 0.02 + s.endurance * 0.02 + s.intuition * 0.01 + noise(0.3);
      if (tireScore > 0.29) {
        events.push({ type: 'tireGood', icon: '👟', text: _archText(arch, OC_EVENTS.tireGood.arch, OC_EVENTS.tireGood.generic, name, pr) });
      } else {
        events.push({ type: 'tireBad', icon: '🪤', text: _archText(arch, OC_EVENTS.tireBad.arch, OC_EVENTS.tireBad.generic, name, pr) });
      }

      // Mud crawl
      const mudScore = s.endurance * 0.03 + s.physical * 0.02 + noise(0.3);
      if (mudScore > 0.31) {
        events.push({ type: 'mudGood', icon: '🐍', text: _archText(arch, OC_EVENTS.mudGood.arch, OC_EVENTS.mudGood.generic, name, pr) });
      } else {
        events.push({ type: 'mudBad', icon: '🤢', text: _archText(arch, OC_EVENTS.mudBad.arch, OC_EVENTS.mudBad.generic, name, pr) });
      }

      const totalScore = pushScore + tireScore + mudScore;
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.round(totalScore * 2);

      allPlayers.push({ name, tribe: tribe.name, score: totalScore, events });
    }
  }

  // Rank all players
  allPlayers.sort((a, b) => b.score - a.score);
  allPlayers.forEach((p, i) => { p.seed = i + 1; });

  result.obstacleCourse.players = allPlayers;

  // Build seed groups — group by seed position within tribe
  const tribeSeeds = {};
  tribeMembers.forEach(t => { tribeSeeds[t.name] = []; });
  for (const p of allPlayers) {
    tribeSeeds[p.tribe].push(p);
  }

  const minSize = Math.min(...tribeMembers.map(t => t.members.length));
  const seedBoard = [];
  for (let slot = 0; slot < minSize; slot++) {
    const group = [];
    for (const t of tribeMembers) {
      if (tribeSeeds[t.name][slot]) {
        group.push(tribeSeeds[t.name][slot]);
      }
    }
    seedBoard.push(group);
  }
  result.seedBoard = seedBoard;

  // Bench — players beyond minSize in larger tribes
  for (const t of tribeMembers) {
    const extras = tribeSeeds[t.name].slice(minSize);
    result.benchDecisions[t.name] = { benched: extras.map(p => p.name) };
  }
}

// ══════════════════════════════════════════════════════════════
// SEEDING BREAK — reactions + drama
// ══════════════════════════════════════════════════════════════
function _simulateSeedingBreak(ep, tribeMembers, result) {
  const campKey = gs.mergeName || gs.tribes[0]?.name || 'merge';
  const allMembers = tribeMembers.flatMap(t => t.members);
  const breakEvents = [];

  // Matchup reactions for each seed group
  for (let i = 0; i < result.seedBoard.length; i++) {
    const group = result.seedBoard[i];
    for (const p of group) {
      const pr = pronouns(p.name);
      const s = pStats(p.name);
      const rivals = group.filter(o => o.name !== p.name && getBond(p.name, o.name) < -2);
      let reaction;
      if (rivals.length) {
        reaction = pick(MATCHUP_REACTIONS.rivalry)(p.name, rivals[0].name);
      } else if (s.boldness >= 7) {
        reaction = pick(MATCHUP_REACTIONS.cocky)(p.name, pr);
      } else if (s.boldness <= 3) {
        reaction = pick(MATCHUP_REACTIONS.nervous)(p.name, pr);
      } else {
        reaction = pick(MATCHUP_REACTIONS.eager)(p.name, pr);
      }
      breakEvents.push({ type: 'matchupReaction', player: p.name, tribe: p.tribe, seed: i + 1, text: reaction });
    }
  }

  // Bench drama — ranked too low in obstacle course to compete
  for (const t of tribeMembers) {
    const benched = result.benchDecisions[t.name]?.benched || [];
    for (const name of benched) {
      const pr = pronouns(name);
      const s = pStats(name);
      const wantedToFight = s.boldness >= 5;
      const decider = t.members.filter(n => !benched.includes(n)).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];

      if (wantedToFight) {
        const angryTexts = [
          `${name} ranked too low to compete. ${pr.Sub} kicked the bench. "This is RIGGED!"`,
          `"I'm BETTER than my ranking!" ${name} was furious about being benched. ${pr.Sub} glared at the obstacle course.`,
          `${name} couldn't believe it. "I slipped in the MUD. ONE bad obstacle and I'm out?!"`,
        ];
        const evt = { type: 'benchAngry', player: name, tribe: t.name, players: [name, ...(decider ? [decider] : [])],
          badgeText: 'BENCH — ANGRY', badgeClass: 'red', text: pick(angryTexts) };
        breakEvents.push(evt);
        ep.campEvents[campKey].post.push({ ...evt, tag: 'drama' });
        if (decider) addBond(name, decider, -0.3);
      } else {
        const reliefTexts = [
          `${name} didn't make the cut. ${pr.Sub} shrugged. "More watching, less pain. Fine by me."`,
          `${name} saw ${pr.posAdj} ranking and exhaled. "Honestly? I'm relieved. Those sports look PAINFUL."`,
          `"Guess I'll be the cheerleader," ${name} said, grabbing pom-poms nobody asked for.`,
        ];
        const evt = { type: 'benchRelief', player: name, tribe: t.name, players: [name],
          badgeText: 'BENCH — RELIEVED', badgeClass: 'green', text: pick(reliefTexts) };
        breakEvents.push(evt);
        ep.campEvents[campKey].post.push({ ...evt, tag: 'drama' });
      }
    }
  }

  // Bond events
  // Coach moment — teammate gives advice
  if (allMembers.length >= 2 && Math.random() < 0.5) {
    const pair = allMembers.slice().sort(() => Math.random() - 0.5).slice(0, 2);
    addBond(pair[0], pair[1], 0.4);
    breakEvents.push({ type: 'coachMoment', players: [pair[0], pair[1]], badgeText: 'COACH UP', badgeClass: 'green',
      text: pick(SPORT_EVENTS.coachMoment)(pair[0], pair[1]) });
    ep.campEvents[campKey].post.push({ text: breakEvents[breakEvents.length - 1].text, players: [pair[0], pair[1]], badgeText: 'COACH UP', badgeClass: 'green', tag: 'drama' });
  }

  // Equipment complaint
  if (Math.random() < 0.4) {
    const complainer = pick(allMembers);
    const complaints = [
      `${complainer}: "These marshmallow gloves are REAL marshmallows. I just ate half of mine."`,
      `${complainer}: "The ball pit smells like feet. Just putting that out there."`,
      `${complainer}: "Who puts MOUSETRAPS in tires?! That's a safety violation!"`,
      `${complainer}: "My loincloth — I mean uniform — is riding up."`,
    ];
    breakEvents.push({ type: 'complaint', player: complainer, badgeText: 'COMPLAINT', badgeClass: 'amber',
      text: pick(complaints) });
  }

  result.breakEvents = breakEvents;
}

// ══════════════════════════════════════════════════════════════
// PHASE 2: FOUR SPORTS
// ══════════════════════════════════════════════════════════════
// ── HALFTIME DRAMA EVENTS ──
const HALFTIME_EVENTS = [
  {
    id: 'scoreReaction',
    check(ep, all, result) { return Object.keys(result.tribeScores).length >= 2; },
    apply(ep, all, result) {
      const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
      const leader = sorted[0];
      const trailer = sorted[sorted.length - 1];
      const leaderMember = pick(all.filter(n => result.obstacleCourse.players.find(p => p.name === n && p.tribe === leader[0])));
      const trailerMember = pick(all.filter(n => result.obstacleCourse.players.find(p => p.name === n && p.tribe === trailer[0])));
      if (!leaderMember || !trailerMember) return null;
      const texts = [
        `${leaderMember} checked the scoreboard. "${leader[0]} is UP! We just gotta hold it." ${trailerMember} overheard and scowled.`,
        `"We're losing." ${trailerMember} stared at the board. "We need to win BOTH remaining events." The pressure was real.`,
        `${leaderMember} high-fived a teammate. "Halfway there!" ${trailerMember}: "It's not over yet."`,
      ];
      return { text: pick(texts), players: [leaderMember, trailerMember], badgeText: 'SCOREBOARD', badgeClass: 'gold' };
    },
  },
  {
    id: 'strategyAdjust',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all, result) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      addBond(pair[0], pair[1], 0.3);
      const texts = [
        `${pair[0]} and ${pair[1]} huddled during the break. "We need to change our approach for wrestling." "Agreed. More aggression."`,
        `"Watch their footwork," ${pair[0]} told ${pair[1]}. "They telegraph every move." Strategic adjustment.`,
        `${pair[0]} drew plays in the dirt with a stick while ${pair[1]} nodded along. Halftime coaching.`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'HALFTIME HUDDLE', badgeClass: 'green' };
    },
  },
  {
    id: 'injuryCheck',
    check(ep, all, result) {
      return result.sports.some(s => s.events.some(e => e.phase === 'action' && e.icon === '❌'));
    },
    apply(ep, all, result) {
      const losers = result.sports.flatMap(s => s.rankings.filter((_, i) => i > 0).map(r => r.name)).filter(n => all.includes(n));
      if (!losers.length) return null;
      const injured = pick(losers);
      const pr = pronouns(injured);
      const texts = [
        `${injured} iced ${pr.posAdj} shoulder during the break. "I'm fine. Totally fine." ${pr.Sub} was not fine.`,
        `The medic checked on ${injured}. "Can you continue?" "Just tape it up." Tough.`,
        `${injured} winced stretching ${pr.posAdj} legs. The first two events took a toll.`,
      ];
      return { text: pick(texts), players: [injured], badgeText: 'INJURY CHECK', badgeClass: 'red' };
    },
  },
  {
    id: 'snackBreak',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      addBond(pair[0], pair[1], 0.3);
      const texts = [
        `${pair[0]} and ${pair[1]} shared energy bars during the break. "Carbo-loading, baby." Bonding over snacks.`,
        `${pair[0]} tossed ${pair[1]} a water bottle. "Stay hydrated." A small kindness between rivals.`,
        `Chef served halftime nachos. ${pair[0]} and ${pair[1]} both dove for the last chip. They split it.`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'SNACK BREAK', badgeClass: 'green' };
    },
  },
  {
    id: 'rivalryBrew',
    check(ep, all) {
      for (const a of all) for (const b of all) if (a !== b && getBond(a, b) < -2) return true;
      return false;
    },
    apply(ep, all) {
      const pairs = [];
      for (const a of all) for (const b of all) if (a !== b && getBond(a, b) < -2) pairs.push([a, b]);
      if (!pairs.length) return null;
      const [a, b] = pick(pairs);
      addBond(a, b, -0.3);
      const texts = [
        `${a} and ${b} bumped shoulders in the locker room. "Watch it." "YOU watch it." Escalating.`,
        `${a} glared at ${b} across the bench. "If we're matched in wrestling, you're DONE."`,
        `${b} caught ${a} mocking ${b}'s earlier performance. The grudge deepened.`,
      ];
      return { text: pick(texts), players: [a, b], badgeText: 'RIVALRY', badgeClass: 'red' };
    },
  },
  {
    id: 'hostRoast',
    check(ep, all) { return true; },
    apply(ep, all, result) {
      const worstPerformers = result.sports.flatMap(s => [s.rankings[s.rankings.length - 1]?.name]).filter(Boolean);
      const target = worstPerformers.length ? pick(worstPerformers) : pick(all);
      popDelta(target, -1);
      const h = host();
      const texts = [
        `${h} grabbed the mic. "Halftime stats: ${target} has been... historically bad. Like, textbook bad."`,
        `"Let's check the replay of ${target}'s worst moment." ${h} hit play. The crowd groaned. ${target} wanted to disappear.`,
        `${h}: "I've seen better athleticism from my GRANDMOTHER. And she's imaginary." He looked directly at ${target}.`,
      ];
      return { text: pick(texts), players: [target], badgeText: 'HOST ROAST', badgeClass: 'amber' };
    },
  },
  {
    id: 'teamPepTalk',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all, result) {
      const sorted = Object.entries(result.tribeScores).sort((a, b) => a[1] - b[1]);
      const losingTribe = sorted[0][0];
      const losingMembers = all.filter(n => result.obstacleCourse.players.find(p => p.name === n && p.tribe === losingTribe));
      if (losingMembers.length < 2) return null;
      const [leader, teammate] = losingMembers.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      addBond(leader, teammate, 0.4);
      const texts = [
        `"We're DOWN but we're not OUT." ${leader} rallied ${losingTribe}. ${teammate} punched the air. "LET'S GO!"`,
        `${leader} gathered ${losingTribe} in a circle. "Two more events. We win BOTH. Who's with me?" ${teammate}: "ALL IN."`,
        `${teammate} was spiraling. ${leader} grabbed ${teammate}'s shoulders. "Hey. Look at me. We've got this." Composure restored.`,
      ];
      return { text: pick(texts), players: [leader, teammate], badgeText: 'PEP TALK', badgeClass: 'green' };
    },
  },
  {
    id: 'equipmentComplaint',
    check(ep, all) { return true; },
    apply(ep, all) {
      const complainer = pick(all);
      const texts = [
        `${complainer}: "Who puts MOUSETRAPS in tires?! I'm filing a complaint. With... someone."`,
        `${complainer}: "My marshmallow gloves melted. I've been punching with sticky fists for two rounds."`,
        `${complainer}: "There's a TODDLER in the ball pit. That can't be regulation."`,
        `${complainer}: "The trampoline has a spring missing. I felt it. In my spine."`,
      ];
      return { text: pick(texts), players: [complainer], badgeText: 'COMPLAINT', badgeClass: 'amber' };
    },
  },
  {
    id: 'showmanceTension',
    check(ep, all) { return gs.showmances?.some(s => all.includes(s.a) && all.includes(s.b)); },
    apply(ep, all) {
      const sm = gs.showmances.find(s => all.includes(s.a) && all.includes(s.b));
      if (!sm) return null;
      const onSameTeam = result => {
        const oc = result?.obstacleCourse?.players || [];
        const tA = oc.find(p => p.name === sm.a)?.tribe;
        const tB = oc.find(p => p.name === sm.b)?.tribe;
        return tA && tB && tA === tB;
      };
      addBond(sm.a, sm.b, 0.3);
      const texts = [
        `${sm.a} and ${sm.b} sat close during the break. "If we face each other... I won't go easy." "You better not."`,
        `${sm.b} massaged ${sm.a}'s shoulders. "You looked good out there." "I always look good." Flirting between plays.`,
        `${sm.a} caught ${sm.b} staring. "What?" "Nothing. Just... be careful in wrestling." Concern disguised as trash talk.`,
      ];
      return { text: pick(texts), players: [sm.a, sm.b], badgeText: 'SHOWMANCE', badgeClass: 'green' };
    },
  },
  {
    id: 'alliancePlot',
    check(ep, all) { return gs.namedAlliances?.some(a => a.active && a.members.filter(m => all.includes(m)).length >= 2); },
    apply(ep, all) {
      const alliance = gs.namedAlliances.find(a => a.active && a.members.filter(m => all.includes(m)).length >= 2);
      if (!alliance) return null;
      const pair = alliance.members.filter(m => all.includes(m)).slice(0, 2);
      addBond(pair[0], pair[1], 0.3);
      const texts = [
        `${pair[0]} and ${pair[1]} from ${alliance.name} whispered during the break. "We need to make sure our tribe wins the next two."`,
        `"If it comes to cheerleading, we know what to do." ${pair[0]} and ${pair[1]} exchanged a look. Alliance mode.`,
        `${pair[0]} pulled ${pair[1]} aside. "After this challenge, we need to talk targets." ${alliance.name} business never stops.`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'ALLIANCE TALK', badgeClass: 'green' };
    },
  },
  {
    id: 'warmupFail',
    check(ep, all) { return all.length >= 1; },
    apply(ep, all) {
      const target = pick(all);
      const pr = pronouns(target);
      const texts = [
        `${target} tried to stretch during the break and pulled something. "OW! My hamstring!" ${pr.Sub} limped it off.`,
        `${target} practiced boxing moves on an invisible opponent. Hit the water cooler instead. Water everywhere.`,
        `${target} attempted a practice dunk during the break. Missed. Hit the rim. The ball bounced into ${host()}'s face.`,
      ];
      return { text: pick(texts), players: [target], badgeText: 'WARMUP FAIL', badgeClass: 'red' };
    },
  },
  {
    id: 'lockerRoomBond',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      if (getBond(pair[0], pair[1]) > 5) return null;
      addBond(pair[0], pair[1], 0.4);
      const texts = [
        `${pair[0]} and ${pair[1]} compared bruises from the obstacle course. "Check this one." "That's nothing, look at THIS." Bonding over battle scars.`,
        `${pair[0]} found ${pair[1]} sitting alone. "You did good out there. Seriously." A moment of genuine connection.`,
        `${pair[0]} and ${pair[1]} practiced high-fives until they got the perfect one. Team chemistry building.`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'LOCKER ROOM', badgeClass: 'green' };
    },
  },
];

function _simulateHalftime(ep, tribeMembers, result) {
  const campKey = gs.mergeName || gs.tribes[0]?.name || 'merge';
  const allMembers = tribeMembers.flatMap(t => t.members);
  const halftimeEvents = [];

  const eligible = HALFTIME_EVENTS.filter(ev => ev.check(ep, allMembers, result));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const target = 6 + Math.floor(Math.random() * 2); // 6-7

  for (const ev of shuffled) {
    if (halftimeEvents.length >= target) break;
    const applied = ev.apply(ep, allMembers, result);
    if (applied) {
      ep.campEvents[campKey].post.push({ ...applied, tag: 'drama' });
      halftimeEvents.push({ id: ev.id, ...applied });
    }
  }

  return halftimeEvents;
}

const SPORT_ORDER = ['boxing', 'badminton', 'wrestling', 'slamDunk'];
const SPORT_LABELS = {
  boxing: { name: 'BOXING', icon: '🥊', subtitle: 'Slow-Motion Marshmallow Boxing' },
  badminton: { name: 'BADMINTON', icon: '🏸', subtitle: 'Shuttlecock Showdown' },
  wrestling: { name: 'WRESTLING', icon: '🤼', subtitle: 'Ball Pit Greco-Roman' },
  slamDunk: { name: 'SLAM DUNK', icon: '🏀', subtitle: 'Trampoline Style Dunk' },
};

function _simulateSports(ep, tribeMembers, result) {
  const campKey = gs.mergeName || gs.tribes[0]?.name || 'merge';
  const seedBoard = result.seedBoard;

  for (let si = 0; si < SPORT_ORDER.length; si++) {
    const sportKey = SPORT_ORDER[si];
    const label = SPORT_LABELS[sportKey];
    const groupIdx = si % seedBoard.length;
    const fighters = seedBoard[groupIdx];

    const sportResult = _simulateSportMatch(ep, sportKey, fighters, result);
    sportResult.sportKey = sportKey;
    sportResult.label = label;
    result.sports.push(sportResult);

    // Tribe score: winner gets 1 point
    result.tribeScores[sportResult.winner.tribe] += 1;

    // Drama between sports
    const dramaEvents = [];
    // Host commentary
    dramaEvents.push({ type: 'host', icon: '📢', text: pick(SPORT_EVENTS.hostBetween)(host()) });

    // Confessional from a fighter
    const confPlayer = pick(fighters);
    dramaEvents.push({ type: 'confessional', player: confPlayer.name, icon: '🎬',
      text: pick(SPORT_EVENTS.confessional)(confPlayer.name, pronouns(confPlayer.name)) });

    // Crowd reaction (~50%)
    if (Math.random() < 0.5) {
      const cheerTribe = pick(fighters);
      dramaEvents.push({ type: 'crowd', tribe: cheerTribe.tribe, icon: '📣',
        text: pick(SPORT_EVENTS.crowdReaction)(cheerTribe.tribe) });
    }

    // Sore loser or victory hug (~40%)
    if (Math.random() < 0.4) {
      const loser = sportResult.rankings[sportResult.rankings.length - 1];
      const loserTeammates = tribeMembers.find(t => t.name === loser.tribe)?.members.filter(n => n !== loser.name) || [];
      if (loserTeammates.length) {
        const teammate = pick(loserTeammates);
        if (pStats(loser.name).temperament <= 4) {
          dramaEvents.push({ type: 'soreLoss', player: loser.name, icon: '😤',
            text: pick(SPORT_EVENTS.soreLoss)(loser.name, teammate) });
          addBond(loser.name, teammate, -0.3);
          ep.campEvents[campKey].post.push({ text: dramaEvents[dramaEvents.length - 1].text, players: [loser.name, teammate], badgeText: 'SORE LOSER', badgeClass: 'red', tag: 'drama' });
        }
      }
    }

    // Victory celebration (~40%)
    if (Math.random() < 0.4) {
      const winnerTeammates = tribeMembers.find(t => t.name === sportResult.winner.tribe)?.members.filter(n => n !== sportResult.winner.name) || [];
      if (winnerTeammates.length) {
        const teammate = pick(winnerTeammates);
        dramaEvents.push({ type: 'victory', player: sportResult.winner.name, icon: '🎉',
          text: pick(SPORT_EVENTS.victoryHug)(sportResult.winner.name, teammate) });
        addBond(sportResult.winner.name, teammate, 0.4);
        ep.campEvents[campKey].post.push({ text: dramaEvents[dramaEvents.length - 1].text, players: [sportResult.winner.name, teammate], badgeText: 'CELEBRATION', badgeClass: 'green', tag: 'drama' });
      }
    }

    sportResult.dramaEvents = dramaEvents;
  }

  // Tiebreaker check
  const sortedScores = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const topScore = sortedScores[0][1];
  const bottomScore = sortedScores[sortedScores.length - 1][1];
  const tiedTop = sortedScores.filter(([_, s]) => s === topScore);
  const tiedBottom = sortedScores.filter(([_, s]) => s === bottomScore);

  let tiedTribes, tbType;
  if (tiedTop.length >= 2 && tiedTop.length === sortedScores.length) {
    tiedTribes = tiedTop.map(([name]) => name);
    tbType = 'top';
  } else if (tiedTop.length >= 2) {
    tiedTribes = tiedTop.map(([name]) => name);
    tbType = 'top';
  } else if (tiedBottom.length >= 2) {
    tiedTribes = tiedBottom.map(([name]) => name);
    tbType = 'bottom';
  }

  if (tiedTribes) {
    // Cheerleading tiebreaker
    const cheerResult = _simulateCheerleading(ep, tribeMembers, tiedTribes, tbType, result);
    result.cheerleader = cheerResult;

    if (tbType === 'top') {
      result.tribeScores[cheerResult.winner] += 2;
    } else {
      result.tribeScores[cheerResult.loser] -= 1;
    }
  }
}

function _simulateSportMatch(ep, sportKey, fighters, result) {
  const events = [];
  const scores = {};
  const sportTexts = SPORT_EVENTS[sportKey];
  fighters.forEach(f => { scores[f.name] = 0; });

  // Matchup reactions
  for (const f of fighters) {
    const pr = pronouns(f.name);
    const s = pStats(f.name);
    const rivals = fighters.filter(o => o.name !== f.name && getBond(f.name, o.name) < -2);
    let reaction;
    if (rivals.length) {
      reaction = pick(MATCHUP_REACTIONS.rivalry)(f.name, rivals[0].name);
    } else if (s.boldness >= 7) {
      reaction = pick(MATCHUP_REACTIONS.cocky)(f.name, pr);
    } else if (s.boldness <= 3) {
      reaction = pick(MATCHUP_REACTIONS.nervous)(f.name, pr);
    } else {
      reaction = pick(MATCHUP_REACTIONS.eager)(f.name, pr);
    }
    events.push({ phase: 'reaction', player: f.name, tribe: f.tribe, icon: s.boldness >= 7 ? '😎' : s.boldness <= 3 ? '😰' : '💪', text: reaction });
  }

  // 3 rounds of sport-specific play
  const ROUNDS = 3;
  for (let rd = 1; rd <= ROUNDS; rd++) {
    events.push({ phase: 'roundLabel', icon: '🔔', text: `— Round ${rd} —` });

    // Each fighter gets a check per round
    for (const f of fighters) {
      const s = pStats(f.name);
      const pr = pronouns(f.name);
      let check;
      if (sportKey === 'boxing') {
        check = s.physical * 0.03 + s.mental * 0.03 + s.endurance * 0.02 + noise(0.35);
      } else if (sportKey === 'badminton') {
        check = s.intuition * 0.04 + s.strategic * 0.03 + noise(0.35);
      } else if (sportKey === 'wrestling') {
        check = s.physical * 0.04 + s.boldness * 0.03 + noise(0.35);
      } else {
        check = s.physical * 0.03 + s.boldness * 0.03 + s.social * 0.02 + noise(0.35);
      }

      const roundThreshold = 0.30 + rd * 0.02; // gets harder each round
      const passed = check > roundThreshold;
      scores[f.name] += passed ? 1 : 0;

      if (passed) {
        events.push({ phase: 'action', player: f.name, tribe: f.tribe, icon: '✅',
          text: pick(sportTexts.good)(f.name, pr) });
        ep.chalMemberScores[f.name] = (ep.chalMemberScores[f.name] || 0) + 1;
      } else {
        events.push({ phase: 'action', player: f.name, tribe: f.tribe, icon: '❌',
          text: pick(sportTexts.bad)(f.name, pr) });
      }
    }

    // Mid-round event: trash talk (round 1-2, ~40%) or momentum shift
    if (rd < ROUNDS && Math.random() < 0.4) {
      const talker = pick(fighters);
      const target = pick(fighters.filter(f => f.name !== talker.name));
      if (target) {
        const s = pStats(talker.name);
        const trashCheck = s.social * 0.04 + (10 - s.temperament) * 0.03 + noise(0.25);
        if (trashCheck > 0.22) {
          events.push({ phase: 'trash', player: talker.name, tribe: talker.tribe, icon: '🗯️',
            text: pick(SPORT_EVENTS.trashTalk)(talker.name, target.name) });
          scores[target.name] -= 0.5;
          ep.chalMemberScores[talker.name] = (ep.chalMemberScores[talker.name] || 0) + 1;
        } else {
          events.push({ phase: 'trash', player: talker.name, tribe: talker.tribe, icon: '🗯️',
            text: pick(SPORT_EVENTS.trashTalkFail)(talker.name, target.name) });
          scores[talker.name] -= 0.3;
        }
      }
    }

    // Crowd reaction after each round (~35%)
    if (Math.random() < 0.35) {
      const bestThisRound = fighters.reduce((best, f) => scores[f.name] > scores[best.name] ? f : best, fighters[0]);
      events.push({ phase: 'crowd', tribe: bestThisRound.tribe, icon: '📣',
        text: pick(SPORT_EVENTS.crowdReaction)(bestThisRound.tribe) });
    }
  }

  // Rank by total round wins
  const ranked = fighters.map(f => ({ ...f, score: scores[f.name] })).sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const loser = ranked[ranked.length - 1];
  const finishKey = sportKey === 'boxing' ? 'knockout' : sportKey === 'badminton' ? 'winner' : sportKey === 'wrestling' ? 'pin' : 'showboat';

  const elimTexts = {
    boxing: [
      (a, b) => `${a} caught ${b} with a slow-motion hook to the jaw. ${b} crumpled to the mat!`,
      (a, b) => `${b} took too many hits. The ref stopped the fight. ${b} is OUT!`,
      (a, b) => `${a}'s slow-mo uppercut connected clean. ${b} went down in ultra slow-motion!`,
    ],
    badminton: [
      (a, b) => `${b} couldn't return a thing. Game over for ${b} — eliminated!`,
      (a, b) => `${a}'s smash was unreturnable. ${b} threw the racket down. Done.`,
      (a, b) => `${b} whiffed the final return. ${a} pumped a fist. ${b} is OUT!`,
    ],
    wrestling: [
      (a, b) => `${a} flipped ${b} out of the ball pit! ${b} landed on the mat — ELIMINATED!`,
      (a, b) => `${b} got buried under the balls. Couldn't escape ${a}'s hold. OUT!`,
      (a, b) => `${a} locked ${b} in a headlock and dragged them down. ${b} tapped out!`,
    ],
    slamDunk: [
      (a, b) => `${b}'s dunk attempt was embarrassing. ${a}'s style points buried ${b}. Eliminated!`,
      (a, b) => `${b} couldn't match ${a}'s flair. The judges shook their heads. ${b} is OUT!`,
      (a, b) => `${a}'s dunk was so good it made ${b}'s look amateur. ${b} is done.`,
    ],
  };
  const defeatReactions = [
    (p, pr) => `${p} slumped on the bench. "I had that. I HAD that."`,
    (p, pr) => `${p} kicked the equipment on the way out. Not taking it well.`,
    (p, pr) => `${p} shook ${pr.posAdj} head. "Next time." But there was no next time.`,
    (p, pr) => `${p} accepted the loss. "Good game." Barely concealed frustration.`,
  ];

  if (ranked.length > 2) {
    // 3+ fighters: staged elimination like bone battle
    const firstOut = ranked[ranked.length - 1];
    const pr_first = pronouns(firstOut.name);
    const knocker1 = ranked[Math.floor(Math.random() * (ranked.length - 1))];

    // First elimination
    events.push({ phase: 'elimination', player: firstOut.name, tribe: firstOut.tribe, icon: '💥',
      text: pick(elimTexts[sportKey])(knocker1.name, firstOut.name) });
    events.push({ phase: 'reaction', player: firstOut.name, tribe: firstOut.tribe, icon: '😤',
      text: pick(defeatReactions)(firstOut.name, pr_first) });

    // Remaining two — final showdown with real back-and-forth
    const r0 = ranked[0], r1 = ranked[1];
    const pr_r0 = pronouns(r0.name), pr_r1 = pronouns(r1.name);
    events.push({ phase: 'roundLabel', icon: '⚡', text: '— FINAL SHOWDOWN —' });

    events.push({ phase: 'action', player: r0.name, tribe: r0.tribe, icon: '🔥',
      text: pick(sportTexts.good)(r0.name, pr_r0) });
    events.push({ phase: 'action', player: r1.name, tribe: r1.tribe, icon: '🔥',
      text: pick(sportTexts.good)(r1.name, pr_r1) });

    // Possible trash talk in the showdown (~40%)
    if (Math.random() < 0.4) {
      const talker = pick([r0, r1]);
      const target = talker === r0 ? r1 : r0;
      events.push({ phase: 'trash', player: talker.name, tribe: talker.tribe, icon: '🗯️',
        text: pick(SPORT_EVENTS.trashTalk)(talker.name, target.name) });
    }

    // One more exchange
    events.push({ phase: 'action', player: r0.name, tribe: r0.tribe, icon: '🔥',
      text: pick(sportTexts.good)(r0.name, pr_r0) });

    // Second elimination
    events.push({ phase: 'elimination', player: r1.name, tribe: r1.tribe, icon: '💥',
      text: pick(elimTexts[sportKey])(winner.name, r1.name) });
    events.push({ phase: 'reaction', player: r1.name, tribe: r1.tribe, icon: '😤',
      text: pick(defeatReactions)(r1.name, pr_r1) });

    // Winner celebration
    if (sportTexts[finishKey]) {
      events.push({ phase: 'climax', player: winner.name, tribe: winner.tribe, icon: '👑',
        text: pick(sportTexts[finishKey])(winner.name, r1.name) });
    }
  } else {
    // 1v1 — direct finish
    if (sportTexts[finishKey]) {
      events.push({ phase: 'climax', player: winner.name, tribe: winner.tribe, icon: '👑',
        text: pick(sportTexts[finishKey])(winner.name, loser.name) });
    }
    const pr_l = pronouns(loser.name);
    events.push({ phase: 'reaction', player: loser.name, tribe: loser.tribe, icon: '😤',
      text: pick(defeatReactions)(loser.name, pr_l) });
  }

  ep.chalMemberScores[winner.name] = (ep.chalMemberScores[winner.name] || 0) + 3;

  return { fighters, events, rankings: ranked, winner, loser: ranked[ranked.length - 1] };
}

const CHEER_EVENTS = {
  planning: [
    (tribe) => `${tribe} huddled up. "OK, who can actually dance?" Silence. "...Great."`,
    (tribe) => `${tribe} argued over the cheer topic. "We cheer for OURSELVES!" "No, we cheer for the TEAM!" "Same thing!"`,
    (tribe) => `${tribe} tried to choreograph in 30 seconds. It was chaos. But passionate chaos.`,
  ],
  memberGood: [
    (p, pr) => `${p} nailed the choreography. Sharp moves, big energy. The crowd noticed.`,
    (p, pr) => `${p} had MOVES. Where did THAT come from?! The team fed off ${pr.posAdj} energy.`,
    (p, pr) => `${p} led the chant with pure conviction. You could feel it in the stands.`,
    (p, pr) => `${p} did a backflip mid-cheer. BACKFLIP! The judges' jaws dropped.`,
    (p, pr) => `${p} held the pyramid together with raw upper-body strength. MVP of the routine.`,
    (p, pr) => `${p}'s voice carried across the stadium. "LET'S GO!" Goosebumps.`,
  ],
  memberBad: [
    (p, pr) => `${p} forgot the cheer halfway through. Just... stood there. Waving.`,
    (p, pr) => `${p} clapped off-beat for the entire routine. It was distracting.`,
    (p, pr) => `${p} attempted a split and immediately regretted it. "MY LEGS!"`,
    (p, pr) => `${p} tripped over the pom-poms. Then tripped over ${pr.posAdj} own feet. Then just sat down.`,
    (p, pr) => `${p} looked like ${pr.sub} was having a medical event, not cheerleading.`,
    (p, pr) => `${p} mouthed the wrong words the entire time. Nobody corrected ${pr.obj}. They were all wrong too.`,
  ],
  forHost: [
    (tribe, h) => `${tribe} pivoted mid-routine. "Give me a C! H! R! I! S!" ${h}'s eyes lit up like Christmas.`,
    (tribe, h) => `${tribe} dedicated their entire cheer to ${h}. "He's handsome! He's smart! He's—" ${h}: "Go on..."`,
    (tribe, h) => `${tribe} chanted ${h}'s name with pom-poms waving. ${h} was BEAMING. "I'm not supposed to be biased but..."`,
  ],
  pyramid: [
    (tribe) => `${tribe} formed a PYRAMID! It held for exactly two seconds before collapsing. But those two seconds were glorious.`,
    (tribe) => `${tribe} attempted a human pyramid. The bottom row survived. Barely.`,
    (tribe) => `${tribe}'s pyramid was actually stable! The crowd roared! ...Then it collapsed. But they stuck the landing!`,
  ],
  crowdReaction: [
    (tribe) => `The crowd was ON THEIR FEET for ${tribe}! Standing ovation!`,
    (tribe) => `Scattered applause for ${tribe}. Some polite coughing. Not great.`,
    (tribe) => `${tribe} got the slow clap. It built. And built. And ERUPTED into cheers!`,
  ],
  judgeReaction: [
    (h, tribe, score) => `${h} held up his scorecard: ${score}/10. ${tribe} ${score >= 7 ? 'erupted!' : score >= 5 ? 'nodded nervously.' : 'groaned.'}`,
    (h, tribe, score) => `${h} scribbled on his clipboard. ${score}/10 for ${tribe}. ${score >= 7 ? '"Not bad. Not bad at all."' : '"I\'ve seen better. From kindergartners."'}`,
  ],
};

function _simulateCheerleading(ep, tribeMembers, tiedTribes, tbType, result) {
  const cheerResults = [];

  for (const tribeName of tiedTribes) {
    const t = tribeMembers.find(tm => tm.name === tribeName);
    const members = t.members;
    const events = [];

    // Planning phase
    events.push({ type: 'planning', icon: '📋', text: pick(CHEER_EVENTS.planning)(tribeName) });

    // Per-member performance
    let teamScore = 0;
    for (const name of members) {
      const s = pStats(name);
      const pr = pronouns(name);
      const check = s.social * 0.04 + s.loyalty * 0.03 + noise(0.3);
      const passed = check > 0.28;
      teamScore += passed ? 1 : 0;

      if (passed) {
        events.push({ type: 'memberGood', player: name, icon: '✅',
          text: pick(CHEER_EVENTS.memberGood)(name, pr) });
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 1;
      } else {
        events.push({ type: 'memberBad', player: name, icon: '❌',
          text: pick(CHEER_EVENTS.memberBad)(name, pr) });
      }
    }

    // Pyramid attempt (~40%)
    if (members.length >= 3 && Math.random() < 0.4) {
      events.push({ type: 'pyramid', icon: '🔺', text: pick(CHEER_EVENTS.pyramid)(tribeName) });
      teamScore += 0.5;
    }

    // Cheer for host (~15% — big bonus)
    const cheeredForHost = Math.random() < 0.15;
    if (cheeredForHost) {
      events.push({ type: 'forHost', icon: '⭐', text: pick(CHEER_EVENTS.forHost)(tribeName, host()) });
      teamScore += 2;
    }

    // Crowd reaction
    events.push({ type: 'crowd', icon: '📣', text: pick(CHEER_EVENTS.crowdReaction)(tribeName) });

    // Normalize score
    const normalizedScore = teamScore / members.length;
    const judgeScore = Math.min(10, Math.max(1, Math.round(normalizedScore * 8 + noise(2))));

    // Judge reveal
    events.push({ type: 'judge', icon: '🏅',
      text: pick(CHEER_EVENTS.judgeReaction)(host(), tribeName, judgeScore) });

    cheerResults.push({
      tribe: tribeName, score: normalizedScore, judgeScore, cheeredForHost, events,
      isGood: normalizedScore > 0.5, members: [...members],
    });
  }

  cheerResults.sort((a, b) => b.score - a.score);
  return {
    results: cheerResults,
    winner: cheerResults[0].tribe,
    loser: cheerResults[cheerResults.length - 1].tribe,
    tbType,
  };
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textSportsMarathon(ep, ln, sec) {
  const sm = ep.sportsMarathon;
  if (!sm) return;
  ln('');
  ln('═══ SPORTS MARATHON ═══');
  ln('');

  ln('── OBSTACLE COURSE SEEDING ──');
  for (const p of sm.obstacleCourse.players) {
    ln(`  #${p.seed} ${p.name} (${p.tribe}) — ${p.score.toFixed(2)}`);
    for (const e of p.events) ln(`    ${e.icon} ${e.text}`);
  }
  ln('');

  ln('── SPORTS ──');
  for (let si = 0; si < sm.sports.length; si++) {
    if (si === 2 && sm.halftimeEvents?.length) {
      ln('  ── HALFTIME ──');
      for (const e of sm.halftimeEvents) ln(`    ${e.badgeText}: ${e.text}`);
    }
    const sport = sm.sports[si];
    ln(`  ${sport.label.icon} ${sport.label.name}: ${sport.fighters.map(f => f.name).join(' vs ')}`);
    for (const e of sport.events) ln(`    ${e.icon} ${e.text}`);
    ln(`    Winner: ${sport.winner.name} (${sport.winner.tribe})`);
  }
  ln('');

  if (sm.cheerleader) {
    ln('── CHEERLEADING TIEBREAKER ──');
    for (const r of sm.cheerleader.results) {
      ln(`  ${r.tribe}: ${r.score.toFixed(2)}${r.cheeredForHost ? ' (cheered for host!)' : ''}`);
      ln(`    ${r.text}`);
    }
    ln(`  Winner: ${sm.cheerleader.winner}`);
    ln('');
  }

  ln(`Winner: ${sm.winner}`);
  ln(`Loser: ${sm.loser}`);
}

// ══════════════════════════════════════════════════════════════
// VP — STYLES + SHELL
// ══════════════════════════════════════════════════════════════
function _smPortrait(name, size = 32) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid var(--sport-gold);object-fit:cover;flex-shrink:0;box-shadow:0 0 6px rgba(234,179,8,0.2)" onerror="this.style.display='none'">`;
}
function _smSidePortrait(name, size = 20) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;border:1px solid var(--sport-gold);object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">`;
}
function _smBadge(text, cls) {
  return `<div class="sm-ev-badge ${cls}" style="font-size:10px;padding:3px 10px">${text}</div>`;
}

function _smShell(content, ep) {
  return `
<link href="https://fonts.googleapis.com/css2?family=Bungee+Shade&family=Share+Tech+Mono&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
.sm-shell{
  --sport-blue:#3b82f6;--sport-gold:#eab308;--sport-green:#16a34a;
  --sport-red:#ef4444;--sport-turf:#1a5e1f;--sport-dark:#0a1f0d;
  --sport-chalk:rgba(255,255,255,0.12);--sport-white:#f0fdf4;
  font-family:'Inter',sans-serif;color:var(--sport-white);
  background:linear-gradient(180deg,#0d2614 0%,#1a5e1f 15%,#1e6b24 50%,#1a5e1f 85%,#0d2614 100%);
  padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
  overflow:clip;border:2px solid rgba(234,179,8,0.15);box-shadow:inset 0 0 60px rgba(0,0,0,0.4),0 0 20px rgba(22,163,74,0.05);
}

/* Chalk field lines */
.sm-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;
  background:
    linear-gradient(0deg,transparent 49.5%,var(--sport-chalk) 49.5%,var(--sport-chalk) 50.5%,transparent 50.5%),
    linear-gradient(90deg,transparent 10%,var(--sport-chalk) 10%,var(--sport-chalk) 10.3%,transparent 10.3%,
      transparent 90%,var(--sport-chalk) 90%,var(--sport-chalk) 90.3%,transparent 90.3%),
    radial-gradient(circle at 50% 50%,transparent 12%,var(--sport-chalk) 12%,var(--sport-chalk) 12.4%,transparent 12.4%)}

/* Stadium light floodlight glow */
.sm-shell::after{content:'';position:absolute;top:-20px;left:50%;width:300px;height:80px;
  transform:translateX(-50%);
  background:radial-gradient(ellipse at center,rgba(255,255,255,0.04) 0%,transparent 70%);
  pointer-events:none;z-index:1}

/* Layout */
.sm-layout{display:flex;gap:0;position:relative;z-index:5;min-height:300px}
.sm-feed{flex:1;padding:14px 18px;min-width:0}
.sm-sidebar{width:260px;flex-shrink:0;padding:12px 14px;background:rgba(0,0,0,0.35);
  border-left:1px solid rgba(234,179,8,0.08);position:sticky;top:0;align-self:flex-start;max-height:80vh;overflow-y:auto}

/* HUD */
.sm-hud{display:flex;justify-content:center;gap:0;padding:12px 0;position:relative;z-index:5;
  border-bottom:1px solid rgba(234,179,8,0.08);background:rgba(0,0,0,0.25)}
.sm-hud-cell{flex:1;text-align:center;padding:4px 12px;border-right:1px solid rgba(234,179,8,0.06)}
.sm-hud-cell:last-child{border-right:none}
.sm-hud-val{font-family:'Share Tech Mono',monospace;font-size:20px;font-weight:700}
.sm-hud-lbl{font-size:9px;letter-spacing:2px;color:rgba(234,179,8,0.4);text-transform:uppercase;margin-top:2px;font-family:'Share Tech Mono',monospace}

/* Event cards */
.sm-ev{display:flex;align-items:flex-start;gap:10px;padding:8px 12px;margin-bottom:6px;
  background:rgba(0,0,0,0.2);border-radius:4px;border-left:3px solid rgba(234,179,8,0.15);
  position:relative;font-size:12px;line-height:1.5}
.sm-ev-badge{display:inline-block;padding:2px 8px;font-size:8px;font-family:'Share Tech Mono',monospace;
  letter-spacing:2px;text-transform:uppercase;border-radius:2px;margin-bottom:4px}
.sm-ev-badge.gold{border:1px solid var(--sport-gold);color:var(--sport-gold);background:rgba(234,179,8,0.06)}
.sm-ev-badge.blue{border:1px solid var(--sport-blue);color:var(--sport-blue);background:rgba(59,130,246,0.06)}
.sm-ev-badge.green{border:1px solid var(--sport-green);color:var(--sport-green);background:rgba(22,163,74,0.06)}
.sm-ev-badge.red{border:1px solid var(--sport-red);color:var(--sport-red);background:rgba(239,68,68,0.06)}
.sm-ev-badge.white{border:1px solid rgba(255,255,255,0.3);color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.04)}

/* Controls */
.sm-controls{display:flex;gap:10px;justify-content:center;padding:16px 0;position:relative;z-index:5}
.sm-btn-next{padding:10px 24px;font-family:'Bungee Shade',sans-serif;font-size:13px;letter-spacing:2px;
  background:rgba(234,179,8,0.1);color:var(--sport-gold);border:2px solid var(--sport-gold);
  border-radius:4px;cursor:pointer;text-transform:uppercase;transition:all 0.2s}
.sm-btn-next:hover{background:rgba(234,179,8,0.2);box-shadow:0 0 15px rgba(234,179,8,0.2)}
.sm-btn-all{padding:10px 18px;font-size:11px;background:none;color:rgba(255,255,255,0.3);
  border:1px solid rgba(255,255,255,0.1);border-radius:4px;cursor:pointer;font-family:'Share Tech Mono',monospace}

/* Sidebar */
.sm-side-sec{font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;
  color:var(--sport-gold);text-transform:uppercase;padding:6px 0 4px;
  border-bottom:1px solid rgba(234,179,8,0.1);margin-top:8px}
.sm-side-sec:first-child{margin-top:0}

/* ── SPORT-SPECIFIC ANIMATIONS ── */

/* Boxing — slow motion pulse */
.sm-boxing{position:relative;overflow:hidden}
.sm-boxing::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:1;
  background:radial-gradient(circle at 50% 50%,rgba(239,68,68,0.04) 0%,transparent 70%);
  animation:sm-boxing-pulse 3s ease-in-out infinite}
@keyframes sm-boxing-pulse{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:0.8;transform:scale(1.02)}}

/* Badminton — arc trajectory */
.sm-badminton{position:relative;overflow:hidden}
.sm-badminton::before{content:'';position:absolute;width:8px;height:8px;border-radius:50%;
  background:var(--sport-white);box-shadow:0 0 6px rgba(255,255,255,0.3);
  pointer-events:none;z-index:1;animation:sm-shuttle-arc 2s ease-in-out infinite}
@keyframes sm-shuttle-arc{0%{top:70%;left:10%;opacity:0}20%{opacity:0.4}
  50%{top:20%;left:50%;opacity:0.5}80%{opacity:0.4}
  100%{top:70%;right:10%;left:90%;opacity:0}}

/* Wrestling — bouncing balls */
.sm-wrestling{position:relative;overflow:hidden}
.sm-wrestling::before{content:'';position:absolute;bottom:5px;left:20%;width:10px;height:10px;
  border-radius:50%;background:var(--sport-red);opacity:0.15;
  pointer-events:none;z-index:1;animation:sm-ball-bounce 1.5s ease-in-out infinite}
.sm-wrestling::after{content:'';position:absolute;bottom:8px;right:25%;width:8px;height:8px;
  border-radius:50%;background:var(--sport-blue);opacity:0.12;
  pointer-events:none;z-index:1;animation:sm-ball-bounce 2s ease-in-out infinite;animation-delay:-0.5s}
@keyframes sm-ball-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}

/* Slam Dunk — arc + slam */
.sm-slamdunk{position:relative;overflow:hidden}
.sm-slamdunk::before{content:'';position:absolute;width:12px;height:12px;border-radius:50%;
  background:var(--sport-gold);box-shadow:0 0 8px rgba(234,179,8,0.3);
  pointer-events:none;z-index:1;animation:sm-dunk-arc 2.5s ease-in infinite}
@keyframes sm-dunk-arc{0%{bottom:60%;left:20%;opacity:0}20%{opacity:0.4}
  60%{bottom:80%;left:55%;opacity:0.5}
  80%{bottom:30%;left:70%;opacity:0.6}
  90%{bottom:10%;left:72%;opacity:0.3;transform:scale(1.5)}
  100%{bottom:5%;left:72%;opacity:0;transform:scale(0.5)}}

/* Cheerleading — pom-pom shake */
.sm-cheer{position:relative;overflow:hidden}
.sm-cheer::before{content:'';position:absolute;top:10px;right:15%;width:14px;height:14px;
  border-radius:50%;background:var(--sport-gold);opacity:0.15;
  pointer-events:none;z-index:1;animation:sm-pompom 0.6s ease-in-out infinite alternate}
.sm-cheer::after{content:'';position:absolute;top:12px;left:15%;width:12px;height:12px;
  border-radius:50%;background:var(--sport-red);opacity:0.12;
  pointer-events:none;z-index:1;animation:sm-pompom 0.6s ease-in-out infinite alternate;animation-delay:-0.3s}
@keyframes sm-pompom{0%{transform:rotate(-15deg) scale(1)}100%{transform:rotate(15deg) scale(1.2)}}

/* VS Splash */
.sm-vs-splash{text-align:center;padding:20px 12px;position:relative;
  background:radial-gradient(ellipse at center,rgba(234,179,8,0.08) 0%,transparent 60%);
  animation:sm-vs-shake 0.3s ease-out}
@keyframes sm-vs-shake{0%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(1px)}100%{transform:translateX(0)}}
.sm-vs-text{font-family:'Bungee Shade',sans-serif;font-size:36px;color:var(--sport-gold);
  text-shadow:0 0 30px rgba(234,179,8,0.4),4px 4px 0 rgba(0,0,0,0.7);
  animation:sm-vs-slam 0.5s cubic-bezier(0.22,1,0.36,1)}
@keyframes sm-vs-slam{0%{transform:scale(2.5) rotate(-5deg);opacity:0}40%{transform:scale(1.1) rotate(2deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.sm-vs-fighter{display:inline-flex;flex-direction:column;align-items:center;gap:6px;padding:10px 18px;
  background:rgba(0,0,0,0.3);border:2px solid rgba(234,179,8,0.12);border-radius:8px}

/* Fight rows */
.sm-fight-row{display:flex;align-items:center;gap:8px;padding:5px 8px;margin:3px 0;border-radius:5px;font-size:12px}
.sm-fight-good{background:rgba(22,163,74,0.08);border-left:3px solid rgba(22,163,74,0.25)}
.sm-fight-bad{background:rgba(239,68,68,0.06);border-left:3px solid rgba(239,68,68,0.2)}
.sm-fight-neutral{background:rgba(234,179,8,0.04);border-left:3px solid rgba(234,179,8,0.12)}
.sm-fight-climax{background:rgba(22,163,74,0.12);border:2px solid rgba(22,163,74,0.2);border-radius:8px;padding:10px}
.sm-fight-drama{background:rgba(234,179,8,0.04);border-left:3px dashed rgba(234,179,8,0.15);font-style:italic;padding:6px 10px}

/* Scoreboard LED style */
.sm-scoreboard{background:rgba(0,0,0,0.5);border:2px solid rgba(234,179,8,0.15);border-radius:6px;padding:8px;margin-bottom:8px}
.sm-score-row{display:flex;justify-content:space-between;align-items:center;padding:4px 6px;
  font-family:'Share Tech Mono',monospace;border-bottom:1px solid rgba(234,179,8,0.05)}
.sm-score-row:last-child{border-bottom:none}

@media(prefers-reduced-motion:reduce){
  .sm-boxing::before,.sm-badminton::before,.sm-wrestling::before,.sm-wrestling::after,
  .sm-slamdunk::before,.sm-cheer::before,.sm-cheer::after,
  .sm-vs-splash,.sm-vs-text{animation:none!important}
}
</style>
<div class="sm-shell">${content}</div>`;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildSportsMarathonTitleCard(ep) {
  const sm = ep.sportsMarathon;
  if (!sm) return '';
  return _smShell(`
    <div style="text-align:center;padding:50px 20px 60px;position:relative;z-index:6">
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:5px;color:rgba(234,179,8,0.4);text-transform:uppercase;margin-bottom:14px">CHALLENGE DAY</div>
      <div style="font-family:'Bungee Shade',sans-serif;font-size:38px;color:var(--sport-gold);text-shadow:0 0 30px rgba(234,179,8,0.3),3px 3px 0 rgba(0,0,0,0.6);letter-spacing:4px;line-height:1.1;margin-bottom:8px">SPORTS<br>MARATHON</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:13px;font-style:italic;color:rgba(255,255,255,0.5);margin-bottom:30px;letter-spacing:1px">"Four sports. One winner. Get your game faces on."</div>
      <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap">
        <div style="text-align:center"><div style="font-size:28px">🥊</div><div style="font-size:9px;color:var(--sport-red);letter-spacing:2px">BOXING</div></div>
        <div style="text-align:center"><div style="font-size:28px">🏸</div><div style="font-size:9px;color:var(--sport-white);letter-spacing:2px">BADMINTON</div></div>
        <div style="text-align:center"><div style="font-size:28px">🤼</div><div style="font-size:9px;color:var(--sport-blue);letter-spacing:2px">WRESTLING</div></div>
        <div style="text-align:center"><div style="font-size:28px">🏀</div><div style="font-size:9px;color:var(--sport-gold);letter-spacing:2px">SLAM DUNK</div></div>
      </div>
      <div style="margin-top:30px;font-size:12px;color:rgba(255,255,255,0.4)">${pick(SM_HOST.intro)(host())}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 2: OBSTACLE COURSE
// ══════════════════════════════════════════════════════════════
export function rpBuildSportsMarathonObstacle(ep) {
  const sm = ep.sportsMarathon;
  if (!sm || !sm.obstacleCourse) return '';
  const oc = sm.obstacleCourse;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'sm-obstacle';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const obstacleLabels = ['💪 PUSH DRILL', '👟 TIRE RUN', '🐍 MUD CRAWL'];
  const steps = [];

  // Intro
  steps.push({ html: `<div class="sm-ev" style="border-left-color:var(--sport-gold);padding:14px">
    <div style="font-size:28px">🏃</div>
    <div style="flex:1"><div class="sm-ev-badge gold" style="font-size:11px;padding:4px 12px">OBSTACLE COURSE — SEEDING</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:6px">${pick(SM_HOST.obstacleIntro)(host())}</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:6px;font-style:italic">Three obstacles. Your ranking determines your matchups.</div></div>
  </div>` });

  // One step per player — their full 3-obstacle run
  for (const p of oc.players) {
    const passCount = p.events.filter(e => e.type.includes('Good')).length;
    const resultIcon = passCount === 3 ? '🔥' : passCount >= 2 ? '✅' : passCount === 1 ? '⚠️' : '💀';
    const resultColor = passCount === 3 ? 'var(--sport-gold)' : passCount >= 2 ? 'var(--sport-green)' : passCount === 1 ? 'var(--sport-gold)' : 'var(--sport-red)';
    let pHtml = `<div class="sm-ev" style="border-left-color:${resultColor};padding:14px">
      <div style="flex:1">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${_smPortrait(p.name, 36)}
        <div>
          <div style="font-size:14px;color:var(--sport-white);font-weight:600">${p.name}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);font-family:'Share Tech Mono',monospace">${p.tribe}</div>
        </div>
      </div>`;
    for (let oi = 0; oi < p.events.length; oi++) {
      const evt = p.events[oi];
      const isGood = evt.type.includes('Good');
      pHtml += `<div class="sm-fight-row ${isGood ? 'sm-fight-good' : 'sm-fight-bad'}" style="color:${isGood ? 'var(--sport-green)' : 'var(--sport-red)'}">
        <span style="font-size:9px;font-family:'Share Tech Mono',monospace;color:rgba(255,255,255,0.3);width:70px;flex-shrink:0">${obstacleLabels[oi]}</span>
        <span>${evt.icon} ${evt.text}</span>
      </div>`;
    }
    pHtml += `<div style="display:flex;justify-content:flex-end;margin-top:6px;font-size:11px;font-family:'Share Tech Mono',monospace;color:${resultColor}">
      ${resultIcon} ${passCount}/3 obstacles cleared
    </div>
    </div></div>`;
    steps.push({ html: pHtml, player: p.name, tribe: p.tribe, score: p.score, seed: p.seed });
  }

  // Seeding reveal with matchup brackets
  let seedHtml = `<div class="sm-ev" style="border-left-color:var(--sport-gold);padding:14px">
    <div style="flex:1"><div class="sm-ev-badge gold" style="font-size:11px;padding:4px 12px">📋 FINAL SEEDINGS</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.5);margin:6px 0">${pick(SM_HOST.seedReveal)(host())}</div>`;
  for (const p of oc.players) {
    const passCount = p.events.filter(e => e.type.includes('Good')).length;
    const barPct = Math.min(100, (p.score / Math.max(0.1, ...oc.players.map(x => x.score))) * 100);
    seedHtml += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px">
      <span style="font-family:'Share Tech Mono',monospace;color:var(--sport-gold);width:28px;font-weight:700">#${p.seed}</span>
      ${_smPortrait(p.name, 24)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--sport-white)">${p.name}</span>
          <span style="font-size:9px;color:rgba(255,255,255,0.3)">${p.tribe}</span>
        </div>
        <div style="height:4px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden;margin-top:2px">
          <div style="height:100%;width:${barPct}%;background:${passCount === 3 ? 'var(--sport-gold)' : passCount >= 2 ? 'var(--sport-green)' : 'var(--sport-red)'};border-radius:2px"></div>
        </div>
      </div>
    </div>`;
  }
  // Show matchup preview
  if (sm.seedBoard?.length) {
    seedHtml += `<div style="margin-top:12px;padding-top:8px;border-top:1px solid rgba(234,179,8,0.1)">
      <div style="font-size:9px;letter-spacing:2px;color:var(--sport-gold);margin-bottom:6px;font-family:'Share Tech Mono',monospace">MATCHUP PREVIEW</div>`;
    const sportIcons = ['🥊', '🏸', '🤼', '🏀'];
    for (let i = 0; i < Math.min(sm.seedBoard.length, 4); i++) {
      const group = sm.seedBoard[i];
      seedHtml += `<div style="display:flex;align-items:center;gap:4px;padding:3px 0;font-size:10px">
        <span style="width:20px;text-align:center">${sportIcons[i] || '🏅'}</span>
        ${group.map(f => `<span style="display:flex;align-items:center;gap:2px">${_smSidePortrait(f.name, 16)}<span style="color:rgba(255,255,255,0.5)">${f.name.split(' ')[0]}</span></span>`).join('<span style="color:var(--sport-gold);margin:0 2px">vs</span>')}
      </div>`;
    }
    seedHtml += `</div>`;
  }
  seedHtml += `</div></div>`;
  steps.push({ html: seedHtml });

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="sm-step-obstacle-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="sm-controls-obstacle" class="sm-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="sm-btn-next" onclick="sportsMarathonRevealNext('sm-obstacle',${totalSteps})">GO!</button>
    <button class="sm-btn-all" onclick="sportsMarathonRevealAll('sm-obstacle',${totalSteps})">Reveal All</button>
  </div>
  <div id="sm-done-obstacle" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_smBadge('SEEDING COMPLETE', 'gold')}
  </div>`;

  return _smShell(`
    <div class="sm-hud">
      <div class="sm-hud-cell"><div class="sm-hud-val" style="color:var(--sport-gold)">🏃</div><div class="sm-hud-lbl">OBSTACLE</div></div>
      <div class="sm-hud-cell"><div class="sm-hud-val" style="color:var(--sport-gold)">${oc.players.length}</div><div class="sm-hud-lbl">ATHLETES</div></div>
    </div>
    <div class="sm-layout">
      <div class="sm-feed">${feed}${controls}</div>
      <div class="sm-sidebar" id="sm-sidebar-obstacle">${_smBuildObstacleSidebar(sm, revIdx + 1)}</div>
    </div>
  `, ep);
}

function _smBuildObstacleSidebar(sm, revCount) {
  const oc = sm.obstacleCourse;
  const playerOffset = 1; // intro step
  const playersRevealed = Math.max(0, Math.min(oc.players.length, revCount - playerOffset));
  const seedingRevealed = revCount > playerOffset + oc.players.length;

  let sb = `<div class="sm-side-sec">LEADERBOARD</div>`;

  if (playersRevealed === 0) {
    sb += `<div style="font-size:10px;color:rgba(255,255,255,0.15);padding:8px 0;text-align:center">Waiting for results...</div>`;
    return sb;
  }

  // Show revealed players sorted by score (live leaderboard)
  const revealed = oc.players.slice(0, playersRevealed).sort((a, b) => b.score - a.score);
  const unrevealed = oc.players.length - playersRevealed;

  for (let i = 0; i < revealed.length; i++) {
    const p = revealed[i];
    const passCount = p.events.filter(e => e.type.includes('Good')).length;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    const barColor = passCount === 3 ? 'var(--sport-gold)' : passCount >= 2 ? 'var(--sport-green)' : 'var(--sport-red)';
    sb += `<div style="display:flex;align-items:center;gap:5px;padding:4px 5px;margin-bottom:2px;background:rgba(0,0,0,0.15);border-radius:3px">
      <span style="font-size:10px;width:16px;text-align:center;flex-shrink:0">${medal || `<span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(255,255,255,0.2)">${i + 1}</span>`}</span>
      ${_smSidePortrait(p.name, 20)}
      <div style="flex:1;min-width:0">
        <div style="font-size:10px;color:var(--sport-white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
        <div style="height:3px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden;margin-top:1px">
          <div style="height:100%;width:${Math.min(100, (p.score / Math.max(0.1, ...revealed.map(x => x.score))) * 100)}%;background:${barColor};border-radius:2px"></div>
        </div>
      </div>
      <span style="font-size:9px;font-family:'Share Tech Mono',monospace;color:${barColor}">${passCount}/3</span>
    </div>`;
  }

  if (unrevealed > 0) {
    sb += `<div style="font-size:9px;color:rgba(255,255,255,0.15);text-align:center;padding:4px 0;font-family:'Share Tech Mono',monospace">${unrevealed} more to go...</div>`;
  }

  if (seedingRevealed) {
    sb += `<div class="sm-side-sec">FINAL SEED</div>`;
    for (const p of oc.players) {
      sb += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:9px">
        <span style="font-family:'Share Tech Mono',monospace;color:var(--sport-gold);width:20px">#${p.seed}</span>
        ${_smSidePortrait(p.name, 14)}
        <span style="color:rgba(255,255,255,0.5)">${p.name.split(' ')[0]}</span>
      </div>`;
    }
  }

  return sb;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 2.5: HALFTIME
// ══════════════════════════════════════════════════════════════
export function rpBuildSportsMarathonHalftime(ep) {
  const sm = ep.sportsMarathon;
  if (!sm || !sm.halftimeEvents?.length) return '';
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'sm-halftime';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const steps = [];

  steps.push({ html: `<div class="sm-ev" style="border-left-color:var(--sport-gold);padding:14px">
    <div style="font-size:28px">⏱️</div>
    <div style="flex:1"><div class="sm-ev-badge gold" style="font-size:11px;padding:4px 12px">HALFTIME</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:6px">The teams regroup between the obstacle course and the sports. Tensions rise and bonds form...</div></div>
  </div>` });

  for (const evt of sm.halftimeEvents) {
    const badgeColor = evt.badgeClass === 'red' ? 'var(--sport-red)' : evt.badgeClass === 'green' ? 'var(--sport-green)' : evt.badgeClass === 'amber' ? '#d97706' : 'var(--sport-gold)';
    const borderColor = evt.badgeClass === 'red' ? 'rgba(239,68,68,0.2)' : evt.badgeClass === 'green' ? 'rgba(22,163,74,0.2)' : 'rgba(234,179,8,0.15)';
    steps.push({ html: `<div class="sm-ev sm-fight-drama" style="border-left-color:${borderColor};padding:12px">
      <div style="flex:1">
      <div style="display:inline-block;padding:2px 8px;font-size:8px;font-family:'Share Tech Mono',monospace;letter-spacing:2px;border-radius:2px;margin-bottom:6px;border:1px solid ${badgeColor};color:${badgeColor};background:rgba(0,0,0,0.2)">${evt.badgeText}</div>
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div style="display:flex;gap:3px;flex-shrink:0">${(evt.players || []).map(n => _smPortrait(n, 28)).join('')}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.7);font-style:italic;line-height:1.5">${evt.text}</div>
      </div></div>
    </div>` });
  }

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="sm-step-halftime-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="sm-controls-halftime" class="sm-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="sm-btn-next" onclick="sportsMarathonRevealNext('sm-halftime',${totalSteps})">NEXT</button>
    <button class="sm-btn-all" onclick="sportsMarathonRevealAll('sm-halftime',${totalSteps})">Reveal All</button>
  </div>
  <div id="sm-done-halftime" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_smBadge('BACK TO THE GAMES', 'gold')}
  </div>`;

  return _smShell(`
    <div class="sm-hud">
      <div class="sm-hud-cell"><div class="sm-hud-val" style="color:var(--sport-gold)">⏱️</div><div class="sm-hud-lbl">HALFTIME</div></div>
      <div class="sm-hud-cell"><div class="sm-hud-val" style="color:var(--sport-gold)">${sm.halftimeEvents.length}</div><div class="sm-hud-lbl">EVENTS</div></div>
    </div>
    <div class="sm-layout">
      <div class="sm-feed">${feed}${controls}</div>
      <div class="sm-sidebar" id="sm-sidebar-halftime">
        <div class="sm-side-sec">DRAMA LOG</div>
        ${sm.halftimeEvents.map((e, i) => {
          const shown = i + 1 < revIdx + 1;
          return `<div style="padding:3px;margin-bottom:2px;font-size:9px;color:${shown ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'};font-family:'Share Tech Mono',monospace">${shown ? e.badgeText : '???'}</div>`;
        }).join('')}
      </div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 3: SPORTS (one screen for all 4 + tiebreaker)
// ══════════════════════════════════════════════════════════════
export function rpBuildSportsMarathonSports(ep) {
  const sm = ep.sportsMarathon;
  if (!sm || !sm.sports.length) return '';
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'sm-sports';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const steps = [];

  for (let si = 0; si < sm.sports.length; si++) {
    const sport = sm.sports[si];
    const sportCss = sport.sportKey === 'boxing' ? 'sm-boxing' : sport.sportKey === 'badminton' ? 'sm-badminton' : sport.sportKey === 'wrestling' ? 'sm-wrestling' : 'sm-slamdunk';

    // VS Splash + fight events
    let rdHtml = `<div class="sm-vs-splash">
      <div style="font-size:10px;color:var(--sport-gold);letter-spacing:3px;margin-bottom:4px">${sport.label.icon} ${sport.label.name}</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:10px">${sport.label.subtitle}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">`;
    for (let fi = 0; fi < sport.fighters.length; fi++) {
      const f = sport.fighters[fi];
      rdHtml += `<div class="sm-vs-fighter">
        ${_smPortrait(f.name, 44)}
        <div style="font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:2px;color:var(--sport-white)">${f.name}</div>
        <div style="font-size:8px;color:var(--sport-gold)">${f.tribe} · Seed #${f.seed}</div>
      </div>`;
      if (fi < sport.fighters.length - 1) rdHtml += `<div class="sm-vs-text">VS</div>`;
    }
    rdHtml += `</div></div>`;

    // Host intro
    rdHtml += `<div class="sm-fight-row sm-fight-drama" style="color:var(--sport-gold)">
      <span>📢 ${pick(SM_HOST.sportIntro[sport.sportKey])(host())}</span>
    </div>`;

    // Fight events
    rdHtml += `<div style="padding:4px 0">`;
    for (const evt of sport.events) {
      const isGood = evt.phase === 'action' && evt.icon === '✅';
      const isBad = evt.phase === 'action' && evt.icon === '❌';
      const isClimax = evt.phase === 'climax';
      const isDrama = evt.phase === 'trash';
      const rowClass = isClimax ? 'sm-fight-row sm-fight-climax' : isGood ? 'sm-fight-row sm-fight-good' : isBad ? 'sm-fight-row sm-fight-bad' : isDrama ? 'sm-fight-row sm-fight-neutral' : 'sm-fight-row sm-fight-neutral';
      const color = isClimax ? 'var(--sport-green)' : isGood ? 'var(--sport-green)' : isBad ? 'var(--sport-red)' : isDrama ? '#a78bfa' : 'rgba(255,255,255,0.6)';
      rdHtml += `<div class="${rowClass}" style="color:${color}">
        ${evt.player ? _smPortrait(evt.player, isClimax ? 28 : 22) : '<span style="width:22px;flex-shrink:0"></span>'}
        <span style="font-size:${isClimax ? '13px' : '12px'}">${evt.icon} ${evt.text}</span>
      </div>`;
    }
    rdHtml += `</div>`;

    // Winner bar
    rdHtml += `<div style="text-align:center;padding:8px 0;font-size:12px">
      <span style="color:var(--sport-green);font-family:'Share Tech Mono',monospace;letter-spacing:2px">🏆 ${sport.winner.name} (${sport.winner.tribe}) WINS ${sport.label.name}</span>
    </div>`;

    // Drama between sports
    if (sport.dramaEvents?.length) {
      for (const de of sport.dramaEvents) {
        rdHtml += `<div class="sm-fight-row sm-fight-drama" style="color:${de.type === 'soreLoss' ? 'var(--sport-red)' : de.type === 'victory' ? 'var(--sport-green)' : 'var(--sport-gold)'}">
          ${de.player ? _smPortrait(de.player, 20) : '<span style="width:20px"></span>'}
          <span>${de.icon} ${de.text}</span>
        </div>`;
      }
    }

    steps.push({ html: `<div class="sm-ev ${sportCss}" style="border-left-color:var(--sport-gold);padding:14px;overflow:hidden">
      <div style="flex:1">${rdHtml}</div>
    </div>` });
  }

  // Cheerleading tiebreaker — full performance per team
  if (sm.cheerleader) {
    // Intro
    let cheerIntro = `<div class="sm-vs-splash">
      <div style="font-size:12px;color:${sm.cheerleader.tbType === 'bottom' ? 'var(--sport-red)' : 'var(--sport-gold)'};letter-spacing:3px;margin-bottom:6px;font-family:'Share Tech Mono',monospace">📣 CHEERLEADING TIEBREAKER</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:10px">${sm.cheerleader.tbType === 'top' ? 'Cheer for IMMUNITY' : 'Loser goes to TRIBAL COUNCIL'}</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:6px">${pick(SM_HOST.cheerIntro)(host())}</div>
    </div>`;
    steps.push({ html: `<div class="sm-ev sm-cheer" style="border-left-color:var(--sport-gold);padding:14px;overflow:hidden">
      <div style="flex:1">${cheerIntro}</div>
    </div>` });

    // One step per team performance
    for (const r of sm.cheerleader.results) {
      let perfHtml = `<div class="sm-ev sm-cheer" style="border-left-color:var(--sport-gold);padding:14px;overflow:hidden">
        <div style="flex:1">
        <div class="sm-ev-badge ${r.isGood ? 'green' : 'red'}" style="font-size:11px;padding:4px 12px;margin-bottom:8px">📣 ${r.tribe}'s PERFORMANCE</div>
        <div style="display:flex;gap:3px;margin-bottom:8px">${r.members.map(n => _smPortrait(n, 28)).join('')}</div>`;

      for (const evt of r.events) {
        const isGood = evt.type === 'memberGood' || evt.type === 'pyramid' || evt.type === 'forHost';
        const isBad = evt.type === 'memberBad';
        const isJudge = evt.type === 'judge';
        const color = isJudge ? 'var(--sport-gold)' : isGood ? 'var(--sport-green)' : isBad ? 'var(--sport-red)' : 'rgba(255,255,255,0.6)';
        const rowClass = isJudge ? 'sm-fight-climax' : isGood ? 'sm-fight-row sm-fight-good' : isBad ? 'sm-fight-row sm-fight-bad' : 'sm-fight-row sm-fight-neutral';

        perfHtml += `<div class="${rowClass}" style="color:${color}">
          ${evt.player ? _smPortrait(evt.player, 22) : '<span style="width:22px;flex-shrink:0"></span>'}
          <span style="font-size:${isJudge ? '13px' : '12px'}">${evt.icon} ${evt.text}</span>
        </div>`;
      }

      perfHtml += `</div></div>`;
      steps.push({ html: perfHtml });
    }

    // Winner reveal
    steps.push({ html: `<div class="sm-ev sm-cheer" style="border-left-color:var(--sport-green);padding:14px;text-align:center;overflow:hidden">
      <div style="flex:1">
        <div class="sm-ev-badge green" style="font-size:12px;padding:4px 14px">📣 TIEBREAKER RESULT</div>
        <div style="font-size:18px;color:var(--sport-green);font-family:'Bungee Shade',sans-serif;letter-spacing:3px;margin-top:8px">${sm.cheerleader.winner}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px">wins the cheerleading tiebreaker!</div>
        ${sm.cheerleader.results.map(r => `<div style="display:flex;justify-content:center;gap:6px;margin-top:6px;font-family:'Share Tech Mono',monospace;font-size:11px">
          <span style="color:${r.tribe === sm.cheerleader.winner ? 'var(--sport-green)' : 'var(--sport-red)'}">${r.tribe}: ${r.judgeScore}/10${r.cheeredForHost ? ' ⭐' : ''}</span>
        </div>`).join('')}
      </div>
    </div>` });
  }

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="sm-step-sports-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="sm-controls-sports" class="sm-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="sm-btn-next" onclick="sportsMarathonRevealNext('sm-sports',${totalSteps})">PLAY!</button>
    <button class="sm-btn-all" onclick="sportsMarathonRevealAll('sm-sports',${totalSteps})">Reveal All</button>
  </div>
  <div id="sm-done-sports" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_smBadge('SPORTS COMPLETE', 'gold')}
  </div>`;

  // Sidebar — scoreboard
  const sportsRevealed = Math.max(0, revIdx + 1);
  let sidebar = _smBuildSportsSidebar(sm, sportsRevealed);

  return _smShell(`
    <div class="sm-hud">
      <div class="sm-hud-cell"><div class="sm-hud-val" style="color:var(--sport-gold)">🏆</div><div class="sm-hud-lbl">SPORTS</div></div>
      <div class="sm-hud-cell"><div class="sm-hud-val" style="color:var(--sport-gold)">${sm.sports.length}</div><div class="sm-hud-lbl">EVENTS</div></div>
    </div>
    <div class="sm-layout">
      <div class="sm-feed">${feed}${controls}</div>
      <div class="sm-sidebar" id="sm-sidebar-sports">${sidebar}</div>
    </div>
  `, ep);
}

function _smBuildSportsSidebar(sm, sportsRevealed) {
  // Scoreboard
  const revScores = {};
  for (const tribe of Object.keys(sm.tribeScores)) revScores[tribe] = 0;
  for (let i = 0; i < Math.min(sportsRevealed, sm.sports.length); i++) {
    revScores[sm.sports[i].winner.tribe] += 1;
  }
  if (sportsRevealed > sm.sports.length && sm.cheerleader) {
    if (sm.cheerleader.tbType === 'top') revScores[sm.cheerleader.winner] += 2;
    else revScores[sm.cheerleader.loser] -= 1;
  }

  let sb = `<div class="sm-side-sec">SCOREBOARD</div>
    <div class="sm-scoreboard">`;
  const sorted = Object.entries(revScores).sort((a, b) => b[1] - a[1]);
  for (const [tribe, score] of sorted) {
    sb += `<div class="sm-score-row">
      <span style="color:var(--sport-gold);font-size:12px">${tribe}</span>
      <span style="color:var(--sport-white);font-size:16px;font-weight:700">${score}</span>
    </div>`;
  }
  sb += `</div>`;

  // Sport results
  sb += `<div class="sm-side-sec">RESULTS</div>`;
  for (let i = 0; i < sm.sports.length; i++) {
    const sport = sm.sports[i];
    const shown = i < sportsRevealed;
    sb += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;opacity:${shown ? 1 : 0.3}">
      <span style="font-size:14px">${sport.label.icon}</span>
      ${shown ? `${_smSidePortrait(sport.winner.name, 16)} <span style="color:var(--sport-green)">${sport.winner.name}</span> <span style="font-size:8px;color:rgba(255,255,255,0.25)">${sport.winner.tribe}</span>` : `<span style="color:rgba(255,255,255,0.2)">???</span>`}
    </div>`;
  }
  if (sm.cheerleader) {
    const shown = sportsRevealed > sm.sports.length;
    sb += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;opacity:${shown ? 1 : 0.3}">
      <span style="font-size:14px">📣</span>
      ${shown ? `<span style="color:var(--sport-green)">${sm.cheerleader.winner}</span>` : `<span style="color:rgba(255,255,255,0.2)">???</span>`}
    </div>`;
  }

  // Benched players
  const hasBenched = Object.values(sm.benchDecisions).some(d => d.benched?.length);
  if (hasBenched) {
    sb += `<div class="sm-side-sec">BENCHED</div>`;
    for (const [tribe, decision] of Object.entries(sm.benchDecisions)) {
      if (!decision.benched?.length) continue;
      for (const name of decision.benched) {
        sb += `<div style="display:flex;align-items:center;gap:5px;padding:3px 5px;margin-bottom:2px;background:rgba(0,0,0,0.1);border-radius:3px;border:1px dashed rgba(255,255,255,0.06);opacity:0.45">
          ${_smSidePortrait(name, 18)}
          <span style="font-size:9px;color:rgba(255,255,255,0.4)">${name.split(' ')[0]}</span>
          <span style="font-size:7px;font-family:'Share Tech Mono',monospace;color:rgba(255,255,255,0.15);letter-spacing:1px">${tribe}</span>
        </div>`;
      }
    }
  }

  return sb;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 4: RESULTS
// ══════════════════════════════════════════════════════════════
export function rpBuildSportsMarathonResults(ep) {
  const sm = ep.sportsMarathon;
  if (!sm) return '';

  const sorted = Object.entries(sm.tribeScores).sort((a, b) => b[1] - a[1]);
  const scores = ep.chalMemberScores || {};

  let content = `<div style="text-align:center;padding:30px 20px;position:relative;z-index:6">
    <div style="font-size:10px;letter-spacing:5px;color:rgba(234,179,8,0.4);text-transform:uppercase;margin-bottom:8px">FINAL RESULTS</div>
    <div style="font-family:'Bungee Shade',sans-serif;font-size:28px;color:var(--sport-gold);text-shadow:0 0 20px rgba(234,179,8,0.3);letter-spacing:4px;margin-bottom:6px">${sm.winner}</div>
    <div style="font-size:14px;color:var(--sport-green);letter-spacing:3px;margin-bottom:20px">WINS THE SPORTS MARATHON</div>
  </div>`;

  content += `<div style="display:flex;gap:14px;justify-content:center;padding:0 14px 20px;flex-wrap:wrap;position:relative;z-index:6">`;
  for (const [tribe, score] of sorted) {
    const isWinner = tribe === sm.winner;
    const isLoser = tribe === sm.loser;
    const borderColor = isWinner ? 'var(--sport-green)' : isLoser ? 'var(--sport-red)' : 'rgba(234,179,8,0.15)';
    const status = isWinner ? 'IMMUNE' : isLoser ? 'TRIBAL COUNCIL' : 'SAFE';
    const statusColor = isWinner ? 'var(--sport-green)' : isLoser ? 'var(--sport-red)' : 'rgba(255,255,255,0.4)';

    const ocTribe = sm.obstacleCourse.players.filter(p => p.tribe === tribe);
    const members = ocTribe.map(p => p.name);

    content += `<div style="flex:1;min-width:220px;max-width:380px;background:rgba(0,0,0,0.3);border:2px solid ${borderColor};border-radius:8px;padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div style="font-family:'Bungee Shade',sans-serif;font-size:16px;color:${isWinner ? 'var(--sport-green)' : isLoser ? 'var(--sport-red)' : 'var(--sport-gold)'};letter-spacing:2px">${tribe}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:14px;color:var(--sport-gold)">🏆 ${score} wins</div>
      </div>
      <div style="font-size:8px;letter-spacing:2px;color:${statusColor};margin-bottom:10px;font-family:'Share Tech Mono',monospace">${status}</div>`;

    for (const name of members.sort((a, b) => (scores[b] || 0) - (scores[a] || 0))) {
      const memberScore = scores[name] || 0;
      // Find sport wins
      const sportWins = sm.sports.filter(s => s.winner.name === name).length;
      const seed = sm.obstacleCourse.players.find(p => p.name === name)?.seed || '?';

      content += `<div style="display:flex;align-items:center;gap:8px;padding:4px 6px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:4px">
        ${_smPortrait(name, 26)}
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;color:rgba(255,255,255,0.85)">${name}</div>
          <div style="display:flex;gap:6px;font-size:9px;font-family:'Share Tech Mono',monospace">
            <span style="color:rgba(255,255,255,0.3)">#${seed}</span>
            ${sportWins > 0 ? `<span style="color:var(--sport-green)">🏆${sportWins}</span>` : ''}
          </div>
        </div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--sport-gold);font-weight:700">${memberScore}</div>
      </div>`;
    }
    content += `</div>`;
  }
  content += `</div>`;

  return _smShell(content, ep);
}

// ══════════════════════════════════════════════════════════════
// REVEAL FUNCTIONS
// ══════════════════════════════════════════════════════════════
function _smUpdateSidebar(screenKey, revIdx) {
  const suffix = screenKey.replace('sm-', '');
  const sideEl = document.getElementById(`sm-sidebar-${suffix}`);
  if (!sideEl) return;
  const latestEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const sm = latestEp?.sportsMarathon;
  if (!sm) return;
  if (suffix === 'obstacle') {
    sideEl.innerHTML = _smBuildObstacleSidebar(sm, revIdx + 1);
  } else if (suffix === 'sports') {
    sideEl.innerHTML = _smBuildSportsSidebar(sm, revIdx + 1);
  }
}

export function sportsMarathonRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('sm-', '');
  const el = document.getElementById(`sm-step-${suffix}-${state.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`sm-controls-${suffix}`);
    const done = document.getElementById(`sm-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _smUpdateSidebar(screenKey, state.idx);
}

export function sportsMarathonRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('sm-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`sm-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`sm-controls-${suffix}`);
  const done = document.getElementById(`sm-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  _smUpdateSidebar(screenKey, state.idx);
}
