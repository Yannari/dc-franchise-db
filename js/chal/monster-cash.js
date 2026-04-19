// ══════════════════════════════════════════════════════════════════════
// monster-cash.js — Monster Cash challenge (TDA S2E1)
// Chef's animatronic monster hunts contestants on a film lot.
// Pre-merge: tribe immunity. Post-merge: individual, auto-elimination.
// ══════════════════════════════════════════════════════════════════════
import { gs, seasonConfig, players } from '../core.js';
import { pStats, pronouns, romanticCompat } from '../players.js';
import { getBond, addBond } from '../bonds.js';
import { _checkShowmanceChalMoment } from '../romance.js';

// ── Threat Levels ──
const THREAT_LEVELS = [
  { level: 1, name: 'Awakening', baseCatch: 0.15, riskBonus: 3, hideMultiplier: 1 },
  { level: 2, name: 'Prowling',  baseCatch: 0.30, riskBonus: 1, hideMultiplier: 1 },
  { level: 3, name: 'Rampaging', baseCatch: 0.50, riskBonus: 0, hideMultiplier: 2 },
  { level: 4, name: 'Unstoppable', baseCatch: 0.70, riskBonus: 0, hideMultiplier: 2 },
  { level: 5, name: 'Final Form', baseCatch: 1.00, riskBonus: 0, hideMultiplier: 2 },
];

// ── Film Lot Locations ──
const LOCATIONS = [
  { id: 'stage-5',         name: 'Stage 5 — Monster Movie Set', sprintBonus: 0, hideBonus: 1, climbBonus: 1, pyroBonus: 0 },
  { id: 'back-lot',        name: 'Back Lot — Outdoor Streets',  sprintBonus: 2, hideBonus: -1, climbBonus: 0, pyroBonus: 0 },
  { id: 'prop-warehouse',  name: 'Prop Warehouse',              sprintBonus: -1, hideBonus: 2, climbBonus: 0, pyroBonus: 0 },
  { id: 'main-street',     name: 'Main Street Set',             sprintBonus: 0, hideBonus: 0, climbBonus: 0, pyroBonus: 2 },
  { id: 'craft-services',  name: 'Craft Services Tent',         sprintBonus: 0, hideBonus: 0, climbBonus: -1, pyroBonus: 0 },
  { id: 'parking-structure', name: 'Parking Structure',          sprintBonus: -1, hideBonus: 1, climbBonus: 2, pyroBonus: 0 },
];

// ── Positive Events ──
const POSITIVE_EVENTS = [
  { id: 'duck-behind-props', name: 'Duck Behind Prop Building', basePoints: 2, maxPoints: 3, stat: 'mental', type: 'hide' },
  { id: 'climb-scaffolding', name: 'Climb Set Scaffolding',     basePoints: 2, maxPoints: 4, stat: 'physical', stat2: 'endurance', type: 'risk' },
  { id: 'pyro-distraction',  name: 'Pyrotechnics Distraction',  basePoints: 3, maxPoints: 3, stat: 'boldness', type: 'risk' },
  { id: 'rally-survivors',   name: 'Rally Survivors',           basePoints: 2, maxPoints: 2, stat: 'social', type: 'social' },
  { id: 'read-pattern',      name: "Read Monster's Pattern",    basePoints: 3, maxPoints: 3, stat: 'strategic', stat2: 'intuition', type: 'hide' },
  { id: 'sprint-back-lot',   name: 'Sprint Through Back Lot',   basePoints: 2, maxPoints: 2, stat: 'physical', type: 'risk' },
  { id: 'guard-ally',        name: 'Guard an Ally',             basePoints: 2, maxPoints: 2, stat: 'loyalty', type: 'heroic', needsTarget: true },
  { id: 'sacrifice-cover',   name: 'Sacrifice Hiding Spot',     basePoints: 3, maxPoints: 3, stat: 'loyalty', type: 'heroic', needsTarget: true },
];

// ── Negative Events ──
const NEGATIVE_EVENTS = [
  { id: 'lure-monster',    name: 'Lure Monster Toward Rival',  points: -1, selfDamage: true, stat: 'strategic', stat2: 'boldness', type: 'sabotage', needsTarget: true, catchBoost: 0.2, heat: 1.5 },
  { id: 'trip-someone',    name: 'Trip Someone While Running', points: -2, selfDamage: false, stat: 'physical', type: 'sabotage', needsTarget: true, catchBoost: 0, heat: 1.5 },
  { id: 'use-decoy',       name: 'Use Someone as Decoy',       points: -1, selfDamage: true, stat: 'strategic', type: 'sabotage', needsTarget: true, catchBoost: 0.1, heat: 2.0 },
  { id: 'shove-from-cover', name: 'Shove Someone Out of Cover', points: -2, selfDamage: false, stat: 'physical', stat2: 'boldness', type: 'sabotage', needsTarget: true, catchBoost: 0.15, heat: 2.0 },
  { id: 'panic-freeze',    name: 'Panic Freeze',               points: -2, selfDamage: true, stat: 'temperament', type: 'self', invertStat: true },
  { id: 'debris-hit',      name: 'Knocked Over by Debris',     points: -1, selfDamage: true, type: 'luck' },
  { id: 'cover-destroyed', name: 'Monster Destroys Your Cover', points: -1, selfDamage: true, type: 'environment', minThreat: 4 },
];

