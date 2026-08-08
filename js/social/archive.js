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

  // ── the verdicts moved, and must not be read twice ──
  //
  // The pile-on and the blindside used to be worked out here. They are read by
  // `ballotEvents` in events.js now, which handles both shapes of ballot — the
  // played `{ voter: target }` object and this document's list — so the played
  // path finally gets them too. Emitting them here as well would put two
  // blindsides on every archive night, which is the kind of duplicate that
  // looks like the audience being emphatic rather than like a bug.
  const out = [];

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
/**
 * What happened on one night, as events.
 *
 * Pulled out of `archiveEpisode` because the PUBLISHED path needs exactly the
 * same list and was building a shorter one of its own — `extractEvents` and
 * nothing else, no tribal council, no finale. Events are not decoration: the
 * alumni room is built from them, so an episode that gained stored posts
 * quietly lost the moments its chat is made of, and the room came out thin or
 * empty on a night whose timeline was full.
 */
export function eventsForEpisode(doc, format, season, episode) {
  const all = episodesOf(doc, format);
  const found = all.find(e => e.episode === Number(episode));
  if (!found) return [];

  const meta = { format, season, episode: found.episode };
  const events = extractEvents(found.record, meta);
  if (format !== 'big-brother') events.push(...tribalEvents(found.record, meta));
  // The document's own account of the night, which nothing had ever read.
  events.push(...momentEvents(doc, format, season, found.episode));
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
  events.push(...awardEvents(doc, format, season, found.episode, { isFinale }));

  // ── the same fact, twice, one of them vaguer ──
  //
  // The ballot says Ted was eliminated. The document's own moment says "Ted was
  // eliminated 5-3 after identifying the wrong threat". Both are true, both are
  // an `eviction` about Ted, and the feed reacted to the elimination twice —
  // once with the detail and once without, which reads as the audience
  // stuttering rather than as two things happening.
  //
  // A bare event loses to a detailed one about the same moment. Two DETAILED
  // events of a kind survive together, because two idols found on one night are
  // genuinely two things.
  const detailed = new Set(events.filter(e => e.receipt).map(e => `${e.kind}|${e.subject}`));
  const deduped = events.filter(e => e.receipt || !detailed.has(`${e.kind}|${e.subject}`));
  return deduped.sort((a, b) => a.at - b.at);
}

/**
 * The night, read back off the posts about it.
 *
 * A last resort, for when there are stored posts for an episode the document
 * cannot account for — a season played but not yet published, a document that
 * failed to load, a feed synced ahead of the record. The posts themselves
 * carry `kind`, `subject` and `at`, which is everything an event is, so the
 * moments can be recovered from the reactions to them.
 *
 * Worth doing rather than shrugging: without it the timeline is full and the
 * alumni room is empty, which reads as the room being broken rather than as
 * the document being behind.
 *
 * Timing comes from the event's own kind, not from the posts. `socialEvent`
 * places a nomination and an eviction where they belong in an episode, and a
 * reaction is always LATER than the thing it reacts to — reading the clock off
 * the earliest post would push every moment a few minutes past itself.
 */
export function eventsFromPosts(posts, { format, season, episode }) {
  const seen = new Map();
  for (const p of posts || []) {
    if (!p?.kind) continue;
    const key = `${p.kind}|${p.subject || ''}`;
    if (!seen.has(key)) {
      seen.set(key, socialEvent(p.kind, {
        format, season, episode: Number(episode), subject: p.subject || null,
      }));
    }
  }
  return [...seen.values()].sort((a, b) => a.at - b.at);
}

