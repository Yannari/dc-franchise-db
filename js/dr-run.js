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
import { gs, gsCheckpoints, players, relationships, seasonConfig, seasonFormat, twistsForFormat } from './core.js';
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
 * The season as it was booked, in the engine's own schedule shape.
 *
 * `playDragSeason` returns the row it actually ran each night — challenge,
 * mini, judge, guest, song, runway category and every twist flag — for EVERY
 * episode, and the whole thing is kept on `gs._drSchedule`. Handed back as
 * pins, those weeks come out of a re-book byte-identical.
 *
 * ── WHY THE WHOLE SEASON AND NOT JUST THE AIRED PART ──
 *
 * This used to filter to `episode <= aired`, freezing what had been watched
 * and letting the rest be drawn again. That is right for a re-book and wrong
 * for a RELOAD, and a reload is the same code path — so continuing a saved
 * season re-drew every unaired week.
 *
 * And re-drawing them does not reproduce them. The draw avoids repeating a
 * challenge, so nailing the first three weeks down changes what the rest can
 * pick: measured on a fixed seed, a season that ran Snatch Game on four and
 * the Rusical on five came back with the two swapped. A different week four
 * is a different maxi, a different winner and a different queen going home —
 * which is what "the last eliminated was not eliminated" looks like from the
 * outside.
 *
 * So the stored booking is authoritative for the whole season, and the two
 * callers that genuinely want the future re-drawn — a pin changed on the
 * timeline, and a re-run of episode N — say so by TRUNCATING it. See
 * `_truncateSchedule`.
 *
 * An older save has no `_drSchedule`, which is why the re-book is refused
 * rather than attempted below: a rebuild with nothing frozen would replay a
 * different season under a history that has already aired.
 */
function _frozenPins() {
  return (Array.isArray(gs._drSchedule) ? gs._drSchedule : []).filter(Boolean);
}

/**
 * Let the weeks after `keep` be booked again.
 *
 * The stored schedule is what makes a reload reproduce the season, so the only
 * way to get a DIFFERENT future is to forget the part of it you want redrawn.
 * Both callers are deliberate acts by the author: changing a pin, or pressing
 * the re-run button on episode N.
 */
function _truncateSchedule(keep) {
  if (!Array.isArray(gs?._drSchedule)) return;
  const n = Math.max(0, Number(keep) || 0);
  gs._drSchedule = gs._drSchedule.filter(r => r && Number(r.episode) <= n);
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
  if (!aired) return true;
  // Every aired week, specifically — `_frozenPins` now carries the unaired
  // ones too, so a plain length check would pass a season that recorded the
  // future and not the past.
  const have = new Set(_frozenPins().map(r => Number(r.episode)));
  for (let i = 1; i <= aired; i++) if (!have.has(i)) return false;
  return true;
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
  // Same repair, same reason: a pin made on an old season did nothing at all,
  // because `dragQueueEditable` asks whether the past can be frozen.
  repairOldDragSeason();
  if (!dragQueueEditable()) return false;
  delete gs._drQueue;
  /* AND FORGET THE BOOKING FOR THE WEEKS NOBODY HAS SEEN. The stored schedule
     outranks an author's pin — that is what keeps an aired week fixed — so
     leaving the future in it would make this button do nothing at all. */
  _truncateSchedule((gs.episodeHistory || []).length);
  return true;
}

/**
 * What makes a night that night, for comparing a replay against what aired.
 *
 * The challenge and the room, because those are what a viewer would notice
 * changing and what everything downstream is derived from. Not the prose: two
 * runs of the same week can word a scene differently without the season having
 * moved, and a fingerprint that strict would refuse seasons that are fine.
 */
function _rowFingerprint(row) {
  const d = row && row.dr;
  if (!d) return '';
  return `${row.num}|${(d.challenge && d.challenge.id) || ''}|`
    + `${[...(d.living || [])].sort().join(',')}`;
}

