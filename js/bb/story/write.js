// ══════════════════════════════════════════════════════════════════════
// bb/story/write.js — one storyline step becomes one whole scene
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.3 and §5. A scene is written WHOLE: one pool entry is the entire
// conversation, eight to twenty-odd lines that answer each other, in the
// rhythm of its kind (docs/bb-dialogue-style.md). Nothing is assembled from
// separately written parts, except one thing: when the step answers something
// the viewer never saw, the scene opens with whoever in it saw that thing,
// saying it plainly in the Diary Room (a recap), or a one-line caption if
// nobody in the scene saw it.
//
// Pools: js/bb/story/lines/*.js, keyed 'story.<type>.<step>.<outcome>' (falling
// back to '.any'), recaps 'recap.<type>.<step>' with entries spoken by 'a' or
// 'b' of the EARLIER step. An entry may carry `presumes: [...]`:
//   hoh   an HOH has been crowned this week
//   noms  nominations have happened this week
//   vote  an eviction vote has happened this season
// The writer skips an entry whose presumptions are false.
//
// The words draw from their own dice (stableRng), never the engine's.

import { gs } from '../../core.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { fill, writing } from '../script/write.js';
import { factsFor } from '../script/facts.js';
import { stableRng } from '../knowledge.js';
import { causeOf } from './storylines.js';
import { STORY_POOLS } from './lines/index.js';
import { getBond } from '../../bonds.js';

const ledger = () => ((gs.bb ||= {}).storyLedger ||= newLedger());
const ROOM = { kitchen: 'Kitchen', 'living-room': 'Living Room', bedroom: 'Bedroom', 'hoh-room': 'HOH Room',
  backyard: 'Backyard', 'diary-room': 'Diary Room', pantry: 'Storage Room', bathroom: 'Bathroom', washroom: 'Bathroom',
  'storage-room': 'Storage Room', 'have-not-room': 'Have-Not Room', dining: 'Kitchen' };

// an outcome's own pool when it has one (a couple's spark is not a stranger's), else the step's
const keysFor = (type, step, outcome) => [`story.${type}.${step}.${outcome}`, `story.${type}.${step}.any`].filter(k => STORY_POOLS[k]?.length).slice(0, 1);
export const roomName = r => ROOM[r] || 'Living Room';
export const hasPool = (type, step, outcome) => keysFor(type, step, outcome).length > 0;

// The mood a scene sets for the music (BED_BY_MOOD in js/vp-bb-ep/sound.js).
function moodOf(type, step) {
  if (type === 'feud') return step === 'apology' ? 'house' : 'drama';
  if (type === 'alliance') return ['crack', 'exposed', 'betrayal'].includes(step) ? 'scheming' : 'deals';
  if (type === 'showmance') return ['fight', 'breakup', 'jealous'].includes(step) ? 'drama' : step === 'hiding' ? 'secret' : 'house';
  if (type === 'target') return step === 'block' ? 'ceremony' : 'scheming';
  if (type === 'scheme') return step === 'caught' ? 'drama' : 'secret';
  if (type === 'life') return step === 'breakdown' ? 'drama' : 'house';
  return 'house';
}

// When the earlier step happened, said the way people say it.
function whenOf(prior, step) {
  if (!prior) return 'earlier';
  if (prior.week < step.week) return 'last week';
  const d = step.stretch - prior.stretch;
  return d <= 0 ? 'earlier' : d === 1 ? 'yesterday' : 'the other day';
}

function presumed(entry, ctx) {
  for (const p of entry.presumes || []) {
    if (p === 'hoh' && !ctx.hoh) return false;
    if (p === 'noms' && !(ctx.nominees || []).length) return false;
    if (p === 'vote' && !(gs.bb?.weeks || []).some(w => w !== ctx.week && w.evicted)) return false;
  }
  return true;
}

