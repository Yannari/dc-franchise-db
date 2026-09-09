// ══════════════════════════════════════════════════════════════════════
// vp-dr/smackdown.js — the bracket, drawn as a bracket
// ══════════════════════════════════════════════════════════════════════
import { _shell, _portrait } from './style.js';
import { _controls, _seedRail } from './reveal.js';
import { SONGS } from '../dr/data/songs.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── SHARED CSS ────────────────────────────────────────────────────────
export const SMACKDOWN_CSS = `
.sd-wrap{--sd-gold:#FFC83D;--sd-dead:#4a2a3c;--sd-fire:#FF294B;--sd-safe:#39E88B}
.sd-bracket + .dr-step{margin-top:22px}
.sd-hero{text-align:center;padding:10px 0 18px}
.sd-hero .sd-title{font-size:11px;letter-spacing:.3em;color:var(--sd-gold)}
.sd-hero h2{margin:6px 0 4px;font-size:30px;line-height:1.05}
.sd-hero p{margin:0;color:#C9A6BC;font-size:13px}
.sd-bracket{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(160px,1fr);
  gap:14px;align-items:center;overflow-x:auto;padding:6px 2px 14px}
.sd-round{display:flex;flex-direction:column;justify-content:space-around;gap:10px;min-height:100%}
.sd-round-label{font-size:9px;letter-spacing:.24em;color:#b892a8;text-align:center;
  padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.09);margin-bottom:6px}
.sd-match{border:1px solid var(--dr-line);background:var(--dr-panel);
  border-radius:3px;overflow:hidden;transition:opacity .25s}
.sd-match:not(.on) .sd-side,.sd-match:not(.on) .sd-song{visibility:hidden}
.sd-match:not(.on){opacity:.5;border-style:dashed}
.sd-song{font-size:9.5px;letter-spacing:.06em;color:#b892a8;padding:5px 8px 3px;
  border-bottom:1px solid rgba(255,255,255,.07);white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.sd-side{display:grid;grid-template-columns:26px 1fr auto;gap:7px;align-items:center;
  padding:6px 8px;font-size:12.5px}
.sd-side + .sd-side{border-top:1px solid rgba(255,255,255,.06)}
.sd-side b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-side .sd-sc{font-variant-numeric:tabular-nums;color:#C9A6BC;font-size:11px}
.sd-win{background:linear-gradient(90deg,rgba(255,200,61,.14),transparent)}
.sd-win b{color:var(--sd-gold)}
.sd-lose b,.sd-lose .sd-sc{color:var(--sd-dead)}
.sd-lose .dr-por,.sd-lose .dr-initials{filter:grayscale(1) brightness(.5)}
.sd-fat{height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:2px;
  overflow:hidden;width:40px}
.sd-fat-fill{height:100%;border-radius:2px;transition:width .3s}
.sd-fat-ok{background:var(--sd-safe)}
.sd-fat-mid{background:var(--sd-gold)}
.sd-fat-low{background:var(--sd-fire)}
.sd-champ{display:flex;flex-direction:column;align-items:center;gap:8px;
  padding:14px 10px;border:1px solid var(--sd-gold);border-radius:3px;
  background:linear-gradient(180deg,rgba(255,200,61,.14),transparent);
  transition:opacity .3s}
.sd-champ:not(.on) > *{visibility:hidden}
.sd-champ:not(.on){opacity:.5;border-style:dashed}
.sd-champ .sd-name{font-size:17px;color:var(--sd-gold)}
.sd-champ .sd-belt{font-size:9px;letter-spacing:.18em;color:#e3cfdd;text-align:center;text-wrap:balance}
.sd-elim{display:flex;flex-direction:column;align-items:center;gap:8px;
  padding:14px 10px;border:1px solid var(--sd-fire);border-radius:3px;
  background:linear-gradient(180deg,rgba(255,41,75,.14),transparent);
  transition:opacity .3s}
.sd-elim:not(.on) > *{visibility:hidden}
.sd-elim:not(.on){opacity:.5;border-style:dashed}
.sd-elim .sd-name{font-size:17px;color:var(--sd-fire)}
.sd-elim .sd-label{font-size:9px;letter-spacing:.18em;color:#e3cfdd;text-align:center}
.dr-scene{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:15px 18px 15px 22px}
.dr-scene:not(:has(.dr-who)){grid-template-columns:1fr}
.dr-who{display:flex;gap:7px}
.dr-scene-body{color:#f4e3ed;font-size:15px;line-height:1.6;max-width:74ch;text-wrap:pretty}
@media(prefers-reduced-motion:reduce){.sd-match,.sd-champ,.sd-elim,.tm-ball,.tm-vs-flash,
  .tm-bar-fill,.tm-result-stamp{transition:none!important;animation:none!important}}
`;

