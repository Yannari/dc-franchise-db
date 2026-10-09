// ══════════════════════════════════════════════════════════════════════
// td/story/lines/voices/index.js — the voice overlay, every batch together
// ══════════════════════════════════════════════════════════════════════
// Each batch is { entryId: { turnIndex: { tag: line } } }; a later batch adds to an earlier one.
import batch1 from './batch1.js';
import batch2 from './batch2.js';
import batch3 from './batch3.js';
import batch4 from './batch4.js';
import batch5 from './batch5.js';
import batch6 from './batch6.js';
import batch7 from './batch7.js';
import batch8 from './batch8.js';
import batch9 from './batch9.js';
import batch10 from './batch10.js';
import batch11 from './batch11.js';
import batch12 from './batch12.js';
import batch13 from './batch13.js';
import batch14 from './batch14.js';
import batch15 from './batch15.js';
import batch16 from './batch16.js';
import batch17 from './batch17.js';
import batch18 from './batch18.js';
import batch19 from './batch19.js';
import batch20 from './batch20.js';

const BATCHES = [batch1, batch2, batch3, batch4, batch5, batch6, batch7, batch8, batch9, batch10, batch11, batch12, batch13, batch14, batch15, batch16, batch17, batch18, batch19, batch20];
const VOICES = {};
for (const b of BATCHES) for (const [id, turns] of Object.entries(b)) {
  VOICES[id] ||= {};
  for (const [i, tags] of Object.entries(turns)) VOICES[id][i] = { ...(VOICES[id][i] || {}), ...tags };
}
export default VOICES;
