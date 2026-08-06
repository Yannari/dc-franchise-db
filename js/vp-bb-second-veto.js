// ══════════════════════════════════════════════════════════════════════
// vp-bb-second-veto.js — the medallion nobody counted on
// ══════════════════════════════════════════════════════════════════════
//
// The veto ceremony has already happened. The block settled, the room got up,
// and then it does not stay settled — because there was a second medallion in
// the house and only one person knew what it could do.
//
// Two versions of the same screen, and the difference is the whole point. The
// Double is PUBLIC: two medallions came out of one competition, everybody
// watched the runner-up take the other, and everybody knows exactly whose hand
// moved the block. The Secret is not: the block changes and the room is left
// looking at itself, so that version of the screen refuses to show a face at
// all and puts a redacted bar where the holder should be.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const SV_CSS = `
.bbsv{--sv-ink:#ece7dd;--sv-dim:#8d8577;--sv-line:#3b352c;--sv-gold:#c9a227;--sv-void:#15120e}
.bbsv-title{font-family:var(--font-display);font-size:clamp(24px,4.4vw,42px);letter-spacing:3px;text-align:center;color:var(--sv-ink);margin:0 0 2px;line-height:1}
.bbsv-sub{font-family:var(--font-mono);text-align:center;font-size:9px;letter-spacing:2.6px;color:var(--sv-dim);text-transform:uppercase;margin-bottom:16px}

.bbsv-case{position:relative;max-width:900px;margin:0 auto 20px;border:1px solid var(--sv-line);border-radius:3px;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 0%,#241f18 0%,#17130f 55%,#0d0b09 100%)}
.bbsv-band{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-bottom:1px solid var(--sv-line);
  background:rgba(201,162,39,.09);font-family:var(--font-mono);font-size:8.5px;letter-spacing:2.4px;color:#dcc687;text-transform:uppercase}
.bbsv-body{padding:16px 14px}

.bbsv-holder{display:flex;align-items:center;gap:11px;justify-content:center;margin-bottom:14px}
.bbsv-holder .bb-av{border:1px solid rgba(236,231,221,.22)}
.bbsv-who{font-family:var(--font-mono);font-size:11px;color:var(--sv-ink);letter-spacing:.8px}
.bbsv-who em{display:block;font-style:normal;font-size:7.5px;letter-spacing:1.5px;color:var(--sv-dim);text-transform:uppercase;margin-top:3px}
/* The secret version shows nobody, on purpose. */
.bbsv-redact{display:inline-block;min-width:132px;height:26px;background:repeating-linear-gradient(90deg,var(--sv-void) 0 9px,#221d16 9px 18px);
  border:1px solid var(--sv-line);vertical-align:middle}

.bbsv-swap{display:grid;grid-template-columns:1fr 34px 1fr;gap:9px;align-items:center;border:1px solid var(--sv-line);padding:11px;background:rgba(255,255,255,.02)}
@media(max-width:520px){.bbsv-swap{grid-template-columns:1fr}}
.bbsv-seat{display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid var(--sv-line)}
.bbsv-seat span{font-family:var(--font-mono);font-size:10px;color:var(--sv-ink)}
.bbsv-seat em{display:block;font-style:normal;font-size:7px;letter-spacing:1.4px;color:var(--sv-dim);text-transform:uppercase;margin-top:2px}
.bbsv-seat.off{border-color:#3f6b4a;background:rgba(73,209,138,.06)}
.bbsv-seat.on{border-color:#7a3129;background:rgba(224,85,60,.07)}
.bbsv-arrow{text-align:center;font-family:var(--font-mono);color:var(--sv-gold);font-size:15px}
.bbsv-none{font-family:var(--font-mono);font-size:10px;letter-spacing:1.4px;color:var(--sv-dim);text-transform:uppercase;text-align:center;padding:12px 0}
`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `second-veto` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBSecondVeto(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const avatar = deps.avatar;
  const stateKey = _key(ep, `sv${act.kind || ''}`);
  const state = _init(stateKey);

  const secret = !!act.anonymous;
  const beats = act.beats || [];
  const steps = [{ kind: 'exists' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'result' }];
  const total = steps.length;
  const resolved = state.idx >= total - 1;

  const holderBlock = secret
    ? `<span class="bbsv-redact" title="not disclosed"></span>
       <span class="bbsv-who">&mdash;<em>holder not disclosed</em></span>`
    : `${avatar(act.holder, 34)}
       <span class="bbsv-who">${esc(act.holder || '')}<em>holds the second medallion</em></span>`;

  const swap = !resolved
    ? '<div class="bbsv-none">the block has not finished being the block</div>'
    : (act.used
      ? `<div class="bbsv-swap">
          <div class="bbsv-seat off">${avatar(act.saved, 26)}
            <span>${esc(act.saved)}<em>comes down</em></span></div>
          <div class="bbsv-arrow">&#8594;</div>
          <div class="bbsv-seat on">${avatar(act.replacement, 26)}
            <span>${esc(act.replacement)}<em>goes up</em></span></div>
        </div>`
      : '<div class="bbsv-none">not used &middot; the block stands</div>');

  const STAGE = `<div class="bbsv-case">
    <div class="bbsv-band"><span>${secret ? 'Nobody competed for this one' : 'Two out of one competition'}</span>
      <span>Week ${ep.num}</span></div>
    <div class="bbsv-body">
      <div class="bbsv-holder">${holderBlock}</div>
      ${swap}
    </div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'exists') {
      return _card(secret ? 'NOBODY COMPETED FOR IT' : 'THERE WERE TWO',
        secret
          ? `A second medallion exists. It was not won, it was handed over, and the house was never told
             it was in the building.
             <br><br>If it gets used, the block changes and nobody is told whose hand did it — including
             the Head of Household, who built that block and does not own it any more.`
          : `The veto competition put two medallions in the room. The winner took one and the houseguest
             who came closest to beating them took the other.
             <br><br>Both can be used at the same ceremony, and each one used means another replacement.
             The Head of Household can lose their entire block in a single meeting to two people who never
             had to agree with each other about any of it.`,
        'gold', '', secret ? [] : [act.holder].filter(Boolean));
    }
    if (step.kind === 'beat') return _beatCard(step.b);
    if (!act.used) {
      return _card('LEFT IN THE BOX',
        secret
          ? `It is not used. The week ends with the block exactly as the ceremony left it, and with nobody
             in that house ever finding out how close it came to being something else.`
          : `${esc(act.holder || '')} does not use it. The block stands, and everybody now knows that
             somebody had the power to change it and chose not to — which is its own answer about where
             they stand.`,
        'grey', 'is-final', secret ? [] : [act.holder].filter(Boolean));
    }
    return _card(secret ? 'A HAND NOBODY SAW' : 'THE BLOCK CHANGES AGAIN',
      `${esc(act.saved)} comes off the block and ${esc(act.replacement)} goes up in their place.
       ${secret
    ? '<br><br>Nobody is told who did it. The Head of Household watches a block they built get rewritten '
      + 'by somebody in that room, and has to keep working with all of them anyway.'
    : `<br><br>The ceremony had already settled. It is not settled. ${esc(act.replacement)} was sitting on `
      + 'the sofa when this meeting started.'}`,
    secret ? 'red' : 'gold', 'is-final',
    [secret ? null : act.holder, act.saved, act.replacement].filter(Boolean));
  };

  return _shell({
    ep, stateKey, total, cls: 'bbsv', css: SV_CSS,
    title: secret ? 'THE SECRET VETO' : 'THE SECOND VETO',
    sub: secret ? 'One medallion · no competition · no name'
      : 'Two medallions · one competition · two replacements',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'Open the case',
  });
}
