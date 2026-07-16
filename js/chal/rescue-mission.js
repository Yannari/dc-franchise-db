// ══════════════════════════════════════════════════════════════════════
// rescue-mission.js — "Carnival Rescue" finale VP (DC4 Carnival of Chaos)
// Six animated act screens + title + champion. Sim lives in finale.js
// (simulateRescueMission). Data on ep.rescueData. Total Drama overdrive look.
// ══════════════════════════════════════════════════════════════════════
import { players } from '../core.js';

function slugOf(name) { return players.find(p => p.name === name)?.slug || String(name).toLowerCase().replace(/\s+/g, '-'); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function av(name, size) { return `<img class="rr-av" src="assets/avatars/${slugOf(name)}.png" alt="${esc(name)}" style="width:${size}px;height:${size}px" onerror="this.style.visibility='hidden'">`; }
const TEAMCOL = ['a', 'b', 'c', 'd'];

// ── shared styles (ported from the approved mockup) ──
function _styles() { return `<style>
.rr-root{--ink:#1c1029;--red:#e8433c;--blue:#2c8fd6;--green:#54bd4f;--yellow:#ffcf2e;--purple:#8a5cd6;--pink:#ff6fae;--brown:#c98a3a;--teal:#2fb9c9;--disp:'Luckiest Guy','Fredoka',system-ui,cursive;--ui:'Fredoka','Chakra Petch',system-ui,sans-serif;--shadow:4px 4px 0 var(--ink);
  font-family:var(--ui);font-weight:500;color:var(--ink);max-width:960px;margin:0 auto;position:relative}
.rr-root *{box-sizing:border-box}
@media(prefers-reduced-motion:reduce){.rr-root *{animation:none!important;transition:none!important}}
.rr-stage{position:relative;min-height:560px;overflow:hidden;border:4px solid var(--ink);border-radius:16px;box-shadow:var(--shadow);padding-bottom:26px}
.rr-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.rr-content{position:relative;z-index:20;padding:16px 14px 0}
.rr-av{border-radius:50%;border:3px solid var(--ink);object-fit:cover;background:#fff;vertical-align:middle;flex-shrink:0}
.rr-panel{background:rgba(255,255,255,.94);border:4px solid var(--ink);border-radius:16px;box-shadow:var(--shadow);padding:12px 14px;margin-top:10px}
.rr-tag{text-align:center;font-size:10px;font-weight:700;letter-spacing:2px;color:#fff;text-transform:uppercase;text-shadow:0 1px 3px #000;margin-bottom:6px}
/* act banner */
.rr-act{text-align:center;margin:6px auto 2px}
.rr-chy{display:inline-block;font-family:var(--disp);font-size:12px;color:#fff;background:var(--ink);padding:3px 16px;border-radius:20px 20px 0 0;letter-spacing:1px}
.rr-ttl{display:inline-block;font-family:var(--disp);font-size:clamp(24px,5.4vw,42px);color:#fff;border:4px solid var(--ink);border-radius:16px;padding:7px 18px;box-shadow:var(--shadow);-webkit-text-stroke:1.4px var(--ink);text-shadow:3px 3px 0 var(--ink);animation:rrpop .5s both}
.rr-ds{margin:9px auto 0;font-weight:600;font-size:13px;max-width:520px;color:#fff;text-shadow:0 1px 4px #000}
@keyframes rrpop{0%{transform:scale(.7) rotate(-3deg);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
.tt-maze{background:var(--green)}.tt-haunt{background:var(--purple)}.tt-ship{background:var(--brown)}.tt-slide{background:var(--blue)}.tt-lake{background:#2f7fd6}.tt-drive{background:var(--red)}
/* rail */
.rr-rail{display:flex;gap:5px;justify-content:center;margin:14px auto 4px;max-width:480px}
.rr-rail i{flex:1;height:11px;border:2px solid var(--ink);border-radius:20px;background:#fff}
.rr-rail i.done{background:var(--green)}.rr-rail i.now{background:var(--yellow);box-shadow:2px 2px 0 var(--ink);animation:rrpulse 1.1s infinite}
@keyframes rrpulse{50%{filter:brightness(1.25)}}
/* HUD */
.rr-hud{margin:12px auto;max-width:640px;background:rgba(28,16,41,.9);border:4px solid var(--ink);border-radius:16px;box-shadow:var(--shadow);padding:10px 12px}
.rr-hud .lbl{font-family:var(--disp);font-size:11px;color:#fff;letter-spacing:1px}
.rr-track{position:relative;height:34px;margin:7px 0;background:repeating-linear-gradient(90deg,#3a2a50 0 18px,#31234a 18px 36px);border:2px solid #000;border-radius:18px}
.rr-flag{position:absolute;right:5px;top:50%;transform:translateY(-50%);font-size:17px}
.rr-runner{position:absolute;top:50%;transform:translateY(-50%);border-radius:50%;border:3px solid var(--ink);transition:left 1.2s cubic-bezier(.5,0,.3,1);box-shadow:3px 3px 0 #0006}
.rr-runner.a{outline:2px solid var(--blue)}.rr-runner.b{outline:2px solid var(--red)}.rr-runner.c{outline:2px solid var(--green)}.rr-runner.d{outline:2px solid var(--purple)}
/* leg scoreboard */
.rr-leg{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin:4px 0 6px}
.rr-legp{width:200px;text-align:center}
.rr-legrow{display:flex;align-items:center;gap:8px;justify-content:center}
.rr-legrow .nm{font-family:var(--disp);font-size:14px}
.rr-bar{height:15px;border:2px solid var(--ink);border-radius:10px;background:#eee;margin-top:7px;overflow:hidden}
.rr-bar i{display:block;height:100%;width:0;animation:rrfill 1.3s .3s forwards}
@keyframes rrfill{to{width:var(--w)}}
.rr-legp.a .rr-bar i{background:var(--blue)}.rr-legp.b .rr-bar i{background:var(--red)}.rr-legp.c .rr-bar i{background:var(--green)}.rr-legp.d .rr-bar i{background:var(--purple)}
.rr-legp.win .rr-bar i{background:linear-gradient(90deg,var(--yellow),var(--green))}
.rr-legres{font-family:var(--disp);font-size:11px;margin-top:5px;color:#fff;text-shadow:0 1px 3px #000}
.rr-legwin{display:inline-block;font-family:var(--disp);font-size:10px;background:var(--yellow);border:2px solid var(--ink);border-radius:12px;padding:1px 9px;margin-top:5px;animation:rrwig 1s infinite}
@keyframes rrwig{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
/* event cards */
.rr-card{background:#fff;border:3px solid var(--ink);border-radius:14px;padding:11px 13px;margin:9px auto;max-width:620px;box-shadow:var(--shadow);display:flex;gap:11px;align-items:flex-start;animation:rrcard .45s both}
@keyframes rrcard{from{opacity:0;transform:translateX(-14px) rotate(-1deg)}to{opacity:1;transform:none}}
.rr-card .pc{display:flex;gap:5px;flex-shrink:0}
.rr-card .bd{flex:1;min-width:0}
.rr-badge{display:inline-block;font-family:var(--disp);font-size:10px;color:#fff;border:2px solid var(--ink);border-radius:12px;padding:1px 10px;letter-spacing:.5px}
.rr-stat{float:right;font-size:9px;font-weight:700;color:#0007;text-transform:uppercase;background:#f0e6d0;border:1.5px solid var(--ink);border-radius:8px;padding:1px 7px;margin-top:2px}
.rr-tx{font-size:13px;font-weight:500;margin-top:7px;line-height:1.45}.rr-tx b{font-weight:700}
.rr-card.find{border-left:10px solid var(--green)}.rr-badge.find{background:var(--green)}
.rr-card.deduce{border-left:10px solid var(--purple)}.rr-badge.deduce{background:var(--purple)}
.rr-card.climb{border-left:10px solid var(--brown)}.rr-badge.climb{background:var(--brown)}
.rr-card.nerve{border-left:10px solid var(--blue)}.rr-badge.nerve{background:var(--blue)}
.rr-card.rescue{border-left:10px solid #2f7fd6}.rr-badge.rescue{background:#2f7fd6}
.rr-card.sabo{border-left:10px solid var(--red)}.rr-badge.sabo{background:var(--red)}
.rr-card.bench{border-left:10px solid var(--yellow)}.rr-badge.bench{background:var(--yellow);color:var(--ink)}
.rr-card.win{border-left:10px solid var(--yellow);background:#fffbe6;animation:rrcard .45s both,rrglow 1.4s .4s infinite}.rr-badge.win{background:var(--yellow);color:var(--ink)}
@keyframes rrglow{50%{box-shadow:0 0 22px var(--yellow),4px 4px 0 var(--ink)}}
.rr-card.conf{border-left:10px solid #6a6a8a;background:#f4f2fa}.rr-card.conf .rr-tx{font-style:italic;color:#2a2440}.rr-badge.conf{background:#6a6a8a}
.rr-host{max-width:600px;margin:10px auto;background:var(--yellow);border:3px solid var(--ink);border-radius:16px;padding:9px 14px;box-shadow:var(--shadow);font-weight:700;font-size:13px;position:relative}
.rr-host::before{content:"";position:absolute;left:24px;bottom:-12px;border:8px solid transparent;border-top-color:var(--ink)}
.rr-host b{font-family:var(--disp);font-weight:400}
/* controls */
.rr-ctrl{display:flex;gap:10px;justify-content:center;align-items:center;margin:12px 0 2px}
.rr-btn{font-family:var(--disp);font-size:12px;color:#fff;background:var(--ink);border:3px solid var(--ink);border-radius:20px;padding:5px 16px;cursor:pointer;box-shadow:var(--shadow)}
.rr-btn.gh{background:#fff;color:var(--ink)}
.rr-cnt{font-family:var(--disp);font-size:12px;color:#fff;text-shadow:0 1px 3px #000}
/* ── skies ── */
.sky-dusk{background:linear-gradient(180deg,#2a2350,#7a4a8a 40%,#ff7a5a 75%,#ffb04a)}
.sky-dawn{background:linear-gradient(180deg,#233a6a,#6a5a9a 35%,#ffb27a 70%,#ffd98a)}
.sky-day{background:linear-gradient(180deg,#5ec8ee,#9fdcf2 45%,#ffe08a 78%,#ffb25a)}
.sky-night{background:linear-gradient(180deg,#0d0824,#221646 42%,#3a2a5a 78%,#4a3a68)}
.sky-sea{background:linear-gradient(180deg,#3a6aa8,#6a9fd0 38%,#8fc0e0 60%,#2f6a9a)}
.sky-water{background:linear-gradient(180deg,#4a7fd6,#2f5fb0 60%,#1e3f8a)}
.rr-sun{position:absolute;width:74px;height:74px;border-radius:50%;background:radial-gradient(circle,#fff3b0,#ffcf2e);border:4px solid var(--ink);animation:rrsun 4s ease-in-out infinite}
@keyframes rrsun{50%{box-shadow:0 0 40px #ffcf2e}}
.rr-moon{position:absolute;width:56px;height:56px;border-radius:50%;background:#fdf6d0;border:4px solid var(--ink);box-shadow:0 0 30px #fdf6d088}
.rr-cloud{position:absolute;background:#fff;border-radius:40px;opacity:.85;animation:rrdrift 28s linear infinite}
@keyframes rrdrift{from{transform:translateX(-160px)}to{transform:translateX(120vw)}}
.rr-conf i{position:absolute;top:-14px;width:9px;height:14px;animation:rrfall linear infinite}
@keyframes rrfall{to{transform:translateY(620px) rotate(540deg)}}
/* corn */
.rr-corn{position:absolute;bottom:0;transform-origin:bottom center;animation:rrsway 3.6s ease-in-out infinite}
@keyframes rrsway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
.rr-mist{position:absolute;left:-20%;width:140%;height:70px;background:radial-gradient(closest-side,#fff8,transparent);animation:rrmist 18s linear infinite;opacity:.5}
@keyframes rrmist{from{transform:translateX(-8%)}to{transform:translateX(8%)}}
.rr-fieldback{position:absolute;left:0;width:100%;opacity:.85;filter:blur(.8px)}
.rr-wall{position:absolute;bottom:0;height:230px;width:130px;transform-origin:bottom center;animation:rrsway 4.6s ease-in-out infinite}
/* bats + haunted */
.rr-bat{position:absolute;animation:rrbat linear infinite}
.rr-bat svg{animation:rrflap .3s ease-in-out infinite}
@keyframes rrflap{50%{transform:scaleY(.55)}}
@keyframes rrbat{from{transform:translate(-12vw,0)}50%{transform:translate(44vw,-30px)}to{transform:translate(104vw,10px)}}
.rr-flick{animation:rrflick 2.6s steps(1) infinite}
@keyframes rrflick{0%,100%{opacity:.92}44%{opacity:.28}47%{opacity:.9}72%{opacity:.4}75%{opacity:.9}}
/* ship */
.rr-ship{position:absolute;bottom:66px;left:50%;transform-origin:bottom center;animation:rrrock 3.8s ease-in-out infinite}
@keyframes rrrock{0%,100%{transform:translateX(-50%) rotate(-2.6deg)}50%{transform:translateX(-50%) rotate(2.6deg)}}
.rr-climber{animation:rrclimb 3.2s ease-in-out infinite}
@keyframes rrclimb{0%{transform:translate(0,34px)}100%{transform:translate(-26px,-40px)}}
.rr-flagw{transform-origin:left center;transform-box:fill-box;animation:rrfw 1.3s ease-in-out infinite}
@keyframes rrfw{50%{transform:skewX(-10deg) scaleX(.93)}}
/* waves + slide */
.rr-wave{position:absolute;left:0;width:200%;height:36px;background:repeating-linear-gradient(90deg,#bfe3ff 0 30px,#a3d4ff 30px 60px);border-top:3px solid #fff;opacity:.5;animation:rrwv 4s linear infinite}
@keyframes rrwv{to{transform:translateX(-60px)}}
.rr-flow{stroke-dasharray:6 10;animation:rrfl 1s linear infinite}
@keyframes rrfl{to{stroke-dashoffset:-16}}
.rr-splash{position:absolute;width:9px;height:9px;border-radius:50%;background:#bfeaff;animation:rrsp 1.2s ease-out infinite}
@keyframes rrsp{0%{transform:translateY(0) scale(.4);opacity:1}100%{transform:translateY(-64px) scale(1);opacity:0}}
.rr-bob{position:absolute;animation:rrbob 2.6s ease-in-out infinite}
@keyframes rrbob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-9px) rotate(4deg)}}
/* drive */
.rr-road{position:absolute;bottom:0;left:0;right:0;height:110px;background:linear-gradient(180deg,#5a4a3a,#3a2e26)}
.rr-mark{position:absolute;bottom:48px;left:0;width:200%;height:8px;background:repeating-linear-gradient(90deg,var(--yellow) 0 40px,transparent 40px 80px);animation:rrscroll .5s linear infinite}
@keyframes rrscroll{to{transform:translateX(-80px)}}
.rr-silo{position:absolute;bottom:110px;width:200%;height:88px;animation:rrscroll 3s linear infinite;opacity:.8}
.rr-amb{position:absolute;bottom:66px;animation:rrbounce .4s ease-in-out infinite}
@keyframes rrbounce{50%{transform:translateY(-5px)}}
.rr-siren{animation:rrsiren .5s steps(1) infinite}
@keyframes rrsiren{50%{fill:var(--blue)}}
.rr-speed{position:absolute;height:3px;background:#fff;border-radius:2px;opacity:.7;animation:rrzoom .4s linear infinite}
@keyframes rrzoom{from{transform:translateX(40px);opacity:0}30%{opacity:.7}to{transform:translateX(-120px);opacity:0}}
/* title panorama + champion */
.rr-ferris{position:absolute;animation:rrspin 14s linear infinite;transform-origin:center}
@keyframes rrspin{to{transform:rotate(360deg)}}
.rr-htitle{text-align:center;font-family:var(--disp);font-size:clamp(38px,9vw,80px);line-height:.9;margin:4px 0;color:var(--yellow);-webkit-text-stroke:3px var(--ink);text-shadow:6px 6px 0 var(--ink);animation:rrpop .6s both}
.rr-kick{text-align:center;font-family:var(--disp);font-size:13px;color:#fff;-webkit-text-stroke:1px var(--ink);text-shadow:2px 2px 0 var(--ink)}
.rr-prize{display:block;width:fit-content;margin:12px auto 0;font-family:var(--disp);font-size:22px;color:#fff;background:var(--green);border:4px solid var(--ink);border-radius:30px;padding:6px 24px;box-shadow:var(--shadow);animation:rrprize 2s ease-in-out infinite}
@keyframes rrprize{50%{transform:scale(1.05) rotate(-1deg)}}
.rr-board{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;margin:14px 0}
@media(max-width:600px){.rr-board{grid-template-columns:1fr}.rr-vsbadge{margin:0 auto}}
.rr-team{border:4px solid var(--ink);border-radius:16px;padding:12px;box-shadow:var(--shadow);background:#fff}
.rr-team.a{background:#dcefff}.rr-team.b{background:#ffe6d0}.rr-team.c{background:#e3f7de}.rr-team.d{background:#efe6fb}
.rr-team h4{margin:0 0 8px;font-family:var(--disp);font-size:15px}
.rr-fin{display:flex;align-items:center;gap:10px}.rr-fin .nm{font-family:var(--disp);font-size:18px}.rr-fin .arc{font-size:11px;font-weight:600;color:#0009}
.rr-help{margin:10px 0 8px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:7px;background:var(--yellow);border:2px solid var(--ink);border-radius:20px;padding:3px 10px}
.rr-bl{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#0008;margin:8px 0 5px}
.rr-bench{display:flex;flex-wrap:wrap;gap:4px}
.rr-vsbadge{align-self:center;font-family:var(--disp);font-size:28px;color:#fff;background:var(--purple);border:4px solid var(--ink);border-radius:50%;width:60px;height:60px;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow);transform:rotate(-6deg);animation:rrvs 1.6s ease-in-out infinite}
@keyframes rrvs{50%{transform:rotate(-6deg) scale(1.08)}}
.rr-spot{position:absolute;top:-10%;left:50%;transform:translateX(-50%);width:60%;height:120%;background:radial-gradient(closest-side,#fff6,transparent);animation:rrsweep 5s ease-in-out infinite}
@keyframes rrsweep{0%,100%{transform:translateX(-70%) rotate(-6deg)}50%{transform:translateX(-30%) rotate(6deg)}}
.rr-champ{position:relative;z-index:20;text-align:center;padding-top:20px}
.rr-champ .big{font-family:var(--disp);font-size:clamp(34px,7vw,58px);color:var(--yellow);-webkit-text-stroke:3px var(--ink);text-shadow:6px 6px 0 var(--ink);margin:8px 0}
.rr-podium{display:flex;justify-content:center;gap:12px;margin-top:16px;flex-wrap:wrap}
.rr-pl{background:#fff;border:3px solid var(--ink);border-radius:14px;box-shadow:var(--shadow);padding:12px;min-width:120px}
.rr-pl .rk{font-family:var(--disp);font-size:12px;color:var(--red)}.rr-pl.first .rk{color:var(--green)}
.rr-pl .nm{font-family:var(--disp);font-size:15px;margin-top:6px}.rr-pl .st{font-size:10px;font-weight:600;color:#0009;margin-top:2px}
</style>`; }

// ── reveal state ──
function _st(key) { if (!window._tvState) window._tvState = {}; if (!window._tvState[key]) window._tvState[key] = { idx: -1 }; return window._tvState[key]; }

function _cards(events, key) {
  const st = _st(key);
  return events.map((e, i) => {
    const shown = i <= st.idx;
    const pcs = (e.players || []).map(n => av(n, 26)).join('');
    return `<div class="rr-card ${esc(e.badgeClass)}" id="rr-step-${key}-${i}" style="${shown ? '' : 'display:none'}">
      <div class="pc">${pcs}</div>
      <div class="bd"><span class="rr-badge ${esc(e.badgeClass)}">${esc(e.badge)}</span>${e.stat ? `<span class="rr-stat">${esc(e.stat)}</span>` : ''}
      <div class="rr-tx">${e.text}</div></div></div>`;
  }).join('');
}
function _controls(key, total) {
  const st = _st(key);
  const done = st.idx >= total - 1;
  return `<div class="rr-ctrl" id="rr-ctrl-${key}" style="${done ? 'display:none' : ''}">
      <span class="rr-cnt" id="rr-cnt-${key}">${Math.max(0, st.idx + 1)} / ${total}</span>
      <button class="rr-btn" onclick="rescueRevealNext('${key}',${total})">Next ▸</button>
      <button class="rr-btn gh" onclick="rescueRevealAll('${key}',${total})">Reveal All</button>
    </div>`;
}

// ── HUD + leg scoreboard ──
function _hud(d, A) {
  const runnersHtml = d.finalists.map((f, i) => {
    const pos = Math.min(93, Math.max(2, A.positions[f] || 2));
    return `<span class="rr-runner ${TEAMCOL[i]}" style="left:${pos}%;width:30px;height:30px"><img src="assets/avatars/${slugOf(f)}.png" alt="${esc(f)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover" onerror="this.style.visibility='hidden'"></span>`;
  }).join('');
  return `<div class="rr-hud"><div class="lbl">🏁 LIVE POSITION</div><div class="rr-track"><span class="rr-flag">🏁</span>${runnersHtml}</div></div>`;
}
function _legboard(d, A, isFinal) {
  const maxLeg = Math.max(...Object.values(A.scores), 1);
  return `<div class="rr-leg">${d.finalists.map((f, i) => {
    const pct = Math.round((A.scores[f] / maxLeg) * 100);
    const win = f === A.legWinner;
    const res = win ? (isFinal ? 'WINNER!' : 'Leg winner!') : (isFinal ? 'Runner-up' : 'Chasing');
    return `<div class="rr-legp ${TEAMCOL[i]} ${win ? 'win' : ''}">
      <div class="rr-legrow">${av(f, 34)}<span class="nm">${esc(f)}</span></div>
      <div class="rr-bar"><i style="--w:${pct}%"></i></div>
      <div class="rr-legres">${res}</div>${win ? `<span class="rr-legwin">${isFinal ? 'CHAMPION' : 'LEG WINNER'}</span>` : ''}</div>`;
  }).join('')}</div>`;
}
function _rail(idx) {
  return `<div class="rr-rail">${Array.from({ length: 6 }).map((_, i) => `<i class="${i < idx ? 'done' : i === idx ? 'now' : ''}"></i>`).join('')}</div>`;
}

// ── generic act screen ──
function _actScreen(ep, idx, key, sky, tt, scene) {
  const d = ep.rescueData; if (!d) return '';
  const A = d.acts[idx]; if (!A) return '';
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'][idx];
  const isFinal = idx === 5;
  const total = (A.events || []).length;
  return `${_styles()}<div class="rr-root"><div class="rr-stage ${sky}">
    <div class="rr-layer">${scene}</div>
    <div class="rr-content">
      ${_rail(idx)}
      <div class="rr-act"><div class="rr-chy">ACT ${roman} OF VI${A.mode === 'solo' ? ' · SOLO' : A.mode === 'essential' ? ' · TWO-PERSON' : ''}</div>
        <div class="rr-ttl ${tt}">${A.emoji} ${esc(A.name).toUpperCase()}</div>
        <div class="rr-ds">${esc(A.desc)} <b>${esc(A.statA)} + ${esc(A.statB)}.</b></div></div>
      ${_hud(d, A)}
      ${_legboard(d, A, isFinal)}
      ${_cards(A.events || [], key)}
      ${total ? _controls(key, total) : ''}
      ${A.hostQuip ? `<div class="rr-host"><b>${esc(A.hostQuip.split(':')[0])}:</b>${esc(A.hostQuip.slice(A.hostQuip.indexOf(':') + 1))}</div>` : ''}
    </div></div></div>`;
}

// ════════════ SCENES ════════════
function _sceneMaze() {
  const stalk = (l, d) => `<div class="rr-corn" style="left:${l}%;animation-delay:${d}s"><svg width="26" height="150" viewBox="0 0 26 150"><rect x="11" y="20" width="4" height="130" fill="#3f7a2a"/><g fill="#5aa83a" stroke="#2e5a1e"><path d="M13 44 Q-6 38 4 58 Q13 52 13 44"/><path d="M13 64 Q32 58 22 78 Q13 72 13 64"/><path d="M13 84 Q-6 78 4 98 Q13 92 13 84"/></g><ellipse cx="13" cy="26" rx="7" ry="13" fill="#ffd24a" stroke="#c8971f"/></svg></div>`;
  const wall = (side) => `<svg class="rr-wall ${side}" style="${side}:-14px;${side === 'right' ? 'transform:scaleX(-1)' : ''}" viewBox="0 0 150 250" preserveAspectRatio="none"><path d="M0 250V64 Q18 22 36 56 Q56 16 76 56 Q98 22 118 56 Q138 30 150 62 V250Z" fill="#356a22" stroke="#22421a" stroke-width="3"/><g stroke="#2a5219" stroke-width="2"><path d="M22 250V72M44 250V60M66 250V66M88 250V58M110 250V66M132 250V66"/></g><g fill="#cda838" stroke="#a8842a"><ellipse cx="30" cy="82" rx="4" ry="8"/><ellipse cx="76" cy="76" rx="4" ry="8"/><ellipse cx="118" cy="84" rx="4" ry="8"/></g></svg>`;
  return `<div class="rr-sun" style="left:12%;top:8%"></div>
    <div class="rr-mist" style="bottom:110px"></div><div class="rr-mist" style="bottom:50px;animation-duration:24s"></div>
    <svg class="rr-fieldback" viewBox="0 0 400 88" preserveAspectRatio="none" style="bottom:120px;height:84px"><path d="M0 88 V44 q9 -10 18 -1 t18 1 t18 -2 t18 2 t18 -3 t18 2 t18 -1 t18 2 t18 -2 t18 2 t18 -3 t18 2 t18 -1 t18 2 t18 -2 t18 2 t18 -1 t18 2 t18 -2 t22 1 V88Z" fill="#34641f"/></svg>
    ${wall('left')}${wall('right')}
    ${stalk(3, .1)}${stalk(11, .5)}${stalk(23, 1.1)}${stalk(31, .8)}${stalk(39, .3)}
    <svg style="position:absolute;left:50%;bottom:0;width:66px;height:150px;transform:translateX(-50%)" viewBox="0 0 70 150"><rect x="32" y="40" width="6" height="110" fill="#8a5a2a"/><rect x="6" y="60" width="58" height="6" fill="#8a5a2a"/><circle cx="35" cy="34" r="16" fill="#e0b24a" stroke="#20142e" stroke-width="2"/><path d="M35 8 L24 24 H46Z" fill="#c98a3a" stroke="#20142e" stroke-width="2"/><circle cx="29" cy="32" r="2.5" fill="#20142e"/><circle cx="41" cy="32" r="2.5" fill="#20142e"/><path d="M29 40 Q35 44 41 40" stroke="#20142e" stroke-width="2" fill="none"/><rect x="26" y="50" width="18" height="26" fill="#3f7a2a" stroke="#20142e" stroke-width="2"/></svg>
    ${stalk(60, 1.2)}${stalk(70, .3)}${stalk(78, .6)}${stalk(88, .9)}${stalk(95, .4)}`;
}
function _sceneHaunt() {
  const bat = (t, dur, del, w) => `<div class="rr-bat" style="top:${t}%;animation-duration:${dur}s;animation-delay:${del}s"><svg width="${w}" height="${w / 2}" viewBox="0 0 34 16"><path d="M17 8Q8-2 2 6Q6 4 10 8Q13 2 17 8Q21 2 24 8Q28 4 32 6Q26-2 17 8Z" fill="#100722" stroke="#000" stroke-width="1"/></svg></div>`;
  return `<div class="rr-moon" style="left:14%;top:8%"></div>
    ${bat(16, 9, 0, 34)}${bat(28, 11, 2.5, 26)}${bat(22, 7.5, 4.5, 20)}
    <div class="rr-mist" style="bottom:70px;background:radial-gradient(closest-side,#7fd0a055,transparent)"></div>
    <div class="rr-mist" style="bottom:14px;animation-duration:22s;background:radial-gradient(closest-side,#7fd0a03a,transparent)"></div>
    <svg style="position:absolute;bottom:0;left:3%;width:92px;height:270px" viewBox="0 0 96 280"><g stroke="#1a0f24" stroke-width="7" fill="none" stroke-linecap="round"><path d="M48 280V90"/><path d="M48 150 L18 110M48 130 L78 96M48 180 L22 156M48 168 L74 140M48 108 L30 78M48 100 L66 70"/></g></svg>
    <svg style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:360px;height:300px" viewBox="0 0 380 320"><rect x="66" y="132" width="248" height="188" fill="#241a34" stroke="#0d0718" stroke-width="4"/><path d="M66 132 L118 66 L170 132Z" fill="#2e2242" stroke="#0d0718" stroke-width="4"/><path d="M210 132 L262 66 L314 132Z" fill="#2e2242" stroke="#0d0718" stroke-width="4"/><rect x="168" y="86" width="44" height="234" fill="#2a1e3e" stroke="#0d0718" stroke-width="4"/><path d="M162 86 L190 40 L218 86Z" fill="#3a2a52" stroke="#0d0718" stroke-width="4"/><rect class="rr-flick" x="94" y="158" width="28" height="36" fill="#ffcf2e" stroke="#0d0718" stroke-width="2"/><rect class="rr-flick" x="258" y="158" width="28" height="36" fill="#ffcf2e" stroke="#0d0718" stroke-width="2" style="animation-delay:1.1s"/><rect class="rr-flick" x="178" y="112" width="24" height="30" fill="#8affd0" stroke="#0d0718" stroke-width="2" style="animation-delay:.6s"/><rect x="176" y="250" width="28" height="70" rx="14" fill="#0d0718" stroke="#4a3a2a" stroke-width="3"/><circle cx="198" cy="286" r="2.6" fill="#ffcf2e"/></svg>`;
}
function _sceneShip() {
  return `<div class="rr-sun" style="right:14%;top:10%"></div><div class="rr-cloud" style="top:20%;left:0;width:80px;height:24px"></div>
    <svg class="rr-ship" style="width:290px;height:280px" viewBox="0 0 300 290"><g stroke="#3a2010" stroke-width="2" opacity=".8"><path d="M150 40 L70 176"/><path d="M150 40 L232 176"/><path d="M150 60 L100 176"/><path d="M150 60 L200 176"/></g><rect x="146" y="24" width="9" height="156" fill="#5a3a1a" stroke="#2e1a0a" stroke-width="1.5"/><rect x="96" y="70" width="110" height="7" fill="#5a3a1a"/><path d="M150 34 Q224 66 210 128 L150 128Z" fill="#f2e9d4" stroke="#c8b89a" stroke-width="2"/><path d="M146 44 Q72 74 86 132 L146 132Z" fill="#e8dcc0" stroke="#c8b89a" stroke-width="2"/><g fill="#8a6a4a" opacity=".7" transform="translate(170 78)"><circle cx="0" cy="0" r="9"/><circle cx="-3" cy="-1" r="2" fill="#f2e9d4"/><circle cx="3" cy="-1" r="2" fill="#f2e9d4"/></g><path class="rr-flagw" d="M150 24 L190 32 L150 42Z" fill="#20142e" stroke="#000" stroke-width="1.5"/><path d="M40 176 Q150 216 260 176 L236 224 Q150 252 64 224Z" fill="#6a3a1a" stroke="#331a0c" stroke-width="4"/><rect x="70" y="158" width="160" height="22" fill="#7a4a2a" stroke="#331a0c" stroke-width="3"/><g fill="#331a0c"><circle cx="96" cy="196" r="7"/><circle cx="132" cy="200" r="7"/><circle cx="168" cy="200" r="7"/><circle cx="204" cy="196" r="7"/></g><g class="rr-climber"><circle cx="150" cy="150" r="9" fill="#ffce9e" stroke="#20142e" stroke-width="2"/><rect x="144" y="158" width="12" height="18" rx="3" fill="#2c8fd6" stroke="#20142e" stroke-width="2"/></g></svg>
    <div class="rr-wave" style="bottom:60px"></div><div class="rr-wave" style="bottom:38px;animation-delay:1s;opacity:.4"></div><div class="rr-wave" style="bottom:16px;animation-delay:2s;opacity:.55"></div><div class="rr-wave" style="bottom:0;animation-delay:.5s;opacity:.7"></div>`;
}
function _sceneSlide() {
  return `<div class="rr-sun" style="right:12%;top:8%"></div><div class="rr-cloud" style="top:18%;left:0;width:80px;height:24px"></div>
    <svg style="position:absolute;bottom:66px;left:50%;transform:translateX(-50%);width:190px;height:330px" viewBox="0 0 200 340"><rect x="70" y="30" width="14" height="300" fill="#7a5a3a" stroke="#20142e" stroke-width="3"/><rect x="116" y="30" width="14" height="300" fill="#7a5a3a" stroke="#20142e" stroke-width="3"/><rect x="60" y="20" width="80" height="18" rx="4" fill="#e8433c" stroke="#20142e" stroke-width="3"/><path d="M100 40 C100 120 40 150 40 240 C40 300 90 300 96 320" fill="none" stroke="#2c8fd6" stroke-width="20" stroke-linecap="round"/><path d="M100 40 C100 120 40 150 40 240 C40 300 90 300 96 320" fill="none" stroke="#bfeaff" stroke-width="8" class="rr-flow"/></svg>
    <div class="rr-splash" style="bottom:24px;left:31%"></div><div class="rr-splash" style="bottom:24px;left:34%;animation-delay:.4s"></div><div class="rr-splash" style="bottom:24px;left:29%;animation-delay:.8s"></div>
    <div class="rr-wave" style="bottom:0"></div><div class="rr-wave" style="bottom:20px;animation-delay:1s;opacity:.35"></div>`;
}
function _sceneLake() {
  return `<div class="rr-wave" style="top:34%"></div><div class="rr-wave" style="top:46%;animation-delay:1s;opacity:.4"></div><div class="rr-wave" style="top:58%;animation-delay:2s;opacity:.5"></div><div class="rr-wave" style="top:70%;animation-delay:.5s;opacity:.35"></div>
    <div class="rr-bob" style="left:48%;top:38%;font-size:30px">🧍</div>
    <div class="rr-bob" style="left:30%;top:58%;font-size:22px">🏊</div><div class="rr-bob" style="right:22%;top:52%;font-size:22px;animation-delay:.5s">🏊</div>`;
}
function _sceneDrive() {
  return `<div class="rr-moon" style="right:14%;top:10%"></div>
    <svg class="rr-silo" viewBox="0 0 800 90" preserveAspectRatio="none"><g fill="#2a1a3a" opacity=".85"><circle cx="80" cy="60" r="40" stroke="#120a1e" stroke-width="3" fill="none"/><path d="M180 90V50a30 20 0 0160 0v40"/><rect x="300" y="40" width="60" height="50"/><path d="M300 40 330 18 360 40"/><ellipse cx="470" cy="80" rx="46" ry="14"/><path d="M560 90 L560 40 620 40 620 90" fill="none" stroke="#120a1e" stroke-width="4"/><circle cx="720" cy="55" r="34" fill="none" stroke="#120a1e" stroke-width="3"/></g></svg>
    <div class="rr-road"></div><div class="rr-mark"></div>
    <div class="rr-speed" style="bottom:96px;right:20%;width:60px"></div><div class="rr-speed" style="bottom:126px;right:35%;width:40px;animation-delay:.2s"></div><div class="rr-speed" style="bottom:146px;right:12%;width:70px;animation-delay:.1s"></div>
    <svg class="rr-amb" style="left:44%;width:126px;height:70px" viewBox="0 0 130 70"><rect x="6" y="26" width="80" height="30" rx="4" fill="#fff" stroke="#20142e" stroke-width="3"/><rect x="80" y="16" width="40" height="40" rx="4" fill="#fff" stroke="#20142e" stroke-width="3"/><rect x="94" y="22" width="20" height="16" fill="#9cd3f0" stroke="#20142e" stroke-width="2"/><path d="M28 34v12M22 40h12" stroke="#e8433c" stroke-width="4"/><rect class="rr-siren" x="40" y="18" width="14" height="8" rx="2" fill="#e8433c" stroke="#20142e" stroke-width="2"/><circle cx="30" cy="58" r="9" fill="#20142e"/><circle cx="98" cy="58" r="9" fill="#20142e"/></svg>
    <svg class="rr-amb" style="left:24%;width:106px;height:60px;animation-delay:.2s" viewBox="0 0 130 70"><rect x="6" y="26" width="80" height="30" rx="4" fill="#ffe6d0" stroke="#20142e" stroke-width="3"/><rect x="80" y="16" width="40" height="40" rx="4" fill="#ffe6d0" stroke="#20142e" stroke-width="3"/><rect x="94" y="22" width="20" height="16" fill="#9cd3f0" stroke="#20142e" stroke-width="2"/><path d="M28 34v12M22 40h12" stroke="#e8433c" stroke-width="4"/><rect class="rr-siren" x="40" y="18" width="14" height="8" rx="2" fill="#e8433c" stroke="#20142e" stroke-width="2"/><circle cx="30" cy="58" r="9" fill="#20142e"/><circle cx="98" cy="58" r="9" fill="#20142e"/></svg>`;
}

// ════════════ EXPORTED SCREENS ════════════
export function rpBuildRescueTitle(ep) {
  const d = ep.rescueData; if (!d) return '';
  const conf = ['red', 'yellow', 'blue', 'green', 'pink', 'purple'].map((c, i) =>
    `<i style="left:${12 + i * 14}%;background:var(--${c});animation-duration:${4 + i * 0.6}s"></i>`).join('');
  const team = (f, i) => {
    const cls = TEAMCOL[i];
    const arc = players.find(p => p.name === f)?.archetype || '';
    const help = d.helpers[f];
    const bench = (d.benchAssignments[f] || []);
    return `<div class="rr-team ${cls}"><h4>Team ${esc(f)}</h4>
      <div class="rr-fin">${av(f, 52)}<div><div class="nm">${esc(f)}</div><div class="arc">${esc(arc)}</div></div></div>
      ${help ? `<div class="rr-help">${av(help, 22)} Helper: ${esc(help)}</div>` : `<div class="rr-help" style="background:#eee">No helper</div>`}
      <div class="rr-bl">Rooting for ${esc(f)} · ${bench.length}</div>
      <div class="rr-bench">${bench.slice(0, 10).map(b => av(b, 26)).join('')}</div></div>`;
  };
  let board;
  if (d.finalists.length === 2) {
    board = `<div class="rr-board">${team(d.finalists[0], 0)}<div class="rr-vsbadge">VS</div>${team(d.finalists[1], 1)}</div>`;
  } else {
    board = `<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin:14px 0">${d.finalists.map((f, i) => `<div style="flex:1;min-width:200px;max-width:260px">${team(f, i)}</div>`).join('')}</div>`;
  }
  return `${_styles()}<div class="rr-root"><div class="rr-stage sky-dusk">
    <div class="rr-layer">
      <div class="rr-moon" style="right:12%;top:8%"></div>
      <svg class="rr-ferris" style="left:6%;bottom:12%;width:140px;height:140px" viewBox="0 0 150 150"><circle cx="75" cy="75" r="66" fill="none" stroke="#20142e" stroke-width="4"/><g stroke="#20142e" stroke-width="3"><path d="M75 9V141M9 75H141M28 28l94 94M122 28L28 122"/></g><g><circle cx="75" cy="9" r="9" fill="#e8433c" stroke="#20142e" stroke-width="2"/><circle cx="141" cy="75" r="9" fill="#ffcf2e" stroke="#20142e" stroke-width="2"/><circle cx="75" cy="141" r="9" fill="#2c8fd6" stroke="#20142e" stroke-width="2"/><circle cx="9" cy="75" r="9" fill="#54bd4f" stroke="#20142e" stroke-width="2"/><circle cx="122" cy="28" r="9" fill="#ff6fae" stroke="#20142e" stroke-width="2"/><circle cx="28" cy="122" r="9" fill="#8a5cd6" stroke="#20142e" stroke-width="2"/><circle cx="28" cy="28" r="9" fill="#2fb9c9" stroke="#20142e" stroke-width="2"/><circle cx="122" cy="122" r="9" fill="#e8433c" stroke="#20142e" stroke-width="2"/></g></svg>
      <svg style="position:absolute;right:4%;bottom:0;width:200px;height:140px" viewBox="0 0 220 150"><path d="M10 60 Q110 -10 210 60 L210 150 L10 150Z" fill="#e8433c" stroke="#20142e" stroke-width="4"/><g fill="#fff" opacity=".85"><path d="M10 60 Q60 20 60 60 L40 150 L10 150Z"/><path d="M110 32 L95 150 L125 150Z"/><path d="M210 60 Q160 20 160 60 L180 150 L210 150Z"/></g><path d="M110 18l6-14 6 14z" fill="#ffcf2e" stroke="#20142e" stroke-width="2"/></svg>
      <div class="rr-conf">${conf}</div>
    </div>
    <div class="rr-content">
      <div class="rr-kick">DISVENTURE CAMP · CARNIVAL OF CHAOS</div>
      <div class="rr-htitle">CARNIVAL RESCUE</div>
      <div class="rr-panel" style="text-align:center;font-weight:600;font-size:13.5px">The carnival closed after a season of freak accidents — a body even came out of the Action Waterslide. Tonight the finalists re-run that rescue: race the whole midway, haul a "drowning" dummy to the stretcher, and drive it home. <b>First across the line wins it all.</b></div>
      <span class="rr-prize">🚑 $1,000,000 🚑</span>
      ${board}
      <div class="rr-host"><b>${esc((d.hostOpen || '').split(':')[0])}:</b>${esc((d.hostOpen || '').slice((d.hostOpen || '').indexOf(':') + 1))}</div>
    </div></div></div>`;
}
export function rpBuildRescueMaze(ep)  { return _actScreen(ep, 0, `rr-maze-${ep.num}`,  'sky-dawn',  'tt-maze',  _sceneMaze()); }
export function rpBuildRescueHaunted(ep){ return _actScreen(ep, 1, `rr-haunt-${ep.num}`, 'sky-night', 'tt-haunt', _sceneHaunt()); }
export function rpBuildRescueShip(ep)   { return _actScreen(ep, 2, `rr-ship-${ep.num}`,  'sky-sea',   'tt-ship',  _sceneShip()); }
export function rpBuildRescueSlide(ep)  { return _actScreen(ep, 3, `rr-slide-${ep.num}`, 'sky-day',   'tt-slide', _sceneSlide()); }
export function rpBuildRescueLake(ep)   { return _actScreen(ep, 4, `rr-lake-${ep.num}`,  'sky-water', 'tt-lake',  _sceneLake()); }
export function rpBuildRescueDrive(ep)  { return _actScreen(ep, 5, `rr-drive-${ep.num}`, 'sky-dusk',  'tt-drive', _sceneDrive()); }

export function rpBuildRescueChampion(ep) {
  const d = ep.rescueData; if (!d) return '';
  const w = d.winner;
  const arc = players.find(p => p.name === w)?.archetype || '';
  const conf = ['red', 'yellow', 'blue', 'green', 'pink', 'purple', 'teal', 'red'].map((c, i) =>
    `<i style="left:${8 + i * 11}%;background:var(--${c});animation-duration:${4 + (i % 3) * 0.7}s"></i>`).join('');
  const podium = d.placements.map((f, i) => `<div class="rr-pl ${i === 0 ? 'first' : ''}"><div class="rk">${i === 0 ? '1ST · $1,000,000' : (i + 1) + (i === 1 ? 'ND' : i === 2 ? 'RD' : 'TH')}</div><div style="margin:8px auto 0;width:fit-content">${av(f, 46)}</div><div class="nm">${esc(f)}</div><div class="st">${i === 0 ? 'across the line first' : 'finalist'}</div></div>`).join('');
  return `${_styles()}<div class="rr-root"><div class="rr-stage sky-dusk">
    <div class="rr-layer"><div class="rr-spot"></div><div class="rr-conf">${conf}</div></div>
    <div class="rr-champ">
      <div class="rr-kick">WINNER OF CARNIVAL OF CHAOS</div>
      <div style="margin:8px auto 0;width:fit-content">${av(w, 100)}</div>
      <div class="big">${esc(w)}!</div>
      <div class="rr-panel" style="max-width:400px;margin:8px auto 0;text-align:center;font-weight:600">${esc(w)} brought the dummy across the line and takes Carnival of Chaos — and the million dollars.</div>
      <div class="rr-podium">${podium}</div>
    </div></div></div>`;
}

// ── reveal handlers ──
export function rescueRevealNext(key, total) {
  const s = _st(key);
  if (s.idx >= total - 1) return;
  s.idx++;
  const el = document.getElementById(`rr-step-${key}-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`rr-cnt-${key}`); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  if (s.idx >= total - 1) { const c = document.getElementById(`rr-ctrl-${key}`); if (c) c.style.display = 'none'; }
}
export function rescueRevealAll(key, total) {
  const s = _st(key);
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`rr-step-${key}-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById(`rr-cnt-${key}`); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`rr-ctrl-${key}`); if (c) c.style.display = 'none';
}
