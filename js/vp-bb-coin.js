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

/* A ROOM WITH NO CAMERA IN IT. Cold metal, hard shadow, and one object.
   Everything public in this twist is money; the only private thing is the
   call — so the paying is lit and the coin sits in the dark. */
.bbcd-vaultroom{position:relative;max-width:600px;margin:0 auto 20px;padding:20px 18px 16px;
  border-radius:12px;overflow:hidden;
  background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(2,6,12,.98));
  border:1px solid rgba(148,163,184,.22);box-shadow:inset 0 0 70px rgba(0,0,0,.85)}
.bbcd-vaultroom::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(90deg,rgba(255,255,255,.02) 0 1px,transparent 1px 4px)}

/* the counter: everybody who paid, faces up, because paying is public */
.bbcd-counter{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;position:relative;z-index:1}
.bbcd-buyer{width:56px;text-align:center}
.bbcd-face{position:relative;width:44px;height:44px;margin:0 auto;border-radius:50%;overflow:hidden;
  border:2px solid #94a3b8;background:#0b1220;box-shadow:0 0 14px -4px rgba(148,163,184,.8)}
.bbcd-face img,.bbcd-face .bb-av,.bbcd-face .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbcd-buyer.is-out .bbcd-face{filter:grayscale(1) brightness(.5);border-color:#334155;box-shadow:none}
.bbcd-buyer.is-winner .bbcd-face{border-color:#e3b341;
  box-shadow:0 0 0 3px rgba(227,179,65,.18),0 0 24px -3px rgba(227,179,65,.95)}
.bbcd-nm{font-size:9px;color:#cbd5e1;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbcd-paid{font-family:var(--font-mono,ui-monospace,monospace);font-size:7.5px;letter-spacing:1px;
  color:#94a3b8;margin-top:1px}
.bbcd-buyer.is-out .bbcd-paid{color:#475569}
.bbcd-buyer.is-winner .bbcd-paid{color:#e3b341}

.bbcd-coinwrap{display:flex;align-items:center;justify-content:center;gap:18px;margin:16px 0 6px;
  position:relative;z-index:1}
.bbcd-coin{display:block;width:118px;height:auto;filter:drop-shadow(0 10px 18px rgba(0,0,0,.9))}
.bbcd-spin{animation:bbcd-spin 3s linear infinite;transform-origin:80px 84px}
@keyframes bbcd-spin{from{transform:scaleX(1)}25%{transform:scaleX(.08)}50%{transform:scaleX(1)}75%{transform:scaleX(.08)}to{transform:scaleX(1)}}
.bbcd-vault{font-size:9px;letter-spacing:1.4px;fill:#64748b;font-family:var(--font-mono,monospace)}

/* the crown, and what the call did to it */
.bbcd-throne{text-align:center;width:96px}
.bbcd-king{position:relative;width:72px;height:72px;margin:0 auto;border-radius:4px;overflow:hidden;
  border:2px solid #e3b341;box-shadow:0 0 20px -6px rgba(227,179,65,.9)}
.bbcd-king img,.bbcd-king .bb-av,.bbcd-king .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbcd-throne.is-dethroned .bbcd-king{border-color:#c9343c;filter:grayscale(.75);
  box-shadow:0 0 24px -4px rgba(201,52,60,.95);animation:bbcd-shake .5s ease-in-out both}
.bbcd-throne.is-dethroned .bbcd-king::after{content:'';position:absolute;left:-6px;right:-6px;top:50%;
  height:2px;background:#c9343c;transform:rotate(-20deg)}
@keyframes bbcd-shake{0%,100%{transform:none}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.bbcd-crownlbl{font-family:var(--font-mono,ui-monospace,monospace);font-size:8px;letter-spacing:1.3px;
  color:#e3b341;margin-top:5px}
.bbcd-throne.is-dethroned .bbcd-crownlbl{color:#c9343c}
.bbcd-legend{text-align:center;font-size:9px;letter-spacing:1.2px;color:#475569;margin-top:12px;
  position:relative;z-index:1}
@media(prefers-reduced-motion:reduce){.bbcd-spin,.bbcd-throne.is-dethroned .bbcd-king{animation:none}}
@media(max-width:520px){.bbcd-coinwrap{flex-direction:column}}
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

  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');
  const buyers = act.buyers || [];
  const declined = act.declined || [];
  // Walked up and could not make the price. A third state, and the one this
  // theme is really about — "KEPT IT" and "COULDN'T" look identical from the
  // sofa and mean opposite things about somebody's season.
  const short = act.short || [];
  // No seat was sold, so there was no game and no call. Distinct from a wrong
  // call, which the vault card below used to narrate over the top of it.
  const unplayed = !act.winner;

  const COIN = `<svg class="bbcd-coin" viewBox="0 0 160 150" role="img"
      aria-label="A coin turning in a room with no camera">
    <text class="bbcd-vault" x="80" y="18" text-anchor="middle">NO CAMERA IN HERE</text>
    <g class="bbcd-spin">
      <circle cx="80" cy="84" r="30" fill="rgba(148,163,184,.14)" stroke="#94a3b8" stroke-width="2.4"/>
      <circle cx="80" cy="84" r="22" fill="none" stroke="#64748b" stroke-width="1"/>
      <circle cx="80" cy="84" r="9" fill="rgba(148,163,184,.22)"/>
    </g>
    <text class="bbcd-vault" x="80" y="140" text-anchor="middle">${
  called ? 'CALLED &#183; NOT TOLD' : '&#160;'}</text>
  </svg>`;

  // Paying is PUBLIC and is the only thing about this twist the house can see,
  // so the counter is faces rather than a list — you can read who thought they
  // were in trouble at a glance, which is the read the house actually gets.
  const COUNTER = `<div class="bbcd-counter">${
  [...buyers.map(n => ({ n, tag: 'PAID', paid: true })),
    ...short.map(n => ({ n, tag: 'SHORT', paid: false })),
    ...declined.map(n => ({ n, tag: 'KEPT IT', paid: false }))]
    .map(({ n, tag, paid }) => `
      <div class="bbcd-buyer ${!paid ? 'is-out' : ''} ${called && act.winner && n === act.winner ? 'is-winner' : ''}"
        title="${esc(n)}">
        <div class="bbcd-face">${AV(n, 44)}</div>
        <div class="bbcd-nm">${esc(n)}</div>
        <div class="bbcd-paid">${tag}</div>
      </div>`).join('') || '<div class="bbcd-nm">nobody came to the counter</div>'}</div>`;

  // The crown, and whether the call took it. A dethroned Head of Household is
  // the entire point of the coin, so it is drawn happening to a face.
  const THRONE = act.hoh ? `<div class="bbcd-throne ${called && act.dethroned ? 'is-dethroned' : ''}">
      <div class="bbcd-king">${AV(act.hoh, 72)}</div>
      <div class="bbcd-crownlbl">${called && act.dethroned ? 'DETHRONED' : 'HEAD OF HOUSEHOLD'}</div>
    </div>` : '';

  const VAULTROOM = `<div class="bbcd-vaultroom">
    ${COUNTER}
    <div class="bbcd-coinwrap">${COIN}${THRONE}</div>
    <div class="bbcd-legend">${called
    ? 'the money was public · the call was not'
    : 'everybody saw who paid · nobody sees what happens next'}</div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'ledger') {
      if (unplayed) {
        return _card('THE PRICE WAS THE WHOLE GAME',
          `The buy-in was ${act.price}. ${short.length} ${short.length === 1 ? 'houseguest' : 'houseguests'}
           got as far as the table and not one of them could make it — so the most expensive thing this
           season sells was decided by what people did with their money in weeks nobody remembers.`, 'grey');
      }
      return _card('EVERYBODY SAW WHO PAID',
        `Buying in is a sentence with exactly one meaning, and ${(act.buyers || []).length} people said it
         out loud with money at ${act.price} a seat. Paying does not make you the one who called it — but it
         does tell the house precisely how safe you thought you were.`, 'gold');
    }
    if (step.kind === 'vault' && unplayed) {
      return _card('THE COIN IS NEVER TURNED',
        `No seat was sold, so there was no game and there was no call. The Head of Household keeps the week
         they already had, and nobody has to be suspected of anything.
         <br><br>Which is its own information. Everybody at that table just showed the house what they are
         holding, and the house does not forget a number like that.`,
        'grey', 'is-final', short.slice(0, 4));
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
    stage: VAULTROOM,
    cards: steps.map(card).join(''),
    firstLabel: 'The ledger',
  });
}
