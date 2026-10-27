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
import { gs, players } from '../core.js';
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

// ── a feud that keeps coming back ──
// Two people who have clashed in two earlier weeks are a known thing in the house, and the house says so (the user,
// 2026-10-27: "they fight since ep1... when someone fights a lot people should remark that, in a good or bad way").
// One person in the room speaks up, in one of three ways:
//   fond     c likes both of them and teases them about it: the laugh takes a little heat out of it
//   stirs    c would scheme, and a feud between two other people is cover for c's own game: c eggs it on
//   tired    anybody else: the house is sick of it, and c is a little sick of both of them
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
const SCHEMERS = new Set(['villain', 'mastermind', 'schemer']);
const NEUTRAL = new Set(['hothead', 'challenge-beast', 'wildcard', 'chaos-agent', 'floater', 'perceptive-player']);
const archOf = n => players.find(p => p.name === n)?.archetype || '';

/**
 * How long two people have been at each other before week `weekNum`: the weeks with a clash between them (a
 * friction, an argument, a cold war) in every feud the season filed for them (a feud that made up closes, and the
 * next clash opens a new one). { weeks, first, history: 'new' | 'again' | 'long', since: 'week one' | '' }
 */
export function feudHistory(a, b, weekNum) {
  const key = [a, b].sort().join('|');
  const weeks = new Set();
  for (const l of gs.bb?.storylines || []) {
    if (l?.type !== 'feud' || l.key !== key) continue;
    for (const s of l.steps || []) if (/^(friction|argument|cold)$/.test(s?.step) && (s.week || 0) > 0 && s.week < weekNum) weeks.add(s.week);
  }
  const first = weeks.size ? Math.min(...weeks) : 0;
  return { weeks: weeks.size, first, history: weeks.size >= 2 ? 'long' : weeks.size ? 'again' : 'new',
    since: first ? `week ${NUM[first] || first}` : '' };
}

/** The one person in the room who says what everybody is thinking about a feud this old, or null. */
export function feudRemark(scene, watchers, salt, weekNum) {
  const A = scene.who?.a, B = scene.who?.b;
  const h = feudHistory(A, B, weekNum);
  if (h.history !== 'long' || !watchers.length) return null;
  // the older it is, the likelier somebody says it: two weeks of it, a row in three; five weeks, most rows
  if (stableRng(gs.bb?.seasonSalt || 0, 'bb-feud-remark', salt, A, B)() >= Math.min(0.75, 0.15 * h.weeks)) return null;
  // the boldest one in the room says it
  const c = [...watchers].sort((x, y) => (pStats(y).boldness ?? 5) - (pStats(x).boldness ?? 5) || (x < y ? -1 : 1))[0];
  const s = pStats(c), arch = archOf(c);
  const schemes = SCHEMERS.has(arch) || (NEUTRAL.has(arch) && (s.strategic ?? 5) >= 6 && (s.loyalty ?? 5) <= 4);
  const tone = Math.min(getBond(c, A), getBond(c, B)) >= 1 ? 'fond' : schemes ? 'stirs' : 'tired';
  return { name: c, stance: 'again', tone, a: A, b: B, kind: fightKind(String(scene.kind || '')), doer: null, since: h.since };
}

/** The bonds a stance moves: [x, y, delta][]. */
export function witnessFx(w) {
  if (w.stance === 'again') {
    if (w.tone === 'fond') return [[w.name, w.a, 0.3], [w.name, w.b, 0.3], [w.a, w.b, 0.2]];
    if (w.tone === 'stirs') return [[w.a, w.b, -0.3], [w.name, w.a, -0.1], [w.name, w.b, -0.1]];
    return [[w.name, w.a, -0.3], [w.name, w.b, -0.3]];
  }
  if (w.stance === 'side') return [[w.name, w.a, 0.5], [w.name, w.b, -0.5]];
  if (w.stance === 'turned') return [[w.name, w.a, 0.4], [w.name, w.b, -1.0]];
  return [[w.name, w.a, -0.2], [w.name, w.b, -0.2]];
}

/**
 * The witnesses of a fired scene who say something: [{ name, stance, a, b }] (for side/turned, a is
 * the one backed and b the one gone against; for out, a and b are the two fighting, a the one the
 * witness is closer to). Empty when the scene is not a public fight or nobody cares enough.
 */
export function decideWitnesses(scene, salt, weekNum = 0) {
  if (!scene || !PUBLIC_FIGHT.test(String(scene.kind || '')) || PRIVATE.has(scene.room)) return [];
  const A = scene.who?.a, B = scene.who?.b;
  if (!A || !B || A === B) return [];
  const watchers = (scene.seenBy || []).filter(n => n && n !== A && n !== B && !Object.values(scene.who || {}).includes(n));
  if (!watchers.length) return [];
  const remark = weekNum ? feudRemark(scene, watchers, salt, weekNum) : null;
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
  // the remark comes first, and the one who made it takes no side as well
  return remark ? [remark, ...out.filter(w => w.name !== remark.name)].slice(0, 2) : out;
}

/** Book the stances for a later scene: the one let down brings it up with the witness. */
export function bookWitnesses(ws, week) {
  const book = ((gs.bb ||= {}).witnessBook ||= []);
  for (const w of ws) {
    // a remark on a feud is nobody's side: nobody was let down by it
    if (w.stance === 'again') continue;
    // side/turned: b was gone against; out: a was the friend who expected backing
    const letDown = w.stance === 'out' ? w.a : w.b;
    const other = w.stance === 'out' ? w.b : w.a;
    book.push({ week: week?.num || 0, stance: w.stance, witness: w.name, letDown, other, done: false });
  }
  if (book.length > 80) book.splice(0, book.length - 80);
}
