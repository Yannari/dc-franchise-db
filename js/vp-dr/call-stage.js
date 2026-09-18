// ══════════════════════════════════════════════════════════════════════
// vp-dr/call-stage.js — the call, staged on the main stage
// ══════════════════════════════════════════════════════════════════════
//
// The call screen was a row of portraits and a column of rubber stamps. This
// is the stage the call happens on, pinned above the cards:
//   - the host at the podium, and the queens the panel kept back standing in
//     a line under their own lights, in the order the critiques ranked them
//     (the call order would print the answer across the top of the screen);
//   - a SPOTLIGHT that swings to the queen being called. A top queen steps
//     forward into gold or silver, a low one steps back, a bottom queen is lit
//     red. Her tag flips to the word the host said, with the panel's rank
//     beside the host's when the host moved her;
//   - the win lands as a CONDRAGULATIONS banner with confetti, the bottom as a
//     red wash, and the host's pause drops the lights to a heartbeat while the
//     spotlight hunts along the queens still waiting;
//   - a CONFESSIONAL cuts away: the stage goes grey and one queen talks to
//     camera;
//   - the stakes (what the song is for) close it with the two who sing
//     pulsing red under a LIP SYNC FOR YOUR LIFE banner.
//
// Every step's state is built here from the screen's own step list, so the
// stage never runs ahead of the card that has been revealed. Reduced motion
// shows the end states and moves nothing.
import { _portrait, _judgePortrait } from './style.js';
import { GRID_RESULTS } from '../dr/grid.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const spread = (n, seed) => {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return Array.from({ length: n }, () => ({ a: r(), b: r(), c: r(), d: r() }));
};

const STAKES = {
  life: 'Lip sync for your life', win: 'Lip sync for the win', legacy: 'Lip sync for your legacy',
  // Revenge of the Queens: the two singing are not in the competition yet.
  place: 'Lip sync for her place',
};
const MOOD = { WIN: 'win', HIGH: 'high', SAFE: 'safe', LOW: 'low', BTM: 'low', BTM2: 'btm' };

