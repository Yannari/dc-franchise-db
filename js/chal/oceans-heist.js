// js/chal/oceans-heist.js — Ocean's Eight-or-Nine bank heist challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── HELPERS ──
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHETYPES = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function isNiceArch(name) { return NICE_ARCHETYPES.includes(getArchetype(name)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function noise(range = 0.15) { return (Math.random() - 0.5) * range; }
function wPick(arr) {
  const total = arr.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const e of arr) { r -= (e.weight || 1); if (r <= 0) return e; }
  return arr[arr.length - 1];
}
function host() { return seasonConfig?.hostName || 'Chris'; }

// ── CREW ROLES ──
function assignCrewRoles(members) {
  const roles = {};
  const scored = members.map(n => {
    const s = pStats(n);
    return { name: n, strategic: s.strategic, physical: s.physical, mental: s.mental, endurance: s.endurance, intuition: s.intuition };
  });
  const used = new Set();
  const assign = (stat, role, emoji) => {
    const best = scored.filter(s => !used.has(s.name)).sort((a, b) => b[stat] - a[stat])[0];
    if (best) { roles[best.name] = { role, emoji }; used.add(best.name); }
  };
  assign('strategic', 'Mastermind', '🧠');
  assign('physical', 'Muscle', '💪');
  assign('mental', 'Tech', '🔧');
  assign('endurance', 'Wheelman', '🏎️');
  assign('intuition', 'Lookout', '👁️');
  for (const n of members) if (!roles[n]) roles[n] = { role: 'Crew', emoji: '🎭' };
  return roles;
}

// ── HOST LINES ──
const HEIST_HOST = {
  intro: [
    (h) => `${h} stepped out of a black van wearing a turtleneck. "Welcome to the heist of the century."`,
    (h) => `"Today's challenge?" ${h} adjusted his earpiece. "You're robbing a bank."`,
    (h) => `${h} unrolled a blueprint. "Listen up. Three phases. One shot. Don't blow it."`,
  ],
  vaultIntro: [
    (h) => `"While you were sleeping, we kidnapped one member from each team and locked them in a bank vault." ${h} tossed a lockpick set on the ground. "Get them out."`,
    (h) => `"Missing a teammate? That's because Chef bagged them in the night." ${h} grinned. "They're in separate vaults. Crack the code, free your friend."`,
    (h) => `"Three vaults. Three hostages. First team to break their teammate out gets the heist equipment." ${h} checked his watch. "Clock's ticking."`,
  ],
  heistIntro: [
    (h) => `"Phase two: the bank is yours. Get past security, grab the loot, and get OUT." ${h} pointed at the building.`,
    (h) => `"Lasers. Cameras. Alarms. The works." ${h} grinned. "Good luck."`,
  ],
  getawayIntro: [
    (h) => `"Phase three: BUILD your getaway car. Then DRIVE it." ${h} kicked a pile of scrap parts.`,
    (h) => `"These parts are all you get. Build fast, drive faster." ${h} revved a mini engine.`,
  ],
  winner: [
    (h, tribe) => `"${tribe} pulled off the perfect heist!" ${h} slow-clapped. "You're the real Ocean's crew."`,
    (h, tribe) => `${h} handed ${tribe} a briefcase. "Your loot. Well earned."`,
  ],
};

// ── EVENT TEXT ──
const VAULT_EVENTS = {
  lockpick: [
    (p, pr) => `${p} knelt by the lock, picks in hand. Click... click... ${pr.Sub} was in the zone.`,
    (p, pr) => `${p} worked the tumblers methodically. "Almost... almost..." The third pin gave way.`,
    (p, pr) => `${p} pressed ${pr.posAdj} ear to the vault door, listening for the pins. "I hear it..."`,
    (p, pr) => `Two bobby pins, a paperclip, and nerves of steel. ${p} was picking this lock old-school.`,
    (p, pr) => `${p} closed ${pr.posAdj} eyes and felt the mechanism. "Four pins down. One to go."`,
    (p, pr) => `"I learned this at camp." ${p}'s lockpick kit was already deployed. Pure concentration.`,
  ],
  bruteForce: [
    (p, pr) => `${p} SLAMMED ${pr.posAdj} shoulder into the vault door. The hinges groaned.`,
    (p, pr) => `${p} gripped the handle and pulled with everything ${pr.sub} had. Veins popping.`,
    (p, pr) => `"STAND BACK!" ${p} charged the door like a battering ram. BOOM.`,
    (p, pr) => `${p} kicked the vault door so hard the whole wall shook. "${pr.Sub}'s not stopping."`,
    (p, pr) => `Pure rage. ${p} was treating that vault door like a personal enemy.`,
    (p, pr) => `${p} ripped off a piece of railing and used it as a crowbar. Improvise. Adapt. Break stuff.`,
  ],
  socialEng: [
    (p, pr) => `${p} studied the keypad. "If I were ${host()}, what would my code be..."`,
    (p, pr) => `"${host()}'s birthday... no. His hair gel barcode..." ${p} kept guessing.`,
    (p, pr) => `${p} sweet-talked the electronic panel. "Come on, baby. Open up for me."`,
    (p, pr) => `"The code is probably his measurements." ${p} punched in numbers. "Too vain NOT to be."`,
    (p, pr) => `${p} found the manufacturer's override on the back panel. "They ALWAYS forget to change the default."`,
    (p, pr) => `${p} called ${host()} on the intercom. "Hey, what's your favorite number?" ${host()} actually answered.`,
  ],
  slapFight: [
    (a, b) => `${a} and ${b} got into a slap fight over who should crack the vault!`,
    (a, b) => `"Let ME do it!" ${a} shoved ${b} aside. ${b} shoved back.`,
  ],
  panicInVault: [
    (p, pr) => `Inside the vault, ${p} was losing it. "GET ME OUT! THE WALLS ARE CLOSING IN!"`,
    (p, pr) => `${p} banged on the vault door from inside. "HELLO?! IS ANYONE EVEN TRYING?!"`,
    (p, pr) => `Muffled screaming from inside the vault. ${p} was NOT handling this well.`,
  ],
  napInVault: [
    (p, pr) => `Inside the vault, ${p} had found a comfortable spot and drifted off to sleep.`,
    (p, pr) => `${p} yawned and stretched out. "Wake me when they figure it out." Then ${pr.sub} started snoring.`,
    (p, pr) => `${p} leaned against the vault wall, closed ${pr.posAdj} eyes, and immediately fell asleep. Priorities.`,
  ],
  workInside: [
    (p, pr) => `${p} found the emergency release panel inside and started tinkering. "I can help from here!"`,
    (p, pr) => `From inside, ${p} was calling out numbers: "Try 7... 3... no wait — 4!" The crackers could barely hear.`,
    (p, pr) => `${p} pried open an air vent inside the vault. "There's wiring back here! I think I can—" BZZT. "I'm fine!"`,
  ],
  cracked: [
    (tribe) => `CLICK. The ${tribe} vault swung open!`,
  ],
  kidnapped: [
    (p, pr) => `An intern in a ski mask grabbed ${p} from behind. A bag went over ${pr.posAdj} head. "${pr.Sub} was gone before anyone noticed.`,
    (p, pr) => `${p} was eating breakfast when two interns dragged ${pr.obj} away. "WHAT THE—" The bag muffled the rest.`,
    (p, pr) => `${p} stepped outside the trailer and vanished. A suspicious van peeled away from the lot.`,
    (p, pr) => `"Has anyone seen ${p}?" By the time they asked, ${pr.sub} was already locked in a vault somewhere on set.`,
    (p, pr) => `Chef grabbed ${p} in a chokehold and carried ${pr.obj} off. "Nothing personal, kid."`,
  ],
};

const HEIST_EVENTS = {
  laserDodge: [
    (p, pr) => `${p} rolled under the laser grid like an action hero.`,
    (p, pr) => `${p} contorted ${pr.posAdj} body between the beams. Not a single trip.`,
    (p, pr) => `${p} did a full limbo under the lowest beam. "Too easy."`,
  ],
  laserFail: [
    (p, pr) => `${p} clipped a laser beam — ALARM TRIGGERED! Red lights everywhere.`,
    (p, pr) => `${p}'s foot caught a beam. Sirens blared. "Uh oh."`,
  ],
  cameraDodge: [
    (p, pr) => `${p} timed the camera rotation perfectly and slipped past unseen.`,
    (p, pr) => `${p} spotted the blind spot and crawled through it like a ghost.`,
  ],
  cameraFail: [
    (p, pr) => `The camera caught ${p} dead center. ${pr.Sub} froze like a deer in headlights.`,
  ],
  alarmDefuse: [
    (p, pr) => `${p} traced the alarm wire and snipped it clean. "Like disarming a bomb."`,
    (p, pr) => `${p} hacked the alarm panel in seconds. Green light.`,
  ],
  alarmFail: [
    (p, pr) => `${p} cut the wrong wire. The alarm SCREAMED to life.`,
  ],
  vaultPush: [
    (tribe) => `${tribe} threw their combined weight against the vault door — it MOVED!`,
  ],
  vaultStuck: [
    (tribe) => `${tribe} pushed with everything they had but the door barely budged.`,
  ],
  lootGrab: [
    (p, pr) => `${p} stuffed ${pr.posAdj} bag to bursting. "MORE! I need MORE!"`,
    (p, pr) => `${p} grabbed a reasonable amount and bolted. Smart.`,
  ],
  lootGreed: [
    (p, pr) => `${p} went back for a second bag of loot. Greedy — but rich if they escape.`,
  ],
  criminalBonus: [
    (p, pr) => `${p} moved through the security like ${pr.sub}'d done this before. Because ${pr.sub} probably had.`,
  ],
  hesitation: [
    (p, pr) => `${p} hesitated at the entrance. "This feels... wrong." ${pr.Sub} lost precious seconds.`,
  ],
};

const GETAWAY_EVENTS = {
  // Build phase — per member
  buildWeld: [
    (p, pr) => `${p} welded the frame together with precision. Solid.`,
    (p, pr) => `${p} hammered the chassis into shape. "That's not going anywhere."`,
  ],
  buildWeldFail: [
    (p, pr) => `${p} welded the bumper on upside down. "Close enough."`,
    (p, pr) => `${p} dropped the wrench into the engine. Twice.`,
  ],
  buildEngine: [
    (p, pr) => `${p} tuned the engine until it purred. "Now THAT'S horsepower."`,
    (p, pr) => `${p} rewired the ignition like a pro. First try.`,
  ],
  buildEngineFail: [
    (p, pr) => `${p} connected the wrong wires. The engine coughed black smoke.`,
    (p, pr) => `"Why are there bolts left over?" ${p} stared at the spare parts.`,
  ],
  buildArgue: [
    (a, b) => `${a} and ${b} argued over the blueprint. "The wheels go ON THE BOTTOM!"`,
    (a, b) => `"That's the steering wheel." "No, that's a pizza pan." ${a} and ${b} lost precious time.`,
  ],
  buildSabotage: [
    (p, target) => `${p} snuck over and loosened a bolt on ${target}'s kart. Nobody saw.`,
  ],
  goodBuild: [
    (tribe) => `${tribe}'s kart was a thing of beauty — sleek, fast, and surprisingly sturdy.`,
    (tribe) => `${tribe}'s ride looked like a real getaway car. ${host()} was impressed.`,
  ],
  badBuild: [
    (tribe) => `${tribe}'s kart looked like it was held together with hope and duct tape.`,
    (tribe) => `${tribe}'s kart started smoking before the race even began. Not great.`,
  ],
  // Race — driver events
  driverDodge: [
    (p, pr) => `${p} swerved around a prop barricade! Smooth hands on the wheel.`,
    (p, pr) => `A fake police car slid across the road! ${p} cut through the gap perfectly.`,
    (p, pr) => `Cardboard buildings collapsed across the track! ${p} threaded the needle.`,
  ],
  driverCrash: [
    (p, pr) => `${p} smashed right into a prop wall! Pieces flew everywhere.`,
    (p, pr) => `${p} clipped a fake fire hydrant — the kart spun out!`,
  ],
  // Race — navigator events
  navShortcut: [
    (p, pr) => `"LEFT! GO LEFT!" ${p} spotted a shortcut through the back lot.`,
    (p, pr) => `${p} read the track like a map. "Cut through that alley — trust me."`,
  ],
  navWrongTurn: [
    (p, pr) => `"Turn here!" ${p} sent the team into a dead end. "...My bad."`,
    (p, pr) => `${p} misread the signs. They drove in a circle for ten seconds.`,
  ],
  // Race — mechanic events
  mechFix: [
    (p, pr) => `The engine sputtered! ${p} leaned over and smacked something. It worked.`,
    (p, pr) => `A belt snapped mid-race! ${p} jury-rigged a fix with ${pr.posAdj} shoelace.`,
  ],
  mechFail: [
    (p, pr) => `The kart broke down! ${p} tried to fix it but made it worse.`,
    (p, pr) => `Smoke poured from the hood. ${p} opened it and a spring launched into ${pr.posAdj} face.`,
  ],
  // Race — crew events (anyone)
  crewPush: [
    (p, pr) => `${p} jumped out and PUSHED the kart uphill! Pure muscle.`,
    (p, pr) => `The engine stalled! ${p} got out and shoved from behind.`,
  ],
  crewThrow: [
    (p, target, pr) => `${p} hurled a hubcap at ${target}'s kart! Direct hit.`,
    (p, target, pr) => `${p} chucked a spare tire at ${target}! "CATCH!"`,
  ],
  crewCheer: [
    (p, driver) => `"FLOOR IT!" ${p} screamed at ${driver}. The kart surged forward.`,
    (p, driver) => `${p} started banging on the dashboard. "GO GO GO!" Somehow it helped.`,
  ],
  // Race — team events
  nitroBoost: [
    (tribe) => `${tribe}'s kart hit a nitro strip! WHOOSH — they rocketed ahead!`,
  ],
  tireBlowout: [
    (tribe) => `${tribe} blew a tire! The kart scraped along on three wheels.`,
  ],
  outOfGas: [
    (tribe) => `${tribe}'s kart sputtered and died! They had to push it the last stretch!`,
  ],
  crashNearFinish: [
    (tribe) => `${tribe} was in the lead but their kart FLIPPED near the finish line!`,
  ],
  finishStrong: [
    (tribe) => `${tribe} rocketed across the finish line! 🏁`,
  ],
  finishLimp: [
    (tribe) => `${tribe} limped across the finish line, kart barely holding together.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateOceansHeist(ep, tribes) {
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));
  const result = {
    vaultCrack: { tribes: [] },
    heist: { tribes: [] },
    getaway: { tribes: [], raceRounds: [] },
    crewRoles: {},
    tribeScores: {},
  };

  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });
  ep.oceansHeist = result;
  ep.challengeType = 'oceans-heist';
  ep.challengeLabel = "Ocean's Eight—or Nine";

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.mergeName || gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // Assign crew roles per tribe
  for (const tribe of tribeMembers) {
    result.crewRoles[tribe.name] = assignCrewRoles(tribe.members);
  }

  // ── THREE PHASES ──
  _simulateVaultCrack(ep, tribeMembers, result);
  _simulateHeist(ep, tribeMembers, result);
  _simulateGetaway(ep, tribeMembers, result);

  // ── FINAL SCORING ──
  // Phase 1 (Vault): individual scores only, no tribe points
  // chalMemberScores already populated during vault sim

  // Phase 2 (Heist): 60% weight — averaged loot per member, normalized to 60-point scale
  const maxHeistLoot = Math.max(1, ...result.heist.tribes.map(ht => {
    const mc = tribeMembers.find(t => t.name === ht.tribe)?.members.length || 1;
    return ht.score / mc;
  }));
  for (const ht of result.heist.tribes) {
    const memberCount = tribeMembers.find(t => t.name === ht.tribe)?.members.length || 1;
    result.tribeScores[ht.tribe] = (result.tribeScores[ht.tribe] || 0) + ((ht.score / memberCount) / maxHeistLoot) * 60;
  }

  // Phase 3 (Getaway): 40% weight — finish order + distance for non-finishers
  // Finished teams ranked by finish order, then non-finishers by distance
  const getawaySorted = [...result.getaway.tribes].sort((a, b) => {
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    if (a.finished && b.finished) return a.finishOrder - b.finishOrder;
    if (a.crashed && !b.crashed) return 1;
    if (!a.crashed && b.crashed) return -1;
    return b.distance - a.distance;
  });
  const getawayPoints = [40, 25, 12, 5, 2];
  getawaySorted.forEach((gt, i) => {
    result.tribeScores[gt.tribe] = (result.tribeScores[gt.tribe] || 0) + (getawayPoints[i] || 1);
  });

  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);
  ep.tribalPlayers = ep.loser ? [...ep.loser.members] : [];
  ep.challengeLabel = "Ocean's Eight—or Nine";
  ep.challengeCategory = 'mixed';

  result.winner = winnerName;
  result.loser = loserName;

  // Episode history
  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = {
    type: 'oceans-heist',
    label: "Ocean's Eight—or Nine",
    winner: winnerName,
    loser: loserName,
    tribeScores: { ...result.tribeScores },
    vaultOrder: result.vaultCrack.tribes.map(v => v.tribe),
    getawayOrder: [...result.getaway.tribes].sort((a, b) => b.distance - a.distance).map(g => g.tribe),
  };

  return ep;
}

// ══════════════════════════════════════════════════════════════
// PHASE 1: VAULT CRACK
// ══════════════════════════════════════════════════════════════
function _simulateVaultCrack(ep, tribeMembers, result) {
  for (const tribe of tribeMembers) {
    const members = tribe.members;
    // Pick a mid-tier member to lock in vault
    const ranked = members.map(n => {
      const s = pStats(n);
      return { name: n, total: s.physical + s.mental + s.strategic + s.social + s.endurance };
    }).sort((a, b) => a.total - b.total);
    const midIdx = Math.floor(ranked.length / 2);
    const locked = ranked[midIdx].name;
    const crackers = members.filter(n => n !== locked);

    const events = [];
    let totalScore = 0;

    // Kidnapping event
    const lpr2 = pronouns(locked);
    events.push({ type: 'kidnapped', player: locked, text: pick(VAULT_EVENTS.kidnapped)(locked, lpr2) });

    // Locked teammate reaction
    const ls = pStats(locked);
    const lpr = pronouns(locked);
    let lockedBonus = 0;
    let lockedReaction = 'neutral';
    if (ls.boldness < 4) {
      lockedReaction = 'panic';
      lockedBonus = -0.1;
      events.push({ type: 'panicInVault', player: locked, text: pick(VAULT_EVENTS.panicInVault)(locked, lpr) });
      ep.chalMemberScores[locked] = (ep.chalMemberScores[locked] || 0) - 2;
    } else if (ls.temperament > 6) {
      lockedReaction = 'nap';
      lockedBonus = -0.05;
      events.push({ type: 'napInVault', player: locked, text: pick(VAULT_EVENTS.napInVault)(locked, lpr) });
      ep.chalMemberScores[locked] = (ep.chalMemberScores[locked] || 0) - 1;
    } else if (ls.mental >= 6) {
      lockedReaction = 'workInside';
      lockedBonus = 0.1;
      events.push({ type: 'workInside', player: locked, text: pick(VAULT_EVENTS.workInside)(locked, lpr) });
      ep.chalMemberScores[locked] = (ep.chalMemberScores[locked] || 0) + 3;
    }

    // Each cracker picks best approach — deduplicate text templates
    const approaches = [];
    const usedTemplates = {};
    function pickUnique(pool, name, pr) {
      const key = pool === VAULT_EVENTS.lockpick ? 'lp' : pool === VAULT_EVENTS.bruteForce ? 'bf' : 'se';
      if (!usedTemplates[key]) usedTemplates[key] = new Set();
      const available = pool.filter((_, i) => !usedTemplates[key].has(i));
      const chosen = available.length ? available : pool;
      const idx = pool.indexOf(chosen[Math.floor(Math.random() * chosen.length)]);
      usedTemplates[key].add(idx);
      return pool[idx](name, pr);
    }

    for (const name of crackers) {
      const s = pStats(name);
      const pr = pronouns(name);
      const lockpickScore = s.strategic * 0.05 + s.mental * 0.04 + noise();
      const bruteScore = s.physical * 0.05 + s.endurance * 0.04 + noise();
      const socialScore = s.social * 0.05 + s.intuition * 0.04 + noise();

      let approach, score, type;
      if (lockpickScore >= bruteScore && lockpickScore >= socialScore) {
        approach = 'lockpick'; score = lockpickScore; type = 'lockpick';
      } else if (bruteScore >= socialScore) {
        approach = 'bruteForce'; score = bruteScore; type = 'bruteForce';
      } else {
        approach = 'socialEng'; score = socialScore; type = 'socialEng';
      }

      approaches.push({ name, approach, score });
      totalScore += score;
      events.push({ type, player: name, text: pickUnique(VAULT_EVENTS[type], name, pr) });
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.round(score * 5);
    }

    // Slap fight if two people picked the same approach
    const approachCounts = {};
    for (const a of approaches) approachCounts[a.approach] = (approachCounts[a.approach] || 0) + 1;
    for (const [approach, count] of Object.entries(approachCounts)) {
      if (count >= 2 && Math.random() < 0.4) {
        const fighters = approaches.filter(a => a.approach === approach).slice(0, 2);
        events.push({ type: 'slapFight', players: [fighters[0].name, fighters[1].name],
          text: pick(VAULT_EVENTS.slapFight)(fighters[0].name, fighters[1].name) });
        totalScore -= 0.05;
        addBond(fighters[0].name, fighters[1].name, -0.5);
      }
    }

    // Average per cracker so team size doesn't matter
    const avgScore = (crackers.length > 0 ? totalScore / crackers.length : 0) + lockedBonus;
    events.push({ type: 'cracked', tribe: tribe.name, text: pick(VAULT_EVENTS.cracked)(tribe.name) });

    result.vaultCrack.tribes.push({
      tribe: tribe.name, locked, lockedReaction, crackers,
      approaches, score: avgScore, events,
    });
  }

  // Sort by score = crack order
  result.vaultCrack.tribes.sort((a, b) => b.score - a.score);
  result.vaultCrack.firstTribe = result.vaultCrack.tribes[0]?.tribe;
}

// ══════════════════════════════════════════════════════════════
// PHASE 2: THE HEIST — 5-round gauntlet
// ══════════════════════════════════════════════════════════════
const HEIST_ROUNDS = 5;
const VAULT_LOOT_PER_PLAYER = 2;
const OBSTACLE_SEQUENCE = ['laser', 'camera', 'alarm', 'vault'];

function _simulateHeist(ep, tribeMembers, result) {
  const equipmentTribe = result.vaultCrack.firstTribe;
  const minSize = Math.min(...tribeMembers.map(t => t.members.length));

  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const hasEquipment = tribe.name === equipmentTribe;
    const rounds = [];
    let totalLoot = 0;
    const memberTotals = {};
    members.forEach(n => { memberTotals[n] = { loot: 0, vaultReaches: 0, totalObstacles: 0, benchedRounds: 0 }; });
    const sitOuts = members.length - minSize;

    // Special entrance events (once, before round 1)
    const entranceEvents = [];
    for (const name of members) {
      const pr = pronouns(name);
      if (isVillainArch(name) && Math.random() < 0.4) {
        entranceEvents.push({ type: 'criminalBonus', player: name, text: pick(HEIST_EVENTS.criminalBonus)(name, pr) });
      }
      if (isNiceArch(name) && Math.random() < 0.3) {
        entranceEvents.push({ type: 'hesitation', player: name, text: pick(HEIST_EVENTS.hesitation)(name, pr) });
      }
    }

    // Track per-player momentum across rounds
    const prevRoundReached = {};
    members.forEach(n => { prevRoundReached[n] = false; });

    for (let rd = 0; rd < HEIST_ROUNDS; rd++) {
      // Rotate bench: pick sitOuts players to sit, rotating by round index
      let benched = [];
      if (sitOuts > 0) {
        const rotated = [...members].sort((a, b) => {
          const aIdx = members.indexOf(a);
          const bIdx = members.indexOf(b);
          return ((aIdx + rd) % members.length) - ((bIdx + rd) % members.length);
        });
        benched = rotated.slice(0, sitOuts);
        for (const n of benched) memberTotals[n].benchedRounds++;
      }

      const roundEvents = [];
      const activeMembers = members.filter(n => !benched.includes(n));
      let alive = [...activeMembers]; // only active players start
      const roundResults = {};
      members.forEach(n => { roundResults[n] = { obstacles: [], eliminated: false, reachedVault: false, benched: benched.includes(n) }; });
      const equipBonus = hasEquipment ? 0.05 : 0;
      // Security tightens slightly in later rounds
      const fatigue = rd * 0.015;

      for (const obsType of OBSTACLE_SEQUENCE) {
        const survivors = [];
        for (const name of alive) {
          const s = pStats(name);
          const pr = pronouns(name);
          // Momentum: previous vault reach gives confidence, previous fail shakes you
          const momentum = prevRoundReached[name] ? 0.04 : (rd > 0 ? -0.02 : 0);

          if (obsType === 'vault') {
            roundResults[name].reachedVault = true;
            survivors.push(name);
            continue;
          }

          let check, threshold;
          if (obsType === 'laser') {
            check = s.physical * 0.03 + s.boldness * 0.02 + equipBonus + momentum + noise(0.4);
            threshold = 0.24 + fatigue;
          } else if (obsType === 'camera') {
            check = s.intuition * 0.04 + s.strategic * 0.02 + equipBonus + momentum + noise(0.4);
            threshold = 0.22 + fatigue;
          } else {
            check = s.mental * 0.04 + s.strategic * 0.03 + equipBonus + momentum + noise(0.4);
            threshold = 0.26 + fatigue;
          }
          const passed = check > threshold;
          roundResults[name].obstacles.push({ type: obsType, passed });
          memberTotals[name].totalObstacles++;

          if (passed) {
            const passTypes = { laser: 'laserDodge', camera: 'cameraDodge', alarm: 'alarmDefuse' };
            roundEvents.push({ type: passTypes[obsType], player: name, obs: obsType, text: pick(HEIST_EVENTS[passTypes[obsType]])(name, pr) });
            survivors.push(name);
          } else {
            const failTypes = { laser: 'laserFail', camera: 'cameraFail', alarm: 'alarmFail' };
            roundEvents.push({ type: failTypes[obsType], player: name, obs: obsType, text: pick(HEIST_EVENTS[failTypes[obsType]])(name, pr) });
            roundResults[name].eliminated = true;
          }
        }
        alive = survivors;
      }

      // Vault loot — everyone who reached the vault gets equal loot
      const vaultCrew = members.filter(n => roundResults[n].reachedVault);
      let roundLoot = 0;
      for (const name of vaultCrew) {
        memberTotals[name].loot += VAULT_LOOT_PER_PLAYER;
        memberTotals[name].vaultReaches++;
        roundLoot += VAULT_LOOT_PER_PLAYER;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + VAULT_LOOT_PER_PLAYER;
      }
      totalLoot += roundLoot;

      // Update momentum for next round (benched players keep previous momentum)
      for (const name of activeMembers) {
        prevRoundReached[name] = roundResults[name].reachedVault;
      }

      rounds.push({
        round: rd + 1,
        events: roundEvents,
        results: roundResults,
        vaultCrew,
        roundLoot,
      });
    }

    result.heist.tribes.push({
      tribe: tribe.name, hasEquipment, rounds,
      totalLoot,
      memberTotals,
      entranceEvents,
      score: totalLoot,
    });
  }
}

// ══════════════════════════════════════════════════════════════
// PHASE 3: GETAWAY
// ══════════════════════════════════════════════════════════════
function _assignGetawayRoles(members) {
  const scored = members.map(n => {
    const s = pStats(n);
    return { name: n, physical: s.physical, endurance: s.endurance, mental: s.mental,
      strategic: s.strategic, intuition: s.intuition, boldness: s.boldness };
  });
  const used = new Set();
  const assign = (sortFn) => {
    const best = scored.filter(s => !used.has(s.name)).sort(sortFn)[0];
    if (best) { used.add(best.name); return best.name; }
    return null;
  };
  const driver = assign((a, b) => (b.physical + b.endurance + b.boldness) - (a.physical + a.endurance + a.boldness));
  const navigator = assign((a, b) => (b.strategic + b.intuition) - (a.strategic + a.intuition));
  const mechanic = assign((a, b) => (b.mental + b.strategic) - (a.mental + a.strategic));
  const crew = members.filter(n => !used.has(n));
  return { driver, navigator, mechanic, crew };
}

function _simulateGetaway(ep, tribeMembers, result) {
  // Build phase — each member contributes
  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const roles = _assignGetawayRoles(members);
    const buildEvents = [];
    let buildTotal = 0;

    for (const name of members) {
      const s = pStats(name);
      const pr = pronouns(name);
      const isMech = name === roles.mechanic;
      const check = (isMech ? s.mental * 0.05 : s.physical * 0.03) + s.mental * 0.02 + noise(0.3);
      const passed = check > 0.25;
      buildTotal += passed ? 1 : 0.3;

      if (isMech) {
        buildEvents.push({ player: name, icon: passed ? '🔧' : '💥',
          type: passed ? 'buildEngine' : 'buildEngineFail',
          text: pick(passed ? GETAWAY_EVENTS.buildEngine : GETAWAY_EVENTS.buildEngineFail)(name, pr) });
      } else {
        buildEvents.push({ player: name, icon: passed ? '🔨' : '😬',
          type: passed ? 'buildWeld' : 'buildWeldFail',
          text: pick(passed ? GETAWAY_EVENTS.buildWeld : GETAWAY_EVENTS.buildWeldFail)(name, pr) });
      }
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + (passed ? 1 : 0);
    }

    // Build argument between two low-bond members
    if (members.length >= 2 && Math.random() < 0.35) {
      const pair = members.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      if (getBond(pair[0], pair[1]) < 3) {
        buildEvents.push({ player: pair[0], player2: pair[1], icon: '🗣️', type: 'buildArgue',
          text: pick(GETAWAY_EVENTS.buildArgue)(pair[0], pair[1]) });
        buildTotal -= 0.3;
      }
    }

    // Sabotage — villain sneaks over to a random rival
    if (Math.random() < 0.2) {
      const villain = members.find(n => isVillainArch(n));
      if (villain) {
        const others = tribeMembers.filter(t => t.name !== tribe.name);
        const target = pick(others);
        if (target) {
          buildEvents.push({ player: villain, icon: '🔩', type: 'buildSabotage', target: target.name,
            text: pick(GETAWAY_EVENTS.buildSabotage)(villain, target.name) });
          addHeistHeat(ep, villain, 1.5);
        }
      }
    }

    const buildQuality = Math.min(1, Math.max(0.15, buildTotal / members.length));

    result.getaway.tribes.push({
      tribe: tribe.name, buildQuality, distance: 0, buildEvents, summary: null,
      members: [...members], roles, finished: false, crashed: false, outOfGas: false,
      sabotaged: false, sabotagedBy: null,
    });
  }

  // Apply sabotage penalty only to the targeted tribe
  for (const gt of result.getaway.tribes) {
    for (const other of result.getaway.tribes) {
      if (other.tribe === gt.tribe) continue;
      const sabEvt = other.buildEvents.find(e => e.type === 'buildSabotage' && e.target === gt.tribe);
      if (sabEvt) {
        gt.buildQuality = Math.max(0.1, gt.buildQuality - 0.15);
        gt.sabotaged = true;
        gt.sabotagedBy = sabEvt.player;
      }
    }
  }

  // Generate summaries AFTER sabotage so they reflect final quality
  for (const gt of result.getaway.tribes) {
    gt.summary = gt.buildQuality > 0.75
      ? { icon: '✅', text: pick(GETAWAY_EVENTS.goodBuild)(gt.tribe) }
      : { icon: '⚠️', text: pick(GETAWAY_EVENTS.badBuild)(gt.tribe) };
  }

  // Race — 5 rounds, all crew members involved
  const raceRounds = [];
  for (let round = 1; round <= 5; round++) {
    if (result.getaway.tribes.every(g => g.finished || g.crashed)) break;
    const roundEvents = [];

    for (const gt of result.getaway.tribes) {
      if (gt.finished || gt.crashed) continue;
      const roles = gt.roles;
      const ds = pStats(roles.driver);
      const dpr = pronouns(roles.driver);
      const ns = roles.navigator ? pStats(roles.navigator) : null;
      const npr = roles.navigator ? pronouns(roles.navigator) : null;
      const ms = roles.mechanic ? pStats(roles.mechanic) : null;
      const mpr = roles.mechanic ? pronouns(roles.mechanic) : null;

      let speedMod = 0;
      const baseSpeed = gt.buildQuality * 0.5 + ds.physical * 0.03 + ds.endurance * 0.03 + 0.2 + noise(0.15);
      const tribeRoundEvents = [];

      // Driver — obstacle dodge (40% chance)
      if (Math.random() < 0.4) {
        const dodgeCheck = ds.intuition * 0.03 + ds.boldness * 0.03 + noise(0.3);
        if (dodgeCheck > 0.25) {
          tribeRoundEvents.push({ role: '🏎️', player: roles.driver, type: 'driverDodge', icon: '✅',
            text: pick(GETAWAY_EVENTS.driverDodge)(roles.driver, dpr) });
          speedMod += 0.05;
          ep.chalMemberScores[roles.driver] = (ep.chalMemberScores[roles.driver] || 0) + 1;
        } else {
          tribeRoundEvents.push({ role: '🏎️', player: roles.driver, type: 'driverCrash', icon: '💥',
            text: pick(GETAWAY_EVENTS.driverCrash)(roles.driver, dpr) });
          speedMod -= 0.1;
          popDelta(roles.driver, -1);
        }
      }

      // Navigator — shortcut or wrong turn (35% chance)
      if (roles.navigator && Math.random() < 0.35) {
        const navCheck = ns.strategic * 0.04 + ns.intuition * 0.03 + noise(0.3);
        if (navCheck > 0.28) {
          tribeRoundEvents.push({ role: '🗺️', player: roles.navigator, type: 'navShortcut', icon: '⬆️',
            text: pick(GETAWAY_EVENTS.navShortcut)(roles.navigator, npr) });
          speedMod += 0.08;
          ep.chalMemberScores[roles.navigator] = (ep.chalMemberScores[roles.navigator] || 0) + 1;
        } else {
          tribeRoundEvents.push({ role: '🗺️', player: roles.navigator, type: 'navWrongTurn', icon: '🔄',
            text: pick(GETAWAY_EVENTS.navWrongTurn)(roles.navigator, npr) });
          speedMod -= 0.08;
        }
      }

      // Mechanic — fix or fail on breakdown (triggered by low build quality)
      if (roles.mechanic && Math.random() < (1 - gt.buildQuality) * 0.5) {
        const fixCheck = ms.mental * 0.04 + ms.strategic * 0.02 + noise(0.3);
        if (fixCheck > 0.25) {
          tribeRoundEvents.push({ role: '🔧', player: roles.mechanic, type: 'mechFix', icon: '✅',
            text: pick(GETAWAY_EVENTS.mechFix)(roles.mechanic, mpr) });
          ep.chalMemberScores[roles.mechanic] = (ep.chalMemberScores[roles.mechanic] || 0) + 1;
        } else {
          tribeRoundEvents.push({ role: '🔧', player: roles.mechanic, type: 'mechFail', icon: '💥',
            text: pick(GETAWAY_EVENTS.mechFail)(roles.mechanic, mpr) });
          speedMod -= 0.12;
        }
      }

      // Crew — push (when slow), cheer (when ahead), or throw stuff (villain)
      for (const crewName of roles.crew) {
        if (Math.random() > 0.4) continue;
        const cs = pStats(crewName);
        const cpr = pronouns(crewName);

        if (gt.distance < 40 && cs.physical >= 5 && Math.random() < 0.4) {
          tribeRoundEvents.push({ role: '💪', player: crewName, type: 'crewPush', icon: '⬆️',
            text: pick(GETAWAY_EVENTS.crewPush)(crewName, cpr) });
          speedMod += 0.04;
          ep.chalMemberScores[crewName] = (ep.chalMemberScores[crewName] || 0) + 1;
        } else if (isVillainArch(crewName) && Math.random() < 0.3) {
          const otherTribe = result.getaway.tribes.find(g => g.tribe !== gt.tribe && !g.crashed && !g.finished);
          if (otherTribe) {
            tribeRoundEvents.push({ role: '😈', player: crewName, type: 'crewThrow', icon: '🎯',
              text: pick(GETAWAY_EVENTS.crewThrow)(crewName, otherTribe.tribe, cpr) });
            otherTribe.distance -= 3;
            addHeistHeat(ep, crewName, 1);
            popDelta(crewName, -1);
          }
        } else {
          tribeRoundEvents.push({ role: '📣', player: crewName, type: 'crewCheer', icon: '🔥',
            text: pick(GETAWAY_EVENTS.crewCheer)(crewName, roles.driver) });
          speedMod += 0.02;
        }
      }

      // Tire blowout (round 3+, once per tribe max)
      if (round >= 3 && !gt.hadBlowout && Math.random() < 0.15 + (1 - gt.buildQuality) * 0.1) {
        gt.hadBlowout = true;
        tribeRoundEvents.push({ role: '⚠️', type: 'tireBlowout', icon: '💨',
          text: pick(GETAWAY_EVENTS.tireBlowout)(gt.tribe) });
        speedMod -= 0.15;
      }

      // Nitro boost (round 2+, 20% chance, better with good build)
      if (round >= 2 && Math.random() < gt.buildQuality * 0.25) {
        tribeRoundEvents.push({ role: '🚀', type: 'nitroBoost', icon: '🔥',
          text: pick(GETAWAY_EVENTS.nitroBoost)(gt.tribe) });
        speedMod += 0.12;
      }

      // Out of gas (round 4-5)
      if (round >= 4 && !gt.outOfGas && Math.random() < 0.18 - ds.endurance * 0.012) {
        gt.outOfGas = true;
        tribeRoundEvents.push({ role: '⛽', type: 'outOfGas', icon: '❌',
          text: pick(GETAWAY_EVENTS.outOfGas)(gt.tribe) });
        speedMod -= 0.2;
      }

      const roundDistance = Math.max(2, (baseSpeed + speedMod) * 22);
      gt.distance += roundDistance;

      // Crash near finish (leading, round 3+, 12%) — check BEFORE finish
      if (round >= 3 && gt.distance >= 85 && !gt.finished) {
        const isLeading = result.getaway.tribes.every(g => g.tribe === gt.tribe || g.distance <= gt.distance);
        if (isLeading && Math.random() < 0.12) {
          gt.crashed = true;
          gt.distance = Math.max(50, gt.distance - 20);
          tribeRoundEvents.push({ role: '💥', type: 'crashNearFinish', icon: '🔥',
            text: pick(GETAWAY_EVENTS.crashNearFinish)(gt.tribe) });
        }
      }

      if (gt.distance >= 100 && !gt.crashed) {
        gt.finished = true;
        gt.finishRound = round;
        gt.finishOrder = result.getaway.tribes.filter(g => g.finished).length;
        gt.distance = 100;
        const finishText = gt.buildQuality > 0.5
          ? pick(GETAWAY_EVENTS.finishStrong)(gt.tribe)
          : pick(GETAWAY_EVENTS.finishLimp)(gt.tribe);
        tribeRoundEvents.push({ role: '🏁', type: 'finish', icon: '🏁', text: finishText });
        ep.chalMemberScores[roles.driver] = (ep.chalMemberScores[roles.driver] || 0) + 3;
        ep.chalMemberScores[roles.navigator] = (ep.chalMemberScores[roles.navigator] || 0) + 2;
      }

      // Cap distance display at 100
      const displayDist = Math.min(100, Math.round(gt.distance));

      if (tribeRoundEvents.length === 0) {
        tribeRoundEvents.push({ role: '🏎️', type: 'cruise', icon: '➡️',
          text: `${gt.tribe} cruised along the track. No drama this round.` });
      }

      roundEvents.push({ tribe: gt.tribe, events: tribeRoundEvents,
        distance: displayDist, roundGain: Math.round(roundDistance) });
    }

    raceRounds.push({ num: round, tribes: roundEvents,
      positions: result.getaway.tribes.map(g => ({
        tribe: g.tribe, distance: Math.min(100, Math.round(g.distance)),
        finished: g.finished, crashed: g.crashed,
      })),
    });
  }

  result.getaway.raceRounds = raceRounds;
}

function addHeistHeat(ep, name, amount) {
  if (!gs._heistHeat) gs._heistHeat = [];
  gs._heistHeat.push({ target: name, amount, expiresEp: (ep.num || 1) + 2 });
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textOceansHeist(ep, ln, sec) {
  const oh = ep.oceansHeist;
  if (!oh) return;
  ln('');
  ln('═══ OCEAN\'S EIGHT—OR NINE ═══');
  ln('');

  // Vault
  ln('── PHASE 1: VAULT CRACK ──');
  for (const vt of oh.vaultCrack.tribes) {
    ln(`${vt.tribe}: ${vt.locked} locked in vault (${vt.lockedReaction})`);
    for (const e of vt.events) ln(`  ${e.text || ''}`);
    ln(`  Score: ${vt.score.toFixed(2)}`);
  }
  ln(`First to crack: ${oh.vaultCrack.firstTribe}`);
  ln('');

  // Heist
  ln('── PHASE 2: THE HEIST (5 ROUNDS) ──');
  for (const ht of oh.heist.tribes) {
    ln(`${ht.tribe}${ht.hasEquipment ? ' (has equipment)' : ''}: Total Loot $${ht.totalLoot * 100}k`);
    for (const e of (ht.entranceEvents || [])) ln(`  ${e.text || ''}`);
    for (const rd of ht.rounds) {
      ln(`  Round ${rd.round}: ${rd.vaultCrew.length} reached vault — $${rd.roundLoot * 100}k`);
      for (const e of rd.events) ln(`    ${e.text || ''}`);
    }
  }
  ln('');

  // Getaway
  ln('── PHASE 3: GETAWAY ──');
  for (const gt of oh.getaway.tribes) {
    const r = gt.roles;
    ln(`${gt.tribe}: Build ${(gt.buildQuality * 100).toFixed(0)}%${gt.sabotaged ? ' (SABOTAGED)' : ''} | Driver: ${r.driver} | Nav: ${r.navigator} | Mech: ${r.mechanic}`);
    ln(`  Distance ${Math.round(gt.distance)} | ${gt.crashed ? 'CRASHED' : gt.finished ? 'FINISHED' : 'DNF'}`);
    for (const e of gt.buildEvents) ln(`  Build: ${e.text}`);
  }
  for (const rd of oh.getaway.raceRounds) {
    ln(`  Round ${rd.num}:`);
    for (const trd of rd.tribes) {
      ln(`    ${trd.tribe}: +${trd.roundGain}% → ${trd.distance}%`);
      for (const e of trd.events) ln(`      ${e.text || ''}`);
    }
  }
  ln('');

  ln(`Winner: ${oh.winner}`);
  ln(`Loser: ${oh.loser}`);
}

// ══════════════════════════════════════════════════════════════
// TITLE CARD + COLD OPEN
// ══════════════════════════════════════════════════════════════
export function rpBuildOceansHeistTitleCard(ep) {
  const oh = ep.oceansHeist;
  if (!oh) return '';

  const taglines = [
    '"Three phases. One crew. Infinite greed."',
    '"Trust no one. Steal everything."',
    '"The vault won\'t crack itself."',
  ];
  const tagline = taglines[Math.floor((ep.num || 0) % taglines.length)];

  const crewRoles = oh.crewRoles || {};
  const allRoles = Object.entries(crewRoles).flatMap(([tribe, roles]) =>
    Object.entries(roles).map(([name, r]) => ({ name, tribe, ...r }))
  );

  let crewCards = '';
  for (const [tribe, roles] of Object.entries(crewRoles)) {
    crewCards += `<div style="margin-bottom:12px">
      <div style="font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--heist-cyan);margin-bottom:6px">${tribe}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">`;
    for (const [name, r] of Object.entries(roles)) {
      crewCards += `<div style="text-align:center;width:60px">
        ${_ohPortrait(name, 36)}
        <div style="font-size:8px;color:rgba(255,255,255,0.7);margin-top:2px">${name.split(' ')[0]}</div>
        <div style="font-size:9px;color:var(--heist-gold);font-family:'Share Tech Mono',monospace">${r.emoji} ${r.role}</div>
      </div>`;
    }
    crewCards += `</div></div>`;
  }

  return _ohShell(`
    <div style="text-align:center;padding:50px 20px 60px;position:relative;z-index:6;">
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:5px;color:rgba(34,211,238,0.4);text-transform:uppercase;margin-bottom:14px;">CLASSIFIED &middot; ${host().toUpperCase()} PRODUCTIONS</div>

      <div style="font-family:'Black Ops One',sans-serif;font-size:40px;color:var(--heist-cyan);text-shadow:0 0 30px rgba(34,211,238,0.3),3px 3px 0 rgba(0,0,0,0.6);letter-spacing:5px;line-height:1.1;margin-bottom:8px;">OCEAN'S EIGHT<br><span style="font-size:20px;color:var(--heist-gold)">—OR NINE</span></div>

      <div style="font-family:'Share Tech Mono',monospace;font-size:13px;font-style:italic;color:rgba(255,255,255,0.5);margin-bottom:24px;letter-spacing:1px;">${tagline}</div>

      <div style="display:inline-block;background:rgba(0,0,0,0.35);border:1px solid rgba(34,211,238,0.12);border-radius:4px;padding:16px 28px;margin-bottom:24px;">
        <div style="font-size:9px;letter-spacing:4px;color:rgba(34,211,238,0.4);text-transform:uppercase;margin-bottom:10px;">HEIST PHASES</div>
        <div style="display:flex;gap:24px;justify-content:center;font-size:13px;color:rgba(255,255,255,0.8);">
          <div style="text-align:center"><div style="font-family:'Black Ops One',sans-serif;font-size:18px;color:var(--heist-gold);margin-bottom:2px;">I</div><div style="font-size:10px;letter-spacing:1px">VAULT CRACK</div></div>
          <div style="text-align:center"><div style="font-family:'Black Ops One',sans-serif;font-size:18px;color:var(--heist-red);margin-bottom:2px;">II</div><div style="font-size:10px;letter-spacing:1px">THE HEIST</div></div>
          <div style="text-align:center"><div style="font-family:'Black Ops One',sans-serif;font-size:18px;color:var(--heist-green);margin-bottom:2px;">III</div><div style="font-size:10px;letter-spacing:1px">GETAWAY</div></div>
        </div>
      </div>

      <div style="max-width:500px;margin:0 auto;background:rgba(0,0,0,0.2);border:1px solid rgba(34,211,238,0.08);border-radius:4px;padding:16px">
        <div style="font-size:9px;letter-spacing:3px;color:rgba(34,211,238,0.4);text-transform:uppercase;margin-bottom:10px;font-family:'Share Tech Mono',monospace">THE CREW</div>
        ${crewCards}
      </div>
    </div>
  `, ep);
}

export function _coldOpenOceansHeist(ep) {
  const h = host();
  return `A black van screeched to a halt on the film lot. ${h} stepped out wearing a turtleneck and aviators. "Today's challenge is simple," he said, cracking his knuckles. "You're going to rob a bank." He unrolled a blueprint on the hood. "Three phases. Crack the vault. Steal the loot. Escape in your getaway car." He grinned. "First team out wins. Last team... well. Someone's going home tonight."`;
}

// ══════════════════════════════════════════════════════════════
// VP HELPERS
// ══════════════════════════════════════════════════════════════
function _ohPortrait(name, size = 40) {
  const slug = players.find(p => p.name === name)?.slug || '';
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid var(--heist-cyan);box-shadow:0 0 6px rgba(34,211,238,0.2)" onerror="this.style.display='none'">`;
}
function _ohSidePortrait(name, size = 24) {
  const slug = players.find(p => p.name === name)?.slug || '';
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:1px solid var(--heist-cyan)" onerror="this.style.display='none'">`;
}
function _ohBadge(text, color = 'cyan') {
  const colors = { cyan: 'var(--heist-cyan)', red: 'var(--heist-red)', gold: 'var(--heist-gold)', green: 'var(--heist-green)', gray: '#64748b' };
  const c = colors[color] || color;
  return `<span style="display:inline-block;padding:2px 8px;font-size:8px;font-family:'Share Tech Mono',monospace;letter-spacing:2px;text-transform:uppercase;border:1px solid ${c};color:${c};border-radius:2px;background:rgba(0,0,0,0.3)">${text}</span>`;
}

// ══════════════════════════════════════════════════════════════
// VP SHELL
// ══════════════════════════════════════════════════════════════
function _ohShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Share+Tech+Mono&family=Inter:wght@400;600;700&display=swap');

.oh-shell{
  --heist-cyan:#22d3ee;--heist-red:#ef4444;--heist-gold:#fbbf24;
  --heist-green:#22c55e;--heist-dark:#0f172a;--heist-navy:#1e293b;
  font-family:'Inter',sans-serif;color:#e2e0db;
  background:linear-gradient(180deg,#0a0e1a 0%,#0f172a 30%,#1e293b 60%,#0f172a 85%,#0a0e1a 100%);
  padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
  overflow:clip;border:2px solid rgba(34,211,238,0.15);box-shadow:inset 0 0 60px rgba(0,0,0,0.5),0 0 20px rgba(34,211,238,0.05);
}

/* Blueprint grid */
.oh-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background-image:linear-gradient(rgba(34,211,238,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.03) 1px,transparent 1px);
  background-size:40px 40px;pointer-events:none;z-index:1}

/* CCTV scanline */
.oh-shell::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(34,211,238,0.008) 2px,rgba(34,211,238,0.008) 4px);
  pointer-events:none;z-index:2;animation:oh-scanline 8s linear infinite}

