// What happened to a character between seasons.
//
// The third nature of data in this project, and the last one built:
//
//   authored — who somebody IS (roster, voice, backstory, casting interview)
//   derived  — what happened in a season (records, trivia, placements)
//   accrued  — what happened to them afterwards            <- this file
//
// Design: docs/superpowers/specs/2026-08-18-life-layer-design.md
//
// ── THIS FILE IS THE EXPENSIVE PART TO GET WRONG ──
//
// Events accrue forever. A bad `kind` vocabulary is very hard to migrate once
// there are thousands of rows, which is why the vocabulary lands before any
// generator, any database table or any UI — so that being wrong about it costs
// a JSON file rather than a migration.
//
// ── STATE IS DERIVED, NEVER STORED ──
//
// "Married to Raj" is not a field. It is a `wedding` with no later `divorce`.
// Two sources of truth for "are they together" is how a page ends up saying
// married in one section and single in another, and this project has had that
// bug in three other places already.
//
// ── EVERY EVENT CARRIES A STATUS FROM THE FIRST ROW ──
//
// `proposed` until it is approved; only `approved` reaches the wiki. The inbox
// that does the approving is not built yet, but "is this canon" has to be a
// property of the data from the beginning — bolting it on later means deciding
// retroactively what every existing row meant.

import { pronounsOf } from './pronouns-of.js';
/** A life track: a thing a character has a position on, that moves over time. */
export const TRACKS = {
  relationship: 'Relationship',
  family: 'Family',
  career: 'Career',
  education: 'Education',
  home: 'Home',
  public: 'Public life',
  health: 'Health',
  money: 'Money',
  legal: 'Legal',
  franchise: 'The franchise',
  small: 'Small things',
};

/** How loudly an event lands, which is what an approval policy switches on. */
export const SIGNIFICANCE = ['minor', 'notable', 'major'];

/**
 * The vocabulary.
 *
 * `key`      stored forever; NEVER rename one, add a new kind instead.
 * `track`    which position it moves.
 * `sig`      minor / notable / major — drives notification and approval policy.
 * `whom`     true when the event is about a second person and is meaningless
 *            without one.
 * `terminal` ends every track for this character, permanently.
 * `stage`    where it leaves the track's position, for the kinds that move one.
 * `line`     the sentence, as a function of (name, whom). Kept here rather than
 *            in the view so that the wiki, the feed and the inbox cannot phrase
 *            the same event three different ways.
 */
