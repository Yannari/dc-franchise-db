// ══════════════════════════════════════════════════════════════════════
// ci/games.js — the Circle's games (spec §13): which one, and how it plays
// ══════════════════════════════════════════════════════════════════════
//
// A game is data (games-data.js); one runner per family plays it. Every
// answer is public, and every answer has a consequence — "we want everyone
// in everyone's business, so they'll all know how each other voted" (the
// host, 1×01).
import { GAMES } from './games-data.js';
import { TRIVIA, FACTS } from './games-content.js';
import { beatsFor } from './game-beats.js';
import { rel, bump, S, clamp, addScene, peopleOf, schemeEligible } from './state.js';
import { attractionOk } from './chat.js';
import { belief, nudgeBelief, noteAlly } from './beliefs.js';
import { feel } from './mind.js';
import { makeClaim, learn } from './claims.js';
import { rollSlips, probe } from './slips.js';
import { isPair, leadFor } from './shared.js';

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
/** A profile the franchise rule keeps nice: every person behind it is a nice archetype. */
const isNice = (state, h) => peopleOf(state, h).every(n => NICE.has(state.people[n]?.archetype));

function shuffled(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const argmax = (list, score) => list.reduce((best, x) => (score(x) > score(best) ? x : best), list[0]);
function weightedPick(list, weight, rng) {
  if (!list.length) return null;
  const w = list.map(x => Math.max(0.01, weight(x)));
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) if ((r -= w[i]) <= 0) return list[i];
  return list.at(-1);
}

// ── The runners, one per family ──────────────────────────────────────────

