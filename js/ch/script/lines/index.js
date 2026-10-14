// The Challenge's line pools, by family. Each file exports { '<kind>.<ending>': [entries] }.
// The voice overlay (voices/*.js) adds variants to existing turns, by entry id and turn index:
// { entryId: { turnIndex: { tag | family: line | [lines] } } }. A turn's own v joins the overlay's, its own first.
import spine from './spine.js';
import vote from './vote.js';
import house from './house.js';
import game from './game.js';
import final from './final.js';
import story from './story.js';
import VOICES, { joinVariants } from './voices/index.js';

export const POOLS = Object.assign({}, spine, vote, house, game, final, story);

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
