#!/usr/bin/env node
// docs/superpowers/balance/tri-armed-balance.mjs
//
// Balance script for Trial by Tri-Armed Triathlon.
// Simulates the core probability engine (no browser, no DOM) and reports
// rates for triple-tie, wimp-key, sub-challenge distribution, and sweep.
//
// Run: node docs/superpowers/balance/tri-armed-balance.mjs [seasons] [playerCount]
//   seasons     — number of simulated episodes (default: 500)
//   playerCount — active players per episode (default: 6, must be even)
//
// Target thresholds:
//   triple-tie rate                15–30%   (per episode, 3 pairs)
//   wimp-key rate per offer/pair    2–8%    (one pair/one offer slot) — primary metric
//   wimp-key episode rate          30–60%   (any pair takes key in the episode — cast-dependent)
//   sub-challenge distribution     28–38% each (pair slots roughly equal)
//   sweep rate (one pair wins 3/3)  < 15%

// ── Deterministic ports of the shipped probability functions ─────────────────

function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function rp(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Archetype lookup — we generate random cast stats per run
const VILLAIN_ARCHS = ['villain', 'mastermind', 'schemer'];
const NICE_ARCHS    = ['hero', 'loyal-soldier', 'underdog', 'social-butterfly', 'showmancer', 'goat'];
const NEUTRAL_ARCHS = ['hothead', 'challenge-beast', 'wildcard', 'chaos-agent', 'floater',
                       'perceptive-player'];
const ALL_ARCHS = [...VILLAIN_ARCHS, ...NICE_ARCHS, ...NEUTRAL_ARCHS];

function randomPlayer(id) {
  return {
    name: `Player${id}`,
    archetype: rp(ALL_ARCHS),
    physical:  1 + Math.floor(Math.random() * 10),
    strategic: 1 + Math.floor(Math.random() * 10),
    endurance: 1 + Math.floor(Math.random() * 10),
    mental:    1 + Math.floor(Math.random() * 10),
    boldness:  1 + Math.floor(Math.random() * 10),
    loyalty:   1 + Math.floor(Math.random() * 10),
    intuition: 1 + Math.floor(Math.random() * 10),
  };
}

function getBond(bonds, a, b) {
  const key = [a, b].sort().join('|');
  return bonds[key] ?? 0;
}

function computeArchPair(a, b, bonds) {
  const av = VILLAIN_ARCHS.includes(a.archetype);
  const bv = VILLAIN_ARCHS.includes(b.archetype);
  const an = NICE_ARCHS.includes(a.archetype);
  const bn = NICE_ARCHS.includes(b.archetype);
  if ((av && bn) || (bv && an)) return 'villain_hero';
  const bond = getBond(bonds, a.name, b.name);
  if (bond <= -3) return 'rivals';
  if (bond >= 4)  return 'default'; // high-bond — not showmance in balance run
  if (bond <= 1)  return 'strangers';
  return 'default';
}

function getChemMod(archPair, bond) {
  if (archPair === 'showmance') return 2;
  if (archPair === 'rivals')    return -2;
  if (archPair === 'villain_hero') return -1;
  if (bond >= 4) return 1;
  if (bond <= -2) return -1;
  return 0;
}

// ── Wimp key ─────────────────────────────────────────────────────────────────

function inclination(player, bond, mishapCount, offerIndex) {
  let incl = 0.10;
  if (bond < -2)         incl += 0.20;
  if (player.boldness < 3) incl += 0.15;
  if (mishapCount >= 2)  incl += 0.22;
  if (VILLAIN_ARCHS.includes(player.archetype)) incl -= 0.08;
  if (['hero','loyal-soldier','underdog'].includes(player.archetype)) incl -= 0.10;
  if (offerIndex === 0)  incl -= 0.05;
  return Math.max(incl, 0);
}

function wimpKeyDecision(playerA, playerB, bond, mishapA, mishapB, offerIndex) {
  const iA = inclination(playerA, bond, mishapA, offerIndex);
  const iB = inclination(playerB, bond, mishapB, offerIndex);
  return Math.random() < iA && Math.random() < iB;
}

// ── Chowdown (returns feedRate for the pair) ─────────────────────────────────

function simChowdown(pair, bond, archPair, mishaps) {
  const [a, b] = pair;
  const chemMod = getChemMod(archPair, bond);

  // Role assignment (simplified — just pick higher-physical as feeder)
  const feeder = a.physical >= b.physical ? a : b;
  const eater  = feeder === a ? b : a;

  let rate = feeder.physical + feeder.strategic * 0.5
           + eater.endurance * 1.2 - eater.mental * 0.5
           + rand(-3, 3) + chemMod;

  // shortChainReach
  if (feeder.physical < 5) {
    const delta = feeder.physical < 4 ? -2 : -1;
    rate += delta;
    mishaps[feeder.name] = (mishaps[feeder.name] || 0) + 1;
    if (feeder.physical < 4) pair._tooShortArms = true;
  }

  // Mid events (2-3)
  const midCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < midCount; i++) {
    const canCheat = VILLAIN_ARCHS.includes(feeder.archetype) ||
                     (feeder.strategic >= 6 && feeder.loyalty <= 4);
    const r = Math.random() * (2 + 2 + (canCheat ? 1.5 : 0));
    if (r < 2) rate += 2;         // rhythm
    else if (r < 4) {             // grossOut
      rate -= 2;
      mishaps[eater.name] = (mishaps[eater.name] || 0) + 1;
    } else {                      // cheat
      rate += Math.random() < 0.35 ? -3 : 3;
    }
  }

  // Clutch
  const smashW = pair._tooShortArms ? 5 : 1;
  const vomitW = eater.endurance < 4 ? 2 : 0.5;
  const total  = smashW + vomitW + 1.5;
  const cr = Math.random() * total;
  if (cr < smashW) rate += 4;        // smashFood
  else if (cr < smashW + vomitW) {   // vomit
    rate -= 5;
    mishaps[eater.name] = (mishaps[eater.name] || 0) + 1;
  } else rate += 3;                   // pushThrough

  return rate;
}

