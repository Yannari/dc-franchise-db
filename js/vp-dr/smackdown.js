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
.tm-draw{text-align:center;padding:18px 12px;position:relative;overflow:hidden}
.tm-draw::before{content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 50% 120%,rgba(255,200,61,.08),transparent 70%);pointer-events:none}
.tm-draw-label{font-size:9px;letter-spacing:.35em;color:#b892a8;margin-bottom:10px}
.tm-balls{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:10px 0}
.tm-ball{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:700;letter-spacing:.04em;color:#1a0e14;
  background:linear-gradient(135deg,#e8d5de 0%,#c9a6bc 100%);
  border:2px solid rgba(255,255,255,.12);transition:all .4s;position:relative;overflow:hidden}
.tm-ball::after{content:'';position:absolute;top:4px;left:8px;width:10px;height:6px;
  background:rgba(255,255,255,.35);border-radius:50%;transform:rotate(-30deg)}
.tm-ball.picked{background:linear-gradient(135deg,var(--sd-gold),#ff9f1c);
  border-color:var(--sd-gold);transform:scale(1.35);
  box-shadow:0 0 18px rgba(255,200,61,.5),0 0 40px rgba(255,200,61,.2);
  color:#1a0e14;z-index:2}
.tm-ball.spent{opacity:.25;transform:scale(.8);filter:grayscale(1)}
.tm-ball.waiting{opacity:.7}
.tm-picked-name{font-size:22px;margin-top:12px;color:var(--sd-gold);font-weight:700;
  letter-spacing:.06em}

/* ── THE VERSUS CARD ──────────────────────────────────────────────── */
.tm-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:0;align-items:stretch;
  border:1px solid var(--dr-line);border-radius:4px;overflow:hidden;position:relative;
  min-height:160px}
.tm-vs-left,.tm-vs-right{display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:8px;padding:18px 14px;position:relative}
.tm-vs-left{background:linear-gradient(135deg,rgba(255,200,61,.08),transparent)}
.tm-vs-right{background:linear-gradient(225deg,rgba(255,41,75,.08),transparent)}
.tm-vs-center{display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:8px 14px;position:relative;z-index:2}
.tm-vs-tag{font-size:28px;font-weight:900;color:rgba(255,255,255,.12);
  letter-spacing:.08em;line-height:1}
.tm-vs-song{font-size:10px;letter-spacing:.08em;color:#b892a8;margin-top:6px;
  text-align:center;max-width:100px}
.tm-vs-name{font-size:14px;font-weight:700;color:#f4e3ed;text-align:center}
.tm-vs-sub{font-size:9px;letter-spacing:.14em;color:#b892a8;margin-top:2px}
.tm-vs-flash{position:absolute;inset:0;opacity:0;
  background:linear-gradient(90deg,rgba(255,200,61,.15),transparent 40%,transparent 60%,rgba(255,41,75,.15));
  pointer-events:none;transition:opacity .3s}
.tm-vs.on .tm-vs-flash{opacity:1}

/* ── FATIGUE HUD ──────────────────────────────────────────────────── */
.tm-fatigue{display:flex;align-items:center;gap:6px;margin-top:4px}
.tm-fatigue-label{font-size:8px;letter-spacing:.12em;color:#b892a8}
.tm-fatigue-bar{width:50px;height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
.tm-fatigue-fill{height:100%;border-radius:2px;transition:width .5s}

/* ── THE LIP SYNC RESULT ──────────────────────────────────────────── */
.tm-result{display:grid;grid-template-columns:1fr 1fr;gap:0;
  border:1px solid var(--dr-line);border-radius:4px;overflow:hidden}
.tm-result-side{display:flex;flex-direction:column;align-items:center;gap:8px;
  padding:16px 12px;position:relative}
.tm-result-side + .tm-result-side{border-left:1px solid rgba(255,255,255,.06)}
.tm-result-side.win{background:linear-gradient(180deg,rgba(255,200,61,.12),transparent)}
.tm-result-side.lose{background:linear-gradient(180deg,rgba(78,30,58,.3),transparent)}
.tm-result-name{font-size:13px;font-weight:700}
.tm-result-side.win .tm-result-name{color:var(--sd-gold)}
.tm-result-side.lose .tm-result-name{color:var(--sd-dead)}
.tm-result-side.lose .dr-por,.tm-result-side.lose .dr-initials{filter:grayscale(1) brightness(.5)}
.tm-bar{width:80%;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden}
.tm-bar-fill{height:100%;border-radius:3px;transition:width .6s}
.tm-bar-fill.gold{background:linear-gradient(90deg,var(--sd-gold),#ff9f1c)}
.tm-bar-fill.dead{background:var(--sd-dead)}
.tm-result-score{font-size:11px;font-variant-numeric:tabular-nums;color:#C9A6BC}
.tm-result-stamp{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(1.8) rotate(-12deg);
  font-size:11px;font-weight:900;letter-spacing:.2em;opacity:0;pointer-events:none;
  transition:opacity .3s,transform .3s}
.tm-result-side.win .tm-result-stamp{color:var(--sd-gold);opacity:0}
.tm-result-side.lose .tm-result-stamp{color:var(--sd-fire);opacity:0}
.tm-result.on .tm-result-side.win .tm-result-stamp{opacity:.18;transform:translate(-50%,-50%) scale(1) rotate(-12deg)}
.tm-result.on .tm-result-side.lose .tm-result-stamp{opacity:.18;transform:translate(-50%,-50%) scale(1) rotate(-12deg)}

/* ── ROUND BANNERS ────────────────────────────────────────────────── */
.tm-banner{text-align:center;padding:14px 12px;border:1px solid rgba(255,255,255,.06);
  border-radius:4px;background:linear-gradient(180deg,rgba(255,255,255,.03),transparent)}
.tm-banner-round{font-size:9px;letter-spacing:.4em;color:var(--sd-gold)}
.tm-banner-line{font-size:14px;color:#f4e3ed;margin-top:4px;font-weight:600}
.tm-banner-sub{font-size:11px;color:#b892a8;margin-top:2px}
.tm-banner.danger{border-color:rgba(255,41,75,.2);
  background:linear-gradient(180deg,rgba(255,41,75,.06),transparent)}
.tm-banner.danger .tm-banner-round{color:var(--sd-fire)}

/* ── THE ELIMINATION ──────────────────────────────────────────────── */
.tm-exit{text-align:center;padding:20px 14px;
  border:1px solid rgba(255,41,75,.25);border-radius:4px;
  background:linear-gradient(180deg,rgba(255,41,75,.08),transparent)}
.tm-exit-label{font-size:9px;letter-spacing:.4em;color:var(--sd-fire);margin-bottom:10px}
.tm-exit-name{font-size:24px;font-weight:700;color:var(--sd-fire);margin-top:10px}
.tm-exit-sub{font-size:11px;color:#b892a8;margin-top:4px}

/* ── ANIMATIONS ───────────────────────────────────────────────────── */
@keyframes tmPop{from{opacity:0;transform:scale(1.6) rotate(-8deg)}to{opacity:1;transform:none}}
@keyframes tmSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes tmPulse{0%,100%{box-shadow:0 0 8px rgba(255,200,61,.3)}50%{box-shadow:0 0 20px rgba(255,200,61,.6)}}
@keyframes tmStamp{from{opacity:0;transform:translate(-50%,-50%) scale(2.2) rotate(-18deg)}
  to{opacity:.18;transform:translate(-50%,-50%) scale(1) rotate(-12deg)}}
.tm-anim-pop{animation:tmPop .35s cubic-bezier(.34,1.56,.64,1) both}
.tm-anim-slide{animation:tmSlide .3s ease-out both}
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
      step(`<div class="dr-panel dr-a-lip">
        <div class="tm-draw">
          <div class="tm-draw-label">BALL DRAW</div>
          <div class="tm-balls">${living.map(n =>
    `<div class="tm-ball${n === chooser ? ' picked' : ballsUsed.has(n) ? ' spent' : ' waiting'}">${esc(n.substring(0, 3))}</div>`
  ).join('')}</div>
          <div class="tm-picked-name">${esc(chooser)}</div>
          <div style="font-size:10px;color:#b892a8;letter-spacing:.14em;margin-top:4px">GETS TO CHOOSE</div>
        </div>
      </div>`);
      ballsUsed.add(chooser);
      ballsUsed.add(d.b);
    }

    // ── VERSUS CARD ──
    const fatA = d.fatigue?.[d.a];
    const fatB = d.fatigue?.[d.b];
    const chosenLabel = d.chosen
      ? `<div style="font-size:9px;letter-spacing:.12em;color:var(--sd-gold);margin-top:4px">${esc(d.a)} CHOSE HER</div>`
      : '';
    const songPickLabel = d.chosen
      ? `<div style="font-size:9px;letter-spacing:.12em;color:#b892a8;margin-top:2px">${esc(d.b)} PICKED THE SONG</div>`
      : '';

    step(`<div class="dr-panel dr-a-lip">
      <div class="tm-vs on">
        <div class="tm-vs-flash"></div>
        <div class="tm-vs-left">
          ${_portrait(d.a, ep, { size: 64 })}
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
          ${_portrait(d.b, ep, { size: 64 })}
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
          ${_portrait(d.a, ep, { size: 52 })}
          <div class="tm-result-name">${esc(d.a)}</div>
          <div class="tm-bar"><div class="tm-bar-fill ${winA ? 'gold' : 'dead'}" style="width:${pctA}%"></div></div>
          <div class="tm-result-score">${scoreA.toFixed(1)}</div>
          ${fatA != null && fatA < 1 ? fatigueBar(fatA) : ''}
        </div>
        <div class="tm-result-side ${winB ? 'win' : 'lose'}">
          <div class="tm-result-stamp">${winB ? 'STAYS' : 'LOSES'}</div>
          ${_portrait(d.b, ep, { size: 52 })}
          <div class="tm-result-name">${esc(d.b)}</div>
          <div class="tm-bar"><div class="tm-bar-fill ${winB ? 'gold' : 'dead'}" style="width:${pctB}%"></div></div>
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
