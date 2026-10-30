// ══════════════════════════════════════════════════════════════════════
// pm/script.js — an event becomes a short scene
// ══════════════════════════════════════════════════════════════════════
//
// A pool entry is a SCRIPT: at most one line of staging, a few turns of real
// dialogue, a closing beat (spec §16.5). The engine has already decided what
// happened; this file only picks words for it. So it draws from its own dice
// stream — a line can never change a result — and it may only test the facts
// in FACT_KEYS, each from the speaker's own point of view (§7): a speaker who
// names what {c} did must be somebody who knows it.
//
// The row stores strings, never a pool reference it has to re-resolve.
import { players } from '../core.js';
import { pronounsOf } from '../pronouns-of.js';
import { SHOWS } from '../shows.js';
import { streamFor } from '../dr/rng.js';
import { stepOf, believedStep, situationship } from './ladder.js';
import { emo, attachmentLabel } from './emotions.js';
import { romance, shown } from './feelings.js';
import { heartOf, backTogether } from './just-friends.js';
import { FIREPIT_LINES } from './lines/firepit.js';
import { FINAL_LINES } from './lines/final.js';
import { CHALLENGE_LINES } from './lines/challenges.js';
import { LIE_LINES } from './lines/lie-detector.js';
import { JOURNEY_LINES } from './lines/journey.js';
import { ANSWER } from './lines/answer.js';
import { RULES_LINES } from './lines/challenge-rules.js';
import { HUT } from './lines/hut.js';
import { HUT_VOLUME } from './lines/hut-volume.js';
import { HUT_VOLUME_2 } from './lines/hut-volume-2.js';
import { HUT_VOLUME_3 } from './lines/hut-volume-3.js';
import { HUT_VOLUME_4 } from './lines/hut-volume-4.js';
import { HUT_CONFRONT } from './lines/hut-confront.js';
import { NARRATOR } from './lines/narrator.js';
import { NARRATOR_STORY } from './lines/narrator-story.js';
import { STEAMY_NARRATOR } from './lines/steamy.js';
import { ICEBREAKER_CARDS } from './lines/kiss-games.js';
import { DIALECTS, slotWord, US_SPELLING, US_SPELLERS, ESL_EXPANSIONS } from './lines/dialect.js';
import { TALK } from './talk/index.js';
import { afterOf, tierOf, registerOf } from './story/director.js';

// What still plays from the old pools: the host and the texts at the fire
// pit, the final and the reunion, the ballots, the challenge texts and rules,
// the lie detector's parts and the journey's clips. Every conversation is
// pm/talk/ (a kind with a talk file never reads a pool here).
export const POOLS = { ...FIREPIT_LINES, ...FINAL_LINES, ...CHALLENGE_LINES, ...LIE_LINES, ...JOURNEY_LINES, ...ANSWER, ...RULES_LINES };
// More beach-hut lines for the scenes that cut away most (lines/hut-volume.js).
for (const more of [HUT_VOLUME, HUT_VOLUME_2, HUT_VOLUME_3, HUT_VOLUME_4, HUT_CONFRONT]) for (const [st, v] of Object.entries(more)) HUT[st].push(...v);
// The voiceover over a steamy scene (lines/steamy.js).
for (const [k, v] of Object.entries(STEAMY_NARRATOR)) NARRATOR[k] = [...(NARRATOR[k] || []), ...v];
export { HUT, NARRATOR };

// ── how a speaker sounds ───────────────────────────────────────────
// The old voice overlays (lines/voices/, a copy of every line per voice tag)
// were retired with the 2026-10-22 rebuild: they clipped lines into fragments
// nobody could follow ("Why?! This?! Go!"). A speaker's voice now chooses
// which whole movement they get (pm/story/director.js registerOf, the facts
// `reg` and `bReg`), never a broken copy of a neutral one.

export const SPEAKERS = ['a', 'b', 'c', 'dior', 'narrator'];
export const FACT_KEYS = ['known', 'sameStart', 'weeks', 'since', 'reclaim', 'staying', 'came', 'another', 'ago', 'behind', 'friction', 'chose', 'rung', 'thinks', 'persona', 'intent', 'attachment', 'mood', 'bombshell',
  'early', 'coupled', 'gap', 'knows', 'faking', 'bPersona', 'bMood', 'bRung', 'stance', 'family',
  'choice', 'cause', 'channel', 'grudge', 'stole', 'bTaken', 'archetype', 'taken', 'loyal', 'late', 'gender', 'bGender', 'myRung', 'phase', 'kind', 'role', 'withB', 'newArrival', 'dialect',
  'comfortedYesterday', 'rowedBefore', 'rowedToday', 'feels', 'of', 'knowsB', 'verdict', 'noticed',
  'reason', 'split', 'guessed', 'stoleFrom', 'full', 'hasQuote', 'rank', 'cast', 'justMet', 'rebuffed', 'heard', 'kissed', 'promised', 'sec', 'lastBy', 'theirs', 'going', 'nth', 'exes', 'leaving', 'what', 'heat', 'game', 'why', 'risk',
  // the director (pm/story/director.js): how each one sounds, how much is shown, what it follows
  'reg', 'bReg', 'tier', 'after', 'afterBy', 'afterWhen', 'end', 'firstKiss', 'bPartnered', 'fresh', 'bFresh',
  // a couple who are only friends now, at the final (pm/just-friends.js); how a break-up was taken
  'mates', 'took', 'exPick',
  // the fire pit: a partner picked from under {c}; one's own taken back from {c}
  'tookFrom', 'reclaimFrom', 'leftFrom', 'afterNo',
  // how long a's and b's couples have stood; whether b was in the villa before a walked in
  'newCouple', 'bNewCouple', 'bFirst',
  // a couple that broke up and got back together; and did it in the last few days
  'again', 'backNow',
  // a graft watched by the CHASER's partner: {c} went after {d}, not the other way round
  'chaser',
  // a challenge's evening (pm/challenge-frame.js): how the partner took it at the time; a graft started from the kiss
  'watched', 'started',
  // how a Sports Day event was won (clean · fall · cheat)
  'how',
  // a Couple Goals board: the same couple named as the board before
  'again',
  // a placing read out (Couple of Sorts, the Blindfold Course): place, and out of how many
  'place', 'of2',
  // the postcard a was sent from the other villa this Casa (pm/postcards.js): kiss · bed · pull · game · close · alone
  'postcard',
  // a talk file's own (pm/talk/*.js facts())
  'hasWith', 'seen', 'casa', 'light', 'closedOff', 'sincere', 'spark', 'bFeels', 'believed', 'dayOne', 'side',
  // Casa Amor: who this scene concerns is in the other villa, and which villa it is in
  'paAway', 'pbAway', 'cAway', 'dAway', 'xAway', 'atCasa',
  // who a debrief is about has left the show tonight: talked about, never faced tomorrow
  'cGone',
  // the storylines (pm/threads.js): which story a beat is in, and what a group chat is about
  'story', 'subj', 'final', 'score', 'paKissed', 'lowScore', 'choosing', 'said', 'bSour',
  // what today did to a couple (sourOf): 'mine' (a did it), 'theirs' (b did), 'row', or null
  'sour',
  // an intro tape's (pm/talk/intro.js)
  'look', 'vibe', 'ick', 'interest', 'from', 'kinOf', 'eyes', 'pastEx', 'hasAge', 'hasJob', 'hasTown', 'into', 'shape'];

// Archetype groups a pool may name instead of listing them (CLAUDE.md).
export const VILLAINS = ['villain', 'mastermind', 'schemer'];
export const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

const partnerOf = (state, n) => { const c = state.couples.find(x => x.includes(n)); return c ? (c[0] === n ? c[1] : c[0]) : null; };

/** The one mood a line may lean on — the loudest feeling, or none. Narration only. */
export function moodOf(state, n) {
  const e = emo(state, n);
  const jealous = Math.max(0, ...Object.values(e.jealousy || {}));
  const loud = [['jealous', jealous], ['heartbroken', e.heartbreak], ['stressed', e.stress - 2],
    ['guilty', e.guilt], ['lonely', e.loneliness - 1]].sort((x, y) => y[1] - x[1])[0];
  if (loud[1] >= 4) return loud[0];
  return e.security >= 7 ? 'secure' : null;
}

