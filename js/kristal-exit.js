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
import { pmExchanges } from './kristal-exit-pm.js';
import { seasonId, familyOf } from './shows.js';

function hash(key) {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * The key an in-season exit interview is written from: the episode id, and the
 * remix count when the reader has re-rolled that season's words (js/kristal.js
 * passes proseSalts[`${seasonId}:live`]). Every name the interview picks by
 * hash comes off this key, so anything quoting the interview must use it too.
 */
export function exitEpisodeKey(seasonId, rec, salt = '') {
  const id = `kt-${seasonId}-x-${rec?.id}`;
  return salt ? `${id}~${salt}` : id;
}

/**
 * The two names an exit interview puts on the record: who the guest says goes
 * NEXT (the who-next segment, when the episode has one) and who they say WINS
 * (the closing prediction, never asked of a finalist). composeExit writes its
 * answers from exactly these, so a page quoting the interview -- On Air, the
 * ticker -- says what the guest actually said. `prediction` on the record is
 * the WINNER pick; reading it as "who goes next" put words in Sabrina's mouth.
 */
export function exitPicks(rec, key) {
  const r = rec || {};
  const still = r.stillIn || [];
  const order = still.slice().sort((a, b) => hash(`${key}|o|${a}`) - hash(`${key}|o|${b}`));
  // Never somebody they just praised: Skye called Ayesha "my person" and then
  // named Ayesha as next in trouble, in the same hour.
  const warm = warmOf(r);
  const next = (r.segments || []).includes('who-next') && still.length >= 2
    ? (r.rivals || []).find(n => still.includes(n) && !warm.has(n))
      || order.find(n => n !== r.prediction && !warm.has(n)) || null
    : null;
  const winner = r.prediction && r.kind !== 'finalist' ? r.prediction : null;
  return { next, winner, order };
}

/**
 * Who the guest is warm to, from the record: anyone they name kindly (praise,
 * respect, missing them), their allies and their partner. Every answer in the
 * hour has to agree with this -- the interview is one person talking.
 */
export function warmOf(r) {
  return new Set([...(r?.named || []).filter(n => POSITIVE.has(n.stance)).map(n => n.who),
    ...(r?.allies || []), r?.partner].filter(Boolean));
}

/** The remix counts kristal.html keeps in this browser (its SALT_KEY). */
export const REMIX_KEY = 'kt_remix';
export function remixSalts(storage = globalThis.localStorage) {
  try { return JSON.parse(storage?.getItem(REMIX_KEY) || '{}') || {}; } catch { return {}; }
}

/**
 * What an airing season's exit interview says, for a page quoting it: the same
 * key the Kristal-talKs page writes it from, this browser's remix included.
 */
export function picksForExit(format, seasonNumber, rec, salts = remixSalts()) {
  const sid = seasonId(format, seasonNumber);
  return exitPicks(rec, exitEpisodeKey(sid, rec, salts[`${sid}:live`] || ''));
}

/**
 * A link that opens this exit interview on kristal.html, not just the podcast.
 * `in` names the season by its id, NOT `?show=`: that parameter is the site's
 * show switcher, and a link carrying it changed the reader's filter everywhere.
 */
