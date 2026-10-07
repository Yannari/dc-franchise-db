// ══════════════════════════════════════════════════════════════════════
// bb/line-memory.js — the finale does not say the same thing every season
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "closing statements are also repetitive, same for the final cut". Those
// moments happen once a season, so a season never repeats itself; the viewer, who plays season
// after season, hears the same speech every finale. This remembers, in the viewer's own browser,
// which lines of the finale they have already heard (by shape: names, pronouns and counts blanked),
// and a pick prefers one they have not.
//
// Words only. A pick is chosen by a hash of its salt, never by the season's dice, so nothing a
// season decides depends on what a viewer has seen; only which sentence says it.

import { players } from '../core.js';

const KEY = 'bb-seen-finale-lines';
const MAX = 600;
let seen = null;

const PRONOUN = /\b(he|she|they|him|her|them|his|hers|their|theirs|himself|herself|themselves)\b/gi;
const NUMBER = /\b(no|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|once|twice|\d+)\b/gi;
let nameRe = null, nameKey = '';
export function shapeOf(text) {
  const names = (players || []).map(p => p?.name).filter(Boolean);
  const key = names.join('|');
  if (key !== nameKey) {
    nameKey = key;
    nameRe = names.length ? new RegExp('(' + names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|') + ')', 'g') : null;
  }
  return String(text).replace(nameRe || /$^/, 'X').replace(PRONOUN, 'P').replace(NUMBER, 'N');
}

function seenSet() {
  if (seen) return seen;
  try { seen = new Set(JSON.parse(globalThis.localStorage?.getItem(KEY) || '[]')); } catch { seen = new Set(); }
  return seen;
}
function note(shape) {
  const s = seenSet();
  s.delete(shape); s.add(shape);
  try {
    if (!globalThis.localStorage) return;
    const list = [...s].slice(-MAX);
    seen = new Set(list);
    globalThis.localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* a convenience, never required */ }
}
const hash = salt => { let h = 2166136261; for (const ch of String(salt)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };

/**
 * One of `list` (already-written strings), preferring a line this viewer has not heard and
 * never one in `avoid` (a Set of shapes already used tonight, which it adds to).
 */
export function freshPick(list, salt, avoid = null) {
  const items = (list || []).filter(Boolean);
  if (!items.length) return '';
  const shapes = items.map(shapeOf);
  const s = seenSet();
  const tier = i => (avoid?.has(shapes[i]) ? 2 : 0) + (s.has(shapes[i]) ? 1 : 0);
  const best = Math.min(...items.map((_, i) => tier(i)));
  const from = items.map((_, i) => i).filter(i => tier(i) === best);
  const i = from[hash(salt) % from.length];
  note(shapes[i]);
  avoid?.add(shapes[i]);
  return items[i];
}
