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
import { rpBuildConclave, trConclaveRevealAll } from './conclave.js';
import { rpBuildRoundTable, trRoundTableRevealAll } from './round-table.js';
import { rpBuildColdOpen, trColdOpenRevealAll } from './cold-open.js';
import { rpBuildHouseStatus, trHouseStatusRevealAll } from './house-status.js';
import { rpBuildMission, trMissionRevealAll } from './mission.js';
import { rpBuildRecruitment, trRecruitmentRevealAll } from './recruitment.js';
import { rpBuildEndgame, trEndgameRevealAll } from './endgame.js';
import { rpBuildCastleDay, trCastleDayRevealAll } from './castle-day.js';
import { rpBuildSelection, trSelectionRevealAll } from './selection.js';

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
  // ── THE ONLY SCREEN THAT EXISTS ONCE, AND IT GOES FIRST ─────────────
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
  { id: 'tr-mission', label: 'The Mission', suffix: 'mission',
    badge: { text: 'Mission', color: '#c8a24a' },
    when: r => !!(r.tr && r.tr.mission),
    build: rpBuildMission, revealAll: trMissionRevealAll, revealAllName: 'trMissionRevealAll' },
  { id: 'tr-round-table', label: 'The Round Table', suffix: 'roundtable',
    badge: { text: 'Round Table', color: '#b91c3c' },
    when: r => !!(r.tr && r.tr.table),
    build: rpBuildRoundTable, revealAll: trRoundTableRevealAll, revealAllName: 'trRoundTableRevealAll' },
  { id: 'tr-conclave', label: 'The Conclave', suffix: 'conclave',
    badge: { text: 'Conclave', color: '#e0a049' },
    when: r => !!(r.tr && r.tr.conclave),
    build: rpBuildConclave, revealAll: trConclaveRevealAll, revealAllName: 'trConclaveRevealAll' },
  { id: 'tr-recruitment', label: 'The Offer', suffix: 'recruitment',
    badge: { text: 'The Offer', color: '#8b5cf6' },
    when: r => !!(r.tr && r.tr.recruitment),
    build: rpBuildRecruitment, revealAll: trRecruitmentRevealAll, revealAllName: 'trRecruitmentRevealAll' },
  // ── THE DAY, AFTER THE NIGHT IT ENDED ON, AND THAT IS NOT A WHIM ────
  //
  // It holds all seven windows, and two of them -- `after-table` and `night`
  // -- happen AFTER the table sits. Placed anywhere above the Round Table it
  // would print reactions to a reveal three screens before the reveal, which
  // is exactly the defect Task 6 found by reading a season in sequence (the
  // day book was second and listed exits that had not happened yet) and Task 7
  // fixed by moving that screen to the foot. Same object, same move: the day
  // is looked back over once the day is done.
  { id: 'tr-castle-day', label: 'The Castle Day', suffix: 'castleday',
    badge: { text: 'The Day', color: '#8fbf9a' },
    when: r => !!(r.tr && r.tr.castle && Array.isArray(r.tr.castle.scenes)
      && r.tr.castle.scenes.length),
    build: rpBuildCastleDay, revealAll: trCastleDayRevealAll,
    revealAllName: 'trCastleDayRevealAll' },
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
