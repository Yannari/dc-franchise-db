// Dramagram — the directory, and the number under every face.
//
// Design: docs/superpowers/specs/2026-08-18-dramagram-design.md
//
// ── FOLLOWERS ARE REPLAYED, NEVER STORED ──
//
// A stored count and the record it came from disagree eventually; the trivia,
// the records and the life state are all derived for the same reason. So a
// follower count is computed by walking somebody's whole history in calendar
// order, and it can never drift from the seasons and events it is made of.
//
// ── THE DECAY IS THE POINT ──
//
// Growth alone makes the number a fame score with commas, where whoever won
// first outranks a current star forever. With decay, a winner spikes, bleeds
// through two quiet years, and spikes again on returning — so the number tells
// a career, and coming back is visibly worth something.
//
// The curve below is a first guess and is meant to be measured rather than
// trusted: a plausible-looking table is exactly how the competition-domination
// rates and the relationship rates both went wrong before anybody counted them.
import { airKey, byAirDate } from './franchise-calendar.js';
import { kindOf, significanceOf, approvedFor, lineFor, stateOf } from './life-events.js';

/** Everything tunable about the number, in one place. */
export const FOLLOWERS = {
  debut: 12000,                 // simply being on television
  perSeason: 9000,              // and doing it again
  win: 120000,                  // winning is the cliff
  runnerUp: 38000,
  finalist: 16000,
  // A life event is worth something to the extent anybody noticed it.
  perEvent: { minor: 400, notable: 3500, major: 22000 },
  // A season you were not in costs you a slice of what you have. Proportional
  // rather than flat: losing 4% of 300k is a story, losing 4% of 12k is noise,
  // and that asymmetry is correct.
  quietDecay: 0.045,
  floor: 800,                   // nobody ends at zero; the account still exists
};

/** Fame thresholds that unlock a badge. Losable, by design. */
export const VERIFIED_AT = 100000;

const round = n => (n >= 10000 ? Math.round(n / 1000) * 1000 : Math.round(n / 10) * 10);

/** "278k" / "9.4k" / "840". */
export function short(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(Math.round(n));
}

/**
 * One person's follower history, as a series of dated steps.
 *
 * Returned rather than just the total, because the profile shows the delta and
 * because a number nobody can explain is one nobody trusts. Each step says what
 * moved it and when.
 */
export function followerHistory(slug, { careers = [], seasons = [], events = [] } = {}) {
  const career = careers.find(c => c.id === slug);
  const bySeasonId = new Map(seasons.map(s => [s.seasonId, s]));
  const placed = seasons.filter(s => airKey(s) != null).slice().sort(byAirDate);
  const mine = new Map();
  for (const d of career?.details || []) {
    if (d.seasonId) mine.set(d.seasonId, d);
  }
  const myEvents = approvedFor(slug, events, {
    seasonRank: new Map(seasons.map(s => [s.seasonId, airKey(s)])),
  });
  const eventsAfter = new Map();
  for (const e of myEvents) {
    if (!eventsAfter.has(e.afterSeason)) eventsAfter.set(e.afterSeason, []);
    eventsAfter.get(e.afterSeason).push(e);
  }

  let n = 0;
  let debuted = false;
  const steps = [];

  for (const season of placed) {
    const played = mine.get(season.seasonId);
    if (played) {
      if (!debuted) { n += FOLLOWERS.debut; steps.push({ season, why: 'debut', delta: FOLLOWERS.debut }); debuted = true; }
      else { n += FOLLOWERS.perSeason; steps.push({ season, why: 'played', delta: FOLLOWERS.perSeason }); }
      const place = Number(played.placement);
      const bonus = place === 1 ? FOLLOWERS.win
        : place === 2 ? FOLLOWERS.runnerUp
        : place === 3 ? FOLLOWERS.finalist : 0;
      if (bonus) {
        n += bonus;
        steps.push({ season, why: place === 1 ? 'won' : place === 2 ? 'runner-up' : 'finalist', delta: bonus });
      }
    } else if (debuted) {
      // A season they were not in. Only counts once they have an audience to
      // lose — nobody drifts out of a public life they never had.
      const lost = Math.round(n * FOLLOWERS.quietDecay);
      if (lost > 0) { n = Math.max(FOLLOWERS.floor, n - lost); steps.push({ season, why: 'quiet', delta: -lost }); }
    }

    // Then whatever happened to them in the gap after it.
    for (const e of eventsAfter.get(season.seasonId) || []) {
      const add = FOLLOWERS.perEvent[significanceOf(e.kind)] || 0;
      if (!add) continue;
      n += add;
      steps.push({ season, why: e.kind, delta: add, event: e });
    }
  }

  return { total: debuted ? round(n) : 0, steps, debuted, bySeasonId };
}