.oh-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;position:relative;z-index:5;
  border-bottom:1px solid rgba(34,211,238,0.1)}
.oh-title{font-family:'Black Ops One',sans-serif;font-size:20px;letter-spacing:4px;color:var(--heist-cyan);
  text-shadow:0 0 20px rgba(34,211,238,0.3)}
.oh-subtitle{font-size:10px;letter-spacing:2px;color:rgba(34,211,238,0.4);margin-top:2px;font-family:'Share Tech Mono',monospace}

/* Layout */
.oh-layout{display:flex;gap:0;position:relative;z-index:5;min-height:300px}
.oh-feed{flex:1;padding:14px 18px;min-width:0}
.oh-sidebar{width:280px;flex-shrink:0;padding:12px 16px;background:rgba(0,0,0,0.3);
  border-left:1px solid rgba(34,211,238,0.08);position:sticky;top:0;align-self:flex-start;max-height:80vh;overflow-y:auto}

/* HUD */
.oh-hud{display:flex;justify-content:center;gap:0;padding:12px 0;position:relative;z-index:5;
  border-bottom:1px solid rgba(34,211,238,0.08);background:rgba(0,0,0,0.2)}
.oh-hud-cell{flex:1;text-align:center;padding:4px 12px;border-right:1px solid rgba(34,211,238,0.06)}
.oh-hud-cell:last-child{border-right:none}
.oh-hud-val{font-family:'Share Tech Mono',monospace;font-size:20px;font-weight:700}
.oh-hud-lbl{font-size:9px;letter-spacing:2px;color:rgba(34,211,238,0.4);text-transform:uppercase;margin-top:2px;font-family:'Share Tech Mono',monospace}

