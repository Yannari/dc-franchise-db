// What the house has already heard this week, line for line.
//
// Every event file picks its wording with its own small hash — deterministic,
// so a seeded season replays exactly — and none of them could see what the
// others had already printed. The same event re-firing on the same pair in a
// later stretch of the week hashed to the same sentence a quarter of the time,
// and a played season carried about twenty lines printed two, three and four
// times inside one week. The pick still starts where the hash says; it just
// steps past anything already said this week.
import { gs } from '../core.js';

const byRoot = new WeakMap();

function airedFor(week) {
  const root = gs?.bb || gs;
  if (!root || typeof root !== 'object') return new Set();
  let weeks = byRoot.get(root);
  if (!weeks) { weeks = new Map(); byRoot.set(root, weeks); }
  const key = Number(week) || 0;
  if (!weeks.has(key)) {
    // Only the current week matters; older weeks are dropped as they pass.
    for (const k of weeks.keys()) if (k < key - 1) weeks.delete(k);
    weeks.set(key, new Set());
  }
  return weeks.get(key);
}

/** Record a line that just aired. */
export function markAired(week, text) {
  if (typeof text === 'string' && text) airedFor(week).add(text);
}

/** The hashed pick, stepped past anything already said this week. */
export function freshLine(list, hash, ctx) {
  const n = list?.length || 0;
  if (!n) return undefined;
  const aired = airedFor(ctx?.week?.num);
  for (let k = 0; k < n; k++) {
    const line = list[(hash + k) % n];
    if (typeof line !== 'string' || !aired.has(line)) return line;
  }
  return list[hash % n];
}
