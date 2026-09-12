// ══════════════════════════════════════════════════════════════════════
// dr/export.js — the season document the rest of the site reads
// ══════════════════════════════════════════════════════════════════════
//
// Until now a drag season existed only inside a running tab. This turns the
// played rows into the document every other page loads: the season page, the
// article, the rankings board, the publish step.
//
// ── THE ONE SHAPE DECISION THAT MATTERS ───────────────────────────────
//
// A queen who has already gone home still gets a cell in every later episode,
// marked `OUT`. That is not padding — it is what a track record chart IS. The
// community grid the whole show is read through has a row per queen and a
// column per episode, and a row that stops early cannot be drawn. Any exporter
// that emitted only the living queens would produce a chart with ragged rows
// and no way to line the columns up.
//
// ── AND THE ONE THE REGISTRY DECIDES ──────────────────────────────────
//
// `eliminated` is always null and departures live on `exits[]`. This show has
// no vote, and every existing reader of `eliminated` in this codebase means
// "the person the house voted out". Writing a name there would make a drag
// season read as a Big Brother eviction in half the site.
import { SHOWS, showWords, seasonRounds, DRAG_FORMAT } from '../shows.js';
import { edgesOf } from './family.js';

// Re-exported so this module's own readers need one import, not two.
export { DRAG_FORMAT };

const PREFIX = SHOWS[DRAG_FORMAT].prefix;

export const seasonFilePath = n => `data/seasons/${PREFIX}-${n}-data.json`;
export const episodeStoreKey = (n, e) => `${PREFIX}_episode_s${n}_e${e}`;
export const analyticsKey = n => `AI_ANALYTICS_${PREFIX}-${n}`;

const slugOf = name => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Where a queen placed in one episode, in the grid's own vocabulary. */
function resultFor(row, name) {
  const dr = row.dr || {};
  if (dr.finale) {
    const p = dr.finale.placements || [];
    if (p[0] === name) return 'WINNER';
    return p.includes(name) ? 'FINALIST' : 'OUT';
  }
  if ((row.exits || []).some(x => x.name === name)) return 'ELIM';
  if (!(dr.living || []).includes(name)) return 'OUT';
  const c = dr.call || {};
  if ((c.win || []).includes(name)) return 'WIN';
  if ((c.high || []).includes(name)) return 'HIGH';
  /* BTM2 is the bottom TWO -- she lip synced and survived. A queen the panel
     NAMED in the bottom and then saved on the stage is LOW, which is what the
     fandom's own chart calls her: season 16 uses `{{LOW}}` eleven times and a
     bare `{{BTM}}` once, and the legend has no BTM line -- its lightpink entry
     reads "in the bottom, but was not up for elimination".
     This exporter used to emit BTM for that queen, inventing a seventh result
     the chart has no colour for. */
  if ((c.bottom || []).includes(name)) return 'BTM2';
  if ((c.atRisk || []).includes(name)) return 'LOW';
  if ((c.low || []).includes(name)) return 'LOW';
  return 'SAFE';
}

/** Everybody who was ever in the season, in the order they arrived. */
function fullCast(rows) {
  const seen = [];
  for (const row of rows) {
    for (const n of row.dr?.living || []) if (!seen.includes(n)) seen.push(n);
    for (const x of row.exits || []) if (!seen.includes(x.name)) seen.push(x.name);
  }
  return seen;
}

