// ══════════════════════════════════════════════════════════════════════
// ci/arrivals.js — "A new Player has entered The Circle." (spec §12)
// ══════════════════════════════════════════════════════════════════════
//
// Plan 1 plays ONE entry format, the first the show used: the newcomer builds
// a profile, secretly watches Circle Chat, then invites one player to a
// private after-party (US 1 Ep 2, Miranda). The other entry formats of spec
// §12.2 are timeline cards in Plan 3. A newcomer is immune at their first
// blocking; whether they rate or are rated follows the season's newcomer rule.
import { rel, bump, addScene } from './state.js';
import { initMind, feel } from './mind.js';

export function arrive(state, rng, handles) {
  for (const h of handles) {
    state.active.push(h);
    state.joinedDay[h] = state.day;
    state.immuneNext[h] = true;
    state.unratedNext[h] = true;
    initMind(state, h);
    addScene(state, 'arrival', [h], { entry: 'snoop' }, [...state.active]);
    const others = state.active.filter(o => o !== h);
    const pick = others
      .map(o => [o, (state.likesCount[o] || 0) + rel(h, o, 'attraction') * 0.3 + rng() * 2])
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!pick) continue;
    addScene(state, 'after-party', [h, pick], { chosen: pick });
    bump(h, pick, 'affection', 1.5);
    bump(pick, h, 'affection', 1.5);
    bump(pick, h, 'trust', 0.5);
    feel(state, pick, 'elation', 1);
    for (const o of others) if (o !== pick) feel(state, o, 'paranoia', 0.3);
  }
}
