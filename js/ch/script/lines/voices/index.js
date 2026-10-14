// The Challenge's voice overlay, every batch together. Each batch is
// { entryId: { turnIndex: { tag | family: line | [lines] } } }; a later batch adds to an earlier one.
import batch1 from './batch1.js';
import batch2 from './batch2.js';
import batch3 from './batch3.js';

const BATCHES = [batch1, batch2, batch3];

const VOICES = {};
for (const b of BATCHES) {
  for (const [id, turns] of Object.entries(b)) {
    VOICES[id] ||= {};
    for (const [i, vs] of Object.entries(turns)) VOICES[id][i] = { ...(VOICES[id][i] || {}), ...vs };
  }
}
export default VOICES;
