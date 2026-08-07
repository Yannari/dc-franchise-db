// Career fame: how big a deal a player is across the whole franchise.
//
// One number, 0 to 5 stars, covering every show a person has ever been on. It
// grows with what they did on screen, fades while they are off it, and locks
// forever at five.
//
// DERIVED, NEVER STORED. Fame decays while a player is off air, which makes it a
// function of WHEN you ask rather than of the player's own record: publishing a
// new season changes the fame of somebody who last played six seasons ago,
// without them doing anything. A stored field would therefore have to be
// rewritten for every player on every export, and the first export path that
// forgot would leave the file disagreeing with reality in silence. See
// docs/superpowers/multishow-followups.md section 4 for the nine career totals
// that drifted between two stored copies exactly that way.
//
// The five-star lock is what makes derivation possible without state: walking
// the season timeline answers "was this player ever famous" for free.
//
// This module imports nothing from the DOM and nothing from the simulator, and
// has no side effects — which is what lets the site use it now and the simulator
// use it later. Markup lives in js/fame-stars.js.

/** Score at which each half-star is reached. Ascending; below the first is 0. */
export const STAR_THRESHOLDS = [
  [5, 0.5], [12, 1], [20, 1.5], [30, 2], [40, 2.5],
  [52, 3], [64, 3.5], [76, 4], [86, 4.5], [95, 5],
];

/** Stars for a raw score. Thresholds, not division — the gates have to bite. */
export function starsFromScore(score) {
  let stars = 0;
  for (const [at, value] of STAR_THRESHOLDS) {
    if (score >= at) stars = value;
  }
  return stars;
}

/** What each tier is worth. Anything not listed is neutral, never zero. */
export const RANK_MULTIPLIER = {
  'S+': 1.5, 'S': 1.35, 'A': 1.2, 'B': 1.05, 'C': 0.9, 'D': 0.75,
};

/**
 * How well regarded this player is ON THIS SHOW.
 *
 * `rankings` is one board or an array of them — a board per show, identified by
 * `metadata.format`. The live file predates the second show and carries no tag,
 * so an untagged board is Total Drama's.
 *
 * Falls back to 1.0 — neutral — when the show has no board yet or the player is
 * not on it. Zero would silently erase a whole show's careers, and Big Brother
 * has no board at the time of writing: its board comes from current-season.html's
 * rankings pipeline once sub-project E makes that format-aware.
 */
export function showRankMultiplier(playerId, format, rankings) {
  const boards = Array.isArray(rankings) ? rankings : [rankings];
  for (const board of boards) {
    if (!board) continue;
    const boardFormat = board.metadata?.format || 'total-drama';
    if (boardFormat !== format) continue;
    const row = (board.rankings || []).find(r => r.playerId === playerId);
    if (row) return RANK_MULTIPLIER[row.tier] ?? 1;
  }
  return 1;
}

const PREFIX = { 'total-drama': 'td', 'big-brother': 'bb' };

/**
 * Every season the franchise has produced, in the order it produced them.
 *
 * The order is the order seasons_database.json lists them, which is publication
 * order. Two shows airing at once is out of scope — that would need a real date
 * field on the season record, and nothing writes one.
 */
export function seasonChronology(seasonsDb) {
  return (seasonsDb?.seasons || []).map(s => {
    const format = s.format || 'total-drama';
    return {
      seasonId: s.seasonId || `${PREFIX[format] || format}-${s.seasonNumber}`,
      format,
      seasonNumber: s.seasonNumber,
      awards: s.awards || {},
    };
  });
}

/** What finishing in each position is worth. */
export const PLACEMENT_BASE = {
  'Winner': 22, 'Runner-up': 16, 'Finalist': 13, 'Jury': 8, 'Pre-jury': 3,
};

/**
 * One vocabulary for how far somebody got, out of the several the franchise uses.
 *
 * The two shows and fifteen seasons of history do not agree on these strings.
 * players_database.json holds `Juror`, `Pre-Juror` and `Pre-Merge`; the Big
 * Brother export writes `Jury` and `Pre-Jury`; nothing writes `Runner-up` at all,
 * because Total Drama records a runner-up as a `Finalist`. Matching the literal
 * strings scored 226 of 262 season details at zero — a career of nothing for
 * almost everybody, which reads as "the weights need tuning" rather than as a
 * bug, and that is exactly how it would have survived.
 *
 * `Pre-` is checked before `jur`, or `Pre-Juror` answers to both.
 */
