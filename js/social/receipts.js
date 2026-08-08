// ══════════════════════════════════════════════════════════════════════
// social/receipts.js — why THIS one matters
// ══════════════════════════════════════════════════════════════════════
//
// An event used to be four fields: `{ kind: 'nomination', subject: 'logan',
// actor: 'anastasia' }`. Everything written from it was therefore about A
// nomination rather than about THIS nomination — grammatically fine, and
// detachable from the episode, because there was nothing in the packet that
// only fits one night.
//
// Every fact needed to fix that is already in `gs` and none of it reached the
// feed: the deal they shook on, the vote one of them saved the other with, the
// week they were nominated together, whether they are family, whether one of
// them is still not over the other. This module reads those and hands the
// writer a CLOSED SET of things it is allowed to bring up.
//
// ── why a closed set with ids ──
//
// This layer is built to be handed to a model later. A free-writing model plus
// a validator that hunts for invented history is an arms race the model wins —
// it will produce plausible-sounding weeks faster than anybody can enumerate
// rejections. If instead every receipt has an id and a post must cite one,
// fabrication stops being something to detect and becomes something the format
// does not permit. The template renderer uses exactly the same list today,
// which is how the shape gets proven before a worker exists.
//
// Ordered by `weight`, most damning first, because both consumers want the same
// thing: the one fact that makes this the story.
import { gs } from '../core.js';
import { getBond, feelsFor, leanGap } from '../bonds.js';
import { kinshipBetween, REL_KINSHIP } from '../core.js';

const slug = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
const nameOf = s => String(s || '').split('-').filter(Boolean)
  .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const weeks = () => (Array.isArray(gs?.bb?.weeks) ? gs.bb.weeks : []);

/** One thing a fan is allowed to bring up, and where it came from. */
function receipt(id, weight, text, extra = {}) {
  return { id, weight, text, ...extra };
}

// ── the sources ─────────────────────────────────────────────────────────
//
// Each reads ONE store and returns receipts or nothing. Kept separate so a
// missing subsystem degrades the packet rather than emptying it — a season
// with no deals still produces vote receipts.

/** A deal they shook on, and what happened to it. */
function dealReceipts(a, b, upTo) {
  const out = [];
  for (const d of (gs?.sideDeals || [])) {
    const players = d.players || [];
    if (!players.includes(a) || !players.includes(b)) continue;
    if (d.broken && d.brokenBy) {
      out.push(receipt('deal-broken', 1, `${d.brokenBy} broke a deal with ${
        players.find(p => p !== d.brokenBy) || ''}`.trim(),
      { week: d.brokenWeek ?? null, players: [d.brokenBy] }));
    } else {
      out.push(receipt('deal-standing', 0.7,
        `${a} and ${b} shook on ${d.tier === 'final-two' ? 'the end together' : 'working together'}`,
        { players: [a, b] }));
    }
  }
  return out;
}

/** A vote one of them cast that the other one lived or died by. */
function voteReceipts(a, b, upTo) {
  const out = [];
  for (const w of weeks()) {
    const num = Number(w?.num) || 0;
    if (upTo && num >= upTo) continue;
    for (const ballot of (w.ballots || [])) {
      if (ballot.voter === a && ballot.evict === b) {
        out.push(receipt('voted-against', 0.85,
          `${a} voted to evict ${b} in week ${num}`, { week: num, players: [a, b] }));
      }
      // Saving somebody is only a story when they were actually at risk.
      if (ballot.voter === a && (w.finalNominees || []).includes(b) && ballot.evict !== b) {
        out.push(receipt('kept-them', 0.8,
          `${a} kept ${b} off the block in week ${num}`, { week: num, players: [a, b] }));
      }
    }
    // A flip they got away with, which the victim never learned.
    for (const inc of (w?.allianceChanges?.betrayals || [])) {
      if (inc?.voter !== a || inc?.victim !== b) continue;
      out.push(receipt(inc.known === false ? 'flip-hidden' : 'flip-caught',
        inc.known === false ? 1 : 0.9,
        inc.known === false
          ? `${a} wrote ${b}'s name down in week ${num} and ${b} still does not know`
          : `${a} flipped on ${b} in week ${num}`,
        { week: num, players: [a, b] }));
    }
  }
  return out;
}

/** Weeks they sat in the same two chairs. */
function blockReceipts(a, b, upTo) {
  const out = [];
  for (const w of weeks()) {
    const num = Number(w?.num) || 0;
    if (upTo && num >= upTo) continue;
    const noms = w.finalNominees || w.initialNominees || [];
    if (noms.includes(a) && noms.includes(b)) {
      out.push(receipt('block-together', 0.6,
        `${a} and ${b} sat on the block together in week ${num}`, { week: num, players: [a, b] }));
    }
    if (w.hoh === a && (w.initialNominees || []).includes(b)) {
      out.push(receipt('nominated-before', 0.75,
        `${a} nominated ${b} in week ${num}`, { week: num, players: [a, b] }));
    }
  }
  return out;
}

