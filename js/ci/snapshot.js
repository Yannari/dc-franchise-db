// ══════════════════════════════════════════════════════════════════════
// ci/snapshot.js — the room at the end of an episode, kept on the row
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-10-01): "a web tab at the end of each episode to see the
// relationship of each person ... the alliances ... movement compared to last
// episode"; "fill Debug too". The screens never read the engine's state
// (vp-ci reads rows), so the numbers that matter are copied here once a day:
//   people     every profile still in, and who left today
//   rel        "a>b": [affection, attraction, resentment, trust], one way
//   mind       each profile's feelings (mind.js MIND_KEYS)
//   beliefs    "a>b": [real, threat] — what a thinks of b
//   public     approval and fame (public.js, handed in by season.js: the only
//              file that may read the audience)
//   alliances  name, members, status, founder, plan
//   pacts      who promised what to whom, and whether it was kept
//   history    "a|b": how long they have known each other, 0..1
// Rounded and only the pairs still in: a season of rows stays small.
import { rel, familiarity } from './state.js';
import { MIND_KEYS, mood } from './mind.js';
import { belief } from './beliefs.js';

// `|| 0`: no -0 (JSON turns it into 0, and a saved season must read back equal).
const r1 = v => Math.round((Number(v) || 0) * 10) / 10 || 0;
const r2 = v => Math.round((Number(v) || 0) * 100) / 100 || 0;

export function snapshotEnd(state, pub = {}) {
  const people = [...state.active];
  const leftToday = state.blocked.filter(b => b.day === state.day).map(b => b.handle);
  const relOut = {}, beliefs = {}, history = {};
  for (const a of people) for (const b of people) {
    if (a === b) continue;
    relOut[`${a}>${b}`] = ['affection', 'attraction', 'resentment', 'trust'].map(d => r1(rel(a, b, d)));
    const bl = belief(state, a, b);
    beliefs[`${a}>${b}`] = [r2(bl.real ?? 1), r1(bl.threat)];
    if (a < b) history[`${a}|${b}`] = r2(familiarity(state, a, b));
  }
  const mind = Object.fromEntries(people.map(h => [h, Object.fromEntries(MIND_KEYS.map(k => [k, r1(mood(state, h, k))]))]));
  return {
    day: state.day, people, leftToday,
    rel: relOut, beliefs, history, mind,
    public: pub,
    alliances: (state.alliances || []).map(a => ({ id: a.id, name: a.name, members: [...a.members], status: a.status,
      founder: a.founder, day: a.day, plan: a.plan ? { ...a.plan } : null, brokenBy: a.brokenBy ? [...a.brokenBy] : null })),
    pacts: (state.pacts || []).map(p => ({ kind: p.kind, a: p.a, b: p.b, day: p.day, kept: (p.kept || []).map(k => k.kept) })),
    jealous: (state.jealous || []).filter(j => j.day === state.day).map(j => ({ ...j })),
  };
}
