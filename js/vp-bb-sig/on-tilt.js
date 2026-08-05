// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/on-tilt.js — "On Tilt"
//
// The themed screen for js/bb-comps/arena-classics.js → On Tilt
// (`variant: 'ontilt'`).
//
// A pinball table the size of a car. Lit lanes score, the flippers can barely
// reach a loose ball, and the table can be nudged with the hips to steer one
// away from the drain — but nudge it a fraction too hard and the TILT light
// comes on and takes everything that ball has earned. The useful move and the
// disastrous one are the same move at slightly different strengths. Three
// balls each, no way to earn another.
//
// So the screen is the TABLE, seen from directly above the way nobody in that
// arena can see it: the plunger lane down the right, the pop bumpers in the
// middle, the lit lanes across the top, and the drain sitting open at the
// bottom between two flippers that are always going to be slightly too short.
// Every ball anybody played is traced across it in their colour, and every one
// of those traces ends in exactly one of three places — a lit lane, the drain,
// or a TILT.
//
// Above it sits the backglass, because a pinball machine tells you the score
// on a different piece of furniture from the one you play on. Score reels, one
// row per houseguest, and the TILT panel dark until somebody earns it.
//
// This one is a CRAPSHOOT on purpose — the engine gives it double the luck
// weighting of anything else in the arena, because the arena is where somebody's
// game ends and it should not always end because they were the worst player in
// the room. The screen has to say that out loud, so the drain is drawn as the
// biggest thing on the table and a ball lost down the middle is drawn exactly
// the same as a ball lost to bad play. There is no difference from above.
//
// HONEST ABOUT WHAT IT KNOWS: the engine scores this comp, it does not record
// a ball-by-ball log. Each trace is a REAL ricochet — launched, reflected off
// the bumpers and walls, run until it lands somewhere — seeded per week so the
// same night always draws the same table, with the number of balls that
// survived taken from where somebody finished. It is a reconstruction of how
// their three balls went, not an invented transcript, and the caption says so.
//
// Declines when there is no field to draw.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealIronyCard, MASK } from './_sealed.js';

// Playfield geometry, in its own little coordinate space.
const W = 210, H = 320;
const PLUNGER_X = W - 13;          // the lane down the right-hand side
const DRAIN_Y = H - 16;
const BUMPERS = [                  // pop bumpers: the things that make it random
  { x: 78, y: 108, r: 15 },
  { x: 132, y: 138, r: 15 },
  { x: 96, y: 176, r: 13 },
  { x: 52, y: 152, r: 11 },
  { x: 150, y: 92, r: 11 },
];
const LANES = [                    // lit lanes across the top, left to right
  { x: 38, w: 30, pts: 3 },
  { x: 82, w: 30, pts: 5 },
  { x: 126, w: 30, pts: 3 },
];

/** One colour per houseguest, in placement order. Gold leads. */
const BALL = ['#ffd24a', '#4cc2ff', '#5ce08a', '#c48bff', '#ff9f43', '#ff6b6b',
  '#7ee8fa', '#f5a3ff'];

/** Deterministic per screen, so the same week always draws the same table. */
function seeded(salt) {
  let x = (salt * 1664525 + 1013904223) & 0x7fffffff;
  return () => { x = (x * 1664525 + 1013904223) & 0x7fffffff; return x / 0x7fffffff; };
}

/**
 * Launch one ball and let the table have it.
 *
 * Up the plunger lane, over the top, then down through the bumpers with a real
 * reflection off each one it touches. It ends when it reaches a lit lane at the
 * top, drains at the bottom, or runs out of table. Nothing here is steered —
 * which is the competition.
 *
 * @param {() => number} rand
 * @param {'lane'|'drain'|'tilt'} want  where this ball is meant to end up
 */
