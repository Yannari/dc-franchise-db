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

// ── the why: what the viewer cannot see from the dialogue alone ─────────
// The user, 2026-10-06: "I don't have insight into their minds like I had with the classic
// version… I don't get the alliance, the strategy". Each scene carries a few plain lines for
// the viewer's side panel (never the stage): what this conversation is in the game, and how
// the people in it stand with each other and with the alliances. Bonds are read as the week
// ends. Words only.
const STEP_WHY = {
  'feud.friction': '{a} and {b} are rubbing each other up the wrong way.',
  'feud.argument': '{a} confronts {b}: this has been building.',
  'feud.apology': '{a} tries to make peace with {b}.',
  'feud.cold': '{a} and {b} have stopped speaking.',
  'alliance.formed': '{a} and {b} make an alliance{al}.',
  'alliance.recruit': '{a} is trying to bring {b} into {alx}.',
  'alliance.checkin': '{alx} checks its numbers.',
  'alliance.leftout': '{a} realises {alx} met without them.',
  'alliance.poach': '{a} is trying to pull {b} away from their group.',
  'alliance.exposed': '{alx} has been found out.',
  'alliance.betrayal': '{a} turns on {b}.',
  'alliance.repair': '{a} and {b} try to patch things up.',
  'showmance.spark': '{a} and {b} are flirting.',
  'showmance.kiss': '{a} and {b} kiss.',
  'showmance.declare': '{a} tells {b} how they feel.',
  'showmance.hiding': '{a} and {b} are keeping it quiet.',
  'showmance.jealous': '{a} is jealous.',
  'showmance.fight': '{a} and {b} are fighting.',
  'showmance.breakup': '{a} and {b} are ending it.',
  'target.pitch': '{a} is pitching {target} as the target.',
  'target.gossip': 'The talk is about {target}.',
  'target.lobby': '{a} is lobbying {b} on the vote{tgt}.',
  'target.block': 'Life on the block.',
  'target.backdoor': 'A plan to backdoor {target}.',
  'target.count': 'Counting the votes{tgt}.',
  'scheme.lie': '{a} is lying to {b}.',
  'scheme.caught': '{a} has been caught out.',
};
const TALK_WHY = {
  'bb.hoh': '{a} is Head of Household and put {c} up as the real target. If {c} wins the Block Buster, the plan falls apart.',
  'bb.nominee': '{a} is one of three on the block. The Block Buster is the only way off that does not need anyone\'s vote.',
  'veto.hope': '{a} is on the block. Winning the veto is the surest way off it.',
  'nexthoh': 'An HOH is coming. {c} has won the most so far, and {a} and {b} are afraid of {c} holding power.',
  'prejury': 'Jury is close. Whoever leaves before it starts gets no vote for the winner: {a} and {b} want {c} out first.',
  'jury.bitter': '{gone} has just gone to the jury. {b} voted {gone} out.',
  'outside': '{a} voted to evict {c}, but the house sent {gone} home, {count}. {a} is on the outside of this vote.',
  'jury.manage': 'The jury decides the winner. {c} is liked by almost everybody, which makes {c} dangerous at the end.',
  'endgame': 'Six or fewer left. Every competition could end a game now.',
  'bond.vent': '{a} cannot stand {c}, and {b} is who {a} tells.',
  'bond.trust': '{a} and {b} are each other\'s closest person in the house.',
  'style.floater': '{a} plays as a floater: no fixed side, always with the numbers.',
  'style.beast': '{a} plays to win competitions, and the house is starting to notice.',
  'style.manipulator': '{a} plays by planting doubts: this one is about {c}.',
  'style.strategist': '{a} plays the numbers: who is with who, and who is the biggest threat ({c}).',
  'style.social': '{a} plays socially: time with everyone, so nobody wants to write {a}\'s name down.',
  'style.loyal': '{a} plays with loyalty: {c} is {a}\'s person, whatever it costs.',
  'style.underdog': '{a} has been counted out from the start, and is still here.',
  'style.provocateur': '{a} plays out loud: stirring the house and daring people to answer.',
  'style.perceptive': '{a} plays by watching: reading the house before it says anything.',
  'style.goat': '{a} is the one everybody wants to sit next to at the end, and knows it.',
};
const BONDWORD = v => v >= 6 ? 'very close' : v >= 3 ? 'friendly' : v > -2 ? 'neutral' : v > -5 ? 'wary of each other' : 'enemies';
function standings(cast) {
  const ppl = cast.filter(Boolean).slice(0, 4);
  // who is in which alliance first: it is what the dialogue cannot show
  const groups = [];
  for (const al of gs.namedAlliances || []) {
    if (al.active === false || al.dissolved) continue;
    const inIt = ppl.filter(n => (al.members || []).includes(n));
    const outOf = ppl.filter(n => !inIt.includes(n));
    if (inIt.length >= 2) groups.push(`${inIt.join(' & ')}: ${inIt.length === 2 ? 'both' : 'all'} in ${al.name}${outOf.length ? ` (${outOf.join(' & ')} not)` : ''}`);
    else if (inIt.length === 1) groups.push(`${inIt[0]} is in ${al.name}`);
  }
  const bonds = [];
  for (let i = 0; i < ppl.length && bonds.length < 3; i++) for (let j = i + 1; j < ppl.length && bonds.length < 3; j++) {
    const v = getBond(ppl[i], ppl[j]);
    bonds.push(`${ppl[i]} & ${ppl[j]}: ${BONDWORD(v)} (${v > 0 ? '+' : ''}${Math.round(v)})`);
  }
  return [...groups.slice(0, 3), ...bonds];
}
const fillWhy = (t, who, data) => t.replace(/\{(\w+)\}/g, (m, k) => {
  if (k === 'al') return data.alliance ? ` (${data.alliance})` : '';
  if (k === 'alx') return data.alliance || 'their alliance';
  if (k === 'tgt') return data.target ? ` (${data.target})` : '';
  if (k === 'target') return data.target || 'somebody';
  if (k === 'count') return String(data.count || '').toLowerCase();
  return who[k] || data[k] || m;
});
function whyOf(key, table, who, data, cast) {
  const t = table[key];
  const first = t ? fillWhy(t, who, data) : '';
  return [...(first ? [first[0].toUpperCase() + first.slice(1)] : []), ...standings(cast)];
}
export const hasPool = (type, step, outcome) => keysFor(type, step, outcome).length > 0;

