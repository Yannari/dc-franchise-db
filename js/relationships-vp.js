// ══════════════════════════════════════════════════════════════════════
// relationships-vp.js — "The Web" relationship screen (builder only).
//
// Renders the multidimensional, DIRECTIONAL relationship state: for the most
// charged pairs it shows A→B vs B→A side by side (so "A trusts B but B fears A"
// reads at a glance), a plain-language interpretation of each direction, and the
// recent causes behind the feelings. Reads a per-episode snapshot when given
// (correct replay), else the live gs. Self-contained: core + snapshots only.
// ══════════════════════════════════════════════════════════════════════
import { gs, players } from './core.js';

function slugOf(name) { return players.find(p => p.name === name)?.slug || String(name).toLowerCase().replace(/\s+/g, '-'); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function av(name, size = 30) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${esc(name)}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid #6b4a7a;background:#160e22" onerror="this.style.visibility='hidden'">`;
}

const DIMS = [
  { key: 'affection', label: 'Affection', signed: true, col: '#ff8bc4' },
  { key: 'trust', label: 'Trust', signed: true, col: '#5ad1ff' },
  { key: 'strategicRespect', label: 'Respect', signed: false, col: '#ffd36b' },
  { key: 'fear', label: 'Fear', signed: false, col: '#c98bff' },
  { key: 'obligation', label: 'Obligation', signed: false, col: '#8bffb0' },
  { key: 'resentment', label: 'Resentment', signed: false, col: '#ff6b6b' },
  { key: 'attraction', label: 'Attraction', signed: false, col: '#ff5aa8' },
];

const DEFAULTS = { affection: 0, trust: 0, strategicRespect: 0, fear: 0, obligation: 0, resentment: 0, attraction: 0 };
function dimsFor(store, from, to) { return { ...DEFAULTS, ...(store?.[`${from}→${to}`] || {}) }; }

// plain-language read of one direction
function readDirection(to, d) {
  const s = [];
  if (d.affection >= 4 && d.trust <= 1) s.push([Math.abs(d.affection) + 1, `likes ${to} but doesn't fully trust them`]);
  else if (d.affection >= 4) s.push([d.affection, `is close to ${to}`]);
  else if (d.affection <= -3) s.push([-d.affection, `dislikes ${to}`]);
  if (d.fear >= 3) s.push([d.fear + 0.5, `is wary of ${to}`]);
  if (d.resentment >= 4) s.push([d.resentment, `resents ${to}`]);
  if (d.obligation >= 3) s.push([d.obligation, `feels indebted to ${to}`]);
  if (d.strategicRespect >= 5) s.push([d.strategicRespect * 0.7, `respects ${to}'s game`]);
  if (d.attraction >= 3) s.push([d.attraction + 0.5, `is drawn to ${to}`]);
  s.sort((a, b) => b[0] - a[0]);
  if (!s.length) return `is fairly neutral toward ${to}`;
  const text = s.slice(0, 2).map(x => x[1]).join(', and ');
  // collapse repeated target name after the first mention → "them"
  let n = 0;
  return text.replace(new RegExp(to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), m => (n++ === 0 ? m : 'them'));
}

function intensity(dAB, dBA) {
  const w = d => Math.abs(d.affection) * 0.6 + Math.abs(d.trust) * 0.6 + d.strategicRespect * 0.7
    + d.fear * 1.1 + d.obligation * 0.9 + d.resentment * 0.9 + d.attraction * 1.1;
  const asym = Math.abs(dAB.affection - dBA.affection) + Math.abs(dAB.trust - dBA.trust) + Math.abs(dAB.fear - dBA.fear);
  return w(dAB) + w(dBA) + asym * 0.6;
}

function bar(d, dim) {
  const v = d[dim.key] || 0;
  if (dim.signed) {
    const pct = Math.min(50, Math.abs(v) / 10 * 50);
    const side = v >= 0 ? `left:50%;width:${pct}%` : `right:50%;width:${pct}%`;
    const col = v >= 0 ? dim.col : '#ff6b6b';
    return `<div class="rv-bar signed"><span class="mid"></span><span class="fill" style="${side};background:${col}"></span></div>`;
  }
  const pct = Math.min(100, v / 10 * 100);
  return `<div class="rv-bar"><span class="fill" style="width:${pct}%;background:${dim.col}"></span></div>`;
}

function dimRows(d) {
  return DIMS.map(dim => {
    const v = d[dim.key] || 0;
    if (Math.abs(v) < 0.5) return '';   // hide near-zero dims to reduce noise
    return `<div class="rv-drow"><span class="lbl">${dim.label}</span>${bar(d, dim)}<span class="val">${v > 0 && dim.signed ? '+' : ''}${Math.round(v * 10) / 10}</span></div>`;
  }).join('') || `<div class="rv-none">no strong feelings yet</div>`;
}

function causeList(causeStore, from, to) {
  const arr = [...(causeStore?.[`${from}→${to}`] || [])].reverse().slice(0, 3);
  if (!arr.length) return '';
  return `<div class="rv-causes">${arr.map(c => `<div class="rv-cause"><span class="ep">ep ${c.ep}</span> ${esc(c.reason)}</div>`).join('')}</div>`;
}

