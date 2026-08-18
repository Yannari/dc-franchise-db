// ══════════════════════════════════════════════════════════════════════
// vp-bb-nightmare.js — the wall, at three in the morning, going backwards
// ══════════════════════════════════════════════════════════════════════
//
// One object: the memory wall. Every other screen in this catalogue draws the
// room a twist happens in — a table, a noticeboard, a suite door — because
// those twists happen somewhere. This one happens TO something, and the thing
// it happens to is the wall, so the wall is the whole screen.
//
// The two voided photographs turn dark and slide out; the two new ones turn on
// in their place. Nothing else on the screen moves, because at three in the
// morning nothing else in that house is moving either.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const NM_CSS = `
.bbnm-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#a5b4fc;text-shadow:0 0 18px rgba(165,180,252,.28);margin-bottom:4px}
.bbnm-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}

/* THE WALL. Dark room, one light source, photographs in a grid. */
.bbnm-wall{position:relative;max-width:600px;margin:0 auto 20px;padding:24px 20px 18px;
  border-radius:10px;overflow:hidden;
  background:radial-gradient(110% 70% at 50% -12%,rgba(165,180,252,.10),rgba(4,5,12,.98) 62%);
  border:1px solid rgba(165,180,252,.18);box-shadow:inset 0 0 70px rgba(0,0,0,.85)}
.bbnm-clock{text-align:center;font-family:var(--font-mono,ui-monospace,monospace);font-size:9px;
  letter-spacing:3px;color:#6b7280;margin-bottom:14px}
.bbnm-grid{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;position:relative;z-index:1}
.bbnm-slot{width:78px;text-align:center}
.bbnm-frame{position:relative;width:64px;height:64px;margin:0 auto;border-radius:3px;overflow:hidden;
  border:1px solid rgba(165,180,252,.30);background:#080a14}
.bbnm-frame img,.bbnm-frame .bb-av,.bbnm-frame .rp-portrait{width:100%;height:100%;object-fit:cover}
.bbnm-nm{font-size:11px;color:#e6edf3;font-weight:600;margin-top:5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbnm-tag{font-family:var(--font-mono,monospace);font-size:7.5px;letter-spacing:1.2px;margin-top:2px}

/* voided: the light goes out of the photograph */
.bbnm-slot.is-void .bbnm-frame{filter:grayscale(1) brightness(.34);border-style:dashed;
  border-color:rgba(107,114,128,.5)}
.bbnm-slot.is-void .bbnm-nm{color:#6b7280;text-decoration:line-through;text-decoration-thickness:1.5px}
.bbnm-slot.is-void .bbnm-tag{color:#6b7280}
/* named: the photograph comes on, and it is the only lit thing here */
.bbnm-slot.is-new .bbnm-frame{border-color:#a5b4fc;
  box-shadow:0 0 0 2px rgba(165,180,252,.20),0 0 26px -5px rgba(165,180,252,.95);
  animation:bbnm-wake 3.4s ease-in-out infinite}
.bbnm-slot.is-new .bbnm-tag{color:#a5b4fc}
@keyframes bbnm-wake{0%,100%{box-shadow:0 0 0 2px rgba(165,180,252,.16),0 0 18px -6px rgba(165,180,252,.7)}
  50%{box-shadow:0 0 0 3px rgba(165,180,252,.28),0 0 34px 0 rgba(165,180,252,1)}}

.bbnm-arrow{display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0 4px;
  font-family:var(--font-mono,monospace);font-size:8px;letter-spacing:2px;color:#6b7280;
  position:relative;z-index:1}
.bbnm-arrow span{height:1px;flex:0 0 54px;background:linear-gradient(90deg,transparent,#6b7280,transparent)}
.bbnm-legend{text-align:center;font-family:var(--font-mono,monospace);font-size:8px;letter-spacing:1.3px;
  color:#6b7280;margin-top:12px;position:relative;z-index:1}
@media(prefers-reduced-motion:reduce){.bbnm-slot.is-new .bbnm-frame{animation:none}}
`;

export function rpBuildBBNightmare(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const stateKey = _key(ep, 'nm');
  const state = _init(stateKey);
  const beats = act.beats || [];
  const steps = [{ kind: 'wake' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'verdict' }];
  const total = steps.length;
  // The wall has not changed until the beats have played it.
  const turned = state.idx >= 2;

  const AV = (n, px) => (typeof deps.avatar === 'function' ? deps.avatar(n, px) : '');
  const slot = (n, cls, tag) => `<div class="bbnm-slot ${cls}" title="${esc(n)}">
      <div class="bbnm-frame">${AV(n, 64)}</div>
      <div class="bbnm-nm">${esc(n)}</div>
      <div class="bbnm-tag">${tag}</div>
    </div>`;

  const WALL = `<div class="bbnm-wall">
    <div class="bbnm-clock">03:10 &#183; HOUSE LIGHTS ON</div>
    <div class="bbnm-grid">${(act.voided || [])
    .map(n => slot(n, turned ? 'is-void' : '', turned ? 'TAKEN DOWN' : 'NOMINATED')).join('')}</div>
    <div class="bbnm-arrow"><span></span>${turned ? 'AND AGAIN' : 'THE CEREMONY STANDS'}<span></span></div>
    <div class="bbnm-grid">${turned
    ? (act.nominees || []).map(n => slot(n, 'is-new', 'NOMINATED')).join('')
    : '<div class="bbnm-nm" style="color:#6b7280">— —</div>'}</div>
    <div class="bbnm-legend">${turned
    ? 'THE BLOCK CHANGED &#183; NOBODY WILL SAY WHOSE HAND DID IT'
    : 'EVERYBODY IS AWAKE &#183; NOBODY HAS BEEN TOLD WHY'}</div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'wake') {
      return _card('THE CEREMONY WAS OVER',
        `The nominations happened hours ago. The keys turned, the photographs changed, and the house
         went to bed knowing exactly what this week looked like.
         <br><br>It is ten past three in the morning and every light in the building has just come on.`,
        'gold');
    }
    if (step.kind === 'verdict') {
      return _card('AND SOMEBODY ELSE PAYS FOR IT',
        `${esc((act.voided || []).join(' and '))} are off the block and did nothing to get there.
         ${esc((act.nominees || []).join(' and '))} are on it, and did nothing to get there either.
         <br><br>${esc(act.hoh || 'The Head of Household')} named both pairs and chose neither. The
         first two were a plan; the second two were whoever was left at three in the morning with no
         time to think — and ${esc(act.hoh || 'the Head of Household')} is the only person in this
         house whose name is attached to any of it. That is what the power actually buys: not safety,
         but somebody else's credibility.`,
        'red', 'is-final', [act.hoh, ...(act.nominees || [])]);
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbnm', css: NM_CSS,
    title: 'THE NIGHTMARE POWER',
    sub: 'The ceremony is over. And then it is not.',
    stage: WALL,
    cards: steps.map(card).join(''),
    firstLabel: 'The lights',
  });
}