/* Event cards */
.oh-ev{display:flex;align-items:flex-start;gap:10px;padding:8px 12px;margin-bottom:6px;
  background:rgba(0,0,0,0.2);border-radius:4px;border-left:3px solid rgba(34,211,238,0.15);
  position:relative;font-size:12px;line-height:1.5}
.oh-ev-port{flex-shrink:0;position:relative}
.oh-ev-text{color:rgba(255,255,255,0.75);font-size:12px}
.oh-ev-badge{display:inline-block;padding:2px 8px;font-size:8px;font-family:'Share Tech Mono',monospace;
  letter-spacing:2px;text-transform:uppercase;border-radius:2px;margin-bottom:4px}
.oh-ev-badge.cyan{border:1px solid var(--heist-cyan);color:var(--heist-cyan);background:rgba(34,211,238,0.06)}
.oh-ev-badge.red{border:1px solid var(--heist-red);color:var(--heist-red);background:rgba(239,68,68,0.06)}
.oh-ev-badge.gold{border:1px solid var(--heist-gold);color:var(--heist-gold);background:rgba(251,191,36,0.06)}
.oh-ev-badge.green{border:1px solid var(--heist-green);color:var(--heist-green);background:rgba(34,197,94,0.06)}
.oh-ev-badge.gray{border:1px solid #64748b;color:#94a3b8;background:rgba(100,116,139,0.06)}

/* CAM label */
.oh-cam{position:absolute;top:4px;right:8px;font-family:'Share Tech Mono',monospace;font-size:8px;color:rgba(34,211,238,0.25);letter-spacing:1px}
.oh-rec{color:var(--heist-red);animation:oh-blink 1.5s ease-in-out infinite}

/* Controls */
.oh-controls{display:flex;gap:10px;justify-content:center;padding:16px 0;position:relative;z-index:5}
.oh-btn-next{padding:10px 24px;font-family:'Black Ops One',sans-serif;font-size:13px;letter-spacing:2px;
  background:rgba(34,211,238,0.1);color:var(--heist-cyan);border:2px solid var(--heist-cyan);
  border-radius:4px;cursor:pointer;text-transform:uppercase;transition:all 0.2s}
.oh-btn-next:hover{background:rgba(34,211,238,0.2);box-shadow:0 0 15px rgba(34,211,238,0.2)}
.oh-btn-all{padding:10px 18px;font-size:11px;background:none;color:rgba(255,255,255,0.3);
  border:1px solid rgba(255,255,255,0.1);border-radius:4px;cursor:pointer;font-family:'Share Tech Mono',monospace}

/* Side section */
.oh-side-sec{font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;
  color:var(--heist-cyan);text-transform:uppercase;padding:6px 0 4px;
  border-bottom:1px solid rgba(34,211,238,0.1);margin-top:8px}
.oh-side-sec:first-child{margin-top:0}

/* Laser grid — animated beams crossing the frame */
.oh-laser{position:relative;overflow:hidden}
.oh-laser::before,.oh-laser::after{content:'';position:absolute;pointer-events:none;z-index:1}
.oh-laser::before{top:0;left:-100%;width:300%;height:2px;
  background:linear-gradient(90deg,transparent 0%,transparent 30%,rgba(239,68,68,0.7) 45%,rgba(255,100,100,1) 50%,rgba(239,68,68,0.7) 55%,transparent 70%,transparent 100%);
  box-shadow:0 0 8px 2px rgba(239,68,68,0.4),0 0 20px 4px rgba(239,68,68,0.15);
  animation:oh-laser-h 4s linear infinite}
.oh-laser::after{left:0;top:-100%;height:300%;width:2px;
  background:linear-gradient(180deg,transparent 0%,transparent 30%,rgba(239,68,68,0.7) 45%,rgba(255,100,100,1) 50%,rgba(239,68,68,0.7) 55%,transparent 70%,transparent 100%);
  box-shadow:0 0 8px 2px rgba(239,68,68,0.4),0 0 20px 4px rgba(239,68,68,0.15);
  animation:oh-laser-v 5.5s linear infinite}
@keyframes oh-laser-h{0%{transform:translateX(-20%) translateY(15px) rotate(3deg)}
  25%{transform:translateX(10%) translateY(45px) rotate(-2deg)}
  50%{transform:translateX(30%) translateY(25px) rotate(4deg)}
  75%{transform:translateX(5%) translateY(60px) rotate(-3deg)}
  100%{transform:translateX(-20%) translateY(15px) rotate(3deg)}}
@keyframes oh-laser-v{0%{transform:translateY(-20%) translateX(30px) rotate(2deg)}
  25%{transform:translateY(5%) translateX(70%) rotate(-4deg)}
  50%{transform:translateY(25%) translateX(40%) rotate(3deg)}
  75%{transform:translateY(10%) translateX(80%) rotate(-2deg)}
  100%{transform:translateY(-20%) translateX(30px) rotate(2deg)}}

/* Alarm flash */
.oh-alarm{animation:oh-alarm-flash 0.6s ease-out}

/* Security camera — sweeping crosshair/reticle */
.oh-camera{position:relative;overflow:hidden}
.oh-camera::before{content:'⊕';position:absolute;font-size:32px;color:rgba(34,211,238,0.12);
  pointer-events:none;z-index:1;
  animation:oh-cam-sweep 3.5s ease-in-out infinite}
.oh-camera::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:1;
  background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(34,211,238,0.02) 3px,rgba(34,211,238,0.02) 4px);
  animation:oh-cam-scan 2s linear infinite}