// ── Monster Movie Titles ──
const FILM_TITLES = [
  'ATTACK OF THE 50-FOOT INTERN', 'MONSTER ISLAND MELTDOWN', 'THE CREATURE FROM STAGE 5',
  'GODZILLA VS THE CONTESTANTS', 'WHEN ANIMATRONICS ATTACK', 'REVENGE OF THE MECHANICAL BEAST',
  'TOTAL DRAMA: MONSTER MAYHEM', 'THE THING FROM THE PROP WAREHOUSE', 'DESTROY ALL CONTESTANTS',
  'ROBO-MONSTER UNLEASHED', 'ESCAPE FROM FILM LOT', 'THE LAST SURVIVOR',
];

// ── Chris Director Lines ──
const CHRIS_OPENERS = [
  "Lights! Camera! Destruction! Welcome to the most dangerous challenge yet!",
  "Today's challenge is brought to you by questionable safety standards and Chef's engineering skills!",
  "Hope everyone signed their waivers, because Chef's monster is OFF the leash!",
  "Welcome to the film lot! Today you're starring in a monster movie. The twist? The monster is REAL. Well, real-ish.",
];

const CHRIS_ROUND_LINES = [
  "The monster's getting angry! And by angry, I mean Chef just turned up the speed dial!",
  "Ooh, that's gonna leave a mark! On the set, I mean. That was expensive.",
  "Remember, the monster can't actually eat you! Probably.",
  "This is GREAT television! Destructive, terrifying, and someone might cry!",
  "Chef, easy on the hydraulics! That thing cost the network a fortune!",
  "The monster's learning! It's like Jurassic Park but with worse special effects!",
  "Anyone else smell smoke? No? Just me? Cool.",
  "And THAT is why we have insurance! We DO have insurance, right?",
];

const CHRIS_CLOSERS = [
  "And CUT! That's a wrap on the most destructive challenge in franchise history!",
  "Someone call the set department. And the fire department. And maybe a therapist.",
  "Chef, park the monster. And maybe don't leave the keys in it this time.",
];

const THREAT_NAMES = ['Awakening', 'Prowling', 'Rampaging', 'Unstoppable', 'Final Form'];

// ── Helpers ──
function _pick(arr, seed) {
  const h = typeof seed === 'string' ? [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) : (seed || 0);
  return arr[(h + Math.floor(Math.random() * arr.length)) % arr.length];
}