// The mood a scene sets for the music (BED_BY_MOOD in js/vp-bb-ep/sound.js).
function moodOf(type, step) {
  if (type === 'feud') return step === 'apology' ? 'house' : 'drama';
  // a plan coming together has music; a quiet word between two people does not
  if (type === 'alliance') return ['crack', 'exposed', 'betrayal'].includes(step) ? 'scheming' : ['formed', 'recruit', 'poach'].includes(step) ? 'plan' : 'deals';
  if (type === 'showmance') return ['fight', 'breakup', 'jealous'].includes(step) ? 'drama' : step === 'hiding' ? 'secret' : 'house';
  if (type === 'target') return step === 'block' ? 'ceremony' : 'scheming';
  if (type === 'scheme') return step === 'caught' ? 'drama' : 'secret';
  if (type === 'life') return step === 'breakdown' ? 'drama' : ['banter', 'prank', 'friends'].includes(step) ? 'fun' : 'house';
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
    if (p === 'jurors' && !(ctx.jurors > 0)) return false;
  }
  // a line written for one stage of the season (bb/story/lines/gametalk.js) airs only then
  if (entry.phase && !entry.phase.includes(ctx.phase || 'early')) return false;
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
  // a scene where people promise their votes ("we've talked about it, we want to keep you") is
  // not spoken by somebody who has no vote: the other nominee, or the HOH (the audit, 2026-10-06:
  // Priya, on the block beside Damien, was one of the three keeping him)
  const PLEDGE = /keep you|we've talked about it|three votes|our votes|vote to keep|votes for one promise/i;
  const noVote = new Set([...(ctx.nominees || []), ...(ctx.hoh ? [ctx.hoh] : [])]);
  const voters = e => !PLEDGE.test(JSON.stringify(e.turns)) || (e.turns || []).every(t => !t.by || t.by === 'a' || !noVote.has(who[t.by]));
  for (const k of keys) pools[k] = (STORY_POOLS[k] || []).filter(e => presumed(e, ctx) && can(e) && fits(e) && voters(e));
  // inside a set piece the room is the set's: a scene that stages its own room waits, unless nothing else fits
  if (ctx.inSet) for (const k of keys) { const free = pools[k].filter(e => !e.room); if (free.length) pools[k] = free; }
  if (!keys.some(k => pools[k].length)) return null;
  // nothing airs twice in a season while something unused still fits
  const used = ledger().uses || {};
  for (const k of keys) { const unused = pools[k].filter(e => !used[e.id]); if (unused.length) pools[k] = unused; }
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
// Is this houseguest named in the text, as a whole name ("Raj's", not "Rajesh")?
const nameIn = (n, text) => new RegExp(`(^|\\W)${String(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\w)`).test(String(text || ''));