// ── across seasons ─────────────────────────────────────────────────────
// The season's ledger stops a scene repeating inside a season, but a viewer watches season
// after season: the first night is one scene a season, and with a handful to choose from the
// same opening came back (the user, 2026-10-06: "is it happening every first episode?").
// The scenes this browser has aired recently are remembered, and a new season prefers ones
// the viewer has not seen while any are left. Words only: a saved season keeps the words it
// was written with; nothing in the game reads this.
const SEEN_KEY = 'bb-story-seen';
const SEEN_MAX = 900;
let seenCache = null;
function seenAcross() {
  if (seenCache) return seenCache;
  try { seenCache = new Set(JSON.parse(globalThis.localStorage?.getItem(SEEN_KEY) || '[]')); } catch { seenCache = new Set(); }
  return seenCache;
}
function noteAcross(id) {
  try {
    if (!globalThis.localStorage) return;
    const seen = seenAcross();
    seen.delete(id); seen.add(id);
    const list = [...seen].slice(-SEEN_MAX);
    seenCache = new Set(list);
    globalThis.localStorage.setItem(SEEN_KEY, JSON.stringify(list));
  } catch { /* storage is a convenience */ }
}

function pick(keys, who, data, ctx, room, salt) {
  const pools = {};
  // an entry that names something the scene does not have ({alliance} on an unnamed pact,
  // {c} with no third person) is not a candidate: it would print the raw slot
  const can = e => (e.turns || []).every(t => (!t.by || !!who[t.by]) && [...String(t.say || t.dr || t.beat || '').matchAll(/\{(\w+)(?:\.\w+)?\}/g)]
    .every(([, r]) => r === 'hoh' ? !!ctx.hoh : r === 'count' || !!who[r] || typeof data[r] === 'string'));
  // a couple or family who came in together are not "friends": a line that calls them that is wrong
  const facts0 = factsFor({ who, data, room }, { week: ctx.week, act: 'house', hoh: ctx.hoh, nominees: ctx.nominees });
  const close = ['together', 'family'].includes(facts0.kin);
  const FRIEND = new RegExp(String.raw`(^|[^a-z])friends?([^a-z]|$)`, "i");
  const fits = e => !close || !FRIEND.test(JSON.stringify(e.turns));
  for (const k of keys) pools[k] = (STORY_POOLS[k] || []).filter(e => presumed(e, ctx) && can(e) && fits(e));
  // inside a set piece the room is the set's: a scene that stages its own room waits, unless nothing else fits
  if (ctx.inSet) for (const k of keys) { const free = pools[k].filter(e => !e.room); if (free.length) pools[k] = free; }
  if (!keys.some(k => pools[k].length)) return null;
  // what this viewer saw in recent seasons waits while something new still fits
  const seen = seenAcross();
  if (seen.size) for (const k of keys) { const fresh = pools[k].filter(e => !seen.has(e.id)); if (fresh.length) pools[k] = fresh; }
  const facts = factsFor({ who, data, room }, { week: ctx.week, act: 'house', hoh: ctx.hoh, nominees: ctx.nominees });
  const rng = stableRng(gs.bb?.seasonSalt || 0, ctx.week?.num || 0, 'story', salt);
  const speakers = Object.values(who).filter(Boolean);
  const pairKey = [who.a, who.b].filter(Boolean).sort().join('|');
  const clock = (ctx.week?.num || 0) * 10 + (ctx.stretch || 0);
  const key = keys.length > 1 ? keys : keys[0];
  const got = pickEntry(ledger(), pools, key, facts, pairKey, rng, speakers, clock);
  if (got) noteAcross(got.id);
  return got;
}

