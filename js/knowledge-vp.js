// ══════════════════════════════════════════════════════════════════════
// knowledge-vp.js — "Who Knows What" information map (builder functions only).
//
// NOT registered in vp-screens.js this pass — the integration pass wires it in
// (see KNOWLEDGE-INTEGRATION-NOTES.md). Renders gs.knowledge as a facts×knowers
// matrix: cell opacity = effective confidence, cell color = belief valence
// (accurate / exaggerated / stale / false), with a marker for second-order
// knowledge. Self-contained: reads core + the knowledge core only.
// ══════════════════════════════════════════════════════════════════════
import { gs, players } from './core.js';
import { allFacts, believes } from './knowledge.js';

function slugOf(name) { return players.find(p => p.name === name)?.slug || String(name).toLowerCase().replace(/\s+/g, '-'); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function av(name, size = 22) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${esc(name)}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid #3a4a6a;background:#0e1626" onerror="this.style.visibility='hidden'">`;
}

const VAL_COLOR = { accurate: '#3fb950', exaggerated: '#d29922', stale: '#6e7681', false: '#f85149' };
const TYPE_LABEL = { idol: 'Idol', advantage: 'Advantage', target: 'Vote target', alliance: 'Alliance', betrayal: 'Betrayal', throw: 'Thrown challenge', pitch: 'Vote pitch', 'bond-read': 'Relationship read' };

function _factLabel(f) {
  const t = TYPE_LABEL[f.type] || f.type;
  if (f.type === 'alliance') return `${t}: ${(f.payload || []).join(', ')}`;
  if (f.object) return `${t}: ${f.subject} → ${f.object}`;
  return `${t}: ${f.subject}`;
}

function _css() {
  return `<style>
  .kw-wrap{--bg:#0d1420;--panel:#131c2b;--line:#233149;--txt:#e6edf3;--dim:#8b98ad;
    max-width:1100px;margin:0 auto;font-family:'Chakra Petch',system-ui,sans-serif;color:var(--txt);
    background:radial-gradient(120% 90% at 50% -10%,#1a2740,#0d1420 70%);border-radius:10px;padding:18px}
  .kw-wrap *{box-sizing:border-box}
  .kw-h{font-family:'Bungee Inline','Chakra Petch',sans-serif;font-size:24px;text-align:center;letter-spacing:1px;color:#7ea8ff;text-shadow:0 0 16px rgba(126,168,255,.4);margin:2px 0 2px}
  .kw-sub{text-align:center;font-size:12px;color:var(--dim);margin-bottom:14px}
  .kw-legend{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:14px;font-size:11px;color:var(--dim)}
  .kw-legend span{display:inline-flex;align-items:center;gap:5px}
  .kw-dot{width:11px;height:11px;border-radius:3px;display:inline-block}
  .kw-scroll{overflow-x:auto}
  .kw-grid{border-collapse:separate;border-spacing:3px;margin:0 auto}
  .kw-grid th.col{padding:4px;vertical-align:bottom}
  .kw-grid th.col img{display:block;margin:0 auto}
  .kw-grid th.col .nm{font-size:9px;color:var(--dim);text-align:center;margin-top:3px;max-width:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .kw-grid td.fact{font-size:12px;color:var(--txt);text-align:right;padding:0 10px 0 4px;white-space:nowrap;max-width:230px;overflow:hidden;text-overflow:ellipsis}
  .kw-grid td.fact .tt{font-size:9px;color:var(--dim);letter-spacing:.5px;text-transform:uppercase}
  .kw-cell{width:34px;height:30px;border-radius:6px;border:1px solid var(--line);position:relative}
  .kw-cell .fill{position:absolute;inset:0;border-radius:5px}
  .kw-cell .so{position:absolute;right:2px;bottom:1px;width:5px;height:5px;border-radius:50%;background:#fff;opacity:.85;box-shadow:0 0 4px #fff}
  .kw-cell.lie{outline:1px dashed #f85149}
  .kw-empty{text-align:center;color:var(--dim);padding:24px;font-size:13px}
  </style>`;
}

