// ══════════════════════════════════════════════════════════════════════
// vp-dr/finale-screens.js — the finale's own screens, not generic cards
// ══════════════════════════════════════════════════════════════════════
//
// The showcase, the interview, the cut, and the winner moment — four
// screens that were rendered as the same grey text card as a werk room
// chat. A finale deserves better.
import { _shell, _portrait, _judgePortrait, _icon } from './style.js';
import { _controls } from './reveal.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

// ══════════════════════════════════════════════════════════════════════
//  THE SHOWCASE — each finalist performs her original number
// ══════════════════════════════════════════════════════════════════════

const TIER_LABEL = { killed: 'THE NUMBER OF HER LIFE', strong: 'STRONG', shaky: 'SHAKY' };
const TIER_COLOR = { killed: '#FFC83D', strong: '#FF7BC8', shaky: '#7f4460' };
const TIER_GLOW  = {
  killed: '0 0 48px rgba(255,200,61,.7),0 0 90px rgba(255,200,61,.3)',
  strong: '0 0 38px rgba(255,123,200,.5),0 0 70px rgba(255,61,154,.2)',
  shaky:  '0 0 22px rgba(127,68,96,.4)',
};

export const SHOWCASE_CSS = `
.sc-wrap{--sc-gold:#FFC83D;--sc-pink:#FF3D9A;--sc-deep:#0a0205}
.sc-stage{position:relative;overflow:hidden;
  background:radial-gradient(600px 400px at 50% 30%,rgba(255,61,154,.16),transparent 65%),
    radial-gradient(500px 300px at 50% 70%,rgba(255,200,61,.08),transparent 60%),
    linear-gradient(180deg,#12030A,#0a0205)}

/* ── ONE PERFORMER, ON HER STAGE ── */
.sc-card{position:relative;padding:32px 24px;text-align:center;
  border:1px solid rgba(255,61,154,.3);
  background:radial-gradient(400px 260px at 50% 20%,rgba(255,61,154,.12),transparent 70%),
    linear-gradient(180deg,rgba(18,3,10,.9),rgba(10,2,5,.95));
  margin-bottom:18px}
.sc-card .dr-por{margin:0 auto;border:3px solid rgba(255,200,61,.5);
  transition:box-shadow .6s,border-color .6s}
.sc-name{display:block;margin-top:14px;font-size:24px;color:#fff6fb}
.sc-text{margin:18px auto 0;max-width:64ch;color:#f4e3ed;font-size:15px;
  line-height:1.65;text-wrap:pretty;text-align:left}

/* ── THE PERFORMANCE METER ── SVG arc ── */
.sc-meter{display:block;width:140px;height:76px;margin:18px auto 0}
.sc-meter-bg{fill:none;stroke:rgba(255,255,255,.1);stroke-width:8;stroke-linecap:round}
.sc-meter-fill{fill:none;stroke-width:8;stroke-linecap:round;
  transition:stroke-dashoffset 1.2s cubic-bezier(.2,1,.3,1);stroke-dashoffset:170}
.sc-tier{display:block;margin-top:8px;font-size:13px;letter-spacing:.28em;
  text-transform:uppercase;opacity:0;transform:scale(1.3);
  transition:opacity .5s .3s,transform .5s .3s cubic-bezier(.2,1.5,.35,1)}
.dr-vis .sc-tier{opacity:1;transform:scale(1)}

/* ── THE OPEN ── host announces the showcase ── */
.sc-open{padding:28px 26px;text-align:center;
  border-top:1px solid rgba(255,61,154,.3);border-bottom:1px solid rgba(255,61,154,.3);
  background:linear-gradient(180deg,rgba(255,61,154,.08),transparent)}
.sc-open q{display:block;font-family:Didot,'Bodoni MT',Georgia,serif;font-size:20px;
  line-height:1.55;color:#fff6fb;quotes:none;text-wrap:pretty;max-width:60ch;margin:0 auto}

/* ── ENTRANCE ANIMATION ── */
.dr-step.dr-vis .sc-card{animation:scReveal .6s cubic-bezier(.2,1,.3,1) both}
@keyframes scReveal{from{opacity:0;transform:translateY(28px) scale(.95)}
  to{opacity:1;transform:none}}
.dr-step.dr-vis .sc-open{animation:crSpeak .55s cubic-bezier(.2,.9,.3,1) both}

@media(prefers-reduced-motion:reduce){
  .sc-meter-fill{transition:none}
  .sc-tier{transition:none}
  .dr-step.dr-vis .sc-card,.dr-step.dr-vis .sc-open{animation:none}
}
`;

function meterSvg(pct, color) {
  const r = 60, cx = 70, cy = 68;
  const circ = Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, pct)));
  return `<svg class="sc-meter" viewBox="0 0 140 76">
    <path class="sc-meter-bg" d="M10,68 A60,60 0 0,1 130,68"/>
    <path class="sc-meter-fill" d="M10,68 A60,60 0 0,1 130,68"
      stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"
      data-target="${Math.round(offset)}"/>
  </svg>`;
}