/**
 * What `viewer` knows about `subject`'s secrets: what they saw, what they were
 * told as the partner, and what was shown to the whole villa. Nothing else.
 */
export function knowsAbout(state, viewer, subject) {
  return state.secrets.some(s => s.who === subject && (s.witnesses.includes(viewer)
    || (s.known && s.partner === viewer) || s.public));
}

const faking = (state, a, b) => b != null && shown(state, a, b) - romance(a, b) >= 3;

/** The only facts a script's `when` may test. */
export function factsFor(state, ev) {
  // The host alone (her opening, her explanations): nobody's facts to read.
  if (!ev.players.length) return { phase: ev.phase || null, of: ev.extra?.of ?? null, cast: 0 };
  const [a, b, c] = ev.players;
  const pa = state.profiles[a], pb = b ? state.profiles[b] : null;
  const firstEp = state.ledger?.firstEp?.[a] ?? state.ep;
  const f = {
    rung: b ? stepOf(state, a, b) : null,
    thinks: b ? believedStep(state, a, b) : null,
    persona: pa?.persona || null,
    intent: pa?.intent || null,
    attachment: pa ? attachmentLabel(pa) : null,
    mood: moodOf(state, a),
    bombshell: pa ? pa.role !== 'starter' : false,
    early: state.ep - firstEp <= 1,
    coupled: !!b && partnerOf(state, a) === b,
    gap: !!b && (situationship(state, a, b) || situationship(state, b, a)),
    knows: !!c && knowsAbout(state, a, c),
    faking: faking(state, a, b),
    bPersona: pb?.persona || null,
    bMood: b ? moodOf(state, b) : null,
    bRung: b ? stepOf(state, b, a) : null,
    // Taken is a heart elsewhere: a partner who is only a friend now is not one (just-friends.js).
    bTaken: !!b && !!heartOf(state, b) && heartOf(state, b) !== a,
    archetype: players.find(p => p.name === a)?.archetype || null,
    taken: !!heartOf(state, a) && heartOf(state, a) !== b,
    // Where a stands with a's OWN partner — for scenes where b is somebody else.
    myRung: partnerOf(state, a) ? stepOf(state, a, partnerOf(state, a)) : null,
    // Narration only: a threshold picks words, never an outcome (CLAUDE.md).
    loyal: (pa?.stats?.loyalty ?? 5) >= 7,
    late: state.ep >= 9,                     // "weeks" is only true from here
    // A line says "the girls" or "the lads" only when the roster says so.
    gender: players.find(p => p.name === a)?.gender || null,
    bGender: b ? players.find(p => p.name === b)?.gender || null : null,
  };
  f.phase = ev.phase || null;
  f.dialect = dialectOf(state, a);
  // What really happened between these two, from the record — the only way a
  // line may mention an earlier moment (user: "fix what? … is this even true?").
  Object.assign(f, b ? historyFacts(state, a, b) : { comfortedYesterday: false, rowedBefore: false });
  // With a's partner when the scene is a's alone (a plea at the front).
  f.sour = sourOf(state, a, b ?? partnerOf(state, a));
  // …and b with b's own partner, when that is somebody else (a bombshell's date
  // asking "how are things with {pb}?" on the night of the photos).
  f.bSour = b && partnerOf(state, b) && partnerOf(state, b) !== a ? sourOf(state, b, partnerOf(state, b)) : null;
  // Whether a has really kissed a's own partner yet: a line may only remember
  // a kiss that happened (season read 2026-10-25: "I just kissed Molly so I
  // didn't have to say anything", the morning before their first kiss).
  const mine = partnerOf(state, a);
  const kissedMine = e => e.kind === 'kiss' && e.players.includes(a) && e.players.includes(mine);
  // A snogger kiss he scored seven or under: nobody grins about that one.
  f.lowScore = ev.extra?.score != null && ev.extra.score <= 7;
  f.paKissed = !!mine && ((state.history || []).some(kissedMine) || (state._today || []).some(kissedMine));
  // They argued earlier today — this scene is the making up, not a fresh start.
  // (An argument scene itself is excluded: it IS the row.)
  // (Not after having it out over a telling: the making-up lines are for a
  // row about nothing much, "and agree it was about nothing" — events.js
  // keeps that couple's warm scenes off for the day instead.)
  f.rowedToday = !!b && (state._today || []).some(e => e.ep === state.ep && e !== ev && e.kind === 'argument'
    && e.players.includes(a) && e.players.includes(b));
  // Somebody walked in today (a bombshell, Casa's arrivals) — not day one.
  f.newArrival = state.ep > 1 && (state.villa || []).some(n => state.ledger?.firstEp?.[n] === state.ep);          // morning, day, event (the challenge), evening, firepit…
  // How much a feels for b, in words a line can lean on (narration only):
  // "not yet" is somebody who cares; a real no is somebody who doesn't.
  if (b) { const r = romance(a, b); f.feels = r >= 6 ? 'strong' : r >= 3 ? 'some' : 'little'; } else f.feels = null;
  // …and how much b feels for a, the same way: whether it is said back.
  if (b) { const r = romance(b, a); f.bFeels = r >= 6 ? 'strong' : r >= 3 ? 'some' : 'little'; } else f.bFeels = null;
  for (const k of ['choice', 'cause', 'channel', 'grudge', 'of', 'noticed', 'reason', 'guessed', 'theirs', 'going', 'nth', 'exes', 'what', 'heat', 'game', 'why', 'another', 'ago', 'behind', 'friction', 'chose', 'since', 'staying', 'came', 'risk', 'side', 'subj', 'final', 'score', 'choosing', 'said', 'mates', 'took', 'exPick']) if (ev.extra?.[k] != null) f[k] = ev.extra[k];
  f.story = ev.extra?.thread?.type || null;
  // A recoupling "steal" of the chooser's own partner from before tonight.
  f.reclaim = !!ev.extra?.reclaim;
  // A steal at the recoupling: {c} is the one who loses {b}.
  f.stoleFrom = !!ev.extra?.stole;
  // Picked with the partner still on the bench to choose: {c} is that partner (moments.js).
  f.tookFrom = !!ev.extra?.tookFrom;
  // Taking one's own partner back from {c}, who picked them earlier tonight.
  f.reclaimFrom = !!(ev.extra?.reclaim && ev.extra?.stole);
  // Picking somebody new with one's own partner {c} sitting there; choosing again after {c} said no.
  f.leftFrom = !!ev.extra?.leftFrom;
  f.afterNo = !!ev.extra?.afterNo;
  // Night one's ranking: the pair at the top, or anybody below it.
  f.rank = ev.extra?.rank == null ? null : ev.extra.rank === 1 ? 'top' : 'lower';
  f.split = !!state.split;             // Casa Amor is on
  // A scene about a secret knows when it happened: "earlier" is today's, not last week's.
  if (ev.extra?.secret && f.ago == null) {
    const sec = (state.secrets || []).find(z => z.id === ev.extra.secret);
    if (sec) f.ago = sec.ep === state.ep ? 'today' : 'days';
  }
  // …and who this scene concerns is in the OTHER villa (user, 2026-10-26: "it
  // acts like the old players are still in the same house even though they got
  // separated"): talked about, never placed in the room (presentFits below).
  // (Not at the fire pit: Casa's return is the two villas back in one place.)
  if (state.split && ev.phase !== 'firepit') {
    const villaOf = n => (state.casa?.includes(n) ? 'casa' : 'villa');
    const awayFrom = n => !!n && n !== a && (state.villa || []).includes(n) && villaOf(n) !== villaOf(a);
    f.paAway = awayFrom(partnerOf(state, a));
    f.pbAway = !!b && awayFrom(partnerOf(state, b));
    f.cAway = awayFrom(c);
    f.dAway = awayFrom(ev.players[3]);
    f.xAway = awayFrom(ev.extra?.about || ev.extra?.x || null);
    // Which villa the scene is in (where its lead is).
    f.atCasa = villaOf(a) === 'casa';
  }
  // One of them walked in THIS episode: night one for everybody, a bombshell's
  // first day. They have known each other for hours.
  const arrivedNow = n => n != null && (state.ledger?.firstEp?.[n] ?? state.ep) === state.ep;
  f.justMet = arrivedNow(a) || (!!b && arrivedNow(b));
  // Which of them is the new one: "when you walked in" needs b to have walked in.
  f.fresh = state.ep > 1 && arrivedNow(a);
  f.bFresh = state.ep > 1 && !!b && arrivedNow(b);
  // A couple that formed in the last episode or so (about four days): not one that
  // has "built something" (user, season 1: Mei and Riza, coupled the night before,
  // talked about as if they had been together since day one).
  const newWith = n => { const p = n && heartOf(state, n);
    const since = p ? state.coupledSince?.[[n, p].sort().join('|')] : null;
    return since != null && (state.day ?? since) - since <= 4; };
  f.newCouple = newWith(a);
  f.bNewCouple = !!b && newWith(b);
  // b was already in the villa when a arrived: only then "the second you walked in".
  f.bFirst = !!b && (state.ledger?.firstEp?.[b] ?? 0) < (state.ledger?.firstEp?.[a] ?? 0);
  // a and a's partner broke up once and are back together (just-friends.js rekindle).
  const back = partnerOf(state, a) ? backTogether(state, a, partnerOf(state, a)) : null;
  f.again = !!back;
  f.chaser = !!ev.extra?.chaser;
  f.backNow = !!back && (back.day == null || state.day == null ? state.ep - back.ep <= 1 : state.day - back.day <= 4);
  // Everyone in it — and a's partner — has been in the villa two episodes or
  // more: only then is "for days" true (season 33: Ellie, in two days and
  // coupled that night, "hasn't been feeling it for days").
  const inFor = n => n == null || state.ep - (state.ledger?.firstEp?.[n] ?? state.ep) >= 2;
  f.known = inFor(a) && inFor(b) && inFor(partnerOf(state, a));
  // Walked in on the same night: only then is "remember how nervous we were
  // when we walked in" theirs (season 33: Josh, day 5, and Nadia, day 15).
  f.sameStart = !!b && (state.ledger?.firstEp?.[a] ?? -1) === (state.ledger?.firstEp?.[b] ?? -2);
  // About two weeks in (six episodes): only then is "the best few weeks of my
  // life" true (season 33: Jess said it on day 8).
  f.weeks = state.ep - (state.ledger?.firstEp?.[a] ?? state.ep) >= 6;
  f.rebuffed = !!ev.extra?.rebuffed;   // a pull b turned down (events.js decides)
  f.kissed = !!ev.extra?.kissed;       // a pull (or a Casa bed) that went further
  f.promised = !!ev.extra?.promised;   // a pull that ended in plans for the outside
  // Gossip carrying a debrief: the teller heard it said (pm/debrief.js), never saw it.
  f.heard = !!(ev.extra?.secret && state.secrets?.find(s => s.id === ev.extra.secret)?.said);
  // Gossip: what kind of thing it was (pull · kiss · bed · said · promise), so
  // a line only says "kissed" about a kiss (talk/gossip.js gates on it).
  f.sec = ev.extra?.secret ? state.secrets?.find(s => s.id === ev.extra.secret)?.kind || null : null;
  f.cast = ev.players.filter(Boolean).length;   // how many are in it, when one is optional
  f.withB = !!b;                       // somebody else is in the scene
  f.hasQuote = !!clipSlots(state, ev).quote;   // the replayed clip has a line to quote
  // Snog Marry Pie with all three answers ({b} snog, {c} marry, {d} pie).
  f.full = ev.kind === 'snog-marry-pie' && !!(ev.extra?.snog && ev.extra?.marry && ev.extra?.pie);
  // Has a SEEN what b did, or only feels it? "I saw you" needs the first.
  f.knowsB = !!b && knowsAbout(state, a, b);
  // A friend's read on somebody's partner, in words (advice scenes).
  if (typeof ev.extra?.verdict === 'number') f.verdict = ev.extra.verdict > 0.2 ? 'good' : ev.extra.verdict < 0 ? 'bad' : 'unsure';   // ~35 / 25 / 40, measured
  // …or a decision in words (told-confront: forgive · warning · done).
  else if (typeof ev.extra?.verdict === 'string') f.verdict = ev.extra.verdict;
  if (ev.extra?.believed != null) f.believed = !!ev.extra.believed;
  // The director's (pm/story/director.js): each speaker's register for this
  // scene, how much of it is shown, the earlier scene it follows from ({x} is
  // whoever that was with), and how the engine decided it ends.
  f.reg = registerOf(state, ev, a);
  f.bReg = b ? registerOf(state, ev, b) : null;
  f.tier = ev.tier || null;
  f.after = ev.after?.fam || null;
  f.afterBy = ev.after?.by || null;
  f.afterWhen = ev.after?.when || null;
  f.end = ev.extra?.close == null ? null : ev.extra.close === true ? 'yes' : ev.extra.close;
  f.firstKiss = !!ev.extra?.firstKiss;
  // b has a partner of their own (somebody else's, or a's): "how's it going with {pb}?"
  f.bPartnered = !!b && !!partnerOf(state, b);
  return f;
}

