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
import { pStats, threatScore, romanticCompat } from '../players.js';
import { houseEventState, playerArchetype } from '../bb/house-events.js';

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
  // The veto took someone off exactly when a name left the block between the
  // ceremony and the final line-up; whoever replaced them arrived the same way.
  const saved = ctx.saved ?? (final.length ? initial.find(n => !final.includes(n)) : undefined) ?? null;
  const replacement = ctx.replacement ?? (initial.length ? final.find(n => !initial.includes(n)) : undefined) ?? null;
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

export function closestTo(name, pool) {
  return [...(pool || [])].filter(n => n && n !== name)
    .sort((x, y) => bond(name, y) - bond(name, x))[0] || null;
}

export function furthestFrom(name, pool) {
  return [...(pool || [])].filter(n => n && n !== name)
    .sort((x, y) => bond(name, x) - bond(name, y))[0] || null;
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

// ── house memory (Codex's state, read-only) ───────────────────────────

export function memoriesOf(observer) {
  return houseEventState().memories?.[observer] || [];
}

/** Everything `observer` is still carrying about `subject`, strongest first. */
export function grudge(observer, subject) {
  return memoriesOf(observer)
    .filter(m => m.subject === subject)
    .reduce((sum, m) => sum + (m.strength || 1), 0);
}

export const remembers = (observer, subject, type) =>
  memoriesOf(observer).some(m => m.subject === subject && m.type === type);

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
    m.subject === subject && m.type === 'promise' && (before == null || (m.week || 0) < before));

export const suspicionOf = (observer, subject) =>
  houseEventState().suspicion?.[`${observer}→${subject}`] || 0;

/** Who, if anyone, this player has privately decided to come after. */
export const targetOf = name => houseEventState().targets?.[name]?.target || null;

export const isHunting = (hunter, prey) => targetOf(hunter) === prey;

/** Everyone currently gunning for this player. */
export const huntedBy = (name, pool) =>
  (pool || []).filter(other => other !== name && isHunting(other, name));

// ── standing ──────────────────────────────────────────────────────────

export const threat = name => { try { return threatScore(name) || 0; } catch { return 0; } };

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

export const couldRomance = (a, b) =>
  romanceOn() && !!a && !!b && a !== b && !showmanceOf(a) && !showmanceOf(b) && romanticCompat(a, b);

// ── event history ─────────────────────────────────────────────────────

export const history = () => houseEventState().eventHistory || [];

export const hasFired = eventId => history().some(h => h.eventId === eventId);

export const firedThisWeek = (eventId, weekNum) =>
  history().some(h => h.eventId === eventId && h.week === weekNum);

/** How many times this player has already been at the centre of a beat. */
export const beatsInvolving = name =>
  history().filter(h => (h.players || []).includes(name)).length;

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

export { pStats };