export function dragEpisodes(rows) {
  const cast = fullCast(rows);
  return (rows || []).map((row, i) => {
    const dr = row.dr || {};
    const bendBy = Object.fromEntries((dr.bend || []).map(b => [b.name, b]));
    const arcBy = {};
    for (const s of dr.storylines || []) {
      for (const n of s.players) if (!arcBy[n]) arcBy[n] = s.variantName || s.arc;
    }

    return {
      episode: row.num ?? i + 1,
      challenge: dr.challenge
        ? {
          id: dr.challenge.id, name: dr.challenge.name,
          format: dr.challenge.format || null, stage: dr.challenge.stage || null,
        }
        : null,
      mini: dr.mini ? { id: dr.mini.id, name: dr.mini.name, winner: dr.mini.winner } : null,
      judges: [...(dr.judges || [])],
      guest: dr.guest ? { name: dr.guest.name || dr.guest, playerSlug: slugOf(dr.guest.name || dr.guest) } : null,
      runwayCategory: dr.runway?.category || null,
      song: dr.lipsync ? { title: dr.lipsync.song, artist: dr.lipsync.artist } : null,
      // EVERY QUEEN, EVERY EPISODE. See the note at the top of this file.
      placements: cast.map(name => ({
        name,
        playerSlug: slugOf(name),
        result: resultFor(row, name),
        panelRank: bendBy[name]?.panelRank ?? null,
        finalRank: bendBy[name]?.finalRank ?? null,
        storyline: arcBy[name] || null,
      })),
      lipsync: dr.lipsync
        ? {
          queens: [...(dr.lipsync.queens || [])],
          winner: dr.lipsync.winner || null,
          loser: dr.lipsync.loser || null,
          call: dr.lipsync.call || null,
          song: dr.lipsync.song || null,
        }
        : null,
      exits: (row.exits || []).map(x => ({
        name: x.name, playerSlug: slugOf(x.name),
        verb: x.verb || showWords(DRAG_FORMAT).exit,
        channel: x.channel || 'lipsync',
      })),
      // Always null. This show has no vote; see the header.
      eliminated: null,
      twists: [...(dr.twists || [])],
    };
  });
}

export function dragPlacements(rows, cast = null) {
  const names = cast && cast.length ? [...cast] : fullCast(rows);
  const last = rows[rows.length - 1] || {};
  const finale = last.dr?.finale || null;
  const w = showWords(DRAG_FORMAT);

  /* ── WHEN SHE LEFT FOR GOOD ──
     Ordered from the bottom up, so this decides the whole board below the
     finale. It kept the FIRST exit (`if (leftAt[x.name] === undefined)`),
     which is right for everybody who left once and wrong for the one queen a
     season brings back: a returnee was ranked where she left the first time,
     under queens who went home after her.

     Measured on the first drag season, where Taystee went out on episode
     three, came back on five and left again on six:

       exits   ep2 Marge Stache · ep3 Taystee · ep4 Cheryl Hole
               ep5 Riot · ep6 Taystee
       board   11 Riot · 12 Cheryl Hole · 13 Taystee
       true    11 Taystee · 12 Riot · 13 Cheryl Hole

     Reported as "Taystee returned ep6 so places higher than Cheryl Hole and
     Riot, but the placement doesn't say that". The same bug the house had —
     see project notes on the returnee whose career ended at her first
     eviction — and the last exit is the only one that places anybody.

     `rows` is in episode order, so the last write wins. */
  const leftAt = {};
  rows.forEach((row, i) => {
    for (const x of row.exits || []) leftAt[x.name] = i;
  });

  const finalists = finale?.placements || [];
  const ordered = [
    ...finalists,
    ...names.filter(n => !finalists.includes(n))
      .sort((a, b) => (leftAt[b] ?? -1) - (leftAt[a] ?? -1)),
  ];

  return ordered.map((name, i) => {
    let status;
    if (finale && finalists[0] === name) status = 'Winner';
    else if (finale && finalists[1] === name) status = 'Runner-up';
    else if (finalists.includes(name)) status = 'Finalist';
    else {
      /* HER LAST EXIT, not her first: a queen eliminated, brought back and
         then disqualified is not "sashayed away", and `find` returns the
         earlier one. Same rule as `leftAt` above. */
      const exits = rows.flatMap(r => r.exits || []).filter(x => x.name === name);
      const exit = exits[exits.length - 1];
      const verb = exit?.verb || w.exit;
      status = verb.charAt(0).toUpperCase() + verb.slice(1);
    }
    return { name, playerSlug: slugOf(name), placement: i + 1, status };
  });
}

