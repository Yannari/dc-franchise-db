// ══════════════════════════════════════════════════════════════════════
// ci/script.js — a decided scene becomes a short script (spec §17)
// ══════════════════════════════════════════════════════════════════════
//
// The engine has decided everything. This file only picks words, from its
// own dice, reading state without writing it (ADDING-A-SHOW §11.5 U: a read
// that creates a belief is a write). Players only know PROFILES: in their
// speech and their messages a catfish is the persona, name and pronouns. The
// host knows the truth ("Rebecca, aka Seaburn").
import { showWords } from '../shows.js';
import { streamFor } from '../dr/rng.js';
import { pronounsOf } from '../pronouns-of.js';
import { rel, peopleOf } from './state.js';
import { THEORY_LINE } from './slips.js';
import { styleOf } from './ratings.js';
import { isRevealed } from './reveal.js';
import { styleMessage, displayText, dictation } from './voice.js';
import { POOLS } from './lines/index.js';
import { GAMES, PARTY_THEMES, NEVER_HAVE_I_EVER } from './games-data.js';

export const ROLES = ['a', 'b', 'c', 'host'];
export const FACT_KEYS = ['intent', 'ending', 'result', 'known', 'early', 'late', 'catfish', 'outed',
  'suspects', 'theory', 'pact', 'friends', 'rivals', 'flirty', 'newcomer', 'mood', 'group', 'style',
  'hurt', 'influencer', 'reason', 'motive', 'mode', 'reasonKind', 'band', 'kiss', 'claim', 'lie',
  'tone', 'party', 'final', 'slip', 'noticed', 'place', 'self', 'likesC', 'misread'];

export const hostName = () => showWords('the-circle').host || 'Host';

/** A belief, read without creating it. */
export function peekReal(state, obs, target) {
  return state.beliefs[obs]?.[target]?.real ?? 0.8;
}

const MOODS = [['loneliness', 'lonely'], ['paranoia', 'paranoid'], ['stress', 'stressed'],
  ['guilt', 'guilty'], ['elation', 'elated'], ['homesick', 'homesick']];
export function moodOf(state, h) {
  const m = state.mind[h];
  if (!m) return 'steady';
  const [key, name] = MOODS.reduce((best, cur) => (m[cur[0]] > m[best[0]] ? cur : best), MOODS[0]);
  return m[key] > 5.5 ? name : 'steady';
}

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAINS = new Set(['villain', 'mastermind', 'schemer']);
function groupOf(state, h) {
  const arch = peopleOf(state, h).map(n => state.people[n].archetype);
  if (arch.some(a => NICE.has(a))) return 'nice';
  if (arch.every(a => VILLAINS.has(a))) return 'villain';
  return 'neutral';
}

export function factsFor(state, scene, cast) {
  const { a, b } = cast;
  const f = { early: state.day <= 2, late: false, catfish: state.profiles[a]?.mode === 'catfish' };
  if (a && state.mind[a]) f.mood = moodOf(state, a);
  if (a && state.profiles[a]) { f.group = groupOf(state, a); f.style = styleOf(state, a); }
  const last = [...state.ratings].reverse().find(r => r.day === state.day - 1 && !r.final);
  if (last && a) {
    f.hurt = last.results.slice(-3).some(r => r.profile === a);
    f.influencer = last.influencers.includes(a);
  }
  if (b && state.profiles[b]) {
    const real = peekReal(state, a, b);
    Object.assign(f, {
      known: state.scenes.some(s => s.day < state.day && s.kind === 'chat' && s.who.includes(a) && s.who.includes(b)),
      outed: isRevealed(state, a, b) && state.profiles[b].mode === 'catfish',
      suspects: real < 0.5, theory: real < THEORY_LINE,
      pact: state.pacts.some(p => (p.a === a && p.b === b) || (p.a === b && p.b === a)),
      friends: rel(a, b, 'affection') > 4, rivals: rel(a, b, 'resentment') > 4, flirty: rel(a, b, 'attraction') > 5,
      newcomer: (state.joinedDay[b] || 1) > 1 && state.day - state.joinedDay[b] <= 2,
    });
  }
  // Whether a actually likes the Player being discussed (the Hangout's c).
  if (cast.c && state.profiles[cast.c]) f.likesC = rel(a, cast.c, 'affection') > 4;
  const d = scene.data || {};
  for (const k of ['intent', 'ending', 'reason', 'motive', 'mode', 'kiss', 'tone', 'party', 'final']) {
    if (d[k] !== undefined && d[k] !== null) f[k] = d[k];
  }
  return f;
}