function _css() {
  return `<style>
  .rv-wrap{--bg:#160e22;--panel:#211632;--line:#3a2a4e;--txt:#f0e6f5;--dim:#a893be;
    max-width:1100px;margin:0 auto;font-family:'Chakra Petch',system-ui,sans-serif;color:var(--txt);
    background:radial-gradient(120% 90% at 50% -10%,#2c1a44,#160e22 70%);border-radius:10px;padding:18px}
  .rv-wrap *{box-sizing:border-box}
  .rv-h{font-family:'Bungee Inline','Chakra Petch',sans-serif;font-size:24px;text-align:center;letter-spacing:1px;color:#d9a6ff;text-shadow:0 0 16px rgba(200,120,255,.4);margin:2px 0 2px}
  .rv-sub{text-align:center;font-size:12px;color:var(--dim);margin-bottom:16px}
  .rv-pair{border:1px solid var(--line);border-radius:14px;background:var(--panel);margin:0 0 12px;overflow:hidden}
  .rv-phead{display:flex;align-items:center;justify-content:center;gap:10px;padding:9px;background:linear-gradient(90deg,rgba(255,139,196,.08),rgba(90,209,255,.08));border-bottom:1px solid var(--line)}
  .rv-phead .nm{font-weight:700;font-size:14px}
  .rv-phead .amp{color:var(--dim);font-size:12px}
  .rv-cols{display:grid;grid-template-columns:1fr 1fr;gap:0}
  @media(max-width:680px){.rv-cols{grid-template-columns:1fr}}
  .rv-col{padding:11px 13px}
  .rv-col:first-child{border-right:1px solid var(--line)}
  .rv-read{font-size:12.5px;line-height:1.5;color:var(--txt);margin-bottom:9px}
  .rv-read b{color:#fff}
  .rv-drow{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:11px}
  .rv-drow .lbl{width:74px;color:var(--dim);flex-shrink:0}
  .rv-drow .val{width:34px;text-align:right;color:var(--txt);font-variant-numeric:tabular-nums}
  .rv-bar{position:relative;flex:1;height:9px;border-radius:5px;background:#160e22;border:1px solid var(--line);overflow:hidden}
  .rv-bar .fill{position:absolute;top:0;bottom:0;border-radius:5px}
  .rv-bar.signed .mid{position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.25)}
  .rv-none{font-size:11px;color:var(--dim);font-style:italic;padding:4px 0}
  .rv-causes{margin-top:9px;border-top:1px dashed var(--line);padding-top:7px}
  .rv-cause{font-size:10.5px;color:var(--dim);line-height:1.5}
  .rv-cause .ep{color:#c98bff;font-weight:600;margin-right:4px}
  .rv-empty{text-align:center;color:var(--dim);padding:24px;font-size:13px}
  .rv-legend{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:0 0 14px;font-size:10.5px;color:var(--dim)}
  .rv-legend span{display:inline-flex;align-items:center;gap:4px}
  .rv-dot{width:9px;height:9px;border-radius:3px}
  </style>`;
}

// dimsStore/causeStore default to live gs; pass snapshots for correct replay.
export function rpBuildRelationshipWeb(ep = null, dimsStore = null, causeStore = null, maxPairs = 12) {
  const dims = dimsStore || gs.relationshipDimensions || {};
  const causes = causeStore || gs.relationshipCauses || {};
  const active = new Set(gs.activePlayers && gs.activePlayers.length ? gs.activePlayers : players.map(p => p.name));

  // collect unordered pairs that have any stored direction, restricted to still-active players
  const seen = new Set(), pairs = [];
  Object.keys(dims).forEach(key => {
    const [a, b] = key.split('→');
    if (!a || !b || !active.has(a) || !active.has(b)) return;
    const uk = [a, b].sort().join('|');
    if (seen.has(uk)) return;
    seen.add(uk);
    const [x, y] = [a, b].sort();
    const dXY = dimsFor(dims, x, y), dYX = dimsFor(dims, y, x);
    pairs.push({ x, y, dXY, dYX, score: intensity(dXY, dYX) });
  });
  pairs.sort((p, q) => q.score - p.score);
  const top = pairs.filter(p => p.score > 1.2).slice(0, maxPairs);

  if (!top.length) {
    return `${_css()}<div class="rv-wrap"><div class="rv-h">THE WEB</div><div class="rv-empty">No strong relationships have formed yet.</div></div>`;
  }

  const legend = DIMS.map(d => `<span><i class="rv-dot" style="background:${d.col}"></i>${d.label}</span>`).join('');

  const cards = top.map(p => `
    <div class="rv-pair">
      <div class="rv-phead">${av(p.x)}<span class="nm">${esc(p.x)}</span><span class="amp">&harr;</span><span class="nm">${esc(p.y)}</span>${av(p.y)}</div>
      <div class="rv-cols">
        <div class="rv-col">
          <div class="rv-read"><b>${esc(p.x)}</b> ${readDirection(esc(p.y), p.dXY)}.</div>
          ${dimRows(p.dXY)}
          ${causeList(causes, p.x, p.y)}
        </div>
        <div class="rv-col">
          <div class="rv-read"><b>${esc(p.y)}</b> ${readDirection(esc(p.x), p.dYX)}.</div>
          ${dimRows(p.dYX)}
          ${causeList(causes, p.y, p.x)}
        </div>
      </div>
    </div>`).join('');

  return `${_css()}<div class="rv-wrap">
    <div class="rv-h">THE WEB</div>
    <div class="rv-sub">How the strongest bonds and rivalries actually feel — each side shown separately, because feelings aren't mutual.</div>
    <div class="rv-legend">${legend}</div>
    ${cards}
  </div>`;
}
