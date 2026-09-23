// ══════════════════════════════════════════════════════════════════════
// vp-pm/heart.js — the Heart Map and the relationships viewer (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// Who likes whom, always visible (the user, on mockup v1: "the relationship
// should be seen so we know who likes who"). The reader sees everything the
// villa does not: a hidden crush, somebody faking it, a wrong belief.
//
// NEVER AHEAD OF THE REVEAL. The couples and who is still in the villa come
// from vp-pm/steps.js `villaAt` (the start of the episode, moved only by the
// clicks so far). The feelings are the snapshot the engine took at the END of
// the previous episode, until the episode's last click shows its own: a bar
// that already knew tonight's heartbreak would be a spoiler with a gradient.
import { villaAt, startOfEpisode } from './steps.js';
import { HEART, mini, colourOf, portraitUrl } from './stage.js';

const P = c => `pmv-${c}`;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const key = (a, b) => [a, b].sort().join('|');

/** Everybody who is in this episode at any point, alphabetically (spoiler rule: never in result order). */
export function castOfEpisode(row, prev) {
  const s = startOfEpisode(row, prev);
  const arrived = (row.pm.events || []).filter(e => /entrance/.test(e.kind)).flatMap(e => e.players);
  return [...new Set([...s.villa, ...arrived, ...(row.pm.villa || [])])].sort();
}

/** The feelings on the map: the previous episode's, until the last click. */
function feelingsAt(row, prev, atEnd) {
  const src = atEnd ? row.pm : prev?.pm;
  return { rel: src?.relationships || {}, labels: src?.relLabels || [] };
}
const dim = (rel, a, b) => {
  const v = rel[`${a}→${b}`];
  return v ? { r: v[0], f: v[1], s: v[2], t: v[3] } : null;
};