// The main map. `ep` defaults to the current episode for confidence/staleness.
export function rpBuildKnowledgeMap(ep = null) {
  const facts = allFacts();
  const people = (gs.activePlayers && gs.activePlayers.length ? gs.activePlayers : players.map(p => p.name));
  if (!facts.length) {
    return `${_css()}<div class="kw-wrap"><div class="kw-h">WHO KNOWS WHAT</div><div class="kw-empty">No strategic facts are in circulation yet.</div></div>`;
  }
  const legend = Object.entries(VAL_COLOR).map(([k, c]) =>
    `<span><i class="kw-dot" style="background:${c}"></i>${k}</span>`).join('') +
    `<span><i class="kw-dot" style="background:#3fb950;position:relative"><i style="position:absolute;right:0;bottom:0;width:4px;height:4px;border-radius:50%;background:#fff"></i></i>knows others know</span>`;

  const head = `<tr><th></th>${people.map(n => `<th class="col">${av(n, 26)}<div class="nm">${esc(n)}</div></th>`).join('')}</tr>`;

  const rows = facts
    .sort((a, b) => (a.type + a.subject).localeCompare(b.type + b.subject))
    .map(f => {
      const cells = people.map(n => {
        const b = believes(n, f.id, ep);
        if (!b) return `<td><div class="kw-cell"></div></td>`;
        const col = VAL_COLOR[b.valence] || '#3fb950';
        const op = Math.max(0.12, Math.min(1, b.effectiveConfidence));
        const so = b.knowsOthersKnow && b.knowsOthersKnow.length ? '<span class="so"></span>' : '';
        const lie = f.truth === false ? ' lie' : '';
        const title = `${n}: ${b.valence} · conf ${(b.effectiveConfidence * 100 | 0)}% · via ${esc(b.sourceType)}`;
        return `<td><div class="kw-cell${lie}" title="${title}"><div class="fill" style="background:${col};opacity:${op.toFixed(2)}"></div>${so}</div></td>`;
      }).join('');
      return `<tr><td class="fact"><div class="tt">${esc(TYPE_LABEL[f.type] || f.type)}${f.truth === false ? ' · planted' : ''}</div>${esc(_factLabel(f))}</td>${cells}</tr>`;
    }).join('');

  return `${_css()}<div class="kw-wrap">
    <div class="kw-h">WHO KNOWS WHAT</div>
    <div class="kw-sub">Each cell is one contestant's belief about one fact — brighter = more certain, color = how accurate.</div>
    <div class="kw-legend">${legend}</div>
    <div class="kw-scroll"><table class="kw-grid"><thead>${head}</thead><tbody>${rows}</tbody></table></div>
  </div>`;
}

// Per-fact spread trail — who told whom, in learn order. Handy for a detail view.
export function rpBuildFactTrail(factId, ep = null) {
  const f = allFacts().find(x => x.id === factId);
  if (!f) return '';
  const rows = Object.keys(f.beliefs)
    .map(k => ({ k, ...believes(k, factId, ep) }))
    .sort((a, b) => (a.learnedEp - b.learnedEp))
    .map(b => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--line)">
      ${av(b.k, 24)}<b>${esc(b.k)}</b>
      <span style="color:var(--dim);font-size:11px">ep ${b.learnedEp} · ${esc(b.sourceType)}${b.source && b.source !== 'observation' ? ` (from ${esc(b.source)})` : ''}</span>
      <span style="margin-left:auto;color:${VAL_COLOR[b.valence] || '#3fb950'};font-size:11px">${b.valence} · ${(b.effectiveConfidence * 100 | 0)}%</span>
    </div>`).join('');
  return `${_css()}<div class="kw-wrap"><div class="kw-h" style="font-size:18px">${esc(_factLabel(f))}</div><div>${rows || '<div class="kw-empty">Nobody knows this yet.</div>'}</div></div>`;
}
