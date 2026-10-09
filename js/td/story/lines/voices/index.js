// ══════════════════════════════════════════════════════════════════════
// td/story/lines/voices/index.js — the voice overlay, every batch together
// ══════════════════════════════════════════════════════════════════════
// Each batch is { entryId: { turnIndex: { tag: line } } }; a later batch adds to an earlier one.
import batch1 from './batch1.js';

const BATCHES = [batch1];
const VOICES = {};
for (const b of BATCHES) for (const [id, turns] of Object.entries(b)) {
  VOICES[id] ||= {};
  for (const [i, tags] of Object.entries(turns)) VOICES[id][i] = { ...(VOICES[id][i] || {}), ...tags };
}
export default VOICES;