function _canSabotage(name) {
  const s = pStats(name);
  const arch = players.find(p => p.name === name)?.archetype || '';
  const villains = ['villain', 'mastermind', 'schemer'];
  const nice = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
  if (villains.includes(arch)) return true;
  if (nice.includes(arch)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}

function _getThreatLevel(roundIndex, totalRounds) {
  const raw = Math.ceil((roundIndex + 1) / totalRounds * 5);
  return Math.min(5, Math.max(1, raw));
}

function _getThreatData(level) {
  return THREAT_LEVELS[Math.min(level, 5) - 1];
}

function _pickLocation(usedLocations) {
  const available = LOCATIONS.filter(l => !usedLocations.includes(l.id));
  if (available.length === 0) return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  return available[Math.floor(Math.random() * available.length)];
}

function _selectEvents(name, survivors, threatLevel, location, roundFlags) {
  const s = pStats(name);
  const threat = _getThreatData(threatLevel);
  const canSab = _canSabotage(name);
  const events = [];
  const eventCount = 1 + (Math.random() < 0.4 ? 1 : 0);

  const pool = [];

  for (const ev of POSITIVE_EVENTS) {
    if (ev.type === 'heroic' && s.loyalty < 5) continue;
    let weight = (s[ev.stat] || 5) * 0.5;
    if (ev.stat2) weight += (s[ev.stat2] || 5) * 0.3;
    if (ev.id === 'sprint-back-lot') weight += location.sprintBonus;
    if (ev.id === 'duck-behind-props' || ev.id === 'read-pattern') weight += location.hideBonus;
    if (ev.id === 'climb-scaffolding') weight += location.climbBonus;
    if (ev.id === 'pyro-distraction') weight += location.pyroBonus;
    if (ev.type === 'hide') weight *= threat.hideMultiplier;
    if (ev.type === 'risk') weight += threat.riskBonus;
    if (ev.type === 'heroic') {
      const allies = survivors.filter(p => p !== name && getBond(name, p) >= 3);
      if (allies.length === 0) continue;
      weight += s.loyalty * 0.3;
    }
    pool.push({ ...ev, weight: Math.max(0.1, weight), negative: false });
  }

  for (const ev of NEGATIVE_EVENTS) {
    if (ev.type === 'sabotage' && !canSab) continue;
    if (ev.minThreat && threatLevel < ev.minThreat) continue;
    let weight = 0;
    if (ev.type === 'sabotage') {
      const enemies = survivors.filter(p => p !== name && getBond(name, p) <= -2);
      if (enemies.length === 0 && Math.random() > 0.3) continue;
      weight = (s[ev.stat] || 5) * 0.3;
      if (ev.stat2) weight += (s[ev.stat2] || 5) * 0.2;
    } else if (ev.type === 'self') {
      weight = ev.invertStat ? (10 - (s[ev.stat] || 5)) * 0.3 : (s[ev.stat] || 5) * 0.3;
      weight *= (threatLevel >= 4 ? 1.5 : 1);
    } else if (ev.type === 'luck') {
      weight = 0.8 + (threatLevel * 0.2);
    } else if (ev.type === 'environment') {
      weight = 1.0 + (threatLevel - 3) * 0.5;
    }
    pool.push({ ...ev, weight: Math.max(0.1, weight), negative: true });
  }

  for (let i = 0; i < eventCount; i++) {
    if (pool.length === 0) break;
    const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
    let r = Math.random() * totalWeight;
    let chosen = pool[0];
    for (const e of pool) {
      r -= e.weight;
      if (r <= 0) { chosen = e; break; }
    }
    let pts;
    if (chosen.negative) {
      pts = chosen.points;
    } else {
      const statVal = s[chosen.stat] || 5;
      pts = chosen.basePoints + Math.floor((statVal / 10) * (chosen.maxPoints - chosen.basePoints));
    }

    let target = null;
    if (chosen.needsTarget) {
      if (chosen.type === 'sabotage') {
        const enemies = survivors.filter(p => p !== name && getBond(name, p) <= 0);
        const candidates = enemies.length ? enemies : survivors.filter(p => p !== name);
        target = candidates[Math.floor(Math.random() * candidates.length)] || null;
      } else if (chosen.type === 'heroic') {
        const allies = survivors.filter(p => p !== name && getBond(name, p) >= 2);
        const candidates = allies.length ? allies : survivors.filter(p => p !== name);
        target = candidates[Math.floor(Math.random() * candidates.length)] || null;
      }
    }

    events.push({
      id: chosen.id, name: chosen.name, points: pts, player: name,
      target, negative: chosen.negative, type: chosen.type,
      catchBoost: chosen.catchBoost || 0, heat: chosen.heat || 0,
    });

    const idx = pool.indexOf(chosen);
    if (idx !== -1) pool.splice(idx, 1);
  }

  return events;
}

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════
export function simulateMonsterCash(ep) {
  const active = [...gs.activePlayers];
  const isMerged = gs.isMerged;
  const totalRounds = Math.max(3, active.length - 2);
  const minSurvivors = isMerged ? 2 : 1;

  const filmTitle = _pick(FILM_TITLES, ep.num + active.join(''));
  const chrisOpener = _pick(CHRIS_OPENERS, ep.num);
  const chrisCloser = _pick(CHRIS_CLOSERS, ep.num);

  const scores = {};
  active.forEach(p => { scores[p] = 0; });
  const capturedOrder = [];
  const rounds = [];
  const usedLocations = [];
  const monsterLevels = [];
  let survivors = [...active];
  const catchBoosts = {};
  active.forEach(p => { catchBoosts[p] = 0; });

  const actBreaks = [];

  for (let r = 0; r < totalRounds && survivors.length > minSurvivors; r++) {
    const threatLevel = _getThreatLevel(r, totalRounds);
    const threat = _getThreatData(threatLevel);
    const location = _pickLocation(usedLocations);
    usedLocations.push(location.id);
    if (usedLocations.length >= LOCATIONS.length) usedLocations.length = 0;

    monsterLevels.push({ round: r + 1, level: threatLevel, name: THREAT_NAMES[threatLevel - 1] });

    const roundEvents = [];
    const roundFlags = {};
    for (const name of survivors) {
      const playerEvents = _selectEvents(name, survivors, threatLevel, location, roundFlags);
      roundEvents.push(...playerEvents);

      for (const ev of playerEvents) {
        if (ev.negative && !ev.selfDamage && ev.target) {
          scores[ev.target] = (scores[ev.target] || 0) + ev.points;
        } else {
          scores[name] = (scores[name] || 0) + ev.points;
        }
        if (ev.catchBoost && ev.target) {
          catchBoosts[ev.target] = (catchBoosts[ev.target] || 0) + ev.catchBoost;
        }
        if (ev.heat && ev.target) {
          if (!gs._monsterCashHeat) gs._monsterCashHeat = {};
          gs._monsterCashHeat[ev.target] = { target: ev.player, amount: (gs._monsterCashHeat[ev.target]?.amount || 0) + ev.heat, expiresEp: (gs.episode || 0) + 3 };
        }
        if (ev.type === 'heroic' && ev.target) {
          const reduction = ev.id === 'sacrifice-cover' ? -1.5 : -1.0;
          if (gs._monsterCashHeat?.[name]) {
            gs._monsterCashHeat[name].amount = Math.max(0, gs._monsterCashHeat[name].amount + reduction);
          }
          addBond(name, ev.target, ev.id === 'sacrifice-cover' ? 2 : 1);
        }
        if (!gs.popularity) gs.popularity = {};
        if (ev.type === 'heroic') {
          gs.popularity[name] = (gs.popularity[name] || 0) + (ev.id === 'sacrifice-cover' ? 2 : 1);
        } else if (ev.type === 'sabotage') {
          const delta = (ev.id === 'use-decoy' || ev.id === 'shove-from-cover') ? -2 : -1;
          gs.popularity[name] = (gs.popularity[name] || 0) + delta;
        }
      }
    }

    for (const name of survivors) {
      scores[name] = (scores[name] || 0) + 2;
    }

    if (seasonConfig.romance) {
      for (const sm of (gs.showmances || [])) {
        if (sm.pair && survivors.includes(sm.pair[0]) && survivors.includes(sm.pair[1])) {
          _checkShowmanceChalMoment(sm.pair[0], sm.pair[1], ep);
        }
      }
    }

    // ── Catch resolution ──
    let captured = null;
    let rescueAttempt = null;

    if (survivors.length > minSurvivors) {
      const catchScores = {};
      for (const name of survivors) {
        const roundScore = roundEvents.filter(e => e.player === name && !e.negative).reduce((s, e) => s + e.points, 0);
        catchScores[name] = threat.baseCatch - (roundScore * 0.1) + (catchBoosts[name] || 0);
      }

      const sorted = [...survivors].sort((a, b) => {
        if (catchScores[b] !== catchScores[a]) return catchScores[b] - catchScores[a];
        const aNeg = roundEvents.filter(e => e.player === a && e.negative).length;
        const bNeg = roundEvents.filter(e => e.player === b && e.negative).length;
        if (bNeg !== aNeg) return bNeg - aNeg;
        const aPos = roundEvents.filter(e => e.player === a && !e.negative).length;
        const bPos = roundEvents.filter(e => e.player === b && !e.negative).length;
        if (aPos !== bPos) return aPos - bPos;
        return Math.random() - 0.5;
      });

      captured = sorted[0];

      // Rescue attempt (disabled at threat 5)
      if (captured && threatLevel < 5) {
        const potentialRescuers = survivors.filter(p => {
          if (p === captured) return false;
          const s = pStats(p);
          return s.loyalty >= 7 && getBond(p, captured) >= 4;
        });
        if (potentialRescuers.length > 0) {
          const rescuer = potentialRescuers[Math.floor(Math.random() * potentialRescuers.length)];
          const rs = pStats(rescuer);
          const rescueChance = rs.loyalty * 0.1 + getBond(rescuer, captured) * 0.05;
          const success = Math.random() < rescueChance;
          rescueAttempt = { rescuer, target: captured, success };
          if (success) {
            scores[rescuer] = (scores[rescuer] || 0) - 2;
            addBond(rescuer, captured, 2);
            captured = null;
          }
        }
      }

      if (captured) {
        survivors = survivors.filter(p => p !== captured);
        capturedOrder.push(captured);
        catchBoosts[captured] = 0;
      }
    }

    if (capturedOrder.length === 1 && !actBreaks.includes('act1')) actBreaks.push(r);
    if (survivors.length === 3 && !actBreaks.some(a => typeof a === 'number' && a > 0)) actBreaks.push(r);

    const chrisLine = _pick(CHRIS_ROUND_LINES, r + ep.num);

    rounds.push({
      roundNum: r + 1,
      threatLevel,
      threatName: THREAT_NAMES[threatLevel - 1],
      location: location.name,
      locationId: location.id,
      events: roundEvents,
      captured,
      rescueAttempt,
      survivors: [...survivors],
      chrisLine,
    });
  }

  // ── Final showdown (post-merge only) ──
  let finalShowdown = null;
  let immunityWinner = null;
  if (isMerged && survivors.length === 2) {
    const [s1, s2] = survivors;
    const s1s = pStats(s1), s2s = pStats(s2);
    const s1Score = scores[s1] + (s1s.physical + s1s.mental + s1s.endurance) * 0.3 + Math.random() * 3;
    const s2Score = scores[s2] + (s2s.physical + s2s.mental + s2s.endurance) * 0.3 + Math.random() * 3;
    immunityWinner = s1Score >= s2Score ? s1 : s2;
    const methods = ['outlasted', 'outran', 'outsmarted', 'outmaneuvered'];
    finalShowdown = {
      survivor1: s1, survivor2: s2, winner: immunityWinner,
      method: `${immunityWinner} ${_pick(methods, immunityWinner)} ${immunityWinner === s1 ? s2 : s1} in the final showdown`,
    };
  } else if (isMerged && survivors.length === 1) {
    immunityWinner = survivors[0];
  } else if (!isMerged) {
    const tribeScores = {};
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (members.length === 0) continue;
      let totalSurvival = 0;
      for (const m of members) {
        const capturedRound = capturedOrder.indexOf(m);
        totalSurvival += capturedRound === -1 ? rounds.length + 1 : capturedRound + 1;
      }
      tribeScores[tribe.name] = totalSurvival / members.length;
    }
    const sortedTribes = Object.entries(tribeScores).sort(([,a],[,b]) => b - a);
    if (sortedTribes.length > 0) {
      const winnerTribe = gs.tribes.find(t => t.name === sortedTribes[0][0]);
      const loserTribe = gs.tribes.find(t => t.name === sortedTribes[sortedTribes.length - 1][0]);
      ep.winner = winnerTribe;
      ep.loser = loserTribe;
      ep.safeTribes = gs.tribes.filter(t => t !== loserTribe && t !== winnerTribe);
      ep.challengePlacements = sortedTribes.map(([name]) => {
        const t = gs.tribes.find(tr => tr.name === name);
        return { name, members: [...(t?.members || [])] };
      });
      ep.tribalPlayers = [...(loserTribe?.members || [])];
    }
    ep.challengeType = 'monster-cash';
    immunityWinner = null;
  }

  // ── Determine eliminated (post-merge only) ──
  let eliminated = null;
  if (isMerged) {
    const candidates = active.filter(p => p !== immunityWinner);
    eliminated = candidates.sort((a, b) => (scores[a] || 0) - (scores[b] || 0))[0] || null;
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[immunityWinner] = (gs.popularity[immunityWinner] || 0) + 3;
  }

  const leaderboard = active.map(name => ({
    name, score: scores[name] || 0,
    capturedRound: capturedOrder.indexOf(name) === -1 ? null : capturedOrder.indexOf(name) + 1,
    events: rounds.flatMap(r => r.events.filter(e => e.player === name)),
  })).sort((a, b) => b.score - a.score);

  ep.monsterCash = {
    rounds, scores, capturedOrder, finalShowdown, immunityWinner, eliminated, leaderboard, monsterLevels,
    filmTitle, chrisOpener, chrisCloser, actBreaks, locations: rounds.map(r => r.location),
    tribeScores: !isMerged ? (() => { const ts = {}; for (const tribe of gs.tribes) { const members = tribe.members.filter(m => active.includes(m)); if (!members.length) continue; let total = 0; for (const m of members) { const ci = capturedOrder.indexOf(m); total += ci === -1 ? rounds.length + 1 : ci + 1; } ts[tribe.name] = total / members.length; } return ts; })() : null,
  };

  if (isMerged) {
    ep.immunityWinner = immunityWinner;
    ep.eliminated = eliminated;
    ep.challengeType = 'monster-cash';
    ep.noTribal = true;
  }
}

