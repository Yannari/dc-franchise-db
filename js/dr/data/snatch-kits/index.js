// ══════════════════════════════════════════════════════════════════════
// dr/data/snatch-kits — what each celebrity actually SAYS on the panel
// ══════════════════════════════════════════════════════════════════════
//
// One kit per character in js/dr/data/snatch-characters.js, keyed by its id:
//
//   catch   her catchphrase. The flat and dying answers fall back on it —
//           a queen with nothing else says the catchphrase again.
//   intro   what she says when the host introduces the panel.
//   heckle  what she says ABOUT another celebrity on the panel. {b} is that
//           celebrity's name.
//   a       her answer to each question in js/dr/data/snatch-script.js, by
//           question id: [card, say]. `card` fills the blank and must read
//           as a sentence with it; `say` is what she says out loud.
//
// These are the GOOD answers. A queen who is only managing a flat or a dead
// round never gets one: she reaches for the obvious answer instead, which is
// the whole joke of the format.
//
// THE RULE FOR EVERY LINE (the user's, 2026-09-30): plain, fluent English, a
// setup and a punchline, and the punchline rests on something everybody
// knows about her. Nothing that needs a second read.
import divas from './divas.js';
import pop from './pop.js';
import talk from './talk.js';
import screen from './screen.js';
import fashion from './fashion.js';
import reality from './reality.js';
import spooky from './spooky.js';
import stage from './stage.js';
import podium from './podium.js';

export const SNATCH_KITS = { ...divas, ...pop, ...talk, ...screen, ...fashion, ...reality, ...spooky, ...stage, ...podium };

export const kitFor = id => SNATCH_KITS[id] || null;
