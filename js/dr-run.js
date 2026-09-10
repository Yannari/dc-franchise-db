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
// ── AND THE QUEUE IS NOT THE LAST WORD ──
// Because the whole season is decided on the first press, a challenge pinned on
// the timeline AFTER episode one had already aired changed nothing at all: the
// dropdown went pink, the config was saved, and the week it named had been
// booked minutes earlier. Reported as "I picked the Ball and it ran the
// LaLaPaRUza" — and the timeline had no way to say so, because from its side
// the pin was stored correctly.
//
// `invalidateDragQueue` drops the unaired half of the season so the next press
// re-books it against the config as it now stands. That is only safe because of
// two things, and it is wrong without either:
//
//   * js/dr/rng.js `streamFor` — the schedule and every week draw from their
//     own dice, so a change to week five does not shift week two's numbers;
//   * `_frozenPins` below — the weeks already watched are handed back as pins,
//     so the re-book replays them exactly rather than inventing a second
//     version of an episode the viewer has already seen.
//
// IMPORTING THIS MODULE IS THE WIRING. It sets `window._drRunnable`, which
// `formatIsRunnable()` reads to decide whether the show can be started at all.
// Drop the import from js/main.js and the show silently un-ships with every
// test still green.
import { gs, players, relationships, seasonConfig, seasonFormat, twistsForFormat } from './core.js';
import { DRAG_FORMAT } from './shows.js';
import { getPerceivedBond, addBond } from './bonds.js';
import { playDragSeason } from './dr/season.js';
import { dragRelationsFrom } from './dr/family.js';
import { updateEditLayer } from './edit-layer.js';

export const isDragSeason = () => seasonFormat(seasonConfig) === 'drag-race';

function _seed() {
  if (!gs._drSeed) {
    gs._drSeed = (Number(seasonConfig.seasonNumber) || 0) * 1000
      + Math.floor(Math.random() * 1000) + 1;
  }
  return gs._drSeed;
}

/**
 * The twist catalogue's schedule, in this engine's own words.
 *
 * The designer books twists onto `seasonConfig.twistSchedule` as
 * `{ id, episode, type }` — the same array a tribe swap or a double eviction
 * lands in — and js/dr/season.js reads `drSchedule` entries carrying its own
 * flags. Translating here keeps both honest: the catalogue does not learn a
 * per-show shape, and the engine does not learn what a twist card is.
 *
 * `episodeField` on the catalogue entry names the flag and `episodeValue`
 * the value when it is not a boolean, so a new drag twist is a catalogue row
 * and no change to this function.
 */
function _twistsToSchedule() {
  const booked = (seasonConfig.twistSchedule || []).filter(Boolean);
  const mine = new Map(twistsForFormat({ format: DRAG_FORMAT }).map(t => [t.id, t]));
  const byEp = new Map();
  for (const b of booked) {
    const t = mine.get(b.type) || mine.get(b.id);
    if (!t?.episodeField) continue;
    const ep = Number(b.episode);
    if (!Number.isInteger(ep) || ep < 1) continue;
    const row = byEp.get(ep) || { episode: ep };
    /* TRUE FOR A FLAG, A NAME FOR A CHOICE. Most drag twists are booleans:
       the week either sends nobody home or it does. Two of them share one
       engine field and are told apart by its VALUE — `critiqueTwist` is
       'who-should-go' or 'rate-a-queen' — and writing `true` there would
       switch on a twist the engine has no branch for, which is a booking
       that silently does nothing. */
    row[t.episodeField] = t.episodeValue ?? true;
    /* AND ANYTHING THE BOOKING ITSELF CHOSE. Every drag twist until now was
       a boolean — it happens this week or it does not — and a returning
       queen has to say WHO. `dataFields` on the catalogue entry names the
       keys to carry across, so a fifth twist that needs an option is a
       catalogue row and no change here. */
    for (const k of t.dataFields || []) {
      if (b[k] !== undefined && b[k] !== '') row[k] = b[k];
    }
    byEp.set(ep, row);
  }
  // Anything pinned directly on drSchedule (a challenge, a guest) survives,
  // and a twist booked on the same episode merges into it.
  for (const pin of (seasonConfig.drSchedule || []).filter(Boolean)) {
    const ep = Number(pin.episode);
    if (!Number.isInteger(ep)) continue;
    byEp.set(ep, { ...pin, ...(byEp.get(ep) || {}), episode: ep });
  }
  return [...byEp.values()].sort((x, y) => x.episode - y.episode);
}

