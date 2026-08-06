// ══════════════════════════════════════════════════════════════════════
// vp-bb-veto-draw.js — the chips go back in the bag
// ══════════════════════════════════════════════════════════════════════
//
// Every other veto screen in this project is a ceremony: people sitting in a
// room while somebody stands up. This one is deliberately not, because the
// moment is not a ceremony — it happens on the floor, around a bag, before
// anybody has won anything, and its whole subject is a physical object with
// names in it.
//
// So the screen is THE BAG AND THE TABLE. Three things and nothing else:
//
//   the plates    the Head of Household and the nominees, screwed to the top of
//                 the board. They play by right. They are drawn as fixed brass
//                 nameplates precisely because nothing on this screen can move
//                 them, and the eye needs to learn that before the chips move.
//   the chips     round, felt, name side up. A chip that loses its seat turns
//                 face-down and greys; a chip that arrives drops in gold. The
//                 whole twist is legible in one row without reading a word.
//   the bag       an actual drawstring sack, open when the draw is live.
//
// Themed off the subject rather than around it: green baize, brass, a canvas
// bag. Nothing borrowed from the second-veto room, which is a different night
// in a different place.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const VD_CSS = `
.bbvd{--vd-felt:#1b3a2a;--vd-felt2:#0e2119;--vd-brass:#c9a94e;--vd-ink:#f0ead9;
  --vd-dim:#8c9a8f;--vd-dead:#4d5a50;--vd-gold:#e6bd57;--vd-red:#c05a45}
.bbvd-title{font-family:var(--font-display);font-size:clamp(24px,4.4vw,42px);letter-spacing:3px;text-align:center;color:var(--vd-ink);margin:0 0 2px;line-height:1}
.bbvd-sub{font-family:var(--font-mono);text-align:center;font-size:9px;letter-spacing:2.8px;color:var(--vd-dim);text-transform:uppercase;margin-bottom:16px}

/* ── the table ── */
.bbvd-table{position:relative;max-width:940px;margin:0 auto 20px;border:1px solid #2f4c3b;border-radius:5px;
  padding:14px 14px 18px;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 0%,var(--vd-felt) 0%,var(--vd-felt2) 100%)}
/* Baize: a fine cross-weave, not a flat fill. */
.bbvd-table::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.35;
  background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.03) 0 1px,transparent 1px 3px),
    repeating-linear-gradient(-45deg,rgba(0,0,0,.05) 0 1px,transparent 1px 3px)}