// ══════════════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════════════
export function _textMonsterCash(ep, ln, sec) {
  const mc = ep.monsterCash;
  if (!mc) return;
  sec('MONSTER CASH');

  ln(`Film Lot Challenge — ${mc.filmTitle}`);
  ln(`Monster Escalation: ${mc.monsterLevels.map(l => l.name).filter((v, i, a) => a.indexOf(v) === i).join(' → ')}`);
  ln(`Chris: "${mc.chrisOpener}"`);
  ln('');

  for (const round of mc.rounds) {
    ln(`ROUND ${round.roundNum} (Threat: ${round.threatName}) — ${round.location}`);
    const topPos = round.events.filter(e => !e.negative).sort((a, b) => b.points - a.points)[0];
    if (topPos) ln(`  ${topPos.player}: ${topPos.name} (+${topPos.points})`);
    const sabs = round.events.filter(e => e.type === 'sabotage');
    sabs.forEach(s => ln(`  ${s.player} → ${s.target}: ${s.name} (${s.points})`));
    const heroic = round.events.filter(e => e.type === 'heroic');
    heroic.forEach(h => ln(`  ${h.player} → ${h.target}: ${h.name} (+${h.points})`));
    if (round.rescueAttempt) {
      const ra = round.rescueAttempt;
      ln(`  RESCUE: ${ra.rescuer} tried to save ${ra.target} — ${ra.success ? 'SUCCESS!' : 'FAILED'}`);
    }
    if (round.captured) ln(`  CAPTURED: ${round.captured}`);
    ln(`  Chris: "${round.chrisLine}"`);
    ln(`  Survivors: ${round.survivors.join(', ')}`);
    ln('');
  }

  if (mc.finalShowdown) {
    ln('FINAL SHOWDOWN:');
    ln(`  ${mc.finalShowdown.survivor1} vs ${mc.finalShowdown.survivor2}`);
    ln(`  ${mc.finalShowdown.method}`);
    ln('');
  }

  ln(`CAPTURE ORDER: ${mc.capturedOrder.join(' → ')}`);
  if (mc.immunityWinner) ln(`IMMUNITY: ${mc.immunityWinner}`);
  if (mc.eliminated) ln(`ELIMINATED: ${mc.eliminated} (score: ${(mc.scores[mc.eliminated] || 0).toFixed(1)})`);

  if (mc.tribeScores) {
    ln('');
    ln('TRIBE SCORES (avg survival round):');
    Object.entries(mc.tribeScores).sort(([,a],[,b]) => b - a).forEach(([name, score]) => {
      ln(`  ${name}: ${score.toFixed(1)}`);
    });
  }

  ln('');
  ln(`Chris: "${mc.chrisCloser}"`);
}