const LOW = ['heartbroken', 'stressed', 'lonely', 'jealous'];
const COMFORT = ['friendship', 'advice', 'solidarity', 'chat', 'deep-chat'];
/**
 * WHAT TODAY DID TO THESE TWO. A telling, a row, a turned head, an honest
 * "I'm not closed off" or an ending: 'mine' when a did the wrong (a was the
 * one told about, a turned, a gave the answer that hurt), 'theirs' when b did,
 * 'row' when it was both or nobody's. Null on a clean day. The fire pit's
 * pleas and goodbyes read it (season read 2026-10-25: Callum, told about
 * Amber that afternoon, pleaded "I've got something real with Amber" and left
 * on "I love you, you know").
 */
export const EXPOSED = new Set(['movie-row', 'photo-row', 'casa-row', 'photos', 'movie-split', 'photo-split']);
export function sourOf(state, a, b) {
  if (!a || !b) return null;
  const pair = (x, y) => (x === a && y === b ? 'theirs' : x === b && y === a ? 'mine' : null);
  let out = null;
  for (const e of state._today || []) {
    if (e.ep !== state.ep) continue;
    const [p0, p1, p2] = e.players;
    // told: p1 was told about p2 (gossip [w, p, x]); confronted: p0 had it out with p1
    const got = e.kind === 'gossip' ? pair(p1, p2)
      : e.kind === 'told-confront' && e.extra?.verdict !== 'forgive' ? pair(p0, p1)
      // Movie Night, the photos, Casa's return: [the one hurt, the one who did it].
      : EXPOSED.has(e.kind) ? pair(p0, p1)
      : e.kind === 'tower-q' && e.extra?.of === 'other-honest' ? pair(p1, p0)
      : e.kind === 'casa-react' && ['devastated', 'turned'].includes(e.extra?.of) ? pair(p0, p1)
      : e.kind === 'movie-clip' && e.extra?.of !== 'loyalty' && e.extra?.audience ? pair(e.extra.audience[0], e.extra.audience[1])
      : e.kind === 'graft-turn' ? pair(p1, p0)
      : e.kind === 'where-head' && !['reassure', 'lie'].includes(e.extra?.of) ? pair(p0, p1)
      : (e.kind === 'argument' || (e.kind === 'doubt-end' && e.extra?.of === 'friends')) && pair(p0, p1) ? 'row'
      : null;
    if (got) out = out && out !== got ? 'row' : got;
  }
  return out;
}

function historyFacts(state, a, b) {
  // The record holds finished episodes (season.js pushes a day when it ends),
  // so "yesterday" is the last episode: one villa day is one episode.
  const out = { comfortedYesterday: false, rowedBefore: false };
  const h = state.history || [];
  for (let i = h.length - 1; i >= 0 && h[i].ep >= state.ep - 1; i--) {
    const e = h[i];
    if (e.ep !== state.ep - 1 || !e.players.includes(a) || !e.players.includes(b)) continue;
    // b was there for a while a was low: a real scene, yesterday.
    if (COMFORT.includes(e.kind) && LOW.includes(e.moods?.[a])) out.comfortedYesterday = true;
  }
  for (const e of h) if (e.kind === 'argument' && e.ep < state.ep && e.players.includes(a) && e.players.includes(b)) { out.rowedBefore = true; break; }
  return out;
}

function matches(when, facts) {
  if (!when) return true;
  for (const [k, want] of Object.entries(when)) {
    const have = facts[k];
    if (Array.isArray(want) ? !want.includes(have) : want !== have) return false;
  }
  return true;
}