@keyframes oh-cam-sweep{
  0%{top:10%;left:15%;transform:scale(1)}
  20%{top:30%;left:65%;transform:scale(1.2)}
  40%{top:55%;left:25%;transform:scale(0.9)}
  60%{top:20%;left:75%;transform:scale(1.1)}
  80%{top:60%;left:50%;transform:scale(1)}
  100%{top:10%;left:15%;transform:scale(1)}}
@keyframes oh-cam-scan{0%{background-position:0 0}100%{background-position:0 100px}}

/* Camera fail — reddish highlight + target lock */
.oh-cam-fail{background:rgba(239,68,68,0.08);border-radius:4px;padding:4px 6px!important;
  border:1px solid rgba(239,68,68,0.12);position:relative}
.oh-cam-fail::after{content:'◎';position:absolute;right:8px;top:50%;transform:translateY(-50%);
  font-size:16px;color:rgba(239,68,68,0.25);animation:oh-target-lock 0.8s ease-out}
@keyframes oh-target-lock{0%{transform:translateY(-50%) scale(2.5);opacity:0}
  50%{opacity:1}100%{transform:translateY(-50%) scale(1);opacity:0.25}}

/* Alarm obstacle — pulsing red glow on the container */
.oh-alarm-obs{position:relative;overflow:hidden}
.oh-alarm-obs::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:1;
  border-radius:6px;
  box-shadow:inset 0 0 20px rgba(251,191,36,0.06);
  animation:oh-alarm-ambient 2s ease-in-out infinite}
