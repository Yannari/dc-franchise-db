// ══════════════════════════════════════════════════════════════════════
// js/vp-tr/screens.js — WHICH SCREENS A CASTLE NIGHT HAS. One copy.
// ══════════════════════════════════════════════════════════════════════
//
// This list used to live inside `buildVPScreens()`, and Task 6 needed the same
// list a second time: a text backlog is a retranscription of every screen, so
// it has to know which screens a row produced, in what order, under what name.
//
// TWO COPIES OF ONE RULE IS THE SHAPE THIS REPO HAS BEEN BITTEN BY at least six
// times — the act names, the pool-shape figures, the tier cuts, the show list
// (eight files, docs/ADDING-A-SHOW.md §13), the vocabulary word list, and the
// tier re-derivation. The failure is always quiet: one copy learns about a new
// screen and the other does not, and the transcript stops mentioning the
// afternoon while every test stays green. So the list lives here, once, and
// both the visual player and the transcript read it.
//
// This module imports no engine state, exactly as every other file in
// `js/vp-tr/` does not: a screen is handed a record and cannot reach past it.
import { rpBuildArrival, trArrivalRevealAll } from './arrival.js';
import { rpBuildConclave, trConclaveRevealAll } from './conclave.js';
import { rpBuildRoundTable, trRoundTableRevealAll } from './round-table.js';
import { rpBuildColdOpen, trColdOpenRevealAll } from './cold-open.js';
import { rpBuildHouseStatus, trHouseStatusRevealAll } from './house-status.js';
import { rpBuildMission, trMissionRevealAll } from './mission.js';
import { rpBuildRecruitment, trRecruitmentRevealAll } from './recruitment.js';
import { rpBuildEndgame, trEndgameRevealAll } from './endgame.js';
import { rpBuildCastleDay, trCastleDayRevealAll, castleSegmentHasScenes }
  from './castle-day.js';
import { rpBuildSelection, trSelectionRevealAll } from './selection.js';
import { rpBuildSuspicion, trSuspicionRevealAll } from './suspicion.js';
// The Alcove is folded into the night castle segment (Plan 11); only its gate
// is needed here, for that segment's `when`.
import { _hasConfessionals } from './confessionals.js';

/**
 * IN THE ORDER THE CASTLE LIVES THEM.
 *
 * The morning opens the episode — and it opens on the PREVIOUS night, because
 * a night runs at the end of the episode it belongs to and the castle finds
 * out over breakfast. Then the estate in the afternoon, then the table in the
 * evening, then the turret, because the public half of the night comes first
 * and the private half is what the episode ends on.
 *
 * ── AND THE DAY BOOK IS RULED OFF AT THE END OF THE DAY ────────────────
 *
 * It used to sit SECOND, on the reasoning that a board is where a day starts
 * from. It is not: its own heading is "Ruled Off", it lists tonight's exits —
 * `roundExits()` over this row's own `exits[]`, deliberately, so that call is
 * load-bearing — and a ledger of the evening printed before the evening tells
 * the reader who leaves the table three screens before the table sits. Found
 * by reading a season in sequence rather than by an assertion, which is how
 * Task 6 found the transcript opening on tonight's murder; the transcript's
 * own `RULED OFF` section was moved to the foot for exactly this reason and
 * this is the same move on the same object. Little is lost by it: the cold
 * open already lays the room — the cast minus everybody gone — and the Round
 * Table's sidebar already carries the pot, so the day is not entered blind.
 *
 * The endgame stays after it, because the endgame is not a day.
 *
 * `badge` is OPTIONAL AND LIVES HERE FOR THE REASON EVERYTHING ELSE DOES.
 * The Run tab's episode timeline draws a coloured pill per night, and every
 * other show's is a hand-written ternary per twist — eighty of them in
 * js/run-ui.js, and a new twist gets one by somebody remembering. A castle
 * badge is the same question this list already answers ("did this row have an
 * afternoon?"), so the run tab asks the list rather than keeping a second
 * copy of the conditions. A screen with no badge — the morning and the book,
 * which every row has — is simply not worth a pill.
 *
 * `when` is why a screen is registered off the RECORD and never off an episode
 * number: a mission needs four people and an endgame round runs none, so plenty
 * of rows have no afternoon and must not get a screen. Recruitment and murder
 * are exclusive — the pact gets one action a night — so the conclave and the
 * offer are never both registered, and most nights carry neither. The endgame
 * is a phase rather than a night: it can force six extra tables or none at all,
 * so it rides on the LAST row the season wrote.
 */
