// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/knight-moves.js — "Knight Moves"
//
// The themed screen for js/bb-comps/arena-classics.js → Knight Moves
// (`variant: 'knightmoves'`).
//
// The arena floor is a giant chequered board. One legal move — two squares
// one way, one across — corner to opposite corner, and every square already
// stepped on goes DARK behind you and can never be used again. A route that
// felt safe three moves ago strands you with nothing legal in any direction,
// and being stranded means the walk back and starting the crossing over.
//
// So the screen is the board, seen from the glass the way the house sees it:
// eight by eight, every houseguest's route traced across it in their own
// colour, the squares behind them burnt out, and the stranded one ending in a
// dead end with no square left to jump to. Nothing here is a bar chart —
// the whole competition is a shape on a floor, and the shape is the result.
//
// HONEST ABOUT WHAT IT KNOWS: the engine scores this comp, it does not record
// a move list. The routes are drawn from placement — how far across the board
// somebody got — and every route is a REAL knight's path, generated legally
// square by square with the dark squares respected. It is a reconstruction of
// how far each of them travelled, not an invented transcript of their moves,
// and the caption says so.
//
// Declines when there is no field to draw.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard, MASK } from './_sealed.js';

const N = 8;                       // squares to a side
const JUMPS = [
  [1, 2], [2, 1], [2, -1], [1, -2],
  [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];

/** One colour per route, in placement order. Gold leads. */
const ROUTE = ['#e3b341', '#57a6e8', '#3fb950', '#a371f7', '#f0a500', '#ff7b72',
  '#79c0ff', '#d2a8ff'];

/** Deterministic per screen, so the same week always draws the same floor. */
function seeded(salt) {
  let x = (salt * 1103515245 + 12345) & 0x7fffffff;
  return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; };
}

/**
 * Walk a real knight's route of up to `len` squares from the near corner,
 * never re-using a square. Greedy towards the far corner with a little noise,
 * which is how somebody crossing this actually plays it — and it can dead-end,
 * which is the entire drama of the competition.
 */