/** The same, for the episodes already on the record. */
function _airedFingerprint() {
  return (gs.episodeHistory || []).map(_rowFingerprint);
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
  // A season from before the freeze can usually be given one — see
  // repairOldDragSeason. Tried here rather than at load so it costs nothing
  // until somebody actually presses the button it unblocks.
  repairOldDragSeason();
  /* A SEASON THAT CANNOT FREEZE ITS PAST MUST NOT RE-BOOK ITS FUTURE. Played
     before `_drSchedule` existed, a rebuild would replay a different season
     under a history that has already aired. Refusing is the honest answer.
     Still reached when the repair cannot help: a season with no checkpoint 1,
     or an episode with no challenge recorded on it. */
  if (!dragScheduleRecorded() || !gs._drSeed) return false;
  const n = Math.max(1, Number(epNum) || 1);
  const prev = gs._drReroll && Number(gs._drReroll.from) === n
    ? Number(gs._drReroll.nonce) || 0 : 0;
  gs._drReroll = { from: n, nonce: prev + 1 };
  /* AND THE SEASON GOES BACK TO THE NIGHT BEFORE, HERE. It used to be the
     caller's checkpoint that did this, which is why the button existed only
     for episodes run in the same session. Done from the aired rows instead,
     so a reload — or a browser that could not save a checkpoint at all —
     takes nothing away. */
  _rollbackDragTo(n);
  return true;
}

/**
 * Make a season played before the freeze existed freezable, in place.
 *
 * THE SEASON THIS IS FOR is one started between 09-06 and 09-10: it has
 * checkpoints, because the drag path has saved one before every episode since
 * `1bad7648`, and it has neither `_drSchedule` (`1c1ad969`, on main 09-09
 * 13:34) nor `_drInitBonds` (`d5a39456`, on main 09-10 08:51). Without the
 * first, `rerunDragEpisode` refuses and ↺ re-airs the identical night and a
 * pinned challenge is furniture. Without the second, a rebuild replays the
 * whole season on top of bonds those same calls already wrote.
 *
 * Restarting the season is the alternative, and it is not an acceptable one.
 *
 * NEITHER VALUE IS INVENTED, and that is what makes this safe to run
 * unattended:
 *   - The initial bonds come from checkpoint 1. `_saveEpisodeCheckpoint()`
 *     runs BEFORE `simulateDragEpisode()`, so `cp_1` is the game state as it
 *     stood before episode one — which is exactly what initGameState now
 *     snapshots. It is the real thing, not a recomputation of the seeding.
 *   - The schedule comes from the episodes themselves. Every aired row records
 *     the challenge it ran and the twists it carried.
 *
 * Returns what it repaired, so a caller can say so rather than healing in
 * silence.
 */
/**
 * Fill the placeholders left in episodes that already aired.
 *
 * A scene's words are written once, when the episode is simulated, and stored
 * on the row. So the four sites that handed a `note` through without
 * substituting it -- and the mini lines drawn with a {b} and nobody to be it
 * -- are baked into every season played before that was fixed, and re-reading
 * the episode re-reads the hole: "while Autumnatic and {c} agree about her in
 * the third person".
 *
 * NOTHING IS RE-DRAWN AND NO POOL IS CONSULTED. The stored scene still knows
 * who was in it, and {a}..{d} are its players in order -- that is the whole
 * mapping, and it is the same one the renderer used. So the repair is a
 * substitution on text already chosen: the episode keeps the sentence it
 * aired, it just gets the names it was meant to have.
 *
 * A token with nobody to fill it is left alone rather than blanked. A visible
 * {c} is a bug somebody can see and report; an empty gap reads as a typo and
 * hides, which is the harder half of this to find and not something to
 * manufacture on purpose.
 */