function launch(rand, want) {
  const pts = [[PLUNGER_X, DRAIN_Y - 6], [PLUNGER_X, 40]];
  let x = PLUNGER_X, y = 40;
  // Over the top and back into the field, aimed loosely at the middle.
  let vx = -3.4 - rand() * 2.2, vy = 1.2 + rand() * 1.8;
  const target = LANES[Math.floor(rand() * LANES.length)];

  for (let step = 0; step < 90; step++) {
    x += vx; y += vy;
    // Walls.
    if (x < 12) { x = 12; vx = Math.abs(vx); }
    if (x > W - 20) { x = W - 20; vx = -Math.abs(vx); }
    if (y < 26) { y = 26; vy = Math.abs(vy); }

    for (const b of BUMPERS) {
      const dx = x - b.x, dy = y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < b.r + 3) {
        // Kicked, hard and roughly outward — a pop bumper adds energy.
        const nx = dx / (d || 1), ny = dy / (d || 1);
        const kick = 3.6 + rand() * 2.4;
        vx = nx * kick + (rand() - 0.5) * 1.6;
        vy = ny * kick + (rand() - 0.5) * 1.6;
        x = b.x + nx * (b.r + 4); y = b.y + ny * (b.r + 4);
        pts.push([x, y]);
        // A ball that is supposed to score gets nudged back up the table.
        if (want === 'lane' && rand() < 0.5) { vy = -Math.abs(vy) - 0.6; vx += (target.x - x) * 0.06; }
        break;
      }
    }
    pts.push([x, y]);

    // Home: into a lit lane at the top.
    if (want === 'lane' && y < 44) {
      pts.push([target.x + target.w / 2, 20]);
      return { pts, end: 'lane', lane: target };
    }
    // Gone: down the middle, past flippers that were never going to reach it.
    if (y > DRAIN_Y - 8) {
      pts.push([W / 2 + (rand() - 0.5) * 14, H - 4]);
      return { pts, end: want === 'tilt' ? 'tilt' : 'drain' };
    }
    vy += 0.16;                          // the table is on a slope
  }
  pts.push([W / 2, H - 4]);
  return { pts, end: want === 'tilt' ? 'tilt' : 'drain' };
}

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigOnTilt(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';

  const placements = (comp.placements || []).filter(Boolean);
  if (placements.length < 2) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const isHoh = actType === 'hoh';
  const sealed = isSealedHoh(act, actType);

  const stateKey = `bb_sig_tilt_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  // Who tilted, if the engine said so. It writes a beat badged TILT when it
  // happens; the screen lights the panel for whoever is named on it.
  const tiltBeat = beats.find(b => /TILT/i.test(b.badgeText || '') || /\bTILT\b/.test(b.text || ''));
  const tilted = (tiltBeat?.players || [])[0] || null;

  // ── the balls ──
  //
  // Three each. How many of them found a lane is taken from where somebody
  // finished: the winner keeps most of theirs alive, last place watches them go
  // down the middle. Everything between the launch and the landing is the
  // table's, not theirs.
  const rand = seeded((Number(ep?.num) || 1) * 131 + (isHoh ? 7 : 23));
  const field = placements.slice(0, 8);
  const scores = comp.scores || {};
  const players = field.map((name, i) => {
    const frac = field.length > 1 ? i / (field.length - 1) : 0;
    const scoring = Math.max(0, Math.min(3, Math.round(3 - frac * 2.6)));
    const balls = [0, 1, 2].map(bi => {
      const want = name === tilted && bi === 1 ? 'tilt' : bi < scoring ? 'lane' : 'drain';
      return launch(rand, want);
    });
    const total = Number(scores[name]);
    return {
      name, place: i + 1, colour: BALL[i % BALL.length], balls,
      lanes: balls.filter(b => b.end === 'lane').length,
      tilt: balls.some(b => b.end === 'tilt'),
      total: Number.isFinite(total) ? total : null,
    };
  });

  const steps = [
    { kind: 'table' },
    ...beats.map(b => ({ kind: 'beat', b })),
    { kind: 'finish' },
  ];
  const total = steps.length;
  const plan = sealed ? planSeal(steps, { total }) : null;
  const done = state.idx >= total - 1;
  const shown = state.idx;

  // The table fills in as you reveal — one more houseguest's three balls per
  // step, so the traces pile up the way the arena floor actually does.
  const drawn = shown < 0 ? 0
    : Math.min(players.length, Math.ceil((shown / Math.max(1, total - 1)) * players.length) + 1);
  const live = players.slice(0, drawn);
  const tiltLit = live.some(p => p.tilt);

  const table = () => {
    const lanes = LANES.map((l, i) => `
      <rect class="bbot-lane" x="${l.x}" y="12" width="${l.w}" height="17" rx="3"
        style="animation-delay:${i * 0.4}s"/>
      <text class="bbot-lanetxt" x="${l.x + l.w / 2}" y="24.5">${l.pts}0</text>`).join('');

    const bumpers = BUMPERS.map((b, i) => `
      <circle class="bbot-bump" cx="${b.x}" cy="${b.y}" r="${b.r}" style="animation-delay:${i * 0.55}s"/>
      <circle class="bbot-bumpc" cx="${b.x}" cy="${b.y}" r="${b.r * 0.42}"/>`).join('');

    const traces = live.map(p => p.balls.map((b, bi) => {
      const d = b.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
      const dead = b.end !== 'lane';
      return `<path d="${d}" fill="none" stroke="${b.end === 'tilt' ? '#ff4d4d' : p.colour}"
        stroke-width="${b.end === 'lane' ? 1.5 : 1.1}" stroke-linejoin="round" stroke-linecap="round"
        opacity="${dead ? 0.4 : 0.92}" ${b.end === 'tilt' ? 'stroke-dasharray="3 2"' : ''}/>
      <circle cx="${b.pts[b.pts.length - 1][0].toFixed(1)}" cy="${b.pts[b.pts.length - 1][1].toFixed(1)}"
        r="${b.end === 'lane' ? 3.4 : 2.6}" fill="${b.end === 'tilt' ? '#ff4d4d' : p.colour}"
        opacity="${dead ? 0.55 : 1}"/>`;
    }).join('')).join('');

    return `<svg class="bbot-table" viewBox="0 0 ${W} ${H}" role="img"
      aria-label="the pinball table, seen from above, with every ball traced across it">
      <defs>
        <radialGradient id="bbot-glow" cx="50%" cy="18%" r="80%">
          <stop offset="0%" stop-color="#2a1a4d"/><stop offset="100%" stop-color="#07050e"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="url(#bbot-glow)"/>
      <rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="10" fill="none"
        stroke="rgba(255,210,74,.22)" stroke-width="1"/>
      <line x1="${PLUNGER_X - 7}" y1="34" x2="${PLUNGER_X - 7}" y2="${H - 20}"
        stroke="rgba(255,210,74,.3)" stroke-width="1"/>
      ${lanes}${bumpers}
      <path d="M28,${H - 54} L${W / 2 - 13},${DRAIN_Y - 2}" class="bbot-flip"/>
      <path d="M${W - 40},${H - 54} L${W / 2 + 13},${DRAIN_Y - 2}" class="bbot-flip"/>
      <text class="bbot-drain" x="${W / 2}" y="${H - 4}">DRAIN</text>
      ${traces}
    </svg>`;
  };

  // The backglass. A pinball machine never puts the score on the same piece of
  // furniture you play on, and neither does this.
  const glass = () => `<div class="bbot-glass">
    <div class="bbot-glasshead">
      <span class="bbot-badge">BALL 3 / 3</span>
      <span class="bbot-tilt ${tiltLit ? 'is-lit' : ''}">TILT</span>
    </div>
    ${live.length ? live.map(p => `
      <div class="bbot-row ${p.tilt ? 'is-tilt' : ''}">
        ${AV(p.name, 20)}
        <b style="color:${p.colour}">${E(p.name)}</b>
        <span class="bbot-lanes">${'●'.repeat(p.lanes)}${'○'.repeat(Math.max(0, 3 - p.lanes))}</span>
        <i class="bbot-reel">${p.total === null ? '––' : String(Math.round(p.total * 1000)).padStart(5, '0')}</i>
      </div>`).join('')
    : `<div class="bbot-empty">nothing on the reels yet</div>`}
  </div>`;

  const card = (step, i) => {
    if (i > state.idx) return `<div class="bbot-card is-hidden"><span>◉ ◉ ◉</span></div>`;
    if (step.kind === 'table') {
      return `<div class="bbot-card is-open">
        <div class="bbot-h"><span class="bbot-pill">THREE BALLS</span></div>
        <div class="bbot-b">Three tables, three balls each, and a tilt light that takes everything a ball has earned if anybody leans on it too hard. The table can be nudged away from the drain — the useful nudge and the ruinous one are the same movement at slightly different strengths, and nobody finds out which one they made until the light comes on.</div></div>`;
    }
    if (step.kind === 'finish') {
      const won = placements[0];
      if (sealed) return sealIronyCard(plan, { winner: won, avatar: u.avatar, esc: u.esc, isHoh });
      const last = placements[placements.length - 1];
      return `<div class="bbot-card is-final">
        <div class="bbot-h">${AV(won, 28)}<span class="bbot-pill gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'SAFETY'}</span></div>
        <div class="bbot-b"><strong>${E(won)}</strong> takes it off a table that was never really being played by anybody. ${E(last)} goes back to the block having done nothing wrong at all, which is a far harder thing to sit with than being beaten.</div></div>`;
    }
    const b = step.b || {};
    const bad = b.badgeClass === 'red';
    return `<div class="bbot-card ${bad ? 'is-bad' : ''}">
      <div class="bbot-h">${(b.players || []).slice(0, 2).map(n => AV(n, 26)).join('')}
        <span class="bbot-pill">${E(b.badgeText || 'THE TABLE')}</span></div>
      <div class="bbot-b">${b.text}</div></div>`;
  };

  return `<div class="rp-page bb-room bb-block bbot">
    <style>
      .bbot { --ot-ink:#efe7ff; }
      .bbot-wrap { display:grid; grid-template-columns:minmax(0,300px) minmax(0,1fr); gap:16px;
                   max-width:1100px; margin:0 auto 14px; align-items:start; }
      .bbot-table { width:100%; height:auto; display:block; border-radius:12px;
                    box-shadow:0 8px 34px rgba(90,40,160,.4), 0 2px 10px rgba(0,0,0,.7); }
      .bbot-lane { fill:rgba(255,210,74,.16); stroke:#ffd24a; stroke-width:1;
                   animation:bbot-blink 1.9s ease-in-out infinite; }
      .bbot-lanetxt { fill:#ffd24a; font-family:ui-monospace,Consolas,monospace; font-size:8px;
                      text-anchor:middle; opacity:.85; }
      .bbot-bump { fill:rgba(120,70,200,.3); stroke:#a78bfa; stroke-width:1.3;
                   animation:bbot-pop 2.6s ease-in-out infinite; transform-origin:center; }
      .bbot-bumpc { fill:#c4b5fd; opacity:.55; }
      .bbot-flip { stroke:#ff9f43; stroke-width:3.4; stroke-linecap:round; }
      .bbot-drain { fill:#6b5b8a; font-family:ui-monospace,Consolas,monospace; font-size:7px;
                    letter-spacing:2px; text-anchor:middle; }
      @keyframes bbot-blink { 0%,100%{opacity:.5} 50%{opacity:1} }
      @keyframes bbot-pop { 0%,88%,100%{transform:scale(1)} 93%{transform:scale(1.13)} }

      .bbot-glass { margin-top:10px; padding:9px 10px; border-radius:9px;
                    background:linear-gradient(180deg,rgba(40,20,70,.9),rgba(10,6,20,.95));
                    border:1px solid rgba(167,139,250,.32); }
      .bbot-glasshead { display:flex; align-items:center; justify-content:space-between;
                        margin-bottom:7px; }
      .bbot-badge { font-family:ui-monospace,Consolas,monospace; font-size:8.5px; letter-spacing:1.6px;
                    color:#a78bfa; }
      .bbot-tilt { font-family:ui-monospace,Consolas,monospace; font-size:10px; letter-spacing:3px;
                   color:#3a2a4a; border:1px solid #3a2a4a; border-radius:3px; padding:1px 6px; }
      .bbot-tilt.is-lit { color:#ff4d4d; border-color:#ff4d4d; background:rgba(255,77,77,.12);
                          animation:bbot-tiltflash .8s steps(2) infinite; }
      @keyframes bbot-tiltflash { 0%,100%{opacity:1} 50%{opacity:.35} }
      .bbot-row { display:flex; align-items:center; gap:6px; font-size:11px; color:#b9a7d6;
                  padding:2.5px 0; }
      .bbot-row b { font-weight:700; }
      .bbot-row.is-tilt b { text-decoration:line-through; text-decoration-color:#ff4d4d; }
      .bbot-lanes { margin-left:auto; font-size:8px; color:#ffd24a; letter-spacing:1px; }
      .bbot-reel { font-style:normal; font-family:ui-monospace,Consolas,monospace; font-size:10.5px;
                   color:#ffd24a; background:rgba(0,0,0,.5); border-radius:2px; padding:1px 4px;
                   letter-spacing:1.5px; }
      .bbot-empty { font-size:10px; color:#5b4a75; font-family:ui-monospace,Consolas,monospace; }

      .bbot-cards { display:flex; flex-direction:column; gap:8px; }
      .bbot-card { border-radius:8px; padding:9px 11px; background:rgba(120,80,200,.07);
                   border:1px solid rgba(167,139,250,.18); }
      .bbot-card.is-open  { border-color:rgba(255,210,74,.4); }
      .bbot-card.is-final { border-color:rgba(255,210,74,.6); background:rgba(255,210,74,.09); }
      .bbot-card.is-bad   { border-left:3px solid #ff4d4d; }
      .bbot-card.is-hidden { text-align:center; color:#33265a; letter-spacing:5px; padding:12px; }
      .bbot-h { display:flex; align-items:center; gap:7px; margin-bottom:5px; }
      .bbot-pill { font-family:ui-monospace,Consolas,monospace; font-size:9px; letter-spacing:1.4px;
                   color:#a78bfa; }
      .bbot-pill.gold { color:#ffd24a; }
      .bbot-b { font-size:12.5px; line-height:1.55; color:var(--ot-ink); }
      .bbot-cap { max-width:1100px; margin:0 auto 12px; text-align:center; font-size:10px;
                  color:#6b5b8a; font-family:ui-monospace,Consolas,monospace; letter-spacing:.6px; }
      @media (max-width:720px) { .bbot-wrap { grid-template-columns:1fr; } }
      @media (prefers-reduced-motion:reduce) {
        .bbot-lane, .bbot-bump, .bbot-tilt.is-lit { animation:none; }
      }
      ${sealed ? sealCss(plan, '#ffd24a') : ''}
    </style>
    <div class="rp-eyebrow">Week ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#ffd24a;margin-bottom:4px">ON TILT</div>
    <div style="text-align:center;font-size:12px;color:#a78bfa;margin-bottom:14px">${
      sealed ? 'The table goes dark before anybody is told what it decided.'
        : 'Three balls each. The nudge that saves it and the nudge that kills it are the same nudge.'}</div>
    <div class="bbot-wrap">
      <div>${sealed && state.idx < total - 1
    ? `<div style="text-align:center;padding:44px 0;color:#33265a;letter-spacing:6px">${MASK}</div>`
    : table() + glass()}</div>
      <div class="bbot-cards">${steps.map(card).join('')}</div>
    </div>
    <div class="bbot-cap">every ball is a real ricochet off these bumpers &middot; how many survived is taken from the result, the bounces were never recorded</div>
    <div class="rp-reveal-controls" style="position:sticky;bottom:0;display:flex;gap:8px;justify-content:center;padding:10px 0;background:linear-gradient(transparent, rgba(5,7,13,.92) 40%)">
      ${done ? '' : `<button class="rp-btn" onclick="${u.reveal(ep, stateKey, state.idx + 1)}">${state.idx < 0 ? 'The table' : 'Reveal next'}</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
      <span style="align-self:center;font-size:10px;color:var(--muted);letter-spacing:1px">${Math.min(total, Math.max(0, state.idx + 1))} / ${total}</span>
    </div>
  </div>`;
}