function mapSvg(names, state, rel, sel) {
  const n = names.length, cx = 140, cy = 132, rad = 104;
  const Pt = Object.fromEntries(names.map((nm, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / Math.max(1, n); return [nm, [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]];
  }));
  const live = new Set(state.villa);
  const couples = new Set(state.couples.map(([a, b]) => key(a, b)));
  const edge = (a, b, cls, extra = '', bend = 0, marker = '') => {
    const [x1, y1] = Pt[a], [x2, y2] = Pt[b];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const qx = mx + (-dy / len) * bend + (cx - mx) * .18, qy = my + (dx / len) * bend + (cy - my) * .18;
    const sx = x1 + dx / len * 16, sy = y1 + dy / len * 16, ex = x2 - dx / len * 18, ey = y2 - dy / len * 18;
    return `<path class="${P('edge')} ${cls}" data-a="${esc(a)}" data-b="${esc(b)}" ${extra} d="M${sx.toFixed(1)} ${sy.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" ${marker}/>`;
  };
  let e = '';
  // rivals: both ways cold
  for (const a of names) for (const b of names) {
    if (a >= b || !live.has(a) || !live.has(b)) continue;
    const ab = dim(rel, a, b), ba = dim(rel, b, a);
    if (ab && ba && ab.f <= -4 && ba.f <= -4) e += edge(a, b, P('rival'));
  }
  // crushes: one-way arrows, the hidden ones dotted purple
  for (const [k2, v] of Object.entries(rel)) {
    const [a, b] = k2.split('→');
    if (!live.has(a) || !live.has(b) || !Pt[a] || !Pt[b] || v[0] < 5 || couples.has(key(a, b))) continue;
    const hidden = v[2] <= 2;
    e += edge(a, b, P('crush'), `style="--w:${(.6 + v[0] * .32).toFixed(2)};${hidden ? 'stroke:#a855f7;stroke-dasharray:2 3' : ''}"`, 14, 'marker-end="url(#pmv-arr)"');
  }
  for (const [a, b] of state.couples) {
    if (!Pt[a] || !Pt[b]) continue;
    const ab = dim(rel, a, b), ba = dim(rel, b, a);
    const strained = (ab && ab.r <= 3) || (ba && ba.r <= 3);
    const cls = strained ? P('strained') : P('couple');
    e += edge(a, b, cls);
    const [x1, y1] = Pt[a], [x2, y2] = Pt[b];
    const mx = (x1 + x2) / 2 + (cx - (x1 + x2) / 2) * .09, my = (y1 + y2) / 2 + (cy - (y1 + y2) / 2) * .09;
    e += `<path d="${HEART}" transform="translate(${mx.toFixed(1)} ${my.toFixed(1)}) scale(.5)" fill="${strained ? '#f59e0b' : '#ff2e88'}" stroke="#fff" stroke-width="2"/>`;
  }
  const nodes = names.map((nm, i) => {
    const [x, y] = Pt[nm], id = `pmvc${i}`, url = portraitUrl(nm);
    const cls = `${P('node')}${live.has(nm) ? '' : ' ' + P('gone')}${nm === sel ? ' ' + P('sel') : ''}`;
    return `<g class="${cls}" data-n="${esc(nm)}" onclick="pmPick(this)"><clipPath id="${id}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14"/></clipPath>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="${colourOf(nm)[0]}"/>
      ${url ? `<image href="${esc(url)}" x="${(x - 14).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="28" height="28" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>` : ''}
      <circle class="${P('ring')}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14"/><text x="${x.toFixed(1)}" y="${(y + (y > cy ? 27 : -19)).toFixed(1)}">${esc(nm)}</text></g>`;
  }).join('');
  const svg = `<svg class="${P('map')}" viewBox="0 0 280 270"><defs>
    <linearGradient id="gCouple" x1="0" x2="1"><stop offset="0" stop-color="#ff7a59"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
    <marker id="pmv-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ff4fa0"/></marker></defs>${e}${nodes}</svg>`;
  // With somebody picked, everything that is not theirs fades.
  if (!sel) return svg;
  return svg.replace(/<path class="pmv-edge ([^"]*)" data-a="([^"]*)" data-b="([^"]*)"/g,
    (m, cls, a, b) => (a === esc(sel) || b === esc(sel) ? m : `<path class="pmv-edge ${cls} pmv-faded" data-a="${a}" data-b="${b}"`));
}

const EYE = '<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg>';
const MASK = '<svg viewBox="0 0 24 24"><path d="M2 7c4-2 16-2 20 0-1 7-4 10-6 10-2 0-3-3-4-3s-2 3-4 3c-2 0-5-3-6-10z" fill="currentColor"/><circle cx="8" cy="10" r="1.6" fill="#fff"/><circle cx="16" cy="10" r="1.6" fill="#fff"/></svg>';
const r1 = v => Math.round(v * 10) / 10;

function relPanel(names, state, rel, labels, sel) {
  const X = sel;
  const labelOf = (a, b) => labels.find(l => l[0] === a && l[1] === b);
  const bars = rec => `<div class="${P('bar2')} ${P('rom')}"><i style="width:${Math.max(0, rec.r) * 10}%"></i>${Math.abs(rec.s - rec.r) >= 1 ? `<span class="${P('ghost')}" style="left:calc(${rec.s * 10}% - 1px)" title="shows"></span>` : ''}</div>
    <div class="${P('bar2')} ${P('fr')}"><i style="${rec.f >= 0 ? `left:50%;width:${Math.min(50, rec.f * 5)}%;background:#14b8a6` : `left:${Math.max(0, 50 + rec.f * 5)}%;width:${Math.min(50, -rec.f * 5)}%;background:#ef4444`}"></i></div>`;
  const others = names.filter(n => n !== X).map(Y => {
    const out = dim(rel, X, Y), inc = dim(rel, Y, X);
    if (!out && !inc) return null;
    const coupled = state.couples.some(c => c.includes(X) && c.includes(Y));
    const o = out || { r: 0, f: 0, s: 0, t: 0 }, i = inc || { r: 0, f: 0, s: 0, t: 0 };
    return { Y, out: o, inc: i, coupled, weight: (coupled ? 100 : 0) + o.r * 3 + i.r * 2 + Math.abs(o.f) + Math.abs(i.f) };
  }).filter(Boolean).sort((a, b) => b.weight - a.weight).slice(0, 8);
  const partner = state.couples.find(c => c.includes(X))?.find(n => n !== X) || null;
  const rows = others.map(({ Y, out, inc }) => {
    const lab = labelOf(X, Y), back = labelOf(Y, X);
    const notes = [];
    if (Math.abs(out.s - out.r) >= 3) notes.push(`<div class="${P('belief')} ${P('shows')}">${MASK}<span>${esc(X)} <b>shows</b> ${r1(out.s)}/10 romance to ${esc(Y)}, and really feels ${r1(out.r)}.</span></div>`);
    if (Math.abs(inc.t - inc.r) >= 3) notes.push(`<div class="${P('belief')} ${P('thinks')}">${EYE}<span>${esc(X)} <b>believes</b> ${esc(Y)} is at ${r1(inc.t)}/10. Really: ${r1(inc.r)}.</span></div>`);
    return `<div class="${P('rrow')}"><div class="${P('top')}">${mini(Y)}<b>${esc(Y)}</b>
      ${lab ? `<span class="${P('tagx')} ${P(lab[2])}" title="${esc(X)} → ${esc(Y)}">${esc(lab[3])}</span>` : ''}
      ${back && (!lab || back[3] !== lab[3]) ? `<span class="${P('tagx')} ${P(back[2])}" style="opacity:.75" title="${esc(Y)} → ${esc(X)}">${esc(Y)}: ${esc(back[3])}</span>` : ''}</div>
      <div class="${P('dirh')}"><span></span><span>Romance</span><span>Friendship</span></div>
      <div class="${P('dir')}"><span class="${P('lbl')}">${esc(X)} →</span>${bars(out)}</div>
      <div class="${P('dir')}"><span class="${P('lbl')}">← ${esc(Y)}</span>${bars(inc)}</div>${notes.join('')}</div>`;
  }).join('');
  const picker = names.map(n => `<button type="button" class="${n === X ? P('on') : ''} ${state.villa.includes(n) ? '' : P('gone')}" data-n="${esc(n)}" title="${esc(n)}" onclick="pmPick(this)">${mini(n)}</button>`).join('');
  return `<div class="${P('picker')}">${picker}</div>
    <div class="${P('relhead')}">${mini(X)}<div><b>${esc(X)}</b>
    <span>${state.villa.includes(X) ? partner ? `Coupled with ${esc(partner)}` : 'Single' : 'Not in the villa'} · ${others.length} with a story</span></div></div>
    ${rows || `<p class="${P('rest')}">Nobody yet.</p>`}`;
}

/** The whole sidebar at click `upto` of screen `si`. */
export function asideHtml(row, prev, screens, si, upto, sel = null) {
  const names = castOfEpisode(row, prev);
  const state = villaAt(row, prev, screens, si, upto);
  const last = si === screens.length - 1 && upto >= screens[si].steps.length - 1;
  const { rel, labels } = feelingsAt(row, prev, last);
  const pick = sel && names.includes(sel) ? sel : null;
  const shown = pick || state.villa.slice().sort()[0] || names[0];
  return `<div class="${P('panel')}"><h3>Heart map</h3><p class="${P('note')}">${last ? 'How the villa ends the episode.'
    : 'How the villa stood at the start of the episode, and every coupling and dumping clicked so far.'} You see everything; the villa doesn't.</p>
    ${mapSvg(names, state, rel, pick)}
    <div class="${P('legend')}"><span><i style="border-color:#ff2e88"></i>Coupled</span><span><i style="border-color:#ff4fa0;border-top-width:2px"></i>Fancies →</span>
      <span><i style="border-color:#a855f7;border-top-style:dotted"></i>Hidden crush →</span><span><i style="border-color:#ef4444;border-top-style:dotted"></i>Rivals</span>
      <span><i style="border-color:#f59e0b;border-top-style:dashed"></i>On the rocks</span></div></div>
    <div class="${P('panel')}"><h3>Relationships</h3><p class="${P('note')}">Pick anyone, here or on the map.</p>${relPanel(names, state, rel, labels, shown)}</div>`;
}