function matches(when = {}, facts) {
  return Object.entries(when).every(([k, v]) => (Array.isArray(v) ? v.includes(facts[k]) : facts[k] === v));
}

const usage = state => (state.usedLines ||= { uses: {}, pairs: {}, day: {} });
// A line already used today (by anyone) is off the table while anything else
// fits: two players posting the same status on the same morning reads as a
// copy, not a coincidence. (At 0.1 it still lost to entries worn down by
// earlier days — seed 19, day 7 aired one status twice.)
export const SAME_DAY = 0;

export function pickEntry(state, key, facts, pairKey, rng) {
  const pool = POOLS[key];
  if (!pool?.length) return null;
  const u = usage(state);
  const fits = pool.filter(e => matches(e.when, facts));
  const scored = fits.map(e => {
    const spec = Object.keys(e.when || {}).length;
    const uses = u.uses[e.id] || 0;
    const samePair = (u.pairs[e.id] || []).includes(pairKey);
    const today = (u.day || {})[e.id] === state.day ? SAME_DAY : 1;
    return [e, samePair ? 0 : (1 + spec) * Math.pow(0.5, uses) * today];
  });
  let total = scored.reduce((s, [, w]) => s + w, 0);
  // Everything that fits has been used on this pair: take the least-used fit.
  if (!total) {
    const e = fits.sort((x, y) => (u.uses[x.id] || 0) - (u.uses[y.id] || 0))[0] || pool.find(p => !p.when);
    return note(state, e, pairKey);
  }
  let r = rng() * total;
  for (const [e, w] of scored) { if ((r -= w) <= 0) return note(state, e, pairKey); }
  return note(state, scored.at(-1)[0], pairKey);
}

function note(state, e, pairKey) {
  if (!e) return null;
  const u = usage(state);
  u.uses[e.id] = (u.uses[e.id] || 0) + 1;
  (u.day ||= {})[e.id] = state.day;
  (u.pairs[e.id] ||= []).push(pairKey);
  return e;
}

const PRONOUN_KEYS = ['sub', 'obj', 'pos', 'posAdj', 'ref', 'Sub', 'Obj', 'PosAdj'];
function realFirst(state, h) {
  return peopleOf(state, h).map(n => n.split(' ')[0]).join(' and ');
}
function realGender(state, h) {
  const g = peopleOf(state, h).map(n => state.people[n].gender);
  return g.length === 1 ? g[0] : 'nb';
}

export function fill(state, text, cast, speakerRole) {
  // {q} and {game}: the Circle's own words (a rule, a prompt) and a game's
  // name, handed in by the builder — never a name the pool invents.
  const t = cast.text || {};
  text = text.replace(/\{(q|game|ans)\}/g, (m, k) => (t[k] ?? m));
  return text.replace(/\{([abc])(?:\.([A-Za-z]+))?\}/g, (m, role, prop) => {
    const h = cast[role];
    const p = h && state.profiles[h];
    if (!p) return m;
    const shown = p.shown?.name || realFirst(state, h);
    // Staging and beats describe the apartment: the person in it is the real one.
    if (!prop) return speakerRole === 'narration' ? realFirst(state, h) : shown;
    if (prop === 'real') return realFirst(state, h);
    if (prop === 'aka') return p.mode === 'catfish' || p.players.length > 1
      ? `${shown}, aka ${realFirst(state, h)},` : shown;
    if (PRONOUN_KEYS.includes(prop)) {
      const knowsTruth = speakerRole === 'host' || speakerRole === 'narration';
      const g = knowsTruth ? realGender(state, h) : (p.shown?.gender || realGender(state, h));
      return pronounsOf(g)[prop];
    }
    return m;
  }).replace(/,,/g, ',').replace(/,\s*([.!?])/g, '$1');
}

export function renderEntry(state, entry, cast, rng) {
  const lines = [];
  const who = role => (role === 'host' ? 'host' : cast[role]);
  if (entry.stage) lines.push({ who: cast.a, kind: 'stage', text: fill(state, entry.stage, cast, 'narration') });
  for (const t of entry.turns || []) {
    const speaker = who(t.by);
    if (t.react) lines.push({ who: speaker, kind: 'react', text: fill(state, t.react, cast, t.by) });
    if (t.say) lines.push({ who: speaker, kind: t.by === 'host' ? 'host' : 'say', text: fill(state, t.say, cast, t.by) });
    if (t.video) lines.push({ who: speaker, kind: 'video', text: fill(state, t.video, cast, t.by) });
    if (t.post) {
      const voice = state.profiles[speaker]?.voice;
      const styled = styleMessage(fill(state, t.post, cast, t.by), voice, rng);
      lines.push({ who: speaker, kind: 'post', text: displayText(styled), spoken: dictation(styled, 'Status', 'Post') });
    }
    if (t.send) {
      const voice = state.profiles[speaker]?.voice;
      const styled = styleMessage(fill(state, t.send, cast, t.by), voice, rng);
      lines.push({ who: speaker, kind: 'send', text: displayText(styled), spoken: dictation(styled) });
    }
  }
  return { id: entry.id, lines, beat: entry.beat ? fill(state, entry.beat, cast, 'narration') : null };
}

