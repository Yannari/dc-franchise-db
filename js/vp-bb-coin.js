// ══════════════════════════════════════════════════════════════════════
// vp-bb-coin.js — the Coin of Destiny on screen
// ══════════════════════════════════════════════════════════════════════
//
// The screen has to hold two opposite facts at once, because that IS the
// twist: buying in was PUBLIC and the call was PRIVATE.
//
// So the stage is split. On the left, a ledger — every name that paid, which
// the house watched and is entitled to remember. On the right, a coin turning
// in a room with no camera in it, and it never lands face-up.
//
// The VIEWER is shown who came out of that room holding the coin, the way the
// Den of Temptation shows its taker — the audience is owed the answer. The
// HOUSE is not, and never will be: a dethroned Head of Household spending the
// rest of the season looking at a list of people who all paid to be able to do
// it IS the twist, and telling the room would delete it.
//
// So the split on this screen is not viewer-versus-nobody, it is
// viewer-versus-house, and the copy has to say which of the two it is talking
// to. It said the wrong one first time: it claimed the audience would never
// find out while the beats underneath it named the winner on the same screen.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const COIN_CSS = `
.bbcd-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#cbd5e1;text-shadow:0 0 18px rgba(148,163,184,.3);margin-bottom:4px}
.bbcd-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}
.bbcd-stage{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:560px;margin:0 auto 18px;align-items:center}
@media(max-width:620px){.bbcd-stage{grid-template-columns:1fr}}
.bbcd-ledger{border:1px solid rgba(148,163,184,.25);border-radius:6px;padding:10px 12px;background:rgba(148,163,184,.05)}
.bbcd-ledger h4{margin:0 0 7px;font-size:9.5px;letter-spacing:1.6px;color:#94a3b8;font-weight:600}
.bbcd-row{display:flex;justify-content:space-between;gap:10px;font-size:11.5px;color:#cbd5e1;padding:3px 0;border-bottom:1px dashed rgba(148,163,184,.16)}
.bbcd-row span:last-child{color:#8b949e;font-size:9.5px;letter-spacing:1px}
.bbcd-coin{display:block;width:100%;max-width:200px;height:auto;margin:0 auto}
.bbcd-spin{animation:bbcd-spin 3s linear infinite;transform-origin:80px 84px}
@keyframes bbcd-spin{from{transform:scaleX(1)}25%{transform:scaleX(.08)}50%{transform:scaleX(1)}75%{transform:scaleX(.08)}to{transform:scaleX(1)}}
.bbcd-vault{font-size:9px;letter-spacing:1.4px;fill:#64748b;font-family:var(--font-mono,monospace)}
@media(prefers-reduced-motion:reduce){.bbcd-spin{animation:none}}
`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `coin-of-destiny` act
 * @param {object} deps {tvState, reveal, esc} from vp-screens.js
 */
export function rpBuildBBCoinOfDestiny(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'cd');
  const state = _init(stateKey);
  const beats = act.beats || [];
  // Framing, then the play-by-play, then the point. The outcome card used to
  // sit second and told you the nominations had changed before the beats got
  // round to anybody buying in.
  const steps = [{ kind: 'ledger' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'vault' }];
  const total = steps.length;
  const called = state.idx >= total - 1;

  const COIN = `<svg class="bbcd-coin" viewBox="0 0 160 150" role="img"
      aria-label="A coin turning in a room with no camera">
    <rect x="6" y="6" width="148" height="138" rx="8" fill="rgba(15,23,42,.92)" stroke="#334155" stroke-width="1.4"/>
    <text class="bbcd-vault" x="80" y="26" text-anchor="middle">NO CAMERA IN HERE</text>
    <g class="bbcd-spin">
      <circle cx="80" cy="84" r="30" fill="rgba(148,163,184,.12)" stroke="#94a3b8" stroke-width="2.4"/>
      <circle cx="80" cy="84" r="22" fill="none" stroke="#64748b" stroke-width="1"/>
    </g>
    <text class="bbcd-vault" x="80" y="134" text-anchor="middle">${
  called ? 'CALLED &#183; NOT TOLD' : '&#160;'}</text>
  </svg>`;

  const LEDGER = `<div class="bbcd-ledger">
    <h4>WHO BOUGHT IN &mdash; PUBLIC RECORD</h4>
    ${(act.buyers || []).map(n =>
    `<div class="bbcd-row"><span>${esc(n)}</span><span>PAID</span></div>`).join('')
      || '<div class="bbcd-row"><span>nobody</span><span>&mdash;</span></div>'}
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'ledger') {
      return _card('EVERYBODY SAW WHO PAID',
        `Buying in is a sentence with exactly one meaning, and ${(act.buyers || []).length} people said it
         out loud with money. Paying does not make you the one who called it — but it does tell the house
         precisely how safe you thought you were.`, 'gold');
    }
    if (step.kind === 'vault') {
      return _card('AND NOBODY SAW THE CALL',
        act.calledRight
          ? `The call was right. This week's nominations came off ${esc(act.hoh || 'the Head of Household')},
             and ${esc((act.nominees || []).join(' and '))} went up instead.
             <br><br>You are being shown something the house never gets. Nobody in that room will ever be
             told whose hand did it: ${esc(act.hoh || 'the dethroned Head of Household')} gets the list on
             the left and the certainty that one of those names took the week, and nothing else, for the
             rest of the season. That is the whole difference between this and a Coup — a Coup at least
             gives you somebody to hate.`
          : `The call was wrong. The nominations stand exactly as they were, and somebody has paid, played
             and lost in front of the entire house for nothing.
             <br><br>They are still on that list. Everybody who bought in is, and the list does not record
             who won.`,
        act.calledRight ? 'red' : 'grey', 'is-final',
        act.calledRight ? [act.hoh, ...(act.nominees || [])] : (act.buyers || []));
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbcd', css: COIN_CSS,
    title: 'THE COIN OF DESTINY',
    sub: 'Paid for in public. Called in private.',
    stage: `<div class="bbcd-stage">${LEDGER}${COIN}</div>`,
    cards: steps.map(card).join(''),
    firstLabel: 'The ledger',
  });
}
