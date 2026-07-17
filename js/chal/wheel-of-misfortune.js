// ══════════════════════════════════════════════════════════════════════
// wheel-of-misfortune.js — "Wheel of Misfortune" (DC4, post-merge PAIR)
// A three-phase Ferris-wheel carnival immunity challenge run in pairs.
//
//   Phase 1 — FERRIS WHEEL DODGEBALL: one partner rides a swaying wheel cart
//   and pelts the ENEMY partners (helmet targets) on the ground while they
//   dodge. Land THREE hits and your grounded partner is freed to advance.
//   Phase 2 — BLINDFOLD SEARCH: the freed partner blindfolds and gropes for
//   three balls while the rider shouts directions from above. Rivals swipe,
//   trust cracks, allies steady each other.
//   Phase 3 — TILT-MAZE PUZZLE: both partners tilt a maze board together to
//   roll three balls into the holes. First pair to sink all three wins — and
//   BOTH partners take immunity. Leadership gets handed off, tempers snap, and
//   a player can quietly tip a ball out of bounds to gift the win to a rival
//   or a showmance.
//
//   Tied Destinies: if the twist is live, the pairs ARE the tied pairs — your
//   fates compete as one unit.
//
//   AIM   (throw)     = physical*0.4 + intuition*0.4 + boldness*0.2
//   DODGE (evade)     = endurance*0.4 + boldness*0.35 + physical*0.25
//   SEARCH(blind hunt)= intuition*0.5 + endurance*0.3 + temperament*0.2
//   GUIDE (direct)    = mental*0.4 + social*0.4 + strategic*0.2
//   PUZZLE(tilt maze) = mental*0.4 + strategic*0.3 + temperament*0.3
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond, getPerceivedBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