// ── Idol Haul (returns idolTime for the pair) ────────────────────────────────

function simIdolHaul(pair, bond, archPair, mishaps, chowdownWinnerId) {
  let t = 90 + rand(-10, 10);
  const [a, b] = pair;

  // Events by phase (simplified — just time deltas)
  const phases = { canoe: 1, find: 1, piggyback: 1, cave: 1 };
  for (const phase of Object.keys(phases)) {
    const sub = Math.random();
    if (phase === 'canoe') {
      if (sub < 0.25) t += 5;       // argue
      else if (sub < 0.5) t -= 4;   // nav
      else if (sub < 0.75) t += 5;  // weight
      else t -= 4;                   // bond
    } else if (phase === 'find') {
      t += sub < 0.5 ? -4 : 5;     // package vs curse
    } else if (phase === 'piggyback') {
      if (sub < 0.33) t += 5;       // stumble
      // chainSnag 30%
      if (Math.random() < 0.30) t += 5;
    } else if (phase === 'cave') {
      const boldAvg = (a.boldness + b.boldness) / 2;
      if (boldAvg < 5 && Math.random() < 0.4) {
        t += 20;
        mishaps[a.name] = (mishaps[a.name] || 0) + 1;
        mishaps[b.name] = (mishaps[b.name] || 0) + 1;
      } else if (Math.random() < 0.25) t -= 10;  // clutch
    }
  }

  // Chemistry mod
  if (archPair === 'rivals') t += 10;
  else if (archPair === 'showmance') t -= 8;
  else if (bond >= 4) t -= 5;

  // Rubber-band
  if (chowdownWinnerId !== null && chowdownWinnerId === pair._id) t += 12;

  return t;
}

// ── Totem Pole (returns totemTime for the pair) ──────────────────────────────

function simTotemPole(pair, bond, archPair, mishaps, idolWinnerId) {
  let t = 60 + rand(-8, 8);
  const [a, b] = pair;

  // Events (2-3 per pair)
  const evtCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < evtCount; i++) {
    const sub = Math.random();
    if (sub < 0.3) t += 15;  // confusion
    // other events are 0 time or small: ignore for balance purposes
  }

  // chainStretch 35%
  if (Math.random() < 0.35) t += 8;

  // Chemistry
  if (archPair === 'rivals') t += 8;
  else if (archPair === 'showmance') t -= 5;

  // Rubber-band
  if (idolWinnerId !== null && idolWinnerId === pair._id) t += 10;

  return t;
}

// ── One episode simulation ───────────────────────────────────────────────────

