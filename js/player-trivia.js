// Trivia that is COMPUTED, not written.
//
// The reference character pages carry a kind of fact nothing here produced:
//
//   "tied with Jun Song, Maggie Ausburn and three others with the second
//    fewest number of HOH wins out of the winners"
//   "the third houseguest to win after being nominated in Week 1"
//   "the first houseguest to try, and fail, to change her vote"
//
// Those are not prose about a character. They are QUERIES ACROSS EVERY SEASON —
// rankings, ties, and "the Nth person ever to do X". A language model asked to
// write one will produce a sentence of exactly that shape with the number
// wrong, and nobody reading a wiki can tell. So they are derived from the
// record instead: always right, and richer every season that is played.
//
// ── THE HARD PART IS NOT GENERATING THEM ──
//
// It is refusing to. With one Big Brother season on record, "the first winner"
// is true, and worthless — there has only been one winner. "Tied for the fewest
// HOH wins among winners" is true of the only winner. A page full of facts that
// are artefacts of a small sample reads as padding, and worse, it teaches the
// reader to skim the section that will eventually be the good one.
//
// So every fact below is gated on the SIZE OF THE POOL IT COMPARES AGAINST, and
// on the claim being a real distinction rather than a restatement of "there is
// only one of these". A first season should produce almost nothing here. That
// is the correct output, not a bug — the user who asked for this said so
// themselves before it was built.
//
// Vocabulary comes from the show. A camp has no Head of Household and a house
// has no immunity idol; printing one show's words over the other is the bug
// class this project names first.

import { airKey, airLabel } from './franchise-calendar.js';
import { stateOf } from './life-events.js';

/** Minimum comparison pool before a superlative means anything. */
const MIN_POOL = 5;
/** Minimum qualifying set before an ordinal ("the third to…") means anything. */
const MIN_ORDINAL_POOL = 3;
/** Minimum pool before "the only player to…" is a distinction rather than a shrug. */
const MIN_ONLY_POOL = 8;

const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
  'seventh', 'eighth', 'ninth', 'tenth'];
const ordinal = n => ORDINALS[n] || `${n}th`;

/** 1st, 2nd, 3rd, 4th — for a placement, where the word form reads wrong. */
function nth(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n);
  const s = ['th', 'st', 'nd', 'rd'][(v % 100 - v % 10 !== 10) && v % 10 < 4 ? v % 10 : 0];
  return `${v}${s || 'th'}`;
}

