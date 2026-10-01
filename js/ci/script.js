// ══════════════════════════════════════════════════════════════════════
// ci/script.js — a decided scene becomes a short script (spec §17)
// ══════════════════════════════════════════════════════════════════════
//
// The engine has decided everything. This file only picks words, from its
// own dice, reading state without writing it (ADDING-A-SHOW §11.5 U: a read
// that creates a belief is a write). Players only know PROFILES: in their
// speech and their messages a catfish is the persona, name and pronouns. The
// host knows the truth ("Rebecca, aka Seaburn").
import { blockScore } from './hangout.js';
import { TOPICS } from './persona-data.js';
import { showWords } from '../shows.js';
import { streamFor } from '../dr/rng.js';
import { pronounsOf } from '../pronouns-of.js';
import { rel, peopleOf, S } from './state.js';
import { THEORY_LINE } from './slips.js';
import { styleOf } from './ratings.js';
import { isRevealed } from './reveal.js';
import { styleMessage, displayText, dictation, byAuthored } from './voice.js';
import { nicknameFor } from './register.js';
import { shownRegister, shownVoice, crackOf } from './cover.js';
import { POOLS } from './lines/index.js';
import { GAMES, PARTY_THEMES, NEVER_HAVE_I_EVER } from './games-data.js';
import { TRIVIA, FACTS } from './games-content.js';
import { topicsOf, wingsIt, JOB_TOPIC, townOf } from './topics.js';

// 'face' and 'brain': the two people behind a shared profile, speaking to
// each other in their own apartment (spec §14.8).
export const ROLES = ['a', 'b', 'c', 'host', 'face', 'brain', 'older', 'younger', 'parent', 'kid'];
// The two people behind a shared profile, by the part they play in a line.
const PAIR_ROLES = new Set(['face', 'brain', 'older', 'younger', 'parent', 'kid']);
export const FACT_KEYS = ['time', 'intent', 'ending', 'result', 'known', 'early', 'late', 'catfish', 'outed',
  'suspects', 'theory', 'pact', 'friends', 'rivals', 'flirty', 'newcomer', 'mood', 'group', 'style',
  'hurt', 'influencer', 'reason', 'motive', 'mode', 'reasonKind', 'band', 'kiss', 'claim', 'lie',
  'tone', 'party', 'final', 'slip', 'noticed', 'place', 'self', 'likesC', 'misread', 'anon',
  'answer', 'strong', 'split', 'qkind', 'right', 'off', 'odd', 'failed', 'barbed', 'slipped', 'mutual', 'warm',
  'everyone', 'fresh', 'tier', 'many', 'jab', 'register', 'crack', 'sole', 'blocks', 'infl'];

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
  // The hour a scene happens at: a line about this morning or tonight only fits then.
  f.time = scene.data?.when || (scene.data?.party || scene.kind === 'party' || scene.kind === 'ratings' ? 'evening' : 'day');
  if (a && state.mind[a]) f.mood = moodOf(state, a);
  if (a && state.profiles[a]) { f.group = groupOf(state, a); f.style = styleOf(state, a); f.register = shownRegister(state, a, scene, cast.personA); }
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
export const SAID_AGAIN = 0.05;
// Each earlier use of a line this season: its weight times this. Steep, so a
// fresh line wins until the pool is used up; at 0.5 a register line (five
// times the weight) used once still beat a fresh plain one, and came back
// (measured: 19% of a season's blocks were repeats).
export const USED_DECAY = 0.12;

export function pickEntry(state, key, facts, pairKey, rng, speaker = null) {
  // A list of keys merges pools: a game's own lines (weighted up) with its
  // family's, so a game never runs out and repeats itself.
  const pool = Array.isArray(key) ? key.flatMap(k => POOLS[k] || []) : POOLS[key];
  if (!pool?.length) return null;
  const u = usage(state);
  const fits = pool.filter(e => matches(e.when, facts));
  const scored = fits.map(e => {
    // A line written for the speaker's register is how they sound: it wins clearly.
    const spec = Object.keys(e.when || {}).reduce((n, k) => n + (k === 'register' ? 4 : 1), 0) + (e.id.startsWith('g.') ? 1 : 0);
    const uses = u.uses[e.id] || 0;
    const samePair = (u.pairs[e.id] || []).includes(pairKey);
    const today = (u.day || {})[e.id] === state.day ? SAME_DAY : 1;
    // One person saying the same sentence twice in a season reads as a bug,
    // whoever they say it to (a register's lines win often, so this matters).
    const said = speaker && (u.by?.[e.id] || []).includes(speaker) ? SAID_AGAIN : 1;
    return [e, samePair ? 0 : (1 + spec) * Math.pow(USED_DECAY, uses) * today * said];
  });
  let total = scored.reduce((s, [, w]) => s + w, 0);
  // Everything that fits has been used on this pair: take the least-used fit.
  if (!total) {
    const e = fits.sort((x, y) => (u.uses[x.id] || 0) - (u.uses[y.id] || 0))[0] || pool.find(p => !p.when);
    return note(state, e, pairKey, speaker);
  }
  let r = rng() * total;
  for (const [e, w] of scored) { if ((r -= w) <= 0) return note(state, e, pairKey, speaker); }
  return note(state, scored.at(-1)[0], pairKey, speaker);
}