function simEpisode(playerCount) {
  const players = Array.from({ length: playerCount }, (_, i) => randomPlayer(i + 1));

  // Random bonds
  const bonds = {};
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const key = [players[i].name, players[j].name].sort().join('|');
      bonds[key] = Math.floor(rand(-5, 6));
    }
  }

  // Pairing: sort by total drama, interleave
  const byDrama = [...players].sort((a, b) => {
    const dA = players.reduce((s, p) => p === a ? s : s + Math.abs(getBond(bonds, a.name, p.name)), 0);
    const dB = players.reduce((s, p) => p === b ? s : s + Math.abs(getBond(bonds, b.name, p.name)), 0);
    return dB - dA;
  });

  const pool = [...byDrama];
  const pairs = [];
  const half = Math.floor(pool.length / 2);
  for (let i = 0; i < half; i++) {
    const pair = [pool[i], pool[pool.length - 1 - i]];
    pair._id = i;
    pair._tooShortArms = false;
    pairs.push(pair);
  }

  const mishaps = {};
  let wimpKeyEpisodeTaken = false;
  let wimpKeyOfferCount = 0;
  let wimpKeyOfferTaken = 0;

  // Per pair: wimp key offer 0, chowdown, wimp key offer 1, idol, wimp key offer 2, totem
  const chowdownRates = [];
  const idolTimes = [];
  const totemTimes = [];
  const wimpKeyTaken = [];

  pairs.forEach((pair, idx) => {
    pair._wimpKey = false;
    const [a, b] = pair;
    const bond = getBond(bonds, a.name, b.name);
    const archPair = computeArchPair(a, b, bonds);

    // Wimp key offer 0
    if (!pair._wimpKey) {
      wimpKeyOfferCount++;
      const combinedMishaps = (mishaps[a.name] || 0) + (mishaps[b.name] || 0);
      if (wimpKeyDecision(a, b, bond, combinedMishaps, combinedMishaps, 0)) {
        pair._wimpKey = true;
        wimpKeyEpisodeTaken = true;
        wimpKeyOfferTaken++;
      }
    }

    if (pair._wimpKey) { wimpKeyTaken.push(idx); return; }

    const cr = simChowdown(pair, bond, archPair, mishaps);
    chowdownRates.push({ idx, rate: cr });

    // Wimp key offer 1
    if (!pair._wimpKey) {
      wimpKeyOfferCount++;
      const combinedMishaps = (mishaps[a.name] || 0) + (mishaps[b.name] || 0);
      if (wimpKeyDecision(a, b, bond, combinedMishaps, combinedMishaps, 1)) {
        pair._wimpKey = true;
        wimpKeyEpisodeTaken = true;
        wimpKeyOfferTaken++;
      }
    }
  });

  const chowdownWinner = chowdownRates.length
    ? chowdownRates.reduce((best, p) => p.rate > best.rate ? p : best, chowdownRates[0]).idx
    : null;

  pairs.forEach((pair, idx) => {
    if (pair._wimpKey) return;
    const [a, b] = pair;
    const bond = getBond(bonds, a.name, b.name);
    const archPair = computeArchPair(a, b, bonds);

    const it = simIdolHaul(pair, bond, archPair, mishaps, chowdownWinner);
    idolTimes.push({ idx, time: it });

    // Wimp key offer 2
    if (!pair._wimpKey) {
      wimpKeyOfferCount++;
      const combinedMishaps = (mishaps[a.name] || 0) + (mishaps[b.name] || 0);
      if (wimpKeyDecision(a, b, bond, combinedMishaps, combinedMishaps, 2)) {
        pair._wimpKey = true;
        wimpKeyEpisodeTaken = true;
        wimpKeyOfferTaken++;
      }
    }
  });

  const idolWinner = idolTimes.length
    ? idolTimes.reduce((best, p) => p.time < best.time ? p : best, idolTimes[0]).idx
    : null;

  pairs.forEach((pair, idx) => {
    if (pair._wimpKey) return;
    const [a, b] = pair;
    const bond = getBond(bonds, a.name, b.name);
    const archPair = computeArchPair(a, b, bonds);

    const tt = simTotemPole(pair, bond, archPair, mishaps, idolWinner);
    totemTimes.push({ idx, time: tt });
  });

  const totemWinner = totemTimes.length
    ? totemTimes.reduce((best, p) => p.time < best.time ? p : best, totemTimes[0]).idx
    : null;

  // Tally wins
  const wins = {};
  pairs.forEach((_, idx) => { wins[idx] = 0; });
  if (chowdownWinner !== null) wins[chowdownWinner] = (wins[chowdownWinner] || 0) + 1;
  if (idolWinner !== null)     wins[idolWinner]     = (wins[idolWinner]     || 0) + 1;
  if (totemWinner !== null)    wins[totemWinner]    = (wins[totemWinner]    || 0) + 1;

  const eligible = pairs.map((p, i) => ({ idx: i, wins: wins[i] || 0 })).filter(p => !pairs[p.idx]._wimpKey);
  const tripleTie = eligible.length >= 3 && eligible.every(p => p.wins === 1);
  const maxWins = eligible.length ? Math.max(...eligible.map(p => p.wins)) : 0;
  const topPairs = eligible.filter(p => p.wins === maxWins);
  const sweep = topPairs.length === 1 && maxWins === 3;

  return {
    tripleTie,
    wimpKeyEpisodeTaken,
    wimpKeyOfferCount,
    wimpKeyOfferTaken,
    chowdownWinner,
    idolWinner,
    totemWinner,
    sweep,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

const seasons     = parseInt(process.argv[2] || '500', 10);
const playerCount = parseInt(process.argv[3] || '6',   10);

if (playerCount % 2 !== 0 || playerCount < 4) {
  console.error('playerCount must be an even number ≥ 4');
  process.exit(1);
}

console.log(`\nTri-Armed Triathlon balance test — ${seasons} seasons, ${playerCount} players\n`);

let tripleTies = 0, wimpEpisodes = 0, sweeps = 0;
let totalOffers = 0, totalOffersTaken = 0;
const subWins = { chowdown: {}, idol: {}, totem: {} };

for (let s = 0; s < seasons; s++) {
  const r = simEpisode(playerCount);
  if (r.tripleTie)          tripleTies++;
  if (r.wimpKeyEpisodeTaken) wimpEpisodes++;
  if (r.sweep)               sweeps++;
  totalOffers      += r.wimpKeyOfferCount;
  totalOffersTaken += r.wimpKeyOfferTaken;

  // Track which pair-index won each sub (for distribution balance)
  if (r.chowdownWinner !== null) subWins.chowdown[r.chowdownWinner] = (subWins.chowdown[r.chowdownWinner] || 0) + 1;
  if (r.idolWinner     !== null) subWins.idol[r.idolWinner]         = (subWins.idol[r.idolWinner]         || 0) + 1;
  if (r.totemWinner    !== null) subWins.totem[r.totemWinner]       = (subWins.totem[r.totemWinner]       || 0) + 1;
}

const pct = n => `${(n / seasons * 100).toFixed(1)}%`;
const pctOf = (n, d) => d > 0 ? `${(n / d * 100).toFixed(1)}%` : 'n/a';
const target = (val, lo, hi) => {
  const v = val / seasons * 100;
  const ok = v >= lo && v <= hi;
  return ok ? '✅' : '⚠️ ';
};
const targetRaw = (v, lo, hi) => (v >= lo && v <= hi ? '✅' : '⚠️ ');

console.log('─────────────────────────────────────────────────────');
console.log(`  Triple-tie rate     ${pct(tripleTies).padStart(6)}   target 15–30%  ${target(tripleTies, 15, 30)}`);
const offerRate = totalOffersTaken / totalOffers * 100;
console.log(`  Wimp-key/offer      ${pctOf(totalOffersTaken, totalOffers).padStart(6)}   target  2–8%   ${targetRaw(offerRate, 2, 8)}`);
console.log(`  Wimp-key/episode    ${pct(wimpEpisodes).padStart(6)}   target 30–60%  ${target(wimpEpisodes, 30, 60)}`);
console.log(`  Sweep rate (3/3)    ${pct(sweeps).padStart(6)}   target   <15%  ${sweeps / seasons * 100 < 15 ? '✅' : '⚠️ '}`);
console.log('─────────────────────────────────────────────────────');

// Sub-challenge distribution: how evenly do chowdown/idol/totem spread across pair slots?
const pairCount = playerCount / 2;
for (const [sub, wins] of Object.entries(subWins)) {
  const total = Object.values(wins).reduce((a, b) => a + b, 0);
  if (!total) continue;
  const parts = Array.from({ length: pairCount }, (_, i) => {
    const w = wins[i] || 0;
    return `P${i + 1}: ${(w / total * 100).toFixed(0)}%`;
  }).join('  ');
  const lo = 100 / pairCount - 10, hi = 100 / pairCount + 10;
  const evenish = Object.values(wins).every(w => w / total * 100 >= lo && w / total * 100 <= hi);
  console.log(`  ${sub.padEnd(10)} distribution  ${parts}  ${evenish ? '✅' : '⚠️ '}`);
}
console.log('─────────────────────────────────────────────────────\n');
