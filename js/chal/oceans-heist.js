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
    (h) => `"Phase one: your teammate is locked in a vault. Get them out." ${h} tossed a lockpick set on the ground.`,
    (h) => `"Someone from each team is trapped. Clock's ticking." ${h} checked his watch dramatically.`,
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
    (p, pr) => `${p} worked the tumblers methodically. "Almost... almost..."`,
    (p, pr) => `${p} pressed ${pr.posAdj} ear to the vault door, listening for the pins.`,
  ],
  bruteForce: [
    (p, pr) => `${p} SLAMMED ${pr.posAdj} shoulder into the vault door. The hinges groaned.`,
    (p, pr) => `${p} gripped the handle and pulled with everything ${pr.sub} had.`,
    (p, pr) => `"STAND BACK!" ${p} charged the door like a battering ram.`,
  ],
  socialEng: [
    (p, pr) => `${p} studied the keypad. "If I were ${host()}, what would my code be..."`,
    (p, pr) => `"${host()}'s birthday... no. ${host()}'s hair gel brand number..." ${p} kept guessing.`,
    (p, pr) => `${p} sweet-talked the electronic panel. "Come on, baby. Open up for me."`,
  ],
  slapFight: [
    (a, b) => `${a} and ${b} got into a slap fight over who should crack the vault!`,
    (a, b) => `"Let ME do it!" ${a} shoved ${b} aside. ${b} shoved back.`,
  ],
  panicInVault: [
    (p, pr) => `Inside the vault, ${p} was panicking. "GET ME OUT! I CAN'T BREATHE!"`,
    (p, pr) => `${p} banged on the vault door from inside. "HELLO?! ANYBODY?!"`,
  ],
  napInVault: [
    (p, pr) => `Inside the vault, ${p} had found a comfortable spot and fallen asleep.`,
    (p, pr) => `${p} yawned and stretched out in the vault. "Wake me when they figure it out."`,
  ],
  workInside: [
    (p, pr) => `${p} found the emergency release panel inside and started working on it.`,
    (p, pr) => `From inside, ${p} was calling out numbers: "Try 7... 3... no wait, 4!"`,
  ],
  cracked: [
    (tribe) => `CLICK. The ${tribe} vault swung open!`,
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
  goodBuild: [
    (tribe) => `${tribe}'s kart was a thing of beauty — sleek, fast, and surprisingly sturdy.`,
  ],
  badBuild: [
    (tribe) => `${tribe}'s kart looked like it was held together with hope and duct tape.`,
  ],
  propObstacle: [
    (p, pr) => `A fake log truck rolled across the road! ${p} swerved hard!`,
    (p, pr) => `A police roadblock prop appeared! ${p} plowed straight through it — it was cardboard!`,
    (p, pr) => `A spaceship backdrop fell across the track! ${p} barely dodged it.`,
  ],
  propCrash: [
    (p, pr) => `${p} smashed right into a movie prop! Pieces flew everywhere.`,
  ],
  breakdown: [
    (tribe) => `${tribe}'s kart sputtered and a wheel wobbled dangerously.`,
    (tribe) => `Something fell off ${tribe}'s kart. "Was that important?" "KEEP DRIVING!"`,
  ],
  outOfGas: [
    (tribe) => `${tribe}'s kart ran out of gas! They had to push it the last stretch!`,
  ],
  crashNearFinish: [
    (tribe) => `${tribe} was in the lead but their kart FLIPPED near the finish line!`,
  ],
  sabotage: [
    (a, b) => `Someone from ${a} tossed a wrench at ${b}'s kart!`,
  ],
  finishStrong: [
    (tribe) => `${tribe} rocketed across the finish line!`,
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
  // Vault: first=+10, second=+5, third=+2
  const vaultOrder = result.vaultCrack.tribes.sort((a, b) => b.score - a.score);
  const vaultBonuses = [10, 5, 2];
  vaultOrder.forEach((vt, i) => {
    result.tribeScores[vt.tribe] = (result.tribeScores[vt.tribe] || 0) + (vaultBonuses[i] || 1);
  });

  // Heist: averaged per member × 30
  for (const ht of result.heist.tribes) {
    const memberCount = tribeMembers.find(t => t.name === ht.tribe)?.members.length || 1;
    result.tribeScores[ht.tribe] = (result.tribeScores[ht.tribe] || 0) + (ht.score / memberCount) * 30;
  }

  // Getaway: race position bonus
  const getawayOrder = result.getaway.tribes.sort((a, b) => b.distance - a.distance);
  const getawayBonuses = [15, 8, 3];
  getawayOrder.forEach((gt, i) => {
    result.tribeScores[gt.tribe] = (result.tribeScores[gt.tribe] || 0) + (getawayBonuses[i] || 1);
  });

  // Add averaged combat scores
  for (const tribe of tribeMembers) {
    const sum = tribe.members.reduce((s, n) => s + (ep.chalMemberScores[n] || 0), 0);
    result.tribeScores[tribe.name] = (result.tribeScores[tribe.name] || 0) + (sum / tribe.members.length);
  }

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
    vaultOrder: vaultOrder.map(v => v.tribe),
    getawayOrder: getawayOrder.map(g => g.tribe),
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

    // Locked teammate reaction
    const ls = pStats(locked);
    const lpr = pronouns(locked);
    let lockedBonus = 0;
    let lockedReaction = 'neutral';
    if (ls.boldness < 4) {
      lockedReaction = 'panic';
      lockedBonus = -0.1;
      events.push({ type: 'panicInVault', player: locked, text: pick(VAULT_EVENTS.panicInVault)(locked, lpr) });
    } else if (ls.temperament > 6) {
      lockedReaction = 'nap';
      lockedBonus = 0;
      events.push({ type: 'napInVault', player: locked, text: pick(VAULT_EVENTS.napInVault)(locked, lpr) });
    } else if (ls.mental >= 6) {
      lockedReaction = 'workInside';
      lockedBonus = 0.1;
      events.push({ type: 'workInside', player: locked, text: pick(VAULT_EVENTS.workInside)(locked, lpr) });
      ep.chalMemberScores[locked] = (ep.chalMemberScores[locked] || 0) + 3;
    }

    // Each cracker picks best approach
    const approaches = [];
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
      events.push({ type, player: name, text: pick(VAULT_EVENTS[type])(name, pr) });
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

    totalScore += lockedBonus;
    events.push({ type: 'cracked', tribe: tribe.name, text: pick(VAULT_EVENTS.cracked)(tribe.name) });

    result.vaultCrack.tribes.push({
      tribe: tribe.name, locked, lockedReaction, crackers,
      approaches, score: totalScore, events,
    });
  }

  // Sort by score = crack order
  result.vaultCrack.tribes.sort((a, b) => b.score - a.score);
  result.vaultCrack.firstTribe = result.vaultCrack.tribes[0]?.tribe;
}