function note(state, e, pairKey, speaker) {
  if (!e) return null;
  const u = usage(state);
  if (speaker) ((u.by ||= {})[e.id] ||= []).push(speaker);
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

const PROPER = /^(Mars|Saturn|Jupiter|Neptune|Earth|North|South|S$|O negative|AB\b|L-I-B)/;
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve'];

export function fill(state, text, cast, speakerRole) {
  // {q} and {game}: the Circle's own words (a rule, a prompt) and a game's
  // name, handed in by the builder — never a name the pool invents.
  const t = cast.text || {};
  text = text.replace(/\{(q|game|ans|x|n|topic|town)\}/g, (m, k, at, whole) => {
    if (t[k] === undefined) return m;
    const starts = /(^|[.!?…]\s+|['"]\s*)$/.test(whole.slice(0, at));
    if (k === 'x') {
      // An answer inside a sentence loses its capital ("It's carbon
      // dioxide"), unless it is a name ("Mars") or starts the sentence.
      const v = String(t[k]);
      if (starts || PROPER.test(v)) return v;
      return v.charAt(0).toLowerCase() + v.slice(1);
    }
    // a topic or a town can open a sentence ("Night shifts. Sure.")
    if (k === 'topic' || k === 'town') return starts ? String(t[k]).charAt(0).toUpperCase() + String(t[k]).slice(1) : t[k];
    if (k !== 'n') return t[k];
    // A count is said, not typed: "six likes", "three to two".
    const said = String(t[k]).replace(/\b\d+\b/g, d => NUMBER_WORDS[+d] ?? d);
    return starts ? said.charAt(0).toUpperCase() + said.slice(1) : said;
  });
  return text.replace(/\{([abc])(?:\.([A-Za-z]+))?\}/g, (m, role, prop) => {
    const h = cast[role];
    const p = h && state.profiles[h];
    if (!p) return m;
    const shown = p.shown?.name || realFirst(state, h);
    // A pair in the staging is one of the two, not "Mateo and Luis is": the
    // one the builder names (whoever won the argument, whoever is on screen),
    // else the face.
    const onScreen = p.players.length > 1
      ? ((role === 'a' && cast.personA) || p.roles?.face || p.players[0]) : null;
    // Staging and beats describe the apartment: the person in it is the real one.
    if (!prop) return speakerRole === 'narration' ? (onScreen ? onScreen.split(' ')[0] : realFirst(state, h)) : shown;
    if (prop === 'real') return realFirst(state, h);
    if (PAIR_ROLES.has(prop)) return (p.roles?.[prop] || p.players[0]).split(' ')[0];
    // what a kid calls the parent, and what the parent calls the kid
    if (prop === 'parentWord') return state.people[p.roles?.parent]?.gender === 'm' ? 'Dad' : 'Mom';
    if (prop === 'kidWord') return state.people[p.roles?.kid]?.gender === 'm' ? 'son' : 'daughter';
    if (prop === 'olderSib') return state.people[p.roles?.older]?.gender === 'm' ? 'big brother' : 'big sister';
    if (prop === 'youngerSib') return state.people[p.roles?.younger]?.gender === 'm' ? 'little brother' : 'little sister';
    if (prop === 'aka') return p.mode === 'catfish' || p.players.length > 1
      ? `${shown}, aka ${realFirst(state, h)},` : shown;
    if (PRONOUN_KEYS.includes(prop)) {
      const knowsTruth = speakerRole === 'host' || speakerRole === 'narration';
      const g = speakerRole === 'narration' && onScreen ? state.people[onScreen].gender
        : knowsTruth ? realGender(state, h) : (p.shown?.gender || realGender(state, h));
      return pronounsOf(g)[prop];
    }
    return m;
  }).replace(/,,/g, ',').replace(/,\s*([.!?])/g, '$1');
}

export function renderEntry(state, entry, cast, rng, ctx = {}) {
  const lines = [];
  const who = role => (role === 'host' ? 'host' : PAIR_ROLES.has(role) ? cast.a : cast[role]);
  const personOf = role => {
    const p = state.profiles[cast.a];
    if (role === 'a' && cast.personA) return cast.personA.split(' ')[0];
    return PAIR_ROLES.has(role) && p ? (p.roles?.[role] || p.players[0]).split(' ')[0] : null;
  };
  if (entry.stage) lines.push({ who: cast.a, kind: 'stage', text: fill(state, entry.stage, cast, 'narration') });
  (entry.turns || []).forEach((t, ti) => {
    const speaker = who(t.by);
    // Answering somebody, rather than starting something.
    const reply = ti > 0 && entry.turns.slice(0, ti).some(x => x.by !== t.by);
    const person = personOf(t.by);
    const tag = x => (person ? { ...x, person } : x);
    // The one at the keyboard: a shared profile types in two voices.
    const typist = t.by === 'a' ? cast.personA || null
      : PAIR_ROLES.has(t.by) ? state.profiles[cast.a]?.roles?.[t.by] || null : null;
    // A catfish types in the persona's register until the cover cracks (ci/cover.js).
    const voiceOf = () => ({ ...(state.profiles[speaker]?.voice || {}), register: shownRegister(state, speaker, ctx.scene, typist) });
    // The person at the keyboard, for what the author wrote about them.
    const p0 = state.profiles[speaker];
    const typer = typist || p0?.roles?.face || p0?.players?.[0];
    const av = speaker && state.profiles[speaker] ? shownVoice(state, speaker, ctx.scene, typer) : null;
    const nick = text => {
      if (!av?.nicknames) return text;
      const names = Object.keys(state.profiles).filter(h => h !== speaker && state.profiles[h].shown?.name)
        .map(h => [state.profiles[h].shown.name, h]).sort((x, y) => y[0].length - x[0].length);
      if (!names.length) return text;
      const esc = n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b(${names.map(([n]) => esc(n)).join('|')})\\b`, 'g');
      const byName = Object.fromEntries(names);
      return text.replace(re, m => nicknameFor(state, typer, byName[m]) || m);
    };
    const greet = ctx.kind === 'circle-chat' && ctx.greeted && !ctx.greeted.has(speaker);
    if (t.react) lines.push(tag({ who: speaker, kind: 'react', text: fill(state, t.react, cast, t.by) }));
    if (t.say) {
      const said = t.by === 'host' ? fill(state, t.say, cast, t.by) : byAuthored(nick(fill(state, t.say, cast, t.by)), av, rng, { speech: true, reply });
      lines.push(tag({ who: speaker, kind: t.by === 'host' ? 'host' : 'say', text: said }));
    }
    if (t.video) lines.push(tag({ who: speaker, kind: 'video', text: fill(state, t.video, cast, t.by) }));
    if (t.post) {
      const voice = voiceOf();
      const styled = byAuthored(styleMessage(nick(fill(state, t.post, cast, t.by)), voice, rng), av, rng);
      lines.push(tag({ who: speaker, kind: 'post', text: displayText(styled), spoken: dictation(styled, 'Status', 'Post') }));
    }
    if (t.send) {
      const voice = voiceOf();
      // An anonymous message hides its sender's signature phrases.
      // Anonymous, or behind a named mask (the Joker): the room sees the mask.
      const anon = t.by === 'a' && cast.anonA ? { anon: cast.anonAs || true } : {};
      const styled = byAuthored(styleMessage(nick(fill(state, t.send, cast, t.by)), voice, rng), anon.anon ? null : av, rng, { greet, reply });
      if (greet) ctx.greeted.add(speaker);
      lines.push(tag({ who: speaker, kind: 'send', text: displayText(styled), spoken: dictation(styled), ...anon }));
    }
  });
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

// ── Games come back (Plan 3a+ Task 10) ─────────────────────────────────
// What a game did between two players returns in a later chat ("After what
// you said in Most Likely…") and in a ballot. Only a game both of them saw;
// never from earlier the same day (the chats come before the game); each
// memory once per pair.
export const CALLBACK_KINDS = ['named-bad', 'named-good', 'rival', 'gift', 'picked-last', 'jab', 'portrait-kind',
  'flirted', 'asked-barbed', 'asked-catfish'];
export const CALLBACK_DAYS = 3;
export function gameCallback(state, a, b, scene, { sameDay = false, kinds = CALLBACK_KINDS, dir = null } = {}) {
  const mem = state.gameMemory || [];
  const used = (usage(state).callbacks ||= []);
  for (let i = mem.length - 1; i >= 0; i--) {
    const m = mem[i];
    if (!kinds.includes(m.kind)) continue;
    if (scene.day - m.day > CALLBACK_DAYS || (sameDay ? m.day > scene.day : m.day >= scene.day)) continue;
    const mine = m.by === a && m.about === b, theirs = m.by === b && m.about === a;
    if (!mine && !theirs) continue;
    const d = mine ? 'mine' : 'theirs';
    if (dir && d !== dir) continue;
    const g = state.scenes.find(x => x.id === m.scene);
    if (!g?.seenBy.includes(a) || !g.seenBy.includes(b)) continue;
    const tag = `${i}:${[a, b].sort().join('|')}`;
    if (used.includes(tag)) continue;
    used.push(tag);
    return { kind: m.kind, dir: d, game: GAMES.find(x => x.id === m.gameId)?.name };
  }
  return null;
}

// Which pool a game beat draws from (the family pool; game- and prompt-
// specific pools, `g.<game>.<prompt?>.<suffix>`, take precedence).
const GAME_FACTS = ['tone', 'answer', 'strong', 'split', 'qkind', 'result', 'anon', 'right', 'off', 'odd', 'failed',
  'barbed', 'slipped', 'mutual', 'warm', 'everyone', 'fresh', 'tier', 'misread', 'many', 'jab'];
function gameKey(family, b) {
  const k = b.kind;
  if (k === 'open') return 'game.open';
  if (k === 'first') return 'game.first';
  if (k === 'slip') return 'game.slip';
  if (k.startsWith('prize.')) return `game.${k}`;
  switch (family) {
    case 'statement': return k === 'answer' ? `game.statement.${b.answer}` : `game.statement.${k}`;
    case 'name': return k === 'tally' ? `game.name.${b.tone}` : k === 'reply' ? `game.name.reply.${b.tone}` : `game.name.${k}`;
    case 'ask': return k === 'question' ? (b.qkind === 'catfish' ? `game.ask.catfish.${b.result}` : `game.ask.${b.qkind}`) : `game.ask.${k}`;
    case 'guess': return k === 'guessed' ? `game.guess.guessed.${b.right ? 'right' : 'wrong'}` : `game.guess.${k}`;
    case 'make': return k === 'portrait.jab' ? 'game.make.jab' : k === 'portrait.kind' ? 'game.make.kind' : k === 'winner' ? 'game.make.result' : `game.make.${k}`;
    case 'photo': return k === 'post' ? 'game.photo.round' : `game.photo.${k}`;
    case 'team': return k === 'pick.first' ? 'game.team.pick' : k === 'pick' ? 'game.team.picks' : `game.team.${k}`;
    case 'gift': return k === 'gift' ? 'game.gift.round' : `game.gift.${k}`;
    case 'rival': return k === 'statement' ? 'game.rival.round' : `game.rival.${k}`;
    case 'flirt': return k === 'line' ? 'game.flirt.round' : `game.flirt.${k}`;
    default: return `game.${family}.${k}`;
  }
}

// ── the Hangout keeps its secret ──────────────────────────────────────
// Two names go on the table (the one they block and the runner-up), so the
// debate does not give the answer away; the decision itself is kept for the
// blocking, as a flashback after the name.
const onTable = (s, h) => h === s.data.target || h === s.data.runnerUp?.handle;
const viewReason = (s, h) => (h === s.data.target ? s.data.reason : h === s.data.runnerUp?.handle ? s.data.runnerUp.reason : 'noBond');
function hangoutViews(s) {
  const views = s.data.views || [];
  const list = views.slice(0, 5);
  for (const must of [s.data.target, s.data.runnerUp?.handle].filter(Boolean)) {
    if (list.some(v => v.handle === must)) continue;
    const v = views.find(x => x.handle === must);
    const swap = [...list].reverse().findIndex(x => !onTable(s, x.handle));
    if (v && swap >= 0) list[list.length - 1 - swap] = v;
  }
  return list;
}
const hangoutOf = (state, s, target) => state.scenes.find(x => x.kind === 'hangout' && x.day === s.day && x.data?.target === target);
/** The Hangout's decision, as it aired nowhere else: the blocking's flashback. */
function hangoutFlashback(state, s, target) {
  const h = hangoutOf(state, s, target);
  if (!h) return [];
  const fb = [];
  if (h.who.length === 1) {
    fb.push({ key: `hangout.solo.view.${h.data.reason}.cut`, cast: { a: h.who[0], c: target }, extra: { reason: h.data.reason } },
      { key: 'hangout.solo.decide', cast: { a: h.who[0], c: target } });
  } else {
    const [a, b] = h.who;
    const trio = h.who.length >= 3;
    const lead = h.data.decider || a;
    fb.push({ key: `hangout.view.${h.data.reason}.cut`, cast: { a: lead, b: h.who.find(x => x !== lead) || b, c: target }, extra: { reason: h.data.reason } });
    const kind = h.data.offers?.some(o => o.trade) ? 'trade' : h.data.yielded ? 'yield' : 'agree';
    const outvoted = trio ? (h.data.offers || []).filter(o => o.target && o.target !== target).map(o => o.by) : [];
    fb.push(trio ? (outvoted.length ? { key: 'hangout.trio.outvoted', cast: { a: h.data.decider, b: outvoted[0], c: target } }
      : { key: 'hangout.trio.agree', cast: { a: h.who[0], b: h.who[1], c: target } })
      : { key: `hangout.${kind}`, cast: { a: h.data.decider, b: h.data.yielded || b, c: target } });
  }
  return fb.map((x, i) => ({ ...x, phase: i === 0 ? 'flashback-open' : 'flashback' }));
}
/** Who a clue could fit, as the Influencer who wrote it sees them: the ones who'd think it's them. */
function fearsFor(state, s, target) {
  const h = hangoutOf(state, s, target);
  const pool = (h?.data?.atRisk || []).filter(x => x !== target && state.profiles[x] && !s.data.by.includes(x));
  const by = s.data.by?.[0];
  const fit = x => (by ? blockScore(state, by, x).parts[s.data.reason] ?? 0 : 0);
  return pool.sort((x, y) => fit(y) - fit(x));
}

const BLOCKS = {
  chat(state, s) {
    const [a, b] = s.who;
    const c0 = s.data.claims?.length ? claimOf(state, s.data.claims[0]) : null;
    // A jealous chat is about the rival the crush flirted with (party.js).
    const c = s.data.intent === 'jealous' ? s.data.rival || undefined
      : c0 ? (c0.about === a || c0.about === b ? c0.holder : c0.about) : undefined;
    let key = s.data.intent === 'probe'
      ? `chat.probe.${s.data.probes?.[0]?.result || 'pass'}`
      // a catfish flirting in character, with nothing real behind it: its own lines
      : s.data.performed ? `chat.flirt.act.${s.data.ending}` : `chat.${s.data.intent}.${s.data.ending}`;
    // A friendly chat is often ABOUT something: b's life (ci/topics.js). A
    // catfish (or an edited job) has to wing a job they don't have.
    let text;
    if (s.data.intent === 'bond' && s.data.ending !== 'cold' && !c0) {
      const fake = wingsIt(state, b);
      const ts = topicsOf(state, b).filter(t => !fake || !PERSONAL_TOPICS.has(t));
      const hsh = [...String(s.id)].reduce((x, ch) => (x * 31 + ch.charCodeAt(0)) >>> 0, 7);
      if (ts.length && hsh % 100 < TOPIC_SHARE) {
        const t = ts[(hsh >>> 7) % ts.length];
        key = fake && JOB_TOPIC(t) ? 'chat.topic.fake' : `chat.topic.${t}`;
        text = { topic: TOPICS[t]?.label || t, town: townOf(state.profiles[b]?.shown?.hometown) || undefined };
      }
    }
    const personA = s.data.lead && state.profiles[a]?.players.length > 1 ? s.data.lead : undefined;
    const out = [{ key, cast: { a, b, c, personA, ...(text ? { text } : {}) }, extra: { claim: c0?.kind, lie: c0 ? c0.origin.by === a && !c0.truth : false } }];
    for (const sl of s.data.slips || []) {
      const listener = sl.noticedBy[0] || (sl.by === a ? b : a);
      // A voice slip with an author's leak shows the words themselves.
      const k = sl.misread ? 'slip.misread' : sl.leak ? `slip.leak.${sl.noticedBy.length ? 'noticed' : 'missed'}`
        : sl.topic ? `slip.topic.${sl.topic}.${sl.noticedBy.length ? 'noticed' : 'missed'}`
        : `slip.${sl.kind}.${sl.noticedBy.length ? 'noticed' : 'missed'}`;
      out.push({ key: k, cast: { a: sl.by, b: listener, ...(sl.leak ? { text: { x: sl.leak } } : {}) },
        extra: { slip: sl.kind, noticed: sl.noticedBy.length > 0, ...(sl.kind === 'voice' && !sl.leak ? { crack: crackOf(state, sl.by) } : {}) } });
    }
    const cb = gameCallback(state, a, b, s);
    if (cb) out.push({ key: `callback.${cb.kind}.${cb.dir}`, cast: { a, b, text: { game: cb.game } } });
    // A shared profile argues over the message before it goes (spec §14.8).
    const pa = state.profiles[a];
    if (s.data.lead && pa?.players.length > 1) {
      const won = s.data.lead === (pa.roles?.face || pa.players[0]) ? 'faceWins' : 'brainWins';
      // What they are to each other picks the words; a parent and child by who won.
      const rel = pa.relation;
      const relKey = rel === 'parent' ? `shared.argue.${s.data.lead === pa.roles?.parent ? 'parentWins' : 'kidWins'}.parent`
        : rel ? `shared.argue.${won}.${rel}` : null;
      // The relationship's own lines alongside the general ones: a pair argues
      // before nearly every message, so one small pool would repeat in days.
      out.push(relKey && POOLS[relKey]?.length ? { key: relKey, keys: [relKey, `shared.argue.${won}`], cast: { a, b } }
        : { key: `shared.argue.${won}`, cast: { a, b } });
    }
    // After a third of chats, a says one thing to the empty apartment, in the
    // head of their archetype (the real person; lines/asides.js).
    // THE CHAT BUILDS (user: "conversations aren't long enough to get deep"):
    // a hello (moved to the front once the slips are woven in), and a close
    // the way it went, or a heart-to-heart (conversation.js `deep`).
    const hh = [...`${s.id}:hello`].reduce((x, ch) => (x * 31 + ch.charCodeAt(0)) >>> 0, 7);
    // A chat that goes cold opens cool (nobody says 'for you? always' and then
    // walks out), and has no sign-off: whoever left, left.
    if (hh % 100 < HELLO_SHARE) out.push({ key: SERIOUS_CHATS.has(s.data.intent) ? 'chat.hello.serious' : s.data.ending === 'cold' ? 'chat.hello.cool' : 'chat.hello', cast: { a, b } });
    if (s.data.deep) out.push({ key: 'chat.deep', cast: { a, b } });
    else if (s.data.ending && s.data.ending !== 'cold' && (hh >>> 9) % 100 < CLOSE_SHARE) out.push({ key: `chat.close.${s.data.ending}`, cast: { a, b } });
    const group = asideGroup(state, a, s.data.lead);
    const hs = [...`${s.id}:aside`].reduce((x, ch) => (x * 31 + ch.charCodeAt(0)) >>> 0, 7);
    if (group && s.data.ending && !s.data.performed && key !== 'chat.topic.fake' && s.data.intent !== 'probe' && hs % 100 < ASIDE_SHARE) {
      out.push({ key: `aside.${group}.${s.data.ending}`, cast: { a, b, personA } });
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
    // From the scene's own record (the board draws the same counts), not the
    // live counter, which a later morning has already replaced.
    const tally = {};
    for (const [h, liked] of Object.entries(s.data.likes || {})) { tally[h] ??= 0; for (const o of liked || []) tally[o] = (tally[o] || 0) + 1; }
    const counts = Object.entries(tally).filter(([h]) => s.who.includes(h)).sort((x, y) => y[1] - x[1]);
    const out = counts.length ? [{ key: 'likes.most', cast: { a: counts[0][0] } }] : [];
    const none = counts.find(([, n]) => n === 0);
    if (none) out.push({ key: 'likes.none', cast: { a: none[0] } });
    return out;
  },
  'circle-chat'(state, s) {
    const posters = [...new Set((s.data.posts || []).map(p => p.by))];
    const [a = s.who[0], b = s.who.find(h => h !== a), c = s.who.find(h => h !== a && h !== b)] = posters;
    const key = s.data.first ? 'circle.first' : s.data.final ? 'circle.final' : s.data.party ? 'circle.party' : 'circle.open';
    const rest = [...posters, ...s.who].filter((h, i, l) => l.indexOf(h) === i && ![a, b, c].includes(h));
    const [d, e, f] = rest;
    const out = [{ key, cast: { a, b, c } }];
    // The chat keeps going (1×01: the group chat is where the whole room
    // talks at once), and people in other apartments react out loud.
    if (d && e) out.push({ key: s.data.final ? 'circle.final' : 'circle.more', cast: { a: d, b: e, c: f || a } });
    // A second exchange, from whoever hasn't spoken yet (or the first voices again in a small room).
    if (!s.data.final) out.push({ key: 'circle.more', cast: { a: rest[3] || b, b: rest[4] || c || a, c: rest[5] || a } });
    // The last one runs long: finalists look back, each to the one they're closest to.
    if (s.data.final) for (const h of [...new Set([a, b, d].filter(Boolean))].slice(0, 3)) {
      const to = s.who.filter(x => x !== h).sort((x, y) => rel(h, y, 'affection') - rel(h, x, 'affection'))[0];
      if (to) out.push({ key: 'circle.final.look', cast: { a: h, b: to } });
    }
    // Each reacts to somebody else's post, never their own.
    const spoke = [a, d, b, e].filter(Boolean);
    const reactors = [...new Set([f, rest[3], b, c].filter(Boolean))].slice(0, 3);
    // The last chat is goodbyes, not side-eye: nobody sneers at it.
    if (!s.data.final) reactors.forEach((h, i) => {
      const to = [spoke[i], ...spoke].find(x => x && x !== h);
      if (to) out.push({ key: 'circle.react', cast: { a: h, b: to } });
    });
    // Somebody notices how somebody else types (feed.js noticeStyle).
    for (const n of s.data.styleNotes || []) {
      out.push({ key: `style.${n.trait}.${n.tone}`, cast: { a: n.by, b: n.about, ...(n.x ? { text: { x: n.x } } : {}) } });
    }
    out.push({ key: 'circle.leave', cast: { a: c || a } });
    out.push(...(s.data.theories || []).map(t => ({ key: 'circle.theory', cast: { a: t.by, b: t.about }, extra: { claim: 'catfish' } })));
    return out;
  },
  profiles(state, s) {
    return s.who.map(a => ({ key: `profile.${state.profiles[a].mode}`, cast: { a },
      extra: { reasonKind: state.profiles[a].reason || undefined } }));
  },
  recognise(state, s) {
    // A famous face (season.js recogniseFame), or a borrowed photo somebody knows.
    const key = s.data.fame ? (s.data.fame === 'celebrity' ? 'recognise.celebrity' : s.data.fame === 'villain' ? 'recognise.villain' : 'recognise.tv') : 'recognise';
    // One face never hears the same line twice, whoever is looking at it.
    return [{ key, cast: { a: s.who[0], b: s.data.profile }, ...(s.data.fame ? { pairKey: `fame|${s.data.profile}` } : {}) }];
  },
  arrival(state, s) {
    const [a] = s.who;
    const reactions = s.data.reactions || [];
    // The alert lands in somebody's apartment first, then the newcomer, then
    // the room, each in their own way (arrivals.js roomReacts).
    const reader = reactions[0]?.by || s.seenBy.find(h => h !== a);
    const out = [];
    if (reader) out.push({ key: 'arrival.alert', cast: { a: reader } });
    out.push({ key: 'arrival', cast: { a } });
    for (const r of reactions) out.push({ key: `arrival.react.${r.kind}`, cast: { a: r.by, b: a } });
    if (!reactions.length) { const other = s.seenBy.find(h => h !== a); if (other) out.push({ key: 'arrival.react', cast: { a: other, b: a } }); }
    return out;
  },
  // A group chat (alliances.js): founded (the pitch, the name, who says no),
  // or a standing alliance checking in (the gossip, the agreed target).
  'group-chat'(state, s) {
    const [a, b, c] = s.who;
    const x = s.data.name;
    // An alliance coming apart (alliances.js): treason, a double agent, a walk-out.
    if (s.data.event === 'kick') return [{ key: 'group.kick', cast: { a: s.data.by[0], b: s.data.kicked, text: { game: x } } }];
    if (s.data.event === 'confront') return [{ key: `group.confront.${s.data.kicked ? 'out' : 'stay'}`, cast: { a: s.data.by, b: s.data.agent, text: { game: x, q: s.data.other } } }];
    if (s.data.event === 'leave') return [{ key: 'group.leave', cast: { a: s.data.left, b: s.data.to, text: { game: x } } }];
    if (s.data.formed !== false && s.data.accepted) {
      const yes = s.data.accepted || [];
      const out = [{ key: 'group.form.pitch', cast: { a, b: yes[0] || b, c: yes[1] || c || b } }];
      if (s.data.accepted.length) out.push({ key: 'group.form.name', cast: { a, b: s.data.accepted[0], c: s.data.accepted[1] || s.data.accepted[0], text: { game: x } } });
      for (const d of (s.data.declined || []).slice(0, 2)) out.push({ key: 'group.form.declined', cast: { a, b: d } });
      if (!s.data.formed) out.push({ key: 'group.form.fizzle', cast: { a } });
      return out;
    }
    const out = [{ key: 'group.check.open', cast: { a, b, c: c || b, text: { game: x } } }];
    const sh = (s.data.shared || [])[0];
    if (sh) out.push({ key: 'group.check.share', cast: { a: sh.by, b: s.who.find(h => h !== sh.by) } });
    if (s.data.plan) out.push({ key: 'group.check.plan', cast: { a, b: b || a, c: s.data.plan, text: { game: x } } });
    return out;
  },
  // Racing to the newcomer: a (who got there first, or second) and b (new).
  welcome(state, s) { return [{ key: `welcome.${s.data.ending}`, cast: { a: s.who[0], b: s.who[1] } }]; },
  'after-party'(state, s) { return [{ key: 'afterparty', cast: { a: s.who[0], b: s.who[1] } }]; },
  ratings(state, s, final = false) {
    const out = final
      ? s.who.slice(0, 3).map(h => ({ key: 'final.open', cast: { a: h } }))
      : [{ key: 'ratings.open', cast: { a: s.who[0] } }];
    const n = s.data.results.length;
    // Everybody says their first and their last; the middle only for a few
    // (the show lingers on three or four rankers a night, not all of them).
    let middles = 0;
    for (const b of s.data.ballots) {
      const first = b.order[0], last = b.order.at(-1);
      if (s.data.human) {
        out.push({ key: 'rate.human.top', cast: { a: b.voter, b: first } });
        if (last && last !== first) out.push({ key: 'rate.human.bottom', cast: { a: b.voter, b: last } });
        continue;
      }
      if (final) {
        out.push({ key: `final.rate.${b.reasons[0]}`, cast: { a: b.voter, b: first }, extra: { final: true } });
        if (last && last !== first) out.push({ key: `rate.${b.reasons.at(-1)}.bottom`, cast: { a: b.voter, b: last }, extra: { band: 'bottom', final: true } });
        continue;
      }
      out.push({ key: `rate.${b.reasons[0]}.top`, cast: { a: b.voter, b: first }, extra: { band: 'top' } });
      // Four names still have a middle (a small room late in the season).
      const mid = b.order.length >= 4 && middles < MIDDLES_PER_NIGHT ? b.order[Math.floor(b.order.length / 2)] : null;
      if (mid) { middles++; out.push({ key: 'rate.middle', cast: { a: b.voter, b: mid } }); }
      if (last && last !== first) out.push({ key: `rate.${b.reasons.at(-1)}.bottom`, cast: { a: b.voter, b: last }, extra: { band: 'bottom' } });
      const bad = last && gameCallback(state, b.voter, last, s, { sameDay: true, dir: 'theirs',
        kinds: ['named-bad', 'rival', 'jab', 'asked-barbed', 'picked-last', 'asked-catfish'] });
      if (bad) out.push({ key: 'rate.callback.bad', cast: { a: b.voter, b: last, text: { game: bad.game } } });
      const good = first && gameCallback(state, b.voter, first, s, { sameDay: true, dir: 'theirs', kinds: ['gift', 'named-good', 'portrait-kind'] });
      if (good) out.push({ key: 'rate.callback.good', cast: { a: b.voter, b: first, text: { game: good.game } } });
    }
    // Rankings sent; the waiting before the results.
    for (const h of s.data.ballots.map(x => x.voter).slice(-2)) out.push({ key: final ? 'final.done' : 'ratings.done', cast: { a: h } });
    if (!final && s.data.hidden) {
      const infl = s.data.influencers;
      for (const h of s.seenBy.filter(x => !infl.includes(x)).slice(0, 5)) out.push({ key: 'ratings.hidden', cast: { a: h } });
      for (const i of infl) out.push({ key: infl.length === 1 ? 'result.super' : 'result.secret', cast: { a: i } });
      return out;
    }
    if (!final) {
      for (const h of [...s.data.reveal.flat()].reverse().slice(0, 2)) out.push({ key: 'ratings.wait', cast: { a: h } });
      for (const group of s.data.reveal.slice(0, -1)) {
        for (const h of group) {
          const r = s.data.results.find(x => x.profile === h);
          out.push({ key: `result.${bandOf(r.place, n)}`, cast: { a: h, b: group.find(x => x !== h) },
            extra: { band: bandOf(r.place, n), place: PLACE_WORDS[r.place - 1] } });
        }
      }
      const [i1, i2] = s.data.influencers;
      out.push(i2 ? { key: 'result.influencers', cast: { a: i1, b: i2 } } : { key: 'result.sole', cast: { a: i1 } });
    }
    return out;
  },
  'final-ratings'(state, s) { return BLOCKS.ratings(state, s, true); },
  // A public save before the Hangout: the save, the saved, one who wasn't.
  save(state, s) {
    const { by, saved } = s.data;
    const out = [{ key: 'save.announce', cast: { a: by, b: saved } }, { key: 'save.react', cast: { a: saved, b: by } }];
    // Only a player still waiting to be saved can be passed over.
    const waiting = s.data.waiting || [];
    const passed = waiting.filter(h => rel(h, by, 'affection') > 3)
      .sort((x, y) => rel(y, by, 'affection') - rel(x, by, 'affection'))[0];
    if (passed) out.push({ key: 'save.passed', cast: { a: passed, b: by } });
    const hoping = waiting.find(h => h !== passed);
    if (hoping) out.push({ key: 'save.wait', cast: { a: hoping, b: by } });
    return out;
  },
  // Save then plead (US 4 Ep 10): the last two, face to face.
  plead(state, s) {
    const [p1, p2] = s.data.pleaders;
    const [i1, i2] = s.data.by;
    return [{ key: 'plead.open', cast: { a: p1, b: p2 } },
      { key: 'plead.pitch', cast: { a: p1, b: i1 } }, { key: 'plead.listen', cast: { a: i1, b: p1 } },
      { key: 'plead.pitch', cast: { a: p2, b: i2 || i1 } }, { key: 'plead.listen', cast: { a: i2 || i1, b: p2 } }];
  },
  // Circle-wide twists (Plan 3b Task 9a).
  'no-block'(state, s) {
    const [i1, i2] = s.data.influencers;
    const others = s.seenBy.filter(h => !s.data.influencers.includes(h));
    return [{ key: 'noblock.alert', cast: { a: others[0] || i1, b: others[1] || i2 || i1 } },
      ...(i1 ? [{ key: 'noblock.influencer', cast: { a: i1, b: i2 || i1 } }] : []),
      ...others.slice(2, 4).map(h => ({ key: 'noblock.relief', cast: { a: h } }))];
  },
  mission(state, s) { return [{ key: 'mission.given', cast: { a: s.data.holder, b: s.data.target } }]; },
  disrupter(state, s) {
    const [w, ...slow] = s.data.order;
    return [{ key: 'disrupter.alert', cast: { a: slow[0] || w, b: w } }, { key: `disrupter.win.${s.data.effect}`, cast: { a: w } },
      ...slow.slice(0, 2).map(h => ({ key: 'disrupter.slow', cast: { a: h, b: w } }))];
  },
  // Twists that change the count (Plan 3b Task 9b).
  'second-chance'(state, s) {
    const out = [{ key: 'secondchance.back', cast: { a: s.data.handle } }];
    const key = s.data.known ? 'secondchance.recognize' : 'secondchance.react';
    for (const h of s.seenBy.filter(x => x !== s.data.handle).slice(0, 2)) out.push({ key, cast: { a: h, b: s.data.handle } });
    return out;
  },
  egg(state, s) {
    const out = s.data.eggs.map(e => ({ key: 'egg.intro', cast: { a: e, anonA: true, anonAs: 'An egg' } }));
    // Nobody knows who is inside: they vote for "the first egg" or "the second".
    for (const [v, e] of Object.entries(s.data.votes).slice(0, 3)) out.push({ key: e === s.data.eggs[0] ? 'egg.vote.first' : 'egg.vote.second', cast: { a: v } });
    out.push({ key: 'egg.stays', cast: { a: s.data.stays } }, { key: 'egg.goes', cast: { a: s.data.goes } });
    return out;
  },
  // Identity twists (Plan 3b Task 9b).
  swap(state, s) {
    const [A, B] = s.data.handles;
    return [{ key: 'swap.told', cast: { a: A, b: B } }, { key: 'swap.told', cast: { a: B, b: A } }];
  },
  'swap-back'(state, s) { return s.data.handles.map(h => ({ key: 'swap.back', cast: { a: h } })); },
  clone(state, s) {
    const { original, clone, votes, fake } = s.data;
    const out = [{ key: 'clone.alert', cast: { a: Object.keys(votes)[0] || original } },
      { key: 'clone.plea.old', cast: { a: original } }, { key: 'clone.plea.new', cast: { a: clone } }];
    for (const [v, t] of Object.entries(votes).slice(0, 4)) out.push({ key: t === clone ? 'clone.vote.new' : 'clone.vote.old', cast: { a: v } });
    out.push({ key: 'clone.out', cast: { a: fake } });
    return out;
  },
  'ride-or-die'(state, s) {
    return s.data.pairs.slice(0, 2).flatMap(([a, b]) => [{ key: 'rod.partner', cast: { a, b } }]);
  },
  sacrifice(state, s) {
    const { goes, stays, chose } = s.data;
    return chose ? [{ key: 'sacrifice.go', cast: { a: goes, b: stays } }, { key: 'sacrifice.saved', cast: { a: goes, b: stays } }]
      : [{ key: 'sacrifice.kept', cast: { a: stays, b: goes } }];
  },
  // Powers (Plan 3b Task 8).
  'power-reveal'(state, s) {
    const readers = s.seenBy.filter(h => h !== s.who[0]);
    const [a, b] = [readers[0] || s.who[0], readers[1] || readers[0] || s.who[0]];
    if (s.data.kind === 'immunity') return [{ key: 'power.reveal.immunity', cast: { a, b: s.data.holder, c: s.data.from } }];
    return [{ key: `power.reveal.${s.data.kind}`, cast: { a, b } }];
  },
  hack(state, s) {
    const { hacker, as, to } = s.data;
    return [{ key: 'hack.send', cast: { a: hacker, b: to, c: as } }, { key: 'hack.read', cast: { a: to, b: as } }];
  },
  'hack-undone'(state, s) { return [{ key: 'hack.undone', cast: { a: s.data.to, b: s.data.as } }]; },
  'joker-chat'(state, s) { return [{ key: 'joker.chat', cast: { a: s.data.holder, b: s.data.newcomer, anonA: true, anonAs: 'The Joker' } }]; },
  'joker-pick'(state, s) { return [{ key: s.data.disrupter ? 'disrupter.pick' : 'joker.pick', cast: { a: s.data.holder, b: s.data.pick } }]; },
  'burner-exposed'(state, s) { return [{ key: 'burner.exposed', cast: { a: s.data.by, b: s.data.holder } }]; },
  // How a newcomer came in (Plan 3b Task 7).
  date(state, s) {
    const [h, chosen] = s.who;
    const out = [{ key: 'date.pick', cast: { a: h, b: chosen } }, { key: 'date.chat', cast: { a: h, b: chosen } },
      { key: 'date.gift', cast: { a: h, b: chosen } }];
    for (const o of s.data.options.filter(x => x !== chosen).slice(0, 1)) out.push({ key: 'date.passed', cast: { a: o, b: h } });
    return out;
  },
  invites(state, s) {
    const [h] = s.who;
    const out = s.data.order.slice(0, 3).map((o, i) => ({ key: i ? 'invites.next' : 'invites.first', cast: { a: h, b: o } }));
    const skipped = s.seenBy.find(o => o !== h && !s.data.order.includes(o));
    if (skipped) out.push({ key: 'invites.last', cast: { a: skipped, b: h } });
    return out;
  },
  race(state, s) {
    const [h] = s.who;
    const [first, ...rest] = s.data.order;
    return [...(first ? [{ key: 'race.win', cast: { a: first, b: h } }] : []),
      ...rest.slice(0, 2).map(o => ({ key: 'race.lose', cast: { a: o, b: h } }))];
  },
  newparty(state, s) {
    const [h] = s.who;
    return [{ key: 'newparty.throw', cast: { a: h } },
      ...s.data.guests.slice(0, 2).map(g => ({ key: 'newparty.guest', cast: { a: g, b: h } })),
      ...s.data.left.slice(0, 2).map(o => ({ key: 'newparty.left', cast: { a: o, b: h } }))];
  },
  lurk(state, s) {
    const [h] = s.who;
    return [{ key: 'lurk.watch', cast: { a: h } }, ...s.data.watched.slice(0, 2).map(o => ({ key: 'lurk.reveal', cast: { a: o, b: h } }))];
  },
  chosen(state, s) {
    const { chosen, by } = s.data;
    return [{ key: 'chosen.offer', cast: { a: by[0] } }, { key: 'chosen.pick', cast: { a: by[0], b: chosen } },
      { key: 'chosen.thanks', cast: { a: chosen, b: by[0] } }];
  },
  'pair-arrival'(state, s) { return [{ key: 'pairarrival.chat', cast: { a: s.who[0], b: s.who[1] } }]; },
  // Antivirus (US 4 Ep 8-9): who passed it to whom, in order.
  antivirus(state, s) {
    const { holders, passes, left } = s.data;
    const out = [{ key: 'antivirus.open', cast: { a: holders[0], b: holders[1] || holders[0] } }];
    passes.forEach((p, i) => {
      out.push({ key: 'antivirus.pass', cast: { a: p.from, b: p.to } });
      if (i < 4) out.push({ key: 'antivirus.got', cast: { a: p.to, b: p.from } });
    });
    if (left[0]) out.push({ key: 'antivirus.left', cast: { a: left[0] } });
    return out;
  },
  // Room vote (UK 1 Ep 15): the bottom two, every vote in public.
  vote(state, s) {
    const [b1, b2] = s.data.bottom;
    const out = [{ key: 'vote.open', cast: { a: b1, b: b2 } }];
    for (const [v, t] of Object.entries(s.data.votes).slice(0, 6)) out.push({ key: 'vote.cast', cast: { a: v, b: t } });
    return out;
  },
  // Forced statement (US 5 Ep 1): everyone names who they would block.
  statement(state, s) {
    const out = [{ key: 'statement.open', cast: { a: s.who[0], b: s.who[1] } }];
    for (const [h, t] of Object.entries(s.data.picks).slice(0, 8)) out.push({ key: 'statement.say', cast: { a: h, b: t } });
    const named = {};
    for (const t of Object.values(s.data.picks)) named[t] = (named[t] || 0) + 1;
    for (const t of Object.keys(named).sort((x, y) => named[y] - named[x]).slice(0, 2)) {
      const by = Object.keys(s.data.picks).find(h => s.data.picks[h] === t);
      out.push({ key: 'statement.named', cast: { a: t, b: by } });
    }
    return out;
  },
  // "Would you like to block your fellow Influencer?" (UK 3 Ep 16)
  offer(state, s) {
    const [A, B] = s.who;
    const out = [{ key: 'offer.open', cast: { a: A, b: B } }];
    for (const [x, y] of [[A, B], [B, A]]) out.push({ key: s.data.answers[x] ? 'offer.yes' : 'offer.no', cast: { a: x, b: y } });
    const t = s.data.target;
    if (t) out.push({ key: 'offer.betrayed', cast: { a: t, b: t === A ? B : A } });
    else out.push({ key: 'offer.declined', cast: { a: A, b: B } });
    return out;
  },
  // The Circle's alert: somebody reads the rule out loud, somebody reacts.
  alert(state, s) {
    const [a, b] = [...s.who].sort((x, y) => S(state, y, 'boldness') - S(state, x, 'boldness'));
    return [{ key: `alert.${s.data.format}`, cast: { a, b: b || a } }];
  },
  hangout(state, s) {
    // A sole Influencer weighs the names alone, out loud.
    if (s.who.length === 1) {
      const [a] = s.who;
      const out = [{ key: 'hangout.solo.open', cast: { a } }];
      for (const v of hangoutViews(s)) {
        const reason = viewReason(s, v.handle);
        out.push({ key: `hangout.solo.view.${reason}.${onTable(s, v.handle) ? 'cut' : 'keep'}`, cast: { a, c: v.handle }, extra: { reason } });
      }
      // The decision itself airs later, in the blocking's flashback.
      out.push({ key: 'hangout.solo.sealed', cast: { a } });
      return out;
    }
    const [a, b] = s.who;
    const trio = s.who.length >= 3;
    const out = [trio ? { key: 'hangout.open.trio', cast: { a, b, c: s.who[2] } } : { key: 'hangout.open', cast: { a, b } }];
    // They take turns bringing up each name.
    hangoutViews(s).forEach((v, i) => {
      const cut = onTable(s, v.handle);
      const reason = viewReason(s, v.handle);
      const who = s.who.length >= 3 ? [s.who[i % 3], s.who[(i + 1) % 3]] : i % 2 ? [b, a] : [a, b];
      const [x, y] = who;
      out.push({ key: `hangout.view.${reason}.${cut ? 'cut' : 'keep'}`, cast: { a: x, b: y, c: v.handle }, extra: { reason } });
    });
    // The show cuts before the name: the decision airs in the blocking's
    // flashback, after the announcement has named them.
    out.push({ key: 'hangout.sealed', cast: { a: s.data.decider || a, b: s.who.find(h => h !== (s.data.decider || a)) || b } });
    if (s.data.offers.some(o => o.pact)) out.push({ key: 'hangout.pact', cast: { a, b } });
    return out;
  },
  blocking(state, s) {
    // From the data: an instant block has a target and nobody who chose it.
    const target = s.data.target ?? s.who[1];
    const announcer = s.data.by?.length ? (s.who[0] === target ? s.data.by[0] : s.who[0]) : null;
    const others = s.seenBy.filter(h => h !== target && h !== announcer && !s.data.by.includes(h));
    // Before the name: the ones at risk, waiting; the Influencer typing it.
    // Everybody waits: for the name, or (in person) for somebody's knock.
    // Nobody types a name when the saves or the room decided: the waiting was there.
    const untyped = ['unsaved', 'vote', 'instant', 'antivirus', 'mission'].includes(s.data.channel);
    const out = untyped ? [] : [target, ...others].slice(0, s.data.inPerson ? 3 : 4).map(h => ({ key: 'block.wait', cast: { a: h } }));
    if (s.data.inPerson) {
      // A Super Influencer says it at the door (US 1 Ep 10).
      out.push({ key: 'block.inperson.walk', cast: { a: announcer, c: target } },
        { key: 'block.inperson.door', cast: { a: target, b: announcer } },
        { key: 'block.inperson.tell', cast: { a: announcer, b: target } });
    } else if (['unsaved', 'vote', 'instant', 'antivirus'].includes(s.data.channel)) {
      // Nobody typed a name: the Circle says who was left, or who the room chose.
      out.push({ key: `block.announce.${s.data.channel}`, cast: { a: target, c: target } });
      if (s.data.channel === 'vote') out.push({ key: 'vote.result', cast: { a: target } });
      // Nobody chose: the room reacts to how cold that is.
      if (s.data.channel === 'instant') for (const h of others.slice(0, 2)) out.push({ key: 'block.react.numbers', cast: { a: h, b: target } });
      // Nobody saved them: the room takes in what that means.
      if (s.data.channel === 'unsaved') for (const h of others.slice(0, 2)) out.push({ key: 'block.react.unsaved', cast: { a: h, b: target } });
    } else if (s.data.channel === 'mission') {
      // The mission failed: the Circle blocks the one who carried it.
      out.push({ key: 'block.announce.mission', cast: { a: target, c: target } });
    } else if (s.data.channel === 'statement') {
      out.push({ key: 'block.typing', cast: { a: announcer, c: target }, extra: { reason: s.data.reason } },
        { key: 'block.announce.statement', cast: { a: announcer, c: target } });
    } else if (s.data.secret) {
      // The building guesses who chose, each from what they already believe:
      // whoever they see as the biggest threat (right or wrong).
      for (const h of others.slice(0, 2)) {
        const guess = s.seenBy.filter(o => o !== h && o !== target)
          .sort((x, y) => (state.beliefs[h]?.[y]?.threat ?? 3) - (state.beliefs[h]?.[x]?.threat ?? 3))[0];
        if (guess) out.push({ key: 'block.react.guess', cast: { a: h, b: guess } });
      }
      // Nobody may learn who chose: the Circle names the blocked player itself.
      out.push({ key: 'block.announce.secret', cast: { a: target, c: target } });
    } else {
      // THE BUILD-UP (the show drags it out, one message at a time): an
      // opener, a clue true to the real reason, and between them the ones the
      // clue could fit, sure it's them; the target last, then the dots.
      const solo = s.data.by.length === 1;
      const clue = ['fake', 'threat', 'grudge', 'noBond', 'offer'].includes(s.data.reason) ? s.data.reason : 'noBond';
      const [herring] = fearsFor(state, s, target);
      out.splice(2);
      out.push({ key: `block.build.open${solo ? '.solo' : ''}`, cast: { a: announcer } });
      if (herring) out.push({ key: `block.fear.${clue}`, cast: { a: herring } });
      out.push({ key: `block.build.clue.${clue}`, cast: { a: announcer } });
      out.push({ key: 'block.fear.dots', cast: { a: target } });
      out.push({ key: 'block.typing', cast: { a: announcer, c: target }, extra: { reason: s.data.reason } },
        // A sole Influencer announces in the first person; an offer taken, as itself.
        { key: s.data.reason === 'offer' ? 'block.announce.offer'
          : `block.announce.${solo ? 'solo.' : ''}${s.data.reason}`, cast: { a: announcer, c: target }, extra: { reason: s.data.reason } });
      // And how they got there: the Hangout's decision, as a flashback.
      out.push(...hangoutFlashback(state, s, target));
    }
    if (s.data.mission && s.data.mission.target === target) out.push({ key: 'mission.success', cast: { a: s.data.mission.holder, b: target } });
    out.push(
      { key: 'block.react.self', cast: { a: target }, extra: { self: true } },
      ...(announcer ? [{ key: 'block.after', cast: { a: announcer, b: target } }] : []),
      ...s.data.by.filter(i => i !== announcer).slice(0, 2).map(i => ({ key: 'block.after', cast: { a: i, b: target } })));
    const friend = others.find(h => rel(h, target, 'affection') > 3);
    const rival = others.find(h => rel(h, target, 'resentment') > 3 && h !== friend);
    if (friend) out.push({ key: 'block.react.friend', cast: { a: friend, b: target } });
    if (rival) out.push({ key: 'block.react.rival', cast: { a: rival, b: target } });
    for (const h of others.filter(x => x !== friend && x !== rival).slice(0, 3)) out.push({ key: 'block.react.relief', cast: { a: h, b: target } });
    // One of their own blocked them: the alliance that just broke (alliances.js).
    for (const br of (s.data.betrayed || []).slice(0, 1)) {
      // The one blocked by their own ally first, then the rest of the group.
      out.push({ key: 'alliance.betrayed.self', cast: { a: target, b: br.betrayer, text: { game: br.name } } });
      for (const m of br.members.filter(m => m !== br.betrayer).slice(0, 2)) out.push({ key: 'alliance.betrayed', cast: { a: m, b: br.betrayer, c: target, text: { game: br.name } } });
    }
    return out;
  },
  visit(state, s) {
    const [h, to] = s.who;
    // In person (a Super Influencer came to the door): nobody chose, nobody waited.
    const out = s.data.inPerson ? [] : [{ key: `visit.choose.${s.data.motive}`, cast: { a: h, b: to }, extra: { motive: s.data.motive } }];
    if (!s.data.inPerson) out.push({ key: 'visit.walk', cast: { a: h, b: to } });
    // Everybody waits, the one about to be visited included: nobody knows whose door it is.
    // The show keeps whose door it is for the knock: the others wait first,
    // the one being visited last, and the knock is theirs.
    if (!s.data.inPerson) for (const w of [...state.active.filter(x => x !== to && x !== h).slice(0, 3), to]) {
      out.push({ key: state.profiles[w].mode === 'catfish' ? 'visit.wait.catfish' : 'visit.wait', cast: { a: w, b: h } });
    }
    // The door opens both ways: each sees who was behind the other profile.
    // Usually the visited player opens it; in person, the blocked one does.
    const ip = !!s.data.inPerson;
    const [host, guest] = ip ? [h, to] : [to, h];
    const fakeGuest = state.profiles[guest].mode === 'catfish', fakeHost = state.profiles[host].mode === 'catfish';
    const door = fakeGuest && fakeHost ? 'both' : fakeGuest ? 'catfish' : fakeHost ? null : 'real';
    // In person the knock already happened in the blocking scene; only a reveal is new.
    if (door && !(ip && door === 'real')) out.push({ key: `visit.door.${door}`, cast: { a: host, b: guest } });
    if (fakeHost && !fakeGuest) out.push({ key: 'visit.door.caught', cast: { a: guest, b: host } });
    out.push({ key: 'visit.sit', cast: { a: guest, b: host } });
    // One Influencer, or two: "it was both of us" only when it was.
    const sole = (s.data.by?.length ?? 2) === 1;
    out.push({ key: `visit.talk.${s.data.motive}`, cast: { a: h, b: to }, extra: { motive: s.data.motive, sole } });
    // The conversation keeps going: on the real show a visit is a sit-down.
    out.push({ key: `visit.talk2.${s.data.motive}`, cast: { a: h, b: to }, extra: { motive: s.data.motive, sole } });
    if (s.data.power) out.push({ key: `visit.power.${s.data.power}`, cast: { a: h, b: to } });
    if (s.data.handed) {
      const c0 = claimOf(state, s.data.handed);
      out.push({ key: 'visit.hand', cast: { a: h, b: to, c: c0.about }, extra: { claim: c0.kind } });
    }
    if (s.data.kiss) out.push({ key: 'visit.kiss', cast: { a: h, b: to }, extra: { kiss: true } });
    // In person the Super Influencer is the one who leaves.
    out.push(ip ? { key: 'visit.inperson.bye', cast: { a: to, b: h } } : { key: 'visit.bye', cast: { a: h, b: to } });
    out.push(ip ? { key: 'visit.inperson.after', cast: { a: h, b: to } } : { key: 'visit.after', cast: { a: to, b: h } });
    return out;
  },
  report(state, s) {
    return [{ key: 'report', cast: { a: s.who[0], b: s.who[1], c: s.data.rival }, extra: { lie: true, claim: 'visitSaid' } }];
  },
  goodbye(state, s) {
    const [h] = s.who;
    const p = state.profiles[h];
    const viewers = s.seenBy.filter(x => x !== h);
    const out = viewers.slice(0, 4).map(v => ({ key: 'goodbye.guess', cast: { a: v, b: h } }));
    out.push({ key: p.ai ? 'goodbye.video.ai' : p.mode === 'catfish' ? `goodbye.video.catfish.${p.reason || 'strategic'}` : `goodbye.video.${p.mode}`,
      cast: { a: h }, extra: { mode: p.mode, reasonKind: p.reason || undefined } });
    // A pair that is something to each other says goodbye as that.
    if (p.relation && p.players.length > 1 && POOLS[`goodbye.pair.${p.relation}`]?.length) out.push({ key: `goodbye.pair.${p.relation}`, cast: { a: h } });
    // A shout-out to their closest friend still in the building, when there is one.
    const bestie = viewers.filter(v => rel(h, v, 'affection') > 3).sort((x, y) => rel(h, y, 'affection') - rel(h, x, 'affection'))[0];
    if (bestie && !p.ai) out.push({ key: 'goodbye.shout', cast: { a: h, b: bestie } });
    // Every goodbye ends the same way on the show: a lesson, then good luck (spec 11.2).
    out.push({ key: 'goodbye.video.close', cast: { a: h } });
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
    if (suspecter) out.push({ key: p.mode === 'catfish' ? 'goodbye.react.vindicated' : 'goodbye.react.surprised', cast: { a: suspecter, b: h } });
    // Everybody else watching reacts too, and a friend has the last word.
    for (const v of viewers.filter(x => ![guilty, warned, suspecter].includes(x)).slice(0, 3)) {
      out.push({ key: 'goodbye.react.surprised', cast: { a: v, b: h } });
    }
    const friend = viewers.filter(v => rel(v, h, 'affection') > 2).sort((x, y) => rel(y, h, 'affection') - rel(x, h, 'affection'))[0];
    if (friend) out.push({ key: 'goodbye.after', cast: { a: friend, b: h } });
    return out;
  },
  meet(state, s) {
    const [a, ...present] = s.who;
    // The first one in waits alone in the studio.
    if (!present.length) return [{ key: 'meet.first', cast: { a } }];
    const explain = (h, to) => {
      const why = state.profiles[h].reason;
      return { key: `meet.explain.${why || 'strategic'}`, cast: { a: h, b: to }, extra: { reasonKind: why || undefined } };
    };
    const fake = h => state.profiles[h].mode === 'catfish';
    const pair = h => state.profiles[h].players.length > 1;
    // The AI arrives as a screen (US 6).
    if (state.profiles[a]?.ai && present.length) return [{ key: 'meet.arrive.ai', cast: { a, b: present.at(-1) } },
      ...present.slice(0, 2).map(h => ({ key: 'meet.react', cast: { a: h, b: a }, extra: { catfish: true } })), { key: 'meet.settle', cast: { a, b: present.at(-1) } }];
    // A shared profile walks in as two people: that is the reveal.
    if (present.length === 1 && pair(present[0])) {
      return [{ key: 'meet.found.shared', cast: { a, b: present[0] } }, { key: sharedExplain(state, present[0]), cast: { a: present[0], b: a } },
        ...(fake(present[0]) ? [explain(present[0], a)] : [])];
    }
    if (pair(a)) {
      const b = present.at(-1);
      const out = [{ key: 'meet.arrive.shared', cast: { a, b } }, { key: sharedExplain(state, a), cast: { a, b } }];
      if (fake(a)) out.push(explain(a, b));
      for (const h of present.filter(x => x !== b).slice(-3)) out.push({ key: 'meet.react.shared', cast: { a: h, b: a } });
      out.push({ key: 'meet.settle', cast: { a, b } });
      return out;
    }
    // The first one in waited alone: a catfish there is found out by the
    // second, and that replaces the happy hello.
    const first = present.length === 1 && fake(present[0]) ? present[0] : null;
    if (first && fake(a)) return [{ key: 'meet.both', cast: { a, b: first } }, explain(a, first), explain(first, a)];
    if (first) return [{ key: 'meet.found', cast: { a, b: first } }, explain(first, a)];
    const b = present.at(-1);
    const out = fake(a) ? [{ key: 'meet.arrive.catfish', cast: { a, b } }, explain(a, b)] : [{ key: 'meet.arrive.real', cast: { a, b } }];
    // Everybody already in the room reacts to who walked in.
    const reacting = present.length <= 2 ? present : present.filter(x => x !== b).slice(-3);
    for (const h of reacting) out.push({ key: 'meet.react', cast: { a: h, b: a }, extra: { catfish: fake(a) } });
    out.push({ key: 'meet.settle', cast: { a, b } });
    return out;
  },
  reveal(state, s) {
    const pl = s.data.placements;
    return [...pl.slice(1).reverse().map(x => ({ key: 'reveal.place', cast: { a: x.profile }, extra: { place: PLACE_WORDS[x.place - 1] } })),
      { key: 'reveal.winner', cast: { a: pl[0].profile } }];
  },
  // A game airs as its beats (js/ci/game-beats.js): the alert, the rounds
  // with every answer that matters, the reveal, the verdict, the prize.
  game(state, s) {
    const g = GAMES.find(x => x.id === s.data.gameId);
    return (s.data.beats || []).map((b, bi) => {
      const key = gameKey(g.family, b);
      const promptId = b.promptId;
      // The engine keeps ids; the words are looked up here.
      const prompt = promptId ? g.prompts?.find(p => p.id === promptId) : null;
      const trivia = b.qid ? Object.values(TRIVIA).flat().find(t => t.id === b.qid) : null;
      const fact = b.factId && promptId ? (FACTS[promptId] || []).find(f => f.id === b.factId) : null;
      const q = trivia?.q ?? prompt?.text ?? (b.kind === 'open' ? g.rules[0] : undefined);
      const x = trivia ? (b.right ? trivia.a : trivia.wrong) : fact?.text;
      const suffix = key.replace(/^game\.(statement|name|ask|guess|make|photo|team|gift|rival|flirt)\./, '').replace(/^game\./, '');
      const keys = [promptId && `g.${g.id}.${promptId}.${suffix}`, `g.${g.id}.${suffix}`, key].filter(k => k && POOLS[k]?.length);
      const ans = b.answer ? (g.say || ['Agree', 'Disagree'])[b.answer === 'agree' ? 0 : 1] : undefined;
      const extra = {};
      for (const k of GAME_FACTS) if (b[k] !== undefined) extra[k] = b[k];
      // bi: which beat this is, for the game board (js/vp-ci/boards.js).
      return { key, keys: keys.length ? keys : [key], phase: b.phase, round: b.round, bi,
        cast: { a: b.by, b: b.about, c: b.c, anonA: b.kind === 'question' && b.anon,
          text: { q, x, n: b.n === undefined ? undefined : String(b.n), game: g.name, ans } }, extra };
    });
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
    // The night itself: dancing alone, party photos, the flirting, the end.
    const d = s.data;
    const tail = [];
    for (const h of d.dancers || []) tail.push({ key: 'party.dance', cast: { a: h } });
    // A different voice likes each photo when the room allows it.
    const liked = new Set();
    for (const ph of d.photos || []) {
      const b = ph.likers.find(h => !liked.has(h)) || ph.likers[0] || s.who.find(h => h !== ph.by);
      liked.add(b);
      tail.push({ key: 'party.photo', cast: { a: ph.by, b, text: { n: String(ph.likers.length) } } });
    }
    // The flirting: up to two couples, nobody in both (a party is where it happens).
    const fl = (d.flirts || [])[0];
    const fl2 = fl && (d.flirts || []).find(x => !x.includes(fl[0]) && !x.includes(fl[1]));
    tail.push(fl ? { key: 'party.flirt', cast: { a: fl[0], b: fl[1] } }
      : { key: 'party.banter', cast: { a: s.who[1] || s.who[0], b: s.who[2] || s.who[0] } });
    // Somebody watching with a crush on one of them (party.js jealous).
    const jealousOf = pair => (d.jealous || []).find(j => pair.includes(j.of) && pair.includes(j.rival));
    const j1 = fl && jealousOf(fl);
    if (j1) tail.push({ key: 'party.jealous', cast: { a: j1.by, b: j1.of, c: j1.rival } });
    if (fl2) tail.push({ key: 'party.flirt', cast: { a: fl2[0], b: fl2[1] } });
    const j2 = fl2 && jealousOf(fl2);
    if (j2) tail.push({ key: 'party.jealous', cast: { a: j2.by, b: j2.of, c: j2.rival } });
    if (d.dancers?.[0]) tail.push({ key: 'party.end', cast: { a: d.dancers.at(-1) } });
    // Dancing first, then the photos, then the game, the flirting and the end.
    return [out[0], ...tail.slice(0, (d.dancers || []).length + (d.photos || []).length), ...out.slice(1), ...tail.slice((d.dancers || []).length + (d.photos || []).length)];
  },
  life(state, s) {
    // A pair that is something to each other: often it's the two of them.
    const p = state.profiles[s.who[0]];
    const hs = [...`${s.id}:pair`].reduce((x, ch) => (x * 31 + ch.charCodeAt(0)) >>> 0, 7);
    if (p?.relation && p.players.length > 1 && hs % 100 < PAIR_LIFE) return [{ key: `life.pair.${p.relation}`, cast: { a: s.who[0] } }];
    return [{ key: `life.${s.data.habit}`, cast: { a: s.who[0], personA: s.data.person } }];
  },
  // Private to the apartment: only its player is cast.
  'home-video'(state, s) { return [{ key: 'home.video', cast: { a: s.who[0] } }]; },
};


export function sceneBlocks(state, scene) {
  return (BLOCKS[scene.kind]?.(state, scene) || []).filter(b => b.cast.a);
}

// Scene kinds whose screens read each block's cast (js/vp-ci/moments.js).
export const ON_STAGE = new Set(['ratings', 'final-ratings', 'hangout', 'blocking', 'visit', 'meet', 'reveal', 'goodbye']);

export function writeScene(state, scene) {
  const blocks = [];
  // Who has already said hello to the group in this scene (an authored greeting).
  const ctx = { kind: scene.kind, scene, greeted: new Set() };
  sceneBlocks(state, scene).forEach((b, i) => {
    const extra = Object.fromEntries(Object.entries(b.extra || {}).filter(([, v]) => v !== undefined));
    const facts = { ...factsFor(state, scene, b.cast), ...extra };
    const rng = streamFor(state.seed, `line:${scene.id}:${i}`);
    const pairKey = b.pairKey || [b.cast.a, b.cast.b, b.cast.c].filter(Boolean).sort().join('|');
    const entry = pickEntry(state, b.keys || b.key, facts, pairKey, rng, b.cast.a);
    if (!entry) { (state.missingPools ||= {})[b.key] = (state.missingPools[b.key] || 0) + 1; return; }
    const from = b.keys ? entry.id.replace(/\.[^.]+$/, '') : b.key;
    // The big moments' screens need to know who each block is about (the
    // name on the ranking slot, the tile at risk, the place on the board).
    const on = ON_STAGE.has(scene.kind)
      ? Object.fromEntries(['a', 'b', 'c'].filter(k => typeof b.cast[k] === 'string').map(k => [k, b.cast[k]])) : null;
    blocks.push({ key: from, ...(b.phase ? { phase: b.phase } : {}), ...(b.round != null ? { round: b.round } : {}),
      ...(on ? { on } : {}), ...(b.bi != null ? { bi: b.bi } : {}), ...renderEntry(state, entry, b.cast, rng, ctx) });
  });
  // A slip happens inside the conversation: weave it into the chat before the
  // chat's closing beat, rather than printing it as a second scene.
  if (scene.kind === 'chat' && blocks.length > 1 && !blocks[0].key.startsWith('slip.')) {
    for (const b of blocks.slice(1).filter(x => x.key.startsWith('slip.'))) {
      blocks[0].lines.push(...b.lines);
      (blocks[0].woven ||= []).push(b.key);   // which slip pool was woven in
      if (b.beat) blocks[0].lines.push({ who: b.lines[0]?.who, kind: 'stage', text: b.beat });
    }
    blocks.splice(1, blocks.length - 1, ...blocks.slice(1).filter(x => !x.key.startsWith('slip.')));
  }
  // A game remembered opens the chat; the argument over the message comes
  // before the message itself.
  // The hello opens the conversation itself (its lines join the chat's
  // block, which stays the chat's main block).
  const hello = scene.kind === 'chat' ? blocks.findIndex(x => x.key.startsWith('chat.hello')) : -1;
  if (hello > 0) { const [h] = blocks.splice(hello, 1); blocks[0].lines.unshift(...h.lines); (blocks[0].hello ||= h.key); }
  for (const prefix of ['callback.', 'shared.argue.']) {
    const at = blocks.findIndex(x => x.key.startsWith(prefix));
    if (at > 0) blocks.unshift(...blocks.splice(at, 1));
  }
  scene.script = { blocks };
  return scene.script;
}

export const MIDDLES_PER_NIGHT = 3;
// How many chats open with a hello, and close with a sign-off (chat-depth.js).
export const HELLO_SHARE = 70;
export const CLOSE_SHARE = 75;
const SERIOUS_CHATS = new Set(['confront', 'repair', 'probe', 'compare', 'confess', 'jealous', 'plant', 'pump']);
// How often a pair's time alone in the apartment is the two of them together.
export const PAIR_LIFE = 50;
// How many chats end with a word to the empty apartment (lines/asides.js).
export const ASIDE_SHARE = 35;
const ASIDE_GROUP = { villain: 'schemer', mastermind: 'schemer', schemer: 'schemer',
  hero: 'sweet', 'loyal-soldier': 'sweet', 'social-butterfly': 'sweet', underdog: 'sweet', goat: 'sweet',
  showmancer: 'romantic', hothead: 'wild', 'chaos-agent': 'wild', wildcard: 'wild', 'challenge-beast': 'wild',
  floater: 'watcher', 'perceptive-player': 'watcher' };
/** The real person behind a profile, by archetype (a pair: whoever led this chat). */
function asideGroup(state, h, lead) {
  const who = lead || state.profiles[h]?.players?.[0];
  const person = state.people[who];
  if (!person || person.ai) return null;
  return ASIDE_GROUP[person.archetype] || null;
}
// How many friendly chats are about something in b's life (ci/topics.js).
export const TOPIC_SHARE = 45;
// A catfish can wing a job; a dog, the kids, church or a hometown they don't have is a lie too far.
const PERSONAL_TOPICS = new Set(['kids', 'dog', 'church', 'hometown']);

/** How a pair explains itself at the finale: by what they are, when the author said. */
function sharedExplain(state, h) {
  const rel = state.profiles[h]?.relation;
  return rel && POOLS[`meet.explain.shared.${rel}`]?.length ? `meet.explain.shared.${rel}` : 'meet.explain.shared';
}

// The night's scenes that can open a day (season.js: the blocking follows the
// ratings into the next episode).
const NIGHT_KINDS = new Set(['hangout', 'blocking', 'save', 'plead', 'vote', 'offer', 'visit', 'antivirus', 'no-block']);

/** Script every aired scene of the day, and open the day with the host. */
export function writeDay(state, day) {
  const aired = state.scenes.filter(s => s.day === day && s.aired);
  aired.forEach(s => writeScene(state, s));
  if (!aired[0]) return;
  const rng = streamFor(state.seed, `line:cold:${day}`);
  // A day that opens on last night's Hangout and blocking (the ratings ended
  // the last episode): the host picks up the cliffhanger, and the good-morning
  // waits until the night is over.
  let morning = 0;
  while (morning < aired.length && NIGHT_KINDS.has(aired[morning].kind)) morning++;
  const blockedToday = state.blocked.some(b => b.day === day);
  if (morning > 0) {
    const infl = [...state.ratings].reverse().find(r => !r.final)?.influencers?.length ?? 0;
    const entry = pickEntry(state, 'host.cold.night', { blocks: blockedToday, infl }, `day${day}`, rng);
    if (entry) aired[0].script.blocks.unshift({ key: 'host.cold.night', ...renderEntry(state, entry, { a: aired[0].who[0] }, rng) });
  }
  const yesterday = state.scenes.filter(s => s.day === day - 1);
  const tone = day === 1 ? 'first' : (morning > 0 ? blockedToday : yesterday.some(s => s.kind === 'blocking')) ? 'blocking'
    : yesterday.some(s => s.kind === 'arrival') ? 'arrival' : 'quiet';
  const first = aired[morning];
  if (first) {
    const key = `host.cold.${tone}`;
    const entry = pickEntry(state, key, { early: day <= 2 }, `day${day}`, rng);
    // a: somebody still in the Circle (a goodbye scene opens on the one who left)
    const a = first.who.find(h => state.active.includes(h)) || state.active[0];
    if (entry) first.script.blocks.unshift({ key, ...renderEntry(state, entry, { a }, rng) });
  }
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
    // (an aside is part of its chat, not a beat of its own)
    // A sign-off or a heart-to-heart is the same chat, not another beat.
    since += (s.script?.blocks || []).filter(b => !b.key.startsWith('aside.') && !/^chat\.(close|deep)/.test(b.key)).length;
  }
}

// Every pool key sceneBlocks can ask for — the writing backlog, and what the
// coverage guard checks (tests/ci-lines.test.js).
const INTENTS_ = ['bond', 'ally', 'flirt', 'pump', 'compare', 'plant', 'credit', 'repair', 'confront', 'checkin', 'pitch', 'confess', 'jealous'];
const REASONS_ = ['affection', 'trust', 'obligation', 'pact', 'alliance', 'protection', 'threat', 'suspicion', 'grudge', 'deserves'];
const SLIPS_ = ['knowledge', 'body', 'voice', 'tooPerfect', 'overreach', 'name'];
const MOTIVES_ = ['friend', 'answers', 'truth', 'apology'];
const WHY_ = ['strategic', 'protective', 'experimental', 'family'];
const BLOCK_WHY_ = ['fake', 'threat', 'grudge', 'noBond'];
export const POOL_KEYS = [
  // a chat that builds (lines/chat-depth.js)
  'chat.hello', 'chat.hello.serious', 'chat.hello.cool', 'chat.close.warm', 'chat.close.neutral', 'chat.deep',
  // alliances and their group chats (lines/alliances.js)
  'group.form.pitch', 'group.form.name', 'group.form.declined', 'group.form.fizzle', 'group.check.open', 'group.check.share', 'group.check.plan', 'alliance.betrayed', 'alliance.betrayed.self', 'group.kick', 'group.confront.out', 'group.confront.stay', 'group.leave',
  // the room takes in a newcomer (lines/arrivals-room.js)
  'arrival.alert', 'arrival.react.crush', 'arrival.react.threat', 'arrival.react.suspicious', 'arrival.react.ally', 'arrival.react.worried', 'welcome.warm', 'welcome.neutral', 'welcome.cold',
  // the suspense before the name (lines/blocking-build.js)
  'hangout.sealed', 'hangout.solo.sealed', 'block.build.open', 'block.build.open.solo', 'block.build.clue.fake', 'block.fear.fake', 'block.build.clue.threat', 'block.fear.threat', 'block.build.clue.grudge', 'block.fear.grudge', 'block.build.clue.noBond', 'block.fear.noBond', 'block.build.clue.offer', 'block.fear.offer', 'block.fear.dots',
  ...INTENTS_.flatMap(i => ['warm', 'neutral', 'cold'].map(e => `chat.${i}.${e}`)),
  ...['pass', 'dodge', 'fail'].map(r => `chat.probe.${r}`),
  ...['warm', 'neutral', 'cold'].map(e => `chat.flirt.act.${e}`),
  ...['schemer', 'sweet', 'romantic', 'wild', 'watcher'].flatMap(g => ['warm', 'neutral', 'cold'].map(e => `aside.${g}.${e}`)),
  ...[...Object.keys(TOPICS), 'hometown', 'fake', 'circle-life', 'single', 'taken', 'complicated'].map(t => `chat.topic.${t}`),
  ...SLIPS_.flatMap(k => [`slip.${k}.noticed`, `slip.${k}.missed`]),
  ...Object.keys(TOPICS).flatMap(t => [`slip.topic.${t}.noticed`, `slip.topic.${t}.missed`]), 'slip.misread', 'slip.leak.noticed', 'slip.leak.missed',
  ...['caps', 'ellipses', 'stage', 'greeting', 'nicknames', 'catchphrase', 'formal', 'hype', 'dry']
    .flatMap(t => [`style.${t}.charmed`, `style.${t}.annoyed`]), 'style.mismatch.suspicious',
  'status.low', 'status.steady', 'status.high', 'status.react', 'likes.most', 'likes.none',
  'recognise.celebrity', 'recognise.villain', 'recognise.tv', 'circle.first', 'circle.open', 'circle.party', 'circle.final', 'circle.theory',
  ...['honest', 'polished', 'edited', 'catfish', 'shared'].map(m => `profile.${m}`),
  'recognise', 'arrival', 'arrival.react', 'afterparty',
  'ratings.open', ...REASONS_.flatMap(r => [`rate.${r}.top`, `rate.${r}.bottom`]),
  'result.bottom', 'result.middle', 'result.top', 'result.influencers', 'result.sole',
  // No alliance on the final night (ratings.js: final -> 0): the winner is who deserves it.
  ...REASONS_.filter(r => r !== 'alliance').map(r => `final.rate.${r}`),
  'hangout.open', ...BLOCK_WHY_.map(r => `hangout.view.${r}.cut`), 'hangout.view.noBond.keep',
  'alert.sole', 'hangout.solo.open', ...BLOCK_WHY_.map(r => `hangout.solo.view.${r}.cut`), 'hangout.solo.view.noBond.keep', 'hangout.solo.decide',
  ...BLOCK_WHY_.map(r => `block.announce.solo.${r}`),
  ...['trio', 'save-first', 'secret', 'super', 'mutual'].map(f => `alert.${f}`), 'ratings.hidden', 'result.secret', 'result.super',
  'save.announce', 'save.react', 'save.passed', 'offer.open', 'offer.yes', 'offer.no', 'offer.betrayed', 'offer.declined',
  'block.announce.secret', 'block.announce.offer', 'block.inperson.walk', 'block.inperson.door', 'block.inperson.tell',
  'hangout.open.trio', 'hangout.trio.agree', 'hangout.trio.outvoted', 'visit.inperson.bye', 'visit.inperson.after',
  ...['save-two', 'plead', 'room-vote', 'forced'].map(f => `alert.${f}`), 'block.announce.unsaved', 'block.announce.vote',
  'block.announce.statement', 'plead.open', 'plead.pitch', 'plead.listen', 'vote.open', 'vote.cast', 'vote.result',
  'statement.open', 'statement.say', 'statement.named', 'save.wait', 'alert.instant', 'alert.double', 'block.announce.instant', 'goodbye.video.close',
  'block.react.numbers', 'block.react.unsaved', 'visit.choose.power', 'visit.talk.power', 'visit.talk2.power',
  ...['immunity', 'hacker', 'joker', 'burner'].map(k => `visit.power.${k}`), ...['immunity', 'joker', 'hacker'].map(k => `power.reveal.${k}`),
  'hack.send', 'hack.read', 'hack.undone', 'joker.chat', 'joker.pick', 'burner.exposed',
  'alert.public-super', 'alert.none', 'block.react.guess', 'noblock.alert', 'noblock.influencer', 'noblock.relief', 'mission.given', 'mission.success',
  'block.announce.mission', 'swap.told', 'swap.back', 'clone.alert', 'clone.plea.old', 'clone.plea.new', 'clone.vote.new', 'clone.vote.old',
  'clone.out', 'alert.most-human', 'rate.human.top', 'rate.human.bottom', 'goodbye.video.ai', 'meet.arrive.ai', 'secondchance.back', 'secondchance.react', 'secondchance.recognize', 'egg.intro', 'egg.vote.first', 'egg.vote.second', 'egg.stays', 'egg.goes', 'rod.partner', 'sacrifice.go', 'sacrifice.kept', 'sacrifice.saved', 'disrupter.alert', 'disrupter.win.immunity', 'disrupter.win.pick', 'disrupter.slow', 'disrupter.pick', 'date.pick', 'date.chat', 'date.gift', 'date.passed', 'invites.first', 'invites.next', 'invites.last',
  'race.win', 'race.lose', 'newparty.throw', 'newparty.guest', 'newparty.left', 'lurk.watch', 'lurk.reveal',
  'chosen.offer', 'chosen.pick', 'chosen.thanks', 'pairarrival.chat', 'alert.antivirus', 'antivirus.open', 'antivirus.pass', 'antivirus.got', 'antivirus.left', 'block.announce.antivirus',
  'hangout.agree', 'hangout.yield', 'hangout.trade', 'hangout.pact',
  ...BLOCK_WHY_.map(r => `block.announce.${r}`), 'block.react.self', 'block.react.friend', 'block.react.rival', 'block.react.relief',
  ...MOTIVES_.flatMap(m => [`visit.choose.${m}`, `visit.talk.${m}`]), 'visit.wait', 'visit.wait.catfish',
  'visit.door.real', 'visit.door.catfish', 'visit.door.caught', 'visit.door.both', 'visit.hand', 'visit.kiss', 'visit.bye', 'report',
  'goodbye.guess', ...['honest', 'polished', 'edited', 'shared'].map(m => `goodbye.video.${m}`),
  ...WHY_.map(w => `goodbye.video.catfish.${w}`), 'goodbye.warning.catfish', 'goodbye.warning.distrusts', 'goodbye.warning.seen',
  'goodbye.react.guilty', 'goodbye.react.warned', 'goodbye.react.vindicated', 'goodbye.react.surprised',
  'meet.arrive.real', 'meet.arrive.catfish', 'meet.found', 'meet.both', ...WHY_.map(w => `meet.explain.${w}`),
  'reveal.place', 'reveal.winner', 'goodbye.shout', ...['first', 'blocking', 'arrival', 'quiet', 'night'].map(t => `host.cold.${t}`), 'host.chat', 'host.status', 'host.circle',
  // Plan 3a: games, parties, apartment life, videos from home.
  'game.open', 'game.statement.agree', 'game.statement.disagree', 'game.statement.lone',
  'game.name.good', 'game.name.bad', 'game.name.funny',
  'game.ask.friendly', 'game.ask.barbed', ...['pass', 'dodge', 'fail'].map(r => `game.ask.catfish.${r}`),
  'game.slip', 'game.make.jab', 'game.make.kind', 'game.make.result', 'game.photo.round',
  // Plan 3a+: every beat of a game (js/ci/game-beats.js).
  'game.first',
  ...['prompt', 'results', 'at', 'surprise', 'conclusion'].map(k => `game.statement.${k}`),
  ...['prompt', 'namer', 'reply.good', 'reply.bad', 'reply.funny', 'hurt', 'proud'].map(k => `game.name.${k}`),
  ...['choose', 'react', 'guess', 'conclusion'].map(k => `game.ask.${k}`),
  ...['submit', 'prompt', 'fact', 'guessed.right', 'guessed.wrong', 'owner', 'conclusion'].map(k => `game.guess.${k}`),
  ...['props', 'plan', 'build.disaster', 'build.ok', 'build.proud', 'timeup', 'upload', 'item', 'comment', 'last', 'tally',
    'whodunit.right', 'whodunit.wrong'].map(k => `game.make.${k}`),
  ...['choose', 'tag', 'winner'].map(k => `game.photo.${k}`),
  ...['captains', 'scout.want', 'scout.pass', 'picks', 'trash', 'question.right', 'question.wrong', 'banter'].map(k => `game.team.${k}`),
  ...['choose', 'thanks', 'noticed'].map(k => `game.gift.${k}`),
  ...['reply', 'react', 'observe'].map(k => `game.rival.${k}`),
  ...['practice', 'answer', 'react', 'vote', 'date'].map(k => `game.flirt.${k}`),
  'game.team.pick', 'game.team.last', 'game.team.result', 'game.gift.round', 'game.gift.none',
  'game.rival.round', 'game.flirt.round', ...['party', 'photo', 'video', 'immunity', 'gift', 'trophy', 'trophy.react'].map(k => `game.prize.${k}`),
  'party.open', 'party.nhie', 'party.nhie.none',
  ...['workout', 'skincare', 'cooking', 'reading', 'singing', 'plushie', 'praying', 'pacing'].map(h => `life.${h}`),
  'home.video', 'host.game', 'host.life', 'shared.argue.faceWins', 'shared.argue.brainWins',
  ...['couple', 'married', 'siblings', 'twins', 'friends', 'cousins'].flatMap(k => [`shared.argue.faceWins.${k}`, `shared.argue.brainWins.${k}`]),
  'shared.argue.parentWins.parent', 'shared.argue.kidWins.parent',
  ...['couple', 'married', 'siblings', 'twins', 'parent', 'friends', 'cousins'].flatMap(k => [`life.pair.${k}`, `meet.explain.shared.${k}`, `goodbye.pair.${k}`]),
  'circle.more', 'circle.react', 'ratings.done', 'ratings.wait', 'final.open', 'final.done', 'block.wait', 'block.typing',
  ...['friend', 'answers', 'truth', 'apology'].map(m => `visit.talk2.${m}`), 'visit.after', 'goodbye.after',
  'meet.first', 'meet.react', 'meet.settle', 'meet.arrive.shared', 'meet.found.shared', 'meet.react.shared', 'meet.explain.shared', 'circle.leave', 'circle.final.look', 'block.after', 'visit.walk', 'visit.sit', 'rate.middle', 'party.dance', 'party.photo', 'party.jealous', 'party.flirt', 'party.banter', 'party.end',
  ...['named-bad', 'named-good', 'rival', 'gift', 'picked-last', 'jab', 'portrait-kind', 'flirted', 'asked-barbed', 'asked-catfish']
    .flatMap(k => [`callback.${k}.mine`, `callback.${k}.theirs`]), 'rate.callback.bad', 'rate.callback.good',
];
