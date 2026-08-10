// ══════════════════════════════════════════════════════════════════════
// bb-events/_read.js — how a house event reads the world before it fires
// ══════════════════════════════════════════════════════════════════════
//
// Events change state through the scheduler's `api`. This is the other half:
// everything they may READ. Nothing here mutates.
//
// Why it exists. A Big Brother event that consults only stats and an archetype
// produces the same beat in week one and week nine, between strangers and
// between people who have already betrayed each other. This codebase's Total
// Drama side does not work that way and neither should this: the same nomination
// lands differently depending on whether those two were allies, whether the house
// can SEE they were allies, who already suspects whom, and what was promised
// four days ago and not honoured.
//
// The layers available, roughly in order of how much they change a beat:
//
//   real bond      getBond      — what two people actually are to each other
//   perceived bond getPerceivedBond — what the HOUSE believes they are, which is
//                  what people act on and is often wrong
//   memory         who remembers what was done to them, and how hard
//   suspicion      who is watching whom
//   targets        who has privately decided to come for whom
//   alliances      the standing structure a betrayal breaks
//   threat         earned standing — comp record, not just raw stats
//   romance        showmances, and whether a pairing is even plausible
//   history        what has already fired, so a season does not repeat itself
//
// Bond scale is -10..+10 throughout, matching the rest of the engine.

import { gs, seasonConfig } from '../core.js';
import { getBond, getPerceivedBond } from '../bonds.js';
import { pStats, romanticCompat } from '../players.js';
import { houseEventState, playerArchetype } from '../bb/house-events.js';
import { bbThreat } from '../bb/strategy.js';
// The shared strategic substrate. Big Brother reads the SAME stores Total Drama
// does — one set of relationships, memories and reputations per character, so a
// houseguest is not a different person from the same name on the island.
import { memoriesAbout, strategicMemoryScore, strongestStrategicMemory } from '../strategy-memory.js';
import { relationshipDecisionProfile, hasRelationshipDimensions } from '../relationships.js';
import { strategicReputation } from '../reputation.js';
import { getIntentions } from '../intentions.js';

// ── what actually happened in this act ────────────────────────────────
//
// The scheduler hands events `{ act, hoh, nominees, vetoWinner, week, beat }`
// and nothing act-specific: who the pawn was, who the veto saved, who went up as
// the replacement. Those live on the act object, which events never see.
//
// All of it is recoverable from `week`, which IS passed and is fully populated
// by the time beats run — the plan carries target/pawn/backdoor, and the veto's
// work is the difference between the two nominee lists. Deriving it here means
// the library does not sit blocked on a scheduler change, and the `ctx.?? `
// fallbacks mean it starts using the real fields for free if they are ever added.
export function actFacts(ctx = {}) {
  const plan = ctx.week?.plan || {};
  const initial = ctx.week?.initialNominees || [];
  const final = ctx.week?.finalNominees || [];
  // ── WHO THE VETO TOOK OFF ──
  //
  // This diffed the two nominee lists and called the difference the veto's
  // work: a name left the block, so the veto took it off. That is wrong on
  // every week where something ELSE moved the block. A Coup d'Etat replaces
  // both nominees outright and a detonated Diamond takes somebody down on its
  // own holder's authority, and on those weeks the diff handed the veto's
  // fallout events a person the veto never touched — so the houseguest who
  // held the veto and DECLINED to use it was told, in front of the house,
  // that they were now a person who makes moves.
  //
  // The ceremony records what it actually did now, so prefer that and fall
  // back to the diff only for a week that has no veto ceremony to ask.
  const w = ctx.week || {};
  const vetoRecorded = w.vetoUsed !== undefined;
  // Names that came off the block by some other authority. Subtracted from the
  // fallback so an unrecorded week cannot make the same mistake either.
  const notTheVeto = new Set([
    ...(w.coup?.removed || []),
    ...(w.diamondDetonation?.saved ? [w.diamondDetonation.saved] : []),
  ]);
  const byDiff = final.length
    ? initial.find(n => !final.includes(n) && !notTheVeto.has(n)) : undefined;
  const saved = ctx.saved
    ?? (vetoRecorded ? (w.vetoUsed ? w.vetoSaved : null) : byDiff)
    ?? null;
  const replacement = ctx.replacement
    ?? (vetoRecorded ? (w.vetoUsed ? w.vetoReplacement : null)
      : (initial.length ? final.find(n => !initial.includes(n)) : undefined))
    ?? null;
  return {
    target: ctx.target ?? plan.target ?? null,
    pawn: ctx.pawn ?? plan.pawn ?? null,
    backdoorTarget: ctx.backdoorTarget ?? plan.backdoorTarget ?? null,
    saved,
    replacement,
    used: ctx.used ?? !!saved,
    initialNominees: initial,
    finalNominees: final,
  };
}