export function rpBuildShowcase(row) {
  const ep = epOf(row);
  const scenes = (row?.dr?.scenes || []).filter(s =>
    /^finale:finale-showcase/.test(s.kind || '') && s.text);
  if (!scenes.length) return '';

  const finalists = row?.dr?.finale?.placements || row?.dr?.living || [];
  const open = scenes.find(s => s.kind === 'finale:finale-showcase-open');
  const perfs = scenes.filter(s => s.kind === 'finale:finale-showcase');

  let n = 0;
  const steps = [];

  if (open) {
    steps.push(`<div class="dr-step" id="dr-step-finshowcase-${n++}">
      <div class="sc-open">
        <div style="display:flex;justify-content:center;margin-bottom:12px">
          ${_judgePortrait('rupaul', { stage: true, size: 48 })}
        </div>
        <q>${esc(open.text)}</q>
      </div></div>`);
  }

  for (const sc of perfs) {
    const who = (sc.data?.players || [])[0] || '';
    const perf = Number(sc.data?.perf) || 0;
    const tier = sc.data?.tier || 'strong';
    const pct = Math.min(1, perf / 12);
    const color = TIER_COLOR[tier] || TIER_COLOR.strong;
    const glow = TIER_GLOW[tier] || '';

    steps.push(`<div class="dr-step" id="dr-step-finshowcase-${n++}">
      <div class="sc-card" data-tier="${esc(tier)}" data-pct="${pct.toFixed(3)}"
        data-color="${esc(color)}">
        ${_portrait(who, ep, { size: 120, station: true })}
        <b class="sc-name dr-disp">${esc(who)}</b>
        ${meterSvg(pct, color)}
        <span class="sc-tier" style="color:${color}">${TIER_LABEL[tier] || 'PERFORMED'}</span>
        <p class="sc-text">${esc(sc.text)}</p>
      </div></div>`);
  }

  if (typeof window !== 'undefined') {
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.finshowcase = (idx) => {
      for (const card of document.querySelectorAll('.sc-card')) {
        const step = card.closest('.dr-step');
        if (!step || !step.classList.contains('dr-vis')) continue;
        const fill = card.querySelector('.sc-meter-fill');
        if (fill) fill.style.strokeDashoffset = fill.dataset.target + 'px';
        const por = card.querySelector('.dr-por');
        if (por) por.style.boxShadow = TIER_GLOW[card.dataset.tier] || '';
      }
    };
  }

  const rail = `<h4 class="dr-disp">The Showcase</h4>${
    finalists.map(nm => {
      const done = perfs.some(s => (s.data?.players || [])[0] === nm);
      return `<div class="dr-slot"><div>${_portrait(nm, ep, { size: 32 })}</div>
        <div><div class="dr-nm">${esc(nm)}</div></div></div>`;
    }).join('')}`;

  return `<style>${SHOWCASE_CSS}</style>${_shell(
    `<div class="sc-wrap"><div class="sc-stage">${steps.join('')}</div></div>`, ep, {
      phase: 'stage', title: 'The Showcase',
      subtitle: 'individual show-stopping original numbers',
      sidebar: rail,
    })}${_controls('finshowcase', Math.max(1, n), ep.num)}`;
}


// ══════════════════════════════════════════════════════════════════════
//  THE INTERVIEW — one-on-one with the host
// ══════════════════════════════════════════════════════════════════════

export const INTERVIEW_CSS = `
.iv-wrap{--iv-warm:rgba(255,233,168,.08)}
.iv-stage{position:relative;overflow:hidden;
  background:radial-gradient(360px 280px at 50% 40%,rgba(255,233,168,.1),transparent 70%),
    linear-gradient(180deg,#12030A,#0a0205)}

/* ── THE OLD SINGLE-LINE CARD ── kept as fallback ── */
.iv-card{position:relative;padding:24px 22px;margin-bottom:16px;
  display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:start;
  border:1px solid rgba(255,233,168,.2);
  background:linear-gradient(135deg,rgba(255,233,168,.06),transparent 50%),
    rgba(10,2,5,.9)}
.iv-host{text-align:center;min-width:68px}
.iv-host-label{display:block;font-size:8px;letter-spacing:.22em;
  text-transform:uppercase;color:#C9A6BC;margin-bottom:6px}
.iv-host .dr-por{border:2px solid rgba(255,233,168,.4);
  box-shadow:0 0 22px rgba(255,233,168,.3)}
.iv-guest{text-align:center;min-width:68px}
.iv-guest .dr-por{border:2px solid rgba(255,123,200,.4);
  box-shadow:0 0 22px rgba(255,61,154,.3)}
.iv-guest-name{display:block;margin-top:6px;font-size:13px;color:#fff6fb}
.iv-body{padding:6px 0}
.iv-body p{margin:0;color:#f4e3ed;font-size:15px;line-height:1.65;text-wrap:pretty;
  border-left:3px solid rgba(255,233,168,.3);padding-left:16px}

/* ── DIALOGUE CARD — Michelle asks, queen answers ── */
.iv-dlg{position:relative;padding:20px 22px;margin-bottom:14px;
  display:grid;gap:16px;align-items:start;
  border:1px solid rgba(255,233,168,.18);
  background:linear-gradient(135deg,rgba(255,233,168,.05),transparent 50%),
    rgba(10,2,5,.92)}

/* Michelle's line: portrait left, text right */
.iv-dlg.iv-michelle{grid-template-columns:auto 1fr;
  border-left:4px solid rgba(255,233,168,.5);
  background:linear-gradient(90deg,rgba(255,233,168,.1),transparent 40%),
    rgba(10,2,5,.92)}
.iv-dlg.iv-michelle .iv-speaker{text-align:center;min-width:60px}
.iv-dlg.iv-michelle .iv-speaker .dr-por{border:2px solid rgba(255,233,168,.5);
  box-shadow:0 0 24px rgba(255,233,168,.4)}
.iv-dlg.iv-michelle .iv-speaker-label{display:block;margin-top:5px;font-size:8px;
  letter-spacing:.22em;text-transform:uppercase;color:rgba(255,233,168,.7)}

/* Queen's line: text left, portrait right */
.iv-dlg.iv-queen{grid-template-columns:1fr auto;
  border-right:4px solid rgba(255,123,200,.5);border-left:0;
  background:linear-gradient(270deg,rgba(255,61,154,.1),transparent 40%),
    rgba(10,2,5,.92)}
.iv-dlg.iv-queen .iv-speaker{text-align:center;min-width:60px}
.iv-dlg.iv-queen .iv-speaker .dr-por{border:2px solid rgba(255,123,200,.5);
  box-shadow:0 0 24px rgba(255,61,154,.4)}
.iv-dlg.iv-queen .iv-speaker-label{display:block;margin-top:5px;font-size:8px;
  letter-spacing:.22em;text-transform:uppercase;color:rgba(255,123,200,.7)}

.iv-dlg .iv-text{padding:4px 0}
.iv-dlg .iv-text p{margin:0;color:#f4e3ed;font-size:15px;line-height:1.65;text-wrap:pretty}
.iv-dlg.iv-michelle .iv-text p{border-left:3px solid rgba(255,233,168,.3);padding-left:14px}
.iv-dlg.iv-queen .iv-text p{border-right:3px solid rgba(255,123,200,.3);padding-right:14px;
  text-align:right}

/* ── QUEEN HEADER — separates each finalist's interview ── */
.iv-header{text-align:center;padding:20px 16px 12px;
  border-top:1px solid rgba(255,233,168,.2);margin-top:8px}
.iv-header b{display:block;margin-top:8px;font-size:20px;color:#fff6fb}

/* ── SPOTLIGHT — the room follows the queen ── */
.iv-spot{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(300px 260px at var(--spot-x,50%) 40%,
    rgba(255,233,168,.08),transparent 70%);
  transition:--spot-x .7s cubic-bezier(.2,1,.3,1)}

/* ── ENTRANCE ── */
.dr-step.dr-vis .iv-card{animation:ivIn .5s cubic-bezier(.2,1,.3,1) both}
.dr-step.dr-vis .iv-dlg{animation:ivIn .5s cubic-bezier(.2,1,.3,1) both}
.dr-step.dr-vis .iv-dlg.iv-queen{animation:ivInR .5s cubic-bezier(.2,1,.3,1) both}
@keyframes ivIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}
@keyframes ivInR{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}

@media(max-width:760px){.iv-dlg.iv-queen .iv-text p{text-align:left}}
@media(prefers-reduced-motion:reduce){
  .iv-spot{transition:none}
  .dr-step.dr-vis .iv-card,.dr-step.dr-vis .iv-dlg{animation:none}
}
`;