export function repairDragPlaceholders(history) {
  const rows = Array.isArray(history) ? history
    : (gs && Array.isArray(gs.episodeHistory) ? gs.episodeHistory : []);
  let fixed = 0;
  for (const row of rows) {
    for (const sc of (row && row.dr && row.dr.scenes) || []) {
      const who = (sc.data && sc.data.players) || sc.players || [];
      if (!who.length) continue;
      const fill = v => {
        if (typeof v !== 'string' || v.indexOf('{') === -1) return v;
        return v.replace(/\{([abcd])\}/g, (m, k) => {
          const n = who['abcd'.indexOf(k)];
          return n || m;            // no queen for it: leave the token visible
        });
      };
      const was = [sc.text, sc.note, sc.data && sc.data.note];
      sc.text = fill(sc.text);
      if (sc.note) sc.note = fill(sc.note);
      if (sc.data && sc.data.note) sc.data.note = fill(sc.data.note);
      if (was[0] !== sc.text || was[1] !== sc.note
        || was[2] !== (sc.data && sc.data.note)) fixed++;
    }
  }
  return fixed;
}

export function repairOldDragSeason() {
  const done = { bonds: false, schedule: false };
  if (!gs || !isDragSeason()) return done;
  /* Cheap, idempotent, and it fixes what a viewer can see. Saved only on the
     pass that actually changes something -- this runs on every render of the
     episode list, and a write per repaint would be a real cost for a repair
     that is finished after the first one. */
  try {
    if (repairDragPlaceholders() > 0) window.saveGameState?.();
  } catch { /* words, never the season */ }
  const history = Array.isArray(gs.episodeHistory) ? gs.episodeHistory : [];
  if (!history.length) return done;

  // ── the bond state the season actually started from ──
  if (!gs._drInitBonds) {
    const cp1 = gsCheckpoints && gsCheckpoints[1];
    if (cp1 && cp1.bonds) {
      gs._drInitBonds = JSON.parse(JSON.stringify(cp1.bonds));
      gs._drInitLean = JSON.parse(JSON.stringify(cp1.bondLean || {}));
      done.bonds = true;
    }
  }

  // ── what each aired night was booked with ──
  //
  // Only the fields an episode RECORDS are pinned. The rest are redrawn from
  // the season's own per-episode streams off `gs._drSeed`, which is stored and
  // unchanged — that is the same mechanism the freeze relies on for a season
  // that recorded its schedule properly.
  /* ── AND IT IS ALL OR NOTHING ─────────────────────────────────────
     A schedule without the initial bonds is the worse of the two halves. It
     satisfies `dragScheduleRecorded()`, so the re-run goes ahead — and then
     replays the whole season on top of bonds those same calls already wrote,
     which is §11.5 O exactly. Better to leave the season refusing, which is
     honest and costs only the button, than to unlock a rebuild that drifts.
     A season that already had `_drInitBonds` and only wants a schedule is not
     caught by this: it passes because the field is there. */
  if (!gs._drInitBonds) return done;

  if (!dragScheduleRecorded()) {
    const rebuilt = [];
    for (const row of history) {
      const d = row && row.dr;
      const maxiId = d && d.challenge && d.challenge.id;
      // A row with no challenge on it cannot be pinned, and a partial schedule
      // is worse than none: `dragScheduleRecorded` would still say no and the
      // half-written array would be a second thing to explain later.
      if (!maxiId) return done;
      rebuilt.push({
        episode: Number(row.num),
        maxiId,
        ...(d.critiqueTwist ? { critiqueTwist: d.critiqueTwist } : {}),
        ...(d.rateAQueen ? { rateAQueen: true } : {}),
        ...(d.legacy ? { legacy: true } : {}),
        /* THE RETURN, AND THE QUEEN IT ACTUALLY SENT BACK. A schedule records
           that a week brought somebody back and who the AUTHOR asked for, not
           who walked back on — see §11.5 O. Pinning her by name here is the
           stronger promise, and the right one: this week has already aired,
           so the only correct answer is the one the viewer saw. */
        ...(d.returned && d.returned.name
          ? { returnee: true, returneeName: d.returned.name } : {}),
      });
    }
    gs._drSchedule = rebuilt;
    done.schedule = true;
  }
  return done;
}

