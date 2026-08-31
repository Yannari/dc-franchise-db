// Continuity — what a character actually DID, read back out of the archive.
//
// The Favorites continuity bible was written by hand for twelve people, and
// its chronology section turned out to be pure transcription: `gameplayStyle`,
// `keyMoments`, `alliances` and `rivalries` are already sitting in every
// season document. Nothing here is generated. This module reads the archive
// and hands the Studio the same shape the bible has, for anybody, in the
// vocabulary of the show they actually played.
//
// WHY IT DOES NOT USE `players_database.json`: that index stores a season as a
// bare integer, and a bare integer is Total Drama permanently. Misha won Big
// Brother 1 and her record there says `seasons:[1]`, which points at Total
// Drama's first season — a cast she is not in. `seasons_database.json` keeps
// `format` and `seasonId`, so the show survives the trip. Read the show-aware
// index, then read the season documents, which each declare their own format.
//
// It reads `seasonDataFile()` from the social adapter rather than spelling the
// filename rule out again — that map has already drifted across three copies
// in this project. The fetch itself is three lines and is inlined so this
// module stays a near-leaf (shows.js and adapter.js, both leaves); importing
// `loadSeasonDoc` from social/archive.js would drag core.js and localStorage
// into a module the Studio wants to call before a game exists.
import { SHOWS, showWords, showName, DEFAULT_FORMAT } from './shows.js';
import { seasonDataFile } from './social/adapter.js';
// A true leaf — it imports nothing. It owns when a season aired and what
// "now" means, and nothing else in this project is allowed a second opinion.
import { ageAt, byAirDate, latestAired, setFranchiseNow, yearsBetween } from './franchise-calendar.js';