// ── relationships ─────────────────────────────────────────────────────

export const bond = (a, b) => (a && b && a !== b ? getBond(a, b) : 0);

/** What the house THINKS these two are — the number people actually act on. */
export const perceived = (a, b) => (a && b && a !== b ? getPerceivedBond(a, b) : 0);

/**
 * How wrong the house is about a pair. Large and positive means a closeness
 * nobody has spotted — the definition of a working secret alliance, and the
 * thing a blindside is built out of.
 */
export const hidden = (a, b) => bond(a, b) - perceived(a, b);

/**
 * How over-featured somebody already is, relative to the rest of the pool.
 *
 * Zero is an average share of the week; positive means they have been on
 * screen more than their share, negative less. Used to break ties in the cast
 * pickers so the same well-connected houseguest does not carry every event.
 */
function screenShare(name, pool) {
  const others = (pool || []).filter(Boolean);
  if (others.length < 2) return 0;
  const counts = others.map(beatsInvolving);
  const average = counts.reduce((sum, n) => sum + n, 0) / counts.length;
  if (average <= 0) return 0;
  return (beatsInvolving(name) - average) / average;
}

/**
 * Enough to break a near-tie, not enough to overrule a real relationship.
 *
 * Bonds run -10 to 10. Somebody who has had twice their share of the week
 * carries a penalty of about one and a half points, so a genuinely closest
 * ally still wins — but between two people the subject feels much the same
 * about, the one who has not been on screen gets the scene.
 */
const FAIR_WEIGHT = 1.5;

/**
 * The pickers used to sort on bond alone, which meant they returned the same
 * name for the same subject every single time. One well-connected houseguest
 * ended up in 142 beats of a week against another's 35 — the feed read as a
 * show about one person.
 */
export function closestTo(name, pool) {
  const options = [...(pool || [])].filter(n => n && n !== name);
  return options
    .sort((x, y) => (bond(name, y) - FAIR_WEIGHT * screenShare(y, options))
                  - (bond(name, x) - FAIR_WEIGHT * screenShare(x, options)))[0] || null;
}

export function furthestFrom(name, pool) {
  const options = [...(pool || [])].filter(n => n && n !== name);
  return options
    .sort((x, y) => (bond(name, x) + FAIR_WEIGHT * screenShare(x, options))
                  - (bond(name, y) + FAIR_WEIGHT * screenShare(y, options)))[0] || null;
}

/** Trusted enough that a betrayal would actually register as one. */
export const trusts = (a, b, threshold = 3) => bond(a, b) >= threshold;

export const dislikes = (a, b, threshold = -3) => bond(a, b) <= threshold;

// ── alliances ─────────────────────────────────────────────────────────

export function alliancesOf(name) {
  return (gs.namedAlliances || []).filter(al => !al.dissolved && (al.members || []).includes(name));
}

export const sharesAlliance = (a, b) =>
  alliancesOf(a).some(al => (al.members || []).includes(b));

