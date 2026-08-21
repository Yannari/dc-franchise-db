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
import { fameOf } from './life-resolver.js';
import { imageUrl } from './gallery-io.js';
import { podcastFor, PODCAST_FOLLOWERS, MENTIONED_HIT } from './kristal.js';

/** Everything tunable about the number, in one place. */
export const FOLLOWERS = {
  debut: 12000,                 // simply being on television
  perSeason: 9000,              // and doing it again
  win: 120000,                  // winning is the cliff
  runnerUp: 38000,
  finalist: 16000,
  // A life event is worth something to the extent anybody noticed it.
  perEvent: { minor: 400, notable: 3500, major: 22000 },
  // ── what a reputation event does to the number ──
  //
  // The model keyed on significance alone, so GETTING CANCELLED PAID THE SAME
  // AS A WEDDING: +22,000 followers for the thing whose entire meaning is that
  // the followers leave. These override the significance payout, and they are
  // PROPORTIONAL like the quiet decay, because losing a fifth of 300k is a
  // story and a fifth of 12k is noise.
  //
  // Feuds and bankruptcies are deliberately NOT here. A feud grows an account —
  // the drama-follow is real — and a bankruptcy is news that draws sympathy,
  // not a sin anybody unfollows over. Negative means the crowd actually left.
  reputation: {
    cancelled: -0.22,             // the word means the followers leave
    arrested: -0.10,
    scandal: -0.08,               // the buzz gains some; it loses more
    'production-fallout': -0.03,
    forgiven: +0.05,              // some come back. never all of them.
  },
  // And simply posting through an off-season keeps the number breathing.
  // Deliberately flat rather than mood-weighted: the follower model runs
  // without the roster, and a delta that depended on archetype would compute
  // two different totals depending on which page asked.
  perMoment: 250,
  // A season you were not in costs you a slice of what you have. Proportional
  // rather than flat: losing 4% of 300k is a story, losing 4% of 12k is noise,
  // and that asymmetry is correct.
  quietDecay: 0.045,
  // ── the edit ──
  //
  // How the audience took somebody that season, relative to THAT cast — the
  // export writes a per-season popularity score, and its scale varies with
  // season length, so a rank within the cast is the only honest reading.
  // A beloved season pays up to 1.6x the exposure gain; a despised one pays
  // 0.4x — and the bottom fifth of a cast actively LOSES followers, because
  // being hated on television is the one season outcome that empties a
  // following instead of building one. Seasons exported before the field
  // existed have no edit and pay exactly what they always did.
  editFloor: 0.4,
  editCeiling: 1.6,
  hateUnfollow: 0.06,           // the most hated of a cast loses up to 6%
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
  const myMoments = momentsFor(slug, { events, seasons, career });
  const momentsAfter = new Map();
  for (const m of myMoments) momentsAfter.set(m.afterSeason, (momentsAfter.get(m.afterSeason) || 0) + 1);
  // Kristal-talKs, both directions. An appearance pays by how the episode
  // landed; a VIRAL episode that was about you — the ex, the rival, the name
  // in the clip everyone shared — costs, proportionally like every loss here.
  // Names and archetypes are deliberately not passed: the count must be the
  // same whichever page computes it, and the roster is not always in hand.
  const podcast = podcastFor({ careers, seasons, lifeEvents: events });
  const podAfter = new Map();
  for (const ep of podcast) {
    if (ep.guest === slug) {
      const l = podAfter.get(ep.afterSeason) || { gain: 0, hits: 0 };
      l.gain += PODCAST_FOLLOWERS[ep.tier] || 0;
      podAfter.set(ep.afterSeason, l);
    } else if (ep.mentioned === slug && ep.tier === 'viral') {
      const l = podAfter.get(ep.afterSeason) || { gain: 0, hits: 0 };
      l.hits += 1;
      podAfter.set(ep.afterSeason, l);
    }
  }
  const eventsAfter = new Map();
  for (const e of myEvents) {
    if (!eventsAfter.has(e.afterSeason)) eventsAfter.set(e.afterSeason, []);
    eventsAfter.get(e.afterSeason).push(e);
  }

  // Every cast-mate's popularity per season, for ranking somebody's edit
  // within it. Built once across all careers, not per player.
  const popsBySeason = new Map();
  for (const c of careers) {
    for (const d of c.details || []) {
      if (typeof d.popularity === 'number') {
        if (!popsBySeason.has(d.seasonId)) popsBySeason.set(d.seasonId, []);
        popsBySeason.get(d.seasonId).push(d.popularity);
      }
    }
  }
  /** Where this season's audience put them: 0 most hated of the cast, 1 most
   *  loved, null when the season predates the popularity field. */
  const editOf = detail => {
    const pool = popsBySeason.get(detail?.seasonId) || [];
    if (typeof detail?.popularity !== 'number' || pool.length < 3) return null;
    const sorted = [...pool].sort((a, b) => a - b);
    return sorted.indexOf(detail.popularity) / Math.max(1, sorted.length - 1);
  };

  let n = 0;
  let debuted = false;
  const steps = [];

  for (const season of placed) {
    const played = mine.get(season.seasonId);
    if (played) {
      const edit = editOf(played);
      const editFactor = edit == null ? 1
        : FOLLOWERS.editFloor + (FOLLOWERS.editCeiling - FOLLOWERS.editFloor) * edit;
      const exposure = Math.round((debuted ? FOLLOWERS.perSeason : FOLLOWERS.debut) * editFactor);
      steps.push({ season, why: debuted ? 'played' : 'debut', delta: exposure });
      n += exposure;
      debuted = true;
      const place = Number(played.placement);
      const bonus = place === 1 ? FOLLOWERS.win
        : place === 2 ? FOLLOWERS.runnerUp
        : place === 3 ? FOLLOWERS.finalist : 0;
      if (bonus) {
        // The achievement is real however the edit went — a hated winner is
        // still a winner — so the edit only half-applies to the placement.
        const add = Math.round(bonus * (edit == null ? 1 : (1 + editFactor) / 2));
        n += add;
        steps.push({ season, why: place === 1 ? 'won' : place === 2 ? 'runner-up' : 'finalist', delta: add });
      }
      // The bottom fifth of a cast: the season actively cost them followers,
      // proportionally, like every loss in this model.
      if (edit != null && edit < 0.2) {
        const lost = Math.round(n * FOLLOWERS.hateUnfollow * (1 - edit / 0.2));
        if (lost > 0) {
          n = Math.max(FOLLOWERS.floor, n - lost);
          steps.push({ season, why: 'rough edit', delta: -lost });
        }
      }
    } else if (debuted) {
      // A season they were not in. Only counts once they have an audience to
      // lose — nobody drifts out of a public life they never had.
      const lost = Math.round(n * FOLLOWERS.quietDecay);
      if (lost > 0) { n = Math.max(FOLLOWERS.floor, n - lost); steps.push({ season, why: 'quiet', delta: -lost }); }
    }

    // Then whatever happened to them in the gap after it.
    for (const e of eventsAfter.get(season.seasonId) || []) {
      const rep = FOLLOWERS.reputation[e.kind];
      const add = rep !== undefined
        ? Math.round(n * rep)
        : FOLLOWERS.perEvent[significanceOf(e.kind)] || 0;
      if (!add) continue;
      n = Math.max(FOLLOWERS.floor, n + add);
      steps.push({ season, why: e.kind, delta: add, event: e });
    }
    // And the posting itself — the moments keep the number breathing between
    // the spikes, which is what stops a quiet-but-active account reading as an
    // abandoned one. One aggregated step per gap, not one per selfie.
    const posted = debuted ? (momentsAfter.get(season.seasonId) || 0) : 0;
    if (posted) {
      const add = posted * FOLLOWERS.perMoment;
      n += add;
      steps.push({ season, why: 'posting', delta: add });
    }
    const pod = podAfter.get(season.seasonId);
    if (pod?.gain) {
      n += pod.gain;
      steps.push({ season, why: 'Kristal-talKs', delta: pod.gain });
    }
    if (pod?.hits) {
      const lost = Math.round(n * MENTIONED_HIT * pod.hits);
      if (lost < 0) {
        n = Math.max(FOLLOWERS.floor, n + lost);
        steps.push({ season, why: 'talked about on Kristal-talKs', delta: lost });
      }
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


// ─── moments: the posts about nothing ───────────────────────────────────────
//
// The feed was a life-event ticker wearing an Instagram skin: every post was an
// announcement, and an account with a quiet year was a dead one. Real accounts
// are mostly nothing happening — a selfie, a gym mirror, a Tuesday — so every
// resolved off-season each debuted character posts a few of these.
//
// DERIVED, NEVER STORED, NEVER APPROVED. Seeded from (character, off-season,
// index) so the same moment reads the same way forever, they add no rows to the
// inbox and no facts to the world. Life events are facts; moments are noise.
// The off-season is the clock — new season, new posts, forever — so the feed
// cannot run out the way a photo inventory would.

/** Deterministic 0..1 from a key, the same trick the voice bank uses. */
function chance(key) {
  let h = 2166136261;
  const str = String(key);
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}
const pickBy = (list, key) => list[Math.floor(chance(key) * list.length)] || null;

const ENDINGS = ['broke-up', 'quietly-ended', 'separated', 'divorced'];
const SCHEMERS = ['villain', 'mastermind', 'schemer'];
const LOUD_ONES = ['chaos-agent', 'wildcard', 'hothead'];

/**
 * The mood of one moment — where their life is, spoken as a register.
 *
 * A weighted pool rather than a rule, because a person fresh off a break-up
 * does not post ONLY sad things: the revenge glow-up (`flex`) is as real as
 * the sad-post, and which one lands is the roll.
 */
function moodFor(key, { endedHere, attached, archetype, fame, awayYears }) {
  const pool = [];
  if (endedHere) pool.push('low', 'low', 'sharp', 'flex', 'flex');
  else if (attached) pool.push('soft', 'soft', 'flirty', 'flex');
  else pool.push('soft', 'flirty', 'flex', 'chaos', 'low');
  if (SCHEMERS.includes(archetype)) pool.push('sharp', 'sharp', 'flex');
  if (LOUD_ONES.includes(archetype)) pool.push('chaos', 'chaos');
  if (fame > 0.5) pool.push('flex');
  // Two years off the air and the camera roll is what is left.
  if (awayYears >= 2) pool.push('nostalgic', 'nostalgic', 'nostalgic');
  return pickBy(pool, key);
}

/**
 * Every moment somebody has ever posted, oldest gap first.
 *
 * 1–3 per resolved off-season: one for existing, one more if that off-season
 * actually happened to them, one more (usually) if they are famous — fame buys
 * volume here exactly as it does in the life resolver, never a different life.
 */
export function momentsFor(slug, { events = [], seasons = [], career = null, archetype = '' } = {}) {
  const rank = new Map(seasons.map(s => [s.seasonId, airKey(s)]));
  const approved = events.filter(e => e && e.status === 'approved');
  // An off-season exists once ANYBODY has canon after it — the inbox being
  // mid-review must not make everyone else's account go dark.
  const gaps = [...new Set(approved.map(e => e.afterSeason))]
    .filter(g => rank.get(g) != null)
    .sort((a, b) => rank.get(a) - rank.get(b));
  const details = career?.details || [];
  const debut = details.reduce((best, d) => {
    const k = rank.get(d.seasonId);
    return k != null && (best == null || k < best) ? k : best;
  }, null);
  if (debut == null || !gaps.length) return [];
  const fame = fameOf(career);

  const out = [];
  for (const gap of gaps) {
    const here = rank.get(gap);
    if (here < debut) continue;
    const upTo = approved.filter(e => (rank.get(e.afterSeason) ?? -1) <= here);
    const st = stateOf(slug, upTo, { seasonRank: rank });
    if (st.terminal) break;                        // nothing after a death
    const mineHere = approved.filter(e => e.afterSeason === gap
      && (e.player === slug || e.whom === slug));
    const endedHere = mineHere.some(e => ENDINGS.includes(e.kind));
    // Rank units are year*10+slot, so ten of them is a year.
    const lastPlayed = details.reduce((best, d) => {
      const k = rank.get(d.seasonId);
      return k != null && k <= here && (best == null || k > best) ? k : best;
    }, null);
    const awayYears = lastPlayed == null ? 0 : (here - lastPlayed) / 10;

    // ── whether they bother at all ──
    //
    // The floor used to be one post per gap for everybody, forever — a
    // 16th-place boot from years ago posting on the same pulse as a two-time
    // winner. Some people just do not care about social media, and the ones
    // with no audience and no recent season care least: `care` is the pull of
    // fame against the drift of years away, and below it the account simply
    // says nothing that off-season. An eventful gap always posts — if your
    // life did something, you post it — so the silence never hides a fact.
    //
    // Fame and recency only, no archetype: followerHistory computes the same
    // counts without the roster in hand, and a count that depended on it would
    // give two pages two different follower totals.
    const care = Math.max(0, 1 - Math.max(0, awayYears - 1) * 0.25) * (0.4 + fame);
    if (!mineHere.length && chance(`${slug}|${gap}|cares`) > care) continue;

    const n = 1
      + (mineHere.length ? 1 : 0)
      + (fame > 0.5 && chance(`${slug}|${gap}|extra`) < 0.7 ? 1 : 0);
    for (let i = 1; i <= n; i++) {
      out.push({
        id: `m-${gap}-${i}`,
        isMoment: true,
        player: slug,
        afterSeason: gap,
        seq: i,
        mood: moodFor(`${slug}|${gap}|${i}|mood`, {
          endedHere, attached: st.relationship.stage !== 'single',
          archetype, fame, awayYears,
        }),
      });
    }
  }
  return out;
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
export function postsFor(slug, {
  events = [], seasons = [], career = null, archetype = '',
  // The whole gallery document (js/gallery-io.js galleryFull): the numbered
  // queue and the posted/ archive. The archive is checked FIRST — a photo a
  // post already claimed is that post's photo forever, keyed by the post's own
  // id, and no reshuffle of the queue can take it away.
  gallery = { images: [], posted: [] },
} = {}) {
  const rank = new Map(seasons.map(s => [s.seasonId, airKey(s)]));
  const mine = approvedFor(slug, events, { seasonRank: rank });
  const moments = momentsFor(slug, { events, seasons, career, archetype });

  const evPosts = mine.map(e => ({
    id: `${e.afterSeason}-${e.seq}`,
    // `_sig` rides along on the event so the voice bank does not have to import
    // the vocabulary to ask how much something matters.
    event: { ...e, _sig: significanceOf(e.kind) },
    kind: e.kind,
    track: kindOf(e.kind)?.track || '',
    significance: significanceOf(e.kind),
    season: seasons.find(s => s.seasonId === e.afterSeason) || null,
    _rank: rank.get(e.afterSeason) ?? -1,
    _seq: e.seq || 0,
  }));
  const moPosts = moments.map(m => ({
    id: m.id,
    moment: m,
    isMoment: true,
    mood: m.mood,
    season: seasons.find(s => s.seasonId === m.afterSeason) || null,
    _rank: rank.get(m.afterSeason) ?? -1,
    // High, so within an off-season the moments sit on top of the
    // announcements — which is where an Instagram would put them.
    _seq: 900 + m.seq,
  }));

  // ── the photographs ──
  const postedById = new Map((gallery.posted || []).map(o => {
    const m = /^posted\/(.+)\.[a-z]+$/.exec(o.file);
    return m ? [m[1], o] : null;
  }).filter(Boolean));
  // The pinned photo is the face, not a post. Everything else in the queue is
  // claimable, majors first, then the moments — a moment IS its photograph in a
  // way a job announcement is not — then the small stuff.
  const queue = (gallery.images || []).filter(o => !o.pinned);
  // ── A MOOD RESERVES A PHOTO FOR THE MOMENTS ──
  //
  // Setting a mood on a picture says "this is a personal post" — a flirty
  // photo under "started a new business" is the app visibly not looking at its
  // own pictures. So announcements claim only the unmooded photos, and the
  // mooded ones go to moments, which adopt the mood as their register. Mood
  // everything and every announcement renders as a card, which is predictable
  // rather than wrong.
  const plain = queue.filter(o => !o.mood);
  const mooded = queue.filter(o => o.mood);
  const weight = p => p.isMoment ? 1.5
    : ({ major: 0, notable: 1, minor: 2 })[p.significance];
  const wantPhoto = [...evPosts, ...moPosts]
    .filter(p => !postedById.has(p.id))
    .sort((a, b) => weight(a) - weight(b) || b._rank - a._rank);
  const claimed = new Map();
  let pi = 0, mi = 0;
  for (const p of wantPhoto) {
    if (p.isMoment) {
      if (mi < mooded.length) claimed.set(p.id, mooded[mi++]);
      else if (pi < plain.length) claimed.set(p.id, plain[pi++]);
    } else if (pi < plain.length) {
      claimed.set(p.id, plain[pi++]);
    }
    if (pi >= plain.length && mi >= mooded.length) break;
  }

  const all = [...evPosts, ...moPosts].map(p => {
    const archived = postedById.get(p.id) || null;
    const fromQueue = archived ? null : claimed.get(p.id) || null;
    const photo = archived || fromQueue;
    // A photograph with an authored mood overrides the derived one — the
    // author has said what this picture is, and the caption should agree.
    if (p.moment && photo?.mood) p.moment = { ...p.moment, mood: photo.mood };
    if (p.moment) p.mood = p.moment.mood;
    return {
      ...p,
      photo: photo ? imageUrl(slug, photo.file) : null,
      // Still in the numbered queue: the page archives these (with a token) so
      // the slot frees up for the next dump.
      queueFile: fromQueue ? fromQueue.file : null,
    };
  });
  return all.sort((a, b) => b._rank - a._rank || b._seq - a._seq);
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