/**
 * The weeks already watched, in the engine's own schedule shape.
 *
 * `playDragSeason` returns the row it actually ran each night — challenge,
 * mini, judge, guest, song, runway category and every twist flag — and it is
 * kept on `gs._drSchedule`. Handed back as pins, those weeks come out of a
 * re-book byte-identical, so re-booking the FUTURE cannot rewrite the past.
 *
 * An older save has no `_drSchedule`, which is why the re-book is refused
 * rather than attempted below: a rebuild with nothing frozen would replay a
 * different season under a history that has already aired.
 */
function _frozenPins() {
  const aired = (gs.episodeHistory || []).length;
  if (!aired) return [];
  return (Array.isArray(gs._drSchedule) ? gs._drSchedule : [])
    .filter(r => r && Number(r.episode) <= aired);
}

/**
 * Whether this season recorded what each night was booked with.
 *
 * A season played before `_drSchedule` existed did not, so its aired weeks
 * cannot be frozen and nothing on it can be re-booked — the timeline says which
 * of the two an aired week is rather than greying it identically in both cases.
 */
export function dragScheduleRecorded() {
  if (!gs) return true;
  const aired = (gs.episodeHistory || []).length;
  return !aired || _frozenPins().length >= aired;
}

/** Can the unaired weeks be re-booked from the timeline as it now stands? */
export function dragQueueEditable() {
  return !!gs && Array.isArray(gs._drQueue) && dragScheduleRecorded();
}

/**
 * Throw away the unaired weeks so the next episode re-books them.
 *
 * Called from the timeline whenever a pin changes. Nothing is simulated here —
 * the season is rebuilt on the next press of Simulate Episode, which is also
 * the path a reload already takes.
 */
export function invalidateDragQueue() {
  if (!dragQueueEditable()) return false;
  delete gs._drQueue;
  return true;
}

/** How many drag episodes have already aired — the timeline locks those. */
export function dragEpisodesAired() {
  return (gs?.episodeHistory || []).length;
}

/**
 * Re-run one night: a different episode N, with everything before it untouched.
 *
 * ── WHAT THIS BUTTON USED TO DO ──
 * Nothing. `replayEpisode` restored the checkpoint — which carries `_drQueue`
 * with episode N still at its head — and shifted that same row straight back
 * off it, so a drag re-run RE-AIRED the night instead of re-running it. It was
 * defended in a comment on the grounds that "the season was decided in one call
 * and re-deciding it from episode 3 would rewrite the ending", and that was
 * true when it was written: one rng stream ran the whole season, so re-deciding
 * anything re-decided everything.
 *
 * It is not true any more. Every week draws from its own dice and the weeks
 * already watched are frozen, so a re-run reproduces episodes 1..N-1 exactly
 * and diverges from N — which is precisely what the button's own confirmation
 * has always promised ("Episodes N–M will be replaced with new results").
 *
 * It is also the answer to the obvious complaint about locking an aired week on
 * the timeline: an aired week is fixed for the FORWARD run, and this is how you
 * go back and change it. Pin the Ball onto episode three, press ↺ on episode
 * three, and episode three is a ball.
 *
 * Call it with the season already rolled back to before episode N — which is
 * what `replayEpisode` does before it asks for the night.
 */
export function rerunDragEpisode(epNum) {
  if (!gs) return false;
  /* A SEASON THAT CANNOT FREEZE ITS PAST MUST NOT RE-BOOK ITS FUTURE. Played
     before `_drSchedule` existed, a rebuild would replay a different season
     under a history that has already aired. Re-airing is the honest fallback
     and is exactly what this button did for every drag season until now. */
  if (!dragScheduleRecorded()) return false;
  const n = Math.max(1, Number(epNum) || 1);
  const prev = gs._drReroll && Number(gs._drReroll.from) === n
    ? Number(gs._drReroll.nonce) || 0 : 0;
  gs._drReroll = { from: n, nonce: prev + 1 };
  delete gs._drQueue;
  return true;
}