// ══════════════════════════════════════════════════════════════════════
// VP SCREENS
// ══════════════════════════════════════════════════════════════════════

const _mcState = {};

function _mcPortrait(name, size = 32) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid #444;" onerror="this.style.display='none'">`;
}

function _mcShell(content, ep, threatLevel) {
  const mc = ep.monsterCash;
  const threatClass = `threat-${Math.min(threatLevel || 1, 5)}`;
  const tickerMessages = [
    'MONSTER SIGHTED IN SECTOR 7', 'ALL CONTESTANTS PROCEED TO SHELTER', 'THIS IS NOT A DRILL',
    'EVACUATION ROUTE BLOCKED', 'STRUCTURAL DAMAGE REPORTED ON STAGE 5', 'CHEF HAS LOST CONTROL OF THE ANIMATRONIC',
    'MONSTER HEADING TOWARD BACK LOT', 'EMERGENCY BROADCAST — STAY HIDDEN', 'PROP WAREHOUSE COMPROMISED',
  ];
  const ticker = tickerMessages.sort(() => Math.random() - 0.5).slice(0, 4).join('  ///  ');

  const rubble = (mc?.capturedOrder || []).map(name =>
    `<div class="mc-rubble-portrait">${_mcPortrait(name, 24)}</div>`
  ).join('');

  return `
    <div class="rp-page" style="background:#0a0a0a;padding:0;">
    <div class="mc-shell">
      <div class="mc-film-grain"></div>
      <div class="mc-monster-silhouette ${threatClass}">🦎</div>
      ${threatLevel >= 4 ? '<div class="mc-emergency-flash"></div>' : ''}
      <div style="position:relative;z-index:3;padding:16px;">
        ${content}
      </div>
      <div class="mc-rubble-pile">${rubble}</div>
      <div class="mc-ticker"><span class="mc-ticker-text">/// EMERGENCY BROADCAST /// ${ticker} ///</span></div>
      <div class="mc-screen-crack ${threatLevel >= 4 ? 'active' : ''}" style="background:url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><line x1="180" y1="0" x2="200" y2="200" stroke="rgba(255,255,255,0.15)" stroke-width="1"/><line x1="200" y1="200" x2="220" y2="400" stroke="rgba(255,255,255,0.1)" stroke-width="1"/><line x1="200" y1="200" x2="280" y2="300" stroke="rgba(255,255,255,0.08)" stroke-width="1"/></svg>`)}') center/cover no-repeat;"></div>
    </div>
    </div>`;
}

function _mcThreatBar(level) {
  return `
    <div class="mc-threat-bar">
      <span class="mc-threat-label">Threat: ${THREAT_NAMES[level - 1]}</span>
      <div style="flex:1;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;">
        <div class="mc-threat-fill mc-threat-${level}"></div>
      </div>
    </div>`;
}

export function rpBuildMonsterCashTitleCard(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';
  const content = `
    <div class="mc-title-card">
      <div class="mc-now-playing">▶ NOW PLAYING</div>
      <div class="mc-film-title">${mc.filmTitle}</div>
      <div style="margin:16px 0;font-size:12px;color:#666;">A Chris McLean Production</div>
      <div style="font-size:12px;color:#aaa;max-width:400px;margin:0 auto;">
        "${mc.chrisOpener}"
      </div>
      <div style="margin-top:20px;font-size:11px;color:#555;letter-spacing:1.5px;text-transform:uppercase;">
        ${mc.rounds.length} Rounds · ${gs.activePlayers.length + mc.capturedOrder.length} Contestants · 1 Monster
      </div>
    </div>`;
  return _mcShell(content, ep, 1);
}

function _mcBuildEventCard(ev) {
  const portrait = _mcPortrait(ev.player);
  const ptsClass = ev.negative ? 'mc-pts-neg' : 'mc-pts-pos';
  const ptsLabel = ev.negative ? `${ev.points}` : `+${ev.points}`;
  const targetText = ev.target ? ` → ${ev.target}` : '';
  return `
    <div class="mc-event-card">
      ${portrait}
      <div class="mc-event-text"><strong>${ev.player}</strong>${targetText}: ${ev.name}</div>
      <span class="mc-event-pts ${ptsClass}">${ptsLabel}</span>
    </div>`;
}

function _mcBuildCaptureCard(name, threatLevel) {
  const portrait = _mcPortrait(name, 48);
  const animClass = threatLevel <= 2 ? 'mc-stamp-comedy' : '';
  const portraitClass = threatLevel <= 2 ? '' : threatLevel === 3 ? 'mc-portrait-cracked' : 'mc-portrait-shatter';
  const shakeClass = threatLevel <= 2 ? 'mc-capture-comedy' : threatLevel <= 3 ? 'mc-capture-tense' : 'mc-capture-terror';

  let captureNarrative = '';
  if (threatLevel <= 2) {
    const comedic = [
      `The monster stumbled around a corner and bumped right into ${name}. Not exactly graceful.`,
      `${name} tried to hide behind a cardboard tree. The monster wasn't fooled.`,
      `The monster tripped over a cable, fell forward, and accidentally scooped up ${name}.`,
      `${name} was so busy watching the monster they backed into the bounce house themselves.`,
    ];
    captureNarrative = _pick(comedic, name);
  } else if (threatLevel === 3) {
    const tense = [
      `The monster's shadow crept over ${name}'s hiding spot. By the time they looked up, it was too late.`,
      `${name} ran. The monster was faster. The ground shook with every step closing in.`,
      `A wall collapsed beside ${name}. The monster reached through the rubble.`,
    ];
    captureNarrative = _pick(tense, name);
  } else {
    const terror = [
      `The monster tore through the set wall. ${name} had nowhere left to run. The claw came down.`,
      `Buildings crumbled. Sirens wailed. ${name} was lifted off the ground like a ragdoll.`,
      `The monster found ${name} in the last standing structure — and brought it down around them.`,
      `${name} made a final sprint. The monster's claw slammed down in front of them, cutting off every escape.`,
    ];
    captureNarrative = _pick(terror, name);
  }

  return `
    <div class="mc-capture-card ${shakeClass} ${animClass}" style="position:relative;overflow:hidden;">
      ${threatLevel >= 3 ? '<div class="mc-shadow-overlay"></div>' : ''}
      <div style="position:relative;z-index:1;">
        <div style="margin-bottom:8px;" class="${portraitClass}">${portrait}</div>
        <div class="mc-captured-label">⛌ CAPTURED</div>
        <div style="font-size:12px;color:#ccc;margin-top:6px;">${captureNarrative}</div>
      </div>
    </div>`;
}

