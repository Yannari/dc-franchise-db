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
let _bbAvatar = () => '';
export function _deps(d) {
  if (!d) return false;
  if (d.tvState) _tvState = d.tvState;
  if (d.reveal) _bbReveal = d.reveal;
  if (d.esc) _bbEsc = d.esc;
  if (d.avatar) _bbAvatar = d.avatar;
  return Boolean(d.tvState && d.reveal && d.esc);
}

/**
 * The faces on a card.
 *
 * Every card in these screens is ABOUT somebody, and a wall of prose with no
 * portraits in it reads as a transcript rather than as television. The beat
 * cards already carry a `players` array and the twist cards know their own
 * cast, so both get a row of avatars under the badge.
 *
 * Deduplicated and capped: a beat naming five people is a beat, not a group
 * photograph, and six 24px portraits wrap badly on a phone.
 */
export const _faces = (names, px = 24) => {
  const cast = [...new Set((names || []).filter(Boolean))].slice(0, 4);
  if (!cast.length) return '';
  return `<span class="bbtw-faces">${cast.map(n =>
    `<span class="bbtw-face" title="${_bbEsc(n)}">${_bbAvatar(n, px)}</span>`).join('')}</span>`;
};

/** Shared by every screen in the family, so the faces sit the same way. */
export const FACE_CSS = `
.bbtw-faces{display:inline-flex;align-items:center;gap:4px;margin-right:8px;vertical-align:middle}
.bbtw-face{display:inline-flex}
.bbtw-face .bb-av{border:1px solid rgba(255,255,255,.18);box-shadow:0 2px 6px rgba(0,0,0,.45)}
.bbns-card-b .bbtw-faces{float:left}
`;

/** Every screen here reveals one step at a time out of the same scaffolding. */
export function _shell({ ep, stateKey, total, title, sub, cls, css, stage, cards, firstLabel }) {
  const state = _tvState[stateKey];
  const done = state.idx >= total - 1;
  return `<div class="rp-page bb-room bb-block bbns ${cls}">
    <style>${css}${FACE_CSS}</style>
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
export const _card = (pill, body, tone = '', extra = '', cast = []) =>
  `<div class="bbns-card ${extra}">
    <div class="bbns-card-h"><span class="bbns-pill ${tone}">${_bbEsc(pill)}</span></div>
    <div class="bbns-card-b">${_faces(cast)}${body}</div></div>`;
/**
 * Beats arrive pre-written by the engine; the screen only has to place them —
 * and put the faces of the people in them on the front, which is the whole
 * reason the engine bothers to carry `players` on every beat.
 */
export const _beatCard = b => _card(b.badgeText || 'THE HOUSE', _bbEsc(b.text || ''),
  b.badgeClass === 'red' ? 'red' : b.badgeClass === 'grey' ? 'grey' : b.badgeClass === 'blue' ? 'blue' : 'gold',
  '', b.players || []);

// ══════════════════════════════════════════════════════════════════════
// America's Care Package — the delivery screen moved out
// ══════════════════════════════════════════════════════════════════════
//
// The delivery now lives in vp-bb-care-package.js, rebuilt around the room
// rather than the box: the crate is half of it and the other half is every
// houseguest, with the ones who have already had a package struck out for
// good. That column is the twist and no amount of prose carried it.
//
// What stays here is the SPEND — the vote block and the bribe — because that
// happens on a different night and is a different scene, and it carries its
// own styles rather than borrowing the delivery's.
const SPEND_CSS = `
.bbcp-title{font-family:var(--font-display);font-size:clamp(24px,4.4vw,40px);letter-spacing:3px;text-align:center;color:#f4e7d0;text-shadow:0 0 22px rgba(232,184,102,.3);margin:0 0 2px;line-height:1}
.bbcp-sub{font-family:var(--font-mono);text-align:center;font-size:9.5px;letter-spacing:2.2px;color:#9a7f5a;text-transform:uppercase;margin-bottom:14px}
.bbcp-stage{max-width:460px;margin:0 auto 18px}
.bbcp-crate{display:block;width:100%;height:auto;filter:drop-shadow(0 12px 24px rgba(0,0,0,.55))}
`;

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
           an audience, and nothing at all to do about any of it.`, 'red', '',
        [act.recipient, ...struck]);
      }
      return _card('PUBLIC MONEY, PRIVATE SPENDING',
        `The whole house watched five thousand dollars arrive. Not one of them will ever be told
         where it went.`, 'gold');
    }
    return _beatCard(step.b);
  };

  return _shell({
    ep, stateKey, total, cls: 'bbcp', css: SPEND_CSS,
    title: 'THE PACKAGE IS SPENT',
    sub: _bbEsc(act.package || ''),
    stage: `<div class="bbcp-stage">${struck.length ? BALLOTS : MONEY}</div>`,
    cards: steps.map(card).join(''),
    firstLabel: 'Spend it',
  });
}
