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
import { gs, setGs, players, seasonConfig, seasonFormat, TWIST_CATALOG } from './core.js';
import { playTraitorsSeason } from './tr/headless.js';
import { bespokeMissionsEnabled, _setBespokeMissionsEnabled } from './tr/missions/index.js';

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
 * The author's murder calendar, read off the episode-format designer.
 *
 * `seasonConfig.twistSchedule` is the shared per-episode twist store (the same
 * one Total Drama and Big Brother write to); a `category:'murder'` entry names
 * a castle night's shape. This turns those entries into the compact
 * `{ episode: variantId }` map `playTraitorsSeason` hands the engine. Only one
 * shape can fire per night — the catalogue marks the six mutually incompatible,
 * so the designer never lets two land on one episode — but if one somehow did,
 * the last entry wins, matching pickVariant reading a single value per round.
 * Returns null when nothing is scheduled, so a plain season stays bit-identical.
 */
function _murderSchedule() {
  const out = {};
  for (const t of (seasonConfig.twistSchedule || [])) {
    if (!t || t.episode == null) continue;
    const entry = TWIST_CATALOG.find(c => c.id === t.type);
    if (entry && entry.category === 'murder' && entry.variant) {
      out[Number(t.episode)] = entry.variant;
    }
  }
  return Object.keys(out).length ? out : null;
}

/**
 * The author's mission calendar, read off the timeline's per-episode dropdown.
 *
 * `seasonConfig.trMissionSchedule` is a list of `{ episode, missionId }`; this
 * turns it into the compact `{ episode: missionId }` map the engine reads
 * (runMission forces that afternoon's mission when it is eligible). Returns
 * null when nothing is pinned, so an unscheduled season stays as it was.
 */
function _missionScheduleMap() {
  const out = {};
  for (const t of (seasonConfig.trMissionSchedule || [])) {
    if (t && t.episode != null && t.missionId) out[Number(t.episode)] = t.missionId;
  }
  return Object.keys(out).length ? out : null;
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
function _playWholeSeason(rerollFromEp = null, rerollSeed = null) {
  const outer = gs;
  const cast = (players || []).map(p => p.name).filter(Boolean);
  if (cast.length < 4) return false;

  // ── STAGE 2 FLIPS THE FLAG HERE, and only here ──────────────────────
  // The bespoke catalogue (js/tr/missions/) ships gated off — a mission whose
  // VP builder did not yet exist may not reach a played season. Stage 2 built
  // the four builders, so a season played from the SHOW turns them on. It is
  // done at the one real UI entry point rather than as the module default so
  // the module still reads `let _bespokeEnabled = false` (the mockup-approval
  // gate the contract test still checks), and restored afterwards so nothing
  // else in the process inherits it.
  const _bespokeWas = bespokeMissionsEnabled();
  _setBespokeMissionsEnabled(true);
  let result;
  try {
    result = playTraitorsSeason({
      cast,
      traitorCount: Math.max(2, Math.min(5, Number(seasonConfig.traitorCount) || 3)),
      potCeiling: Number(seasonConfig.trPotCeiling) || undefined,
      endgameSize: Number(seasonConfig.finaleSize) || 3,
      murderSchedule: _murderSchedule(),
      missionSchedule: _missionScheduleMap(),
      // Auto double murders are on unless the Castle Options toggle turns them
      // off; a pinned Double still runs either way.
      autoDouble: seasonConfig.trAutoDouble !== false,
      // Only an explicitly-chosen pact is handed down; 'random' mode (or a cast
      // that has changed since) leaves this null and the engine draws its own.
      chosenTraitors: seasonConfig.trTraitorMode === 'choose'
        ? (seasonConfig.trChosenTraitors || []).filter(n => cast.includes(n))
        : null,
      seed: _seed(),
      // A re-run replays off the SAME base seed (so every earlier episode
      // reproduces exactly) and swaps to `rerollSeed` at `rerollFromEp`.
      rerollFromEp: rerollFromEp || null,
      rerollSeed: rerollSeed == null ? null : rerollSeed,
    });
  } finally {
    _setBespokeMissionsEnabled(_bespokeWas);
  }
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

/**
 * Re-run episode `epNum` for real — a genuinely different night, with every
 * earlier episode kept exactly as it aired.
 *
 * A castle is one deterministic block off its base seed, so this replays that
 * block but swaps the rng to a fresh seed at `epNum` (see playTraitorsSeason's
 * `rerollFromEp`): episodes before it draw the same numbers and reproduce byte
 * for byte, this night and every one after diverge. It re-derives entirely from
 * the base seed on `gs` — no in-memory checkpoint — so it still works after a
 * reload. Leaves the queue holding the re-rolled episode `epNum` onward; the
 * caller airs it exactly like a normal night.
 */
export function rerunTraitorsEpisode(epNum) {
  if (!gs || !gs._trSeed) return false;
  const N = Math.max(1, Number(epNum) || 1);
  // A fresh divergence each time the button is pressed — a re-run that came
  // back identical would not be a re-run. Kept on `gs` so a reload still varies.
  gs._trRerollNonce = (gs._trRerollNonce || 0) + 1;
  const rerollSeed = ((gs._trSeed >>> 0)
    ^ Math.imul(gs._trRerollNonce, 0x9e3779b1)
    ^ Math.imul(N, 2654435761)) >>> 0;
  if (!_playWholeSeason(N, rerollSeed || 1)) return false;
  // `_playWholeSeason` put the WHOLE re-rolled season on the queue. Keep the
  // aired prefix (episodes 1..N-1, identical by construction) in history and
  // leave episode N onward to air.
  const all = gs._trQueue || [];
  gs.episodeHistory = all.slice(0, N - 1);
  gs._trQueue = all.slice(N - 1);
  const lastAired = gs.episodeHistory[gs.episodeHistory.length - 1];
  gs.activePlayers = lastAired
    ? [...(lastAired.tr?.living || [])]
    : (players || []).map(p => p.name).filter(Boolean);
  gs.episode = gs.episodeHistory.length;
  gs.phase = gs._trQueue.length ? 'castle' : 'complete';
  gs.trWinner = null;
  return true;
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