.bbvd-band{display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:8.5px;
  letter-spacing:2.4px;color:#cbb26a;text-transform:uppercase;margin-bottom:12px;position:relative;z-index:2}

/* ── by right: brass plates that never move ── */
.bbvd-plates{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:6px;position:relative;z-index:2}
.bbvd-plate{display:flex;align-items:center;gap:7px;padding:5px 12px;border-radius:2px;
  background:linear-gradient(180deg,#b99a45,#8a7031);border:1px solid #d9c07a;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 2px 5px rgba(0,0,0,.45)}
.bbvd-plate span{font-family:var(--font-mono);font-size:10px;letter-spacing:.8px;color:#20180a;font-weight:700}
/* display:block, or the role runs straight on from the name and the plate
   reads "AxelHEAD OF HOUSEHOLD". Found by rendering it. */
.bbvd-plate em{display:block;font-style:normal;font-size:7px;letter-spacing:1.3px;color:#4a3a12;text-transform:uppercase;margin-top:1px}
.bbvd-plate span{line-height:1.15}
.bbvd-plate .bb-av{border:1px solid #6b551d}
.bbvd-rule{text-align:center;font-family:var(--font-mono);font-size:7.5px;letter-spacing:2px;
  color:var(--vd-dim);text-transform:uppercase;margin:0 0 16px;position:relative;z-index:2}

/* ── the chips ── */
.bbvd-felt{display:flex;align-items:flex-end;gap:16px;justify-content:center;position:relative;z-index:2}
.bbvd-chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:74px}
.bbvd-chip{width:74px;display:flex;flex-direction:column;align-items:center;gap:5px;
  transition:opacity .5s ease,transform .5s ease}
.bbvd-disc{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;
  background:radial-gradient(circle at 34% 30%,#f2e9d2,#cdbf9d);
  border:3px dashed #7a6a44;box-shadow:0 4px 9px rgba(0,0,0,.5);
  font-family:var(--font-mono);font-size:15px;font-weight:700;color:#3a2f14}
.bbvd-chip b{font-family:var(--font-mono);font-size:9px;font-weight:400;letter-spacing:.5px;color:var(--vd-ink);text-align:center;line-height:1.15}
.bbvd-chip em{font-style:normal;font-size:6.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--vd-dim)}
/* Face-down: the chip is still on the table, it just is not a seat any more. */
.bbvd-chip.is-out .bbvd-disc{background:repeating-linear-gradient(45deg,#3b4a3f 0 5px,#334137 5px 10px);
  border-color:#2b3a30;color:transparent}
.bbvd-chip.is-out b{color:var(--vd-dead);text-decoration:line-through}
.bbvd-chip.is-out em{color:var(--vd-red)}
.bbvd-chip.is-out{opacity:.72;transform:translateY(6px)}
.bbvd-chip.is-in .bbvd-disc{background:radial-gradient(circle at 34% 30%,#ffe9a8,#d8ab3c);border-color:var(--vd-gold);border-style:solid;color:#3a2a05}
.bbvd-chip.is-in b{color:var(--vd-gold)}
.bbvd-chip.is-in em{color:var(--vd-gold)}
@media(prefers-reduced-motion:no-preference){
  .bbvd-chip.is-in{animation:bbvd-drop .6s cubic-bezier(.2,1.5,.4,1) both}
  @keyframes bbvd-drop{from{transform:translateY(-22px) rotate(-14deg);opacity:0}to{transform:none;opacity:1}}
}

/* ── the bag ── */
.bbvd-bag{width:96px;flex:0 0 auto;text-align:center}
.bbvd-bag svg{width:96px;height:auto;display:block}
.bbvd-bag span{display:block;font-family:var(--font-mono);font-size:7px;letter-spacing:1.8px;
  color:var(--vd-dim);text-transform:uppercase;margin-top:4px}
.bbvd-bag .mouth{transition:transform .6s ease;transform-origin:50% 34%}
.bbvd-table.is-open .bbvd-bag .mouth{transform:scaleY(1.35)}

.bbvd-same{margin-top:14px;text-align:center;font-family:var(--font-mono);font-size:9.5px;
  letter-spacing:1.6px;color:var(--vd-dim);text-transform:uppercase;position:relative;z-index:2}
`;

const BAG = `<svg viewBox="0 0 100 110" role="img" aria-label="The bag of chips">
  <path class="mouth" d="M28 34 Q50 24 72 34 L70 42 Q50 34 30 42 Z" fill="#6b5b3c" stroke="#4a3d26" stroke-width="1.4"/>
  <path d="M30 40 Q22 74 34 96 Q50 106 66 96 Q78 74 70 40 Q50 32 30 40 Z"
        fill="#8a7550" stroke="#4a3d26" stroke-width="1.6"/>
  <path d="M30 40 Q22 74 34 96" fill="none" stroke="#6b5b3c" stroke-width="1"/>
  <path d="M24 38 Q50 30 76 38" fill="none" stroke="#c9a94e" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="24" cy="38" r="2.6" fill="#c9a94e"/><circle cx="76" cy="38" r="2.6" fill="#c9a94e"/>
</svg>`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `veto-draw-twist` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBVetoDrawTwist(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const avatar = deps.avatar;
  const stateKey = _key(ep, `vd${act.kind || ''}`);
  const state = _init(stateKey);

  const redraw = act.kind === 'redraw';
  const beats = act.beats || [];
  // No scene-setting card of its own. The engine's first beat already states
  // the rule — six play, three by right and three by luck — because the text
  // transcript has no cards and needs it there; a screen card saying the same
  // thing put the identical paragraph on the page twice in a row.
  const steps = [...beats.map(b => ({ kind: 'beat', b })), { kind: 'field' }];
  const total = steps.length;
  // The chips move one step in, not at the end: the viewer watches the table
  // change rather than being shown the answer and then told the story.
  const moved = state.idx >= 1;

  const plates = [act.hoh, ...(act.nominees || [])].filter(Boolean).map((n, i) =>
    `<div class="bbvd-plate">${avatar(n, 22)}
      <span>${esc(n)}<em>${i === 0 ? 'head of household' : 'nominee'}</em></span></div>`).join('');

  // Everybody who was on the table before, plus everybody who arrived — one
  // row, so a seat changing hands is a single left-to-right read.
  const cast = [...new Set([...(act.before || []), ...(act.gained || [])])];
  const chips = cast.map(n => {
    const out = moved && (act.lost || []).includes(n);
    const into = moved && (act.gained || []).includes(n);
    const label = out ? 'back in the bag' : into ? 'drawn in' : 'still playing';
    return `<div class="bbvd-chip ${out ? 'is-out' : ''} ${into ? 'is-in' : ''}">
      <div class="bbvd-disc">${esc((n || '?').slice(0, 1))}</div>
      <b>${esc(n)}</b><em>${moved ? label : 'drawn'}</em></div>`;
  }).join('');

  const STAGE = `<div class="bbvd-table ${moved ? 'is-open' : ''}">
    <div class="bbvd-band">
      <span>${act.anonymous ? 'Somebody is holding a power over this draw'
    : `${esc(act.holder || '')} is holding a power over this draw`}</span>
      <span>Week ${ep.num}</span></div>
    <div class="bbvd-plates">${plates}</div>
    <div class="bbvd-rule">these three play by right — no twist has ever taken that away</div>
    <div class="bbvd-felt">
      <div class="bbvd-bag">${BAG}<span>${moved ? 'drawn' : 'sealed'}</span></div>
      <div class="bbvd-chips">${chips}</div>
    </div>
    ${moved && !act.changed
    ? '<div class="bbvd-same">the bag handed back every name it was given</div>' : ''}
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'beat') return _beatCard(step.b);
    if (!act.changed) {
      return _card('THE SAME THREE NAMES',
        `The bag gives back exactly what it was given. The competition is the competition it was five
         minutes ago, a power has been spent on nothing at all, and everybody standing in it has just
         watched how easily it could have gone the other way.`,
        'grey', 'is-final', act.after || []);
    }
    const gone = (act.lost || []).join(' and ');
    const came = (act.gained || []).join(' and ');
    return _card('WHO IS ACTUALLY PLAYING',
      `${esc([act.hoh, ...(act.nominees || []), ...(act.after || [])].filter(Boolean).join(', '))}.
       <br><br>${esc(gone)} ${(act.lost || []).length === 1 ? 'is' : 'are'} not on that list and
       ${(act.lost || []).length === 1 ? 'was' : 'were'} an hour ago.
       ${act.selfSeat
    ? `The seat went to the one person who could arrange for it to: ${esc(came)} is playing for a veto
       ${act.anonymous ? 'nobody can prove they arranged to play for' : 'they put themselves into'}.`
    : `${esc(came)} ${(act.gained || []).length === 1 ? 'is' : 'are'} on it instead.`}
       <br><br>${act.anonymous
    ? 'The house is never told whose hand did this, which leaves everybody in that room with the same '
      + 'question and no way to answer it.'
    : `${esc(act.holder || 'The holder')} did this in front of everybody, which means ${esc(gone)}
       ${(act.lost || []).length === 1 ? 'knows' : 'know'} exactly who to be angry with — and will be,
       for as long as it takes.`}`,
    'red', 'is-final', [...(act.lost || []), ...(act.gained || [])]);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbvd', css: VD_CSS,
    title: redraw ? 'THE REDRAW' : 'THE REPLACEMENT',
    sub: redraw ? 'Every chip · back in the bag' : 'One seat · changing hands',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'Open the bag',
  });
}