export function normaliseStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'winner') return 'Winner';
  if (s.startsWith('runner')) return 'Runner-up';
  if (s.startsWith('pre')) return 'Pre-jury';       // Pre-Juror, Pre-Merge, Pre-Jury
  if (s === 'finalist') return 'Finalist';
  if (s.includes('jur')) return 'Jury';             // Juror, Jury
  return null;
}

const AWARD_POINTS = { fanFavorite: 10, bestStrategic: 4, mostChallengeWins: 4 };
// 18 is the sum of all three, so the cap does not bind today — it is a guard for
// the day the awards block grows. The spec said 12 while also saying the cap
// "only binds if the block grows later", which cannot both be true: at 12, Fan
// Favourite plus any one other award already hits the ceiling, leaving the other
// two awards worth 2 points between them. The sentence describes the intent; the
// number contradicted it.
const AWARD_CAP = 18;

/**
 * How the audience received this player, 0.5 to 1.5.
 *
 * By RANK within the season, never by raw value: the raw numbers are unbounded
 * and scale differently season to season, so one season's 1.2x would be
 * another's 0.7x, and a single outlier would compress everybody else onto the
 * floor.
 *
 * Neutral when the season recorded no popularity at all — which is every season
 * exported before popularity was written out, and is not recoverable from the
 * published files.
 */
export function popularityFactor(playerId, cohort) {
  const rated = (cohort || []).filter(d => Number.isFinite(d.popularity));
  if (rated.length < 2) return 1;
  // No spread means no signal. The export writes 0 rather than nothing when a
  // player has no popularity, so a season that never tracked it arrives as a
  // cohort of identical zeroes — and ranking those would hand out 1.5 down to
  // 0.5 on nothing but array order, inventing an audience reaction that never
  // happened. A flat cohort is unrated, not unanimous.
  if (rated.every(d => d.popularity === rated[0].popularity)) return 1;
  const sorted = [...rated].sort((a, b) => b.popularity - a.popularity);
  const idx = sorted.findIndex(d => d.playerId === playerId);
  if (idx < 0) return 1;
  // Most popular 1.5, least 0.5, linear by position.
  return 1.5 - (idx / (sorted.length - 1));
}

/** The three awards seasons_database.json stores, capped. */
export function seasonAwardPoints(playerId, season) {
  let points = 0;
  for (const [key, value] of Object.entries(AWARD_POINTS)) {
    if (season?.awards?.[key]?.playerSlug === playerId) points += value;
  }
  return Math.min(points, AWARD_CAP);
}

/** What one season adds to a career. */
export function seasonGain({ playerId, detail, season, cohort, rankings }) {
  const base = PLACEMENT_BASE[normaliseStatus(detail?.status)] || 0;
  if (!base) return 0;
  const reception = popularityFactor(playerId, cohort);
  const awards = seasonAwardPoints(playerId, season);
  return (base * reception + awards) * showRankMultiplier(playerId, season.format, rankings);
}

/**
 * Fame kept per season spent off air — proportional, not a flat subtraction.
 *
 * The spec said a flat 1.2 a season, and measuring it against the real roster
 * showed why that is the wrong shape: a flat charge erases a small career
 * outright while barely scratching a large one. A single pre-jury season is
 * worth about 7 points, so six seasons away took it to nothing, and 69% of the
 * franchise sat at half a star or less with no way to tell any of them apart.
 * That inverts what decay is for — the big names are supposed to be the ones
 * that persist.
 *
 * Proportional fade keeps the ordering of careers intact and never quite reaches
 * zero: over the fifteen seasons that exist, an absent player loses about 13% of
 * their standing. That is "very slowly", and it moved the middle of the roster
 * from 28% to 42%.
 */
const DECAY_FACTOR = 0.99;
const MULTI_SHOW_BONUS = 8;
const MULTI_SHOW_CAP = 16;
const RECORD_POINTS = 6;
const RECORD_CAP = 12;
const LOCK_SCORE = 95;
const LOCK_MIN_SEASONS = 2;

