// ══════════════════════════════════════════════════════════════════════
// vp-dr/save.js — the season's save, on the stage
// ══════════════════════════════════════════════════════════════════════
//
// Three screens for the four saves in js/dr/saves.js:
//   save-intro  the twist explained, the bars handed out, the tank retired
//   save-hold   the winner (or the baguette's holder) saves one of three
//   save-luck   the lip sync loser opens her bar or pulls a lever
//
// Each save is drawn as the object it is — a chocolate bar that unwraps, a
// dunk tank with its levers, a golden beaver, a baguette — in SVG. The
// outcome of every card is in its markup and only animates in when that card
// is revealed (`.dr-vis`), and the rail beside it is rebuilt per step from
// what has been revealed so far: bars still sealed, levers still in play,
// who has been saved.
import { _shell, _portrait } from './style.js';
import { _controls } from './reveal.js';
import { SAVE_KINDS } from '../dr/saves.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

export const SAVE_CSS = `
.sv-stage{position:relative;display:grid;gap:14px}
.sv-card{display:grid;grid-template-columns:minmax(120px,190px) 1fr;gap:16px;align-items:center;padding:14px 16px}
@media (max-width:560px){.sv-card{grid-template-columns:1fr}}
.sv-art svg{width:100%;height:auto;display:block}
.sv-line{margin:0;font-size:15.5px}
.sv-who{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.sv-rule{margin:8px 0 0;color:var(--dr-dim);font-size:13px;line-height:1.55}
.sv-tag{display:inline-block;margin-bottom:6px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--sv-c,var(--dr-gold))}

/* The bar: the wrapper slides off when the card is revealed. */
.sv-wrap{transition:transform 1.1s cubic-bezier(.6,0,.2,1) .35s}
.dr-step.dr-vis .sv-wrap{transform:translateY(118px)}
.sv-inside{opacity:0;transition:opacity .5s ease .9s}
.dr-step.dr-vis .sv-inside{opacity:1}
.sv-gold{filter:drop-shadow(0 0 10px rgba(255,200,61,.9))}

/* The tank: the chosen lever tips, and on a hit the seat drops. */
.sv-lever{transition:transform .5s ease .4s;transform-box:fill-box;transform-origin:50% 100%}
.dr-step.dr-vis .sv-lever.sv-pulled{transform:rotate(-32deg)}
.sv-seat{transition:transform .5s cubic-bezier(.5,0,.8,.4) 1s}
.dr-step.dr-vis .sv-seat.sv-drop{transform:translateY(58px)}
.sv-splash{opacity:0;transition:opacity .3s ease 1.3s}
.dr-step.dr-vis .sv-splash{opacity:1}

/* A holder night: the queen who is kept lights up. */
.sv-pool{display:flex;gap:10px;flex-wrap:wrap}
.sv-q{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;
  padding:6px;border-radius:10px;border:2px solid transparent;transition:border-color .5s ease .5s,box-shadow .5s ease .5s}
.dr-step.dr-vis .sv-q.sv-kept{border-color:#ffed00;box-shadow:0 0 16px rgba(255,237,0,.55)}
.sv-q.sv-sing{opacity:.8}
.sv-rail-row{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px}
.sv-rail-row b{color:var(--dr-gold)}
.sv-levers{display:flex;gap:6px;margin:6px 0}
.sv-levers i{width:14px;height:26px;border-radius:4px;background:var(--dr-cyan)}
.sv-levers i.sv-gone{background:#3a2233;opacity:.5}
`;

// ── THE OBJECTS ─────────────────────────────────────────────────────────