// ══════════════════════════════════════════════════════════════
// PHASE 2: THE HEIST
// ══════════════════════════════════════════════════════════════
function _simulateHeist(ep, tribeMembers, result) {
  const equipmentTribe = result.vaultCrack.firstTribe;

  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const hasEquipment = tribe.name === equipmentTribe;
    const events = [];
    let totalScore = 0;
    const memberResults = {};

    for (const name of members) {
      const s = pStats(name);
      const pr = pronouns(name);
      const isVillain = isVillainArch(name);
      const isNice = isNiceArch(name);
      const equipBonus = hasEquipment ? 0.05 : 0;
      const criminalBonus = isVillain ? 0.03 : 0;
      let memberScore = 0;
      const obstacles = [];

      // Criminal bonus event
      if (isVillain && Math.random() < 0.4) {
        events.push({ type: 'criminalBonus', player: name, text: pick(HEIST_EVENTS.criminalBonus)(name, pr) });
      }

      // Hesitation for nice archetypes
      if (isNice && Math.random() < 0.3) {
        events.push({ type: 'hesitation', player: name, text: pick(HEIST_EVENTS.hesitation)(name, pr) });
      }

      // 1. Laser Grid
      const laserCheck = s.physical * 0.04 + s.boldness * 0.03 + equipBonus + criminalBonus + noise(0.2);
      const laserPass = laserCheck > 0.4 - (isNice ? 0.02 : 0);
      obstacles.push({ type: 'laser', passed: laserPass, score: laserCheck });
      if (laserPass) {
        events.push({ type: 'laserDodge', player: name, text: pick(HEIST_EVENTS.laserDodge)(name, pr) });
        memberScore += 2;
      } else {
        events.push({ type: 'laserFail', player: name, text: pick(HEIST_EVENTS.laserFail)(name, pr) });
      }

      // 2. Security Camera
      const cameraCheck = s.intuition * 0.05 + s.strategic * 0.03 + equipBonus + criminalBonus + noise(0.2);
      const cameraPass = cameraCheck > 0.38;
      obstacles.push({ type: 'camera', passed: cameraPass, score: cameraCheck });
      if (cameraPass) {
        events.push({ type: 'cameraDodge', player: name, text: pick(HEIST_EVENTS.cameraDodge)(name, pr) });
        memberScore += 2;
      } else {
        events.push({ type: 'cameraFail', player: name, text: pick(HEIST_EVENTS.cameraFail)(name, pr) });
      }

      // 3. Alarm Wire
      const alarmCheck = s.mental * 0.05 + s.strategic * 0.04 + equipBonus + criminalBonus + noise(0.2);
      const alarmPass = alarmCheck > 0.42;
      obstacles.push({ type: 'alarm', passed: alarmPass, score: alarmCheck });
      if (alarmPass) {
        events.push({ type: 'alarmDefuse', player: name, text: pick(HEIST_EVENTS.alarmDefuse)(name, pr) });
        memberScore += 2;
      } else {
        events.push({ type: 'alarmFail', player: name, text: pick(HEIST_EVENTS.alarmFail)(name, pr) });
      }

      // 4. Loot Grab — greed vs speed
      const greedCheck = s.boldness * 0.04 - s.temperament * 0.03 + noise(0.15);
      const isGreedy = greedCheck > 0.1;
      const lootAmount = isGreedy ? 3 : 2;
      const lootPenalty = isGreedy ? -0.05 : 0; // slower escape
      obstacles.push({ type: 'loot', greedy: isGreedy, amount: lootAmount });
      if (isGreedy) {
        events.push({ type: 'lootGreed', player: name, text: pick(HEIST_EVENTS.lootGreed)(name, pr) });
      } else {
        events.push({ type: 'lootGrab', player: name, text: pick(HEIST_EVENTS.lootGrab)(name, pr) });
      }
      memberScore += lootAmount;

      memberResults[name] = { obstacles, score: memberScore, greedy: isGreedy };
      totalScore += memberScore;
      ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + memberScore;
    }

    // Vault door — collective push
    const pushScore = members.reduce((s, n) => s + pStats(n).physical * 0.03 + pStats(n).endurance * 0.02, 0) / members.length + (hasEquipment ? 0.05 : 0) + noise(0.1);
    const vaultOpen = pushScore > 0.3;
    if (vaultOpen) {
      events.push({ type: 'vaultPush', tribe: tribe.name, text: pick(HEIST_EVENTS.vaultPush)(tribe.name) });
      totalScore += 3;
    } else {
      events.push({ type: 'vaultStuck', tribe: tribe.name, text: pick(HEIST_EVENTS.vaultStuck)(tribe.name) });
    }

    result.heist.tribes.push({
      tribe: tribe.name, score: totalScore, memberResults, events,
      hasEquipment, vaultOpen,
      totalLoot: Object.values(memberResults).reduce((s, r) => s + (r.greedy ? 3 : 2), 0),
    });
  }
}

