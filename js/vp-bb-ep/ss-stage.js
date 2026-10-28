// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-stage.js — where each Secret Story screen happens, in the House of Secrets
// ══════════════════════════════════════════════════════════════════════
//
// Part 4: the user's plates (tools/bb-resort/src/secret-story, plates.js's own-house theme). A
// screen's set picks its room among the theme's plates on its own (the studio, the confessional,
// the airlock); this places the screens whose set says too little: the secret room is the attic
// behind the bookcase, a dilemma is played in the dilemma tunnel, the Voice's game in the games
// arena, a clue lands on the clue table, the final in the studio with its three chairs.
// Rules are tried in order; the first whose pattern matches the screen id wins.

/** @type {Array<[RegExp, { set: string, plate: string, room: string, x1?: number }]>} */
const RULES = [
  // the secret room: up the hidden stairs on the night, then the desk of nine screens
  [/^bb-ss-secretroom-in-/, { set: 'attic', plate: 'ss-attic-stairs', room: 'The Secret Room' }],
  [/^bb-ss-secretroom-/, { set: 'attic', plate: 'ss-attic-desk', room: 'The Secret Room' }],
  // the prime
  [/^bb-ss-prime-(open|package|goldenbuzz|return|accusation)-/, { set: 'studio-wide', plate: 'ss-studio', room: 'The Prime Studio' }],
  [/^bb-ss-prime-walk-/, { set: 'studio-wide', plate: 'ss-studio-crowd', room: 'The Prime Studio' }],
  [/^bb-ss-prime-unveil-/, { set: 'finale', plate: 'ss-studio-final', room: 'The Prime Studio' }],
  [/^bb-ss-prime-(airlock|verdict)-/, { set: 'door', plate: 'foyer', room: 'The Airlock' }],
  [/^bb-ss-prime-dil-/, { set: 'truths', plate: 'ss-dilemma', room: 'The Dilemma Room' }],
  [/^bb-ss-prime-truths-/, { set: 'truths', plate: 'ss-truths', room: 'The Room of Truths' }],
  // (the guest in the right-hand armchair, opposite the hosts' chair)
  [/^bb-ss-after-/, { set: 'studio', plate: 'ss-studio-after', room: 'After Secret', x1: 67 }],
  // the Voice's week
  [/^bb-ss-mission-/, { set: 'truths', plate: 'ss-mission-booth', room: 'The Mission Room' }],
  [/^bb-ss-missionres-/, { set: 'truths', plate: 'ss-switchboard', room: 'The Mission Room' }],
  [/^bb-ss-game-/, { set: 'arena', plate: 'ss-arena', room: 'The Games Arena' }],
  [/^bb-ss-(clue|houseclue|houseend)-/, { set: 'ceremony', plate: 'nom-table', room: 'Living Room' }],
  [/^bb-ss-role-/, { set: 'dr', plate: 'confessional-close', room: 'Confessional' }],
  [/^bb-ss-evening-/, { set: 'ceremony', plate: 'living-sofas', room: 'Living Room' }],
  [/^bb-ss-black-buzzer-/, { set: 'ceremony', plate: 'living-sofas-2', room: 'Living Room' }],
  // the final: the studio full, the three chairs, the awards on the big stage
  [/^bb-ss-final-open$/, { set: 'studio-wide', plate: 'ss-studio-crowd', room: 'The Studio' }],
  [/^bb-ss-final-(journey-\d+|v)$|^bb-ss-journeys-v$/, { set: 'finale', plate: 'ss-studio-final', room: 'The Studio' }],
  [/^bb-ss-final-awards$/, { set: 'studio-wide', plate: 'ss-studio', room: 'The Studio' }],
];

/**
 * Places a Secret Story screen in the house (in place; returns it). A screen that already names its
 * own plate (the buzz's showdown) keeps it.
 * @param {any} S
 * @param {(id: string) => boolean} [has] whether a plate is built
 */
export function ssPlace(S, has = () => true) {
  if (!S || typeof S.id !== 'string') return S;
  // (a screen in a hidden space keeps its own room: the Control Tower, vp-bb-ep/ss-groups.js stands in for unbuilt plates)
  if (S.space) return S;
  for (const [re, at] of RULES) {
    if (!re.test(S.id)) continue;
    if (!S.plate || !has(S.plate)) {
      if (has(at.plate)) {
        Object.assign(S, { set: at.set, plate: at.plate, room: at.room });
        if (at.x1 && Array.isArray(S.cast) && S.cast.length === 1) S.cast = [[S.cast[0][0], at.x1]];
      }
      else if (at.room) S.room = at.room;
    }
    break;
  }
  // a set Big Brother's house has and the House of Secrets does not (the final's studio was set as a plate id)
  if (S.set === 'studio-finale') S.set = 'finale';
  // a line of people that runs off the screen (four nominees at 30, 52, 74, 96%) is spread to fit
  if (Array.isArray(S.cast) && S.cast.length > 1 && S.cast.some(c => Array.isArray(c) && (c[1] > 88 || c[1] < 12))) {
    const n = S.cast.length, lo = n > 4 ? 10 : 16, hi = 100 - lo;
    S.cast = S.cast.map((c, i) => [c[0], Math.round(lo + (hi - lo) * i / (n - 1))]);
  }
  return S;
}
