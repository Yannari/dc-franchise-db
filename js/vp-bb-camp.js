// ══════════════════════════════════════════════════════════════════════
// vp-bb-camp.js — the room they are not allowed to leave
// ══════════════════════════════════════════════════════════════════════
//
// Two screens for the two halves of Camp Comeback, and they are deliberately
// opposite in temperature.
//
// The ARRIVAL is claustrophobic: a camp room drawn from the inside, a bad bed,
// a small television showing a competition happening somewhere the camper
// cannot go, and the beds filling up one per eviction. The house is visible
// only as a glow under the door.
//
// The DOOR is the other thing entirely — bright, and cruel about it. All four
// campers in a row, one of them lit, the rest dimmed, because this is the only
// competition in the game where losing means being evicted for the second
// time.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const CAMP_CSS = `
.bbcc{--cc-ink:#dfe6e9;--cc-dim:#7b8794;--cc-line:#39434d;--cc-warm:#e8b866;--cc-red:#c9343c}
.bbcc-title{font-family:var(--font-display);font-size:clamp(26px,4.6vw,44px);letter-spacing:3px;text-align:center;color:var(--cc-ink);text-shadow:0 0 22px rgba(120,140,160,.3);margin:0 0 2px;line-height:1}
.bbcc-sub{font-family:var(--font-mono);text-align:center;font-size:9.5px;letter-spacing:2.2px;color:var(--cc-dim);text-transform:uppercase;margin-bottom:16px}
.bbcc-wrap{position:relative;max-width:1000px;margin:0 auto 20px;border:1px solid var(--cc-line);border-radius:10px;overflow:hidden;background:linear-gradient(180deg,#1b2026 0%,#12161b 60%,#0a0d10 100%)}
.bbcc-wrap::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 4px)}
.bbcc-grid{position:relative;display:grid;grid-template-columns:1.1fr .9fr}
@media(max-width:760px){.bbcc-grid{grid-template-columns:1fr}}
.bbcc-room{padding:16px 14px 12px;display:flex;align-items:center;justify-content:center}
.bbcc-svg{display:block;width:100%;max-width:340px;height:auto}
.bbcc-flicker{animation:bbcc-flicker 3.4s steps(2,end) infinite}
@keyframes bbcc-flicker{0%,92%,100%{opacity:.9}94%{opacity:.55}96%{opacity:1}}
.bbcc-side{border-left:1px solid var(--cc-line);padding:16px 16px 14px;background:linear-gradient(180deg,rgba(10,13,16,.5),rgba(10,13,16,.9))}
@media(max-width:760px){.bbcc-side{border-left:none;border-top:1px solid var(--cc-line)}}
.bbcc-sideh{font-family:var(--font-mono);font-size:9px;letter-spacing:2.2px;color:var(--cc-dim);text-transform:uppercase;margin:0 0 10px;display:flex;justify-content:space-between}
.bbcc-beds{display:flex;flex-direction:column;gap:5px}
.bbcc-bed{display:flex;align-items:center;gap:9px;padding:6px 8px;border:1px solid var(--cc-line);border-radius:4px;background:rgba(255,255,255,.02)}
.bbcc-bed.is-empty{opacity:.3;border-style:dashed}
.bbcc-bed.is-back{border-color:var(--cc-warm);background:rgba(232,184,102,.1)}
.bbcc-bed.is-gone{opacity:.4}
.bbcc-bed .bb-av{border:1px solid rgba(255,255,255,.16)}
.bbcc-nm{font-family:var(--font-mono);font-size:10.5px;color:var(--cc-ink);letter-spacing:.5px}
.bbcc-bed.is-gone .bbcc-nm{text-decoration:line-through;color:var(--cc-dim)}
.bbcc-bed.is-back .bbcc-nm{color:var(--cc-warm)}
.bbcc-tag{margin-left:auto;font-family:var(--font-mono);font-size:8px;letter-spacing:1.2px;color:var(--cc-dim);text-transform:uppercase}
.bbcc-bed.is-back .bbcc-tag{color:var(--cc-warm)}
.bbcc-note{font-family:var(--font-mono);font-size:8.5px;letter-spacing:1.2px;color:var(--cc-dim);text-align:center;margin-top:11px;text-transform:uppercase}
@media(prefers-reduced-motion:reduce){.bbcc-flicker{animation:none;opacity:.9}}
`;

/** The camp room, from the inside: bunks, a small screen, a door they cannot use. */
function _campRoom(count, esc) {
  const bunks = [];
  for (let i = 0; i < 4; i++) {
    const filled = i < count;
    bunks.push(`<g transform="translate(${18 + (i % 2) * 84} ${112 + Math.floor(i / 2) * 46})">
      <rect x="0" y="0" width="72" height="34" rx="3"
        fill="${filled ? 'rgba(232,184,102,.10)' : 'rgba(255,255,255,.02)'}"
        stroke="${filled ? '#7a6238' : '#39434d'}" stroke-width="1.1"
        stroke-dasharray="${filled ? '' : '4 3'}"/>
      <rect x="5" y="5" width="20" height="12" rx="2" fill="${filled ? '#6d6250' : '#2a3138'}"/>
    </g>`);
  }
  return `<svg class="bbcc-svg" viewBox="0 0 300 210" role="img"
      aria-label="The Camp Comeback room, ${count} of four beds taken">
    <rect x="0" y="0" width="300" height="210" fill="#141a20"/>
    <path d="M0 96 h300" stroke="#39434d" stroke-width="1"/>
    <!-- the door they cannot use, with the house glowing under it -->
    <rect x="232" y="24" width="52" height="72" rx="2" fill="#0d1116" stroke="#39434d" stroke-width="1.4"/>
    <rect x="234" y="92" width="48" height="4" fill="rgba(232,184,102,.5)"/>
    <circle cx="240" cy="62" r="2.4" fill="#39434d"/>
    <!-- the small television -->
    <g transform="translate(30 26)">
      <rect x="0" y="0" width="86" height="60" rx="4" fill="#0d1116" stroke="#39434d" stroke-width="1.6"/>
      <rect class="bbcc-flicker" x="6" y="6" width="74" height="42" rx="2" fill="rgba(160,190,215,.16)"/>
      <path d="M28 66 h30 M43 60 v6" stroke="#39434d" stroke-width="2"/>
      <text x="43" y="42" text-anchor="middle"
        style="font-family:var(--font-mono);font-size:7px;letter-spacing:1.4px;fill:#7b8794">LIVE</text>
    </g>
    <text x="150" y="106" text-anchor="middle"
      style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.8px;fill:#7b8794">CAMP COMEBACK</text>
    ${bunks.join('')}
  </svg>`;
}

/**
 * The arrival — somebody was evicted and is still here.
 *
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBCampComeback(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const avatar = deps.avatar;
  const stateKey = _key(ep, 'cc');
  const state = _init(stateKey);

  const beats = act.beats || [];
  const steps = [{ kind: 'rule' }, ...beats.map(b => ({ kind: 'beat', b }))];
  if (act.full) steps.push({ kind: 'full' });
  const total = steps.length;

  const camp = act.camp || [];
  const beds = [];
  for (let i = 0; i < 4; i++) {
    const n = camp[i];
    beds.push(n
      ? `<div class="bbcc-bed">${avatar(n, 26)}<span class="bbcc-nm">${esc(n)}</span>
         <span class="bbcc-tag">${n === act.arrival ? 'arrived' : 'camper'}</span></div>`
      : '<div class="bbcc-bed is-empty"><span class="bbcc-nm">&mdash;</span>'
        + '<span class="bbcc-tag">empty</span></div>');
  }

  const STAGE = `<div class="bbcc-wrap"><div class="bbcc-grid">
    <div class="bbcc-room">${_campRoom(camp.length, esc)}</div>
    <div class="bbcc-side">
      <div class="bbcc-sideh"><span>The camp</span><span>${camp.length} of 4</span></div>
      <div class="bbcc-beds">${beds.join('')}</div>
      <div class="bbcc-note">No competitions &middot; no votes &middot; no nominations &middot; no front door</div>
    </div>
  </div></div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'rule') {
      return _card('EVICTED, AND STILL HERE',
        `${esc(act.arrival)} has been voted out. The eviction is real — no competitions, no votes, no
         nominations, and no way back except through one door that is not open yet.
         <br><br>What ${esc(act.arrival)} does have is everything they already knew, plus every
         conversation this house has from now on. A camper cannot be hurt by anything anybody does,
         which makes them the only person in the building with no reason to lie.`,
        'red', '', [act.arrival]);
    }
    if (step.kind === 'beat') return _beatCard(step.b);
    return _card('THAT IS FOUR',
      `The camp is full, which means the door opens. All four of them play for one place back in this
       game — and the three who lose are evicted for the second time, with no camp to go to.`,
      'gold', 'is-final', camp);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbcc', css: CAMP_CSS,
    title: 'CAMP COMEBACK',
    sub: 'Voted out · not gone',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'The rule',
  });
}