export function dragCareerStats(rows, name, congeniality = null) {
  let wins = 0; let highs = 0; let lows = 0; let bottoms = 0; let lipsyncWins = 0;
  for (const row of rows) {
    const c = row.dr?.call || {};
    if ((c.win || []).includes(name)) wins++;
    if ((c.high || []).includes(name)) highs++;
    if ((c.low || []).includes(name)) lows++;
    // "Times in the bottom" is both of them: being named is being in it,
    // whether or not the night ended in a lip sync.
    if ((c.bottom || []).includes(name) || (c.atRisk || []).includes(name)) bottoms++;
    const ls = row.dr?.lipsync;
    if (ls && ls.winner === name) lipsyncWins++;
    // A double shantay has no winner and both survived, which still counts as
    // having won a lip sync for your life.
    if (ls && ls.call === 'double-shantay' && (ls.queens || []).includes(name)) lipsyncWins++;
  }
  /* A COUNT, not a flag, because this line is summed across a career: a queen
     who takes the sash on two seasons has congeniality 2, the same way she has
     wins 2. It reads 0 for everybody when the caller does not say who won —
     the season document knows, a single-row lookup may not. */
  return {
    wins, highs, lows, bottoms, lipsyncWins,
    congeniality: congeniality && congeniality === name ? 1 : 0,
  };
}

/** Who she left the season attached to, if anybody. */
export function dragShowmance(rows, name) {
  const last = rows[rows.length - 1] || {};
  for (const pair of last.dr?.romances || []) {
    if (pair.includes(name)) return pair.find(n => n !== name) || null;
  }
  return null;
}

export function dragSeasonDetails(rows, seasonNumber, name, congeniality = null) {
  const placements = dragPlacements(rows);
  const row = placements.find(p => p.name === name);
  const stats = dragCareerStats(rows, name, congeniality);
  /* THE PAIR, IF THERE WAS ONE. `js/life-hook.js` reads `showmance` off the
     appearance to work out who walked out of a season together — the field is
     how a relationship survives past the finale into the life layer — and
     until this was here the drag romance thread stopped at the season
     boundary. Written only when there IS one, so an absent field means "no
     pair" rather than "this show does not do that". */
  const partner = dragShowmance(rows, name);
  return {
    season: seasonNumber,
    format: DRAG_FORMAT,
    placement: row?.placement ?? null,
    status: row?.status ?? null,
    challengeWins: stats.wins,
    ...(partner ? { showmance: partner, showmanceEnded: 'intact' } : {}),
    dr: stats,
  };
}

/**
 * Every house this season carried, as edges plus the shape they made.
 *
 * Read off the episode rows because that is where the season put them
 * (js/dr/week.js). Any row will do -- families are cast once, before the
 * first challenge -- so the first row carrying them wins.
 */
export function dragFamilies(rows) {
  const row = (rows || []).find(r => (r?.dr?.families || []).length);
  const fams = row?.dr?.families || [];
  return fams.map(f => ({
    id: f.id, name: f.name, kind: f.kind,
    surname: f.surname || null,
    authored: !!f.authored,
    members: [...f.members],
    // Kept for reading; `edges` is what a franchise tree is rebuilt from.
    roles: { ...(f.roles || {}) },
    edges: edgesOf(f),
  }));
}

