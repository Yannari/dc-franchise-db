// ══════════════════════════════════════════════════════════════════════
// vp-bb-prize-exchange.js — the table, and who is holding what
// ══════════════════════════════════════════════════════════════════════
//
// Every other competition screen in this format is a scoreboard, because every
// other competition has a winner. This one does not: the veto is a parcel on a
// table and the drama is watching it move.
//
// So the screen is the table. A row of wrapped boxes across the top that open
// as the reveal walks through them, and underneath, a LEDGER of who is holding
// what right now — which is the only way to follow a trade, because a trade
// changes two rows at once and prose can only tell you about one of them.
//
// The pick order is drawn as an order, because it is the thing the competition
// actually awarded: last in line sees everything and can take any of it.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const PX_CSS = `
.bbpx{--px-ink:#f4ecd8;--px-dim:#9a8f75;--px-line:#4a3f2c;--px-gold:#e3b341;--px-red:#c9343c;--px-green:#5fa86b}
.bbpx-title{font-family:var(--font-display);font-size:clamp(26px,4.6vw,42px);letter-spacing:3px;text-align:center;color:var(--px-ink);text-shadow:0 0 24px rgba(227,179,65,.3);margin:0 0 2px;line-height:1}
.bbpx-sub{font-family:var(--font-mono);text-align:center;font-size:9.5px;letter-spacing:2.2px;color:var(--px-dim);text-transform:uppercase;margin-bottom:16px}

.bbpx-table{position:relative;max-width:1000px;margin:0 auto 20px;border:1px solid var(--px-line);border-radius:10px;padding:16px 14px 14px;overflow:hidden;background:radial-gradient(120% 100% at 50% 0%,#2a2117 0%,#1a1410 55%,#0f0b08 100%)}
.bbpx-table::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,rgba(255,255,255,.02) 0 2px,transparent 2px 6px)}

.bbpx-boxes{position:relative;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px}
.bbpx-box{width:62px;text-align:center}
.bbpx-lid{position:relative;height:44px;border-radius:4px;border:1px solid var(--px-line);background:linear-gradient(180deg,#3a2e20,#241c14);display:flex;align-items:center;justify-content:center}
.bbpx-lid::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:6px;transform:translateX(-50%);background:rgba(227,179,65,.28)}
.bbpx-lid::after{content:"";position:absolute;top:50%;left:0;right:0;height:6px;transform:translateY(-50%);background:rgba(227,179,65,.28)}
.bbpx-box.is-open .bbpx-lid{background:linear-gradient(180deg,#1c1610,#141009);border-style:dashed}
.bbpx-box.is-open .bbpx-lid::before,.bbpx-box.is-open .bbpx-lid::after{opacity:0}
.bbpx-box.is-veto .bbpx-lid{border-color:var(--px-gold);box-shadow:0 0 16px rgba(227,179,65,.35)}
.bbpx-box.is-punishment .bbpx-lid{border-color:var(--px-red)}
.bbpx-no{position:relative;font-family:var(--font-mono);font-size:11px;color:var(--px-dim)}
.bbpx-what{font-family:var(--font-mono);font-size:7.5px;letter-spacing:.6px;line-height:1.25;color:var(--px-ink);margin-top:3px;min-height:19px}
.bbpx-box.is-veto .bbpx-what{color:var(--px-gold)}
.bbpx-box.is-punishment .bbpx-what{color:var(--px-red)}

.bbpx-order{position:relative;font-family:var(--font-mono);font-size:9px;letter-spacing:1.6px;color:var(--px-dim);text-transform:uppercase;text-align:center;margin-bottom:10px}
.bbpx-order b{color:var(--px-ink);font-weight:400}

.bbpx-ledger{position:relative;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:5px}
.bbpx-hold{display:flex;justify-content:space-between;gap:8px;align-items:center;font-family:var(--font-mono);font-size:10px;padding:5px 8px;border:1px solid var(--px-line);border-radius:3px;background:rgba(255,255,255,.02);color:var(--px-dim)}
.bbpx-hold b{color:var(--px-ink);font-weight:400}
.bbpx-hold.is-veto{border-color:var(--px-gold);background:rgba(227,179,65,.09);color:var(--px-gold)}
.bbpx-hold.is-veto b{color:var(--px-gold)}
.bbpx-hold.is-punishment{border-color:rgba(201,52,60,.45);color:#e08a90}
.bbpx-hold.is-punishment b{color:#e08a90}
.bbpx-hold.is-pending{opacity:.3}
@media(prefers-reduced-motion:reduce){.bbpx-box{transition:none}}
`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `prize-exchange` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBPrizeExchange(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'px');
  const state = _init(stateKey);

  const beats = act.beats || [];
  const steps = [{ kind: 'rules' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'final' }];
  const total = steps.length;
  const done = state.idx >= total - 1;

  // Which boxes the viewer has watched come off the table. Every beat that
  // opens or moves one names it, so the count of revealed beats is the state.
  const revealedBeats = Math.max(0, Math.min(beats.length, state.idx));
  const seen = new Set();
  for (let i = 0; i < revealedBeats; i++) {
    for (const h of act.held || []) {
      if ((beats[i].players || []).includes(h.name)) seen.add(h.boxNo);
    }
  }

  const boxes = [...(act.held || [])].sort((a, b) => (a.boxNo || 0) - (b.boxNo || 0));
  const boxRow = boxes.map(h => {
    const open = done || seen.has(h.boxNo);
    const kind = open ? h.kind : '';
    return `<div class="bbpx-box ${open ? 'is-open' : ''} ${kind ? `is-${kind}` : ''}">
      <div class="bbpx-lid"><span class="bbpx-no">${open ? '' : h.boxNo}</span></div>
      <div class="bbpx-what">${open ? esc(h.item) : '&nbsp;'}</div>
    </div>`;
  }).join('');

  const ledger = (act.held || []).map(h => {
    const open = done || seen.has(h.boxNo);
    return `<div class="bbpx-hold ${open ? `is-${h.kind}` : 'is-pending'}">
      <b>${esc(h.name)}</b><span>${open ? esc(h.item) : '&mdash;'}</span></div>`;
  }).join('');

  const order = (act.order || []);
  const STAGE = `<div class="bbpx-table">
    <div class="bbpx-order">Picks in order &mdash; <b>${esc(order[0] || '')}</b> first, blind
      &nbsp;&rarr;&nbsp; <b>${esc(order[order.length - 1] || '')}</b> last, with the table open</div>
    <div class="bbpx-boxes">${boxRow}</div>
    <div class="bbpx-ledger">${ledger}</div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'rules') {
      return _card('THE VETO IS ONE OF THE BOXES',
        `The competition did not award anything. It decided the order.
         <br><br>Everybody opens a box: the Power of Veto is in one of them, and the rest hold cash, a
         holiday, a call home, confetti, and punishments nobody wants. After opening, a houseguest may
         trade what they got for anything already on the table — so finishing last in the competition
         means picking blind, and winning it means picking last, when every box is open and all of it
         is available.`, 'gold', '', [order[order.length - 1]]);
    }
    if (step.kind === 'beat') return _beatCard(step.b);

    const soldOut = (act.steals || []).find(s => s.gaveKind === 'veto');
    return _card('WHAT EVERYBODY WALKED AWAY WITH',
      `<b>${esc(act.vetoHolder)}</b> is holding the Power of Veto when it stops moving.
       ${(act.punished || []).length
    ? `<br><br>Walking away worse off: ${esc((act.punished || [])
      .map(p => `${p.name} in ${p.punishment}`).join(', '))}. Those are not jokes — a costume comes
       off every pitch they make until it comes off them.` : ''}
       ${soldOut
    ? `<br><br>And ${esc(soldOut.thief)} handed the veto away for ${esc(soldOut.gave)}, which is the
       trade this competition exists to produce and the one nobody ever lives down.` : ''}`,
      'gold', 'is-final', [act.vetoHolder]);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbpx', css: PX_CSS,
    title: 'PRIZES AND PUNISHMENTS',
    sub: 'The competition decided who picks first · not who wins',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'The rules',
  });
}
