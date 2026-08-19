// What a cast brings with them from their lives.
//
// Design: docs/superpowers/specs/2026-08-18-life-carryover-design.md
//
// The life layer ran one way. A season was exported, the off-season resolved,
// and characters acquired partners, homes and children — and then the next
// season started and the engine introduced a couple of two years' standing as
// strangers with a bond of zero, waiting to see whether a spark formed.
//
// It also left the design's best idea toothless. "Being cast is the test" is
// already in the resolver's rates, but the strain landed AFTER a season, on a
// relationship that season never knew about, so nothing in the episodes ever
// caused it.
//
// ── SHAPE BORROWED ON PURPOSE ──
//
// `pairs` comes out in the same shape as buildFranchiseMeta's `seededPairs`, so
// initGameState folds it in through the clamp it already has rather than
// growing a second way to seed a bond. That file learned the hard way that two
// sources of the same feeling double-count (see its betrayal/blindside dedupe),
// and this is deliberately the narrower of the two: relationships only. Rivalry
// stays with franchiseMeta, which reads what happened in the GAME and is better
// evidence than a proposed off-season feud.
//
// Pure, and name-keyed on the way out. The simulator is names all the way
// through and the life log is slugs; the translation belongs at this boundary,
// once, rather than in every consumer.

import { stateOf } from './life-events.js';
import { airKey } from './franchise-calendar.js';

/** How much of a bond each stage of a relationship is worth at the start. */
export const CARRY = {
  dating: 2,
  public: 3,
  'living-together': 4,
  engaged: 5,
  married: 6,
  child: 1,
};

/**
 * And what an ending is worth, negatively.
 *
 * A quiet end is barely a fact by the time you are both cast again; a divorce
 * is a season's worth of atmosphere on its own.
 */
export const ENDED = {
  'quietly-ended': -1,
  'broke-up': -2.5,
  separated: -4,
  divorced: -4,
};

/**
 * How much an ending still counts, by how many off-seasons ago it was.
 *
 * A break-up from six years back is a fact about two people rather than a live
 * wound, and seeding it at full weight would make every returning cast frosty.
 */
const DECAY = [1, 0.6, 0.3];

const slugOf = name => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Everything a cast carries in, from the approved log.
 *
 * `cast` is the sim's player array (objects with `name`, optionally `slug`).
 * `log` is the whole life log; only approved rows are read, exactly as every
 * other reader does — a proposal must not be able to change a season.
 *
 * Returns empty everything when there is no log, which is the ordinary case for
 * a fresh franchise and must never be an error: a life layer that can stop a
 * season starting is worse than no life layer.
 */
