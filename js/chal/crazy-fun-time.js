// js/chal/crazy-fun-time.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function host() { return seasonConfig?.hostName || 'Chris'; }

// ══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════

const ANIMALS = [
  { type:'panda', icon:'🐼' },
  { type:'tanuki', icon:'🦝' },
  { type:'monkey', icon:'🐒' },
  { type:'red-panda', icon:'🦊' },
  { type:'cat', icon:'🐱' },
  { type:'rabbit', icon:'🐰' },
  { type:'otter', icon:'🦦' },
  { type:'hamster', icon:'🐹' },
];

const ANIMAL_NAMES = {
  panda: ['Ting Ting','Bao Bao','Dumpling','Mochi','Bamboo'],
  tanuki: ['Tantan','Mochi','Rascal','Noodle','Sake'],
  monkey: ['Kiko','Bananas','Chibi','Ringo','Peach'],
  'red-panda': ['Rumi','Maple','Cinnamon','Berry','Rusty'],
  cat: ['Miso','Sashimi','Wasabi','Tofu','Matcha'],
  rabbit: ['Dango','Muffin','Cotton','Snowball','Bun'],
  otter: ['Splash','Kelp','Pebble','River','Slick'],
  hamster: ['Nugget','Cheeks','Squeaky','Pip','Tiny'],
};

const TEMPERAMENTS = ['docile','nervous','aggressive'];

const CHEF_PREFERENCES = [
  { id:'explosions', label:'Explosions & Spectacle', desc:'Chef wants BIG, LOUD, and FIERY' },
  { id:'humor', label:'Comedy & Absurdity', desc:'Chef wants to LAUGH' },
  { id:'heart', label:'Sentimentality & Heart', desc:'Chef wants to FEEL something' },
  { id:'food', label:'Food Closeups', desc:'Chef wants the candy to look DELICIOUS' },
  { id:'action', label:'Action & Violence', desc:'Chef wants FIGHTING and STUNTS' },
  { id:'weird', label:'Pure Weirdness', desc:'Chef wants something he\'s NEVER seen before' },
];

const PITCH_CONCEPTS = {
  mastermind: [
    { idea:'Spy thriller — secret agent uses candy as a hidden weapon', tags:['action'] },
    { idea:'Chess match where every piece is a candy — checkmate wins the game', tags:['weird'] },
    { idea:'Corporate takeover montage — candy is the secret to success', tags:['humor'] },
  ],
  schemer: [
    { idea:'Heist movie — crew steals candy from a vault', tags:['action'] },
    { idea:'Double-cross scene where candy reveals the traitor', tags:['weird'] },
    { idea:'Mystery dinner where candy is the crucial evidence', tags:['humor'] },
  ],
  hothead: [
    { idea:'Monster truck rally — trucks made of candy crash into each other', tags:['explosions'] },
    { idea:'Boxing match where the winner gets the candy belt', tags:['action'] },
    { idea:'Demolition derby with candy-powered explosions', tags:['explosions'] },
  ],
  'challenge-beast': [
    { idea:'Extreme sports montage — candy fuels impossible stunts', tags:['action'] },
    { idea:'Olympic training montage powered by candy energy', tags:['heart'] },
    { idea:'Obstacle course where candy gives you superpowers', tags:['humor'] },
  ],
  'social-butterfly': [
    { idea:'Best friends sharing candy — heartwarming montage', tags:['heart'] },
    { idea:'Party scene where candy brings everyone together', tags:['humor'] },
    { idea:'Wedding where candy replaces the cake', tags:['food'] },
  ],
  'loyal-soldier': [
    { idea:'Soldier comes home from war — candy from family waiting', tags:['heart'] },
    { idea:'Team rally — candy is what keeps the squad together', tags:['action'] },
    { idea:'Campfire story where candy saves the day', tags:['heart'] },
  ],
  wildcard: [
    { idea:'Candy comes alive and goes on an adventure', tags:['weird'] },
    { idea:'Time travel — candy is the fuel for the machine', tags:['explosions'] },
    { idea:'Alien invasion — candy is Earth\'s only weapon', tags:['weird'] },
  ],
  'chaos-agent': [
    { idea:'Everything explodes for no reason. Candy is there. Why? WHO CARES', tags:['explosions'] },
    { idea:'Fever dream music video — just candy and chaos', tags:['weird'] },
    { idea:'Rube Goldberg machine that destroys everything to deliver one candy', tags:['explosions'] },
  ],
  floater: [
    { idea:'Relaxing beach scene — candy and chill vibes', tags:['heart'] },
    { idea:'Simple taste-test reaction shots — keep it easy', tags:['food'] },
    { idea:'Sunset picnic with candy — peaceful and pretty', tags:['food'] },
  ],
  underdog: [
    { idea:'Kid who can\'t do anything right — until they eat the candy', tags:['heart'] },
    { idea:'Last-place team eats candy and wins the championship', tags:['action'] },
    { idea:'Shy person eats candy and becomes confident', tags:['humor'] },
  ],
  hero: [
    { idea:'Superhero saves the city — powered by candy', tags:['action'] },
    { idea:'Firefighter rescues a cat — candy is the reward', tags:['heart'] },
    { idea:'Knight defeats the dragon with candy-powered sword', tags:['action'] },
  ],
  villain: [
    { idea:'Villain steals ALL the candy — then realizes sharing is better', tags:['humor'] },
    { idea:'Dark lord\'s evil plan fails because candy is too delicious to weaponize', tags:['weird'] },
    { idea:'Crime boss demands candy as payment — noir style', tags:['action'] },
  ],
  goat: [
    { idea:'Someone just... eats the candy. On camera. That\'s the commercial', tags:['food'] },
    { idea:'Candy taste test but they keep making weird faces', tags:['humor'] },
    { idea:'Person tries to describe candy but can\'t find words', tags:['food'] },
  ],
  'perceptive-player': [
    { idea:'Documentary-style deep dive into candy craftsmanship', tags:['food'] },
    { idea:'Behind-the-scenes of candy factory — satisfying process shots', tags:['weird'] },
    { idea:'Food critic gives a pretentious review — then breaks character because it\'s good', tags:['humor'] },
  ],
  showmancer: [
    { idea:'Love story — candy is what brings them together', tags:['heart'] },
    { idea:'Romantic comedy — candy mix-up leads to meeting the one', tags:['humor'] },
    { idea:'First date fueled by candy confidence', tags:['heart'] },
  ],
};

const ROLE_ICONS = { director:'<div class="cft-role-css-icon role-director"></div>', writer:'<div class="cft-role-css-icon role-writer"></div>', actor:'<div class="cft-role-css-icon role-actor"></div>', editor:'<div class="cft-role-css-icon role-editor"></div>' };

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════

export function simulateCrazyFunTime(ep) {
  const tribes = gs.tribes.filter(t => t.members.length > 0);
  if (tribes.length < 2) return;

  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribes.forEach(t => t.members.forEach(n => { ep.chalMemberScores[n] = 0; }));

  const result = {
    tribes: [],
    pinballRanking: [],
    dramaEvents: [],
    chefPreference: null,
    commercials: [],
    commercialRanking: [],
    finalRanking: [],
    losingTribe: null,
    winningTribe: null,
  };

  // ── PHASE 1: REP SELECTION ──
  const animalPool = [...ANIMALS].sort(() => Math.random() - 0.5);

  tribes.forEach((tribe, ti) => {
    const members = [...tribe.members];
    const campKey = tribe.name;
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

    // Rep selection: volunteer or elected
    const repData = _selectRep(members, tribe.name);
    const rep = repData.name;

    // Animal assignment
    const animalBase = animalPool[ti % animalPool.length];
    const temperament = pick(TEMPERAMENTS);
    const animalName = pick(ANIMAL_NAMES[animalBase.type] || ['Buddy']);
    const animal = { ...animalBase, temperament, name: animalName };

    // Bonding attempt
    const bondResult = _bondWithAnimal(rep, animal);

    // Pinball scoring
    const pinball = _simulatePinball(rep, animal, bondResult, members, ep, tribe.name);

    // Sideline social events during pinball
    const sidelineEvents = _generateSidelineEvents(members, rep, pinball, tribe.name, ep);

    result.tribes.push({
      tribeName: tribe.name,
      tribeMembers: members,
      rep: repData,
      animal,
      bonding: bondResult,
      pinball,
      pinballScore: pinball.totalScore,
      sidelineEvents,
    });
  });

  // Rank tribes by pinball score
  result.pinballRanking = result.tribes
    .sort((a, b) => b.pinballScore - a.pinballScore)
    .map(t => t.tribeName);
  result.winningTribe = result.pinballRanking[0];

  // Rep scores
  result.tribes.forEach(t => {
    ep.chalMemberScores[t.rep.name] = (ep.chalMemberScores[t.rep.name] || 0) + Math.round(t.pinballScore / 100);
  });

  // ── DRAMA BREAK (4-7 events) ──
  result.dramaEvents = _generateDramaBreak(result, ep);

  // ── PHASE 2: COMMERCIAL ──
  result.chefPreference = pick(CHEF_PREFERENCES);

  // Romance hooks between phases
  const _romActive = tribes.flatMap(t => t.members);
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'game show downtime');

  tribes.forEach((tribe, ti) => {
    const members = [...tribe.members];
    const hasIntel = tribe.name === result.winningTribe;
    const campKey = tribe.name;

    // Pitch ideas
    const pitches = _generatePitches(members, result.chefPreference, hasIntel);

    // Debate
    const debate = _generateDebate(members, pitches, tribe.name, ep);

    // Vote on idea
    const voteResult = _votePitch(members, pitches, debate, ep, tribe.name);

    // Role assignment
    const roles = _assignRoles(members, voteResult.selectedPitch.player, ep, tribe.name);

    // Role debate
    const roleDebate = _generateRoleDebate(roles, members, ep, tribe.name);

    // Production events
    const productionEvents = _generateProductionEvents(roles, members, ep, tribe.name);

    // Calculate commercial quality
    const scores = _scoreCommercial(roles, voteResult, result.chefPreference, members, ep);

    // Commercial member scores — role performance + stat match + production events
    members.forEach(n => {
      const roleEntry = Object.values(roles).find(r => r.player === n);
      if (roleEntry) {
        // Base: performance scaled to meaningful range (3-10 pts)
        const perfScore = Math.round(roleEntry.performance * 10);
        // Stat match bonus: good fit = +3, ok = +1, bad = -1
        const matchBonus = roleEntry.statMatch === 'good' ? 3 : roleEntry.statMatch === 'bad' ? -1 : 1;
        // Named role bonus (director/writer/actor/editor get more than support)
        const roleBonus = roleEntry.role !== 'support' ? 2 : 0;
        ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + perfScore + matchBonus + roleBonus;
      }
    });
    // Pitch winner bonus
    if (voteResult.selectedPitch.player) {
      ep.chalMemberScores[voteResult.selectedPitch.player] = (ep.chalMemberScores[voteResult.selectedPitch.player] || 0) + 5;
    }
    // Rejected pitchers get a small consolation
    if (voteResult.rejectedPitchers) {
      voteResult.rejectedPitchers.forEach(rp => {
        if (rp.player) ep.chalMemberScores[rp.player] = (ep.chalMemberScores[rp.player] || 0) + 1;
      });
    }
    // Production event consequences on individual scores
    productionEvents.forEach(pe => {
      if (pe.type === 'breakthrough' && roles.actor?.player) {
        ep.chalMemberScores[roles.actor.player] = (ep.chalMemberScores[roles.actor.player] || 0) + 4;
      } else if (pe.type === 'bomb' && roles.actor?.player) {
        ep.chalMemberScores[roles.actor.player] = (ep.chalMemberScores[roles.actor.player] || 0) - 3;
      } else if (pe.type === 'sabotage') {
        const saboteur = members.find(n => pe.text.startsWith(n));
        if (saboteur) ep.chalMemberScores[saboteur] = (ep.chalMemberScores[saboteur] || 0) - 2;
      } else if (pe.type === 'clash') {
        if (roles.director?.player) ep.chalMemberScores[roles.director.player] = (ep.chalMemberScores[roles.director.player] || 0) - 1;
        if (roles.writer?.player) ep.chalMemberScores[roles.writer.player] = (ep.chalMemberScores[roles.writer.player] || 0) - 1;
      } else if (pe.type === 'showmance') {
        // Both showmance partners get a small boost for chemistry
        const sm = (gs.showmances || []).find(s => members.includes(s.a) && members.includes(s.b));
        if (sm) {
          ep.chalMemberScores[sm.a] = (ep.chalMemberScores[sm.a] || 0) + 2;
          ep.chalMemberScores[sm.b] = (ep.chalMemberScores[sm.b] || 0) + 2;
        }
      } else if (pe.type === 'teamwork') {
        // Small boost to director for coordinating
        if (roles.director?.player) ep.chalMemberScores[roles.director.player] = (ep.chalMemberScores[roles.director.player] || 0) + 1;
      }
    });

    result.commercials.push({
      tribeName: tribe.name,
      hasChefIntel: hasIntel,
      pitches,
      debate,
      selectedPitch: voteResult.selectedPitch,
      rejectedPitchers: voteResult.rejectedPitchers,
      voteBreakdown: voteResult.voteBreakdown,
      roles,
      roleDebate,
      productionEvents,
      scores,
    });
  });

  // Rank commercials
  result.commercialRanking = result.commercials
    .sort((a, b) => b.scores.total - a.scores.total)
    .map(c => c.tribeName);

  // Final ranking: combine pinball + commercial
  const finalScores = {};
  result.tribes.forEach(t => {
    const comm = result.commercials.find(c => c.tribeName === t.tribeName);
    finalScores[t.tribeName] = t.pinballScore + (comm ? comm.scores.total * 100 : 0);
  });
  result.finalRanking = Object.entries(finalScores)
    .sort(([,a], [,b]) => b - a)
    .map(([name]) => name);
  result.winningTribe = result.finalRanking[0];
  result.losingTribe = result.finalRanking[result.finalRanking.length - 1];

  // Post-judging social events (credit/blame)
  _generatePostJudgingEvents(result, ep);

  // Showmance hooks
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'game show', _romActive);

  // ── FINALIZE ──
  const winnerTribe = gs.tribes.find(t => t.name === result.winningTribe);
  const loserTribe = gs.tribes.find(t => t.name === result.losingTribe);

  ep.crazyFunTime = result;
  ep.isCrazyFunTime = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Super Happy Crazy Fun Time';
  ep.challengeCategory = 'social';
  ep.challengeDesc = 'Two-phase game show: human pinball with animal companions, then candy commercial production judged by Chef.';
  ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];
  ep.winner = winnerTribe;
  ep.loser = loserTribe;

  // chalPlacements based on member scores
  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([,a], [,b]) => b - a)
    .map(([n]) => n);

  updateChalRecord(ep);
  return ep;
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 1 HELPERS
// ══════════════════════════════════════════════════════════════════════

function _selectRep(members, tribeName) {
  const candidates = members.map(n => {
    const s = pStats(n);
    const pr = pronouns(n);
    const volunteerScore = (s.social * 0.4 + s.boldness * 0.6) + noise(3);
    return { name: n, volunteerScore, stats: s, pr };
  }).sort((a, b) => b.volunteerScore - a.volunteerScore);

  // ~35-55% chance the top candidate volunteers, otherwise tribe elects/drafted
  const topCandidate = candidates[0];
  const volunteers = Math.random() < 0.25 + (topCandidate.stats.boldness / 30);

  if (volunteers) {
    const narratives = [
      `${topCandidate.name} steps forward without hesitation. "I got this."`,
      `Before anyone can speak, ${topCandidate.name} volunteers. ${topCandidate.pr.Sub} ${topCandidate.pr.sub === 'they' ? 'look' : 'looks'} confident.`,
      `${topCandidate.name} raises ${topCandidate.pr.posAdj} hand. "Put me in. I'm built for this."`,
      `${topCandidate.name} walks to the front. No discussion needed — ${topCandidate.pr.sub} ${topCandidate.pr.sub === 'they' ? 'want' : 'wants'} this.`,
    ];
    return { name: topCandidate.name, method: 'volunteer', narrative: pick(narratives), electedBy: [] };
  }

  // Election: tribe argues, someone gets pushed
  const elected = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
  const pusher = members.find(n => n !== elected.name) || members[0];
  const narratives = [
    `Nobody wants to volunteer. ${pusher} points at ${elected.name}. "You're the best athlete here. Just do it."`,
    `The tribe argues for a minute before ${pusher} nominates ${elected.name}. ${elected.pr.Sub} reluctantly agrees.`,
    `After an awkward silence, ${pusher} pushes ${elected.name} forward. "You'll be fine. Probably."`,
    `${elected.name} gets elected by the tribe. ${elected.pr.Sub} doesn't look thrilled about it.`,
  ];
  return { name: elected.name, method: 'elected', narrative: pick(narratives), electedBy: [pusher] };
}

function _bondWithAnimal(repName, animal) {
  const s = pStats(repName);
  const pr = pronouns(repName);
  const bondChance = (s.social * 0.5 + s.endurance * 0.2 + s.boldness * 0.3) / 10 + noise(0.15);

  let success, level, narrative;

  if (animal.temperament === 'docile') {
    success = bondChance > 0.2;
    level = success ? Math.min(4, Math.floor(bondChance * 5) + 1) : 1;
  } else if (animal.temperament === 'nervous') {
    success = bondChance > 0.4;
    level = success ? Math.min(4, Math.floor(bondChance * 4)) : 0;
  } else { // aggressive
    success = bondChance > 0.55;
    level = success ? Math.min(3, Math.floor(bondChance * 3)) : 0;
  }

  const n = repName;
  if (success && animal.temperament === 'docile') {
    narrative = pick([
      `${n} reaches out and the ${animal.type} nuzzles against ${pr.posAdj} hand immediately. Instant friends.`,
      `The ${animal.type} chirps happily as ${n} scratches behind its ears. Easy bond.`,
      `${animal.name} the ${animal.type} practically jumps into ${n}'s arms. The crowd awws.`,
    ]);
  } else if (success && animal.temperament === 'nervous') {
    narrative = pick([
      `${animal.name} the ${animal.type} flinches at first. ${n} sits down, speaks softly. Slowly, the ${animal.type} approaches.`,
      `It takes patience, but ${n} wins ${animal.name} over. The ${animal.type} stops trembling and leans in.`,
      `${n} offers ${pr.posAdj} palm. The nervous ${animal.type} sniffs cautiously... then settles against ${pr.obj}. Trust earned.`,
    ]);
  } else if (success && animal.temperament === 'aggressive') {
    narrative = pick([
      `${animal.name} the ${animal.type} bares its teeth. ${n} doesn't flinch. They lock eyes. Something clicks — mutual respect.`,
      `The ${animal.type} lunges — ${n} catches it firmly but gently. After a tense moment, ${animal.name} calms down.`,
      `${n} stares down the aggressive ${animal.type}. Neither blinks. Finally, ${animal.name} grunts and cooperates.`,
    ]);
  } else if (!success && animal.temperament === 'aggressive') {
    narrative = pick([
      `${animal.name} the ${animal.type} attacks on sight. ${n} screams as claws find ${pr.posAdj} face. No bonding today.`,
      `The ${animal.type} wants NOTHING to do with ${n}. It bites, scratches, and generally wages war.`,
      `${n} reaches out and ${animal.name} chomps down on ${pr.posAdj} hand. ${n} howls. The crowd winces.`,
    ]);
  } else {
    narrative = pick([
      `${animal.name} the ${animal.type} ignores ${n} completely. Not hostile, just... unimpressed.`,
      `The ${animal.type} sits in the corner and refuses to make eye contact with ${n}. Awkward.`,
      `${n} tries everything — treats, cooing, pleading. ${animal.name} yawns and turns away.`,
    ]);
  }

  return { success, level: clamp(level, 0, 4), narrative };
}