@keyframes oh-alarm-ambient{0%,100%{box-shadow:inset 0 0 15px rgba(251,191,36,0.04)}
  50%{box-shadow:inset 0 0 25px rgba(251,191,36,0.1)}}

/* Alarm fail — big red pulse on the failed row */
.oh-alarm-fail{background:rgba(239,68,68,0.1);border-radius:4px;padding:4px 6px!important;
  border:1px solid rgba(239,68,68,0.15);
  animation:oh-alarm-blare 1.5s ease-in-out infinite}
@keyframes oh-alarm-blare{0%,100%{box-shadow:0 0 0 rgba(239,68,68,0)}
  50%{box-shadow:0 0 12px rgba(239,68,68,0.3),inset 0 0 8px rgba(239,68,68,0.1)}}

/* Build phase — sparks flying */
.oh-build-phase{position:relative;overflow:hidden}
.oh-build-phase::before{content:'⚡ 🔨 ⚡ 🔩 ⚡ 🔧 ⚡';position:absolute;bottom:-10px;left:0;right:0;
  font-size:10px;letter-spacing:8px;text-align:center;pointer-events:none;z-index:1;opacity:0.12;
  animation:oh-sparks 2s ease-in-out infinite}
@keyframes oh-sparks{0%,100%{transform:translateY(0);opacity:0.08}50%{transform:translateY(-6px);opacity:0.15}}

/* Race round — speed lines */
.oh-race-round{position:relative;overflow:hidden}
.oh-race-round::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:1;
  background:repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(251,191,36,0.03) 60px,rgba(251,191,36,0.03) 62px);
  animation:oh-speed-lines 0.8s linear infinite}
@keyframes oh-speed-lines{0%{background-position:0 0}100%{background-position:-62px 0}}

/* Vault loot — falling money */
.oh-vault-loot{position:relative;overflow:hidden}
.oh-vault-loot::before{content:'💵 💰 💵 💲 💰 💵 💲 💰';position:absolute;top:-30px;left:0;right:0;
  font-size:14px;letter-spacing:12px;text-align:center;
  pointer-events:none;z-index:1;opacity:0.15;white-space:nowrap;
  animation:oh-money-fall 4s linear infinite}
.oh-vault-loot::after{content:'💲 💰 💵 💰 💲 💵 💰 💵';position:absolute;top:-30px;left:20px;right:0;
  font-size:12px;letter-spacing:16px;text-align:center;
  pointer-events:none;z-index:1;opacity:0.1;white-space:nowrap;
  animation:oh-money-fall 5.5s linear infinite;animation-delay:-2s}
@keyframes oh-money-fall{0%{transform:translateY(-20px)}100%{transform:translateY(120px)}}

/* Animations */
@keyframes oh-scanline{0%{background-position:0 0}100%{background-position:0 200px}}
@keyframes oh-blink{0%,100%{opacity:1}50%{opacity:0.2}}
@keyframes oh-alarm-flash{0%{box-shadow:inset 0 0 0 rgba(239,68,68,0)}30%{box-shadow:inset 0 0 30px rgba(239,68,68,0.3)}100%{box-shadow:inset 0 0 0 rgba(239,68,68,0)}}
@keyframes oh-fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes oh-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes oh-vault-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .oh-shell::after,.oh-rec,.oh-alarm,.oh-laser::before,.oh-laser::after,
  .oh-camera::before,.oh-camera::after,.oh-cam-fail::after,
  .oh-alarm-obs::before,.oh-alarm-fail,
  .oh-vault-loot::before,.oh-vault-loot::after,
  .oh-build-phase::before,.oh-race-round::before{animation:none!important}
}
</style>
<div class="oh-shell">
  <div class="oh-header">
    <div>
      <div class="oh-title">OCEAN'S EIGHT—OR NINE</div>
      <div class="oh-subtitle">Episode ${ep.num || '?'} &middot; Bank Heist Challenge</div>
    </div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(34,211,238,0.3)">
      <span class="oh-rec">● REC</span> CAM-01
    </div>
  </div>
  ${content}