/** Whether a season-wide drag twist is booked at all. */
function _twistBooked(id) {
  return (seasonConfig.twistSchedule || []).some(b => b && (b.type === id || b.id === id));
}

function _config() {
  return {
    drPremiere: seasonConfig.drPremiere,
    drFinale: seasonConfig.drFinale,
    drDoubleShantay: seasonConfig.drDoubleShantay,
    drDoubleSashay: seasonConfig.drDoubleSashay,
    drImmunity: seasonConfig.drImmunity,
    drTripleLipsync: seasonConfig.drTripleLipsync,
    /* THE SMACKDOWN, WHICH WAS UNREACHABLE. js/dr/season.js has read
       `config.drSmackdown` since it was written and this function never
       passed it, so the whole Lalaparuza reunion -- engine, challenge module
       and all -- could not be switched on from a played season. There was no
       control for it either, so nothing pointed at the gap. */
    /* A MAIN STAGE OPTION, not a catalogue booking. It spent a while as a
       twist on the reasoning that a reunion happening on one episode is a
       twist; it is not, because no author chooses which episode — it always
       sits directly before the crowning. `_twistBooked('dr-smackdown')` is
       still read so a season saved while it WAS a twist still plays. */
    drSmackdown: !!seasonConfig.drSmackdown || _twistBooked('dr-smackdown'),
    /* THE AUTHOR'S BOOKING, WITH THE WEEKS ALREADY WATCHED NAILED DOWN OVER
       THE TOP OF IT. A frozen row is the complete week the engine ran, so it
       replaces the author's partial pin for that episode outright rather than
       merging into it — a pin the designer adds to episode two after episode
       two has aired must not change episode two. */
    drSchedule: (() => {
      const booked = _twistsToSchedule();
      const frozen = _frozenPins();
      if (!frozen.length) return booked;
      const byEp = new Map(booked.map(r => [Number(r.episode), r]));
      for (const r of frozen) byEp.set(Number(r.episode), { ...r });
      return [...byEp.values()].sort((x, y) => x.episode - y.episode);
    })(),
    drJudgeWeights: seasonConfig.drJudgeWeights || {},
    /* WHICH RE-RUN THIS IS. `{ from, nonce }`, bumped by `rerunDragEpisode` and
       kept on `gs` so a reload reproduces THIS version of the season rather
       than the one that first aired. Weeks before `from` ignore it entirely. */
    drReroll: gs?._drReroll || null,
  };
}

