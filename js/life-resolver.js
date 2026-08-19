// The off-season: what happens to everybody between two seasons.
//
// Design: docs/superpowers/specs/2026-08-18-life-layer-design.md
// Vocabulary and state: js/life-events.js
//
// Emits PROPOSED events. Nothing here decides canon — the inbox does, and
// everything below is a suggestion until somebody approves it.
//
// ── FOUR RULES, FROM THE DESIGN ──
//
// 1. RNG DOMINATES, FACTORS TILT. A high-social player is never owed the
//    wedding. Every roll below is a base rate nudged by at most a small factor,
//    never a threshold that decides the outcome. This is the author's own rule
//    and the reason the results feel like a life rather than a stat readout.
//
// 2. QUIET GAPS DRIFT; BEING CAST IS THE TEST. Nobody cast and things move
//    gently forward. One partner cast alone is the hardest test there is —
//    three months on camera, shipped with somebody else, an edit that may be
//    unkind. Both cast together is a different strain.
//
// 3. FAME CHANGES VISIBILITY, NOT INCIDENCE. A winner and a 16th-place boot are
//    equally likely to have a hard year. The winner has more of it happen in
//    public, and more of the public-life kinds available at all.
//
// 4. MOST GAPS ARE ORDINARY. The rates below are deliberately small. If a
//    resolved off-season reads like a soap, the numbers are wrong, not the
//    idea — tune RATES against played output rather than trusting this table.
//
// ── DETERMINISM ──
//
// Every roll is seeded from (season, player, what is being decided) rather than
// drawn from one shared stream. Resolving the same off-season twice gives the
// same answer, and adding a player to the franchise does not change what
// happens to everybody else — which a single stream would do, silently, and
// which would make an approved inbox impossible to reproduce.
import { KINDS, kindOf, stateOf } from './life-events.js';
import { couldBeInterested } from './attraction.js';

/**
 * A seeded stream from a key. Copied from js/bb/knowledge.js, deliberately.
 *
 * Importing it from there pulls in core.js and therefore localStorage, so a
 * life resolver could not run outside a browser and a test could not touch it
 * without booting the whole simulator. Twelve lines of pure hash is a better
 * trade than that dependency, and the direction is wrong anyway: the life layer
 * has no business importing the Big Brother engine.
 *
 * If a third caller ever wants it, move it to a leaf module and have all three
 * import that — do not let a fourth copy appear.
 */