function _simulatePinball(repName, animal, bonding, members, ep, tribeName) {
  const s = pStats(repName);
  const pr = pronouns(repName);
  const launches = [];
  const numLaunches = 3 + Math.floor(Math.random() * 2); // 3-4 launches

  let totalScore = 0;
  const zoneHits = { bumper: 0, ramp: 0, secret: 0 };

  let secretUsed = false;
  for (let i = 0; i < numLaunches; i++) {
    // Bumper hits: physical + endurance
    const bumperRoll = s.physical * 0.6 + s.endurance * 0.4 + noise(3);
    const bumperHits = clamp(Math.floor(bumperRoll / 2), 0, 6);
    const bumperScore = bumperHits * (100 + Math.floor(Math.random() * 50));

    // Ramp targets: strategic + mental
    const rampRoll = s.strategic * 0.5 + s.mental * 0.5 + noise(3);
    const rampHits = clamp(Math.floor(rampRoll / 3), 0, 3);
    const rampScore = rampHits * (200 + Math.floor(Math.random() * 100));

    // Secret lanes: only with good animal bond, fires ONCE per rep max
    let secretHits = 0, secretScore = 0;
    if (!secretUsed && bonding.level >= 3 && Math.random() < 0.25 + bonding.level * 0.08) {
      secretHits = 1;
      secretScore = 800 + Math.floor(Math.random() * 400);
      secretUsed = true;
    }

    // Animal cooperation multiplier
    const animalMult = bonding.success ? (1 + bonding.level * 0.15) : 0.7;
    const launchScore = Math.round((bumperScore + rampScore + secretScore) * animalMult);

    // Fatigue: later launches score less
    const fatigueMult = 1 - (i * 0.08);
    const finalScore = Math.round(launchScore * fatigueMult);

    zoneHits.bumper += bumperHits;
    zoneHits.ramp += rampHits;
    zoneHits.secret += secretHits;
    totalScore += finalScore;

    const launchEvents = [];
    if (bumperHits >= 4) {
      launchEvents.push({
        type: 'combo', text: pick([
          `${repName} ricochets off ${bumperHits} bumpers in rapid succession — a pinball MACHINE!`,
          `Triple-hit combo! ${repName} and ${animal.name} careen through the bumper field like a wrecking ball.`,
          `${bumperHits} bumpers in one launch! The scoreboard erupts.`,
        ]), points: bumperScore
      });
    }
    if (rampHits >= 2) {
      launchEvents.push({
        type: 'ramp', text: pick([
          `${repName} angles toward the ramp — perfect trajectory! ${rampHits} ramp targets hit.`,
          `The ${animal.type} spots the ramp lane and tugs ${repName} toward it. Threading the needle!`,
          `Strategic aim pays off — ${repName} nails ${rampHits} ramp targets.`,
        ]), points: rampScore
      });
    }
    if (secretHits > 0) {
      launchEvents.push({
        type: 'secret', text: pick([
          `${animal.name} spots the hidden lane and guides ${repName} through — BONUS UNLOCKED! +${secretScore}!`,
          `The secret passage lights up as ${repName} and ${animal.name} thread through it. Massive bonus!`,
          `Only a bonded animal finds the secret lane — ${animal.name} delivers. +${secretScore}!`,
        ]), points: secretScore
      });
    }
    if (!bonding.success && Math.random() < 0.4) {
      launchEvents.push({
        type: 'animal-attack', text: pick([
          `${animal.name} claws at ${repName} mid-bounce! The ball veers wildly off course.`,
          `The ${animal.type} panics and thrashes inside the ball. ${repName} can't control the trajectory.`,
          `${animal.name} bites ${repName}'s arm! ${pr.Sub} yelps and misses the next three bumpers.`,
        ]), points: -200
      });
      totalScore = Math.max(0, totalScore - 200);
    }

    launches.push({
      launchNum: i + 1,
      bumperHits, rampHits, secretHits,
      score: finalScore,
      events: launchEvents,
      animalMult,
    });
  }

  // Popularity for the rep
  if (totalScore > 4000) popDelta(repName, 2);
  else if (totalScore > 2500) popDelta(repName, 1);
  else if (totalScore < 1500) popDelta(repName, -1);

  return { launches, totalScore, zoneHits, numLaunches };
}

function _generateSidelineEvents(members, repName, pinball, tribeName, ep) {
  const events = [];
  const spectators = members.filter(n => n !== repName);
  if (spectators.length < 1) return events;

  // 1-2 sideline events
  const numEvents = 1 + (Math.random() < 0.5 ? 1 : 0);

  for (let i = 0; i < numEvents && spectators.length >= 2; i++) {
    const a = pick(spectators);
    let b = pick(spectators.filter(n => n !== a));
    if (!b) b = a;
    const prA = pronouns(a);
    const sA = pStats(a);

    if (pinball.totalScore < 2000 && Math.random() < 0.5) {
      events.push({
        type: 'blame',
        text: `${a} winces from the sideline. "That should've been me up there." ${b} shoots back — "You really think you'd do better?"`,
        consequence: `${a} → ${b} bond −1`,
        fn: () => { addBond(a, b, -1); }
      });
    } else if (pinball.totalScore > 4000 && Math.random() < 0.6) {
      events.push({
        type: 'cheer',
        text: `${a} and ${b} high-five as the score climbs. "WE PICKED THE RIGHT ONE!" The whole bench erupts.`,
        consequence: `Team morale +1`,
        fn: () => { addBond(a, repName, 1); }
      });
    } else {
      events.push({
        type: 'tension',
        text: `${a} can barely watch. ${prA.Sub} ${prA.sub === 'they' ? 'keep' : 'keeps'} muttering under ${prA.posAdj} breath. ${b} tells ${prA.obj} to relax.`,
        consequence: `${a} anxiety`,
        fn: () => {}
      });
    }
  }

  events.forEach(e => { if (e.fn) e.fn(); });
  return events;
}

// ══════════════════════════════════════════════════════════════════════
// DRAMA BREAK
// ══════════════════════════════════════════════════════════════════════

function _generateDramaBreak(result, ep) {
  const events = [];
  const allMembers = result.tribes.flatMap(t => t.tribeMembers);
  const winTribe = result.tribes.find(t => t.tribeName === result.winningTribe);
  const loseTribe = result.tribes.find(t => t.tribeName !== result.winningTribe);

  // Event 1: Pinball fallout (guaranteed)
  if (loseTribe) {
    const rep = loseTribe.rep;
    if (rep.method === 'elected' && rep.electedBy.length > 0) {
      const pusher = rep.electedBy[0];
      const prR = pronouns(rep.name);
      events.push({
        type: 'fallout', side: 'left',
        players: [rep.name, pusher],
        text: `${rep.name} rounds on ${pusher}. "YOU pushed for me to go up there. This is YOUR fault."`,
        consequence: `${rep.name} → ${pusher} bond −2`,
        badge: 'PINBALL FALLOUT',
        fn: () => { addBond(rep.name, pusher, -2); popDelta(rep.name, -1); }
      });
    } else if (rep.method === 'volunteer') {
      const critic = loseTribe.tribeMembers.find(n => n !== rep.name) || rep.name;
      events.push({
        type: 'fallout', side: 'left',
        players: [rep.name, critic],
        text: `${critic} stares at ${rep.name}. "Nobody asked you to volunteer. And look where it got us."`,
        consequence: `${rep.name} humiliation · Pop −1`,
        badge: 'PINBALL FALLOUT',
        fn: () => { addBond(rep.name, critic, -1); popDelta(rep.name, -1); }
      });
    }
  }

  // Event 2: Winner celebration
  if (winTribe) {
    const rep = winTribe.rep;
    const teammate = winTribe.tribeMembers.find(n => n !== rep.name);
    if (teammate) {
      events.push({
        type: 'celebration', side: 'right',
        players: [rep.name, teammate],
        text: `${teammate} claps ${rep.name} on the back. "THAT was incredible! You carried us!" The winning tribe buzzes with energy.`,
        consequence: `Team cohesion +1 · ${rep.name} Pop +1`,
        badge: 'WINNER ENERGY',
        fn: () => { addBond(rep.name, teammate, 1); popDelta(rep.name, 1); }
      });
    }
  }

  // Event 3: Cross-tribe respect or rivalry
  if (winTribe && loseTribe) {
    const wMember = pick(winTribe.tribeMembers);
    const lMember = pick(loseTribe.tribeMembers);
    if (getBond(wMember, lMember) > 2 || Math.random() < 0.4) {
      events.push({
        type: 'respect', side: 'right',
        players: [wMember, lMember],
        text: `${wMember} catches ${lMember} alone. "Hey — tough break in there. Your ${loseTribe.animal.type} was impossible. Anyone would've struggled."`,
        consequence: `${wMember} → ${lMember} bond +1`,
        badge: 'CROSS-TRIBE RESPECT',
        fn: () => { addBond(wMember, lMember, 1); }
      });
    } else {
      events.push({
        type: 'taunt', side: 'right',
        players: [wMember, lMember],
        text: `${wMember} smirks as ${lMember} walks past. "Better luck next time." ${lMember} clenches ${pronouns(lMember).posAdj} fists.`,
        consequence: `${wMember} → ${lMember} rivalry +1`,
        badge: 'CROSS-TRIBE TAUNT',
        fn: () => { addBond(wMember, lMember, -1); popDelta(wMember, -1); }
      });
    }
  }

  // Event 4: Showmance spark check — respects romance system guards
  if (seasonConfig.romance !== 'disabled') {
    const activeShowmances = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up' && sh.players.every(p => gs.activePlayers.includes(p)));
    if (activeShowmances.length < 2) {
      const sparkCandidates = allMembers.filter(n => {
        const arch = players.find(p => p.name === n)?.archetype;
        return arch === 'showmancer' || arch === 'social-butterfly' || Math.random() < 0.2;
      });
      for (let si = 0; si < sparkCandidates.length && si < sparkCandidates.length - 1; si++) {
        for (let sj = si + 1; sj < sparkCandidates.length; sj++) {
          const a = sparkCandidates[si], b = sparkCandidates[sj];
          if (!romanticCompat(a, b)) continue;
          if ((gs.showmances || []).some(sh => sh.players.includes(a) && sh.players.includes(b))) continue;
          if ((gs.romanticSparks || []).some(sp => sp.players.includes(a) && sp.players.includes(b))) continue;
          if (activeShowmances.some(sh => sh.players.includes(a) || sh.players.includes(b))) continue;
          if (getBond(a, b) < 3) continue;
          events.push({
            type: 'spark', side: 'left',
            players: [a, b],
            text: pick([
              `${a} ices a bruise from the earlier commotion. ${b} sits down next to ${pronouns(a).obj}. "You okay?" Their eyes meet a beat too long.`,
              `${b} finds ${a} alone in the green room. They share a quiet laugh about the chaos. Something shifts between them.`,
              `${a} and ${b} end up side by side during the break. Neither moves away. The silence says more than words.`,
              `${b} catches ${a}'s eye across the room and holds it. ${a} looks away first, but not quickly enough.`,
            ]),
            consequence: `Romantic tension +1`,
            badge: 'SHOWMANCE SPARK',
            fn: () => { addBond(a, b, 1); }
          });
          break;
        }
        if (events.some(e => e.type === 'spark')) break;
      }
    }
  }

  // Event 5: Alliance huddle (losing tribe pre-games the vote)
  if (loseTribe && loseTribe.tribeMembers.length >= 3) {
    const schemers = loseTribe.tribeMembers.filter(n => {
      const arch = players.find(p => p.name === n)?.archetype;
      return ['mastermind','schemer','villain'].includes(arch);
    });
    const plotter = schemers.length > 0 ? pick(schemers) : pick(loseTribe.tribeMembers);
    const ally = loseTribe.tribeMembers.find(n => n !== plotter && getBond(plotter, n) > 0) || loseTribe.tribeMembers.find(n => n !== plotter);
    const target = loseTribe.tribeMembers.find(n => n !== plotter && n !== ally) || plotter;
    if (ally && target !== plotter) {
      events.push({
        type: 'alliance', side: 'left',
        players: [plotter, ally],
        text: `${plotter} pulls ${ally} aside. "If we lose the commercial too, ${target} goes. ${pronouns(target).Sub} ${pronouns(target).sub === 'they' ? 'have' : 'has'} been dead weight. You with me?"`,
        consequence: `Vote pact formed · Target: ${target}`,
        badge: 'ALLIANCE HUDDLE',
        fn: () => { addBond(plotter, ally, 1); }
      });
    }
  }

  // Event 6: Animal callback (comedy)
  if (Math.random() < 0.5 && winTribe) {
    const bystander = pick(winTribe.tribeMembers.filter(n => n !== winTribe.rep.name)) || winTribe.rep.name;
    events.push({
      type: 'comedy', side: 'right',
      players: [bystander, winTribe.rep.name],
      text: `${winTribe.animal.name} the ${winTribe.animal.type} followed ${winTribe.rep.name} out of the arena. It's now sitting on ${bystander}'s lap, stealing ${pronouns(bystander).posAdj} snack. ${bystander} doesn't move. "This is fine."`,
      consequence: `Comedy moment · ${bystander} ↔ ${winTribe.rep.name} bond +1`,
      badge: 'ANIMAL CALLBACK',
      fn: () => { addBond(bystander, winTribe.rep.name, 1); }
    });
  }

  // Event 7: Director posturing (someone from any tribe)
  const posturer = allMembers.find(n => {
    const s = pStats(n);
    return s.strategic >= 6 && s.social >= 5;
  });
  if (posturer && events.length < 7) {
    const prP = pronouns(posturer);
    events.push({
      type: 'posturing', side: 'left',
      players: [posturer],
      text: `${posturer} is already sizing up the commercial supplies. "I should direct. I have ACTUAL leadership experience." ${prP.Sub} cracks ${prP.posAdj} knuckles.`,
      consequence: `${posturer} positioning for director role`,
      badge: 'POWER PLAY',
      fn: () => {}
    });
  }

  // Cap at 7, minimum 4
  const finalEvents = events.slice(0, 7);

  // Execute all event functions
  finalEvents.forEach(e => { if (e.fn) e.fn(); });

  // Inject camp events
  finalEvents.forEach(e => {
    if (e.players && e.players.length > 0) {
      const pTribe = result.tribes.find(t => t.tribeMembers.includes(e.players[0]));
      if (pTribe) {
        const key = pTribe.tribeName;
        if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
        ep.campEvents[key].post.push({
          type: 'crazyFunTimeDrama',
          players: e.players,
          text: e.text,
          badgeText: e.badge,
          badgeClass: e.type === 'fallout' || e.type === 'taunt' ? 'bg-danger' : e.type === 'spark' ? 'bg-showmance' : 'bg-info',
        });
      }
    }
  });

  return finalEvents;
}

// ══════════════════════════════════════════════════════════════════════
// PHASE 2: COMMERCIAL
// ══════════════════════════════════════════════════════════════════════

function _generatePitches(members, chefPref, hasIntel) {
  return members.map(name => {
    const s = pStats(name);
    const pr = pronouns(name);
    const arch = players.find(p => p.name === name)?.archetype || 'floater';
    const concepts = PITCH_CONCEPTS[arch] || PITCH_CONCEPTS.floater;
    const concept = pick(concepts);

    // Quality: mental + social + boldness
    const quality = clamp(Math.round((s.mental * 0.4 + s.social * 0.3 + s.boldness * 0.3) / 2 + noise(1)), 1, 5);

    // Chef compatibility
    const tagMatch = concept.tags.includes(chefPref.id) ? 2 : 0;
    const chefCompat = clamp(tagMatch + Math.floor(Math.random() * 2), 0, 4);

    return {
      player: name,
      archetype: arch,
      idea: concept.idea,
      tags: concept.tags,
      quality,
      chefCompat,
      totalScore: quality + (hasIntel ? chefCompat : 0), // only intel tribe knows what Chef wants
    };
  });
}

function _generateDebate(members, pitches, tribeName, ep) {
  const events = [];
  const sorted = [...pitches].sort((a, b) => b.totalScore - a.totalScore);
  const top2 = sorted.slice(0, Math.min(2, sorted.length));

  // Each personality reacts differently in the debate
  members.forEach(name => {
    const s = pStats(name);
    const pr = pronouns(name);
    const arch = players.find(p => p.name === name)?.archetype || 'floater';
    const myPitch = pitches.find(p => p.player === name);
    const isTopPitcher = top2.some(p => p.player === name);

    if (isTopPitcher && s.social >= 5) {
      // Pitch defense
      const defenses = [
        `"My idea is clearly the best option here. ${myPitch.idea.split('—')[0]}— that's GOLD."`,
        `"Listen, I've thought about this. My concept hits every mark. Just trust me."`,
        `"Who else has a better idea? Anyone? No? Then we go with mine."`,
        `"This is the one. I can feel it. Chef is going to LOVE this."`,
      ];
      events.push({
        player: name, role: 'pitching', arch,
        text: `${name}: ${pick(defenses)}`,
        consequence: isTopPitcher ? '' : `${name} pushback`,
        harmonyDelta: -0.5,
      });
    } else if (arch === 'hothead' || arch === 'villain') {
      // Attacking other pitches
      const target = sorted.find(p => p.player !== name);
      if (target) {
        const attacks = [
          `"${target.player}'s idea is garbage. A ${target.idea.split('—')[0].trim().toLowerCase()}? Really? That's embarrassing."`,
          `"No offense ${target.player}, but that pitch makes zero sense. Chef will hate it."`,
          `"I've seen better ideas on cereal boxes. ${target.player}, sit down."`,
        ];
        events.push({
          player: name, role: 'attacking', arch,
          text: `${name}: ${pick(attacks)}`,
          consequence: `${name} → ${target.player} bond −1`,
          harmonyDelta: -1,
          fn: () => { addBond(name, target.player, -1); }
        });
      }
    } else if (arch === 'social-butterfly' || arch === 'hero' || arch === 'loyal-soldier') {
      // Mediating or supporting
      const supporter = sorted[0];
      if (supporter && supporter.player !== name) {
        const supports = [
          `"Honestly, ${supporter.player}'s idea is fun. Chef doesn't have refined taste — fun wins."`,
          `"Can we just pick one and GO? ${supporter.player}'s pitch is solid. I'm in."`,
          `"I think ${supporter.player} is onto something. Let's rally behind it."`,
        ];
        events.push({
          player: name, role: 'supporting', arch,
          text: `${name}: ${pick(supports)}`,
          consequence: `${name} → ${supporter.player} bond +1`,
          harmonyDelta: 0.5,
          fn: () => { addBond(name, supporter.player, 1); }
        });
      }
    } else if (arch === 'goat' || arch === 'floater') {
      // Confused or noncommittal
      const confused = [
        `"I mean... they're all fine? I don't really have a strong opinion..."`,
        `"Whatever you guys decide. I'm flexible."`,
        `"Can someone explain what we're even arguing about?"`,
      ];
      events.push({
        player: name, role: 'passive', arch,
        text: `${name}: ${pick(confused)}`,
        consequence: '',
        harmonyDelta: 0,
      });
    } else {
      // Strategic input
      const strats = [
        `"Think about what Chef ACTUALLY likes. Not what WE like. What does CHEF want to see?"`,
        `"We need something visually loud. Chef has the attention span of a goldfish."`,
        `"Combine the best parts of everyone's pitch. Why are we fighting?"`,
      ];
      events.push({
        player: name, role: 'strategizing', arch,
        text: `${name}: ${pick(strats)}`,
        consequence: '',
        harmonyDelta: 0.3,
      });
    }
  });

  // Execute bond changes
  events.forEach(e => { if (e.fn) e.fn(); });

  return events;
}

