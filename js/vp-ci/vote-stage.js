// ══════════════════════════════════════════════════════════════════════
// vp-ci/vote-stage.js — THE AUDIENCE VOTES, live
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "an audience-block twist and an audience immunity twist
// ... with dedicated screens, modern, animated and suspenseful". formats.js
// decides; this draws it. The candidates' meters count (no numbers) while
// they wait; on the result the shares land, count up, VOTING CLOSED stamps
// across, and the verdict: SAFE (immunity), SAVED / BLOCKED (the block).
import { esc, faceUrl, bg, ringOf, nameOf, isCatfish, dlg } from './parts.js';
import { faceOf } from './steps.js';

export function voteStage(row, screen, idx, fresh) {
  const d = screen.d || {};
  const st = idx >= 0 ? screen.steps[idx] : null;
  const resultAt = screen.steps.findIndex(x => /^audience\.result\./.test(x.key || ''));
  const done = resultAt >= 0 && idx >= resultAt;
  const landing = done && fresh && idx === resultAt;
  const block = d.mode === 'block';
  const talking = st?.who;
  const cands = d.candidates || [];
  const cards = cands.map((h, i) => {
    const share = d.shares?.[i] ?? 0;
    const url = faceUrl(faceOf(row, h, 'profile'));
    const verdict = !done ? '' : block ? (h === d.saved ? 'saved' : 'out') : (h === d.winner ? 'safe' : 'lost');
    const tag = verdict === 'saved' ? 'SAVED' : verdict === 'out' ? 'BLOCKED' : verdict === 'safe' ? '★ SAFE TONIGHT' : '';
    return `<div class="cv-c ${verdict}${h === talking ? ' talk' : ''}" style="--ring:${ringOf(row, h)};--to:${share};--i:${i}">
      <div class="cv-meter"><i class="cv-fill" style="height:${done ? share : 0}%"></i>${done ? '' : '<i class="cv-scan"></i>'}
        <div class="cv-pct">${done ? `<b class="cv-num${landing ? ' count' : ''}">${share}</b>%` : '<b>??</b>%'}</div></div>
      <div class="cv-face"${bg(url)}>${url ? '' : esc(nameOf(row, h)[0] || '?')}</div>
      <div class="cv-nm">${esc(nameOf(row, h).toUpperCase())}${isCatfish(row, h) ? ' <i>◆</i>' : ''}</div>
      ${tag ? `<div class="cv-tag">${tag}</div>` : ''}${verdict === 'out' && landing ? '<div class="cv-glitch"></div>' : ''}</div>`;
  }).join('');
  return `<div class="civ-layer cv${done ? ' done' : ''}${block ? ' block' : ' imm'}">
    <div class="cv-bg"></div><div class="cv-rays"></div>
    <div class="cv-head"><span class="cv-live"><i></i>LIVE</span><b>THE AUDIENCE VOTES</b><small>${block ? 'The Influencers put up two. The audience saves one.' : 'One player is made safe from tonight\'s blocking. Influencers can\'t win it.'}</small></div>
    <div class="cv-cards n${cands.length}">${cards}</div>
    ${done ? `<div class="cv-closed${landing ? ' slam' : ''}">VOTING CLOSED</div>` : `<div class="cv-counting">COUNTING THE VOTES<span class="cv-dots"><i></i><i></i><i></i></span></div>`}
    ${landing ? '<div class="cv-flash"></div>' : ''}
    ${dlg(row, st, fresh)}</div>`;
}