function barSvg({ golden = false, sealed = false, uid = '' } = {}) {
  const inside = golden ? 'url(#svg-gold-' + uid + ')' : '#5a2f1b';
  const squares = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      squares.push(`<rect x="${26 + c * 38}" y="${34 + r * 30}" width="32" height="24" rx="3"
        fill="${inside}" stroke="${golden ? '#fff3b0' : '#3b1d10'}" stroke-width="1.5"/>`);
    }
  }
  return `<svg viewBox="0 0 200 160" aria-hidden="true">
    <defs><linearGradient id="svg-gold-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff1a8"/><stop offset=".5" stop-color="#e7b23a"/><stop offset="1" stop-color="#a5741a"/>
    </linearGradient></defs>
    <rect x="16" y="26" width="168" height="108" rx="8" fill="#2a130b"/>
    <g class="sv-inside${golden ? ' sv-gold' : ''}">${squares.join('')}</g>
    <g class="${sealed ? '' : 'sv-wrap'}">
      <rect x="12" y="20" width="176" height="120" rx="10" fill="#ff3d9a"/>
      <path d="M12 20h176v18H12z" fill="#c9a6bc" opacity=".55"/>
      <path d="M12 122h176v18H12z" fill="#c9a6bc" opacity=".55"/>
      <circle cx="100" cy="80" r="26" fill="#fff0f7"/>
      <path d="M86 90c4-18 24-18 28 0M92 74a3 3 0 106 0M102 74a3 3 0 106 0" stroke="#ff3d9a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <text x="100" y="120" text-anchor="middle" font-size="11" font-weight="700" fill="#fff0f7" letter-spacing="2">CHOCOLATE</text>
    </g>
  </svg>`;
}

