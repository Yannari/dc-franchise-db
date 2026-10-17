// ══════════════════════════════════════════════════════════════════════
// ch/events.js — life in the villa: drama, comedy, romance, the game
// ══════════════════════════════════════════════════════════════════════
//
// The engine's other half. The vote, the call-out and the Arena are the spine;
// THIS is what fills the days between them, and on the real show it is most of
// the screen time: a prank war in the bunk room, a kitchen blow-up over
// nothing, a hot tub confession, a vet taking a rookie down a peg, TJ turning
// up at breakfast with a terrible idea, somebody crying on the phone home.
//
// Every event changes something (CLAUDE.md: no cosmetic events): a bond, a
// receipt, a meter, a fact somebody now knows, popularity. Every event leaves
// a scene with who saw it, for the story layer to write and the director to air.
//
// NO REPETITION, by construction (the user, 2026-10-14):
//   - a pair cooldown: the same event between the same people waits
//     `cooldown` episodes (a prank war is a war, not the same prank daily);
//   - a season cap per event (`max`);
//   - the shared scheduler's fresh-first rule within a day;
//   - the screen-time boost: somebody nobody has seen in a while gets a path on.
//
// Cast selection is deterministic per (season, day, event, person) — a stable
// hash, never the game's dice — so who is IN an event never moves a result.
import { gs } from '../core.js';
import { getBond, addBond } from '../bonds.js';
import { romanticCompat } from '../players.js';
import { scheduleWeightedEvents } from '../event-scheduler.js';
import { stableRng } from '../script/rng.js';
import { learn, factId } from '../knowledge.js';
import { S, archetypeOf, mayScheme, addScene, clamp } from './state.js';
import { nudge } from './mind.js';
import { remember, grudgeOf, resentOf, trustOf, intimidated, sparked, respected, attractOf, memories } from './rel.js';
import { allianceOf, activeAlliances } from './alliances.js';
import { coupleOf } from './callout.js';
import { homeFactor } from './romance.js';
import { arenaRead, freeRide } from './respect.js';
import { planOf } from './plans.js';
import { noteDeal } from './knowledge.js';
import { bankOf, injuryOf, skullsOf } from './state.js';
import { money, richest, passOf, passHunger } from './stakes.js';
const state0 = ctx => ctx.state;