// ── Scenes → blocks ──────────────────────────────────────────────────────
//
// Which pool each part of a scene draws from, and who plays a, b and c
// (Plan 2, Task 3's table). A key with no pool yet yields no block: the
// pools arrive task by task, and a missing pool is counted, never an error.
const PLACE_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const claimOf = (state, id) => state.claims.find(c => c.id === id);
const byAffection = (h, others) => [...others].sort((x, y) => Math.abs(rel(y, h, 'affection')) - Math.abs(rel(x, h, 'affection')));

function bandOf(place, n) {
  const f = (place - 1) / Math.max(1, n - 1);
  return f < 0.34 ? 'top' : f > 0.66 ? 'bottom' : 'middle';
}

const BLOCKS = {
  chat(state, s) {
    const [a, b] = s.who;
    const c0 = s.data.claims?.length ? claimOf(state, s.data.claims[0]) : null;
    const c = c0 ? (c0.about === a || c0.about === b ? c0.holder : c0.about) : undefined;
    const key = s.data.intent === 'probe'
      ? `chat.probe.${s.data.probes?.[0]?.result || 'pass'}` : `chat.${s.data.intent}.${s.data.ending}`;
    const out = [{ key, cast: { a, b, c }, extra: { claim: c0?.kind, lie: c0 ? c0.origin.by === a && !c0.truth : false } }];
    for (const sl of s.data.slips || []) {
      const listener = sl.noticedBy[0] || (sl.by === a ? b : a);
      const k = sl.misread ? 'slip.misread' : `slip.${sl.kind}.${sl.noticedBy.length ? 'noticed' : 'missed'}`;
      out.push({ key: k, cast: { a: sl.by, b: listener }, extra: { slip: sl.kind, noticed: sl.noticedBy.length > 0 } });
    }
    return out;
  },
  status(state, s) {
    const [a] = s.who;
    const reader = byAffection(a, s.seenBy.filter(h => h !== a))[0];
    return [{ key: `status.${s.data.tone}`, cast: { a }, extra: { tone: s.data.tone } },
      ...(reader ? [{ key: 'status.react', cast: { a: reader, b: a } }] : [])];
  },
  likes(state, s) {
    const counts = Object.entries(state.likesCount || {}).filter(([h]) => s.who.includes(h)).sort((x, y) => y[1] - x[1]);
    const out = counts.length ? [{ key: 'likes.most', cast: { a: counts[0][0] } }] : [];
    const none = counts.find(([, n]) => n === 0);
    if (none) out.push({ key: 'likes.none', cast: { a: none[0] } });
    return out;
  },
  'circle-chat'(state, s) {
    const posters = [...new Set((s.data.posts || []).map(p => p.by))];
    const [a = s.who[0], b = s.who.find(h => h !== a), c = s.who.find(h => h !== a && h !== b)] = posters;
    const key = s.data.final ? 'circle.final' : s.data.party ? 'circle.party' : 'circle.open';
    return [{ key, cast: { a, b, c } },
      ...(s.data.theories || []).map(t => ({ key: 'circle.theory', cast: { a: t.by, b: t.about }, extra: { claim: 'catfish' } }))];
  },
  profiles(state, s) {
    return s.who.map(a => ({ key: `profile.${state.profiles[a].mode}`, cast: { a },
      extra: { reasonKind: state.profiles[a].reason || undefined } }));
  },
  recognise(state, s) { return [{ key: 'recognise', cast: { a: s.who[0], b: s.data.profile } }]; },
  arrival(state, s) {
    const [a] = s.who;
    const other = s.seenBy.find(h => h !== a);
    return [{ key: 'arrival', cast: { a } }, ...(other ? [{ key: 'arrival.react', cast: { a: other, b: a } }] : [])];
  },
  'after-party'(state, s) { return [{ key: 'afterparty', cast: { a: s.who[0], b: s.who[1] } }]; },
  ratings(state, s, final = false) {
    const out = final ? [] : [{ key: 'ratings.open', cast: { a: s.who[0] } }];
    const n = s.data.results.length;
    for (const b of s.data.ballots.slice(0, final ? s.data.ballots.length : 4)) {
      const first = b.order[0], last = b.order.at(-1);
      if (final) { out.push({ key: `final.rate.${b.reasons[0]}`, cast: { a: b.voter, b: first }, extra: { final: true } }); continue; }
      out.push({ key: `rate.${b.reasons[0]}.top`, cast: { a: b.voter, b: first }, extra: { band: 'top' } });
      if (last && last !== first) out.push({ key: `rate.${b.reasons.at(-1)}.bottom`, cast: { a: b.voter, b: last }, extra: { band: 'bottom' } });
    }
    if (!final) {
      for (const group of s.data.reveal.slice(0, -1)) {
        const r = s.data.results.find(x => x.profile === group[0]);
        out.push({ key: `result.${bandOf(r.place, n)}`, cast: { a: group[0], b: group[1] },
          extra: { band: bandOf(r.place, n), place: PLACE_WORDS[r.place - 1] } });
      }
      const [i1, i2] = s.data.influencers;
      out.push({ key: 'result.influencers', cast: { a: i1, b: i2 } });
    }
    return out;
  },
  'final-ratings'(state, s) { return BLOCKS.ratings(state, s, true); },
  hangout(state, s) {
    const [a, b] = s.who;
    const out = [{ key: 'hangout.open', cast: { a, b } }];
    // They take turns bringing up each name.
    (s.data.views || []).slice(0, 5).forEach((v, i) => {
      const cut = v.handle === s.data.target;
      const reason = cut ? s.data.reason : 'noBond';
      const [x, y] = i % 2 ? [b, a] : [a, b];
      out.push({ key: `hangout.view.${reason}.${cut ? 'cut' : 'keep'}`, cast: { a: x, b: y, c: v.handle }, extra: { reason } });
    });
    const kind = s.data.offers.some(o => o.trade) ? 'trade' : s.data.yielded ? 'yield' : 'agree';
    out.push({ key: `hangout.${kind}`, cast: { a: s.data.decider, b: s.data.yielded || b, c: s.data.target } });
    if (s.data.offers.some(o => o.pact)) out.push({ key: 'hangout.pact', cast: { a, b } });
    return out;
  },
  blocking(state, s) {
    const [announcer, target] = s.who;
    const out = [{ key: `block.announce.${s.data.reason}`, cast: { a: announcer, c: target }, extra: { reason: s.data.reason } },
      { key: 'block.react.self', cast: { a: target }, extra: { self: true } }];
    const others = s.seenBy.filter(h => h !== target && h !== announcer && !s.data.by.includes(h));
    const friend = others.find(h => rel(h, target, 'affection') > 3);
    const rival = others.find(h => rel(h, target, 'resentment') > 3 && h !== friend);
    if (friend) out.push({ key: 'block.react.friend', cast: { a: friend, b: target } });
    if (rival) out.push({ key: 'block.react.rival', cast: { a: rival, b: target } });
    if (!friend && !rival && others[0]) out.push({ key: 'block.react.relief', cast: { a: others[0], b: target } });
    return out;
  },
  visit(state, s) {
    const [h, to] = s.who;
    const out = [{ key: `visit.choose.${s.data.motive}`, cast: { a: h, b: to }, extra: { motive: s.data.motive } }];
    for (const w of state.active.filter(x => x !== to).slice(0, 2)) {
      out.push({ key: state.profiles[w].mode === 'catfish' ? 'visit.wait.catfish' : 'visit.wait', cast: { a: w, b: h } });
    }
    // The door opens both ways: the visitor sees who was behind the profile too.
    const fakeAt = state.profiles[h].mode === 'catfish', fakeIn = state.profiles[to].mode === 'catfish';
    const door = fakeAt && fakeIn ? 'both' : fakeAt ? 'catfish' : fakeIn ? null : 'real';
    if (door) out.push({ key: `visit.door.${door}`, cast: { a: to, b: h } });
    if (fakeIn && !fakeAt) out.push({ key: 'visit.door.caught', cast: { a: h, b: to } });
    out.push({ key: `visit.talk.${s.data.motive}`, cast: { a: h, b: to }, extra: { motive: s.data.motive } });
    if (s.data.handed) {
      const c0 = claimOf(state, s.data.handed);
      out.push({ key: 'visit.hand', cast: { a: h, b: to, c: c0.about }, extra: { claim: c0.kind } });
    }
    if (s.data.kiss) out.push({ key: 'visit.kiss', cast: { a: h, b: to }, extra: { kiss: true } });
    out.push({ key: 'visit.bye', cast: { a: h, b: to } });
    return out;
  },
  report(state, s) {
    return [{ key: 'report', cast: { a: s.who[0], b: s.who[1], c: s.data.rival }, extra: { lie: true, claim: 'visitSaid' } }];
  },
  goodbye(state, s) {
    const [h] = s.who;
    const p = state.profiles[h];
    const viewers = s.seenBy.filter(x => x !== h);
    const out = viewers[0] ? [{ key: 'goodbye.guess', cast: { a: viewers[0], b: h } }] : [];
    out.push({ key: p.mode === 'catfish' ? `goodbye.video.catfish.${p.reason || 'strategic'}` : `goodbye.video.${p.mode}`,
      cast: { a: h }, extra: { mode: p.mode, reasonKind: p.reason || undefined } });
    if (s.data.warning) {
      const { kind, about } = s.data.warning;
      // Met in person at the visit: the warning is something seen, not a hunch.
      const seen = isRevealed(state, h, about) && state.profiles[about]?.mode === 'catfish';
      out.push({ key: seen ? 'goodbye.warning.seen' : `goodbye.warning.${kind}`, cast: { a: h, c: about } });
    }
    const blockers = state.blocked.find(b => b.handle === h)?.by || [];
    const guilty = viewers.find(v => blockers.includes(v));
    if (guilty) out.push({ key: 'goodbye.react.guilty', cast: { a: guilty, b: h } });
    const warned = s.data.warning && viewers.includes(s.data.warning.about) ? s.data.warning.about : null;
    if (warned) out.push({ key: 'goodbye.react.warned', cast: { a: warned, b: h } });
    const suspecter = viewers.find(v => v !== guilty && v !== warned && peekReal(state, v, h) < 0.5);
    const other = viewers.find(v => v !== guilty && v !== warned && v !== suspecter);
    if (suspecter) out.push({ key: p.mode === 'catfish' ? 'goodbye.react.vindicated' : 'goodbye.react.surprised', cast: { a: suspecter, b: h } });
    else if (other) out.push({ key: 'goodbye.react.surprised', cast: { a: other, b: h } });
    return out;
  },
  meet(state, s) {
    const [a, ...present] = s.who;
    if (!present.length) return [];
    const explain = (h, to) => {
      const why = state.profiles[h].reason;
      return { key: `meet.explain.${why || 'strategic'}`, cast: { a: h, b: to }, extra: { reasonKind: why || undefined } };
    };
    const fake = h => state.profiles[h].mode === 'catfish';
    // The first one in waited alone: a catfish there is found out by the
    // second, and that replaces the happy hello.
    const first = present.length === 1 && fake(present[0]) ? present[0] : null;
    if (first && fake(a)) return [{ key: 'meet.both', cast: { a, b: first } }, explain(a, first), explain(first, a)];
    if (first) return [{ key: 'meet.found', cast: { a, b: first } }, explain(first, a)];
    const b = present.at(-1);
    return fake(a) ? [{ key: 'meet.arrive.catfish', cast: { a, b } }, explain(a, b)] : [{ key: 'meet.arrive.real', cast: { a, b } }];
  },
  reveal(state, s) {
    const pl = s.data.placements;
    return [...pl.slice(1).reverse().map(x => ({ key: 'reveal.place', cast: { a: x.profile }, extra: { place: PLACE_WORDS[x.place - 1] } })),
      { key: 'reveal.winner', cast: { a: pl[0].profile } }];
  },
  // A game: a player reads the Circle's rules aloud, then the rounds that
  // matter, then any slip, then the prize alert (spec §13.3).
  game(state, s) {
    const g = GAMES.find(x => x.id === s.data.gameId);
    const reader = s.who[s.id % s.who.length];
    const out = [{ key: 'game.open', cast: { a: reader, text: { q: g.rules[0], game: g.name } } }];
    const promptText = r => g.prompts?.find(p => p.id === r.promptId)?.text;
    const rounds = s.data.rounds || [];
    const R = s.data.results || {};
    const other = a => s.who.find(h => h !== a);
    switch (s.data.family) {
      case 'statement':
        for (const r of rounds) {
          const a = r.lone || s.who[0];
          const b = s.who.find(h => h !== a && r.answers[h] !== r.answers[a]) || other(a);
          const ans = (g.say || ['Agree', 'Disagree'])[r.answers[a] === 'agree' ? 0 : 1];
          out.push({ key: `game.statement.${r.answers[a]}`, cast: { a, b, text: { q: promptText(r), ans } } });
          if (r.lone) out.push({ key: 'game.statement.lone', cast: { a: b, b: r.lone, text: { q: promptText(r) } } });
        }
        break;
      case 'name':
        for (const r of rounds) {
          const tone = g.prompts.find(p => p.id === r.promptId).tone;
          const counts = {};
          for (const n of Object.values(r.answers)) counts[n] = (counts[n] || 0) + 1;
          const named = Object.keys(counts).sort((x, y) => counts[y] - counts[x])[0];
          const namer = Object.keys(r.answers).find(v => r.answers[v] === named);
          out.push({ key: `game.name.${tone}`, cast: { a: namer, b: named, text: { q: promptText(r) } } });
        }
        break;
      case 'ask':
        for (const q of (rounds[0]?.questions || []).slice(0, 3)) {
          out.push({ key: q.kind === 'catfish' ? `game.ask.catfish.${q.result}` : `game.ask.${q.kind}`, cast: { a: q.asker, b: q.target } });
        }
        break;
      case 'guess':
        for (const r of rounds) {
          // The fact the room struggled to place: the interesting one.
          const a = s.who.reduce((best, h) => ((r.placedBy[h]?.length || 0) < (r.placedBy[best]?.length || 0) ? h : best), s.who[0]);
          out.push({ key: 'game.guess.round', cast: { a, b: other(a), text: { q: promptText(r) } } });
        }
        break;
      case 'make': {
        const r = rounds[0] || { answers: {}, portrayals: {} };
        const jab = Object.keys(r.portrayals || {}).find(m => r.portrayals[m] === 'jab');
        const kind = Object.keys(r.portrayals || {}).find(m => r.portrayals[m] === 'kind');
        if (jab) out.push({ key: 'game.make.jab', cast: { a: jab, b: r.answers[jab], text: { game: g.name } } });
        if (kind) out.push({ key: 'game.make.kind', cast: { a: kind, b: r.answers[kind], text: { game: g.name } } });
        if (R.winner) out.push({ key: 'game.make.result', cast: { a: R.winner, b: other(R.winner), text: { game: g.name } } });
        break;
      }
      case 'photo':
        for (const a of Object.keys(rounds[0]?.answers || {}).slice(0, 2)) out.push({ key: 'game.photo.round', cast: { a, b: other(a) } });
        break;
      case 'team': {
        out.push({ key: 'game.team.pick', cast: { a: R.captains[0], b: R.teams[0][1] || R.captains[1] } });
        if (R.lastPick) {
          const cap = R.teams.find(t => t.includes(R.lastPick))[0];
          out.push({ key: 'game.team.last', cast: { a: R.lastPick, b: cap } });
        }
        out.push({ key: 'game.team.result', cast: { a: R.teams[R.winner][0], b: R.teams[1 - R.winner][0] } });
        break;
      }
      case 'gift': {
        const ans = rounds[0]?.answers || {};
        for (const giver of Object.keys(ans).slice(0, 2)) out.push({ key: 'game.gift.round', cast: { a: giver, b: ans[giver] } });
        const none = s.who.find(h => !Object.values(ans).includes(h));
        if (none) out.push({ key: 'game.gift.none', cast: { a: none } });
        break;
      }
      case 'rival': {
        const ans = rounds[0]?.answers || {};
        for (const namer of Object.keys(ans).slice(0, 3)) out.push({ key: 'game.rival.round', cast: { a: namer, b: ans[namer] } });
        break;
      }
      case 'flirt': {
        const seen = new Set();
        for (const [a, b] of Object.entries(rounds[0]?.answers || {})) {
          if (seen.has(a)) continue;
          seen.add(a); seen.add(b);
          out.push({ key: 'game.flirt.round', cast: { a, b } });
        }
        break;
      }
    }
    for (const sl of (s.data.slips || []).slice(0, 2)) {
      out.push({ key: 'game.slip', cast: { a: sl.by, b: sl.noticedBy[0] || other(sl.by) }, extra: { misread: !!sl.misread } });
    }
    if (s.data.prize) {
      const [a, b] = s.data.prize.to;
      out.push({ key: `game.prize.${s.data.prize.kind}`, cast: { a, b } });
    }
    return out;
  },
  // A party: props at the door, then Never Have I Ever in Circle Chat (1×02).
  party(state, s) {
    const th = PARTY_THEMES.find(x => x.id === s.data.theme);
    const pr = s.data.props;
    const props = pr.length > 1 ? `${pr.slice(0, -1).join(', ')} and ${pr.at(-1)}` : pr[0];
    const out = [{ key: 'party.open', cast: { a: s.who[s.id % s.who.length], text: { game: th?.name || 'Party', q: props } } }];
    for (const r of s.data.rounds || []) {
      const q = NEVER_HAVE_I_EVER.find(x => x.id === r.statement)?.text;
      const who = r.admitted.find(h => h !== r.by);
      out.push(who
        ? { key: 'party.nhie', cast: { a: r.by, b: who, text: { q } } }
        : { key: 'party.nhie.none', cast: { a: r.by, b: s.who.find(h => h !== r.by), text: { q } } });
    }
    for (const sl of (s.data.slips || []).slice(0, 1)) {
      out.push({ key: 'game.slip', cast: { a: sl.by, b: sl.noticedBy[0] || s.who.find(h => h !== sl.by) }, extra: { misread: !!sl.misread } });
    }
    return out;
  },
  life(state, s) { return [{ key: `life.${s.data.habit}`, cast: { a: s.who[0] } }]; },
  // Private to the apartment: only its player is cast.
  'home-video'(state, s) { return [{ key: 'home.video', cast: { a: s.who[0] } }]; },
};


