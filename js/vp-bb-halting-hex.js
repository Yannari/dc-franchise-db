// ══════════════════════════════════════════════════════════════════════
// vp-bb-halting-hex.js — the night that stops with the door open
// ══════════════════════════════════════════════════════════════════════
//
// The Halting Hex cancels an entire eviction, and the viewing party drew
// nothing for it. Every other twist in the format has a screen; this one
// reached both transcripts and never reached a viewer, which is the worst
// possible one to lose — it is the single biggest thing a week can do.
//
// The screen is built out of what the twist IS, which is a count that stops.
// The votes were read. They are all still true. None of them do anything any
// more, and everybody in that room now knows exactly how everybody else voted
// for no result whatsoever — the votes stand and the outcome does not, and
// that gap is the whole scene.
//
// So the stage is a BALLOT UNDER GLASS: the tally frozen mid-read with a
// stopped clock over it, the two chairs emptying underneath, and the holder
// named last. Cold, arrested, blue-white — nothing in this format looks like
// this, because nothing else in this format stops.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const HX_CSS = `
.bbhx{--hx-ice:#dbe7f2;--hx-dim:#7d8ea3;--hx-line:#2c3a4c;--hx-cold:#5aa6d8;--hx-gold:#d9b45e}
.bbhx-title{font-family:var(--font-display);font-size:clamp(26px,4.8vw,46px);letter-spacing:3px;text-align:center;color:var(--hx-ice);margin:0 0 2px;line-height:1}
.bbhx-sub{font-family:var(--font-mono);text-align:center;font-size:9px;letter-spacing:2.6px;color:var(--hx-dim);text-transform:uppercase;margin-bottom:16px}

.bbhx-glass{position:relative;max-width:940px;margin:0 auto 20px;border:1px solid var(--hx-line);border-radius:3px;overflow:hidden;
  background:linear-gradient(180deg,#101823 0%,#0c131c 55%,#070b11 100%)}
/* The freeze: a pale sheet sitting over the whole ballot. */
.bbhx-glass::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(160deg,rgba(90,166,216,.10) 0%,transparent 38%,transparent 62%,rgba(219,231,242,.06) 100%)}
.bbhx-band{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;border-bottom:1px solid var(--hx-line);
  background:rgba(90,166,216,.08);font-family:var(--font-mono);font-size:8.5px;letter-spacing:2.4px;color:#a9c6de;text-transform:uppercase}
/* Bottom padding is the stamp's lane. It is absolutely positioned bottom-right
   and will sit straight on top of the chairs row without somewhere to live. */
.bbhx-body{position:relative;padding:14px 14px 60px}

.bbhx-grid{display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:center}
@media(max-width:560px){.bbhx-grid{grid-template-columns:1fr}}

/* A clock with its hands stopped. SVG, so it is a clock and not four divs. */
.bbhx-clock{width:110px;height:110px;margin:0 auto;display:block}
.bbhx-clock .face{fill:rgba(8,13,20,.9);stroke:var(--hx-line);stroke-width:2}
.bbhx-clock .tick{stroke:var(--hx-dim);stroke-width:1.5;opacity:.55}
.bbhx-clock .hand{stroke:var(--hx-ice);stroke-width:2.5;stroke-linecap:round}
.bbhx-clock .hand.min{stroke:var(--hx-cold)}
.bbhx-clock .pin{fill:var(--hx-gold)}
.bbhx-clock .ring{fill:none;stroke:var(--hx-cold);stroke-width:1;opacity:.35}
@media(prefers-reduced-motion:no-preference){
  .bbhx-clock .ring{animation:bbhx-pulse 3.4s ease-out infinite}
  @keyframes bbhx-pulse{0%{r:34;opacity:.45}100%{r:52;opacity:0}}
}

.bbhx-tally{border:1px solid var(--hx-line);border-left:3px solid var(--hx-cold);padding:10px 12px;background:rgba(90,166,216,.05)}
.bbhx-tally h4{margin:0 0 6px;font-family:var(--font-mono);font-size:8.5px;letter-spacing:2.2px;color:var(--hx-dim);text-transform:uppercase;font-weight:600}
.bbhx-tally p{margin:0;font-size:12px;line-height:1.6;color:#c2d2e2}
.bbhx-tally b{color:var(--hx-ice)}

.bbhx-chairs{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.bbhx-chair{display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px dashed var(--hx-line);border-radius:2px;background:rgba(255,255,255,.02)}
.bbhx-chair .bb-av{border:1px solid rgba(219,231,242,.18);filter:grayscale(.5)}
.bbhx-chair span{font-family:var(--font-mono);font-size:10px;color:var(--hx-ice);letter-spacing:.6px}
.bbhx-chair em{font-style:normal;font-family:var(--font-mono);font-size:7.5px;letter-spacing:1.3px;color:var(--hx-dim);text-transform:uppercase;display:block;margin-top:2px}
.bbhx-chair.is-holder{border-style:solid;border-color:#7a672f;background:rgba(217,180,94,.09)}
.bbhx-chair.is-holder span{color:var(--hx-gold)}

.bbhx-stamp{position:absolute;right:14px;bottom:10px;font-family:var(--font-display);font-size:clamp(18px,3.6vw,30px);letter-spacing:3px;
  color:var(--hx-cold);border:3px solid currentColor;padding:2px 12px;transform:rotate(-7deg);opacity:.9;pointer-events:none}
@media(prefers-reduced-motion:reduce){.bbhx-stamp{transform:none}}
`;

const CLOCK = `<svg class="bbhx-clock" viewBox="0 0 100 100" role="img" aria-label="A stopped clock">
  <circle class="ring" cx="50" cy="50" r="34"></circle>
  <circle class="face" cx="50" cy="50" r="32"></circle>
  <line class="tick" x1="50" y1="20" x2="50" y2="25"></line>
  <line class="tick" x1="80" y1="50" x2="75" y2="50"></line>
  <line class="tick" x1="50" y1="80" x2="50" y2="75"></line>
  <line class="tick" x1="20" y1="50" x2="25" y2="50"></line>
  <line class="hand" x1="50" y1="50" x2="50" y2="32"></line>
  <line class="hand min" x1="50" y1="50" x2="66" y2="58"></line>
  <circle class="pin" cx="50" cy="50" r="2.6"></circle>
</svg>`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `halting-hex` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBHaltingHex(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const avatar = deps.avatar;
  const stateKey = _key(ep, 'hx');
  const state = _init(stateKey);

  const beats = act.beats || [];
  const steps = [{ kind: 'read' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'after' }];
  const total = steps.length;
  const resolved = state.idx >= total - 1;

  const noms = (act.nominees || []).filter(Boolean);
  // On a self-save the holder IS one of the nominees, so a naive "chairs plus
  // the holder" row printed them twice — once coming off the block and once
  // as the person who stopped the night. The chair is upgraded in place
  // instead, and the separate holder chair only appears when the person who
  // spent it was never sitting there.
  const holderNote = act.selfSave ? 'saved themselves' : `spent it on ${esc(act.spared || '')}`;
  const chairs = noms.map(n => (resolved && n === act.holder
    ? `<div class="bbhx-chair is-holder">${avatar(n, 28)}
        <span>${esc(n)}<em>${holderNote}</em></span></div>`
    : `<div class="bbhx-chair">${avatar(n, 28)}
        <span>${esc(n)}<em>off the block, by default</em></span></div>`)).join('');
  const holderChair = act.holder && !noms.includes(act.holder)
    ? `<div class="bbhx-chair is-holder">${avatar(act.holder, 28)}
        <span>${esc(act.holder)}<em>${holderNote}</em></span></div>`
    : '';

  const STAGE = `<div class="bbhx-glass">
    <div class="bbhx-band"><span>Eviction night &middot; the count is halted</span>
      <span>Week ${ep.num}</span></div>
    <div class="bbhx-body">
      <div class="bbhx-grid">
        ${CLOCK}
        <div class="bbhx-tally">
          <h4>What the room is looking at</h4>
          <p>The vote was read out and <b>${esc(act.spared || '')}</b> was leaving.
          ${act.selfSave
    ? 'Then the person it was read against did not stand up.'
    : `Then <b>${esc(act.holder || '')}</b> stopped the night for somebody else.`}
          <br><br>Every ballot cast is still exactly what it was. None of them
          decides anything any more — which is a problem for the people who
          cast them, and not for the block.</p>
        </div>
      </div>
      <div class="bbhx-chairs">${chairs}${resolved ? holderChair : ''}</div>
      ${resolved ? '<div class="bbhx-stamp">NO EVICTION</div>' : ''}
    </div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'read') {
      return _card('THE VOTE IS READ',
        `The house has voted, the count is in, and the name is about to be said out loud for the
         last time. Everybody in that room has already done the arithmetic on what happens next.
         <br><br>Nobody in it knows there is a power still live in the building.`,
        'grey', '', noms);
    }
    if (step.kind === 'beat') return _beatCard(step.b);
    return _card(act.selfSave ? 'SAVED THEMSELVES' : 'SPENT ON SOMEBODY ELSE',
      `${act.selfSave
    ? `${esc(act.holder || '')} walks out of eviction night still playing, having said nothing to anybody
         about holding it until the only second it was worth anything.`
    : `${esc(act.holder || '')} has just told this entire house two things at once: that a power existed,
         and that ${esc(act.spared || '')} was worth burning it on. The second is the one people will
         remember, and it will be read as an alliance whether or not it was one.`}
       <br><br>The Hex is spent. The same houseguests can go straight back up next week, and the week
       everybody just spent campaigning counts for nothing at all.`,
    'gold', 'is-final', [act.holder, act.spared].filter(Boolean));
  };

  return _shell({
    ep, stateKey, total, cls: 'bbhx', css: HX_CSS,
    title: 'THE HALTING HEX',
    sub: 'The votes stand · the result does not · nobody goes home',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'Read the vote',
  });
}