// ── TOURNAMENT CSS ──────────────────────────────────────────────────
const TOURNAMENT_CSS = `
/* ── THE BALL MACHINE ─────────────────────────────────────────────── */
.tm-draw{text-align:center;padding:22px 12px 18px;position:relative;overflow:hidden}
.tm-draw::before{content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 50% 120%,rgba(255,200,61,.10),transparent 70%);pointer-events:none}
.tm-draw::after{content:'';position:absolute;inset:-2px;border:1px solid rgba(255,200,61,.08);
  border-radius:6px;pointer-events:none}
.tm-draw-label{font-size:9px;letter-spacing:.35em;color:#b892a8;margin-bottom:12px}

/* Ball reel — the slot machine spinner */
.tm-reel{position:relative;height:52px;overflow:hidden;margin:8px auto;max-width:200px;
  border:1px solid rgba(255,200,61,.15);border-radius:4px;
  background:linear-gradient(180deg,rgba(0,0,0,.3),rgba(0,0,0,.1) 40%,rgba(0,0,0,.1) 60%,rgba(0,0,0,.3));
  box-shadow:inset 0 2px 6px rgba(0,0,0,.4),inset 0 -2px 6px rgba(0,0,0,.4)}
.tm-reel::before,.tm-reel::after{content:'';position:absolute;left:0;right:0;height:14px;z-index:2;pointer-events:none}
.tm-reel::before{top:0;background:linear-gradient(180deg,rgba(26,14,20,.9),transparent)}
.tm-reel::after{bottom:0;background:linear-gradient(0deg,rgba(26,14,20,.9),transparent)}
.tm-reel-track{display:flex;flex-direction:column;align-items:center;
  transform:translateY(var(--tm-spin-end))}
.tm-anim .tm-reel-track{animation:tmSpin 1.2s cubic-bezier(.2,.6,.3,1) both}
.tm-reel-name{height:52px;display:flex;align-items:center;justify-content:center;
  font-size:16px;font-weight:700;letter-spacing:.08em;color:#c9a6bc;white-space:nowrap;
  flex-shrink:0}
.tm-reel-name.target{color:var(--sd-gold);text-shadow:0 0 12px rgba(255,200,61,.5)}

/* Ball grid (static state after spin) */
.tm-balls{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:14px 0 6px}
.tm-ball{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:700;letter-spacing:.04em;color:#1a0e14;
  background:linear-gradient(145deg,#e8d5de 0%,#c9a6bc 50%,#b892a8 100%);
  border:2px solid rgba(255,255,255,.15);position:relative;overflow:hidden;
  transition:all .5s cubic-bezier(.34,1.56,.64,1)}
.tm-ball::after{content:'';position:absolute;top:4px;left:8px;width:12px;height:7px;
  background:rgba(255,255,255,.4);border-radius:50%;transform:rotate(-30deg)}
.tm-ball.picked{background:linear-gradient(145deg,var(--sd-gold),#ff9f1c,#e88a00);
  border-color:var(--sd-gold);transform:scale(1.4);
  box-shadow:0 0 20px rgba(255,200,61,.6),0 0 44px rgba(255,200,61,.25),0 2px 8px rgba(0,0,0,.3);
  color:#1a0e14;z-index:2}
.tm-anim .tm-ball.picked{animation:tmBallPulse 1.5s ease-in-out infinite}
.tm-ball.spent{opacity:.2;transform:scale(.75);filter:grayscale(1);border-color:transparent}
.tm-ball.waiting{opacity:.65}
.tm-picked-name{font-size:24px;margin-top:14px;color:var(--sd-gold);font-weight:700;
  letter-spacing:.08em}
.tm-anim .tm-picked-name{animation:tmNameReveal .4s cubic-bezier(.34,1.56,.64,1) both}
.tm-strategy{font-size:8px;letter-spacing:.18em;margin-top:6px;padding:3px 10px;
  border-radius:2px;font-weight:600}
.tm-strategy.safe{color:#b892a8;border:1px solid rgba(255,255,255,.08)}
.tm-strategy.rival{color:var(--sd-fire);border:1px solid rgba(255,41,75,.25);
  background:rgba(255,41,75,.06)}
.tm-strategy.frontrunner{color:var(--sd-gold);border:1px solid rgba(255,200,61,.25);
  background:rgba(255,200,61,.06)}

/* ── THE VERSUS CARD ──────────────────────────────────────────────── */
.tm-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:0;align-items:stretch;
  border:1px solid var(--dr-line);border-radius:4px;overflow:hidden;position:relative;
  min-height:170px}
.tm-vs-left,.tm-vs-right{display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:8px;padding:20px 16px;position:relative}
.tm-vs-left{background:linear-gradient(135deg,rgba(255,200,61,.10),transparent)}
.tm-vs-right{background:linear-gradient(225deg,rgba(255,41,75,.10),transparent)}
.tm-anim .tm-vs-left{animation:tmSlamLeft .35s cubic-bezier(.22,.68,.36,1.2) both}
.tm-anim .tm-vs-right{animation:tmSlamRight .35s cubic-bezier(.22,.68,.36,1.2) .08s both}
.tm-vs-center{display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:8px 16px;position:relative;z-index:2}
.tm-vs-tag{font-size:32px;font-weight:900;color:rgba(255,255,255,.15);
  letter-spacing:.08em;line-height:1}
.tm-anim .tm-vs-tag{animation:tmVsPop .25s cubic-bezier(.34,1.56,.64,1) .2s both}
.tm-vs-song{font-size:10px;letter-spacing:.08em;color:#b892a8;margin-top:6px;
  text-align:center;max-width:110px}
.tm-anim .tm-vs-song{animation:tmSlideUp .3s ease-out .3s both}
.tm-vs-name{font-size:15px;font-weight:700;color:#f4e3ed;text-align:center}
.tm-vs-sub{font-size:9px;letter-spacing:.14em;color:#b892a8;margin-top:2px}
.tm-vs-flash{position:absolute;inset:0;
  background:linear-gradient(90deg,rgba(255,200,61,.2),transparent 35%,transparent 65%,rgba(255,41,75,.2));
  pointer-events:none;opacity:0}
.tm-anim .tm-vs-flash{animation:tmFlashBurst .5s ease-out .15s both}
.tm-vs-divider{position:absolute;top:0;bottom:0;left:50%;width:2px;
  background:linear-gradient(180deg,transparent,rgba(255,255,255,.12),transparent);
  transform:translateX(-50%);z-index:1}

/* ── FATIGUE HUD ──────────────────────────────────────────────────── */
.tm-fatigue{display:flex;align-items:center;gap:6px;margin-top:4px}
.tm-fatigue-label{font-size:8px;letter-spacing:.12em;color:#b892a8;min-width:38px}
.tm-fatigue-bar{width:54px;height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;
  position:relative}
.tm-fatigue-fill{height:100%;border-radius:3px;transition:width .5s}

/* ── THE LIP SYNC RESULT ──────────────────────────────────────────── */
.tm-result{display:grid;grid-template-columns:1fr 1fr;gap:0;
  border:1px solid var(--dr-line);border-radius:4px;overflow:hidden;position:relative}
.tm-result-side{display:flex;flex-direction:column;align-items:center;gap:8px;
  padding:18px 14px;position:relative;overflow:hidden}
.tm-result-side + .tm-result-side{border-left:1px solid rgba(255,255,255,.06)}
.tm-result-side.win{background:linear-gradient(180deg,rgba(255,200,61,.12),transparent)}
.tm-result-side.lose{background:linear-gradient(180deg,rgba(78,30,58,.3),transparent)}
.tm-result-name{font-size:14px;font-weight:700}
.tm-result-side.win .tm-result-name{color:var(--sd-gold)}
.tm-result-side.lose .tm-result-name{color:var(--sd-dead)}
.tm-result-side.lose .dr-por,.tm-result-side.lose .dr-initials{filter:grayscale(1) brightness(.5);
  transition:filter .4s .3s}
.tm-bar{width:85%;height:7px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden;
  position:relative}
.tm-bar-fill{height:100%;border-radius:4px;width:0;transition:none;position:relative}
.tm-bar-fill.gold{background:linear-gradient(90deg,var(--sd-gold),#ff9f1c)}
.tm-bar-fill.dead{background:var(--sd-dead)}
.tm-anim .tm-bar-fill.race{animation:tmBarRace .8s cubic-bezier(.25,.8,.25,1) .2s both}
.tm-bar-fill::after{content:'';position:absolute;right:-1px;top:-2px;bottom:-2px;width:6px;
  border-radius:50%;opacity:0}
.tm-bar-fill.gold::after{background:var(--sd-gold);box-shadow:0 0 8px rgba(255,200,61,.7);opacity:1}
.tm-result-score{font-size:11px;font-variant-numeric:tabular-nums;color:#C9A6BC}
.tm-anim .tm-result-score{animation:tmSlideUp .3s ease-out .8s both}
.tm-result-stamp{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(2.5) rotate(-12deg);
  font-size:11px;font-weight:900;letter-spacing:.2em;opacity:0;pointer-events:none}
.tm-result-side.win .tm-result-stamp{color:var(--sd-gold)}
.tm-result-side.lose .tm-result-stamp{color:var(--sd-fire)}
.tm-result.on.tm-anim .tm-result-stamp{animation:tmStampSlam .4s cubic-bezier(.22,.68,.36,1.2) .9s both}

/* ── ROUND BANNERS ────────────────────────────────────────────────── */
.tm-banner{text-align:center;padding:16px 14px;border:1px solid rgba(255,255,255,.08);
  border-radius:4px;position:relative;overflow:hidden;
  background:linear-gradient(180deg,rgba(255,255,255,.04),transparent)}
.tm-banner::before{content:'';position:absolute;inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.02),transparent);
  animation:tmBannerSweep 2s ease-in-out infinite}
.tm-banner-round{font-size:10px;letter-spacing:.4em;color:var(--sd-gold);font-weight:600}
.tm-banner-line{font-size:15px;color:#f4e3ed;margin-top:5px;font-weight:600}
.tm-banner-sub{font-size:11px;color:#b892a8;margin-top:3px}
.tm-banner.danger{border-color:rgba(255,41,75,.25);
  background:linear-gradient(180deg,rgba(255,41,75,.08),transparent)}
.tm-banner.danger .tm-banner-round{color:var(--sd-fire)}
.tm-banner.danger::before{background:linear-gradient(90deg,transparent,rgba(255,41,75,.04),transparent)}

/* ── THE ELIMINATION ──────────────────────────────────────────────── */
.tm-exit{text-align:center;padding:24px 16px;position:relative;overflow:hidden;
  border:1px solid rgba(255,41,75,.3);border-radius:4px;
  background:linear-gradient(180deg,rgba(255,41,75,.10),transparent)}
.tm-exit::before{content:'';position:absolute;top:50%;left:50%;width:200%;height:200%;
  transform:translate(-50%,-50%) scale(0);border-radius:50%;
  background:radial-gradient(circle,rgba(255,41,75,.12),transparent 50%);pointer-events:none}
.tm-anim.tm-exit::before{animation:tmShockwave 1.2s ease-out both}
.tm-exit-label{font-size:9px;letter-spacing:.4em;color:var(--sd-fire);margin-bottom:12px}
.tm-anim .tm-exit-label{animation:tmSlideUp .3s ease-out both}
.tm-exit-name{font-size:26px;font-weight:700;color:var(--sd-fire);margin-top:12px}
.tm-anim .tm-exit-name{animation:tmNameReveal .4s cubic-bezier(.34,1.56,.64,1) .2s both}
.tm-exit-sub{font-size:11px;color:#b892a8;margin-top:5px}
.tm-anim .tm-exit-sub{animation:tmSlideUp .3s ease-out .4s both}

/* ── OPPONENT PICK CARD ───────────────────────────────────────────── */
.tm-pick{text-align:center;padding:22px 14px;position:relative;overflow:hidden}
.tm-pick::before{content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 50% 80%,rgba(255,41,75,.08),transparent 60%);pointer-events:none}
.tm-pick-label{font-size:9px;letter-spacing:.35em;color:var(--sd-gold);margin-bottom:14px}
.tm-pick-chooser{font-size:13px;color:#b892a8;margin-bottom:16px}
.tm-pick-chooser b{color:var(--sd-gold)}
.tm-pick-target{display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0}
.tm-pick-arrow{font-size:20px;color:var(--sd-fire);font-weight:900;letter-spacing:-.04em}
.tm-anim .tm-pick-arrow{animation:tmVsPop .3s cubic-bezier(.34,1.56,.64,1) .1s both}
.tm-pick-reveal{display:flex;flex-direction:column;align-items:center;gap:6px}
.tm-pick-name{font-size:22px;font-weight:700;color:var(--sd-fire)}
.tm-anim .tm-pick-name{animation:tmNameReveal .4s cubic-bezier(.34,1.56,.64,1) .15s both}
.tm-pick-reason{font-size:9px;letter-spacing:.12em;color:#b892a8;margin-top:8px}

/* ── SONG PICK CARD ──────────────────────────────────────────────── */
.tm-song-pick{text-align:center;padding:22px 14px;position:relative;overflow:hidden}
.tm-song-pick::before{content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 50% 120%,rgba(255,200,61,.06),transparent 70%);pointer-events:none}
.tm-song-pick-label{font-size:9px;letter-spacing:.35em;color:#b892a8;margin-bottom:6px}
.tm-song-pick-who{font-size:12px;color:#b892a8;margin-bottom:14px}
.tm-song-pick-who b{color:var(--sd-fire)}
.tm-song-pool{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:10px 0 18px;max-width:420px;margin-left:auto;margin-right:auto}
.tm-song-chip{padding:4px 10px;border-radius:3px;font-size:9.5px;letter-spacing:.04em;
  color:#8a6a7e;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);
  white-space:nowrap;transition:all .3s}
.tm-song-chip.chosen{color:var(--sd-gold);border-color:rgba(255,200,61,.35);
  background:rgba(255,200,61,.1);font-weight:700;transform:scale(1.1);
  box-shadow:0 0 12px rgba(255,200,61,.2)}
.tm-anim .tm-song-chip.chosen{animation:tmBallPulse 2s ease-in-out infinite}
.tm-song-chosen{margin-top:8px}
.tm-song-title{font-size:20px;font-weight:700;color:var(--sd-gold);letter-spacing:.04em}
.tm-anim .tm-song-title{animation:tmNameReveal .4s cubic-bezier(.34,1.56,.64,1) .1s both}
.tm-song-artist{font-size:11px;color:#b892a8;margin-top:3px;letter-spacing:.08em}
.tm-song-tags{display:flex;justify-content:center;gap:6px;margin-top:8px}
.tm-song-tag{font-size:8px;letter-spacing:.12em;padding:2px 7px;border-radius:2px;
  border:1px solid rgba(255,255,255,.08);color:#8a6a7e}

/* ── TRIPLE LIP SYNC ─────────────────────────────────────────────── */
.tm-vs.triple{grid-template-columns:1fr 1fr 1fr;min-height:190px}
.tm-vs.triple .tm-vs-center{display:none}
.tm-vs.triple .tm-vs-divider{display:none}
.tm-triple-song{text-align:center;padding:8px 10px 6px;position:absolute;top:0;left:0;right:0;
  font-size:10px;letter-spacing:.08em;color:#b892a8;z-index:3;
  background:linear-gradient(180deg,rgba(26,14,20,.9) 60%,transparent)}
.tm-vs.triple > div{padding-top:36px;background:none}
.tm-vs.triple > div:nth-child(2){border-left:1px solid rgba(255,255,255,.06);
  border-right:1px solid rgba(255,255,255,.06)}
.tm-anim .tm-vs.triple > div:nth-child(2){animation:tmSlamLeft .35s cubic-bezier(.22,.68,.36,1.2) .04s both}
.tm-anim .tm-vs.triple > div:nth-child(3){animation:tmSlamRight .35s cubic-bezier(.22,.68,.36,1.2) .08s both}

.tm-result.triple{grid-template-columns:repeat(3,1fr)}
.tm-result.triple .tm-result-side + .tm-result-side{border-left:1px solid rgba(255,255,255,.06)}

/* ── BRACKET CHAIN-FLASH ──────────────────────────────────────────── */
.sd-match.on{animation:tmMatchFlash .5s ease-out both;
  border-color:rgba(255,200,61,.2)}
.sd-elim.on{animation:tmElimFlash .6s ease-out both}

/* ── KEYFRAMES ────────────────────────────────────────────────────── */
@keyframes tmSpin{
  0%{transform:translateY(0)}
  100%{transform:translateY(var(--tm-spin-end))}
}
@keyframes tmBallPulse{
  0%,100%{box-shadow:0 0 14px rgba(255,200,61,.4),0 0 30px rgba(255,200,61,.15)}
  50%{box-shadow:0 0 22px rgba(255,200,61,.7),0 0 50px rgba(255,200,61,.3)}
}
@keyframes tmNameReveal{
  from{opacity:0;transform:scale(1.5);filter:blur(4px)}
  to{opacity:1;transform:none;filter:none}
}
@keyframes tmSlamLeft{
  from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}
}
@keyframes tmSlamRight{
  from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}
}
@keyframes tmVsPop{
  from{opacity:0;transform:scale(2.5) rotate(-15deg)}
  to{opacity:1;transform:none}
}
@keyframes tmFlashBurst{
  0%{opacity:0}15%{opacity:1}100%{opacity:0}
}
@keyframes tmSlideUp{
  from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}
}
@keyframes tmBarRace{
  0%{width:0}100%{width:var(--tm-bar-pct)}
}
@keyframes tmStampSlam{
  0%{opacity:0;transform:translate(-50%,-50%) scale(3) rotate(-20deg)}
  60%{opacity:.22;transform:translate(-50%,-50%) scale(.9) rotate(-10deg)}
  100%{opacity:.18;transform:translate(-50%,-50%) scale(1) rotate(-12deg)}
}
@keyframes tmBannerSweep{
  0%{transform:translateX(-100%)}100%{transform:translateX(100%)}
}
@keyframes tmShockwave{
  0%{transform:translate(-50%,-50%) scale(0);opacity:.6}
  100%{transform:translate(-50%,-50%) scale(1);opacity:0}
}
@keyframes tmMatchFlash{
  0%{border-color:rgba(255,200,61,.5);box-shadow:0 0 12px rgba(255,200,61,.3)}
  100%{border-color:rgba(255,200,61,.2);box-shadow:none}
}
@keyframes tmElimFlash{
  0%{border-color:rgba(255,41,75,.5);box-shadow:0 0 14px rgba(255,41,75,.3)}
  100%{border-color:rgba(255,41,75,.25);box-shadow:none}
}
@media(prefers-reduced-motion:reduce){
  .tm-reel-track,.tm-ball.picked,.tm-vs-left,.tm-vs-right,.tm-vs-tag,.tm-vs-song,
  .tm-vs-flash,.tm-bar-fill,.tm-result-stamp,.tm-result-score,.tm-picked-name,
  .tm-exit-label,.tm-exit-name,.tm-exit-sub,.tm-exit::before,.tm-banner::before,
  .sd-match.on,.sd-elim.on{animation:none!important;transition:none!important;
    opacity:1!important;transform:none!important;filter:none!important}
  .tm-bar-fill.race{width:var(--tm-bar-pct)!important}
}
`;

