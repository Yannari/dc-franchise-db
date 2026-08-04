// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/slingshot.js — "The Range"
//
// The themed screen for js/bb-comps/classics.js → Slingshot Aim
// (`variant: 'slingshot'`).
//
// A night range under floodlights: one ring board standing across the yard,
// a row of obstacles hanging between it and the firing line, and a crate of
// six balls per houseguest that does not get topped up.
//
// The board is the hero and it is SHARED — it stands once at the top of the
// screen, lit by whatever the best shot of the night has been so far, so the
// reveal is watched on the same target the houseguests are shooting at. Each
// run below is a firing lane seen from behind the shooter: the crate emptying
// left to right as balls are spent, and the shots plotted as a grouping on
// that lane's own small board — a tight cluster and a scattered one look
// different at a glance, which is the whole competition.
//
// Declines when the shot data is missing.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const RINGS = [2, 4, 6, 10];

/** Where a shot lands on the board: value decides the ring, the name the angle. */
function plot(value, seed) {
  const ring = RINGS.indexOf(value);
  // Outer misses sit off the board entirely; the tight centre is ring 3.
  const radius = value === 0 ? 46 : 40 - ring * 10;
  const angle = (seed % 360) * (Math.PI / 180);
  return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
}

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigSlingshot(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const withShots = Object.entries(breakdown).filter(([, v]) => Array.isArray(v?.shots) && v.shots.length);
  if (!withShots.length) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'PRECISION', accent: '#c8f24a' };
  const LIME = '#c9f24a';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_sling_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 23 + salt * 11 + pool.length) % pool.length];

  const RUN_FLAV = [
    'The obstacles do not move all night. Everybody keeps hitting them anyway.',
    'Six balls is not many when two are gone before the hand settles.',
    'The centre ring is the size of a dinner plate and looks smaller from the line.',
    'Nobody gets a practice shot. The first one is a shot.',
    'The band is heavier than it looks, and it gets heavier every draw.',
  ];
  const WIN_FLAV = [
    'The crates get collected. Most still have balls in them.',
    'Six decisions, and it went to whoever made fewest of them badly.',
    'The floods go off over the board with the centre still lit.',
    'Nobody out-shot anybody by much. That is the whole story of the night.',
  ];

  // ── steps ────────────────────────────────────────────────────────────
  let steps = [];
  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (b.badgeClass === 'gold' && tag === 'WINS') { steps.push({ kind: 'win', beat: b }); return; }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    const who = (b.players || [])[0];
    steps.push({ kind: who && breakdown[who]?.shots ? 'run' : 'note', beat: b, name: who });
  });
  if (!steps.length) return '';

  const winner = act.winner || (act.results || [])[0]?.name || '';
  const fieldSize = (act.participants || (act.results || []).map(r => r.name) || []).filter(Boolean).length
    || withShots.length;

  if (sealed) {
    const keep = planSeal(steps, {
      countKind: 'run', cap: Math.max(2, Math.ceil(fieldSize / 2)),
      isResult: st => st.kind === 'win',
    });
    steps = steps.slice(0, keep);
    steps.push({ kind: 'cut' }, { kind: 'irony' });
  }

  const total = steps.length;
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;

  const shown = steps.slice(0, revealed).filter(s => s.kind === 'run' && breakdown[s.name])
    .map(s => ({ name: s.name, ...breakdown[s.name] }))
    .sort((a, b) => (b.total ?? -1) - (a.total ?? -1));

  const bestSoFar = sealed ? 0 : shown.reduce((m, r) => Math.max(m, r.best || 0), 0);

  /** The board — concentric rings. `big` draws the shared hero board. */
  const board = (shots, big) => `<div class="sls-board ${big ? 'is-hero' : ''}"
      style="${big ? '' : ''}">
    <i class="sls-r0 ${bestSoFar >= 2 || !big ? 'is-on' : ''}"></i>
    <i class="sls-r1 ${(big ? bestSoFar >= 4 : true) ? 'is-on' : ''}"></i>
    <i class="sls-r2 ${(big ? bestSoFar >= 6 : true) ? 'is-on' : ''}"></i>
    <i class="sls-r3 ${(big ? bestSoFar >= 10 : true) ? 'is-on' : ''}"></i>
    ${(shots || []).map((sh, k) => {
    const p = plot(sh.value, (k + 1) * 61 + (sh.value + 3) * 37);
    return `<b class="sls-hit ${sh.value === 0 ? 'is-off' : ''} ${sh.value >= 10 ? 'is-centre' : ''}"
        style="left:${p.x}%;top:${p.y}%"></b>`;
  }).join('')}
  </div>`;

  /** The crate: six balls, spent left to right. */
  const crate = shots => `<div class="sls-crate">
    ${shots.map(sh => `<span class="sls-ball ${sh.value === 0 ? 'is-wasted' : 'is-scored'}"
      title="Shot ${sh.shot}: ${sh.value}"></span>`).join('')}
    ${Array.from({ length: Math.max(0, 6 - shots.length) }, () => '<span class="sls-ball"></span>').join('')}
  </div>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return '<div class="sls-lane is-dark"><span class="sls-wait">LANE DARK</span></div>';

    if (s.kind === 'open') {
      return `<article class="sls-lane sls-call">
        <p class="sls-body">${E(s.beat.text)}</p>
        <span class="sls-callk">${E(s.beat.badgeText || 'SIX SHOTS')} &middot; ${fieldSize} ON THE LINE</span>
      </article>`;
    }
    if (s.kind === 'cut') {
      return sealCutCard('sls', { standing: Math.max(0, fieldSize - shown.length),
        unit: 'still to shoot', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('sls', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const w = breakdown[winner] || {};
      return `<article class="sls-lane sls-won">
        <div class="sls-shooter">${AV(winner, 54)}<span><b>${E(winner)}</b>
          <em>${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</em></span></div>
        <div class="sls-wonb">
          <p class="sls-body">${E(s.beat.text)}</p>
          <p class="sls-flav">${E(flav(WIN_FLAV, i))}</p>
        </div>
        <div class="sls-tot">${sealed ? MASK : E(w.total ?? 0)}</div>
      </article>`;
    }
    if (s.kind === 'note') {
      return `<article class="sls-lane sls-call">
        <p class="sls-body">${E(s.beat.text)}</p>
        <span class="sls-callk">${E(s.beat.badgeText || '')}</span>
      </article>`;
    }

    const bd = breakdown[s.name] || {};
    const shots = bd.shots || [];
    return `<article class="sls-lane sls-run ${bd.threw ? 'is-threw' : ''}">
      <div class="sls-shooter">${AV(s.name, 42)}<span><b>${E(s.name)}</b>
        <em>${sealed ? MASK : E(s.beat.badgeText || '')}</em></span></div>
      <div class="sls-mid">
        <p class="sls-body">${E(s.beat.text)}</p>
        ${crate(shots)}
        <div class="sls-nums">
          <span>on the board <b>${sealed ? MASK : (6 - (bd.misses ?? 0))}/6</b></span>
          <span>best <b>${sealed ? MASK : (bd.best ?? 0)}</b></span>
          ${bd.haveNot ? '<span>have-not <b>yes</b></span>' : ''}
        </div>
        <p class="sls-flav">${E(flav(RUN_FLAV, i))}</p>
      </div>
      <div class="sls-group">
        ${board(sealed ? [] : shots, false)}
        <span class="sls-tot">${sealed ? MASK : E(bd.total ?? 0)}</span>
      </div>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigrange">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&family=Inter:wght@400;500&display=swap');
  .sigrange{--rg-lime:${LIME};--rg-dim:#7c8a63;--rg-net:rgba(200,242,74,.14);
    max-width:1100px;margin:0 auto;color:#eef6dd;font-family:Inter,system-ui,sans-serif;
    background:
      radial-gradient(ellipse 60% 40% at 50% -6%,rgba(230,255,190,.16),transparent 70%),
      linear-gradient(180deg,#12180c,#080b06 84%);
    padding:0;position:relative;overflow:clip}

  /* two floodlights over the yard */
  .rg-floods{position:absolute;inset:0 0 auto;height:230px;pointer-events:none}
  .rg-floods i{position:absolute;top:-40px;width:0;height:0;
    border-left:60px solid transparent;border-right:60px solid transparent;
    border-top:250px solid rgba(230,255,190,.07)}
  .rg-floods i:first-child{left:12%;transform:rotate(9deg)}
  .rg-floods i:last-child{right:12%;transform:rotate(-9deg)}

  .rg-head{position:relative;text-align:center;padding:15px 16px 4px}
  .rg-week{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:3.4px;color:var(--rg-dim)}
  .rg-name{font-family:Oswald,sans-serif;font-weight:600;font-size:33px;letter-spacing:4px;
    text-transform:uppercase;color:#f2ffd8;text-shadow:0 0 26px rgba(200,242,74,.4);margin:2px 0 2px}
  .rg-sub{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:2.6px;color:var(--rg-lime)}
  .rg-sealed{margin-top:8px;display:inline-block;font-family:Oswald,sans-serif;font-size:10px;
    letter-spacing:2.4px;color:#12180c;background:var(--rg-lime);padding:3px 12px}

  /* the shared board, standing across the yard */
  .rg-hero{position:relative;display:flex;justify-content:center;align-items:flex-end;gap:0;
    padding:8px 0 0;margin-bottom:6px}
  .rg-obst{position:absolute;left:0;right:0;bottom:26px;display:flex;justify-content:space-around}
  .rg-obst i{width:2px;height:56px;background:rgba(214,228,190,.35);transform-origin:top center;
    animation:rgSway 3.6s ease-in-out infinite}
  .rg-obst i:nth-child(2n){animation-delay:.7s}
  .rg-obst i:nth-child(3n){animation-delay:1.3s}
  @keyframes rgSway{50%{transform:rotate(5deg)}}
  .rg-post{width:5px;height:34px;background:rgba(214,228,190,.3);align-self:flex-end}

  .sls-board{position:relative;width:96px;height:96px;flex:none}
  .sls-board.is-hero{width:132px;height:132px}
  .sls-board i{position:absolute;border-radius:50%;box-sizing:border-box;
    border:1px solid rgba(200,242,74,.25);transition:background .4s,box-shadow .4s}
  .sls-r0{inset:0}
  .sls-r1{inset:14%}
  .sls-r2{inset:28%}
  .sls-r3{inset:42%}
  .sls-board i.is-on{border-color:rgba(200,242,74,.6)}
  .sls-r3.is-on{background:rgba(200,242,74,.18)}
  .sls-board.is-hero .sls-r3.is-on{background:var(--rg-lime);box-shadow:0 0 24px rgba(200,242,74,.7)}
  .sls-hit{position:absolute;width:7px;height:7px;border-radius:50%;transform:translate(-50%,-50%);
    background:#f2ffd8;box-shadow:0 0 7px rgba(242,255,216,.8)}
  .sls-hit.is-centre{background:var(--rg-lime);box-shadow:0 0 12px rgba(200,242,74,.95)}
  .sls-hit.is-off{background:none;border:1px dashed rgba(214,228,190,.45);box-shadow:none}

  .rg-body{position:relative;padding:6px 16px 0}
  .sls-what{border-left:3px solid var(--rg-lime);padding:8px 0 8px 11px;margin-bottom:12px}
  .sls-what b{font-family:Oswald,sans-serif;font-weight:600;font-size:15px;letter-spacing:1.4px;
    text-transform:uppercase;color:#f2ffd8}
  .sls-what-c{font-family:Oswald,sans-serif;font-size:9px;letter-spacing:2px;color:var(--rg-lime);
    margin-right:8px}
  .sls-what-d{font-size:12.5px;line-height:1.6;color:#cfdcb6;margin:5px 0 0}
  .sls-w{display:flex;flex-wrap:wrap;gap:11px;margin-top:8px}
  .sls-w span{font-family:Oswald,sans-serif;font-size:9px;letter-spacing:1px;color:var(--rg-dim);
    display:flex;align-items:center;gap:5px}
  .sls-w s{display:block;width:38px;height:2px;background:rgba(200,242,74,.2);text-decoration:none}
  .sls-w s b{display:block;height:100%;background:var(--rg-lime)}

  /* a run is a firing lane, seen from behind the shooter */
  .sls-lane{display:grid;grid-template-columns:150px 1fr 110px;gap:13px;align-items:center;
    padding:11px 13px;margin-bottom:9px;border-top:1px solid var(--rg-net);
    border-bottom:1px solid var(--rg-net);background:linear-gradient(90deg,rgba(200,242,74,.05),transparent 55%);
    animation:rgFire .28s ease both}
  @keyframes rgFire{from{opacity:0;transform:translateX(-7px)}to{opacity:1;transform:none}}
  .sls-lane.is-dark{grid-template-columns:1fr;justify-items:center;opacity:.16;animation:none;background:none}
  .sls-wait{font-family:Oswald,sans-serif;font-size:9px;letter-spacing:3px;color:var(--rg-dim)}
  .sls-lane.is-threw{opacity:.7}
  .sls-call,.sls-won{grid-template-columns:1fr}
  .sls-won{grid-template-columns:150px 1fr 110px}

  .sls-shooter{display:flex;align-items:center;gap:9px}
  .sls-shooter .bb-av{border-radius:3px;border:1px solid rgba(200,242,74,.35)}
  .sls-shooter b{display:block;font-family:Oswald,sans-serif;font-size:14px;letter-spacing:.8px;color:#f2ffd8}
  .sls-shooter em{font-style:normal;font-family:Oswald,sans-serif;font-size:8.5px;letter-spacing:1.6px;
    color:var(--rg-lime)}
  .sls-mid{min-width:0}
  .sls-body{font-size:13.5px;line-height:1.62;margin:0;color:#e8f2d8}
  .sls-flav{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:.6px;color:var(--rg-dim);margin:7px 0 0}
  .sls-callk{display:inline-block;margin-top:7px;font-family:Oswald,sans-serif;font-size:9px;
    letter-spacing:2.4px;color:var(--rg-lime)}

  /* the crate empties left to right */
  .sls-crate{display:flex;gap:5px;margin:9px 0 7px;padding:6px 8px;width:max-content;
    background:rgba(0,0,0,.32);border:1px solid var(--rg-net)}
  .sls-ball{width:13px;height:13px;border-radius:50%;background:rgba(214,228,190,.16);
    border:1px solid rgba(214,228,190,.3)}
  .sls-ball.is-scored{background:var(--rg-lime);border-color:var(--rg-lime);
    box-shadow:0 0 7px rgba(200,242,74,.5)}
  .sls-ball.is-wasted{background:none;border-style:dashed;opacity:.5}

  .sls-nums{display:flex;flex-wrap:wrap;gap:14px;font-family:Oswald,sans-serif;font-size:9px;
    letter-spacing:1px;color:var(--rg-dim)}
  .sls-nums b{color:#f2ffd8;font-size:12px}

  .sls-group{display:flex;flex-direction:column;align-items:center;gap:4px}
  .sls-tot{font-family:Oswald,sans-serif;font-weight:600;font-size:21px;color:var(--rg-lime)}
  .sls-won .sls-tot{font-size:27px}
  .sls-won{background:linear-gradient(90deg,rgba(200,242,74,.14),transparent 60%)}

  .sls-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:9px;justify-content:center;align-items:center;
    padding:11px;background:linear-gradient(180deg,rgba(8,11,6,0),rgba(8,11,6,.97) 45%)}
  .sls-count,.sls-done{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:2px;color:var(--rg-dim)}
  .sls-done{color:var(--rg-lime)}

  ${sealCss('sls', LIME)}
  @media(max-width:700px){
    .rg-name{font-size:23px}
    .sls-lane,.sls-won{grid-template-columns:1fr;gap:8px}
    .sls-group{flex-direction:row;justify-content:flex-start;gap:12px}
  }
  @media(prefers-reduced-motion:reduce){
    .sigrange *,.sigrange *::before,.sigrange *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="rg-floods" aria-hidden="true"><i></i><i></i></div>

  <div class="rg-head">
    <div class="rg-week">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
    <div class="rg-name">${E((comp.name || 'SLINGSHOT AIM').toUpperCase())}</div>
    <div class="rg-sub">DRAW &middot; ARC IT OVER &middot; SIX BALLS AND NO MORE</div>
    ${sealed ? `<div class="rg-sealed">RESULT SEALED${done ? ' — THE HOUSE NEVER FINDS OUT' : ''}</div>` : ''}
  </div>

  <div class="rg-hero">
    <span class="rg-post" aria-hidden="true"></span>
    ${board([], true)}
    <span class="rg-post" aria-hidden="true"></span>
    <div class="rg-obst" aria-hidden="true">${Array.from({ length: 7 }, () => '<i></i>').join('')}</div>
  </div>

  <div class="rg-body">
    <div class="sls-what">
      <span class="sls-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Slingshot Aim')}</b>
      ${comp.desc ? `<p class="sls-what-d">${E(comp.desc)}</p>` : ''}
      ${weights.length ? `<div class="sls-w">${weights.map(([k, w]) =>
    `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
      ${(comp.excluded || []).filter(Boolean).length ? `<p class="sls-what-d">Sat out: ${
  (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
  isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
    </div>
    ${cards}
  </div>

  <div class="sls-ctrl">
    ${done ? `<span class="sls-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE CRATES ARE EMPTY.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.sls-lane:not(.is-dark)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  state.idx < 0 ? 'Light the range' : 'Next lane'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="sls-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
