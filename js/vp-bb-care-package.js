// ══════════════════════════════════════════════════════════════════════
// vp-bb-care-package.js — the delivery, and the room watching it
// ══════════════════════════════════════════════════════════════════════
//
// This was the last twist screen still on the old standard: a small crate and
// a column of prose. It needed rebuilding around the thing the twist actually
// IS, which is not a parcel — it is a public ranking.
//
// Every other twist in this catalogue hides something. This one hides nothing
// and hurts anyway: the contents are announced before the vote, the audience
// decides, and the name is read out in a room where eleven other people are
// standing. So the screen is built out of the room rather than out of the box.
//
// The left half is the delivery: a crate with a shipping label that stays
// blank until the reveal fills it in, because that blank line is the whole
// scene. The right half is THE ROOM — every houseguest, the recipient lit, the
// people who have already had one struck out for good, and everybody else
// waiting. That column is what the twist is really about and no amount of
// prose gets it across: you can see the pool shrinking week by week.
import { _shell, _deps, _key, _init, _hidden, _card, _beatCard } from './vp-bb-twists.js';

const CP_CSS = `
.bbcp{--cp-kraft:#c99a5e;--cp-ink:#f4e7d0;--cp-dim:#9a7f5a;--cp-line:#5a4326;--cp-red:#c9343c}
.bbcp-title{font-family:var(--font-display);font-size:clamp(26px,4.6vw,44px);letter-spacing:3px;text-align:center;color:var(--cp-ink);text-shadow:0 0 24px rgba(232,184,102,.32);margin:0 0 2px;line-height:1}
.bbcp-sub{font-family:var(--font-mono);text-align:center;font-size:9.5px;letter-spacing:2.2px;color:var(--cp-dim);text-transform:uppercase;margin-bottom:16px}

.bbcp-wrap{position:relative;max-width:1000px;margin:0 auto 20px;border:1px solid var(--cp-line);border-radius:10px;overflow:hidden;background:radial-gradient(120% 100% at 30% 0%,#3a2c1a 0%,#241a10 55%,#120c07 100%)}
.bbcp-wrap::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(45deg,rgba(255,255,255,.018) 0 6px,transparent 6px 12px)}
.bbcp-grid{position:relative;display:grid;grid-template-columns:1.05fr .95fr}
@media(max-width:760px){.bbcp-grid{grid-template-columns:1fr}}
.bbcp-bay{padding:16px 14px 12px}
.bbcp-crate{display:block;width:100%;max-width:330px;height:auto;margin:0 auto;filter:drop-shadow(0 16px 30px rgba(0,0,0,.6))}
.bbcp-drop{animation:bbcp-drop 1s cubic-bezier(.22,1,.36,1) both}
@keyframes bbcp-drop{from{transform:translateY(-40px);opacity:0}to{transform:none;opacity:1}}
.bbcp-blank{fill:none;stroke:#7a5a2a;stroke-width:1.2;stroke-dasharray:5 4}
.bbcp-name{font-family:var(--font-display);font-size:17px;letter-spacing:1.6px;fill:#2a1c0c}
.bbcp-stencil{font-size:8.5px;letter-spacing:1.5px;fill:#b1874f;font-family:var(--font-mono)}
.bbcp-stamp{transform-origin:50% 50%}
.bbcp-stamp.is-on{animation:bbcp-stamp .4s cubic-bezier(.2,1.5,.4,1) both}
@keyframes bbcp-stamp{from{opacity:0;transform:scale(2.2) rotate(-16deg)}to{opacity:1;transform:scale(1) rotate(-7deg)}}

/* the room, which is the point */
.bbcp-room{border-left:1px solid var(--cp-line);padding:16px 16px 14px;background:linear-gradient(180deg,rgba(18,12,7,.5),rgba(18,12,7,.9))}
@media(max-width:760px){.bbcp-room{border-left:none;border-top:1px solid var(--cp-line)}}
.bbcp-roomh{font-family:var(--font-mono);font-size:9px;letter-spacing:2.2px;color:var(--cp-dim);text-transform:uppercase;margin:0 0 10px;display:flex;justify-content:space-between}
.bbcp-people{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px}
.bbcp-person{text-align:center;padding:7px 4px 6px;border:1px solid var(--cp-line);border-radius:4px;background:rgba(255,255,255,.02)}
.bbcp-person .bb-av{border:1px solid rgba(232,184,102,.28)}
.bbcp-who{font-family:var(--font-mono);font-size:9px;letter-spacing:.4px;color:var(--cp-dim);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bbcp-person.is-chosen{border-color:#e8b866;background:rgba(232,184,102,.12);box-shadow:0 0 18px rgba(232,184,102,.2)}
.bbcp-person.is-chosen .bbcp-who{color:#f0c674}
.bbcp-person.is-spent{opacity:.34}
.bbcp-person.is-spent .bbcp-who{text-decoration:line-through}
.bbcp-tagline{font-family:var(--font-mono);font-size:8px;letter-spacing:1.2px;color:var(--cp-dim);margin-top:3px;text-transform:uppercase}
.bbcp-person.is-chosen .bbcp-tagline{color:#f0c674}
.bbcp-legend{font-family:var(--font-mono);font-size:8.5px;letter-spacing:1.2px;color:var(--cp-dim);text-align:center;margin-top:11px;text-transform:uppercase}
@media(prefers-reduced-motion:reduce){.bbcp-drop,.bbcp-stamp.is-on{animation:none;opacity:1;transform:none}}
`;

