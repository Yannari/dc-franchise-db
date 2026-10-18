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
import homeLines from './home.js';
import shiftLines from './shifts.js';
import kissLines from './kiss.js';
import announceLines from './announce.js';
import dqLines from './dq.js';
import arenaPickLines from './arena-pick.js';
import pairLines from './pairs.js';
import pairVoteLines from './pairs-vote.js';
import pairMoreLines from './pairs-more.js';
import teamLines from './teams.js';
import pairLifeLines from './pair-life.js';
import teamLifeLines from './team-life.js';
import teamMomentLines from './team-moments.js';
import teamReactionLines from './team-reactions.js';
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
import FINAL10 from './voices/final10.js';
import FINAL11 from './voices/final11.js';
import FINAL12 from './voices/final12.js';
import FINAL13 from './voices/final13.js';
import FINAL14 from './voices/final14.js';

export const POOLS = Object.assign({}, spine, vote, house, game, final, story, places, campaign, stakes, twists, goodbye, named, cruel, quitLines, medevacLines, championLines, wishLines, lateLines, homeLines, shiftLines, kissLines, announceLines, dqLines, arenaPickLines, pairLines, pairVoteLines, teamLines, pairLifeLines, teamLifeLines, teamMomentLines, teamReactionLines);

// more entries for the same pools, appended (never a replacement: a key here adds to the pool)
// (payback.js adds to pools other files own: appended, like the extras)
for (const more of [...EXTRA, payback, pairMoreLines]) for (const [k, list] of Object.entries(more)) (POOLS[k] ||= []).push(...list);
// a pool key ending in '+' adds to the pool of that name instead of replacing it (shifts.js joins game.js's)
for (const k of Object.keys(POOLS).filter(k => k.endsWith('+'))) { (POOLS[k.slice(0, -1)] ||= []).push(...POOLS[k]); delete POOLS[k]; }

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
export const FINAL_VOICES = [FINAL1, FINAL2, FINAL3, FINAL4, FINAL5, FINAL6, FINAL7, FINAL8, FINAL9, FINAL10, FINAL11, FINAL12, FINAL13, FINAL14];
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
//   pickup              the reply picks up a word the line said ("You can't just call a room. That's not a thing." /
//                       "It's a thing now."), and the variant says none of them ("You can't call a room."): the reply
//                       answers something nobody said (read 2026-10-18: "Don't get used to it" / "They'd love it here").
//                       Measured 401 variants; the line as written always fits its reply.
const PICK_STOP = new Set(('a an the and or but if so to of in on at for with from by is are was were be been am i you he she it we they me him her us them my your our their this that these those ' +
  'what who why how when where not no yes do does did dont don\'t im i\'m it\'s that\'s just really very can can\'t will won\'t would could should have has had get got go going ' +
  'there here then than now about like okay oh well yeah one all any some out up off over too also again').split(' '));
const pickWords = s => new Set(String(s).toLowerCase().replace(/\{[^}]+\}/g, ' ').replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !PICK_STOP.has(w)));
export function dropsPickup(v, base, reply) {
  if (!reply) return false;
  const want = [...pickWords(base)].filter(w => pickWords(reply).has(w));
  if (!want.length) return false;
  const vw = [...pickWords(v)];
  return !want.some(w => vw.some(x => x === w || x.startsWith(w.slice(0, 5))));
}
export const PRUNED = { fragments: 0, dropped: 0, stock: 0, nameless: 0, pickup: 0 };
for (const [k, list] of Object.entries(POOLS)) {
  for (const e of list) e.turns.forEach((t, i) => {
    if (!t.v) return;
    const base = t.say || t.conf || '';
    // the next thing somebody else says out loud, which may pick up this line's words
    const reply = t.say ? e.turns.slice(i + 1).find(x => !x.beat && x.by && x.by !== t.by && x.say)?.say : null;
    const kept = {};
    for (const [tag, vs] of Object.entries(t.v)) {
      const ok = [vs].flat().filter(v => {
        const why = variantFails(v, base, k.startsWith('ballot') ? 0 : stockUse[v]?.size || 0, t.by) || (dropsPickup(v, base, reply) ? 'pickup' : null);
        if (why) PRUNED[why]++;
        return !why;
      });
      if (ok.length) kept[tag] = ok.length === 1 ? ok[0] : ok;
    }
    t.v = Object.keys(kept).length ? kept : undefined;
  });
}
export { LONGER };
