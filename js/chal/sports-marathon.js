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
const OC_EVENTS = {
  pushGood: [
    (p, pr) => `${p} lowered ${pr.posAdj} shoulder and DROVE Chef across the field. Impressive.`,
    (p, pr) => `${p} dug in and pushed like a truck. Chef slid back on his heels.`,
    (p, pr) => `${p} exploded off the line. Chef barely kept his footing.`,
  ],
  pushBad: [
    (p, pr) => `${p} pushed with everything ${pr.sub} had. Chef didn't move. "That all you got?"`,
    (p, pr) => `${p} bounced off Chef like a tennis ball. "Next!"`,
    (p, pr) => `${p} slipped and face-planted into Chef's chest. Awkward.`,
  ],
  tireGood: [
    (p, pr) => `${p} danced through the tires like an NFL running back.`,
    (p, pr) => `${p} high-stepped through the tires cleanly. Perfect footwork.`,
    (p, pr) => `${p} weaved through the tires without a single stumble.`,
  ],
  tireBad: [
    (p, pr) => `${p} got ${pr.posAdj} foot stuck in a tire. "It's eating my shoe!"`,
    (p, pr) => `${p} stepped on a mousetrap hidden in a tire. "YOWCH!"`,
    (p, pr) => `${p} tripped on the second tire and went face-first into the third.`,
  ],
  mudGood: [
    (p, pr) => `${p} army-crawled through the mud like a soldier. Clean and fast.`,
    (p, pr) => `${p} slithered through the mud under the wire. Born for this.`,
    (p, pr) => `${p} powered through the mud pit. Dirty but fast.`,
  ],
  mudBad: [
    (p, pr) => `${p} got stuck in the mud halfway through. "I can't... move... my legs..."`,
    (p, pr) => `${p} panicked and stood up into the barbed wire. "OW OW OW!" Back down.`,
    (p, pr) => `${p} crawled so slowly a snail passed ${pr.obj}. ${host()} timed it.`,
  ],
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

      // Push drill
      const pushScore = s.physical * 0.03 + s.endurance * 0.02 + noise(0.3);
      if (pushScore > 0.25) {
        events.push({ type: 'pushGood', icon: '💪', text: pick(OC_EVENTS.pushGood)(name, pr) });
      } else {
        events.push({ type: 'pushBad', icon: '😤', text: pick(OC_EVENTS.pushBad)(name, pr) });
      }

      // Tire run
      const tireScore = s.physical * 0.02 + s.endurance * 0.02 + s.intuition * 0.01 + noise(0.3);
      if (tireScore > 0.24) {
        events.push({ type: 'tireGood', icon: '👟', text: pick(OC_EVENTS.tireGood)(name, pr) });
      } else {
        events.push({ type: 'tireBad', icon: '🪤', text: pick(OC_EVENTS.tireBad)(name, pr) });
      }

      // Mud crawl
      const mudScore = s.endurance * 0.03 + s.physical * 0.02 + noise(0.3);
      if (mudScore > 0.26) {
        events.push({ type: 'mudGood', icon: '🐍', text: pick(OC_EVENTS.mudGood)(name, pr) });
      } else {
        events.push({ type: 'mudBad', icon: '🤢', text: pick(OC_EVENTS.mudBad)(name, pr) });
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

  // Bench drama
  for (const t of tribeMembers) {
    const benched = result.benchDecisions[t.name]?.benched || [];
    for (const name of benched) {
      const pr = pronouns(name);
      const wantedToFight = pStats(name).boldness >= 5;
      if (wantedToFight) {
        breakEvents.push({ type: 'benchAngry', player: name, tribe: t.name, badgeText: 'BENCHED', badgeClass: 'red',
          text: `${name} ranked too low to compete. ${pr.Sub} kicked the bench. "This is RIGGED!"` });
        const teammate = t.members.find(n => n !== name);
        if (teammate) addBond(name, teammate, -0.2);
      } else {
        breakEvents.push({ type: 'benchRelief', player: name, tribe: t.name, badgeText: 'BENCHED', badgeClass: 'amber',
          text: `${name} didn't make the cut. ${pr.Sub} shrugged. "More watching, less pain. Fine by me."` });
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
    // Use seed group matching sport index (wrap if more sports than seed groups)
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

  // Calculate fight scores
  for (const f of fighters) {
    const s = pStats(f.name);
    let score;
    if (sportKey === 'boxing') {
      score = s.physical * 0.03 + s.mental * 0.03 + s.endurance * 0.02 + noise(0.35);
    } else if (sportKey === 'badminton') {
      score = s.intuition * 0.04 + s.strategic * 0.03 + noise(0.35);
    } else if (sportKey === 'wrestling') {
      score = s.physical * 0.04 + s.boldness * 0.03 + noise(0.35);
    } else {
      score = s.physical * 0.03 + s.boldness * 0.03 + s.social * 0.02 + noise(0.35);
    }
    scores[f.name] = score;
  }

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

  // Sport-specific narration per fighter
  const sportTexts = SPORT_EVENTS[sportKey];
  for (const f of fighters) {
    const pr = pronouns(f.name);
    const isGood = scores[f.name] >= Math.max(...Object.values(scores)) * 0.7;
    if (isGood) {
      events.push({ phase: 'action', player: f.name, tribe: f.tribe, icon: '✅',
        text: pick(sportTexts.good)(f.name, pr) });
      ep.chalMemberScores[f.name] = (ep.chalMemberScores[f.name] || 0) + 1;
    } else {
      events.push({ phase: 'action', player: f.name, tribe: f.tribe, icon: '❌',
        text: pick(sportTexts.bad)(f.name, pr) });
    }
  }

  // Trash talk (~30%)
  if (Math.random() < 0.3) {
    const talker = pick(fighters);
    const target = pick(fighters.filter(f => f.name !== talker.name));
    if (target) {
      const s = pStats(talker.name);
      const trashCheck = s.social * 0.04 + (10 - s.temperament) * 0.03 + noise(0.25);
      if (trashCheck > 0.22) {
        events.push({ phase: 'trash', player: talker.name, tribe: talker.tribe, icon: '🗯️',
          text: pick(SPORT_EVENTS.trashTalk)(talker.name, target.name) });
        scores[target.name] -= 0.08;
        ep.chalMemberScores[talker.name] = (ep.chalMemberScores[talker.name] || 0) + 1;
      } else {
        events.push({ phase: 'trash', player: talker.name, tribe: talker.tribe, icon: '🗯️',
          text: pick(SPORT_EVENTS.trashTalkFail)(talker.name, target.name) });
        scores[talker.name] -= 0.06;
      }
    }
  }

  // Rank
  const ranked = fighters.map(f => ({ ...f, score: scores[f.name] })).sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const loser = ranked[ranked.length - 1];

  // Winner event
  const finishKey = sportKey === 'boxing' ? 'knockout' : sportKey === 'badminton' ? 'winner' : sportKey === 'wrestling' ? 'pin' : 'showboat';
  if (sportTexts[finishKey]) {
    events.push({ phase: 'climax', player: winner.name, tribe: winner.tribe, icon: '👑',
      text: pick(sportTexts[finishKey])(winner.name, loser.name) });
  }
  ep.chalMemberScores[winner.name] = (ep.chalMemberScores[winner.name] || 0) + 3;

  return { fighters, events, rankings: ranked, winner, loser: ranked[ranked.length - 1] };
}

function _simulateCheerleading(ep, tribeMembers, tiedTribes, tbType, result) {
  const cheerResults = [];

  for (const tribeName of tiedTribes) {
    const t = tribeMembers.find(tm => tm.name === tribeName);
    const members = t.members;
    let teamScore = members.reduce((s, n) => {
      const st = pStats(n);
      return s + st.social * 0.04 + st.loyalty * 0.03 + noise(0.25);
    }, 0) / members.length;

    // Random chance to cheer for the host (~15%)
    const cheeredForHost = Math.random() < 0.15;
    if (cheeredForHost) teamScore += 0.15;

    const isGood = teamScore > 0.3;
    let text;
    if (cheeredForHost) {
      text = pick(SPORT_EVENTS.cheer.forHost)(tribeName, host());
    } else if (isGood) {
      text = pick(SPORT_EVENTS.cheer.good)(tribeName);
    } else {
      text = pick(SPORT_EVENTS.cheer.bad)(tribeName);
    }

    cheerResults.push({ tribe: tribeName, score: teamScore, cheeredForHost, text, isGood });
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
  for (const sport of sm.sports) {
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

  const steps = [];

  steps.push({ html: `<div class="sm-ev" style="border-left-color:var(--sport-gold);padding:14px">
    <div style="font-size:28px">🏃</div>
    <div style="flex:1"><div class="sm-ev-badge gold" style="font-size:11px;padding:4px 12px">OBSTACLE COURSE — SEEDING</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:6px">${pick(SM_HOST.obstacleIntro)(host())}</div></div>
  </div>` });

  // Group by tribe
  const tribeGroups = {};
  for (const p of oc.players) {
    if (!tribeGroups[p.tribe]) tribeGroups[p.tribe] = [];
    tribeGroups[p.tribe].push(p);
  }

  for (const [tribe, members] of Object.entries(tribeGroups)) {
    let tHtml = `<div class="sm-ev" style="border-left-color:var(--sport-green);padding:14px">
      <div style="flex:1"><div class="sm-ev-badge green" style="font-size:11px;padding:4px 12px">🏃 ${tribe}</div>`;
    for (const p of members) {
      for (const evt of p.events) {
        const isGood = evt.type.includes('Good');
        tHtml += `<div class="sm-fight-row ${isGood ? 'sm-fight-good' : 'sm-fight-bad'}" style="color:${isGood ? 'var(--sport-green)' : 'var(--sport-red)'}">
          ${_smPortrait(p.name, 22)} <span>${evt.icon} ${evt.text}</span>
        </div>`;
      }
    }
    tHtml += `</div></div>`;
    steps.push({ html: tHtml });
  }

  // Seeding reveal
  let seedHtml = `<div class="sm-ev" style="border-left-color:var(--sport-gold);padding:14px">
    <div style="flex:1"><div class="sm-ev-badge gold" style="font-size:11px;padding:4px 12px">📋 SEEDING RESULTS</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.5);margin:6px 0">${pick(SM_HOST.seedReveal)(host())}</div>`;
  for (const p of oc.players) {
    seedHtml += `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:12px">
      <span style="font-family:'Share Tech Mono',monospace;color:var(--sport-gold);width:24px">#${p.seed}</span>
      ${_smPortrait(p.name, 22)}
      <span style="color:var(--sport-white)">${p.name}</span>
      <span style="font-size:10px;color:rgba(255,255,255,0.3)">(${p.tribe})</span>
    </div>`;
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
      <div class="sm-sidebar" id="sm-sidebar-obstacle"><div class="sm-side-sec">SEEDING</div><div style="font-size:9px;color:rgba(255,255,255,0.2)">Reveal to see rankings</div></div>
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

  for (const sport of sm.sports) {
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

  // Cheerleading tiebreaker
  if (sm.cheerleader) {
    let cheerHtml = `<div class="sm-vs-splash">
      <div style="font-size:10px;color:${sm.cheerleader.tbType === 'bottom' ? 'var(--sport-red)' : 'var(--sport-gold)'};letter-spacing:3px;margin-bottom:4px">📣 CHEERLEADING TIEBREAKER</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:10px">${sm.cheerleader.tbType === 'top' ? 'Cheer for IMMUNITY' : 'Loser goes to TRIBAL COUNCIL'}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:10px">${pick(SM_HOST.cheerIntro)(host())}</div>
    </div>`;
    for (const r of sm.cheerleader.results) {
      const isWinner = r.tribe === sm.cheerleader.winner;
      cheerHtml += `<div class="sm-fight-row ${isWinner ? 'sm-fight-good' : 'sm-fight-bad'}" style="color:${isWinner ? 'var(--sport-green)' : 'var(--sport-red)'}">
        <span style="font-family:'Share Tech Mono',monospace;width:50px;color:var(--sport-gold)">${r.tribe}</span>
        <span>${r.cheeredForHost ? '⭐' : isWinner ? '✅' : '❌'} ${r.text}</span>
      </div>`;
    }
    cheerHtml += `<div style="text-align:center;padding:8px 0;font-size:12px">
      <span style="color:var(--sport-green);font-family:'Share Tech Mono',monospace;letter-spacing:2px">📣 ${sm.cheerleader.winner} WINS THE TIEBREAKER</span>
    </div>`;
    steps.push({ html: `<div class="sm-ev sm-cheer" style="border-left-color:var(--sport-gold);padding:14px;overflow:hidden">
      <div style="flex:1">${cheerHtml}</div>
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
      ${shown ? `${_smSidePortrait(sport.winner.name, 16)} <span style="color:var(--sport-green)">${sport.winner.name}</span>` : `<span style="color:rgba(255,255,255,0.2)">???</span>`}
    </div>`;
  }
  if (sm.cheerleader) {
    const shown = sportsRevealed > sm.sports.length;
    sb += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;opacity:${shown ? 1 : 0.3}">
      <span style="font-size:14px">📣</span>
      ${shown ? `<span style="color:var(--sport-green)">${sm.cheerleader.winner}</span>` : `<span style="color:rgba(255,255,255,0.2)">???</span>`}
    </div>`;
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
  if (suffix === 'sports') {
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
