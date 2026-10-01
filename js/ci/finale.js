// ══════════════════════════════════════════════════════════════════════
// ci/finale.js — the last day (spec §15)
// ══════════════════════════════════════════════════════════════════════
//
// "Before the winner is revealed, you are invited to one last Circle Chat."
// Then the final ratings ("strategically or with their hearts"), then the
// finalists meet one by one — each arrival reveals the truth to everyone
// already in the room — then placements. A tie goes to whoever had the most
// first places across the whole season (UK 3: Natalya over Manrika). The
// studio, the receipts tape and the reveal from fifth to first are screens
// (Plan 5) built from these records.
import { addScene, peopleOf } from './state.js';
import { revealTo } from './reveal.js';
import { runCircleChat } from './feed.js';
import { runRating } from './ratings.js';

export function finalDay(state, rng) {
  runCircleChat(state, rng, { final: true, when: 'evening' });
  return runRating(state, rng, { final: true });
}

export function placementsOf(state, finalRow) {
  return [...finalRow.results]
    .sort((a, b) => a.avg - b.avg
      || (state.firstPlaces[b.profile] || 0) - (state.firstPlaces[a.profile] || 0)
      || (a.profile < b.profile ? -1 : 1))
    .map((r, i) => ({ profile: r.profile, people: [...peopleOf(state, r.profile)], place: i + 1, avg: r.avg }));
}

export function finaleDay(state, rng, finalRow) {
  const order = state.active.map(h => [h, rng()]).sort((a, b) => a[1] - b[1]).map(([h]) => h);
  const present = [];
  for (const h of order) {
    const sc = addScene(state, 'meet', [h, ...present], { arrives: h }, [h, ...present]);
    for (const p of present) { revealTo(state, p, h, sc); revealTo(state, h, p, sc); }
    present.push(h);
  }
  const placements = placementsOf(state, finalRow);
  addScene(state, 'reveal', [...state.active], { placements }, [...state.active]);
  return { placements, winner: placements[0] };
}