/**
 * How many franchise records this player holds.
 *
 * The records nest two or three levels deep under four categories, and every
 * holder object carries a playerSlug — so this walks the tree rather than
 * hardcoding its shape, and a new record category counts itself.
 */
export function recordsHeld(playerId, franchiseDb) {
  let held = 0;
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (node.playerSlug) {
      if (node.playerSlug === playerId) held++;
      return;                       // a holder is a leaf; do not descend into it
    }
    Object.values(node).forEach(walk);
  };
  walk(franchiseDb?.records);
  return held;
}

const detailKey = d => d.seasonId || `${PREFIX[d.format || 'total-drama'] || d.format}-${d.season}`;

/**
 * Fame for every player, walked season by season.
 *
 * One pass over the franchise's chronology per player: accrue for the seasons
 * they were in, decay for the ones they missed, lock at five stars the moment
 * they get there.
 */
export function computeFame({ players, rankings, seasons, franchise } = {}) {
  const chronology = seasonChronology(seasons);
  const roster = players?.players || [];

  // Everybody's details for a given season, so popularity can be ranked within it.
  const cohorts = new Map();
  for (const p of roster) {
    for (const d of p.seasonDetails || []) {
      const key = detailKey(d);
      if (!cohorts.has(key)) cohorts.set(key, []);
      cohorts.get(key).push({ ...d, playerId: p.id });
    }
  }

  const out = new Map();
  for (const p of roster) {
    const mine = new Map();
    for (const d of p.seasonDetails || []) mine.set(detailKey(d), d);

    let score = 0;
    let locked = false;
    let seasonsPlayed = 0;
    let bonusPaid = 0;
    const shows = [];
    const timeline = [];
    // Records reflect a finished career, so they land on the last appearance.
    const lastPlayed = chronology.filter(s => mine.has(s.seasonId)).slice(-1)[0]?.seasonId;

    for (const season of chronology) {
      const detail = mine.get(season.seasonId);

      if (!detail) {
        if (locked) continue;
        const delta = score * DECAY_FACTOR - score;      // negative, never past 0
        if (delta) {
          score += delta;
          timeline.push({ seasonId: season.seasonId, event: 'missed', delta, score });
        }
        continue;
      }

      seasonsPlayed++;
      const gain = seasonGain({ playerId: p.id, detail, season,
        cohort: cohorts.get(season.seasonId) || [], rankings });
      score += gain;
      timeline.push({ seasonId: season.seasonId, event: 'played', delta: gain, score });

      // A second or third show raises the ceiling — it does not grant the star.
      if (!shows.includes(season.format)) {
        shows.push(season.format);
        if (shows.length > 1 && bonusPaid < MULTI_SHOW_CAP) {
          const delta = Math.min(MULTI_SHOW_BONUS, MULTI_SHOW_CAP - bonusPaid);
          bonusPaid += delta;
          score += delta;
          timeline.push({ seasonId: season.seasonId, event: 'multi-show', delta, score });
        }
      }

      if (season.seasonId === lastPlayed) {
        const delta = Math.min(recordsHeld(p.id, franchise) * RECORD_POINTS, RECORD_CAP);
        if (delta) {
          score += delta;
          timeline.push({ seasonId: season.seasonId, event: 'records', delta, score });
        }
      }

      // Famous and impossible to forget.
      if (!locked && score >= LOCK_SCORE && seasonsPlayed >= LOCK_MIN_SEASONS) {
        locked = true;
        timeline.push({ seasonId: season.seasonId, event: 'locked', delta: 0, score });
      }
    }

    // The gate, enforced at the end as well as at the lock: a one-season career
    // can climb past the threshold and must still be held below five.
    let stars = starsFromScore(score);
    if (stars === 5 && seasonsPlayed < LOCK_MIN_SEASONS) stars = 4.5;

    out.set(p.id, { stars, score: Math.round(score * 100) / 100,
      locked, seasonsPlayed, shows, timeline });
  }
  return out;
}

/**
 * Fame for one player. The read API the simulator would call — same databases,
 * same shape — so wiring fame into gameplay later is a call, not a redesign.
 */
export function fameOf(playerId, dbs) {
  return computeFame(dbs).get(playerId)
    || { stars: 0, score: 0, locked: false, seasonsPlayed: 0, shows: [], timeline: [] };
}
