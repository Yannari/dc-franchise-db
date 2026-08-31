// What the franchise has actually done, computed per show.
//
// franchise_database.json holds records, milestones and champions as PRECOMPUTED
// all-shows aggregates. That was right while there was one show. With two, the
// Franchise page answers "most challenge wins" with a number that silently mixes
// a Total Drama career and a Big Brother one, and there is no way to filter it —
// the per-show figures were never in the file to begin with.
//
// So this derives them instead, from the two documents that DO carry the show on
// every row: players_database.json (`seasonDetails[].format`) and
// seasons_database.json (`seasonId`). Scoping is then a predicate rather than a
// second set of files to keep in step.
//
// The same walk answers the trivia questions — "first to win twice", "youngest
// winner", "first Asian winner" — because those are the same records with a
// different question attached. One engine, two surfaces; a second one would
// drift from this within a season.
//
// TRIVIA STAYS SILENT WHEN IT DOES NOT KNOW. Age, ethnicity and nationality
// exist for a minority of the roster, so a demographic fact is computed only
// over players who have the field and is omitted otherwise. "First Asian winner"
// with no data is not a question worth guessing at.
//
// Pure: documents in, records out. No fetch, no DOM.
import { parseBio } from './bio.js';

const DEFAULT_FORMAT = 'total-drama';
const fmtOf = d => d?.format || DEFAULT_FORMAT;
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
/** The slug rule the export layer uses, character for character. */
const _slug = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Every season detail that belongs to this show. `all` keeps both. */
function detailsOf(player, format) {
  const ds = player?.seasonDetails || [];
  return format === 'all' ? ds : ds.filter(d => fmtOf(d) === format);
}

/**
 * Career totals, recomputed for one show.
 *
 * NOT read off the player's top-level fields. Those are cross-format sums by
 * design — a Big Brother competition win is folded into `totalChallengeWins` —
 * so using them under a Total Drama filter would report a number that includes
 * seasons the filter just excluded.
 */
function careerIn(player, format) {
  const ds = detailsOf(player, format);
  if (!ds.length) return null;
  const sum = k => ds.reduce((n, d) => n + num(d[k]), 0);
  const placements = ds.map(d => num(d.placement)).filter(n => n > 0);
  return {
    id: player.id,
    name: player.name,
    tier: player.tier,
    seasonsPlayed: ds.length,
    wins: ds.filter(d => num(d.placement) === 1).length,
    challengeWins: sum('challengeWins'),
    immunityWins: sum('immunityWins'),
    rewardWins: sum('rewardWins'),
    idolsFound: sum('idolsFound'),
    votesAgainst: sum('votesReceived'),
    juryVotes: sum('juryVotes'),
    bestPlacement: placements.length ? Math.min(...placements) : null,
    avgPlacement: placements.length
      ? Math.round((placements.reduce((a, b) => a + b, 0) / placements.length) * 100) / 100
      : null,
    seasons: ds.map(d => num(d.season)).sort((a, b) => a - b),
    details: ds,
  };
}

/** Everybody who has played this show, with that show's numbers. */
export function careersIn(players, format = 'all') {
  return (players?.players || players || [])
    .map(p => careerIn(p, format))
    .filter(Boolean);
}