// The rest of the house is somewhere. A private conversation in a shared room shows who else
// is around (the user, 2026-10-06: "all one-on-one with no one in the background"), and a row
// in a shared room gets a reaction from them.
const SHARED = new Set(['kitchen', 'living-room', 'backyard', 'bedroom']);
function background(lines, sc, ctx, salt, loud) {
  // nobody in the background is the person the scene is talking about (Priya doing a puzzle at
  // the table while somebody says Priya still needs to go)
  const spoken = lines.map(l => String(l.text || '')).join(' ');
  const others = shuffled((ctx.present || []).filter(n => !sc.cast.includes(n) && !nameIn(n, spoken)), salt);
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
  // Inside a set piece too: a scene that stages its own room ("Bedroom, after lights out") is not
  // folded into the kitchen around it; it is marked, and the director airs it as its own scene
  // (the user, 2026-10-06: "it didn't switch scenes, we were still in the kitchen")
  if (entry.room) { room = entry.room; base.room = room; base.roomName = ROOM[room] || base.roomName; if (ctx.inSet) base.ownRoom = true; }
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
  sc.why = whyOf(`${line.type}.${step.step}`, STEP_WHY, who, data, sc.cast);
  // an alliance with a name, formed on screen, gets its title (the user, 2026-10-06)
  if (line.type === 'alliance' && step.step === 'formed' && data.alliance) sc.title = titleOf(data.alliance, sc.cast);
  // somebody brought in gets theirs (the user, 2026-10-06: "recruitment and removal from an alliance have a title too")
  if (line.type === 'alliance' && step.step === 'recruit' && data.alliance && data.joined && step.outcome !== 'refused') sc.title = { kind: 'joined', name: data.alliance, members: [data.joined] };
  // a final two, a final three: the deal gets its card (the user, 2026-10-06: "same for final 2/3")
  if (line.type === 'alliance' && step.step === 'formed' && data.pact && !data.alliance) sc.title = { kind: 'deal', name: data.pact, members: sc.cast.slice(0, data.pact === 'Final Three' ? 3 : 2) };
  return sc;
}

// ── game talk: what the house is talking about this week of the game ────
/**
 * One conversation from bb/story/gametalk.js (which says who and why): a Block Buster plan,
 * a nominee's hope for the veto, who has to go before jury, a juror's bitterness, final-two
 * talk, venting or trust. Shaped like a storyline scene, with the room around it.
 */
