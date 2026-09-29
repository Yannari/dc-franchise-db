// ══════════════════════════════════════════════════════════════════════
// ci/games.js — the Circle's games (spec §13): which one, and how it plays
// ══════════════════════════════════════════════════════════════════════
//
// A game is data (games-data.js); one runner per family plays it. Every
// answer is public, and every answer has a consequence — "we want everyone
// in everyone's business, so they'll all know how each other voted" (the
// host, 1×01).
import { GAMES } from './games-data.js';
import { rel, bump, S, clamp, addScene, peopleOf, schemeEligible } from './state.js';
import { attractionOk } from './chat.js';
import { belief, nudgeBelief, noteAlly } from './beliefs.js';
import { feel } from './mind.js';
import { makeClaim, learn } from './claims.js';
import { rollSlips, probe } from './slips.js';

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
/** A profile the franchise rule keeps nice: every person behind it is a nice archetype. */
const isNice = (state, h) => peopleOf(state, h).every(n => NICE.has(state.people[n]?.archetype));

function shuffled(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const argmax = (list, score) => list.reduce((best, x) => (score(x) > score(best) ? x : best), list[0]);

// ── The runners, one per family ──────────────────────────────────────────

const RUN = {
  /** Agree or disagree; everyone sees who said what (1×01 Ice Breaker). */
  statement(state, rng, game, sc, all) {
    for (const p of shuffled(game.prompts, rng).slice(0, 4)) {
      const answers = {};
      for (const h of all) {
        const pAgree = clamp(0.5 + p.lean * (S(state, h, p.stat) - 5) / 10 + (rng() - 0.5) * 0.4, 0.05, 0.95);
        answers[h] = rng() < pAgree ? 'agree' : 'disagree';
        // An answer can contradict the profile ("She might be a dude").
        rollSlips(state, rng, h, all, { specific: 0.4, attention: 0.7 }, sc);
      }
      sc.data.rounds.push({ promptId: p.id, answers });
      for (const a of all) for (const b of all) if (a !== b && answers[a] === answers[b]) bump(a, b, 'affection', 0.15);
      for (const side of ['agree', 'disagree']) {
        const who = all.filter(h => answers[h] === side);
        if (who.length !== 1) continue;
        const [lone] = who;
        sc.data.rounds.at(-1).lone = lone;
        for (const obs of all) if (obs !== lone) nudgeBelief(state, obs, lone, 'real', -0.02 * S(state, obs, 'intuition') / 10, sc);
      }
    }
  },

  /** Say the Player who fits, in the open (1×11 Most Likely). */
  name(state, rng, game, sc, all) {
    for (const p of shuffled(game.prompts, rng).slice(0, 4)) {
      const answers = {};
      for (const voter of all) {
        const others = all.filter(o => o !== voter);
        const score = o => {
          if (p.tone === 'bad') {
            return isNice(state, voter) ? -rel(voter, o, 'affection') + rng()
              : rel(voter, o, 'resentment') + belief(state, voter, o).threat * 0.3 + rng() * 2;
          }
          return rel(voter, o, 'affection') + rng() * 2;
        };
        answers[voter] = argmax(others, score);
      }
      sc.data.rounds.push({ promptId: p.id, answers });
      for (const [namer, named] of Object.entries(answers)) {
        if (p.tone === 'bad') { bump(named, namer, 'resentment', 0.6); feel(state, named, 'stress', 0.5); }
        if (p.tone === 'good') { bump(named, namer, 'affection', 0.5); feel(state, named, 'elation', 0.5); }
      }
      if (p.tone === 'good') {
        const counts = {};
        for (const n of Object.values(answers)) counts[n] = (counts[n] || 0) + 1;
        const top = argmax(Object.keys(counts), k => counts[k]);
        feel(state, top, 'elation', 1);
        for (const v of all) if (v !== top) nudgeBelief(state, v, top, 'threat', 0.3, sc);
      }
    }
  },

  /** Each gives one Player something; the givers are revealed (Democracy Day). */
  gift(state, rng, game, sc, all) {
    const answers = {};
    for (const giver of all) {
      answers[giver] = argmax(all.filter(o => o !== giver),
        o => rel(giver, o, 'affection') + rel(giver, o, 'attraction') * 0.5 + rng());
    }
    sc.data.rounds.push({ promptId: 'gift', answers });
    for (const [giver, to] of Object.entries(answers)) {
      bump(to, giver, 'affection', 1.0);
      for (const obs of all) if (obs !== giver) noteAlly(state, obs, giver, to, sc);
    }
    for (const h of all) if (!Object.values(answers).includes(h)) feel(state, h, 'loneliness', 2);
  },

  /**
   * One anonymous question each, answered in front of everyone (1×03 Ask Me
   * Anything: "Are you really shy, or is that a front for easy likability?").
   * A suspected profile gets a catfish question — a probe the whole room
   * watches. A scheming asker may send a barbed one; anyone else asks the
   * Player they know least. The asked may work out who asked.
   */
  ask(state, rng, game, sc, all) {
    const answers = {}, questions = [];
    for (const asker of all) {
      const others = all.filter(o => o !== asker);
      const suspect = argmax(others, o => -belief(state, asker, o).real);
      let target, kind;
      if (belief(state, asker, suspect).real < 0.6) { target = suspect; kind = 'catfish'; }
      else if (schemeEligible(state, asker)) { target = argmax(others, o => rel(asker, o, 'resentment') + rng()); kind = 'barbed'; }
      else { target = argmax(others, o => -Math.abs(rel(asker, o, 'affection')) + rng()); kind = 'friendly'; }
      const q = { asker, target, kind, result: null, guessed: false };
      if (kind === 'catfish') {
        q.result = probe(state, rng, asker, target, sc);
        const d = q.result === 'fail' ? -0.1 : q.result === 'pass' ? 0.05 : 0;
        if (d) for (const obs of all) if (obs !== asker && obs !== target) nudgeBelief(state, obs, target, 'real', d, sc);
      } else if (kind === 'barbed') feel(state, target, 'stress', 1);
      else bump(target, asker, 'affection', 0.3);
      q.guessed = rng() < S(state, target, 'intuition') / 15;
      if (q.guessed && kind !== 'friendly') bump(target, asker, 'resentment', 1);
      answers[asker] = target;
      questions.push(q);
    }
    sc.data.rounds.push({ promptId: 'ask', answers, questions });
  },

  /**
   * Facts without names; everyone guesses whose (2×01 Says Who?). A catfish's
   * own fact can give them away; a fact everyone places reads as consistent.
   */
  guess(state, rng, game, sc, all) {
    for (const p of shuffled(game.prompts, rng).slice(0, 3)) {
      const answers = {}, placedBy = {};
      for (const h of all) {
        answers[h] = 'fact';
        rollSlips(state, rng, h, all, { specific: 0.6, attention: 0.8 }, sc);
        placedBy[h] = all.filter(o => o !== h && rng() < 0.3 + S(state, o, 'intuition') / 20
          + Math.max(0, rel(o, h, 'affection')) / 40);
        if (placedBy[h].length === all.length - 1) for (const o of placedBy[h]) nudgeBelief(state, o, h, 'real', 0.04, sc);
      }
      sc.data.rounds.push({ promptId: p.id, answers, placedBy });
    }
  },

  /** Name your biggest rival, and why you deserve it more (1×10 State Your Case). */
  rival(state, rng, game, sc, all) {
    const answers = {};
    for (const namer of all) {
      const rival = argmax(all.filter(o => o !== namer),
        o => belief(state, namer, o).threat + rel(namer, o, 'resentment') * 0.5 + rng());
      answers[namer] = rival;
      const c = makeClaim(state, { kind: 'targeting', holder: namer, about: rival, truth: true, secrecy: 'public', by: namer });
      for (const obs of all) if (obs !== namer) learn(state, obs, c, namer, sc);
      bump(rival, namer, 'resentment', 1.2);
      feel(state, rival, 'stress', 1);
    }
    sc.data.rounds.push({ promptId: 'rival', answers });
  },
};

/** Play a game with everyone still in, and record it as one public scene. */
export function runGame(state, rng, game) {
  const all = [...state.active];
  const sc = addScene(state, 'game', all, { gameId: game.id, family: game.family, rounds: [], results: {}, prize: null }, all);
  if (!RUN[game.family]) throw new Error(`no runner for the ${game.family} family yet`);
  RUN[game.family](state, rng, game, sc, all);
  return sc;
}

/** Mean suspicion in the room, read from beliefs that already exist. */
function roomSuspicion(state) {
  const vals = [];
  for (const obs of state.active) {
    for (const t of state.active) {
      const b = state.beliefs[obs]?.[t];
      if (b && obs !== t) vals.push(1 - b.real);
    }
  }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0.2;
}

function mutualSpark(state) {
  const a = state.active;
  return a.some((x, i) => a.slice(i + 1).some(y => attractionOk(state, x, y) && attractionOk(state, y, x)
    && rel(x, y, 'attraction') > 3 && rel(y, x, 'attraction') > 3));
}

/** Can this game be played by the room as it is today? */
export function playable(state, game) {
  const n = state.active.length;
  if (n < 3) return false;
  if (game.family === 'team') return n >= 6;
  if (game.family === 'flirt') return mutualSpark(state);
  return true;
}

/**
 * Today's game: never one already played; a `learn` game on day one; catfish
 * tests when the room is suspicious; divisive games late; never the same
 * purpose three times running.
 */
export function pickGame(state, rng, { days = 13 } = {}) {
  const played = (state.gamesPlayed ||= []);
  const last = played.slice(-2).map(id => GAMES.find(g => g.id === id)?.purpose);
  const susp = roomSuspicion(state);
  const options = GAMES.filter(g => !played.includes(g.id) && playable(state, g))
    .filter(g => state.day > 1 || g.purpose === 'learn')
    .filter(g => !(last.length === 2 && last[0] === last[1] && g.purpose === last[0]));
  const weighted = options.map(g => {
    let w = 1;
    if (g.purpose === 'learn' && state.day <= 3) w *= 3;
    if (g.purpose === 'catfish') w *= 1 + susp * 3;
    if (g.purpose === 'divide' && state.day > days * 2 / 3) w *= 2;
    if (g.purpose === last.at(-1)) w *= 0.3;
    return [g, w];
  });
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [g, w] of weighted) {
    if ((r -= w) <= 0) { played.push(g.id); return g; }
  }
  const g = weighted.at(-1)?.[0] || null;
  if (g) played.push(g.id);
  return g;
}