/** The eight career boards the Franchise page draws. */
export function careerBoards(careers) {
  const board = (key, label, pick, sub, better = 'higher', min = 0) => {
    const rows = careers
      .filter(c => c.seasonsPlayed >= min && pick(c) !== null)
      .sort((a, b) => (better === 'lower' ? pick(a) - pick(b) : pick(b) - pick(a))
        || b.seasonsPlayed - a.seasonsPlayed
        || a.name.localeCompare(b.name));
    return { key, label, rows, value: pick, sub };
  };
  return [
    board('wins', '🏆 Most Wins', c => c.wins, c => `${c.seasonsPlayed} seasons`),
    board('seasons', '🔄 Most Seasons', c => c.seasonsPlayed, c => `${c.wins} wins`),
    board('chalWins', '💪 Most Challenge Wins', c => c.challengeWins, c => `${c.immunityWins} immunity`),
    board('immWins', '🛡️ Most Immunity Wins', c => c.immunityWins, c => `${c.challengeWins} total`),
    board('juryVotes', '🗳️ Most Jury Votes', c => c.juryVotes, c => `${c.seasonsPlayed} seasons`),
    board('votes', '🎯 Most Votes Against', c => c.votesAgainst, c => `${c.seasonsPlayed} seasons`),
    board('idols', '💎 Most Idols Found', c => c.idolsFound, c => `${c.seasonsPlayed} seasons`),
    board('avgPlace', '📊 Best Avg Placement (2+ seasons)', c => c.avgPlacement,
      c => `${c.seasonsPlayed} seasons`, 'lower', 2),
  ];
}

/** The seasons of one show, oldest first. */
export function seasonsIn(seasonsDb, format = 'all') {
  return (seasonsDb?.seasons || [])
    .filter(s => format === 'all' || (s.format || DEFAULT_FORMAT) === format)
    .slice()
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
}

/**
 * EVERYBODY WHO WON A SEASON — one name or several, never a chosen one.
 *
 * `winner{}` on a season document is SINGULAR, and it was singular because
 * every show in the franchise had exactly one winner until The Traitors, which
 * ends with the pot SPLIT more often than not: the surviving Faithfuls take it
 * between them, with no ordinal finish separating them and no runner-up in the
 * usual sense. docs/ADDING-A-SHOW.md §5 still requires the singular field, so
 * a split season carries `winners[]` and leaves `winner` null rather than
 * nominating one of four people as the real one.
 *
 * This is NOT only a Traitors problem, which is the reason it lives here and
 * not in js/tr/. Total Drama season 8 ended with Alejandro and Cameron both at
 * placement 1, and its document names Alejandro in `winner{}` — so every
 * reader that asked the document who won has been answering Cameron's own
 * season with somebody else's name.
 *
 * Three sources, in order of how COMPLETE each one can be:
 *   1. `winners[]` — the document declaring the set outright.
 *   2. `placements[]` at placement 1 — the standings, which have always been
 *      able to express a tie. On season 8 this is the ONLY place the second
 *      champion appears, which is why it outranks the singular block rather
 *      than backing it up: a document carrying both is a document whose
 *      `winner{}` is a subset of its own standings.
 *   3. `winner{}` — a season index row has this and no placements at all.
 * Reading them in this order means a caller with any of the three shapes in
 * its hand gets every winner that shape can support, and never a subset.
 *
 * Takes the singular block's tally/runner-up prose along ONLY when that block
 * is about that player, because on season 8 it is not.
 */
export function seasonWinners(season) {
  if (!season) return [];
  // `winner` is a block on a published document and a BARE NAME on some of the
  // older records the archive reads back. Both of them say the same thing.
  const raw = typeof season.winner === 'string' ? { name: season.winner } : season.winner;
  const w = raw && typeof raw === 'object' ? raw : null;
  const firsts = (season.placements || []).filter(p => p?.placement === 1);
  const named = Array.isArray(season.winners) && season.winners.length ? season.winners
    : (firsts.length ? firsts : (w?.name ? [w] : []));
  return named.filter(p => p?.name).map(p => {
    const slug = p.playerSlug || _slug(p.name);
    // The singular block's prose belongs to the person it names and nobody else.
    const mine = w && (w.playerSlug === slug || w.name === p.name) ? w : {};
    return {
      name: p.name,
      playerSlug: slug,
      vote: p.vote || mine.vote || '',
      runnerUp: p.runnerUp || mine.runnerUp || null,
      keyStats: p.keyStats || mine.keyStats || '',
    };
  });
}

