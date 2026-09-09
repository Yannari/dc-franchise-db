// ══════════════════════════════════════════════════════════════════════
// vp-dr/smackdown.js — the bracket, drawn as a bracket
// ══════════════════════════════════════════════════════════════════════
import { _shell, _portrait } from './style.js';
import { _controls } from './reveal.js';

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
  animation:tmSpin 1.2s cubic-bezier(.2,.6,.3,1) both}
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
  color:#1a0e14;z-index:2;animation:tmBallPulse 1.5s ease-in-out infinite}
.tm-ball.spent{opacity:.2;transform:scale(.75);filter:grayscale(1);border-color:transparent}
.tm-ball.waiting{opacity:.65}
.tm-picked-name{font-size:24px;margin-top:14px;color:var(--sd-gold);font-weight:700;
  letter-spacing:.08em;animation:tmNameReveal .4s cubic-bezier(.34,1.56,.64,1) both}
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
.tm-vs-left{background:linear-gradient(135deg,rgba(255,200,61,.10),transparent);
  animation:tmSlamLeft .35s cubic-bezier(.22,.68,.36,1.2) both}
.tm-vs-right{background:linear-gradient(225deg,rgba(255,41,75,.10),transparent);
  animation:tmSlamRight .35s cubic-bezier(.22,.68,.36,1.2) .08s both}
.tm-vs-center{display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:8px 16px;position:relative;z-index:2}
.tm-vs-tag{font-size:32px;font-weight:900;color:rgba(255,255,255,.15);
  letter-spacing:.08em;line-height:1;animation:tmVsPop .25s cubic-bezier(.34,1.56,.64,1) .2s both}
.tm-vs-song{font-size:10px;letter-spacing:.08em;color:#b892a8;margin-top:6px;
  text-align:center;max-width:110px;animation:tmSlideUp .3s ease-out .3s both}
