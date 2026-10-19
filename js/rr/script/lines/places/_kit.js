// Helpers for a place's own lines (js/rr/script/lines/places/*.js).
// V: a spoken line with its five voice variants. mergePools: sections with the same pool keys, joined.
export const V = (say, sharp, dry, loud, soft, odd) => ({ say, v: { sharp, dry, loud, soft, odd } });

export function mergePools(...parts) {
  const out = {};
  for (const part of parts) for (const [k, list] of Object.entries(part)) (out[k] ||= []).push(...list);
  return out;
}