export function archiveEpisode(doc, format, season, episode, { popularity = null } = {}) {
  const events = eventsForEpisode(doc, format, season, episode);
  if (!events.length) return { events: [], posts: [] };

  const posts = buildEpisodeFeed(events, {
    popularity: popularity || doc?.popularity || null,
    seed: feedSeed(season, Number(episode)),
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
    // The same events the archive path would build, not a shorter list of its
    // own — and if the document cannot account for this night at all, read the
    // night back off the posts rather than hand the page nothing. Empty events
    // means an empty alumni room, which is not a thing stored posts should
    // ever cause.
    const events = eventsForEpisode(doc, format, season, episode);
    return {
      events: events.length ? events : eventsFromPosts(mine, { format, season, episode }),
      posts: mine,
      source: 'published',
    };
  }
  return { ...archiveEpisode(doc, format, season, episode, { popularity }), source: 'archive' };
}

/**
 * Who is still in the game on a given night.
 *
 * The predictions panel was offering `placements.slice(0, 6)` — placement
 * order — so the first name on "who goes home tonight?" was the WINNER, every
 * week, at 42%. A prediction panel that lists the finishing order is not a
 * prediction, it is the answer, and it was showing it in episode two.
 *
 * Elimination dates come from the ballots, which are the only record of WHEN
 * somebody left. Anybody a ballot has not sent home yet is still playing.
 */
export function stillIn(doc, format, episode) {
  const cast = (doc?.placements || []).map(p => ({
    name: p.name, slug: p.playerSlug || _slugOf(p.name), placement: Number(p.placement) || 99,
  })).filter(p => p.name);
  if (!cast.length) return [];

  const ep = Number(episode) || 0;
  const gone = new Set();
  for (const v of doc?.votingHistory || []) {
    const when = Number(v?.episode) || 0;
    const who = v?.eliminatedSlug || v?.eliminated;
    if (who && when && when <= ep) gone.add(String(who).toLowerCase());
  }
  const left = cast.filter(p =>
    !gone.has(p.slug.toLowerCase()) && !gone.has(p.name.toLowerCase()));

  // A season with no ballots tells us nothing about who is out, and guessing
  // from placement would leak the result. Better to offer the whole cast than
  // an ordered one.
  return left.length ? left : cast;
}

const _slugOf = n => String(n || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

/**
 * A fact, shaped to drop into the middle of somebody's sentence.
 *
 * Trailing full stop off, because it is not the end of the sentence it lands
 * in. The name goes on the front when the source implies it — these are
 * written as "Found the Red Team idol", subject understood — since without it
 * the quote reads as a verb with nobody attached to it.
 */
function _clause(name, text) {
  let t = String(text || '').trim().replace(/\.$/, '');
  if (!t) return '';
  if (!name) return t.charAt(0).toLowerCase() + t.slice(1);
  // Already names somebody: leave the sentence alone apart from the stop.
  // Compared with a plain lowercase prefix rather than a built regex — escaping
  // a name into a pattern is how a stray character in somebody's name becomes a
  // syntax error at module load.
  if (t.toLowerCase().startsWith(String(name).toLowerCase())) return t;
  return `${name} ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
}

/**
 * The specifics, which were in the document the whole time.
 *
 * The feed was vague because it had nothing to be specific about: a Total Drama
 * archive night produced six event kinds — aired, comp win, votes taken,
 * elimination, blindside, finale — so nobody could mention an idol, an
 * alliance, a meltdown or a betrayal, because none of those had ever been
 * extracted. The audience was reacting to a ballot and a challenge result and
 * being asked to sound like it had watched an episode.
 *
 * Meanwhile every published season carries `placements[].keyMoments`, and they
 * are EPISODE-TAGGED PROSE:
 *
 *   "Episode 6: Found the Red Team idol and quietly became the best-protected
 *    player on her tribe."
 *   "Episode 14: Played her idol and negated four votes in the biggest
 *    advantage play of the season."
 *
 * That is the whole missing feed. This reads them, dates them, works out what
 * KIND of moment each one is from its own words, and hands the sentence
 * through as a `receipt` — the slot the phrasings already use for "the one fact
 * that makes this event THIS event". A template that says "{receipt} and we are
 * all supposed to move on" stops being a shrug and starts being a post about
 * something that happened.
 *
 * Deliberately conservative about classification. A moment it cannot read
 * becomes a `twist` — something changed tonight — rather than being forced into
 * a kind it does not fit, because a confidently wrong label reads worse than a
 * vague true one.
 */
const MOMENT_KINDS = [
  // Order matters: the first pattern that matches wins, so the specific ones
  // come before the general.
  [/\bplayed (an|her|his|their|the) (idol|advantage)|used (an|her|his|their) idol|negat\w+ \w+ votes/i, 'domination'],
  [/\bfound (an|a|the|her|his|their)[^.]*\b(idol|advantage)|idol was found|\bwins? an advantage/i, 'twist'],
  [/\bblindside|never saw it coming|had no idea/i, 'blindside'],
  [/\bbetray|flipped (on|off|against)|turned on|backstab|broke (her|his|their) word/i, 'betrayal'],
  // `\bformed` missed "helped FORM The Triumvirate", which then fell through to
  // `kindness` on the word "helped" — an alliance filed as a nice gesture.
  [/\bform(ed|ing|s)?\b|alliance|joined (the|a) \w+|final (two|three)\b/i, 'alliance-formed'],
  [/\bmelt(ed)? down|blew up|screaming|argu|fought with|explod/i, 'argument'],
  [/\bshowmance|kiss|fell for|romance|couple\b/i, 'showmance-formed'],
  [/\bimmunity|won the challenge|won \w+ challenge|challenge win/i, 'comp-win'],
  [/\bsaved|rescu|revived|protected|stood up for|helped|carried|gave (her|his|their)/i, 'kindness'],
  [/\bvoted out|eliminat|sent home|torch/i, 'eviction'],
];

/** "Episode 6: Found the Red Team idol…" → { episode: 6, text: "Found the…" } */
function readMoment(line) {
  const m = /^\s*(?:episode|ep\.?|week)\s*(\d+)\s*[:\-–—]\s*(.+)$/i.exec(String(line || ''));
  if (!m) return null;
  const text = m[2].trim();
  if (!text) return null;
  return { episode: Number(m[1]), text };
}

/** What kind of moment a sentence describes. `twist` when it cannot tell. */
export function momentKind(text) {
  for (const [re, kind] of MOMENT_KINDS) if (re.test(text)) return kind;
  return 'twist';
}

/**
 * Everything the document says happened on this night, per player.
 *
 * The moment's own sentence rides along as `receipt`, trimmed of its full stop
 * so it drops into the middle of something somebody typed on a phone.
 */
export function momentEvents(doc, format, season, episode) {
  const ep = Number(episode) || 0;
  const out = [];
  let n = 0;
  for (const p of doc?.placements || []) {
    const who = p.playerSlug || _slugOf(p.name);
    for (const line of p.keyMoments || []) {
      const read = readMoment(line);
      if (!read || read.episode !== ep) continue;
      const kind = momentKind(read.text);
      const e = socialEvent(kind, {
        format, season, episode: ep, subject: who,
        // Spread them through the hour rather than stacking every moment on the
        // same second, which would make the replay arrive in one lump.
        jitter: ((n++ % 8) - 4) * 0.02,
      });
      // ── the receipt needs its subject ──
      //
      // The document writes these with the player implied — "Found the Red Team
      // idol and quietly became the best-protected player on her tribe" — and a
      // receipt lands MID-SENTENCE, so dropping it in as-is produced "I say
      // that knowing nearly drowned in the treasure dive". A dangling verb.
      // The name goes back on the front, which is what makes it a clause.
      e.receipt = _clause(p.name || who, read.text);
      e.moment = read.text;
      out.push(e);
    }
  }
  return out;
}

/**
 * The season's own verdicts, on the night they belong to.
 *
 * `awards` holds thirty of these and not one was ever read. Most are
 * season-level and belong to the finale — the fan favourite, the player of the
 * season, the legacy moment — but several name their own episode, and a
 * betrayal the document calls the biggest of the season should be the loudest
 * post of the night it happened rather than a footnote at the end.
 */
export function awardEvents(doc, format, season, episode, { isFinale = false } = {}) {
  const a = doc?.awards;
  if (!a || typeof a !== 'object') return [];
  const ep = Number(episode) || 0;
  const out = [];

  const add = (kind, who, text, jitter = 0) => {
    if (!who) return;
    const e = socialEvent(kind, { format, season, episode: ep, subject: who, jitter });
    if (text) e.receipt = _clause('', text);
    out.push(e);
  };

  // Dated awards land on their own night.
  for (const [key, kind] of [['biggestBetrayal', 'betrayal'],
    ['secondBiggestBetrayal', 'betrayal'], ['mostBrutalExit', 'blindside'],
    ['legacyMoment', 'twist'], ['messiestFeud', 'argument']]) {
    const aw = a[key];
    if (!aw || Number(aw.episode) !== ep) continue;
    add(kind, aw.betrayedSlug || _slugOf(aw.betrayed) || aw.playerSlug || _slugOf(aw.name),
      aw.description, 0.03);
  }

  // Season verdicts belong to the last night, where the audience argues them.
  if (isFinale) {
    for (const [key, jitter] of [['fanFavorite', -0.02], ['playerOfSeason', 0.01],
      ['mostRobbedPlayer', 0.02], ['villainOfSeason', 0.03]]) {
      const aw = a[key];
      if (!aw) continue;
      add('twist', aw.playerSlug || _slugOf(aw.name), aw.description, jitter);
    }
  }
  return out;
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