function walk(len, rand) {
  const seen = new Set(['0,0']);
  const path = [[0, 0]];
  let [r, c] = [0, 0];
  for (let step = 1; step < len; step++) {
    const legal = JUMPS
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < N && nc >= 0 && nc < N && !seen.has(`${nr},${nc}`));
    if (!legal.length) return { path, stranded: true };
    // Towards the far corner, mostly.
    legal.sort((a, b) => {
      const da = (N - 1 - a[0]) + (N - 1 - a[1]) + rand() * 3.2;
      const db = (N - 1 - b[0]) + (N - 1 - b[1]) + rand() * 3.2;
      return da - db;
    });
    [r, c] = legal[0];
    seen.add(`${r},${c}`);
    path.push([r, c]);
    if (r === N - 1 && c === N - 1) return { path, stranded: false, home: true };
  }
  return { path, stranded: false };
}

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigKnightMoves(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';

  const placements = (comp.placements || []).filter(Boolean);
  if (placements.length < 2) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const ORD = i => (typeof u.ordinal === 'function' ? u.ordinal(i) : `${i}`);
  const isHoh = actType === 'hoh';
  const sealed = isSealedHoh(act, actType);

  const stateKey = `bb_sig_knight_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  // ── the routes ──
  //
  // Furthest across for the winner, shortest for whoever was stranded. Every
  // one is walked legally, so a route that dead-ends really had nowhere left.
  const rand = seeded((Number(ep?.num) || 1) * 97 + (isHoh ? 3 : 11));
  const field = placements.slice(0, 8);
  const routes = field.map((name, i) => {
    const reach = Math.max(3, Math.round(N + 6 - (i / Math.max(1, field.length - 1)) * 9));
    const w = walk(reach, rand);
    return { name, ...w, place: i + 1, colour: ROUTE[i % ROUTE.length] };
  });

  const steps = [
    { kind: 'board' },
    ...beats.map(b => ({ kind: 'beat', b })),
    { kind: 'finish' },
  ];
  const total = steps.length;
  const plan = sealed ? planSeal(steps, { total }) : null;
  const done = state.idx >= total - 1;
  const shown = state.idx;

  // How many routes are drawn so far — the board fills in as you reveal.
  const drawn = shown < 0 ? 0 : Math.min(routes.length, Math.ceil((shown / Math.max(1, total - 1)) * routes.length) + 1);

  const CELL = 34;
  const board = () => {
    const squares = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const dark = (r + c) % 2 === 1;
        squares.push(`<rect x="${c * CELL}" y="${r * CELL}" width="${CELL}" height="${CELL}"
          fill="${dark ? '#161b22' : '#20262f'}"/>`);
      }
    }
    // Burnt-out squares: everywhere anybody has already stood.
    const burnt = new Set();
    routes.slice(0, drawn).forEach(rt => rt.path.forEach(([r, c]) => burnt.add(`${r},${c}`)));
    const burntCells = [...burnt].map(k => {
      const [r, c] = k.split(',').map(Number);
      return `<rect x="${c * CELL + 2}" y="${r * CELL + 2}" width="${CELL - 4}" height="${CELL - 4}"
        rx="2" fill="#0b0e13" opacity=".85"/>`;
    }).join('');

    const lines = routes.slice(0, drawn).map(rt => {
      const d = rt.path.map(([r, c], i) =>
        `${i ? 'L' : 'M'}${c * CELL + CELL / 2},${r * CELL + CELL / 2}`).join(' ');
      const [er, ec] = rt.path[rt.path.length - 1];
      return `<path d="${d}" fill="none" stroke="${rt.colour}" stroke-width="2.2"
          stroke-linejoin="round" stroke-linecap="round" opacity=".92"/>
        <circle cx="${ec * CELL + CELL / 2}" cy="${er * CELL + CELL / 2}" r="5"
          fill="${rt.colour}" stroke="#0b0e13" stroke-width="1.5"/>
        ${rt.stranded ? `<circle cx="${ec * CELL + CELL / 2}" cy="${er * CELL + CELL / 2}" r="10"
          fill="none" stroke="#f47067" stroke-width="1.6" opacity=".9"/>` : ''}`;
    }).join('');

    return `<svg class="bbkm-board" viewBox="0 0 ${N * CELL} ${N * CELL}" role="img"
      aria-label="the arena floor, laid out as a chequered board">
      ${squares.join('')}${burntCells}
      <rect x="1" y="1" width="${CELL - 2}" height="${CELL - 2}" rx="2" fill="none"
        stroke="#8b949e" stroke-width="1.4" opacity=".7"/>
      <rect x="${(N - 1) * CELL + 1}" y="${(N - 1) * CELL + 1}" width="${CELL - 2}" height="${CELL - 2}"
        rx="2" fill="none" stroke="#e3b341" stroke-width="1.8"/>
      ${lines}
    </svg>`;
  };

  const legend = () => `<div class="bbkm-legend">${routes.slice(0, drawn).map(rt => `
    <span class="bbkm-key">${AV(rt.name, 20)}
      <b style="color:${rt.colour}">${E(rt.name)}</b>
      <i>${rt.home ? 'crossed it' : rt.stranded ? 'stranded' : `${rt.path.length} squares`}</i></span>`).join('')}</div>`;

  const card = (step, i) => {
    if (i > state.idx) return `<div class="bbkm-card is-hidden"><span>▨</span></div>`;
    if (step.kind === 'board') {
      return `<div class="bbkm-card is-open">
        <div class="bbkm-h"><span class="bbkm-pill">ONE LEGAL MOVE</span></div>
        <div class="bbkm-b">Two squares one way and one across, corner to opposite corner, and every square that has been stood on goes dark behind them. The house watches the whole floor from the glass and is not allowed to say a word.</div></div>`;
    }
    if (step.kind === 'finish') {
      const won = placements[0];
      if (sealed) return sealIronyCard(plan, { winner: won, avatar: u.avatar, esc: u.esc, isHoh });
      return `<div class="bbkm-card is-final">
        <div class="bbkm-h">${AV(won, 28)}<span class="bbkm-pill gold">${isHoh ? 'HEAD OF HOUSEHOLD' : 'SAFETY'}</span></div>
        <div class="bbkm-b"><strong>${E(won)}</strong> reaches the far corner. Nothing about this one was speed — it was the only route left that was still legal.</div></div>`;
    }
    const b = step.b || {};
    return `<div class="bbkm-card ${b.badgeClass === 'red' ? 'is-bad' : ''}">
      <div class="bbkm-h">${(b.players || []).slice(0, 2).map(n => AV(n, 26)).join('')}
        <span class="bbkm-pill">${E(b.badgeText || 'THE FLOOR')}</span></div>
      <div class="bbkm-b">${b.text}</div></div>`;
  };

  return `<div class="rp-page bb-room bb-block bbkm">
    <style>
      .bbkm { --km-ink:#e6edf3; }
      .bbkm-wrap { display:grid; grid-template-columns:minmax(0,320px) minmax(0,1fr); gap:16px;
                   max-width:1100px; margin:0 auto 14px; align-items:start; }
      .bbkm-board { width:100%; height:auto; border-radius:8px; display:block;
                    box-shadow:0 6px 26px rgba(0,0,0,.55); }
      .bbkm-legend { display:flex; flex-direction:column; gap:5px; margin-top:9px; }
      .bbkm-key { display:flex; align-items:center; gap:6px; font-size:11px; color:#8b949e; }
      .bbkm-key b { font-weight:700; }
      .bbkm-key i { font-style:normal; margin-left:auto; font-family:ui-monospace,Consolas,monospace;
                    font-size:10px; }
      .bbkm-cards { display:flex; flex-direction:column; gap:8px; }
      .bbkm-card { border-radius:8px; padding:9px 11px; background:rgba(255,255,255,.04);
                   border:1px solid rgba(255,255,255,.1); }
      .bbkm-card.is-open  { border-color:rgba(227,179,65,.4); }
      .bbkm-card.is-final { border-color:rgba(227,179,65,.6); background:rgba(227,179,65,.08); }
      .bbkm-card.is-bad   { border-left:3px solid #f47067; }
      .bbkm-card.is-hidden { text-align:center; color:#30363d; letter-spacing:6px; padding:12px; }
      .bbkm-h { display:flex; align-items:center; gap:7px; margin-bottom:5px; }
      .bbkm-pill { font-family:ui-monospace,Consolas,monospace; font-size:9px; letter-spacing:1.4px;
                   color:#8b949e; }
      .bbkm-pill.gold { color:#e3b341; }
      .bbkm-b { font-size:12.5px; line-height:1.55; color:var(--km-ink); }
      .bbkm-cap { max-width:1100px; margin:0 auto 12px; text-align:center; font-size:10px;
                  color:#6e7681; font-family:ui-monospace,Consolas,monospace; letter-spacing:.6px; }
      @media (max-width:720px) { .bbkm-wrap { grid-template-columns:1fr; } }
      ${sealed ? sealCss(plan, '#e3b341') : ''}
    </style>
    <div class="rp-eyebrow">Week ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#e3b341;margin-bottom:4px">KNIGHT MOVES</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:14px">${
      sealed ? 'The floor is cleared before anybody is told who crossed it.'
        : 'Two squares one way, one across. Every square you use goes dark.'}</div>
    <div class="bbkm-wrap">
      <div>${sealed && state.idx < total - 1 ? `<div style="text-align:center;padding:40px 0;color:#30363d;letter-spacing:6px">${MASK}</div>` : board() + legend()}</div>
      <div class="bbkm-cards">${steps.map(card).join('')}</div>
    </div>
    <div class="bbkm-cap">routes reconstructed from how far each of them got — the floor is real, the move list was never recorded</div>
    <div class="rp-reveal-controls" style="position:sticky;bottom:0;display:flex;gap:8px;justify-content:center;padding:10px 0;background:linear-gradient(transparent, rgba(5,7,13,.92) 40%)">
      ${done ? '' : `<button class="rp-btn" onclick="${u.reveal(ep, stateKey, state.idx + 1)}">${state.idx < 0 ? 'The floor' : 'Reveal next'}</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
      <span style="align-self:center;font-size:10px;color:var(--muted);letter-spacing:1px">${Math.min(total, Math.max(0, state.idx + 1))} / ${total}</span>
    </div>
  </div>`;
}