</div>`;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 1: VAULT CRACK
// ══════════════════════════════════════════════════════════════
export function rpBuildOceansHeistVault(ep) {
  const oh = ep.oceansHeist;
  if (!oh || !oh.vaultCrack) return '';
  const vc = oh.vaultCrack;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'oh-vault';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const steps = [];

  // Intro
  steps.push({ type: 'intro', html: `<div class="oh-ev" style="border-left-color:var(--heist-cyan);padding:14px">
    <div style="font-size:28px">🏦</div>
    <div style="flex:1"><div class="oh-ev-badge cyan" style="font-size:11px;padding:4px 12px">PHASE I — VAULT CRACK</div>
    <div class="oh-ev-text" style="font-size:14px;margin-top:6px">${pick(HEIST_HOST.vaultIntro)(host())}</div></div>
  </div>` });

  // Per-tribe: each event is its own reveal step for suspense
  for (const vt of vc.tribes) {
    const reactionIcon = vt.lockedReaction === 'panic' ? '😰' : vt.lockedReaction === 'nap' ? '😴' : '🔧';
    const reactionLabel = vt.lockedReaction === 'panic' ? 'PANICKING inside!' : vt.lockedReaction === 'nap' ? 'Taking a NAP inside.' : 'Working from INSIDE!';
    const reactionColor = vt.lockedReaction === 'panic' ? 'var(--heist-red)' : vt.lockedReaction === 'nap' ? 'var(--heist-gold)' : 'var(--heist-green)';

    // Tribe header + locked member
    steps.push({ type: 'tribe-header', tribe: vt.tribe, html: `<div class="oh-ev" style="border-left-color:var(--heist-gold);padding:12px">
      <div style="flex:1">
        <div class="oh-ev-badge gold" style="font-size:10px;padding:3px 10px">${vt.tribe} — VAULT</div>
        <div style="display:flex;align-items:center;gap:12px;margin:10px 0;padding:10px;background:rgba(0,0,0,0.25);border-radius:6px;border:1px solid rgba(251,191,36,0.2)">
          ${_ohPortrait(vt.locked, 48)}
          <div>
            <div style="font-size:14px;color:var(--heist-gold);font-family:'Black Ops One',sans-serif;letter-spacing:1px">🔒 ${vt.locked}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5)">Locked in the vault</div>
          </div>
        </div>
        <div style="font-size:9px;letter-spacing:2px;color:rgba(34,211,238,0.5);margin-bottom:6px">CRACK TEAM ASSIGNED:</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${vt.approaches.map(a => {
            const aIcon = a.approach === 'lockpick' ? '🔓' : a.approach === 'bruteForce' ? '💪' : '🗣️';
            return `<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(34,211,238,0.05);border:1px solid rgba(34,211,238,0.1);border-radius:4px">
              ${_ohPortrait(a.name, 28)}
              <div><div style="font-size:11px;color:rgba(255,255,255,0.8)">${a.name}</div>
              <div style="font-size:9px;color:var(--heist-cyan);font-family:'Share Tech Mono',monospace">${aIcon} ${a.approach === 'lockpick' ? 'Lockpick' : a.approach === 'bruteForce' ? 'Brute Force' : 'Social Eng'}</div></div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>` });

    // Each event as its own card
    for (const evt of vt.events) {
      if (evt.type === 'cracked') {
        const scorePct = Math.min(100, Math.round(vt.score * 33));
        steps.push({ type: 'crack', tribe: vt.tribe, html: `<div class="oh-ev" style="border-left-color:var(--heist-green);padding:14px;background:rgba(34,197,94,0.04);border:1px solid rgba(34,197,94,0.15);border-radius:6px">
          <div style="font-size:28px">🔓</div>
          <div style="flex:1">
            <div class="oh-ev-badge green" style="font-size:10px;padding:3px 10px">VAULT OPEN!</div>
            <div style="font-size:15px;color:var(--heist-green);font-weight:700;margin-top:4px">${evt.text}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
              <div style="flex:1;height:8px;background:rgba(0,0,0,0.3);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${scorePct}%;background:var(--heist-green);border-radius:4px"></div>
              </div>
              <span style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--heist-green)">${vt.score.toFixed(1)} pts</span>
            </div>
          </div>
        </div>` });
      } else if (evt.type === 'kidnapped') {
        steps.push({ type: 'kidnap', tribe: vt.tribe, html: `<div class="oh-ev" style="border-left-color:var(--heist-red);padding:12px">
          ${_ohPortrait(evt.player, 42)}
          <div style="flex:1">
            <div class="oh-ev-badge red" style="font-size:10px;padding:3px 10px">🎒 KIDNAPPED!</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:4px">${evt.text}</div>
          </div>
        </div>` });
      } else if (evt.type === 'slapFight') {
        steps.push({ type: 'event', tribe: vt.tribe, html: `<div class="oh-ev" style="border-left-color:var(--heist-red);padding:10px">
          <div style="display:flex;gap:4px">${_ohPortrait(evt.players[0], 36)}${_ohPortrait(evt.players[1], 36)}</div>
          <div style="flex:1">
            <div class="oh-ev-badge red" style="font-size:9px">SLAP FIGHT!</div>
            <div style="font-size:13px;color:var(--heist-red);margin-top:2px">${evt.text}</div>
          </div>
        </div>` });
      } else if (evt.type === 'panicInVault' || evt.type === 'napInVault' || evt.type === 'workInside') {
        steps.push({ type: 'event', tribe: vt.tribe, html: `<div class="oh-ev" style="border-left-color:${reactionColor};padding:10px">
          ${_ohPortrait(vt.locked, 36)}
          <div style="flex:1">
            <div class="oh-ev-badge ${vt.lockedReaction === 'panic' ? 'red' : vt.lockedReaction === 'nap' ? 'gold' : 'green'}" style="font-size:9px">${reactionIcon} ${reactionLabel}</div>
            <div style="font-size:13px;color:${reactionColor};margin-top:2px">${evt.text}</div>
          </div>
        </div>` });
      } else {
        // Cracker attempt
        const actorName = evt.player || '';
        steps.push({ type: 'attempt', tribe: vt.tribe, html: `<div class="oh-ev" style="border-left-color:var(--heist-cyan);padding:10px">
          ${actorName ? _ohPortrait(actorName, 36) : ''}
          <div style="flex:1">
            <div style="font-size:13px;color:rgba(255,255,255,0.75)">${evt.text}</div>
          </div>
        </div>` });
      }
    }
  }

  // Final result
  steps.push({ type: 'result', html: `<div class="oh-ev" style="border-left-color:var(--heist-green);padding:16px;text-align:center;background:rgba(34,197,94,0.04);border:1px solid rgba(34,197,94,0.12);border-radius:6px">
    <div style="flex:1">
      <div class="oh-ev-badge green" style="font-size:12px;padding:4px 14px">🏆 VAULT CRACKED</div>
      <div style="font-size:16px;color:var(--heist-green);font-family:'Black Ops One',sans-serif;letter-spacing:2px;margin-top:6px">${vc.firstTribe} cracks first!</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px">They get the bank equipment — bonus for Phase II</div>
    </div>
  </div>` });

  const totalSteps = steps.length;

  // Sidebar
  function buildVaultSidebar(revCount) {
    let sb = `<div class="oh-side-sec">VAULT STATUS</div>`;
    for (const vt of vc.tribes) {
      const idx = vc.tribes.indexOf(vt) + 1;
      const shown = idx < revCount;
      sb += `<div style="padding:5px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:3px;opacity:${shown ? 1 : 0.4}">
        <div style="font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--heist-cyan)">${vt.tribe}</div>
        ${shown ? `<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">🔒 ${vt.locked} locked</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.3)">${vt.crackers.length} crackers</div>
        <div style="margin-top:3px;height:4px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${Math.min(100, vt.score * 100)}%;background:var(--heist-cyan);border-radius:2px"></div>
        </div>` : '<div style="font-size:8px;color:rgba(255,255,255,0.15)">LOCKED</div>'}
      </div>`;
    }
    sb += `<div class="oh-side-sec">CRACK ORDER</div>`;
    for (let i = 0; i < vc.tribes.length; i++) {
      const shown = i + 1 < revCount;
      sb += `<div style="font-size:9px;color:${shown ? 'var(--heist-green)' : 'rgba(255,255,255,0.15)'};padding:2px 0">
        ${i + 1}. ${shown ? vc.tribes[i].tribe : '???'}${i === 0 && shown ? ' 🏆' : ''}
      </div>`;
    }
    return sb;
  }

  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    const visible = i <= revIdx;
    feed += `<div id="oh-step-vault-${i}" style="${visible ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="oh-controls-vault" class="oh-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="oh-btn-next" onclick="oceansHeistRevealNext('oh-vault',${totalSteps})">CRACK IT</button>
    <button class="oh-btn-all" onclick="oceansHeistRevealAll('oh-vault',${totalSteps})">Reveal All</button>
  </div>
  <div id="oh-done-vault" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_ohBadge('VAULTS OPEN', 'green')}
  </div>`;

  const hudCells = `
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-cyan)">${vc.tribes.length}</div><div class="oh-hud-lbl">VAULTS</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-gold)">${vc.tribes.reduce((s, v) => s + v.crackers.length, 0)}</div><div class="oh-hud-lbl">CRACKERS</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-green)">${vc.firstTribe?.[0] || '?'}</div><div class="oh-hud-lbl">FIRST</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-cyan)">I</div><div class="oh-hud-lbl">PHASE</div></div>
  `;

  return _ohShell(`
    <div class="oh-hud">${hudCells}</div>
    <div class="oh-layout">
      <div class="oh-feed">${feed}${controls}</div>
      <div class="oh-sidebar" id="oh-sidebar-vault">${buildVaultSidebar(revIdx + 1)}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 2: THE HEIST (5-round gauntlet)
// ══════════════════════════════════════════════════════════════
export function rpBuildOceansHeistHeist(ep) {
  const oh = ep.oceansHeist;
  if (!oh || !oh.heist) return '';
  const heist = oh.heist;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'oh-heist';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const obstacleLabels = {
    laser: { label: 'LASER GRID', icon: '🔴', color: 'var(--heist-red)', badge: 'red', css: 'oh-laser' },
    camera: { label: 'SECURITY CAMERAS', icon: '📹', color: 'var(--heist-cyan)', badge: 'cyan', css: 'oh-camera' },
    alarm: { label: 'ALARM SYSTEM', icon: '🚨', color: 'var(--heist-gold)', badge: 'gold', css: 'oh-alarm-obs' },
  };

  const steps = [];

  // Intro
  steps.push({ type: 'intro', html: `<div class="oh-ev" style="border-left-color:var(--heist-red);padding:14px">
    <div style="font-size:28px">🏦</div>
    <div style="flex:1"><div class="oh-ev-badge red" style="font-size:11px;padding:4px 12px">PHASE II — THE HEIST</div>
    <div class="oh-ev-text" style="font-size:14px;margin-top:6px">${pick(HEIST_HOST.heistIntro)(host())}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px;font-style:italic">5 rounds. Fail an obstacle — you're out for that round. Reach the vault to score loot.</div>
    </div>
  </div>` });

  // Entrance events
  const hasEntrance = heist.tribes.some(ht => ht.entranceEvents?.length);
  if (hasEntrance) {
    let eHtml = `<div class="oh-ev" style="border-left-color:rgba(255,255,255,0.15);padding:12px">
      <div style="flex:1"><div class="oh-ev-badge gray" style="font-size:10px">ENTERING THE BANK</div>`;
    for (const ht of heist.tribes) {
      if (!ht.entranceEvents?.length) continue;
      eHtml += `<div style="margin-top:8px;margin-bottom:4px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--heist-cyan);letter-spacing:1px">${ht.tribe}</div>`;
      for (const evt of ht.entranceEvents) {
        const color = evt.type === 'criminalBonus' ? 'var(--heist-green)' : 'var(--heist-red)';
        const icon = evt.type === 'criminalBonus' ? '😎' : '😰';
        eHtml += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;color:${color}">
          ${_ohPortrait(evt.player, 32)} <span>${icon} ${evt.text}</span>
        </div>`;
      }
    }
    eHtml += `</div></div>`;
    steps.push({ type: 'entrance', html: eHtml });
  }

  // Per-round steps: each round gets one step per obstacle + vault result
  for (const ht of heist.tribes) {
    for (const rd of ht.rounds) {
      const benchedNames = Object.entries(rd.results).filter(([_, r]) => r.benched).map(([n]) => n);
      let rdHtml = `<div class="oh-ev" style="border-left-color:var(--heist-cyan);padding:14px">
        <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div class="oh-ev-badge cyan" style="font-size:11px;padding:4px 12px">ROUND ${rd.round} — ${ht.tribe}${ht.hasEquipment ? ' 🔧' : ''}</div>
        </div>`;

      if (benchedNames.length) {
        rdHtml += `<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;margin-bottom:10px;background:rgba(255,255,255,0.04);border-radius:4px;border:1px dashed rgba(255,255,255,0.1)">
          <span style="font-size:10px;color:rgba(255,255,255,0.3);font-family:'Share Tech Mono',monospace">BENCH</span>
          ${benchedNames.map(n => `<div style="display:flex;align-items:center;gap:3px;opacity:0.4">${_ohPortrait(n, 22)} <span style="font-size:11px">${n.split(' ')[0]}</span></div>`).join('')}
        </div>`;
      }

      // Group events by obstacle type
      for (const obsType of ['laser', 'camera', 'alarm']) {
        const obsInfo = obstacleLabels[obsType];
        const obsEvents = rd.events.filter(e => e.obs === obsType);
        if (!obsEvents.length) continue;
        const extraCss = obsInfo.css ? ` ${obsInfo.css}` : '';
        rdHtml += `<div class="${extraCss}" style="margin-bottom:10px;padding:8px;background:rgba(0,0,0,0.12);border-radius:6px;border-left:3px solid ${obsInfo.color};position:relative;overflow:hidden">
          <div style="font-size:10px;font-family:'Share Tech Mono',monospace;color:${obsInfo.color};margin-bottom:6px;letter-spacing:1px">${obsInfo.icon} ${obsInfo.label}</div>`;
        for (const evt of obsEvents) {
          const passed = evt.type.includes('Dodge') || evt.type.includes('Defuse');
          const failClass = !passed ? (obsType === 'camera' ? ' oh-cam-fail' : obsType === 'alarm' ? ' oh-alarm-fail' : '') : '';
          rdHtml += `<div class="${failClass}" style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:13px;color:${passed ? 'var(--heist-green)' : 'var(--heist-red)'}">
            ${_ohPortrait(evt.player, 26)} <span>${passed ? '✅' : '❌'} ${evt.text}</span>
          </div>`;
        }
        rdHtml += `</div>`;
      }

      // Vault result
      const vaultCount = rd.vaultCrew.length;
      const totalMembers = Object.keys(rd.results).length;
      if (vaultCount > 0) {
        rdHtml += `<div class="oh-vault-loot" style="margin-top:6px;padding:8px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.15);border-radius:6px;position:relative;overflow:hidden">
          <div style="font-size:10px;font-family:'Share Tech Mono',monospace;color:var(--heist-green);margin-bottom:4px;letter-spacing:1px">💰 VAULT REACHED</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">
            ${rd.vaultCrew.map(n => `<div style="display:flex;align-items:center;gap:4px;padding:2px 6px;background:rgba(74,222,128,0.1);border-radius:3px">
              ${_ohPortrait(n, 22)} <span style="font-size:11px;color:var(--heist-green)">${n}</span>
            </div>`).join('')}
          </div>
          <div style="font-size:11px;color:var(--heist-gold)">💰 ${vaultCount}/${totalMembers} reached the vault — $${rd.roundLoot * 100}k scored</div>
        </div>`;
      } else {
        rdHtml += `<div style="margin-top:6px;padding:8px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);border-radius:6px">
          <div style="font-size:11px;color:var(--heist-red)">❌ Nobody reached the vault this round.</div>
        </div>`;
      }
      rdHtml += `</div></div>`;
      steps.push({ type: 'round', tribe: ht.tribe, round: rd.round, html: rdHtml });
    }
  }

  // Final scores
  let scoreHtml = `<div class="oh-ev" style="border-left-color:var(--heist-green);padding:14px">
    <div style="flex:1"><div class="oh-ev-badge green" style="font-size:11px;padding:4px 12px">💼 HEIST COMPLETE</div>`;
  for (const ht of [...heist.tribes].sort((a, b) => b.totalLoot - a.totalLoot)) {
    const maxLoot = Math.max(...heist.tribes.map(h => h.totalLoot));
    const barPct = maxLoot > 0 ? Math.min(100, (ht.totalLoot / maxLoot) * 100) : 0;
    scoreHtml += `<div style="margin:10px 0">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
        <span style="color:var(--heist-cyan);font-family:'Share Tech Mono',monospace">${ht.tribe}${ht.hasEquipment ? ' 🔧' : ''}</span>
        <span style="color:var(--heist-gold)">💰 $${ht.totalLoot * 100}k</span>
      </div>
      <div style="height:8px;background:rgba(0,0,0,0.3);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${barPct}%;background:var(--heist-green);border-radius:4px"></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
        ${Object.entries(ht.memberTotals).sort((a, b) => b[1].loot - a[1].loot).map(([name, mt]) => {
          const played = 5 - mt.benchedRounds;
          return `<div style="display:flex;align-items:center;gap:4px;font-size:10px;padding:2px 5px;background:rgba(0,0,0,0.15);border-radius:3px">
            ${_ohPortrait(name, 18)} <span style="color:var(--heist-gold)">${mt.vaultReaches}/${played}</span>
            <span style="color:rgba(255,255,255,0.3)">$${mt.loot * 100}k</span>
            ${mt.benchedRounds ? `<span style="color:rgba(255,255,255,0.15);font-size:8px">🪑${mt.benchedRounds}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }
  scoreHtml += `</div></div>`;
  steps.push({ type: 'scores', html: scoreHtml });

  const totalSteps = steps.length;

  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    const visible = i <= revIdx;
    feed += `<div id="oh-step-heist-${i}" style="${visible ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="oh-controls-heist" class="oh-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="oh-btn-next" onclick="oceansHeistRevealNext('oh-heist',${totalSteps})">BREACH</button>
    <button class="oh-btn-all" onclick="oceansHeistRevealAll('oh-heist',${totalSteps})">Reveal All</button>
  </div>
  <div id="oh-done-heist" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_ohBadge('HEIST COMPLETE', 'green')}
  </div>`;

  const totalAlarms = heist.tribes.reduce((s, ht) => s + ht.rounds.reduce((rs, rd) => rs + rd.events.filter(e => e.type === 'laserFail' || e.type === 'alarmFail').length, 0), 0);
  const hudCells = `
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-gold)">$${heist.tribes.reduce((s, h) => s + h.totalLoot, 0) * 100}k</div><div class="oh-hud-lbl">TOTAL LOOT</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-red)">${totalAlarms}</div><div class="oh-hud-lbl">ALARMS</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-cyan)">5</div><div class="oh-hud-lbl">ROUNDS</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-cyan)">II</div><div class="oh-hud-lbl">PHASE</div></div>
  `;

  return _ohShell(`
    <div class="oh-hud">${hudCells}</div>
    <div class="oh-layout">
      <div class="oh-feed">${feed}${controls}</div>
      <div class="oh-sidebar" id="oh-sidebar-heist">${_ohBuildHeistSidebarFromData(heist, revIdx + 1)}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 3: GETAWAY