/** The name every winner of a season shares. Handy for a class or a filter. */
export function isSeasonWinner(season, name) {
  return seasonWinners(season).some(w => w.name === name);
}

/**
 * Who won each season of this show, one row per WINNER rather than per season.
 *
 * A co-winner used to be dropped on the floor here: the map took `s.winner`
 * and there is only one of those, so the Champions grid has been showing one
 * of season 8's two champions since the day it was published. `coWinners`
 * rides along so a card can say which kind of win it was without counting.
 */
export function championsIn(seasonsDb, format = 'all') {
  const out = [];
  for (const s of seasonsIn(seasonsDb, format)) {
    const winners = seasonWinners(s);
    for (const w of winners) {
      out.push({
        season: s.seasonNumber,
        seasonId: s.seasonId,
        format: s.format || DEFAULT_FORMAT,
        seasonTitle: s.title,
        emoji: s.emoji,
        winner: w.name,
        playerSlug: w.playerSlug,
        finalVote: w.vote || '—',
        runnerUp: w.runnerUp || null,
        keyStats: w.keyStats,
        coWinners: winners.length,
      });
    }
  }
  return out;
}

/**
 * Single-season records — the best anybody has ever done in one go.
 *
 * Read off the details rather than a precomputed list, so a new season enters
 * the table by being published rather than by somebody regenerating a file.
 */
export function milestonesIn(careers, format = 'all') {
  const rows = [];
  const best = (label, pick, fmt, better = 'higher') => {
    let win = null;
    for (const c of careers) {
      for (const d of c.details) {
        const v = pick(d);
        if (v === null || v === undefined) continue;
        if (!win || (better === 'lower' ? v < win.v : v > win.v)) win = { c, d, v };
      }
    }
    if (win) rows.push({
      category: label,
      holder: win.c.name,
      playerSlug: win.c.id,
      stat: fmt(win.v, win.d),
      season: win.d.seasonId || win.d.season,
      seasonNumber: num(win.d.season),
      format: fmtOf(win.d),
    });
  };

  best('Most Challenge Wins (Season)', d => num(d.challengeWins) || null, v => `${v} wins`);
  best('Most Immunity Wins (Season)', d => num(d.immunityWins) || null, v => `${v} wins`);
  best('Most Votes Against (Season)', d => num(d.votesReceived) || null, v => `${v} votes`);
  best('Most Idols Found (Season)', d => num(d.idolsFound) || null, v => `${v} idols`);
  best('Most Jury Votes', d => num(d.juryVotes) || null, v => `${v} votes`);
  // A winner nobody ever wrote down. Restricted to winners, or "fewest votes"
  // is just whoever went home first.
  best('Fewest Votes to Win', d => (num(d.placement) === 1 ? num(d.votesReceived) : null),
    v => `${v} vote${v === 1 ? '' : 's'}`, 'lower');
  return rows;
}

/** Players with more than one season OF THIS SHOW. */
export function returneesIn(careers) {
  return careers
    .filter(c => c.seasonsPlayed > 1)
    .sort((a, b) => b.seasonsPlayed - a.seasonsPlayed || a.name.localeCompare(b.name));
}

/**
 * The bio the roster knows about somebody.
 *
 * Prefers the real columns; falls back to parsing the lead-in out of their voice
 * profile, which is where the Casting Studio wrote these facts for years before
 * they became fields. Without the fallback, every demographic question comes
 * back empty until somebody re-publishes the roster.
 */
export function bioOf(slug, { roster = [], voices = {} } = {}) {
  const row = (roster.players || roster || []).find(p => p.slug === slug || p.id === slug);
  if (row && (row.age || row.ethnicity || row.nationality)) {
    return {
      age: row.age ?? null,
      ethnicity: row.ethnicity || '',
      nationality: row.nationality || '',
      sexuality: row.sexuality || '',
    };
  }
  const name = row?.name;
  const parsed = name && voices[name] ? parseBio(voices[name]) : null;
  return parsed
    ? { age: parsed.age, ethnicity: parsed.ethnicity, nationality: parsed.nationality,
        sexuality: parsed.sexuality || row?.sexuality || '' }
    : { age: null, ethnicity: '', nationality: '', sexuality: row?.sexuality || '' };
}