export function exitInterviewHref(format, seasonNumber, rec) {
  return `kristal.html?exit=${encodeURIComponent(rec?.id || '')}&in=${encodeURIComponent(seasonId(format, seasonNumber))}`;
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
  'secret-story': { crowd: 'the house', inside: 'in the House of Secrets', exitNoun: 'elimination' },
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
  // A spin-off (Drag Race All Stars) is interviewed in its family's words.
  const place = PLACE[fmt] || PLACE[familyOf(fmt)] || PLACE['big-brother'];
  // Shared lines, then this show's own (L.SHOW) on top.
  const S = L.SHOW?.[fmt] || L.SHOW?.[familyOf(fmt)] || {};
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
  // A question every line of which needs a fact this exit lacks (a showmance
  // exit with no partner on the record) is asked the general way, not blank.
  // A Perfect Match islander is asked about their own story (kristal-exit-pm.js):
  // their couple, their ex, the night it happened to them, their fight, their
  // friend. The general opener's question and answer were drawn apart ("Did you
  // see it coming?" / "I was the realest person in that villa").
  const story = fmt === 'perfect-match' && r.story ? pmExchanges(r, { g, base, K, used, pick }) : [];
  if (story.length) for (const [topic, q, a, extra] of story) push(topic, q, a, extra);
  else {
    const oq = pick(B('OPEN_Q', openKind), `${K}|oq`, base, used)
      || pick(['How are you feeling, now it’s over?', 'How are you, honestly, after that?'], `${K}|oq2`, base, used);
    const oaLine = pick(oa, `${K}|oa`, base, used)
      || pick(B('OPEN_A', 'seen-it-coming', g).length ? B('OPEN_A', 'seen-it-coming', g) : B('OPEN_A', 'seen-it-coming', 'soft'), `${K}|oa2`, base, used);
    push('the-exit', oq, oaLine);
  }

  // ── the people they name, written once and placed below ──
  const t = r.truth;
  const tapeOn = (r.segments || []).includes('the-tape') && t && t.flippers.length;
  let blamed = 0;
  const flipped = new Set(tapeOn ? t.flippers : []);
  // ── one person talking for an hour ──
  // Questions and answers were drawn from pools independently, so the hour
  // could contradict itself: an open "Who was the hardest person to live
  // with?" answered "Angelica is not who you think", Blair calling Theo "the
  // only nice thing I'll say about anybody today" after praising Malik, and
  // Sabrina picking Kyle to win "not because Kyle deserves it" after calling
  // him the only honest person in there.
  const warm = warmOf(r);
  const praised = (r.named || []).filter(n => POSITIVE.has(n.stance)).length;
  // "the only one", "everyone else was playing a part": true of ONE person.
  const ONLY = /\bonly (honest )?(one|person|nice thing)\b|\bthe one person\b|\beveryone else\b|\bjust \{x\}|\bnobody else\b/i;
  // An answer to "Who…?" opens on the name, or on the few words that lead
  // straight into it. "I want Bo to know I'm not mad" names Bo early and still
  // does not answer "Who do you wish had come with you?".
  const OPENS_ON_X = /^(\[J\])?((Just|It was|Probably|And|Put it on|Honestly,|I’d trust|I respect|I lived with|I never fully trusted|I’d keep an eye on|Watch) )?\{x\}/;
  // "Bo, I love you, win the thing" talks TO Bo -- a message, not an answer.
  const leadsWithX = t => OPENS_ON_X.test(t) && !/^\{x\}, (I|you)\b/.test(t);
  // "{x}. The one…" / "Just {x}." is the shape of an answer to "Who…?". Asked
  // "Tell me about Malik", nobody answers "Malik."
  const WHO_FORM = /^(\[J\])?(Just )?\{x\}[.,]/;
  const namedLine = (n, i, afterTape = false) => {
    const f = { ...base, x: n.who };
    // One person is THE one; anyone else blamed is "who else", and a friend
    // the tape just exposed is asked about as that.
    const second = n.stance === 'blame' && !(afterTape && flipped.has(n.who)) && blamed++ > 0;
    // "Who are you rooting for now?" is a question about somebody still playing.
    const asks = (L.NAMED_Q[n.stance] || []).filter(t => n.still || !/\brooting for now\b/i.test(t));
    const q = afterTape && flipped.has(n.who) ? pick(L.AFTER_TAPE_Q, `${K}|aq|${i}`, f, used)
      : second ? pick(L.BLAME2_Q, `${K}|b2q|${i}`, f, used)
        : pick(asks, `${K}|nq|${i}`, f, used);
    // An open question ("Who…?", "Is there anyone…?") is answered with the
    // name, about what happened -- not a forecast that never says who.
    const open = /^(who|whose)\b/i.test(q) || /\banyone\b/i.test(q);
    const forward = /\brooting for now\b/i.test(q);
    const exposed = afterTape && flipped.has(n.who) && n.stance === 'blame';
    let lines = exposed ? (L.AFTER_TAPE_A[g] || [])
      : second ? (L.BLAME2_A[g] || [])
      // "Who are you rooting for now?" is answered with a hope, not a memory.
      : forward && n.still ? [...(L.NAMED_IN[n.stance]?.[g] || []), ...(L.NAMED_IN[n.stance]?.soft || [])]
      : [...(L.NAMED_A[n.stance]?.[g] || []), ...(n.still && !open ? (L.NAMED_IN[n.stance]?.[g] || []) : [])];
    // Each rule narrows the bank; a rule that would empty it is skipped, and a
    // bank narrowed below three borrows the stance's calmer lines (same rules)
    // rather than saying the one survivor in every interview.
    const rules = [
      open && !exposed ? leadsWithX : t => !WHO_FORM.test(t),
      t => praised <= 1 || !ONLY.test(t),
      // Sabrina left in week one: "I lived with Angelica for weeks" is not hers to say.
      t => (Number(r.week) || 0) >= 3 || !/\bweeks\b/i.test(t),
    ];
    const narrow = list => rules.reduce((acc, ok) => (acc.filter(ok).length ? acc.filter(ok) : acc), list);
    const own = narrow(lines);
    const strict = own.filter(t => rules.every(ok => ok(t)));
    if (strict.length < 3 && !exposed && !second && !forward && g !== 'soft') {
      const calmer = (L.NAMED_A[n.stance]?.soft || []).filter(t => !lines.includes(t));
      lines = narrow([...lines, ...calmer]);
    } else lines = own;
    return ['named', q, pick(lines, `${K}|na|${i}`, f, used),
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
  const picks = exitPicks(r, K);
  const order = picks.order;
  for (const seg of r.segments || []) {
    if (seg === 'fan-mail') {
      const rc = L.FAN_Q[r.reception] ? r.reception : 'mixed';
      const fq = pick(B('FAN_Q', rc), `${K}|fq`, base, used);
      // A listener's question gets that question's answer (FAN_FIT); the
      // general reactions answer only a comment read out, never a question.
      const fit = L.FAN_FIT.find(x => x.when.test(fq));
      const days = t => (Number(r.week) || 0) >= 4 || !/\bday thirty\b/i.test(t);
      const fa = fit ? (fit.a[g] || fit.a.soft) : (L.FAN_A[rc][g] || []).filter(t => !L.FAN_SPECIFIC.test(t) && days(t));
      push('fan-mail', fq, pick(fa.length ? fa : L.FAN_A[rc].soft, `${K}|fa`, base, used));
    } else if (seg === 'rank-them' && still.length >= 3) {
      const top = [r.prediction, ...order].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 3);
      const f = { ...base, a: top[0], b: top[1], c: top[2] };
      // "Three: {c}, and that's being generous" is a dig, never at a friend.
      const ranks = warm.has(top[2]) ? L.RANK_A.filter(t => !/\bgenerous\b/.test(t)) : L.RANK_A;
      push('rank-them', pick(L.RANK_Q, `${K}|rq`, f, used), pick(ranks, `${K}|ra`, f, used), { who: top[0] });
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
      const x = picks.next;
      if (!x) continue;
      const f = { ...base, x };
      // "{x}, if there is any justice" is for a rival. Anyone else is a read
      // of the numbers, said like one.
      const rival = (r.rivals || []).includes(x) || (r.named || []).some(n => n.who === x && !POSITIVE.has(n.stance));
      push('who-next', pick(B('NEXT_Q'), `${K}|xq`, f, used), pick(L.NEXT_A[rival ? g : 'soft'], `${K}|xa`, f, used), { who: x });
    }
  }

  // ── who wins ──
  if (picks.winner) {
    const f = { ...base, x: picks.winner };
    // The tone follows how they feel about the person: "and I hate saying
    // it" is about somebody they cannot stand, never a friend they praised.
    const GRUDGING = /hate saying|not because .* deserves/i;
    const FOND = /happy for|rooting for|I want it to be/i;
    const relation = warm.has(picks.winner) ? 'warm'
      : (r.rivals || []).includes(picks.winner) || (r.named || []).some(n => n.who === picks.winner && !POSITIVE.has(n.stance)) ? 'cold' : 'neutral';
    const all = [...(L.PREDICT_A[g] || []), ...(L.PREDICT_A.soft || [])].filter((t, i, a) => a.indexOf(t) === i);
    const fits = relation === 'warm' ? all.filter(t => !GRUDGING.test(t))
      : relation === 'cold' ? (L.PREDICT_A[g] || []).filter(t => !FOND.test(t))
        : (L.PREDICT_A[g] || []).filter(t => !GRUDGING.test(t) && !FOND.test(t));
    const bank = fits.length ? fits : all.filter(t => !GRUDGING.test(t) && !FOND.test(t));
    push('the-prediction', pick(L.PREDICT_Q, `${K}|pq`, f, used), pick(bank, `${K}|pa`, f, used), { who: picks.winner });
  }

  // ── rapid fire: a few names ──
  const rapid = [];
  const friend = (r.named || []).find(n => POSITIVE.has(n.stance) && !flipped.has(n.who))?.who
    || (r.allies || []).find(a => !flipped.has(a));
  const foe = (r.named || []).find(n => !POSITIVE.has(n.stance))?.who || (r.rivals || [])[0];
  if (friend && !exchanges.some(x => x.topic === 'pm-friend')) rapid.push({ q: 'Best friend in there?', a: `${friend}.` });
  if (foe && foe !== friend) rapid.push({ q: 'Least trusted?', a: `${foe}.` });
  if (r.kind !== 'finalist') rapid.push({ q: 'Would you go back?', a: g === 'hot' ? 'Tomorrow. I have unfinished business.' : g === 'hurt' ? 'Not yet. Ask me in a year.' : 'In a heartbeat.' });

  const outro = pick(L.CLOSE[r.mood] || L.CLOSE.gracious, `${K}|close`, base, used);
  const hook = (r.named || []).slice().sort((a, b) => b.heat - a.heat)[0]?.who || null;
  return { coldOpen, exchanges, rapid, outro, hook };
}

/**
 * What the hour did to the guest, read off the record the simulator decided.
 *
 * The general podcast's aftermath (kristal-voice.js podcastAftermath) scores answers by `behavior` and `press`,
 * which only its own composer writes, so every exit interview came out "mixed", "0/10", "account debated" (the
 * user, 2026-10-29: "whats the point of this mark being there if theyre always the same"). An exit has its own
 * facts: whether the tape proved their suspect right, who they blamed and whether that person really flipped,
 * how they took it, how the audience took them, and how loud they were about people still playing.
 */
export function exitAftermath(ep) {
  const r = ep.record || {};
  const t = r.truth || null;
  const flippers = new Set(t?.flippers || []);
  const named = r.named || [];
  const taped = !!(t && flippers.size && (r.segments || []).includes('the-tape'));
  const suspect = t?.suspected?.[0] || null;
  const blamedSuspect = named.some(n => n.who === suspect && (n.stance === 'blame' || n.stance === 'drag'));
  const blames = named.filter(n => n.stance === 'blame' || n.stance === 'drag');
  const kind = named.filter(n => POSITIVE.has(n.stance)).length;
  const MOOD = { gracious: 2, relieved: 1, elated: 1, gutted: 0, bitter: -1, denial: -2 };

  // ── credibility: does their account of it stand up? ──
  let cred = (MOOD[r.mood] ?? 0) + (r.reception === 'warm' ? 1 : r.reception === 'cold' ? -1 : 0)
    + Math.min(2, kind * 0.5);
  if (taped && suspect) cred += t.right ? 3 : blamedSuspect ? -2 : -1;
  // a name blamed is checked against the votes once the tape has played them
  if (taped) for (const n of blames) cred += flippers.has(n.who) ? 0.5 : -0.5;
  const credibilityScore = Math.round(Math.max(-3, Math.min(6, cred)) * 10) / 10;
  const credibility = credibilityScore >= 5 ? 'strengthened'
    : credibilityScore >= 2 ? 'credible' : credibilityScore >= -1 ? 'mixed' : 'damaged';

  // ── controversy: how loud it was, and about whom ──
  const weigh = { blame: 1.5, drag: 2, warn: 0.5 };
  let heat = named.reduce((s, n) => s + (weigh[n.stance] || 0) * (n.still ? 1 : 0.5), 0);
  heat += r.mood === 'denial' || r.mood === 'bitter' ? 2 : 0;
  heat += taped && suspect && !t.right && blamedSuspect ? 2 : 0;
  heat += (r.answerBack || []).length;
  heat += ep.tier === 'viral' ? 2 : ep.tier === 'solid' ? 1 : 0;
  const controversy = Math.max(0, Math.min(10, Math.round(heat)));

  const loud = blames.filter(n => n.still).sort((a, b) => (b.heat || 0) - (a.heat || 0))[0] || null;
  const responseRequested = Boolean(loud && (ep.tier === 'viral' || controversy >= 7));
  const tags = [credibility === 'strengthened' ? 'owned the record' : credibility === 'credible' ? 'story holds up'
    : credibility === 'damaged' ? (taped ? 'story questioned' : 'came off bitter') : 'account debated'];
  if (taped && suspect) tags.push(t.right ? 'named the right flipper' : blamedSuspect ? 'blamed the wrong person' : 'suspected the wrong person');
  if (blames.filter(n => n.still).length >= 2) tags.push('burned bridges');
  else if (!blames.length && (r.mood === 'gracious' || r.mood === 'relieved')) tags.push('no hard feelings');
  if ((r.answerBack || []).length) tags.push('answered back');
  if (responseRequested) tags.push('response requested');
  const relationship = loud
    ? { with: loud.who, direction: 'worsen', label: `${loud.who} is still playing and hears every word of it on the way out.` }
    : null;
  return { credibility, credibilityScore, controversy, relationship, responseRequested,
    receiptsTested: taped ? 1 : 0, tags };
}
