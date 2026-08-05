// ══════════════════════════════════════════════════════════════════════
// vp-bb-twists.js — screens for the twists that were shipping text-only
// ══════════════════════════════════════════════════════════════════════
//
// Five Big Brother twists reached both transcripts and drew nothing: the Care
// Package, the Coin of Destiny, America's Nominee, the Safety Suite and the
// Den's curse. The act-coverage guard did not catch it because its VP half was
// an allowlist — it only checked the eight act types somebody had remembered
// to name. It is a denylist now, and these are the screens it asked for.
//
// They live in their own file rather than in vp-screens.js because that file
// is 20,000 lines and is edited by more than one pair of hands at a time. The
// only thing that has to go over there is the `case` label.
//
// Each screen carries its own scoped CSS for the same reason: a shared
// stylesheet is a shared file, and none of these needs to be in one.
//
// The house rules they all follow:
//   · click-to-reveal through `_tvState[key].idx`, sticky controls, counter
//   · inline SVG for anything illustrative — never divs pretending to be shapes
//   · nothing on the screen may reveal what the HOUSE was not told; the viewer
//     is owed more than the house, but only where the twist says so
//
// The shell and its helpers are exported: the sibling screen files in this
// folder import them, and because they share this module instance they also
// share the deps that _deps() latched.
//
// The reveal helpers are PASSED IN rather than imported. vp-screens.js owns
// them and importing back into it would make a cycle, so these follow the
// pattern the Battle Back case already uses: the case hands over
// {tvState, reveal, esc} and this file stays a leaf.

/** Set by each entry point from the deps the caller handed over. */
let _tvState = {};
let _bbReveal = () => '';
let _bbEsc = v => String(v ?? '');
export function _deps(d) {
  if (!d) return false;
  if (d.tvState) _tvState = d.tvState;
  if (d.reveal) _bbReveal = d.reveal;
  if (d.esc) _bbEsc = d.esc;
  return Boolean(d.tvState && d.reveal && d.esc);
}

