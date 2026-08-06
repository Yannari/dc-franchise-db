// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/_sealed.js — showing a competition whose result is sealed
// ══════════════════════════════════════════════════════════════════════
//
// The Invisible HOH twist airs the competition and withholds the result, so
// every themed competition screen used to decline on `act.secret` and hand the
// week to the generic board. That was correct — a themed screen sprays the
// winner across a rail, a sidebar and a gold card — but it meant a season with
// the twist scheduled had a plain Head of Household night every single week.
//
// A competition can be shown without its result being shown. The catch is that
// these competitions give the winner away STRUCTURALLY: an elimination format
// names the winner by subtraction once the field is small enough, and a timed
// format names them the moment the times are on screen. Styling cannot hide
// either. So the broadcast does what a broadcast does — it plays the
// competition and then cuts away before it resolves.
//
// Three rules, and every sealed screen has to honour all three:
//
//   1. CUT EARLY ENOUGH. Elimination comps stop while enough houseguests are
//      still standing that the survivor is not derivable. Timed and scored
//      comps stop before any result card, and must additionally suppress every
//      running total, rack, leaderboard and margin — the numbers ARE the result.
//   2. NAME NOBODY. No winner on the rail, in the status strip, in a sidebar,
//      or in a card. Not even by implication.
//   3. TELL THE VIEWER, NOT THE HOUSE. The last card is dramatic irony: the
//      audience learns who owns the week and the house does not. It is the one
//      place the name is allowed to appear.
// ══════════════════════════════════════════════════════════════════════

/** Only a Head of Household competition can be sealed; a veto never is. */
export const isSealedHoh = (act, actType) => actType === 'hoh' && !!act?.secret;

/**
 * Where to stop.
 *
 * @param {Array} steps        the screen's own step list
 * @param {object} opts
 *   survivorsAfter(step, i)   houseguests still standing after this step, or
 *                             null if the step does not eliminate anybody
 *   floor                     stop once this many or fewer are left standing
 *   isResult(step, i)         true for any step that states or implies a result
 *   countKind + cap           stop after this many steps of this kind. For a
 *                             timed or scored competition the RESULT IS A
 *                             NUMBER, so masking the numbers is not enough on
 *                             its own — showing every competitor's run ranks
 *                             the field however it is styled. Cutting partway
 *                             through the field leaves the rest unknown.
 * @returns {number} how many steps may be shown (at least one)
 */
export function planSeal(steps, {
  survivorsAfter = () => null, floor = 3, isResult = () => false,
  countKind = null, cap = Infinity,
} = {}) {
  let counted = 0;
  for (let i = 0; i < steps.length; i++) {
    if (isResult(steps[i], i)) return Math.max(1, i);
    if (countKind && steps[i].kind === countKind && ++counted >= cap) return Math.max(1, i + 1);
    const left = survivorsAfter(steps[i], i);
    if (Number.isFinite(left) && left <= floor) return Math.max(1, i + 1);
  }
  return Math.max(1, steps.length);
}

/** Stand-in for any number a sealed screen must not print. */
export const MASK = '<span style="letter-spacing:2px;opacity:.6">▓▓</span>';

/** Styling for the two sealed cards, scoped to the screen's own prefix. */
export const sealCss = (p, accent) => `
  .${p}-cut{border-style:dashed!important;border-color:rgba(180,180,190,.4)!important;
    background:repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 10px,transparent 10px 20px)!important;
    text-align:center}
  .${p}-cut-h{font-size:12px;letter-spacing:5px;color:#b9b3bd;margin-bottom:5px}
  .${p}-cut-b{font-size:13.5px;line-height:1.6;color:#cfc9d4;margin:0}
  .${p}-cut-bars{display:flex;gap:4px;justify-content:center;margin:9px 0 2px}
  .${p}-cut-bars i{display:block;width:26px;height:5px;border-radius:2px;background:rgba(255,255,255,.16);
    animation:${p}-static 1.1s steps(3) infinite alternate}
  .${p}-cut-bars i:nth-child(2){animation-delay:.15s}
  .${p}-cut-bars i:nth-child(3){animation-delay:.3s}
  .${p}-cut-bars i:nth-child(4){animation-delay:.45s}
  @keyframes ${p}-static{from{opacity:.25}to{opacity:.85}}
  .${p}-irony{border-color:rgba(200,160,255,.5)!important;
    background:linear-gradient(180deg,rgba(60,40,90,.65),rgba(14,10,22,.85))!important}
  .${p}-irony-tag{display:inline-block;font-size:9px;letter-spacing:2.6px;color:#1a1024;
    background:#c8a0ff;border-radius:3px;padding:2px 8px;margin-bottom:8px}
  .${p}-irony-b{display:flex;align-items:center;gap:13px}
  .${p}-irony-n{font-size:21px;letter-spacing:2px;color:#efe2ff;margin-bottom:3px}
  .${p}-irony-p{margin:0;font-size:13.5px;line-height:1.6;color:#cdbfe0}
  .${p}-irony .bb-av{border-radius:9px;border:2px solid #c8a0ff;box-shadow:0 0 20px rgba(200,160,255,.45)}
`;

const CUT_LINES = [
  'The feed cuts to the fish. Whatever happens next happens without an audience.',
  'The screen goes to the fish tank, which in this house is the sound of somebody winning something.',
  'And that is where the broadcast stops. The rest of it belongs to the people in the room.',
  'The cameras cut away. The competition keeps going without anybody watching it.',
];

/** The card where the broadcast stops. Says how much was left, never who. */
export function sealCutCard(p, { standing = null, unit = 'still in', salt = 0 } = {}) {
  const line = CUT_LINES[Math.abs(salt) % CUT_LINES.length];
  return `<article class="${p}-card ${p}-cut">
    <div class="${p}-cut-h">FEED CUT</div>
    <div class="${p}-cut-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <p class="${p}-cut-b">${standing != null ? `<b>${standing}</b> ${unit} when the feed cuts. ` : ''}${line}</p>
  </article>`;
}

/**
 * The dramatic irony card: the viewer is told, the house is not.
 * The ONLY place a sealed competition is allowed to print the winner.
 *
 * Every sealed screen renders exactly one of these — the themed ones from here,
 * the generic board its own copy — which makes "ONLY YOU KNOW" the one thing
 * common to every sealed competition, and the only honest thing for a guard to
 * look for. The BANNER is not: each theme writes its own ("RESULT SEALED" on a
 * lane board, "THE HOUSE NEVER FINDS OUT" in the tiki yard, the poker table
 * simply goes dark), which is correct and is why pinning a test to one of them
 * made it fail whenever the season drew a different competition.
 */
export function sealIronyCard(p, { winner, avatar, esc, isHoh = true }) {
  const E = typeof esc === 'function' ? esc : (v => String(v ?? ''));
  const AV = typeof avatar === 'function' ? avatar : (() => '');
  return `<article class="${p}-card ${p}-irony">
    <span class="${p}-irony-tag">ONLY YOU KNOW</span>
    <div class="${p}-irony-b">
      ${AV(winner, 62)}
      <div>
        <div class="${p}-irony-n">${E(winner)}</div>
        <p class="${p}-irony-p">won it, and ${isHoh ? 'owns this week' : 'holds the veto'}. Nobody in that house
          has any idea. They will spend the next few days being careful in front of the wrong people.</p>
      </div>
    </div>
  </article>`;
}