// ── HELPERS ──────────────────────────────────────────────────────────

function fatigueBar(factor) {
  const pct = Math.round(factor * 100);
  const cls = pct >= 85 ? 'sd-fat-ok' : pct >= 70 ? 'sd-fat-mid' : 'sd-fat-low';
  return `<div class="sd-fat"><div class="sd-fat-fill ${cls}" style="width:${pct}%"></div></div>`;
}

function fatHud(factor) {
  const pct = Math.round(factor * 100);
  const cls = pct >= 85 ? 'sd-fat-ok' : pct >= 70 ? 'sd-fat-mid' : 'sd-fat-low';
  const label = pct >= 90 ? 'FRESH' : pct >= 75 ? 'TIRED' : pct >= 60 ? 'GASSED' : 'FUMES';
  return `<div class="tm-fatigue">
    <span class="tm-fatigue-label">${label}</span>
    <div class="tm-fatigue-bar"><div class="tm-fatigue-fill ${cls}" style="width:${pct}%"></div></div>
  </div>`;
}

function side(name, ep, score, won, fatFactor) {
  const hasFatigue = fatFactor != null && fatFactor < 1.0;
  return `<div class="sd-side ${won ? 'sd-win' : 'sd-lose'}">
    ${_portrait(name, ep, { size: 26 })}
    <b>${esc(name)}</b>
    <span class="sd-sc">
      ${Number(score ?? 0).toFixed(1)}
      ${hasFatigue ? fatigueBar(fatFactor) : ''}
    </span>
  </div>`;
}