export const KINDS = [
  // ── relationship ───────────────────────────────────────────────────
  { key: 'dating', track: 'relationship', sig: 'notable', whom: true, stage: 'dating',
    line: (n, w) => `${n} and ${w} started seeing each other.` },
  { key: 'went-public', track: 'relationship', sig: 'notable', whom: true, stage: 'public',
    line: (n, w) => `${n} and ${w} went public with their relationship.` },
  { key: 'moved-in', track: 'relationship', sig: 'notable', whom: true, stage: 'living-together',
    line: (n, w) => `${n} and ${w} moved in together.` },
  { key: 'engaged', track: 'relationship', sig: 'major', whom: true, stage: 'engaged',
    line: (n, w) => `${n} and ${w} got engaged.` },
  { key: 'wedding', track: 'relationship', sig: 'major', whom: true, stage: 'married',
    line: (n, w) => `${n} and ${w} married.` },
  { key: 'separated', track: 'relationship', sig: 'major', whom: true, stage: 'separated',
    line: (n, w) => `${n} and ${w} separated.` },
  { key: 'divorced', track: 'relationship', sig: 'major', whom: true, stage: 'single',
    line: (n, w) => `${n} and ${w} divorced.` },
  // A breakup is not a divorce and the page must not say it is.
  { key: 'broke-up', track: 'relationship', sig: 'notable', whom: true, stage: 'single',
    line: (n, w) => `${n} and ${w} broke up.` },
  { key: 'quietly-ended', track: 'relationship', sig: 'minor', whom: true, stage: 'single',
    line: (n, w) => `${n} and ${w} quietly stopped seeing each other.` },

  // ── family ─────────────────────────────────────────────────────────
  { key: 'expecting', track: 'family', sig: 'major', whom: false,
    line: (n, w, pr) => `${n} announced ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} expecting.` },
  { key: 'birth', track: 'family', sig: 'major', whom: false,
    line: n => `${n} had a child.` },
  { key: 'estranged', track: 'family', sig: 'notable', whom: false,
    line: (n, w, pr) => `${n} became estranged from ${pr.posAdj} family.` },
  { key: 'reconciled', track: 'family', sig: 'notable', whom: false,
    line: (n, w, pr) => `${n} reconciled with ${pr.posAdj} family.` },

  // ── career ─────────────────────────────────────────────────────────
  { key: 'new-job', track: 'career', sig: 'minor', whom: false,
    line: n => `${n} started a new job.` },
  { key: 'promoted', track: 'career', sig: 'minor', whom: false,
    line: n => `${n} was promoted.` },
  { key: 'quit-job', track: 'career', sig: 'minor', whom: false,
    line: (n, w, pr) => `${n} left ${pr.posAdj} job.` },
  { key: 'laid-off', track: 'career', sig: 'notable', whom: false,
    line: n => `${n} was laid off.` },
  { key: 'started-business', track: 'career', sig: 'notable', whom: false,
    line: (n, w, pr) => `${n} started ${pr.posAdj} own business.` },

  // ── education ──────────────────────────────────────────────────────
  // A diploma is the END of a state, not a one-off: `enrolled` opens it and
  // `graduated` closes it, which is why both exist.
  { key: 'enrolled', track: 'education', sig: 'minor', whom: false, stage: 'studying',
    line: n => `${n} went back to school.` },
  { key: 'graduated', track: 'education', sig: 'notable', whom: false, stage: 'graduated',
    line: n => `${n} graduated.` },
  { key: 'dropped-out', track: 'education', sig: 'minor', whom: false, stage: 'none',
    line: n => `${n} dropped out.` },

  // ── home ───────────────────────────────────────────────────────────
  { key: 'moved-city', track: 'home', sig: 'notable', whom: false,
    line: n => `${n} moved city.` },
  { key: 'bought-home', track: 'home', sig: 'notable', whom: false,
    line: n => `${n} bought a place.` },
  { key: 'moved', track: 'home', sig: 'minor', whom: false,
    line: n => `${n} moved.` },

  // ── public life ────────────────────────────────────────────────────
  // Most of what the reference pages carry under "Post <show>".
  { key: 'red-carpet', track: 'public', sig: 'minor', whom: false,
    line: n => `${n} walked a red carpet.` },
  { key: 'interview', track: 'public', sig: 'minor', whom: false,
    line: (n, w, pr) => `${n} gave an interview about ${pr.posAdj} season.` },
  { key: 'podcast', track: 'public', sig: 'minor', whom: false,
    line: n => `${n} started a podcast.` },
  { key: 'brand-deal', track: 'public', sig: 'minor', whom: false,
    line: n => `${n} signed a brand deal.` },
  { key: 'hosted-comp', track: 'public', sig: 'notable', whom: false,
    line: n => `${n} returned to host a competition.` },
  { key: 'feud', track: 'public', sig: 'notable', whom: true,
    line: (n, w) => `${n} and ${w} fell out publicly.` },
  { key: 'made-up', track: 'public', sig: 'minor', whom: true,
    line: (n, w) => `${n} and ${w} made up.` },

  // ── health and loss ────────────────────────────────────────────────
  // All rare, all approved by hand. See the rate table in the design doc:
  // realism is a rate question, not a permission one.
  { key: 'illness', track: 'health', sig: 'major', whom: false,
    line: n => `${n} was seriously ill.` },
  { key: 'injury', track: 'health', sig: 'notable', whom: false,
    line: n => `${n} was injured.` },
  { key: 'recovered', track: 'health', sig: 'notable', whom: false,
    line: n => `${n} recovered.` },
  { key: 'bereavement', track: 'health', sig: 'major', whom: false,
    line: (n, w, pr) => `${n} lost someone close to ${pr.obj}.` },
  { key: 'death', track: 'health', sig: 'major', whom: false, terminal: true,
    line: n => `${n} died.` },
  { key: 'left-franchise', track: 'public', sig: 'major', whom: false, terminal: true,
    line: n => `${n} stepped away from the franchise.` },

  // ── money and the law ──────────────────────────────────────────────
  // The unglamorous side of being briefly famous, and very real for people who
  // won a large sum on television in their twenties.
  { key: 'came-into-money', track: 'money', sig: 'notable', whom: false,
    line: n => `${n} came into money.` },
  { key: 'lost-money', track: 'money', sig: 'notable', whom: false,
    line: (n, w, pr) => `${n} lost most of what ${pr.sub} had.` },
  { key: 'bankruptcy', track: 'money', sig: 'major', whom: false,
    line: n => `${n} filed for bankruptcy.` },
  { key: 'big-purchase', track: 'money', sig: 'minor', whom: false,
    line: (n, w, pr) => `${n} spent the winnings on something ${pr.sub} could not justify.` },
  { key: 'lawsuit', track: 'legal', sig: 'notable', whom: false,
    line: n => `${n} became involved in a lawsuit.` },
  { key: 'arrested', track: 'legal', sig: 'major', whom: false,
    line: n => `${n} was arrested.` },
  { key: 'charges-dropped', track: 'legal', sig: 'notable', whom: false,
    line: n => `The charges against ${n} were dropped.` },
  { key: 'scandal', track: 'legal', sig: 'major', whom: false,
    line: n => `${n} was at the centre of a scandal.` },
  { key: 'cancelled', track: 'legal', sig: 'major', whom: false,
    line: n => `${n} was widely condemned online.` },
  { key: 'forgiven', track: 'legal', sig: 'notable', whom: false,
    line: n => `The public moved on, and ${n} was quietly forgiven.` },

  // ── back to the franchise ──────────────────────────────────────────
  // Most of what a reference page's Post-show section actually consists of.
  { key: 'mentored', track: 'franchise', sig: 'notable', whom: false,
    line: n => `${n} returned to mentor a new cast.` },
  { key: 'reunion', track: 'franchise', sig: 'minor', whom: false,
    line: n => `${n} appeared at a reunion special.` },
  { key: 'spin-off', track: 'franchise', sig: 'notable', whom: false,
    line: n => `${n} signed on for a spin-off.` },
  { key: 'convention', track: 'franchise', sig: 'minor', whom: false,
    line: n => `${n} appeared at a fan convention.` },
  { key: 'rewatch-podcast', track: 'franchise', sig: 'minor', whom: false,
    line: (n, w, pr) => `${n} started a rewatch podcast about ${pr.posAdj} own season.` },
  { key: 'production-fallout', track: 'franchise', sig: 'notable', whom: false,
    line: n => `${n} fell out with production.` },
  { key: 'hall-of-fame', track: 'franchise', sig: 'major', whom: false,
    line: n => `${n} was inducted into the hall of fame.` },

  // ── vices and recovery ─────────────────────────────────────────────
  // The slow version of a hard time, where health carries the sudden version.
  // The sentences are deliberately plain: the design's craft note asks for the
  // shortest true sentence rather than the most dramatic one available.
  { key: 'sober', track: 'health', sig: 'major', whom: false,
    line: n => `${n} got sober.` },
  { key: 'relapse', track: 'health', sig: 'major', whom: false,
    line: n => `${n} relapsed.` },
  { key: 'rehab', track: 'health', sig: 'major', whom: false,
    line: n => `${n} went into treatment.` },
  { key: 'therapy', track: 'health', sig: 'notable', whom: false,
    line: n => `${n} started therapy.` },
  { key: 'burnout', track: 'health', sig: 'notable', whom: false,
    line: n => `${n} burned out.` },
  { key: 'year-off', track: 'career', sig: 'notable', whom: false,
    line: n => `${n} took a year off.` },
  { key: 'in-shape', track: 'health', sig: 'minor', whom: false,
    line: (n, w, pr) => `${n} got into the best shape of ${pr.posAdj} life.` },

  // ── small life ─────────────────────────────────────────────────────
  // The texture that makes the big events land, and what a low-fame character
  // has to post about. All minor, all auto-accept under a default policy.
  { key: 'pet', track: 'home', sig: 'minor', whom: false,
    line: n => `${n} got a dog.` },
  { key: 'tattoo', track: 'small', sig: 'minor', whom: false,
    line: n => `${n} got a new tattoo.` },
  { key: 'hobby', track: 'small', sig: 'minor', whom: false,
    line: n => `${n} took up something new.` },
  { key: 'travelling', track: 'small', sig: 'minor', whom: false,
    line: n => `${n} went travelling.` },
  { key: 'haircut', track: 'small', sig: 'minor', whom: false,
    line: (n, w, pr) => `${n} changed ${pr.posAdj} hair, and the internet had opinions.` },
  { key: 'flatmates', track: 'home', sig: 'minor', whom: true,
    line: (n, w) => `${n} moved in with ${w}.` },
  { key: 'learned', track: 'small', sig: 'minor', whom: false,
    line: (n, w, pr) => `${n} learned to do something ${pr.sub} had always meant to.` },
];