export function rpBuildInterview(row) {
  const ep = epOf(row);
  const INTERVIEW_KINDS = new Set([
    'finale:finale-interview',
    'finale:finale-interview-ask', 'finale:finale-interview-answer',
    'finale:finale-interview-follow', 'finale:finale-interview-close',
  ]);
  const scenes = (row?.dr?.scenes || []).filter(s =>
    INTERVIEW_KINDS.has(s.kind) && s.text);
  if (!scenes.length) return '';

  const finalists = row?.dr?.finale?.placements || row?.dr?.living || [];
  const isDialogue = scenes.some(s => s.kind !== 'finale:finale-interview');

  let n = 0;
  let steps = '';
  let lastQueen = '';

  if (isDialogue) {
    for (const sc of scenes) {
      const who = (sc.data?.players || [])[0] || '';
      const beat = sc.data?.beat || '';
      const isMichelle = /interview-ask|interview-follow/.test(beat);
      const isQueen = /interview-answer|interview-close/.test(beat);

      if (who && who !== lastQueen) {
        steps += `<div class="dr-step" id="dr-step-fininterview-${n++}">
          <div class="iv-header">
            ${_portrait(who, ep, { size: 72, station: true })}
            <b class="dr-disp">${esc(who)}</b>
          </div></div>`;
        lastQueen = who;
      }

      if (isMichelle) {
        steps += `<div class="dr-step" id="dr-step-fininterview-${n++}">
          <div class="iv-dlg iv-michelle" data-queen="${esc(who)}">
            <div class="iv-speaker">
              ${_judgePortrait('michelle', { stage: true, size: 52 })}
              <span class="iv-speaker-label">Michelle</span>
            </div>
            <div class="iv-text"><p>${esc(sc.text)}</p></div>
          </div></div>`;
      } else if (isQueen) {
        steps += `<div class="dr-step" id="dr-step-fininterview-${n++}">
          <div class="iv-dlg iv-queen" data-queen="${esc(who)}">
            <div class="iv-text"><p>${esc(sc.text)}</p></div>
            <div class="iv-speaker">
              ${_portrait(who, ep, { size: 52, station: true })}
              <span class="iv-speaker-label">${esc(who)}</span>
            </div>
          </div></div>`;
      } else {
        steps += `<div class="dr-step" id="dr-step-fininterview-${n++}">
          <div class="iv-card" data-queen="${esc(who)}">
            <div class="iv-host">
              <span class="iv-host-label">Michelle</span>
              ${_judgePortrait('michelle', { stage: true, size: 56 })}
            </div>
            <div class="iv-body"><p>${esc(sc.text)}</p></div>
            <div class="iv-guest">
              ${_portrait(who, ep, { size: 72, station: true })}
              <span class="iv-guest-name dr-disp">${esc(who)}</span>
            </div>
          </div></div>`;
      }
    }
  } else {
    for (const sc of scenes) {
      const who = (sc.data?.players || [])[0] || '';
      steps += `<div class="dr-step" id="dr-step-fininterview-${n++}">
        <div class="iv-card" data-queen="${esc(who)}">
          <div class="iv-host">
            <span class="iv-host-label">Michelle</span>
            ${_judgePortrait('michelle', { stage: true, size: 56 })}
          </div>
          <div class="iv-body"><p>${esc(sc.text)}</p></div>
          <div class="iv-guest">
            ${_portrait(who, ep, { size: 72, station: true })}
            <span class="iv-guest-name dr-disp">${esc(who)}</span>
          </div>
        </div></div>`;
    }
  }

  if (typeof window !== 'undefined') {
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.fininterview = (idx) => {
      const step = document.getElementById(`dr-step-fininterview-${idx}`);
      const card = step?.querySelector('.iv-dlg, .iv-card');
      if (!card) return;
      const total = n;
      const pct = total > 1 ? 30 + (idx / (total - 1)) * 40 : 50;
      const stage = document.querySelector('.iv-stage');
      if (stage) stage.style.setProperty('--spot-x', `${pct}%`);
    };
  }

  const rail = `<h4 class="dr-disp">One on One</h4>${
    finalists.map(nm => `<div class="dr-slot">
      ${_portrait(nm, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(nm)}</div></div></div>`).join('')}`;

  return `<style>${INTERVIEW_CSS}</style>${_shell(
    `<div class="iv-wrap"><div class="iv-stage"><div class="iv-spot"></div>${steps}</div></div>`, ep, {
      phase: 'werk', title: 'The Interviews',
      subtitle: 'why should it be you',
      sidebar: rail,
    })}${_controls('fininterview', Math.max(1, n), ep.num)}`;
}


// ══════════════════════════════════════════════════════════════════════
//  THE CUT — the field becomes two
// ══════════════════════════════════════════════════════════════════════

export const CUT_CSS = `
.ct-wrap{position:relative}

/* ── THE LINEUP ── sticky, lights go out ── */
.ct-stage{position:sticky;top:0;z-index:6;padding:18px 20px 16px;margin-bottom:20px;
  background:radial-gradient(120% 90% at 50% 0%,rgba(255,41,75,.14),transparent 55%),
    linear-gradient(180deg,#1D0710,#12030A 70%,rgba(10,2,5,.97));
  border-bottom:1px solid rgba(255,41,75,.35);
  box-shadow:0 20px 44px -24px rgba(0,0,0,.96)}
.ct-line{display:flex;justify-content:center;align-items:flex-end;gap:18px;flex-wrap:wrap}

.ct-plate{position:relative;width:130px;padding:14px 10px 10px;text-align:center;
  border:1px solid rgba(255,255,255,.18);border-radius:2px;
  background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.4));
  transition:opacity .6s,filter .6s,transform .6s cubic-bezier(.2,1.1,.4,1),
    border-color .6s,box-shadow .6s}
.ct-plate::before{content:"";position:absolute;left:50%;bottom:100%;
  width:100px;height:150px;transform:translateX(-50%);pointer-events:none;
  background:linear-gradient(180deg,rgba(255,41,75,.25),transparent 75%);
  clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);transition:opacity .6s}
.ct-plate .dr-por{margin:0 auto;border:2px solid rgba(255,200,200,.4);
  box-shadow:0 0 22px rgba(255,41,75,.4);transition:filter .6s,border-color .6s,box-shadow .6s}
.ct-plate b{display:block;margin-top:8px;font-size:16px;color:#fff6fb}

/* CUT: light goes out */
.ct-plate.ct-out{opacity:.35;transform:translateY(8px) scale(.88);
  border-color:rgba(255,255,255,.06)}
.ct-plate.ct-out .dr-por{filter:grayscale(1) brightness(.45);
  border-color:rgba(255,255,255,.1);box-shadow:none}
.ct-plate.ct-out::before{opacity:0}

/* SURVIVING: brighter */
.ct-plate.ct-safe{border-color:rgba(255,200,61,.5);transform:translateY(-4px);
  box-shadow:0 0 40px -8px rgba(255,200,61,.4)}
.ct-plate.ct-safe .dr-por{border-color:rgba(255,200,61,.6);
  box-shadow:0 0 36px rgba(255,200,61,.6)}
.ct-plate.ct-safe::before{background:linear-gradient(180deg,rgba(255,233,168,.4),transparent 78%)}

/* ── THE BEATS ── host speaks, queen reacts ── */
.ct-said{padding:24px 26px;text-align:center;
  border-top:1px solid rgba(255,41,75,.3);border-bottom:1px solid rgba(255,41,75,.3);
  background:linear-gradient(180deg,rgba(255,41,75,.06),transparent)}
.ct-said q{display:block;font-family:Didot,'Bodoni MT',Georgia,serif;font-size:20px;
  line-height:1.55;color:#fff6fb;quotes:none;text-wrap:pretty;max-width:60ch;margin:0 auto}
.ct-react{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:16px 20px;border-left:3px solid rgba(255,41,75,.4);
  background:rgba(0,0,0,.3)}
.ct-react p{margin:0;color:#f4e3ed;line-height:1.65;text-wrap:pretty}
.ct-react .dr-por{border:2px solid rgba(255,200,200,.3)}

.dr-step.dr-vis .ct-said{animation:crSpeak .55s cubic-bezier(.2,.9,.3,1) both}
.dr-step.dr-vis .ct-react{animation:crTell .45s ease-out both}
@keyframes crTell{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}

/* ── SUSPENSE — the host deliberates ── */
.ct-suspense{border-color:rgba(255,233,168,.3);
  background:linear-gradient(180deg,rgba(255,233,168,.06),transparent)}
.ct-suspense q{color:rgba(255,233,168,.85);font-size:18px}

/* ── LAST WORDS — the cut queen speaks ── */
.ct-lastwords{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:16px 20px;margin-top:-4px;
  border-left:3px solid rgba(127,68,96,.5);
  background:linear-gradient(90deg,rgba(127,68,96,.12),transparent 40%),rgba(0,0,0,.3)}
.ct-lastwords .dr-por{border:2px solid rgba(127,68,96,.5);
  filter:brightness(.75) saturate(.7);box-shadow:0 0 18px rgba(127,68,96,.3)}
.ct-lw-label{display:block;font-size:9px;letter-spacing:.3em;text-transform:uppercase;
  color:rgba(127,68,96,.8);margin-bottom:4px}
.ct-lw-body p{margin:0;color:#c9a6bc;line-height:1.6;font-style:italic;text-wrap:pretty}
.dr-step.dr-vis .ct-lastwords{animation:crTell .45s ease-out both}

@media(max-width:760px){.ct-stage{position:static}.ct-plate{width:100px}}
@media(prefers-reduced-motion:reduce){
  .ct-plate,.ct-plate::before,.ct-plate .dr-por{transition:none}
  .dr-step.dr-vis .ct-said,.dr-step.dr-vis .ct-react,.dr-step.dr-vis .ct-lastwords{animation:none}
}
`;

export function rpBuildCut(row) {
  const ep = epOf(row);
  const CUT_KINDS = new Set([
    'finale:finale-cut', 'finale:finale-cut-reaction',
    'finale:finale-cut-suspense', 'finale:finale-cut-lastwords',
  ]);
  const allCut = (row?.dr?.scenes || []).filter(s => CUT_KINDS.has(s.kind) && s.text);
  if (!allCut.length) return '';

  const cutScene = allCut.find(s => s.kind === 'finale:finale-cut');
  const suspense = allCut.filter(s => s.kind === 'finale:finale-cut-suspense');
  const reactions = allCut.filter(s => s.kind === 'finale:finale-cut-reaction');
  const lastwords = allCut.filter(s => s.kind === 'finale:finale-cut-lastwords');

  const finalists = row?.dr?.finale?.placements || row?.dr?.living || [];
  const cutQueens = cutScene?.data?.cut || [];
  const safe = finalists.filter(n => !cutQueens.includes(n));

  const line = [...finalists].sort((a, b) => a.localeCompare(b));
  const stage = `<div class="ct-stage" id="ct-stage">
    <div class="ct-line">${line.map(n =>
      `<div class="ct-plate" id="ct-plate-${esc(n)}" data-queen="${esc(n)}">
        ${_portrait(n, ep, { size: 80, station: true })}
        <b class="dr-disp">${esc(n)}</b>
      </div>`).join('')}</div></div>`;

  let n = 0;
  const steps = [];

  for (const sc of suspense) {
    steps.push(`<div class="dr-step" id="dr-step-fincut-${n++}"
      data-cut="" data-safe="">
      <div class="ct-said ct-suspense">
        <div style="display:flex;justify-content:center;margin-bottom:12px">
          ${_judgePortrait('rupaul', { stage: true, size: 48 })}
        </div>
        <q>${esc(sc.text)}</q>
      </div></div>`);
  }

  if (cutScene) {
    steps.push(`<div class="dr-step" id="dr-step-fincut-${n++}"
      data-cut="" data-safe="">
      <div class="ct-said">
        <div style="display:flex;justify-content:center;margin-bottom:12px">
          ${_judgePortrait('rupaul', { stage: true, size: 48 })}
        </div>
        <q>${esc(cutScene.text)}</q>
      </div></div>`);
  }

  const cutSoFar = [];
  const lastwordsMap = {};
  for (const sc of lastwords) {
    const who = (sc.data?.players || [])[0] || '';
    if (who) lastwordsMap[who] = sc.text;
  }

  for (const sc of reactions) {
    const who = (sc.data?.players || [])[0] || '';
    cutSoFar.push(who);
    const isFinal = cutSoFar.length >= cutQueens.length;
    steps.push(`<div class="dr-step" id="dr-step-fincut-${n++}"
      data-cut="${esc(cutSoFar.join(','))}" data-safe="${esc(isFinal ? safe.join(',') : '')}">
      <div class="ct-react">
        ${_portrait(who, ep, { size: 56, station: true })}
        <p>${esc(sc.text)}</p>
      </div></div>`);
    if (lastwordsMap[who]) {
      steps.push(`<div class="dr-step" id="dr-step-fincut-${n++}"
        data-cut="${esc(cutSoFar.join(','))}" data-safe="${esc(isFinal ? safe.join(',') : '')}">
        <div class="ct-lastwords">
          ${_portrait(who, ep, { size: 48, station: true })}
          <div class="ct-lw-body">
            <span class="ct-lw-label dr-disp">Last Words</span>
            <p>${esc(lastwordsMap[who])}</p>
          </div>
        </div></div>`);
    }
  }

  if (typeof window !== 'undefined') {
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.fincut = (idx) => {
      const step = document.getElementById(`dr-step-fincut-${idx}`);
      const gone = (step?.dataset.cut || '').split(',').filter(Boolean);
      const survivors = (step?.dataset.safe || '').split(',').filter(Boolean);
      for (const el of document.querySelectorAll('.ct-plate')) {
        const q = el.dataset.queen;
        el.classList.toggle('ct-out', gone.includes(q));
        el.classList.toggle('ct-safe', survivors.includes(q));
      }
    };
  }

  const rail = `<h4 class="dr-disp">The Cut</h4>${
    line.map(nm => `<div class="dr-slot">
      ${_portrait(nm, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(nm)}</div></div></div>`).join('')}`;

  return `<style>${CUT_CSS}</style>${_shell(
    `<div class="ct-wrap">${stage}${steps.join('')}</div>`, ep, {
      phase: 'stage', title: 'The Cut',
      subtitle: 'the field becomes two',
      sidebar: rail,
    })}${_controls('fincut', Math.max(1, n), ep.num)}`;
}


// ══════════════════════════════════════════════════════════════════════
//  LIP SYNC FOR THE CROWN — the same fight, in gold
// ══════════════════════════════════════════════════════════════════════

export const CROWN_LS_CSS = `
.cls-wrap{--cls-gold:#FFC83D;--cls-warm:#FFE9A8;--cls-deep:#0a0205}

/* ── THE GOLDEN FLOOR ── */
.cls-floor{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden;background:linear-gradient(180deg,rgba(40,28,2,.85),rgba(10,4,1,.95) 60%)}
.cls-floor i{position:absolute;display:block}
.cls-floor .cls-spot-a,.cls-floor .cls-spot-b{top:-20%;width:340px;height:80%;
  clip-path:polygon(36% 0,64% 0,100% 100%,0 100%);
  transition:opacity .6s cubic-bezier(.2,1,.3,1),transform .6s cubic-bezier(.2,1,.3,1),
    filter .6s cubic-bezier(.2,1,.3,1)}
.cls-spot-a{left:10%;background:radial-gradient(ellipse at 50% 0%,
  rgba(255,200,61,.45),rgba(255,233,168,.1) 40%,transparent 72%)}
.cls-spot-b{right:10%;background:radial-gradient(ellipse at 50% 0%,
  rgba(255,200,61,.45),rgba(255,233,168,.1) 40%,transparent 72%)}
.cls-thud{left:0;right:0;bottom:0;height:35%;
  background:radial-gradient(70% 100% at 50% 100%,rgba(255,200,61,.2),transparent 72%);
  animation:clsThud 2.2s ease-in-out infinite}
@keyframes clsThud{0%,100%{opacity:.4}50%{opacity:1}}
.cls-haze{left:0;right:0;bottom:0;height:50%;
  background:linear-gradient(180deg,transparent,rgba(255,200,61,.06) 40%,rgba(255,233,168,.03));
  animation:clsHaze 7s ease-in-out infinite alternate}
@keyframes clsHaze{0%{opacity:.3;transform:scaleX(1)}100%{opacity:.65;transform:scaleX(1.06)}}

/* ── SPOTLIGHT TRACKING ── */
.cls-floor.cls-focus-a .cls-spot-a{opacity:1;transform:scale(1.15);filter:brightness(1.6) saturate(1.2)}
.cls-floor.cls-focus-a .cls-spot-b{opacity:.12;transform:scale(.85);filter:brightness(.4)}
.cls-floor.cls-focus-b .cls-spot-b{opacity:1;transform:scale(1.15);filter:brightness(1.6) saturate(1.2)}
.cls-floor.cls-focus-b .cls-spot-a{opacity:.12;transform:scale(.85);filter:brightness(.4)}

/* ── THE GOLD VS PANEL ── */
.cls-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:22px;align-items:center;
  padding:36px 28px 30px;margin-bottom:20px;position:relative;overflow:hidden;
  border:2px solid rgba(255,200,61,.55);
  background:radial-gradient(700px 340px at 50% 38%,rgba(255,200,61,.2),transparent 68%),
    radial-gradient(400px 200px at 22% 30%,rgba(255,233,168,.1),transparent 70%),
    radial-gradient(400px 200px at 78% 30%,rgba(255,200,61,.1),transparent 70%),
    linear-gradient(180deg,#241a00,#0a0400)}
.cls-vs::before{content:"";position:absolute;inset:0;
  background:repeating-linear-gradient(115deg,transparent 0 26px,rgba(255,200,61,.05) 26px 52px);
  animation:clsSlide 12s linear infinite}
@keyframes clsSlide{to{transform:translateX(52px)}}
.cls-fighter{position:relative;z-index:2;text-align:center;
  transition:opacity .55s cubic-bezier(.2,1,.3,1),filter .55s cubic-bezier(.2,1,.3,1)}
.cls-fighter .dr-por{margin:0 auto;border:3px solid rgba(255,233,168,.7);
  box-shadow:0 0 44px rgba(255,200,61,.6),0 0 90px -10px rgba(255,233,168,.2);
  transition:box-shadow .6s cubic-bezier(.2,1,.3,1),border-color .6s}
.cls-fighter.cls-r .dr-por{transform:scaleX(-1)}
.cls-fighter b{display:block;margin-top:10px;font-size:24px;letter-spacing:.03em;color:var(--cls-warm)}
.cls-fighter-ppe{display:block;margin-top:3px;font-size:13px;color:#C9A6BC;font-variant-numeric:tabular-nums}

/* ── THE GOLD BOLT ── */
.cls-bolt{position:relative;z-index:2;font-size:52px;color:var(--cls-warm);
  text-shadow:0 0 32px rgba(255,200,61,.8),0 0 80px rgba(255,200,61,.4),0 0 130px rgba(255,200,61,.15);
  animation:clsPulse 2.4s ease-in-out infinite}
@keyframes clsPulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.1);opacity:1}}
.cls-energy{height:16px;background:rgba(0,0,0,.7);border:1px solid rgba(255,200,61,.35);
  margin-top:12px;overflow:hidden;border-radius:1px;position:relative}
.cls-energy i{display:block;height:100%;border-radius:1px;
  background:linear-gradient(90deg,rgba(255,200,61,.3),#FFC83D,#FFE9A8);
  box-shadow:0 0 22px rgba(255,200,61,.7);transition:width .6s cubic-bezier(.2,1,.3,1)}
.cls-final{display:block;margin-top:8px;min-height:24px;font-size:24px;color:var(--cls-warm);
  font-variant-numeric:tabular-nums}

/* ── PRE-DUEL INTERVIEW ── RuPaul talks to a queen before her fight ── */
.cls-preduel{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:start;
  padding:20px 22px;margin-bottom:14px;
  border:1px solid rgba(255,233,168,.25);border-left:4px solid rgba(255,200,61,.5);
  background:linear-gradient(90deg,rgba(255,200,61,.1),transparent 40%),rgba(10,4,1,.9)}
.cls-preduel .cls-pd-host{text-align:center;min-width:56px}
.cls-preduel .cls-pd-host .dr-por{border:2px solid rgba(255,200,61,.5);
  box-shadow:0 0 22px rgba(255,200,61,.4)}
.cls-preduel .cls-pd-queen{text-align:center;min-width:56px}
.cls-preduel .cls-pd-queen .dr-por{border:2px solid rgba(255,123,200,.4);
  box-shadow:0 0 18px rgba(255,61,154,.3)}
.cls-pd-name{display:block;margin-top:5px;font-size:11px;color:#fff6fb}
.cls-pd-text{padding:4px 0}
.cls-pd-text p{margin:0;color:#f4e3ed;font-size:15px;line-height:1.6;text-wrap:pretty;
  border-left:3px solid rgba(255,233,168,.3);padding-left:14px}
.dr-step.dr-vis .cls-preduel{animation:ivIn .5s cubic-bezier(.2,1,.3,1) both}

/* ── ROUND HEADER — separates bracket rounds ── */
.cls-round-hdr{text-align:center;padding:18px 16px 10px;
  border-top:2px solid rgba(255,200,61,.3);margin-top:12px}
.cls-round-hdr b{font-size:11px;letter-spacing:.35em;text-transform:uppercase;
  color:var(--cls-gold)}

/* ── HOST CEREMONY ── the host speaks with weight ── */
.cls-hostsay{padding:24px 26px;text-align:center;
  border-top:2px solid rgba(255,200,61,.4);border-bottom:2px solid rgba(255,200,61,.4);
  background:linear-gradient(180deg,rgba(255,200,61,.1),transparent)}
.cls-hostsay q{display:block;font-family:Didot,'Bodoni MT',Georgia,serif;font-size:22px;
  line-height:1.5;color:var(--cls-warm);quotes:none;text-wrap:pretty;max-width:60ch;margin:0 auto}
.cls-host-icon{display:flex;justify-content:center;gap:8px;margin-bottom:12px}
.cls-host-label{font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:var(--cls-gold)}

/* ── DUEL CARD ── each round of the bracket ── */
.cls-duel{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;
  padding:20px 22px;margin-bottom:14px;
  border:1px solid rgba(255,200,61,.3);
  background:linear-gradient(135deg,rgba(255,200,61,.08),transparent 50%),rgba(10,4,1,.9)}
.cls-duel-name{text-align:center}
.cls-duel-name b{font-size:20px;color:var(--cls-warm);display:block;margin-top:8px}
.cls-duel-name.cls-won b{color:var(--cls-gold)}
.cls-duel-name.cls-won .dr-por{border:2px solid var(--cls-gold);
  box-shadow:0 0 40px rgba(255,200,61,.7)}
.cls-duel-name.cls-lost .dr-por{filter:grayscale(.7) brightness(.5)}
.cls-duel-name.cls-lost b{color:#7a6040;text-decoration:line-through;text-decoration-color:rgba(255,200,61,.3)}
.cls-duel-mid{text-align:center}
.cls-duel-song{font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;
  font-size:17px;color:#ffd0b8;margin-bottom:6px}
.cls-duel-vs{font-size:14px;letter-spacing:.2em;color:var(--cls-gold)}
.cls-duel-winner{display:block;margin-top:8px;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;color:var(--cls-gold)}

.dr-step.dr-vis .cls-hostsay{animation:crSpeak .55s cubic-bezier(.2,.9,.3,1) both}
.dr-step.dr-vis .cls-duel{animation:clsDuelIn .6s cubic-bezier(.2,1,.3,1) both}
@keyframes clsDuelIn{from{opacity:0;transform:translateY(22px) scale(.96)}
  to{opacity:1;transform:none}}

@media(max-width:760px){.cls-vs{grid-template-columns:1fr;text-align:center;gap:14px}}
@media(prefers-reduced-motion:reduce){
  .cls-spot-a,.cls-spot-b,.cls-fighter,.cls-energy i{transition:none}
  .cls-thud,.cls-haze,.cls-bolt,.cls-vs::before{animation:none}
  .dr-step.dr-vis .cls-hostsay,.dr-step.dr-vis .cls-duel{animation:none}
}
`;

export function rpBuildCrownLipSync(row) {
  const ep = epOf(row);
  /* ── AND WHAT ACTUALLY HAPPENED IN THE LIP SYNC ──
     The duel drew two portraits, two energy bars and a verdict, and said
     nothing about either performance: `finale-duel` shipped `text: ''` and
     nothing else on this screen was about the song. Reported as "there's no
     prose for the lipsync for the crown so we don't know what's happening".
     js/dr/finale.js narrates it off the SONG now, the way every ordinary lip
     sync in the show is narrated — one card per queen from the tempo pool,
     then the moment the record is decided at from the hook pool. */
  const LS_KINDS = new Set([
    'finale:finale-crown-lipsync', 'finale-duel',
    'finale:finale-preduel', 'finale:finale-interview',
    'finale:duel-beat', 'finale:duel-hook',
  ]);
  const scenes = (row?.dr?.scenes || []).filter(s =>
    LS_KINDS.has(s.kind) && (s.text || s.data?.duel));
  if (!scenes.length) return '';

  const finalists = row?.dr?.finale?.placements || row?.dr?.living || [];
  const duels = scenes.filter(s => s.data?.duel).map(s => s.data.duel);
  const isBracket = duels.length > 1;

  let n = 0;
  const steps = [];
  const duelMeta = [];

  for (const sc of scenes) {
    if (sc.kind === 'finale:finale-crown-lipsync' && sc.text) {
      steps.push(`<div class="dr-step" id="dr-step-fincrownls-${n++}">
        <div class="cls-hostsay">
          <div class="cls-host-icon">
            ${_judgePortrait('rupaul', { stage: true, size: 48 })}
          </div>
          <span class="cls-host-label">RuPaul</span>
          <q>${esc(sc.text)}</q>
        </div></div>`);
    } else if (sc.kind === 'finale:finale-preduel' && sc.text) {
      const who = (sc.data?.players || [])[0] || '';
      steps.push(`<div class="dr-step" id="dr-step-fincrownls-${n++}">
        <div class="cls-preduel">
          <div class="cls-pd-host">
            ${_judgePortrait('rupaul', { stage: true, size: 48 })}
          </div>
          <div class="cls-pd-text"><p>${esc(sc.text)}</p></div>
          <div class="cls-pd-queen">
            ${_portrait(who, ep, { size: 52, station: true })}
            <span class="cls-pd-name dr-disp">${esc(who)}</span>
          </div>
        </div></div>`);
    } else if (sc.kind === 'finale:finale-interview' && sc.text) {
      const who = (sc.data?.players || [])[0] || '';
      steps.push(`<div class="dr-step" id="dr-step-fincrownls-${n++}">
        <div class="cls-preduel">
          <div class="cls-pd-host">
            ${_judgePortrait('rupaul', { stage: true, size: 48 })}
          </div>
          <div class="cls-pd-text"><p>${esc(sc.text)}</p></div>
          <div class="cls-pd-queen">
            ${_portrait(who, ep, { size: 52, station: true })}
            <span class="cls-pd-name dr-disp">${esc(who)}</span>
          </div>
        </div></div>`);
    } else if ((sc.kind === 'finale:duel-beat' || sc.kind === 'finale:duel-hook')
      && sc.text) {
      const who = (sc.data?.players || [])[0] || '';
      const isHook = sc.kind === 'finale:duel-hook';
      steps.push(`<div class="dr-step" id="dr-step-fincrownls-${n++}">
        <div class="cls-duelbeat${isHook ? ' cls-duelhook' : ''}">
          ${_portrait(who, ep, { size: 54, station: true })}
          <div>
            <span class="cls-db-who dr-disp">${esc(who)}</span>
            ${isHook ? `<span class="cls-db-k">${
  sc.data?.tier === 'nailed' ? 'takes the moment' : 'loses the moment'}</span>` : ''}
            <p>${esc(sc.text)}</p>
          </div>
        </div></div>`);
    } else if (sc.data?.duel) {
      const d = sc.data.duel;
      const di = duelMeta.length;
      const sA = Number(d.scores?.[d.a]) || 0;
      const sB = Number(d.scores?.[d.b]) || 0;
      const mx = Math.max(sA, sB, 1);
      const rLabel = sc.data?.roundLabel || (di < duels.length - 1 ? 'Semi-Final' : 'The Final');
      duelMeta.push({ a: d.a, b: d.b, sA, sB, mx, winner: d.winner || '' });

      if (isBracket) {
        steps.push(`<div class="dr-step" id="dr-step-fincrownls-${n++}">
          <div class="cls-round-hdr"><b>${esc(
            di < duels.length - 1 ? `Semi-Final ${di + 1}` : 'The Final')}</b></div>
        </div>`);
      }

      steps.push(`<div class="dr-step" id="dr-step-fincrownls-${n++}"
        data-duel-idx="${di}" data-winner="${esc(d.winner || '')}">
        <div class="cls-vs" id="cls-vs-${di}">
          <div class="cls-fighter" id="cls-f-${di}-a">
            ${_portrait(d.a, ep, { size: isBracket ? 100 : 120, station: true })}
            <b class="dr-disp">${esc(d.a)}</b>
            <div class="cls-energy"><i id="cls-en-${di}-a" style="width:0%"></i></div>
            <span class="cls-final dr-num" id="cls-fin-${di}-a"></span>
          </div>
          <div style="text-align:center">
            ${d.song ? `<div class="cls-duel-song">${esc(d.song)}${
              d.artist ? `<span style="display:block;font-size:13px;color:#C9A6BC;font-style:normal">${esc(d.artist)}</span>` : ''
            }</div>` : ''}
            <div class="cls-bolt dr-disp">VS</div>
            <span class="cls-duel-winner dr-disp" id="cls-verdict-${di}" hidden></span>
          </div>
          <div class="cls-fighter cls-r" id="cls-f-${di}-b">
            ${_portrait(d.b, ep, { size: isBracket ? 100 : 120, station: true })}
            <b class="dr-disp">${esc(d.b)}</b>
            <div class="cls-energy"><i id="cls-en-${di}-b" style="width:0%"></i></div>
            <span class="cls-final dr-num" id="cls-fin-${di}-b"></span>
          </div>
        </div></div>`);
    }
  }

  if (typeof window !== 'undefined') {
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.fincrownls = (idx) => {
      const floor = document.querySelector('.cls-floor');
      const step = document.getElementById(`dr-step-fincrownls-${idx}`);
      if (!step) return;

      const di = step.dataset.duelIdx;
      if (di !== undefined) {
        const m = duelMeta[Number(di)];
        if (!m) return;
        const enA = document.getElementById(`cls-en-${di}-a`);
        const enB = document.getElementById(`cls-en-${di}-b`);
        const finA = document.getElementById(`cls-fin-${di}-a`);
        const finB = document.getElementById(`cls-fin-${di}-b`);
        const fA = document.getElementById(`cls-f-${di}-a`);
        const fB = document.getElementById(`cls-f-${di}-b`);
        const verdict = document.getElementById(`cls-verdict-${di}`);
        const w = step.dataset.winner;

        if (enA) enA.style.width = (m.sA / m.mx * 100) + '%';
        if (enB) enB.style.width = (m.sB / m.mx * 100) + '%';
        if (finA) finA.textContent = m.sA.toFixed(1);
        if (finB) finB.textContent = m.sB.toFixed(1);
        if (fA && w) { fA.style.opacity = w === m.a ? '1' : '.35';
          if (w !== m.a) fA.style.filter = 'grayscale(.6) brightness(.5)'; }
        if (fB && w) { fB.style.opacity = w === m.b ? '1' : '.35';
          if (w !== m.b) fB.style.filter = 'grayscale(.6) brightness(.5)'; }
        if (verdict && w) {
          verdict.hidden = false;
          const isLast = Number(di) === duelMeta.length - 1;
          verdict.textContent = w + (isLast ? ' takes the crown' : ' advances');
        }
        if (floor) {
          floor.classList.remove('cls-focus-a', 'cls-focus-b');
          if (w === m.a) floor.classList.add('cls-focus-a');
          else if (w === m.b) floor.classList.add('cls-focus-b');
        }
      }
    };
  }

  const rail = `<h4 class="dr-disp">For The Crown</h4>${
    finalists.map(nm => `<div class="dr-slot">
      ${_portrait(nm, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(nm)}</div></div></div>`).join('')}`;

  return `<style>${CROWN_LS_CSS}</style>${_shell(
    `<div class="cls-wrap" style="position:relative">
      <div class="cls-floor" id="cls-floor" aria-hidden="true">
        <i class="cls-spot-a"></i><i class="cls-spot-b"></i>
        <i class="cls-thud"></i><i class="cls-haze"></i>
      </div>
      ${steps.join('')}
    </div>`, ep, {
      phase: 'lipsync', title: 'Lip Sync For The Crown',
      subtitle: 'this is for everything',
      sidebar: rail,
    })}${_controls('fincrownls', Math.max(1, n), ep.num)}`;
}