// ══════════════════════════════════════════════════════════════
export function rpBuildOceansHeistGetaway(ep) {
  const oh = ep.oceansHeist;
  if (!oh || !oh.getaway) return '';
  const gw = oh.getaway;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'oh-getaway';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const steps = [];

  // Intro
  steps.push({ type: 'intro', html: `<div class="oh-ev" style="border-left-color:var(--heist-gold);padding:14px">
    <div style="font-size:28px">🏎️</div>
    <div style="flex:1"><div class="oh-ev-badge gold" style="font-size:11px;padding:4px 12px">PHASE III — GETAWAY</div>
    <div class="oh-ev-text" style="font-size:14px;margin-top:6px">${pick(HEIST_HOST.getawayIntro)(host())}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px;font-style:italic">Build a kart. Race it. Escape with the loot.</div>
    </div>
  </div>` });

  // Build phase — per tribe with individual contributions
  for (const gt of gw.tribes) {
    const r = gt.roles;
    const qualPct = Math.round(gt.buildQuality * 100);
    const qualColor = qualPct > 75 ? 'var(--heist-green)' : qualPct > 45 ? 'var(--heist-gold)' : 'var(--heist-red)';
    let bHtml = `<div class="oh-ev oh-build-phase" style="border-left-color:var(--heist-cyan);padding:14px;position:relative;overflow:hidden">
      <div style="flex:1">
      <div class="oh-ev-badge cyan" style="font-size:11px;padding:4px 12px">🔨 BUILD — ${gt.tribe}</div>
      <div style="display:flex;gap:8px;margin:8px 0;font-size:10px;font-family:'Share Tech Mono',monospace;color:rgba(255,255,255,0.4)">
        <span>🏎️ ${r.driver}</span> <span>🗺️ ${r.navigator || '—'}</span> <span>🔧 ${r.mechanic || '—'}</span>
      </div>`;
    for (const evt of gt.buildEvents) {
      const isGood = evt.type.includes('Fail') || evt.type === 'buildArgue' ? false : evt.type !== 'buildSabotage';
      const color = evt.type === 'buildSabotage' ? 'var(--heist-red)' : isGood ? 'var(--heist-green)' : 'var(--heist-gold)';
      bHtml += `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:13px;color:${color}">
        ${_ohPortrait(evt.player, 24)} <span>${evt.icon} ${evt.text}</span>
      </div>`;
    }
    bHtml += `<div style="margin-top:8px">
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
        <span style="color:var(--heist-cyan);font-family:'Share Tech Mono',monospace">BUILD QUALITY</span>
        <span style="color:${qualColor};font-family:'Share Tech Mono',monospace">${qualPct}%${gt.sabotaged ? ` ⚠️ SABOTAGED by ${gt.sabotagedBy}` : ''}</span>
      </div>
      <div style="height:8px;background:rgba(0,0,0,0.3);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${qualPct}%;background:${qualColor};border-radius:4px"></div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;font-style:italic">${gt.summary.icon} ${gt.summary.text}</div>
    </div>
    </div></div>`;
    steps.push({ type: 'build', tribe: gt.tribe, html: bHtml });
  }

  // Race rounds — per round, all tribes together
  for (const rd of gw.raceRounds) {
    let rdHtml = `<div class="oh-ev oh-race-round" style="border-left-color:var(--heist-gold);padding:14px;position:relative;overflow:hidden">
      <div style="flex:1">
      <div class="oh-ev-badge gold" style="font-size:11px;padding:4px 12px">🏁 RACE — ROUND ${rd.num}</div>`;

    for (const trd of rd.tribes) {
      const gt = gw.tribes.find(g => g.tribe === trd.tribe);
      const statusIcon = gt?.crashed ? '💥' : gt?.finished ? '🏁' : '🏎️';
      rdHtml += `<div style="margin:10px 0;padding:8px;background:rgba(0,0,0,0.12);border-radius:6px;border-left:3px solid var(--heist-cyan)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--heist-cyan)">${statusIcon} ${trd.tribe}</span>
          <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--heist-gold)">+${trd.roundGain}% → ${trd.distance}%</span>
        </div>`;
      for (const evt of trd.events) {
        const isBad = ['driverCrash','navWrongTurn','mechFail','tireBlowout','outOfGas','crashNearFinish'].includes(evt.type);
        const isGreat = ['navShortcut','nitroBoost','finish','driverDodge'].includes(evt.type);
        const color = isBad ? 'var(--heist-red)' : isGreat ? 'var(--heist-green)' : 'rgba(255,255,255,0.6)';
        rdHtml += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:12px;color:${color}">
          <span style="font-size:10px;width:20px;text-align:center">${evt.role}</span>
          ${evt.player ? _ohPortrait(evt.player, 22) : ''}
          <span>${evt.icon} ${evt.text}</span>
        </div>`;
      }
      rdHtml += `</div>`;
    }

    // Position bars
    rdHtml += `<div style="margin-top:8px">`;
    for (const pos of rd.positions.sort((a, b) => b.distance - a.distance)) {
      const pct = Math.min(100, pos.distance);
      const barColor = pos.crashed ? 'var(--heist-red)' : pos.finished ? 'var(--heist-green)' : 'var(--heist-gold)';
      const icon = pos.crashed ? '💥' : pos.finished ? '🏁' : '🏎️';
      rdHtml += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
        <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--heist-cyan);width:50px">${pos.tribe}</span>
        <div style="flex:1;height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px"></div>
        </div>
        <span style="font-size:9px">${icon} ${pct}%</span>
      </div>`;
    }
    rdHtml += `</div></div></div>`;
    steps.push({ type: 'round', num: rd.num, html: rdHtml });
  }

  // Final result
  const finalOrder = [...gw.tribes].sort((a, b) => {
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    if (a.finished && b.finished) return (a.finishOrder || 99) - (b.finishOrder || 99);
    if (a.crashed && !b.crashed) return 1;
    if (!a.crashed && b.crashed) return -1;
    return b.distance - a.distance;
  });
  let resultHtml = `<div class="oh-ev" style="border-left-color:var(--heist-green);padding:14px;text-align:center">
    <div style="flex:1"><div class="oh-ev-badge green" style="font-size:12px;padding:4px 14px">🏁 GETAWAY COMPLETE</div>`;
  finalOrder.forEach((g, i) => {
    const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    const status = g.crashed ? '💥 CRASHED' : g.finished ? '🏁 ESCAPED' : `${Math.round(g.distance)}%`;
    const color = i === 0 ? 'var(--heist-green)' : g.crashed ? 'var(--heist-red)' : 'var(--heist-cyan)';
    resultHtml += `<div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:6px 0;font-size:14px">
      <span>${icon}</span>
      <span style="font-family:'Share Tech Mono',monospace;color:${color};letter-spacing:1px">${g.tribe}</span>
      <span style="font-size:11px;color:rgba(255,255,255,0.4)">${status}</span>
    </div>`;
    // Crew role breakdown
    const r = g.roles;
    resultHtml += `<div style="display:flex;gap:6px;justify-content:center;margin-bottom:8px">
      ${[['🏎️', r.driver], ['🗺️', r.navigator], ['🔧', r.mechanic], ...r.crew.map(n => ['💪', n])].filter(([,n]) => n).map(([icon, name]) =>
        `<div style="display:flex;align-items:center;gap:3px;padding:2px 5px;background:rgba(0,0,0,0.15);border-radius:3px">
          ${_ohPortrait(name, 16)}<span style="font-size:9px">${icon}</span>
        </div>`
      ).join('')}
    </div>`;
  });
  resultHtml += `</div></div>`;
  steps.push({ type: 'result', html: resultHtml });

  const totalSteps = steps.length;

  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    const visible = i <= revIdx;
    feed += `<div id="oh-step-getaway-${i}" style="${visible ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="oh-controls-getaway" class="oh-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="oh-btn-next" onclick="oceansHeistRevealNext('oh-getaway',${totalSteps})">FLOOR IT</button>
    <button class="oh-btn-all" onclick="oceansHeistRevealAll('oh-getaway',${totalSteps})">Reveal All</button>
  </div>
  <div id="oh-done-getaway" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_ohBadge('ESCAPE COMPLETE', 'green')}
  </div>`;

  const hudCells = `
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-green)">${gw.tribes.filter(g => g.finished).length}</div><div class="oh-hud-lbl">ESCAPED</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-red)">${gw.tribes.filter(g => g.crashed).length}</div><div class="oh-hud-lbl">CRASHED</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-cyan)">III</div><div class="oh-hud-lbl">PHASE</div></div>
  `;

  return _ohShell(`
    <div class="oh-hud">${hudCells}</div>
    <div class="oh-layout">
      <div class="oh-feed">${feed}${controls}</div>
      <div class="oh-sidebar" id="oh-sidebar-getaway">${_ohBuildGetawaySidebarFromData(gw, revIdx + 1)}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 4: RESULTS
// ══════════════════════════════════════════════════════════════
export function rpBuildOceansHeistResults(ep) {
  const oh = ep.oceansHeist;
  if (!oh) return '';

  const sorted = Object.entries(oh.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerTribe = sorted[0]?.[0];
  const loserTribe = sorted[sorted.length - 1]?.[0];
  const jumpOrder = oh.vaultCrack?.tribes || [];
  const tribeMembers = jumpOrder.map(vt => ({ name: vt.tribe, members: [...vt.crackers, vt.locked] }));

  const scores = ep.chalMemberScores || {};
  const leaderboard = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  let content = '';

  content += `<div style="text-align:center;padding:30px 20px;position:relative;z-index:6;">
    <div style="font-size:10px;letter-spacing:5px;color:rgba(34,211,238,0.4);text-transform:uppercase;margin-bottom:8px;font-family:'Share Tech Mono',monospace">HEIST DEBRIEF</div>
    <div style="font-family:'Black Ops One',sans-serif;font-size:32px;color:var(--heist-cyan);text-shadow:0 0 20px rgba(34,211,238,0.3);letter-spacing:4px;margin-bottom:6px">${winnerTribe}</div>
    <div style="font-family:'Black Ops One',sans-serif;font-size:14px;color:var(--heist-green);letter-spacing:3px;margin-bottom:20px">PULLED OFF THE HEIST</div>
    <div style="font-size:13px;font-style:italic;color:rgba(255,255,255,0.6);max-width:500px;margin:0 auto 20px">${pick(HEIST_HOST.winner)(host(), winnerTribe)}</div>
  </div>`;

  // Tribe scores with crew roles
  content += `<div style="display:flex;gap:14px;justify-content:center;padding:0 14px 20px;flex-wrap:wrap;position:relative;z-index:6">`;
  for (const [tribe, score] of sorted) {
    const isWinner = tribe === winnerTribe;
    const isLoser = tribe === loserTribe;
    const members = tribeMembers.find(t => t.name === tribe)?.members || [];
    const roles = oh.crewRoles[tribe] || {};
    const borderColor = isWinner ? 'var(--heist-green)' : isLoser ? 'var(--heist-red)' : 'rgba(34,211,238,0.15)';
    const status = isWinner ? 'SAFE — IMMUNE' : isLoser ? 'TRIBAL COUNCIL TONIGHT' : 'SAFE';

    content += `<div style="flex:1;min-width:240px;max-width:400px;background:rgba(0,0,0,0.3);border:2px solid ${borderColor};border-radius:6px;padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:'Black Ops One',sans-serif;font-size:14px;color:${isWinner ? 'var(--heist-green)' : isLoser ? 'var(--heist-red)' : 'var(--heist-cyan)'};letter-spacing:2px">${tribe}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:18px;color:${isWinner ? 'var(--heist-green)' : 'var(--heist-cyan)'}">${score.toFixed(1)}</div>
      </div>
      <div style="font-size:8px;letter-spacing:2px;color:${isWinner ? 'var(--heist-green)' : isLoser ? 'var(--heist-red)' : 'rgba(255,255,255,0.4)'}; margin-bottom:8px;font-family:'Share Tech Mono',monospace">${status}</div>`;

    for (const name of members) {
      const role = roles[name] || { role: 'Crew', emoji: '🎭' };
      const memberScore = scores[name] || 0;
      content += `<div style="display:flex;align-items:center;gap:8px;padding:4px 6px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:3px">
        ${_ohPortrait(name, 28)}
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;color:rgba(255,255,255,0.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
          <div style="font-size:8px;color:var(--heist-cyan);font-family:'Share Tech Mono',monospace">${role.emoji} ${role.role}</div>
        </div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--heist-gold)">${memberScore} pts</div>
      </div>`;
    }
    content += `</div>`;
  }
  content += `</div>`;

  // Leaderboard
  if (leaderboard.length > 0) {
    content += `<div style="padding:0 14px 20px;position:relative;z-index:6">
      <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;color:var(--heist-cyan);text-align:center;margin-bottom:12px">HEIST LEADERBOARD</div>
      <div style="max-width:500px;margin:0 auto">`;
    for (let i = 0; i < leaderboard.length; i++) {
      const [name, score] = leaderboard[i];
      const medal = i === 0 ? 'MASTERMIND' : i === 1 ? 'RIGHT HAND' : i === 2 ? 'MVP' : '';
      const medalColor = i === 0 ? 'var(--heist-gold)' : i === 1 ? 'var(--heist-cyan)' : i === 2 ? 'var(--heist-green)' : '';
      content += `<div style="display:flex;align-items:center;gap:10px;padding:5px 8px;margin-bottom:2px;background:rgba(0,0,0,${i < 3 ? 0.25 : 0.12});border-radius:3px;border-left:3px solid ${i < 3 ? medalColor : 'transparent'}">
        <div style="font-family:'Share Tech Mono',monospace;font-size:12px;color:rgba(255,255,255,0.3);width:20px;text-align:center">${i + 1}</div>
        ${_ohSidePortrait(name, 24)}
        <div style="flex:1;font-size:11px;color:rgba(255,255,255,0.8)">${name}</div>
        ${medal ? `<span style="font-size:9px;font-family:'Share Tech Mono',monospace;letter-spacing:1px;color:${medalColor}">${medal}</span>` : ''}
        <div style="font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--heist-gold)">${score}</div>
      </div>`;
    }
    content += `</div></div>`;
  }

  return _ohShell(content, ep);
}

// ══════════════════════════════════════════════════════════════
// REVEAL FUNCTIONS
// ══════════════════════════════════════════════════════════════
function _ohUpdateSidebar(screenKey, revIdx) {
  const suffix = screenKey.replace('oh-', '');
  const sideEl = document.getElementById(`oh-sidebar-${suffix}`);
  if (!sideEl) return;

  const latestEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const oh = latestEp?.oceansHeist;
  if (!oh) return;

  const revCount = revIdx + 1;

  if (suffix === 'vault' && oh.vaultCrack) {
    sideEl.innerHTML = _ohBuildVaultSidebarFromData(oh.vaultCrack, revCount);
  } else if (suffix === 'heist' && oh.heist) {
    sideEl.innerHTML = _ohBuildHeistSidebarFromData(oh.heist, revCount);
  } else if (suffix === 'getaway' && oh.getaway) {
    sideEl.innerHTML = _ohBuildGetawaySidebarFromData(oh.getaway, revCount);
  }
}

function _ohBuildVaultSidebarFromData(vc, revCount) {
  // Figure out which tribes have been revealed by checking step data
  // Steps: intro(1) + per tribe: header + kidnap + reaction + N crackers + crack = variable
  // We need to map revCount to which tribe's crack step has been shown
  // Simpler: use the stored step metadata. Each step has a tribe field.
  // A tribe is "shown" when its 'crack' step has been revealed.
  // Since we don't have step metadata here, count by tribe order:
  // intro=1, then each tribe has (1 header + 1 kidnap + 1 reaction + N crackers + 1 crack + possible slap fights)
  // Approximate: track which tribe index we're in based on revCount

  // Build a step-to-tribe map from the data
  let stepIdx = 1; // skip intro
  const tribeRevealedAt = {}; // tribe name → step index when crack is shown
  const tribeStartAt = {};
  for (const vt of vc.tribes) {
    tribeStartAt[vt.tribe] = stepIdx;
    // header(1) + events count (kidnap, reaction, crackers, slapfights, crack)
    stepIdx += 1 + vt.events.length;
    tribeRevealedAt[vt.tribe] = stepIdx - 1; // crack is last event
  }

  let sb = `<div class="oh-side-sec">VAULT STATUS</div>`;
  for (const vt of vc.tribes) {
    const started = revCount > tribeStartAt[vt.tribe];
    const cracked = revCount > tribeRevealedAt[vt.tribe];
    const reactionIcon = vt.lockedReaction === 'panic' ? '😰' : vt.lockedReaction === 'nap' ? '😴' : '🔧';
    sb += `<div style="padding:6px;margin-bottom:4px;background:rgba(0,0,0,0.15);border-radius:4px;opacity:${started ? 1 : 0.4}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--heist-cyan)">${vt.tribe}</span>
        ${cracked ? '<span style="font-size:10px;color:var(--heist-green)">🔓 OPEN</span>' : started ? '<span style="font-size:10px;color:var(--heist-gold)">🔒 CRACKING...</span>' : ''}
      </div>
      ${started ? `
      <div style="display:flex;align-items:center;gap:6px;padding:4px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.12);border-radius:3px;margin-bottom:4px">
        ${_ohSidePortrait(vt.locked, 22)}
        <div><div style="font-size:10px;color:var(--heist-gold)">🔒 ${vt.locked}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.3)">${reactionIcon} ${vt.lockedReaction}</div></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px">
        ${vt.crackers.map(n => {
          const a = vt.approaches.find(ap => ap.name === n);
          const aIcon = a?.approach === 'lockpick' ? '🔓' : a?.approach === 'bruteForce' ? '💪' : '🗣️';
          return `<div style="display:flex;align-items:center;gap:3px;padding:2px 4px;background:rgba(34,211,238,0.06);border-radius:3px">
            ${_ohSidePortrait(n, 18)}<span style="font-size:9px">${aIcon}</span>
          </div>`;
        }).join('')}
      </div>
      ${cracked ? `<div style="height:5px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100, vt.score * 130)}%;background:var(--heist-green);border-radius:3px"></div>
      </div>
      <div style="font-size:10px;color:var(--heist-green);margin-top:2px;font-family:'Share Tech Mono',monospace">${vt.score.toFixed(2)} pts</div>` :
      `<div style="height:5px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:50%;background:var(--heist-gold);border-radius:3px;animation:oh-pulse 1.5s ease-in-out infinite"></div>
      </div>`}
      ` : '<div style="font-size:10px;color:rgba(255,255,255,0.15)">LOCKED</div>'}
    </div>`;
  }
  sb += `<div class="oh-side-sec">CRACK ORDER</div>`;
  const allCracked = vc.tribes.every(vt => revCount > tribeRevealedAt[vt.tribe]);
  for (let i = 0; i < vc.tribes.length; i++) {
    const shown = allCracked;
    sb += `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:${shown ? 'var(--heist-green)' : 'rgba(255,255,255,0.15)'};padding:3px 0;font-family:'Share Tech Mono',monospace">
      <span style="width:16px;text-align:center;font-weight:700">${i + 1}</span>
      <span>${shown ? vc.tribes[i].tribe : '???'}</span>${i === 0 && shown ? ' 🏆' : ''}
    </div>`;
  }
  return sb;
}

function _ohBuildHeistSidebarFromData(heist, revCount) {
  const latestEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const crewRoles = latestEp?.oceansHeist?.crewRoles || {};

  // Map revCount to which round steps have been revealed
  // Steps: intro(1) + optional entrance(1) + N round steps + scores(1)
  const hasEntrance = heist.tribes.some(ht => ht.entranceEvents?.length);
  const roundOffset = 1 + (hasEntrance ? 1 : 0);
  const totalRoundSteps = heist.tribes.reduce((s, ht) => s + ht.rounds.length, 0);

  // Build ordered list of (tribe, round) matching step order
  const roundStepMap = [];
  for (const ht of heist.tribes) {
    for (const rd of ht.rounds) {
      roundStepMap.push({ tribe: ht.tribe, round: rd.round });
    }
  }
  const roundsRevealed = Math.max(0, Math.min(totalRoundSteps, revCount - roundOffset));
  const scoresRevealed = revCount > roundOffset + totalRoundSteps;

  // Track revealed rounds per tribe
  const tribeRoundsRevealed = {};
  for (const ht of heist.tribes) tribeRoundsRevealed[ht.tribe] = 0;
  for (let i = 0; i < roundsRevealed; i++) {
    tribeRoundsRevealed[roundStepMap[i].tribe]++;
  }

  let sb = `<div class="oh-side-sec">HEIST STATUS</div>`;

  // Round progress dots
  sb += `<div style="display:flex;gap:3px;margin-bottom:8px;justify-content:center">`;
  for (let r = 1; r <= 5; r++) {
    const anyRevealed = heist.tribes.some(ht => tribeRoundsRevealed[ht.tribe] >= r);
    sb += `<div style="width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-family:'Share Tech Mono',monospace;background:${anyRevealed ? 'var(--heist-cyan)' : 'rgba(0,0,0,0.3)'};color:${anyRevealed ? '#000' : 'rgba(255,255,255,0.2)'}">${r}</div>`;
  }
  sb += `</div>`;

  for (const ht of heist.tribes) {
    const roles = crewRoles[ht.tribe] || {};
    const members = Object.keys(ht.memberTotals || {});
    const revRounds = tribeRoundsRevealed[ht.tribe];
    const started = revRounds > 0;

    // Calculate revealed loot and benched rounds so far
    let revealedLoot = 0;
    const revealedVaultReaches = {};
    const revealedBenched = {};
    members.forEach(n => { revealedVaultReaches[n] = 0; revealedBenched[n] = 0; });
    for (let r = 0; r < revRounds; r++) {
      const rd = ht.rounds[r];
      revealedLoot += rd.roundLoot;
      for (const n of rd.vaultCrew) revealedVaultReaches[n]++;
      for (const [n, res] of Object.entries(rd.results)) {
        if (res.benched) revealedBenched[n]++;
      }
    }

    sb += `<div style="padding:6px;margin-bottom:4px;background:rgba(0,0,0,0.15);border-radius:4px;opacity:${started || revCount > 0 ? 1 : 0.4}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div style="font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--heist-cyan)">${ht.tribe}</div>
        ${ht.hasEquipment ? '<span style="font-size:8px;color:var(--heist-green)">🔧 EQUIPPED</span>' : ''}
      </div>`;

    // Members with vault reach count
    sb += `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px">
      ${members.map(n => {
        const r = roles[n] || { emoji: '🎭' };
        const reaches = revealedVaultReaches[n];
        const played = revRounds - revealedBenched[n];
        const isBenched = played < revRounds;
        const color = played === 0 ? 'rgba(255,255,255,0.2)' : reaches >= played ? 'var(--heist-green)' : reaches >= played * 0.5 ? 'var(--heist-gold)' : reaches > 0 ? 'rgba(255,255,255,0.5)' : 'var(--heist-red)';
        return `<div style="display:flex;align-items:center;gap:3px;padding:2px 4px;background:rgba(0,0,0,0.15);border-radius:3px" title="${n}: ${reaches}/${played} vaults${isBenched ? `, benched ${revealedBenched[n]}` : ''}">
          ${_ohSidePortrait(n, 18)}<span style="font-size:9px">${r.emoji}</span>${started ? `<span style="font-size:9px;color:${color}">${reaches}/${played}</span>${isBenched ? '<span style="font-size:7px;color:rgba(255,255,255,0.15)">🪑</span>' : ''}` : ''}
        </div>`;
      }).join('')}
    </div>`;

    // Loot running total
    if (started) {
      sb += `<div style="display:flex;justify-content:space-between;font-size:9px;margin-top:2px">
        <span style="color:var(--heist-gold)">💰 $${revealedLoot * 100}k</span>
        <span style="color:rgba(255,255,255,0.3)">Rd ${revRounds}/5</span>
      </div>`;
    } else {
      sb += `<div style="font-size:9px;color:rgba(255,255,255,0.15)">AWAITING ENTRY</div>`;
    }

    sb += `</div>`;
  }
  return sb;
}

function _ohBuildGetawaySidebarFromData(gw, revCount) {
  // Step layout: intro(1) + builds(N tribes) + race rounds(5) + result(1)
  const tribeCount = gw.tribes.length;
  const buildOffset = 1;
  const raceOffset = buildOffset + tribeCount;
  const buildsRevealed = Math.max(0, Math.min(tribeCount, revCount - buildOffset));
  const racesRevealed = Math.max(0, Math.min(gw.raceRounds.length, revCount - raceOffset));
  const started = revCount > 0;

  let sb = '';

  // Crew roles (show after first build revealed)
  if (buildsRevealed > 0) {
    sb += `<div class="oh-side-sec">CREW</div>`;
    for (const gt of gw.tribes) {
      const r = gt.roles;
      sb += `<div style="padding:4px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:3px">
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--heist-cyan);margin-bottom:3px">${gt.tribe}</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px">
          ${[['🏎️', r.driver], ['🗺️', r.navigator], ['🔧', r.mechanic], ...r.crew.map(n => ['💪', n])].filter(([,n]) => n).map(([icon, name]) =>
            `<div style="display:flex;align-items:center;gap:2px;padding:1px 3px;background:rgba(0,0,0,0.15);border-radius:2px">
              ${_ohSidePortrait(name, 16)}<span style="font-size:9px">${icon}</span>
            </div>`
          ).join('')}
        </div>
      </div>`;
    }
  }

  // Build quality (show as builds are revealed)
  if (buildsRevealed > 0) {
    sb += `<div class="oh-side-sec">BUILD QUALITY</div>`;
    for (let i = 0; i < tribeCount; i++) {
      const gt = gw.tribes[i];
      const shown = i < buildsRevealed;
      const qualPct = Math.round(gt.buildQuality * 100);
      const qualColor = qualPct > 75 ? 'var(--heist-green)' : qualPct > 45 ? 'var(--heist-gold)' : 'var(--heist-red)';
      sb += `<div style="display:flex;align-items:center;gap:4px;padding:2px 0">
        <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(255,255,255,0.4);width:45px">${gt.tribe}</span>
        ${shown ? `<div style="flex:1;height:4px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${qualPct}%;background:${qualColor};border-radius:2px"></div>
        </div>
        <span style="font-family:'Share Tech Mono',monospace;font-size:8px;color:${qualColor}">${qualPct}%</span>` :
        `<span style="font-size:8px;color:rgba(255,255,255,0.15)">???</span>`}
      </div>`;
    }
  }

  // Race positions (update live with each race round)
  sb += `<div class="oh-side-sec">RACE POSITIONS</div>`;
  const latestRound = racesRevealed > 0 ? gw.raceRounds[racesRevealed - 1] : null;
  const positions = latestRound ? [...latestRound.positions].sort((a, b) => b.distance - a.distance) : gw.tribes.map(g => ({ tribe: g.tribe, distance: 0 }));
  for (const pos of positions) {
    const gt = gw.tribes.find(g => g.tribe === pos.tribe);
    const pct = Math.min(100, pos.distance);
    const statusIcon = pos.crashed ? '💥' : pos.finished ? '🏁' : gt?.outOfGas ? '⛽' : '🏎️';
    const barColor = pos.crashed ? 'var(--heist-red)' : pos.finished ? 'var(--heist-green)' : 'var(--heist-gold)';
    sb += `<div style="padding:4px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:3px">
      <div style="display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:10px;margin-bottom:2px">
        <span style="color:var(--heist-cyan)">${pos.tribe}</span>
        <span style="color:${barColor}">${statusIcon} ${pct}%</span>
      </div>
      <div style="height:5px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px"></div>
      </div>
    </div>`;
  }

  if (racesRevealed > 0) {
    sb += `<div style="font-size:8px;color:rgba(255,255,255,0.2);text-align:center;margin-top:4px;font-family:'Share Tech Mono',monospace">ROUND ${racesRevealed}/5</div>`;
  }

  return sb;
}

export function oceansHeistRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('oh-', '');
  const el = document.getElementById(`oh-step-${suffix}-${state.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`oh-controls-${suffix}`);
    const done = document.getElementById(`oh-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _ohUpdateSidebar(screenKey, state.idx);
}

export function oceansHeistRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('oh-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`oh-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`oh-controls-${suffix}`);
  const done = document.getElementById(`oh-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  _ohUpdateSidebar(screenKey, state.idx);
}