function _votePitch(members, pitches, debate, ep, tribeName) {
  // Vote: each member votes for a pitch (not their own)
  const votes = {};
  pitches.forEach(p => { votes[p.player] = 0; });

  const voteBreakdown = [];
  members.forEach(name => {
    const options = pitches.filter(p => p.player !== name);
    if (options.length === 0) return;

    // Weight by quality + bond with pitcher + social influence
    const weighted = options.map(p => {
      const bond = getBond(name, p.player);
      const weight = p.totalScore * 2 + bond + pStats(p.player).social * 0.3 + noise(2);
      return { ...p, weight };
    }).sort((a, b) => b.weight - a.weight);

    const votedFor = weighted[0].player;
    votes[votedFor] = (votes[votedFor] || 0) + 1;
    voteBreakdown.push({ voter: name, votedFor });
  });

  // Winner is most votes (ties: higher quality)
  const sortedVotes = Object.entries(votes).sort(([a, va], [b, vb]) => {
    if (vb !== va) return vb - va;
    const qa = pitches.find(p => p.player === a)?.totalScore || 0;
    const qb = pitches.find(p => p.player === b)?.totalScore || 0;
    return qb - qa;
  });

  const winnerName = sortedVotes[0][0];
  const selectedPitch = pitches.find(p => p.player === winnerName);
  const rejectedPitchers = pitches.filter(p => p.player !== winnerName).map(p => ({
    player: p.player,
    resentment: p.quality >= selectedPitch.quality ? 2 : 1,
  }));

  // Bond penalties for rejected pitchers
  rejectedPitchers.forEach(rp => {
    if (rp.resentment >= 2) {
      const votersAgainst = voteBreakdown.filter(v => v.votedFor !== rp.player).map(v => v.voter);
      votersAgainst.forEach(v => { addBond(rp.player, v, -0.5); });
    }
  });

  return { selectedPitch, rejectedPitchers, voteBreakdown, votes };
}

function _assignRoles(members, directorDefault, ep, tribeName) {
  const available = [...members];
  const roles = {};

  // Director: idea pitcher by default
  const dirIdx = available.indexOf(directorDefault);
  if (dirIdx >= 0) available.splice(dirIdx, 1);
  const dirStats = pStats(directorDefault);
  roles.director = {
    role: 'director', player: directorDefault,
    statMatch: dirStats.strategic >= 6 && dirStats.social >= 5 ? 'good' : dirStats.strategic >= 4 ? 'ok' : 'bad',
    performance: (dirStats.strategic * 0.5 + dirStats.social * 0.5) / 10 + noise(0.15),
  };

  // Writer: highest mental
  const writerCandidates = available.map(n => ({ name: n, score: pStats(n).mental + noise(2) }))
    .sort((a, b) => b.score - a.score);
  const writerName = writerCandidates[0]?.name;
  if (writerName) {
    available.splice(available.indexOf(writerName), 1);
    const ws = pStats(writerName);
    roles.writer = {
      role: 'writer', player: writerName,
      statMatch: ws.mental >= 7 ? 'good' : ws.mental >= 4 ? 'ok' : 'bad',
      performance: (ws.mental * 0.6 + ws.strategic * 0.4) / 10 + noise(0.15),
    };
  }

  // Actor: highest social + boldness
  const actorCandidates = available.map(n => ({ name: n, score: pStats(n).social * 0.6 + pStats(n).boldness * 0.4 + noise(2) }))
    .sort((a, b) => b.score - a.score);
  const actorName = actorCandidates[0]?.name;
  if (actorName) {
    available.splice(available.indexOf(actorName), 1);
    const as = pStats(actorName);
    roles.actor = {
      role: 'actor', player: actorName,
      statMatch: as.social >= 6 && as.boldness >= 5 ? 'good' : as.social >= 4 ? 'ok' : 'bad',
      performance: (as.social * 0.5 + as.boldness * 0.5) / 10 + noise(0.15),
    };
  }

  // Editor: next highest mental
  const editorName = available[0];
  if (editorName) {
    available.splice(0, 1);
    const es = pStats(editorName);
    roles.editor = {
      role: 'editor', player: editorName,
      statMatch: es.mental >= 6 ? 'good' : es.mental >= 4 ? 'ok' : 'bad',
      performance: (es.mental * 0.5 + es.endurance * 0.5) / 10 + noise(0.15),
    };
  }

  // Remaining members get 'support' roles
  available.forEach(n => {
    const ss = pStats(n);
    roles[`support_${n}`] = {
      role: 'support', player: n,
      statMatch: 'ok',
      performance: (ss.social * 0.3 + ss.mental * 0.3 + ss.boldness * 0.4) / 10 + noise(0.1),
    };
  });

  return roles;
}

function _generateRoleDebate(roles, members, ep, tribeName) {
  const events = [];

  // Check for mismatches causing friction
  Object.values(roles).forEach(r => {
    if (r.role === 'support') return;
    if (r.statMatch === 'bad') {
      const pr = pronouns(r.player);
      events.push({
        player: r.player, role: r.role,
        text: pick([
          `${r.player} looks at ${pr.posAdj} assignment: ${r.role.toUpperCase()}. "${pr.Sub === 'They' ? 'This isn\'t' : 'This isn\'t'} my strength and everyone knows it."`,
          `${r.player} reads the role card. ${r.role.charAt(0).toUpperCase() + r.role.slice(1)}. ${pr.Sub} visibly deflates.`,
        ]),
        type: 'mismatch',
        harmonyDelta: -1,
      });
    }
  });

  // Someone who wanted director but didn't get it
  const dirPlayer = roles.director?.player;
  members.forEach(n => {
    if (n === dirPlayer) return;
    const s = pStats(n);
    const arch = players.find(p => p.name === n)?.archetype;
    if ((arch === 'mastermind' || arch === 'schemer' || s.strategic >= 7) && Math.random() < 0.4) {
      const pr = pronouns(n);
      events.push({
        player: n,
        text: pick([
          `${n}: "If I can't direct, I'm at LEAST involved in every decision. This commercial needs VISION."`,
          `${n} crosses ${pr.posAdj} arms. "Fine. But if this goes sideways, it's not my fault. I SHOULD be directing."`,
          `${n} mutters under ${pr.posAdj} breath. "${dirPlayer} directing? This is going to be a disaster."`,
        ]),
        type: 'resentment',
        harmonyDelta: -0.5,
        fn: () => { addBond(n, dirPlayer, -1); }
      });
    }
  });

  events.forEach(e => { if (e.fn) e.fn(); });
  return events;
}

function _generateProductionEvents(roles, members, ep, tribeName) {
  const events = [];
  const numEvents = 2 + Math.floor(Math.random() * 2); // 2-3 events

  const eventPool = [];

  // On-set clash
  const director = roles.director;
  const writer = roles.writer;
  if (director && writer && getBond(director.player, writer.player) < 2) {
    eventPool.push({
      type: 'clash',
      text: `${writer.player} rewrites half the script mid-take. ${director.player} tries to redirect but ${writer.player} insists it's better now.`,
      consequence: `Team harmony −1 · Take quality reduced`,
      harmonyDelta: -1,
      fn: () => { addBond(director.player, writer.player, -1); }
    });
  }

  // Actor nails it
  const actor = roles.actor;
  if (actor && actor.statMatch === 'good') {
    eventPool.push({
      type: 'breakthrough',
      text: `${actor.player} ad-libs a line and it's PERFECT. The whole team pauses — then erupts. That's the take.`,
      consequence: `Commercial quality +1 · Team harmony +1`,
      harmonyDelta: 1,
      fn: () => { popDelta(actor.player, 1); }
    });
  }

  // Actor bombs
  if (actor && actor.statMatch === 'bad') {
    eventPool.push({
      type: 'bomb',
      text: `${actor.player} freezes on camera. Forgets every line. The crew watches in silence. Take 7. Take 8. Take 9.`,
      consequence: `Commercial quality −1 · ${actor.player} embarrassment`,
      harmonyDelta: -1,
      fn: () => { popDelta(actor.player, -1); }
    });
  }

  // Showmance on set
  const showmances = gs.showmances || [];
  const onSetShowmance = showmances.find(sm => members.includes(sm.a) && members.includes(sm.b));
  if (onSetShowmance) {
    eventPool.push({
      type: 'showmance',
      text: `${onSetShowmance.a} insists on a scene where they save ${onSetShowmance.b}. The chemistry is undeniable. Even the crew blushes.`,
      consequence: `Showmance intensity +1 · Take quality +1`,
      harmonyDelta: 0.5,
      fn: () => { addBond(onSetShowmance.a, onSetShowmance.b, 1); }
    });
  }

  // Sabotage attempt (villain archetypes only)
  members.forEach(n => {
    const arch = players.find(p => p.name === n)?.archetype;
    if (['villain','schemer'].includes(arch) && Math.random() < 0.15) {
      eventPool.push({
        type: 'sabotage',
        text: `${n} subtly messes with the lighting between takes. The next shot is unusable. Nobody notices... yet.`,
        consequence: `Commercial quality −1`,
        harmonyDelta: -0.5,
        fn: () => { popDelta(n, -1); }
      });
    }
  });

  // General collaboration
  eventPool.push({
    type: 'teamwork',
    text: `The team hits a rhythm. Director calls the shots, writer feeds lines, actor delivers. For one beautiful moment, they're a real production crew.`,
    consequence: `Team harmony +1`,
    harmonyDelta: 1,
    fn: () => {}
  });

  // Pick events from pool
  const shuffled = eventPool.sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numEvents, shuffled.length); i++) {
    events.push(shuffled[i]);
    if (shuffled[i].fn) shuffled[i].fn();
  }

  return events;
}

function _scoreCommercial(roles, voteResult, chefPref, members, ep) {
  const pitch = voteResult.selectedPitch;

  // Concept score: pitch quality + chef compatibility
  const concept = clamp((pitch.quality * 1.5 + pitch.chefCompat * 2) + noise(1), 1, 10);

  // Direction score
  const direction = clamp((roles.director?.performance || 0.5) * 10 + noise(1), 1, 10);

  // Performance score
  const performance = clamp((roles.actor?.performance || 0.5) * 10 + noise(1), 1, 10);

  // Script score
  const script = clamp((roles.writer?.performance || 0.5) * 10 + noise(1), 1, 10);

  // Polish score
  const polish = clamp((roles.editor?.performance || 0.5) * 10 + noise(1), 1, 10);

  // Team harmony bonus
  const avgBond = _getTeamHarmony(members);
  const harmony = clamp(avgBond + 5, 0, 10);

  // Chef quirk: does the pitch match the preference?
  const chefQuirk = pitch.tags?.includes(chefPref.id) ? 8 + Math.random() * 2 : 2 + Math.random() * 3;

  // Chef random bias ("exploding doughnuts" factor)
  const chefBias = Math.random() * 2;

  const total = concept + direction + performance + script + polish + harmony * 0.5 + chefQuirk + chefBias;

  return { concept, direction, performance, script, polish, harmony, chefQuirk, chefBias, total };
}

function _getTeamHarmony(members) {
  let totalBond = 0, count = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      totalBond += getBond(members[i], members[j]);
      count++;
    }
  }
  return count > 0 ? totalBond / count : 0;
}