/**
 * The people someone is effectively aligned with, whether or not it is written
 * down anywhere.
 *
 * Big Brother does not create `gs.namedAlliances` yet — the lifecycle adapter is
 * still to come — so anything that waits for a formal alliance waits forever.
 * A pair who trust each other this much are an alliance in every sense that
 * matters to a houseguest deciding who to betray, so read that instead, and
 * prefer the real thing wherever it exists.
 */
export function deFactoAllies(name, pool, threshold = 4) {
  const formal = alliancesOf(name).flatMap(al => (al.members || []).filter(m => m !== name));
  if (formal.length) return formal.filter(n => (pool || []).includes(n));
  return (pool || []).filter(n => n !== name && bond(name, n) >= threshold);
}

export const isAligned = (a, b, pool) => sharesAlliance(a, b) || deFactoAllies(a, pool || []).includes(b);

// ── relationship dimensions (canonical, shared with Total Drama) ──────
//
// A single bond number collapses everything into one axis. The shared model
// keeps them apart, and the distinctions matter here: you can trust someone you
// resent, fear someone you respect, and owe someone you dislike. A veto
// abandonment is an obligation broken; a blindside is trust broken; a rumour
// manufactures fear. Reading the right dimension is what stops every Big Brother
// beat feeling like the same beat at different volumes.

export function profile(a, b) {
  if (!a || !b || a === b) return null;
  try { return relationshipDecisionProfile(a, b); } catch { return null; }
}

const _dim = (a, b, key) => profile(a, b)?.[key] ?? 0;

export const trustOf = (a, b) => _dim(a, b, 'trust');
export const resentmentOf = (a, b) => _dim(a, b, 'resentment');
export const obligationOf = (a, b) => _dim(a, b, 'obligation');
export const fearOf = (a, b) => _dim(a, b, 'fear');
export const respectOf = (a, b) => _dim(a, b, 'strategicRespect');
export const warmthOf = (a, b) => _dim(a, b, 'warmth');
/** How dangerous `a` finds `b` — respect plus fear, the reason people nominate. */
export const dangerOf = (a, b) => _dim(a, b, 'strategicDanger');

export const hasDimensions = (a, b) => {
  try { return hasRelationshipDimensions(a, b); } catch { return false; }
};

// ── memory (canonical, shared with Total Drama) ───────────────────────
//
// gs.strategicMemories is the truth, and since the house-event api migrated to
// rememberStrategy it is the ONLY truth — gs.bb.house no longer keeps a memory
// store at all. The receipt reads below are now dead paths kept as guards, so a
// half-migrated save or an older snapshot degrades instead of throwing.

const _receipt = observer => houseEventState().memories?.[observer] || [];

export function memoriesOf(observer) {
  if (!observer) return [];
  const shared = gs.strategicMemories?.[observer];
  if (Array.isArray(shared) && shared.length) return shared;
  return _receipt(observer);
}

/** Everything `observer` is still carrying about `subject`, as one number. */
export function grudge(observer, subject) {
  if (!observer || !subject) return 0;
  try {
    const score = strategicMemoryScore(observer, subject);
    if (score) return score;
  } catch { /* fall through to the receipt */ }
  return _receipt(observer)
    .filter(m => m.subject === subject)
    .reduce((sum, m) => sum + (m.strength || 1), 0);
}

export function remembers(observer, subject, type) {
  if (!observer || !subject) return false;
  try {
    if (memoriesAbout(observer, subject).some(m => m.type === type)) return true;
  } catch { /* fall through */ }
  return _receipt(observer).some(m => m.subject === subject && m.type === type);
}

/** The single thing `observer` most holds against `subject`, if anything. */
export function worstMemory(observer, subject) {
  try {
    const m = strongestStrategicMemory(observer, subject);
    if (m) return m;
  } catch { /* fall through */ }
  return _receipt(observer).filter(m => m.subject === subject)
    .sort((a, b) => (b.strength || 1) - (a.strength || 1))[0] || null;
}

/** Standing earned across the season — and, for a returnee, across seasons. */
export function reputation(name) {
  try { return strategicReputation(name) || null; } catch { return null; }
}