const render = (entry, who, ctx, data) => entry.turns.map(t => {
  const kind = t.dr ? 'dr' : t.beat ? 'beat' : 'say';
  const by = t.by ? who[t.by] || null : null;
  const text = fill(t.dr || t.beat || t.say, who, { hoh: ctx.hoh }, data);
  // a line may open on a slot ("{when}, {a} made a joke...") — a sentence starts with a capital
  return { kind, by, text: text.replace(/^(["'(…\.\s]*)([a-z])/, (m, p, ch) => p + ch.toUpperCase()) };
});

// A stable shuffle of the house (the words' own dice, never the engine's).
function shuffled(list, salt) {
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'story-cast', salt);
  return list.map(n => [rng(), n]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
}

// The rest of the house is somewhere. A private conversation in a shared room shows who else
// is around (the user, 2026-10-06: "all one-on-one with no one in the background"), and a row
// in a shared room gets a reaction from them.
const SHARED = new Set(['kitchen', 'living-room', 'backyard', 'bedroom']);
function background(lines, sc, ctx, salt, loud) {
  const others = shuffled((ctx.present || []).filter(n => !sc.cast.includes(n)), salt);
  if (others.length < 2 || !SHARED.has(sc.room)) return lines;
  const who = { x: others[0], y: others[1] };
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'story-bg', salt);
  const out = lines.slice();
  if (rng() < 0.7) {
    const e = pick([`bg.${sc.room}`], who, {}, ctx, sc.room, `${salt}|bg`);
    // after the scene's own opening stage direction, or at the very top
    // marked, so the viewer still names the people talking before it shows who else is around
    if (e) out.splice(out[0]?.kind === 'beat' ? 1 : 0, 0, ...render(e, who, ctx, {}).map(l => ({ ...l, bg: true })));
  }
  if (loud) {
    const e = pick(['bg.react'], who, {}, ctx, sc.room, `${salt}|react`);
    if (e) {
      // before the Diary Room cuts that close the scene
      let k = out.length; while (k > 0 && out[k - 1].kind === 'dr') k--;
      out.splice(Math.max(1, k), 0, ...render(e, who, ctx, {}));
      sc.cast = [...sc.cast, ...(e.turns.some(t => t.by === 'x') ? [who.x] : []), ...(e.turns.some(t => t.by === 'y') ? [who.y] : [])];
    }
  }
  return out;
}
const LOUD = (type, step, outcome) => (type === 'feud' && (step === 'argument' || outcome === 'snap'))
  || (type === 'showmance' && step === 'fight') || (type === 'scheme' && step === 'caught');

/** The scene for one step of a storyline, or null when nothing fits. */
export function writeStoryScene(line, step, ctx) {
  const prior = causeOf(line, step) || null;
  let who = { a: step.roles.a, b: step.roles.b, c: step.roles.c };
  // The roles follow the cause. In a feud, the one who starts the argument is the one who
  // was wronged, and the one who apologises is the one who did it: the event that fired
  // may have them the other way round, which aired a joker yelling about their own joke.
  if (line.type === 'feud' && prior?.step === 'friction') {
    const offender = prior.roles.a;
    if (step.step === 'argument' && who.a === offender) who = { a: who.b, b: who.a, c: who.c };
    if (step.step === 'apology' && who.b === offender) who = { a: who.b, b: who.a, c: who.c };
  }
  const data = { ...step.data, when: whenOf(prior, step) };
  for (const k of Object.keys(data)) if (data[k] != null && typeof data[k] !== 'string') delete data[k];
  let room = step.room || 'living-room';
  let keys = keysFor(line.type, step.step, step.outcome);
  if (!keys.length) return null;
  // An alliance of three or more meets as a group: everybody in it is in the room, talking.
  if (line.type === 'alliance' && ['formed', 'checkin', 'leftout'].includes(step.step) && data.alliance && !ctx.inSet) {
    const al = (gs.namedAlliances || []).find(x => x.name === data.alliance);
    const members = (al?.members || []).filter(n => (ctx.present || []).includes(n));
    const gk = `story.alliance.${step.step}.group`;
    if (members.length >= 3 && STORY_POOLS[gk]?.length) {
      const rest = members.filter(n => n !== who.a && n !== who.b);
      who = { a: who.a, b: who.b, c: rest[0], d: rest[1], e: rest[2] };
      keys = [gk];
    }
  }
  // Most house talk has more than two people in it, especially in the first weeks (the user,
  // 2026-10-06): gossip on a bed, banter, a late night, friends teasing a new couple, a week-one
  // pitch to a room. When a group version exists, the speakers' closest people join in.
  const GROUP = ['target.gossip', 'target.pitch', 'life.banter', 'life.latenight', 'life.friends', 'showmance.spark',
    'target.lobby.lands', 'target.block', 'target.count', 'life.homesick.helped', 'life.prank', 'life.chores'];
  const groupable = GROUP.includes(`${line.type}.${step.step}`) || GROUP.includes(`${line.type}.${step.step}.${step.outcome}`);
  if (!ctx.inSet && keys[0] !== `story.alliance.${step.step}.group` && groupable && step.outcome !== 'couple') {
    const gk = `story.${line.type}.${step.step}.group`;
    const taken = new Set(Object.values(who).filter(Boolean));
    const extras = (ctx.present || []).filter(n => !taken.has(n) && n !== data.target)
      .map(n => [n, (who.a ? getBond(who.a, n) : 0) + (who.b ? getBond(who.b, n) : 0)])
      .sort((x, y) => y[1] - x[1]).map(x => x[0]);
    const roll = stableRng(gs.bb?.seasonSalt || 0, 'story-group', line.id, line.steps.indexOf(step))();
    if (STORY_POOLS[gk]?.length && extras.length && roll < ((ctx.week?.num || 0) <= 2 ? 0.9 : 0.6)) {
      const more = extras.slice(0, 3);
      who = { a: who.a, b: who.b, c: who.c || more.shift(), d: more.shift(), e: more.shift() };
      keys = [gk];
    }
  }
  const cast = Object.values(who).filter(Boolean);
  const base = { id: `${line.id}#${line.steps.indexOf(step)}`, line: line.id, type: line.type, step: step.step,
    outcome: step.outcome, room, roomName: ROOM[room] || 'Living Room', cast, mood: moodOf(line.type, step.step), at: step.at };
  if (writing.muted) return { ...base, lines: [] };
  const entry = pick(keys, who, data, ctx, room, `${line.id}|${line.steps.indexOf(step)}`);
  if (!entry) return null;
  // A scene that is set somewhere ("the sink's right there") happens there.
  if (entry.room && !ctx.inSet) { room = entry.room; base.room = room; base.roomName = ROOM[room] || base.roomName; }
  // A scene that does not set its own room moves along if the last scene was in the same one
  // (five bedroom scenes in a row read as one long night). Decided here, BEFORE the background
  // is chosen, so "laps of the backyard" never plays in the living room.
  else if (!ctx.inSet && ctx.avoidRoom && room === ctx.avoidRoom) {
    const ROTA = ['kitchen', 'living-room', 'backyard', 'bedroom'].filter(r => r !== ctx.avoidRoom);
    const h = [...base.id].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
    room = ROTA[h % ROTA.length]; base.room = room; base.roomName = ROOM[room] || base.roomName;
  }
  let lines = render(entry, who, ctx, data);
  // The cause, said plainly, when the viewer never saw it.
  let recap = [];
  if (prior && !prior.aired) {
    const pw = { a: prior.roles.a, b: prior.roles.b, c: prior.roles.c };
    const saw = n => n && (prior.seenBy || []).includes(n) && cast.includes(n);
    const by = saw(pw.b) ? 'b' : saw(pw.a) ? 'a' : null;
    const who2 = by || 'caption';
    const rk = [`recap.${line.type}.${prior.step}.${prior.outcome}.${who2}`, `recap.${line.type}.${prior.step}.${who2}`].filter(k => STORY_POOLS[k]?.length).slice(0, 1);
    const re = rk.length ? pick(rk, pw, { ...prior.data, when: data.when }, ctx, room, `${line.id}|recap|${line.steps.indexOf(step)}`) : null;
    if (re) recap = render(re, pw, ctx, { ...Object.fromEntries(Object.entries(prior.data || {}).filter(([, v]) => typeof v === 'string')), when: data.when });
  }
  // On stage: the people the scene actually uses — who speaks, or who a stage direction names.
  // (The event's third person is often only somebody the scene never needed.)
  const used = cast.filter(n => lines.some(l => l.by === n || (l.kind === 'beat' && l.text.includes(n))));
  const sc = { ...base, cast: used.length ? used : cast, fixedRoom: !!entry.room, recap: recap.length > 0, lineId: entry.id };
  if (!ctx.inSet) lines = background(lines, sc, ctx, sc.id, LOUD(line.type, step.step, step.outcome));
  sc.lines = [...recap, ...lines];
  return sc;
}

// ── set pieces: the whole house in one room ─────────────────────────────
const SET_ROOM = { firstnight: 'kitchen', firstbed: 'bedroom', hohroom: 'hoh-room', afternoms: 'living-room',
  morningafter: 'kitchen', dinner: 'kitchen', backyard: 'backyard', gamenight: 'living-room' };
const CUT = sc => (sc.type === 'feud' ? 'clash' : sc.type === 'showmance' ? 'flirt' : 'fun');

/**
 * A stretch's whole-house set piece (spec addendum, 2026-10-06): an ensemble opening with up
 * to six people talking over each other, the public moments of the stretch played inside it
 * (cut to, with the room still around them), and an ensemble close. Roles a..f; the HOH room
 * reveal has the HOH as a, the house after nominations the two nominees as a and b.
 */
export function writeSetPiece(type, ctx, inside, { gone = null, at = 0 } = {}) {
  let room = SET_ROOM[type] || 'living-room';
  const present = ctx.present || [];
  const salt = `${ctx.week?.num || 0}|${ctx.stretch}|${type}`;
  const lead = [];
  if (type === 'hohroom' && ctx.hoh) lead.push(ctx.hoh);
  if (type === 'afternoms') lead.push(...(ctx.nominees || []).slice(0, 2), ...(ctx.hoh ? [ctx.hoh] : []));
  const insiders = inside.flatMap(sc => sc.cast);
  const order = [...new Set([...lead, ...insiders, ...shuffled(present, salt)])].filter(n => present.includes(n));
  const who = Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'f'].map((r, i) => [r, order[i]]).filter(([, n]) => n));
  const data = gone ? { gone } : {};
  const sctx = { ...ctx, inSet: true };
  const open = pick([`set.${type}.open`], who, data, sctx, room, `${salt}|open`);
  if (!open) return null;
  // the set is wherever its opening scene stages it (the first night can start in the bedroom)
  if (open.room) room = open.room;
  const close = STORY_POOLS[`set.${type}.close`] ? pick([`set.${type}.close`], who, data, sctx, room, `${salt}|close`) : null;
  const lines = [...render(open, who, ctx, data)];
  const speaking = new Set(lines.filter(l => l.by).map(l => l.by));
  for (const sc of inside) {
    const cw = { a: sc.cast[0], b: sc.cast[1] || sc.cast[0] };
    const cut = pick([`set.cut.${CUT(sc)}`], cw, {}, sctx, room, `${salt}|cut|${sc.id}`);
    if (cut) lines.push(...render(cut, cw, ctx, {}));
    // the rest of the room is still there: a row at dinner gets a reaction from the table
    const body = sc.lines.slice();
    if (sc.type === 'feud') {
      const others = order.filter(n => !sc.cast.includes(n));
      if (others.length >= 2) {
        const rw = { x: others[0], y: others[1] };
        const e = pick(['bg.react'], rw, {}, sctx, room, `${salt}|react|${sc.id}`);
        if (e) {
          let k = body.length; while (k > 0 && body[k - 1].kind === 'dr') k--;
          const r = render(e, rw, ctx, {});
          body.splice(Math.max(1, k), 0, ...r);
          r.forEach(l => l.by && speaking.add(l.by));
        }
      }
    }
    lines.push(...body);
    sc.cast.forEach(n => speaking.add(n));
  }
  if (close) lines.push(...render(close, who, ctx, data));
  lines.forEach(l => l.by && speaking.add(l.by));
  // on stage: everybody the scene uses, then the room filled out to eight
  const named = order.filter(n => speaking.has(n) || lines.some(l => l.kind === 'beat' && l.text.includes(n)));
  const cast = [...new Set([...named, ...order])].slice(0, Math.max(8, named.length));
  const MOOD = { firstnight: 'house', firstbed: 'house', hohroom: 'deals', afternoms: 'ceremony', morningafter: 'house',
    dinner: 'house', backyard: 'house', gamenight: 'house' };
  return { id: `set:${ctx.week?.num || 0}:${ctx.stretch}:${type}`, line: null, type: 'set', step: type, outcome: 'any',
    room, roomName: ROOM[room] || 'Living Room', cast, mood: inside.some(sc => sc.type === 'feud') ? 'drama' : MOOD[type] || 'house',
    at, fixedRoom: true, recap: false, lineId: open.id, inside: inside.map(sc => sc.id), lines };
}