export function sceneBlocks(state, scene) {
  return (BLOCKS[scene.kind]?.(state, scene) || []).filter(b => b.cast.a);
}

export function writeScene(state, scene) {
  const blocks = [];
  sceneBlocks(state, scene).forEach((b, i) => {
    const extra = Object.fromEntries(Object.entries(b.extra || {}).filter(([, v]) => v !== undefined));
    const facts = { ...factsFor(state, scene, b.cast), ...extra };
    const rng = streamFor(state.seed, `line:${scene.id}:${i}`);
    const pairKey = [b.cast.a, b.cast.b, b.cast.c].filter(Boolean).sort().join('|');
    const entry = pickEntry(state, b.key, facts, pairKey, rng);
    if (!entry) { (state.missingPools ||= {})[b.key] = (state.missingPools[b.key] || 0) + 1; return; }
    blocks.push({ key: b.key, ...renderEntry(state, entry, b.cast, rng) });
  });
  // A slip happens inside the conversation: weave it into the chat before the
  // chat's closing beat, rather than printing it as a second scene.
  if (scene.kind === 'chat' && blocks.length > 1 && !blocks[0].key.startsWith('slip.')) {
    for (const b of blocks.slice(1).filter(x => x.key.startsWith('slip.'))) {
      blocks[0].lines.push(...b.lines);
      if (b.beat) blocks[0].lines.push({ who: b.lines[0]?.who, kind: 'stage', text: b.beat });
    }
    blocks.splice(1, blocks.length - 1, ...blocks.slice(1).filter(x => !x.key.startsWith('slip.')));
  }
  scene.script = { blocks };
  return scene.script;
}

