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
const fill = (t, f) => capFirst(String(t).replace(SLOT_RE, (_, k) => f[k] ?? ''));

/** A line whose every slot is fillable, picked by key; the season-wide `used`
 *  set steers away from a line already said this season. */
function pick(bank, key, f, used) {
  const ok = (bank || []).filter(t => slotsOf(t).every(k => has(f, k)));
  if (!ok.length) return '';
  const fresh = used ? ok.filter(t => !used.has(t)) : ok;
  const from = fresh.length ? fresh : ok;
  const line = from[hash(key) % from.length];
  if (used) used.add(line);
  return fill(line, f);
}

const GROUP = { bitter: 'hot', denial: 'hot', gutted: 'hurt', gracious: 'soft', relieved: 'soft', elated: 'soft' };
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];
const word = n => NUM[n] ?? String(n);
const listOf = xs => xs.length <= 1 ? (xs[0] || '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

function votesText(v) {
  if (!v || !v.total) return '';
  if (v.against === v.total) return `${word(v.total)} votes to nothing`;
  return `${word(v.against)} votes to ${word(v.total - v.against)}`;
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
  const g = GROUP[r.mood] || 'soft';
  const guest = ep.guestName || r.guest;
  const pr = ep.pronouns || PRONOUNS.other;
  const base = {
    guest, week: r.week ? String(r.week) : null, votes: votesText(r.votes), with: r.with,
    partner: r.partner, place: L.PLACE[r.placement] || null,
    players: words.players || 'players', player: words.player || 'player', exit: words.exit || 'eliminated',
    sub: pr.sub, obj: pr.obj, pos: pr.pos,
  };
  const exchanges = [];
  const push = (topic, q, a, extra = {}) => { if (q || a) exchanges.push({ topic, q, a, ...extra }); };

  // ── the cold open ──
  const kind = r.kind === 'finalist' && r.placement === 1 ? 'winner' : r.kind;
  let coldOpen = pick(L.COLD[kind] || L.COLD['seen-it-coming'], `${K}|cold`, base, used)
    || `Welcome to Kristal-talKs. ${guest} is here.`;
  if (r.juror && r.kind !== 'finalist') coldOpen += ' ' + pick(L.JUROR, `${K}|jury`, base, used);

  // ── how it ended ──
  const openKind = r.kind in L.OPEN_Q ? r.kind : 'seen-it-coming';
  push('the-exit', pick(L.OPEN_Q[openKind], `${K}|oq`, base, used),
    pick(L.OPEN_A[openKind]?.[g] || L.OPEN_A[openKind]?.soft, `${K}|oa`, base, used));

  // ── the tape ──
  const t = r.truth;
  if ((r.segments || []).includes('the-tape') && t && t.flippers.length) {
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
    const quote = src ? (src.exchanges || []).filter(x => x.who === guest).map(x => x.a).find(Boolean) : null;
    const f = { ...base, x: a.who, quote, week: src?.record?.week ? String(src.record.week) : base.week };
    const q = quote ? pick(L.BACK_Q, `${K}|bq|${i}`, f, used)
      : `${a.who} talked about you on this show while you were still in there. You’ve heard it now.`;
    push('the-response', q, pick(L.BACK_A[a.stance]?.[g] || L.BACK_A[a.stance]?.soft, `${K}|ba|${i}`, f, used), { who: a.who });
    backTo.add(a.who);
  }

  // ── the people they name ──
  const tapeWho = new Set(t && (r.segments || []).includes('the-tape') ? t.flippers : []);
  const named = (r.named || []).filter(n => !backTo.has(n.who))
    .sort((a, b) => (ORDER[a.stance] ?? 9) - (ORDER[b.stance] ?? 9) || b.heat - a.heat);
  const room = ep.tier === 'viral' ? 4 : ep.tier === 'solid' ? 3 : 2;
  for (const [i, n] of named.slice(0, room).entries()) {
    // The tape already put a flipper's name in the room: blame becomes the follow-up.
    const f = { ...base, x: n.who };
    const q = tapeWho.has(n.who) && n.stance === 'blame'
      ? `And now that you know it was ${n.who}?` : pick(L.NAMED_Q[n.stance], `${K}|nq|${i}`, f, used);
    push('named', q, pick(L.NAMED_A[n.stance]?.[g] || L.NAMED_A[n.stance]?.soft
      || L.NAMED_A[n.stance]?.hot, `${K}|na|${i}`, f, used), { who: n.who, stance: n.stance });
  }

  // ── the rotating segments ──
  const still = r.stillIn || [];
  const order = still.slice().sort((a, b) => hash(`${K}|o|${a}`) - hash(`${K}|o|${b}`));
  for (const seg of r.segments || []) {
    if (seg === 'fan-mail') {
      push('fan-mail', pick(L.FAN_Q[r.reception] || L.FAN_Q.mixed, `${K}|fq`, base, used),
        pick(L.FAN_A[g], `${K}|fa`, base, used));
    } else if (seg === 'rank-them' && still.length >= 3) {
      const top = [r.prediction, ...order].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 3);
      const f = { ...base, a: top[0], b: top[1], c: top[2] };
      push('rank-them', pick(L.RANK_Q, `${K}|rq`, f, used), pick(L.RANK_A, `${K}|ra`, f, used), { who: top[0] });
    } else if (seg === 'message-in') {
      const x = (r.partner && still.includes(r.partner) ? r.partner : null)
        || (r.named || []).find(n => n.still && POSITIVE.has(n.stance))?.who
        || (r.allies || []).find(a => still.includes(a));
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
      push('who-next', pick(L.NEXT_Q, `${K}|xq`, f, used), pick(L.NEXT_A[g], `${K}|xa`, f, used), { who: x });
    }
  }

  // ── who wins ──
  if (r.prediction && r.kind !== 'finalist') {
    const f = { ...base, x: r.prediction };
    push('the-prediction', pick(L.PREDICT_Q, `${K}|pq`, f, used), pick(L.PREDICT_A[g], `${K}|pa`, f, used), { who: r.prediction });
  }

  // ── rapid fire: a few names ──
  const rapid = [];
  const friend = (r.named || []).find(n => POSITIVE.has(n.stance))?.who || (r.allies || [])[0];
  const foe = (r.named || []).find(n => !POSITIVE.has(n.stance))?.who || (r.rivals || [])[0];
  if (friend) rapid.push({ q: 'Best friend in there?', a: `${friend}.` });
  if (foe && foe !== friend) rapid.push({ q: 'Least trusted?', a: `${foe}.` });
  if (r.kind !== 'finalist') rapid.push({ q: 'Would you go back?', a: g === 'hot' ? 'Tomorrow. I have unfinished business.' : g === 'hurt' ? 'Not yet. Ask me in a year.' : 'In a heartbeat.' });

  const outro = pick(L.CLOSE[r.mood] || L.CLOSE.gracious, `${K}|close`, base, used);
  const hook = (r.named || []).slice().sort((a, b) => b.heat - a.heat)[0]?.who || null;
  return { coldOpen, exchanges, rapid, outro, hook };
}