/** Just the number. */
export const followersOf = (slug, ctx) => followerHistory(slug, ctx).total;

/**
 * What the dot means.
 *
 * Two states, layered, because they are different facts. `sequestered` is
 * somebody currently competing — a real houseguest has no phone, so the grid
 * dims while a season runs and comes back on at the finale. `quiet` is somebody
 * nothing has happened to in a long time, which pairs with the decay.
 */
export function statusOf(slug, { careers = [], seasons = [], events = [], live = null, now = null } = {}) {
  if (live && (live.players || []).some(p => p.slug === slug || p.id === slug)) {
    return { state: 'sequestered', label: 'in the house' };
  }
  const rank = new Map(seasons.map(s => [s.seasonId, airKey(s)]));
  const mine = approvedFor(slug, events, { seasonRank: rank });
  const nowKey = now ? airKey(now) : Math.max(...[...rank.values()].filter(v => v != null), 0);
  const last = mine.length ? rank.get(mine[mine.length - 1].afterSeason) : null;
  // Four slots is a year. Nothing in a year is somebody who has drifted.
  if (last == null || (nowKey - last) >= 10) return { state: 'quiet', label: 'quiet' };
  return { state: 'active', label: 'active' };
}

/**
 * The whole directory, ready to render.
 *
 * Derived from the roster and the record, so adding characters adds profiles
 * and nothing here is a list anybody maintains.
 */
export function directory({ careers = [], seasons = [], events = [], live = null, roster = [] } = {}) {
  const rosterBySlug = new Map((roster.players || roster || []).map(r => [r.slug, r]));
  const now = seasons.filter(s => airKey(s) != null).slice().sort(byAirDate).pop() || null;
  return careers.map(c => {
    const h = followerHistory(c.id, { careers, seasons, events });
    const st = statusOf(c.id, { careers, seasons, events, live, now });
    const last = h.steps[h.steps.length - 1] || null;
    return {
      slug: c.id,
      name: c.name,
      followers: h.total,
      // Shown beside the count so the number reads as a story rather than a
      // ranking: what moved it, and when.
      lastDelta: last ? last.delta : 0,
      lastWhy: last ? last.why : '',
      // Losable on purpose — it moves with the follower model rather than being
      // a permanent stamp on whoever won first.
      verified: h.total >= VERIFIED_AT,
      status: st.state,
      statusLabel: st.label,
      shows: [...new Set((c.details || []).map(d => d.format || 'total-drama'))],
      seasonsPlayed: c.seasonsPlayed || 0,
      wins: c.wins || 0,
      bio: rosterBySlug.get(c.id) || null,
    };
  }).sort((a, b) => b.followers - a.followers);
}


// ══════════════════════════════════════════════════════════════════════
// THE PROFILE
// ══════════════════════════════════════════════════════════════════════

const GALLERY_API = 'https://dc-studio.yannari19.workers.dev';

