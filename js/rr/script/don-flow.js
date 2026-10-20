// How Don talks (the user, 2026-10-20: "speak with actual sentence not cut bs like its warm in here and stop there, if u
// want to do comedy dont start with the punchline"). A Don line is real sentences: a clipped fragment is allowed once,
// and only as the punchline at the end, after its setup. An exclamation or a question is a whole thing to say ("Go!",
// "Welcome to Rock North!"), so it isn't a fragment.
const words = s => s.replace(/\{[^}]+\}/g, 'X').split(/\s+/).filter(Boolean).length;
export const sentencesOf = text => String(text).split(/(?<=[.!?…])\s+(?=[A-Z{("'])/).filter(Boolean);
const fragment = s => words(s) <= 4 && !/[!?]["')]*$/.test(s.trim());

/** Why a Don line doesn't flow, or null: stacked fragments, or a fragment before its setup. */
export function donFlowProblem(text) {
  const ss = sentencesOf(text);
  if (ss.length < 2) return null;
  const f = ss.map(fragment);
  const n = f.filter(Boolean).length;
  if (n >= 2) return 'stacked fragments';
  if (n === 1 && !f[f.length - 1]) return 'a fragment before its setup';
  return null;
}