/** What they are to each other outside the game, and how it is going. */
function relationshipReceipts(a, b) {
  const out = [];
  const kin = kinshipBetween(a, b);
  if (kin && kin !== 'none') {
    out.push(receipt('kinship', 0.8,
      `${a} and ${b} are ${String(REL_KINSHIP[kin]?.label || kin).toLowerCase()}`,
      { players: [a, b], kin }));
  }
  const bond = getBond(a, b);
  if (bond >= 5) out.push(receipt('close', 0.5, `${a} and ${b} are close`, { players: [a, b] }));
  if (bond <= -5) out.push(receipt('bad-blood', 0.6, `${a} and ${b} cannot stand each other`, { players: [a, b] }));
  // The asymmetry, which is the whole reason the lean exists — and the only
  // receipt here that a single shared number could never produce.
  if (leanGap(a, b) >= 4) {
    const warm = feelsFor(a, b) >= feelsFor(b, a) ? a : b;
    const cold = warm === a ? b : a;
    out.push(receipt('one-sided', 0.9,
      `${warm} is far more into this than ${cold} is`, { players: [warm, cold] }));
  }
  return out;
}

/** Something one of them said, on the record, that has not aged well. */
function memoryReceipts(a, b, upTo) {
  const out = [];
  const store = gs?.strategyMemory || gs?.bb?.memories || null;
  if (!store || typeof store !== 'object') return out;
  for (const [key, entries] of Object.entries(store)) {
    for (const m of [].concat(entries || [])) {
      if (!m || typeof m !== 'object') continue;
      const holder = m.holder || m.about || key;
      const target = m.target || m.subject;
      if (!((holder === a && target === b) || (holder === b && target === a))) continue;
      if (upTo && Number(m.week) >= upTo) continue;
      const kind = String(m.kind || m.type || '').replace(/-/g, ' ');
      if (!kind) continue;
      out.push(receipt(`memory-${slug(m.kind || m.type)}`, 0.7,
        `${holder} has not forgotten that ${target} ${kind}`,
        { week: m.week ?? null, players: [holder, target] }));
    }
  }
  return out;
}

/**
 * Everything the audience could fairly bring up about these two.
 *
 * `upTo` is the episode being written about: a receipt from a later week is a
 * spoiler, and a feed that reacts to week three with week eight's betrayal is
 * the loudest possible way to say the whole thing is generated afterwards.
 */
export function receiptsFor(a, b, { upTo = null, limit = 5 } = {}) {
  if (!a || !b || a === b) return [];
  // ── both directions, always ──
  //
  // The sources are directional — `voteReceipts(a, b)` finds what A did to B —
  // and the caller's order is whatever the event happens to use. A nomination
  // names the NOMINEE as its subject, so reading one direction threw away
  // every fact about what the nominator had done, which is the half that makes
  // a nomination a story.
  const one = [
    ...dealReceipts(a, b, upTo), ...voteReceipts(a, b, upTo),
    ...blockReceipts(a, b, upTo), ...relationshipReceipts(a, b),
    ...memoryReceipts(a, b, upTo),
  ];
  const other = [
    ...voteReceipts(b, a, upTo), ...blockReceipts(b, a, upTo),
    ...memoryReceipts(b, a, upTo),
  ];

  // Deduped on the SENTENCE, because the same fact reached from both sides is
  // one fact — but "Logan voted against Kit" and "Kit voted against Logan" are
  // two, so the id alone is too blunt a key. Then capped at two per id, so a
  // season of votes cannot crowd out the deal they shook on.
  const byText = new Set();
  const perId = new Map();
  return [...one, ...other]
    .sort((x, y) => (y.weight - x.weight) || ((y.week || 0) - (x.week || 0)))
    .filter(r => {
      if (byText.has(r.text)) return false;
      const n = perId.get(r.id) || 0;
      if (n >= 2) return false;
      byText.add(r.text); perId.set(r.id, n + 1);
      return true;
    })
    .slice(0, limit);
}

/**
 * The packet for one event.
 *
 * Names are stored as slugs everywhere else in this library, so the receipts
 * are built from display names and the packet carries both — the writer needs
 * words, the validator needs ids.
 */
export function packetFor(event, { upTo = null } = {}) {
  const subject = nameOf(event?.subject);
  const actor = nameOf(event?.actor);
  if (!subject || !actor) return { receipts: [], headline: null };
  const receipts = receiptsFor(subject, actor, { upTo: upTo ?? event?.episode ?? null });
  return {
    receipts,
    // The single fact that makes this the story, which is what a short post
    // gets to use and a long one leads with.
    headline: receipts[0] || null,
  };
}

/**
 * Attach receipts to an event, in place. Returns the event.
 *
 * `receipt` is set as a FLAT FIELD as well as inside the packet, and that is
 * load-bearing rather than duplication: `poolFor` decides which phrasings an
 * event can fill by checking `event[slot]` for every name in SLOT_NAMES, so a
 * receipt living only at `headline.text` reads as an unfillable slot and every
 * template that spends one is silently dropped — which is a topic that can
 * never fire and looks exactly like an authoring mistake.
 */
export function withReceipts(event, opts = {}) {
  const { receipts, headline } = packetFor(event, opts);
  event.receipts = receipts;
  event.headline = headline;
  // Lower-cased and unpunctuated, because it lands mid-sentence in something
  // somebody typed on a phone.
  event.receipt = headline ? String(headline.text).replace(/\.$/, '') : null;
  return event;
}