/** "a, b and c" — with the serial comma the reference pages use. */
function joinList(xs) {
  if (xs.length <= 1) return xs[0] || '';
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`;
}

/**
 * What each show calls its competitions.
 *
 * Read here rather than branched on at every call site, so a third show is one
 * entry rather than a sweep through this file.
 */
const WORDS = {
  'big-brother': {
    player: 'houseguest', players: 'houseguests',
    comps: [
      { key: c => bb(c).hohWins, one: 'Head of Household win', many: 'Head of Household wins' },
      { key: c => bb(c).vetoWins, one: 'veto win', many: 'veto wins' },
      { key: c => bb(c).blockBusterWins, one: 'Block Buster win', many: 'Block Buster wins' },
    ],
  },
  'total-drama': {
    player: 'contestant', players: 'contestants',
    comps: [
      { key: c => c.challengeWins || 0, one: 'challenge win', many: 'challenge wins' },
      { key: c => c.immunityWins || 0, one: 'immunity win', many: 'immunity wins' },
      { key: c => c.idolsFound || 0, one: 'idol', many: 'idols found' },
    ],
  },
};
const wordsFor = f => WORDS[f] || WORDS['total-drama'];

/** A career's Big Brother totals, summed across seasons. */
function bb(career) {
  const t = { hohWins: 0, vetoWins: 0, blockBusterWins: 0, timesNominated: 0, timesSaved: 0 };
  for (const d of career.details || []) {
    const s = d.bb || {};
    for (const k of Object.keys(t)) t[k] += s[k] || 0;
  }
  return t;
}

/** Everyone who has ever won this show. */
const winnersOf = careers => careers.filter(c => (c.wins || 0) > 0);

/**
 * The players tied at the extreme of a stat, and what that value is.
 *
 * Returns null when the pool is too small to compare, or when EVERY player
 * shares the value — "tied for the fewest idols found" among eighteen people
 * who all found none is not a fact about any of them.
 */
function extreme(pool, valueOf, dir) {
  if (pool.length < MIN_POOL) return null;
  const vals = pool.map(valueOf);
  const target = dir === 'most' ? Math.max(...vals) : Math.min(...vals);
  const holders = pool.filter(c => valueOf(c) === target);
  // A RECORD A THIRD OF THE FIELD SHARES IS NOT A RECORD.
  //
  // The first version only rejected the case where everyone tied, which let
  // through "tied with Emma, Jacques, Jasmine, Lindsay, Wayne, Miriam, James
  // and Jade for the fewest idols found among winners, with none" — eight of
  // twelve winners, which is a fact about idols being rare, not about any of
  // those eight.
  if (holders.length > Math.max(1, pool.length / 3)) return null;
  return { target, holders };
}

/**
 * Name the others in a tie, without listing a crowd.
 *
 * Three names and a count: "tied with A, B, C and four others" is readable,
 * where eight names is a list nobody finishes.
 */
function namesOf(holders, slug) {
  const others = holders.filter(c => c.id !== slug).map(c => c.name);
  if (others.length <= 3) return joinList(others);
  const rest = others.length - 3;
  return `${others.slice(0, 3).join(', ')}, and ${rest} other${rest === 1 ? '' : 's'}`;
}

/**
 * Trivia for one player, as plain sentences.
 *
 * `careers` is every career in this format (from records.js careersIn), which
 * is the comparison pool. `seasonsDb` supplies season order for "the Nth to…".
 */
export function playerTriviaFor(slug, careers = [], format = 'total-drama', opts = {}) {
  const { seasonsDb = null } = opts;
  const me = careers.find(c => c.id === slug);
  if (!me) return [];
  const W = wordsFor(format);
  const out = [];
  const name = me.name || slug;

  // ── superlatives, career-wide ──
  //
  // "has the most veto wins of anyone who has played" — the shape a reader
  // actually wants, with the tie named rather than hidden behind "tied for".
  for (const comp of W.comps) {
    for (const dir of ['most']) {
      const ex = extreme(careers, comp.key, dir);
      if (!ex || !ex.holders.some(c => c.id === slug)) continue;
      if (!ex.target) continue;                       // "most idols found: 0"
      const others = namesOf(ex.holders, slug);
      out.push(others
        ? `${name} is tied with ${others} for the most ${comp.many} `
          + `of any ${W.player}, with ${ex.target}.`
        : `${name} has the most ${comp.many} of any ${W.player}, with ${ex.target}.`);
    }
  }

  // ── superlatives among winners ──
  //
  // The reference page's favourite move, and only interesting once there are
  // several winners to be unusual among.
  const winners = winnersOf(careers);
  if (winners.length >= MIN_ORDINAL_POOL && (me.wins || 0) > 0) {
    for (const comp of W.comps) {
      const ex = extreme(winners, comp.key, 'fewest');
      if (!ex || !ex.holders.some(c => c.id === slug)) continue;
      const others = namesOf(ex.holders, slug);
      const val = ex.target === 0 ? 'none' : String(ex.target);
      out.push(others
        ? `${name} is tied with ${others} for the fewest ${comp.many} `
          + `among winners, with ${val}.`
        : `${name} has the fewest ${comp.many} of any winner, with ${val}.`);
    }
  }

  // ── ordinals: the Nth player ever to do a thing ──
  //
  // Ordered by the season it happened in, so "the third to…" counts history
  // rather than the order the database happens to list people in.
  //
  // ORDERED BY WHEN IT HAPPENED, NOT BY WHEN THEY DEBUTED.
  //
  // The first version sorted on the earliest season a player appeared in, and
  // announced "Alejandro was the first contestant to win the game" — he played
  // season 1 and lost it. Lindsay won it. An ordinal computed off the wrong
  // date is worse than no ordinal: it is a confident, checkable, wrong claim on
  // a page whose whole promise is that these numbers are derived.
  //
  // `whenQualified` returns the season a career first satisfied the condition,
  // or null if it never did — so it decides membership AND order together, and
  // the two cannot disagree.
  const nthAmong = (whenQualified, describe) => {
    const set = careers
      .map(c => ({ c, when: whenQualified(c) }))
      .filter(x => x.when != null)
      .sort((a, b) => a.when - b.when || String(a.c.name).localeCompare(b.c.name));
    if (set.length < MIN_ORDINAL_POOL) return;        // "the first of one" is noise
    const i = set.findIndex(x => x.c.id === slug);
    if (i === -1) return;
    const before = set.slice(0, i).map(x => x.c.name);
    out.push(i === 0
      ? `${name} was the first ${W.player} to ${describe}.`
      : `${name} was the ${ordinal(i + 1)} ${W.player} to ${describe}, `
        + `following ${joinList(before.slice(-3))}.`);
  };

  /** The earliest season whose row satisfies `ok`, or null. */
  const seasonWhere = (c, ok) => {
    const hits = (c.details || []).filter(ok).map(d => d.season);
    return hits.length ? Math.min(...hits) : null;
  };

  const won = d => d.placement === 1;
  nthAmong(c => seasonWhere(c, won), 'win the game');
  nthAmong(c => seasonWhere(c, d => won(d) && !(d.votesReceived || 0)),
    'win without a single vote cast against them');
  if (format === 'big-brother') {
    nthAmong(c => seasonWhere(c, d => won(d) && (d.bb?.timesNominated || 0) > 0),
      'win after being nominated');
    nthAmong(c => seasonWhere(c, d => (d.bb?.hohWins || 0) >= 3),
      'win three Heads of Household in one season');
  } else {
    nthAmong(c => seasonWhere(c, d => won(d) && !(d.immunityWins || 0)),
      'win without a single immunity win');
  }
  // The season they won their SECOND, which is the one this fact is about.
  nthAmong(c => {
    const wins = (c.details || []).filter(won).map(d => d.season).sort((a, b) => a - b);
    return wins.length > 1 ? wins[1] : null;
  }, 'win twice');

  // ── the only one ──
  //
  // Needs a genuinely large pool: "the only player to do X" among six people is
  // a coincidence, not a record.
  if (careers.length >= MIN_ONLY_POOL) {
    const onlyOne = (qualifies, describe) => {
      const set = careers.filter(qualifies);
      if (set.length !== 1 || set[0].id !== slug) return;
      out.push(`${name} is the only ${W.player} to ${describe}.`);
    };
    onlyOne(c => (c.seasonsPlayed || 0) >= 4, 'have played four seasons');
    if (format === 'big-brother') {
      onlyOne(c => bb(c).timesSaved >= 3, 'have been saved from the block three times');
    }
  }

  // ── what happened to them between seasons ──
  //
  // Folded in here so every existing caller that starts passing the log gets
  // the facts with no second call — and callers that do not pass it lose
  // nothing, because an empty log produces an empty list by design.
  out.push(...lifeTriviaFor(slug, opts));

  // ── longevity, which needs no pool at all ──
  //
  // True regardless of how many people have played, so it is not gated: it is a
  // fact about them, not a comparison.
  if ((me.seasonsPlayed || 0) > 1) {
    out.push(`${name} has played ${me.seasonsPlayed} seasons of this show, `
      + `finishing as high as ${me.bestPlacement === 1 ? 'the winner' : nth(me.bestPlacement)}.`);
  }

  return out;
}

/**
 * The same, keyed by slug, for every player in a format.
 *
 * Built once and read many times: a page that wants one player's trivia still
 * has to compute the whole comparison pool to know whether their fact is true.
 */
export function allPlayerTrivia(careers = [], format = 'total-drama', opts = {}) {
  const out = {};
  for (const c of careers) {
    const t = playerTriviaFor(c.id, careers, format, opts);
    if (t.length) out[c.id] = t;
  }
  return out;
}

// ── life trivia ─────────────────────────────────────────────────────────
//
// The most trivia-shaped facts the project produces never appeared here: who
// has been together longest, who married a castmate, who has dated half the
// call sheet. They live in the life log, and this file read careers only.
//
// FRANCHISE-WIDE ON PURPOSE. A career is scoped to one show, but a life is
// not — Alejandro's relationship does not restart when he walks into a
// different house — so these facts compare across everyone in the log and say
// "in the franchise" rather than borrowing either show's vocabulary. The same
// sentence appears on a character's article whichever show it is scoped to,
// which is correct: it is the same fact about the same person.
//
// Approved rows only, like every reader — a proposal must not change a page.
// And the same gating philosophy as above: with no weddings in the log, the
// marriage facts produce NOTHING, which is the correct output, not a bug.

/**
 * Life-derived trivia for one character.
 *
 * `lifeEvents` is the whole log; `seasons` the calendar rows (for when things
 * happened); `names` slug -> display name.
 */
export function lifeTriviaFor(slug, { lifeEvents = [], seasons = [], names = {} } = {}) {
  const out = [];
  const approved = (lifeEvents || []).filter(e => e && e.status === 'approved');
  if (!approved.length) return out;
  const name = names[slug] || slug;
  const nameOf = s => names[s] || s;
  const seasonRank = new Map(seasons.map(s => [s.seasonId, airKey(s)]));
  const seasonOf = id => seasons.find(s => s.seasonId === id) || null;
  const keyOf = e => seasonRank.get(e.afterSeason) ?? null;
  const people = [...new Set(approved.flatMap(e => [e.player, e.whom].filter(Boolean)))];

  const REL = new Set(['dating', 'went-public', 'moved-in', 'engaged', 'wedding']);

  // ── the longest-running couple in the franchise ──
  //
  // Couples are read from CURRENT state (both sides, so a dangling record can
  // never crown a couple who are not one), and each couple's start is the
  // earliest approved relationship event between the pair. Longest means the
  // earliest start still standing.
  const couples = [];
  const seenPair = new Set();
  for (const p of people) {
    const st = stateOf(p, approved, { seasonRank }).relationship;
    if (st.stage === 'single' || !st.with) continue;
    const theirs = stateOf(st.with, approved, { seasonRank }).relationship;
    if (theirs.with !== p) continue;
    const key = [p, st.with].sort().join('|');
    if (seenPair.has(key)) continue;
    seenPair.add(key);
    const starts = approved
      .filter(e => REL.has(e.kind)
        && [e.player, e.whom].includes(p) && [e.player, e.whom].includes(st.with))
      .map(keyOf).filter(k => k != null);
    if (!starts.length) continue;
    couples.push({ pair: [p, st.with], start: Math.min(...starts), stage: st.stage });
  }
  if (couples.length >= MIN_POOL) {
    const earliest = Math.min(...couples.map(c => c.start));
    const holders = couples.filter(c => c.start === earliest);
    // Same crowd rule as every superlative: a record a third of the couples
    // share is a fact about the calendar, not about any of them.
    if (holders.length === 1 && holders[0].pair.includes(slug)) {
      const [c] = holders;
      const other = c.pair.find(x => x !== slug);
      const since = seasons.find(s => airKey(s) === c.start);
      out.push(`${name} and ${nameOf(other)} are the longest-running couple in the franchise`
        + `${since ? `, together since ${airLabel(since)}` : ''}.`);
    }
  }

  // ── marriage: the ordinal and the only ──
  //
  // Zero weddings in the log today, so both stay silent — and start speaking
  // the season somebody finally does it, with the count already right.
  const weddedAt = p => {
    const w = approved.filter(e => e.kind === 'wedding' && [e.player, e.whom].includes(p))
      .map(keyOf).filter(k => k != null);
    return w.length ? Math.min(...w) : null;
  };
  const married = people.map(p => ({ p, when: weddedAt(p) })).filter(x => x.when != null)
    .sort((a, b) => a.when - b.when || nameOf(a.p).localeCompare(nameOf(b.p)));
  if (married.length >= MIN_ORDINAL_POOL) {
    const i = married.findIndex(x => x.p === slug);
    if (i === 0) out.push(`${name} was the first in the franchise to marry a castmate.`);
    else if (i > 0) out.push(`${name} was the ${ordinal(i + 1)} in the franchise to marry a castmate.`);
  } else if (married.length === 1 && married[0].p === slug && people.length >= MIN_ONLY_POOL) {
    const partner = approved.find(e => e.kind === 'wedding' && [e.player, e.whom].includes(slug));
    const other = partner ? [partner.player, partner.whom].find(x => x && x !== slug) : null;
    out.push(`${name}${other ? ` and ${nameOf(other)}` : ''} `
      + `${other ? 'are the only married couple' : 'is the only one married'} in the franchise.`);
  }

  // ── children ──
  const births = p => approved.filter(e => e.kind === 'birth' && e.player === p);
  const mine = births(slug);
  if (mine.length >= 2) out.push(`${name} has ${mine.length} children.`);
  const parents = people.map(p => {
    const b = births(p).map(keyOf).filter(k => k != null);
    return { p, when: b.length ? Math.min(...b) : null };
  }).filter(x => x.when != null)
    .sort((a, b) => a.when - b.when || nameOf(a.p).localeCompare(nameOf(b.p)));
  if (parents.length >= MIN_ORDINAL_POOL && parents[0].p === slug) {
    out.push(`${name} was the first in the franchise to have a child.`);
  }

  // ── the serial dater ──
  //
  // Distinct partners across the whole log, endings included: "has dated" is
  // history, not status. Three is where it becomes a pattern; the count needs
  // no comparison pool because it is a fact about them alone.
  const partners = new Set(approved
    .filter(e => e.kind === 'dating' && [e.player, e.whom].includes(slug))
    .map(e => [e.player, e.whom].find(x => x && x !== slug)).filter(Boolean));
  if (partners.size >= 3) {
    out.push(`${name} has dated ${partners.size} fellow players across the franchise`
      + ` — ${joinList([...partners].slice(0, 3).map(nameOf))}${partners.size > 3 ? ', among others' : ''}.`);
  }

  return out;
}
