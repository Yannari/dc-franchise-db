// The scene registry, with no imports so the family files can load it first
// (scenes.js imports the families; the families import this).
export const SCENES = {};

export const pairKey = (a, b) => [a, b].sort().join('|');

// K({ id, family, cast, moments, when, scheme, endings: { name: { w, fx } }, next })
export function K(def) {
  const endings = Object.keys(def.endings);
  return { cast: 'team', moments: [], when: () => 1, ...def, endings, _endings: def.endings };
}

export function register(kinds) { for (const k of kinds) SCENES[k.id] = k; }