/**
 * A promise made and recorded — the raw material for it being broken.
 *
 * `before` matters more than it looks. A promise made during THIS ceremony
 * cannot be what makes this ceremony a betrayal: a pawn told "you're only a
 * pawn" is already sitting on the block, and treating that as a broken promise
 * turns every reassurance into an instant blindside. Pass the current week to
 * count only promises that predate it.
 */
export const wasPromised = (observer, subject, before = null) =>
  memoriesOf(observer).some(m =>
    m.subject === subject && m.type === 'promise' && (before == null || memoryWeek(m) < before));

/**
 * When a memory was formed.
 *
 * The canonical store stamps `ep`; the old Big Brother receipt stamped `week`.
 * Reading only one of them silently reintroduces the bug where a promise made
 * during a ceremony counts as a betrayal by that same ceremony — every
 * reassured pawn instantly blindsided — so read whichever is present.
 */
export const memoryWeek = m => m?.ep ?? m?.week ?? 0;

export const suspicionOf = (observer, subject) =>
  houseEventState().suspicion?.[`${observer}→${subject}`] || 0;

/**
 * Who, if anyone, this player has privately decided to come after.
 *
 * Shared intentions are the canonical answer. Reading them is deliberately
 * defensive: formIntentions() is still Total Drama-shaped (it branches on
 * gs.isMerged, which a house does not have), so this never CREATES a plan — it
 * only reads one that already exists, and falls back to the BB receipt until
 * Codex's intentions adapter lands.
 */
export function targetOf(name) {
  if (!name) return null;
  try {
    const plan = getIntentions(name);
    const first = plan?.targets?.[0];
    if (first) return first;
  } catch { /* fall through to the receipt */ }
  return houseEventState().targets?.[name]?.target || null;
}

/** Everyone this player is planning against, not just the first name. */
export function targetsOf(name) {
  const all = [];
  try { all.push(...(getIntentions(name)?.targets || [])); } catch { /* ignore */ }
  const receipt = houseEventState().targets?.[name]?.target;
  if (!all.length && receipt) all.push(receipt);
  return all;
}

export const isHunting = (hunter, prey) => targetOf(hunter) === prey;

/** Everyone currently gunning for this player. */
export const huntedBy = (name, pool) =>
  (pool || []).filter(other => other !== name && isHunting(other, name));

// ── standing ──────────────────────────────────────────────────────────

/**
 * Composite threat, from the Big Brother side.
 *
 * Deliberately NOT players.threatScore: the spec flags it as reusable in formula
 * but unsafe to call headlessly here, because it reads browser globals and a
 * Total Drama-shaped challenge record that a house never fills in. bbThreat
 * already blends the shared stats and bonds with HOH and veto record, which is
 * the Big Brother evidence. When Codex's threat adapter lands this becomes a
 * one-line swap.
 */
export const threat = name => { try { return bbThreat(name) || 0; } catch { return 0; } };

export function biggestThreat(pool) {
  return [...(pool || [])].sort((a, b) => threat(b) - threat(a))[0] || null;
}

/** Popularity is the audience's read, which is not the house's read. */
export const popularity = name => (gs.popularity || {})[name] || 0;

// ── romance ───────────────────────────────────────────────────────────

export const romanceOn = () => seasonConfig.romance !== 'disabled';

export function showmanceOf(name) {
  const active = (gs.showmances || []).filter(sh => sh.phase !== 'broken-up' && !sh.broken);
  const match = active.find(sh => (sh.players || []).includes(name));
  return match ? (match.players || []).find(n => n !== name) || null : null;
}

/**
 * Who someone has a spark with, formal showmance or not.
 *
 * `api.showmance` records a romantic SPARK, and Big Brother has no showmance
 * progression pipeline to mature one into `gs.showmances` — so anything reading
 * only showmances never sees a single couple. A spark is a real attachment the
 * house can see; read both, preferring the established one.
 */
