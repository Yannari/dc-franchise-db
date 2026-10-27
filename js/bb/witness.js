// ══════════════════════════════════════════════════════════════════════
// bb/witness.js — the people watching a fight take a side, and it stays taken
// ══════════════════════════════════════════════════════════════════════
//
// Total Drama's witness rule (td/story/witness.js), in Big Brother's engine. A row in front of the
// house had witnesses already, silently (social.js: every watcher cools a little on the one they
// like less), and none of it ever reached the screen. Now, for every public fight, the one or two
// people in the room who care most about either side decide where they stand, proportionally:
// bonds for which way they lean, temperament against boldness for whether they say it out loud.
//   side     c backs a against b
//   turned   c backs a against b, and b is c's friend: it costs c something
//   out      c refuses to take a side between two people c is close to, and says so
// What they did moves their bonds, here in the engine (a scene never moves the game: the writer
// only says it, tests/bb-talk.test.js holds a muted season to a worded one). The stance is booked
// (gs.bb.witnessBook), so a later scene can have the person they went against bring it up.
import { gs } from '../core.js';
import { getBond } from '../bonds.js';
import { pStats } from '../players.js';
import { stableRng } from './knowledge.js';

// the kinds of moment that are a row in front of other people
export const PUBLIC_FIGHT = /^(talk\.confront|friction\.|editorial\.(standoff|roast)|arc\.wronged|slop\.(snap|argument)|drinks\.(grievance|sharp)|bond\.petty|followup\.overheard)/;
// what kind of row it is: shouting, somebody doing it to somebody (a jab, a joke), or a row over the house
const JOKE = /^(friction\.(joke|condescend|story)|editorial\.roast)/;
const LOUD = /^(talk\.confront|editorial\.standoff|arc\.wronged|slop\.snap|drinks\.|friction\.snap|followup\.overheard)/;
export const fightKind = kind => (JOKE.test(kind) ? 'joke' : LOUD.test(kind) ? 'loud' : 'chore');
// ...and the rooms where nobody else is
const PRIVATE = new Set(['hoh-room', 'pantry', 'washroom', 'diary-room', 'storage-room', 'bathroom']);

/** Where c stands between a and b: { side: 'a' | 'b' | 'out', turned }. */
export function stanceOf(c, a, b, key) {
  const s = pStats(c);
  const jitter = (stableRng(gs.bb?.seasonSalt || 0, 'bb-witness', key, c, a, b)() - 0.5) * 1.5;
  const lean = getBond(c, a) - getBond(c, b) + jitter;
  // the calm hold back and the bold speak up: the same feelings take more to say for a calm person
  const bar = Math.max(0.4, 1.2 + ((s.temperament ?? 5) - (s.boldness ?? 5)) * 0.12);
  if (Math.abs(lean) < bar) return { side: 'out', turned: false };
  const side = lean > 0 ? 'a' : 'b', against = side === 'a' ? b : a;
  return { side, turned: getBond(c, against) >= 2 };
}

/** The bonds a stance moves: [x, y, delta][]. */
export function witnessFx(w) {
  if (w.stance === 'side') return [[w.name, w.a, 0.5], [w.name, w.b, -0.5]];
  if (w.stance === 'turned') return [[w.name, w.a, 0.4], [w.name, w.b, -1.0]];
  return [[w.name, w.a, -0.2], [w.name, w.b, -0.2]];
}

/**
 * The witnesses of a fired scene who say something: [{ name, stance, a, b }] (for side/turned, a is
 * the one backed and b the one gone against; for out, a and b are the two fighting, a the one the
 * witness is closer to). Empty when the scene is not a public fight or nobody cares enough.
 */
export function decideWitnesses(scene, salt) {
  if (!scene || !PUBLIC_FIGHT.test(String(scene.kind || '')) || PRIVATE.has(scene.room)) return [];
  const A = scene.who?.a, B = scene.who?.b;
  if (!A || !B || A === B) return [];
  const watchers = (scene.seenBy || []).filter(n => n && n !== A && n !== B && !Object.values(scene.who || {}).includes(n));
  if (!watchers.length) return [];
  const care = n => Math.max(Math.abs(getBond(n, A)), Math.abs(getBond(n, B)));
  const ranked = watchers.filter(n => care(n) >= 1.5).sort((x, y) => care(y) - care(x) || (x < y ? -1 : 1));
  const out = [];
  const kind = fightKind(String(scene.kind));
  // in a jab the one doing it is the scene's a (the joker; storylines.js says the same)
  const doer = kind === 'joke' ? A : null;
  for (const c of ranked) {
    if (out.length >= 2) break;
    const st = stanceOf(c, A, B, salt);
    if (st.side === 'out') {
      // somebody close to both who will not choose, and says so: only the first, and only if it matters
      if (!out.length && Math.min(getBond(c, A), getBond(c, B)) >= 2) {
        const [a, b] = getBond(c, A) >= getBond(c, B) ? [A, B] : [B, A];
        out.push({ name: c, stance: 'out', a, b, kind, doer });
      }
      continue;
    }
    const [a, b] = st.side === 'a' ? [A, B] : [B, A];
    out.push({ name: c, stance: st.turned ? 'turned' : 'side', a, b, kind, doer });
  }
  return out;
}

/** Book the stances for a later scene: the one let down brings it up with the witness. */
export function bookWitnesses(ws, week) {
  const book = ((gs.bb ||= {}).witnessBook ||= []);
  for (const w of ws) {
    // side/turned: b was gone against; out: a was the friend who expected backing
    const letDown = w.stance === 'out' ? w.a : w.b;
    const other = w.stance === 'out' ? w.b : w.a;
    book.push({ week: week?.num || 0, stance: w.stance, witness: w.name, letDown, other, done: false });
  }
  if (book.length > 80) book.splice(0, book.length - 80);
}