export function writeGameTalk(talk, ctx, at) {
  const { kind, who, data } = talk;
  const key = `talk.${kind}`;
  if (!STORY_POOLS[key]?.length) return null;
  const salt = `gt|${ctx.week?.num || 0}|${ctx.stretch}|${kind}`;
  let room = 'living-room';
  const cast = Object.values(who).filter(Boolean);
  const base = { id: `talk:${ctx.week?.num || 0}:${ctx.stretch}:${kind}`, line: null, type: 'talk', step: kind, outcome: talk.phase || 'any',
    room, roomName: ROOM[room], cast, mood: kind.startsWith('bond.vent') || kind === 'style.provocateur' ? 'drama' : kind === 'style.manipulator' ? 'scheming'
      : kind === 'style.strategist' || kind === 'prejury' || kind === 'jury.manage' || kind === 'bb.hoh' ? 'plan' : kind === 'style.social' ? 'fun' : 'deals', at };
  if (writing.muted) return { ...base, lines: [] };
  const entry = pick([key], who, data, { ...ctx, phase: talk.phase }, room, salt);
  if (!entry) return null;
  if (entry.room) room = entry.room;
  else if (ctx.avoidRoom) {
    const ROTA = ['kitchen', 'living-room', 'backyard', 'bedroom'].filter(r => r !== ctx.avoidRoom);
    room = ROTA[[...salt].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7) % ROTA.length];
  }
  // a scene staged outdoors ("the backyard", "the hammock", "by the pool") is in the backyard
  if (!entry.room && /backyard|hammock|pool|lounger|grass/i.test(entry.turns[0]?.beat || '')) room = 'backyard';
  const lines = render(entry, who, ctx, data);
  const used = cast.filter(n => lines.some(l => l.by === n || (l.kind === 'beat' && l.text.includes(n))));
  const sc = { ...base, room, roomName: ROOM[room] || 'Living Room', cast: used.length ? used : cast, fixedRoom: !!entry.room, recap: false, lineId: entry.id };
  // private talk is private: the room around it only where people would be (never a shut door)
  const shut = kind === 'bond.vent' || /door shut|closes the door|shuts the door|door,? shut|voices? (low|down)|whisper|quiet/i.test(JSON.stringify(entry.turns));
  sc.lines = shut ? lines : background(lines, sc, ctx, sc.id, false);
  sc.why = whyOf(kind, TALK_WHY, who, data, Object.values(who).filter(Boolean));
  return sc;
}

// ── the campaign: a nominee gets a voter alone ─────────────────────────
// The title card for an alliance formed on screen: its name and who is in it (as far as this
// scene shows: the people in the scene who are in it).
function titleOf(name, cast) {
  const al = (gs.namedAlliances || []).find(x => x.name === name);
  // who formed it in this scene (the alliance on record is as the week ENDS, with later recruits)
  const members = cast.filter(n => !al || (al.members || []).includes(n)).slice(0, 6);
  return { kind: 'alliance', name, members: members.length ? members : cast.slice(0, 6) };
}
const CASE_WHY = {
  deal: '{a} reminds {b} of a deal between them.',
  hunted: '{a} tells {b} that {target} is the one coming for {b}.',
  pair: '{a} argues {target} and {partner} are a pair with no room for {b}.',
  alliance: '{a} argues {target} is in {alliance}, and {b} is not.',
  comps: '{a} argues {target} is the bigger competition threat.',
  beatable: '{a} argues {b} could beat {a} at the end, but not {target}.',
  clean: '{a} points out that {a} has never voted against {b}.',
  friend: '{a} leans on their friendship.',
  count: '{a} offers {b} a vote for the weeks ahead.',
};
const OUTCOME_WHY = {
  receptive: 'It lands: {b} is thinking about keeping {a}.',
  unmoved: 'It does not land: {b} has not moved.',
  worn: 'Second try, and this time it lands.',
};
/**
 * One pitch from the engine's campaign (the beat carries the nominee's case and the voter's
 * reply, already written) aired as a whole private conversation: the nominee gets the voter
 * alone, the case and the reply, a closing push that matches how it went, and a Diary Room.
 */