export function romanceOf(name) {
  const established = showmanceOf(name);
  if (established) return established;
  const spark = (gs.romanticSparks || []).find(s => !s.broken && (s.players || []).includes(name));
  return spark ? (spark.players || []).find(n => n !== name) || null : null;
}

export const couldRomance = (a, b) =>
  romanceOn() && !!a && !!b && a !== b && !showmanceOf(a) && !showmanceOf(b) && romanticCompat(a, b);

// ── event history ─────────────────────────────────────────────────────

export const history = () => houseEventState().eventHistory || [];

export const hasFired = eventId => history().some(h => h.eventId === eventId);

export const firedThisWeek = (eventId, weekNum) =>
  history().some(h => h.eventId === eventId && h.week === weekNum);

/**
 * How many times this player has already been at the centre of a beat.
 *
 * Counted, not scanned. This used to filter the entire event history on every
 * call, and it is called from roughly seventy places across the event library —
 * almost all of them inside weight(), which runs for all ninety-six events on
 * every one of the ~130 beats in a week. That made the cost of a week
 * proportional to everything that had ever happened in the season: measured,
 * episode one took 1.1s and episode six took 5.9s, with the same number of
 * beats and FEWER houseguests. By the end of a season it is unusable.
 *
 * The tally is derived state, so it is rebuilt whenever it does not match the
 * history it claims to summarise — a loaded save, or anything that appends
 * without going through recordBeat().
 */
function beatCounts() {
  const state = houseEventState();
  const hist = state.eventHistory || [];
  if (!state._beatCounts || state._beatCountsAt !== hist.length) {
    const counts = {};
    for (const entry of hist) {
      for (const name of entry.players || []) counts[name] = (counts[name] || 0) + 1;
    }
    state._beatCounts = counts;
    state._beatCountsAt = hist.length;
  }
  return state._beatCounts;
}

export const beatsInvolving = name => beatCounts()[name] || 0;

/**
 * How much of this week belongs to this houseguest.
 *
 * 0 for somebody nobody is playing against, up to 0.45 for the two roles the
 * episode is actually about. Used to bias casting, not to gate it — a safe
 * houseguest still gets scenes, they just stop being the first name reached for
 * every time the library wants somebody who has been quiet.
 */
// Recomputed once per BEAT, not once per comparison. spotlightOrder runs this
// inside a sort for every casting pool of every event weight() the scheduler
// consults, and storyPull underneath it loops the house calling grudge() — a
// walk of the memory store. Profiled, the stack was ~40% of a whole season:
// grudge 13.6%, the weight itself 8.9%, the comparator 6.3%, the feud loop
// 6.1%. Nothing this reads moves WITHIN a beat, so the beat count is the
// right cache stamp — the same one beatsInvolving already keys on.
let _spotAt = -1;
let _spotMap = new Map();

export function spotlightWeight(name) {
  if (!name) return 0;
  const stamp = (houseEventState().eventHistory || []).length;
  if (_spotAt !== stamp) { _spotAt = stamp; _spotMap = new Map(); }
  const hit = _spotMap.get(name);
  if (hit !== undefined) return hit;
  const value = _spotlightWeightRaw(name);
  _spotMap.set(name, value);
  return value;
}

function _spotlightWeightRaw(name) {
  const s = gs.bb?.spotlight;
  let weight = 0;
  if (s) {
    if (name === s.hoh || (s.nominees || []).includes(name)) weight = 0.45;
    else if (name === s.vetoWinner) weight = 0.3;
    else if ((s.vetoPlayers || []).includes(name)) weight = 0.2;
  }
  return Math.min(0.68, weight + storyPull(name) + screenPresence(name) * 0.3);
}