export const CALL_CSS = `
.csx{position:relative;isolation:isolate;overflow:hidden;border-radius:22px;margin:0 0 18px;padding:12px 16px 14px;
  background:radial-gradient(120% 80% at 50% 0,#2a0b3a 0,#12051c 50%,#07020b 100%);
  box-shadow:0 30px 80px -30px #000,inset 0 0 0 1px rgba(255,255,255,.07);color:#fff}
/* Always pinned; smaller on a shorter window. */
.csx{position:sticky;top:6px;z-index:5}
.csx{contain:inline-size;min-width:0;max-width:100%}
.csx-cards .dr-step{scroll-margin-top:470px}
.csx-bg,.csx-bg i{position:absolute;inset:0;pointer-events:none}
.csx-bg{z-index:0;transition:filter .6s}
.csx > *:not(.csx-bg){position:relative;z-index:1}
.csx > .csx-conf,.csx > .csx-banner,.csx > .csx-confetti,.csx > .csx-spot{position:absolute}
.csx > .csx-conf{z-index:6}.csx > .csx-banner{z-index:4}.csx > .csx-confetti{z-index:3}.csx > .csx-spot{z-index:0}
.csx-floor{background:linear-gradient(0deg,rgba(255,61,154,.16),transparent 38%)}
.csx-rays{opacity:.5;background:repeating-conic-gradient(from 180deg at 50% -10%,rgba(255,255,255,.05) 0 4deg,transparent 4deg 12deg)}
.csx-vig{box-shadow:inset 0 0 120px 40px rgba(0,0,0,.8);opacity:.45;transition:opacity .6s}
.csx-wash{opacity:0;transition:opacity .6s,background .6s}
.csx[data-mood=btm] .csx-wash{opacity:1;background:radial-gradient(90% 70% at 50% 100%,rgba(255,30,60,.35),transparent 70%)}
.csx[data-mood=win] .csx-wash{opacity:1;background:radial-gradient(90% 70% at 50% 60%,rgba(255,214,107,.28),transparent 70%)}
.csx[data-mood=high] .csx-wash{opacity:1;background:radial-gradient(90% 70% at 50% 60%,rgba(200,220,255,.18),transparent 70%)}
.csx[data-phase=stakes] .csx-wash{opacity:1;background:radial-gradient(100% 80% at 50% 100%,rgba(255,30,60,.45),transparent 75%)}

/* the host */
.csx-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.csx-title{font:400 22px/1 'Anton','Impact',sans-serif;letter-spacing:.08em;text-transform:uppercase}
.csx-title small{display:block;margin-top:3px;font:600 10px/1 system-ui,sans-serif;letter-spacing:.24em;color:#d9b3ff}
.csx-host{display:flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;border-radius:99px;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.csx-host .csx-hface{width:38px;height:38px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px #ffd66b}
.csx-host .csx-hface > *,.csx-host .csx-hface img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.csx-host svg{width:26px;height:26px}
.csx-host .csx-hlabel{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#ffd66b}
.csx[data-phase=call] .csx-host,.csx[data-phase=stakes] .csx-host{box-shadow:0 0 18px rgba(255,214,107,.35)}

/* the line */
.csx-line{position:relative;display:flex;justify-content:center;align-items:flex-end;gap:clamp(6px,1.6vw,18px);
  flex-wrap:wrap;min-height:190px;margin-top:10px;padding-top:26px}
.csx-q{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;width:clamp(76px,11vw,112px);
  transition:transform .6s cubic-bezier(.2,1.4,.4,1),filter .6s,opacity .6s}
.csx-face{width:clamp(62px,8.4vw,88px);aspect-ratio:1;border-radius:50%;overflow:hidden;
  box-shadow:0 0 0 3px rgba(255,255,255,.14),0 14px 30px -10px #000;transition:box-shadow .5s}
.csx-face > *,.csx-face img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.csx-q b{font:400 14px/1 'Anton','Impact',sans-serif;letter-spacing:.04em;text-transform:uppercase;text-align:center;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.csx-team{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#c9a6bc;min-height:10px}
.csx-tag{min-width:62px;padding:4px 8px;border-radius:6px;text-align:center;font:400 13px/1 'Anton','Impact',sans-serif;
  letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.06);color:#6f5a78;
  transform:rotateX(90deg);transition:transform .45s cubic-bezier(.2,1.4,.4,1),background .3s,color .3s}
.csx-q.called .csx-tag{transform:none;background:var(--rc);color:var(--rt,#12051c)}
.csx-moved{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#ffd66b;opacity:0;transition:opacity .4s;white-space:nowrap}
.csx-q.called .csx-moved{opacity:1}
.csx-q::before{content:'';position:absolute;top:-26px;left:50%;width:120px;height:170px;transform:translateX(-50%);z-index:-1;
  background:linear-gradient(180deg,rgba(255,240,230,.22),transparent 80%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);
  opacity:.25;transition:opacity .5s,background .5s}

/* where each call puts her */
.csx-q.r-win{transform:translateY(-12px) scale(1.12)}
.csx-q.r-win .csx-face{box-shadow:0 0 0 4px #ffd66b,0 0 50px 12px rgba(255,214,107,.6)}
.csx-q.r-win::before{opacity:1;background:linear-gradient(180deg,rgba(255,230,150,.55),transparent 80%)}
.csx-q.r-high{transform:translateY(-7px) scale(1.05)}
.csx-q.r-high .csx-face{box-shadow:0 0 0 3px #cfe0ff,0 0 34px 6px rgba(190,210,255,.45)}
.csx-q.r-high::before{opacity:.7}
.csx-q.r-low{transform:translateY(6px) scale(.97);filter:saturate(.75)}
.csx-q.r-low .csx-face{box-shadow:0 0 0 3px #ff9f5a}
.csx-q.r-btm{transform:translateY(10px)}
.csx-q.r-btm .csx-face{box-shadow:0 0 0 4px #ff294b,0 0 40px 10px rgba(255,41,75,.5)}
.csx-q.r-btm::before{opacity:.9;background:linear-gradient(180deg,rgba(255,60,80,.45),transparent 80%)}
.csx.any .csx-q:not(.now):not(.called){filter:brightness(.55)}
.csx-q.now{z-index:2}
.csx-q.now .csx-face{animation:csx-pop .6s cubic-bezier(.2,1.6,.4,1)}
@keyframes csx-pop{0%{transform:scale(.85)}60%{transform:scale(1.12)}100%{transform:scale(1)}}
.csx[data-phase=stakes] .csx-q.sing{animation:csx-throb 1s ease-in-out infinite}
@keyframes csx-throb{50%{filter:drop-shadow(0 0 14px rgba(255,41,75,.9))}}
.csx[data-phase=stakes] .csx-q:not(.sing){filter:brightness(.45) saturate(.5)}

/* the spotlight */
.csx-spot{top:0;bottom:0;left:50%;width:220px;margin-left:-110px;pointer-events:none;opacity:0;
  background:radial-gradient(40% 30% at 50% 78%,rgba(255,255,255,.28),transparent 70%),
    linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.04) 70%,transparent);
  clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);transition:left .7s cubic-bezier(.3,1.3,.5,1),opacity .4s}
.csx.lit .csx-spot{opacity:1}
.csx[data-phase=hold] .csx-spot{opacity:1;animation:csx-hunt 2.4s ease-in-out infinite alternate}
@keyframes csx-hunt{from{transform:translateX(calc(var(--hunt,120px) * -1))}to{transform:translateX(var(--hunt,120px))}}

/* the tally */
.csx-tally{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:10px}
.csx-tally span{display:flex;align-items:center;gap:5px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#9d8193}
.csx-tally i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.1);transition:background .4s,box-shadow .4s}
.csx-tally i.on{background:var(--rc);box-shadow:0 0 8px var(--rc)}

/* the banner */
.csx-banner{left:0;right:0;top:38%;text-align:center;pointer-events:none;opacity:0;transform:scale(.6)}
.csx-banner b{display:inline-block;padding:6px 24px;font:400 clamp(30px,5.4vw,56px)/1 'Anton','Impact',sans-serif;letter-spacing:.05em;
  text-transform:uppercase;color:#fff;text-shadow:0 0 28px #ffd66b,0 5px 0 #7a4a00;
  background:linear-gradient(90deg,transparent,rgba(255,214,107,.3),transparent)}
.csx-banner small{display:block;margin-top:6px;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#ffd66b}
.csx-banner.red b{text-shadow:0 0 28px #ff294b,0 5px 0 #5a0014;background:linear-gradient(90deg,transparent,rgba(255,41,75,.35),transparent)}
.csx-banner.red small{color:#ff9fb0}
.csx-banner.show{animation:csx-banner .7s cubic-bezier(.2,1.5,.4,1) forwards}
/* Big, then gone: the line under it is the thing to read, and the headline
   pill in the header keeps the word up until the next card. */
.csx-banner.show{animation-duration:2.6s}
@keyframes csx-banner{0%{opacity:0;transform:scale(.6)}15%{opacity:1;transform:scale(1.06)}25%{transform:scale(1)}75%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.92)}}
.csx-head{flex:1 1 auto;display:flex;justify-content:center;min-width:0}
.csx-head span{padding:4px 14px;border-radius:99px;font:400 15px/1.1 'Anton','Impact',sans-serif;letter-spacing:.08em;text-transform:uppercase;
  color:#2a1a00;background:linear-gradient(90deg,#ffd66b,#fff1a8);box-shadow:0 0 18px rgba(255,214,107,.5);
  opacity:0;transform:translateY(-6px);transition:opacity .4s .9s,transform .4s .9s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.csx-head span.on{opacity:1;transform:none}
.csx-head span.red{color:#fff;background:linear-gradient(90deg,#ff294b,#ff6b8a);box-shadow:0 0 18px rgba(255,41,75,.55)}
.csx-head span small{font:600 10px/1 system-ui,sans-serif;letter-spacing:.16em;margin-left:8px;opacity:.85}
.csx-confetti{left:50%;top:40%;width:0;height:0;pointer-events:none}
.csx-confetti i{position:absolute;width:var(--w);height:calc(var(--w) * .5);background:var(--c);opacity:0;border-radius:1px}
.csx.burst .csx-confetti i{animation:csx-fall var(--t) cubic-bezier(.1,.7,.3,1) var(--dl) forwards}
@keyframes csx-fall{0%{opacity:1;transform:translate(0,0) rotate(0)}85%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) rotate(var(--r))}}
.csx.shake{animation:csx-shake .45s linear}
@keyframes csx-shake{20%{transform:translateX(-5px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}

/* the pause */
.csx[data-phase=hold] .csx-vig{opacity:1;animation:csx-heart 1s ease-in-out infinite}
@keyframes csx-heart{0%,100%{box-shadow:inset 0 0 120px 40px rgba(0,0,0,.85)}15%{box-shadow:inset 0 0 190px 80px rgba(40,0,30,.95)}30%{box-shadow:inset 0 0 120px 40px rgba(0,0,0,.85)}45%{box-shadow:inset 0 0 170px 60px rgba(40,0,30,.9)}}
.csx[data-phase=hold] .csx-q:not(.called){filter:brightness(.75)}

/* the confessional cut */
.csx[data-phase=confess] .csx-bg,.csx[data-phase=confess] .csx-line,.csx[data-phase=confess] .csx-tally{filter:grayscale(1) brightness(.4)}
.csx-conf{inset:0;display:flex;align-items:center;justify-content:center;gap:18px;padding:20px;opacity:0;pointer-events:none;transition:opacity .35s}
.csx[data-phase=confess] .csx-conf{opacity:1}
.csx-conf .csx-cframe{position:relative;flex:0 0 130px;width:130px;height:130px;border-radius:18px;overflow:hidden;
  box-shadow:0 0 0 3px #b07aff,0 20px 50px rgba(0,0,0,.8);transform:rotate(-3deg)}
.csx-conf .csx-cframe > *,.csx-conf .csx-cframe img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.csx-conf .csx-cbody{max-width:460px;padding:14px 18px;border-radius:16px;background:rgba(20,8,30,.92);border:1px solid rgba(176,122,255,.5)}
.csx-conf small{display:inline-block;margin-bottom:8px;padding:3px 10px;border-radius:99px;background:#b07aff;color:#12051f;
  font-size:10px;letter-spacing:.28em;text-transform:uppercase}
.csx-conf q{display:block;font-size:17px;line-height:1.45;font-style:italic;quotes:none}
.csx[data-phase=confess] .csx-cframe{animation:csx-in .45s cubic-bezier(.2,1.4,.4,1)}
@keyframes csx-in{from{transform:rotate(-10deg) translateX(-40px);opacity:0}}

/* the cards under the stage */
.csx-cards .dr-panel.csx-cconf{border-color:rgba(176,122,255,.5);background:linear-gradient(180deg,rgba(60,22,96,.5),rgba(30,10,48,.5))}
.csx-cards .dr-panel.csx-cconf p{font-style:italic}
.csx-cards .csx-ctag{display:inline-block;margin-bottom:4px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#cbb3ff}

@media (prefers-reduced-motion: reduce){
  .csx,.csx *{animation:none!important;transition:none!important}
  .csx-banner.show{opacity:0}
}
/* Last, so it wins over the base sizes above. */
@media (max-height: 999px){
  .csx{padding:8px 12px 10px}
  .csx-title{font-size:17px}
  .csx-host .csx-hface{width:30px;height:30px}
  .csx-line{min-height:0;margin-top:4px;padding-top:16px}
  .csx-face{width:clamp(48px,6.2vw,64px)}
  .csx-q{width:clamp(64px,9vw,92px);gap:3px}
  .csx-q b{font-size:12px}
  .csx-tag{font-size:11px;min-width:52px;padding:3px 6px}
  .csx-q::before{height:120px;top:-16px}
  .csx-tally{margin-top:6px}
  .csx-banner b{font-size:clamp(24px,4vw,38px)}
  .csx-conf{padding:10px;gap:12px}
  .csx-conf .csx-cframe{flex-basis:80px;width:80px;height:80px}
  .csx-conf q{font-size:14px}
  .csx-cards .dr-step{scroll-margin-top:330px}
}
/* A phone: the line is most of the stage, so it shrinks hardest. */
@media (max-width: 560px){
  .csx-host .csx-hlabel{display:none}
  .csx-head{order:3;flex-basis:100%}
  .csx-line{gap:4px 6px;padding-top:12px}
  .csx-q{width:62px;gap:2px}
  .csx-face{width:44px}
  .csx-q b{font-size:11px}
  .csx-team,.csx-moved{display:none}
  .csx-tag{font-size:10px;min-width:48px;padding:2px 4px}
  .csx-q::before{width:80px;height:90px;top:-12px}
  .csx-cards .dr-step{scroll-margin-top:300px}
}
`;

