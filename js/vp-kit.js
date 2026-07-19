// ══════════════════════════════════════════════════════════════════════
// vp-kit.js — the reusable strategy visual grammar (VP redesign).
//
// One consistent language for every strategic surface. Meanings never change:
//   solid  = confirmed / public        dashed = suspected / private
//   faded  = stale                     tones:
//   danger (red) = active threat  ·  unstable (amber) = uncertain / negotiating
//   trust (blue) = trust / information ·  strategy (purple) = long-term plans
//   safe (green) = confirmed / positive · neutral = background
//
// Pure string builders (no DOM), so they work in the VP, the debug screens, and
// the text-free surfaces alike. The CSS lives in simulator.html (.sg-*).
// ══════════════════════════════════════════════════════════════════════

export const SG_TONE = {
  danger: 'var(--sg-danger)', unstable: 'var(--sg-unstable)', trust: 'var(--sg-trust)',
  strategy: 'var(--sg-strategy)', safe: 'var(--sg-safe)', neutral: 'var(--sg-neutral)',
};
const tone = t => SG_TONE[t] || t || SG_TONE.neutral;   // accepts a tone name OR a raw color
const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A rounded status chip. `dashed` = suspected/private, `faded` = stale,
// `isNew` = gained this beat (green ring). `tip` shows on hover.
export function sgChip(label, { tone: t = 'neutral', color, dashed = false, faded = false, outline = false, isNew = false, tip = '' } = {}) {
  const c = color || tone(t);
  const cls = ['sg-chip', dashed && 'sg-chip--dashed', outline && 'sg-chip--outline', faded && 'sg-chip--faded', isNew && 'sg-chip--new'].filter(Boolean).join(' ');
  return `<span class="${cls}" style="--c:${c}"${tip ? ` title="${esc(tip)}"` : ''}>${label}</span>`;
}

// A small uppercase tag (LEAKED, EXPOSED, TRUST ↓, …).
export function sgBadge(label, { tone: t = 'neutral', color, ghost = false } = {}) {
  const c = color || tone(t);
  return `<span class="sg-badge${ghost ? ' sg-badge--ghost' : ''}" style="--c:${c}">${label}</span>`;
}

// A portrait + name pill for referencing a contestant inline.
export function sgPortraitChip(name, slug) {
  const s = slug || String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `<span class="sg-portrait-chip"><img src="assets/avatars/${s}.png" alt="" onerror="this.style.visibility='hidden'">${esc(name)}</span>`;
}

// A labelled section divider with a glowing tone dot.
export function sgSection(label, t = 'neutral', note = '') {
  return `<div class="sg-section" style="--c:${tone(t)}">${esc(label)}${note ? `<span style="font-weight:400;letter-spacing:.3px;color:var(--sg-ghost);text-transform:none">— ${esc(note)}</span>` : ''}</div>`;
}

export function sgArrow() { return '<span class="sg-arrow">→</span>'; }
export function sgEmpty(msg) { return `<div class="sg-empty">${esc(msg)}</div>`; }
export function sgDot(t = 'neutral', color) { return `<span class="sg-dot" style="--c:${color || tone(t)}"></span>`; }

// A thin proportional bar (relationship dimension, meter, etc.).
export function sgBar(value, { min = 0, max = 10, tone: t = 'neutral', color } = {}) {
  const pct = Math.max(0, Math.min(100, ((Number(value) - min) / (max - min || 1)) * 100));
  return `<div class="sg-bar-track"><div class="sg-bar-fill" style="width:${pct}%;--c:${color || tone(t)}"></div></div>`;
}

// A collapsible dictionary. items: [{ color|tone, label, note, tag }].
export function sgLegend(summary, items) {
  const rows = items.map(it => `<div class="sg-legend-row">${sgDot(it.tone, it.color)}<span><strong style="color:var(--sg-ink)">${esc(it.label)}</strong>${it.tag ? ` <span style="color:var(--sg-ghost)">(${esc(it.tag)})</span>` : ''} — ${esc(it.note)}</span></div>`).join('');
  return `<details class="sg-legend"><summary>📖 ${esc(summary)}</summary><div class="sg-legend-body">${rows}</div></details>`;
}

// A card shell with a titled header (tone colours the header glow).
export function sgCard(title, sub, body, { tone: t = 'trust' } = {}) {
  return `<div class="sg-card"><div class="sg-card-head" style="--c:${tone(t)}"><div class="sg-card-title">${esc(title)}</div>${sub ? `<div class="sg-card-sub">${esc(sub)}</div>` : ''}</div>${body}</div>`;
}

// The seven relationship dimensions mapped onto the grammar's tones — used by
// every relationship surface so a dimension always reads the same colour.
export const DIM_TONE = {
  affection: 'trust', trust: 'trust', strategicRespect: 'strategy', fear: 'danger',
  obligation: 'unstable', resentment: 'danger', attraction: 'strategy',
};
export const DIM_LABEL = {
  affection: 'liking', trust: 'trust', strategicRespect: 'game respect', fear: 'fear',
  obligation: 'owes', resentment: 'resentment', attraction: 'attraction',
};
