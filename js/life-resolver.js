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
  // Where each season sits on the franchise calendar. Without it a life that
  // spans several off-seasons replays in the wrong order, because `seq` starts
  // again at 1 on every resolution.
  seasonRank = null,
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

  let seq = 0;
  const emit = (player, kind, extra = {}) => {
    out.push({
      player, kind, afterSeason: season.seasonId, seq: ++seq, status: 'proposed', ...extra,
    });
  };

  for (const career of careers) {
    const slug = career.id;
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
    } else if (stage === 'single') {
      const candidate = pairFor(slug);
      const ckey = candidate ? pairKey(slug, candidate) : null;
      if (candidate && !settled.has(ckey) && rng('start')() < RATES.advance.single) {
        settled.add(ckey);
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
      if (k) emit(slug, k.key, k.whom ? { whom: pairFor(slug) || partner } : {});
    }
    // Fame buys VOLUME and access to the public-life kinds — never a different
    // chance of something hard happening.
    if (ord() < RATES.publicLife * fame) {
      const k = pick(ord, kindsOn(['public', 'franchise']));
      if (k && !(k.whom && !partner)) emit(slug, k.key, k.whom ? { whom: partner } : {});
    }
    if (ord() < RATES.extraOrdinary * (0.4 + fame)) {
      const k = pick(ord, kindsOn(ORDINARY_TRACKS));
      if (k) emit(slug, k.key, k.whom ? { whom: pairFor(slug) || partner } : {});
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
