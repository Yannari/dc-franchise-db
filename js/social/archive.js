// An audience for a season that finished before any of this existed.
//
// Project 2 writes posts while a season is being played and syncs them to D1.
// That covers exactly one season — the airing one — and the site has fourteen
// finished ones whose episode logs are sitting in data/seasons/ with nobody
// reacting to them.
//
// The fix is that the whole feed library is PURE and runs in a browser as
// happily as in the simulator. So the site builds an archive feed on the fly
// from the published season document, seeded by season and episode, which means
// it is the same feed every visit without storing a single row. A published
// season is immutable, so a generated feed over it is stable by construction.
//
// Precedence, when both exist: the STORED feed wins. It is what the simulator
// actually produced, engagement and all, and regenerating over it would quietly
// replace real numbers with computed ones.
import { extractEvents, socialEvent } from './events.js';
import { buildEpisodeFeed } from './feed.js';
import { seasonDataFile } from './adapter.js';
import { feedSeed } from './live.js';

/**
 * Episodes of a published season.
 *
 * THE TWO SHOWS PUBLISH DIFFERENT DOCUMENTS. Big Brother writes a `weeks` array
 * that already looks like what the extractor reads. Total Drama writes no
 * episode array at all — its record of what happened is `votingHistory`, one
 * entry per tribal council, carrying the boot and every ballot. A reader that
 * assumed `doc.episodes` found nothing in fourteen seasons and produced an empty
 * archive that looked exactly like a working one.
 */
export function episodesOf(doc, format) {
  if (!doc) return [];
  if (format === 'big-brother') {
    return (doc.weeks || []).map((record, i) => ({
      record, episode: Number(record?.week ?? record?.num ?? i + 1),
    }));
  }

  // ── every night the season aired, not only the ones with a ballot ──
  //
  // The sources here are both PARTIAL. `votingHistory` records tribal councils,
  // so a reward night, a non-elimination week or an episode whose record never
  // carried a boot is simply not in it. `episodes` is only trustworthy where it
  // says what HAPPENED — season 9 publishes one whose entries are the prose
  // prompts the writer was given, no boot, no winner, nothing extractable.
  //
  // Reading either one as THE list left holes in the episode selector, and a
  // gap in a numbered list reads as the feature failing rather than as a source
  // that only ever recorded votes. So both are merged by episode number and the
  // run is filled in: a night nothing is known about still gets an entry,
  // because `extractEvents` always emits `episode-aired` and the topics that
  // fire on it — the edit critique, the favourite declaration, the thirst — are
  // exactly the ones that need no big moment.
  const known = new Map();
  const put = (n, record, useful) => {
    if (!Number.isFinite(n) || n < 1) return;
    const had = known.get(n);
    // A record that says something beats one that does not, whichever arrived
    // first.
    if (!had || (useful && !had._useful)) known.set(n, Object.assign(record, { _useful: useful }));
  };
  for (const [i, v] of (doc.votingHistory || []).entries()) {
    put(Number(v?.episode ?? i + 1), { ...v }, true);
  }
  for (const [i, e] of (doc.episodes || []).entries()) {
    put(Number(e?.episode ?? e?.num ?? i + 1), { ...e }, !!(e?.eliminated || e?.immunityWinner));
  }

  // ── but a season that recorded NOTHING gets one night, not a whole run ──
  //
  // Seasons 1 to 5 predate votingHistory and say nothing about any individual
  // episode. Filling a run there is not filling gaps between known nights, it
  // is inventing thirteen of them — every one a page of chatter about an
  // episode nobody has a single fact for. They do name a winner, and that is
  // worth a feed, so they get the finale and only the finale.
  const end = Number(doc.episodeCount) || 0;
  const out = [];
  if (!known.size) {
    if (doc.winner && end) out.push({ episode: end, record: { episode: end } });
  } else {
    const total = Math.max(end, Math.max(...known.keys()));
    for (let n = 1; n <= total; n++) {
      const record = known.get(n) || { episode: n };
      delete record._useful;
      out.push({ episode: n, record });
    }
  }

  // THE FINALE IS NOT THE LAST VOTE.
  //
  // A Total Drama finale is decided by a challenge or a jury rather than by a
  // ballot, so the season's last recorded vote is several episodes before the
  // end. Season 14 runs to episode 26 and its last vote is episode 24 — the
  // finale reaction used to land on the wrong night and the actual finale had
  // no page at all. It is in the run now; this is what makes it the finale.
  const last = out[out.length - 1];
  if (doc.winner && last) {
    last.record.isFinale = true;
    last.record.winner = last.record.winner || doc.winner;
  }
  return out;
}