function tankSvg({ levers = [], all = 4, pulled = null, hit = false, drained = false } = {}) {
  const w = 200;
  const gap = Math.min(34, 150 / Math.max(1, all));
  const x0 = w / 2 - ((all - 1) * gap) / 2;
  const leverGlyphs = Array.from({ length: all }, (_, i) => {
    const n = i + 1;
    const live = levers.includes(n);
    const x = x0 + i * gap;
    const on = n === pulled;
    return `<g opacity="${live ? 1 : 0.25}">
      <g class="sv-lever${on ? ' sv-pulled' : ''}">
        <rect x="${x - 2}" y="150" width="4" height="22" fill="${on ? '#ffc83d' : '#c9a6bc'}"/>
        <circle cx="${x}" cy="148" r="6" fill="${on ? '#ff294b' : '#7b2ff7'}"/>
      </g>
      <text x="${x}" y="190" text-anchor="middle" font-size="10" fill="#fff0f7">${n}</text>
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 200 196" aria-hidden="true">
    <rect x="30" y="40" width="140" height="96" rx="6" fill="rgba(56,189,248,.12)" stroke="#38bdf8" stroke-width="3"/>
    ${drained ? '' : `<path d="M33 78q12-8 24 0t24 0t24 0t24 0t24 0t10-3V133H33z" fill="rgba(56,189,248,.45)"/>`}
    <path d="M40 40V16h120v24" stroke="#c9a6bc" stroke-width="3" fill="none"/>
    <g class="sv-seat${hit ? ' sv-drop' : ''}">
      <rect x="78" y="48" width="44" height="6" rx="2" fill="#ffc83d"/>
      <circle cx="100" cy="30" r="9" fill="#fff0f7"/>
      <path d="M88 48c0-10 5-14 12-14s12 4 12 14z" fill="#ff7bc8"/>
    </g>
    ${hit ? `<g class="sv-splash" stroke="#bae6fd" stroke-width="3" stroke-linecap="round" fill="none">
      <path d="M70 70l-14-18M80 64l-6-22M120 64l6-22M130 70l14-18M100 60v-24"/></g>` : ''}
    <rect x="${x0 - 14}" y="170" width="${(all - 1) * gap + 28}" height="8" rx="3" fill="#32172a"/>
    ${leverGlyphs}
  </svg>`;
}

function beaverSvg() {
  return `<svg viewBox="0 0 200 160" aria-hidden="true">
    <defs><linearGradient id="svg-beaver" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff1a8"/><stop offset=".55" stop-color="#e0b43c"/><stop offset="1" stop-color="#8f6212"/>
    </linearGradient></defs>
    <ellipse cx="150" cy="118" rx="40" ry="16" transform="rotate(-18 150 118)" fill="#a5741a"/>
    <path d="M122 110l52-16M126 120l52-16M132 102l18 28M150 96l18 28" stroke="#6b4a0e" stroke-width="2"/>
    <ellipse cx="96" cy="100" rx="50" ry="40" fill="url(#svg-beaver)"/>
    <circle cx="64" cy="64" r="30" fill="url(#svg-beaver)"/>
    <circle cx="46" cy="40" r="8" fill="#c8962e"/><circle cx="80" cy="38" r="8" fill="#c8962e"/>
    <circle cx="54" cy="60" r="4" fill="#241a00"/><circle cx="74" cy="60" r="4" fill="#241a00"/>
    <ellipse cx="64" cy="72" rx="7" ry="5" fill="#5a3b08"/>
    <rect x="58" y="78" width="12" height="11" rx="2" fill="#fff8dc" stroke="#8f6212"/>
    <path d="M64 78v11" stroke="#8f6212"/>
    <path d="M70 130q-8 12 4 12M110 134q-4 10 8 10" stroke="#8f6212" stroke-width="5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function baguetteSvg() {
  return `<svg viewBox="0 0 200 160" aria-hidden="true">
    <defs><linearGradient id="svg-bag" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe9a8"/><stop offset=".5" stop-color="#d9a441"/><stop offset="1" stop-color="#8a5a12"/>
    </linearGradient></defs>
    <path d="M20 120C40 70 150 20 184 34c12 6 4 24-10 34C130 100 50 150 26 140c-8-4-9-12-6-20z"
      fill="url(#svg-bag)" stroke="#8a5a12" stroke-width="2"/>
    <path d="M52 112l22-26M82 96l22-28M112 78l22-28M142 60l18-22" stroke="#fff3c4" stroke-width="5" stroke-linecap="round"/>
    <path d="M30 128c30-6 90-50 140-86" stroke="#fff8dc" stroke-width="2" opacity=".5" fill="none"/>
    <path d="M160 18l6 10M176 16l-2 12M186 26l-10 6" stroke="#ffe066" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

function artFor(kind, opts = {}) {
  if (kind === 'chocolate') return barSvg(opts);
  if (kind === 'tank') return tankSvg(opts);
  if (kind === 'beaver') return beaverSvg();
  return baguetteSvg();
}

// ── THE SCREENS ─────────────────────────────────────────────────────────

function stepHtml(suffix, i, kind, art, body) {
  const color = SAVE_KINDS[kind]?.color || '#FFC83D';
  return `<div class="dr-step" id="dr-step-${suffix}-${i}">
    <div class="dr-panel dr-a-room sv-card" style="--sv-c:${color}">
      <!--dr-chrome--><div class="sv-art">${art}</div><!--/dr-chrome-->
      <div>${body}</div>
    </div></div>`;
}

function publish(suffix, perStep) {
  if (typeof window === 'undefined') return;
  window._drSidebar = window._drSidebar || {};
  window._drSidebar[suffix] = perStep;
}

function page(row, suffix, { phase, title, subtitle, steps, rail }) {
  const ep = epOf(row);
  return `<style>${SAVE_CSS}</style>${_shell(`<div class="sv-stage">${steps.join('')}</div>`, ep, {
    phase, title, subtitle, sidebar: rail,
  })}${_controls(suffix, steps.length, ep.num)}`;
}

/** What the save looked like BEFORE tonight, from the snapshot after it. */
function savesBefore(row) {
  const after = row?.dr?.savesState;
  if (!after) return null;
  const s = JSON.parse(JSON.stringify(after));
  for (const t of row?.dr?.save?.tries || []) {
    if (t.kind === 'chocolate') {
      s.opened = (s.opened || []).filter(n => n !== t.queen);
      if (t.saved) s.found = false;
    }
  }
  return s;
}

export function rpBuildSaveIntro(row, scenes = []) {
  const ep = epOf(row);
  const list = scenes.filter(sc => /^save:/.test(sc.kind) && sc.text);
  if (!list.length) return '';
  const kind = row?.dr?.save?.kind || list[0].data?.save;
  const meta = SAVE_KINDS[kind] || {};
  const steps = list.map((sc, i) => {
    const retire = sc.kind === 'save:retire';
    const handed = sc.data?.handedTo || [];
    const art = kind === 'tank'
      ? tankSvg({ levers: retire ? [] : Array.from({ length: sc.data?.levers || 4 }, (_, k) => k + 1),
        all: sc.data?.levers || row?.dr?.save?.levers?.total || 4, drained: retire })
      : artFor(kind, { sealed: true, uid: `i${ep.num}-${i}` });
    const who = handed.length
      ? `<div class="sv-who">${handed.slice(0, 16).map(n => _portrait(n, ep, { size: 30 })).join('')}</div>` : '';
    const rule = sc.kind === 'save:retire' ? ''
      : `<p class="sv-rule">${esc(meta.desc || '')}</p>`;
    return stepHtml('saveintro', i, kind,
      art, `<span class="sv-tag">${esc(retire ? 'Retired' : meta.name || 'The Save')}</span>${who}
        <p class="sv-line">${esc(sc.text)}</p>${rule}`);
  });
  const rail = `<h4 class="dr-disp">${esc(meta.short || 'The save')}</h4>
    <div class="sv-rail-row">${esc(meta.mode === 'holder' ? 'Held by the maxi winner, weekly' : 'Used by a lip sync loser')}</div>`;
  publish('saveintro', list.map(() => rail));
  return page(row, 'saveintro', {
    phase: 'werk', title: meta.name || 'The Save', subtitle: 'how it works', steps, rail,
  });
}

export function rpBuildSaveHold(row, scenes = []) {
  const ep = epOf(row);
  const hold = row?.dr?.save?.hold;
  const list = scenes.filter(sc => /^save:/.test(sc.kind) && sc.text);
  if (!hold || !list.length) return '';
  const kind = hold.kind;
  const meta = SAVE_KINDS[kind] || {};
  let savedShown = false;
  const perStep = [];
  const railAt = shown => `<h4 class="dr-disp">${esc(meta.short)}</h4>
    <div class="sv-rail-row">Winner <b>${esc(hold.winner)}</b></div>
    ${kind === 'baguette' ? `<div class="sv-rail-row">Held by <b>${esc(shown.holder ? hold.holder : '…')}</b></div>` : ''}
    <h4 class="dr-disp">The bottom three</h4>
    ${hold.pool.map(n => `<div class="sv-rail-row">${_portrait(n, ep, { size: 26 })} ${esc(n)} ${
      shown.saved ? (n === hold.saved ? '<b>SAVED</b>' : 'lip syncs') : ''}</div>`).join('')}`;
  const steps = list.map((sc, i) => {
    let body = '';
    if (sc.kind === 'save:handoff') {
      body = `<span class="sv-tag">The hand-off</span>
        <div class="sv-who">${[hold.winner, hold.holder].filter((x, k, a) => a.indexOf(x) === k)
    .map(n => _portrait(n, ep, { size: 54 })).join('')}</div>`;
      body = `<!--dr-chrome-->${body}<!--/dr-chrome-->`;
    } else {
      const pool = hold.pool.map(n => {
        const cls = sc.kind === 'save:saved' ? (n === hold.saved ? ' sv-kept' : '')
          : (n === hold.saved ? '' : ' sv-sing');
        return `<div class="sv-q${cls}">${_portrait(n, ep, { size: 54 })}<span>${esc(n)}</span></div>`;
      }).join('');
      body = `<span class="sv-tag">${sc.kind === 'save:saved' ? `${esc(hold.holder)} decides` : 'Lip sync for your life'}</span>
        <!--dr-chrome--><div class="sv-pool">${pool}</div><!--/dr-chrome-->`;
    }
    if (sc.kind === 'save:saved') savedShown = true;
    perStep.push(railAt({ holder: true, saved: savedShown }));
    return stepHtml('savehold', i, kind, artFor(kind), `${body}<p class="sv-line">${esc(sc.text)}</p>`);
  });
  const rest = railAt({ holder: false, saved: false });
  publish('savehold', perStep);
  return page(row, 'savehold', {
    phase: 'stage', title: meta.name, subtitle: 'one of the bottom three is saved', steps, rail: rest,
  });
}

export function rpBuildSaveLuck(row, scenes = []) {
  const ep = epOf(row);
  const sv = row?.dr?.save;
  const tries = sv?.tries || [];
  const list = scenes.filter(sc => sc.text);
  if (!sv || !tries.length || !list.length) return '';
  const kind = sv.kind;
  const meta = SAVE_KINDS[kind] || {};
  const before = savesBefore(row) || {};
  const total = sv.levers?.total || before.levers || 4;
  let tryIdx = 0;
  let sealed = kind === 'chocolate'
    ? (before.handed || []).filter(n => !(before.opened || []).includes(n)).length : 0;
  let found = false;
  const perStep = [];
  const railFor = ({ left, sealedN, done }) => kind === 'tank'
    ? `<h4 class="dr-disp">${esc(meta.short)}</h4>
      <div class="sv-rail-row">Levers in play</div>
      <div class="sv-levers">${Array.from({ length: total }, (_, k) =>
    `<i class="${left.includes(k + 1) ? '' : 'sv-gone'}"></i>`).join('')}</div>
      <div class="sv-rail-row">Dunks so far <b>${done}</b></div>`
    : `<h4 class="dr-disp">${esc(meta.short)}</h4>
      <div class="sv-rail-row">Bars still sealed <b>${sealedN}</b></div>
      <div class="sv-rail-row">${done ? '<b>The golden bar has been found</b>' : 'The golden bar is still out there'}</div>`;
  let left = tries[0]?.levers ? [...tries[0].levers] : [];
  let dunks = Math.max(0, (before.dunks || 0) - tries.filter(t => t.saved).length);
  const rest = railFor({ left, sealedN: sealed, done: kind === 'tank' ? dunks : false });
  const steps = list.map((sc, i) => {
    let art = '';
    if (sc.kind === 'save:open' || sc.kind === 'save:pull') {
      const t = tries[tryIdx++] || {};
      if (kind === 'chocolate') {
        sealed = Math.max(0, sealed - 1);
        if (t.saved) found = true;
        art = barSvg({ golden: !!t.saved, uid: `l${ep.num}-${i}` });
      } else {
        left = (t.levers || []).filter(n => t.saved || n !== t.lever);
        if (t.saved) { dunks += 1; left = Array.from({ length: total }, (_, k) => k + 1); }
        art = tankSvg({ levers: t.levers || [], all: total, pulled: t.lever, hit: !!t.saved });
      }
    } else {
      art = `<div class="sv-who">${(sc.data?.players || []).slice(0, 2)
        .map(n => _portrait(n, ep, { size: 64 })).join('')}</div>`;
    }
    perStep.push(railFor({ left, sealedN: sealed, done: kind === 'tank' ? dunks : found }));
    const tag = sc.kind === 'save:open' ? 'The bar'
      : sc.kind === 'save:pull' ? 'The levers'
        : /sashay/.test(sc.kind) ? 'Sashay away' : meta.short;
    return stepHtml('saveluck', i, kind, art,
      `<span class="sv-tag">${esc(tag)}</span><p class="sv-line">${esc(sc.text)}</p>`);
  });
  publish('saveluck', perStep);
  return page(row, 'saveluck', {
    phase: 'lipsync', title: meta.name,
    subtitle: kind === 'tank' ? 'pick a lever' : 'open your bar', steps, rail: rest,
  });
}
