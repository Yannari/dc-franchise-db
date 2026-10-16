// The Challenge's line pools, by family. Each file exports { '<kind>.<ending>': [entries] }.
// The voice overlay (voices/*.js) adds variants to existing turns, by entry id and turn index:
// { entryId: { turnIndex: { tag | family: line | [lines] } } }. A turn's own v joins the overlay's, its own first.
import spine from './spine.js';
import vote from './vote.js';
import house from './house.js';
import game from './game.js';
import final from './final.js';
import story from './story.js';
import places from './places.js';
import campaign from './campaign.js';
import stakes from './stakes.js';
import twists from './twists.js';
import payback from './payback.js';
import goodbye from './goodbye.js';
import named from './named.js';
import cruel from './cruel.js';
import quitLines from './quit.js';
import medevacLines from './medevac.js';
import championLines from './champion.js';
import wishLines from './wishlist.js';
import lateLines from './late.js';
import VOICES, { joinVariants } from './voices/index.js';
import LONGER from './longer/index.js';
import EXTRA from './extra/index.js';
import FINAL1 from './voices/final1.js';
import FINAL2 from './voices/final2.js';
import FINAL3 from './voices/final3.js';
import FINAL4 from './voices/final4.js';
import FINAL5 from './voices/final5.js';
import FINAL6 from './voices/final6.js';
import FINAL7 from './voices/final7.js';
import FINAL8 from './voices/final8.js';
import FINAL9 from './voices/final9.js';

export const POOLS = Object.assign({}, spine, vote, house, game, final, story, places, campaign, stakes, twists, goodbye, named, cruel, quitLines, medevacLines, championLines, wishLines, lateLines);

// more entries for the same pools, appended (never a replacement: a key here adds to the pool)
// (payback.js adds to pools other files own: appended, like the extras)
for (const more of [...EXTRA, payback]) for (const [k, list] of Object.entries(more)) (POOLS[k] ||= []).push(...list);

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

// The long cut (the user, 2026-10-15: the conversations are "too expeditive... two seconds they talk, then
// they switch"). An entry with a spec in longer/ is rebuilt AFTER the voices join it: a number is the
// original turn, its voice variants with it; an object is a new turn. So a conversation grows in the
// middle as well as at the end, and nothing the overlay wrote moves to the wrong line.
for (const list of Object.values(POOLS)) {
  for (const e of list) {
    const spec = LONGER[e.id];
    if (!spec) continue;
    const old = e.turns;
    e.turns = spec.map(x => (typeof x === 'number' ? old[x] : x));
    Object.defineProperty(e, 'origTurns', { value: old.length });   // for the guard: every original turn is kept
  }
}
// Voices keyed by the FINAL turn index, applied after the long cut (voices/final*.js): a turn the long cut wrote
// can carry voices too, and an index never drifts because the entry is already in its final shape.
export const FINAL_VOICES = [FINAL1, FINAL2, FINAL3, FINAL4, FINAL5, FINAL6, FINAL7, FINAL8, FINAL9];
for (const list of Object.values(POOLS)) {
  for (const e of list) {
    for (const batch of FINAL_VOICES) {
      const over = batch[e.id];
      if (!over) continue;
      for (const [i, vs] of Object.entries(over)) {
        const t = e.turns[Number(i)];
        if (!t || t.beat || t.by === 'tj') continue;
        const own = t.v || {};
        t.v = { ...own };
        for (const [tag, line] of Object.entries(vs)) t.v[tag] = joinVariants(own[tag], line);
      }
    }
  }
}

// ── the quality gate (the user, 2026-10-16: "why does it sound badly translated from another language") ──
// The voice bug fixed that day (write.js voicedOnce) meant ten thousand variants had never aired, and nobody had
// read them in a conversation. Three kinds read as bad translation, and a variant that fails goes; the line as
// written, which always fits the turns around it, speaks instead:
//   shouted fragments   three sentences or more, two of them three-word shouts ("You and me! Final! Together!")
//   meaning dropped     under 45% of a line of ten words or more ("I needed that." for a confessional's reason)
//   stock               a line of five words or more pasted onto three different turns outside the ballots: it
//                       was not written for this conversation, and the reply after it was
//   nameless            the line says who (somebody other than the speaker) and the variant names nobody: "I
//                       saw {b} and {c} in the gym with the door shut" became "I wish I hadn't seen it", and the
//                       scene was about nothing (read 2026-10-16)
const words = s => String(s).replace(/\{[^}]+\}/g, 'X').split(/\s+/).filter(Boolean).length;
const sentences = s => String(s).split(/(?<=[.!?])\s+/).filter(Boolean);
const stockUse = {};
for (const [k, list] of Object.entries(POOLS)) {
  if (k.startsWith('ballot')) continue;
  for (const e of list) e.turns.forEach((t, i) => { for (const vs of Object.values(t.v || {})) for (const v of [vs].flat()) (stockUse[v] ||= new Set()).add(`${e.id}:${i}`); });
}
const namesIn = (s, by) => new Set([...String(s).matchAll(/\{(\w+)(?:\.\w+)?\}/g)].map(m => m[1]).filter(n => n !== by));
export function variantFails(v, base, stock = 0, by = null) {
  const ss = sentences(v);
  // a name said only to address somebody ("Thanks, {b}.") is not what the line is about
  const named = namesIn(String(base).replace(/^\{\w+\}[,!]\s*/, '').replace(/,\s*\{\w+\}(?=[.!?])/g, ''), by);
  if (named.size && words(base) >= 9 && !namesIn(v, by).size) return 'nameless';
  if (ss.length >= 3 && ss.filter(x => x.endsWith('!') && words(x) <= 3).length >= 2) return 'fragments';
  if (words(base) >= 10 && words(v) < words(base) * 0.45) return 'dropped';
  if (stock >= 3 && words(v) >= 5) return 'stock';
  return null;
}
export const PRUNED = { fragments: 0, dropped: 0, stock: 0, nameless: 0 };
for (const [k, list] of Object.entries(POOLS)) {
  for (const e of list) for (const t of e.turns) {
    if (!t.v) continue;
    const base = t.say || t.conf || '';
    const kept = {};
    for (const [tag, vs] of Object.entries(t.v)) {
      const ok = [vs].flat().filter(v => { const why = variantFails(v, base, k.startsWith('ballot') ? 0 : stockUse[v]?.size || 0, t.by); if (why) PRUNED[why]++; return !why; });
      if (ok.length) kept[tag] = ok.length === 1 ? ok[0] : ok;
    }
    t.v = Object.keys(kept).length ? kept : undefined;
  }
}
export { LONGER };