// ── the repetition guard ─────────────────────────────────────────────
// Never the same entry twice for one pair in a season, never twice in one
// episode, and discounted for three episodes after: a pool is walked, not looped.
const pairKey = ps => [...ps].sort().join('+');
function usage(state) { return (state.usedScripts ||= {}); }
function weightFor(state, entry, ps, facts) {
  const u = usage(state)[entry.id];
  let w = 1 + Object.keys(entry.when || {}).length;          // the more it fits, the likelier
  if (!u) return w;
  if (u.pairs.includes(pairKey(ps))) return 0;
  // Who somebody IS is theirs alone: two islanders never introduce themselves
  // with the same line (season 33: Marcus and Ellie both "cry at every
  // wedding"). A pool that runs dry still lends one (relaxedWeight).
  if (/^intro[.-]/.test(entry.id)) return 0;
  // Twice in one episode is a repeat the viewer sees, whoever says it.
  const last = u.eps[u.eps.length - 1];
  if (last === state.ep) return 0;
  // Heard already this season: rarer, and much rarer if recent (a pool of four
  // played the same "pick whoever makes you happy" three times in one season).
  w *= state.ep - last <= 3 ? 0.1 : 0.3;
  // …and rarer each time it has been heard: the discount looked only at the
  // last use, so one line of a pool of ten carried six of a season's pile-ins
  // (season 33, 25 episodes — the villa days wear a pool thinner).
  w *= Math.pow(0.5, u.eps.length - 1);
  return w;
}
function noteUse(state, entry, ps) {
  const u = (usage(state)[entry.id] ||= { eps: [], pairs: [] });
  if (u.eps[u.eps.length - 1] !== state.ep) u.eps.push(state.ep);
  const k = pairKey(ps);
  if (!u.pairs.includes(k)) u.pairs.push(k);
  (u.pairEp ||= {})[k] = state.ep;
}
// A spent leading pool may lend a line again, only never to the same pair
// twice in one episode (what the viewer would hear as a loop).
function relaxedWeight(state, entry, ps) {
  const u = usage(state)[entry.id];
  if (u?.pairEp?.[pairKey(ps)] === state.ep) return 0;
  // …and one not yet heard this episode, when there is one.
  return u?.eps[u.eps.length - 1] === state.ep ? 0.05 : 1;
}

/** The words have their own dice: a line can never change what happened. */
function hutRng(state) {
  if (state._hutRngEp !== state.ep) {
    state._hutRng = streamFor(state.seed ?? 1, `hutline:${state.ep}${state.epSalt || ''}`);
    state._hutRngEp = state.ep;
  }
  return state._hutRng;
}
function scriptRng(state) {
  if (state._scriptRngEp !== state.ep) {
    state._scriptRng = streamFor(state.seed ?? 1, `script:${state.ep}${state.epSalt || ''}`);
    state._scriptRngEp = state.ep;
  }
  return state._scriptRng;
}

// Facts that, when true, must lead: a couple who rowed this morning gets a
// making-up scene, never a fresh cosy one that ignores the row.
// `justMet` leads too: two islanders who met today talk like it.
// `rebuffed` leads first: a pull b turned down is a no, whatever else is true.
// `heard`: gossip about something SAID in a debrief, not something seen.
// `stoleFrom` first of all: a pick that takes someone from another islander is
// a steal, whatever else carried it (season 31: "I'm picking Ellie, again" over
// Ellie being taken back from the one who had just picked her).
// `why`: a vote's reason (pm/villa-vote.js motives) — a grudge vote said with a
// line about "nothing you've done" contradicted its own ballot (season 31).
const LEADING = ['mates', 'exes', 'stoleFrom', 'rebuffed', 'heard', 'kissed', 'promised', 'rowedToday', 'justMet', 'heat', 'going', 'why', 'another', 'behind', 'friction'];

// The furthest islander a line names ({c} is the third): a line that names
// somebody the scene has not got never plays (a debrief about a night whose
// third had already left: "I saw {c}'s face", printed raw).
const NAMES = ['a', 'b', 'c', 'd'];
function needs(e) {
  if (e._needs != null) return e._needs;
  const text = [e.stage, e.beat, ...(e.turns || []).map(t => t[1])].filter(Boolean).join(' ');
  let n = 0;
  for (const [, who] of text.matchAll(/\{([abcd])[.}]/g)) n = Math.max(n, NAMES.indexOf(who) + 1);
  for (const t of e.turns || []) if (NAMES.includes(t[0])) n = Math.max(n, NAMES.indexOf(t[0]) + 1);
  Object.defineProperty(e, '_needs', { value: n, enumerable: false });
  return n;
}
const castFits = (e, facts) => facts.cast == null || needs(e) <= Math.max(facts.cast, 1);

// Placing somebody in the room: finding them, going back to them, them looking
// over, sitting on the daybeds, wrapped round somebody. During Casa Amor a line
// that does it to somebody in the other villa never plays (factsFor's *Away).
const PRESENT_SLOTS = { pa: 'paAway', pb: 'pbAway', c: 'cAway', d: 'dAway', x: 'xAway', about: 'xAway' };
const presentRe = slot => new RegExp([
  `(?:find|back to|leaves|left|walks past|walk past|next to|sits with|sat with|kiss|kisses|hug|hugs|cuddle|over to|towards|wave at|waves at|look at|looks at|looking at|in front of) \\{${slot}(?:\\.[a-zA-Z]+)?\\}`,
  `\\{${slot}\\}(?:'s)? (?:is |are |was )?(?:looking|looks|looked|watching|watches|staring|laughing|sitting|sat|busy|right there|over there|on the daybeds|by the pool|in the kitchen|across|spots|walks|walked|comes|came|catches|keeps|hasn't looked|wrapped|is still|has just|gets up|stands|knows I'm|know you're|know you are|is fast asleep|is asleep|beside)`,
  // …or did something with them today: "{pa} laughed at someone's joke earlier".
  // (What they DID — "thinking about {pa} today" is exactly what Casa is for.)
  `\\{${slot}\\} (?:laughed|smiled|looked|said|kissed|walked|went quiet|was laughing|was sitting|was chatting)[^.?!"]{0,60}\\b(?:earlier|this morning|tonight|today)\\b`,
  `wrapped round \\{${slot}\\}`, `[Ww]here's \\{${slot}\\}`, `with \\{${slot}\\} right there`,
  // …and telling them now, before anyone else can: nobody reaches the other villa until the return.
  `tell \\{${slot}\\} before`,
  // …and anywhere in the villa, in the same sentence ("why did {pa} go quiet at dinner?").
  `\\{${slot}\\}[^.?!"]{0,40}(?:at dinner|on the daybeds|by the pool|in the kitchen|across the|at breakfast|on the terrace)`,
].join('|'));
const PRESENT_RE = Object.fromEntries(Object.keys(PRESENT_SLOTS).map(s => [s, presentRe(s)]));
const entryText = e => {
  if (e._text != null) return e._text;
  const turns = (e.turns || []).flatMap(t => (Array.isArray(t) ? [t[1]] : (t.vary || []).flatMap(v => (v.turns || []).map(x => x[1]))));
  const text = [e.stage, e.beat, ...turns].filter(Boolean).join(' ');
  Object.defineProperty(e, '_text', { value: text, enumerable: false });
  return text;
};
// Having watched a couple together, with one of them in the other villa ("I know
// Malik's with Ayesha, I've got eyes", from somebody who arrived after Ayesha left).
const SEEN_TOGETHER = /I've got eyes|I've seen (?:them|the two of them|how they)|everyone can see it/;
// Which villa a line thinks it is in: "back in the villa" is said at Casa, "over at Casa" in the villa.
const SAID_AT_CASA = /back in the villa|the main villa|the other lot back|back at the villa/i;
const SAID_IN_VILLA = /over at Casa|at Casa right now|in Casa right now|what's happening at Casa/i;
const presentFits = (e, facts) => {
  if (!facts.split) return true;
  const text = entryText(e);
  if (Object.entries(PRESENT_SLOTS).some(([slot, flag]) => facts[flag] && PRESENT_RE[slot].test(text))) return false;
  if (SEEN_TOGETHER.test(text) && Object.entries(PRESENT_SLOTS).some(([slot, flag]) => facts[flag] && text.includes(`{${slot}`))) return false;
  if (facts.atCasa === false && SAID_AT_CASA.test(text)) return false;
  if (facts.atCasa === true && SAID_IN_VILLA.test(text)) return false;
  return true;
};
export function pickScript(state, pool, ps, facts, { allowRepeat = true, rng: own = null, lead = true } = {}) {
  pool = pool.filter(e => castFits(e, facts) && presentFits(e, facts));
  // Candidates at each width, narrowest first: the leading pool, then every
  // entry that fits. A spent leading pool widens before it repeats: a couple
  // who rowed and made up five times in one evening heard the same
  // "I hate fighting with you" five times (season 7, night one) because the
  // making-up pool ran dry and the repeat rule fired inside it.
  const widths = [];
  // A movement pool (pm/talk/) is written per fact already: no leading pool,
  // or one opener written for day one plays for every pull on day one.
  for (const k of lead ? LEADING : []) {
    if (!facts[k]) continue;
    const led = pool.filter(e => e.when?.[k] && matches(e.when, facts));
    if (led.length) { widths.push(led); break; }
  }
  const fits = pool.filter(e => matches(e.when, facts));
  widths.push(fits.length ? fits : pool.filter(e => !e.when));
  if (!widths[widths.length - 1].length && !widths[0].length) return null;
  const rng = own || scriptRng(state);
  let cands = null, ws = null;
  for (const [i, w] of widths.entries()) {
    if (!w.length) continue;
    let weights = w.map(e => weightFor(state, e, ps, facts));
    // The leading pool is the scene's truth (a row is followed by making up):
    // spent, it lends a line again before a wider pool forgets the row.
    if (!weights.some(x => x > 0) && i === 0 && widths.length > 1) weights = w.map(e => relaxedWeight(state, e, ps));
    if (weights.some(x => x > 0)) {
      // Walk the pool: while a fitting line has never been heard this season,
      // only those are drawn. A heard line kept 30% of its weight, so a pool
      // with 40 fresh lines of 100 still repeated a third of the time (the user,
      // 2026-10-22: "address the repeats"; 70% of a season's lines were repeats).
      const fresh = weights.map((x, j) => (x > 0 && !usage(state)[w[j].id] ? x : 0));
      if (fresh.some(x => x > 0)) weights = fresh;
      cands = w; ws = weights; break;
    }
  }
  // Every entry already spent on this pair: allow a repeat rather than silence
  // — the one heard longest ago, never one already heard this episode while
  // another is left (season 41: 36 lines twice in one episode, each a pool
  // that ran dry and then drew at random).
  if (!cands) {
    if (!allowRepeat) return null;
    cands = widths.find(w => w.length);
    const lastEp = e => { const u = usage(state)[e.id]; return u ? u.eps[u.eps.length - 1] : -Infinity; };
    const oldest = Math.min(...cands.map(lastEp));
    ws = cands.map(e => (lastEp(e) === oldest ? 1 : lastEp(e) === state.ep ? 0.02 : 0.2));
  }
  let r = rng() * ws.reduce((s, w) => s + w, 0);
  for (let i = 0; i < cands.length; i++) { r -= ws[i]; if (r <= 0) return cands[i]; }
  return cands[cands.length - 1];
}