export const VOTE_CSS = `
@property --num{syntax:'<integer>';inherits:false;initial-value:0}
.cv{overflow:hidden;background:#04051a}
.cv-bg{position:absolute;inset:0;background:radial-gradient(60% 70% at 50% 35%,rgba(139,92,255,.35),transparent 70%),linear-gradient(180deg,#0a0b2e,#04051a)}
.cv.block .cv-bg{background:radial-gradient(60% 70% at 50% 35%,rgba(255,74,106,.28),transparent 70%),linear-gradient(180deg,#120a24,#04051a)}
.cv-rays{position:absolute;left:50%;top:-30%;width:140%;aspect-ratio:1;transform:translateX(-50%);background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.035) 0 6deg,transparent 6deg 18deg);animation:cvSpin 40s linear infinite;mask:radial-gradient(circle,#000 20%,transparent 70%)}
@keyframes cvSpin{to{transform:translateX(-50%) rotate(360deg)}}
.cv-head{position:absolute;left:0;right:0;top:4%;text-align:center;z-index:5}
.cv-live{display:inline-flex;align-items:center;gap:.5cqw;font:900 .9cqw Montserrat,sans-serif;letter-spacing:.2em;color:#fff;background:#ff2e4d;padding:.25cqw .8cqw;border-radius:.3cqw;box-shadow:0 0 1.5cqw rgba(255,46,77,.7)}
.cv-live i{width:.6cqw;height:.6cqw;border-radius:50%;background:#fff;animation:civBlink 1s infinite}
.cv-head b{display:block;margin-top:.6cqw;font-weight:900;font-size:2.8cqw;letter-spacing:.06em;background:linear-gradient(90deg,#ff4fb4,#ffd23f,#3fd8ff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 1.2cqw rgba(255,79,180,.5))}
.cv-head small{display:block;margin-top:.3cqw;font-size:1.1cqw;color:#c9d0ff}
.cv-cards{position:absolute;left:8%;right:8%;top:22%;bottom:22%;display:flex;justify-content:center;align-items:flex-end;gap:4%;z-index:5}
.cv-c{position:relative;width:15%;display:flex;flex-direction:column;align-items:center;transition:transform .5s,opacity .5s}
.cv-cards.n2 .cv-c{width:20%}
.cv-c.talk{transform:translateY(-2%)}
.cv-c.talk .cv-face{box-shadow:0 0 0 .35cqw #fff,0 0 2.5cqw var(--ring)}
.cv-meter{position:relative;width:62%;height:15cqw;border-radius:.8cqw;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);overflow:hidden;margin-bottom:1cqw}
.cv-fill{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,var(--ring),rgba(255,255,255,.85));box-shadow:0 0 2cqw var(--ring);transition:height 1.8s cubic-bezier(.2,.9,.2,1) calc(var(--i) * .25s)}
.cv-scan{position:absolute;left:0;right:0;height:35%;background:linear-gradient(180deg,transparent,rgba(255,255,255,.22),transparent);animation:cvScan 1.4s ease-in-out infinite;animation-delay:calc(var(--i) * .2s)}
@keyframes cvScan{0%{top:100%}100%{top:-35%}}
.cv-pct{position:absolute;left:0;right:0;top:.8cqw;text-align:center;font:900 1.4cqw Montserrat,sans-serif;color:#fff;text-shadow:0 0 1cqw rgba(0,0,0,.8)}
.cv-pct b{font-size:2.2cqw}
.cv-num.count{counter-reset:n var(--num);animation:cvCount 1.8s cubic-bezier(.2,.9,.2,1) both}
.cv-num.count::after{content:counter(n)}
.cv-num.count{font-size:0}.cv-num.count::after{font-size:2.2cqw}
@keyframes cvCount{from{--num:0}to{--num:var(--to)}}
.cv-face{width:7.5cqw;aspect-ratio:1;border-radius:50%;background:#1b1f45 center 25%/cover;border:.3cqw solid var(--ring);display:grid;place-items:center;font-weight:900;font-size:2.6cqw;color:#fff;transition:box-shadow .3s}
.cv-nm{margin-top:.6cqw;font-weight:900;font-size:1.15cqw;letter-spacing:.06em;color:#fff}.cv-nm i{color:#ff9ad4;font-style:normal}
.cv-tag{white-space:nowrap;margin-top:.5cqw;font:900 1cqw Montserrat,sans-serif;letter-spacing:.14em;padding:.3cqw .9cqw;border-radius:.4cqw;animation:civUp .5s 1.6s both}
.cv-c.saved .cv-tag{background:#3fbf7a;color:#04140b;box-shadow:0 0 1.5cqw rgba(63,191,122,.7)}
.cv-c.safe .cv-tag{background:linear-gradient(90deg,#ffd23f,#ff9a4a);color:#2a1800;box-shadow:0 0 2cqw rgba(255,210,63,.8)}
.cv-c.out .cv-tag{background:#ff2e4d;color:#fff;box-shadow:0 0 2cqw rgba(255,46,77,.8)}
.cv-c.safe .cv-face{box-shadow:0 0 0 .35cqw #ffd23f,0 0 3cqw #ffd23f}
.cv-c.out :is(.cv-meter,.cv-face,.cv-nm){animation:cvOut .6s 1.7s both}
@keyframes cvOut{to{opacity:.45;filter:grayscale(.9)}}
.cv-c.lost{animation:cvOut .6s 1.7s both}
.cv-c.out .cv-tag{animation:civUp .5s 1.6s both,cvPulse 1.6s 2.2s ease-in-out infinite}
@keyframes cvPulse{50%{box-shadow:0 0 3cqw rgba(255,46,77,1)}}
.cv-glitch{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,46,77,.4) 0 3px,transparent 3px 7px);mix-blend-mode:screen;animation:cvGlitch .7s 1.6s steps(6) both;pointer-events:none}
@keyframes cvGlitch{0%{opacity:0;transform:translateX(0)}20%{opacity:1;transform:translateX(-4%)}40%{transform:translateX(3%)}60%{transform:translateX(-2%)}100%{opacity:0;transform:none}}
.cv-counting{position:absolute;left:0;right:0;bottom:19%;text-align:center;font:800 1cqw ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.3em;color:#9fb4ff;z-index:5}
.cv-dots{display:inline-flex;gap:.3cqw;margin-left:.6cqw}.cv-dots i{width:.45cqw;height:.45cqw;border-radius:50%;background:#9fb4ff;animation:civBlink 1s infinite}
.cv-dots i:nth-child(2){animation-delay:.2s}.cv-dots i:nth-child(3){animation-delay:.4s}
.cv-closed{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%) rotate(-6deg);z-index:6;font:900 3.2cqw Montserrat,sans-serif;letter-spacing:.12em;color:#fff;border:.35cqw solid #fff;padding:.4cqw 1.6cqw;border-radius:.6cqw;opacity:.16;pointer-events:none}
.cv-closed.slam{animation:cvSlam .9s cubic-bezier(.2,1.4,.3,1) both}
@keyframes cvSlam{0%{opacity:0;transform:translate(-50%,-50%) rotate(-6deg) scale(2.2)}40%{opacity:.95}100%{opacity:.16;transform:translate(-50%,-50%) rotate(-6deg) scale(1)}}
.cv-flash{position:absolute;inset:0;z-index:20;background:#fff;pointer-events:none;animation:civFbFlash .6s ease-out both}
@media (prefers-reduced-motion: reduce){.cv-rays,.cv-scan,.cv-num.count,.cv-closed.slam,.cv-glitch{animation:none}.cv-num.count{font-size:2.2cqw}.cv-num.count::after{content:''}}
`;
