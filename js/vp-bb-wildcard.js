// ══════════════════════════════════════════════════════════════════════
// vp-bb-wildcard.js — the hat, and the bill that comes out with the win
// ══════════════════════════════════════════════════════════════════════
//
// Built out of what this twist IS, which is two objects and nothing else: a hat
// that three names came out of, and an invoice with a price on it.
//
// Deliberately not the Safety Suite's screen. That one is a scoreboard, because
// its material is arithmetic across a whole season — who has an entry left. This
// twist has no arithmetic at all. It has a draw nobody chose and one decision
// made out loud, so the screen is a drawn card and a bill, and the only state
// worth showing is WHO IS PAYING — which is the thing that flips it from a
// safety card into a grievance.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const WC_CSS = `
.bbwc-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#f0abfc;text-shadow:0 0 18px rgba(240,171,252,.28);margin-bottom:4px}
.bbwc-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}

/* THE TABLE. Felt, low light, three cards face up and a docket beside them. */
.bbwc-table{position:relative;max-width:620px;margin:0 auto 20px;padding:20px 18px 16px;
  border-radius:12px;overflow:hidden;
  background:radial-gradient(120% 80% at 50% -10%,rgba(240,171,252,.09),rgba(10,6,14,.97) 62%);
  border:1px solid rgba(240,171,252,.20);box-shadow:inset 0 0 60px rgba(0,0,0,.75)}

/* the three drawn cards. They are dealt, so they arrive at an angle. */
.bbwc-hand{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;position:relative;z-index:1}
.bbwc-card{width:92px;text-align:center;padding:8px 6px 7px;border-radius:8px;
  background:linear-gradient(180deg,rgba(28,18,34,.96),rgba(14,9,18,.96));
  border:1px solid rgba(240,171,252,.34);box-shadow:0 6px 18px -8px rgba(0,0,0,.9)}
