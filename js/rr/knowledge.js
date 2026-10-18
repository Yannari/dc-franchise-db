// ══════════════════════════════════════════════════════════════════════
// rr/knowledge.js — what each team has seen, and what each person believes
// ══════════════════════════════════════════════════════════════════════
//
// Spec §6, "what teams know": a team knows only what it has seen this leg (who was
// ahead at the last place, who was on the same flight, who passed them). That
// perceived position drives their choices. A belief belongs to the people who heard
// it, so a partner who wasn't there doesn't know; a lie is kept as untrue.
export function see(state, a, b, leg, t, where, aAhead) {
  (state.seen[a] ||= {})[b] = { leg, t, where, ahead: !!aAhead };
  (state.seen[b] ||= {})[a] = { leg, t, where, ahead: !aAhead };
}

// 0 = believes it is first, 1 = believes it is last. Teams not seen this leg count half.
export function perceivedRank(state, id) {
  const others = state.order.filter(x => x !== id);
  if (!others.length) return 0;
  let ahead = 0;
  for (const o of others) {
    const s = state.seen[id]?.[o];
    if (!s || s.leg !== state.leg) ahead += 0.5;
    else if (!s.ahead) ahead += 1;
  }
  return ahead / others.length;
}

export function believe(state, people, belief) {
  state.beliefs ||= {};
  for (const n of people) (state.beliefs[n] ||= []).push({ ...belief });
}

export function beliefOf(state, name, about, claim) {
  const list = state.beliefs?.[name] || [];
  for (let i = list.length - 1; i >= 0; i--) if (list[i].about === about && list[i].claim === claim) return list[i];
  return null;
}