export const TRAITORS_SCREENS = [
  // ── BEFORE ANY OF THEM IS ANYTHING (Plan 9, Task 2) ────────────────
  //
  // ABOVE THE SELECTION, and that is the whole of the task. Spec §2.2 runs
  // episode one as an arrival, a briefing and then the rank; the list began at
  // the rank, so the first thing a viewer ever saw was twenty strangers already
  // blindfolded and a hand landing on three of them. A room the viewer has not
  // met is not a room, and the format's product is watching a room fail.
  //
  // `when` is the record, never the episode number — same rule as everything
  // below it. `tr.arrival` is written on the episode-one row and no other, so
  // the screen simply stops appearing from night two on.
  { id: 'tr-arrival', label: 'The Arrival', suffix: 'arrival',
    badge: { text: 'Arrival', color: '#e7b978' },
    when: r => !!(r.tr && r.tr.arrival && Array.isArray(r.tr.arrival.introductions)
      && r.tr.arrival.introductions.length),
    build: rpBuildArrival, revealAll: trArrivalRevealAll,
    revealAllName: 'trArrivalRevealAll' },
  // ── THE ONLY OTHER SCREEN THAT EXISTS ONCE ────────────────────
  //
  // Spec 9.2 lists it first. `tr.selection` is written on the episode-one row
  // and no other, so `when` is the same shape as every other entry here --
  // registered off the RECORD, never off an episode number -- and the screen
  // simply does not appear from night two on. It sits above breakfast because
  // on the first morning there is no previous night to have breakfast about:
  // the cast arrive, they are chosen, and only then does the castle have a
  // yesterday.
  { id: 'tr-selection', label: 'The Selection', suffix: 'selection',
    badge: { text: 'Selection', color: '#c9c2ac' },
    when: r => !!(r.tr && r.tr.selection && Array.isArray(r.tr.selection.taps)
      && r.tr.selection.taps.length),
    build: rpBuildSelection, revealAll: trSelectionRevealAll,
    revealAllName: 'trSelectionRevealAll' },
  { id: 'tr-cold-open', label: 'Breakfast', suffix: 'coldopen',
    when: r => !!(r.tr && r.tr.dawn),
    build: rpBuildColdOpen, revealAll: trColdOpenRevealAll, revealAllName: 'trColdOpenRevealAll' },
  // ── THE DAY, INTERLEAVED INTO BROADCAST ORDER (Plan 11) ───────────────
  //
  // The Castle Day used to be ONE screen at the foot of the episode, after the
  // conclave. That put the whole social layer — most of it happening BEFORE the
  // Round Table — three or four screens after the vote it precedes. The stream
  // is now three segments at their real chronological moments, parameterised off
  // ONE builder (`rpBuildCastleDay(r, o, segment)`), never duplicated.
  //
  // THE MORNING opens on the previous night (breakfast finds out what it cost)
  // and runs the working morning, and it sits before the mission because that is
  // when it happens. It carries no reaction to tonight's table — the causality
  // guard in castle-day.js's `_view` throws if a post-banishment scene is ever
  // sorted into it.
  { id: 'tr-castle-morning', label: 'The Morning', suffix: 'castleday-morning',
    badge: { text: 'The Morning', color: '#8fbf9a' },
    when: r => castleSegmentHasScenes(r, 'morning'),
    build: (r, o) => rpBuildCastleDay(r, o, 'morning'),
    revealAll: trCastleDayRevealAll, revealAllName: 'trCastleDayRevealAll' },
  { id: 'tr-mission', label: 'The Mission', suffix: 'mission',
    badge: { text: 'Mission', color: '#c8a24a' },
    when: r => !!(r.tr && r.tr.mission),
    build: rpBuildMission, revealAll: trMissionRevealAll, revealAllName: 'trMissionRevealAll' },
  // THE AFTERNOON — the road back and the manoeuvring before the table — sits
  // between the mission and the Round Table. Still pre-banishment, still guarded.
  { id: 'tr-castle-afternoon', label: 'The Afternoon', suffix: 'castleday-afternoon',
    badge: { text: 'The Afternoon', color: '#c9a24e' },
    when: r => castleSegmentHasScenes(r, 'afternoon'),
    build: (r, o) => rpBuildCastleDay(r, o, 'afternoon'),
    revealAll: trCastleDayRevealAll, revealAllName: 'trCastleDayRevealAll' },
  { id: 'tr-round-table', label: 'The Round Table', suffix: 'roundtable',
    badge: { text: 'Round Table', color: '#b91c3c' },
    when: r => !!(r.tr && r.tr.table),
    build: rpBuildRoundTable, revealAll: trRoundTableRevealAll, revealAllName: 'trRoundTableRevealAll' },
  // THE NIGHT — after the table, into the dark. This is the segment that MAY
  // react to the banishment (roundtable-scramble + post-banishment), so it sits
  // after the Round Table, exactly where the whole day used to sit. It is also
  // where the confessionals now live (Plan 11, alcove fold): the beliefs the
  // chair is composed from are snapshotted at the END of the night, so the
  // Alcove sits beside the night it is the voice of — which is why the segment
  // registers when there is EITHER a post-table scene OR a confessional, and the
  // night on episode two that has a confessional but no post-table scene still
  // gets a screen.
  { id: 'tr-castle-night', label: 'The Night', suffix: 'castleday-night',
    badge: { text: 'The Night', color: '#94a0cc' },
    when: r => castleSegmentHasScenes(r, 'night') || _hasConfessionals(r),
    build: (r, o) => rpBuildCastleDay(r, o, 'night'),
    revealAll: trCastleDayRevealAll, revealAllName: 'trCastleDayRevealAll' },
  { id: 'tr-conclave', label: 'The Conclave', suffix: 'conclave',
    badge: { text: 'Conclave', color: '#e0a049' },
    when: r => !!(r.tr && r.tr.conclave),
    build: rpBuildConclave, revealAll: trConclaveRevealAll, revealAllName: 'trConclaveRevealAll' },
  { id: 'tr-recruitment', label: 'The Offer', suffix: 'recruitment',
    badge: { text: 'The Offer', color: '#8b5cf6' },
    when: r => !!(r.tr && r.tr.recruitment),
    build: rpBuildRecruitment, revealAll: trRecruitmentRevealAll, revealAllName: 'trRecruitmentRevealAll' },
  // ── THE CASTLE DAY IS NOW THREE SEGMENTS, ABOVE ──────────────────────
  //
  // It used to be one screen here, at the foot after the conclave, because two
  // of its seven windows (`after-table`, `night`) happen after the table sits
  // and drawing the whole stream above the table printed reactions to a reveal
  // three screens early. Plan 11 split it into morning / afternoon / night at
  // their real broadcast moments; only the NIGHT segment carries the two
  // post-table windows, and it is still after the Round Table. The causality
  // guard in castle-day.js's `_view` enforces that the morning and afternoon
  // never carry a post-banishment scene.
  //
  // -- WHO BELIEVES WHAT, AND HOW WRONG THEY ARE (Plan 8, Task 10) -----
  //
  // AFTER THE TABLE, AND THAT IS NOT A PREFERENCE. `tr.beliefs` is snapshotted
  // at the END of the night, so it already holds tonight's reveal and tonight's
  // murder evidence; drawn any earlier it would show the room reacting to a
  // banishment two screens before the banishment -- the same defect Task 6
  // found by reading a season in sequence and Task 7 fixed by moving the day
  // book to the foot. It sits after the day and before the book because it is
  // the LAST thing that is still a story: the book is a ledger, and where the
  // room's head has got to is not a ledger entry.
  //
  // `when` is a non-empty CASTLE board rather than a present record, because on
  // the first night the Faithfuls have not formed one read between them and a
  // page reporting that they have not is a page with nothing on it. The pact's
  // own certainty is already the last beat of the Selection.
  { id: 'tr-suspicion', label: 'The Suspicion Board', suffix: 'suspicion',
    badge: { text: 'The Board', color: '#7fa8c9' },
    when: r => !!(r.tr && r.tr.beliefs && Array.isArray(r.tr.beliefs.castle)
      && r.tr.beliefs.castle.length),
    build: rpBuildSuspicion, revealAll: trSuspicionRevealAll,
    revealAllName: 'trSuspicionRevealAll' },
  // -- THE CHAIR IS NOW FOLDED INTO THE NIGHT (Plan 11, alcove fold) -----
  //
  // The Alcove used to be its own screen here, after the board and before the
  // book. The writing contract wants a confessional beside the action it
  // clarifies, so it is now composed into the NIGHT castle segment (above,
  // after the Round Table), which is the same place in the night it always
  // reported on — `tr.beliefs` is snapshotted at the END of the night, so a
  // confessional cannot be drawn any earlier than the post-table stream without
  // reacting to a banishment before it has happened. `_hasConfessionals` still
  // gates it; it is imported for the night segment's `when` above.
  { id: 'tr-status', label: 'The Day Book', suffix: 'housestatus',
    when: r => !!(r.tr && Array.isArray(r.tr.cast) && r.tr.cast.length),
    build: rpBuildHouseStatus, revealAll: trHouseStatusRevealAll, revealAllName: 'trHouseStatusRevealAll' },
  { id: 'tr-endgame', label: 'The Endgame', suffix: 'endgame',
    badge: { text: 'Endgame', color: '#4cffb3' },
    when: r => !!(r.tr && r.tr.endgame),
    build: rpBuildEndgame, revealAll: trEndgameRevealAll, revealAllName: 'trEndgameRevealAll' },
];