/** Script every aired scene of the day, and open the day with the host. */
export function writeDay(state, day) {
  const aired = state.scenes.filter(s => s.day === day && s.aired);
  aired.forEach(s => writeScene(state, s));
  if (!aired[0]) return;
  const yesterday = state.scenes.filter(s => s.day === day - 1);
  const tone = day === 1 ? 'first' : yesterday.some(s => s.kind === 'blocking') ? 'blocking'
    : yesterday.some(s => s.kind === 'arrival') ? 'arrival' : 'quiet';
  const rng = streamFor(state.seed, `line:cold:${day}`);
  const key = `host.cold.${tone}`;
  const entry = pickEntry(state, key, { early: day <= 2 }, `day${day}`, rng);
  if (entry) aired[0].script.blocks.unshift({ key, ...renderEntry(state, entry, { a: aired[0].who[0] }, rng) });
  bridge(state, aired);
}

// The host talks over apartment life about once every HOST_EVERY beats
// (spec §17.4), only on light scenes, and never over a confession.
export const HOST_EVERY = 5;
const BRIDGES = { chat: 'host.chat', status: 'host.status', 'circle-chat': 'host.circle', game: 'host.game', life: 'host.life' };
function bridge(state, aired) {
  let since = 0;
  for (const s of aired) {
    const key = BRIDGES[s.kind];
    const light = key && s.data?.intent !== 'confess' && s.script?.blocks?.length;
    if (light && since >= HOST_EVERY) {
      const cast = { a: s.who[0], b: s.who[1] };
      const rng = streamFor(state.seed, `line:host:${s.id}`);
      const entry = pickEntry(state, key, factsFor(state, s, cast), s.id, rng);
      if (entry) { s.script.blocks.unshift({ key, ...renderEntry(state, entry, cast, rng) }); since = 0; }
    }
    since += s.script?.blocks?.length || 0;
  }
}