function _mcBuildRound(round, ep) {
  let html = '';
  html += `<div class="mc-location-header">${round.location}</div>`;
  html += _mcThreatBar(round.threatLevel);

  for (const ev of round.events) {
    html += _mcBuildEventCard(ev);
  }

  if (round.rescueAttempt) {
    const ra = round.rescueAttempt;
    const color = ra.success ? '#4caf50' : '#f44336';
    html += `
      <div class="mc-event-card" style="border-color:${color}40;background:${color}08;">
        ${_mcPortrait(ra.rescuer)}
        <div class="mc-event-text" style="color:${color};">
          <strong>${ra.rescuer}</strong> attempted to rescue <strong>${ra.target}</strong> — ${ra.success ? 'SUCCESS!' : 'The monster was too fast.'}
        </div>
      </div>`;
  }

  if (round.captured) {
    html += _mcBuildCaptureCard(round.captured, round.threatLevel);
  }

  html += `<div class="mc-survivors-count">${round.survivors.length} REMAIN</div>`;
  html += `<div class="mc-chris-line">📢 ${round.chrisLine}</div>`;

  return html;
}

export function rpBuildMonsterCashRounds(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';

  if (!_mcState.roundIdx) _mcState.roundIdx = -1;

  let html = '<div class="mc-clapperboard">🎬 THE HUNT — CLICK TO REVEAL EACH ROUND</div>';

  for (let i = 0; i < mc.rounds.length; i++) {
    const round = mc.rounds[i];
    const isRevealed = i <= _mcState.roundIdx;
    const isActBreak = mc.actBreaks.includes(i) && i > 0;

    if (isActBreak) {
      html += `<div class="mc-clapperboard" style="margin-top:16px;">— ACT BREAK —</div>`;
    }

    html += `<div id="mc-round-${i}" style="display:${isRevealed ? 'block' : 'none'};">`;
    html += `<div style="font-size:11px;color:#666;margin-top:12px;letter-spacing:1px;">ROUND ${round.roundNum}</div>`;
    html += _mcBuildRound(round, ep);
    html += '</div>';
  }

  html += `<div id="mc-reveal-btn" style="text-align:center;margin-top:16px;">
    <button onclick="window.monsterCashRevealNext()" style="padding:8px 24px;background:#ff5722;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;letter-spacing:1px;">
      NEXT ROUND ▶
    </button>
    <button onclick="window.monsterCashRevealAll()" style="padding:8px 16px;background:#333;color:#aaa;border:1px solid #555;border-radius:6px;cursor:pointer;margin-left:8px;font-size:11px;">
      Reveal All
    </button>
  </div>`;

  const maxThreat = mc.rounds.reduce((max, r) => Math.max(max, r.threatLevel), 1);
  return _mcShell(html, ep, maxThreat);
}