const BY_KEY = new Map(KINDS.map(k => [k.key, k]));

/** The definition for a stored kind, or null if the vocabulary has moved on. */
export const kindOf = key => BY_KEY.get(String(key || '')) || null;

/** minor | notable | major, defaulting to notable for a kind we no longer know. */
export const significanceOf = key => kindOf(key)?.sig || 'notable';

/** Terminal events end a character's tracks and remove them from casting. */
export const isTerminal = key => !!kindOf(key)?.terminal;

/**
 * Whether an event can arrive without being looked at.
 *
 * Two rules override any policy the author sets, per the design:
 *   - anything irreversible always asks. A wedding is undone by a divorce; a
 *     death is not, and must never slip through on a policy set months ago.
 *   - anything that contradicts authored text always asks (the caller supplies
 *     that judgement — this file cannot read a backstory).
 */
export function needsApproval(event, { policy = {}, contradictsAuthored = false } = {}) {
  if (isTerminal(event?.kind)) return true;
  if (contradictsAuthored) return true;
  const sig = significanceOf(event?.kind);
  return (policy[sig] || 'ask') === 'ask';
}

/**
 * Whether an event is about this character — from EITHER side.
 *
 * A two-person event is ONE event. Written per-player instead, the first draft
 * of this file gave Alejandro "living together with Lindsay" and Lindsay
 * "dating Alejandro" from the same relationship, because only one of the two
 * rows had been written. Two rows for one fact is the trap this whole module's
 * header warns about, reached in nine hand-written events.
 */
