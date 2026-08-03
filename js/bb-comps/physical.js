// ══════════════════════════════════════════════════════════════════════
// bb-comps/physical.js — the backyard competitions
// ══════════════════════════════════════════════════════════════════════
//
// Both competitions that used to be written inline here have been rebuilt
// around the real recurring formats they were imitating, and each is now large
// enough to own a file:
//
//   Slip Shift  → Slippery Slope  (13 seasons; greased lanes, scoop and pour,
//                 and the small container you can quit the competition for)
//   Long Roll   → Bowlerina       (5 seasons; spin on the bars, wait for the
//                 barrier, roll at the pins, do it again)
//
// Both keep their original ids, so the picker, the season schedule and every
// pinned week still resolve. This file is now the category index and nothing
// else — which is the right size for it.

export { slipperySlope } from './slippery-slope.js';
export { bowlerina } from './bowlerina.js';

import { slipperySlope } from './slippery-slope.js';
import { bowlerina } from './bowlerina.js';

export const PHYSICAL_COMPS = [slipperySlope, bowlerina];
