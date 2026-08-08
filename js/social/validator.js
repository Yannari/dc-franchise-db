// ══════════════════════════════════════════════════════════════════════
// social/validator.js — what a written post is not allowed to be
// ══════════════════════════════════════════════════════════════════════
//
// The gate between a model and the episode record. Everything it rejects, it
// rejects for one of two reasons: the post says something that did not happen,
// or the post does not sound like a person.
//
// ── the shape of the problem ──
//
// A free-writing model plus a validator that hunts for invented history is an
// arms race the model wins. It will produce plausible weeks — "after what he
// did to her in week three" — faster than anybody can enumerate rejections,
// and every one of them reads correctly.
//
// So fabrication is not detected here, it is made impossible upstream. The
// packet carries a CLOSED SET of receipts, each with an id, and a post must
// cite one. This file then checks the cheap, decidable things: is that id real,
// is every name in the text somebody who exists, is every week it mentions a
// week a receipt actually names.
//
// That inverts the burden. The model does not have to be trusted not to invent;
// it has to point at something, and pointing at something that is not there is
// a string comparison.
//
// Everything here is PURE — text and a packet in, verdict out. No gs, no
// network, no model. It is the same function the worker runs before returning
// and the client runs before storing, because a check that only exists on one
// side of a network call is a check somebody will route around.

