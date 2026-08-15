// ══════════════════════════════════════════════════════════════════════
// bb-comps/luck.js — the ones nobody can plan around
// ══════════════════════════════════════════════════════════════════════
//
// A crapshoot is a real Big Brother competition type, not a failure of design,
// and leaving it out would make the house far too predictable. Every so often
// the power lands on whoever it lands on: the floater who has not won anything,
// the nominee who was already packing, the person the entire house had agreed
// to keep weak.
//
// Pure Chance outgrew this file when it stopped rolling every ball in one loop
// and started dropping them one at a time against a standing number. It kept
// its id (`bb-luck-draw`), it kept `pureChance: true`, and it still has no stat
// profile of any kind — see the header of pure-chance.js for why that is a
// commitment rather than a gap.

import { pureChance } from './pure-chance.js';

export const LUCK_COMPS = [pureChance];

export { pureChance };
/** The name it was exported under before it had a file of its own. */
export { pureChance as theDraw };