function podiumSvg() {
  return `<svg viewBox="0 0 32 32" aria-hidden="true">
    <path d="M9 13h14l-2 16H11z" fill="#ffd66b"/><path d="M8 11h16v3H8z" fill="#fff1a8"/>
    <path d="M16 11V5" stroke="#fff" stroke-width="1.6"/><circle cx="16" cy="4" r="2.2" fill="#ff3d9a"/>
    <path d="M13 19h6" stroke="#7a4a00" stroke-width="1.4"/></svg>`;
}

function confetti(n = 34) {
  const cols = ['#ffd66b', '#fff1a8', '#ff7bc8', '#ffffff', '#b07aff'];
  return spread(n, 23).map((p, i) => {
    const ang = -Math.PI / 2 + (p.a - 0.5) * Math.PI * 1.6;
    const dist = 110 + p.b * 240;
    return `<i style="--x:${Math.round(Math.cos(ang) * dist)}px;--y:${Math.round(Math.sin(ang) * dist + 120 * p.d)}px;`
      + `--r:${Math.round((p.c - 0.5) * 900)}deg;--t:${(1.1 + p.d * 0.9).toFixed(2)}s;--dl:${(p.c * 0.2).toFixed(2)}s;`
      + `--w:${8 + Math.round(p.d * 8)}px;--c:${cols[i % cols.length]}"></i>`;
  }).join('');
}