/** The crate. Flat-fronted, taped, stencilled, with a label that fills in. */
function _crate(act, named, esc) {
  return `<svg class="bbcp-crate ${named ? 'bbcp-drop' : ''}" viewBox="0 0 300 210" role="img"
      aria-label="A care package crate addressed to ${esc(act.recipient || '')}">
    <defs>
      <linearGradient id="bbcpBoard" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c99a5e"/><stop offset="1" stop-color="#8a6134"/>
      </linearGradient>
      <linearGradient id="bbcpTape" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e8b866" stop-opacity=".26"/>
        <stop offset=".5" stop-color="#f3d199" stop-opacity=".5"/>
        <stop offset="1" stop-color="#e8b866" stop-opacity=".26"/>
      </linearGradient>
    </defs>
    <rect x="20" y="34" width="260" height="150" rx="5" fill="url(#bbcpBoard)"/>
    <rect x="20" y="34" width="260" height="26" rx="5" fill="#a2753d"/>
    <path d="M20 60 h260" stroke="#6f4a22" stroke-width="1.6"/>
    <path d="M20 128 h260 M20 160 h260" stroke="#6f4a22" stroke-width="1" opacity=".4"/>
    <rect x="138" y="34" width="24" height="42" fill="url(#bbcpTape)"/>
    <path d="M138 34 v42 M162 34 v42" stroke="#f3d199" stroke-width=".8" opacity=".5"/>
    <text class="bbcp-stencil" x="36" y="88">CONTENTS DECLARED</text>
    <text class="bbcp-stencil" x="36" y="102">BEFORE THE VOTE</text>
    <g transform="translate(236 92)">
      <g class="bbcp-stamp ${named ? 'is-on' : ''}">
        <circle r="26" fill="none" stroke="${'#c9343c'}" stroke-width="2.4" opacity=".85"/>
        <circle r="21" fill="none" stroke="#c9343c" stroke-width=".8" opacity=".5"/>
        <text y="-3" text-anchor="middle" style="font-size:8px;letter-spacing:.8px;fill:#c9343c">AMERICA</text>
        <text y="9" text-anchor="middle" style="font-size:8px;letter-spacing:.8px;fill:#c9343c">VOTED</text>
      </g>
    </g>
    <g transform="translate(150 152)">
      <rect x="-98" y="-24" width="196" height="46" rx="3" fill="#f0e0c0" stroke="#7a5a2a" stroke-width="1.2"/>
      <text x="-90" y="-10" class="bbcp-stencil" style="fill:#8a6134">DELIVER TO</text>
      ${named
    ? `<text x="0" y="13" text-anchor="middle" class="bbcp-name">${esc(act.recipient)}</text>`
    : '<rect class="bbcp-blank" x="-84" y="0" width="168" height="16" rx="2"/>'}
    </g>
  </svg>`;
}

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `care-package` act
 * @param {object} deps {tvState, reveal, esc, avatar} from vp-screens.js
 */