export function lifeSeeds(cast = [], log = [], seasons = []) {
  const out = { pairs: [], showmances: [], soloPartners: [] };
  if (!cast.length || !log.length) return out;

  const seasonRank = new Map(seasons.map(s => [s.seasonId, airKey(s)]));
  const nameBySlug = new Map();
  for (const p of cast) nameBySlug.set(p.slug || slugOf(p.name), p.name);

  // Newest first, so "how many off-seasons ago" is an index into this.
  const gapOrder = [...new Set(log.map(e => e.afterSeason))]
    .sort((a, b) => (seasonRank.get(b) ?? -1) - (seasonRank.get(a) ?? -1));
  const agoOf = sid => {
    const i = gapOrder.indexOf(sid);
    return i < 0 ? DECAY.length - 1 : Math.min(i, DECAY.length - 1);
  };

  const seenPair = new Set();
  const pairKey = (a, b) => [a, b].sort().join('||');

  for (const p of cast) {
    const slug = p.slug || slugOf(p.name);
    const st = stateOf(slug, log, { seasonRank });
    const stage = st?.relationship?.stage || 'single';
    const partner = st?.relationship?.with || null;

    // ── together ──
    if (stage !== 'single' && partner) {
      const partnerName = nameBySlug.get(partner);
      if (partnerName) {
        // BOTH CAST. One entry per couple, not one per person.
        const key = pairKey(p.name, partnerName);
        if (!seenPair.has(key)) {
          seenPair.add(key);
          // A child together is the one thing on the whole log that makes a
          // relationship harder for a season to break, so it is the one thing
          // outside the relationship track that carries at all.
          const kids = log.filter(e => e.status === 'approved' && e.kind === 'birth'
            && (e.player === slug || e.player === partner)).length;
          const delta = (CARRY[stage] || 2) + (kids ? CARRY.child : 0);
          out.pairs.push({ a: p.name, b: partnerName, bondDelta: delta,
            kind: 'life-together', reason: reasonFor(stage, kids) });
          out.showmances.push({ players: [p.name, partnerName], stage, kids,
            since: st.relationship.since || null });
        }
      } else {
        // CAST ALONE, which the design cares about most and which had no
        // mechanism at all. Three months on camera, shipped with somebody else,
        // and an edit that may be unkind — this is the test.
        out.soloPartners.push({
          name: p.name, whom: partner, whomName: prettify(partner), stage,
        });
      }
    }

    // ── exes ──
    //
    // Read off the log rather than off the state, because the state of an ended
    // relationship is "single" and says nothing about who it was with.
    for (const e of log) {
      if (e.status !== 'approved' || !ENDED[e.kind]) continue;
      if (e.player !== slug && e.whom !== slug) continue;
      const other = e.player === slug ? e.whom : e.player;
      const otherName = other && nameBySlug.get(other);
      if (!otherName || otherName === p.name) continue;
      // Not if they are back together: the log can hold a break-up and a later
      // reconciliation, and the current state is what counts.
      if (partner && other === partner) continue;
      const key = pairKey(p.name, otherName);
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      out.pairs.push({
        a: p.name, b: otherName,
        bondDelta: ENDED[e.kind] * DECAY[agoOf(e.afterSeason)],
        kind: 'life-ex',
        reason: e.kind === 'divorced' ? 'Divorced'
          : e.kind === 'separated' ? 'Separated'
          : e.kind === 'quietly-ended' ? 'It ended quietly' : 'They broke up',
      });
    }
  }
  return out;
}

function reasonFor(stage, kids) {
  const base = stage === 'married' ? 'Married'
    : stage === 'engaged' ? 'Engaged'
    : stage === 'living-together' ? 'Living together'
    : stage === 'public' ? 'Together, publicly'
    : 'Together';
  return kids ? `${base}, with a child` : base;
}

/** A slug rendered readably, for somebody who is not in the cast to be named. */
function prettify(slug) {
  return String(slug || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * The sentence a season uses to introduce what somebody arrived with.
 *
 * Show vocabulary comes from the caller, never from here — "arrived at camp"
 * over a Big Brother house is the recurring bug this project keeps a document
 * about, and this module has no business knowing which show it is in.
 */
export function arrivalLine(seed, words = {}) {
  const who = words.players || 'players';
  if (seed.stage === 'married') return `${seed.players[0]} and ${seed.players[1]} arrived married.`;
  if (seed.stage === 'engaged') return `${seed.players[0]} and ${seed.players[1]} arrived engaged.`;
  if (seed.kids) return `${seed.players[0]} and ${seed.players[1]} arrived together — and they have a child at home.`;
  return `${seed.players[0]} and ${seed.players[1]} arrived already together, and the other ${who} know it.`;
}

/**
 * And the sentence for somebody who left their partner behind.
 *
 * Genderless by construction rather than by picking a word: "fiancé/fiancée"
 * and "husband or wife" both require knowing something this module is not
 * given, and getting it wrong on a character's own season is worse than
 * phrasing around it.
 */
export function soloLine(solo) {
  if (solo.stage === 'married') return `${solo.name} is married. ${solo.whomName} is at home.`;
  if (solo.stage === 'engaged') return `${solo.name} is engaged to ${solo.whomName}, who is at home.`;
  return `${solo.name} left someone at home: ${solo.whomName}.`;
}