function noise(m) { return (Math.random() - 0.5) * 2 * m; }
function archOf(n) { return players.find(p => p.name === n)?.archetype || 'floater'; }
function pick(a) { return a.length ? a[Math.floor(Math.random() * a.length)] : null; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function bumpPop(n, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; }
function hostName() { return seasonConfig?.host || 'Chris'; }

const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
const VILLAIN = ['villain', 'mastermind', 'schemer'];
function isNice(n) { return NICE.includes(archOf(n)); }
function isVillain(n) { return VILLAIN.includes(archOf(n)); }
function canScheme(n) {
  const a = archOf(n), s = pStats(n);
  if (VILLAIN.includes(a)) return true;
  if (NICE.includes(a)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}

function aimOf(n) { const s = pStats(n); return s.physical * 0.4 + s.intuition * 0.4 + s.boldness * 0.2; }
function dodgeOf(n) { const s = pStats(n); return s.endurance * 0.4 + s.boldness * 0.35 + s.physical * 0.25; }
function searchOf(n) { const s = pStats(n); return s.intuition * 0.5 + s.endurance * 0.3 + s.temperament * 0.2; }
function guideOf(n) { const s = pStats(n); return s.mental * 0.4 + s.social * 0.4 + s.strategic * 0.2; }
function puzzleOf(n) { const s = pStats(n); return s.mental * 0.4 + s.strategic * 0.3 + s.temperament * 0.3; }

// name-stripped no-repeat picker + per-run type usage
let _usedTpl, _typeUsed;
function draw(pool, ...ctx) {
  const built = pool.map(f => f(...ctx));
  const strip = (t) => (gs.activePlayers || []).reduce((s, n) => s.split(n).join('~'), t);
  const fresh = built.filter(t => !_usedTpl.has(strip(t)));
  const from = fresh.length ? fresh : built;
  const chosen = from[Math.floor(Math.random() * from.length)];
  _usedTpl.add(strip(chosen));
  return chosen;
}

const HOST_OPENERS = [
  (H) => `${H}: "Welcome to Wheel of Misfortune! Here's how it works — one of you rides the Ferris wheel and chucks balls at the OTHER teams' helmet targets down below, the rest of you dodge. Three clean hits and your partner's freed. Then the blindfold comes on, you grope around for three balls while your partner screams directions, and you finish by tilting a big dumb maze until three balls drop in the holes. First pair to finish — both of you — wins immunity. Everyone else, one of you's going home. Round and round!"`,
  (H) => `${H}: "Two of you, one team, one Ferris wheel. Rider pelts the enemy targets, grounder dodges — land three and your partner's off the hook. Blindfold search next, then a tilt-maze you'll both hate. Sink three balls before anyone else and you and your partner are BOTH safe tonight. Lose, and the two of you had better hope it's not your name at tribal. Strap in!"`,
  (H) => `${H}: "It's the Wheel of Misfortune, folks — because half of you are about to have a very bad day up there. Ride and throw, dodge and duck, then blindfold, hunt, and tilt. Three hits, three balls, three holes, in that order. Winning pair walks with a double immunity. Losers walk to tribal council. Let's spin!"`,
];
const HOST_CLOSERS = [
  (H, a, b) => `${H}: "The last ball drops and it's OVER — ${a} and ${b} win Wheel of Misfortune, and they are BOTH immune tonight. Everybody else, the wheel's done spinning and one of you is done, period."`,
  (H, a, b) => `Three balls in the holes, clean. ${H} throws up his arms. "${a} and ${b} — immunity, the both of you! The rest of you get to go argue about who's leaving." The Ferris wheel groans to a stop behind them.`,
  (H, a, b) => `${H}: "That's the win! ${a} and ${b} tilt the last one home and take a shared immunity into tribal. Two safe, everyone else exposed. The Wheel of Misfortune claims its victims another way tonight."`,
];

// ══════════════════════════════════════════════════════════════════════
export function simulateWheelOfMisfortune(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  if (active.length < 2) return;
  _usedTpl = new Set(); _typeUsed = {};
  const H = hostName();
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  const camp = ep.campEvents[campKey];
  const personalScores = {}; active.forEach(n => personalScores[n] = 0);
  const bumpScore = (n, d) => { personalScores[n] = (personalScores[n] || 0) + d; };

  // ── PAIRING — Tied Destinies pairs if live, else bond/drama interleave ──
  const { pairs, spectator } = _pairPlayers(active);
  if (!pairs.length) return;

  // ── ROLES: rider (better aim) throws from the wheel; grounder (partner) dodges/searches ──
  const P = {};  // per-pair state, keyed by pair id
  pairs.forEach((pr, i) => {
    const [a, b] = pr;
    const rider = (aimOf(a) + noise(1.5)) >= (aimOf(b) + noise(1.5)) ? a : b;
    const grounder = rider === a ? b : a;
    P[i] = {
      id: i, members: pr, rider, grounder,
      // stage: 1=wheel dodgeball, 2=blindfold search, 3=tilt maze, 4=finished.
      // The relay runs on ONE shared clock — a pair that clears a stage early
      // starts the next stage while slower pairs are still behind, so a lead compounds.
      stage: 1, momentum: 0,
      hits: 0, freed: false, freedTick: -1,
      ballsFound: 0, searchDone: false, searchTick: -1,
      ballsSunk: 0, puzzleDone: false, finishTick: -1, finishOrder: -1,
      threw: false, bond: getBond(a, b),
    };
  });
  const pairOf = (name) => pairs.findIndex(pr => pr.includes(name));
  // dodge targets = grounders of pairs STILL on the wheel stage (they leave once freed)
  const enemyGrounders = (myId) => Object.values(P).filter(q => q.id !== myId && q.stage === 1).map(q => q.grounder);

  const roster = pairs.map((pr, i) => ({
    id: i, rider: P[i].rider, grounder: P[i].grounder,
    riderArch: archOf(P[i].rider), grounderArch: archOf(P[i].grounder),
    bond: P[i].bond,
    arch: _archPair(pr[0], pr[1]),
  }));

  // ── beat helpers with per-phase board snapshots ──
  const p1Beats = [], p2Beats = [], p3Beats = [];
  const boardP1 = () => Object.values(P).map(q => ({ id: q.id, rider: q.rider, grounder: q.grounder, hits: q.hits, freed: q.freed }));
  const boardP2 = () => Object.values(P).map(q => ({ id: q.id, rider: q.rider, grounder: q.grounder, balls: q.ballsFound, done: q.searchDone }));
  const boardP3 = () => Object.values(P).map(q => ({ id: q.id, members: q.members, sunk: q.ballsSunk, done: q.puzzleDone, won: q.finishOrder === 0 }));

  // ═══════════════════════════════════════════════════════════════════
  // THE RELAY — one shared clock. Every pair advances through its CURRENT
  // stage each tick; clearing a stage early means you start the next one
  // while rivals are still behind, so a lead compounds. Fewest total ticks
  // to finish the maze wins — finishing each stage first genuinely matters.
  // ═══════════════════════════════════════════════════════════════════
  const MAXTICK = 60;
  let tick = 0;
  const _pending = () => Object.values(P).filter(q => q.stage <= 3);
  while (_pending().length && tick < MAXTICK) {
    tick++;
    for (const q of Object.values(P)) {
      if (q.stage === 1) _dodgeTick(q, tick);
      else if (q.stage === 2) _searchTick(q, tick);
      else if (q.stage === 3) _mazeTick(q, tick);
    }
    _relaySocial(tick);
  }
  // safety: force-finish any stragglers still going at the cap, by progress
  Object.values(P).filter(q => q.stage <= 3).sort((a, b) =>
    (b.stage - a.stage) || (b.ballsSunk - a.ballsSunk) || (b.ballsFound - a.ballsFound) || (b.hits - a.hits)
  ).forEach(q => { tick++; q.stage = 4; q.finishTick = tick; });

  // winner = fewest total ticks to finish the maze (a real reward for leading the relay)
  const order = Object.values(P).slice().sort((a, b) =>
    (a.finishTick - b.finishTick) || (a.searchTick - b.searchTick) || (a.freedTick - b.freedTick) ||
    (b.ballsSunk - a.ballsSunk) || ((puzzleOf(b.members[0]) + puzzleOf(b.members[1])) - (puzzleOf(a.members[0]) + puzzleOf(a.members[1])))
  );
  order.forEach((q, i) => { q.finishOrder = i; });
  const winnerPair = order[0];

  const immune = winnerPair.members.slice();
  immune.forEach(n => { bumpScore(n, 3); bumpPop(n, 2); });

  // ── showmance danger / partner moment ──
  if (seasonConfig.romance !== 'disabled') {
    _checkShowmanceChalMoment(ep, null, null, personalScores, 'partner', pairs.map(pr => ({ members: pr })));
  }

  // ── romance sparks between partners forged by the shared ordeal ──
  if (seasonConfig.romance !== 'disabled') {
    for (const pr of pairs) {
      const [a, b] = pr;
      if (!romanticCompat(a, b)) continue;
      if (gs.showmances?.some(sh => sh.phase !== 'broken-up' && sh.players.includes(a) && sh.players.includes(b))) continue;
      if (Math.random() < 0.35 && _challengeRomanceSpark(a, b, ep, null, null, personalScores, 'shouting each other blind through the maze')) {
        p3Beats.push({ phase: 3, type: 'spark', kind: 'social', players: [a, b], badge: '💘 Sparks', badgeClass: 'social', board: boardP3(),
          text: draw([
            (x, y) => `Something clicks between ${x} and ${y} somewhere between the blindfold and the last ball — the whole camp's going to have opinions.`,
            (x, y) => `${x} spent the whole maze trusting ${y}'s voice completely, and by the finish there's a look between them that isn't about the challenge at all.`,
          ], a, b) });
        break;
      }
    }
  }

  // ── RESULTS ──
  const ranked = Object.values(P).sort((a, b) => a.finishOrder - b.finishOrder);
  const results = ranked.map((q, idx) => ({
    id: q.id, members: q.members, rider: q.rider, grounder: q.grounder,
    rank: idx + 1, won: q.finishOrder === 0,
    hits: q.hits, ballsFound: q.ballsFound, ballsSunk: q.ballsSunk,
    threwFor: q._threwFor || null,
  }));

  camp.post.push({ type: 'wheelWin', players: immune, badgeText: 'IMMUNITY', badgeClass: 'green', tag: 'wheel-of-misfortune',
    text: `${immune[0]} and ${immune[1]} won Wheel of Misfortune together and are both immune.` });

  // ── FINALIZE ──
  ep.wheelOfMisfortune = {
    immunityWinner: immune[0], immunePair: immune, spectator,
    host: H, hostOpen: pick(HOST_OPENERS)(H), hostClose: pick(HOST_CLOSERS)(H, immune[0], immune[1]),
    roster, results,
    phase1: { beats: p1Beats }, phase2: { beats: p2Beats }, phase3: { beats: p3Beats },
  };
  ep.isWheelOfMisfortune = true;
  ep.challengeType = 'wheel-of-misfortune';
  ep.challengeLabel = 'Wheel of Misfortune';
  ep.challengeCategory = 'adventure';
  ep.tribalPlayers = active;

  // immunity: winning pair BOTH safe
  ep.immunityWinner = immune[0];
  ep.extraImmune = ep.extraImmune || [];
  immune.forEach(n => { if (!ep.extraImmune.includes(n)) ep.extraImmune.push(n); });

  // scoring: finish order → score; winner clamped to #1
  ep.chalMemberScores = ep.chalMemberScores || {};
  ranked.forEach((q, idx) => {
    const base = (pairs.length - idx) * 5 + q.ballsSunk * 1.5 + q.ballsFound * 0.6 + Math.min(q.hits, 3) * 0.4;
    q.members.forEach(n => {
      ep.chalMemberScores[n] = Math.round(((ep.chalMemberScores[n] || 0) + base + (personalScores[n] || 0)) * 10) / 10;
    });
  });
  if (spectator) ep.chalMemberScores[spectator] = 0;
  const maxOther = Math.max(0, ...active.filter(n => !immune.includes(n)).map(n => ep.chalMemberScores[n] || 0));
  immune.forEach(n => { ep.chalMemberScores[n] = Math.max(ep.chalMemberScores[n] || 0, Math.round((maxOther + 3) * 10) / 10); });
  ep.chalPlacements = ranked.flatMap(q => q.members).concat(spectator ? [spectator] : []);

  updateChalRecord(ep);
  return ep;

  // ─────────────────────────────────────────────────────────────────────
  // PAIRING
  // ─────────────────────────────────────────────────────────────────────
  function _pairPlayers(activePlayers) {
    const n = activePlayers.length;
    if (n < 2) return { pairs: [], spectator: null };
    // Tied Destinies — use those exact pairs so fates stay connected
    if (gs._tiedDestiniesActive?.length) {
      const tdPairs = gs._tiedDestiniesActive
        .filter(p => activePlayers.includes(p.a) && activePlayers.includes(p.b))
        .map(p => [p.a, p.b]);
      const paired = new Set(tdPairs.flat());
      let spec = null;
      const leftover = activePlayers.filter(p => !paired.has(p));
      for (let i = 0; i < leftover.length; i += 2) {
        if (i + 1 < leftover.length) tdPairs.push([leftover[i], leftover[i + 1]]);
        else spec = leftover[i];
      }
      if (tdPairs.length) return { pairs: tdPairs, spectator: spec };
    }
    // bond/drama interleave — high-drama players anchor pairs, least dramatic sits out
    const byDrama = [...activePlayers].sort((a, b) => {
      const dA = activePlayers.reduce((s, p) => p === a ? s : s + Math.abs(getBond(a, p)), 0);
      const dB = activePlayers.reduce((s, p) => p === b ? s : s + Math.abs(getBond(b, p)), 0);
      return dB - dA;
    });
    let poolL = [...byDrama], spec = null;
    if (poolL.length % 2 !== 0) spec = poolL.pop();
    const prs = [];
    const half = Math.floor(poolL.length / 2);
    for (let i = 0; i < half; i++) prs.push([poolL[i], poolL[poolL.length - 1 - i]]);
    return { pairs: prs, spectator: spec };
  }

  function _archPair(a, b) {
    const av = isVillain(a), bv = isVillain(b), an = isNice(a), bn = isNice(b);
    if ((av && bn) || (bv && an)) return 'villain_hero';
    const sh = (gs.showmances || []).find(s => s.phase !== 'broken-up' && s.players?.every(p => [a, b].includes(p)));
    if (sh) return 'showmance';
    const bond = getBond(a, b);
    if (bond <= -3) return 'rivals';
    if (bond >= 5) return 'allies';
    if (bond <= 1) return 'strangers';
    return 'default';
  }

  // ── GAME-THROW: a player on the brink tips a ball out to gift a rival/showmance the win ──
  function _maybeGameThrow(q) {
    for (const name of q.members) {
      if (isVillain(name)) continue; // villains want the win
      const s = pStats(name);
      // find a leading opponent this player would sacrifice for
      const opp = Object.values(P).filter(o => o.id !== q.id && !o.puzzleDone)
        .flatMap(o => o.members)
        .filter(o => {
          const sh = (gs.showmances || []).find(x => x.phase !== 'broken-up' && x.players?.includes(name) && x.players?.includes(o));
          return sh || getBond(name, o) >= 6;
        })
        .sort((a, b) => getBond(name, b) - getBond(name, a))[0];
      if (!opp) continue;
      const isShow = (gs.showmances || []).some(x => x.phase !== 'broken-up' && x.players?.includes(name) && x.players?.includes(opp));
      // bold, loyal-ish, or in a showmance → willing to throw
      const chance = (s.boldness * 0.012) + (isShow ? 0.16 : 0) + (getBond(name, opp) * 0.015) - (s.strategic * 0.008);
      if (Math.random() > clamp(chance, 0, 0.34)) continue;
      // do it — big consequences
      const partner = q.members.find(m => m !== name);
      addBond(name, opp, 2); addBond(name, partner, -1.5); bumpPop(name, isShow ? 1 : -0.5);
      _heat(partner, name, 2);
      p3Beats.push({ phase: 3, type: 'gameThrow', kind: 'throw', players: [name, opp], badge: 'Tips It Out', badgeClass: 'throw',
        board: boardP3(), text: _gameThrowText(name, opp, partner, isShow) });
      camp.post.push({ type: 'wheelGameThrow', players: [name, opp, partner], badgeText: 'THREW THE CHALLENGE', badgeClass: 'red', tag: 'wheel-of-misfortune',
        text: `${name} deliberately rolled the winning ball out of bounds to hand ${opp} the win. ${partner} was furious.` });
      return opp;
    }
    return null;
  }

  function _heat(a, b, amt) {
    if (!gs._wheelOfMisfortuneHeat) gs._wheelOfMisfortuneHeat = {};
    gs._wheelOfMisfortuneHeat[a] = { target: b, amount: (gs._wheelOfMisfortuneHeat[a]?.amount || 0) + amt, expiresEp: (gs.episode || 0) + 2 };
  }

  // ─────────────────────────────────────────────────────────────────────
  // RELAY TICKS — one unit of work on a pair's CURRENT stage per shared tick
  // ─────────────────────────────────────────────────────────────────────
  function _dodgeTick(q, t) {
    const targets = enemyGrounders(q.id);
    if (!targets.length) {
      // last crew still on the wheel — no rival grounder left to peg, wave them off
      q.hits = 3;
    } else {
      const target = pick(targets);
      const aim = aimOf(q.rider) + q.momentum * 0.7 + noise(2.6);
      const evade = dodgeOf(target) + noise(2.6);
      if (aim > evade) {
        q.hits++; bumpScore(q.rider, 0.5);
        p1Beats.push({ phase: 1, type: 'hit', kind: 'hit', players: [q.rider, target], badge: `Hit ${q.hits}/3`, badgeClass: 'hit',
          board: boardP1(), text: _hitText(q.rider, target, q.hits) });
      } else if (Math.random() < 0.45) {
        p1Beats.push({ phase: 1, type: 'dodge', kind: 'dodge', players: [target, q.rider], badge: 'Dodge', badgeClass: 'dodge',
          board: boardP1(), text: _dodgeText(target, q.rider) });
      }
    }
    if (q.hits >= 3 && q.stage === 1) {
      _gainMomentum(q, 2);
      q.freed = true; q.stage = 2; q.freedTick = t;
      bumpScore(q.rider, 1); bumpScore(q.grounder, 0.5);
      p1Beats.push({ phase: 1, type: 'freed', kind: 'freed', players: [q.rider, q.grounder], badge: 'Partner Freed', badgeClass: 'freed',
        board: boardP1(), text: _freedText(q.rider, q.grounder) });
    }
  }

  function _searchTick(q, t) {
    const trust = clamp(q.bond, -4, 6);
    const rate = (guideOf(q.rider) + searchOf(q.grounder)) / 2 + trust * 0.25 + q.momentum * 0.7 + noise(2.6);
    if (rate > 6.2) {
      q.ballsFound++; bumpScore(q.grounder, 0.5);
      p2Beats.push({ phase: 2, type: 'find', kind: 'find', players: [q.grounder, q.rider], badge: `Ball ${q.ballsFound}/3`, badgeClass: 'find',
        board: boardP2(), text: _findText(q.grounder, q.rider, q.ballsFound) });
    } else if (Math.random() < 0.4) {
      p2Beats.push({ phase: 2, type: 'fumble', kind: 'fumble', players: [q.grounder], badge: 'Groping', badgeClass: 'fumble',
        board: boardP2(), text: _fumbleText(q.grounder, q.rider, q.bond) });
    }
    if (q.ballsFound >= 3 && q.stage === 2) {
      _gainMomentum(q, 3);
      q.searchDone = true; q.stage = 3; q.searchTick = t;
      bumpScore(q.grounder, 1);
      p2Beats.push({ phase: 2, type: 'searchDone', kind: 'find', players: [q.grounder, q.rider], badge: 'To The Maze', badgeClass: 'find',
        board: boardP2(), text: _searchDoneText(q.grounder, q.rider) });
    }
  }

  function _mazeTick(q, t) {
    const [a, b] = q.members;
    const combo = (puzzleOf(a) + puzzleOf(b)) / 2 + clamp(q.bond, -3, 6) * 0.22 + q.momentum * 0.7 + noise(3.0);
    // leadership handoff — a frustrated weaker solver cedes control (one-time, mid-run)
    if (!q._handoff && q.ballsSunk >= 1 && Math.random() < 0.28) {
      q._handoff = true;
      const weaker = puzzleOf(a) < puzzleOf(b) ? a : b;
      const leader = weaker === a ? b : a;
      addBond(a, b, 0.5);
      p3Beats.push({ phase: 3, type: 'handoff', kind: 'social', players: [weaker, leader], badge: 'Hands Over', badgeClass: 'social',
        board: boardP3(), text: _handoffText(weaker, leader) });
    }
    if (combo > 6.6) {
      q.ballsSunk++; bumpScore(a, 0.4); bumpScore(b, 0.4);
      p3Beats.push({ phase: 3, type: 'sink', kind: 'sink', players: [a, b], badge: `Sunk ${q.ballsSunk}/3`, badgeClass: 'sink',
        board: boardP3(), text: _sinkText(a, b, q.ballsSunk) });
    } else if (Math.random() < 0.42) {
      p3Beats.push({ phase: 3, type: 'slip', kind: 'slip', players: [a, b], badge: 'Rolls Out', badgeClass: 'slip',
        board: boardP3(), text: _slipText(a, b) });
    }
    // ── GAME-THROW: on the brink of winning, a player tips it for a rival / showmance ──
    if (q.ballsSunk >= 2 && q.stage === 3 && !q._throwChecked) {
      q._throwChecked = true;
      const thrown = _maybeGameThrow(q);
      if (thrown) { q._threwFor = thrown; q.ballsSunk = 2; return; }
    }
    if (q.ballsSunk >= 3 && q.stage === 3) {
      q.puzzleDone = true; q.stage = 4; q.finishTick = t;
    }
  }

  // momentum: clearing a stage in the FRONT of the pack builds flow (faster next
  // stage); clearing it at the back saps it. This compounds a relay lead so
  // finishing each stage first genuinely pays off — while noise still allows upsets.
  function _gainMomentum(q, nextStage) {
    const ahead = Object.values(P).filter(p => p !== q && p.stage >= nextStage).length;
    const front = ahead < (pairs.length - 1) / 2;
    q.momentum = clamp(q.momentum + (front ? 1.1 : -0.5), -1.5, 3.2);
  }

  // one social beat per tick, drawn from whichever stages are currently in play
  function _relaySocial(t) {
    const opts = [];
    if (Object.values(P).some(q => q.stage === 1)) opts.push(_p1Social);
    if (Object.values(P).some(q => q.stage === 2)) opts.push(_p2Social);
    if (Object.values(P).some(q => q.stage === 3)) opts.push(_p3Social);
    if (opts.length && Math.random() < 0.62) pick(opts)(t);
  }

  // ─────────────────────────────────────────────────────────────────────
  // PHASE 1 SOCIAL — taunts, info-leaks, show-offs (real consequences)
  // ─────────────────────────────────────────────────────────────────────
  function _p1Social(round) {
    const live = active.filter(n => Object.values(P).some(q => q.stage === 1 && q.members.includes(n)));
    if (live.length < 2) return;
    const events = [];
    const add = (w, type, fire) => events.push({ w, type, fire });

    // TAUNT — a rider trash-talks a target ("trying to steal another win")
    add(1.3, 'taunt', () => {
      const rider = pick(Object.values(P).filter(q => q.stage === 1).map(q => q.rider));
      const target = pick(active.filter(n => n !== rider && getBond(rider, n) < 3));
      if (!rider || !target) return;
      if (canScheme(rider)) addBond(rider, target, -0.8); else addBond(rider, target, -0.4);
      bumpPop(rider, isNice(rider) ? -0.2 : 0.2);
      p1Beats.push({ phase: 1, type: 'taunt', kind: 'social', players: [rider, target], badge: 'Trash Talk', badgeClass: 'social',
        board: boardP1(), text: draw([
          (r, t) => `${r} lines up a throw and calls down: "Trying to steal ANOTHER win, ${t}? Not today." ${t} just glares up and dodges.`,
          (r, t) => `"Nice helmet, ${t} — big target," ${r} yells from the cart, whipping a ball past ${pronouns(t).posAdj} ear. ${t} vows payback.`,
          (r, t) => `${r} spends more energy taunting ${t} than aiming. "You dodge like you strategize — badly." The whole ground crew hears it.`,
          (r, t) => `Every time the cart swings around, ${r} finds ${t} and jeers. ${t} is done being polite about it.`,
        ], rider, target) });
    });

    // INFO-LEAK — a schemer "motivates" a rival by nearly spilling the last vote
    const leaker = live.find(n => canScheme(n));
    if (leaker) add(1.1, 'leak', () => {
      const mark = pick(active.filter(n => n !== leaker && pairOf(n) !== pairOf(leaker)));
      if (!mark) return;
      addBond(leaker, mark, -1); _heat(mark, leaker, 1);
      p1Beats.push({ phase: 1, type: 'leak', kind: 'social', players: [leaker, mark], badge: 'Loose Lips', badgeClass: 'social',
        board: boardP1(), text: draw([
          (s, m) => `${s} shouts "encouragement" at ${m} that's really a landmine — half a sentence about how the last vote actually went. ${m} freezes, rattled, and eats a ball to the chest.`,
          (s, m) => `Under the guise of hyping ${m} up, ${s} lets slip a name from the last tribal that ${m} was NOT supposed to hear. The dodging stops. The staring starts.`,
          (s, m) => `${s} "accidentally" reminds ${m} who wrote ${pronouns(m).posAdj} name down last week — mid-challenge, loud enough for ${pronouns(m).obj} to lose focus completely.`,
        ], leaker, mark) });
    });

    // DEFLECT — a sharp grounder swats a ball away and struts
    add(1.0, 'deflect', () => {
      const g = pick(Object.values(P).filter(q => q.stage === 1).map(q => q.grounder).filter(n => dodgeOf(n) >= 5));
      if (!g) return;
      bumpPop(g, 0.3); bumpScore(g, 0.3);
      p1Beats.push({ phase: 1, type: 'deflect', kind: 'social', players: [g], badge: 'Deflected', badgeClass: 'social',
        board: boardP1(), text: draw([
          (x) => `${x} doesn't just dodge — ${pronouns(x).sub} bat${pronouns(x).sub === 'they' ? '' : 's'} the ball out of the air with a forearm and takes a little bow. The riders groan.`,
          (x) => `A ball comes screaming in and ${x} slaps it aside like it's nothing. Style points. The crowd of eliminated players loves it.`,
          (x) => `${x} slides under two throws and pops back up grinning. "Is that all you've got up there?" Pure showboating.`,
        ], g) });
    });

    _fireWeighted(events);
  }

  // ─────────────────────────────────────────────────────────────────────
  // PHASE 2 SOCIAL — steals, trust-cracks, help
  // ─────────────────────────────────────────────────────────────────────
  function _p2Social(round) {
    const live = active.filter(n => Object.values(P).some(q => q.stage === 2 && q.grounder === n));
    const events = [];
    const add = (w, type, fire) => events.push({ w, type, fire });

    // STEAL — a schemer's team swipes a ball a rival already found (Amelie swipe)
    const thief = active.find(n => canScheme(n) && Object.values(P).some(q => q.stage === 2 && q.members.includes(n)));
    if (thief) add(1.3, 'steal', () => {
      const victimPair = Object.values(P).filter(q => q.id !== pairOf(thief) && q.stage === 2 && q.ballsFound > 0)
        .sort((a, b) => b.ballsFound - a.ballsFound)[0];
      if (!victimPair) return;
      const victim = victimPair.grounder;
      const myPair = P[pairOf(thief)];
      victimPair.ballsFound = Math.max(0, victimPair.ballsFound - 1);
      if (myPair && !myPair.searchDone) myPair.ballsFound = Math.min(3, myPair.ballsFound + 1);
      addBond(thief, victim, -1.5); _heat(victim, thief, 2); bumpPop(thief, -0.3);
      p2Beats.push({ phase: 2, type: 'steal', kind: 'steal', players: [thief, victim], badge: 'Swiped', badgeClass: 'steal',
        board: boardP2(), text: draw([
          (s, v) => `${s} follows ${pronouns(s).posAdj} partner's directions right over to ${v}'s pile and swipes a ball while ${v} gropes blindly. "Once again, I do everything myself."`,
          (s, v) => `While ${v} is blindfolded and helpless, ${s} quietly lifts one of ${pronouns(v).posAdj} found balls and pockets it for ${pronouns(s).posAdj} own team. Ruthless.`,
          (s, v) => `${s} spots ${v}'s stash and can't resist — one ball vanishes from ${v}'s count and shows up on ${s}'s. ${v} will figure it out eventually. And remember.`,
        ], thief, victim) });
    });

    // TRUST-CRACK — low-bond pair fumbles because the grounder won't trust the guide
    const crackPair = Object.values(P).filter(q => q.stage === 2 && q.bond <= -1).sort((a, b) => a.bond - b.bond)[0];
    if (crackPair) add(1.2, 'trust', () => {
      addBond(crackPair.rider, crackPair.grounder, -0.5);
      p2Beats.push({ phase: 2, type: 'trust', kind: 'social', players: [crackPair.grounder, crackPair.rider], badge: 'No Trust', badgeClass: 'social',
        board: boardP2(), text: draw([
          (g, r) => `"Left! No — YOUR left!" ${r} barks, but ${g} doesn't trust a word of it and goes right anyway, straight into a hay bale. The clock keeps ticking.`,
          (g, r) => `${g} keeps second-guessing ${r}'s directions — with good reason, given their history — and the whole search grinds to a crawl.`,
          (g, r) => `Blindfolded, ${g} has to rely on the one person ${pronouns(g).sub} trust${pronouns(g).sub === 'they' ? '' : 's'} least. It goes about as well as you'd expect. ${r} is losing it.`,
        ], crackPair.grounder, crackPair.rider) });
    });

    // HELP — a nice player calls guidance to a struggling RIVAL (or steadies own partner)
    const helper = active.find(n => isNice(n) && Object.values(P).some(q => q.members.includes(n)));
    if (helper) add(1.0, 'help', () => {
      const strug = Object.values(P).filter(q => q.stage === 2 && !q.members.includes(helper)).sort((a, b) => a.ballsFound - b.ballsFound)[0];
      if (!strug) return;
      const who = strug.grounder;
      addBond(helper, who, 1.2); bumpPop(helper, 0.5);
      p2Beats.push({ phase: 2, type: 'help', kind: 'social', players: [helper, who], badge: 'Steadies', badgeClass: 'social',
        board: boardP2(), text: draw([
          (h, w) => `${w} is spinning in circles, totally lost — and ${h}, of all people, calls out a kind "warmer... warmer... there." Sportsmanship nobody asked for.`,
          (h, w) => `Even mid-challenge ${h} can't watch ${w} suffer, tossing ${pronouns(w).obj} a real direction. Their rivals can't believe it.`,
          (h, w) => `${h} steps in to calm a flailing ${w}. "Breathe. It's by your foot." It is. ${w} won't forget the gesture.`,
        ], helper, who) });
    });

    _fireWeighted(events);
  }

  // ─────────────────────────────────────────────────────────────────────
  // PHASE 3 SOCIAL — banter, rivalry, respect at the maze
  // ─────────────────────────────────────────────────────────────────────
  function _p3Social(round) {
    const live = active.filter(n => Object.values(P).some(q => q.stage === 3 && q.members.includes(n)));
    if (live.length < 2) return;
    const events = [];
    const add = (w, type, fire) => events.push({ w, type, fire });

    // BANTER — two leaders mock each other across the maze tables (Anastasia/Logan)
    add(1.0, 'banter', () => {
      const a = pick(live), b = pick(live.filter(n => n !== a && pairOf(n) !== pairOf(a)));
      if (!a || !b) return;
      p3Beats.push({ phase: 3, type: 'banter', kind: 'social', players: [a, b], badge: 'Banter', badgeClass: 'social',
        board: boardP3(), text: draw([
          (x, y) => `${x} and ${y} keep glancing at each other's boards and talking smack. "Yours is going to roll right back out." "So's your whole game." Neither drops a ball.`,
          (x, y) => `Across the tables ${x} playfully mocks ${y}'s tilting technique. ${y} mocks right back. It's almost friendly. Almost.`,
          (x, y) => `"You're shaking too hard," ${x} calls to ${y}. "That's the caffeine, not nerves," ${y} shoots back, nearly sinking one just to prove it.`,
        ], a, b) });
    });

    // RIVALRY — a losing pair blames the leaders
    const lowPair = Object.values(P).filter(q => q.stage === 3).sort((a, b) => a.ballsSunk - b.ballsSunk)[0];
    if (lowPair) add(1.1, 'rivalry', () => {
      const foe = pick(active.filter(n => !lowPair.members.includes(n) && getBond(lowPair.members[0], n) < 2));
      if (!foe) return;
      addBond(lowPair.members[0], foe, -1);
      p3Beats.push({ phase: 3, type: 'rivalry', kind: 'social', players: [lowPair.members[0], foe], badge: 'Frustration', badgeClass: 'social',
        board: boardP3(), text: draw([
          (x, y) => `Dead last at the maze, ${x} snaps at ${y}: "Must be nice, coasting on your partner." ${y} doesn't even look up. That stings more.`,
          (x, y) => `${x}'s temper finally goes — a ball rolls out for the fifth time and it's suddenly all ${y}'s fault, somehow. The grudge is real now.`,
          (x, y) => `"Enjoy it while it lasts, ${y}," ${x} mutters, tilting too hard and losing another ball. Losing does not look good on ${pronouns(x).obj}.`,
        ], lowPair.members[0], foe) });
    });

    // RESPECT — a clutch save earns a nod
    add(0.9, 'respect', () => {
      const doer = pick(live.filter(n => puzzleOf(n) >= 6));
      const witness = pick(live.filter(n => n !== doer && pairOf(n) !== pairOf(doer)));
      if (!doer || !witness) return;
      addBond(doer, witness, 0.8); bumpPop(doer, 0.4);
      p3Beats.push({ phase: 3, type: 'respect', kind: 'social', players: [doer, witness], badge: 'Respect', badgeClass: 'social',
        board: boardP3(), text: draw([
          (d, w) => `${d} threads a ball through the whole maze in one smooth tilt and even ${w}, a rival, has to say it: "Okay. That was clean."`,
          (d, w) => `A ball teeters on the edge of a wrong hole and ${d} saves it with a feather-light nudge. ${w} whistles. "Nerves of steel over there."`,
          (d, w) => `${d} makes the maze look easy for exactly one glorious run, and ${w} gives an honest nod across the tables.`,
        ], doer, witness) });
    });

    _fireWeighted(events);
  }

  function _fireWeighted(events) {
    if (!events.length) return;
    const eff = events.map(e => e.w / (1 + (_typeUsed[e.type] || 0) * 1.6));
    const total = eff.reduce((s, w) => s + w, 0);
    let roll = Math.random() * total, idx = 0;
    for (let i = 0; i < events.length; i++) { roll -= eff[i]; if (roll <= 0) { idx = i; break; } }
    _typeUsed[events[idx].type] = (_typeUsed[events[idx].type] || 0) + 1;
    events[idx].fire();
  }

  // ── narration builders ──
  function _hitText(r, t, hits) {
    return draw(hits >= 3 ? [
      (x, y) => `${x} rifles the third ball dead into ${y}'s helmet target — DING. That's three. ${pronouns(x).PosAdj} partner is free.`,
      (x, y) => `Third hit, clean off the top of the wheel — ${x} nails ${y} and the buzzer sounds. Locked in.`,
    ] : [
      (x, y) => `${x} times the swing of the cart perfectly and tags ${y}'s target. Hit number ${hits}.`,
      (x, y) => `${y} reads it a beat too late — ${x}'s throw thumps the helmet. ${hits} down.`,
      (x, y) => `From the top of the arc ${x} slings one in and catches ${y} flat-footed. That's ${hits}.`,
      (x, y) => `${x} leads ${y} just right and the ball smacks the target. ${hits} of three.`,
    ], r, t);
  }
  function _dodgeText(t, r) {
    return draw([
      (x, y) => `${x} sees ${y}'s throw coming off the wheel and drops into a slide — miss.`,
      (x, y) => `${y} hurls from the cart but ${x} is already gone, ducking clean under it.`,
      (x, y) => `A whistle of air past ${x}'s ear — ${y} misses high, ${x} barely flinches.`,
      (x, y) => `${x} juke steps, the ball sails wide, and ${y} mutters something from up top.`,
    ], t, r);
  }
  function _freedText(r, g) {
    return draw([
      (x, y) => `Three hits logged — ${x} did the damage from the wheel and now ${y} rips the blindfold up and sprints for the search zone.`,
      (x, y) => `That's the set. ${y} is officially freed by ${x}'s arm and bolts to the next phase.`,
      (x, y) => `${x} pumps a fist from the cart — ${y} is loose, blindfold in hand, phase two here we come.`,
    ], r, g);
  }
  function _findText(g, r, balls) {
    return draw(balls >= 3 ? [
      (x, y) => `${x}'s fingers close on the third ball — ${y} whoops from above. All three found.`,
    ] : [
      (x, y) => `"Down, down, RIGHT there!" ${y} yells, and ${x} closes a hand around ball number ${balls}.`,
      (x, y) => `Blindfolded, ${x} sweeps the ground on ${y}'s call and comes up with one. ${balls} of three.`,
      (x, y) => `${y}'s directions land perfectly — ${x} snags ball ${balls} without a wasted step.`,
      (x, y) => `${x} trusts the voice and lunges — got it. ${balls} down, guided by ${y}.`,
    ], g, r);
  }
  function _fumbleText(g, r, bond) {
    return draw([
      (x) => `${x} sweeps both arms across nothing but dirt, blindfold askew, and grumbles.`,
      (x) => `${x} crawls right past a ball, fingers an inch away, and moves the wrong direction.`,
      (x) => `A full circle for ${x} and nothing to show for it. The blindfold is winning.`,
      (x) => `${x} face-plants into a hay bale, pops back up, and gropes on. No ball this time.`,
    ], g);
  }
  function _searchDoneText(g, r) {
    return draw([
      (x, y) => `Three balls in the basket — ${x} rips off the blindfold and ${y} drops down from the wheel to hit the maze together.`,
      (x, y) => `${x} and ${y} clear the search and race to the tilt-maze, arms already out.`,
    ], g, r);
  }
  function _sinkText(a, b, sunk) {
    return draw(sunk >= 3 ? [
      (x, y) => `${x} and ${y} feather the board and the LAST ball drops home — three for three!`,
    ] : [
      (x, y) => `${x} and ${y} tilt in sync and roll one cleanly into the hole. ${sunk} of three.`,
      (x, y) => `A careful lean from ${x}, a counter-tilt from ${y}, and the ball drops. ${sunk} down.`,
      (x, y) => `${x} and ${y} finally find the rhythm — ball ${sunk} rattles into place.`,
    ], a, b);
  }
  function _slipText(a, b) {
    return draw([
      (x, y) => `${x} and ${y} over-tilt and the ball rolls right back out of bounds. Groan.`,
      (x, y) => `So close — ${x} leans one way, ${y} the other, and the ball skates off the board.`,
      (x, y) => `${x} and ${y} get a ball to the very lip of the hole and lose it. Again.`,
      (x, y) => `The board see-saws, ${x} and ${y} lose the handle, and it all rolls back to start.`,
    ], a, b);
  }
  function _handoffText(weaker, leader) {
    return draw([
      (x, y) => `${x} throws up ${pronouns(x).posAdj} hands — "You take it, I'm making it worse" — and lets ${y} steer the board. Smart call.`,
      (x, y) => `After one rollout too many, ${x} steps back and cedes the maze to ${y}. Ego swallowed, progress made.`,
      (x, y) => `${x} and ${y} argue for a beat, then ${x} gives ${y} full control of the tilt. It's the right move and they both know it.`,
    ], weaker, leader);
  }
  function _gameThrowText(name, opp, partner, isShow) {
    return draw(isShow ? [
      (x, y, p) => `On the brink of the win, ${x} catches ${y}'s eye across the tables and — deliberately — tips the board so the ball rolls out. "${p}, I'm sorry. I'm not beating ${y} like this." ${p} is stunned.`,
      (x, y, p) => `${x} has the winning ball an inch from the hole and lets it drop out of bounds on purpose, gifting ${y} the moment. Some things matter more to ${x} than immunity. ${p} does not agree.`,
    ] : [
      (x, y, p) => `${x} could win it right here — and instead tilts the ball clean off the board, handing the run to ${y}. "It's not how I want to beat anybody." ${p} is livid.`,
      (x, y, p) => `Everyone sees it: ${x} intentionally rolls the last ball out to let ${y} finish first. A debt repaid, a partner (${p}) betrayed, and a whole tribal's worth of questions.`,
    ], name, opp, partner);
  }
}

// ══════════════════════════════════════════════════════════════════════
// VP + TEXT are in wheel-of-misfortune-vp.js
// ══════════════════════════════════════════════════════════════════════
export {
  rpBuildWheelTitleCard, rpBuildWheelPhase1, rpBuildWheelPhase2, rpBuildWheelPhase3, rpBuildWheelResults,
  wheelRevealNext, wheelRevealAll,
} from './wheel-of-misfortune-vp.js';
