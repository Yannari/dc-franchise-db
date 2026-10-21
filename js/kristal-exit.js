// Kristal-talKs exit interviews: the words, from the simulator's decisions.
//
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
// Decisions: js/exit-interview/core.js (published on the season row as
// `exitInterviews`). Lines: js/kristal-exit-lines.js.
//
// Pure text. The record already says what kind of exit it was, how the guest
// is taking it, who they name and how, the segments, the winner they predict
// and how the hour landed; this file only says it out loud. Nothing here
// touches a listener count or a follower.

import * as L from './kristal-exit-lines.js';

function hash(key) {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const SLOT_RE = /\{(\w+)\}/g;
const slotsOf = t => [...String(t).matchAll(SLOT_RE)].map(m => m[1]);
const has = (f, k) => f[k] !== undefined && f[k] !== null && f[k] !== '';
const capFirst = s => s.replace(/(^|[.?!]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
const fill = (t, f) => capFirst(String(t).replace(/^\[J\]/, '').replace(SLOT_RE, (_, k) => f[k] ?? ''));

/** A line whose every slot is fillable, picked by key; the season-wide `used`
 *  set steers away from a line already said this season. */
function pick(bank, key, f, used, mine = used?.mine || null) {
  // "[J]" lines are a juror's: somebody with no jury vote cannot bet theirs.
  const ok = (bank || []).filter(t => slotsOf(t).every(k => has(f, k)) && (!t.startsWith('[J]') || f.juror));
  if (!ok.length) return '';
  // Never twice in one hour; then, as far as the bank allows, never twice in a season.
  const notMine = mine ? ok.filter(t => !mine.has(t)) : ok;
  const fresh = used ? notMine.filter(t => !used.has(t)) : notMine;
  const from = fresh.length ? fresh : notMine.length ? notMine : ok;
  const line = from[hash(key) % from.length];
  if (used) used.add(line);
  if (mine && mine !== used?.mine) mine.add(line);
  return fill(line, f);
}

const GROUP = { bitter: 'hot', denial: 'hot', gutted: 'hurt', gracious: 'soft', relieved: 'soft', elated: 'soft' };
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];
const word = n => NUM[n] ?? String(n);
const listOf = xs => xs.length <= 1 ? (xs[0] || '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

function votesText(v) {
  if (!v || !v.total) return '';
  // The final four is one vote, cast by one person.
  if (v.total === 1) return 'a single vote';
  if (v.against * 2 === v.total) return `a ${word(v.against)}-${word(v.against)} tie`;
  if (v.against === v.total) return `${word(v.total)} votes to nothing`;
  // Out on a minority — an idol cancelled the rest, or the room split three ways.
  if (v.against * 2 < v.total) return `just ${word(v.against)} vote${v.against === 1 ? '' : 's'} out of ${word(v.total)}`;
  return `${word(v.against)} vote${v.against === 1 ? '' : 's'} to ${word(v.total - v.against)}`;
}

const PRONOUNS = {
  male: { sub: 'he', obj: 'him', pos: 'his' },
  female: { sub: 'she', obj: 'her', pos: 'her' },
  other: { sub: 'they', obj: 'them', pos: 'their' },
};
export function pronounsFor(gender) {
  const g = String(gender || '').toLowerCase();
  return g === 'm' || g === 'male' ? PRONOUNS.male : g === 'f' || g === 'female' ? PRONOUNS.female : PRONOUNS.other;
}

const POSITIVE = new Set(['praise', 'miss', 'respect']);

/** Where the game is played, per show: the room as a crowd, and being in it. */
const PLACE = {
  'big-brother': { crowd: 'the house', inside: 'in that house', exitNoun: 'eviction' },
  'total-drama': { crowd: 'camp', inside: 'at camp', exitNoun: 'boot' },
  traitors: { crowd: 'the castle', inside: 'in that castle', exitNoun: 'banishment' },
  'perfect-match': { crowd: 'the villa', inside: 'in that villa', exitNoun: 'dumping' },
  'drag-race': { crowd: 'the werk room', inside: 'in that werk room', exitNoun: 'elimination' },
  'the-circle': { crowd: 'the Circle', inside: 'in the Circle', exitNoun: 'blocking' },
  'the-challenge': { crowd: 'the house', inside: 'in that house', exitNoun: 'elimination' },
  'ridonculous-race': { crowd: 'the race', inside: 'in that race', exitNoun: 'elimination' },
};
const ORDER = { blame: 0, drag: 1, warn: 2, respect: 3, praise: 4, miss: 5 };

/**
 * One exit interview, written.
 * `ep.record` is the published decision; `ep.guestName`, `ep.pronouns`.
 * `earlier` is this season's exit episodes already written, oldest first —
 * the clip an answer-back plays is the line actually said about this guest.
 * `used` is a season-wide set of lines already spoken.
 */
export function composeExit(ep, { words = {}, earlier = [], salt = '', used = null } = {}) {
  const r = ep.record || {};
  const K = salt ? `${ep.id}~${salt}` : ep.id;
  const mine = new Set();
  const seasonUsed = used;
  used = { has: t => !!seasonUsed?.has(t), add: t => { seasonUsed?.add(t); mine.add(t); }, mine };
  const g = GROUP[r.mood] || 'soft';
  const guest = ep.guestName || r.guest;
  const pr = ep.pronouns || PRONOUNS.other;
  const fmt = ep.season?.format || r.show || 'big-brother';
  const place = PLACE[fmt] || PLACE['big-brother'];
  // Shared lines, then this show's own (L.SHOW) on top.
  const S = L.SHOW?.[fmt] || {};
  const B = (name, ...path) => {
    let a = L[name], b = S[name];
    for (const k of path) { a = a?.[k]; b = b?.[k]; }
    return [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
  };
  const round = String(words.round || 'Week').toLowerCase();
  const base = {
    guest, week: r.week ? String(r.week) : null, when: r.week ? `${round} ${r.week}` : null,
    crowd: place.crowd, inside: place.inside, exitNoun: place.exitNoun, juror: r.juror ? 'yes' : null,
    votes: votesText(r.votes), with: r.with,
    partner: r.partner, place: L.PLACE[r.placement] || null,
    players: words.players || 'players', player: words.player || 'player', exit: words.exit || 'eliminated',
    sub: pr.sub, obj: pr.obj, pos: pr.pos,
  };
  const exchanges = [];
  const push = (topic, q, a, extra = {}) => { if (q || a) exchanges.push({ topic, q, a, ...extra }); };

  // ── the cold open ──
  const kind = r.kind === 'finalist' && r.placement === 1 ? 'winner' : r.kind;
  let coldOpen = pick(B('COLD', kind).length ? B('COLD', kind) : B('COLD', 'seen-it-coming'), `${K}|cold`, base, used)
    || `Welcome to Kristal-talKs. ${guest} is here.`;
  if (r.juror && r.kind !== 'finalist') coldOpen += ' ' + pick(L.JUROR, `${K}|jury`, base, used);

  // ── how it ended ──
  const openKind = B('OPEN_Q', r.kind).length ? r.kind : 'seen-it-coming';
  const oa = B('OPEN_A', openKind, g).length ? B('OPEN_A', openKind, g) : B('OPEN_A', openKind, 'soft');
  push('the-exit', pick(B('OPEN_Q', openKind), `${K}|oq`, base, used), pick(oa, `${K}|oa`, base, used));

  // ── the people they name, written once and placed below ──
  const t = r.truth;
  const tapeOn = (r.segments || []).includes('the-tape') && t && t.flippers.length;
  let blamed = 0;
  const flipped = new Set(tapeOn ? t.flippers : []);
  const namedLine = (n, i, afterTape = false) => {
    const f = { ...base, x: n.who };
    // One person is THE one; anyone else blamed is "who else", and a friend
    // the tape just exposed is asked about as that.
    const second = n.stance === 'blame' && !(afterTape && flipped.has(n.who)) && blamed++ > 0;
    const q = afterTape && flipped.has(n.who) ? pick(L.AFTER_TAPE_Q, `${K}|aq|${i}`, f, used)
      : second ? pick(L.BLAME2_Q, `${K}|b2q|${i}`, f, used)
        : pick(L.NAMED_Q[n.stance], `${K}|nq|${i}`, f, used);
    const exposed = afterTape && flipped.has(n.who) && n.stance === 'blame';
    const lines = exposed ? (L.AFTER_TAPE_A[g] || [])
      : second ? (L.BLAME2_A[g] || [])
      : [...(L.NAMED_A[n.stance]?.[g] || []), ...(n.still ? (L.NAMED_IN[n.stance]?.[g] || []) : [])];
    return ['named', q, pick(lines.length ? lines : (L.NAMED_A[n.stance]?.soft || []), `${K}|na|${i}`, f, used),
      { who: n.who, stance: n.stance }];
  };
  // When the tape plays, they get to name their suspect first — Kristal can
  // only say "you said X" after they have said it.
  const suspectBeat = tapeOn && t.suspected.length
    ? (r.named || []).find(n => n.who === t.suspected[0]) : null;
  if (suspectBeat) push(...namedLine(suspectBeat, 's'));

  // ── the tape ──
  if (tapeOn) {
    const which = !t.suspected.length ? 'nosuspect' : t.right ? 'right' : 'wrong';
    const f = { ...base, flippers: listOf(t.flippers), suspect: t.suspected[0] };
    push('the-tape', pick(L.TAPE_Q[which], `${K}|tq`, f, used),
      pick(L.TAPE_A[which]?.[g] || L.TAPE_A[which]?.soft, `${K}|ta`, f, used),
      { who: t.flippers[0], receipt: { type: 'the votes', statement: `${listOf(t.flippers)} voted ${guest} out.` } });
  }

  // ── answering back ──
  const backTo = new Set();
  for (const [i, a] of (r.answerBack || []).entries()) {
    const src = earlier.find(e => e.record?.id === a.id);
    // What they said ABOUT this guest when asked about them, before any other line naming them.
    const about = (src?.exchanges || []).filter(x => x.who === guest && x.a && x.topic === 'named');
    const quote = about[0]?.a || null;
    const w = src?.record?.week;
    const f = { ...base, x: a.who, quote, week: w ? String(w) : base.week, when: w ? `${round} ${w}` : base.when };
    const q = quote ? pick(L.BACK_Q, `${K}|bq|${i}`, f, used)
      : `${a.who} talked about you on this show while you were still in there. You’ve heard it now.`;
    // Answered by what was SAID about them; the response stance is the effect.
    const said = L.BACK_A[a.was] || L.BACK_A[a.stance];
    push('the-response', q, pick(said?.[g] || said?.soft, `${K}|ba|${i}`, f, used), { who: a.who });
    backTo.add(a.who);
  }

  // ── the people they name ──
  const named = (r.named || []).filter(n => !backTo.has(n.who) && n !== suspectBeat)
    .sort((a, b) => (ORDER[a.stance] ?? 9) - (ORDER[b.stance] ?? 9) || b.heat - a.heat);
  // Everyone the simulator decided they named is named on air: a later guest
  // answers that line, and the bond it moved was moved by something said.
  const room = named.length;
  // A friend the tape exposed comes first after it; then the loudest.
  const ordered = [...named.filter(n => flipped.has(n.who)), ...named.filter(n => !flipped.has(n.who))];
  for (const [i, n] of ordered.slice(0, Math.max(1, room)).entries()) push(...namedLine(n, i, tapeOn));

  // ── the rotating segments ──
  const still = r.stillIn || [];
  const order = still.slice().sort((a, b) => hash(`${K}|o|${a}`) - hash(`${K}|o|${b}`));
  for (const seg of r.segments || []) {
    if (seg === 'fan-mail') {
      const rc = L.FAN_Q[r.reception] ? r.reception : 'mixed';
      push('fan-mail', pick(B('FAN_Q', rc), `${K}|fq`, base, used), pick(L.FAN_A[rc][g], `${K}|fa`, base, used));
    } else if (seg === 'rank-them' && still.length >= 3) {
      const top = [r.prediction, ...order].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 3);
      const f = { ...base, a: top[0], b: top[1], c: top[2] };
      push('rank-them', pick(L.RANK_Q, `${K}|rq`, f, used), pick(L.RANK_A, `${K}|ra`, f, used), { who: top[0] });
    } else if (seg === 'message-in') {
      const x = (r.partner && still.includes(r.partner) && !flipped.has(r.partner) ? r.partner : null)
        || (r.named || []).find(n => n.still && POSITIVE.has(n.stance) && !flipped.has(n.who))?.who
        || (r.allies || []).find(a => still.includes(a) && !flipped.has(a));
      if (!x) continue;
      const f = { ...base, x };
      push('message-in', pick(L.MESSAGE_Q, `${K}|mq`, f, used), pick(L.MESSAGE_A[g], `${K}|ma`, f, used), { who: x });
    } else if (seg === 'caller' && r.caller) {
      const stance = (r.answerBack || []).find(a => a.who === r.caller)?.was
        || (r.named || []).find(n => n.who === r.caller)?.stance;
      const tone = stance && !POSITIVE.has(stance) ? 'cold' : 'warm';
      const f = { ...base, caller: r.caller };
      push('caller', pick(L.CALLER_IN, `${K}|ci`, f, used), pick(L.CALLER_SAY[tone], `${K}|cs`, f, used),
        { speaker: r.caller, reply: pick(L.CALLER_REPLY[tone], `${K}|cr`, f, used), who: r.caller });
    } else if (seg === 'who-next' && still.length >= 2) {
      const x = (r.rivals || []).find(n => still.includes(n)) || order.find(n => n !== r.prediction);
      if (!x) continue;
      const f = { ...base, x };
      push('who-next', pick(B('NEXT_Q'), `${K}|xq`, f, used), pick(L.NEXT_A[g], `${K}|xa`, f, used), { who: x });
    }
  }

  // ── who wins ──
  if (r.prediction && r.kind !== 'finalist') {
    const f = { ...base, x: r.prediction };
    push('the-prediction', pick(L.PREDICT_Q, `${K}|pq`, f, used), pick(L.PREDICT_A[g], `${K}|pa`, f, used), { who: r.prediction });
  }

  // ── rapid fire: a few names ──
  const rapid = [];
  const friend = (r.named || []).find(n => POSITIVE.has(n.stance) && !flipped.has(n.who))?.who
    || (r.allies || []).find(a => !flipped.has(a));
  const foe = (r.named || []).find(n => !POSITIVE.has(n.stance))?.who || (r.rivals || [])[0];
  if (friend) rapid.push({ q: 'Best friend in there?', a: `${friend}.` });
  if (foe && foe !== friend) rapid.push({ q: 'Least trusted?', a: `${foe}.` });
  if (r.kind !== 'finalist') rapid.push({ q: 'Would you go back?', a: g === 'hot' ? 'Tomorrow. I have unfinished business.' : g === 'hurt' ? 'Not yet. Ask me in a year.' : 'In a heartbeat.' });

  const outro = pick(L.CLOSE[r.mood] || L.CLOSE.gracious, `${K}|close`, base, used);
  const hook = (r.named || []).slice().sort((a, b) => b.heat - a.heat)[0]?.who || null;
  return { coldOpen, exchanges, rapid, outro, hook };
}
