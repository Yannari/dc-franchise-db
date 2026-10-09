// ══════════════════════════════════════════════════════════════════════
// td/story/lines/voices/index.js — the voice overlay, every batch together
// ══════════════════════════════════════════════════════════════════════
// Each batch is { entryId: { turnIndex: { tag: line } } }; a later batch adds to an earlier one.
import batch1 from './batch1.js';
import batch2 from './batch2.js';
import batch3 from './batch3.js';
import batch4 from './batch4.js';
import batch5 from './batch5.js';

const BATCHES = [batch1, batch2, batch3, batch4, batch5];
const VOICES = {};
for (const b of BATCHES) for (const [id, turns] of Object.entries(b)) {
  VOICES[id] ||= {};
  for (const [i, tags] of Object.entries(turns)) VOICES[id][i] = { ...(VOICES[id][i] || {}), ...tags };
}
export default VOICES;