.tm-vs-name{font-size:15px;font-weight:700;color:#f4e3ed;text-align:center}
.tm-vs-sub{font-size:9px;letter-spacing:.14em;color:#b892a8;margin-top:2px}
.tm-vs-flash{position:absolute;inset:0;
  background:linear-gradient(90deg,rgba(255,200,61,.2),transparent 35%,transparent 65%,rgba(255,41,75,.2));
  pointer-events:none;animation:tmFlashBurst .5s ease-out .15s both}
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
.tm-bar-fill.race{animation:tmBarRace .8s cubic-bezier(.25,.8,.25,1) .2s both}
.tm-bar-fill::after{content:'';position:absolute;right:-1px;top:-2px;bottom:-2px;width:6px;
  border-radius:50%;opacity:0}
.tm-bar-fill.gold::after{background:var(--sd-gold);box-shadow:0 0 8px rgba(255,200,61,.7);opacity:1}
.tm-result-score{font-size:11px;font-variant-numeric:tabular-nums;color:#C9A6BC;
  animation:tmSlideUp .3s ease-out .8s both}
.tm-result-stamp{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(2.5) rotate(-12deg);
  font-size:11px;font-weight:900;letter-spacing:.2em;opacity:0;pointer-events:none}
.tm-result-side.win .tm-result-stamp{color:var(--sd-gold)}
.tm-result-side.lose .tm-result-stamp{color:var(--sd-fire)}
.tm-result.on .tm-result-stamp{animation:tmStampSlam .4s cubic-bezier(.22,.68,.36,1.2) .9s both}

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
  transform:translate(-50%,-50%);border-radius:50%;
  background:radial-gradient(circle,rgba(255,41,75,.12),transparent 50%);
  animation:tmShockwave 1.2s ease-out both;pointer-events:none}
.tm-exit-label{font-size:9px;letter-spacing:.4em;color:var(--sd-fire);margin-bottom:12px;
  animation:tmSlideUp .3s ease-out both}
.tm-exit-name{font-size:26px;font-weight:700;color:var(--sd-fire);margin-top:12px;
  animation:tmNameReveal .4s cubic-bezier(.34,1.56,.64,1) .2s both}
.tm-exit-sub{font-size:11px;color:#b892a8;margin-top:5px;animation:tmSlideUp .3s ease-out .4s both}

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
// The VP is built as a SEQUENCE of cards, not a static bracket. Each
// click advances one phase of one duel:
//
//   R1 duels (chosen):
//     1. BALL DRAW — casino ball machine picks who chooses
//     2. VERSUS    — she names her opponent, opponent picks the song
//     3. LIP SYNC  — scores, fatigue bars, result stamp
//
//   R2/R3 duels (random):
//     1. VERSUS    — RuPaul pairs them, song assigned
//     2. LIP SYNC  — scores, fatigue bars, result stamp
//
//   Plus: round banners, prose cards, the elimination card.
//   The bracket board at the top fills in as results land.

export function rpBuildTournament(row) {
  const te = row?.dr?.tournament;
  if (!te?.duels?.length) return '';
  const ep = row;
  const duels = te.duels;
  const assignment = row?.dr?.assignment || {};
  const living = Object.keys(row?.dr?.performances || {});

  // ── BRACKET BOARD (always visible, fills in on reveal) ──
  const rounds = [...new Set(duels.map(d => d.round))].sort((a, b) => a - b);
  const roundName = r => r === 3 ? 'SUDDEN DEATH' : `ROUND ${r}`;

  const bracket = rounds.map(rn => `<div class="sd-round">
    <div class="sd-round-label">${roundName(rn)}</div>
    ${duels.filter(d => d.round === rn).map(d => {
    const gi = duels.indexOf(d);
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

  // ── BUILD THE STEP SEQUENCE ──
  const steps = [];
  let stepIdx = 0;
  const step = (html) => {
    steps.push(`<div class="dr-step" id="dr-step-tournament-${stepIdx}">${html}</div>`);
    stepIdx++;
  };

  // Prose scene helper
  const proseScenes = (row.dr.scenes || []).filter(s => s.text && /^tournament-/.test(s.kind || ''));
  const proseByKind = {};
  for (const s of proseScenes) {
    if (!proseByKind[s.kind]) proseByKind[s.kind] = [];
    proseByKind[s.kind].push(s);
  }
  const nextProse = kind => {
    const arr = proseByKind[kind];
    return arr?.shift();
  };

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
  const maxScore = Math.max(...duels.map(d =>
    Math.max(d.adjusted?.[d.a] ?? 0, d.adjusted?.[d.b] ?? 0)), 1);

  for (let di = 0; di < duels.length; di++) {
    const d = duels[di];

    // Round banner on new round
    if (d.round !== currentRound) {
      currentRound = d.round;
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
      'One more song. The loser goes home.'}</div>
          ${d.round >= 3 ? '<div class="tm-banner-sub">Fatigue is real.</div>' : ''}
        </div>
        ${rScene ? `<div class="dr-scene" style="margin-top:10px"><div class="dr-scene-body">${esc(rScene.text)}</div></div>` : ''}
      </div>`);
    }

    // ── BALL DRAW (R1 chosen duels only) ──
    if (d.round === 1 && d.chosen) {
      const chooser = d.a;
      // Build the slot reel: 3 full cycles of all names then land on target
      const reelNames = [];
      const available = living.filter(n => !ballsUsed.has(n));
      for (let c = 0; c < 3; c++) {
        for (const n of available.sort(() => 0.5 - Math.random()))
          reelNames.push(n);
      }
      reelNames.push(chooser);
      const spinEnd = -(reelNames.length - 1) * 52;

      const stratLabel = d.strategy === 'rival' ? 'TARGETING A RIVAL'
        : d.strategy === 'frontrunner' ? 'TARGETING THE FRONT-RUNNER'
          : 'PLAYING SAFE';
      const stratCls = d.strategy || 'safe';

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
          <div class="tm-strategy ${stratCls}">${stratLabel}</div>
        </div>
      </div>`);
      ballsUsed.add(chooser);
      ballsUsed.add(d.b);
    }

    // ── VERSUS CARD ──
    const fatA = d.fatigue?.[d.a];
    const fatB = d.fatigue?.[d.b];
    const chosenLabel = d.chosen
      ? `<div style="font-size:9px;letter-spacing:.12em;color:var(--sd-gold);margin-top:6px">${esc(d.a)} CHOSE HER</div>`
      : '';
    const songPickLabel = d.chosen
      ? `<div style="font-size:9px;letter-spacing:.12em;color:#b892a8;margin-top:2px">${esc(d.b)} PICKED THE SONG</div>`
      : '';

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
          ${chosenLabel}${songPickLabel}
        </div>
        <div class="tm-vs-right">
          ${_portrait(d.b, ep, { size: 68 })}
          <div class="tm-vs-name">${esc(d.b)}</div>
          ${fatB != null && fatB < 1 ? fatHud(fatB) : '<div class="tm-vs-sub">FRESH</div>'}
        </div>
      </div>
    </div>`);

    // ── LIP SYNC PROSE ──
    const duelScene = d.round === 3
      ? nextProse('tournament-sudden-death')
      : nextProse('tournament-duel');
    if (duelScene?.text) {
      step(proseCard(duelScene));
    }

    // ── RESULT CARD ──
    const scoreA = d.adjusted?.[d.a] ?? 0;
    const scoreB = d.adjusted?.[d.b] ?? 0;
    const pctA = Math.round((scoreA / maxScore) * 100);
    const pctB = Math.round((scoreB / maxScore) * 100);
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

  // ── REVEAL HOOK ──
  const total = steps.length;
  const suffix = 'tournament';

  if (typeof window !== 'undefined') {
    window._drRevealExtra = window._drRevealExtra || {};

    // Map each step index to which duel (if any) just completed.
    // We mark a duel as "resolved" on its RESULT step. Build a map
    // of stepIdx → duelIdx for result cards.
    const duelResultSteps = [];
    let si = 0;
    // Reconstruct: opening = 1 step. Then per round: banner (1 step).
    // Per duel: [draw?] + versus + [prose?] + result.
    // We track which step index is the result for each duel.
    // Easier: just track by the dom ids.

    window._drRevealExtra[suffix] = (idx) => {
      // Light bracket matches progressively. Each result card has a known
      // duel index embedded in its id. Walk every match and check if its
      // result card has been revealed.
      for (let d = 0; d < duels.length; d++) {
        const resEl = document.getElementById(`sd-tm-res-${d}`);
        const matchEl = document.getElementById(`sd-tm-${d}`);
        if (!matchEl) continue;
        // Result is visible if its parent dr-step is not hidden
        const resStep = resEl?.closest('.dr-step');
        const resVisible = resStep && !resStep.hidden;
        matchEl.classList.toggle('on', !!resVisible);
      }
      const plinth = document.getElementById('sd-tm-elim');
      if (plinth) plinth.classList.toggle('on', idx >= total - 1);
    };
  }

  const hero = `<div class="sd-hero">
    <div class="sd-title dr-disp">Lip Sync LaLaPaRUza</div>
    <h2 class="dr-disp">${living.length} queens, one bracket</h2>
    <p>Win your round and sit safe. Lose, and you lip sync again.</p>
  </div>`;

  return `<style>${SMACKDOWN_CSS}${TOURNAMENT_CSS}</style>${_shell(
    hero + boardHtml + steps.join('') + _controls(suffix, total), ep, {
      phase: 'stage',
      title: 'Lip Sync LaLaPaRUza',
      subtitle: 'the losers bracket — lose twice and you are done',
    })}`;
}