// ── helpers ──────────────────────────────────────────────────────────
const pop = (name, d) => { gs.popularity ||= {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; };
const hash = (...parts) => stableRng(...parts)();
const jitter = (ctx, id, n) => hash(ctx.state.seed, ctx.state.day, id, n) * 0.6;
const arch = archetypeOf;
const is = (n, ...a) => a.includes(arch(n));
const pairKey = (id, a, b) => `${id}|${a < b ? a : b}|${a < b ? b : a}`;

// Nobody carries every scene: two house events a person an episode at most
// (a season's villain is still in plenty — just not in everything).
const busy = (ctx, n) => (ctx.state.eventLog.ep?.[ctx.state.ep]?.[n] || 0) >= 2;
function cooled(ctx, id, who, cooldown) {
  if (who.some(n => busy(ctx, n))) return false;
  const log = ctx.state.eventLog;
  // The one who STARTS it waits too: a schemer does not lie every day to a
  // different listener, a hothead does not blow up at somebody new every day.
  const def = EVENTS_BY_ID[id];
  if (def?.actorCooldown && (log.actor?.[`${id}|${who[0]}`] ?? -99) >= ctx.state.ep - def.actorCooldown) return false;
  const k = who.length >= 2 ? pairKey(id, who[0], who[1]) : `${id}|${who[0]}`;
  return (log.pairs[k] ?? -99) < ctx.state.ep - cooldown;
}
// ── rivalry: a feud escalates between the SAME two people ────────────
// Without it every row was a new pair, and no feud ever reached a third
// chapter (the storyline read, 2026-10-14). Two people who have clashed are
// rivals; the house's next row prefers them, until an apology is accepted or
// one of them goes home. Mutual, by pair. Fights (party.js) count too.
const FEUD_IDS = new Set(['kitchen-blowup', 'receipts', 'trash-talk', 'floater-callout', 'gossip-backfire', 'bunk-war',
  'show-banter', 'old-show-grudge', 'jealousy']);
const rkey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const rivalryOf = (state, a, b) => state.rivalry?.[rkey(a, b)] || 0;
export function addRivalry(state, a, b, d) {
  if (!a || !b || a === b) return;
  const r = (state.rivalry ||= {});
  r[rkey(a, b)] = Math.max(0, (r[rkey(a, b)] || 0) + d);
}
function used(ctx, id, who) {
  const log = ctx.state.eventLog;
  if (FEUD_IDS.has(id) && who.length >= 2) addRivalry(ctx.state, who[0], who[1], 1);
  log.uses[id] = (log.uses[id] || 0) + 1;
  log.pairs[who.length >= 2 ? pairKey(id, who[0], who[1]) : `${id}|${who[0]}`] = ctx.state.ep;
  for (const n of who) log.screen[n] = (log.screen[n] || 0) + 1;
  (log.actor ||= {})[`${id}|${who[0]}`] = ctx.state.ep;
  log.ep ||= {};
  const e = (log.ep[ctx.state.ep] ||= {});
  for (const n of who) e[n] = (e[n] || 0) + 1;
}

// The best pair by a score, deterministic, avoiding pairs on cooldown.
function bestPair(ctx, id, cooldown, score, { ordered = true } = {}) {
  const a = ctx.state.active;
  let best = null, top = 0;
  const feud = FEUD_IDS.has(id);
  for (const x of a) for (const y of a) {
    if (x === y || (!ordered && x > y)) continue;
    let s = score(x, y);
    // rivals clash again: the next row of a feud prefers the same two
    // (only where the event already fits: a rivalry never invents a vote to argue about)
    if (feud && s > 0) s += Math.min(3, rivalryOf(ctx.state, x, y)) * 1.1;
    if (!(s > 0)) continue;
    const v = s + jitter(ctx, id, x + '>' + y);
    if (v > top && cooled(ctx, id, [x, y], cooldown)) { top = v; best = [x, y]; }
  }
  return best ? { who: best, score: top } : null;
}
function bestOne(ctx, id, cooldown, score) {
  let best = null, top = 0;
  for (const x of ctx.state.active) {
    const s = score(x);
    if (!(s > 0)) continue;
    const v = s + jitter(ctx, id, x);
    if (v > top && cooled(ctx, id, [x], cooldown)) { top = v; best = x; }
  }
  return best ? { who: [best], score: top } : null;
}
const witnesses = (ctx, who, n = 3) => ctx.state.active.filter(x => !who.includes(x))
  .sort((a, b) => hash(ctx.state.seed, ctx.state.day, 'w', a) - hash(ctx.state.seed, ctx.state.day, 'w', b)).slice(0, n);

// ── the catalogue ────────────────────────────────────────────────────
// { id, kind, cooldown, max, cast(ctx) → {who, score} | null, weight(ctx, pick), fire(ctx, who, rng) → scene }
export const EVENTS = [
  // ── the places (the user, 2026-10-15: "create also events in specific locations") ──
  // The gym: two friends train for the Arena one of them is afraid of.
  { id: 'gym-training', kind: 'game', cooldown: 4, max: 4,
    cast: ctx => bestPair(ctx, 'gym-training', 4, (a, b) => (getBond(a, b) >= 1 ? (S(a, 'physical') + S(b, 'endurance') + (10 - S(a, 'temperament')) * 0.3 - 11) * 0.3 + getBond(a, b) * 0.1 : 0)),
    weight: (ctx, p) => (ctx.night ? 0 : 0.2 + p.score * 0.3),
    fire(ctx, [a, b], rng) {
      addBond(a, b, 0.6);
      nudge(ctx.state, a, 'confidence', 0.4);
      remember(a, b, 'was-there', 1);
      return addScene(ctx.state, 'gym-training', [a, b], { pushed: rng() < 0.5 }, [a, b, ...witnesses(ctx, [a, b], 1)], 'gym');
    } },
  // The pool: a chicken fight, two on two; the winners are louder about it than they should be.
  { id: 'pool-games', kind: 'comedy', cooldown: 5, max: 3,
    cast: ctx => bestPair(ctx, 'pool-games', 5, (a, b) => (getBond(a, b) >= 2 ? (S(a, 'boldness') + S(b, 'physical') - 9) * 0.3 : 0)),
    weight: (ctx, p) => (ctx.night ? 0.1 : 0.25 + p.score * 0.25),
    fire(ctx, [a, b], rng) {
      const rest = ctx.state.active.filter(n => n !== a && n !== b && !busy(ctx, n));
      const c = rest.sort((x, y) => S(y, 'boldness') - S(x, 'boldness'))[0];
      if (!c) return null;
      const d = rest.filter(n => n !== c).sort((x, y) => getBond(c, y) - getBond(c, x))[0];
      if (!d) return null;
      const us = S(a, 'physical') + S(b, 'physical') + rng() * 4, them = S(c, 'physical') + S(d, 'physical') + rng() * 4;
      const [w1, w2, l1, l2] = us >= them ? [a, b, c, d] : [c, d, a, b];
      addBond(w1, w2, 0.4); addBond(l1, l2, 0.3);
      addBond(w1, l1, S(l1, 'temperament') >= 5 ? 0.2 : -0.3);
      pop(w1, 0.5); pop(w2, 0.5);
      return addScene(ctx.state, 'pool-games', [w1, w2, l1, l2], { sore: S(l1, 'temperament') < 5 }, [w1, w2, l1, l2, ...witnesses(ctx, [w1, w2, l1, l2], 2)], 'pool');
    } },
  // The kitchen: somebody cooks for the whole house, with a helper; everybody eats.
  { id: 'house-dinner', kind: 'comedy', cooldown: 6, max: 3,
    // a person cooks for the whole house once a season (the same dinner, by the same cook, aired twice in five days)
    cast: ctx => bestPair(ctx, 'house-dinner', 6, (a, b) => (getBond(a, b) >= 1 && !ctx.state.cooked?.[a] ? (S(a, 'social') + S(a, 'loyalty') - 11) * 0.3 : 0)),
    weight: (ctx, p) => 0.2 + p.score * 0.25,
    fire(ctx, [a, b], rng) {
      (ctx.state.cooked ||= {})[a] = true;
      const eaters = witnesses(ctx, [a, b], 3);
      for (const n of eaters) { addBond(a, n, 0.25); addBond(b, n, 0.15); }
      addBond(a, b, 0.5);
      pop(a, 0.8);
      return addScene(ctx.state, 'house-dinner', [a, b, ...eaters], { burnt: rng() < 0.3 }, [a, b, ...eaters], 'kitchen');
    } },
  // The beach: a morning run turns into a race.
  { id: 'beach-run', kind: 'game', cooldown: 5, max: 3,
    cast: ctx => bestPair(ctx, 'beach-run', 5, (a, b) => (ctx.state.division[a] === ctx.state.division[b] ? (S(a, 'endurance') + S(b, 'endurance') + S(a, 'boldness') - 19) * 0.3 : 0), { ordered: false }),
    weight: (ctx, p) => (ctx.night ? 0 : 0.15 + p.score * 0.3),
    fire(ctx, [a, b], rng) {
      const winner = S(a, 'endurance') + rng() * 3 >= S(b, 'endurance') + rng() * 3 ? a : b;
      const loser = winner === a ? b : a;
      respected(loser, winner, 0.4, `${winner} beat ${loser} running on the beach`);
      const friendly = getBond(a, b) >= 1;
      addBond(a, b, friendly ? 0.4 : -0.3);
      nudge(ctx.state, winner, 'confidence', 0.3);
      return addScene(ctx.state, 'beach-run', [winner, loser], { friendly }, [winner, loser], 'beach');
    } },
  // The lookout: two friends at sunset, about home and about the end of this.
  { id: 'sunset-talk', kind: 'romance', cooldown: 5, max: 4,
    cast: ctx => bestPair(ctx, 'sunset-talk', 5, (a, b) => (getBond(a, b) >= 3 ? (S(a, 'social') + S(b, 'loyalty') - 10) * 0.3 + getBond(a, b) * 0.1 : 0), { ordered: false }),
    weight: (ctx, p) => (ctx.night ? 0 : 0.2 + p.score * 0.3),
    fire(ctx, [a, b], rng) {
      addBond(a, b, 0.8);
      remember(a, b, 'opened-up', 1); remember(b, a, 'opened-up', 1);
      return addScene(ctx.state, 'sunset-talk', [a, b], { endgame: rng() < 0.5 }, [a, b], 'lookout');
    } },
  // The bedroom, at night: two allies whisper about the vote; sometimes somebody in the next bunk is awake.
  { id: 'bunk-whisper', kind: 'game', cooldown: 4, max: 4,
    cast: ctx => bestPair(ctx, 'bunk-whisper', 4, (a, b) => (allianceOf(ctx.state, a) && allianceOf(ctx.state, a) === allianceOf(ctx.state, b) ? (S(a, 'strategic') + S(b, 'strategic') - 9) * 0.3 : 0), { ordered: false }),
    weight: (ctx, p) => (ctx.night ? 0.3 + p.score * 0.3 : 0),
    fire(ctx, [a, b], rng) {
      addBond(a, b, 0.4);
      const awake = rng() < 0.35 ? ctx.state.active.filter(n => n !== a && n !== b && allianceOf(ctx.state, n) !== allianceOf(ctx.state, a))
        .sort((x, y) => S(y, 'intuition') - S(x, 'intuition'))[0] : null;
      if (awake) { remember(awake, a, 'overheard-plan', 1.5); remember(awake, b, 'overheard-plan', 1); addBond(awake, a, -0.5); }
      return addScene(ctx.state, 'bunk-whisper', awake ? [a, b, awake] : [a, b], { heard: awake || null }, awake ? [a, b, awake] : [a, b], 'bedroom');
    } },
  // ── COMEDY / LIFE ──
  { id: 'prank', actorCooldown: 1, kind: 'comedy', cooldown: 3, max: 2,
    cast: ctx => bestPair(ctx, 'prank', 3, (a, b) => (S(a, 'boldness') + (is(a, 'chaos-agent', 'wildcard', 'hothead') ? 4 : 0) - 8) * 0.4 + Math.max(0, getBond(a, b)) * 0.15),
    weight: (ctx, p) => 0.1 + p.score * 0.03,   // a prank now and then; the house is its stories
    fire(ctx, [a, b], rng) {
      // Taken as a joke, or as war: temperament and the bond decide.
      const laughs = rng() < clamp(0.35 + S(b, 'temperament') * 0.05 + getBond(a, b) * 0.05, 0.1, 0.9);
      addBond(a, b, laughs ? 0.8 : -1);
      if (!laughs) remember(b, a, 'pranked-me', 0.9);
      pop(a, laughs ? 0.4 : 0.1);
      // A war: the victim owes one back (the next prank is theirs).
      if (!laughs) ctx.state.eventLog.pairs[pairKey('prank', a, b)] = ctx.state.ep - 2;
      return addScene(ctx.state, 'prank', [a, b], { laughs, war: !laughs }, [a, b, ...witnesses(ctx, [a, b])], 'villa');
    } },
  { id: 'kitchen-disaster', kind: 'comedy', cooldown: 4, max: 4,
    cast: ctx => bestOne(ctx, 'kitchen-disaster', 4, a => (S(a, 'social') + (10 - S(a, 'mental')) - 9) * 0.3),
    weight: (ctx, p) => 0.1 + p.score * 0.25,   // a gag: now and then (the house is its stories)
    fire(ctx, [a], rng) {
      const saved = rng() < 0.4;
      const helper = saved ? ctx.state.active.filter(x => x !== a).sort((x, y) => getBond(a, y) - getBond(a, x))[0] : null;
      if (helper) { addBond(a, helper, 1); remember(a, helper, 'was-there', 0.6); }
      for (const w of witnesses(ctx, [a], 4)) addBond(a, w, 0.15);
      pop(a, 0.5);
      return addScene(ctx.state, 'kitchen-disaster', helper ? [a, helper] : [a], { saved }, ctx.state.active, 'kitchen');
    } },
  { id: 'gym-flex', kind: 'comedy', cooldown: 4, max: 4,
    cast: ctx => bestPair(ctx, 'gym-flex', 4, (a, b) => (ctx.state.division[a] === ctx.state.division[b])
      ? (S(a, 'physical') + S(b, 'physical') + S(a, 'boldness') - 20) * 0.3 : 0, { ordered: false }),
    weight: (ctx, p) => 0.08 + p.score * 0.15,   // the gym's story is the training now; the contest is the odd one out
    fire(ctx, [a, b], rng) {
      const winner = S(a, 'physical') + rng() * 3 > S(b, 'physical') + rng() * 3 ? a : b;
      const loser = winner === a ? b : a;
      respected(loser, winner, 0.4, `${winner} won the pull-up contest`);
      nudge(ctx.state, winner, 'confidence', 0.4); nudge(ctx.state, loser, 'confidence', -0.2);
      addBond(a, b, S(loser, 'temperament') >= 5 ? 0.5 : -0.4);
      return addScene(ctx.state, 'gym-flex', [winner, loser], {}, [a, b, ...witnesses(ctx, [a, b], 2)], 'gym');
    } },
  { id: 'hot-tub-truths', kind: 'comedy', cooldown: 5, max: 4,
    cast: ctx => bestPair(ctx, 'hot-tub-truths', 5, (a, b) => getBond(a, b) >= 1 ? (S(a, 'social') + S(b, 'social') - 10) * 0.3 : 0, { ordered: false }),
    weight: ctx => (ctx.night ? 1.2 : 0.4),
    fire(ctx, [a, b], rng) {
      const third = ctx.state.active.filter(x => x !== a && x !== b).sort((x, y) => getBond(a, y) - getBond(a, x))[0];
      addBond(a, b, 0.7);
      // A truth slips: a crush or an alliance, overheard by the third.
      let slip = null;
      const al = allianceOf(ctx.state, a);
      if (third && al && !al.members.includes(third) && rng() < 0.35 + (10 - S(a, 'strategic')) * 0.03) {
        slip = { kind: 'alliance', alliance: al.id };
        learn(third, factId('alliance', a, String(al.id)), { sourceType: 'observed', source: 'heard it in the hot tub', ep: ctx.state.ep, confidence: 0.7 });
      } else {
        const crush = ctx.state.active.filter(x => x !== a && romanticCompat(a, x) && attractOf(a, x) > 0.5)[0];
        if (crush) slip = { kind: 'crush', on: crush };
      }
      return addScene(ctx.state, 'hot-tub-truths', [a, b].concat(third ? [third] : []), { slip }, [a, b].concat(third ? [third] : []), 'hot-tub');
    } },
  { id: 'tj-at-breakfast', kind: 'comedy', cooldown: 99, max: 3,
    cast: ctx => ({ who: [ctx.state.active[Math.floor(hash(ctx.state.seed, ctx.state.ep, 'tj') * ctx.state.active.length)]], score: 1 }),
    weight: () => 0,   // TJ never comes into the villa on this show: the trivia breakfast is off
    fire(ctx, [lucky], rng) {
      // TJ turns up with a terrible idea: breakfast trivia, prize a call home.
      const winner = [...ctx.state.active].sort((x, y) => (S(y, 'mental') + rng() * 4) - (S(x, 'mental') + rng() * 4))[0];
      nudge(ctx.state, winner, 'homesick', -2.5); nudge(ctx.state, winner, 'morale', 1);
      for (const n of ctx.state.active) nudge(ctx.state, n, 'morale', 0.2);
      ctx.state.tj[winner] = (ctx.state.tj[winner] || 0) + 0.3;
      return addScene(ctx.state, 'tj-at-breakfast', [winner, lucky], { prize: 'call-home' }, ctx.state.active, 'kitchen');
    } },
  { id: 'bunk-war', kind: 'comedy', cooldown: 5, max: 4,
    cast: ctx => bestPair(ctx, 'bunk-war', 5, (a, b) => ((10 - S(b, 'temperament')) + Math.abs(S(a, 'social') - S(b, 'social')) - 8) * 0.3),
    weight: (ctx, p) => 0.1 + p.score * 0.4,
    fire(ctx, [a, b], rng) {
      const moved = rng() < 0.4;
      addBond(a, b, moved ? -0.3 : -0.8);
      if (!moved) remember(b, a, 'kept-me-up', 0.6);
      return addScene(ctx.state, 'bunk-war', [a, b], { moved }, [a, b, ...witnesses(ctx, [a, b], 2)], 'bedroom');
    } },
  { id: 'show-banter', kind: 'comedy', cooldown: 6, max: 4,
    cast: ctx => bestPair(ctx, 'show-banter', 6, (a, b) => ctx.state.origin[a] && ctx.state.origin[b] && ctx.state.origin[a] !== ctx.state.origin[b]
      ? (S(a, 'social') + S(b, 'boldness') - 9) * 0.3 : 0),
    weight: ctx => 0.5 + ctx.state.cliqueStrength * 0.6,
    fire(ctx, [a, b], rng) {
      // "On MY show we..." — whose show is harder, taken well or badly.
      const ok = rng() < 0.55 + getBond(a, b) * 0.05;
      addBond(a, b, ok ? 0.6 : -0.6);
      return addScene(ctx.state, 'show-banter', [a, b], { a: ctx.state.origin[a], b: ctx.state.origin[b], ok }, [a, b, ...witnesses(ctx, [a, b], 3)], 'villa');
    } },
  { id: 'rookie-hazing', kind: 'comedy', cooldown: 4, max: 4,
    cast: ctx => bestPair(ctx, 'rookie-hazing', 4, (a, b) => !ctx.state.rookie[a] && ctx.state.rookie[b] ? (S(a, 'boldness') - 4) * 0.35 : 0),
    weight: ctx => (ctx.state.ep <= 6 ? 0.8 : 0.2),
    fire(ctx, [vet, rookie], rng) {
      const plays = rng() < 0.4 + S(rookie, 'temperament') * 0.05;
      addBond(vet, rookie, plays ? 0.8 : -1);
      if (!plays) { intimidated(vet, rookie, 0.4); remember(rookie, vet, 'talked-down-to', 1); } else pop(rookie, 0.4);
      return addScene(ctx.state, 'rookie-hazing', [vet, rookie], { plays }, ctx.state.active, 'villa');
    } },

  // ── DRAMA ──
  { id: 'kitchen-blowup', actorCooldown: 2, kind: 'drama', cooldown: 4, max: 6,
    cast: ctx => bestPair(ctx, 'kitchen-blowup', 4, (a, b) => ((10 - S(a, 'temperament')) * 0.25 + Math.max(0, -getBond(a, b)) * 0.3 + resentOf(a, b) * 0.15) - 1),
    weight: (ctx, p) => 0.1 + p.score * 0.45,
    fire(ctx, [a, b], rng) {
      addBond(a, b, -1.4);
      remember(b, a, 'blew-up-at-me', 1);
      pop(a, -0.3);
      const sideWith = witnesses(ctx, [a, b], 4).filter(w => Math.abs(getBond(w, a) - getBond(w, b)) >= 2);
      for (const w of sideWith) addBond(w, getBond(w, a) > getBond(w, b) ? b : a, -0.4);
      return addScene(ctx.state, 'kitchen-blowup', [a, b], { sides: sideWith }, ctx.state.active, 'kitchen');
    } },
  { id: 'receipts', actorCooldown: 1, kind: 'drama', cooldown: 3, max: 9,
    // "You voted me in." The open vote's grudges, said to their face.
    // Only between people where it is TRUE: b said a's name at a vote.
    cast: ctx => bestPair(ctx, 'receipts', 3, (a, b) => {
      if (!memories(a, b).some(m => m.type === 'voted-for-me')) return 0;
      const m = ctx.state.receiptsFresh?.[a]?.includes(b) ? 1.5 : 0;
      return m + grudgeOf(a, b) * 0.3 + S(a, 'boldness') * 0.05;
    }),
    weight: (ctx, p) => 0.9 + p.score * 0.2,
    fire(ctx, [a, b], rng) {
      const owns = rng() < 0.3 + S(b, 'boldness') * 0.03;     // "Yeah, I did. And?"
      const apology = !owns && rng() < 0.3 + S(b, 'social') * 0.04;
      addBond(a, b, apology ? 0.4 : owns ? -1.2 : -0.5);
      if (apology) { remember(a, b, 'made-amends', 0.8); addRivalry(ctx.state, a, b, -2); }
      if (owns) intimidated(b, a, 0.4);
      return addScene(ctx.state, 'receipts', [a, b], { owns, apology }, [a, b, ...witnesses(ctx, [a, b], 3)], 'villa');
    } },
  { id: 'old-show-grudge', kind: 'drama', cooldown: 99, max: 4,
    cast: ctx => bestPair(ctx, 'old-show-grudge', 99, (a, b) => (ctx.state.carriedGrudge?.[`${a}>${b}`] || 0)),
    weight: ctx => (ctx.state.ep <= 4 ? 1.6 : 0.6),
    fire(ctx, [a, b], rng) {
      const settled = rng() < 0.25 + S(a, 'temperament') * 0.04;
      addBond(a, b, settled ? 1.2 : -1.2);
      if (settled) { remember(a, b, 'made-amends', 1.2); addRivalry(ctx.state, a, b, -3); } else remember(a, b, 'old-grudge', 1.4);
      return addScene(ctx.state, 'old-show-grudge', [a, b], { settled }, ctx.state.active, 'villa');
    } },
  { id: 'trash-talk', actorCooldown: 1, kind: 'drama', cooldown: 3, max: 8,
    cast: ctx => bestPair(ctx, 'trash-talk', 3, (a, b) => ctx.state.division[a] === ctx.state.division[b]
      ? (S(a, 'boldness') - 5) * 0.3 + (arenaRead(ctx.state, a) - arenaRead(ctx.state, b)) * 0.2 + grudgeOf(a, b) * 0.15 : 0),
    weight: (ctx, p) => 0.15 + p.score * 0.4,
    fire(ctx, [a, b], rng) {
      const bites = rng() < 0.55 - S(b, 'temperament') * 0.03;
      intimidated(a, b, bites ? 0.8 : 0.3);
      if (bites) { nudge(ctx.state, b, 'confidence', -0.4); addBond(a, b, -0.8); }
      else { respected(b, a, 0.1, 'all talk'); nudge(ctx.state, a, 'confidence', -0.1); }
      pop(a, bites ? 0.3 : -0.2);
      return addScene(ctx.state, 'trash-talk', [a, b], { bites }, ctx.state.active, 'villa');
    } },
  { id: 'floater-callout', actorCooldown: 3, kind: 'drama', cooldown: 5, max: 4,
    cast: ctx => bestPair(ctx, 'floater-callout', 5, (a, b) => freeRide(ctx.state, b) > 0.3 ? (S(a, 'boldness') - 5) * 0.4 + freeRide(ctx.state, b) * 2 : 0),
    weight: (ctx, p) => 0.6 + p.score * 0.2,
    fire(ctx, [a, b], rng) {
      const fires = rng() < 0.5 + S(b, 'boldness') * 0.03;   // fires back, or takes it
      addBond(a, b, -1);
      remember(b, a, 'called-me-a-floater', 1.2);
      for (const w of ctx.state.active) if (w !== a && w !== b) remember(w, b, 'free-ride', 0.3);
      return addScene(ctx.state, 'floater-callout', [a, b], { firesBack: fires }, ctx.state.active, 'villa');
    } },
  { id: 'gossip-backfire', actorCooldown: 2, kind: 'drama', cooldown: 4, max: 6,
    cast: ctx => {
      const p = bestPair(ctx, 'gossip-backfire', 4, (a, b) => (S(a, 'social') - 4) * 0.2 + Math.max(0, -getBond(a, b)) * 0.25);
      if (!p) return null;
      const [a, b] = p.who;
      const c = ctx.state.active.filter(x => x !== a && x !== b && getBond(x, b) >= 2 && getBond(x, a) > -1)
        .sort((x, y) => getBond(y, b) - getBond(x, b))[0];
      return c ? { who: [a, b, c], score: p.score } : null;
    },
    weight: (ctx, p) => 0.15 + p.score * 0.35,
    fire(ctx, [a, b, c], rng) {
      // a talks about b to c; c is b's friend and tells.
      const tells = rng() < 0.45 + (getBond(c, b) - getBond(c, a)) * 0.06;
      if (tells) { addBond(a, b, -1.5); addBond(c, a, -0.4); remember(b, a, 'talked-behind-my-back', 1.4); remember(b, c, 'told-me-the-truth', 0.8); }
      else addBond(a, c, 0.4);
      return addScene(ctx.state, 'gossip-backfire', [a, b, c], { tells }, tells ? [a, b, c] : [a, c], 'villa');
    } },
  { id: 'homesick', kind: 'drama', cooldown: 4, max: 8,
    cast: ctx => bestOne(ctx, 'homesick', 4, a => (ctx.state.mind[a]?.homesick || 0) - 4.5),
    weight: (ctx, p) => 0.5 + p.score * 0.4,
    fire(ctx, [a], rng) {
      const friend = ctx.state.active.filter(x => x !== a).sort((x, y) => trustOf(a, y) - trustOf(a, x))[0];
      const comforted = friend && trustOf(a, friend) > 1;
      if (comforted) { addBond(a, friend, 1); remember(a, friend, 'was-there', 1.2); nudge(ctx.state, a, 'homesick', -1.2); nudge(ctx.state, a, 'morale', 0.6); }
      else nudge(ctx.state, a, 'morale', -0.6);
      return addScene(ctx.state, 'homesick', comforted ? [a, friend] : [a], { comforted, homesick: +(ctx.state.mind[a]?.homesick || 0).toFixed(1) },
        comforted ? [a, friend] : [a], comforted ? 'beach' : 'confessional');
    } },
  { id: 'jealousy', kind: 'drama', cooldown: 3, max: 6,
    cast: ctx => {
      for (const c of ctx.state.couples.filter(x => !x.ended)) {
        for (const [p, q] of [[c.a, c.b], [c.b, c.a]]) {
          const rival = ctx.state.active.filter(x => x !== p && x !== q && romanticCompat(q, x) && attractOf(x, q) > 0.6)[0];
          if (rival && cooled(ctx, 'jealousy', [p, rival], 3)) return { who: [p, rival, q], score: 1 + attractOf(rival, q) * 0.2 };
        }
      }
      return null;
    },
    weight: (ctx, p) => 0.8 + p.score * 0.2,
    fire(ctx, [p, rival, q], rng) {
      const blowup = rng() < 0.6 - S(p, 'temperament') * 0.03;
      addBond(p, rival, -1.5); addBond(p, q, blowup ? -1.2 : -0.3);
      remember(p, rival, 'went-after-my-partner', 1.5);
      return addScene(ctx.state, 'jealousy', [p, rival, q], { blowup }, blowup ? ctx.state.active : [p, rival, q], blowup ? 'villa' : 'pool');
    } },

  // ── ROMANCE ──
  { id: 'flirt', actorCooldown: 1, kind: 'romance', cooldown: 2, max: 12,
    cast: ctx => ctx.state.options.romance ? bestPair(ctx, 'flirt', 2, (a, b) => romanticCompat(a, b) && !coupleOf(ctx.state, a) && !coupleOf(ctx.state, b)
      ? ((S(a, 'social') + S(a, 'boldness') - 9) * 0.25 + attractOf(a, b) * 0.3 + (is(a, 'showmancer') ? 1 : 0)) * homeFactor(ctx.state, a) : 0) : null,
    weight: ctx => (ctx.night ? 1.1 : 0.6),
    fire(ctx, [a, b], rng) {
      const back = rng() < (0.35 + attractOf(b, a) * 0.1 + S(b, 'social') * 0.03) * homeFactor(ctx.state, b);
      if (back) { sparked(a, b, 0.7); addBond(a, b, 0.6); const k = a < b ? `${a}|${b}` : `${b}|${a}`; ctx.state.sparks[k] = (ctx.state.sparks[k] || 0) + 0.8; }
      else { addBond(a, b, -0.2); nudge(ctx.state, a, 'confidence', -0.3); }
      return addScene(ctx.state, 'flirt', [a, b], { back }, [a, b, ...witnesses(ctx, [a, b], 2)], ctx.night ? 'pool' : 'beach');
    } },
  { id: 'beach-date', kind: 'romance', cooldown: 3, max: 9,
    cast: ctx => {
      const c = ctx.state.couples.filter(x => !x.ended && ctx.state.active.includes(x.a) && ctx.state.active.includes(x.b))
        .find(x => cooled(ctx, 'beach-date', [x.a, x.b], 3));
      return c ? { who: [c.a, c.b], score: 1 } : null;
    },
    weight: () => 0.9,
    fire(ctx, [a, b], rng) {
      addBond(a, b, 1.2); sparked(a, b, 0.5);
      nudge(ctx.state, a, 'morale', 0.6); nudge(ctx.state, b, 'morale', 0.6);
      nudge(ctx.state, a, 'homesick', -0.5); nudge(ctx.state, b, 'homesick', -0.5);
      // The house notices a power couple forming.
      for (const w of ctx.state.active) if (w !== a && w !== b && S(w, 'strategic') >= 7) remember(w, a, 'power-couple', 0.5);
      return addScene(ctx.state, 'beach-date', [a, b], {}, [a, b], 'beach');
    } },
  { id: 'pda', kind: 'romance', cooldown: 4, max: 4,
    cast: ctx => {
      const c = ctx.state.couples.find(x => !x.ended && ctx.state.active.includes(x.a) && ctx.state.active.includes(x.b));
      if (!c) return null;
      const annoyed = ctx.state.active.filter(x => x !== c.a && x !== c.b).sort((x, y) => (10 - S(y, 'temperament')) - (10 - S(x, 'temperament')))[0];
      return annoyed && cooled(ctx, 'pda', [annoyed, c.a], 4) ? { who: [annoyed, c.a, c.b], score: 1 } : null;
    },
    weight: () => 0.6,
    fire(ctx, [annoyed, a, b], rng) {
      addBond(annoyed, a, -0.5); addBond(annoyed, b, -0.5);
      remember(annoyed, a, 'power-couple', 0.8);
      return addScene(ctx.state, 'pda', [annoyed, a, b], {}, ctx.state.active, 'villa');
    } },
  { id: 'ex-in-the-house', kind: 'romance', cooldown: 99, max: 3,
    cast: ctx => {
      const ex = (ctx.state.kin || []).find(k => k.kin === 'exes' && ctx.state.active.includes(k.a) && ctx.state.active.includes(k.b) && cooled(ctx, 'ex-in-the-house', [k.a, k.b], 99));
      return ex ? { who: [ex.a, ex.b], score: 2 } : null;
    },
    weight: ctx => (ctx.state.ep <= 5 ? 1.5 : 0.5),
    fire(ctx, [a, b], rng) {
      const rekindle = romanticCompat(a, b) && rng() < 0.25 + attractOf(a, b) * 0.1;
      addBond(a, b, rekindle ? 1.5 : -1);
      if (rekindle) { sparked(a, b, 1); const k = a < b ? `${a}|${b}` : `${b}|${a}`; ctx.state.sparks[k] = (ctx.state.sparks[k] || 0) + 1.5; }
      return addScene(ctx.state, 'ex-in-the-house', [a, b], { rekindle }, ctx.state.active, 'villa');
    } },

  // ── SOMEBODY AT HOME (state.atHome: a partner who is not in the cast) ──
  // Early on, they say so: the house knows from then on that this one is spoken for.
  { id: 'home-talk', kind: 'drama', cooldown: 99, max: 6,
    cast: ctx => {
      if (ctx.state.ep > 5) return null;
      const a = ctx.state.active.find(n => ctx.state.atHome[n] && !ctx.state.atHome[n].told && !busy(ctx, n));
      if (!a) return null;
      const b = ctx.state.active.filter(x => x !== a && !busy(ctx, x)).sort((x, y) => getBond(a, y) - getBond(a, x))[0];
      return b ? { who: [a, b], score: 1.5 } : null;
    },
    weight: ctx => (ctx.state.ep <= 2 ? 1.4 : 0.8),
    fire(ctx, [a, b], rng) {
      const at = ctx.state.atHome[a];
      at.told = ctx.state.ep;
      // an honest thing said early: the listener warms to them, and they miss home a little more for saying it
      addBond(a, b, 0.6); remember(b, a, 'told-me-something-real', 0.8);
      nudge(ctx.state, a, 'homesick', 0.8);
      return addScene(ctx.state, 'home-talk', [a, b], { home: at.name, stage: at.stage }, ctx.state.active, rng() < 0.5 ? 'beach' : 'villa');
    } },
  // They crossed a line with somebody, and two other people say what everybody is thinking.
  { id: 'home-gossip', kind: 'romance', cooldown: 4, max: 4,
    cast: ctx => {
      const st = ctx.state;
      // the house can only talk about it if it was told (home-talk)
      for (const c of st.active.filter(n => st.atHome[n]?.told)) {
        const with_ = coupleOf(st, c) || st.active.find(x => x !== c && (st.sparks[x < c ? `${x}|${c}` : `${c}|${x}`] || 0) >= 1);
        if (!with_) continue;
        const talkers = st.active.filter(x => x !== c && x !== with_ && !busy(ctx, x)).sort((x, y) => (S(y, 'social') - getBond(y, c) * 0.3) - (S(x, 'social') - getBond(x, c) * 0.3));
        const [g1] = talkers;
        const g2 = talkers.filter(x => x !== g1).sort((x, y) => getBond(g1, y) - getBond(g1, x))[0];
        // talked about once while it is a flirt, once more if it becomes a couple: not every pair in the house in turn
        const stage = coupleOf(st, c) ? 'couple' : 'flirting';
        if ((st.atHome[c].gossiped || []).includes(stage)) continue;
        if (g1 && g2) return { who: [g1, g2, c, with_], score: 1.4 };
      }
      return null;
    },
    weight: () => 0.9,
    fire(ctx, [g1, g2, c, with_], rng) {
      const st = ctx.state;
      const couple = !!coupleOf(st, c);
      (st.atHome[c].gossiped ||= []).push(couple ? 'couple' : 'flirting');
      // judged: the two who said it think less of them, and so does the audience
      addBond(g1, c, -0.4); addBond(g2, c, -0.3);
      remember(g1, c, 'cheating-on-somebody', 0.8); remember(g2, c, 'cheating-on-somebody', 0.6);
      pop(c, couple ? -1 : -0.5);
      // a friend of theirs hears it, and it gets back to them
      const back = st.active.some(x => x !== g1 && x !== g2 && x !== c && getBond(x, c) >= 3) && rng() < 0.4;
      if (back) { nudge(st, c, 'paranoia', 0.8); addBond(c, g1, -0.6); remember(c, g1, 'talked-behind-my-back', 1); }
      return addScene(st, 'home-gossip', [g1, g2, c, with_], { home: st.atHome[c].name, stage: st.atHome[c].stage, couple, back },
        [g1, g2], 'villa');
    } },
  // In a showmance with somebody at home: the night it catches up with them. They end it, or they don't.
  { id: 'home-guilt', kind: 'romance', cooldown: 99, max: 4,
    cast: ctx => {
      const st = ctx.state;
      const c = st.couples.find(x => !x.ended && x.overlapping?.length && !x.reckoned && st.active.includes(x.a) && st.active.includes(x.b) && st.ep > x.since);
      if (!c) return null;
      const a = c.overlapping[0], b = a === c.a ? c.b : c.a;
      return { who: [a, b], score: 2 };
    },
    weight: () => 1.2,
    fire(ctx, [a, b], rng) {
      const st = ctx.state;
      const c = st.couples.find(x => !x.ended && ((x.a === a && x.b === b) || (x.a === b && x.b === a)));
      c.reckoned = st.ep;
      const at = st.atHome[a];
      // never said a word about {home}: tonight the one they are with hears it, and so, soon, does the house
      if (!at.told) {
        at.told = st.ep;
        addBond(b, a, -1.2); remember(b, a, 'hid-somebody-at-home', 1.2);
        nudge(st, a, 'morale', -0.6); pop(a, -0.5);
        return addScene(st, 'home-guilt', [a, b], { home: at.name, stage: at.stage, ends: false, confess: true }, [a, b], 'beach');
      }
      // the loyal ones end it; the rest decide it is worth it, and carry it
      const ends = rng() < S(a, 'loyalty') / 10 * 0.75 + (at.stage === 'married' ? 0.15 : 0);
      if (ends) {
        c.ended = st.ep; c.endedBy = a; c.why = 'home';
        addBond(a, b, -2); remember(b, a, 'dumped-me', 1.4);
        nudge(st, b, 'morale', -1.5); nudge(st, a, 'morale', -0.6); nudge(st, a, 'homesick', 0.8);
        pop(a, 0.5);
      } else {
        addBond(a, b, 0.6); nudge(st, a, 'morale', -0.8);
        pop(a, -0.5);
      }
      return addScene(st, 'home-guilt', [a, b], { home: at.name, stage: at.stage, ends }, ends ? st.active : [a, b], ends ? 'beach' : 'pool');
    } },

  // ── THE GAME ──
  { id: 'overheard', kind: 'game', cooldown: 4, max: 8,
    cast: ctx => {
      // Somebody overhears a plan aimed at them.
      for (const t of ctx.state.active) {
        const hunter = ctx.state.active.find(h => h !== t && planOf(ctx.state, h)?.targets?.[0] === t);
        if (hunter && cooled(ctx, 'overheard', [t, hunter], 4) && hash(ctx.state.seed, ctx.state.day, 'ov', t) < S(t, 'intuition') * 0.05) return { who: [t, hunter], score: 1.2 };
      }
      return null;
    },
    weight: () => 0.9,
    fire(ctx, [t, hunter], rng) {
      learn(t, factId('target', hunter, t), { sourceType: 'observed', source: 'overheard it', ep: ctx.state.ep, confidence: 0.85 });
      nudge(ctx.state, t, 'paranoia', 1.2);
      addBond(t, hunter, -1);
      remember(t, hunter, 'coming-for-me', 1.6);
      return addScene(ctx.state, 'overheard', [t, hunter], {}, [t], 'villa');
    } },
  { id: 'ride-to-the-final', kind: 'game', cooldown: 99, max: 4,
    // A cross-division pact: a man and a woman who are not competition for
    // each other promise to drag each other to the final.
    cast: ctx => ctx.state.options.gendered ? bestPair(ctx, 'ride-to-the-final', 99, (a, b) => ctx.state.division[a] !== ctx.state.division[b] && a < b
      ? trustOf(a, b) * 0.3 + trustOf(b, a) * 0.3 + (S(a, 'strategic') + S(b, 'strategic')) * 0.05 - 2 : 0) : null,
    weight: ctx => (ctx.state.ep >= 3 ? 0.7 : 0.2),
    fire(ctx, [a, b], rng) {
      ctx.state.deals.push({ id: ctx.state.deals.length + 1, a, b, ep: ctx.state.ep, broken: null, tier: 'final' });
      noteDeal(ctx.state, a, b);
      remember(a, b, 'final-two', 1.5); remember(b, a, 'final-two', 1.5);
      addBond(a, b, 1);
      return addScene(ctx.state, 'ride-to-the-final', [a, b], {}, [a, b], 'beach');
    } },
  { id: 'loyalty-test', actorCooldown: 3, kind: 'game', cooldown: 5, max: 4,
    cast: ctx => {
      for (const al of activeAlliances(ctx.state)) {
        const L = al.leader;
        if (S(L, 'strategic') < 7 || !ctx.state.active.includes(L)) continue;
        const m = al.members.filter(x => x !== L && ctx.state.active.includes(x)).sort((x, y) => trustOf(L, x) - trustOf(L, y))[0];
        if (m && cooled(ctx, 'loyalty-test', [L, m], 5)) return { who: [L, m], score: 1 };
      }
      return null;
    },
    weight: () => 0.6,
    fire(ctx, [L, m], rng) {
      // A fake name told to one member: does it come back from somebody else?
      const leaks = rng() < 0.2 + S(m, 'social') * 0.03 + (10 - S(m, 'loyalty')) * 0.03;
      if (leaks) { addBond(L, m, -1.5); remember(L, m, 'leaked-my-plan', 1.6); }
      else { addBond(L, m, 0.8); remember(L, m, 'loyalty', 1); }
      return addScene(ctx.state, 'loyalty-test', [L, m], { leaks }, [L], 'villa');
    } },
  { id: 'vet-mentors-rookie', kind: 'game', cooldown: 99, max: 4,
    cast: ctx => bestPair(ctx, 'vet-mentors-rookie', 99, (a, b) => !ctx.state.rookie[a] && ctx.state.rookie[b] && !mayScheme(a)
      ? (S(a, 'social') + S(a, 'loyalty') - 10) * 0.3 + getBond(a, b) * 0.2 : 0),
    weight: () => 0.6,
    fire(ctx, [vet, rookie], rng) {
      addBond(vet, rookie, 1.4);
      remember(rookie, vet, 'worked-with-me', 1.2);
      nudge(ctx.state, rookie, 'confidence', 0.6);
      return addScene(ctx.state, 'vet-mentors-rookie', [vet, rookie], {}, [vet, rookie], 'gym');
    } },
  { id: 'scheme-lie', actorCooldown: 2, kind: 'game', cooldown: 4, max: 6,
    // A schemer plants a name: tells b that c is coming for them.
    cast: ctx => {
      const p = bestPair(ctx, 'scheme-lie', 4, (a, b) => mayScheme(a) ? (S(a, 'strategic') + S(a, 'social') - 11) * 0.3 + Math.max(0, getBond(a, b)) * 0.1 : 0);
      if (!p) return null;
      const [a, b] = p.who;
      const c = ctx.state.active.filter(x => x !== a && x !== b && grudgeOf(a, x) > 0.5).sort((x, y) => grudgeOf(a, y) - grudgeOf(a, x))[0];
      return c ? { who: [a, b, c], score: p.score } : null;
    },
    weight: (ctx, p) => 0.15 + p.score * 0.4,
    fire(ctx, [a, b, c], rng) {
      // Sharp readers see through it (the shared belief check).
      const believed = rng() < 0.85 - (S(b, 'intuition') + S(b, 'mental')) * 0.025 + trustOf(b, a) * 0.04;
      if (believed) { addBond(b, c, -1.2); remember(b, c, 'coming-for-me', 1.2, { told: a }); }
      else { addBond(b, a, -1); remember(b, a, 'lied-to-me', 1.5); }
      return addScene(ctx.state, 'scheme-lie', [a, b, c], { believed }, [a, b], 'villa');
    } },
  // ── the stakes (stakes.js): money, injuries, TJ's rankings, the skulls ──
  // The bank: somebody with money says so to somebody without; the one without remembers.
  { id: 'bank-brag', actorCooldown: 3, kind: 'drama', cooldown: 6, max: 4,
    cast: ctx => bestPair(ctx, 'bank-brag', 6, (a, b) => (bankOf(ctx.state, a) >= 20000 && bankOf(ctx.state, b) * 3 < bankOf(ctx.state, a)
      ? (S(a, 'boldness') - 5) * 0.3 + (bankOf(ctx.state, a) - bankOf(ctx.state, b)) / 25000 + Math.max(0, -getBond(a, b)) * 0.2 - (is(a, 'hero', 'loyal-soldier', 'underdog', 'goat') ? 2 : 0) : 0)),
    weight: (ctx, p) => 0.3 + p.score * 0.25,
    fire(ctx, [a, b], rng) {
      const firesBack = rng() < 0.35 + S(b, 'boldness') * 0.04;
      addBond(a, b, firesBack ? -1 : -0.7);
      remember(b, a, 'bragged-about-money', 1);
      pop(a, -0.3);
      if (firesBack) { pop(b, 0.3); nudge(ctx.state, a, 'paranoia', 0.4); }
      return addScene(ctx.state, 'bank-brag', [a, b], { firesBack, amount: money(bankOf(ctx.state, a)) }, [a, b, ...witnesses(ctx, [a, b], 2)], 'villa');
    } },
  // Two with nothing in the bank agree the richest one has to go: closer, and with a name.
  { id: 'money-talk', kind: 'game', cooldown: 5, max: 4,
    cast: ctx => {
      const rich = richest(ctx.state);
      if (!rich || bankOf(ctx.state, rich) < 25000) return null;
      const p = bestPair(ctx, 'money-talk', 5, (a, b) => (a !== rich && b !== rich && getBond(a, b) >= 1 && bankOf(ctx.state, a) <= 7500 && bankOf(ctx.state, b) <= 7500
        ? (S(a, 'strategic') - 4) * 0.3 + getBond(a, b) * 0.15 : 0), { ordered: false });
      return p ? { who: [...p.who, rich], score: p.score } : null;
    },
    weight: (ctx, p) => 0.3 + p.score * 0.25,
    fire(ctx, [a, b, c], rng) {
      addBond(a, b, 0.6);
      remember(a, c, 'too-much-money', 0.6); remember(b, c, 'too-much-money', 0.6);
      learn(a, factId('target', b, c), { ep: ctx.state.ep });
      return addScene(ctx.state, 'money-talk', [a, b], { target: c, amount: money(bankOf(ctx.state, c)) }, [a, b], 'villa');
    } },
  // Injuries: a friend tapes them up and tells them to sit the next one out.
  { id: 'injury-care', kind: 'drama', cooldown: 3, max: 6,
    cast: ctx => {
      const hurtN = ctx.state.active.filter(n => injuryOf(ctx.state, n));
      let best = null;
      for (const n of hurtN) for (const f of ctx.state.active) {
        if (f === n || getBond(f, n) < 2 || !cooled(ctx, 'injury-care', [f, n], 3)) continue;
        const s = getBond(f, n) * 0.3 + injuryOf(ctx.state, n).sev * 0.4 + jitter(ctx, 'injury-care', f + n);
        if (!best || s > best.score) best = { who: [f, n], score: s };
      }
      return best;
    },
    weight: (ctx, p) => 0.5 + p.score * 0.2,
    fire(ctx, [a, b], rng) {
      addBond(a, b, 0.8);
      remember(b, a, 'emotional-support', 1.2);
      nudge(ctx.state, b, 'morale', 0.8);
      const inj = injuryOf(ctx.state, b);
      return addScene(ctx.state, 'injury-care', [a, b], { part: inj.part, sev: inj.sev }, [a, b], 'villa');
    } },
  // ...and somebody who can scheme sees a hurt player as an easy week: send them in now. Overheard, sometimes.
  { id: 'injury-target', actorCooldown: 3, kind: 'game', cooldown: 4, max: 4,
    cast: ctx => {
      const hurtN = ctx.state.active.filter(n => injuryOf(ctx.state, n));
      let best = null;
      for (const n of hurtN) for (const a of ctx.state.active) {
        if (a === n || !mayScheme(a) || getBond(a, n) >= 2) continue;
        const b = ctx.state.active.filter(x => x !== a && x !== n && getBond(a, x) >= 1.5).sort((x, y) => getBond(a, y) - getBond(a, x))[0];
        if (!b || !cooled(ctx, 'injury-target', [a, n], 4)) continue;
        const s = (S(a, 'strategic') - 4) * 0.3 + injuryOf(ctx.state, n).sev * 0.5 + jitter(ctx, 'injury-target', a + n);
        if (!best || s > best.score) best = { who: [a, b, n], score: s };
      }
      return best;
    },
    weight: (ctx, p) => 0.35 + p.score * 0.25,
    fire(ctx, [a, b, c], rng) {
      addBond(a, b, 0.4);
      (ctx.state.marked ||= {})[c] = ctx.state.ep;
      learn(b, factId('target', a, c), { ep: ctx.state.ep });
      const heard = rng() < 0.3;
      if (heard) { addBond(c, a, -1.4); remember(c, a, 'kicked-me-when-down', 1.4); nudge(ctx.state, c, 'paranoia', 1); }
      return addScene(ctx.state, 'injury-target', heard ? [a, b, c] : [a, b], { heard, target: c, part: injuryOf(ctx.state, c).part }, heard ? [a, b, c] : [a, b], heard ? 'villa' : 'private');
    } },
  // TJ's rankings: the one who fell has words for the one who passed them.
  { id: 'ranking-beef', actorCooldown: 2, kind: 'drama', cooldown: 4, max: 5,
    cast: ctx => {
      const pr = [...ctx.state.scenes].reverse().find(s => s.kind === 'power-rankings' && s.ep === ctx.state.ep);
      const a = pr?.data.drop, b = pr?.data.passer;
      if (!a || !b || !ctx.state.active.includes(a) || !ctx.state.active.includes(b) || !cooled(ctx, 'ranking-beef', [a, b], 4)) return null;
      return { who: [a, b], score: 1 + (S(a, 'boldness') - 5) * 0.2 };
    },
    weight: (ctx, p) => (ctx.night ? 0.1 : 0.7 + p.score * 0.2),
    fire(ctx, [a, b], rng) {
      const laughs = rng() < 0.5;
      addBond(a, b, -0.8);
      addRivalry(ctx.state, a, b, 1);
      nudge(ctx.state, a, 'confidence', 0.3);
      if (laughs) remember(a, b, 'laughed-at-me', 0.8);
      return addScene(ctx.state, 'ranking-beef', [a, b], { laughs }, [a, b, ...witnesses(ctx, [a, b], 2)], 'villa');
    } },
  // The skulls: somebody without one, and the final getting closer, says it out loud to a friend.
  { id: 'pass-panic', kind: 'drama', cooldown: 3, max: 6,
    cast: ctx => {
      if (!passOf(ctx.state)) return null;
      const p = bestOne(ctx, 'pass-panic', 3, a => passHunger(ctx.state, a) - 0.4);
      if (!p) return null;
      const a = p.who[0];
      const f = ctx.state.active.filter(x => x !== a && getBond(a, x) >= 1.5).sort((x, y) => getBond(a, y) - getBond(a, x))[0];
      return f ? { who: [a, f], score: p.score } : null;
    },
    weight: (ctx, p) => 0.5 + p.score * 0.3,
    fire(ctx, [a, b], rng) {
      const plan = rng() < 0.5 + S(a, 'boldness') * 0.03;   // decides to go and get one, or just worries
      (ctx.state.passPanic ||= {})[a] = (ctx.state.passPanic[a] || 0) + (plan ? 1 : 0.4);
      nudge(ctx.state, a, 'paranoia', 0.5);
      addBond(a, b, 0.4);
      return addScene(ctx.state, 'pass-panic', [a, b], { plan, token: passOf(ctx.state) }, [a, b], 'villa');
    } },
  // ...and somebody with one makes sure the ones without one know it.
  { id: 'pass-flex', actorCooldown: 3, kind: 'drama', cooldown: 5, max: 4,
    cast: ctx => (!passOf(ctx.state) ? null : bestPair(ctx, 'pass-flex', 5, (a, b) => (skullsOf(ctx.state, a) && !skullsOf(ctx.state, b) && state0(ctx).division[a] === state0(ctx).division[b]
      ? (S(a, 'boldness') - 5) * 0.35 + Math.max(0, -getBond(a, b)) * 0.3 - (is(a, 'hero', 'loyal-soldier', 'underdog', 'goat', 'social-butterfly') ? 3 : 0) : 0))),
    weight: (ctx, p) => 0.3 + p.score * 0.25,
    fire(ctx, [a, b], rng) {
      addBond(a, b, -0.8);
      remember(b, a, 'rubbed-it-in', 1);
      (ctx.state.passPanic ||= {})[b] = (ctx.state.passPanic[b] || 0) + 0.5;
      return addScene(ctx.state, 'pass-flex', [a, b], { token: passOf(ctx.state), count: skullsOf(ctx.state, a) }, [a, b, ...witnesses(ctx, [a, b], 2)], 'villa');
    } },
];

const EVENTS_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));

// ── one stretch of the day ───────────────────────────────────────────
export function houseBeats(state, rng, { night = false, min = 2, max = 4 } = {}) {
  state.eventLog ||= { uses: {}, pairs: {}, screen: {} };
  const ctx = { state, night, picks: {} };
  // The scheduler asks who is in an event BEFORE it asks its weight, every
  // beat; casting happens there, against the world as it stands now.
  const castFor = (def, c) => {
    if ((state.eventLog.uses[def.id] || 0) >= def.max) { c.picks[def.id] = null; return null; }
    return (c.picks[def.id] = def.cast(c));
  };
  const events = EVENTS.map(def => ({
    id: def.id,
    _def: def,
    weight(c) {
      const pick = c.picks[def.id];
      return pick ? def.weight(c, pick) : 0;
    },
    fire(c, meta, r) {
      const who = c.picks[def.id].who;
      used(c, def.id, who);
      const sc = def.fire(c, who, r);
      if (sc) sc.data.eventKind = def.kind;
      return sc;
    },
  }));
  return scheduleWeightedEvents(events, ctx, { rng, min, max, maxUses: 1, participantCounts: state.eventLog.screen,
    participantsOf: (ev, c) => (castFor(ev._def, c)?.who || []) });
}