export function writeCampaignScene(beat, ctx, at, salt) {
  // the nominee first, the voter last; anybody between came along to help make the case
  const ps = beat.players || [];
  const a = ps[0], b = ps.length > 1 ? ps[ps.length - 1] : null;
  if (!a || !b) return null;
  const along = ps.slice(1, -1);
  const outcome = beat.pitchOutcome || (beat.badgeClass === 'green' ? 'receptive' : 'unmoved');
  const who = { a, b };
  const data = {};
  const sctx = { ...ctx, inSet: false };
  const open = pick(['camp.open'], who, data, sctx, 'bedroom', `${salt}|open`);
  const close = pick([`camp.close.${outcome}`], who, data, sctx, 'bedroom', `${salt}|close`);
  // the voter knows their own mind; now and then the nominee reads the room instead
  const h = [...salt].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const pdr = outcome !== 'worn' && h % 10 < 3;
  const dr = pick([pdr ? `camp.pdr.${outcome}` : `camp.vdr.${outcome}`], who, data, sctx, 'bedroom', `${salt}|dr`);
  // only the people in this conversation speak in it: the engine's beat can carry the other
  // voters' answers too ('Axel: No.' 'Hicks: No.' in a pitch to Brightly alone)
  const inScene = new Set(ps);
  const body = (beat.lines || []).filter(l => l && l.text && (!l.by || inScene.has(l.by))).map(l => ({ kind: l.kind === 'dr' ? 'dr' : l.kind === 'beat' ? 'beat' : 'say', by: l.by || null, text: l.text }));
  if (!body.length && beat.text) body.push({ kind: 'beat', by: null, text: String(beat.text).replace(/<[^>]+>/g, '') });
  const room = open?.room || ['bedroom', 'backyard', 'kitchen', 'living-room'][h % 4];
  // the engine's own Diary Room (if it wrote one) closes the scene in place of ours: a Diary
  // Room cut in the middle of the conversation, then the conversation going on, read as two scenes
  const talk = body.filter(l => l.kind !== 'dr');
  const ownDr = body.filter(l => l.kind === 'dr');
  const lines = [...(open ? render(open, who, ctx, data) : []), ...talk, ...(close ? render(close, who, ctx, data) : []), ...(ownDr.length ? ownDr : dr ? render(dr, who, ctx, data) : [])];
  const c = beat.pitchCase || {};
  const cw = CASE_WHY[c.kind];
  const why = [`${a} is on the block, campaigning to ${b}.`,
    ...(cw ? [fillWhy(cw, who, { target: c.target, partner: c.partner, alliance: c.alliance })] : []),
    fillWhy(OUTCOME_WHY[outcome] || OUTCOME_WHY.unmoved, who, {}), ...standings([a, b])];
  return { id: `camp:${ctx.week?.num || 0}:${salt}`, line: null, type: 'campaign', step: 'pitch', outcome, room, roomName: ROOM[room] || 'Bedroom',
    cast: [a, ...along, b], mood: 'campaign', at, fixedRoom: !!open?.room, recap: false, lineId: open?.id || null, why, lines };
}