/**
 * What a Total Drama tribal council says happened, beyond who went home.
 *
 * Read STRICTLY off the ballots, because the alternative is inventing drama a
 * finished season never recorded:
 *
 *   every ballot on one name       the camp moved as one — a pile-on
 *   everyone but the boot, and     nobody warned them — a blindside
 *   the boot voted elsewhere
 *
 * Anything less certain gets no event. A season where every vote reads as a
 * blindside makes the feed's loudest reaction its most common one, which is the
 * failure this project already fixed once on the played path.
 */
function tribalEvents(vote, meta) {
  const ballots = vote?.votes || [];
  if (ballots.length < 3 || !vote.eliminated) return [];

  const targets = new Map();
  for (const b of ballots) {
    const t = b.targetSlug || b.target;
    if (t) targets.set(t, (targets.get(t) || 0) + 1);
  }
  const bootKey = vote.eliminatedSlug || vote.eliminated;
  const against = targets.get(bootKey) || 0;
  const bootBallot = ballots.find(b => (b.voterSlug || b.voter) === bootKey);
  const bootVotedElsewhere = bootBallot
    && (bootBallot.targetSlug || bootBallot.target) !== bootKey;

  const out = [];
  if (targets.size === 1) {
    out.push(socialEvent('ganging-up', { ...meta, subject: vote.eliminated }));
  } else if (against === ballots.length - 1 && bootVotedElsewhere && targets.size === 2) {
    out.push(socialEvent('blindside', { ...meta, subject: vote.eliminated }));
  }

  // Somebody who took votes and stayed. That IS the show putting a name up, and
  // it is the only way a Total Drama archive gets a second subject in a night —
  // without it every episode is one boot and the feed talks about one person.
  let i = 0;
  for (const [target, count] of targets) {
    if (target === bootKey || count < 1) continue;
    const named = ballots.find(b => (b.targetSlug || b.target) === target);
    out.push(socialEvent('nomination', {
      ...meta, subject: named?.target || target, jitter: (i++ % 4) * 0.01,
    }));
  }
  return out;
}

