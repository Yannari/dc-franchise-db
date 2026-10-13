// ══════════════════════════════════════════════════════════════════════
// td/story/commit.js — a scene proposed is not a scene aired
// ══════════════════════════════════════════════════════════════════════
// The director's pacing plan (2026-10-12, stage 2): every story builder proposes a scene, and only the scenes the
// director takes may change the story's state. A builder that marks its setup done, takes a kit line, moves an
// arc a step or books a person for the day does it here, on the candidate, instead of while it is still only a
// proposal; the director runs those changes when it accepts the scene (director.js accept). A candidate that is
// never accepted changes nothing, so a callback cut for room is still there to be told another day.
//
// The changes are kept beside the candidate, not on it: the scene is saved with the episode, and a function on it
// would be dropped by JSON anyway; kept here, the saved scene is exactly what it was.
const PENDING = new WeakMap();

/** Run fn when the director accepts this candidate (a scene item, or the writer's result it is built from). */
export function onCommit(candidate, fn) {
  if (!candidate || typeof fn !== 'function') return candidate;
  if (globalThis.__tdCommitStats) globalThis.__tdCommitStats.proposed++;
  const list = PENDING.get(candidate);
  if (list) list.push(fn); else PENDING.set(candidate, [fn]);
  return candidate;
}

/** Move what is waiting on `from` (the writer's result) to `to` (the scene built from it). Returns `to`. */
export function adopt(to, from) {
  const list = from && PENDING.get(from);
  if (!list || !to || to === from) return to;
  PENDING.delete(from);
  const into = PENDING.get(to);
  if (into) into.push(...list); else PENDING.set(to, [...list]);
  return to;
}

// What a proposal holds while the director decides (stage 3): an engine moment a proposal claims is marked aired at
// once, so no other system proposes the same moment the same day, and a proposal that is dropped gives it back.
const RELEASE = new WeakMap();

/** Run fn if the director drops this candidate (it gives back what proposing it claimed). */
export function onDiscard(candidate, fn) {
  if (!candidate || typeof fn !== 'function') return candidate;
  const list = RELEASE.get(candidate);
  if (list) list.push(fn); else RELEASE.set(candidate, [fn]);
  return candidate;
}

/** Accept a candidate: its changes happen now, once. */
export function commit(candidate) {
  if (candidate) RELEASE.delete(candidate);
  const list = candidate && PENDING.get(candidate);
  if (!list) return candidate;
  PENDING.delete(candidate);
  if (globalThis.__tdCommitStats) globalThis.__tdCommitStats.committed += list.length;
  for (const fn of list) fn();
  return candidate;
}

/** Drop a candidate: nothing it would have changed happens, and what it claimed is given back. */
export function discard(candidate) {
  if (!candidate) return;
  PENDING.delete(candidate);
  const back = RELEASE.get(candidate);
  RELEASE.delete(candidate);
  if (back) for (const fn of back.reverse()) fn();
}

export const pending = candidate => !!candidate && (PENDING.has(candidate) || RELEASE.has(candidate));