/**
 * How much television this person is, before anything happens to them.
 *
 * The edit-analysis community separates two axes, and this file had collapsed
 * them into one. RATING is what kind of edit somebody gets — invisible, under
 * the radar, middle of the road, complex personality, over the top — and
 * VISIBILITY is how much of the episode they occupy. The over-the-top players
 * are described as "usually very present" whatever their position, and the
 * under-the-radar ones get "at most a sentence or two".
 *
 * Measured before this existed, the house had the axis exactly backwards: a
 * floater averaged 35 beats a week and a villain 30, a hothead 30. The three
 * loudest archetypes in the game were the three quietest on screen. That is the
 * least-seen-first casting helper doing its job too well — a loud houseguest
 * earns beats in dramatic scenes and is then benched in favour of whoever has
 * been sitting quietly, week after week, until the cast flattens into one
 * texture.
 *
 * Deliberately not enormous. Edit analysis is clear that the highest visibility
 * belongs to one-note characters rather than to the people who go furthest, and
 * a house where the hothead is in everything is as wrong as one where they are
 * in nothing.
 */
export function screenPresence(name) {
  const stats = pStats(name);
  const arch = playerArchetype(name) || '';
  // Over the top: loud, reactive, entertaining, not necessarily good.
  const OTT = { hothead: 1, 'chaos-agent': 0.95, villain: 0.85, showmancer: 0.8, wildcard: 0.7 };
  // Complex personality: the game is legible through them.
  const CP = { mastermind: 0.7, schemer: 0.65, 'perceptive-player': 0.6, 'social-butterfly': 0.6 };
  // Under the radar, by design and by temperament.
  const UTR = { floater: -0.5, goat: -0.4, 'loyal-soldier': -0.15 };
  const base = OTT[arch] ?? CP[arch] ?? UTR[arch] ?? 0.2;
  // A short fuse is television; so is nerve. Being agreeable is not.
  const volatility = ((10 - stats.temperament) * 0.05 + stats.boldness * 0.04
    + stats.social * 0.02) / 1.1;
  return Math.max(0, Math.min(1, (base + volatility) / 2));
}

/**
 * How much of the week somebody is worth for reasons that are not the game.
 *
 * Position is only half of screen time. A showmance is on television whether or
 * not either of them is in danger; two people who cannot be in the same room
 * are on television; so is the person the whole house has decided to go after.
 * Weighting purely by power and the block gives a correct but airless episode
 * where the only story is the block, and the couple nobody has nominated
 * quietly disappears for a fortnight.
 *
 * Capped in aggregate, so a safe houseguest in a showmance AND a feud reaches
 * about a nominee's pull — which is right. That person is the episode.
 */
export function storyPull(name) {
  const house = gs.activePlayers || [];
  let pull = 0;

  // A couple is a storyline the moment it exists.
  if ((gs.showmances || []).some(sh => sh.phase !== 'broken-up'
    && (sh.players || []).includes(name))) pull += 0.12;

  // Somebody the house has turned on. Being hunted is a story even when the
  // week's power has not got to you yet.
  const hunters = house.filter(other => other !== name && targetOf(other) === name).length;
  if (hunters >= 2) pull += 0.1;
  else if (hunters === 1) pull += 0.06;

  // And an open feud: a grudge that runs both ways is two people who cannot be
  // in a room together, which is the cheapest television there is.
  const feud = house.some(other => other !== name
    && grudge(name, other) >= 3 && grudge(other, name) >= 3);
  if (feud) pull += 0.12;

  return pull;
}

/**
 * Casting order: least-seen first, weighted by who the week is about.
 *
 * Every event file had its own copy of "sort by fewest beats", which spreads
 * the spotlight evenly across fourteen people and flattens the one hierarchy
 * the format guarantees. Measured, a nominee carried 1.5x the beats of somebody
 * safe — present, but nowhere near what an episode of this show looks like,
 * where the block and the power are most of the hour.
 *
 * Discounting the count rather than adding a bonus keeps it proportional: a
 * nominee two hundred beats into a season still sorts ahead of a floater on a
 * hundred and forty, which is the whole point late in the game when everybody's
 * totals are large.
 */