export function rpBuildBBCarePackage(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const esc = deps.esc;
  const avatar = deps.avatar;
  const stateKey = _key(ep, 'cp');
  const state = _init(stateKey);

  // The engine writes two beats the stage now tells better.
  const SAID_BY_THE_STAGE = new Set(['WHAT IS IN IT', 'AMERICA CHOSE']);
  const beats = (act.beats || []).filter(b => !SAID_BY_THE_STAGE.has(b.badgeText));
  const steps = [{ kind: 'manifest' }, { kind: 'vote' }, { kind: 'name' },
    ...beats.map(b => ({ kind: 'beat', b }))];
  if ((act.ineligible || []).length) steps.push({ kind: 'pool' });
  const total = steps.length;
  const named = state.idx >= 2;

  // Everybody in the house, which is the column that carries the twist.
  const ineligible = new Set(act.ineligible || []);
  const room = [...new Set([act.recipient, ...ineligible,
    ...((ep.houseAtStart || ep.activePlayers || []).filter(Boolean))])].filter(Boolean);
  const people = room.map(n => {
    const chosen = named && n === act.recipient;
    const spent = ineligible.has(n);
    return `<div class="bbcp-person ${chosen ? 'is-chosen' : ''} ${spent ? 'is-spent' : ''}">
      ${avatar(n, 34)}
      <div class="bbcp-who">${esc(n)}</div>
      <div class="bbcp-tagline">${chosen ? 'CHOSEN' : spent ? 'HAD ONE' : 'ELIGIBLE'}</div>
    </div>`;
  }).join('');

  const eligibleLeft = room.filter(n => !ineligible.has(n)).length;
  const STAGE = `<div class="bbcp-wrap">
    <div class="bbcp-grid">
      <div class="bbcp-bay">${_crate(act, named, esc)}</div>
      <div class="bbcp-room">
        <div class="bbcp-roomh"><span>The room</span><span>${eligibleLeft} still eligible</span></div>
        <div class="bbcp-people">${people}</div>
        <div class="bbcp-legend">One each, ever &mdash; struck through is out of the pool for good</div>
      </div>
    </div>
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'manifest') {
      return _card('THE MANIFEST',
        `<b>${esc(act.package)}</b> — ${esc(act.blurb)} ${esc(act.catch)}
         <br><br>The contents are read out <i>before</i> the vote, which is what makes this a strategic
         week rather than a gift: everybody knows exactly what is about to land, and not one of them can
         do anything to steer it.`, 'gold');
    }
    if (step.kind === 'vote') {
      return _card('OUT OF THEIR HANDS',
        `Nobody in this house competes for it, campaigns for it, or can refuse it. The vote happens
         somewhere none of them have ever been, among people none of them have ever met, and the only
         currency it runs on is how much of the show they have been.`, 'blue');
    }
    if (step.kind === 'name') {
      return _card('THE NAME ON THE LABEL',
        `It is <b>${esc(act.recipient)}</b>, read out in front of everybody.
         ${act.coNominee ? `As Co-Head of Household, ${esc(act.recipient)} names ${esc(act.coNominee)}.` : ''}
         <br><br>This is the part the secret twists can never do. There is nothing to work out and nobody
         to suspect — just a room of people who have all been told, out loud, that the country picked
         somebody else.`, 'red', 'is-final', [act.recipient, act.coNominee]);
    }
    if (step.kind === 'pool') {
      return _card('THE POOL SHRINKS',
        `A houseguest may only ever receive one, so every name on the right that is struck through is a
         name the audience can no longer reach. ${eligibleLeft} are still eligible.
         <br><br>Which makes the last package of a season a completely different vote from the first —
         and it is why the people who were never chosen start to notice.`, 'grey');
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbcp', css: CP_CSS,
    title: "AMERICA'S CARE PACKAGE",
    sub: 'Announced before the vote · delivered in front of everybody',
    stage: STAGE,
    cards: steps.map(card).join(''),
    firstLabel: 'The manifest',
  });
}