// ── rendering ────────────────────────────────────────────────────────
const hostName = () => SHOWS['perfect-match'].words.host;
export const narratorName = () => SHOWS['perfect-match'].words.narratorName;
const pro = name => pronounsOf(players.find(p => p.name === name)?.gender || 'nb');

// {pa} and {pb} are a's and b's own partners — for friends talking about
// their couples. A pool may only use one behind `taken` / `bTaken`, so the
// partner is always there to name (tests/pm-lines.test.js).
export function fill(text, ps, partners = {}) {
  const names = { a: ps[0], b: ps[1], c: ps[2], d: ps[3], pa: partners.pa, pb: partners.pb, x: partners.x, about: partners.about };
  // {quote}: the first thing said in the clip being replayed (Movie Night, the reunion).
  if (partners.day != null) text = text.replace(/\{day\}/g, String(partners.day));
  if (partners.card != null) text = text.replace(/\{card\}/g, partners.card);
  // A game's scores, read off the board (talk/challenges.js snogger-row).
  for (const k of ['mine', 'Mine', 'top']) if (partners[k] != null) text = text.split(`{${k}}`).join(partners[k]);
  if (partners.about != null) text = text.replace(/\{about\}/g, partners.about);
  // Night one's two sides, from the scene: who stands in the line (`side`)
  // and who walks in to it. The pools never say "the girls" outright, so the
  // season can bring either side in first (Villa options).
  if (partners.where) {
    const W = { terrace: ['up on the terrace', 'Up on the terrace'], 'dressing-room': ['in the dressing room', 'In the dressing room'] }[partners.where] || ['on the daybeds', 'On the daybeds'];
    text = text.replace(/\{where\}/g, W[0]).replace(/\{Where\}/g, W[1]);
  }
  if (partners.side) {
    const [sides, one, walkers, walkerOne] = partners.side === 'm' ? ['boys', 'boy', 'girls', 'girl'] : ['girls', 'girl', 'boys', 'boy'];
    const cap = w => w[0].toUpperCase() + w.slice(1);
    text = text.replace(/\{side\}/g, sides).replace(/\{Side\}/g, cap(sides)).replace(/\{sideOne\}/g, one)
      .replace(/\{walkers\}/g, walkers).replace(/\{Walkers\}/g, cap(walkers)).replace(/\{walkerOne\}/g, walkerOne);
  }
  if (partners.quote != null) text = text.replace(/\{quote\}/g, partners.quote).replace(/\{quoteWho\}/g, partners.quoteWho);
  if (partners.exchange != null) text = text.replace(/\{exchange\}/g, partners.exchange);
  // An intro tape's own facts, from the character file (pm/talk/intro.js): only
  // what the file says, never invented.
  for (const k of ['age', 'job', 'town', 'one', 'ones']) if (partners[k] != null) text = text.split(`{${k}}`).join(partners[k]);
  return text.replace(/\{(pa|pb|about|a|b|c|d|x)(?:\.(sub|obj|pos|posAdj|ref|Sub|Obj|PosAdj|gf))?\}/g, (m, who, form) => {
    const n = names[who];
    if (!n) return m;
    // {b.gf}: what you ask {b} to be — from the roster, never guessed.
    if (form === 'gf') return { f: 'girlfriend', m: 'boyfriend' }[players.find(p => p.name === n)?.gender] || 'partner';
    return form ? pro(n)[form] : n;
  });
}

/** Where a speaker is from: their cast setup, else the season's default. */
export function dialectOf(state, name) {
  return state?.profiles?.[name]?.dialect || state?.dialect || 'uk';
}
// The host and the voiceover have their own voices (the registry says whose).
const HOST_DIALECT = () => SHOWS['perfect-match'].words.hostDialect || 'us';
const NARRATOR_DIALECT = () => SHOWS['perfect-match'].words.narratorDialect || 'uk';

