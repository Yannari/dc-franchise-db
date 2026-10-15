// The Challenge's line pools, by family. Each file exports { '<kind>.<ending>': [entries] }.
// The voice overlay (voices/*.js) adds variants to existing turns, by entry id and turn index:
// { entryId: { turnIndex: { tag | family: line | [lines] } } }. A turn's own v joins the overlay's, its own first.
import spine from './spine.js';
import vote from './vote.js';
import house from './house.js';
import game from './game.js';
import final from './final.js';
import story from './story.js';
import places from './places.js';
import campaign from './campaign.js';
import VOICES, { joinVariants } from './voices/index.js';
import LONGER from './longer/index.js';

export const POOLS = Object.assign({}, spine, vote, house, game, final, story, places, campaign);

for (const list of Object.values(POOLS)) {
  for (const e of list) {
    const over = VOICES[e.id];
    if (!over) continue;
    for (const [i, vs] of Object.entries(over)) {
      const t = e.turns[Number(i)];
      if (!t || t.beat || t.by === 'tj') continue;
      const own = t.v || {};
      t.v = { ...vs };
      for (const [tag, line] of Object.entries(own)) t.v[tag] = joinVariants(line, vs[tag]);
    }
  }
}

// The long cut (the user, 2026-10-15: the conversations are "too expeditive... two seconds they talk, then
// they switch"). An entry with a spec in longer/ is rebuilt AFTER the voices join it: a number is the
// original turn, its voice variants with it; an object is a new turn. So a conversation grows in the
// middle as well as at the end, and nothing the overlay wrote moves to the wrong line.
for (const list of Object.values(POOLS)) {
  for (const e of list) {
    const spec = LONGER[e.id];
    if (!spec) continue;
    const old = e.turns;
    e.turns = spec.map(x => (typeof x === 'number' ? old[x] : x));
    Object.defineProperty(e, 'origTurns', { value: old.length });   // for the guard: every original turn is kept
  }
}
export { LONGER };
