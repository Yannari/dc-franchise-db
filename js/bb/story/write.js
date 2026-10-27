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
//   days  not move-in day (week one before the first HOH)
//   vote  an eviction vote has happened this season
// The writer skips an entry whose presumptions are false.
//
// The words draw from their own dice (stableRng), never the engine's.

import { gs } from '../../core.js';
import { pickEntry, newLedger } from '../../script/pick.js';
import { fill, said, writing } from '../script/write.js';
import { factsFor } from '../script/facts.js';
import { stableRng } from '../knowledge.js';
import { causeOf } from './storylines.js';
import { STORY_POOLS } from './lines/index.js';
import { getBond } from '../../bonds.js';
import { addInsight } from './voice.js';
import { addThemeTexture } from './theme-texture.js';
import { pickTone, voiceLine, variantOf } from './register.js';
import { spotFor, onIsland, openingAt, SPOTS } from './places.js';
import { pStats } from '../../players.js';

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
  'hohweek.plan.pawn': '{a} is Head of Household. The plan: {c} is the real target, and {d} goes up beside {c} as a pawn, someone the house should not vote out.',
  'hohweek.plan.backdoor': '{a} is Head of Household. The plan is a backdoor: {c} and {d} go up, the veto takes one of them down, and {e} goes up in the empty chair with no veto left to play for.',
  'hohweek.plan.two': '{a} is Head of Household. The plan: no pawn. {c} and {d} both go up as real targets, and either one leaving is a win.',
  'hohweek.plan.pair': '{a} is Head of Household. The plan: split a pair. {c} and {d} go up together so neither can save the other, and one of them leaves.',
  'hohweek.plan.ally': '{a} is Head of Household. The plan: {c} is the target, and {d}, {c}\'s closest ally, goes up too so nobody is free to campaign for {c}.',
  'hohweek.plan.quiet': '{a} is Head of Household. The plan: the safe week. {c} and {d} are names the house agrees on, so nobody comes after {a} for it.',
  'hohweek.pawn.agree': '{a} asks {b} to be the pawn next to {c}, the real target. {b} says yes, on {a}\'s promise.',
  'hohweek.pawn.refuse': '{a} asks {b} to be the pawn next to {c}. {b} says no.',
  'hohweek.pawn.decoy': '{a} is planning a backdoor: {b} and {c} go up only so the veto can empty a chair, and {e} goes up in it.',
  'hohweek.backdoor.landed': '{a}\'s backdoor worked: the veto was used, and {c} went up in the empty chair with no veto left to play for.',
  'hohweek.backdoor.confront': '{a} was backdoored by {b}: put up as the replacement, with no veto left to play for.',
  'hohweek.backdoor.liedto': '{a} was backdoored by {b}, who told {a} earlier in the week that {a} was safe.',
  'hohweek.backdoor.unused': '{a}\'s backdoor on {c} needed the veto used. {d} kept it, so {c} is safe and the block stays as it was.',
  'hohweek.backdoor.dodged': '{a}\'s backdoor on {c} is dead: {c} won the veto, and a veto holder cannot be put up.',
  'hohweek.backdoor.missed': '{a} meant to put {c} up in the empty chair, but {d} went up instead.',
  'hohweek.switch.pitch': '{a} changes the plan: {e} came up with a name, and the target is now {d}, not {c}.',
  'votemeet.together': '{group} meets to settle the vote. {a} organised it: the plan is {target}.',
  'votemeet.split': '{group} meets to settle the vote, and {a} wants {target}. {c} says yes in the room, and will vote the other way.',
  'hohweek.switch.self': '{a} changes the plan: {c} was the target, came up to the HOH room and made a case, and now it is {d} instead.',
  'hohweek.switch.bloc': '{a} changes the plan: {d} is part of a group that sticks together, and breaking it matters more than {c}.',
  'hohweek.fish.honest': '{b} is {a}\'s real target, and goes to the HOH room to ask. {a} tells the truth.',
  'hohweek.fish.deflect': '{b} is {a}\'s real target, and goes to the HOH room to ask. {a} will not say.',
  'hohweek.fish.lie': '{b} is {a}\'s real target, and goes to the HOH room to ask. {a} lies, so {b} does not spend the week campaigning.',
  'hohweek.float.any': '{a} is playing the floater\'s game: stay off the HOH\'s radar, ask for nothing, and let the bigger players be the targets.',
  'hohweek.plan3.pawn': '{a} is Head of Household, and it is a Block Buster week: three go up and one wins their way off. The plan: {c} is the target, {d} a pawn, and {f} the second name in case {c} wins the Block Buster.',
  'hohweek.plan3.targets': '{a} is Head of Household, and it is a Block Buster week: three go up and one wins their way off. The plan: {c}, {d} and {f} all go up, so whoever wins, somebody {a} wants gone is still on the block.',
  'hohweek.plan3.backdoor': '{a} is Head of Household, and it is a Block Buster week. The plan is a backdoor: {c}, {d} and {f} go up, the Block Buster and the veto take two of them off, and {e} goes up in the empty chair with nothing left to play for.',
  'hohweek.verdict.done': '{a}\'s HOH worked: {c} was the target, and {c} was evicted.',
  'hohweek.verdict.missed': '{a}\'s HOH failed: {c} was the target and is still in the house.',
  'hohweek.verdict.pawn': '{a}\'s HOH backfired: {d}, the pawn, was evicted, and {c}, the real target, is still here.',
  'hohweek.verdict.changed': '{a} nominated {c} as the target, then used the veto on {c}. {d}, the replacement, went home instead.',
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
  'style.social': '{a} plays socially: time with everyone, so nobody wants to vote {a} out.',
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
  return d <= 0 ? 'earlier today' : d === 1 ? 'yesterday' : 'the other day';
}

// an HOH or a veto, in a week already played or this week's so far
const hasWon = (n, ctx) => (gs.bb?.weeks || []).some(w => w !== ctx.week && (w.hoh === n || w.vetoWinner === n))
  || ctx.hoh === n || (ctx.veto && ctx.week?.vetoWinner === n);