function _generatePostJudgingEvents(result, ep) {
  const winner = result.commercials.find(c => c.tribeName === result.winningTribe);
  const loser = result.commercials.find(c => c.tribeName === result.losingTribe);

  // Winner credit
  if (winner) {
    const dir = winner.roles.director?.player;
    const pitcher = winner.selectedPitch.player;
    if (dir) popDelta(dir, 1);
    if (pitcher && pitcher !== dir) popDelta(pitcher, 1);

    const key = winner.tribeName;
    if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
    ep.campEvents[key].post.push({
      type: 'crazyFunTimeWin',
      players: winner.roles.director ? [winner.roles.director.player] : [],
      text: `${winner.tribeName} celebrates their commercial victory!`,
      badgeText: 'COMMERCIAL VICTORY', badgeClass: 'bg-success',
    });
  }

  // Loser blame
  if (loser) {
    const dir = loser.roles.director?.player;
    const pitcher = loser.selectedPitch.player;
    if (dir) popDelta(dir, -1);

    // Rejected pitchers with better ideas get "I told you so"
    loser.rejectedPitchers.forEach(rp => {
      if (rp.resentment >= 2) {
        addBond(rp.player, pitcher, -1);
        const key = loser.tribeName;
        if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
        ep.campEvents[key].post.push({
          type: 'crazyFunTimeBlame',
          players: [rp.player, pitcher],
          text: `${rp.player} glares at ${pitcher}. "MY idea would've worked. But nobody listened."`,
          badgeText: 'I TOLD YOU SO', badgeClass: 'bg-danger',
        });
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════════════
// VP: CSS + SHELL
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`cft-step-${suffix}-${i}`);
    if (el) el.classList.add('cft-visible');
  }
  const counter = document.getElementById(`cft-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`cft-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.cft-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

export function crazyFunTimeRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('cft-', '');
  _reapplyVisibility(suffix, st.idx, st.total);
  const el = document.getElementById(`cft-step-${suffix}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _cftUpdateSidebar(screenKey);
}

export function crazyFunTimeRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('cft-', '');
  _reapplyVisibility(suffix, st.idx, st.total);
  _cftUpdateSidebar(screenKey);
}

function _cftUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('cft-sidebar-inner');
  if (!sideEl) return;
  const epIdx = window.vpEpNum;
  const epRecord = gs.episodeHistory?.[epIdx - 1];
  if (!epRecord || !epRecord.crazyFunTime) return;
  const phase = screenKey.replace('cft-', '').replace(/\d+$/, '').replace(/-$/, '') || 'title';
  const phaseMap = { title: 'title', pinball: 'pinball', drama: 'drama', commercial: 'commercial', verdict: 'verdict', results: 'results' };
  const sidebarPhase = phaseMap[phase] || (screenKey.startsWith('cft-comm') ? 'commercial' : 'title');
  sideEl.innerHTML = _buildSidebarContent(epRecord, sidebarPhase);
  // Update header score digits for pinball phase
  if (sidebarPhase === 'pinball') _cftUpdateHeaderScores(epRecord);
}

function _cftUpdateHeaderScores(epRecord) {
  const data = epRecord.crazyFunTime;
  if (!data) return;
  const pinSt = _tvState['cft-pinball'];
  const revealIdx = pinSt ? pinSt.idx : -1;
  const meta = (typeof window !== 'undefined' && window._cftPinballStepMeta) ? window._cftPinballStepMeta : [];
  const scores = {};
  data.tribes.forEach(t => { scores[t.tribeName] = 0; });
  for (let i = 0; i <= revealIdx && i < meta.length; i++) {
    if (meta[i].tribe) scores[meta[i].tribe] += meta[i].points;
  }
  data.tribes.forEach(t => {
    const slug = t.tribeName.toLowerCase().replace(/\s+/g, '-');
    const el = document.getElementById(`cft-header-score-${slug}`);
    if (el) {
      const col = tribeColor(t.tribeName);
      el.innerHTML = _digits(revealIdx >= 0 ? scores[t.tribeName] : 0, col);
    }
  });
}

// ── CSS icon helper ──────────────────────────────────────────────────
function _icon(type) {
  const iconMap = {
    bumper: `<div class="cft-card-icon icon-bumper"></div>`,
    ramp: `<div class="cft-card-icon icon-ramp"></div>`,
    combo: `<div class="cft-card-icon icon-combo"></div>`,
    secret: `<div class="cft-card-icon icon-secret"></div>`,
    animal: `<div class="cft-card-icon icon-animal"><div class="panda-face"><div class="panda-ear panda-ear-l"></div><div class="panda-ear panda-ear-r"></div><div class="panda-head"><div class="panda-eye panda-eye-l"></div><div class="panda-eye panda-eye-r"></div><div class="panda-nose"></div></div></div></div>`,
    social: `<div class="cft-card-icon icon-social"></div>`,
    drama: `<div class="cft-card-icon icon-drama"></div>`,
    hit: `<div class="cft-card-icon icon-bumper"></div>`,
    bonus: `<div class="cft-card-icon icon-ramp"></div>`,
    pitch: `<div class="cft-card-icon icon-pitch"></div>`,
    role: `<div class="cft-card-icon icon-role"></div>`,
    chef: `<div class="cft-card-icon icon-chef"></div>`,
    clash: `<div class="cft-card-icon icon-clash"></div>`,
    bomb: `<div class="cft-card-icon icon-bomb"></div>`,
    sabotage: `<div class="cft-card-icon icon-sabotage"></div>`,
    heart: `<div class="cft-card-icon icon-heart"></div>`,
    breakthrough: `<div class="cft-card-icon icon-breakthrough"></div>`,
    teamwork: `<div class="cft-card-icon icon-teamwork"></div>`,
  };
  return iconMap[type] || '';
}

// ── Sidebar builder ──────────────────────────────────────────────────
function _buildSidebar(ep, phase) {
  return `<div class="cft-sidebar"><div id="cft-sidebar-inner" class="cft-scoreboard">
    ${_buildSidebarContent(ep, phase)}
  </div></div>`;
}

function _buildSidebarContent(ep, phase) {
  const data = ep.crazyFunTime;
  if (!data) return '';
  const phaseData = (typeof window !== 'undefined' && window._cftPhaseData) ? window._cftPhaseData : {};

  const phaseLabels = {
    title: 'TITLE CARD',
    pinball: 'PHASE 1 — PINBALL ARENA',
    drama: 'INTERMISSION — DRAMA BREAK',
    commercial: 'PHASE 2 — COMMERCIAL STUDIO',
    verdict: "PHASE 3 — CHEF'S VERDICT",
    results: 'FINAL RESULTS',
  };

  let sbContent = '';

  if (phase === 'title') {
    // Roster view, no spoilers
    sbContent = data.tribes.map(t => {
      const col = tribeColor(t.tribeName);
      const roster = t.tribeMembers.map(n => {
        const slug = n.toLowerCase().replace(/\s+/g, '-');
        return `<img class="cft-sb-av" style="border-color:${col};" src="assets/avatars/${slug}.png" alt="${n}" title="${n}">`;
      }).join('');
      return `<div class="cft-sb-team">
        <div class="cft-sb-team-header"><span class="cft-sb-team-name" style="color:${col};">${t.tribeName}</span></div>
        <div class="cft-sb-roster">${roster}</div>
      </div>`;
    }).join('');

  } else if (phase === 'pinball') {
    // Rosters + running score digits + zone bars — accumulate from step metadata
    const pinSt = _tvState['cft-pinball'];
    const revealIdx = pinSt ? pinSt.idx : -1;
    const meta = (typeof window !== 'undefined' && window._cftPinballStepMeta) ? window._cftPinballStepMeta : [];
    // Accumulate scores/zones per tribe up to reveal index
    const runningScores = {};
    const runningBumpers = {};
    const runningRamps = {};
    const runningSecrets = {};
    data.tribes.forEach(t => { runningScores[t.tribeName] = 0; runningBumpers[t.tribeName] = 0; runningRamps[t.tribeName] = 0; runningSecrets[t.tribeName] = 0; });
    for (let i = 0; i <= revealIdx && i < meta.length; i++) {
      const m = meta[i];
      if (m.tribe) {
        runningScores[m.tribe] += m.points;
        runningBumpers[m.tribe] += m.bumpers;
        runningRamps[m.tribe] += m.ramps;
        runningSecrets[m.tribe] += m.secrets;
      }
    }
    sbContent = data.tribes.map(t => {
      const col = tribeColor(t.tribeName);
      const roster = t.tribeMembers.map(n => {
        const slug = n.toLowerCase().replace(/\s+/g, '-');
        const isRep = n === t.rep.name;
        return `<img class="cft-sb-av${isRep ? ' is-rep' : ''}" style="border-color:${col};" src="assets/avatars/${slug}.png" alt="${n}" title="${n}${isRep ? ' ★ REP' : ''}">`;
      }).join('');
      const showScore = revealIdx >= 0;
      const scoreDigits = showScore ? _sbDigits(runningScores[t.tribeName] || 0, col) : '';
      const tBumpers = runningBumpers[t.tribeName] || 0;
      const tRamps = runningRamps[t.tribeName] || 0;
      const tSecrets = runningSecrets[t.tribeName] || 0;
      const maxHits = Math.max(tBumpers, tRamps, tSecrets, 1);
      const zoneBars = showScore ? `<div class="cft-sb-zones">
        <div class="cft-sb-zone"><div class="cft-sb-zone-dot" style="background:var(--cft-teal);"></div><span class="cft-sb-label">BUMPER</span><div class="cft-sb-zone-bar"><div class="cft-sb-zone-fill" style="width:${(tBumpers / maxHits) * 100}%;background:var(--cft-teal);"></div></div></div>
        <div class="cft-sb-zone"><div class="cft-sb-zone-dot" style="background:var(--cft-orange);"></div><span class="cft-sb-label">RAMP</span><div class="cft-sb-zone-bar"><div class="cft-sb-zone-fill" style="width:${(tRamps / maxHits) * 100}%;background:var(--cft-orange);"></div></div></div>
        <div class="cft-sb-zone"><div class="cft-sb-zone-dot" style="background:var(--cft-purple);"></div><span class="cft-sb-label">SECRET</span><div class="cft-sb-zone-bar"><div class="cft-sb-zone-fill" style="width:${(tSecrets / maxHits) * 100}%;background:var(--cft-purple);"></div></div></div>
      </div>` : '';
      return `<div class="cft-sb-team">
        <div class="cft-sb-team-header"><span class="cft-sb-team-name" style="color:${col};">${t.tribeName}</span>${scoreDigits ? `<div class="cft-sb-team-total">${scoreDigits}</div>` : ''}</div>
        <div class="cft-sb-roster">${roster}</div>
        ${showScore ? `<div class="cft-sb-rep-tag">★ REP: ${t.rep.name}</div>` : ''}
        ${zoneBars}
      </div>`;
    }).join('');

  } else if (phase === 'drama') {
    // Drama events list gated by reveal
    const dramaSt = _tvState['cft-drama'];
    const revealIdx = dramaSt ? dramaSt.idx : -1;
    sbContent = `<div style="font-size:8px;color:var(--cft-orange);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;padding:10px 12px 0;">Green Room Activity</div>`;
    sbContent += '<div style="padding:0 12px 10px;">';
    data.dramaEvents.forEach((evt, i) => {
      if (i > revealIdx) return;
      const players = evt.players || [];
      const avatarHtml = players.length > 0 ? (() => {
        const p = players[0];
        const slug = p.toLowerCase().replace(/\s+/g, '-');
        // Find tribe color for this player
        let pCol = 'rgba(255,255,255,0.3)';
        for (const t of data.tribes) { if (t.tribeMembers.includes(p)) { pCol = tribeColor(t.tribeName); break; } }
        return `<img class="cft-sb-av-tiny" style="border-color:${pCol};" src="assets/avatars/${slug}.png" alt="${p}">`;
      })() : '';
      const summaryText = players.length >= 2 ? `${players[0]} → ${players[1]}` : players.length === 1 ? players[0] : 'Event';
      const bondClass = evt.consequence && evt.consequence.includes('-') ? 'neg' : 'pos';
      sbContent += `<div class="cft-sb-drama-event">${avatarHtml ? `<div class="cft-sb-drama-who">${avatarHtml} ${summaryText}</div>` : ''}<div class="cft-sb-drama-what">${evt.badge || evt.type}</div>${evt.consequence ? `<div class="cft-sb-bond ${bondClass}">${evt.consequence.replace(/▸\s*/, '').substring(0, 30)}</div>` : ''}</div>`;
    });
    sbContent += '</div>';

  } else if (phase === 'commercial') {
    // Roles + harmony per tribe
    sbContent = '<div style="padding:10px 12px;">';
    data.commercials.forEach(comm => {
      const col = tribeColor(comm.tribeName);
      const roster = (comm.roles ? Object.values(comm.roles) : []).filter(r => r && r.player).map(r => {
        const slug = r.player.toLowerCase().replace(/\s+/g, '-');
        return `<img class="cft-sb-av" style="border-color:${col};" src="assets/avatars/${slug}.png" alt="${r.player}" title="${r.player} — ${r.role}">`;
      }).join('');
      const hasIntel = comm.hasChefIntel;
      // Build role rows
      const roleRows = ['director', 'writer', 'actor', 'editor'].map(rKey => {
        const r = comm.roles[rKey];
        if (!r) return '';
        const matchCls = r.statMatch === 'good' ? 'good' : r.statMatch === 'bad' ? 'bad' : 'ok';
        return `<div class="cft-sb-role-row"><span class="cft-sb-role-title">${rKey}</span><span class="cft-sb-role-name">${r.player}</span><div class="cft-sb-match-dot ${matchCls}"></div></div>`;
      }).join('');
      // Harmony estimate from production events
      const clashCount = (comm.productionEvents || []).filter(e => e.type === 'clash' || e.type === 'bomb').length;
      const harmonyPct = Math.max(10, Math.min(100, 70 - clashCount * 15 + (hasIntel ? 15 : 0)));
      sbContent += `<div style="font-size:8px;color:var(--cft-amber);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">${comm.tribeName} — Production</div>`;
      sbContent += `<div class="cft-sb-roster" style="margin-bottom:6px;">${roster}</div>`;
      if (hasIntel) sbContent += `<div style="font-size:7px;color:var(--cft-gold);letter-spacing:1px;margin-bottom:4px;">HAS CHEF INTEL ★</div>`;
      else sbContent += `<div style="font-size:7px;color:rgba(255,255,255,0.25);letter-spacing:1px;margin-bottom:4px;">NO CHEF INTEL</div>`;
      sbContent += roleRows;
      sbContent += `<div class="cft-sb-harmony-label">Team Harmony</div><div class="cft-sb-harmony-bar"><div class="cft-sb-harmony-fill" style="width:${harmonyPct}%;"></div></div>`;
      sbContent += `<div style="height:8px;border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:8px;"></div>`;
    });
    sbContent += '</div>';

  } else if (phase === 'verdict') {
    // Score ranking gated by reveal — step 0 is chef intro narration, tribe scores start at step 1
    const verdSt = _tvState['cft-verdict'];
    const revealIdx = verdSt ? verdSt.idx : -1;
    const tribesRevealed = revealIdx - 1; // subtract 1 for chef intro step
    sbContent = `<div style="padding:10px 12px;"><div style="font-size:8px;color:var(--cft-amber);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Chef's Scores</div>`;
    if (tribesRevealed < 0) {
      sbContent += `<div style="font-size:9px;color:rgba(255,255,255,0.3);text-align:center;padding:16px 0;">Awaiting scores...</div>`;
    }
    data.commercials.forEach((comm, ci) => {
      if (ci > tribesRevealed) return;
      const col = tribeColor(comm.tribeName);
      const rank = data.finalRanking.indexOf(comm.tribeName);
      const isWinner = rank === 0;
      const isLoser = rank === data.finalRanking.length - 1;
      const totalScore = data.tribes.find(tr => tr.tribeName === comm.tribeName).pinballScore + comm.scores.total * 100;
      const roster = (data.tribes.find(tr => tr.tribeName === comm.tribeName) || {tribeMembers:[]}).tribeMembers.map(n => {
        const slug = n.toLowerCase().replace(/\s+/g, '-');
        const avCol = isLoser ? 'rgba(239,68,68,0.4)' : col;
        return `<img class="cft-sb-av" style="border-color:${avCol};${isLoser ? 'opacity:.6;' : ''}" src="assets/avatars/${slug}.png" alt="${n}">`;
      }).join('');
      const label = isWinner ? `<div style="font-size:8px;color:var(--cft-green);margin-top:4px;">★ FIRST PLACE — IMMUNITY</div>` : isLoser ? `<div style="font-size:8px;color:var(--cft-red);margin-top:4px;">LAST — TRIBAL COUNCIL</div>` : `<div style="font-size:8px;color:var(--cft-gold);margin-top:4px;">${rank+1}${rank===1?'ND':'RD'} — SAFE</div>`;
      sbContent += `<div class="cft-sb-team" style="padding:8px 0;">
        <div class="cft-sb-team-header"><span class="cft-sb-team-name" style="color:${isLoser ? 'var(--cft-red)' : col};font-size:12px;">${comm.tribeName}</span><span style="font-family:'Bangers',cursive;color:${isWinner ? 'var(--cft-gold)' : 'rgba(255,255,255,0.5)'};font-size:16px;">${Math.round(totalScore).toLocaleString()}</span></div>
        <div class="cft-sb-roster">${roster}</div>
        ${label}
      </div>`;
    });
    sbContent += '</div>';

  } else if (phase === 'results') {
    // Final standings
    const winTribe = data.finalRanking[0];
    const winCol = tribeColor(winTribe);
    const winT = data.tribes.find(tr => tr.tribeName === winTribe);
    const winRoster = winT ? winT.tribeMembers.map(n => {
      const slug = n.toLowerCase().replace(/\s+/g, '-');
      return `<img class="cft-sb-av" style="border-color:${winCol};" src="assets/avatars/${slug}.png" alt="${n}">`;
    }).join('') : '';
    sbContent = `<div style="padding:10px 12px;">
      <div style="font-size:8px;color:var(--cft-gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Final Standings</div>
      <div style="text-align:center;font-family:'Bangers',cursive;font-size:14px;color:var(--cft-green);margin-bottom:6px;">${winTribe} WINS</div>
      <div class="cft-sb-roster" style="justify-content:center;margin-bottom:12px;">${winRoster}</div>
      <div style="font-size:8px;color:var(--cft-red);letter-spacing:1px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);padding-top:8px;">${data.losingTribe} → TRIBAL</div>
    </div>`;
  }

  return `<div class="cft-sb-header">SCOREBOARD</div>
    <div class="cft-sb-phase"><div class="cft-sb-phase-dot"></div><span>${phaseLabels[phase] || ''}</span></div>
    ${sbContent}`;
}

function _sbDigits(score, color) {
  const s = String(Math.round(score)).padStart(4, '0');
  return s.split('').map(d => `<span class="cft-sb-digit" style="color:${color};">${d}</span>`).join('');
}

// ── Shell wrapper with grid + sidebar ────────────────────────────────
function _shell(content, ep, phaseCls = '', sidebarPhase = 'title') {
  const data = ep.crazyFunTime;
  if (!data) return '';

  const sidebar = _buildSidebar(ep, sidebarPhase);

  // Generate blender keyframes for title screen (up to 18 unique)
  let blenderKeyframes = '';
  if (sidebarPhase === 'title') {
    const allPlayers = data.tribes.reduce((acc, t) => acc.concat(t.tribeMembers), []);
    const count = Math.min(allPlayers.length, 18);
    for (let i = 1; i <= count; i++) {
      const pts = [];
      for (let p = 0; p <= 4; p++) {
        pts.push({ top: 8 + Math.floor(((i * 7 + p * 13 + i * p * 3) * 17) % 65), left: 5 + Math.floor(((i * 11 + p * 7 + i * p * 5) * 19) % 80) });
      }
      blenderKeyframes += `@keyframes cft-blender-${i}{0%{top:${pts[0].top}%;left:${pts[0].left}%}20%{top:${pts[1].top}%;left:${pts[1].left}%}40%{top:${pts[2].top}%;left:${pts[2].left}%}60%{top:${pts[3].top}%;left:${pts[3].left}%}80%{top:${pts[4].top}%;left:${pts[4].left}%}100%{top:${pts[0].top}%;left:${pts[0].left}%}}\n`;
    }
  }

  return `
<div class="cft-shell ${phaseCls}" data-phase="${sidebarPhase}">
<style>
@import url('https://fonts.googleapis.com/css2?family=Bangers&family=Press+Start+2P&family=Permanent+Marker&family=Special+Elite&family=Russo+One&display=swap');

.cft-shell{--cft-pink:#ff2d7b;--cft-orange:#ff6b2b;--cft-teal:#00e5c7;--cft-purple:#a855f7;--cft-gold:#fbbf24;--cft-dark:#0f0f1e;--cft-charcoal:#1a1a2e;--cft-amber:#f59e0b;--cft-warm:#fef3c7;--cft-red:#ef4444;--cft-green:#22c55e;--cft-blue:#3b82f6;max-width:1100px;margin:0 auto;font-family:'Russo One',sans-serif;color:#fff;position:relative;display:grid;grid-template-columns:1fr 280px;gap:16px;}
.cft-shell *{box-sizing:border-box;}

/* ── Broadcast chrome ── */
.cft-broadcast{display:flex;align-items:center;padding:6px 12px;background:linear-gradient(90deg,rgba(0,0,0,0.95),rgba(26,26,46,0.95));border-bottom:2px solid var(--cft-teal);border-radius:8px 8px 0 0;font-size:11px;gap:8px;}
.cft-live{display:flex;align-items:center;gap:4px;color:#ff3b3b;text-transform:uppercase;letter-spacing:2px;font-weight:700;font-size:10px;}
.cft-live-dot{width:7px;height:7px;background:#ff3b3b;border-radius:50%;animation:cft-blink 1s infinite;}
@keyframes cft-blink{0%,100%{opacity:1}50%{opacity:.2}}
.cft-ticker{flex:1;overflow:hidden;height:16px;position:relative;}
.cft-ticker-text{position:absolute;white-space:nowrap;animation:cft-scroll 25s linear infinite;font-size:10px;color:var(--cft-gold);letter-spacing:1px;}
@keyframes cft-scroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.cft-channel{font-family:'Bangers',cursive;color:var(--cft-teal);font-size:14px;letter-spacing:2px;}

/* ── CSS icon system ── */
.cft-card-icon{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
/* ── Bumper: circle with inner ring (pinball bumper) ── */
.cft-card-icon.icon-bumper{background:rgba(255,45,123,0.2);border:2px solid var(--cft-pink);}
.cft-card-icon.icon-bumper::before{content:'';width:14px;height:14px;border-radius:50%;border:3px solid var(--cft-pink);background:rgba(255,45,123,0.3);}
/* ── Ramp: upward arrow/chevron ── */
.cft-card-icon.icon-ramp{background:rgba(255,107,43,0.15);border:2px solid var(--cft-orange);}
.cft-card-icon.icon-ramp::before{content:'';width:14px;height:14px;background:var(--cft-orange);clip-path:polygon(50% 0%,100% 60%,75% 60%,75% 100%,25% 100%,25% 60%,0% 60%);}
/* ── Combo: starburst/explosion ── */
.cft-card-icon.icon-combo{background:rgba(255,45,123,0.25);border:2px solid var(--cft-pink);}
.cft-card-icon.icon-combo::before{content:'';width:16px;height:16px;background:var(--cft-pink);clip-path:polygon(50% 0%,63% 28%,98% 20%,72% 45%,100% 65%,68% 60%,55% 100%,45% 65%,10% 80%,32% 50%,0% 30%,38% 32%);}
/* ── Secret: keyhole ── */
.cft-card-icon.icon-secret{background:rgba(168,85,247,0.2);border:2px solid var(--cft-purple);}
.cft-card-icon.icon-secret::before{content:'';width:14px;height:14px;background:var(--cft-purple);clip-path:polygon(35% 45%,35% 100%,65% 100%,65% 45%,80% 30%,80% 15%,65% 0%,35% 0%,20% 15%,20% 30%);}
/* ── Animal: CSS panda face ── */
.cft-card-icon.icon-animal{background:rgba(168,85,247,0.15);border:2px solid var(--cft-purple);overflow:visible;position:relative;}
.panda-face{position:relative;width:20px;height:18px;}
.panda-ear{position:absolute;width:7px;height:7px;background:#1a1a2e;border-radius:50%;top:-2px;}
.panda-ear-l{left:0;}
.panda-ear-r{right:0;}
.panda-head{position:absolute;top:2px;left:2px;right:2px;bottom:0;background:#f0f0f0;border-radius:50%;overflow:hidden;}
.panda-eye{position:absolute;width:5px;height:6px;background:#1a1a2e;border-radius:50%;top:3px;}
.panda-eye-l{left:2px;transform:rotate(-10deg);}
.panda-eye-r{right:2px;transform:rotate(10deg);}
.panda-nose{position:absolute;width:3px;height:2px;background:#1a1a2e;border-radius:1px;bottom:3px;left:50%;transform:translateX(-50%);}
/* ── Social: two overlapping circles (people) ── */
.cft-card-icon.icon-social{background:rgba(0,229,199,0.2);border:2px solid var(--cft-teal);position:relative;}
.cft-card-icon.icon-social::before{content:'';position:absolute;width:9px;height:9px;background:var(--cft-teal);border-radius:50%;left:5px;top:8px;}
.cft-card-icon.icon-social::after{content:'';position:absolute;width:9px;height:9px;background:rgba(0,229,199,0.6);border-radius:50%;right:5px;top:8px;}
/* ── Drama: lightning bolt ── */
.cft-card-icon.icon-drama{background:rgba(255,107,43,0.2);border:2px solid var(--cft-orange);}
.cft-card-icon.icon-drama::before{content:'';width:12px;height:14px;background:var(--cft-orange);clip-path:polygon(60% 0%,25% 45%,50% 45%,35% 100%,80% 50%,55% 50%);}
/* ── Pitch: megaphone ── */
.cft-card-icon.icon-pitch{background:rgba(251,191,36,0.15);border:2px solid var(--cft-gold);}
.cft-card-icon.icon-pitch::before{content:'';width:14px;height:12px;background:var(--cft-gold);clip-path:polygon(0% 35%,0% 65%,30% 65%,100% 100%,100% 0%,30% 35%);}
/* ── Role: clapperboard ── */
.cft-card-icon.icon-role{background:rgba(245,158,11,0.15);border:2px solid var(--cft-amber);}
.cft-card-icon.icon-role::before{content:'';width:14px;height:12px;background:var(--cft-amber);clip-path:polygon(0% 30%,15% 0%,30% 30%,45% 0%,60% 30%,75% 0%,100% 30%,100% 100%,0% 100%);}
/* ── Chef: chef hat ── */
.cft-card-icon.icon-chef{background:rgba(251,191,36,0.2);border:2px solid var(--cft-gold);}
.cft-card-icon.icon-chef::before{content:'';width:14px;height:14px;background:var(--cft-gold);clip-path:polygon(15% 100%,15% 55%,0% 45%,10% 15%,30% 0%,50% 5%,70% 0%,90% 15%,100% 45%,85% 55%,85% 100%);}
/* ── Production event icons ── */
/* Clash: two crossed swords */
.cft-card-icon.icon-clash{background:rgba(239,68,68,0.2);border:2px solid var(--cft-red);}
.cft-card-icon.icon-clash::before{content:'';width:16px;height:16px;background:var(--cft-red);clip-path:polygon(15% 0%,25% 0%,55% 40%,85% 0%,95% 0%,95% 10%,60% 50%,95% 85%,95% 95%,85% 95%,55% 60%,25% 95%,15% 95%,15% 85%,45% 50%,15% 10%);}
/* Bomb: round bomb shape */
.cft-card-icon.icon-bomb{background:rgba(239,68,68,0.25);border:2px solid var(--cft-red);}
.cft-card-icon.icon-bomb::before{content:'';width:14px;height:14px;background:var(--cft-red);clip-path:polygon(40% 5%,55% 0%,60% 12%,80% 20%,95% 40%,100% 60%,95% 80%,80% 95%,60% 100%,40% 100%,20% 95%,5% 80%,0% 60%,5% 40%,20% 20%);}
.cft-card-icon.icon-bomb::after{content:'';position:absolute;top:2px;right:4px;width:4px;height:6px;background:var(--cft-orange);border-radius:50% 50% 20% 20%;animation:cft-fuse .6s infinite alternate;}
@keyframes cft-fuse{0%{opacity:.4;transform:scale(.8)}100%{opacity:1;transform:scale(1.2)}}
/* Sabotage: broken gear */
.cft-card-icon.icon-sabotage{background:rgba(255,107,43,0.2);border:2px solid var(--cft-orange);}
.cft-card-icon.icon-sabotage::before{content:'';width:16px;height:16px;background:var(--cft-orange);clip-path:polygon(40% 0%,60% 0%,60% 15%,80% 20%,90% 5%,100% 15%,85% 30%,95% 45%,95% 55%,85% 70%,100% 85%,90% 95%,75% 80%,60% 90%,60% 100%,40% 100%,40% 90%,25% 80%,10% 95%,0% 85%,15% 70%,5% 55%,5% 45%,15% 30%,0% 15%,10% 5%,20% 20%,40% 15%);}
/* Heart: showmance */
.cft-card-icon.icon-heart{background:rgba(255,45,123,0.15);border:2px solid var(--cft-pink);}
.cft-card-icon.icon-heart::before{content:'';width:14px;height:13px;background:var(--cft-pink);clip-path:polygon(50% 100%,0% 35%,0% 15%,15% 0%,35% 0%,50% 20%,65% 0%,85% 0%,100% 15%,100% 35%);}
/* Breakthrough: lightbulb */
.cft-card-icon.icon-breakthrough{background:rgba(251,191,36,0.2);border:2px solid var(--cft-gold);animation:cft-glow 1.5s ease-in-out infinite alternate;}
@keyframes cft-glow{0%{box-shadow:0 0 4px rgba(251,191,36,0.2)}100%{box-shadow:0 0 12px rgba(251,191,36,0.5)}}
.cft-card-icon.icon-breakthrough::before{content:'';width:12px;height:14px;background:var(--cft-gold);clip-path:polygon(50% 0%,20% 40%,35% 40%,25% 65%,40% 65%,40% 100%,60% 100%,60% 65%,75% 65%,65% 40%,80% 40%);}
/* Teamwork: interlocking hands/chain */
.cft-card-icon.icon-teamwork{background:rgba(34,197,94,0.15);border:2px solid var(--cft-green);}
.cft-card-icon.icon-teamwork::before{content:'';width:16px;height:12px;background:var(--cft-green);clip-path:polygon(0% 25%,20% 0%,40% 25%,50% 15%,60% 25%,80% 0%,100% 25%,100% 50%,80% 75%,60% 50%,50% 60%,40% 50%,20% 75%,0% 50%);}
/* ── Role CSS icons (replace emoji in clapperboard) ── */
.cft-role-css-icon{width:18px;height:18px;display:inline-block;vertical-align:middle;}
.cft-role-css-icon::before{content:'';display:block;width:100%;height:100%;}
.role-director::before{background:currentColor;clip-path:polygon(0% 30%,15% 0%,30% 30%,45% 0%,60% 30%,75% 0%,100% 30%,100% 100%,0% 100%);}
.role-writer::before{background:currentColor;clip-path:polygon(10% 0%,25% 0%,25% 70%,90% 70%,90% 85%,25% 85%,25% 100%,10% 100%);}
.role-actor::before{background:currentColor;clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);}
.role-editor::before{background:currentColor;clip-path:polygon(0% 20%,40% 20%,40% 0%,60% 0%,60% 20%,100% 20%,100% 80%,60% 80%,60% 100%,40% 100%,40% 80%,0% 80%);}

/* ── Cards ── */
.cft-card{background:linear-gradient(135deg,rgba(26,26,46,0.9),rgba(15,15,30,0.95));border:1px solid rgba(0,229,199,0.2);border-radius:8px;padding:12px 14px;margin:8px 0;position:relative;overflow:hidden;animation:cft-card-slam .5s cubic-bezier(.34,1.56,.64,1) forwards;}
@keyframes cft-card-slam{0%{opacity:0;transform:translateY(30px) scale(.95)}50%{opacity:1;transform:translateY(-5px) scale(1.03)}70%{transform:translateY(2px) scale(.99)}100%{opacity:1;transform:translateY(0) scale(1)}}
.cft-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;}
.cft-card.cft-hit::before{background:var(--cft-pink);}
.cft-card.cft-bonus::before{background:var(--cft-gold);}
.cft-card.cft-social::before{background:var(--cft-teal);}
.cft-card.cft-animal::before{background:var(--cft-purple);}
.cft-card.cft-drama::before{background:var(--cft-orange);}
.cft-card-header{display:flex;align-items:center;gap:8px;margin-bottom:4px;}
.cft-card-label{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);}
.cft-card-points{margin-left:auto;font-family:'Bangers',cursive;font-size:18px;color:var(--cft-gold);text-shadow:0 0 8px rgba(251,191,36,0.4);}
.cft-card-text{font-size:12px;color:rgba(255,255,255,0.85);line-height:1.5;}
.cft-card-text strong{color:var(--cft-teal);}
.cft-card-consequence{margin-top:6px;font-size:10px;color:var(--cft-gold);letter-spacing:1px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.05);}

/* ── Step visibility ── */
.cft-step{display:none;}
.cft-step.cft-visible{display:block;}

/* ── Flavor text ── */
.cft-flavor{text-align:center;font-family:'Bangers',cursive;font-size:12px;color:rgba(255,107,43,0.5);letter-spacing:2px;padding:2px 0;text-transform:uppercase;}

/* ── Avatar ── */
.cft-av{width:32px;height:32px;border-radius:50%;border:2px solid;object-fit:cover;vertical-align:middle;flex-shrink:0;}
.cft-av-sm{width:24px;height:24px;}
.cft-av-lg{width:48px;height:48px;}
.cft-av-xl{width:64px;height:64px;border-width:3px;}
.cft-av.is-rep{box-shadow:0 0 12px rgba(251,191,36,0.6);animation:cft-rep-glow 2s ease-in-out infinite;}
@keyframes cft-rep-glow{0%,100%{box-shadow:0 0 8px rgba(251,191,36,0.4)}50%{box-shadow:0 0 20px rgba(251,191,36,0.8)}}

/* ── Score digits ── */
.cft-digits{display:inline-flex;gap:2px;}
.cft-digit{display:inline-flex;align-items:center;justify-content:center;width:24px;height:32px;background:linear-gradient(180deg,#222 0%,#111 49%,#000 50%,#1a1a1a 100%);border:1px solid rgba(255,255,255,0.2);border-radius:3px;font-family:'Russo One',sans-serif;font-size:18px;text-shadow:0 0 8px currentColor;position:relative;}
.cft-digit::after{content:'';position:absolute;left:0;right:0;top:49%;height:1px;background:rgba(0,0,0,0.8);}

/* ── Burst text ── */
.cft-burst{position:relative;display:inline-block;font-family:'Bangers',cursive;font-size:28px;color:var(--cft-gold);text-shadow:3px 3px 0 var(--cft-pink),-1px -1px 0 var(--cft-orange);-webkit-text-stroke:1.5px #000;letter-spacing:2px;z-index:20;}

/* ── Pinball machine elements ── */
.cft-bumper{position:absolute;width:40px;height:40px;border-radius:50%;border:3px solid var(--cft-teal);background:radial-gradient(circle,rgba(0,229,199,0.2) 0%,transparent 70%);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--cft-teal);font-family:'Russo One',sans-serif;}
.cft-bumper.hit{animation:cft-bumper-hit .5s ease-out;border-color:var(--cft-pink);background:radial-gradient(circle,rgba(255,45,123,0.3) 0%,transparent 70%);}
@keyframes cft-bumper-hit{0%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,45,123,0.6)}50%{transform:scale(1.3);box-shadow:0 0 0 20px rgba(255,45,123,0)}100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,45,123,0)}}
.cft-ramp{position:absolute;width:70px;height:7px;background:linear-gradient(90deg,var(--cft-orange),var(--cft-gold));border-radius:4px;box-shadow:0 0 12px rgba(255,107,43,0.4);}
.cft-secret-lane{position:absolute;width:55px;height:22px;border:2px dashed var(--cft-purple);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--cft-purple);letter-spacing:1px;font-family:'Russo One',sans-serif;animation:cft-lane-pulse 2s ease-in-out infinite;}
@keyframes cft-lane-pulse{0%,100%{opacity:.4;box-shadow:0 0 0 0 rgba(168,85,247,0)}50%{opacity:1;box-shadow:0 0 15px rgba(168,85,247,0.3)}}
.cft-ball{position:absolute;width:48px;height:48px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;z-index:10;overflow:hidden;}
.cft-ball img{width:100%;height:100%;border-radius:50%;object-fit:cover;}
.cft-burst-float{position:absolute;font-family:'Bangers',cursive;font-size:28px;color:var(--cft-gold);text-shadow:3px 3px 0 var(--cft-pink),-1px -1px 0 var(--cft-orange);-webkit-text-stroke:1.5px #000;z-index:20;animation:cft-burst-pop .8s ease-out infinite;pointer-events:none;}
@keyframes cft-burst-pop{0%{transform:scale(0) rotate(-10deg);opacity:0}30%{transform:scale(1.4) rotate(5deg);opacity:1}60%{transform:scale(.95) rotate(-2deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:0}}

/* ── Team score bar ── */
.cft-team-score{display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:6px;border:1px solid;background:rgba(0,0,0,0.3);min-width:200px;}
.cft-team-score-avatars{display:flex;align-items:center;position:relative;flex-shrink:0;}
.cft-team-score-avatars .cft-av-sm{margin-right:-6px;}
.cft-team-score-animal{width:28px;height:28px;border-radius:50%;border:2px solid;background:rgba(168,85,247,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.cft-team-score-animal .cft-card-icon{width:20px;height:20px;border:none;background:none;}
.cft-team-score-name{font-family:'Bangers',cursive;font-size:13px;letter-spacing:1px;}
.cft-multiplier{font-family:'Bangers',cursive;font-size:18px;color:var(--cft-orange);animation:cft-pulse-mult .6s ease-in-out infinite;}
@keyframes cft-pulse-mult{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}

/* ── Pitch card ── */
.cft-pitch{background:linear-gradient(180deg,#fef3c7,#fde68a);border-radius:4px;padding:12px 14px 12px 18px;color:#1a1a1a;border:1px solid rgba(146,64,14,0.2);box-shadow:2px 2px 8px rgba(0,0,0,0.3);margin:8px 0;position:relative;animation:cft-card-slam .5s cubic-bezier(.34,1.56,.64,1) forwards;}
.cft-pitch::before{content:'';position:absolute;top:-5px;left:28px;width:12px;height:12px;background:radial-gradient(circle at 40% 40%,#ff6b6b,#cc3333);border-radius:50%;border:1px solid #aa2222;box-shadow:0 2px 4px rgba(0,0,0,0.3);}
.cft-pitch-name{font-family:'Permanent Marker',cursive;font-size:13px;color:#78350f;display:flex;align-items:center;gap:6px;margin-bottom:3px;}
.cft-pitch-idea{font-family:'Special Elite',cursive;font-size:12px;color:#44403c;line-height:1.4;}
.cft-stars{display:flex;gap:2px;margin-top:4px;}
.cft-star{width:12px;height:12px;position:relative;}
.cft-star::before{content:'';position:absolute;width:12px;height:12px;background:var(--cft-amber);clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);}
.cft-star.empty::before{background:rgba(146,64,14,0.2);}
.cft-stamp{position:absolute;top:50%;right:16px;transform:translateY(-50%) rotate(-12deg);font-family:'Bangers',cursive;font-size:18px;padding:3px 10px;border:3px solid;border-radius:4px;letter-spacing:2px;}
.cft-stamp.approved{color:#16a34a;border-color:#16a34a;}
.cft-stamp.rejected{color:#dc2626;border-color:#dc2626;}

/* ── Debate card ── */
.cft-debate{background:linear-gradient(135deg,rgba(40,30,15,0.9),rgba(30,20,10,0.95));border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:12px 14px;margin:6px 0;position:relative;animation:cft-card-slam .5s cubic-bezier(.34,1.56,.64,1) forwards;}
.cft-debate::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:var(--cft-amber);}
.cft-debate-who{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.cft-debate-who-name{font-family:'Permanent Marker',cursive;font-size:12px;}
.cft-debate-role{font-size:8px;color:var(--cft-amber);letter-spacing:1px;text-transform:uppercase;padding:1px 6px;background:rgba(245,158,11,0.15);border-radius:3px;}
.cft-debate-text{font-family:'Special Elite',cursive;font-size:12px;color:rgba(255,255,255,0.8);line-height:1.5;font-style:italic;}

/* ── Role card ── */
.cft-role{background:linear-gradient(180deg,#fff7ed,#fed7aa);border-radius:4px;padding:10px 14px;color:#1a1a1a;display:flex;align-items:center;gap:10px;margin:6px 0;border:1px solid rgba(146,64,14,0.2);box-shadow:2px 2px 6px rgba(0,0,0,0.2);animation:cft-card-slam .5s cubic-bezier(.34,1.56,.64,1) forwards;}
.cft-role-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.cft-role-title{font-family:'Permanent Marker',cursive;font-size:12px;color:#78350f;}
.cft-match{display:inline-block;padding:1px 6px;border-radius:3px;font-size:8px;font-family:'Russo One',sans-serif;letter-spacing:1px;margin-left:4px;}
.cft-match.good{background:#dcfce7;color:#16a34a;}
.cft-match.bad{background:#fef2f2;color:#dc2626;}
.cft-match.ok{background:#fef9c3;color:#a16207;}
.cft-role-desc{font-family:'Special Elite',cursive;font-size:11px;color:#57534e;margin-top:2px;}

/* ── Clapper ── */
.cft-clapper{display:flex;align-items:stretch;margin:12px 0;border-radius:6px;overflow:hidden;position:relative;z-index:2;}
.cft-clapper-stripes{width:44px;flex-shrink:0;background:repeating-linear-gradient(-45deg,#111 0px,#111 5px,var(--cft-amber) 5px,var(--cft-amber) 10px);}
.cft-clapper-text{flex:1;background:rgba(0,0,0,0.6);padding:7px 12px;font-family:'Special Elite',cursive;font-size:13px;color:var(--cft-warm);border:1px solid rgba(245,158,11,0.2);display:flex;justify-content:space-between;align-items:center;}
.cft-clapper-take{font-size:9px;color:var(--cft-amber);font-family:'Russo One',sans-serif;letter-spacing:1px;}

/* ── Chef section ── */
.cft-chef-bar-wrap{flex:1;height:20px;background:rgba(255,255,255,0.08);border-radius:10px;overflow:hidden;position:relative;}
.cft-chef-bar-fill{height:100%;border-radius:10px;position:relative;animation:cft-bar-grow 1.5s cubic-bezier(.34,1.56,.64,1) forwards;transform-origin:left center;transform:scaleX(0);}
@keyframes cft-bar-grow{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
.cft-chef-bar-fill::after{content:'';position:absolute;top:0;right:0;bottom:0;width:4px;background:rgba(255,255,255,0.6);border-radius:0 10px 10px 0;}
.cft-chef-score-row:nth-child(2) .cft-chef-bar-fill{animation-delay:.15s}
.cft-chef-score-row:nth-child(3) .cft-chef-bar-fill{animation-delay:.3s}
.cft-chef-score-row:nth-child(4) .cft-chef-bar-fill{animation-delay:.45s}
.cft-chef-score-row:nth-child(5) .cft-chef-bar-fill{animation-delay:.6s}
@media(prefers-reduced-motion:reduce){.cft-chef-bar-fill{animation:none;transform:scaleX(1);}}
.cft-chef-score-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(245,158,11,0.1);}
.cft-chef-cat{width:90px;font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase;}
.cft-chef-val{font-family:'Bangers',cursive;font-size:22px;width:40px;text-align:right;}
.cft-panda-react{width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;}
.panda-react-face{position:relative;width:24px;height:22px;}
.panda-react-ear{position:absolute;width:9px;height:9px;background:#1a1a2e;border-radius:50%;top:-2px;}
.panda-react-ear-l{left:0;}
.panda-react-ear-r{right:0;}
.panda-react-head{position:absolute;top:3px;left:2px;right:2px;bottom:0;background:#f0f0f0;border-radius:50%;overflow:hidden;}
.panda-react-eye{position:absolute;width:5px;height:6px;background:#1a1a2e;border-radius:50%;top:4px;}
.panda-react-eye-l{left:3px;}
.panda-react-eye-r{right:3px;}
.panda-react-mouth{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);}
/* Happy: curved smile */
.cft-panda-react.happy .panda-react-mouth{width:8px;height:4px;border-bottom:2px solid #1a1a2e;border-radius:0 0 50% 50%;}
.cft-panda-react.happy .panda-react-eye{height:3px;top:5px;border-radius:2px;}
.cft-panda-react.happy .panda-react-ear{background:var(--cft-green);}
/* Neutral: flat line */
.cft-panda-react.neutral .panda-react-mouth{width:6px;height:0;border-bottom:2px solid #1a1a2e;}
.cft-panda-react.neutral .panda-react-ear{background:var(--cft-gold);}
/* Sad: frown */
.cft-panda-react.sad .panda-react-mouth{width:8px;height:4px;border-top:2px solid #1a1a2e;border-radius:50% 50% 0 0;}
.cft-panda-react.sad .panda-react-eye{transform:rotate(15deg);}
.cft-panda-react.sad .panda-react-eye-r{transform:rotate(-15deg);}
.cft-panda-react.sad .panda-react-ear{background:var(--cft-red);}

/* ── Quirk reveal ── */
.cft-quirk-reveal{text-align:center;padding:12px;margin:12px 0;border:2px dashed var(--cft-amber);border-radius:8px;background:rgba(245,158,11,0.05);}
.cft-quirk-label{font-size:9px;color:var(--cft-amber);letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;}
.cft-quirk-value{font-family:'Bangers',cursive;font-size:24px;color:var(--cft-gold);text-shadow:0 0 15px rgba(251,191,36,0.5);}

/* ── Drama break cards ── */
.cft-drama-card{background:rgba(26,26,46,0.8);border-radius:8px;padding:12px 14px;border:1px dashed rgba(255,107,43,0.3);margin:6px 0;position:relative;}
.cft-drama-card.from-left{border-left:3px solid var(--cft-orange);animation:cft-slide-left .5s cubic-bezier(.34,1.56,.64,1) forwards;}
.cft-drama-card.from-right{border-right:3px solid var(--cft-pink);text-align:right;animation:cft-slide-right .5s cubic-bezier(.34,1.56,.64,1) forwards;}
@keyframes cft-slide-left{0%{opacity:0;transform:translateX(-40px)}60%{transform:translateX(5px)}100%{opacity:1;transform:translateX(0)}}
@keyframes cft-slide-right{0%{opacity:0;transform:translateX(40px)}60%{transform:translateX(-5px)}100%{opacity:1;transform:translateX(0)}}
.cft-drama-card-header{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.cft-drama-card.from-right .cft-drama-card-header{flex-direction:row-reverse;}
.cft-drama-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(255,45,123,0.15);border:1px solid rgba(255,45,123,0.3);border-radius:4px;font-size:9px;color:var(--cft-pink);text-transform:uppercase;letter-spacing:1px;font-weight:700;white-space:nowrap;}
.cft-drama-avatars{display:flex;gap:2px;margin-left:auto;}
.cft-drama-card.from-right .cft-drama-avatars{margin-left:0;margin-right:auto;}
.cft-av-xs{width:24px;height:24px;border-radius:50%;border:2px solid;object-fit:cover;}

/* ── Title screen ── */
.cft-title-bg{text-align:center;padding:40px 20px;background:var(--cft-charcoal);border-radius:12px;border:2px solid var(--cft-teal);position:relative;overflow:hidden;}
.cft-title-bg::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(0,229,199,0.03) 2px,rgba(0,229,199,0.03) 4px);pointer-events:none;z-index:1;}
.cft-title-bg::after{content:'';position:absolute;bottom:0;left:0;right:0;height:40%;background:linear-gradient(180deg,transparent 0%,rgba(0,229,199,0.05) 100%),repeating-linear-gradient(90deg,transparent 0px,transparent 48px,rgba(0,229,199,0.08) 48px,rgba(0,229,199,0.08) 50px),repeating-linear-gradient(180deg,transparent 0px,transparent 24px,rgba(0,229,199,0.06) 24px,rgba(0,229,199,0.06) 26px);transform:perspective(400px) rotateX(45deg);transform-origin:bottom;pointer-events:none;}
.cft-title-glow{position:relative;z-index:2;}
.cft-title-main{font-family:'Bangers',cursive;font-size:52px;letter-spacing:6px;background:linear-gradient(90deg,var(--cft-pink),var(--cft-orange),var(--cft-gold),var(--cft-teal));background-size:300% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:cft-title-shift 4s ease infinite;filter:drop-shadow(0 0 30px rgba(255,45,123,0.3));line-height:1.1;}
@keyframes cft-title-shift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.cft-title-sub{font-family:'Press Start 2P',monospace;font-size:10px;color:var(--cft-teal);letter-spacing:4px;margin-top:8px;text-shadow:0 0 10px rgba(0,229,199,0.5);}
.cft-title-episode{font-family:'Russo One',sans-serif;font-size:12px;color:var(--cft-gold);letter-spacing:2px;margin-top:16px;text-transform:uppercase;}
.cft-insert-coin{font-family:'Press Start 2P',monospace;font-size:11px;color:var(--cft-gold);margin-top:24px;animation:cft-coin-blink 1.2s step-end infinite;letter-spacing:2px;position:relative;z-index:2;}
@keyframes cft-coin-blink{0%,100%{opacity:1}50%{opacity:0}}

/* ── Machine blender ── */
.cft-machine{position:relative;height:320px;margin:24px auto;max-width:500px;border:2px solid rgba(0,229,199,0.3);border-radius:12px 12px 0 0;background:linear-gradient(180deg,rgba(255,45,123,0.05) 0%,rgba(0,229,199,0.05) 100%);overflow:hidden;z-index:2;}
.cft-machine-ball{position:absolute;width:34px;height:34px;border-radius:50%;border:2px solid;overflow:hidden;z-index:2;}
.cft-machine-ball img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.cft-title-bumper{position:absolute;width:20px;height:20px;border-radius:50%;border:2px solid;opacity:0.6;}

/* ── Teams row ── */
.cft-teams-row{display:flex;justify-content:center;gap:32px;flex-wrap:wrap;position:relative;z-index:2;margin-top:24px;}
.cft-team-block{text-align:center;}
.cft-team-name{font-family:'Bangers',cursive;font-size:14px;letter-spacing:2px;}
.cft-team-count{font-size:9px;color:rgba(255,255,255,0.4);font-family:'Russo One',sans-serif;letter-spacing:1px;}

/* ── Pinball arena bg ── */
.cft-arena-bg{background:var(--cft-charcoal);border-radius:12px;border:2px solid var(--cft-teal);overflow:hidden;position:relative;}
.cft-arena-header{background:linear-gradient(180deg,#000 0%,var(--cft-charcoal) 100%);padding:20px 24px 12px;text-align:center;position:relative;}
.cft-arena-title{font-family:'Bangers',cursive;font-size:32px;letter-spacing:4px;background:linear-gradient(90deg,var(--cft-pink),var(--cft-orange),var(--cft-gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(255,45,123,0.4));}
.cft-arena-sub{font-size:10px;color:var(--cft-teal);letter-spacing:3px;text-transform:uppercase;margin-top:2px;}
.cft-pinball-machine{position:relative;height:260px;margin:12px;background:radial-gradient(circle at 30% 40%,rgba(255,45,123,0.06) 0%,transparent 50%),radial-gradient(circle at 70% 60%,rgba(0,229,199,0.06) 0%,transparent 50%);border:2px solid rgba(0,229,199,0.2);border-radius:8px 8px 0 0;overflow:hidden;}

/* ── Drama header ── */
.cft-drama-header{background:linear-gradient(135deg,var(--cft-pink),var(--cft-orange),var(--cft-gold));padding:20px;text-align:center;position:relative;overflow:hidden;}
.cft-drama-header::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:repeating-linear-gradient(45deg,transparent 0px,transparent 20px,rgba(255,255,255,0.05) 20px,rgba(255,255,255,0.05) 22px);animation:cft-stripes 3s linear infinite;}
@keyframes cft-stripes{0%{transform:translateX(0)}100%{transform:translateX(28px)}}
.cft-drama-title{font-family:'Bangers',cursive;font-size:30px;letter-spacing:4px;color:#fff;text-shadow:3px 3px 0 rgba(0,0,0,0.3);position:relative;z-index:1;}

/* ── Studio bg ── */
.cft-studio-bg{background:linear-gradient(180deg,#2d1f0e,#1a150c);border-radius:12px;border:2px solid rgba(245,158,11,0.3);overflow:hidden;position:relative;}
.cft-film{position:absolute;top:0;bottom:0;width:22px;background:#111;display:flex;flex-direction:column;gap:7px;padding:10px 3px;z-index:1;}
.cft-film-l{left:0;}.cft-film-r{right:0;}
.cft-film-perf{width:16px;height:9px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:2px;}
.cft-studio-header{padding:20px 40px 12px;text-align:center;position:relative;z-index:2;}
.cft-studio-title{font-family:'Permanent Marker',cursive;font-size:26px;color:var(--cft-warm);text-shadow:2px 2px 0 rgba(0,0,0,0.4);}
.cft-studio-sub{font-family:'Special Elite',cursive;font-size:11px;color:var(--cft-amber);letter-spacing:2px;margin-top:2px;}
.cft-studio-content{padding:6px 36px 12px;display:flex;flex-direction:column;gap:8px;position:relative;z-index:2;}

/* ── Chef panel ── */
.cft-chef-panel{padding:16px;background:rgba(0,0,0,0.4);border:2px solid var(--cft-amber);border-radius:12px;margin:12px 0;}
.cft-chef-intro{display:flex;align-items:center;gap:16px;padding:16px;background:rgba(0,0,0,0.4);border:2px solid var(--cft-amber);border-radius:12px;margin-bottom:16px;}
.cft-chef-speech{font-family:'Special Elite',cursive;font-size:14px;color:var(--cft-warm);line-height:1.5;position:relative;padding-left:16px;border-left:3px solid var(--cft-amber);}

/* ── Chef stamp animation ── */
.cft-chef-stamp-result{display:inline-block;font-family:'Bangers',cursive;font-size:36px;padding:12px 32px;border:4px solid;border-radius:8px;letter-spacing:4px;transform:rotate(-8deg);}
.cft-chef-stamp-result.winner{color:var(--cft-green);border-color:var(--cft-green);box-shadow:0 0 30px rgba(34,197,94,0.3);}
.cft-chef-stamp-result.loser{color:var(--cft-red);border-color:var(--cft-red);box-shadow:0 0 30px rgba(239,68,68,0.3);}
.cft-chef-stamp-result.mid{color:var(--cft-gold);border-color:var(--cft-gold);box-shadow:0 0 30px rgba(251,191,36,0.3);}

/* ── Results screen ── */
.cft-results{text-align:center;padding:30px 20px;position:relative;overflow:hidden;border-radius:12px;border:2px solid var(--cft-gold);background:var(--cft-charcoal);}
.cft-results::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(0deg,transparent 0px,transparent 2px,rgba(251,191,36,0.02) 2px,rgba(251,191,36,0.02) 4px);pointer-events:none;z-index:1;}
.cft-results-title{position:relative;z-index:2;font-family:'Bangers',cursive;font-size:38px;letter-spacing:4px;background:linear-gradient(90deg,var(--cft-gold),var(--cft-orange),var(--cft-pink));-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(251,191,36,0.4));}
.cft-results-sub{position:relative;z-index:2;font-family:'Press Start 2P',monospace;font-size:9px;color:var(--cft-teal);letter-spacing:3px;margin-top:6px;}
.cft-result-team{padding:16px;border-radius:12px;border:2px solid;min-width:200px;background:rgba(0,0,0,0.3);display:inline-block;vertical-align:top;margin:8px;position:relative;overflow:hidden;}
.cft-result-team.winner{border-color:var(--cft-gold);box-shadow:0 0 30px rgba(251,191,36,0.2);}
.cft-result-team.winner::after{content:'IMMUNITY';position:absolute;top:8px;right:-20px;background:var(--cft-gold);color:#000;font-family:'Bangers',cursive;font-size:10px;letter-spacing:2px;padding:2px 28px;transform:rotate(35deg);}
.cft-result-team.loser{border-color:rgba(239,68,68,0.5);opacity:0.85;}
.cft-result-team-name{font-family:'Bangers',cursive;font-size:18px;letter-spacing:2px;}
.cft-result-team-score{font-family:'Press Start 2P',monospace;font-size:16px;margin:8px 0;}
.cft-result-roster{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-top:8px;}
.cft-result-player{display:flex;flex-direction:column;align-items:center;gap:2px;}
.cft-result-player-name{font-size:7px;color:rgba(255,255,255,0.6);font-family:'Russo One',sans-serif;letter-spacing:.5px;max-width:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

/* ── Confetti ── */
.cft-confetti{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.cft-confetti-piece{position:absolute;width:8px;height:8px;opacity:.7;}
.cft-confetti-piece:nth-child(1){background:var(--cft-pink);top:-10px;left:10%;animation:cft-confetti-fall 3s linear infinite;}
.cft-confetti-piece:nth-child(2){background:var(--cft-teal);top:-10px;left:25%;animation:cft-confetti-fall 2.5s .3s linear infinite;border-radius:50%;}
.cft-confetti-piece:nth-child(3){background:var(--cft-gold);top:-10px;left:40%;animation:cft-confetti-fall 3.2s .7s linear infinite;}
.cft-confetti-piece:nth-child(4){background:var(--cft-orange);top:-10px;left:55%;animation:cft-confetti-fall 2.8s .2s linear infinite;border-radius:50%;}
.cft-confetti-piece:nth-child(5){background:var(--cft-purple);top:-10px;left:70%;animation:cft-confetti-fall 3.5s .5s linear infinite;}
.cft-confetti-piece:nth-child(6){background:var(--cft-teal);top:-10px;left:85%;animation:cft-confetti-fall 2.7s .8s linear infinite;border-radius:50%;}
.cft-confetti-piece:nth-child(7){background:var(--cft-pink);top:-10px;left:15%;animation:cft-confetti-fall 3.1s 1s linear infinite;}
.cft-confetti-piece:nth-child(8){background:var(--cft-gold);top:-10px;left:60%;animation:cft-confetti-fall 2.9s 1.2s linear infinite;border-radius:50%;}
@keyframes cft-confetti-fall{0%{transform:translateY(-10px) rotate(0deg);opacity:.7}100%{transform:translateY(600px) rotate(720deg);opacity:0}}

/* ── Reveal controls (sticky) ── */
.cft-controls{position:sticky;bottom:0;z-index:100;display:flex;justify-content:center;align-items:center;gap:14px;padding:8px 20px;background:rgba(15,15,30,0.95);border-top:2px solid var(--cft-teal);border-radius:0 0 12px 12px;}
.cft-btn{padding:7px 20px;border:2px solid var(--cft-teal);border-radius:6px;background:transparent;color:var(--cft-teal);font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
.cft-btn:hover{background:var(--cft-teal);color:var(--cft-dark);}
.cft-btn-primary{background:var(--cft-teal);color:var(--cft-dark);}
.cft-btn-primary:hover{background:#00ffd9;box-shadow:0 0 15px rgba(0,229,199,0.4);}
.cft-counter{font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:1px;}

/* ── Sidebar ── */
.cft-sidebar{position:sticky;top:16px;align-self:start;}
.cft-scoreboard{background:linear-gradient(180deg,#0a0a1a,#111128);border:2px solid rgba(0,229,199,0.3);border-radius:12px;overflow:hidden;}
.cft-sb-header{background:linear-gradient(90deg,var(--cft-pink),var(--cft-orange));padding:8px 12px;text-align:center;font-family:'Bangers',cursive;font-size:16px;letter-spacing:3px;color:#fff;text-shadow:2px 2px 0 rgba(0,0,0,0.3);}
.cft-sb-phase{padding:6px 12px;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--cft-teal);border-bottom:1px solid rgba(0,229,199,0.1);display:flex;align-items:center;gap:5px;}
.cft-sb-phase-dot{width:6px;height:6px;background:var(--cft-teal);border-radius:50%;animation:cft-blink 1s infinite;}
.cft-sb-team{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.05);}
.cft-sb-team-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.cft-sb-team-name{font-family:'Bangers',cursive;font-size:14px;letter-spacing:1px;}
.cft-sb-team-total{display:flex;gap:2px;}
.cft-sb-digit{width:18px;height:24px;background:linear-gradient(180deg,#1a1a2e 0%,#0f0f1e 49%,#000 50%,#111 100%);border:1px solid rgba(255,255,255,0.15);border-radius:2px;display:flex;align-items:center;justify-content:center;font-family:'Russo One',sans-serif;font-size:12px;text-shadow:0 0 6px currentColor;position:relative;}
.cft-sb-digit::after{content:'';position:absolute;left:0;right:0;top:49%;height:1px;background:rgba(0,0,0,0.6);}
.cft-sb-roster{display:flex;gap:3px;flex-wrap:wrap;margin:6px 0;}
.cft-sb-av{width:28px;height:28px;border-radius:50%;border:2px solid;object-fit:cover;transition:transform .2s;}
.cft-sb-av:hover{transform:scale(1.2);z-index:5;}
.cft-sb-av.is-rep{box-shadow:0 0 8px rgba(251,191,36,0.6);}
.cft-sb-av-tiny{width:16px;height:16px;border-radius:50%;border:1px solid;object-fit:cover;vertical-align:middle;}
.cft-sb-rep-tag{font-size:7px;color:var(--cft-gold);letter-spacing:1px;text-transform:uppercase;display:flex;align-items:center;gap:4px;margin-top:2px;}
.cft-sb-zones{margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.05);}
.cft-sb-zone{display:flex;align-items:center;gap:4px;padding:2px 0;font-size:9px;}
.cft-sb-zone-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.cft-sb-zone-bar{flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;}
.cft-sb-zone-fill{height:100%;border-radius:3px;transition:width .5s;}
.cft-sb-label{color:rgba(255,255,255,0.4);font-size:8px;letter-spacing:1px;width:42px;}
.cft-sb-drama-event{padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:10px;}
.cft-sb-drama-who{font-size:10px;color:var(--cft-orange);display:flex;align-items:center;gap:4px;}
.cft-sb-drama-what{color:rgba(255,255,255,0.4);font-size:9px;margin-top:1px;}
.cft-sb-bond{display:inline-block;padding:1px 5px;border-radius:3px;font-size:8px;margin-top:2px;}
.cft-sb-bond.pos{background:rgba(0,229,199,0.15);color:var(--cft-teal);}
.cft-sb-bond.neg{background:rgba(255,45,123,0.15);color:var(--cft-pink);}
.cft-sb-role-row{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.cft-sb-role-title{font-size:8px;color:var(--cft-amber);letter-spacing:1px;text-transform:uppercase;width:50px;}
.cft-sb-role-name{font-size:10px;color:#fff;flex:1;}
.cft-sb-match-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.cft-sb-match-dot.good{background:#16a34a;}.cft-sb-match-dot.bad{background:#dc2626;}.cft-sb-match-dot.ok{background:var(--cft-amber);}
.cft-sb-harmony-bar{height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;margin-top:6px;}
.cft-sb-harmony-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--cft-teal),var(--cft-gold));transition:width .5s;}
.cft-sb-harmony-label{font-size:7px;color:rgba(255,255,255,0.3);letter-spacing:1px;text-transform:uppercase;margin-top:4px;}

/* ── Ambient particles ── */
.cft-particles{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.cft-particle{position:absolute;width:4px;height:4px;border-radius:50%;opacity:.3;}
.cft-particle:nth-child(1){background:var(--cft-pink);top:20%;left:10%;animation:cft-float 6s infinite}
.cft-particle:nth-child(2){background:var(--cft-teal);top:40%;left:80%;animation:cft-float 8s 1s infinite}
.cft-particle:nth-child(3){background:var(--cft-orange);top:60%;left:30%;animation:cft-float 7s 2s infinite}
.cft-particle:nth-child(4){background:var(--cft-gold);top:80%;left:60%;animation:cft-float 5s .5s infinite}
.cft-particle:nth-child(5){background:var(--cft-purple);top:15%;left:50%;animation:cft-float 9s 1.5s infinite}
@keyframes cft-float{0%,100%{transform:translateY(0) translateX(0);opacity:.3}25%{transform:translateY(-30px) translateX(10px);opacity:.6}50%{transform:translateY(-10px) translateX(-15px);opacity:.2}75%{transform:translateY(-40px) translateX(5px);opacity:.5}}

/* ── Blender bounce keyframes ── */
${blenderKeyframes}

@media(prefers-reduced-motion:reduce){.cft-shell *,.cft-shell *::before,.cft-shell *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}}
@media(max-width:800px){.cft-shell{grid-template-columns:1fr}.cft-sidebar{position:static}}
</style>
<div class="cft-main">
${content}
</div>
${sidebar}
</div>`;
}

function _digits(score, color) {
  const s = String(Math.round(score)).padStart(4, '0');
  return `<span class="cft-digits">${s.split('').map(d => `<span class="cft-digit" style="color:${color};">${d}</span>`).join('')}</span>`;
}

function _avatar(name, color, cls = '') {
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  return `<img class="cft-av ${cls}" style="border-color:${color};" src="assets/avatars/${slug}.png" alt="${name}" title="${name}">`;
}

function _starsHtml(quality, max = 5) {
  let h = '<span class="cft-stars">';
  for (let i = 0; i < max; i++) h += `<span class="cft-star${i >= quality ? ' empty' : ''}"></span>`;
  return h + '</span>';
}

// ══════════════════════════════════════════════════════════════════════
// VP BUILDERS
// ══════════════════════════════════════════════════════════════════════

export function rpBuildCFTTitleCard(ep) {
  const data = ep.crazyFunTime;
  if (!data) return '';

  // Store phase data for sidebar
  if (typeof window !== 'undefined') window._cftPhaseData = { phase: 'title' };

  // All players in blender with unique bounce animations
  let ballIdx = 0;
  const tribeHtml = data.tribes.map(t => {
    const col = tribeColor(t.tribeName);
    return t.tribeMembers.map(n => {
      ballIdx++;
      const slug = n.toLowerCase().replace(/\s+/g, '-');
      const animDur = (3.3 + (ballIdx * 0.23) % 1.5).toFixed(1);
      return `<div class="cft-machine-ball" style="border-color:${col};background:radial-gradient(circle,rgba(255,255,255,0.2),${col}15);box-shadow:0 0 10px ${col}30;animation:cft-blender-${Math.min(ballIdx, 18)} ${animDur}s ease-in-out infinite;"><img src="assets/avatars/${slug}.png" alt="${n}"></div>`;
    }).join('');
  }).join('');

  // Bumper decorations
  const bumpers = [
    { top: 5, left: 12, color: 'var(--cft-pink)', size: 16 },
    { top: 8, left: 75, color: 'var(--cft-teal)', size: 18 },
    { top: 35, left: 5, color: 'var(--cft-gold)', size: 20 },
    { top: 50, left: 88, color: 'var(--cft-purple)', size: 14 },
    { top: 75, left: 48, color: 'var(--cft-orange)', size: 22 },
  ].map((b, i) => `<div class="cft-title-bumper" style="top:${b.top}%;left:${b.left}%;border-color:${b.color};width:${b.size}px;height:${b.size}px;animation:cft-float ${3 + i * 0.5}s ${i * 0.5}s infinite;background:${b.color}30;"></div>`).join('');

  const teamLabels = data.tribes.map(t => {
    const col = tribeColor(t.tribeName);
    return `<div class="cft-team-block"><div class="cft-team-name" style="color:${col};">${t.tribeName}</div><div class="cft-team-count">${t.tribeMembers.length} PLAYERS</div></div>`;
  }).join('');

  return _shell(`
    <div class="cft-title-bg">
      <div class="cft-title-glow">
        <div class="cft-title-main">SUPER HAPPY CRAZY<br>FUN TIME</div>
        <div class="cft-title-sub">GAME SHOW CHALLENGE</div>
        <div class="cft-title-episode">EPISODE ${gs.episodeHistory.length} — PRE-MERGE</div>
      </div>
      <div class="cft-machine">${bumpers}${tribeHtml}</div>
      <div class="cft-teams-row">${teamLabels}</div>
      <div class="cft-insert-coin">► PRESS REVEAL TO START ◄</div>
    </div>
  `, ep, '', 'title');
}

export function rpBuildCFTPinball(ep) {
  const data = ep.crazyFunTime;
  if (!data) return '';
  const stKey = 'cft-pinball';
  const st = _ensureState(stKey, 0);

  // Store phase data for sidebar
  if (typeof window !== 'undefined') window._cftPhaseData = { phase: 'pinball' };

  let steps = [];
  let stepMeta = []; // {tribe, points, bumpers, ramps, secrets} per step for sidebar

  // Score bar for all tribes — scores start at 0, updated live via _cftUpdateScoreBar
  const pinSt = _tvState['cft-pinball'];
  const pinRevealIdx = pinSt ? pinSt.idx : -1;
  const meta = (typeof window !== 'undefined' && window._cftPinballStepMeta) ? window._cftPinballStepMeta : [];
  const headerScores = {};
  data.tribes.forEach(t => { headerScores[t.tribeName] = 0; });
  for (let i = 0; i <= pinRevealIdx && i < meta.length; i++) {
    if (meta[i].tribe) headerScores[meta[i].tribe] += meta[i].points;
  }
  const scoreBar = data.tribes.map(t => {
    const col = tribeColor(t.tribeName);
    const animalSlug = t.animal.type.toLowerCase().replace(/\s+/g, '-');
    const repSlug = t.rep.name.toLowerCase().replace(/\s+/g, '-');
    const displayScore = pinRevealIdx >= 0 ? headerScores[t.tribeName] : 0;
    return `<div class="cft-team-score" style="border-color:${col};">
      <div class="cft-team-score-avatars">
        <img class="cft-av cft-av-sm" style="border-color:${col};z-index:2;" src="assets/avatars/${repSlug}.png" alt="${t.rep.name}">
        <div class="cft-team-score-animal" style="border-color:${col};">${_icon('animal')}</div>
      </div>
      <div>
        <div class="cft-team-score-name" style="color:${col};">${t.tribeName}</div>
        <div style="font-size:8px;color:rgba(255,255,255,0.4);">Rep: ${t.rep.name} + ${t.animal.name}</div>
      </div>
      <div id="cft-header-score-${t.tribeName.toLowerCase().replace(/\s+/g, '-')}" style="margin-left:auto;">${_digits(displayScore, col)}</div>
    </div>`;
  }).join('');

  // Build pinball machine visualization
  const repBalls = data.tribes.map((t, ti) => {
    const col = tribeColor(t.tribeName);
    const slug = t.rep.name.toLowerCase().replace(/\s+/g, '-');
    const ballAnims = [
      { top: [55, 25, 60, 18, 55], left: [20, 50, 65, 30, 20], dur: 3.5 },
      { top: [30, 60, 20, 55, 30], left: [65, 30, 55, 75, 65], dur: 4 },
      { top: [50, 15, 45, 65, 50], left: [45, 70, 20, 55, 45], dur: 3 },
    ];
    const anim = ballAnims[ti] || ballAnims[0];
    const kfName = `cft-ball-${ti + 1}`;
    return `<div class="cft-ball" style="border-color:${col};background:radial-gradient(circle at 35% 35%,rgba(255,255,255,0.2),${col}20);box-shadow:0 0 15px ${col}40;animation:${kfName} ${anim.dur}s ease-in-out infinite;"><img src="assets/avatars/${slug}.png" alt="${t.rep.name}"></div>`;
  }).join('');

  // Ball animation keyframes (inline, unique per tribe)
  let ballKeyframes = '';
  data.tribes.forEach((t, ti) => {
    const ballAnims = [
      { top: [55, 25, 60, 18, 55], left: [20, 50, 65, 30, 20] },
      { top: [30, 60, 20, 55, 30], left: [65, 30, 55, 75, 65] },
      { top: [50, 15, 45, 65, 50], left: [45, 70, 20, 55, 45] },
    ];
    const anim = ballAnims[ti] || ballAnims[0];
    ballKeyframes += `@keyframes cft-ball-${ti + 1}{0%{top:${anim.top[0]}%;left:${anim.left[0]}%}25%{top:${anim.top[1]}%;left:${anim.left[1]}%}50%{top:${anim.top[2]}%;left:${anim.left[2]}%}75%{top:${anim.top[3]}%;left:${anim.left[3]}%}100%{top:${anim.top[4]}%;left:${anim.left[4]}%}}`;
  });

  const machineHtml = `
    <style>${ballKeyframes}</style>
    <div class="cft-pinball-machine">
      <div class="cft-bumper" style="top:15%;left:18%;">100</div>
      <div class="cft-bumper" style="top:18%;left:52%;">100</div>
      <div class="cft-bumper hit" style="top:42%;left:33%;">250</div>
      <div class="cft-bumper" style="top:48%;left:68%;">100</div>
      <div class="cft-bumper" style="top:22%;left:76%;">100</div>
      <div class="cft-bumper hit" style="top:68%;left:48%;">250</div>
      <div class="cft-ramp" style="top:28%;left:4%;transform:rotate(25deg);"></div>
      <div class="cft-ramp" style="top:58%;right:8%;transform:rotate(-15deg);width:55px;"></div>
      <div class="cft-secret-lane" style="top:7%;left:36%;">BONUS</div>
      ${repBalls}
      <div class="cft-burst-float" style="top:38%;left:28%;">WHAM!</div>
      <div class="cft-burst-float" style="top:62%;left:42%;animation-delay:1.5s;">CRASH!</div>
      <div class="cft-burst-float" style="top:18%;left:60%;animation-delay:3s;">BONUS!</div>
    </div>`;

  // Rep selection cards
  data.tribes.forEach(t => {
    const col = tribeColor(t.tribeName);
    steps.push(`<div class="cft-card cft-social">
      <div class="cft-card-header">${_icon('social')}<span class="cft-card-label">Rep Selection — ${t.tribeName}</span></div>
      <div class="cft-card-text">${_avatar(t.rep.name, col, 'cft-av-sm')} <strong>${t.rep.name}</strong> [${t.rep.method.toUpperCase()}] — ${t.rep.narrative}</div>
    </div>`);
    stepMeta.push({ tribe: null, points: 0, bumpers: 0, ramps: 0, secrets: 0 });
  });

  // Animal bonding cards
  data.tribes.forEach(t => {
    const col = tribeColor(t.tribeName);
    steps.push(`<div class="cft-card cft-animal">
      <div class="cft-card-header">${_icon('animal')}<span class="cft-card-label">Animal Bond — ${t.animal.name} (${t.animal.temperament})</span></div>
      <div class="cft-card-text">${_avatar(t.rep.name, col, 'cft-av-sm')} ${t.bonding.narrative}<br><span style="color:var(--cft-purple);font-size:10px;">Bond Level: ${'♥'.repeat(t.bonding.level)}${'♡'.repeat(4 - t.bonding.level)}</span></div>
    </div>`);
    stepMeta.push({ tribe: null, points: 0, bumpers: 0, ramps: 0, secrets: 0 });
  });

  // Launch events (interleaved across tribes)
  const maxLaunches = Math.max(...data.tribes.map(t => t.pinball.launches.length));
  for (let li = 0; li < maxLaunches; li++) {
    steps.push(`<div class="cft-flavor">★ LAUNCH ${li + 1} ★</div>`);
    stepMeta.push({ tribe: null, points: 0, bumpers: 0, ramps: 0, secrets: 0 });
    data.tribes.forEach(t => {
      const launch = t.pinball.launches[li];
      if (!launch) return;
      const col = tribeColor(t.tribeName);
      launch.events.forEach(evt => {
        const cls = evt.type === 'secret' ? 'cft-bonus' : evt.type === 'animal-attack' ? 'cft-animal' : evt.type === 'ramp' ? 'cft-hit' : evt.type === 'combo' ? 'cft-hit' : 'cft-hit';
        const iconType = evt.type === 'secret' ? 'secret' : evt.type === 'animal-attack' ? 'animal' : evt.type === 'combo' ? 'combo' : evt.type === 'ramp' ? 'ramp' : 'bumper';
        const burstText = evt.type === 'combo' ? 'WHAM!' : evt.type === 'ramp' ? 'BONUS!' : evt.type === 'secret' ? 'SECRET!' : evt.type === 'animal-attack' ? 'OUCH!' : '';
        steps.push(`<div class="cft-card ${cls}">
          <div class="cft-card-header">${_icon(iconType)}<span class="cft-card-label">${evt.type.toUpperCase()} — ${t.tribeName}</span>${evt.points ? `<span class="cft-card-points">${evt.points > 0 ? '+' : ''}${evt.points}</span>` : ''}</div>
          <div class="cft-card-text">${burstText ? `<span class="cft-burst">${burstText}</span> ` : ''}${evt.text}</div>
        </div>`);
        stepMeta.push({
          tribe: null, points: 0,
          bumpers: 0, ramps: 0, secrets: 0,
        });
      });
      steps.push(`<div class="cft-card cft-hit">
        <div class="cft-card-header">${_icon('hit')}<span class="cft-card-label">Launch ${li + 1} — ${t.tribeName}</span><span class="cft-card-points">+${launch.score}</span></div>
        <div class="cft-card-text">${_avatar(t.rep.name, col, 'cft-av-sm')} <strong>${t.rep.name}</strong> and ${t.animal.name} score ${launch.score} points. ${launch.bumperHits} bumpers, ${launch.rampHits} ramps${launch.secretHits ? ', 1 SECRET LANE' : ''}.</div>
      </div>`);
      stepMeta.push({
        tribe: t.tribeName, points: launch.score,
        bumpers: launch.bumperHits || 0, ramps: launch.rampHits || 0, secrets: launch.secretHits || 0,
      });
    });
  }

  // Sideline social events
  data.tribes.forEach(t => {
    t.sidelineEvents.forEach(evt => {
      steps.push(`<div class="cft-card cft-social">
        <div class="cft-card-header">${_icon('social')}<span class="cft-card-label">Sideline — ${t.tribeName}</span></div>
        <div class="cft-card-text">${evt.text}</div>
        ${evt.consequence ? `<div class="cft-card-consequence">▸ ${evt.consequence}</div>` : ''}
      </div>`);
      stepMeta.push({ tribe: null, points: 0, bumpers: 0, ramps: 0, secrets: 0 });
    });
  });

  // Store step metadata for sidebar
  if (typeof window !== 'undefined') window._cftPinballStepMeta = stepMeta;

  st.total = steps.length;

  const stepsHtml = steps.map((s, i) => `<div id="cft-step-pinball-${i}" class="cft-step${st.idx >= i ? ' cft-visible' : ''}">${s}</div>`).join('');

  return _shell(`
    <div class="cft-arena-bg">
      <div class="cft-broadcast">
        <div class="cft-live"><span class="cft-live-dot"></span> LIVE</div>
        <div class="cft-ticker"><span class="cft-ticker-text">★ HUMAN PINBALL UNDERWAY ★ THREE REPS BOUNCING FOR GLORY ★ BONUS LANES UNLOCKED ★ SCORES CLIMBING ★</span></div>
        <span class="cft-channel">CH 07</span>
      </div>
      <div class="cft-arena-header">
        <div class="cft-arena-title">HUMAN PINBALL</div>
        <div class="cft-arena-sub">Game Show Challenge — All Teams</div>
      </div>
      <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;padding:12px 16px;background:rgba(0,0,0,0.5);border-top:1px solid rgba(0,229,199,0.3);border-bottom:1px solid rgba(0,229,199,0.3);">
        ${scoreBar}
      </div>
      ${machineHtml}
      <div class="cft-cards" style="padding:16px;display:flex;flex-direction:column;gap:10px;">
        ${stepsHtml}
      </div>
      <div id="cft-controls-pinball" class="cft-controls">
        <button class="cft-btn cft-btn-primary" onclick="crazyFunTimeRevealNext('cft-pinball',${steps.length})">▶ Reveal Next</button>
        <span id="cft-counter-pinball" class="cft-counter">${Math.max(0, st.idx + 1)} / ${steps.length}</span>
        <button class="cft-btn" onclick="crazyFunTimeRevealAll('cft-pinball',${steps.length})">⏩ Reveal All</button>
      </div>
    </div>
  `, ep, '', 'pinball');
}

export function rpBuildCFTDramaBreak(ep) {
  const data = ep.crazyFunTime;
  if (!data) return '';
  const stKey = 'cft-drama';
  const st = _ensureState(stKey, data.dramaEvents.length);

  // Store phase data for sidebar
  if (typeof window !== 'undefined') window._cftPhaseData = { phase: 'drama' };

  const dramaIconMap = {
    fallout: 'clash', celebration: 'teamwork', respect: 'heart',
    taunt: 'drama', spark: 'heart', alliance: 'secret',
  };
  const cards = data.dramaEvents.map((evt, i) => {
    const side = i % 2 === 0 ? 'from-left' : 'from-right';
    const iconType = dramaIconMap[evt.type] || 'drama';
    const avatars = (evt.players || []).slice(0, 2).map(p => {
      const slug = p.toLowerCase().replace(/\s+/g, '-');
      let pCol = 'rgba(255,255,255,0.3)';
      for (const t of data.tribes) { if (t.tribeMembers.includes(p)) { pCol = tribeColor(t.tribeName); break; } }
      return `<img class="cft-av cft-av-xs" style="border-color:${pCol};" src="assets/avatars/${slug}.png" alt="${p}">`;
    }).join('');
    return `<div id="cft-step-drama-${i}" class="cft-step${st.idx >= i ? ' cft-visible' : ''}">
      <div class="cft-drama-card ${side}">
        <div class="cft-drama-card-header">
          ${_icon(iconType)}
          <div class="cft-drama-badge">${evt.badge || evt.type.toUpperCase()}</div>
          <div class="cft-drama-avatars">${avatars}</div>
        </div>
        <div class="cft-card-text">${evt.text}</div>
        ${evt.consequence ? `<div class="cft-card-consequence">▸ ${evt.consequence}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  return _shell(`
    <div class="cft-arena-bg" style="border-color:var(--cft-orange);">
      <div class="cft-drama-header">
        <div class="cft-drama-title">DRAMA BREAK</div>
        <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.8);text-transform:uppercase;position:relative;z-index:1;margin-top:4px;">Between Challenges — Green Room</div>
      </div>
      <div class="cft-cards" style="padding:16px;display:flex;flex-direction:column;gap:10px;">
        ${cards}
      </div>
      <div id="cft-controls-drama" class="cft-controls" style="border-color:var(--cft-orange);">
        <button class="cft-btn cft-btn-primary" style="border-color:var(--cft-orange);background:var(--cft-orange);" onclick="crazyFunTimeRevealNext('cft-drama',${data.dramaEvents.length})">▶ Reveal Next</button>
        <span id="cft-counter-drama" class="cft-counter">${Math.max(0, st.idx + 1)} / ${data.dramaEvents.length}</span>
        <button class="cft-btn" style="border-color:var(--cft-orange);color:var(--cft-orange);" onclick="crazyFunTimeRevealAll('cft-drama',${data.dramaEvents.length})">⏩ Reveal All</button>
      </div>
    </div>
  `, ep, '', 'drama');
}

export function rpBuildCFTCommercial(ep, tribeIdx = 0) {
  const data = ep.crazyFunTime;
  if (!data || !data.commercials[tribeIdx]) return '';
  const comm = data.commercials[tribeIdx];
  const col = tribeColor(comm.tribeName);
  const stKey = `cft-comm-${tribeIdx}`;

  // Store phase data for sidebar
  if (typeof window !== 'undefined') window._cftPhaseData = { phase: 'commercial', tribeIdx };

  let steps = [];

  // Chef intel card (if applicable)
  if (comm.hasChefIntel) {
    steps.push(`<div class="cft-card cft-bonus" style="background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.3);">
      <div class="cft-card-header">${_icon('chef')}<span class="cft-card-label" style="color:var(--cft-gold);">Chef Preview — Winner's Advantage</span></div>
      <div class="cft-card-text" style="color:var(--cft-gold);">${comm.tribeName} won the pinball round. They learn Chef's hidden preference: <strong style="color:var(--cft-amber);">${data.chefPreference.label.toUpperCase()}</strong>. The other tribes go in blind.</div>
    </div>`);
  }

  // Clapper: Pitch phase
  steps.push(`<div class="cft-clapper"><div class="cft-clapper-stripes"></div><div class="cft-clapper-text"><span>Scene 1: The Pitch</span><span class="cft-clapper-take">BRAINSTORM</span></div></div>`);

  // Pitches
  comm.pitches.forEach(p => {
    const isSelected = p.player === comm.selectedPitch.player;
    steps.push(`<div class="cft-pitch">
      <div class="cft-pitch-name">${_avatar(p.player, col, 'cft-av-sm')} ${p.player}'s Pitch</div>
      <div class="cft-pitch-idea">"${p.idea}"</div>
      ${_starsHtml(p.quality)}
      ${isSelected ? '<div class="cft-stamp approved">APPROVED</div>' : '<div class="cft-stamp rejected">REJECTED</div>'}
    </div>`);
  });

  // Clapper: Debate
  steps.push(`<div class="cft-clapper"><div class="cft-clapper-stripes"></div><div class="cft-clapper-text"><span>Scene 1B: The Debate</span><span class="cft-clapper-take">HEATED</span></div></div>`);

  // Debate
  comm.debate.forEach(d => {
    steps.push(`<div class="cft-debate">
      <div class="cft-debate-who">
        ${_avatar(d.player, col, 'cft-av-sm')}
        <span class="cft-debate-who-name" style="color:${col};">${d.player}</span>
        <span class="cft-debate-role">${d.role}</span>
      </div>
      <div class="cft-debate-text">${d.text.replace(/^[^:]+:\s*/, '')}</div>
      ${d.consequence ? `<div class="cft-card-consequence">▸ ${d.consequence}</div>` : ''}
    </div>`);
  });

  // Vote result
  steps.push(`<div class="cft-card cft-social">
    <div class="cft-card-header">${_icon('social')}<span class="cft-card-label">Tribe Vote: Idea Selected</span></div>
    <div class="cft-card-text">The tribe votes for <strong>${comm.selectedPitch.player}</strong>'s concept: "${comm.selectedPitch.idea}"</div>
    <div class="cft-card-consequence">▸ ${comm.rejectedPitchers.filter(r => r.resentment >= 2).map(r => `${r.player} resentment`).join(' · ') || 'Smooth vote'}</div>
  </div>`);

  // Clapper: Role Assignment
  steps.push(`<div class="cft-clapper"><div class="cft-clapper-stripes"></div><div class="cft-clapper-text"><span>Scene 2: Role Assignment</span><span class="cft-clapper-take">CASTING CALL</span></div></div>`);

  // Role assignment
  const roleIconMap = { director: { bg: 'rgba(245,158,11,0.2)', color: 'var(--cft-amber)' }, writer: { bg: 'rgba(168,85,247,0.2)', color: 'var(--cft-purple)' }, actor: { bg: 'rgba(255,45,123,0.2)', color: 'var(--cft-pink)' }, editor: { bg: 'rgba(0,229,199,0.2)', color: 'var(--cft-teal)' } };
  const mainRoles = Object.values(comm.roles).filter(r => r.role !== 'support');
  mainRoles.forEach(r => {
    const ric = roleIconMap[r.role] || { bg: 'rgba(245,158,11,0.15)', color: 'var(--cft-amber)' };
    steps.push(`<div class="cft-role">
      <div class="cft-role-icon" style="background:${ric.bg};color:${ric.color};">${ROLE_ICONS[r.role] || ''}</div>
      ${_avatar(r.player, col)}
      <div class="cft-role-info">
        <div class="cft-role-title">${r.role.charAt(0).toUpperCase() + r.role.slice(1)}: ${r.player} <span class="cft-match ${r.statMatch}">${r.statMatch.toUpperCase()} FIT</span></div>
        ${r.narrative ? `<div class="cft-role-desc">${r.narrative}</div>` : ''}
      </div>
    </div>`);
  });

  // Role debate
  comm.roleDebate.forEach(d => {
    steps.push(`<div class="cft-debate">
      <div class="cft-debate-who">
        ${_avatar(d.player, col, 'cft-av-sm')}
        <span class="cft-debate-who-name" style="color:${col};">${d.player}</span>
        <span class="cft-debate-role">${d.type}</span>
      </div>
      <div class="cft-debate-text">${d.text}</div>
      ${d.consequence ? `<div class="cft-card-consequence">▸ ${d.consequence}</div>` : ''}
    </div>`);
  });

  // Clapper: Production
  steps.push(`<div class="cft-clapper"><div class="cft-clapper-stripes"></div><div class="cft-clapper-text"><span>Scene 3: Production</span><span class="cft-clapper-take">TAKE 1... 2... 5</span></div></div>`);

  // Production events
  const prodIconMap = {
    clash: { cls: 'cft-drama', icon: 'clash' },
    bomb: { cls: 'cft-drama', icon: 'bomb' },
    sabotage: { cls: 'cft-drama', icon: 'sabotage' },
    showmance: { cls: 'cft-social', icon: 'heart' },
    breakthrough: { cls: 'cft-bonus', icon: 'breakthrough' },
    teamwork: { cls: 'cft-bonus', icon: 'teamwork' },
  };
  comm.productionEvents.forEach(evt => {
    const mapping = prodIconMap[evt.type] || { cls: 'cft-bonus', icon: 'role' };
    steps.push(`<div class="cft-card ${mapping.cls}">
      <div class="cft-card-header">${_icon(mapping.icon)}<span class="cft-card-label">${evt.type.toUpperCase()}</span></div>
      <div class="cft-card-text">${evt.text}</div>
      ${evt.consequence ? `<div class="cft-card-consequence">▸ ${evt.consequence}</div>` : ''}
    </div>`);
  });

  const st = _ensureState(stKey, steps.length);
  const commSuffix = `comm-${tribeIdx}`;
  const stepsHtml = steps.map((s, i) => `<div id="cft-step-${commSuffix}-${i}" class="cft-step${st.idx >= i ? ' cft-visible' : ''}">${s}</div>`).join('');

  // Film strip perfs
  const filmPerfs = Array(20).fill('<div class="cft-film-perf"></div>').join('');

  return _shell(`
    <div class="cft-studio-bg">
      <div class="cft-film cft-film-l">${filmPerfs}</div>
      <div class="cft-film cft-film-r">${filmPerfs}</div>
      <div class="cft-broadcast" style="border-radius:0;border-color:var(--cft-amber);">
        <div class="cft-live"><span class="cft-live-dot"></span> LIVE</div>
        <div class="cft-ticker"><span class="cft-ticker-text">★ COMMERCIAL PRODUCTION ★ ${comm.tribeName.toUpperCase()} ON SET ★ PITCHES FLYING ★ DEBATES HEATING UP ★ CAMERAS ROLLING ★</span></div>
        <span class="cft-channel">CH 07</span>
      </div>
      <div class="cft-studio-header">
        <div class="cft-studio-title">Commercial Studio</div>
        <div class="cft-studio-sub">${comm.tribeName} — Candy Fish Tails Challenge</div>
      </div>
      <div class="cft-studio-content">
        ${stepsHtml}
      </div>
      <div id="cft-controls-${commSuffix}" class="cft-controls" style="border-color:var(--cft-amber);">
        <button class="cft-btn cft-btn-primary" style="border-color:var(--cft-amber);background:var(--cft-amber);color:#000;" onclick="crazyFunTimeRevealNext('${stKey}',${steps.length})">▶ Reveal Next</button>
        <span id="cft-counter-${commSuffix}" class="cft-counter">${Math.max(0, st.idx + 1)} / ${steps.length}</span>
        <button class="cft-btn" style="border-color:var(--cft-amber);color:var(--cft-amber);" onclick="crazyFunTimeRevealAll('${stKey}',${steps.length})">⏩ Reveal All</button>
      </div>
    </div>
  `, ep, '', 'commercial');
}

export function rpBuildCFTVerdict(ep) {
  const data = ep.crazyFunTime;
  if (!data) return '';
  const stKey = 'cft-verdict';

  // Store phase data for sidebar
  if (typeof window !== 'undefined') window._cftPhaseData = { phase: 'verdict' };

  let steps = [];

  // Chef intro
  steps.push(`<div class="cft-chef-intro">
    <img class="cft-av cft-av-xl" style="border-color:var(--cft-amber);" src="assets/avatars/chef.png" alt="Chef Hatchet">
    <div class="cft-chef-speech">
      "Alright maggots, I've watched your little candy commercials. Let me tell you what I REALLY think..."
    </div>
  </div>`);

  // Score cards per tribe — reveal worst-to-best for suspense
  const sortedComms = [...data.commercials].sort((a, b) => {
    const rA = data.finalRanking.indexOf(a.tribeName);
    const rB = data.finalRanking.indexOf(b.tribeName);
    return rB - rA;
  });
  sortedComms.forEach(comm => {
    const col = tribeColor(comm.tribeName);
    const s = comm.scores;
    const cats = [
      { name:'CONCEPT', val:s.concept, color:'var(--cft-teal)' },
      { name:'DIRECTION', val:s.direction, color:'var(--cft-gold)' },
      { name:'PERFORMANCE', val:s.performance, color:'var(--cft-pink)' },
      { name:'SCRIPT', val:s.script, color:'var(--cft-orange)' },
      { name:'POLISH', val:s.polish, color:'var(--cft-purple)' },
    ];

    const pandaMood = (v) => v >= 7.5 ? 'happy' : v >= 5 ? 'neutral' : 'sad';
    const _pandaReact = (mood) => `<div class="cft-panda-react ${mood}"><div class="panda-react-face"><div class="panda-react-ear panda-react-ear-l"></div><div class="panda-react-ear panda-react-ear-r"></div><div class="panda-react-head"><div class="panda-react-eye panda-react-eye-l"></div><div class="panda-react-eye panda-react-eye-r"></div><div class="panda-react-mouth"></div></div></div></div>`;

    const barsHtml = cats.map(c => `
      <div class="cft-chef-score-row">
        <span class="cft-chef-cat">${c.name}</span>
        <div class="cft-chef-bar-wrap"><div class="cft-chef-bar-fill" style="width:${c.val * 10}%;background:${c.color};"></div></div>
        <span class="cft-chef-val" style="color:${c.color};">${c.val.toFixed(1)}</span>
        ${_pandaReact(pandaMood(c.val))}
      </div>
    `).join('');

    // Chef quirk — check pitch tags directly, not the noisy score
    const quirkMatch = comm.selectedPitch?.tags?.includes(data.chefPreference.id);
    const quirkHtml = `<div class="cft-quirk-reveal">
      <div class="cft-quirk-label">Chef's Secret Preference</div>
      <div class="cft-quirk-value">${data.chefPreference.label.toUpperCase()}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;">${quirkMatch ? '✓ MATCH — Bonus applied!' : '✗ No match'}</div>
    </div>`;

    // Total + stamp
    const rank = data.finalRanking.indexOf(comm.tribeName);
    const stampText = rank === 0 ? 'FIRST PLACE' : rank === data.finalRanking.length - 1 ? 'LAST PLACE' : `${rank + 1}${rank === 1 ? 'ND' : 'RD'} PLACE`;
    const stampCls = rank === 0 ? 'winner' : rank === data.finalRanking.length - 1 ? 'loser' : 'mid';

    const roleAvatars = ['director', 'writer', 'actor', 'editor'].map(rKey => {
      const r = comm.roles[rKey];
      return r ? _avatar(r.player, col, 'cft-av-sm') : '';
    }).filter(Boolean).join('');

    steps.push(`<div class="cft-chef-panel">
      <div style="font-family:'Bangers',cursive;font-size:16px;color:${col};letter-spacing:2px;text-align:center;margin-bottom:8px;">${comm.tribeName}</div>
      <div style="display:flex;gap:4px;justify-content:center;margin-bottom:10px;">${roleAvatars}</div>
      ${barsHtml}
      ${quirkHtml}
      <div style="text-align:center;padding:24px;position:relative;">
        <div class="cft-chef-stamp-result ${stampCls}">${stampText}</div>
      </div>
    </div>`);
  });

  const st = _ensureState(stKey, steps.length);
  const stepsHtml = steps.map((s, i) => `<div id="cft-step-verdict-${i}" class="cft-step${st.idx >= i ? ' cft-visible' : ''}">${s}</div>`).join('');

  return _shell(`
    <div class="cft-studio-bg">
      <div class="cft-film cft-film-l">${Array(12).fill('<div class="cft-film-perf"></div>').join('')}</div>
      <div class="cft-film cft-film-r">${Array(12).fill('<div class="cft-film-perf"></div>').join('')}</div>
      <div class="cft-studio-header">
        <div class="cft-studio-title">Chef's Verdict</div>
        <div class="cft-studio-sub">All Teams — Final Scores</div>
      </div>
      <div class="cft-chef-section" style="padding:16px 36px;position:relative;z-index:2;">
        ${stepsHtml}
      </div>
      <div id="cft-controls-verdict" class="cft-controls" style="border-color:var(--cft-amber);">
        <button class="cft-btn cft-btn-primary" style="border-color:var(--cft-amber);background:var(--cft-amber);color:#000;" onclick="crazyFunTimeRevealNext('cft-verdict',${steps.length})">▶ Reveal Next</button>
        <span id="cft-counter-verdict" class="cft-counter">${Math.max(0, st.idx + 1)} / ${steps.length}</span>
        <button class="cft-btn" style="border-color:var(--cft-amber);color:var(--cft-amber);" onclick="crazyFunTimeRevealAll('cft-verdict',${steps.length})">⏩ Reveal All</button>
      </div>
    </div>
  `, ep, '', 'verdict');
}

export function rpBuildCFTResults(ep) {
  const data = ep.crazyFunTime;
  if (!data) return '';

  // Store phase data for sidebar
  if (typeof window !== 'undefined') window._cftPhaseData = { phase: 'results' };

  // Confetti
  const confetti = '<div class="cft-confetti">' + Array(8).fill('<div class="cft-confetti-piece"></div>').join('') + '</div>';

  const teamsHtml = data.finalRanking.map((tribeName, rank) => {
    const t = data.tribes.find(tr => tr.tribeName === tribeName);
    const comm = data.commercials.find(c => c.tribeName === tribeName);
    const col = tribeColor(tribeName);
    const isWinner = rank === 0;
    const isLoser = rank === data.finalRanking.length - 1;
    const totalScore = t.pinballScore + (comm ? comm.scores.total * 100 : 0);

    const roster = t.tribeMembers.map(n => {
      const slug = n.toLowerCase().replace(/\s+/g, '-');
      const avCol = isLoser ? 'rgba(239,68,68,0.4)' : col;
      const isRep = n === t.rep.name;
      return `<div class="cft-result-player">
        <img class="cft-av${isRep ? ' is-rep' : ''}" style="border-color:${avCol};width:36px;height:36px;${isLoser ? 'opacity:.7;' : ''}" src="assets/avatars/${slug}.png" alt="${n}">
        <div class="cft-result-player-name">${n}</div>
      </div>`;
    }).join('');

    const label = isWinner ? `<div style="font-size:9px;color:var(--cft-green);letter-spacing:1px;font-weight:700;">1ST PLACE — IMMUNITY</div>`
      : isLoser ? `<div style="font-size:9px;color:var(--cft-red);letter-spacing:1px;font-weight:700;">LAST PLACE — TRIBAL COUNCIL</div>`
      : `<div style="font-size:9px;color:var(--cft-gold);letter-spacing:1px;">${rank + 1}${rank === 1 ? 'ND' : 'RD'} PLACE — SAFE</div>`;

    return `<div class="cft-result-team ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''}" style="border-color:${isWinner ? 'var(--cft-gold)' : isLoser ? 'rgba(239,68,68,0.5)' : col};">
      <div class="cft-result-team-name" style="color:${isLoser ? 'var(--cft-red)' : col};">${tribeName}</div>
      <div class="cft-result-team-score" style="color:${isWinner ? 'var(--cft-gold)' : 'rgba(255,255,255,0.4)'};">${Math.round(totalScore).toLocaleString()}</div>
      ${label}
      <div class="cft-result-roster">${roster}</div>
    </div>`;
  }).join('');

  return _shell(`
    <div class="cft-results">
      ${confetti}
      <div class="cft-results-title">CHALLENGE COMPLETE</div>
      <div class="cft-results-sub">FINAL STANDINGS</div>
      <div style="position:relative;z-index:2;display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-top:24px;">
        ${teamsHtml}
      </div>
      <div class="cft-results-footer" style="position:relative;z-index:2;margin-top:20px;font-family:'Press Start 2P',monospace;font-size:9px;letter-spacing:2px;padding:12px;border-top:1px solid rgba(255,255,255,0.1);">
        <span style="color:var(--cft-red);">${data.losingTribe}</span> <span style="color:rgba(255,255,255,0.4);">— REPORT TO TRIBAL COUNCIL</span>
      </div>
    </div>
  `, ep, '', 'results');
}