.bbwc-card:nth-child(1){transform:rotate(-3deg)}
.bbwc-card:nth-child(3){transform:rotate(3deg)}
.bbwc-card.is-winner{border-color:#f0abfc;box-shadow:0 0 0 2px rgba(240,171,252,.22),0 0 28px -6px rgba(240,171,252,.95)}
.bbwc-pip{font-family:var(--font-mono,ui-monospace,monospace);font-size:8px;letter-spacing:1.4px;
  color:#c084fc;text-align:left;margin:0 0 4px 2px}
.bbwc-face{position:relative;width:56px;height:56px;margin:0 auto;border-radius:5px;overflow:hidden;
  border:1px solid rgba(240,171,252,.42);background:#160d1c}
.bbwc-face img,.bbwc-face .bb-av,.bbwc-face .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbwc-nm{font-size:11px;color:#e6edf3;font-weight:600;margin-top:5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbwc-score{font-family:var(--font-mono,monospace);font-size:9px;letter-spacing:.9px;color:#8b949e;margin-top:2px}

/* THE BILL. A docket with a price on it and a line for who is paying — which
   is the whole twist, so it is the loudest thing on the screen. */
.bbwc-bill{max-width:340px;margin:18px auto 4px;padding:12px 14px 11px;border-radius:4px;
  background:repeating-linear-gradient(180deg,rgba(250,245,235,.96) 0 22px,rgba(244,238,226,.96) 22px 44px);
  color:#241a2e;position:relative;z-index:1;
  box-shadow:0 10px 26px -12px rgba(0,0,0,.95);border:1px solid rgba(0,0,0,.18)}
.bbwc-bill::after{content:'';position:absolute;left:0;right:0;bottom:-6px;height:7px;
  background:repeating-linear-gradient(90deg,transparent 0 8px,rgba(250,245,235,.96) 8px 16px)}
.bbwc-bh{font-family:var(--font-mono,ui-monospace,monospace);font-size:8px;letter-spacing:2px;
  color:#6b5a78;border-bottom:1px dashed rgba(0,0,0,.25);padding-bottom:5px;margin-bottom:7px}
.bbwc-item{font-size:12px;font-weight:700;line-height:1.35}
.bbwc-note{font-size:10px;color:#4a3a56;margin-top:4px;line-height:1.4}
.bbwc-payer{margin-top:8px;padding-top:6px;border-top:1px dashed rgba(0,0,0,.25);
  font-family:var(--font-mono,monospace);font-size:9px;letter-spacing:1.2px}
.bbwc-payer.is-house{color:#b91c1c}
.bbwc-payer.is-solo{color:#7c5e11}
.bbwc-stamp{position:absolute;right:8px;bottom:8px;transform:rotate(-11deg);
  font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:2px;font-weight:700;
  padding:2px 7px;border:2px solid currentColor;border-radius:3px;opacity:.88}
.bbwc-stamp.is-paid{color:#166534}
.bbwc-stamp.is-void{color:#9ca3af}

/* who is serving it, when the house is the one paying */
.bbwc-served{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:14px;position:relative;z-index:1}
.bbwc-sv{width:38px;text-align:center}
.bbwc-svf{width:34px;height:34px;margin:0 auto;border-radius:4px;overflow:hidden;
  border:1px solid rgba(248,113,113,.5);background:#1a0e10;filter:grayscale(.55)}
.bbwc-svf img,.bbwc-svf .bb-av,.bbwc-svf .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbwc-svn{font-size:8px;color:#8b949e;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbwc-legend{text-align:center;font-family:var(--font-mono,monospace);font-size:8px;letter-spacing:1.3px;
  color:#6b7280;margin-top:9px;position:relative;z-index:1}

@media(prefers-reduced-motion:reduce){.bbwc-card{transform:none!important;animation:none!important}}
`;

export function rpBuildBBWildcard(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'wc');
  const state = _init(stateKey);
  const beats = act.beats || [];
  // Draw and competition first, then the offer, then what was decided. The
  // decision card is last on purpose — it is the only thing anybody chose.
  const steps = [{ kind: 'draw' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'verdict' }];
  const total = steps.length;
  // The bill is only readable once the beats have played; before that the
  // screen must not say who won or what it cost.
  const settled = state.idx >= total - 1;

  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');
  const scores = act.scores || [];
  const played = state.idx >= 1;

  const HAND = `<div class="bbwc-hand">${(act.players || []).map((n, i) => {
    const sc = scores.find(s => s.name === n);
    return `<div class="bbwc-card ${settled && n === act.winner ? 'is-winner' : ''}" title="${esc(n)}">
      <div class="bbwc-pip">${String(i + 1).padStart(2, '0')}</div>
      <div class="bbwc-face">${AV(n, 56)}</div>
      <div class="bbwc-nm">${esc(n)}</div>
      <div class="bbwc-score">${played && sc ? sc.score.toFixed(1) : '— — —'}</div>
    </div>`;
  }).join('') || '<div class="bbwc-nm">the hat came up empty</div>'}</div>`;

  const BILL = `<div class="bbwc-bill">
    <div class="bbwc-bh">SAFETY &#183; ONE WEEK &#183; PRICE ON DELIVERY</div>
    <div class="bbwc-item">${settled ? esc(act.punishmentLabel || 'a punishment') : 'PRICE WITHHELD'}</div>
    ${settled && act.punishmentBlurb ? `<div class="bbwc-note">${esc(act.punishmentBlurb)}</div>` : ''}
    <div class="bbwc-payer ${act.houseWide ? 'is-house' : 'is-solo'}">${settled
    ? (act.houseWide ? 'BILL TO: THE HOUSE' : `BILL TO: ${esc(act.winner || '')}`)
    : 'BILL TO: &#183; &#183; &#183;'}</div>
    ${settled ? `<div class="bbwc-stamp ${act.accepted ? 'is-paid' : 'is-void'}">${
  act.accepted ? 'ACCEPTED' : 'REFUSED'}</div>` : ''}
  </div>`;

  // Only drawn when the house is the one paying, because that is the only time
  // this twist produces a list of victims — and the list IS the grievance.
  const SERVED = (settled && act.accepted && act.houseWide && (act.served || []).length)
    ? `<div class="bbwc-served">${act.served.map(n => `
        <div class="bbwc-sv" title="${esc(n)}">
          <div class="bbwc-svf">${AV(n, 34)}</div>
          <div class="bbwc-svn">${esc(n)}</div>
        </div>`).join('')}</div>
      <div class="bbwc-legend">EVERY ONE OF THEM SERVES IT &#183; EVERY ONE OF THEM VOTES ON THURSDAY</div>`
    : `<div class="bbwc-legend">${settled
      ? 'NOBODY CHOSE TO PLAY THIS &#183; ONE PERSON CHOSE WHAT IT COST'
      : 'THREE NAMES OUT OF A HAT &#183; NOBODY VOLUNTEERED'}</div>`;

  const TABLE = `<div class="bbwc-table">${HAND}${BILL}${SERVED}</div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'draw') {
      return _card('NOBODY PUT THEIR HAND UP',
        `Three names come out of a hat before nominations. The Head of Household is not in it, and
         nobody else was asked whether they wanted to be — which is the whole difference between this
         and every other safety twist in this house.
         <br><br>Winning does not make you safe. It earns you the right to be asked, out loud, whether
         you would like to be.`, 'gold');
    }
    if (step.kind === 'verdict') {
      if (!act.accepted) {
        return _card('AND THEY SAID NO',
          `${esc(act.winner || 'The winner')} turned down safety rather than pay
           ${esc(act.punishmentLabel || 'the price')}.
           <br><br>It costs nothing, and it is not free. Refusing in front of the whole house is a claim
           — that the votes are already there, that the block holds no fear — and this room does not let
           a claim like that go untested. Thursday is the test.`,
          'grey', 'is-final', [act.winner]);
      }
      if (act.houseWide) {
        return _card('AND THE HOUSE PICKED UP THE BILL',
          `${esc(act.winner || 'The winner')} is safe for the week, and did not pay for it.
           ${(act.served || []).length} houseguests are serving
           ${esc(act.punishmentLabel || 'the punishment')} instead.
           <br><br>Nothing here was hidden. They watched the price be read out, watched one person accept
           it on their behalf, and every one of them still has a vote. This is the rare card that makes
           somebody safe and worse off in the same breath.`,
          'red', 'is-final', [act.winner, ...(act.served || []).slice(0, 3)]);
      }
      return _card('AND THEY PAID FOR IT THEMSELVES',
        `${esc(act.winner || 'The winner')} takes the safety and takes
         ${esc(act.punishmentLabel || 'the punishment')} with it.
         <br><br>Safe, and wearing the receipt all week where everybody can read it. It is the least
         threatening thing a houseguest can do — which, in a house that evicts threats, is not the
         worst week to have.`,
        'gold', 'is-final', [act.winner]);
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbwc', css: WC_CSS,
    title: 'THE WILDCARD',
    sub: 'Drawn, not chosen. Safety, not free.',
    stage: TABLE,
    cards: steps.map(card).join(''),
    firstLabel: 'The draw',
  });
}