export function buildDragSeasonDocument(rows, { seasonNumber, twists = [], congeniality = null } = {}) {
  const episodes = dragEpisodes(rows);
  const placements = dragPlacements(rows);
  const last = rows[rows.length - 1] || {};
  const finale = last.dr?.finale || null;
  const cast = fullCast(rows);

  const withStats = placements.map(p => {
    const stats = dragCareerStats(rows, p.name, congeniality);
    return {
      ...p,
      status: congeniality && p.name === congeniality
        ? showWords(DRAG_FORMAT).audienceAward : p.status,
      // A FLAG ON THE ROW, so a reader can find her without string-matching
      // the status against this show's vocabulary. `status` is prose and it
      // belongs to the registry; this is the fact underneath it.
      ...(congeniality && p.name === congeniality ? { congeniality: true } : {}),
      /* AND THE PAIR. This has to be on the PLACEMENT, not only on
         `dragSeasonDetails`, because the publish path never calls that
         function — `mergeDragSeason` builds each appearance from the
         document's placement rows. Writing it in the obvious place and
         nowhere the pipeline reads is how a field ends up computed, stored
         and invisible. */
      ...(dragShowmance(rows, p.name)
        ? { showmance: dragShowmance(rows, p.name), showmanceEnded: 'intact' } : {}),
      dr: stats,
    };
  });

  const winnerName = finale?.winner || placements[0]?.name || null;

  return {
    seasonNumber,
    format: DRAG_FORMAT,
    seasonId: `${PREFIX}-${seasonNumber}`,
    castSize: cast.length,
    episodeCount: episodes.length,
    winner: winnerName ? { name: winnerName, playerSlug: slugOf(winnerName), vote: '' } : null,
    winners: winnerName ? [winnerName] : [],
    placements: withStats,
    // The registry's roundsPath is 'dr.episodes', so they live under `dr`.
    /* THE HOUSES, WHICH OUTLIVE THE SEASON. A drag family is a fact about a
       queen and not about a run of episodes -- the woman who put you in your
       first heels is still your drag mother three seasons later -- so a
       franchise genealogy is the union of every house every season recorded.
       This was computed at cast time, used all season and then dropped on the
       way to the file, which made the whole thing per-season by accident.
       Edges rather than a tree, because edges MERGE: the same mother recorded
       by two seasons is one edge, where two trees that disagree cannot be
       reconciled at all. */
    dr: { episodes, families: dragFamilies(rows) },
    twists: [...twists],
    finale: finale
      ? {
        type: finale.type,
        rounds: (finale.rounds || []).map(r => ({ a: r.a, b: r.b, song: r.song, winner: r.winner })),
        placements: [...(finale.placements || [])],
      }
      : null,
    congeniality: congeniality || null,
  };
}

/**
 * The four numbers the ranking board prices, for one queen in one season.
 *
 * Separate from `dragCareerStats` on purpose: that one is the article's
 * record and answers "what did she do", where this answers "what should a
 * board pay for", and those are different questions. `highs` is in both and
 * means the same thing; `lows` is in the record and NOT here, because a low
 * is a night the panel had a note and nothing happened — a board paying or
 * charging for it would be pricing the edit.
 *
 * The weights that consume these, and the correlation and DENSITY measured
 * for each, live beside the config in js/rankings-update.js. A count of
 * anything a longer run accumulates is placement measured twice, and this
 * show has no column that is entirely free of that.
 */
export function dragBoardStats(doc, name) {
  const rows = seasonRounds(doc, DRAG_FORMAT);
  let maxiWins = 0; let lipsyncWins = 0; let highs = 0; let bottoms = 0;
  for (const e of rows) {
    const cell = (e.placements || []).find(p => p.name === name);
    if (!cell) continue;
    if (cell.result === 'WIN') maxiWins++;
    else if (cell.result === 'HIGH') highs++;
    // The bottom is the pair who lip synced. The one who goes home is marked
    // ELIM, not BTM, so counting the column alone undercounts every episode
    // by exactly one — and misses the single most consequential bottom there
    // is, the one that ended somebody's season.
    const ls = e.lipsync;
    const inBottom = cell.result === 'BTM'
      || (ls && (ls.queens || []).includes(name));
    if (inBottom) bottoms++;
    if (ls && (ls.winner === name
      || (ls.call === 'double-shantay' && (ls.queens || []).includes(name)))) lipsyncWins++;
  }
  return { maxiWins, lipsyncWins, highs, bottoms };
}
