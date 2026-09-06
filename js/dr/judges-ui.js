// ══════════════════════════════════════════════════════════════════════
// dr/judges-ui.js — editing what each judge is watching
// ══════════════════════════════════════════════════════════════════════
//
// The spec asked for this in §4 and Plan 1's Task 5 named it in its interfaces
// paragraph, then never gave it a step: the config field was defined, the
// engine applied it, and nothing on any screen could write it. So every season
// ran on the authored tastes and the setting was invisible.
//
// A tab per judge, four sliders, and the four always sum to 1 — which is the
// whole idea rather than a normalisation detail. A judge is not harsher or
// softer than another; they are watching DIFFERENT THINGS, and the only way to
// express "Michelle cares more about the runway" is to say what she cares less
// about. Dragging one slider therefore takes the difference from the other
// three in proportion, so the panel stays four opinions rather than becoming a
// difficulty setting.
import { JUDGES } from './data/judges.js';
import { seasonConfig } from '../core.js';

const TERMS = [
  { key: 'challenge', label: 'The challenge', hint: 'what she did in the maxi' },
  { key: 'runway', label: 'The runway', hint: 'the look she walked' },
  { key: 'risk', label: 'Risk', hint: 'how far she went for it' },
  { key: 'polish', label: 'Polish', hint: 'how finished it was' },
];

let _openJudge = 'rupaul';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The weights in force for one judge: the season's override, or her own. */
export function judgeWeights(id) {
  const j = JUDGES.find(x => x.id === id);
  if (!j) return null;
  const saved = (seasonConfig.drJudgeWeights || {})[id];
  return saved ? { ...j.taste, ...saved } : { ...j.taste };
}

/**
 * Set one term and rebalance the other three so the four still sum to 1.
 *
 * Proportionally, so a judge who cared nothing for risk still cares nothing
 * for it after somebody nudges the runway. When the others are all at zero
 * there is nothing to take from, so the remainder is spread evenly rather than
 * dividing by zero and writing NaN into the config.
 */
export function setJudgeWeight(id, key, value) {
  const w = judgeWeights(id);
  if (!w) return;
  const v = Math.max(0, Math.min(1, Number(value) || 0));
  const others = TERMS.map(t => t.key).filter(k => k !== key);
  const rest = others.reduce((s, k) => s + w[k], 0);
  const remaining = 1 - v;

  const next = { [key]: v };
  if (rest > 0.0001) {
    for (const k of others) next[k] = w[k] / rest * remaining;
  } else {
    for (const k of others) next[k] = remaining / others.length;
  }
  for (const k of Object.keys(next)) next[k] = Math.round(next[k] * 1000) / 1000;

  seasonConfig.drJudgeWeights = { ...(seasonConfig.drJudgeWeights || {}), [id]: next };
  try { localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); } catch { /* private mode */ }
  renderDragJudges();
}

/** Back to what she was written as. */
export function resetJudgeWeights(id) {
  const all = { ...(seasonConfig.drJudgeWeights || {}) };
  delete all[id];
  seasonConfig.drJudgeWeights = all;
  try { localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); } catch { /* private mode */ }
  renderDragJudges();
}

export function openJudgeTab(id) {
  if (JUDGES.some(j => j.id === id)) _openJudge = id;
  renderDragJudges();
}

export function renderDragJudges() {
  const host = document.getElementById('dr-judges-panel');
  if (!host) return;

  const j = JUDGES.find(x => x.id === _openJudge) || JUDGES[0];
  const w = judgeWeights(j.id);
  const edited = !!(seasonConfig.drJudgeWeights || {})[j.id];

  const tabs = JUDGES.map(x => {
    const on = x.id === j.id;
    const touched = !!(seasonConfig.drJudgeWeights || {})[x.id];
    return `<button type="button" onclick="openJudgeTab('${x.id}')" title="${esc(x.voice)}"
      style="font-size:10.5px;padding:3px 7px;border-radius:4px;cursor:pointer;
             border:1px solid ${on ? '#ff2d95' : 'rgba(255,255,255,.14)'};
             background:${on ? 'rgba(255,45,149,.16)' : 'transparent'};
             color:${on ? '#ff9ecb' : 'var(--muted,#8b949e)'}">${esc(x.name.split(' ')[0])}${touched ? ' •' : ''}</button>`;
  }).join('');

  const sliders = TERMS.map(t => {
    const pct = Math.round(w[t.key] * 100);
    return `<div class="slider-row" title="${esc(t.hint)}">
      <span class="slider-name" style="color:#f9a8d4;min-width:92px">${t.label}</span>
      <input type="range" min="0" max="100" value="${pct}" class="stat-slider"
        oninput="setJudgeWeight('${j.id}','${t.key}', this.value/100)">
      <span class="slider-val" style="color:#f9a8d4">${pct}%</span>
    </div>`;
  }).join('');

  const bias = Object.entries(j.styleBias || {})
    .sort((a, b) => b[1] - a[1])
    .map(([style, v]) => `<span style="color:${v > 0 ? '#4ade80' : '#f85149'}">${esc(style)} ${v > 0 ? '+' : ''}${v}</span>`)
    .join(' · ');

  host.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">${tabs}</div>
    <div style="font-size:11px;color:var(--muted,#8b949e);margin-bottom:8px;line-height:1.5">
      ${esc(j.voice)}
    </div>
    <div class="stat-sliders">${sliders}</div>
    <div style="font-size:10.5px;color:var(--muted,#8b949e);margin-top:8px;line-height:1.6">
      Soft on / hard on: ${bias || '—'}<br>
      Pet peeve: ${esc(j.petPeeve)} · Soft spot: ${esc(j.softSpot)}
    </div>
    <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
      <button type="button" onclick="resetJudgeWeights('${j.id}')"
        style="font-size:10.5px;padding:3px 8px;border-radius:4px;cursor:pointer;
               border:1px solid rgba(255,255,255,.14);background:transparent;color:var(--muted,#8b949e)"
        ${edited ? '' : 'disabled'}>Reset ${esc(j.name.split(' ')[0])}</button>
      <span style="font-size:10px;color:var(--muted,#8b949e)">
        ${edited ? 'Edited for this season.' : 'As written.'}
        The four always total 100% — a judge watches different things, not harder.
      </span>
    </div>`;
}