const RUN = {
  /** Agree or disagree; everyone sees who said what (1×01 Ice Breaker). */
  statement(state, rng, game, sc, all) {
    for (const p of shuffled(game.prompts, rng).slice(0, 4)) {
      const answers = {};
      for (const h of all) {
        const who = isPair(state, h) ? leadFor(state, h, 'statement', rng) : null;
        const pAgree = clamp(0.5 + p.lean * (S(state, h, p.stat, { who }) - 5) / 10 + (rng() - 0.5) * 0.4, 0.05, 0.95);
        answers[h] = rng() < pAgree ? 'agree' : 'disagree';
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
    // Over the whole game, an answer can contradict the profile ("She might be
    // a dude"). Once per player, not per round: the lone-answer rule above is
    // already the room reading each round (the audit showed per-round rolls
    // doubling the season's misreads).
    for (const h of all) rollSlips(state, rng, h, all, { specific: 0.8, attention: 0.7 }, sc);
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
    // A small room asks more than once, so the segment is as full as a big
    // room's: until eight questions are asked, players ask again, never the
    // same person twice.
    const askers = [...all];
    for (const x of shuffled(all, rng)) { if (askers.length >= Math.min(8, all.length * 2)) break; askers.push(x); }
    for (const asker of askers) {
      const asked = new Set(questions.filter(q => q.asker === asker).map(q => q.target));
      const others = all.filter(o => o !== asker && !asked.has(o));
      if (!others.length) continue;
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
      const bank = FACTS[p.id] || [];
      const taken = new Set();
      for (const h of all) {
        // The fact a player submits: drawn by who they are (proportional),
        // and never the same fact as somebody else's.
        const who = isPair(state, h) ? leadFor(state, h, 'statement', rng) : null;
        const open = bank.filter(f => !taken.has(f.id));
        const f = weightedPick(open.length ? open : bank, x => S(state, h, x.stat, { who }) + rng() * 3, rng);
        answers[h] = f?.id || 'fact';
        taken.add(answers[h]);
        placedBy[h] = all.filter(o => o !== h && rng() < 0.3 + S(state, o, 'intuition') / 20
          + Math.max(0, rel(o, h, 'affection')) / 40);
        if (placedBy[h].length === all.length - 1) for (const o of placedBy[h]) nudgeBelief(state, o, h, 'real', 0.04, sc);
      }
      sc.data.rounds.push({ promptId: p.id, answers, placedBy });
    }
    // A catfish's facts can give them away — once per player per game.
    for (const h of all) rollSlips(state, rng, h, all, { specific: 2.5, attention: 0.8 }, sc);
  },

  /**
   * Make something, often of another Player, and post it; the likes judge
   * (1×04 Nailed It, 1×08 Portrait Mode). A scheming maker who resents the
   * subject makes a jab — a public one. A nice maker never does.
   */
  make(state, rng, game, sc, all) {
    const p = game.prompts[0];
    const quality = Object.fromEntries(all.map(h =>
      [h, p.stats.reduce((s, k) => s + S(state, h, k), 0) / p.stats.length + rng() * 3]));
    const answers = {}, portrayals = {};
    if (p.about) {
      const order = shuffled(all, rng);
      order.forEach((maker, i) => {
        const subject = order[(i + 1) % order.length];
        answers[maker] = subject;
        const jab = schemeEligible(state, maker) && rel(maker, subject, 'resentment') > rel(maker, subject, 'affection');
        portrayals[maker] = jab ? 'jab' : 'kind';
        if (jab && game.anonymous) {
          // An anonymous jab stings, but nobody knows whose it was.
          feel(state, subject, 'stress', 1);
          feel(state, subject, 'paranoia', 1);
        } else if (jab) {
          const c = makeClaim(state, { kind: 'distrusts', holder: maker, about: subject, truth: true, secrecy: 'public', by: maker });
          for (const obs of all) if (obs !== maker) learn(state, obs, c, maker, sc);
          bump(subject, maker, 'resentment', 1);
        } else if (!game.anonymous) bump(subject, maker, 'affection', 0.5);
        else feel(state, subject, 'elation', 0.5);
      });
    } else for (const h of all) answers[h] = 'made';
    const likes = Object.fromEntries(all.map(h => [h, 0]));
    for (const liker of all) {
      all.filter(o => o !== liker).map(o => [o, quality[o] + rel(liker, o, 'affection') * 0.3])
        .sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([o]) => { likes[o]++; });
    }
    // Anonymous portraits: each subject tries to work out who painted them;
    // guessing a jab right turns the sting into a grudge.
    const guesses = {};
    if (game.anonymous && p.about) {
      for (const [maker, subject] of Object.entries(answers)) {
        const right = rng() < S(state, subject, 'intuition') / 15;
        guesses[subject] = { maker, right };
        if (right && portrayals[maker] === 'jab') bump(subject, maker, 'resentment', 1);
      }
    }
    sc.data.rounds.push({ promptId: p.id, answers, portrayals, guesses });
    sc.data.results = { quality, likes, winner: argmax(all, h => likes[h] + quality[h] / 100) };
  },

  /** Post a photo; the room reacts (1×05 Hashtag This). */
  photo(state, rng, game, sc, all) {
    const answers = {}, likes = Object.fromEntries(all.map(h => [h, 0]));
    for (const poster of all) {
      answers[poster] = 'posted';
      rollSlips(state, rng, poster, all, { specific: 0.2, attention: 0.5 }, sc);
      for (const viewer of all) {
        if (viewer === poster) continue;
        bump(viewer, poster, 'affection', 0.2);
        if (attractionOk(state, viewer, poster)) bump(viewer, poster, 'attraction', 0.4);
        if (rel(viewer, poster, 'affection') + rng() * 2 > 1) likes[poster]++;
      }
    }
    sc.data.rounds.push({ promptId: 'photo', answers });
    sc.data.results = { likes, winner: argmax(all, h => likes[h]) };
  },

  /**
   * Two captains pick teams in turn (1×07 Trivia Night: the captains are the
   * day's newcomers, scouting profiles before they pick). Teammates bond; the
   * last one picked feels it.
   */
  team(state, rng, game, sc, all) {
    const fresh = all.filter(h => state.joinedDay?.[h] === state.day);
    const last = [...state.ratings].reverse().find(r => !r.final);
    const captains = fresh.length >= 2 ? fresh.slice(0, 2)
      : last ? last.results.map(r => r.profile).filter(h => all.includes(h)).slice(0, 2)
        : [...all].sort((a, b) => S(state, b, 'social') - S(state, a, 'social')).slice(0, 2);
    const teams = [[captains[0]], [captains[1]]];
    const left = all.filter(h => !captains.includes(h));
    let turn = 0, lastPick = null;
    while (left.length) {
      const cap = captains[turn % 2];
      const pick = argmax(left, o => rel(cap, o, 'affection') + S(state, o, 'mental') * 0.3 + rng());
      teams[turn % 2].push(pick);
      left.splice(left.indexOf(pick), 1);
      lastPick = pick;
      turn++;
    }
    if (lastPick) {
      feel(state, lastPick, 'loneliness', 1.5);
      for (const c of captains) bump(lastPick, c, 'resentment', 0.4);
    }
    for (const t of teams) for (const a of t) for (const b of t) if (a !== b) bump(a, b, 'affection', 0.4);
    // The quiz itself: questions in turn, one teammate answering each; right
    // in proportion to what they know (1×07: "I'm here for brains on my
    // trivia team"). A tie goes to one more question.
    const scores = [0, 0], questions = [];
    const cats = shuffled(game.prompts, rng);
    const asked = new Set();
    const ask = (ti, i) => {
      const cat = cats[i % cats.length].id;
      const q = shuffled(TRIVIA[cat] || [], rng).find(x => !asked.has(x.id));
      if (!q) return;
      asked.add(q.id);
      const team = teams[ti];
      const answerer = team[i % team.length];
      const right = rng() < clamp(S(state, answerer, 'mental') / 12 + rng() * 0.3, 0.1, 0.95);
      if (right) scores[ti]++;
      if (right) for (const m of team) if (m !== answerer) bump(m, answerer, 'affection', 0.2);
      questions.push({ team: ti, cat, qid: q.id, by: answerer, right, score: [...scores] });
    };
    for (let i = 0; i < 10; i++) ask(i % 2, Math.floor(i / 2) + (i % 2));
    if (scores[0] === scores[1]) { ask(0, 11); ask(1, 12); }
    if (scores[0] === scores[1]) scores[rng() < 0.5 ? 0 : 1] += 0.5;
    const answers = Object.fromEntries(teams.flatMap((t, i) => t.map(h => [h, i])));
    sc.data.rounds.push({ promptId: cats[0].id, answers, questions });
    sc.data.results = { captains, teams, scores, lastPick, winner: scores[0] >= scores[1] ? 0 : 1 };
  },

  /** Pickup lines, and a date for the pair that clicks (5×02 Talk Flirty to Me). */
  flirt(state, rng, game, sc, all) {
    // Everybody delivers a pickup line to their crush; a line that lands
    // where the crush is mutual grows it both ways. The room votes the best.
    const answers = {};
    for (const a of all) {
      const options = all.filter(b => b !== a && attractionOk(state, a, b));
      if (!options.length) continue;
      answers[a] = argmax(options, b => rel(a, b, 'attraction') + rng());
    }
    for (const [a, b] of Object.entries(answers)) {
      if (attractionOk(state, b, a) && rel(b, a, 'attraction') > 3) { bump(a, b, 'attraction', 1); bump(b, a, 'attraction', 1); feel(state, b, 'elation', 1); }
      else bump(b, a, 'affection', 0.2);
      feel(state, a, 'elation', 0.5);
    }
    const votes = {};
    for (const v of all) {
      const pickFrom = Object.keys(answers).filter(x => x !== v);
      if (!pickFrom.length) continue;
      const w = argmax(pickFrom, x => S(state, x, 'boldness') * 0.3 + rel(v, x, 'affection') * 0.2 + rng() * 2);
      votes[w] = (votes[w] || 0) + 1;
    }
    sc.data.rounds.push({ promptId: 'flirt', answers });
    const top = Object.keys(votes).sort((x, y) => votes[y] - votes[x])[0];
    sc.data.results = { votes, winner: top ? [top, answers[top]] : null };
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

/** Who takes the game's prize, by family. */
function winnersOf(state, game, sc, all) {
  const r = sc.data.results || {};
  switch (game.family) {
    case 'make': case 'photo': return [r.winner];
    // A video from home skips a captain who joined today (1×07: "Captain Sean
    // won't get one because she's literally been here like 12 minutes").
    case 'team': return r.teams[r.winner].filter(h => game.prize !== 'video' || state.joinedDay?.[h] !== state.day);
    case 'flirt': return r.winner || [];
    case 'name': {
      const counts = {};
      for (const round of sc.data.rounds) {
        const tone = game.prompts.find(p => p.id === round.promptId)?.tone;
        if (tone === 'good') for (const n of Object.values(round.answers)) counts[n] = (counts[n] || 0) + 1;
      }
      const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      return top ? [top] : [];
    }
    case 'guess': {
      const placed = {};
      for (const round of sc.data.rounds) for (const list of Object.values(round.placedBy)) for (const o of list) placed[o] = (placed[o] || 0) + 1;
      return [argmax(all, h => placed[h] || 0)];
    }
    default: return [...all];     // a party night, a Circle Fest: everyone
  }
}

/**
 * The prize alert. party: tomorrow night is a party. photo: a new profile
 * photo the room warms to. video: a message from home tonight. immunity:
 * safe at the next blocking (standardBlocking honors and clears it; the
 * final ratings never read it). gift: the winner sends someone a gift.
 */
// A judged contest with no other prize gives the winner a trophy at the door
// (US 2 Poetry Slam's golden quill, US 3's rap battle): a reward, no power.
const TROPHY_FAMILIES = new Set(['make', 'photo']);
export const prizeOf = game => (game.prize && game.prize !== 'none' ? game.prize : TROPHY_FAMILIES.has(game.family) ? 'trophy' : null);
export function awardPrize(state, rng, game, winners, sc) {
  const kind = prizeOf(game);
  if (!kind || !winners.length) return null;
  sc.data.prize = { kind, to: [...winners] };
  const all = sc.seenBy;
  for (const w of winners) {
    if (game.prize === 'party') state.partyNext = true;
    if (game.prize === 'photo') for (const o of all) if (o !== w) bump(o, w, 'affection', 0.2);
    if (game.prize === 'video') (state.homeVideoFor ||= []).push(w);
    if (game.prize === 'immunity') state.immuneNext[w] = true;
    // A trophy: the winner glows, and the room starts to see them as a threat.
    if (kind === 'trophy') {
      feel(state, w, 'elation', 1);
      for (const o of all) if (o !== w) nudgeBelief(state, o, w, 'threat', 0.3, sc);
    }
    if (game.prize === 'gift') {
      const to = argmax(all.filter(o => o !== w), o => rel(w, o, 'affection') + rng());
      bump(to, w, 'affection', 1);
      for (const obs of all) if (obs !== w) noteAlly(state, obs, w, to, sc);
      sc.data.prize.gift = { from: w, to };
    }
  }
  return sc.data.prize;
}

/** Play a game with everyone still in, and record it as one public scene. */
export function runGame(state, rng, game) {
  const all = [...state.active];
  const sc = addScene(state, 'game', all, { gameId: game.id, family: game.family, rounds: [], results: {}, prize: null }, all);
  RUN[game.family](state, rng, game, sc, all);
  awardPrize(state, rng, game, winnersOf(state, game, sc, all).filter(Boolean), sc);
  beatsFor(state, rng, game, sc);
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