export const involves = (event, slug) => event?.player === slug || event?.whom === slug;

/**
 * The sentence for an event, told from `reader`'s side.
 *
 * The same wedding appears on two pages and should lead with whoever's page it
 * is — "Lindsay and Alejandro married" on hers, the reverse on his.
 */
export function lineFor(event, names = {}, reader = null, genders = null) {
  if (event?.headline) return String(event.headline);
  const def = kindOf(event?.kind);
  if (!def) return '';
  const flip = def.whom && reader && event.whom === reader && event.player !== reader;
  const subject = flip ? event.whom : event.player;
  const other = flip ? event.player : event.whom;
  const who = names[subject] || subject || 'They';
  const whom = names[other] || other || 'someone';
  // THE SUBJECT'S OWN PRONOUNS, when the caller knows them.
  //
  // Every one-person sentence here was written in singular they, so a character
  // whose gender is on the roster still read "Brick left their job" on his own
  // page — 25 of 170 approved events. `genders` is optional and absent means
  // they/them, which is what every one of these said before and is the only
  // honest answer when the roster has no gender to give.
  const g = genders ? (genders.get ? genders.get(subject) : genders[subject]) : null;
  const pr = pronounsOf(g);
  return def.whom ? def.line(who, whom, pr) : def.line(who, null, pr);
}