function presumed(entry, ctx, who = null) {
  for (const p of entry.presumes || []) {
    // guests: neither of the two is the HOH (read 2026-10-14: the HOH asked "I saw you up in the HOH room
    // earlier. For forty minutes?" about their own room)
    if (p === 'guests' && who && ctx.hoh && [who.a, who.b].includes(ctx.hoh)) return false;
    if (p === 'hoh' && !ctx.hoh) return false;
    // days: the house has lived together for more than an afternoon (a row about "every morning" aired on
    // move-in night, read 2026-10-15)
    if (p === 'days' && (ctx.week?.num || 0) <= 1 && !ctx.hoh) return false;
    if (p === 'noms' && !(ctx.nominees || []).length) return false;
    // the week's place, for a line that asks about the next step of it (the user, 2026-10-24: "Are you
    // putting me up if you win HOH?", said to the HOH after the nomination ceremony)
    if (p === 'nohoh' && ctx.hoh) return false;
    if (p === 'hohc' && !(ctx.hoh && who && who.c === ctx.hoh)) return false;
    if (p === 'nonoms' && (ctx.nominees || []).length) return false;
    if (p === 'offblock' && who && (ctx.nominees || []).includes(who.a)) return false;
    if (p === 'precer' && ctx.cer) return false;
    if (p === 'preveto' && ctx.veto) return false;
    if (p === 'vote' && !(gs.bb?.weeks || []).some(w => w !== ctx.week && w.evicted)) return false;
    if (p === 'jurors' && !(ctx.jurors > 0)) return false;
    // won: {a} has really won something (the user, 2026-10-26, on "Because I keep winning?" from somebody who had
    // won nothing: "he didnt won one time hes just a threat based on his stat")
    if (p === 'won' && !(who?.a && hasWon(who.a, ctx))) return false;
    // ...and nowon: {a} says they have not ("I haven't won anything", the user, 2026-10-26: "but she won two comp")
    if (p === 'nowon' && who?.a && hasWon(who.a, ctx)) return false;
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

// ...but a season reads the memory AS IT WAS WHEN THE SEASON BEGAN, never the live one. The live one
// gains every scene this season airs, so a season rebuilt from week one (a re-run, a resumed season:
// docs/ADDING-A-SHOW.md §11.5 N) avoided the scenes its own first airing had put there, and the weeks
// already watched came back in other words (tests/bb-teams.test.js, "byte-identical", red since
// October). The snapshot is kept on the season, so a checkpoint carries it, and in storage under the
// season's salt, so a season started again from the same seed begins from the same memory.
const SEEN_START_KEY = 'bb-story-seen-start';
const SEEN_START_MAX = 8;
const seenSets = new WeakMap();   // gs.bb -> its snapshot as a Set (gs.bb itself keeps only the array: it is saved)
function seenBefore() {
  const bb = gs.bb;
  if (!bb) return new Set();
  if (!Array.isArray(bb.seenBefore)) {
    const salt = String(bb.seasonSalt || 0);
    let starts = {};
    try { starts = JSON.parse(globalThis.localStorage?.getItem(SEEN_START_KEY) || '{}') || {}; } catch { starts = {}; }
    if (!Array.isArray(starts[salt])) {
      starts[salt] = [...seenAcross()];
      try {
        const keep = Object.fromEntries(Object.entries(starts).slice(-SEEN_START_MAX));
        globalThis.localStorage?.setItem(SEEN_START_KEY, JSON.stringify(keep));
      } catch { /* storage is a convenience */ }
    }
    bb.seenBefore = starts[salt];
  }
  let set = seenSets.get(bb);
  if (!set) seenSets.set(bb, set = new Set(bb.seenBefore));
  return set;
}

// a line's text and its versions in each register (register.js variantOf): a slot any of them names must be filled
const textsOf = t => [t.say || t.dr || t.beat || '', ...Object.values(t.v || {})].join(' ');

// The week's Head of Household competition, once it has been played: its name ({comp}) and who finished
// near the bottom, so a scene about doing badly in a comp is only about somebody who did (the user,
// 2026-10-15: "are we sure there was a Pressure Cooker comp where Ara did bad?")
function compOf(ctx) {
  const c = ctx?.hoh && ctx.week?.hohCompetition;
  const order = (c?.placements || []).filter(Boolean);
  if (!c?.name || order.length < 4) return null;
  return { name: c.name, low: order.slice(-Math.max(2, Math.floor(order.length / 3))) };
}
const withComp = (data, ctx) => {
  const c = compOf(ctx);
  return c && data.comp === undefined ? { ...data, comp: c.name } : data;
};

function pick(keys, who, data, ctx, room, salt, freshOnly = false) {
  const pools = {};
  data = withComp(data, ctx);
  // an entry that names something the scene does not have ({alliance} on an unnamed pact,
  // {c} with no third person) is not a candidate: it would print the raw slot
  const can = e => (e.turns || []).every(t => (!t.by || !!who[t.by]) && [...textsOf(t).matchAll(/\{(\w+)(?:\.\w+)?\}/g)]
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
  // a pact the engine named (a final two, a jury pact) is only told by a scene that makes that deal
  const sameDeal = e => !e.deal || !data.pact || e.deal === data.pact;
  for (const k of keys) pools[k] = (STORY_POOLS[k] || []).filter(e => presumed(e, ctx, who) && can(e) && fits(e) && voters(e) && sameDeal(e));
  // nothing airs twice in a season while something unused still fits
  const used = ledger().uses || {};
  // inside a set piece the room is the set's: a scene that stages its own room waits, unless nothing else
  // fits; and a moment inside a set piece is never a rerun (the season read, 2026-10-13: the one roomless
  // banter scene played inside twelve set pieces). With nothing fresh, the set piece goes without it.
  if (ctx.inSet) for (const k of keys) { const free = pools[k].filter(e => !e.room && !used[e.id]); pools[k] = free.length ? free : pools[k].filter(e => !used[e.id]); }
  if (!keys.some(k => pools[k].length)) return null;
  // a caller with another way to write the moment asks for something unaired, or nothing
  if (freshOnly && !keys.some(k => pools[k].some(e => !used[e.id]))) return null;
  for (const k of keys) { const unused = pools[k].filter(e => !used[e.id]); if (unused.length) pools[k] = unused; }
  // what this viewer saw in recent seasons waits while something new still fits
  const seen = seenBefore();
  if (seen.size) for (const k of keys) { const fresh = pools[k].filter(e => !seen.has(e.id)); if (fresh.length) pools[k] = fresh; }
  const facts = factsFor({ who, data, room }, { week: ctx.week, act: 'house', hoh: ctx.hoh, nominees: ctx.nominees });
  const comp = compOf(ctx);
  for (const r of ['a', 'b', 'c']) facts[`low${r.toUpperCase()}`] = !!(comp && who[r] && comp.low.includes(who[r]));
  facts.words = !data.about || ['joke', 'snap', 'condescend', 'story'].includes(data.about);
  const rng = stableRng(gs.bb?.seasonSalt || 0, ctx.week?.num || 0, 'story', salt);
  const speakers = Object.values(who).filter(Boolean);
  const pairKey = [who.a, who.b].filter(Boolean).sort().join('|');
  const clock = (ctx.week?.num || 0) * 10 + (ctx.stretch || 0);
  const key = keys.length > 1 ? keys : keys[0];
  // the version of the scene that fits the person leading it (register.js): a blunt fighter gets
  // the heated row, an anxious player the awkward one
  const full = Object.fromEntries(keys.map(k => [k, pools[k]]));
  // ...but once a pool has all aired this season, the tone would narrow it to the same entry every time
  // (the read of 2026-10-13: one campaign close eight times): a spent pool rotates whole, least-used first
  for (const k of keys) if (pools[k]?.length > 1 && pools[k].some(e => !used[e.id])) pools[k] = pickTone(pools[k], who, regKey(ctx));
  // the tone is a preference: when the picker's own rules leave nothing in the fitted set, the
  // whole set is tried (a recap went missing when it was narrowed away)
  const got = pickEntry(ledger(), pools, key, facts, pairKey, rng, speakers, clock, { fresh: true }) || pickEntry(ledger(), full, key, facts, pairKey, rng, speakers, clock, { fresh: true });
  if (got) noteAcross(got.id);
  return got;
}

// which of a houseguest's registers they speak in (register.js registerOf): one per stretch of the week,
// so the tone a scene was picked for, its lines' versions and the stock replies all agree
const regKey = ctx => `bb|${ctx?.week?.num || 0}|${ctx?.stretch || 0}`;
const render = (entry, who, ctx, data) => entry.turns.map(t => {
  const kind = t.dr ? 'dr' : t.beat ? 'beat' : 'say';
  const by = t.by ? who[t.by] || null : null;
  data = withComp(data, ctx);
  const text = said(kind, fill(variantOf(t, by, regKey(ctx)) ?? (t.dr || t.beat || t.say), who, { hoh: ctx.hoh }, data));
  // a line may open on a slot ("{when}, {a} made a joke...") — a sentence starts with a capital
  return { kind, by, text: text.replace(/^(["'(…\.\s]*)([a-z])/, (m, p, ch) => p + ch.toUpperCase()) };
});

// A stable shuffle of the house (the words' own dice, never the engine's).
function shuffled(list, salt) {
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'story-cast', salt);
  return list.map(n => [rng(), n]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
}
// The room a scene's own words put it in (the user, 2026-10-06: "fit the conversation in the
// necessary location"): a scene that opens "Storage room." or happens at the bathroom mirror,
// over the slop, or while making breakfast is played in that room, whatever the event recorded.
// The opening line naming a room wins; then what they are doing.
/** @type {[string, RegExp, RegExp?][]} */
const ROOM_WORDS = [
  ['storage-room', /^(the )?(storage room|pantry)\b/i, /\b(storage room|the pantry|the shelves|restacking|cereal box)\b/i],
  ['bathroom', /^(the )?(bathroom|washroom)\b/i, /\b(the mirror|brushing (?:their|his|her|my) teeth|the shower|bathroom|washroom|the sink in the bathroom)\b/i],
  ['have-not-room', /^(the )?have-not room\b/i, /\b(have-not room|the slop|on slop)\b/i],
  ['diary-room', /^(the )?diary room\b/i, null],
  ['hoh-room', /^(the )?hoh room\b/i, /\b(up in the hoh room|on the hoh bed)\b/i],
  ['bedroom', /^(the )?bedroom\b/i, /\b(after lights out|lights out|under the duvet|in bed|on the bed|on (?:a|his|her|their|the next) bed|on the bunk)\b/i],
  ['backyard', /^(the )?(backyard|yard|pool)\b/i, /\b(the hammock|the pool|the loungers?|the grass|laps of the (?:backyard|yard))\b/i],
  ['kitchen', /^(the )?kitchen\b/i, /\b(breakfast|making (?:dinner|lunch|tea|coffee|toast)|the dishes|washing up|the fridge|the oven|the stove|cooking)\b/i],
  ['living-room', /^(the )?living room\b/i, null],
];
// The room every stage direction of a scene puts it in, not only the first (read 2026-10-15: tc.l7 has them on a
// bed three beats in, and the scene was moved to the kitchen for variety). Dialogue is left out: "I was in bed"
// says where somebody was, not where the scene is.
const stagedIn = entry => entry?.room || roomFromText((entry?.turns || []).filter(t => t.beat).map(t => ({ kind: 'beat', text: t.beat })));

export function roomFromText(lines) {
  const ls = (lines || []).filter(l => l && l.text);
  const first = ls.find(l => l.kind === 'beat');
  if (first) for (const [room, opens] of ROOM_WORDS) if (opens.test(String(first.text).trim())) return room;
  const all = ls.filter(l => l.kind !== 'dr').map(l => l.text).join(' ');
  for (const [room, , doing] of ROOM_WORDS) if (doing && doing.test(all)) return room;
  return null;
}

// ── witnesses: the people watching a row say where they stand ─────────────
// js/bb/witness.js decides who and which way, in the engine; this only says it. Their lines go in
// before the scene's closing confessionals, and they join the scene. A witness who is not in the
// house any more, or a row whose two people are not both on screen, gets nothing.
// a row the scene's own words make private (a shut door, pulled aside, whispered) has nobody watching,
// and a row one of them walked out of has nobody left to answer
const PRIVATE_TEXT = /shuts? the door|closes? the door|door,? shut|pulls? .{1,30} aside|out of earshot|alone together|whisper|lowers? (?:his|her|their) voice|keeps? (?:his|her|their) voice down/i;
const LEFT = /\b(gets up and goes|goes to the|walks out|walks off|storms (?:off|out)|leaves the room|and leaves)\b/i;
function addWitnesses(sc, ws, ctx) {
  if (!sc || !Array.isArray(sc.lines) || !Array.isArray(ws) || !ws.length) return sc;
  if (sc.lines.some(l => PRIVATE_TEXT.test(String(l.text || '')))) return sc;
  if (sc.lines.some(l => l.kind === 'beat' && LEFT.test(String(l.text || '')) && ws.some(w => nameIn(w.a, l.text) || nameIn(w.b, l.text)))) return sc;
  const present = new Set(ctx.present || []);
  const add = [];
  const cast = [...sc.cast];
  for (const w of ws.slice(0, 2)) {
    if (!present.has(w.name) || !sc.cast.includes(w.a) || !sc.cast.includes(w.b) || sc.cast.includes(w.name)) continue;
    // somebody the background already walked through the room is not standing in the middle of it
    if (sc.lines.some(l => l.bg && nameIn(w.name, l.text))) continue;
    // a jab: c stands up for the one on the receiving end, or goes along with the one doing it
    const jab = w.kind === 'joke' && w.stance !== 'out';
    const key = jab ? (w.a === w.doer ? 'witness.join' : 'witness.defend') : `witness.${w.stance}`;
    const who = { a: w.a, b: w.b, c: w.name };
    // a shouting match has its own lines too; a quiet row never hears "lower your voice"
    const shouty = sc.lines.filter(l => l.kind === 'say' && /!/.test(String(l.text || ''))).length >= 2;
    const keys = !jab && w.kind === 'loud' && shouty && w.stance !== 'out' ? [key, `${key}.loud`] : [key];
    const e = pick(keys, who, {}, ctx, sc.room, `${sc.id}|wit|${w.name}`);
    if (!e) continue;
    const r = render(e, who, ctx, {});
    add.push(...r);
    cast.push(w.name);
    // a witness who walks one of them out of the room ends it: nobody answers the next witness from the
    // corridor (read 2026-10-14: "Emmah walks out with Owen", then Owen: "Wow. Okay. Good to know.")
    if (r.some(l => l.kind === 'beat' && LEFT.test(String(l.text || '')) && (nameIn(w.a, l.text) || nameIn(w.b, l.text)))) break;
  }
  if (!add.length) return sc;
  let k = sc.lines.length; while (k > 0 && sc.lines[k - 1].kind === 'dr') k--;
  sc.lines.splice(Math.max(1, k), 0, ...add);
  sc.cast = [...new Set(cast)];
  sc.witnessed = ws.filter(w => sc.cast.includes(w.name)).map(w => ({ ...w }));
  return sc;
}

/**
 * Later, the one a witness went against (or the friend a witness would not back) brings it up
 * with them. Whether the witness apologises or stands by it is theirs: loyalty and a cool head
 * say sorry, the bold and the hot-headed do not. Words only: the bonds already moved in the engine.
 */
export function writeWitnessAfter(w, ctx, at) {
  const letDown = w.stance === 'out' ? w.a : w.b;
  const other = w.stance === 'out' ? w.b : w.a;
  const present = ctx.present || [];
  if (![letDown, w.name, other].every(n => present.includes(n))) return null;
  const s = pStats(w.name);
  const roll = stableRng(gs.bb?.seasonSalt || 0, 'witness-after', ctx.week?.num || 0, w.name, letDown)();
  const lean = ((s.loyalty ?? 5) * 0.5 + (s.temperament ?? 5) * 0.4 - (s.boldness ?? 5) * 0.3) + (w.stance === 'turned' ? 1 : 0) + (roll - 0.5) * 2;
  const outcome = lean >= 3.6 ? 'sorry' : 'stand';
  const key = `witness.after.${w.stance}.${outcome}`;
  if (writing.muted) return null;
  const who = { a: letDown, b: w.name };
  const salt = `wa|${ctx.week?.num || 0}|${ctx.stretch}|${w.name}|${letDown}`;
  const entry = pick([key], who, { x: other }, ctx, null, salt);
  if (!entry) return null;
  const sp = spotFor('witness.after.apology', [letDown, w.name], ctx, salt, JSON.stringify(entry.turns));
  const stagedW = stagedIn(entry);
  let room = (stagedW && stagedW !== 'diary-room' ? stagedW : null) || sp?.room || 'kitchen';
  if (!sp && !stagedW && ctx.avoidRoom) {
    const ROTA = ['kitchen', 'living-room', 'backyard', 'bedroom'].filter(r => r !== ctx.avoidRoom);
    room = ROTA[[...salt].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7) % ROTA.length];
  }
  const lines = render(entry, who, ctx, { x: other });
  /** @type {BB.Scene} */ const sc = { id: `wa:${ctx.week?.num || 0}:${ctx.stretch}:${letDown}>${w.name}`, line: null, type: 'feud', step: 'witness-after', outcome,
    room, roomName: sp?.label || ROOM[room] || 'Kitchen', ...(sp ? { spot: sp.spot } : {}), cast: [letDown, w.name], mood: 'drama', at,
    fixedRoom: false, recap: false, lineId: entry.id,
    why: [w.stance === 'out' ? `${w.name} stayed out of ${letDown}'s fight with ${other}.` : `${w.name} took ${other}'s side against ${letDown}.`] };
  sc.lines = sp ? lines : background(lines, sc, ctx, sc.id, false);
  return staging(sc);
}

// ── the vote talk: the eviction, before it happens (bb/story/votetalk.js says who and why) ──
const VT_MOOD = k => (/^(bb\.)?plan/.test(k) ? 'plan' : /^(swing|bb\.split)/.test(k) ? 'deals' : 'drama');
export function writeVoteTalk(t, ctx, at) {
  return writeKeyed(`vote.${t?.kind}`, t, ctx, at, { id: `vt:${ctx.week?.num || 0}:${t?.kind}`, step: `vote.${t?.kind}`, mood: VT_MOOD(String(t?.kind || '')),
    spotKind: String(t?.kind || '').startsWith('read') ? 'target.count' : 'plan.vote' });
}

/** A running gag or a week of an arc (bb/story/arcs.js): its own pool, its own people. */
export function writeArcScene(t, ctx, at) {
  return writeKeyed(t?.key, t, ctx, at, { id: `arc:${ctx.week?.num || 0}:${t?.key}:${t?.who?.a}`, step: t?.key,
    mood: /run\./.test(t?.key) ? 'fun' : /payback\.end\.payback|payback\.vow/.test(t?.key) ? 'drama' : 'house', spotKind: 'arc' });
}

// one pool, one set of people, the room their words say or a place for them (vote talk, arcs)
function writeKeyed(key, t, ctx, at, o) {
  if (!key || !STORY_POOLS[key]?.length || writing.muted) return null;
  const who = t.who, data = t.data || {};
  if (Object.values(who).some(n => !(ctx.present || []).includes(n))) return null;
  const salt = `${o.id}|${Object.values(who).join('>')}`;
  const entry = pick([key], who, data, ctx, null, salt);
  if (!entry) return null;
  const named = stagedIn(entry);
  const cast = Object.values(who).filter(Boolean);
  const sp = named ? null : spotFor(o.spotKind, cast, ctx, salt, JSON.stringify(entry.turns));
  let room = (named && named !== 'diary-room' ? named : null) || sp?.room || null;
  if (!room) {
    const ROTA = ['kitchen', 'living-room', 'backyard', 'bedroom'].filter(r => r !== ctx.avoidRoom);
    room = ROTA[[...salt].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7) % ROTA.length];
  }
  const lines = render(entry, who, ctx, data);
  // on stage: who speaks, or who a stage direction names (an optional third person who says nothing is not there)
  const used = cast.filter(n => lines.some(l => l.by === n || (l.kind === 'beat' && l.text.includes(n))));
  /** @type {BB.Scene} */ const sc = { id: o.id, line: null, type: 'talk', step: o.step, outcome: 'any',
    room, roomName: (sp && room === sp.room ? sp.label : null) || ROOM[room] || 'Living Room', ...(sp && room === sp.room ? { spot: sp.spot } : {}),
    cast: used.length ? used : cast, mood: o.mood, at, fixedRoom: !!entry.room, recap: false, lineId: entry.id, why: t.why || [] };
  const shut = /door|whisper|tap|leans in/i.test(JSON.stringify(entry.turns));
  sc.lines = shut || sc.spot ? lines : background(lines, sc, ctx, sc.id, false);
  return staging(sc);
}

// A scene moved to a spot (places.js) opens there, unless its own first line already sets the scene.
function staging(sc) {
  if (!sc?.spot || !Array.isArray(sc.lines) || sc.lines[0]?.kind === 'beat') return sc;
  const talkers = [...new Set(sc.lines.filter(l => l.by && l.kind === 'say').map(l => l.by))];
  if (talkers.length < 2) return sc;
  const t = openingAt(sc.spot, talkers, sc.id);
  if (t) sc.lines.unshift({ kind: 'beat', by: null, text: t });
  return sc;
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
  // out on the island (the pier, a pond) there is no house around: nobody splashing in the pool
  if (others.length < 2 || !SHARED.has(sc.room) || onIsland(sc.spot)) return lines;
  const who = { x: others[0], y: others[1] };
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'story-bg', salt);
  const out = lines.slice();
  if (rng() < 0.7) {
    // the people around a scene keep the house full, so the room's background rotates once spent;
    // a spoken reaction (bg.react) is left out instead of heard twice
    const e = pick([`bg.${sc.room}`], who, {}, ctx, sc.room, `${salt}|bg`);
    // after the scene's own opening stage direction, or at the very top
    // marked, so the viewer still names the people talking before it shows who else is around
    if (e) out.splice(out[0]?.kind === 'beat' ? 1 : 0, 0, ...render(e, who, ctx, {}).map(l => ({ ...l, bg: true })));
  }
  if (loud) {
    const e = pick(['bg.react'], who, {}, ctx, sc.room, `${salt}|react`, true);
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

// The clash a feud started with (its first friction before this step), or null.
const clashOf = (line, step) => line.type === 'feud' ? line.steps.slice(0, line.steps.indexOf(step)).find(s => s.step === 'friction') || null : null;
// The roles follow the cause. In a feud, the one who starts the argument is the one who was wronged, and the
// one who apologises is the one who did it: the event that fired may have them the other way round, which aired
// a joker yelling about their own joke. A recap of an earlier step reads its roles the same way (read
// 2026-10-15: the recap had Ernesto shouting at Evie, then Evie said sorry).
function feudWho(line, step) {
  let who = { a: step.roles.a, b: step.roles.b, c: step.roles.c };
  const clash = clashOf(line, step);
  if (clash) {
    const offender = clash.roles.a;
    if (step.step === 'argument' && who.a === offender) who = { a: who.b, b: who.a, c: who.c };
    if (step.step === 'apology' && who.b === offender) who = { a: who.b, b: who.a, c: who.c };
  }
  return who;
}
// What a clash was about, as a few words a recap can say ("a fight about {over}")
const OVER = { dishes: 'the dishes', food: 'food', noise: 'the noise at night', space: 'space', condescend: 'the way we talk to each other',
  story: 'a story that kept getting told', snap: 'the way we spoke to each other', joke: 'a joke that went too far' };

/** The scene for one step of a storyline, or null when nothing fits. */
function writeStoryScene0(line, step, ctx) {
  const prior = causeOf(line, step) || null;
  let who = feudWho(line, step);
  // The step the viewer needs told, when they never saw it: its cause, and for an apology or a cold war over a
  // clash that never aired, the clash itself, so "I'm sorry about yesterday" follows what was done yesterday
  const root = clashOf(line, step);
  const told = prior && !prior.aired ? (root && !root.aired && ['apology', 'cold'].includes(step.step) ? root : prior) : null;
  const data = { ...step.data, when: whenOf(told === root && root ? root : prior, step) };
  const about = (root || (prior?.step === 'friction' ? prior : null))?.data?.about;
  if (about && OVER[about]) data.over = OVER[about];
  if (about) data.about = about;
  for (const k of Object.keys(data)) if (data[k] != null && typeof data[k] !== 'string') delete data[k];
  let room = step.room || 'living-room';
  const preShow = step.outcome === 'couple' && line.type === 'showmance'
    && factsFor({ who, data: {}, room }, { week: ctx.week, act: 'house' }).kin === 'together';
  let keys = keysFor(line.type, step.step, step.outcome === 'couple' && line.type === 'showmance' && !preShow ? 'any' : step.outcome);
  // A showmance never goes backwards on screen (read 2026-10-15: Chase and Ripper had the "what are we?" talk
  // twice; Beth and Scary had their first kiss after they had already said what they were). Once the viewer has
  // seen them become a couple, a declare or a spark is the couple being one, and a "first" kiss is not the first.
  if (line.type === 'showmance' && !preShow) {
    const seen = line.steps.slice(0, line.steps.indexOf(step)).filter(s => s.aired);
    const declared = seen.some(s => s.step === 'declare'), kissed = seen.some(s => s.step === 'kiss');
    if (STORY_POOLS['story.showmance.together.any']?.length
      && ((step.step === 'declare' && (step.outcome === 'couple' || declared)) || (step.step === 'spark' && (declared || kissed)))) keys = ['story.showmance.together.any'];
    else if (step.step === 'kiss' && step.outcome === 'first' && (declared || kissed)) keys = keysFor('showmance', 'kiss', 'couple');
  }
  if (!keys.length) return null;
  // A group version is used while it has a scene this season has not aired: the group pools are
  // small, and a spent one used to rotate (the read of 2026-10-14: the cold-tea nominee scene and the
  // dinner campaign speech each aired twice). Spent, the moment stays a conversation for two.
  const who0 = who, keys0 = keys;
  let grouped = false;
  // An alliance of three or more meets as a group: everybody in it is in the room, talking.
  if (line.type === 'alliance' && ['formed', 'checkin', 'leftout'].includes(step.step) && data.alliance && !ctx.inSet) {
    const al = (gs.namedAlliances || []).find(x => x.name === data.alliance);
    const members = (al?.members || []).filter(n => (ctx.present || []).includes(n));
    const gk = `story.alliance.${step.step}.group`;
    if (members.length >= 3 && STORY_POOLS[gk]?.length) {
      const rest = members.filter(n => n !== who.a && n !== who.b);
      who = { a: who.a, b: who.b, c: rest[0], d: rest[1], e: rest[2] };
      keys = [gk]; grouped = true;
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
    const votes = line.type === 'target' && /^(lobby|count|block)$/.test(step.step);
    const extras = (ctx.present || []).filter(n => !taken.has(n) && n !== data.target
      && !(votes && (n === ctx.hoh || (ctx.nominees || []).includes(n))))
      .map(n => [n, (who.a ? getBond(who.a, n) : 0) + (who.b ? getBond(who.b, n) : 0)])
      .sort((x, y) => y[1] - x[1]).map(x => x[0]);
    const roll = stableRng(gs.bb?.seasonSalt || 0, 'story-group', line.id, line.steps.indexOf(step))();
    if (STORY_POOLS[gk]?.length && extras.length && roll < ((ctx.week?.num || 0) <= 2 ? 0.9 : 0.6)) {
      const more = extras.slice(0, 3);
      who = { a: who.a, b: who.b, c: who.c || more.shift(), d: more.shift(), e: more.shift() };
      keys = [gk]; grouped = true;
    }
  }
  const cast = Object.values(who).filter(Boolean);
  const base = { id: `${line.id}#${line.steps.indexOf(step)}`, line: line.id, type: line.type, step: step.step,
    outcome: step.outcome, room, roomName: ROOM[room] || 'Living Room', cast, mood: moodOf(line.type, step.step), at: step.at };
  if (writing.muted) return { ...base, lines: [] };
  // house life (banter, chores, a late night) carries no storyline: a spent pool lets the moment pass
  // instead of airing a scene the season has already had. A feud or an apology still airs.
  // ...and so does the small change of a storyline, a row over a joke or an alliance's check-in: a rerun of
  // the snoring row, word for word, is worse than one fewer (read 2026-10-14)
  const optional = line.type === 'life' || /^(friction|checkin)$/.test(String(step.step || ''));
  let entry = pick(keys, who, data, ctx, room, `${line.id}|${line.steps.indexOf(step)}`, grouped || optional);
  if (!entry && grouped) {
    who = who0; keys = keys0;
    entry = pick(keys, who, data, ctx, room, `${line.id}|${line.steps.indexOf(step)}`, optional);
    base.cast = Object.values(who).filter(Boolean);
  }
  if (!entry) return null;
  // A scene that is set somewhere ("the sink's right there") happens there.
  // Inside a set piece too: a scene that stages its own room ("Bedroom, after lights out") is not
  // folded into the kitchen around it; it is marked, and the director airs it as its own scene
  // (the user, 2026-10-06: "it didn't switch scenes, we were still in the kitchen")
  const named = entry.room ? null : stagedIn({ turns: entry.turns });
  // a conversation that wants privacy goes to one of the places for it (bb/story/places.js): the
  // storage room, the bathroom, or out on the island
  const sp = !entry.room && !named && !ctx.inSet ? spotFor(`${line.type}.${step.step}.${step.outcome}`, base.cast, ctx, base.id, JSON.stringify(entry.turns)) : null;
  const hidden = sp?.room || null;
  if (entry.room || (named && named !== 'diary-room' && named !== room) || hidden) {
    room = entry.room || named || hidden; base.room = room; base.roomName = ROOM[room] || base.roomName; if (ctx.inSet) base.ownRoom = true;
    if (sp && room === sp.room) { base.spot = sp.spot; base.roomName = sp.label; }
  }
  // A scene that does not set its own room moves along if the last scene was in the same one
  // (five bedroom scenes in a row read as one long night). Decided here, BEFORE the background
  // is chosen, so "laps of the backyard" never plays in the living room.
  else if (!ctx.inSet && ctx.avoidRoom && room === ctx.avoidRoom && !named) {
    const ROTA = ['kitchen', 'living-room', 'backyard', 'bedroom'].filter(r => r !== ctx.avoidRoom);
    const h = [...base.id].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
    room = ROTA[h % ROTA.length]; base.room = room; base.roomName = ROOM[room] || base.roomName;
  }
  let lines = render(entry, who, ctx, data);
  // The cause, said plainly, when the viewer never saw it.
  let recap = [];
  if (told) {
    const pw = line.type === 'feud' ? feudWho(line, told) : { a: told.roles.a, b: told.roles.b, c: told.roles.c };
    const saw = n => n && (told.seenBy || []).includes(n) && cast.includes(n);
    // an apology's recap is the apologiser owning what they did (a, in a clash), so the sorry that follows has
    // something to be for
    const by = told === root && step.step === 'apology' && cast.includes(pw.a) ? 'a' : saw(pw.b) ? 'b' : saw(pw.a) ? 'a' : null;
    const who2 = by || 'caption';
    // a couple who walked in together did not start flirting "since last week" (read 2026-10-14: that recap,
    // then "We came in together" in the same scene): theirs is the couple's recap, whatever the step's outcome
    const together = factsFor({ who: pw, data: {}, room }, { week: ctx.week, act: 'house' }).kin === 'together';
    const tAbout = told.data?.about;
    const rk = [...(together ? [`recap.${line.type}.${told.step}.couple.${who2}`] : []),
      ...(tAbout ? [`recap.${line.type}.${told.step}.about-${tAbout}.${who2}`] : []),
      `recap.${line.type}.${told.step}.${told.outcome}.${who2}`, `recap.${line.type}.${told.step}.${who2}`].filter(k => STORY_POOLS[k]?.length).slice(0, 1);
    const rdata = { ...Object.fromEntries(Object.entries(told.data || {}).filter(([, v]) => typeof v === 'string')), when: data.when, ...(data.over ? { over: data.over } : {}) };
    const re = rk.length ? pick(rk, pw, rdata, ctx, room, `${line.id}|recap|${line.steps.indexOf(step)}`) : null;
    if (re) recap = render(re, pw, ctx, rdata);
  }
  // On stage: the people the scene actually uses — who speaks, or who a stage direction names.
  // (The event's third person is often only somebody the scene never needed.)
  const used = cast.filter(n => lines.some(l => l.by === n || (l.kind === 'beat' && l.text.includes(n))));
  /** @type {BB.Scene} */ const sc = { ...base, cast: used.length ? used : cast, fixedRoom: !!entry.room, recap: recap.length > 0, lineId: entry.id };
  if (!ctx.inSet || base.ownRoom) lines = background(lines, sc, ctx, sc.id, LOUD(line.type, step.step, step.outcome));
  if (recap.length) lines = lines.filter(l => !(l.kind === 'beat' && /^(Earlier|Last week|Yesterday|The other day|Since)\b/.test(String(l.text || ''))));
  sc.lines = [...recap, ...lines];
  sc.why = whyOf(`${line.type}.${step.step}`, STEP_WHY, who, data, sc.cast);
  // an alliance with a name, formed on screen, gets its title (the user, 2026-10-06)
  if (line.type === 'alliance' && step.step === 'formed' && data.alliance) sc.title = titleOf(data.alliance, sc.cast);
  // somebody brought in gets theirs (the user, 2026-10-06: "recruitment and removal from an alliance have a title too")
  if (line.type === 'alliance' && step.step === 'recruit' && data.alliance && data.joined && step.outcome !== 'refused') sc.title = { kind: 'joined', name: data.alliance, members: [data.joined] };
  // a final two, a final three: the deal gets its card (the user, 2026-10-06: "same for final 2/3")
  // (the user, 2026-10-07: 'some final 2 don't get the screen title': a pact scene the engine did not
  // name still makes a deal, and says which one; the card follows the scene)
  const deal = data.pact || entry.deal;
  if (line.type === 'alliance' && step.step === 'formed' && deal && !data.alliance) sc.title = { kind: 'deal', name: deal, members: sc.cast.slice(0, deal === 'Final Three' ? 3 : 2) };
  return sc;
}

// ── game talk: what the house is talking about this week of the game ────
/**
 * One conversation from bb/story/gametalk.js (which says who and why): a Block Buster plan,
 * a nominee's hope for the veto, who has to go before jury, a juror's bitterness, final-two
 * talk, venting or trust. Shaped like a storyline scene, with the room around it.
 */
function writeGameTalk0(talk, ctx, at) {
  const { kind, who, data } = talk;
  const key = `talk.${kind}`;
  if (!STORY_POOLS[key]?.length) return null;
  const salt = `gt|${ctx.week?.num || 0}|${ctx.stretch}|${kind}`;
  let room = 'living-room';
  const cast = Object.values(who).filter(Boolean);
  const base = { id: `talk:${ctx.week?.num || 0}:${ctx.stretch}:${kind}`, line: null, type: 'talk', step: kind, outcome: talk.phase || 'any',
    room, roomName: ROOM[room], cast, mood: kind.startsWith('hohweek.') ? (/fish.lie|backdoor/.test(kind) ? 'scheming' : /verdict.(missed|pawn)|refuse/.test(kind) ? 'drama' : 'plan') : kind.startsWith('bond.vent') || kind === 'style.provocateur' ? 'drama' : kind === 'style.manipulator' ? 'scheming'
      : kind === 'style.strategist' || kind === 'prejury' || kind === 'jury.manage' || kind === 'bb.hoh' ? 'plan' : kind === 'style.social' ? 'fun' : 'deals', at };
  if (writing.muted) return { ...base, lines: [] };
  // game talk is the director's choice of what else to air: a talk whose pool is spent this season
  // does not air again (the read of 2026-10-14: the same style.social scene twice)
  const entry = pick([key], who, data, { ...ctx, phase: talk.phase }, room, salt, true);
  if (!entry) return null;
  const stagedT = stagedIn(entry);
  if (stagedT && stagedT !== 'diary-room') room = stagedT;
  else if (ctx.avoidRoom) {
    const ROTA = ['kitchen', 'living-room', 'backyard', 'bedroom'].filter(r => r !== ctx.avoidRoom);
    room = ROTA[[...salt].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7) % ROTA.length];
  }
  // a scene staged outdoors ("the backyard", "the hammock", "by the pool") is in the backyard
  if (!entry.room && /backyard|hammock|pool|lounger|grass/i.test(entry.turns[0]?.beat || '')) room = 'backyard';
  // ...and a private one that stages nowhere can go somewhere private (bb/story/places.js)
  const staged = entry.room || /backyard|hammock|pool|lounger|grass/i.test(entry.turns[0]?.beat || '') || stagedT;
  const sp = staged ? null : spotFor(`talk.${kind}`, cast, ctx, salt, JSON.stringify(entry.turns));
  if (sp) room = sp.room;
  const lines = render(entry, who, ctx, data);
  // the one a conversation is about is not standing in it: named in a stage direction AND talked about in
  // the third person, they are the subject (read 2026-10-14: "Scary is trying to talk Ripper into a move
  // against Chase", with Chase in the cast while Ripper says "I told Chase I'd never come after him")
  const spokenOf = n => lines.some(l => l.kind !== 'beat' && l.by !== n && nameIn(n, l.text));
  const used = cast.filter(n => lines.some(l => l.by === n) || (lines.some(l => l.kind === 'beat' && nameIn(n, l.text)) && !spokenOf(n)));
  /** @type {BB.Scene} */ const sc = { ...base, room, roomName: sp?.label || ROOM[room] || 'Living Room', cast: used.length ? used : cast, fixedRoom: !!entry.room, recap: false, lineId: entry.id,
    ...(sp ? { spot: sp.spot } : {}) };
  // private talk is private: the room around it only where people would be (never a shut door)
  // (an alliance settling its vote is private whatever its words say: "making a sandwich very slowly, so she can stay
  // and listen" walked into one)
  const shut = kind === 'bond.vent' || /^votemeet\./.test(kind) || /door shut|closes the door|shuts the door|door,? shut|voices? (low|down)|whisper|quiet/i.test(JSON.stringify(entry.turns));
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
  // ...unless every one of them answers it: the same case taken round two or three voters (week.js,
  // engine.samecase) opens on the first, who hears it first (read 2026-10-14: a pitch opened on Emmah
  // and Caleb answered it)
  const answers = n => (beat.lines || []).some(l => l && l.by === n && l.kind !== 'dr' && l.kind !== 'beat');
  const round = ps.length > 2 && answers(ps[1]);
  const a = ps[0], b = ps.length > 1 ? (round ? ps[1] : ps[ps.length - 1]) : null;
  if (!a || !b) return null;
  const along = round ? ps.slice(2) : ps.slice(1, -1);
  let outcome = beat.pitchOutcome || (beat.badgeClass === 'green' ? 'receptive' : 'unmoved');
  // a return visit whose first visit never aired is a first visit to the viewer: the case and a yes, not
  // "I know you said no yesterday" (read 2026-10-15, three times a season)
  let said = beat.lines || [];
  if (outcome === 'worn' && !beat.firstAired && Array.isArray(beat.caseLines) && beat.caseLines.length) { outcome = 'receptive'; said = beat.caseLines; }
  const who = { a, b };
  const data = {};
  const sctx = { ...ctx, inSet: false };
  // the opening, the closing push and the Diary Room wrap the engine's own case and reply: a spent
  // pool leaves its piece out (the read of 2026-10-14: 31 pitch lines heard twice in one season)
  const open = pick(['camp.open'], who, data, sctx, 'bedroom', `${salt}|open`, true);
  // (a case taken round several voters has its own ending, voter by voter: a closing push after it had the
  // first voter say "I'll think about it" and then "You should save your energy")
  const close = round ? null : pick([`camp.close.${outcome}`], who, data, sctx, 'bedroom', `${salt}|close`, true);
  // the voter knows their own mind; now and then the nominee reads the room instead
  const h = [...salt].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const pdr = outcome !== 'worn' && h % 10 < 3;
  const dr = pick([pdr ? `camp.pdr.${outcome}` : `camp.vdr.${outcome}`], who, data, sctx, 'bedroom', `${salt}|dr`, true);
  // only the people in this conversation speak in it: the engine's beat can carry the other
  // voters' answers too ('Axel: No.' 'Hicks: No.' in a pitch to Brightly alone)
  const inScene = new Set(ps);
  const body = said.filter(l => l && l.text && (!l.by || inScene.has(l.by))).map(l => ({ kind: l.kind === 'dr' ? 'dr' : l.kind === 'beat' ? 'beat' : 'say', by: l.by || null, text: l.text }));
  if (!body.length && beat.text) body.push({ kind: 'beat', by: null, text: String(beat.text).replace(/<[^>]+>/g, '') });
  const room = open?.room || ['bedroom', 'backyard', 'kitchen', 'living-room'][h % 4];
  // the engine's own Diary Room (if it wrote one) closes the scene in place of ours: a Diary
  // Room cut in the middle of the conversation, then the conversation going on, read as two scenes
  const talk = body.filter(l => l.kind !== 'dr');
  // ...and only from somebody the viewer saw in it, by a line or a beat: a voter met off screen does not
  // close it (read 2026-10-25: Beth and Caleb in a bedroom, closed by "Owen (dr): I could tell I wasn't
  // the first"; a round of two, closed by a third who never appeared)
  const seen = n => n === a || n === b || talk.some(l => l.kind === 'say' ? l.by === n : String(l.text).includes(n));
  const ownDr = body.filter(l => l.kind === 'dr' && seen(l.by));
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
/** @type {[RegExp, string][]} */
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
function writeEngineScene0(beat, ctx, at) {
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
  // on screen in a stage direction means doing something in it ("Bowie walks in", "Caleb and Bowie..."):
  // a beat that only mentions them ("Bowie's key", "the look they give Bowie") is talking about them too
  const esc = n => String(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const acts = (n, ls) => ls.some(l => new RegExp(`(^|[.!?]\\s+|\\band\\s+|,\\s+)${esc(n)}\\b(?!'s)`).test(String(l.text || '')));
  for (const n of [...cast]) {
    if (said.has(n) || acts(n, lines.filter(l => l.kind === 'beat'))) continue;
    if (named(n, lines.filter(l => l.kind !== 'beat'))) cast.splice(cast.indexOf(n), 1);
  }
  if (!cast.length) return null;
  const id = String(beat.eventId || '');
  // a house meeting is the whole house in the living room, whoever speaks
  const meeting = /house-meeting|meeting-crash/.test(id) && !/meeting-crash/.test(id);
  // what they are doing says where they are: breakfast is not made in the backyard, and a scene
  // that opens "Storage room." is in the storage room
  const textRoom = roomFromText(lines);
  // a moment that happens AT a place on the island (bb-events/island-life.js) is played there, whatever its words say
  const at0 = beat.spot && SPOTS[beat.spot] ? { spot: beat.spot, ...SPOTS[beat.spot] } : null;
  const sp = at0 || (!meeting && !textRoom ? spotFor(id, cast, ctx, `${ctx.week?.num || 0}|${ctx.stretch}|${id}|${cast.join('>')}`, JSON.stringify(lines)) : null);
  const hiddenRoom = sp?.room || null;
  const room = at0 ? at0.room : meeting ? 'living-room' : textRoom && textRoom !== 'diary-room' ? textRoom : hiddenRoom || (ROOM[beat.location] ? beat.location : 'living-room');
  if (meeting) for (const n of present) if (!cast.includes(n)) cast.push(n);
  const fam = FAMILY_WHY.find(([re]) => re.test(id))?.[1];
  const badge = beat.badgeText ? `${String(beat.badgeText).charAt(0)}${String(beat.badgeText).slice(1).toLowerCase()}.` : null;
  const why = [...(badge ? [badge] : []), ...(fam ? [fam] : []), ...standings(cast)];
  /** @type {BB.Scene} */ const sc = { id: `ev:${ctx.week?.num || 0}:${ctx.stretch}:${id}:${cast.join('>')}`, line: null, type: 'event', step: id, outcome: 'any',
    room, roomName: (sp && room === sp.room ? sp.label : null) || ROOM[room] || 'Living Room', ...(sp && room === sp.room ? { spot: sp.spot } : {}), cast, mood: /blow|grudge|confront|fight/.test(id) ? 'drama' : /^scheme-/.test(id) ? 'scheming' : /^bloc-|^plan-/.test(id) ? 'plan' : 'deals', at, fixedRoom: true, recap: false,
    lineId: beat.lineId || null, why, lines };
  if (/alliance-formed|alliance-forms/.test(id) && beat.allianceName) sc.title = titleOf(beat.allianceName, cast);
  if (id === 'alliance-recruited' && beat.allianceName && beat.joined) sc.title = { kind: 'joined', name: beat.allianceName, members: [beat.joined] };
  const pact = /final-two/.test(id) ? 'Final Two' : /final-three/.test(id) ? 'Final Three' : /jury-pact/.test(id) ? 'To the Jury, Together' : null;
  if (pact && !/compared|exposed|broken|collapse/.test(id)) sc.title = { kind: 'deal', name: pact, members: (beat.players || []).slice(0, pact === 'Final Three' ? 3 : 2) };
  if (meeting) sc.title = { kind: 'meeting', name: 'House Meeting', members: cast.slice(0, 1) };
  // the rest of the house is around for it, the way it is for any conversation in a shared room
  // (loud only when there is a row to hear: a grudge told to the Diary Room alone had the bedroom
  // freezing and mouthing "What is happening?" at nobody, read 2026-10-14)
  const row = new Set(sc.lines.filter(l => l.kind === 'say').map(l => l.by)).size >= 2;
  if (!meeting && cast.length <= 3) sc.lines = background(sc.lines, sc, ctx, sc.id, row && /blow|fight|confront|grudge|snap/.test(id));
  return sc;
}

// ── set pieces: the whole house in one room ─────────────────────────────
const SET_ROOM = { firstnight: 'kitchen', firstbed: 'bedroom', hohroom: 'hoh-room', afternoms: 'living-room',
  morningafter: 'kitchen', evictnight: 'living-room', dinner: 'kitchen', backyard: 'backyard', gamenight: 'living-room' };
// (a quiet aside for the game's two-person talk: "nods at the door" led into a group game of animals, read 2026-10-14)
const CUT = sc => (sc.type === 'feud' ? 'clash' : sc.type === 'showmance' ? 'flirt'
  : /^(alliance|target|scheme|deal)/.test(sc.type || '') && new Set(sc.lines.filter(l => l.kind === 'say').map(l => l.by)).size <= 2 ? 'aside' : 'fun');

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
  const out = new Set(lines.filter(l => l.kind === 'beat' && /\b(goes upstairs|goes back up|goes\.|leaves the room|walks out|heads upstairs)/.test(String(l.text || ''))).flatMap(l => order.filter(n => nameIn(n, l.text))));
  for (const sc of inside) {
    for (const n of sc.cast.filter(n => out.has(n))) { lines.push({ kind: 'beat', by: null, text: `${n} comes back in.` }); out.delete(n); }
    const cw = { a: sc.cast[0], b: sc.cast[1] || sc.cast[0] };
    // (one that opens on its own stage direction has its own way in: both put Millie in two places, read 2026-10-14)
    const cut = sc.lines[0]?.kind === 'beat' ? null : pick([`set.cut.${CUT(sc)}`], cw, {}, sctx, room, `${salt}|cut|${sc.id}`);
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
  const MOOD = { firstnight: 'fun', firstbed: 'house', hohroom: 'fun', afternoms: 'ceremony', morningafter: 'house', evictnight: 'drama',
    dinner: 'fun', backyard: 'fun', gamenight: 'fun' };
  return { id: `set:${ctx.week?.num || 0}:${ctx.stretch}:${type}`, line: null, type: 'set', step: type, outcome: 'any',
    room, roomName: ROOM[room] || 'Living Room', cast, mood: inside.some(sc => sc.type === 'feud') ? 'drama' : MOOD[type] || 'house',
    at, fixedRoom: true, recap: false, lineId: open.id, inside: inside.map(sc => sc.id), lines };
}

// ── every scene ends in the speaker's own voice (voice.js) ──
// The user, 2026-10-07: "the house life dialogue is generic too, fix it the same way". The scene's
// closing confessional gains a sentence in the speaker's voice about the other person in it, from
// their history together (a nomination, a saved veto, votes cast alike, a shared alliance or deal).
// Words only; nothing in the game moves.
const voiced = (sc, kind, ctx) => {
  if (!sc || writing.muted || !sc.lines?.length) return sc;
  // every line in the speaker's register (register.js), then the closing confessional in their voice
  // (each with the line it answers: "No." to "Is it about me?" is a fact, not a refusal)
  // ...and the line after it, which may quote it back ("Okay." "Just okay?")
  // (the rest of the scene, the Diary Room too: "I know." voiced "I know! Right?", then "And 'I know' is even worse")
  // ...and now and then a line of the season it is (theme-texture.js): AINSLEY's camera, the Den's door, the whistle
  if (/fight|feud|argument|apolog|makeup|breakup|declare|cold|grudge|snap|block|goodbye|backdoor|blame|confront|blow|betray|exposed/.test(String(kind || ''))) return addThemeTexture(addInsight(sc, kind, ctx?.week?.num), kind, ctx);
  sc.lines = sc.lines.map((l, i) => voiceLine(l, sc.id, sc.lines.slice(0, i).reverse().find(x => x.kind === 'say'),
    { text: sc.lines.slice(i + 1).filter(x => x.kind !== 'beat').map(x => x.text).join(' ') }, regKey(ctx)));
  return addThemeTexture(addInsight(sc, kind, ctx?.week?.num), kind, ctx);
};
export function writeStoryScene(line, step, ctx) {
  return staging(addWitnesses(voiced(writeStoryScene0(line, step, ctx), `${line?.type}.${step?.step}`, ctx), step?.witnesses, ctx));
}
export function writeGameTalk(talk, ctx, at) {
  return staging(voiced(writeGameTalk0(talk, ctx, at), String(talk?.kind || ''), ctx));
}
export function writeEngineScene(beat, ctx, at) {
  return staging(addWitnesses(voiced(writeEngineScene0(beat, ctx, at), String(beat?.eventId || ''), ctx), beat?.witnesses, ctx));
}