/**
 * The photographs a character has, from the listing endpoint.
 *
 * Asked for rather than probed: the Worker returns exact filenames and the
 * folders mix .png, .jpg and .webp, so guessing extensions means five requests
 * per slot to discover that none of them exist.
 */
export async function photosOf(slug) {
  try {
    const j = await fetch(`${GALLERY_API}/api/gallery/${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : null));
    return (j?.images || []).map(i => `${GALLERY_API}/gallery/${encodeURIComponent(slug)}/${i.file}`);
  } catch {
    return [];
  }
}

/**
 * A character's posts: their approved life events, newest first.
 *
 * ── PHOTO WHEN ONE FITS, CARD WHEN NOT ──
 *
 * The galleries are character art. There is no wedding photo of Lindsay and
 * inventing one is not on the table, so a post takes a picture when the folder
 * has an unused one and otherwise renders as a designed card. Assigned rather
 * than random: the same event keeps the same photograph across reloads, because
 * a feed that reshuffles its own pictures reads as broken.
 *
 * A MAJOR event gets first call on the photographs. If somebody has three
 * pictures and eleven events, the wedding should be one of the three and the
 * new job should be a card.
 */
export function postsFor(slug, { events = [], seasons = [], photos = [] } = {}) {
  const rank = new Map(seasons.map(s => [s.seasonId, airKey(s)]));
  const mine = approvedFor(slug, events, { seasonRank: rank });
  const weight = { major: 0, notable: 1, minor: 2 };
  const claim = mine
    .map((e, i) => ({ e, i }))
    .sort((a, b) => weight[significanceOf(a.e.kind)] - weight[significanceOf(b.e.kind)] || a.i - b.i)
    .slice(0, photos.length);
  const photoFor = new Map(claim.map((c, n) => [c.i, photos[n]]));

  return mine.map((e, i) => ({
    // `_sig` rides along on the event so the voice bank does not have to import
    // the vocabulary to ask how much something matters.
    event: { ...e, _sig: significanceOf(e.kind) },
    kind: e.kind,
    track: kindOf(e.kind)?.track || '',
    significance: significanceOf(e.kind),
    photo: photoFor.get(i) || null,
    season: seasons.find(s => s.seasonId === e.afterSeason) || null,
  })).reverse();
}


/**
 * The people who would show up under somebody's post, as [{slug, weight}].
 *
 * Straight off the social graph the life resolver already builds. Positive is a
 * friend, strongly positive is close, negative is a rival — and a rival mostly
 * says nothing, which the voice bank handles.
 */
export function tiesFor(slug, graph) {
  const row = graph?.get?.(slug);
  if (!row) return [];
  return [...row.entries()].map(([other, weight]) => ({ slug: other, weight }));
}

/**
 * Where somebody is up to, romantically — the line under the bio.
 *
 * Derived from the approved log like everything else here, never stored, so it
 * cannot disagree with the posts above it: the same events that say "moved in
 * together" are the ones that make this read "living with Owen".
 *
 * The words are the ones a profile would use rather than the engine's stage
 * names. `public` is a stage in the resolver because going public is a step;
 * on a profile it is just "with" somebody, which is what everyone else can see.
 */
const STATUS_WORDS = {
  dating: 'Seeing',
  public: 'With',
  'living-together': 'Living with',
  engaged: 'Engaged to',
  married: 'Married to',
};

export function relationshipStatus(slug, { events = [], seasons = [], names = {} } = {}) {
  const rank = new Map(seasons.map(s => [s.seasonId, airKey(s)]));
  const st = stateOf(slug, events, { seasonRank: rank });
  const stage = st?.relationship?.stage || 'single';
  const withWhom = st?.relationship?.with || null;
  if (stage === 'single' || !withWhom) return { stage: 'single', label: 'Single', whom: null };
  return {
    stage,
    whom: withWhom,
    label: (STATUS_WORDS[stage] || 'With') + ' ' + (names[withWhom] || withWhom),
  };
}