/**
 * The stage and a function that applies step `idx` to it.
 *
 * `steps` is the call screen's own step list, in reveal order:
 *   { t: 'call', r, n }        the host names queen `n` with result `r` (already
 *                              the word shown: a pending save's bottom is LOW)
 *   { t: 'hold' }              the host's pause before the last block
 *   { t: 'confess', n, text }  a queen to camera
 *   { t: 'stakes', who, stakes } what the song is for
 * `line` is the queens standing, `bend` the panel/host ranks, `teamOf` her team.
 */
export function callStage(row, steps, { ep, line = [], bend = new Map(), teamOf = () => '', pending = false } = {}) {
  const named = steps.filter(s => s.t === 'call');
  const counts = {};
  for (const s of named) counts[s.r] = (counts[s.r] || 0) + 1;
  const TALLY = ['WIN', 'HIGH', 'LOW', 'BTM', 'BTM2'].filter(r => counts[r]);
  const colour = r => GRID_RESULTS[r]?.color || '#7a3a5e';
  const label = r => GRID_RESULTS[r]?.label || r;
  const lastBottom = [...named].reverse().find(s => s.r === 'BTM2' || s.r === 'LOW');

  const called = {};
  const states = steps.map(s => {
    const st = { phase: 'call', now: null, mood: null, banner: null, burst: false, shake: false, confess: null, sing: [] };
    if (s.t === 'call') {
      called[s.n] = s.r;
      st.now = s.n;
      st.mood = MOOD[s.r] || null;
      if (s.r === 'WIN') {
        st.banner = { text: 'Condragulations', sub: s.n };
        st.burst = true;
      } else if (s.r === 'BTM2') {
        st.banner = { text: 'Bottom two', sub: s.n, red: true };
        st.shake = true;
      } else if (pending && s === lastBottom) {
        st.banner = { text: 'In the bottom', sub: 'one of them will be saved', red: true };
      }
    } else if (s.t === 'hold') {
      st.phase = 'hold';
    } else if (s.t === 'confess') {
      st.phase = 'confess';
      st.confess = `<span class="csx-cframe">${s.n ? _portrait(s.n, ep, { size: 130 }) : ''}</span>
        <div class="csx-cbody"><small>Confessional${s.n ? ` · ${esc(s.n)}` : ''}</small><q>${esc(s.text)}</q></div>`;
    } else if (s.t === 'stakes') {
      st.phase = 'stakes';
      st.sing = s.who || [];
      st.banner = { text: STAKES[s.stakes] || STAKES.life, sub: (s.who || []).join(' vs '), red: s.stakes !== 'win' };
      st.shake = true;
    }
    st.called = { ...called };
    return st;
  });

  const cols = line.map(n => {
    const b = bend.get(n);
    const moved = b && b.panelRank !== b.finalRank;
    return `<div class="csx-q" data-q="${esc(n)}">
      <div class="csx-face">${_portrait(n, ep, { size: 88 })}</div>
      <b>${esc(n)}</b>
      <span class="csx-team">${esc(teamOf(n))}</span>
      <span class="csx-tag" data-t="${esc(n)}"></span>
      <span class="csx-moved">${moved ? `panel ${b.panelRank} → ${b.finalRank}` : ''}</span>
    </div>`;
  }).join('');
  const tally = TALLY.map(r => `<span style="--rc:${colour(r)}">${esc(label(r))}${
    Array.from({ length: counts[r] }, () => `<i data-r="${r}"></i>`).join('')}</span>`).join('');

  const html = `<!--dr-chrome--><div class="csx" id="csx" data-phase="idle">
    <div class="csx-bg"><i class="csx-rays"></i><i class="csx-floor"></i><i class="csx-wash"></i><i class="csx-vig"></i></div>
    <i class="csx-spot"></i>
    <div class="csx-top">
      <div class="csx-title">The call<small>${esc(line.length)} queens on the stage</small></div>
      <div class="csx-head"><span data-hd></span></div>
      <div class="csx-host"><span class="csx-hface">${_judgePortrait('rupaul', { stage: true, size: 38 })}</span>${podiumSvg()}<span class="csx-hlabel">The host</span></div>
    </div>
    <div class="csx-line">${cols}</div>
    <div class="csx-tally">${tally}</div>
    <div class="csx-banner"><b data-bn></b><small data-bs></small></div>
    <div class="csx-confetti">${confetti()}</div>
    <div class="csx-conf" data-conf></div>
  </div><!--/dr-chrome-->`;

  let prev = -99;
  let timer = null;
  const apply = idx => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('csx');
    if (!el) return;
    const st = idx < 0 ? null : states[Math.min(idx, states.length - 1)];
    const fresh = idx === prev + 1;
    prev = idx;
    clearTimeout(timer);
    el.classList.remove('burst', 'shake', 'lit', 'any');
    const bn = el.querySelector('.csx-banner');
    bn.classList.remove('show', 'red');
    const hd = el.querySelector('[data-hd]');
    hd.classList.remove('on', 'red');
    const called = st ? st.called : {};
    el.dataset.phase = st ? st.phase : 'idle';
    el.dataset.mood = st?.mood || '';
    for (const q of el.querySelectorAll('.csx-q')) {
      const n = q.dataset.q;
      const r = called[n];
      q.classList.toggle('called', !!r);
      q.classList.toggle('now', !!st && st.now === n);
      q.classList.toggle('sing', !!st && st.sing.includes(n));
      for (const m of ['win', 'high', 'low', 'btm']) q.classList.remove(`r-${m}`);
      if (r) {
        const m = MOOD[r];
        if (m && m !== 'safe') q.classList.add(`r-${m}`);
        q.style.setProperty('--rc', colour(r));
        q.style.setProperty('--rt', GRID_RESULTS[r]?.ink || '#12051c');
      }
      const tag = q.querySelector('.csx-tag');
      if (tag) tag.textContent = r ? label(r) : '';
    }
    const seen = {};
    for (const s of Object.values(called)) seen[s] = (seen[s] || 0) + 1;
    for (const t of ['WIN', 'HIGH', 'LOW', 'BTM', 'BTM2']) {
      [...el.querySelectorAll(`.csx-tally i[data-r="${t}"]`)].forEach((d, i) => d.classList.toggle('on', i < (seen[t] || 0)));
    }
    const conf = el.querySelector('[data-conf]');
    if (conf) conf.innerHTML = st?.confess || '';
    if (!st) return;
    // The spotlight: on the queen being called, hunting the waiting ones in the pause.
    const spot = el.querySelector('.csx-spot');
    const box = el.getBoundingClientRect();
    const centre = q => { const r = q.getBoundingClientRect(); return r.left + r.width / 2 - box.left; };
    if (st.now) {
      const q = [...el.querySelectorAll('.csx-q')].find(x => x.dataset.q === st.now);
      if (q) { spot.style.left = `${centre(q)}px`; el.classList.add('lit', 'any'); }
    } else if (st.phase === 'hold') {
      const waiting = [...el.querySelectorAll('.csx-q:not(.called)')];
      if (waiting.length) {
        const xs = waiting.map(centre);
        spot.style.left = `${(Math.min(...xs) + Math.max(...xs)) / 2}px`;
        el.style.setProperty('--hunt', `${Math.max(20, (Math.max(...xs) - Math.min(...xs)) / 2)}px`);
      }
    }
    if (st.banner) {
      el.querySelector('[data-bn]').textContent = st.banner.text;
      el.querySelector('[data-bs]').textContent = st.banner.sub || '';
      bn.classList.toggle('red', !!st.banner.red);
      hd.innerHTML = `${esc(st.banner.text)}${st.banner.sub ? `<small>${esc(st.banner.sub)}</small>` : ''}`;
      hd.classList.toggle('red', !!st.banner.red);
      hd.classList.add('on');
      if (fresh) {
        void el.offsetWidth;
        bn.classList.add('show');
      }
      if (fresh) {
        if (st.burst) el.classList.add('burst');
        if (st.shake) el.classList.add('shake');
        timer = setTimeout(() => el.classList.remove('burst', 'shake'), 2200);
      }
    }
  };
  return { html, apply, states };
}
