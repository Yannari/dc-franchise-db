// ══════════════════════════════════════════════════════════════════════
// rr/types.js — the twelve task types and their stat blends
// ══════════════════════════════════════════════════════════════════════
//
// docs/ridonculous-race-identities.md, "Temperament is volatility, not grit": in
// pressure types temperament sets the SPREAD (spreadOf in skill.js), never the
// level; it is part of the level only where steadiness IS the job (hands,
// patience). The Big Brother library's standing correction, js/bb-comps/_shared.js.
export const TASK_TYPES = {
  water: { level: { physical: 0.45, endurance: 0.40, boldness: 0.15 }, spread: true },
  heights: { level: { boldness: 0.60, physical: 0.40 }, spread: true },
  strength: { level: { physical: 0.60, endurance: 0.40 }, spread: false },
  stomach: { level: { endurance: 0.55, boldness: 0.45 }, spread: true },
  nerve: { level: { boldness: 0.70, endurance: 0.30 }, spread: true },
  brains: { level: { mental: 0.70, intuition: 0.30 }, spread: false },
  search: { level: { intuition: 0.50, endurance: 0.30, mental: 0.20 }, spread: true },
  perform: { level: { social: 0.50, boldness: 0.50 }, spread: false },
  people: { level: { social: 0.60, strategic: 0.20, intuition: 0.20 }, spread: true },
  travel: { level: { mental: 0.40, intuition: 0.40, strategic: 0.20 }, spread: false },
  hands: { level: { mental: 0.30, physical: 0.30, intuition: 0.20, temperament: 0.20 }, spread: false },
  patience: { level: { temperament: 0.50, endurance: 0.30, mental: 0.20 }, spread: false },
};