/**
 * A SCREEN'S NARRATION — the words, without the furniture.
 *
 * Two things on every castle screen are not narration and are read as it:
 *
 *  - THE AVATAR INITIALS. `_portrait()` draws a fallback glyph of a player's
 *    initials inside every picture, so stripping the markup turns a roll call
 *    into "AAlejandroAAmyAMAnne Maria" — and, because this roster contains a
 *    player called "B", puts a standalone "B" into every screen that shows
 *    anybody whose name begins with one. The picture always arrives with the
 *    full name beside it, so the glyph is redundant as well as wrong.
 *  - THE REVEAL CONTROLS. "Continue 7 / 7 Reveal all" is a button, a counter
 *    and a button. It is the reader's furniture and it is not something the
 *    castle said.
 *
 * SUBTRACTIVE, AND THEREFORE ASSERTED IN THE TESTS: a helper that ate too much
 * would make every "the transcript does not contain X" guard pass for free.
 * That is the matcher-never-matches trap running backwards, and this repo has
 * shipped it once already.
 */
export function screenNarration(html) {
  return String(html || '')
    .replace(/<span class="cv-av-ini"[^>]*>[\s\S]*?<\/span>/g, ' ')
    // The controls block holds buttons and a counter and no nested <div>, so
    // the lazy match ends on its own closing tag.
    .replace(/<div class="[a-z]{2}-controls"[\s\S]*?<\/div>/g, ' ');
}

