// The Challenge's voice overlay, every batch together. Each batch is
// { entryId: { turnIndex: { tag | family: line | [lines] } } }; a later batch adds to an earlier one,
// and when two batches voice the same tag on the same turn their alternatives join one list.
import batch1 from './batch1.js';
import batch2 from './batch2.js';
import batch3 from './batch3.js';
import batch4 from './batch4.js';
import batch5 from './batch5.js';
import batch6 from './batch6.js';

const BATCHES = [batch1, batch2, batch3, batch4, batch5, batch6];

export function joinVariants(a, b) {
  if (a == null) return b;
  if (b == null) return a;
  return [...new Set([...[a].flat(), ...[b].flat()])];
}

const VOICES = {};
for (const b of BATCHES) {
  for (const [id, turns] of Object.entries(b)) {
    VOICES[id] ||= {};
    for (const [i, vs] of Object.entries(turns)) {
      const into = (VOICES[id][i] ||= {});
      for (const [tag, line] of Object.entries(vs)) into[tag] = joinVariants(into[tag], line);
    }
  }
}
export default VOICES;