export function monsterCashRevealNext() {
  _mcState.roundIdx = (_mcState.roundIdx || -1) + 1;
  const el = document.getElementById(`mc-round-${_mcState.roundIdx}`);
  if (el) {
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  const mc = gs.episodeHistory[gs.episodeHistory.length - 1]?.monsterCash;
  if (mc && _mcState.roundIdx >= mc.rounds.length - 1) {
    const btn = document.getElementById('mc-reveal-btn');
    if (btn) btn.style.display = 'none';
  }
}

export function monsterCashRevealAll() {
  const mc = gs.episodeHistory[gs.episodeHistory.length - 1]?.monsterCash;
  if (!mc) return;
  for (let i = 0; i < mc.rounds.length; i++) {
    const el = document.getElementById(`mc-round-${i}`);
    if (el) el.style.display = 'block';
  }
  _mcState.roundIdx = mc.rounds.length - 1;
  const btn = document.getElementById('mc-reveal-btn');
  if (btn) btn.style.display = 'none';
}

export function rpBuildMonsterCashShowdown(ep) {
  const mc = ep.monsterCash;
  if (!mc?.finalShowdown) return '';

  const fs = mc.finalShowdown;
  const loser = fs.winner === fs.survivor1 ? fs.survivor2 : fs.survivor1;

  const content = `
    <div style="text-align:center;padding:20px;">
      <div class="mc-clapperboard">🦎 FINAL SHOWDOWN</div>
      <div style="display:flex;justify-content:center;align-items:center;gap:20px;margin:20px 0;">
        <div style="text-align:center;">
          ${_mcPortrait(fs.survivor1, 64)}
          <div style="font-size:13px;color:#e8e8e8;margin-top:6px;font-weight:700;">${fs.survivor1}</div>
          <div style="font-size:11px;color:#888;">Score: ${(mc.scores[fs.survivor1] || 0).toFixed(1)}</div>
        </div>
        <div style="font-size:24px;color:#ff5722;font-weight:900;">VS</div>
        <div style="text-align:center;">
          ${_mcPortrait(fs.survivor2, 64)}
          <div style="font-size:13px;color:#e8e8e8;margin-top:6px;font-weight:700;">${fs.survivor2}</div>
          <div style="font-size:11px;color:#888;">Score: ${(mc.scores[fs.survivor2] || 0).toFixed(1)}</div>
        </div>
      </div>
      <div style="font-size:13px;color:#ccc;margin-top:12px;max-width:400px;margin-left:auto;margin-right:auto;">
        The monster bears down on the last two survivors. Only one can escape.
      </div>
      <div style="font-size:14px;color:#ff9800;margin-top:16px;font-weight:700;">
        ${fs.method}
      </div>
    </div>`;
  return _mcShell(content, ep, 5);
}

export function rpBuildMonsterCashImmunity(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';
  const winner = mc.immunityWinner;
  if (!winner) return '';

  const ws = pStats(winner);
  const wp = pronouns(winner);
  let flavorText = '';
  if (ws.physical >= 8) flavorText = `${winner} powered through the destruction like it was nothing. The monster couldn't keep up.`;
  else if (ws.mental >= 8) flavorText = `${winner} read every move the monster made. ${wp.Sub} was always two steps ahead.`;
  else if (ws.endurance >= 8) flavorText = `${winner} outlasted everyone. When the monster came, ${wp.sub} just kept running.`;
  else if (ws.strategic >= 8) flavorText = `${winner} played the film lot like a chess board. Every hiding spot, every escape route — calculated.`;
  else flavorText = `${winner} survived the monster's rampage. Sometimes that's all it takes.`;

  const content = `
    <div style="text-align:center;padding:30px;">
      <div style="font-size:11px;color:#4caf50;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">IMMUNITY WINNER</div>
      <div style="display:inline-block;position:relative;">
        ${_mcPortrait(winner, 80)}
        <div style="position:absolute;bottom:-4px;right:-4px;background:#4caf50;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px;">🛡️</div>
      </div>
      <div style="font-size:20px;color:#e8e8e8;font-weight:900;margin-top:12px;">${winner}</div>
      <div style="font-size:12px;color:#888;margin-top:4px;">Score: ${(mc.scores[winner] || 0).toFixed(1)}</div>
      <div style="font-size:13px;color:#aaa;margin-top:16px;max-width:400px;margin-left:auto;margin-right:auto;">
        ${flavorText}
      </div>
    </div>`;
  return _mcShell(content, ep, 1);
}

export function rpBuildMonsterCashElimination(ep) {
  const mc = ep.monsterCash;
  if (!mc?.eliminated) return '';

  const elim = mc.eliminated;
  const score = (mc.scores[elim] || 0).toFixed(1);
  const capturedRound = mc.capturedOrder.indexOf(elim);
  const capturedText = capturedRound !== -1 ? `Captured in round ${capturedRound + 1}` : 'Never captured, but scored lowest';

  const content = `
    <div style="text-align:center;padding:30px;">
      <div style="font-size:11px;color:#f44336;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">ELIMINATED</div>
      <div style="display:inline-block;position:relative;">
        <div class="mc-portrait-cracked">${_mcPortrait(elim, 80)}</div>
      </div>
      <div style="font-size:20px;color:#e8e8e8;font-weight:900;margin-top:12px;">${elim}</div>
      <div style="font-size:12px;color:#f44336;margin-top:4px;">Score: ${score} — ${capturedText}</div>
      <div style="font-size:13px;color:#aaa;margin-top:16px;max-width:400px;margin-left:auto;margin-right:auto;">
        ${elim} walks through the rubble of the destroyed film lot. The Walk of Shame has never looked this dramatic.
      </div>
    </div>`;
  return _mcShell(content, ep, 5);
}

export function rpBuildMonsterCashLeaderboard(ep) {
  const mc = ep.monsterCash;
  if (!mc) return '';

  let rows = '';
  mc.leaderboard.forEach((entry, i) => {
    const isWinner = entry.name === mc.immunityWinner;
    const isElim = entry.name === mc.eliminated;
    const capturedText = entry.capturedRound ? `Rd ${entry.capturedRound}` : '—';
    const statusIcon = isWinner ? '🛡️' : isElim ? '💀' : '';
    const rowColor = isWinner ? 'rgba(76,175,80,0.1)' : isElim ? 'rgba(244,67,54,0.1)' : 'transparent';

    rows += `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${rowColor};border-radius:4px;margin:2px 0;">
        <span style="font-size:11px;color:#666;width:20px;text-align:right;">${i + 1}.</span>
        ${_mcPortrait(entry.name, 28)}
        <span style="flex:1;font-size:13px;color:#ccc;font-weight:${isWinner || isElim ? '700' : '400'};">${entry.name} ${statusIcon}</span>
        <span style="font-size:12px;color:#888;width:50px;text-align:center;">${capturedText}</span>
        <span style="font-size:12px;font-weight:700;color:${entry.score >= 0 ? '#4caf50' : '#f44336'};width:50px;text-align:right;">${entry.score.toFixed(1)}</span>
      </div>`;
  });

  let tribeSection = '';
  if (mc.tribeScores) {
    tribeSection = `<div style="margin-top:16px;"><div class="mc-clapperboard">TRIBE SCORES</div>`;
    Object.entries(mc.tribeScores).sort(([,a],[,b]) => b - a).forEach(([name, score], i) => {
      const color = i === 0 ? '#4caf50' : '#f44336';
      tribeSection += `<div style="font-size:13px;color:${color};text-align:center;margin:4px 0;">${i === 0 ? '🏆' : '📛'} ${name}: ${score.toFixed(1)} avg</div>`;
    });
    tribeSection += '</div>';
  }

  const content = `
    <div style="padding:16px;">
      <div class="mc-clapperboard" style="margin-bottom:12px;">🎬 FINAL SCORES — CREDITS ROLL</div>
      <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">
        <span style="width:20px;"></span>
        <span style="width:32px;"></span>
        <span style="flex:1;">Name</span>
        <span style="width:50px;text-align:center;">Caught</span>
        <span style="width:50px;text-align:right;">Score</span>
      </div>
      ${rows}
      ${tribeSection}
      <div style="text-align:center;margin-top:20px;font-size:11px;color:#555;font-style:italic;">
        "${mc.chrisCloser}"
      </div>
    </div>`;
  return _mcShell(content, ep, 1);
}