// ── the engine's own moments ───────────────────────────────────────────
// The user, 2026-10-06: "make sure the engine's really necessary events don't get ignored".
// Measured over three seasons: an alliance picking its target, recruiting votes, a plan being
// told, paranoia, a grudge hardening, a veto plea, a lie coming apart, the house taking sides,
// blame after a vote — every one aired 0% of the time, because none of them is a storyline
// step. They carry their own words (the engine wrote them), so they air as they are: a short
// scene in the room it happened in, with the panel saying what it was.
const FAMILY_WHY = [
  [/campaign|vote-pitch|nom-eve/, 'Campaigning: somebody working a vote before Thursday.'],
  [/^bloc-/, 'Alliance planning: who the group is voting for, and who it needs.'],
  [/^plan-|^deals-numbers|count/, 'Counting votes.'],
  [/^deals-/, 'A deal between them.'],
  [/^alliance-/, 'Inside an alliance.'],
  [/^scheme-/, 'A scheme.'],
  [/^power-|^reign-/, 'Power: the HOH and what it does to the house.'],
  [/^veto-|^phase-lobby-veto|^phase-replacement/, 'The veto, and who it could save or send up.'],
  [/^fallout-/, 'The fallout from the last vote.'],
  [/^arc-|^followup-/, 'Something earlier in the week, catching up with them.'],
  [/^phase-/, 'Where the week has got to.'],
  [/^social-paranoia|^social-grudge/, 'What one of them now believes about another.'],
  [/^social-/, 'How they stand with each other.'],
  [/^jury-/, 'The jury.'],
];
export function writeEngineScene(beat, ctx, at) {
  const present = ctx.present || [];
  const speakers = (beat.lines || []).map(l => l?.by).filter(Boolean);
  // everybody the moment uses: its players, and anybody who speaks in it
  const cast = [...new Set([...(beat.players || []), ...speakers])].filter(n => present.includes(n));
  if (!cast.length) return null;
  let lines = (beat.lines || []).filter(l => l && l.text).map(l => ({ kind: l.kind === 'dr' ? 'dr' : l.kind === 'beat' ? 'beat' : 'say', by: l.by || null, text: l.text }));
  if (!lines.length) {
    const t = String(beat.text || '').replace(/<[^>]+>/g, '').trim();
    if (!t) return null;
    lines = [{ kind: 'beat', by: null, text: t }];
  }
  // nobody speaks who is not in the scene
  if (lines.some(l => l.by && !cast.includes(l.by))) return null;
  // a moment about somebody who has since walked out of the front door, in the present tense
  // ('not while Scary Girl is sitting in my chair', aired after Scary Girl was evicted), is stale
  const left = ctx.week?.evicted;
  if (left && !present.includes(left) && lines.some(l => nameIn(left, l.text) && !/evict|gone|left|leav|vote|jury|goodbye|miss|door|out of here/i.test(l.text))) return null;
  // the person a moment is ABOUT is not in the room for it: somebody named in another
  // person's line, who says nothing and does nothing on screen, is talked about, not talked to
  // (an audit, 2026-10-06: 'Bowie's going up. Guaranteed.' with Bowie on the sofa; a pitch
  // against Damien in the HOH room with Damien sitting in it)
  const said = new Set(lines.filter(l => l.by).map(l => l.by));
  const named = (n, ls) => ls.some(l => nameIn(n, l.text));
  for (const n of [...cast]) {
    if (said.has(n) || named(n, lines.filter(l => l.kind === 'beat'))) continue;
    if (named(n, lines.filter(l => l.kind !== 'beat'))) cast.splice(cast.indexOf(n), 1);
  }
  if (!cast.length) return null;
  const id = String(beat.eventId || '');
  // a house meeting is the whole house in the living room, whoever speaks
  const meeting = /house-meeting|meeting-crash/.test(id) && !/meeting-crash/.test(id);
  // what they are doing says where they are: breakfast is not made in the backyard
  const allText = lines.map(l => l.text).join(' ');
  const kitchen = /\b(breakfast|making (?:dinner|lunch|tea|coffee|toast)|the dishes|washing up|the fridge|the oven|the stove|cooking)\b/i.test(allText);
  const room = meeting ? 'living-room' : kitchen ? 'kitchen' : ROOM[beat.location] ? beat.location : 'living-room';
  if (meeting) for (const n of present) if (!cast.includes(n)) cast.push(n);
  const fam = FAMILY_WHY.find(([re]) => re.test(id))?.[1];
  const badge = beat.badgeText ? `${String(beat.badgeText).charAt(0)}${String(beat.badgeText).slice(1).toLowerCase()}.` : null;
  const why = [...(badge ? [badge] : []), ...(fam ? [fam] : []), ...standings(cast)];
  const sc = { id: `ev:${ctx.week?.num || 0}:${ctx.stretch}:${id}:${cast.join('>')}`, line: null, type: 'event', step: id, outcome: 'any',
    room, roomName: ROOM[room] || 'Living Room', cast, mood: /blow|grudge|confront|fight/.test(id) ? 'drama' : /^scheme-/.test(id) ? 'scheming' : /^bloc-|^plan-/.test(id) ? 'plan' : 'deals', at, fixedRoom: true, recap: false,
    lineId: beat.lineId || null, why, lines };
  if (/alliance-formed|alliance-forms/.test(id) && beat.allianceName) sc.title = titleOf(beat.allianceName, cast);
  if (id === 'alliance-recruited' && beat.allianceName && beat.joined) sc.title = { kind: 'joined', name: beat.allianceName, members: [beat.joined] };
  const pact = /final-two/.test(id) ? 'Final Two' : /final-three/.test(id) ? 'Final Three' : /jury-pact/.test(id) ? 'To the Jury, Together' : null;
  if (pact && !/compared|exposed|broken|collapse/.test(id)) sc.title = { kind: 'deal', name: pact, members: (beat.players || []).slice(0, pact === 'Final Three' ? 3 : 2) };
  if (meeting) sc.title = { kind: 'meeting', name: 'House Meeting', members: cast.slice(0, 1) };
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
  const MOOD = { firstnight: 'fun', firstbed: 'house', hohroom: 'fun', afternoms: 'ceremony', morningafter: 'house',
    dinner: 'fun', backyard: 'fun', gamenight: 'fun' };
  return { id: `set:${ctx.week?.num || 0}:${ctx.stretch}:${type}`, line: null, type: 'set', step: type, outcome: 'any',
    room, roomName: ROOM[room] || 'Living Room', cast, mood: inside.some(sc => sc.type === 'feud') ? 'drama' : MOOD[type] || 'house',
    at, fixedRoom: true, recap: false, lineId: open.id, inside: inside.map(sc => sc.id), lines };
}