/**
 * Roll the season back to just before episode N, without a checkpoint.
 *
 * THE CASTLE HAS NEVER NEEDED ONE and this show should not either. A drag
 * re-run restored `gsCheckpoints[N]`, so it worked only for episodes
 * simulated in the current browser session and only while those 1.8MB clones
 * kept being written. When an origin ran out of storage the writes failed
 * silently, and one session later the re-run button was simply not there —
 * measured on a real season: zero checkpoints, one aired episode, no warning
 * anywhere.
 *
 * Everything a rollback needs is already on the rows that aired. The aired
 * PREFIX is kept literally — the rows as they went out, not the replay's
 * copy of them — which is what makes "a re-run of the future never touches
 * the past" true by construction rather than by determinism. The same move
 * `rerunTraitorsEpisode` makes, for the same reason.
 */
function _rollbackDragTo(epNum) {
  const N = Math.max(1, Number(epNum) || 1);
  const history = Array.isArray(gs.episodeHistory) ? gs.episodeHistory : [];
  const kept = history.slice(0, N - 1);
  gs.episodeHistory = kept;

  // The room as the kept prefix left it. Episode N-1's own `living` is the
  // answer; before episode one it is everybody.
  const last = kept[kept.length - 1];
  gs.activePlayers = last && last.dr && Array.isArray(last.dr.living)
    ? [...last.dr.living]
    : (players || []).map(p => p && p.name).filter(Boolean);

  /* WHO IS OUT, REBUILT FROM THE KEPT ROWS rather than trimmed from the live
     list. A returnee is on `exits` for the night she left and back in
     `living` afterwards, so subtracting exits alone would leave her out of a
     season she is still competing in. Deriving it from the roster instead
     gets that right for free. */
  const still = new Set(gs.activePlayers);
  gs.eliminated = (players || [])
    .map(p => p && p.name).filter(n => n && !still.has(n));

  gs.episode = kept.length;
  gs.phase = 'stage';
  delete gs.drWinner;
  delete gs.drRunnerUp;
  delete gs._drQueue;
  /* THE POINT OF THE BUTTON. The stored booking reproduces the season, so
     without this the re-run would faithfully reproduce the night it was
     pressed to change — which is what it did before the schedule was stored
     at all, and the bug that button exists to fix. */
  _truncateSchedule(kept.length);
}

/**
 * Can this season re-run episode N at all?
 *
 * Not "is there a checkpoint" — is the past REPRODUCIBLE. That needs the seed
 * the season was booked from and a schedule that says what each aired night
 * was booked with. A season with both can be re-run after any reload, on any
 * episode, forever; one without either cannot be re-run faithfully at all and
 * says so rather than offering a button that would rewrite what aired.
 */