// Every pool key sceneBlocks can ask for — the writing backlog, and what the
// coverage guard checks (tests/ci-lines.test.js).
const INTENTS_ = ['bond', 'ally', 'flirt', 'pump', 'compare', 'plant', 'credit', 'repair', 'confront', 'checkin', 'pitch', 'confess'];
const REASONS_ = ['affection', 'trust', 'obligation', 'pact', 'protection', 'threat', 'suspicion', 'grudge', 'deserves'];
const SLIPS_ = ['knowledge', 'body', 'voice', 'tooPerfect', 'overreach', 'name'];
const MOTIVES_ = ['friend', 'answers', 'truth', 'apology'];
const WHY_ = ['strategic', 'protective', 'experimental', 'family'];
const BLOCK_WHY_ = ['fake', 'threat', 'grudge', 'noBond'];
export const POOL_KEYS = [
  ...INTENTS_.flatMap(i => ['warm', 'neutral', 'cold'].map(e => `chat.${i}.${e}`)),
  ...['pass', 'dodge', 'fail'].map(r => `chat.probe.${r}`),
  ...SLIPS_.flatMap(k => [`slip.${k}.noticed`, `slip.${k}.missed`]), 'slip.misread',
  'status.low', 'status.steady', 'status.high', 'status.react', 'likes.most', 'likes.none',
  'circle.open', 'circle.party', 'circle.final', 'circle.theory',
  ...['honest', 'polished', 'edited', 'catfish', 'shared'].map(m => `profile.${m}`),
  'recognise', 'arrival', 'arrival.react', 'afterparty',
  'ratings.open', ...REASONS_.flatMap(r => [`rate.${r}.top`, `rate.${r}.bottom`]),
  'result.bottom', 'result.middle', 'result.top', 'result.influencers',
  ...REASONS_.map(r => `final.rate.${r}`),
  'hangout.open', ...BLOCK_WHY_.map(r => `hangout.view.${r}.cut`), 'hangout.view.noBond.keep',
  'hangout.agree', 'hangout.yield', 'hangout.trade', 'hangout.pact',
  ...BLOCK_WHY_.map(r => `block.announce.${r}`), 'block.react.self', 'block.react.friend', 'block.react.rival', 'block.react.relief',
  ...MOTIVES_.flatMap(m => [`visit.choose.${m}`, `visit.talk.${m}`]), 'visit.wait', 'visit.wait.catfish',
  'visit.door.real', 'visit.door.catfish', 'visit.door.caught', 'visit.door.both', 'visit.hand', 'visit.kiss', 'visit.bye', 'report',
  'goodbye.guess', ...['honest', 'polished', 'edited', 'shared'].map(m => `goodbye.video.${m}`),
  ...WHY_.map(w => `goodbye.video.catfish.${w}`), 'goodbye.warning.catfish', 'goodbye.warning.distrusts', 'goodbye.warning.seen',
  'goodbye.react.guilty', 'goodbye.react.warned', 'goodbye.react.vindicated', 'goodbye.react.surprised',
  'meet.arrive.real', 'meet.arrive.catfish', 'meet.found', 'meet.both', ...WHY_.map(w => `meet.explain.${w}`),
  'reveal.place', 'reveal.winner', ...['first', 'blocking', 'arrival', 'quiet'].map(t => `host.cold.${t}`), 'host.chat', 'host.status', 'host.circle',
  // Plan 3a: games, parties, apartment life, videos from home.
  'game.open', 'game.statement.agree', 'game.statement.disagree', 'game.statement.lone',
  'game.name.good', 'game.name.bad', 'game.name.funny',
  'game.ask.friendly', 'game.ask.barbed', ...['pass', 'dodge', 'fail'].map(r => `game.ask.catfish.${r}`),
  'game.guess.round', 'game.slip', 'game.make.jab', 'game.make.kind', 'game.make.result', 'game.photo.round',
  'game.team.pick', 'game.team.last', 'game.team.result', 'game.gift.round', 'game.gift.none',
  'game.rival.round', 'game.flirt.round', ...['party', 'photo', 'video', 'immunity', 'gift'].map(k => `game.prize.${k}`),
  'party.open', 'party.nhie', 'party.nhie.none',
  ...['workout', 'skincare', 'cooking', 'reading', 'singing', 'plushie', 'praying', 'pacing'].map(h => `life.${h}`),
  'home.video', 'host.game', 'host.life',
];