/** Every screen here reveals one step at a time out of the same scaffolding. */
export function _shell({ ep, stateKey, total, title, sub, cls, css, stage, cards, firstLabel }) {
  const state = _tvState[stateKey];
  const done = state.idx >= total - 1;
  return `<div class="rp-page bb-room bb-block bbns ${cls}">
    <style>${css}</style>
    <div class="rp-eyebrow">Week ${ep.num}</div>
    <div class="${cls}-title">${_bbEsc(title)}</div>
    <div class="${cls}-sub">${_bbEsc(sub)}</div>
    ${stage}
    <div class="bbns-cards">${cards}</div>
    <div class="rp-reveal-controls" style="position:sticky;bottom:0;display:flex;gap:8px;justify-content:center;padding:10px 0;background:linear-gradient(transparent, rgba(5,7,13,.92) 40%)">
      ${done ? '' : `<button class="rp-btn" onclick="${_bbReveal(ep, stateKey, state.idx + 1)}">${state.idx < 0 ? firstLabel : 'Reveal next'}</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${_bbReveal(ep, stateKey, total - 1)}">Reveal all</button>`}
      <span style="align-self:center;font-size:10px;color:var(--muted);letter-spacing:1px">${Math.min(total, Math.max(0, state.idx + 1))} / ${total}</span>
    </div>
  </div>`;
}

export const _key = (ep, tag) => `bb_${tag}_${ep.num}${ep?._seg ? `_s${ep._seg}` : ''}`;
export const _init = key => { if (!_tvState[key]) _tvState[key] = { idx: -1 }; return _tvState[key]; };
export const _hidden = () => '<div class="bbns-card is-hidden"><span>?</span></div>';
export const _card = (pill, body, tone = '', extra = '') =>
  `<div class="bbns-card ${extra}">
    <div class="bbns-card-h"><span class="bbns-pill ${tone}">${_bbEsc(pill)}</span></div>
    <div class="bbns-card-b">${body}</div></div>`;
/** Beats arrive pre-written by the engine; the screen only has to place them. */
export const _beatCard = b => _card(b.badgeText || 'THE HOUSE', _bbEsc(b.text || ''),
  b.badgeClass === 'red' ? 'red' : b.badgeClass === 'grey' ? 'grey' : b.badgeClass === 'blue' ? 'blue' : 'gold');

// ══════════════════════════════════════════════════════════════════════
// America's Care Package
// ══════════════════════════════════════════════════════════════════════
//
// The only PUBLIC twist in the catalogue, so the screen is built around the
// one thing the others can never show: a name, printed on a label, read out in
// front of everybody.
//
// The whole scene is a delivery. A crate comes down into the house with a
// shipping label on it, the manifest is stencilled on the side — because the
// contents are announced BEFORE the vote, which is the rule that makes the
// week strategic — and the label stays blank until the reveal that fills it
// in. That blank line is the screen: eleven people watching a label, knowing
// ten of them are about to be told they are not the country's favourite.
const CP_CSS = `
.bbcp-title{font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#e8b866;text-shadow:0 0 18px rgba(232,184,102,.3);margin-bottom:4px}
.bbcp-sub{text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px}
.bbcp-stage{position:relative;max-width:420px;margin:0 auto 18px;padding:6px 0}
.bbcp-crate{display:block;width:100%;height:auto;filter:drop-shadow(0 14px 26px rgba(0,0,0,.55))}
.bbcp-drop{animation:bbcp-drop 1.1s cubic-bezier(.22,1,.36,1) both}
@keyframes bbcp-drop{from{transform:translateY(-34px);opacity:0}to{transform:translateY(0);opacity:1}}
.bbcp-label-name{font-family:var(--font-display);font-size:15px;letter-spacing:1.6px;fill:#2a1c0c}
.bbcp-blank{fill:none;stroke:#7a5a2a;stroke-width:1.2;stroke-dasharray:4 3}
.bbcp-stamp{opacity:0;transform-origin:50% 50%}
.bbcp-stamp.is-on{animation:bbcp-stamp .42s cubic-bezier(.2,1.5,.4,1) both}
@keyframes bbcp-stamp{from{opacity:0;transform:scale(2.4) rotate(-14deg)}to{opacity:1;transform:scale(1) rotate(-7deg)}}
.bbcp-manifest{font-size:9.5px;letter-spacing:1.4px;fill:#c79a54;font-family:var(--font-mono,monospace)}
.bbcp-pool{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin:10px auto 0;max-width:460px}
.bbcp-chip{font-size:10px;letter-spacing:.6px;padding:3px 8px;border-radius:11px;border:1px solid rgba(199,154,84,.35);color:#c79a54}
.bbcp-chip.is-out{opacity:.42;text-decoration:line-through;border-style:dashed}
@media(prefers-reduced-motion:reduce){.bbcp-drop,.bbcp-stamp.is-on{animation:none;opacity:1;transform:none}}
`;

/**
 * @param {object} ep   the episode view
 * @param {object} act  the `care-package` act
 * @param {object} deps {tvState, reveal, esc} from vp-screens.js
 */
export function rpBuildBBCarePackage(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const stateKey = _key(ep, 'cp');
  const state = _init(stateKey);
  // The engine writes two beats that this screen has already said better —
  // the contents, and the delivery — because the TRANSCRIPTS need them as
  // prose. Here they would be the same sentence twice in a row, so the screen
  // drops them and keeps the reactions, which is the half it cannot draw.
  const SAID_BY_THE_STAGE = new Set(['WHAT IS IN IT', 'AMERICA CHOSE']);
  const beats = (act.beats || []).filter(b => !SAID_BY_THE_STAGE.has(b.badgeText));

  // Manifest, then the vote, then the name — in that order, because that is
  // the order the house experiences it and the blank label is the tension.
  const steps = [{ kind: 'manifest' }, { kind: 'vote' }, { kind: 'name' },
    ...beats.map(b => ({ kind: 'beat', b }))];
  if ((act.ineligible || []).length) steps.push({ kind: 'pool' });
  const total = steps.length;
  const named = state.idx >= 2;

  // The stamp's transform lives on an OUTER <g>: the reveal animation sets a
  // CSS `transform`, and a CSS transform beats an SVG transform attribute on
  // the same element, which threw the stamp off the left edge of the canvas.
  const CRATE = `<svg class="bbcp-crate ${state.idx >= 0 ? 'bbcp-drop' : ''}" viewBox="0 0 300 200" role="img"
      aria-label="A care package crate with a shipping label">
    <defs>
      <linearGradient id="bbcpBoard" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c0904f"/><stop offset="1" stop-color="#8a6134"/>
      </linearGradient>
      <linearGradient id="bbcpTape" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e8b866" stop-opacity=".28"/>
        <stop offset=".5" stop-color="#f3d199" stop-opacity=".5"/>
        <stop offset="1" stop-color="#e8b866" stop-opacity=".28"/>
      </linearGradient>
    </defs>
    <rect x="24" y="44" width="252" height="138" rx="5" fill="url(#bbcpBoard)"/>
    <rect x="24" y="44" width="252" height="24" rx="5" fill="#a2753d"/>
    <path d="M24 68 h252" stroke="#6f4a22" stroke-width="1.6"/>
    <path d="M24 122 h252 M24 152 h252" stroke="#6f4a22" stroke-width="1" opacity=".45"/>
    <rect x="138" y="44" width="24" height="38" fill="url(#bbcpTape)"/>
    <path d="M138 44 v38 M162 44 v38" stroke="#f3d199" stroke-width=".8" opacity=".5"/>
    <text class="bbcp-manifest" x="40" y="94">CONTENTS DECLARED</text>
    <text class="bbcp-manifest" x="40" y="108">BEFORE THE VOTE</text>
    <g class="bbcp-stamp-pos" transform="translate(234 88)">
      <g class="bbcp-stamp ${named ? 'is-on' : ''}">
        <circle r="24" fill="none" stroke="#c9343c" stroke-width="2.4" opacity=".85"/>
        <circle r="19" fill="none" stroke="#c9343c" stroke-width=".9" opacity=".5"/>
        <text y="-3" text-anchor="middle" style="font-size:8px;letter-spacing:.8px;fill:#c9343c">AMERICA</text>
        <text y="9" text-anchor="middle" style="font-size:8px;letter-spacing:.8px;fill:#c9343c">VOTED</text>
      </g>
    </g>
    <g transform="translate(150 150)">
      <rect x="-86" y="-22" width="172" height="42" rx="3" fill="#f0e0c0" stroke="#7a5a2a" stroke-width="1.2"/>
      <text x="-78" y="-9" class="bbcp-manifest" style="fill:#8a6134">DELIVER TO</text>
      ${named
    ? `<text x="0" y="12" text-anchor="middle" class="bbcp-label-name">${_bbEsc(act.recipient)}</text>`
    : '<rect class="bbcp-blank" x="-72" y="0" width="144" height="15" rx="2"/>'}
    </g>
  </svg>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'manifest') {
      return _card('THE MANIFEST',
        `<b>${_bbEsc(act.package)}</b> — ${_bbEsc(act.blurb)} ${_bbEsc(act.catch)}
         <br><br>The contents are read out <i>before</i> the vote, which is the rule that makes this
         a strategic week rather than a gift: everybody in the house knows exactly what is about to
         land, and none of them can do a single thing to steer it.`, 'gold');
    }
    if (step.kind === 'vote') {
      return _card('OUT OF THEIR HANDS',
        `Nobody in this house competes for it, campaigns for it, or can refuse it. The vote happens
         somewhere none of them have ever been, among people none of them have ever met, and the
         only currency it runs on is how much of the show they have been.`, 'blue');
    }
    if (step.kind === 'name') {
      return _card('THE NAME ON THE LABEL',
        `It is <b>${_bbEsc(act.recipient)}</b>, and it is read out in front of everybody.
         ${act.coNominee ? `As Co-Head of Household, ${_bbEsc(act.recipient)} names ${_bbEsc(act.coNominee)}.` : ''}
         <br><br>This is the part the secret twists can never do. There is nothing to work out and
         nobody to suspect — just a room of people who have all just been told, out loud, that the
         country picked somebody else.`, 'red', 'is-final');
    }
    if (step.kind === 'pool') {
      return _card('THE POOL SHRINKS',
        `Out of the running for good, having already had one:
         <div class="bbcp-pool">${(act.ineligible || [])
    .map(n => `<span class="bbcp-chip is-out">${_bbEsc(n)}</span>`).join('')}</div>
         <br>A houseguest may only ever receive one. Every week this runs, the list of people the
         audience is still allowed to reach gets shorter — which makes the last package of a season
         a completely different vote from the first.`, 'grey');
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbcp', css: CP_CSS,
    title: "AMERICA'S CARE PACKAGE",
    sub: 'Announced before the vote. Delivered in front of everybody.',
    stage: `<div class="bbcp-stage">${CRATE}</div>`,
    cards: steps.map(card).join(''),
    firstLabel: 'The manifest',
  });
}

/**
 * The care package being SPENT — the vote block and the bribe.
 *
 * A separate screen because it happens on a separate night, and because these
 * two are the twist's teeth. The vote block is the Hacker's exact opposite:
 * two ballots removed BY NAME, in public, with nothing for the silenced to
 * work out. The bribe is the reverse again — public money, private spending,
 * and a house that knows five thousand dollars is in the building and cannot
 * tell an ordinary vote from a bought one.
 */
export function rpBuildBBCarePackagePlay(ep, act, deps) {
  if (!act || !_deps(deps)) return '';
  const stateKey = _key(ep, 'cpp');
  const state = _init(stateKey);
  const beats = act.beats || [];
  const steps = [{ kind: 'open' }, ...beats.map(b => ({ kind: 'beat', b }))];
  const total = steps.length;

  const struck = act.blocked || [];
  const BALLOTS = `<svg class="bbcp-crate" viewBox="0 0 300 120" role="img"
      aria-label="Two ballots struck through">
    ${[0, 1].map(i => `<g transform="translate(${72 + i * 116} 60)">
      <rect x="-44" y="-32" width="88" height="64" rx="4" fill="#f0e6d2" stroke="#7a5a2a" stroke-width="1.2"/>
      <path d="M-30 -14 h60 M-30 0 h60 M-30 14 h38" stroke="#c0b49c" stroke-width="2.4" stroke-linecap="round"/>
      ${struck[i] ? `<path d="M-46 -34 L46 34" stroke="#c9343c" stroke-width="4" stroke-linecap="round" opacity=".9"/>
        <text y="52" text-anchor="middle" style="font-size:11px;letter-spacing:1px;fill:#c9343c">${_bbEsc(struck[i])}</text>` : ''}
    </g>`).join('')}
  </svg>`;

  const MONEY = `<svg class="bbcp-crate" viewBox="0 0 300 120" role="img"
      aria-label="An envelope of money">
    <g transform="translate(150 58)">
      <rect x="-78" y="-40" width="156" height="80" rx="5" fill="#d8c9a6" stroke="#7a5a2a" stroke-width="1.4"/>
      <path d="M-78 -40 L0 14 L78 -40" fill="none" stroke="#7a5a2a" stroke-width="1.4"/>
      <text y="34" text-anchor="middle" style="font-family:var(--font-display);font-size:17px;letter-spacing:2px;fill:#2a1c0c">$5,000</text>
    </g>
  </svg>`;

  const card = (step, i) => {
    if (i > state.idx) return _hidden();
    if (step.kind === 'open') {
      if (struck.length) {
        return _card('STRUCK BY NAME',
          `${_bbEsc(act.recipient)} removes two eviction votes — ${_bbEsc(struck.join(' and '))} —
           and says both names out loud.
           <br><br>A hacked ballot leaves its owner hunting. This leaves them with a name, a date and
           an audience, and nothing at all to do about any of it.`, 'red');
      }
      return _card('PUBLIC MONEY, PRIVATE SPENDING',
        `The whole house watched five thousand dollars arrive. Not one of them will ever be told
         where it went.`, 'gold');
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbcp', css: CP_CSS,
    title: 'THE PACKAGE IS SPENT',
    sub: _bbEsc(act.package || ''),
    stage: `<div class="bbcp-stage">${struck.length ? BALLOTS : MONEY}</div>`,
    cards: steps.map(card).join(''),
    firstLabel: 'Spend it',
  });
}