// ── SMACKDOWN (reunion bracket) ──────────────────────────────────────

export function rpBuildSmackdown(row) {
  const sd = row?.dr?.smackdown;
  if (!sd?.duels?.length) return '';
  const ep = row;
  const scenes = (row.dr.scenes || []).filter(s => s.kind === 'smackdown-duel');
  const open = (row.dr.scenes || []).find(s => s.kind === 'smackdown-open');
  const crown = (row.dr.scenes || []).find(s => s.kind === 'smackdown-crown');

  const rounds = [...new Set(sd.duels.map(d => d.round))].sort((a, b) => a - b);
  const nameOf = n => (n === rounds.length ? 'FINAL'
    : n === rounds.length - 1 ? 'SEMI-FINALS' : `ROUND ${n}`);

  const idxOf = new Map(sd.duels.map((d, i) => [d, i]));

  const bracket = rounds.map(rn => `<div class="sd-round">
      <div class="sd-round-label">${nameOf(rn)}</div>
      ${sd.duels.filter(d => d.round === rn).map(d => `
        <div class="sd-match" id="sd-match-${idxOf.get(d)}">
          <div class="sd-song">&ldquo;${esc(d.song)}&rdquo;</div>
          ${side(d.a, ep, d.adjusted?.[d.a] ?? d.scores?.[d.a], d.winner === d.a, d.fatigue?.[d.a])}
          ${side(d.b, ep, d.adjusted?.[d.b] ?? d.scores?.[d.b], d.winner === d.b, d.fatigue?.[d.b])}
        </div>`).join('')}
    </div>`).join('')
    + `<div class="sd-round"><div class="sd-round-label">CHAMPION</div>
        <div class="sd-champ" id="sd-champ">
          ${_portrait(sd.winner, ep, { size: 84, station: true })}
          <div class="sd-name dr-disp">${esc(sd.winner || '—')}</div>
          <div class="sd-belt">${esc(sd.title || '')}</div>
        </div></div>`;

  const lead = `<div class="sd-hero">
      <div class="sd-title dr-disp">The Lip Sync Smackdown</div>
      <h2 class="dr-disp">${sd.field.length} queens, one bracket</h2>
      <p>Everybody here already went home. Nobody goes home again.</p>
    </div>
    <div class="sd-bracket">${bracket}</div>`;

  const cards = [open, ...scenes, crown].filter(s => s?.text).map((sc, i) => {
    const who = (sc.data?.players || []).slice(0, 2);
    return `<div class="dr-step" id="dr-step-smackdown-${i}">
      <div class="dr-panel dr-a-lip dr-scene">
        ${who.length ? `<span class="dr-who">${who.map(n =>
    _portrait(n, ep, { size: 46 })).join('')}</span>` : ''}
        <div class="dr-scene-body">${esc(sc.text)}</div>
      </div></div>`;
  }).join('');

  const total = [open, ...scenes, crown].filter(s => s?.text).length;

  if (typeof window !== 'undefined') {
    const nDuels = sd.duels.length;
    const off = open?.text ? 1 : 0;
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.smackdown = (idx) => {
      for (let d = 0; d < nDuels; d++) {
        const box = document.getElementById(`sd-match-${d}`);
        if (box) box.classList.toggle('on', idx >= d + off);
      }
      const plinth = document.getElementById('sd-champ');
      if (plinth) plinth.classList.toggle('on', idx >= total - 1);
    };
  }
  return `<style>${SMACKDOWN_CSS}</style>${_shell(lead + cards + _controls('smackdown', total), ep, {
    phase: 'lipsync',
    title: 'The Lip Sync Smackdown',
    subtitle: 'the queens who already went home, settling it',
  })}`;
}