/** Fetch a published season log. Returns null when a season has not aired. */
export async function loadSeasonDoc(format, season, { root = '.' } = {}) {
  const url = `${root}/data/seasons/${seasonDataFile(format, season)}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json();
}

/**
 * Build the feed for one episode of a finished season.
 *
 * Uses the SAME seed the simulator would have used, so an archive feed and a
 * feed that was actually played are indistinguishable in structure — and a
 * season later published with real posts drops in without the page changing.
 */
export function archiveEpisode(doc, format, season, episode, { popularity = null } = {}) {
  const all = episodesOf(doc, format);
  const found = all.find(e => e.episode === Number(episode));
  if (!found) return { events: [], posts: [] };

  const meta = { format, season, episode: found.episode };
  const events = extractEvents(found.record, meta);
  if (format !== 'big-brother') events.push(...tribalEvents(found.record, meta));
  // The finale is whichever night the document calls the finale — either the
  // entry synthesised above, or the last one for a show whose finale IS a vote.
  const isFinale = found.record?.isFinale
    || (found === all[all.length - 1] && format === 'big-brother');
  if (isFinale && doc?.winner) {
    // extractEvents already emits a finale for a record flagged as one — but
    // without a subject, because a live episode record does not name a winner.
    // Pushing a second was two Finale rows in the rail, one of them nameless.
    const existing = events.find(e => e.kind === 'finale');
    const winner = doc.winner.name || doc.winner;
    if (existing) existing.subject = String(winner).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    else events.push(socialEvent('finale', { ...meta, subject: winner }));
  }
  events.sort((a, b) => a.at - b.at);

  const posts = buildEpisodeFeed(events, {
    popularity: popularity || doc?.popularity || null,
    seed: feedSeed(season, found.episode),
    // An archive night should read as busy as a live one. The published
    // document records fewer moments than a played episode carries, so each
    // one draws proportionally more of the room.
    scale: 2,
  });
  return { events, posts };
}

/**
 * Everything the page needs about a season, from whichever source has it.
 *
 * `stored` is what came back from /api/social. When it holds this episode, it is
 * used untouched — those posts carry engagement that accumulated while the
 * season aired, and recomputing them would throw that away and look identical
 * while doing it.
 */
export function episodeFeed({ doc, stored = [], format, season, episode, popularity = null }) {
  const mine = (stored || []).filter(p => Number(p.episode) === Number(episode));
  if (mine.length) {
    const found = episodesOf(doc, format).find(e => e.episode === Number(episode));
    const events = found
      ? extractEvents(found.record, { format, season, episode: Number(episode) })
      : [];
    return { events, posts: mine, source: 'published' };
  }
  return { ...archiveEpisode(doc, format, season, episode, { popularity }), source: 'archive' };
}

/**
 * How the fandom feels about people, for a season that finished years ago.
 *
 * A played season carries `gs.popularity` — the running audience score the
 * simulator writes every episode. A published season document does not: nothing
 * ever exported it, and inventing one would mean deciding by hand who the
 * audience liked.
 *
 * rankings_database.json is the honest substitute, because it is not a
 * substitute at all: it IS the franchise's own standing for every player,
 * maintained on the site, with a 0-100 score. Feeding it in as popularity makes
 * an archive audience that likes who the franchise likes. The UI says so rather
 * than passing it off as recorded reaction.
 */
export function crowdFromRankings(rankings) {
  const out = {};
  for (const r of rankings?.rankings || []) {
    if (r.playerId && Number.isFinite(Number(r.score))) out[r.playerId] = Number(r.score);
  }
  return out;
}

/**
 * What the audience is talking about, by volume.
 *
 * Derived from the posts themselves rather than invented hashtags: a trend is
 * "a lot of people said this name tonight", which is the only definition that
 * cannot drift from the feed under it.
 */
export function trendsFrom(posts, { limit = 5 } = {}) {
  const counts = new Map();
  for (const p of posts || []) {
    if (!p.subject) continue;
    const key = `${p.subject}|${p.kind}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [subject, kind] = key.split('|');
      return { subject, kind, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Who is rising, falling and dividing the audience.
 *
 * Likes minus tomatoes, per player, normalised across the episode — the same
 * relative reading the feed itself uses, so the pulse cannot contradict the
 * posts it summarises. "Divided" is high engagement of BOTH kinds, which is a
 * genuinely different state from unpopular and the one fandoms argue hardest
 * about.
 */
export function audiencePulse(posts) {
  const by = new Map();
  for (const p of posts || []) {
    if (!p.subject) continue;
    const e = by.get(p.subject)
      || { subject: p.subject, likes: 0, tomatoes: 0, posts: 0, sentiment: 0 };
    e.likes += p.likes || 0;
    e.tomatoes += p.tomatoes || 0;
    e.posts += 1;
    // WHICH SIDE THE ROOM TOOK, not how loud it was.
    //
    // Summing likes and subtracting tomatoes gets this exactly backwards, and it
    // shipped that way: a ratio punishes the TAKE, not its target, so the people
    // attacking a beloved player get tomatoed and the people dunking on a hated
    // one get liked. Read as raw engagement, the rail then named the most
    // despised player in the house as "rising" — measured across a real season,
    // it got the answer wrong in fifteen weeks out of fifteen.
    //
    // Weighing by stance fixes the direction: a well-received post that DEFENDS
    // somebody is warmth toward them, and a well-received post attacking them is
    // not.
    e.sentiment += (p.stance ?? 0) * ((p.likes || 0) - (p.tomatoes || 0));
    by.set(p.subject, e);
  }
  const all = [...by.values()];
  if (!all.length) return { rising: null, falling: null, divided: null, all: [] };

  for (const e of all) {
    const total = e.likes + e.tomatoes;
    // `net` stays as raw engagement — it is how LOUD a player was, which the
    // division measure below genuinely wants. Sentiment is the separate question
    // of which way the room leaned, and rising/falling read that one.
    e.net = e.likes - e.tomatoes;
    // Divided needs both volume and balance; a quiet player is not divisive.
    e.division = total ? (1 - Math.abs(e.net) / total) * Math.log10(1 + total) : 0;
  }
  const byNet = [...all].sort((a, b) => b.sentiment - a.sentiment);
  const byDivision = [...all].sort((a, b) => b.division - a.division);
  return {
    rising: byNet[0] || null,
    falling: byNet[byNet.length - 1] || null,
    divided: byDivision[0] || null,
    all,
  };
}
