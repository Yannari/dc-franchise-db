// ══════════════════════════════════════════════════════════════════════
// tr-run.js — the castle, connected to the Run tab
// ══════════════════════════════════════════════════════════════════════
//
// js/bb-run.js is the precedent and the shape is the same: the engine stays
// headless and knows nothing about the DOM, and one module at the UI boundary
// decides when it runs, takes the checkpoint, and hands the run tab an episode.
//
// ── WHY THIS IS NOT simulateBBEpisode WITH DIFFERENT WORDS ────────────
//
// A Big Brother week and a Total Drama episode are both FUNCTIONS OF THE
// STATE: you can call them, get one episode, and call them again next week.
// `playTraitorsSeason` is not. It opens with `setGs`, plays every night in one
// loop, and only at the very end — after the last row is written — attaches
// the endgame to it (js/tr/headless.js says so, and Plan 8 Task 5 flagged it
// for this task). There is no "play one castle night" entry point, and adding
// one would mean the endgame had to be re-attachable, which is exactly the
// thing that makes a season come back with no ending.
//
// So the season is played WHOLE, once, and its rows are queued. "Play episode
// N" then moves one row from the queue onto `gs.episodeHistory` — the same
// array the run tab, the visual player and the transcript already read. The
// viewer gets episodes one at a time; the engine gets the only call it can
// safely be given.
//
// THE QUEUE LIVES ON `gs` DELIBERATELY. A module-level array would not survive
// a page reload, and a season half-aired would then replay itself from a fresh
// seed the next time the button was pressed. Rows are MOVED rather than
// copied, so the queue plus the history is one season's worth of rows and
// never two — this repo has shipped an 19MB `gs` from exactly that mistake.
import { gs, setGs, players, seasonConfig, seasonFormat } from './core.js';
import { playTraitorsSeason } from './tr/headless.js';

/** Is the season on the setup screen a castle? */
export const isTraitorsSeason = () => seasonFormat(seasonConfig) === 'traitors';

/**
 * The seed this season plays on.
 *
 * Stored on `gs` at the first play, so a re-run of episode 3 from a checkpoint
 * plays the SAME season again rather than a different one — a replay button
 * that silently reseeds is a replay button that deletes the season.
 */
function _seed() {
  if (!gs._trSeed) {
    gs._trSeed = (Number(seasonConfig.seasonNumber) || 0) * 1000
      + Math.floor(Math.random() * 1000) + 1;
  }
  return gs._trSeed;
}

/**
 * Play the whole season into a queue.
 *
 * `playTraitorsSeason` replaces `gs` wholesale — it is a headless harness and
 * says so — so the season the setup screen built is held aside and put back
 * afterwards, with the castle's own state and the rows it wrote carried over.
 * Everything the UI owns (the cast, the config, the popularity ledger, the
 * checkpoints) survives; everything the engine owns arrives.
 */
function _playWholeSeason() {
  const outer = gs;
  const cast = (players || []).map(p => p.name).filter(Boolean);
  if (cast.length < 4) return false;

  const result = playTraitorsSeason({
    cast,
    traitorCount: Math.max(2, Math.min(5, Number(seasonConfig.traitorCount) || 3)),
    potCeiling: Number(seasonConfig.trPotCeiling) || undefined,
    endgameSize: Number(seasonConfig.finaleSize) || 3,
    seed: _seed(),
  });
  // `gs` is now the engine's. Take what it wrote and give the UI's back.
  const inner = gs;
  const rows = inner.episodeHistory || [];
  const trState = inner.tr;
  const survivors = [...(inner.activePlayers || [])];

  // Back through the setter, never by assigning to the import: `gs` is a live
  // binding and every module in this project reads it through one.
  setGs(outer);
  gs.tr = trState;
  gs._trQueue = rows;
  gs._trSurvivors = survivors;
  gs._trWinner = result.winner || null;
  gs._trPot = result.pot ?? 0;
  return true;
}

/**
 * Air the next episode of the castle season, or `null` when it is over.
 *
 * Returns the episode record, exactly as `simulateBBEpisode` and
 * `simulateEpisode` do, so `simulateNext` can treat all three the same way.
 */
export function simulateTraitorsEpisode() {
  if (!gs) return null;
  if (!Array.isArray(gs._trQueue)) {
    if (!_playWholeSeason()) return null;
  }
  const row = (gs._trQueue || []).shift();
  if (!row) {
    gs.phase = 'complete';
    return null;
  }
  (gs.episodeHistory ||= []).push(row);
  // The room as it stood at the END of this episode, which is what the row
  // recorded. Everything on the run tab that counts people — the hub, the
  // state panel, the "season complete" test — reads this.
  gs.activePlayers = [...(row.tr?.living || [])];
  gs.episode = row.num;
  if (!gs._trQueue.length) {
    gs.phase = 'complete';
    // The winner is the endgame's, and the endgame is on the last row. Read
    // off the row rather than off the season result, so a loaded season that
    // never held the result object still knows who took the money.
    const eg = row.tr?.endgame;
    if (eg) gs.trWinner = eg.winner || null;
  } else {
    gs.phase = 'castle';
  }
  return row;
}

/** How many nights of this season have not aired yet. */
export function traitorsEpisodesLeft() {
  return Array.isArray(gs?._trQueue) ? gs._trQueue.length : null;
}

// The run loop can reach the castle now, which is the whole of what this flag
// says. `formatIsRunnable` in js/core.js reads it, the setup screen's warning
// reads that, and Quick Setup's "not wired" badge reads it too — so the three
// places that tell a user whether a show can be started all agree, and all of
// them are downstream of this one line.
if (typeof window !== 'undefined') window._trRunnable = true;