/**
 * Replay a character's events into the position they are in now.
 *
 * Only APPROVED events count. A proposal is a suggestion, and a suggestion must
 * not be able to change what a page says about somebody.
 *
 * Terminal events stop the replay: nothing that happened after somebody died
 * is a fact about their life, and an ordering slip should not be able to
 * resurrect them.
 */
export function deriveState(events = [], { seasonRank = null } = {}) {
  const state = {
    relationship: { stage: 'single', with: null },
    education: { stage: 'none' },
    children: 0,
    terminal: null,
    trackStage: {},
  };
  // ORDERED BY THE CALENDAR, NOT BY `seq`.
  //
  // `seq` restarts at 1 for every off-season the resolver runs, so replaying a
  // life that spans fifteen gaps by seq alone scrambles it. Found by measuring
  // rather than reading: a run produced eleven weddings and left nobody
  // married, because each wedding was being replayed before the dating that
  // preceded it. approvedFor learned this first; deriveState had not.
  const ordered = events
    .filter(e => e && e.status === 'approved')
    .slice()
    .sort(order(seasonRank));

  for (const e of ordered) {
    const def = kindOf(e.kind);
    if (!def) continue;
    if (def.terminal) { state.terminal = e.kind; break; }
    if (e.kind === 'birth') state.children += 1;
    if (!def.stage) continue;
    if (def.track === 'relationship') {
      state.relationship = {
        stage: def.stage,
        // A relationship that ended has no partner; one that advanced keeps
        // whoever it advanced with.
        with: def.stage === 'single' ? null : (e.whom || state.relationship.with),
      };
    }
    state.trackStage[def.track] = def.stage;
    if (def.track === 'education') state.education = { stage: def.stage };
  }
  return state;
}

/**
 * Approved events involving this character, oldest first — what an article lists.
 *
 * Either side of a two-person event, so one stored wedding shows on both pages.
 */
export function approvedFor(slug, events = [], { seasonRank = null } = {}) {
  return events
    .filter(e => e && involves(e, slug) && e.status === 'approved')
    .slice()
    .sort(order(seasonRank));
}

/**
 * Chronological: by the off-season it belongs to, then by `seq`.
 *
 * ORDERING BY `seq` ALONE IS WRONG, and it took four hand-written events to
 * show it. `seq` is per-player, so a shared event carries the numbering of
 * whoever's row it is — which listed Lindsay's life as td-8, td-13, td-8,
 * td-13. The season is the real spine; `seq` only separates two things that
 * happened in the same gap.
 *
 * `seasonRank` maps a seasonId to its place on the franchise calendar. Without
 * one, everything sorts as if it happened in the same gap and `seq` decides —
 * the old behaviour, which is right only for a single player's own events.
 */
export function order(seasonRank = null) {
  const rank = e => {
    if (!seasonRank) return 0;
    const r = seasonRank.get ? seasonRank.get(e.afterSeason) : seasonRank[e.afterSeason];
    // An event pinned to a season nobody has placed sorts last, for the same
    // reason an unplaced season does: it must not silently become the earliest.
    return r == null ? Number.MAX_SAFE_INTEGER : r;
  };
  return (a, b) => rank(a) - rank(b) || (a.seq || 0) - (b.seq || 0);
}

/**
 * That character's position now, from every event they are part of.
 *
 * Takes the whole log rather than a pre-filtered list, because filtering by
 * `player` alone is exactly the mistake that produced two different answers for
 * one relationship.
 */
export function stateOf(slug, events = [], { seasonRank = null } = {}) {
  const mine = events.filter(e => involves(e, slug));
  const st = deriveState(mine, { seasonRank });
  // "with" must be the OTHER person, whichever side of the row they sat on.
  if (st.relationship.with === slug) {
    const last = mine.filter(e => e.status === 'approved' && kindOf(e.kind)?.track === 'relationship')
      .sort(order(seasonRank)).pop();
    st.relationship.with = last ? (last.player === slug ? last.whom : last.player) : null;
  }
  return st;
}