function _playWholeSeason() {
  const cast = (players || []).filter(p => p && p.name);
  if (cast.length < 4) return false;

  /* A REBUILD replays every episode from scratch, and the callbacks write into
     gs.bonds and gs.popularity as it goes. The bond(a,b) READER callback calls
     getPerceivedBond, which reads the LIVE gs.bonds/bondLean/perceivedBonds —
     so if those contain the checkpoint's accumulated state, ep 1 of the rebuild
     reads ep 3's bonds and produces a different elimination order.

     The fix: initGameState saves the COMPLETE initial bond state as
     gs._drInitBonds and gs._drInitLean (authored bonds, KIN_DEFAULT, tribe
     bonus, alliance boost, hero-villain rivalry, franchise meta, and life
     carryover). On a rebuild, restore that snapshot so the bond reader returns
     the same values it did during the original first play. After the rebuild,
     restore the checkpoint's live state. */
  const isRebuild = (gs.episodeHistory || []).length > 0;
  const savedBonds = isRebuild && gs.bonds
    ? JSON.parse(JSON.stringify(gs.bonds)) : null;
  const savedPop = isRebuild && gs.popularity
    ? JSON.parse(JSON.stringify(gs.popularity)) : null;
  const savedLean = isRebuild && gs.bondLean
    ? JSON.parse(JSON.stringify(gs.bondLean)) : null;
  const savedPerceived = isRebuild && gs.perceivedBonds
    ? JSON.parse(JSON.stringify(gs.perceivedBonds)) : null;

  if (isRebuild && gs._drInitBonds) {
    gs.bonds = JSON.parse(JSON.stringify(gs._drInitBonds));
    gs.bondLean = JSON.parse(JSON.stringify(gs._drInitLean || {}));
    gs.perceivedBonds = {};
    gs.popularity = {};
  }

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
    /* THE AUTHORED HOUSES. The Relationships tab has always had two axes --
       how they feel, and how they know each other -- and the feeling half
       reached a drag season through initGameState's bond seeding from the
       first day. The knowing half did not: a user could write "Ivy is Coco's
       drag mother" and the room met two strangers. */
    relations: dragRelationsFrom(relationships),
    bond,
    // Real bonds, so helping somebody sew is remembered next week and by every
    // other system that reads the relationship layer.
    addBond: (a, b, d) => { try { addBond(a, b, d); } catch { /* no relationship layer yet */ } },
    // The live ledger, written alongside the season's own copy so a played
    // season and a headless one carry the same numbers.
    popDelta: (n, d) => {
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[n] = (gs.popularity[n] || 0) + d;
    },
  });

  if (isRebuild) {
    if (savedBonds) gs.bonds = savedBonds;
    if (savedPop) gs.popularity = savedPop;
    if (savedLean) gs.bondLean = savedLean;
    if (savedPerceived) gs.perceivedBonds = savedPerceived;
  }

  gs._drQueue = out.rows;
  // What every night was actually booked with, so a later re-book can freeze
  // the weeks that have already gone out. See `_frozenPins`.
  gs._drSchedule = out.schedule || [];
  // A mirror for the screens, not a second source of truth: every episode
  // screen reads its own row. `star` is here because the aftermath reads it
  // once at the end, never during.
  gs.dr = {
    star: out.state.star, castOrder: out.state.castOrder,
    /* THE EPISODES ALREADY AIRED STAY ON THE MIRROR. This was `[]`, which was
       right on a fresh season and wrong on every rebuild: a reload — and now a
       re-book — emptied the mirror while `gs.episodeHistory` still held the
       nights, so anything reading `gs.dr.episodes` saw a season that started at
       whichever episode was played next. */
    episodes: (gs.episodeHistory || []).filter(r => r && r.dr),
    // The sash. `stats-export.js` reads `gs.dr.congeniality` when it builds
    // the season document, and until this line was here it read undefined on
    // every played season — the award was computed, stored on the finale row,
    // drawn on the crowning screen, and then dropped on the way to the file.
    congeniality: out.congeniality || null,
  };
  gs._drResult = { winner: out.winner, runnerUp: out.runnerUp };
  return true;
}

/** One episode onto the history. Returns the row, or null when the season is over. */
export function simulateDragEpisode() {
  if (!gs) return null;

  if (!Array.isArray(gs._drQueue)) {
    /* No queue: a reload, an older save, or a pin changed on the timeline and
       `invalidateDragQueue` threw the unaired weeks away. All three rebuild the
       season from the seed and drop the episodes that already aired, rather
       than replaying from episode one on top of them — and the aired weeks come
       back identical because `_config` freezes them (see `_frozenPins`). */
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
  // Set BEFORE the edit layer runs: it bills screen time against the active
  // roster, and a queen who is not on it is billed nothing.
  gs.activePlayers = [...(row.dr?.living || [])];
  gs.episode = row.num;
  gs.eliminated = [...(gs.eliminated || []), ...row.exits.map(x => x.name)];

  /* THE AUDIENCE PULSE, which this show was not calling at all. The edit layer
     is where the franchise decides who a season made a star of, and both other
     shows have fed it since their run loops were written. A drag season fed it
     nothing — so every queen read "Invisible" and the pulse drew a season of
     blank bars. The reader existed; the caller did not.
     Wrapped because the edit is commentary on the run and must never be able
     to take the run down with it. */
  try { updateEditLayer(row); } catch { /* commentary, never the season */ }

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
