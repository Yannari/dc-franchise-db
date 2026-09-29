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

export const ROLES = ['a', 'b', 'c', 'host'];
export const FACT_KEYS = ['intent', 'ending', 'result', 'known', 'early', 'late', 'catfish', 'outed',
  'suspects', 'theory', 'pact', 'friends', 'rivals', 'flirty', 'newcomer', 'mood', 'group', 'style',
  'hurt', 'influencer', 'reason', 'motive', 'mode', 'reasonKind', 'band', 'kiss', 'claim', 'lie',
  'tone', 'party', 'final', 'slip', 'noticed', 'place', 'self'];

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
  const d = scene.data || {};
  for (const k of ['intent', 'ending', 'reason', 'motive', 'mode', 'kiss', 'tone', 'party', 'final']) {
    if (d[k] !== undefined && d[k] !== null) f[k] = d[k];
  }
  return f;
}

function matches(when = {}, facts) {
  return Object.entries(when).every(([k, v]) => (Array.isArray(v) ? v.includes(facts[k]) : facts[k] === v));
}

const usage = state => (state.usedLines ||= { uses: {}, pairs: {} });

export function pickEntry(state, key, facts, pairKey, rng) {
  const pool = POOLS[key];
  if (!pool?.length) return null;
  const u = usage(state);
  const fits = pool.filter(e => matches(e.when, facts));
  const scored = fits.map(e => {
    const spec = Object.keys(e.when || {}).length;
    const uses = u.uses[e.id] || 0;
    const samePair = (u.pairs[e.id] || []).includes(pairKey);
    return [e, samePair ? 0 : (1 + spec) * Math.pow(0.5, uses)];
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
    const a = s.data.posts?.[0]?.by || s.who[0];
    const key = s.data.final ? 'circle.final' : s.data.party ? 'circle.party' : 'circle.open';
    return [{ key, cast: { a } },
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
    for (const v of (s.data.views || []).slice(0, 5)) {
      const cut = v.handle === s.data.target;
      const reason = cut ? s.data.reason : 'noBond';
      out.push({ key: `hangout.view.${reason}.${cut ? 'cut' : 'keep'}`, cast: { a, b, c: v.handle }, extra: { reason } });
    }
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
    out.push({ key: `visit.door.${state.profiles[h].mode === 'catfish' ? 'catfish' : 'real'}`, cast: { a: to, b: h } });
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
    if (s.data.warning) out.push({ key: `goodbye.warning.${s.data.warning.kind}`, cast: { a: h, c: s.data.warning.about } });
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
    const p = state.profiles[a];
    const out = [{ key: `meet.arrive.${p.mode === 'catfish' ? 'catfish' : 'real'}`, cast: { a, b: present.at(-1) } }];
    if (p.mode === 'catfish') out.push({ key: `meet.explain.${p.reason || 'strategic'}`, cast: { a, b: present.at(-1) }, extra: { reasonKind: p.reason || undefined } });
    return out;
  },
  reveal(state, s) {
    const pl = s.data.placements;
    return [...pl.slice(1).reverse().map(x => ({ key: 'reveal.place', cast: { a: x.profile }, extra: { place: PLACE_WORDS[x.place - 1] } })),
      { key: 'reveal.winner', cast: { a: pl[0].profile } }];
  },
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
  const entry = pickEntry(state, 'host.cold', { tone, early: day <= 2 }, `day${day}`, rng);
  if (entry) aired[0].script.blocks.unshift({ key: 'host.cold', ...renderEntry(state, entry, { a: aired[0].who[0] }, rng) });
}