// ── LALAPARUZA TOURNAMENT ───────────────────────────────────────────
//
// The VP is built as a SEQUENCE of cards. Each click advances one phase:
//
//   R1 duels (chosen):
//     1. BALL DRAW     — casino slot machine picks who chooses
//     2. OPPONENT PICK — the drawn queen names her opponent (dramatic reveal)
//     3. SONG PICK     — the opponent picks from the visible song pool
//     4. VERSUS        — full VS card with portraits and fatigue bars
//     5. LIP SYNC      — prose
//     6. RESULT        — score bars race, winner/loser stamps slam
//
//   R2/R3 duels (random):
//     1. VERSUS        — RuPaul pairs them, song assigned
//     2. LIP SYNC      — prose
//     3. RESULT        — score bars race, winner/loser stamps slam
//
//   Triple lip sync (3+ queens in sudden death):
//     1. VERSUS        — 3-way card
//     2. LIP SYNC      — prose
//     3. RESULT        — 3-way result, lowest scorer eliminated
//
//   Plus: round banners, the elimination card.
//   The bracket board fills in as results land.
//   The sidebar shows fatigue, wins/losses, and song history.

export function rpBuildTournament(row) {
  const te = row?.dr?.tournament;
  if (!te?.duels?.length) return '';
  const ep = row;
  const duels = te.duels;
  const living = Object.keys(row?.dr?.performances || {});

  // ── BRACKET BOARD (always visible, fills in on reveal) ──
  const rounds = [...new Set(duels.map(d => d.round))].sort((a, b) => a - b);
  const roundName = r => r === 3 ? 'SUDDEN DEATH' : `ROUND ${r}`;

  const bracket = rounds.map(rn => `<div class="sd-round sd-r${rn}">
    <div class="sd-round-label">${roundName(rn)}</div>
    ${duels.filter(d => d.round === rn).map(d => {
    const gi = duels.indexOf(d);
    if (d.triple) {
      // Triple match: 3 contestants
      const names = d.contestants || [d.a, d.b];
      return `<div class="sd-match" id="sd-tm-${gi}">
        <div class="sd-song">&ldquo;${esc(d.song)}&rdquo;</div>
        ${names.map(n => side(n, ep,
    d.adjusted?.[n] ?? d.scores?.[n], d.winner === n, d.fatigue?.[n])).join('')}
      </div>`;
    }
    return `<div class="sd-match" id="sd-tm-${gi}">
      <div class="sd-song">&ldquo;${esc(d.song)}&rdquo;</div>
      ${side(d.a, ep, d.adjusted?.[d.a] ?? d.scores?.[d.a], d.winner === d.a, d.fatigue?.[d.a])}
      ${side(d.b, ep, d.adjusted?.[d.b] ?? d.scores?.[d.b], d.winner === d.b, d.fatigue?.[d.b])}
    </div>`;
  }).join('')}
  </div>`).join('');

  const elimPlinth = te.eliminated ? `<div class="sd-round">
    <div class="sd-round-label">ELIMINATED</div>
    <div class="sd-elim" id="sd-tm-elim">
      ${_portrait(te.eliminated, ep, { size: 84, station: true })}
      <div class="sd-name dr-disp">${esc(te.eliminated)}</div>
      <div class="sd-label">SASHAY AWAY</div>
    </div>
  </div>` : '';

  const boardHtml = `<div class="sd-bracket" id="sd-tm-board">${bracket}${elimPlinth}</div>`;

  // ── SONG POOL — a random sample for the pick display ──
  const usedSongs = new Set(duels.map(d => d.song));
  const poolSize = Math.max(8, living.length + 2);
  const poolSongs = SONGS.filter(s => usedSongs.has(s.title))
    .concat(SONGS.filter(s => !usedSongs.has(s.title)).slice(0, poolSize))
    .slice(0, poolSize);

  // ── BUILD THE STEP SEQUENCE ──
  const steps = [];
  const sidebarPanels = [];
  let stepIdx = 0;

  // Track tournament state for the sidebar
  const sideState = {
    lipsyncCount: Object.fromEntries(living.map(n => [n, 0])),
    wins: Object.fromEntries(living.map(n => [n, 0])),
    losses: Object.fromEntries(living.map(n => [n, 0])),
    songsUsed: [],
    currentRound: 0,
    status: Object.fromEntries(living.map(n => [n, 'waiting'])),
  };

  const buildSidebar = () => {
    const sorted = [...living].sort((a, b) =>
      (sideState.wins[b] || 0) - (sideState.wins[a] || 0)
      || (sideState.losses[a] || 0) - (sideState.losses[b] || 0));
    const statusIcon = s =>
      s === 'safe' ? '<span style="color:var(--sd-safe)">&#x2713;</span>'
        : s === 'danger' ? '<span style="color:var(--sd-fire)">&#x2717;</span>'
          : s === 'eliminated' ? '<span style="color:var(--sd-dead)">&#x2620;</span>'
            : '<span style="color:#8a6a7e">&middot;</span>';
    const fatBar = n => {
      const count = sideState.lipsyncCount[n] || 0;
      if (!count) return '';
      const pct = Math.round((count >= 5 ? 0.52 : [1.0, 0.88, 0.78, 0.65, 0.52][count]) * 100);
      const cls = pct >= 85 ? 'sd-fat-ok' : pct >= 70 ? 'sd-fat-mid' : 'sd-fat-low';
      return `<div class="sd-fat" style="width:32px;margin-left:auto"><div class="sd-fat-fill ${cls}" style="width:${pct}%"></div></div>`;
    };
    return `<h4 class="dr-disp" style="margin:0 0 8px">The Bracket</h4>
      <div style="font-size:9px;letter-spacing:.12em;color:var(--sd-gold);margin-bottom:6px">${
  roundName(sideState.currentRound || 1)}</div>
      ${sorted.map(n => `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;
        ${sideState.status[n] === 'eliminated' ? 'opacity:.35;' : ''}">
        ${statusIcon(sideState.status[n])}
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
          color:${sideState.status[n] === 'safe' ? 'var(--sd-safe)' : sideState.status[n] === 'eliminated' ? 'var(--sd-dead)' : '#f4e3ed'}">${esc(n)}</span>
        <span style="color:#8a6a7e;font-size:9px;font-variant-numeric:tabular-nums">${sideState.wins[n] || 0}W ${sideState.losses[n] || 0}L</span>
        ${fatBar(n)}
      </div>`).join('')}
      ${sideState.songsUsed.length ? `<div style="margin-top:10px;border-top:1px solid rgba(255,255,255,.06);padding-top:8px">
        <div style="font-size:8px;letter-spacing:.12em;color:#8a6a7e;margin-bottom:4px">SONGS USED</div>
        ${sideState.songsUsed.map(s => `<div style="font-size:10px;color:#b892a8;padding:1px 0">&ldquo;${esc(s)}&rdquo;</div>`).join('')}
      </div>` : ''}`;
  };

  const step = (html) => {
    steps.push(`<div class="dr-step" id="dr-step-tournament-${stepIdx}">${html}</div>`);
    sidebarPanels.push(buildSidebar());
    stepIdx++;
  };

  // Prose scene helper
  const proseScenes = (row.dr.scenes || []).filter(s => s.text && /^tournament-/.test(s.kind || ''));
  const proseByKind = {};
  for (const s of proseScenes) {
    if (!proseByKind[s.kind]) proseByKind[s.kind] = [];
    proseByKind[s.kind].push(s);
  }
  const nextProse = kind => (proseByKind[kind] || []).shift();

  const proseCard = (scene) => {
    if (!scene?.text) return '';
    const who = (scene.data?.players || []).slice(0, 2);
    return `<div class="dr-panel dr-a-lip dr-scene">
      ${who.length ? `<span class="dr-who">${who.map(n =>
    _portrait(n, ep, { size: 46 })).join('')}</span>` : ''}
      <div class="dr-scene-body">${esc(scene.text)}</div>
    </div>`;
  };

  // ── OPENING ──
  const openScene = nextProse('tournament-open');
  step(`<div class="dr-panel dr-a-lip">
    <div class="sd-hero">
      <div class="sd-title dr-disp">Lip Sync LaLaPaRUza</div>
      <h2 class="dr-disp">${living.length} queens, one bracket</h2>
      <p>Win your round and sit safe. Lose, and you lip sync again.</p>
    </div>
    ${openScene ? `<div class="dr-scene"><div class="dr-scene-body">${esc(openScene.text)}</div></div>` : ''}
  </div>`);

  // ── PER-ROUND ──
  let currentRound = 0;
  const ballsUsed = new Set();
  const maxAdj = duels.reduce((mx, d) => {
    const vals = d.triple && d.contestants
      ? d.contestants.map(n => d.adjusted?.[n] ?? 0)
      : [d.adjusted?.[d.a] ?? 0, d.adjusted?.[d.b] ?? 0];
    return Math.max(mx, ...vals);
  }, 1);

  for (let di = 0; di < duels.length; di++) {
    const d = duels[di];

    // ── ROUND BANNER on new round ──
    if (d.round !== currentRound) {
      currentRound = d.round;
      sideState.currentRound = d.round;
      const isDanger = d.round >= 3;
      const rScene = d.round === 1 ? null
        : d.round === 2 ? nextProse('tournament-r1-split')
          : nextProse('tournament-r2-split');

      step(`<div class="dr-panel dr-a-lip">
        <div class="tm-banner${isDanger ? ' danger' : ''}">
          <div class="tm-banner-round">${roundName(d.round)}</div>
          <div class="tm-banner-line">${
  d.round === 1 ? 'Everybody lip syncs.' :
    d.round === 2 ? 'The losers face each other.' :
      d.triple ? `${(d.contestants || []).length} queens. One song. The weakest goes home.`
        : 'One more song. The loser goes home.'}</div>
          ${d.round >= 3 ? '<div class="tm-banner-sub">Fatigue is real.</div>' : ''}
        </div>
        ${rScene ? `<div class="dr-scene" style="margin-top:10px"><div class="dr-scene-body">${esc(rScene.text)}</div></div>` : ''}
      </div>`);
    }

    // ── TRIPLE LIP SYNC ──
    if (d.triple) {
      const names = d.contestants || [d.a, d.b];

      // Triple VS card
      step(`<div class="dr-panel dr-a-lip">
        <div class="tm-vs triple on">
          <div class="tm-triple-song">&ldquo;${esc(d.song)}&rdquo; &mdash; ${esc(d.artist || '')}</div>
          ${names.map((n, ni) => `<div class="tm-vs-${ni === 0 ? 'left' : ni === 1 ? 'center' : 'right'}"
            style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:36px 12px 16px">
            ${_portrait(n, ep, { size: 58 })}
            <div class="tm-vs-name">${esc(n)}</div>
            ${d.fatigue?.[n] != null && d.fatigue[n] < 1 ? fatHud(d.fatigue[n]) : '<div class="tm-vs-sub">FRESH</div>'}
          </div>`).join('')}
        </div>
      </div>`);

      // Triple prose — R1 triples emit as tournament-duel, R3 as sudden-death
      const tripleScene = nextProse(d.round === 1 ? 'tournament-duel' : 'tournament-sudden-death');
      if (tripleScene?.text) step(proseCard(tripleScene));

      // Triple result
      const isElimRound = d.round >= 3;
      const tripleScores = names.map(n => {
        const adj = d.adjusted?.[n] ?? 0;
        const won = d.winner === n;
        const lost = d.loser === n;
        const mid = !won && !lost;
        return { n, adj, won, lost, mid };
      });
      for (const ts of tripleScores) {
        sideState.lipsyncCount[ts.n] = (sideState.lipsyncCount[ts.n] || 0) + 1;
        if (ts.lost) {
          sideState.losses[ts.n] = (sideState.losses[ts.n] || 0) + 1;
          sideState.status[ts.n] = isElimRound ? 'eliminated' : 'danger';
        } else if (ts.mid) {
          sideState.losses[ts.n] = (sideState.losses[ts.n] || 0) + 1;
          sideState.status[ts.n] = isElimRound ? 'danger' : 'danger';
        } else if (ts.won) {
          sideState.wins[ts.n] = (sideState.wins[ts.n] || 0) + 1;
          sideState.status[ts.n] = d.round === 1 ? 'safe' : sideState.status[ts.n];
        }
      }
      sideState.songsUsed.push(d.song);

      const stampFor = ts => {
        if (isElimRound) return ts.lost ? 'ELIMINATED' : 'STAYS';
        return ts.won ? 'WINS' : 'LOSES';
      };

      step(`<div class="dr-panel dr-a-lip">
        <div class="tm-result triple on" id="sd-tm-res-${di}">
          ${tripleScores.map(ts => {
    const pct = Math.round((ts.adj / maxAdj) * 100);
    const cls = ts.lost ? 'lose' : ts.won ? 'win' : 'lose';
    return `<div class="tm-result-side ${cls}">
              <div class="tm-result-stamp">${stampFor(ts)}</div>
              ${_portrait(ts.n, ep, { size: 48 })}
              <div class="tm-result-name">${esc(ts.n)}</div>
              <div class="tm-bar"><div class="tm-bar-fill ${ts.lost ? 'dead' : ts.won ? 'gold' : 'mid'} race" style="--tm-bar-pct:${pct}%"></div></div>
              <div class="tm-result-score">${ts.adj.toFixed(1)}</div>
              ${d.fatigue?.[ts.n] != null && d.fatigue[ts.n] < 1 ? fatigueBar(d.fatigue[ts.n]) : ''}
            </div>`;
  }).join('')}
        </div>
      </div>`);
      continue;
    }

    // ── STANDARD DUEL (2 queens) ──

    // ── 1. BALL DRAW (R1 chosen duels only) ──
    if (d.round === 1 && d.chosen) {
      const chooser = d.a;
      const available = living.filter(n => !ballsUsed.has(n));
      const reelNames = [];
      for (let c = 0; c < 3; c++) {
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        for (const n of shuffled) reelNames.push(n);
      }
      reelNames.push(chooser);
      const spinEnd = -(reelNames.length - 1) * 52;

      step(`<div class="dr-panel dr-a-lip">
        <div class="tm-draw">
          <div class="tm-draw-label">BALL DRAW</div>
          <div class="tm-reel">
            <div class="tm-reel-track" style="--tm-spin-end:${spinEnd}px">
              ${reelNames.map((n, i) =>
    `<div class="tm-reel-name${i === reelNames.length - 1 ? ' target' : ''}">${esc(n)}</div>`
  ).join('')}
            </div>
          </div>
          <div class="tm-balls">${living.map(n =>
    `<div class="tm-ball${n === chooser ? ' picked' : ballsUsed.has(n) ? ' spent' : ' waiting'}">${esc(n.substring(0, 3))}</div>`
  ).join('')}</div>
          <div class="tm-picked-name">${esc(chooser)}</div>
          <div style="font-size:10px;color:#b892a8;letter-spacing:.14em;margin-top:4px">GETS TO CHOOSE</div>
        </div>
      </div>`);

      // ── 2. OPPONENT PICK — separate card ──
      const stratLabel = d.strategy === 'rival' ? 'TARGETING A RIVAL'
        : d.strategy === 'frontrunner' ? 'TARGETING THE FRONT-RUNNER'
          : 'PLAYING SAFE';
      const stratCls = d.strategy || 'safe';

      step(`<div class="dr-panel dr-a-lip">
        <div class="tm-pick">
          <div class="tm-pick-label">OPPONENT PICK</div>
          <div class="tm-pick-chooser"><b>${esc(chooser)}</b> chooses&hellip;</div>
          <div class="tm-pick-target">
            ${_portrait(chooser, ep, { size: 56 })}
            <div class="tm-pick-arrow">&#x279C;</div>
            <div class="tm-pick-reveal">
              ${_portrait(d.b, ep, { size: 56 })}
              <div class="tm-pick-name">${esc(d.b)}</div>
            </div>
          </div>
          <div class="tm-strategy ${stratCls}">${stratLabel}</div>
          ${d.strategy === 'rival' ? `<div class="tm-pick-reason">${esc(chooser)} has a grudge.</div>`
    : d.strategy === 'frontrunner' ? `<div class="tm-pick-reason">${esc(d.b)} has the strongest track record.</div>`
      : `<div class="tm-pick-reason">${esc(d.b)} is the weakest lip syncer available.</div>`}
        </div>
      </div>`);

      // ── 3. SONG PICK — opponent picks from visible pool ──
      const chosenSong = poolSongs.find(s => s.title === d.song) || { title: d.song, artist: d.artist || '', tempo: '', mood: '', genre: '' };

      step(`<div class="dr-panel dr-a-lip">
        <div class="tm-song-pick">
          <div class="tm-song-pick-label">SONG PICK</div>
          <div class="tm-song-pick-who"><b>${esc(d.b)}</b> picks the lip sync song</div>
          <div class="tm-song-pool">${poolSongs.map(s =>
    `<div class="tm-song-chip${s.title === d.song ? ' chosen' : ''}">${esc(s.title)}</div>`
  ).join('')}</div>
          <div class="tm-song-chosen">
            <div class="tm-song-title">&ldquo;${esc(d.song)}&rdquo;</div>
            <div class="tm-song-artist">${esc(chosenSong.artist)}</div>
            <div class="tm-song-tags">
              ${chosenSong.tempo ? `<div class="tm-song-tag">${esc(chosenSong.tempo)}</div>` : ''}
              ${chosenSong.mood ? `<div class="tm-song-tag">${esc(chosenSong.mood)}</div>` : ''}
              ${chosenSong.genre ? `<div class="tm-song-tag">${esc(chosenSong.genre)}</div>` : ''}
            </div>
          </div>
        </div>
      </div>`);

      ballsUsed.add(chooser);
      ballsUsed.add(d.b);
    }

    // ── 4. VERSUS CARD ──
    const fatA = d.fatigue?.[d.a];
    const fatB = d.fatigue?.[d.b];

    step(`<div class="dr-panel dr-a-lip">
      <div class="tm-vs on">
        <div class="tm-vs-flash"></div>
        <div class="tm-vs-divider"></div>
        <div class="tm-vs-left">
          ${_portrait(d.a, ep, { size: 68 })}
          <div class="tm-vs-name">${esc(d.a)}</div>
          ${fatA != null && fatA < 1 ? fatHud(fatA) : '<div class="tm-vs-sub">FRESH</div>'}
        </div>
        <div class="tm-vs-center">
          <div class="tm-vs-tag">VS</div>
          <div class="tm-vs-song">&ldquo;${esc(d.song)}&rdquo;</div>
          <div style="font-size:8px;color:#8a6a7e;margin-top:2px">${esc(d.artist || '')}</div>
        </div>
        <div class="tm-vs-right">
          ${_portrait(d.b, ep, { size: 68 })}
          <div class="tm-vs-name">${esc(d.b)}</div>
          ${fatB != null && fatB < 1 ? fatHud(fatB) : '<div class="tm-vs-sub">FRESH</div>'}
        </div>
      </div>
    </div>`);

    // ── 5. LIP SYNC PROSE ──
    const duelScene = d.round === 3
      ? nextProse('tournament-sudden-death')
      : nextProse('tournament-duel');
    if (duelScene?.text) step(proseCard(duelScene));

    // ── 6. RESULT CARD ──
    // Update sidebar state BEFORE building result
    sideState.lipsyncCount[d.a] = (sideState.lipsyncCount[d.a] || 0) + 1;
    sideState.lipsyncCount[d.b] = (sideState.lipsyncCount[d.b] || 0) + 1;
    sideState.wins[d.winner] = (sideState.wins[d.winner] || 0) + 1;
    sideState.losses[d.loser] = (sideState.losses[d.loser] || 0) + 1;
    sideState.songsUsed.push(d.song);
    if (d.round === 1) {
      sideState.status[d.winner] = 'safe';
      sideState.status[d.loser] = 'danger';
    } else if (d.round === 2) {
      sideState.status[d.winner] = 'safe';
      sideState.status[d.loser] = 'danger';
    }
    if (d.round === 3) sideState.status[d.loser] = 'eliminated';

    const scoreA = d.adjusted?.[d.a] ?? 0;
    const scoreB = d.adjusted?.[d.b] ?? 0;
    const pctA = Math.round((scoreA / maxAdj) * 100);
    const pctB = Math.round((scoreB / maxAdj) * 100);
    const winA = d.winner === d.a;
    const winB = d.winner === d.b;

    step(`<div class="dr-panel dr-a-lip">
      <div class="tm-result on" id="sd-tm-res-${di}">
        <div class="tm-result-side ${winA ? 'win' : 'lose'}">
          <div class="tm-result-stamp">${winA ? 'STAYS' : 'LOSES'}</div>
          ${_portrait(d.a, ep, { size: 56 })}
          <div class="tm-result-name">${esc(d.a)}</div>
          <div class="tm-bar"><div class="tm-bar-fill ${winA ? 'gold' : 'dead'} race" style="--tm-bar-pct:${pctA}%"></div></div>
          <div class="tm-result-score">${scoreA.toFixed(1)}</div>
          ${fatA != null && fatA < 1 ? fatigueBar(fatA) : ''}
        </div>
        <div class="tm-result-side ${winB ? 'win' : 'lose'}">
          <div class="tm-result-stamp">${winB ? 'STAYS' : 'LOSES'}</div>
          ${_portrait(d.b, ep, { size: 56 })}
          <div class="tm-result-name">${esc(d.b)}</div>
          <div class="tm-bar"><div class="tm-bar-fill ${winB ? 'gold' : 'dead'} race" style="--tm-bar-pct:${pctB}%"></div></div>
          <div class="tm-result-score">${scoreB.toFixed(1)}</div>
          ${fatB != null && fatB < 1 ? fatigueBar(fatB) : ''}
        </div>
      </div>
    </div>`);
  }

  // ── ELIMINATION ──
  if (te.eliminated) {
    const elimScene = nextProse('tournament-elim');
    step(`<div class="dr-panel dr-a-lip">
      <div class="tm-exit">
        <div class="tm-exit-label">SASHAY AWAY</div>
        ${_portrait(te.eliminated, ep, { size: 84, station: true })}
        <div class="tm-exit-name">${esc(te.eliminated)}</div>
        <div class="tm-exit-sub">Eliminated by the bracket.</div>
      </div>
      ${elimScene ? `<div class="dr-scene" style="margin-top:14px"><div class="dr-scene-body">${esc(elimScene.text)}</div></div>` : ''}
    </div>`);
  }

  // ── REVEAL HOOK + ANIMATION TRIGGER ──
  const total = steps.length;
  const suffix = 'tournament';

  if (typeof window !== 'undefined') {
    window._drRevealExtra = window._drRevealExtra || {};
    window._drSidebar = window._drSidebar || {};
    window._drSidebar[suffix] = sidebarPanels;

    window._drRevealExtra[suffix] = (idx) => {
      // 1. Light bracket matches as their results are revealed
      for (let d = 0; d < duels.length; d++) {
        const resEl = document.getElementById(`sd-tm-res-${d}`);
        const matchEl = document.getElementById(`sd-tm-${d}`);
        if (!matchEl) continue;
        const resStep = resEl?.closest('.dr-step');
        const resVisible = resStep && resStep.classList.contains('dr-vis');
        matchEl.classList.toggle('on', !!resVisible);
      }
      const plinth = document.getElementById('sd-tm-elim');
      if (plinth) plinth.classList.toggle('on', idx >= total - 1);

      // 2. Add .tm-anim to the NEWEST step so CSS animations fire on reveal
      const newest = document.getElementById(`dr-step-${suffix}-${idx}`);
      if (newest && !newest.classList.contains('tm-anim')) {
        requestAnimationFrame(() => newest.classList.add('tm-anim'));
      }
    };
  }

  const hero = `<div class="sd-hero">
    <div class="sd-title dr-disp">Lip Sync LaLaPaRUza</div>
    <h2 class="dr-disp">${living.length} queens, one bracket</h2>
    <p>Win your round and sit safe. Lose, and you lip sync again.</p>
  </div>`;

  return `<style>${SMACKDOWN_CSS}${TOURNAMENT_CSS}</style>${_shell(
    hero + boardHtml + steps.join('') + _controls(suffix, total, ep.num), ep, {
      phase: 'stage',
      title: 'Lip Sync LaLaPaRUza',
      subtitle: 'the losers bracket — lose twice and you are done',
      sidebar: _seedRail(suffix, '<h4 class="dr-disp">The Bracket</h4>'),
    })}`;
}