/** Openings that mean the writer had nothing and started talking anyway. */
const DEAD_OPENINGS = [
  /^in a (shocking|stunning|surprising|dramatic) (turn|twist|move|development)/i,
  /^let(')?s (talk|discuss|break) /i,
  /^(here|this) is (why|what|how) /i,
  /^it(')?s no secret that /i,
  /^(fans|viewers|everyone|the internet) (are|is|was) (going wild|losing it|divided)/i,
  /^in tonight(')?s episode/i,
  /^one thing is (clear|certain)/i,
  /^(buckle up|strap in|wow, just wow)/i,
  /^as a (long[- ]?time|die[- ]?hard) fan/i,
  /^(the|this) (latest|newest) episode (of|delivered|gave)/i,
];

/**
 * Attacks that belong to nobody's fandom.
 *
 * Deliberately narrow. A social feed about a reality show is SUPPOSED to be
 * unkind — "Spencer is so annoying" is the register, not a failure — so this
 * catches only the categories that are about a person rather than a player.
 */
const SELF = '(?:your|her|him|them|my|it)self|themselves';
const PROHIBITED = [
  // Every pronoun, not just the second person: a timeline talks ABOUT people,
  // so the common form is "should kill herself" rather than "kill yourself".
  new RegExp(`\\b(kill|hang|off)\\s+(${SELF})\\b`, 'i'),
  new RegExp(`\\bshould\\s+(just\\s+)?(die|kill\\s+(${SELF}))\\b`, 'i'),
  /\bk\W?y\W?s\b/i,
  /\bshould be (dead|shot|hanged|killed)\b/i,
  /\bhope (he|she|they|you) (dies?|gets? hurt)\b/i,
  /\b(r\W?[a4]\W?p[e3]|molest)\b/i,
  // Anything reaching outside the show at somebody's family or address.
  /\b(their|his|her) (kids|children|mother|father|family) should\b/i,
  /\b(dox|doxx|home address|where (he|she|they) live)\b/i,
];

const WEEK_RE = /\bweek\s+(\d{1,2})\b/gi;
const SLOT_RE = /\{[a-z_]+\}/i;

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Words a capitalised token can be without being a person. */
const NOT_A_NAME = new Set([
  'i', 'a', 'the', 'this', 'that', 'and', 'but', 'not', 'no', 'yes', 'ok', 'okay',
  'week', 'day', 'night', 'season', 'episode', 'final', 'finale', 'jury', 'house',
  'big', 'brother', 'hoh', 'pov', 'veto', 'block', 'nomination', 'eviction',
  'omg', 'lmao', 'lol', 'wtf', 'im', 'its', 'dont', 'cant', 'wont', 'thats',
  'get', 'him', 'her', 'them', 'they', 'she', 'he', 'we', 'you', 'me', 'my',
  'goat', 'mvp', 'tv', 'us', 'ok', 'nah', 'yeah', 'crying', 'screaming',
]);

/**
 * Every name the text appears to claim exists.
 *
 * Capitalised tokens that are not sentence-initial and not common words. An
 * all-caps post defeats this by construction, which is why a scream is checked
 * against its own rules and not this one.
 */
function claimedNames(text) {
  const out = new Set();
  const words = String(text || '').split(/\s+/);
  for (const [i, raw] of words.entries()) {
    const w = raw.replace(/[^A-Za-z'-]/g, '');
    if (w.length < 2) continue;
    if (w === w.toUpperCase()) continue;          // shouting, not naming
    if (!/^[A-Z]/.test(w)) continue;
    if (i === 0) continue;                         // start of a sentence
    if (NOT_A_NAME.has(w.toLowerCase())) continue;
    if (/[.!?]$/.test(words[i - 1] || '')) continue; // start of a new sentence
    out.add(w);
  }
  return [...out];
}

/**
 * Judge one written post.
 *
 * @param {string} text
 * @param {object} packet   { receipts:[{id,text,week}], cast:[names], event:{subject,actor},
 *                            maxLength, register:'scream'|'post', requireCite:bool }
 * @param {object} opts     { approved:[texts already kept for this episode] }
 * @returns {{ok:boolean, reasons:string[]}}
 */
export function validatePost(text, packet = {}, { approved = [], cites = null } = {}) {
  const reasons = [];
  const body = String(text || '').trim();
  const receipts = packet.receipts || [];
  const register = packet.register || 'post';
  const maxLength = Number(packet.maxLength) || 280;

  if (!body) return { ok: false, reasons: ['empty'] };

  // ── did it say anything that is not true ──
  //
  // The citation is the whole design. A post that points at a receipt id is
  // making a claim somebody can check with a string comparison; a post that
  // free-writes history is making one nobody can.
  if (packet.requireCite) {
    const ids = new Set(receipts.map(r => r.id));
    const claimed = [].concat(cites || []);
    if (!claimed.length) reasons.push('cites-nothing');
    for (const c of claimed) {
      if (!ids.has(c)) reasons.push(`cites-unknown:${c}`);
    }
  }

  // Every name it uses has to be somebody who exists.
  const cast = new Set((packet.cast || []).map(n => String(n).toLowerCase()));
  if (cast.size) {
    for (const name of claimedNames(body)) {
      if (!cast.has(name.toLowerCase())) reasons.push(`invented-name:${name}`);
    }
  }

  // Every week it names has to be a week a receipt actually names. Inventing a
  // date is the single most convincing way to invent a history.
  const allowedWeeks = new Set(receipts.map(r => r.week).filter(w => w != null).map(Number));
  for (const m of body.matchAll(WEEK_RE)) {
    const wk = Number(m[1]);
    if (!allowedWeeks.has(wk)) reasons.push(`invented-week:${wk}`);
  }

  // ── does it sound like a person ──
  if (body.length > maxLength) reasons.push('too-long');
  if (register === 'scream' && body.length > 45) reasons.push('not-a-scream');
  if (register === 'post' && body.length < 12) reasons.push('too-short');
  if (SLOT_RE.test(body)) reasons.push('leaked-slot');
  if (DEAD_OPENINGS.some(re => re.test(body))) reasons.push('dead-opening');
  if (PROHIBITED.some(re => re.test(body))) reasons.push('prohibited');

  // Nobody in a crowd says exactly what somebody else just said.
  const key = norm(body);
  if (approved.some(a => norm(a) === key)) reasons.push('duplicate');
  // Nor most of it — a model handed the same packet twice rewrites the same
  // sentence with two words moved.
  for (const a of approved) {
    const other = norm(a);
    if (!other || other === key) continue;
    if (overlap(key, other) >= 0.8) { reasons.push('near-duplicate'); break; }
  }

  return { ok: !reasons.length, reasons };
}

/** How much of the shorter post is contained in the longer one, 0..1. */
function overlap(a, b) {
  const wa = new Set(a.split(' ').filter(w => w.length > 3));
  const wb = new Set(b.split(' ').filter(w => w.length > 3));
  if (!wa.size || !wb.size) return 0;
  let hit = 0;
  for (const w of wa) if (wb.has(w)) hit++;
  return hit / Math.min(wa.size, wb.size);
}

/**
 * Keep what passes, in order, and say why the rest went.
 *
 * Runs the whole batch against a growing `approved` list so duplicates inside
 * ONE response are caught as well as duplicates against what is already stored.
 */
export function acceptPosts(candidates = [], packet = {}, { approved = [] } = {}) {
  const kept = [];
  const rejected = [];
  const seen = [...approved];
  for (const c of candidates) {
    const text = typeof c === 'string' ? c : c?.text;
    const cites = typeof c === 'string' ? null : c?.cites;
    const verdict = validatePost(text, packet, { approved: seen, cites });
    if (verdict.ok) { kept.push({ ...(typeof c === 'string' ? { text } : c) }); seen.push(text); }
    else rejected.push({ text, reasons: verdict.reasons });
  }
  return { kept, rejected };
}