/**
 * Trivia: the firsts, the onlys and the extremes.
 *
 * Every entry states the fact and names who it is about. A fact that cannot be
 * computed is ABSENT rather than shown empty — a trivia list padded with "—"
 * teaches you to stop reading it.
 */
export function triviaIn(careers, seasonsDb, format = 'all', bios = {}) {
  const out = [];
  const seasons = seasonsIn(seasonsDb, format);
  const say = (fact, holder, detail) => out.push({ fact, holder, detail });

  // ── firsts, from chronology ──
  const champs = championsIn(seasonsDb, format);
  if (champs.length) {
    say('First winner', champs[0].winner, `${champs[0].seasonTitle}`);
    const repeat = careers.filter(c => c.wins > 1)
      .sort((a, b) => (a.details.filter(d => num(d.placement) === 1).map(d => num(d.season)).sort((x, y) => x - y)[1] || 99)
        - (b.details.filter(d => num(d.placement) === 1).map(d => num(d.season)).sort((x, y) => x - y)[1] || 99))[0];
    if (repeat) say('First to win twice', repeat.name, `${repeat.wins} wins in ${repeat.seasonsPlayed} seasons`);
  }

  // A winner the house never wrote down once.
  const clean = careers.find(c => c.details.some(d => num(d.placement) === 1 && num(d.votesReceived) === 0));
  if (clean) {
    const d = clean.details.find(x => num(x.placement) === 1 && num(x.votesReceived) === 0);
    say('First winner never voted for', clean.name, `season ${d.season}, no votes against`);
  }

  // The most-decorated career, and the most-targeted.
  const byChal = [...careers].sort((a, b) => b.challengeWins - a.challengeWins)[0];
  if (byChal?.challengeWins) say('Most challenge wins, career', byChal.name, `${byChal.challengeWins} wins`);
  const byVotes = [...careers].sort((a, b) => b.votesAgainst - a.votesAgainst)[0];
  if (byVotes?.votesAgainst) say('Most votes against, career', byVotes.name, `${byVotes.votesAgainst} votes`);

  // ── demographic, only where the data exists ──
  const withBio = careers
    .map(c => ({ c, bio: bios[c.id] || { age: null } }))
    .filter(x => x.bio && x.bio.age);

  if (withBio.length >= 2) {
    const young = withBio.reduce((a, b) => (b.bio.age < a.bio.age ? b : a));
    const old = withBio.reduce((a, b) => (b.bio.age > a.bio.age ? b : a));
    say('Youngest to play', young.c.name, `${young.bio.age} years old`);
    say('Oldest to play', old.c.name, `${old.bio.age} years old`);

    const winners = withBio.filter(x => x.c.wins > 0);
    if (winners.length >= 2) {
      const yw = winners.reduce((a, b) => (b.bio.age < a.bio.age ? b : a));
      const ow = winners.reduce((a, b) => (b.bio.age > a.bio.age ? b : a));
      say('Youngest winner', yw.c.name, `${yw.bio.age} years old`);
      if (ow.c.id !== yw.c.id) say('Oldest winner', ow.c.name, `${ow.bio.age} years old`);
    }
  }

  // "First <ethnicity> winner", one per value that actually appears. Ordered by
  // the season they won, so "first" means first.
  const firstBy = (field, label) => {
    const seen = new Set();
    const winners = careers
      .filter(c => c.wins > 0)
      .map(c => ({ c, bio: bios[c.id], won: Math.min(...c.details.filter(d => num(d.placement) === 1).map(d => num(d.season))) }))
      .filter(x => x.bio && x.bio[field])
      .sort((a, b) => a.won - b.won);
    for (const w of winners) {
      const value = w.bio[field];
      if (seen.has(value)) continue;
      seen.add(value);
      say(`First ${value} ${label}`, w.c.name, `season ${w.won}`);
    }
  };
  firstBy('ethnicity', 'winner');
  firstBy('nationality', 'winner');

  return { trivia: out, seasonCount: seasons.length };
}