/** Fetch one published season document. Null when it has not aired. */
async function loadSeasonDoc(format, season, root) {
  const res = await fetch(`${root}/data/seasons/${seasonDataFile(format, season)}`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Human wording for the per-season counters.
 *
 * The registry's `careerStats` pairs a season-row path with the name of the
 * CAREER TOTAL it accumulates into (`idolsFound` -> `totalIdolsFound`). Those
 * second entries are field names for a database, and printing them put
 * "3 timesNominated" on the screen. The path is the stable half, so the label
 * hangs off that; anything unmapped falls back to spacing out the camelCase
 * rather than inventing a word for it.
 *
 * Stored [singular, plural]: a stat line reading "1 immunity wins" is the kind
 * of small wrongness that makes a generated panel look untrustworthy sitting
 * next to prose somebody wrote by hand.
 */
const STAT_LABELS = {
  'immunityWins': ['immunity win', 'immunity wins'],
  'rewardWins': ['reward win', 'reward wins'],
  'idolsFound': ['idol found', 'idols found'],
  'bb.hohWins': ['HOH win', 'HOH wins'],
  'bb.vetoWins': ['veto win', 'veto wins'],
  'bb.blockBusterWins': ['Block Buster win', 'Block Buster wins'],
  'bb.timesNominated': ['time nominated', 'times nominated'],
};

function _statLabel(path, format, value) {
  // `challengeWins` is the one label that must be built from the registry: a
  // Total Drama challenge is a Big Brother competition. It takes `comp` (the
  // singular noun) and not `comps` — on Total Drama `comps` is already the
  // phrase "immunity wins", which collided with the immunityWins row and
  // printed the same counter twice.
  if (path === 'challengeWins') {
    const noun = showWords(format).comp;
    return `${noun} win${value === 1 ? '' : 's'}`;
  }
  const pair = STAT_LABELS[path];
  if (pair) return value === 1 ? pair[0] : pair[1];
  return path.split('.').pop().replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

/** One player's single season, flattened out of that season's document. */
function _appearance(doc, meta, row) {
  const format = meta.format || DEFAULT_FORMAT;
  const w = showWords(format);
  const stats = [];
  // Which numbers matter is a per-show fact and lives in the registry, so a
  // Total Drama line counts idols and a Big Brother line counts HOHs.
  for (const [path] of (SHOWS[format]?.careerStats || [])) {
    const value = path.split('.').reduce((o, k) => (o == null ? o : o[k]), row);
    if (value) stats.push({ label: _statLabel(path, format, value), key: path, value });
  }
  return {
    format,
    show: showName(format),
    seasonNumber: meta.seasonNumber,
    seasonId: meta.seasonId || String(meta.seasonNumber),
    title: meta.title || '',
    // WHEN it aired, carried through so a career can be placed in time. The
    // calendar is the only thing that can turn "the wiki says she is 16" into
    // a birth year — 16 at a season that aired in 2023 is not 16 now.
    airYear: meta.airYear || null,
    airSlot: meta.airSlot || null,
    placement: row.placement,
    // Total Drama writes `phase`, Big Brother writes `status`. Both mean the
    // same thing: how far they got and how it ended.
    outcome: row.phase || row.status || '',
    exitWord: w.exit,
    roundWord: w.round,
    gameplayStyle: row.gameplayStyle || '',
    notes: row.notes || '',
    story: row.story || '',
    keyMoments: Array.isArray(row.keyMoments) ? row.keyMoments.slice() : [],
    alliances: Array.isArray(row.alliances) ? row.alliances.slice() : [],
    rivalries: Array.isArray(row.rivalries) ? row.rivalries.slice() : [],
    showmance: row.showmance || '',
    votesReceived: row.votesReceived || 0,
    juryVotes: row.juryVotes || 0,
    stats,
    won: row.placement === 1,
  };
}

/**
 * A season counts once it has a winner.
 *
 * Total Drama documents carry `status:'Complete'`; the Big Brother document
 * does not carry one at all, so keying off `status` alone would hide every BB
 * season from the box. A crowned winner is the fact both shows agree on.
 */
function _isComplete(doc) {
  return !!(doc && (doc.winner || doc.status === 'Complete'));
}

let _seasons = [];      // every season row, for deriving the franchise's "now"
let _index = null;      // slug -> appearance[]
let _indexPromise = null;

async function _build(root) {
  const res = await fetch(`${root}/seasons_database.json`);
  if (!res.ok) return {};
  const seasons = (await res.json()).seasons || [];
  _seasons = seasons;
  // Everything that needs to know what year it is asks the calendar, and
  // this is the one place that has just read the list.
  setFranchiseNow(seasons);
  const index = {};
  // Sequential rather than parallel: fifteen small documents, and the Studio
  // opens this once per session. A burst of fetches on a page that is already
  // loading avatars is the worse trade.
  for (const meta of seasons) {
    const format = meta.format || DEFAULT_FORMAT;
    const doc = await loadSeasonDoc(format, meta.seasonNumber, root);
    if (!_isComplete(doc)) continue;
    for (const row of (doc.placements || [])) {
      const slug = row.playerSlug;
      if (!slug) continue;
      (index[slug] = index[slug] || []).push(_appearance(doc, meta, row));
    }
  }
  for (const slug of Object.keys(index)) {
    index[slug].sort((a, b) => (a.format === b.format)
      ? a.seasonNumber - b.seasonNumber
      : a.format.localeCompare(b.format));
  }
  return index;
}

/** Load (once) and return the slug -> appearances map. */
export async function continuityIndex({ root = '.' } = {}) {
  if (_index) return _index;
  if (!_indexPromise) {
    _indexPromise = _build(root.replace(/\/+$/, '') || '.')
      .then(idx => { _index = idx; return idx; })
      .catch(() => { _index = {}; return _index; });
  }
  return _indexPromise;
}

/** Forget the cached archive — call after a new season is published. */
export function resetContinuityIndex() { _index = null; _indexPromise = null; }

/** Every completed season this slug played, oldest first. Empty if none. */
export async function appearancesFor(slug, opts = {}) {
  if (!slug) return [];
  const index = await continuityIndex(opts);
  return index[slug] || [];
}

/**
 * The header line: how many seasons, across which shows, and the best result.
 *
 * Kept separate from the per-season rows because it is the part that has to
 * read correctly for someone who has played both shows — "2 seasons across
 * Total Drama and Big Brother" rather than a number that implies one franchise.
 */
export function continuitySummary(appearances) {
  if (!appearances.length) return null;
  const shows = [...new Set(appearances.map(a => a.show))];
  const best = appearances.reduce((b, a) => (a.placement < b.placement ? a : b));
  const wins = appearances.filter(a => a.won).length;
  return {
    seasons: appearances.length,
    shows,
    wins,
    best: { placement: best.placement, seasonId: best.seasonId, title: best.title },
  };
}

/**
 * Who they keep running into.
 *
 * Alliances and rivalries are per-season lists; across a career the same name
 * recurring is the interesting signal, so they are counted rather than merged.
 * A name that is both an ally and a rival is exactly the sort of history worth
 * seeing before casting, so it is not de-duplicated across the two buckets.
 *
 * `alliances` is deliberately not called "allies": the archive puts PEOPLE in
 * it for the early seasons and ALLIANCE NAMES for the later ones ("Chase,
 * Damien" in Season 9, "The Movement, The Oath" in Season 10). The continuity
 * bible prints the same mixed list under the same word, so the box matches it
 * rather than pretending the field is cleaner than it is.
 */
export function continuityTies(appearances) {
  const tally = (key) => {
    const counts = {};
    for (const a of appearances) {
      for (const name of a[key]) counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
      .map(([name, count]) => ({ name, count }));
  };
  return { alliances: tally('alliances'), rivalries: tally('rivalries') };
}

/**
 * When they debuted, and when "now" is — the two dates an age needs.
 *
 * The wiki states a canonical age and nothing else: Leshawna is sixteen. That
 * is a fact about a moment, and the moment is her FIRST season, not today. So
 * sixteen at a season that aired in spring 2020 is a person born around 2004,
 * who is twenty-two in the fall of 2026 — and the only thing that can perform
 * that translation is this franchise's own calendar.
 *
 * "Now" is derived, never stored: `latestAired` reads the last season that
 * actually aired. A stored current year would be a second clock, and two
 * clocks disagree — the calendar module says so at length and it is right.
 *
 * Debut is by AIR DATE, not by season number. Appearances sort by show then
 * number, which puts bb-1 after td-14 for somebody who did both; the season
 * that came first in time is the one an age attaches to.
 */
export function ageAnchor(appearances) {
  const placed = (appearances || []).filter(a => a.airYear);
  if (!placed.length) return null;
  const debut = placed.slice().sort(byAirDate)[0];
  const now = latestAired(_seasons) || debut;
  return {
    debut: {
      seasonId: debut.seasonId, title: debut.title,
      airYear: debut.airYear, airSlot: debut.airSlot,
    },
    now: { seasonId: now.seasonId, title: now.title, airYear: now.airYear, airSlot: now.airSlot },
    // Whole years from their first season to the present, which is the number
    // a canonical age has to be moved forward by.
    yearsSinceDebut: yearsBetween(debut, now),
  };
}

/**
 * A birth year from a canonical age, and the age that implies today.
 *
 * Deliberately arithmetic and not a model's guess. Asking for a birthdate
 * directly gets one computed in a language model's head from an age it also
 * had to infer, and neither half is checkable afterwards. Asking only for the
 * age it READ — which can carry a quote — and doing the sum here keeps the
 * sourced part sourced and the derived part derived.
 */
export function birthFromCanonAge(canonAge, anchor, monthDay) {
  const age = Number(canonAge);
  if (!Number.isInteger(age) || age < 1 || age > 99 || !anchor?.debut?.airYear) return null;
  const birthYear = Number(anchor.debut.airYear) - age;
  const md = /^\d{2}-\d{2}$/.test(String(monthDay || '')) ? monthDay : null;
  const birthdate = md ? `${birthYear}-${md}` : null;
  const season = { airYear: anchor.now.airYear, airSlot: anchor.now.airSlot };
  return {
    birthYear,
    birthdate,
    // The age they are at the franchise's present, which is what a profile
    // should show — not the age the wiki froze them at years ago.
    ageNow: birthdate ? ageAt(birthdate, season) : Number(anchor.now.airYear) - birthYear,
  };
}
