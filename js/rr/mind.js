// ══════════════════════════════════════════════════════════════════════
// rr/mind.js — energy, morale and stress (spec §7.3)
// ══════════════════════════════════════════════════════════════════════
const clamp = v => Math.max(0, Math.min(100, v));
const people = (state, id) => [state.teams[id].a, state.teams[id].b];

// Time on the course drains energy and lets stress settle a little.
export function tick(state, id, minutes) {
  for (const n of people(state, id)) {
    const m = state.mind[n];
    m.energy = clamp(m.energy - minutes / 30);
    m.stress = clamp(m.stress - minutes / 60);
  }
}

// The Chill Zone's rest period.
export function rest(state) {
  for (const id of state.order) for (const n of people(state, id)) {
    const m = state.mind[n];
    m.energy = clamp(m.energy + 60);
    m.stress = clamp(m.stress - 20);
  }
}

// How far behind a team believes it is (knowledge.js perceivedRank), 0..1.
export function behind(state, id, howFar) {
  for (const n of people(state, id)) state.mind[n].stress = clamp(state.mind[n].stress + 10 * howFar);
}

export function nudgeMind(state, name, key, d) {
  if (!state.mind[name]) return;
  state.mind[name][key] = clamp(state.mind[name][key] + d);
}
