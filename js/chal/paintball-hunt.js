// js/chal/paintball-hunt.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

export function simulatePaintballHunt(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  const allMembers = tribes.flatMap(t => t.members);
  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  // ── Scoring constants ──
  // Balanced: hunter avg ~4.0, deer avg ~4.0 across a 5-round hunt
  const HUNTER_HIT = 2.5, HUNTER_MISS = -0.2, HUNTER_NOTHING = -0.1;
  const HUNTER_EVENT_BONUS = 1.5, HUNTER_NEGATIVE = -2.0, HUNTER_STANDOFF = -1.0;
  const DEER_DODGE = 1.5, DEER_PER_ROUND = 0.4, DEER_SURVIVOR = 2.5;
  const DEER_PAINTED = -1.0, DEER_EVENT_BONUS = 1.0;

  const ROUND_NAMES = [
    'THE HUNT BEGINS', 'INTO THE WOODS', 'THEY\'RE GETTING CLOSER',
    'DOWN TO THE WIRE', 'THE FINAL CHASE', 'ENDGAME',
    'LAST ONES STANDING', 'THE BITTER END'
  ];

  // ── Role Assignment ──
  const roles = {};
  tribes.forEach(t => {
    const shuffled = [...t.members].sort(() => Math.random() - 0.5);
    const numDeer = Math.ceil(shuffled.length / 2);
    roles[t.name] = {
      deer: shuffled.slice(0, numDeer),
      hunters: shuffled.slice(numDeer)
    };
  });

  // ── Balance: deer count normalization ──
  // Tribes with more deer should be easier to eliminate per-deer
  // (more targets running around = each individual is easier to spot)
  const deerCounts = tribes.map(t => roles[t.name].deer.length);
  const avgDeerCount = deerCounts.reduce((a, b) => a + b, 0) / deerCounts.length;
  // deerNorm[tribe] > 1 if tribe has more deer than avg (each deer easier to find)
  const deerNorm = {};
  tribes.forEach(t => {
    deerNorm[t.name] = roles[t.name].deer.length / avgDeerCount;
  });

  // ── State tracking ──
  const personalScores = {};
  allMembers.forEach(m => { personalScores[m] = 0; });
  const paintedOut = new Set(); // deer that got hit
  const unpaintedDeer = {}; // tribe -> Set of deer still alive
  tribes.forEach(t => { unpaintedDeer[t.name] = new Set(roles[t.name].deer); });
  const paintCounter = {}; // name -> total paint hits taken
  allMembers.forEach(m => { paintCounter[m] = 0; });
  const hunterHits = {}; // hunter -> hit count
  const hunterMisses = {}; // hunter -> miss count
  tribes.forEach(t => roles[t.name].hunters.forEach(h => { hunterHits[h] = 0; hunterMisses[h] = 0; }));
  const friendlyFireLog = [];
  const paintballWarLog = [];
  const bearMauledList = [];
  const rounds = [];
  const camouflaged = new Set(); // deer safe this round
  const treeClimbed = new Set(); // deer stuck in tree (safe but stuck)
  const mudSlid = new Set(); // deer easier to hit next round
  const obsessiveTargets = {}; // hunter -> last target

  // Role lookup helpers
  const isHunter = name => {
    const tribe = tribeOf[name];
    return roles[tribe].hunters.includes(name);
  };
  const isDeer = name => {
    const tribe = tribeOf[name];
    return roles[tribe].deer.includes(name);
  };

  // ── Helper: get opposing tribes' unpainted deer ──
  function getOpposingDeer(hunterTribe) {
    const result = [];
    tribes.forEach(t => {
      if (t.name !== hunterTribe) {
        unpaintedDeer[t.name].forEach(d => result.push(d));
      }
    });
    return result;
  }

  // ── Helper: weighted deer pick (lower survival = easier to find) ──
  // Evasion bonuses: dodge boost for this round (stacks)
  const deerDodgeBonus = {}; // name -> bonus to dodge score
  const hunterHitBonus = {}; // name -> bonus to hit score

  function pickTargetDeer(candidates) {
    if (!candidates.length) return null;
    const weights = candidates.map(d => {
      const s = pStats(d);
      // Hiding deer are harder to find (low weight) but not impossible
      const hideBonus = (camouflaged.has(d) ? -4 : 0) + (treeClimbed.has(d) ? -3 : 0);
      return Math.max(0.1, 10 - s.endurance * 0.5 - s.intuition * 0.3 + (mudSlid.has(d) ? 3 : 0) + (ep._pbMarked?.[d] || 0) + hideBonus);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < candidates.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  // ── Helper: add score ──
  function addScore(name, delta) {
    personalScores[name] = (personalScores[name] || 0) + delta;
  }

  // ── Phases container for romance helpers ──
  const phases = {};

  // ══════════════════════════════════════════════════════════════════
  // ROUND LOOP
  // ══════════════════════════════════════════════════════════════════
  let roundNum = 0;
  const MAX_ROUNDS = 10; // safety cap, fatigue should end it by round 5-6

  while (roundNum < MAX_ROUNDS) {
    roundNum++;
    // Fatigue: deer get tired, hunters learn terrain. Grows each round.
    const fatigue = (roundNum - 1) * 0.03; // 0, 0.03, 0.06, 0.09, 0.12, 0.15...
    const roundName = ROUND_NAMES[Math.min(roundNum - 1, ROUND_NAMES.length - 1)];
    const roundKey = 'round' + roundNum;
    phases[roundKey] = [];

    // Check if hunt should end: only 1 tribe has unpainted deer
    const tribesWithDeer = tribes.filter(t => unpaintedDeer[t.name].size > 0);
    if (tribesWithDeer.length <= 1) break;

    // Clear per-round statuses
    camouflaged.clear();
    treeClimbed.clear();
    const newMudSlid = new Set();

    const roundEvents = [];
    const matchups = [];
    let specialEventsThisRound = 0;
    const maxSpecialEvents = 4 + Math.floor(Math.random() * 3); // 4-6

    // ── Pre-matchup special events ──
    // Process order: social/drama first (priority), then defensive (capped), then negative

    const aliveDeerAll = [...allMembers].filter(m => isDeer(m) && !paintedOut.has(m));

    // Deer stampede: 3+ deer alive same tribe, social proportional
    tribes.forEach(t => {
      const aliveDeer = [...unpaintedDeer[t.name]];
      if (aliveDeer.length >= 3 && specialEventsThisRound < maxSpecialEvents) {
        const leader = aliveDeer.reduce((best, d) => pStats(d).social > pStats(best).social ? d : best, aliveDeer[0]);
        if (Math.random() < pStats(leader).social * 0.03) {
          specialEventsThisRound++;
          const pr = pronouns(leader);
          const _stampTexts = [
            `${leader} rallies ${pr.posAdj} fellow deer into a stampede! The herd runs together, making them harder to pick off.`,
            `${leader} signals the others and they bolt as a group — the hunters can't isolate a single target.`,
            `The ${tribeOf[leader]} deer run in formation behind ${leader}. Safety in numbers.`,
          ];
          roundEvents.push({ type: 'pbDeerStampede', players: aliveDeer, text: _rp(_stampTexts), badge: 'STAMPEDE', badgeText: 'STAMPEDE', badgeClass: 'gold' });
          aliveDeer.forEach(d => addScore(d, 0.5));
        }
      }
    });
    const stampedeDeer = new Set(roundEvents.filter(e => e.type === 'pbDeerStampede').flatMap(e => e.players));

    // ── Deer evasion events (max 2 total per round across all types) ──
    let deerEvasionCount = 0;

    // Camouflage
    if (deerEvasionCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const camoCandidates = aliveDeerAll.filter(d => !camouflaged.has(d));
      const camoRolls = camoCandidates.map(d => ({ d, roll: Math.random() < pStats(d).intuition * 0.04 ? pStats(d).intuition + Math.random() : -1 })).filter(r => r.roll > 0);
      camoRolls.sort((a, b) => b.roll - a.roll);
      const camoWinners = camoRolls.slice(0, 2);
      camoWinners.forEach(({ d }) => {
        if (deerEvasionCount >= 2 || specialEventsThisRound >= maxSpecialEvents) return;
        deerEvasionCount++;
        specialEventsThisRound++;
        camouflaged.add(d); // reduces find weight
        deerDodgeBonus[d] = (deerDodgeBonus[d] || 0) + 0.15; // dodge boost
        addScore(d, 1.0);
        const pr = pronouns(d);
        const _camoTexts = [
          `${d} covers ${pr.ref} in mud and leaves — completely invisible to the hunters this round.`,
          `${d} ducks behind a fallen tree and doesn't move a muscle. The hunters walk right past ${pr.obj}.`,
          `${d} finds a hollow log and crawls inside. The hunters have no idea ${pr.sub}'s three feet away.`,
          `${d} presses flat against a mossy rock, barely breathing. ${pr.Sub} blends right in.`,
          `${d} wedges into a thicket so dense no hunter could spot ${pr.obj}. Perfect hide.`,
        ];
        roundEvents.push({ type: 'pbCamouflage', players: [d], text: _rp(_camoTexts), badge: 'CAMO', badgeText: 'CAMO', badgeClass: 'gold' });
      });
    }

    // Tree climb
    if (deerEvasionCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const treeCandidates = aliveDeerAll.filter(d => !camouflaged.has(d) && !treeClimbed.has(d));
      const treeRolls = treeCandidates.map(d => ({ d, roll: Math.random() < pStats(d).physical * 0.03 ? pStats(d).physical + Math.random() : -1 })).filter(r => r.roll > 0);
      if (treeRolls.length) {
        treeRolls.sort((a, b) => b.roll - a.roll);
        const d = treeRolls[0].d;
        deerEvasionCount++; specialEventsThisRound++;
        treeClimbed.add(d); // reduces find weight
        deerDodgeBonus[d] = (deerDodgeBonus[d] || 0) + 0.12; // dodge boost
        addScore(d, 1.0);
        const pr = pronouns(d);
        const _treeTexts = [
          `${d} scrambles up a tree and hides in the branches. Safe this round, but ${pr.sub}'s stuck up there.`,
          `${d} shimmies up an oak tree like ${pr.posAdj} life depends on it — because it does. No one thinks to look up.`,
          `${d} swings onto a low branch and pulls ${pr.ref} up. The hunters search below, clueless.`,
          `${d} climbs so high the camera crew can barely see ${pr.obj}. Bold strategy.`,
        ];
        roundEvents.push({ type: 'pbTreeClimb', players: [d], text: _rp(_treeTexts), badge: 'TREE CLIMB', badgeText: 'TREE CLIMB', badgeClass: '' });
      }
    }

    // Water dive: deer jumps into water/stream — hard to track, dodge boost (endurance)
    if (deerEvasionCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const waterCandidates = aliveDeerAll.filter(d => !camouflaged.has(d) && !treeClimbed.has(d));
      const waterRolls = waterCandidates.map(d => ({ d, roll: Math.random() < pStats(d).endurance * 0.025 ? pStats(d).endurance + Math.random() : -1 })).filter(r => r.roll > 0);
      if (waterRolls.length) {
        waterRolls.sort((a, b) => b.roll - a.roll);
        const d = waterRolls[0].d;
        deerEvasionCount++; specialEventsThisRound++;
        deerDodgeBonus[d] = (deerDodgeBonus[d] || 0) + 0.12;
        addScore(d, 1.0);
        const pr = pronouns(d);
        const _waterTexts = [
          `${d} dives into a stream and lets the current carry ${pr.obj} downstream. The hunters lose the trail completely.`,
          `${d} wades into a creek and crouches with only ${pr.posAdj} eyes above the waterline. The paint washes right off.`,
          `${d} spots a pond and submerges. The hunters check the area and move on. ${pr.Sub} surfaces, gasping, alive.`,
          `${d} crawls through a drainage ditch, soaking wet but impossible to track. The water kills the scent trail.`,
        ];
        roundEvents.push({ type: 'pbWaterDive', players: [d], text: _rp(_waterTexts), badge: 'WATER ESCAPE', badgeText: 'WATER ESCAPE', badgeClass: 'gold' });
      }
    }

    // Decoy trail: deer creates false tracks — misdirection, dodge boost (strategic)
    if (deerEvasionCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const decoyCandidates = aliveDeerAll.filter(d => !camouflaged.has(d) && !treeClimbed.has(d));
      const decoyRolls = decoyCandidates.map(d => ({ d, roll: Math.random() < pStats(d).strategic * 0.025 ? pStats(d).strategic + Math.random() : -1 })).filter(r => r.roll > 0);
      if (decoyRolls.length) {
        decoyRolls.sort((a, b) => b.roll - a.roll);
        const d = decoyRolls[0].d;
        deerEvasionCount++; specialEventsThisRound++;
        deerDodgeBonus[d] = (deerDodgeBonus[d] || 0) + 0.10;
        addScore(d, 0.8);
        const pr = pronouns(d);
        const _decoyTrailTexts = [
          `${d} breaks branches in one direction and doubles back the other way. The hunters follow the false trail.`,
          `${d} drags ${pr.posAdj} jacket through the bushes and leaves it as bait. Two hunters waste five minutes on it.`,
          `${d} scatters footprints toward the cliff edge, then circles back through the trees. Textbook misdirection.`,
          `${d} throws rocks into the bushes to draw hunters away, then slips out the other side.`,
        ];
        roundEvents.push({ type: 'pbDecoyTrail', players: [d], text: _rp(_decoyTrailTexts), badge: 'FALSE TRAIL', badgeText: 'FALSE TRAIL', badgeClass: 'gold' });
      }
    }

    // Sprint burst: deer just flat-out runs — makes them harder to hit even if found (physical)
    if (deerEvasionCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const sprintCandidates = aliveDeerAll.filter(d => !camouflaged.has(d) && !treeClimbed.has(d));
      const sprintRolls = sprintCandidates.map(d => ({ d, roll: Math.random() < pStats(d).physical * 0.02 ? pStats(d).physical + Math.random() : -1 })).filter(r => r.roll > 0);
      if (sprintRolls.length) {
        sprintRolls.sort((a, b) => b.roll - a.roll);
        const d = sprintRolls[0].d;
        deerEvasionCount++; specialEventsThisRound++;
        deerDodgeBonus[d] = (deerDodgeBonus[d] || 0) + 0.10;
        addScore(d, 0.5);
        const pr = pronouns(d);
        const _sprintTexts = [
          `${d} breaks into a dead sprint through the forest. ${pr.Sub}'s a blur between the trees — good luck hitting that.`,
          `Something spooks ${d} and ${pr.sub} BOLTS. Full speed, zigzagging, impossible to track.`,
          `${d} decides hiding is for cowards and just runs. Fast. Really fast. The hunters can barely keep up.`,
          `${d} launches into a sprint so explosive the camera operator trips trying to follow. Pure adrenaline.`,
        ];
        roundEvents.push({ type: 'pbSprintBurst', players: [d], text: _rp(_sprintTexts), badge: 'SPRINT', badgeText: 'SPRINT', badgeClass: '' });
      }
    }

    // Mud slide: MAX 1 per round
    if (specialEventsThisRound < maxSpecialEvents) {
      const mudCandidates = aliveDeerAll.filter(d => !camouflaged.has(d) && !treeClimbed.has(d));
      const mudRolls = mudCandidates.map(d => ({ d, roll: Math.random() < (10 - pStats(d).endurance) * 0.02 ? (10 - pStats(d).endurance) + Math.random() : -1 })).filter(r => r.roll > 0);
      if (mudRolls.length) {
        mudRolls.sort((a, b) => b.roll - a.roll);
        const d = mudRolls[0].d;
        specialEventsThisRound++;
        newMudSlid.add(d);
        const pr = pronouns(d);
        const _mudTexts = [
          `${d} slips in the mud and faceplants. ${pr.Sub}'ll be an easier target next round.`,
          `${d} trips over a root and goes sprawling. Not exactly stealthy.`,
          `${d} loses ${pr.posAdj} footing on a wet slope and slides right into the open. Bad timing.`,
          `${d} steps on a rotten log, breaks through, and crashes down. Every hunter within earshot turns around.`,
        ];
        roundEvents.push({ type: 'pbMudSlide', players: [d], text: _rp(_mudTexts), badge: 'MUD SLIDE', badgeText: 'MUD SLIDE', badgeClass: 'red' });
      }
    }

    // Bear encounter: rare (~8% chance total per hunt, max 1 per hunt)
    if (!bearMauledList.length) [...allMembers].filter(m => isDeer(m) && !paintedOut.has(m)).forEach(d => {
      if (Math.random() < 0.012 && specialEventsThisRound < maxSpecialEvents && !bearMauledList.length) {
        specialEventsThisRound++;
        const pr = pronouns(d);
        if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
        gs.lingeringInjuries[d] = { ep: (gs.episode || 0) + 1, duration: 2, type: 'bear-mauled', penalty: 1.5 + Math.random() };
        if (!gs._paintballHeat) gs._paintballHeat = {};
        gs._paintballHeat[d] = { amount: 2.0, expiresEp: (gs.episode || 0) + 1 + 2 };
        bearMauledList.push(d);
        roundEvents.push({
          type: 'pbBearEncounter', players: [d],
          text: `A BEAR charges out of the woods and mauls ${d}! ${pr.Sub}'s hurt bad — this is going to linger.`,
          badge: 'BEAR MAULED', badgeText: 'BEAR MAULED', badgeClass: 'red'
        });
      }
    });

    // Antlers locked: two deer different tribes, random low chance
    if (specialEventsThisRound < maxSpecialEvents) {
      const allAliveDeer = tribes.flatMap(t => [...unpaintedDeer[t.name]]);
      if (allAliveDeer.length >= 2) {
        for (let ai = 0; ai < allAliveDeer.length && specialEventsThisRound < maxSpecialEvents; ai++) {
          for (let aj = ai + 1; aj < allAliveDeer.length; aj++) {
            if (tribeOf[allAliveDeer[ai]] !== tribeOf[allAliveDeer[aj]] && Math.random() < 0.04) {
              const d1 = allAliveDeer[ai], d2 = allAliveDeer[aj];
              specialEventsThisRound++;
              addBond(d1, d2, 0.3);
              const _antlerTexts = [
                `${d1} and ${d2} literally crash into each other and get tangled up. Easy targets, but the comedy writes itself.`,
                `${d1} dives for cover and lands right on top of ${d2}. They're stuck. The camera crew is in tears.`,
                `${d1} and ${d2} collide at full speed running from different hunters. Neither can get up. Pure slapstick.`,
              ];
              roundEvents.push({
                type: 'pbAntlersLocked', players: [d1, d2],
                text: _rp(_antlerTexts),
                badge: 'ANTLERS LOCKED', badgeText: 'ANTLERS LOCKED', badgeClass: ''
              });
              // Romance spark check
              if (seasonConfig.romance !== 'disabled') {
                _challengeRomanceSpark(d1, d2, ep, roundKey, phases, personalScores, 'antlers-locked');
              }
              break;
            }
          }
        }
      }
    }

    // ── Rebellion: deer boldness proportional — steals hunter's gun ──
    const rebellionDeer = new Set();
    [...allMembers].filter(m => isDeer(m) && !paintedOut.has(m) && !camouflaged.has(m) && !treeClimbed.has(m)).forEach(d => {
      const s = pStats(d);
      if (Math.random() < s.boldness * 0.03 && specialEventsThisRound < maxSpecialEvents) {
        specialEventsThisRound++;
        rebellionDeer.add(d);
        addScore(d, DEER_EVENT_BONUS);
        const pr = pronouns(d);
        // Pick a random opposing hunter
        const oppHunters = tribes.filter(t => t.name !== tribeOf[d]).flatMap(t => roles[t.name].hunters);
        if (oppHunters.length) {
          const victim = _rp(oppHunters);
          addScore(victim, HUNTER_NEGATIVE);
          const prV = pronouns(victim);
          const _rebellTexts = [
            `${d} snatches the paintball gun right out of ${victim}'s hands and shoots ${prV.obj} point blank! The deer becomes the hunter.`,
            `${d} tackles ${victim}, grabs ${prV.posAdj} gun, and opens fire. ${pr.Sub} was done running.`,
            `${d} ambushes ${victim} from behind, disarms ${prV.obj}, and paints ${prV.obj} head to toe. Role reversal.`,
            `${d} waits until ${victim} puts the gun down to check the map, then grabs it. "My turn." Splat.`,
          ];
          roundEvents.push({
            type: 'pbRebellion', players: [d, victim],
            text: _rp(_rebellTexts),
            badge: 'REBELLION', badgeText: 'REBELLION', badgeClass: 'gold'
          });
        }
      }
    });

    // ── Paintball misfire: (10-mental) proportional per hunter ──
    const misfiredHunters = new Set();
    tribes.forEach(t => {
      roles[t.name].hunters.forEach(h => {
        const s = pStats(h);
        if (Math.random() < (10 - s.mental) * 0.02 && specialEventsThisRound < maxSpecialEvents) {
          specialEventsThisRound++;
          misfiredHunters.add(h);
          addScore(h, HUNTER_NOTHING);
          const pr = pronouns(h);
          const _misfireTexts = [
            `${h}'s paintball gun jams! ${pr.Sub} spends the entire round trying to fix it. Wasted turn.`,
            `${h} pulls the trigger and the gun just... clicks. Nothing. ${pr.Sub} shakes it furiously.`,
            `${h}'s gun misfires and paints the tree next to ${pr.obj}. ${pr.Sub} stares at it, mortified.`,
            `${h} accidentally fires into the ground while reloading. The noise scares off every deer in range.`,
          ];
          roundEvents.push({
            type: 'pbMisfire', players: [h],
            text: _rp(_misfireTexts),
            badge: 'MISFIRE', badgeText: 'MISFIRE', badgeClass: 'red'
          });
        }
      });
    });

    // ── Hunter boost events (max 2 per round, like deer evasion) ──
    const allHuntersAlive = tribes.flatMap(t => roles[t.name].hunters);
    let hunterBoostCount = 0;

    // Scent tracking: intuition — hunter picks up the trail, accuracy boost
    if (hunterBoostCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const scentRolls = allHuntersAlive.filter(h => !misfiredHunters.has(h))
        .map(h => ({ h, roll: Math.random() < pStats(h).intuition * 0.03 ? pStats(h).intuition + Math.random() : -1 })).filter(r => r.roll > 0);
      if (scentRolls.length) {
        scentRolls.sort((a, b) => b.roll - a.roll);
        const h = scentRolls[0].h;
        hunterBoostCount++; specialEventsThisRound++;
        hunterHitBonus[h] = (hunterHitBonus[h] || 0) + 0.12;
        addScore(h, 0.5);
        const pr = pronouns(h);
        const _scentTexts = [
          `${h} drops low and reads the tracks in the mud. Fresh prints — ${pr.sub}'s locked on.`,
          `${h} spots broken twigs and disturbed leaves. Someone came through here recently. ${pr.Sub} follows the trail.`,
          `${h} pauses, sniffs the air, and grins. ${pr.Sub} knows exactly where they went.`,
          `${h} finds a half-eaten snack bar on the ground. The deer went east. ${pr.Sub} adjusts course.`,
        ];
        roundEvents.push({ type: 'pbScentTrack', players: [h], text: _rp(_scentTexts), badge: 'TRACKING', badgeText: 'TRACKING', badgeClass: 'gold' });
      }
    }

    // High ground: physical — hunter climbs to vantage point, can see more
    if (hunterBoostCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const highRolls = allHuntersAlive.filter(h => !misfiredHunters.has(h))
        .map(h => ({ h, roll: Math.random() < pStats(h).physical * 0.025 ? pStats(h).physical + Math.random() : -1 })).filter(r => r.roll > 0);
      if (highRolls.length) {
        highRolls.sort((a, b) => b.roll - a.roll);
        const h = highRolls[0].h;
        hunterBoostCount++; specialEventsThisRound++;
        hunterHitBonus[h] = (hunterHitBonus[h] || 0) + 0.10;
        addScore(h, 0.5);
        const pr = pronouns(h);
        const _highTexts = [
          `${h} climbs a ridge and scans the forest from above. ${pr.Sub} can see movement between the trees.`,
          `${h} finds a rocky outcrop with a clear sightline. Sniper position secured.`,
          `${h} scales a boulder and spots deer tracks from above. The whole forest is ${pr.posAdj} map now.`,
          `${h} perches on a fallen tree trunk above the clearing. Height advantage — the deer don't know ${pr.sub}'s up there.`,
        ];
        roundEvents.push({ type: 'pbHighGround', players: [h], text: _rp(_highTexts), badge: 'HIGH GROUND', badgeText: 'HIGH GROUND', badgeClass: 'gold' });
      }
    }

    // Bait trap: strategic — hunter sets up a lure, draws deer to kill zone
    if (hunterBoostCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const baitRolls = allHuntersAlive.filter(h => !misfiredHunters.has(h))
        .map(h => ({ h, roll: Math.random() < pStats(h).strategic * 0.025 ? pStats(h).strategic + Math.random() : -1 })).filter(r => r.roll > 0);
      if (baitRolls.length) {
        baitRolls.sort((a, b) => b.roll - a.roll);
        const h = baitRolls[0].h;
        hunterBoostCount++; specialEventsThisRound++;
        hunterHitBonus[h] = (hunterHitBonus[h] || 0) + 0.12;
        addScore(h, 0.5);
        const pr = pronouns(h);
        const _baitTexts = [
          `${h} leaves a trail of food toward an open clearing, then hides behind a bush with ${pr.posAdj} gun ready. Patient.`,
          `${h} sets up a noise trap with sticks and leaves. When a deer trips it, ${pr.sub}'ll know exactly where to aim.`,
          `${h} rigs a fake "safe zone" with scattered supplies. Any deer who falls for it is walking into a kill zone.`,
          `${h} hides ${pr.posAdj} jacket where deer might rest and sets up a firing line. Strategy over speed.`,
        ];
        roundEvents.push({ type: 'pbBaitTrap', players: [h], text: _rp(_baitTexts), badge: 'BAIT TRAP', badgeText: 'BAIT TRAP', badgeClass: 'gold' });
      }
    }

    // Gross-out tactic: low mental or specific archetypes — uses disgusting methods (the Owen move)
    if (hunterBoostCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const grossArchs = ['chaos-agent', 'wildcard', 'comic-relief', 'floater'];
      const grossRolls = allHuntersAlive.filter(h => {
        if (misfiredHunters.has(h)) return false;
        const arch = players.find(p => p.name === h)?.archetype || '';
        return grossArchs.includes(arch) || pStats(h).mental <= 4;
      }).map(h => ({ h, roll: Math.random() < 0.15 ? (10 - pStats(h).mental) + Math.random() : -1 })).filter(r => r.roll > 0);
      if (grossRolls.length) {
        grossRolls.sort((a, b) => b.roll - a.roll);
        const h = grossRolls[0].h;
        hunterBoostCount++; specialEventsThisRound++;
        hunterHitBonus[h] = (hunterHitBonus[h] || 0) + 0.10;
        addScore(h, 0.3);
        const pr = pronouns(h);
        const _grossTexts = [
          `${h} rubs mud and... other things... all over ${pr.ref}. Disgusting, but the deer can't smell ${pr.obj} coming anymore.`,
          `${h} rolls in something unspeakable to mask ${pr.posAdj} scent. The camera crew gags. The strategy is... working?`,
          `${h} eats raw berries and belches so loudly the deer freeze in confusion. Unorthodox hunting at its finest.`,
          `${h} uses a "natural camouflage technique" that involves a LOT of swamp water. Everyone within twenty feet is horrified.`,
          `${h} does something the censors won't let us show, but the end result is that ${pr.sub}'s invisible to deer. Gross but effective.`,
        ];
        roundEvents.push({ type: 'pbGrossOut', players: [h], text: _rp(_grossTexts), badge: 'GROSS OUT', badgeText: 'GROSS OUT', badgeClass: '' });
      }
    }

    // Patience: mental — hunter waits perfectly still, accuracy boost
    if (hunterBoostCount < 2 && specialEventsThisRound < maxSpecialEvents) {
      const patRolls = allHuntersAlive.filter(h => !misfiredHunters.has(h))
        .map(h => ({ h, roll: Math.random() < pStats(h).mental * 0.02 ? pStats(h).mental + Math.random() : -1 })).filter(r => r.roll > 0);
      if (patRolls.length) {
        patRolls.sort((a, b) => b.roll - a.roll);
        const h = patRolls[0].h;
        hunterBoostCount++; specialEventsThisRound++;
        hunterHitBonus[h] = (hunterHitBonus[h] || 0) + 0.10;
        addScore(h, 0.5);
        const pr = pronouns(h);
        const _patTexts = [
          `${h} picks a spot and doesn't move for ten straight minutes. When a deer finally passes, ${pr.sub}'s ready.`,
          `${h} controls ${pr.posAdj} breathing, steadies the gun, and waits. Discipline over chaos.`,
          `${h} sits so still that a bird lands on ${pr.posAdj} shoulder. ${pr.Sub} doesn't flinch. The shot will come to ${pr.obj}.`,
          `${h} zones out everything — the bugs, the heat, the noise. Pure focus. The next deer that crosses ${pr.posAdj} path is done.`,
        ];
        roundEvents.push({ type: 'pbPatience', players: [h], text: _rp(_patTexts), badge: 'PATIENCE', badgeText: 'PATIENCE', badgeClass: '' });
      }
    }

    // ── Social events during hunt ──

    // Alliance rebellion: hunter bond <= -1 with own team deer, refuses orders
    tribes.forEach(t => {
      roles[t.name].hunters.forEach(h => {
        roles[t.name].deer.filter(d => !paintedOut.has(d)).forEach(d => {
          if (getBond(h, d) <= -1 && Math.random() < 0.3 && specialEventsThisRound < maxSpecialEvents) {
            specialEventsThisRound++;
            addScore(h, HUNTER_STANDOFF);
            const pr = pronouns(h);
            const _allyRebTexts = [
              `${h} refuses to coordinate with ${d}. ${pr.Sub} goes off on ${pr.posAdj} own, wasting valuable hunting time.`,
              `${d} tries to give ${h} directions but ${h} ignores ${pronouns(d).obj} completely. "I don't take orders from you."`,
              `${h} and ${d} get into an argument in the middle of the woods. The enemy hunters can hear everything.`,
            ];
            roundEvents.push({
              type: 'pbAllianceRebellion', players: [h, d],
              text: _rp(_allyRebTexts),
              badge: 'REBELLION', badgeText: 'REBELLION', badgeClass: 'red'
            });
          }
        });
      });
    });

    // Deer-to-deer bonding: two deer hiding together, bond >= 2
    const allAliveDeerForSocial = tribes.flatMap(t => [...unpaintedDeer[t.name]]);
    for (let di = 0; di < allAliveDeerForSocial.length && specialEventsThisRound < maxSpecialEvents; di++) {
      for (let dj = di + 1; dj < allAliveDeerForSocial.length; dj++) {
        const d1 = allAliveDeerForSocial[di], d2 = allAliveDeerForSocial[dj];
        if (tribeOf[d1] === tribeOf[d2] && getBond(d1, d2) >= 1 && Math.random() < 0.35) {
          specialEventsThisRound++;
          addBond(d1, d2, 0.3);
          addScore(d1, 0.5);
          addScore(d2, 0.5);
          const _bondTexts = [
            `${d1} and ${d2} hide behind the same log, whispering and keeping watch for each other. The fear brings them closer.`,
            `${d1} grabs ${d2}'s arm and pulls ${pronouns(d2).obj} behind cover just as a hunter passes. They share a look.`,
            `${d1} and ${d2} take turns on lookout while the other rests. Teamwork born from terror.`,
            `Huddled in the dark, ${d1} and ${d2} swap stories to stay calm. Something real is forming here.`,
          ];
          roundEvents.push({
            type: 'pbDeerBonding', players: [d1, d2],
            text: _rp(_bondTexts),
            badge: 'BOND', badgeText: 'BOND', badgeClass: 'gold'
          });
          // Romance spark for deer hiding together
          if (seasonConfig.romance !== 'disabled') {
            _challengeRomanceSpark(d1, d2, ep, roundKey, phases, personalScores, 'deer-hiding');
          }
          break;
        }
      }
    }

    // Cross-tribe deer encounter
    for (let di = 0; di < allAliveDeerForSocial.length && specialEventsThisRound < maxSpecialEvents; di++) {
      for (let dj = di + 1; dj < allAliveDeerForSocial.length; dj++) {
        const d1 = allAliveDeerForSocial[di], d2 = allAliveDeerForSocial[dj];
        if (tribeOf[d1] !== tribeOf[d2] && Math.random() < 0.20) {
          specialEventsThisRound++;
          const rivalry = getBond(d1, d2) < 0;
          if (rivalry) {
            addBond(d1, d2, -0.2);
            const _rivalTexts = [
              `${d1} and ${d2} spot each other hiding in the same thicket. The tension is palpable — no alliance here.`,
              `${d1} and ${d2} lock eyes across a clearing. Neither moves. Neither blinks. This is personal now.`,
              `${d1} gestures for ${d2} to leave. ${d2} gestures back — not politely. The standoff continues.`,
            ];
            roundEvents.push({
              type: 'pbCrossTribeEncounter', players: [d1, d2],
              text: _rp(_rivalTexts),
              badge: 'STANDOFF', badgeText: 'STANDOFF', badgeClass: 'red'
            });
          } else {
            addBond(d1, d2, 0.2);
            const _truceTexts = [
              `${d1} and ${d2} from different tribes find themselves hiding side by side. A nod of mutual respect — for now.`,
              `${d1} nearly shoots ${d2} before realizing they're both deer. An awkward laugh, then silence. Neither gives up the other's position.`,
              `${d1} and ${d2} share a hiding spot without a word. Enemy tribes, but right now they're just two people trying not to get painted.`,
            ];
            roundEvents.push({
              type: 'pbCrossTribeEncounter', players: [d1, d2],
              text: _rp(_truceTexts),
              badge: 'TRUCE', badgeText: 'TRUCE', badgeClass: ''
            });
          }
          break;
        }
      }
    }

    // Deer-to-deer pact: strategic proportional
    for (let di = 0; di < allAliveDeerForSocial.length && specialEventsThisRound < maxSpecialEvents; di++) {
      for (let dj = di + 1; dj < allAliveDeerForSocial.length; dj++) {
        const d1 = allAliveDeerForSocial[di], d2 = allAliveDeerForSocial[dj];
        if (tribeOf[d1] === tribeOf[d2]) {
          const s1 = pStats(d1), s2 = pStats(d2);
          if (Math.random() < (s1.strategic + s2.strategic) * 0.015) {
            specialEventsThisRound++;
            // Side deal formation
            if (!gs.sideDeals) gs.sideDeals = [];
            gs.sideDeals.push({ players: [d1, d2], initiator: d1, madeEp: (gs.episode || 0) + 1, type: 'paintball-pact', active: true, genuine: true });
            const _pactTexts = [
              `While hiding together, ${d1} and ${d2} whisper a side deal — protect each other at the next tribal, no matter what.`,
              `${d1} turns to ${d2}: "If we both survive this, we've got each other's backs." A handshake in the dark.`,
              `Fear makes strange alliances. ${d1} and ${d2} make a pact between dodging paintballs: final four, no betrayals.`,
            ];
            roundEvents.push({
              type: 'pbDeerPact', players: [d1, d2],
              text: _rp(_pactTexts),
              badge: 'PACT', badgeText: 'PACT', badgeClass: 'gold'
            });
            break;
          }
        }
      }
    }

    // Hunter-to-hunter scheming: strategic proportional
    const allHunters = tribes.flatMap(t => roles[t.name].hunters);
    for (let hi = 0; hi < allHunters.length && specialEventsThisRound < maxSpecialEvents; hi++) {
      for (let hj = hi + 1; hj < allHunters.length; hj++) {
        const h1 = allHunters[hi], h2 = allHunters[hj];
        if (tribeOf[h1] === tribeOf[h2]) {
          const s1 = pStats(h1), s2 = pStats(h2);
          if (Math.random() < (s1.strategic + s2.strategic) * 0.015) {
            specialEventsThisRound++;
            const _schemeTexts = [
              `${h1} and ${h2} crouch together between rounds, whispering about who to target at the next tribal.`,
              `${h1} and ${h2} set up a joint ambush position and use the downtime to talk strategy. "After this, we need to talk about the vote."`,
              `"You thinking what I'm thinking?" ${h1} asks ${h2} between shots. They are. The tribal just got interesting.`,
            ];
            roundEvents.push({
              type: 'pbHunterScheme', players: [h1, h2],
              text: _rp(_schemeTexts),
              badge: 'SCHEMING', badgeText: 'SCHEMING', badgeClass: ''
            });
            break;
          }
        }
      }
    }

    // Cross-role whisper: hunter finds own team deer, bond >= 2
    tribes.forEach(t => {
      roles[t.name].hunters.forEach(h => {
        roles[t.name].deer.filter(d => !paintedOut.has(d)).forEach(d => {
          if (getBond(h, d) >= 1 && Math.random() < 0.25 && specialEventsThisRound < maxSpecialEvents) {
            specialEventsThisRound++;
            addBond(h, d, 0.2);
            const _whisperTexts = [
              `${h} stumbles upon ${d} — ${pronouns(h).posAdj} own teammate. Instead of moving on, they exchange intel about enemy positions.`,
              `${h} nearly shoots ${d} before realizing it's ${pronouns(h).posAdj} own deer. "Don't DO that!" Quick intel swap, then they split.`,
              `${h} finds ${d} hiding and slips ${pronouns(d).obj} a heads-up on where the enemy hunters are patrolling.`,
            ];
            roundEvents.push({
              type: 'pbCrossRoleWhisper', players: [h, d],
              text: _rp(_whisperTexts),
              badge: 'WHISPER', badgeText: 'WHISPER', badgeClass: ''
            });
          }
        });
      });
    });

    // Alliance meeting: villain/schemer + alliance member
    tribes.forEach(t => {
      roles[t.name].hunters.forEach(h => {
        const arch = players.find(p => p.name === h)?.archetype;
        if ((arch === 'villain' || arch === 'schemer') && specialEventsThisRound < maxSpecialEvents) {
          const ally = roles[t.name].hunters.find(h2 => h2 !== h && getBond(h, h2) >= 1);
          if (ally && Math.random() < 0.3) {
            specialEventsThisRound++;
            const _plotTexts = [
              `${h} pulls ${ally} aside during the hunt for a quick strategy session. This isn't just about paintball anymore.`,
              `${h} signals ${ally} to fall back from the group. "I have a plan for after this." ${ally} listens carefully.`,
              `Between rounds, ${h} corners ${ally}: "We need to talk about the vote." The paintball hunt is just the excuse.`,
            ];
            roundEvents.push({
              type: 'pbAllianceMeeting', players: [h, ally],
              text: _rp(_plotTexts),
              badge: 'PLOTTING', badgeText: 'PLOTTING', badgeClass: ''
            });
          }
        }
      });
    });

    // ── NEW: Deer confessional — deer talks to camera mid-hunt ──
    if (specialEventsThisRound < maxSpecialEvents) {
      const confCandidates = [...allMembers].filter(m => isDeer(m) && !paintedOut.has(m));
      if (confCandidates.length && Math.random() < 0.25) {
        const d = _rp(confCandidates);
        const pr = pronouns(d);
        specialEventsThisRound++;
        const _confTexts = [
          `${d} finds a camera and whispers into it: "I am NOT going out like this." ${pr.Sub} looks genuinely scared.`,
          `${d} crouches behind a bush and talks directly to camera: "If I survive this, I'm coming for everyone who laughed."`,
          `${d} stares into the camera, covered in dirt: "This is the worst day of my life." Long pause. "...I love it."`,
          `${d} grabs a camera operator: "Are you getting this?! I've been running for twenty minutes! WHERE IS EVERYONE?!"`,
          `${d}, breathing hard, looks at the camera: "I just want to say... if I don't make it... ${pronouns(_rp(confCandidates.filter(c => c !== d) || confCandidates)).Sub}'s fault."`,
        ];
        roundEvents.push({
          type: 'pbConfessional', players: [d],
          text: _rp(_confTexts),
          badge: 'CONFESSIONAL', badgeText: 'CONFESSIONAL', badgeClass: ''
        });
      }
    }

    // ── NEW: Hunter trash talk — hunter taunts from position of power ──
    if (specialEventsThisRound < maxSpecialEvents) {
      const trashTalkers = tribes.flatMap(t => roles[t.name].hunters).filter(h => !misfiredHunters.has(h) && pStats(h).boldness >= 5);
      if (trashTalkers.length && Math.random() < 0.22) {
        const h = _rp(trashTalkers);
        const pr = pronouns(h);
        specialEventsThisRound++;
        const _trashTexts = [
          `${h} stands on a rock and yells into the forest: "YOU CAN'T HIDE FOREVER!" The deer disagree.`,
          `${h} is openly walking through the woods, gun raised, narrating ${pr.posAdj} own hunt like a nature documentary.`,
          `${h} starts counting out loud: "That's ${hunterHits[h] || 0} down... who's next?" Confident. Maybe too confident.`,
          `${h} whistles casually while patrolling. Either ${pr.sub}'s brave or ${pr.sub}'s trying to scare them out.`,
        ];
        roundEvents.push({
          type: 'pbHunterTrashTalk', players: [h],
          text: _rp(_trashTexts),
          badge: 'TRASH TALK', badgeText: 'TRASH TALK', badgeClass: ''
        });
      }
    }

    // ── NEW: Close call — deer barely avoids being spotted ──
    if (specialEventsThisRound < maxSpecialEvents) {
      const closeCandidates = [...allMembers].filter(m => isDeer(m) && !paintedOut.has(m) && !camouflaged.has(m) && !treeClimbed.has(m));
      if (closeCandidates.length && Math.random() < 0.25) {
        const d = _rp(closeCandidates);
        const pr = pronouns(d);
        specialEventsThisRound++;
        const nearHunter = _rp(tribes.filter(t => t.name !== tribeOf[d]).flatMap(t => roles[t.name].hunters));
        const _closeTexts = [
          `${nearHunter} walks within inches of ${d}'s hiding spot. ${d} holds ${pr.posAdj} breath. The hunter moves on. CLOSE.`,
          `A branch snaps under ${d}'s foot. ${nearHunter} whips around — but ${d} is already gone. Heart pounding.`,
          `${d} ducks behind a tree just as ${nearHunter} sweeps the area. ${pr.Sub} can hear ${pronouns(nearHunter).posAdj} footsteps. Too close.`,
          `${nearHunter}'s paintball whizzes past ${d}'s ear. An inch to the left and ${pr.sub}'d be out. ${d} doesn't breathe for ten seconds.`,
        ];
        roundEvents.push({
          type: 'pbCloseCall', players: [d, nearHunter],
          text: _rp(_closeTexts),
          badge: 'CLOSE CALL', badgeText: 'CLOSE CALL', badgeClass: ''
        });
      }
    }

    // ── Friendly fire: accidental and deliberate (runs BEFORE matchups so eliminations are respected) ──
    tribes.forEach(t => {
      roles[t.name].hunters.forEach(hunter => {
        if (misfiredHunters.has(hunter)) return;
        const s = pStats(hunter);

        // Own team deer
        const ownDeer = roles[t.name].deer.filter(d => !paintedOut.has(d));
        if (!ownDeer.length) return;

        // Accidental friendly fire
        const accidentChance = (10 - s.intuition) * 0.015 + (10 - s.mental) * 0.01;
        if (Math.random() < accidentChance) {
          const victim = _rp(ownDeer);
          const pr = pronouns(hunter);
          addBond(hunter, victim, -0.4);
          addScore(hunter, -1.0);
          addScore(victim, -0.5); // hurt but NOT eliminated
          camouflaged.delete(victim); // paint ruins any camo
          treeClimbed.delete(victim); // knocked out of tree
          newMudSlid.add(victim); // exposed
          paintCounter[victim] = (paintCounter[victim] || 0) + 1;
          if (!ep._pbMarked) ep._pbMarked = {};
          ep._pbMarked[victim] = (ep._pbMarked[victim] || 0) + 4; // big target increase
          friendlyFireLog.push({ hunter, victim, type: 'accidental', round: roundNum });
          roundEvents.push({
            type: 'pbFriendlyFireAccident', players: [hunter, victim],
            text: `${hunter} accidentally shoots ${pr.posAdj} OWN teammate ${victim}! "${pronouns(victim).Sub}'s on YOUR team!" someone yells. The paint gives away ${pronouns(victim).posAdj} position.`,
            badge: 'FRIENDLY FIRE', badgeText: 'FRIENDLY FIRE', badgeClass: 'red'
          });
          return;
        }

        // Deliberate friendly fire: bond <= -2 with own deer
        // Does NOT eliminate deer — betrayal that marks them as easy target
        ownDeer.forEach(d => {
          if (getBond(hunter, d) <= -2) {
            const deliberateChance = (10 - s.loyalty) * 0.02 + s.boldness * 0.015;
            if (Math.random() < deliberateChance) {
              addBond(hunter, d, -1.0);
              addScore(hunter, HUNTER_NEGATIVE);
              addScore(d, -0.5);
              camouflaged.delete(d); // paint ruins any camo
              treeClimbed.delete(d); // knocked out of tree
              newMudSlid.add(d);
              paintCounter[d] = (paintCounter[d] || 0) + 1;
              friendlyFireLog.push({ hunter, victim: d, type: 'deliberate', round: roundNum });
              const pr = pronouns(hunter);
              roundEvents.push({
                type: 'pbFriendlyFireDeliberate', players: [hunter, d],
                text: `${hunter} DELIBERATELY shoots ${d} — ${pr.posAdj} own teammate! That was NO accident.`,
                badge: 'BETRAYAL', badgeText: 'BETRAYAL', badgeClass: 'red'
              });

              // ALWAYS: deer is marked — paint + noise = easy to spot next round
              if (!ep._pbMarked) ep._pbMarked = {};
              ep._pbMarked[d] = (ep._pbMarked[d] || 0) + 5;

              // SOMETIMES: Retaliation — deer fights back (boldness proportional)
              const dStats = pStats(d);
              if (Math.random() < dStats.boldness * 0.08) {
                addBond(d, hunter, -0.5);
                addScore(d, DEER_EVENT_BONUS);
                misfiredHunters.add(hunter);
                const dpr = pronouns(d);
                paintballWarLog.push({ instigator: hunter, retaliator: d, round: roundNum });
                const _retalTexts = [
                  `${d} grabs a paintball gun and shoots ${hunter} right back! ${dpr.Sub}'s not taking that lying down.`,
                  `${d} charges ${hunter} and wrestles the gun away. Two shots to the chest. "How's THAT feel?!"`,
                  `${d} doesn't run. ${dpr.Sub} picks up a dropped gun and unloads on ${hunter}. The deer has become the hunter.`,
                ];
                roundEvents.push({
                  type: 'pbRetaliation', players: [d, hunter],
                  text: _rp(_retalTexts),
                  badge: 'RETALIATION', badgeText: 'RETALIATION', badgeClass: 'red'
                });

                const witnesses = t.members.filter(m => m !== hunter && m !== d && Math.random() < 0.5);
                if (witnesses.length) {
                  witnesses.forEach(w => addBond(w, hunter, -0.3));
                  roundEvents.push({
                    type: 'pbWarEscalation', players: [d, hunter, ...witnesses],
                    text: `It's a full-on PAINTBALL WAR! ${witnesses.join(' and ')} jump${witnesses.length === 1 ? 's' : ''} in. Paint is flying everywhere.`,
                    badge: 'PAINTBALL WAR', badgeText: 'PAINTBALL WAR', badgeClass: 'red'
                  });
                }
              }
            }
          }
        });
      });
    });

    // ── HUNTER MATCHUPS ──
    // Balance: each tribe gets the same number of shots per round (= min hunter count across tribes)
    // Extra hunters rotate — they sit out this round but contribute to events
    const minHunters = Math.min(...tribes.map(t => roles[t.name].hunters.filter(h => !misfiredHunters.has(h)).length));
    const shotsPerTribe = Math.max(1, minHunters); // at least 1 shot per tribe

    tribes.forEach(t => {
      const availableHunters = roles[t.name].hunters.filter(h => !misfiredHunters.has(h));
      // Rotate which hunters shoot: shuffle and take shotsPerTribe
      const shuffledHunters = [...availableHunters].sort(() => Math.random() - 0.5);
      const activeHunters = shuffledHunters.slice(0, shotsPerTribe);

      activeHunters.forEach(hunter => {

        const s = pStats(hunter);
        const hunterTribe = t.name;
        const opposingDeer = getOpposingDeer(hunterTribe);
        if (!opposingDeer.length) return;

        // Search check — find rate improves each round as hunters learn terrain
        const searchScore = s.intuition * 0.04 + s.physical * 0.01 + Math.random() * 0.2 + fatigue;
        if (searchScore < 0.35) {
          addScore(hunter, HUNTER_NOTHING);
          matchups.push({ hunter, result: 'nothing', round: roundNum });
          return;
        }

        // Target found
        const target = pickTargetDeer(opposingDeer);
        if (!target) {
          addScore(hunter, HUNTER_NOTHING);
          matchups.push({ hunter, result: 'nothing', round: roundNum });
          return;
        }

        // ── Hunter protects deer (showmance, spark, or high bond with opposing deer) ──
        if (seasonConfig.romance !== 'disabled' && specialEventsThisRound < maxSpecialEvents) {
          const _hasShowmance = gs.showmances?.some(sm =>
            (sm.players[0] === hunter && sm.players[1] === target) ||
            (sm.players[1] === hunter && sm.players[0] === target)
          );
          const _hasSpark = gs.romanticSparks?.some(sp =>
            sp.players.includes(hunter) && sp.players.includes(target) && !sp.fake
          );
          const _highBond = getBond(hunter, target) >= 4;
          if (_hasShowmance || _hasSpark || (_highBond && Math.random() < 0.3)) {
            specialEventsThisRound++;
            addScore(hunter, -1.5);
            const pr = pronouns(hunter);
            const _protTexts = [
              `${hunter} has ${target} dead to rights... but lowers ${pr.posAdj} gun. ${pr.Sub} can't shoot ${pronouns(target).obj}. Not ${pronouns(target).obj}.`,
              `${hunter} freezes. The gun is aimed at ${target}. ${pr.Sub} knows what ${pr.sub} should do. ${pr.Sub} can't.`,
              `${hunter} and ${target} lock eyes through the scope. ${hunter} lowers the gun. "Go. Just go."`,
              `${hunter} spots ${target} — easy shot. But ${pr.posAdj} finger won't pull the trigger. Some things matter more than winning.`,
            ];
            roundEvents.push({
              type: 'pbHunterProtects', players: [hunter, target],
              text: _rp(_protTexts),
              badge: 'PROTECTION', badgeText: 'PROTECTION', badgeClass: 'gold'
            });
            if (_hasShowmance || _hasSpark) _checkShowmanceChalMoment(ep, roundKey, phases, personalScores, 'danger', tribes);
            matchups.push({ hunter, target, result: 'protect', round: roundNum });
            return;
          }
        }

        // ── Ambush: strategic proportional ──
        let ambushed = false;
        if (Math.random() < s.strategic * 0.04 && specialEventsThisRound < maxSpecialEvents) {
          specialEventsThisRound++;
          ambushed = true;
          addScore(hunter, HUNTER_HIT + HUNTER_EVENT_BONUS);
          addScore(target, DEER_PAINTED);
          paintedOut.add(target);
          unpaintedDeer[tribeOf[target]].delete(target);
          paintCounter[target] = (paintCounter[target] || 0) + 1;
          hunterHits[hunter] = (hunterHits[hunter] || 0) + 1;
          roundEvents.push({
            type: 'pbAmbush', players: [hunter, target],
            text: `${hunter} ambushes ${target} from behind a tree! Perfect shot — ${target} never saw it coming.`,
            badge: 'AMBUSH', badgeText: 'AMBUSH', badgeClass: 'gold'
          });
          matchups.push({ hunter, target, result: 'ambush', round: roundNum });
          return;
        }

        // ── Sneak attack: intuition proportional ──
        if (!ambushed && Math.random() < s.intuition * 0.05 && specialEventsThisRound < maxSpecialEvents) {
          specialEventsThisRound++;
          addScore(hunter, HUNTER_HIT + HUNTER_EVENT_BONUS);
          addScore(target, DEER_PAINTED);
          paintedOut.add(target);
          unpaintedDeer[tribeOf[target]].delete(target);
          paintCounter[target] = (paintCounter[target] || 0) + 1;
          hunterHits[hunter] = (hunterHits[hunter] || 0) + 1;
          roundEvents.push({
            type: 'pbSneakAttack', players: [hunter, target],
            text: `${hunter} creeps through the undergrowth and catches ${target} completely off guard. Splat!`,
            badge: 'SNEAK ATTACK', badgeText: 'SNEAK ATTACK', badgeClass: 'gold'
          });
          matchups.push({ hunter, target, result: 'sneak', round: roundNum });
          return;
        }

        // ── Decoy: deer strategic proportional ──
        const targetStats = pStats(target);
        if (Math.random() < targetStats.strategic * 0.03 && specialEventsThisRound < maxSpecialEvents) {
          specialEventsThisRound++;
          addScore(target, DEER_EVENT_BONUS);
          addScore(hunter, HUNTER_NOTHING);
          const pr = pronouns(target);
          roundEvents.push({
            type: 'pbDecoy', players: [target, hunter],
            text: `${target} leaves a decoy and lures ${hunter} in completely the wrong direction. ${pr.Sub} bought ${pr.ref} another round.`,
            badge: 'DECOY', badgeText: 'DECOY', badgeClass: 'gold'
          });
          matchups.push({ hunter, target, result: 'decoy', round: roundNum });
          return;
        }

        // ── Taunt: deer boldness + disloyalty proportional ──
        if (Math.random() < (targetStats.boldness * 0.03 + (10 - targetStats.loyalty) * 0.02) && specialEventsThisRound < maxSpecialEvents) {
          specialEventsThisRound++;
          addScore(hunter, -0.5);
          addScore(target, 1.0);
          const pr = pronouns(target);
          roundEvents.push({
            type: 'pbTaunt', players: [target, hunter],
            text: `${target} taunts ${hunter} from behind cover, waving ${pr.posAdj} arms and making faces. ${hunter} is NOT amused.`,
            badge: 'TAUNT', badgeText: 'TAUNT', badgeClass: ''
          });
        }

        // ── Standard shot attempt ──
        // ~45% hit rate — with ~55% find rate and ~2 shots/tribe/round, expect ~1 elimination per round across all tribes
        const hunterScore = s.physical * 0.03 + s.intuition * 0.035 + Math.random() * 0.18 + (hunterHitBonus[hunter] || 0);
        const dodgeBonus = (stampedeDeer.has(target) ? 0.15 : 0) + (deerDodgeBonus[target] || 0);
        const normPenalty = (deerNorm[tribeOf[target]] - 1) * 0.05;
        // Fatigue reduces dodge as deer tire out each round
        const deerScore = targetStats.endurance * 0.035 + targetStats.intuition * 0.03 + targetStats.boldness * 0.02 + Math.random() * 0.17 + dodgeBonus - normPenalty - fatigue;

        // Epic chase: scores within 10%
        const scoreDiff = Math.abs(hunterScore - deerScore);
        const avgScore = (hunterScore + deerScore) / 2;
        if (avgScore > 0 && scoreDiff / avgScore < 0.10 && specialEventsThisRound < maxSpecialEvents) {
          specialEventsThisRound++;
          addScore(hunter, 1.0);
          addScore(target, 1.0);
          roundEvents.push({
            type: 'pbEpicChase', players: [hunter, target],
            text: `${hunter} and ${target} go blow for blow through the forest — dodging, shooting, diving. The camera crew can barely keep up.`,
            badge: 'EPIC CHASE', badgeText: 'EPIC CHASE', badgeClass: 'gold'
          });
        }

        // Obsessive chase: hunter targets same deer twice
        if (obsessiveTargets[hunter] === target && specialEventsThisRound < maxSpecialEvents) {
          specialEventsThisRound++;
          if (hunterScore > deerScore) {
            addScore(hunter, 1.0); // bonus on top of hit
            roundEvents.push({
              type: 'pbObsessiveChase', players: [hunter, target],
              text: `${hunter} tracked ${target} AGAIN — and this time ${pronouns(hunter).Sub} finishes the job. Obsession pays off.`,
              badge: 'OBSESSED', badgeText: 'OBSESSED', badgeClass: 'gold'
            });
          } else {
            addScore(hunter, -1.5); // penalty for missing again
            roundEvents.push({
              type: 'pbObsessiveChase', players: [hunter, target],
              text: `${hunter} went after ${target} AGAIN and missed AGAIN. This is getting embarrassing.`,
              badge: 'OBSESSED', badgeText: 'OBSESSED', badgeClass: 'red'
            });
          }
        }
        obsessiveTargets[hunter] = target;

        if (hunterScore > deerScore) {
          // HIT
          addScore(hunter, HUNTER_HIT);
          addScore(target, DEER_PAINTED);
          paintedOut.add(target);
          unpaintedDeer[tribeOf[target]].delete(target);
          paintCounter[target] = (paintCounter[target] || 0) + 1;
          hunterHits[hunter] = (hunterHits[hunter] || 0) + 1;
          const _hitTexts = [
            `${hunter} takes aim and fires — ${target} takes a paintball right to the chest. Out.`,
            `${hunter} catches ${target} in the open. One shot. Done.`,
            `${target} turns a corner and walks right into ${hunter}'s line of fire. Splat.`,
            `${hunter} lines up the shot and pulls the trigger. ${target} goes down in ${tribeColor(tribeOf[hunter])} paint.`,
            `${target} thought ${pronouns(target).sub} was safe. ${hunter} proves otherwise. Clean hit.`,
          ];
          matchups.push({ hunter, target, result: 'hit', round: roundNum, text: _rp(_hitTexts) });
        } else {
          // MISS
          addScore(hunter, HUNTER_MISS);
          addScore(target, DEER_DODGE);
          hunterMisses[hunter] = (hunterMisses[hunter] || 0) + 1;
          const _missTexts = [
            `${hunter} fires — ${target} dives behind a log just in time. The paint splatters the tree behind ${pronouns(target).obj}.`,
            `${hunter} squeezes the trigger but ${target} is already moving. The shot goes wide.`,
            `${target} hears the shot coming and drops flat. The paintball sails over ${pronouns(target).posAdj} head.`,
            `${hunter} aims, shoots — and watches ${target} dodge at the last second. So close.`,
            `${target} jukes left and ${hunter}'s shot hits nothing but air. ${pronouns(target).Sub}'s still alive.`,
          ];
          matchups.push({ hunter, target, result: 'miss', round: roundNum, text: _rp(_missTexts) });
        }

        // ── Rare double find: intuition proportional ──
        if (Math.random() < s.intuition * 0.02) {
          const secondTargetPool = getOpposingDeer(hunterTribe).filter(d => d !== target && !camouflaged.has(d) && !treeClimbed.has(d));
          if (secondTargetPool.length) {
            const target2 = pickTargetDeer(secondTargetPool) || _rp(secondTargetPool);
            const ts2 = pStats(target2);
            const hunterScore2 = s.physical * 0.03 + s.intuition * 0.035 + Math.random() * 0.18 + (hunterHitBonus[hunter] || 0);
            const deerScore2 = ts2.endurance * 0.035 + ts2.intuition * 0.03 + ts2.boldness * 0.02 + Math.random() * 0.17 - fatigue;
            if (hunterScore2 > deerScore2) {
              addScore(hunter, HUNTER_HIT);
              addScore(target2, DEER_PAINTED);
              paintedOut.add(target2);
              unpaintedDeer[tribeOf[target2]].delete(target2);
              paintCounter[target2] = (paintCounter[target2] || 0) + 1;
              hunterHits[hunter] = (hunterHits[hunter] || 0) + 1;
              const _dfTexts = [
                `${hunter} spots a SECOND deer — ${target2}! ${pronouns(hunter).Sub}'s lining up another shot...`,
                `${hunter} catches movement in the corner of ${pronouns(hunter).posAdj} eye — ${target2} is right there. Going for the double.`,
                `${hunter} isn't done. ${pronouns(hunter).Sub}'s already locked onto ${target2}. Two in one round.`,
              ];
              matchups.push({ hunter, target: target2, result: 'double-hit', round: roundNum,
                text: _rp(_dfTexts) });
            } else {
              addScore(hunter, HUNTER_MISS);
              addScore(target2, DEER_DODGE);
              hunterMisses[hunter] = (hunterMisses[hunter] || 0) + 1;
              matchups.push({ hunter, target: target2, result: 'double-miss', round: roundNum });
            }
          }
        }

        // ── Sympathy shot: hunter shoots already-painted deer (petty archetypes only) ──
        const _sympArch = players.find(p => p.name === hunter)?.archetype || '';
        const _sympPetty = ['villain', 'chaos-agent', 'schemer', 'hothead'].includes(_sympArch);
        if (_sympPetty && Math.random() < s.boldness * 0.02 + (10 - s.loyalty) * 0.01) {
          const alreadyPainted = [...paintedOut].filter(d => tribeOf[d] !== hunterTribe);
          if (alreadyPainted.length) {
            const sympTarget = _rp(alreadyPainted);
            addBond(hunter, sympTarget, -0.5);
            paintCounter[sympTarget] = (paintCounter[sympTarget] || 0) + 1;
            roundEvents.push({
              type: 'pbSympathyShot', players: [hunter, sympTarget],
              text: `${hunter} shoots ${sympTarget} even though ${pronouns(sympTarget).Sub}'s already out! Just piling on at this point.`,
              badge: 'PILING ON', badgeText: 'PILING ON', badgeClass: 'red'
            });
          }
        }
      });
    });

    // ── Hunter rivalry: two hunters targeting same deer, both high boldness ──
    const hunterTargetMap = {};
    matchups.filter(m => m.round === roundNum && m.target).forEach(m => {
      if (!hunterTargetMap[m.target]) hunterTargetMap[m.target] = [];
      hunterTargetMap[m.target].push(m.hunter);
    });
    Object.entries(hunterTargetMap).forEach(([target, hunters]) => {
      if (hunters.length >= 2 && specialEventsThisRound < maxSpecialEvents) {
        const h1 = hunters[0], h2 = hunters[1];
        const b1 = pStats(h1).boldness, b2 = pStats(h2).boldness;
        if ((b1 + b2) * 0.04 > Math.random()) {
          specialEventsThisRound++;
          addBond(h1, h2, -0.3);
          roundEvents.push({
            type: 'pbHunterRivalry', players: [h1, h2, target],
            text: `${h1} and ${h2} both zero in on ${target} — and end up competing against each other instead. Neither gets the shot.`,
            badge: 'RIVALRY', badgeText: 'RIVALRY', badgeClass: 'red'
          });
        }
      }
    });

    // ── Showmance moments via helper ──
    if (seasonConfig.romance !== 'disabled') {
      _checkShowmanceChalMoment(ep, roundKey, phases, personalScores, 'danger', tribes);
    }

    // ── Award per-round survival to unpainted deer ──
    tribes.forEach(t => {
      unpaintedDeer[t.name].forEach(d => {
        addScore(d, DEER_PER_ROUND);
      });
    });

    // Update mud slide set for next round
    mudSlid.clear();
    newMudSlid.forEach(d => mudSlid.add(d));

    // ── Build interleaved timeline (matchups + events shuffled together, stored once) ──
    const roundMatchups = matchups.filter(m => m.round === roundNum);
    const _nothingM = roundMatchups.filter(m => m.result === 'nothing');
    const _realM = roundMatchups.filter(m => m.result !== 'nothing');
    // Collect deer painted this round (by matchups or friendly fire) — events involving them are invalid
    const _paintedThisRound = new Set(
      _realM.filter(m => m.result === 'hit' || m.result === 'ambush' || m.result === 'sneak' || m.result === 'double-hit' || m.result === 'friendly-fire').map(m => m.target)
    );
    // Also track FF victims this round — their camo/tree events are invalid (paint ruined it)
    const _ffVictims = new Set(friendlyFireLog.filter(f => f.round === roundNum).map(f => f.victim));
    // Filter events: drop events for eliminated deer OR protective events for FF victims
    const _validEvents = roundEvents.filter(ev => {
      if (!ev.players?.length) return true;
      // Drop any event involving eliminated deer
      if (ev.players.some(p => _paintedThisRound.has(p) && isDeer(p))) return false;
      // Drop camo/tree for FF victims (paint ruins the hide)
      if ((ev.type === 'pbCamouflage' || ev.type === 'pbTreeClimb') && ev.players.some(p => _ffVictims.has(p))) return false;
      return true;
    });
    // Separate FF chains (betrayal→retaliation→war must stay in order) from shuffleable items
    const _ffChainTypes = new Set(['pbFriendlyFireAccident', 'pbFriendlyFireDeliberate', 'pbRetaliation', 'pbWarEscalation']);
    const _ffChain = _validEvents.filter(ev => _ffChainTypes.has(ev.type));
    const _nonChainEvents = _validEvents.filter(ev => !_ffChainTypes.has(ev.type));

    // Build shuffleable items (matchups + non-chain events)
    const _shuffleable = [];
    _realM.forEach(m => _shuffleable.push({ kind: 'matchup', ...m }));
    _nonChainEvents.forEach(ev => _shuffleable.push({ kind: 'event', ...ev }));
    for (let _ti = _shuffleable.length - 1; _ti > 0; _ti--) {
      const _tj = Math.floor(Math.random() * (_ti + 1));
      [_shuffleable[_ti], _shuffleable[_tj]] = [_shuffleable[_tj], _shuffleable[_ti]];
    }

    // Insert FF chain as a block at a random position in the shuffled timeline
    const _timeline = [..._shuffleable];
    if (_ffChain.length) {
      const _insertAt = Math.floor(Math.random() * (_timeline.length + 1));
      const _chainItems = _ffChain.map(ev => ({ kind: 'event', ...ev }));
      _timeline.splice(_insertAt, 0, ..._chainItems);
    }
    // Append "nothing" batch at the end
    if (_nothingM.length) _timeline.push({ kind: 'nothing-batch', hunters: _nothingM.map(m => m.hunter) });

    // ── Save round data ──
    rounds.push({
      round: roundNum,
      name: roundName,
      timeline: _timeline,
      matchups: roundMatchups,
      events: roundEvents,
      unpaintedByTribe: Object.fromEntries(tribes.map(t => [t.name, [...unpaintedDeer[t.name]]])),
      paintedThisRound: roundMatchups.filter(m => m.result === 'hit' || m.result === 'ambush' || m.result === 'sneak' || m.result === 'double-hit' || m.result === 'friendly-fire').map(m => m.target)
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // WINNER DETERMINATION
  // ══════════════════════════════════════════════════════════════════
  const tribesWithDeerLeft = tribes.filter(t => unpaintedDeer[t.name].size > 0);
  let winner, loser;

  if (tribes.length >= 3) {
    // First tribe fully painted out = loser
    const eliminationOrder = [];
    rounds.forEach(r => {
      tribes.forEach(t => {
        if (!eliminationOrder.includes(t.name) && unpaintedDeer[t.name].size === 0) {
          eliminationOrder.push(t.name);
        }
      });
    });
    // Also add any still-painted-out tribes
    tribes.forEach(t => {
      if (!eliminationOrder.includes(t.name) && unpaintedDeer[t.name].size === 0) {
        eliminationOrder.push(t.name);
      }
    });

    loser = tribes.find(t => t.name === eliminationOrder[0]) || tribes.find(t => unpaintedDeer[t.name].size === 0);
    // Winner: tribe with most unpainted deer; tiebreak: fewer total paint hits
    const candidates = tribes.filter(t => t !== loser);
    candidates.sort((a, b) => {
      const aDeer = unpaintedDeer[a.name].size;
      const bDeer = unpaintedDeer[b.name].size;
      if (bDeer !== aDeer) return bDeer - aDeer;
      const aHits = a.members.reduce((sum, m) => sum + (paintCounter[m] || 0), 0);
      const bHits = b.members.reduce((sum, m) => sum + (paintCounter[m] || 0), 0);
      return aHits - bHits;
    });
    winner = candidates[0];
    if (!loser) loser = candidates[candidates.length - 1];
  } else {
    // 2 tribes
    if (tribesWithDeerLeft.length === 1) {
      winner = tribesWithDeerLeft[0];
      loser = tribes.find(t => t !== winner);
    } else if (tribesWithDeerLeft.length === 0) {
      // Both wiped out — tiebreaker: fewer total paint hits
      const sorted = [...tribes].sort((a, b) => {
        const aHits = a.members.reduce((sum, m) => sum + (paintCounter[m] || 0), 0);
        const bHits = b.members.reduce((sum, m) => sum + (paintCounter[m] || 0), 0);
        return aHits - bHits;
      });
      winner = sorted[0];
      loser = sorted[1];
    } else {
      // Both still have deer — tiebreaker
      const sorted = [...tribes].sort((a, b) => {
        const aDeer = unpaintedDeer[a.name].size;
        const bDeer = unpaintedDeer[b.name].size;
        if (bDeer !== aDeer) return bDeer - aDeer;
        const aHits = a.members.reduce((sum, m) => sum + (paintCounter[m] || 0), 0);
        const bHits = b.members.reduce((sum, m) => sum + (paintCounter[m] || 0), 0);
        return aHits - bHits;
      });
      winner = sorted[0];
      loser = sorted[1];
    }
  }

  // ── MVP: last deer standing on winning tribe ──
  let mvp = null;
  const winnerDeerAlive = [...unpaintedDeer[winner.name]];
  if (winnerDeerAlive.length) {
    // Pick the one with highest personal score
    mvp = winnerDeerAlive.reduce((best, d) => (personalScores[d] || 0) > (personalScores[best] || 0) ? d : best, winnerDeerAlive[0]);
    addScore(mvp, DEER_SURVIVOR);
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[mvp] = (gs.popularity[mvp] || 0) + 2;
  }

  // ── Award full-hunt survival bonus to all surviving deer ──
  tribes.forEach(t => {
    unpaintedDeer[t.name].forEach(d => {
      if (d !== mvp) addScore(d, DEER_SURVIVOR);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // CAMP EVENTS
  // ══════════════════════════════════════════════════════════════════

  // MVP Hunter: most hits on winning tribe
  const winnerHunters = roles[winner.name].hunters;
  if (winnerHunters.length) {
    const topHunter = winnerHunters.reduce((best, h) => (hunterHits[h] || 0) > (hunterHits[best] || 0) ? h : best, winnerHunters[0]);
    if ((hunterHits[topHunter] || 0) > 0) {
      const pr = pronouns(topHunter);
      ep.campEvents[winner.name].post.push({
        type: 'pbMVPHunter', players: [topHunter],
        text: `${topHunter} was the deadliest hunter out there — ${hunterHits[topHunter]} hit${hunterHits[topHunter] !== 1 ? 's' : ''}. ${pr.Sub} carried the team.`,
        consequences: 'Challenge MVP recognition.',
        badgeText: 'TOP HUNTER', badgeClass: 'gold'
      });
    }
  }

  // Last Deer Standing
  if (mvp) {
    const pr = pronouns(mvp);
    ep.campEvents[winner.name].post.push({
      type: 'pbLastDeer', players: [mvp],
      text: `${mvp} was the last deer standing — untouched, uncatchable. ${pr.Sub} single-handedly won this for ${pr.posAdj} tribe.`,
      consequences: '+4.0 score, +2 popularity.',
      badgeText: 'LAST DEER', badgeClass: 'gold'
    });
  }

  // Rebellion Hero (if any rebellion events)
  const rebellionEvents = rounds.flatMap(r => r.events).filter(e => e.type === 'pbRebellion');
  if (rebellionEvents.length) {
    const hero = rebellionEvents[0].players[0];
    ep.campEvents[tribeOf[hero]].post.push({
      type: 'pbRebellionHero', players: [hero],
      text: `${hero} stole a hunter's gun and turned the tables. Legend.`,
      consequences: 'Rebellion hero status.',
      badgeText: 'REBELLION HERO', badgeClass: 'gold'
    });
  }

  // Negative: Friendly Fire culprit
  if (friendlyFireLog.length) {
    const culprit = friendlyFireLog[0].hunter;
    const pr = pronouns(culprit);
    const campKey = tribeOf[culprit];
    ep.campEvents[campKey].post.push({
      type: 'pbFriendlyFireCulprit', players: [culprit],
      text: `${culprit} shot ${pr.posAdj} own teammate. ${friendlyFireLog[0].type === 'deliberate' ? 'And it wasn\'t an accident.' : 'At least... it looked like an accident.'}`,
      consequences: 'Bond damage with victim.',
      badgeText: 'FRIENDLY FIRE', badgeClass: 'red'
    });
  }

  // Negative: First Deer Painted
  const allMatchups = rounds.flatMap(r => r.matchups || []);
  const firstPainted = allMatchups.find(m => m.result === 'hit' || m.result === 'ambush' || m.result === 'sneak' || m.result === 'friendly-fire');
  if (firstPainted) {
    const target = firstPainted.target;
    const pr = pronouns(target);
    const campKey = tribeOf[target];
    ep.campEvents[campKey].post.push({
      type: 'pbFirstPainted', players: [target],
      text: `${target} was the first deer painted out. ${pr.Sub} didn't last five minutes.`,
      consequences: 'First out shame.',
      badgeText: 'FIRST PAINTED', badgeClass: 'red'
    });
  }

  // Negative: Paintball War instigator
  if (paintballWarLog.length) {
    const instigator = paintballWarLog[0].instigator;
    const campKey = tribeOf[instigator];
    ep.campEvents[campKey].post.push({
      type: 'pbWarInstigator', players: [instigator],
      text: `${instigator} started a paintball war with ${pronouns(instigator).posAdj} own tribe. The other team loved it.`,
      consequences: 'Bond damage, free shots for opponents.',
      badgeText: 'WAR STARTER', badgeClass: 'red'
    });
  }

  // Negative: Bear Mauled
  bearMauledList.forEach(name => {
    const pr = pronouns(name);
    const campKey = tribeOf[name];
    ep.campEvents[campKey].post.push({
      type: 'pbBearMauled', players: [name],
      text: `${name} got mauled by a bear during the hunt. ${pr.Sub}'s going to feel that for a while.`,
      consequences: 'Lingering injury (2 episodes), +2.0 heat.',
      badgeText: 'BEAR MAULED', badgeClass: 'red'
    });
  });

  // ── Push round social events to campEvents ──
  rounds.forEach(r => {
    r.events.forEach(evt => {
      if (evt.players?.length) {
        const evtTribe = tribeOf[evt.players[0]] || winner.name;
        if (!ep.campEvents[evtTribe]) ep.campEvents[evtTribe] = { pre: [], post: [] };
        if (!ep.campEvents[evtTribe].post) ep.campEvents[evtTribe].post = [];
        // Don't duplicate — only push social/bond events (hunt events already covered above)
        if (['pbDeerBonding', 'pbCrossTribeEncounter', 'pbDeerPact', 'pbHunterScheme', 'pbCrossRoleWhisper', 'pbAllianceMeeting', 'pbAllianceRebellion'].includes(evt.type)) {
          ep.campEvents[evtTribe].post.push(evt);
        }
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // EPISODE DATA + FINALIZATION
  // ══════════════════════════════════════════════════════════════════
  ep.paintballHunt = {
    roles,
    rounds,
    paintCounter,
    friendlyFire: friendlyFireLog,
    paintballWar: paintballWarLog,
    bearMauled: bearMauledList,
    winner: winner.name,
    loser: loser.name,
    mvp
  };

  ep.winner = winner;
  ep.loser = loser;
  ep.safeTribes = tribes.length > 2 ? tribes.filter(t => t !== winner && t !== loser) : [];
  ep.challengeType = 'tribe';
  ep.immunePlayers = winner.members.slice();
  ep.tribalPlayers = loser.members.filter(m => gs.activePlayers.includes(m));
  ep.challengeLabel = 'Paintball Hunt';
  ep.challengeCategory = 'physical';

  // ── Challenge member scores ──
  ep.chalMemberScores = personalScores;
  updateChalRecord(ep);
}

export function _textPaintballHunt(ep, ln, sec) {
  if (!ep.isPaintballHunt || !ep.paintballHunt) return;
  const pb = ep.paintballHunt;
  sec('PAINTBALL DEER HUNTER');
  ln('Hunters vs deer. Last tribe with unpainted deer wins.');
  Object.entries(pb.roles || {}).forEach(([tribe, roles]) => {
    ln(`${tribe} — Hunters: ${roles.hunters.join(', ')} | Deer: ${roles.deer.join(', ')}`);
  });
  (pb.rounds || []).forEach(r => {
    ln('');
    ln(`── ROUND ${r.round} — ${r.name || ''} ──`);
    (r.matchups || []).forEach(m => {
      if (m.result === 'hit' || m.result === 'ambush' || m.result === 'sneak' || m.result === 'double-hit' || m.result === 'friendly-fire') ln(`  [HIT] ${m.hunter} → ${m.target} PAINTED OUT`);
      else if (m.result === 'miss' || m.result === 'double-miss') ln(`  [MISS] ${m.hunter} → ${m.target} DODGED`);
      else if (m.result === 'nothing') ln(`  [---] ${m.hunter} found nothing`);
      else if (m.result === 'protect') ln(`  [♥] ${m.hunter} refused to shoot ${m.target}`);
      else if (m.result === 'decoy') ln(`  [DECOY] ${m.target} tricked ${m.hunter}`);
    });
    (r.events || []).forEach(evt => {
      ln(`  [${evt.badge || evt.badgeText || evt.type}] ${evt.text}`);
    });
    Object.entries(r.unpaintedByTribe || {}).forEach(([tribe, remaining]) => {
      ln(`  ${tribe}: ${remaining.length} deer remaining`);
    });
  });
  if (pb.bearMauled?.length) ln(`BEAR MAULED: ${pb.bearMauled.join(', ')}`);
  ln(`Winner: ${pb.winner}. ${pb.loser} goes to tribal.`);
  if (pb.mvp) ln(`MVP: ${pb.mvp}`);
}

export function rpBuildPaintballHunt(ep) {
  const pb = ep.paintballHunt;
  if (!pb?.rounds?.length) return null;

  const stateKey = 'pb_reveal_' + ep.num;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // Build flat steps array: each round's matchups + events become sequential reveal steps
  // Use pre-shuffled timeline from simulation (stable across re-renders)
  const steps = [];
  pb.rounds.forEach(r => {
    (r.timeline || []).forEach(item => {
      // stepType = 'matchup', 'event', or 'nothing-batch' (item.kind)
      // data = the item itself (has all original properties: hunter/target/result for matchups, type/text/players for events)
      steps.push({ stepType: item.kind, data: item, round: r.round, roundName: r.name, unpaintedByTribe: r.unpaintedByTribe });
    });
  });
  // Final result step
  steps.push({ stepType: 'result', data: {}, round: 'final' });

  const totalSteps = steps.length;
  const allRevealed = state.idx >= totalSteps - 1;

  const _pbReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // ── Tribe helpers ──
  const tribeNames = Object.keys(pb.roles);
  const tribeOf = {};
  tribeNames.forEach(tn => {
    (pb.roles[tn].hunters || []).forEach(h => { tribeOf[h] = tn; });
    (pb.roles[tn].deer || []).forEach(d => { tribeOf[d] = tn; });
  });

  // ── Compute revealed painted deer up to current step ──
  const revealedPainted = new Set();
  steps.forEach((step, i) => {
    if (i > state.idx) return;
    if (step.stepType === 'matchup') {
      const m = step.data;
      if (m.result === 'hit' || m.result === 'ambush' || m.result === 'sneak' || m.result === 'double-hit' || m.result === 'friendly-fire') {
        revealedPainted.add(m.target);
      }
    }
  });

  // Current round tracking
  let currentRound = 0;

  // ── PAGE HEADER ──
  let html = `<div class="rp-page" style="background:linear-gradient(180deg,#0a1a0a 0%,#0d1117 40%,#0d1117 100%);padding-bottom:60px">
    <div class="rp-eyebrow" style="color:#3fb950">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:3px;text-align:center;color:#3fb950;text-shadow:0 0 20px rgba(63,185,80,0.4);margin-bottom:4px">
      PAINTBALL DEER HUNTER
    </div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:16px">
      ${tribeNames.map(tn => `<span style="color:${tribeColor(tn)}">${tn}</span>`).join(' vs ')}
    </div>`;

  // ── ROLE ASSIGNMENT ──
  html += `<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">`;
  tribeNames.forEach(tn => {
    const tc = tribeColor(tn);
    const r = pb.roles[tn];
    html += `<div style="flex:1;min-width:140px;padding:10px;border-radius:8px;border:1px solid ${tc}33;background:${tc}08">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${tc};margin-bottom:8px;text-transform:uppercase">${tn}</div>
      <div style="margin-bottom:6px">
        <span style="font-size:9px;color:#8b949e;font-weight:600">HUNTERS</span>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:3px">`;
    (r.hunters || []).forEach(h => {
      html += `<div style="display:flex;flex-direction:column;align-items:center;gap:1px">
        ${rpPortrait(h, 'pb-sm')}
        <span style="font-size:8px">🔫</span>
      </div>`;
    });
    html += `</div></div>
      <div>
        <span style="font-size:9px;color:#8b949e;font-weight:600">DEER</span>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:3px">`;
    (r.deer || []).forEach(d => {
      html += `<div style="display:flex;flex-direction:column;align-items:center;gap:1px">
        ${rpPortrait(d, 'pb-sm')}
        <span style="font-size:8px">🦌</span>
      </div>`;
    });
    html += `</div></div>
    </div>`;
  });
  html += `</div>`;

  // ── PAINT COUNTER BAR ──
  html += `<div style="padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid var(--border);margin-bottom:16px">
    <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b949e;margin-bottom:6px;text-align:center">DEER STATUS</div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">`;
  tribeNames.forEach(tn => {
    const tc = tribeColor(tn);
    const allDeer = pb.roles[tn].deer || [];
    const unpaintedCount = allDeer.filter(d => !revealedPainted.has(d)).length;
    html += `<div style="text-align:center">
      <div style="font-size:8px;color:${tc};font-weight:700;margin-bottom:3px">${tn} ${unpaintedCount}/${allDeer.length}</div>
      <div style="display:flex;gap:3px">`;
    allDeer.forEach(d => {
      const isPainted = revealedPainted.has(d);
      if (isPainted) {
        html += `<div style="position:relative"><div style="filter:grayscale(1);opacity:0.4">${rpPortrait(d, 'pb-sm')}</div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(5deg);width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,${tc}cc,${tc}44);pointer-events:none"></div></div>`;
      } else {
        html += `<div style="border:1px solid #3fb95066;border-radius:6px;padding:1px">${rpPortrait(d, 'pb-sm')}</div>`;
      }
    });
    html += `</div></div>`;
  });
  html += `</div></div>`;

  // ── PER-STEP REVEAL CARDS ──
  steps.forEach((step, i) => {
    const isVisible = i <= state.idx;

    // Round header when round changes
    if (step.round !== 'final' && (i === 0 || steps[i - 1].round !== step.round)) {
      const roundColor = step.round <= 2 ? '#3fb950' : step.round <= 4 ? '#f0a500' : '#f85149';
      html += `<div style="text-align:center;padding:8px 0;margin:12px 0 6px">
        <span style="font-family:var(--font-display);font-size:14px;letter-spacing:2px;color:${roundColor};text-shadow:0 0 10px ${roundColor}33">
          ROUND ${step.round} — ${step.roundName}
        </span>
      </div>`;
    }

    if (!isVisible) {
      // Hidden placeholder
      html += `<div style="padding:10px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;opacity:0.08;text-align:center;cursor:pointer"
        onclick="${_pbReveal(i)}">
        <span style="font-size:11px;color:var(--muted)">▶</span>
      </div>`;
      return;
    }

    // ── Visible card ──
    if (step.stepType === 'event') {
      const ev = step.data;
      // Color-code by event type
      let borderColor = '#8b949e', glowStyle = '', emoji = '📢';
      if (ev.type?.includes('Bear') || ev.type?.includes('bear')) { borderColor = '#f85149'; glowStyle = 'box-shadow:0 0 12px rgba(248,81,73,0.3);'; emoji = '🐻'; }
      else if (ev.type?.includes('War') || ev.type?.includes('war') || ev.type?.includes('Retaliation') || ev.type?.includes('retaliation')) { borderColor = '#f85149'; glowStyle = 'animation:targetPulse 1s infinite;'; emoji = '💥'; }
      else if (ev.type?.includes('Rebellion') || ev.type?.includes('rebellion')) { borderColor = '#f0a500'; emoji = '⚔️'; }
      else if (ev.type?.includes('Stampede') || ev.type?.includes('stampede')) { borderColor = '#f0a500'; emoji = '🦌'; }
      else if (ev.type?.includes('Camo') || ev.type?.includes('camo')) { borderColor = '#3fb950'; emoji = '🌿'; }
      else if (ev.type?.includes('Tree') || ev.type?.includes('tree')) { borderColor = '#3fb950'; emoji = '🌲'; }
      else if (ev.type?.includes('Mud') || ev.type?.includes('mud')) { borderColor = '#a57030'; emoji = '💦'; }
      else if (ev.type?.includes('Pact') || ev.type?.includes('pact') || ev.type?.includes('Bond') || ev.type?.includes('bond')) { borderColor = '#d2a8ff'; emoji = '🤝'; }
      else if (ev.type?.includes('Friendly') || ev.type?.includes('friendly')) { borderColor = '#f85149'; emoji = '🔥'; }
      else if (ev.type?.includes('Misfire') || ev.type?.includes('misfire')) { borderColor = '#f85149'; emoji = '🔧'; }
      else if (ev.type?.includes('Ambush') || ev.type?.includes('ambush') || ev.type?.includes('Sneak') || ev.type?.includes('sneak')) { borderColor = '#f0a500'; emoji = '🎯'; }
      else if (ev.type?.includes('Epic') || ev.type?.includes('epic')) { borderColor = '#58a6ff'; emoji = '🏃'; }
      else if (ev.type?.includes('Scheme') || ev.type?.includes('scheme') || ev.type?.includes('Alliance') || ev.type?.includes('alliance') || ev.type?.includes('Plot') || ev.type?.includes('plot')) { borderColor = '#d2a8ff'; emoji = '🗣️'; }
      else if (ev.type?.includes('Whisper') || ev.type?.includes('whisper') || ev.type?.includes('CrossRole') || ev.type?.includes('crossRole')) { borderColor = '#58a6ff'; emoji = '💬'; }
      else if (ev.type?.includes('Taunt') || ev.type?.includes('taunt')) { borderColor = '#f0a500'; emoji = '😤'; }
      else if (ev.type?.includes('Protect') || ev.type?.includes('protect')) { borderColor = '#d2a8ff'; emoji = '💖'; }
      else if (ev.type?.includes('Decoy') || ev.type?.includes('decoy')) { borderColor = '#3fb950'; emoji = '🪤'; }
      else if (ev.type?.includes('Obsessive') || ev.type?.includes('obsessive')) { borderColor = '#f85149'; emoji = '👁️'; }
      else if (ev.type?.includes('Rivalry') || ev.type?.includes('rivalry')) { borderColor = '#f85149'; emoji = '⚡'; }
      else if (ev.type?.includes('CrossTribe') || ev.type?.includes('crossTribe') || ev.type?.includes('Truce') || ev.type?.includes('Standoff')) { borderColor = '#58a6ff'; emoji = '🤞'; }
      else if (ev.type?.includes('Sympathy') || ev.type?.includes('sympathy') || ev.type?.includes('Piling')) { borderColor = '#f85149'; emoji = '😬'; }
      else if (ev.type?.includes('Double') || ev.type?.includes('double')) { borderColor = '#f0a500'; emoji = '🎯'; }

      const badgeColor = ev.badgeClass === 'gold' ? '#f0a500' : ev.badgeClass === 'red' ? '#f85149' : '#58a6ff';

      html += `<div style="padding:12px;margin-bottom:6px;border-radius:8px;border-left:3px solid ${borderColor};background:rgba(255,255,255,0.02);${glowStyle};animation:scrollDrop 0.3s var(--ease-broadcast) both">`;

      // Badge
      if (ev.badgeText) {
        html += `<div style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:1px;color:${badgeColor};background:${badgeColor}18;padding:2px 8px;border-radius:3px;margin-bottom:6px">${ev.badgeText}</div>`;
      }

      // Player portraits
      if (ev.players?.length) {
        html += `<div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap">`;
        ev.players.forEach(p => {
          html += rpPortrait(p, 'pb-sm');
        });
        html += `</div>`;
      }

      // Event text
      html += `<div style="font-size:11px;color:#c9d1d9;line-height:1.5">${emoji} ${ev.text || ''}</div>`;
      html += `</div>`;

    } else if (step.stepType === 'matchup') {
      const m = step.data;
      const isHit = m.result === 'hit' || m.result === 'ambush' || m.result === 'sneak' || m.result === 'double-hit' || m.result === 'friendly-fire';
      const isMiss = m.result === 'miss' || m.result === 'double-miss';
      const isNothing = m.result === 'nothing';
      const isProtect = m.result === 'protect';
      const isDecoy = m.result === 'decoy';

      const hunterTC = tribeOf[m.hunter] ? tribeColor(tribeOf[m.hunter]) : '#8b949e';
      const targetTC = m.target && tribeOf[m.target] ? tribeColor(tribeOf[m.target]) : '#8b949e';

      if (isHit) {
        // ── HIT CARD ──
        const ffColor = m.result === 'friendly-fire' ? '#f85149' : targetTC;
        const ffLabel = m.result === 'friendly-fire' ? 'FRIENDLY FIRE' : 'PAINTED OUT';
        html += `<div style="padding:12px;margin-bottom:6px;border-radius:8px;background:radial-gradient(circle at 70% 50%,${ffColor}15,transparent 70%);border:1px solid ${ffColor}33;animation:scrollDrop 0.3s var(--ease-broadcast) both">`;
        html += `<div style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:1px;color:${ffColor};background:${ffColor}22;padding:2px 8px;border-radius:3px;margin-bottom:8px">${ffLabel}</div>`;
        html += `<div style="display:flex;align-items:center;justify-content:center;gap:14px">`;
        // Hunter portrait
        html += `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
          ${rpPortrait(m.hunter, 'pb-sm')}
          <span style="font-size:7px;color:#8b949e;font-weight:600">HUNTER</span>
        </div>`;
        // Arrow
        html += `<div style="font-size:18px;color:${targetTC}">→</div>`;
        // Deer portrait (greyscale + splat)
        html += `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;position:relative">
          <div style="position:relative">
            <div style="filter:grayscale(1);opacity:0.6">${rpPortrait(m.target, 'pb-sm')}</div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(5deg);width:32px;height:32px;border-radius:50%;background:radial-gradient(circle,${targetTC}cc,${targetTC}44);animation:paintSplat 0.5s ease-out both;pointer-events:none"></div>
          </div>
          <span style="font-size:7px;color:#f85149;font-weight:700">ELIMINATED</span>
        </div>`;
        html += `</div>`;
        // Hit text + narrative if present
        const hitLabel = m.result === 'ambush' ? 'Ambush!' : m.result === 'sneak' ? 'Sneak attack!' : m.result === 'double-hit' ? 'Second shot connects!' : m.result === 'friendly-fire' ? '🔥 FRIENDLY FIRE!' : 'Direct hit!';
        html += `<div style="text-align:center;font-size:10px;color:${m.result === 'friendly-fire' ? '#f85149' : '#8b949e'};margin-top:6px">${m.result === 'friendly-fire' ? '' : '🎯 '}${hitLabel}</div>`;
        if (m.text) html += `<div style="text-align:center;font-size:11px;color:#c9d1d9;margin-top:4px;line-height:1.4">${m.text}</div>`;
        html += `</div>`;

      } else if (isMiss) {
        // ── MISS CARD ──
        html += `<div style="padding:12px;margin-bottom:6px;border-radius:8px;border:1px solid rgba(63,185,80,0.15);background:rgba(63,185,80,0.03);animation:scrollDrop 0.3s var(--ease-broadcast) both">`;
        html += `<div style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:1px;color:#3fb950;background:rgba(63,185,80,0.15);padding:2px 8px;border-radius:3px;margin-bottom:8px">DODGED</div>`;
        html += `<div style="display:flex;align-items:center;justify-content:center;gap:14px">`;
        html += rpPortrait(m.hunter, 'pb-sm');
        html += `<div style="font-size:14px;color:#f85149">✗</div>`;
        html += `<div style="animation:dodgeSlide 0.6s ease-out">${rpPortrait(m.target, 'pb-sm')}</div>`;
        html += `</div>`;
        if (m.text) html += `<div style="text-align:center;font-size:11px;color:#c9d1d9;margin-top:4px;line-height:1.4">${m.text}</div>`;
        else html += `<div style="text-align:center;font-size:10px;color:#8b949e;margin-top:6px">💨 ${m.target?.split(' ')[0] || 'Deer'} dodges!</div>`;
        html += `</div>`;

      } else if (isProtect) {
        // ── PROTECT CARD ──
        html += `<div style="padding:12px;margin-bottom:6px;border-radius:8px;border:1px solid rgba(210,168,255,0.3);background:rgba(210,168,255,0.05);animation:scrollDrop 0.3s var(--ease-broadcast) both">`;
        html += `<div style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:1px;color:#d2a8ff;background:rgba(210,168,255,0.15);padding:2px 8px;border-radius:3px;margin-bottom:8px">PROTECTION</div>`;
        html += `<div style="display:flex;align-items:center;justify-content:center;gap:14px">`;
        html += rpPortrait(m.hunter, 'pb-sm');
        html += `<div style="font-size:18px">💖</div>`;
        html += rpPortrait(m.target, 'pb-sm');
        html += `</div>`;
        html += `<div style="text-align:center;font-size:10px;color:#d2a8ff;margin-top:6px">Couldn't pull the trigger...</div>`;
        html += `</div>`;

      } else if (isDecoy) {
        // ── DECOY CARD ──
        html += `<div style="padding:12px;margin-bottom:6px;border-radius:8px;border:1px solid rgba(63,185,80,0.2);background:rgba(63,185,80,0.03);animation:scrollDrop 0.3s var(--ease-broadcast) both">`;
        html += `<div style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:1px;color:#3fb950;background:rgba(63,185,80,0.15);padding:2px 8px;border-radius:3px;margin-bottom:8px">DECOY</div>`;
        html += `<div style="display:flex;align-items:center;justify-content:center;gap:14px">`;
        html += rpPortrait(m.target, 'pb-sm');
        html += `<div style="font-size:14px;color:#3fb950">🪤</div>`;
        html += `<div style="opacity:0.5;display:flex;flex-direction:column;align-items:center;gap:2px">
          ${rpPortrait(m.hunter, 'pb-sm')}
          <span style="font-size:7px;color:#f85149">FOOLED</span>
        </div>`;
        html += `</div></div>`;
      }

    } else if (step.stepType === 'nothing-batch' && isVisible) {
      // ── COLLAPSED "FOUND NOTHING" ──
      const names = (step.data.hunters || []).map(h => h.split(' ')[0]).join(', ');
      html += `<div style="padding:8px 12px;margin-bottom:4px;border-radius:6px;border:1px solid rgba(255,255,255,0.04);background:rgba(255,255,255,0.01);opacity:0.5;animation:scrollDrop 0.2s var(--ease-broadcast) both">
        <span style="font-size:10px;color:#6e7681">❓ Lost in the woods: ${names}</span>
      </div>`;

    } else if (step.stepType === 'result' && allRevealed) {
      // ── FINAL RESULT ──
      const winTC = tribeColor(pb.winner);
      const loseTC = tribeColor(pb.loser);

      html += `<div style="margin-top:20px;padding:16px;border-radius:10px;border:2px solid ${winTC};background:linear-gradient(135deg,${winTC}10,transparent);text-align:center;animation:scrollDrop 0.4s var(--ease-broadcast) both">`;
      html += `<div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;color:${winTC};text-shadow:0 0 15px ${winTC}44;margin-bottom:4px">
        🏆 ${pb.winner} WINS
      </div>`;
      html += `<div style="font-size:11px;color:#8b949e;margin-bottom:12px">Immunity secured</div>`;

      // MVP spotlight
      if (pb.mvp) {
        const mvpTC = tribeOf[pb.mvp] ? tribeColor(tribeOf[pb.mvp]) : winTC;
        html += `<div style="display:inline-block;padding:12px 20px;border-radius:10px;border:2px solid #f0a500;background:rgba(240,165,0,0.08);margin-bottom:12px">
          <div style="font-size:9px;font-weight:800;letter-spacing:1px;color:#f0a500;margin-bottom:6px">MVP — LAST DEER STANDING</div>
          ${rpPortrait(pb.mvp)}
          <div style="font-size:13px;color:${mvpTC};font-weight:700;margin-top:4px">${pb.mvp}</div>
        </div>`;
      }

      // Loser: all deer splattered
      html += `<div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(255,255,255,0.02)">
        <div style="font-size:10px;color:${loseTC};font-weight:600;margin-bottom:6px">${pb.loser} — all deer painted out</div>
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">`;
      (pb.roles[pb.loser]?.deer || []).forEach(d => {
        html += `<div style="position:relative;display:inline-block">
          <div style="filter:grayscale(1);opacity:0.4">${rpPortrait(d, 'pb-sm')}</div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(5deg);width:32px;height:32px;border-radius:50%;background:radial-gradient(circle,${loseTC}cc,${loseTC}44);pointer-events:none"></div>
        </div>`;
      });
      html += `</div></div>`;

      // Friendly fire / paintball war summary
      if (pb.friendlyFire?.length) {
        html += `<div style="margin-top:8px;font-size:10px;color:#f85149">🔥 ${pb.friendlyFire.length} friendly fire incident${pb.friendlyFire.length !== 1 ? 's' : ''}</div>`;
      }
      if (pb.paintballWar?.length) {
        html += `<div style="font-size:10px;color:#f85149">💥 ${pb.paintballWar.length} paintball war${pb.paintballWar.length !== 1 ? 's' : ''} erupted</div>`;
      }
      if (pb.bearMauled?.length) {
        html += `<div style="font-size:10px;color:#f85149">🐻 ${pb.bearMauled.join(', ')} mauled by bear</div>`;
      }

      html += `</div>`;
    }
  });

  // ── NEXT / REVEAL ALL buttons ──
  html += `<div style="position:sticky;bottom:0;background:linear-gradient(transparent,var(--bg) 30%);padding:16px 0 8px;display:flex;gap:8px;justify-content:center">`;
  if (!allRevealed) {
    html += `<button class="rp-btn" onclick="${_pbReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${totalSteps})</button>`;
    html += `<button class="rp-btn" style="opacity:0.5" onclick="${_pbReveal(totalSteps - 1)}">REVEAL ALL</button>`;
  }
  html += `</div>`;

  html += `</div>`; // close rp-page
  return html;
}