/**
 * Every screen this episode record produces, as `{ id, label, html }`.
 *
 * `observer` is the contract every builder in `js/vp-tr/` takes (spec §9.1).
 * The visual player is the AUDIENCE feed — it is the one reader entitled to see
 * the conclave — so it passes 'audience' explicitly rather than relying on a
 * default, because the default is the thing a later edit changes.
 */
export function traitorsScreens(epRecord, observer = 'audience') {
  return TRAITORS_SCREENS.filter(s => s.when(epRecord))
    .map(s => ({ id: s.id, label: s.label, html: s.build(epRecord, observer) }));
}

/**
 * The same screens, every beat revealed, WITHOUT touching the reveal state the
 * viewer's own copy of the screen is keeping.
 *
 * A transcript is the finished screen, so it has to be rendered with the last
 * beat shown: the stream is all in the markup either way, but the sidebars are
 * gated on `idx` and half of what a screen finally says is in its sidebar.
 * Revealing costs nothing to look at and everything to leave behind — reveal
 * state is keyed by episode number, so calling `revealAll` on the live key
 * would hand the next reader a screen that opens with its ending already on it.
 *
 * So it renders a RENUMBERED COPY of the row. `js/tr/headless.js` writes the
 * episode number twice on purpose and says why: `num` is the VP's key and a
 * caller is free to renumber a copy of a row to get a fresh one, while anything
 * that is a FACT about the season comes off `tr.ep` instead. The number chosen
 * is negative, so it can never collide with a real episode and cannot grow: one
 * key per episode, not one per transcript.
 */
export function traitorsScreensRevealed(epRecord, observer = 'audience') {
  const fresh = { ...epRecord, num: -Math.abs(Number(epRecord.num) || 0) - 1 };
  return TRAITORS_SCREENS.filter(s => s.when(fresh)).map(s => {
    const first = s.build(fresh, observer);
    // The handler the screen emitted, which carries its own step count. Read
    // off the markup rather than recounted here, because a second count is a
    // second copy of the same rule.
    const m = new RegExp(s.revealAllName + "\\('" + s.suffix + "',(\\d+),(-?\\d+)\\)")
      .exec(first);
    // A screen with no controls at all is not a failure: the offer renders an
    // empty passage and no reveal machinery to an observer who was in neither
    // role, and that layer is the point of the observer contract.
    if (!m) return { id: s.id, label: s.label, html: first };
    s.revealAll(s.suffix, Number(m[1]), Number(m[2]));
    return { id: s.id, label: s.label, html: s.build(fresh, observer) };
  });
}