export function spotlightOrder(pool) {
  // Decorate once, then sort on lookups — the comparator itself must not be
  // the place the weights get computed.
  const keyed = new Map();
  for (const n of pool) {
    if (!keyed.has(n)) keyed.set(n, beatsInvolving(n) * (1 - spotlightWeight(n)));
  }
  return [...pool].sort((a, b) => keyed.get(a) - keyed.get(b));
}

// ── archetype behaviour, mirroring the franchise rules ────────────────

const VILLAINOUS = ['villain', 'mastermind', 'schemer'];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];

export const archetype = playerArchetype;
export const isVillainous = name => VILLAINOUS.includes(playerArchetype(name));
export const isNice = name => NICE.includes(playerArchetype(name));

/**
 * Villains scheme freely, nice archetypes never, and neutrals only when they are
 * both calculating and disloyal enough. Same rule the Total Drama side uses.
 */
export function willScheme(name) {
  if (isVillainous(name)) return true;
  if (isNice(name)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ── scoring helpers ───────────────────────────────────────────────────

/** Clamp a computed weight into a sane band so no event can dominate a beat. */
export const band = (value, max = 14) => Math.max(0, Math.min(max, value));

/** Convert a -10..+10 bond into a 0..1 factor. */
export const bondFactor = value => Math.max(0, Math.min(1, (value + 10) / 20));

/**
 * The argument a nominee actually makes.
 *
 * The campaign events described somebody campaigning — "makes the only argument
 * that matters", "lays out the numbers", "runs out of argument" — without ever
 * saying what the argument WAS. That is the whole of this game. Everybody knows
 * a nominee is asking to stay; the only interesting part is what they say to
 * get there, and a card that talks around it is a card about nothing.
 *
 * Every line is a real read of the board from the VOTER's point of view,
 * because that is the only argument that works: not "keep me", but "keeping me
 * is better for you than keeping them". Whichever is most true gets said.
 */
export function campaignArgument(nominee, voter, opponent) {
  const recOf = n => (gs.bb?.stats?.[n] || {});
  const compsOf = n => (recOf(n).hohWins || 0) + (recOf(n).vetoWins || 0) + (recOf(n).blockBusterWins || 0);
  const theirComps = opponent ? compsOf(opponent) : 0;
  const myComps = compsOf(nominee);

  // Is the person they would keep instead aligned with people this voter is not?
  const theirAllies = opponent ? (gs.namedAlliances || []).filter(a => a.active !== false
    && (a.members || []).includes(opponent) && !(a.members || []).includes(voter)) : [];
  // Is that person already coming for this voter?
  const huntsVoter = !!opponent && targetsOf(opponent).includes(voter);
  // Has the nominee ever written this voter's name down?
  const everVoted = (gs.episodeHistory || []).some(h => (h.votingLog || [])
    .some(b => b.voter === nominee && b.voted === voter));

  if (huntsVoter) {
    return `"Every time you leave the room, ${opponent} brings up your name. I am not the one you need to worry about."`;
  }
  if (theirAllies.length) {
    return `"${opponent} is in ${theirAllies[0].name} and you are not. Keep ${opponent} and you are voting for a group that has no seat for you."`;
  }
  if (theirComps >= 2 && theirComps > myComps) {
    return `"${opponent} has won ${theirComps} competitions. I have won ${myComps}. One of us becomes your problem when the numbers get smaller, and it is not me."`;
  }
  if (opponent && threat(opponent) > threat(nominee) + 1) {
    return `"Look at who is left. ${opponent} beats you at the end. I do not, and I think we both know it. Take the one you can beat."`;
  }
  if (!everVoted) {
    return `"I have never written your name down. Not once. ${opponent ? `${opponent} cannot say the same` : 'The other side cannot say that'} and I can."`;
  }
  if (bond(nominee, voter) >= 2) {
    return `"You do not owe me anything. But you need a number next week, and I will be one for you. ${opponent ? `${opponent} will not` : 'The other side will not'}."`;
  }
  return `"I am not asking you to like me. I am asking you to count. Without me you are one short of everything you want to do."`;
}

export { pStats };
