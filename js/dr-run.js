// ══════════════════════════════════════════════════════════════════════
// dr-run.js — the run loop's main-stage branch, and the runnable flag
// ══════════════════════════════════════════════════════════════════════
//
// Same shape as js/tr-run.js. The engine plays the WHOLE season in one call
// (js/dr/season.js) and the rows are queued on `gs._drQueue`; each press of
// "Simulate Episode N" shifts one onto `gs.episodeHistory`.
//
// The season is played in one go rather than a night at a time because the
// finale's shape depends on the whole run, and because a re-aired episode must
// be the episode that aired. The seed lives on `gs._drSeed`, so a queue lost to
// a reload rebuilds the SAME season and drops the rows that already went out —
// without that, replaying from a checkpoint regenerates a different season and
// stacks it onto the history, which is the "episodes that never happened"
// corruption the castle hit.
//
// IMPORTING THIS MODULE IS THE WIRING. It sets `window._drRunnable`, which
// `formatIsRunnable()` reads to decide whether the show can be started at all.
// Drop the import from js/main.js and the show silently un-ships with every
// test still green.
import { gs, players, seasonConfig, seasonFormat } from './core.js';
import { getPerceivedBond } from './bonds.js';
import { playDragSeason } from './dr/season.js';

export const isDragSeason = () => seasonFormat(seasonConfig) === 'drag-race';

function _seed() {
  if (!gs._drSeed) {
    gs._drSeed = (Number(seasonConfig.seasonNumber) || 0) * 1000
      + Math.floor(Math.random() * 1000) + 1;
  }
  return gs._drSeed;
}

function _config() {
  return {
    drPremiere: seasonConfig.drPremiere,
    drFinale: seasonConfig.drFinale,
    drDoubleShantay: seasonConfig.drDoubleShantay,
    drDoubleSashay: seasonConfig.drDoubleSashay,
    drImmunity: seasonConfig.drImmunity,
    drTripleLipsync: seasonConfig.drTripleLipsync,
    drSchedule: (seasonConfig.drSchedule || []).filter(Boolean),
    drJudgeWeights: seasonConfig.drJudgeWeights || {},
  };
}

function _playWholeSeason() {
  const cast = (players || []).filter(p => p && p.name);
  if (cast.length < 4) return false;

  // Perceived bonds, not real ones: what a queen believes about the room is
  // what shapes how she works with it. Wrapped because a season can be started
  // before the relationship layer has anything in it.
  const bond = (a, b) => {
    try { return getPerceivedBond(a, b) || 0; } catch { return 0; }
  };

  const out = playDragSeason({
    cast,
    seed: _seed(),
    config: _config(),
    bond,
    // The live ledger, written alongside the season's own copy so a played
    // season and a headless one carry the same numbers.
    popDelta: (n, d) => {
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[n] = (gs.popularity[n] || 0) + d;
    },
  });

  gs._drQueue = out.rows;
  // A mirror for the screens, not a second source of truth: every episode
  // screen reads its own row. `star` is here because the aftermath reads it
  // once at the end, never during.
  gs.dr = { star: out.state.star, castOrder: out.state.castOrder, episodes: [] };
  gs._drResult = { winner: out.winner, runnerUp: out.runnerUp };
  return true;
}

/** One episode onto the history. Returns the row, or null when the season is over. */
export function simulateDragEpisode() {
  if (!gs) return null;

  if (!Array.isArray(gs._drQueue)) {
    // The queue was lost — a reload, or an older save. Rebuild the SAME season
    // from the seed and drop the episodes that already aired, rather than
    // replaying from episode one on top of them.
    const aired = (gs.episodeHistory || []).length;
    if (!_playWholeSeason()) return null;
    if (aired > 0 && Array.isArray(gs._drQueue)) gs._drQueue = gs._drQueue.slice(aired);
  }

  const row = (gs._drQueue || []).shift();
  if (!row) {
    gs.phase = 'complete';
    return null;
  }

  (gs.episodeHistory ||= []).push(row);
  if (gs.dr) (gs.dr.episodes ||= []).push(row);
  gs.activePlayers = [...(row.dr?.living || [])];
  gs.episode = row.num;
  gs.eliminated = [...(gs.eliminated || []), ...row.exits.map(x => x.name)];

  if (row.dr?.finale) {
    gs.phase = 'complete';
    gs.drWinner = row.dr.finale.winner || null;
    gs.drRunnerUp = row.dr.finale.runnerUp || null;
  } else {
    gs.phase = gs._drQueue.length ? 'stage' : 'complete';
  }
  return row;
}

export function dragEpisodesLeft() {
  return Array.isArray(gs?._drQueue) ? gs._drQueue.length : 0;
}

if (typeof window !== 'undefined') window._drRunnable = true;
