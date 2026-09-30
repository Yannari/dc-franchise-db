// ══════════════════════════════════════════════════════════════════════
// vp-dr/snatch-stage.js — the Snatch Game set, pinned above the cards
// ══════════════════════════════════════════════════════════════════════
//
// The Match Game panel rebuilt in light: two tiers of booths, each queen with
// her celebrity's name on a lit placard; RuPaul and the two contestants at
// the desk; the question card whose blank fills in as she answers; and the
// laugh-o-meter, a needle that swings on every answer. One state per reveal
// step, and nothing at rest says a result (docs/ADDING-A-SHOW.md §6.5).
//
// Approved as mockup/mockup-dr-snatch-game.html ("The Tiered Panel").
import { _portrait, _judgePortrait } from './style.js';
import { confetti } from './finale-stage.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clip = (t, n) => {
  const s = String(t || '');
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 20)).trimEnd()}…`;
};

/** The meter's words, bottom to top. */
/* The bands follow the engine's tiers (js/dr/chal/snatch-game.js): under 3
   is a dead answer, 3 to 6 a flat one, 6 and up a laugh. The meter must never
   call a flat answer "a laugh". */
export const LAUGH_WORDS = [[0, 'Crickets', '#8a8499'], [3, 'A chuckle', '#c9bfd8'], [6, 'A laugh', '#ffb238'],
  [7.5, 'A roar', '#ff3d8b'], [9.2, 'Ru lost it', '#ffd166']];
export const laughWord = v => LAUGH_WORDS.reduce((w, x) => (v >= x[0] ? x : w), LAUGH_WORDS[0]);

export const SNATCH_STAGE_CSS = `
.sgx{container-type:inline-size;--amber:#ffb238;--hot:#ff3d8b;--gold:#ffd166;--teal:#3ee0d0;--dead:#6f6a80;--card:#fff6e6;--card-ink:#2a1630;
  color:#f7eee2;padding:10px 12px 12px;
  background:radial-gradient(60% 55% at 50% 0,rgba(255,178,56,.34),transparent 70%),
    radial-gradient(40% 40% at 10% 100%,rgba(255,61,139,.24),transparent 70%),
    radial-gradient(40% 40% at 90% 100%,rgba(62,224,208,.18),transparent 70%),
    linear-gradient(180deg,#1a0b22,#0c0612);
  box-shadow:0 30px 80px -30px #000,inset 0 0 0 1px rgba(255,209,102,.28)}
.sgx::before{content:"";position:absolute;inset:-60%;z-index:-1;opacity:.16;pointer-events:none;
  background:repeating-conic-gradient(from 0deg at 50% 60%,var(--amber) 0 6deg,transparent 6deg 18deg);
  animation:sgx-spin 90s linear infinite;-webkit-mask:radial-gradient(closest-side,#000 30%,transparent);mask:radial-gradient(closest-side,#000 30%,transparent)}
@keyframes sgx-spin{to{transform:rotate(360deg)}}
.sgx .sgx-bulbs{position:absolute;inset:5px;border-radius:18px;pointer-events:none;z-index:3;opacity:.8;
  background:radial-gradient(circle,var(--gold) 1.6px,transparent 2.6px) 0 0/20px 20px repeat-x,
    radial-gradient(circle,var(--gold) 1.6px,transparent 2.6px) 0 100%/20px 20px repeat-x;animation:sgx-chase 1.2s steps(2) infinite}
@keyframes sgx-chase{50%{opacity:.35}}
.sgx-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:2px 4px 6px}
.sgx-logo{font:400 clamp(18px,3vw,26px)/1 'Anton','Impact',sans-serif;letter-spacing:.08em;color:var(--hot);
  text-shadow:0 0 6px var(--hot),0 0 20px var(--hot);animation:sgx-flick 6s infinite}
@keyframes sgx-flick{0%,92%,100%{opacity:1}93%{opacity:.45}95%{opacity:1}96%{opacity:.7}}
.sgx-pill{padding:2px 10px;border-radius:99px;background:rgba(20,8,28,.7);border:1px solid rgba(255,209,102,.35);
  font:600 10px/1.6 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);white-space:nowrap}
.sgx-grid{display:grid;grid-template-columns:128px minmax(0,1fr) 150px;gap:10px;align-items:start}
/* the desk: RuPaul and the two contestants */
.sgx-desk{position:relative;display:flex;flex-direction:column;gap:6px}
.sgx-ru,.sgx-con{display:flex;align-items:center;gap:7px;padding:5px 6px;border-radius:12px;background:rgba(20,8,28,.62);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);transition:box-shadow .4s,transform .4s}
.sgx-ru .dr-bust img,.sgx-ru .dr-initials{box-shadow:0 0 0 2px var(--hot);border-radius:50%}
.sgx-con .dr-bust img,.sgx-con .dr-initials{border-radius:50%}
.sgx-ru b,.sgx-con b{display:block;font:400 11px/1.05 'Anton',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.sgx-ru small,.sgx-con small{font-size:9px;color:#b8a6c0;letter-spacing:.08em;text-transform:uppercase}
.sgx-con.on{box-shadow:0 0 0 2px var(--teal),0 0 20px rgba(62,224,208,.4);transform:translateX(3px)}
.sgx-pts{display:flex;gap:3px;margin-top:3px}
.sgx-pts i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.1)}
.sgx-pts i.lit{background:var(--gold);box-shadow:0 0 8px var(--gold)}
/* Ru's line floats over the desk rather than pushing the stage taller. */
.sgx .sgx-bubble{position:absolute;left:112px;top:4px;z-index:5;max-width:min(260px,calc(100% - 116px));opacity:0;transform:scale(.6);transform-origin:top left;
  padding:6px 9px;border-radius:4px 12px 12px 12px;background:var(--hot);color:#fff;font:600 11.5px/1.3 system-ui,sans-serif;
  box-shadow:0 8px 22px rgba(0,0,0,.45);pointer-events:none;transition:opacity .25s,transform .35s cubic-bezier(.2,1.6,.4,1)}
.sgx .sgx-bubble.show{opacity:1;transform:none}
/* the question card */
.sgx-q{position:relative;margin:0 auto 8px;padding:7px 12px;border-radius:10px;background:var(--card);color:var(--card-ink);
  box-shadow:0 8px 24px rgba(0,0,0,.35),inset 0 0 0 3px rgba(255,178,56,.55);min-height:44px}
.sgx-q small{display:block;font:700 9px/1 system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#b0527a;margin-bottom:3px}
.sgx-q p{margin:0;font:600 clamp(13px,1.9vw,17px)/1.3 'Courier New',Courier,monospace}
.sgx-q.flip{animation:sgx-cardin .6s cubic-bezier(.2,1.2,.4,1)}
@keyframes sgx-cardin{from{transform:rotateX(90deg);opacity:0}}
.sgx-blank{display:inline-block;min-width:90px;padding:0 3px;border-bottom:3px solid var(--hot);color:var(--hot);font-weight:700}
.sgx-blank.typing::after{content:"|";animation:sgx-blink .7s steps(1) infinite}
@keyframes sgx-blink{50%{opacity:0}}
/* the panel */
.sgx-tiers{display:flex;flex-direction:column;gap:6px;perspective:900px}
.sgx-tier{display:grid;grid-template-columns:repeat(var(--n,4),minmax(0,1fr));gap:6px}
.sgx-tier.back{transform:scale(.95);margin:0 10px}
.sgx-booth{position:relative;border-radius:10px;padding:5px 4px 4px;text-align:center;background:#23102e;
  box-shadow:inset 0 0 0 1px #4a2a58,0 5px 12px rgba(0,0,0,.25);filter:saturate(.55) brightness(.7);transition:filter .4s,transform .4s,box-shadow .4s}
.sgx-booth .fsx-face{display:block;margin:0 auto;width:var(--bf,46px);height:var(--bf,46px);overflow:hidden;border-radius:8px}
.sgx-booth .fsx-face .dr-bust,.sgx-booth .fsx-face img,.sgx-booth .fsx-face .dr-initials{display:block;width:100%!important;height:100%!important;
  border-radius:8px;object-fit:cover;object-position:top;box-shadow:none}
.sgx-plac{display:block;margin-top:3px;padding:2px 3px;border-radius:5px;background:linear-gradient(180deg,#2a1432,#150a1b);
  font:400 9.5px/1.15 'Anton',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#ffd166;text-shadow:0 0 5px rgba(255,209,102,.6);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgx-qn{display:block;font-size:8.5px;color:#b8a6c0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgx-booth.on{filter:none;transform:translateY(-4px) scale(1.07);z-index:2;box-shadow:0 0 0 2px var(--amber),0 0 26px rgba(255,178,56,.55)}
.sgx-booth.dead{filter:grayscale(1) brightness(.45)}
.sgx-flag{position:absolute;top:-7px;right:-4px;padding:0 5px;border-radius:99px;font:700 8px/1.7 system-ui,sans-serif;letter-spacing:.1em;
  text-transform:uppercase;opacity:0}
.sgx-flag.show{opacity:1;animation:sgx-pop .5s cubic-bezier(.2,1.6,.4,1)}
.sgx-flag.kill{background:var(--gold);color:#2a1630}.sgx-flag.bomb{background:var(--dead);color:#fff}.sgx-flag.match{background:var(--teal);color:#032a24}
@keyframes sgx-pop{from{transform:scale(0)}}
/* the push-in on whoever is talking */
.sgx-close{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center;margin-top:8px;padding:7px 10px;border-radius:12px;
  background:rgba(20,8,28,.72);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);min-height:76px;opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s}
.sgx-close.show{opacity:1;transform:none}
.sgx-close .fsx-face{display:block;width:64px;height:64px;overflow:hidden;border-radius:12px;box-shadow:0 0 0 2px var(--amber)}
.sgx-close .fsx-face .dr-bust,.sgx-close .fsx-face img,.sgx-close .dr-initials{display:block;width:100%!important;height:100%!important;border-radius:12px;object-fit:cover;object-position:top}
.sgx-close b{font:400 14px/1 'Anton',sans-serif;letter-spacing:.05em;text-transform:uppercase}
.sgx-close small{color:#b8a6c0;font-size:10px;margin-left:6px}
.sgx-close p{margin:4px 0 0;font-size:12.5px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sgx-anscard{display:inline-block;margin:3px 0 0;padding:2px 8px;border-radius:5px;background:var(--card);color:var(--card-ink);
  font:700 12px 'Courier New',monospace;transform:rotate(-2deg);box-shadow:0 5px 12px rgba(0,0,0,.3);animation:sgx-up .5s cubic-bezier(.2,1.4,.4,1)}
@keyframes sgx-up{from{transform:translateY(18px) rotate(8deg);opacity:0}}
/* the laugh-o-meter */
.sgx-meter{padding:7px 7px 8px;border-radius:12px;background:rgba(20,8,28,.62);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);text-align:center}
.sgx-meter h4{margin:0 0 2px;font:400 10.5px/1 'Anton',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
.sgx-dial{width:128px;height:72px;margin:0 auto;display:block;overflow:visible;color:#fff}
.sgx-needle{transform-origin:64px 66px;transform:rotate(-80deg);transition:transform 1.1s cubic-bezier(.3,1.6,.45,1)}
.sgx-word{display:block;min-height:18px;font:400 14px/1.2 'Anton',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8a8499;transition:color .3s}
.sgx-signs{display:flex;justify-content:center;gap:3px;margin-top:4px;flex-wrap:wrap}
.sgx-sign{padding:2px 5px;border-radius:4px;font:400 8.5px/1 'Anton',sans-serif;letter-spacing:.12em;border:1px solid #4a2a58;color:#8f7f99;transition:all .3s}
.sgx-sign.on{color:#2a1630;background:var(--gold);border-color:var(--gold);box-shadow:0 0 14px var(--gold);animation:sgx-flash .5s 4}
.sgx-sign.crick.on{background:var(--dead);border-color:var(--dead);color:#fff;box-shadow:none;animation:none}
@keyframes sgx-flash{50%{filter:brightness(1.6)}}
/* the MATCH */
.sgx .sgx-toast{position:absolute;left:50%;top:48%;z-index:6;transform:translate(-50%,-50%) scale(.3);opacity:0;pointer-events:none;
  font:400 clamp(38px,7vw,70px)/1 'Anton',sans-serif;letter-spacing:.1em;color:var(--teal);text-shadow:0 0 10px var(--teal),0 0 36px var(--teal)}
.sgx-toast.go{animation:sgx-boom 1.6s cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes sgx-boom{15%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}70%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-62%)}}
.sgx.laughing .sgx-ru{animation:sgx-shake .5s 3}
@keyframes sgx-shake{25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
/* the cards under the stage */
.sgc{display:flex;gap:10px;align-items:flex-start;padding:9px 11px;border-radius:12px;background:rgba(26,11,34,.82);box-shadow:inset 0 0 0 1px rgba(255,209,102,.16)}
.sgc.kill{box-shadow:inset 0 0 0 1px rgba(255,209,102,.7),0 0 22px -8px #ffd166}
.sgc.bomb{opacity:.92;box-shadow:inset 0 0 0 1px rgba(138,132,153,.55)}
.sgc-tag{display:block;font:700 9.5px/1.4 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#ffd166}
.sgc p{margin:3px 0 0;font-size:13.5px;line-height:1.5}
.sgc .card{display:inline-block;padding:1px 7px;border-radius:4px;background:#fff6e6;color:#2a1630;font:700 12.5px 'Courier New',monospace}
.sgc .ru{color:#ff9cc6}
.sgc .lg{display:inline-block;margin-left:6px;padding:0 7px;border-radius:99px;font:700 9.5px/1.7 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase}
/* THE STAGE'S OWN WIDTH, not the window's: inside the viewer the column
   beside the rail is narrow on a wide screen too. Below 760px of stage the
   desk and the meter share the top row and the panel gets the full width. */
@container (max-width: 760px){
  .sgx-grid{grid-template-columns:minmax(0,1fr) 138px;grid-template-areas:"desk meter" "q q" "tiers tiers" "close close"}
  .sgx-mid{display:contents}
  .sgx-desk{grid-area:desk;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start}
  .sgx-ru,.sgx-bubble{grid-column:1 / -1}
  .sgx-meter{grid-area:meter}.sgx-q{grid-area:q;margin-bottom:0}.sgx-tiers{grid-area:tiers}.sgx-close{grid-area:close;margin-top:0}
  .sgx-dial{width:100px;height:56px}.sgx-meter{padding:5px}
  .sgx{--bf:34px}.sgx-tier{gap:4px}.sgx-tier.back{margin:0 6px}
  .sgx-qn{display:none}.sgx-booth{padding:4px 3px 3px}
  .sgx-top{margin-bottom:4px}.sgx-logo{font-size:19px}
  .sgx-ru,.sgx-con{padding:3px 5px}
  .sgx-close{min-height:58px;padding:5px 8px}
  .sgx-close .fsx-face{width:50px;height:50px}
  .sgx-close p{-webkit-line-clamp:2;font-size:12px}
}
@container (max-width: 440px){
  .sgx-grid{grid-template-columns:minmax(0,1fr) 96px;gap:6px}
  .sgx-desk{grid-template-columns:minmax(0,1fr);gap:4px}
  .sgx-ru .dr-bust img,.sgx-con .dr-bust img,.sgx-ru .dr-initials,.sgx-con .dr-initials{width:28px!important;height:28px!important}
  .sgx .sgx-bubble{left:104px;max-width:calc(100% - 108px)}
  .sgx-meter{padding:4px}.sgx-meter h4{font-size:8.5px;letter-spacing:.1em}.sgx-signs{display:none}
  .sgx-dial{width:86px;height:48px}.sgx-word{font-size:12px}
  .sgx{--bf:30px}.sgx-plac{font-size:7.5px}
  .sgx-close .fsx-face{width:44px;height:44px}
}
/* The stage is taller than the kit's default, so the revealed card lands
   below it rather than under it. */
.sgx ~ * .dr-step{scroll-margin-top:480px}
@media (max-width: 760px){.sgx ~ * .dr-step{scroll-margin-top:420px}}
@media (prefers-reduced-motion:reduce){.sgx *,.sgx::before{animation:none!important;transition:none!important}}
`;

const faceOf = (name, ep, size) => `<span class="fsx-face">${name ? _portrait(name, ep, { size }) : ''}</span>`;

/** A contestant's face: a panel judge, or tonight's guest off the roster. */
function contestantFace(c, ep, size) {
  if (!c) return '';
  if (String(c.id).startsWith('guest:')) return _portrait(c.name, ep, { slug: c.slug || undefined, size });
  try { return _judgePortrait(c.id, { stage: true, size, name: c.name }); } catch { return _judgePortrait(`guest:${c.name}`, { size, name: c.name }); }
}

/**
 * `seat`: the queens in panel order, with { name, character }.
 * `states`: one per reveal step (see rpBuildSnatchGame for the shape).
 */
export function snatchStage({ ep, seat = [], contestants = [], states = [], uid = 'x' }) {
  const id = `sgx-${uid}`;
  const half = Math.ceil(seat.length / 2);
  const tiers = [seat.slice(0, half), seat.slice(half)];
  const booth = (q, i) => `<div class="sgx-booth" data-b="${esc(q.name)}"><span class="sgx-flag"></span>
      ${faceOf(q.name, ep, 46)}<span class="sgx-plac">${esc(q.character || '???')}</span><span class="sgx-qn">${esc(q.name)}</span></div>`;
  const html = `<!--dr-chrome--><div class="fsx sgx" id="${id}">
    <div class="sgx-bulbs"></div>
    <div class="sgx-top"><span class="sgx-logo">SNATCH GAME</span><span class="sgx-pill" data-pill>The panel</span></div>
    <div class="sgx-grid">
      <div class="sgx-desk">
        <div class="sgx-ru">${_judgePortrait('rupaul', { stage: true, size: 44 })}<div><b>RuPaul</b><small>Host</small></div></div>
        <div class="sgx-bubble" data-bubble></div>
        ${contestants.map((c, k) => `<div class="sgx-con" data-con="${k}">${contestantFace(c, ep, 34)}<div><b>${esc(c.name)}</b>
          <small>Playing</small><div class="sgx-pts">${[0, 1, 2].map(() => '<i></i>').join('')}</div></div></div>`).join('')}
      </div>
      <div class="sgx-mid">
        <div class="sgx-q" data-q><small data-qfor>Tonight's panel</small><p data-qtext>Welcome to the Snatch Game.</p></div>
        <div class="sgx-tiers">${tiers.map((t, k) => `<div class="sgx-tier${k ? '' : ' back'}" style="--n:${Math.max(t.length, 1)}">${t.map(booth).join('')}</div>`).join('')}</div>
        <div class="sgx-close" data-close></div>
      </div>
      <div class="sgx-meter">
        <div><h4>Laugh-o-meter</h4>
          <svg class="sgx-dial" viewBox="0 0 128 72" aria-hidden="true"><defs><linearGradient id="${id}-arc" x1="0" x2="1">
            <stop offset="0" stop-color="#6f6a80"/><stop offset=".45" stop-color="#ffb238"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient></defs>
            <path d="M10 66 A54 54 0 0 1 118 66" fill="none" stroke="url(#${id}-arc)" stroke-width="10" stroke-linecap="round"/>
            <g class="sgx-needle" data-needle><line x1="64" y1="66" x2="64" y2="18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="64" cy="66" r="5" fill="currentColor"/></g></svg>
          <span class="sgx-word" data-word>—</span></div>
        <div class="sgx-signs"><span class="sgx-sign crick" data-s="crick">CRICKETS</span><span class="sgx-sign" data-s="laugh">LAUGH</span><span class="sgx-sign" data-s="app">APPLAUSE</span></div>
      </div>
    </div>
    <div class="sgx-toast" data-toast>MATCH!</div>
    <div class="fsx-burst">${confetti()}</div>
  </div><!--/dr-chrome-->`;

  let typer = null;
  let prev = -99;
  const apply = idx => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (!el) return;
    const st = idx < 0 ? null : states[Math.min(idx, states.length - 1)];
    const fresh = idx === prev + 1;
    prev = idx;
    clearInterval(typer);
    el.classList.remove('burst', 'laughing');
    el.querySelector('[data-pill]').textContent = st?.pill || 'The panel';
    // The question card, and whatever is in the blank right now.
    const qEl = el.querySelector('[data-q]');
    el.querySelector('[data-qfor]').textContent = st?.qfor || "Tonight's panel";
    const qText = el.querySelector('[data-qtext]');
    if (st?.question) {
      const [pre, post] = String(st.question).split('___');
      qText.innerHTML = `${esc(pre)}<span class="sgx-blank" data-blank></span>${esc(post ?? '')}`;
      const bl = qText.querySelector('[data-blank]');
      const fill = st.blank || '';
      if (fill && fresh && st.type) {
        bl.classList.add('typing');
        let n = 0;
        typer = setInterval(() => { bl.textContent = fill.slice(0, ++n); if (n >= fill.length) { clearInterval(typer); bl.classList.remove('typing'); } }, 32);
      } else bl.innerHTML = fill ? esc(fill) : '&nbsp;';
    } else qText.textContent = st?.headline || 'Welcome to the Snatch Game.';
    if (st?.newCard && fresh) { qEl.classList.remove('flip'); void qEl.offsetWidth; qEl.classList.add('flip'); }
    // The booths: who is on camera, who has been flagged, who has died.
    for (const b of el.querySelectorAll('[data-b]')) {
      const n = b.dataset.b;
      b.classList.toggle('on', !!st && (st.on || []).includes(n));
      b.classList.toggle('dead', !!st && (st.dead || []).includes(n));
      const f = b.querySelector('.sgx-flag');
      const flag = st?.flags?.[n];
      f.className = `sgx-flag${flag ? ` ${flag} show` : ''}`;
      f.textContent = flag === 'kill' ? 'killing it' : flag === 'bomb' ? 'dying' : flag === 'match' ? 'match' : '';
    }
    // The desk.
    for (const c of el.querySelectorAll('[data-con]')) {
      const k = Number(c.dataset.con);
      c.classList.toggle('on', st?.asker === k);
      [...c.querySelectorAll('.sgx-pts i')].forEach((d, i) => d.classList.toggle('lit', i < (st?.points?.[k] || 0)));
    }
    const bub = el.querySelector('[data-bubble]');
    bub.classList.remove('show');
    bub.textContent = st?.bubble || '';
    if (st?.bubble) setTimeout(() => bub.classList.add('show'), fresh ? 250 : 0);
    // The push-in.
    const close = el.querySelector('[data-close]');
    close.classList.remove('show');
    if (st?.close) {
      close.innerHTML = `${st.close.face}<div><b>${esc(st.close.title)}</b><small>${esc(st.close.sub || '')}</small>
        ${st.close.card ? `<br><span class="sgx-anscard">${esc(st.close.card)}</span>` : ''}<p>${esc(clip(st.close.text, 220))}</p></div>`;
      // Only this step's frame may reveal it; a click-through faster than a
      // frame must not light an earlier step's strip over this one.
      const mine = idx;
      requestAnimationFrame(() => { if (prev === mine) close.classList.add('show'); });
    } else close.innerHTML = '';
    // The meter.
    const v = st?.laugh;
    const needle = el.querySelector('[data-needle]');
    needle.style.transform = `rotate(${-80 + (Math.min(10, Math.max(0, v ?? 0)) / 10) * 160}deg)`;
    const word = el.querySelector('[data-word]');
    if (v == null) { word.textContent = '—'; word.style.color = ''; } else {
      const w = laughWord(v); word.textContent = w[1]; word.style.color = w[2];
    }
    el.querySelector('[data-s="crick"]').classList.toggle('on', v != null && v < 3);
    el.querySelector('[data-s="laugh"]').classList.toggle('on', v != null && v >= 6 && v < 7.5);
    el.querySelector('[data-s="app"]').classList.toggle('on', v != null && v >= 7.5);
    if (fresh && v != null && v >= 8.5) el.classList.add('laughing');
    // The match.
    const toast = el.querySelector('[data-toast]');
    toast.classList.remove('go');
    if (fresh && st?.match) { void toast.offsetWidth; toast.classList.add('go'); el.classList.add('burst'); }
  };
  return { html, apply, states };
}

export { faceOf, contestantFace };
