// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/comp-field.js — a competition, played on the comp field (overhaul part 5)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-13/14: "ceremonies with game feel, comps on the comp field". The engine decided the
// competition (its scores, its placements, a line for each moment); this plays it as a game screen on
// the Reality Resort's comp field (steps.js compScreen picks the field for the arena):
//   - everybody in it stands on the field; whoever the moment is about steps forward and does the
//     competition's own thing (endurance trembles, a race runs, a puzzle thinks, a quiz buzzes)
//   - a leaderboard fills in as each result comes in: the score bar, the badge the engine gave
//     (NO WORD, THREW IT, 5 PLACED), the leader's crown; who is out goes grey
//   - it opens on a rules card, and it ends on the key (Head of Household) or the medallion (veto)
// PURE: a screen and a step in, HTML out.
import { esc, img, col } from './stage.js';

// what each kind of competition looks like on the field: its icon and the animation of the one doing it
const CAT = {
  endurance: { label: 'Endurance', icon: '<path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M10 18h4l-2-2.5z" fill="currentColor"/>', anim: 'tremble' },
  physical: { label: 'Physical', icon: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/>', anim: 'run' },
  precision: { label: 'Precision', icon: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>', anim: 'aim' },
  mental: { label: 'Mental', icon: '<path d="M9 4a4 4 0 0 0-4 4 3.5 3.5 0 0 0-1 6 4 4 0 0 0 5 5V4zM15 4a4 4 0 0 1 4 4 3.5 3.5 0 0 1 1 6 4 4 0 0 1-5 5V4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>', anim: 'think' },
  puzzle: { label: 'Puzzle', icon: '<path d="M4 9h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v4H4v-4a2 2 0 1 0 0-4z" fill="currentColor"/>', anim: 'think' },
  memory: { label: 'Memory', icon: '<rect x="3" y="5" width="8" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13" y="8" width="8" height="11" rx="1.5" fill="currentColor"/>', anim: 'think' },
  quiz: { label: 'Quiz', icon: '<path d="M5 15h14v3H5z" fill="currentColor"/><path d="M7 15a5 5 0 0 1 10 0" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 4v3M6 6l2 2M18 6l-2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>', anim: 'buzz' },
  luck: { label: 'Luck', icon: '<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>', anim: 'spin' },
  balance: { label: 'Balance', icon: '<path d="M12 4v15M6 19h12M5 8h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M5 8l-2 5h4zM19 8l-2 5h4z" fill="currentColor"/>', anim: 'sway' },
  social: { label: 'Social', icon: '<path d="M4 5h11v8H9l-3 3v-3H4z" fill="currentColor"/><path d="M17 9h3v8h-2v3l-3-3h-4v-2" fill="none" stroke="currentColor" stroke-width="1.7"/>', anim: 'buzz' },
};
const catOf = c => CAT[c] || (/endur|stamina|grip/.test(c) ? CAT.endurance : /quiz|trivia/.test(c) ? CAT.quiz : /memor|recall/.test(c) ? CAT.memory : /puzz/.test(c) ? CAT.puzzle : /mental/.test(c) ? CAT.mental : CAT.physical);
const svg = (inner, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const CROWN = '<path d="M3 18h18l-2-10-5 4-2-6-2 6-5-4z" fill="#ffd166" stroke="#7a4b00" stroke-width="1"/>';
// the Head of Household key and the Power of Veto medallion: the prize, drawn
export const KEY = '<svg viewBox="0 0 64 64" class="cf-prize"><defs><linearGradient id="cfk" x1="0" x2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".5" stop-color="#f5c542"/><stop offset="1" stop-color="#b8860b"/></linearGradient></defs>'
  + '<circle cx="20" cy="22" r="13" fill="none" stroke="url(#cfk)" stroke-width="6"/><circle cx="20" cy="22" r="5" fill="#22e1ff" opacity=".9"/>'
  + '<path d="M29 31l22 22M42 44l5-5M47 49l5-5" stroke="url(#cfk)" stroke-width="6" stroke-linecap="round"/></svg>';
export const MEDAL_SVG = '<svg viewBox="0 0 64 64" class="cf-prize"><defs><radialGradient id="cfm" cx=".4" cy=".35"><stop offset="0" stop-color="#fff4c2"/><stop offset=".55" stop-color="#f5c542"/><stop offset="1" stop-color="#a86f00"/></radialGradient></defs>'
  + '<path d="M22 2l10 14L42 2" fill="none" stroke="#ff2e4d" stroke-width="6"/><circle cx="32" cy="38" r="22" fill="url(#cfm)" stroke="#7a4b00" stroke-width="2"/>'
  + '<path d="M22 32a10 10 0 0 1 20 0M32 26v20M25 46h14" fill="none" stroke="#7a4b00" stroke-width="3" stroke-linecap="round"/><text x="32" y="44" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="9" fill="#7a4b00">VETO</text></svg>';

/** The board as of step `idx`: who has a result, what badge, who is out, who is in focus. */
export function compState(S, idx) {
  const C = S.comp;
  const shown = new Set(), out = new Set(), badge = {};
  let focus = [], win = null, rules = false;
  for (let i = 0; i <= idx && i < S.steps.length; i++) {
    const st = S.steps[i];
    for (const n of st.reveal || []) shown.add(n);
    if (st.badge && st.reveal?.length === 1) {
      badge[st.reveal[0]] = st.badge;
      if (/red|grey|gray/.test(st.badge[1] || '') || /THREW|OUT|NO |DROP|FELL|DQ/i.test(st.badge[0])) out.add(st.reveal[0]);
    }
    if (st.win) win = st.win;
  }
  const st = S.steps[idx];
  if (st) { focus = st.reveal || st.focus || (st.by ? [st.by] : []); rules = !!st.rules; }
  for (const n of C.threw || []) if (shown.has(n)) out.add(n);
  // once it is won, the whole board is known
  if (win) for (const n of C.players) shown.add(n);
  return { shown, out, badge, focus, win, rules };
}

function boardHtml(S, K) {
  const C = S.comp;
  const scores = C.scores || {};
  const max = Math.max(1, ...Object.values(scores).map(Number).filter(Number.isFinite));
  const order = C.placements?.length ? C.placements : C.players;
  const rank = n => { const i = order.indexOf(n); return i < 0 ? 99 : i; };
  // what the house has seen so far, best first; everybody else waits under it
  const known = C.players.filter(n => K.shown.has(n)).sort((x, y) => rank(x) - rank(y));
  const leader = known.find(n => !K.out.has(n)) || null;
  const row = n => {
    const sc = Number(scores[n]);
    const w = K.shown.has(n) && Number.isFinite(sc) ? Math.max(4, Math.round((sc / max) * 100)) : 0;
    const b = K.badge[n];
    return `<div class="cf-r ${K.out.has(n) ? 'out' : ''} ${n === K.win ? 'won' : ''} ${K.focus.includes(n) ? 'now' : ''}">
      <span class="cf-av" style="--c:${col(n)}">${img(n)}</span><b>${esc(n)}</b>${n === leader && !K.win ? svg(CROWN, 'cf-crown') : ''}
      <span class="cf-bar"><i style="width:${w}%"></i></span>${b ? `<em class="cf-bd ${esc(b[1])}">${esc(b[0])}</em>` : ''}</div>`;
  };
  const wait = C.players.filter(n => !K.shown.has(n));
  return `<div class="cf-board"><div class="cf-bh">${svg(catOf(C.cat).icon, 'cf-ci')}<span>${esc(C.kind === 'hoh' ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO')}</span><b>${esc(C.name)}</b></div>
    ${known.map(row).join('')}${wait.length ? `<div class="cf-wait">${wait.map(n => `<span class="cf-av sm" style="--c:${col(n)}" title="${esc(n)}">${img(n)}</span>`).join('')}<i>${wait.length} still playing</i></div>` : ''}
    ${C.out?.length ? `<div class="cf-sat">Sat out: ${C.out.map(esc).join(', ')}</div>` : ''}</div>`;
}

function fieldHtml(S, K, fresh) {
  const C = S.comp;
  const ps = C.players;
  const anim = catOf(C.cat).anim;
  // two rows across the field: the front row larger, the back row further away
  const front = ps.filter((_, i) => i % 2 === 0), back = ps.filter((_, i) => i % 2 === 1);
  const place = (row, y, w, z) => row.map((n, i) => {
    const x = row.length === 1 ? 50 : 12 + (76 * i) / (row.length - 1);
    const cls = [K.out.has(n) ? 'out' : '', K.focus.includes(n) ? `now do-${anim}` : '', n === K.win ? 'won' : '', fresh && K.focus.includes(n) ? 'fresh' : ''].join(' ');
    return `<div class="cf-p ${cls}" style="left:${x.toFixed(1)}%;bottom:${y}cqw;width:${w}cqw;z-index:${z};--c:${col(n)}"><div class="cf-t">${img(n)}</div><span>${esc(n)}</span>${anim === 'think' && K.focus.includes(n) ? '<i class="cf-dots"><i></i><i></i><i></i></i>' : ''}</div>`;
  }).join('');
  return `<div class="cf-field">${place(back, 14.5, 5.2, 4)}${place(front, 5.5, 6.6, 5)}</div>`;
}

function rulesHtml(S, fresh) {
  const C = S.comp;
  const c = catOf(C.cat);
  const stats = C.stats ? Object.entries(C.stats).sort((a, b) => b[1] - a[1]).slice(0, 4) : [];
  return `<div class="cf-rules ${fresh ? 'fresh' : ''}"><div class="cf-rk">${svg(c.icon, 'cf-ci')}<span>${esc(c.label)} competition</span></div>
    <b>${esc(C.name)}</b><p>${esc(C.desc)}</p>${stats.length ? `<div class="cf-st">${stats.map(([k, v]) => `<span>${esc(k)} <i>${Math.round(v * 100)}%</i></span>`).join('')}</div>` : ''}</div>`;
}

function heroHtml(S, K, fresh) {
  const C = S.comp;
  return `<div class="cf-hero ${fresh ? 'fresh' : ''}">${C.kind === 'hoh' ? KEY : MEDAL_SVG}<span class="cf-hl">${C.kind === 'hoh' ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</span>
    <div class="cf-hw" style="--c:${col(K.win)}">${img(K.win)}</div><b>${esc(K.win)}</b></div>`;
}

/** The comp field for a step: the field, the board, the rules card, the prize. */
export function compFieldHtml(S, L, st, fresh, idx) {
  if (!S.comp) return '';
  const K = compState(S, idx);
  // the Invisible HOH: nobody in the house sees who won, so the field never crowns anybody
  if (S.comp.secret) K.win = null;
  let h = fieldHtml(S, K, fresh);
  if (K.rules) h += rulesHtml(S, fresh);
  else h += boardHtml(S, K);
  if (K.win && st?.win) h += heroHtml(S, K, fresh);
  return h;
}

export const BBX_COMP_CSS = `
.bbx .stage .nfly{position:absolute;z-index:14;width:4.2cqw;transform:translate(-50%,0);pointer-events:none;animation:nfly 1.05s cubic-bezier(.45,.05,.3,1) both}
.bbx .stage .nfly .cf-prize{width:100%;height:auto;filter:drop-shadow(0 0 1.4cqw rgba(245,197,66,.9))}
@keyframes nfly{0%{transform:translate(-50%,0) scale(.5) rotate(-30deg);opacity:0}15%{transform:translate(-50%,-1.5cqw) scale(1.1) rotate(0);opacity:1}
  80%{transform:translate(calc(-50% + var(--dx)),var(--dy)) scale(.9) rotate(320deg);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),var(--dy)) scale(.2) rotate(360deg);opacity:0}}
.bbx .stage .nslot.flip{animation-delay:.8s !important}
.bbx .stage .vmedal{position:absolute;left:50%;top:9cqw;transform:translateX(-50%);z-index:13;display:flex;flex-direction:column;align-items:center;gap:.4cqw;pointer-events:none}
.bbx .stage .vmedal .cf-prize{width:10cqw;height:10cqw;filter:drop-shadow(0 0 2.2cqw rgba(245,197,66,.9))}
.bbx .stage .vmedal b{font:900 1.3cqw 'Chakra Petch';letter-spacing:.5cqw;color:#ffd166;text-shadow:0 0 1.2cqw rgba(245,197,66,.8)}
.bbx .stage .vmedal.fresh.used .cf-prize{animation:vm-used 1.4s cubic-bezier(.2,.9,.25,1.2) both}
@keyframes vm-used{0%{transform:translateY(-3cqw) rotateY(0) scale(.5);opacity:0}45%{transform:translateY(0) rotateY(540deg) scale(1.15);opacity:1}
  70%{filter:drop-shadow(0 0 4cqw #fff) brightness(1.6)}100%{transform:rotateY(720deg) scale(1)}}
.bbx .stage .vmedal.not .cf-prize{filter:grayscale(.85) brightness(.75) drop-shadow(0 0 1cqw rgba(0,0,0,.6))}
.bbx .stage .vmedal.not b{color:#c8ccd8;text-shadow:none}
.bbx .stage .vmedal.fresh.not .cf-prize{animation:vm-not 1.3s ease-out both}
@keyframes vm-not{0%{transform:scale(1.1);filter:none}100%{transform:rotateY(180deg) scale(.95)}}
.bbx .stage.exitcut.open .gt{animation:exit-open 2.8s cubic-bezier(.4,0,.2,1) both}
.bbx .stage.exitcut.out .gt{animation:exit-out 2.8s cubic-bezier(.4,0,.2,1) both}
@keyframes exit-open{from{transform:translateX(-50%)}to{transform:translateX(-50%) translateY(-6cqw) scale(.62)}}
@keyframes exit-out{from{transform:translateX(-50%) translateY(-6cqw) scale(.62);opacity:1}to{transform:translateX(-50%) translateY(-9cqw) scale(.4);opacity:.15}}
.bbx .stage.exitcut::after{content:'';position:absolute;left:36%;right:36%;top:14%;bottom:30%;z-index:3;pointer-events:none;
  background:radial-gradient(ellipse at 50% 60%,rgba(255,250,225,.95),rgba(255,214,120,.45) 45%,transparent 75%);mix-blend-mode:screen;animation:exitglow 2.4s ease-out both}
@keyframes exitglow{from{opacity:0;transform:scaleY(.4)}to{opacity:1;transform:none}}
.bbx .stage .cf-field{position:absolute;inset:0;z-index:4;pointer-events:none}
.bbx .stage .cf-p{position:absolute;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.25cqw;transition:filter .4s,opacity .4s,transform .35s}
.bbx .stage .cf-t{width:100%;aspect-ratio:4/5;border-radius:.8cqw;overflow:hidden;background:linear-gradient(180deg,var(--c),#0b1020);box-shadow:0 .5cqw 1.2cqw rgba(0,0,0,.45),0 0 0 .14cqw rgba(255,255,255,.25)}
.bbx .stage .cf-t img{width:100%;height:100%;object-fit:cover;object-position:50% 12%}
.bbx .stage .cf-p span{font:800 .78cqw 'Chakra Petch';letter-spacing:.08cqw;color:#fff;text-transform:uppercase;text-shadow:0 .1cqw .3cqw #000;white-space:nowrap}
.bbx .stage .cf-p.out{filter:grayscale(1) brightness(.55);opacity:.75}
.bbx .stage .cf-p.now{transform:translateX(-50%) translateY(-1.2cqw) scale(1.16);z-index:9 !important}
.bbx .stage .cf-p.now .cf-t{box-shadow:0 0 0 .22cqw #22e1ff,0 0 2.4cqw rgba(34,225,255,.55)}
.bbx .stage .cf-p.won .cf-t{box-shadow:0 0 0 .24cqw #f5c542,0 0 3cqw rgba(245,197,66,.8)}
.bbx .stage .cf-p.do-tremble .cf-t{animation:cf-tremble .18s linear infinite}
.bbx .stage .cf-p.do-run .cf-t{animation:cf-run .42s ease-in-out infinite}
.bbx .stage .cf-p.do-aim .cf-t{animation:cf-aim 1.1s ease-in-out infinite}
.bbx .stage .cf-p.do-buzz .cf-t{animation:cf-buzz .9s ease-in-out infinite}
.bbx .stage .cf-p.do-spin .cf-t{animation:cf-spin 1.6s ease-in-out infinite}
.bbx .stage .cf-p.do-sway .cf-t{animation:cf-sway 1.4s ease-in-out infinite}
.bbx .stage .cf-p.do-think .cf-t{animation:cf-think 2.2s ease-in-out infinite}
.bbx .stage .cf-p.do-aim::after{content:'';position:absolute;top:18%;left:50%;width:70%;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;
  border:.18cqw solid rgba(255,46,77,.85);box-shadow:inset 0 0 0 .5cqw rgba(255,46,77,.18);animation:cf-ring 1.1s ease-in-out infinite}
@keyframes cf-tremble{0%,100%{transform:translate(0,0)}25%{transform:translate(-.12cqw,.06cqw)}75%{transform:translate(.12cqw,-.06cqw)}}
@keyframes cf-run{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-.7cqw) rotate(2deg)}}
@keyframes cf-aim{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes cf-ring{0%,100%{transform:translateX(-50%) scale(1);opacity:.9}50%{transform:translateX(-50%) scale(.82);opacity:1}}
@keyframes cf-buzz{0%,70%,100%{filter:none}80%{filter:brightness(1.6) drop-shadow(0 0 1cqw #ffd166)}}
@keyframes cf-spin{0%,100%{transform:rotateY(0)}50%{transform:rotateY(180deg)}}
@keyframes cf-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes cf-think{0%,100%{transform:translateY(0)}50%{transform:translateY(-.25cqw)}}
.bbx .stage .cf-dots{position:absolute;top:-1.6cqw;right:-1.2cqw;display:flex;gap:.25cqw;padding:.35cqw .5cqw;border-radius:1cqw;background:#fff}
.bbx .stage .cf-dots i{width:.45cqw;height:.45cqw;border-radius:50%;background:#2b3550;animation:cf-dot 1s ease-in-out infinite}
.bbx .stage .cf-dots i:nth-child(2){animation-delay:.15s}.bbx .stage .cf-dots i:nth-child(3){animation-delay:.3s}
@keyframes cf-dot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-.2cqw)}}
.bbx .stage .cf-board{position:absolute;right:1.4cqw;top:6.6cqw;z-index:8;width:23cqw;padding:.8cqw .9cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(9,14,28,.92),rgba(9,14,28,.78));box-shadow:0 0 0 .1cqw rgba(34,225,255,.35),0 1cqw 2.4cqw rgba(0,0,0,.45);backdrop-filter:blur(.5cqw)}
.bbx .stage .cf-bh{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:.1cqw .6cqw;margin-bottom:.6cqw}
.bbx .stage .cf-bh .cf-ci{grid-row:span 2;width:2.2cqw;height:2.2cqw;color:#22e1ff}
.bbx .stage .cf-bh span{font:700 .6cqw 'Chakra Petch';letter-spacing:.2cqw;color:#7fe9ff}
.bbx .stage .cf-bh b{font:900 1.15cqw Archivo;color:#fff;letter-spacing:.03cqw}
.bbx .stage .cf-r{display:grid;grid-template-columns:2cqw auto auto 1fr auto;align-items:center;gap:.5cqw;padding:.32cqw .3cqw;border-radius:.5cqw;transition:background .3s}
.bbx .stage .cf-r b{font:800 .8cqw Archivo;color:#fff;white-space:nowrap}
.bbx .stage .cf-r.now{background:rgba(34,225,255,.14);animation:cf-in .45s ease-out}
.bbx .stage .cf-r.out{opacity:.5}
.bbx .stage .cf-r.out b{text-decoration:line-through;text-decoration-color:rgba(255,46,77,.8)}
.bbx .stage .cf-r.won{background:linear-gradient(90deg,rgba(245,197,66,.35),rgba(245,197,66,.05))}
@keyframes cf-in{from{transform:translateX(1cqw);opacity:0}to{transform:none;opacity:1}}
.bbx .stage .cf-av{display:block;width:2cqw;aspect-ratio:1;border-radius:50%;overflow:hidden;background:var(--c)}
.bbx .stage .cf-av.sm{width:1.5cqw}
.bbx .stage .cf-av img{width:100%;height:100%;object-fit:cover;object-position:50% 12%}
.bbx .stage .cf-crown{width:1.1cqw;height:1.1cqw}
.bbx .stage .cf-bar{height:.55cqw;border-radius:.3cqw;background:rgba(255,255,255,.1);overflow:hidden;min-width:3cqw}
.bbx .stage .cf-bar i{display:block;height:100%;border-radius:.3cqw;background:linear-gradient(90deg,#22e1ff,#7c5cff);transition:width .8s cubic-bezier(.2,.8,.2,1)}
.bbx .stage .cf-r.won .cf-bar i{background:linear-gradient(90deg,#f5c542,#ffe9a8)}
.bbx .stage .cf-bd{font:800 .5cqw 'Chakra Petch';letter-spacing:.1cqw;font-style:normal;padding:.15cqw .4cqw;border-radius:.3cqw;background:#24304a;color:#bfe8ff;white-space:nowrap}
.bbx .stage .cf-bd.red{background:#4a1220;color:#ff8fa3}.bbx .stage .cf-bd.grey{background:#2a2f3a;color:#aeb6c6}
.bbx .stage .cf-bd.gold,.bbx .stage .cf-bd.challenge{background:#3a2e08;color:#ffd166}
.bbx .stage .cf-wait{display:flex;flex-wrap:wrap;align-items:center;gap:.25cqw;margin-top:.5cqw;padding-top:.5cqw;border-top:.08cqw solid rgba(255,255,255,.1)}
.bbx .stage .cf-wait i{font:600 .58cqw 'Chakra Petch';color:#7d89a3;margin-left:.3cqw;font-style:normal;letter-spacing:.08cqw}
.bbx .stage .cf-sat{margin-top:.4cqw;font:600 .58cqw 'Chakra Petch';color:#7d89a3;letter-spacing:.06cqw}
.bbx .stage .cf-rules{position:absolute;left:50%;top:7.5cqw;transform:translateX(-50%);z-index:9;width:48cqw;padding:1.3cqw 1.6cqw;border-radius:1.2cqw;
  background:linear-gradient(160deg,rgba(12,20,40,.95),rgba(20,12,44,.9));box-shadow:0 0 0 .12cqw rgba(124,92,255,.55),0 1.4cqw 3cqw rgba(0,0,0,.5)}
.bbx .stage .cf-rules.fresh{animation:cf-drop .6s cubic-bezier(.2,.9,.25,1.2)}
@keyframes cf-drop{from{transform:translate(-50%,-2cqw) scale(.94);opacity:0}to{transform:translateX(-50%);opacity:1}}
.bbx .stage .cf-rk{display:flex;align-items:center;gap:.5cqw;font:700 .68cqw 'Chakra Petch';letter-spacing:.22cqw;color:#a593ff;text-transform:uppercase}
.bbx .stage .cf-rk .cf-ci{width:1.4cqw;height:1.4cqw;color:#a593ff}
.bbx .stage .cf-rules b{display:block;margin:.4cqw 0 .5cqw;font:900 2.4cqw Archivo;color:#fff;letter-spacing:.05cqw;text-shadow:0 0 1.6cqw rgba(124,92,255,.6)}
.bbx .stage .cf-rules p{margin:0;font:500 .95cqw/1.45 Inter,system-ui,sans-serif;color:#dbe6f7}
.bbx .stage .cf-st{display:flex;flex-wrap:wrap;gap:.4cqw;margin-top:.8cqw}
.bbx .stage .cf-st span{font:700 .6cqw 'Chakra Petch';letter-spacing:.1cqw;text-transform:uppercase;padding:.2cqw .55cqw;border-radius:.4cqw;background:rgba(124,92,255,.18);color:#cfc4ff}
.bbx .stage .cf-st i{font-style:normal;color:#fff}
.bbx .stage .cf-hero{position:absolute;left:50%;top:6cqw;transform:translateX(-50%);z-index:12;display:flex;flex-direction:column;align-items:center;gap:.4cqw;pointer-events:none}
.bbx .stage .cf-hero .cf-prize{width:9cqw;height:9cqw;filter:drop-shadow(0 0 2cqw rgba(245,197,66,.85))}
.bbx .stage .cf-hero.fresh .cf-prize{animation:cf-prize 1.2s cubic-bezier(.2,.9,.25,1.25)}
@keyframes cf-prize{0%{transform:translateY(-6cqw) rotate(-160deg) scale(.3);opacity:0}70%{transform:translateY(.4cqw) rotate(12deg) scale(1.08);opacity:1}100%{transform:none}}
.bbx .stage .cf-hl{font:900 1.05cqw 'Chakra Petch';letter-spacing:.42cqw;color:#ffd166;text-shadow:0 0 1.2cqw rgba(245,197,66,.8)}
.bbx .stage .cf-hw{width:7cqw;aspect-ratio:4/5;border-radius:1cqw;overflow:hidden;background:linear-gradient(180deg,var(--c),#0b1020);box-shadow:0 0 0 .26cqw #f5c542,0 0 3cqw rgba(245,197,66,.75)}
.bbx .stage .cf-hero.fresh .cf-hw{animation:cf-pop .7s .35s cubic-bezier(.2,.9,.25,1.4) both}
@keyframes cf-pop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
.bbx .stage .cf-hw img{width:100%;height:100%;object-fit:cover;object-position:50% 12%}
.bbx .stage .cf-hero b{font:900 1.9cqw Archivo;color:#fff;text-shadow:0 .2cqw 1cqw #000}
`;