function stableRng(...parts) {
  let seed = 2166136261;
  const key = parts.join('|');
  for (let i = 0; i < key.length; i++) seed = Math.imul(seed ^ key.charCodeAt(i), 16777619);
  seed >>>= 0;
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The relationship track, in order.
 *
 * Advancing means moving exactly one step. You do not get married from dating,
 * and the chance of taking each step falls as it gets more serious — which is
 * what makes a wedding rare without ever forbidding one.
 */
export const STAGES = ['single', 'dating', 'public', 'living-together', 'engaged', 'married'];

/** The kind that moves you from each stage to the next. */
const ADVANCE_KIND = {
  single: 'dating',
  dating: 'went-public',
  public: 'moved-in',
  'living-together': 'engaged',
  engaged: 'wedding',
};

/**
 * Everything tunable, in one table.
 *
 * Read as "chance per off-season". Tune against played output — the comment at
 * the top of this file is not decoration: a table that looks plausible in a
 * document is exactly how the comp-domination and broken-promise rates went
 * wrong before they were measured.
 */
export const RATES = {
  // ── relationships ──
  // Falling as it gets more serious, then rising again once engaged: people who
  // get engaged usually do marry, and the rarity should live in reaching the
  // engagement rather than in the wedding that follows it.
  advance: {
    single: 0.16,               // finding somebody at all
    dating: 0.34,
    public: 0.22,
    'living-together': 0.14,
    engaged: 0.40,
  },
  // Ending it. `quietly-ended` and `broke-up` for the unmarried, `separated`
  // then `divorced` for the married — a breakup is not a divorce.
  end: { dating: 0.22, public: 0.16, 'living-together': 0.10, engaged: 0.08, married: 0.02 },
  // What being cast does to it. Multipliers on the end rate, per rule 2.
  test: { castAlone: 2.6, castTogether: 1.5, neitherCast: 1.0 },
  // A child needs a settled position and is still uncommon.
  birth: 0.07,
  // ── the rest of a life ──
  enrol: 0.05,
  graduate: 0.45,               // once studying, it does finish
  ordinary: 0.55,               // at least one unremarkable thing happened
  extraOrdinary: 0.30,          // and sometimes a second
  rare: 0.05,                   // illness, legal trouble, money trouble
  // Fame only opens the public-life kinds and adds volume; it never changes
  // whether a hard thing happens.
  publicLife: 0.45,
};

/**
 * Who everybody knows, and how they feel about them.
 *
 * ── WHY THIS EXISTS ──
 *
 * The first resolver only knew about showmances from the season that had just
 * ended. Two people who played three seasons together and loathed each other
 * throughout were no more likely to interact than strangers, which is exactly
 * backwards: sharing a season IS the relationship, and a returnee has more of
 * them. The author put it plainly — same-season characters are more likely to
 * interact, because there is a bond there, positive or negative.
 *
 * Built from what the record already holds and nothing was reading:
 * `alliances` and `unbreakableBonds` are lists of PEOPLE, not alliance names,
 * and `rivalries` is the same in the other direction.
 *
 * Weights are deliberately coarse. This decides WHO a two-person event is
 * about, never whether one happens, so precision here would be false.
 */
export function socialGraph(careers = []) {
  const byName = new Map(careers.map(c => [c.name, c.id]));
  const edges = new Map();      // slug -> Map(otherSlug -> weight)
  const bump = (a, b, w) => {
    if (!a || !b || a === b) return;
    if (!edges.has(a)) edges.set(a, new Map());
    edges.get(a).set(b, (edges.get(a).get(b) || 0) + w);
  };
  for (const c of careers) {
    for (const d of c.details || []) {
      for (const n of d.unbreakableBonds || []) { const o = byName.get(n); bump(c.id, o, 3); bump(o, c.id, 3); }
      for (const n of d.alliances || []) { const o = byName.get(n); bump(c.id, o, 1); bump(o, c.id, 1); }
      for (const n of d.rivalries || []) { const o = byName.get(n); bump(c.id, o, -2); bump(o, c.id, -2); }
      // ── the romance the season contained ──
      //
      // A showmance that lasted is the strongest tie two people can leave a
      // season with. One that broke on screen is the answer to "what happens to
      // a showmance that ends in episode nine": it leaves no relationship, but
      // it does not leave nothing — they are people with a charge between them,
      // which is what makes a public falling-out or a reconciliation reachable
      // in the off-season instead of vanishing without trace.
      if (d.showmance) {
        const o = byName.get(d.showmance);
        const w = d.showmanceEnded === 'broken' ? -1.5 : 4;
        bump(c.id, o, w); bump(o, c.id, w);
      }
    }
  }
  return edges;
}

/**
 * Somebody they know, on the side of the ledger this event needs.
 *
 * `want` is 'friend' or 'enemy'. Returns null when they have nobody of that
 * kind — and the caller drops the event rather than pairing them with a
 * stranger, because "fell out publicly with somebody they have never met" is
 * worse than no event at all.
 */
function knownTo(graph, slug, want, rng, allow = null) {
  const row = graph?.get(slug);
  if (!row) return null;
  // Filtered BEFORE the draw, not after. Picking somebody and then rejecting
  // them would quietly drop the event instead of choosing somebody eligible.
  const pool = [...row.entries()].filter(([other, w]) =>
    (want === 'enemy' ? w < 0 : w > 0) && (!allow || allow(other)));
  if (!pool.length) return null;
  // Weighted by how strongly they feel: the person you fell out with most is
  // the likeliest to be the one it flares up with again.
  const total = pool.reduce((n, [, w]) => n + Math.abs(w), 0);
  let roll = rng() * total;
  for (const [other, w] of pool) { roll -= Math.abs(w); if (roll <= 0) return other; }
  return pool[0][0];
}

/** Kinds a character can have when nothing in particular is going on. */
const ORDINARY_TRACKS = ['career', 'home', 'small'];
const RARE_TRACKS = ['health', 'legal', 'money'];

const kindsOn = tracks => KINDS.filter(k => tracks.includes(k.track) && !k.terminal && !k.stage);
const pick = (rng, xs) => xs[Math.floor(rng() * xs.length)] || null;

/**
 * Fame as a 0..1 dial.
 *
 * Derived from the record rather than stored: a winner is famous, a 16th-place
 * boot is not, and returning repeatedly keeps you in view.
 */
export function fameOf(career) {
  if (!career) return 0;
  const wins = career.wins || 0;
  const seasons = career.seasonsPlayed || 0;
  const best = career.bestPlacement || 99;
  const fromWins = Math.min(1, wins * 0.45);
  const fromSeasons = Math.min(0.35, (seasons - 1) * 0.12);
  const fromBest = best <= 2 ? 0.2 : best <= 5 ? 0.1 : 0;
  return Math.min(1, fromWins + fromSeasons + fromBest);
}

/**
 * Resolve one off-season into proposed events.
 *
 * `season`  the season that just ended — events are pinned after it.
 * `careers` every career, for names and fame.
 * `events`  the log so far, which is what each position is derived from.
 * `cast`    slugs who played the season that just ended.
 * `pairs`   plausible couples — showmances from the season, usually — as
 *           [slugA, slugB]. Without any, nobody new gets together, which is
 *           correct: the resolver should not invent a couple out of nothing.
 */
export function resolveOffSeason({
  season, careers = [], events = [], cast = [], pairs = [], seedSalt = '',
  // Who knows whom. Built once by the caller and passed in, since it is the
  // same for every player in one resolution.
  graph = null,
  // Where each season sits on the franchise calendar. Without it a life that
  // spans several off-seasons replays in the wrong order, because `seq` starts
  // again at 1 on every resolution.
  seasonRank = null,
  // Who each character is: slug -> { gender, sexuality }, off the roster.
  // Without it the resolver pairs people off the social graph, which knows who
  // is close to whom and nothing whatever about who anybody is attracted to.
  people = null,
} = {}) {
  if (!season?.seasonId) return [];
  const out = [];
  const castSet = new Set(cast);
  const pairFor = slug => {
    const p = pairs.find(x => x[0] === slug || x[1] === slug);
    return p ? (p[0] === slug ? p[1] : p[0]) : null;
  };
  // Handled once per couple: a relationship is ONE event, so resolving it from
  // both sides would either duplicate it or, worse, move it two stages.
  const settled = new Set();
  const pairKey = (a, b) => [a, b].sort().join('|');
  // ── WHO IS ALREADY WITH SOMEBODY ──
  //
  // `settled` only stopped the same PAIR being handled twice. It said nothing
  // about a person, so Leshawna could go public with Owen and then be picked as
  // Trent's new partner in the same off-season — she was never asked whether
  // she was available, only whether that exact couple had come up before.
  //
  // Two ways to be unavailable, and both were missing. Taken THIS resolution,
  // tracked below; and already in a relationship from an earlier one, which is
  // in the log and simply was never read for anybody but the subject.
  const taken = new Set();
  // Memoised: asked once per candidate per draw, and each answer walks the
  // whole log. It cannot go stale within a resolution because the only thing
  // that changes somebody's availability mid-round is `taken`, which is checked
  // separately.
  const stageCache = new Map();
  const stageOf = who => {
    if (!stageCache.has(who)) stageCache.set(who, stateOf(who, events, { seasonRank }).relationship.stage);
    return stageCache.get(who);
  };
  const singleNow = who => !taken.has(who) && stageOf(who) === 'single';
  const social = graph || socialGraph(careers);

  /**
   * The other person for a two-person event, or null to drop it.
   *
   * A feud is with somebody you have history with; moving in is with somebody
   * you like. Falling back to a random name would produce a page saying two
   * strangers fell out, which reads as noise rather than as a life.
   */
  const otherFor = (kind, slug, rng, partner) => {
    // `here` only: a feud with somebody who has not been on television yet is
    // the same anachronism as dating them.
    const here = other => debuted.has(other);
    if (kind === 'feud' || kind === 'made-up') return knownTo(social, slug, 'enemy', rng, here);
    return partner || knownTo(social, slug, 'friend', rng, here);
  };

  // ── WHO EXISTS YET ──
  //
  // The franchise record is the whole franchise, including people whose first
  // season has not aired at this point on the calendar. Resolving over all of
  // them gave a character an off-season — and a Dramagram post — before their
  // debut, which is a stranger with a public life and no reason to have one.
  //
  // Their debut is the earliest season they played that has a date. Somebody
  // whose seasons are all undated is left in rather than dropped: unplaced is
  // missing information, not proof they belong to the future.
  const hereKey = seasonRank ? seasonRank.get(season.seasonId) : null;
  const debutKey = career => {
    let best = null;
    for (const d of career?.details || []) {
      const k = seasonRank ? seasonRank.get(d.seasonId) : null;
      if (k != null && (best == null || k < best)) best = k;
    }
    return best;
  };
  const debuted = new Set(careers
    .filter(c => hereKey == null || debutKey(c) == null || debutKey(c) <= hereKey)
    .map(c => c.id));

  /**
   * Could these two plausibly START something: both on the air, both free, and
   * interested. `b` is the candidate; `a` has already been found single by the
   * branch that calls this.
   */
  const canDate = (a, b) => debuted.has(b) && singleNow(b)
    && (!people || couldBeInterested(people.get(a), people.get(b)));

  let seq = 0;
  const emit = (player, kind, extra = {}) => {
    out.push({
      player, kind, afterSeason: season.seasonId, seq: ++seq, status: 'proposed', ...extra,
    });
  };

  for (const career of careers) {
    const slug = career.id;
    if (!debuted.has(slug)) continue;
    const state = stateOf(slug, events, { seasonRank });
    // Somebody whose tracks have ended has no off-season. Nothing after a death
    // is a fact about their life.
    if (state.terminal) continue;

    const rng = what => stableRng('life', seedSalt, season.seasonId, slug, what);
    const fame = fameOf(career);

    // ── the relationship ──
    const stage = state.relationship.stage;
    const partner = state.relationship.with;
    const key = partner ? pairKey(slug, partner) : null;

    if (stage !== 'single' && partner && !settled.has(key)) {
      settled.add(key);
      // Both are spoken for this round whatever happens next — including a
      // break-up. Somebody who has just separated does not start something new
      // in the same off-season.
      taken.add(slug); taken.add(partner);
      const r = rng('rel');
      // Rule 2: being cast is the test. One of them alone is the hard version.
      const aIn = castSet.has(slug);
      const bIn = castSet.has(partner);
      const strain = aIn && bIn ? RATES.test.castTogether
        : (aIn || bIn) ? RATES.test.castAlone
        : RATES.test.neitherCast;
      const endChance = (RATES.end[stage] || 0) * strain;

      if (r() < endChance) {
        // A marriage separates before it divorces; anything else just ends, and
        // how loudly depends on how public it was.
        const kind = stage === 'married' ? 'separated'
          : stage === 'engaged' || stage === 'living-together' ? 'broke-up'
          : (r() < 0.5 ? 'quietly-ended' : 'broke-up');
        emit(slug, kind, { whom: partner });
      } else if (r() < (RATES.advance[stage] || 0)) {
        const kind = ADVANCE_KIND[stage];
        if (kind) emit(slug, kind, { whom: partner });
      } else if (['living-together', 'engaged', 'married'].includes(stage)
        && r() < RATES.birth) {
        emit(slug, 'birth');
      }
    } else if (stage === 'single' && !taken.has(slug)) {
      // `taken`, not just `stage`: somebody chosen as a partner earlier in this
      // loop still reads as single in the log — the event proposing it has not
      // been written there — so without this they would go on to start a second
      // relationship of their own in the same off-season.
      // A showmance first, then somebody they are genuinely close to. A
      // relationship with a stranger is the one thing the resolver must not
      // invent, so with neither, nothing happens.
      // A showmance from the season is the first candidate — the simulator has
      // already checked that pairing — and a close friend is the fallback. Both
      // go through canDate: the graph is a record of who matters to whom, and
      // being important to somebody is not the same as being their type.
      const showmance = pairFor(slug);
      const candidate = (showmance && canDate(slug, showmance) ? showmance : null)
        || knownTo(social, slug, 'friend', rng('who'), other => canDate(slug, other));
      const ckey = candidate ? pairKey(slug, candidate) : null;
      if (candidate && !settled.has(ckey) && rng('start')() < RATES.advance.single) {
        settled.add(ckey);
        taken.add(slug); taken.add(candidate);
        emit(slug, 'dating', { whom: candidate });
      }
    }

    // ── education: a diploma is the end of a state, not a one-off ──
    if (state.education.stage === 'studying') {
      if (rng('edu')() < RATES.graduate) emit(slug, 'graduated');
    } else if (state.education.stage !== 'graduated' && rng('edu')() < RATES.enrol) {
      emit(slug, 'enrolled');
    }

    // ── the ordinary, which is most of it ──
    const ord = rng('ord');
    if (ord() < RATES.ordinary) {
      const k = pick(ord, kindsOn(ORDINARY_TRACKS));
      if (k) {
        const whom = k.whom ? otherFor(k.key, slug, ord, partner) : null;
        if (!k.whom || whom) emit(slug, k.key, k.whom ? { whom } : {});
      }
    }
    // Fame buys VOLUME and access to the public-life kinds — never a different
    // chance of something hard happening.
    if (ord() < RATES.publicLife * fame) {
      const k = pick(ord, kindsOn(['public', 'franchise']));
      if (k) {
        const whom = k.whom ? otherFor(k.key, slug, ord, null) : null;
        if (!k.whom || whom) emit(slug, k.key, k.whom ? { whom } : {});
      }
    }
    if (ord() < RATES.extraOrdinary * (0.4 + fame)) {
      const k = pick(ord, kindsOn(ORDINARY_TRACKS));
      if (k) {
        const whom = k.whom ? otherFor(k.key, slug, ord, partner) : null;
        if (!k.whom || whom) emit(slug, k.key, k.whom ? { whom } : {});
      }
    }

    // ── the rare ──
    const rare = rng('rare');
    if (rare() < RATES.rare) {
      const k = pick(rare, kindsOn(RARE_TRACKS));
      if (k) emit(slug, k.key);
    }
  }

  // A two-person kind with nobody to be about is meaningless; drop rather than
  // ship a row the inbox cannot render.
  return out.filter(e => !(kindOf(e.kind)?.whom && !e.whom));
}

/** A one-line summary of a resolution, for the log and the inbox. */
export function summarise(events = []) {
  const byTrack = {};
  for (const e of events) {
    const t = kindOf(e.kind)?.track || 'other';
    byTrack[t] = (byTrack[t] || 0) + 1;
  }
  return { total: events.length, byTrack };
}