/** The door — one of them walks back into the game and three of them do not. */
export function rpBuildBBCampReturn(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const avatar = deps.avatar;
  const stateKey = _key(ep, 'ccr');
  const state = _init(stateKey);

  const beats = act.beats || [];
  const steps = [{ kind: 'open' }, ...beats.map(b => ({ kind: 'beat', b })), { kind: 'back' }];
  const total = steps.length;
  const decided = state.idx >= total - 1;

  const beds = (act.played || []).map(n => {
    const back = decided && n === act.winner;
    const gone = decided && n !== act.winner;
    return `<div class="bbcc-bed ${back ? 'is-back' : ''} ${gone ? 'is-gone' : ''}">
      ${avatar(n, 26)}<span class="bbcc-nm">${esc(n)}</span>
      <span class="bbcc-tag">${back ? 'back in' : gone ? 'gone for good' : 'playing'}</span></div>`;
  }).join('');

  const STAGE = `<div class="bbcc-wrap"><div class="bbcc-grid">
    <div class="bbcc-room">${_campRoom((act.played || []).length, esc)}</div>
    <div class="bbcc-side">
      <div class="bbcc-sideh"><span>One door</span><span>${(act.played || []).length} playing</span></div>
      <div class="bbcc-beds">${beds}</div>
      <div class="bbcc-note">Lose this and you are evicted for the second time</div>
    </div>
  </div></div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'open') {
      return _card('THE DOOR OPENS',
        `All ${(act.played || []).length} of them play, and one walks back into the game. The others are
         evicted for the second time — the only competition in this house where losing costs you an
         eviction you have already survived once.`, 'gold', '', act.played || []);
    }
    if (step.kind === 'beat') return _beatCard(step.b);
    return _card('BACK IN, AND INFORMED',
      `<b>${esc(act.winner)}</b> returns to the game carrying weeks of watching: every conversation this
       house had while it believed they could not hear, including the ones about them.
       <br><br>${esc((act.gone || []).join(', '))} leave, having been voted out twice by the same people.`,
      'gold', 'is-final', [act.winner]);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbcc', css: CAMP_CSS,
    title: 'THE DOOR',
    sub: 'One of them is coming back',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'Open it',
  });
}
