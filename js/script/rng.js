// ══════════════════════════════════════════════════════════════════════
// script/rng.js — a roll that depends on who and when, and on nothing else (shared)
// ══════════════════════════════════════════════════════════════════════
//
// Lifted out of js/bb/knowledge.js so every show's script layer can pick its
// words without touching the engine's dice. A season is driven by a SEEDED
// generator; an extra draw from it for wording would shift every roll after
// it, and the same seed would stop producing the same season. Words drawn
// from this stream instead depend only on the keys handed in.
export function stableRng(...parts) {
  let seed = 2166136261;
  const key = parts.join('|');
  for (let i = 0; i < key.length; i++) seed = Math.imul(seed ^ key.charCodeAt(i), 16777619);
  seed >>>= 0;
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
