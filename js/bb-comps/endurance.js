// ══════════════════════════════════════════════════════════════════════
// bb-comps/endurance.js — the ones that end when people let go
// ══════════════════════════════════════════════════════════════════════
//
// Endurance competitions are the format's signature: everybody starts, nobody
// finishes quickly, and the story is the order people drop. That order is the
// narration — the early casualty, the one who was clearly beaten an hour before
// admitting it, the two who end up alone out there staring at each other.
//
// Both of them outgrew this file. Each now runs its own night rather than
// taking one scored roll and printing drop lines over it, and each has a screen
// built out of its own subject, so each has a file:
//
//   · hold-the-line.js — a rope against a winch that only ever pulls harder,
//     and the only competition in the library with ground you can take BACK.
//   · cold-comfort.js  — the overnight one, where nobody is eliminated and
//     everybody who loses it decides to.
//
// This stays as the shelf the two of them sit on. `ENDURANCE_COMPS` is what
// index.js imports, and the names they were exported under before they had
// files of their own still resolve, so nothing that reached for `pressureWall`
// or `coldSoak` had to change.

import { holdTheLine } from './hold-the-line.js';
import { coldComfort } from './cold-comfort.js';

export const ENDURANCE_COMPS = [holdTheLine, coldComfort];

export { holdTheLine, coldComfort };
export { holdTheLine as pressureWall, coldComfort as coldSoak };