export function dragCanRerun() {
  if (!gs || !isDragSeason() || !gs._drSeed) return false;
  repairOldDragSeason();
  return dragScheduleRecorded();
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
  const savedEpisode = isRebuild ? gs.episode : null;

  if (isRebuild && gs._drInitBonds) {
    gs.bonds = JSON.parse(JSON.stringify(gs._drInitBonds));
    gs.bondLean = JSON.parse(JSON.stringify(gs._drInitLean || {}));
    gs.perceivedBonds = {};
    gs.popularity = {};
    /* AND THE WEEK NUMBER, which is bond state too. js/bonds.js reads
       `gs.episode` in four places -- the drift term is `Math.max(bb weeks,
       gs.episode)`, and a perceived bond is stamped `createdEp: gs.episode + 1`
       -- so a rebuild pressed on episode ten computed every bond as though ten
       weeks had already worn on it. The first play ran the whole season with
       `gs.episode` at 0, because nothing inside playDragSeason advances it;
       only airing a row does. Zero here is what the first play saw. */
    gs.episode = 0;
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
    // The live week comes back with the rest of the checkpoint's state.
    if (savedEpisode != null) gs.episode = savedEpisode;
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
    /* ── AND THE PAST IS CHECKED, NOT ASSUMED ──
       "The aired weeks come back identical" is a claim the sentence above has
       made since it was written, and it has been wrong three times: once when
       the schedule was only half frozen, once when a re-run's nonce was not
       carried, and once when the bond snapshot was empty. Every time, the
       rebuild replayed a DIFFERENT season, the queue was sliced by the number
       of episodes that had aired, and the next press handed the viewer a night
       from a season where somebody else went home. The queen eliminated in
       episode four walked back into episode five.
       Nothing checked. The failure is silent by construction: the rebuilt past
       is thrown away by the slice, so the only evidence is the future
       contradicting a history nobody re-reads.
       So it is compared now. If the replay does not reproduce what aired, the
       rebuild is refused outright and the save is left exactly as it was —
       `gs.episodeHistory` is never touched by any of this, so a refusal costs
       the viewer nothing but the press. A season that cannot be continued
       faithfully says so, which is the one thing it has never done. */
    const before = _airedFingerprint();
    if (!_playWholeSeason()) return null;
    if (aired > 0 && Array.isArray(gs._drQueue)) {
      const replayed = gs._drQueue.slice(0, aired).map(_rowFingerprint);
      const drift = before.findIndex((f, i) => f !== replayed[i]);
      if (drift !== -1) {
        gs._drReplayDrift = {
          episode: drift + 1, was: before[drift], now: replayed[drift] || null,
        };
        delete gs._drQueue;
        if (typeof console !== 'undefined') {
          console.warn('[drag-race] refusing to continue: rebuilding this season '
            + `did not reproduce episode ${drift + 1}.`
            + `\n  aired:   ${before[drift]}`
            + `\n  replay:  ${replayed[drift] || '(nothing)'}`
            + '\n  Your episodes are untouched. See gs._drReplayDrift.');
        }
        return null;
      }
      delete gs._drReplayDrift;
      gs._drQueue = gs._drQueue.slice(aired);
    }
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
  /* A QUEEN WHO WALKED BACK ON COMES OFF THE ELIMINATED LIST. This only ever
     appended, so a returnee was in `activePlayers` and in `gs.eliminated` on
     the same night, and on it twice once she went out again. Big Brother has
     cleared its returnee since the battle-back shipped (js/bb/battle-back.js,
     js/bb/week.js); this show never learned to.

     Drag Race's own placements read `exits[]` rather than this list -- see the
     note at the top of js/dr/export.js -- so the show itself never tripped on
     it. The franchise layer is where it bites: js/aftermath.js unions
     gs.eliminated into the eliminated set, and met a queen still competing.

     THE FILTER RUNS BEFORE THE APPEND. Today nothing depends on it: a returnee
     is immune on her return night (js/dr/week.js gives her the pass), so she
     cannot be in `exits` on the night she is in `returned`. Written this way
     round so that lifting the immunity is a rule change and not a corruption --
     filtering after the append would erase the exit it had just written. */
  if (row.dr?.returned?.name) {
    const back = row.dr.returned.name;
    gs.eliminated = (gs.eliminated || []).filter(n => n !== back);
  }
  gs.eliminated = [...(gs.eliminated || []), ...row.exits.map(x => x.name)];

  /* THE AUDIENCE PULSE, which this show was not calling at all. The edit layer
     is where the franchise decides who a season made a star of, and both other
     shows have fed it since their run loops were written. A drag season fed it
     nothing — so every queen read "Invisible" and the pulse drew a season of
     blank bars. The reader existed; the caller did not.
     Wrapped because the edit is commentary on the run and must never be able
     to take the run down with it. */
  try { updateEditLayer(row); } catch { /* commentary, never the season */ }

  /* ── THE NIGHT IN WORDS, WRITTEN ONCE, HERE ───────────────────────
     Nothing on this path wrote `summaryText`, so the transcript pane was
     blank on every drag episode -- "nothing to copy" -- and the Control
     Room's sync, which keeps only episodes that have one, imported a drag
     season as zero episodes and reported it as a missing-access problem.
     `generateDragSummaryText` had existed the whole time and reached no
     screen; this is the line that was missing, and it is the same line
     bb-run.js has had since the house shipped.

     Off `window` rather than imported, exactly as bb-run.js does it: this
     module is loaded by the headless harness too, where the text layer is
     not wired and a season must still play. */
  try {
    if (typeof window !== 'undefined' && window.generateSummaryText) {
      row.summaryText = String(window.generateSummaryText(row) || '');
      row.textV = window.TEXT_BACKLOG_V;
    }
  } catch { /* a night must never fail on its own retelling */ }

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