// ══════════════════════════════════════════════════════════════
// PHASE 3: GETAWAY
// ══════════════════════════════════════════════════════════════
function _simulateGetaway(ep, tribeMembers, result) {
  // Build phase
  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const buildScore = members.reduce((s, n) => {
      const st = pStats(n);
      return s + st.mental * 0.04 + st.physical * 0.03 + noise(0.1);
    }, 0) / members.length;
    const buildQuality = Math.min(1, Math.max(0.15, buildScore));
    const events = [];

    if (buildQuality > 0.5) {
      events.push({ type: 'goodBuild', tribe: tribe.name, text: pick(GETAWAY_EVENTS.goodBuild)(tribe.name) });
    } else {
      events.push({ type: 'badBuild', tribe: tribe.name, text: pick(GETAWAY_EVENTS.badBuild)(tribe.name) });
    }

    result.getaway.tribes.push({
      tribe: tribe.name, buildQuality, distance: 0, events,
      members: [...members], finished: false, crashed: false, outOfGas: false,
    });
  }

  // Race — 5 rounds
  const raceRounds = [];
  for (let round = 1; round <= 5; round++) {
    const roundEvents = [];

    for (const gt of result.getaway.tribes) {
      if (gt.finished || gt.crashed) continue;

      const tribe = tribeMembers.find(t => t.name === gt.tribe);
      const driver = tribe.members[0]; // first member drives
      const ds = pStats(driver);
      const dpr = pronouns(driver);
      const speed = gt.buildQuality * 0.5 + ds.physical * 0.03 + ds.endurance * 0.02 + noise(0.1);
      let roundDistance = speed * 20;

      // Prop obstacle (30% chance)
      if (Math.random() < 0.3) {
        const dodgeCheck = ds.intuition * 0.04 + ds.boldness * 0.03 + noise(0.15);
        if (dodgeCheck > 0.35) {
          roundEvents.push({ type: 'propObstacle', tribe: gt.tribe, player: driver,
            text: pick(GETAWAY_EVENTS.propObstacle)(driver, dpr) });
        } else {
          roundEvents.push({ type: 'propCrash', tribe: gt.tribe, player: driver,
            text: pick(GETAWAY_EVENTS.propCrash)(driver, dpr) });
          roundDistance *= 0.5;
          ep.chalMemberScores[driver] = (ep.chalMemberScores[driver] || 0) - 1;
        }
      }

      // Breakdown (higher chance with low build quality)
      if (Math.random() < (1 - gt.buildQuality) * 0.4) {
        roundEvents.push({ type: 'breakdown', tribe: gt.tribe,
          text: pick(GETAWAY_EVENTS.breakdown)(gt.tribe) });
        roundDistance *= 0.6;
      }

      // Out of gas (round 4-5, endurance check)
      if (round >= 4 && Math.random() < 0.2 - ds.endurance * 0.015) {
        gt.outOfGas = true;
        roundEvents.push({ type: 'outOfGas', tribe: gt.tribe,
          text: pick(GETAWAY_EVENTS.outOfGas)(gt.tribe) });
        roundDistance *= 0.3;
      }

      // Sabotage between karts (15% chance, villain/schemer only)
      if (Math.random() < 0.15) {
        const schemer = tribe.members.find(n => isVillainArch(n));
        if (schemer) {
          const otherTribe = result.getaway.tribes.find(g => g.tribe !== gt.tribe && !g.crashed);
          if (otherTribe) {
            roundEvents.push({ type: 'sabotage', tribe: gt.tribe, target: otherTribe.tribe,
              text: pick(GETAWAY_EVENTS.sabotage)(gt.tribe, otherTribe.tribe) });
            otherTribe.distance -= 3;
            addHeistHeat(ep, schemer, 1.5);
          }
        }
      }

      gt.distance += roundDistance;

      // Crash near finish (leading team, round 4-5, 15% chance — the Grips moment)
      if (round >= 4 && gt.distance >= 80) {
        const isLeading = result.getaway.tribes.every(g => g.tribe === gt.tribe || g.distance <= gt.distance);
        if (isLeading && Math.random() < 0.15) {
          gt.crashed = true;
          gt.distance -= 15;
          roundEvents.push({ type: 'crashNearFinish', tribe: gt.tribe,
            text: pick(GETAWAY_EVENTS.crashNearFinish)(gt.tribe) });
        }
      }

      if (gt.distance >= 100) {
        gt.finished = true;
        gt.distance = 100;
        roundEvents.push({ type: 'finishStrong', tribe: gt.tribe,
          text: pick(GETAWAY_EVENTS.finishStrong)(gt.tribe) });
        // Driver gets points
        ep.chalMemberScores[driver] = (ep.chalMemberScores[driver] || 0) + 4;
      }
    }

    raceRounds.push({ num: round, events: roundEvents,
      positions: result.getaway.tribes.map(g => ({ tribe: g.tribe, distance: Math.round(g.distance) })),
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
  ln('── PHASE 2: THE HEIST ──');
  for (const ht of oh.heist.tribes) {
    ln(`${ht.tribe}${ht.hasEquipment ? ' (has equipment)' : ''}: Score ${ht.score}, Loot $${ht.totalLoot * 100}k`);
    for (const e of ht.events) ln(`  ${e.text || ''}`);
  }
  ln('');

  // Getaway
  ln('── PHASE 3: GETAWAY ──');
  for (const gt of oh.getaway.tribes) {
    ln(`${gt.tribe}: Build ${(gt.buildQuality * 100).toFixed(0)}% | Distance ${Math.round(gt.distance)} | ${gt.crashed ? 'CRASHED' : gt.finished ? 'FINISHED' : 'DNF'}`);
  }
  for (const rd of oh.getaway.raceRounds) {
    ln(`  Round ${rd.num}:`);
    for (const e of rd.events) ln(`    ${e.text || ''}`);
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
        <div style="font-size:7px;color:var(--heist-gold);font-family:'Share Tech Mono',monospace">${r.emoji} ${r.role}</div>
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
.oh-hud-lbl{font-size:7px;letter-spacing:2px;color:rgba(34,211,238,0.4);text-transform:uppercase;margin-top:2px;font-family:'Share Tech Mono',monospace}

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
.oh-side-sec{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;
  color:var(--heist-cyan);text-transform:uppercase;padding:6px 0 4px;
  border-bottom:1px solid rgba(34,211,238,0.1);margin-top:8px}
.oh-side-sec:first-child{margin-top:0}

/* Laser grid */
.oh-laser{position:relative}
.oh-laser::before{content:'';position:absolute;top:20%;left:0;right:0;height:1px;
  background:var(--heist-red);box-shadow:0 0 6px var(--heist-red),0 0 12px rgba(239,68,68,0.3);opacity:0.4}
.oh-laser::after{content:'';position:absolute;top:60%;left:0;right:0;height:1px;
  background:var(--heist-red);box-shadow:0 0 6px var(--heist-red),0 0 12px rgba(239,68,68,0.3);opacity:0.3}

/* Alarm flash */
.oh-alarm{animation:oh-alarm-flash 0.6s ease-out}

/* Animations */
@keyframes oh-scanline{0%{background-position:0 0}100%{background-position:0 200px}}
@keyframes oh-blink{0%,100%{opacity:1}50%{opacity:0.2}}
@keyframes oh-alarm-flash{0%{box-shadow:inset 0 0 0 rgba(239,68,68,0)}30%{box-shadow:inset 0 0 30px rgba(239,68,68,0.3)}100%{box-shadow:inset 0 0 0 rgba(239,68,68,0)}}
@keyframes oh-fade-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes oh-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes oh-vault-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}

/* Reduced motion */
@media(prefers-reduced-motion:reduce){
  .oh-shell::after,.oh-rec,.oh-alarm{animation:none!important}
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
  steps.push({ type: 'intro', html: `<div class="oh-ev" style="border-left-color:var(--heist-cyan)">
    <div style="font-size:22px">🏦</div>
    <div style="flex:1"><div class="oh-ev-badge cyan">PHASE I — VAULT CRACK</div>
    <div class="oh-ev-text">${pick(HEIST_HOST.vaultIntro)(host())}</div></div>
  </div>` });

  // Per-tribe vault crack
  for (const vt of vc.tribes) {
    // Locked member card
    const lpr = pronouns(vt.locked);
    const reactionIcon = vt.lockedReaction === 'panic' ? '😰' : vt.lockedReaction === 'nap' ? '😴' : '🔧';
    const reactionText = vt.lockedReaction === 'panic' ? 'PANICKING' : vt.lockedReaction === 'nap' ? 'NAPPING' : 'WORKING FROM INSIDE';

    let tribeHtml = `<div class="oh-ev" style="border-left-color:var(--heist-gold)">
      <div style="flex:1">
        <div class="oh-ev-badge gold">${vt.tribe} — VAULT CRACK</div>
        <div style="display:flex;align-items:center;gap:8px;margin:6px 0;padding:6px;background:rgba(0,0,0,0.2);border-radius:4px;border:1px solid rgba(251,191,36,0.15)">
          ${_ohPortrait(vt.locked, 32)}
          <div>
            <div style="font-size:10px;color:var(--heist-gold);font-family:'Share Tech Mono',monospace">${reactionIcon} ${vt.locked} — LOCKED IN VAULT</div>
            <div style="font-size:8px;color:rgba(255,255,255,0.4)">${reactionText}</div>
          </div>
        </div>`;

    // Crackers and their approaches
    tribeHtml += `<div style="margin:6px 0;font-size:8px;color:rgba(34,211,238,0.5);letter-spacing:1px">CRACK TEAM:</div>`;
    for (const a of vt.approaches) {
      const aIcon = a.approach === 'lockpick' ? '🔓' : a.approach === 'bruteForce' ? '💪' : '🗣️';
      const aLabel = a.approach === 'lockpick' ? 'LOCKPICK' : a.approach === 'bruteForce' ? 'BRUTE FORCE' : 'SOCIAL ENG';
      tribeHtml += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px">
        ${_ohSidePortrait(a.name, 20)}
        <span style="color:rgba(255,255,255,0.7)">${a.name}</span>
        <span style="font-family:'Share Tech Mono',monospace;font-size:8px;color:var(--heist-cyan)">${aIcon} ${aLabel}</span>
        <span style="font-family:'Share Tech Mono',monospace;font-size:8px;color:rgba(255,255,255,0.3)">${a.score.toFixed(2)}</span>
      </div>`;
    }

    // Events
    for (const evt of vt.events) {
      if (evt.type === 'cracked') {
        tribeHtml += `<div style="margin-top:6px;padding:4px 8px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:3px;font-size:11px;color:var(--heist-green)">🔓 ${evt.text}</div>`;
      } else {
        const evtColor = evt.type === 'slapFight' ? 'var(--heist-red)' : evt.type === 'panicInVault' ? 'var(--heist-gold)' : 'rgba(255,255,255,0.6)';
        tribeHtml += `<div style="font-size:10px;color:${evtColor};margin:3px 0;padding-left:8px;border-left:1px solid ${evtColor}">${evt.text}</div>`;
      }
    }

    tribeHtml += `<div style="margin-top:4px;font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(34,211,238,0.4)">TOTAL: ${vt.score.toFixed(2)}</div>`;
    tribeHtml += `</div></div>`;
    steps.push({ type: 'tribe-vault', tribe: vt.tribe, html: tribeHtml });
  }

  // Result
  steps.push({ type: 'result', html: `<div class="oh-ev" style="border-left-color:var(--heist-green);text-align:center">
    <div style="flex:1"><div class="oh-ev-badge green">VAULT CRACKED</div>
    <div class="oh-ev-text" style="font-size:14px;color:var(--heist-green);font-family:'Share Tech Mono',monospace">${vc.firstTribe} cracks first — gets the equipment!</div></div>
  </div>` });

  const totalSteps = steps.length;

  // Sidebar
  function buildVaultSidebar(revCount) {
    let sb = `<div class="oh-side-sec">VAULT STATUS</div>`;
    for (const vt of vc.tribes) {
      const idx = vc.tribes.indexOf(vt) + 1;
      const shown = idx < revCount;
      sb += `<div style="padding:5px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:3px;opacity:${shown ? 1 : 0.4}">
        <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--heist-cyan)">${vt.tribe}</div>
        ${shown ? `<div style="font-size:8px;color:rgba(255,255,255,0.4);margin-top:2px">🔒 ${vt.locked} locked</div>
        <div style="font-size:8px;color:rgba(255,255,255,0.3)">${vt.crackers.length} crackers</div>
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
// VP SCREEN 2: THE HEIST
// ══════════════════════════════════════════════════════════════
export function rpBuildOceansHeistHeist(ep) {
  const oh = ep.oceansHeist;
  if (!oh || !oh.heist) return '';
  const heist = oh.heist;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'oh-heist';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const steps = [];

  steps.push({ type: 'intro', html: `<div class="oh-ev" style="border-left-color:var(--heist-red)">
    <div style="font-size:22px">🏦</div>
    <div style="flex:1"><div class="oh-ev-badge red">PHASE II — THE HEIST</div>
    <div class="oh-ev-text">${pick(HEIST_HOST.heistIntro)(host())}</div></div>
  </div>` });

  for (const ht of heist.tribes) {
    let tribeHtml = `<div class="oh-ev oh-laser" style="border-left-color:var(--heist-red)">
      <div style="flex:1">
        <div class="oh-ev-badge ${ht.hasEquipment ? 'green' : 'gray'}">${ht.tribe} ${ht.hasEquipment ? '— HAS EQUIPMENT 🔧' : ''}</div>`;

    for (const evt of ht.events) {
      const isPass = ['laserDodge', 'cameraDodge', 'alarmDefuse', 'vaultPush', 'lootGrab', 'criminalBonus'].includes(evt.type);
      const isFail = ['laserFail', 'cameraFail', 'alarmFail', 'vaultStuck', 'hesitation'].includes(evt.type);
      const isGreed = evt.type === 'lootGreed';
      const icon = isPass ? '✅' : isFail ? '❌' : isGreed ? '💰' : '📋';
      const color = isPass ? 'var(--heist-green)' : isFail ? 'var(--heist-red)' : isGreed ? 'var(--heist-gold)' : 'rgba(255,255,255,0.5)';
      const isAlarm = evt.type === 'alarmFail' || evt.type === 'laserFail';

      tribeHtml += `<div class="${isAlarm ? 'oh-alarm' : ''}" style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;color:${color}">
        ${evt.player ? _ohSidePortrait(evt.player, 18) : ''}
        <span>${icon} ${evt.text}</span>
      </div>`;
    }

    tribeHtml += `<div style="display:flex;gap:12px;margin-top:6px;font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(34,211,238,0.4)">
      <span>SCORE: ${ht.score}</span>
      <span>LOOT: $${ht.totalLoot * 100}k</span>
    </div>`;
    tribeHtml += `</div></div>`;
    steps.push({ type: 'tribe-heist', tribe: ht.tribe, html: tribeHtml });
  }

  const totalSteps = steps.length;

  function buildHeistSidebar(revCount) {
    let sb = `<div class="oh-side-sec">SECURITY STATUS</div>`;
    for (let i = 0; i < heist.tribes.length; i++) {
      const ht = heist.tribes[i];
      const shown = i + 1 < revCount;
      sb += `<div style="padding:5px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:3px;opacity:${shown ? 1 : 0.4}">
        <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--heist-cyan)">${ht.tribe}${ht.hasEquipment ? ' 🔧' : ''}</div>
        ${shown ? `<div style="font-size:8px;color:var(--heist-gold);margin-top:2px">💰 $${ht.totalLoot * 100}k loot</div>
        <div style="font-size:8px;color:rgba(255,255,255,0.3)">Score: ${ht.score}</div>` : '<div style="font-size:8px;color:rgba(255,255,255,0.15)">IN PROGRESS</div>'}
      </div>`;
    }
    return sb;
  }

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

  const hudCells = `
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-gold)">$${heist.tribes.reduce((s, h) => s + h.totalLoot, 0) * 100}k</div><div class="oh-hud-lbl">TOTAL LOOT</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-red)">${heist.tribes.flatMap(h => h.events).filter(e => e.type === 'laserFail' || e.type === 'alarmFail').length}</div><div class="oh-hud-lbl">ALARMS</div></div>
    <div class="oh-hud-cell"><div class="oh-hud-val" style="color:var(--heist-cyan)">II</div><div class="oh-hud-lbl">PHASE</div></div>
  `;

  return _ohShell(`
    <div class="oh-hud">${hudCells}</div>
    <div class="oh-layout">
      <div class="oh-feed">${feed}${controls}</div>
      <div class="oh-sidebar" id="oh-sidebar-heist">${buildHeistSidebar(revIdx + 1)}</div>
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

  steps.push({ type: 'intro', html: `<div class="oh-ev" style="border-left-color:var(--heist-gold)">
    <div style="font-size:22px">🏎️</div>
    <div style="flex:1"><div class="oh-ev-badge gold">PHASE III — GETAWAY</div>
    <div class="oh-ev-text">${pick(HEIST_HOST.getawayIntro)(host())}</div></div>
  </div>` });

  // Build results
  let buildHtml = `<div class="oh-ev" style="border-left-color:var(--heist-cyan)">
    <div style="flex:1"><div class="oh-ev-badge cyan">BUILD PHASE</div>`;
  for (const gt of gw.tribes) {
    const qualPct = Math.round(gt.buildQuality * 100);
    const qualColor = qualPct > 50 ? 'var(--heist-green)' : qualPct > 30 ? 'var(--heist-gold)' : 'var(--heist-red)';
    buildHtml += `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
      <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--heist-cyan);width:60px">${gt.tribe}</span>
      <div style="flex:1;height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${qualPct}%;background:${qualColor};border-radius:3px"></div>
      </div>
      <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:${qualColor}">${qualPct}%</span>
    </div>`;
    if (gt.events.length) {
      buildHtml += `<div style="font-size:9px;color:rgba(255,255,255,0.4);padding-left:68px">${gt.events[0].text}</div>`;
    }
  }
  buildHtml += `</div></div>`;
  steps.push({ type: 'build', html: buildHtml });

  // Race rounds
  for (const rd of gw.raceRounds) {
    let roundHtml = `<div class="oh-ev" style="border-left-color:var(--heist-gold)">
      <div style="flex:1"><div class="oh-ev-badge gold">ROUND ${rd.num}</div>`;

    for (const evt of rd.events) {
      const icon = evt.type === 'propObstacle' ? '⚠️' : evt.type === 'propCrash' ? '💥' :
        evt.type === 'breakdown' ? '🔧' : evt.type === 'outOfGas' ? '⛽' :
        evt.type === 'crashNearFinish' ? '🔥' : evt.type === 'sabotage' ? '🔪' :
        evt.type === 'finishStrong' ? '🏁' : '📋';
      const color = ['propCrash', 'breakdown', 'outOfGas', 'crashNearFinish'].includes(evt.type) ? 'var(--heist-red)' :
        evt.type === 'finishStrong' ? 'var(--heist-green)' : 'var(--heist-gold)';
      roundHtml += `<div style="font-size:10px;color:${color};margin:2px 0">${icon} ${evt.text}</div>`;
    }

    // Positions
    roundHtml += `<div style="margin-top:4px;display:flex;gap:12px;font-family:'Share Tech Mono',monospace;font-size:8px;color:rgba(34,211,238,0.4)">`;
    for (const pos of rd.positions.sort((a, b) => b.distance - a.distance)) {
      const pct = Math.min(100, pos.distance);
      roundHtml += `<span>${pos.tribe}: ${pct}%</span>`;
    }
    roundHtml += `</div></div></div>`;
    steps.push({ type: 'round', num: rd.num, html: roundHtml });
  }

  // Final result
  const finalOrder = gw.tribes.sort((a, b) => b.distance - a.distance);
  steps.push({ type: 'result', html: `<div class="oh-ev" style="border-left-color:var(--heist-green);text-align:center">
    <div style="flex:1"><div class="oh-ev-badge green">🏁 GETAWAY COMPLETE</div>
    <div style="font-size:13px;color:var(--heist-green);font-family:'Share Tech Mono',monospace;margin-top:4px">${finalOrder.map((g, i) => `${i + 1}. ${g.tribe} (${Math.round(g.distance)}%)${g.crashed ? ' 💥CRASHED' : ''}`).join(' · ')}</div></div>
  </div>` });

  const totalSteps = steps.length;

  function buildGetawaySidebar(revCount) {
    let sb = `<div class="oh-side-sec">RACE POSITIONS</div>`;
    const latestRound = gw.raceRounds.filter((_, i) => i + 3 < revCount).pop();
    const positions = latestRound ? latestRound.positions.sort((a, b) => b.distance - a.distance) : gw.tribes.map(g => ({ tribe: g.tribe, distance: 0 }));
    for (const pos of positions) {
      const gt = gw.tribes.find(g => g.tribe === pos.tribe);
      const pct = Math.min(100, pos.distance);
      sb += `<div style="padding:4px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:3px">
        <div style="display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:9px">
          <span style="color:var(--heist-cyan)">${pos.tribe}</span>
          <span style="color:${gt?.crashed ? 'var(--heist-red)' : gt?.finished ? 'var(--heist-green)' : 'rgba(255,255,255,0.4)'}">${gt?.crashed ? '💥' : gt?.finished ? '🏁' : `${Math.round(pct)}%`}</span>
        </div>
        <div style="height:4px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden;margin-top:2px">
          <div style="height:100%;width:${pct}%;background:${gt?.crashed ? 'var(--heist-red)' : 'var(--heist-green)'};border-radius:2px;transition:width 0.3s"></div>
        </div>
      </div>`;
    }
    sb += `<div class="oh-side-sec">BUILD QUALITY</div>`;
    for (const gt of gw.tribes) {
      sb += `<div style="font-family:'Share Tech Mono',monospace;font-size:8px;color:rgba(255,255,255,0.4);padding:2px 0">${gt.tribe}: ${Math.round(gt.buildQuality * 100)}%</div>`;
    }
    return sb;
  }

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
      <div class="oh-sidebar" id="oh-sidebar-getaway">${buildGetawaySidebar(revIdx + 1)}</div>
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
        ${medal ? `<span style="font-size:7px;font-family:'Share Tech Mono',monospace;letter-spacing:1px;color:${medalColor}">${medal}</span>` : ''}
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
  let sb = `<div class="oh-side-sec">VAULT STATUS</div>`;
  for (let i = 0; i < vc.tribes.length; i++) {
    const vt = vc.tribes[i];
    const shown = i + 1 < revCount;
    const reactionIcon = vt.lockedReaction === 'panic' ? '😰' : vt.lockedReaction === 'nap' ? '😴' : '🔧';
    sb += `<div style="padding:6px;margin-bottom:4px;background:rgba(0,0,0,0.15);border-radius:4px;opacity:${shown ? 1 : 0.4}">
      <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--heist-cyan);margin-bottom:4px">${vt.tribe}</div>
      ${shown ? `
      <div style="display:flex;align-items:center;gap:6px;padding:4px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.12);border-radius:3px;margin-bottom:4px">
        ${_ohSidePortrait(vt.locked, 22)}
        <div><div style="font-size:8px;color:var(--heist-gold)">🔒 ${vt.locked}</div>
        <div style="font-size:7px;color:rgba(255,255,255,0.3)">${reactionIcon} ${vt.lockedReaction}</div></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px">
        ${vt.crackers.map(n => {
          const a = vt.approaches.find(ap => ap.name === n);
          const aIcon = a?.approach === 'lockpick' ? '🔓' : a?.approach === 'bruteForce' ? '💪' : '🗣️';
          return `<div style="display:flex;align-items:center;gap:3px;padding:2px 4px;background:rgba(34,211,238,0.06);border-radius:3px">
            ${_ohSidePortrait(n, 18)}<span style="font-size:7px">${aIcon}</span>
          </div>`;
        }).join('')}
      </div>
      <div style="height:5px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100, vt.score * 100)}%;background:var(--heist-cyan);border-radius:3px"></div>
      </div>
      <div style="font-size:7px;color:rgba(255,255,255,0.3);margin-top:2px;font-family:'Share Tech Mono',monospace">${vt.score.toFixed(2)}</div>
      ` : '<div style="font-size:9px;color:rgba(255,255,255,0.15)">LOCKED</div>'}
    </div>`;
  }
  sb += `<div class="oh-side-sec">CRACK ORDER</div>`;
  for (let i = 0; i < vc.tribes.length; i++) {
    const shown = i + 1 < revCount;
    sb += `<div style="display:flex;align-items:center;gap:6px;font-size:10px;color:${shown ? 'var(--heist-green)' : 'rgba(255,255,255,0.15)'};padding:3px 0;font-family:'Share Tech Mono',monospace">
      <span style="width:16px;text-align:center;font-weight:700">${i + 1}</span>
      <span>${shown ? vc.tribes[i].tribe : '???'}</span>${i === 0 && shown ? '<span style="font-size:8px"> 🏆</span>' : ''}
    </div>`;
  }
  return sb;
}

function _ohBuildHeistSidebarFromData(heist, revCount) {
  const latestEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const crewRoles = latestEp?.oceansHeist?.crewRoles || {};
  let sb = `<div class="oh-side-sec">SECURITY STATUS</div>`;
  for (let i = 0; i < heist.tribes.length; i++) {
    const ht = heist.tribes[i];
    const shown = i + 1 < revCount;
    const roles = crewRoles[ht.tribe] || {};
    const members = Object.keys(ht.memberResults || {});
    sb += `<div style="padding:6px;margin-bottom:4px;background:rgba(0,0,0,0.15);border-radius:4px;opacity:${shown ? 1 : 0.4}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--heist-cyan)">${ht.tribe}</div>
        ${ht.hasEquipment ? '<span style="font-size:8px;color:var(--heist-green)">🔧 EQUIPPED</span>' : ''}
      </div>
      ${shown ? `
      <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px">
        ${members.map(n => {
          const r = roles[n] || { emoji: '🎭' };
          const mr = ht.memberResults[n];
          const passed = mr ? mr.obstacles.filter(o => o.passed).length : 0;
          const total = mr ? mr.obstacles.filter(o => o.type !== 'loot').length : 0;
          return `<div style="display:flex;align-items:center;gap:3px;padding:2px 4px;background:rgba(0,0,0,0.15);border-radius:3px" title="${n}: ${passed}/${total} obstacles">
            ${_ohSidePortrait(n, 18)}<span style="font-size:7px">${r.emoji}</span><span style="font-size:7px;color:${passed >= total ? 'var(--heist-green)' : passed > 0 ? 'var(--heist-gold)' : 'var(--heist-red)'}">${passed}/${total}</span>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px;font-size:8px">
        <span style="color:var(--heist-gold)">💰 $${ht.totalLoot * 100}k</span>
        <span style="color:rgba(255,255,255,0.3)">Score: ${ht.score}</span>
      </div>
      ` : '<div style="font-size:9px;color:rgba(255,255,255,0.15)">IN PROGRESS</div>'}
    </div>`;
  }
  return sb;
}

function _ohBuildGetawaySidebarFromData(gw, revCount) {
  const latestEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const crewRoles = latestEp?.oceansHeist?.crewRoles || {};
  let sb = `<div class="oh-side-sec">RACE POSITIONS</div>`;
  const latestRound = gw.raceRounds.filter((_, i) => i + 3 < revCount).pop();
  const positions = latestRound ? latestRound.positions.sort((a, b) => b.distance - a.distance) : gw.tribes.map(g => ({ tribe: g.tribe, distance: 0 }));
  for (const pos of positions) {
    const gt = gw.tribes.find(g => g.tribe === pos.tribe);
    const roles = crewRoles[pos.tribe] || {};
    const pct = Math.min(100, pos.distance);
    const statusIcon = gt?.crashed ? '💥' : gt?.finished ? '🏁' : gt?.outOfGas ? '⛽' : '🏎️';
    const statusColor = gt?.crashed ? 'var(--heist-red)' : gt?.finished ? 'var(--heist-green)' : 'rgba(255,255,255,0.4)';
    sb += `<div style="padding:6px;margin-bottom:4px;background:rgba(0,0,0,0.15);border-radius:4px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--heist-cyan)">${pos.tribe}</span>
        <span style="font-size:10px;color:${statusColor}">${statusIcon} ${Math.round(pct)}%</span>
      </div>
      <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden;margin-bottom:4px">
        <div style="height:100%;width:${pct}%;background:${gt?.crashed ? 'var(--heist-red)' : 'var(--heist-green)'};border-radius:3px;transition:width 0.3s"></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:3px">
        ${(gt?.members || []).map(n => {
          const r = roles[n] || { emoji: '🎭' };
          return `<div style="display:flex;align-items:center;gap:2px;padding:1px 3px;background:rgba(0,0,0,0.15);border-radius:2px">
            ${_ohSidePortrait(n, 16)}<span style="font-size:7px">${r.emoji}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }
  sb += `<div class="oh-side-sec">BUILD QUALITY</div>`;
  for (const gt of gw.tribes) {
    const qualPct = Math.round(gt.buildQuality * 100);
    const qualColor = qualPct > 50 ? 'var(--heist-green)' : qualPct > 30 ? 'var(--heist-gold)' : 'var(--heist-red)';
    sb += `<div style="display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:9px;padding:2px 0">
      <span style="color:rgba(255,255,255,0.4)">${gt.tribe}</span>
      <span style="color:${qualColor}">${qualPct}%</span>
    </div>`;
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