/**
 * Records for ONE NAMED COMPETITION — the Wall, Slip Through The Wickets, any
 * of them.
 *
 * This is the question a comp with a name exists to be asked: not "who won HOH
 * in week three" but "who is the youngest player ever to win the Wall". It
 * needs three things, and until now the middle one was missing:
 *
 *   which comp was played   the season document records it per week
 *   who won it              likewise
 *   how old they were       the roster's bio columns
 *
 * The season documents are the source rather than players_database, because a
 * career total has no idea which competition it was won at.
 *
 * A comp nobody has played yet simply does not appear. A season published
 * before comps were recorded contributes nothing and says so through absence,
 * which is the honest answer — not an empty Wall record implying nobody has
 * ever won it.
 */
export function compRecords(seasonDocs = [], bios = {}, { slugOf = null } = {}) {
  const byComp = new Map();
  const idOf = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

  for (const doc of seasonDocs) {
    if (!doc) continue;
    const season = num(doc.seasonNumber);
    for (const w of (doc.weeks || [])) {
      for (const [slot, comp] of [['Head of Household', w.hohComp], ['Veto', w.vetoComp]]) {
        if (!comp?.name || !comp.winner) continue;
        const key = comp.id || idOf(comp.name);
        if (!byComp.has(key)) {
          byComp.set(key, { id: key, name: comp.name, slot, wins: [] });
        }
        const slug = slugOf ? slugOf(comp.winner) : idOf(comp.winner);
        byComp.get(key).wins.push({
          winner: comp.winner, slug, season, week: num(w.week),
          age: bios[slug]?.age ?? null,
        });
      }
    }
  }

  return [...byComp.values()].map(c => {
    const aged = c.wins.filter(w => w.age);
    const most = new Map();
    for (const w of c.wins) most.set(w.slug, (most.get(w.slug) || 0) + 1);
    const [topSlug, topCount] = [...most.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    const topName = c.wins.find(w => w.slug === topSlug)?.winner;

    return {
      ...c,
      played: c.wins.length,
      // Only stated where an age is actually on file. Most of the Total Drama
      // roster has none, and a "youngest" computed over three of nineteen
      // players is a sentence that sounds true and is not.
      youngest: aged.length >= 2 ? aged.reduce((a, b) => (b.age < a.age ? b : a)) : null,
      oldest: aged.length >= 2 ? aged.reduce((a, b) => (b.age > a.age ? b : a)) : null,
      agesKnown: aged.length,
      mostWins: topCount > 1 ? { name: topName, slug: topSlug, count: topCount } : null,
      first: c.wins[0] || null,
    };
  }).sort((a, b) => b.played - a.played || a.name.localeCompare(b.name));
}

/** Everything the Franchise page needs about one show, in one call. */
export function franchiseRecords({ players, seasonsDb, roster, voices, format = 'all' } = {}) {
  const careers = careersIn(players, format);
  const bios = {};
  for (const c of careers) bios[c.id] = bioOf(c.id, { roster, voices });
  const seasons = seasonsIn(seasonsDb, format);

  return {
    format,
    seasons,
    careers,
    champions: championsIn(seasonsDb, format),
    boards: careerBoards(careers),
    milestones: milestonesIn(careers, format),
    returnees: returneesIn(careers),
    ...triviaIn(careers, seasonsDb, format, bios),
    stats: {
      seasons: seasons.length,
      players: careers.length,
      appearances: careers.reduce((n, c) => n + c.seasonsPlayed, 0),
      episodes: seasons.reduce((n, s) => n + num(s.episodeCount), 0),
    },
  };
}