/** Fill `{~slot}` for this speaker's dialect, then spelling and second-language shaping. */
const hashOf = s => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
export function speak(text, dialect) {
  const info = DIALECTS[dialect] || DIALECTS.uk;
  let out = text.replace(/\{~([A-Za-z-]+)\}/g, (m, key) => {
    const word = slotWord(key.toLowerCase(), dialect);
    if (word == null) return m;
    return key[0] === key[0].toUpperCase() ? word[0].toUpperCase() + word.slice(1) : word;
  });
  if (US_SPELLERS.includes(dialect)) out = out.replace(/[A-Za-z]+/g, w => {
    const us = US_SPELLING[w.toLowerCase()];
    return us ? (w[0] === w[0].toUpperCase() ? us[0].toUpperCase() + us.slice(1) : us) : w;
  });
  if (info.esl) {
    // Decided by the line itself, so the same line always comes out the same.
    const h = hashOf(text);
    if (h % 10 < 5) out = out.replace(/\b(I'm|you're|it's|that's|don't|can't|I've|I'd|we're|isn't)\b/gi,
      w => { const x = ESL_EXPANSIONS[w] ?? ESL_EXPANSIONS[w[0].toLowerCase() + w.slice(1)];
        return x ? (w[0] === w[0].toUpperCase() ? x[0].toUpperCase() + x.slice(1) : x) : w; });
    const own = info.own || [];
    if (own.length && Math.floor(h / 10) % 7 === 0 && out.split(' ').length >= 4 && /^[A-Z]/.test(out)) {
      // A name keeps its capital after the opener ("Allora, valentina asked me" read in a season, 2026-10-26).
      const named = (players || []).some(p => p?.name && new RegExp(`^${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(out));
      const rest = /^I\b/.test(out) || named ? out : out[0].toLowerCase() + out.slice(1);
      out = `${own[Math.floor(h / 70) % own.length]} ${rest}`;
    }
  }
  return out;
}

const speakerName = (who, ps) => who === 'dior' ? hostName() : who === 'narrator' ? narratorName()
  : ps[{ a: 0, b: 1, c: 2, d: 3 }[who]];

// ── replies that depend on who is replying ───────────────────────────
// A turn may be a VARIANT BLOCK instead of [speaker, text]:
//   { by: 'b', vary: [ { when?, turns: [[speaker, text], …], beat? }, … ] }
// The block's `when` is tested from the REPLYING speaker's own point of
// view — `persona` is b's persona, `taken` is b's partner — so the opener
// stays and the answer is the character's. One option has no `when`; it is
// the plain reply, and it has to be good, because it is the one seen most.
const ORDER = { a: 0, b: 1, c: 2, d: 3 };
function asSpeaker(ps, by) {
  const i = ORDER[by] ?? 0;
  return [ps[i], ...ps.filter((_, j) => j !== i)];
}
function pickVariant(state, block, ps) {
  const opts = block.vary;
  if (!state) return opts.find(o => !o.when) || opts[0];
  const facts = factsFor(state, { players: asSpeaker(ps, block.by), extra: {} });
  const fits = opts.filter(o => o.when && matches(o.when, facts));
  if (!fits.length) return opts.find(o => !o.when) || opts[0];
  const best = Math.max(...fits.map(o => Object.keys(o.when).length));
  const top = fits.filter(o => Object.keys(o.when).length === best);
  return top[Math.floor(scriptRng(state)() * top.length)];
}

export function renderScript(entry, ps, state = null, slots = {}) {
  const partners = { ...(state ? { pa: partnerOf(state, ps[0]), pb: ps[1] ? partnerOf(state, ps[1]) : null } : {}), ...slots };
  const f = text => fill(text, ps, partners);
  const lines = [];
  let beat = entry.beat || null;
  const picked = [];
  for (const turn of entry.turns || []) {
    if (Array.isArray(turn)) { lines.push(turn); continue; }
    const v = pickVariant(state, turn, ps);
    picked.push(turn.vary.indexOf(v));
    lines.push(...v.turns);
    if (v.beat) beat = v.beat;
  }
  return {
    id: picked.length ? `${entry.id}:${picked.join('.')}` : entry.id,
    stage: entry.stage ? f(entry.stage) : null,
    lines: lines.map(([who, text]) => {
      const d = who === 'dior' ? HOST_DIALECT() : who === 'narrator' ? NARRATOR_DIALECT()
        : dialectOf(state, ps[ORDER[who]]);
      const out = { who: speakerName(who, ps), text: speak(f(text), d) };
      // For the measuring probes only, never saved: which line this was.
      Object.defineProperty(out, 'base', { value: text, enumerable: false });
      return out;
    }),
    beat: beat ? f(beat) : null,
  };
}

/** A pool that has not been written yet still says who was there and what kind of moment it was. */
const placeholder = kind => ({ id: `${kind}.0`, stage: `{a} — ${kind}.` });

/** The director's call on a scene (pm/story/director.js): what it follows from, and how much of it is shown. */
export function direct(state, ev) {
  // A talk file names the scenes its lines can follow (`after`); one that names
  // none follows none. Every other kind may follow anything (a ceremony's whole script).
  ev.after = afterOf(state, ev, TALK[ev.kind] ? TALK[ev.kind].after || [] : null);
  // A ceremony written as movements (`tiered: false`) is always shown whole.
  ev.tier = tierOf(state, ev, !!TALK[ev.kind] && TALK[ev.kind].tiered !== false);
}

/** The scene for one event. */
export function scriptFor(state, ev) {
  if (TALK[ev.kind]) return talkScript(state, ev, TALK[ev.kind]);
  if (Array.isArray(ev.extra?.parts)) return partsScript(state, ev);
  const pool = POOLS[ev.kind];
  const ps = castOf(ev);
  const entry = pool?.length ? pickScript(state, pool, ps, factsFor(state, { ...ev, players: ps })) : null;
  const e = entry || placeholder(ev.kind);
  noteUse(state, e, ps);
  const opened = renderScript(e, ps, state, clipSlots(state, ev));
  return entry ? closed(state, ev, entry, opened, ps) : opened;
}

// ── how an old-pool scene ends (lines/answer.js, `<kind>-close`) ──────
// A talking scene that opened short gets an ending: the question it stopped
// on answered, then a close picked by what the engine decided the scene did
// (ev.extra.close). The opener's own beat stays where it happened, as an
// action between the lines. A long opener, one with its own branching
// replies, or one that already ends with somebody leaving, is already a scene.
// An ending already there: somebody leaves, or the words run out on the page.
const EXIT = /\b(walks?|walking|goes|gets up|storms|leaves|already on|is up off|goes to bed|rest of the|says anything else|another word|doesn't speak|does not speak)\b/i;
// An argument's question is rhetorical ("Both of them?"): it is answered by the ending, not by a reply.
// A kiss's question ("What was that for?") is answered by what they say after it.
const NO_ANSWER = new Set(['argument', 'loyalty', 'kiss', 'ick', 'comedy', 'gossip']);
// Only a real question about feelings or intentions gets a spoken answer
// ("Do you like me?", "Are we okay?"), never a joke, a request or a
// rhetorical one: season 23 answered "Did you just clap for a sandwich?" with
// "Can I think about that one?", and "Can I pour you a drink?" with "Honestly?
// I don't know yet." — the same six answers, 40 times a season.
const FEELING_Q = /(^|[.!?…,]\s*)(do|are|would|will|could|have) (you|we)\b(?!\s+(just|always|do that|want a|want some))|\bhow do you feel\b|\bwhat do you (want|think of us|feel)\b|\bwhere (is|do you see) (this|us)\b|\bwhat are we\b|\bis this (going|real|a thing)\b/i;
// What the engine decided the scene did, as the answer's colour: yes, not sure, or no.
const ANSWER_OF = { warm: 'yes', open: 'yes', flirt: 'yes', kissed: 'yes', promised: 'yes', easy: 'unsure', guarded: 'unsure', flat: 'no', 'turned-down': 'no' };
function closed(state, ev, entry, opened, ps) {
  const pool = POOLS[`${ev.kind}-close`];
  const close = ev.extra?.close;
  // Four lines is a scene already (measured: with the bar at five, nearly
  // every friendship got an ending, and nine endings played 300 times).
  if (!pool || !close || opened.lines.length >= 4 || (entry.turns || []).some(t => !Array.isArray(t))
    || (opened.beat && EXIT.test(opened.beat))) return opened;
  const facts = factsFor(state, { ...ev, players: ps });
  const last = opened.lines[opened.lines.length - 1];
  const lastBy = !last ? null : last.who === speakerName('a', ps) ? 'a' : last.who === speakerName('b', ps) ? 'b' : null;
  const asked = !!last && !!lastBy && /\?["”]?\s*$/.test(last.text);
  const add = [];
  const take = (key, of) => {
    const p = POOLS[key];
    // An ending that is only an action never follows an opener that already
    // ended on its own beat: two closing actions in a row.
    let pool2 = opened.beat ? p?.filter(e => (e.turns || []).length) : p;
    // …and never one that opens with the speaker of the last line, answering
    // their own line ("You laughed the longest." / "Whatever." — both Alejandro).
    const other = pool2?.filter(e => !e.turns?.length || !Array.isArray(e.turns[0]) || e.turns[0][0] !== lastBy);
    if (lastBy && other?.length) pool2 = other;
    const got = pool2?.length ? pickScript(state, pool2, ps, { ...facts, lastBy, of }) : null;
    if (got) { noteUse(state, got, ps); add.push(renderScript(got, ps, state)); }
  };
  if (ev.kind === 'gossip') { if (!entry.told) take('gossip-what', facts.sec || 'pull'); }
  // …and not when the opener already reacted to it in its beat ("Ryan doesn't have an answer").
  else if (asked && !opened.beat && !NO_ANSWER.has(ev.kind) && FEELING_Q.test(last.text)) take('answer-close', ANSWER_OF[close] || null);
  take(`${ev.kind}-close`, close === true ? null : close);
  if (!add.length) return opened;
  const act = text => ({ who: '', text, action: true });
  const lines = [...opened.lines, ...(opened.beat ? [act(opened.beat)] : [])];
  add.forEach((s, i) => { lines.push(...s.lines); if (s.beat && i < add.length - 1) lines.push(act(s.beat)); });
  return { id: [opened.id, ...add.map(s => s.id)].join('+'), stage: opened.stage, lines, beat: add[add.length - 1].beat };
}

// ── a conversation built from movements (pm/talk/) ────────────────────
// A talking kind is a PLAN: movements in order (open → why → answer → probe →
// turn → close), each a pool of whole exchanges of two to eight turns. Every
// movement opens its own subject and finishes its own exchange, so any plan's
// movements follow one another; the facts (and the ending the engine already
// decided, `end`) pick the entry, never the other way round. A featured scene
// plays the long plan, a short one the short plan, a note one line of staging.
// "slot?" is optional: played a little over half the time, never a repeat.
const OPTIONAL_P = 0.6;
// A movement a plan needs that found nothing to say: kept for tests/pm-talk (it should stay rare).
export const TALK_MISSES = [];
function planOf(talk, tier, facts) {
  const p = talk.plans[tier] || talk.plans.featured;
  if (typeof p[0] === 'string') return p;
  return (p.find(x => matches(x.when, facts)) || p[p.length - 1]).plan;
}
function talkScript(state, ev, talk) {
  const ps = castOf(ev);
  // A talk file may know more about its own kind than the shared facts do
  // (gossip: who the secret was WITH, as {x}).
  const facts = { ...factsFor(state, { ...ev, players: ps }), ...(talk.facts?.(state, ev) || {}) };
  const slots = { ...clipSlots(state, ev), ...(ev.after?.x ? { x: ev.after.x } : {}), ...(talk.slots?.(state, ev) || {}) };
  const tier = ev.tier || 'featured';
  // A fact that leads (a talk file's `leads`): when it is true, a movement
  // written for it is the only one that plays. A couple who rowed this
  // morning make up; they never have a cosy chat that forgets the row.
  const led = (talk.leads || []).filter(k => facts[k]);
  const morning = facts.phase === 'morning';
  const leading = all => {
    const pool = morning ? all.filter(e => !e.notMorning) : all;
    if (!led.length) return pool;
    const only = pool.filter(e => led.some(k => e.when?.[k]) && matches(e.when, facts));
    return only.length ? only : pool;
  };
  if (tier === 'note' && talk.notes?.length) {
    const e = pickScript(state, leading(talk.notes), ps, facts, { lead: false });
    if (e) { noteUse(state, e, ps); return { ...renderScript(e, ps, state, slots), tier }; }
  }
  const parts = [];
  for (const raw of planOf(talk, tier === 'note' ? 'short' : tier, facts)) {
    const opt = raw.endsWith('?');
    const slot = opt ? raw.slice(0, -1) : raw;
    if (opt && scriptRng(state)() >= OPTIONAL_P) continue;
    const pool = leading(talk.moves[slot] || []);
    if (!pool.length) { if (!opt) TALK_MISSES.push(`${ev.kind}.${slot}`); continue; }
    const e = pickScript(state, pool, ps, facts, { allowRepeat: !opt, lead: false });
    if (!e) { if (!opt) TALK_MISSES.push(`${ev.kind}.${slot}`); continue; }
    noteUse(state, e, ps);
    parts.push(renderScript(e, ps, state, slots));
  }
  if (!parts.length) return { ...renderScript(placeholder(ev.kind), ps, state), tier };
  // A plan that opens on dialogue (a short scene) still says where it is.
  if (!parts[0].stage && talk.stages?.length) {
    const st = pickScript(state, talk.stages, ps, facts, { lead: false });
    if (st) { noteUse(state, st, ps); parts[0] = { ...parts[0], stage: renderScript(st, ps, state, slots).stage }; }
  }
  const act = text => ({ who: '', text, action: true });
  const lines = [];
  parts.forEach((p, i) => {
    if (i && p.stage) lines.push(act(p.stage));
    lines.push(...p.lines);
    if (p.beat && i < parts.length - 1) lines.push(act(p.beat));
  });
  return { id: parts.map(p => p.id).join('+'), stage: parts[0].stage, lines, beat: parts[parts.length - 1].beat, tier };
}

/**
 * A scene built from several pools, one line each (an islander's
 * introduction): every part is picked from its own pool on the facts plus
 * the part's own value as `of`, and the turns run in order under the first
 * part's staging.
 */
function partsScript(state, ev) {
  const ps = ev.players;
  const facts = factsFor(state, { ...ev, players: ps });
  const picked = [];
  for (const [key, of] of ev.extra.parts) {
    const pool = POOLS[key];
    if (!pool?.length) continue;
    const e = pickScript(state, pool, ps, { ...facts, of });
    if (e) { noteUse(state, e, ps); picked.push(e); }
  }
  if (!picked.length) return renderScript(placeholder(ev.kind), ps, state);
  const merged = { id: picked.map(e => e.id).join('+'), stage: picked[0].stage,
    turns: picked.flatMap(e => e.turns || []), beat: picked[picked.length - 1].beat };
  // Where each part's lines start, so a screen can time its business to one
  // (the lie detector's light comes on at the reading, not before).
  let at = 0;
  const partAt = picked.map(e => { const s = at; at += (e.turns || []).length; return s; });
  return { ...renderScript(merged, ps, state), partAt };
}

/** Who {a}..{d} are. Snog Marry Pie keeps its answers in place even when one is missing. */
function castOf(ev) {
  if (ev.kind === 'snog-marry-pie') return [ev.players[0], ev.extra?.snog, ev.extra?.marry, ev.extra?.pie];
  return ev.players;
}

/** A replayed clip is quoted, so the villa reacts to what is actually on the screen. */
/** The line the reunion would quote from a hidden scene, words only (moments.js reunion). */
export const revealExchange = (state, id) => clipSlots(state, { players: [], extra: { revealed: id } }).quote || null;

function clipSlots(state, ev) {
  // The final dates' film: the footage's line, its day, and who else is in it,
  // all at once (pm/journey.js).
  if (ev.kind === 'journey-clip') {
    const got = { ...(ev.extra?.about ? { about: ev.extra.about } : {}), ...(ev.extra?.day != null ? { day: ev.extra.day } : {}) };
    const clip = (state.history || []).find(e => e.id === ev.extra?.clip);
    // Only the couple's own words: the film is theirs (season 41 quoted the
    // host, and another couple's islander, in two couples' films).
    const theirs = new Set(ev.players.slice(0, 2));
    const spoken = (clip?.script?.lines || []).filter(l => !l.action && theirs.has(l.who) && l.text.length > 12);
    // …about each other, too: a line naming a third islander is about them (season
    // read 2026-10-25: Kaz and Callum's "first chat" chapter played Callum on Amber).
    const others = players.map(p => p.name).filter(n => n && !theirs.has(n));
    const aboutUs = spoken.filter(l => !others.some(n => l.text.includes(n)));
    const line = (aboutUs.length ? aboutUs : spoken).sort((x, y) => y.text.length - x.text.length)[0];
    return line ? { ...got, quote: line.text, quoteWho: line.who } : got;
  }
  // A declaration's moment, and the day it was.
  if (ev.kind === 'speech') return ev.extra?.day != null ? { day: ev.extra.day } : {};
  if (ev.extra?.side) return { side: ev.extra.side };
  // An argument's third person: who the row is about (events.js argumentReasons).
  if (ev.extra?.about) return { about: ev.extra.about };
  // Icebreakers: the question frozen in the ice.
  if (ev.extra?.card != null) return { card: ICEBREAKER_CARDS[ev.extra.card] || '' };
  // A debrief's room: the boys' terrace or the girls' dressing room.
  if (ev.extra?.where) return { where: ev.extra.where };
  // Look Who's Talking reads out a beach-hut line: the quote travels with the scene.
  if (ev.extra?.quote) return { quote: ev.extra.quote, quoteWho: ev.extra.quoteWho };
  const id = ev.extra?.clip || ev.extra?.revealed;
  if (!id) return {};
  const clip = (state.history || []).find(e => e.id === id);
  // The line that gives the scene away, not its opener (season 31's reunion
  // gasped at "Can I have a word? Not here."): the longest thing the scene's
  // own islander said, so the one quoted is the one asked to explain.
  // …and not the longest either, which in a pull is the ask ("Can I ask you
  // something? You don't have to answer." — season 57): the last thing they
  // said that has any length to it, which is where a scene lands.
  const spoken = (clip?.script?.lines || []).filter(l => !l.action && l.who);
  const own = spoken.filter(l => l.who === (clip?.players || [])[0]);
  const pool = own.length ? own : spoken;
  // …with substance: a whole conversation (pm/talk/) ends on small talk ("Thanks
  // for the chat."), so a line with something in it comes first (season read, 2026-10-22).
  const line = [...pool].reverse().find(l => l.text.length >= 40) || [...pool].reverse().find(l => l.text.length >= 20)
    || [...pool].sort((x, y) => y.text.length - x.text.length)[0];
  if (!line) return {};
  // …with what it answered, when it is an answer: {exchange} is the two lines.
  // A question is played with its answer; anything else with what it answered.
  const at = spoken.indexOf(line);
  const next = spoken[at + 1], prev = spoken[at - 1];
  const exchange = /\?$/.test(line.text) && next && next.who !== line.who ? `${line.who}: "${line.text}" ${next.who}: "${next.text}"`
    : (prev && prev.who !== line.who ? `${prev.who}: "${prev.text}" ` : '') + `${line.who}: "${line.text}"`;
  return { quote: line.text, quoteWho: line.who, exchange };
}

// ── the voiceover ────────────────────────────────────────────────────
// About six times an episode, after a scene that aired: he knows what the
// public saw and nothing more. Words only — his own dice, no effect on play.
export const NARRATOR_PER_EPISODE = 6;
const NARRATOR_CHANCE = 0.09;    // spread over the whole day, not spent by breakfast (measured)
// The villa at its hottest gets the narrator's first call (user: "narration
// details for steamy things"): no dice, and three more a night than the rest.
const steamy = ev => (ev.kind === 'game-kiss' && ['crush', 'stir'].includes(ev.extra?.of))
  || (ev.kind === 'pull' && ev.extra?.heat === 'steamy') || ev.kind === 'hideaway' || ev.kind === 'snogger-kiss'
  || ev.kind === 'blow-slip' || (ev.kind === 'bed-share' && ev.extra?.of === 'kiss') || (ev.kind === 'tod-truth' && ev.extra?.of === 'named-coupled');
export function narratorFor(state, ev) {
  if (!ev.aired) return null;
  // A story's beat: he leads INTO it, saying its cause (lines/narrator-story.js).
  const lead = storyLead(state, ev);
  if (lead) return lead;
  const pool = NARRATOR[ev.kind];
  if (!pool?.length) return null;
  const said = ((state._narrated ||= {})[state.ep] ||= 0);
  const hot = steamy(ev);
  if (said >= NARRATOR_PER_EPISODE + (hot ? 3 : 0)) return null;
  if (!hot && scriptRng(state)() >= NARRATOR_CHANCE) return null;
  const ps = castOf(ev);
  // A voiceover line is heard at most twice a season, whoever it is about.
  const fresh = pool.filter(e => (usage(state)[e.id]?.eps.length || 0) < 2);
  const entry = pickScript(state, fresh, ps, factsFor(state, { ...ev, players: ps }), { allowRepeat: false });
  if (!entry) return null;
  noteUse(state, entry, ps);
  state._narrated[state.ep] = said + 1;
  return renderScript(entry, ps, state, { day: state.calendarDay || state.day || state.ep });
}

/**
 * The narrator's lead-in to a story beat (the real show: "After feeling played
 * by Cash, Charlie forms a personal best four-word sentence"). Once a story an
 * episode — its first beat that day — and once a person's group chat; at most
 * seven an episode. Said BEFORE the scene (`before`), so the viewer knows why
 * they are watching it.
 */
const STORY_LEADS_PER_EPISODE = 7;
function storyLead(state, ev) {
  const pool = NARRATOR_STORY[ev.kind];
  if (!pool?.length) return null;
  const key = ev.extra?.thread?.id || (ev.kind === 'group-chat' ? `gc:${ev.players[0]}` : null);
  if (!key) return null;
  const led = ((state._narrLed ||= {})[state.ep] ||= []);
  if (led.includes(key) || led.length >= STORY_LEADS_PER_EPISODE) return null;
  const ps = castOf(ev);
  const fresh = pool.filter(e => (usage(state)[e.id]?.eps.length || 0) < 2);
  const entry = pickScript(state, fresh, ps, factsFor(state, { ...ev, players: ps }), { allowRepeat: false });
  if (!entry) return null;
  noteUse(state, entry, ps);
  led.push(key);
  const slots = { ...(ev.extra?.x ? { x: ev.extra.x } : {}), ...(ev.extra?.about ? { about: ev.extra.about } : {}) };
  return { ...renderScript(entry, ps, state, slots), before: true };
}

/** The beach-hut cutaway: one speaker, straight to camera. */
export function hutFor(state, ev, who, stance) {
  const others = ev.players.filter(n => n !== who);
  const ps = [who, ...others];
  // role: 0 started the scene, 1 was on the receiving end, 2 was talked about.
  const facts = { ...factsFor(state, { ...ev, players: ps }), stance, family: familyOf(ev.kind),
    kind: ev.kind, role: ev.players.indexOf(who), withB: others.length > 0,
    // Going home tonight (moments.js dumpingScene): a leaver is never "relieved it wasn't me".
    leaving: !!state._leaving?.includes(who) };
  // Always a cutaway, once the engine has decided there is one: whether a
  // line was left in the pool must never decide anything (a skipped hut took
  // its approval with it, so the words could change a vote). A repeat is still
  // the last resort — the one heard longest ago (pickScript).
  // On dice of their own: which chat line played must not move which hut line
  // did (Look Who's Talking reads the huts; a longer chat pool changed a season).
  const entry = pickScript(state, HUT[stance], [who], facts, { rng: hutRng(state) });
  if (!entry) return null;
  noteUse(state, entry, [who]);
  return renderScript(entry, ps, state);
}

const FAMILIES = {
  flirting: ['pull', 'kiss', 'challenge-kiss', 'head-turned', 'date', 'steal', 'entrance', 'hideaway'],
  couple: ['chat', 'deep-chat', 'challenge-win', 'reassurance', 'love-said', 'love-hanging', 'close-off',
    'keeping-open', 'open-back-up', 'exclusive-ask', 'official-ask', 'ask-declined', 'declaration'],
  jealousy: ['jealous-confront', 'jealous-sulk', 'jealous-retaliate', 'argument', 'double-standard', 'torch',
    'overthinking', 'ick'],
  friendship: ['friendship', 'comedy', 'advice', 'solidarity', 'movie-night', 'snog-marry-pie', 'heart-rate',
    'notes', 'families'],
  gossip: ['gossip', 'confession', 'loyalty', 'told-confront', 'stirrer-confront'],
  dumping: ['recouple-pick', 'dump-buildup', 'dump-verdict', 'ballot-reveal', 'dump-reaction',
    'dump-goodbye', 'dump-fallout', 'steal'],
  finale: ['declaration', 'final-result', 'envelope', 'reveal', 'walk'],
  casa: ['casa-return', 'photos'],
};
export function familyOf(kind) {
  for (const [f, kinds] of Object.entries(FAMILIES)) if (kinds.includes(kind)) return f;
  return null;
}

/** Flatten a scene to plain text — for the text backlog, the audit and any reader that wants one string. */
export function scriptText(s) {
  if (!s) return '';
  return [s.stage, ...s.lines.map(l => l.action ? l.text : `${l.who}: "${l.text}"`), s.beat].filter(Boolean).join('\n');
}
